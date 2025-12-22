import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { login } = useAuth();

  return (
    <div class="hero">
      <h1>Procrastinot</h1>
      <p>Stop stalling. Start Studying.</p>
      
      <div class="stats-preview">
        {/* Fake "Cool Numbers" for unauthenticated users */}
        <div class="stat-box">
          <h3>10k+</h3>
          <p>Hours Focused</p>
        </div>
        <div class="stat-box">
          <h3>5k+</h3>
          <p>Tasks Crushed</p>
        </div>
      </div>

      <button onClick={login} class="btn-primary">
        Sign in with Google
      </button>
    </div>
  );
}