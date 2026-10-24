import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius, shadow, gradients } from '../theme/theme';
import { ClockIcon } from './Icons';

/**
 * Signature "best window" hero card.
 * Purple -> peach gradient, concentric circle motif, a match ring, and a CTA.
 * When `fillScreen` is set, the card expands to the full viewport height with
 * a profile avatar in the top-right corner.
 */
export default function HeroCard({
  kicker = 'Your best window',
  time = '5:30 PM',
  blurb = 'Train with less waiting, in the time you already have.',
  duration = '45 min',
  fullPct = '~3 min wait',
  match = 92,
  footer = 'REPSIN / SESSION 02',
  ctaLabel = 'View workout',
  onPress,
  fillScreen = false,
  initials = 'AM',
  onPressProfile,
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      locations={[0, 0.4, 0.75, 1]}
      style={[
        styles.card,
        shadow.card,
        fillScreen && { borderRadius: 0, flex: 1, paddingTop: insets.top + spacing.lg },
      ]}
    >
      {/* concentric circle motif */}
      <View pointerEvents="none" style={styles.ringsWrap}>
        <View style={[styles.ring, { width: 320, height: 320, opacity: 0.12 }]} />
        <View style={[styles.ring, { width: 230, height: 230, opacity: 0.14 }]} />
      </View>

      {/* profile avatar, top-right */}
      <Pressable
        onPress={onPressProfile}
        style={[styles.avatar, fillScreen && { top: insets.top + spacing.lg }]}
      >
        <Text style={styles.avatarText}>{initials}</Text>
      </Pressable>

      <Text style={styles.kicker}>{kicker.toUpperCase()}</Text>
      <Text style={styles.time}>{time}</Text>
      <Text style={styles.blurb}>{blurb}</Text>

      <View style={styles.metaRow}>
        <ClockIcon size={16} color="#fff" strokeWidth={2} />
        <Text style={[styles.meta, { marginLeft: 10 }]}>{duration}</Text>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.dot} />
        <Text style={styles.meta}>{fullPct}</Text>
      </View>

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
      >
        <Text style={styles.ctaText}>{ctaLabel}</Text>
        <Text style={styles.ctaArrow}>→</Text>
      </Pressable>

      <View style={styles.bottomRow}>
        <View style={{ flex: 1 }} />
        <View style={styles.matchRing}>
          <Text style={styles.matchNum}>{match}</Text>
          <Text style={styles.matchLabel}>% FIT</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    overflow: 'hidden',
    minHeight: 480,
  },
  ringsWrap: { position: 'absolute', right: -40, top: 70, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1.5, borderColor: '#fff' },

  avatar: {
    position: 'absolute',
    right: spacing.xl,
    top: spacing.xl,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  kicker: { color: 'rgba(255,255,255,0.85)', fontSize: 12, letterSpacing: 1.4, fontWeight: '700', marginBottom: 6 },
  time: { fontFamily: fonts.serif, color: '#fff', fontSize: 76, lineHeight: 82, marginBottom: 14 },
  blurb: { color: 'rgba(255,255,255,0.92)', fontSize: 16, lineHeight: 23, maxWidth: '82%', marginBottom: 22 },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  metaIcon: { fontSize: 14, marginRight: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginRight: 12, marginLeft: 3 },
  meta: { color: '#fff', fontSize: 15, fontWeight: '600' },

  cta: {
    marginTop: 18,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 26,
    borderRadius: radius.pill,
  },
  ctaText: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  ctaArrow: { color: colors.ink, fontSize: 16, fontWeight: '700', marginLeft: 12 },

  bottomRow: { marginTop: 'auto', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 28 },
  footer: { color: 'rgba(255,255,255,0.85)', fontSize: 11, letterSpacing: 1.2, fontWeight: '700' },
  matchRing: {
    width: 86, height: 86, borderRadius: 43,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  matchNum: { fontFamily: fonts.serif, color: '#fff', fontSize: 30, lineHeight: 32 },
  matchLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginTop: 2 },
});
