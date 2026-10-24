"""On-screen heads-up display drawn with OpenCV.

Renders a functional HUD onto each frame:
  * rep counter and current movement state
  * live primary (knee) angle
  * a red/green form status bar with active coaching cues
"""

from __future__ import annotations

from typing import Optional

import cv2

from exercises.base import ExerciseResult

# BGR colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GREEN = (60, 200, 60)
RED = (40, 40, 220)
AMBER = (0, 170, 255)
PANEL = (40, 40, 40)

FONT = cv2.FONT_HERSHEY_SIMPLEX


def _panel(frame, x1, y1, x2, y2, color, alpha=0.55):
    """Draw a semi-transparent filled rectangle (panel) onto the frame."""
    overlay = frame.copy()
    cv2.rectangle(overlay, (x1, y1), (x2, y2), color, thickness=-1)
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)


def draw(frame, result: ExerciseResult, exercise_name: str = "squat"):
    """Draw the HUD for ``result`` onto ``frame`` (modified in place)."""
    h, w = frame.shape[:2]

    # --- Top-left info panel: exercise, reps, state, angle ---
    _panel(frame, 10, 10, 320, 150, PANEL)
    cv2.putText(frame, exercise_name.upper(), (24, 44), FONT, 0.8, WHITE, 2, cv2.LINE_AA)
    cv2.putText(frame, f"Reps: {result.reps}", (24, 86), FONT, 1.0, WHITE, 2, cv2.LINE_AA)

    state_txt = result.state.capitalize()
    cv2.putText(frame, f"State: {state_txt}", (24, 118), FONT, 0.6, WHITE, 1, cv2.LINE_AA)

    if result.primary_angle is not None:
        cv2.putText(
            frame,
            f"Knee: {result.primary_angle:4.0f} deg",
            (24, 142),
            FONT,
            0.6,
            WHITE,
            1,
            cv2.LINE_AA,
        )

    # --- Bottom status bar: red/green form verdict + cues ---
    bar_h = 54
    if not result.pose_detected:
        bar_color = AMBER
        status_text = result.cues[0] if result.cues else "No person detected"
    elif result.form_ok:
        bar_color = GREEN
        status_text = "GOOD FORM"
    else:
        bar_color = RED
        status_text = " | ".join(result.cues) if result.cues else "CHECK FORM"

    _panel(frame, 0, h - bar_h, w, h, bar_color, alpha=0.75)
    cv2.putText(
        frame,
        status_text,
        (20, h - bar_h // 2 + 8),
        FONT,
        0.9,
        WHITE,
        2,
        cv2.LINE_AA,
    )
    return frame
