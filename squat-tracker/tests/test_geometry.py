import math

import pytest

from geometry import angle, get_point, to_xy, visibility


def test_right_angle():
    # a at (0,1), vertex b at (0,0), c at (1,0) -> 90 degrees
    assert angle((0, 1), (0, 0), (1, 0)) == pytest.approx(90.0, abs=1e-6)


def test_straight_line():
    # a, b, c colinear and b in the middle -> 180 degrees
    assert angle((0, 0), (1, 0), (2, 0)) == pytest.approx(180.0, abs=1e-6)


def test_zero_angle():
    # a and c on the same side of b -> 0 degrees
    assert angle((1, 0), (0, 0), (1, 0)) == pytest.approx(0.0, abs=1e-6)


def test_45_degrees():
    assert angle((1, 1), (0, 0), (1, 0)) == pytest.approx(45.0, abs=1e-6)


def test_degenerate_returns_zero():
    # Coincident points cannot form an angle; return 0 rather than raising.
    assert angle((0, 0), (0, 0), (1, 0)) == 0.0


class _LM:
    def __init__(self, x, y, vis=1.0):
        self.x = x
        self.y = y
        self.visibility = vis


def test_landmark_helpers():
    lms = [_LM(0.1, 0.2, 0.9), _LM(0.3, 0.4, 0.4)]
    assert to_xy(lms[0]) == (0.1, 0.2)
    assert get_point(lms, 1) == (0.3, 0.4)
    assert visibility(lms, 0) == pytest.approx(0.9)
    assert visibility(lms, 1) == pytest.approx(0.4)
