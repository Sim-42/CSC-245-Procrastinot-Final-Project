import { useState, useEffect } from 'preact/hooks';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Dashboard from './pages/Dashboard';
import Session from './pages/Session';

export function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState(null); // State to track if we are in a room

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const login = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => {
    setCurrentRoom(null);
    signOut(auth);
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  // 1. Not Logged In -> Login Screen
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>PROCRASTI<span style={{ fontWeight: '300' }}>NOT</span>.</h1>
        <button onClick={login} style={{ background: '#000', color: '#fff', padding: '15px 30px', border: 'none', borderRadius: '50px', fontSize: '1rem', cursor: 'pointer' }}>Sign in with Google</button>
      </div>
    );
  }

  // 2. In a Room -> Session Screen
  if (currentRoom) {
    return <Session user={user} room={currentRoom} goBack={() => setCurrentRoom(null)} />;
  }

  // 3. Logged In -> Dashboard
  return <Dashboard user={user} logout={logout} onEnterRoom={(room) => setCurrentRoom(room)} />;
}