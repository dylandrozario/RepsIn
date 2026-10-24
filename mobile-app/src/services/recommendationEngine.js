/**
 * Recommendation engine (Requirements 6 & 7).
 * Ranks workout time slots inside the user's availability and gym hours by
 * predicted equipment congestion.
 */
import { DEMO_GYM, WEEKDAYS, getGymById } from '../data/gymData';
import predictor from './occupancyPredictor';

// The gym the recommendation is built for. Defaults to the first real gym;
// set via setActiveGym when the user picks a different one.
let activeGym = DEMO_GYM;

export function setActiveGym(gymId) {
  activeGym = getGymById(gymId);
  predictor.setGym(activeGym.id);
  return activeGym;
}

export function getActiveGym() {
  return activeGym;
}

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
  const h = activeGym?.operatingHours?.[weekday];
  return h ? { open: h.open, close: h.close } : { open: 6, close: 22 };
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
    // Step in half-hour increments. The occupancy model is hourly, so a half
    // hour looks up its containing hour but is offered as a distinct slot.
    for (let hour = start; hour < end; hour += 0.5) {
      const conflict = sched.some((s) => s.weekday === w.weekday && s.hour === hour);
      if (conflict) continue;
      const avg = averageCongestion(w.weekday, Math.floor(hour));
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

/**
 * Build a human explanation of why a slot was chosen — combines the user's
 * availability and the predicted congestion. Used on the recommendation card.
 */
export function explainSlot(slot, availabilityDays) {
  if (!slot) return '';
  const level = slot.level;
  const crowd =
    level === 'low'
      ? 'lower predicted congestion'
      : level === 'moderate'
      ? 'moderate predicted congestion'
      : 'the least congestion available in your window';
  const fitsSchedule = availabilityDays?.length
    ? `It fits the time you said you're free on ${slot.weekday}`
    : `It lands in a typical free window on ${slot.weekday}`;
  return `${fitsSchedule}, and has ${crowd}.`;
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
