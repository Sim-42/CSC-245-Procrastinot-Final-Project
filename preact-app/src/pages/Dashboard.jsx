import { useEffect, useState } from 'preact/hooks';
import { fetchWithAuth } from '../api';
import { auth } from '../firebase'; 

export default function Dashboard({ user, logout, onEnterRoom, goToFriends }) {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const getToken = () => auth.currentUser?.getIdToken();

  // 1. Load Rooms on Startup
  useEffect(() => {
    async function loadData() {
      const token = await getToken();
      if (!token) return;
      try {
        const myRooms = await fetchWithAuth(`/users/${user.uid}/rooms`, token);
        setRooms(myRooms);
      } catch (err) { console.error(err); }
    }
    loadData();
  }, [user]);

  // 2. Create Room (With Study Mode Selection)
  const handleCreate = async (e) => {
    e.preventDefault();
    const token = await getToken();
    const mode = e.target.mode.value; // Get value from the dropdown

    try {
      const room = await fetchWithAuth('/rooms', token, { 
        method: 'POST', 
        body: JSON.stringify({ name: newRoomName, mode: mode }) 
      });
      setRooms([...rooms, room]);
      setNewRoomName('');
    } catch (err) { 
      setError(err.message); 
    }
  };

  // 3. Join Room
  const handleJoin = async (e) => {
    e.preventDefault();
    const token = await getToken();
    try {
      const room = await fetchWithAuth('/join', token, { 
        method: 'POST', 
        body: JSON.stringify({ inviteCode }) 
      });
      
      // Only add to list if not already there
      if (!rooms.find(r => r.roomId === room.roomId)) {
        setRooms([...rooms, room]);
      }
      setInviteCode('');
      setError('');
    } catch (err) { 
      setError("Invalid Code or Error Joining"); 
    }
  };

  // DARK THEME STYLES
  const styles = {
    container: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px', color: '#fff', fontFamily: 'sans-serif' },
    card: { border: '1px solid #333', background: '#1e1e1e', padding: '25px', marginBottom: '20px' },
    input: { width: '100%', padding: '12px', background: '#2c2c2c', border: 'none', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' },
    select: { width: '100%', padding: '12px', background: '#2c2c2c', border: 'none', color: '#fff', marginBottom: '10px', cursor: 'pointer' },
    btn: { width: '100%', padding: '12px', background: '#fff', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    headerBtn: { background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '8px 16px', cursor: 'pointer', marginLeft: '10px' }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '50px', borderBottom: '1px solid #333', paddingBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ margin: 0, letterSpacing: '-1px' }}>DASHBOARD</h2>
        <div>
          <span style={{ marginRight: '15px', color: '#888' }}>{user.displayName}</span>
          {/* Friends Button */}
          <button onClick={goToFriends} style={styles.headerBtn}>👥 Friends</button>
          <button onClick={logout} style={styles.headerBtn}>Log out</button>
        </div>
      </header>

      {/* CREATE / JOIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '50px' }}>
        
        {/* CREATE SESSION CARD */}
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: '#888' }}>CREATE SESSION</h3>
          <form onSubmit={handleCreate}>
            <input 
              value={newRoomName} 
              onInput={e => setNewRoomName(e.target.value)} 
              placeholder="Session Name" 
              style={styles.input}
              required
            />
            {/* Mode Selector for User Story Requirement */}
            <select name="mode" style={styles.select}>
              <option value="pomodoro">🍅 Pomodoro (25m)</option>
              <option value="deep">🧠 Deep Study (50m)</option>
            </select>
            <button type="submit" style={styles.btn}>CREATE +</button>
          </form>
        </div>

        {/* JOIN SESSION CARD */}
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: '#888' }}>JOIN SESSION</h3>
          <form onSubmit={handleJoin}>
            <input 
              value={inviteCode} 
              onInput={e => setInviteCode(e.target.value)} 
              placeholder="Enter Code (e.g. A1B2)" 
              style={styles.input}
              required
            />
            <button type="submit" style={styles.btn}>JOIN →</button>
          </form>
          {error && <p style={{ color: '#ff4444', fontSize: '14px', marginTop: '10px' }}>{error}</p>}
        </div>
      </div>

      {/* ROOM LIST */}
      <h3 style={{ letterSpacing: '1px', fontSize: '0.9rem', color: '#888' }}>YOUR ACTIVE SESSIONS</h3>
      
      {rooms.length === 0 ? (
        <p style={{ color: '#555', fontStyle: 'italic' }}>No active sessions found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {rooms.map(r => (
            <div key={r.roomId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#1e1e1e', border: '1px solid #333' }}>
              <div>
                 <div style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{r.name}</div>
                 <div style={{ color: '#888', fontSize: '0.9em', marginTop: '5px' }}>
                    Code: <span style={{ fontFamily: 'monospace', color: '#fff' }}>{r.inviteCode}</span>
                    <span style={{ marginLeft: '15px' }}>
                      {r.mode === 'deep' ? '🧠 Deep Study' : '🍅 Pomodoro'}
                    </span>
                 </div>
              </div>
              <button 
                onClick={() => onEnterRoom(r)} 
                style={{ ...styles.btn, width: 'auto', padding: '10px 30px' }}
              >
                ENTER
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}