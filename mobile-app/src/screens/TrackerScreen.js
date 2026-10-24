import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Alert, Animated, Easing, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { Label, Button } from '../components/UI';
import SkeletonOverlay from '../tracker/SkeletonOverlay';
import { EXERCISE_LIST } from '../tracker/exercises';
import { setTracking } from '../tracker/trackingState';
import { Pulse, PressableScale } from '../motion/AnimatedComponents';
import RepFlash from '../tracker/RepFlash';
import {
  analyzeFrame,
  resetSession,
  loadServerUrl,
  setServerUrl,
  checkHealth,
  deriveServerUrl,
} from '../tracker/poseClient';
import { colors, type, fonts, spacing, radius, shadow } from '../theme/theme';

// How often to send a frame to the server (ms). ~4 fps keeps the laptop
// comfortable and the rep counter responsive.
const CAPTURE_INTERVAL = 280;

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [exerciseId, setExerciseId] = useState('squat');
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);

  // Drives the pull-down: 0 = hidden above the screen, 1 = fully covering.
  const slide = useRef(new Animated.Value(0)).current;
  const [viewSize, setViewSize] = useState({ width: 1, height: 1 });

  const [serverUrl, setServerUrlState] = useState('');
  const [serverOk, setServerOk] = useState(null); // null unknown, true/false
  const [showSkeleton, setShowSkeleton] = useState(true);

  const [status, setStatus] = useState({
    reps: 0, goodReps: 0, state: 'unknown', formOk: true,
    cues: [], primaryAngle: null, poseDetected: false,
  });
  const [landmarks, setLandmarks] = useState(null);
  const [latency, setLatency] = useState(null);

  const loopRef = useRef({ running: false, busy: false });
  const exerciseRef = useRef(exerciseId);
  exerciseRef.current = exerciseId;

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  useEffect(() => {
    (async () => {
      // Auto-fills from the Expo dev host (same laptop, port 8000) if the user
      // hasn't saved a custom URL. Then auto-connects.
      const url = await loadServerUrl();
      if (url) {
        setServerUrlState(url);
        verify(url);
      }
    })();
  }, [verify]);

  const current = EXERCISE_LIST.find((e) => e.id === exerciseId);

  const verify = useCallback(async (url) => {
    try {
      await checkHealth(url);
      setServerOk(true);
    } catch {
      setServerOk(false);
    }
  }, []);

  const saveServer = useCallback(async () => {
    const saved = await setServerUrl(serverUrl);
    setServerUrlState(saved);
    verify(saved);
  }, [serverUrl, verify]);

  // Clear any saved URL and re-derive from the Expo dev host.
  const autoDetect = useCallback(async () => {
    const derived = deriveServerUrl();
    const saved = await setServerUrl(derived);
    setServerUrlState(saved);
    if (saved) verify(saved);
    else setServerOk(false);
  }, [verify]);

  // The capture + analyze loop.
  const tick = useCallback(async () => {
    const l = loopRef.current;
    if (!l.running || l.busy || !cameraRef.current) {
      if (l.running) setTimeout(tick, CAPTURE_INTERVAL);
      return;
    }
    l.busy = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.3,
        skipProcessing: true,
        shutterSound: false,
      });
      if (photo?.base64) {
        const res = await analyzeFrame(photo.base64, exerciseRef.current, false);
        setStatus({
          reps: res.reps ?? 0,
          goodReps: res.goodReps ?? 0,
          state: res.state ?? 'unknown',
          formOk: res.formOk ?? true,
          cues: res.cues ?? [],
          primaryAngle: res.primaryAngle ?? null,
          poseDetected: res.poseDetected ?? false,
        });
        setLandmarks(res.landmarks || null);
        setLatency(res.latencyMs ?? null);
        setServerOk(true);
      }
    } catch (e) {
      setServerOk(false);
    } finally {
      l.busy = false;
      if (l.running) setTimeout(tick, CAPTURE_INTERVAL);
    }
  }, []);

  const start = useCallback(async () => {
    if (serverOk === false || !serverUrl) {
      Alert.alert('Server not connected', 'Enter your laptop server URL and tap Connect first.');
      return;
    }
    await resetSession(exerciseRef.current);
    setStatus({ reps: 0, goodReps: 0, state: 'unknown', formOk: true, cues: [], primaryAngle: null, poseDetected: false });

    // Reveal the camera by sliding the setup sheet down off-screen.
    setActive(true);
    setTracking(true);   // hide the nav
    Animated.timing(slide, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // Start the capture loop once the sheet is fully out of the way.
      loopRef.current.running = true;
      tick();
    });
  }, [serverOk, serverUrl, tick, slide]);

  const stop = useCallback(() => {
    loopRef.current.running = false;
    // Slide the setup sheet back up over the camera.
    Animated.timing(slide, {
      toValue: 0,
      duration: 380,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setActive(false);
      setTracking(false);
    });
  }, [slide]);

  // Make sure the nav is restored if we leave the screen while tracking.
  useEffect(() => () => {
    loopRef.current.running = false;
    setTracking(false);
  }, []);

  const onChangeExercise = useCallback(async (id) => {
    setExerciseId(id);
    if (active) await resetSession(id);
    setStatus((s) => ({ ...s, reps: 0, goodReps: 0, state: 'unknown' }));
  }, [active]);

  // Permission gate.
  if (!permission) return <View style={styles.root} />;
  if (!permission.granted) {
    return (
      <View style={[styles.gate, { paddingTop: insets.top + 40 }]}>
        <Label>Form tracker</Label>
        <Text style={[type.h1, { marginTop: 8, textAlign: 'center' }]}>Camera access needed</Text>
        <Text style={[type.body, { textAlign: 'center', marginTop: 10, maxWidth: 300 }]}>
          RepsIn uses your camera to film your set. Frames are sent to your own laptop for
          analysis — nothing is stored or uploaded to the cloud.
        </Text>
        <View style={{ height: spacing.xl }} />
        <Button label="Allow camera" onPress={requestPermission} />
      </View>
    );
  }

  // The setup sheet slides DOWN off-screen to reveal the camera underneath.
  // slide: 0 = sheet covering, 1 = sheet gone (camera revealed).
  const sheetTranslateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenH],
  });

  return (
    <View style={styles.root}>
      {/* BASE LAYER: the live camera, always mounted */}
      <View
        style={StyleSheet.absoluteFill}
        onLayout={(e) => setViewSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      >
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
          onCameraReady={() => setReady(true)}
          animateShutter={false}
        />

        {showSkeleton && active ? (
          <SkeletonOverlay
            landmarks={landmarks}
            width={viewSize.width}
            height={viewSize.height}
            formOk={status.formOk}
          />
        ) : null}

        {active ? <RepFlash reps={status.reps} goodForm={status.formOk} /> : null}

        {/* tracking HUD — only while active */}
        {active ? (
          <>
            <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
              <View>
                <Text style={styles.overlayKicker}>TRACKING</Text>
                <Text style={styles.overlayExercise}>{current?.label}</Text>
              </View>
              <Pulse trigger={status.reps} intensity={1.18} style={styles.repBadge}>
                <Text style={styles.repNum}>{status.reps}</Text>
                <Text style={styles.repLabel}>REPS</Text>
              </Pulse>
            </View>

            <View style={[styles.cueWrap, { top: insets.top + 86 }]}>
              {!status.poseDetected ? (
                <CuePill text="Step fully into frame" tone="warn" />
              ) : status.cues.length > 0 ? (
                status.cues.map((c) => <CuePill key={c} text={c} tone="warn" />)
              ) : (
                <CuePill text="Good form" tone="ok" />
              )}
              {latency != null ? <Text style={styles.latency}>{latency} ms</Text> : null}
            </View>

            <View style={[styles.floatControls, { bottom: insets.bottom + 90 }]}>
              <Pressable onPress={stop} style={styles.stopBtn}>
                <Text style={styles.stopText}>Stop</Text>
              </Pressable>
              <Pressable onPress={() => setShowSkeleton((s) => !s)} style={styles.floatToggle}>
                <Text style={styles.floatToggleText}>{showSkeleton ? 'Skeleton on' : 'Skeleton off'}</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>

      {/* SETUP SHEET: slides down off-screen on Start, revealing the camera */}
      <Animated.View
        style={[styles.setupSheet, { transform: [{ translateY: sheetTranslateY }] }]}
        pointerEvents={active ? 'none' : 'auto'}
      >
        {/* small live preview at the top */}
        <View style={styles.stage}>
          <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
            <View>
              <Text style={styles.overlayKicker}>{ready ? 'READY' : 'STARTING…'}</Text>
              <Text style={styles.overlayExercise}>{current?.label}</Text>
            </View>
          </View>
        </View>

        {/* controls */}
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Label>Laptop server</Label>
          <View style={styles.serverRow}>
            <TextInput
              value={serverUrl}
              onChangeText={setServerUrlState}
              placeholder="http://192.168.x.x:8000"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
            />
            <Pressable onPress={saveServer} style={styles.connectBtn}>
              <Text style={styles.connectText}>Connect</Text>
            </Pressable>
          </View>
          <View style={styles.statusLine}>
            <View style={[styles.statusDot, serverOk === true ? styles.dotOk : serverOk === false ? styles.dotBad : styles.dotIdle]} />
            <Text style={[type.small, { flex: 1 }]}>
              {serverOk === true
                ? 'Connected'
                : serverOk === false
                ? 'Not reachable — make sure the server is running on your laptop'
                : 'Auto-detecting your laptop…'}
            </Text>
            <Pressable onPress={autoDetect} hitSlop={8}>
              <Text style={styles.autoLink}>Auto-detect</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Label>Choose an exercise</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickRow} style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
            {EXERCISE_LIST.map((ex) => {
              const sel = ex.id === exerciseId;
              return (
                <PressableScale key={ex.id} onPress={() => onChangeExercise(ex.id)} style={[styles.pick, sel && styles.pickSel]}>
                  <Text style={[styles.pickLabel, sel && styles.pickLabelSel]}>{ex.label}</Text>
                  <Text style={[styles.pickTarget, sel && { color: 'rgba(255,255,255,0.8)' }]}>{ex.target}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>

          <View style={styles.statsRow}>
            <Stat label="Reps" value={status.reps} />
            <Stat label="Good form" value={status.goodReps} />
            <Stat label="Angle" value={status.primaryAngle != null ? `${Math.round(status.primaryAngle)}°` : '—'} />
          </View>

          <View style={styles.btnRow}>
            <View style={{ flex: 1 }}>
              <Button label="Start tracking" variant="solid" onPress={start} />
            </View>
            <Pressable onPress={() => setShowSkeleton((s) => !s)} style={styles.toggleBtn}>
              <Text style={styles.toggleText}>{showSkeleton ? 'Skeleton on' : 'Skeleton off'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CuePill({ text, tone }) {
  const ok = tone === 'ok';
  return (
    <View style={[styles.cuePill, ok ? styles.cueOk : styles.cueWarn]}>
      <Text style={styles.cueText}>{ok ? '✓ ' : '! '}{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  gate: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingHorizontal: spacing.xl },

  // Full-screen tracking stage.
  fullscreen: { flex: 1, backgroundColor: '#000' },
  // The setup sheet is a full-screen layer that slides down to reveal the camera.
  setupSheet: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.bg,
    zIndex: 50,
  },
  floatControls: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    paddingHorizontal: spacing.xl,
  },
  stopBtn: {
    backgroundColor: colors.high, borderRadius: radius.pill,
    paddingVertical: 16, paddingHorizontal: 44,
    ...shadow.float,
  },
  stopText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  floatToggle: {
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.pill,
    paddingVertical: 14, paddingHorizontal: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  floatToggleText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  stage: { flex: 1, backgroundColor: '#15121F', overflow: 'hidden' },

  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing.xl, paddingBottom: 16,
  },
  overlayKicker: { color: 'rgba(255,255,255,0.85)', fontSize: 11, letterSpacing: 1.4, fontWeight: '700' },
  overlayExercise: { fontFamily: fonts.serif, color: '#fff', fontSize: 28, marginTop: 2 },
  repBadge: { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center', minWidth: 76 },
  repNum: { fontFamily: fonts.serif, color: '#fff', fontSize: 34, lineHeight: 36 },
  repLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },

  cueWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 8 },
  cuePill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill },
  cueOk: { backgroundColor: colors.low },
  cueWarn: { backgroundColor: colors.high },
  cueText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  latency: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },

  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl, marginTop: -radius.xl,
    ...shadow.float,
  },

  serverRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md },
  input: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.hairline,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink,
  },
  connectBtn: { backgroundColor: colors.purple, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 13 },
  connectText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statusLine: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  dotOk: { backgroundColor: colors.low },
  dotBad: { backgroundColor: colors.high },
  dotIdle: { backgroundColor: colors.inkFaint },
  autoLink: { color: colors.purple, fontWeight: '700', fontSize: 13 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline, marginVertical: spacing.xl },

  pickRow: { gap: 10, paddingRight: spacing.xl },
  pick: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.card, minWidth: 120 },
  pickSel: { backgroundColor: colors.purple, borderColor: colors.purple },
  pickLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  pickLabelSel: { color: '#fff' },
  pickTarget: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginHorizontal: 4, ...shadow.card },
  statValue: { fontFamily: fonts.serif, fontSize: 26, color: colors.ink },
  statLabel: { fontSize: 11, color: colors.inkSoft, fontWeight: '600', marginTop: 2 },

  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleBtn: { paddingVertical: 16, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.hairline },
  toggleText: { color: colors.inkSoft, fontWeight: '700', fontSize: 13 },
});
