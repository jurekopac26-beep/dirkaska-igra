// Pieces on the road (Race.debris, Core debrisHit): driven over, not knocked away (the user's). A piece lying on the road stays where it
// lies; the car over it loses a little speed (at most 2.5 %), the phone thumps (hitDebris) and over a panel the car hops once a pass
// (hopN, drawn by the renderer over ~2 m: hopT, hopH), no twist; a mirror's bit: the thump, no hop; driven over again later: again. A piece
// still in the air is knocked away as before. Broken glass on the road (Razbijanje: šipe): a car on it grips 20 % less, less as it is
// scattered by each car driven over it.
//   node tests/debris.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const SOKOL = C.MODELS.find(m => m.id === 'sokol'), T = new C.Track(C.TRACKS.find(d => d.id === 'jezero'));

// the player at v m/s along its heading, the rival parked far off; a piece (part, lying or in the air) `ahead` m in front of it on its line
function run(part, v, ahead, air, passes) {
  const r = new C.Race(T, { numAI: 1, playerGrid: 1, laps: 3, playerModel: SOKOL, assist: 2, seed: 3, difficulty: 1, damage: 2 }); r.start();
  const P = r.player, A = r.cars.find(c => !c.isPlayer); A.place(P.x - Math.cos(P.h) * 200, P.z - Math.sin(P.h) * 200, P.h); A.locked = true; A.vx = A.vz = 0;
  P.vx = Math.cos(P.h) * v; P.vz = Math.sin(P.h) * v;
  const Pt = C.PARTS[part], d = part ? { id: 1, car: A.id, part, x: P.x + Math.cos(P.h) * ahead, z: P.z + Math.sin(P.h) * ahead, y: (P.y || 0) + (air ? 0.6 : Pt.h * 0.5 + 0.02), vx: 0, vz: 0, vy: 0,
    yaw: 0, rx: 0, rz: 0, wx: 0, wy: 0, wz: 0, r: Pt.r, m: Pt.m, h: Pt.h, rest: !air, ground: !air, q: null, dead: false } : null;
  if (d) r.debris.push(d);
  const x0 = d && d.x, z0 = d && d.z; let hop = 0, thump = 0, w = 0, t = 0;
  for (; t < 1.5; t += DT) { P.inThr = 0; P.inBrk = 0; P.inSteer = 0; P.hitDebris = 0; r.step(DT); thump = Math.max(thump, P.hitDebris || 0); w = Math.max(w, Math.abs(P.w)); }
  hop = P.hopN || 0;
  // driven over again: the car put back behind it, the same pass again
  let again = null; if (d && passes) { P.place(d.x - Math.cos(P.h) * ahead, d.z - Math.sin(P.h) * ahead, P.h); P.vx = Math.cos(P.h) * v; P.vz = Math.sin(P.h) * v; for (let t2 = 0; t2 < 1.5; t2 += DT) { P.inThr = 0; P.inBrk = 0; P.inSteer = 0; r.step(DT); } again = P.hopN || 0; }
  return { v: P.speed, moved: d ? Math.hypot(d.x - x0, d.z - z0) : 0, hop, thump, w, again, T: P.hopT, H: P.hopH };
}
const base = run(null, 20, 10), hood = run('hood', 20, 10, false, true), mir = run('mirrorL', 20, 10), fly = run('hood', 20, 10, true);
const loss = (q) => 1 - q.v / base.v;
check('a bonnet lying on the road, driven over at 72 km/h: it stays where it lies (under 2 cm)', hood.moved < 0.02, `moved ${hood.moved.toFixed(3)} m`);
check('the car over it loses a little speed (0.5 to 2.5 %), no twist', loss(hood) > 0.005 && loss(hood) <= 0.0255 && hood.w < 0.05, `${(loss(hood) * 100).toFixed(2)} % slower, yaw rate ${hood.w.toFixed(3)}`);
check('it hops once in the pass (hopN 1), over ~2 m (0.1 s at 72 km/h: hopT clamped to 0.12 s), a few cm up; the phone thumps (hitDebris >= 6)', hood.hop === 1 && hood.T >= 0.12 && hood.T <= 0.35 && hood.H >= 0.05 && hood.H <= 0.14 && hood.thump >= 6, JSON.stringify({ hop: hood.hop, T: hood.T, H: hood.H, thump: hood.thump }));
check('driven over again later: it hops again (once a pass)', hood.again === 2, `hopN after the second pass ${hood.again}`);
check('a mirror\'s bit: a light thump, no hop, hardly slower', mir.hop === 0 && mir.thump > 0 && mir.thump < 6 && loss(mir) < 0.005 + 1e-9 && mir.moved < 0.02, JSON.stringify({ hop: mir.hop, thump: mir.thump, loss: +(loss(mir) * 100).toFixed(2), moved: +mir.moved.toFixed(3) }));
check('a piece still in the air: knocked away as before (moved over half a metre), no hop', fly.moved > 0.5 && fly.hop === 0, `moved ${fly.moved.toFixed(2)} m`);

// broken glass on the road (Razbijanje: šipe, Core.setCrash({ glass })): a knock lays a patch where it broke a pane; a car on it grips 20 %
// less (glassK 0.8: slides more), less as it is scattered: each car driven over it and off it takes a quarter; off by default: none
function glassRun(on) {
  C.setCrash(on ? { glass: 1 } : {});
  try {
    const r = new C.Race(T, { numAI: 1, playerGrid: 1, laps: 3, playerModel: SOKOL, assist: 2, seed: 3, difficulty: 1, damage: 2 }); r.start();
    const P = r.player, A = r.cars.find(c => !c.isPlayer); A.place(P.x - Math.cos(P.h) * 200, P.z - Math.sin(P.h) * 200, P.h); A.locked = true;
    C.applyDamage(P, 0.1, P.m.len * 0.5, 0); r.step(DT);
    const G = r.glass || [], p = G[0], first = { n: G.length, k: p && p.k, gk: P.glassK, near: p ? Math.hypot(p.x - (P.x + Math.cos(P.h) * P.m.len * 0.5), p.z - (P.z + Math.sin(P.h) * P.m.len * 0.5)) : null };
    // the braking on it: from 20 m/s, full brake for 0.5 s (on the glass: less grip, less slowed)
    const brake = (onIt) => { P.place(onIt ? p.x : p.x + 30 * Math.cos(P.h + 1.57), onIt ? p.z : p.z + 30 * Math.sin(P.h + 1.57), P.h); P.vx = Math.cos(P.h) * 20; P.vz = Math.sin(P.h) * 20; P.glassK = 1;
      const k0 = p.k; let t = 0; for (; t < 0.5; t += DT) { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; r.step(DT); if (onIt) { p.x = P.x; p.z = P.z; p.k = k0; } } return P.speed; };   // (the patch kept under the car)
    const vOn = p ? brake(true) : null, vOff = p ? brake(false) : null;
    // three passes over it at 15 m/s
    const ks = []; if (p) { p.k = 1; p.on.length = 0; for (let pass = 0; pass < 3; pass++) { P.place(p.x - Math.cos(P.h) * 6, p.z - Math.sin(P.h) * 6, P.h); P.vx = Math.cos(P.h) * 15; P.vz = Math.sin(P.h) * 15; for (let t = 0; t < 1; t += DT) { P.inThr = 0.5; P.inBrk = 0; P.inSteer = 0; r.step(DT); } ks.push(+(G.includes(p) ? p.k : 0).toFixed(3)); } }
    return { first, vOn, vOff, ks };
  } finally { C.setCrash({}); }
}
const gOff = glassRun(false), gOn = glassRun(true);
check('glass off (the default): a knock lays no glass', gOff.first.n === 0, JSON.stringify(gOff.first));
check('glass on: a knock lays a patch where it hit (within 1 m), the car on it grips 20 % less (glassK 0.8)', gOn.first.n === 1 && gOn.first.near < 1 && Math.abs(gOn.first.gk - 0.8) < 1e-9, JSON.stringify(gOn.first));
check('braking on the glass: less grip, the car slowed less in 0.5 s than off it', gOn.vOn > gOn.vOff + 0.3, `after 0.5 s ${gOn.vOn.toFixed(2)} m/s on it, ${gOn.vOff.toFixed(2)} m/s off it`);
check('driven over three times: a quarter scattered each pass (0.75, 0.56, 0.42)', gOn.ks.join() === '0.75,0.563,0.422', gOn.ks.join(', '));
console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
