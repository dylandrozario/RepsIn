/**
 * Demo gym data for MVP
 * In production, this would come from a database or API
 */

// Real Boston gyms seeded from BestTime foot-traffic data (see
// ml-pipeline/scripts/seed_boston_gyms.py). Each gym's occupancy predictions
// in occupancyPredictions.json are derived from real venue busyness curves.
import bostonGyms from './bostonGyms.json';

export const GYMS = bostonGyms;

// Default selected gym (first in the list). The app still references DEMO_GYM
// throughout; it now points at a real Boston gym rather than a template.
export const DEMO_GYM = bostonGyms[0];

// Look up a gym by id, falling back to the default.
export function getGymById(id) {
  return bostonGyms.find((g) => g.id === id) || bostonGyms[0];
}

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
