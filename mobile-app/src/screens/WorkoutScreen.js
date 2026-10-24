import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import { Label, Divider, Chip } from '../components/UI';
import { ClockIcon } from '../components/Icons';
import { colors, type, fonts, spacing, radius } from '../theme/theme';
import { generateWorkout } from '../services/workoutGenerator';
import { FadeInView, PressableScale } from '../motion/AnimatedComponents';
import { stagger } from '../motion/motion';

const DOW_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CAP = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function WorkoutScreen({ route }) {
  const prefs = route?.params?.prefs || { goal: 'strength', experience: 'intermediate', duration: 45 };
  const slot = route?.params?.slot || { weekday: DOW_FULL[(new Date().getDay() + 6) % 7], hour: 17 };

  const [applied, setApplied] = useState(false);
  const workout = useMemo(() => generateWorkout(prefs, slot), [prefs, slot]);

  const exercises = useMemo(() => {
    if (applied && workout.swap) {
      return workout.exercises.map((e) =>
        e.id === workout.swap.from.id
          ? { ...workout.swap.to, sets: e.sets, reps: e.reps, rest: e.rest, display: e.display }
          : e
      );
    }
    return workout.exercises;
  }, [workout, applied]);

  return (
    <Screen>
      <View style={{ height: spacing.xl }} />
      <View style={styles.topRow}>
        <View style={{ flex: 1, paddingRight: spacing.lg }}>
          <Label>Recommended for you</Label>
          <Text style={[type.h1, { marginTop: 6 }]}>{workout.templateName}</Text>
        </View>
        <View style={styles.durRing}>
          <ClockIcon size={13} color={colors.purple} strokeWidth={2} />
          <Text style={styles.durNum}>{workout.duration}</Text>
          <Text style={styles.durUnit}>MIN</Text>
        </View>
      </View>

      <Text style={[type.body, { marginTop: 8 }]}>
        Built for your {workout.duration}-minute window and today's equipment outlook.
      </Text>

      {/* tags */}
      <View style={styles.tags}>
        <Chip label={`${exercises.length} exercises`} />
        <Chip label={CAP(workout.experience)} />
        <Chip label={CAP(workout.goal.replace(/_/g, ' '))} />
      </View>

      <Divider />

      {/* exercise list */}
      {exercises.map((ex, idx) => (
        <FadeInView key={ex.id + idx} delay={stagger(idx)}>
          <View style={styles.exRow}>
            <Text style={styles.exIndex}>{String(idx + 1).padStart(2, '0')}</Text>
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>{ex.name}</Text>
              <Text style={[type.small, { marginTop: 4 }]}>{ex.display}</Text>
            </View>
          </View>
          <Divider style={{ marginVertical: spacing.lg }} />
        </FadeInView>
      ))}

      {/* swap suggestion */}
      {workout.swap ? (
        <FadeInView delay={stagger(exercises.length)} style={styles.swapRow}>
          <View style={styles.swapIcon}>
            <Text style={styles.swapGlyph}>↗</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.bodyInk, { fontWeight: '700' }]}>
              {applied ? 'Swap applied' : workout.swap.title}
            </Text>
            <Text style={type.small}>
              {applied
                ? `Now using ${workout.swap.to.name.toLowerCase()} on less busy equipment.`
                : workout.swap.detail}
            </Text>
          </View>
          {!applied ? (
            <PressableScale onPress={() => setApplied(true)}>
              <Text style={styles.swapLink}>Use swap</Text>
            </PressableScale>
          ) : null}
        </FadeInView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  durRing: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5, borderColor: colors.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  durClock: { fontSize: 12, marginBottom: 1 },
  durNum: { fontFamily: fonts.serif, fontSize: 26, color: colors.purple, lineHeight: 28 },
  durUnit: { fontSize: 8, letterSpacing: 1, color: colors.purple, fontWeight: '700' },

  tags: { flexDirection: 'row', gap: 10, marginTop: spacing.xl, flexWrap: 'wrap' },

  exRow: { flexDirection: 'row', alignItems: 'flex-start' },
  exIndex: { width: 34, fontSize: 13, color: colors.purple, fontWeight: '700', marginTop: 6 },

  swapRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  swapIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.purple,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.lg,
  },
  swapGlyph: { color: '#fff', fontSize: 20, fontWeight: '700' },
  swapLink: { color: colors.purple, fontSize: 14, fontWeight: '700', marginLeft: spacing.md },
});
