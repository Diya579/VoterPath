from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
def test_leave():
    res = client.post("/queue/leave", json={"zone_id": "gate_n", "uid": "test_1"})
    assert res.status_code == 200
