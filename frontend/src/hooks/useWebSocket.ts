import { useEffect, useRef } from 'react';
import { useStore } from '../store';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export function useWebSocket(uid: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setZones, addAlert, setPredictions, setWsConnected, addPoints } = useStore();

  useEffect(() => {
    if (!uid) return;

    function connect() {
      const ws = new WebSocket(`${WS_URL}?uid=${uid}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log('[WS] Connected');
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          switch (msg.type) {
            case 'zones_update':
              setZones(msg.data);
              break;
            case 'alert':
              addAlert({
                id: msg.data.id || String(Date.now()),
                zone: msg.data.zone,
                zone_name: msg.data.zone_name,
                message: msg.data.message,
                severity: msg.data.severity || 'warning',
                expires_at: msg.data.expires_at,
              });
              break;
            case 'predictions':
              setPredictions(msg.data);
              break;
            case 'points_awarded':
              addPoints(msg.data.points);
              break;
          }
        } catch (e) {
          console.warn('[WS] Parse error', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log('[WS] Disconnected, reconnecting in 3s…');
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [uid]);

  const send = (type: string, data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  };

  return { send };
}
