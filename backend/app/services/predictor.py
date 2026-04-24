"""
Crowd prediction engine.

Triggers:
1. Queue spike — zone's queue depth grew >50% in last 2 minutes.
2. Time-based — halftime (45min), final whistle (90min) from event start.

Predictions are published to:
- RTDB  /alerts/{id}   (for live UI toasts)
- In-memory list       (for REST /predict/alerts)
"""
from __future__ import annotations
import os
import time
import uuid
from datetime import datetime, timezone
from app.firebase_admin_init import get_rtdb_ref, is_configured
from app.config import ZONES

# In-memory snapshot: zone_id -> {"ts": epoch_ms, "active_users": int}
_prev_snapshot: dict[str, dict] = {}
_active_predictions: list[dict] = []


def _get_event_start() -> datetime | None:
    raw = os.getenv("EVENT_START_TIME", "")
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw)
    except ValueError:
        return None


def _event_minutes_elapsed() -> float | None:
    start = _get_event_start()
    if start is None:
        return None
    now = datetime.now(tz=timezone.utc)
    return (now - start.astimezone(timezone.utc)).total_seconds() / 60


def _publish_alert(zone_id: str, message: str, severity: str, eta_minutes: int) -> dict:
    alert_id = str(uuid.uuid4())[:8]
    expires_at = int((time.time() + eta_minutes * 60 + 60) * 1000)
    zone_name  = ZONES.get(zone_id, {}).get("name", zone_id)
    payload = {
        "id":         alert_id,
        "zone":       zone_id,
        "zone_name":  zone_name,
        "message":    message,
        "severity":   severity,
        "expires_at": expires_at,
    }
    if is_configured():
        ref = get_rtdb_ref(f"alerts/{alert_id}")
        ref.set(payload)
    return payload


def run_prediction_cycle(zone_states: dict[str, dict]) -> list[dict]:
    """
    Called periodically (every 60s from background task).
    Returns list of new prediction dicts.
    """
    global _prev_snapshot, _active_predictions

    now_ms  = int(time.time() * 1000)
    new_preds: list[dict] = []

    # ── 1. Queue spike detection ──────────────────────────────
    for zone_id, state in zone_states.items():
        current = state.get("active_users", 0)
        prev    = _prev_snapshot.get(zone_id, {})
        prev_users  = prev.get("active_users", 0)
        prev_ts     = prev.get("ts", 0)
        age_seconds = (now_ms - prev_ts) / 1000

        if age_seconds > 0 and prev_users > 0:
            growth_rate = (current - prev_users) / prev_users
            if growth_rate >= 0.5 and current >= 3:
                eta = max(2, int(3 / growth_rate))
                msg = f"Queue spike detected — {ZONES.get(zone_id, {}).get('name', zone_id)} will be crowded in ~{eta} min"
                pred = {
                    "zone":        zone_id,
                    "zone_name":   ZONES.get(zone_id, {}).get("name", zone_id),
                    "probability": min(0.95, 0.5 + growth_rate * 0.3),
                    "reason":      "Queue spike detected",
                    "eta_minutes": eta,
                    "alert":       _publish_alert(zone_id, msg, "warning", eta),
                }
                new_preds.append(pred)

        _prev_snapshot[zone_id] = {"ts": now_ms, "active_users": current}

    # ── 2. Time-based triggers ────────────────────────────────
    elapsed = _event_minutes_elapsed()
    if elapsed is not None:
        triggers = [
            (43, 47,  "food_ne",  "food_sw", "Halftime approaching — food courts will fill up!",  0.88, 5),
            (43, 47,  "wash_nw",  "wash_se", "Halftime — washrooms expected to be crowded",        0.80, 4),
            (88, 93,  "gate_n",   "gate_s",  "Final whistle soon — exits will fill up fast!",      0.92, 3),
            (88, 93,  "gate_e",   "gate_w",  "Consider delaying exit to avoid the rush",           0.85, 5),
        ]
        for (start_min, end_min, z1, z2, msg, prob, eta) in triggers:
            if start_min <= elapsed <= end_min:
                for z in [z1, z2]:
                    pred = {
                        "zone":        z,
                        "zone_name":   ZONES.get(z, {}).get("name", z),
                        "probability": prob,
                        "reason":      "Time-based trigger",
                        "eta_minutes": eta,
                        "alert":       _publish_alert(z, msg, "warning", eta),
                    }
                    new_preds.append(pred)

    _active_predictions = new_preds
    return new_preds


def get_active_predictions() -> list[dict]:
    return _active_predictions


def find_most_congested_zone(zone_states: dict[str, dict]) -> str:
    """Return zone_id with the most active users."""
    if not zone_states:
        return "gate_n"
    return max(zone_states, key=lambda z: zone_states[z].get("active_users", 0))
