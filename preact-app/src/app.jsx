import { useState, useEffect } from 'preact/hooks';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { fetchWithAuth } from './api'; // Import API helper
import Dashboard from './pages/Dashboard';
import Session from './pages/Session';
import Friends from './pages/Friends'; // NEW IMPORT

export function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'session', 'friends'
  const [currentRoom, setCurrentRoom] = useState(null);

  // DARK MODE GLOBAL STYLES
  useEffect(() => {
    document.body.style.backgroundColor = '#121212';
    document.body.style.color = '#ffffff';
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if(currentUser) {
        // Update Status to Online when logged in
        const token = await currentUser.getIdToken();
        fetchWithAuth('/users/me', token, { 
          method: 'POST', 
          body: JSON.stringify({ email: currentUser.email, displayName: currentUser.displayName, status: 'online' }) 
        }).catch(console.error);
      }
    });
  }, []);

  const handleEnterSession = async (room) => {
    setCurrentRoom(room);
    setView('session');
    // Update status to 'in-session'
    const token = await user.getIdToken();
    fetchWithAuth('/users/me', token, { method: 'POST', body: JSON.stringify({ status: 'in-session', currentRoom: room.name }) });
  };

  const handleExitSession = async () => {
    setView('dashboard');
    setCurrentRoom(null);
    // Update status back to 'online'
    const token = await user.getIdToken();
    fetchWithAuth('/users/me', token, { method: 'POST', body: JSON.stringify({ status: 'online' }) });
  };

  if (!user) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontSize: '3rem', letterSpacing: '-2px' }}>PROCRASTI<span style={{ fontWeight: '300' }}>NOT</span>.</h1>
        <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} 
          style={{ background: '#fff', color: '#000', padding: '15px 30px', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          Sign in with Google
        </button>
      </div>
    );
  }

  if (view === 'friends') return <Friends user={user} goBack={() => setView('dashboard')} />;
  if (view === 'session' && currentRoom) return <Session user={user} room={currentRoom} goBack={handleExitSession} />;

  // Pass setView to Dashboard so we can click "Friends" button
  return <Dashboard user={user} logout={() => signOut(auth)} onEnterRoom={handleEnterSession} goToFriends={() => setView('friends')} />;
}