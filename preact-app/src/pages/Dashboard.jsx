import { useEffect, useState } from 'preact/hooks';
import { fetchWithAuth } from '../api';
import { auth } from '../firebase'; 

// FIXED: Added 'onEnterRoom' to the props list
export default function Dashboard({ user, logout, onEnterRoom }) {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const getToken = () => auth.currentUser?.getIdToken();

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

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const token = await getToken();
    try {
      const room = await fetchWithAuth('/rooms', token, { method: 'POST', body: JSON.stringify({ name: newRoomName }) });
      setRooms([...rooms, room]);
      setNewRoomName('');
    } catch (err) { setError(err.message); }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    const token = await getToken();
    try {
      const room = await fetchWithAuth('/join', token, { method: 'POST', body: JSON.stringify({ inviteCode }) });
      if (!rooms.find(r => r.roomId === room.roomId)) setRooms([...rooms, room]);
      setInviteCode('');
      setError('');
    } catch (err) { setError("Invalid Code"); }
  };

  // COMMON STYLES
  const containerStyle = { maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#000' };
  const cardStyle = { border: '2px solid #000', padding: '30px', borderRadius: '0px', backgroundColor: '#fff' };
  const inputStyle = { width: '100%', padding: '12px', border: '1px solid #000', marginBottom: '10px', fontSize: '14px', outline: 'none' };
  const btnStyle = { width: '100%', backgroundColor: '#000', color: '#fff', padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '-1px' }}>DASHBOARD</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontWeight: 'bold' }}>{user.displayName}</span>
          <button onClick={logout} style={{ ...btnStyle, width: 'auto', padding: '8px 20px', backgroundColor: '#fff', color: '#000', border: '2px solid #000' }}>Log out</button>
        </div>
      </header>

      {/* Action Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
        
        {/* Create Room */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Create Session</h3>
          <form onSubmit={handleCreateRoom}>
            <input value={newRoomName} onInput={e => setNewRoomName(e.target.value)} placeholder="Session Name" style={inputStyle} />
            <button type="submit" style={btnStyle}>CREATE +</button>
          </form>
        </div>

        {/* Join Room */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>Join Session</h3>
          <form onSubmit={handleJoinRoom}>
            <input value={inviteCode} onInput={e => setInviteCode(e.target.value)} placeholder="Enter Code" style={inputStyle} />
            <button type="submit" style={btnStyle}>JOIN →</button>
          </form>
          {error && <p style={{ color: 'red', fontSize: '12px', marginTop: '10px' }}>{error}</p>}
        </div>
      </div>

      {/* Room List */}
      <div>
        <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px', marginBottom: '20px' }}>Active Rooms</h3>
        {rooms.length === 0 ? <p style={{ color: '#999' }}>No active sessions.</p> : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {rooms.map(room => (
              <div key={room.roomId} style={{ border: '1px solid #ddd', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>{room.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>CODE: <span style={{ background: '#000', color: '#fff', padding: '2px 6px' }}>{room.inviteCode}</span></div>
                </div>
                {/* Now this button will actually work */}
                <button 
                  onClick={() => onEnterRoom(room)} 
                  style={{ ...btnStyle, width: 'auto', padding: '8px 20px' }}
                >
                  ENTER
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}