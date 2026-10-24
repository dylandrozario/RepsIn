"""Session statistics tracking and JSON persistence.

A :class:`SessionStats` instance accumulates counts during a workout. On
:meth:`save`, the session is appended to a JSON file (an array of session
records), creating the file if it does not yet exist.
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import List


@dataclass
class SessionStats:
    exercise: str = "squat"
    reps: int = 0
    good_reps: int = 0
    bad_reps: int = 0
    frames_processed: int = 0
    frames_with_pose: int = 0
    started_at: str = field(default_factory=lambda: _now_iso())
    duration_seconds: float = 0.0
    _start_monotonic: float = field(default_factory=time.monotonic, repr=False)

    def record_frame(self, pose_detected: bool) -> None:
        self.frames_processed += 1
        if pose_detected:
            self.frames_with_pose += 1

    def finalize(self, reps: int, good_reps: int) -> None:
        """Capture final counts and elapsed time before saving."""
        self.reps = reps
        self.good_reps = good_reps
        self.bad_reps = max(0, reps - good_reps)
        self.duration_seconds = round(time.monotonic() - self._start_monotonic, 2)

    def to_record(self) -> dict:
        """Serializable dict without internal bookkeeping fields."""
        data = asdict(self)
        data.pop("_start_monotonic", None)
        return data

    def save(self, path: str) -> dict:
        """Append this session to the JSON array at ``path``.

        Returns the record that was written. Creates parent directories and
        the file if needed. Corrupt or non-list existing content is replaced
        with a fresh list (the new session is never lost).
        """
        record = self.to_record()
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

        sessions: List[dict] = []
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                if isinstance(loaded, list):
                    sessions = loaded
            except (json.JSONDecodeError, OSError):
                sessions = []

        sessions.append(record)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(sessions, f, indent=2)
        return record

    def summary_line(self) -> str:
        acc = (self.good_reps / self.reps * 100.0) if self.reps else 0.0
        return (
            f"{self.exercise}: {self.reps} reps "
            f"({self.good_reps} good / {self.bad_reps} to fix, {acc:.0f}% clean) "
            f"in {self.duration_seconds:.0f}s"
        )


def _now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
