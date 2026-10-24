/**
 * GymContext — holds the user's selected gym across the app.
 * Persisted to AsyncStorage so the choice survives restarts.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GYMS, getGymById } from '../data/gymData';

const STORAGE_KEY = '@repsin:selectedGymId';

const GymContext = createContext({ gym: GYMS[0], setGymById: () => {}, gyms: GYMS });

export function GymProvider({ children }) {
  const [gym, setGym] = useState(GYMS[0]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((id) => {
      if (id) setGym(getGymById(id));
    });
  }, []);

  const setGymById = async (id) => {
    const next = getGymById(id);
    setGym(next);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <GymContext.Provider value={{ gym, setGymById, gyms: GYMS }}>
      {children}
    </GymContext.Provider>
  );
}

export function useGym() {
  return useContext(GymContext);
}
