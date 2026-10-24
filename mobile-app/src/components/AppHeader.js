import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from './Logo';
import { colors, fonts, spacing } from '../theme/theme';

/** Top bar: RepsIn logo, avatar on the right. */
export default function AppHeader({ initials = 'AM' }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }]}>
      <View style={styles.left}>
        <View style={styles.logo}>
          <Logo size={24} color="#fff" />
        </View>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.purple,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  bolt: { fontSize: 18, color: '#fff' },
  word: { fontFamily: fonts.serif, fontSize: 26, color: colors.ink },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: colors.inkSoft },
});
