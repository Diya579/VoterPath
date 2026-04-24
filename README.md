# PulsePlay – Smart Stadium Experience Engine

A production-ready full-stack crowd optimization platform for live events.

## Stack
- **Frontend**: React 18 + Vite + TypeScript · Zustand · Framer Motion · Firebase JS SDK
- **Backend**: Python 3.11 + FastAPI · Firebase Admin SDK · WebSockets
- **Database**: Firebase Realtime DB (live queue events) + Firestore (user profiles, leaderboard)

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.11
- Firebase project (see Firebase Setup below)

---

### 1. Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Anonymous Authentication** → Authentication → Sign-in providers → Anonymous
3. Enable **Realtime Database** (Start in test mode)
4. Enable **Firestore** (Start in test mode)
5. Create a **Web App** → copy the config for the frontend
6. Go to **Project Settings → Service Accounts** → Generate new private key → save as `backend/serviceAccountKey.json`

---

### 2. Backend

```bash
cd backend

# Copy env template
cp .env.example .env
# Fill in FIREBASE_DATABASE_URL + ensure serviceAccountKey.json is present

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn app.main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API docs: http://localhost:8000/docs

---

### 3. Frontend

```bash
cd frontend

# Copy env template
cp .env.example .env
# Fill in all VITE_FIREBASE_* values from your Firebase web app config

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Features

| Feature | Status |
|---|---|
| Live Queue Radar (join/leave + wait times) | ✅ |
| Stadium SVG Map with color-coded zones | ✅ |
| Smart Route Optimization (Dijkstra) | ✅ |
| Crowd Prediction Engine | ✅ |
| Gamification (points for all actions) | ✅ |
| Real-Time Leaderboard (Firestore listener) | ✅ |
| Beat the Rush mini-game | ✅ |
| Crowd Predictor mini-game | ✅ |
| Alerts & Notifications (WS + RTDB) | ✅ |
| Anonymous Firebase Auth | ✅ |
| WebSocket real-time updates (2s) | ✅ |
| Works without Firebase (offline mode) | ✅ |

## Architecture

```
React ←→ WebSocket ←→ FastAPI
  ↕                      ↕
Firebase JS SDK ←→ Firebase Admin SDK
  (RTDB listeners)   (RTDB + Firestore writes)
```

## Zones

| ID | Name | Type |
|---|---|---|
| gate_n | Gate North | gate |
| gate_s | Gate South | gate |
| gate_e | Gate East | gate |
| gate_w | Gate West | gate |
| food_ne | Food Court NE | food |
| food_sw | Food Court SW | food |
| wash_nw | Washroom NW | washroom |
| wash_se | Washroom SE | washroom |

## Points System

| Action | Points |
|---|---|
| Join a queue | +5 |
| Leave a queue (provides data) | +2 |
| Follow suggested route | +10 |
| Beat the Rush challenge | +20 |
| Correct crowd prediction | +15 |
