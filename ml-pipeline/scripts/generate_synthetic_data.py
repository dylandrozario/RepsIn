"""
Generate synthetic gym equipment occupancy data for ML training.

IMPROVED VERSION - Stronger patterns for better model accuracy.
"""

import pandas as pd
import numpy as np
import json

# Equipment types with different popularity patterns
EQUIPMENT_TYPES = {
    'bench_press': {'units': 3, 'popularity': 0.8},
    'squat_rack': {'units': 2, 'popularity': 0.75},
    'leg_press': {'units': 2, 'popularity': 0.6},
    'cable_machine': {'units': 4, 'popularity': 0.7},
    'treadmill': {'units': 10, 'popularity': 0.85},
    'rowing_machine': {'units': 5, 'popularity': 0.5},
    'dumbbells': {'units': 15, 'popularity': 0.9},
    'smith_machine': {'units': 1, 'popularity': 0.4},
}

HOURS = list(range(6, 23))  # 6am to 11pm
WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

def get_base_occupancy_probability(equipment_type, weekday, hour, equipment_data):
    """Calculate base probability that all units are occupied."""
    
    popularity = equipment_data[equipment_type]['popularity']
    units = equipment_data[equipment_type]['units']
    
    # STRONGER time-of-day patterns
    if 17 <= hour <= 19:  # 5-7pm PEAK
        time_multiplier = 2.5  # Much stronger peak
    elif 12 <= hour <= 14:  # Lunch rush
        time_multiplier = 1.6
    elif 6 <= hour <= 8:  # Early morning
        time_multiplier = 0.6
    elif 20 <= hour <= 22:  # Late evening
        time_multiplier = 0.4
    elif 9 <= hour <= 11:  # Mid-morning
        time_multiplier = 0.7
    elif 15 <= hour <= 16:  # Mid-afternoon
        time_multiplier = 0.9
    else:
        time_multiplier = 0.5
    
    # STRONGER weekday patterns
    if weekday in ['Saturday', 'Sunday']:
        if 8 <= hour <= 11:  # Weekend morning rush
            weekday_multiplier = 1.8
        elif hour >= 17:  # Weekend evenings quieter
            weekday_multiplier = 0.6
        else:
            weekday_multiplier = 0.9
    elif weekday in ['Monday', 'Wednesday']:  # Popular workout days
        weekday_multiplier = 1.3
    elif weekday == 'Friday':  # TGIF - people leave early
        if hour >= 18:
            weekday_multiplier = 0.7
        else:
            weekday_multiplier = 1.1
    else:  # Tuesday, Thursday
        weekday_multiplier = 1.0
    
    # STRONGER equipment-specific patterns
    if equipment_type == 'treadmill':
        if 6 <= hour <= 9:  # Morning cardio rush
            time_multiplier *= 1.8
        elif weekday in ['Saturday', 'Sunday'] and 8 <= hour <= 11:
            time_multiplier *= 1.5
    
    elif equipment_type in ['bench_press', 'squat_rack']:
        if weekday == 'Monday' and 17 <= hour <= 19:  # Monday chest day peak
            weekday_multiplier *= 1.5
        elif weekday in ['Wednesday', 'Friday']:  # Other popular days
            weekday_multiplier *= 1.2
    
    elif equipment_type == 'smith_machine':
        # Less popular overall
        time_multiplier *= 0.7
    
    elif equipment_type == 'dumbbells':
        # Very popular, always busy at peak
        if 17 <= hour <= 19:
            time_multiplier *= 1.3
    
    # Calculate probability with unit count
    base_prob = popularity * time_multiplier * weekday_multiplier
    
    # Inverse relationship with units (more units = harder to fill all)
    if units >= 10:
        adjusted_prob = base_prob * 0.3  # Hard to fill all 10+ units
    elif units >= 5:
        adjusted_prob = base_prob * 0.5
    elif units >= 3:
        adjusted_prob = base_prob * 0.7
    else:  # 1-2 units
        adjusted_prob = base_prob * 0.9  # Easier to fill
    
    # Clamp between 0.05 and 0.95
    return max(0.05, min(0.95, adjusted_prob))

def generate_synthetic_dataset(num_weeks=12):  # Increased to 12 weeks
    """Generate synthetic training data with strong patterns."""
    
    data = []
    np.random.seed(42)  # For reproducibility
    
    for week in range(num_weeks):
        for weekday_idx, weekday in enumerate(WEEKDAYS):
            for hour in HOURS:
                for equipment_type, equipment_info in EQUIPMENT_TYPES.items():
                    
                    # Get base probability
                    base_prob = get_base_occupancy_probability(
                        equipment_type, weekday, hour, EQUIPMENT_TYPES
                    )
                    
                    # REDUCED noise (±10% instead of ±15%)
                    noise = np.random.uniform(-0.1, 0.1)
                    prob = max(0.0, min(1.0, base_prob + noise))
                    
                    # Sample occupancy status
                    is_fully_occupied = 1 if np.random.random() < prob else 0
                    
                    data.append({
                        'week': week,
                        'weekday': weekday,
                        'weekday_idx': weekday_idx,
                        'hour': hour,
                        'equipment_type': equipment_type,
                        'num_units': equipment_info['units'],
                        'is_fully_occupied': is_fully_occupied,
                        'occupancy_probability': round(prob, 3)
                    })
    
    return pd.DataFrame(data)

def save_dataset(df, output_path='../data/synthetic_occupancy_data.csv'):
    """Save dataset to CSV."""
    df.to_csv(output_path, index=False)
    print(f"✅ Saved {len(df)} rows to {output_path}")
    
    # Print summary statistics
    print("\n📊 Dataset Summary:")
    print(f"Total observations: {len(df)}")
    print(f"Equipment types: {df['equipment_type'].nunique()}")
    print(f"Weeks covered: {df['week'].nunique()}")
    print(f"Overall occupancy rate: {df['is_fully_occupied'].mean():.1%}")
    print("\n📈 Occupancy by equipment type:")
    print(df.groupby('equipment_type')['is_fully_occupied'].mean().sort_values(ascending=False))
    
    print("\n⏰ Occupancy by hour (weekdays):")
    weekday_data = df[df['weekday'].isin(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])]
    print(weekday_data.groupby('hour')['is_fully_occupied'].mean().sort_values(ascending=False).head(10))

def save_equipment_metadata(output_path='../data/equipment_metadata.json'):
    """Save equipment metadata for the mobile app."""
    metadata = {
        'equipment_types': [
            {
                'id': eq_type,
                'name': eq_type.replace('_', ' ').title(),
                'units': info['units']
            }
            for eq_type, info in EQUIPMENT_TYPES.items()
        ]
    }
    
    with open(output_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n✅ Saved equipment metadata to {output_path}")

if __name__ == '__main__':
    print("🔬 Generating IMPROVED synthetic gym occupancy dataset...\n")
    
    # Generate dataset with stronger patterns
    df = generate_synthetic_dataset(num_weeks=12)
    
    # Save to CSV
    save_dataset(df, '../data/synthetic_occupancy_data.csv')
    
    # Save equipment metadata
    save_equipment_metadata('../data/equipment_metadata.json')
    
    print("\n✅ Synthetic data generation complete!")
    print("💡 This version has STRONGER patterns for better model accuracy (target: 80%+)")
