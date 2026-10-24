"""Exercise interface shared by all tracked movements.

An exercise consumes per-frame pose landmarks and returns an
:class:`ExerciseResult` describing the current rep count, the movement state,
a form verdict, and any coaching cues to display.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ExerciseResult:
    """Snapshot of exercise state after processing one frame."""

    reps: int = 0
    state: str = "unknown"          # e.g. "standing", "squatting"
    form_ok: bool = True            # True = good form, False = at least one issue
    cues: List[str] = field(default_factory=list)  # coaching messages
    primary_angle: Optional[float] = None  # key angle for the HUD (e.g. knee)
    pose_detected: bool = True      # False when no person is visible


class Exercise(ABC):
    """Base class for a pluggable exercise.

    Subclasses implement :meth:`update`, which is called once per frame with
    the MediaPipe landmark list (or ``None`` if no pose was detected).
    """

    #: Human-readable name, used by the HUD and stats.
    name: str = "exercise"

    @abstractmethod
    def update(self, landmarks) -> ExerciseResult:
        """Process one frame of landmarks and return the current result.

        Parameters
        ----------
        landmarks:
            MediaPipe pose landmark list, or ``None`` when no pose is
            detected. Implementations must handle the ``None`` case
            gracefully (return a result with ``pose_detected=False``).
        """
        raise NotImplementedError

    @property
    @abstractmethod
    def reps(self) -> int:
        """Total completed reps so far this session."""
        raise NotImplementedError

    @property
    @abstractmethod
    def good_reps(self) -> int:
        """Reps completed with good form."""
        raise NotImplementedError
