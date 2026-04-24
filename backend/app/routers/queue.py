from fastapi import APIRouter, HTTPException
from app.models import QueueEventIn
from app.services import wait_time as wt
from app.services.wait_time import get_all_zone_states
from app.config import ZONES, POINTS_JOIN_QUEUE, POINTS_LEAVE_QUEUE
from app.firebase_admin_init import get_firestore

router = APIRouter(prefix="/queue", tags=["Queue"])


def _award_points(uid: str, points: int) -> None:
    fs = get_firestore()
    if fs is None:
        return
    ref = fs.collection("users").document(uid)
    doc = ref.get()
    if doc.exists:
        ref.update({"points": doc.to_dict().get("points", 0) + points})
    else:
        ref.set({
            "displayName":        f"Player_{uid[:6]}",
            "points":             points,
            "gamesPlayed":        0,
            "predictionsCorrect": 0,
        })


@router.post("/join")
async def join_queue(body: QueueEventIn):
    if body.zone_id not in ZONES:
        raise HTTPException(status_code=404, detail=f"Zone '{body.zone_id}' not found")
    wt.record_join(body.zone_id, body.uid)
    _award_points(body.uid, POINTS_JOIN_QUEUE)
    return {"status": "ok", "points_awarded": POINTS_JOIN_QUEUE}


@router.post("/leave")
async def leave_queue(body: QueueEventIn):
    if body.zone_id not in ZONES:
        raise HTTPException(status_code=404, detail=f"Zone '{body.zone_id}' not found")
    wt.record_leave(body.zone_id, body.uid)
    _award_points(body.uid, POINTS_LEAVE_QUEUE)
    return {"status": "ok", "points_awarded": POINTS_LEAVE_QUEUE}


@router.get("/status")
async def queue_status():
    return get_all_zone_states()
