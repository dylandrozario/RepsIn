
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
