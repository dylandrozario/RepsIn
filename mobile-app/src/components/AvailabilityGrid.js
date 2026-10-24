import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { colors, fonts, spacing, radius } from '../theme/theme';

/**
 * When2meet-style availability grid.
 *
 * 7 day columns × hourly rows. Drag across cells to paint (or erase) the hours
 * you're free. Paint mode is decided by the first cell you touch: if it's empty
 * you paint, if it's filled you erase — just like When2meet.
 *
 * Value shape: a Set-like object keyed "weekday-hour" (e.g. "Monday-17").
 * We expose selection as { [weekday]: number[] } via onChange.
 */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const START_HOUR = 6;
const END_HOUR = 22;          // exclusive top
const STEP = 0.5;             // half-hour increments
const ROWS = (END_HOUR - START_HOUR) / STEP; // 32 half-hour rows

// Row index → fractional hour (e.g. row 3 -> 7.5).
function rowToHour(row) {
  return START_HOUR + row * STEP;
}

function hourLabel(h) {
  const whole = Math.floor(h);
  const half = h % 1 >= 0.5;
  const ampm = whole >= 12 ? 'p' : 'a';
  const h12 = whole % 12 === 0 ? 12 : whole % 12;
  return half ? `${h12}:30${ampm}` : `${h12}${ampm}`;
}

export default function AvailabilityGrid({ value, onChange, cellHeight: cellHeightProp, gridHeight }) {
  // If a total gridHeight is given, derive per-cell height so all rows fit
  // without scrolling (minus the ~22px day header). Otherwise use the prop/default.
  const cellHeight = gridHeight
    ? Math.max(9, Math.floor((gridHeight - 22) / ROWS))
    : cellHeightProp || 15;
  // selection: Set of "dayIdx-hour"
  const [sel, setSel] = useState(() => new Set(value || []));
  const layout = useRef({ x: 0, y: 0, width: 0, colW: 0 });
  const paintMode = useRef(true); // true = add, false = remove
  const lastKey = useRef(null);

  const emit = useCallback((next) => {
    // Build { weekday: [hours] } for the parent.
    const byDay = {};
    next.forEach((k) => {
      const [di, h] = k.split('-');
      const day = DAY_FULL[Number(di)];
      (byDay[day] ||= []).push(Number(h));
    });
    onChange?.(Array.from(next), byDay);
  }, [onChange]);

  const applyAt = useCallback((px, py, isStart) => {
    const { colW } = layout.current;
    if (!colW) return;
    const col = Math.floor(px / colW);
    const row = Math.floor(py / cellHeight);
    if (col < 0 || col > 6 || row < 0 || row >= ROWS) return;
    const hour = rowToHour(row);
    const key = `${col}-${hour}`;

    setSel((prev) => {
      // On the first touch, decide paint vs erase from this cell's state.
      if (isStart) paintMode.current = !prev.has(key);
      if (key === lastKey.current && !isStart) return prev;
      lastKey.current = key;

      const next = new Set(prev);
      if (paintMode.current) next.add(key);
      else next.delete(key);
      emit(next);
      return next;
    });
  }, [cellHeight, emit]);

  const pan = Gesture.Pan()
    .onStart((e) => {
      'worklet';
      runOnJS(applyAt)(e.x, e.y, true);
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(applyAt)(e.x, e.y, false);
    });

  const tap = Gesture.Tap().onStart((e) => {
    'worklet';
    runOnJS(applyAt)(e.x, e.y, true);
  });

  const gesture = Gesture.Simultaneous(pan, tap);

  return (
    <View style={styles.wrap}>
      {/* hour labels gutter — label on the hour, every 2 hours to stay clean */}
      <View style={styles.gutter}>
        <View style={{ height: 22 }} />
        {Array.from({ length: ROWS }).map((_, r) => {
          const h = rowToHour(r);
          const onHour = h % 1 === 0;
          const showLabel = onHour && h % 2 === 0;
          return (
            <View key={r} style={[styles.gutterCell, { height: cellHeight }]}>
              {showLabel ? <Text style={styles.gutterText}>{hourLabel(h)}</Text> : null}
            </View>
          );
        })}
      </View>

      {/* grid */}
      <View style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          {DAYS.map((d) => (
            <Text key={d} style={styles.dayHead}>{d}</Text>
          ))}
        </View>

        <GestureDetector gesture={gesture}>
          <View
            style={styles.grid}
            onLayout={(e) => {
              const { width } = e.nativeEvent.layout;
              layout.current.width = width;
              layout.current.colW = width / 7;
            }}
          >
            {DAYS.map((_, col) => (
              <View key={col} style={styles.col}>
                {Array.from({ length: ROWS }).map((__, row) => {
                  const hour = rowToHour(row);
                  const on = sel.has(`${col}-${hour}`);
                  const onHour = hour % 1 === 0;
                  return (
                    <View
                      key={row}
                      style={[
                        styles.cell,
                        { height: cellHeight },
                        // Lighter divider on half-hour lines, solid on the hour.
                        onHour ? styles.cellHourLine : styles.cellHalfLine,
                        on && styles.cellOn,
                        row === ROWS - 1 && { borderBottomWidth: 0 },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row' },
  gutter: { width: 28, paddingTop: 0 },
  gutterCell: { justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: 4 },
  gutterText: { fontSize: 10, color: colors.inkFaint, fontWeight: '600' },

  headerRow: { flexDirection: 'row', height: 22 },
  dayHead: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.inkSoft, fontWeight: '700' },

  grid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  col: { flex: 1, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.hairline },
  cell: { backgroundColor: colors.card },
  cellHourLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  cellHalfLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairlineSoft },
  cellOn: { backgroundColor: colors.purple },
});
