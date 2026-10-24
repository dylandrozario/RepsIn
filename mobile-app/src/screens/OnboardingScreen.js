import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import { Label, Button, Chip, Divider } from '../components/UI';
import { colors, type, fonts, spacing } from '../theme/theme';
import { FITNESS_GOALS, EXPERIENCE_LEVELS, WORKOUT_DURATIONS, DEMO_GYM } from '../data/gymData';
import storage from '../services/storageService';

export default function OnboardingScreen({ onDone }) {
  const [goal, setGoal] = useState('strength');
  const [experience, setExperience] = useState('intermediate');
  const [duration, setDuration] = useState(45);

  const finish = async () => {
    const prefs = { goal, experience, duration, gymId: DEMO_GYM.id, name: 'Alex' };
    await storage.saveUserPreferences(prefs);
    await storage.saveSelectedGym(DEMO_GYM);
    onDone(prefs);
  };

  return (
    <Screen>
      <View style={{ height: spacing.xxl }} />
      <Label>Welcome to RepsIn</Label>
      <Text style={[type.display, { marginTop: 8 }]}>Let's set your rhythm.</Text>
      <Text style={[type.body, { marginTop: 6 }]}>
        A few quick choices so we can plan around crowds and your schedule.
      </Text>

      <Divider />

      <Label muted>Your goal</Label>
      <View style={styles.wrapRow}>
        {FITNESS_GOALS.map((g) => (
          <Chip key={g.id} label={`${g.icon} ${g.label}`} selected={goal === g.id} onPress={() => setGoal(g.id)} />
        ))}
      </View>

      <Divider />

      <Label muted>Experience</Label>
      <View style={styles.wrapRow}>
        {EXPERIENCE_LEVELS.map((e) => (
          <Chip key={e.id} label={e.label} selected={experience === e.id} onPress={() => setExperience(e.id)} />
        ))}
      </View>

      <Divider />

      <Label muted>Session length</Label>
      <View style={styles.wrapRow}>
        {WORKOUT_DURATIONS.map((d) => (
          <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />
        ))}
      </View>

      <Divider />

      <Label muted>Your gym</Label>
      <Text style={[type.h3, { marginTop: 8 }]}>{DEMO_GYM.name}</Text>
      <Text style={type.small}>{DEMO_GYM.address}</Text>

      <View style={{ height: spacing.xxl }} />
      <Button label="Start planning" icon="→" onPress={finish} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md },
});
