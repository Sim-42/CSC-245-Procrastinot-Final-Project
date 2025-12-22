const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const db = getFirestore();

// Helper to sanitize data
const cleanData = (data) => JSON.parse(JSON.stringify(data));

// 1. Create a Room
exports.createRoom = async (userId, roomData) => {
  if (!roomData.name) throw new Error("Room name required");
  
  const roomRef = db.collection('rooms').doc();
  const newRoom = {
    roomId: roomRef.id,
    owner: userId,
    name: roomData.name,
    description: roomData.description || "",
    users: [userId],
    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    createdAt: Timestamp.now()
  };
  
  await roomRef.set(newRoom);
  return cleanData(newRoom);
};

// 2. Get User Rooms
exports.getUserRooms = async (userId) => {
  const snapshot = await db.collection('rooms').where('users', 'array-contains', userId).get();
  return snapshot.docs.map(doc => cleanData(doc.data()));
};

// 3. Join Room (Used by your new /join endpoint)
exports.joinRoom = async (userId, inviteCode) => {
  const snapshot = await db.collection('rooms').where('inviteCode', '==', inviteCode).limit(1).get();
  
  if (snapshot.empty) throw new Error("Invalid invite code");
  
  const roomDoc = snapshot.docs[0];
  const roomData = roomDoc.data();
  
  if (!roomData.users.includes(userId)) {
    await roomDoc.ref.update({
      users: [...roomData.users, userId]
    });
  }
  
  return cleanData({ ...roomData, users: [...roomData.users, userId] });
};

// 4. Get Stats (For Homepage)
exports.getUserStats = async (userId) => {
  // Mock data for now
  return { minutesStudied: 45, tasksCompleted: 3 };
};