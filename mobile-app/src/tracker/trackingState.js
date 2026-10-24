/**
 * Tiny shared store for whether the bottom nav should be hidden.
 *
 * Several full-screen moments hide the nav: camera tracking, the first-run
 * availability grid, and the best-time reveal. Each caller sets a boolean
 * reason; the nav hides if ANY reason is active.
 */
import { useSyncExternalStore } from 'react';

const reasons = new Set(); // active hide reasons
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

/** Set a named hide reason on/off (e.g. 'tracking', 'availability', 'reveal'). */
export function setNavHidden(reason, hidden) {
  const was = reasons.size > 0;
  if (hidden) reasons.add(reason);
  else reasons.delete(reason);
  if ((reasons.size > 0) !== was) emit();
}

// Back-compat: the tracker screen calls setTracking(bool).
export function setTracking(active) {
  setNavHidden('tracking', active);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return reasons.size > 0;
}

/** Hook: true when the nav should be hidden. */
export function useTracking() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** Alias with a clearer name for non-tracking callers. */
export const useNavHidden = useTracking;
