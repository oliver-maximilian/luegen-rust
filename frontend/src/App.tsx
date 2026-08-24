import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import { Button, Pill } from './components/Ui';
import { HomePage } from './pages/HomePage';
import { RoomPage } from './pages/RoomPage';
import { DebugPage } from './pages/DebugPage';
import { Footer } from './components/Footer';

function Shell() {
  const navigate = useNavigate();
  const { session } = useSession();

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => navigate('/')}>
          <span className="brand__mark">L</span>
          <span className="brand__text">
            <strong>Lügen</strong>
            <small>Bluff, Tisch, Spannung</small>
          </span>
        </button>

        <nav className="topbar__nav">
          <Button variant="ghost" onClick={() => navigate('/')}>Start</Button>
          <Button variant="ghost" onClick={() => navigate('/room')} disabled={!session}>Spiel</Button>
          <Button variant="ghost" onClick={() => navigate('/debug')}>Debug</Button>
        </nav>

        <div className="topbar__session">
          {session ? <Pill tone="neutral">{session.playerName}</Pill> : <Pill tone="neutral">Offline</Pill>}
        </div>
      </header>

      <main className="main-stage">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room" element={<RoomPage />} />
          <Route path="/debug" element={<DebugPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export function App() {
  return (
    <SessionProvider>
      <Shell />
    </SessionProvider>
  );
}