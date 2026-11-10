#!/usr/bin/env node
// Killar, Indija: the road's undulation (KILLAR_UND in js/tracks/killar.js; the user's wish of 9. 11. 2026 at ~22.23: »proga naj ima razgibano
// cesto po kateri vozis sedaj se celotna cesta nerazgibana«; the physics of driving unchanged: only the track's data, js/core.js as it is).
// Builds today's smooth road (KILLAR_RAZGIBANOST 0), drives it on the autopilot (the stock rally car, C.MODELS[4], and every model for the
// quickest speed at each sample) and writes the line KILLAR_UND:
//   - the crests the co-driver calls (def.bumps): where the road is straight (no curve tighter than 250 m) from 15 m before to 60 m after,
//     not down a grade steeper than 4.5 %, the autopilot at 28 m/s or more, the racing line from 10 m before to 30 m after it no more
//     than 1.5 m off the middle towards a drop (def.drops: the cars there by the edge took off and landed unsettled and went over it,
//     10. 11. 2026), no braking after it (Race.vprof, the speed the cars brake to, stays
//     above the quickest car's speed for 60 m and above the rally car's for 100 m: no landing into a braking zone), clear of the start, the
//     finish, the checkpoints, the bridge and the two passing places, at least --razmik m apart (the most that fit, from the start on; of more
//     than 10 the straightest 10); each as high as makes the rally car on the autopilot fly --let s (bisection, one crest after another: a
//     crest changes the speed after it), --let-rob s where the racing line goes over to the drop's side within 100 m after it (more than 1 m
//     off the middle towards a drop, def.drops: the cars that landed there unsettled ran wide over the edge, 10. 11. 2026);
//   - the silent dips between them: every 45-75 m (seeded), 6-9 m half-width, 0.3-0.6 m deep but no deeper than lets the quickest car there
//     keep its wheels on their rims (the rim of a Gaussian dip lifts by 0.892 |h| / w^2 v^2: at most A = 9 m/s^2, a car takes off at 11.9),
//     none within 38 m of a crest.
// Then it builds the road from the file and prints the times of the autopilot in a few cars before and after, their flights, the steepest
// grade, and how far the file's own copy of today's profile (roadBase without the undulation) is from the road Track builds today.
//   node tools/killar-cesta.mjs [--let 0.35] [--let-rob 0.25] [--razmik 100] [--seme 7]   writes the line KILLAR_UND in js/tracks/killar.js
//   node tools/killar-cesta.mjs --check                                   only prints the numbers of the file's undulation (writes nothing)
// After a new line: node tools/killar-skala.mjs (the rock and the floor a falling car lands on, from the ground drawn now), node tools/menu-lens.js,
// the medals (tests/killar.test.js prints them: the rally car on the autopilot x 1.01 / 1.06 / 1.14) and Killar's references (docs/proge/killar.md).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), FILE = path.join(ROOT, 'js/tracks/killar.js');
const { coreSource } = require('../tests/lib/core.js'), { DT, seeded } = require('../tests/lib/sim.js');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? +process.argv[i + 1] : d; };
const FL = arg('--let', 0.35), FL2 = arg('--let-rob', 0.25), GAP = arg('--razmik', 100), SEED = arg('--seme', 7), A = 9, CHECK = process.argv.includes('--check');
const RE_K = /const KILLAR_RAZGIBANOST = ([\d.]+);/, RE_U = /const KILLAR_UND = \{.*\};/, SRC = coreSource();
if (!RE_K.test(SRC) || !RE_U.test(SRC)) throw new Error('js/tracks/killar.js: KILLAR_RAZGIBANOST or the line KILLAR_UND not found');
const K_FILE = +SRC.match(RE_K)[1], orig = Math.random, clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// a fresh Core with Killar's KILLAR_RAZGIBANOST = k and KILLAR_UND = und (null: the file's), and the track built as the game builds it
function build(k, und) {
  let src = SRC.replace(RE_K, () => `const KILLAR_RAZGIBANOST = ${k};`);
  if (und) src = src.replace(RE_U, () => 'const KILLAR_UND = ' + JSON.stringify(und) + ';');
  const m = { exports: {} }, C = new Function('module', 'exports', 'require', src + '\n;return Core;')(m, m.exports, require);
  const def = C.TRACKS.find(d => d.id === 'killar');
  Math.random = seeded(3); const T = new C.Track(def); Math.random = orig;
  return { C, def, T };
}
// the time trial on the autopilot (as tests/killar.test.js, section 8): the time, the top speed at each sample, the flights, the race's vprof
function tt(B, model) {
  const { C, T } = B; Math.random = seeded(3);
  const r = new C.Race(T, { tt: true, numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[model], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }), P = r.player; r.start();
  const v = new Float64Array(T.N), L = []; let t = 0, k = 0, air0 = false, t0 = 0, hh = 0, s0 = 0;
  while (!P.finished && t < 600) {
    Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    const i = T.idx(P.q.s); v[i] = Math.max(v[i], Math.hypot(P.vx, P.vz));
    if (P.air && !air0) { t0 = t; hh = 0; s0 = P.q.s; }
    if (P.air) hh = Math.max(hh, P.y - P.roadY);
    if (!P.air && air0) L.push({ s: s0, T: t - t0, h: hh, vy: P.impactVY || 0 });
    air0 = P.air;
  }
  Math.random = orig;
  for (let i = 1; i < T.N; i++) if (!v[i]) v[i] = v[i - 1];
  return { time: P.finished ? P.finishTime : NaN, v, L, falls: P.falls || 0, vprof: r.vprof };
}
const flightAt = (L, s) => L.filter(f => Math.abs(f.s - s) < 25).reduce((m, f) => Math.max(m, f.T), 0);
const r2 = (x) => Math.round(x * 100) / 100, r1 = (x) => Math.round(x * 10) / 10;

// ---- today's road: the samples, the speeds ----
const B0 = build(0), T0 = B0.T, N = T0.N, ds = T0.ds, S0 = T0.startS, idx = (s) => clamp(Math.round(s / ds), 0, N - 1);
const M = B0.C.MODELS.length, today = [];
let vFast = new Float64Array(N), R0 = null;
for (let m = 0; m < M; m++) { const r = tt(B0, m); today[m] = r.time; if (m === 4) R0 = r; for (let i = 0; i < N; i++) vFast[i] = Math.max(vFast[i], r.v[i]); }
const SHOW = [4, 9, 7, 1, 0].filter(m => m < M);
let und;
if (CHECK) und = JSON.parse(SRC.match(RE_U)[0].replace(/^const KILLAR_UND = /, '').replace(/;$/, ''));
else {
  const vR = R0.v, vp = R0.vprof, kH = T0.k, g0 = T0.grade;
  const Q = [[0, S0 + 45], [T0.finishS - 20, T0.len], ...T0.cpS.map(c => [c - 8, c + 8]), ...(B0.def.bridges || []).map(([a, b]) => [S0 + a - 10, S0 + b + 10]),
    ...[1150, 2642].map(d => [S0 + d - 22, S0 + d + 22])];   // (the passing places: js/world-killar.js def.pulls)
  const quietEnd = (s, r) => { for (const [a, b] of Q) if (s + r > a && s - r < b) return b + r; return 0; };
  const minIn = (arr, a, b) => { let m = 1e9; for (let j = idx(a); j <= idx(b); j++) m = Math.min(m, arr[j]); return m; };
  const drop = (s) => { for (const [a, b, sd] of B0.def.drops || []) if (s >= S0 + a && s <= S0 + b) return sd; return 0; };
  const toDrop = (a, b) => { let m = -9; for (let j = idx(a); j <= idx(b); j++) { const sd = drop(j * ds); if (sd) m = Math.max(m, T0.rl[j] * sd); } return m; };   // (the racing line's most towards a drop, m off the middle)
  // ---- the crests' places ----
  const cand = [];
  for (let s = S0 + 200; s < T0.finishS - 120; s += 10) {
    const i = idx(s); let kmax = 0, gmin = 1;
    for (let j = idx(s - 15); j <= idx(s + 60); j++) { kmax = Math.max(kmax, Math.abs(kH[j])); gmin = Math.min(gmin, g0[j]); }
    if (kmax > 1 / 250 || gmin < -0.045 || vR[i] < 28 || quietEnd(s, 30)) continue;
    if (minIn(vp, s, s + 60) < vFast[i] || minIn(vp, s, s + 100) < vR[i]) continue;   // (no braking after it)
    if (toDrop(s - 10, s + 30) > 1.5) continue;   // (the line by a drop's edge)
    cand.push({ s, kmax, v: vR[i] });
  }
  let crests = [];
  for (const c of cand) if (!crests.length || c.s - crests[crests.length - 1].s >= GAP) crests.push(c);
  if (crests.length > 10) crests = crests.sort((a, b) => a.kmax - b.kmax).slice(0, 10).sort((a, b) => a.s - b.s);
  for (const c of crests) { c.w = r1(clamp(0.19 * c.v, 6.5, 9.5)); c.h = 0.3; c.fl = FL;
    if (toDrop(c.s - 10, c.s + 100) > 1) c.fl = FL2; }
  // ---- the dips ----
  const rng = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const R = rng(SEED), dips = [];
  for (let s = S0 + 60; s < T0.finishS - 30;) {
    const w = 6 + 3 * R(), q = quietEnd(s, 2.4 * w); if (q) { s = q + 1; continue; }
    if (crests.some(j => Math.abs(j.s - s) < 38)) { s += 10; continue; }
    let v = 0; for (let j = idx(s - 2 * w); j <= idx(s + 2 * w); j++) v = Math.max(v, vFast[j]);
    const lo = -A * w * w / (0.892 * v * v), h = -Math.min(0.3 + 0.3 * R(), -lo);
    if (h < -0.12) dips.push([r1(s - S0), Math.ceil(h * 100) / 100, r1(w), Math.ceil(lo * 100) / 100]);
    s += 45 + 30 * R();
  }
  const line = (cr) => ({ N, L: r2(T0.len), S0: r2(S0), crests: cr.map(c => [r1(c.s - S0), r2(c.h), c.w]), dips });
  // ---- each crest's height: the rally car on the autopilot flies FL s over it ----
  for (const c of crests) {
    let lo = 0.2, hi = 2.2;
    for (let it = 0; it < 9; it++) { c.h = (lo + hi) / 2; const f = flightAt(tt(build(1, line(crests)), 4).L, c.s); if (f > c.fl) hi = c.h; else lo = c.h; }
    c.h = r2((lo + hi) / 2);
  }
  und = line(crests);
  const src = fs.readFileSync(FILE, 'utf8'), n = (src.match(new RegExp(RE_U.source, 'g')) || []).length;
  if (n !== 1) throw new Error('js/tracks/killar.js: the line KILLAR_UND found ' + n + ' times');
  fs.writeFileSync(FILE, src.replace(RE_U, () => 'const KILLAR_UND = ' + JSON.stringify(und) + ';'));
  console.log(`js/tracks/killar.js: KILLAR_UND written (${und.crests.length} crests, ${und.dips.length} dips; seed ${SEED}, flight ${FL} s, ${FL2} s at ${crests.filter(c => c.fl === FL2).map(c => Math.round(c.s - S0)).join(', ') || '-'} m, ${GAP} m apart)`);
}

// ---- the numbers of the undulation (at the file's KILLAR_RAZGIBANOST) ----
const B1 = build(K_FILE, und), T1 = B1.T, base = B1.def.roadBase;
let gmax = 0, gbase = 0, emu = 0, lift = 0;
for (let i = T1.startIdx; i < T1.finishIdx; i++) { gmax = Math.max(gmax, Math.abs(T1.grade[i])); }
for (let i = 1; i < N - 1; i++) gbase = Math.max(gbase, Math.abs(base[i + 1] - base[i - 1]) / (2 * ds));
if (base) for (let i = 0; i < N; i++) emu = Math.max(emu, Math.abs(base[i] - T0.hy[i]));
for (let i = 0; i < N; i++) if (!und.crests.some(c => Math.abs(S0 + c[0] - i * ds) < 30)) lift = Math.max(lift, -T1.curv[i] * vFast[i] * vFast[i]);
console.log(`KILLAR_RAZGIBANOST ${K_FILE}: ${und.crests.length} crests, ${und.dips.length} dips (${Math.min(...und.dips.map(d => d[1]))} to ${Math.max(...und.dips.map(d => d[1]))} m); `
  + `steepest grade ${(gmax * 100).toFixed(1)} % (today's ${(gbase * 100).toFixed(1)} %), the most a dip's rim lifts the quickest car ${lift.toFixed(1)} m/s2 (takes off at 11.9); `
  + `roadBase from today's road at most ${(emu * 1000).toFixed(1)} mm`);
console.log('crests (m after the start line / height / half-width): ' + und.crests.map(c => c.join('/')).join('  '));
for (const m of SHOW) {
  const r = tt(B1, m), fl = r.L.filter(f => f.T > 0.08).map(f => f.T).sort((a, b) => a - b);
  console.log(`  ${B1.C.MODELS[m].id}: ${r.time.toFixed(2)} s (today ${today[m].toFixed(2)}), flights over 0.08 s ${fl.length}, median ${fl.length ? fl[fl.length >> 1].toFixed(2) : 0} s, longest ${Math.max(0, ...fl).toFixed(2)} s, `
    + `highest ${Math.max(0, ...r.L.map(f => f.h)).toFixed(2)} m, landing ${Math.min(0, ...r.L.map(f => f.vy)).toFixed(1)} m/s, falls ${r.falls}`);
}
