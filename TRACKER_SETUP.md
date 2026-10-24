# Form Tracker — Expo Go + Python backend

The **Form** tab films your set on the phone (smooth live camera) and sends
frames over Wi-Fi to a Python server running on your laptop. The laptop does the
heavy vision work with OpenCV + MediaPipe, counts reps, checks form, and sends
results back. Everything runs in **Expo Go — no dev build, no App Store, no cost.**

```
iPhone (Expo Go)                    MacBook (Python)
----------------                    ----------------
expo-camera live preview            FastAPI  /analyze
  → capture frame (~4 fps)   Wi-Fi    → OpenCV decode JPEG
  → POST base64 JPEG       ───────►   → MediaPipe pose landmarks
  ◄─────── JSON ───────────────────   → rep state machine + form cues
  render reps / cues / skeleton       → JSON back to phone
```

Phone and laptop **must be on the same Wi-Fi network**.

## Quick start (one command)

From the repo root:

```bash
./start.sh
```

This starts the pose server **and** Expo together. Scan the QR with Expo Go,
open the **Form** tab, and the server URL **fills in and connects automatically**
(it's derived from the Expo dev host — same laptop, port 8000). Pick an exercise
and tap **Start tracking**. Stop everything with Ctrl-C.

On a network that blocks phone↔laptop traffic (many campus/corporate Wi-Fis):

```bash
./start.sh --tunnel      # requires: brew install cloudflared
```

This also opens a public tunnel and prints a `https://...trycloudflare.com` URL.
Type that into the app's **Laptop server** field and tap **Connect**. (The free
tunnel URL changes each launch, so re-enter it each time, or tap **Auto-detect**
to go back to the LAN address.)

---

## Manual start (if you prefer two terminals)

### 1. Pose server (laptop)

```bash
cd "squat-tracker/server"
../../.venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

On startup it prints the LAN address, e.g. `http://136.167.121.45:8000`. The
server uses the MediaPipe model at
`squat-tracker/data/models/pose_landmarker_lite.task` (already in the repo).
Deps live in `.venv`; recreate with
`pip install -r squat-tracker/server/requirements.txt`.

### 2. App (phone)

```bash
cd "mobile-app"
npx expo start
```

Scan the QR with Expo Go.

### 3. Connect and track

1. Open the **Form** tab and allow camera access.
2. The **Laptop server** field auto-fills and connects (green dot). If it
   doesn't, tap **Auto-detect**, or type the URL the server printed and tap
   **Connect**.
3. Pick an exercise, prop the phone so your whole body is in frame, tap
   **Start tracking**.

## Exercises & form cues

| Exercise        | Rep driver                    | Form cues |
|-----------------|-------------------------------|-----------|
| Squat           | Knee angle (down ≤100°, up ≥160°) | Go deeper / Keep your chest up / Keep knees even |
| Push-up         | Elbow angle                   | Lower your chest more / Keep your hips in line |
| Lunge           | Front knee                    | Drop your back knee lower / Stay upright |
| Shoulder press  | Elbow extends overhead        | Press all the way up |
| Bicep curl      | Elbow flexes                  | Squeeze the curl higher |

Squat thresholds are the exact values from the original compiled tracker
(DOWN=100°, UP=160°, depth 70°, back 110°, symmetry 25°).

## Performance notes

- The **camera preview is smooth** (full framerate, on-device). Only the
  analysis overlay refreshes ~4×/sec.
- If the **skeleton** trails your body slightly, that's the round-trip latency
  (~50–150 ms on a good network). Toggle it off with the **Skeleton** button for
  the cleanest look; reps and cues are unaffected.
- Lower `CAPTURE_INTERVAL` in `src/screens/TrackerScreen.js` for faster updates
  (more laptop load), raise it if the network is slow.

## Troubleshooting

- **Dot stays red:** phone and laptop aren't on the same network, a firewall is
  blocking port 8000, or the URL is wrong. Confirm you can open
  `http://<laptop-ip>:8000/health` in the phone's browser.
- **macOS firewall prompt:** allow Python to accept incoming connections.
- **"No person detected":** step back so your whole body is visible.

## Code map

| File | Responsibility |
|------|----------------|
| `squat-tracker/server/app.py` | FastAPI server: decode frame, MediaPipe pose, return JSON |
| `squat-tracker/server/pose_logic.py` | Rep state machines + form checks (Python) |
| `mobile-app/src/screens/TrackerScreen.js` | Camera, capture loop, HUD, server connect |
| `mobile-app/src/tracker/poseClient.js` | HTTP client to the server |
| `mobile-app/src/tracker/SkeletonOverlay.js` | SVG skeleton overlay |
| `mobile-app/src/tracker/geometry.js`, `exercises.js` | JS copies (kept for reference / offline use) |
