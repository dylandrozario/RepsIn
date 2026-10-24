# RepsIn - Smart Gym Workout Planner

> Reduce friction from going to the gym by helping people find time, anticipate equipment congestion, choose an appropriate workout, and build consistency.

**12-Hour Hackathon MVP** · 3 Engineers · React Native/Expo

---

## 🎯 Product Vision

Not just *"how busy is the gym?"* but *"given my schedule and workout goals, when should I go, and what can I do without unnecessary waiting?"*

## 🚀 Quick Start

RepsIn has three runnable pieces:

| Piece | What it is | Required to demo? |
|-------|-----------|-------------------|
| **Mobile app** (`mobile-app/`) | The Expo / React Native app you run in Expo Go | ✅ Yes |
| **Pose server** (`opencv-tracker/server/`) | FastAPI + MediaPipe server that powers the AI rep tracker (the **Train** tab) | Only for the form-tracking demo |
| **ML pipeline** (`ml-pipeline/`) | Offline scripts that generated the baked foot-traffic data | ❌ No — its output is already committed |

> **Important:** your **phone and your laptop must be on the same Wi-Fi network.** Expo Go connects to the Metro bundler over the LAN, and the app auto-discovers the pose server at the same laptop IP on port `8000`.

### Prerequisites

- **Node.js 20+** (22+ recommended — Expo SDK 58 prefers it). If you use `nvm`: `nvm install 22 && nvm use 22`.
- **Python 3.10+** (only needed for the pose server)
- **Expo Go** app installed on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- A **Supabase** project (free tier) for auth — or use the built-in demo bypass (see below)

---

### 1. Mobile app (required)

```bash
cd mobile-app
npm install
```

Create your environment file from the template and fill in your Supabase **public** values (Dashboard → Project Settings → API):

```bash
cp .env.example .env
```

```ini
# mobile-app/.env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
```

> These are **public** client values — safe to commit to your own private env, but `.env` is git-ignored here by design. Never put the service-role key or any OAuth client secret in this file.
>
> **No Supabase handy?** Leave `.env` empty and tap **"Preview as demo account"** on the login screen to explore the whole app with a local fake session.

If you're using real auth, apply the database schema once in the Supabase SQL editor:

```bash
# paste the contents of supabase/schema.sql into Supabase → SQL Editor → Run
```

Start the app:

```bash
npm start            # or: npx expo start
# npx expo start --clear   # use --clear if you hit a stale-cache error
```

Scan the QR code with **Expo Go** (Android) or the **Camera** app (iOS). Metro also prints `exp://<your-lan-ip>:8081`.

---

### 2. Pose server — AI rep tracker (optional, for the Train tab)

The **Train** tab streams camera frames to a local Python server that runs
MediaPipe pose detection and counts reps / gives form cues. The app finds the
server automatically at `http://<laptop-lan-ip>:8000` — **no IP typing needed**,
as long as the server runs on the same laptop as Metro.

One-time setup (creates a shared virtualenv at the repo root):

```bash
# from the repo root
python3 -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\activate
pip install -r opencv-tracker/server/requirements.txt
```

Run the server (keep it running in its own terminal):

```bash
cd opencv-tracker/server
../../.venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

The server prints its LAN IP on startup and exposes `GET /health`. Verify it:

```bash
curl http://localhost:8000/health
```

> **Auth is optional on the server.** It tracks reps anonymously out of the box.
> To scope sessions to the signed-in user, copy `opencv-tracker/server/.env.example`
> to `opencv-tracker/server/.env` and add your `SUPABASE_JWT_SECRET`.

---

### Run everything together (two terminals)

```bash
# Terminal 1 — Metro / Expo
cd mobile-app && npm start

# Terminal 2 — pose server (only needed for the Train tab)
cd opencv-tracker/server && ../../.venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Then open Expo Go on your phone (same Wi-Fi) and scan the QR code. The Train tab's connection card should show the server as reachable.

---

### (Optional) Regenerate the ML foot-traffic data

The app ships with pre-generated data (`mobile-app/src/data/occupancyPredictions.json` and `bostonGyms.json`), so you **don't** need this to run the app. To regenerate it:

```bash
cd ml-pipeline
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cd scripts
python generate_synthetic_data.py
python train_model.py
```

---

## 📦 Project Structure

```
RepsIn/
├── mobile-app/               # React Native / Expo app
│   ├── .env.example          # Supabase public config template → copy to .env
│   └── src/
│       ├── screens/          # UI screens (Home, Forecast, Floor, Workout, Train, Profile, …)
│       ├── navigation/       # Tab + stack navigators
│       ├── context/          # Theme / Gym / Profile / Session providers
│       ├── auth/             # Supabase auth context
│       ├── components/       # Shared UI (HeroCard, GymDropdown, MachineCard, …)
│       ├── services/         # Occupancy predictor, recommendations, storage
│       ├── tracker/          # Pose client (talks to the pose server)
│       └── data/             # Baked ML predictions + Boston gym data
├── opencv-tracker/           # AI rep-tracker (Python)
│   ├── server/               # FastAPI + MediaPipe pose server (app.py)
│   └── data/models/          # Bundled pose_landmarker_lite.task
├── ml-pipeline/              # Offline ML data generation (output already baked in)
│   └── scripts/              # generate_synthetic_data.py, train_model.py
├── supabase/
│   └── schema.sql            # Profiles table + RLS policies
├── .venv/                    # Shared Python venv for the pose server (git-ignored)
└── Feature_Roadmap.md        # Complete feature spec
```

---

## 👥 Team Responsibilities

### Engineer 1: Mobile/UI
**Deliverables:**
- Onboarding flow (goals, experience, duration, gym, availability)
- Home dashboard with next workout & progress
- Equipment forecast screen with time slider
- Workout time recommendations screen
- Workout display & completion tracking

**Tech Stack:** React Native, Expo, React Navigation, AsyncStorage

### Engineer 2: ML
**Deliverables:**
- Synthetic training dataset (8 weeks, realistic patterns)
- Equipment occupancy predictor (JSON lookup table)
- Model validation & export for on-device use
- Integration testing with mobile app

**Tech Stack:** Python, scikit-learn, pandas, numpy

### Engineer 3: Integration/Recommendations
**Deliverables:**
- Availability window logic
- Workout time ranking algorithm (ML + schedule)
- Workout generator (goals + duration + equipment)
- Exercise database
- Local persistence layer

**Tech Stack:** JavaScript, AsyncStorage, business logic

---

## 🎯 MVP Features (P0)

### 1. Onboarding
- Fitness goals (5 options)
- Experience level (beginner/intermediate/advanced)
- Preferred workout duration (20/30/45/60/90 min)
- Gym selection
- Weekly availability windows

### 2. ML Equipment Predictions
- Synthetic training data (clearly labeled)
- Equipment-level occupancy forecasts
- Interactive time slider
- Congestion levels (low/moderate/high)
- Best availability window finder

### 3. Smart Scheduling
- Combine user availability + gym hours + ML predictions
- Rank workout time slots
- Detect conflicts
- Exclude closed hours

### 4. Workout Generation
- Personalized routines (goals + experience)
- Duration-aware (fit in time budget)
- Equipment-aware (use gym inventory)
- ML-aware (prefer less crowded equipment)
- Exercise substitutions

### 5. Dashboard & Progress
- Home screen with next workout
- Weekly completion progress
- Equipment forecast viewer
- Scheduled workouts list

---

## ⏱️ 12-Hour Timeline

| Time | All Engineers |
|------|---------------|
| **0-1h** | Setup, agree on data contracts, API interfaces |
| **1-5h** | Parallel development (UI, ML, Integration) |
| **5-8h** | Integration - connect all components |
| **8-10h** | End-to-end testing on real device |
| **10-12h** | Bug fixes, polish, demo rehearsal |

### Data Contracts

#### ML → Mobile App
```javascript
{
  equipmentType: "bench_press",
  probability: 0.73,           // 0.0-1.0
  congestionLevel: "high"      // low/moderate/high
}
```

#### User Preferences
```javascript
{
  goal: "muscle_building",
  experience: "intermediate",
  duration: 60,
  gymId: "gym-001"
}
```

#### Availability Window
```javascript
{
  id: "window-1",
  weekday: "Monday",
  startHour: 17,
  endHour: 19
}
```

---

## ✅ Success Criteria

- [ ] Runs on mobile device via Expo Go
- [ ] User completes onboarding flow
- [ ] ML predictions load and display correctly
- [ ] Forecasts labeled as "Synthetic Demo Data"
- [ ] Time slider updates predictions (<500ms)
- [ ] Recommendations exclude conflicts & closed hours
- [ ] User receives personalized workout plan
- [ ] User can schedule & complete workout
- [ ] Data persists after app restart

---

## 🧱 Architecture notes

- **Expo Go friendly.** The core app runs in Expo Go with no custom native modules. The AI rep tracker streams frames to a local Python server (rather than running pose detection on-device), which keeps it Expo Go compatible.
- **Auth:** Supabase email/password + Google OAuth, with a local demo bypass when Supabase isn't configured.
- **Data:** gym foot-traffic is baked from the ML pipeline (BestTime-derived) and read from JSON at runtime. Workout/availability/streak state persists locally via AsyncStorage.
- **Pose server:** FastAPI + OpenCV + MediaPipe; optional Supabase JWT verification to scope sessions to a user.

---

## 📚 Documentation

- **[Feature Roadmap](./Feature_Roadmap.md)** - Complete P0/P1/P2 feature list
- **[ML Pipeline README](./ml-pipeline/README.md)** - Training & data generation
- **[Mobile App README](./mobile-app/README.md)** - UI development guide
- **[Requirements Doc](./.kiro/specs/repsin-12-hour-mvp/requirements.md)** - Formal requirements

---

## 🎬 Demo Script

1. **Onboard**: "I'm an intermediate lifter looking to build muscle with 60-minute workouts"
2. **Availability**: "I'm free Monday/Wednesday/Friday 5-7pm"
3. **Forecast**: Slide through hours - "Look, 5pm is packed but 2pm is quiet"
4. **Recommend**: "The system suggests Wednesday 2pm with low congestion"
5. **Workout**: "Here's a 60-min push workout optimizing for available equipment"
6. **Schedule**: Save workout, mark complete, show progress

---

## 🔧 Troubleshooting

### App won't start / "cannot read bytecode" / stale cache
Start Metro with a clean cache:
```bash
cd mobile-app
npx expo start --clear
```

### Phone can't connect to Metro (QR scans but won't load)
Make sure the **phone and laptop are on the same Wi-Fi**, and that the network
isn't a guest/AP-isolation network that blocks device-to-device traffic. Metro
prints the LAN URL (`exp://<ip>:8081`) — you can type it into Expo Go manually.

### Train tab says the AI coach isn't reachable
1. Confirm the pose server is running: `curl http://localhost:8000/health`
2. Confirm it's bound to all interfaces (`--host 0.0.0.0`, not `127.0.0.1`).
3. Confirm the server is on the **same laptop** running Metro (the app derives
   the server IP from the Expo host). On a different machine, you'd need to set
   the URL manually.
4. Check the laptop firewall allows inbound connections on port `8000`.

### Login screen shows "Supabase isn't configured"
Your `mobile-app/.env` is missing or empty. Fill in `EXPO_PUBLIC_SUPABASE_URL`
and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, then restart with `npx expo start --clear`
(env vars are read at bundler start). Or just tap **"Preview as demo account"**.

### `expo-image-picker` / dependency errors after a pull
Dependencies changed — reinstall:
```bash
cd mobile-app && npm install
```

### Node version warnings
Expo SDK 58 prefers Node 22+. To upgrade with nvm:
```bash
nvm install 22 && nvm use 22
```

### Pose server: `mediapipe` fails to install
MediaPipe ships wheels for Python 3.10–3.12. If `pip install` can't find a
wheel, check your Python version (`python3 --version`) and use one in that range.

---

## 📝 License

MIT - Hackathon Project
