// Deterministic simulation helpers for the Node tests.
// Math.random is replaced by a seeded generator for every step, so a run is repeatable bit for bit.
'use strict';
const crypto = require('crypto');

const DT = 1 / 120;
const TRACK_IDS = ['jezero', 'riviera', 'gora', 'ljubljana', 'monaco', 'gozd', 'pikes', 'nring'];
const PHYSICS = ['cs', 'arcade'];

// Park-Miller generator (the same one the physics comparisons used during development)
const seeded = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

function withRandom(seed, fn) {
  const orig = Math.random; Math.random = seeded(seed);
  try { return fn(); } finally { Math.random = orig; }
}

// three set-ups per track: a normal 13-car race, the title-screen demo, an upgraded player with damage off
const SETUPS = {
  race: (C, tt, phys) => ({ numAI: tt ? 0 : 12, playerGrid: tt ? 1 : 12, laps: 2, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys }),
  demo: (C, tt, phys) => ({ numAI: 10, noPlayer: true, difficulty: 2, laps: 9999, seed: 11, phys }),
  upg: (C, tt, phys) => ({ numAI: tt ? 0 : 12, playerGrid: tt ? 1 : 3, laps: 2, playerModel: C.MODELS[0], playerUpg: { motor: 3, gume: 2, zavore: 3, aero: 3 }, assist: 0, seed: 5, difficulty: 2, damage: 0, phys }),
};

function makeRace(C, tid, opts) {
  const T = new C.Track(C.TRACKS.find(d => d.id === tid));
  const race = new C.Race(T, opts(C, !!T.def.timeTrial));
  race.start();
  return race;
}

// one fixed step: the player (if any) is driven by the autopilot, like __game.sim(sec, true) does in the browser
function stepRace(C, race, k) {
  Math.random = seeded(1000 + k);
  if (race.player) C.aiControl(race.player, race, DT);
  race.step(DT);
}

// every plain number/boolean the car or race holds (sorted by name): catches any change of state, not only a chosen few fields
const num = (v) => Object.is(v, -0) ? '-0' : String(v);
function stateLine(o) {
  const keys = Object.keys(o).filter(k => typeof o[k] === 'number' || typeof o[k] === 'boolean').sort();
  return keys.map(k => k + '=' + num(o[k])).join(';');
}

// run a set-up for `seconds`; the digest covers the full state at every sample (default: every 10 s)
function runScenario(C, tid, setupName, phys, seconds = 60, every = 10) {
  const orig = Math.random;
  try {
    Math.random = seeded(7);
    const race = makeRace(C, tid, (C2, tt) => SETUPS[setupName](C2, tt, phys));
    const h = crypto.createHash('sha256');
    const n = Math.round(seconds / DT), m = Math.round(every / DT);
    for (let k = 1; k <= n; k++) {
      stepRace(C, race, k);
      if (k % m === 0) {
        h.update('t' + k + '|' + stateLine(race) + '\n');
        for (const c of race.cars) h.update(stateLine(c) + '|laps=' + (c.lapTimes || []).map(num).join(',') + '\n');
      }
    }
    const P = race.player || race.cars[0];
    return { digest: h.digest('hex').slice(0, 24), lead: +Math.max(...race.cars.map(c => c.dist || 0)).toFixed(1), car0: [+P.x.toFixed(2), +P.z.toFixed(2)] };
  } finally { Math.random = orig; }
}

module.exports = { DT, TRACK_IDS, PHYSICS, SETUPS, seeded, withRandom, makeRace, stepRace, runScenario };
