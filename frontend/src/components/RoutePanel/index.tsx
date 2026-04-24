import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore, RouteResult } from '../../store';
import { suggestRoute } from '../../api/client';

const ZONE_OPTIONS = [
  { id: 'gate_n',  label: '🚪 Gate North'     },
  { id: 'gate_s',  label: '🚪 Gate South'     },
  { id: 'gate_e',  label: '🚪 Gate East'      },
  { id: 'gate_w',  label: '🚪 Gate West'      },
  { id: 'food_ne', label: '🍔 Food Court NE'  },
  { id: 'food_sw', label: '🍔 Food Court SW'  },
  { id: 'wash_nw', label: '🚻 Washroom NW'    },
  { id: 'wash_se', label: '🚻 Washroom SE'    },
];

const ZONE_LABEL: Record<string, string> = Object.fromEntries(
  ZONE_OPTIONS.map((z) => [z.id, z.label])
);

export default function RoutePanel({ onRoute }: { onRoute: (r: RouteResult | null) => void }) {
  const uid      = useStore((s) => s.uid);
  const addAlert = useStore((s) => s.addAlert);
  const addPoints = useStore((s) => s.addPoints);

  const [fromZone, setFromZone] = useState('gate_n');
  const [toZone, setToZone]     = useState('food_ne');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<RouteResult | null>(null);

  async function handleGetRoute() {
    if (!uid || fromZone === toZone) return;
    setLoading(true);
    try {
      const res = await suggestRoute(fromZone, toZone, uid);
      const data: RouteResult = res.data;
      setResult(data);
      onRoute(data);
      if (data.time_saved > 0) {
        addPoints(10);
        addAlert({
          id: `route-${Date.now()}`,
          zone: toZone,
          zone_name: ZONE_LABEL[toZone] ?? toZone,
          message: `Route found! Save ~${Math.round(data.time_saved)} min by avoiding congestion.`,
          severity: 'success',
          expires_at: Date.now() + 8000,
        });
      }
    } catch {
      addAlert({ id: `err-${Date.now()}`, zone: '', zone_name: '', message: 'Route service unavailable.', severity: 'danger', expires_at: Date.now() + 4000 });
    } finally {
      setLoading(false);
    }
  }

  const selectStyle = {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.9rem',
    padding: '0.5rem 0.75rem',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: '0.75rem' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
          FROM
        </div>
        <select style={selectStyle} value={fromZone} onChange={(e) => setFromZone(e.target.value)}>
          {ZONE_OPTIONS.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '0.85rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
          TO
        </div>
        <select style={selectStyle} value={toZone} onChange={(e) => setToZone(e.target.value)}>
          {ZONE_OPTIONS.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
        </select>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={handleGetRoute}
        disabled={loading || fromZone === toZone}
      >
        {loading ? <span className="spinner" /> : '🗺️'}
        {loading ? 'Calculating…' : 'GET OPTIMAL ROUTE'}
      </button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: '1rem' }}
        >
          {/* Time saved */}
          {result.time_saved > 0 && (
            <div className="time-saved-badge">
              ⚡ Save ~{Math.round(result.time_saved)} min vs. direct route
            </div>
          )}

          {/* Primary route */}
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              PRIMARY ROUTE · {Math.round(result.primary_time)} MIN
            </div>
            {result.primary.map((zoneId, i) => (
              <div key={i} className="route-step">
                <div className="route-dot" style={{ background: i === 0 ? 'var(--pink)' : i === result.primary.length - 1 ? 'var(--green)' : 'var(--cyan)' }} />
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                  {ZONE_LABEL[zoneId] ?? zoneId}
                </span>
                {i === 0 && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>START</span>}
                {i === result.primary.length - 1 && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--green)' }}>DEST</span>}
              </div>
            ))}
          </div>

          {/* Alternate route */}
          {result.alternate.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                ALTERNATE · {Math.round(result.alternate_time)} MIN
              </div>
              <div style={{
                padding: '0.6rem 0.85rem',
                background: 'rgba(255,0,110,0.06)',
                border: '1px solid rgba(255,0,110,0.2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                color: 'rgba(255,255,255,0.65)',
                fontFamily: 'var(--font-heading)',
              }}>
                {result.alternate.map((id) => ZONE_LABEL[id] ?? id).join(' → ')}
              </div>
            </div>
          )}

          {/* Congestion avoided */}
          {result.congestion_avoided.length > 0 && (
            <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: 'rgba(255,190,0,0.8)' }}>
              ⚠️ Avoiding: {result.congestion_avoided.map((id) => ZONE_LABEL[id] ?? id).join(', ')}
            </div>
          )}

          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', marginTop: '0.75rem' }}
            onClick={() => { setResult(null); onRoute(null); }}
          >
            ✕ CLEAR ROUTE
          </button>
        </motion.div>
      )}
    </div>
  );
}
