// ===============================================
//  Procrastinot Data Layer - dataLayer.js
//  Single-file DAL with schemas, mappers, DAOs,
//  repository interfaces + in-memory database
// ===============================================

// -----------------------------
// Mini-ORM Mapper
// -----------------------------
function mapToEntity(schema, data = {}) {
  const obj = {};
  for (const key of Object.keys(schema)) {
    const def = schema[key].default;
    obj[key] = data[key] ?? (typeof def === "function" ? def() : def);
  }
  return obj;
}

// -----------------------------
// In-Memory Database
// -----------------------------
const db = {
  users: {},
  rooms: {},
  memberships: {},
  sessions: {},
  tasks: {},
  messages: {}
};

// -----------------------------
// Schemas
// -----------------------------
const UserSchema = {
  id: { default: () => crypto.randomUUID() },
  displayName: { default: "" },
  email: { default: "" },
  avatarUrl: { default: "" },
  createdAt: { default: () => Date.now() }
};

const RoomSchema = {
  id: { default: () => crypto.randomUUID() },
  name: { default: "" },
  description: { default: "" },
  ownerId: { default: "" },
  createdAt: { default: () => Date.now() }
};

const RoomMembershipSchema = {
  id: { default: () => crypto.randomUUID() },
  roomId: { default: "" },
  userId: { default: "" },
  role: { default: "member" },
  joinedAt: { default: () => Date.now() }
};

const SessionSchema = {
  id: { default: () => crypto.randomUUID() },
  roomId: { default: "" },
  userId: { default: "" },
  startTime: { default: () => Date.now() },
  endTime: { default: null },
  mode: { default: "focus" },
  durationMinutes: { default: 0 }
};

const TaskSchema = {
  id: { default: () => crypto.randomUUID() },
  userId: { default: "" },
  roomId: { default: null },
  title: { default: "" },
  completed: { default: false },
  createdAt: { default: () => Date.now() },
  completedAt: { default: null }
};

const MessageSchema = {
  id: { default: () => crypto.randomUUID() },
  roomId: { default: "" },
  userId: { default: "" },
  text: { default: "" },
  createdAt: { default: () => Date.now() }
};

// =====================================================
// Repository Interfaces
// =====================================================
class IUserRepository {
  createUser(user) {}
  getUserById(id) {}
  getUserByEmail(email) {}
  updateUser(id, fields) {}
  deleteUser(id) {}

  getUsersInRoom(roomId) {}
}

class IRoomRepository {
  createRoom(room) {}
  getRoomById(id) {}
  getRoomsByOwner(ownerId) {}
  getRoomsForUser(userId) {}
  updateRoom(id, fields) {}
  deleteRoom(id) {}
}

class IMembershipRepository {
  addMembership(m) {}
  getMembershipById(id) {}
  getMembers(roomId) {}
  getRoomsForUser(userId) {}
  deleteMembership(id) {}
}

class ISessionRepository {
  createSession(s) {}
  getSessionById(id) {}
  getSessionsForRoom(roomId) {}
  getSessionsForUser(userId) {}
  updateSession(id, fields) {}
  deleteSession(id) {}
}

class ITaskRepository {
  createTask(t) {}
  getTaskById(id) {}
  getTasksForUser(userId) {}
  getIncompleteTasks(userId) {}
  getCompletedTasks(userId) {}
  updateTask(id, fields) {}
  deleteTask(id) {}
}

class IMessageRepository {
  createMessage(m) {}
  getMessageById(id) {}
  getMessagesForRoom(roomId) {}
  deleteMessage(id) {}
}

// =====================================================
// Concrete Implementations
// =====================================================

// ------- USERS -------
class InMemoryUserRepository extends IUserRepository {
  constructor(database) {
    super();
    this.db = database.users;
  }

  createUser(user) {
    this.db[user.id] = user;
    return user;
  }

  getUserById(id) {
    return this.db[id] || null;
  }

  getUserByEmail(email) {
    return Object.values(this.db).find(u => u.email === email) || null;
  }

  getUsersInRoom(roomId) {
    return Object.values(db.memberships)
      .filter(m => m.roomId === roomId)
      .map(m => this.db[m.userId]);
  }

  updateUser(id, fields) {
    if (!this.db[id]) return null;
    this.db[id] = { ...this.db[id], ...fields };
    return this.db[id];
  }

  deleteUser(id) {
    delete this.db[id];
  }
}

// ------- ROOMS -------
class InMemoryRoomRepository extends IRoomRepository {
  constructor(database) {
    super();
    this.db = database.rooms;
  }

  createRoom(room) {
    this.db[room.id] = room;
    return room;
  }

  getRoomById(id) {
    return this.db[id] || null;
  }

  getRoomsByOwner(ownerId) {
    return Object.values(this.db).filter(r => r.ownerId === ownerId);
  }

  getRoomsForUser(userId) {
    return Object.values(db.memberships)
      .filter(m => m.userId === userId)
      .map(m => this.db[m.roomId])
      .filter(Boolean);
  }

  updateRoom(id, fields) {
    if (!this.db[id]) return null;
    this.db[id] = { ...this.db[id], ...fields };
    return this.db[id];
  }

  deleteRoom(id) {
    delete this.db[id];
  }
}

// ------- MEMBERSHIPS -------
class InMemoryMembershipRepository extends IMembershipRepository {
  constructor(database) {
    super();
    this.db = database.memberships;
  }

  addMembership(m) {
    this.db[m.id] = m;
    return m;
  }

  getMembershipById(id) {
    return this.db[id] || null;
  }

  getMembers(roomId) {
    return Object.values(this.db).filter(m => m.roomId === roomId);
  }

  getRoomsForUser(userId) {
    return Object.values(this.db).filter(m => m.userId === userId);
  }

  deleteMembership(id) {
    delete this.db[id];
  }
}

// ------- SESSIONS -------
class InMemorySessionRepository extends ISessionRepository {
  constructor(database) {
    super();
    this.db = database.sessions;
  }

  createSession(s) {
    this.db[s.id] = s;
    return s;
  }

  getSessionById(id) {
    return this.db[id] || null;
  }

  getSessionsForRoom(roomId) {
    return Object.values(this.db).filter(s => s.roomId === roomId);
  }

  getSessionsForUser(userId) {
    return Object.values(this.db).filter(s => s.userId === userId);
  }

  updateSession(id, fields) {
    if (!this.db[id]) return null;
    this.db[id] = { ...this.db[id], ...fields };
    return this.db[id];
  }

  deleteSession(id) {
    delete this.db[id];
  }
}

// ------- TASKS -------
class InMemoryTaskRepository extends ITaskRepository {
  constructor(database) {
    super();
    this.db = database.tasks;
  }

  createTask(t) {
    this.db[t.id] = t;
    return t;
  }

  getTaskById(id) {
    return this.db[id] || null;
  }

  getTasksForUser(userId) {
    return Object.values(this.db).filter(t => t.userId === userId);
  }

  getIncompleteTasks(userId) {
    return Object.values(this.db).filter(t => t.userId === userId && !t.completed);
  }

  getCompletedTasks(userId) {
    return Object.values(this.db).filter(t => t.userId === userId && t.completed);
  }

  updateTask(id, fields) {
    if (!this.db[id]) return null;
    this.db[id] = { ...this.db[id], ...fields };
    return this.db[id];
  }

  deleteTask(id) {
    delete this.db[id];
  }
}

// ------- MESSAGES -------
class InMemoryMessageRepository extends IMessageRepository {
  constructor(database) {
    super();
    this.db = database.messages;
  }

  createMessage(m) {
    this.db[m.id] = m;
    return m;
  }

  getMessageById(id) {
    return this.db[id] || null;
  }

  getMessagesForRoom(roomId) {
    return Object.values(this.db).filter(m => m.roomId === roomId);
  }

  deleteMessage(id) {
    delete this.db[id];
  }
}

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
  db,
  mapToEntity,
  schemas: {
    UserSchema,
    RoomSchema,
    RoomMembershipSchema,
    SessionSchema,
    TaskSchema,
    MessageSchema
  },
  repositories: {
    InMemoryUserRepository,
    InMemoryRoomRepository,
    InMemoryMembershipRepository,
    InMemorySessionRepository,
    InMemoryTaskRepository,
    InMemoryMessageRepository
  }
};
