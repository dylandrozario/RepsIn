/**
 * Local Storage Service using AsyncStorage
 * Handles persisting user preferences, schedules, and workout data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_PREFERENCES: '@repsin:userPreferences',
  AVAILABILITY_WINDOWS: '@repsin:availabilityWindows',
  SCHEDULED_WORKOUTS: '@repsin:scheduledWorkouts',
  COMPLETED_WORKOUTS: '@repsin:completedWorkouts',
  SELECTED_GYM: '@repsin:selectedGym',
};

class StorageService {
  // User Preferences
  async saveUserPreferences(preferences) {
    try {
      await AsyncStorage.setItem(KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return false;
    }
  }

  async getUserPreferences() {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return null;
    }
  }

  // Availability Windows
  async saveAvailabilityWindows(windows) {
    try {
      await AsyncStorage.setItem(KEYS.AVAILABILITY_WINDOWS, JSON.stringify(windows));
      return true;
    } catch (error) {
      console.error('Error saving availability:', error);
      return false;
    }
  }

  async getAvailabilityWindows() {
    try {
      const data = await AsyncStorage.getItem(KEYS.AVAILABILITY_WINDOWS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading availability:', error);
      return [];
    }
  }

  // Scheduled Workouts
  async saveScheduledWorkouts(workouts) {
    try {
      await AsyncStorage.setItem(KEYS.SCHEDULED_WORKOUTS, JSON.stringify(workouts));
      return true;
    } catch (error) {
      console.error('Error saving scheduled workouts:', error);
      return false;
    }
  }

  async getScheduledWorkouts() {
    try {
      const data = await AsyncStorage.getItem(KEYS.SCHEDULED_WORKOUTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading scheduled workouts:', error);
      return [];
    }
  }

  // Completed Workouts
  async saveCompletedWorkouts(workouts) {
    try {
      await AsyncStorage.setItem(KEYS.COMPLETED_WORKOUTS, JSON.stringify(workouts));
      return true;
    } catch (error) {
      console.error('Error saving completed workouts:', error);
      return false;
    }
  }

  async getCompletedWorkouts() {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMPLETED_WORKOUTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading completed workouts:', error);
      return [];
    }
  }

  // Selected Gym
  async saveSelectedGym(gym) {
    try {
      await AsyncStorage.setItem(KEYS.SELECTED_GYM, JSON.stringify(gym));
      return true;
    } catch (error) {
      console.error('Error saving gym:', error);
      return false;
    }
  }

  async getSelectedGym() {
    try {
      const data = await AsyncStorage.getItem(KEYS.SELECTED_GYM);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading gym:', error);
      return null;
    }
  }

  // Clear all data
  async clearAll() {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
}

export default new StorageService();
