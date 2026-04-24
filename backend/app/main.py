"""
PulsePlay – FastAPI Backend
============================
• REST endpoints for queue, route, predict, leaderboard, games
• WebSocket /ws  — broadcasts live zone state to all connected clients
• Background tasks: zone state broadcaster (2s), prediction engine (60s)
"""
from __future__ import annotations
import asyncio
import json
import os
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.firebase_admin_init import init_firebase
from app.routers import queue, route, predict, leaderboard, games
from app.services.wait_time import get_all_zone_states
from app.services.predictor import run_prediction_cycle

load_dotenv()

# ── WebSocket Connection Manager ─────────────────────────────────────────────

class ConnectionManager:
    def __init__(self) -> None:
        self._clients: dict[str, WebSocket] = {}

    async def connect(self, ws: WebSocket, uid: str) -> None:
        await ws.accept()
        self._clients[uid] = ws

    def disconnect(self, uid: str) -> None:
        self._clients.pop(uid, None)

    async def broadcast(self, message: dict[str, Any]) -> None:
        dead: list[str] = []
        for uid, ws in list(self._clients.items()):
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(uid)
        for uid in dead:
            self._clients.pop(uid, None)

    @property
    def count(self) -> int:
        return len(self._clients)


manager = ConnectionManager()

# ── Background Tasks ─────────────────────────────────────────────────────────

async def broadcast_zones_loop() -> None:
    """Push zone state to all WS clients every 2 seconds."""
    while True:
        try:
            states = get_all_zone_states()
            if manager.count > 0:
                await manager.broadcast({"type": "zones_update", "data": states})
        except Exception as e:
            print(f"[Broadcast] Error: {e}")
        await asyncio.sleep(2)


async def prediction_loop() -> None:
    """Run prediction engine every 60 seconds."""
    while True:
        await asyncio.sleep(60)
        try:
            states = get_all_zone_states()
            preds  = run_prediction_cycle(states)
            if preds and manager.count > 0:
                for pred in preds:
                    await manager.broadcast({
                        "type": "alert",
                        "data": {
                            "id":        f"pred-{int(time.time())}",
                            "zone":      pred["zone"],
                            "zone_name": pred["zone_name"],
                            "message":   pred.get("alert", {}).get("message", "Crowd spike predicted"),
                            "severity":  "warning",
                            "expires_at": int((time.time() + pred["eta_minutes"] * 60) * 1000),
                        }
                    })
                await manager.broadcast({"type": "predictions", "data": preds})
        except Exception as e:
            print(f"[Predictor] Error: {e}")


# ── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[PulsePlay] Starting up…")
    init_firebase()
    
    # Launch background tasks
    t1 = asyncio.create_task(broadcast_zones_loop())
    t2 = asyncio.create_task(prediction_loop())
    yield
    t1.cancel()
    t2.cancel()
    print("[PulsePlay] Shutdown complete.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="PulsePlay API",
    description="Smart Stadium Experience Engine — crowd optimization backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(queue.router)
app.include_router(route.router)
app.include_router(predict.router)
app.include_router(leaderboard.router)
app.include_router(games.router)


# ── WebSocket endpoint ────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    uid = ws.query_params.get("uid", "anon")
    await manager.connect(ws, uid)
    print(f"[WS] Client connected: {uid} (total: {manager.count})")

    # Send initial zone state immediately on connect
    try:
        states = get_all_zone_states()
        await ws.send_text(json.dumps({"type": "zones_update", "data": states}))
    except Exception:
        pass

    try:
        while True:
            # Keep connection alive; client messages not needed but we receive to detect disconnect
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
                # Handle client → server messages if needed (future extensibility)
                print(f"[WS] Received from {uid}: {msg.get('type', '?')}")
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(uid)
        print(f"[WS] Client disconnected: {uid} (total: {manager.count})")


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    from app.firebase_admin_init import is_configured
    return {
        "status":    "ok",
        "firebase":  is_configured(),
        "clients":   manager.count,
        "timestamp": int(time.time()),
    }
