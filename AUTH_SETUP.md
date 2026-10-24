# Google Sign-In (Supabase Auth) — Setup

RepsIn uses **Supabase Auth** with **Google OAuth** (browser-based PKCE flow).
Sessions persist in AsyncStorage and auto-restore on launch.

> **Important:** The OAuth redirect back into the app uses a custom URL scheme
> (`repsin://`). This works in a **development build**, not in Expo Go. Build
> the dev client once (below) and you can then use `expo start --dev-client`
> for fast iteration.

---

## 1. Supabase project

1. Create a project at https://supabase.com (free tier is fine).
2. **Project Settings → API**: copy the **Project URL** and the **anon / public** key.
3. **SQL Editor → New query**: paste the contents of `supabase/schema.sql` and run it.
   This creates `profiles` + `workout_sessions` with Row Level Security so each
   user can only see their own rows.
4. (Backend only) **Project Settings → API → JWT Secret**: copy it for step 4.

## 2. Google Cloud OAuth client

1. https://console.cloud.google.com → create/select a project.
2. **APIs & Services → OAuth consent screen**: External, add your email as a
   test user.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID →
   Web application**.
4. Under **Authorized redirect URIs** add your Supabase callback:
   ```
   https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
5. Copy the **Client ID** and **Client secret**.

## 3. Connect Google to Supabase

1. Supabase Dashboard → **Authentication → Providers → Google** → enable.
2. Paste the Google **Client ID** and **Client secret**. Save.
3. **Authentication → URL Configuration → Redirect URLs**: add
   ```
   repsin://auth-callback
   ```
   (The client secret stays in Supabase; it is **never** in the mobile app.)

## 4. Environment variables

**Mobile** — copy and fill:
```bash
cd mobile-app
cp .env.example .env
# EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

**Backend (optional auth)** — copy and fill:
```bash
cd squat-tracker/server
cp .env.example .env
# SUPABASE_JWT_SECRET=<JWT secret from step 1.4>
# SUPABASE_PROJECT_REF=<ref>
```

`.env` files are git-ignored; only `.env.example` is committed.

## 5. Build the dev client (needed once for native redirects)

```bash
cd mobile-app
npx expo run:ios      # or: npx expo run:android
```

After that you can iterate with:
```bash
npx expo start --dev-client
```

---

## Testing the flow

1. Launch the app → you should see the **Login** screen.
2. Tap **Continue with Google** → browser opens → pick your Google account →
   it redirects back into the app and you land on Home (or Onboarding first run).
3. **Session restore:** fully quit and reopen the app → you stay signed in.
4. **Cancellation:** tap Continue with Google, then dismiss the browser →
   no error, you stay on Login.
5. **Logout:** go to the **You** tab → Sign out → back to Login.
6. **Protected data:** RLS ensures a second Google account only sees its own
   `profiles` / `workout_sessions` rows.

## Backend auth check (optional)

With `SUPABASE_JWT_SECRET` set and the server running:
```bash
# anonymous still works:
curl -X POST http://localhost:8000/analyze -H 'Content-Type: application/json' -d '{"image":"","exercise":"squat"}'
# protected endpoint rejects without a token:
curl -i http://localhost:8000/me            # -> 401
# with a real token from the app it returns {"userId": "...", ...}
```

---

## Known blockers / manual steps

- **Requires a dev build.** Expo Go cannot handle the `repsin://` redirect.
- **Real credentials required.** The login flow cannot be tested end-to-end
  without a real Supabase project + Google OAuth client. Steps 1–4 are manual.
- **Physical device recommended** for the Google browser redirect (works on
  simulators too, but device is the realistic demo).
- No credentials are committed anywhere in this repo.
