import LeaderboardComponent from '../components/Leaderboard';
import { useStore } from '../store';

export default function LeaderboardPage() {
  const { uid, displayName, points } = useStore();

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <div className="leaderboard-title">⚡ LEADERBOARD</div>
        <div className="leaderboard-subtitle">Top contributors to crowd optimization · Updates live</div>
      </div>

      {/* My stats */}
      <div style={{
        padding: '1rem 1.25rem',
        marginBottom: '1.75rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(0,245,255,0.25)',
        background: 'linear-gradient(135deg, rgba(0,245,255,0.07), var(--bg-card))',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700,
        }}>
          {displayName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>
            {displayName} <span style={{ fontSize: '0.72rem', color: 'var(--cyan)', marginLeft: 4 }}>YOU</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            UID: {uid?.slice(0, 12) ?? '—'}…
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cyan)', fontWeight: 900, textShadow: '0 0 12px rgba(0,245,255,0.5)' }}>
            {points.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)' }}>YOUR POINTS</div>
        </div>
      </div>

      {/* Leaderboard */}
      <LeaderboardComponent />
    </div>
  );
}
