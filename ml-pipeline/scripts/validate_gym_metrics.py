#!/usr/bin/env python3
"""
Quick validation of Phase A gym-wide metrics
"""

import json
import sys
from pathlib import Path

def validate_gym_metrics():
    """Validate all three gym metric files"""
    
    print("🔍 Validating Phase A Gym Metrics")
    print("=" * 60)
    
    models_dir = Path(__file__).parent.parent / "models"
    
    # 1. Validate gym_wide_congestion.json
    print("\n1️⃣  Validating gym_wide_congestion.json...")
    with open(models_dir / "gym_wide_congestion.json") as f:
        congestion = json.load(f)
    
    weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    hours = list(range(6, 23))
    
    assert set(congestion.keys()) == set(weekdays), "Missing weekdays!"
    
    for day in weekdays:
        assert len(congestion[day]) == 17, f"{day} missing hours!"
        for hour in hours:
            hour_str = str(hour)
            data = congestion[day][hour_str]
            assert "percent_full" in data, f"Missing percent_full for {day} {hour}"
            assert "congestion_level" in data, f"Missing congestion_level"
            assert "busiest_equipment" in data, f"Missing busiest_equipment"
            assert "quietest_equipment" in data, f"Missing quietest_equipment"
            assert data["congestion_level"] in ["low", "moderate", "high"], f"Invalid level"
    
    print("   ✅ Structure valid")
    print(f"   ✅ 7 weekdays × 17 hours = {7*17} entries")
    print(f"   ✅ Monday 5pm: {congestion['Monday']['17']['percent_full']}% full ({congestion['Monday']['17']['congestion_level'].upper()})")
    print(f"   ✅ Monday 8pm: {congestion['Monday']['20']['percent_full']}% full ({congestion['Monday']['20']['congestion_level'].upper()})")
    
    # 2. Validate peak_hours.json
    print("\n2️⃣  Validating peak_hours.json...")
    with open(models_dir / "peak_hours.json") as f:
        peak_hours = json.load(f)
    
    assert set(peak_hours.keys()) == set(weekdays + ["weekly_insights"]), "Missing keys!"
    
    for day in weekdays:
        data = peak_hours[day]
        assert "peak_hours" in data, f"Missing peak_hours for {day}"
        assert "quiet_hours" in data, f"Missing quiet_hours"
        assert "best_time" in data, f"Missing best_time"
        assert "worst_time" in data, f"Missing worst_time"
        assert "avoid_message" in data, f"Missing avoid_message"
        assert "suggestion" in data, f"Missing suggestion"
        assert len(data["peak_hours"]) == 3, f"Should have 3 peak hours"
        assert len(data["quiet_hours"]) == 3, f"Should have 3 quiet hours"
    
    insights = peak_hours["weekly_insights"]
    print("   ✅ Structure valid")
    print(f"   ✅ All 7 days with peak/quiet hours")
    print(f"   ✅ Busiest overall: {insights['busiest_overall']['weekday']} {insights['busiest_overall']['hour']}:00 ({insights['busiest_overall']['percent']}%)")
    print(f"   ✅ Quietest day: {insights['quietest_day']}")
    print(f"   ✅ Monday suggestion: {peak_hours['Monday']['suggestion']}")
    
    # 3. Validate occupancy_heatmap.json
    print("\n3️⃣  Validating occupancy_heatmap.json...")
    with open(models_dir / "occupancy_heatmap.json") as f:
        heatmap = json.load(f)
    
    assert "equipment" in heatmap, "Missing equipment list"
    assert "equipment_ids" in heatmap, "Missing equipment_ids"
    assert "hours" in heatmap, "Missing hours"
    assert "data" in heatmap, "Missing data matrix"
    
    assert len(heatmap["equipment"]) == 8, "Should have 8 equipment types"
    assert len(heatmap["hours"]) == 17, "Should have 17 hours"
    
    # Data is organized by weekday, each containing 8 equipment arrays of 17 hours
    weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    assert set(heatmap["data"].keys()) == set(weekdays), "Missing weekdays in data"
    
    for day in weekdays:
        day_data = heatmap["data"][day]
        assert len(day_data) == 8, f"{day} should have 8 equipment entries"
        for equip_idx, equip_data in enumerate(day_data):
            assert len(equip_data) == 17, f"{day} equipment {equip_idx} should have 17 hourly values"
            for hour_val in equip_data:
                assert isinstance(hour_val, (int, float)), f"Invalid value type: {type(hour_val)}"
                assert 0 <= hour_val <= 1, f"Invalid probability: {hour_val}"
    
    print("   ✅ Structure valid")
    print(f"   ✅ Matrix: {len(heatmap['data'])} days × {len(heatmap['equipment'])} equipment × {len(heatmap['hours'])} hours")
    print(f"   ✅ Total predictions: {7 * 8 * 17} = {7*8*17}")
    
    # Demo validation
    print("\n4️⃣  Demo Scenario Validation...")
    monday_5pm = congestion["Monday"]["17"]["percent_full"]
    monday_8pm = congestion["Monday"]["20"]["percent_full"]
    difference = monday_5pm - monday_8pm
    
    print(f"   📊 Monday 5pm: {monday_5pm}% full")
    print(f"   📊 Monday 8pm: {monday_8pm}% full")
    print(f"   💡 Difference: {difference}% less crowded at 8pm")
    
    assert monday_5pm > 80, "❌ Monday 5pm should be HIGH congestion (>80%)"
    assert monday_8pm < 30, "❌ Monday 8pm should be LOW congestion (<30%)"
    assert difference > 60, "❌ Difference should be dramatic (>60%)"
    
    print("   ✅ Demo scenario validated!")
    
    print("\n" + "=" * 60)
    print("✅ ALL METRICS VALIDATED - Ready for UI Integration!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    try:
        validate_gym_metrics()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Validation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
