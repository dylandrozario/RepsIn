/**
 * RepsIn design system.
 * Warm cream background, vivid purple accent, elegant serif headlines.
 */
import { Platform } from 'react-native';

export const colors = {
  // Surfaces
  bg: '#F4F1EC',
  bgAlt: '#EFEBE4',
  card: '#FFFFFF',
  cardSunken: '#EDE9E1',

  // Brand
  purple: '#6D28D9',
  purpleBright: '#7C3AED',
  purpleSoft: '#EDE7FB',
  peach: '#F6C9A0',
  peachSoft: '#F9D9BE',

  // Text
  ink: '#1C1A26',
  inkSoft: '#6B6675',
  inkFaint: '#9A95A3',
  onPurple: '#FFFFFF',

  // Lines
  hairline: '#DAD4C9',
  hairlineSoft: '#E4DFD6',

  // Congestion
  low: '#2E9E6B',
  moderate: '#D8963B',
  high: '#C0493B',
  unknown: '#9A95A3',

  // Track
  track: '#E2DCD2',
};

// Gradient stops used for the hero card and icon tiles.
export const gradients = {
  hero: ['#6D28D9', '#8B5CF6', '#C4A1E8', '#F6C9A0'],
  tile: ['#7C3AED', '#A855F7', '#F6C9A0'],
};

// Instrument Serif (loaded via expo-font in App.js) is the headline typeface.
// Falls back to a system serif if the font hasn't loaded yet.
const serif = 'InstrumentSerif_400Regular';
const serifItalic = 'InstrumentSerif_400Regular_Italic';

export const fonts = {
  serif,
  serifItalic,
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
};

export const type = {
  display: { fontFamily: serif, fontSize: 42, lineHeight: 48, color: colors.ink, fontWeight: '400' },
  h1: { fontFamily: serif, fontSize: 33, lineHeight: 39, color: colors.ink, fontWeight: '400' },
  h2: { fontFamily: serif, fontSize: 27, lineHeight: 33, color: colors.ink, fontWeight: '400' },
  h3: { fontFamily: serif, fontSize: 22, lineHeight: 28, color: colors.ink, fontWeight: '400' },
  body: { fontSize: 15, lineHeight: 22, color: colors.inkSoft },
  bodyInk: { fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  label: {
    fontSize: 11.5,
    lineHeight: 14,
    letterSpacing: 1.3,
    fontWeight: '700',
    color: colors.purple,
    textTransform: 'uppercase',
  },
  labelMuted: {
    fontSize: 11.5,
    lineHeight: 14,
    letterSpacing: 1.3,
    fontWeight: '700',
    color: colors.inkFaint,
    textTransform: 'uppercase',
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const shadow = {
  card: {
    shadowColor: '#2A2340',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  float: {
    shadowColor: '#2A2340',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 10,
  },
};

export function congestionColor(level) {
  return colors[level] || colors.unknown;
}

export function congestionLabel(level) {
  switch (level) {
    case 'low': return 'Low congestion';
    case 'moderate': return 'Moderate congestion';
    case 'high': return 'High congestion';
    default: return 'Unknown';
  }
}

// --- Wait time --------------------------------------------------------------
// Convert an occupancy probability (0..1, chance all units are busy) into an
// estimated wait in minutes. Low occupancy ~ no wait; high ~ a line forms.
// Caps at ~20 min so the number stays believable for a gym.
const MAX_WAIT_MIN = 20;

export function waitMinutes(probability) {
  const p = Math.max(0, Math.min(1, probability ?? 0.5));
  // Non-linear: waits stay near zero until the gym is quite full, then climb.
  const mins = Math.round(Math.pow(p, 2.2) * MAX_WAIT_MIN);
  return mins;
}

// Short label like "No wait" / "~5 min wait".
export function waitLabel(probability) {
  const m = waitMinutes(probability);
  if (m <= 1) return 'No wait';
  return `~${m} min wait`;
}

// Level phrasing in wait terms (keeps the same color buckets).
export function waitLevelLabel(level) {
  switch (level) {
    case 'low': return 'Walk right on';
    case 'moderate': return 'Short wait';
    case 'high': return 'Expect a wait';
    default: return 'Unknown';
  }
}
