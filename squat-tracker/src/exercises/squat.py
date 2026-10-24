"""Squat tracking: rep counting state machine + form evaluation.

Rep counting uses a two-state machine (STANDING <-> SQUATTING) driven by the
knee angle (hip-knee-ankle). Hysteresis via two thresholds prevents jitter
near a single boundary from producing phantom reps:

    knee angle <= DOWN_ANGLE  -> enter SQUATTING
    knee angle >= UP_ANGLE    -> enter STANDING (counts a rep if we had
                                 been squatting)

Form evaluation runs continuously and, at the moment a rep completes, the
"worst" form seen during the descent is used to label the rep good or bad.

Form checks:
  * Depth: the deepest (minimum) knee angle during the rep must reach
    ``DEPTH_TARGET`` (lower = deeper). Shallow squats -> "Go deeper".
  * Back lean: the hip angle (shoulder-hip-knee) should not collapse below
    ``MIN_BACK_ANGLE`` -> "Keep your chest up".
  * Knee symmetry: left/right knee angles should stay within
    ``SYMMETRY_TOLERANCE`` degrees of each other -> "Keep knees even".
"""

from __future__ import annotations

from typing import List, Optional

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
    visibility,
)

from .base import Exercise, ExerciseResult

# --- Tunable thresholds (degrees) ---------------------------------------
UP_ANGLE = 160.0          # knee angle at/above this = standing
DOWN_ANGLE = 100.0        # knee angle at/below this = squatting
DEPTH_TARGET = 110.0      # must reach at least this depth for a "deep enough" rep
MIN_BACK_ANGLE = 70.0     # hip angle below this = excessive forward lean
SYMMETRY_TOLERANCE = 25.0 # allowed L/R knee angle difference
VISIBILITY_THRESHOLD = 0.5  # landmarks below this are considered unreliable

STATE_STANDING = "standing"
STATE_SQUATTING = "squatting"


class SquatExercise(Exercise):
    name = "squat"

    def __init__(self) -> None:
        self._state = STATE_STANDING
        self._reps = 0
        self._good_reps = 0

        # Tracks the worst form observed during the current descent.
        self._min_knee_angle = 180.0      # deepest point this rep
        self._min_back_angle = 180.0      # most forward lean this rep
        self._max_symmetry_gap = 0.0      # worst L/R asymmetry this rep

    # -- public read-only state -----------------------------------------
    @property
    def reps(self) -> int:
        return self._reps

    @property
    def good_reps(self) -> int:
        return self._good_reps

    @property
    def state(self) -> str:
        return self._state

    # -- core update ----------------------------------------------------
    def update(self, landmarks) -> ExerciseResult:
        if landmarks is None:
            return ExerciseResult(
                reps=self._reps,
                state=self._state,
                form_ok=True,
                cues=["No person detected"],
                primary_angle=None,
                pose_detected=False,
            )

        # Require the key lower-body landmarks to be reasonably visible.
        needed = [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE]
        if any(visibility(landmarks, idx) < VISIBILITY_THRESHOLD for idx in needed):
            return ExerciseResult(
                reps=self._reps,
                state=self._state,
                form_ok=True,
                cues=["Step fully into frame"],
                primary_angle=None,
                pose_detected=True,
            )

        left_knee = angle(
            get_point(landmarks, LEFT_HIP),
            get_point(landmarks, LEFT_KNEE),
            get_point(landmarks, LEFT_ANKLE),
        )
        right_knee = angle(
            get_point(landmarks, RIGHT_HIP),
            get_point(landmarks, RIGHT_KNEE),
            get_point(landmarks, RIGHT_ANKLE),
        )
        knee_angle = (left_knee + right_knee) / 2.0

        left_back = angle(
            get_point(landmarks, LEFT_SHOULDER),
            get_point(landmarks, LEFT_HIP),
            get_point(landmarks, LEFT_KNEE),
        )
        right_back = angle(
            get_point(landmarks, RIGHT_SHOULDER),
            get_point(landmarks, RIGHT_HIP),
            get_point(landmarks, RIGHT_KNEE),
        )
        back_angle = (left_back + right_back) / 2.0

        symmetry_gap = abs(left_knee - right_knee)

        return self._advance(knee_angle, back_angle, symmetry_gap)

    def _advance(
        self,
        knee_angle: float,
        back_angle: float,
        symmetry_gap: float,
    ) -> ExerciseResult:
        """Drive the state machine and build the per-frame result."""
        # While moving, remember the worst form values of the current rep.
        self._min_knee_angle = min(self._min_knee_angle, knee_angle)
        self._min_back_angle = min(self._min_back_angle, back_angle)
        self._max_symmetry_gap = max(self._max_symmetry_gap, symmetry_gap)

        rep_completed = False

        if self._state == STATE_STANDING:
            if knee_angle <= DOWN_ANGLE:
                # Begin a new descent; reset per-rep trackers to this frame.
                self._state = STATE_SQUATTING
                self._min_knee_angle = knee_angle
                self._min_back_angle = back_angle
                self._max_symmetry_gap = symmetry_gap
        elif self._state == STATE_SQUATTING:
            if knee_angle >= UP_ANGLE:
                # Returned to standing -> a rep is complete.
                self._state = STATE_STANDING
                self._reps += 1
                rep_completed = True

        # Live form evaluation for the HUD (uses worst-so-far this rep).
        form_ok, cues = self._evaluate_form(
            self._min_knee_angle, self._min_back_angle, self._max_symmetry_gap
        )

        if rep_completed and form_ok:
            self._good_reps += 1

        return ExerciseResult(
            reps=self._reps,
            state=self._state,
            form_ok=form_ok,
            cues=cues,
            primary_angle=knee_angle,
            pose_detected=True,
        )

    @staticmethod
    def _evaluate_form(
        min_knee_angle: float,
        min_back_angle: float,
        max_symmetry_gap: float,
    ) -> tuple[bool, List[str]]:
        """Return (form_ok, cues) from the worst values seen this rep."""
        cues: List[str] = []

        if min_knee_angle > DEPTH_TARGET:
            cues.append("Go deeper")
        if min_back_angle < MIN_BACK_ANGLE:
            cues.append("Keep your chest up")
        if max_symmetry_gap > SYMMETRY_TOLERANCE:
            cues.append("Keep knees even")

        return (len(cues) == 0, cues)
