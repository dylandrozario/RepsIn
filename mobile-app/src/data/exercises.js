/**
 * Exercise database for workout generation (Requirement 11).
 * Each exercise maps to an equipment type available in gymData.
 */

export const EXERCISES = [
  // Legs
  { id: 'goblet_squat', name: 'Goblet squat', muscles: ['quads', 'glutes'], equipment: 'dumbbells', difficulty: 'beginner', pattern: 'legs', cue: 'Keep your chest tall and drive through your heels.' },
  { id: 'barbell_squat', name: 'Barbell back squat', muscles: ['quads', 'glutes'], equipment: 'squat_rack', difficulty: 'intermediate', pattern: 'legs', cue: 'Brace your core before you descend; knees track over toes.' },
  { id: 'leg_press', name: 'Leg press', muscles: ['quads', 'glutes'], equipment: 'leg_press', difficulty: 'beginner', pattern: 'legs', cue: 'Lower until knees reach 90 degrees, then press without locking out.' },
  { id: 'romanian_deadlift', name: 'Romanian deadlift', muscles: ['hamstrings', 'glutes'], equipment: 'dumbbells', difficulty: 'intermediate', pattern: 'legs', cue: 'Hinge at the hips, soft knees, feel the hamstring stretch.' },
  { id: 'smith_lunge', name: 'Smith machine lunge', muscles: ['quads', 'glutes'], equipment: 'smith_machine', difficulty: 'intermediate', pattern: 'legs', cue: 'Step into a split stance and drop straight down.' },

  // Push
  { id: 'bench_press', name: 'Barbell bench press', muscles: ['chest', 'triceps'], equipment: 'bench_press', difficulty: 'intermediate', pattern: 'push', cue: 'Retract your shoulder blades; bar touches mid-chest.' },
  { id: 'db_bench', name: 'Dumbbell bench press', muscles: ['chest', 'triceps'], equipment: 'dumbbells', difficulty: 'beginner', pattern: 'push', cue: 'Press the dumbbells up and slightly together at the top.' },
  { id: 'smith_press', name: 'Smith machine press', muscles: ['chest', 'shoulders'], equipment: 'smith_machine', difficulty: 'beginner', pattern: 'push', cue: 'Controlled tempo, full range on the fixed bar path.' },
  { id: 'cable_fly', name: 'Cable chest fly', muscles: ['chest'], equipment: 'cable_machine', difficulty: 'beginner', pattern: 'push', cue: 'Slight bend in the elbows, squeeze at the center.' },

  // Pull
  { id: 'cable_row', name: 'Seated cable row', muscles: ['back', 'biceps'], equipment: 'cable_machine', difficulty: 'beginner', pattern: 'pull', cue: 'Pull to your waist, drive the elbows back, squeeze the lats.' },
  { id: 'db_row', name: 'Chest-supported dumbbell row', muscles: ['back', 'biceps'], equipment: 'dumbbells', difficulty: 'beginner', pattern: 'pull', cue: 'Keep your torso still and row the weight to your ribs.' },
  { id: 'lat_pulldown', name: 'Lat pulldown', muscles: ['back', 'biceps'], equipment: 'cable_machine', difficulty: 'beginner', pattern: 'pull', cue: 'Pull the bar to your collarbone, elbows down and back.' },

  // Cardio / endurance
  { id: 'treadmill_intervals', name: 'Treadmill intervals', muscles: ['cardio'], equipment: 'treadmill', difficulty: 'beginner', pattern: 'cardio', cue: 'Alternate 1 min hard, 1 min easy to keep the heart rate up.' },
  { id: 'rowing_sprints', name: 'Rowing sprints', muscles: ['cardio', 'back'], equipment: 'rowing_machine', difficulty: 'beginner', pattern: 'cardio', cue: 'Drive with the legs first, then the back, then the arms.' },
  { id: 'steady_row', name: 'Steady-state row', muscles: ['cardio'], equipment: 'rowing_machine', difficulty: 'beginner', pattern: 'cardio', cue: 'Find a sustainable pace you can hold for the full block.' },
];

// Map goal -> preferred movement patterns and template name.
export const GOAL_TEMPLATES = {
  muscle_building: { name: 'Full body hypertrophy', patterns: ['legs', 'push', 'pull'], reps: [8, 12], rest: 75 },
  strength: { name: 'Full body strength', patterns: ['legs', 'push', 'pull'], reps: [5, 8], rest: 90 },
  endurance: { name: 'Endurance circuit', patterns: ['cardio', 'legs', 'pull'], reps: [12, 15], rest: 45 },
  general_fitness: { name: 'Balanced full body', patterns: ['legs', 'push', 'pull', 'cardio'], reps: [10, 12], rest: 60 },
  weight_management: { name: 'Metabolic conditioning', patterns: ['cardio', 'legs', 'push'], reps: [12, 15], rest: 45 },
};

// Rough minutes a single exercise takes (incl. rest) by rest length.
export function minutesPerExercise(sets, rest) {
  const working = sets * 0.75; // ~45s per set
  const resting = (sets - 1) * (rest / 60);
  return working + resting + 1; // + setup
}
