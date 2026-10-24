"""
Generate gym-wide metrics and analytics.
Phase 4: Additional ML Features

Creates:
1. Gym-wide congestion by hour/day
2. Peak-hour analysis and recommendations
3. Occupancy heatmap data for visualization
"""

import json
import numpy as np

def load_predictions(path='../models/occupancy_predictions.json'):
    """Load equipment predictions."""
    with open(path, 'r') as f:
        return json.load(f)

def generate_gym_wide_congestion(predictions):
    """
    Calculate overall gym congestion score.
    Averages across all equipment to give gym-level busyness.
    """
    print("📊 Generating gym-wide congestion metrics...")
    
    equipment_types = list(predictions.keys())
    weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    gym_congestion = {}
    
    for weekday in weekdays:
        gym_congestion[weekday] = {}
        
        for hour in range(6, 23):
            # Get all equipment probabilities for this time
            probs = []
            equipment_data = []
            
            for equipment in equipment_types:
                prob = predictions[equipment][weekday][str(hour)]['probability']
                level = predictions[equipment][weekday][str(hour)]['congestion_level']
                probs.append(prob)
                equipment_data.append({
                    'equipment': equipment,
                    'probability': prob,
                    'level': level
                })
            
            # Calculate average gym congestion
            avg_prob = np.mean(probs)
            
            # Determine overall level
            if avg_prob < 0.3:
                gym_level = 'low'
            elif avg_prob < 0.6:
                gym_level = 'moderate'
            else:
                gym_level = 'high'
            
            # Find busiest and quietest equipment
            equipment_data.sort(key=lambda x: x['probability'], reverse=True)
            busiest = equipment_data[0]
            quietest = equipment_data[-1]
            
            # Count by congestion level
            level_counts = {'low': 0, 'moderate': 0, 'high': 0}
            for eq in equipment_data:
                level_counts[eq['level']] += 1
            
            gym_congestion[weekday][str(hour)] = {
                'average_probability': round(float(avg_prob), 3),
                'congestion_level': gym_level,
                'percent_full': round(float(avg_prob * 100), 0),
                'busiest_equipment': busiest['equipment'].replace('_', ' ').title(),
                'busiest_probability': round(float(busiest['probability']), 2),
                'quietest_equipment': quietest['equipment'].replace('_', ' ').title(),
                'quietest_probability': round(float(quietest['probability']), 2),
                'equipment_breakdown': level_counts
            }
    
    print(f"   ✅ Generated gym-wide congestion for {len(weekdays)} days × 17 hours")
    return gym_congestion

def generate_peak_hours_analysis(gym_congestion):
    """
    Identify peak hours and generate recommendations.
    """
    print("\n⏰ Analyzing peak hours...")
    
    weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    peak_analysis = {}
    
    for weekday in weekdays:
        # Get all hours with their congestion
        hourly_data = []
        for hour in range(6, 23):
            data = gym_congestion[weekday][str(hour)]
            hourly_data.append({
                'hour': hour,
                'probability': data['average_probability'],
                'level': data['congestion_level'],
                'percent_full': data['percent_full']
            })
        
        # Sort by congestion (highest to lowest)
        hourly_data.sort(key=lambda x: x['probability'], reverse=True)
        
        # Identify peak hours (top 3)
        peak_hours = hourly_data[:3]
        
        # Identify quiet hours (bottom 3)
        quiet_hours = hourly_data[-3:]
        quiet_hours.reverse()  # Show best first
        
        # Find the absolute best time
        best_hour = quiet_hours[0]
        worst_hour = peak_hours[0]
        
        # Generate recommendation message
        if worst_hour['level'] == 'high':
            avoid_message = f"Avoid {worst_hour['hour']}:00 ({worst_hour['percent_full']:.0f}% full)"
            suggestion = f"Come at {best_hour['hour']}:00 instead ({best_hour['percent_full']:.0f}% full)"
        else:
            avoid_message = f"Busiest at {worst_hour['hour']}:00 ({worst_hour['percent_full']:.0f}% full)"
            suggestion = f"Best time: {best_hour['hour']}:00 ({best_hour['percent_full']:.0f}% full)"
        
        peak_analysis[weekday] = {
            'peak_hours': [h['hour'] for h in peak_hours],
            'peak_details': peak_hours,
            'quiet_hours': [h['hour'] for h in quiet_hours],
            'quiet_details': quiet_hours,
            'best_time': best_hour['hour'],
            'best_time_percent': best_hour['percent_full'],
            'worst_time': worst_hour['hour'],
            'worst_time_percent': worst_hour['percent_full'],
            'avoid_message': avoid_message,
            'suggestion': suggestion
        }
    
    # Overall weekly insights
    all_peaks = []
    for weekday in weekdays:
        worst = peak_analysis[weekday]['worst_time']
        prob = peak_analysis[weekday]['worst_time_percent']
        all_peaks.append({'weekday': weekday, 'hour': worst, 'percent': prob})
    
    all_peaks.sort(key=lambda x: x['percent'], reverse=True)
    
    peak_analysis['weekly_insights'] = {
        'busiest_overall': all_peaks[0],
        'quietest_day': min(weekdays, key=lambda d: peak_analysis[d]['worst_time_percent']),
        'busiest_day': max(weekdays, key=lambda d: peak_analysis[d]['worst_time_percent'])
    }
    
    print(f"   ✅ Identified peak hours for {len(weekdays)} days")
    print(f"   📍 Busiest time overall: {all_peaks[0]['weekday']} {all_peaks[0]['hour']}:00 ({all_peaks[0]['percent']:.0f}% full)")
    
    return peak_analysis

def generate_occupancy_heatmap(predictions):
    """
    Generate heatmap matrix for visualization.
    Format: equipment × hours for each day
    """
    print("\n🎨 Generating occupancy heatmap data...")
    
    equipment_types = list(predictions.keys())
    weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    hours = list(range(6, 23))
    
    heatmap = {
        'equipment': [eq.replace('_', ' ').title() for eq in equipment_types],
        'equipment_ids': equipment_types,
        'hours': hours,
        'hour_labels': [f"{h}:00" for h in hours],
        'weekdays': weekdays,
        'data': {}
    }
    
    for weekday in weekdays:
        # Create matrix: equipment (rows) × hours (columns)
        matrix = []
        
        for equipment in equipment_types:
            row = []
            for hour in hours:
                prob = predictions[equipment][weekday][str(hour)]['probability']
                row.append(round(float(prob), 2))
            matrix.append(row)
        
        heatmap['data'][weekday] = matrix
    
    # Add summary stats for each day
    heatmap['summary'] = {}
    for weekday in weekdays:
        matrix = heatmap['data'][weekday]
        all_values = [val for row in matrix for val in row]
        
        heatmap['summary'][weekday] = {
            'average': round(float(np.mean(all_values)), 2),
            'max': round(float(np.max(all_values)), 2),
            'min': round(float(np.min(all_values)), 2),
            'busiest_hour': hours[np.argmax([np.mean([matrix[i][j] for i in range(len(equipment_types))]) for j in range(len(hours))])],
            'quietest_hour': hours[np.argmin([np.mean([matrix[i][j] for i in range(len(equipment_types))]) for j in range(len(hours))])]
        }
    
    print(f"   ✅ Generated heatmap: {len(equipment_types)} equipment × {len(hours)} hours × {len(weekdays)} days")
    
    return heatmap

def save_metrics(gym_congestion, peak_analysis, heatmap):
    """Save all metrics to JSON files."""
    
    print("\n💾 Saving metrics...")
    
    # Save gym-wide congestion
    with open('../models/gym_wide_congestion.json', 'w') as f:
        json.dump(gym_congestion, f, indent=2)
    print("   ✅ Saved gym_wide_congestion.json")
    
    # Save peak hours analysis
    with open('../models/peak_hours.json', 'w') as f:
        json.dump(peak_analysis, f, indent=2)
    print("   ✅ Saved peak_hours.json")
    
    # Save heatmap data
    with open('../models/occupancy_heatmap.json', 'w') as f:
        json.dump(heatmap, f, indent=2)
    print("   ✅ Saved occupancy_heatmap.json")

def print_summary(gym_congestion, peak_analysis):
    """Print useful summary for demo."""
    
    print("\n" + "=" * 60)
    print("📊 METRICS SUMMARY")
    print("=" * 60)
    
    # Monday comparison (good for demo)
    monday_5pm = gym_congestion['Monday']['17']
    monday_8pm = gym_congestion['Monday']['20']
    
    print("\n🎯 Demo Scenario: Monday Peak vs Off-Peak")
    print("-" * 60)
    print(f"5pm: {monday_5pm['percent_full']:.0f}% full ({monday_5pm['congestion_level'].upper()})")
    print(f"     Busiest: {monday_5pm['busiest_equipment']} ({monday_5pm['busiest_probability']:.0%})")
    print(f"     Quietest: {monday_5pm['quietest_equipment']} ({monday_5pm['quietest_probability']:.0%})")
    print()
    print(f"8pm: {monday_8pm['percent_full']:.0f}% full ({monday_8pm['congestion_level'].upper()})")
    print(f"     Busiest: {monday_8pm['busiest_equipment']} ({monday_8pm['busiest_probability']:.0%})")
    print(f"     Quietest: {monday_8pm['quietest_equipment']} ({monday_8pm['quietest_probability']:.0%})")
    print(f"\n💡 Difference: {monday_5pm['percent_full'] - monday_8pm['percent_full']:.0f}% less crowded at 8pm!")
    
    # Peak hours
    print("\n⏰ Peak Hours Analysis")
    print("-" * 60)
    monday_peak = peak_analysis['Monday']
    print(f"Monday: {monday_peak['avoid_message']}")
    print(f"        {monday_peak['suggestion']}")
    
    # Weekly insights
    insights = peak_analysis['weekly_insights']
    print(f"\nBusiest overall: {insights['busiest_overall']['weekday']} {insights['busiest_overall']['hour']}:00")
    print(f"Busiest day: {insights['busiest_day']}")
    print(f"Quietest day: {insights['quietest_day']}")
    
    print("\n" + "=" * 60)
    print("✅ ALL METRICS GENERATED")
    print("=" * 60)

if __name__ == '__main__':
    print("🎯 Phase 4: Generating Additional ML Metrics\n")
    print("=" * 60)
    
    # Load predictions
    predictions = load_predictions()
    
    # Generate gym-wide congestion
    gym_congestion = generate_gym_wide_congestion(predictions)
    
    # Generate peak hours analysis
    peak_analysis = generate_peak_hours_analysis(gym_congestion)
    
    # Generate heatmap data
    heatmap = generate_occupancy_heatmap(predictions)
    
    # Save all metrics
    save_metrics(gym_congestion, peak_analysis, heatmap)
    
    # Print summary
    print_summary(gym_congestion, peak_analysis)
    
    print("\n💡 Next steps:")
    print("   1. Copy JSON files to mobile-app/src/data/")
    print("   2. Use in occupancyPredictor.js or create new gymMetrics.js")
    print("   3. UI team can visualize heatmap data")
