from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
def test_leaderboard():
    res = client.get("/leaderboard")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
