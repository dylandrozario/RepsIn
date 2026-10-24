import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import { Label, Button, Chip, Divider } from '../components/UI';
import { FadeInView } from '../motion/AnimatedComponents';
import { ProgressBar } from '../motion/Progress';
import { stagger } from '../motion/motion';
import { colors, type, spacing } from '../theme/theme';
import { FITNESS_GOALS, EXPERIENCE_LEVELS, WORKOUT_DURATIONS, GYMS, DEMO_GYM } from '../data/gymData';
import storage from '../services/storageService';
import { setActiveGym } from '../services/recommendationEngine';
import { useAuth } from '../auth/AuthContext';

const WEEKLY_GOALS = [2, 3, 4, 5, 6];

export default function OnboardingScreen({ onDone }) {
  const { profile } = useAuth();
  const [goal, setGoal] = useState('strength');
  const [experience, setExperience] = useState('intermediate');
  const [duration, setDuration] = useState(45);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [gymId, setGymId] = useState(DEMO_GYM.id);

  const steps = [goal, experience, duration, weeklyGoal];
  const progress = steps.filter(Boolean).length / steps.length;

  const finish = async () => {
    const gym = setActiveGym(gymId);
    const prefs = {
      goal, experience, duration,
      gymId: gym.id,
      name: profile?.name || 'Athlete',
      weeklyGoal,
    };
    await storage.saveUserPreferences(prefs);
    await storage.saveSelectedGym(gym);
    // Availability is painted on the Home screen right after this.
    onDone(prefs);
  };

  return (
    <Screen>
      <View style={{ height: spacing.lg }} />
      <ProgressBar value={progress} height={4} />
      <View style={{ height: spacing.lg }} />

      <FadeInView delay={stagger(0)}>
        <Label>Welcome to RepsIn</Label>
        <Text style={[type.h1, { marginTop: 8 }]}>Let's set your rhythm.</Text>
        <Text style={[type.body, { marginTop: 6 }]}>
          A few quick choices, then we'll map your week.
        </Text>
      </FadeInView>

      <FadeInView delay={stagger(1)}>
        <Divider />
        <Label muted>Your goal</Label>
        <View style={styles.wrapRow}>
          {FITNESS_GOALS.map((g) => (
            <Chip key={g.id} label={`${g.icon} ${g.label}`} selected={goal === g.id} onPress={() => setGoal(g.id)} />
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={stagger(2)}>
        <Divider />
        <Label muted>Experience</Label>
        <View style={styles.wrapRow}>
          {EXPERIENCE_LEVELS.map((e) => (
            <Chip key={e.id} label={e.label} selected={experience === e.id} onPress={() => setExperience(e.id)} />
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={stagger(3)}>
        <Divider />
        <Label muted>Session length</Label>
        <View style={styles.wrapRow}>
          {WORKOUT_DURATIONS.map((d) => (
            <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={stagger(4)}>
        <Divider />
        <Label muted>Weekly goal</Label>
        <View style={styles.wrapRow}>
          {WEEKLY_GOALS.map((n) => (
            <Chip key={n} label={`${n}× / week`} selected={weeklyGoal === n} onPress={() => setWeeklyGoal(n)} />
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={stagger(5)}>
        <Divider />
        <Label muted>Your gym (Boston)</Label>
        <View style={styles.wrapRow}>
          {GYMS.map((g) => (
            <Chip
              key={g.id}
              label={g.name}
              selected={gymId === g.id}
              onPress={() => setGymId(g.id)}
            />
          ))}
        </View>
        <Text style={[type.small, { marginTop: spacing.sm }]}>
          {GYMS.find((g) => g.id === gymId)?.address}
        </Text>

        <View style={{ height: spacing.xxl }} />
        <Button label="Next: map my week" icon="→" onPress={finish} />
        <View style={{ height: spacing.lg }} />
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md },
});
