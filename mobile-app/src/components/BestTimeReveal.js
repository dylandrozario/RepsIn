import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius, gradients } from '../theme/theme';
import { useReducedMotion, SPRING } from '../motion/motion';
import { formatHour } from '../services/recommendationEngine';
import { waitMinutes } from '../theme/theme';

/**
 * A synchronized "magic moment" reveal of the best workout time.
 * Sequence (all on the UI thread):
 *   1. A scanning ring pulses while we "crunch" schedule × congestion.
 *   2. The ring resolves and the time springs in, with day + wait fading up.
 *   3. onDone fires so the caller can transition to the full recommendation.
 */
export default function BestTimeReveal({ slot, duration, onDone }) {
  const reduced = useReducedMotion();

  // Phase drivers.
  const scan = useSharedValue(0);     // 0..1 looping scan
  const resolve = useSharedValue(0);  // 0 = scanning, 1 = resolved
  const timeIn = useSharedValue(0);   // time text entrance
  const metaIn = useSharedValue(0);   // day + wait entrance

  useEffect(() => {
    if (reduced) {
      // Skip straight to the result, brief hold, then done.
      resolve.value = 1;
      timeIn.value = 1;
      metaIn.value = 1;
      const t = setTimeout(() => onDone?.(), 700);
      return () => clearTimeout(t);
    }

    // 1) scan for ~1.1s
    scan.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);

    // 2) resolve the ring
    resolve.value = withDelay(1100, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));

    // 3) time springs in, then meta
    timeIn.value = withDelay(1300, withSpring(1, SPRING.bouncy));
    metaIn.value = withDelay(1500, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));

    // 4) hand off to the full Home view after the result has been admired.
    const t = setTimeout(() => onDone?.(), 2800);
    return () => clearTimeout(t);
  }, [reduced, onDone, scan, resolve, timeIn, metaIn]);

  const ringStyle = useAnimatedStyle(() => {
    const scanScale = 0.9 + scan.value * 0.12;
    const resolved = resolve.value;
    return {
      transform: [{ scale: interpolate(resolved, [0, 1], [scanScale, 1.05]) }],
      opacity: interpolate(resolved, [0, 1], [0.5 + scan.value * 0.3, 1]),
      borderColor: `rgba(255,255,255,${0.4 + resolve.value * 0.5})`,
    };
  });

  const checkStyle = useAnimatedStyle(() => ({
    opacity: resolve.value,
    transform: [{ scale: resolve.value }],
  }));

  const timeStyle = useAnimatedStyle(() => ({
    opacity: timeIn.value,
    transform: [{ translateY: (1 - timeIn.value) * 18 }, { scale: 0.9 + timeIn.value * 0.1 }],
  }));

  const metaStyle = useAnimatedStyle(() => ({
    opacity: metaIn.value,
    transform: [{ translateY: (1 - metaIn.value) * 10 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(resolve.value, [0, 1], [1, 0]),
  }));

  const wait = slot ? waitMinutes(slot.congestion) : 3;

  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      locations={[0, 0.4, 0.75, 1]}
      style={styles.fill}
    >
      <Animated.View style={[styles.scanWrap]}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.Text style={[styles.check, checkStyle]}>✓</Animated.Text>
      </Animated.View>

      <Animated.Text style={[styles.scanLabel, labelStyle]}>
        Matching your week to {''}the quiet hours…
      </Animated.Text>

      <Animated.View style={[styles.result, timeStyle]}>
        <Text style={styles.kicker}>YOUR BEST WINDOW</Text>
        <Text style={styles.time}>{slot ? formatHour(slot.hour) : '5:30 PM'}</Text>
      </Animated.View>

      <Animated.View style={[styles.meta, metaStyle]}>
        <Text style={styles.metaDay}>{slot ? slot.weekday : 'Tuesday'}</Text>
        <View style={styles.dotRow}>
          <Text style={styles.metaText}>{duration || 45} min</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{wait <= 1 ? 'No wait' : `~${wait} min wait`}</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  scanWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  ring: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
  },
  check: { color: '#fff', fontSize: 52, fontWeight: '800' },
  scanLabel: {
    position: 'absolute', top: '58%',
    color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600', textAlign: 'center',
    paddingHorizontal: 40,
  },
  result: { alignItems: 'center' },
  kicker: { color: 'rgba(255,255,255,0.85)', fontSize: 12, letterSpacing: 1.4, fontWeight: '700', marginBottom: 6 },
  time: { fontFamily: fonts.serif, color: '#fff', fontSize: 64, lineHeight: 70 },
  meta: { alignItems: 'center', marginTop: spacing.md },
  metaDay: { fontFamily: fonts.serif, color: '#fff', fontSize: 24, marginBottom: 8 },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
});
