import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, PanResponder, useWindowDimensions,
} from 'react-native';
import Screen from '../components/Screen';
import { Label, Divider, ProgressLine } from '../components/UI';
import { colors, type, fonts, spacing, radius } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { DEMO_GYM } from '../data/gymData';
import predictor from '../services/occupancyPredictor';
import { averageCongestion, formatHour } from '../services/recommendationEngine';
import { congestionColor, congestionLabel } from '../theme/theme';

const DOW_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Whole-hour steps from 5 AM to 10 PM — these are the snap points
const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const MIN_HOUR = HOURS[0];
const MAX_HOUR = HOURS[HOURS.length - 1];

// Labels shown below the track at key positions
const TRACK_LABELS = [
  { hour: 5,  label: '5am' },
  { hour: 8,  label: '8am' },
  { hour: 12, label: '12pm' },
  { hour: 17, label: '5pm' },
  { hour: 22, label: '10pm' },
];

/**
 * Custom time slider — no external package needed.
 * Snaps to whole-hour positions, shows tick marks at each hour.
 */
function TimeSlider({ value, onChange, accentColor }) {
  const { width } = useWindowDimensions();
  // Track sits inside Screen's horizontal padding (spacing.xl = 24 each side)
  const trackWidth = width - spacing.xl * 2;
  const thumbSize = 28;
  const trackHeight = 5;

  const trackRef    = useRef(null);
  const trackXRef   = useRef(0); // measured x of track on screen
  const draggingRef = useRef(false);

  // Convert an hour value → x offset on the track
  const hourToX = useCallback((h) => {
    const pct = (h - MIN_HOUR) / (MAX_HOUR - MIN_HOUR);
    return Math.round(pct * trackWidth);
  }, [trackWidth]);

  // Convert a raw x offset → nearest snapped hour
  const xToHour = useCallback((x) => {
    const clamped = Math.max(0, Math.min(trackWidth, x));
    const raw = (clamped / trackWidth) * (MAX_HOUR - MIN_HOUR) + MIN_HOUR;
    // Snap to nearest integer hour
    return Math.round(Math.max(MIN_HOUR, Math.min(MAX_HOUR, raw)));
  }, [trackWidth]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        draggingRef.current = true;
        const x = evt.nativeEvent.pageX - trackXRef.current;
        onChange(xToHour(x));
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.pageX - trackXRef.current;
        onChange(xToHour(x));
      },
      onPanResponderRelease: () => {
        draggingRef.current = false;
      },
    })
  ).current;

  const thumbX = hourToX(value) - thumbSize / 2;
  const fillWidth = hourToX(value);

  return (
    <View style={{ marginVertical: spacing.lg }}>
      {/* Track + thumb hit area */}
      <View
        style={{ height: thumbSize + 8, justifyContent: 'center' }}
        ref={trackRef}
        onLayout={(e) => {
          // Measure track's x on screen for pan calculations
          if (trackRef.current) {
            trackRef.current.measure((fx, fy, fw, fh, px) => {
              trackXRef.current = px;
            });
          }
        }}
        {...panResponder.panHandlers}
      >
        {/* Track background */}
        <View style={[styles.track, { width: trackWidth, height: trackHeight }]}>
          {/* Filled portion */}
          <View style={[styles.trackFill, { width: fillWidth, backgroundColor: accentColor }]} />
        </View>

        {/* Tick marks at each hour */}
        {HOURS.map((h) => {
          const x = hourToX(h);
          const isPast = h <= value;
          return (
            <View
              key={h}
              style={[
                styles.tick,
                {
                  left: x - 1,
                  backgroundColor: isPast ? accentColor : colors.track,
                },
              ]}
            />
          );
        })}

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: thumbX,
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              borderColor: accentColor,
            },
          ]}
        >
          <View style={[styles.thumbDot, { backgroundColor: accentColor }]} />
        </View>
      </View>

      {/* Hour labels below track */}
      <View style={{ width: trackWidth, height: 18, position: 'relative' }}>
        {TRACK_LABELS.map(({ hour, label }) => {
          const x = hourToX(hour);
          return (
            <Text
              key={hour}
              style={[
                styles.trackLabel,
                { left: x, color: hour <= value ? accentColor : colors.inkFaint },
              ]}
            >
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

export default function ForecastScreen() {
  const now = new Date();
  const weekday = DOW_FULL[(now.getDay() + 6) % 7];
  const { theme } = useTheme();

  // Default to current hour, clamped to our range
  const defaultHour = Math.max(MIN_HOUR, Math.min(MAX_HOUR, now.getHours()));
  const [selectedHour, setSelectedHour] = useState(defaultHour);

  const overall = useMemo(
    () => Math.round(averageCongestion(weekday, selectedHour) * 100),
    [weekday, selectedHour]
  );

  const overallLevel = overall < 34 ? 'low' : overall < 67 ? 'moderate' : 'high';

  const rows = useMemo(() => {
    return DEMO_GYM.equipment.map((e) => {
      const p = predictor.predict(e.type, weekday, selectedHour);
      return { type: e.type, name: e.name, prob: p.probability, level: p.congestionLevel };
    }).sort((a, b) => b.prob - a.prob);
  }, [weekday, selectedHour]);

  return (
    <Screen>
      <View style={{ height: spacing.xl }} />
      <Label>{DEMO_GYM.name}</Label>
      <Text style={[type.h1, { marginTop: 6 }]}>Equipment forecast</Text>
      <Text style={[type.body, { marginTop: 6 }]}>
        Drag the slider to explore congestion by hour.
      </Text>

      <Divider />

      {/* Synthetic data disclaimer */}
      <Text style={styles.demo}>
        <Text style={[styles.demoTag, { color: theme.accent }]}>DEMO DATA  </Text>
        Forecasts use synthetic training data, not live gym occupancy. Full occupancy ≠ wait time.
      </Text>

      <Divider />

      {/* Selected time + overall congestion */}
      <View style={styles.timeHead}>
        <View>
          <Label muted>Selected time</Label>
          <Text style={styles.bigTime}>{formatHour(selectedHour)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.overallPct, { color: congestionColor(overallLevel) }]}>
            {overall}%
          </Text>
          <Text style={type.small}>overall congestion</Text>
        </View>
      </View>

      {/* ── Time slider ── */}
      <TimeSlider
        value={selectedHour}
        onChange={setSelectedHour}
        accentColor={theme.accent}
      />

      <Divider />

      {/* Per-equipment rows */}
      {rows.map((r, idx) => (
        <View key={r.type}>
          <View style={styles.eqRow}>
            <View style={styles.eqLeft}>
              <Text style={type.h3}>{r.name}</Text>
              <Text style={[type.small, { color: congestionColor(r.level) }]}>
                {congestionLabel(r.level)}
              </Text>
            </View>
            <View style={styles.eqRight}>
              <ProgressLine value={r.prob} width={130} color={congestionColor(r.level)} />
              <Text style={styles.eqPct}>{Math.round(r.prob * 100)}%</Text>
            </View>
          </View>
          {idx < rows.length - 1 && <Divider style={{ marginVertical: spacing.lg }} />}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  demo: { fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  demoTag: { fontWeight: '700', letterSpacing: 0.5 },

  timeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bigTime: {
    fontFamily: fonts.serif,
    fontSize: 44,
    lineHeight: 52,
    color: colors.ink,
    marginTop: 4,
  },
  overallPct: {
    fontFamily: fonts.serif,
    fontSize: 36,
    lineHeight: 42,
  },

  // Track
  track: {
    position: 'absolute',
    top: '50%',
    backgroundColor: colors.track,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    borderRadius: 4,
  },
  tick: {
    position: 'absolute',
    top: '50%',
    width: 2,
    height: 10,
    marginTop: -5,
    borderRadius: 1,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -14,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trackLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '600',
    transform: [{ translateX: -12 }], // center under tick
  },

  eqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eqLeft: { flex: 1, paddingRight: spacing.md },
  eqRight: { flexDirection: 'row', alignItems: 'center' },
  eqPct: {
    width: 38, textAlign: 'right',
    fontSize: 13, color: colors.inkSoft, fontWeight: '600', marginLeft: 8,
  },
});
