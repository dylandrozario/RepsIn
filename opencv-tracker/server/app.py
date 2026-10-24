"""
RepsIn pose-analysis server.

Receives JPEG frames from the Expo app over Wi-Fi, runs MediaPipe Pose with
OpenCV, drives the rep/form state machine, and returns JSON.

Run:
    cd squat-tracker/server
    ../../.venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000

The app POSTs to  http://<laptop-lan-ip>:8000/analyze
The server prints its LAN IP on startup.
"""
from __future__ import annotations

import base64
import os
import socket
import threading
import time
from typing import Dict, Optional

# Load server/.env (for SUPABASE_JWT_SECRET etc.) BEFORE importing auth, which
# reads those env vars at import time.
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except Exception:
    pass

import cv2
import numpy as np
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

from pose_logic import make_tracker, ExerciseTracker
from auth import require_user, optional_user, is_auth_configured

app = FastAPI(title="RepsIn Pose Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# MediaPipe Tasks PoseLandmarker, loaded from the model bundled in the repo.
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "models", "pose_landmarker_lite.task"
)
_landmarker_options = mp_vision.PoseLandmarkerOptions(
    base_options=mp_python.BaseOptions(model_asset_path=os.path.abspath(_MODEL_PATH)),
    running_mode=mp_vision.RunningMode.IMAGE,
    num_poses=1,
    min_pose_detection_confidence=0.5,
    min_pose_presence_confidence=0.5,
    min_tracking_confidence=0.5,
)
_landmarker = mp_vision.PoseLandmarker.create_from_options(_landmarker_options)
_pose_lock = threading.Lock()

# Per-session rep trackers. Keyed by (sessionId, exerciseId).
_trackers: Dict[str, ExerciseTracker] = {}
_trackers_lock = threading.Lock()


class AnalyzeRequest(BaseModel):
    image: str              # base64 JPEG (no data: prefix needed)
    exercise: str = "squat"
    sessionId: str = "default"
    reset: bool = False


def _tracker_for(session_id: str, exercise: str, reset: bool) -> ExerciseTracker:
    key = f"{session_id}:{exercise}"
    with _trackers_lock:
        tr = _trackers.get(key)
        if tr is None or reset:
            tr = make_tracker(exercise)
            _trackers[key] = tr
        return tr


def _decode_image(b64: str) -> Optional[np.ndarray]:
    if "," in b64:                      # strip data URI prefix if present
        b64 = b64.split(",", 1)[1]
    try:
        raw = base64.b64decode(b64)
        arr = np.frombuffer(raw, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception:
        return None


def _landmarks_to_list(result):
    """Convert MediaPipe Tasks pose landmarks to the normalized
    [{x,y,visibility}] form the rep logic and the phone overlay expect."""
    if not result.pose_landmarks:
        return None
    first = result.pose_landmarks[0]  # num_poses=1
    out = []
    for lm in first:
        out.append({
            "x": lm.x,
            "y": lm.y,
            "visibility": getattr(lm, "visibility", 1.0),
        })
    return out


@app.get("/health")
def health():
    return {"ok": True, "service": "repsin-pose", "time": time.time(), "authConfigured": is_auth_configured()}


@app.post("/analyze")
def analyze(req: AnalyzeRequest, user: Optional[dict] = Depends(optional_user)):
    # Auth is OPTIONAL here so anonymous demo tracking still works. If a valid
    # token is present we scope the session to the authenticated user id.
    t0 = time.time()
    img = _decode_image(req.image)
    if img is None:
        return {"error": "bad_image", "poseDetected": False}

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    with _pose_lock:
        results = _landmarker.detect(mp_image)

    landmarks = _landmarks_to_list(results)

    # Namespace the tracker key by the verified user id when available, so two
    # signed-in users never share rep state even with the same sessionId.
    scope = user["id"] if user else req.sessionId
    tracker = _tracker_for(scope, req.exercise, req.reset)
    result = tracker.update(landmarks)

    payload = result.to_dict()
    payload["exercise"] = req.exercise
    payload["landmarks"] = landmarks       # for the phone's skeleton overlay
    payload["latencyMs"] = round((time.time() - t0) * 1000)
    payload["authenticated"] = bool(user)
    return payload


@app.get("/me")
def me(user: dict = Depends(require_user)):
    """Protected: returns the verified user identity from the JWT. Proves the
    client cannot spoof a user id — only a valid Supabase token works."""
    return {"userId": user["id"], "email": user.get("email")}


@app.post("/reset")
def reset(req: AnalyzeRequest):
    key = f"{req.sessionId}:{req.exercise}"
    with _trackers_lock:
        _trackers[key] = make_tracker(req.exercise)
    return {"ok": True}


def _lan_ip() -> str:
    """Best-effort LAN IP so you know what to point the phone at."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


@app.on_event("startup")
def _print_banner():
    ip = _lan_ip()
    print("\n" + "=" * 54)
    print("  RepsIn pose server is running")
    print(f"  On your phone, set the server URL to:")
    print(f"      http://{ip}:8000")
    print("  (phone and laptop must be on the same Wi-Fi)")
    print("=" * 54 + "\n")
