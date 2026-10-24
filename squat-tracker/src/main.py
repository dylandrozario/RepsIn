"""RepsIn - squat form tracker entry point.

Reads frames from a webcam (default) or a video file, runs MediaPipe pose
estimation, tracks squat reps and form, draws a HUD, and logs the session to
a local JSON file on exit.

Usage:
    python src/main.py                     # webcam
    python src/main.py --video clip.mp4    # video file (falls back to webcam)
    python src/main.py --camera 1          # pick a specific camera index
    python src/main.py --exercise squat    # future-proofing for more exercises

Press 'q' (or Esc) in the window to quit.
"""

from __future__ import annotations

import argparse
import os
import sys

import cv2

# Allow running both as `python src/main.py` and from the project root.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from exercises import create_exercise  # noqa: E402
import hud  # noqa: E402
from pose_estimator import PoseEstimator  # noqa: E402
from stats import SessionStats  # noqa: E402
from video_source import VideoSource, VideoSourceError  # noqa: E402

DEFAULT_SESSIONS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sessions.json"
)
WINDOW_NAME = "RepsIn - Squat Form Tracker"


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="RepsIn squat form tracker")
    parser.add_argument("--video", help="Path to a video file to analyze")
    parser.add_argument(
        "--camera", type=int, default=0, help="Webcam index (default: 0)"
    )
    parser.add_argument(
        "--exercise",
        default="squat",
        help="Exercise to track (default: squat)",
    )
    parser.add_argument(
        "--prefer-file",
        action="store_true",
        help="Use the --video file directly instead of trying the webcam first",
    )
    parser.add_argument(
        "--sessions",
        default=DEFAULT_SESSIONS_PATH,
        help="Path to the sessions JSON log",
    )
    parser.add_argument(
        "--no-window",
        action="store_true",
        help="Run without a display window (useful for headless processing)",
    )
    return parser.parse_args(argv)


def run(args: argparse.Namespace) -> int:
    print("RepsIn starting...")

    try:
        exercise = create_exercise(args.exercise)
    except KeyError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    try:
        source = VideoSource(
            camera_index=args.camera,
            video_path=args.video,
            prefer_file=args.prefer_file,
        )
    except VideoSourceError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(f"Source: {source.source_label}")
    print(f"Tracking: {exercise.name}. Press 'q' or Esc to quit.")

    stats = SessionStats(exercise=exercise.name)
    estimator = PoseEstimator()
    last_result = None

    show_window = not args.no_window

    try:
        for frame in source.frames():
            landmarks = estimator.process(frame)
            result = exercise.update(landmarks)
            last_result = result
            stats.record_frame(result.pose_detected)

            if show_window:
                estimator.draw(frame)
                hud.draw(frame, result, exercise_name=exercise.name)
                cv2.imshow(WINDOW_NAME, frame)
                key = cv2.waitKey(1) & 0xFF
                if key == ord("q") or key == 27:  # 'q' or Esc
                    break
    except KeyboardInterrupt:
        print("\nInterrupted.")
    finally:
        source.release()
        estimator.close()
        if show_window:
            cv2.destroyAllWindows()

    # Finalize and persist the session.
    stats.finalize(reps=exercise.reps, good_reps=exercise.good_reps)
    try:
        stats.save(args.sessions)
        saved_to = args.sessions
    except OSError as exc:
        saved_to = None
        print(f"Warning: could not write session log: {exc}", file=sys.stderr)

    print("\n=== Session summary ===")
    print(stats.summary_line())
    if last_result is None:
        print("No frames were processed.")
    if saved_to:
        print(f"Saved to {saved_to}")
    return 0


def main(argv=None) -> int:
    return run(parse_args(argv))


if __name__ == "__main__":
    raise SystemExit(main())
