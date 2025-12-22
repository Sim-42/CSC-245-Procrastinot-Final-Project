import { useEffect, useState } from 'preact/hooks';
import { fetchWithAuth } from '../api';
import { auth } from '../firebase';

export default function Session({ user, room, goBack }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  
  // 1. Fetch Tasks (Poll every 3 seconds so we see other people's updates)
  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  const getToken = () => auth.currentUser?.getIdToken();

  const loadTasks = async () => {
    const token = await getToken();
    try {
      const data = await fetchWithAuth(`/rooms/${room.roomId}/tasks`, token);
      setTasks(data);
    } catch (e) { console.error(e); }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const token = await getToken();
    await fetchWithAuth(`/rooms/${room.roomId}/tasks`, token, {
      method: 'POST',
      body: JSON.stringify({ text: newTask })
    });
    setNewTask('');
    loadTasks(); // Refresh immediately
  };

  const handleToggle = async (taskId) => {
    const token = await getToken();
    try {
      await fetchWithAuth(`/rooms/${room.roomId}/tasks/${taskId}`, token, { method: 'PATCH' });
      loadTasks();
    } catch (e) { alert("You can't complete other people's tasks!"); }
  };

  // Split tasks into "Mine" and "Others"
  const myTasks = tasks.filter(t => t.owner === user.uid);
  const otherTasks = tasks.filter(t => t.owner !== user.uid);

  // Styles
  const containerStyle = { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' };
  const headerStyle = { borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const sectionStyle = { marginBottom: '40px' };
  const taskStyle = { padding: '15px', border: '1px solid #ddd', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{room.name}</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Code: {room.inviteCode}</p>
        </div>
        <button onClick={goBack} style={{ background: '#000', color: '#fff', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>Exit Session</button>
      </header>

      {/* Add Task Form */}
      <div style={{ background: '#f5f5f5', padding: '20px', marginBottom: '40px' }}>
        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '10px' }}>
          <input 
            value={newTask} 
            onInput={e => setNewTask(e.target.value)} 
            placeholder="Add a new task..." 
            style={{ flex: 1, padding: '12px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ background: '#000', color: '#fff', border: 'none', padding: '10px 20px' }}>Add</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* MY TASKS */}
        <section>
          <h3 style={{ borderBottom: '1px solid #000', paddingBottom: '10px' }}>MY TASKS</h3>
          {myTasks.length === 0 && <p style={{ color: '#999' }}>No tasks yet.</p>}
          {myTasks.map(task => (
            <div key={task.taskId} style={{ ...taskStyle, background: task.completed ? '#eeffee' : '#fff' }}>
              <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span>
              <input 
                type="checkbox" 
                checked={task.completed} 
                onChange={() => handleToggle(task.taskId)}
                style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
              />
            </div>
          ))}
        </section>

        {/* OTHERS TASKS */}
        <section>
          <h3 style={{ borderBottom: '1px solid #000', paddingBottom: '10px' }}>TEAM TASKS</h3>
          {otherTasks.length === 0 && <p style={{ color: '#999' }}>Others are quiet.</p>}
          {otherTasks.map(task => (
            <div key={task.taskId} style={{ ...taskStyle, background: '#fafafa', color: '#555' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '4px' }}>{task.ownerName}</div>
                <div style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</div>
              </div>
              {task.completed && <span>✅</span>}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}