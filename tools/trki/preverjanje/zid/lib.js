// Independent verifier's helpers (NOT in the repo). Differs from tools/trki/zid.js on purpose:
// - always Race.step (the whole race loop), never a re-made step
// - a real track (Bathurst / Spa), the wall frame from the track's own normal at the car (not from the way the wall pushed it)
// - the car coasts up to the wall from further away (normal gap 0.6 m), the contact is seen from the corners' room and from hitWall
'use strict';
const path = require('path');
const ROOT = require('path').join(__dirname, '..', '..', '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));
const C = loadCore();
Math.random = SIM.seeded(424242);
const DT = 1 / 120, D = 180 / Math.PI;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const model = (id) => C.MODELS.find(m => m.id === id);
const _tr = {};
const track = (tid) => _tr[tid] || (_tr[tid] = new C.Track(C.TRACKS.find(d => d.id === tid)));
function mkRace(T, id, phys, extra) {
  const race = new C.Race(T, Object.assign({ numAI: 0, playerGrid: 1, laps: 99, playerModel: model(id), assist: 2, seed: 9, difficulty: 1, damage: 2, phys }, extra));
  race.start();
  return race;
}
function gearFor(c, v) { const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (Math.abs(v) / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; } }
// put the car: centre (x, z), nose h, velocity direction hv (may differ from the nose: a slide), speed v
function put(c, T, x, z, h, v, hv) {
  c.place(x, z, h); c.locked = false; c.steer = 0; c.inSteer = c.inThr = c.inBrk = c.inHand = 0; c.digitalSteer = true;
  const a = hv == null ? h : hv; c.vx = Math.cos(a) * v; c.vz = Math.sin(a) * v; gearFor(c, v);
  T.query(c.x, c.z, -1, c.q);
}
const _cq = {};
// least room of the four corners to the barrier line on the side (m), by the track's own query
function room(c, T, side) {
  const ch = Math.cos(c.h), sh = Math.sin(c.h); let r = 1e9;
  for (const p of c.corners) { const q = T.query(c.x + p[0] * ch - p[1] * sh, c.z + p[0] * sh + p[1] * ch, c.q.i, _cq); r = Math.min(r, (side > 0 ? q.br : q.bl) - side * q.d); }
  return r;
}
// the straightest stretch with a steady barrier (m after the start), outside the pit zone
function straight(T, side, from, to) {
  let best = -1, bk = 1e9; const B = side > 0 ? T.br : T.bl;
  for (let d = from; d < to; d += 10) { const i = T.idx(T.startS + d); let k = 0; for (let e = -80; e <= 120; e += 6) { const j = T.idx(T.startS + d + e); k = Math.max(k, Math.abs(T.k[j]) * 400 + Math.abs(B[j] - B[i])); }
    if (T.def.pit && T.pitAt(T.startS + d)) continue; if (k < bk) { bk = k; best = d; } }
  return best;
}
module.exports = { C, SIM, DT, D, wrap, model, track, mkRace, put, room, straight, gearFor };
