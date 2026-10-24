import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import { Label, Divider, ProgressLine } from '../components/UI';
import { colors, type, fonts, spacing } from '../theme/theme';
import { DEMO_GYM } from '../data/gymData';
import predictor from '../services/occupancyPredictor';
import { averageCongestion, congestionLevelFor, formatHour } from '../services/recommendationEngine';
import { congestionColor, congestionLabel } from '../theme/theme';

const DOW_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Half-hour granularity selectable chips (snap to whole hours for lookups).
const SLOTS = [];
for (let h = 6; h <= 22; h++) {
  SLOTS.push(h);
  if (h < 22) SLOTS.push(h + 0.5);
}

export default function ForecastScreen() {
  const now = new Date();
  const weekday = DOW_FULL[(now.getDay() + 6) % 7];
  const [selected, setSelected] = useState(18.5); // 6:30 PM default like the mock

  const lookupHour = Math.round(selected);
  const overall = useMemo(() => Math.round(averageCongestion(weekday, lookupHour) * 100), [weekday, lookupHour]);

  const rows = useMemo(() => {
    return DEMO_GYM.equipment.map((e) => {
      const p = predictor.predict(e.type, weekday, lookupHour);
      return { type: e.type, name: e.name, prob: p.probability, level: p.congestionLevel };
    }).sort((a, b) => b.prob - a.prob);
  }, [weekday, lookupHour]);

  return (
    <Screen>
      <View style={{ height: spacing.xl }} />
      <Label>{DEMO_GYM.name}</Label>
      <Text style={[type.h1, { marginTop: 6 }]}>Equipment forecast</Text>
      <Text style={[type.body, { marginTop: 6 }]}>
        Explore how likely each equipment type is to be fully occupied.
      </Text>

      <Divider />

      {/* synthetic data disclaimer (Req 5.5 / 15.5) */}
      <Text style={styles.demo}>
        <Text style={styles.demoTag}>DEMO DATA  </Text>
        Forecasts use synthetic training data, not live gym occupancy. Full occupancy does not represent wait time.
      </Text>

      <Divider />

      {/* selected time + overall */}
      <View style={styles.timeHead}>
        <View>
          <Label muted>Selected time</Label>
          <Text style={[styles.bigTime]}>{formatHour(selected)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.overallPct}>{overall}%</Text>
          <Text style={type.small}>overall congestion</Text>
        </View>
      </View>

      {/* time slider (chips) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sliderRow}
        style={{ marginTop: spacing.lg }}
      >
        {SLOTS.map((s) => {
          const active = s === selected;
          return (
            <Pressable
              key={s}
              onPress={() => setSelected(s)}
              style={[styles.timeChip, active && styles.timeChipActive]}
            >
              <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                {formatHour(s).replace(' PM', '').replace(' AM', '')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Divider />

      {/* per-equipment rows */}
      {rows.map((r, idx) => (
        <View key={r.type}>
          <View style={styles.eqRow}>
            <View style={styles.eqLeft}>
              <Text style={type.h3}>{r.name}</Text>
              <Text style={[type.small, { color: congestionColor(r.level) }]}>{congestionLabel(r.level)}</Text>
            </View>
            <View style={styles.eqRight}>
              <ProgressLine value={r.prob} width={140} color={congestionColor(r.level)} />
              <Text style={styles.eqPct}>{Math.round(r.prob * 100)}%</Text>
            </View>
          </View>
          {idx < rows.length - 1 ? <Divider style={{ marginVertical: spacing.lg }} /> : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  demo: { fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  demoTag: { color: colors.purple, fontWeight: '700', letterSpacing: 0.5 },

  timeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bigTime: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 50, color: colors.ink, marginTop: 4 },
  overallPct: { fontFamily: fonts.serif, fontSize: 36, color: colors.purple, lineHeight: 40 },

  sliderRow: { gap: 10, paddingRight: spacing.xl },
  timeChip: {
    paddingVertical: 11, paddingHorizontal: 18,
    borderRadius: 999, borderWidth: 1, borderColor: colors.hairline,
    backgroundColor: 'transparent',
  },
  timeChipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  timeChipText: { fontSize: 15, color: colors.inkSoft, fontWeight: '600' },
  timeChipTextActive: { color: '#fff', fontWeight: '700' },

  eqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eqLeft: { flex: 1, paddingRight: spacing.md },
  eqRight: { flexDirection: 'row', alignItems: 'center' },
  eqPct: { width: 40, textAlign: 'right', fontSize: 13, color: colors.inkSoft, fontWeight: '600', marginLeft: 10 },
});
