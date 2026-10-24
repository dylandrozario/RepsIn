/**
 * Workout generator (Requirements 9 & 10).
 * Builds a routine from the user's goal, experience and duration, and
 * prioritizes exercises whose equipment is predicted to be less congested.
 */
import { EXERCISES, GOAL_TEMPLATES, minutesPerExercise } from '../data/exercises';
import { DEMO_GYM } from '../data/gymData';
import predictor from './occupancyPredictor';

const DIFFICULTY_RANK = { beginner: 0, intermediate: 1, advanced: 2 };

function availableEquipment() {
  return new Set(DEMO_GYM.equipment.map((e) => e.type));
}

/**
 * @param {Object} prefs - { goal, experience, duration }
 * @param {Object} slot  - { weekday, hour }
 */
export function generateWorkout(prefs, slot) {
  const goal = prefs?.goal || 'general_fitness';
  const experience = prefs?.experience || 'beginner';
  const duration = prefs?.duration || 45;
  const template = GOAL_TEMPLATES[goal] || GOAL_TEMPLATES.general_fitness;

  const equip = availableEquipment();
  const userRank = DIFFICULTY_RANK[experience] ?? 0;

  // Score every candidate exercise.
  const candidates = EXERCISES
    .filter((ex) => equip.has(ex.equipment))
    .filter((ex) => template.patterns.includes(ex.pattern))
    .filter((ex) => DIFFICULTY_RANK[ex.difficulty] <= userRank + 1)
    .map((ex) => {
      const pred = slot
        ? predictor.predict(ex.equipment, slot.weekday, slot.hour)
        : { probability: 0.5, congestionLevel: 'unknown' };
      return { ...ex, pred };
    });

  // Pick one exercise per pattern, lowest congestion first, to cover the template.
  const sets = experience === 'advanced' ? 4 : 3;
  const [minR, maxR] = template.reps;
  const picked = [];
  const usedPatterns = new Set();

  const sorted = [...candidates].sort((a, b) => a.pred.probability - b.pred.probability);

  // First pass: one per pattern for balance.
  for (const pattern of template.patterns) {
    const best = sorted.find((c) => c.pattern === pattern && !picked.includes(c));
    if (best) {
      picked.push(best);
      usedPatterns.add(pattern);
    }
  }
  // Fill remaining slots by congestion until we run out of time budget.
  for (const c of sorted) {
    if (picked.length >= 7) break;
    if (!picked.includes(c)) picked.push(c);
  }

  // Trim to fit the time budget.
  const result = [];
  let minutes = 0;
  for (const ex of picked) {
    const m = minutesPerExercise(sets, template.rest);
    if (minutes + m > duration && result.length >= 3) break;
    minutes += m;
    const reps = ex.pattern === 'cardio' ? null : Math.round((minR + maxR) / 2);
    result.push({
      ...ex,
      sets: ex.pattern === 'cardio' ? null : sets,
      reps,
      rest: template.rest,
      display:
        ex.pattern === 'cardio'
          ? '3 rounds · 5 min each'
          : `${sets} sets × ${reps} reps · ${template.rest} sec rest`,
    });
  }

  // Build a swap suggestion for the most congested picked equipment.
  const congested = result
    .filter((e) => e.pred.congestionLevel === 'high')
    .sort((a, b) => b.pred.probability - a.pred.probability)[0];
  let swap = null;
  if (congested) {
    const alt = findSubstitute(congested, result, equip, slot);
    if (alt) {
      swap = {
        from: congested,
        to: alt,
        title: `${equipName(congested.equipment)} may be busy`,
        detail: `Swap ${congested.name.toLowerCase()} for ${alt.name.toLowerCase()}.`,
      };
    }
  }

  return {
    templateName: template.name,
    duration,
    goal,
    experience,
    exercises: result,
    estimatedMinutes: Math.round(minutes),
    swap,
  };
}

// Find a same-muscle exercise on less congested equipment (Requirement 10.4).
export function findSubstitute(target, current, equip, slot) {
  const currentIds = new Set(current.map((e) => e.id));
  const sameMuscle = EXERCISES.filter(
    (ex) =>
      ex.id !== target.id &&
      !currentIds.has(ex.id) &&
      equip.has(ex.equipment) &&
      ex.equipment !== target.equipment &&
      ex.muscles.some((m) => target.muscles.includes(m))
  ).map((ex) => ({
    ...ex,
    pred: slot ? predictor.predict(ex.equipment, slot.weekday, slot.hour) : { probability: 0.5, congestionLevel: 'unknown' },
  }));

  sameMuscle.sort((a, b) => a.pred.probability - b.pred.probability);
  return sameMuscle[0] || null;
}

function equipName(type) {
  const f = DEMO_GYM.equipment.find((e) => e.type === type);
  return f ? f.name : type.replace(/_/g, ' ');
}
