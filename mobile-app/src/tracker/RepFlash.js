/**
 * RepFlash — a brief full-screen green edge-glow pulse when a rep is counted.
 * Driven only by the rep count changing (not per frame), so it adds no cost to
 * the camera analysis loop. Reduced-motion: no-op.
 */
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/theme';
import { useReducedMotion } from '../motion/motion';

export default function RepFlash({ reps, goodForm = true }) {
  const opacity = useSharedValue(0);
  const reduced = useReducedMotion();
  const first = React.useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) return;
    opacity.value = withSequence(
      withTiming(0.55, { duration: 110 }),
      withTiming(0, { duration: 320 })
    );
  }, [reps, reduced, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const color = goodForm ? colors.low : colors.moderate;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.glow, { borderColor: color, shadowColor: color }, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 6,
    borderRadius: 2,
  },
});
