"""
Pose geometry + exercise rep/form logic.

Rebuilt from the original compiled tracker (squat thresholds are the exact
values recovered from the bytecode) and extended with more exercises. The
rep-counting state machine uses hysteresis on a primary joint angle so jitter
near a single boundary cannot produce phantom reps.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Callable, Optional

# MediaPipe Pose landmark indices (BlazePose 33-point model).
NOSE = 0
LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_ELBOW, RIGHT_ELBOW = 13, 14
LEFT_WRIST, RIGHT_WRIST = 15, 16
LEFT_HIP, RIGHT_HIP = 23, 24
LEFT_KNEE, RIGHT_KNEE = 25, 26
LEFT_ANKLE, RIGHT_ANKLE = 27, 28
LEFT_FOOT, RIGHT_FOOT = 31, 32

VIS_THRESHOLD = 0.5


def angle(a, b, c) -> Optional[float]:
    """Angle in degrees at vertex b formed by a-b-c, in range [0, 180]."""
    if a is None or b is None or c is None:
        return None
    ba_x, ba_y = a[0] - b[0], a[1] - b[1]
    bc_x, bc_y = c[0] - b[0], c[1] - b[1]
    dot = ba_x * bc_x + ba_y * bc_y
    mag_ba = math.hypot(ba_x, ba_y)
    mag_bc = math.hypot(bc_x, bc_y)
    if mag_ba == 0 or mag_bc == 0:
        return 0.0
    cos_a = max(-1.0, min(1.0, dot / (mag_ba * mag_bc)))
    return math.degrees(math.acos(cos_a))


def point(landmarks, idx):
    if landmarks is None or idx >= len(landmarks):
        return None
    lm = landmarks[idx]
    return (lm["x"], lm["y"])


def visibility(landmarks, idx) -> float:
    if landmarks is None or idx >= len(landmarks):
        return 0.0
    return landmarks[idx].get("visibility", 1.0)


def joint_angle(landmarks, ai, bi, ci):
    return angle(point(landmarks, ai), point(landmarks, bi), point(landmarks, ci))


@dataclass
class ExerciseResult:
    reps: int = 0
    good_reps: int = 0
    state: str = "unknown"
    form_ok: bool = True
    cues: list = field(default_factory=list)
    primary_angle: Optional[float] = None
    pose_detected: bool = False
    rep_completed: bool = False

    def to_dict(self):
        return {
            "reps": self.reps,
            "goodReps": self.good_reps,
            "state": self.state,
            "formOk": self.form_ok,
            "cues": self.cues,
            "primaryAngle": self.primary_angle,
            "poseDetected": self.pose_detected,
            "repCompleted": self.rep_completed,
        }


@dataclass
class ExerciseSpec:
    label: str
    down_angle: float
    up_angle: float
    up_label: str
    down_label: str
    lower_is_down: bool
    required: list
    primary: Callable
    accumulate: Callable
    evaluate_form: Callable
    fresh_acc: Callable


class ExerciseTracker:
    """Drives one exercise's rep state machine across frames."""

    def __init__(self, spec: ExerciseSpec):
        self.spec = spec
        self._reps = 0
        self._good = 0
        self._state = spec.up_label
        self._acc = spec.fresh_acc()

    def reset(self):
        self._reps = 0
        self._good = 0
        self._state = self.spec.up_label
        self._acc = self.spec.fresh_acc()

    def update(self, landmarks) -> ExerciseResult:
        s = self.spec
        if not landmarks:
            return ExerciseResult(self._reps, self._good, self._state, True,
                                  ["No person detected"], None, False)

        if not all(visibility(landmarks, i) >= VIS_THRESHOLD for i in s.required):
            return ExerciseResult(self._reps, self._good, self._state, True,
                                  ["Step fully into frame"], None, True)

        primary = s.primary(landmarks)
        if primary is None:
            return ExerciseResult(self._reps, self._good, self._state, True,
                                  ["Step fully into frame"], None, True)

        s.accumulate(self._acc, landmarks, primary)
        return self._advance(primary)

    def _advance(self, primary: float) -> ExerciseResult:
        s = self.spec
        rep_completed = False

        if s.lower_is_down:
            if self._state == s.up_label and primary <= s.down_angle:
                self._state = s.down_label
            elif self._state == s.down_label and primary >= s.up_angle:
                self._state = s.up_label
                rep_completed = True
        else:
            if self._state == s.up_label and primary >= s.down_angle:
                self._state = s.down_label
            elif self._state == s.down_label and primary <= s.up_angle:
                self._state = s.up_label
                rep_completed = True

        form_ok, cues = True, []
        if rep_completed:
            form_ok, cues = s.evaluate_form(self._acc)
            self._reps += 1
            if form_ok:
                self._good += 1
            self._acc = s.fresh_acc()

        return ExerciseResult(self._reps, self._good, self._state, form_ok,
                              cues, primary, True, rep_completed)


# --------------------------------------------------------------------------
# Exercise definitions
# --------------------------------------------------------------------------

# Squat — exact thresholds from the original compiled tracker.
SQUAT_DEPTH_TARGET = 70.0
SQUAT_MIN_BACK = 110.0
SQUAT_SYMMETRY = 25.0


def _squat_primary(lm):
    l = joint_angle(lm, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE)
    r = joint_angle(lm, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE)
    if l is None or r is None:
        return None
    return (l + r) / 2.0


def _squat_acc(acc, lm, knee):
    lk = joint_angle(lm, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE) or 0
    rk = joint_angle(lm, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE) or 0
    lb = joint_angle(lm, LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE) or 180
    rb = joint_angle(lm, RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE) or 180
    acc["min_knee"] = min(acc["min_knee"], knee)
    acc["min_back"] = min(acc["min_back"], (lb + rb) / 2.0)
    acc["max_sym"] = max(acc["max_sym"], abs(lk - rk))


def _squat_form(acc):
    cues = []
    if acc["min_knee"] > SQUAT_DEPTH_TARGET:
        cues.append("Go deeper")
    if acc["min_back"] < SQUAT_MIN_BACK:
        cues.append("Keep your chest up")
    if acc["max_sym"] > SQUAT_SYMMETRY:
        cues.append("Keep knees even")
    return (len(cues) == 0, cues)


def _pushup_primary(lm):
    l = joint_angle(lm, LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST)
    r = joint_angle(lm, RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST)
    vals = [v for v in (l, r) if v is not None]
    return sum(vals) / len(vals) if vals else None


def _pushup_acc(acc, lm, elbow):
    bl = joint_angle(lm, LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE) or 180
    br = joint_angle(lm, RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE) or 180
    acc["min_elbow"] = min(acc["min_elbow"], elbow)
    acc["min_body"] = min(acc["min_body"], min(bl, br))


def _pushup_form(acc):
    cues = []
    if acc["min_elbow"] > 95.0:
        cues.append("Lower your chest more")
    if acc["min_body"] < 160.0:
        cues.append("Keep your hips in line")
    return (len(cues) == 0, cues)


def _lunge_primary(lm):
    l = joint_angle(lm, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE)
    r = joint_angle(lm, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE)
    vals = [v for v in (l, r) if v is not None]
    return min(vals) if vals else None


def _lunge_acc(acc, lm, front):
    bl = joint_angle(lm, LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE) or 180
    br = joint_angle(lm, RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE) or 180
    acc["min_front"] = min(acc["min_front"], front)
    acc["min_back"] = min(acc["min_back"], (bl + br) / 2.0)


def _lunge_form(acc):
    cues = []
    if acc["min_front"] > 100.0:
        cues.append("Drop your back knee lower")
    if acc["min_back"] < 150.0:
        cues.append("Stay upright")
    return (len(cues) == 0, cues)


def _elbow_primary(lm):
    l = joint_angle(lm, LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST)
    r = joint_angle(lm, RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST)
    vals = [v for v in (l, r) if v is not None]
    return sum(vals) / len(vals) if vals else None


def _press_acc(acc, lm, elbow):
    acc["max_elbow"] = max(acc["max_elbow"], elbow)


def _press_form(acc):
    cues = []
    if acc["max_elbow"] < 155.0:
        cues.append("Press all the way up")
    return (len(cues) == 0, cues)


def _curl_acc(acc, lm, elbow):
    acc["min_elbow"] = min(acc["min_elbow"], elbow)


def _curl_form(acc):
    cues = []
    if acc["min_elbow"] > 70.0:
        cues.append("Squeeze the curl higher")
    return (len(cues) == 0, cues)


SPECS = {
    "squat": ExerciseSpec(
        "Squat", 100.0, 160.0, "standing", "squatting", True,
        [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
        _squat_primary, _squat_acc, _squat_form,
        lambda: {"min_knee": 180.0, "min_back": 180.0, "max_sym": 0.0},
    ),
    "pushup": ExerciseSpec(
        "Push-up", 90.0, 160.0, "up", "down", True,
        [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST, LEFT_HIP, LEFT_KNEE],
        _pushup_primary, _pushup_acc, _pushup_form,
        lambda: {"min_elbow": 180.0, "min_body": 180.0},
    ),
    "lunge": ExerciseSpec(
        "Lunge", 100.0, 160.0, "standing", "lunging", True,
        [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE],
        _lunge_primary, _lunge_acc, _lunge_form,
        lambda: {"min_front": 180.0, "min_back": 180.0},
    ),
    "shoulder_press": ExerciseSpec(
        "Shoulder press", 90.0, 160.0, "locked", "racked", False,
        [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST],
        _elbow_primary, _press_acc, _press_form,
        lambda: {"max_elbow": 0.0},
    ),
    "bicep_curl": ExerciseSpec(
        "Bicep curl", 150.0, 60.0, "extended", "curled", False,
        [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST],
        _elbow_primary, _curl_acc, _curl_form,
        lambda: {"min_elbow": 180.0},
    ),
}


def make_tracker(exercise_id: str) -> ExerciseTracker:
    spec = SPECS.get(exercise_id, SPECS["squat"])
    return ExerciseTracker(spec)
