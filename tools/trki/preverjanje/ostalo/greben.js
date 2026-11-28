// Independent check: crests on REAL tracks, the game's autopilot driving (Race.step), realistic speeds.
// Detect a landing in a step (landT set afresh) with air==0 before the step: take-off and landing in the same step.
'use strict';
const path = require('path');
const ROOT = require('path').join(__dirname, '..', '..', '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const SIM = require(path.join(ROOT, 'tests/lib/sim.js'));
const C = loadCore();
const DT = 1 / 120, KMH = 3.6;
const ids = process.argv[2] ? process.argv[2].split(',') : SIM.trackIds(C);
const carId = process.argv[3] || 'rally', phys = process.argv[4] || 'cs', secs = +(process.argv[5] || 150);
const model = C.MODELS.find(m => m.id === carId);
const out = [];
for (const tid of ids) {
  const def = C.TRACKS.find(d => d.id === tid); if (!def) { console.log('ni proge', tid); continue; }
  Math.random = SIM.seeded(7);
  const T = new C.Track(def);
  if (!T.hasElev) { out.push({ tid, elev: 0 }); continue; }
  const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 3, playerModel: model, assist: 2, seed: 9, difficulty: 1, damage: 2, phys });
  race.start(); const P = race.player;
  const n = Math.round(secs / DT);
  let same = 0, airSteps = 0, flights = 0, lossSame = 0, lossFly = 0, maxStepLoss = 0, events = [], cur = null, vmax = 0, maxAirT = 0, lossCode = 0;
  let prevDv = 0;
  for (let k = 0; k < n; k++) {
    Math.random = SIM.seeded(1000 + k);
    C.aiControl(P, race, DT);
    const air0 = P.air, lt0 = P.landT || 0, v0 = Math.hypot(P.vx, P.vz), s0 = P.q ? P.q.s : 0;
    for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; }
    race.step(DT);
    const v1 = Math.hypot(P.vx, P.vz), lt1 = P.landT || 0;
    vmax = Math.max(vmax, v1);
    const landed = lt1 > lt0 + 1e-9 || (lt1 >= 0.05 - 1e-12 && lt0 < 0.05 - DT && lt1 > lt0);   // landT set afresh this step
    if (P.air) { airSteps++; if (!air0) flights++; maxAirT = Math.max(maxAirT, P.airT || 0); }
    if (landed && !P.hitWall) {
      const drop = (v0 - v1) - prevDv;   // against the step before (normal driving)
      const sc = Math.min(0.13, Math.max(0, -P.impactVY * 0.016));
      if (!air0) { same++; lossSame += drop; lossCode += v0 * sc; maxStepLoss = Math.max(maxStepLoss, drop / v0);
        if (!cur || k - cur.k1 > 24) { cur = { k0: k, k1: k, s: s0, v0: v0 * KMH, n: 0, loss: 0 }; events.push(cur); }
        cur.k1 = k; cur.n++; cur.loss += drop * KMH; cur.v1 = v1 * KMH; }
      else lossFly += drop;
    } else prevDv = v0 - v1;
    if (race.state === 'finished' || P.finished) break;
  }
  events.sort((a, b) => b.loss - a.loss);
  out.push({ tid, len: Math.round(T.len), vmax: +(vmax * KMH).toFixed(0), same, lossSame: +(lossSame * KMH).toFixed(1), lossCode: +(lossCode * KMH).toFixed(1), maxStep: +(maxStepLoss * 100).toFixed(1), airSteps, flights, maxAirT: +maxAirT.toFixed(2), lossFly: +(lossFly * KMH).toFixed(1),
    top: events.slice(0, 3).map(e => `s${Math.round(e.s)} ${e.v0.toFixed(0)}km/h n${e.n} -${e.loss.toFixed(1)}`).join(' | '), nev: events.length });
}
for (const r of out) console.log(JSON.stringify(r));
