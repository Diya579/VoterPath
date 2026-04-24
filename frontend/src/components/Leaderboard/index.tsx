import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '../../firebase/config';
import { useStore, LeaderboardEntry } from '../../store';
import { getLeaderboard } from '../../api/client';

const MEDAL = ['🥇', '🥈', '🥉'];

function RankCard({ entry, rank, isMe }: { entry: LeaderboardEntry; rank: number; isMe: boolean }) {
  const initials = entry.displayName.slice(0, 2).toUpperCase();
  const medal = MEDAL[rank] ?? null;
  const topClass = rank < 3 ? `top-${rank + 1}` : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      className={`rank-card ${topClass}`}
      style={isMe ? { borderColor: 'var(--cyan)', boxShadow: 'var(--cyan-glow)' } : {}}
    >
      <div className="rank-number" style={{ color: rank < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][rank] : 'rgba(255,255,255,0.4)' }}>
        {medal ?? `#${rank + 1}`}
      </div>
      <div className="rank-avatar" style={isMe ? { background: 'linear-gradient(135deg, var(--pink), var(--purple))' } : {}}>
        {initials}
      </div>
      <div className="rank-info">
        <div className="rank-name">
          {entry.displayName}
          {isMe && <span style={{ fontSize: '0.72rem', color: 'var(--cyan)', marginLeft: 6, fontFamily: 'var(--font-heading)' }}>YOU</span>}
        </div>
        <div className="rank-stats">
          {entry.gamesPlayed} games · {entry.predictionsCorrect} predictions
        </div>
      </div>
      <div className="rank-points">
        {entry.points.toLocaleString()}
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginLeft: 3 }}>PTS</span>
      </div>
    </motion.div>
  );
}

export default function LeaderboardComponent() {
  const { leaderboard, setLeaderboard, uid } = useStore();

  // Firestore live listener (preferred) OR REST fallback
  useEffect(() => {
    if (isFirebaseConfigured) {
      const q = query(
        collection(firestore, 'users'),
        orderBy('points', 'desc'),
        limit(20)
      );
      const unsub = onSnapshot(q, (snap) => {
        const entries: LeaderboardEntry[] = snap.docs.map((d) => ({
          uid: d.id,
          displayName: d.data().displayName ?? 'Anonymous',
          points: d.data().points ?? 0,
          gamesPlayed: d.data().gamesPlayed ?? 0,
          predictionsCorrect: d.data().predictionsCorrect ?? 0,
        }));
        setLeaderboard(entries);
      });
      return unsub;
    } else {
      // REST fallback
      getLeaderboard()
        .then((res) => setLeaderboard(res.data))
        .catch(() => {});
    }
  }, []);

  return (
    <div>
      <AnimatePresence>
        {leaderboard.map((entry, i) => (
          <RankCard key={entry.uid} entry={entry} rank={i} isMe={entry.uid === uid} />
        ))}
      </AnimatePresence>
      {leaderboard.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏆</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>No rankings yet</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>Be the first to join a queue!</div>
        </div>
      )}
    </div>
  );
}
