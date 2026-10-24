import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, Image, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, type, fonts, spacing, radius, shadow } from '../theme/theme';
import { useTheme, THEME_PRESETS } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';
import { useGym } from '../context/GymContext';
import {
  FITNESS_GOALS, EXPERIENCE_LEVELS, WORKOUT_DURATIONS,
} from '../data/gymData';

const WEEKLY_TARGETS = [2, 3, 4, 5, 6];

// Try to load expo-image-picker lazily; gracefully degrade if unavailable.
let ImagePicker = null;
try { ImagePicker = require('expo-image-picker'); } catch { ImagePicker = null; }

/** Section heading */
function Section({ children }) {
  return <Text style={styles.section}>{children}</Text>;
}

/** Selectable chip */
function Chip({ label, selected, onPress, accent }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: accent, borderColor: accent },
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, setThemeById } = useTheme();
  const { profile, updateProfile, initials } = useProfile();
  const { gym, gyms, setGymById } = useGym();

  // Local draft state
  const [name, setName]         = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [avatarUri, setAvatarUri] = useState(profile.avatarUri);
  const [goal, setGoal]         = useState(profile.goal);
  const [experience, setExperience] = useState(profile.experience);
  const [duration, setDuration] = useState(profile.duration);
  const [weeklyTarget, setWeeklyTarget] = useState(profile.weeklyTarget);
  const [gymId, setGymId]       = useState(gym.id);
  const [themeId, setThemeIdLocal] = useState(theme.id);

  const pickImage = useCallback(async () => {
    if (!ImagePicker) {
      Alert.alert('Photo upload', 'Image library isn\'t available in this build. You can still set an avatar color below.');
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setAvatarUri(res.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Could not open photos', 'Try again, or set an avatar color below.');
    }
  }, []);

  const save = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    updateProfile({
      name: name.trim(),
      username: username.trim(),
      avatarUri,
      goal,
      experience,
      duration,
      weeklyTarget,
    });
    if (gymId !== gym.id) setGymById(gymId);
    if (themeId !== theme.id) setThemeById(themeId);
    navigation.goBack();
  }, [name, username, avatarUri, goal, experience, duration, weeklyTarget, gymId, themeId, gym.id, theme.id]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your profile, workout history, and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account deleted', 'Goodbye 👋') },
      ]
    );
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={[styles.navBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>Edit Profile</Text>
        <Pressable onPress={save} hitSlop={10}>
          <Text style={[styles.saveText, { color: theme.accent }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + 40 }}
      >
        {/* Avatar */}
        <View style={styles.avatarRow}>
          <Pressable onPress={pickImage} style={[styles.avatarBig, { borderColor: theme.accent }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarFill, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={pickImage}>
            <Text style={[styles.changePhoto, { color: theme.accent }]}>Change photo</Text>
          </Pressable>
        </View>

        {/* Name */}
        <Section>Name</Section>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
        />

        {/* Username */}
        <Section>Username</Section>
        <View style={styles.usernameWrap}>
          <Text style={styles.at}>@</Text>
          <TextInput
            value={username}
            onChangeText={(t) => setUsername(t.replace(/\s/g, '').toLowerCase())}
            placeholder="username"
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="none"
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0, paddingLeft: 0 }]}
          />
        </View>

        {/* Gym location */}
        <Section>Gym location</Section>
        {gyms.map((g) => {
          const selected = g.id === gymId;
          return (
            <Pressable
              key={g.id}
              onPress={() => setGymId(g.id)}
              style={[styles.gymCard, selected && { borderColor: theme.accent, borderWidth: 2 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.gymName}>{g.name}</Text>
                <Text style={styles.gymAddr}>{g.address}</Text>
              </View>
              <View style={[styles.radio, selected && { borderColor: theme.accent }]}>
                {selected && <View style={[styles.radioDot, { backgroundColor: theme.accent }]} />}
              </View>
            </Pressable>
          );
        })}

        {/* Goal */}
        <Section>Goal</Section>
        <View style={styles.chipWrap}>
          {FITNESS_GOALS.map((g) => (
            <Chip key={g.id} label={`${g.icon} ${g.label}`} selected={goal === g.id} onPress={() => setGoal(g.id)} accent={theme.accent} />
          ))}
        </View>

        {/* Experience */}
        <Section>Experience</Section>
        <View style={styles.chipWrap}>
          {EXPERIENCE_LEVELS.map((e) => (
            <Chip key={e.id} label={e.label} selected={experience === e.id} onPress={() => setExperience(e.id)} accent={theme.accent} />
          ))}
        </View>

        {/* Session length */}
        <Section>Session length</Section>
        <View style={styles.chipWrap}>
          {WORKOUT_DURATIONS.map((d) => (
            <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} accent={theme.accent} />
          ))}
        </View>

        {/* Weekly workout target */}
        <Section>Weekly workout goal</Section>
        <View style={styles.chipWrap}>
          {WEEKLY_TARGETS.map((w) => (
            <Chip key={w} label={`${w}×/week`} selected={weeklyTarget === w} onPress={() => setWeeklyTarget(w)} accent={theme.accent} />
          ))}
        </View>

        {/* App theme color */}
        <Section>App color theme</Section>
        <View style={styles.swatchRow}>
          {THEME_PRESETS.map((p) => {
            const selected = p.id === themeId;
            return (
              <Pressable
                key={p.id}
                onPress={() => setThemeIdLocal(p.id)}
                style={[
                  styles.swatch,
                  { backgroundColor: p.accent },
                  selected && styles.swatchActive,
                ]}
              >
                {selected && <Text style={styles.swatchCheck}>✓</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* Save */}
        <Pressable onPress={save} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </Pressable>

        <View style={styles.divider} />

        {/* Danger zone */}
        <Text style={[styles.section, { color: colors.high }]}>Danger zone</Text>
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Delete account</Text>
          <Text style={styles.dangerBody}>
            Permanently deletes your profile, workout history, and all data. This cannot be undone.
          </Text>
          <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>Delete My Account</Text>
          </Pressable>
        </View>
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
  saveText: { fontSize: 16, fontWeight: '700' },

  avatarRow: { alignItems: 'center', marginBottom: spacing.xl, gap: 8 },
  avatarBig: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 2.5,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFill: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: '#fff' },
  changePhoto: { fontSize: 13, fontWeight: '700' },

  section: {
    fontSize: 11.5, fontWeight: '700', letterSpacing: 1.1, color: colors.inkFaint,
    textTransform: 'uppercase', marginBottom: spacing.sm, marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 15, fontWeight: '600', color: colors.ink,
    marginBottom: spacing.sm,
  },
  usernameWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.hairline,
    borderRadius: radius.md, paddingLeft: 14, paddingRight: 8,
  },
  at: { fontSize: 15, color: colors.inkSoft, fontWeight: '600', marginRight: 2 },

  gymCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.hairline,
    borderRadius: radius.md, padding: 14, marginBottom: spacing.sm,
    ...shadow.card,
  },
  gymName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  gymAddr: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 11, height: 11, borderRadius: 6 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 9, paddingHorizontal: 15,
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.hairline,
    backgroundColor: colors.card,
  },
  chipText: { fontSize: 13, color: colors.inkSoft, fontWeight: '600' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },

  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'transparent',
  },
  swatchActive: { borderColor: colors.ink, transform: [{ scale: 1.1 }] },
  swatchCheck: { color: '#fff', fontSize: 16, fontWeight: '800' },

  saveBtn: {
    marginTop: spacing.xl, borderRadius: radius.pill,
    paddingVertical: 15, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline, marginVertical: spacing.xl },

  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA',
    borderRadius: radius.md, padding: 16,
  },
  dangerTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  dangerBody: { fontSize: 12, color: colors.inkSoft, lineHeight: 18, marginBottom: 12 },
  deleteBtn: {
    backgroundColor: '#FEE2E2', borderWidth: 1.5, borderColor: '#FECACA',
    borderRadius: radius.pill, paddingVertical: 11, alignItems: 'center',
  },
  deleteBtnText: { color: colors.high, fontSize: 14, fontWeight: '700' },
});
