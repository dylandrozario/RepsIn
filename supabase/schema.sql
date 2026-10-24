-- RepsIn Supabase schema: profiles + workout sessions, with Row Level Security.
--
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query) once.
-- It is idempotent-ish: safe to re-run; it uses IF NOT EXISTS where possible.
--
-- Security model: every row is owned by auth.uid(). RLS policies ensure a user
-- can only read/write their own rows, so no user can access another user's
-- private data even though they share one database.

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user (id == auth.users.id)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- workout_sessions: completed sessions / rep counts tied to a user
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  exercise      text not null,
  reps          integer not null default 0,
  good_reps     integer not null default 0,
  duration_sec  integer,
  performed_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists workout_sessions_user_idx
  on public.workout_sessions (user_id, performed_at desc);

alter table public.workout_sessions enable row level security;

drop policy if exists "sessions_select_own" on public.workout_sessions;
create policy "sessions_select_own"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.workout_sessions;
create policy "sessions_insert_own"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "sessions_update_own" on public.workout_sessions;
create policy "sessions_update_own"
  on public.workout_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sessions_delete_own" on public.workout_sessions;
create policy "sessions_delete_own"
  on public.workout_sessions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up (belt & suspenders;
-- the app also upserts the profile on sign-in).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
