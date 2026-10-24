"""Video capture abstraction: webcam primary, video file fallback.

``VideoSource`` wraps ``cv2.VideoCapture`` so the rest of the app does not
care whether frames come from a live camera or a recorded clip. It is an
iterator that yields BGR frames (numpy arrays) until the stream ends.
"""

from __future__ import annotations

from typing import Iterator, Optional

import cv2


class VideoSourceError(RuntimeError):
    """Raised when neither the webcam nor the fallback file can be opened."""


class VideoSource:
    """Open a webcam by index, falling back to a video file path.

    Parameters
    ----------
    camera_index:
        Index passed to ``cv2.VideoCapture`` for the webcam (default 0).
    video_path:
        Optional path to a video file. If ``prefer_file`` is True or the
        webcam fails to open, this file is used instead.
    prefer_file:
        If True and ``video_path`` is given, use the file directly without
        trying the webcam first.
    """

    def __init__(
        self,
        camera_index: int = 0,
        video_path: Optional[str] = None,
        prefer_file: bool = False,
    ) -> None:
        self.camera_index = camera_index
        self.video_path = video_path
        self.prefer_file = prefer_file
        self._cap: Optional[cv2.VideoCapture] = None
        self.source_label: str = ""
        self.is_file: bool = False
        self._open()

    def _open(self) -> None:
        # Decide order: file-first if requested, otherwise webcam-first.
        if self.prefer_file and self.video_path:
            if self._try_open_file():
                return
            if self._try_open_camera():
                return
        else:
            if self._try_open_camera():
                return
            if self.video_path and self._try_open_file():
                return

        raise VideoSourceError(
            "Could not open a webcam (index "
            f"{self.camera_index})"
            + (f" or video file '{self.video_path}'" if self.video_path else "")
            + ". Check your camera permissions or pass a valid --video path."
        )

    def _try_open_camera(self) -> bool:
        cap = cv2.VideoCapture(self.camera_index)
        if cap.isOpened():
            self._cap = cap
            self.source_label = f"webcam[{self.camera_index}]"
            self.is_file = False
            return True
        cap.release()
        return False

    def _try_open_file(self) -> bool:
        if not self.video_path:
            return False
        cap = cv2.VideoCapture(self.video_path)
        if cap.isOpened():
            self._cap = cap
            self.source_label = f"file[{self.video_path}]"
            self.is_file = True
            return True
        cap.release()
        return False

    @property
    def fps(self) -> float:
        """Best-effort frames-per-second from the capture, default 30."""
        if self._cap is None:
            return 30.0
        fps = self._cap.get(cv2.CAP_PROP_FPS)
        return fps if fps and fps > 0 else 30.0

    def frames(self) -> Iterator["cv2.typing.MatLike"]:
        """Yield frames until the source is exhausted or read fails."""
        if self._cap is None:
            return
        while True:
            ok, frame = self._cap.read()
            if not ok or frame is None:
                break
            yield frame

    def release(self) -> None:
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def __enter__(self) -> "VideoSource":
        return self

    def __exit__(self, *exc) -> None:
        self.release()
