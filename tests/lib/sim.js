// Deterministic simulation helpers for the Node tests.
// Math.random is replaced by a seeded generator for every step, so a run is repeatable bit for bit.
'use strict';
const crypto = require('crypto');

const DT = 1 / 120;
const trackIds = (C) => C.TRACKS.map(d => d.id);   // every track the game has (a new track file is tested automatically)
const PHYSICS = ['cs', 'arcade'];

// Park-Miller generator (the same one the physics comparisons used during development)
const seeded = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

function withRandom(seed, fn) {
  const orig = Math.random; Math.random = seeded(seed);
  try { return fn(); } finally { Math.random = orig; }
}

// four set-ups per track: a normal 13-car race, the title-screen demo, an upgraded player with damage off, and a crash
// (the normal race, but the player is driven by crashDrive below; 80 s on a track with pits, so the repair is included)
const raceOpts = (C, tt, phys) => ({ numAI: tt ? 0 : 12, playerGrid: tt ? 1 : 12, laps: 2, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys });
const SETUPS = {
  race: { opts: raceOpts },
  demo: { opts: (C, tt, phys) => ({ numAI: 10, noPlayer: true, difficulty: 2, laps: 9999, seed: 11, phys }) },
  upg: { opts: (C, tt, phys) => ({ numAI: tt ? 0 : 12, playerGrid: tt ? 1 : 3, laps: 2, playerModel: C.MODELS[0], playerUpg: { motor: 3, gume: 2, zavore: 3, aero: 3 }, assist: 0, seed: 5, difficulty: 2, damage: 0, phys }) },
  crash: { opts: raceOpts, drive: crashDrive, seconds: (T) => T.def.pit ? 80 : 60 },
};

// the player in the crash set-up: autopilot, but from 6 s to 8.5 s full throttle and full left lock (into the barrier or
// the other cars: damage, loose panels on the road); rescued when stuck, like a player pressing the button; on a track
// with pits it then drives into the pits and stays in the lane until the crew has repaired the car
function crashDrive(C, race, k) {
  const P = race.player, t = k * DT, stuck = P.stuckT > 3 || P.wrongT > 3;
  if (stuck) race.rescue(P);
  if (t >= 6 && t < 8.5) { P.inSteer = -1; P.inThr = 1; P.inBrk = 0; P.inHand = 0; P.digitalSteer = true; }
  else { if (t >= 8.5 && race.track.def.pit) P.pitWant = !P.repairN || P.inPit; P.digitalSteer = false; C.aiControl(P, race, DT); }
  return stuck;   // (true: rescued)
}

function makeRace(C, tid, opts) {
  const T = new C.Track(C.TRACKS.find(d => d.id === tid));
  const race = new C.Race(T, opts(C, !!T.def.timeTrial));
  race.start();
  return race;
}

// one fixed step: the player (if any) is driven by the autopilot, like __game.sim(sec, true) does in the browser, or by `drive`
function stepRace(C, race, k, drive) {
  Math.random = seeded(1000 + k);
  let ev; if (race.player) { if (drive) ev = drive(C, race, k); else C.aiControl(race.player, race, DT); }
  race.step(DT);
  return ev;
}

// the whole state as text, so a digest catches any change, not only a chosen few fields: every plain value (number,
// boolean, text, list of them) of the race and of every car (sorted by name), the car's dents and lost panels, and the
// loose panels on the road
const num = (v) => Object.is(v, -0) ? '-0' : String(v);
const plain = (v) => typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string';
function stateLine(o) {
  const keys = Object.keys(o).filter(k => plain(o[k]) || (Array.isArray(o[k]) && o[k].every(plain))).sort();
  return keys.map(k => k + '=' + (Array.isArray(o[k]) ? o[k].map(num).join(',') : num(o[k]))).join(';');
}
function raceState(race) {
  let s = stateLine(race) + '\n';
  for (const c of race.cars) s += stateLine(c) + '|dents=' + (c.dents || []).map(stateLine).join('/') + '|lost=' + Object.keys(c.lost || {}).sort().join(',') + '\n';
  for (const d of race.debris || []) s += 'debris ' + stateLine(d) + '\n';
  return s;
}

// run a set-up for its time (default 60 s); the digest covers the full state at every sample (every 10 s). `cover`
// tells what the run went through (the player's worst damage, loose panels, rescues, pit repairs)
function runScenario(C, tid, setupName, phys, every = 10) {
  const orig = Math.random;
  try {
    Math.random = seeded(7);
    const S = SETUPS[setupName], race = makeRace(C, tid, (C2, tt) => S.opts(C2, tt, phys));
    const seconds = S.seconds ? S.seconds(race.track) : 60;
    const h = crypto.createHash('sha256'), P = race.player || race.cars[0];
    const n = Math.round(seconds / DT), m = Math.round(every / DT);
    let dmg = 0, rescues = 0;
    for (let k = 1; k <= n; k++) {
      if (stepRace(C, race, k, S.drive)) rescues++;
      dmg = Math.max(dmg, P.dmg || 0);
      if (k % m === 0) h.update('t' + k + '|' + raceState(race));
    }
    return { digest: h.digest('hex').slice(0, 24), lead: +Math.max(...race.cars.map(c => c.dist || 0)).toFixed(1), car0: [+P.x.toFixed(2), +P.z.toFixed(2)],
      cover: { dmg: +dmg.toFixed(2), loose: race.debrisId || 0, rescues, repairs: P.repairN || 0 } };
  } finally { Math.random = orig; }
}

module.exports = { DT, trackIds, PHYSICS, SETUPS, seeded, withRandom, makeRace, stepRace, stateLine, raceState, runScenario };
