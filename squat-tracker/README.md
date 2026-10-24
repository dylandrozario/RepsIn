# RepsIn

A real-time **squat form tracker** built with Python, [MediaPipe](https://ai.google.dev/edge/mediapipe) pose estimation, and OpenCV. Point it at your webcam (or a video file), do squats, and RepsIn counts your reps, grades your form live, and logs each session to a local JSON file.

## Features

- **Rep counting** — automatic, via a knee-angle state machine with hysteresis so jitter doesn't double-count.
- **Live form feedback** — a red/green HUD with cues like `Go deeper`, `Keep your chest up`, and `Keep knees even`.
- **Session stats** — reps, good vs. bad form, duration, and timestamp appended to `data/sessions.json`.
- **Webcam or video file** — webcam by default, with a video-file fallback (`--video`).
- **Pluggable exercises** — squats today; new movements are a new module in `src/exercises/`.

## Requirements

- Python 3.9–3.12 (MediaPipe does not yet ship wheels for 3.13+)
- A webcam (optional if you only analyze video files)

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

The pose model (`pose_landmarker_lite.task`, ~6 MB) downloads automatically on
first run into `data/models/`.

## Usage

```bash
# Live webcam (default)
python src/main.py

# Analyze a video file (falls back to webcam if the file can't open)
python src/main.py --video path/to/clip.mp4

# Use the video file directly, skipping the webcam
python src/main.py --video path/to/clip.mp4 --prefer-file

# Pick a specific camera index
python src/main.py --camera 1
```

Press **`q`** or **Esc** in the window to quit. On exit, a summary prints to
the console and the session is appended to `data/sessions.json`.

### Useful flags

| Flag | Description |
| --- | --- |
| `--video PATH` | Video file to analyze (fallback for the webcam). |
| `--camera N` | Webcam index (default `0`). |
| `--prefer-file` | Use `--video` directly instead of trying the webcam first. |
| `--exercise NAME` | Exercise to track (default `squat`). |
| `--sessions PATH` | Where to write the session log (default `data/sessions.json`). |
| `--no-window` | Run headless, without a display window. |

## How form tracking works

MediaPipe returns 33 body landmarks per frame. RepsIn computes joint angles
from landmark triples:

- **Knee angle** (hip–knee–ankle) drives rep counting: below ~100° is "down",
  above ~160° is "up". A full down→up cycle is one rep.
- **Back angle** (shoulder–hip–knee) detects excessive forward lean.
- **Knee symmetry** (left vs. right knee angle) flags knees caving in.

The worst values seen during a rep decide whether it's graded good or bad.
Thresholds live at the top of [`src/exercises/squat.py`](src/exercises/squat.py)
and are easy to tune.

## Project layout

```
RepsIn/
  requirements.txt
  src/
    main.py              # entry point, CLI, main loop
    video_source.py      # webcam/file capture with fallback
    pose_estimator.py    # MediaPipe Tasks PoseLandmarker wrapper
    geometry.py          # angle math + landmark helpers
    exercises/
      base.py            # pluggable Exercise interface
      squat.py           # squat rep logic + form rules
    hud.py               # OpenCV overlay drawing
    stats.py             # session tracking + JSON persistence
  tests/                 # pytest suite
  data/
    sessions.json        # created at runtime
    models/              # downloaded pose model (gitignored)
```

## Running tests

```bash
python -m pytest tests/ -v
```

## Adding a new exercise

1. Create `src/exercises/<name>.py` with a class subclassing `Exercise`
   (see `squat.py`). Implement `update(landmarks) -> ExerciseResult`.
2. Register it in `src/exercises/__init__.py`'s `REGISTRY`.
3. Run it with `python src/main.py --exercise <name>`.
