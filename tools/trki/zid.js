// Trki: avto v ograjo (the car against the barrier, wallCollide in js/core.js). ANALYSIS ONLY: what the game does now, measured, for the
// plan of a more realistic collision version. Nothing here changes the game; the same script measures a future version (--cv).
//   node tools/trki/zid.js                 the tables (matrika, prikolica, posebne, proga)
//   node tools/trki/zid.js --json          the same results as JSON on stdout
//   node tools/trki/zid.js --cv 3          a collision version chosen (Core.setTest({ cv }): 1 Simulacija, 2 Arkadna, 3 Mehka, 4 Kaskaderska,
//                                          5 Stara, or a later one; without it the game's default)
//   node tools/trki/zid.js --del matrika   only one part (matrika | prikolica | posebne | proga)
// How it measures (the game's own code, no physics written again here):
// - the road: the game's Track built from a flat test oval (two 1.6 km straights; the definition is this script's, the class and every
//   rule of the barrier are the game's): 'asfalt' the barrier 1.5 m inside the asphalt's edge (every wheel of a car against it on asphalt:
//   a pit wall, a street circuit), 'trava' 4 m of grass before it (a circuit's verge), 'siroka' the same as 'asfalt' on a 44 m wide road
//   (room for a semi-trailer at any angle). Cross-checked on Spa and Bathurst (part 'proga') and in a seeded race (tests/lib/sim.js)
// - the car: the player's car of a Race on that road (Race's own construction), placed with its travel at the angle to the barrier, its
//   leading corner 0.3 m short of the barrier line, heading = travel, no yaw
// - a step, mode 'sam': the calls Race._step makes for one car, in its order (the steering's rate, Car.step, wallCollide, Track.query), so
//   the wall's part of a step (its push and its correction of the position) can be told from the car's own; mode 'dirka': Race.step itself
//   (a semi-trailer needs it: its walls and the kingpin are the race's, Race._tlStep). Part 'proga' shows both give the same run, to the bit
// - the inputs: 'nic' none after the placing; 'plin' full throttle all the way, from the first touch the steering away from the barrier (full
//   lock while the car is near it or points at it, then holding a line 2 m clear of it: an analogue stick)
// Columns (matrika): v0 the speed at the hit, v1 after the first step in the barrier, vL when it leaves it (no touch for 0.25 s after), v.5
//   and v2 at 0.5 s and 2 s after the hit (km/h); eN1 / eNL the normal speed away from the barrier after the first step / leaving, as a
//   share of the normal speed in (the effective restitution; negative: still going in); mu1 / muS the tangential speed the wall took over
//   the normal speed it took, first step / the whole scrape (the effective friction); E% the kinetic energy lost by leaving; izh the exit
//   angle (deg, + away from the barrier); dh the heading's change by leaving (deg, + away); w the peak yaw rate (deg/s); rav the time
//   until straight again (s: no touch, yaw under 3 deg/s, travel within 3 deg of the nose, for 0.25 s; '-': not in the 7 s); n separate
//   touches (parted by 0.05 s or more); zv crash sounds the game would play (hitWall over 1.5 m/s, at most one per 0.16 s); ud steps with
//   damage (hitWall over 2.5 m/s); drs how long it stays on the barrier (s; '>': to the end); utr the touch flag's changes per second
//   while on it (jitter); pop the largest correction of the position in a step (cm); cez the furthest a corner got past the barrier line
//   before the correction (cm); hit the hardest hitWall (m/s); sk the damage (%); gum the chance of a puncture with failures on (%);
//   prv: with rolling over on (Razbijanje) the hit can roll the car; dz: it reached the barrier on the other side (s after the hit);
//   lep: glued (at the end still on the barrier, under 7 km/h, the throttle held); odm (plin): s until every corner stays 0.3 m clear
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));

const args = process.argv.slice(2), opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const CV = opt('--cv') != null && Number.isFinite(+opt('--cv')) ? +opt('--cv') : null, AS_JSON = args.includes('--json'), ONLY = opt('--del');
const C = loadCore();
Math.random = SIM.seeded(20261109);   // (whatever the core draws outside a race's own numbers: a fixed sequence)
C.setTest(CV != null ? { cv: CV } : null);

const DT = 1 / 120, D = 180 / Math.PI, G = 9.81, SECS = 7;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const model = (id) => C.MODELS.find(m => m.id === id);
const ORD = 'rally', LIGHT = C.MODELS.filter(m => !m.trailer).reduce((a, b) => (b.mass < a.mass ? b : a)).id, TRUCK = model('titan') ? 'titan' : 'truck';
const RIG = (C.MODELS.find(m => m.trailer && !m.trailer.next) || C.MODELS.find(m => m.trailer) || {}).id;

// ---- the roads: the game's Track from a flat oval ----
function ovalPts(L, R) {
  const p = [], r = Math.PI / 180;
  for (let x = 0; x < L; x += 100) p.push([x, 0]);
  for (let a = -90; a < 90; a += 15) p.push([L + R * Math.cos(a * r), R + R * Math.sin(a * r)]);
  for (let x = L; x > 0; x -= 100) p.push([x, 2 * R]);
  for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]);
  return p;
}
const ROADS = {
  asfalt: () => ({ halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4, walls: [[100, 1400, 1, -1.5, 20]] }),
  trava: () => ({ halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4 }),
  siroka: () => ({ halfWidth: 22, points: ovalPts(1600, 260), startX: 50, edgeBar: 4, walls: [[100, 1400, 1, -1.5, 20]] }),
};
const _roads = {};
function road(name, extra) {
  if (!extra && _roads[name]) return _roads[name];
  const T = new C.Track(Object.assign({ id: 'zid-' + name, name: 'Ravnina, Preizkus' }, ROADS[name](), extra));
  if (!extra) _roads[name] = T;
  return T;
}
const realTrack = (id) => _roads[id] || (_roads[id] = new C.Track(C.TRACKS.find(d => d.id === id)));

function mkRace(T, id, phys, extra) {
  const race = new C.Race(T, Object.assign({ numAI: 0, playerGrid: 1, laps: 99, playerModel: model(id), assist: 2, seed: 9, difficulty: 1, damage: 2, phys }, extra));
  race.start();
  return race;
}
// the car placed: at (x, z), heading h, at v m/s along its heading, in a gear that fits the speed (as tests/lib/handling.js)
function placeCar(c, T, x, z, h, v) {
  c.place(x, z, h); c.locked = false; c.steer = 0; c.inSteer = c.inThr = c.inBrk = c.inHand = 0; c.digitalSteer = true;
  c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v;
  const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
  T.query(c.x, c.z, -1, c.q);
  if (c.tl) { const R = c.tl; R.vx = c.vx; R.vz = c.vz; if (R.next) { R.next.vx = c.vx; R.next.vz = c.vz; } }   // (the semi-trailer straight behind it, Car.place: at the tractor's speed)
}
// where on the road: sample i, the barrier's side (1 right, -1 left), the travel th (rad) toward it, the leading corner gap m short of it
function spot(c, T, i, side, th, gap) {
  const B = side > 0 ? T.br[i] : T.bl[i], reach = c.m.len / 2 * Math.sin(th) + c.m.wid / 2 * Math.cos(th), d0 = side * (B - gap - reach);
  return { x: T.px[i] + T.nx[i] * d0, z: T.pz[i] + T.nz[i] * d0, h: T.hd[i] + side * th, B };
}

// one step of a lone car as Race._step makes it (js/core.js: the steering's rate, Car.step, wallCollide, the progress loop's Track.query);
// W takes the state between the car's own step and the wall
function stepLone(c, T, W) {
  const target = c.inSteer, rate = c.isPlayer ? (c.digitalSteer ? (Math.abs(target) < Math.abs(c.steer) || target * c.steer < 0 ? 10 : 6) : 16) : 10;
  c.steer += C.clamp(target - c.steer, -rate * DT, rate * DT);
  if (!c.fall) c.step(DT, T);
  W.x = c.x; W.z = c.z; W.h = c.h; W.vx = c.vx; W.vz = c.vz; W.w = c.w;
  if (!c.fall) C.wallCollide(c, T, true);
  T.query(c.x, c.z, c.q.i, c.q);
}
// the corners' room to the route's barrier line on the given side (m, the least; negative: past it)
const _cq = {};
function room(c, T, side, x, z, h) {
  const ch = Math.cos(h), sh = Math.sin(h); let r = 1e9;
  for (const p of c.corners) { const q = T.query(x + p[0] * ch - p[1] * sh, z + p[0] * sh + p[1] * ch, c.q.i, _cq); r = Math.min(r, (side > 0 ? q.br : q.bl) - side * q.d); }
  return r;
}

// a crash: o = { T, id, phys, mode ('sam' | 'dirka'), inp ('nic' | 'plin'), kmh, and where: { i, side, th (deg) } or { x, z, h, side } }
// -> the measurements (see the head of the file); o.keep: the car and the steps too
function crash(o) {
  const T = o.T, lone = o.mode !== 'dirka', race = mkRace(T, o.id, o.phys, o.raceOpts), c = race.player, side = o.side || 1, v = o.kmh / 3.6;
  const P = o.x != null ? { x: o.x, z: o.z, h: o.h } : spot(c, T, o.i, side, o.th / D, o.gap != null ? o.gap : 0.3);
  placeCar(c, T, P.x, P.z, P.h, v);
  if (o.setup) o.setup(c, race);
  const i0 = c.q.i, F = { tx: T.tx[i0], tz: T.tz[i0], mx: side * T.nx[i0], mz: side * T.nz[i0], fixed: false };   // (the frame: along the barrier, and into it)
  const rec = [], W = {}, n = Math.round((o.secs || SECS) / DT), away = -side, useRoom = !o.noRoom;
  let k0 = -1, fell = -1;
  for (let k = 0; k < n; k++) {
    c.inThr = o.inp === 'plin' ? 1 : 0; c.inBrk = 0; c.inHand = 0; c.inSteer = 0;
    if (o.inp === 'plin' && k0 >= 0) {   // (away from the barrier: full lock while it is near or the nose points at it, then a line 2 m clear of it)
      const B = side > 0 ? c.q.br : c.q.bl, e = side * c.q.d - (B - c.m.wid / 2 - 2), he = side * wrap(c.h - T.hd[c.q.i]);
      c.digitalSteer = false; c.inSteer = away * C.clamp(0.35 * e + 2 * he, -1, 1); }
    if (o.drive) o.drive(c, k, k0);
    c.wallX = NaN; if (c.tl) { c.tl.wallX = NaN; if (c.tl.next) c.tl.next.wallX = NaN; }
    const b = { x: c.x, z: c.z, h: c.h, vx: c.vx, vz: c.vz, w: c.w };
    if (lone) stepLone(c, T, W); else { race.step(DT); Object.assign(W, b); }
    const touch = !Number.isNaN(c.wallX) || (!!o.touch && o.touch(c)), tl = !!c.tl && (!Number.isNaN(c.tl.wallX) || (!!c.tl.next && !Number.isNaN(c.tl.next.wallX)));
    const r = { pvx: W.vx, pvz: W.vz, pw: W.w, vx: c.vx, vz: c.vz, w: c.w, x: c.x, z: c.z, h: c.h, touch: touch || tl, tl, hit: c.hitWall, d: c.q.d,
      pop: lone ? Math.hypot(c.x - W.x, c.z - W.z) : 0, over: lone && useRoom && touch ? -room(c, T, side, W.x, W.z, W.h) : 0, room: useRoom ? room(c, T, side, c.x, c.z, c.h) : 9,
      dmg: c.dmg, rl: !!c.rl, fall: !!c.fall };
    c.hitWall = 0; c.hitCar = 0; c.fxWall = 0;   // (as the game clears them after every step)
    if (r.touch && k0 < 0) { k0 = k;
      if (lone && r.pop > 1e-9) { F.mx = -(c.x - W.x) / r.pop; F.mz = -(c.z - W.z) / r.pop; const s = F.tx * -F.mz + F.tz * F.mx >= 0 ? 1 : -1; F.tx = -F.mz * s; F.tz = F.mx * s; F.fixed = true; } }   // (the wall's normal: the way it moved the car)
    rec.push(r);
    if (c.fall && fell < 0) { fell = k; break; }
  }
  const out = analyse(rec, k0, F, o, c);
  out.fell = fell >= 0 ? (fell - Math.max(0, k0)) * DT : null;
  if (o.keep) { out.rec = rec; out.car = c; out.F = F; }
  return out;
}
function analyse(rec, k0, F, o, c) {
  const n = rec.length, side = o.side || 1, key = { fiz: o.phys, avto: o.id, tla: o.tla || '', kot: o.th != null ? o.th : null, kmh: o.kmh, vnos: o.inp, nacin: o.mode !== 'dirka' ? 'sam' : 'dirka' };
  if (k0 < 0) return Object.assign(key, { miss: true });
  const vn = (vx, vz) => vx * F.mx + vz * F.mz, vt = (vx, vz) => vx * F.tx + vz * F.tz, sp = (r) => Math.hypot(r.vx, r.vz);
  const a = rec[k0], v0 = Math.hypot(a.pvx, a.pvz), vn0 = vn(a.pvx, a.pvz), vt0 = vt(a.pvx, a.pvz), h0 = k0 > 0 ? rec[k0 - 1].h : a.h;
  // leaving: the last touch before 0.25 s without one
  let kL = -1; for (let k = k0, last = k0; k < n; k++) { if (rec[k].touch) last = k; else if (k - last >= 30) { kL = last; break; } }
  const kE = kL >= 0 ? kL : n - 1, L = rec[kE];
  let Jn = 0, Jt = 0, tog = 0, tch = 0, pop = 0, over = 0, hit = 0, ud = 0, zv = 0, fb = 0, eps = 0, gapN = 99, pOk = 1, wPk = 0, dz = null, stop = null, hitFirst = 0;
  for (let k = k0; k < n; k++) {
    const r = rec[k];
    if (k <= kE) { Jn += vn(r.pvx, r.pvz) - vn(r.vx, r.vz); Jt += vt(r.pvx, r.pvz) - vt(r.vx, r.vz); if (r.touch) tch++; if (k > k0 && r.touch !== rec[k - 1].touch) tog++; }
    if (r.touch) { if (gapN >= 6) eps++; gapN = 0; } else gapN++;
    pop = Math.max(pop, r.pop); over = Math.max(over, r.over); hit = Math.max(hit, r.hit);
    if (r.hit > 0 && !hitFirst) hitFirst = r.hit;
    if (r.hit > 2.5) { ud++; if (r.hit >= 11) pOk *= 1 - Math.min(0.25, (r.hit - 11) / 20); }   // (puncture: its rule's chance per hard knock, core.js)
    fb -= DT; if (r.hit > 1.5 && fb <= 0) { zv++; fb = 0.16; }   // (game.js: Sfx.crash)
    if (k <= k0 + 240) wPk = Math.max(wPk, Math.abs(r.w));
    if (dz == null && r.touch && !r.tl && r.d * side < 0) dz = (k - k0) * DT;
    if (stop == null && sp(r) < 0.5) stop = (k - k0) * DT;
  }
  // straight again: 0.25 s with no touch, the yaw under 3 deg/s and the travel within 3 deg of the nose (or standing)
  let rav = null; for (let k = k0, run = 0; k < n; k++) { const r = rec[k], s = sp(r), ok = !r.touch && Math.abs(r.w) < 0.052 && (s < 0.5 || Math.abs(wrap(Math.atan2(r.vz, r.vx) - r.h)) < 0.052); run = ok ? run + 1 : 0; if (run >= 30) { rav = (k - 29 - k0) * DT; break; } }
  // clear of the barrier for good (0.3 m)
  let odm = null; for (let k = n - 1; k >= k0; k--) { if (rec[k].room < 0.3) { odm = k + 1 < n ? (k + 1 - k0) * DT : null; break; } if (k === k0) odm = 0; }
  const at = (t) => { const k = k0 + Math.round(t / DT); return k < n ? rec[k] : null; }, r5 = at(0.5), r2 = at(2), end = rec[n - 1];
  const dir = (r) => Math.atan2(-vn(r.vx, r.vz), vt(r.vx, r.vz)) * D, dn = vn0 - vn(a.vx, a.vz);
  let lastT = 0; for (let k = n - 1; k >= k0; k--) if (rec[k].touch) { lastT = k; break; }
  return Object.assign(key, {
    v0: v0 * 3.6, kotV: Math.atan2(vn0, vt0) * D, v1: sp(a) * 3.6, vL: kL >= 0 ? sp(L) * 3.6 : null, v5: r5 ? sp(r5) * 3.6 : null, v2: r2 ? sp(r2) * 3.6 : null, vK: sp(end) * 3.6,
    eN1: vn0 > 0.05 ? -vn(a.vx, a.vz) / vn0 : null, eNL: kL >= 0 && vn0 > 0.05 ? -vn(L.vx, L.vz) / vn0 : null,
    mu1: dn > 0.01 ? (vt0 - vt(a.vx, a.vz)) / dn : null, muS: o.mode !== 'dirka' && Jn > 0.01 ? Jt / Jn : null,
    E: kL >= 0 ? (1 - sp(L) * sp(L) / (v0 * v0)) * 100 : null, E1: (1 - sp(a) * sp(a) / (v0 * v0)) * 100, E5: r5 ? (1 - sp(r5) * sp(r5) / (v0 * v0)) * 100 : null,
    izh: kL >= 0 ? dir(L) : null, smer2: r2 && sp(r2) > 1 ? dir(r2) : null,
    dh: -side * wrap(L.h - h0) * D, dh1: -side * wrap(a.h - h0) * D, w: wPk * D, w1: -side * (a.w - a.pw) * D, rav, n: eps, zv, ud, drs: (kE - k0 + 1) * DT, drsOpen: kL < 0, utr: tog / Math.max(DT, (kE - k0 + 1) * DT), stik: tch / (kE - k0 + 1),
    pop: pop * 100, cez: over * 100, hit, hit1: hitFirst, g1: (v0 - sp(a)) / DT / G, sk: end.dmg * 100, gum: (1 - pOk) * 100, dz, stop,
    lep: o.inp === 'plin' && n - 1 - lastT < 60 && sp(end) < 2, odm, nazaj: r5 ? -vn(r5.vx, r5.vz) * 3.6 : null,
  });
}
// with rolling over on (Razbijanje: prevračanje) and every eligible knock rolling (XROLL.p 1, for the test: the game's is 1 in 10): does this crash roll the car?
function rolls(o) {
  const p = C.XROLL.p; C.setCrash({ roll: 1 }); C.XROLL.p = 1;
  try { const r = crash(Object.assign({}, o, { keep: true, secs: 2 })); return !!r.rec && r.rec.some(x => x.rl); } finally { C.setCrash(null); C.XROLL.p = p; }
}

// ---- printing ----
const f = (v, d = 0) => v == null ? '-' : typeof v === 'boolean' ? (v ? 'DA' : 'ne') : Number.isFinite(v) ? v.toFixed(d) : String(v);
function table(title, cols, rows, note) {
  if (AS_JSON) return;
  const cells = rows.map(r => cols.map(([k, , d]) => typeof d === 'function' ? d(r) : typeof r[k] === 'string' ? r[k] : f(r[k], d)));
  const w = cols.map(([, h], j) => Math.max(h.length, ...cells.map(r => r[j].length)));
  console.log('\n== ' + title);
  console.log(cols.map(([, h], j) => h.padStart(w[j])).join(' '));
  for (const r of cells) console.log(r.map((s, j) => s.padStart(w[j])).join(' '));
  if (note) console.log(note);
}
const COLS = [['fiz', 'fiz'], ['avto', 'avto'], ['tla', 'tla'], ['kot', 'kot', 0], ['kmh', 'km/h', 0], ['vnos', 'vnos'], ['v0', 'v0', 0], ['v1', 'v1', 0], ['vL', 'vL', 0], ['v5', 'v.5', 0], ['v2', 'v2', 0],
  ['eN1', 'eN1', 2], ['eNL', 'eNL', 2], ['mu1', 'mu1', 2], ['muS', 'muS', 2], ['E', 'E%', 0], ['izh', 'izh', 1], ['dh', 'dh', 0], ['w', 'w', 0], ['rav', 'rav', 2], ['n', 'n', 0], ['zv', 'zv', 0], ['ud', 'ud', 0],
  ['drs', 'drs', (r) => (r.drsOpen ? '>' : '') + f(r.drs, 2)], ['utr', 'utr', 0], ['pop', 'pop', 1], ['cez', 'cez', 1], ['hit', 'hit', 1], ['sk', 'sk', 0], ['gum', 'gum', 0], ['prv', 'prv'], ['dz', 'dz', 2], ['lep', 'lep'], ['odm', 'odm', 2]];
const pick = (...ks) => COLS.filter(c => ks.includes(c[0]));

const OUT = { cv: CV, numbers: { wallE: C.CSK.wallE, wallMu: C.CSK.wallMu, wallYaw: C.CSK.wallYaw }, cars: {} };
const ANG = [5, 15, 30, 60, 90], KMH = [60, 120, 200], PHYS = ['cs', 'nova'], want = (p) => !ONLY || ONLY === p;
for (const id of [ORD, LIGHT, TRUCK, RIG]) { const M = model(id); if (M) OUT.cars[id] = { name: M.name, mass: M.mass, len: M.len, wid: M.wid, kI: M.kI, trailer: M.trailer ? { mass: M.trailer.mass, len: M.trailer.len, wid: M.trailer.wid } : null }; }
if (!AS_JSON) {
  console.log(`Trki: avto v ograjo. Trki med avti: ${CV == null ? 'privzeta razlicica' : 'cv ' + CV} (${C.KV_IDS[CV == null ? 1 : CV] || '?'}); ograja: wallE ${C.CSK.wallE}, wallMu ${C.CSK.wallMu}, wallYaw ${C.CSK.wallYaw} (ena stevila za vse ograje in obe fiziki)`);
  console.log('Avti: ' + Object.entries(OUT.cars).map(([id, m]) => `${id} = ${m.name} ${m.mass} kg ${m.len} x ${m.wid} m` + (m.trailer ? ` + prikolica ${m.trailer.mass} kg ${m.trailer.len} m` : '')).join('; '));
}

// ---- 1. the matrix: three cars, both physics, both roads, five angles, three speeds, both inputs ----
if (want('matrika')) {
  const rows = OUT.matrika = [];
  for (const tla of ['asfalt', 'trava']) { const T = road(tla), i = T.nearestIdx(750, 0);
    for (const phys of PHYS) for (const id of [ORD, LIGHT, TRUCK]) for (const th of ANG) for (const kmh of KMH) for (const inp of ['nic', 'plin']) {
      const o = { T, i, side: 1, id, phys, th, kmh, inp, tla, mode: 'sam' }, r = crash(o);
      r.prv = inp === 'nic' ? rolls(o) : null;
      rows.push(r);
    } }
  const T = road('asfalt'), i = T.nearestIdx(750, 0), q = T.query(T.px[i] + T.nx[i] * (T.br[i] - 0.5), T.pz[i] + T.nz[i] * (T.br[i] - 0.5), i, {}), Tg = road('trava'), qg = Tg.query(Tg.px[i] + Tg.nx[i] * (Tg.br[i] - 0.5), Tg.pz[i] + Tg.nz[i] * (Tg.br[i] - 0.5), i, {});
  OUT.ceste = { asfalt: { w: T.w, br: T.br[i], bl: T.bl[i], podlaga: T.surface(q) }, trava: { w: Tg.w, br: Tg.br[i], bl: Tg.bl[i], podlaga: Tg.surface(qg) } };
  if (!AS_JSON) console.log(`Cesti: asfalt: pol sirine ${T.w} m, ograja desno ${f(T.br[i], 1)} m od sredine (podlaga ob njej ${T.surface(q)} = asfalt), levo ${f(T.bl[i], 1)} m; trava: ograji ${f(Tg.br[i], 1)} m (podlaga ob njej ${Tg.surface(qg)} = trava)`);
  const sel = (p) => rows.filter(p);
  table(`MATRIKA 1a: ${ORD}, klasicna fizika (cs), asfalt ob ograji, brez vnosa`, COLS.slice(3), sel(r => r.avto === ORD && r.fiz === 'cs' && r.tla === 'asfalt' && r.vnos === 'nic'));
  table(`MATRIKA 1b: ${ORD}, cs, asfalt, poln plin in volan stran od ograje`, COLS.slice(3), sel(r => r.avto === ORD && r.fiz === 'cs' && r.tla === 'asfalt' && r.vnos === 'plin'));
  table(`MATRIKA 1c: ${ORD}, nova fizika, asfalt`, COLS.slice(3), sel(r => r.avto === ORD && r.fiz === 'nova' && r.tla === 'asfalt'));
  table(`MATRIKA 1d: ${ORD}, 4 m trave pred ograjo, obe fiziki`, [COLS[0]].concat(COLS.slice(3)), sel(r => r.avto === ORD && r.tla === 'trava'));
  table(`MATRIKA 1e: najlazji avto (${LIGHT}) in tovornjak (${TRUCK}), asfalt, obe fiziki`, COLS.slice(0, 2).concat(COLS.slice(3)), sel(r => r.avto !== ORD && r.tla === 'asfalt'));
  table(`MATRIKA 1f: najlazji avto in tovornjak, trava`, COLS.slice(0, 2).concat(COLS.slice(3)), sel(r => r.avto !== ORD && r.tla === 'trava'));
}

// ---- 2. the semi-trailer: Race.step (its walls and kingpin: Race._tlStep), the wide road ----
if (want('prikolica') && RIG) {
  const rows = OUT.prikolica = [], T = road('siroka'), i = T.nearestIdx(750, 0);
  for (const phys of PHYS) for (const th of ANG) for (const kmh of KMH) for (const inp of ['nic', 'plin']) {
    const r = crash({ T, i, side: 1, id: RIG, phys, th, kmh, inp, tla: 'asfalt', mode: 'dirka', keep: true }), c = r.car, R = c.tl;
    r.tlStik = r.rec.filter(x => x.tl).length * DT; r.fold = R ? Math.abs(R.fold || 0) * D : null;   // (the fold at the end, deg)
    r.kotP = R ? Math.abs(wrap(R.h - c.h)) * D : null;
    delete r.rec; delete r.car; delete r.F; rows.push(r);
  }
  // the same tractor without its trailer, through the race too (what the trailer changes)
  const solo = OUT.prikolicaBrez = [];
  for (const phys of PHYS) for (const th of [15, 30, 90]) for (const kmh of [120]) solo.push(crash({ T, i, side: 1, id: TRUCK, phys, th, kmh, inp: 'nic', tla: 'asfalt', mode: 'dirka' }));
  const cols = pick('fiz', 'kot', 'kmh', 'vnos', 'v0', 'v1', 'vL', 'v5', 'v2', 'eN1', 'E', 'izh', 'dh', 'w', 'rav', 'n', 'zv', 'ud', 'drs', 'utr', 'hit', 'sk', 'dz', 'lep', 'odm').concat([['tlStik', 'prik.s', 2], ['kotP', 'zlom', 0]]);
  table(`PRIKOLICA: ${RIG} (vlacilec s polprikolico), siroka cesta, asfalt ob ograji; nacin 'dirka' (Race.step); prik.s: koliko casa se ograje dotika prikolica; zlom: kot med vlacilcem in prikolico na koncu (deg)`, cols, rows);
  table(`PRIKOLICA: isti vlacilec brez prikolice (${TRUCK}), nacin 'dirka'`, pick('fiz', 'kot', 'kmh', 'vnos', 'v0', 'v1', 'vL', 'v5', 'v2', 'eN1', 'E', 'izh', 'dh', 'w', 'rav', 'n', 'ud', 'drs', 'hit', 'sk'), solo);
}

// ---- 3. the other barriers: a roundabout's island, the ends of an open road, a drop's edge, the new map's edge and tunnel wall, the pit wall ----
if (want('posebne')) {
  const rows = OUT.posebne = [], add = (kaj, r, extra) => { rows.push(Object.assign({ kaj }, r, extra)); };
  // a roundabout's island (def.rings; the game's Track rule): a solid circle in the middle of the road
  { const T = road('trava', { rings: [{ c: [750, 0], r: 12, hw: 3 }] }), R = T.rings[0];
    for (const [kmh, off, kaj] of [[60, 0, 'otok kroznega: celno v sredino'], [120, 0, 'otok kroznega: celno v sredino'], [120, R.ri - 0.6, 'otok kroznega: oplazi (0,6 m globoko)']])
      for (const phys of PHYS) add(kaj + ` (ri ${f(R.ri, 1)} m)`, crash({ T, x: 750 - R.ri - 2.6, z: off, h: 0, side: 1, id: ORD, phys, kmh, inp: 'nic', mode: 'sam', noRoom: true }));
  }
  // the ends of an open road: walls across it 0.5 m in from its last samples
  { const pts = []; for (let x = 0; x <= 1200; x += 100) pts.push([x, 0]);
    const T = new C.Track({ id: 'zid-odprta', name: 'Ravnina, Preizkus', open: true, halfWidth: 6, points: pts, startX: 50, edgeBar: 4, drops: [[300, 700, 1]] });
    for (const kmh of [60, 120]) for (const phys of PHYS) add('konec odprte ceste: celno', crash({ T, x: T.px[T.N - 1] - 0.5 - model(ORD).len / 2 - 0.3, z: 0, h: 0, side: 1, id: ORD, phys, kmh, inp: 'nic', mode: 'sam', noRoom: true }));
    for (const phys of PHYS) add('zacetek odprte ceste: vzvratno 30 km/h', crash({ T, x: T.px[0] + 0.5 + model(ORD).len / 2 + 0.3, z: 0, h: 0, side: 1, id: ORD, phys, kmh: -30, inp: 'nic', mode: 'sam', noRoom: true }));
    // the edge of a drop (def.drops, open roads): no barrier; out over it at more than 2.5 m/s the car falls, slower the edge holds it as a wall
    const i = T.nearestIdx(550, 0), e = T.w + 1.2;
    OUT.prepad = { rob: T.br[i] - T.w, dropAt: T.dropAt ? T.dropAt[1][i] : 0 };
    for (const [th, kmh] of [[5, 60], [5, 120], [15, 30], [15, 60], [30, 120]]) for (const phys of ['cs']) {
      const r = crash({ T, i, side: 1, id: ORD, phys, th, kmh, inp: 'nic', mode: 'sam' });
      add(`rob prepada (${f(OUT.prepad.rob, 1)} m od asfalta), ${th} deg`, r, { pade: r.fell != null });
    }
  }
  // the new map (track.free): its edge clamps the car's middle (no bounce, no rub, no hitWall); its tunnel's walls (track.wall2) go through
  // the same impulse as a barrier. The map itself is the browser's (js/newmap.js): here the game's Track with the two fields set, no more
  { const T = road('trava', { id: 'zid-free' }); T.free = [-1e4, 1e4, -1e4, 3];   // (the map's edge at z = 3)
    for (const phys of PHYS) add('rob nove mape (track.free): 30 deg', crash({ T, x: 750, z: 0, h: 30 / D, side: 1, id: ORD, phys, kmh: 120, inp: 'nic', mode: 'sam', noRoom: true, touch: (c) => c.z >= 3 - 1e-9 }));   // (no wallCollide contact to see: the middle held at the edge)
    const T2 = road('trava', { id: 'zid-wall2' }); T2.free = [-1e4, 1e4, -1e4, 1e4]; T2.wall2 = (x, z, y, out) => { if (z <= 3) return false; out[0] = 0; out[1] = -1; out[2] = z - 3; return true; };   // (a wall along z = 3)
    for (const [th, kmh] of [[15, 120], [90, 120]]) for (const phys of PHYS) { const c0 = model(ORD), th2 = th / D, reach = c0.len / 2 * Math.sin(th2) + c0.wid / 2 * Math.cos(th2);
      add(`stena predora nove mape (track.wall2): ${th} deg`, crash({ T: T2, x: 750, z: 3 - 0.3 - reach, h: th2, th, side: 1, id: ORD, phys, kmh, inp: 'nic', mode: 'sam', noRoom: true })); }
  }
  table('POSEBNE OGRAJE (avto ' + ORD + ', brez vnosa)', [['kaj', 'kaj'], ['fiz', 'fiz']].concat(pick('kmh', 'v0', 'v1', 'vL', 'v5', 'v2', 'eN1', 'mu1', 'E', 'izh', 'dh', 'w', 'n', 'ud', 'drs', 'pop', 'hit', 'sk')).concat([['pade', 'pade'], ['stop', 'stoji po', 2]]), rows);
}

// ---- 4. real tracks: the same crash on Spa and Bathurst (the two modes agree to the bit), and the first barrier of a seeded race ----
if (want('proga')) {
  const rows = OUT.proga = [], same = OUT.enakost = [];
  // a straight stretch of a real track: the straightest 120 m with a steady barrier on the side, m after the start line
  const straight = (T, side, from, to, pit) => { let best = -1, bk = 1e9; const B = side > 0 ? T.br : T.bl;
    for (let d = from; d < to; d += 10) { const i = T.idx(T.startS + d); let k = 0; for (let e = -60; e <= 60; e += 6) { const j = T.idx(T.startS + d + e); k = Math.max(k, Math.abs(T.k[j]) * 400 + Math.abs(B[j] - B[i])); }
      const inPit = !!(T.def.pit && T.pitAt(T.startS + d)); if (inPit !== !!pit) continue; if (k < bk) { bk = k; best = d; } }
    return best; };
  for (const [tid, side, from, to, pit, kaj] of [['spa', 1, -200, 150, true, 'zid boksov'], ['spa', -1, 1200, 2300, false, 'ravnina'], ['bathurst', -1, 400, 1250, false, 'ravnina'], ['bathurst', 1, 1750, 3800, false, 'zid na gori']]) {
    const T = realTrack(tid), d = straight(T, side, from, to, pit), i = T.idx(T.startS + d), B = side > 0 ? T.br[i] : T.bl[i], w = T.wAt(i), q = T.query(T.px[i] + T.nx[i] * side * (B - 0.5), T.pz[i] + T.nz[i] * side * (B - 0.5), i, {});
    const grade = T.hasElev ? T.elevAt(T.startS + d, {}).grade : 0, info = { proga: tid, kje: `${kaj} ${f(d)} m`, rob: B - w, podl: T.surface(q), klanec: grade * 100 };
    for (const phys of PHYS) for (const [th, kmh] of [[15, 120], [30, 120], [90, 60]]) {
      const o = { T, i, side, id: ORD, phys, th, kmh, inp: 'nic', keep: true }, a = crash(Object.assign({ mode: 'sam' }, o)), b = crash(Object.assign({ mode: 'dirka' }, o));
      const ea = a.rec[a.rec.length - 1], eb = b.rec[b.rec.length - 1], dif = Math.max(Math.abs(ea.x - eb.x), Math.abs(ea.z - eb.z), Math.abs(ea.h - eb.h), Math.abs(ea.vx - eb.vx), Math.abs(ea.vz - eb.vz), Math.abs(ea.w - eb.w));
      same.push({ proga: tid, kje: info.kje, fiz: phys, kot: th, kmh, razlika: dif });
      delete a.rec; delete a.car; delete a.F; rows.push(Object.assign({}, info, a));
    }
  }
  // the same crashes on the test oval, for the comparison
  for (const tla of ['asfalt', 'trava']) for (const phys of PHYS) for (const [th, kmh] of [[15, 120], [30, 120], [90, 60]]) { const T = road(tla), i = T.nearestIdx(750, 0);
    rows.push(Object.assign({ proga: 'oval', kje: tla, rob: T.br[i] - T.w, podl: tla === 'asfalt' ? 0 : 2, klanec: 0 }, crash({ T, i, side: 1, id: ORD, phys, th, kmh, inp: 'nic', mode: 'sam' }))); }
  rows.sort((a, b) => (a.fiz < b.fiz ? -1 : a.fiz > b.fiz ? 1 : 0) || a.kot - b.kot);
  table(`PROGA: isti trk (${ORD}, brez vnosa) na pravih progah in na ovalu; rob: ograja od roba asfalta (m), podl: podlaga pol metra pred ograjo (0 asfalt, 2 trava, 3 pesek, 4 tlak), klanec %`,
    [['proga', 'proga'], ['kje', 'kje'], ['rob', 'rob', 1], ['podl', 'podl', 0], ['klanec', 'klanec', 1], ['fiz', 'fiz']].concat(pick('kot', 'kmh', 'v0', 'v1', 'vL', 'v5', 'v2', 'eN1', 'mu1', 'muS', 'E', 'izh', 'dh', 'w', 'rav', 'n', 'ud', 'drs', 'pop', 'hit', 'sk')), rows);
  table("PROGA: nacin 'sam' proti Race.step ('dirka'): najvecja razlika stanja (x, z, h, vx, vz, w) po 7 s", [['proga', 'proga'], ['kje', 'kje'], ['fiz', 'fiz'], ['kot', 'kot', 0], ['kmh', 'km/h', 0], ['razlika', 'razlika', (r) => r.razlika === 0 ? '0 (do bita)' : r.razlika.toExponential(2)]], same);

  // a seeded race (tests/lib/sim.js, the 'crash' set-up: 12 rivals, the player on the autopilot, from 6 s full throttle and full left lock): the
  // player's first barrier, as Race.step made it; then the same hit on the oval (the same speed and angle, nose along the travel)
  const real = OUT.dirka = [];
  for (const tid of ['spa', 'bathurst']) for (const phys of PHYS) {
    const orig = Math.random; let got = null;
    try {
      Math.random = SIM.seeded(7); const race = SIM.makeRace(C, tid, (C2, tt, t) => SIM.SETUPS.crash.opts(C2, tt, phys, t)), P = race.player, T = race.track; let prev = null; const seq = [];
      for (let k = 1; k <= 30 * 120 && (!got || seq.length < 241); k++) {
        P.wallX = NaN; prev = { vx: P.vx, vz: P.vz, w: P.w, h: P.h, x: P.x, z: P.z, q: { d: P.q.d, tx: P.q.tx, tz: P.q.tz, nx: P.q.nx, nz: P.q.nz, br: P.q.br, bl: P.q.bl } };
        SIM.stepRace(C, race, k, SIM.SETUPS.crash.drive);
        const touch = !Number.isNaN(P.wallX);
        if (!got && touch) { const sd = prev.q.d > 0 ? 1 : -1, mx = sd * prev.q.nx, mz = sd * prev.q.nz, tx = prev.q.tx, tz = prev.q.tz, vn0 = prev.vx * mx + prev.vz * mz, vt0 = prev.vx * tx + prev.vz * tz, sg = vt0 < 0 ? -1 : 1;
          got = { proga: tid, fiz: phys, t: k * DT, v0: Math.hypot(prev.vx, prev.vz) * 3.6, kot: Math.atan2(vn0, Math.abs(vt0)) * D, zdrs: wrap(Math.atan2(prev.vz, prev.vx) - prev.h) * D, w0: prev.w * D,
            v1: P.speed * 3.6, eN1: -(P.vx * mx + P.vz * mz) / vn0, mu1: (vt0 - (P.vx * tx + P.vz * tz)) * sg / (vn0 - (P.vx * mx + P.vz * mz)), hit: P.hitWall, dmg0: P.dmg, mx, mz }; }
        if (got) { seq.push({ v: P.speed, touch, dmg: P.dmg }); }
        P.hitWall = 0; P.hitCar = 0;
      }
      if (got) { got.v5 = seq[60] ? seq[60].v * 3.6 : null; got.v2 = seq[240] ? seq[240].v * 3.6 : null; got.stik2 = seq.slice(0, 241).filter(s => s.touch).length * DT; got.sk = (seq[seq.length - 1].dmg - got.dmg0) * 100; delete got.mx; delete got.mz; delete got.dmg0; real.push(got);
        const To = road('trava'), i = To.nearestIdx(750, 0), r = crash({ T: To, i, side: 1, id: P.m.id, phys, th: Math.max(1, got.kot), kmh: got.v0, inp: 'plin', mode: 'sam', drive: (c, k, k0) => { c.inSteer = 1; } });   // (the lock into the barrier, as the race's driver holds it)
        real.push({ proga: 'oval (isti kot, hitrost)', fiz: phys, t: null, v0: r.v0, kot: r.kotV, zdrs: 0, w0: 0, v1: r.v1, eN1: r.eN1, mu1: r.mu1, hit: r.hit1, v5: r.v5, v2: r.v2, stik2: null, sk: null }); }
    } finally { Math.random = orig; }
  }
  table("PROGA: prva ograja igralca v dirki s semenom (tests/lib/sim.js, postavitev 'crash': poln plin in volan do konca levo od 6. s) in isti udarec na ovalu; zdrs: kot med potjo in nosom (deg), w0: zasuk pred udarcem (deg/s), stik2: stik v prvih 2 s (s)",
    [['proga', 'proga'], ['fiz', 'fiz'], ['t', 't', 2], ['v0', 'v0', 0], ['kot', 'kot', 1], ['zdrs', 'zdrs', 1], ['w0', 'w0', 0], ['v1', 'v1', 0], ['eN1', 'eN1', 2], ['mu1', 'mu1', 2], ['hit', 'hit', 1], ['v5', 'v.5', 0], ['v2', 'v2', 0], ['stik2', 'stik2', 2], ['sk', 'sk', 0]], real);
}

if (AS_JSON) console.log(JSON.stringify(OUT, (k, v) => typeof v === 'number' && Number.isFinite(v) ? +v.toFixed(4) : v));
