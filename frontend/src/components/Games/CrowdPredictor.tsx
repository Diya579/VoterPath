import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { submitPrediction, checkPrediction } from '../../api/client';

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

type Phase = 'pick' | 'waiting' | 'result';

export default function CrowdPredictor() {
  const uid      = useStore((s) => s.uid);
  const zones    = useStore((s) => s.zones);
  const addPoints = useStore((s) => s.addPoints);
  const addAlert = useStore((s) => s.addAlert);

  const [selected,     setSelected]     = useState<string | null>(null);
  const [phase,        setPhase]        = useState<Phase>('pick');
  const [countdown,    setCountdown]    = useState(300); // 5 min
  const [predId,       setPredId]       = useState<string | null>(null);
  const [result,       setResult]       = useState<{ correct: boolean; actual: string; pts: number } | null>(null);
  const [loading,      setLoading]      = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timers on unmount
  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (pollRef.current)      clearInterval(pollRef.current);
  }, []);

  const [locked,       setLocked]       = useState(false);

  async function submitGuess() {
    if (!uid || !selected) return;
    setLoading(true);
    try {
      await submitPrediction(uid, selected);
      setLocked(true);
      
      // Show confirmation for 1s before moving to waiting phase
      setTimeout(() => {
        setLocked(false);
        const id = `pred-${Date.now()}`;
        setPredId(id);
        setPhase('waiting');
        setCountdown(300);

        // Countdown timer
        countdownRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              resolveResult(id);
              return 0;
            }
            return c - 1;
          });
        }, 1000);

        // Poll for early result every 30s
        pollRef.current = setInterval(() => resolveResult(id), 30000);
      }, 1000);

    } catch {
      addAlert({ id: `err-${Date.now()}`, zone: '', zone_name: '', message: 'Could not submit prediction.', severity: 'danger', expires_at: Date.now() + 4000 });
    } finally {
      setLoading(false);
    }
  }

  async function resolveResult(id: string) {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (pollRef.current)      clearInterval(pollRef.current);
    try {
      const res = await checkPrediction(id);
      const { correct, actual_zone, points_awarded } = res.data;
      const actualLabel = ZONE_OPTIONS.find((z) => z.id === actual_zone)?.label ?? actual_zone;
      setResult({ correct, actual: actualLabel, pts: points_awarded ?? 0 });
      if (points_awarded > 0) addPoints(points_awarded);
      setPhase('result');
    } catch {
      // Fallback: use live zone data to find most congested
      const sorted = Object.values(zones).sort((a, b) => b.active_users - a.active_users);
      const actualId = sorted[0]?.id ?? 'gate_n';
      const correct = actualId === selected;
      const actualLabel = ZONE_OPTIONS.find((z) => z.id === actualId)?.label ?? actualId;
      const pts = correct ? 15 : 0;
      setResult({ correct, actual: actualLabel, pts });
      if (pts > 0) addPoints(pts);
      setPhase('result');
    }
  }

  function reset() { setPhase('pick'); setSelected(null); setResult(null); setCountdown(300); setPredId(null); }

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div>
      <AnimatePresence mode="wait">
        {phase === 'pick' && (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="game-description">
              Which zone will become the most crowded in the next <strong style={{ color: 'var(--cyan)' }}>5 minutes</strong>?
              Correct predictions earn <strong style={{ color: 'var(--cyan)' }}>+15 points</strong>!
            </p>
            <div className="game-reward">⚡ Reward: +15 PTS for correct guess</div>

            <div className="zone-picker">
              {ZONE_OPTIONS.map((z) => (
                <motion.button
                  key={z.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ 
                    scale: selected === z.id ? 1.05 : 1,
                    boxShadow: selected === z.id ? '0 0 15px rgba(0, 245, 255, 0.4)' : 'none'
                  }}
                  className={`zone-pick-btn${selected === z.id ? ' selected' : ''}`}
                  onClick={() => setSelected(z.id)}
                >
                  {z.label}
                  {/* Show live user count if available */}
                  {zones[z.id] && (
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      {zones[z.id].active_users} users
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              className={`btn ${locked ? 'btn-green' : 'btn-pink'}`}
              style={{ width: '100%', marginTop: '0.5rem', minHeight: '44px' }}
              onClick={submitGuess}
              disabled={!selected || loading || locked}
            >
              {locked ? (
                <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  ✅ LOCKED IN
                </motion.span>
              ) : loading ? (
                <span className="spinner" />
              ) : (
                '🔮 LOCK IN PREDICTION'
              )}
            </motion.button>
          </motion.div>
        )}

        {phase === 'waiting' && (
          <motion.div key="wait" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔮</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
              YOUR PREDICTION
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cyan)', fontWeight: 700, marginBottom: '1.5rem' }}>
              {ZONE_OPTIONS.find((z) => z.id === selected)?.label}
            </div>

            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 900, color: 'var(--yellow)', lineHeight: 1 }}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)', marginTop: 4, marginBottom: '1.25rem' }}>
              UNTIL RESULTS
            </div>

            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', animation: 'blink 1.5s infinite' }}>
              📡 Monitoring live crowd data…
            </div>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{result.correct ? '🎯' : '❌'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900, color: result.correct ? 'var(--green)' : 'var(--red)', marginBottom: '0.5rem' }}>
              {result.correct ? 'CORRECT!' : 'WRONG!'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.5rem' }}>
              Most crowded was: <strong style={{ color: 'var(--yellow)' }}>{result.actual}</strong>
            </div>
            {result.pts > 0 && (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cyan)', marginBottom: '1rem' }}>
                +{result.pts} PTS ⚡
              </div>
            )}
            <button className="btn btn-pink" onClick={reset}>🔄 PREDICT AGAIN</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
