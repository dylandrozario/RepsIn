"""
Validate that ML predictions show clear, demo-ready patterns.
Phase 3, Task 3.1
"""

import json
import sys

def load_predictions(path='../models/occupancy_predictions.json'):
    """Load prediction file."""
    with open(path, 'r') as f:
        return json.load(f)

def validate_patterns():
    """Run validation checks on predictions."""
    
    print("🔍 Phase 3: Validating Demo Patterns\n")
    print("=" * 60)
    
    predictions = load_predictions()
    all_passed = True
    
    # Test 1: Peak Hour Congestion (5-7pm weekdays)
    print("\n✓ Test 1: Peak Hour Congestion (5-7pm weekdays)")
    print("-" * 60)
    
    peak_equipment = ['bench_press', 'squat_rack', 'cable_machine']
    peak_hours = [17, 18, 19]
    
    for equipment in peak_equipment:
        for hour in peak_hours:
            pred = predictions[equipment]['Monday'][str(hour)]
            prob = pred['probability']
            level = pred['congestion_level']
            
            # Peak hours should be moderate or high
            if level in ['moderate', 'high']:
                status = '✅ PASS'
            else:
                status = '❌ FAIL'
                all_passed = False
            
            print(f"{status} {equipment:20} {hour}:00 → {level:8} ({prob:.2f})")
    
    # Test 2: Off-Peak Hours (2-4pm weekdays)
    print("\n✓ Test 2: Off-Peak Congestion (2-4pm weekdays)")
    print("-" * 60)
    
    offpeak_hours = [14, 15, 16]
    
    for equipment in peak_equipment:
        for hour in offpeak_hours:
            pred = predictions[equipment]['Monday'][str(hour)]
            prob = pred['probability']
            level = pred['congestion_level']
            
            # Off-peak should be low or moderate
            if level in ['low', 'moderate']:
                status = '✅ PASS'
            else:
                status = '⚠️  WARN' 
            
            print(f"{status} {equipment:20} {hour}:00 → {level:8} ({prob:.2f})")
    
    # Test 3: Peak vs Off-Peak Difference
    print("\n✓ Test 3: Peak vs Off-Peak Difference")
    print("-" * 60)
    
    for equipment in peak_equipment:
        peak_prob = predictions[equipment]['Monday']['17']['probability']
        offpeak_prob = predictions[equipment]['Monday']['14']['probability']
        diff = peak_prob - offpeak_prob
        
        if diff > 0.15:  # At least 15% difference
            status = '✅ PASS'
        else:
            status = '❌ FAIL'
            all_passed = False
        
        print(f"{status} {equipment:20} Peak: {peak_prob:.2f} | Off-peak: {offpeak_prob:.2f} | Diff: {diff:+.2f}")
    
    # Test 4: Monday Chest Day (bench press busier Monday)
    print("\n✓ Test 4: Monday Chest Day Pattern")
    print("-" * 60)
    
    monday_bench = predictions['bench_press']['Monday']['17']['probability']
    tuesday_bench = predictions['bench_press']['Tuesday']['17']['probability']
    diff = monday_bench - tuesday_bench
    
    if diff > 0:
        status = '✅ PASS'
    else:
        status = '⚠️  WARN'
    
    print(f"{status} Monday bench: {monday_bench:.2f} | Tuesday bench: {tuesday_bench:.2f} | Diff: {diff:+.2f}")
    
    # Test 5: Weekend Morning Cardio (treadmill 8-11am Saturday)
    print("\n✓ Test 5: Weekend Morning Cardio")
    print("-" * 60)
    
    weekend_morning_hours = [8, 9, 10, 11]
    for hour in weekend_morning_hours:
        pred = predictions['treadmill']['Saturday'][str(hour)]
        prob = pred['probability']
        level = pred['congestion_level']
        
        print(f"   Saturday treadmill {hour}:00 → {level:8} ({prob:.2f})")
    
    # Test 6: Equipment Capacity Effect (high-capacity vs low-capacity)
    print("\n✓ Test 6: Equipment Capacity Effect")
    print("-" * 60)
    
    # Treadmill (10 units) vs Squat Rack (2 units) at peak
    treadmill_peak = predictions['treadmill']['Monday']['17']['probability']
    squat_peak = predictions['squat_rack']['Monday']['17']['probability']
    
    print(f"   Treadmill (10 units): {treadmill_peak:.2f} | Squat (2 units): {squat_peak:.2f}")
    if treadmill_peak < squat_peak:
        print(f"   ✅ PASS - More units = lower full-occupancy probability")
    else:
        print(f"   ⚠️  WARN - Expected treadmill < squat rack")
    
    # Summary
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL CRITICAL TESTS PASSED - Demo-ready patterns!")
    else:
        print("⚠️  SOME TESTS FAILED - Consider retraining with stronger patterns")
    
    print("\n💡 Recommendation:")
    if all_passed:
        print("   Patterns are clear and realistic. Proceed to Phase 4.")
    else:
        print("   Adjust synthetic data generation for stronger patterns.")
    
    return all_passed

if __name__ == '__main__':
    passed = validate_patterns()
    sys.exit(0 if passed else 1)
