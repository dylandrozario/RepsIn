import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PinIcon } from './Icons';
import { PressableScale } from '../motion/AnimatedComponents';
import { GYMS } from '../data/gymData';
import { colors, type, spacing, radius, shadow } from '../theme/theme';

/**
 * Prominent gym switcher with an inline expanding dropdown.
 * Reused on Home and Forecast. Calls onSelect(gym) when a gym is chosen.
 */
export default function GymDropdown({ gym, onSelect, style }) {
  const [open, setOpen] = useState(false);

  const pick = (g) => {
    setOpen(false);
    if (g.id !== gym?.id) onSelect?.(g);
  };

  return (
    <View style={style}>
      <PressableScale style={styles.card} onPress={() => setOpen((o) => !o)}>
        <PinIcon size={22} color={colors.purple} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.label}>YOUR GYM</Text>
          <Text style={styles.name} numberOfLines={1}>{gym?.name}</Text>
        </View>
        <Text style={[styles.caret, open && styles.caretOpen]}>⌄</Text>
      </PressableScale>

      {open ? (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {GYMS.map((g, i) => {
              const sel = g.id === gym?.id;
              return (
                <PressableScale
                  key={g.id}
                  onPress={() => pick(g)}
                  style={[styles.row, i < GYMS.length - 1 && styles.rowBorder, sel && styles.rowSel]}
                >
                  <PinIcon size={16} color={sel ? colors.purple : colors.inkFaint} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[type.bodyInk, sel && { color: colors.purple, fontWeight: '700' }]} numberOfLines={1}>
                      {g.name}
                    </Text>
                    <Text style={type.small} numberOfLines={1}>{g.address}</Text>
                  </View>
                  {sel ? <Text style={styles.check}>✓</Text> : null}
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.lg, ...shadow.card,
  },
  label: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700', color: colors.inkFaint },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 2 },
  caret: { color: colors.inkSoft, fontSize: 20, fontWeight: '700', paddingHorizontal: 4 },
  caretOpen: { color: colors.purple },

  dropdown: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    marginTop: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 4,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairlineSoft },
  rowSel: { backgroundColor: colors.purpleSoft, borderRadius: radius.md },
  check: { color: colors.purple, fontWeight: '800', fontSize: 16, marginLeft: spacing.sm },
});
