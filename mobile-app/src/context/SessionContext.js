/**
 * SessionContext — the single live source of truth for the gym floor.
 *
 * Responsibilities:
 *  - Hold the live floor state (machine groups + their units + queues)
 *  - Track the user's ONE active machine (enforces one-at-a-time)
 *  - Run a background simulation so availability changes naturally
 *  - Manage the 2-minute "grab window" when a queued user reaches the front
 *
 * All floor mutations (check-in, queue, simulation) flow through here so the
 * Floor tab, Home outlook, and Workout tab always agree.
 */
import React, {
  createContext, useContext, useState, useEffect, useRef, useCallback,
} from 'react';
import { useGym } from './GymContext';
import { groupStatus, openUnitCount } from '../data/gymData';

const GRAB_WINDOW_MS = 120 * 1000; // 2 minutes to claim a freed machine

// Pool of fake member names the simulation cycles through.
const SIM_NAMES = [
  'Conor M.', 'Maeve R.', 'Liam F.', 'Nora K.', 'Aidan P.', 'Grace B.',
  'Finn O.', 'Erin C.', 'Dev S.', 'Ana P.', 'Rory B.', 'Cole D.',
  'Josie M.', 'Troy K.', 'Vera L.', 'Noah W.', 'Ivy R.', 'Max G.',
];
const QUEUE_NAMES = [
  { name: 'Sam K.', initials: 'SK', color: '#7C3AED' },
  { name: 'Jess P.', initials: 'JP', color: '#0284C7' },
  { name: 'Drew L.', initials: 'DL', color: '#BE185D' },
  { name: 'Robin T.', initials: 'RT', color: '#047857' },
  { name: 'Casey M.', initials: 'CM', color: '#EA580C' },
];

let simCounter = 0;
const randName = () => SIM_NAMES[Math.floor(Math.random() * SIM_NAMES.length)];

const SessionContext = createContext(null);

function cloneFloor(gym) {
  return gym.floor.map((m) => ({
    ...m,
    units: m.units.map((u) => ({ ...u })),
    queue: m.queue.map((q) => ({ ...q })),
  }));
}

export function SessionProvider({ children }) {
  const { gym } = useGym();

  const [floor, setFloor] = useState(() => cloneFloor(gym));
  const [activeMachineId, setActiveMachineId] = useState(null);
  // grab window: { machineId, expiresAt } when YOU are first in line for a freed slot
  const [grab, setGrab] = useState(null);
  const [now, setNow] = useState(Date.now());

  // ── Persistent workout plan ──
  // Lives here (not in WorkoutScreen) so completed exercises survive the
  // PlanView unmount that happens while you're in an active machine session.
  const [plan, setPlan] = useState(null);            // ordered exercises or null (not built yet)
  const planSigRef = useRef(null);                   // signature of the generated plan

  const floorRef = useRef(floor);
  floorRef.current = floor;
  const grabRef = useRef(grab);
  grabRef.current = grab;
  const activeRef = useRef(activeMachineId);
  activeRef.current = activeMachineId;

  // Reset everything when the gym changes.
  useEffect(() => {
    setFloor(cloneFloor(gym));
    setActiveMachineId(null);
    setGrab(null);
    setPlan(null);
    planSigRef.current = null;
  }, [gym.id]);

  // ── helpers to mutate a single machine immutably ──
  const patchMachine = useCallback((id, updater) => {
    setFloor((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  }, []);

  // ── User actions ──

  /** Check in: occupy first open unit. Returns true on success. */
  const checkIn = useCallback((machineId, sets) => {
    if (activeRef.current) return false; // already working out somewhere — one at a time
    const m = floorRef.current.find((x) => x.id === machineId);
    if (!m || openUnitCount(m) === 0) return false;
    if (m.units.some((u) => u.isMe)) return false; // already on this machine

    patchMachine(machineId, (mm) => {
      let filled = false;
      const units = mm.units.map((u) => {
        if (!filled && !u.user) {
          filled = true;
          return { user: 'You', setsLeft: sets, totalSets: sets, isMe: true };
        }
        return u;
      });
      // remove yourself from this machine's queue if you were in it
      const queue = mm.queue.filter((q) => !q.isMe);
      return { ...mm, units, queue };
    });
    setActiveMachineId(machineId);
    // clear any grab window — you claimed it
    setGrab((g) => (g && g.machineId === machineId ? null : g));
    return true;
  }, [patchMachine]);

  /** Log one completed set on your active unit — decrements setsLeft. */
  const logSetOnActive = useCallback(() => {
    const id = activeRef.current;
    if (!id) return;
    patchMachine(id, (mm) => ({
      ...mm,
      units: mm.units.map((u) => (u.isMe ? { ...u, setsLeft: Math.max(0, u.setsLeft - 1) } : u)),
    }));
  }, [patchMachine]);

  /** Add more sets to your active unit. */
  const addSetsToActive = useCallback((delta) => {
    const id = activeRef.current;
    if (!id) return;
    patchMachine(id, (mm) => ({
      ...mm,
      units: mm.units.map((u) =>
        u.isMe ? { ...u, setsLeft: Math.max(0, u.setsLeft + delta), totalSets: Math.max(u.totalSets, u.setsLeft + delta) } : u
      ),
    }));
  }, [patchMachine]);

  /** Leave your active workout — free your unit WITHOUT crediting the plan. */
  const checkOut = useCallback(() => {
    const id = activeRef.current;
    if (!id) return;
    patchMachine(id, (mm) => ({
      ...mm,
      units: mm.units.map((u) => (u.isMe ? { user: null, setsLeft: 0, totalSets: 0 } : u)),
    }));
    setActiveMachineId(null);
  }, [patchMachine]);

  /** Mark the first still-pending exercise of a given equipment type complete,
   *  moving it to the bottom. Completed items NEVER return to pending. */
  const completeNextOfEquipment = useCallback((predictType) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const idx = prev.findIndex((e) => !e.done && e.equipment === predictType);
      if (idx < 0) return prev;
      const item = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      return [...rest, { ...item, done: true }];
    });
  }, []);

  /** Finish your active workout — free your unit AND credit the plan exercise. */
  const finishSession = useCallback(() => {
    const id = activeRef.current;
    if (!id) return;
    const m = floorRef.current.find((x) => x.id === id);
    patchMachine(id, (mm) => ({
      ...mm,
      units: mm.units.map((u) => (u.isMe ? { user: null, setsLeft: 0, totalSets: 0 } : u)),
    }));
    setActiveMachineId(null);
    if (m) completeNextOfEquipment(m.predictType);
  }, [patchMachine, completeNextOfEquipment]);

  /** Build the plan once for a given set of generated exercises.
   *  Rebuilds only when the exercise signature changes (goal/gym change),
   *  preserving completion state across normal re-renders/remounts. */
  const ensurePlan = useCallback((exercises) => {
    const sig = exercises.map((e) => e.id).join('|');
    if (planSigRef.current === sig) return; // same plan already built — keep progress
    planSigRef.current = sig;
    setPlan(exercises.map((e, i) => ({ ...e, uid: `${e.id}-${i}`, done: false })));
  }, []);

  /** Manually rebuild the plan (Reset button). */
  const resetPlan = useCallback((exercises) => {
    planSigRef.current = exercises.map((e) => e.id).join('|');
    setPlan(exercises.map((e, i) => ({ ...e, uid: `${e.id}-${i}`, done: false })));
  }, []);

  /** Move next-up below second-up (when next-up's equipment is fully taken). */
  const promotePlanSecond = useCallback(() => {
    setPlan((prev) => {
      if (!prev) return prev;
      const pend = prev.filter((e) => !e.done);
      const done = prev.filter((e) => e.done);
      if (pend.length < 2) return prev;
      const [first, second, ...others] = pend;
      return [second, first, ...others, ...done];
    });
  }, []);

  const joinQueue = useCallback((machineId, accent) => {
    // Can't queue a machine you're currently using.
    if (activeRef.current === machineId) return;
    patchMachine(machineId, (mm) => {
      if (mm.queue.some((q) => q.isMe)) return mm;
      if (mm.units.some((u) => u.isMe)) return mm; // safety: you're on it
      return {
        ...mm,
        queue: [...mm.queue, { id: 'me', name: 'You', initials: 'ME', avatarColor: accent, openToWorkIn: false, isMe: true }],
      };
    });
  }, [patchMachine]);

  const leaveQueue = useCallback((machineId) => {
    patchMachine(machineId, (mm) => ({ ...mm, queue: mm.queue.filter((q) => !q.isMe) }));
    setGrab((g) => (g && g.machineId === machineId ? null : g));
  }, [patchMachine]);

  // ── Simulation + grab-window ticker ──
  useEffect(() => {
    const interval = setInterval(() => {
      const t = Date.now();
      setNow(t);

      // 1) Expire grab window if the user didn't claim it in time.
      const g = grabRef.current;
      if (g && t >= g.expiresAt) {
        // drop user from that machine's queue; next person gets a window
        patchMachine(g.machineId, (mm) => ({ ...mm, queue: mm.queue.filter((q) => !q.isMe) }));
        setGrab(null);
      }

      // 2) Simulate natural churn (skip the user's own unit + machine).
      setFloor((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          // ~45% chance to touch any given machine each tick
          if (Math.random() > 0.45) return m;

          let units = m.units.map((u) => ({ ...u }));
          const activeHere = activeRef.current === m.id;

          // Advance one random occupied (non-you) unit: decrement sets; free if done.
          const occupiedIdx = units
            .map((u, i) => (u.user && !u.isMe ? i : -1))
            .filter((i) => i >= 0);
          if (occupiedIdx.length) {
            const idx = occupiedIdx[Math.floor(Math.random() * occupiedIdx.length)];
            const u = units[idx];
            if (u.setsLeft > 1) {
              units[idx] = { ...u, setsLeft: u.setsLeft - 1 };
            } else {
              units[idx] = { user: null, setsLeft: 0, totalSets: 0 };
            }
            changed = true;
          }

          // Occasionally a new person starts on an open unit (unless it's being
          // held for the user's grab window on this machine).
          const holdingForUser = grabRef.current && grabRef.current.machineId === m.id;
          if (!holdingForUser && Math.random() < 0.35) {
            const openIdx = units.findIndex((u) => !u.user);
            if (openIdx >= 0) {
              const total = 3 + Math.floor(Math.random() * 3);
              units[openIdx] = { user: randName(), setsLeft: total, totalSets: total };
              changed = true;
            }
          }

          // Occasionally someone joins the queue of a busy machine.
          let queue = m.queue;
          if (openUnitCount({ ...m, units }) === 0 && Math.random() < 0.2) {
            const person = QUEUE_NAMES[Math.floor(Math.random() * QUEUE_NAMES.length)];
            queue = [...queue, { id: `sim-${simCounter++}`, ...person, avatarColor: person.color, openToWorkIn: false }];
            changed = true;
          }

          if (!changed) return m;
          return { ...m, units, queue };
        });
        return changed ? next : prev;
      });

    }, 3000); // tick every 3s

    return () => clearInterval(interval);
  }, [patchMachine]);

  // Grab-window detection runs after every floor change: if you're first in a
  // queue and a unit just opened, start your 2-minute claim window.
  useEffect(() => {
    if (grab) return; // already holding a window
    for (const m of floor) {
      const meIdx = m.queue.findIndex((q) => q.isMe);
      if (meIdx === 0 && openUnitCount(m) > 0) {
        setGrab({ machineId: m.id, expiresAt: Date.now() + GRAB_WINDOW_MS });
        break;
      }
    }
  }, [floor, grab]);

  const activeMachine = floor.find((m) => m.id === activeMachineId) || null;
  const grabSecondsLeft = grab ? Math.max(0, Math.round((grab.expiresAt - now) / 1000)) : 0;
  const grabMachine = grab ? floor.find((m) => m.id === grab.machineId) : null;

  const value = {
    floor,
    activeMachineId,
    activeMachine,
    checkIn,
    checkOut,
    finishSession,
    logSetOnActive,
    addSetsToActive,
    joinQueue,
    leaveQueue,
    grab,
    grabMachine,
    grabSecondsLeft,
    // persistent workout plan
    plan,
    ensurePlan,
    resetPlan,
    promotePlanSecond,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
