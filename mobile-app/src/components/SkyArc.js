import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme/theme';

/**
 * A small sky band where a sun/moon travels along an arc as the selected hour
 * changes (6:00 → 22:00). Daytime shows a sun on a blue sky; evening/night
 * shows a moon on a deep sky. The body animates to its new position whenever
 * `hour` changes, giving a gentle rise/set feel.
 */
const START = 6;   // first selectable hour
const END = 22;    // last selectable hour
const H = 96;      // band height

// Day runs ~6:30 (sunrise) to ~19:30 (sunset).
const SUNRISE = 6.5;
const SUNSET = 19.5;

function skyColors(hour) {
  if (hour < SUNRISE + 0.5) return ['#F4B183', '#F6C9A0']; // dawn
  if (hour < 9) return ['#9FC3E8', '#CFE0F2'];             // morning
  if (hour < 16) return ['#7FB2E8', '#BBD9F3'];            // midday
  if (hour < SUNSET) return ['#E8A06A', '#F2C79B'];        // golden hour
  if (hour < SUNSET + 1) return ['#7C5CA8', '#C98F86'];    // dusk
  return ['#2A2550', '#4B3F7A'];                            // night
}

export default function SkyArc({ hour = 13, width = 300 }) {
  const t = clamp((hour - START) / (END - START), 0, 1); // 0..1 across the band
  const anim = useRef(new Animated.Value(t)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: t,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [t, anim]);

  const isNight = hour < SUNRISE || hour >= SUNSET;
  const [c1, c2] = skyColors(hour);

  const pad = 26;
  const span = Math.max(1, width - pad * 2);
  const peak = 14;         // highest point of the arc (px from top)
  const base = H - 30;     // body height when near horizon

  // Travel left→right; height follows a parabola (low at ends, high in middle).
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [pad, pad + span] });
  const translateY = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [base, peak, base],
  });

  return (
    <View style={[styles.wrap, { width }]}>
      <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.sky}>
        {/* a few stars at night */}
        {isNight ? (
          <>
            <Star left={width * 0.2} top={20} />
            <Star left={width * 0.4} top={34} />
            <Star left={width * 0.7} top={18} />
            <Star left={width * 0.82} top={40} />
          </>
        ) : null}

        {/* horizon line */}
        <View style={styles.horizon} />

        {/* the sun or moon */}
        <Animated.View
          style={[
            styles.body,
            isNight ? styles.moon : styles.sun,
            { transform: [{ translateX }, { translateY }] },
          ]}
        >
          {isNight ? (
            <>
              <View style={[styles.crater, { width: 6, height: 6, top: 8, left: 7 }]} />
              <View style={[styles.crater, { width: 4, height: 4, top: 16, left: 17 }]} />
            </>
          ) : null}
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

function Star({ left, top }) {
  return <View style={[styles.star, { left, top }]} />;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

const BODY = 30;
const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
  sky: { height: H, borderRadius: radius.md, overflow: 'hidden' },
  horizon: {
    position: 'absolute', left: 0, right: 0, bottom: 18,
    height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.4)',
  },
  body: { position: 'absolute', width: BODY, height: BODY, borderRadius: BODY / 2, left: -BODY / 2, top: 0 },
  sun: {
    backgroundColor: '#FFE08A',
    shadowColor: '#FFD86B', shadowOpacity: 0.9, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
  },
  moon: {
    backgroundColor: '#EDEAF6',
    shadowColor: '#C9C2E8', shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
  },
  crater: { position: 'absolute', borderRadius: 4, backgroundColor: 'rgba(160,150,190,0.5)' },
  star: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)' },
});
