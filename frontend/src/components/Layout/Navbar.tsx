import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../store';

const NAV_ITEMS = [
  { to: '/',            icon: '🏟️',  label: 'LIVE MAP'     },
  { to: '/leaderboard', icon: '🏆',  label: 'LEADERBOARD'  },
  { to: '/games',       icon: '🎮',  label: 'GAMES'        },
];

export default function Navbar() {
  const { displayName, points, wsConnected } = useStore();
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        <div className="logo-icon">⚡</div>
        <div>
          <div className="logo-text">PULSEPLAY</div>
          <div className="logo-sub">Stadium Experience</div>
        </div>
      </NavLink>

      {/* WS status dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '1rem' }}>
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: wsConnected ? 'var(--green)' : 'var(--red)',
            boxShadow: wsConnected ? 'var(--green-glow)' : 'var(--red-glow)',
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)' }}>
          {wsConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      <nav className="navbar-nav">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="navbar-user">
        <div className="user-avatar">{initials}</div>
        <div>
          <div className="user-points">⚡ {points.toLocaleString()} PTS</div>
        </div>
      </div>
    </nav>
  );
}
