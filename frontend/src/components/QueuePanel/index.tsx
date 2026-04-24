import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { joinQueue, leaveQueue } from '../../api/client';

const ZONE_TYPE_COLORS: Record<string, string> = {
  gate:     'var(--cyan)',
  food:     'var(--orange)',
  washroom: 'var(--purple)',
};

const COLOR_LABEL: Record<string, string> = {
  green: 'LOW WAIT', yellow: 'MODERATE', red: 'HIGH WAIT', unknown: 'NO DATA',
};

const COLOR_HEX: Record<string, string> = {
  green: '#39ff14', yellow: '#ffbe00', red: '#ff3131', unknown: '#4a4a6e',
};

export default function QueuePanel() {
  const zones        = useStore((s) => s.zones);
  const selectedId   = useStore((s) => s.selectedZoneId);
  const setSelected  = useStore((s) => s.setSelectedZone);
  const uid          = useStore((s) => s.uid);
  const activeQueues = useStore((s) => s.activeQueues);
  const joinQ        = useStore((s) => s.joinQueue);
  const leaveQ       = useStore((s) => s.leaveQueue);
  const addPoints    = useStore((s) => s.addPoints);
  const addAlert     = useStore((s) => s.addAlert);

  const [loading, setLoading] = useState<string | null>(null);
  const [pointsFlash, setPointsFlash] = useState<{ zoneId: string; pts: number } | null>(null);

  async function handleJoin(zoneId: string) {
    if (!uid) return;
    setLoading(`join-${zoneId}`);
    try {
      const res = await joinQueue(zoneId, uid);
      joinQ(zoneId);
      const pts = res.data?.points_awarded ?? 5;
      addPoints(pts);
      setPointsFlash({ zoneId, pts });
      setTimeout(() => setPointsFlash(null), 2000);
      addAlert({
        id: `join-${Date.now()}`,
        zone: zoneId,
        zone_name: zones[zoneId]?.name ?? zoneId,
        message: `You joined the queue — ${pts} pts awarded!`,
        severity: 'success',
        expires_at: Date.now() + 5000,
      });
    } catch {
      addAlert({ id: `err-${Date.now()}`, zone: zoneId, zone_name: '', message: 'Could not reach server. Retrying…', severity: 'danger', expires_at: Date.now() + 4000 });
    } finally {
      setLoading(null);
    }
  }

  async function handleLeave(zoneId: string) {
    if (!uid) return;
    setLoading(`leave-${zoneId}`);
    try {
      const res = await leaveQueue(zoneId, uid);
      leaveQ(zoneId);
      const pts = res.data?.points_awarded ?? 2;
      addPoints(pts);
      addAlert({
        id: `leave-${Date.now()}`,
        zone: zoneId,
        zone_name: zones[zoneId]?.name ?? zoneId,
        message: `Thanks for reporting! +${pts} pts`,
        severity: 'info',
        expires_at: Date.now() + 4000,
      });
    } catch {
      addAlert({ id: `err-${Date.now()}`, zone: zoneId, zone_name: '', message: 'Could not reach server.', severity: 'danger', expires_at: Date.now() + 4000 });
    } finally {
      setLoading(null);
    }
  }

  // All zones sorted by congestion
  const zoneList = Object.values(zones).sort((a, b) => b.active_users - a.active_users);
  const zone = selectedId ? zones[selectedId] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Selected zone detail */}
      <AnimatePresence mode="wait">
        {zone && (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            style={{
              margin: '0.75rem',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${COLOR_HEX[zone.color]}40`,
              background: `linear-gradient(135deg, ${COLOR_HEX[zone.color]}10, var(--bg-card))`,
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '1rem' }}
            >✕</button>

            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: 4 }}>
              {zone.type}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              {zone.name}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.9rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: COLOR_HEX[zone.color], fontWeight: 900, lineHeight: 1 }}>
                  {zone.avg_wait_seconds > 0 ? `${Math.ceil(zone.avg_wait_seconds / 60)}m` : '—'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>EST. WAIT</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--cyan)', fontWeight: 900, lineHeight: 1 }}>
                  {zone.active_users}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>IN QUEUE</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: COLOR_HEX[zone.color],
                  background: `${COLOR_HEX[zone.color]}18`,
                  padding: '0.3rem 0.6rem',
                  borderRadius: 20,
                  border: `1px solid ${COLOR_HEX[zone.color]}40`,
                }}>
                  {COLOR_LABEL[zone.color]}
                </div>
              </div>
            </div>

            {/* Points flash */}
            <AnimatePresence>
              {pointsFlash?.zoneId === zone.id && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.8 }}
                  animate={{ opacity: 1, y: -8, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{
                    position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                    fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 900,
                    color: 'var(--green)', textShadow: 'var(--green-glow)', pointerEvents: 'none',
                  }}
                >
                  +{pointsFlash.pts} PTS ⚡
                </motion.div>
              )}
            </AnimatePresence>

            <div className="zone-actions">
              {!activeQueues.has(zone.id) ? (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={loading === `join-${zone.id}`}
                  onClick={() => handleJoin(zone.id)}
                >
                  {loading === `join-${zone.id}` ? <span className="spinner" /> : ''}
                  🟢 JOIN QUEUE (+5 pts)
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={loading === `leave-${zone.id}`}
                  onClick={() => handleLeave(zone.id)}
                >
                  {loading === `leave-${zone.id}` ? <span className="spinner" /> : ''}
                  🔴 LEAVE QUEUE (+2 pts)
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone list */}
      <div style={{ padding: '0 0.75rem 0.25rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>
        ALL ZONES — TAP TO SELECT
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 0.75rem 0.75rem' }}>
        {zoneList.map((z) => (
          <motion.div
            key={z.id}
            whileHover={{ x: 3 }}
            onClick={() => setSelected(z.id === selectedId ? null : z.id)}
            style={{
              padding: '0.75rem 1rem',
              marginBottom: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${z.id === selectedId ? COLOR_HEX[z.color] + '60' : 'var(--border)'}`,
              background: z.id === selectedId ? `${COLOR_HEX[z.color]}10` : 'var(--bg-card)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: COLOR_HEX[z.color],
              boxShadow: `0 0 8px ${COLOR_HEX[z.color]}`,
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem' }}>{z.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                {z.active_users} in queue · {z.avg_wait_seconds > 0 ? `~${Math.ceil(z.avg_wait_seconds / 60)} min` : 'no data'}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: COLOR_HEX[z.color], fontWeight: 700 }}>
              {COLOR_LABEL[z.color]}
            </div>
            {activeQueues.has(z.id) && (
              <div style={{
                background: 'var(--cyan-dim)', border: '1px solid rgba(0,245,255,0.3)',
                borderRadius: 20, padding: '0.1rem 0.5rem',
                fontSize: '0.65rem', color: 'var(--cyan)', fontFamily: 'var(--font-heading)', fontWeight: 700,
              }}>
                IN QUEUE
              </div>
            )}
          </motion.div>
        ))}
        {zoneList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📡</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem' }}>
              Waiting for live data…
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Connect to backend to see zones</div>
          </div>
        )}
      </div>
    </div>
  );
}
