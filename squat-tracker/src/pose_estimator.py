"""MediaPipe Pose wrapper using the Tasks ``PoseLandmarker`` API.

Modern mediapipe builds (0.10.3x / 1.x) ship the Tasks API rather than the
legacy ``mp.solutions.pose`` module, so we use ``PoseLandmarker`` in VIDEO
running mode. The required ``.task`` model is downloaded and cached on first
use.

``PoseEstimator.process`` takes a BGR frame (as delivered by OpenCV), runs
pose detection, and returns a list of landmark objects with ``.x/.y/.z/
.visibility`` (or ``None`` when no person was detected) -- a shape compatible
with ``geometry.py`` and the exercise modules. It can also draw the skeleton
overlay onto a frame.
"""

from __future__ import annotations

import os
import ssl
import urllib.request
from typing import Optional

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision import PoseLandmarksConnections

MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
)
DEFAULT_MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "models"
)
DEFAULT_MODEL_PATH = os.path.join(DEFAULT_MODEL_DIR, "pose_landmarker_lite.task")

# Connection pairs (start, end) for drawing the skeleton.
_CONNECTIONS = [
    (c.start, c.end) for c in PoseLandmarksConnections.POSE_LANDMARKS
]


def _ssl_context() -> Optional[ssl.SSLContext]:
    """Build an SSL context backed by certifi's CA bundle when available.

    python.org builds on macOS don't use the system trust store, which makes
    plain urllib HTTPS downloads fail with CERTIFICATE_VERIFY_FAILED. certifi
    ships a bundle and is already a mediapipe dependency, so prefer it.
    """
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return None


def ensure_model(path: str = DEFAULT_MODEL_PATH, url: str = MODEL_URL) -> str:
    """Download the pose model to ``path`` if it is not already present."""
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return path
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    print(f"Downloading pose model to {path} ...")

    context = _ssl_context()
    req = urllib.request.Request(url, headers={"User-Agent": "RepsIn/1.0"})
    with urllib.request.urlopen(req, context=context) as resp, open(path, "wb") as out:
        out.write(resp.read())
    print("Model ready.")
    return path


class PoseEstimator:
    def __init__(
        self,
        model_path: Optional[str] = None,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ) -> None:
        model_path = ensure_model(model_path or DEFAULT_MODEL_PATH)

        base_options = mp_python.BaseOptions(model_asset_path=model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            min_pose_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            num_poses=1,
        )
        self._landmarker = vision.PoseLandmarker.create_from_options(options)
        self._last_landmarks = None  # list of NormalizedLandmark or None
        # VIDEO mode requires monotonically increasing millisecond timestamps.
        self._frame_index = 0

    def process(self, frame_bgr):
        """Run pose detection on a BGR frame.

        Returns the landmark list for the first detected pose, or ``None``
        when no pose is found.
        """
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        timestamp_ms = self._frame_index
        self._frame_index += 1

        result = self._landmarker.detect_for_video(mp_image, timestamp_ms)
        if not result.pose_landmarks:
            self._last_landmarks = None
            return None

        landmarks = result.pose_landmarks[0]
        self._last_landmarks = landmarks
        return landmarks

    def draw(self, frame_bgr):
        """Draw the cached skeleton overlay onto ``frame_bgr`` in place."""
        if not self._last_landmarks:
            return frame_bgr

        h, w = frame_bgr.shape[:2]
        pts = [
            (int(lm.x * w), int(lm.y * h)) for lm in self._last_landmarks
        ]

        # Edges
        for start, end in _CONNECTIONS:
            if start < len(pts) and end < len(pts):
                cv2.line(frame_bgr, pts[start], pts[end], (245, 117, 66), 2, cv2.LINE_AA)
        # Joints
        for (x, y) in pts:
            cv2.circle(frame_bgr, (x, y), 4, (245, 66, 230), -1, cv2.LINE_AA)
        return frame_bgr

    def close(self) -> None:
        self._landmarker.close()

    def __enter__(self) -> "PoseEstimator":
        return self

    def __exit__(self, *exc) -> None:
        self.close()
