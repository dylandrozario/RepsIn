/**
 * Generates realistic synthetic occupancy predictions for the MVP demo.
 * Run: node scripts/gen_predictions.js
 * Writes src/data/occupancyPredictions.json
 */
const fs = require('fs');
const path = require('path');

const EQUIPMENT = [
  'bench_press', 'squat_rack', 'leg_press', 'cable_machine',
  'treadmill', 'rowing_machine', 'dumbbells', 'smith_machine',
];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = [];
for (let h = 6; h <= 22; h++) HOURS.push(h);

// Base demand curve by hour (0..1). Peaks early morning + evening.
function hourFactor(h) {
  const morning = Math.exp(-Math.pow(h - 7.5, 2) / 4) * 0.85;
  const evening = Math.exp(-Math.pow(h - 18, 2) / 5) * 1.0;
  const midday = Math.exp(-Math.pow(h - 12.5, 2) / 6) * 0.4;
  return Math.min(1, morning + evening + midday);
}

// Weekend softens peaks, shifts later.
function dayFactor(day, h) {
  const weekend = day === 'Saturday' || day === 'Sunday';
  if (weekend) {
    const mid = Math.exp(-Math.pow(h - 11, 2) / 10) * 0.75;
    return mid;
  }
  return 1;
}

// Equipment popularity multiplier.
const POP = {
  bench_press: 1.15,
  squat_rack: 1.1,
  leg_press: 0.85,
  cable_machine: 0.8,
  treadmill: 0.7,
  rowing_machine: 0.55,
  dumbbells: 0.95,
  smith_machine: 1.2,
};

function level(p) {
  if (p < 0.34) return 'low';
  if (p < 0.67) return 'moderate';
  return 'high';
}

// deterministic pseudo-random jitter
function jitter(seed) {
  const x = Math.sin(seed) * 10000;
  return (x - Math.floor(x)) * 0.12 - 0.06;
}

const out = {};
let seed = 1;
for (const eq of EQUIPMENT) {
  out[eq] = {};
  for (const day of WEEKDAYS) {
    out[eq][day] = {};
    for (const h of HOURS) {
      const base = hourFactor(h) * POP[eq];
      const dayAdj = base * (0.4 + 0.6 * dayFactor(day, h) / Math.max(dayFactor(day, h), 0.0001));
      let p = hourFactor(h) * POP[eq];
      const weekend = day === 'Saturday' || day === 'Sunday';
      if (weekend) p = (Math.exp(-Math.pow(h - 11, 2) / 10) * 0.8) * POP[eq];
      p += jitter(seed++);
      p = Math.max(0.03, Math.min(0.97, p));
      out[eq][day][String(h)] = {
        probability: Math.round(p * 100) / 100,
        congestion_level: level(p),
      };
    }
  }
}

const dest = path.join(__dirname, '..', 'src', 'data', 'occupancyPredictions.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log('Wrote', dest);
