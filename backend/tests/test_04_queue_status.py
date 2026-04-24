from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
def test_status():
    res = client.get("/queue/status")
    assert res.status_code == 200
    assert isinstance(res.json(), dict)
