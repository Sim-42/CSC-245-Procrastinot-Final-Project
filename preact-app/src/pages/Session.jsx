import { useEffect, useState, useRef } from 'preact/hooks';
import { fetchWithAuth } from '../api';
import { auth } from '../firebase';

export default function Session({ user, room, goBack }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  
  // --- LOCAL TIMER STATE (The Solution) ---
  const [localSeconds, setLocalSeconds] = useState(room.timerRemaining);
  const [isRunning, setIsRunning] = useState(room.isTimerRunning);
  
  const [nudge, setNudge] = useState(false);
  const lastProgress = useRef(Date.now());
  const nudgeTimer = useRef(null);

  // Helper to safely parse any weird time format
  const parseTime = (t) => {
    if (!t) return null;
    if (t._seconds) return t._seconds;
    if (t.seconds) return t.seconds;
    if (typeof t === 'string') return new Date(t).getTime() / 1000;
    return null;
  };

  // 1. LOCAL TICKER (Run this independently of server)
  useEffect(() => {
    let interval = null;
    if (isRunning && localSeconds > 0) {
      interval = setInterval(() => {
        setLocalSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, localSeconds]);

  // 2. SERVER SYNC (Poll every 3s, but only update if drift is huge)
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    checkProgress();
    return () => { clearInterval(interval); clearTimeout(nudgeTimer.current); };
  }, []);

  const getToken = () => auth.currentUser?.getIdToken();

  const refreshData = async () => {
    const token = await getToken();
    try {
      // Fetch Tasks
      const taskData = await fetchWithAuth(`/rooms/${room.roomId}/tasks`, token);
      setTasks(taskData);
      
      // Fetch Room for Timer Sync
      const rooms = await fetchWithAuth(`/users/${user.uid}/rooms`, token);
      const serverRoom = rooms.find(r => r.roomId === room.roomId);
      
      if (serverRoom) {
        // --- DRIFT LOGIC ---
        // 1. Calculate what the server thinks the time is RIGHT NOW
        let serverCurrentSeconds = serverRoom.timerRemaining;
        if (serverRoom.isTimerRunning && serverRoom.lastTick) {
          const now = Date.now() / 1000;
          const start = parseTime(serverRoom.lastTick);
          if (start) {
            const elapsed = now - start;
            serverCurrentSeconds = Math.max(0, serverRoom.timerRemaining - elapsed);
          }
        }

        // 2. Decide: Do we trust Local or Server?
        const drift = Math.abs(serverCurrentSeconds - localSeconds);
        
        // Update IF: State changed (Play/Pause) OR Drift is > 2 seconds
        if (serverRoom.isTimerRunning !== isRunning || drift > 2) {
            console.log("Syncing Timer: Drift detected or State change");
            setIsRunning(serverRoom.isTimerRunning);
            setLocalSeconds(Math.floor(serverCurrentSeconds));
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleToggleTimer = async () => {
    const token = await getToken();
    const action = isRunning ? 'pause' : 'start';
    
    // Immediate Local Update (Instant Feedback)
    setIsRunning(action === 'start');
    
    await fetchWithAuth(`/rooms/${room.roomId}/timer`, token, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    // refreshData will run in 3s and correct any minor errors
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const token = await getToken();
    await fetchWithAuth(`/rooms/${room.roomId}/tasks`, token, { method: 'POST', body: JSON.stringify({ text: newTask }) });
    setNewTask('');
    refreshData();
  };

  const handleToggleTask = async (taskId) => {
    const token = await getToken();
    await fetchWithAuth(`/rooms/${room.roomId}/tasks/${taskId}`, token, { method: 'PATCH' });
    lastProgress.current = Date.now(); 
    if (nudge) setNudge(false);
    refreshData();
  };

  const checkProgress = () => {
    nudgeTimer.current = setInterval(() => {
      if (Date.now() - lastProgress.current > 5 * 60 * 1000) setNudge(true);
    }, 10000); 
  };

  // Format Time MM:SS
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const myTasks = tasks.filter(t => t.owner === user.uid);
  const otherTasks = tasks.filter(t => t.owner !== user.uid);

  const styles = {
    container: { maxWidth: '700px', margin: '0 auto', padding: '20px', color: '#fff', fontFamily: 'sans-serif' },
    header: { borderBottom: '1px solid #444', paddingBottom: '20px', marginBottom: '30px', textAlign: 'center' },
    timerBox: { fontSize: '4rem', fontWeight: 'bold', fontFamily: 'monospace', background: '#000', border: '2px solid #fff', padding: '10px 40px', borderRadius: '8px', minWidth: '220px', textAlign: 'center', margin: '20px auto' },
    controlBtn: { background: isRunning ? '#ff4444' : '#4caf50', color: '#fff', border: 'none', padding: '12px 35px', fontSize: '1.2rem', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', display: 'block', margin: '0 auto' },
    task: { padding: '20px', background: '#222', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #fff', borderRadius: '4px' },
    input: { width: '100%', padding: '15px', background: '#222', border: '1px solid #444', color: '#fff', marginBottom: '20px', boxSizing: 'border-box' },
    nudge: { position: 'fixed', bottom: '20px', right: '20px', background: '#fff', color: '#000', padding: '20px', border: '4px solid red', zIndex: 999 }
  };

  return (
    <div style={styles.container}>
      {nudge && (
        <div style={styles.nudge}>
          <div>🐢 Stuck? It's been 5 mins since a task completion.</div>
          <button onClick={() => { setNudge(false); lastProgress.current = Date.now(); }} style={{ background: '#000', color: '#fff', padding: '5px 10px', marginTop: '10px' }}>I'm Working!</button>
        </div>
      )}

      <header style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h1>{room.name}</h1>
          <button onClick={goBack} style={{ background: 'transparent', color: '#aaa', border: '1px solid #aaa', padding: '5px 15px' }}>Exit</button>
        </div>
        <div style={{ color: '#888' }}>Code: {room.inviteCode}</div>
      </header>

      <div style={styles.timerBox}>{formatTime(localSeconds)}</div>
      
      <button onClick={handleToggleTimer} style={styles.controlBtn}>
        {isRunning ? '⏸ PAUSE' : '▶ START'}
      </button>

      <h3 style={{ marginTop: '40px', borderBottom: '1px solid #fff' }}>MY TASKS</h3>
      <form onSubmit={handleAddTask}>
        <input value={newTask} onInput={e => setNewTask(e.target.value)} placeholder="Add task..." style={styles.input} />
      </form>

      {myTasks.map(task => (
        <div key={task.taskId} style={{ ...styles.task, opacity: task.completed ? 0.5 : 1 }}>
          <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span>
          <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.taskId)} />
        </div>
      ))}

      {otherTasks.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ borderBottom: '1px solid #444', color: '#aaa' }}>TEAM</h3>
          {otherTasks.map(t => (
            <div key={t.taskId} style={{ padding: '10px', color: '#888' }}>
              <strong>{t.ownerName}:</strong> {t.text} {t.completed ? '✅' : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}