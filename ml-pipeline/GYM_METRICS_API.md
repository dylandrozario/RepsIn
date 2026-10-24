# 🎯 Gym-Wide Metrics API Documentation

**Phase A ML Features - Ready for UI Integration**

All metrics are pre-computed JSON files located in: `mobile-app/src/data/`

---

## 📊 1. Gym-Wide Congestion (`gym_wide_congestion.json`)

**Size:** ~12 KB  
**Purpose:** Overall gym capacity by hour and day

### Structure
```javascript
{
  "Monday": {
    "6": {
      "average_probability": 0.292,
      "congestion_level": "low",        // "low" | "moderate" | "high"
      "percent_full": 29.0,              // 0-100 percentage
      "busiest_equipment": "Bench Press",
      "busiest_probability": 0.58,
      "quietest_equipment": "Smith Machine",
      "quietest_probability": 0.04,
      "equipment_breakdown": {
        "low": 5,      // Number of equipment in each level
        "moderate": 3,
        "high": 0
      }
    },
    // ... hours 6-22
  },
  // ... all weekdays
}
```

### Usage Example
```javascript
import gymCongestion from './data/gym_wide_congestion.json';

// Get current gym status
const day = "Monday";
const hour = 17; // 5pm
const status = gymCongestion[day][hour];

console.log(`Gym is ${status.percent_full}% full`);
console.log(`Congestion level: ${status.congestion_level.toUpperCase()}`);
console.log(`Busiest: ${status.busiest_equipment} (${Math.round(status.busiest_probability * 100)}%)`);
```

### UI Ideas
- **Gym Overview Widget**: Show current overall capacity
- **Color Badge**: Green (low), Yellow (moderate), Red (high)
- **Breakdown Chart**: Pie chart of equipment_breakdown
- **Comparison**: "74% less crowded than peak time"

---

## ⏰ 2. Peak Hours Analysis (`peak_hours.json`)

**Size:** ~5 KB  
**Purpose:** Best and worst times to visit per day

### Structure
```javascript
{
  "Monday": {
    "peak_hours": [17, 19, 18],           // Top 3 busiest hours
    "peak_details": [
      {
        "hour": 17,
        "probability": 0.907,
        "level": "high",
        "percent_full": 91.0
      }
      // ... 2 more
    ],
    "quiet_hours": [20, 22, 21],          // Top 3 quietest hours
    "quiet_details": [...],               // Same structure as peak_details
    "best_time": 20,                      // Single best hour
    "best_time_percent": 17.0,
    "worst_time": 17,                     // Single worst hour
    "worst_time_percent": 91.0,
    "avoid_message": "Avoid 17:00 (91% full)",
    "suggestion": "Come at 20:00 instead (17% full)"
  },
  // ... all weekdays
  "weekly_insights": {
    "busiest_overall": {
      "weekday": "Monday",
      "hour": 17,
      "percent": 91.0
    },
    "quietest_day": "Saturday",
    "busiest_day": "Monday"
  }
}
```

### Usage Example
```javascript
import peakHours from './data/peak_hours.json';

const day = "Monday";
const data = peakHours[day];

// Show personalized suggestion
console.log(data.avoid_message);
console.log(data.suggestion);

// Display peak hours as "Avoid these times"
data.peak_details.forEach(p => {
  console.log(`${p.hour}:00 - ${p.percent_full}% full`);
});

// Weekly insights
const { busiest_overall, quietest_day } = peakHours.weekly_insights;
console.log(`Busiest: ${busiest_overall.weekday} at ${busiest_overall.hour}:00`);
```

### UI Ideas
- **"Best Time" Card**: Show `suggestion` prominently
- **Avoid Times List**: Red badges for peak_hours
- **Alternative Times**: Green badges for quiet_hours
- **Weekly Insights Widget**: "Quietest day: Saturday"
- **Smart Scheduling**: "You picked 5pm Monday - consider 8pm instead"

---

## 🎨 3. Occupancy Heatmap (`occupancy_heatmap.json`)

**Size:** ~40 KB  
**Purpose:** Visual matrix of all equipment across week

### Structure
```javascript
{
  "equipment": [
    "Bench Press",
    "Squat Rack",
    "Leg Press",
    "Cable Machine",
    "Treadmill",
    "Rowing Machine",
    "Dumbbells",
    "Smith Machine"
  ],
  "equipment_ids": [
    "bench_press",
    "squat_rack",
    // ... matching IDs
  ],
  "hours": [6, 7, 8, ..., 22],            // 17 hours
  "hour_labels": ["6:00", "7:00", ...],
  "weekdays": ["Monday", "Tuesday", ...],
  "data": {
    "Monday": [
      [0.58, 0.59, 0.37, ...],   // Bench Press: 17 hourly values
      [0.72, 0.76, 0.49, ...],   // Squat Rack: 17 hourly values
      // ... 8 equipment arrays
    ],
    // ... all weekdays
  }
}
```

### Usage Example
```javascript
import heatmap from './data/occupancy_heatmap.json';

// Get data for visualization
const day = "Monday";
const dayData = heatmap.data[day];  // [8 equipment][17 hours]

// Example: Find busiest equipment/hour combo
let max = 0, maxEquip = "", maxHour = 0;
dayData.forEach((equipData, equipIdx) => {
  equipData.forEach((prob, hourIdx) => {
    if (prob > max) {
      max = prob;
      maxEquip = heatmap.equipment[equipIdx];
      maxHour = heatmap.hours[hourIdx];
    }
  });
});

console.log(`Busiest: ${maxEquip} at ${maxHour}:00 (${Math.round(max * 100)}%)`);
```

### UI Ideas
- **Heatmap Grid**: Rows = equipment, Columns = hours, Color = occupancy
- **Color Scale**: 
  - 0-30%: Green
  - 30-70%: Yellow
  - 70-100%: Red
- **Interactive**: Tap cell to see exact percentage
- **Filter by Day**: Tabs for each weekday
- **Equipment Focus**: Show single equipment across week
- **Weekly Pattern View**: All 7 days in scrollable grid

---

## 🎬 Demo Talking Points

### Key Insights to Highlight

**Gym-Wide Congestion:**
- "The gym goes from 91% full at 5pm to only 17% full by 8pm"
- "Right now, 5 out of 8 equipment types are available"

**Peak Hours:**
- "Our AI recommends avoiding Monday at 5pm (91% full)"
- "Best time to visit today: 8pm (83% less crowded)"
- "Saturday is the quietest day overall"

**Heatmap:**
- "This heatmap shows Squat Rack is busiest at 5pm Monday (99% occupied)"
- "You can see clear patterns: mornings are quieter, evenings get busy"
- "Cardio equipment (treadmill) peaks earlier than weights"

---

## 🚀 Integration Checklist

- [ ] Import JSON files in React Native components
- [ ] Create helper functions to access data
- [ ] Design UI components for each metric type
- [ ] Add color coding (green/yellow/red)
- [ ] Implement time/day selectors
- [ ] Add "Best Time" recommendation widget
- [ ] Create heatmap visualization (consider library like `react-native-svg`)
- [ ] Test with demo scenarios (Monday 5pm vs 8pm)
- [ ] Add loading states and error handling
- [ ] Polish animations and transitions

---

## 📏 Data Validation

All metrics have been validated:
- ✅ 952 total predictions (8 equipment × 7 days × 17 hours)
- ✅ Peak hours (5-7pm) show 81-91% congestion
- ✅ Off-peak (8-10pm) show 13-25% congestion
- ✅ Demo scenario works: Monday 5pm (91%) vs 8pm (17%)
- ✅ All probability values in valid range [0, 1]
- ✅ All congestion levels in ["low", "moderate", "high"]

---

## 💡 Tips for UI Team

1. **Start Simple**: Display `peak_hours.suggestion` text first
2. **Add Visuals**: Then build gym_wide_congestion overview
3. **Advanced Features**: Heatmap can be saved for polish phase
4. **Use Colors**: Green = go, Red = avoid (universal)
5. **Show Comparisons**: "X% less crowded than Y time" is powerful
6. **Mobile-First**: Scrollable heatmap works better than full grid on phone
7. **Performance**: All data is pre-computed, no ML runtime needed

---

## 📞 Questions?

If you need different data formats or additional metrics, let the ML engineer know!

**Current Status:** ✅ Phase A Complete - Ready for UI integration
**Time to Implement UI:** ~1-2 hours for basic widgets, +1 hour for heatmap
