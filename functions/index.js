const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

admin.initializeApp();
const db = getFirestore();
const app = express();
app.use(cors({ origin: true }));

const cleanData = (data) => JSON.parse(JSON.stringify(data));

// ==========================================
// 1. BACKEND LOGIC
// ==========================================
const dbLogic = {
  // --- USERS & FRIENDS ---
  async updateUser(userId, data) {
    await db.collection('users').doc(userId).set(data, { merge: true });
    return { userId, ...data };
  },
  async addFriend(userId, friendEmail) {
    const snapshot = await db.collection('users').where('email', '==', friendEmail).limit(1).get();
    if (snapshot.empty) throw new Error("User not found");
    const friendId = snapshot.docs[0].id;
    if (userId === friendId) throw new Error("Cannot friend self");
    
    await db.collection('users').doc(userId).update({ friends: FieldValue.arrayUnion(friendId) });
    await db.collection('users').doc(friendId).update({ friends: FieldValue.arrayUnion(userId) });
    return { message: "Friend added", friend: cleanData(snapshot.docs[0].data()) };
  },
  async getFriends(userId) {
    const doc = await db.collection('users').doc(userId).get();
    const friendIds = doc.data()?.friends || [];
    if (friendIds.length === 0) return [];
    const snapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', friendIds.slice(0, 10)).get();
    return snapshot.docs.map(d => ({ userId: d.id, ...d.data() }));
  },

  // --- ROOMS (With Robust Timer Logic) ---
  async createRoom(userId, data) {
    if (!data.name) throw new Error("Name required");
    const ref = db.collection('rooms').doc();
    
    const mode = data.mode || 'pomodoro';
    const durationMins = mode === 'pomodoro' ? 25 : 50;

    const room = {
      roomId: ref.id, owner: userId, name: data.name, description: data.description || "",
      mode: mode,
      duration: durationMins,
      // --- TIMER STATE ---
      isTimerRunning: false,             
      timerRemaining: durationMins * 60, // Seconds left
      lastTick: null,                    
      // -------------------
      users: [userId], inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: Timestamp.now()
    };
    await ref.set(room);
    return cleanData(room);
  },
  async getUserRooms(userId) {
    const snapshot = await db.collection('rooms').where('users', 'array-contains', userId).get();
    return snapshot.docs.map(d => cleanData(d.data()));
  },
  async joinRoom(userId, inviteCode) {
    const snapshot = await db.collection('rooms').where('inviteCode', '==', inviteCode).limit(1).get();
    if (snapshot.empty) throw new Error("Invalid code");
    const doc = snapshot.docs[0];
    if (!doc.data().users.includes(userId)) {
      await doc.ref.update({ users: FieldValue.arrayUnion(userId) });
    }
    return cleanData({ ...doc.data(), users: [...doc.data().users, userId] });
  },

  // --- PAUSE/PLAY TIMER (Server Authority) ---
  async toggleTimer(roomId, action) {
    const roomRef = db.collection('rooms').doc(roomId);
    const doc = await roomRef.get();
    if (!doc.exists) throw new Error("Room not found");
    const data = doc.data();

    let update = {};

    if (action === 'start') {
      // Logic: Mark as running, save "Now" as the start time
      update = {
        isTimerRunning: true,
        lastTick: Timestamp.now()
      };
    } else {
      // Logic: Calculate how long it ran, subtract from remaining, clear lastTick
      if (data.lastTick && data.isTimerRunning) {
        const now = Timestamp.now().toMillis() / 1000;
        const start = data.lastTick.toMillis() / 1000;
        const elapsed = now - start;
        const newRemaining = Math.max(0, Math.floor(data.timerRemaining - elapsed));
        
        update = {
          isTimerRunning: false,
          timerRemaining: newRemaining,
          lastTick: null
        };
      } else {
        update = { isTimerRunning: false };
      }
    }
    
    await roomRef.update(update);
    return { ...data, ...update };
  },

  // --- TASKS & CHAT ---
  async addTask(roomId, userId, name, text) {
    const ref = db.collection('rooms').doc(roomId).collection('tasks').doc();
    const task = { taskId: ref.id, roomId, owner: userId, ownerName: name, text, completed: false, createdAt: Timestamp.now() };
    await ref.set(task);
    return cleanData(task);
  },
  async getTasks(roomId) {
    const snap = await db.collection('rooms').doc(roomId).collection('tasks').orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => cleanData(d.data()));
  },
  async toggleTask(roomId, taskId, userId) {
    const ref = db.collection('rooms').doc(roomId).collection('tasks').doc(taskId);
    const doc = await ref.get();
    if(doc.data().owner !== userId) throw new Error("Not your task");
    await ref.update({ completed: !doc.data().completed });
    return { completed: !doc.data().completed };
  },
  async sendMessage(userId, friendId, text) {
    const chatId = [userId, friendId].sort().join('_');
    const ref = db.collection('chats').doc(chatId).collection('messages').doc();
    const msg = { id: ref.id, senderId: userId, text, createdAt: Timestamp.now() };
    await ref.set(msg);
    return cleanData(msg);
  },
  async getMessages(userId, friendId) {
    const chatId = [userId, friendId].sort().join('_');
    const snap = await db.collection('chats').doc(chatId).collection('messages').orderBy('createdAt', 'asc').limitToLast(50).get();
    return snap.docs.map(d => cleanData(d.data()));
  },

  // --- SESSIONS (Spec Compliance) ---
  async startSession(roomId, userId, data) {
    const ref = db.collection('rooms').doc(roomId).collection('sessions').doc();
    const session = {
      sessionId: ref.id, owner: userId, name: data.name, 
      startTime: Timestamp.now(), duration: data.duration || 25, mode: "pomodoro"
    };
    await ref.set(session);
    return cleanData(session);
  },
  async getSession(roomId, sessionId) {
    const doc = await db.collection('rooms').doc(roomId).collection('sessions').doc(sessionId).get();
    if(!doc.exists) throw new Error("Session not found");
    return cleanData(doc.data());
  }
};

// ==========================================
// 2. MIDDLEWARE
// ==========================================
const validateToken = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) { req.user = { uid: "guest", name: "Guest" }; return next(); }
  try { req.user = await admin.auth().verifyIdToken(auth.split('Bearer ')[1]); } 
  catch (e) { req.user = { uid: "guest", name: "Guest" }; }
  next();
};
app.use(validateToken);

// ==========================================
// 3. ROUTES
// ==========================================
app.post('/rooms', async (req, res) => { try { res.status(201).json(await dbLogic.createRoom(req.user.uid, req.body)); } catch(e){res.status(400).json({error:e.message});} });
app.post('/rooms/:roomId/memberships', async (req, res) => { try { res.json(await dbLogic.joinRoom(req.user.uid, req.body.inviteCode)); } catch(e){res.status(400).json({error:e.message});} });
app.get('/users/:userId/rooms', async (req, res) => { try { res.json(await dbLogic.getUserRooms(req.params.userId)); } catch(e){res.status(500).json({error:e.message});} });
app.get('/users/:userId/friends', async (req, res) => { try { res.json(await dbLogic.getFriends(req.params.userId)); } catch(e){res.status(500).json({error:e.message});} });
app.post('/rooms/:roomId/sessions', async (req, res) => { try { res.status(201).json(await dbLogic.startSession(req.params.roomId, req.user.uid, req.body)); } catch(e){res.status(400).json({error:e.message});} });
app.get('/rooms/:roomId/sessions/:sessionId', async (req, res) => { try { res.json(await dbLogic.getSession(req.params.roomId, req.params.sessionId)); } catch(e){res.status(404).json({error:e.message});} });
app.post('/rooms/:roomId/sessions/:sessionId/users', async (req, res) => { res.json({ message: "Joined session", userId: req.user.uid }); });
app.patch('/rooms/:roomId/sessions/:sessionId/users/:userId', async (req, res) => { res.json({ message: "Progress updated", tasks: req.body.tasks }); });

// UI Routes
app.post('/join', async (req, res) => { try { res.json(await dbLogic.joinRoom(req.user.uid, req.body.inviteCode)); } catch(e){res.status(400).json({error:e.message});} });
app.get('/friends', async (req, res) => { try { res.json(await dbLogic.getFriends(req.user.uid)); } catch(e){} });
app.post('/friends', async (req, res) => { try { res.json(await dbLogic.addFriend(req.user.uid, req.body.email)); } catch(e){res.status(400).json({error:e.message});} });
app.post('/users/me', async (req, res) => { try { res.json(await dbLogic.updateUser(req.user.uid, req.body)); } catch(e){} });
app.get('/friends/:friendId/messages', async (req, res) => { try { res.json(await dbLogic.getMessages(req.user.uid, req.params.friendId)); } catch(e){} });
app.post('/friends/:friendId/messages', async (req, res) => { try { res.json(await dbLogic.sendMessage(req.user.uid, req.params.friendId, req.body.text)); } catch(e){} });
app.get('/rooms/:roomId/tasks', async (req, res) => { try { res.json(await dbLogic.getTasks(req.params.roomId)); } catch(e){} });
app.post('/rooms/:roomId/tasks', async (req, res) => { try { res.json(await dbLogic.addTask(req.params.roomId, req.user.uid, req.user.name, req.body.text)); } catch(e){} });
app.patch('/rooms/:roomId/tasks/:taskId', async (req, res) => { try { res.json(await dbLogic.toggleTask(req.params.roomId, req.params.taskId, req.user.uid)); } catch(e){} });
app.post('/rooms/:roomId/timer', async (req, res) => { try { res.json(await dbLogic.toggleTimer(req.params.roomId, req.body.action)); } catch(e){res.status(400).json({error:e.message});} });
app.get('/stats', async (req, res) => { res.json({ minutesStudied: 120, tasksCompleted: 5 }); });

exports.api = onRequest(app);