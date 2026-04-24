import firebase_admin
from firebase_admin import credentials, db
import random
import os
from dotenv import load_dotenv

load_dotenv()

cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
db_url = os.getenv("FIREBASE_DATABASE_URL", "https://apldiya-default-rtdb.firebaseio.com")

if not os.path.exists(cred_path):
    print(f"Service account key not found at {cred_path}")
    exit(1)

cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred, {"databaseURL": db_url})

ZONES = {
    "gate_n": {"name": "Gate North", "type": "gate", "svg_x": 470, "svg_y": 70},
    "gate_s": {"name": "Gate South", "type": "gate", "svg_x": 470, "svg_y": 620},
    "gate_e": {"name": "Gate East", "type": "gate", "svg_x": 890, "svg_y": 345},
    "gate_w": {"name": "Gate West", "type": "gate", "svg_x": 50, "svg_y": 345},
    "food_ne": {"name": "Food Court NE", "type": "food", "svg_x": 740, "svg_y": 155},
    "food_sw": {"name": "Food Court SW", "type": "food", "svg_x": 200, "svg_y": 535},
    "wash_nw": {"name": "Washroom NW", "type": "washroom", "svg_x": 200, "svg_y": 155},
    "wash_se": {"name": "Washroom SE", "type": "washroom", "svg_x": 740, "svg_y": 535},
}

def seed_rtdb():
    print(f"Seeding RTDB at {db_url}...")
    ref = db.reference("zones")
    
    data = {}
    for zid, meta in ZONES.items():
        data[zid] = {
            "live": {
                "active_users": random.randint(10, 100),
                "avg_wait_seconds": random.randint(30, 600),
                "color": random.choice(["green", "yellow", "red"])
            }
        }
    
    ref.set(data)
    print("RTDB seeded successfully!")

if __name__ == "__main__":
    seed_rtdb()
