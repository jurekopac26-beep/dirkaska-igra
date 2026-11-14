// shared helpers of the verifier's own checks (not the measurers' code)
'use strict';
const path = require('path');
const ROOT = require('path').join(__dirname, '..', '..', '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const SIM = require(path.join(ROOT, 'tests/lib/sim.js'));
const C = loadCore();
const DT = 1 / 120, KMH = 3.6;
const model = (id) => C.MODELS.find(m => m.id === id);
const tracks = {};
function track(tid) { return tracks[tid] || (tracks[tid] = new C.Track(C.TRACKS.find(d => d.id === tid))); }
// the longest straight of a track; the sample 'share' into it
function straight(T, share) {
  let best = 0, b0 = 0, run = 0;
  for (let i = 0; i < T.N; i++) { if (Math.abs(T.k[i]) < 4e-4) { run++; if (run > best) { best = run; b0 = i - run + 1; } } else run = 0; }
  return { i: b0 + Math.floor(best * share), len: best * T.ds };
}
function mkRace(T, id, extra) {
  Math.random = SIM.seeded(4242);
  const race = new C.Race(T, Object.assign({ numAI: 0, playerGrid: 1, laps: 99, playerModel: model(id), assist: 2, seed: 3, difficulty: 1, damage: 2, phys: 'cs' }, extra || {}));
  race.start(); return race;
}
function put(c, T, i, d, v, dh) {
  const h = T.hd[i] + (dh || 0);
  c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, h);
  if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
  c.locked = false; c.steer = 0; c.inSteer = 0; c.inThr = 0; c.inBrk = 0; c.inHand = 0;
  c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v; c.w = 0;
  const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
  c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s; c.dist = c.q.s - T.startS;
}
const sp = (c) => Math.hypot(c.vx, c.vz);
// hooks: the speed the player's car loses INSIDE Race.stepProps (the props' knocks) and between Race._tlStep and Race.stepProps
// (the loose parts' knocks: debrisHit; nothing else changes the speed there off the pit road)
function hook(race, c) {
  const H = { prop: 0, propN: 0, deb: 0, debN: 0, vT: 0, stepProp: 0, stepDeb: 0 };
  const sp0 = race.stepProps.bind(race), tl0 = race._tlStep.bind(race);
  race._tlStep = function (dt, lv) { tl0(dt, lv); H.vT = sp(c); };
  race.stepProps = function (dt) { const v0 = sp(c); H.stepDeb = H.vT - v0; if (H.stepDeb > 1e-9) { H.deb += H.stepDeb; H.debN++; }
    // the props' knocks on the cars come first in stepProps, then the props move: the car's speed changes only in the knocks
    sp0(dt); const v1 = sp(c); H.stepProp = v0 - v1; if (H.stepProp > 1e-9) { H.prop += H.stepProp; H.propN++; } };
  return H;
}
function step(race) { for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; } race.step(DT); }
module.exports = { C, SIM, DT, KMH, model, track, straight, mkRace, put, sp, hook, step, ROOT };
