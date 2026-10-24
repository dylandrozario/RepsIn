/**
 * Pluggable exercises: rep-counting state machines + form evaluation.
 * JS port of squat-tracker/src/exercises/*.py, extended with more movements.
 *
 * Each exercise consumes per-frame MediaPipe landmarks and returns an
 * ExerciseResult: { reps, goodReps, state, formOk, cues, primaryAngle, poseDetected }.
 *
 * Rep counting uses a two-state machine driven by a primary joint angle with
 * hysteresis (two thresholds) so jitter near a single boundary cannot produce
 * phantom reps:
 *     angle <= DOWN_ANGLE -> enter the "down" state
 *     angle >= UP_ANGLE   -> enter the "up" state (counts a rep if we were down)
 *
 * Form is evaluated continuously; at the moment a rep completes, the worst
 * value seen during the rep labels it good or bad.
 */
import { LM, jointAngle, visibility } from './geometry';

const VIS_THRESHOLD = 0.5;

function emptyResult(extra = {}) {
  return {
    reps: 0,
    goodReps: 0,
    state: 'unknown',
    formOk: true,
    cues: [],
    primaryAngle: null,
    poseDetected: false,
    ...extra,
  };
}

/** Base class holding shared rep/state bookkeeping. */
class Exercise {
  constructor(name) {
    this.name = name;
    this._reps = 0;
    this._goodReps = 0;
    this._state = this.upState;
  }

  // Subclasses override these.
  get upState() { return 'up'; }
  get downState() { return 'down'; }

  get reps() { return this._reps; }
  get goodReps() { return this._goodReps; }
  get state() { return this._state; }

  reset() {
    this._reps = 0;
    this._goodReps = 0;
    this._state = this.upState;
  }

  // eslint-disable-next-line no-unused-vars
  update(landmarks) {
    throw new Error('update() not implemented');
  }
}

/**
 * Generic single-angle rep tracker used by most exercises.
 * Config:
 *   downAngle / upAngle : hysteresis thresholds on the primary angle
 *   primary(landmarks)  : () => number | null  (the rep-driving angle)
 *   evaluateForm(acc)   : () => [formOk, cues]  from accumulated worst values
 *   accumulate(acc, lm) : mutate per-rep accumulator each frame
 *   requiredLandmarks   : indices that must be visible
 *   lowerIsDown         : true if a SMALLER angle means the "down" phase
 */
class AngleRepExercise extends Exercise {
  constructor(name, cfg) {
    super(name);
    this.cfg = cfg;
    this._acc = this._freshAcc();
  }

  get upState() { return this.cfg.upLabel || 'up'; }
  get downState() { return this.cfg.downLabel || 'down'; }

  _freshAcc() {
    return this.cfg.freshAcc ? this.cfg.freshAcc() : {};
  }

  update(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      return emptyResult({ state: this._state, reps: this._reps, goodReps: this._goodReps, cues: ['No person detected'] });
    }

    const required = this.cfg.requiredLandmarks || [];
    const allVisible = required.every((i) => visibility(landmarks, i) >= VIS_THRESHOLD);
    if (!allVisible) {
      return emptyResult({
        poseDetected: true,
        state: this._state,
        reps: this._reps,
        goodReps: this._goodReps,
        cues: ['Step fully into frame'],
      });
    }

    const primary = this.cfg.primary(landmarks);
    if (primary == null) {
      return emptyResult({
        poseDetected: true,
        state: this._state,
        reps: this._reps,
        goodReps: this._goodReps,
        cues: ['Step fully into frame'],
      });
    }

    // Accumulate worst-case form values for the current rep.
    this.cfg.accumulate(this._acc, landmarks, primary);

    return this._advance(primary, landmarks);
  }

  _advance(primary, landmarks) {
    const { downAngle, upAngle, lowerIsDown = true } = this.cfg;
    let repCompleted = false;

    if (lowerIsDown) {
      // smaller angle = down phase
      if (this._state === this.upState && primary <= downAngle) {
        this._state = this.downState;
      } else if (this._state === this.downState && primary >= upAngle) {
        this._state = this.upState;
        repCompleted = true;
      }
    } else {
      // larger angle = down phase (e.g. a curl flexes to a small angle, so invert)
      if (this._state === this.upState && primary >= downAngle) {
        this._state = this.downState;
      } else if (this._state === this.downState && primary <= upAngle) {
        this._state = this.upState;
        repCompleted = true;
      }
    }

    let formOk = true;
    let cues = [];

    if (repCompleted) {
      [formOk, cues] = this.cfg.evaluateForm(this._acc);
      this._reps += 1;
      if (formOk) this._goodReps += 1;
      this._acc = this._freshAcc();
    } else {
      // Live cues during the movement (non-counting feedback).
      [formOk, cues] = this.cfg.liveForm
        ? this.cfg.liveForm(this._acc, primary, this._state === this.downState)
        : [true, []];
    }

    return {
      reps: this._reps,
      goodReps: this._goodReps,
      state: this._state,
      formOk,
      cues,
      primaryAngle: primary,
      poseDetected: true,
      repCompleted,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Squat — faithful port of exercises/squat.py                         */
/* Thresholds recovered from the compiled tracker:                     */
/*   DOWN_ANGLE=100  UP_ANGLE=160  DEPTH_TARGET=70                      */
/*   MIN_BACK_ANGLE=110  SYMMETRY_TOLERANCE=25                          */
/* ------------------------------------------------------------------ */
const SQUAT = {
  downAngle: 100.0,
  upAngle: 160.0,
  depthTarget: 70.0,
  minBackAngle: 110.0,
  symmetryTolerance: 25.0,
  upLabel: 'standing',
  downLabel: 'squatting',
  lowerIsDown: true,
  requiredLandmarks: [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  freshAcc: () => ({ minKnee: 180.0, minBack: 180.0, maxSym: 0.0 }),
  primary(landmarks) {
    // Mean knee angle (hip-knee-ankle) across both legs.
    const l = jointAngle(landmarks, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE);
    const r = jointAngle(landmarks, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE);
    if (l == null || r == null) return null;
    return (l + r) / 2.0;
  },
  accumulate(acc, landmarks, knee) {
    const lKnee = jointAngle(landmarks, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE);
    const rKnee = jointAngle(landmarks, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE);
    const lBack = jointAngle(landmarks, LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE);
    const rBack = jointAngle(landmarks, LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE);
    const back = (lBack + rBack) / 2.0;
    const sym = Math.abs((lKnee ?? 0) - (rKnee ?? 0));
    acc.minKnee = Math.min(acc.minKnee, knee);
    acc.minBack = Math.min(acc.minBack, back);
    acc.maxSym = Math.max(acc.maxSym, sym);
  },
  evaluateForm(acc) {
    const cues = [];
    if (acc.minKnee > SQUAT.depthTarget) cues.push('Go deeper');
    if (acc.minBack < SQUAT.minBackAngle) cues.push('Keep your chest up');
    if (acc.maxSym > SQUAT.symmetryTolerance) cues.push('Keep knees even');
    return [cues.length === 0, cues];
  },
};

/* ------------------------------------------------------------------ */
/* Push-up — elbow angle drives reps; hips should stay in line         */
/* ------------------------------------------------------------------ */
const PUSHUP = {
  downAngle: 90.0,
  upAngle: 160.0,
  depthTarget: 95.0,
  minBodyLine: 160.0, // shoulder-hip-knee near straight
  upLabel: 'up',
  downLabel: 'down',
  lowerIsDown: true,
  requiredLandmarks: [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, LM.LEFT_HIP, LM.LEFT_KNEE],
  freshAcc: () => ({ minElbow: 180.0, minBodyLine: 180.0 }),
  primary(landmarks) {
    const l = jointAngle(landmarks, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST);
    const r = jointAngle(landmarks, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST);
    if (l == null && r == null) return null;
    if (l == null) return r;
    if (r == null) return l;
    return (l + r) / 2.0;
  },
  accumulate(acc, landmarks, elbow) {
    const bodyL = jointAngle(landmarks, LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE);
    const bodyR = jointAngle(landmarks, LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE);
    const body = Math.min(bodyL ?? 180, bodyR ?? 180);
    acc.minElbow = Math.min(acc.minElbow, elbow);
    acc.minBodyLine = Math.min(acc.minBodyLine, body);
  },
  evaluateForm(acc) {
    const cues = [];
    if (acc.minElbow > PUSHUP.depthTarget) cues.push('Lower your chest more');
    if (acc.minBodyLine < PUSHUP.minBodyLine) cues.push('Keep your hips in line');
    return [cues.length === 0, cues];
  },
};

/* ------------------------------------------------------------------ */
/* Forward lunge — front-knee angle drives reps                        */
/* ------------------------------------------------------------------ */
const LUNGE = {
  downAngle: 100.0,
  upAngle: 160.0,
  depthTarget: 100.0,
  minBackAngle: 150.0, // torso upright (shoulder-hip-knee)
  upLabel: 'standing',
  downLabel: 'lunging',
  lowerIsDown: true,
  requiredLandmarks: [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  freshAcc: () => ({ minFront: 180.0, minBack: 180.0 }),
  primary(landmarks) {
    // Use whichever knee is more bent (the front leg).
    const l = jointAngle(landmarks, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE);
    const r = jointAngle(landmarks, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE);
    if (l == null && r == null) return null;
    return Math.min(l ?? 180, r ?? 180);
  },
  accumulate(acc, landmarks, front) {
    const backL = jointAngle(landmarks, LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE);
    const backR = jointAngle(landmarks, LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE);
    const back = (backL + backR) / 2.0;
    acc.minFront = Math.min(acc.minFront, front);
    acc.minBack = Math.min(acc.minBack, back);
  },
  evaluateForm(acc) {
    const cues = [];
    if (acc.minFront > LUNGE.depthTarget) cues.push('Drop your back knee lower');
    if (acc.minBack < LUNGE.minBackAngle) cues.push('Stay upright');
    return [cues.length === 0, cues];
  },
};

/* ------------------------------------------------------------------ */
/* Overhead shoulder press — elbow extends overhead                    */
/* ------------------------------------------------------------------ */
const SHOULDER_PRESS = {
  downAngle: 90.0,   // elbow bent at bottom
  upAngle: 160.0,    // arms extended overhead
  lockoutTarget: 155.0,
  upLabel: 'locked',
  downLabel: 'racked',
  lowerIsDown: false, // movement STARTS bent (small angle), presses to large -> invert
  requiredLandmarks: [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
  freshAcc: () => ({ maxElbow: 0.0 }),
  primary(landmarks) {
    const l = jointAngle(landmarks, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST);
    const r = jointAngle(landmarks, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST);
    if (l == null && r == null) return null;
    if (l == null) return r;
    if (r == null) return l;
    return (l + r) / 2.0;
  },
  accumulate(acc, landmarks, elbow) {
    acc.maxElbow = Math.max(acc.maxElbow, elbow);
  },
  evaluateForm(acc) {
    const cues = [];
    if (acc.maxElbow < SHOULDER_PRESS.lockoutTarget) cues.push('Press all the way up');
    return [cues.length === 0, cues];
  },
};

/* ------------------------------------------------------------------ */
/* Bicep curl — elbow flexes to a small angle                          */
/* ------------------------------------------------------------------ */
const BICEP_CURL = {
  downAngle: 150.0, // arm extended = start ("down" phase of the rep cycle)
  upAngle: 60.0,    // fully curled
  curlTarget: 70.0,
  upLabel: 'extended',
  downLabel: 'curled',
  lowerIsDown: false,
  requiredLandmarks: [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
  freshAcc: () => ({ minElbow: 180.0 }),
  primary(landmarks) {
    const l = jointAngle(landmarks, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST);
    const r = jointAngle(landmarks, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST);
    if (l == null && r == null) return null;
    if (l == null) return r;
    if (r == null) return l;
    return (l + r) / 2.0;
  },
  accumulate(acc, landmarks, elbow) {
    acc.minElbow = Math.min(acc.minElbow, elbow);
  },
  evaluateForm(acc) {
    const cues = [];
    if (acc.minElbow > BICEP_CURL.curlTarget) cues.push('Squeeze the curl higher');
    return [cues.length === 0, cues];
  },
};

// Note: for inverted exercises (lowerIsDown=false) the rep cycle begins in the
// "up" label but the primary starts at a LARGE angle for curls / SMALL for
// press. _advance handles both via the lowerIsDown flag; we seed the initial
// state so the first full movement registers correctly.

export const EXERCISE_DEFS = {
  squat: { label: 'Squat', config: SQUAT, glyph: 'legs', target: 'quads, glutes' },
  pushup: { label: 'Push-up', config: PUSHUP, glyph: 'push', target: 'chest, triceps' },
  lunge: { label: 'Lunge', config: LUNGE, glyph: 'legs', target: 'quads, glutes' },
  shoulder_press: { label: 'Shoulder press', config: SHOULDER_PRESS, glyph: 'push', target: 'shoulders' },
  bicep_curl: { label: 'Bicep curl', config: BICEP_CURL, glyph: 'pull', target: 'biceps' },
};

export const EXERCISE_LIST = Object.entries(EXERCISE_DEFS).map(([id, d]) => ({ id, ...d }));

/** Factory: build a fresh exercise tracker instance by id. */
export function createExercise(id) {
  const def = EXERCISE_DEFS[id] || EXERCISE_DEFS.squat;
  const ex = new AngleRepExercise(def.label, def.config);
  // Seed inverted-cycle exercises so they start in the correct phase.
  if (def.config.lowerIsDown === false) {
    ex._state = def.config.upLabel;
  }
  return ex;
}
