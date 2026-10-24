import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, type, spacing, radius, shadow, gradients } from '../theme/theme';

/** Small uppercase tracking label. */
export function Label({ children, muted, style }) {
  return <Text style={[muted ? type.labelMuted : type.label, style]}>{children}</Text>;
}

/** Thin hairline divider. */
export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

/** Primary pill button (white on purple, or purple on white). */
export function Button({ label, onPress, variant = 'solid', icon, style }) {
  const solid = variant === 'solid';
  const light = variant === 'light';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        solid && styles.btnSolid,
        light && styles.btnLight,
        variant === 'ghost' && styles.btnGhost,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          solid && { color: colors.onPurple },
          light && { color: colors.purple },
          variant === 'ghost' && { color: colors.purple },
        ]}
      >
        {label}
      </Text>
      {icon ? <Text style={[styles.btnIcon, light && { color: colors.purple }, solid && { color: colors.onPurple }]}>{icon}</Text> : null}
    </Pressable>
  );
}

/** Rounded pill chip, optionally selectable. */
export function Chip({ label, selected, onPress, style }) {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected, style]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Comp>
  );
}

/** Gradient icon tile used in equipment lists. */
export function IconTile({ glyph = 'square', size = 56 }) {
  return (
    <LinearGradient
      colors={gradients.tile}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.tile, { width: size, height: size }]}
    >
      <View style={glyph === 'circle' ? styles.glyphCircle : glyph === 'bars' ? styles.glyphBarsWrap : styles.glyphSquare}>
        {glyph === 'bars' ? (
          <>
            <View style={[styles.bar, { height: 10 }]} />
            <View style={[styles.bar, { height: 18 }]} />
            <View style={[styles.bar, { height: 14 }]} />
          </>
        ) : null}
      </View>
    </LinearGradient>
  );
}

/** Thin progress line with track. */
export function ProgressLine({ value, width = '100%', color = colors.purple, height = 3 }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, { width, height, borderRadius: height }]}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline, marginVertical: spacing.lg },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  btnSolid: { backgroundColor: colors.purple },
  btnLight: { backgroundColor: colors.card, ...shadow.card },
  btnGhost: { backgroundColor: 'transparent', paddingVertical: 8, paddingHorizontal: 0 },
  btnText: { fontSize: 16, fontWeight: '700' },
  btnIcon: { fontSize: 16, fontWeight: '700', marginLeft: 8 },

  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'transparent',
  },
  chipSelected: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { fontSize: 14, color: colors.inkSoft, fontWeight: '600' },
  chipTextSelected: { color: colors.onPurple },

  tile: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  glyphSquare: { width: 20, height: 20, borderWidth: 2.5, borderColor: '#fff', borderRadius: 3 },
  glyphCircle: { width: 22, height: 22, borderWidth: 2.5, borderColor: '#fff', borderRadius: 11 },
  glyphBarsWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 4, backgroundColor: '#fff', borderRadius: 2 },

  track: { backgroundColor: colors.track, overflow: 'hidden' },
});
