"""
Wait time computation service.

Algorithm:
1. Fetch recent (last 50) queue events for a zone from RTDB.
2. Match join→leave pairs to compute actual durations.
3. Average matched durations to get avg_wait_seconds.
4. Current queue depth = unmatched joins.
5. Estimated wait = avg_wait_seconds × queue_depth  (min 0).
6. Color threshold:  green < 3min ≤ yellow < 8min ≤ red.
"""
from __future__ import annotations
import time
from app.config import WAIT_GREEN_MAX, WAIT_YELLOW_MAX
from app.firebase_admin_init import get_rtdb_ref, is_configured


# In-memory fallback when Firebase not configured
# zoneId -> list of {"uid", "action", "timestamp"}
_local_events: dict[str, list[dict]] = {}
# zoneId -> {"active_users", "avg_wait_seconds", "color"}
_zone_state:   dict[str, dict] = {}


def record_join(zone_id: str, uid: str) -> None:
    ts = int(time.time() * 1000)
    event = {"uid": uid, "action": "join", "timestamp": ts}

    if is_configured():
        ref = get_rtdb_ref(f"zones/{zone_id}/queue_events")
        ref.push(event)
    else:
        _local_events.setdefault(zone_id, []).append({**event, "key": f"local_{ts}"})

    _recompute(zone_id)


def record_leave(zone_id: str, uid: str) -> None:
    ts = int(time.time() * 1000)
    event = {"uid": uid, "action": "leave", "timestamp": ts}

    if is_configured():
        ref = get_rtdb_ref(f"zones/{zone_id}/queue_events")
        ref.push(event)
    else:
        _local_events.setdefault(zone_id, []).append({**event, "key": f"local_{ts}"})

    _recompute(zone_id)


def _recompute(zone_id: str) -> dict:
    events = _fetch_events(zone_id)
    state  = _compute_state(events)
    _zone_state[zone_id] = state

    # Push to RTDB live node
    if is_configured():
        from app.config import ZONES
        meta = ZONES.get(zone_id, {})
        ref  = get_rtdb_ref(f"zones/{zone_id}/live")
        ref.set({
            **state,
            "name":  meta.get("name", zone_id),
            "type":  meta.get("type", "gate"),
            "svg_x": meta.get("svg_x", 0),
            "svg_y": meta.get("svg_y", 0),
        })

    return state


def _fetch_events(zone_id: str) -> list[dict]:
    if is_configured():
        ref  = get_rtdb_ref(f"zones/{zone_id}/queue_events")
        data = ref.order_by_child("timestamp").limit_to_last(100).get()
        if not data:
            return []
        return list(data.values())
    return _local_events.get(zone_id, [])


def _compute_state(events: list[dict]) -> dict:
    # Group by uid
    by_uid: dict[str, list[dict]] = {}
    for ev in events:
        by_uid.setdefault(ev["uid"], []).append(ev)

    durations = []
    active_uids = set()

    for uid, evs in by_uid.items():
        sorted_evs = sorted(evs, key=lambda e: e["timestamp"])
        last_join = None
        for ev in sorted_evs:
            if ev["action"] == "join":
                last_join = ev["timestamp"]
            elif ev["action"] == "leave" and last_join is not None:
                duration_s = (ev["timestamp"] - last_join) / 1000
                if 5 <= duration_s <= 3600:   # sanity-filter 5s – 1h
                    durations.append(duration_s)
                last_join = None

        # Still in queue if last event was join
        if sorted_evs and sorted_evs[-1]["action"] == "join":
            active_uids.add(uid)

    avg_wait = sum(durations) / len(durations) if durations else 0.0
    avg_wait_min = avg_wait / 60

    if avg_wait_min < WAIT_GREEN_MAX:
        color = "green"
    elif avg_wait_min < WAIT_YELLOW_MAX:
        color = "yellow"
    else:
        color = "red"

    # If no one is in queue, show unknown
    if not active_uids and not durations:
        color = "unknown"
        avg_wait = 0.0

    return {
        "active_users":      len(active_uids),
        "avg_wait_seconds":  round(avg_wait, 1),
        "color":             color,
    }


def get_all_zone_states() -> dict[str, dict]:
    """Return live state for all zones, merging RTDB data with local cache."""
    from app.config import ZONES
    result = {}
    rtdb_data = {}

    if is_configured():
        try:
            ref = get_rtdb_ref("zones")
            rtdb_data = ref.get() or {}
        except Exception as e:
            if "404" not in str(e):
                print(f"Firebase RTDB error: {e}")

    for zone_id, meta in ZONES.items():
        # Priority: 1. RTDB live node, 2. Local memory, 3. Defaults
        live = rtdb_data.get(zone_id, {}).get("live", {})
        cached = _zone_state.get(zone_id, {})
        
        # If both are empty and we are offline, generate some stable random data for the demo
        if not live and not cached and not is_configured():
            import random
            cached = {
                "active_users":     random.randint(5, 45),
                "avg_wait_seconds": random.randint(30, 480),
                "color":            random.choice(["green", "yellow", "red"])
            }
            _zone_state[zone_id] = cached

        result[zone_id] = {
            "active_users":     live.get("active_users") or cached.get("active_users", 0),
            "avg_wait_seconds": live.get("avg_wait_seconds") or cached.get("avg_wait_seconds", 0.0),
            "color":            live.get("color") or cached.get("color", "unknown"),
            "name":             meta.get("name", zone_id),
            "type":             meta.get("type", "gate"),
            "svg_x":            meta.get("svg_x", 0),
            "svg_y":            meta.get("svg_y", 0),
        }

    return result
