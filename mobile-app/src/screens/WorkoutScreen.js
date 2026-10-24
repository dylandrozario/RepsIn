import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import { Label, Divider, Chip } from '../components/UI';
import { colors, type, fonts, spacing, radius, shadow } from '../theme/theme';
import { generateWorkout } from '../services/workoutGenerator';
import { FadeInView, PressableScale } from '../motion/AnimatedComponents';
import { stagger } from '../motion/motion';
import { FITNESS_GOALS } from '../data/gymData';
import storage from '../services/storageService';

const DOW_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CAP = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const TOP_N = 3; // first N exercises are the "most recommended"

export default function WorkoutScreen({ route }) {
  const slot = route?.params?.slot || { weekday: DOW_FULL[(new Date().getDay() + 6) % 7], hour: 17 };

  // Prefs loaded from storage (the onboarding form), refreshed on focus so
  // the recommendation always reflects the user's actual choices.
  const [prefs, setPrefs] = useState(route?.params?.prefs || null);
  const [goalOverride, setGoalOverride] = useState(null); // user can try other goals here
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let on = true;
      (async () => {
        const saved = await storage.getUserPreferences();
        if (on && saved) setPrefs(saved);
      })();
      return () => { on = false; };
    }, [])
  );

  // Effective goal = the override (if the user picked one here) or their saved goal.
  const effGoal = goalOverride || prefs?.goal || 'general_fitness';
  const effPrefs = { ...(prefs || {}), goal: effGoal };

  const workout = useMemo(
    () => generateWorkout(effPrefs, slot),
    [effGoal, prefs?.experience, prefs?.duration, slot]
  );

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

  const currentGoal = FITNESS_GOALS.find((g) => g.id === effGoal);

  const pickGoal = (id) => {
    setGoalOverride(id);
    setGoalPickerOpen(false);
    setApplied(false);
  };

  return (
    <Screen>
      <View style={{ height: spacing.xl }} />
      <View style={styles.topRow}>
        <View style={{ flex: 1, paddingRight: spacing.lg }}>
          <Label>Recommended for you</Label>
          <Text style={[type.h1, { marginTop: 6 }]}>{workout.templateName}</Text>
        </View>
        <View style={styles.durRing}>
          <Text style={styles.durNum}>{workout.duration}</Text>
          <Text style={styles.durUnit}>MIN</Text>
        </View>
      </View>

      <Text style={[type.body, { marginTop: 8 }]}>
        Built from your {CAP(workout.experience)} level and {workout.duration}-minute sessions.
      </Text>

      {/* goal dropdown — changes the recommendation */}
      <Label muted style={{ marginTop: spacing.xl }}>Training goal</Label>
      <PressableScale style={styles.goalCard} onPress={() => setGoalPickerOpen((o) => !o)}>
        <Text style={styles.goalEmoji}>{currentGoal?.icon}</Text>
        <Text style={styles.goalName}>{currentGoal?.label}</Text>
        <Text style={[styles.goalCaret, goalPickerOpen && { color: colors.purple }]}>⌄</Text>
      </PressableScale>

      {goalPickerOpen ? (
        <View style={styles.dropdown}>
          {FITNESS_GOALS.map((g, i) => {
            const sel = g.id === effGoal;
            return (
              <PressableScale
                key={g.id}
                onPress={() => pickGoal(g.id)}
                style={[styles.ddRow, i < FITNESS_GOALS.length - 1 && styles.ddRowBorder, sel && styles.ddRowSel]}
              >
                <Text style={styles.goalEmoji}>{g.icon}</Text>
                <Text style={[type.bodyInk, { flex: 1 }, sel && { color: colors.purple, fontWeight: '700' }]}>
                  {g.label}
                </Text>
                {sel ? <Text style={styles.ddCheck}>✓</Text> : null}
              </PressableScale>
            );
          })}
        </View>
      ) : null}

      {goalOverride && goalOverride !== prefs?.goal ? (
        <Text style={[type.small, { marginTop: spacing.sm, color: colors.purple }]}>
          Previewing a different goal · your saved goal is {FITNESS_GOALS.find((g) => g.id === prefs?.goal)?.label}
        </Text>
      ) : null}

      {/* tags */}
      <View style={styles.tags}>
        <Chip label={`${exercises.length} exercises`} />
        <Chip label={CAP(workout.experience)} />
        <Chip label={CAP(effGoal.replace(/_/g, ' '))} />
      </View>

      <Divider />

      {/* exercise list — first TOP_N tagged "Most recommended" */}
      {exercises.map((ex, idx) => (
        <FadeInView key={ex.id + idx} delay={stagger(idx)}>
          <View style={styles.exRow}>
            <Text style={styles.exIndex}>{String(idx + 1).padStart(2, '0')}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.exNameRow}>
                <Text style={type.h3}>{ex.name}</Text>
                {idx < TOP_N ? (
                  <View style={styles.topTag}>
                    <Text style={styles.topTagText}>★ Top pick</Text>
                  </View>
                ) : null}
              </View>
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
  durNum: { fontFamily: fonts.serif, fontSize: 26, color: colors.purple, lineHeight: 28 },
  durUnit: { fontSize: 8, letterSpacing: 1, color: colors.purple, fontWeight: '700' },

  goalCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.lg, marginTop: spacing.sm, ...shadow.card,
  },
  goalEmoji: { fontSize: 20, marginRight: spacing.md },
  goalName: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.ink },
  goalCaret: { fontSize: 20, color: colors.inkSoft, fontWeight: '700', paddingHorizontal: 4 },

  dropdown: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    marginTop: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, ...shadow.card,
  },
  ddRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  ddRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairlineSoft },
  ddRowSel: { backgroundColor: colors.purpleSoft, borderRadius: radius.md },
  ddCheck: { color: colors.purple, fontWeight: '800', fontSize: 16, marginLeft: spacing.sm },

  tags: { flexDirection: 'row', gap: 10, marginTop: spacing.xl, flexWrap: 'wrap' },

  exRow: { flexDirection: 'row', alignItems: 'flex-start' },
  exIndex: { width: 34, fontSize: 13, color: colors.purple, fontWeight: '700', marginTop: 6 },
  exNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  topTag: {
    backgroundColor: colors.purpleSoft, borderRadius: radius.pill,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  topTagText: { color: colors.purple, fontSize: 11, fontWeight: '700' },

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
