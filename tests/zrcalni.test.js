// The ZRCALNI VLAK in a race (no browser; docs/zrcalni-vlak.md, sklop d): a road train with two joints (the black cab, tank 1 on the fifth
// wheel, the B-dolly rigidly on tank 1, tank 2 on the dolly's fifth wheel). A field of four trains (the player on the autopilot, 3 rivals) for
// 120 s on real tracks, in both driving physics (classic cs and nova): Bathurst (a circuit, the grid), Vršič and Caracoles (open roads, the
// flying start). Every step: every number of a tractor and of both tanks finite; tank 1 on the tractor's fifth wheel and tank 2 on the dolly's
// (both within 5 cm) unless torn off; each fold within its stop (tank 1: TLK.lim, tank 2: its own lim). After 120 s: every train has gone on,
// few rescues of the player, few contacts, joint 2 well within its stop (no swing of the second tank). Then the train alone on the flat test plane: braking hard in a bend folds the first joint more,
// never past a stop; straight on both joints come back in line.
//   node tests/zrcalni.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const S = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const ZV = C.MODELS.find(m => m.id === 'zrcalni'), LIM = C.TLK.lim;
if (!ZV) { console.log('FAIL the model zrcalni is not in the game: ' + (C.DEFS_SKIPPED || []).map(x => x.id + ': ' + x.why).join('; ')); process.exit(1); }
// the career price table puts the four trucks in the order the car screen shows them (ord 1 to 4): the rigs dearer than the KAMEN (a rig without
// its own price in the table fell back to its old def price, 75 000 and 90 000, and stood before the TITAN)
{ const pr = (id) => C.CAREER.car[id];
  check('the career prices: TITAN < KAMEN PUŠČAVA < TITAN CISTERNA < ZRCALNI VLAK (the car screen\'s strip)', pr('titan') < pr('kamen') && pr('kamen') < pr('cisterna') && pr('cisterna') < pr('zrcalni'), ['titan', 'kamen', 'cisterna', 'zrcalni'].map(pr).join(' < ')); }
const SEC = 120;
const TRACKS = ['bathurst', 'vrsic', 'caracoles'].map(id => C.TRACKS.find(d => d.id === id)).filter(Boolean);

// a trailer's kingpin against the fifth wheel of what pulls it (P: the tractor or tank 1; m)
const pinGap = (P, R) => { const k = R.D.kp[0]; return Math.hypot(P.x + Math.cos(P.h) * k - (R.x - Math.cos(R.h) * R.cx), P.z + Math.sin(P.h) * k - (R.z - Math.sin(R.h) * R.cx)); };
const finite = (o, keys) => keys.every(k => Number.isFinite(o[k]));
const CK = ['x', 'z', 'y', 'h', 'vx', 'vz', 'w'], TK = ['x', 'z', 'y', 'h', 'vx', 'vz', 'w', 'rel', 'yA'];
const deg = (a) => (a * 180 / Math.PI).toFixed(0);

for (const d of TRACKS) for (const phys of ['cs', 'nova']) {
  const T = new C.Track(d), o = { numAI: 3, playerGrid: 99, playerModel: ZV, laps: 99, assist: 2, phys, seed: 3, difficulty: 1, damage: 1 };
  if (d.open) o.flying = 15;
  const orig = Math.random; Math.random = S.seeded(7);
  try {
    const r = new C.Race(T, o); r.start();
    const P = r.player, d0 = new Map(r.cars.map(c => [c, c.dist || 0])), last = new Map();
    let nan = '', g1 = 0, g2 = 0, over = 0, rescues = 0, hits = 0, m1 = 0, m2 = 0;
    for (let k = 1; k <= SEC / S.DT; k++) {
      S.stepRace(C, r, k);
      if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); rescues++; }
      const t = k * S.DT;
      for (const c of r.cars) {
        const L = c.tl, L2 = L && L.next; if (!L2) continue;
        if (!nan && (!finite(c, CK) || !finite(L, TK) || !finite(L2, TK))) nan = `${c.name} at ${t.toFixed(2)} s`;
        const on1 = !L.fall && !L.torn, on2 = on1 && !L2.fall && !L2.torn;
        if (on1) g1 = Math.max(g1, pinGap(c, L));
        if (on2) g2 = Math.max(g2, pinGap(L, L2));
        if (Math.abs(L.rel) > (L.lim || LIM) + 0.01 || Math.abs(L2.rel) > (L2.lim || LIM) + 0.01) over++;
        m1 = Math.max(m1, Math.abs(L.rel)); m2 = Math.max(m2, Math.abs(L2.rel));
        if (c.hitCar > 2 && t - (last.get(c) || -9) > 0.5) { hits++; last.set(c, t); } else if (c.hitCar > 2) last.set(c, t);
      }
    }
    const gone = r.cars.map(c => (c.dist || 0) - d0.get(c)), slow = Math.min(...gone), mine = gone[r.cars.indexOf(P)];
    const trains = r.cars.filter(c => c.tl && c.tl.next).length, tag = `${d.id} ${phys}`;
    console.log(`     ${tag}: ${r.cars.length} cars (${trains} trains), the player ${mine.toFixed(0)} m, the slowest ${slow.toFixed(0)} m, kingpin gaps ${(g1 * 100).toFixed(1)} / ${(g2 * 100).toFixed(1)} cm, folds ${deg(m1)} / ${deg(m2)} deg, ${rescues} rescues, ${hits} contacts`);
    check(`${tag}: four trains (the player and 3 rivals), every number finite, both tanks on their kingpins (within 5 cm), both folds within their stops`, trains === 4 && !nan && g1 < 0.05 && g2 < 0.05 && !over,
      nan ? 'not finite: ' + nan : `${trains} trains, gaps ${(g1 * 100).toFixed(2)} / ${(g2 * 100).toFixed(2)} cm, ${over} steps past a stop`);
    check(`${tag}: in ${SEC} s the player drove at least 2 km (the autopilot), the field's slowest at least 1 km, at most 2 rescues, at most 40 contacts`, mine > 2000 && slow > 1000 && rescues <= 2 && hits <= 40,
      `${mine.toFixed(0)} m, ${slow.toFixed(0)} m, ${rescues} rescues, ${hits} contacts`);
    // (the second tank's sway: its axles kept their grip over the road's small steps (tlRide), joint 2 at its stop only in a real slide)
    check(`${tag}: joint 2 well within its stop (under 50 deg of ${deg(ZV.trailer.next.lim)}): the second tank never swings out`, m2 < 50 * Math.PI / 180, `${deg(m2)} deg`);
  } finally { Math.random = orig; }
}

// the train alone on the flat test plane (tests/lib/handling.js, both physics): 90 km/h straight, into a bend (the wheel at 0.6, the speed
// held), then full brakes with the wheel still turned: the first joint folds more, neither past its stop; then straight on, a little power:
// both come back in line
for (const phys of ['cs', 'nova']) {
  const H = require('./lib/handling.js')(C, phys), c = H.mkCar(ZV, { v: 90, assist: 0 }), L = c.tl, L2 = L.next;
  for (let i = 0; i < 1 / H.DT; i++) H.step(c, { thr: 'hold' });
  for (let i = 0; i < 2 / H.DT; i++) H.step(c, { thr: 'hold', st: 0.6 });
  const v0 = c._v * 3.6, r1 = Math.abs(L.rel), r2 = Math.abs(L2.rel); let b1 = 0, b2 = 0, ok = true;
  for (let i = 0; i < 1.5 / H.DT; i++) { H.step(c, { brk: 1, st: 0.6 }); b1 = Math.max(b1, Math.abs(L.rel)); b2 = Math.max(b2, Math.abs(L2.rel)); ok = ok && finite(c, CK) && finite(L, TK) && finite(L2, TK); }
  for (let i = 0; i < 6 / H.DT; i++) { H.step(c, { thr: 0.25 }); ok = ok && finite(c, CK) && finite(L, TK) && finite(L2, TK); }
  const s1 = Math.abs(L.rel), s2 = Math.abs(L2.rel);
  check(`${phys}: the train braked hard in a bend from ${v0.toFixed(0)} km/h — joint 1 folds more (${deg(r1)} -> ${deg(b1)} deg), joint 2 ${deg(r2)} -> ${deg(b2)} deg, neither past its stop; straight on both come back in line (${deg(s1)} / ${deg(s2)} deg)`,
    ok && v0 > 80 && b1 > r1 + 0.05 && b1 <= LIM + 0.01 && b2 <= (L2.lim || LIM) + 0.01 && s1 < 0.05 && s2 < 0.05, ok ? '' : 'not finite');
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
