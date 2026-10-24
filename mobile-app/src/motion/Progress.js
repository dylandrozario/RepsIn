/**
 * Animated progress visualizations: a circular ring and a linear bar.
 * Both tween smoothly when their value changes (UI-thread), reduced-motion aware.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { TIMING, SPRING, useReducedMotion } from './motion';
import { colors } from '../theme/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * ProgressRing — animated circular progress (0..1).
 */
export function ProgressRing({
  value = 0,
  size = 72,
  stroke = 6,
  color = colors.purple,
  track = colors.track,
  children,
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const v = Math.max(0, Math.min(1, value));
    progress.value = reduced ? v : withTiming(v, TIMING.slow);
  }, [value, reduced, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}

/**
 * ProgressBar — animated linear progress (0..1).
 */
export function ProgressBar({ value = 0, height = 4, color = colors.purple, track = colors.track, style }) {
  const progress = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const v = Math.max(0, Math.min(1, value));
    progress.value = reduced ? v : withSpring(v, SPRING.gentle);
  }, [value, reduced, progress]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={[{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, animatedStyle]} />
    </View>
  );
}
