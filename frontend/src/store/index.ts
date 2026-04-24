import { create } from 'zustand';

export type ZoneColor = 'green' | 'yellow' | 'red' | 'unknown';

export interface ZoneState {
  id: string;
  name: string;
  type: 'gate' | 'food' | 'washroom';
  active_users: number;
  avg_wait_seconds: number;
  color: ZoneColor;
  svg_x: number;
  svg_y: number;
}

export interface Alert {
  id: string;
  zone: string;
  zone_name: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  expires_at: number;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  points: number;
  gamesPlayed: number;
  predictionsCorrect: number;
}

export interface RouteResult {
  primary: string[];
  alternate: string[];
  primary_time: number;
  alternate_time: number;
  time_saved: number;
  congestion_avoided: string[];
}

export interface PredictionResult {
  zone: string;
  zone_name: string;
  probability: number;
  reason: string;
  eta_minutes: number;
}

interface AppState {
  // Auth
  uid: string | null;
  displayName: string;
  points: number;
  setUser: (uid: string, displayName: string, points: number) => void;
  addPoints: (pts: number) => void;

  // Zones
  zones: Record<string, ZoneState>;
  setZones: (zones: Record<string, ZoneState>) => void;
  updateZone: (id: string, data: Partial<ZoneState>) => void;

  // Selected zone (side panel)
  selectedZoneId: string | null;
  setSelectedZone: (id: string | null) => void;

  // Queue state for current user
  activeQueues: Set<string>;
  joinQueue: (zoneId: string) => void;
  leaveQueue: (zoneId: string) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  setLeaderboard: (entries: LeaderboardEntry[]) => void;

  // Route
  currentRoute: RouteResult | null;
  setRoute: (r: RouteResult | null) => void;

  // Predictions
  predictions: PredictionResult[];
  setPredictions: (p: PredictionResult[]) => void;

  // Geolocation
  userPosition: [number, number] | null;
  setUserPosition: (pos: [number, number] | null) => void;

  // WebSocket
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  uid: null,
  displayName: 'Player',
  points: 0,
  setUser: (uid, displayName, points) => set({ uid, displayName, points }),
  addPoints: (pts) => set((s) => ({ points: s.points + pts })),

  // Zones
  zones: {},
  setZones: (zones) => set({ zones }),
  updateZone: (id, data) =>
    set((s) => ({
      zones: { ...s.zones, [id]: { ...s.zones[id], ...data } },
    })),

  // Selected zone
  selectedZoneId: null,
  setSelectedZone: (id) => set({ selectedZoneId: id }),

  // Queue
  activeQueues: new Set(),
  joinQueue: (zoneId) =>
    set((s) => ({ activeQueues: new Set([...s.activeQueues, zoneId]) })),
  leaveQueue: (zoneId) =>
    set((s) => {
      const next = new Set(s.activeQueues);
      next.delete(zoneId);
      return { activeQueues: next };
    }),

  // Alerts
  alerts: [],
  addAlert: (alert) =>
    set((s) => ({
      alerts: [alert, ...s.alerts].slice(0, 5),
    })),
  dismissAlert: (id) =>
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

  // Leaderboard
  leaderboard: [],
  setLeaderboard: (entries) => set({ leaderboard: entries }),

  // Route
  currentRoute: null,
  setRoute: (r) => set({ currentRoute: r }),

  // Predictions
  predictions: [],
  setPredictions: (p) => set({ predictions: p }),

  // Geolocation
  userPosition: null,
  setUserPosition: (pos) => set({ userPosition: pos }),

  // WS
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),
}));
