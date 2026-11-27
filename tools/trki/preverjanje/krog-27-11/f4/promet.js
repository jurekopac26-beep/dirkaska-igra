'use strict';
// fizika-4, krog 27. 11.: nalet od zadaj v vozilo prometa (Realistična, cv 6): odboj med težiščema, energija, gibalna količina.
// Prizor in mere so od preverjanja v tests/trki.test.js (»Realistična, the traffic: ...«): Bathurst, rally, vozilo stoji 60 m naprej,
// avto 5 cm v njegovem zadku, zamik od sredine 0 ali ±0,6 m, en klic tf._hitVeh.
// e = (hitrost vozila − hitrost avta, obe vzdolž vozila) / hitrost naleta: odboj med težiščema, ne v točki dotika.
// Zagon: node promet.js                           to drevo
//        TRKI_SNAP=<drevo pred> node promet.js    drevo pred spremembo (git worktree add --detach <mapa> 737b389)
const { SNAP, load } = require('../../krog-25-11/fizika/lib.js');
const { C, SIM } = load(SNAP);
const f = (v, d = 2) => Number.isFinite(v) ? v.toFixed(d) : String(v), NAME = ['avto', 'kombi', 'avtobus', 'motor'];
let bT = null;
function hit(o) {
  C.setTest({ cv: 6 }); const orig = Math.random; Math.random = SIM.seeded(7);
  try {
    const T = bT || (bT = new C.Track(C.TRACKS.find((x) => x.id === 'bathurst')));
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: C.MODELS.find((m) => m.id === 'rally'), assist: 2, phys: 'cs', seed: 9, difficulty: 1, damage: 2, endless: true }); r.start();
    const P = r.player, tf = r.tf; tf.win.dens = 0; for (const q of tf.veh) q.off = true;
    const v = tf._veh(1, o.p, P.q.s + 60, o.p); v.off = true; tf._winPlace(v, P.q.s + 60, 0); v.v = 0; tf._pose(v, 0); tf._pose(v, 0);
    const hx = Math.cos(v.h), hz = Math.sin(v.h), h = v.h, off = o.off || 0, back = v.len / 2 + P.m.len / 2 - 0.05;
    P.x = v.x - hx * back - hz * off; P.z = v.z - hz * back + hx * off;
    P.px = P.x; P.pz = P.z; P.h = P.ph = h; P.vx = Math.cos(h) * o.v; P.vz = Math.sin(h) * o.v; P.w = 0; P.net = false;
    const ma = P.m.mass + (P.fuelKg || 0), mb = v.mass, Ia = P.I * ma / P.m.mass, Ib = mb * (v.len * v.len + v.wid * v.wid) / 12;
    const vv = () => v.st === 0 ? [T.tx[v.i] * v.v * v.dir, T.tz[v.i] * v.v * v.dir] : [v.vx, v.vz];
    const b0 = vv(), p0x = ma * P.vx + mb * b0[0], p0z = ma * P.vz + mb * b0[1], E0 = 0.5 * ma * o.v * o.v + 0.5 * mb * (b0[0] * b0[0] + b0[1] * b0[1]);
    tf._hitVeh(P, v); const b1 = vv(), dpx = ma * P.vx + mb * b1[0] - p0x, dpz = ma * P.vz + mb * b1[1] - p0z, p0 = Math.hypot(p0x, p0z);
    const E1 = 0.5 * ma * (P.vx * P.vx + P.vz * P.vz) + 0.5 * Ia * P.w * P.w + 0.5 * mb * (b1[0] * b1[0] + b1[1] * b1[1]) + (v.st === 1 ? 0.5 * Ib * v.w * v.w : 0);
    return { st: v.st, dp: Math.hypot(dpx, dpz) / p0, dE: (E1 - E0) / E0, vcl: P.vx * hx + P.vz * hz, vb: b1[0] * hx + b1[1] * hz, w: P.w, kc: P.csKc || 0, wv: v.w || 0, mb };
  } finally { Math.random = orig; C.setTest(null); }
}
console.log('drevo: ' + SNAP);
console.log('vozilo (kg) kmh zamik m | e med težiščema | razmik km/h | dE % | dp | zasuk avta rad/s, zdrs zadka avta (csKc) rad, zasuk vozila rad/s | odlepljeno');
for (const p of [0, 1, 2, 3]) for (const kmh of [60, 120, 200]) for (const off of [0, 0.6, -0.6]) {
  const q = hit({ p, v: kmh / 3.6, off }), e = (q.vb - q.vcl) / (kmh / 3.6);
  console.log(`${NAME[p]} (${f(q.mb, 0)}) ${kmh} ${off} | ${f(e, 3)} | ${f((q.vb - q.vcl) * 3.6)} | ${f(q.dE * 100, 1)} | ${q.dp.toExponential(1)} | ${f(q.w, 3)}, ${f(q.kc, 3)}, ${f(q.wv, 3)} | ${q.st === 1 ? 'da' : 'ne'}`);
}
