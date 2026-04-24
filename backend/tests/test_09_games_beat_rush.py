from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
def test_beat_rush():
    res = client.post("/games/beat-the-rush/submit", json={"uid": "t1", "from_zone": "gate_n", "to_zone": "food_ne", "followed_route": True})
    assert res.status_code == 200
    assert "points_awarded" in res.json()
