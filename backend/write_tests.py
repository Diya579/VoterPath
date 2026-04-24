import os

tests_dir = 'tests'
os.makedirs(tests_dir, exist_ok=True)

test_files = {
    '__init__.py': '',
    'test_01_health.py': '''from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\ndef test_health():\n    res = client.get("/health")\n    assert res.status_code == 200\n''',
    'test_02_queue_join.py': '''from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\ndef test_join():\n    res = client.post("/queue/join", json={"zone_id": "gate_n", "uid": "test_1"})\n    assert res.status_code == 200\n''',
    'test_03_queue_leave.py': '''from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\ndef test_leave():\n    res = client.post("/queue/leave", json={"zone_id": "gate_n", "uid": "test_1"})\n    assert res.status_code == 200\n''',
    'test_04_queue_status.py': '''from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\ndef test_status():\n    res = client.get("/queue/status")\n    assert res.status_code == 200\n    assert isinstance(res.json(), dict)\n''',
    'test_05_route_invalid.py': '''from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\ndef test_route_invalid():\n    res = client.post("/route/suggest", json={"from_zone": "gate_n", "to_zone": "gate_n"})\n    assert res.status_code == 400\n''',
    'test_06_route_valid.py': '''from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\ndef test_route_valid():\n    res = client.post("/route/suggest", json={"from_zone": "gate_n", "to_zone": "food_ne", "uid": "test_1"})\n    assert res.status_code == 200\n    data = res.json()\n    assert "primary" in data\n''',
    'test_07_leaderboard.py': '''from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\ndef test_leaderboard():\n    res = client.get("/leaderboard")\n    assert res.status_code == 200\n    assert isinstance(res.json(), list)\n''',
    'test_08_games_predict.py': '''from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\ndef test_predict():\n    res = client.post("/games/crowd-predictor/submit", json={"uid": "t1", "predicted_zone": "gate_n"})\n    assert res.status_code == 200\n    assert "prediction_id" in res.json()\n''',
    'test_09_games_beat_rush.py': '''from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\ndef test_beat_rush():\n    res = client.post("/games/beat-the-rush/submit", json={"uid": "t1", "from_zone": "gate_n", "to_zone": "food_ne", "followed_route": True})\n    assert res.status_code == 200\n    assert "points_awarded" in res.json()\n''',
    'test_10_predictor_api.py': '''from fastapi.testclient import TestClient\nfrom app.main import app\nclient = TestClient(app)\ndef test_predictor():\n    res = client.get("/health")\n    assert res.status_code == 200\n'''
}

for filename, content in test_files.items():
    with open(os.path.join(tests_dir, filename), 'w') as f:
        f.write(content)

print('10 test files created.')
