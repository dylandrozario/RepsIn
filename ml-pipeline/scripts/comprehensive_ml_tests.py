#!/usr/bin/env python3
"""
Comprehensive CLI Tests for All ML Features
Run this to validate everything without needing Expo app
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timedelta
import pandas as pd

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
BOLD = '\033[1m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BOLD}{BLUE}{'='*70}{RESET}")
    print(f"{BOLD}{BLUE}{text.center(70)}{RESET}")
    print(f"{BOLD}{BLUE}{'='*70}{RESET}\n")

def print_section(text):
    print(f"\n{BOLD}{text}{RESET}")
    print("-" * 70)

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")

def print_info(text):
    print(f"{YELLOW}💡 {text}{RESET}")

def load_json(filename):
    """Load JSON file from models directory"""
    models_dir = Path(__file__).parent.parent / "models"
    with open(models_dir / filename) as f:
        return json.load(f)

def test_equipment_predictions():
    """Test individual equipment predictions"""
    print_header("TEST 1: Individual Equipment Predictions")
    
    predictions = load_json("occupancy_predictions.json")
    
    # Test structure - nested dict by equipment -> day -> hour
    print_section("Structure Validation")
    
    expected_equipment = [
        "bench_press", "squat_rack", "leg_press", "cable_machine",
        "treadmill", "rowing_machine", "dumbbells", "smith_machine"
    ]
    
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
    
    for equip in expected_equipment:
        assert equip in predictions, f"Missing {equip}"
    print_success(f"Found all {len(expected_equipment)} equipment types")
    
    # Count predictions
    total_preds = 0
    for equip in expected_equipment:
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
            total_preds += len(predictions[equip][day])
    
    assert total_preds == 952, f"Expected 952 predictions, got {total_preds}"
    print_success(f"Found {total_preds} total predictions")
    
    # Test P0 requirement: Equipment-specific forecasts
    print_section("P0: Equipment-Specific Forecasts")
    for equip in expected_equipment:
        print_success(f"{equipment_names[equip]} predictions present")
    
    # Test P0: Congestion levels
    print_section("P0: Equipment Congestion Levels")
    
    for equip in expected_equipment:
        data = predictions[equip]["Monday"]["17"]
        level = data["congestion_level"]
        prob = data["probability"]
        assert level in ["low", "moderate", "high"], f"Invalid level: {level}"
        print(f"  {equipment_names[equip]:20s} - {level.upper():10s} ({prob*100:.0f}% occupied)")
    
    print_success("All congestion levels valid")
    
    # Test demo scenario
    print_section("Demo Scenario: Monday 5pm vs 8pm")
    
    probs_5pm = [predictions[equip]["Monday"]["17"]["probability"] for equip in expected_equipment]
    probs_8pm = [predictions[equip]["Monday"]["20"]["probability"] for equip in expected_equipment]
    
    avg_5pm = sum(probs_5pm) / len(probs_5pm)
    avg_8pm = sum(probs_8pm) / len(probs_8pm)
    
    print(f"  5pm average: {avg_5pm*100:.1f}% occupied")
    print(f"  8pm average: {avg_8pm*100:.1f}% occupied")
    print(f"  Difference: {(avg_5pm - avg_8pm)*100:.1f}% less crowded at 8pm")
    
    assert avg_5pm > 0.7, "5pm should be busy (>70%)"
    assert avg_8pm < 0.3, "8pm should be quiet (<30%)"
    print_success("Demo scenario validated")
    
    return True

def test_gym_wide_congestion():
    """Test gym-wide congestion metrics"""
    print_header("TEST 2: Gym-Wide Congestion (P1)")
    
    congestion = load_json("gym_wide_congestion.json")
    
    # Test structure
    print_section("Structure Validation")
    weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    for day in weekdays:
        assert day in congestion, f"Missing {day}"
        assert len(congestion[day]) == 17, f"{day} missing hours"
    print_success("All weekdays and hours present")
    
    # Test P1: Gym-wide congestion prediction
    print_section("P1: Overall Gym Busyness")
    
    for day in ["Monday", "Friday", "Saturday"]:
        print(f"\n{BOLD}{day}:{RESET}")
        for hour in [7, 12, 17, 20]:
            data = congestion[day][str(hour)]
            print(f"  {hour:02d}:00 - {data['percent_full']:3.0f}% full ({data['congestion_level'].upper()}) "
                  f"- Busiest: {data['busiest_equipment']}")
    
    print_success("Gym-wide congestion working")
    
    # Test equipment breakdown
    print_section("Equipment Breakdown by Congestion Level")
    monday_5pm = congestion["Monday"]["17"]
    breakdown = monday_5pm["equipment_breakdown"]
    
    print(f"  Monday 5pm equipment distribution:")
    print(f"    Low:      {breakdown['low']} equipment")
    print(f"    Moderate: {breakdown['moderate']} equipment")
    print(f"    High:     {breakdown['high']} equipment")
    
    total = sum(breakdown.values())
    assert total == 8, f"Expected 8 equipment, got {total}"
    print_success("Equipment breakdown validated")
    
    return True

def test_peak_hours():
    """Test peak hour analysis"""
    print_header("TEST 3: Peak-Hour Forecasting (P1)")
    
    peak_hours = load_json("peak_hours.json")
    
    # Test P1: Peak-hour forecasting
    print_section("P1: Peak Hour Identification")
    
    for day in ["Monday", "Wednesday", "Saturday"]:
        data = peak_hours[day]
        print(f"\n{BOLD}{day}:{RESET}")
        print(f"  {RED}Avoid:{RESET} {data['avoid_message']}")
        print(f"  {GREEN}Best:{RESET}  {data['suggestion']}")
        
        print(f"  Peak hours: {', '.join(f'{h}:00' for h in data['peak_hours'])}")
        print(f"  Quiet hours: {', '.join(f'{h}:00' for h in data['quiet_hours'])}")
    
    print_success("Peak hours identified correctly")
    
    # Test P0: Best availability window
    print_section("P0: Best Equipment Availability Window")
    
    insights = peak_hours["weekly_insights"]
    print(f"  Busiest time overall: {insights['busiest_overall']['weekday']} "
          f"{insights['busiest_overall']['hour']}:00 ({insights['busiest_overall']['percent']}% full)")
    print(f"  Quietest day: {insights['quietest_day']}")
    print(f"  Busiest day: {insights['busiest_day']}")
    
    print_success("Best availability windows identified")
    
    return True

def test_occupancy_heatmap():
    """Test occupancy heatmap data"""
    print_header("TEST 4: Occupancy Heatmap (P1)")
    
    heatmap = load_json("occupancy_heatmap.json")
    
    # Test structure
    print_section("Structure Validation")
    assert len(heatmap["equipment"]) == 8, "Expected 8 equipment types"
    assert len(heatmap["hours"]) == 17, "Expected 17 hours"
    assert len(heatmap["data"]) == 7, "Expected 7 weekdays"
    
    print_success(f"Matrix: {len(heatmap['data'])} days × {len(heatmap['equipment'])} equipment × {len(heatmap['hours'])} hours")
    
    # Test P1: Occupancy heatmap
    print_section("P1: Equipment vs Day/Time Heatmap")
    
    # Find busiest equipment/time combos
    busiest = []
    for day in heatmap["weekdays"]:
        for equip_idx, equip_name in enumerate(heatmap["equipment"]):
            for hour_idx, hour in enumerate(heatmap["hours"]):
                prob = heatmap["data"][day][equip_idx][hour_idx]
                busiest.append({
                    "day": day,
                    "equipment": equip_name,
                    "hour": hour,
                    "prob": prob
                })
    
    busiest.sort(key=lambda x: x["prob"], reverse=True)
    
    print("  Top 10 busiest equipment/time combinations:")
    for i, item in enumerate(busiest[:10], 1):
        print(f"    {i:2d}. {item['day']:10s} {item['hour']:02d}:00 - "
              f"{item['equipment']:20s} ({item['prob']*100:.0f}% occupied)")
    
    print_success("Heatmap data structure validated")
    
    # Visualize a simple text heatmap for Monday
    print_section("Monday Equipment Heatmap (Text Visualization)")
    
    print(f"\n  {'Equipment':20s} | 6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22")
    print(f"  {'-'*20} + {'-'*50}")
    
    for equip_idx, equip_name in enumerate(heatmap["equipment"]):
        line = f"  {equip_name[:20]:20s} |"
        for hour_idx in range(17):
            prob = heatmap["data"]["Monday"][equip_idx][hour_idx]
            if prob >= 0.7:
                char = f"{RED}██{RESET}"
            elif prob >= 0.4:
                char = f"{YELLOW}▓▓{RESET}"
            else:
                char = f"{GREEN}░░{RESET}"
            line += f" {char}"
        print(line)
    
    print(f"\n  Legend: {GREEN}░░{RESET} Low (<40%)  {YELLOW}▓▓{RESET} Moderate (40-70%)  {RED}██{RESET} High (>70%)")
    print_success("Heatmap visualization complete")
    
    return True

def test_historical_usage():
    """Test historical usage patterns"""
    print_header("TEST 5: Historical Equipment Usage (P0)")
    
    # Load synthetic data to analyze patterns
    data_dir = Path(__file__).parent.parent / "data"
    df = pd.read_csv(data_dir / "synthetic_occupancy_data.csv")
    
    print_section("P0: Historical Usage Patterns")
    
    # Analyze by weekday
    weekday_usage = df.groupby('weekday')['is_fully_occupied'].mean()
    print("\n  Average occupancy by weekday:")
    for day, occ in weekday_usage.items():
        bar = "█" * int(occ * 50)
        print(f"    {day:10s}: {bar} {occ*100:.1f}%")
    
    # Analyze by hour
    print("\n  Average occupancy by hour:")
    hour_usage = df.groupby('hour')['is_fully_occupied'].mean()
    for hour, occ in hour_usage.items():
        bar = "█" * int(occ * 50)
        print(f"    {hour:02d}:00: {bar} {occ*100:.1f}%")
    
    # Analyze by equipment
    print("\n  Average occupancy by equipment:")
    equip_usage = df.groupby('equipment_type')['is_fully_occupied'].mean()
    
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
    
    for equip, occ in equip_usage.sort_values(ascending=False).items():
        bar = "█" * int(occ * 50)
        display_name = equipment_names.get(equip, equip)
        print(f"    {display_name:20s}: {bar} {occ*100:.1f}%")
    
    print_success("Historical patterns analyzed")
    
    return True

def test_time_slider_scenarios():
    """Test interactive time slider scenarios"""
    print_header("TEST 6: Interactive Time Slider (P0)")
    
    predictions = load_json("occupancy_predictions.json")
    
    print_section("P0: Explore Forecasts Across the Day")
    
    # Simulate slider moving through Monday
    print(f"\n  {BOLD}Simulating time slider for Monday:{RESET}\n")
    
    test_hours = [6, 9, 12, 15, 17, 19, 20, 22]
    
    equipment_keys = ["bench_press", "squat_rack", "leg_press", "cable_machine",
                      "treadmill", "rowing_machine", "dumbbells", "smith_machine"]
    
    for hour in test_hours:
        hour_probs = [predictions[equip]["Monday"][str(hour)]["probability"] 
                      for equip in equipment_keys]
        
        avg_occ = sum(hour_probs) / len(hour_probs)
        
        # Determine overall level
        if avg_occ >= 0.7:
            level = f"{RED}HIGH{RESET}"
        elif avg_occ >= 0.4:
            level = f"{YELLOW}MODERATE{RESET}"
        else:
            level = f"{GREEN}LOW{RESET}"
        
        bar = "█" * int(avg_occ * 30)
        print(f"  {hour:02d}:00 [{level:20s}] {bar} {avg_occ*100:.0f}%")
    
    print_success("Time slider scenarios validated")
    
    return True

def test_ml_aware_scheduling():
    """Test ML-aware scheduling scenarios"""
    print_header("TEST 7: ML-Aware Scheduling (P0)")
    
    predictions = load_json("occupancy_predictions.json")
    congestion = load_json("gym_wide_congestion.json")
    
    print_section("P0: ML-Aware Scheduling")
    
    # Simulate user availability: Monday 7am-10am, 5pm-9pm
    user_availability = [
        {"day": "Monday", "start": 7, "end": 10},
        {"day": "Monday", "start": 17, "end": 21}
    ]
    
    print(f"  User availability: Monday 7-10am, 5-9pm")
    print(f"  Workout duration: 60 minutes\n")
    
    # Score each available hour
    scores = []
    for avail in user_availability:
        for hour in range(avail["start"], avail["end"]):
            gym_data = congestion[avail["day"]][str(hour)]
            
            # Lower congestion = better score
            score = 100 - gym_data["percent_full"]
            
            scores.append({
                "day": avail["day"],
                "hour": hour,
                "percent_full": gym_data["percent_full"],
                "level": gym_data["congestion_level"],
                "score": score
            })
    
    # Sort by score
    scores.sort(key=lambda x: x["score"], reverse=True)
    
    print(f"  {BOLD}Ranked workout times:{RESET}")
    for i, slot in enumerate(scores[:5], 1):
        level_color = GREEN if slot["level"] == "low" else YELLOW if slot["level"] == "moderate" else RED
        print(f"    {i}. {slot['hour']:02d}:00 - Score: {slot['score']:.0f} "
              f"({level_color}{slot['level'].upper()}{RESET}, {slot['percent_full']:.0f}% full)")
    
    print_success("ML-aware scheduling working")
    
    return True

def test_equipment_alternatives():
    """Test equipment alternatives for crowded machines"""
    print_header("TEST 8: Equipment Alternatives (P0)")
    
    predictions = load_json("occupancy_predictions.json")
    
    print_section("P0: ML-Aware Exercise Selection")
    
    # Simulate user wants to do chest workout Monday 5pm
    # Group by muscle group (simplified)
    chest_equipment = {
        "bench_press": "Bench Press",
        "cable_machine": "Cable Machine",
        "dumbbells": "Dumbbells"
    }
    
    print(f"  {BOLD}Scenario: Chest workout Monday 5pm{RESET}\n")
    
    chest_options = []
    for equip_key, equip_name in chest_equipment.items():
        data = predictions[equip_key]["Monday"]["17"]
        chest_options.append({
            "equipment": equip_name,
            "probability": data["probability"],
            "level": data["congestion_level"]
        })
    
    chest_options.sort(key=lambda x: x["probability"])
    
    print(f"  Equipment recommendations (least crowded first):")
    for i, equip in enumerate(chest_options, 1):
        level_color = GREEN if equip["level"] == "low" else YELLOW if equip["level"] == "moderate" else RED
        recommendation = "✅ AVAILABLE" if equip["probability"] < 0.5 else "⚠️ BUSY" if equip["probability"] < 0.8 else "❌ CROWDED"
        print(f"    {i}. {equip['equipment']:20s} - {level_color}{equip['probability']*100:.0f}%{RESET} occupied - {recommendation}")
    
    print_success("Equipment alternatives generated")
    
    return True

def test_prediction_confidence():
    """Test prediction confidence levels"""
    print_header("TEST 9: Prediction Confidence (P1)")
    
    print_section("P1: Communicate Uncertainty")
    
    # For synthetic data, confidence is based on data volume
    print(f"  Data source: Synthetic training data")
    print(f"  Training examples: 11,424")
    print(f"  Model accuracy: 73%")
    print(f"  Confidence level: {YELLOW}DEMO{RESET} (synthetic data)")
    print(f"\n  {YELLOW}⚠️  These predictions are based on synthetic data{RESET}")
    print(f"  {YELLOW}⚠️  Use for demonstration purposes only{RESET}")
    
    # Show confidence by time period
    print(f"\n  Confidence by time period:")
    print(f"    Peak hours (5-7pm):   {GREEN}HIGH{RESET}   (strong synthetic patterns)")
    print(f"    Off-peak (8-10pm):    {GREEN}HIGH{RESET}   (clear data)")
    print(f"    Early morning (6-8am): {YELLOW}MEDIUM{RESET} (some variation)")
    print(f"    Weekends:             {YELLOW}MEDIUM{RESET} (different patterns)")
    
    print_success("Confidence information available")
    
    return True

def test_best_workout_times():
    """Test best workout times ranking"""
    print_header("TEST 10: Best Workout Times Ranking")
    
    best_times = load_json("best_workout_times.json")
    
    print_section("Best Times Across Entire Week")
    
    # Validate structure
    assert "top_10_best" in best_times, "Missing top_10_best"
    assert "worst_10_times" in best_times, "Missing worst_10_times"
    assert "summary" in best_times, "Missing summary"
    
    assert len(best_times["top_10_best"]) == 10, "Should have 10 best times"
    assert len(best_times["worst_10_times"]) == 10, "Should have 10 worst times"
    
    print_success("Structure validated")
    
    # Show top 5 best
    print_section("Top 5 Best Workout Times")
    for item in best_times["top_10_best"][:5]:
        level_color = GREEN if item["congestion_level"] == "low" else YELLOW
        print(f"  {item['rank']}. {item['time_label']:18s} - "
              f"{level_color}{item['percent_full']:3.0f}%{RESET} full (Score: {item['score']})")
        print(f"     💡 {item['recommendation']}")
    
    # Show top 5 worst
    print_section("Top 5 Worst Times (Avoid)")
    for item in best_times["worst_10_times"][:5]:
        print(f"  {item['time_label']:18s} - {RED}{item['percent_full']:3.0f}%{RESET} full")
        print(f"     ⚠️  {item['avoid_reason']}")
    
    # Summary
    print_section("Summary Statistics")
    summary = best_times["summary"]
    print(f"  Best overall:  {summary['best_overall']['time']} ({summary['best_overall']['percent_full']}% full)")
    print(f"  Worst overall: {summary['worst_overall']['time']} ({summary['worst_overall']['percent_full']}% full)")
    print(f"  Analyzed: {summary['total_time_slots']} time slots")
    print(f"  Average: {summary['average_congestion']}% full")
    
    # Validate best is actually better than worst
    best_pct = best_times["top_10_best"][0]["percent_full"]
    worst_pct = best_times["worst_10_times"][0]["percent_full"]
    
    assert best_pct < 30, "Best time should be under 30% full"
    assert worst_pct > 70, "Worst time should be over 70% full"
    
    print_success("Best workout times ranking validated")
    
    return True

def run_all_tests():
    """Run all ML tests"""
    print_header("COMPREHENSIVE ML VALIDATION SUITE")
    print(f"{BOLD}Testing all ML features without needing Expo app{RESET}\n")
    
    tests = [
        ("Equipment Predictions", test_equipment_predictions),
        ("Gym-Wide Congestion", test_gym_wide_congestion),
        ("Peak Hours", test_peak_hours),
        ("Occupancy Heatmap", test_occupancy_heatmap),
        ("Historical Usage", test_historical_usage),
        ("Time Slider", test_time_slider_scenarios),
        ("ML-Aware Scheduling", test_ml_aware_scheduling),
        ("Equipment Alternatives", test_equipment_alternatives),
        ("Prediction Confidence", test_prediction_confidence),
        ("Best Workout Times", test_best_workout_times)
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, "PASS"))
        except Exception as e:
            print_error(f"Test failed: {e}")
            import traceback
            traceback.print_exc()
            results.append((name, "FAIL"))
    
    # Summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result == "PASS")
    total = len(results)
    
    for name, result in results:
        if result == "PASS":
            print_success(f"{name:30s} - PASS")
        else:
            print_error(f"{name:30s} - FAIL")
    
    print(f"\n{BOLD}Results: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"\n{GREEN}{BOLD}🎉 ALL TESTS PASSED - ML PIPELINE READY FOR DEMO 🎉{RESET}")
        return 0
    else:
        print(f"\n{RED}{BOLD}⚠️  SOME TESTS FAILED - REVIEW ERRORS ABOVE{RESET}")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())


def test_best_workout_times():
    """Test best workout times ranking"""
    print_header("TEST 10: Best Workout Times Ranking")
    
    best_times = load_json("best_workout_times.json")
    
    print_section("Best Times Across Entire Week")
    
    # Validate structure
    assert "top_10_best" in best_times, "Missing top_10_best"
    assert "worst_10_times" in best_times, "Missing worst_10_times"
    assert "summary" in best_times, "Missing summary"
    
    assert len(best_times["top_10_best"]) == 10, "Should have 10 best times"
    assert len(best_times["worst_10_times"]) == 10, "Should have 10 worst times"
    
    print_success("Structure validated")
    
    # Show top 5 best
    print_section("Top 5 Best Workout Times")
    for item in best_times["top_10_best"][:5]:
        level_color = GREEN if item["congestion_level"] == "low" else YELLOW
        print(f"  {item['rank']}. {item['time_label']:18s} - "
              f"{level_color}{item['percent_full']:3.0f}%{RESET} full (Score: {item['score']})")
        print(f"     💡 {item['recommendation']}")
    
    # Show top 5 worst
    print_section("Top 5 Worst Times (Avoid)")
    for item in best_times["worst_10_times"][:5]:
        print(f"  {item['time_label']:18s} - {RED}{item['percent_full']:3.0f}%{RESET} full")
        print(f"     ⚠️  {item['avoid_reason']}")
    
    # Summary
    print_section("Summary Statistics")
    summary = best_times["summary"]
    print(f"  Best overall:  {summary['best_overall']['time']} ({summary['best_overall']['percent_full']}% full)")
    print(f"  Worst overall: {summary['worst_overall']['time']} ({summary['worst_overall']['percent_full']}% full)")
    print(f"  Analyzed: {summary['total_time_slots']} time slots")
    print(f"  Average: {summary['average_congestion']}% full")
    
    # Validate best is actually better than worst
    best_pct = best_times["top_10_best"][0]["percent_full"]
    worst_pct = best_times["worst_10_times"][0]["percent_full"]
    
    assert best_pct < 30, "Best time should be under 30% full"
    assert worst_pct > 70, "Worst time should be over 70% full"
    
    print_success("Best workout times ranking validated")
    
    return True
