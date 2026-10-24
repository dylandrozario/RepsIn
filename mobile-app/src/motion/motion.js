/**
 * Shared motion system — spring/timing presets and a reduced-motion hook.
 *
 * Centralizes animation timing so everything feels consistent (Apple Fitness /
 * Strava style: quick, springy, never sluggish). Respects the OS "Reduce
 * Motion" accessibility setting: when enabled, durations collapse and springs
 * become near-instant so the UI stays usable without movement.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Easing } from 'react-native-reanimated';

// Spring presets (Reanimated withSpring configs).
export const SPRING = {
  // Snappy button/press feedback.
  press: { damping: 15, stiffness: 320, mass: 0.6 },
  // Gentle entrance / layout settle.
  gentle: { damping: 18, stiffness: 160, mass: 0.9 },
  // Bouncy celebration (rep complete).
  bouncy: { damping: 9, stiffness: 220, mass: 0.7 },
};

// Timing presets (ms + easing).
export const TIMING = {
  fast: { duration: 180, easing: Easing.out(Easing.cubic) },
  base: { duration: 280, easing: Easing.out(Easing.cubic) },
  slow: { duration: 420, easing: Easing.out(Easing.cubic) },
};

let _reduceMotionCache = false;

/** Subscribe to the OS reduce-motion setting. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(_reduceMotionCache);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => {
      if (mounted) {
        _reduceMotionCache = v;
        setReduced(v);
      }
    });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => {
      _reduceMotionCache = v;
      setReduced(v);
    });
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);
  return reduced;
}

// Stagger helper: delay for the Nth item in a list reveal.
export function stagger(index, step = 60, max = 400) {
  return Math.min(index * step, max);
}
