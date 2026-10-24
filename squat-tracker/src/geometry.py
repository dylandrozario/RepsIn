"""Geometry helpers for pose-based angle computation.

Landmarks from MediaPipe are normalized (x, y in [0, 1], plus z and
visibility). For angle math we only need the 2D (x, y) projection, which is
robust enough for squat form tracking from a side/front view.
"""

from __future__ import annotations

import math
from typing import Sequence

# MediaPipe Pose landmark indices we care about.
# Full list: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28
LEFT_FOOT_INDEX = 31
RIGHT_FOOT_INDEX = 32

Point = Sequence[float]


def angle(a: Point, b: Point, c: Point) -> float:
    """Return the angle in degrees at vertex ``b`` formed by points a-b-c.

    Uses 2D coordinates (first two components of each point). The result is
    in the range [0, 180].
    """
    ax, ay = a[0], a[1]
    bx, by = b[0], b[1]
    cx, cy = c[0], c[1]

    v1x, v1y = ax - bx, ay - by
    v2x, v2y = cx - bx, cy - by

    dot = v1x * v2x + v1y * v2y
    mag1 = math.hypot(v1x, v1y)
    mag2 = math.hypot(v2x, v2y)

    if mag1 == 0.0 or mag2 == 0.0:
        return 0.0

    cos_theta = dot / (mag1 * mag2)
    # Guard against tiny floating point overshoot outside [-1, 1].
    cos_theta = max(-1.0, min(1.0, cos_theta))
    return math.degrees(math.acos(cos_theta))


def to_xy(landmark) -> tuple[float, float]:
    """Extract an (x, y) tuple from a MediaPipe landmark object."""
    return (landmark.x, landmark.y)


def get_point(landmarks, index: int) -> tuple[float, float]:
    """Return the (x, y) coordinate for a landmark index from a landmark list."""
    return to_xy(landmarks[index])


def visibility(landmarks, index: int) -> float:
    """Return the visibility score for a landmark index (0..1)."""
    lm = landmarks[index]
    return getattr(lm, "visibility", 1.0)
