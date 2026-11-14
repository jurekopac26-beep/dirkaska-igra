// The four new trucks (no browser; docs/titan-cisterna.md, »Novi tovornjaki«): TITAN AVTOVOZ, KRILO VETRNICE and HRAST are rigs (a
// tractor already in the game with a semi-trailer of its own on its kingpin), LASTOVKA a coach, one body of 12 m; with them the fire
// engine, GASILEC (the fiftieth car: one body, a ladder and a light bar for parts, the TITAN's mounts of its own). First what they
// borrow: the AVTOVOZ's and the KRILO's breaking parts and the garage's mounts are the TITAN's, the HRAST's the ZRCALNI VLAK's, and so
// are its driving numbers but for its limiter (their files keep a copy, read when first asked for); none carries a spare tyre
// (docs/avti-kolibri.md); the blade's overhang (trailer.tail, the look's only) is in the grid's step and in the AI's look behind.
// Then each in a race of its own field (the player on the autopilot, its fieldN rivals) for 120 s on Bathurst (a circuit, the grid) in
// both driving physics (classic cs and nova), the KRILO on Caracoles too (an open road, the flying start): every number finite, every
// trailer on its kingpin (within 5 cm), its fold within its stop (TLK.lim), every vehicle gone on, few rescues, few contacts. Then
// each rig alone on the flat test plane, braked hard in a bend: folded, never past its stop (a long trailer's fold grows little), straight on
// it comes back in line.
//   node tests/novi-tovornjaki.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const S = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const M = (id) => C.MODELS.find(m => m.id === id), LIM = C.TLK.lim, SEC = 120;
const RIGS = [['avtovoz', 'titan'], ['vetrnica', 'titan'], ['hrast', 'zrcalni']], COACH = M('lastovka');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- what they borrow, what they do not carry ----
for (const [id, of] of RIGS) {
  const A = M(id), B = M(of), diff = ['partNames', 'parts', 'mounts'].filter(k => !same(A.def[k], B.def[k]));
  check(`${id}: the tractor's breaking parts and the garage's mounts are the ${of}'s (partNames, parts, mounts)`, !diff.length && Object.keys(A.def.mounts || {}).length > 0, diff.join(', ') || Object.keys(A.def.mounts).length + ' mounts');
}
{ const A = M('hrast').def, B = M('zrcalni').def, ph = Object.assign({}, B.phys, { vLim: 145 });
  check('hrast: its driving numbers are the train\'s tractor\'s (phys but for the limiter, 145 km/h; arc; csp), one trailer on its kingpin', same(A.phys, ph) && same(A.arc, B.arc) && same(A.csp, B.csp) && !A.trailer.next,
    ['phys', 'arc', 'csp'].filter(k => !same(k === 'phys' ? ph : B[k], A[k])).join(', ')); }
for (const id of ['avtovoz', 'vetrnica', 'hrast', 'lastovka', 'gasilec']) {
  const PT = C.partsOf(M(id)), sp = Object.keys(PT).filter(k => PT[k].spare || /spare/i.test(k));
  check(`${id}: no spare tyre among its parts (docs/avti-kolibri.md)`, !sp.length && Object.keys(PT).length > 0, sp.join(' ') || Object.keys(PT).length + ' parts');
}
check('lastovka: one body of 12 m, no trailer, its mounts its own (the garage shows it as a scale model: Render.garageK, tests/browser/garage.test.mjs)',
  COACH.len === 12 && !COACH.trailer && Object.keys(COACH.def.mounts || {}).length >= 8, `${COACH.len} m, ${Object.keys(COACH.def.mounts || {}).length} mounts`);
{ const F = M('gasilec'), PT = C.partsOf(F), mt = Object.keys(F.def.mounts || {}).length;   // (the fire engine, the fiftieth car: docs/titan-cisterna.md, »GASILEC«)
  check('gasilec: one body under the garage\'s door (3.3 m), no trailer, its ladder and its light bar parts of its own, a mount for every part the TITAN has one for',
    F.len <= 6.4 && F.def.parts.ht < 3.3 && !F.trailer && !!PT.ladder && !!PT.lightbar && mt === Object.keys(M('titan').def.mounts).length, `${F.len} m long, ${F.def.parts.ht} m tall, ${mt} mounts`); }

// the trailer's kingpin against the tractor's fifth wheel (m)
const pinGap = (c) => { const T = c.tl, k = T.D.kp[0]; return Math.hypot(c.x + Math.cos(c.h) * k - (T.x - Math.cos(T.h) * T.cx), c.z + Math.sin(c.h) * k - (T.z - Math.sin(T.h) * T.cx)); };
const finite = (o, keys) => keys.every(k => Number.isFinite(o[k]));
const CK = ['x', 'z', 'y', 'h', 'vx', 'vz', 'w'], TK = ['x', 'z', 'y', 'h', 'vx', 'vz', 'w', 'rel', 'yA'];
const track = (id) => C.TRACKS.find(d => d.id === id);

// ---- each in a race of its own field ----
const RACES = [['avtovoz', 'bathurst'], ['vetrnica', 'bathurst'], ['vetrnica', 'caracoles'], ['hrast', 'bathurst'], ['lastovka', 'bathurst'], ['gasilec', 'bathurst']];
for (const [id, tid] of RACES) for (const phys of ['cs', 'nova']) {
  const d = track(tid); if (!d) continue;
  const PM = M(id), T = new C.Track(d), o = { numAI: 5, playerGrid: 99, playerModel: PM, laps: 99, assist: 2, phys, seed: 3, difficulty: 1, damage: 1 };
  if (d.open) o.flying = 15;
  const orig = Math.random; Math.random = S.seeded(7);
  try {
    const r = new C.Race(T, o); r.start();
    const P = r.player, d0 = new Map(r.cars.map(c => [c, c.dist || 0])), last = new Map(), tag = `${id} ${tid} ${phys}`, rig = !!PM.trailer;
    if (id === 'vetrnica' && phys === 'cs' && !d.open) {   // (the blade: 11.8 m past the trailer's own end)
      const D = PM.trailer, tail = D.len - D.f - D.kp[0] + D.tail, back = tail - PM.len / 2;
      check('vetrnica: the blade\'s overhang (trailer.tail) in the grid\'s step and in the AI\'s look behind (a rival keeps clear of the tip)', D.tail > 11 && r._gStep >= (tail + PM.len / 2 + 2.5) / 2 - 1e-6 && Math.abs(P.tl.back - back) < 1e-6,
        `tail ${D.tail.toFixed(1)} m, the grid's step ${r._gStep.toFixed(1)} m, back ${P.tl.back.toFixed(2)} m`);
    }
    let nan = '', gap = 0, gapAt = '', over = 0, rescues = 0, hits = 0, maxRel = 0;
    for (let k = 1; k <= SEC / S.DT; k++) {
      S.stepRace(C, r, k);
      if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); rescues++; }
      const t = k * S.DT;
      for (const c of r.cars) {
        const L = c.tl;
        if (!nan && (!finite(c, CK) || (L && !finite(L, TK)))) nan = `${c.name} at ${t.toFixed(2)} s`;
        if (c.hitCar > 2 && t - (last.get(c) || -9) > 0.5) { hits++; last.set(c, t); } else if (c.hitCar > 2) last.set(c, t);
        if (!L) continue;
        if (!L.fall && !L.torn) { const g = pinGap(c); if (g > gap) { gap = g; gapAt = `${c.name} ${t.toFixed(1)} s`; } }
        if (Math.abs(L.rel) > LIM + 0.01) over++;
        maxRel = Math.max(maxRel, Math.abs(L.rel));
      }
    }
    const gone = r.cars.map(c => (c.dist || 0) - d0.get(c)), slow = Math.min(...gone), mine = gone[r.cars.indexOf(P)];
    const own = r.cars.filter(c => c.m.id === id).length, rigs = r.cars.filter(c => c.tl).length, want = PM.def.fieldN + 1;
    console.log(`     ${tag}: ${r.cars.length} cars (${rigs} rigs), the player ${mine.toFixed(0)} m, the slowest ${slow.toFixed(0)} m, kingpin gap ${(gap * 100).toFixed(1)} cm (${gapAt}), fold ${(maxRel * 180 / Math.PI).toFixed(0)} deg, ${rescues} rescues, ${hits} contacts`);
    check(`${tag}: ${want} of its own (the player and its fieldN rivals), every number finite${rig ? ', every trailer on its kingpin (within 5 cm), its fold within its stop' : ''}`,
      r.cars.length === want && own === want && rigs === (rig ? want : 0) && !nan && gap < 0.05 && !over, nan ? 'not finite: ' + nan : `${own} of ${r.cars.length}, ${rigs} rigs, gap ${(gap * 100).toFixed(2)} cm, ${over} steps past the stop`);
    check(`${tag}: in ${SEC} s the player drove at least 2 km (the autopilot), the field's slowest at least 1 km, at most 2 rescues, at most 40 contacts`, mine > 2000 && slow > 1000 && rescues <= 2 && hits <= 40,
      `${mine.toFixed(0)} m, ${slow.toFixed(0)} m, ${rescues} rescues, ${hits} contacts`);
  } finally { Math.random = orig; }
}

// ---- each rig alone on the flat test plane (tests/lib/handling.js, both physics): 90 km/h straight, into a bend (the wheel at 0.6, the
// speed held), then full brakes with the wheel still turned: folded (the long trailers' fold grows little, the tanker's short one's more:
// tests/cisterna.test.js), never past its stop; straight on, a little power: back in line ----
for (const [id] of RIGS) for (const phys of ['cs', 'nova']) {
  const H = require('./lib/handling.js')(C, phys), c = H.mkCar(M(id), { v: 90, assist: 0 }), L = c.tl, deg = (a) => (a * 180 / Math.PI).toFixed(0);
  for (let i = 0; i < 1 / H.DT; i++) H.step(c, { thr: 'hold' });
  for (let i = 0; i < 2 / H.DT; i++) H.step(c, { thr: 'hold', st: 0.6 });
  const v0 = c._v * 3.6, relT = Math.abs(L.rel); let relB = 0, ok = true;
  for (let i = 0; i < 1.5 / H.DT; i++) { H.step(c, { brk: 1, st: 0.6 }); relB = Math.max(relB, Math.abs(L.rel)); ok = ok && finite(c, CK) && finite(L, TK); }
  for (let i = 0; i < 8 / H.DT; i++) { H.step(c, { thr: 0.25 }); ok = ok && finite(c, CK) && finite(L, TK); }
  const relS = Math.abs(L.rel);
  check(`${id} ${phys}: braked hard in a bend from ${v0.toFixed(0)} km/h — folded (${deg(relT)} -> ${deg(relB)} deg), never past its stop (${deg(LIM)} deg); straight on it comes back in line (${deg(relS)} deg)`,
    ok && v0 > 80 && relT > 0.1 && relB >= relT - 0.01 && relB <= LIM + 0.01 && relS < 0.05, ok ? '' : 'not finite');
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
