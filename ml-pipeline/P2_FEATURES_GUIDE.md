# 🚀 P2 ML Features - Advanced Analytics

## Overview

Three advanced ML features that enhance the MVP with deeper insights:

1. **Predicted Wait Times** - Equipment-specific wait time estimates
2. **Multi-Gym Predictions** - Compare multiple gym locations
3. **Usage Trend Analytics** - Historical patterns and forecasting

---

## 1. Predicted Wait Times (`predicted_wait_times.json`)

**Size:** ~100 KB  
**Purpose:** Estimate how long users will wait for equipment

### Wait Time Algorithm

```
IF probability < 40%:
  wait_time = 0 min (equipment available)
  
ELIF probability < 70%:
  wait_time = base_duration × turnover_factor × (0.5 to 1.5)
  
ELSE (probability >= 70%):
  wait_time = base_duration × turnover_factor × occupancy_ratio × (1.0 to 2.0)
```

### Equipment-Specific Parameters

| Equipment | Units | Avg Set Duration | Turnover Factor |
|-----------|-------|------------------|-----------------|
| Bench Press | 3 | 4 min | 1.0 |
| Squat Rack | 2 | 5 min | 1.2 (slower) |
| Treadmill | 10 | 20 min | 0.5 (long sessions) |
| Dumbbells | 8 | 3 min | 0.7 (quick sets) |

### Structure

```javascript
{
  "bench_press": {
    "Monday": {
      "17": {
        "wait_min": 2,
        "wait_max": 5,
        "wait_label": "2-5 min wait",
        "probability": 0.90,
        "congestion_level": "high",
        "available_units": 1,
        "total_units": 3
      }
    }
  }
}
```

### Usage Example

```javascript
import waitTimes from './data/predicted_wait_times.json';

const day = "Monday";
const hour = 17;
const equipment = "bench_press";

const wait = waitTimes[equipment][day][hour];

if (wait.wait_min === 0) {
  console.log(`${equipment}: No wait - ${wait.available_units} units available!`);
} else {
  console.log(`${equipment}: ${wait.wait_label} (${wait.available_units}/${wait.total_units} free)`);
}
```

### UI Ideas

- **Equipment Card Badge**: Show wait time next to congestion level
- **"No Wait" Filter**: Highlight times with zero wait
- **Wait Time Comparison**: "Coming 2 hours later saves you 8 minutes"
- **Unit Availability**: "2/3 Bench Press units available"

### Demo Talking Points

- "Our system doesn't just tell you the gym is busy - it predicts how long you'll actually wait"
- "Monday 5pm: 2-5 minute wait for Bench Press. Monday 8pm: No wait at all"
- "We factor in equipment turnover rates - Treadmills have longer waits because people use them for 20+ minutes"

---

## 2. Multi-Gym Predictions (`multi_gym_predictions.json`)

**Size:** ~250 KB  
**Purpose:** Compare predictions across multiple gym locations

### Three Gym Profiles

#### 1. FitZone Downtown
- **Type:** Downtown business district
- **Characteristics:** 
  - Very busy during lunch (12-2pm)
  - Peak after work (5-7pm): 1.2× normal congestion
  - Quiet mornings: 0.7× normal congestion
  - Much quieter weekends: 0.6× normal congestion
- **Equipment:** Larger facility (15 treadmills, 6 cable machines)

#### 2. Campus Recreation Center
- **Type:** University gym
- **Characteristics:**
  - Extremely busy 4-8pm (class end time): 1.5× normal congestion
  - Very quiet mornings: 0.5× normal congestion
  - Nearly empty weekends: 0.4× normal congestion
- **Equipment:** Large facility (20 treadmills, 6 bench presses)

#### 3. Suburban Fitness Club
- **Type:** Family-oriented suburban gym
- **Characteristics:**
  - Slightly less crowded overall: 0.9× normal congestion
  - Popular mornings (stay-at-home parents): 1.1× normal congestion
  - Busier weekends (family time): 1.2× normal congestion
- **Equipment:** Smaller facility (2 squat racks, 12 treadmills)

### Structure

```javascript
{
  "gym_downtown": {
    "gym_info": {
      "id": "gym_downtown",
      "name": "FitZone Downtown",
      "type": "downtown",
      "address": "123 Market St",
      "equipment_units": {
        "bench_press": 4,
        "squat_rack": 3,
        "treadmill": 15,
        // ... 8 equipment types
      }
    },
    "predictions": {
      "bench_press": {
        "Monday": {
          "17": {
            "probability": 1.0,
            "congestion_level": "high"
          }
        }
      }
    }
  },
  // ... 2 more gyms
}
```

### Usage Example

```javascript
import multiGym from './data/multi_gym_predictions.json';

// Find best gym for user's preferred time
const day = "Monday";
const hour = 17;

const gymOptions = Object.entries(multiGym).map(([gymId, gymData]) => {
  const avgCongestion = calculateAverageCongestion(gymData, day, hour);
  return {
    name: gymData.gym_info.name,
    address: gymData.gym_info.address,
    congestion: avgCongestion,
    recommendation: avgCongestion < 0.5 ? "Good choice" : "Consider alternative time"
  };
});

gymOptions.sort((a, b) => a.congestion - b.congestion);
console.log(`Best gym: ${gymOptions[0].name} (${gymOptions[0].congestion}% full)`);
```

### UI Ideas

- **Gym Comparison View**: Side-by-side congestion comparison
- **Map with Congestion Overlay**: Show nearby gyms with color-coded pins
- **"Best Alternative Gym"**: Suggest different location if primary is busy
- **Commute vs Congestion**: Balance travel time + wait time
- **Gym Profiles**: Show each gym's unique characteristics

### Demo Talking Points

- "Campus gym at 5pm: 100% full. Suburban gym: 84% full. We help you choose."
- "Downtown gyms are busier on weekdays, but quiet on weekends - we capture these patterns"
- "If your usual gym is packed, we can recommend a nearby alternative with better availability"

---

## 3. Usage Trend Analytics (`usage_trends.json`)

**Size:** ~2 KB  
**Purpose:** Show historical patterns and seasonal trends

### Simulated Seasonal Pattern

**12-Week Timeline:**
- **Weeks 1-4 (January):** 65-69% avg occupancy - New Year's resolution peak
- **Weeks 5-8 (February):** 46-54% avg occupancy - Resolution dropoff
- **Weeks 9-12 (March):** 45-49% avg occupancy - Stable core membership

### Structure

```javascript
{
  "weekly_data": [
    {
      "week": 1,
      "avg_occupancy": 0.69,
      "peak_occupancy": 0.95,
      "off_peak_occupancy": 0.21,
      "busiest_day": "Monday",
      "quietest_day": "Saturday",
      "total_visits_estimate": 690
    },
    // ... 11 more weeks
  ],
  "monthly_data": [
    {
      "month": 1,
      "name": "January",
      "weeks": [1, 2, 3, 4],
      "avg_occupancy": 0.66,
      "trend": "high",
      "description": "Peak usage - New Year's resolution effect"
    },
    // ... 2 more months
  ],
  "insights": {
    "highest_usage_week": {...},
    "lowest_usage_week": {...},
    "average_occupancy_12_weeks": 0.55,
    "trend_direction": "stable",
    "seasonal_pattern": "New Year peak, then stabilization"
  }
}
```

### Usage Example

```javascript
import trends from './data/usage_trends.json';

// Show trend chart
trends.weekly_data.forEach(week => {
  const bar = "█".repeat(week.avg_occupancy * 50);
  console.log(`Week ${week.week}: ${bar} ${(week.avg_occupancy * 100).toFixed(0)}%`);
});

// Show insights
console.log(`Busiest week: Week ${trends.insights.highest_usage_week.week}`);
console.log(`Pattern: ${trends.insights.seasonal_pattern}`);
```

### UI Ideas

- **Trend Line Chart**: Weekly occupancy over time
- **Seasonal Insights**: "January is 30% busier than March"
- **Future Predictions**: "Based on trends, expect higher traffic next week"
- **Historical Comparison**: "This week vs same week last month"
- **Attendance Forecasting**: "Estimated 500 visitors this week"

### Demo Talking Points

- "We track seasonal patterns - January sees a 40% spike in gym usage"
- "Usage drops by 30% after February as New Year's resolutions fade"
- "Understanding these trends helps us recommend when to visit throughout the year"
- "March is our stable baseline - this is true core membership usage"

---

## Integration Checklist

### Quick Wins (30 min)
- [ ] Show wait time on equipment cards
- [ ] Add "No Wait" badge for available equipment
- [ ] Display gym comparison for multi-location users

### Core Features (1-2 hours)
- [ ] Gym comparison view with map
- [ ] Wait time filter ("Show only equipment with <5 min wait")
- [ ] Trend chart showing 12-week pattern

### Advanced (2+ hours)
- [ ] Multi-gym route optimization (travel time + wait time)
- [ ] Predictive analytics ("Next week will be 15% busier")
- [ ] Personalized gym recommendations based on user history

---

## Demo Scenarios

### Scenario 1: Wait Time Impact
**User:** "I want to workout Monday 5pm"  
**System:** "Bench Press: 2-5 min wait. Squat Rack: 3-6 min wait."  
**Recommendation:** "Come at 8pm instead - no wait for any equipment!"

### Scenario 2: Multi-Gym Comparison
**User:** "Where should I go Monday evening?"  
**System:** 
- Campus gym: 100% full
- Downtown gym: 100% full  
- Suburban gym: 84% full ✓
**Recommendation:** "Suburban Fitness Club is your best option"

### Scenario 3: Seasonal Planning
**User:** "When is the gym least crowded?"  
**System:** "March-November are stable months (45% avg). Avoid January (66% avg - New Year rush)"  
**Insight:** "Saturday evenings are consistently the quietest all year"

---

## Testing

Run P2 feature tests:
```bash
cd ml-pipeline/scripts
source ../venv/bin/activate
python test_p2_features.py
```

**Expected:** 3/3 tests passing ✅

---

## Files Summary

| File | Size | Purpose | Demo Value |
|------|------|---------|------------|
| predicted_wait_times.json | ~100 KB | Wait estimates | HIGH - users care about actual wait time |
| multi_gym_predictions.json | ~250 KB | Gym comparison | MEDIUM - valuable for multi-location users |
| usage_trends.json | ~2 KB | Seasonal patterns | MEDIUM - shows sophistication of analysis |

**Total P2 Data:** ~352 KB  
**Combined with P0/P1:** ~500 KB total ML data

---

## Production Considerations

### P2 Features That Work With Synthetic Data ✅
- ✅ Wait time estimation (formula-based)
- ✅ Multi-gym predictions (pattern adjustment)
- ✅ Usage trends (seasonal simulation)

### P2 Features Requiring Real Data ⏳
- ⏳ Live equipment sensors
- ⏳ Actual wait time validation
- ⏳ Real-time gym capacity data
- ⏳ User feedback on prediction accuracy

### Next Steps for Production
1. Partner with gyms for real occupancy data
2. Deploy sensors or partner API integration
3. A/B test wait time accuracy
4. Collect user feedback on predictions
5. Retrain models with real-world data

---

## 🎉 Bottom Line

**P2 features add 3 advanced capabilities that differentiate RepsIn from basic gym apps:**
1. Not just "busy" - tell users **how long they'll wait**
2. Not just one gym - **compare multiple locations**
3. Not just current - show **seasonal patterns and trends**

All features tested and ready for UI integration!
