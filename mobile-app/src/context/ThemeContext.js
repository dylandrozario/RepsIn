/**
 * ThemeContext — provides the user's chosen accent color across the whole app.
 * Persisted to AsyncStorage so the choice survives restarts.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@repsin:accentTheme';

export const THEME_PRESETS = [
  { id: 'purple',  label: 'Purple',       accent: '#6D28D9', accentBright: '#7C3AED', accentSoft: '#EDE7FB', accentMid: '#A78BFA' },
  { id: 'sky',     label: 'Sky Blue',     accent: '#0284C7', accentBright: '#0EA5E9', accentSoft: '#E0F2FE', accentMid: '#38BDF8' },
  { id: 'pink',    label: 'Pink',         accent: '#BE185D', accentBright: '#DB2777', accentSoft: '#FCE7F3', accentMid: '#F472B6' },
  { id: 'orange',  label: 'Sunrise',      accent: '#C2410C', accentBright: '#EA580C', accentSoft: '#FFF7ED', accentMid: '#FB923C' },
  { id: 'green',   label: 'Forest',       accent: '#047857', accentBright: '#059669', accentSoft: '#ECFDF5', accentMid: '#34D399' },
  { id: 'rose',    label: 'Rose',         accent: '#BE123C', accentBright: '#E11D48', accentSoft: '#FFF1F2', accentMid: '#FB7185' },
];

const DEFAULT = THEME_PRESETS[0]; // purple

const ThemeContext = createContext({ theme: DEFAULT, setThemeById: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((id) => {
      if (id) {
        const found = THEME_PRESETS.find((p) => p.id === id);
        if (found) setTheme(found);
      }
    });
  }, []);

  const setThemeById = async (id) => {
    const found = THEME_PRESETS.find((p) => p.id === id);
    if (!found) return;
    setTheme(found);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeById }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
