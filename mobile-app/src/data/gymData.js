/**
 * Demo gym data for MVP
 * In production, this would come from a database or API
 */

export const DEMO_GYM = {
  id: 'gym-001',
  name: 'FitZone Downtown',
  address: '123 Main Street, Downtown',
  operatingHours: {
    Monday: { open: 6, close: 22 },
    Tuesday: { open: 6, close: 22 },
    Wednesday: { open: 6, close: 22 },
    Thursday: { open: 6, close: 22 },
    Friday: { open: 6, close: 22 },
    Saturday: { open: 8, close: 20 },
    Sunday: { open: 8, close: 20 },
  },
  equipment: [
    { type: 'bench_press', name: 'Bench Press', units: 3 },
    { type: 'squat_rack', name: 'Squat Rack', units: 2 },
    { type: 'leg_press', name: 'Leg Press', units: 2 },
    { type: 'cable_machine', name: 'Cable Machine', units: 4 },
    { type: 'treadmill', name: 'Treadmill', units: 10 },
    { type: 'rowing_machine', name: 'Rowing Machine', units: 5 },
    { type: 'dumbbells', name: 'Dumbbell Area', units: 15 },
    { type: 'smith_machine', name: 'Smith Machine', units: 1 },
  ]
};

export const FITNESS_GOALS = [
  { id: 'muscle_building', label: 'Muscle Building', icon: '💪' },
  { id: 'strength', label: 'Strength', icon: '🏋️' },
  { id: 'endurance', label: 'Endurance', icon: '🏃' },
  { id: 'general_fitness', label: 'General Fitness', icon: '🌟' },
  { id: 'weight_management', label: 'Weight Management', icon: '⚖️' },
];

export const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'New to working out' },
  { id: 'intermediate', label: 'Intermediate', description: '6+ months experience' },
  { id: 'advanced', label: 'Advanced', description: '2+ years experience' },
];

export const WORKOUT_DURATIONS = [20, 30, 45, 60, 90];

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
