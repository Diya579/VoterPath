import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { suggestRoute, submitBeatRush } from '../../api/client';

const ZONE_OPTIONS = [
  { id: 'gate_n',  label: '🚪 Gate North'    },
  { id: 'gate_s',  label: '🚪 Gate South'    },
  { id: 'gate_e',  label: '🚪 Gate East'     },
  { id: 'gate_w',  label: '🚪 Gate West'     },
  { id: 'food_ne', label: '🍔 Food Court NE' },
  { id: 'food_sw', label: '🍔 Food Court SW' },
  { id: 'wash_nw', label: '🚻 Washroom NW'   },
  { id: 'wash_se', label: '🚻 Washroom SE'   },
];

type Phase = 'setup' | 'navigating' | 'result';

export default function BeatTheRush() {
  const uid      = useStore((s) => s.uid);
  const addPoints = useStore((s) => s.addPoints);
  const addAlert = useStore((s) => s.addAlert);

  const [phase, setPhase]       = useState<Phase>('setup');
  const [fromZone, setFromZone] = useState('gate_n');
  const [toZone, setToZone]     = useState('food_ne');
  const [route, setRoute]       = useState<string[]>([]);
  const [elapsed, setElapsed]   = useState(0);
  const [result, setResult]     = useState<{ won: boolean; pts: number } | null>(null);
  const [loading, setLoading]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === 'navigating') {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  async function startGame() {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await suggestRoute(fromZone, toZone, uid);
      setRoute(res.data.primary ?? []);
      setPhase('navigating');
    } catch {
      addAlert({ id: `err-${Date.now()}`, zone: '', zone_name: '', message: 'Could not load route. Is the backend running?', severity: 'danger', expires_at: Date.now() + 5000 });
    } finally {
      setLoading(false);
    }
  }

  async function submitResult(followed: boolean) {
    if (!uid) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);
    try {
      const res = await submitBeatRush(uid, fromZone, toZone, followed);
      const pts = res.data?.points_awarded ?? 0;
      const won = res.data?.won ?? followed;
      setResult({ won, pts });
      if (pts > 0) addPoints(pts);
      setPhase('result');
    } catch {
      setResult({ won: followed, pts: followed ? 20 : 0 });
      setPhase('result');
    } finally {
      setLoading(false);
    }
  }

  function reset() { setPhase('setup'); setRoute([]); setResult(null); setElapsed(0); }

  const ZONE_LABEL: Record<string, string> = Object.fromEntries(ZONE_OPTIONS.map((z) => [z.id, z.label]));
  const selectStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'rgba(255,255,255,0.85)',
    fontFamily: 'var(--font-heading)', fontSize: '0.9rem', padding: '0.5rem 0.75rem',
    outline: 'none', cursor: 'pointer',
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="game-description">
              Get the optimal route from the system, then navigate it for real. 
              Confirm you followed it to earn <strong style={{ color: 'var(--cyan)' }}>+20 points</strong>!
            </p>
            <div className="game-reward">⚡ Reward: Up to +20 PTS</div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)', display: 'block', marginBottom: '0.3rem' }}>FROM</label>
              <select style={selectStyle} value={fromZone} onChange={(e) => setFromZone(e.target.value)}>
                {ZONE_OPTIONS.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)', display: 'block', marginBottom: '0.3rem' }}>TO</label>
              <select style={selectStyle} value={toZone} onChange={(e) => setToZone(e.target.value)}>
                {ZONE_OPTIONS.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={startGame} disabled={loading || fromZone === toZone}>
              {loading ? <span className="spinner" /> : '🏃'} START CHALLENGE
            </button>
          </motion.div>
        )}

        {phase === 'navigating' && (
          <motion.div key="nav" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cyan)', fontWeight: 900 }}>
                {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)' }}>TIME ELAPSED</div>
            </div>

            <div style={{ marginBottom: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                FOLLOW THIS ROUTE
              </div>
              {route.map((id, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--pink)' : i === route.length - 1 ? 'var(--green)' : 'var(--cyan)', boxShadow: `0 0 6px ${i === 0 ? 'var(--pink)' : i === route.length - 1 ? 'var(--green)' : 'var(--cyan)'}` }} />
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem' }}>{ZONE_LABEL[id] ?? id}</span>
                  {i < route.length - 1 && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>→</span>}
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem', textAlign: 'center' }}>
              Navigate to your destination, then confirm below:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={() => submitResult(true)} disabled={loading}>
                {loading ? <span className="spinner" /> : '✅'} Followed Route
              </button>
              <button className="btn btn-ghost" onClick={() => submitResult(false)} disabled={loading}>
                ❌ Took Different Path
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{result.won ? '🏆' : '😅'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: result.won ? 'var(--green)' : 'var(--yellow)', marginBottom: '0.3rem' }}>
              {result.won ? 'BEAT THE RUSH!' : 'NEXT TIME!'}
            </div>
            {result.pts > 0 && (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--cyan)', marginBottom: '1rem' }}>
                +{result.pts} PTS EARNED ⚡
              </div>
            )}
            <button className="btn btn-primary" onClick={reset}>🔄 PLAY AGAIN</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
