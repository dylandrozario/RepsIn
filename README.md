# RepsIn - Smart Gym Workout Planner

> Reduce friction from going to the gym by helping people find time, anticipate equipment congestion, choose an appropriate workout, and build consistency.

**12-Hour Hackathon MVP** · 3 Engineers · React Native/Expo

---

## 🎯 Product Vision

Not just *"how busy is the gym?"* but *"given my schedule and workout goals, when should I go, and what can I do without unnecessary waiting?"*

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (or 22+ for full compatibility)
- Python 3.8+
- Expo Go app on your phone

### Setup (5 minutes)

```bash
# 1. ML Pipeline - Generate training data and train model
cd ml-pipeline
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cd scripts
python generate_synthetic_data.py
python train_model.py

# 2. Copy ML predictions to mobile app
cp ../models/occupancy_predictions.json ../../mobile-app/src/data/

# 3. Mobile App - Install and run
cd ../../mobile-app
npm install
npm start
```

Scan QR code with Expo Go to test on device!

---

## 📦 Project Structure

```
RepsIn/
├── ml-pipeline/              # ML training & data generation
│   ├── scripts/              # Python scripts
│   ├── data/                 # Generated datasets
│   └── models/               # Trained models
├── mobile-app/               # React Native/Expo app
│   └── src/
│       ├── screens/          # UI screens
│       ├── services/         # ML predictor, storage
│       └── data/             # ML predictions, gym data
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

## ⚠️ Important Constraints

### Must Have
- ✅ Expo Go compatibility (no native modules)
- ✅ On-device ML inference (no backend)
- ✅ Local data persistence only
- ✅ Clear "Synthetic Data" labeling

### Must NOT Have
- ❌ Production authentication
- ❌ Backend API or cloud database
- ❌ Live equipment sensors
- ❌ Social features
- ❌ Calendar sync
- ❌ Paid AI APIs

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

### Node version warnings
The latest Expo SDK (58) prefers Node 22+. Node 20 will work but shows warnings. To upgrade:
```bash
# macOS (Homebrew)
brew install node@22

# Or use nvm
nvm install 22
nvm use 22
```

### ML predictions not showing
Make sure you copied the JSON file:
```bash
ls mobile-app/src/data/occupancyPredictions.json
```

### App won't start
Clear cache:
```bash
cd mobile-app
npm start -- --clear
```

---

## 📝 License

MIT - Hackathon Project
