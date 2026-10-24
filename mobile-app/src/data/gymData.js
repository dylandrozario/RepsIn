/**
 * Gym data for the MVP.
 * Two selectable locations. Each floor machine carries a `predictType`
 * mapping it to one of the ML-predicted equipment types so forecasts work.
 *
 * Predicted types available in occupancyPredictions.json:
 *   bench_press, squat_rack, leg_press, cable_machine,
 *   treadmill, rowing_machine, dumbbells, smith_machine
 */

// ─── SVG line-art paths (24×24 viewbox) reused across gyms by machine kind ───
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

// Build a units array: `occupied` entries filled with a user + random-ish sets,
// the rest left open. Keeps floor data concise for larger equipment groups.
function mkUnits(total, occupied, namePrefix = 'Member', isCardio = false) {
  const names = ['Conor M.','Maeve R.','Liam F.','Nora K.','Aidan P.','Grace B.','Finn O.','Erin C.','Dev S.','Ana P.','Rory B.','Cole D.','Josie M.','Troy K.','Vera L.','Noah W.','Ivy R.','Max G.','Quinn A.','Ty H.'];
  return Array.from({ length: total }, (_, i) => {
    if (i < occupied) {
      const totalSets = isCardio ? 1 : 3 + (i % 3);
      const setsLeft = isCardio ? 1 : 1 + (i % totalSets);
      return { user: isCardio ? `${namePrefix} ${i + 1}` : names[i % names.length], setsLeft, totalSets };
    }
    return { user: null, setsLeft: 0, totalSets: 0 };
  });
}

export const GYMS = [
  {
    id: 'gym-001',
    name: 'FitZone Downtown',
    address: '123 Main Street, Downtown',
    operatingHours: {
      Monday:    { open: 6, close: 22 },
      Tuesday:   { open: 6, close: 22 },
      Wednesday: { open: 6, close: 22 },
      Thursday:  { open: 6, close: 22 },
      Friday:    { open: 6, close: 22 },
      Saturday:  { open: 8, close: 20 },
      Sunday:    { open: 8, close: 20 },
    },
    equipment: [
      { type: 'bench_press',    name: 'Bench Press',    units: 3 },
      { type: 'squat_rack',     name: 'Squat Rack',     units: 2 },
      { type: 'leg_press',      name: 'Leg Press',      units: 2 },
      { type: 'cable_machine',  name: 'Cable Machine',  units: 4 },
      { type: 'treadmill',      name: 'Treadmill',      units: 10 },
      { type: 'rowing_machine', name: 'Rowing Machine', units: 5 },
      { type: 'dumbbells',      name: 'Dumbbell Area',  units: 15 },
      { type: 'smith_machine',  name: 'Smith Machine',  units: 1 },
    ],
    // Live floor — one entry per equipment GROUP. `units` holds each physical
    // machine's live state. Group status is derived from its units.
    // workInAllowed: false for cardio (can't share a treadmill/rower).
    floor: [
      { id: 1, name: 'Bench Press', zone: 'Chest', predictType: 'bench_press', svg: SVG.bench, bgColor: '#EDE7FB', workInAllowed: true,
        units: [
          { user: 'Marcus T.', setsLeft: 1, totalSets: 4 },
          { user: 'Dana W.',   setsLeft: 3, totalSets: 4 },
          { user: 'Kyle P.',   setsLeft: 2, totalSets: 3 },
        ],
        queue: [{ id: 'u1', name: 'Jordan R.', initials: 'JR', avatarColor: '#7C3AED', openToWorkIn: true }] },

      { id: 2, name: 'Squat Rack', zone: 'Legs', predictType: 'squat_rack', svg: SVG.squat, bgColor: '#DCFCE7', workInAllowed: true,
        units: [
          { user: null, setsLeft: 0, totalSets: 0 },
          { user: 'Reed A.', setsLeft: 2, totalSets: 5 },
        ],
        queue: [] },

      { id: 3, name: 'Cable Station', zone: 'Back', predictType: 'cable_machine', svg: SVG.cable, bgColor: '#FEF9C3', workInAllowed: true,
        units: [
          { user: 'Aisha M.', setsLeft: 2, totalSets: 3 },
          { user: 'Sam T.',   setsLeft: 1, totalSets: 3 },
          { user: null, setsLeft: 0, totalSets: 0 },
          { user: 'Nina R.',  setsLeft: 3, totalSets: 4 },
        ],
        queue: [] },

      { id: 4, name: 'Lat Pulldown', zone: 'Back', predictType: 'cable_machine', svg: SVG.lat, bgColor: '#F0FDF4', workInAllowed: true,
        units: [
          { user: 'Priya S.', setsLeft: 1, totalSets: 3 },
          { user: 'Omar F.',  setsLeft: 2, totalSets: 4 },
        ],
        queue: [{ id: 'u2', name: 'You', initials: 'ME', avatarColor: '#6D28D9', openToWorkIn: false, isMe: true }] },

      { id: 5, name: 'Incline Press', zone: 'Chest', predictType: 'bench_press', svg: SVG.incline, bgColor: '#EDE7FB', workInAllowed: true,
        units: [
          { user: null, setsLeft: 0, totalSets: 0 },
          { user: null, setsLeft: 0, totalSets: 0 },
        ],
        queue: [] },

      { id: 6, name: 'Leg Press', zone: 'Legs', predictType: 'leg_press', svg: SVG.legpress, bgColor: '#FFF7ED', workInAllowed: true,
        units: [
          { user: 'Tyler K.', setsLeft: 4, totalSets: 5 },
          { user: 'Grace H.', setsLeft: 2, totalSets: 4 },
        ],
        queue: [
          { id: 'u3', name: 'Devon L.', initials: 'DL', avatarColor: '#0284C7', openToWorkIn: true },
          { id: 'u4', name: 'Priya S.', initials: 'PS', avatarColor: '#BE185D', openToWorkIn: false },
        ] },

      { id: 7, name: 'Shoulder Press', zone: 'Shoulders', predictType: 'smith_machine', svg: SVG.shoulder, bgColor: '#F0F9FF', workInAllowed: true,
        units: [
          { user: null, setsLeft: 0, totalSets: 0 },
          { user: null, setsLeft: 0, totalSets: 0 },
          { user: 'Luis M.', setsLeft: 3, totalSets: 4 },
        ],
        queue: [] },

      { id: 8, name: 'Pull-Up Bar', zone: 'Back', predictType: 'cable_machine', svg: SVG.pullup, bgColor: '#FDF2F8', workInAllowed: true,
        units: [
          { user: 'Jordan R.', setsLeft: 3, totalSets: 4 },
          { user: 'Beth C.',   setsLeft: 2, totalSets: 3 },
          { user: 'Alex N.',   setsLeft: 4, totalSets: 5 },
        ],
        queue: [{ id: 'u5', name: 'Aisha M.', initials: 'AM', avatarColor: '#047857', openToWorkIn: false }] },

      { id: 9, name: 'Treadmill', zone: 'Cardio', predictType: 'treadmill', svg: SVG.treadmill, bgColor: '#FEF2F2', workInAllowed: false,
        units: [
          { user: 'Owen H.', setsLeft: 1, totalSets: 1 },
          { user: 'Mia L.',  setsLeft: 1, totalSets: 1 },
          { user: null, setsLeft: 0, totalSets: 0 },
          { user: null, setsLeft: 0, totalSets: 0 },
          { user: 'Tess B.', setsLeft: 1, totalSets: 1 },
        ],
        queue: [] },

      { id: 10, name: 'Rowing Machine', zone: 'Cardio', predictType: 'rowing_machine', svg: SVG.rower, bgColor: '#ECFEFF', workInAllowed: false,
        units: [
          { user: null, setsLeft: 0, totalSets: 0 },
          { user: 'Cam D.', setsLeft: 1, totalSets: 1 },
          { user: null, setsLeft: 0, totalSets: 0 },
        ],
        queue: [] },
    ],
  },

  {
    id: 'gym-bc-margot',
    name: "Margot Connell Recreation Center",
    address: 'Boston College · 2150 Commonwealth Ave, Chestnut Hill',
    operatingHours: {
      Monday:    { open: 6, close: 23 },
      Tuesday:   { open: 6, close: 23 },
      Wednesday: { open: 6, close: 23 },
      Thursday:  { open: 6, close: 23 },
      Friday:    { open: 6, close: 22 },
      Saturday:  { open: 8, close: 21 },
      Sunday:    { open: 8, close: 21 },
    },
    // Accurate Margot Connell fitness-floor inventory.
    // `type` maps each to an ML-predicted category for the forecast.
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
    // Grouped equipment. Larger facility, so more units per group.
    floor: [
      // ── Chest ──
      { id: 1, name: 'Bench Press', zone: 'Chest', predictType: 'bench_press', svg: SVG.bench, bgColor: '#EDE7FB', workInAllowed: true,
        units: mkUnits(6, 4), // 6 total, 4 in use → 2 open
        queue: [] },
      { id: 2, name: 'Incline Bench Press', zone: 'Chest', predictType: 'bench_press', svg: SVG.incline, bgColor: '#EDE7FB', workInAllowed: true,
        units: mkUnits(2, 2), // both busy
        queue: [{ id: 'b1', name: 'Shea D.', initials: 'SD', avatarColor: '#7C3AED', openToWorkIn: true }] },
      { id: 3, name: 'Decline Bench Press', zone: 'Chest', predictType: 'bench_press', svg: SVG.decline, bgColor: '#EDE7FB', workInAllowed: true,
        units: mkUnits(2, 1), // 1 open
        queue: [] },
      { id: 4, name: 'Incline Chest Press', zone: 'Chest', predictType: 'bench_press', svg: SVG.incline, bgColor: '#EDE7FB', workInAllowed: true,
        units: mkUnits(4, 2),
        queue: [] },
      { id: 5, name: 'Pec Deck', zone: 'Chest', predictType: 'cable_machine', svg: SVG.pecdeck, bgColor: '#EDE7FB', workInAllowed: true,
        units: mkUnits(2, 0), // both open
        queue: [] },

      // ── Back ──
      { id: 6, name: 'Cable Machine', zone: 'Back', predictType: 'cable_machine', svg: SVG.cable, bgColor: '#FEF9C3', workInAllowed: true,
        units: mkUnits(6, 3),
        queue: [] },
      { id: 7, name: 'Lat Pulldown', zone: 'Back', predictType: 'cable_machine', svg: SVG.lat, bgColor: '#F0FDF4', workInAllowed: true,
        units: mkUnits(3, 3), // all busy
        queue: [
          { id: 'b2', name: 'Nora K.', initials: 'NK', avatarColor: '#0284C7', openToWorkIn: true },
          { id: 'b3', name: 'You', initials: 'ME', avatarColor: '#6D28D9', openToWorkIn: false, isMe: true },
        ] },

      // ── Legs ──
      { id: 8, name: 'Squat Rack', zone: 'Legs', predictType: 'squat_rack', svg: SVG.squat, bgColor: '#DCFCE7', workInAllowed: true,
        units: mkUnits(12, 7), // 12 total, 7 in use → 5 open
        queue: [] },
      { id: 9, name: 'Hack Squat', zone: 'Legs', predictType: 'squat_rack', svg: SVG.hack, bgColor: '#DCFCE7', workInAllowed: true,
        units: mkUnits(1, 1), // the one is busy
        queue: [] },
      { id: 10, name: 'Leg Press', zone: 'Legs', predictType: 'leg_press', svg: SVG.legpress, bgColor: '#FFF7ED', workInAllowed: true,
        units: mkUnits(1, 0), // open
        queue: [] },
      { id: 11, name: 'Quad Extension', zone: 'Legs', predictType: 'leg_press', svg: SVG.quad, bgColor: '#FFF7ED', workInAllowed: true,
        units: mkUnits(1, 1),
        queue: [] },
      { id: 12, name: 'Hamstring Curl', zone: 'Legs', predictType: 'leg_press', svg: SVG.hamstring, bgColor: '#FFF7ED', workInAllowed: true,
        units: mkUnits(1, 0),
        queue: [] },

      // ── Shoulders ──
      { id: 13, name: 'Shoulder Press', zone: 'Shoulders', predictType: 'smith_machine', svg: SVG.shoulder, bgColor: '#F0F9FF', workInAllowed: true,
        units: mkUnits(1, 1),
        queue: [] },
      { id: 14, name: 'Lateral Raise', zone: 'Shoulders', predictType: 'cable_machine', svg: SVG.lateral, bgColor: '#F0F9FF', workInAllowed: true,
        units: mkUnits(1, 0),
        queue: [] },

      // ── Arms ──
      { id: 15, name: 'Tricep Pushdown', zone: 'Arms', predictType: 'cable_machine', svg: SVG.tricep, bgColor: '#FDF2F8', workInAllowed: true,
        units: mkUnits(1, 1),
        queue: [] },
      { id: 16, name: 'Bicep Curl', zone: 'Arms', predictType: 'cable_machine', svg: SVG.bicep, bgColor: '#FDF2F8', workInAllowed: true,
        units: mkUnits(1, 0),
        queue: [] },

      // ── Core ──
      { id: 17, name: 'Ab Machine', zone: 'Core', predictType: 'cable_machine', svg: SVG.ab, bgColor: '#F0FDF4', workInAllowed: true,
        units: mkUnits(1, 0),
        queue: [] },

      // ── Cardio ──
      { id: 18, name: 'Rowing Machine', zone: 'Cardio', predictType: 'rowing_machine', svg: SVG.rower, bgColor: '#ECFEFF', workInAllowed: false,
        units: mkUnits(3, 1, 'Rower', true), // 1 in use, 2 open
        queue: [] },
    ],
  },
];

// ─── Group status helpers ────────────────────────────────────────────────────
// A group's live summary is derived from its individual units.

/** Count of units with no current user. */
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

// Backwards-compatible default export used by existing screens.
export const DEMO_GYM = GYMS[0];

export function getGymById(id) {
  return GYMS.find((g) => g.id === id) || GYMS[0];
}

export const ZONES_BY_GYM = {
  'gym-001': ['All', 'Chest', 'Back', 'Legs', 'Shoulders'],
  'gym-bc-margot': ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'],
};

export function zonesForGym(id) {
  return ZONES_BY_GYM[id] || ['All', 'Chest', 'Back', 'Legs', 'Shoulders'];
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
