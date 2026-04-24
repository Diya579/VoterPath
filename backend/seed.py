import asyncio
import firebase_admin
from firebase_admin import credentials, firestore
import random
import os

# Initialize Firebase
cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

ZONES = ['gate_n', 'gate_s', 'gate_e', 'gate_w', 'food_ne', 'food_sw', 'wash_nw', 'wash_se']

def seed_database():
    print("Seeding database with realistic player data...")
    batch = db.batch()
    
    # 1. Seed Zones
    for zone in ZONES:
        doc_ref = db.collection('zones').document(zone)
        wait_time = random.randint(30, 600)
        active_users = random.randint(5, 150)
        batch.set(doc_ref, {
            "active_users": active_users,
            "avg_wait_seconds": wait_time,
            "status": "active",
            "last_updated": firestore.SERVER_TIMESTAMP
        }, merge=True)
        
    # 2. Seed Leaderboard
    players = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Sam", "Jamie"]
    for i, name in enumerate(players):
        doc_ref = db.collection('leaderboard').document(f"player_{i}")
        batch.set(doc_ref, {
            "username": name,
            "score": random.randint(100, 5000),
            "games_played": random.randint(1, 50),
            "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={name}"
        }, merge=True)
        
    batch.commit()
    print("Database seeded successfully!")

if __name__ == "__main__":
    try:
        seed_database()
    except Exception as e:
        if "PermissionDenied" in str(type(e)) or "403" in str(e):
            print("\n❌ Firestore API is not enabled for your project.")
            print("Please enable it by visiting: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview")
            print("Once enabled, wait a few minutes and run this script again.\n")
        else:
            print(f"An error occurred: {e}")
