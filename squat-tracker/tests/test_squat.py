"""Tests for the squat state machine and form evaluation.

We fabricate MediaPipe-style landmark lists whose relevant joint angles
equal target values, so we can drive the exercise deterministically without
a real video. A simple ``_LM`` object mimics the ``.x/.y/.visibility`` API.
"""

import math

import pytest

from exercises.squat import (
    DEPTH_TARGET,
    DOWN_ANGLE,
    MIN_BACK_ANGLE,
    SYMMETRY_TOLERANCE,
    SquatExercise,
    UP_ANGLE,
)
from geometry import (
    LEFT_ANKLE,
    LEFT_HIP,
    LEFT_KNEE,
    LEFT_SHOULDER,
    RIGHT_ANKLE,
    RIGHT_HIP,
    RIGHT_KNEE,
    RIGHT_SHOULDER,
    angle,
    get_point,
)


class _LM:
    def __init__(self, x=0.5, y=0.5, vis=1.0):
        self.x = x
        self.y = y
        self.visibility = vis


def _make_landmarks(knee_angle, back_angle=120.0, knee_gap=0.0):
    """Build a 33-landmark list producing the requested joint angles.

    Per side, the hip is the knee's reference and the knee is the hip's
    reference, both laid out so the measured angles match the targets:

      * Knee angle (hip-knee-ankle): hip sits straight above the knee, and
        the ankle is rotated ``knee_angle`` degrees away from the knee->hip
        direction.
      * Back angle (shoulder-hip-knee): the knee sits straight below the hip,
        and the shoulder is rotated ``back_angle`` degrees away from the
        hip->knee direction.

    ``knee_gap`` adds to the right-knee angle to create L/R asymmetry.
    """
    lms = [_LM() for _ in range(33)]

    def set_side(shoulder_i, hip_i, knee_i, ankle_i, kangle, bangle):
        hip = (0.5, 0.5)
        knee = (0.5, 0.7)  # straight below the hip

        # Knee angle is measured at the knee between knee->hip (0,-1) and
        # knee->ankle. Rotating (0,-1) by kangle gives (sin, -cos), so the
        # angle between the two arms equals kangle exactly.
        rk = math.radians(kangle)
        ax = knee[0] + 0.2 * math.sin(rk)
        ay = knee[1] - 0.2 * math.cos(rk)
        ankle = (ax, ay)

        # Back angle is measured at the hip between hip->knee (0,+1) and
        # hip->shoulder. Rotating (0,+1) by bangle gives (sin, cos).
        rb = math.radians(bangle)
        sx = hip[0] + 0.2 * math.sin(rb)
        sy = hip[1] + 0.2 * math.cos(rb)
        shoulder = (sx, sy)

        lms[shoulder_i] = _LM(*shoulder)
        lms[hip_i] = _LM(*hip)
        lms[knee_i] = _LM(*knee)
        lms[ankle_i] = _LM(*ankle)

    set_side(LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, knee_angle, back_angle)
    set_side(
        RIGHT_SHOULDER,
        RIGHT_HIP,
        RIGHT_KNEE,
        RIGHT_ANKLE,
        knee_angle + knee_gap,
        back_angle,
    )
    return lms


# --- the fabrication helper must itself be correct ----------------------

def test_helper_produces_target_knee_angle():
    lms = _make_landmarks(90.0)
    measured = angle(
        get_point(lms, LEFT_HIP),
        get_point(lms, LEFT_KNEE),
        get_point(lms, LEFT_ANKLE),
    )
    assert measured == pytest.approx(90.0, abs=0.5)


def test_helper_produces_target_back_angle():
    lms = _make_landmarks(90.0, back_angle=100.0)
    measured = angle(
        get_point(lms, LEFT_SHOULDER),
        get_point(lms, LEFT_HIP),
        get_point(lms, LEFT_KNEE),
    )
    assert measured == pytest.approx(100.0, abs=0.5)


# --- rep counting -------------------------------------------------------

def _do_rep(ex, bottom_knee=90.0, back_angle=120.0, knee_gap=0.0):
    """Feed a full stand->squat->stand cycle through the exercise."""
    ex.update(_make_landmarks(175.0, back_angle))
    ex.update(_make_landmarks(bottom_knee, back_angle, knee_gap))
    return ex.update(_make_landmarks(175.0, back_angle))


def test_counts_one_full_rep():
    ex = SquatExercise()
    _do_rep(ex, bottom_knee=90.0)
    assert ex.reps == 1


def test_counts_multiple_reps():
    ex = SquatExercise()
    for _ in range(3):
        _do_rep(ex, bottom_knee=90.0)
    assert ex.reps == 3


def test_no_rep_on_partial_squat():
    ex = SquatExercise()
    ex.update(_make_landmarks(175.0))
    ex.update(_make_landmarks(DOWN_ANGLE + 10.0))  # never crosses DOWN threshold
    ex.update(_make_landmarks(175.0))
    assert ex.reps == 0


def test_jitter_near_threshold_does_not_double_count():
    ex = SquatExercise()
    ex.update(_make_landmarks(175.0))           # standing
    ex.update(_make_landmarks(DOWN_ANGLE - 1))  # enter squatting
    ex.update(_make_landmarks(DOWN_ANGLE + 1))  # still below UP -> stays squatting
    ex.update(_make_landmarks(DOWN_ANGLE - 1))  # still squatting
    ex.update(_make_landmarks(175.0))           # one rep
    assert ex.reps == 1


# --- form evaluation ----------------------------------------------------

def test_good_form_rep_is_clean():
    ex = SquatExercise()
    _do_rep(ex, bottom_knee=DEPTH_TARGET - 20.0, back_angle=120.0, knee_gap=0.0)
    assert ex.reps == 1
    assert ex.good_reps == 1


def test_forward_lean_marks_rep_bad():
    ex = SquatExercise()
    _do_rep(ex, bottom_knee=90.0, back_angle=MIN_BACK_ANGLE - 20.0)
    assert ex.reps == 1
    assert ex.good_reps == 0


def test_asymmetry_marks_rep_bad():
    ex = SquatExercise()
    # Bottom at left=70, right=70+gap so the AVERAGE knee angle still drops
    # below DOWN_ANGLE (to register the squat) while a large L/R gap trips
    # the symmetry check.
    gap = SYMMETRY_TOLERANCE + 15.0
    _do_rep(ex, bottom_knee=70.0, back_angle=120.0, knee_gap=gap)
    assert ex.reps == 1
    assert ex.good_reps == 0


def test_forward_lean_produces_chest_cue():
    ex = SquatExercise()
    ex.update(_make_landmarks(175.0, 120.0))
    res = ex.update(_make_landmarks(90.0, MIN_BACK_ANGLE - 20.0))
    assert res.form_ok is False
    assert "Keep your chest up" in res.cues


def test_none_landmarks_handled():
    ex = SquatExercise()
    res = ex.update(None)
    assert res.pose_detected is False
    assert res.reps == 0
    assert res.form_ok is True  # no judgement without a person
