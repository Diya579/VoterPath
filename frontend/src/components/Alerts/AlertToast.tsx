import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore, Alert } from '../../store';

const SEVERITY_META = {
  info:    { icon: 'ℹ️',  label: 'INFO'    },
  warning: { icon: '⚠️',  label: 'WARNING' },
  danger:  { icon: '🚨',  label: 'ALERT'   },
  success: { icon: '✅',  label: 'SUCCESS' },
};

function Toast({ alert }: { alert: Alert }) {
  const dismissAlert = useStore((s) => s.dismissAlert);
  const meta = SEVERITY_META[alert.severity];

  // Auto-dismiss
  useEffect(() => {
    const remaining = alert.expires_at - Date.now();
    if (remaining <= 0) { dismissAlert(alert.id); return; }
    const t = setTimeout(() => dismissAlert(alert.id), Math.min(remaining, 8000));
    return () => clearTimeout(t);
  }, [alert.id, alert.expires_at]);

  return (
    <motion.div
      layout
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`alert-toast alert-${alert.severity}`}
    >
      <span className="alert-icon">{meta.icon}</span>
      <div className="alert-body">
        <div className="alert-title">
          {meta.label}
          {alert.zone_name && <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 6, fontWeight: 400 }}>· {alert.zone_name}</span>}
        </div>
        <div className="alert-message">{alert.message}</div>
      </div>
      <button className="alert-close" onClick={() => dismissAlert(alert.id)}>✕</button>
    </motion.div>
  );
}

export default function AlertToastContainer() {
  const alerts = useStore((s) => s.alerts);

  return (
    <div className="alerts-container">
      <AnimatePresence mode="sync">
        {alerts.map((a) => (
          <Toast key={a.id} alert={a} />
        ))}
      </AnimatePresence>
    </div>
  );
}
