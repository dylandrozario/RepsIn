import json
import os

from stats import SessionStats


def test_finalize_computes_counts():
    s = SessionStats(exercise="squat")
    s.finalize(reps=10, good_reps=7)
    assert s.reps == 10
    assert s.good_reps == 7
    assert s.bad_reps == 3
    assert s.duration_seconds >= 0.0


def test_record_frame_counts():
    s = SessionStats()
    s.record_frame(True)
    s.record_frame(False)
    s.record_frame(True)
    assert s.frames_processed == 3
    assert s.frames_with_pose == 2


def test_save_creates_file_and_structure(tmp_path):
    path = os.path.join(str(tmp_path), "nested", "sessions.json")
    s = SessionStats(exercise="squat")
    s.finalize(reps=5, good_reps=4)
    record = s.save(path)

    assert os.path.exists(path)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["exercise"] == "squat"
    assert data[0]["reps"] == 5
    assert data[0]["good_reps"] == 4
    assert data[0]["bad_reps"] == 1
    assert "started_at" in data[0]
    # Internal bookkeeping field must not leak into the record.
    assert "_start_monotonic" not in data[0]
    assert "_start_monotonic" not in record


def test_save_appends_preserving_prior(tmp_path):
    path = os.path.join(str(tmp_path), "sessions.json")

    s1 = SessionStats(exercise="squat")
    s1.finalize(reps=3, good_reps=3)
    s1.save(path)

    s2 = SessionStats(exercise="squat")
    s2.finalize(reps=8, good_reps=5)
    s2.save(path)

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert len(data) == 2
    assert data[0]["reps"] == 3
    assert data[1]["reps"] == 8


def test_save_recovers_from_corrupt_file(tmp_path):
    path = os.path.join(str(tmp_path), "sessions.json")
    with open(path, "w", encoding="utf-8") as f:
        f.write("not valid json {{{")

    s = SessionStats()
    s.finalize(reps=1, good_reps=1)
    s.save(path)

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, list)
    assert len(data) == 1


def test_summary_line_mentions_reps():
    s = SessionStats(exercise="squat")
    s.finalize(reps=10, good_reps=8)
    line = s.summary_line()
    assert "10 reps" in line
    assert "squat" in line
