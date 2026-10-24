import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../components/Logo';
import { colors, fonts, gradients } from '../theme/theme';
import { useReducedMotion, SPRING } from '../motion/motion';

/**
 * Animated landing screen: the words "Get your RepsIn" rise in one at a time,
 * "RepsIn" lands with a spring + lightning accent, then the whole thing fades
 * and calls onDone to continue into login / the app.
 */
export default function LandingScreen({ onDone }) {
  const reduced = useReducedMotion();
  const doneRef = React.useRef(false);

  const w0 = useSharedValue(0);     // "Get"
  const w1 = useSharedValue(0);     // "your"
  const brand = useSharedValue(0);  // "RepsIn"
  const bolt = useSharedValue(0);   // ⚡
  const fade = useSharedValue(1);   // whole-screen fade-out

  // Fire onDone at most once (timed fade OR a tap-to-skip).
  const finish = React.useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone?.();
  }, [onDone]);

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(finish, 700);
      return () => clearTimeout(t);
    }
    w0.value = withDelay(150, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));
    w1.value = withDelay(420, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));
    bolt.value = withDelay(700, withSpring(1, SPRING.bouncy));
    brand.value = withDelay(760, withSpring(1, SPRING.bouncy));

    // Hold, then fade out and hand off.
    fade.value = withDelay(2200, withTiming(0, { duration: 420 }, (f) => {
      'worklet';
      if (f) runOnJS(finish)();
    }));
  }, [reduced, finish, w0, w1, brand, bolt, fade]);

  const screenStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const s0 = useAnimatedStyle(() => ({
    opacity: w0.value,
    transform: [{ translateY: (1 - w0.value) * 22 }],
  }));
  const s1 = useAnimatedStyle(() => ({
    opacity: w1.value,
    transform: [{ translateY: (1 - w1.value) * 22 }],
  }));
  const sBrand = useAnimatedStyle(() => ({
    opacity: brand.value,
    transform: [{ translateY: (1 - brand.value) * 26 }, { scale: 0.92 + brand.value * 0.08 }],
  }));
  const sBolt = useAnimatedStyle(() => ({
    opacity: bolt.value,
    transform: [{ scale: bolt.value }, { rotate: `${(1 - bolt.value) * -30}deg` }],
  }));

  return (
    <Animated.View style={[styles.root, screenStyle]}>
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        locations={[0, 0.4, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* tap anywhere to skip the intro */}
      <Pressable style={StyleSheet.absoluteFill} onPress={finish} accessibilityLabel="Skip intro">
        <View style={styles.center}>
          <Animated.View style={sBolt}>
            <View style={styles.boltCircle}>
              <Logo size={40} color="#fff" />
            </View>
          </Animated.View>

          <View style={styles.line}>
            <Animated.Text style={[styles.word, s0]}>Get </Animated.Text>
            <Animated.Text style={[styles.word, s1]}>your</Animated.Text>
          </View>
          <Animated.Text style={[styles.brand, sBrand]}>RepsIn</Animated.Text>
        </View>
      </Pressable>

      <Text style={styles.tapHint}>Tap to continue</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  tapHint: {
    position: 'absolute', bottom: 48, alignSelf: 'center',
    color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5,
  },
  boltCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  bolt: { fontSize: 32, color: '#fff' },
  line: { flexDirection: 'row' },
  word: { fontFamily: fonts.serif, fontSize: 34, color: 'rgba(255,255,255,0.95)', lineHeight: 40 },
  brand: { fontFamily: fonts.serif, fontSize: 68, color: '#fff', lineHeight: 74, marginTop: 2 },
});
