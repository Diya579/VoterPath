import time
import uuid
from fastapi import APIRouter
from app.models import BeatRushSubmit, PredictionSubmit
from app.services.pathfinder import suggest_route
from app.services.wait_time import get_all_zone_states
from app.services.predictor import find_most_congested_zone
from app.firebase_admin_init import get_firestore
from app.config import ZONES, POINTS_BEAT_RUSH, POINTS_FOLLOW_ROUTE, POINTS_CORRECT_PREDICTION

router = APIRouter(prefix="/games", tags=["Games"])

# In-memory: prediction_id -> {uid, predicted_zone, submitted_at, resolved}
_pending_predictions: dict[str, dict] = {}


def _incr_user(uid: str, points: int, games: int = 0, predictions: int = 0) -> None:
    fs = get_firestore()
    if fs is None:
        return
    ref = fs.collection("users").document(uid)
    doc = ref.get()
    base = doc.to_dict() if doc.exists else {"displayName": f"Player_{uid[:6]}", "points": 0, "gamesPlayed": 0, "predictionsCorrect": 0}
    ref.set({
        "displayName":        base.get("displayName", f"Player_{uid[:6]}"),
        "points":             base.get("points", 0) + points,
        "gamesPlayed":        base.get("gamesPlayed", 0) + games,
        "predictionsCorrect": base.get("predictionsCorrect", 0) + predictions,
    })


@router.post("/beat-the-rush/submit")
async def beat_rush_submit(body: BeatRushSubmit):
    """
    User claims they followed the optimal route.
    Verification: re-compute route and check from/to are reachable.
    Award POINTS_BEAT_RUSH if followed, POINTS_FOLLOW_ROUTE for partial.
    """
    zone_states = get_all_zone_states()
    result = suggest_route(body.from_zone, body.to_zone, zone_states)
    pts = 0
    won = False

    if body.followed_route and result["primary"]:
        pts = POINTS_BEAT_RUSH
        won = True
    elif result["primary"]:
        pts = POINTS_FOLLOW_ROUTE

    _incr_user(body.uid, pts, games=1)
    return {"points_awarded": pts, "won": won, "optimal_route": result["primary"]}


@router.post("/crowd-predictor/submit")
async def crowd_predictor_submit(body: PredictionSubmit):
    """Register a prediction. Result resolved after 5 minutes via /result/{id}."""
    if body.predicted_zone not in ZONES:
        return {"error": f"Zone '{body.predicted_zone}' not found"}

    pred_id = str(uuid.uuid4())[:12]
    _pending_predictions[pred_id] = {
        "uid":            body.uid,
        "predicted_zone": body.predicted_zone,
        "submitted_at":   time.time(),
        "resolved":       False,
        "correct":        None,
        "actual_zone":    None,
        "points_awarded": 0,
    }
    return {"prediction_id": pred_id, "status": "pending", "resolve_in_seconds": 300}


@router.get("/crowd-predictor/result/{prediction_id}")
async def crowd_predictor_result(prediction_id: str):
    pred = _pending_predictions.get(prediction_id)
    if not pred:
        return {"error": "Prediction not found"}

    # Already resolved
    if pred["resolved"]:
        return pred

    # Check if 5 minutes elapsed
    age = time.time() - pred["submitted_at"]
    if age < 300:
        return {"status": "pending", "seconds_remaining": int(300 - age)}

    # Resolve against live data
    zone_states  = get_all_zone_states()
    actual_zone  = find_most_congested_zone(zone_states)
    correct      = actual_zone == pred["predicted_zone"]
    pts          = POINTS_CORRECT_PREDICTION if correct else 0

    pred.update({
        "resolved":       True,
        "correct":        correct,
        "actual_zone":    actual_zone,
        "points_awarded": pts,
    })
    _incr_user(pred["uid"], pts, predictions=1 if correct else 0)
    return pred
