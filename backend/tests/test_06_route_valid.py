from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
def test_route_valid():
    res = client.post("/route/suggest", json={"from_zone": "gate_n", "to_zone": "food_ne", "uid": "test_1"})
    assert res.status_code == 200
    data = res.json()
    assert "primary" in data
