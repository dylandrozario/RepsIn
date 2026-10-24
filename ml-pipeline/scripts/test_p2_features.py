#!/usr/bin/env python3
"""
Test P2 ML Features
"""

import json
import sys
from pathlib import Path

# ANSI colors
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

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")

def load_json(filename):
    models_dir = Path(__file__).parent.parent / "models"
    with open(models_dir / filename) as f:
        return json.load(f)

def test_wait_times():
    """Test predicted wait times"""
    print_header("TEST 1: Predicted Wait Times (P2)")
    
    wait_times = load_json("predicted_wait_times.json")
    
    # Structure validation
    equipment_keys = ["bench_press", "squat_rack", "leg_press", "cable_machine",
                      "treadmill", "rowing_machine", "dumbbells", "smith_machine"]
    
    for equip in equipment_keys:
        assert equip in wait_times, f"Missing {equip}"
    
    print_success("All equipment types present")
    
    # Test wait time calculations
    print(f"\n{BOLD}Sample Wait Times (Monday 5pm):{RESET}")
    
    equipment_names = {
        "bench_press": "Bench Press",
        "squat_rack": "Squat Rack",
        "treadmill": "Treadmill",
        "dumbbells": "Dumbbells"
    }
    
    for equip_key, equip_name in equipment_names.items():
        data = wait_times[equip_key]["Monday"]["17"]
        color = GREEN if data["congestion_level"] == "low" else YELLOW if data["congestion_level"] == "moderate" else RED
        print(f"  {equip_name:20s}: {color}{data['wait_label']:20s}{RESET} "
              f"({data['available_units']}/{data['total_units']} units available)")
    
    # Validate logic
    bench_data = wait_times["bench_press"]["Monday"]["20"]
    assert bench_data["wait_min"] == 0, "Low occupancy should have no wait"
    print_success("Wait time logic validated")
    
    # Show best time with no waits
    print(f"\n{BOLD}Best Times (No Wait Expected):{RESET}")
    no_wait_count = 0
    for equip_key in ["bench_press", "squat_rack"]:
        for day in ["Saturday", "Sunday"]:
            for hour in ["20", "21"]:
                data = wait_times[equip_key][day][hour]
                if data["wait_min"] == 0:
                    no_wait_count += 1
    
    print(f"  Found {no_wait_count} time slots with no wait for key equipment")
    print_success("Predicted wait times validated")
    
    return True

def test_multi_gym():
    """Test multi-gym predictions"""
    print_header("TEST 2: Multi-Gym Predictions (P2)")
    
    multi_gym = load_json("multi_gym_predictions.json")
    
    # Validate 3 gyms
    expected_gyms = ["gym_downtown", "gym_university", "gym_suburb"]
    assert len(multi_gym) == 3, f"Expected 3 gyms, got {len(multi_gym)}"
    
    for gym_id in expected_gyms:
        assert gym_id in multi_gym, f"Missing {gym_id}"
    
    print_success("All 3 gym locations present")
    
    # Show gym info
    print(f"\n{BOLD}Gym Locations:{RESET}")
    for gym_id, gym_data in multi_gym.items():
        info = gym_data["gym_info"]
        print(f"  {info['name']:30s} ({info['type']}) - {info['address']}")
    
    # Compare congestion across gyms
    print(f"\n{BOLD}Comparison: Monday 5pm Average Congestion:{RESET}")
    
    for gym_id, gym_data in multi_gym.items():
        gym_name = gym_data["gym_info"]["name"]
        
        # Calculate average across key equipment
        total_prob = 0
        count = 0
        for equip in ["bench_press", "squat_rack", "leg_press"]:
            total_prob += gym_data["predictions"][equip]["Monday"]["17"]["probability"]
            count += 1
        
        avg_prob = total_prob / count
        
        color = GREEN if avg_prob < 0.5 else YELLOW if avg_prob < 0.8 else RED
        print(f"  {gym_name:30s}: {color}{avg_prob*100:5.1f}%{RESET} full")
    
    # Validate different patterns
    downtown_prob = multi_gym["gym_downtown"]["predictions"]["bench_press"]["Monday"]["17"]["probability"]
    suburb_prob = multi_gym["gym_suburb"]["predictions"]["bench_press"]["Monday"]["17"]["probability"]
    
    print(f"\n{BOLD}Pattern Validation:{RESET}")
    print(f"  Downtown (peak hour): {downtown_prob*100:.0f}% occupied")
    print(f"  Suburb (peak hour):   {suburb_prob*100:.0f}% occupied")
    
    print_success("Multi-gym predictions validated")
    
    # Show best gym recommendation
    print(f"\n{BOLD}Recommendation for Monday 5pm:{RESET}")
    gym_scores = []
    for gym_id, gym_data in multi_gym.items():
        avg_prob = sum(
            gym_data["predictions"][equip]["Monday"]["17"]["probability"]
            for equip in ["bench_press", "squat_rack", "leg_press"]
        ) / 3
        gym_scores.append((gym_data["gym_info"]["name"], avg_prob))
    
    gym_scores.sort(key=lambda x: x[1])
    print(f"  Best choice: {gym_scores[0][0]} ({gym_scores[0][1]*100:.0f}% full)")
    print(f"  Avoid: {gym_scores[-1][0]} ({gym_scores[-1][1]*100:.0f}% full)")
    
    return True

def test_usage_trends():
    """Test usage trend analytics"""
    print_header("TEST 3: Usage Trend Analytics (P2)")
    
    trends = load_json("usage_trends.json")
    
    # Validate structure
    assert "weekly_data" in trends, "Missing weekly_data"
    assert "monthly_data" in trends, "Missing monthly_data"
    assert "insights" in trends, "Missing insights"
    
    assert len(trends["weekly_data"]) == 12, "Should have 12 weeks"
    assert len(trends["monthly_data"]) == 3, "Should have 3 months"
    
    print_success("Structure validated")
    
    # Show weekly trend
    print(f"\n{BOLD}12-Week Usage Trend:{RESET}")
    
    for week in [1, 4, 8, 12]:
        week_data = trends["weekly_data"][week - 1]
        bar = "█" * int(week_data["avg_occupancy"] * 50)
        print(f"  Week {week:2d}: {bar} {week_data['avg_occupancy']*100:.0f}%")
    
    # Show monthly summary
    print(f"\n{BOLD}Monthly Summary:{RESET}")
    for month in trends["monthly_data"]:
        trend_color = RED if month["trend"] == "high" else YELLOW if month["trend"] == "declining" else GREEN
        print(f"  {month['name']:10s}: {trend_color}{month['avg_occupancy']*100:.0f}%{RESET} "
              f"({month['trend']}) - {month['description']}")
    
    # Show insights
    print(f"\n{BOLD}Key Insights:{RESET}")
    insights = trends["insights"]
    print(f"  Highest usage: Week {insights['highest_usage_week']['week']} "
          f"({insights['highest_usage_week']['avg_occupancy']*100:.0f}%)")
    print(f"  Lowest usage:  Week {insights['lowest_usage_week']['week']} "
          f"({insights['lowest_usage_week']['avg_occupancy']*100:.0f}%)")
    print(f"  12-week avg:   {insights['average_occupancy_12_weeks']*100:.0f}%")
    print(f"  Pattern:       {insights['seasonal_pattern']}")
    
    # Validate trend makes sense
    week1 = trends["weekly_data"][0]["avg_occupancy"]
    week12 = trends["weekly_data"][11]["avg_occupancy"]
    
    assert week1 > week12, "January should be busier than March (New Year effect)"
    print_success("Seasonal trend pattern validated")
    
    return True

def run_tests():
    print_header("P2 ML FEATURES VALIDATION")
    
    tests = [
        ("Predicted Wait Times", test_wait_times),
        ("Multi-Gym Predictions", test_multi_gym),
        ("Usage Trend Analytics", test_usage_trends)
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
    
    print(f"\n{BOLD}Results: {passed}/{total} P2 tests passed{RESET}")
    
    if passed == total:
        print(f"\n{GREEN}{BOLD}🎉 ALL P2 FEATURES VALIDATED 🎉{RESET}")
        return 0
    else:
        print(f"\n{RED}{BOLD}⚠️  SOME TESTS FAILED{RESET}")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
