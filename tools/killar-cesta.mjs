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
//   - the silent dips between them: every 45-75 m (seeded), 7-11 m half-width, 0.4-0.8 m deep but no deeper than lets the quickest car there
//     keep its wheels on their rims (the rim of a Gaussian dip lifts by 0.892 |h| / w^2 v^2: at most A = 9 m/s^2, a car takes off at 11.9),
//     none within 38 m of a crest;
//   - the relief across the road (ruts, read by killarCross in the track's file; the user, 10. 11. 2026: »Naj bo razgibana v vse smeri«,
//     »3d naj bodo tla pod kolesi«): hollows, ruts and ridges on one half of the road, each [metres after the start line, metres from the
//     middle (+ right), height at 1, half-length a, half-width b, flat half-length p, skew q]: h exp(-u^2 - v^2), u = max(0, |x| - p) / a,
//     v = (d - d0 - q x) / b. Where and which (the drop is on the left, def.drops, the hill on the right):
//       a right-hander tighter than 150 m: a wide hollow along its inside (the road banked into the bend, 0.2-0.32 m, to 10 m past its end);
//       a straight: by turns left and right, a hollow (half), a ridge or a rut that crosses the road at a slant; a third of the hollows
//         with a ridge on the other half (the whole road tilted one way), where no drop is on that side;
//       a left-hander: a hollow along its inside or a ridge on its outside; before a right-hander (within its length + 40 m): on the right;
//       none in a bend tighter than 60 m or an S, none within the quiet places (the start, the finish, the checkpoints, the bridge, the
//       passing places) or from 20 m before to 40 m after a crest; never a ridge on a drop's side (it would lean the car to the edge);
//       lower in tighter bends (to 0.4 at 60 m), and no feature leaves the road steeper across than 15 % between its edges' strips or
//       deeper than 0.36 m (at the height --k the file's switch stands at). The road's edges stay as they were (killarCross fades the
//       relief to nothing over the last 1.8 m: a rut by the drop is closed by a bank). The three highest ridges at least 250 m apart are
//       the co-driver's (calls: »crest left / right«, def.notes; his recorded words have none for a hollow or a tilt).
// Then it builds the road from the file and prints the times of the autopilot in a few cars before and after, their flights, the steepest
// grade, and how far the file's own copy of today's profile (roadBase without the undulation) is from the road Track builds today.
//   node tools/killar-cesta.mjs [--let 0.5] [--let-rob 0.35] [--razmik 100] [--seme 7] [--k 1.3]   writes the line KILLAR_UND in js/tracks/killar.js
//     (--k: the switch KILLAR_RAZGIBANOST the heights are set for, the file's own by default: the flights, the dips' rims and the relief's
//     limits hold at it; the line stores the heights at 1)
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
const FL = arg('--let', 0.5), FL2 = arg('--let-rob', 0.35), GAP = arg('--razmik', 100), SEED = arg('--seme', 7), A = 9, CHECK = process.argv.includes('--check');
const RE_K = /const KILLAR_RAZGIBANOST = ([\d.]+);/, RE_U = /const KILLAR_UND = \{.*\};/, SRC = coreSource();
if (!RE_K.test(SRC) || !RE_U.test(SRC)) throw new Error('js/tracks/killar.js: KILLAR_RAZGIBANOST or the line KILLAR_UND not found');
const K_FILE = +SRC.match(RE_K)[1], KT = arg('--k', K_FILE) || 1, orig = Math.random, clamp = (x, a, b) => Math.max(a, Math.min(b, x));

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
    const w = 7 + 4 * R(), q = quietEnd(s, 2.4 * w); if (q) { s = q + 1; continue; }
    if (crests.some(j => Math.abs(j.s - s) < 38)) { s += 10; continue; }
    let v = 0; for (let j = idx(s - 2 * w); j <= idx(s + 2 * w); j++) v = Math.max(v, vFast[j]);
    const lo = -A * w * w / (0.892 * v * v), h = -Math.min(0.4 + 0.4 * R(), -lo) / KT;   // (as deep at KT)
    if (h * KT < -0.12) dips.push([r1(s - S0), Math.ceil(h * 100) / 100, r1(w), Math.ceil(lo * 100) / 100]);
    s += 45 + 30 * R();
  }
  // ---- the relief across the road: ruts, hollows and ridges on one half of it (its own draws: the dips stay where they are) ----
  const R2 = rng(SEED + 1000), ruts = [], calls = [], cores = [], r3 = (x) => Math.round(x * 1000) / 1000;
  const kRange = (a, b) => { let lo = 0, hi = 0; for (let j = idx(a); j <= idx(b); j++) { lo = Math.min(lo, kH[j]); hi = Math.max(hi, kH[j]); } return [lo, hi]; };
  const dropIn = (a, b, sd) => (B0.def.drops || []).some(([x, y, q]) => q === sd && b >= S0 + x && a <= S0 + y);
  const nearCrest = (a, b) => crests.some(c => b > c.s - 20 && a < c.s + 40);   // (the take-off and the landing on the road as it is)
  // the right-handers tighter than 150 m (the drop on their outside: where the cars of a race run wide over the edge): the road banked
  // into the bend, a wide hollow along its inside, the deeper the tighter the bend (0.2-0.32 m), over the bend's length (cut clear of the
  // quiet places and the crests)
  for (let i = T0.startIdx + 1, i0 = -1; i <= T0.finishIdx; i++) {
    const on = kH[i] > 1 / 150 && i < T0.finishIdx; if (on && i0 < 0) i0 = i; if (on || i0 < 0) continue;
    let a0 = i0 * ds, b0 = (i - 1) * ds + 10, kmax = 0; for (let j = i0; j < i; j++) kmax = Math.max(kmax, kH[j]); i0 = -1;   // (10 m past its end: the cars run wide on the way out)
    const a = 8, mg = 1.8 * a;
    for (const [qa, qb] of Q.concat(crests.map(c => [c.s - 20, c.s + 40]))) if (b0 + mg > qa && a0 - mg < qb) { if (qa - mg - a0 > b0 - qb - mg) b0 = qa - mg; else a0 = qb + mg; }
    if (b0 - a0 < 10) continue;
    const mid = (a0 + b0) / 2, p = r1((b0 - a0) / 2 - 2), h = -(0.2 + 0.12 * clamp((kmax - 1 / 150) / (1 / 40 - 1 / 150), 0, 1)) / KT;
    ruts.push([r1(mid - S0), 1.5, r2(h), a, 3, p]); cores.push([mid - p - a, mid + p + a]);
  }
  const bowls = ruts.length;
  for (let s = S0 + 55, side = R2() < 0.5 ? -1 : 1; s < T0.finishS - 30;) {
    let v = 0; for (let j = idx(s - 15); j <= idx(s + 15); j++) v = Math.max(v, vFast[j]);
    const a = r1(clamp(0.2 * v, 6, 11) * (0.9 + 0.3 * R2())), u = R2(), u2 = R2(), u3 = R2(), u4 = R2(), u5 = R2(), u6 = R2();
    let p = u6 < 0.35 ? r1(8 + 14 * u5) : 0, ext = p + 2.2 * a;
    const q = quietEnd(s, ext); if (q) { s = q + 1; continue; }
    if (nearCrest(s - p - 1.5 * a, s + p + 1.5 * a) || cores.some(([x, y]) => s + p + a > x && s - p - a < y)) { s += 6; continue; }
    const [klo, khi] = kRange(s - ext, s + ext), kk = Math.max(-klo, khi);
    if (kk > 1 / 60 || (khi > 1 / 300 && klo < -1 / 300)) { s += 6; continue; }   // (a tight bend, an S: the road as it is, or banked above)
    const amp = clamp(1 - 0.6 * (kk - 1 / 300) / (1 / 60 - 1 / 300), 0.4, 1) / KT;   // (gentler the tighter the bend; the heights as designed at KT)
    let kind, sd;
    if (khi > 1 / 300 || kRange(s, s + ext + 40)[1] > 1 / 150) { kind = 'T'; sd = 1; }   // a right-hander, or one right after: a rut along its inside (banked into the bend)
    else if (klo < -1 / 300) { sd = u < 0.6 ? -1 : 1; kind = sd < 0 ? 'T' : 'R'; }   // a left-hander: a rut along its inside or a ridge along its outside
    else { sd = side; side = -side; kind = u < 0.5 ? 'T' : u < 0.78 ? 'R' : 'X'; }   // a straight: one side, then the other
    if (kind === 'R' && dropIn(s - ext, s + ext, sd)) kind = 'T';   // (no ridge on a drop's side: its outer flank falls towards the edge)
    if (kind === 'X') { p = r1(6 + 6 * u5); ext = p + 2.2 * a; if (quietEnd(s, ext) || nearCrest(s - p - 1.5 * a, s + p + 1.5 * a) || cores.some(([x, y]) => s + p + a > x && s - p - a < y)) { kind = 'T'; p = 0; } }
    const m = r1(s - S0), put = (d, h, b, sk) => ruts.push([m, r2(d), r2(h), a, r1(b)].concat(sk ? [p, r3(sk)] : p ? [p] : []));
    if (kind === 'T') { put(sd * (1.9 + 0.7 * u3), -(0.18 + 0.14 * u2) * amp, 1.9 + 0.5 * u4);
      if (u5 < 0.3 && kk <= 1 / 300 && !dropIn(s - ext, s + ext, -sd)) put(-sd * (1.6 + 0.6 * u4), (0.1 + 0.08 * u3) * amp, 1.8 + 0.4 * u2); }   // (with a ridge on the other half: the whole road leans)
    else if (kind === 'R') put(sd * (1.5 + 0.8 * u3), (0.12 + 0.1 * u2) * amp, 1.8 + 0.4 * u4);
    else put(0, -(0.16 + 0.1 * u2) * amp, 2 + 0.4 * u4, -sd * 2.2 / (p + a));   // (a rut from one side over to the other)
    s += (p + a) * (1.3 + 0.6 * R2());
  }
  // no steeper across than 15 % where the cars drive (to 2.7 m from the middle) and no deeper than 0.36 m, at KT: where the ruts and the
  // ridges add up to more, the ones there lowered (the banked bends' hollows stay)
  const relief = (s, d) => { let y = 0, sl = 0;   // (as killarCross in js/tracks/killar.js, at KT, before the road's edges: the check below compares the two)
    for (const r of ruts) { const x = s - S0 - r[0], e = (r[5] || 0) + 3 * r[3]; if (x > e || x < -e) continue; const uu = Math.max(0, Math.abs(x) - (r[5] || 0)) / r[3], vv = (d - r[1] - (r[6] || 0) * x) / r[4], g = KT * r[2] * Math.exp(-uu * uu - vv * vv); y += g; sl -= 2 * vv / r[4] * g; }
    return [y, sl]; };
  for (let pass = 0; pass < 4; pass++) for (let k = bowls; k < ruts.length; k++) { const r = ruts[k], e = (r[5] || 0) + 1.5 * r[3]; let over = 1;
    for (let s = S0 + r[0] - e; s <= S0 + r[0] + e; s += 2) for (let d = -2.7; d <= 2.71; d += 0.3) { const [y, sl] = relief(s, d); over = Math.max(over, Math.abs(sl) / 0.15, Math.abs(y) / 0.36); }
    if (over > 1.001) r[2] = r2(r[2] / over * 0.98); }
  for (const r of ruts.slice(bowls).sort((x, y) => x[0] - y[0])) if (r[2] * KT >= 0.17 && !calls.some(c => r[0] - c[0] < 250) && !crests.some(c => Math.abs(c.s - S0 - r[0]) < 120) && calls.length < 8) calls.push([r[0], Math.sign(r[1])]);   // (the co-driver's 'crest left / right': the highest ridges)
  ruts.sort((x, y) => x[0] - y[0]);
  const line = (cr) => ({ N, L: r2(T0.len), S0: r2(S0), crests: cr.map(c => [r1(c.s - S0), r2(c.h), c.w]), dips, ruts, calls });
  // ---- each crest's height: the rally car on the autopilot flies FL s over it ----
  for (const c of crests) {
    let lo = 0.2, hi = 2.2;
    for (let it = 0; it < 9; it++) { c.h = (lo + hi) / 2; const f = flightAt(tt(build(KT, line(crests)), 4).L, c.s); if (f > c.fl) hi = c.h; else lo = c.h; }
    c.h = r2((lo + hi) / 2);
  }
  und = line(crests);
  const src = fs.readFileSync(FILE, 'utf8'), n = (src.match(new RegExp(RE_U.source, 'g')) || []).length;
  if (n !== 1) throw new Error('js/tracks/killar.js: the line KILLAR_UND found ' + n + ' times');
  fs.writeFileSync(FILE, src.replace(RE_U, () => 'const KILLAR_UND = ' + JSON.stringify(und) + ';'));
  console.log(`js/tracks/killar.js: KILLAR_UND written (${und.crests.length} crests, ${und.dips.length} dips, ${und.ruts.length} ruts and ridges; seed ${SEED}, at KILLAR_RAZGIBANOST ${KT} flight ${FL} s, ${FL2} s at ${crests.filter(c => c.fl === FL2).map(c => Math.round(c.s - S0)).join(', ') || '-'} m, ${GAP} m apart)`);
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
if (T1.bank) {   // the relief across the road: its heights, its slopes across where the cars drive (to 2.7 m from the middle) and by the edges, towards a drop
  const o = {}, RT = und.ruts || []; let lo = 0, hi = 0, lane = 0, edge = 0, out = 0, quiet = 0, tilted = 0, n = 0;
  const dropAt = (s, sd) => (B1.def.drops || []).some(([x, y, q]) => q === sd && s >= S0 + x && s <= S0 + y);
  for (let i = T1.startIdx; i < T1.finishIdx; i++) { const s = i * ds; let mx = 0;
    for (let d = -4.4; d <= 4.41; d += 0.2) { T1.bankAt(s, d, o); lo = Math.min(lo, o.dy); hi = Math.max(hi, o.dy); const ad = Math.abs(d);
      if (ad <= 2.7) { lane = Math.max(lane, Math.abs(o.sl)); mx = Math.max(mx, Math.abs(o.sl)); } else { edge = Math.max(edge, Math.abs(o.sl)); if (dropAt(s, Math.sign(d))) out = Math.max(out, o.sl * Math.sign(d) * -1); }
      if (s < S0 + 45 || T1.cpS.some(c => Math.abs(s - c) < 8) || (B1.def.bridges || []).some(([a, b]) => s > S0 + a - 10 && s < S0 + b + 10)) quiet = Math.max(quiet, Math.abs(o.dy)); }
    n++; if (mx > 0.04) tilted++; }
  console.log(`relief across: ${RT.length} ruts and ridges (${RT.filter(r => r[2] < 0).length} ruts and hollows, ${RT.filter(r => r[2] > 0).length} ridges, ${RT.filter(r => r[6]).length} crossing), ${lo.toFixed(2)} to +${hi.toFixed(2)} m; `
    + `the slope across where the cars drive at most ${(lane * 100).toFixed(1)} %, over 4 % on ${(tilted / n * 100).toFixed(0)} % of the road, by the edges ${(edge * 100).toFixed(1)} %; `
    + `towards a drop's edge within 1.8 m of it at most ${(out * 100).toFixed(1)} %; in the quiet places ${(quiet * 1000).toFixed(1)} mm; the co-driver's calls at ${(und.calls || []).map(c => c[0] + (c[1] > 0 ? 'R' : 'L')).join(', ') || '-'} m`);
}
for (const m of SHOW) {
  const r = tt(B1, m), fl = r.L.filter(f => f.T > 0.08).map(f => f.T).sort((a, b) => a - b);
  console.log(`  ${B1.C.MODELS[m].id}: ${r.time.toFixed(2)} s (today ${today[m].toFixed(2)}), flights over 0.08 s ${fl.length}, median ${fl.length ? fl[fl.length >> 1].toFixed(2) : 0} s, longest ${Math.max(0, ...fl).toFixed(2)} s, `
    + `highest ${Math.max(0, ...r.L.map(f => f.h)).toFixed(2)} m, landing ${Math.min(0, ...r.L.map(f => f.vy)).toFixed(1)} m/s, falls ${r.falls}`);
}
