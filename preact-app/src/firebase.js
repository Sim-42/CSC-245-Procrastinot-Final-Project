import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
export const auth = getAuth(app);
// Note: We removed the "connectAuthEmulator" lines.
// This means even locally, you will talk to real Google Auth (which is fine!)