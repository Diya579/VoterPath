import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import AlertToastContainer from './components/Alerts/AlertToast';
import MapPage from './pages/MapPage';
import LeaderboardPage from './pages/LeaderboardPage';
import GamesPage from './pages/GamesPage';
import { useStore } from './store';
import { ensureAnonymousAuth, isFirebaseConfigured } from './firebase/config';
import { useQueueRTDB } from './hooks/useQueueRTDB';
import { useGeolocation } from './hooks/useGeolocation';
import { useWebSocket } from './hooks/useWebSocket';
import { getQueueStatus } from './api/client';

function AppInner() {
  const { uid, setUser, setZones } = useStore();

  // Hooks
  useQueueRTDB();
  useGeolocation();
  useWebSocket(uid);

  useEffect(() => {
    // Anonymous Firebase auth
    if (isFirebaseConfigured) {
      ensureAnonymousAuth().then((user) => {
        const name = localStorage.getItem('pp_name') || `Player_${user.uid.slice(0, 6)}`;
        const pts  = Number(localStorage.getItem('pp_pts') || '0');
        localStorage.setItem('pp_uid', user.uid);
        setUser(user.uid, name, pts);
      }).catch(() => {
        // Fallback if auth fails (e.g. Anonymous Auth disabled in console)
        let localUid = localStorage.getItem('pp_uid');
        if (!localUid) {
          localUid = 'local_' + Math.random().toString(36).slice(2, 10);
          localStorage.setItem('pp_uid', localUid);
        }
        const name = localStorage.getItem('pp_name') || `Player_${localUid.slice(6, 12)}`;
        const pts  = Number(localStorage.getItem('pp_pts') || '0');
        setUser(localUid, name, pts);
      });
    } else {
      // Offline / unconfigured mode — generate a local ID
      let uid = localStorage.getItem('pp_uid');
      if (!uid) {
        uid = 'local_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('pp_uid', uid);
      }
      const name = localStorage.getItem('pp_name') || `Player_${uid.slice(6, 12)}`;
      const pts  = Number(localStorage.getItem('pp_pts') || '0');
      setUser(uid, name, pts);
    }

    // Initial REST poll for zone status
    getQueueStatus()
      .then((r) => {
        const data = r.data;
        const zones: ReturnType<typeof useStore.getState>['zones'] = {};
        Object.entries(data).forEach(([id, v]) => {
          zones[id] = {
            id,
            name: id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            type: id.startsWith('gate') ? 'gate' : id.startsWith('food') ? 'food' : 'washroom',
            active_users: v.active_users,
            avg_wait_seconds: v.avg_wait_seconds,
            color: v.color as 'green' | 'yellow' | 'red',
            svg_x: 0,
            svg_y: 0,
          };
        });
        setZones(zones);
      })
      .catch(() => {}); // Backend offline is OK
  }, []);

  // Persist points
  const pts = useStore((s) => s.points);
  useEffect(() => {
    localStorage.setItem('pp_pts', String(pts));
  }, [pts]);

  return (
    <div className="app-shell">
      <Navbar />
      <AlertToastContainer />
      <div className="page-content">
        <Routes>
          <Route path="/"            element={<MapPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/games"       element={<GamesPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppInner />
    </BrowserRouter>
  );
}
