const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

admin.initializeApp();
const db = getFirestore();
const app = express();
app.use(cors({ origin: true }));

const cleanData = (data) => JSON.parse(JSON.stringify(data));

const dbLogic = {
  async getUserStats(userId) {
    return { minutesStudied: 120, tasksCompleted: 5 };
  },

  async createRoom(userId, roomData) {
    if (!roomData.name) throw new Error("Room name required");
    const roomRef = db.collection('rooms').doc();
    const newRoom = {
      roomId: roomRef.id,
      owner: userId,
      name: roomData.name,
      users: [userId],
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: Timestamp.now()
    };
    await roomRef.set(newRoom);
    return cleanData(newRoom);
  },

  async getUserRooms(userId) {
    const snapshot = await db.collection('rooms').where('users', 'array-contains', userId).get();
    return snapshot.docs.map(doc => cleanData(doc.data()));
  },

  async joinRoom(userId, inviteCode) {
    const snapshot = await db.collection('rooms').where('inviteCode', '==', inviteCode).limit(1).get();
    if (snapshot.empty) throw new Error("Invalid invite code");
    const roomDoc = snapshot.docs[0];
    const roomData = roomDoc.data();
    if (!roomData.users.includes(userId)) {
      await roomDoc.ref.update({ users: [...roomData.users, userId] });
    }
    return cleanData({ ...roomData, users: [...roomData.users, userId] });
  },

  // --- NEW: TASK LOGIC ---
  async addTask(roomId, userId, userName, text) {
    const taskRef = db.collection('rooms').doc(roomId).collection('tasks').doc();
    const newTask = {
      taskId: taskRef.id,
      roomId,
      owner: userId,
      ownerName: userName,
      text,
      completed: false,
      createdAt: Timestamp.now()
    };
    await taskRef.set(newTask);
    return cleanData(newTask);
  },

  async getTasks(roomId) {
    const snapshot = await db.collection('rooms').doc(roomId).collection('tasks').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => cleanData(doc.data()));
  },

  async toggleTask(roomId, taskId, userId) {
    const taskRef = db.collection('rooms').doc(roomId).collection('tasks').doc(taskId);
    const doc = await taskRef.get();
    if (!doc.exists) throw new Error("Task not found");
    
    if (doc.data().owner !== userId) throw new Error("You can only complete your own tasks");
    
    const newStatus = !doc.data().completed;
    await taskRef.update({ completed: newStatus });
    return { ...doc.data(), completed: newStatus };
  }
};

const validateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { uid: "guest", name: "Guest" };
    return next();
  }
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    req.user = decoded;
  } catch (e) {
    req.user = { uid: "guest", name: "Guest" };
  }
  next();
};

app.use(validateToken);

app.get('/stats', async (req, res) => {
  try { res.json(await dbLogic.getUserStats(req.user.uid)); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/rooms', async (req, res) => {
  try { res.status(201).json(await dbLogic.createRoom(req.user.uid, req.body)); } catch (e) { res.status(400).json({ error: e.message }); }
});
app.get('/users/:userId/rooms', async (req, res) => {
  try { res.json(await dbLogic.getUserRooms(req.user.uid)); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/join', async (req, res) => {
  try { res.json(await dbLogic.joinRoom(req.user.uid, req.body.inviteCode)); } catch (e) { res.status(400).json({ error: e.message }); }
});

// --- NEW: TASK ROUTES ---
app.get('/rooms/:roomId/tasks', async (req, res) => {
  try { res.json(await dbLogic.getTasks(req.params.roomId)); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/rooms/:roomId/tasks', async (req, res) => {
  try { res.json(await dbLogic.addTask(req.params.roomId, req.user.uid, req.user.name || "User", req.body.text)); } catch (e) { res.status(400).json({ error: e.message }); }
});
app.patch('/rooms/:roomId/tasks/:taskId', async (req, res) => {
  try { res.json(await dbLogic.toggleTask(req.params.roomId, req.params.taskId, req.user.uid)); } catch (e) { res.status(400).json({ error: e.message }); }
});

exports.api = onRequest(app);