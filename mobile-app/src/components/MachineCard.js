import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radius, shadow } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { groupStatus, openUnitCount, soonestUnit } from '../data/gymData';

export default function MachineCard({ machine, onPress }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const cardWidth = (width - 48 - 12) / 2;
  const illustrationHeight = Math.round(cardWidth * 0.42);
  const nameFontSize   = Math.min(13, Math.max(10, Math.round(cardWidth * 0.085)));
  const labelFontSize  = Math.min(11, Math.max(9,  Math.round(cardWidth * 0.07)));
  const svgSize        = Math.min(44, Math.max(28, Math.round(cardWidth * 0.3)));

  const { name, queue, bgColor, svgPath, units } = machine;
  const totalUnits = units.length;
  const open = openUnitCount(machine);
  const status = groupStatus(machine);
  const soonest = soonestUnit(machine);

  const statusColor = status === 'free' ? colors.low
    : status === 'almost'               ? colors.moderate
    :                                     colors.high;

  const pillBg = status === 'free'   ? '#DCFCE7'
    : status === 'almost'            ? '#FEF3C7'
    :                                  '#FEE2E2';

  // Grouped labels: show how many of the group are open / next-free estimate
  const pillText = status === 'free'
    ? `${open} of ${totalUnits} open`
    : status === 'almost'
    ? 'Finishing up'
    : 'All in use';

  const subLabel = status === 'free'
    ? 'Available now'
    : soonest
    ? `Next free: ~${soonest.setsLeft} set${soonest.setsLeft !== 1 ? 's' : ''}`
    : '';

  const borderColor = statusColor;

  return (
    <Pressable
      onPress={() => onPress(machine)}
      style={({ pressed }) => [
        styles.card,
        { borderColor },
        pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
      ]}
    >
      {/* Illustration */}
      <View style={[styles.illustration, { height: illustrationHeight, backgroundColor: bgColor }]}>
        <Svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#555"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d={svgPath} />
        </Svg>

        {/* Status dot */}
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />

        {/* Unit count badge (total machines in this group) */}
        <View style={[styles.unitBadge, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
          <Text style={styles.unitBadgeText}>×{totalUnits}</Text>
        </View>

        {/* Queue count badge */}
        {queue.length > 0 && (
          <View style={[styles.queueBadge, { backgroundColor: theme.accent }]}>
            <Text style={styles.queueBadgeText}>{queue.length}</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={[styles.machineName, { fontSize: nameFontSize }]} numberOfLines={1}>
          {name}
        </Text>
        <View style={[styles.pill, { backgroundColor: pillBg }]}>
          <Text style={[styles.pillText, { fontSize: labelFontSize, color: statusColor }]}>
            {pillText}
          </Text>
        </View>
        {!!subLabel && (
          <Text style={[styles.subLabel, { fontSize: labelFontSize }]} numberOfLines={1}>
            {subLabel}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...shadow.card,
  },
  illustration: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    top: 8, left: 8,
    width: 9, height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  queueBadge: {
    position: 'absolute',
    top: 7, right: 8,
    width: 20, height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  unitBadge: {
    position: 'absolute',
    bottom: 6, right: 8,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8,
  },
  unitBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  body: { padding: 9 },
  machineName: { fontWeight: '700', color: colors.ink, marginBottom: 3 },
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radius.pill,
    marginBottom: 3,
  },
  pillText: { fontWeight: '700' },
  subLabel: { color: colors.inkSoft },
});
