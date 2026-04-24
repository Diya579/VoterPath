import { useState } from 'react';
import StadiumMap from '../components/Map/StadiumMap';
import SeatSelector from '../components/Map/SeatSelector';
import QueuePanel from '../components/QueuePanel';
import RoutePanel from '../components/RoutePanel';
import { useStore, RouteResult } from '../store';
import { isFirebaseConfigured } from '../firebase/config';
import { getPredictions } from '../api/client';
import { useEffect } from 'react';

type SideTab = 'queue' | 'route' | 'alerts';

export default function MapPage() {
  const [activeTab, setActiveTab]   = useState<SideTab>('queue');
  const [mapRoute, setMapRoute]     = useState<RouteResult | null>(null);
  const { predictions, setPredictions, alerts, wsConnected } = useStore();

  useEffect(() => {
    // Poll predictions every 30s
    const load = () => getPredictions().then((r) => setPredictions(r.data)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="map-page">
      {/* ── Map ── */}
      <div className="map-container" style={{ position: 'relative' }}>
        <SeatSelector />
        {!isFirebaseConfigured && (
          <div className="config-banner" style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, maxWidth: 460 }}>
            ⚙️ <strong>Firebase not configured</strong> — copy <code>.env.example</code> to <code>.env</code> and add your credentials. The map will populate once users interact.
          </div>
        )}
        <StadiumMap route={mapRoute} />
      </div>

      {/* ── Side Panel ── */}
      <div className="side-panel">
        <div className="side-panel-tabs">
          {([['queue', '📡 QUEUES'], ['route', '🗺️ ROUTE'], ['alerts', `🔔 ALERTS${alerts.length > 0 ? ` (${alerts.length})` : ''}`]] as [SideTab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              className={`side-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="side-panel-body">
          {activeTab === 'queue' && <QueuePanel />}

          {activeTab === 'route' && (
            <RoutePanel onRoute={setMapRoute} />
          )}

          {activeTab === 'alerts' && (
            <div>
              {/* Crowd predictions */}
              {predictions.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                    CROWD PREDICTIONS
                  </div>
                  {predictions.map((p, i) => (
                    <div key={i} style={{
                      padding: '0.85rem 1rem', marginBottom: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255,190,0,0.25)',
                      background: 'rgba(255,190,0,0.05)',
                    }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: 2 }}>
                        ⚠️ {p.zone_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                        {p.reason} — crowded in ~{p.eta_minutes} min
                      </div>
                      <div style={{
                        height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', width: `${p.probability * 100}%`,
                          background: `linear-gradient(90deg, var(--yellow), var(--red))`,
                          borderRadius: 2, transition: 'width 0.5s',
                        }} />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,190,0,0.7)', marginTop: 4 }}>
                        {Math.round(p.probability * 100)}% confidence
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Alert history */}
              {alerts.length > 0 ? (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                    RECENT ALERTS
                  </div>
                  {alerts.map((a) => (
                    <div key={a.id} style={{
                      padding: '0.7rem 0.85rem', marginBottom: '0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      fontSize: '0.82rem',
                    }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, marginBottom: 2 }}>{a.zone_name || 'System'}</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)' }}>{a.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
                  <div style={{ fontFamily: 'var(--font-heading)' }}>No alerts right now</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>You're good to go!</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
