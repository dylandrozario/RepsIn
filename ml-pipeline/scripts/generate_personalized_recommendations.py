#!/usr/bin/env python3
"""
Personalized ML Recommendations Engine

The MISSING PIECE: Given user's schedule, goals, and preferences,
ML-powered time slot ranking that answers:
"GIVEN MY SCHEDULE, when should I go?"

This is what differentiates RepsIn from generic gym apps.
"""

import json
from pathlib import Path
from datetime import datetime, timedelta

def generate_personalized_recommendation_engine():
    """
    Create ML-powered personalized recommendation system
    
    Combines:
    1. User availability (their schedule)
    2. ML congestion predictions (our model)
    3. User preferences (goals, duration, equipment)
    4. Time-of-day preferences
    5. Workout history patterns
    
    Output: Ranked, personalized time slots
    """
    
    print("🎯 Generating Personalized Recommendation Engine")
    print("=" * 60)
    
    models_dir = Path(__file__).parent.parent / "models"
    
    # Load ML data
    with open(models_dir / "occupancy_predictions.json") as f:
        predictions = json.load(f)
    
    with open(models_dir / "gym_wide_congestion.json") as f:
        gym_congestion = json.load(f)
    
    # Define user personas for demo
    personas = {
        "busy_professional": {
            "name": "Busy Professional",
            "description": "Works 9-5, prefers early morning or late evening",
            "goals": ["muscle_building", "strength"],
            "experience": "intermediate",
            "duration": 60,
            "availability": [
                {"day": "Monday", "start": 6, "end": 8},
                {"day": "Monday", "start": 19, "end": 21},
                {"day": "Wednesday", "start": 6, "end": 8},
                {"day": "Wednesday", "start": 19, "end": 21},
                {"day": "Friday", "start": 6, "end": 8},
                {"day": "Friday", "start": 19, "end": 21},
            ],
            "preferred_equipment": ["bench_press", "squat_rack", "dumbbells"],
            "time_preference_weights": {
                "morning": 1.2,  # Prefer morning
                "evening": 1.0,
                "afternoon": 0.5
            }
        },
        "flexible_student": {
            "name": "Flexible Student",
            "description": "Variable schedule, prefers afternoon",
            "goals": ["general_fitness", "endurance"],
            "experience": "beginner",
            "duration": 45,
            "availability": [
                {"day": "Monday", "start": 10, "end": 16},
                {"day": "Tuesday", "start": 12, "end": 18},
                {"day": "Thursday", "start": 10, "end": 16},
                {"day": "Saturday", "start": 9, "end": 15},
            ],
            "preferred_equipment": ["treadmill", "rowing_machine", "cable_machine"],
            "time_preference_weights": {
                "morning": 0.8,
                "afternoon": 1.2,  # Prefer afternoon
                "evening": 0.9
            }
        },
        "early_bird": {
            "name": "Early Bird",
            "description": "Morning person, gym before work",
            "goals": ["weight_management", "cardio"],
            "experience": "advanced",
            "duration": 30,
            "availability": [
                {"day": "Monday", "start": 6, "end": 8},
                {"day": "Tuesday", "start": 6, "end": 8},
                {"day": "Wednesday", "start": 6, "end": 8},
                {"day": "Thursday", "start": 6, "end": 8},
                {"day": "Friday", "start": 6, "end": 8},
            ],
            "preferred_equipment": ["treadmill", "rowing_machine"],
            "time_preference_weights": {
                "morning": 1.5,  # Strong preference
                "afternoon": 0.3,
                "evening": 0.2
            }
        }
    }
    
    recommendation_engine = {}
    
    for persona_id, persona in personas.items():
        print(f"\n🤖 Generating recommendations for: {persona['name']}")
        
        # Score all available time slots
        ranked_slots = []
        
        for avail_window in persona["availability"]:
            day = avail_window["day"]
            
            for hour in range(avail_window["start"], avail_window["end"]):
                # Get gym congestion for this time
                congestion_data = gym_congestion[day][str(hour)]
                
                # Base score: Lower congestion = higher score
                congestion_score = 100 - congestion_data["percent_full"]
                
                # Time-of-day preference
                time_of_day = get_time_of_day(hour)
                time_weight = persona["time_preference_weights"][time_of_day]
                
                # Equipment availability score
                equipment_score = 0
                for equip in persona["preferred_equipment"]:
                    equip_prob = predictions[equip][day][str(hour)]["probability"]
                    equipment_score += (1 - equip_prob) * 100
                equipment_score /= len(persona["preferred_equipment"])
                
                # Duration feasibility (ensure workout fits in window)
                remaining_time = avail_window["end"] - hour
                duration_hours = persona["duration"] / 60
                duration_score = 100 if remaining_time >= duration_hours else 50
                
                # Combine scores with weights
                total_score = (
                    congestion_score * 0.4 +      # 40% weight on congestion
                    equipment_score * 0.3 +        # 30% weight on equipment
                    duration_score * 0.2 +         # 20% weight on feasibility
                    (time_weight * 10) * 0.1       # 10% weight on time preference
                )
                
                ranked_slots.append({
                    "day": day,
                    "hour": hour,
                    "score": round(total_score, 1),
                    "congestion_percent": congestion_data["percent_full"],
                    "congestion_level": congestion_data["congestion_level"],
                    "time_of_day": time_of_day,
                    "equipment_availability": round(equipment_score, 1),
                    "reasoning": generate_reasoning(
                        persona, day, hour, congestion_data, 
                        equipment_score, time_of_day
                    )
                })
        
        # Sort by score
        ranked_slots.sort(key=lambda x: x["score"], reverse=True)
        
        # Show top 5
        print(f"  Top 5 recommended times:")
        for i, slot in enumerate(ranked_slots[:5], 1):
            print(f"    {i}. {slot['day']} {slot['hour']:02d}:00 - Score: {slot['score']:.0f} "
                  f"({slot['congestion_percent']:.0f}% full)")
        
        recommendation_engine[persona_id] = {
            "persona": persona,
            "ranked_slots": ranked_slots[:20],  # Top 20 recommendations
            "best_time": ranked_slots[0],
            "worst_time": ranked_slots[-1],
            "summary": {
                "total_available_slots": len(ranked_slots),
                "low_congestion_slots": len([s for s in ranked_slots if s["congestion_percent"] < 40]),
                "high_congestion_slots": len([s for s in ranked_slots if s["congestion_percent"] > 70]),
                "best_days": get_best_days(ranked_slots)
            }
        }
    
    # Save recommendation engine
    with open(models_dir / "personalized_recommendations.json", 'w') as f:
        json.dump(recommendation_engine, f, indent=2)
    
    print(f"\n✅ Generated personalized recommendations for {len(personas)} personas")
    
    # Generate recommendation algorithm documentation
    algorithm_doc = {
        "algorithm": "ML-Powered Personalized Time Slot Ranking",
        "version": "1.0",
        "description": "Combines user schedule, ML predictions, and preferences to answer: 'When should I go?'",
        "inputs": [
            "User availability windows (day + time range)",
            "ML congestion predictions (952 time slots)",
            "User preferences (equipment, goals, duration)",
            "Time-of-day preferences"
        ],
        "scoring_formula": {
            "total_score": "weighted_sum(congestion_score, equipment_score, duration_score, time_preference)",
            "weights": {
                "congestion": 0.4,
                "equipment_availability": 0.3,
                "duration_feasibility": 0.2,
                "time_preference": 0.1
            },
            "congestion_score": "100 - percent_full (lower congestion = higher score)",
            "equipment_score": "average((1 - prob) * 100) for preferred equipment",
            "duration_score": "100 if workout fits, else 50",
            "time_preference": "user_weight * 10 based on morning/afternoon/evening"
        },
        "output": "Ranked list of time slots with scores and reasoning",
        "personalization": "Each user gets different rankings based on their schedule and preferences"
    }
    
    with open(models_dir / "recommendation_algorithm.json", 'w') as f:
        json.dump(algorithm_doc, f, indent=2)
    
    print("✅ Saved recommendation algorithm documentation")
    
    return recommendation_engine

def get_time_of_day(hour):
    """Classify hour into time of day"""
    if 5 <= hour < 10:
        return "morning"
    elif 10 <= hour < 17:
        return "afternoon"
    else:
        return "evening"

def generate_reasoning(persona, day, hour, congestion_data, equipment_score, time_of_day):
    """Generate human-readable reasoning for recommendation"""
    reasons = []
    
    # Congestion reason
    if congestion_data["percent_full"] < 40:
        reasons.append("gym is quiet")
    elif congestion_data["percent_full"] > 70:
        reasons.append("gym is busy")
    else:
        reasons.append("moderate crowd")
    
    # Equipment reason
    if equipment_score > 80:
        reasons.append("preferred equipment available")
    elif equipment_score < 40:
        reasons.append("preferred equipment likely occupied")
    
    # Time preference reason
    time_weight = persona["time_preference_weights"][time_of_day]
    if time_weight > 1.0:
        reasons.append(f"matches your {time_of_day} preference")
    
    return ", ".join(reasons).capitalize()

def get_best_days(ranked_slots):
    """Identify best days overall"""
    day_scores = {}
    for slot in ranked_slots:
        day = slot["day"]
        if day not in day_scores:
            day_scores[day] = []
        day_scores[day].append(slot["score"])
    
    day_avg = {day: sum(scores)/len(scores) for day, scores in day_scores.items()}
    sorted_days = sorted(day_avg.items(), key=lambda x: x[1], reverse=True)
    
    return [{"day": day, "avg_score": round(score, 1)} for day, score in sorted_days[:3]]

def generate_example_integration():
    """Generate example of how to use this in the app"""
    
    example = """
# Personalized Recommendation Integration Example

## Backend (JavaScript/React Native)

```javascript
import recommendations from './data/personalized_recommendations.json';

function getRecommendationsForUser(userProfile) {
  // Match user to closest persona
  const persona = matchPersona(userProfile);
  
  // Get ranked slots
  const rankedSlots = recommendations[persona].ranked_slots;
  
  // Return top 5
  return rankedSlots.slice(0, 5);
}

function matchPersona(userProfile) {
  // Simple matching logic
  if (userProfile.availability.includes('early_morning')) {
    return 'early_bird';
  } else if (userProfile.occupation === 'student') {
    return 'flexible_student';
  } else {
    return 'busy_professional';
  }
}

// Usage in UI
const recommendations = getRecommendationsForUser(currentUser);
recommendations.forEach(slot => {
  console.log(`${slot.day} ${slot.hour}:00 - Score: ${slot.score}`);
  console.log(`  Reasoning: ${slot.reasoning}`);
});
```

## Component Example

```jsx
function PersonalizedRecommendations({ userProfile }) {
  const recommendations = getRecommendationsForUser(userProfile);
  
  return (
    <View>
      <Text style={styles.title}>
        🎯 When YOU Should Go
      </Text>
      
      {recommendations.map((slot, index) => (
        <TouchableOpacity key={index} style={styles.slot}>
          <Text style={styles.rank}>#{index + 1}</Text>
          <Text style={styles.time}>
            {slot.day} {formatHour(slot.hour)}
          </Text>
          <Text style={styles.score}>Score: {slot.score}</Text>
          <Text style={styles.reasoning}>{slot.reasoning}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

## Key Differentiator

Other apps: "The gym is 80% full right now"
RepsIn: "Given YOUR schedule and preferences, go Monday at 7pm (score: 85) 
         because the gym is quiet and your preferred equipment is available"
"""
    
    models_dir = Path(__file__).parent.parent / "models"
    with open(models_dir / "recommendation_integration_example.md", 'w') as f:
        f.write(example)
    
    print("✅ Generated integration example")

def main():
    print("🎯 PERSONALIZED ML RECOMMENDATIONS")
    print("=" * 60)
    print("This is the KILLER FEATURE that answers:")
    print("'Given MY schedule and workout goals, when should I go?'")
    print("=" * 60)
    
    engine = generate_personalized_recommendation_engine()
    generate_example_integration()
    
    print("\n" + "=" * 60)
    print("✅ PERSONALIZED RECOMMENDATION ENGINE COMPLETE")
    print("=" * 60)
    print("\n📁 Generated files:")
    print("  1. personalized_recommendations.json (3 personas)")
    print("  2. recommendation_algorithm.json (algorithm docs)")
    print("  3. recommendation_integration_example.md (code examples)")
    print("\n💡 This is what makes RepsIn unique!")
    print("   Generic apps: 'Gym is busy'")
    print("   RepsIn: 'Given YOUR schedule, go Monday 7pm'")
    print("=" * 60)

if __name__ == "__main__":
    main()
