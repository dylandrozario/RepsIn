/**
 * Auth context: Google OAuth via Supabase, session persistence/restore,
 * deep-link redirect handling, logout, and profile upsert.
 *
 * Flow (browser-based PKCE, works in a dev build; see AUTH_SETUP.md):
 *   1. signInWithOAuth({ provider: 'google', skipBrowserRedirect: true })
 *      returns a URL to open.
 *   2. WebBrowser.openAuthSessionAsync opens it; Google -> Supabase ->
 *      redirects back to our app via the `repsin://` scheme with a code.
 *   3. We exchange the code (PKCE) for a session, which Supabase persists.
 */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import storage from '../services/storageService';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext(null);

// Redirect back into the app after OAuth. Uses the `repsin` scheme from app.json.
const redirectTo = makeRedirectUri({ scheme: 'repsin', path: 'auth-callback' });

// A fake local session for previewing the UI without real Supabase/Google
// setup. Only usable when Supabase is NOT configured, so it can't leak into a
// real build. No network, no tokens — purely a local object.
const DEV_FAKE_SESSION = {
  access_token: 'dev-fake-token',
  user: {
    id: 'dev-00000000-0000-0000-0000-000000000000',
    email: 'demo@repsin.app',
    user_metadata: {
      full_name: 'Demo Athlete',
      avatar_url: null,
    },
  },
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);
  const [devMode, setDevMode] = useState(false);
  const profileSyncedFor = useRef(null);
  const signedOutRef = useRef(false); // true after explicit sign-out, blocks stale auth events

  // Restore any persisted session on launch, and subscribe to changes.
  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured) {
      setInitializing(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      // After an explicit sign-out, ignore any late TOKEN_REFRESHED/USER_UPDATED
      // events carrying the old session — only a real SIGNED_IN re-authenticates.
      if (signedOutRef.current) {
        if (event === 'SIGNED_IN' && newSession) {
          signedOutRef.current = false;
          setSession(newSession);
        }
        return;
      }
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Keep a Supabase profile row in sync whenever we have a user.
  // Skipped in dev-preview mode (no backend to talk to).
  useEffect(() => {
    const user = session?.user;
    if (!user || devMode || profileSyncedFor.current === user.id) return;
    profileSyncedFor.current = user.id;
    upsertProfile(user).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[auth] profile upsert failed:', e?.message);
    });
  }, [session, devMode]);

  // Instant fake sign-in for previewing the UI without any backend setup.
  const devSignIn = useCallback(() => {
    setError(null);
    signedOutRef.current = false;
    setDevMode(true);
    setSession(DEV_FAKE_SESSION);
  }, []);

  // Exchange the deep-link redirect (?code=...) for a session (PKCE).
  const createSessionFromUrl = useCallback(async (url) => {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);

    // PKCE returns a `code`; implicit returns access_token/refresh_token.
    if (params.code) {
      const { data, error: exErr } = await supabase.auth.exchangeCodeForSession(params.code);
      if (exErr) throw exErr;
      return data.session;
    }
    if (params.access_token) {
      const { data, error: setErr } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (setErr) throw setErr;
      return data.session;
    }
    return null;
  }, []);

  // Handle redirects that arrive while the app is already open.
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url) createSessionFromUrl(url).catch((e) => setError(e.message));
    });
    return () => sub?.remove?.();
  }, [createSessionFromUrl]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add your keys to .env (see .env.example).');
      return;
    }
    setSigningIn(true);
    try {
      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (oauthErr) throw oauthErr;

      const res = await WebBrowser.openAuthSessionAsync(data?.url ?? '', redirectTo);

      if (res.type === 'success' && res.url) {
        await createSessionFromUrl(res.url);
      } else if (res.type === 'cancel' || res.type === 'dismiss') {
        // User backed out of the browser — not an error, just stop.
        return;
      }
    } catch (e) {
      setError(e?.message || 'Sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  }, [createSessionFromUrl]);

  // Email + password sign-in (works in Expo Go — no OAuth redirect).
  const signInWithEmail = useCallback(async (email, password) => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add your keys to .env (see .env.example).');
      return false;
    }
    setSigningIn(true);
    try {
      signedOutRef.current = false;
      const { error: e } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (e) throw e;
      return true;
    } catch (e) {
      setError(e?.message || 'Sign-in failed.');
      return false;
    } finally {
      setSigningIn(false);
    }
  }, []);

  // Email + password sign-up. Supabase securely stores the password hash — the
  // app never handles or stores a raw password beyond this call.
  const signUpWithEmail = useCallback(async (email, password, fullName) => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add your keys to .env (see .env.example).');
      return { ok: false };
    }
    setSigningIn(true);
    try {
      const { data, error: e } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName?.trim() || undefined } },
      });
      if (e) throw e;
      // If email confirmation is OFF, a session is returned and onAuthStateChange
      // logs the user in. If it's ON, there's no session yet — tell the user.
      return { ok: true, needsConfirmation: !data.session };
    } catch (e) {
      setError(e?.message || 'Sign-up failed.');
      return { ok: false };
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setError(null);

    // 1) Flip the UI to signed-out IMMEDIATELY — don't wait on the network.
    //    This is what sends the user back to the login screen.
    signedOutRef.current = true; // block stale token-refresh events from re-logging in
    profileSyncedFor.current = null;
    setDevMode(false);
    setSession(null);

    // 2) Revoke the Supabase session + clear local cache in the background.
    //    Use local scope (no server round-trip that can hang on bad networks).
    (async () => {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[auth] signOut:', e?.message);
      }
      try { await storage.clearUserData(); } catch {}
    })();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    profile: deriveProfile(session?.user),
    initializing,
    signingIn,
    error,
    isConfigured: isSupabaseConfigured,
    devMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    devSignIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Pull name/email/avatar from the Google identity in user_metadata.
function deriveProfile(user) {
  if (!user) return null;
  const m = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || m.email || null,
    name: m.full_name || m.name || (user.email ? user.email.split('@')[0] : 'Athlete'),
    avatarUrl: m.avatar_url || m.picture || null,
  };
}

// Create/update the user's row in the `profiles` table.
async function upsertProfile(user) {
  const p = deriveProfile(user);
  if (!p) return;
  const { error } = await supabase.from('profiles').upsert(
    {
      id: p.id,
      email: p.email,
      full_name: p.name,
      avatar_url: p.avatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
}
