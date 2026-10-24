/**
 * Skeleton placeholder with a subtle shimmer. Use while content loads instead
 * of a bare spinner. Reduced-motion: shows a static muted block.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius } from '../theme/theme';
import { useReducedMotion } from './motion';

export function Skeleton({ width = '100%', height = 16, radius: r = radius.sm, style }) {
  const shimmer = useSharedValue(0.5);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    shimmer.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [reduced, shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: 0.4 + shimmer.value * 0.4 }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: r, backgroundColor: colors.cardSunken },
        reduced ? { opacity: 0.6 } : animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonGroup({ children, style }) {
  return <View style={[styles.group, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { gap: 12 },
});
