import { useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb, isFirebaseConfigured } from '../firebase/config';
import { useStore, ZoneState, Alert } from '../store';

/** Listens to Firebase Realtime DB /zones and /alerts */
export function useQueueRTDB() {
  const { setZones, addAlert } = useStore();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Fallback: poll backend if Firebase is offline
      const fetchZones = async () => {
        try {
          const res = await fetch('http://localhost:8000/queue/status');
          const data = await res.json();
          if (data) {
            const zones: Record<string, ZoneState> = {};
            Object.entries(data).forEach(([id, val]: [string, any]) => {
              zones[id] = {
                id,
                name: String(val.name ?? id),
                type: (val.type as ZoneState['type']) ?? 'gate',
                active_users: Number(val.active_users ?? 0),
                avg_wait_seconds: Number(val.avg_wait_seconds ?? 0),
                color: (val.color as ZoneState['color']) ?? 'unknown',
                svg_x: Number(val.svg_x ?? 0),
                svg_y: Number(val.svg_y ?? 0),
              };
            });
            setZones(zones);
          }
        } catch (e) {
          console.error("Failed to poll local backend", e);
        }
      };
      fetchZones();
      const interval = setInterval(fetchZones, 3000);
      return () => clearInterval(interval);
    }

    // Listen to /zones
    const zonesRef = ref(rtdb, 'zones');
    const unsubZones = onValue(zonesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const zones: Record<string, ZoneState> = {};
        Object.entries(data).forEach(([id, val]: [string, unknown]) => {
          const v = val as Record<string, unknown>;
          zones[id] = {
            id,
            name: String(v.name ?? id),
            type: (v.type as ZoneState['type']) ?? 'gate',
            active_users: Number(v.active_users ?? 0),
            avg_wait_seconds: Number(v.avg_wait_seconds ?? 0),
            color: (v.color as ZoneState['color']) ?? 'unknown',
            svg_x: Number(v.svg_x ?? 0),
            svg_y: Number(v.svg_y ?? 0),
          };
        });
        setZones(zones);
      }
    });

    // Listen to /alerts
    const alertsRef = ref(rtdb, 'alerts');
    const unsubAlerts = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = Date.now();
        Object.entries(data).forEach(([id, val]: [string, unknown]) => {
          const v = val as Record<string, unknown>;
          const expiresAt = Number(v.expires_at ?? 0);
          if (expiresAt > now) {
            addAlert({
              id,
              zone: String(v.zone ?? ''),
              zone_name: String(v.zone_name ?? ''),
              message: String(v.message ?? ''),
              severity: (v.severity as Alert['severity']) ?? 'warning',
              expires_at: expiresAt,
            });
          }
        });
      }
    });

    return () => {
      unsubZones();
      unsubAlerts();
    };
  }, []);
}
