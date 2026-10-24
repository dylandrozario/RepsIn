#!/usr/bin/env python3
"""
Generate P2 ML Features:
1. Predicted wait times
2. Multi-gym predictions 
3. Usage trend analytics
"""

import json
from pathlib import Path
import random

def generate_wait_times():
    """
    Generate predicted wait times based on occupancy probability
    
    Wait time estimation formula:
    - Probability < 40%: No wait expected
    - Probability 40-70%: Short wait (equipment turnover)
    - Probability > 70%: Longer waits (most units occupied)
    
    Average set duration: 3-5 minutes
    Rest between sets: 1-2 minutes
    Total per user cycle: 4-7 minutes
    """
    print("🕐 Generating Predicted Wait Times")
    print("=" * 60)
    
    models_dir = Path(__file__).parent.parent / "models"
    
    # Load equipment predictions
    with open(models_dir / "occupancy_predictions.json") as f:
        predictions = json.load(f)
    
    # Equipment metadata for wait time calculations
    equipment_metadata = {
        "bench_press": {"units": 3, "avg_set_duration": 4, "turnover_factor": 1.0},
        "squat_rack": {"units": 2, "avg_set_duration": 5, "turnover_factor": 1.2},
        "leg_press": {"units": 2, "avg_set_duration": 4, "turnover_factor": 0.9},
        "cable_machine": {"units": 4, "avg_set_duration": 3, "turnover_factor": 0.8},
        "treadmill": {"units": 10, "avg_set_duration": 20, "turnover_factor": 0.5},
        "rowing_machine": {"units": 5, "avg_set_duration": 15, "turnover_factor": 0.6},
        "dumbbells": {"units": 8, "avg_set_duration": 3, "turnover_factor": 0.7},
        "smith_machine": {"units": 2, "avg_set_duration": 4, "turnover_factor": 1.0}
    }
    
    equipment_names = {
        "bench_press": "Bench Press",
        "squat_rack": "Squat Rack",
        "leg_press": "Leg Press",
        "cable_machine": "Cable Machine",
        "treadmill": "Treadmill",
        "rowing_machine": "Rowing Machine",
        "dumbbells": "Dumbbells",
        "smith_machine": "Smith Machine"
    }
    
    wait_times = {}
    
    for equip_key, equip_data in predictions.items():
        wait_times[equip_key] = {}
        metadata = equipment_metadata[equip_key]
        
        for day, hours in equip_data.items():
            wait_times[equip_key][day] = {}
            
            for hour, pred in hours.items():
                prob = pred["probability"]
                
                # Calculate expected wait time
                if prob < 0.4:
                    # Low occupancy - no wait
                    wait_min = 0
                    wait_max = 0
                    wait_label = "No wait expected"
                elif prob < 0.7:
                    # Moderate - some units occupied
                    occupied_units = int(prob * metadata["units"])
                    base_wait = metadata["avg_set_duration"] * metadata["turnover_factor"]
                    wait_min = max(0, int(base_wait * 0.5))
                    wait_max = int(base_wait * 1.5)
                    wait_label = f"{wait_min}-{wait_max} min wait"
                else:
                    # High occupancy - most/all units occupied
                    occupied_units = int(prob * metadata["units"])
                    base_wait = metadata["avg_set_duration"] * metadata["turnover_factor"] * (occupied_units / metadata["units"])
                    wait_min = int(base_wait)
                    wait_max = int(base_wait * 2)
                    wait_label = f"{wait_min}-{wait_max} min wait"
                
                wait_times[equip_key][day][hour] = {
                    "wait_min": wait_min,
                    "wait_max": wait_max,
                    "wait_label": wait_label,
                    "probability": prob,
                    "congestion_level": pred["congestion_level"],
                    "available_units": max(0, metadata["units"] - int(prob * metadata["units"])),
                    "total_units": metadata["units"]
                }
    
    # Save to file
    with open(models_dir / "predicted_wait_times.json", 'w') as f:
        json.dump(wait_times, f, indent=2)
    
    print("✅ Generated wait time predictions for all equipment")
    
    # Show examples
    print("\n📊 Example Wait Times (Monday 5pm):")
    for equip_key in ["bench_press", "squat_rack", "treadmill"]:
        data = wait_times[equip_key]["Monday"]["17"]
        print(f"  {equipment_names[equip_key]:20s}: {data['wait_label']:20s} "
              f"({data['available_units']}/{data['total_units']} units free)")
    
    return wait_times

def generate_multi_gym_predictions():
    """
    Generate predictions for multiple gym locations
    Each gym has slightly different patterns based on:
    - Location type (downtown, suburb, university)
    - Size (equipment units)
    - Member demographics
    """
    print("\n🏋️ Generating Multi-Gym Predictions")
    print("=" * 60)
    
    models_dir = Path(__file__).parent.parent / "models"
    
    # Load base predictions
    with open(models_dir / "occupancy_predictions.json") as f:
        base_predictions = json.load(f)
    
    # Define 3 gym locations with different characteristics
    gyms = {
        "gym_downtown": {
            "name": "FitZone Downtown",
            "type": "downtown",
            "address": "123 Market St",
            "peak_multiplier": 1.2,  # More crowded during lunch/after work
            "morning_multiplier": 0.7,  # Quieter mornings
            "weekend_multiplier": 0.6,  # Much quieter weekends
            "equipment_units": {
                "bench_press": 4, "squat_rack": 3, "leg_press": 3,
                "cable_machine": 6, "treadmill": 15, "rowing_machine": 8,
                "dumbbells": 12, "smith_machine": 3
            }
        },
        "gym_university": {
            "name": "Campus Recreation Center",
            "type": "university",
            "address": "456 College Ave",
            "peak_multiplier": 1.5,  # Very busy 4-8pm when classes end
            "morning_multiplier": 0.5,  # Very quiet before 10am
            "weekend_multiplier": 0.4,  # Empty on weekends
            "equipment_units": {
                "bench_press": 6, "squat_rack": 4, "leg_press": 4,
                "cable_machine": 8, "treadmill": 20, "rowing_machine": 10,
                "dumbbells": 15, "smith_machine": 4
            }
        },
        "gym_suburb": {
            "name": "Suburban Fitness Club",
            "type": "suburb",
            "address": "789 Oak Dr",
            "peak_multiplier": 0.9,  # Slightly less crowded overall
            "morning_multiplier": 1.1,  # Popular with stay-at-home parents
            "weekend_multiplier": 1.2,  # Busier on weekends (family-friendly)
            "equipment_units": {
                "bench_press": 3, "squat_rack": 2, "leg_press": 2,
                "cable_machine": 4, "treadmill": 12, "rowing_machine": 6,
                "dumbbells": 10, "smith_machine": 2
            }
        }
    }
    
    multi_gym_data = {}
    
    for gym_id, gym_info in gyms.items():
        print(f"  Generating predictions for {gym_info['name']}...")
        
        gym_predictions = {
            "gym_info": {
                "id": gym_id,
                "name": gym_info["name"],
                "type": gym_info["type"],
                "address": gym_info["address"],
                "equipment_units": gym_info["equipment_units"]
            },
            "predictions": {}
        }
        
        # Adjust base predictions for this gym's characteristics
        for equip_key, equip_data in base_predictions.items():
            gym_predictions["predictions"][equip_key] = {}
            
            for day, hours in equip_data.items():
                gym_predictions["predictions"][equip_key][day] = {}
                
                for hour, pred in hours.items():
                    hour_int = int(hour)
                    base_prob = pred["probability"]
                    
                    # Apply gym-specific multipliers
                    adjusted_prob = base_prob
                    
                    # Time-of-day adjustments
                    if hour_int < 10:
                        adjusted_prob *= gym_info["morning_multiplier"]
                    elif 17 <= hour_int <= 19:
                        adjusted_prob *= gym_info["peak_multiplier"]
                    
                    # Weekend adjustments
                    if day in ["Saturday", "Sunday"]:
                        adjusted_prob *= gym_info["weekend_multiplier"]
                    
                    # Clamp to [0, 1]
                    adjusted_prob = max(0.0, min(1.0, adjusted_prob))
                    
                    # Determine congestion level
                    if adjusted_prob < 0.4:
                        level = "low"
                    elif adjusted_prob < 0.7:
                        level = "moderate"
                    else:
                        level = "high"
                    
                    gym_predictions["predictions"][equip_key][day][hour] = {
                        "probability": round(adjusted_prob, 3),
                        "congestion_level": level
                    }
        
        multi_gym_data[gym_id] = gym_predictions
    
    # Save to file
    with open(models_dir / "multi_gym_predictions.json", 'w') as f:
        json.dump(multi_gym_data, f, indent=2)
    
    print("✅ Generated predictions for 3 gym locations")
    
    # Show comparison
    print("\n📊 Comparison: Monday 5pm Congestion")
    for gym_id, gym_data in multi_gym_data.items():
        gym_name = gym_data["gym_info"]["name"]
        avg_prob = sum(
            gym_data["predictions"][equip]["Monday"]["17"]["probability"]
            for equip in ["bench_press", "squat_rack", "leg_press"]
        ) / 3
        print(f"  {gym_name:30s}: {avg_prob*100:.0f}% full")
    
    return multi_gym_data

def generate_usage_trends():
    """
    Generate synthetic usage trend analytics
    Shows how gym usage changes over weeks/months
    """
    print("\n📈 Generating Usage Trend Analytics")
    print("=" * 60)
    
    models_dir = Path(__file__).parent.parent / "models"
    
    # Simulate 12 weeks of aggregated usage data
    weeks = []
    
    for week in range(1, 13):
        # Simulate seasonal trends
        # Week 1-4: New Year's resolution (higher usage)
        # Week 5-8: Decline
        # Week 9-12: Stabilization
        
        if week <= 4:
            base_usage = 0.65  # High usage (New Year effect)
        elif week <= 8:
            base_usage = 0.50  # Moderate decline
        else:
            base_usage = 0.45  # Stable usage
        
        # Add some random variation
        weekly_variation = random.uniform(-0.05, 0.05)
        avg_usage = max(0.3, min(0.8, base_usage + weekly_variation))
        
        weeks.append({
            "week": week,
            "avg_occupancy": round(avg_usage, 3),
            "peak_occupancy": round(min(0.95, avg_usage * 1.4), 3),
            "off_peak_occupancy": round(max(0.1, avg_usage * 0.3), 3),
            "busiest_day": "Monday" if week <= 6 else "Wednesday",
            "quietest_day": "Saturday",
            "total_visits_estimate": int(avg_usage * 1000)  # Synthetic visitor count
        })
    
    # Monthly aggregations
    months = [
        {
            "month": 1,
            "name": "January",
            "weeks": [1, 2, 3, 4],
            "avg_occupancy": round(sum(w["avg_occupancy"] for w in weeks[0:4]) / 4, 3),
            "trend": "high",
            "description": "Peak usage - New Year's resolution effect"
        },
        {
            "month": 2,
            "name": "February",
            "weeks": [5, 6, 7, 8],
            "avg_occupancy": round(sum(w["avg_occupancy"] for w in weeks[4:8]) / 4, 3),
            "trend": "declining",
            "description": "Usage declining as resolutions fade"
        },
        {
            "month": 3,
            "name": "March",
            "weeks": [9, 10, 11, 12],
            "avg_occupancy": round(sum(w["avg_occupancy"] for w in weeks[8:12]) / 4, 3),
            "trend": "stable",
            "description": "Stable core membership usage"
        }
    ]
    
    usage_trends = {
        "weekly_data": weeks,
        "monthly_data": months,
        "insights": {
            "highest_usage_week": max(weeks, key=lambda w: w["avg_occupancy"]),
            "lowest_usage_week": min(weeks, key=lambda w: w["avg_occupancy"]),
            "average_occupancy_12_weeks": round(sum(w["avg_occupancy"] for w in weeks) / len(weeks), 3),
            "trend_direction": "stable",
            "seasonal_pattern": "New Year peak, then stabilization"
        }
    }
    
    # Save to file
    with open(models_dir / "usage_trends.json", 'w') as f:
        json.dump(usage_trends, f, indent=2)
    
    print("✅ Generated 12 weeks of usage trend data")
    
    # Show summary
    print("\n📊 Usage Trend Summary:")
    print(f"  Highest usage: Week {usage_trends['insights']['highest_usage_week']['week']} "
          f"({usage_trends['insights']['highest_usage_week']['avg_occupancy']*100:.0f}%)")
    print(f"  Lowest usage:  Week {usage_trends['insights']['lowest_usage_week']['week']} "
          f"({usage_trends['insights']['lowest_usage_week']['avg_occupancy']*100:.0f}%)")
    print(f"  12-week average: {usage_trends['insights']['average_occupancy_12_weeks']*100:.0f}%")
    
    return usage_trends

def main():
    print("🎯 Generating P2 ML Features")
    print("=" * 60)
    print("1. Predicted wait times")
    print("2. Multi-gym predictions (3 locations)")
    print("3. Usage trend analytics (12 weeks)")
    print("=" * 60)
    
    wait_times = generate_wait_times()
    multi_gym = generate_multi_gym_predictions()
    trends = generate_usage_trends()
    
    print("\n" + "=" * 60)
    print("✅ ALL P2 FEATURES GENERATED")
    print("=" * 60)
    print("\n📁 Generated files:")
    print("  1. predicted_wait_times.json (~100 KB)")
    print("  2. multi_gym_predictions.json (~250 KB)")
    print("  3. usage_trends.json (~2 KB)")
    print("\n💾 Total: ~352 KB of P2 ML data")
    print("=" * 60)

if __name__ == "__main__":
    main()
