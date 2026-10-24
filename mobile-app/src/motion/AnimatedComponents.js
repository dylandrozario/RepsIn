/**
 * Reusable animated building blocks, all Reanimated-based (UI thread, 60fps),
 * all reduced-motion aware.
 */
import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  useAnimatedProps,
  runOnJS,
} from 'react-native-reanimated';
import { SPRING, TIMING, useReducedMotion } from './motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PressableScale — scales down slightly on press-in and springs back.
 * Drop-in replacement for Pressable for buttons/cards.
 */
export function PressableScale({ children, style, onPress, scaleTo = 0.96, disabled, ...rest }) {
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => {
    if (reduced) return;
    scale.value = withSpring(scaleTo, SPRING.press);
  };
  const onPressOut = () => {
    if (reduced) return;
    scale.value = withSpring(1, SPRING.press);
  };

  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={disabled}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

/**
 * FadeInView — fades + slides up on mount. Use for entrance reveals.
 * `delay` lets you stagger lists.
 */
export function FadeInView({ children, style, delay = 0, offset = 14 }) {
  const progress = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withTiming(1, TIMING.base));
  }, [delay, reduced, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * offset }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/**
 * Pulse — a one-shot scale pulse, triggered by changing `trigger`.
 * Used for rep-detected feedback.
 */
export function Pulse({ children, style, trigger, intensity = 1.12 }) {
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();
  const first = React.useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) return;
    scale.value = withSequence(
      withSpring(intensity, SPRING.bouncy),
      withSpring(1, SPRING.gentle)
    );
  }, [trigger, reduced, scale, intensity]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/**
 * AnimatedCounter — tweens a number when `value` changes and renders it.
 * Keeps the text on the JS side (updated via runOnJS) but the tween runs on UI.
 */
export function AnimatedCounter({ value, style, format = (n) => `${Math.round(n)}` }) {
  const [display, setDisplay] = React.useState(value);
  const anim = useSharedValue(value);
  const reduced = useReducedMotion();
  const last = React.useRef(value);

  useEffect(() => {
    if (reduced || value === last.current) {
      last.current = value;
      setDisplay(value);
      anim.value = value;
      return;
    }
    last.current = value;
    anim.value = withTiming(value, { duration: 450 });
  }, [value, reduced, anim]);

  // Mirror the shared value into React state ~ each frame while animating.
  useAnimatedStyle(() => {
    runOnJS(setDisplay)(anim.value);
    return {};
  }, [anim]);

  return <Text style={style}>{format(display)}</Text>;
}

const styles = StyleSheet.create({});
export { AnimatedPressable };
