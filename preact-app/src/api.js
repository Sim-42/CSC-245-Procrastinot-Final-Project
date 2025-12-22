// src/api.js
import { getAuth } from "firebase/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || window.location.origin;

async function fetchWithAuth(endpoint, options = {}) {
  const user = getAuth().currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken();

  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);

  try {
    return await res.json();
  } catch {
    return null;
  }
}

// Export reusable API calls (replace with your endpoints)
export const api = {
  getRooms: () => fetchWithAuth("/api/rooms"),
  createRoom: (data) =>
    fetchWithAuth("/api/rooms", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  joinRoom: (inviteCode) =>
    fetchWithAuth("/api/rooms/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    }),
  startSession: (roomId, mode) =>
    fetchWithAuth(`/api/rooms/${roomId}/sessions`, {
      method: "POST",
      body: JSON.stringify({ mode }),
    }),
};