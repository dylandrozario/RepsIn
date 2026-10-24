#!/usr/bin/env python3
"""
Real-Time Demo Mode - Shows gym predictions for RIGHT NOW

Usage:
    python demo_current_time.py              # Use actual current time
    python demo_current_time.py --time 17    # Override to specific hour (0-23)
    python demo_current_time.py --day monday # Override to specific day
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# ANSI color codes for terminal
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def get_congestion_color(probability):
    """Return color based on congestion level"""
    if probability < 0.3:
        return Colors.GREEN
    elif probability < 0.7:
        return Colors.YELLOW
    else:
        return Colors.RED

def get_congestion_label(probability):
    """Return human-readable congestion label"""
    if probability < 0.3:
        return "LOW 🟢"
    elif probability < 0.7:
        return "MODERATE 🟡"
    else:
        return "HIGH 🔴"

def format_time_12hr(hour):
    """Convert 24hr to 12hr format"""
    if hour == 0:
        return "12:00 AM"
    elif hour < 12:
        return f"{hour}:00 AM"
    elif hour == 12:
        return "12:00 PM"
    else:
        return f"{hour - 12}:00 PM"

def load_predictions():
    """Load prediction files"""
    base_path = Path(__file__).parent.parent
    
    files = {
        'equipment': base_path / 'models' / 'occupancy_predictions.json',
        'gym_wide': base_path / 'models' / 'gym_wide_congestion.json',
        'peak_hours': base_path / 'models' / 'peak_hours.json',
        'best_times': base_path / 'models' / 'best_workout_times.json',
        'wait_times': base_path / 'models' / 'predicted_wait_times.json',
        'personalized': base_path / 'models' / 'personalized_recommendations.json'
    }
    
    data = {}
    for key, path in files.items():
        if path.exists():
            with open(path) as f:
                data[key] = json.load(f)
        else:
            print(f"⚠️  Warning: {path} not found")
            data[key] = None
    
    return data

def get_current_predictions(data, day, hour):
    """Get predictions for specific day and hour"""
    if not data['equipment']:
        return None
    
    # Equipment predictions are nested: equipment_type -> day -> hour
    predictions = []
    day_cap = day.title()  # "Monday", "Tuesday", etc.
    hour_str = str(hour)
    
    for equipment_type, days in data['equipment'].items():
        if not isinstance(days, dict):
            continue
        
        if day_cap in days and hour_str in days[day_cap]:
            pred_data = days[day_cap][hour_str]
            predictions.append({
                'equipment_type': equipment_type.replace('_', ' ').title(),
                'probability_occupied': pred_data['probability'],
                'congestion_level': pred_data['congestion_level']
            })
    
    return sorted(predictions, key=lambda x: x['probability_occupied'])

def get_gym_wide_status(data, day, hour):
    """Get overall gym congestion"""
    if not data['gym_wide']:
        return None
    
    day_cap = day.title()
    hour_str = str(hour)
    
    if day_cap in data['gym_wide'] and hour_str in data['gym_wide'][day_cap]:
        return data['gym_wide'][day_cap][hour_str]
    
    return None

def get_wait_time_info(data, day, hour, equipment):
    """Get wait time for specific equipment"""
    if not data['wait_times']:
        return None
    
    day_cap = day.title()
    hour_str = str(hour)
    equipment_key = equipment.lower().replace(' ', '_')
    
    if (equipment_key in data['wait_times'] and 
        day_cap in data['wait_times'][equipment_key] and 
        hour_str in data['wait_times'][equipment_key][day_cap]):
        return data['wait_times'][equipment_key][day_cap][hour_str]
    
    return None

def print_header(day, hour):
    """Print demo header"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}🏋️  RepsIn LIVE DEMO - Real-Time Gym Predictions{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.END}\n")
    
    time_str = format_time_12hr(hour)
    print(f"{Colors.BOLD}📅 {day.title()}, {time_str}{Colors.END}")
    print(f"{Colors.CYAN}{'─'*70}{Colors.END}\n")

def print_gym_status(gym_status):
    """Print overall gym status"""
    if not gym_status:
        return
    
    percent_full = gym_status['average_probability'] * 100
    color = get_congestion_color(gym_status['average_probability'])
    label = get_congestion_label(gym_status['average_probability'])
    
    print(f"{Colors.BOLD}🏢 OVERALL GYM STATUS:{Colors.END}")
    print(f"   {color}{Colors.BOLD}{percent_full:.0f}% Full - {label}{Colors.END}")
    print(f"   Busiest: {gym_status['busiest_equipment']} ({gym_status['busiest_probability']*100:.0f}%)")
    print(f"   Quietest: {gym_status['quietest_equipment']} ({gym_status['quietest_probability']*100:.0f}%)\n")

def print_equipment_status(predictions, data, day, hour):
    """Print equipment-by-equipment status"""
    if not predictions:
        print("❌ No predictions available for this time\n")
        return
    
    print(f"{Colors.BOLD}📊 EQUIPMENT AVAILABILITY:{Colors.END}\n")
    
    for pred in predictions:
        prob = pred['probability_occupied']
        color = get_congestion_color(prob)
        label = get_congestion_label(prob)
        
        # Get wait time info
        wait_info = get_wait_time_info(data, day, hour, pred['equipment_type'])
        wait_str = ""
        if wait_info:
            if wait_info['available_units'] > 0:
                wait_str = f" | ✅ {wait_info['available_units']}/{wait_info['total_units']} available NOW"
            else:
                wait_str = f" | ⏱️  Wait: {wait_info['wait_label']}"
        
        print(f"   {color}●{Colors.END} {pred['equipment_type']:<20} "
              f"{color}{Colors.BOLD}{prob*100:>3.0f}%{Colors.END} {label}{wait_str}")
    
    print()

def print_comparison(data, day, current_hour):
    """Compare current time to 1-2 hours later"""
    next_hour = (current_hour + 2) % 24
    
    current_preds = get_current_predictions(data, day, current_hour)
    next_preds = get_current_predictions(data, day, next_hour)
    
    if not current_preds or not next_preds:
        return
    
    print(f"{Colors.BOLD}🔮 LOOKING AHEAD - {format_time_12hr(next_hour)}:{Colors.END}\n")
    
    # Calculate average change
    current_avg = sum(p['probability_occupied'] for p in current_preds) / len(current_preds)
    next_avg = sum(p['probability_occupied'] for p in next_preds) / len(next_preds)
    change = (next_avg - current_avg) * 100
    
    if change > 10:
        trend = f"{Colors.RED}📈 Getting BUSIER (+{change:.0f}%){Colors.END}"
        advice = f"{Colors.YELLOW}💡 Recommendation: Go NOW if possible!{Colors.END}"
    elif change < -10:
        trend = f"{Colors.GREEN}📉 Getting QUIETER ({change:.0f}%){Colors.END}"
        advice = f"{Colors.GREEN}💡 Recommendation: Wait 2 hours for less crowding{Colors.END}"
    else:
        trend = f"{Colors.YELLOW}➡️  About the same ({change:+.0f}%){Colors.END}"
        advice = f"{Colors.CYAN}💡 Recommendation: Timing doesn't matter much{Colors.END}"
    
    print(f"   {trend}")
    print(f"   {advice}\n")

def print_best_alternatives(data, day, current_hour):
    """Show best alternative times today"""
    if not data['best_times']:
        return
    
    print(f"{Colors.BOLD}⭐ BEST TIMES TODAY ({day.title()}):{Colors.END}\n")
    
    # Filter to just this day
    day_title = day.title()
    today_times = [
        t for t in data['best_times']['top_10_best']
        if t['day'] == day_title
    ][:3]  # Top 3
    
    if not today_times:
        print(f"   No recommended times found for {day_title}\n")
        return
    
    for i, time_slot in enumerate(today_times, 1):
        hour = time_slot['hour']
        time_str = format_time_12hr(hour)
        percent_full = time_slot['percent_full']
        score = time_slot['score']
        
        # Highlight if it's coming up soon
        hours_away = (hour - current_hour) % 24
        if hours_away <= 3:
            highlight = f" {Colors.GREEN}← Coming up soon!{Colors.END}"
        else:
            highlight = ""
        
        print(f"   {i}. {Colors.BOLD}{time_str}{Colors.END} - "
              f"{Colors.GREEN}{percent_full:.0f}% full{Colors.END} "
              f"(Score: {score:.0f}){highlight}")
    
    print()

def print_personalized_recommendations(data, day, current_hour):
    """Show personalized recommendations for different user types"""
    if not data['personalized']:
        return
    
    print(f"{Colors.BOLD}👤 PERSONALIZED RECOMMENDATIONS:{Colors.END}\n")
    
    # Extract personas - they're organized by key (busy_professional, flexible_student, etc.)
    persona_keys = ['busy_professional', 'flexible_student']
    
    for persona_key in persona_keys:
        if persona_key not in data['personalized']:
            continue
        
        persona_data = data['personalized'][persona_key]
        persona_info = persona_data['persona']
        ranked_slots = persona_data['ranked_slots']
        
        if not ranked_slots:
            continue
        
        name = persona_info['name']
        icon = "💼" if "Professional" in name else "🎓"
        top_rec = ranked_slots[0]
        
        time_str = format_time_12hr(top_rec['hour'])
        day_str = top_rec['day'].title()
        score = top_rec['score']
        congestion = top_rec['congestion_percent']
        
        print(f"   {icon} {Colors.BOLD}{name}{Colors.END}")
        print(f"      Best time: {Colors.GREEN}{day_str} {time_str}{Colors.END} "
              f"(Score: {score:.1f}, {congestion:.0f}% full)")
        print(f"      {top_rec['reasoning']}\n")

def print_footer():
    """Print demo footer"""
    print(f"{Colors.CYAN}{'─'*70}{Colors.END}")
    print(f"{Colors.BOLD}📱 RepsIn - Smart Gym Planning with ML{Colors.END}")
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")

def main():
    # Parse arguments
    import argparse
    parser = argparse.ArgumentParser(description='Real-time gym demo mode')
    parser.add_argument('--time', type=int, help='Override hour (0-23)', default=None)
    parser.add_argument('--day', type=str, help='Override day (monday-sunday)', default=None)
    args = parser.parse_args()
    
    # Get current time or use override
    now = datetime.now()
    
    if args.time is not None:
        hour = args.time
    else:
        hour = now.hour
    
    if args.day is not None:
        day = args.day
    else:
        day = now.strftime('%A')
    
    # Validate inputs
    if not (0 <= hour <= 23):
        print("❌ Hour must be between 0-23")
        sys.exit(1)
    
    if day.lower() not in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
        print("❌ Day must be a valid weekday")
        sys.exit(1)
    
    # Load all prediction data
    print(f"\n{Colors.CYAN}Loading predictions...{Colors.END}")
    data = load_predictions()
    
    # Get current predictions
    predictions = get_current_predictions(data, day, hour)
    gym_status = get_gym_wide_status(data, day, hour)
    
    # Print demo output
    print_header(day, hour)
    print_gym_status(gym_status)
    print_equipment_status(predictions, data, day, hour)
    print_comparison(data, day, hour)
    print_best_alternatives(data, day, hour)
    print_personalized_recommendations(data, day, hour)
    print_footer()
    
    # Summary stats
    if predictions:
        available_count = sum(1 for p in predictions if p['probability_occupied'] < 0.5)
        total_count = len(predictions)
        print(f"{Colors.BOLD}Quick Summary:{Colors.END} {available_count}/{total_count} equipment types likely available right now\n")

if __name__ == '__main__':
    main()
