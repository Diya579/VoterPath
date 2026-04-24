from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
def test_predict():
    res = client.post("/games/crowd-predictor/submit", json={"uid": "t1", "predicted_zone": "gate_n"})
    assert res.status_code == 200
    assert "prediction_id" in res.json()
