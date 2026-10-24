/**
 * Recommendation engine (Requirements 6 & 7).
 * Ranks workout time slots inside the user's availability and gym hours by
 * predicted equipment congestion.
 */
import { DEMO_GYM, WEEKDAYS } from '../data/gymData';
import predictor from './occupancyPredictor';

// Average congestion across all equipment at a given weekday + hour.
export function averageCongestion(weekday, hour) {
  const all = predictor.predictAll(weekday, hour);
  if (!all.length) return 0.5;
  return all.reduce((s, p) => s + p.probability, 0) / all.length;
}

export function congestionLevelFor(p) {
  if (p < 0.34) return 'low';
  if (p < 0.67) return 'moderate';
  return 'high';
}

function hoursOpen(weekday) {
  const h = DEMO_GYM.operatingHours[weekday];
  return h ? { open: h.open, close: h.close } : null;
}

/**
 * Build ranked recommendations.
 * @param {Array} availability - [{ weekday, start, end }]
 * @param {Array} scheduled    - [{ weekday, hour, ... }]
 * @param {number} count
 */
export function getRecommendations(availability, scheduled, count = 5) {
  const slots = [];
  const sched = Array.isArray(scheduled) ? scheduled : [];
  const windows = Array.isArray(availability) && availability.length
    ? availability
    : defaultAvailability();

  for (const w of windows) {
    const hrs = hoursOpen(w.weekday);
    if (!hrs) continue;
    const start = Math.max(w.start, hrs.open);
    const end = Math.min(w.end, hrs.close);
    for (let hour = start; hour < end; hour++) {
      const conflict = sched.some((s) => s.weekday === w.weekday && s.hour === hour);
      if (conflict) continue;
      const avg = averageCongestion(w.weekday, hour);
      slots.push({
        weekday: w.weekday,
        hour,
        congestion: avg,
        level: congestionLevelFor(avg),
      });
    }
  }

  slots.sort((a, b) => a.congestion - b.congestion);
  return slots.slice(0, count);
}

// Best single slot for the hero card.
export function getBestSlot(availability, scheduled) {
  const recs = getRecommendations(availability, scheduled, 1);
  return recs[0] || null;
}

// Reasonable defaults so the demo always shows something.
function defaultAvailability() {
  return WEEKDAYS.map((weekday) => ({ weekday, start: 16, end: 20 }));
}

export function formatHour(hour) {
  const h = Math.floor(hour);
  const min = hour % 1 >= 0.5 ? '30' : '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${ampm}`;
}
