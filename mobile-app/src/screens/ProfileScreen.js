import React, { useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import { Label, Divider, Button } from '../components/UI';
import { PressableScale, FadeInView } from '../motion/AnimatedComponents';
import { stagger } from '../motion/motion';
import { useAuth } from '../auth/AuthContext';
import { colors, type, fonts, spacing, radius, shadow } from '../theme/theme';
import { formatHour } from '../services/recommendationEngine';
import {
  getWeekSummary, getStreak, getHistory, getScheduled, rescheduleWorkout,
  nextDateForWeekday,
} from '../services/workoutStore';

export default function ProfileScreen({ navigation }) {
  const { profile, user, signOut } = useAuth();
  const [week, setWeek] = useState({ goal: 3, completed: 0 });
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState([]);
  const [missed, setMissed] = useState([]);

  const reload = useCallback(async () => {
    const [summary, stk, hist, scheduled] = await Promise.all([
      getWeekSummary(), getStreak(), getHistory(), getScheduled(),
    ]);
    setWeek(summary);
    setStreak(stk);
    setHistory(hist.slice(0, 10));
    setMissed(scheduled.filter((s) => s.status === 'missed'));
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Sign out of RepsIn?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const rebook = useCallback(async (w) => {
    // Push the missed workout to its next occurrence this/next week.
    const date = nextDateForWeekday(w.weekday, new Date());
    await rescheduleWorkout(w.id, { date, weekday: w.weekday, hour: w.hour });
    await reload();
    Alert.alert('Rescheduled', `Moved to ${w.weekday} at ${formatHour(w.hour)}. No worries — life happens.`);
  }, [reload]);

  const initials = (profile?.name || 'A')
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Screen>
      <View style={{ height: spacing.xl }} />
      <Label>Your account</Label>
      <Text style={[type.h1, { marginTop: 6 }]}>Profile</Text>

      <FadeInView delay={stagger(0)} style={styles.card}>
        {profile?.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: spacing.lg }}>
          <Text style={type.h3} numberOfLines={1}>{profile?.name || 'Athlete'}</Text>
          <Text style={type.small} numberOfLines={1}>{profile?.email || '—'}</Text>
        </View>
      </FadeInView>

      {/* Edit profile → preferences, gym, and app theme color */}
      <View style={{ marginTop: spacing.md }}>
        <Button
          label="Edit profile & preferences"
          variant="light"
          onPress={() => navigation.navigate('EditProfile')}
        />
      </View>

      {/* consistency stats */}
      <FadeInView delay={stagger(1)} style={styles.statsRow}>
        <Stat value={`🔥 ${streak}`} label="week streak" />
        <Stat value={`${week.completed}/${week.goal}`} label="this week" />
        <Stat value={`${history.length}`} label="recent" />
      </FadeInView>

      {/* missed → reschedule */}
      {missed.length ? (
        <FadeInView delay={stagger(2)}>
          <Divider />
          <Label muted>Missed — reschedule anytime</Label>
          {missed.slice(0, 3).map((w) => (
            <View key={w.id} style={styles.missedRow}>
              <View style={{ flex: 1 }}>
                <Text style={type.bodyInk}>{w.templateName}</Text>
                <Text style={type.small}>was {w.weekday} · {formatHour(w.hour)}</Text>
              </View>
              <PressableScale onPress={() => rebook(w)} style={styles.rebookBtn}>
                <Text style={styles.rebookText}>Reschedule</Text>
              </PressableScale>
            </View>
          ))}
        </FadeInView>
      ) : null}

      {/* history */}
      <FadeInView delay={stagger(3)}>
        <Divider />
        <Label muted>Workout history</Label>
        {history.length === 0 ? (
          <Text style={[type.small, { marginTop: spacing.md }]}>
            No completed workouts yet. Plan one from Home and mark it done to start your streak.
          </Text>
        ) : (
          <View style={{ marginTop: spacing.md }}>
            {history.map((w, idx) => (
              <View key={w.id || idx}>
                <View style={styles.histRow}>
                  <View style={styles.histDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={type.bodyInk}>{w.templateName}</Text>
                    <Text style={type.small}>
                      {new Date(w.completedAt || w.date).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })} · {w.duration} min
                    </Text>
                  </View>
                  <Text style={styles.histDone}>Done</Text>
                </View>
                {idx < history.length - 1 ? <Divider style={{ marginVertical: spacing.md }} /> : null}
              </View>
            ))}
          </View>
        )}
      </FadeInView>

      <Divider />
      <Label muted>Signed in via</Label>
      <Text style={[type.bodyInk, { marginTop: 6 }]}>{providerLabel(user)}</Text>

      <View style={{ height: spacing.xxl }} />
      <Button label="Sign out" variant="light" onPress={confirmSignOut} />
      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

function providerLabel(user) {
  const p = user?.app_metadata?.provider;
  if (p === 'google') return 'Google';
  if (p === 'email') return 'Email';
  return 'Email'; // sensible default
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.lg, marginTop: spacing.lg, ...shadow.card,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.cardSunken },
  avatarFallback: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: colors.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: '#fff', fontSize: 20, fontWeight: '700', fontFamily: fonts.serif },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  stat: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    paddingVertical: spacing.lg, alignItems: 'center', ...shadow.card,
  },
  statValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink },
  statLabel: { fontSize: 11, color: colors.inkSoft, fontWeight: '600', marginTop: 2 },

  missedRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.md },
  rebookBtn: {
    backgroundColor: colors.purpleSoft, borderRadius: radius.pill,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  rebookText: { color: colors.purple, fontWeight: '700', fontSize: 13 },

  histRow: { flexDirection: 'row', alignItems: 'center' },
  histDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.low, marginRight: spacing.md },
  histDone: { color: colors.low, fontWeight: '700', fontSize: 13 },
});
