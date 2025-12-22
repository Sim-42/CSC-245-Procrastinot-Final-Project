import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  connectAuthEmulator 
} from 'firebase/auth';

// 1. Initialize Firebase (Ensure these match your firebase.json / Setup)
// If using emulators, the config values don't matter much, but they must exist.
const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: "localhost",
  projectId: "demo-project", // Change this to match your .firebaserc
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to Emulator if running locally
// Check if window.location.hostname is localhost to auto-switch
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const t = await currentUser.getIdToken();
        setToken(t);
      } else {
        setToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);