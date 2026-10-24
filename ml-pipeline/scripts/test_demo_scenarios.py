"""
Test specific demo scenarios.
Phase 3, Task 3.2
"""

import json

def load_predictions(path='../models/occupancy_predictions.json'):
    """Load prediction file."""
    with open(path, 'r') as f:
        return json.load(f)

def test_demo_scenarios():
    """Test and document demo scenarios."""
    
    print("🎬 Phase 3: Demo Scenario Testing\n")
    print("=" * 60)
    
    predictions = load_predictions()
    
    scenarios = [
        {
            'name': 'Scenario 1: Peak Hour Comparison',
            'description': 'Show Monday 5pm (busy) vs 2pm (quiet)',
            'tests': [
                ('Monday', 17, 'Peak Hour'),
                ('Monday', 14, 'Off-Peak')
            ]
        },
        {
            'name': 'Scenario 2: Weekend Morning Cardio',
            'description': 'Show Saturday 8am treadmill rush',
            'tests': [
                ('Saturday', 8, 'Weekend Morning'),
            ]
        },
        {
            'name': 'Scenario 3: Monday Chest Day',
            'description': 'Show bench press busier on Monday',
            'tests': [
                ('Monday', 17, 'Monday Evening'),
                ('Tuesday', 17, 'Tuesday Evening'),
            ]
        }
    ]
    
    for scenario in scenarios:
        print(f"\n📋 {scenario['name']}")
        print(f"   {scenario['description']}")
        print("-" * 60)
        
        for weekday, hour, label in scenario['tests']:
            print(f"\n   {label}: {weekday} {hour}:00")
            
            # Key equipment to show
            equipment_list = ['bench_press', 'squat_rack', 'treadmill']
            
            for equipment in equipment_list:
                pred = predictions[equipment][weekday][str(hour)]
                prob = pred['probability']
                level = pred['congestion_level']
                
                # Format display
                eq_name = equipment.replace('_', ' ').title()
                emoji = '🟢' if level == 'low' else '🟠' if level == 'moderate' else '🔴'
                
                print(f"      {emoji} {eq_name:15} {level:8} ({prob*100:.0f}%)")
    
    # Best Time Finder
    print("\n" + "=" * 60)
    print("\n💡 Best Times to Recommend:")
    print("-" * 60)
    
    for weekday in ['Monday', 'Saturday']:
        print(f"\n   {weekday}:")
        
        # Find hour with lowest average probability
        best_hour = None
        lowest_avg = 1.0
        
        for hour in range(6, 23):
            avg_prob = sum(
                predictions[eq][weekday][str(hour)]['probability']
                for eq in ['bench_press', 'squat_rack', 'cable_machine', 'treadmill']
            ) / 4
            
            if avg_prob < lowest_avg:
                lowest_avg = avg_prob
                best_hour = hour
        
        print(f"      Best time: {best_hour}:00 (avg {lowest_avg*100:.0f}% occupancy)")
    
    print("\n" + "=" * 60)
    print("✅ Demo scenarios documented")
    print("\n💡 Use these scenarios when presenting your demo!")

if __name__ == '__main__':
    test_demo_scenarios()
