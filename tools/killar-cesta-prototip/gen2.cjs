// proto 2: called crests (def.bumps, sized by simulation for a set flight of the stock rally car) + silent dips (def.elev) for Killar. Scratch only.
//   node gen2.cjs <tag> [k=1] [flight=0.35] [nCrest=14] [seed=7] [A=9]
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const { DT, seeded } = require(path.join(ROOT, 'tests/lib/sim.js'));
const ref = require('./ref.json');
const tag = process.argv[2] || 'a', K = +(process.argv[3] || 1), FL = +(process.argv[4] || 0.35), NC = +(process.argv[5] || 14), SEED = +(process.argv[6] || 7), A = +(process.argv[7] || 9);
const { N, ds, len, startS, finishS } = ref, hy0 = ref.hy, vEnv = ref.vFast, vR = ref.vRally, kH = ref.curvH;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const rng = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const R = rng(SEED), idx = (s) => clamp(Math.round(s / ds), 0, N - 1);
const vmaxIn = (v, s, r) => { let m = 0; for (let i = idx(s - r); i <= idx(s + r); i++) m = Math.max(m, v[i]); return m; };
const Q = [[0, startS + 45], [finishS - 20, len], ...ref.cps.map(c => [c - 8, c + 8]), [startS + 4035.6 - 10, startS + 4063.6 + 10], ...[1150, 2642].map(d => [startS + d - 22, startS + d + 22])];
const quietEnd = (s, r) => { for (const [a, b] of Q) if (s + r > a && s - r < b) return b + r; return 0; };
const orig = Math.random;
// ---- the crests' places: the road straight 15 m before and 60 m after, no steep descent, the autopilot at 28 m/s and more, 180 m apart ----
const cand = [];
for (let s = startS + 200; s < finishS - 120; s += 10) {
  const i = idx(s); let kmax = 0, gmin = 1; for (let j = idx(s - 15); j <= idx(s + 60); j++) { kmax = Math.max(kmax, Math.abs(kH[j])); gmin = Math.min(gmin, ref.grade[j]); }
  if (kmax > 1 / 250 || gmin < -0.035 || vR[i] < 28 || quietEnd(s, 30)) continue;
  cand.push({ s, kmax, v: vR[i] });
}
cand.sort((a, b) => a.kmax - b.kmax);
const crests = [];
for (const c of cand) { if (crests.length >= NC) break; if (crests.every(j => Math.abs(j.s - c.s) > 180)) crests.push(c); }
crests.sort((a, b) => a.s - b.s);
for (const c of crests) { c.w = +clamp(0.19 * c.v, 6.5, 9.5).toFixed(1); c.h = 0.3; }
// ---- the dips: 45-75 m apart, 6-9 m, as deep as a quick car bears unseen (their rims' lift under A) ----
const dips = [];
for (let s = startS + 60; s < finishS - 30;) {
  const w = 6 + 3 * R(), q = quietEnd(s, 2.4 * w); if (q) { s = q + 1; continue; }
  if (crests.some(j => Math.abs(j.s - s) < 38)) { s += 10; continue; }
  const v = vmaxIn(vEnv, s, 2 * w), h = -Math.min(0.3 + 0.3 * R(), A * w * w / (0.892 * v * v));
  if (h < -0.12) dips.push([+s.toFixed(1), +h.toFixed(2), +w.toFixed(1)]);
  s += 45 + 30 * R();
}
const S2 = 2 * (4 * (2 / 3) * ds * ds);
function build(scale, noJ) {
  const C = loadCore(), def = C.TRACKS.find(d => d.id === 'killar'), b = new Float64Array(N);
  for (const [c, h, w] of dips) { const wi2 = Math.max(9, w * w - S2), hi = scale * h * w / Math.sqrt(wi2); for (let i = idx(c - 4 * w); i <= idx(c + 4 * w); i++) { const d = i * ds - c; b[i] += hi * Math.exp(-d * d / wi2); } }
  const patch = { elev: hy0.map((h, i) => [i / (N - 1), +(h + b[i]).toFixed(4)]), elevSmooth: 2 };
  if (crests.length && !noJ) patch.bumps = crests.map(j => ({ at: +(j.s / len).toFixed(6), h: +(scale * j.h).toFixed(2), w: j.w }));
  Object.assign(def, patch);
  Math.random = seeded(3); const T = new C.Track(def); Math.random = orig;
  return { C, T, patch };
}
function tt(B, m, log) {
  const { C, T } = B; Math.random = seeded(3);
  const r = new C.Race(T, { tt: true, numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[m], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }), P = r.player; r.start();
  let t = 0, k = 0, air0 = false, t0 = 0, hh = 0, v0 = 0, s0 = 0, res = 0; const L = [];
  while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); res++; }
    if (P.air && !air0) { t0 = t; hh = 0; v0 = Math.hypot(P.vx, P.vz); s0 = P.q.s; } if (P.air) hh = Math.max(hh, P.y - P.roadY);
    if (!P.air && air0) L.push({ s: s0, v0, v1: Math.hypot(P.vx, P.vz), T: t - t0, h: hh, vy: P.impactVY || 0 }); air0 = P.air; }
  Math.random = orig;
  return { time: P.finished ? P.finishTime : NaN, L, falls: P.falls || 0, res };
}
const flightAt = (L, s) => L.filter(f => Math.abs(f.s - s) < 25).reduce((m, f) => Math.max(m, f.T), 0);
// ---- each crest's height: the stock rally car's flight over it FL s (bisection, one crest after another: a crest changes the speed after it) ----
for (const c of crests) {
  let lo = 0.2, hi = 2.2;
  for (let it = 0; it < 9; it++) { c.h = (lo + hi) / 2; const f = flightAt(tt(build(1), 4).L, c.s); if (f > FL) hi = c.h; else lo = c.h; }
  c.h = +((lo + hi) / 2).toFixed(2);
}
const B = build(K), T = B.T, C = B.C;
let gmax = 0, liftDip = 0; const und = new Float64Array(N);
for (let i = 0; i < N; i++) { und[i] = T.hy[i] - hy0[i]; gmax = Math.max(gmax, Math.abs(T.grade[i])); if (!crests.some(j => Math.abs(j.s - i * ds) < 30)) liftDip = Math.max(liftDip, -T.curv[i] * vEnv[i] * vEnv[i]); }
console.log(`[${tag}] k=${K} let=${FL}s: grbin ${crests.length}, kotanj ${dips.length} (globina ${Math.min(...dips.map(d => d[1]))}..${Math.max(...dips.map(d => d[1]))} m), naklon max ${(gmax * 100).toFixed(1)} %, razbremenitev ob kotanjah (hitri avti) ${liftDip.toFixed(1)} m/s2`);
console.log('   grbine (m po startu / h / w / v reli): ' + crests.map(j => `${Math.round(j.s - startS)}/${(K * j.h).toFixed(2)}/${j.w}/${j.v.toFixed(0)}`).join('  '));
for (const m of [4, 20, 9, 10, 11, 37]) { const r = tt(B, m); const fl = r.L.filter(f => f.T > 0.08);
  console.log(`   tt ${C.MODELS[m].id} ${r.time.toFixed(2)} (danes ${ref.times[m][2]}), letov>0.08s ${fl.length} (vseh ${r.L.length}), cas leta med ${fl.length ? fl.map(f => f.T).sort((a, b) => a - b)[fl.length >> 1].toFixed(2) : 0} max ${Math.max(0, ...r.L.map(f => f.T)).toFixed(2)} s, visina max ${Math.max(0, ...r.L.map(f => f.h)).toFixed(2)} m, pristanek vy max ${Math.min(0, ...r.L.map(f => f.vy)).toFixed(1)}, padci ${r.falls}, resitve ${r.res}`); }
fs.writeFileSync(path.join(__dirname, `patch-${tag}.json`), JSON.stringify(Object.assign({ _und: Array.from(und, x => +x.toFixed(3)) }, B.patch)));
fs.writeFileSync(path.join(__dirname, `waves-${tag}.json`), JSON.stringify({ k: K, dips, crests, und: Array.from(und, x => +x.toFixed(3)) }));
