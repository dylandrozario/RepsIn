"""
Test edge cases and boundaries.
Phase 3, Task 3.4
"""

import json

def load_predictions(path='../models/occupancy_predictions.json'):
    """Load prediction file."""
    with open(path, 'r') as f:
        return json.load(f)

def test_edge_cases():
    """Test boundary conditions."""
    
    print("🧪 Phase 3: Edge Case Testing\n")
    print("=" * 60)
    
    predictions = load_predictions()
    all_passed = True
    
    # Test 1: All Equipment Types
    print("\n✓ Test 1: All Equipment Types Present")
    print("-" * 60)
    
    expected_equipment = [
        'bench_press', 'squat_rack', 'leg_press', 'cable_machine',
        'treadmill', 'rowing_machine', 'dumbbells', 'smith_machine'
    ]
    
    for equipment in expected_equipment:
        if equipment in predictions:
            print(f"   ✅ {equipment}")
        else:
            print(f"   ❌ MISSING: {equipment}")
            all_passed = False
    
    # Test 2: All Weekdays
    print("\n✓ Test 2: All Weekdays Present")
    print("-" * 60)
    
    weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    for weekday in weekdays:
        if weekday in predictions['bench_press']:
            print(f"   ✅ {weekday}")
        else:
            print(f"   ❌ MISSING: {weekday}")
            all_passed = False
    
    # Test 3: All Hours (6am-10pm)
    print("\n✓ Test 3: All Operating Hours Present")
    print("-" * 60)
    
    for hour in range(6, 23):
        if str(hour) in predictions['bench_press']['Monday']:
            status = "✅"
        else:
            status = "❌ MISSING"
            all_passed = False
        print(f"   {status} Hour {hour}:00")
    
    # Test 4: Probability Range
    print("\n✓ Test 4: Probability Values in Valid Range [0, 1]")
    print("-" * 60)
    
    invalid_count = 0
    total_count = 0
    
    for equipment in expected_equipment:
        for weekday in weekdays:
            for hour in range(6, 23):
                prob = predictions[equipment][weekday][str(hour)]['probability']
                total_count += 1
                
                if prob < 0 or prob > 1:
                    print(f"   ❌ INVALID: {equipment} {weekday} {hour}:00 = {prob}")
                    invalid_count += 1
                    all_passed = False
    
    if invalid_count == 0:
        print(f"   ✅ All {total_count} predictions in valid range")
    else:
        print(f"   ❌ Found {invalid_count} invalid probabilities")
    
    # Test 5: Congestion Levels Match Probability
    print("\n✓ Test 5: Congestion Levels Consistent with Probability")
    print("-" * 60)
    
    mismatches = 0
    
    for equipment in expected_equipment[:2]:  # Sample check
        for weekday in ['Monday', 'Saturday']:
            for hour in [9, 17]:
                pred = predictions[equipment][weekday][str(hour)]
                prob = pred['probability']
                level = pred['congestion_level']
                
                # Check consistency
                expected_level = 'low' if prob < 0.3 else 'moderate' if prob < 0.6 else 'high'
                
                if level != expected_level:
                    print(f"   ⚠️  {equipment} {weekday} {hour}:00: prob={prob:.2f} but level={level} (expected {expected_level})")
                    mismatches += 1
    
    if mismatches == 0:
        print(f"   ✅ Congestion levels consistent")
    else:
        print(f"   ⚠️  Found {mismatches} mismatches")
    
    # Test 6: Weekend vs Weekday Differences
    print("\n✓ Test 6: Weekend vs Weekday Pattern Differences")
    print("-" * 60)
    
    for equipment in ['bench_press', 'treadmill']:
        weekday_avg = sum(
            predictions[equipment]['Monday'][str(h)]['probability']
            for h in range(9, 18)
        ) / 9
        
        weekend_avg = sum(
            predictions[equipment]['Saturday'][str(h)]['probability']
            for h in range(9, 18)
        ) / 9
        
        diff = abs(weekday_avg - weekend_avg)
        
        print(f"   {equipment:20} Weekday: {weekday_avg:.2f} | Weekend: {weekend_avg:.2f} | Diff: {diff:.2f}")
        
        if diff < 0.05:
            print(f"      ⚠️  Very similar patterns (may be too uniform)")
    
    # Summary
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL EDGE CASES PASSED")
    else:
        print("❌ SOME EDGE CASES FAILED - Check output above")
    
    print(f"\n📊 Coverage:")
    print(f"   Equipment types: {len(expected_equipment)}")
    print(f"   Weekdays: {len(weekdays)}")
    print(f"   Hours per day: 17 (6am-10pm)")
    print(f"   Total predictions: {len(expected_equipment) * len(weekdays) * 17} = {total_count}")
    
    return all_passed

if __name__ == '__main__':
    import sys
    passed = test_edge_cases()
    sys.exit(0 if passed else 1)
