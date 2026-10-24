"""Pluggable exercise package.

Each exercise implements the :class:`~exercises.base.Exercise` interface so
new movements can be added by dropping in a new module and registering it.
"""

from .base import Exercise, ExerciseResult  # noqa: F401
from .squat import SquatExercise  # noqa: F401

# Registry maps a CLI-friendly name to an Exercise class.
REGISTRY = {
    "squat": SquatExercise,
}


def create_exercise(name: str) -> Exercise:
    """Instantiate an exercise by name. Raises KeyError for unknown names."""
    key = name.lower().strip()
    if key not in REGISTRY:
        available = ", ".join(sorted(REGISTRY))
        raise KeyError(f"Unknown exercise '{name}'. Available: {available}")
    return REGISTRY[key]()
