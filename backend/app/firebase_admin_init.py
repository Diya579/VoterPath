"""
Firebase Admin SDK initialization.
Reads credentials from ENV. Gracefully no-ops if not configured.
"""
import os
import json
import firebase_admin
from firebase_admin import credentials, db, firestore as fs_admin
from dotenv import load_dotenv

load_dotenv()

_app: firebase_admin.App | None = None
_firestore_client = None
_rtdb_configured = False


def init_firebase() -> bool:
    """Initialize Firebase Admin SDK. Returns True if successful."""
    global _app, _firestore_client, _rtdb_configured

    if _app is not None:
        return True

    # Try JSON path first
    key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
    db_url   = os.getenv("FIREBASE_DATABASE_URL", "")

    if not db_url:
        print("[Firebase] FIREBASE_DATABASE_URL not set. Running in offline mode.")
        return False

    try:
        if os.path.exists(key_path):
            cred = credentials.Certificate(key_path)
        else:
            # Try inline JSON env var
            key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
            if not key_json:
                print(f"[Firebase] ⚠️  Service account key not found at '{key_path}'. Running in offline mode.")
                return False
            cred = credentials.Certificate(json.loads(key_json))

        _app = firebase_admin.initialize_app(cred, {"databaseURL": db_url})
        _firestore_client = fs_admin.client()
        _rtdb_configured = True
        print("[Firebase] Admin SDK initialized.")
        return True
    except Exception as e:
        print(f"[Firebase] Init failed: {e}")
        return False


def get_rtdb_ref(path: str):
    """Get a Firebase Realtime DB reference. Returns None if not configured."""
    if not _rtdb_configured:
        return None
    return db.reference(path)


def get_firestore():
    """Get Firestore client. Returns None if not configured."""
    return _firestore_client


def is_configured() -> bool:
    return _rtdb_configured
