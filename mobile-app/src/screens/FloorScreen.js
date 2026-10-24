import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, Pressable,
  StyleSheet, Alert, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadow, fonts } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useGym } from '../context/GymContext';
import { useSession } from '../context/SessionContext';
import { zonesForGym, groupStatus } from '../data/gymData';
import MachineCard from '../components/MachineCard';
import QueueSheet from '../components/QueueSheet';
import ForecastSection from '../components/ForecastSection';

function StatBox({ value, label, color }) {
  const { width } = useWindowDimensions();
  const valSize = Math.min(24, Math.max(18, Math.round(width * 0.055)));
  return (
    <View style={[styles.statBox, shadow.card]}>
      <Text style={[styles.statVal, { color, fontSize: valSize }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function FloorScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { gym } = useGym();
  const {
    floor, activeMachineId, checkIn, joinQueue, leaveQueue,
    grab, grabMachine, grabSecondsLeft,
  } = useSession();
  const { width } = useWindowDimensions();

  const ZONES = zonesForGym(gym.id);
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedId, setSelectedId] = useState(null);

  // Always read the live machine from session floor so the sheet stays current.
  const selectedMachine = selectedId != null ? floor.find((m) => m.id === selectedId) : null;

  const filtered = selectedZone === 'All' ? floor : floor.filter((m) => m.zone === selectedZone);

  const freeCount   = floor.filter((m) => groupStatus(m) === 'free').length;
  const almostCount = floor.filter((m) => groupStatus(m) === 'almost').length;
  const busyCount   = floor.filter((m) => groupStatus(m) === 'busy').length;

  const hPad = width < 375 ? spacing.lg : spacing.xl;
  const titleSize = Math.min(26, Math.max(20, Math.round(width * 0.063)));
  const subtitleSize = Math.min(14, Math.max(11, Math.round(width * 0.034)));

  // ── Actions bridged to the session ──
  const handleCheckIn = useCallback((machine, sets) => {
    const ok = checkIn(machine.id, sets);
    setSelectedId(null);
    if (ok) {
      // Redirect to the Workout tab and jump straight into logging this machine.
      navigation.navigate('Workout', { activeCheckIn: machine.id, ts: Date.now() });
    }
    return ok;
  }, [checkIn, navigation]);

  const handleJoinQueue = useCallback((machine) => {
    joinQueue(machine.id, theme.accent); // sheet stays open
  }, [joinQueue, theme.accent]);

  const handleLeaveQueue = useCallback((machine) => {
    leaveQueue(machine.id);
  }, [leaveQueue]);

  const handleWorkIn = useCallback((machine) => {
    const inUse = machine.units.filter((u) => u.user && !u.isMe);
    const who = inUse.length ? inUse[0].user : 'the current user';
    Alert.alert('Work-in request sent', `${who} will be notified that you'd like to share a ${machine.name}.`, [{ text: 'OK' }]);
  }, []);

  const renderItem = useCallback(({ item, index }) => {
    if (index % 2 !== 0) return null;
    const right = filtered[index + 1];
    return (
      <View style={[styles.gridRow, { marginHorizontal: hPad }]}>
        <View style={{ flex: 1 }}>
          <MachineCard machine={item} onPress={() => setSelectedId(item.id)} />
        </View>
        <View style={{ width: spacing.md }} />
        {right ? (
          <View style={{ flex: 1 }}>
            <MachineCard machine={right} onPress={() => setSelectedId(right.id)} />
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </View>
    );
  }, [filtered, hPad]);

  const ListHeader = (
    <View style={{ paddingHorizontal: hPad }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { fontSize: titleSize }]}>Availability</Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize }]} numberOfLines={1}>
            {gym.name} · Now
          </Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: theme.accentSoft, borderColor: `${theme.accent}55` }]}>
          <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.liveText, { color: theme.accentBright }]}>LIVE</Text>
        </View>
      </View>

      {/* Active-workout banner */}
      {activeMachineId != null && (
        <Pressable
          style={[styles.banner, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}
          onPress={() => navigation.navigate('Workout')}
        >
          <Text style={[styles.bannerTitle, { color: theme.accentBright }]}>
            🏋️ You're working out on {floor.find((m) => m.id === activeMachineId)?.name}
          </Text>
          <Text style={styles.bannerSub}>Tap to log sets · you can't start another machine until you finish</Text>
        </Pressable>
      )}

      {/* Grab-window banner */}
      {grab && grabMachine && (
        <View style={[styles.grabBanner, { borderColor: colors.moderate }]}>
          <Text style={styles.grabTitle}>⏳ {grabMachine.name} is open — it's your turn!</Text>
          <Text style={styles.grabSub}>
            Claim it within {Math.floor(grabSecondsLeft / 60)}:{String(grabSecondsLeft % 60).padStart(2, '0')} or it passes to the next person.
          </Text>
          <Pressable
            style={[styles.grabBtn, { backgroundColor: theme.accent }]}
            onPress={() => setSelectedId(grab.machineId)}
          >
            <Text style={styles.grabBtnText}>Claim Machine</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.statsRow}>
        <StatBox value={freeCount}   label="Open" color={colors.low} />
        <StatBox value={almostCount} label="Soon" color={colors.moderate} />
        <StatBox value={busyCount}   label="Busy" color={colors.high} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.zoneRow}
        style={styles.zoneScroll}
      >
        {ZONES.map((zone) => {
          const active = zone === selectedZone;
          return (
            <Pressable
              key={zone}
              onPress={() => setSelectedZone(zone)}
              style={[styles.zoneChip, active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            >
              <Text style={[styles.zoneChipText, active && styles.zoneChipTextActive]}>{zone}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.sectionLabel, { color: theme.accent }]}>Equipment Status</Text>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={filtered}
        keyExtractor={(m) => String(m.id)}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          <View style={{ paddingHorizontal: hPad }}>
            <ForecastSection />
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        extraData={[floor, selectedZone, theme.accent, activeMachineId, grab]}
      />

      <QueueSheet
        machine={selectedMachine}
        activeMachineId={activeMachineId}
        onClose={() => setSelectedId(null)}
        onCheckIn={handleCheckIn}
        onJoinQueue={handleJoinQueue}
        onLeaveQueue={handleLeaveQueue}
        onWorkIn={handleWorkIn}
        onGoToWorkout={() => navigation.navigate('Workout')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: spacing.md, marginBottom: spacing.lg,
  },
  title: { fontWeight: '800', color: colors.ink, fontFamily: fonts.serif },
  subtitle: { color: colors.inkSoft, marginTop: 2 },

  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: radius.pill, borderWidth: 1, flexShrink: 0,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },

  banner: {
    borderWidth: 1.5, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  bannerTitle: { fontSize: 14, fontWeight: '700' },
  bannerSub: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },

  grabBanner: {
    borderWidth: 1.5, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg,
    backgroundColor: '#FFF7ED',
  },
  grabTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  grabSub: { fontSize: 12, color: colors.inkSoft, marginTop: 2, marginBottom: spacing.sm },
  grabBtn: { borderRadius: radius.pill, paddingVertical: 10, alignItems: 'center' },
  grabBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statBox: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  statVal: { fontWeight: '800' },
  statLabel: {
    fontSize: 10, color: colors.inkSoft, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2,
  },

  zoneScroll: { marginBottom: spacing.md },
  zoneRow: { gap: spacing.sm, paddingRight: spacing.xl },
  zoneChip: {
    paddingVertical: 9, paddingHorizontal: 16,
    borderRadius: radius.pill, borderWidth: 1.5,
    borderColor: colors.hairline, backgroundColor: colors.card,
  },
  zoneChipText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  zoneChipTextActive: { color: '#fff', fontWeight: '700' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: spacing.md,
  },

  gridRow: { flexDirection: 'row', marginBottom: spacing.md },
});
