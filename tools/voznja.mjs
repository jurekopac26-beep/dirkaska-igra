// The player's driving measured from the recordings of their races (posnetek_<proga>_<LLLLMMDD-UUMM>.rrp, js/napake.js; the plan:
// docs/ai-po-tvoji-liniji.md, korak 1), for the AI to drive like them later (korak 2). For every track and weather (suho, mokro; ·zima on a
// winter's road) every --korak metres along the track (s, from the start line; default 5): the average line (d, the offset from the road's
// centre, + to the right) with its spread over the laps, the speed v(s) with its spread, the same speed as a share vq of the autopilot's pace
// of that car there (Core.aiControl: the race's speed profile, the corners' limit and the braking before them; what carries over to another
// car), the acceleration and the share of laps braking; for every corner where the braking starts (metres before its apex), how hard (m/s²,
// and as a share of the autopilot's braking there) and the speed at the apex. Only clean laps count: a spin, a trip off the road, a hit, a
// rescue, the pits or a changing weather leave the lap out (why: in the summary); a lap's parts beside another car or right behind one (and a
// second either side), under the safety car or on the standing start of the first lap are left out of it. The game's own code reads the file
// (Napake.rrp.unpack) and finds the car on the track (Core.Track.query: s and d; tests/lib/core.js). A file of Najboljše vožnje
// (najboljse_<proga>_<LLLLMMDD-UUMM>.rrp, js/najboljse.js: a track's best runs, one recording after another) is read recording by
// recording, each as a file of its own (<file> #1, #2 …); a file of one recording as ever.
//   node tools/voznja.mjs posnetek_bathurst_20261105-1432.rrp posnetek_bathurst_20261105-1510.rrp
//   node tools/voznja.mjs mapa/*.rrp --out profil.json [--korak 5]
//   node tools/voznja.mjs mapa/*.rrp --js js/data/voznja.js [--k0 0.95] [--ks 1.4]   (the game's data: the profiles and the style, Korak 2 and 3)
//   node tools/voznja.mjs --slog js/data/voznja.js [--previdno 0.3]   (the style anew from the file's own profiles, slogOf; no recordings)
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
const { DT, seeded } = require('../tests/lib/sim.js');
const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const VER = 1;   // (the profile's own format: profil.json's verzija)

// the measuring rules (docs/ai-po-tvoji-liniji.md, Pravila meritve)
export const RULES = {
  spinDeg: 75, spinV: 5, spinT: 0.15,   // a spin: the nose more than 75° off the road's direction and off the car's own travel above 5 m/s, for 0.15 s (a clean lap's slide: under 30°; a hairpin taken sideways: up to ~60° off its travel)
  revV: 1, revT: 0.3,                   // ... or backwards (along the road) faster than 1 m/s for 0.3 s
  offM: 1, offLong: 3,                  // off the road: the car's middle 1 m past the asphalt's edge (and its kerb), all four wheels off, for 3 s or more: the lap left out; a shorter trip (a corner cut over the verge, a wide exit onto it) is the player's driving and kept (tr: the AI goes over there too)
  hitA: 50,                             // a hit (the barrier, a car): more than 50 m/s² of speed lost between two samples, over the ground and the car's own (into a wall: 100-150; the brakes up to ~16, a car sliding sideways in a spin ~30)
  side: [7, 5], behind: [22, 3],        // traffic: another car within 7 m along and 5 m across (beside it), or 0-22 m ahead within 3 m across
  margin: 1,                            // ... and 1 s before and after (the run up to a pass, pulling away)
  wetIn: 40, dryIn: 240,                // a changing weather: the road as wet as the rain 40 s after the rain has its new value, dry 240 s after it stops (less rain: 240 s per unit; Race._weather)
  apexDrop: 3, apexWin: 60,             // a corner: a minimum of the mean speed within 60 m either side, at least 3 m/s under the speed before it
  brakeWin: 500, brakeGap: 0.4,         // its braking: within 500 m before the apex; the brake let off for up to 0.4 s is still one braking
  grassIn: 0.6,                         // over the verge (tr): the car's middle within 0.6 m of the asphalt's edge or past it, its outer wheels off
  trMin: 0.4,                           // ... for the AI (the game's data): only where 40 % of the laps or more went over it (a deliberate cut, not one lap's run wide)
  plA: 0.6, plV: 2, plZ: 0.2,             // on the throttle (pl): accelerating at 60 % of the car's full throttle (fullAcc), or no more than 2 m/s under the autopilot where it is on full throttle; braking on fewer than 20 % of the laps
  kgV: 5, kg: [0.9, 1.3],                // the pace over the ground (kg): from 5 m/s up, within 0.9-1.3 of the car's own (Korak 2)
  qMin: [20, 15],                       // against the autopilot's own braking (autoOf): where it starts 20 m or more before the apex; the deceleration where both brake over 15 m or more
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
// every recording of a file: one (posnetek_…rrp) or several one after another (najboljse_<proga>_….rrp, js/najboljse.js: each recording's
// length off + 4·L·NF, js/napake.js rrpUnpack); a later recording that cannot be read: its error in its place, and the file's end
export function readRrpAll(N, file) {
  let u = new Uint8Array(fs.readFileSync(file));
  if (u[0] === 0x1f && u[1] === 0x8b) { try { u = new Uint8Array(zlib.gunzipSync(u)); } catch (_) { throw new Error('posnetek je poškodovan'); } }
  const out = [], mag = (at) => u[at] === 0x52 && u[at + 1] === 0x52 && u[at + 2] === 0x50 && u[at + 3] === 0x31;   // ('RRP1')
  let at = 0;
  do {
    try {
      const rec = N.rrp.unpack(at ? u.subarray(at) : u), hl = new DataView(u.buffer, u.byteOffset + at, 8).getUint32(4, true);
      out.push(rec); at += ((8 + hl + 3) & ~3) + 4 * rec.H.L * rec.H.NF;
    } catch (e) { if (!at) throw e; out.push(new Error((e && e.message) || String(e))); break; }   // (an Error of this realm: js/napake.js runs in a vm)
  } while (at + 8 <= u.length && mag(at));
  return out;
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
/* ---------------- the autopilot's own lap in that car and weather (the reference for the braking and the lap time): a race of its own in
   Core, the car alone on the autopilot (Core.aiControl: the game's autopilot, the AI's driving), the race's random numbers seeded as the
   tests do (tests/lib/sim.js); its second lap (a flying one; an open road: its run up to the finish) ---------------- */
function autoOf(C, t, car, cond, cache) {
  const pf = car.pf || {}, key = 'ap|' + [car.m, JSON.stringify(pf), cond.rain, cond.winter ? 1 : 0, cond.tyres ? 1 : 0].join('|');
  if (cache.has(key)) return cache.get(key);
  const M = C.MODELS.find(m => m.id === car.m) || C.MODELS[0], FM = pf.fm ? C.MODELS.find(m => m.id === pf.fm) : null, T = t.T, len = t.len, orig = Math.random;
  let out = null;
  try {
    Math.random = seeded(7);
    const race = new C.Race(T, { numAI: 0, playerModel: M, fieldModel: FM || undefined, playerUpg: pf.upg || undefined, playerSetup: pf.setup || undefined, playerDeli: pf.deli || undefined,
      laps: t.open ? 1 : 2, rain: cond.rain, winter: cond.winter, tyres: cond.tyres, assist: pf.as != null ? pf.as : 2, seed: 7, damage: 0 });
    race.start();
    const P = race.player, S = { t: [], s: [], d: [], v: [], b: [], th: [], g: [] }, kMax = Math.ceil(((t.open ? 1 : 2) * len / 8 + 120) / DT);
    let next = 0;
    for (let k = 1; k <= kMax && !P.finished; k++) {
      Math.random = seeded(1000 + k);
      C.aiControl(P, race, DT);
      if (P.stuckT > 3 || P.wrongT > 3) race.rescue(P);
      race.step(DT);
      if ((race.state === 'racing' || race.state === 'done') && race.time >= next) {
        next = race.time + 0.05; const q = P.q;
        S.t.push(race.time); S.s.push(t.open ? q.s - T.startS : ((q.s - T.startS) % T.len + T.len) % T.len); S.v.push(P.vl || 0); S.b.push(P.inBrk > 0.08 && P.vl > 0.5 ? 1 : 0); S.d.push(q.d); S.th.push(P.inThr || 0); S.g.push(Math.hypot(P.vx, P.vz));
      }
    }
    if (P.finished) {
      const lt = P.lapTimes || [], t1 = P.finishTime, t0 = t.open ? 0 : t1 - lt[lt.length - 1], idx = [];
      for (let j = 0; j < S.t.length; j++) if (S.t[j] >= t0 - 0.06 && S.t[j] <= t1 + 0.06) idx.push(j);
      const u = new Float64Array(idx.length);
      for (let m = 0; m < idx.length; m++) { const v = S.s[idx[m]]; if (t.open || m === 0) u[m] = t.open ? v : v > len / 2 ? v - len : v; else { let d = v - S.s[idx[m - 1]]; if (d > len / 2) d -= len; else if (d < -len / 2) d += len; u[m] = u[m - 1] + d; } }
      out = { time: t.open ? t1 : lt[lt.length - 1], time1: t.open ? t1 : lt[0], lap: { idx, u, ex: new Uint8Array(idx.length), S }, cor: new Map() };
    }
  } finally { Math.random = orig; }
  cache.set(key, out); return out;
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

// a car as the profile tells them apart: its model, and its upgrades (motor, gume, zavore, aero levels), a set-up other than the standard
// one (krilo, prestave), garage parts, another field's car (kaze, kaze+m3g2z3a3, kaze/k0p2, kaze+deli): the speeds of one car only together
function carKey(m, pf) {
  const U = pf && pf.upg, S = pf && pf.setup, lv = (k) => (U && +U[k]) || 0;
  let k = String(m);
  if (U && ['motor', 'gume', 'zavore', 'aero'].some(x => lv(x) > 0)) k += '+m' + lv('motor') + 'g' + lv('gume') + 'z' + lv('zavore') + 'a' + lv('aero');
  if (S && ((S.wing != null && +S.wing !== 1) || (S.gear != null && +S.gear !== 1))) k += '/k' + (S.wing != null ? +S.wing : 1) + 'p' + (S.gear != null ? +S.gear : 1);
  if (pf && pf.deli && Object.keys(pf.deli).length) k += '+deli';
  if (pf && pf.fm && pf.fm !== m) k += '@' + pf.fm;
  if (pf && pf.as != null && +pf.as !== 2) k += '+as' + pf.as;   // (the assist, Core.ASSISTS: not the game's default, 2; its brakes and grip differ)
  return k;
}
// a car's class: the cars a race gives it as rivals (Core's own choice, aiModel: the field of the player's vehicle or of the championship's car,
// pf.fm; a one-make car, the formula: its own kind; without a field the four road cars). One profile per class: its cars alike, so the share
// of their own pace (vq) carries over between them in step 2. A car that is not one of its rivals (the truck, the rally car among the road
// cars): a profile of its own in that class (v_razredu false: its speed does not carry over to them)
function classOf(C, car) {
  const M = C.MODELS.find(m => m.id === car.m), FM = car.pf && car.pf.fm ? C.MODELS.find(m => m.id === car.pf.fm) : null;
  if (!M) return [String(car.m)];
  if (M.oneMake) return [M.id];
  const pm = FM || M, n = C.fieldSize ? C.fieldSize(pm, 12) : 12, ids = new Set();
  for (let k = 0; k < n; k++) { const A = C.aiModel(k, pm, n); if (A) ids.add(A.id); }
  return ids.size ? [...ids].sort() : [M.id];
}

/* ---------------- one recording: the player's car in every sample on the track, its laps, each lap checked and its parts left out ---------------- */
function scanFile(C, N, file, tc, paces, one) {   // (one: a recording of a file of several, { rec, name }: readRrpAll)
  const name = one ? one.name : path.basename(file);
  let rec;
  try { if (one && one.rec instanceof Error) throw one.rec; rec = one ? one.rec : readRrp(N, file); } catch (e) { return { name, why: 'posnetka ni mogoče prebrati: ' + (e && e.message || e) }; }
  const { H, frames: F } = rec, t = trackOf(C, tc, H.track);
  if (!t) return { name, why: 'proge ' + H.track + ' ta različica igre nima' };
  const pk = H.cars.findIndex(c => c.pl);
  if (pk < 0) return { name, why: 'v posnetku ni igralca' };
  if (!(H.w >= 7)) return { name, why: 'posnetek je iz starejše različice igre (' + H.w + ' števil na avto)' };
  const mode = String(H.mode || 'race'), why = /sola/.test(mode) ? 'šola vožnje' : /^police/.test(mode) ? 'policijski pregon' : /^traffic/.test(mode) ? 'vožnja s prometom (promet ni v posnetku)' : '';
  const T = t.T, W = H.w, n = H.n, o = 1 + pk * W, NF = F.length, len = t.len;
  const tyres = H.ty != null ? !!H.ty : !H.tt && !!t.def.pit;   // (the race with tyres: the header's ty, js/game.js rrpOf; older recordings as the game sets it)
  // the player's car in every sample: s (from the start line), d, the road's way, its speed, its bits; the faults sample by sample
  const S = { t: new Float64Array(NF), s: new Float64Array(NF), d: new Float32Array(NF), v: new Float32Array(NF), g: new Float32Array(NF), b: new Uint8Array(NF), ex: new Uint8Array(NF),
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
        const hx = Math.cos(h), hz = Math.sin(h), slip = sp > 1e-3 ? Math.atan2(Math.abs(hx * dz - hz * dx), hx * dx + hz * dz) : 0;   // (the nose against the direction it travels over the ground: a hairpin taken sideways, across the road, is no spin)
        if (sp > RULES.spinV && Math.atan2(Math.abs(cr), dot) > RULES.spinDeg * Math.PI / 180 && slip > RULES.spinDeg * Math.PI / 180) S.spin[j] = 1;
        if (fw < -RULES.revV) S.rev[j] = 1;
        // (a hit: the speed over the ground and the car's own both drop at once; in a spin only the car's own does, it slides on sideways)
        if (j > 1 && SP[j - 1] >= 0) { const tm = (S.t[j] - S.t[j - 2]) / 2; if (tm > 1e-4 && Math.min(S.v[j - 1] - S.v[j], SP[j - 1] - sp) / tm > RULES.hitA) S.hit[j] = 1; }
        SP[j] = sp;
      }
    }
  }
  // the speed over the ground (S.g): from the positions of the samples either side (the recorded speed is the car's own, along its nose:
  // lower than over the ground when it slides, in a hairpin taken sideways the most; the pace the AI is given is the one over the ground)
  for (let j = 0; j < NF; j++) {
    const a = F[Math.max(0, j - 1)], b = F[Math.min(NF - 1, j + 1)], dt = b[0] - a[0];
    S.g[j] = dt > 1e-4 ? Math.hypot(b[o] - a[o], b[o + 2] - a[o + 2]) / dt : Math.abs(S.v[j]);
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
  const run = { name, H, t, pk, car: { m: P.m, pf: P.pf || null, name: P.name, key: carKey(P.m, P.pf) }, laps: [], why: '', notes: [] };
  run.cls = classOf(C, run.car);
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
      ['zlet s ceste', runOf(S.off, RULES.offLong)],
      ['trk', (() => { for (let m = 1; m < idx.length; m++) if (inLap(m) && S.hit[idx[m]]) return m; return -1; })()]
    ].filter(f => f[1] >= 0).sort((a, b) => a[1] - b[1]);
    if (faults.length) { const m = faults[0][1]; lap.skip = faults[0][0]; lap.s = Math.round(clamp(u[m], 0, len)); lap.tf = r2(S.t[idx[m]]); continue; }
    // the samples left out: traffic, the safety car; the standing start of a race's first lap (a circuit, not a qualifying lap; an open
    // road: its run from the line, the player there from rest, the AI's cars already moving from the grid behind it), up to the first corner
    const pace = paceOf(C, t, run.car, cond, paces), sA = (t.open || L.k === 1) && !quali ? firstApex(pace) : -1;
    const ex = new Uint8Array(idx.length); for (let m = 0; m < idx.length; m++) ex[m] = S.ex[idx[m]] || (sA > 0 && u[m] < sA ? 3 : 0);
    Object.assign(lap, { idx, u, ex, pace, S, startTo: sA, auto: autoOf(C, t, run.car, cond, paces) });
  }
  return run;
}

/* ---------------- a lap on the grid of s: its values at 0, korak, 2 korak ... between the samples either side (null: left out there) ---------------- */
// a moving mean over ±w points (nulls left out; a circuit round past its start)
function smoothN(A, w, open) {
  const n = A.length, out = new Array(n).fill(null);
  for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let k = -w; k <= w; k++) { let j = i + k; if (open) { if (j < 0 || j >= n) continue; } else j = (j + n) % n; if (A[j] != null) { s += A[j]; c++; } } if (c) out[i] = s / c; }
  return out;
}
// the car's acceleration on full throttle by speed (the autopilot's samples on full throttle, not braking: the most in each 2 m/s, then
// never more at a higher speed; a speed it never reached: the nearest one's)
function fullAcc(S) {
  const B = [];
  for (let j = 1; j < S.t.length - 1; j++) {
    if (!(S.th[j - 1] >= 0.99 && S.th[j] >= 0.99 && S.th[j + 1] >= 0.99) || S.b[j - 1] || S.b[j] || S.b[j + 1] || !(S.t[j + 1] > S.t[j - 1])) continue;
    const a = (S.v[j + 1] - S.v[j - 1]) / (S.t[j + 1] - S.t[j - 1]), k = Math.floor(S.v[j] / 2); if (k >= 0 && k < 60) B[k] = Math.max(B[k] == null ? -1e9 : B[k], a);
  }
  const ks = B.map((x, k) => x != null ? k : -1).filter(k => k >= 0); if (!ks.length) return null;
  const E = new Array(60);
  for (let k = 0; k < 60; k++) { let best = ks[0]; for (const q of ks) if (Math.abs(q - k) < Math.abs(best - k)) best = q; E[k] = B[best]; }
  for (let k = 1; k < 60; k++) E[k] = Math.min(E[k], E[k - 1]);
  return (v) => Math.max(0.15, E[clamp(Math.floor(v / 2), 0, 59)]);
}
function lapGrid(lap, len, step) {
  const { idx, u, ex, S } = lap, ns = Math.floor((len - 1e-6) / step) + 1;
  const g = { d: new Array(ns).fill(null), v: new Array(ns).fill(null), a: new Array(ns).fill(null), b: new Array(ns).fill(null), th: S.th ? new Array(ns).fill(null) : null, gs: S.g ? new Array(ns).fill(null) : null, out: { promet: 0, 'varnostni avto': 0, start: 0 } };
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
    if (g.th) g.th[i] = Math.min(S.th[ja], S.th[jb]);
    if (g.gs) g.gs[i] = S.g[ja] + (S.g[jb] - S.g[ja]) * w;
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
  const cars = new Map(); for (const L of used) { const m = L.run.car.key; cars.set(m, (cars.get(m) || []).concat([L])); }
  const main = [...cars.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  const grids = used.map(L => Object.assign(lapGrid(L, len, step), { L }));
  const P = { proga: t.def.id, ime: t.def.name, odprta: t.open, dolzina: Math.round(len), vreme: key, razred: laps[0].run.cls, v_razredu: laps[0].run.cls.includes(laps[0].run.car.m), korak: step, avto: main ? main[0] : null,
    s: [], n: [], d: [], d_sd: [], v: [], v_sd: [], vq: [], vq_sd: [], a: [], zav: [], rl: [], vref: [] };
  const pace0 = main ? main[1][0].pace : null;
  for (let i = 0; i < ns; i++) {
    const s = i * step, ds = [], vs = [], qs = [], as = [], bs = [], vm = [];
    for (const g of grids) { if (g.d[i] == null) continue; const vr = along(t, g.L.pace.v, s); ds.push(g.d[i]); vs.push(g.v[i]); qs.push(vr > 0.5 ? g.v[i] / vr : NaN); as.push(g.a[i]); bs.push(g.b[i]); if (main && g.L.run.car.key === main[0]) vm.push(g.v[i]); }
    const D = robust(ds, SCALE.d), V = robust(vm, SCALE.v), Q = robust(qs.filter(Number.isFinite), SCALE.q);
    P.s.push(s); P.n.push(ds.length); P.d.push(D ? r2(D.m) : null); P.d_sd.push(D ? r2(D.sd) : null); P.v.push(V ? r2(V.m) : null); P.v_sd.push(V ? r2(V.sd) : null);
    P.vq.push(Q ? r3(Math.min(2, Q.m)) : null); P.vq_sd.push(Q ? r3(Q.sd) : null); P.a.push(as.length ? r2(mean(as)) : null); P.zav.push(bs.length ? r2(mean(bs)) : null);
    P.rl.push(r2(along(t, T.rl, s))); P.vref.push(pace0 ? r2(along(t, pace0.v, s)) : null);
  }
  // the autopilot's own lap in the car of most laps (autoOf) on the same points: its line d_ap (the player's line against it, d − d_ap, is
  // what the AI adds to the racing line it steers by, so the cut of the corners by its steering is not counted twice; Race._voznja) and its
  // speed v_ap. pl: the player on the throttle (no braking on 4 laps in 5 or more, and accelerating at 60 % or more of what the car does on
  // full throttle at that speed, aMax from the autopilot's laps, or as fast as the autopilot where it is on full throttle, 2 m/s at most
  // slower): there the AI is not held to the player's speed, its engine decides (docs/ai-po-tvoji-liniji.md, Korak 2)
  const A0 = main && main[1][0].auto, ag = A0 ? lapGrid(A0.lap, len, step) : null, aMax = A0 ? fullAcc(A0.lap.S) : null;
  P.d_ap = []; P.v_ap = []; P.pl = [];
  for (let i = 0; i < ns; i++) {
    P.d_ap.push(ag && ag.d[i] != null ? r2(ag.d[i]) : null); P.v_ap.push(ag && ag.v[i] != null ? r2(ag.v[i]) : null);
    const v = P.v[i], a = P.a[i], z = P.zav[i];
    if (v == null || a == null || z == null) { P.pl.push(null); continue; }
    const full = aMax && a >= RULES.plA * aMax(v), asAp = ag && ag.th[i] != null && ag.th[i] >= 0.99 && ag.v[i] != null && v >= ag.v[i] - RULES.plV;
    P.pl.push(z < RULES.plZ && (full || asAp) ? 1 : 0);
  }
  // kg: the player's speed over the ground per their car's own (it slides: a hairpin taken sideways) against the autopilot's in the same
  // place, over ±15 m (1: no measurement). The share of the pace the AI is given is vq × kg: the AI slides as the autopilot does, so it
  // is held to the player's pace over the ground, not to the lower one of their car's nose (docs/ai-po-tvoji-liniji.md, Korak 2)
  { const r = new Array(ns).fill(null);
    for (let i = 0; i < ns; i++) {
      if (!ag || !(ag.gs && ag.gs[i] > 0) || !(ag.v[i] > RULES.kgV)) continue;
      let a = 0, b = 0; for (const g of grids) if (g.gs && g.gs[i] != null && g.v[i] > RULES.kgV) { a += g.gs[i]; b += g.v[i]; }
      if (b > 0) r[i] = (a / b) / (ag.gs[i] / ag.v[i]);
    }
    P.kg = smoothN(r, Math.round(15 / step), t.open).map(x => x == null ? null : r3(clamp(x, RULES.kg[0], RULES.kg[1]))); }
  // the slower and the quicker laps (by their time against the autopilot's in the same car, as cas_q; a third of the laps each, at least
  // one): their share of the pace against all laps' (ql, qh), over ±5 m (their own braking and speed through each corner, not an
  // average over a stretch: a quicker lap's gain on a straight is not carried into the corner after it). On easy the AI drives like the
  // slower ones, on hard like the quicker ones; the line stays the average's (Race._voznja)
  const lq = (g) => { const L = g.L; return L.auto ? L.time / (L.startTo > 0 ? L.auto.time1 : L.auto.time) : L.time; };
  const byQ = grids.slice().sort((a, b) => lq(a) - lq(b)), kq = Math.max(1, Math.round(byQ.length / 3));
  const grpQ = (G) => { const r = new Array(ns).fill(null);
    for (let i = 0; i < ns; i++) { const s = i * step, x = []; for (const g of G) { if (g.v[i] == null) continue; const vr = along(t, g.L.pace.v, s); if (vr > 0.5) x.push(g.v[i] / vr); } if (x.length && P.vq[i] > 0) r[i] = mean(x) / P.vq[i]; }
    return smoothN(r, Math.max(1, Math.round(5 / step)), t.open).map(x => x == null ? null : r3(x)); };
  P.ql = byQ.length > 1 ? grpQ(byQ.slice(-kq)) : null; P.qh = byQ.length > 1 ? grpQ(byQ.slice(0, kq)) : null;
  // over the verge: tr, the share of laps with the outer wheels past the asphalt's edge (and its kerb) there (the car's middle within
  // RULES.grassIn m of it or past it); d_tr, their mean line there. The AI's cars go over it in turn, as often as the player did (Race._voznja)
  P.tr = []; P.d_tr = [];
  for (let i = 0; i < ns; i++) {
    const ia = T.idx(T.startS + i * step), E = T.wAt(ia) + (T.curb && T.curb[ia] ? T.curbW || 1.5 : 0); let k = 0, sum = 0, nn = 0;
    for (const g of grids) { if (g.d[i] == null) continue; nn++; if (Math.abs(g.d[i]) > E - RULES.grassIn) { k++; sum += g.d[i]; } }
    P.tr.push(nn ? r2(k / nn) : null); P.d_tr.push(k ? r2(sum / k) : null);
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
    const br = R.filter(x => x.r.brake), vr = (x, s) => along(t, x.L.pace.v, s);
    // (the autopilot of each lap's car in its weather, autoOf: its own braking into this corner; per lap the ratios to it)
    const apOf = (A) => { if (!A) return null; const k = c.s + '|' + prev; if (!A.cor.has(k)) A.cor.set(k, brakingInto(A.lap, c.s, prev)); return A.cor.get(k); };
    const qOf = (x, f) => { const a = apOf(x.L.auto); return a && a.brake && x.r.brake ? f(x.r, a) : NaN; };
    const st = (arr, s0) => { const R2 = robust(arr.filter(Number.isFinite), s0); return R2 ? { m: R2.m, sd: R2.sd, n: R2.n } : null; };
    const vmin = st(R.map(x => x.r.vMin), SCALE.v), vq = st(R.map(x => x.r.vMin / Math.max(0.5, vr(x, x.r.sMin))), SCALE.q);
    const bS = st(br.map(x => x.r.brake.s), SCALE.s), bBefore = st(br.map(x => c.s - x.r.brake.s), SCALE.s), vB = st(br.map(x => x.r.brake.vB), SCALE.v), dc = st(br.map(x => x.r.brake.dec), SCALE.dec);
    // (a ratio only where it means something, RULES.qMin: the autopilot starts braking 20 m or more before the apex; both brake over 15 m or
    // more, a tap's deceleration over a few metres and 0.05 s samples is noise)
    const zq = st(br.map(x => qOf(x, (r, a) => c.s - a.brake.s >= RULES.qMin[0] ? (c.s - r.brake.s) / (c.s - a.brake.s) : NaN)), SCALE.q * 5);
    const dq = st(br.map(x => qOf(x, (r, a) => a.brake.sE - a.brake.s >= RULES.qMin[1] && r.brake.sE - r.brake.s >= RULES.qMin[1] && a.brake.dec > 1 ? r.brake.dec / a.brake.dec : NaN)), SCALE.q * 5);
    const A0 = main ? apOf(main[1][0].auto) : null, Ab = A0 && A0.brake;
    return { s: c.s, ime: nameAt(j), krogov: R.length, zavira: br.length, v_vrh: vmin ? r2(vmin.m) : null, v_vrh_sd: vmin ? r2(vmin.sd) : null, vq_vrh: vq ? r3(vq.m) : null,
      zav_s: bS ? Math.round(bS.m) : null, zav_pred: bBefore ? r2(bBefore.m) : null, zav_pred_sd: bBefore ? r2(bBefore.sd) : null, v_zav: vB ? r2(vB.m) : null,
      pojemek: dc ? r2(dc.m) : null, pojemek_sd: dc ? r2(dc.sd) : null, zav_pred_q: zq ? r3(zq.m) : null, pojemek_q: dq ? r3(dq.m) : null,
      ap_zav_pred: Ab ? r2(c.s - Ab.s) : null, ap_v_zav: Ab ? r2(Ab.vB) : null, ap_pojemek: Ab ? r2(Ab.dec) : null, ap_v_vrh: A0 ? r2(A0.vMin) : null };
  });
  // the laps, the cars, the accuracy
  const lapRow = (L, g) => Object.assign({ datoteka: L.file, krog: L.k, cas: r3(L.time), avto: L.run.car.key }, g ? { delez: r3(g.d.filter(x => x != null).length / ns), izpusceno_m: Object.fromEntries(Object.entries(g.out).filter(e => e[1] > 0)) } : {});
  P.krogi = { uporabljeni: grids.map(g => lapRow(g.L, g)), izpusceni: laps.filter(L => L.skip).map(L => Object.assign(lapRow(L), { razlog: L.skip }, L.s != null ? { s: L.s, t: L.tf } : {})) };
  P.avti = Object.fromEntries([...cars.entries()].map(([m, Ls]) => { const ts = Ls.map(L => L.time); const M = mean(ts); return [m, { krogov: Ls.length, cas: r3(M), cas_sd: r3(sdev(ts, M)), cas_med: r3(median(ts)), najboljsi: r3(Math.min(...ts)), serijski: Ls.every(L => !L.run.car.pf),
    avtopilot: Ls[0].auto ? r3(Ls[0].auto.time) : null, cas_q: Ls[0].auto ? r3(median(Ls.map(L => L.auto ? L.time / (L.startTo > 0 ? L.auto.time1 : L.auto.time) : NaN).filter(Number.isFinite))) : null }]; }));
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
  const N = P.natancnost, E = RULES.enough[P.odprta ? 'cesta' : 'krog'], u = P.krogi.uporabljeni, x = P.krogi.izpusceni;
  // (Slovenian plurals by n mod 100: 1 · 2 · 3–4 · 0 and 5 on; the genitive after »iz«, »od«: 1 · every other)
  const w = (n, a, b, c, d) => { const k = n % 100; return k === 1 ? a : k === 2 ? b : k === 3 || k === 4 ? c : d; }, krog = (n) => n + ' ' + w(n, 'krog', 'kroga', 'krogi', 'krogov'), gen = (n) => n + ' ' + (n % 100 === 1 ? 'kroga' : 'krogov');
  const L = [`${P.ime} (${P.proga}) · ${P.vreme} · razred ${P.razred.join(', ')}${P.v_razredu ? '' : ' (tvoj avto ni med njimi: hitrost ne velja zanje)'} · ${fileCount} ${w(fileCount, 'posnetek', 'posnetka', 'posnetki', 'posnetkov')}`];
  L.push(`  ${P.odprta ? 'vožnje' : 'krogi'}: ${u.length + x.length}, uporabljenih ${u.length}, izpuščenih ${x.length} · čistih ${N.krogov}: ${N.ocena}` +
    (P.odprta ? ` (potrebnih je ${E[0]}–${E[1]} voženj)` : ` (najmanj ${E[0]}, dobro ${E[1]}, najbolje ${E[2]}–10; več kot 10 skoraj nič ne izboljša)`));
  const out = (r) => { const o = Object.entries(r.izpusceno_m || {}).map(([k, m]) => `${m} m ${k === 'promet' ? 'ob drugih avtih' : k === 'start' ? 'štarta' : 'za varnostnim avtom'}`); return o.length ? '; brez ' + o.join(', ') : ''; };
  for (const r of u) L.push(`    ✓ ${r.datoteka} ${P.odprta ? 'vožnja' : 'K' + r.krog} ${clock(r.cas)} ${r.avto} (${Math.round(r.delez * 100)} % proge${out(r)})`);
  for (const r of x) L.push(`    ✗ ${r.datoteka} ${P.odprta ? 'vožnja' : 'K' + r.krog} ${clock(r.cas)} ${r.avto}: ${r.razlog}${r.s != null ? ' pri ' + r.s + ' m' : ''}`);
  if (!u.length) return L.join('\n');
  L.push(`  natančnost povprečja: linija ±${dec(N.d_se, 2)} m, hitrost ±${dec(N.v_se * 3.6, 1)} km/h; raztros med krogi: linija ${dec(N.d_sd, 2)} m, hitrost ${dec(N.v_sd * 3.6, 1)} km/h; ${Math.round(N.pokritost * 100)} % proge iz vsaj ${gen(Math.min(3, N.krogov))}`);
  const off = P.d.map((d, i) => d != null && P.rl[i] != null ? d - P.rl[i] : null), ok = off.filter(v => v != null);
  if (ok.length) { let im = 0; off.forEach((v, i) => { if (v != null && Math.abs(v) > Math.abs(off[im] || 0)) im = i; }); const m = mean(ok);
    L.push(`  linija: povprečno ${dec(Math.abs(m), 2)} m ${m >= 0 ? 'desno' : 'levo'} od idealne linije igre, povprečni odmik ${dec(mean(ok.map(Math.abs)), 2)} m, največji ${dec(Math.abs(off[im]), 1)} m ${off[im] >= 0 ? 'desno' : 'levo'} pri ${P.s[im]} m`); }
  for (const [m, a] of Object.entries(P.avti)) L.push(`  ${m}: ${krog(a.krogov)}, povprečno ${clock(a.cas)} (±${dec(a.cas_sd, 2)} s), najboljši ${clock(a.najboljsi)}${a.serijski ? ', serijski avto' : ''}` +
    (a.avtopilot ? ` · avtopilot v tem avtu ${clock(a.avtopilot)}, čas kroga ${dec(a.cas_q, 3)} njegovega` : ''));
  const cq = P.ovinki.map(c => c.vq_vrh).filter(v => v != null);
  if (cq.length) L.push(`  hitrost v vrhovih ovinkov: povprečno ${dec(mean(cq), 2)} tempa avtopilota (${dec(Math.min(...cq), 2)}–${dec(Math.max(...cq), 2)})`);
  if (P.ovinki.length) L.push(`  ovinki (${P.ovinki.length}): kje začne zavirati, pri kateri hitrosti, pojemek, hitrost v vrhu; za » · « avtopilot v istem avtu in vremenu`);
  for (const c of P.ovinki) L.push(`    ${c.ime || 'ovinek'} · ${c.s} m: ` + (c.zavira ? `zavira ${dec(c.zav_pred, 0)} m pred vrhom (±${dec(c.zav_pred_sd, 0)} m) pri ${kmh(c.v_zav)} km/h, ${dec(c.pojemek, 1)} m/s²` : 'samo s plina') +
    `, v vrhu ${kmh(c.v_vrh)} km/h (±${dec(c.v_vrh_sd * 3.6, 1)}; ${dec(c.vq_vrh, 2)} tempa avtopilota)` + (c.zavira && c.zavira < c.krogov ? `; zavira ${c.zavira} od ${gen(c.krogov)}` : '') + (c.krogov < N.krogov ? `; ${krog(c.krogov)}` : '') +
    (c.ap_v_vrh == null ? '' : ' · ' + (c.ap_zav_pred != null ? `${dec(c.ap_zav_pred, 0)} m, ${kmh(c.ap_v_zav)} km/h, ${dec(c.ap_pojemek, 1)} m/s²` : 'samo s plina') + `, v vrhu ${kmh(c.ap_v_vrh)} km/h` +
      (c.zav_pred_q != null || c.pojemek_q != null ? ' (' + [c.zav_pred_q != null ? 'razdalja ×' + dec(c.zav_pred_q, 2) : '', c.pojemek_q != null ? 'pojemek ×' + dec(c.pojemek_q, 2) : ''].filter(Boolean).join(', ') + ')' : '')));
  for (const o of P.opombe) L.push('  opomba: ' + o);
  return L.join('\n');
}

/* ---------------- the tool ---------------- */
export function measure(files, opts = {}) {
  const step = opts.korak || 5, C = opts.core || loadCore(), N = opts.napake || napake(), tc = new Map(), paces = new Map(), runs = [];
  for (const f of files) {
    let all = null; try { all = readRrpAll(N, f); } catch (_) { }
    if (all && all.length > 1) all.forEach((rec, i) => runs.push(scanFile(C, N, f, tc, paces, { rec, name: path.basename(f) + ' #' + (i + 1) })));   // (Najboljše vožnje: a track's runs)
    else runs.push(scanFile(C, N, f, tc, paces));   // (one recording, or none to read: as ever)
  }
  const groups = new Map();
  // (a profile: one track, one weather, one class of cars, classOf)
  for (const r of runs) for (const L of r.laps || []) { L.run = r; const key = r.t.def.id + '|' + (L.cond && L.cond.key ? L.cond.key : (r.H.rain > 0 ? 'mokro' : 'suho') + (r.H.season === 'winter' ? '·zima' : '')) + '|' + r.cls.join(',') + (r.cls.includes(r.car.m) ? '' : '/' + r.car.m); groups.set(key, (groups.get(key) || []).concat([L])); }
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

/* ---------------- the profiles as the game's data (--js <file>, js/data/voznja.js; docs/ai-po-tvoji-liniji.md, Korak 2): the averages only,
   for the AI on each track and in each weather (Race opts.voznja, Race._voznja). Only a profile of a car among its own rivals (v_razredu)
   with enough clean laps (RULES.enough: the least). Per point (korak m from the start line): dd, the player's line against the autopilot's
   own in that car (d − d_ap; without it d − rl), m; vq, the share of the pace (0: no measurement); pl, on the throttle (1). Gaps of up to
   40 m filled in between the points either side, longer ones left without (dd 0, vq 0); dd and vq smoothed over three points ---------------- */
export function gameData(profil, kal) {
  const out = [];
  for (const P of profil.proge) {
    const nL = P.krogi.uporabljeni.length, least = P.odprta ? RULES.enough.cesta[0] : RULES.enough.krog[0];
    if (!P.v_razredu || nL < least) continue;
    const n = P.s.length, open = P.odprta, fillMax = Math.round(40 / P.korak);
    const dd = P.d.map((d, i) => d == null ? null : P.d_ap && P.d_ap[i] != null ? d - P.d_ap[i] : d - P.rl[i]);
    const vq = P.vq.map((q, i) => q == null ? null : q * (P.kg && P.kg[i] > 0 ? P.kg[i] : 1)), pl = P.pl ? P.pl.slice() : new Array(n).fill(0);   // (the pace over the ground: kg)
    const dtr = P.d_tr ? P.d_tr.map((d, i) => d == null ? null : P.d_ap && P.d_ap[i] != null ? d - P.d_ap[i] : d - P.rl[i]) : null;
    const fill = (A, none) => {   // (between the nearest measured points either side of a gap; a circuit: round past its start)
      const ok = A.map(x => x != null), B = A.slice();
      for (let i = 0; i < n; i++) {
        if (ok[i]) continue;
        let a = -1, b = -1, ga = 0, gb = 0;
        for (let k = 1; k < n; k++) { const j = i - k; if (open && j < 0) break; if (ok[(j + n) % n]) { a = (j + n) % n; ga = k; break; } }
        for (let k = 1; k < n; k++) { const j = i + k; if (open && j >= n) break; if (ok[j % n]) { b = j % n; gb = k; break; } }
        B[i] = a >= 0 && b >= 0 && ga + gb - 1 <= fillMax ? A[a] + (A[b] - A[a]) * ga / (ga + gb) : none;
      }
      return B;
    };
    const smooth = (A, keep) => A.map((x, i) => { if (keep && !(x > 0)) return x; const a = A[open ? Math.max(0, i - 1) : (i - 1 + n) % n], b = A[open ? Math.min(n - 1, i + 1) : (i + 1) % n];
      return keep && !(a > 0 && b > 0) ? x : (a + 2 * x + b) / 4; });
    const dF = fill(dd, 0), qF = fill(vq, 0);
    for (let i = 0; i < n; i++) if (pl[i] == null) pl[i] = 0;
    const r2x = (x) => Math.round(x * 100) / 100, r3x = (x) => Math.round(x * 1000) / 1000;
    const o = { proga: P.proga, vreme: P.vreme, razred: P.razred, avto: P.avto, korak: P.korak, krogov: nL, cas_q: P.avti && P.avti[P.avto] ? P.avti[P.avto].cas_q : null,
      dd: smooth(dF).map(r2x), vq: smooth(qF, true).map(r3x), pl: pl.map(x => x ? 1 : 0) };
    if (P.ql && P.qh) { o.ql = P.ql.map(x => x == null ? 1 : r3x(x)); o.qh = P.qh.map(x => x == null ? 1 : r3x(x)); }
    if (kal && o.ql) { if (kal.k0 > 0) o.k0 = kal.k0; if (kal.ks > 0) o.ks = kal.ks; }   // (the AI's pace at lam 0 and its spread toward the slower laps: --k0, --ks)
    if (P.tr && P.tr.some(x => x >= RULES.trMin)) { o.tr = P.tr.map(x => x >= RULES.trMin ? r2x(x) : 0); o.dt = dtr.map((x, i) => P.tr[i] >= RULES.trMin && x != null ? r2x(x) : 0); }   // (over the verge: RULES.trMin)
    out.push(o);
  }
  return out;
}
/* ---------------- the player's style (--slog, VOZNJA_SLOG; docs/ai-po-tvoji-liniji.md, Korak 3): what the game's dry profiles say about
   each kind of corner, for the AI on every track without a profile of its own (Race._voznja, Core.voznjaIzSloga). A profile's points by
   the corner they are in (Core.voznjaFaze on the speed profile of a race in the profile's car: the corners Race._voznja finds), the corners
   in classes by their apex's radius (SLOG.meje: the hairpins, the tight corners; the quicker ones none: there the AI is its own), each class
   at the median radius of its corners (r). Per class at each SLOG.fe node (−1: the top speed before the corner .. 0: its apex) the means of
   vq (measured points only), pl, ql, qh (a triangle hF wide), at each SLOG.m node (m from the apex, − before it) the mean of dd toward the
   inside (hM wide); k0, ks the profiles' own. A class with fewer than najmanj corners is left out. previdno (--previdno): the share of the
   player's pace over the profile the AI takes (Core.voznjaIzSloga): 0.3 makes a race of the style on Tianmen as quick as one on the
   player's own profile there (5 Perun rivals, medium, three seeds: 205.4 s against 205.6 s; the whole share 200.5 s, and on the other real
   tracks more of the cars off the road). No verge (the profiles' tr, dt): where the player went over it is the track's own; the style
   over it (at every hairpin as often as the player at theirs) put the cars off the road and spun them, on Tianmen too ---------------- */
export const SLOG = { fe: [-1, -0.8, -0.6, -0.4, -0.25, -0.12, 0], m: [-80, -60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60, 80], meje: [12, 30], rr: [30, 70], izhod: 0.3, sirina: 2.8,
  previdno: 0.3, hF: 0.12, hM: 8, najmanj: 3 };
export function slogOf(list, C, opts = {}) {
  C = C || loadCore();
  const dry = (list || []).filter(p => p && !/^mokro|zima/.test(p.vreme || '') && p.vq && p.vq.length > 1), tc = new Map(), K = SLOG.meje.length;
  if (!dry.length) return null;
  const B = Array.from({ length: K }, () => ({ R: [], pts: [] }));   // (per class: its corners' radii, the points)
  let wk = 0, k0 = 0, ks = 0;
  for (const V of dry) {
    const t = trackOf(C, tc, V.proga); if (!t) continue;
    const T = t.T, M = C.MODELS.find(m => m.id === V.avto) || C.MODELS[0], orig = Math.random;
    let vp; try { Math.random = seeded(7); vp = new C.Race(T, { numAI: 0, playerModel: M, laps: 1, seed: 7, damage: 0 }).vprof; } finally { Math.random = orig; }
    const F = C.voznjaFaze(T, vp), k = V.korak || 5, n = V.vq.length, cOf = (R) => { for (let q = 0; q < K; q++) if (R < SLOG.meje[q]) return q; return -1; }, seen = new Set();
    for (let j = 0; j < n; j++) {
      const i = T.idx(T.open ? T.startS + j * k : (T.startS + j * k) % T.len), c = F.k[i], cl = F.lk[i];
      if (c >= 0) { const q = cOf(F.C[c].R), fe = F.fe[i]; if (q >= 0 && fe <= 0) B[q].pts.push({ f: 'fe', x: fe, vq: V.vq[j], pl: V.pl[j], ql: V.ql ? V.ql[j] : 1, qh: V.qh ? V.qh[j] : 1 }); }
      if (cl < 0) continue;
      const A = F.C[cl], q = cOf(A.R); if (q < 0) continue;
      if (!seen.has(cl)) { seen.add(cl); B[q].R.push(A.R); }
      B[q].pts.push({ f: 'm', x: F.lm[i], dd: V.dd[j] * A.dir });
    }
    if (V.k0 > 0 && V.ks > 0) { wk += n; k0 += V.k0 * n; ks += V.ks * n; }
  }
  const kern = (X, h, key, use) => (pts) => X.map(x => { let sw = 0, s = 0; for (const p of pts) { if (!use(p)) continue; const w = Math.max(0, 1 - Math.abs(p.x - x) / h); sw += w; s += w * p[key]; } return sw > 0.5 ? s / sw : NaN; });
  const fillN = (A, dflt) => { const ok = A.map(Number.isFinite); if (!ok.some(Boolean)) return A.map(() => dflt); return A.map((x, i) => { if (ok[i]) return x; let a = i, b = i; while (a >= 0 && !ok[a]) a--; while (b < A.length && !ok[b]) b++; return a < 0 ? A[b] : b >= A.length ? A[a] : A[a] + (A[b] - A[a]) * (i - a) / (b - a); }); };
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const r3x = (x) => Math.round(x * 1000) / 1000, r2x = (x) => Math.round(x * 100) / 100, out = [];
  for (const b of B) {
    if (b.R.length < SLOG.najmanj) continue;
    const pf = b.pts.filter(p => p.f === 'fe'), pm = b.pts.filter(p => p.f === 'm'), fe = (key, use) => fillN(kern(SLOG.fe, SLOG.hF, key, use || (() => true))(pf), 1);
    const vq = fe('vq', p => p.vq > 0), ql = fe('ql', p => p.vq > 0), qh = fe('qh', p => p.vq > 0), pl = fe('pl'), dd = fillN(kern(SLOG.m, SLOG.hM, 'dd', () => true)(pm), 0);
    out.push({ r: r2x(med(b.R)), ovinkov: b.R.length, vq: vq.map(r3x), pl: pl.map(r3x), ql: ql.map(r3x), qh: qh.map(r3x), dd: dd.map(r2x) });
  }
  if (!out.length) return null;
  const S = { vreme: 'suho', korak: dry[0].korak || 5, iz: [...new Set(dry.map(p => p.proga))], fe: SLOG.fe, m: SLOG.m, rr: SLOG.rr, izhod: SLOG.izhod, sirina: SLOG.sirina,
    previdno: opts.previdno != null ? opts.previdno : SLOG.previdno, razredi: out };
  if (wk) { S.k0 = r3x(k0 / wk); S.ks = r3x(ks / wk); }
  return S;
}
export function gameDataJs(list, date, slog) {
  return '/* Profili vožnje igralca za tekmece (docs/ai-po-tvoji-liniji.md, koraka 2 in 3): samo povprečja, ki jih je iz posnetkov dirk izmeril\n' +
    '   tools/voznja.mjs (--js); posnetkov v repozitoriju ni. Vsak profil: proga, vreme, razred (avti tekmecev), korak (m od štartne črte), dd (odmik\n' +
    '   od linije avtopilota v istem avtu, m, + desno), vq (delež tempa čez tla, 0: ni meritve), pl (1: na plinu), ql, qh (počasnejši, hitrejši\n' +
    '   krogi), k0, ks (umeritev tempa tekmecev), tr, dt (čez rob ceste). VOZNJA_SLOG (--slog): slog igralca iz suhih profilov za proge brez\n' +
    '   svojega profila, po vrstah ovinkov (razredi po polmeru temena r: vq, pl, ql, qh po fazi fe od največje hitrosti pred ovinkom do temena,\n' +
    '   dd po metrih m od temena proti notranji strani; previdno: delež hitrosti nad profilom; čez rob ceste nikoli). Bere Race._voznja\n' +
    '   (js/core.js) prek opts.voznja (js/game.js,' +
    ' vklop index.html?voznja=1). Samo podatki' + (date ? '; ' + date : '') + '. */\n' +
    'var VOZNJA_PROFILI = ' + (list.length ? '[\n' + list.map(p => '  ' + JSON.stringify(p)).join(',\n') + '\n]' : '[]') + ';\n' +
    'var VOZNJA_SLOG = ' + (slog ? '{\n' + Object.keys(slog).map(k => '  ' + JSON.stringify(k) + ': ' + (k === 'razredi' ? '[\n' + slog.razredi.map(c => '    ' + JSON.stringify(c)).join(',\n') + '\n  ]' : JSON.stringify(slog[k]))).join(',\n') + '\n}' : 'null') + ';\n';
}
// the profiles of a game data file (VOZNJA_PROFILI of js/data/voznja.js; --slog without recordings)
export function readGameData(file) {
  const cx = vm.createContext({}); vm.runInContext(fs.readFileSync(file, 'utf8') + '\n;this.L = typeof VOZNJA_PROFILI === "undefined" ? null : VOZNJA_PROFILI;', cx);
  if (!Array.isArray(cx.L)) throw new Error(file + ': ni VOZNJA_PROFILI');
  return cx.L;
}

if (import.meta.url === url.pathToFileURL(process.argv[1] || '').href) {
  const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const outArg = flag('--out'), korak = flag('--korak'), jsArg = flag('--js'), k0 = flag('--k0'), ks = flag('--ks'), slogArg = flag('--slog'), pvArg = flag('--previdno'), files = args.filter(a => !a.startsWith('--')), bad = args.filter(a => a.startsWith('--'));
  const kOk = (x, a, b) => x == null || (+x >= a && +x <= b), today = new Date().toISOString().slice(0, 10);
  const rel = (f) => { const p = path.relative(process.cwd(), f); return p.startsWith('..') ? f : p; };
  const pv = pvArg != null ? +pvArg : undefined;
  if (pvArg != null && !(pv >= 0 && pv <= 1)) { console.log('--previdno: 0-1'); process.exit(2); }
  if (slogArg && !files.length && !bad.length && !jsArg) {   // (the style anew from a game data file's own profiles: written back into it)
    const f = path.resolve(slogArg); if (!fs.existsSync(f)) { console.log('no such file: ' + slogArg); process.exit(2); }
    let L; try { L = readGameData(f); } catch (e) { console.log(String(e.message || e)); process.exit(2); }
    const S = slogOf(L, null, { previdno: pv }); fs.writeFileSync(f, gameDataJs(L, today, S));
    console.log(S ? `→ ${rel(f)}: VOZNJA_SLOG iz ${S.iz.join(', ')} (${S.razredi.map(c => 'r ' + c.r + ' m, ' + c.ovinkov + ' ovinkov' + '').join('; ')})` : `→ ${rel(f)}: ni suhega profila, VOZNJA_SLOG null`);
    process.exit(S ? 0 : 1);
  }
  if (!files.length || bad.length || slogArg || (korak != null && !(+korak >= 1 && +korak <= 50)) || !kOk(k0, 0.8, 1.1) || !kOk(ks, 0.5, 3)) {
    console.log('usage: node tools/voznja.mjs <posnetek.rrp> [...] [--out <profil.json>|<mapa>] [--korak <m>] [--js js/data/voznja.js [--k0 0.8-1.1] [--ks 0.5-3] [--previdno 0-1]]\n' +
      '       node tools/voznja.mjs --slog js/data/voznja.js [--previdno 0-1]' + (bad.length ? '\nunknown: ' + bad.join(' ') : ''));
    process.exit(2);
  }
  const miss = files.filter(f => !fs.existsSync(f)); if (miss.length) { console.log('no such file: ' + miss.join(', ')); process.exit(2); }
  const json = outArg && /\.json$/i.test(outArg) ? path.resolve(outArg) : path.join(path.resolve(outArg || path.join(REPO, 'test-results', 'voznja')), 'profil.json');
  fs.mkdirSync(path.dirname(json), { recursive: true });
  const r = measure(files.map(f => path.resolve(f)), { korak: korak ? +korak : 5 });
  const sumFile = path.basename(json) === 'profil.json' ? path.join(path.dirname(json), 'povzetek.txt') : json.replace(/\.json$/i, '.txt');
  fs.writeFileSync(json, JSON.stringify(r.profil)); fs.writeFileSync(sumFile, r.text + '\n');
  let jsNote = '';
  if (jsArg) { const L = gameData(r.profil, { k0: k0 != null ? +k0 : 0, ks: ks != null ? +ks : 0 }), S = slogOf(L, null, { previdno: pv }); fs.writeFileSync(path.resolve(jsArg), gameDataJs(L, today, S)); jsNote = ', ' + rel(path.resolve(jsArg)) + ' (' + L.map(p => p.proga + ' ' + p.vreme + ' ' + p.krogov).join('; ') + (S ? '; slog iz ' + S.iz.join(', ') : '') + ')'; }
  console.log(r.text + '\n\n→ ' + rel(json) + ', ' + rel(sumFile) + jsNote);
  process.exit(r.profil.proge.some(p => p.krogi.uporabljeni.length) ? 0 : 1);
}
