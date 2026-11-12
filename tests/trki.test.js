// Trki med avti (Nastavitve: Trki med avti; Core KV, kCollide, kTake): the knocks between cars in the versions Simulacija, Arkadna, Mehka,
// Kaskaderska and Stara (the old knock), on the flat test plane (tests/lib/handling.js, BURJA R7 'rally', two cars stepped as a race steps them:
// both drive, then the knock) and in races. Checked here:
// - the choice (Core.setTest cv): Simulacija by default, cv 1-5 the versions, the rows over a version (cPm, cE, cMu, cYaw, cGl, cSl, cFx),
//   setTest(null) back to the default; Stara is the old knock (round ends, the classic's 0.1 bounce, every touch a full swing of the nose);
//   cv 6 Realistična (real), the sixth choice: the versions' knock with rules of its own at a touch (its checks: the point Realistična below)
// - Simulacija, classic physics: a car hit moves (equal weights: 100 km/h into a standing car, centred, the hit car leaves faster than the
//   one that hit it, both well under 100 and over 25 km/h; the old heavy knock left it standing); the bounce by the closing speed (a
//   light knock bounces more than a hard one, a car leaning on another not at all); no pop (under 3 cm a step; 5 at 100 km/h head on); a racing bump 0.6 m off
//   the middle turns neither car more than 4 deg and costs no grip; a rival drifting into the player's flank at 3 deg (and back to its lane) nudges it (0.4-2 m/s
//   across, under 5 deg, the slide gone in under 0.8 s) and costs no grip; side by side, leaning for a second, the cars do not lock their
//   speeds (no glue) and do not jitter; a hard tap on a rear quarter (a PIT, 8 m/s across) takes the hit car's grip (it slides and turns
//   15-70 deg, the grip back within 1.5 s), a knock on a front quarter does not (the nose slides, it straightens itself); sparks for a
//   knock (fxCar), none with cFx 0 (fxQ)
// - Arkadna: in a side knock the player moves less than the rival and the player's grip is spared (a PIT on the player: under half the
//   turn Simulacija gives), the rival PIT'ed by the player spins more than in Simulacija; Mehka: less turn than Simulacija; Kaskaderska:
//   a PIT turns the car more than Simulacija
// - the new physics (Nova) with Simulacija: the same knocks nudge, turn and straighten, nothing NaN
// - a friend's car online (net) is not moved by the knock: the local car takes the whole separation and only its own share of the push
// - the walls as they were (the user's): the knock off a barrier is the same in every version
// - races (Spa, Bathurst: 12 rivals, the player on the autopilot, 150 s) in every version: nothing NaN, every car moving, no two cars
//   touching side by side for 2 s on end (glued), spins (past 40 deg at speed) at most 4 in Simulacija, Arkadna and Mehka
// - Realistična (cv 6; docs/trki-realizem.md, »Zasnova prototipa Realistična«, »Testi«): conservation (in every knock of two cars the pair's
//   momentum is kept to 1e-9 and its kinetic energy with the turning grows by at most 0.5 kJ; at the barrier neither the energy nor the speed
//   along it grows and no corner is left inside; a thing by the road never speeds the car up), symmetry (the mirror image of a knock, of a
//   barrier and of a thing off the car's line gives the mirror image of the outcome to 1e-9; square into the barrier no yaw and no slide along
//   it), limits (no NaN at 60-200 km/h, never over 9 rad/s with the grip lost, PITs ordered by their impulse, the turns, the leaving angles and
//   the losses to the things in their bands)
//   node tests/trki.test.js
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { loadCore, ROOT } = require('./lib/core.js');
const { seeded, stateLine, raceState } = require('./lib/sim.js');

const C = loadCore();
const HC = require('./lib/handling.js')(C, 'cs'), HN = require('./lib/handling.js')(C, 'nova');
const { DT } = HC, D = 180 / Math.PI;
const checks = [];
const ok = (name, cond, detail) => checks.push({ name, ok: !!cond, detail });
const f = (v, d = 2) => Number.isFinite(v) ? v.toFixed(d) : String(v);
const test = (tx, fn) => { C.setTest(tx || null); try { return fn(); } finally { C.setTest(null); } };
const SIM = { cv: 1 }, ARC = { cv: 2 }, SOFT = { cv: 3 }, STUNT = { cv: 4 }, OLD = { cv: 5 }, REAL = { cv: 6 };
const car = (H, v, pl) => { const c = H.mkCar('rally', { v }); c.isPlayer = pl; c.noReverse = true; return c; };
const lane = (c, z0) => Math.max(-1, Math.min(1, -(0.35 * (c.z - z0) + 2.0 * c.h + 0.25 * c.vz / Math.max(5, c.speed))));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// two cars on the plane stepped as a race does; S: { P, O, iP(t), iO(t) }. Per car after the first touch: the largest sideways speed (in its
// own heading at the touch), the largest turn of the heading, its speed at the end, the largest grip lost (xgl) and when it came back, the time
// its slide (beta) was gone; the largest position step the knock made (pop), the parting speed in the first 0.4 s, the share of steps touching
function duel(H, tx, S, secs) {
  return test(tx, () => {
    const { P, O } = S; let t1 = null, pop = 0, sep = 0, n = 0, tch = 0, nan = false;
    const R = (c) => ({ c, h0: c.h, vx0: c.vx, vz0: c.vz, x0: c.x, z0: c.z, lat: 0, turn: 0, gl: 0, glBack: null, calm: null });
    const A = R(P), B = R(O);
    for (let i = 1; i <= secs / DT; i++) {
      const t = i * DT; H.step(P, S.iP(t)); H.step(O, S.iO(t));
      const px = P.x, pz = P.z, ox = O.x, oz = O.z, k0 = P.vx + O.vx + P.vz + O.vz + P.w + O.w + (P.csKc || 0) + (O.csKc || 0);
      C.carCollide(P, O);
      const step = Math.max(Math.hypot(P.x - px, P.z - pz), Math.hypot(O.x - ox, O.z - oz)), touch = step > 0 || k0 !== P.vx + O.vx + P.vz + O.vz + P.w + O.w + (P.csKc || 0) + (O.csKc || 0);
      pop = Math.max(pop, step); if (!Number.isFinite(P.x + P.z + P.vx + P.vz + P.w + O.x + O.z + O.vx + O.vz + O.w)) nan = true;
      if (touch && t1 == null) t1 = t;
      if (t1 == null) { for (const X of [A, B]) { X.h0 = X.c.h; X.vx0 = X.c.vx; X.vz0 = X.c.vz; X.x0 = X.c.x; X.z0 = X.c.z; } continue; }
      if (t - t1 < 1.5) { n++; if (touch) tch++; }
      if (t - t1 < 0.4) { const dx = O.x - P.x, dz = O.z - P.z, d = Math.hypot(dx, dz) || 1; sep = Math.max(sep, ((O.vx - P.vx) * dx + (O.vz - P.vz) * dz) / d); }
      for (const X of [A, B]) { const c = X.c, ch = Math.cos(X.h0), sh = Math.sin(X.h0);
        X.lat = Math.max(X.lat, Math.abs(-(c.vx - X.vx0) * sh + (c.vz - X.vz0) * ch)); X.turn = Math.max(X.turn, Math.abs(wrap(c.h - X.h0)) * D);
        if ((c.xgl || 0) > X.gl) X.gl = c.xgl; if (X.gl > 0 && !c.xgl && X.glBack == null) X.glBack = t - t1;
        if (t - t1 > 0.1 && X.calm == null && Math.abs(c.beta || 0) < 0.035 && !(Math.hypot(c.cSx || 0, c.cSz || 0) > 0.1)) X.calm = t - t1; }
    }
    const out = (X) => ({ lat: X.lat, turn: X.turn, v: X.c.speed, gl: X.gl, glBack: X.glBack, calm: X.calm, moved: Math.hypot(X.c.x - X.x0, X.c.z - X.z0), side: Math.abs(-(X.c.x - X.x0) * Math.sin(X.h0) + (X.c.z - X.z0) * Math.cos(X.h0)), wEnd: X.c.w });   // (wEnd: the yaw rate at the end)
    return { hit: t1 != null, pop, sep, touch: n ? tch / n : 0, nan, P: out(A), O: out(B) };
  });
}
// the scenes (the player P, the other car O)
const SC = {
  // 100 km/h into a standing car, centred (O's brakes off: the push it takes, as it is)
  stand: (H) => { const P = car(H, 100, true), O = car(H, 0, false); O.place(0, 0, 0); P.place(-O.m.len - 0.05, 0, 0); P.vx = 27.8; return { P, O, iP: () => ({ st: 0, thr: 0 }), iO: () => ({ st: 0, thr: 0 }) }; },
  // a racing bump: the player at 120 km/h into a car at 100, 0.6 m off its middle, both holding their lines
  bump: (H) => { const P = car(H, 120, true), O = car(H, 100, false); O.place(0, 0, 0); P.place(-O.m.len - 0.3, 0.6, 0); P.vx = 33.3; O.vx = 27.8; return { P, O, iP: () => ({ st: lane(P, 0.6), thr: 'hold' }), iO: () => ({ st: lane(O, 0), thr: 'hold' }) }; },
  // a rival at 100 km/h drifting into the player's flank at 3 deg (1.5 m/s across), back to its lane after 0.4 s (as the AI does); the player's wheel straight
  drift3: (H) => { const P = car(H, 100, true), O = car(H, 100, false), a = -0.052, z0 = O.m.wid + 0.35; P.place(0, 0, 0); P.vx = 27.8; O.place(0.5, z0, a); O.vx = 27.8 * Math.cos(a); O.vz = 27.8 * Math.sin(a); return { P, O, iP: () => ({ st: 0, thr: 'hold' }), iO: (t) => ({ st: t < 0.4 ? 0 : lane(O, z0), thr: 'hold' }) }; },
  // side by side at 110 and 90 km/h, the player leaning on the other car for 1 s
  rub: (H) => { const P = car(H, 110, true), O = car(H, 90, false), w = O.m.wid + 0.15; P.place(-4, 0, 0); O.place(0, w, 0); P.vx = 30.6; O.vx = 25; return { P, O, iP: (t) => ({ st: t < 1 ? 0.25 : lane(P, 0), thr: 'hold' }), iO: () => ({ st: lane(O, w), thr: 'hold' }) }; },
  // a rival at 100 km/h into the player's rear quarter at 17 deg (a PIT: 8 m/s across)
  pit: (H) => { const P = car(H, 100, true), O = car(H, 100, false), a = 0.3; P.place(0, 0, 0); P.vx = 27.8; O.place(-P.m.len * 0.75, -P.m.wid - 0.95, a); O.vx = 27.8 * Math.cos(a); O.vz = 27.8 * Math.sin(a); return { P, O, iP: () => ({ st: 0, thr: 'hold' }), iO: () => ({ st: 0, thr: 'hold' }) }; },
  // the player into a rival's rear quarter at 17 deg
  pitP: (H) => { const O = car(H, 100, false), P = car(H, 100, true), a = 0.3; O.place(0, 0, 0); O.vx = 27.8; P.place(-O.m.len * 0.75, -O.m.wid - 0.95, a); P.vx = 27.8 * Math.cos(a); P.vz = 27.8 * Math.sin(a); P.h = a; return { P, O, iP: () => ({ st: 0, thr: 'hold' }), iO: () => ({ st: 0, thr: 'hold' }) }; },
  // a rival at 100 km/h swerving into the player's front quarter at 15 deg
  front: (H) => { const P = car(H, 100, true), O = car(H, 100, false), a = -0.26; P.place(0, 0, 0); P.vx = 27.8; O.place(P.m.len - 2.4, 2.9, a); O.vx = 27.8 * Math.cos(a); O.vz = 27.8 * Math.sin(a); return { P, O, iP: () => ({ st: 0, thr: 'hold' }), iO: () => ({ st: 0, thr: 'hold' }) }; },
};
const run = (H, tx, k, secs = 2) => duel(H, tx, SC[k](H), secs);

// ---- the choice ----
{
  const kc = () => C.TX.cv;
  C.setTest(null); const d0 = kc();
  C.setTest({ cv: 3, cPm: 1.5, cE: 0.5, cMu: 0.6, cYaw: 0.4, cGl: 0, cSl: 1.6, cFx: 0, aiSpr: 0.3 }); const T1 = Object.assign({}, C.TX);
  C.setTest({ cv: 'x', cE: NaN }); const T2 = Object.assign({}, C.TX); C.setTest(null);
  ok('the choice: nothing set by default (Simulacija), the version and its rows taken as numbers, setTest(null) clears them', d0 === null && T1.cv === 3 && T1.cPm === 1.5 && T1.cE === 0.5 && T1.cMu === 0.6 && T1.cYaw === 0.4 && T1.cGl === 0 && T1.cSl === 1.6 && T1.cFx === 0 && T1.aiSpr === 0.3 && T2.cv === null && T2.cE === null && Object.values(C.TX).every(v => v === null),
    JSON.stringify([T1, T2]));
  ok('the versions: Simulacija, Arkadna, Mehka, Kaskaderska, Stara in that order (cv 1-5), Realistična after them (cv 6: the others keep their numbers)', C.KV_IDS.join() === ',sim,arc,soft,stunt,old,real' && ['sim', 'arc', 'soft', 'stunt', 'real'].every(k => C.KV[k] && C.KV[k].pm > 0), C.KV_IDS.join());
}

// ---- Realistična (cv 6): the sixth choice, a knock of its own (docs/trki-realizem.md, »Zasnova prototipa Realistična«, »Testi«) ----
// Its rules work only at a touch (js/core.js krOn: kTakeR, kSlideR, wallR, propPush) and only for a car that is not exempt. The checks of the
// design: no touch (the drive to the last digit), the other versions (the reference tests/golden/trki.json), conservation, symmetry, limits, the
// exempt cars (a truck with its semi-trailer, the run from the police, the pit lane) and the online race. Each of them fails when the core is
// spoilt (the mutations they were tried with: docs/trki-realizem.md, »Testi različice Realistična«)
{
  const UPDATE = process.argv.includes('--update'), GFILE = path.join(__dirname, 'golden', 'trki.json');
  const VS = [['sim', SIM], ['arc', ARC], ['soft', SOFT], ['stunt', STUNT], ['old', OLD], ['real', REAL]];
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);   // (two lists of state lines, step by step)
  const firstDiff = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) return i + 1; return 0; };   // (the step, from 1; 0: none)
  const field = (a, b) => { const p = String(a).split(/[;|\n]/), q = String(b).split(/[;|\n]/); for (let i = 0; i < Math.max(p.length, q.length); i++) if (p[i] !== q[i]) return `${p[i]} / ${q[i]}`; return ''; };
  const idle = () => ({ st: 0, thr: 0 }), fin = (c) => Number.isFinite(c.x + c.z + c.h + c.vx + c.vz + c.w);

  // the choice
  {
    C.setTest(REAL); const cv = C.TX.cv, id = C.KV_IDS[cv]; C.setTest(null); const back = C.TX.cv, K = C.KV.real;
    const key = (r) => JSON.stringify(r), st = run(HC, REAL, 'stand', 0.25), so = run(HC, OLD, 'stand', 0.25), ss = run(HC, SIM, 'stand', 0.25), sd = run(HC, null, 'stand', 0.25);
    ok('Realistična: cv 6 is the version real with a row of its own (Simulacija\'s numbers and its own: the barrier, the yaw limit 9 rad/s); the versions\' knock (not the old one); setTest(null): the default again (Simulacija)',
      cv === 6 && id === 'real' && back === null && K.wMax === 9 && !!K.wall && K.e0 === C.KV.sim.e0 && K.mu === C.KV.sim.mu && st.hit && !st.nan && key(st) !== key(so) && key(sd) === key(ss),
      `player ${f(st.P.v * 3.6, 3)} km/h, the other ${f(st.O.v * 3.6, 3)} km/h (Simulacija ${f(ss.P.v * 3.6, 3)} / ${f(ss.O.v * 3.6, 3)}, Stara ${f(so.P.v * 3.6, 3)} / ${f(so.O.v * 3.6, 3)})`);
  }

  // -- the plane: two cars, no inputs. m = 1 or -1: the mirror image (z, the headings and vz the other way)
  const mOf = (c) => c.m.mass + (c.fuelKg || 0), IOf = (c) => c.I * mOf(c) / c.m.mass;
  const put = (c, x, z, h, v) => { c.place(x, z, h); c.vx = v * Math.cos(h); c.vz = v * Math.sin(h); const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; } c._vT = v; c._v = v; return c; };
  const SR = {
    // A along +x into the side of the standing B (its nose across the road), at B's front (s > 0) or rear part
    tbone: (H, V, s, m, idA) => { const B = car(H, 0, false), A = idA ? H.mkCar(idA, { v: 0 }) : car(H, 0, true); A.isPlayer = true; A.noReverse = true; put(B, 0, 0, m * Math.PI / 2, 0); put(A, -(B.m.wid / 2 + A.m.len / 2 + 0.3), m * s, 0, V); return { A, B }; },
    // head on, A's line off B's by off
    head: (H, V, off, m) => { const A = car(H, 0, true), B = car(H, 0, false), L = A.m.len; put(B, 0, 0, Math.PI, V); put(A, -(L + 0.3), m * off, 0, V); return { A, B }; },
    // into the back of a standing car, off its middle
    rear: (H, V, off, m) => { const A = car(H, 0, true), B = car(H, 0, false), L = A.m.len; put(B, 0, 0, 0, 0); put(A, -(L + 0.3), m * off, 0, V); return { A, B }; },
    // a PIT: A's front corner into B's flank (rear part, or front part) at vc across (tools/trki/avto-avto.js pit)
    pit: (H, V, vc, m, front) => { const A = car(H, 0, false), B = car(H, 0, true), M = A.m, L = M.len, W = M.wid, al = Math.asin(vc / V), lx = (front ? 0.35 : -0.35) * L, gap = 0.3, tc = gap / vc;
      const cx = lx - V * (Math.cos(al) - 1) * tc, cz = -W / 2 - gap; put(B, 0, 0, 0, V); put(A, cx - (L / 2 * Math.cos(al) - W / 2 * Math.sin(al)), m * (cz - (L / 2 * Math.sin(al) + W / 2 * Math.cos(al))), m * al, V); return { A, B }; },
  };
  // a car's state and its mirror image; the largest difference of two states (the heading as an angle)
  const sv = (c) => [c.x, c.z, c.h, c.vx, c.vz, c.w, c.csKc || 0, c.cSx || 0, c.cSz || 0, c.xgl || 0];
  const mir = (s) => [s[0], -s[1], -s[2], s[3], -s[4], -s[5], -s[6], s[7], -s[8], s[9]];
  const dev = (p, q) => Math.max(...p.map((x, i) => Math.abs(i === 2 ? wrap(x - q[i]) : x - q[i])));
  // the knocks of a pair, stepped as a race does (the cars' own steps, then the knock). Per knock (a step in which carCollide changed a speed):
  // the change of the pair's momentum (kg m/s) and of its kinetic energy with the turning (J). o.pre(A, B): before the first step
  function knock(H, tx, S, secs, o) {
    return test(tx, () => {
      const { A, B } = S, L = [], pE = () => { const ma = mOf(A), mb = mOf(B); return [ma * A.vx + mb * B.vx, ma * A.vz + mb * B.vz, 0.5 * (ma * (A.vx * A.vx + A.vz * A.vz) + mb * (B.vx * B.vx + B.vz * B.vz) + IOf(A) * A.w * A.w + IOf(B) * B.w * B.w)]; };
      if (o && o.pre) o.pre(A, B);
      let dp = 0, dE = -Infinity, wGl = 0, nan = false, hits = 0, first = null, h0 = B.h, turn = 0;
      for (let i = 1; i <= Math.round(secs / DT); i++) {
        H.step(A, idle()); H.step(B, idle());
        const b = pE(), k0 = [A.vx, A.vz, A.w, B.vx, B.vz, B.w].join();
        C.carCollide(A, B);
        if (k0 !== [A.vx, A.vz, A.w, B.vx, B.vz, B.w].join()) { const a = pE(); hits++; dp = Math.max(dp, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])); dE = Math.max(dE, a[2] - b[2]); if (!first) first = { i, a: sv(A), b: sv(B), la: stateLine(A), lb: stateLine(B) }; }
        for (const c of [A, B]) { if (!fin(c)) nan = true; if (c.xgl > 0) wGl = Math.max(wGl, Math.abs(c.w)); }
        if (!first) h0 = B.h; else if (Math.abs(wrap(B.h - h0)) > Math.abs(turn)) turn = wrap(B.h - h0);
        if (o && o.lines) L.push(stateLine(A) + '|' + stateLine(B));
      }
      return { hits, dp, dE, wGl, nan, turn: turn * D, first, a: sv(A), b: sv(B), L, end: [A.x, A.z, A.h * D, A.speed * 3.6, B.x, B.z, B.h * D, B.speed * 3.6] };
    });
  }
  const KN = [];   // [name, scene(m), axis (the cars along the axes: the mirror image exact to the end)]
  for (const kmh of [60, 120, 200]) { const V = kmh / 3.6;
    KN.push(['tbone-front-' + kmh, (m) => SR.tbone(HC, V, 1.2, m), 1], ['tbone-rear-' + kmh, (m) => SR.tbone(HC, V, -1.2, m), 1], ['head-off-' + kmh, (m) => SR.head(HC, V, 0.6, m), 1], ['rear-off-' + kmh, (m) => SR.rear(HC, V, 0.6, m), 1]);
    for (const vc of [2, 4, 8]) KN.push([`pit-${kmh}-rear-${vc}`, (m) => SR.pit(HC, V, vc, m, 0), 0], [`pit-${kmh}-front-${vc}`, (m) => SR.pit(HC, V, vc, m, 1), 0]); }
  const kn = {}; for (const [name, mk, axis] of KN) kn[name] = { name, axis, r: knock(HC, REAL, mk(1), 1.5), q: knock(HC, REAL, mk(-1), 1.5) };
  const KR = Object.values(kn), worst = (fn) => KR.reduce((a, b) => (fn(b) > fn(a) ? b : a));
  {
    const p = worst(x => x.r.dp), e = worst(x => x.r.dE);
    ok('Realistična, conservation: in every knock of two cars (30 scenes: T-bone at the front and the rear part, head on and from behind off the middle, PITs; 60, 120, 200 km/h) the pair\'s momentum is kept to 1e-9 kg m/s and its kinetic energy with the turning does not grow by more than 0.5 kJ',
      KR.every(x => x.r.hits > 0 && x.r.dp <= 1e-9 && x.r.dE <= 500), `momentum off by at most ${p.r.dp.toExponential(1)} kg m/s (${p.name}); the most energy added ${f(e.r.dE / 1000, 3)} kJ (${e.name})`);
    const d1 = (x) => (x.r.first && x.q.first && x.r.first.i === x.q.first.i ? Math.max(dev(mir(x.r.first.a), x.q.first.a), dev(mir(x.r.first.b), x.q.first.b)) : Infinity), d2 = (x) => Math.max(dev(mir(x.r.a), x.q.a), dev(mir(x.r.b), x.q.b));
    const a = worst(d1), ax = KR.filter(x => x.axis), b = ax.reduce((u, v) => (d2(v) > d2(u) ? v : u));
    ok('Realistična, symmetry: the mirror image of a knock gives the mirror image of its outcome: right after the first knock in all 30 scenes, and at the end (1.5 s) where the cars stand along the axes (12 scenes), to 1e-9',
      KR.every(x => d1(x) <= 1e-9) && ax.every(x => d2(x) <= 1e-9), `after the first knock off by at most ${a.r.first ? d1(a).toExponential(1) : '?'} (${a.name}); at the end ${d2(b).toExponential(1)} (${b.name})`);
    const w = worst(x => x.r.wGl), t = (n) => kn[n].r.turn, P = [2, 4, 8].map(v => t(`pit-60-rear-${v}`));
    ok('Realistična, limits: no NaN at 60, 120 and 200 km/h; while the grip is lost a car never turns faster than 9 rad/s; a PIT at 60 km/h turns the car the more the harder it is (2, 4, 8 m/s across); a T-bone at the front part turns a standing car a quarter of a turn at 60 km/h and more than a third at 120; from behind off the middle at 60 hardly at all',
      KR.every(x => !x.r.nan && !x.q.nan && x.r.wGl <= 9 + 1e-9) && Math.abs(P[0]) < Math.abs(P[1]) && Math.abs(P[1]) < Math.abs(P[2]) && Math.abs(P[0]) < 10 && Math.abs(P[2]) > 60
        && t('tbone-front-60') < -70 && t('tbone-front-60') > -120 && t('tbone-rear-60') > 70 && t('tbone-rear-60') < 120 && t('tbone-front-120') < -125 && Math.abs(t('rear-off-60')) < 10,
      `the fastest turn with the grip lost ${f(w.r.wGl, 3)} rad/s (${w.name}); PIT 60 km/h: ${P.map(x => f(x, 1)).join(' / ')} deg; T-bone front 60 / 120: ${f(t('tbone-front-60'), 1)} / ${f(t('tbone-front-120'), 1)} deg, rear 60: ${f(t('tbone-rear-60'), 1)} deg; from behind 60: ${f(t('rear-off-60'), 1)} deg`);
  }

  // -- the barrier and the things by the road: a road of its own (straight and level, a wall 4.5 m from the middle line on both sides)
  const ovalPts = (L, R) => { const p = [], r = Math.PI / 180;
    for (let x = 0; x < L; x += 100) p.push([x, 0]);
    for (let a = -90; a < 90; a += 15) p.push([L + R * Math.cos(a * r), R + R * Math.sin(a * r)]);
    for (let x = L; x > 0; x -= 100) p.push([x, 2 * R]);
    for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]);
    return p; };
  const OV = new C.Track({ id: 'trki-oval', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4, walls: [[100, 1400, 1, -1.5, 20], [100, 1400, -1, -1.5, 20]] });
  let I0 = 0; for (let i = 0; i < OV.N; i++) if (Math.abs(OV.pz[i]) < 1 && Math.abs(OV.px[i] - 600) < Math.abs(OV.px[I0] - 600)) I0 = i;   // (the middle of the first straight)
  const model = (id) => C.MODELS.find(m => m.id === id), RIG = (C.MODELS.find(m => m.trailer && !m.trailer.next) || C.MODELS.find(m => m.trailer) || {}).id;
  const mkRace = (id) => { Math.random = seeded(64); const r = new C.Race(OV, { numAI: 0, playerGrid: 1, laps: 99, playerModel: id ? model(id) : C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); r.start(); return r; };
  const placeCar = (c, x, z, h, v) => { c.place(x, z, h); c.locked = false; c.steer = 0; c.inSteer = c.inThr = c.inBrk = c.inHand = 0; c.digitalSteer = true; c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v;
    const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
    c.q = OV.query(c.x, c.z, I0, c.q); c.sPrev = c.q.s; c.dist = c.q.s - OV.startS;
    if (c.tl) { const R = c.tl; R.vx = c.vx; R.vz = c.vz; if (R.next) { R.next.vx = c.vx; R.next.vz = c.vz; } } };
  // by the barrier on the side (1 right, -1 left), th off the road toward it, its nearest corner gap m from it
  const spot = (c, side, th, gap) => { const B = side > 0 ? OV.br[I0] : OV.bl[I0], d0 = side * (B - gap - (c.m.len / 2 * Math.sin(th) + c.m.wid / 2 * Math.cos(th))); return { x: OV.px[I0] + OV.nx[I0] * d0, z: OV.pz[I0] + OV.nz[I0] * d0, h: OV.hd[I0] + side * th }; };
  const _cq = {};
  const room = (c, side) => { const ch = Math.cos(c.h), sh = Math.sin(c.h); let r = 1e9;   // (the nearest corner's room to the barrier: < 0 inside it)
    for (const p of c.corners) { const q = OV.query(c.x + p[0] * ch - p[1] * sh, c.z + p[0] * sh + p[1] * ch, c.q.i, _cq); r = Math.min(r, (side > 0 ? q.br : q.bl) - side * q.d); } return r; };
  const stepR = (race, k) => { for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; } Math.random = seeded(1000 + k); race.step(DT); };
  // a lone car into the barrier at th deg and kmh, stepped as a race does (its own step, then the barrier). Per touch: the change of its kinetic
  // energy with the turning and of its speed along the barrier, the room of its corners after it. o.pre(c): before the first step
  function wall(tx, th, kmh, side, secs, o) {
    return test(tx, () => {
      const c = mkRace().player, P = spot(c, side, th / D, 0.3), F = { tx: OV.tx[I0], tz: OV.tz[I0], mx: side * OV.nx[I0], mz: side * OV.nz[I0] };
      placeCar(c, P.x, P.z, P.h, kmh / 3.6); if (o && o.pre) o.pre(c);
      const m = c.m.mass, I = c.I, E = () => 0.5 * (m * (c.vx * c.vx + c.vz * c.vz) + I * c.w * c.w), vt = () => c.vx * F.tx + c.vz * F.tz, vn = () => c.vx * F.mx + c.vz * F.mz, vIn = Math.hypot(c.vx, c.vz);
      let first = 0, n = 0, dE = -Infinity, dT = -Infinity, deep = Infinity, nan = false, wGl = 0, w1 = null, vt1 = null, v1 = null, exit = null; const tr = [], L = [];
      for (let k = 1; k <= Math.round(secs / DT); k++) {
        c.steer += C.clamp(c.inSteer - c.steer, -6 * DT, 6 * DT); c.step(DT, OV);
        const e0 = E(), t0 = Math.abs(vt()); c.wallX = NaN;
        C.wallCollide(c, OV, true); OV.query(c.x, c.z, c.q.i, c.q);
        const hit = !Number.isNaN(c.wallX);
        if (hit) { n++; if (!first) { first = k; w1 = c.w; vt1 = vt(); v1 = Math.hypot(c.vx, c.vz); } dE = Math.max(dE, E() - e0); dT = Math.max(dT, Math.abs(vt()) - t0); deep = Math.min(deep, room(c, side)); }
        if (!fin(c)) nan = true; if (c.xgl > 0) wGl = Math.max(wGl, Math.abs(c.w));
        c.hitWall = 0; c.hitCar = 0; c.fxWall = 0; tr.push([hit, c.vx, c.vz]); L.push(stateLine(c));
      }
      // the leaving: the last touch before 0.25 s without one; the angle of its way to the barrier then (deg)
      for (let k = 0; k < tr.length && exit == null; k++) if (tr[k][0] && !tr.slice(k + 1, k + 31).some(x => x[0])) exit = Math.atan2(-(tr[k][1] * F.mx + tr[k][2] * F.mz), tr[k][1] * F.tx + tr[k][2] * F.tz) * D;
      const q = OV.query(c.x, c.z, c.q.i, _cq);
      return { first, n, dE, dT, deep, nan, wGl, w1, vt1, v1, vIn, exit, L, st: [q.s, side * q.d, side * wrap(c.h - OV.hd[q.i]), vt(), vn(), side * c.w, c.steer, c.xgl || 0, Math.abs(c.csKc || 0)], end: [q.s, q.d, wrap(c.h - OV.hd[q.i]) * D, Math.hypot(c.vx, c.vz) * 3.6] };
    });
  }
  const WL = [[5, 60], [15, 60], [15, 120], [30, 60], [30, 120], [30, 200], [45, 120], [85, 60], [85, 120], [90, 60], [90, 120], [90, 200], [95, 120]];
  const wl = {}; for (const [th, kmh] of WL) wl[th + '/' + kmh] = { name: th + '/' + kmh, th, r: wall(REAL, th, kmh, 1, 2), l: wall(REAL, th, kmh, -1, 2), s: wall(SIM, th, kmh, 1, 2) };
  {
    const W = Object.values(wl), worst = (fn) => W.reduce((a, b) => (fn(b) > fn(a) ? b : a)), e = worst(x => x.r.dE), t = worst(x => x.r.dT), d = worst(x => -x.r.deep), m = worst(x => dev(x.r.st, x.l.st)), w = worst(x => x.r.wGl);
    ok('Realistična, the barrier, conservation: at no touch (13 scenes: 5 to 95 deg, 60 to 200 km/h) does the car\'s kinetic energy with the turning or its speed along the barrier grow, and no corner is left inside the barrier',
      W.every(x => x.r.n > 0 && x.r.dE <= 1e-6 && x.r.dT <= 1e-9 && x.r.deep >= -1e-6), `energy at a touch at most ${f(e.r.dE / 1000, 6)} kJ (${e.name}), speed along the barrier ${t.r.dT.toExponential(1)} m/s (${t.name}; Simulacija at 90/120 +${f(wl['90/120'].s.dT, 1)} m/s), the deepest corner ${d.r.deep.toExponential(1)} m (${d.name})`);
    const sq = ['90/60', '90/120', '90/200'].map(k => wl[k].r);
    ok('Realistična, the barrier, symmetry: the left barrier gives the mirror image of the right one to 1e-9 (all 13 scenes: also 15, 30, 85 and 95 deg); square into it (90 deg) the car neither turns nor slides along it',
      W.every(x => dev(x.r.st, x.l.st) <= 1e-9) && sq.every(x => Math.abs(x.w1) <= 1e-9 && Math.abs(x.vt1) <= 1e-9), `left and right off by at most ${dev(m.r.st, m.l.st).toExponential(1)} (${m.name}); 90 deg at 120 km/h: yaw ${f(sq[1].w1 * D, 3)} deg/s, along the barrier ${f(sq[1].vt1, 3)} m/s (Simulacija ${f(wl['90/120'].s.w1 * D, 1)} deg/s, ${f(wl['90/120'].s.vt1, 2)} m/s)`);
    const ex = ['15/120', '30/120', '30/200'].map(k => wl[k].r.exit), slow = sq.map(x => x.v1 / x.vIn);
    ok('Realistična, the barrier, limits: no NaN, never faster than 9 rad/s with the grip lost; a glancing touch slower than its threshold (5 deg at 60 km/h) is Simulacija\'s to the last digit, a harder one its own; at 15 to 30 deg and 120 to 200 km/h the car leaves the barrier at 1 to 5 deg (Simulacija: under 1 deg); square into it it keeps under a tenth of its speed',
      W.every(x => !x.r.nan && !x.l.nan && x.r.wGl <= 9 + 1e-9) && same(wl['5/60'].r.L, wl['5/60'].s.L) && W.filter(x => x.th > 5).every(x => !same(x.r.L, x.s.L)) && ex.every(x => x > 1 && x < 5) && slow.every(x => x < 0.1),
      `leaving at ${ex.map(x => f(x, 2)).join(' / ')} deg (Simulacija ${['15/120', '30/120', '30/200'].map(k => f(wl[k].s.exit, 2)).join(' / ')}); square: ${slow.map(x => f(x * 100, 1)).join(' / ')} % of the speed left; the fastest turn with the grip lost ${f(w.r.wGl, 2)} rad/s (${w.name})`);
  }

  // a thing by the road (Race.setProps: cone, tyre, bale, bstack, lamp) in the car's way, off m off its line; beside it the same run without the
  // thing (the twin). loss: the speed lost to the twin at the last touch, % of the speed before the first. o.pre(c): before the first step
  function prop(tx, kind, kmh, off, secs, o) {
    return test(tx, () => {
      const mk = (withProp) => { const race = mkRace(), P = race.player; placeCar(P, OV.px[I0], 0, 0, kmh / 3.6); if (o && o.pre) o.pre(P);
        if (withProp) { race.setProps([{ kind, x: P.x, z: P.z, yaw: 0, col: 0, i: I0 }], null); const K = race.props[0].K, ahead = P.circles[P.circles.length - 1] + P.rad + (K.reach || K.rh) + 0.6;
          race.setProps([{ kind, x: P.x + ahead, z: off, yaw: 0, col: 0, i: I0 }], null); }
        return race; };
      const A = mk(true), B = mk(false), P = A.player, Q = B.player, L = [];
      let first = 0, last = 0, fast = -Infinity, v0 = 0, st1 = null, nan = false, loss = 0;
      for (let k = 1; k <= Math.round(secs / DT); k++) {
        const vb = Math.hypot(P.vx, P.vz); stepR(A, k); stepR(B, k);
        if (P.hitDebris > 0) { last = k; if (!first) { first = k; v0 = vb; st1 = sv(P); } loss = (Math.hypot(Q.vx, Q.vz) - Math.hypot(P.vx, P.vz)) / v0 * 100; }
        fast = Math.max(fast, Math.hypot(P.vx, P.vz) - Math.hypot(Q.vx, Q.vz)); if (!fin(P)) nan = true;
        L.push(stateLine(P) + '|' + stateLine(A.props[0]));
      }
      return { first, last, loss, fast, nan, st1, L, end: [loss, P.x, P.z, P.h * D, Math.hypot(P.vx, P.vz) * 3.6] };
    });
  }
  const KINDS = ['cone', 'tyre', 'bale', 'bstack', 'lamp'], pr = {};
  for (const kind of KINDS) for (const kmh of [60, 120, 200]) pr[kind + '-' + kmh] = { name: kind + '-' + kmh, kind, r: prop(REAL, kind, kmh, 0, 1.2), a: kind === 'bstack' ? null : prop(REAL, kind, kmh, 0.6, 1.2), b: kind === 'bstack' ? null : prop(REAL, kind, kmh, -0.6, 1.2) };
  {
    const Pq = Object.values(pr), fa = Pq.reduce((a, b) => (b.r.fast > a.r.fast ? b : a)), off = Pq.filter(x => x.a), dm = (x) => (x.a.st1 && x.b.st1 && x.a.first === x.b.first ? dev(mir(x.a.st1), x.b.st1) : Infinity), m = off.reduce((a, b) => (dm(b) > dm(a) ? b : a));
    const l = (k) => pr[k].r.loss, sim = prop(SIM, 'cone', 120, 0, 1.2);
    ok('Realistična, the things by the road: a cone, a tyre, a bale, a stack of bales and a lamp post never speed the car up (15 scenes: 60, 120, 200 km/h, beside each the same run without the thing); 0.6 m off the car\'s line to the left and to the right gives mirror images at the first touch (1e-9); no NaN',
      Pq.every(x => x.r.first > 0 && !x.r.nan && x.r.fast <= 1e-9) && off.every(x => dm(x) <= 1e-9 && !x.a.nan && !x.b.nan), `the most gained on the twin ${fa.r.fast.toExponential(1)} m/s (${fa.name}); left and right off by at most ${dm(m).toExponential(1)} (${m.name})`);
    ok('Realistična, the things by the road, limits: the car loses the speed the thing\'s mass takes: a cone under 0.5 %, a bale under 3.5 %, the heavier thing more at the same speed (cone, tyre, bale, stack) and every one less at 200 than at 60 km/h; Simulacija takes 20 times more at a cone',
      [60, 120, 200].every(v => l('cone-' + v) > 0 && l('cone-' + v) < 0.5 && l('bale-' + v) < 3.5 && l('cone-' + v) < l('tyre-' + v) && l('tyre-' + v) < l('bale-' + v) && l('bale-' + v) < l('bstack-' + v)) && KINDS.every(k => l(k + '-200') < l(k + '-60')) && sim.loss > 20 * l('cone-120'),
      `60 / 120 / 200 km/h: ${KINDS.map(k => `${k} ${[60, 120, 200].map(v => f(l(k + '-' + v), 2)).join(' / ')} %`).join('; ')}; Simulacija, a cone at 120: ${f(sim.loss, 2)} %`);
  }
}

// ---- Stara: the old knock ----
{
  const rear = (tx) => test(tx, () => { const A = HC.mkCar('rally', { v: 72 }), B = HC.mkCar('rally', { v: 36 }); A.place(0, 0, 0); A.vx = 20; B.place(A.m.len - 0.02, 0, 0); B.vx = 10; C.carCollide(B, A); return (B.vx - A.vx) / 10; });   // (2 cm into each other: the boxes touch, the old circles too)
  const tap = (tx) => test(tx, () => { const A = HC.mkCar('rally', { v: 60 }), B = HC.mkCar('rally', { v: 60 }); A.place(0, 0, 0); A.vx = 16.7; B.place(A.m.len - 3.0, 1.55, -0.06); B.vx = 16.7 * Math.cos(-0.06); B.vz = 16.7 * Math.sin(-0.06); B.h = -0.06; C.carCollide(B, A); return Math.abs(A.csKc); });
  const o = rear(OLD), s = rear(SIM), ko = tap(OLD), ks = tap(SIM);
  ok('Stara: the old knock (the classic\'s bounce 0.1 of the closing speed; a light touch swings the nose by the whole kick, 23 deg); Simulacija: at 10 m/s closing a little more bounce (its bumpers), a light touch swings the nose a little',
    Math.abs(o - 0.1) < 0.03 && Math.abs(ko - C.CSK.tapMax) < 1e-6 && s > 0.11 && s < 0.2 && ks < 0.25 * C.CSK.tapMax, `bounce ${f(o)} / ${f(s)} of the closing speed, swing ${f(ko * D, 1)} / ${f(ks * D, 1)} deg`);
}

// ---- Simulacija (classic physics) ----
{
  const st = run(HC, SIM, 'stand', 0.25);
  ok('Simulacija: 100 km/h into a standing car (centred): the car hit moves (equal weights), it leaves faster than the one that hit it, both between 25 and 75 km/h; no pop (under 5 cm a step at 100 km/h)',
    st.hit && st.O.v > st.P.v && st.P.v * 3.6 > 25 && st.O.v * 3.6 < 75 && st.P.v * 3.6 < 75 && st.pop < 0.05, `player ${f(st.P.v * 3.6, 1)} km/h, the other ${f(st.O.v * 3.6, 1)} km/h, pop ${f(st.pop * 100, 1)} cm`);
  // the bounce by the closing speed: a rear-end knock at 2 m/s and at 8 m/s (cars side by side in a straight line, nothing else)
  const part = (dv) => test(SIM, () => { const A = HC.mkCar('rally', { v: 72 }), B = HC.mkCar('rally', { v: 72 }); A.place(0, 0, 0); A.vx = 20; B.place(A.m.len - 0.02, 0, 0); B.vx = 20 - dv; C.carCollide(B, A); return (B.vx - A.vx) / dv; });
  const lean = test(SIM, () => { const A = HC.mkCar('rally', { v: 72 }), B = HC.mkCar('rally', { v: 72 }); A.place(0, 0, 0); A.vx = 20; B.place(A.m.len - 0.02, 0, 0); B.vx = 19.7; C.carCollide(B, A); return B.vx - A.vx; });
  const p2 = part(2), p8 = part(8);
  ok('Simulacija: the bounce by the closing speed (a light knock 0.2-0.35 of it, a hard one less, 0.1-0.2; a car leaning on another at 0.3 m/s: none)',
    p2 > 0.2 && p2 < 0.35 && p8 > 0.1 && p8 < 0.2 && p8 < p2 && Math.abs(lean) < 0.01, `2 m/s: ${f(p2)}, 8 m/s: ${f(p8)}, leaning: ${f(lean, 3)} m/s apart`);
  const bu = run(HC, SIM, 'bump');
  ok('Simulacija: a racing bump 0.6 m off the middle (120 into 100 km/h): the car ahead is pushed on, neither car turns more than 4 deg or loses grip, no pop',
    bu.hit && bu.O.v * 3.6 > 105 && bu.P.turn < 4 && bu.O.turn < 4 && bu.P.gl === 0 && bu.O.gl === 0 && bu.pop < 0.03, `the car ahead ${f(bu.O.v * 3.6, 0)} km/h, turns ${f(bu.P.turn, 1)} / ${f(bu.O.turn, 1)} deg`);
  const dr = run(HC, SIM, 'drift3');
  ok('Simulacija: a rival drifting into the player\'s flank at 3 deg nudges it (0.4-2 m/s across, under 5 deg, the slide gone in under 0.8 s: the reference video ~1 s), no grip lost',
    dr.hit && dr.P.lat > 0.4 && dr.P.lat < 2 && dr.P.turn < 5 && dr.P.calm != null && dr.P.calm < 0.8 && dr.P.gl === 0, `${f(dr.P.lat)} m/s across, ${f(dr.P.turn, 1)} deg, calm in ${f(dr.P.calm)} s`);
  const rb = run(HC, SIM, 'rub', 2.5);
  ok('Simulacija: side by side at 110 and 90 km/h, the player leaning on the other car for 1 s: they do not lock their speeds (still 12 km/h or more apart), no jitter (under 2 cm a step)',
    rb.hit && rb.P.v - rb.O.v > 12 / 3.6 && rb.pop < 0.02, `${f(rb.P.v * 3.6, 1)} / ${f(rb.O.v * 3.6, 1)} km/h, pop ${f(rb.pop * 100, 1)} cm`);
  const pi = run(HC, SIM, 'pit', 2.5), fr = run(HC, SIM, 'front', 2.5);
  ok('Simulacija: a hard tap on the player\'s rear quarter (a PIT, 8 m/s across) takes its grip: it slides and turns 15-70 deg, the grip back within 1.5 s; a knock on its front quarter does not (under 20 deg, no grip lost)',
    pi.hit && pi.P.gl > 0.3 && pi.P.turn > 15 && pi.P.turn < 70 && pi.P.glBack != null && pi.P.glBack < 1.5 && fr.hit && fr.P.gl === 0 && fr.P.turn < 20 && !pi.nan && !fr.nan,
    `PIT: grip lost ${f(pi.P.gl)}, back in ${f(pi.P.glBack)} s, turned ${f(pi.P.turn, 1)} deg; front: ${f(fr.P.gl)}, ${f(fr.P.turn, 1)} deg`);
  const fx = (tx) => test(tx, () => { const P = HC.mkCar('rally', { v: 100 }), O = HC.mkCar('rally', { v: 0 }); P.isPlayer = true; O.place(0, 0, 0); P.place(-O.m.len + 0.02, 0, 0); P.vx = 27.8; P.fxCar = O.fxCar = 0; P.fxQ = O.fxQ = 0; C.carCollide(P, O); return { fx: Math.max(P.fxCar, O.fxCar), q: P.fxQ || O.fxQ }; });
  const s1 = fx(SIM), s0 = fx({ cv: 1, cFx: 0 });
  ok('Simulacija: a knock throws sparks (fxCar over 3 m/s, not held back); with Iskre izklop none (fxQ), the scrape marks stay (fxCar)', s1.fx > 3 && !s1.q && s0.q && s0.fx > 3, JSON.stringify([s1, s0]));
}

// ---- the other versions ----
{
  const sd = run(HC, ARC, 'drift3'), ss = run(HC, SIM, 'drift3');
  const pa = run(HC, ARC, 'pit', 2.5), ps = run(HC, SIM, 'pit', 2.5), qa = run(HC, ARC, 'pitP', 2.5), qs = run(HC, SIM, 'pitP', 2.5);
  ok('Arkadna: in a side knock the player moves less than the rival (and less than in Simulacija); a PIT on the player turns it under half as much as in Simulacija, the rival PIT\'ed by the player more than in Simulacija',
    sd.P.lat < sd.O.lat && sd.P.lat < ss.P.lat && pa.P.turn < 0.5 * ps.P.turn && qa.O.turn > qs.O.turn,
    `side: player ${f(sd.P.lat)} / rival ${f(sd.O.lat)} m/s (sim ${f(ss.P.lat)}); PIT on the player ${f(pa.P.turn, 1)} deg (sim ${f(ps.P.turn, 1)}), on the rival ${f(qa.O.turn, 1)} deg (sim ${f(qs.O.turn, 1)})`);
  const pm = run(HC, SOFT, 'pit', 2.5), pk = run(HC, STUNT, 'pit', 2.5);
  ok('Mehka turns a PIT\'ed car less than Simulacija, Kaskaderska more', pm.P.turn < ps.P.turn && pk.P.turn > ps.P.turn, `Mehka ${f(pm.P.turn, 1)}, Simulacija ${f(ps.P.turn, 1)}, Kaskaderska ${f(pk.P.turn, 1)} deg`);
  const rows = [run(HC, { cv: 1, cYaw: 0.4 }, 'pit', 2.5), run(HC, { cv: 1, cGl: 0 }, 'pit', 2.5), run(HC, { cv: 1, cE: 0 }, 'bump'), run(HC, { cv: 1, cPm: 2 }, 'drift3')];
  ok('the rows over a version: less turn (cYaw 0.4) and no grip lost (cGl 0) turn a PIT\'ed car less, no bounce (cE 0) parts a bump slower, a heavier player (cPm 2) is moved less',
    rows[0].P.turn < ps.P.turn && rows[1].P.gl === 0 && rows[1].P.turn < ps.P.turn && rows[2].sep < bu0().sep && rows[3].P.lat < ss.P.lat,
    `${f(rows[0].P.turn, 1)} / ${f(rows[1].P.turn, 1)} deg (sim ${f(ps.P.turn, 1)}), apart ${f(rows[2].sep)} m/s, moved ${f(rows[3].P.lat)} m/s (sim ${f(ss.P.lat)})`);
  function bu0() { return run(HC, SIM, 'bump'); }
}

// ---- the new physics ----
{
  const dr = run(HN, SIM, 'drift3'), pi = run(HN, SIM, 'pit', 2.5), bu = run(HN, SIM, 'bump');
  ok('Nova with Simulacija: a rival drifting into the flank nudges the car (under 2 m/s, under 8 deg), a PIT turns it (over 8 deg) and it straightens (under 0.5 rad/s at the end), a bump parts the cars, nothing NaN',
    dr.hit && dr.P.lat < 2 && dr.P.turn < 8 && pi.hit && pi.P.turn > 8 && Math.abs(pi.P.wEnd) < 0.5 && !dr.nan && !pi.nan && !bu.nan && bu.sep > 0.2, `${f(dr.P.lat)} m/s ${f(dr.P.turn, 1)} deg; PIT ${f(pi.P.turn, 1)} deg, at the end ${f(pi.P.wEnd)} rad/s; bump apart ${f(bu.sep)} m/s`);
}

// ---- a friend's car online ----
{
  const r = test(SIM, () => { const P = HC.mkCar('rally', { v: 100 }), O = HC.mkCar('rally', { v: 80 }); P.isPlayer = true; O.net = true; O.place(0, 0, 0); O.vx = 22.2; P.place(-O.m.len + 0.1, 0.3, 0); P.vx = 27.8;
    const o = [O.x, O.z, O.vx, O.vz, O.w], p0 = P.x; C.carCollide(P, O); return { same: o.join() === [O.x, O.z, O.vx, O.vz, O.w].join(), moved: p0 - P.x, dv: 27.8 - P.vx }; });
  ok('online: a friend\'s car is not moved by the knock (its own phone moves it); the local car takes the whole separation and its own share of the push', r.same && r.moved > 0 && r.dv > 0.5 && r.dv < 5, JSON.stringify(r));
}

// ---- the walls as they were ----
{
  const T = new C.Track(C.TRACKS.find(d => d.id === 'spa'));
  const hit = (tx) => test(tx, () => { const c = new C.Car(C.MODELS[4], { phys: 'cs' }); const i = 200, br = T.br[i];
    c.place(T.px[i] - T.nx[i] * (br - 0.5), T.pz[i] - T.nz[i] * (br - 0.5), Math.atan2(T.tz[i], T.tx[i]) - 0.35); c.q.i = i; T.query(c.x, c.z, i, c.q);
    const v = 25, h = c.h; c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v; c.w = 0.2; c.wq.forEach(q => q.i = -1); for (let k = 0; k < 30; k++) { c.x += c.vx / 120; c.z += c.vz / 120; T.query(c.x, c.z, c.q.i, c.q); C.wallCollide(c, T); }
    return [c.x, c.z, c.vx, c.vz, c.w].map(x => x.toFixed(6)).join(','); });
  const w = [OLD, SIM, ARC, SOFT, STUNT].map(hit);
  ok('walls: the knock off the barrier is the same in every version (the user\'s: the walls stay as they were)', w.every(x => x === w[0]), w.join(' | '));
}

// ---- races ----
function race(tid, tx) {
  return test(tx, () => {
    Math.random = seeded(64); const T = new C.Track(C.TRACKS.find(d => d.id === tid));
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); r.start();
    const sp = new Map(), glue = new Map(); let spins = 0, glued = 0, nan = false, hits = 0;
    for (let k = 1; k <= 150 / DT; k++) {
      Math.random = seeded(1000 + k); C.aiControl(r.player, r, DT); r.step(DT);
      for (const c of r.cars) { if (!Number.isFinite(c.x + c.z + c.vx + c.vz + c.w)) nan = true; if (c.hitCar > 3) hits++; c.hitCar = 0;
        const s = Math.abs(c.beta || 0) > 0.7 && c.speed > 8; if (s && !sp.get(c)) spins++; sp.set(c, s); }
      if (k % 12 === 0) for (let a = 0; a < r.cars.length; a++) for (let b = a + 1; b < r.cars.length; b++) { const A = r.cars[a], B = r.cars[b], dx = B.x - A.x, dz = B.z - A.z; if (dx * dx + dz * dz > 36) { glue.set(a * 100 + b, 0); continue; }
        const ch = Math.cos(A.h), sh = Math.sin(A.h), lx = dx * ch + dz * sh, lz = -dx * sh + dz * ch, touch = Math.abs(lx) < A.m.len * 0.9 && Math.abs(lz) < (A.m.wid + B.m.wid) * 0.5 + 0.08 && A.speed > 5;
        const n = touch ? (glue.get(a * 100 + b) || 0) + 1 : 0; glue.set(a * 100 + b, n); if (n === 20) glued++; }
    }
    return { nan, spins, glued, hits, moving: r.cars.filter(c => c.speed > 5).length, n: r.cars.length };
  });
}
for (const tid of ['spa', 'bathurst']) {
  const res = [SIM, ARC, SOFT, STUNT, OLD].map(tx => race(tid, tx)), nm = ['Simulacija', 'Arkadna', 'Mehka', 'Kaskaderska', 'Stara'];
  ok(`race ${tid} in every version: nothing NaN, every car moving, no two cars glued side by side for 2 s, spins at most 4 in Simulacija, Arkadna and Mehka`,
    res.every(x => !x.nan && x.moving === x.n && x.glued === 0) && res.slice(0, 3).every(x => x.spins <= 4), res.map((x, i) => `${nm[i]}: ${x.hits} knocks, ${x.spins} spins, ${x.glued} glued, ${x.moving}/${x.n} moving`).join('; '));
}

let bad = 0;
console.log('== trki med avti (različice)');
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} checks`);
process.exitCode = bad ? 1 : 0;
