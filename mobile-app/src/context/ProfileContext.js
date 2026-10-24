/**
 * ProfileContext — the user's editable profile (name, username, avatar,
 * goal, experience, session length, weekly target). Persisted to AsyncStorage.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@repsin:profile';

const DEFAULT_PROFILE = {
  name: 'Alex Morgan',
  username: 'alexm',
  avatarUri: null,          // local image uri, or null → show initials
  goal: 'strength',         // matches FITNESS_GOALS ids
  experience: 'intermediate',
  duration: 45,
  weeklyTarget: 4,
};

const ProfileContext = createContext({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
  initials: 'AM',
});

function computeInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) });
        } catch {}
      }
    });
  }, []);

  const updateProfile = useCallback(async (patch) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, initials: computeInitials(profile.name) }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
