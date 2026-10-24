/**
 * Geometry helpers for pose-based angle computation.
 * JS port of squat-tracker/src/geometry.py.
 *
 * MediaPipe pose landmarks are normalized (x, y in [0, 1], plus z and
 * visibility). For angle math we only need the 2D (x, y) projection, which is
 * robust enough for form tracking from a side/front view.
 */

// MediaPipe Pose landmark indices (BlazePose 33-point model).
export const LM = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_FOOT: 31,
  RIGHT_FOOT: 32,
};

/**
 * Return the angle in degrees at vertex `b` formed by points a-b-c.
 * Uses 2D coordinates (x, y). Result is in range [0, 180].
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 * @param {{x:number,y:number}} c
 */
export function angle(a, b, c) {
  if (!a || !b || !c) return null;
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const dot = baX * bcX + baY * bcY;
  const magBa = Math.hypot(baX, baY);
  const magBc = Math.hypot(bcX, bcY);
  if (magBa === 0 || magBc === 0) return 0.0;

  let cosAngle = dot / (magBa * magBc);
  // Clamp to [-1, 1] to guard against floating point drift.
  cosAngle = Math.max(-1.0, Math.min(1.0, cosAngle));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

/** Extract an {x, y} from a MediaPipe landmark object. */
export function toXY(landmark) {
  return { x: landmark.x, y: landmark.y };
}

/** Return the {x, y} for a landmark index from a landmark list, or null. */
export function getPoint(landmarks, index) {
  const lm = landmarks?.[index];
  if (!lm) return null;
  return { x: lm.x, y: lm.y };
}

/** Return the visibility score (0..1) for a landmark index. */
export function visibility(landmarks, index) {
  const lm = landmarks?.[index];
  if (!lm) return 0;
  return lm.visibility ?? 1.0;
}

/** Convenience: angle at joint b given three landmark indices. */
export function jointAngle(landmarks, ai, bi, ci) {
  return angle(getPoint(landmarks, ai), getPoint(landmarks, bi), getPoint(landmarks, ci));
}
