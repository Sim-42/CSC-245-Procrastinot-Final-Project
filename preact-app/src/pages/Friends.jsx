import { useEffect, useState, useRef } from 'preact/hooks';
import { fetchWithAuth } from '../api';
import { auth } from '../firebase';

export default function Friends({ user, goBack }) {
  const [friends, setFriends] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null); // Who are we chatting with?
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  
  const chatEndRef = useRef(null);

  // Poll for friend list updates (status changes)
  useEffect(() => {
    loadFriends();
    const interval = setInterval(loadFriends, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll for messages if chat is open
  useEffect(() => {
    if (selectedFriend) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedFriend]);

  const getToken = () => auth.currentUser?.getIdToken();

  const loadFriends = async () => {
    const token = await getToken();
    try {
      const data = await fetchWithAuth('/friends', token);
      setFriends(data || []);
    } catch (e) { console.error(e); }
  };

  const loadMessages = async () => {
    if (!selectedFriend) return;
    const token = await getToken();
    try {
      const data = await fetchWithAuth(`/friends/${selectedFriend.userId}/messages`, token);
      setMessages(data);
      // Auto-scroll to bottom
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { console.error(e); }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    const token = await getToken();
    try {
      await fetchWithAuth('/friends', token, { method: 'POST', body: JSON.stringify({ email: emailInput }) });
      setEmailInput('');
      loadFriends();
      alert("Friend added!");
    } catch (e) { alert("Could not add friend. Check email."); }
  };

  const handleSendMsg = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    const token = await getToken();
    await fetchWithAuth(`/friends/${selectedFriend.userId}/messages`, token, {
      method: 'POST',
      body: JSON.stringify({ text: msgInput })
    });
    setMsgInput('');
    loadMessages();
  };

  // DARK MODE STYLES
  const darkStyle = {
    bg: '#121212', text: '#fff', 
    card: '#1e1e1e', border: '#333',
    input: '#2c2c2c', accent: '#fff'
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', color: darkStyle.text, fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: `1px solid ${darkStyle.border}`, paddingBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>FOCUS FRIENDS</h2>
        <button onClick={goBack} style={{ background: 'transparent', color: darkStyle.text, border: `1px solid ${darkStyle.border}`, padding: '8px 16px', cursor: 'pointer' }}>← Back</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: selectedFriend ? '1fr 1.5fr' : '1fr', gap: '20px' }}>
        
        {/* LEFT: FRIEND LIST */}
        <div>
          {/* Add Friend */}
          <form onSubmit={handleAddFriend} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              value={emailInput} onInput={e => setEmailInput(e.target.value)} 
              placeholder="Friend's Email" 
              style={{ flex: 1, padding: '10px', background: darkStyle.input, border: 'none', color: '#fff' }} 
            />
            <button type="submit" style={{ background: '#fff', color: '#000', border: 'none', padding: '10px', fontWeight: 'bold' }}>ADD</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {friends.map(f => (
              <div 
                key={f.userId} 
                onClick={() => setSelectedFriend(f)}
                style={{ 
                  padding: '15px', background: darkStyle.card, cursor: 'pointer',
                  border: selectedFriend?.userId === f.userId ? '1px solid #fff' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{f.displayName || f.email}</div>
                  <div style={{ fontSize: '0.8em', color: f.status === 'in-session' ? '#4caf50' : '#888' }}>
                    {f.status === 'in-session' ? '● In Session' : '○ Online'}
                  </div>
                </div>
                <button style={{ fontSize: '1.2em', background: 'none', border: 'none' }}>💬</button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: CHAT WINDOW */}
        {selectedFriend && (
          <div style={{ background: darkStyle.card, display: 'flex', flexDirection: 'column', height: '500px', border: `1px solid ${darkStyle.border}` }}>
            <div style={{ padding: '15px', borderBottom: `1px solid ${darkStyle.border}`, fontWeight: 'bold' }}>
              Chat with {selectedFriend.displayName}
            </div>
            
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map(m => (
                <div key={m.id} style={{ 
                  alignSelf: m.senderId === user.uid ? 'flex-end' : 'flex-start',
                  background: m.senderId === user.uid ? '#fff' : '#333',
                  color: m.senderId === user.uid ? '#000' : '#fff',
                  padding: '8px 12px', borderRadius: '8px', maxWidth: '70%'
                }}>
                  {m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMsg} style={{ padding: '15px', display: 'flex', gap: '10px', borderTop: `1px solid ${darkStyle.border}` }}>
              <input 
                value={msgInput} onInput={e => setMsgInput(e.target.value)} 
                placeholder="Type a message..." 
                style={{ flex: 1, padding: '10px', background: darkStyle.input, border: 'none', color: '#fff' }} 
              />
              <button type="submit" style={{ background: '#fff', color: '#000', border: 'none', padding: '10px' }}>SEND</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}