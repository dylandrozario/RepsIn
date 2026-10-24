import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import { Label, Divider, Chip } from '../components/UI';
import { colors, type, fonts, spacing, radius, shadow } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useSession } from '../context/SessionContext';
import { openUnitCount } from '../data/gymData';
import { generateWorkout } from '../services/workoutGenerator';
import storage from '../services/storageService';

const DOW_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CAP = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Height the floating tab bar occupies above the safe-area inset
// (tab bar: ~56px tall + 8px gap). The session action bar sits above this.
const TAB_BAR_CLEARANCE = 72;

/** Stepper for rep counts. */
function Stepper({ value, onChange, min = 0, max = 99, accent }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 1))}>
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={[styles.stepVal, { color: accent }]}>{value}</Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + 1))}>
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

export default function WorkoutScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const {
    activeMachine, logSetOnActive, addSetsToActive, checkOut, finishSession,
  } = useSession();

  const prefs = route?.params?.prefs || { goal: 'strength', experience: 'intermediate', duration: 45 };
  const slot = route?.params?.slot || { weekday: DOW_FULL[(new Date().getDay() + 6) % 7], hour: 17 };

  // Logged sets for the CURRENT machine session (reset when machine changes).
  const [loggedSets, setLoggedSets] = useState([]); // [{ reps }]
  const [repInput, setRepInput] = useState(10);

  // Reset the log whenever we start a new machine session.
  useEffect(() => {
    setLoggedSets([]);
    setRepInput(10);
  }, [activeMachine?.id, route?.params?.ts]);

  const myUnit = activeMachine?.units.find((u) => u.isMe) || null;

  const logOneSet = useCallback(() => {
    setLoggedSets((prev) => [...prev, { reps: repInput }]);
    logSetOnActive();
  }, [repInput, logSetOnActive]);

  const finishMachine = useCallback(async () => {
    const machineName = activeMachine?.name || 'Machine';
    const entry = {
      id: `w-${Date.now()}`,
      date: new Date().toISOString(),
      templateName: `${machineName} session`,
      machine: machineName,
      exercises: [{ name: machineName, sets: loggedSets.map((s) => s.reps) }],
      totalSets: loggedSets.length,
    };
    try {
      const existing = await storage.getCompletedWorkouts();
      await storage.saveCompletedWorkouts([entry, ...existing]);
    } catch (e) { /* non-fatal */ }
    finishSession(); // frees the machine AND credits the matching plan exercise
    Alert.alert(
      'Session saved',
      `Logged ${loggedSets.length} set${loggedSets.length !== 1 ? 's' : ''} on ${machineName}. Machine freed for the next person. 💪`,
      [{ text: 'Done' }]
    );
    setLoggedSets([]);
  }, [activeMachine, loggedSets, finishSession]);

  // ─────────────────── ACTIVE MACHINE SESSION (priority view) ───────────────────
  if (activeMachine && myUnit) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ height: insets.top + spacing.md }} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + 210 }}
        >
          <Label>Current machine</Label>
          <Text style={[type.h1, { marginTop: 6 }]}>{activeMachine.name}</Text>
          <Text style={[type.body, { marginTop: 6 }]}>
            You're checked in. Log each set as you go, then finish to free the machine.
          </Text>

          {/* Session card */}
          <View style={[styles.liveCard, shadow.card, { marginTop: spacing.xl }]}>
            <View style={styles.sessionTop}>
              <View>
                <Text style={styles.sessionLabel}>Sets remaining</Text>
                <Text style={[styles.sessionBig, { color: theme.accent }]}>{myUnit.setsLeft}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.sessionLabel}>Logged</Text>
                <Text style={[styles.sessionBig, { color: colors.ink }]}>{loggedSets.length}</Text>
              </View>
            </View>

            {/* Adjust planned sets */}
            <Divider style={{ marginVertical: spacing.lg }} />
            <Text style={[type.labelMuted, { marginBottom: spacing.sm }]}>Adjust sets remaining</Text>
            <View style={styles.adjustRow}>
              <Pressable style={styles.adjBtn} onPress={() => addSetsToActive(-1)}>
                <Text style={styles.adjBtnText}>− Set</Text>
              </Pressable>
              <Pressable style={styles.adjBtn} onPress={() => addSetsToActive(1)}>
                <Text style={styles.adjBtnText}>+ Set</Text>
              </Pressable>
            </View>

            {/* Log a set with reps */}
            <Divider style={{ marginVertical: spacing.lg }} />
            <Text style={[type.labelMuted, { marginBottom: spacing.sm }]}>Reps this set</Text>
            <Stepper value={repInput} onChange={setRepInput} min={1} max={50} accent={theme.accent} />
            <Pressable
              style={[styles.logBtn, { backgroundColor: theme.accent }]}
              onPress={logOneSet}
            >
              <Text style={styles.logBtnText}>Log set · {repInput} reps</Text>
            </Pressable>

            {/* Logged history */}
            {loggedSets.length > 0 && (
              <View style={{ marginTop: spacing.lg }}>
                <Text style={[type.labelMuted, { marginBottom: spacing.sm }]}>This session</Text>
                <View style={styles.loggedWrap}>
                  {loggedSets.map((s, i) => (
                    <View key={i} style={[styles.loggedChip, { borderColor: theme.accent }]}>
                      <Text style={[styles.loggedChipText, { color: theme.accent }]}>
                        Set {i + 1}: {s.reps}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <Text style={[type.small, { marginTop: spacing.lg, textAlign: 'center' }]}>
            Others can see your progress on the Live Floor.
          </Text>
        </ScrollView>

        {/* Bottom bar — sits ABOVE the floating tab bar so buttons aren't blocked */}
        <View style={[styles.bottomBar, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}>
          <Pressable
            style={styles.cancelBtn}
            onPress={() => Alert.alert('Leave machine?', 'This frees the machine without saving your session.', [
              { text: 'Keep going', style: 'cancel' },
              { text: 'Leave', style: 'destructive', onPress: () => { checkOut(); setLoggedSets([]); } },
            ])}
          >
            <Text style={styles.cancelBtnText}>Leave</Text>
          </Pressable>
          <Pressable style={[styles.finishBtn, { backgroundColor: theme.accent }]} onPress={finishMachine}>
            <Text style={styles.finishBtnText}>Finish & Free Machine</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─────────────────── NO ACTIVE MACHINE → plan view ───────────────────
  return <PlanView prefs={prefs} slot={slot} navigation={navigation} theme={theme} />;
}

/** The recommended-workout plan shown when you're not checked into a machine. */
function PlanView({ prefs, slot, navigation, theme }) {
  const { floor, plan, ensurePlan, resetPlan, promotePlanSecond } = useSession();

  // Memoize the generated workout on PRIMITIVES so its identity is stable.
  const goal = prefs?.goal, experience = prefs?.experience, duration = prefs?.duration;
  const weekday = slot?.weekday, hour = slot?.hour;
  const workout = useMemo(
    () => generateWorkout({ goal, experience, duration }, { weekday, hour }),
    [goal, experience, duration, weekday, hour]
  );

  // Ensure the persistent plan exists for this generated workout. ensurePlan
  // only rebuilds when the exercise signature changes, so completion survives.
  useEffect(() => {
    ensurePlan(workout.exercises);
  }, [workout, ensurePlan]);

  // How many open machines exist right now for a given exercise's equipment type.
  const openForEquipment = useCallback((equipment) => {
    return floor
      .filter((g) => g.predictType === equipment)
      .reduce((sum, g) => sum + openUnitCount(g), 0);
  }, [floor]);

  const order = plan || [];
  const pending = order.filter((e) => !e.done);
  const completed = order.filter((e) => e.done);
  const nextUp = pending[0] || null;
  const secondUp = pending[1] || null;

  const nextOpen = nextUp ? openForEquipment(nextUp.equipment) : 1;
  const secondOpen = secondUp ? openForEquipment(secondUp.equipment) : 0;
  const recommendSwap = !!(nextUp && secondUp && nextOpen === 0 && secondOpen > 0);

  const promoteSecond = promotePlanSecond;
  const doReset = useCallback(() => resetPlan(workout.exercises), [resetPlan, workout]);

  return (
    <Screen>
      <View style={{ height: spacing.xl }} />
      <View style={styles.topRow}>
        <View style={{ flex: 1, paddingRight: spacing.lg }}>
          <Label>Your plan</Label>
          <Text style={[type.h1, { marginTop: 6 }]}>{workout.templateName}</Text>
        </View>
        <View style={[styles.durRing, { borderColor: theme.accent }]}>
          <Text style={styles.durClock}>🕐</Text>
          <Text style={[styles.durNum, { color: theme.accent }]}>{workout.duration}</Text>
          <Text style={[styles.durUnit, { color: theme.accent }]}>MIN</Text>
        </View>
      </View>

      <View style={styles.tags}>
        <Chip label={`${pending.length} left`} />
        <Chip label={`${completed.length} done`} />
        <Chip label={CAP(workout.goal.replace(/_/g, ' '))} />
      </View>

      <Divider />

      {/* ── NEXT UP ── */}
      {!plan ? (
        <View style={{ paddingVertical: spacing.xl }}>
          <Text style={type.small}>Loading your plan…</Text>
        </View>
      ) : nextUp ? (
        <>
          <Label>Next up</Label>
          <View style={[styles.nextCard, shadow.card, { borderColor: theme.accent }]}>
            <View style={styles.nextTopRow}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={styles.nextName}>{nextUp.name}</Text>
                <Text style={[type.small, { marginTop: 4 }]}>{nextUp.display}</Text>
              </View>
              {/* live availability pill for this exercise's equipment */}
              <View style={[
                styles.availPill,
                { backgroundColor: nextOpen > 0 ? '#DCFCE7' : '#FEE2E2' },
              ]}>
                <Text style={[styles.availPillText, { color: nextOpen > 0 ? colors.low : colors.high }]}>
                  {nextOpen > 0 ? `${nextOpen} open` : 'All taken'}
                </Text>
              </View>
            </View>

            {/* Reorder recommendation when next-up is fully taken */}
            {recommendSwap && (
              <View style={styles.recBox}>
                <Text style={styles.recTitle}>💡 {nextUp.name} is fully taken</Text>
                <Text style={styles.recText}>
                  {secondUp.name} has {secondOpen} machine{secondOpen !== 1 ? 's' : ''} open — do it
                  next and come back to {nextUp.name}.
                </Text>
                <Pressable style={[styles.recBtn, { backgroundColor: theme.accent }]} onPress={promoteSecond}>
                  <Text style={styles.recBtnText}>Move {secondUp.name} up</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={[styles.completeBtn, { backgroundColor: nextOpen > 0 ? theme.accent : colors.hairline }]}
              onPress={() => navigation.navigate('Availability')}
            >
              <Text style={styles.completeBtnText}>
                {nextOpen > 0 ? 'Check in on the floor →' : 'See the floor →'}
              </Text>
            </Pressable>
            <Text style={styles.completeHint}>
              Finish a {nextUp.name} session on the floor to complete this.
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.allDoneCard}>
          <Text style={styles.allDoneEmoji}>🎉</Text>
          <Text style={styles.allDoneTitle}>Plan complete!</Text>
          <Text style={type.small}>You finished every exercise. Nice work.</Text>
          <Pressable style={[styles.completeBtn, { backgroundColor: theme.accent, marginTop: spacing.lg }]} onPress={doReset}>
            <Text style={styles.completeBtnText}>Reset Plan</Text>
          </Pressable>
        </View>
      )}

      {/* ── UP NEXT (rest of the pending stack) ── */}
      {pending.length > 1 && (
        <>
          <Label style={{ marginTop: spacing.xl }}>Coming up</Label>
          {pending.slice(1).map((ex, idx) => {
            const open = openForEquipment(ex.equipment);
            return (
              <View key={ex.uid} style={styles.queueExRow}>
                <Text style={[styles.exIndex, { color: colors.inkFaint }]}>{String(idx + 2).padStart(2, '0')}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={type.h3}>{ex.name}</Text>
                  <Text style={[type.small, { marginTop: 2 }]}>{ex.display}</Text>
                </View>
                <Text style={[styles.miniAvail, { color: open > 0 ? colors.low : colors.high }]}>
                  {open > 0 ? `${open} open` : 'taken'}
                </Text>
              </View>
            );
          })}
        </>
      )}

      {/* ── COMPLETED (bottom of stack) ── */}
      {completed.length > 0 && (
        <>
          <Label style={{ marginTop: spacing.xl }}>Completed</Label>
          {completed.map((ex) => (
            <View key={ex.uid} style={styles.doneRow}>
              <Text style={[styles.doneCheck, { color: colors.low }]}>✓</Text>
              <Text style={[type.h3, styles.doneName]}>{ex.name}</Text>
            </View>
          ))}
        </>
      )}

      <Pressable style={[styles.startBtn, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('Availability')}>
        <Text style={styles.startBtnText}>Go to Live Floor →</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  durRing: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  durClock: { fontSize: 12, marginBottom: 1 },
  durNum: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 28 },
  durUnit: { fontSize: 8, letterSpacing: 1, fontWeight: '700' },

  tags: { flexDirection: 'row', gap: 10, marginTop: spacing.xl, flexWrap: 'wrap' },

  exRow: { flexDirection: 'row', alignItems: 'flex-start' },
  exIndex: { width: 34, fontSize: 13, fontWeight: '700', marginTop: 6 },

  swapRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  swapIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.lg,
  },
  swapGlyph: { color: '#fff', fontSize: 20, fontWeight: '700' },
  swapLink: { fontSize: 14, fontWeight: '700', marginLeft: spacing.md },

  startBtn: { marginTop: spacing.xl, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Next-up card
  nextCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1.5, padding: spacing.xl, marginTop: spacing.sm,
  },
  nextTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  nextName: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 30, color: colors.ink },
  availPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill },
  availPillText: { fontSize: 11, fontWeight: '800' },

  recBox: {
    marginTop: spacing.lg, padding: spacing.md,
    backgroundColor: '#FFF7ED', borderRadius: radius.md,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  recTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  recText: { fontSize: 12, color: colors.inkSoft, lineHeight: 18, marginTop: 3, marginBottom: spacing.sm },
  recBtn: { borderRadius: radius.pill, paddingVertical: 10, alignItems: 'center' },
  recBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  completeBtn: { marginTop: spacing.lg, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center' },
  completeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  completeHint: { fontSize: 12, color: colors.inkSoft, textAlign: 'center', marginTop: spacing.sm },

  queueExRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  miniAvail: { fontSize: 12, fontWeight: '700', marginLeft: spacing.sm },

  doneRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  doneCheck: { fontSize: 16, fontWeight: '800', width: 28 },
  doneName: { color: colors.inkFaint, textDecorationLine: 'line-through' },

  allDoneCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.hairline,
    padding: spacing.xl, alignItems: 'center', marginTop: spacing.sm,
  },
  allDoneEmoji: { fontSize: 44, marginBottom: spacing.sm },
  allDoneTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink, marginBottom: 2 },

  // Live machine session
  liveCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.hairline,
  },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sessionLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1, color: colors.inkFaint, textTransform: 'uppercase' },
  sessionBig: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 50, marginTop: 2 },

  adjustRow: { flexDirection: 'row', gap: spacing.md },
  adjBtn: {
    flex: 1, paddingVertical: 11, borderRadius: radius.pill,
    backgroundColor: colors.cardSunken, borderWidth: 1, borderColor: colors.hairline,
    alignItems: 'center',
  },
  adjBtnText: { fontSize: 14, fontWeight: '700', color: colors.ink },

  stepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xl, marginTop: spacing.md,
  },
  stepBtn: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 1.5, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSunken,
  },
  stepBtnText: { fontSize: 24, color: colors.ink, lineHeight: 28 },
  stepVal: { fontSize: 44, fontWeight: '800', minWidth: 60, textAlign: 'center', lineHeight: 50 },

  logBtn: { marginTop: spacing.md, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center' },
  logBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  loggedWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  loggedChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1.5 },
  loggedChipText: { fontSize: 12, fontWeight: '700' },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, // `bottom` set inline to clear tab bar
    flexDirection: 'row', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline,
  },
  cancelBtn: {
    paddingVertical: 15, paddingHorizontal: 22, borderRadius: radius.pill,
    backgroundColor: colors.cardSunken, borderWidth: 1, borderColor: colors.hairline,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: colors.inkSoft },
  finishBtn: { flex: 1, paddingVertical: 15, borderRadius: radius.pill, alignItems: 'center' },
  finishBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
