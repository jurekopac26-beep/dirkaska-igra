// The player's driving measured from the recordings of their races (posnetek_<proga>_<LLLLMMDD-UUMM>.rrp, js/napake.js; the plan:
// docs/ai-po-tvoji-liniji.md, korak 1), for the AI to drive like them later (korak 2). For every track and weather (suho, mokro; ·zima on a
// winter's road) every --korak metres along the track (s, from the start line; default 5): the average line (d, the offset from the road's
// centre, + to the right) with its spread over the laps, the speed v(s) with its spread, the same speed as a share vq of the autopilot's pace
// of that car there (Core.aiControl: the race's speed profile, the corners' limit and the braking before them; what carries over to another
// car), the acceleration and the share of laps braking; for every corner where the braking starts (metres before its apex), how hard (m/s²,
// and as a share of the autopilot's braking there) and the speed at the apex. Only clean laps count: a spin, a trip off the road, a hit, a
// rescue, the pits or a changing weather leave the lap out (why: in the summary); a lap's parts beside another car or right behind one (and a
// second either side), under the safety car or on the standing start of the first lap are left out of it. The game's own code reads the file
// (Napake.rrp.unpack) and finds the car on the track (Core.Track.query: s and d; tests/lib/core.js).
//   node tools/voznja.mjs posnetek_bathurst_20261105-1432.rrp posnetek_bathurst_20261105-1510.rrp
//   node tools/voznja.mjs mapa/*.rrp --out profil.json [--korak 5]
// Out: test-results/voznja/profil.json and povzetek.txt (--out <file>.json: the summary beside it as <file>.txt; --out <folder>: both in it).
// The user's recordings and profiles stay out of the repository (CLAUDE.md, Orodje za napake). tests/voznja.test.js: a recording made by Core.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { loadCore } = require('../tests/lib/core.js');
const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const VER = 1;   // (the profile's own format: profil.json's verzija)

// the measuring rules (docs/ai-po-tvoji-liniji.md, Pravila meritve)
export const RULES = {
  spinDeg: 75, spinV: 5, spinT: 0.15,   // a spin: the nose more than 75° off the road's direction above 5 m/s, for 0.15 s (a clean lap's slide: under 30°)
  revV: 1, revT: 0.3,                   // ... or backwards (along the road) faster than 1 m/s for 0.3 s
  offM: 1, offT: 0.25,                  // off the road: the car's middle 1 m past the asphalt's edge (and its kerb), all four wheels off, for 0.25 s
  hitA: 50,                             // a hit (the barrier, a car): more than 50 m/s² of speed lost between two samples, over the ground and the car's own (into a wall: 100-150; the brakes up to ~16, a car sliding sideways in a spin ~30)
  side: [7, 5], behind: [22, 3],        // traffic: another car within 7 m along and 5 m across (beside it), or 0-22 m ahead within 3 m across
  margin: 1,                            // ... and 1 s before and after (the run up to a pass, pulling away)
  wetIn: 40, dryIn: 240,                // a changing weather: the road as wet as the rain 40 s after the rain has its new value, dry 240 s after it stops (less rain: 240 s per unit; Race._weather)
  apexDrop: 3, apexWin: 60,             // a corner: a minimum of the mean speed within 60 m either side, at least 3 m/s under the speed before it
  brakeWin: 500, brakeGap: 0.4,         // its braking: within 500 m before the apex; the brake let off for up to 0.4 s is still one braking
  enough: { krog: [3, 5, 8], cesta: [3, 5] }   // clean laps: the least, good, best (a circuit: 8-10; more than 10 hardly helps)
};

// the game's own reading of a .rrp: js/napake.js loads without a page (its DOM only when its screens open), Napake.rrp.unpack
export function napake() {
  const ctx = vm.createContext({ TextEncoder, TextDecoder });
  vm.runInContext(fs.readFileSync(path.join(REPO, 'js', 'napake.js'), 'utf8') + '\n;this.Napake = Napake;', ctx, { filename: 'js/napake.js' });
  return ctx.Napake;
}
export function readRrp(N, file) {
  let u = new Uint8Array(fs.readFileSync(file));
  if (u[0] === 0x1f && u[1] === 0x8b) { try { u = new Uint8Array(zlib.gunzipSync(u)); } catch (_) { throw new Error('posnetek je poškodovan'); } }
  return N.rrp.unpack(u);
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sdev = (a, m) => a.length > 1 ? Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / (a.length - 1)) : 0;
const median = (a) => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : NaN; };
// a mean that a lap gone wrong at one place does not pull: with 5 values or more, those further than 3.5 spreads from the median left out
// (the spread: the MAD's, at least s0, the value's own scale: laps on two lines 0.8 m apart have a MAD of 0 and are both kept)
function robust(a, s0) {
  if (!a.length) return null;
  let b = a;
  if (a.length >= 5) { const m = median(a), sp = Math.max(s0, median(a.map(x => Math.abs(x - m))) * 1.4826); b = a.filter(x => Math.abs(x - m) <= 3.5 * sp); }
  const m = mean(b); return { m, sd: sdev(b, m), n: b.length };
}
const SCALE = { d: 0.3, v: 1, q: 0.02, s: 10, dec: 1 };   // (robust's s0: m, m/s, a share, m, m/s²)
const r2 = (x) => x == null || !Number.isFinite(x) ? null : Math.round(x * 100) / 100, r3 = (x) => x == null || !Number.isFinite(x) ? null : Math.round(x * 1000) / 1000;
const dec = (x, n = 1) => x == null || !Number.isFinite(x) ? '–' : x.toFixed(n).replace('-', '−').replace('.', ',');
const kmh = (v) => dec(v * 3.6, 0);
const clock = (t) => { const u = Math.max(0, Math.round(t * 1000)), m = Math.floor(u / 60000); return m + ':' + ((u % 60000) / 1000).toFixed(3).padStart(6, '0'); };

/* ---------------- the track: Core's own, one per id; the values along it at a distance from the start line ---------------- */
function trackOf(C, cache, id) {
  if (cache.has(id)) return cache.get(id);
  const def = C.TRACKS.find(d => d.id === id), T = def ? new C.Track(def) : null;
  const t = T ? { def, T, open: !!T.open, len: T.open ? T.raceLen : T.len } : null;
  cache.set(id, t); return t;
}
// a per-sample array of the track (T.rl, a pace profile) at s metres from the start line, between its samples
function along(t, arr, s) {
  const T = t.T, N = T.N, f = (T.startS + s) / T.ds;
  if (t.open) { const g = clamp(f, 0, N - 1), i = Math.min(N - 2, Math.floor(g)), u = g - i; return arr[i] + (arr[i + 1] - arr[i]) * u; }
  const i = Math.floor(f), u = f - i, a = ((i % N) + N) % N, b = (a + 1) % N; return arr[a] + (arr[b] - arr[a]) * u;
}

/* ---------------- the autopilot's pace of a car (the reference vq is measured against): the speed profile the race gives that car in that
   weather (Race._prof: the corners' limit on the racing line, the braking before them; its own for a field or a one-make race, the upgraded
   brakes), times what the upgrades' grip adds as Core's aiDrive does ((upgGrip (1 + aeroK v²))^¼). Built by a race of its own in Core with
   the car as the recording has it (pf: its upgrades, set-up, garage parts, the field's car; older recordings: the stock car). Not in it: the
   tyres' compound and wear (aiDrive's c.wet / profW), the race's skill (the player's autopilot has none) ---------------- */
function paceOf(C, t, car, cond, cache) {
  const pf = car.pf || {}, key = [car.m, JSON.stringify(pf), cond.rain, cond.winter ? 1 : 0, cond.tyres ? 1 : 0].join('|');
  if (cache.has(key)) return cache.get(key);
  const M = C.MODELS.find(m => m.id === car.m) || C.MODELS[0], FM = pf.fm ? C.MODELS.find(m => m.id === pf.fm) : null;
  const race = new C.Race(t.T, { numAI: 0, playerModel: M, fieldModel: FM || undefined, playerUpg: pf.upg || undefined, playerSetup: pf.setup || undefined, playerDeli: pf.deli || undefined,
    laps: 1, rain: cond.rain, winter: cond.winter, tyres: cond.tyres, seed: 7, damage: 0 });
  if (cond.tyres && typeof race._weather === 'function') race._weather(0);   // (the rain tyres' grip in the profile, as at the race's first step)
  const P = race.player, vp = P.vprof || race.vprof, g = P.upgGrip, k = P.aeroK || 0, out = new Float32Array(vp.length);
  for (let i = 0; i < vp.length; i++) { const v = vp[i]; out[i] = g ? v * Math.pow(g * (1 + k * v * v), 0.25) : v; }
  const r = { v: out, model: M.id, stock: !car.pf };
  cache.set(key, r); return r;
}
// the deceleration of a pace profile per sample (m/s², where it brakes: v² falls by 2 a ds)
function brakingOf(T, v) {
  const N = T.N, a = new Float32Array(N);
  for (let i = 0; i < N; i++) { const j = T.open ? Math.min(N - 1, i + 1) : (i + 1) % N, ds = T.rds && T.rds[i] > 0.1 ? T.rds[i] : T.ds; a[i] = Math.max(0, (v[i] * v[i] - v[j] * v[j]) / (2 * ds)); }
  return a;
}

/* ---------------- the weather of a lap: the header's (wx, rain; wxs: a changing weather's rain from r0 to r1 over dur s from at, the
   recordings from 5. 11. 2026 on); a lap while the road gets wet or dries is left out ---------------- */
function condOf(H, t0, t1, tyres) {
  const winter = H.season === 'winter', X = H.wxs;
  let rain;
  if (X && X.r0 !== X.r1) {   // (the water on the road: wet within RULES.wetIn s of the rain's end value, dry by RULES.dryIn s per unit of rain gone)
    const a = X.at, b = X.at + X.dur;
    if (t1 <= a) rain = X.r0;
    else if (t0 >= b + (X.r1 > X.r0 ? RULES.wetIn : (X.r0 - X.r1) * RULES.dryIn)) rain = X.r1;
    else return { skip: 'vreme se spreminja' };
  } else rain = H.rain > 0 ? H.rain : /^dez/.test(H.wx || '') ? 1 : 0;
  return { rain, wet: rain > 0, winter, tyres, key: (rain > 0 ? 'mokro' : 'suho') + (winter ? '·zima' : '') };
}

/* ---------------- one recording: the player's car in every sample on the track, its laps, each lap checked and its parts left out ---------------- */
function scanFile(C, N, file, tc, paces) {
  const name = path.basename(file);
  let rec;
  try { rec = readRrp(N, file); } catch (e) { return { name, why: 'posnetka ni mogoče prebrati: ' + (e && e.message || e) }; }
  const { H, frames: F } = rec, t = trackOf(C, tc, H.track);
  if (!t) return { name, why: 'proge ' + H.track + ' ta različica igre nima' };
  const pk = H.cars.findIndex(c => c.pl);
  if (pk < 0) return { name, why: 'v posnetku ni igralca' };
  if (!(H.w >= 7)) return { name, why: 'posnetek je iz starejše različice igre (' + H.w + ' števil na avto)' };
  const mode = String(H.mode || 'race'), why = /sola/.test(mode) ? 'šola vožnje' : /^police/.test(mode) ? 'policijski pregon' : /^traffic/.test(mode) ? 'vožnja s prometom (promet ni v posnetku)' : '';
  const T = t.T, W = H.w, n = H.n, o = 1 + pk * W, NF = F.length, len = t.len;
  const tyres = H.ty != null ? !!H.ty : !H.tt && !!t.def.pit;   // (the race with tyres: the header's ty, js/game.js rrpOf; older recordings as the game sets it)
  // the player's car in every sample: s (from the start line), d, the road's way, its speed, its bits; the faults sample by sample
  const S = { t: new Float64Array(NF), s: new Float64Array(NF), d: new Float32Array(NF), v: new Float32Array(NF), b: new Uint8Array(NF), ex: new Uint8Array(NF),
    spin: new Uint8Array(NF), rev: new Uint8Array(NF), off: new Uint8Array(NF), hit: new Uint8Array(NF) };
  const q = {}; let hint = -1;
  const TX = new Float32Array(NF), TZ = new Float32Array(NF), NX = new Float32Array(NF), NZ = new Float32Array(NF)
  const SP = new Float32Array(NF).fill(-1);   // (the speed over the ground from the sample before, m/s)
  for (let j = 0; j < NF; j++) {
    const f = F[j], x = f[o], z = f[o + 2];
    T.query(x, z, hint, q); hint = q.i;
    S.t[j] = f[0]; S.s[j] = t.open ? q.s - T.startS : ((q.s - T.startS) % T.len + T.len) % T.len; S.d[j] = q.d; S.v[j] = f[o + 4]; S.b[j] = f[o + 6] & 7;
    TX[j] = q.tx; TZ[j] = q.tz; NX[j] = q.nx; NZ[j] = q.nz;
    const h = f[o + 3], dot = Math.cos(h) * q.tx + Math.sin(h) * q.tz, cr = Math.cos(h) * q.tz - Math.sin(h) * q.tx;
    const i = q.a, edge = T.wAt(i) + (T.curb && T.curb[i] ? T.curbW || 1.5 : 0);
    if (Math.abs(q.d) > edge + RULES.offM) S.off[j] = 1;
    if (j > 0) {
      const dt = S.t[j] - S.t[j - 1], g = F[j - 1], dx = x - g[o], dz = z - g[o + 2];
      if (dt > 1e-4) {
        const sp = Math.hypot(dx, dz) / dt, fw = (dx * q.tx + dz * q.tz) / dt;
        if (sp > RULES.spinV && Math.atan2(Math.abs(cr), dot) > RULES.spinDeg * Math.PI / 180) S.spin[j] = 1;
        if (fw < -RULES.revV) S.rev[j] = 1;
        // (a hit: the speed over the ground and the car's own both drop at once; in a spin only the car's own does, it slides on sideways)
        if (j > 1 && SP[j - 1] >= 0) { const tm = (S.t[j] - S.t[j - 2]) / 2; if (tm > 1e-4 && Math.min(S.v[j - 1] - S.v[j], SP[j - 1] - sp) / tm > RULES.hitA) S.hit[j] = 1; }
        SP[j] = sp;
      }
    }
  }
  // the parts left out: beside another car or right behind it (and RULES.margin s either side), the safety car out
  const near = new Uint8Array(NF), sc = new Uint8Array(NF);
  for (let j = 0; j < NF; j++) {
    const f = F[j], x = f[o], z = f[o + 2];
    if ((f[1 + n * W + 6] & 6) === 6) sc[j] = 1;   // (the safety car's block: 2 there, 4 its lamps on)
    for (let k = 0; k < n; k++) {
      if (k === pk) continue;
      const p = 1 + k * W, dx = f[p] - x, dz = f[p + 2] - z; if (dx * dx + dz * dz > 45 * 45) continue;
      const al = dx * TX[j] + dz * TZ[j], la = dx * NX[j] + dz * NZ[j];
      if ((f[p + 6] & 4) && Math.abs(S.d[j] + la) > T.wAt(T.idx(T.startS + S.s[j])) + 1) continue;   // (a car out of the race off the road, or in the pit lane: not in the way)
      if ((Math.abs(al) < RULES.side[0] && Math.abs(la) < RULES.side[1]) || (al > 0 && al < RULES.behind[0] && Math.abs(la) < RULES.behind[1])) { near[j] = 1; break; }
    }
  }
  const grow = (m) => { const out = new Uint8Array(NF); let last = -1e9; for (let j = 0; j < NF; j++) { if (m[j]) last = S.t[j]; if (S.t[j] - last <= RULES.margin) out[j] = 1; }
    last = 1e9; for (let j = NF - 1; j >= 0; j--) { if (m[j]) last = S.t[j]; if (last - S.t[j] <= RULES.margin) out[j] = 1; } return out; };
  const nearG = grow(near);
  for (let j = 0; j < NF; j++) S.ex[j] = nearG[j] ? 1 : sc[j] ? 2 : 0;   // (1 traffic, 2 the safety car; 3 the standing start, below)

  // the laps: from the player's lap times (Core's own count, as rpLap); an open road: its one run, from the start to the finish
  const P = H.cars[pk], lt = (P.lapTimes || []).slice(), laps = [];
  if (t.open) { if (P.fin && P.ft > 0) laps.push({ k: 1, t0: P.lap > 1 && P.lapStart > 0 && P.lapStart < P.ft ? P.lapStart : 0, t1: P.ft, time: P.ft }); }
  else { let st = P.lapStart || 0; for (let j = lt.length - 1; j >= 0; j--) { laps.unshift({ k: j + 1, t0: st - lt[j], t1: st, time: lt[j] }); st -= lt[j]; } }
  const run = { name, H, t, pk, car: { m: P.m, pf: P.pf || null, name: P.name }, laps: [], why: '', notes: [] };
  if (why) { run.why = why; return run; }
  if (!laps.length) { run.why = (t.open ? 'vožnja ni končana' : 'ni celega kroga') + ' (v posnetku ' + Math.round(F[NF - 1][0] - F[0][0]) + ' s dirke)'; return run; }
  if (!P.pf) run.notes.push('brez podatkov o nadgradnjah avta (starejši posnetek): tempo avtopilota za serijski avto');
  if (t.def.test) run.notes.push('testna proga');
  const quali = /kvalifikacije/.test(mode);
  const firstApex = (pace) => { // (the first corner of the autopilot's pace after the start line: the end of the standing start of lap 1)
    const st = 5; let hi = 0;
    for (let s = 0; s < len; s += st) { const v = along(t, pace.v, s); hi = Math.max(hi, v); if (hi - v >= RULES.apexDrop && along(t, pace.v, s + st) > v) return s; }
    return Math.min(500, len);
  };
  for (const L of laps) {
    const j0 = S.t.findIndex(x => x >= L.t0 - 0.06); let j1 = NF - 1; while (j1 > 0 && S.t[j1] > L.t1 + 0.06) j1--;
    const lap = Object.assign({}, L, { file: name });
    run.laps.push(lap);
    if (j0 < 0 || S.t[j0] > L.t0 + 0.25 || S.t[j1] < L.t1 - 0.25 || j1 - j0 < 20) { lap.skip = 'nepopoln krog (posnetek ga nima celega)'; continue; }
    const cond = condOf(H, L.t0, L.t1, tyres); lap.cond = cond;
    if (cond.skip) { lap.skip = cond.skip; continue; }
    // the lap's samples: s unwrapped across the start line (a circuit), from about 0 to its length
    const idx = []; for (let j = Math.max(0, j0 - 1); j <= Math.min(NF - 1, j1 + 1); j++) idx.push(j);
    const u = new Float64Array(idx.length);
    for (let m = 0; m < idx.length; m++) {
      const s = S.s[idx[m]];
      if (t.open) u[m] = s;
      else if (m === 0) u[m] = s > len / 2 ? s - len : s;
      else { let ds = s - S.s[idx[m - 1]]; if (ds > len / 2) ds -= len; else if (ds < -len / 2) ds += len; u[m] = u[m - 1] + ds; }
    }
    // the faults, each a reason for the whole lap (the first one, where)
    const inLap = (m) => S.t[idx[m]] >= L.t0 - 1e-6 && S.t[idx[m]] <= L.t1 + 1e-6;
    const runOf = (a, T0) => { let r = 0, tA = 0; for (let m = 1; m < idx.length; m++) { if (!inLap(m)) continue; if (a[idx[m]]) { if (!r) tA = S.t[idx[m - 1]]; r = 1; if (S.t[idx[m]] - tA >= T0) return m; } else r = 0; } return -1; };
    const faults = [
      ['vrnjen na cesto', (() => { for (let m = 0; m < idx.length; m++) if (inLap(m) && (S.b[idx[m]] & 2)) return m; return -1; })()],
      ['boksi', (() => { for (let m = 0; m < idx.length; m++) if (inLap(m) && (S.b[idx[m]] & 4) && S.t[idx[m]] < L.t1 - 0.1) return m; return -1; })()],
      ['vrtenje', runOf(S.spin, RULES.spinT)],
      ['vožnja nazaj', runOf(S.rev, RULES.revT)],
      ['zlet s ceste', runOf(S.off, RULES.offT)],
      ['trk', (() => { for (let m = 1; m < idx.length; m++) if (inLap(m) && S.hit[idx[m]]) return m; return -1; })()]
    ].filter(f => f[1] >= 0).sort((a, b) => a[1] - b[1]);
    if (faults.length) { const m = faults[0][1]; lap.skip = faults[0][0]; lap.s = Math.round(clamp(u[m], 0, len)); lap.tf = r2(S.t[idx[m]]); continue; }
    // the samples left out: traffic, the safety car; the standing start of a race's first lap (a circuit, not a qualifying lap: up to the first corner)
    const pace = paceOf(C, t, run.car, cond, paces), sA = !t.open && L.k === 1 && !quali ? firstApex(pace) : -1;
    const ex = new Uint8Array(idx.length); for (let m = 0; m < idx.length; m++) ex[m] = S.ex[idx[m]] || (sA > 0 && u[m] < sA ? 3 : 0);
    Object.assign(lap, { idx, u, ex, pace, S, startTo: sA });
  }
  return run;
}

/* ---------------- a lap on the grid of s: its values at 0, korak, 2 korak ... between the samples either side (null: left out there) ---------------- */
function lapGrid(lap, len, step) {
  const { idx, u, ex, S } = lap, ns = Math.floor((len - 1e-6) / step) + 1;
  const g = { d: new Array(ns).fill(null), v: new Array(ns).fill(null), a: new Array(ns).fill(null), b: new Array(ns).fill(null), out: { promet: 0, 'varnostni avto': 0, start: 0 } };
  let m = 0;
  for (let i = 0; i < ns; i++) {
    const s = i * step;
    while (m < u.length - 2 && u[m + 1] < s) m++;
    if (!(u[m] <= s && u[m + 1] >= s)) continue;   // (not covered: before the lap's first sample or past its last)
    const ja = idx[m], jb = idx[m + 1], w = u[m + 1] > u[m] ? (s - u[m]) / (u[m + 1] - u[m]) : 0;
    const e = ex[m] || ex[m + 1]; if (e) { g.out[e === 1 ? 'promet' : e === 2 ? 'varnostni avto' : 'start'] += step; continue; }
    g.d[i] = S.d[ja] + (S.d[jb] - S.d[ja]) * w; g.v[i] = S.v[ja] + (S.v[jb] - S.v[ja]) * w;
    const pa = idx[Math.max(0, m - 1)], pb = idx[Math.min(idx.length - 1, m + 2)];   // (the acceleration over four sample gaps)
    g.a[i] = S.t[pb] > S.t[pa] ? (S.v[pb] - S.v[pa]) / (S.t[pb] - S.t[pa]) : 0;
    g.b[i] = (S.b[ja] | S.b[jb]) & 1;
  }
  return g;
}

/* ---------------- the corners: the minima of the mean speed, then each lap's braking into each (from its samples, not the grid) ---------------- */
function cornersOf(t, vbar, step) {
  const ns = vbar.length, open = t.open, at = (i) => open ? vbar[clamp(i, 0, ns - 1)] : vbar[((i % ns) + ns) % ns];
  const sm = vbar.map((_, i) => { let a = 0, c = 0; for (let k = -2; k <= 2; k++) { const v = at(i + k); if (v != null) { a += v; c++; } } return c ? a / c : null; });
  const sAt = (i) => open ? sm[clamp(i, 0, ns - 1)] : sm[((i % ns) + ns) % ns];
  const W = Math.round(RULES.apexWin / step), B = Math.round(RULES.brakeWin / step), out = [];
  for (let i = 0; i < ns; i++) {
    const v = sm[i]; if (v == null) continue;
    let ok = true; for (let k = -W; k <= W && ok; k++) { if (!k || (open && (i + k < 0 || i + k >= ns))) continue; const w = sAt(i + k); if (w != null && (w < v || (w === v && k < 0))) ok = false; }
    if (!ok) continue;
    let hi = v; for (let k = 1; k <= B; k++) { if (open && i - k < 0) break; const w = sAt(i - k); if (w != null) hi = Math.max(hi, w); }
    if (hi - v >= RULES.apexDrop) out.push({ i, s: i * step });
  }
  return out;
}
function brakingInto(lap, sApex, sPrev) {
  const { idx, u, ex, S } = lap, lo = Math.max(sApex - RULES.brakeWin, sPrev);
  // the lap's slowest sample near the apex (±40 m), then back from it: the last braking before it and where that braking started
  let mMin = -1; for (let m = 0; m < u.length; m++) if (u[m] >= sApex - 40 && u[m] <= sApex + 40 && (mMin < 0 || S.v[idx[m]] < S.v[idx[mMin]])) mMin = m;
  if (mMin < 0) return null;
  const vMin = S.v[idx[mMin]], sMin = u[mMin];
  for (let m = 0; m < u.length; m++) if (u[m] >= lo && u[m] <= sApex + 40 && ex[m]) return { vMin, sMin, out: true };   // (traffic, the safety car or the start there: not this corner)
  let e = -1; for (let m = mMin; m >= 0 && u[m] >= lo; m--) if (S.b[idx[m]] & 1) { e = m; break; }
  if (e < 0) return { vMin, sMin, brake: null };   // (only off the throttle)
  let b = e, gapT = 0;
  for (let m = e - 1; m >= 0 && u[m] >= lo; m--) { if (S.b[idx[m]] & 1) { b = m; gapT = 0; } else { gapT = S.t[idx[b]] - S.t[idx[m]]; if (gapT > RULES.brakeGap) break; } }
  const vB = S.v[idx[b]], vE = S.v[idx[e]], dist = Math.max(1, u[e] - u[b]);
  return { vMin, sMin, brake: { s: u[b], sE: u[e], vB, vE, dec: Math.max(0, (vB * vB - vE * vE) / (2 * dist)) } };
}

/* ---------------- a profile: the laps of one track in one weather together ---------------- */
function profileOf(key, laps, step) {
  const t = laps[0].run.t, T = t.T, len = t.len, ns = Math.floor((len - 1e-6) / step) + 1, used = laps.filter(L => !L.skip);
  const cars = new Map(); for (const L of used) { const m = L.run.car.m; cars.set(m, (cars.get(m) || []).concat([L])); }
  const main = [...cars.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  const grids = used.map(L => Object.assign(lapGrid(L, len, step), { L }));
  const P = { proga: t.def.id, ime: t.def.name, odprta: t.open, dolzina: Math.round(len), vreme: key, korak: step, avto: main ? main[0] : null,
    s: [], n: [], d: [], d_sd: [], v: [], v_sd: [], vq: [], vq_sd: [], a: [], zav: [], rl: [], vref: [] };
  const pace0 = main ? main[1][0].pace : null;
  for (let i = 0; i < ns; i++) {
    const s = i * step, ds = [], vs = [], qs = [], as = [], bs = [], vm = [];
    for (const g of grids) { if (g.d[i] == null) continue; const vr = along(t, g.L.pace.v, s); ds.push(g.d[i]); vs.push(g.v[i]); qs.push(vr > 0.5 ? g.v[i] / vr : NaN); as.push(g.a[i]); bs.push(g.b[i]); if (main && g.L.run.car.m === main[0]) vm.push(g.v[i]); }
    const D = robust(ds, SCALE.d), V = robust(vm, SCALE.v), Q = robust(qs.filter(Number.isFinite), SCALE.q);
    P.s.push(s); P.n.push(ds.length); P.d.push(D ? r2(D.m) : null); P.d_sd.push(D ? r2(D.sd) : null); P.v.push(V ? r2(V.m) : null); P.v_sd.push(V ? r2(V.sd) : null);
    P.vq.push(Q ? r3(Math.min(2, Q.m)) : null); P.vq_sd.push(Q ? r3(Q.sd) : null); P.a.push(as.length ? r2(mean(as)) : null); P.zav.push(bs.length ? r2(mean(bs)) : null);
    P.rl.push(r2(along(t, T.rl, s))); P.vref.push(pace0 ? r2(along(t, pace0.v, s)) : null);
  }
  // the corners (on the mean speed of the main car, or of all laps), each lap's braking into them
  const vbar = P.v.map((v, i) => v != null ? v : null), cs = main ? cornersOf(t, vbar, step) : [];
  // (the track's corner names, T.names: each to its nearest corner within 80 m)
  const gap = (a, b) => { const d = Math.abs(a - b); return t.open ? d : Math.min(d, len - d); }, nameOf = new Map();
  for (const q of T.names || []) { let best = -1; for (let j = 0; j < cs.length; j++) if (gap(cs[j].s, q.d) < 80 && (best < 0 || gap(cs[j].s, q.d) < gap(cs[best].s, q.d))) best = j;
    if (best >= 0 && (!nameOf.has(best) || gap(cs[best].s, q.d) < nameOf.get(best).g)) nameOf.set(best, { n: q.n, g: gap(cs[best].s, q.d) }); }
  const nameAt = (j) => nameOf.has(j) ? nameOf.get(j).n : null;
  P.ovinki = cs.map((c, j) => {
    const prev = j > 0 ? cs[j - 1].s : t.open ? 0 : cs[cs.length - 1].s - len, R = [];
    for (const L of used) { const r = brakingInto(L, c.s, prev); if (r && !r.out) R.push({ r, L }); }
    const br = R.filter(x => x.r.brake), vr = (x, s) => along(t, x.L.pace.v, s), aref = new Map();
    const refDec = (x) => { const k = x.L.pace; if (!aref.has(k)) aref.set(k, brakingOf(T, k.v)); const A = aref.get(k), b = x.r.brake, v = [];
      for (let s = b.s; s <= Math.max(b.sE, b.s + 2); s += 2) { const a = along(t, A, s); if (a > 0.5) v.push(a); } return v.length ? median(v) : null; };
    const st = (arr, s0) => { const R2 = robust(arr.filter(Number.isFinite), s0); return R2 ? { m: R2.m, sd: R2.sd, n: R2.n } : null; };
    const vmin = st(R.map(x => x.r.vMin), SCALE.v), vq = st(R.map(x => x.r.vMin / Math.max(0.5, vr(x, x.r.sMin))), SCALE.q);
    const bS = st(br.map(x => x.r.brake.s), SCALE.s), bBefore = st(br.map(x => c.s - x.r.brake.s), SCALE.s), vB = st(br.map(x => x.r.brake.vB), SCALE.v), dc = st(br.map(x => x.r.brake.dec), SCALE.dec), dq = st(br.map(x => { const a = refDec(x); return a ? x.r.brake.dec / a : NaN; }), SCALE.q * 5);
    return { s: c.s, ime: nameAt(j), krogov: R.length, zavira: br.length, v_vrh: vmin ? r2(vmin.m) : null, v_vrh_sd: vmin ? r2(vmin.sd) : null, vq_vrh: vq ? r3(vq.m) : null,
      zav_s: bS ? Math.round(bS.m) : null, zav_pred: bBefore ? r2(bBefore.m) : null, zav_pred_sd: bBefore ? r2(bBefore.sd) : null, v_zav: vB ? r2(vB.m) : null,
      pojemek: dc ? r2(dc.m) : null, pojemek_sd: dc ? r2(dc.sd) : null, pojemek_q: dq ? r3(dq.m) : null };
  });
  // the laps, the cars, the accuracy
  const lapRow = (L, g) => Object.assign({ datoteka: L.file, krog: L.k, cas: r3(L.time), avto: L.run.car.m }, g ? { delez: r3(g.d.filter(x => x != null).length / ns), izpusceno_m: Object.fromEntries(Object.entries(g.out).filter(e => e[1] > 0)) } : {});
  P.krogi = { uporabljeni: grids.map(g => lapRow(g.L, g)), izpusceni: laps.filter(L => L.skip).map(L => Object.assign(lapRow(L), { razlog: L.skip }, L.s != null ? { s: L.s, t: L.tf } : {})) };
  P.avti = Object.fromEntries([...cars.entries()].map(([m, Ls]) => { const ts = Ls.map(L => L.time); const M = mean(ts); return [m, { krogov: Ls.length, cas: r3(M), cas_sd: r3(sdev(ts, M)), cas_med: r3(median(ts)), najboljsi: r3(Math.min(...ts)), serijski: Ls.every(L => !L.run.car.pf) }]; }));
  const kept = P.n.map((n, i) => i).filter(i => P.n[i] >= 2), cnt = used.length, E = RULES.enough[t.open ? 'cesta' : 'krog'];
  P.natancnost = { krogov: cnt, ocena: cnt < E[0] ? 'premalo' : cnt < E[1] ? 'najmanj' : t.open || cnt < E[2] ? 'dobro' : 'najbolje',
    d_se: kept.length ? r3(mean(kept.map(i => P.d_sd[i] / Math.sqrt(P.n[i])))) : null, v_se: kept.length ? r3(mean(kept.filter(i => P.v_sd[i] != null).map(i => P.v_sd[i] / Math.sqrt(P.n[i])))) : null,
    d_sd: kept.length ? r3(mean(kept.map(i => P.d_sd[i]))) : null, v_sd: kept.length ? r3(mean(kept.filter(i => P.v_sd[i] != null).map(i => P.v_sd[i]))) : null,
    pokritost: r3(P.n.filter(n => n >= Math.min(3, Math.max(1, cnt))).length / ns) };
  P.opombe = [...new Set(laps.flatMap(L => L.run.notes))];
  return P;
}

/* ---------------- the summary: for the chat, in Slovenian ---------------- */
function summaryOf(P, fileCount) {
  const N = P.natancnost, E = RULES.enough[P.odprta ? 'cesta' : 'krog'], u = P.krogi.uporabljeni, x = P.krogi.izpusceni, w = (n, a, b, c) => n === 1 ? a : n === 2 ? b : c;
  const L = [`${P.ime} (${P.proga}) · ${P.vreme} · ${fileCount} ${w(fileCount, 'posnetek', 'posnetka', 'posnetkov')}`];
  L.push(`  ${P.odprta ? 'vožnje' : 'krogi'}: ${u.length + x.length}, uporabljenih ${u.length}, izpuščenih ${x.length} · čistih ${N.krogov}: ${N.ocena}` +
    (P.odprta ? ` (potrebne so ${E[0]}–${E[1]} vožnje)` : ` (najmanj ${E[0]}, dobro ${E[1]}, najbolje ${E[2]}–10; več kot 10 skoraj nič ne izboljša)`));
  const out = (r) => { const o = Object.entries(r.izpusceno_m || {}).map(([k, m]) => `${m} m ${k === 'promet' ? 'ob drugih avtih' : k === 'start' ? 'štarta' : 'za varnostnim avtom'}`); return o.length ? '; brez ' + o.join(', ') : ''; };
  for (const r of u) L.push(`    ✓ ${r.datoteka} ${P.odprta ? 'vožnja' : 'K' + r.krog} ${clock(r.cas)} ${r.avto} (${Math.round(r.delez * 100)} % proge${out(r)})`);
  for (const r of x) L.push(`    ✗ ${r.datoteka} ${P.odprta ? 'vožnja' : 'K' + r.krog} ${clock(r.cas)} ${r.avto}: ${r.razlog}${r.s != null ? ' pri ' + r.s + ' m' : ''}`);
  if (!u.length) return L.join('\n');
  L.push(`  natančnost povprečja: linija ±${dec(N.d_se, 2)} m, hitrost ±${dec(N.v_se * 3.6, 1)} km/h; raztros med krogi: linija ${dec(N.d_sd, 2)} m, hitrost ${dec(N.v_sd * 3.6, 1)} km/h; ${Math.round(N.pokritost * 100)} % proge iz vsaj ${Math.min(3, N.krogov)} ${w(Math.min(3, N.krogov), 'kroga', 'krogov', 'krogov')}`);
  const off = P.d.map((d, i) => d != null && P.rl[i] != null ? d - P.rl[i] : null), ok = off.filter(v => v != null);
  if (ok.length) { let im = 0; off.forEach((v, i) => { if (v != null && Math.abs(v) > Math.abs(off[im] || 0)) im = i; }); const m = mean(ok);
    L.push(`  linija: povprečno ${dec(Math.abs(m), 2)} m ${m >= 0 ? 'desno' : 'levo'} od idealne linije igre, povprečni odmik ${dec(mean(ok.map(Math.abs)), 2)} m, največji ${dec(Math.abs(off[im]), 1)} m ${off[im] >= 0 ? 'desno' : 'levo'} pri ${P.s[im]} m`); }
  for (const [m, a] of Object.entries(P.avti)) L.push(`  ${m}: ${a.krogov} ${w(a.krogov, 'krog', 'kroga', 'krogov')}, povprečno ${clock(a.cas)} (±${dec(a.cas_sd, 2)} s), najboljši ${clock(a.najboljsi)}${a.serijski ? ', serijski avto' : ''}`);
  const cq = P.ovinki.map(c => c.vq_vrh).filter(v => v != null);
  if (cq.length) L.push(`  hitrost v vrhovih ovinkov: povprečno ${dec(mean(cq), 2)} tempa avtopilota (${dec(Math.min(...cq), 2)}–${dec(Math.max(...cq), 2)})`);
  if (P.ovinki.length) L.push(`  ovinki (${P.ovinki.length}): kje začne zavirati, pri kateri hitrosti, pojemek, hitrost v vrhu`);
  for (const c of P.ovinki) L.push(`    ${c.ime || 'ovinek'} · ${c.s} m: ` + (c.zavira ? `zavira ${dec(c.zav_pred, 0)} m prej (±${dec(c.zav_pred_sd, 0)} m) pri ${kmh(c.v_zav)} km/h, ${dec(c.pojemek, 1)} m/s² (${dec(c.pojemek_q, 2)} avtopilota)` : 'samo s plina') +
    `, v vrhu ${kmh(c.v_vrh)} km/h (±${dec(c.v_vrh_sd * 3.6, 1)}; ${dec(c.vq_vrh, 2)} tempa avtopilota)` + (c.zavira && c.zavira < c.krogov ? `; zavira ${c.zavira} od ${c.krogov} krogov` : '') + (c.krogov < N.krogov ? ` · ${c.krogov} ${w(c.krogov, 'krog', 'kroga', 'krogov')}` : ''));
  for (const o of P.opombe) L.push('  opomba: ' + o);
  return L.join('\n');
}

/* ---------------- the tool ---------------- */
export function measure(files, opts = {}) {
  const step = opts.korak || 5, C = opts.core || loadCore(), N = opts.napake || napake(), tc = new Map(), paces = new Map(), runs = [];
  for (const f of files) runs.push(scanFile(C, N, f, tc, paces));
  const groups = new Map();
  for (const r of runs) for (const L of r.laps || []) { L.run = r; const key = r.t.def.id + '|' + (L.cond && L.cond.key ? L.cond.key : (r.H.rain > 0 ? 'mokro' : 'suho') + (r.H.season === 'winter' ? '·zima' : '')); groups.set(key, (groups.get(key) || []).concat([L])); }
  const profiles = [], text = [];
  for (const [key, laps] of groups) {
    const P = profileOf(key.split('|')[1], laps, step), fc = new Set(laps.map(L => L.file)).size;
    profiles.push(P); text.push(summaryOf(P, fc));
  }
  const bad = runs.filter(r => r.why);
  if (bad.length) text.push('izpuščeni posnetki:\n' + bad.map(r => `  ✗ ${r.name}: ${r.why}`).join('\n'));
  if (!runs.some(r => (r.laps || []).length)) text.push('v posnetkih ni nobenega celega kroga');
  return { profil: { orodje: 'tools/voznja.mjs', verzija: VER, narejeno: new Date().toISOString(), pravila: RULES, datoteke: runs.map(r => r.name), proge: profiles }, text: text.join('\n\n') };
}

if (import.meta.url === url.pathToFileURL(process.argv[1] || '').href) {
  const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const outArg = flag('--out'), korak = flag('--korak'), files = args.filter(a => !a.startsWith('--')), bad = args.filter(a => a.startsWith('--'));
  if (!files.length || bad.length || (korak != null && !(+korak >= 1 && +korak <= 50))) {
    console.log('usage: node tools/voznja.mjs <posnetek.rrp> [...] [--out <profil.json>|<mapa>] [--korak <m>]' + (bad.length ? '\nunknown: ' + bad.join(' ') : ''));
    process.exit(2);
  }
  const miss = files.filter(f => !fs.existsSync(f)); if (miss.length) { console.log('no such file: ' + miss.join(', ')); process.exit(2); }
  const json = outArg && /\.json$/i.test(outArg) ? path.resolve(outArg) : path.join(path.resolve(outArg || path.join(REPO, 'test-results', 'voznja')), 'profil.json');
  fs.mkdirSync(path.dirname(json), { recursive: true });
  const r = measure(files.map(f => path.resolve(f)), { korak: korak ? +korak : 5 });
  const sumFile = path.basename(json) === 'profil.json' ? path.join(path.dirname(json), 'povzetek.txt') : json.replace(/\.json$/i, '.txt');
  fs.writeFileSync(json, JSON.stringify(r.profil)); fs.writeFileSync(sumFile, r.text + '\n');
  const rel = (f) => { const p = path.relative(process.cwd(), f); return p.startsWith('..') ? f : p; };
  console.log(r.text + '\n\n→ ' + rel(json) + ', ' + rel(sumFile));
  process.exit(r.profil.proge.some(p => p.krogi.uporabljeni.length) ? 0 : 1);
}
