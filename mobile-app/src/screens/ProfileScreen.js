import React from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, type, fonts, spacing, radius, shadow } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';
import { useGym } from '../context/GymContext';
import { FITNESS_GOALS, EXPERIENCE_LEVELS } from '../data/gymData';

function labelFor(list, id, fallback) {
  const found = list.find((x) => x.id === id);
  return found ? found.label : fallback;
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { profile, initials } = useProfile();
  const { gym } = useGym();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>Profile</Text>
        <Pressable onPress={() => navigation.navigate('EditProfile')} hitSlop={10}>
          <Text style={[styles.editText, { color: theme.accent }]}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + 40 }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { borderColor: theme.accent }]}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarFill, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.lg }}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.handle}>@{profile.username}</Text>
          </View>
        </View>

        {/* This week stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, shadow.card]}>
            <Text style={[styles.statVal, { color: theme.accent }]}>4</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={[styles.statBox, shadow.card]}>
            <Text style={[styles.statVal, { color: theme.accent }]}>67</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
          <View style={[styles.statBox, shadow.card]}>
            <Text style={[styles.statVal, { color: theme.accent }]}>3h 2m</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>

        {/* Gym */}
        <Text style={styles.section}>Current gym</Text>
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.gymName}>{gym.name}</Text>
          <Text style={styles.gymAddr}>{gym.address}</Text>
        </View>

        {/* Goals & prefs */}
        <Text style={styles.section}>Goals & preferences</Text>
        <View style={[styles.card, shadow.card]}>
          <Row label="Goal" value={labelFor(FITNESS_GOALS, profile.goal, 'Strength')} />
          <Row label="Experience" value={labelFor(EXPERIENCE_LEVELS, profile.experience, 'Intermediate')} />
          <Row label="Session length" value={`${profile.duration} min`} />
          <Row label="Weekly goal" value={`${profile.weeklyTarget}×/week`} />
        </View>

        {/* Edit CTA */}
        <Pressable
          onPress={() => navigation.navigate('EditProfile')}
          style={[styles.editBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  navBtn: { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  navBtnText: { fontSize: 32, color: colors.ink, lineHeight: 34 },
  navTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  editText: { fontSize: 16, fontWeight: '700' },

  hero: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 68, height: 68, borderRadius: 34, borderWidth: 2.5,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFill: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 26, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink, fontFamily: fonts.serif },
  handle: { fontSize: 14, color: colors.inkSoft, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statBox: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: colors.inkSoft, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  section: {
    fontSize: 11.5, fontWeight: '700', letterSpacing: 1.1, color: colors.inkFaint,
    textTransform: 'uppercase', marginBottom: spacing.sm, marginTop: spacing.lg,
  },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.hairline },
  gymName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  gymAddr: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairlineSoft,
  },
  rowLabel: { fontSize: 13, color: colors.inkSoft },
  rowValue: { fontSize: 13, fontWeight: '700', color: colors.ink },

  editBtn: { marginTop: spacing.xl, borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center' },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
