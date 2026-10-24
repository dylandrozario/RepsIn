import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import Screen from '../components/Screen';
import SkyArc from '../components/SkyArc';
import { Label, Divider } from '../components/UI';
import { ProgressBar } from '../motion/Progress';
import { AnimatedCounter, PressableScale } from '../motion/AnimatedComponents';
import GymDropdown from '../components/GymDropdown';
import { colors, type, fonts, spacing } from '../theme/theme';
import { DEMO_GYM, getGymById } from '../data/gymData';
import predictor from '../services/occupancyPredictor';
import { averageCongestion, congestionLevelFor, formatHour, getActiveGym, setActiveGym } from '../services/recommendationEngine';
import { congestionColor, waitLevelLabel, waitMinutes } from '../theme/theme';
import storage from '../services/storageService';

const DOW_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Constrain the time control so it isn't edge-to-edge.
const SLIDER_W = Math.min(320, Dimensions.get('window').width - 80);

const DOW_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ForecastScreen() {
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;
  const [dayIdx, setDayIdx] = useState(todayIdx);
  const weekday = DOW_FULL[dayIdx];
  const [selected, setSelected] = useState(18.5); // 6:30 PM default like the mock
  const [gym, setGym] = useState(getActiveGym() || DEMO_GYM);

  // Load the saved gym on mount so Forecast reflects the user's selection.
  useEffect(() => {
    (async () => {
      const prefs = await storage.getUserPreferences();
      if (prefs?.gymId) {
        setActiveGym(prefs.gymId);
        setGym(getGymById(prefs.gymId));
      }
    })();
  }, []);

  const changeGym = useCallback(async (g) => {
    setActiveGym(g.id);
    setGym(g);
    const prefs = (await storage.getUserPreferences()) || {};
    await storage.saveUserPreferences({ ...prefs, gymId: g.id });
    await storage.saveSelectedGym(g);
  }, []);

  const lookupHour = Math.round(selected);
  // Estimated average wait (minutes) across all equipment at the selected time.
  // gym.id is a dependency so values recompute when the gym switches.
  const overallWait = useMemo(
    () => waitMinutes(averageCongestion(weekday, lookupHour)),
    [weekday, lookupHour, gym.id]
  );

  const rows = useMemo(() => {
    return gym.equipment.map((e) => {
      const p = predictor.predict(e.type, weekday, lookupHour);
      return {
        type: e.type,
        name: e.name,
        prob: p.probability,
        level: p.congestionLevel,
        wait: waitMinutes(p.probability),
      };
    }).sort((a, b) => b.prob - a.prob);
  }, [weekday, lookupHour, gym.id]);

  return (
    <Screen>
      <View style={{ height: spacing.xl }} />
      <GymDropdown gym={gym} onSelect={changeGym} style={{ marginBottom: spacing.lg }} />
      <Text style={[type.h1, { marginTop: 6 }]}>Equipment wait times</Text>
      <Text style={[type.body, { marginTop: 6 }]}>
        See how long you'd likely wait for each piece of equipment through the day.
      </Text>

      {/* day-of-week dot buttons */}
      <View style={styles.dayHeadRow}>
        <Label muted>Day</Label>
        <Text style={styles.dayNameLabel}>
          {weekday}{dayIdx === todayIdx ? ' · Today' : ''}
        </Text>
      </View>
      <View style={styles.dayRow}>
        {DOW_LETTERS.map((letter, i) => {
          const active = i === dayIdx;
          const isToday = i === todayIdx;
          return (
            <PressableScale
              key={i}
              onPress={() => setDayIdx(i)}
              style={styles.dayDotCol}
              accessibilityLabel={DOW_FULL[i]}
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.dayDot, active && styles.dayDotActive]}>
                <Text style={[styles.dayDotText, active && styles.dayDotTextActive]}>{letter}</Text>
              </View>
              {isToday ? <View style={styles.todayMark} /> : <View style={styles.todayMarkEmpty} />}
            </PressableScale>
          );
        })}
      </View>

      <Divider />

      {/* selected time + overall wait */}
      <View style={styles.timeHead}>
        <View>
          <Label muted>Selected time</Label>
          <Text style={[styles.bigTime]}>{formatHour(selected)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AnimatedCounter
            value={overallWait}
            style={styles.overallPct}
            format={(n) => (Math.round(n) <= 1 ? '0' : `${Math.round(n)}`)}
          />
          <Text style={type.small}>min avg wait</Text>
        </View>
      </View>

      {/* sun/moon sky arc + time slider */}
      <View style={styles.timeControl}>
        <SkyArc hour={selected} width={SLIDER_W} />
        <Slider
          style={{ width: SLIDER_W, height: 40, marginTop: spacing.md }}
          minimumValue={6}
          maximumValue={22}
          step={0.5}
          value={selected}
          onValueChange={setSelected}
          minimumTrackTintColor={colors.purple}
          maximumTrackTintColor={colors.track}
          thumbTintColor={colors.purple}
        />
        <View style={[styles.sliderLabels, { width: SLIDER_W }]}>
          <Text style={styles.sliderEnd}>{formatHour(6)}</Text>
          <Text style={styles.sliderEnd}>{formatHour(22)}</Text>
        </View>
      </View>

      <Divider />

      {/* per-equipment rows */}
      {rows.map((r, idx) => (
        <View key={`${r.type}-${idx}`}>
          <View style={styles.eqRow}>
            <View style={styles.eqLeft}>
              <Text style={type.h3}>{r.name}</Text>
              <Text style={[type.small, { color: congestionColor(r.level) }]}>{waitLevelLabel(r.level)}</Text>
            </View>
            <View style={styles.eqRight}>
              <ProgressBar value={r.prob} width={140} color={congestionColor(r.level)} style={{ width: 140 }} />
              <AnimatedCounter
                value={r.wait}
                style={styles.eqPct}
                format={(n) => (Math.round(n) <= 1 ? '0m' : `${Math.round(n)}m`)}
              />
            </View>
          </View>
          {idx < rows.length - 1 ? <Divider style={{ marginVertical: spacing.lg }} /> : null}
        </View>
      ))}

      {/* data source disclosure — at the bottom */}
      <Divider style={{ marginTop: spacing.xl }} />
      <Text style={styles.demo}>
        <Text style={styles.demoTag}>FOOT-TRAFFIC DATA  </Text>
        Busyness is based on historical foot-traffic data from BestTime for this venue. Wait times
        are estimates derived from it, not a live measured queue.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  demo: { fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  demoTag: { color: colors.purple, fontWeight: '700', letterSpacing: 0.5 },

  dayHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg },
  dayNameLabel: { fontSize: 14, fontWeight: '700', color: colors.ink },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  dayDotCol: { alignItems: 'center' },
  dayDot: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDotActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  dayDotText: { fontSize: 14, fontWeight: '700', color: colors.inkSoft },
  dayDotTextActive: { color: '#fff' },
  todayMark: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.purple, marginTop: 5 },
  todayMarkEmpty: { width: 4, height: 4, marginTop: 5 },

  timeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bigTime: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 50, color: colors.ink, marginTop: 4 },
  overallPct: { fontFamily: fonts.serif, fontSize: 36, color: colors.purple, lineHeight: 40 },

  timeControl: { marginTop: spacing.lg, alignItems: 'center' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, alignSelf: 'center' },
  sliderEnd: { fontSize: 12, color: colors.inkFaint, fontWeight: '600' },

  eqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eqLeft: { flex: 1, paddingRight: spacing.md },
  eqRight: { flexDirection: 'row', alignItems: 'center' },
  eqPct: { width: 40, textAlign: 'right', fontSize: 13, color: colors.inkSoft, fontWeight: '600', marginLeft: 10 },
});
