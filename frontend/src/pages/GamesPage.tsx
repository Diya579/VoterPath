import BeatTheRush from '../components/Games/BeatTheRush';
import CrowdPredictor from '../components/Games/CrowdPredictor';

export default function GamesPage() {
  return (
    <div className="games-page">
      <div style={{ marginBottom: '1rem' }}>
        <div className="section-title">🎮 MINI-GAMES</div>
        <div className="section-sub">Earn points · Contribute to crowd optimization · Beat the stadium</div>
      </div>

      <div className="games-grid">
        {/* Beat the Rush */}
        <div className="game-card">
          <div className="game-card-header">
            <div className="game-icon" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(124,58,237,0.2))', border: '1px solid rgba(0,245,255,0.2)' }}>
              🏃
            </div>
            <div>
              <div className="game-title">BEAT THE RUSH</div>
              <div className="game-subtitle">Follow the optimal route</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div className="stat-chip">Reward <span>+20 PTS</span></div>
            <div className="stat-chip">Type <span>Navigation</span></div>
          </div>

          <BeatTheRush />
        </div>

        {/* Crowd Predictor */}
        <div className="game-card">
          <div className="game-card-header">
            <div className="game-icon" style={{ background: 'linear-gradient(135deg, rgba(255,0,110,0.2), rgba(124,58,237,0.2))', border: '1px solid rgba(255,0,110,0.2)' }}>
              🔮
            </div>
            <div>
              <div className="game-title">CROWD PREDICTOR</div>
              <div className="game-subtitle">Guess the next hot zone</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div className="stat-chip">Reward <span>+15 PTS</span></div>
            <div className="stat-chip">Window <span>5 min</span></div>
          </div>

          <CrowdPredictor />
        </div>
      </div>
    </div>
  );
}
