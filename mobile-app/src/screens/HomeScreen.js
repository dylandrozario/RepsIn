import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import AppHeader from '../components/AppHeader';
import HeroCard from '../components/HeroCard';
import { Label, Divider, IconTile } from '../components/UI';
import { colors, type, fonts, spacing } from '../theme/theme';
import { DEMO_GYM } from '../data/gymData';
import predictor from '../services/occupancyPredictor';
import { getBestSlot, formatHour, averageCongestion } from '../services/recommendationEngine';

const DOW_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DOW_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function greeting(h) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ navigation, route }) {
  const prefs = route?.params?.prefs || { duration: 45, name: 'Alex' };
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7; // Mon=0
  const weekday = DOW_FULL[todayIdx];

  const best = useMemo(() => getBestSlot(null, []), []);
  const bestAvg = best ? Math.round(best.congestion * 100) : 32;
  const match = Math.max(70, 100 - bestAvg);

  // Equipment outlook: top three by interest at the best hour.
  const outlookHour = best?.hour ?? 17;
  const outlook = useMemo(() => {
    const items = DEMO_GYM.equipment.slice(0, 3).map((e) => {
      const p = predictor.predict(e.type, weekday, outlookHour);
      const likelyOpen = Math.max(0, Math.round(e.units * (1 - p.probability)));
      return {
        type: e.type,
        name: e.name,
        units: e.units,
        likelyOpen,
        busy: p.congestionLevel === 'high',
      };
    });
    return items;
  }, [weekday, outlookHour]);

  const dateLabel = now
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();

  return (
    <Screen>
      <AppHeader initials="AM" />

      {/* location */}
      <Pressable style={styles.locRow}>
        <Text style={styles.locPin}>📍</Text>
        <Text style={styles.locText}>{DEMO_GYM.name}</Text>
        <Text style={styles.locCaret}>⌄</Text>
      </Pressable>
      <Divider style={{ marginTop: 10, marginBottom: spacing.xl }} />

      {/* greeting */}
      <Label>{dateLabel}</Label>
      <Text style={[type.display, styles.greet]}>{greeting(now.getHours())}, {prefs.name || 'Alex'}.</Text>
      <Text style={type.body}>Let's find the easiest way to get your workout in.</Text>

      {/* hero */}
      <View style={{ marginTop: spacing.xl }}>
        <HeroCard
          time={best ? formatHour(best.hour) : '5:30 PM'}
          duration={`${prefs.duration || 45} min`}
          fullPct={`${bestAvg}% predicted full`}
          match={match}
          onPress={() => navigation.navigate('Workout', { slot: best })}
        />
      </View>

      {/* week strip */}
      <View style={{ marginTop: spacing.xxl }}>
        <Label>Your week</Label>
        <View style={styles.weekHead}>
          <Text style={type.h1}>Keep the rhythm going</Text>
        </View>
        <Text style={[type.labelMuted, { marginBottom: spacing.lg }]}>1 of 3 complete</Text>

        <View style={styles.weekRow}>
          {DOW_SHORT.map((d, i) => {
            const done = i < todayIdx && i === 0;
            const isToday = i === todayIdx;
            const dayNum = 18 + i;
            return (
              <View key={i} style={styles.dayCol}>
                <Text style={styles.dayLetter}>{d}</Text>
                <View
                  style={[
                    styles.dayCircle,
                    done && styles.dayDone,
                    isToday && styles.dayToday,
                  ]}
                >
                  {done ? (
                    <Text style={styles.dayCheck}>✓</Text>
                  ) : (
                    <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{dayNum}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.weekTrack}>
          <View style={[styles.weekFill, { width: `${((todayIdx + 1) / 7) * 100}%` }]} />
        </View>
      </View>

      <Divider style={{ marginVertical: spacing.xxl }} />

      {/* equipment outlook */}
      <Label>Equipment outlook</Label>
      <View style={styles.outlookHead}>
        <Text style={type.h1}>What you'll need</Text>
        <Pressable onPress={() => navigation.navigate('Forecast')}>
          <Text style={styles.viewLink}>View forecast →</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        {outlook.map((item, idx) => (
          <View key={item.type}>
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
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  locPin: { fontSize: 13, marginRight: 6 },
  locText: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  locCaret: { fontSize: 15, color: colors.inkSoft, marginLeft: 6 },

  greet: { marginTop: 6, marginBottom: 8 },

  weekHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  dayCol: { alignItems: 'center' },
  dayLetter: { fontSize: 13, color: colors.inkSoft, fontWeight: '600', marginBottom: 10 },
  dayCircle: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  dayToday: { backgroundColor: colors.purple, borderColor: colors.purple },
  dayCheck: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dayNum: { fontSize: 14, color: colors.inkSoft, fontWeight: '600' },
  dayNumToday: { color: '#fff', fontWeight: '700' },
  weekTrack: { height: 3, borderRadius: 3, backgroundColor: colors.track, overflow: 'hidden' },
  weekFill: { height: 3, borderRadius: 3, backgroundColor: colors.purple },

  outlookHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  viewLink: { color: colors.purple, fontSize: 14, fontWeight: '700', marginBottom: 4 },

  equipRow: { flexDirection: 'row', alignItems: 'center' },
  equipMid: { flex: 1, marginLeft: spacing.lg },
  statusText: { fontSize: 14, fontWeight: '700' },
  statusOpen: { color: colors.purple },
  statusBusy: { color: colors.inkSoft },
});
