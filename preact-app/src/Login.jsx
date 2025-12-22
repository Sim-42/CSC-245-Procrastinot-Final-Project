import { useState, useEffect } from "react";
// Import all necessary authentication components from the specific 'firebase/auth' path
import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from "firebase/auth";
// Import initializeApp from 'firebase/app'
import { initializeApp } from "firebase/app";

// --- Firebase Initialization (Embedded from your firebase.js) ---
// This is necessary for the single-file component to run without external imports.

const firebaseConfig = {
    apiKey: "AIzaSyAonDkU9dVvmoS9VUAEHZcOxuquAnCdYmU",
    authDomain: "se-world-intermediate.firebaseapp.com",
    projectId: "se-world-intermediate",
    storageBucket: "se-world-intermediate.firebasestorage.app",
    messagingSenderId: "1011327355964",
    appId: "1:1011327355964:web:9598dd4594cdaed5be0739",
    measurementId: "G-3N93778FTW"
};

const app = initializeApp(firebaseConfig);
// Corrected imports: getAuth and GoogleAuthProvider must be imported from 'firebase/auth'
const realAuth = getAuth(app);
const realGoogleProvider = new GoogleAuthProvider();

// Hardcoded room number as requested
const ROOM_NUMBER = '12345';

export function Login() {
  const [user, setUser] = useState(null);
  // State for Room Management
  const [inRoom, setInRoom] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Please make a room to start.');

  // --- Authentication Effects ---
  useEffect(() => {
    // onAuthStateChanged returns the cleanup function
    const unsubscribe = onAuthStateChanged(realAuth, (currentUser) => {
      setUser(currentUser);
      // Reset room state on auth change
      setInRoom(false);
      setStatusMessage('Welcome! Ready to create a room.');
      if (currentUser) {
        console.log(`User logged in: ${currentUser.displayName || currentUser.email}`);
      }
    }); 
    return () => unsubscribe();
  }, []);

  // --- Authentication Handlers ---
  async function handleGoogleLogin() {
    try {
      await signInWithPopup(realAuth, realGoogleProvider);
    } catch (err) {
      console.error("Login failed:", err.message);
    }
  }

  async function handleLogout() {
    await signOut(realAuth);
  }

  // --- Room Interaction Functions ---
  const makeRoom = () => {
    if (!user) return;

    const userName = user.displayName || user.email || 'Guest';
    
    // Print the name and hardcoded room number to the console as requested
    console.log(`User: ${userName}, Room Number: ${ROOM_NUMBER}`);
    
    setInRoom(true);
    setStatusMessage(
        <p class="text-green-700">
            Room created! You (<span class="font-semibold">{userName}</span>) are in room <span class="font-bold">{ROOM_NUMBER}</span>.
        </p>
    );
  };

  const leaveRoom = () => {
    setInRoom(false);
    setStatusMessage('You have left the room. Press "Make Room" to start a new session.');
  };

  // Determine user's displayed name for the greeting
  const userName = user?.displayName || user?.email || 'Guest';

  // --- UI Rendering ---

  if (!user) {
    return (
      <div class="flex flex-col items-center justify-center h-screen space-y-4 bg-gray-50">
        <h2 class="text-3xl font-bold text-gray-800">Welcome to Procrastinot</h2>
        <button
          onClick={handleGoogleLogin}
          class="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition duration-150"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div class="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div class="w-full max-w-lg bg-white p-8 md:p-10 rounded-xl shadow-2xl space-y-6">
            
            {/* Header and Greeting */}
            <header class="pb-4 space-y-2 text-center border-b">
                {user.photoURL && (
                    // Displays the user's profile picture
                    <img src={user.photoURL} alt="Profile" class="rounded-full w-12 h-12 mx-auto shadow-inner" />
                )}
                <h1 class="text-3xl font-extrabold text-gray-900">
                    Hello! {userName}!
                </h1>
                <p class="text-sm text-gray-500">
                    Your User ID: <span class="font-mono text-xs bg-gray-100 p-1 rounded-md break-all">{user.uid || 'N/A'}</span>
                </p>
            </header>

            <div class="space-y-4">
                {/* Status Message Area */}
                <div class={`p-4 text-sm rounded-lg border-l-4 font-medium 
                    ${inRoom ? 'text-green-800 bg-green-50 border-green-500' : 'text-gray-700 bg-gray-50 border-gray-400'}`}>
                    {statusMessage}
                </div>

                {/* Action Buttons */}
                <div class="flex flex-col space-y-4">
                    {/* Make Room Button */}
                    <button 
                        onClick={makeRoom} 
                        disabled={inRoom}
                        class={`w-full px-6 py-3 font-semibold rounded-lg shadow-md transition duration-150 ease-in-out ${
                            inRoom 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transform hover:scale-[1.01] active:scale-100'
                        }`}
                    >
                        Make Room
                    </button>

                    {/* Leave Button (Visible only when inRoom is true) */}
                    {inRoom && (
                        <button 
                            onClick={leaveRoom} 
                            class="w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out transform hover:scale-[1.01] active:scale-100"
                        >
                            Leave Room
                        </button>
                    )}
                </div>
            </div>
            
            {/* Sign Out Button */}
            <div class="pt-4 border-t">
                <button
                    onClick={handleLogout}
                    class="w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                    Sign Out
                </button>
            </div>
        </div>
    </div>
  );
}

// import { useState, useEffect } from "preact/hooks";
// import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
// // Correct path to firebase.js in the same directory
// import { auth, googleProvider } from "./firebase"; 

// export function Login() {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     // onAuthStateChanged returns the cleanup function
//     const unsubscribe = onAuthStateChanged(auth, setUser); 
//     return () => unsubscribe();
//   }, []);

//   async function handleGoogleLogin() {
//     try {
//       await signInWithPopup(auth, googleProvider);
//     } catch (err) {
//       console.error("Login failed:", err.message);
//       // Log the full error to see why the popup is closing instantly
//       console.error(err); 
//     }
//   }

//   async function handleLogout() {
//     await signOut(auth);
//   }

//   if (!user) {
//     return (
//       <div class="flex flex-col items-center justify-center h-screen space-y-4">
//         <h2 class="text-2xl font-bold">Welcome to Procrastinot</h2>
//         <button
//           onClick={handleGoogleLogin}
//           class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//         >
//           Sign in with Google
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div class="flex flex-col items-center justify-center h-screen space-y-4">
//       {user.photoURL && (
//         <img src={user.photoURL} alt="Profile" class="rounded-full w-16 h-16" />
//       )}
//       <p class="text-lg">Hello, {user.displayName || user.email}!</p>
//       <button
//         onClick={handleLogout}
//         class="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
//       >
//         Sign Out
//       </button>
//     </div>
//   );
// }