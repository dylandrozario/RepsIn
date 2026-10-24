import React, { useMemo, useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, PanResponder, useWindowDimensions } from 'react-native';
import { Label, Divider, ProgressLine } from './UI';
import { colors, type, fonts, spacing, radius, congestionColor, congestionLabel } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useGym } from '../context/GymContext';
import predictor from '../services/occupancyPredictor';
import { averageCongestion, formatHour } from '../services/recommendationEngine';

const DOW_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const MIN_HOUR = HOURS[0];
const MAX_HOUR = HOURS[HOURS.length - 1];
const TRACK_LABELS = [
  { hour: 5, label: '5am' }, { hour: 8, label: '8am' }, { hour: 12, label: '12pm' },
  { hour: 17, label: '5pm' }, { hour: 22, label: '10pm' },
];

function TimeSlider({ value, onChange, accentColor }) {
  const { width } = useWindowDimensions();
  const trackWidth = width - spacing.xl * 2;
  const thumbSize = 28;
  const trackHeight = 5;
  const trackRef = useRef(null);
  const trackXRef = useRef(0);

  const hourToX = useCallback((h) => Math.round(((h - MIN_HOUR) / (MAX_HOUR - MIN_HOUR)) * trackWidth), [trackWidth]);
  const xToHour = useCallback((x) => {
    const clamped = Math.max(0, Math.min(trackWidth, x));
    const raw = (clamped / trackWidth) * (MAX_HOUR - MIN_HOUR) + MIN_HOUR;
    return Math.round(Math.max(MIN_HOUR, Math.min(MAX_HOUR, raw)));
  }, [trackWidth]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => onChange(xToHour(evt.nativeEvent.pageX - trackXRef.current)),
      onPanResponderMove: (evt) => onChange(xToHour(evt.nativeEvent.pageX - trackXRef.current)),
    })
  ).current;

  const thumbX = hourToX(value) - thumbSize / 2;
  const fillWidth = hourToX(value);

  return (
    <View style={{ marginVertical: spacing.lg }}>
      <View
        style={{ height: thumbSize + 8, justifyContent: 'center' }}
        ref={trackRef}
        onLayout={() => { if (trackRef.current) trackRef.current.measure((fx, fy, fw, fh, px) => { trackXRef.current = px; }); }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.track, { width: trackWidth, height: trackHeight }]}>
          <View style={[styles.trackFill, { width: fillWidth, backgroundColor: accentColor }]} />
        </View>
        {HOURS.map((h) => {
          const x = hourToX(h);
          return <View key={h} style={[styles.tick, { left: x - 1, backgroundColor: h <= value ? accentColor : colors.track }]} />;
        })}
        <View style={[styles.thumb, { left: thumbX, width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2, borderColor: accentColor }]}>
          <View style={[styles.thumbDot, { backgroundColor: accentColor }]} />
        </View>
      </View>
      <View style={{ width: trackWidth, height: 18, position: 'relative' }}>
        {TRACK_LABELS.map(({ hour, label }) => (
          <Text key={hour} style={[styles.trackLabel, { left: hourToX(hour), color: hour <= value ? accentColor : colors.inkFaint }]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Collapsible equipment-congestion forecast.
 * Rendered below the live floor in the Availability tab.
 */
export default function ForecastSection() {
  const now = new Date();
  const weekday = DOW_FULL[(now.getDay() + 6) % 7];
  const { theme } = useTheme();
  const { gym } = useGym();

  const [collapsed, setCollapsed] = useState(true); // congestion list collapsed by default
  const [selectedHour, setSelectedHour] = useState(Math.max(MIN_HOUR, Math.min(MAX_HOUR, now.getHours())));

  const overall = useMemo(
    () => Math.round(averageCongestion(weekday, selectedHour) * 100),
    [weekday, selectedHour]
  );
  const overallLevel = overall < 34 ? 'low' : overall < 67 ? 'moderate' : 'high';

  const rows = useMemo(() => {
    return gym.equipment.map((e, i) => {
      const p = predictor.predict(e.type, weekday, selectedHour);
      return { key: `${e.name}-${i}`, name: e.name, prob: p.probability, level: p.congestionLevel };
    }).sort((a, b) => b.prob - a.prob);
  }, [weekday, selectedHour, gym.id]);

  return (
    <View>
      <Divider style={{ marginVertical: spacing.xl }} />

      <Label>Forecast</Label>
      <Text style={[type.h1, { marginTop: 6 }]}>Congestion by hour</Text>

      <Text style={[styles.demo, { marginTop: spacing.md }]}>
        <Text style={[styles.demoTag, { color: theme.accent }]}>DEMO DATA  </Text>
        Synthetic training data, not live occupancy. Full occupancy ≠ wait time.
      </Text>

      {/* Selected time + overall */}
      <View style={[styles.timeHead, { marginTop: spacing.lg }]}>
        <View>
          <Label muted>Selected time</Label>
          <Text style={styles.bigTime}>{formatHour(selectedHour)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.overallPct, { color: congestionColor(overallLevel) }]}>{overall}%</Text>
          <Text style={type.small}>overall</Text>
        </View>
      </View>

      <TimeSlider value={selectedHour} onChange={setSelectedHour} accentColor={theme.accent} />

      {/* Collapsible per-machine congestion */}
      <Pressable style={styles.collapseHeader} onPress={() => setCollapsed((c) => !c)}>
        <Text style={[styles.collapseTitle, { color: theme.accent }]}>
          Per-machine congestion
        </Text>
        <Text style={[styles.collapseChevron, { color: theme.accent }]}>{collapsed ? '▸' : '▾'}</Text>
      </Pressable>

      {!collapsed && (
        <View style={{ marginTop: spacing.sm }}>
          {rows.map((r, idx) => (
            <View key={r.key}>
              <View style={styles.eqRow}>
                <View style={styles.eqLeft}>
                  <Text style={type.h3}>{r.name}</Text>
                  <Text style={[type.small, { color: congestionColor(r.level) }]}>{congestionLabel(r.level)}</Text>
                </View>
                <View style={styles.eqRight}>
                  <ProgressLine value={r.prob} width={110} color={congestionColor(r.level)} />
                  <Text style={styles.eqPct}>{Math.round(r.prob * 100)}%</Text>
                </View>
              </View>
              {idx < rows.length - 1 && <Divider style={{ marginVertical: spacing.md }} />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  demo: { fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  demoTag: { fontWeight: '700', letterSpacing: 0.5 },

  timeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bigTime: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 46, color: colors.ink, marginTop: 4 },
  overallPct: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 40 },

  track: { position: 'absolute', top: '50%', backgroundColor: colors.track, borderRadius: 4, overflow: 'hidden' },
  trackFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 4 },
  tick: { position: 'absolute', top: '50%', width: 2, height: 10, marginTop: -5, borderRadius: 1 },
  thumb: {
    position: 'absolute', top: '50%', marginTop: -14, backgroundColor: '#fff', borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  thumbDot: { width: 8, height: 8, borderRadius: 4 },
  trackLabel: { position: 'absolute', fontSize: 10, fontWeight: '600', transform: [{ translateX: -12 }] },

  collapseHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline,
  },
  collapseTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  collapseChevron: { fontSize: 14, fontWeight: '700' },

  eqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eqLeft: { flex: 1, paddingRight: spacing.md },
  eqRight: { flexDirection: 'row', alignItems: 'center' },
  eqPct: { width: 38, textAlign: 'right', fontSize: 13, color: colors.inkSoft, fontWeight: '600', marginLeft: 8 },
});
