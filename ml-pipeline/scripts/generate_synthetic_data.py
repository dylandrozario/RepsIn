"""
Generate synthetic gym equipment occupancy data for ML training.

This script creates realistic patterns:
- Weekday evenings (5-7pm) are busier
- Saturday/Sunday mornings are busy for cardio
- Late nights (9-11pm) are less crowded
- Different equipment types have different usage patterns
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
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

# Time patterns
HOURS = list(range(6, 23))  # 6am to 11pm
WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

def get_base_occupancy_probability(equipment_type, weekday, hour, equipment_data):
    """Calculate base probability that all units are occupied."""
    
    popularity = equipment_data[equipment_type]['popularity']
    units = equipment_data[equipment_type]['units']
    
    # Time-of-day multiplier
    if 17 <= hour <= 19:  # 5-7pm peak
        time_multiplier = 1.5
    elif 12 <= hour <= 14:  # Lunch rush
        time_multiplier = 1.2
    elif 6 <= hour <= 8:  # Early morning
        time_multiplier = 0.9
    elif 20 <= hour <= 22:  # Late evening
        time_multiplier = 0.7
    else:
        time_multiplier = 0.8
    
    # Weekday multiplier
    if weekday in ['Saturday', 'Sunday']:
        if 8 <= hour <= 11:  # Weekend morning rush
            weekday_multiplier = 1.4
        else:
            weekday_multiplier = 0.9
    elif weekday in ['Monday', 'Wednesday']:  # Popular workout days
        weekday_multiplier = 1.1
    else:
        weekday_multiplier = 1.0
    
    # Equipment-specific adjustments
    if equipment_type == 'treadmill' and 6 <= hour <= 9:  # Cardio in morning
        time_multiplier *= 1.3
    elif equipment_type in ['bench_press', 'squat_rack'] and weekday == 'Monday':  # International chest day
        weekday_multiplier *= 1.2
    
    # Calculate probability (inverse relationship with number of units)
    base_prob = popularity * time_multiplier * weekday_multiplier
    
    # More units = less likely ALL are occupied
    adjusted_prob = base_prob / (1 + np.log(units))
    
    # Clamp between 0.05 and 0.95
    return max(0.05, min(0.95, adjusted_prob))

def generate_synthetic_dataset(num_weeks=8):
    """Generate synthetic training data for multiple weeks."""
    
    data = []
    
    for week in range(num_weeks):
        for weekday_idx, weekday in enumerate(WEEKDAYS):
            for hour in HOURS:
                for equipment_type, equipment_info in EQUIPMENT_TYPES.items():
                    
                    # Get base probability
                    base_prob = get_base_occupancy_probability(
                        equipment_type, weekday, hour, EQUIPMENT_TYPES
                    )
                    
                    # Add some randomness (±20%)
                    noise = np.random.uniform(-0.15, 0.15)
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
    print("\nOccupancy by equipment type:")
    print(df.groupby('equipment_type')['is_fully_occupied'].mean().sort_values(ascending=False))

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
    print("🔬 Generating synthetic gym occupancy dataset...\n")
    
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Generate dataset
    df = generate_synthetic_dataset(num_weeks=8)
    
    # Save to CSV
    save_dataset(df, '../data/synthetic_occupancy_data.csv')
    
    # Save equipment metadata
    save_equipment_metadata('../data/equipment_metadata.json')
    
    print("\n✅ Synthetic data generation complete!")
