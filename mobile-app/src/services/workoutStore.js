/**
 * Workout habit store — the brain behind scheduling, completion, weekly goals,
 * streaks, history, and rescheduling. Pure logic over AsyncStorage (via
 * storageService), so it works offline and in Expo Go.
 *
 * A scheduled workout:
 *   { id, weekday, hour, date (ISO yyyy-mm-dd), exercise/templateName,
 *     duration, status: 'scheduled' | 'completed' | 'missed', completedAt }
 *
 * Weeks are Monday-based to match the Home week strip.
 */
import storage from './storageService';

// ---- date helpers (Monday-based weeks) ------------------------------------

export function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function isoDate(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

export function weekdayName(d) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    new Date(d).getDay()
  ];
}

// Next date (ISO) for a given weekday name on/after `from`.
export function nextDateForWeekday(weekday, from = new Date()) {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const target = names.indexOf(weekday);
  if (target < 0) return isoDate(from);
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    if (d.getDay() === target) return isoDate(d);
    d.setDate(d.getDate() + 1);
  }
  return isoDate(from);
}

function uid() {
  return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ---- CRUD -----------------------------------------------------------------

export async function getScheduled() {
  const list = await storage.getScheduledWorkouts();
  return Array.isArray(list) ? list : [];
}

export async function getCompleted() {
  const list = await storage.getCompletedWorkouts();
  return Array.isArray(list) ? list : [];
}

/**
 * Schedule a workout. Prevents double-booking the same date+hour.
 * @returns { ok, conflict?, workout? }
 */
export async function scheduleWorkout({ weekday, hour, date, templateName, duration, exercises }) {
  const scheduled = await getScheduled();
  const theDate = date || nextDateForWeekday(weekday);
  const conflict = scheduled.some(
    (s) => s.date === theDate && s.hour === hour && s.status === 'scheduled'
  );
  if (conflict) return { ok: false, conflict: true };

  const workout = {
    id: uid(),
    weekday: weekday || weekdayName(theDate),
    hour,
    date: theDate,
    templateName: templateName || 'Workout',
    duration: duration || 45,
    exercises: exercises || [],
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  scheduled.push(workout);
  await storage.saveScheduledWorkouts(scheduled);
  return { ok: true, workout };
}

export async function completeWorkout(id) {
  const scheduled = await getScheduled();
  const idx = scheduled.findIndex((s) => s.id === id);
  if (idx === -1) return { ok: false };
  const w = { ...scheduled[idx], status: 'completed', completedAt: new Date().toISOString() };
  scheduled[idx] = w;
  await storage.saveScheduledWorkouts(scheduled);

  // Mirror into the completed-history list.
  const completed = await getCompleted();
  completed.push(w);
  await storage.saveCompletedWorkouts(completed);
  return { ok: true, workout: w };
}

export async function rescheduleWorkout(id, { date, weekday, hour }) {
  const scheduled = await getScheduled();
  const idx = scheduled.findIndex((s) => s.id === id);
  if (idx === -1) return { ok: false };
  scheduled[idx] = {
    ...scheduled[idx],
    date: date || scheduled[idx].date,
    weekday: weekday || scheduled[idx].weekday,
    hour: hour != null ? hour : scheduled[idx].hour,
    status: 'scheduled',
  };
  await storage.saveScheduledWorkouts(scheduled);
  return { ok: true, workout: scheduled[idx] };
}

export async function removeWorkout(id) {
  const scheduled = await getScheduled();
  await storage.saveScheduledWorkouts(scheduled.filter((s) => s.id !== id));
  return { ok: true };
}

/**
 * Mark past scheduled workouts as missed (anything scheduled before today that
 * wasn't completed). Non-destructive: keeps them so the user can reschedule.
 */
export async function reconcileMissed() {
  const scheduled = await getScheduled();
  const today = isoDate(new Date());
  let changed = false;
  const next = scheduled.map((s) => {
    if (s.status === 'scheduled' && s.date < today) {
      changed = true;
      return { ...s, status: 'missed' };
    }
    return s;
  });
  if (changed) await storage.saveScheduledWorkouts(next);
  return next;
}

// ---- weekly goal ----------------------------------------------------------

export async function getWeeklyGoal() {
  const prefs = await storage.getUserPreferences();
  return prefs?.weeklyGoal || 3;
}

// ---- derived stats --------------------------------------------------------

/**
 * This week's progress + the 7-day strip.
 * Returns { goal, completed, scheduled, days: [{ weekdayLetter, dateNum,
 *   status: 'completed'|'scheduled'|'missed'|'empty'|'today' }] }
 */
export async function getWeekSummary() {
  const [scheduled, goal] = await Promise.all([reconcileMissed(), getWeeklyGoal()]);
  const weekStart = startOfWeek();
  const weekStartIso = isoDate(weekStart);
  const todayIso = isoDate(new Date());

  const thisWeek = scheduled.filter((s) => {
    return s.date >= weekStartIso && daysBetween(weekStartIso, s.date) < 7;
  });

  const completedCount = thisWeek.filter((s) => s.status === 'completed').length;
  const scheduledCount = thisWeek.filter((s) => s.status === 'scheduled').length;

  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const di = isoDate(d);
    const dayWorkouts = thisWeek.filter((s) => s.date === di);
    let status = 'empty';
    if (dayWorkouts.some((s) => s.status === 'completed')) status = 'completed';
    else if (dayWorkouts.some((s) => s.status === 'missed')) status = 'missed';
    else if (dayWorkouts.some((s) => s.status === 'scheduled')) status = 'scheduled';
    else if (di === todayIso) status = 'today';
    days.push({ letter: letters[i], dateNum: d.getDate(), status, date: di });
  }

  return { goal, completed: completedCount, scheduled: scheduledCount, days };
}

/**
 * Consistency streak = consecutive weeks (including this one if on-track or
 * complete) where the user met their weekly goal. Simple, forgiving version:
 * counts completed workouts per week back from this week until a week misses
 * the goal. The current week counts if goal already met.
 */
export async function getStreak() {
  const [scheduled, goal] = await Promise.all([getCompleted(), getWeeklyGoal()]);
  if (!scheduled.length) return 0;

  const byWeek = new Map();
  for (const w of scheduled) {
    if (w.status !== 'completed') continue;
    const key = isoDate(startOfWeek(new Date(w.date)));
    byWeek.set(key, (byWeek.get(key) || 0) + 1);
  }

  let streak = 0;
  const cursor = startOfWeek(new Date());
  // Walk back week by week.
  for (let i = 0; i < 52; i++) {
    const key = isoDate(cursor);
    const count = byWeek.get(key) || 0;
    if (i === 0) {
      // Current week: only counts toward streak if goal met; don't break if not.
      if (count >= goal) streak += 1;
    } else if (count >= goal) {
      streak += 1;
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

/** Next upcoming scheduled workout (soonest future date/hour). */
export async function getNextWorkout() {
  const scheduled = await reconcileMissed();
  const now = new Date();
  const todayIso = isoDate(now);
  const upcoming = scheduled
    .filter((s) => s.status === 'scheduled' && s.date >= todayIso)
    .sort((a, b) => (a.date === b.date ? a.hour - b.hour : a.date < b.date ? -1 : 1));
  return upcoming[0] || null;
}

/** Full history, newest first. */
export async function getHistory() {
  const completed = await getCompleted();
  return [...completed].sort((a, b) =>
    (b.completedAt || b.date).localeCompare(a.completedAt || a.date)
  );
}

function daysBetween(aIso, bIso) {
  const a = new Date(aIso);
  const b = new Date(bIso);
  return Math.round((b - a) / 86400000);
}
