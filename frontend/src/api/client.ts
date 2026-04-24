import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE,
  timeout: 8000,
});

// Attach uid to every request
api.interceptors.request.use((config) => {
  const uid = localStorage.getItem('pp_uid');
  if (uid) config.headers['X-User-ID'] = uid;
  return config;
});

// ---- Queue ----
export const joinQueue = (zoneId: string, uid: string) =>
  api.post('/queue/join', { zone_id: zoneId, uid });

export const leaveQueue = (zoneId: string, uid: string) =>
  api.post('/queue/leave', { zone_id: zoneId, uid });

export const getQueueStatus = () =>
  api.get<Record<string, { active_users: number; avg_wait_seconds: number; color: string }>>('/queue/status');

// ---- Route ----
export const suggestRoute = (fromZone: string, toZone: string, uid: string) =>
  api.post('/route/suggest', { from_zone: fromZone, to_zone: toZone, uid });

// ---- Predict ----
export const getPredictions = () =>
  api.get('/predict/alerts');

// ---- Leaderboard ----
export const getLeaderboard = () =>
  api.get('/leaderboard');

// ---- Games ----
export const submitBeatRush = (uid: string, fromZone: string, toZone: string, followedRoute: boolean) =>
  api.post('/games/beat-the-rush/submit', { uid, from_zone: fromZone, to_zone: toZone, followed_route: followedRoute });

export const submitPrediction = (uid: string, predictedZone: string) =>
  api.post('/games/crowd-predictor/submit', { uid, predicted_zone: predictedZone });

export const checkPrediction = (predictionId: string) =>
  api.get(`/games/crowd-predictor/result/${predictionId}`);

export default api;
