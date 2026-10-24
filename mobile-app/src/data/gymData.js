/**
 * Gym data for the MVP.
 *
 * Base gym list comes from real Boston venues seeded from BestTime foot-traffic
 * data (ml-pipeline/scripts/seed_boston_gyms.py); their occupancy predictions
 * live in occupancyPredictions.json. Those gyms ship an `equipment` list but no
 * live-floor structure, so we DERIVE a `floor` (grouped machines with per-unit
 * live state) for each one — that's what the Live Floor + queue system needs.
 *
 * We also keep one hand-authored gym (Margot Connell Rec Center at BC) with a
 * curated floor, appended to the list.
 *
 * Predicted equipment types (occupancyPredictions.json):
 *   bench_press, squat_rack, leg_press, cable_machine,
 *   treadmill, rowing_machine, dumbbells, smith_machine
 */
import bostonGyms from './bostonGyms.json';

// ─── SVG line-art paths (24×24 viewbox), keyed by equipment type ─────────────
const SVG = {
  bench:    'M4 16h16M8 16v-4h8v4M6 12V8h12v4M4 18h16',
  squat:    'M7 20V6M17 20V6M5 10h14M5 16h14M3 6h4M17 6h4',
  cable:    'M5 12h14M5 12l4-4M5 12l4 4M16 6v12',
  lat:      'M12 4v16M5 8l7-4 7 4M8 20h8',
  incline:  'M4 18l4-8h8l4 8M8 10V8h8v2',
  legpress: 'M6 18V10l6-4 6 4v8h-4v-4h-4v4z',
  shoulder: 'M8 8h8v2H8zM7 10h10v2H7zM9 18v-6h6v6',
  pullup:   'M4 8h16v2H4zM12 10v10M9 20h6',
  treadmill:'M3 17h14l3-9M6 17v3M14 17v3M8 9a2 2 0 1 0 0-.1',
  rower:    'M4 12h10l5-3M4 12l3 5M14 12v5M9 9a2 2 0 1 0 0-.1',
  smith:    'M6 4v16M18 4v16M6 9h12M6 14h12',
  pecdeck:  'M12 6v12M12 9L6 6M12 9l6-3M12 15l-6 3M12 15l6 3',
  tricep:   'M6 5v8a4 4 0 0 0 8 0V5M8 19h8',
  lateral:  'M12 8v8M4 12h4M16 12h4M6 10v4M18 10v4',
  decline:  'M4 10l4 8h8l4-8M8 10V8h8v2',
  quad:     'M6 8h8v6a4 4 0 0 1-8 0zM14 11h4',
  hamstring:'M18 8h-8v6a4 4 0 0 0 8 0zM10 11H6',
  ab:       'M5 7h14v4a7 7 0 0 1-14 0zM9 18h6',
  bicep:    'M8 5v6a4 4 0 0 0 8 0V5M6 19h12',
  hack:     'M5 18l5-10h4l5 10M8 14h8',
};

// Map an ML equipment type → its icon path + display zone + background tint.
const TYPE_META = {
  bench_press:   { svg: SVG.bench,    zone: 'Chest',  bg: '#EDE7FB', workIn: true  },
  squat_rack:    { svg: SVG.squat,    zone: 'Legs',   bg: '#DCFCE7', workIn: true  },
  leg_press:     { svg: SVG.legpress, zone: 'Legs',   bg: '#FFF7ED', workIn: true  },
  cable_machine: { svg: SVG.cable,    zone: 'Back',   bg: '#FEF9C3', workIn: true  },
  smith_machine: { svg: SVG.smith,    zone: 'Legs',   bg: '#F0F9FF', workIn: true  },
  treadmill:     { svg: SVG.treadmill,zone: 'Cardio', bg: '#FEF2F2', workIn: false },
  rowing_machine:{ svg: SVG.rower,    zone: 'Cardio', bg: '#ECFEFF', workIn: false },
  dumbbells:     { svg: SVG.bicep,    zone: 'Arms',   bg: '#FDF2F8', workIn: true  },
};

const SIM_NAMES = ['Marcus T.','Dana W.','Kyle P.','Aisha M.','Sam T.','Nina R.','Priya S.','Omar F.','Tyler K.','Grace H.','Jordan R.','Beth C.','Alex N.','Owen H.','Mia L.'];
const QUEUE_SEED = [
  { id: 'q1', name: 'Jordan R.', initials: 'JR', avatarColor: '#7C3AED', openToWorkIn: true },
  { id: 'q2', name: 'Aisha M.',  initials: 'AM', avatarColor: '#047857', openToWorkIn: false },
];

// Build a units array: `occupied` filled with a user + sets, the rest open.
function mkUnits(total, occupied, isCardio = false) {
  return Array.from({ length: total }, (_, i) => {
    if (i < occupied) {
      const totalSets = isCardio ? 1 : 3 + (i % 3);
      const setsLeft = isCardio ? 1 : 1 + (i % totalSets);
      return { user: SIM_NAMES[i % SIM_NAMES.length], setsLeft, totalSets };
    }
    return { user: null, setsLeft: 0, totalSets: 0 };
  });
}

/**
 * Derive a live `floor` (array of equipment groups) from a gym's `equipment`
 * list. Each equipment entry becomes one group; we seed a plausible number of
 * occupied units so the floor looks alive. Cardio groups get no work-in.
 */
function deriveFloor(equipment) {
  return (equipment || []).map((e, idx) => {
    const meta = TYPE_META[e.type] || { svg: SVG.cable, zone: 'Other', bg: '#EDEDED', workIn: true };
    const units = Math.max(1, e.units || 1);
    const isCardio = e.type === 'treadmill' || e.type === 'rowing_machine';
    // Seed ~55% occupancy so some are open and some are busy.
    const occupied = Math.round(units * 0.55);
    // Give the first couple of groups a visible queue when they're full.
    const queue = (occupied >= units && idx < 2) ? QUEUE_SEED.slice(0, idx + 1).map((q) => ({ ...q })) : [];
    return {
      id: idx + 1,
      name: e.name,
      zone: meta.zone,
      predictType: e.type,
      svg: meta.svg,
      bgColor: meta.bg,
      workInAllowed: meta.workIn,
      units: mkUnits(units, occupied, isCardio),
      queue,
    };
  });
}

// ─── Hand-authored BC gym (curated floor) ────────────────────────────────────
const BC_GYM = {
  id: 'gym-bc-margot',
  name: 'Margot Connell Recreation Center',
  address: 'Boston College · 2150 Commonwealth Ave, Chestnut Hill',
  operatingHours: {
    Monday: { open: 6, close: 23 }, Tuesday: { open: 6, close: 23 },
    Wednesday: { open: 6, close: 23 }, Thursday: { open: 6, close: 23 },
    Friday: { open: 6, close: 22 }, Saturday: { open: 8, close: 21 }, Sunday: { open: 8, close: 21 },
  },
  equipment: [
    { type: 'cable_machine',  name: 'Cable Machine',       units: 6 },
    { type: 'cable_machine',  name: 'Lat Pulldown',        units: 3 },
    { type: 'rowing_machine', name: 'Rowing Machine',      units: 3 },
    { type: 'bench_press',    name: 'Incline Chest Press', units: 4 },
    { type: 'smith_machine',  name: 'Shoulder Press',      units: 1 },
    { type: 'cable_machine',  name: 'Tricep Pushdown',     units: 1 },
    { type: 'cable_machine',  name: 'Lateral Raise',       units: 1 },
    { type: 'cable_machine',  name: 'Pec Deck',            units: 2 },
    { type: 'leg_press',      name: 'Leg Press',           units: 1 },
    { type: 'leg_press',      name: 'Quad Extension',      units: 1 },
    { type: 'leg_press',      name: 'Hamstring Curl',      units: 1 },
    { type: 'cable_machine',  name: 'Ab Machine',          units: 1 },
    { type: 'cable_machine',  name: 'Bicep Curl',          units: 1 },
    { type: 'bench_press',    name: 'Bench Press',         units: 6 },
    { type: 'bench_press',    name: 'Incline Bench Press', units: 2 },
    { type: 'bench_press',    name: 'Decline Bench Press', units: 2 },
    { type: 'squat_rack',     name: 'Hack Squat',          units: 1 },
    { type: 'squat_rack',     name: 'Squat Rack',          units: 12 },
  ],
  floor: [
    { id: 1,  name: 'Cable Machine',       zone: 'Back',      predictType: 'cable_machine', svg: SVG.cable,    bgColor: '#FEF9C3', workInAllowed: true,  units: mkUnits(6, 3),  queue: [] },
    { id: 2,  name: 'Lat Pulldown',        zone: 'Back',      predictType: 'cable_machine', svg: SVG.lat,      bgColor: '#F0FDF4', workInAllowed: true,  units: mkUnits(3, 3),  queue: [{ id: 'b2', name: 'Nora K.', initials: 'NK', avatarColor: '#0284C7', openToWorkIn: true }] },
    { id: 3,  name: 'Rowing Machine',      zone: 'Cardio',    predictType: 'rowing_machine',svg: SVG.rower,    bgColor: '#ECFEFF', workInAllowed: false, units: mkUnits(3, 1, true), queue: [] },
    { id: 4,  name: 'Incline Chest Press', zone: 'Chest',     predictType: 'bench_press',   svg: SVG.incline,  bgColor: '#EDE7FB', workInAllowed: true,  units: mkUnits(4, 2),  queue: [] },
    { id: 5,  name: 'Shoulder Press',      zone: 'Shoulders', predictType: 'smith_machine', svg: SVG.shoulder, bgColor: '#F0F9FF', workInAllowed: true,  units: mkUnits(1, 1),  queue: [] },
    { id: 6,  name: 'Tricep Pushdown',     zone: 'Arms',      predictType: 'cable_machine', svg: SVG.tricep,   bgColor: '#FDF2F8', workInAllowed: true,  units: mkUnits(1, 1),  queue: [] },
    { id: 7,  name: 'Lateral Raise',       zone: 'Shoulders', predictType: 'cable_machine', svg: SVG.lateral,  bgColor: '#F0F9FF', workInAllowed: true,  units: mkUnits(1, 0),  queue: [] },
    { id: 8,  name: 'Pec Deck',            zone: 'Chest',     predictType: 'cable_machine', svg: SVG.pecdeck,  bgColor: '#EDE7FB', workInAllowed: true,  units: mkUnits(2, 0),  queue: [] },
    { id: 9,  name: 'Leg Press',           zone: 'Legs',      predictType: 'leg_press',     svg: SVG.legpress, bgColor: '#FFF7ED', workInAllowed: true,  units: mkUnits(1, 0),  queue: [] },
    { id: 10, name: 'Quad Extension',      zone: 'Legs',      predictType: 'leg_press',     svg: SVG.quad,     bgColor: '#FFF7ED', workInAllowed: true,  units: mkUnits(1, 1),  queue: [] },
    { id: 11, name: 'Hamstring Curl',      zone: 'Legs',      predictType: 'leg_press',     svg: SVG.hamstring,bgColor: '#FFF7ED', workInAllowed: true,  units: mkUnits(1, 0),  queue: [] },
    { id: 12, name: 'Ab Machine',          zone: 'Core',      predictType: 'cable_machine', svg: SVG.ab,       bgColor: '#F0FDF4', workInAllowed: true,  units: mkUnits(1, 0),  queue: [] },
    { id: 13, name: 'Bicep Curl',          zone: 'Arms',      predictType: 'cable_machine', svg: SVG.bicep,    bgColor: '#FDF2F8', workInAllowed: true,  units: mkUnits(1, 1),  queue: [] },
    { id: 14, name: 'Bench Press',         zone: 'Chest',     predictType: 'bench_press',   svg: SVG.bench,    bgColor: '#EDE7FB', workInAllowed: true,  units: mkUnits(6, 4),  queue: [] },
    { id: 15, name: 'Incline Bench Press', zone: 'Chest',     predictType: 'bench_press',   svg: SVG.incline,  bgColor: '#EDE7FB', workInAllowed: true,  units: mkUnits(2, 2),  queue: [{ id: 'b1', name: 'Shea D.', initials: 'SD', avatarColor: '#7C3AED', openToWorkIn: true }] },
    { id: 16, name: 'Decline Bench Press', zone: 'Chest',     predictType: 'bench_press',   svg: SVG.decline,  bgColor: '#EDE7FB', workInAllowed: true,  units: mkUnits(2, 1),  queue: [] },
    { id: 17, name: 'Hack Squat',          zone: 'Legs',      predictType: 'squat_rack',    svg: SVG.hack,     bgColor: '#DCFCE7', workInAllowed: true,  units: mkUnits(1, 1),  queue: [] },
    { id: 18, name: 'Squat Rack',          zone: 'Legs',      predictType: 'squat_rack',    svg: SVG.squat,    bgColor: '#DCFCE7', workInAllowed: true,  units: mkUnits(12, 7), queue: [] },
  ],
};

// ─── Final gym list ───────────────────────────────────────────────────────────
// Boston gyms (with a derived floor) + the curated BC gym.
// The seed data can contain duplicate ids (e.g. two "Beacon Hill Athletic
// Clubs"), so we dedupe by id — keeping the first occurrence — to guarantee
// unique keys for every list that renders gyms.
function dedupeById(list) {
  const seen = new Set();
  return list.filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });
}

export const GYMS = dedupeById([
  ...bostonGyms.map((g) => ({ ...g, floor: g.floor || deriveFloor(g.equipment) })),
  BC_GYM,
]);

export const DEMO_GYM = GYMS[0];

export function getGymById(id) {
  return GYMS.find((g) => g.id === id) || GYMS[0];
}

// ─── Live-floor group helpers (used by Floor/Queue/Workout + Home outlook) ────
export function openUnitCount(group) {
  return group.units.filter((u) => !u.user).length;
}

/**
 * Derive a group's status:
 *   'free'   → at least one unit open
 *   'almost' → none open, but the soonest-finishing unit has 1 set left
 *   'busy'   → none open and everyone has 2+ sets left
 */
export function groupStatus(group) {
  if (openUnitCount(group) > 0) return 'free';
  const inUse = group.units.filter((u) => u.user);
  if (!inUse.length) return 'free';
  const minSetsLeft = Math.min(...inUse.map((u) => u.setsLeft));
  return minSetsLeft <= 1 ? 'almost' : 'busy';
}

/** The soonest-available unit among those in use (for the "next free" estimate). */
export function soonestUnit(group) {
  const inUse = group.units.filter((u) => u.user);
  if (!inUse.length) return null;
  return inUse.reduce((a, b) => (b.setsLeft < a.setsLeft ? b : a));
}

// Zones for the floor filter. Derived from the gym's own floor so every gym
// (Boston or BC) shows exactly the zones its equipment covers.
export function zonesForGym(id) {
  const gym = getGymById(id);
  const zones = Array.from(new Set((gym.floor || []).map((g) => g.zone)));
  const ORDER = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];
  zones.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  return ['All', ...zones];
}

export const FITNESS_GOALS = [
  { id: 'muscle_building',   label: 'Muscle Building',   icon: '💪' },
  { id: 'strength',          label: 'Strength',          icon: '🏋️' },
  { id: 'endurance',         label: 'Endurance',         icon: '🏃' },
  { id: 'general_fitness',   label: 'General Fitness',   icon: '🌟' },
  { id: 'weight_management', label: 'Weight Management', icon: '⚖️' },
];

export const EXPERIENCE_LEVELS = [
  { id: 'beginner',     label: 'Beginner',     description: 'New to working out' },
  { id: 'intermediate', label: 'Intermediate', description: '6+ months experience' },
  { id: 'advanced',     label: 'Advanced',     description: '2+ years experience' },
];

export const WORKOUT_DURATIONS = [20, 30, 45, 60, 90];

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
