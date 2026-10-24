# RepsIn Mobile App

React Native/Expo mobile app for smart gym workout planning with ML-powered equipment availability forecasting.

## 🎯 MVP Features

- ✅ User onboarding (goals, experience, preferences)
- ✅ Manual weekly availability input
- ✅ Equipment occupancy predictions (ML-based)
- ✅ Interactive time slider for forecast exploration
- ✅ Smart workout time recommendations
- ✅ Personalized workout generation
- ✅ Workout scheduling & completion tracking
- ✅ Local data persistence

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Run on Expo Go

```bash
npm start
```

Then scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

## 📁 Project Structure

```
mobile-app/
├── src/
│   ├── screens/          # Screen components
│   │   ├── OnboardingScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ForecastScreen.js
│   │   ├── RecommendationsScreen.js
│   │   └── WorkoutScreen.js
│   ├── components/       # Reusable components
│   ├── services/         # Business logic
│   │   ├── occupancyPredictor.js    # ML predictions
│   │   └── storageService.js        # AsyncStorage wrapper
│   ├── utils/            # Helper functions
│   └── data/             # Static data
│       ├── occupancyPredictions.json  # ML model output
│       └── gymData.js                 # Demo gym info
├── App.js                # Root component
└── package.json
```

## 🔌 Integration with ML Pipeline

After training the ML model:

```bash
# From ml-pipeline directory
cp models/occupancy_predictions.json ../mobile-app/src/data/
```

The app will automatically load predictions via `occupancyPredictor.js`.

## 📱 Key Services

### OccupancyPredictor

```javascript
import occupancyPredictor from './services/occupancyPredictor';

// Predict single equipment
const prediction = occupancyPredictor.predict('bench_press', 'Monday', 17);
// { probability: 0.85, congestionLevel: 'high' }

// Get all equipment predictions
const allPredictions = occupancyPredictor.predictAll('Monday', 17);

// Find best time
const bestTime = occupancyPredictor.findBestTime('Monday', 6, 22);
// { hour: 14, avgCongestion: 0.35, congestionLevel: 'low' }
```

### StorageService

```javascript
import storageService from './services/storageService';

// Save preferences
await storageService.saveUserPreferences({
  goal: 'muscle_building',
  experience: 'intermediate',
  duration: 60
});

// Load preferences
const prefs = await storageService.getUserPreferences();
```

## 🎨 UI Engineer Tasks

### Priority Screens (P0)

1. **OnboardingScreen** - Collect user preferences
2. **HomeScreen** - Dashboard with next workout & progress
3. **ForecastScreen** - Equipment availability with time slider
4. **RecommendationsScreen** - Ranked workout time suggestions
5. **WorkoutScreen** - Display generated workout plan

### Components to Build

- `TimeSlider` - Interactive hour selector
- `EquipmentCard` - Show equipment with congestion indicator
- `CongestionBadge` - Color-coded low/moderate/high
- `AvailabilityPicker` - Weekly schedule builder
- `WorkoutCard` - Exercise list with sets/reps
- `ProgressRing` - Weekly completion progress

## ⚠️ Important Constraints

- ✅ Must work in Expo Go (no native modules)
- ✅ All data stored locally (AsyncStorage)
- ✅ No backend API calls
- ✅ No external auth services
- ✅ Display "Synthetic Demo Data" warning on forecast screens

## 🧪 Testing

```bash
# Run with Expo Go
npm start

# Build for testing (if time permits)
npm run ios      # Requires macOS + Xcode
npm run android  # Requires Android Studio
```

## 📊 Data Flow

```
User Input → StorageService → AsyncStorage
                    ↓
          OccupancyPredictor → ML Predictions → UI
                    ↓
          RecommendationEngine → Ranked Times → UI
```

## 🎯 12-Hour Timeline

| Hours | UI Engineer Tasks |
|-------|-------------------|
| 0-1   | Setup navigation, create screen skeletons |
| 1-3   | Build onboarding flow |
| 3-5   | Implement forecast screen with time slider |
| 5-7   | Integrate ML predictions, test on device |
| 7-9   | Build home dashboard & recommendations |
| 9-10  | Add workout display & completion tracking |
| 10-12 | Polish UI, fix bugs, rehearse demo |

## 💡 Tips

- Use React Navigation for screen flow
- Keep components simple (avoid over-engineering)
- Test on real device frequently (not just simulator)
- Use Expo's built-in components where possible
- Focus on core flow first, polish later
