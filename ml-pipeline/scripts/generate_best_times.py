#!/usr/bin/env python3
"""
Generate Best Workout Times Ranking
Identifies top 10 best times to visit across entire week
"""

import json
from pathlib import Path

def generate_best_times():
    """Generate ranked list of best workout times"""
    
    print("🎯 Generating Best Workout Times Ranking")
    print("=" * 60)
    
    # Load gym-wide congestion data
    models_dir = Path(__file__).parent.parent / "models"
    with open(models_dir / "gym_wide_congestion.json") as f:
        congestion = json.load(f)
    
    # Collect all time slots with scores
    all_slots = []
    
    weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    for day in weekdays:
        for hour in range(6, 23):  # 6am to 10pm
            hour_str = str(hour)
            data = congestion[day][hour_str]
            
            # Score calculation:
            # - Lower congestion = better (0-100)
            # - Reasonable hours bonus (not too early/late)
            # - Weekend slight bonus (more convenient for many)
            
            congestion_score = 100 - data["percent_full"]
            
            # Time convenience bonus
            time_bonus = 0
            if 8 <= hour <= 10:  # Morning prime time
                time_bonus = 10
            elif 11 <= hour <= 13:  # Lunch
                time_bonus = 5
            elif 15 <= hour <= 16:  # Afternoon
                time_bonus = 10
            elif 20 <= hour <= 21:  # Evening but not peak
                time_bonus = 5
            
            # Weekend bonus (more flexible for working professionals)
            weekend_bonus = 5 if day in ["Saturday", "Sunday"] else 0
            
            total_score = congestion_score + time_bonus + weekend_bonus
            
            all_slots.append({
                "day": day,
                "hour": hour,
                "percent_full": data["percent_full"],
                "congestion_level": data["congestion_level"],
                "score": total_score,
                "busiest_equipment": data["busiest_equipment"],
                "quietest_equipment": data["quietest_equipment"]
            })
    
    # Sort by score (highest = best)
    all_slots.sort(key=lambda x: x["score"], reverse=True)
    
    # Get top 10 and bottom 10
    top_10 = all_slots[:10]
    worst_10 = all_slots[-10:]
    
    # Create output structure
    best_times = {
        "top_10_best": [
            {
                "rank": i + 1,
                "day": slot["day"],
                "hour": slot["hour"],
                "time_label": f"{slot['day']} {slot['hour']}:00",
                "percent_full": slot["percent_full"],
                "congestion_level": slot["congestion_level"],
                "score": round(slot["score"], 1),
                "busiest_equipment": slot["busiest_equipment"],
                "quietest_equipment": slot["quietest_equipment"],
                "recommendation": generate_recommendation(slot)
            }
            for i, slot in enumerate(top_10)
        ],
        "worst_10_times": [
            {
                "rank": len(all_slots) - i,
                "day": slot["day"],
                "hour": slot["hour"],
                "time_label": f"{slot['day']} {slot['hour']}:00",
                "percent_full": slot["percent_full"],
                "congestion_level": slot["congestion_level"],
                "score": round(slot["score"], 1),
                "avoid_reason": generate_avoid_reason(slot)
            }
            for i, slot in enumerate(reversed(worst_10))
        ],
        "summary": {
            "best_overall": {
                "time": f"{top_10[0]['day']} {top_10[0]['hour']}:00",
                "percent_full": top_10[0]["percent_full"],
                "level": top_10[0]["congestion_level"]
            },
            "worst_overall": {
                "time": f"{worst_10[-1]['day']} {worst_10[-1]['hour']}:00",
                "percent_full": worst_10[-1]["percent_full"],
                "level": worst_10[-1]["congestion_level"]
            },
            "average_congestion": round(sum(s["percent_full"] for s in all_slots) / len(all_slots), 1),
            "total_time_slots": len(all_slots)
        }
    }
    
    # Save to file
    with open(models_dir / "best_workout_times.json", 'w') as f:
        json.dump(best_times, f, indent=2)
    
    print("✅ Generated best workout times ranking")
    print(f"📊 Analyzed {len(all_slots)} time slots across the week")
    print(f"\n{'='*60}")
    print("TOP 10 BEST WORKOUT TIMES")
    print(f"{'='*60}\n")
    
    for item in best_times["top_10_best"]:
        level_emoji = "🟢" if item["congestion_level"] == "low" else "🟡" if item["congestion_level"] == "moderate" else "🔴"
        print(f"{item['rank']:2d}. {level_emoji} {item['time_label']:18s} - "
              f"{item['percent_full']:3.0f}% full (Score: {item['score']:.0f})")
        print(f"     💡 {item['recommendation']}\n")
    
    print(f"\n{'='*60}")
    print("WORST 10 TIMES (AVOID)")
    print(f"{'='*60}\n")
    
    for slot in best_times["worst_10_times"]:
        level_emoji = "🔴" if slot["congestion_level"] == "high" else "🟡"
        print(f" {slot['rank']:3d}. {level_emoji} {slot['time_label']:18s} - "
              f"{slot['percent_full']:3.0f}% full")
        print(f"      ⚠️  {slot['avoid_reason']}\n")
    
    print(f"\n{'='*60}")
    print("📊 SUMMARY")
    print(f"{'='*60}")
    summary = best_times["summary"]
    print(f"Best time overall:  {summary['best_overall']['time']} ({summary['best_overall']['percent_full']}% full)")
    print(f"Worst time overall: {summary['worst_overall']['time']} ({summary['worst_overall']['percent_full']}% full)")
    print(f"Average congestion: {summary['average_congestion']}% full")
    print(f"{'='*60}")
    
    print("\n💾 Saved to: models/best_workout_times.json")
    print("✅ Ready for UI integration")

def generate_recommendation(slot):
    """Generate human-readable recommendation"""
    if slot["percent_full"] < 20:
        return f"Excellent time! Gym is nearly empty - all equipment available"
    elif slot["percent_full"] < 40:
        return f"Great choice - minimal waits, {slot['quietest_equipment']} wide open"
    elif slot["percent_full"] < 60:
        return f"Good option - moderate crowd, {slot['quietest_equipment']} usually free"
    else:
        return f"Fair option - busier time, consider {slot['quietest_equipment']}"

def generate_avoid_reason(slot):
    """Generate reason to avoid this time"""
    if slot["percent_full"] > 85:
        return f"Peak congestion - expect long waits, especially for {slot['busiest_equipment']}"
    elif slot["percent_full"] > 70:
        return f"Very busy - {slot['busiest_equipment']} likely occupied"
    else:
        return f"High traffic period"

if __name__ == "__main__":
    generate_best_times()
