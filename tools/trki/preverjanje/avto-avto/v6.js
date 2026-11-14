// Verifier, part 6: three cars in a line (a chain / pile-up): momentum, energy, order of the pairs
'use strict';
const { C, RIG, DT, D, KMH, car, setv, f, massOf, keOf } = require('./v1.js');
const V = (k) => k / KMH, plane = RIG.cs.plane;
function chain(vA, vBC, gapBC, order, off) {
  const A = car('cs', 'rally', true), B = car('cs', 'rally', false), Cc = car('cs', 'rally', false), L = A.m.len;
  setv(Cc, L + gapBC, 0, 0, V(vBC)); setv(B, 0, 0, 0, V(vBC)); setv(A, -(L + 1.0), off || 0, 0, V(vA));
  const cars = order === 'CBA' ? [Cc, B, A] : [A, B, Cc];
  const mom = () => [A, B, Cc].reduce((s, c) => s + massOf(c) * c.vx, 0), ke = () => [A, B, Cc].reduce((s, c) => s + keOf(c), 0);
  let t1 = null, nK = 0, gainMax = 0, p0 = 0, pMin = 1e9, pMax = -1e9, out = {}, turn = [0, 0, 0], wMax = [0, 0, 0], gl = [0, 0, 0], E0 = 0;
  for (let i = 0; i < 6 * 120; i++) {
    for (const c of cars) { c.inSteer = 0; c.inThr = 0; c.inBrk = 0; c.inHand = 0; c.step(DT, plane); }
    const pB = mom(), eB = ke(), q = [A.vx, B.vx, Cc.vx, A.w, B.w, Cc.w];
    for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) C.carCollide(cars[a], cars[b]);
    const ch = A.vx !== q[0] || B.vx !== q[1] || Cc.vx !== q[2] || A.w !== q[3] || B.w !== q[4] || Cc.w !== q[5];
    if (ch) { nK++; if (t1 == null) { t1 = i; p0 = pB; E0 = eB; } const dE = ke() - eB; if (dE > gainMax) gainMax = dE; const dp = mom() - pB; pMin = Math.min(pMin, dp); pMax = Math.max(pMax, dp); }
    if (t1 == null) continue;
    [A, B, Cc].forEach((c, k) => { turn[k] = Math.max(turn[k], Math.abs(c.h) * D); wMax[k] = Math.max(wMax[k], Math.abs(c.w) * D); gl[k] = Math.max(gl[k], c.xgl || 0); });
    for (const m of [0.1, 0.5, 2]) if (out[m] == null && (i - t1) * DT >= m - 1e-9) out[m] = [A.vx, B.vx, Cc.vx].map(v => f(v * KMH, 0)).join('/');
    if ((i - t1) * DT > 2.05) break;
  }
  return `v A/B/C at 0.1 s ${out[0.1]}, 0.5 s ${out[0.5]}, 2 s ${out[2]} km/h | knocks(steps) ${nK} | momentum change by one step's knocks ${f(100 * pMin / p0, 2)}..${f(100 * pMax / p0, 2)} % | energy gain max ${f(gainMax / 1000, 2)} kJ of ${f(E0 / 1000, 0)} | turn max A/B/C ${turn.map(x => f(x, 0)).join('/')} deg, xgl ${gl.map(x => f(x, 2)).join('/')}`;
}
for (const [vA, vBC, gap] of [[120, 0, 0.05], [120, 0, 1.0], [120, 90, 0.5], [60, 0, 0.05]]) for (const order of ['ABC', 'CBA']) console.log(`A ${vA} > B, C ${vBC} (gap B-C ${gap} m), pairs ${order}: ` + chain(vA, vBC, gap, order));
for (const order of ['ABC', 'CBA']) console.log(`A 120 > B, C standing (gap 0.05), A 0.6 m off the middle, pairs ${order}: ` + chain(120, 0, 0.05, order, 0.6));
