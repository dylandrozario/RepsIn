/**
 * Supabase client for React Native / Expo.
 *
 * - Sessions persist in AsyncStorage and auto-refresh.
 * - PKCE flow type (secure for public clients; no client secret in the app).
 * - detectSessionInUrl is false: we handle the OAuth redirect manually via the
 *   deep link (see src/auth/AuthContext.js).
 *
 * Config comes from EXPO_PUBLIC_* env vars (see .env.example). These are the
 * PUBLIC url + anon key only — never the service_role key.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Don't throw — let the app render a clear "not configured" message instead
  // of crashing. The login screen surfaces this to the user.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill them in.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'public-anon-placeholder',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
);

// Supabase recommends driving token auto-refresh off app foreground/background.
AppState.addEventListener('change', (state) => {
  if (!isSupabaseConfigured) return;
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
