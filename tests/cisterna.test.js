// The TITAN CISTERNA in a race (no browser; docs/titan-cisterna.md, sklop 5): a field of six rigs (the player on the autopilot, 5 rivals in
// rigs of their own) for 120 s on real tracks, in both driving physics (classic cs and nova): Bathurst (a circuit, the grid), Vršič and
// Caracoles (open roads, the flying start), Killar (Indija) once it is in the game. Every step: every number of a tractor and of its
// trailer finite; every trailer on its kingpin (the tractor's fifth wheel and the trailer's kingpin within 5 cm) unless it was torn off; its
// fold within its stop (TLK.lim, 83 deg). After 120 s: every rig has gone on (the player and the field's slowest), few rescues of the player
// (the game's autopilot: stuck 3 s), few contacts between the rigs. Then the rig on its own (the flat test plane): braking hard in a bend
// folds it more, never past its stop; straight on it comes back in line. And its tractor is the TITAN (its look K.lookOf('titan')): its
// breaking parts and the garage's mounts are the TITAN's (js/cars/cisterna.js keeps a copy).
//   node tests/cisterna.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const S = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const CI = C.MODELS.find(m => m.id === 'cisterna'), LIM = C.TLK.lim;
const SEC = 120;
const TRACKS = ['bathurst', 'vrsic', 'caracoles', 'killar'].map(id => C.TRACKS.find(d => d.id === id)).filter(Boolean);

// the trailer's kingpin against the tractor's fifth wheel (m)
const pinGap = (c) => { const T = c.tl, k = T.D.kp[0]; return Math.hypot(c.x + Math.cos(c.h) * k - (T.x - Math.cos(T.h) * T.cx), c.z + Math.sin(c.h) * k - (T.z - Math.sin(T.h) * T.cx)); };
const finite = (o, keys) => keys.every(k => Number.isFinite(o[k]));
const CK = ['x', 'z', 'y', 'h', 'vx', 'vz', 'w'], TK = ['x', 'z', 'y', 'h', 'vx', 'vz', 'w', 'rel', 'yA'];
{ const TI = C.MODELS.find(m => m.id === 'titan'), K3 = ['partNames', 'parts', 'mounts'];
  const diff = K3.filter(k => JSON.stringify(CI.def[k]) !== JSON.stringify(TI.def[k]));
  check('the tractor\'s breaking parts and the garage\'s mounts are the TITAN\'s (partNames, parts, mounts)', !diff.length, diff.join(', ') || Object.keys(CI.def.mounts).length + ' mounts'); }

for (const d of TRACKS) for (const phys of ['cs', 'nova']) {
  const T = new C.Track(d), o = { numAI: 5, playerGrid: 99, playerModel: CI, laps: 99, assist: 2, phys, seed: 3, difficulty: 1, damage: 1 };
  if (d.open) o.flying = 15;
  const orig = Math.random; Math.random = S.seeded(7);
  try {
    const r = new C.Race(T, o); r.start();
    const P = r.player, d0 = new Map(r.cars.map(c => [c, c.dist || 0])), last = new Map();
    let nan = '', gap = 0, gapAt = '', over = 0, rescues = 0, hits = 0, maxRel = 0;
    for (let k = 1; k <= SEC / S.DT; k++) {
      S.stepRace(C, r, k);
      if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); rescues++; }
      const t = k * S.DT;
      for (const c of r.cars) {
        const L = c.tl; if (!L) continue;
        if (!nan && (!finite(c, CK) || !finite(L, TK))) nan = `${c.name} at ${t.toFixed(2)} s`;
        if (!L.fall && !L.torn) { const g = pinGap(c); if (g > gap) { gap = g; gapAt = `${c.name} ${t.toFixed(1)} s`; } }
        if (Math.abs(L.rel) > LIM + 0.01) over++;
        maxRel = Math.max(maxRel, Math.abs(L.rel));
        if (c.hitCar > 2 && t - (last.get(c) || -9) > 0.5) { hits++; last.set(c, t); } else if (c.hitCar > 2) last.set(c, t);
      }
    }
    const gone = r.cars.map(c => (c.dist || 0) - d0.get(c)), slow = Math.min(...gone), mine = gone[r.cars.indexOf(P)];
    const rigs = r.cars.filter(c => c.tl).length, tag = `${d.id} ${phys}`;
    console.log(`     ${tag}: ${r.cars.length} cars (${rigs} rigs), the player ${mine.toFixed(0)} m, the slowest ${slow.toFixed(0)} m, kingpin gap ${(gap * 100).toFixed(1)} cm (${gapAt}), fold ${(maxRel * 180 / Math.PI).toFixed(0)} deg, ${rescues} rescues, ${hits} contacts`);
    check(`${tag}: six rigs (the player and 5 rivals), every number finite, every trailer on its kingpin (within 5 cm), its fold within its stop`, rigs === 6 && !nan && gap < 0.05 && !over,
      nan ? 'not finite: ' + nan : `${rigs} rigs, gap ${(gap * 100).toFixed(2)} cm, ${over} steps past the stop`);
    check(`${tag}: in ${SEC} s the player drove at least 2 km (the autopilot), the field's slowest at least 1 km, at most 2 rescues, at most 40 contacts`, mine > 2000 && slow > 1000 && rescues <= 2 && hits <= 40,
      `${mine.toFixed(0)} m, ${slow.toFixed(0)} m, ${rescues} rescues, ${hits} contacts`);
  } finally { Math.random = orig; }
}

// the rig alone on a flat test plane (tests/lib/handling.js, both physics): 90 km/h straight, into a bend (the wheel at 0.6, the speed held), then
// full brakes with the wheel still turned (a bend braked hard: the trailer pushes the tractor's tail out, the fold grows), never past its stop;
// then straight on, a little power: it comes back in line
for (const phys of ['cs', 'nova']) {
  const H = require('./lib/handling.js')(C, phys), c = H.mkCar(CI, { v: 90, assist: 0 }), L = c.tl, deg = (a) => (a * 180 / Math.PI).toFixed(0);
  for (let i = 0; i < 1 / H.DT; i++) H.step(c, { thr: 'hold' });
  for (let i = 0; i < 2 / H.DT; i++) H.step(c, { thr: 'hold', st: 0.6 });
  const v0 = c._v * 3.6, relT = Math.abs(L.rel); let relB = 0, ok = true;
  for (let i = 0; i < 1.5 / H.DT; i++) { H.step(c, { brk: 1, st: 0.6 }); relB = Math.max(relB, Math.abs(L.rel)); ok = ok && finite(c, CK) && finite(L, TK); }
  for (let i = 0; i < 6 / H.DT; i++) { H.step(c, { thr: 0.25 }); ok = ok && finite(c, CK) && finite(L, TK); }
  const relS = Math.abs(L.rel);
  check(`${phys}: the rig braked hard in a bend from ${v0.toFixed(0)} km/h — the fold grows (${deg(relT)} -> ${deg(relB)} deg), never past its stop (${deg(LIM)} deg); straight on it comes back in line (${deg(relS)} deg)`,
    ok && v0 > 80 && relB > relT + 0.05 && relB <= LIM + 0.01 && relS < 0.05, ok ? '' : 'not finite');
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
