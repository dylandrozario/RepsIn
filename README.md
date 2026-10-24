# RepsIn

**Train smarter. Skip the wait.**

Gym apps are built for people who already go. RepsIn is built for everyone who doesn't.

---

## The problem

81 million Americans belong to a gym, yet only 1 in 4 adults gets enough exercise ([HFA](https://www.healthandfitness.org/81-million-americans-were-members-of-a-fitness-facility-in-2025-new-hfa-report-finds/), [CDC](https://www.cdc.gov/nchs/fastats/exercise.htm)). People don't skip the gym out of laziness. They skip it because it's packed, they have to wait for machines, or they don't know what to do. Workout apps are built for people who already go, not for everyone who doesn't.

## The solution

RepsIn removes the small hurdles between you and the gym door:

| Hurdle | What RepsIn does |
|---|---|
| "When should I go?" | You drag across the hours you're free on a weekly grid. RepsIn picks your best window at your gym and shows the wait you can expect. |
| "It'll be packed." | The forecast shows the expected wait for each machine, hour by hour, based on foot-traffic data for real Boston gyms. |
| "I'll be stuck waiting." | The Live Floor shows which machines are free. If they're all taken, you can join a queue and get an alert when one opens up, or ask to work in. |
| "I don't know what to do." | You get a workout plan for your goal and session length. It shows which machines are open, and you log your sets as you go. |
| "Am I doing it right?" | The form tracker uses your phone's camera to count reps and coach your form on squats, push-ups, lunges, shoulder presses and bicep curls. |
| "I missed it, so I'm out." | Your profile keeps your streak and history, and flags missed sessions so you can reschedule them. |

---

## Get started

### What you need

- [Node.js](https://nodejs.org) 22.13+ or 24.3+ (required by Expo SDK 58)
- [Git](https://git-scm.com)
- The **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779), [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Python 3.10+, only if you want the form tracker
- Your phone and computer on the same Wi-Fi network

### 1. Download

```bash
git clone https://github.com/dylandrozario/RepsIn.git
cd RepsIn
```

### 2. Run the app

```bash
cd mobile-app
npm install
npx expo start
```

Scan the QR code with your iPhone's Camera app, or from inside Expo Go on Android.

When the app opens:

1. Tap through the welcome screen.
2. On the login screen, tap **Preview as demo account**. This button shows when no Supabase keys are set, so you don't need an account.
3. Pick your goal, your session length and a Boston gym.

### 3. Run the form tracker (optional)

The **Train** tab films you on your phone and sends frames to a small Python server on your computer. The server counts reps and checks your form with OpenCV and MediaPipe.

From the repo root:

```bash
python3 -m venv .venv
.venv/bin/pip install -r opencv-tracker/server/requirements.txt

cd opencv-tracker/server
../../.venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Then open the **Train** tab and allow camera access. The server address usually fills in by itself. If it doesn't, type the address the server printed (for example `http://192.168.1.20:8000`) and tap **Connect**.

If your Wi-Fi blocks phone-to-computer traffic, which many campus networks do, run a tunnel in another terminal and enter the `https://...trycloudflare.com` address it prints:

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:8000
```

More detail is in [TRACKER_SETUP.md](./TRACKER_SETUP.md).

### 4. Real accounts (optional)

Email and Google sign-in use Supabase. You need your own Supabase project, a Google OAuth client and an Expo development build, because Google sign-in doesn't work in Expo Go. Follow [AUTH_SETUP.md](./AUTH_SETUP.md), then copy `mobile-app/.env.example` to `mobile-app/.env` and fill in your keys. Never commit `.env` files.

---

## Using RepsIn

| Tab | What to do |
|---|---|
| **Home** | Drag across the hours you're free, then tap **Build my optimal schedule**. RepsIn reveals your best window and schedules your next workout. Tap **Mark done** after you train. |
| **Forecast** | Move the time slider to see the expected wait for each machine at your gym. |
| **Floor** | See which machines are free. Tap a machine to claim it, join its queue, or ask to work in. |
| **Workout** | Follow your plan. Each exercise shows how many machines are open. Log your sets and reps, then tap **Finish & Free Machine**. |
| **Train** | Pick an exercise, prop your phone so your whole body is in frame, and tap **Start tracking**. |
| **Profile** | See your streak, your workout history and any missed sessions, and edit your preferences. |

### About the data

- **Forecasts** come from BestTime's historical foot-traffic data for each Boston gym. They're split into estimates for each machine type, so they aren't live counts.
- **Live Floor:** in this version, the other members on the floor and in the queues are simulated.

---

## Project structure

```
RepsIn/
├── mobile-app/        Expo / React Native app (screens, components, gym and forecast data)
├── opencv-tracker/    Python pose server for the form tracker (FastAPI, OpenCV, MediaPipe)
├── ml-pipeline/       Python scripts: synthetic occupancy data, model training, Boston gym import
├── supabase/          Database schema for accounts and workout history
└── gym-queue-mvp.html Early HTML prototype of the Live Floor
```

### ML pipeline (optional)

The app already includes its forecast data, so you don't need to run the pipeline to use RepsIn. To regenerate the synthetic dataset and retrain the model:

```bash
cd ml-pipeline
python3 -m venv venv
venv/bin/pip install -r requirements.txt
cd scripts
../venv/bin/python generate_synthetic_data.py
../venv/bin/python train_model.py
```

`requirements.txt` pins versions that only install on Python 3.11 or earlier. On newer Python, install the current versions instead with `venv/bin/pip install numpy pandas scikit-learn matplotlib`.

The results are written to `ml-pipeline/models/`. The app doesn't read them: its forecasts live in `mobile-app/src/data/occupancyPredictions.json` (the Boston gyms). Ignore the "copy to mobile-app" hint that `train_model.py` prints. See [ml-pipeline/README.md](./ml-pipeline/README.md) for details.

---

## Troubleshooting

- **Node version errors or warnings:** install Node 22 LTS (`nvm install 22 && nvm use 22`).
- **The app shows stale code or won't load:** restart Expo with `npx expo start --clear`.
- **The tracker's status dot stays red:** your phone and computer need to be on the same Wi-Fi network, and your firewall must allow Python on port 8000. Check that `http://<computer-ip>:8000/health` opens in your phone's browser, or use the tunnel above.
- **`pip install` fails on MediaPipe:** your Python version may be newer than MediaPipe supports. Create the `.venv` with an older Python, such as 3.12.

## More docs

- [TRACKER_SETUP.md](./TRACKER_SETUP.md): form tracker details
- [AUTH_SETUP.md](./AUTH_SETUP.md): Supabase and Google sign-in
- [ml-pipeline/README.md](./ml-pipeline/README.md): ML pipeline
- [Feature_Roadmap.md](./Feature_Roadmap.md): feature ideas
- [.kiro/specs/repsin-12-hour-mvp/requirements.md](./.kiro/specs/repsin-12-hour-mvp/requirements.md): original requirements

## License

MIT
