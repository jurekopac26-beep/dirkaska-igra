// Trki: mase, prikolice in različice (analiza za temo »bolj realistični trki«, 9. 11. 2026). Vehicles of very different weights, the
// semi-trailers (Car.tl) and the five versions of the knock (Core.setTest({ cv })) side by side, on the flat test plane
// (tests/lib/handling.js) and, as a cross-check, in a real seeded race at Spa. Nothing of the physics is written anew here: every
// step is the race loop's own order (Race.step: each car's inputs, the steer's rate and Car.step with its trailer's tlStep; then
// Core.carCollide for every pair of cars, the safety car after them; Core.wallCollide for every car; then Race._tlStep, the
// trailers' knocks, walls and joints, called on a race that is only { cars, track }). What is measured is read off the bodies' states
// around those calls: speeds, momentum, angular momentum, energy, headings, the grip lost (Car.xgl), the overlap of the true boxes.
//   node tools/trki/mase-razlicice.js               every section, the game's default version of the knocks
//   node tools/trki/mase-razlicice.js --cv 4        sections 1, 2 and 5 with that version (1 Simulacija ... 5 Stara); section 3 and 4
//                                                   always show 1-5, and that one beside them when it is another (a new version)
//   node tools/trki/mase-razlicice.js --json        the results as JSON on stdout
//   node tools/trki/mase-razlicice.js --only mase   only the sections whose name holds the text (vozila, mase, gorivo, prikolice,
//                                                   razlicice, vloge, ohranitev, proga)
//   node tools/trki/mase-razlicice.js --trace <scenario> [--phys nova] [--tspan 0.3]   one scenario step by step around its first touch
// Sections: 1 vozila (weights, yaw inertia against a box's and 0.3 of the length), mase (the lightest into the heaviest: head on, from
// behind, T-bone at 60 and 120 km/h, both ways), gorivo (fuelKg and the player's pm); 2 prikolice (a car into a trailer's side and
// rear, a trailer into a car, the tractor hit while towing, rig against rig, the road train); 3 razlicice (six scenarios, cv 1-5; then
// where along the car the knock lands: rear axle, middle, front axle), vloge (player / rival / safety car / a friend's car online); 4 ohranitev (momentum, angular momentum and energy at the knocks, cv
// 1-5, both physics); 5 proga (the same knock in a seeded race at Spa: the plane against the track; there the race's debris counts too).
// Units in the tables: km/h, deg, s, cm; momentum and energy as shares (%).
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const { seeded } = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));
const handling = require(path.join(ROOT, 'tests', 'lib', 'handling.js'));

const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const CV = arg('--cv') != null ? +arg('--cv') : null, JSON_OUT = argv.includes('--json'), ONLY = arg('--only'), TRACE = arg('--trace');
const C = loadCore();
const RIG = { cs: handling(C, 'cs'), nova: handling(C, 'nova') };
for (const k in RIG) { RIG[k].plane.rings = []; RIG[k].plane.altC = []; }   // (what wallCollide reads of a track: no roundabout, no oncoming lane; the plane has no wall, bl = br = 1e9)
const DT = 1 / 120, D = 180 / Math.PI, KMH = 3.6, AFTER = 2;   // (AFTER: the time followed after the first touch, s)
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const TXD = CV != null ? { cv: CV } : null;   // (the version asked for; null: the game's default)
const CVN = ['', 'Simulacija', 'Arkadna', 'Mehka', 'Kaskaderska', 'Stara'];
const cvName = (n) => n == null ? 'privzeta' : CVN[n] || 'cv' + n;
const MOD = (id) => { const M = C.MODELS.find(m => m.id === id); if (!M) throw new Error('no vehicle ' + id); return M; };
const out = { meta: { cv: CV, version: cvName(CV), dt: DT }, sections: {} };
const lines = [];
const say = (s = '') => { lines.push(s); };

// ---- the bodies: a car, its trailer, a road train's second tank; each has x, z, h, vx, vz, w, I and m { mass, len, wid } ----
const mOf = (b) => b.m.mass + (b.fuelKg || 0), IOf = (b) => b.I * mOf(b) / b.m.mass;
const bodiesOf = (c) => c.tl ? (c.tl.next ? [c, c.tl, c.tl.next] : [c, c.tl]) : [c];
const massOf = (c) => bodiesOf(c).reduce((s, b) => s + mOf(b), 0);
const tailOf = (M) => { const T = M.trailer; if (!T) return M.len / 2; const N = T.next; return N ? -T.kp[0] - N.kp[0] + N.len - N.f : -T.kp[0] + T.len - T.f; };   // (its tail behind its middle, m)
const snap = (b) => [b.x, b.z, b.h, b.vx, b.vz, b.w];
function sysOf(B) {   // the bodies' momentum (kg m/s), kinetic energy (J: 1/2 m v^2 + 1/2 I w^2) and angular momentum about the origin
  let px = 0, pz = 0, E = 0, L = 0;
  for (const b of B) { const m = mOf(b), I = IOf(b); px += m * b.vx; pz += m * b.vz; E += 0.5 * m * (b.vx * b.vx + b.vz * b.vz) + 0.5 * I * b.w * b.w; L += m * (b.x * b.vz - b.z * b.vx) + I * b.w; }
  return { px, pz, E, L };
}
// two true boxes by their separating axes: > 0 apart (along the best axis), < 0 the depth of their overlap (measurement only)
function boxGap(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, ca = Math.cos(a.h), sa = Math.sin(a.h), cb = Math.cos(b.h), sb = Math.sin(b.h);
  let g = -Infinity;
  for (const [lx, lz] of [[ca, sa], [-sa, ca], [cb, sb], [-sb, cb]]) {
    const ra = a.m.len / 2 * Math.abs(ca * lx + sa * lz) + a.m.wid / 2 * Math.abs(-sa * lx + ca * lz), rb = b.m.len / 2 * Math.abs(cb * lx + sb * lz) + b.m.wid / 2 * Math.abs(-sb * lx + cb * lz);
    g = Math.max(g, Math.abs(dx * lx + dz * lz) - ra - rb);
  }
  return g;
}
const inBox = (p, b) => { const dx = p.x - b.x, dz = p.z - b.z, ch = Math.cos(b.h), sh = Math.sin(b.h); return Math.abs(dx * ch + dz * sh) < b.m.len / 2 && Math.abs(-dx * sh + dz * ch) < b.m.wid / 2; };

// a vehicle on the plane: at (x, z), heading h, v km/h along its heading, in a gear for that speed (as the rig's mkCar picks it)
function mk(H, id, o) {
  const c = H.mkCar(id, { v: 0 }), M = c.m;
  c.isPlayer = !!o.pl; c.noReverse = true; if (o.net) c.net = true; if (o.sc) c.sc = true;
  if (o.fuel) { c.tankKg = C.fuelTank(M); c.fuelKg = c.tankKg; }   // (a full tank's weight, as a race with fuel carries it)
  c.place(o.x || 0, o.z || 0, o.h || 0);
  const v = (o.v || 0) / KMH; c.vx = Math.cos(c.h) * v; c.vz = Math.sin(c.h) * v;
  for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
  c._thrI = 0.3; c._vT = v; c._v = v; c.moving = v > 0.5;
  return c;
}
const lane = (c, z0) => Math.max(-1, Math.min(1, -(0.35 * (c.z - z0) + 2.0 * c.h + 0.25 * c.vz / Math.max(5, c.speed))));   // (back to its lane: tests/trki.test.js)
const gapFor = (vc) => Math.max(0.4, vc * 0.15);   // (m between the bodies at the start: some 18 steps before they touch)
// before the touch the speed is held; after it nothing (no pedal, no steer): what the knock itself and the tyres do
const coast = (S) => (i, t, tc) => tc != null ? { st: 0, thr: 0 } : { st: 0, thr: S.cars[i].moving ? 'hold' : 0 };

// ---- the scenarios (A the vehicle that hits, B the one hit; o.plA / o.plB: which one is the player's) ----
const SC = {
  // nose to nose: A at va, B the other way at vb (0: standing), off m to the side
  head(H, a, b, va, vb, o = {}) {
    const B = mk(H, b, Object.assign({ x: 0, z: 0, h: Math.PI, v: vb, pl: o.plB }, o.B));
    const A = mk(H, a, Object.assign({ x: -(MOD(a).len / 2 + MOD(b).len / 2 + gapFor((va + vb) / KMH)), z: o.off || 0, h: 0, v: va, pl: o.plA }, o.A));
    const S = { cars: [A, B] }; S.input = coast(S); return S;
  },
  // from behind: A at va into the tail of B at vb (a rig: its trailer's tail)
  rear(H, a, b, va, vb, o = {}) {
    const B = mk(H, b, Object.assign({ x: 0, z: 0, h: 0, v: vb, pl: o.plB }, o.B));
    const A = mk(H, a, Object.assign({ x: -(MOD(a).len / 2 + tailOf(MOD(b)) + gapFor((va - vb) / KMH)), z: o.off || 0, h: 0, v: va, pl: o.plA }, o.A));
    const S = { cars: [A, B] }; S.input = coast(S); return S;
  },
  // T-bone: A at va square into the side of B, which heads across (+z) at vb (0: standing); along: the point of B's length A's middle meets (m from B's middle, + ahead)
  tbone(H, a, b, va, vb, o = {}) {
    const g = gapFor(va / KMH), tc = g / (va / KMH), al = o.along || 0;
    const B = mk(H, b, Object.assign({ x: 0, z: -al - vb / KMH * tc, h: Math.PI / 2, v: vb, pl: o.plB }, o.B));
    const A = mk(H, a, Object.assign({ x: -(MOD(a).len / 2 + MOD(b).wid / 2 + g), z: 0, h: 0, v: va, pl: o.plA }, o.A));
    const S = { cars: [A, B] }; S.input = coast(S); return S;
  },
  // side by side at v, A drifting into B's flank at deg (and leaning on it: its wheel straight for hold s, then back to its lane); both hold their speed
  lean(H, a, b, v, deg, o = {}) {
    const an = -deg / D, z0 = (MOD(a).wid + MOD(b).wid) / 2 + 0.35, hold = o.hold != null ? o.hold : 1, x0 = o.x != null ? o.x : 0.5;
    const B = mk(H, b, Object.assign({ x: 0, z: 0, h: 0, v: o.vb != null ? o.vb : v, pl: o.plB }, o.B));
    const A = mk(H, a, Object.assign({ x: x0, z: z0, h: an, v, pl: o.plA }, o.A));
    const S = { cars: [A, B] }; S.input = (i, t) => i === 0 ? { st: t < hold ? 0 : lane(A, z0), thr: 'hold' } : { st: 0, thr: 'hold' }; return S;
  },
  // a tap on B's rear quarter: A's front corner across at lat m/s (both at v; the test's PIT), on: where along B (share of its length behind its middle)
  pit(H, a, b, v, lat, o = {}) {
    const an = Math.asin(lat / (v / KMH)), Mb = MOD(b);
    const B = mk(H, b, Object.assign({ x: 0, z: 0, h: 0, v, pl: o.plB }, o.B));
    const A = mk(H, a, Object.assign({ x: -Mb.len * (o.on != null ? o.on : 0.75), z: -(MOD(a).wid + Mb.wid) / 2 - 0.95, h: an, v, pl: o.plA }, o.A));
    const S = { cars: [A, B] }; S.input = () => ({ st: 0, thr: 'hold' }); return S;
  },
};

/* One scenario, stepped as the race steps it. Returns what happened from the first touch (the first step the true boxes of the two
   vehicles overlap after the cars' own steps) for AFTER s:
     A, B        per vehicle: m (kg, with its trailers), v (km/h along A's way before the touch: before, after the first touch's step, +0.1,
                 +0.5, +2 s), dv01 (the change by +0.1 s), sp2 (its speed at +2 s), exit (deg: its way at +0.5 s against before), hMax, hEnd
                 (deg: the heading's largest and last change), yaw (deg/s: the largest yaw rate), gl / glBack (the grip lost, Car.xgl, and
                 when it was back), straight (s until its heading is within 3 deg of its way, or of straight back, and its yaw under 6 deg/s,
                 for good; null: not by the end), lat (m/s: the largest speed across its own heading it was given), dmg (its damage after),
                 fold (deg: a rig's largest angle between tractor and trailer), rev (it goes backwards at the end)
     e1, e01     the parting speed over the closing speed along A's way: after the first touch's step, at +0.1 s
     dvA, dvB    the changes of speed the knocks themselves gave each vehicle (the collision calls only, no tyres; km/h, the sum over the
                 crash), ratio = (mA dvA) / (mB dvB): 1 when the two changes are in the inverse ratio of the weights
     pErr        the momentum the collision calls made or lost, a share of what they passed from one to the other (%)
     E0 (kJ), eImp, e01E, e2 (the share of the kinetic energy lost: over the first touch's step, by +0.1 s, by +2 s), gain (the most
                 kinetic energy one step's collision calls added, J)
     lErr        car-against-car knocks: the turn each car should have got from the push at the contact (its lever x the push) and did
                 not, a share of it (%; 0 a rigid body's, 100 no turn at all, below 0 more turn than the push gives)
     nImp (the separate pushes; nBig: those with over 0.5 m/s of closing speed, KV.eT), steps (from the first touch to the last, in steps), sep1 (steps to the first parting), still (touching
     at the end), tog (touching again after parting), stick (s: the longest stretch touching with under 0.5 m/s between them), flip
     (the closing speed changing sign step after step while touching), gap1 (cm between the true boxes at the first knock), ovl / raw (cm: the deepest overlap of the true boxes after the
     knocks / before them), pass (a body's middle inside the other's box), nan */
function run(phys, tx, build, o = {}) {
  C.setTest(tx || null);
  const orig = Math.random; Math.random = seeded(11);   // (nothing here draws but a puncture or a failure might: the same numbers every run)
  try {
    const H = RIG[phys], S = build(H), cars = S.cars, units = cars.map(bodiesOf), all = units.flat();
    const race = { cars: cars.filter(c => !c.sc), track: H.plane, rescue() {} };   // (what Race._tlStep reads of a race)
    const rc = race.cars, scs = cars.filter(c => c.sc);
    const cross = []; for (const a of units[0]) for (const b of units[1]) cross.push([a, b]);
    const minGap = () => { let g = Infinity, P = null; for (const p of cross) { const q = boxGap(p[0], p[1]); if (q < g) { g = q; P = p; } } return { g, P }; };
    const U = units.map((B) => ({ c: B[0], B, m: B.reduce((s, b) => s + mOf(b), 0), v: [], hMax: 0, yaw: 0, gl: 0, glBack: null, off: 0, lat: 0, fold: 0, dP: [0, 0], dP01: [0, 0] }));
    const marks = [0, Math.round(0.1 / DT), Math.round(0.5 / DT), Math.round(AFTER / DT)];
    let k1 = 0, u0 = null, pre = null, E = [], P = [], nImp = 0, nBig = 0, impMax = 0, last = 0, sep1 = null, tog = 0, was = false, stick = 0, stickRun = 0, flip = 0, vnPrev = 0, ovl = 0, raw = 0, pass = false, nan = false, gain = 0;
    let lNum = 0, lDen = 0, e1 = null, e01 = null, vc = 0, gap1 = 0;
    const tr = o.trace ? [] : null, kMax = Math.round((o.wait || 3) / DT);
    for (let k = 1; k1 ? k <= k1 + marks[3] : k <= kMax; k++) {
      const t = k * DT, tc = k1 ? (k - k1) * DT : null;
      for (let i = 0; i < cars.length; i++) { const c = cars[i];
        if (c.net) { c.px = c.x; c.pz = c.z; c.x += c.vx * DT; c.z += c.vz * DT; continue; }   // (a friend's car online: its own phone moves it; here on at its speed)
        H.step(c, S.input(i, t, tc)); }
      const g0 = minGap();
      const was0 = k1 ? null : { y: sysOf(all), q: U.map(X => [X.c.h, X.c.vx, X.c.vz]) };   // (what the bodies have just before the knocks: kept if this step is the first touch)
      raw = Math.max(raw, -g0.g);
      // ---- the knocks, in the race's order: the pairs of cars, the safety car, the walls, the trailers ----
      const s0 = all.map(snap), y0 = sysOf(all);
      let hitNow = false;   // (a knock call did something this step: a push, or the bodies only moved apart)
      for (const c of cars) c.hitCar = 0;
      for (let i = 0; i < rc.length; i++) for (let j = i + 1; j < rc.length; j++) {
        const a = rc[i], b = rc[j], qa = snap(a), qb = snap(b), imp = C.carCollide(a, b);
        if (imp > 0 || a.x !== qa[0] || a.z !== qa[1] || b.x !== qb[0] || b.z !== qb[1]) hitNow = true;
        if (imp > 0) { nImp++; if (imp > 0.5) nBig++; impMax = Math.max(impMax, imp);
          for (const [c, q] of [[a, qa], [b, qb]]) { if (c.net || a.contactX == null) continue; const m = mOf(c), rx = c.x - a.contactX, rz = c.z - a.contactZ, orb = m * (rx * (c.vz - q[4]) - rz * (c.vx - q[3])); lNum += Math.sign(orb) * (orb + IOf(c) * (c.w - q[5])); lDen += Math.abs(orb); } }
      }
      for (const s of scs) for (const c of rc) if (!c.net) { const imp = C.carCollide(s, c); if (imp > 0) { nImp++; if (imp > 0.5) nBig++; impMax = Math.max(impMax, imp); hitNow = true; } }
      for (const c of cars) if (!c.net) C.wallCollide(c, H.plane, true);
      for (const c of cars) c.hitCar = 0;
      C.Race.prototype._tlStep.call(race, DT, false);
      for (const c of cars) if (c.hitCar > 0) { nImp++; if (c.hitCar > 0.5) nBig++; impMax = Math.max(impMax, c.hitCar); hitNow = true; break; }   // (a trailer's knock: counted once a step)
      if (!k1 && (g0.g < 0 || hitNow)) {   // the first touch: what the bodies had just before its knocks
        k1 = k; gap1 = g0.g; const q = was0.q, sp = Math.hypot(q[0][1], q[0][2]); u0 = sp > 0.5 ? [q[0][1] / sp, q[0][2] / sp] : [Math.cos(q[0][0]), Math.sin(q[0][0])];
        pre = was0.y; vc = (q[0][1] - q[1][1]) * u0[0] + (q[0][2] - q[1][2]) * u0[1];
        U.forEach((X, n) => { const v = Math.hypot(q[n][1], q[n][2]); X.h0 = q[n][0]; X.vx0 = q[n][1]; X.vz0 = q[n][2]; X.dir0 = v > 1 ? Math.atan2(q[n][2], q[n][1]) : null; X.v.push((q[n][1] * u0[0] + q[n][2] * u0[1]) * KMH); });
      }
      const y1 = sysOf(all), g1 = minGap();
      if (!Number.isFinite(y1.px + y1.pz + y1.E + y1.L + all.reduce((s, b) => s + b.x + b.z + b.h, 0))) nan = true;
      if (tr && (k1 ? k - k1 <= Math.round((o.tspan || 0.3) / DT) : g0.g < 1)) tr.push({ k, t: tc, gap: g1.g, raw: g0.g, b: all.map((b, n) => ({ v0: [s0[n][3], s0[n][4], s0[n][5]], v: [b.vx, b.vz, b.w], h: b.h, x: b.x, z: b.z, xgl: b.xgl || 0, kc: b.csKc || 0, cs: Math.hypot(b.cSx || 0, b.cSz || 0), rel: b.rel })) });
      if (!k1) continue;
      // ---- what the knocks of this step did (the collision calls only) ----
      const touch = g0.g < 0 || hitNow;
      gain = Math.max(gain, y1.E - y0.E);
      { let n = 0; for (const X of U) for (const b of X.B) { const q = s0[n++], m = mOf(b); if (b.net) continue; X.dP[0] += m * (b.vx - q[3]); X.dP[1] += m * (b.vz - q[4]); if (k - k1 <= marks[1]) { X.dP01[0] += m * (b.vx - q[3]); X.dP01[1] += m * (b.vz - q[4]); } } }
      ovl = Math.max(ovl, -g1.g);
      for (const [a, b] of cross) if (inBox(a, b) || inBox(b, a)) pass = true;
      if (touch) { last = k; if (!was && k > k1) tog++;
        const [a, b] = g0.P, dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 1, vn = ((b.vx - a.vx) * dx + (b.vz - a.vz) * dz) / d, rel = Math.hypot(b.vx - a.vx, b.vz - a.vz);
        if (rel < 0.5) { stickRun += DT; stick = Math.max(stick, stickRun); } else stickRun = 0;
        if (was && Math.abs(vn) > 0.05 && Math.abs(vnPrev) > 0.05 && vn * vnPrev < 0) flip++;
        vnPrev = vn;
      } else { stickRun = 0; if (sep1 == null) sep1 = k - k1; }
      was = touch;
      const kk = k - k1, mi = marks.indexOf(kk);
      for (const X of U) { const c = X.c, v = Math.hypot(c.vx, c.vz), ch = Math.cos(X.h0), sh = Math.sin(X.h0);
        X.hMax = Math.max(X.hMax, Math.abs(wrap(c.h - X.h0)) * D); X.yaw = Math.max(X.yaw, Math.abs(c.w) * D);
        X.lat = Math.max(X.lat, Math.abs(-(c.vx - X.vx0) * sh + (c.vz - X.vz0) * ch));
        if ((c.xgl || 0) > X.gl) X.gl = c.xgl; if (X.gl > 0 && !c.xgl && X.glBack == null) X.glBack = kk * DT;
        const sl = v > 1.5 ? Math.abs(wrap(Math.atan2(c.vz, c.vx) - c.h)) : 0, ok = Math.min(sl, Math.PI - sl) < 3 / D && Math.abs(c.w) < 6 / D; if (!ok) X.off = kk + 1;
        for (const b of X.B) if (b.rel != null) X.fold = Math.max(X.fold, Math.abs(b.rel) * D);
        if (mi >= 0) { X.v.push((c.vx * u0[0] + c.vz * u0[1]) * KMH); if (mi === 2) X.exit = X.dir0 != null && v > 1 ? wrap(Math.atan2(c.vz, c.vx) - X.dir0) * D : null;
          if (mi === 3) { X.hEnd = wrap(c.h - X.h0) * D; X.sp2 = v * KMH; X.rev = v > 1 && c.vx * Math.cos(c.h) + c.vz * Math.sin(c.h) < -0.5; X.dmg = c.dmg || 0; } } }
      if (mi >= 0) { E.push(y1.E); P.push([y1.px, y1.pz]); const vs = (cars[1].vx - cars[0].vx) * u0[0] + (cars[1].vz - cars[0].vz) * u0[1]; if (mi === 0) e1 = vc > 0.5 ? vs / vc : null; if (mi === 1) e01 = vc > 0.5 ? vs / vc : null; }
    }
    if (!k1) return { hit: false, name: o.name };
    const A = U[0], B = U[1], pA = Math.hypot(A.dP[0], A.dP[1]), pB = Math.hypot(B.dP[0], B.dP[1]), net = cars.some(c => c.net);
    const unit = (X) => ({ id: X.c.m.id, m: X.m, v: X.v, dv01: X.v[2] - X.v[0], sp2: X.sp2, exit: X.exit, hMax: X.hMax, hEnd: X.hEnd, yaw: X.yaw, gl: X.gl, glBack: X.glBack, straight: X.off * DT <= AFTER ? X.off * DT : null, lat: X.lat, dmg: X.dmg, fold: X.c.tl ? X.fold : null, rev: !!X.rev,
      dvK: Math.hypot(X.dP[0], X.dP[1]) / X.m * KMH });
    return { hit: true, name: o.name, phys, t1: k1 * DT, A: unit(A), B: unit(B), closing: vc * KMH, e1, e01,
      ratio: pB > 1e-6 ? pA / pB : null, pErr: net ? null : Math.hypot(A.dP[0] + B.dP[0], A.dP[1] + B.dP[1]) / Math.max(pA, pB, 1e-9) * 100,
      E0: pre.E / 1000, eImp: (1 - E[0] / pre.E) * 100, e01E: (1 - E[1] / pre.E) * 100, e2: (1 - E[3] / pre.E) * 100, gain, gainPct: gain / pre.E * 100,
      p0: [pre.px, pre.pz], p1: P[0], p01: P[1], lErr: lDen > 1 ? lNum / lDen * 100 : null,
      gap1: Math.max(0, gap1) * 100, nImp, nBig, impMax: impMax * KMH, steps: last - k1 + 1, sep1, still: last >= k1 + marks[3] - 1, tog, stick, flip, ovl: Math.max(0, ovl) * 100, raw: raw * 100, pass, nan, trace: tr };
  } finally { Math.random = orig; C.setTest(null); }
}

// ---- tables ----
const f = (v, d = 0) => v == null ? '-' : Number.isFinite(v) ? v.toFixed(d) : String(v);
const pad = (s, n) => { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); };
function table(head, rows) {
  const w = head.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i]).length)));
  say(head.map((h, i) => pad(h, w[i])).join('  ')); for (const r of rows) say(r.map((c, i) => pad(c, w[i])).join('  '));
}
const vs = (X) => X.v.map(v => f(v)).join('>');   // (before > after the first touch's step > +0.1 > +0.5 > +2 s)
const flags = (R) => [R.nan ? 'NaN' : '', R.pass ? 'skozi' : '', R.gap1 > 1 ? 'dotik ' + f(R.gap1) + ' cm prej' : '', R.still ? 'se-drzi' : '', R.stick > 0.2 ? 'lepi ' + f(R.stick, 1) + 's' : '', R.flip > 2 ? 'trese ' + R.flip : '', R.tog > 0 ? 'znova ' + R.tog : '', R.A.rev ? 'A-nazaj' : '', R.B.rev ? 'B-nazaj' : ''].filter(Boolean).join(',') || '-';
const want = (name) => !ONLY || name.indexOf(ONLY) >= 0;
const HEAD = ['scenarij', 'mA:mB kg', 'vA km/h (pred>1>0.1>0.5>2s)', 'vB km/h', 'dvA:dvB', 'razm', 'e1', 'e.1', 'dP%', 'E0kJ', 'E-%tr', 'E-%.1', 'E-%2s', 'obrA/B', 'yawA/B', 'glA/B', 'ravnoA/B', 'n', 'kor', 'prekr', 'opombe'];
const row = (R) => !R.hit ? [R.name, 'ni dotika'] : [R.name, f(R.A.m) + ':' + f(R.B.m), vs(R.A), vs(R.B), f(R.A.dvK, 1) + ':' + f(R.B.dvK, 1), f(R.ratio, 2), f(R.e1, 2), f(R.e01, 2), f(R.pErr, 1), f(R.E0), f(R.eImp), f(R.e01E), f(R.e2),
  f(R.A.hMax) + '/' + f(R.B.hMax), f(R.A.yaw) + '/' + f(R.B.yaw), f(R.A.gl, 2) + '/' + f(R.B.gl, 2), f(R.A.straight, 2) + '/' + f(R.B.straight, 2), R.nImp + '(' + R.nBig + ')', R.steps, f(R.ovl), flags(R)];
const LEG = 'v: along A\'s way, before > after the first touch\'s step > +0.1 > +0.5 > +2 s; dvA:dvB the knocks\' own changes of speed (km/h), razm = (mA dvA)/(mB dvB), 1 = momentum kept; e1 / e.1 parting over closing speed after the first step / at +0.1 s; dP% momentum made or lost by the knocks; E-% kinetic energy lost over the first step / by +0.1 s / by +2 s; obr the largest heading change (deg), yaw deg/s, gl the grip lost (xgl), ravno s until straight; n pushes (of them with over 0.5 m/s of closing speed), kor steps from the first touch to the last, prekr the deepest overlap after the knocks (cm); opombe: dotik .. cm prej the first knock came with the true boxes still that far apart, se-drzi touching at +2 s, lepi the longest stretch touching with under 0.5 m/s between them, trese the closing speed changing sign step after step, znova touching again after parting; with a rig dP% also holds what its tractor\'s tyres took in Race._tlStep';

// ===================== 1 vozila: weights and yaw inertia =====================
if (want('vozila')) {
  const rows = [], all = [];
  const add = (id, name, m, L, W, kI, a, b, sel) => { const I = m * kI * kI, kb = Math.sqrt((L * L + W * W) / 12), r = { id, name, mass: m, len: L, wid: W, kI, I, kBox: kb, kOverBox: kI / kb, kOverL: kI / L, kOverAB: a != null ? kI / Math.sqrt(a * b) : null, sel }; all.push(r); return r; };
  const SEL = ['mravlja', 'strelica', 'miska', 'kolibri', 'formula', 'rally', 'kaze', 'medved', 'predsednik', 'goljat', 'titan', 'kamen'];
  for (const M of C.MODELS) add(M.id, M.name, M.mass, M.len, M.wid, M.kI, M.a, M.b, SEL.indexOf(M.id) >= 0);
  for (const id of ['cisterna', 'zrcalni']) { const c = new C.Car(MOD(id), { phys: 'cs' }); for (const [T, nm] of [[c.tl, 'prikolica'], [c.tl.next, '2. cisterna']]) if (T) add(id + '+' + nm, nm, T.m.mass, T.m.len, T.m.wid, T.m.kI, null, null, true); }
  for (const r of all) if (r.sel) rows.push([r.id, f(r.mass), f(r.len, 2) + 'x' + f(r.wid, 2), f(r.kI, 2), f(r.I), f(r.kOverL, 3), f(r.kOverBox, 2), f(r.kOverAB, 2), f(C.MODELS.find(m => m.id === r.id) ? C.fuelTank(MOD(r.id)) : 0)]);
  const cars = all.filter(r => r.kOverAB != null), mm = (k) => [Math.min(...cars.map(r => r[k])), Math.max(...cars.map(r => r[k]))];
  const sum = { n: cars.length, mass: mm('mass'), kOverL: mm('kOverL'), kOverBox: mm('kOverBox'), kOverAB: mm('kOverAB'), lowest: cars.slice().sort((a, b) => a.kOverL - b.kOverL).slice(0, 3).map(r => r.id + ' ' + f(r.kOverL, 3)), highest: cars.slice().sort((a, b) => b.kOverL - a.kOverL).slice(0, 3).map(r => r.id + ' ' + f(r.kOverL, 3)) };
  say('== 1 vozila: teža in vztrajnostni moment (Car.I = mass x kI^2; a trailer: m (L^2 + W^2) / 12)');
  table(['vozilo', 'kg', 'LxW m', 'kI m', 'I kg m2', 'kI/L', 'kI/škatla', 'kI/sqrt(ab)', 'gorivo kg'], rows);
  say(`vseh ${sum.n} vozil: masa ${sum.mass[0]}-${sum.mass[1]} kg; kI/L ${f(sum.kOverL[0], 3)}-${f(sum.kOverL[1], 3)} (najmanj ${sum.lowest.join(', ')}; največ ${sum.highest.join(', ')}); kI/škatla ${f(sum.kOverBox[0], 2)}-${f(sum.kOverBox[1], 2)}; kI/sqrt(ab) ${f(sum.kOverAB[0], 2)}-${f(sum.kOverAB[1], 2)}`);
  say();
  out.sections.vozila = { rows: all, summary: sum };
}

// ===================== 1 mase: the lightest into the heaviest =====================
const PAIRS = [['miska', 'kamen'], ['mravlja', 'kamen'], ['rally', 'cisterna'], ['rally', 'zrcalni']];   // (light, heavy: a field the game races (the trucks' fill); the lightest and the heaviest alone; a car against the rig; against the road train)
function massScen(L, Hv, V) {
  const P = { plA: true }, n = (s) => `${s} ${L}/${Hv} ${V}`;
  return [
    [n('celno 2V'), (H) => SC.head(H, L, Hv, V, V, P)], [n('celno 2V 0.5 m iz sredine'), (H) => SC.head(H, L, Hv, V, V, { plA: true, off: 0.5 })],
    [n('celno L>T-stoji'), (H) => SC.head(H, L, Hv, V, 0, P)], [n('celno T>L-stoji'), (H) => SC.head(H, Hv, L, V, 0, P)],
    [n('zadaj L>T'), (H) => SC.rear(H, L, Hv, V, V - 30, P)], [n('zadaj T>L'), (H) => SC.rear(H, Hv, L, V, V - 30, P)],
    [n('T L>T-stoji'), (H) => SC.tbone(H, L, Hv, V, 0, P)], [n('T T>L-stoji'), (H) => SC.tbone(H, Hv, L, V, 0, P)],
    [n('T T>L-stoji pri prednji osi'), (H) => SC.tbone(H, Hv, L, V, 0, { plA: true, along: MOD(L).len * 0.3 })],
  ];
}
if (want('mase')) {
  const res = [];
  for (const [L, Hv] of PAIRS) for (const V of [60, 120]) for (const [name, b] of massScen(L, Hv, V)) res.push(run('cs', TXD, b, { name }));
  say(`== 1 mase: lahko v težko in težko v lahko (klasična fizika cs, različica ${cvName(CV)}; A zadene B, igralec je A)`);
  table(HEAD, res.map(row)); say(LEG); say();
  // the damage each takes (Car.dmg after 2 s) against its own change of speed
  const dm = res.filter(R => R.hit && /celno 2V|T L>T|T T>L/.test(R.name) && / 120$/.test(R.name));
  say('škoda (Car.dmg po 2 s) proti lastni spremembi hitrosti, 120 km/h:');
  table(['scenarij', 'dvA km/h', 'dvB km/h', 'škoda A', 'škoda B'], dm.map(R => [R.name, f(R.A.dvK, 1), f(R.B.dvK, 1), f(R.A.dmg, 2), f(R.B.dmg, 2)])); say();
  out.sections.mase = res;
}

// ===================== 1 gorivo: fuelKg and the player's pm =====================
if (want('gorivo')) {
  const rows = [], res = [];
  const one = (name, tx, b) => { const R = run('cs', tx, b, { name }); res.push(R); rows.push([name, f(R.A.m) + ':' + f(R.B.m), f(R.A.dvK, 2) + ':' + f(R.B.dvK, 2), f(R.A.dvK / R.B.dvK, 3), f(R.B.m / R.A.m, 3), f(R.ratio, 3), f(R.pErr, 1), f(R.gainPct, 2)]); };
  const base = (o) => (H) => SC.rear(H, 'rally', 'kamen', 120, 90, o);
  one('zadaj rally>kamen, brez goriva', { cv: 1 }, base({ plA: true }));
  one('zadaj rally>kamen, polna rezervoarja', { cv: 1 }, base({ plA: true, A: { fuel: 1 }, B: { fuel: 1 } }));
  one('zadaj rally>rally, A poln (60 kg), B prazen', { cv: 1 }, (H) => SC.rear(H, 'rally', 'rally', 120, 90, { plA: true, A: { fuel: 1 } }));
  one('zadaj formula>formula, A poln (105 kg), B prazen', { cv: 1 }, (H) => SC.rear(H, 'formula', 'formula', 120, 90, { plA: true, A: { fuel: 1 } }));
  for (const pm of [1, 1.7, 3]) one(`zadaj rally>rally, igralec A, cPm ${pm}`, { cv: 1, cPm: pm }, (H) => SC.rear(H, 'rally', 'rally', 120, 90, { plA: true }));
  one('zadaj rally>rally, igralec B, cPm 1.7', { cv: 1, cPm: 1.7 }, (H) => SC.rear(H, 'rally', 'rally', 120, 90, { plB: true }));
  one('zadaj rally>rally, dva tekmeca, cPm 1.7', { cv: 1, cPm: 1.7 }, (H) => SC.rear(H, 'rally', 'rally', 120, 90, {}));
  one('Arkadna: zadaj rally>rally, igralec A', { cv: 2 }, (H) => SC.rear(H, 'rally', 'rally', 120, 90, { plA: true }));
  one('Arkadna: celno miska(igralec)>kamen', { cv: 2 }, (H) => SC.head(H, 'miska', 'kamen', 120, 120, { plA: true }));
  one('Arkadna: celno miska>kamen(igralec)', { cv: 2 }, (H) => SC.head(H, 'miska', 'kamen', 120, 120, { plB: true }));
  say('== 1 gorivo in pm: kaj naredita teža goriva (fuelKg) in igralčev faktor teže (KV.pm, Nastavitve cPm)');
  table(['scenarij', 'mA:mB kg', 'dvA:dvB km/h', 'dvA/dvB', 'mB/mA', 'razm', 'dP%', 'E+ %'], rows);
  say('dvA/dvB against mB/mA: equal when momentum is kept; razm = (mA dvA)/(mB dvB) with the real weights; dP% the momentum made or lost; E+ the most energy one step\'s knocks added (% of E0)'); say();
  out.sections.gorivo = res;
}

// ===================== 2 prikolice =====================
// the rig turning on the plane, alone: a spot on the bend's inner side its tractor passes clear of (0.15 m or more) and its trailer, cutting
// in, then sweeps with d m of its flank (for 'the trailer into a car': the car stands there, along the trailer's heading at that moment)
function sweepSpot(H, rig, v, st, car, d) {
  const c = mk(H, rig, { x: 0, z: 0, h: 0, v, pl: false }), Mc = MOD(car), hist = [];
  for (let k = 1; k <= 5 / DT; k++) { H.step(c, { st: k * DT > 0.3 ? st : 0, thr: 'hold' }); if (k % 3 === 0) hist.push({ t: k * DT, c: { x: c.x, z: c.z, h: c.h, m: c.m }, T: { x: c.tl.x, z: c.tl.z, h: c.tl.h, m: c.tl.m } }); }
  const sg = Math.sign(wrap(hist[hist.length - 1].c.h)) || 1;   // (the way it turned: the inner side is on that hand)
  for (const h of hist) { if (h.t < 1.2) continue;
    const T = h.T, off = T.m.wid / 2 + Mc.wid / 2 - d, spot = { x: T.x - Math.sin(T.h) * sg * off, z: T.z + Math.cos(T.h) * sg * off, h: T.h, m: Mc };
    if (hist.every(q => boxGap(q.c, spot) > 0.15)) return { x: spot.x, z: spot.z, h: spot.h, t: h.t, v, d };
  }
  return null;
}
if (want('prikolice')) {
  const CAR = 'rally', R1 = 'cisterna', R2 = 'zrcalni', T1 = MOD(R1).trailer, mid = T1.kp[0] + T1.f - T1.len / 2, tail = T1.kp[0] + T1.f - T1.len + 1.0;   // (the trailer's middle and a metre ahead of its tail, from the tractor's middle)
  const T2 = MOD(R2).trailer, mid2 = T2.kp[0] + T2.next.kp[0] + T2.next.f - T2.next.len / 2;
  const P = { plA: true }, L = [
    ['avto 120 > rep prikolice (60)', (H) => SC.rear(H, CAR, R1, 120, 60, P)],
    ['avto 120 > rep prikolice, 1 m iz sredine', (H) => SC.rear(H, CAR, R1, 120, 60, { plA: true, off: 1.0 })],
    ['avto 100 > bok prikolice na sredini (vlačilec 30 počez)', (H) => SC.tbone(H, CAR, R1, 100, 30, { plA: true, along: mid })],
    ['avto 100 > bok prikolice pri repu (vlačilec 30)', (H) => SC.tbone(H, CAR, R1, 100, 30, { plA: true, along: tail })],
    ['avto 100 > bok stoječe prikolice na sredini', (H) => SC.tbone(H, CAR, R1, 100, 0, { plA: true, along: mid })],
    ['avto ob prikolici, naslon 3 st (oba 80)', (H) => SC.lean(H, CAR, R1, 80, 3, { plA: true, x: mid })],
    ['avto 80 celno > vlačilec 80 (vleče)', (H) => SC.head(H, CAR, R1, 80, 80, P)],
    ['avto 80 celno 1 m iz sredine > vlačilec 80', (H) => SC.head(H, CAR, R1, 80, 80, { plA: true, off: 1.0 })],
    ['avto 100 > bok kabine (vlačilec 60 počez)', (H) => SC.tbone(H, CAR, R1, 100, 60, { plA: true, along: 1.5 })],
    ['avto: sunek v nos vlačilca 8 m/s počez (oba 80)', (H) => SC.pit(H, CAR, R1, 80, 8, { plA: true, on: -0.2 })],
    ['vlačilec 90 > avto 60 od zadaj', (H) => SC.rear(H, R1, CAR, 90, 60, P)],
    ['vlačilec 80 > bok stoječega avta', (H) => SC.tbone(H, R1, CAR, 80, 0, P)],
    ['vlačilec 90 > rep prikolice drugega (60)', (H) => SC.rear(H, R1, R1, 90, 60, P)],
    ['vlačilca vštric, naslon 3 st (oba 80)', (H) => SC.lean(H, R1, R1, 80, 3, { plA: true, x: 0.5 })],
    ['vlačilec 80 celno > vlačilec 80', (H) => SC.head(H, R1, R1, 80, 80, P)],
    ['avto 120 > rep 2. cisterne vlaka (60)', (H) => SC.rear(H, CAR, R2, 120, 60, P)],
    ['avto 100 > bok 2. cisterne (vlak 30 počez)', (H) => SC.tbone(H, CAR, R2, 100, 30, { plA: true, along: mid2 })],
    ['avto 80 celno > vlak 80', (H) => SC.head(H, CAR, R2, 80, 80, P)],
  ];
  const res = [], spots = {};
  for (const phys of ['cs', 'nova']) {
    const Hh = RIG[phys]; let spot = null;
    for (const v of [40, 30, 20]) for (const d of [0.6, 0.4, 0.25]) if (!spot) spot = sweepSpot(Hh, R1, v, 1, CAR, d);   // (the fastest bend and the deepest sweep there is a spot for)
    const LL = L.slice();
    if (spot) LL.push([`prikolica v ovinku pomete stoječ avto (vlačilec ${spot.v}, poln zasuk, ${spot.d} m boka)`, (H) => { const A = mk(H, R1, { x: 0, z: 0, h: 0, v: spot.v, pl: true }), B = mk(H, CAR, { x: spot.x, z: spot.z, h: spot.h, v: 0 }); return { cars: [A, B], input: (i, t) => i === 0 ? { st: t > 0.3 ? 1 : 0, thr: 'hold' } : { st: 0, thr: 0 } }; }]);
    spots[phys] = spot;
    for (const [name, b] of LL) { const R = run(phys, TXD, b, { name: name + ' [' + phys + ']', wait: 5 }); res.push(R); }
  }
  say(`== 2 prikolice: TITAN CISTERNA (5300 + 12000 kg) in ZRCALNI VLAK (7000 + 11000 + 11000 kg), avto BURJA R7 1150 kg, različica ${cvName(CV)}`);
  table(HEAD.concat(['pregibA/B']), res.map(R => row(R).concat(R.hit ? [f(R.A.fold) + '/' + f(R.B.fold)] : []))); say(LEG + '; pregib: the largest angle between a tractor and its trailer (deg)'); say();
  say('stoječi avto za »prikolica pomete«: ' + Object.keys(spots).map(k => k + ' ' + (spots[k] ? `x ${f(spots[k].x, 1)} z ${f(spots[k].z, 1)} m, ${f(spots[k].h * D)} st, prikolica tam po ${f(spots[k].t, 2)} s` : 'ni mesta (vlačilec ne gre mimo za 0.15 m)')).join('; ')); say();
  out.sections.prikolice = res;
}

// ===================== 3 razlicice: six scenarios, the versions side by side =====================
const VERS = [1, 2, 3, 4, 5].concat(CV != null && CV > 5 ? [CV] : []);
const SIX = [
  ['celno 120+120', (r) => (H) => SC.head(H, 'rally', 'rally', 120, 120, r)],
  ['zadaj 120>90', (r) => (H) => SC.rear(H, 'rally', 'rally', 120, 90, r)],
  ['T 120>stoji', (r) => (H) => SC.tbone(H, 'rally', 'rally', 120, 0, r)],
  ['naslon 3 st 120', (r) => (H) => SC.lean(H, 'rally', 'rally', 120, 3, r)],
  ['sunek zadaj 8 m/s 120', (r) => (H) => SC.pit(H, 'rally', 'rally', 120, 8, r)],
  ['celno lahek>težek 120+120', (r) => (H) => SC.head(H, 'miska', 'kamen', 120, 120, r)],
];
const ROLES = { 'I>T': { plA: true }, 'T>I': { plB: true }, 'T>T': {}, 'I>sc': { plA: true, B: { sc: true } }, 'I>net': { plA: true, B: { net: true } } };   // (I the player, T a rival: who hits > who is hit)
if (want('razlicice')) {
  const res = [], rows = [];
  for (const [name, mkS] of SIX) for (const cv of VERS) { const R = run('cs', { cv }, mkS(ROLES['I>T']), { name: name + ' | ' + cvName(cv) }); R.cv = cv; R.scen = name; res.push(R); rows.push(row(R)); }
  say('== 3 različice: šest scenarijev, enaki teži (BURJA R7 1150 kg), 120 km/h, igralec zadene tekmeca (I>T), klasična fizika');
  table(HEAD, rows); say(LEG); say();
  out.sections.razlicice = res;
  // where along the car the knock lands: square into its side at 120 km/h, at its rear axle, its middle, its front axle; the car hit stands or drives across at 60
  const res2 = [], rows2 = [], Lr = MOD('rally').len;
  for (const phys of ['cs', 'nova']) for (const vb of [0, 60]) for (const [nm, al] of [['zadnja os', -0.3 * Lr], ['sredina', 0], ['prednja os', 0.3 * Lr]]) {
    const R = run(phys, TXD, (H) => SC.tbone(H, 'rally', 'rally', 120, vb, { plA: true, along: al }), { name: `T 120 > ${nm}, zadeti ${vb ? 'pelje ' + vb : 'stoji'} [${phys}]` }); R.where = nm; res2.push(R);
    rows2.push(!R.hit ? [R.name, 'ni dotika'] : [R.name, f(R.B.hMax), f(R.B.hEnd), f(R.B.yaw), f(R.B.gl, 2), f(R.B.straight, 2), f(R.lErr), f(R.A.hMax), R.nImp + '(' + R.nBig + ')', flags(R)]);
  }
  say(`== 3 mesto zadetka: pravokotno v bok pri 120 km/h, zadeti avto (B) stoji ali pelje počez pri 60 (BURJA R7, različica ${cvName(CV)})`);
  table(['scenarij', 'obr B največ', 'obr B po 2 s', 'yaw B st/s', 'gl B', 'ravno B s', 'manjka zasuka %', 'obr A', 'n', 'opombe'], rows2);
  say('manjka zasuka: the turn the push at the contact should have given a rigid body and did not (%; 0 a rigid body, 100 none)'); say();
  out.sections.mesto = res2;
}
if (want('vloge')) {
  const res = [], rows = [];
  for (const [name, mkS] of SIX) for (const cv of VERS) for (const role in ROLES) {
    const R = run('cs', { cv }, mkS(ROLES[role]), { name: `${name} | ${cvName(cv)} | ${role}` }); R.cv = cv; R.scen = name; R.role = role; res.push(R);
    if (!R.hit) { rows.push([name, cvName(cv), role, 'ni dotika']); continue; }
    rows.push([name, cvName(cv), role, f(R.A.dv01, 1) + '/' + f(R.B.dv01, 1), f(R.A.dvK, 1) + ':' + f(R.B.dvK, 1), f(R.pErr, 0), f(R.A.lat, 1) + '/' + f(R.B.lat, 1), f(R.A.hMax) + '/' + f(R.B.hMax), f(R.A.gl, 2) + '/' + f(R.B.gl, 2), f(R.A.straight, 2) + '/' + f(R.B.straight, 2), f(R.A.sp2) + '/' + f(R.B.sp2), flags(R)]);
  }
  say('== 3 vloge: igralec (I), tekmec (T), varnostni avto (sc), prijateljev avto na spletu (net); kdo zadene > kdo je zadet');
  table(['scenarij', 'različica', 'vloga', 'dv.1 A/B km/h', 'dvA:dvB trk', 'dP%', 'počez A/B m/s', 'obr A/B', 'gl A/B', 'ravno A/B s', 'v2s A/B', 'opombe'], rows);
  say('dv.1: the change of speed along A\'s way by +0.1 s (tyres included); dvA:dvB the knocks\' own; počez: the largest speed across its own heading; v2s: the speed at +2 s'); say();
  out.sections.vloge = res;
}

// ===================== 4 ohranitev: momentum, angular momentum, energy at the knocks =====================
if (want('ohranitev')) {
  const SET = [
    ['celno 120+120 0.6 m iz sredine', (r) => (H) => SC.head(H, 'rally', 'rally', 120, 120, Object.assign({ off: 0.6 }, r))],
    ['zadaj 120>90 0.6 m iz sredine', (r) => (H) => SC.rear(H, 'rally', 'rally', 120, 90, Object.assign({ off: 0.6 }, r))],
    ['T 120 > prednja os stoječega', (r) => (H) => SC.tbone(H, 'rally', 'rally', 120, 0, Object.assign({ along: 1.15 }, r))],
    ['T 120 > avto počez pri 60', (r) => (H) => SC.tbone(H, 'rally', 'rally', 120, 60, r)],
    ['naslon 3 st 120', (r) => (H) => SC.lean(H, 'rally', 'rally', 120, 3, r)],
    ['sunek zadaj 8 m/s 120', (r) => (H) => SC.pit(H, 'rally', 'rally', 120, 8, r)],
    ['celno lahek>težek 0.5 m iz sredine', (r) => (H) => SC.head(H, 'miska', 'kamen', 120, 120, Object.assign({ off: 0.5 }, r))],
    ['T težek>lahek stoji', (r) => (H) => SC.tbone(H, 'kamen', 'miska', 120, 0, r)],
  ];
  const res = [], rows = [];
  for (const phys of ['cs', 'nova']) for (const cv of VERS) {
    let pMax = 0, lMin = Infinity, lMax = -Infinity, gMax = 0, gAt = '', nan = 0, pass = 0, worstP = '';
    for (const [name, mkS] of SET) for (const role of ['I>T', 'T>T']) {
      const R = run(phys, { cv }, mkS(ROLES[role]), { name: `${name} | ${cvName(cv)} | ${phys} | ${role}` }); R.cv = cv; R.scen = name; R.role = role; res.push(R);
      if (!R.hit) continue;
      if (R.pErr > pMax) { pMax = R.pErr; worstP = name + ' ' + role; }
      if (R.lErr != null) { lMin = Math.min(lMin, R.lErr); lMax = Math.max(lMax, R.lErr); }
      if (R.gainPct > gMax) { gMax = R.gainPct; gAt = `${name} ${role}: +${f(R.gain / 1000, 1)} kJ`; }
      if (R.nan) nan++; if (R.pass) pass++;
    }
    rows.push([phys, cvName(cv), f(pMax, 1), worstP || '-', f(lMin) + ' do ' + f(lMax), f(gMax, 2), gAt || '-', nan, pass]);
  }
  say('== 4 ohranitev pri trkih (klici trkov, brez gum): 8 scenarijev x vlogi I>T in T>T');
  table(['fizika', 'različica', 'dP% največ', 'kje', 'manjkajoči zasuk %', 'E+ % največ', 'kje', 'NaN', 'skozi'], rows);
  say('dP%: the momentum the knocks made or lost, a share of what they passed on; manjkajoči zasuk: the turn the push at the contact should have given and did not (0 a rigid body, 100 none, < 0 too much); E+: the most kinetic energy one step\'s knocks added, a share of the energy before'); say();
  out.sections.ohranitev = res;
}

// ===================== 5 proga: the same knock in a seeded race at Spa =====================
if (want('proga')) {
  const o = { ok: false };
  const orig = Math.random;
  try {
    C.setTest(TXD); Math.random = seeded(64);
    const T = new C.Track(C.TRACKS.find(d => d.id === 'spa')), r = new C.Race(T, { numAI: 6, playerGrid: 7, laps: 3, playerModel: MOD('kamen'), assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); r.start();
    for (let k = 1; k <= 8 / DT; k++) { Math.random = seeded(1000 + k); C.aiControl(r.player, r, DT); r.step(DT); }   // (the start: the race is on)
    const P = r.player, O = r.cars.find(c => c !== P && c.m.id === 'miska') || r.cars.find(c => c !== P);
    // the straightest 120 m of the lap, far from the other cars: the two put nose to nose on its middle line
    let bi = 0, bv = Infinity; const n = T.N, win = Math.round(60 / (T.len / n));
    for (let i = 0; i < n; i++) { let m = 0; for (let j = -win; j <= win; j += 4) m = Math.max(m, Math.abs(wrap(T.hd[(i + j + n) % n] - T.hd[i]))); const far = r.cars.every(c => c === P || c === O || Math.hypot(c.x - T.px[i], c.z - T.pz[i]) > 150); if (far && m < bv) { bv = m; bi = i; } }
    const hd = T.hd[bi], V = 120 / KMH, gap = 1.0, dx = Math.cos(hd), dz = Math.sin(hd), half = (P.m.len + O.m.len) / 2 + gap;
    const put = (c, x, z, h, v) => { c.place(x, z, h); c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v; c.locked = false; const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; } };
    put(P, T.px[bi] - dx * half / 2, T.pz[bi] - dz * half / 2, hd, V); put(O, T.px[bi] + dx * half / 2, T.pz[bi] + dz * half / 2, hd + Math.PI, V);
    let pre = null, hitK = 0; const tr = [];
    for (let k = 1; k <= 60 && !hitK; k++) {
      const b = [P.vx, P.vz, O.vx, O.vz]; P.hitCar = O.hitCar = 0; P.hitDebris = O.hitDebris = 0; Math.random = seeded(5000 + k);
      P.inThr = 0; P.inBrk = 0; P.inSteer = 0; r.step(DT);
      if (P.hitCar > 0 || O.hitCar > 0) { hitK = k; pre = b; }
    }
    if (hitK) {
      const u = [dx, dz], along = (vx, vz) => (vx * u[0] + vz * u[1]) * KMH;
      o.ok = true; o.track = 'spa'; o.at = Math.round(T.s ? T.s[bi] : bi * T.len / n); o.bend = bv * D; o.light = O.m.id; o.heavy = P.m.id; o.field = r.cars.map(c => c.m.id).join(',');
      o.vP = [along(pre[0], pre[1]), along(P.vx, P.vz)]; o.vO = [along(pre[2], pre[3]), along(O.vx, O.vz)];
      o.dvP = o.vP[1] - o.vP[0]; o.dvO = o.vO[1] - o.vO[0]; o.ratio = (mOf(P) * Math.abs(o.dvP)) / (mOf(O) * Math.abs(o.dvO)); o.closing = P.hitCar * KMH; o.yawO = Math.abs(O.w) * D; o.yawP = Math.abs(P.w) * D; o.debris = [P.hitDebris || 0, O.hitDebris || 0, (r.debris || []).length];
      const R = run('cs', TXD, (H) => SC.head(H, P.m.id, O.m.id, 120, 120, { plA: true }), { name: 'plane' });
      o.plane = { vP: [R.A.v[0], R.A.v[1]], vO: [R.B.v[0], R.B.v[1]], dvP: R.A.v[1] - R.A.v[0], dvO: R.B.v[1] - R.B.v[0], yawO: R.B.yaw };
    }
    out.sections.proga = o;
    say(`== 5 proga: isti trk v dirki s semenom (Spa, Race.step; različica ${cvName(CV)})`);
    if (!o.ok) say('ni dotika');
    else { table(['kje', 'težki km/h pred>po', 'lahki km/h pred>po', 'dv težki', 'dv lahki', 'razm (m dv)', 'yaw lahki st/s'], [
      [`Spa, ${o.heavy} (igralec) celno v ${o.light}, ravnina pri ${o.at} m`, f(o.vP[0], 1) + '>' + f(o.vP[1], 1), f(o.vO[0], 1) + '>' + f(o.vO[1], 1), f(o.dvP, 1), f(o.dvO, 1), f(o.ratio, 2), f(o.yawO)],
      ['testna ravnina, isti vozili', f(o.plane.vP[0], 1) + '>' + f(o.plane.vP[1], 1), f(o.plane.vO[0], 1) + '>' + f(o.plane.vO[1], 1), f(o.plane.dvP, 1), f(o.plane.dvO, 1), f(mOf({ m: P.m }) * Math.abs(o.plane.dvP) / (mOf({ m: O.m }) * Math.abs(o.plane.dvO)), 2), f(o.plane.yawO)]]);
      say(`polje dirke: ${o.field}; koraki do dotika ${hitK}; kosi na progi po trku ${o.debris[2]}, povoženi v istem koraku: težki ${o.debris[0] ? 'da' : 'ne'}, lahki ${o.debris[1] ? 'da' : 'ne'}; the speeds along the heavy one's way, before the step of the first touch and after it (one whole Race.step: the cars' own step too)`); }
    say();
  } finally { Math.random = orig; C.setTest(null); }
}

// ===================== one scenario step by step =====================
if (TRACE) {
  const allS = [];
  for (const [L, Hv] of PAIRS) for (const V of [60, 120]) allS.push(...massScen(L, Hv, V));
  for (const [name, mkS] of SIX) allS.push([name, mkS(ROLES[arg('--role') || 'I>T'])]);
  for (const vb of [0, 60]) for (const [nm, al] of [['zadnja os', -0.3], ['prednja os', 0.3]]) allS.push([`T 120 > ${nm}, zadeti ${vb ? 'pelje ' + vb : 'stoji'}`, (H) => SC.tbone(H, 'rally', 'rally', 120, vb, { plA: true, along: al * MOD('rally').len })]);
  const hit = allS.find(s => s[0] === TRACE) || allS.find(s => s[0].indexOf(TRACE) >= 0);
  if (!hit) say('no scenario ' + TRACE + ': ' + allS.map(s => s[0]).join(' | '));
  else {
    const R = run(arg('--phys') || 'cs', TXD, hit[1], { name: hit[0], trace: true, tspan: +(arg('--tspan') || 0.3) });
    say('== ' + hit[0] + ' (' + (arg('--phys') || 'cs') + ', ' + cvName(CV) + '): per step, each body: v (m/s x, z), w (rad/s) before the knocks > after; heading deg; xgl; csKc; push across');
    for (const s of R.trace || []) say(`${f(s.t, 3)} gap ${f(s.raw, 3)}>${f(s.gap, 3)} ` + s.b.map(b => `[${f(b.v0[0], 2)},${f(b.v0[1], 2)},${f(b.v0[2], 2)} > ${f(b.v[0], 2)},${f(b.v[1], 2)},${f(b.v[2], 2)} h ${f(b.h * D, 1)} gl ${f(b.xgl, 2)} kc ${f(b.kc, 3)} cS ${f(b.cs, 2)}${b.rel != null ? ' rel ' + f(b.rel * D, 1) : ''}]`).join(' '));
    say(row(R).join('  '));
  }
}

if (JSON_OUT) { for (const k in out.sections) { const S = out.sections[k]; if (Array.isArray(S)) for (const R of S) delete R.trace; } process.stdout.write(JSON.stringify(out) + '\n'); }
else process.stdout.write(lines.join('\n') + '\n');
