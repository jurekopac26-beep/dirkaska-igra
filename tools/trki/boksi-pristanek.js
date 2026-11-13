// Trki: boksi, pristanki, prevracanje, padec, skoda, zanka dirke, prijatelji na spletu. ANALYSIS ONLY (the topic »bolj realisticni trki«,
// 9. 11. 2026): what the game does now, measured with the game's own code, for the plan of a more realistic collision version. Nothing here
// changes the game; the same script measures a future version (--cv).
//   node tools/trki/boksi-pristanek.js              every part, compact tables
//   node tools/trki/boksi-pristanek.js --json       the same results as JSON on stdout
//   node tools/trki/boksi-pristanek.js --cv 3       a collision version chosen (Core.setTest({ cv }): 1 Simulacija, 2 Arkadna, 3 Mehka,
//                                                   4 Kaskaderska, 5 Stara, 6 Realisticna; without it the game's default)
//   node tools/trki/boksi-pristanek.js --del zanka  one part only: boksi, pristanek, padec, prevracanje, skoda, zanka, splet
// The parts and how each measures (the physics is never written again here; only states are read before and after the game's own calls):
// - boksi: (1) a seeded race on Spa and Bathurst (Race.step, 12 rivals, the player on the autopilot), every car sent in for a stop: what the
//   cars in the pit lane do to each other (Race.pitStep's ghosts, c.pitG); (2) the same contact at the pit lane's speed limit (Core.PIT_V)
//   on the flat test plane (tests/lib/handling.js), two cars stepped as a race steps them (both drive, then Core.carCollide), once with
//   c.inPit set (the old knock, carCollide's own branch) and once without (the version's knock, kCollide); (3) the player's car in Spa's and
//   Bathurst's real pit lane (Race.step) into the pit wall and the lane's outer limit at 15 and 30 deg, and the same hit on the circuit's barrier
// - pristanek: a car in the air over a road with heights (the test plane with hasElev and its own elevAt: flat, a slope, a crest), Car.step;
//   cross-checked on Spa's and Bathurst's real heights in a Race; the crests of the game's real tracks read from their heights (nothing driven)
// - padec: the game's Track from this script's straight open road with a drop (def.drops; the only track of the game with drops is a frozen
//   test track), the player's car over the edge in a Race (wallCollide's edge, Race._fall, Race.rescue)
// - prevracanje: Core.setCrash({ roll: 1 }) (Razbijanje - nov nacin, off by default): the thresholds and the one-in-ten draw by direct
//   Core.carCollide / Core.wallCollide calls over many cars, what a roll does (Car.step: xRollStep), how often in seeded races
// - skoda: what a knock of a given strength does to the damage (Core.carCollide, Race.step into Spa's barrier, a landing, a fall), and what a
//   damaged car drives like with damage Samo videz (1) and Vklop (2), the crushed corner's pull and bent wheel (Vklop), the formula's wings, a puncture
// - zanka: the pair checks of a step with 12, 20 and 100 cars (a seeded race on Spa; Race._pairs counted through the race's own method) and the
//   time the collision calls take in Node (process.hrtime: the timings change from run to run, the counts do not)
// - splet: two phones, each with its own car and the friend's car as the game places it (netPlace, read out of js/game.js as text and run
//   as it is; the states sent 20 times a second, rounded as netFrame rounds them, played back 100 ms in the past): the same contact
//   offline (both cars local) and online; cross-checked with two real Races on Spa (Race opts.remote)
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));
const handling = require(path.join(ROOT, 'tests', 'lib', 'handling.js'));

const args = process.argv.slice(2), opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const CV = opt('--cv') != null && Number.isFinite(+opt('--cv')) ? +opt('--cv') : null, AS_JSON = args.includes('--json'), ONLY = opt('--del');
const C = loadCore();
Math.random = SIM.seeded(20261109);   // (whatever the core draws outside a race's own numbers: a fixed sequence)
const setCv = (extra) => C.setTest(Object.assign(CV != null ? { cv: CV } : {}, extra));
setCv();

const DT = 1 / 120, D = 180 / Math.PI, G = 9.81;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const model = (id) => C.MODELS.find(m => m.id === id);
const sp = (c) => Math.hypot(c.vx, c.vz);
const f = (v, d = 1) => (v == null ? '-' : typeof v !== 'number' ? String(v) : Number.isFinite(v) ? v.toFixed(d) : '-');
const VERSION = () => C.KV_IDS[C.TX.cv != null ? C.TX.cv : 1] || 'sim';
const OUT = { cv: CV, version: VERSION(), deli: {} };
const LOG = [];
const say = (s) => { if (!AS_JSON) console.log(s); else LOG.push(s); };
// a compact table: head = column names, rows = arrays of cells
function table(title, head, rows) {
  const w = head.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i]).length)));
  say('\n' + title);
  say(head.map((h, i) => h.padEnd(w[i])).join('  '));
  for (const r of rows) say(r.map((x, i) => String(x).padEnd(w[i])).join('  '));
}
const _tr = {};
const track = (id) => _tr[id] || (_tr[id] = new C.Track(C.TRACKS.find(d => d.id === id)));
const RIG = { cs: handling(C, 'cs'), nova: handling(C, 'nova') };
// the test plane's car as the tests make it (tests/trki.test.js)
function rigCar(H, id, kmh, pl) { const c = H.mkCar(id, { v: kmh }); c.isPlayer = !!pl; c.noReverse = true; c.dmgMode = 2; c.hitCar = 0; c.hitWall = 0; return c; }
const lane = (c, z0) => Math.max(-1, Math.min(1, -(0.35 * (c.z - z0) + 2.0 * c.h + 0.25 * c.vz / Math.max(5, c.speed || sp(c)))));
// the overlap of two cars' boxes (m; 0 apart): separating axes, for the measurements only
function boxOverlap(a, b) {
  const ax = [[Math.cos(a.h), Math.sin(a.h)], [-Math.sin(a.h), Math.cos(a.h)], [Math.cos(b.h), Math.sin(b.h)], [-Math.sin(b.h), Math.cos(b.h)]], dx = b.x - a.x, dz = b.z - a.z;
  let ov = 1e9;
  for (const [lx, lz] of ax) {
    const ra = a.m.len / 2 * Math.abs(ax[0][0] * lx + ax[0][1] * lz) + a.m.wid / 2 * Math.abs(ax[1][0] * lx + ax[1][1] * lz), rb = b.m.len / 2 * Math.abs(ax[2][0] * lx + ax[2][1] * lz) + b.m.wid / 2 * Math.abs(ax[3][0] * lx + ax[3][1] * lz);
    const o = ra + rb - Math.abs(dx * lx + dz * lz); if (o <= 0) return 0; if (o < ov) ov = o;
  }
  return ov;
}
// a race as tests/trki.test.js makes it (12 rivals, the player 12th on the autopilot, seeded)
function mkRace(tid, o) {
  Math.random = SIM.seeded(64);
  const r = new C.Race(track(tid), Object.assign({ numAI: 12, playerGrid: 12, laps: 5, playerModel: model('rally'), assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }, o));
  r.start(); return r;
}
const stepAuto = (r, k) => { Math.random = SIM.seeded(1000 + k); if (r.player) C.aiControl(r.player, r, DT); r.step(DT); };
// a lone car of a race: the player's, no rivals, no start procedure, placed by this script and driven by fixed inputs
function loneRace(T, id, o) {
  Math.random = SIM.seeded(64);
  const r = new C.Race(T, Object.assign({ numAI: 0, playerGrid: 1, laps: 99, playerModel: model(id), assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs', launch: false, fuel: false, slip: false, flags: false, chars: false, faults: false }, o));
  r.start(); return r;
}
function placeCar(c, T, x, z, h, v) {
  c.place(x, z, h); c.locked = false; c.steer = 0; c.inSteer = c.inThr = c.inBrk = c.inHand = 0; c.digitalSteer = false;
  c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v;
  const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
  T.query(c.x, c.z, -1, c.q); if (T.hasElev) { const e = T.elevAt(c.q.s); c.y = c.py = c.roadY = e.y; }
  c.sPrev = c.q.s; c.hitWall = 0; c.hitCar = 0;
}
// a straight piece of a circuit away from its pit lane (a sample index): the gentlest 120 m, the barrier's distance steady
function straightIdx(T) {
  let best = -1, bk = 1e9;
  for (let i = 60; i < T.N - 60; i += 5) {
    const s = i * T.ds; if (T.def.pit && (T.pitAt(s) || T.pitLead(s) > 0)) continue;
    let k = 0; for (let j = -30; j <= 30; j++) k = Math.max(k, Math.abs(T.k[i + j]), Math.abs(T.br[i + j] - T.br[i]) * 0.01, T.curb && T.curb[i + j] ? 1 : 0);
    if (k < bk) { bk = k; best = i; }
  }
  return best;
}

/* ============================================================ boksi ============================================================ */
// (1) the race: every car sent in (pitWant) 5 s after the start; the flags as they were when the step's pair loop ran (before the step)
function boksiDirka(tid, secs) {
  const r = mkRace(tid), cars = r.cars, n = Math.round(secs / DT);
  const o = { proga: tid, s: secs, vStezi: 0, hkrati: 0, staTrk: 0, trki: 0, prekrivanje: 0, prekrivanjeMaks: 0, sProgo: 0, sProgoMaks: 0, zid: 0, zidMaks: 0, skoda: 0, postanki: 0 };
  const fl = cars.map(() => [false, false]), d0 = cars.map(() => 0), onWall = cars.map(() => false);
  for (let k = 1; k <= n; k++) {
    if (k === 600) for (const c of cars) c.pitWant = true;
    cars.forEach((c, i) => { fl[i][0] = !!c.inPit; fl[i][1] = !!c.pitG; d0[i] = c.dmg; c.hitCar = 0; c.hitWall = 0; });
    stepAuto(r, k);
    let m = 0;
    cars.forEach((c, i) => {
      const [ip, pg] = fl[i];
      if (ip) { o.vStezi++; m++; if (!pg) o.staTrk++; }   // (inPit without pitG at the pair loop: the only state in which carCollide's old knock would run for a pair)
      if (pg && c.pitG && c.hitCar > 0) o.trki++;
      if (pg && c.pitG && c.hitWall > 0) { if (!onWall[i]) o.zid++; o.zidMaks = Math.max(o.zidMaks, c.hitWall); } onWall[i] = pg && c.pitG && c.hitWall > 0;
      if (pg && c.pitG && c.dmg > d0[i]) o.skoda++;
    });
    o.hkrati = Math.max(o.hkrati, m);
    for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j]; if (!(a.pitG || b.pitG) || Math.hypot(a.x - b.x, a.z - b.z) > 8) continue;
      const ov = boxOverlap(a, b); if (ov < 0.05) continue;
      if (a.pitG && b.pitG) { o.prekrivanje++; o.prekrivanjeMaks = Math.max(o.prekrivanjeMaks, ov); } else { o.sProgo++; o.sProgoMaks = Math.max(o.sProgoMaks, ov); }
    }
  }
  o.postanki = r.pst.log.length;
  return o;
}
// (2) two cars on the plane at the pit lane's speed, stepped as a race steps them. S: { P, O, iP(t), iO(t) }; pit: both carry inPit (carCollide's
// old knock). Read off the states around every Core.carCollide call: the push each call gave (momentum, energy), the first knock's closing
// and parting speed along the push, and the cars afterwards
function dvoboj(H, mk, pit, secs) {
  const S = mk(H), P = S.P, O = S.O; if (pit) P.inPit = O.inPit = true;
  const snap = () => [P.x, P.z, P.vx, P.vz, P.w, P.csKc || 0, O.x, O.z, O.vx, O.vz, O.w, O.csKc || 0];
  const mP = P.m.mass + (P.fuelKg || 0), mO = O.m.mass + (O.fuelKg || 0), ke = () => 0.5 * mP * (P.vx * P.vx + P.vz * P.vz) + 0.5 * mO * (O.vx * O.vx + O.vz * O.vz);
  const R = { hit: false, t1: null, n: 0, pop: 0, dE: 0, dpx: 0, dpz: 0, e1: null, vn1: null, latP: 0, latO: 0, turnP: 0, turnO: 0, kickP: 0, kickO: 0, glP: 0, glO: 0 };
  let hP = P.h, hO = O.h, vP0 = [P.vx, P.vz], vO0 = [O.vx, O.vz];
  for (let i = 1; i <= secs / DT; i++) {
    const t = i * DT; H.step(P, S.iP(t, R.t1)); H.step(O, S.iO(t, R.t1));
    const b = snap(), e0 = ke(); C.carCollide(P, O); const a = snap(), touch = a.some((x, k) => x !== b[k]);
    if (touch) {
      R.n++; R.pop = Math.max(R.pop, Math.hypot(a[0] - b[0], a[1] - b[1]), Math.hypot(a[6] - b[6], a[7] - b[7])); R.dE += ke() - e0;
      R.dpx += mP * (a[2] - b[2]) + mO * (a[8] - b[8]); R.dpz += mP * (a[3] - b[3]) + mO * (a[9] - b[9]);
      const jx = a[2] - b[2], jz = a[3] - b[3], jl = Math.hypot(jx, jz);
      if (R.e1 == null && jl > 1e-6) { const nx = jx / jl, nz = jz / jl, c0 = -((b[2] - b[8]) * nx + (b[3] - b[9]) * nz), c1 = (a[2] - a[8]) * nx + (a[3] - a[9]) * nz; R.vn1 = c0; R.e1 = c0 > 1e-6 ? c1 / c0 : null; }
      if (R.t1 == null) { R.t1 = t; R.hit = true; }
    }
    if (R.t1 == null) { hP = P.h; hO = O.h; vP0 = [P.vx, P.vz]; vO0 = [O.vx, O.vz]; continue; }
    R.latP = Math.max(R.latP, Math.abs(-(P.vx - vP0[0]) * Math.sin(hP) + (P.vz - vP0[1]) * Math.cos(hP))); R.latO = Math.max(R.latO, Math.abs(-(O.vx - vO0[0]) * Math.sin(hO) + (O.vz - vO0[1]) * Math.cos(hO)));
    R.turnP = Math.max(R.turnP, Math.abs(wrap(P.h - hP)) * D); R.turnO = Math.max(R.turnO, Math.abs(wrap(O.h - hO)) * D);
    R.kickP = Math.max(R.kickP, Math.abs(P.csKc || 0) * D); R.kickO = Math.max(R.kickO, Math.abs(O.csKc || 0) * D);
    R.glP = Math.max(R.glP, P.xgl || 0); R.glO = Math.max(R.glO, O.xgl || 0);
  }
  const mu = mP * mO / (mP + mO);
  return Object.assign(R, { vP: sp(P) * 3.6, vO: sp(O) * 3.6, dmgP: P.dmg * 100, dmgO: O.dmg * 100, dp: Math.hypot(R.dpx, R.dpz) / (mu * Math.max(0.1, R.vn1 || 0.1)) * 100, dEkJ: R.dE / 1000 });
}
function boksiScene(id) {
  const V = C.PIT_V * 3.6, v = C.PIT_V, M = model(id);
  return {
    // the car behind at the limit into a car 20 km/h slower, centred; both hold their speed and their lane
    'zadaj 80 v 60': (H) => { const P = rigCar(H, id, V, true), O = rigCar(H, id, V - 20, false); O.place(0, 0, 0); O.vx = v - 20 / 3.6; P.place(-M.len - 0.3, 0, 0); P.vx = v; return { P, O, iP: () => ({ st: lane(P, 0), thr: 'hold' }), iO: () => ({ st: lane(O, 0), thr: 'hold' }) }; },
    // the car at the limit into a car standing in the lane (at its box), centred; nobody on a pedal
    'zadaj 80 v stojecega': (H) => { const P = rigCar(H, id, V, true), O = rigCar(H, id, 0, false); O.place(0, 0, 0); P.place(-M.len - 0.3, 0, 0); P.vx = v; return { P, O, iP: () => ({ st: 0, thr: 0 }), iO: () => ({ st: 0, thr: 0 }) }; },
    // side by side at the limit, the rival drifts into the player's flank at 3 deg and goes back to its lane after 0.4 s
    'bok ob boku 3 deg': (H) => { const P = rigCar(H, id, V, true), O = rigCar(H, id, V, false), a = -0.052, z0 = M.wid + 0.35; P.place(0, 0, 0); P.vx = v; O.place(0.5, z0, a); O.vx = v * Math.cos(a); O.vz = v * Math.sin(a);
      return { P, O, iP: () => ({ st: 0, thr: 'hold' }), iO: (t) => ({ st: t < 0.4 ? 0 : lane(O, z0), thr: 'hold' }) }; },
    // the player pulls out of its box at 30 km/h, 20 deg across the lane, into the flank of a car passing at the limit
    'izvoz 30 v bok 80': (H) => { const P = rigCar(H, id, 30, true), O = rigCar(H, id, V, false), a = -0.35, vp = 30 / 3.6, zc = M.wid / 2 + 1.0;   // (P's leading corner 1 m from O's flank)
      const cz = Math.sin(a) * M.len / 2 - Math.cos(a) * M.wid / 2, cx = Math.cos(a) * M.len / 2 + Math.sin(a) * M.wid / 2, zp = zc - cz, tt = 1.0 / (vp * Math.sin(-a)), xo = 0;
      O.place(xo, 0, 0); O.vx = v; P.place(xo + v * tt - cx - vp * Math.cos(a) * tt, zp, a); P.vx = vp * Math.cos(a); P.vz = vp * Math.sin(a);
      return { P, O, iP: () => ({ st: 0, thr: 'hold' }), iO: () => ({ st: lane(O, 0), thr: 'hold' }) }; },
  };
}
// (3) the pit lane's limits on a real circuit: the player's car in the lane (inPit and the ghost flag as Race.pitStep sets them), d m after
// the start line, its travel at th deg to the limit, the leading corner 0.3 m short of it; kam: 'zid' the pit wall's side (Track.pitAt's
// inner), 'zunaj' the lane's outer limit (lout, by the garages), 'proga' the circuit's barrier on a straight (not in the pits: the reference)
function zidBoksi(tid, kam, th, kmh, phys) {
  const T = track(tid), r = loneRace(T, 'rally', { phys }), c = r.player, a = th / D, reach = c.m.len / 2 * Math.sin(a) + c.m.wid / 2 * Math.cos(a);
  let i, qd, h, mx, mz, lim;
  if (kam === 'proga') { i = straightIdx(T); lim = T.br[i]; qd = lim - 0.3 - reach; h = T.hd[i] + a; mx = T.nx[i]; mz = T.nz[i]; }
  else {
    const P = T.def.pit, d = (P[3] != null ? P[3] : 0) + 75, s = T.startS + d, pz = T.pitAt(s); i = T.idx(s);   // (75 m past the player's box: no braking curve for the stop)
    if (kam === 'zid') { lim = pz.inner; qd = lim + 0.3 + reach; h = T.hd[i] - pz.sd * a; mx = -pz.sd * T.nx[i]; mz = -pz.sd * T.nz[i]; }
    else { lim = pz.lout; qd = lim - 0.3 - reach; h = T.hd[i] + pz.sd * a; mx = pz.sd * T.nx[i]; mz = pz.sd * T.nz[i]; }
    qd *= pz.sd;
  }
  placeCar(c, T, T.px[i] + T.nx[i] * qd, T.pz[i] + T.nz[i] * qd, h, kmh / 3.6);
  if (kam !== 'proga') { c.inPit = true; c.pitG = true; c.pitGT = 0; c.pitDone = true; }   // (pitDone: past its stop, the lane's limiter only)
  const tx = T.tx[i], tz = T.tz[i], R = { proga: tid, kam, th, kmh, v0: kmh, hit: 0, n: 0, drs: 0, pop: 0, wMax: 0, vn0: null, eN1: null, mu1: null, vL: null, v1: null, izh: null, dh: null, sk: 0, flags: '' };
  let k0 = -1, last = -1, left = -1, h0 = c.h;
  for (let k = 0; k < 2.5 / DT; k++) {
    c.inThr = 0; c.inBrk = 0; c.inSteer = 0; c.inHand = 0; c.hitWall = 0; c.wallX = NaN;
    const b = { x: c.x, z: c.z, vx: c.vx, vz: c.vz, h: c.h };
    r.step(DT);
    const touch = c.wallX === c.wallX;   // (wallCollide wrote a contact point this step)
    if (touch) {
      if (k0 < 0) { k0 = k; h0 = b.h; R.vn0 = b.vx * mx + b.vz * mz; const vt0 = b.vx * tx + b.vz * tz, vn1 = -(c.vx * mx + c.vz * mz), vt1 = c.vx * tx + c.vz * tz; R.eN1 = vn1 / R.vn0; R.mu1 = (vt0 - vt1) / Math.max(1e-6, R.vn0 + vn1); }
      if (last < 0 || (k - last) * DT >= 0.05) R.n++; last = k; R.hit = Math.max(R.hit, c.hitWall); R.drs = (k - k0 + 1) * DT;
      R.pop = Math.max(R.pop, Math.hypot(c.x - b.x - b.vx * DT, c.z - b.z - b.vz * DT));
    }
    if (k0 >= 0) { R.wMax = Math.max(R.wMax, Math.abs(c.w) * D); if (left < 0 && last >= 0 && (k - last) * DT >= 0.25) { left = k; R.vL = sp(c) * 3.6; R.izh = Math.asin(Math.max(-1, Math.min(1, -(c.vx * mx + c.vz * mz) / Math.max(0.1, sp(c))))) * D; R.dh = -wrap(c.h - h0) * D * (kam === 'zid' ? -1 : 1) * (kam === 'proga' ? 1 : T.pitAt(T.startS + (T.def.pit[3] || 0) + 75).sd); }
      if (k - k0 === Math.round(1 / DT)) R.v1 = sp(c) * 3.6; }
  }
  R.sk = c.dmg * 100; R.flags = (c.rl ? 'prevrnjen ' : '') + (c.inPit ? 'inPit ' : '') + (c.pitG ? 'duh' : '');
  return R;
}
function delBoksi() {
  const o = OUT.deli.boksi = {};
  o.dirka = [['spa', 300], ['bathurst', 150]].map(([t, sec]) => boksiDirka(t, sec));
  table('BOKSI 1: dirka, vsi avti poslani v bokse 5 s po startu (Race.step; 13 avtov). staTrk = koraki, ko bi za par tekel stari trk (inPit brez pitG)',
    ['proga', 's', 'avto-koraki v stezi', 'najvec hkrati', 'staTrk', 'trki avto-avto', 'prekrivanje duh-duh (koraki, maks m)', 'duh-avto na progi (koraki, maks m)', 'zid v stezi (st., maks m/s)', 'skoda v stezi', 'postanki'],
    o.dirka.map(x => [x.proga, x.s, x.vStezi, x.hkrati, x.staTrk, x.trki, `${x.prekrivanje}, ${f(x.prekrivanjeMaks, 2)}`, `${x.sProgo}, ${f(x.sProgoMaks, 2)}`, `${x.zid}, ${f(x.zidMaks, 1)}`, x.skoda, x.postanki]));
  o.trk = [];
  for (const phys of ['cs', 'nova']) { const SC = boksiScene('rally');
    for (const k of Object.keys(SC)) for (const pit of [true, false]) { const R = dvoboj(RIG[phys], SC[k], pit, 2); o.trk.push(Object.assign({ fizika: phys, prizor: k, trk: pit ? 'boksi (stari)' : 'proga (' + VERSION() + ')' }, R)); } }
  table(`BOKSI 2: isti dotik pri omejitvi boksov (${f(C.PIT_V * 3.6, 0)} km/h), stari trk (inPit) proti trku razlicice; ravnina, dva avta rally, 2 s`,
    ['fiz', 'prizor', 'trk', 'vn1 m/s', 'e1', 'vP km/h', 'vO km/h', 'precno P/O m/s', 'zasuk P/O deg', 'sunek nosu P/O deg', 'xgl P/O', 'pop cm', 'dotikov', 'dE kJ', 'dp %', 'skoda P/O %'],
    o.trk.map(x => [x.fizika, x.prizor, x.trk, f(x.vn1, 2), f(x.e1, 2), f(x.vP), f(x.vO), `${f(x.latP, 2)}/${f(x.latO, 2)}`, `${f(x.turnP)}/${f(x.turnO)}`, `${f(x.kickP)}/${f(x.kickO)}`, `${f(x.glP, 2)}/${f(x.glO, 2)}`, f(x.pop * 100), x.n, f(x.dEkJ), f(x.dp, 0), `${f(x.dmgP)}/${f(x.dmgO)}`]));
  o.zid = [];
  for (const [tid, kam] of [['spa', 'zid'], ['spa', 'zunaj'], ['spa', 'proga'], ['bathurst', 'zid']]) for (const th of [15, 30]) for (const phys of tid === 'spa' ? ['cs', 'nova'] : ['cs']) o.zid.push(Object.assign({ fizika: phys }, zidBoksi(tid, kam, th, 80, phys)));
  C.setCrash({ roll: 1 }); o.zidRoll = zidBoksi('spa', 'zid', 90, 80, 'cs'); C.setCrash(null);   // (square into the pit wall, rolling over on: the lane does not switch it off)
  table('BOKSI 3: avto rally pri 80 km/h v mejo boksne steze (Race.step na pravi progi; zid = boksni zid, zunaj = zunanji rob pri garazah, proga = ograja dirkalisca)',
    ['proga', 'kam', 'fiz', 'kot', 'vn0 m/s', 'eN1', 'mu1', 'vL km/h', 'v 1 s', 'izh deg', 'dh deg', 'w maks deg/s', 'hit m/s', 'dotikov', 'na zidu s', 'pop cm', 'skoda %', 'stanje'],
    o.zid.map(x => [x.proga, x.kam, x.fizika, x.th, f(x.vn0, 2), f(x.eN1, 2), f(x.mu1, 2), f(x.vL), f(x.v1), f(x.izh), f(x.dh), f(x.wMax, 0), f(x.hit), x.n, f(x.drs, 2), f(x.pop * 100), f(x.sk), x.flags]));
  say(`  s prevracanjem (setCrash roll): pravokotno v boksni zid pri 80 km/h: hit ${f(o.zidRoll.hit)} m/s, skoda ${f(o.zidRoll.sk)} %, stanje: ${o.zidRoll.flags}`);
}

/* ========================================================== pristanek ========================================================== */
// the test plane with heights: prof(s) -> [y, grade, curv] along x
function landRig(phys) {
  const H = handling(C, phys || 'cs'); let prof = () => [0, 0, 0];
  H.plane.hasElev = true; H.plane.elevAt = (s, out) => { const e = prof(s); out = out || {}; out.y = e[0]; out.grade = e[1]; out.curv = e[2]; return out; };
  return { H, set: (p) => { prof = p; }, at: (s) => prof(s) };
}
// a car dropped from h m over the road at kmh (its vertical speed as the road's slope gives it: parallel to the road), then 1.5 s on
function padecZ(L, id, h, kmh, o) {
  o = o || {}; const H = L.H, c = rigCar(H, id, kmh, true), e0 = L.at(0);
  c.air = 1; c.y = e0[0] + h; c.vy = e0[1] * kmh / 3.6; c.airT = 0; if (o.w) c.w = o.w; if (o.dmgMode != null) c.dmgMode = o.dmgMode;
  const R = { avto: id, h, kmh, tZrak: 0, vy: null, vyCesta: null, v0: null, v1: null, izg: null, odboj: 0, skoda: 0, landT: null, ay: null, tNazaj: null, dh: 0, w1: null };
  let k1 = -1, ay = 0, na = 0; const h0 = c.h;
  for (let k = 0; k < 6 / DT; k++) {
    const was = c.air, v = sp(c), vyB = c.vy, gB = L.at(c.x)[1];
    H.step(c, { st: k1 >= 0 && o.steer ? 1 : 0, thr: k1 >= 0 ? 1 : 'hold' });
    if (was && !c.air) { k1 = k; R.tZrak = (k + 1) * DT; R.vy = c.impactVY; R.vyCesta = c.impactVY - gB * v; R.v0 = v * 3.6; R.v1 = sp(c) * 3.6; R.izg = (1 - sp(c) / v) * 100; R.landT = c.landT; R.skoda = c.dmg * 100; R.dh = wrap(c.h - h0) * D; R.w1 = c.w * D; }
    if (k1 >= 0) { R.odboj = Math.max(R.odboj, c.y - L.at(c.x)[0]); const t = (k - k1) * DT; if (t > 0.15 && t <= 0.45) { ay += Math.abs(c._om) * c._v; na++; }
      if (R.tNazaj == null && sp(c) * 3.6 >= R.v0) R.tNazaj = t; if (t > 1.5 && R.tNazaj != null) break; }
  }
  R.ay = na ? ay / na / G : null;
  return R;
}
// over a crest of radius Rk (an arc between two straight ramps of slope +-Lh / Rk) at kmh, the speed held. Car.step takes off where
// v2 x curvature < -0.85 x JUMP_G; read off every step: a takeoff and a landing in the same step (c.landT set by a step that began on the
// road), steps that end in the air, the height over the road, the speed before the crest and after it, the hardest 0.1 s
function grebenZ(L, id, Rk, Lh, kmh) {
  const s0 = 60, g = Lh / Rk;
  L.set((s) => { const u = s - s0; return u < -Lh ? [-Lh * Lh / (2 * Rk) + g * (u + Lh), g, 0] : u > Lh ? [-Lh * Lh / (2 * Rk) - g * (u - Lh), -g, 0] : [-u * u / (2 * Rk), -u / Rk, -1 / Rk]; });
  const H = L.H, c = rigCar(H, id, kmh, true); c.y = L.at(0)[0];
  const R = { R: Rk, g, kmh, istiKorak: 0, drgne: 0, vZraku: 0, visina: 0, vPred: null, vPo: null, pojemek: 0, skoda: 0, landT: 0, realVzlet: Math.sqrt(G * Rk) * 3.6, igraVzlet: Math.sqrt(14 * 0.85 * Rk) * 3.6, realLet: 0 };
  const vs = [];
  for (let k = 0; k < 4 / DT; k++) {
    const was = c.air, lt = c.landT; c.landT = 0; if (R.vPred == null && c.x >= s0 - Lh - 1) R.vPred = sp(c) * 3.6;
    H.step(c, { st: 0, thr: 'hold' });
    if (c.landT > 0 && !was) { R.istiKorak++; if (c.impactVY < 0) R.drgne++; R.landT = Math.max(R.landT, c.landT); } else if (!c.landT) c.landT = Math.max(0, lt - DT);
    if (c.air) { R.vZraku++; R.visina = Math.max(R.visina, c.y - L.at(c.x)[0]); }
    vs.push(sp(c)); if (vs.length > 12) R.pojemek = Math.max(R.pojemek, (vs[vs.length - 13] - vs[vs.length - 1]) / 0.1 / G);
    if (c.x >= s0 + Lh + 3) { R.vPo = sp(c) * 3.6; break; }
  }
  R.skoda = c.dmg * 100;
  // a real car at this speed: off the road where the arc begins (v2 / R > g), back at the height it left after 2 x 0.15 v / g s
  if (kmh > R.realVzlet) R.realLet = 2 * g * (kmh / 3.6) / G;
  L.set(() => [0, 0, 0]);
  return R;
}
// the same on a real circuit's heights (Race.step): the sharpest crest on a straight piece of the lap (the road's curvature under 0.003 from
// 60 m before it to 40 m after). On Spa and Bathurst the takeoff's condition holds there only far over any car's top speed (607 and 387 km/h),
// so this checks the mechanism alone: a formula put on the road 50 m before the crest at 1.3 times that speed, steered by the game's own driver
function grebenProga(tid) {
  const T = track(tid), e = {}; let cm = 0, im = -1;
  for (let i = 40; i < T.N - 40; i++) { let kk = 0; for (let j = -30; j <= 20; j++) kk = Math.max(kk, Math.abs(T.k[(i + j + T.N) % T.N])); if (kk > 0.003) continue; T.elevAt(i * T.ds, e); if (e.curv < cm) { cm = e.curv; im = i; } }
  if (im < 0) return null;
  const vT = Math.sqrt(14 * 0.85 / -cm), v = vT * 1.3, r = loneRace(T, 'formula'), c = r.player, i0 = (im - Math.round(50 / T.ds) + T.N) % T.N;
  placeCar(c, T, T.px[i0], T.pz[i0], T.hd[i0], v); c.gear = c.m.gears.length;
  const R = { proga: tid, s: im * T.ds, R: -1 / cm, vzlet: vT * 3.6, kmh: v * 3.6, istiKorak: 0, drgne: 0, dvDrgne: 0, vZraku: 0, visina: 0 }, s0 = c.q.s;
  for (let k = 0; k < 3 / DT; k++) {
    C.aiControl(c, r, DT); c.inThr = 1; c.inBrk = 0; c.hitWall = 0; const was = c.air, vb = sp(c); c.landT = 0;
    r.step(DT); if (c.hitWall > 0) break;
    if (c.landT > 0 && !was) { R.istiKorak++; if (c.impactVY < 0) { R.drgne++; R.dvDrgne += (sp(c) - vb) * 3.6; } }
    if (c.air) { R.vZraku++; R.visina = Math.max(R.visina, c.y - c.roadY); }
    let ds = c.q.s - s0; if (ds < 0) ds += T.len; if (ds > 130) break;
  }
  return R;
}
// the crests of the game's real tracks (heights read with Track.elevAt every 2 m, nothing driven; the frozen test tracks left out): the
// sharpest crest of each and the speed from which the takeoff's condition holds there
function grebeniProg() {
  const out = [], e = {};
  for (const d of C.TRACKS) { if (d.test) continue; let T; try { T = track(d.id); } catch (err) { continue; } if (!T.hasElev) continue;
    let cm = 0, sm = 0; for (let s = 0; s < T.len; s += 2) { T.elevAt(s, e); if (e.curv < cm) { cm = e.curv; sm = s; } }
    if (cm < 0) out.push({ proga: d.id, s: sm, R: -1 / cm, vzlet: Math.sqrt(14 * 0.85 / -cm) * 3.6 }); }
  return out.sort((x, y) => x.vzlet - y.vzlet);
}
// the cross-check on Spa's real road: the player's car of a Race lifted 1 m over a straight at 100 km/h, parallel to the road
function pristanekSpa() {
  const T = track('spa'), r = loneRace(T, 'rally'), c = r.player, i = straightIdx(T);
  placeCar(c, T, T.px[i], T.pz[i], T.hd[i], 100 / 3.6);
  c.inThr = 0.5; r.step(DT); c.air = 1; c.y += 1; c.vy = c.gradeNow * c.vl; c.airT = 0;
  for (let k = 0; k < 2 / DT; k++) { const v = sp(c), g = c.gradeNow; r.step(DT); if (!c.air) return { proga: 'spa', nagib: g * 100, tZrak: (k + 1) * DT, vy: c.impactVY, vyCesta: c.impactVY - g * v, izg: (1 - sp(c) / v) * 100, skoda: c.dmg * 100 }; }
  return null;
}
function delPristanek() {
  const o = OUT.deli.pristanek = {}, L = landRig('cs');
  o.padec = [];
  for (const [id, kmh] of [['rally', 100], ['rally', 200], ['truck', 100]]) for (const h of [0.3, 1, 3, 6, 10]) { if (id !== 'rally' && h < 3) continue; if (kmh === 200 && h !== 1 && h !== 3) continue; o.padec.push(padecZ(L, id, h, kmh)); }
  const ref = padecZ(L, 'rally', 0.001, 100, { steer: 1 });
  o.oprijem = [0.3, 1, 3].map(h => padecZ(L, 'rally', h, 100, { steer: 1 })); o.oprijemRef = ref.ay;
  table('PRISTANEK 1: padec z visine h na ravno cesto (Car.step, ravnina z visinami; JUMP_G = 14 m/s2). real vy = sqrt(2 x 9,81 x h)',
    ['avto', 'km/h', 'h m', 'v zraku s', 'vy m/s', 'real vy', 'hitrost prej', 'potem', 'izguba %', 'skoda %', 'odboj cm', 'landT s', 'nazaj na hitrost s'],
    o.padec.map(x => [x.avto, x.kmh, x.h, f(x.tZrak, 2), f(x.vy, 2), f(-Math.sqrt(2 * G * x.h), 2), f(x.v0), f(x.v1), f(x.izg), f(x.skoda), f(x.odboj * 100), f(x.landT, 2), f(x.tNazaj, 2)]));
  say(`  oprijem takoj po pristanku (poln volan od dotika, bocni pospesek 0,15-0,45 s po njem): brez padca ${f(ref.ay, 2)} g; ` + o.oprijem.map(x => `${x.h} m: ${f(x.ay, 2)} g`).join(', '));
  { const a = padecZ(L, 'rally', 3, 100, { w: 0.6 }); o.zrak = a; say(`  v zraku: vrtenje 34 deg/s ob vzletu, padec 3 m: ob pristanku ${f(a.w1, 1)} deg/s, nos zasukan ${f(a.dh, 1)} deg (CSK.airYawT ${C.CSK.airYawT} s)`); }
  o.nagib = [];
  for (const g of [0, -0.08, -0.15, 0.08]) { L.set((s) => [g * s, g, 0]); o.nagib.push(Object.assign({ nagib: g * 100 }, padecZ(L, 'rally', 1, 100))); }
  L.set(() => [0, 0, 0]);
  table('PRISTANEK 2: 1 m nad cesto, vzporedno z njo, 100 km/h: pristanek na klancu (vy: kar igra vzame, navpicno; vy cesta: glede na cesto)',
    ['nagib %', 'v zraku s', 'vy igra m/s', 'vy glede na cesto', 'izguba hitrosti %', 'skoda %'], o.nagib.map(x => [f(x.nagib, 0), f(x.tZrak, 2), f(x.vy, 2), f(x.vyCesta, 2), f(x.izg), f(x.skoda)]));
  o.greben = [80, 90, 100, 120, 160, 200].map(v => grebenZ(L, 'rally', 60, 9, v)).concat([60, 100, 150].map(v => grebenZ(L, 'rally', 15, 0.75, v)));
  table(`PRISTANEK 3: cez greben (lok s polmerom R med klancema +-g), plin drzi hitrost; pogoj vzleta v igri: v2/R > 0,85 x 14 (R 60 m: nad ${f(o.greben[0].igraVzlet, 0)} km/h, pravi avto nad ${f(o.greben[0].realVzlet, 0)} km/h; R 15 m: nad 48 km/h)`,
    ['polmer m (klanca %)', 'km/h', 'vzlet in pristanek v istem koraku (st.)', 'od tega z izgubo hitrosti', 'korakov v zraku', 'visina mm', 'hitrost pred km/h', 'po grebenu km/h', 'najvecji pojemek g (0,1 s)', 'skoda %', 'pravi avto v zraku s'],
    o.greben.map(x => [`${x.R} (${f(x.g * 100, 0)})`, x.kmh, x.istiKorak, x.drgne, x.vZraku, f(x.visina * 1000, 0), f(x.vPred), f(x.vPo), f(x.pojemek, 1), f(x.skoda), x.realLet ? f(x.realLet, 2) : '-']));
  o.grebenProga = ['bathurst', 'spa'].map(grebenProga).filter(Boolean);
  for (const x of o.grebenProga) say(`  preverjeno na pravih visinah (${x.proga}, Race.step, raven greben pri s ${f(x.s, 0)} m, polmer ${f(x.R, 0)} m, pogoj vzleta od ${f(x.vzlet, 0)} km/h; formula postavljena nanj s ${f(x.kmh, 0)} km/h): vzlet in pristanek v istem koraku ${x.istiKorak}-krat, od tega ${x.drgne}-krat z izgubo hitrosti (skupaj ${f(x.dvDrgne)} km/h), v zraku ${x.vZraku} korakov, najvec ${f(x.visina * 1000, 0)} mm nad cesto`);
  o.grebeni = grebeniProg();
  say('  najostrejsi greben pravih prog (visine prebrane, brez voznje; proga: polmer m, pogoj vzleta od km/h): ' + o.grebeni.slice(0, 8).map(x => `${x.proga}: ${f(x.R, 0)} m, ${f(x.vzlet, 0)}`).join('; ') + '; spa: ' + (() => { const x = o.grebeni.find(y => y.proga === 'spa'); return x ? `${f(x.R, 0)} m, ${f(x.vzlet, 0)}` : '-'; })() + '; bathurst: ' + (() => { const x = o.grebeni.find(y => y.proga === 'bathurst'); return x ? `${f(x.R, 0)} m, ${f(x.vzlet, 0)}` : '-'; })());
  o.spa = pristanekSpa();
  if (o.spa) say(`  preverjeno na Spa (Race.step, 1 m nad ravnino pri 100 km/h, nagib ceste ${f(o.spa.nagib, 1)} %): v zraku ${f(o.spa.tZrak, 2)} s, vy ${f(o.spa.vy, 2)} m/s (glede na cesto ${f(o.spa.vyCesta, 2)}), izguba ${f(o.spa.izg)} %, skoda ${f(o.spa.skoda)} %`);
}

/* ============================================================ padec ============================================================ */
// this script's straight open road with a drop on the right from 300 to 700 m (the game's Track and its rules)
function dropRoad() {
  const pts = []; for (let x = 0; x <= 1200; x += 100) pts.push([x, 0]);
  return new C.Track({ id: 'trki-rob', name: 'Rob, Preizkus', open: true, halfWidth: 6, points: pts, startX: 50, edgeBar: 4, drops: [[300, 700, 1]] });
}
function padecRob(T, kmh, th, dmgMode, id) {
  const r = loneRace(T, id || 'rally', { damage: dmgMode }), c = r.player, i = T.nearestIdx(450, 0), a = th / D, reach = c.m.len / 2 * Math.sin(a) + c.m.wid / 2 * Math.cos(a), qd = T.br[i] - 0.3 - reach;
  placeCar(c, T, T.px[i] + T.nx[i] * qd, T.pz[i] + T.nz[i] * qd, T.hd[i] + a, kmh / 3.6);
  const R = { kmh, th, skode: dmgMode, pade: false, rob: T.br[i] - T.w, vVen: null, tPad: 0, yDno: 0, pot: 0, w: null, skoda: 0, nazajS: null, nazajD: null, nazajV: null, nazajH: null, tDoHitrosti: null, tIzguba: null, padcev: 0 };
  let k0 = -1, k1 = -1, x0 = 0, z0 = 0, s0 = 0; const mx = T.nx[i], mz = T.nz[i], v0 = kmh / 3.6;
  for (let k = 0; k < 14 / DT; k++) {
    const was = !!c.fall; c.inSteer = 0; c.inBrk = 0; c.inThr = k1 >= 0 ? 1 : 0.3;
    const yB = c.y - (c.roadY != null && !was ? c.roadY : 0);
    r.step(DT);
    if (!was && c.fall && k0 < 0) { k0 = k; R.pade = true; x0 = c.x; z0 = c.z; s0 = c.q.s; R.vVen = c.vx * mx + c.vz * mz; R.w = c.w * D; }
    if (c.fall) { R.yDno = Math.min(R.yDno, c.y); R.tPad = (k - k0 + 1) * DT; }
    if (was && !c.fall && k1 < 0) { k1 = k; R.pot = Math.hypot(c.px - x0, c.pz - z0); R.skoda = c.dmg * 100; R.nazajS = c.q.s - s0; R.nazajD = c.q.d; R.nazajV = sp(c) * 3.6; R.nazajH = wrap(c.h - T.hd[c.q.i]) * D; R.padcev = c.falls || 0; }
    if (k1 >= 0 && R.tDoHitrosti == null && sp(c) >= v0) { R.tDoHitrosti = (k - k1) * DT; R.tIzguba = (k - k0 + 1) * DT - (c.q.s - s0) / v0; break; }   // (against a car that drove on at the same speed along the road)
  }
  return R;
}
function delPadec() {
  const o = OUT.deli.padec = {}, T = dropRoad();
  o.rob = [[60, 15, 2], [120, 15, 2], [60, 15, 1], [60, 15, 0], [20, 5, 2]].map(([v, th, dm]) => padecRob(T, v, th, dm));
  o.kolibri = padecRob(T, 60, 15, 2, 'kolibri');
  table('PADEC: cez rob prepada (lastna ravna odprta cesta z def.drops; Race.step: wallCollide, Race._fall, Race.rescue). skode: 0 Izklop, 1 Samo videz, 2 Vklop',
    ['km/h', 'kot', 'skode', 'pade', 'rob m od asfalta', 'ven m/s', 'vrtenje deg/s', 'pada s', 'dno m', 'pot m', 'skoda %', 'nazaj: m naprej', 'od sredine m', 'km/h', 'do prejsnje hitrosti s', 'izguba s'],
    o.rob.concat([o.kolibri]).map((x, k) => [x.kmh + (k === o.rob.length ? ' kolibri' : ''), x.th, x.skode, x.pade ? 'da' : 'ne', f(x.rob), f(x.vVen, 2), f(x.w, 0), f(x.tPad, 2), f(x.yDno), f(x.pot), f(x.skoda), f(x.nazajS), f(x.nazajD), f(x.nazajV), f(x.tDoHitrosti, 2), f(x.tIzguba, 2)]));
  // falls until the car is a wreck (Vklop): the same fall again and again
  { const r = loneRace(T, 'rally', { damage: 2 }), c = r.player, i = T.nearestIdx(450, 0); const seq = [];
    for (let n = 0; n < 5 && c.dmg < 1; n++) { placeCar(c, T, T.px[i] + T.nx[i] * (T.br[i] - 1.4), T.pz[i] + T.nz[i] * (T.br[i] - 1.4), T.hd[i] + 0.26, 16.7); let fell = false; for (let k = 0; k < 4 / DT; k++) { c.inThr = 0.3; r.step(DT); if (c.fall) fell = true; else if (fell) break; } seq.push(+(c.dmg * 100).toFixed(0)); }
    o.zaporedje = seq; say('  padec za padcem (Vklop), skoda po vsakem: ' + seq.join(' -> ') + ' %'); }
  say('  proge z def.drops v igri: ' + (C.TRACKS.filter(d => d.drops).map(d => d.id + (d.test ? ' (testna)' : '')).join(', ') || 'nobena'));
  o.proge = C.TRACKS.filter(d => d.drops).map(d => ({ id: d.id, test: !!d.test }));
}

/* ========================================================= prevracanje ========================================================= */
// a knock square into the flank of a standing car at vClose m/s, lx m along it from its middle (Core.carCollide, one call): does it roll?
function bokTrk(vClose, id, lx, phys) {
  const H = RIG[phys || 'cs'], O = rigCar(H, 'rally', 0, false), P = rigCar(H, 'rally', 0, true); O.id = id; O.place(0, 0, 0);
  P.place(lx || 0, -(O.m.wid / 2 + P.m.len / 2 - 0.02), Math.PI / 2); P.vx = 0; P.vz = vClose; C.carCollide(P, O);
  return { O, P, roll: !!O.rl, rollP: !!P.rl };
}
// sideways into Spa's barrier at vSide m/s (the car along the road, 20 m/s forward), Core.wallCollide after each 1/120 s of travel
function bokZid(T, i, vSide, id) {
  const c = new C.Car(model('rally'), { phys: 'cs', id }); c.dmgMode = 2;
  const d = T.br[i] - c.m.wid / 2 - 0.15, h = T.hd[i];
  c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, h); c.q.i = i; T.query(c.x, c.z, i, c.q);
  c.vx = Math.cos(h) * 20 + T.nx[i] * vSide; c.vz = Math.sin(h) * 20 + T.nz[i] * vSide; let hit = 0;
  for (let k = 0; k < 20 && !hit; k++) { c.x += c.vx * DT; c.z += c.vz * DT; T.query(c.x, c.z, c.q.i, c.q); hit = C.wallCollide(c, T); }
  return { hit, roll: !!c.rl };
}
// what a roll does: a car at kmh takes a knock of vClose m/s on its flank (the car that hits it travels with it), then drives on alone
function prevrat(kmh, vClose, id) {
  const H = RIG.cs, O = rigCar(H, 'rally', kmh, false), P = rigCar(H, 'rally', kmh, true), v = kmh / 3.6; O.id = id; O.place(0, 0, 0); O.vx = v;
  P.place(0, -(O.m.wid / 2 + P.m.len / 2 - 0.02), Math.PI / 2); P.vx = v; P.vz = vClose; C.carCollide(P, O);
  const R = { kmh, vClose, roll: !!O.rl, obrati: O.rl ? O.rl.turns : 0, T: 0, vPoTrku: sp(O) * 3.6, vKonec: null, pot: 0, visina: 0, dh: 0, skoda0: O.dmg * 100, skoda: null, streha: null, pojemek: null, dE: null, tNazaj: null };
  if (!O.rl) return R;
  const x0 = O.x, z0 = O.z, h0 = O.h, v1 = sp(O); let k = 0;
  for (; k < 4 / DT && O.rl; k++) { H.step(O, { st: 0, thr: 0 }); R.visina = Math.max(R.visina, O.y); }
  R.T = k * DT; R.vKonec = sp(O) * 3.6; R.pot = Math.hypot(O.x - x0, O.z - z0); R.dh = wrap(O.h - h0) * D; R.skoda = O.dmg * 100; R.streha = O.roofDmg; R.pojemek = (v1 - sp(O)) / R.T / G; R.dE = (1 - (sp(O) * sp(O)) / (v1 * v1)) * 100;
  O._vT = v; for (let j = 0; j < 20 / DT; j++) { H.step(O, { st: lane(O, O.z), thr: 1 }); if (sp(O) >= v1) { R.tNazaj = (j + 1) * DT; break; } }
  return R;
}
function prevracanjeDirka(tid, secs, xr, drive) {
  C.setCrash(xr); const r = mkRace(tid), on = new Map(); let rolls = 0, hard = 0, wallHard = 0, maxCar = 0, maxWall = 0;
  for (let k = 1; k <= secs / DT; k++) {
    for (const c of r.cars) { c.hitCar = 0; c.hitWall = 0; }
    Math.random = SIM.seeded(1000 + k); if (drive) drive(r, k); else C.aiControl(r.player, r, DT); r.step(DT);
    for (const c of r.cars) { if (c.rl && !on.get(c)) rolls++; on.set(c, !!c.rl); if (c.hitCar > 9) hard++; if (c.hitWall > 10) wallHard++; maxCar = Math.max(maxCar, c.hitCar); maxWall = Math.max(maxWall, c.hitWall); }
  }
  const counted = r.cars.reduce((s, c) => s + (c.xrK ? c.xrK.n : 0), 0); C.setCrash(null);
  return { proga: tid, s: secs, nastavitve: Object.keys(xr).filter(k => xr[k]).join('+'), voznja: drive ? 'igralec v trke' : 'cista', trkiNad9: hard, zidNad10: wallHard, maksAvto: maxCar, maksZid: maxWall, steti: counted, prevrati: rolls };
}
// the player as tests/lib/sim.js crashDrive has it, again and again: full throttle and full lock into whatever is there, 2.5 s in every 8
const zaletavanje = (r, k) => { const P = r.player, t = k * DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); if (t % 8 >= 4 && t % 8 < 6.5) { P.inSteer = (Math.floor(t / 8) % 2 ? 1 : -1); P.inThr = 1; P.inBrk = 0; P.inHand = 0; P.digitalSteer = true; } else { P.digitalSteer = false; C.aiControl(P, r, DT); } };
function delPrevracanje() {
  const o = OUT.deli.prevracanje = {}; C.setCrash({ roll: 1 });
  const N = 400, share = (fn) => { let n = 0; for (let id = 1; id <= N; id++) if (fn(id)) n++; return n / N * 100; };
  o.pragAvto = []; for (const v of [8, 8.9, 9.1, 10, 12, 15, 16, 20]) o.pragAvto.push({ v, delez: share(id => bokTrk(v, id).roll), napadalec: share(id => bokTrk(v, id).rollP) });
  o.mesto = [0, 0.2, 0.35, 0.45].map(k => ({ lx: k, delez: share(id => bokTrk(12, id, k * model('rally').len).roll) }));
  const T = track('spa'), i0 = straightIdx(T);
  o.pragZid = []; for (const v of [8, 9.5, 10.5, 12, 15]) { let hit = 0; const d = share(id => { const x = bokZid(T, i0, v, id); hit = x.hit; return x.roll; }); o.pragZid.push({ v, hit, delez: d }); }
  o.nova = share(id => bokTrk(12, id, 0, 'nova').roll);
  table('PREVRACANJE 1: prag in delez (setCrash roll; 400 avtov z id 1-400, vsak svoj prvi trk; Core.carCollide / wallCollide)',
    ['kaj', 'hitrost m/s (km/h)', 'delez prevrnjenih %'],
    o.pragAvto.map(x => ['avto pravokotno v bok stojecega (sredina)', `${x.v} (${f(x.v * 3.6, 0)})`, f(x.delez) + (x.napadalec ? ` (napadalec ${f(x.napadalec)})` : '')])
      .concat(o.mesto.map(x => [`v bok pri 12 m/s, ${f(x.lx, 2)} dolzine od sredine`, '12 (43)', f(x.delez)]))
      .concat(o.pragZid.map(x => ['bocno v ograjo (Spa), 72 km/h naprej', `${x.v} (${f(x.v * 3.6, 0)}), hit ${f(x.hit)}`, f(x.delez)]))
      .concat([['nova fizika: v bok pri 12 m/s', '12 (43)', f(o.nova)]]));
  let idRoll = 1; while (idRoll < N && !bokTrk(12, idRoll).roll) idRoll++;
  o.kaj = []; for (const kmh of [50, 100, 150, 200]) for (const v of [10, 16]) o.kaj.push(prevrat(kmh, v, idRoll));
  table(`PREVRACANJE 2: kaj prevrat naredi (avto id ${idRoll}, ravnina, Car.step: xRollStep). Pravi prevrat: pojemek 0,4-0,5 g, obratov toliko, kolikor da hitrost`,
    ['km/h', 'trk m/s', 'obrati', 'traja s', 'po trku km/h', 'na koncu km/h', 'pot m', 'visina m', 'pojemek g', 'energije manj %', 'skoda +%', 'streha', 'nos deg', 'do hitrosti s'],
    o.kaj.map(x => [x.kmh, x.vClose, x.obrati, f(x.T, 2), f(x.vPoTrku), f(x.vKonec), f(x.pot), f(x.visina, 2), f(x.pojemek, 2), f(x.dE, 0), f(x.skoda - x.skoda0), f(x.streha, 2), f(x.dh), f(x.tNazaj, 1)]));
  o.dirke = [prevracanjeDirka('spa', 90, { roll: 1 }), prevracanjeDirka('bathurst', 90, { roll: 1 }), prevracanjeDirka('spa', 90, { roll: 1, ai: 1 }), prevracanjeDirka('spa', 90, { roll: 1 }, zaletavanje), prevracanjeDirka('bathurst', 90, { roll: 1 }, zaletavanje)];
  table('PREVRACANJE 3: kako pogosto (dirka 13 avtov, 90 s, Race.step). steti = trki, ki so dobili zreb (xrK.n)',
    ['proga', 'nastavitve', 'voznja', 'avto-koraki s trkom nad 9 m/s', 'z zidom nad 10 m/s', 'najmocnejsi trk / zid m/s', 'steti', 'prevrati'],
    o.dirke.map(x => [x.proga, x.nastavitve, x.voznja, x.trkiNad9, x.zidNad10, `${f(x.maksAvto)} / ${f(x.maksZid)}`, x.steti, x.prevrati]));
  C.setCrash(null);
}

/* ============================================================ skoda ============================================================ */
// head on into a standing car, centred, closing at v m/s (one Core.carCollide call): the damage and each car's change of speed
function skodaAvto(idP, idO, v, mode) {
  const H = RIG.cs, P = rigCar(H, idP, 0, true), O = rigCar(H, idO, 0, false); P.dmgMode = O.dmgMode = mode == null ? 2 : mode;
  O.place(0, 0, 0); P.place(-(O.m.len + P.m.len) / 2 + 0.02, 0, 0); P.vx = v; C.carCollide(P, O);
  return { v, P: idP, O: idO, mP: P.m.mass, mO: O.m.mass, dmgP: P.dmg * 100, dmgO: O.dmg * 100, dvP: (v - P.vx) * 3.6, dvO: O.vx * 3.6, lostP: Object.keys(P.lost || {}).length, lights: P.lightOut.reduce((a, b) => a + b, 0) };
}
// square into Spa's barrier at v m/s (Race.step): the damage of that one crash
function skodaZid(v, mode, id, th) {
  const T = track('spa'), r = loneRace(T, id || 'rally', { damage: mode == null ? 2 : mode }), c = r.player, i = straightIdx(T), a = (th || 90) / D, reach = c.m.len / 2 * Math.sin(a) + c.m.wid / 2 * Math.cos(a), qd = T.br[i] - 0.3 - reach;
  placeCar(c, T, T.px[i] + T.nx[i] * qd, T.pz[i] + T.nz[i] * qd, T.hd[i] + a, v);
  let hit = 0; for (let k = 0; k < 1.5 / DT; k++) { c.hitWall = 0; c.inThr = 0; r.step(DT); hit = Math.max(hit, c.hitWall); }
  return { v, hit, dmg: c.dmg * 100, lost: Object.keys(c.lost || {}), lights: c.lightOut.reduce((x, y) => x + y, 0), okna: c.winOut.reduce((x, y) => x + y, 0), car: c, race: r };
}
// a car with the damage of n knocks of amt on its front right corner (Core.applyDamage), then: 100 -> full throttle for 6 s (km/h reached),
// a steady corner at 120 km/h with full lock (g), 3 s straight with no hand on the wheel at 100 km/h (m to the side)
function vozi(id, mode, n, amt, xr) {
  C.setCrash(xr || null); const H = RIG.cs, mk = (kmh) => { const c = rigCar(H, id, kmh, true); c.dmgMode = mode; for (let k = 0; k < n; k++) C.applyDamage(c, amt, c.m.len * 0.45, c.m.wid * 0.4); return c; };
  let c = mk(100); for (let k = 0; k < 6 / DT; k++) H.step(c, { st: 0, thr: 1 }); const v6 = sp(c) * 3.6, dmg = c.dmg * 100, lost = Object.keys(c.lost || {}).length, aero = c.aeroK;
  const kv = id === 'formula' ? 200 : 120; c = mk(kv); let ay = 0, na = 0; for (let k = 0; k < 5 / DT; k++) { H.step(c, { st: 1, thr: 'hold' }); if (k > 4 / DT) { ay += Math.abs(c._om) * c._v; na++; } }
  c = mk(100); for (let k = 0; k < 3 / DT; k++) H.step(c, { st: 0, thr: 'hold' }); const z3 = c.z;
  C.setCrash(null);
  return { avto: id, skode: mode, udarci: n, dmg, lost, v6, ay: ay / na / G, kv, z3, aero };
}
function delSkoda() {
  const o = OUT.deli.skoda = {};
  o.avto = [3, 5, 10, 15, 20, 27.8, 41.7, 55.6].map(v => skodaAvto('rally', 'rally', v));
  o.mase = [skodaAvto('strelica', 'medved', 15), skodaAvto('medved', 'strelica', 15), skodaAvto('kolibri', 'rally', 15)];
  table('SKODA 1: avto celno v stojec avto (en klic Core.carCollide; skoda = (hitrost priblizevanja - 3,5) x 1,6 % x knockK, obema enako)',
    ['v m/s (km/h)', 'kdo v koga (kg)', 'skoda P %', 'skoda O %', 'dv P km/h', 'dv O km/h', 'ugasle luci P', 'odpadli deli P'],
    o.avto.concat(o.mase).map(x => [`${x.v} (${f(x.v * 3.6, 0)})`, `${x.P} ${x.mP} v ${x.O} ${x.mO}`, f(x.dmgP), f(x.dmgO), f(x.dvP), f(x.dvO), x.lights, x.lostP]));
  o.zid = [5, 10, 15, 20, 27.8, 41.7].map(v => { const x = skodaZid(v); return { v, hit: x.hit, dmg: x.dmg, lost: x.lost.length, lights: x.lights, okna: x.okna }; });
  { const x = skodaZid(27.8, 2, 'rally', 20); o.zid.push({ v: 27.8, th: 20, hit: x.hit, dmg: x.dmg, lost: x.lost.length, lights: x.lights, okna: x.okna }); }
  { const x = skodaZid(15, 2, 'kolibri'); o.zid.push({ v: 15, avto: 'kolibri', hit: x.hit, dmg: x.dmg, lost: x.lost.length, lights: x.lights, okna: x.okna }); }
  table('SKODA 2: v ograjo na Spa (Race.step; skoda = (hitrost v zid - 2,5) x 2,8 % x knockK)', ['v m/s (km/h)', 'kot', 'avto', 'hit m/s', 'skoda %', 'odpadli deli', 'ugasle luci', 'razbita okna'],
    o.zid.map(x => [`${x.v} (${f(x.v * 3.6, 0)})`, x.th || 90, x.avto || 'rally', f(x.hit), f(x.dmg), x.lost, x.lights, x.okna]));
  o.voznja = [];
  for (const [id, n, amt] of [['rally', 0, 0], ['rally', 5, 0.1], ['rally', 10, 0.1], ['formula', 0, 0], ['formula', 5, 0.1]]) for (const mode of [1, 2]) { if (!n && mode === 1) continue; o.voznja.push(vozi(id, n ? mode : 2, n, amt)); }
  table('SKODA 3: kako vozi poskodovan avto (udarci po 10 % v sprednji desni vogal, Core.applyDamage; ravnina). skode 1 = Samo videz, 2 = Vklop',
    ['avto', 'skode', 'udarci', 'skoda %', 'odpadli deli', '100 -> 6 s plina km/h', 'ovinek g (km/h)', 'brez rok 3 s: vstran m', 'aeroK'],
    o.voznja.map(x => [x.avto, x.skode, x.udarci, f(x.dmg, 0), x.lost, f(x.v6), `${f(x.ay, 2)} (${x.kv})`, f(x.z3, 2), x.aero ? x.aero.toExponential(2) : '0']));
  // a puncture (failures on): the share of knocks that cut a tyre, by the knock's strength, in a real race's draw (Race.step into the barrier)
  const draw = SIM.seeded(7000);   // (one sequence for every crash of this measurement: the draw of each is its own)
  o.guma = [10, 12, 15, 20, 27.8].map(v => { let n = 0; const N = 200; for (let s = 1; s <= N; s++) { const T = track('spa'), r = loneRace(T, 'rally', { faults: true, seed: s }), c = r.player, i = straightIdx(T), qd = T.br[i] - 0.3 - c.m.len / 2;
    placeCar(c, T, T.px[i] + T.nx[i] * qd, T.pz[i] + T.nz[i] * qd, T.hd[i] + Math.PI / 2, v); Math.random = draw; for (let k = 0; k < 0.15 / DT; k++) r.step(DT); if (c.flt && c.flt.pw >= 0) n++; } return { v, delez: n / N * 100, pravilo: Math.min(25, Math.max(0, (v - 11) / 20 * 100)) }; });
  say('  predrta guma (okvare vklopljene, pravokotno v ograjo, 200 trkov, vsak s svojim zrebom): ' + o.guma.map(x => `${x.v} m/s: ${f(x.delez, 0)} % (pravilo ${f(x.pravilo, 0)} %)`).join(', '));
  { const H = RIG.cs, run = (pw) => { const c = rigCar(H, 'rally', 120, true); if (pw >= 0) c.flt = { pw, pk: 1, brT: 20, enT: 85, brH: false, enH: false, ev: '' }; let ay = 0, na = 0; for (let k = 0; k < 5 / DT; k++) { H.step(c, { st: 1, thr: 'hold' }); if (k > 4 / DT) { ay += Math.abs(c._om) * c._v; na++; } }
      const d = rigCar(H, 'rally', 100, true); if (pw >= 0) d.flt = { pw, pk: 1, brT: 20, enT: 85, brH: false, enH: false, ev: '' }; for (let k = 0; k < 3 / DT; k++) H.step(d, { st: 0, thr: 'hold' }); return { ay: ay / na / G, z3: d.z }; };
    o.gumaVozi = { cela: run(-1), spredajDesna: run(1), zadajLeva: run(2) };
    say(`  prazna guma (pk 1): ovinek 120 km/h ${f(o.gumaVozi.cela.ay, 2)} g cela, ${f(o.gumaVozi.spredajDesna.ay, 2)} g sprednja desna, ${f(o.gumaVozi.zadajLeva.ay, 2)} g zadnja leva; brez rok 3 s pri 100 km/h vlece ${f(o.gumaVozi.spredajDesna.z3, 2)} m (sprednja desna), ${f(o.gumaVozi.zadajLeva.z3, 2)} m (zadnja leva)`); }
  // the Kolibri's tyres (Race opts.tyreRule: ktHit): what a knock does to them, damage Samo videz
  { const T = track('spa'), r = loneRace(T, 'kolibri', { damage: 1, tyreRule: ['kolibri'] }), c = r.player, i = straightIdx(T), a = 30 / D, reach = c.m.len / 2 * Math.sin(a) + c.m.wid / 2 * Math.cos(a), qd = T.br[i] - 0.3 - reach;
    placeCar(c, T, T.px[i] + T.nx[i] * qd, T.pz[i] + T.nz[i] * qd, T.hd[i] + a, 27.8); for (let k = 0; k < 1 / DT; k++) r.step(DT);
    o.kolibri = { kt: !!c.kt, dmg: c.dmg * 100, d: c.kt ? c.kt.d.map(x => +x.toFixed(3)) : null, grip: c.kt ? C.ktGrip(c).map(x => +x.toFixed(3)) : null };
    say(`  Kolibri (pravilo gum, Samo videz), 100 km/h pod 30 deg v ograjo: skoda ${f(o.kolibri.dmg)} %, skoda gum [SL, SD, ZL, ZD] ${JSON.stringify(o.kolibri.d)}, oprijem koles in bocni ${JSON.stringify(o.kolibri.grip)}`); }
}

/* ============================================================ zanka ============================================================ */
function delZanka() {
  const o = OUT.deli.zanka = { polja: [], klici: {} }, now = () => Number(process.hrtime.bigint()) / 1e3;   // (microseconds)
  const reachOf = (a, b) => (Math.hypot(a.m.len, a.m.wid) + Math.hypot(b.m.len, b.m.wid)) * 0.5 + 0.05;
  for (const nCars of [12, 20, 100]) {
    const r = mkRace('spa', { numAI: nCars - 1, playerGrid: nCars }), cars = r.cars, T = r.track, n = cars.length, secs = 30, steps = Math.round(secs / DT), big = n > 16;
    let pairsSum = 0, pairsMax = 0, reachSum = 0, reachMax = 0, touchSum = 0, tStep = 0, tPairs = 0, tWalls = 0, tBroad = 0, tStepMax = 0, cnt = 0, lodSteps = 0, carSteps = 0, last = null, tB0 = 0;
    const aS = [], aP = [], aW = [], aB = [], med = (a) => { a.sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };   // (the middle step: the other programs of the machine and Node's own pauses left out)
    if (big) { const orig = r._pairs.bind(r); r._pairs = (ST) => { const t0 = now(), P = orig(ST); tBroad += now() - t0; last = P.slice(); return P; }; }
    for (let k = 1; k <= steps; k++) {
      for (const c of cars) c.hitCar = 0;
      Math.random = SIM.seeded(1000 + k); C.aiControl(r.player, r, DT);
      tB0 = tBroad; const t0 = now(); r.step(DT); const dtS = now() - t0;
      const L = r._lod && r._lod.on ? r._lod : null; if (L) { lodSteps++; for (let i = 0; i < n; i++) carSteps += L.st[i]; } else carSteps += n;
      // the pair loop's work this step: the pairs handed to carCollide, those within the knock's own reach, the cars that took a knock
      let np = 0, nr = 0;
      if (big) { np = last ? last.length : 0; if (last) for (const p of last) { const a = cars[p >> 10], b = cars[p & 1023], dx = b.x - a.x, dz = b.z - a.z, R = reachOf(a, b); if (dx * dx + dz * dz <= R * R) nr++; } }
      else { np = n * (n - 1) / 2; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const a = cars[i], b = cars[j], dx = b.x - a.x, dz = b.z - a.z, R = reachOf(a, b); if (dx * dx + dz * dz <= R * R) nr++; } }
      pairsSum += np; pairsMax = Math.max(pairsMax, np); reachSum += nr; reachMax = Math.max(reachMax, nr); for (const c of cars) if (c.hitCar > 0) touchSum++;
      if (k <= 240) continue;   // (the first 2 s: Node still compiling)
      cnt++; tStep += dtS; tStepMax = Math.max(tStepMax, dtS); aS.push(dtS); aB.push(tBroad - tB0);
      // the collision calls again on the state the step left (the same functions, the same loops as Race._step; a second touch of a pair
      // already parted costs what the first did up to its early exits): pairs, then walls
      const t1 = now();
      if (big) { for (const p of last || []) { const i = p >> 10, j = p & 1023; if (!cars[i].fall && !cars[j].fall && !cars[i].pitG && !cars[j].pitG) C.carCollide(cars[i], cars[j]); } }
      else for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (!cars[i].fall && !cars[j].fall && !cars[i].pitG && !cars[j].pitG) C.carCollide(cars[i], cars[j]); }
      const t2 = now(); for (const c of cars) if (!c.net && !c.fall) C.wallCollide(c, T, true); const t3 = now();
      tPairs += t2 - t1; tWalls += t3 - t2; aP.push(t2 - t1); aW.push(t3 - t2);
    }
    o.polja.push({ avtov: n, s: secs, pari: pairsSum / steps, pariMaks: pairsMax, vDosegu: reachSum / steps, vDoseguMaks: reachMax, dotikov: touchSum / steps, lod: lodSteps / steps * 100, avtoKorakov: carSteps / steps,
      korakPovp: tStep / cnt, korakMaks: tStepMax, pariPovp: tPairs / cnt, zidPovp: tWalls / cnt, korak: med(aS), pariUs: med(aP), sirokaUs: big ? med(aB) : 0, zidUs: med(aW) });
    { const x = o.polja[o.polja.length - 1]; x.delez = (x.pariUs + x.sirokaUs + x.zidUs) / x.korak * 100; }
  }
  table('ZANKA 1: dirka na Spa, prvih 30 s (start, prvi ovinki). Stetja so ponovljiva, casi (Node, process.hrtime; srednji korak) ne',
    ['avtov', 'parov na korak (maks)', 'v dosegu trka (maks)', 'avtov z dotikom/korak', 'LOD % korakov', 'voznih korakov avtov/korak', 'korak us: srednji (povp., maks)', 'pari us', 'siroka faza us', 'zidovi us', 'trki % koraka'],
    o.polja.map(x => [x.avtov, `${f(x.pari, 0)} (${x.pariMaks})`, `${f(x.vDosegu, 1)} (${x.vDoseguMaks})`, f(x.dotikov, 2), f(x.lod, 0), f(x.avtoKorakov, 1), `${f(x.korak, 0)} (${f(x.korakPovp, 0)}, ${f(x.korakMaks, 0)})`, f(x.pariUs, 1), f(x.sirokaUs, 1), f(x.zidUs, 1), f(x.delez, 1)]));
  // one call: the reach test only, the boxes' test, a full knock (two cars leaning into each other, their states put back each time)
  const H = RIG.cs, N = 20000, bench = (fn) => { for (let k = 0; k < 2000; k++) fn(); let best = 1e9; for (let q = 0; q < 5; q++) { const t0 = now(); for (let k = 0; k < N / 5; k++) fn(); best = Math.min(best, (now() - t0) / (N / 5)); } return best; };   // (the best of five rounds)
  const A = rigCar(H, 'rally', 100, true), B = rigCar(H, 'rally', 100, false), keys = ['x', 'z', 'h', 'vx', 'vz', 'w', 'csKc', 'cSx', 'cSz', 'cSr', 'xgl', 'xglT', 'dmg', 'hitCar', 'fxCar'];
  const put = (c, x, z, h, vx, vz) => { c.x = x; c.z = z; c.h = h; c.vx = vx; c.vz = vz; c.w = 0; c.csKc = 0; c.cSx = c.cSz = 0; c.cSr = null; c.xgl = 0; c.dmg = 0; c.dents.length = 0; };
  const one = (cv, ax, az, ah, avx, avz, pit) => { C.setTest(cv ? { cv } : (CV != null ? { cv: CV } : null)); A.inPit = B.inPit = !!pit; const t = bench(() => { put(A, ax, az, ah, avx, avz); put(B, 0, 0, 0, 27.8, 0); C.carCollide(A, B); }); A.inPit = B.inPit = false; setCv(); return t; };
  const base = bench(() => { put(A, 30, 0, 0, 27.8, 0); put(B, 0, 0, 0, 27.8, 0); });
  o.klici = { dalec: one(0, 30, 0, 0, 27.8, 0) - base, blizuNeDotik: one(0, -A.m.len - 0.3, 0, 0, 27.8, 0) - base, vogalBlizu: one(0, -A.m.len + 0.5, A.m.wid + 0.1, 0.1, 27.8, 0) - base,
    trk: one(0, -A.m.len + 0.05, 0.4, 0.05, 30, 0) - base, trkBok: one(0, 0.3, A.m.wid - 0.05, -0.03, 27.8, -1) - base, stari: one(5, -A.m.len + 0.05, 0.4, 0.05, 30, 0) - base, stariBoksi: one(0, -A.m.len + 0.05, 0.4, 0.05, 30, 0, true) - base };
  { const T = track('spa'), r = loneRace(T, 'rally'), c = r.player, i = straightIdx(T); placeCar(c, T, T.px[i], T.pz[i], T.hd[i], 27.8); const free = bench(() => C.wallCollide(c, T, true));
    const qd = T.br[i] - c.m.wid / 2 + 0.05, x = T.px[i] + T.nx[i] * qd, z = T.pz[i] + T.nz[i] * qd, vx = c.vx + T.nx[i] * 3, vz = c.vz + T.nz[i] * 3;
    const hitT = bench(() => { c.x = x; c.z = z; c.vx = vx; c.vz = vz; c.w = 0; c.dmg = 0; c.dents.length = 0; C.wallCollide(c, T, true); });
    o.klici.zidProsto = free; o.klici.zidDotik = hitT; }
  table('ZANKA 2: cena enega klica (us, Node; najboljsi od petih krogov po 4.000 klicev)', ['klic', 'us'], [
    ['carCollide: avta 30 m narazen (izhod pri dosegu)', f(o.klici.dalec, 3)], ['carCollide: 0,3 m za odbijacem (doseg da, skatli ne)', f(o.klici.blizuNeDotik, 3)], ['carCollide: vogal ob vogalu, brez dotika', f(o.klici.vogalBlizu, 3)],
    ['carCollide: poln trk od zadaj (' + VERSION() + ')', f(o.klici.trk, 3)], ['carCollide: poln trk v bok (' + VERSION() + ')', f(o.klici.trkBok, 3)], ['carCollide: poln trk, Stara (cv 5)', f(o.klici.stari, 3)], ['carCollide: poln trk v boksih (stari trk)', f(o.klici.stariBoksi, 3)],
    ['wallCollide: avto sredi ceste', f(o.klici.zidProsto, 3)], ['wallCollide: avto v ograji', f(o.klici.zidDotik, 3)]]);
}

/* ============================================================ splet ============================================================ */
// netPlace as js/game.js has it (the friend's car placed from its buffered states), cut out of the file as text and run unchanged
function netPlaceOf() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'game.js'), 'utf8'), a = src.indexOf('function netPlace(c, B, now, lag) {');
  if (a < 0) return null;
  let d = 0, b = -1; for (let i = src.indexOf('{', a); i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) { b = i + 1; break; } }
  if (b < 0) return null;
  try { return new Function('Core', 'track', src.slice(a, b) + '\nreturn netPlace;')(C, null); } catch (e) { return null; }
}
// a car's state as netFrame sends it (the fields netPlace reads, rounded the same way)
const r2 = (v) => Math.round((v || 0) * 100) / 100, r3 = (v) => Math.round((v || 0) * 1000) / 1000;
const netMsg = (P, now) => ({ k: Math.round(now), x: r2(P.x), z: r2(P.z), y: r2(P.y), h: r3(P.h), vx: r2(P.vx), vz: r2(P.vz), vy: r2(P.vy), w: r3(P.w), vl: r2(P.vl), a: r2(P.air), d: r3(P.delta), b: r2(P.inBrk), hb: r2(P.inHand), th: r2(P.inThr),
  g: P.gear | 0, rp: Math.round(P.rpm), ax: r2(P.axF), ry: r2(P.roadY), gr: r3(P.gradeNow), bs: r3(P.bankSl), cb: P.onCurb ? 1 : 0, ws: (P.ws || [0, 0, 0, 0]).join(''), lr: r2(P.latR), be: r3(P.beta), sp: r2(P.spin), lk: P.lock ? 1 : 0, sf: r2(P.slipF), di: r2(P.dist), lp: P.lap | 0, pg: P.pitG ? 1 : 0 });
// the scenes: A and B placed and driven (x along the road); init(H) -> { A: [x, z, h, kmh], B: [...], drive(c, who, t, t1) -> inputs }
const NET_SC = {
  'zadaj 100 v 80': { A: [-12, 0, 0, 100], B: [0, 0, 0, 80], hold: true },
  'zadaj 120 v 60': { A: [-16, 0, 0, 120], B: [0, 0, 0, 60], hold: true },
  'celno 60 + 60': { A: [-10, 0, 0, 60], B: [10, 0, Math.PI, 60], hold: true },
  'v bok stojecega 60': { A: [0, -9, Math.PI / 2, 60], B: [0, 0, 0, 0], hold: true },
  'bok ob boku 100, 3 deg': { A: [0, 0, 0, 100], B: [0.5, 2.15, -0.052, 100], side: true },
};
// one run. lag 0: offline (one world, both cars local, the pair's knock once a step); else two phones: each steps its own car, the
// friend's car a net car placed by netPlace from the states the other phone sent (every 50 ms, lat ms on the way), lag ms in the past
function netRun(name, lag, netPlace, o) {
  o = o || {}; const S = NET_SC[name], H = RIG.cs, id = o.id || 'rally', lat = o.lat != null ? o.lat : 30, iv = lag >= 200 ? 100 : 50;
  const mk = (q, pl) => { const c = rigCar(H, id, q[3], pl); c.place(q[0], q[1], q[2]); c.h = q[2]; const v = q[3] / 3.6; c.vx = Math.cos(q[2]) * v; c.vz = Math.sin(q[2]) * v; c.q = { i: 0, s: q[0], d: q[1], tx: 1, tz: 0, nx: 0, nz: 1 }; return c; };
  const ghost = (q) => { const c = mk(q, false); c.net = true; return c; };
  const drive = (c, q, t, t1) => { const h0 = q[2], lat0 = -Math.sin(h0) * q[0] + Math.cos(h0) * q[1], e = (-Math.sin(h0) * c.x + Math.cos(h0) * c.z) - lat0, he = wrap(c.h - h0), vt = (-Math.sin(h0) * c.vx + Math.cos(h0) * c.vz);
    const st = Math.max(-1, Math.min(1, -(0.35 * e + 2.0 * he + 0.25 * vt / Math.max(5, sp(c)))));
    return { st: S.side && t < 0.4 ? 0 : st, thr: t1 == null ? 'hold' : 0 }; };
  const A = mk(S.A, true), B = mk(S.B, true), mA = A.m.mass, mB = B.m.mass;
  const R = { prizor: name, lag, tA: null, tB: null, nA: 0, nB: 0, turnA: 0, turnB: 0, jA: 0, jB: 0, wA: 0, wB: 0, u: null, u0: null };
  let t1 = null; const changed = (c, b) => c.x !== b[0] || c.z !== b[1] || c.vx !== b[2] || c.vz !== b[3] || c.w !== b[4] || (c.csKc || 0) !== b[5], snap = (c) => [c.x, c.z, c.vx, c.vz, c.w, c.csKc || 0];
  const v0 = { ax: A.vx, az: A.vz, bx: B.vx, bz: B.vz }; let pre = null, gapAt = null;
  const frames = Math.round(3.2 * 60), GA = lag ? ghost(S.B) : null, GB = lag ? ghost(S.A) : null, bufA = [], bufB = [], wire = [];   // (GA: B's car on A's phone)
  let sendT = -1e9;
  for (let fr = 0; fr < frames; fr++) {
    for (let s = 0; s < 2; s++) {
      const t = (fr * 2 + s + 1) * DT, bA = snap(A), bB = snap(B); if (t1 == null) pre = { ax: A.vx, az: A.vz, bx: B.vx, bz: B.vz, hA: A.h, hB: B.h };
      H.step(A, drive(A, S.A, t, t1)); H.step(B, drive(B, S.B, t, t1));
      const cA = snap(A), cB = snap(B); if (t1 == null && !R.u) { const cl = Math.hypot(A.vx - B.vx, A.vz - B.vz) || 1; R.u0 = [(A.vx - B.vx) / cl, (A.vz - B.vz) / cl, cl]; }
      if (!lag) { C.carCollide(A, B); }
      else { C.carCollide(A, GA); C.carCollide(GB, B); }   // (the pair in the grid's order on both phones: A's car first)
      const hitA = changed(A, cA), hitB = changed(B, cB);
      if ((hitA || hitB) && !R.u) R.u = R.u0;   // (u: the way A closed on B before the first touch, and that closing speed)
      if (R.u) { R.jA += (A.vx - cA[2]) * R.u[0] + (A.vz - cA[3]) * R.u[1]; R.jB += (B.vx - cB[2]) * R.u[0] + (B.vz - cB[3]) * R.u[1]; R.wA += Math.abs(A.w - cA[4]); R.wB += Math.abs(B.w - cB[4]); }
      if (hitA) { R.nA++; if (R.tA == null) { R.tA = t; gapAt = Math.hypot(B.x - A.x, B.z - A.z); } } if (hitB) { R.nB++; if (R.tB == null) R.tB = t; }
      if ((hitA || hitB) && t1 == null) { t1 = t; R.pre = pre; }
      if (t1 != null) { R.turnA = Math.max(R.turnA, Math.abs(wrap(A.h - R.pre.hA)) * D); R.turnB = Math.max(R.turnB, Math.abs(wrap(B.h - R.pre.hB)) * D); }
      if (t1 != null && R.end == null && t - t1 >= 1.0) R.end = { ax: A.vx, az: A.vz, bx: B.vx, bz: B.vz, x: B.x - A.x, z: B.z - A.z };
    }
    if (!lag) continue;
    const now = (fr + 1) * 1000 / 60;
    if (now - sendT >= iv) { sendT = now; wire.push({ at: now + lat, to: 'B', m: netMsg(A, now) }); wire.push({ at: now + lat, to: 'A', m: netMsg(B, now) }); }
    while (wire.length && wire[0].at <= now) { const w = wire.shift(), buf = w.to === 'A' ? bufA : bufB; buf.push(w.m); if (buf.length > 40) buf.shift(); }
    if (bufA.length) netPlace(GA, bufA, now, lag); if (bufB.length) netPlace(GB, bufB, now, lag);
  }
  R.hit = t1 != null; R.t1 = t1; R.gap = gapAt;
  if (R.u) { const cl = R.u[2]; R.cl = cl; R.sunekA = R.jA * 3.6; R.sunekB = R.jB * 3.6; R.eS = ((R.jB - R.jA) - cl) / cl; R.dp = (mA * R.jA + mB * R.jB) / (mA * cl) * 100; }
  if (R.end) { const E = R.end, P = R.pre, cl = Math.hypot(P.ax - P.bx, P.az - P.bz) || 1, ux = (P.ax - P.bx) / cl, uz = (P.az - P.bz) / cl;   // (u: the way A closes on B)
    R.closing = cl; R.dvA = ((E.ax - P.ax) * ux + (E.az - P.az) * uz) * 3.6; R.dvB = ((E.bx - P.bx) * ux + (E.bz - P.bz) * uz) * 3.6;
    R.vA = Math.hypot(E.ax, E.az) * 3.6; R.vB = Math.hypot(E.bx, E.bz) * 3.6; R.e = -((E.ax - E.bx) * ux + (E.az - E.bz) * uz) / cl;
    R.px = mA * (E.ax - P.ax) + mB * (E.bx - P.bx); R.pz = mA * (E.az - P.az) + mB * (E.bz - P.bz); R.pu = (R.px * ux + R.pz * uz); R.mu = mA * mB / (mA + mB); }
  return R;
}
// the cross-check with real Races: two phones' races on Spa (Race opts.remote: the friend's car a net car of the race), the rear-end scene, nobody on a pedal
function netSpa(lag, netPlace, vA, vB) {
  const T = track('spa'), i = straightIdx(T), mk = (me) => loneRace(T, 'rally', { playerGrid: me, remote: { grid: 3 - me, model: model('rally'), id: me === 1 ? 'g1' : 'h' } });
  const rA = mk(1), rB = mk(2), A = rA.player, B = rB.player, GA = rA.remotes[0], GB = rB.remotes[0], ch = Math.cos(T.hd[i]), sh = Math.sin(T.hd[i]);
  placeCar(A, T, T.px[i] - ch * 12, T.pz[i] - sh * 12, T.hd[i], vA / 3.6); placeCar(B, T, T.px[i], T.pz[i], T.hd[i], vB / 3.6);
  const bufA = [], bufB = [], wire = []; let sendT = -1e9, t1 = null, pre = null, end = null, nA = 0, nB = 0; const lat = 30;
  for (let fr = 0; fr < 3.2 * 60; fr++) {
    const now0 = fr * 1000 / 60; if (fr === 0) { bufA.push(netMsg(B, now0 - 200), netMsg(B, now0 - 100)); bufB.push(netMsg(A, now0 - 200), netMsg(A, now0 - 100)); for (const [buf, c] of [[bufA, B], [bufB, A]]) { buf[0].x = r2(c.x - c.vx * 0.2); buf[0].z = r2(c.z - c.vz * 0.2); buf[1].x = r2(c.x - c.vx * 0.1); buf[1].z = r2(c.z - c.vz * 0.1); } netPlace(GA, bufA, now0, lag); netPlace(GB, bufB, now0, lag); }
    for (let s = 0; s < 2; s++) {
      const t = (fr * 2 + s + 1) * DT; if (t1 == null) pre = { a: sp(A), b: sp(B) };
      for (const c of [A, B]) { c.inThr = 0; c.inBrk = 0; c.inSteer = 0; c.hitCar = 0; }
      rA.step(DT); rB.step(DT);
      if (A.hitCar > 0) nA++; if (B.hitCar > 0) nB++;
      if ((A.hitCar > 0 || B.hitCar > 0) && t1 == null) t1 = t;
      if (t1 != null && end == null && t - t1 >= 1.0) end = { a: sp(A), b: sp(B) };
    }
    const now = (fr + 1) * 1000 / 60;
    if (now - sendT >= 50) { sendT = now; wire.push({ at: now + lat, to: 'B', m: netMsg(A, now) }); wire.push({ at: now + lat, to: 'A', m: netMsg(B, now) }); }
    while (wire.length && wire[0].at <= now) { const w = wire.shift(), buf = w.to === 'A' ? bufA : bufB; buf.push(w.m); if (buf.length > 40) buf.shift(); }
    netPlace(GA, bufA, now, lag); netPlace(GB, bufB, now, lag);
  }
  return end && pre ? { vA, vB, dvA: (end.a - pre.a) * 3.6, dvB: (end.b - pre.b) * 3.6, nA, nB } : { vA, vB, hit: false };
}
function delSplet() {
  const o = OUT.deli.splet = {}, netPlace = netPlaceOf();
  if (!netPlace) { o.napaka = 'netPlace ni najden v js/game.js'; say('\nSPLET: ' + o.napaka); return; }
  o.vrstice = [];
  for (const name of Object.keys(NET_SC)) for (const lag of [0, 100, 200]) o.vrstice.push(netRun(name, lag, netPlace));
  table('SPLET 1: isti dotik brez mreze (lag 0: oba avta lokalna) in na dveh telefonih (prijateljev avto 100 / 200 ms v preteklosti; ravnina, rally, enaki masi). sunek = sprememba hitrosti lastnega avta v klicih trka, vzdolz smeri priblizevanja A; gibalna = (mA sunekA + mB sunekB) / (mA x priblizevanje); e = hitrost razhajanja / priblizevanja po sunkih',
    ['prizor', 'lag ms', 'priblizevanje km/h', 'sunek A km/h', 'sunek B km/h', 'e', 'gibalna %', 'prvi dotik A / B s', 'razdalja sredisc ob dotiku A m', 'korakov s trkom A / B', 'zasuk A / B deg', 'po 1 s: dv A / B km/h'],
    o.vrstice.map(x => { const dolg = Math.max(x.nA, x.nB) > 40, bok = /bok ob boku/.test(x.prizor); return [x.prizor, x.lag, f((x.cl || 0) * 3.6, 0), bok ? '-' : f(x.sunekA), bok ? '-' : f(x.sunekB), dolg || bok ? '-' : f(x.eS, 2), bok ? '-' : f(x.dp, 0), `${f(x.tA, 3)} / ${f(x.tB, 3)}`, f(x.gap, 2), `${x.nA} / ${x.nB}`, `${f(x.turnA)} / ${f(x.turnB)}`, `${f(x.dvA)} / ${f(x.dvB)}`]; }));
  o.spa = [netSpa(100, netPlace, 100, 80)];
  { const x = o.spa[0], y = o.vrstice.find(v => v.prizor === 'zadaj 100 v 80' && v.lag === 100);
    say(`  preverjeno z dvema pravima dirkama na Spa (Race opts.remote, Race.step na obeh telefonih, zadaj 100 v 80, brez plina): dv A ${f(x.dvA)} km/h, dv B ${f(x.dvB)} km/h, korakov s trkom ${x.nA} / ${x.nB} (ravnina: ${f(y.dvA)} / ${f(y.dvB)} km/h, ${y.nA} / ${y.nB})`); }
}

/* ============================================================= main ============================================================ */
const DELI = { boksi: delBoksi, pristanek: delPristanek, padec: delPadec, prevracanje: delPrevracanje, skoda: delSkoda, zanka: delZanka, splet: delSplet };
const t00 = Number(process.hrtime.bigint()) / 1e9;
if (!AS_JSON) console.log(`== trki: boksi, pristanki, prevracanje, padec, skoda, zanka, splet (razlicica trkov: ${VERSION()}${CV != null ? ', --cv ' + CV : ', privzeta'})`);
for (const k of Object.keys(DELI)) { if (ONLY && ONLY !== k) continue; setCv(); C.setCrash(null); DELI[k](); }
setCv(); C.setCrash(null);
if (AS_JSON) console.log(JSON.stringify(OUT, (k, v) => (k === 'car' || k === 'race' || k === 'O' && v && v.m || k === 'P' && v && v.m ? undefined : typeof v === 'number' && !Number.isFinite(v) ? null : v)));
else console.log(`\n(${(Number(process.hrtime.bigint()) / 1e9 - t00).toFixed(1)} s)`);
