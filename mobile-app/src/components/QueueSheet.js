import React, { useState } from 'react';
import {
  View, Text, Pressable, Modal, StyleSheet,
  TouchableWithoutFeedback, ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, type, spacing, radius, shadow } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { groupStatus, openUnitCount, soonestUnit } from '../data/gymData';

/** Small avatar circle */
function Avatar({ initials, color, size = 36 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

/** Sets stepper for check-in */
function SetStepper({ value, onChange }) {
  const { theme } = useTheme();
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(1, value - 1))}
        style={[styles.stepBtn, { borderColor: colors.hairline }]}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={[styles.stepValue, { color: theme.accent }]}>{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(10, value + 1))}
        style={[styles.stepBtn, { borderColor: colors.hairline }]}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

/**
 * Bottom sheet showing machine detail, current user, queue, and actions.
 * Props:
 *   machine — the floor machine object (or null to hide)
 *   onClose — called when sheet is dismissed
 *   onCheckIn(machine, sets) — called when user checks in on a free machine
 *   onJoinQueue(machine) — called when user joins the queue
 *   onWorkIn(machine) — called when user requests to work in
 */
export default function QueueSheet({ machine, activeMachineId, onClose, onCheckIn, onJoinQueue, onLeaveQueue, onWorkIn, onGoToWorkout }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [sets, setSets] = useState(3);

  if (!machine) return null;

  const { name, zone, queue, bgColor, svgPath, units, workInAllowed } = machine;
  const status = groupStatus(machine);
  const open = openUnitCount(machine);
  const totalUnits = units.length;
  const inUse = units.filter((u) => u.user);
  const soonest = soonestUnit(machine);
  const statusColor = status === 'free' ? colors.low : status === 'almost' ? colors.moderate : colors.high;
  const alreadyQueued = queue.some((q) => q.isMe);

  // One-at-a-time enforcement
  const isMyActive = activeMachineId != null && activeMachineId === machine.id;
  const hasActiveElsewhere = activeMachineId != null && !isMyActive;

  return (
    <Modal visible={!!machine} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: bgColor }]}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d={svgPath} />
            </Svg>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.sheetTitle}>{name}</Text>
            <Text style={styles.sheetZone}>{zone} Zone</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status === 'free' ? '#DCFCE7' : status === 'almost' ? '#FEF3C7' : '#FEE2E2' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {status === 'free' ? `${open} open` : status === 'almost' ? 'Almost' : 'All in use'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {isMyActive ? (
            /* ── You're ALREADY working out on this machine → no check-in, no queue ── */
            <View>
              <Text style={[styles.freeMsg, { color: theme.accent }]}>
                🏋️ You're working out here right now.
              </Text>
              <View style={styles.blockCard}>
                <Text style={styles.blockText}>
                  You're checked in on this machine. Head to the Workout tab to log your
                  sets. You can't start another workout or join the queue on a machine
                  you're already using.
                </Text>
              </View>
              <Pressable
                style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: spacing.md }]}
                onPress={() => { onClose(); onGoToWorkout && onGoToWorkout(); }}
              >
                <Text style={styles.btnPrimaryText}>Go to My Workout</Text>
              </Pressable>
            </View>
          ) : status === 'free' && hasActiveElsewhere ? (
            /* ── FREE but you're already on another machine → blocked ── */
            <View>
              <Text style={[styles.freeMsg, { color: colors.inkSoft }]}>
                {open} of {totalUnits} open here.
              </Text>
              <View style={styles.blockCard}>
                <Text style={styles.blockText}>
                  You're already working out on another machine. Finish your current
                  workout before starting here — you can still join the queue.
                </Text>
              </View>
              {alreadyQueued ? (
                <Pressable style={[styles.btnLeave, { marginTop: spacing.md }]} onPress={() => onLeaveQueue(machine)}>
                  <Text style={styles.btnLeaveText}>Leave Queue</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: spacing.md }]}
                  onPress={() => onJoinQueue(machine)}
                >
                  <Text style={styles.btnPrimaryText}>🔔 Join Queue</Text>
                </Pressable>
              )}
            </View>
          ) : status === 'free' ? (
            /* ── FREE: at least one unit open → check-in flow (no queue) ── */
            <View>
              <Text style={styles.freeMsg}>
                ✓  {open} of {totalUnits} open — jump right in!
              </Text>
              <Text style={[type.labelMuted, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
                How many sets are you planning?
              </Text>
              <SetStepper value={sets} onChange={setSets} />
              <Pressable
                style={[styles.btnPrimary, { backgroundColor: theme.accent }]}
                onPress={() => { onCheckIn(machine, sets); /* navigation handles close */ }}
              >
                <Text style={styles.btnPrimaryText}>Check In · {sets} Sets</Text>
              </Pressable>
            </View>
          ) : (
            /* ── BUSY / ALMOST: all units in use → queue flow ── */
            <View>
              {/* Group summary */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Machines in use</Text>
                  <Text style={styles.infoValue}>{inUse.length} of {totalUnits}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Next one free in</Text>
                  <Text style={[styles.infoValue, { color: statusColor }]}>
                    {soonest ? `~${soonest.setsLeft} set${soonest.setsLeft !== 1 ? 's' : ''}` : '—'}
                  </Text>
                </View>
              </View>

              {/* Per-unit breakdown (so users see each machine's progress) */}
              <Text style={[type.labelMuted, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                Machines
              </Text>
              {inUse.map((u, i) => {
                const upct = u.totalSets > 0 ? (u.totalSets - u.setsLeft) / u.totalSets : 1;
                const uColor = u.setsLeft <= 1 ? colors.moderate : colors.high;
                return (
                  <View key={i} style={styles.unitRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.unitName}>{u.user}</Text>
                      <View style={styles.unitTrack}>
                        <View style={[styles.unitFill, { width: `${Math.round(upct * 100)}%`, backgroundColor: uColor }]} />
                      </View>
                    </View>
                    <Text style={[styles.unitSets, { color: uColor }]}>{u.setsLeft} left</Text>
                  </View>
                );
              })}

              {/* Queue */}
              {queue.length > 0 && (
                <View style={{ marginTop: spacing.lg }}>
                  <Text style={[type.labelMuted, { marginBottom: spacing.md }]}>
                    Queue ({queue.length})
                  </Text>
                  {queue.map((person) => (
                    <View key={person.id} style={styles.queueRow}>
                      <Avatar initials={person.initials} color={person.avatarColor} />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={styles.qName}>{person.name}{person.isMe ? ' (you)' : ''}</Text>
                        <Text style={styles.qSub}>{person.isMe ? 'Your spot is held' : 'Waiting'}</Text>
                      </View>
                      {person.openToWorkIn && workInAllowed && (
                        <View style={styles.workInBadge}>
                          <Text style={[styles.workInText, { color: theme.accent }]}>Open to work-in</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Actions — queue stays open after joining; Work In hidden for cardio */}
              {alreadyQueued ? (
                <View style={{ marginTop: spacing.xl }}>
                  <Text style={styles.queuedNote}>🔔 You're in the queue. We'll alert you when a machine frees up.</Text>
                  <Pressable
                    style={styles.btnLeave}
                    onPress={() => { onLeaveQueue(machine); }}
                  >
                    <Text style={styles.btnLeaveText}>Leave Queue</Text>
                  </Pressable>
                  {workInAllowed && (
                    <Pressable
                      style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: spacing.md }]}
                      onPress={() => { onWorkIn(machine); }}
                    >
                      <Text style={styles.btnPrimaryText}>🤝 Ask to Work In</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={workInAllowed ? styles.actionRow : { marginTop: spacing.xl }}>
                  <Pressable
                    style={workInAllowed ? styles.btnSecondary : [styles.btnPrimary, { backgroundColor: theme.accent }]}
                    onPress={() => { onJoinQueue(machine); /* keep sheet open */ }}
                  >
                    <Text style={workInAllowed ? styles.btnSecondaryText : styles.btnPrimaryText}>🔔 Join Queue</Text>
                  </Pressable>
                  {workInAllowed && (
                    <Pressable
                      style={[styles.btnPrimary, { flex: 1, backgroundColor: theme.accent }]}
                      onPress={() => { onWorkIn(machine); }}
                    >
                      <Text style={styles.btnPrimaryText}>🤝 Work In</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '85%',
    ...shadow.float,
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: colors.hairline,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 52, height: 52, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  sheetZone: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: radius.pill, gap: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline, marginBottom: spacing.lg },

  freeMsg: { fontSize: 15, fontWeight: '600', color: colors.low, marginTop: spacing.sm },

  stepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xl, marginVertical: spacing.xl,
  },
  stepBtn: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSunken,
  },
  stepBtnText: { fontSize: 24, color: colors.ink, lineHeight: 28 },
  stepValue: { fontSize: 52, fontWeight: '800', minWidth: 64, textAlign: 'center', lineHeight: 60 },

  infoCard: {
    backgroundColor: colors.cardSunken,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairlineSoft,
  },
  infoLabel: { fontSize: 13, color: colors.inkSoft },
  infoValue: { fontSize: 13, fontWeight: '700', color: colors.ink },
  progressTrack: { height: 4, backgroundColor: colors.track, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },

  unitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  unitName: { fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  unitTrack: { height: 4, backgroundColor: colors.track, borderRadius: 2, overflow: 'hidden' },
  unitFill: { height: 4, borderRadius: 2 },
  unitSets: { fontSize: 12, fontWeight: '700', width: 48, textAlign: 'right' },

  queuedNote: { fontSize: 13, color: colors.inkSoft, lineHeight: 19, marginBottom: spacing.md },

  blockCard: {
    marginTop: spacing.lg, padding: spacing.md,
    backgroundColor: '#FFF7ED', borderRadius: radius.md,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  blockText: { fontSize: 13, color: colors.inkSoft, lineHeight: 19 },

  queueRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.cardSunken,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  qName: { fontSize: 13, fontWeight: '600', color: colors.ink },
  qSub: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  workInBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  workInText: { fontSize: 11, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  btnPrimary: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: radius.pill,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: radius.pill,
    backgroundColor: colors.cardSunken,
    borderWidth: 1, borderColor: colors.hairline,
  },
  btnSecondaryDim: { opacity: 0.55 },
  btnSecondaryText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  btnLeave: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: radius.pill,
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA',
  },
  btnLeaveText: { fontSize: 15, fontWeight: '700', color: colors.high },
});
