from fastapi import APIRouter
from app.firebase_admin_init import get_firestore
from app.models import LeaderboardEntry

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

# In-memory fallback
_local_board: list[dict] = [
    {"uid": "u1", "displayName": "Jessica J.", "points": 200, "gamesPlayed": 10, "predictionsCorrect": 5},
    {"uid": "u2", "displayName": "Andrew B.", "points": 154, "gamesPlayed": 8, "predictionsCorrect": 2},
    {"uid": "u3", "displayName": "Brad T.", "points": 142, "gamesPlayed": 6, "predictionsCorrect": 3},
    {"uid": "u4", "displayName": "Dalia Kvedaravite", "points": 102, "gamesPlayed": 4, "predictionsCorrect": 1},
    {"uid": "u5", "displayName": "Hilda Murray", "points": 88, "gamesPlayed": 3, "predictionsCorrect": 0},
    {"uid": "u6", "displayName": "Stephanie Kleimann", "points": 64, "gamesPlayed": 2, "predictionsCorrect": 0},
]

@router.get("", response_model=list[LeaderboardEntry])
async def get_leaderboard():
    fs = get_firestore()
    if fs is None:
        return _local_board[:20]

    docs = (
        fs.collection("users")
        .order_by("points", direction="DESCENDING")
        .limit(20)
        .stream()
    )
    return [
        {
            "uid":                doc.id,
            "displayName":        doc.to_dict().get("displayName", "Anonymous"),
            "points":             doc.to_dict().get("points", 0),
            "gamesPlayed":        doc.to_dict().get("gamesPlayed", 0),
            "predictionsCorrect": doc.to_dict().get("predictionsCorrect", 0),
        }
        for doc in docs
    ]
