import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import HeroCard from '../components/HeroCard';
import { Label, Divider, IconTile, Button } from '../components/UI';
import GymDropdown from '../components/GymDropdown';
import { colors, type, fonts, spacing, radius, shadow, waitMinutes } from '../theme/theme';
import { DEMO_GYM, getGymById } from '../data/gymData';
import predictor from '../services/occupancyPredictor';
import { getBestSlot, formatHour, explainSlot, setActiveGym } from '../services/recommendationEngine';
import storage from '../services/storageService';
import {
  getWeekSummary, getStreak, getNextWorkout, scheduleWorkout, completeWorkout,
} from '../services/workoutStore';
import { useAuth } from '../auth/AuthContext';
import { FadeInView, PressableScale, Pulse } from '../motion/AnimatedComponents';
import { ProgressBar } from '../motion/Progress';
import { stagger } from '../motion/motion';
import { generateWorkout } from '../services/workoutGenerator';
import AvailabilityGrid from '../components/AvailabilityGrid';
import BestTimeReveal from '../components/BestTimeReveal';
import { setNavHidden } from '../tracker/trackingState';

const DOW_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function greeting(h) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function initials(name) {
  if (!name) return 'Yo';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

// Pre-seed the grid with weekday afternoons (half-hour steps) so it isn't blank.
function defaultSelection() {
  const set = [];
  for (let day = 0; day < 5; day++) {
    for (let h = 16; h < 20; h += 0.5) set.push(`${day}-${h}`);
  }
  return set;
}

// Expand saved availability windows back into grid cell keys ("dayIdx-hour").
function windowsToCells(windows) {
  if (!Array.isArray(windows)) return [];
  const dayIdx = {
    Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6,
  };
  const cells = [];
  windows.forEach((w) => {
    const di = dayIdx[w.weekday];
    if (di == null) return;
    for (let h = w.start; h < w.end; h += 0.5) cells.push(`${di}-${h}`);
  });
  return cells;
}

function cellsToByDay(flat) {
  const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const byDay = {};
  (flat || []).forEach((k) => {
    const [di, h] = k.split('-');
    (byDay[DAY_FULL[Number(di)]] ||= []).push(Number(h));
  });
  return byDay;
}

export default function HomeScreen({ navigation, route }) {
  const prefs = route?.params?.prefs || { duration: 45 };
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const now = new Date();

  const firstName = (profile?.name || prefs?.name || 'Athlete').split(' ')[0];
  const todayIdx = (now.getDay() + 6) % 7;
  const weekday = DOW_FULL[todayIdx];

  const [availability, setAvailability] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [gym, setGym] = useState(DEMO_GYM);
  const [week, setWeek] = useState({ goal: 3, completed: 0, scheduled: 0, days: [] });
  const [streak, setStreak] = useState(0);
  const [next, setNext] = useState(null);


  // Grid selection for the first-run availability setup / editing.
  const [selection, setSelection] = useState(defaultSelection);
  const [byDay, setByDay] = useState(null);
  const [editing, setEditing] = useState(false); // re-editing availability
  const [gridH, setGridH] = useState(0); // measured height available for the grid

  // Synchronized "best time" reveal overlay.
  const [reveal, setReveal] = useState(null); // { slot, duration } | null

  // Reload habit data whenever Home regains focus (after scheduling/completing).
  const reload = useCallback(async () => {
    const savedPrefs = await storage.getUserPreferences();
    if (savedPrefs?.gymId) {
      setActiveGym(savedPrefs.gymId);
      setGym(getGymById(savedPrefs.gymId));
    }
    const [avail, summary, stk, nxt] = await Promise.all([
      storage.getAvailabilityWindows(),
      getWeekSummary(),
      getStreak(),
      getNextWorkout(),
    ]);
    setAvailability(avail);
    setWeek(summary);
    setStreak(stk);
    setNext(nxt);
    setLoaded(true);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  // Has the user set their availability yet?
  const needsAvailability = loaded && (!availability || availability.length === 0);

  // Hide the bottom nav during full-screen Home moments.
  const hideNav = needsAvailability || editing || !!reveal;
  useEffect(() => {
    setNavHidden('home-fullscreen', hideNav);
    return () => setNavHidden('home-fullscreen', false);
  }, [hideNav]);

  // Save the painted grid → availability windows, then show the recommendation.
  const saveAvailability = useCallback(async () => {
    const grouped = byDay || {};
    const windows = [];
    Object.entries(grouped).forEach(([wd, hours]) => {
      const sorted = [...hours].sort((a, b) => a - b);
      let runStart = null;
      let prev = null;
      sorted.forEach((h) => {
        if (runStart == null) { runStart = h; prev = h; }
        else if (h === prev + 0.5) { prev = h; }
        else { windows.push({ weekday: wd, start: runStart, end: prev + 0.5 }); runStart = h; prev = h; }
      });
      if (runStart != null) windows.push({ weekday: wd, start: runStart, end: prev + 0.5 });
    });
    if (windows.length === 0) {
      Alert.alert('Pick some times', 'Drag across a few hours you could work out.');
      return;
    }
    await storage.saveAvailabilityWindows(windows);
    // Compute the best slot from the fresh windows and play the reveal.
    const slot = getBestSlot(windows, []);
    setReveal({ slot, duration: prefs?.duration || 45 });
  }, [byDay, prefs]);

  // Called when the reveal animation finishes → load the normal Home view.
  const finishReveal = useCallback(async () => {
    setReveal(null);
    setEditing(false);
    await reload();
  }, [reload]);

  // Switch the selected gym → persist, re-point the engine, reload recommendation.
  const changeGym = useCallback(async (g) => {
    setActiveGym(g.id);
    setGym(g);
    const savedPrefs = (await storage.getUserPreferences()) || {};
    await storage.saveUserPreferences({ ...savedPrefs, gymId: g.id });
    await storage.saveSelectedGym(g);
    await reload();
  }, [reload]);

  // Open the grid pre-filled with the current availability so it can be edited.
  const editAvailability = useCallback(() => {
    const cells = windowsToCells(availability);
    const flat = cells;
    setSelection(flat.length ? flat : defaultSelection());
    setByDay(cellsToByDay(flat));
    setEditing(true);
  }, [availability]);

  // Best slot built around the user's real availability + lowest congestion.
  const best = useMemo(() => getBestSlot(availability, []), [availability]);
  const bestAvg = best ? Math.round(best.congestion * 100) : 32;
  const bestWait = best ? waitMinutes(best.congestion) : 3;
  const match = Math.max(70, 100 - bestAvg);
  const why = useMemo(() => explainSlot(best, availability), [best, availability]);

  const outlookHour = best?.hour ?? 17;
  const outlookWeekday = best?.weekday ?? weekday;
  const outlook = useMemo(() => {
    return DEMO_GYM.equipment.slice(0, 3).map((e) => {
      const p = predictor.predict(e.type, outlookWeekday, outlookHour);
      const likelyOpen = Math.max(0, Math.round(e.units * (1 - p.probability)));
      return { type: e.type, name: e.name, units: e.units, likelyOpen, busy: p.congestionLevel === 'high' };
    });
  }, [outlookWeekday, outlookHour]);

  const dateLabel = now
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();

  // Plan + schedule the recommended workout in one action.
  const planWorkout = useCallback(async () => {
    if (!best) return;
    const w = generateWorkout(prefs, { weekday: best.weekday, hour: best.hour });
    const res = await scheduleWorkout({
      weekday: best.weekday,
      hour: best.hour,
      templateName: w.templateName,
      duration: w.duration,
      exercises: w.exercises,
    });
    if (res.conflict) {
      Alert.alert('Already scheduled', "You've already got a workout at that time.");
      return;
    }
    await reload();
    navigation.navigate('Workout', { slot: best });
  }, [best, prefs, reload, navigation]);

  const markComplete = useCallback(async () => {
    if (!next) return;
    await completeWorkout(next.id);
    await reload();
    Alert.alert('Nice work 💪', 'Logged. Your weekly progress just moved.');
  }, [next, reload]);

  const goalMet = week.completed >= week.goal;

  // --- Synchronized reveal of the best time (the "magic moment") -----------
  if (reveal) {
    return (
      <View style={{ flex: 1 }}>
        <BestTimeReveal slot={reveal.slot} duration={reveal.duration} onDone={finishReveal} />
      </View>
    );
  }

  // --- Availability grid: first run OR editing (fits on one screen) --------
  if (needsAvailability || editing) {
    return (
      <View
        style={[
          styles.root,
          { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <View>
          <Label>{editing ? 'Edit availability' : `Welcome${profile?.name ? `, ${firstName}` : ''}`}</Label>
          <Text style={[type.h2, { marginTop: 4 }]}>When are you free?</Text>
          <Text style={[type.small, { marginTop: 4, marginBottom: spacing.sm }]}>
            Drag the hours you could train — we match them to {DEMO_GYM.name}'s quietest times.
          </Text>
        </View>

        {/* grid fills the space between header and button */}
        <View
          style={{ flex: 1, marginVertical: spacing.sm }}
          onLayout={(e) => setGridH(e.nativeEvent.layout.height)}
        >
          {gridH > 0 ? (
            <AvailabilityGrid
              value={selection}
              gridHeight={gridH}
              onChange={(flat, grouped) => { setSelection(flat); setByDay(grouped); }}
            />
          ) : null}
        </View>

        <View>
          <Button
            label={editing ? 'Update my schedule' : 'Build my optimal schedule'}
            icon="→"
            onPress={saveAvailability}
          />
          {editing ? (
            <>
              <View style={{ height: spacing.sm }} />
              <Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} />
            </>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
    >
      {/* hero — your best window */}
      <View style={{ height: screenH - insets.bottom - 56 }}>
        <HeroCard
          fillScreen
          initials={initials(profile?.name)}
          onPressProfile={() => navigation.navigate('Profile')}
          time={best ? formatHour(best.hour) : '5:30 PM'}
          duration={`${prefs.duration || 45} min`}
          fullPct={bestWait <= 1 ? 'No wait expected' : `~${bestWait} min wait`}
          match={match}
          ctaLabel="Plan my workout"
          footer={best ? `BEST ON ${best.weekday.toUpperCase()}` : 'REPSIN'}
          onPress={planWorkout}
        />
      </View>

      {/* greeting + why */}
      <FadeInView delay={stagger(0)} style={{ marginTop: spacing.xxl, paddingHorizontal: spacing.xl }}>
        <Label>{dateLabel}</Label>
        <Text style={[type.display, styles.greet]}>{greeting(now.getHours())}, {firstName}.</Text>
        {why ? <Text style={type.body}>{why}</Text> : null}

        {/* prominent gym switcher — dropdown */}
        <GymDropdown gym={gym} onSelect={changeGym} style={{ marginTop: spacing.lg }} />
      </FadeInView>

      {/* next workout card (if scheduled) */}
      {next ? (
        <FadeInView delay={stagger(1)} style={{ marginTop: spacing.xxl, paddingHorizontal: spacing.xl }}>
          <Label>Next workout</Label>
          <View style={styles.nextCard}>
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>{next.templateName}</Text>
              <Text style={type.small}>
                {next.weekday} · {formatHour(next.hour)} · {next.duration} min
              </Text>
            </View>
            <Button label="Mark done" variant="light" onPress={markComplete} />
          </View>
        </FadeInView>
      ) : null}

      {/* week strip — data-driven */}
      <FadeInView delay={stagger(2)} style={{ marginTop: spacing.xxl, paddingHorizontal: spacing.xl }}>
        <View style={styles.weekHead}>
          <Label>Your week</Label>
          <Pulse trigger={streak} style={styles.streakChip}>
            <Text style={styles.streakText}>🔥 {streak} wk streak</Text>
          </Pulse>
        </View>
        <Text style={type.h1}>{goalMet ? 'Goal hit — nice.' : 'Keep the rhythm going'}</Text>
        <Text style={[type.labelMuted, { marginBottom: spacing.lg }]}>
          {week.completed} of {week.goal} complete
        </Text>

        <View style={styles.weekRow}>
          {week.days.map((d, i) => (
            <View key={i} style={styles.dayCol}>
              <Text style={styles.dayLetter}>{d.letter}</Text>
              <View
                style={[
                  styles.dayCircle,
                  d.status === 'completed' && styles.dayDone,
                  d.status === 'today' && styles.dayToday,
                  d.status === 'scheduled' && styles.daySched,
                  d.status === 'missed' && styles.dayMissed,
                ]}
              >
                {d.status === 'completed' ? (
                  <Text style={styles.dayCheck}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.dayNum,
                      (d.status === 'today' || d.status === 'scheduled') && styles.dayNumToday,
                    ]}
                  >
                    {d.dateNum}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
        <ProgressBar value={week.goal ? week.completed / week.goal : 0} height={4} />
        <View style={styles.weekLinks}>
          <PressableScale onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.viewLink}>View history →</Text>
          </PressableScale>
          <PressableScale onPress={editAvailability}>
            <Text style={styles.viewLink}>Edit availability →</Text>
          </PressableScale>
        </View>
      </FadeInView>

      {/* equipment outlook */}
      <FadeInView delay={stagger(3)} style={{ paddingHorizontal: spacing.xl }}>
        <Divider style={{ marginVertical: spacing.xxl }} />
        <Label>Equipment outlook</Label>
        <View style={styles.outlookHead}>
          <Text style={type.h1}>What you'll need</Text>
          <PressableScale onPress={() => navigation.navigate('Forecast')}>
            <Text style={styles.viewLink}>View forecast →</Text>
          </PressableScale>
        </View>

        <View style={{ marginTop: spacing.lg }}>
          {outlook.map((item, idx) => (
            <FadeInView key={`${item.type}-${idx}`} delay={stagger(4 + idx)}>
              <View style={styles.equipRow}>
                <IconTile glyph={item.type.includes('cable') ? 'circle' : 'square'} />
                <View style={styles.equipMid}>
                  <Text style={type.h3}>{item.name}</Text>
                  <Text style={type.small}>{item.likelyOpen} of {item.units} likely open</Text>
                </View>
                <Text style={[styles.statusText, item.busy ? styles.statusBusy : styles.statusOpen]}>
                  {item.busy ? 'Busy' : 'Open'}
                </Text>
              </View>
              {idx < outlook.length - 1 ? <Divider style={{ marginVertical: spacing.lg }} /> : null}
            </FadeInView>
          ))}
        </View>
      </FadeInView>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  locPin: { fontSize: 13, marginRight: 6 },
  locText: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  locCaret: { fontSize: 18, color: colors.inkSoft, marginLeft: 6 },

  greet: { marginTop: 6, marginBottom: 8 },

  nextCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginTop: spacing.md, ...shadow.card,
  },

  weekHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  streakChip: {
    backgroundColor: colors.purpleSoft, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  streakText: { color: colors.purple, fontWeight: '700', fontSize: 13 },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  dayCol: { alignItems: 'center' },
  dayLetter: { fontSize: 13, color: colors.inkSoft, fontWeight: '600', marginBottom: 10 },
  dayCircle: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDone: { backgroundColor: colors.low, borderColor: colors.low },
  dayToday: { backgroundColor: colors.purple, borderColor: colors.purple },
  daySched: { backgroundColor: colors.purpleBright, borderColor: colors.purpleBright, opacity: 0.6 },
  dayMissed: { backgroundColor: 'transparent', borderColor: colors.moderate, borderStyle: 'dashed' },
  dayCheck: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dayNum: { fontSize: 14, color: colors.inkSoft, fontWeight: '600' },
  dayNumToday: { color: '#fff', fontWeight: '700' },

  outlookHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  viewLink: { color: colors.purple, fontSize: 14, fontWeight: '700' },
  weekLinks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },

  equipRow: { flexDirection: 'row', alignItems: 'center' },
  equipMid: { flex: 1, marginLeft: spacing.lg },
  statusText: { fontSize: 14, fontWeight: '700' },
  statusOpen: { color: colors.low },
  statusSoon: { color: colors.moderate },
  statusBusy: { color: colors.high },
});
