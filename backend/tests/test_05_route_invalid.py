from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
def test_route_invalid():
    res = client.post("/route/suggest", json={"from_zone": "gate_n", "to_zone": "gate_n", "uid": "test_1"})
    assert res.status_code == 400
