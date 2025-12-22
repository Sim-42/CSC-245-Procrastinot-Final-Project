import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
// Combined all necessary Auth imports
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from "firebase/auth"; 

// The 'projectId' error suggests you should double-check these values.
// Ensure they are exactly as provided by Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyAonDkU9dVvmoS9VUAEHZcOxuquAnCdYmU",
  authDomain: "se-world-intermediate.firebaseapp.com",
  projectId: "se-world-intermediate",
  storageBucket: "se-world-intermediate.firebasestorage.app",
  messagingSenderId: "1011327355964",
  appId: "1:1011327355964:web:9598dd4594cdaed5be0739",
  measurementId: "G-3N93778FTW"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Connect to emulators if running locally
if (window.location.hostname === "localhost") {
  console.log("Development mode: Connecting to local Firebase emulators...");
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099');
} else {
  console.log("Production mode: Connecting to live Firebase services.");
}

export { app, db, functions, auth, googleProvider };