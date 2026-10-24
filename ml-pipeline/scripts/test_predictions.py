"""
Quick test script to validate ML predictions.
Run after train_model.py to verify output.
"""

import json
import sys

def test_predictions(predictions_file='../models/occupancy_predictions.json'):
    """Test that predictions file is valid and complete."""
    
    print("🧪 Testing ML predictions...\n")
    
    try:
        # Load predictions
        with open(predictions_file, 'r') as f:
            predictions = json.load(f)
        
        print(f"✅ Loaded predictions file: {predictions_file}")
        
        # Check equipment types
        equipment_types = list(predictions.keys())
        print(f"\n📊 Equipment types: {len(equipment_types)}")
        for eq in equipment_types:
            print(f"   - {eq}")
        
        # Check completeness
        weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        hours = list(range(6, 23))
        
        sample_equipment = equipment_types[0]
        print(f"\n🔍 Checking completeness for '{sample_equipment}'...")
        
        missing = []
        for weekday in weekdays:
            if weekday not in predictions[sample_equipment]:
                missing.append(f"Missing weekday: {weekday}")
            else:
                for hour in hours:
                    if str(hour) not in predictions[sample_equipment][weekday]:
                        missing.append(f"Missing {weekday} hour {hour}")
        
        if missing:
            print(f"❌ Found {len(missing)} missing entries:")
            for m in missing[:5]:  # Show first 5
                print(f"   - {m}")
        else:
            print("✅ All weekdays and hours present")
        
        # Check probability ranges
        print("\n📈 Checking probability ranges...")
        all_probs = []
        for eq in equipment_types:
            for weekday in predictions[eq].keys():
                for hour in predictions[eq][weekday].keys():
                    prob = predictions[eq][weekday][hour]['probability']
                    all_probs.append(prob)
                    
                    if prob < 0 or prob > 1:
                        print(f"⚠️  Invalid probability: {eq} {weekday} {hour} = {prob}")
        
        if all_probs:
            print(f"✅ All probabilities in valid range [0, 1]")
            print(f"   Min: {min(all_probs):.3f}")
            print(f"   Max: {max(all_probs):.3f}")
            print(f"   Mean: {sum(all_probs)/len(all_probs):.3f}")
        
        # Sample predictions
        print(f"\n🎯 Sample predictions for Monday 5pm:")
        for eq in equipment_types[:3]:  # Show first 3
            pred = predictions[eq]['Monday']['17']
            print(f"   {eq:20} → {pred['probability']:.2f} ({pred['congestion_level']})")
        
        print("\n✅ All tests passed!")
        return True
        
    except FileNotFoundError:
        print(f"❌ File not found: {predictions_file}")
        print("   Run train_model.py first!")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    success = test_predictions()
    sys.exit(0 if success else 1)
