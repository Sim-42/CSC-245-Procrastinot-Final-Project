// 1. Define URLs
// Replace "se-world-intermediate" with your actual project ID if it's different
const LIVE_URL = "https://us-central1-se-world-intermediate.cloudfunctions.net/api";
const LOCAL_URL = "http://127.0.0.1:5001/se-world-intermediate/us-central1/api";

// 2. Auto-Switch: Use Local if on localhost, otherwise use Live
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? LOCAL_URL 
  : LIVE_URL;

export async function fetchWithAuth(endpoint, token, options = {}) {
  // --- THIS WAS MISSING ---
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  // ------------------------

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers, // This is where it was crashing because 'headers' didn't exist
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.statusText}`);
  }
  return response.json();
}