import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from './Logo';
import { colors, fonts, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';

/**
 * Top bar: RepsIn logo, tappable avatar on the right.
 * Tapping the avatar opens the Profile screen.
 */
export default function AppHeader({ onAvatarPress }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { profile, initials } = useProfile();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }]}>
      <View style={styles.left}>
        <View style={[styles.logo, { backgroundColor: theme.accent }]}>
          <Logo size={24} color="#fff" />
        </View>
      </View>

      <Pressable
        onPress={onAvatarPress}
        hitSlop={8}
        style={({ pressed }) => [
          styles.avatar,
          { borderColor: theme.accent },
          pressed && { opacity: 0.7 },
        ]}
      >
        {profile.avatarUri ? (
          <Image source={{ uri: profile.avatarUri }} style={styles.avatarImg} />
        ) : (
          <View style={[styles.avatarFill, { backgroundColor: theme.accent }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
      </Pressable>
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
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  bolt: { fontSize: 18, color: '#fff' },
  word: { fontFamily: fonts.serif, fontSize: 26, color: colors.ink },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFill: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
