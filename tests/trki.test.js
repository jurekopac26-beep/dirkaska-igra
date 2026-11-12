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
// - the walls as they were (the user's): the knock off a barrier is the same in cv 1 to 5 (Realistična has its own: its barrier checks)
// - races (Spa, Bathurst: 12 rivals, the player on the autopilot, 150 s) in every version: nothing NaN, every car moving, no two cars
//   touching side by side for 2 s on end (glued), spins (past 40 deg at speed) at most 4 in Simulacija, Arkadna, Mehka and Realistična
// - Realistična (cv 6; docs/trki-realizem.md, »Zasnova prototipa Realistična«, »Testi«): conservation (in every knock of two cars the pair's
//   momentum is kept to 1e-9 and its kinetic energy with the turning never grows, to 1e-4 J (Core kCollide: a car that takes only a part of
//   its turn takes as much more of it as keeps the pair's energy; the independent check, 12. 11. 2026): the 30 scenes of two BURJA R7, the
//   144 by the roles and the weights (player/rival both ways and rival/rival, BURJA R7 and TITAN, 5300 kg, 120-300 km/h) and 24 with a car
//   rolling over or in the air; at the barrier neither the energy nor the speed
//   along it grows and no corner is left inside; a thing by the road and a loose part never speed the car up), symmetry (the mirror image of a
//   knock, of a barrier and of a thing off the car's line gives the mirror image of the outcome to 1e-9; square into the barrier no yaw and no
//   slide along it), limits (no NaN at 60-200 km/h, never over 9 rad/s with the grip lost, PITs ordered by their impulse, the turns, the
//   leaving angles and the losses to the things in their bands; a loose part in the way takes under 1.6 % of the speed and no random number,
//   a part lying on the road is run over as in Simulacija); the barrier with the car sliding or spinning (300 scenes at both barriers: on its
//   way at 20-90 deg to the barrier, the nose 10-60 deg off its way, 100 and 200 km/h, turning at up to 4 rad/s either way: a knock, its own
//   rule over 1.5 m/s, never adds energy and neither does leaning on the barrier, to 1e-4 J (slower: Simulacija's rule, and where that would
//   add energy the same push as a rigid body takes it); never over 9 rad/s with the grip
//   lost, also when a corner leans on the barrier after the knock; the same by the weights (96 scenes: MRAVLJA 165 kg, BURJA R7, TITAN,
//   KAMEN PUŠČAVA 7000 kg, also without turning at the start) and the yaw rate right after a touch at most 9 rad/s whichever car (460
//   scenes: the new physics, the classic MRAVLJA, a car rolling over); the mirror image to 1e-9 without turning at the start and in all but a few
//   scenes with it; the touch without a push, a hit recorded with nothing pushing the car, in under 2 % of the steps with a touch and of the
//   damage: docs/trki-realizem.md, »Testi različice Realistična«); no touch (alone on Spa and Bathurst, 60 s, dry and wet, cones by the barriers: the
//   whole state of the race and of the car after every step is the same in cv 6 as in cv 1, each in a core of its own; the plane with given
//   inputs, both physics; the control: the same comparison finds the first touch); the other versions (the reference tests/golden/trki.json: a
//   digest of the whole state after every step of 12 knocks, 5 barriers, 5 things by the road, 2 loose parts and a truck with its semi-trailer
//   at the barrier in each of the six versions; after a wanted change of a version: node tests/trki.test.js --update); the exempt (Core krOn:
//   a truck with its semi-trailer, a car in the run from the police and a car in the pit lane keep Simulacija's rules at the knock, in the
//   slide a knock leaves, at the barrier, at the things by the road and at a loose part; beside each the same scene without the mark, which
//   differs; a real run from the police on Chapman's Peak and Spa's real pit lane); the online race (js/game.js testOf(true) is {}, every
//   Core.setTest there goes through it, and its two calls hand it whether the race is online: testOf(!!on) at the start, testOf(a friend's
//   car is in the race) at a change of the settings: a friend's car into the local one ends as Simulacija's); the safety car (c.sc: a knock
//   never takes its grip, beside it the same knock without the mark); races (as the other versions, and no launch: no knock gives a car more
//   than 8 m/s in a step, none faster than in the other versions, none turning faster than 9 rad/s)
// - Nastavitve (the user's buttons, 10. 11. 2026): the game's default is Realistična (js/game.js DEF, the one-time move tdgp-defaults-v6,
//   the rows of index.html: Trki Realistično / Kot zdaj, the older versions in Preizkus), the core's own stays Simulacija (the references
//   of the drive do not move); Odpadli deli: Izklop is Core TX.deb 0, never with a friend; Odpadlo kolo: the race's wheel rule
//   node tests/trki.test.js            (--update: writes the reference tests/golden/trki.json)
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
    // A along +x into the side of the standing B (its nose across the road; idB, idA: their models), at B's front (s > 0) or rear part
    tbone: (H, V, s, m, idB, idA) => { const A = idA ? H.mkCar(idA, { v: 0 }) : car(H, 0, true), B = idB ? H.mkCar(idB, { v: 0 }) : car(H, 0, false); A.isPlayer = true; A.noReverse = true; B.isPlayer = false; B.noReverse = true; put(B, 0, 0, m * Math.PI / 2, 0); put(A, -(B.m.wid / 2 + A.m.len / 2 + 0.3), m * s, 0, V); return { A, B }; },
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
  // the change of the pair's momentum (kg m/s) and of its kinetic energy with the turning (J). o.pre(A, B): before the first step; o.iA(t), o.iB(t):
  // the drivers (none: no inputs); o.lines: the state of both after every step
  function knock(H, tx, S, secs, o) {
    return test(tx, () => {
      const { A, B } = S, L = [], pE = () => { const ma = mOf(A), mb = mOf(B); return [ma * A.vx + mb * B.vx, ma * A.vz + mb * B.vz, 0.5 * (ma * (A.vx * A.vx + A.vz * A.vz) + mb * (B.vx * B.vx + B.vz * B.vz) + IOf(A) * A.w * A.w + IOf(B) * B.w * B.w)]; };
      const iA = (o && o.iA) || idle, iB = (o && o.iB) || idle; if (o && o.pre) o.pre(A, B);
      let dp = 0, dE = -Infinity, wGl = 0, nan = false, hits = 0, first = null, h0 = B.h, turn = 0;
      for (let i = 1; i <= Math.round(secs / DT); i++) {
        H.step(A, iA(i * DT)); H.step(B, iB(i * DT));
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
    ok('Realistična, conservation: in every knock of two cars (30 scenes: T-bone at the front and the rear part, head on and from behind off the middle, PITs; 60, 120, 200 km/h) the pair\'s momentum is kept to 1e-9 kg m/s and its kinetic energy with the turning never grows (to 1e-4 J)',
      KR.every(x => x.r.hits > 0 && x.r.dp <= 1e-9 && x.r.dE <= 1e-4), `momentum off by at most ${p.r.dp.toExponential(1)} kg m/s (${p.name}); the largest change of the energy in a knock ${e.r.dE.toExponential(1)} J (${e.name})`);
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

  // -- the roles and the weights (the independent check, 12. 11. 2026: the knock's push is a free rigid body's, and a car that took its speed whole
  // and only a part of the turn left with more energy than it came with, up to 17,7 kJ a knock; a rival into a rival, a heavy vehicle and 300 km/h
  // were not looked at): the player's car into a rival, a rival into the player's and two rivals; BURJA R7 and TITAN (5300 kg) either way. s: the
  // part of the standing car's length off its middle; the PIT with the two cars' own sizes
  const SX = {
    tbone: (A, B, V, s) => { put(B, 0, 0, Math.PI / 2, 0); put(A, -(B.m.wid / 2 + A.m.len / 2 + 0.3), s * B.m.len, 0, V); },
    head: (A, B, V, off) => { put(B, 0, 0, Math.PI, V); put(A, -((A.m.len + B.m.len) / 2 + 0.3), off, 0, V); },
    rear: (A, B, V, off) => { put(B, 0, 0, 0, 0); put(A, -((A.m.len + B.m.len) / 2 + 0.3), off, 0, V); },
    pit: (A, B, V, vc, front) => { const al = Math.asin(vc / V), gap = 0.3, cx = (front ? 0.35 : -0.35) * B.m.len - V * (Math.cos(al) - 1) * gap / vc, cz = -B.m.wid / 2 - gap;
      put(B, 0, 0, 0, V); put(A, cx - (A.m.len / 2 * Math.cos(al) - A.m.wid / 2 * Math.sin(al)), cz - (A.m.len / 2 * Math.sin(al) + A.m.wid / 2 * Math.cos(al)), al, V); },
  };
  const pairOf = (ia, ib, role) => { const A = HC.mkCar(ia, { v: 0 }), B = HC.mkCar(ib, { v: 0 }); A.isPlayer = role[0] === 'P'; B.isPlayer = role[1] === 'P'; A.noReverse = B.noReverse = true; return { A, B }; };
  {
    const v = (kmh) => kmh / 3.6, KXS = [['tbone-front-120', (A, B) => SX.tbone(A, B, v(120), 0.28)], ['tbone-rear-120', (A, B) => SX.tbone(A, B, v(120), -0.28)], ['tbone-front-300', (A, B) => SX.tbone(A, B, v(300), 0.28)], ['tbone-rear-300', (A, B) => SX.tbone(A, B, v(300), -0.28)],
      ['head-0.6-200', (A, B) => SX.head(A, B, v(200), 0.6)], ['head-1.5-200', (A, B) => SX.head(A, B, v(200), 1.5)], ['head-0.6-300', (A, B) => SX.head(A, B, v(300), 0.6)], ['head-1.5-300', (A, B) => SX.head(A, B, v(300), 1.5)],
      ['rear-off-300', (A, B) => SX.rear(A, B, v(300), 0.6)], ['pit-200-front-8', (A, B) => SX.pit(A, B, v(200), 8, 1)], ['pit-300-rear-8', (A, B) => SX.pit(A, B, v(300), 8, 0)], ['pit-300-front-8', (A, B) => SX.pit(A, B, v(300), 8, 1)]];
    const KX = [];
    for (const [ia, ib] of [['rally', 'rally'], ['rally', 'titan'], ['titan', 'rally'], ['titan', 'titan']]) for (const role of ['PR', 'RP', 'RR']) for (const [name, mk] of KXS) {
      const S = pairOf(ia, ib, role); mk(S.A, S.B); KX.push({ name: `${name} ${ia}/${ib} ${role}`, role, heavy: ia !== 'rally' || ib !== 'rally', r: knock(HC, REAL, S, 3) }); }
    const worst = (fn, L) => (L || KX).reduce((a, b) => (fn(b) > fn(a) ? b : a)), p = worst(x => x.r.dp), e = worst(x => x.r.dE), w = worst(x => x.r.wGl), n = (fn) => KX.filter(fn).length;
    ok('Realistična, conservation by the roles and the weights (144 scenes: the player\'s car into a rival, a rival into the player\'s, two rivals; BURJA R7 and TITAN, 5300 kg, either way; T-bone at the front and the rear part at 120 and 300 km/h, head on 0.6 and 1.5 m off at 200 and 300, from behind at 300, PITs at 200 and 300): in every knock the pair\'s momentum is kept to 1e-8 kg m/s and its kinetic energy with the turning never grows (to 1e-4 J); nothing NaN, never over 9 rad/s with the grip lost',
      KX.every(x => x.r.hits > 0 && !x.r.nan && x.r.dp <= 1e-8 && x.r.dE <= 1e-4 && x.r.wGl <= 9 + 1e-9) && n(x => x.role === 'RR') === 48 && n(x => x.heavy) === 108,
      `momentum off by at most ${p.r.dp.toExponential(1)} kg m/s (${p.name}); the largest change of the energy in a knock ${e.r.dE.toExponential(1)} J (${e.name}); the fastest turn with the grip lost ${f(w.r.wGl, 3)} rad/s (${w.name}); ${KX.reduce((a, x) => a + x.r.hits, 0)} knocks`);
    // a car rolling over (c.rl) or in the air (c.air): no wheel on the road, it takes a knock's speed whole and of the turn none, so a corner of a
    // spinning one swinging into another car pushed both and kept its spin (the independent check: up to 12,8 kJ a knock). Now of the turn what
    // slows its own spin, as much as the pair's energy asks (kCollide's guard). Beside a car at the same speed (100 km/h), 5 cm between the flanks
    const SP = [];
    for (const st of ['rl', 'air']) for (const [ia, ib] of [['rally', 'rally'], ['rally', 'titan'], ['titan', 'rally']]) for (const w0 of [3, -3, 9, -9]) {
      const S = pairOf(ia, ib, 'RR'), V = v(100); put(S.A, 0, 0, 0, V); put(S.B, 0, S.A.m.wid / 2 + S.B.m.wid / 2 + 0.05, 0, V);
      SP.push({ name: `${st} ${ia}/${ib} ${w0}`, r: knock(HC, REAL, S, 2, { pre: (A, B) => { if (st === 'rl') B.rl = { t: 0, T: 1.58, turns: 2, dir: 1, H: 1.5, k: 0 }; else { B.air = 1; B.vy = 3; B.airT = 0; } B.w = w0; } }) }); }
    const se = SP.reduce((a, b) => (b.r.dE > a.r.dE ? b : a)), sp = SP.reduce((a, b) => (b.r.dp > a.r.dp ? b : a));
    ok('Realistična, a car rolling over or in the air, spinning at 3 and 9 rad/s either way beside another at 100 km/h (24 scenes; BURJA R7 and TITAN): a corner swinging into the other car never leaves the pair with more kinetic energy with the turning than before the knock (to 1e-4 J), the momentum kept to 1e-8 kg m/s, nothing NaN',
      SP.every(x => !x.r.nan && x.r.dp <= 1e-8 && x.r.dE <= 1e-4) && SP.filter(x => x.r.hits > 0).length >= 20,
      `${SP.filter(x => x.r.hits > 0).length} of ${SP.length} scenes with a knock, ${SP.reduce((a, x) => a + x.r.hits, 0)} knocks; the largest change of the energy in a knock ${se.r.dE.toExponential(1)} J (${se.name}); momentum off by at most ${sp.r.dp.toExponential(1)} kg m/s (${sp.name})`);
  }

  // -- the safety car (c.sc) never loses its grip to a knock (kGripR, as kTake: no marshals and no reverse for it, the race would wait behind it):
  // the T-bone at the rear part at 120 km/h, which spins any other car, into a standing car with the mark and, beside it, without
  {
    const sc = (mark) => test(REAL, () => { const { A, B } = SR.tbone(HC, 120 / 3.6, -1.2, 1); if (mark) B.sc = true; let gl = 0, dw1 = null, hits = 0;
      for (let i = 1; i <= Math.round(1 / DT); i++) { HC.step(A, idle()); HC.step(B, idle()); const w0 = B.w, k0 = [B.vx, B.vz].join(); C.carCollide(A, B);
        if (k0 !== [B.vx, B.vz].join()) { hits++; if (dw1 === null) dw1 = B.w - w0; } gl = Math.max(gl, B.xgl || 0); }
      return { hits, gl, dw1, v: B.speed * 3.6 }; });
    const s1 = sc(true), s0 = sc(false);
    ok('Realistična, the safety car: a knock never takes its grip: hit on its rear part at 120 km/h (a T-bone into it standing) it is pushed away with its grip whole for the whole second and no yaw rate from the knock (the turn is a swing of its nose it catches itself); the same car without the mark loses all its grip and is spun',
      s1.hits > 0 && s1.gl === 0 && s1.dw1 === 0 && s1.v > 20 && s0.hits > 0 && s0.gl > 0.9 && Math.abs(s0.dw1) > 2,
      `the safety car: the grip lost ${f(s1.gl, 3)}, the yaw rate from the first knock ${f(s1.dw1, 3)} rad/s, leaving at ${f(s1.v, 1)} km/h; without the mark: ${f(s0.gl, 3)} and ${f(s0.dw1, 3)} rad/s`);
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
  const mkRace = (id, ph) => { Math.random = seeded(64); const r = new C.Race(OV, { numAI: 0, playerGrid: 1, laps: 99, playerModel: id ? model(id) : C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: ph || 'cs' }); r.start(); return r; };
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

  // the barrier with the car sliding or spinning: on its way at th deg to the barrier, its nose hb deg off the road (not on its way), turning at
  // w0 rad/s, its nearest corner 0.3 m from the barrier. Per step with a touch, by the hit the barrier records: a knock (faster than
  // Realistična's threshold V0: its own rule, Core wallR) or leaning on it (slower: Simulacija's rule in every version), and the change of the
  // kinetic energy with the turning in each; a touch without a push (a hit recorded, the speeds and the turning as before it); the damage the
  // hits stand for (wallCollide: 2.8 % a m/s over 2.5); the state right after the first touch (st1) and at the end (st), seen from the barrier; the
  // fastest turn right after a touch, whatever the grip (wT). o.id, o.ph: the model and the physics (BURJA R7, the classic); o.pre(c): before the first step
  const V0 = 1.5;
  function skid(tx, th, hb, kmh, w0, side, secs, o) {
    return test(tx, () => {
      const c = mkRace(o && o.id, o && o.ph).player, B = side > 0 ? OV.br[I0] : OV.bl[I0], F = { tx: OV.tx[I0], tz: OV.tz[I0], mx: side * OV.nx[I0], mz: side * OV.nz[I0] }, v = kmh / 3.6, a = OV.hd[I0] + side * th / D;
      const d0 = side * (B - 0.3 - Math.max(...c.corners.map(p => p[0] * Math.sin(hb / D) + side * p[1] * Math.cos(hb / D))));
      placeCar(c, OV.px[I0] + OV.nx[I0] * d0, OV.pz[I0] + OV.nz[I0] * d0, OV.hd[I0] + side * hb / D, v); c.vx = Math.cos(a) * v; c.vz = Math.sin(a) * v; c.w = side * w0; if (o && o.pre) o.pre(c);
      const m = c.m.mass, I = c.I, E = () => 0.5 * (m * (c.vx * c.vx + c.vz * c.vz) + I * c.w * c.w), vt = () => c.vx * F.tx + c.vz * F.tz, vn = () => c.vx * F.mx + c.vz * F.mz;
      let n = 0, nK = 0, nL = 0, dEK = -Infinity, dEL = -Infinity, deep = Infinity, nan = false, wGl = 0, wT = 0, ni = 0, niHit = 0, dmg = 0, dmgNi = 0, st1 = null;
      for (let k = 1; k <= Math.round(secs / DT); k++) {
        c.steer += C.clamp(c.inSteer - c.steer, -6 * DT, 6 * DT); c.step(DT, OV);
        const u = [c.vx, c.vz, c.w], e0 = E(); c.wallX = NaN; c.hitWall = 0;
        C.wallCollide(c, OV, true); OV.query(c.x, c.z, c.q.i, c.q);
        if (!Number.isNaN(c.wallX)) { const h = c.hitWall, dE = E() - e0, d = Math.max(0, h - 2.5) * 0.028; n++; dmg += d; deep = Math.min(deep, room(c, side)); wT = Math.max(wT, Math.abs(c.w));
          if (h > V0) { nK++; dEK = Math.max(dEK, dE); } else if (h > 0) { nL++; dEL = Math.max(dEL, dE); }
          if (h > 0 && c.vx === u[0] && c.vz === u[1] && c.w === u[2]) { ni++; niHit = Math.max(niHit, h); dmgNi += d; }
          if (!st1) st1 = [side * c.w, vt(), vn()]; }
        if (!fin(c)) nan = true; if (c.xgl > 0) wGl = Math.max(wGl, Math.abs(c.w));
        c.hitWall = 0; c.hitCar = 0; c.fxWall = 0;
      }
      const q = OV.query(c.x, c.z, c.q.i, _cq);
      return { n, nK, nL, dEK, dEL, deep, nan, wGl, wT, ni, niHit, dmg, dmgNi, st1, st: [q.s, side * q.d, side * wrap(c.h - OV.hd[q.i]), vt(), vn(), side * c.w, c.steer, c.xgl || 0, Math.abs(c.csKc || 0)] };
    });
  }
  const SK = [];
  for (const th of [20, 30, 45, 60, 90]) for (const off of [-60, -30, -10, 10, 30, 60]) for (const kmh of [100, 200]) for (const w0 of [0, 2, -2, 4, -4]) {
    const g = (tx, side) => skid(tx, th, th + off, kmh, w0, side, 3), d1 = (p, q) => p.st1 && q.st1 ? Math.max(...p.st1.map((y, i) => Math.abs(y - q.st1[i]))) : NaN;
    const x = { name: `${th}/${th + off}/${kmh}/${w0}`, w0, r: g(REAL, 1), l: g(REAL, -1), s: g(SIM, 1), sl: g(SIM, -1) };
    x.m1 = d1(x.r, x.l); x.m = dev(x.r.st, x.l.st); x.sm = dev(x.s.st, x.sl.st); SK.push(x);
  }
  {
    const two = (x, fn) => Math.max(fn(x.r), fn(x.l)), worst = (fn, L) => (L || SK).reduce((a, b) => (fn(b) > fn(a) ? b : a)), sum = (fn) => SK.reduce((a, b) => a + fn(b), 0), both = (fn) => SK.every(x => fn(x.r) && fn(x.l));
    const k = worst(x => two(x, y => y.dEK)), e = worst(x => two(x, y => y.dEL)), es = worst(x => Math.max(x.s.dEK, x.s.dEL)), d = worst(x => two(x, y => -y.deep));
    ok('Realistična, the barrier, sliding and spinning, conservation (300 scenes at both barriers: on its way at 20 to 90 deg to the barrier, the nose 10 to 60 deg off its way, 100 and 200 km/h, turning at 0, 2 and 4 rad/s either way): nothing NaN, no corner left inside, a knock (a touch faster than 1.5 m/s: its own rule) never adds kinetic energy with the turning, and neither does leaning on the barrier (slower: Simulacija\'s rule, and where that would add energy the same push as a rigid body takes it; to 1e-4 J)',
      both(y => y.n > 0 && !y.nan && y.deep >= -1e-6 && y.dEK <= 1e-6 && y.dEL <= 1e-4) && sum(x => x.r.nK) >= 1000,
      `${sum(x => x.r.nK + x.l.nK)} knocks: at most ${f(two(k, y => y.dEK), 6)} J (${k.name}); ${sum(x => x.r.nL + x.l.nL)} leaning touches: at most ${two(e, y => y.dEL).toExponential(1)} J (${e.name}; Simulacija at a touch ${f(Math.max(es.s.dEK, es.s.dEL) / 1000, 2)} kJ, ${es.name}); the deepest corner ${(-two(d, y => -y.deep)).toExponential(1)} m`);
    const w = worst(x => two(x, y => y.wGl)), cap = SK.filter(x => two(x, y => y.wGl) >= 9 - 1e-9), cap0 = cap.filter(x => !x.w0);
    ok('Realistična, the barrier, sliding and spinning, limits: with the grip lost the car never turns faster than 9 rad/s, also when a corner then leans on the barrier, and the limit is at work (reached in at least 60 of the scenes, 10 of them without turning at the start)',
      both(y => y.wGl <= 9 + 1e-9) && cap.length >= 60 && cap0.length >= 10, `the fastest ${f(two(w, y => y.wGl), 6)} rad/s (${w.name}); at the limit in ${cap.length} scenes, ${cap0.length} of them without turning at the start`);
    const off = (fn, L) => L.filter(x => !(fn(x) <= 1e-9)), S0 = SK.filter(x => !x.w0), ST = SK.filter(x => x.w0), o1 = off(x => x.m1, ST), oE = off(x => x.m, ST), top = (fn, L) => fn(worst(fn, L));
    ok('Realistična, the barrier, sliding and spinning, symmetry: the left barrier gives the mirror image of the right one to 1e-9 right after the first touch and at the end in every scene without turning at the start (60); turning at the start (240) in all but at most 2 right after the first touch and 8 at the end (two corners at the barrier in one step are handled one after the other, and the mirror image has them in the other order)',
      !off(x => x.m1, S0).length && !off(x => x.m, S0).length && o1.length <= 2 && oE.length <= 8,
      `without turning off by at most ${top(x => x.m1, S0).toExponential(1)} / ${top(x => x.m, S0).toExponential(1)}; turning: ${o1.length} / ${oE.length} of ${ST.length} off (at most ${f(top(x => x.m1, ST), 3)} / ${f(top(x => x.m, ST), 3)}: ${worst(x => x.m, ST).name}); Simulacija at the end: ${off(x => x.sm, SK).length} of ${SK.length} off (${off(x => x.sm, S0).length} without turning)`);
    const N = sum(x => x.r.n + x.l.n), NI = sum(x => x.r.ni + x.l.ni), DM = sum(x => x.r.dmg + x.l.dmg), DN = sum(x => x.r.dmgNi + x.l.dmgNi), h = worst(x => two(x, y => y.niHit)), NS = sum(x => x.s.ni + x.sl.ni);
    ok('Realistična, the barrier, the touch without a push (a corner swings into the barrier faster than 1.5 m/s while the middle of its patch does not close on it: the hit is recorded, nothing pushes the car; docs/trki-realizem.md, »Robni primer brez sunka«): under 2 % of the steps with a touch and under 2 % of the damage the hits stand for; none in Simulacija',
      NI / N < 0.02 && DN / DM < 0.02 && !NS, `${NI} of ${N} steps with a touch (${f(100 * NI / N)} %), ${f(100 * DN / DM)} % of the damage; the fastest ${f(two(h, y => y.niHit))} m/s (${h.name}); Simulacija ${NS} of ${sum(x => x.s.n + x.sl.n)}`);
  }

  // the barrier by the weights (the independent check, 12. 11. 2026: leaning on the barrier, the whole push into the speed and 0.3 of it into the
  // turn, added up to 53,9 kJ a touch to a heavy vehicle, also with no turning at the start; the checks above have BURJA R7 only): MRAVLJA (165
  // kg), BURJA R7, TITAN (5300 kg) and KAMEN PUŠČAVA (7000 kg), the nose square or nearly so to the barrier, 120 and 200 km/h
  {
    const SH = [];
    for (const id of ['mravlja', 'rally', 'titan', 'kamen']) for (const [th, hb] of [[45, 90], [30, 90], [60, 120], [20, 60]]) for (const kmh of [120, 200]) for (const w0 of [0, 3, -3])
      SH.push({ name: `${id} ${th}/${hb}/${kmh}/${w0}`, id, w0, r: skid(REAL, th, hb, kmh, w0, 1, 3, { id }), s: skid(SIM, th, hb, kmh, w0, 1, 3, { id }) });
    const worst = (fn, L) => (L || SH).reduce((a, b) => (fn(b) > fn(a) ? b : a)), k = worst(x => x.r.dEK), e = worst(x => x.r.dEL), HV = SH.filter(x => x.id === 'titan' || x.id === 'kamen'), S0 = SH.filter(x => !x.w0), nl = (L) => L.reduce((a, x) => a + x.r.nL, 0), e0 = worst(x => x.r.dEL, S0);
    ok('Realistična, the barrier by the weights (96 scenes: MRAVLJA, BURJA R7, TITAN and KAMEN PUŠČAVA, 165 to 7000 kg; on its way at 20 to 60 deg to the barrier with the nose square or nearly so to it, 120 and 200 km/h, turning at 0 and 3 rad/s either way): nothing NaN, no corner left inside, neither a knock nor leaning on the barrier ever adds kinetic energy with the turning (to 1e-4 J); the scenes do lean (the heavy vehicles in at least 2000 touches, the scenes without turning at the start in at least 1000)',
      SH.every(x => x.r.n > 0 && !x.r.nan && x.r.deep >= -1e-6 && x.r.dEK <= 1e-6 && x.r.dEL <= 1e-4) && nl(HV) >= 2000 && nl(S0) >= 1000,
      `${SH.reduce((a, x) => a + x.r.nK, 0)} knocks: at most ${k.r.dEK.toExponential(1)} J (${k.name}); ${nl(SH)} leaning touches (${nl(HV)} of the heavy vehicles, ${nl(S0)} without turning at the start): at most ${e.r.dEL.toExponential(1)} J (${e.name}), without turning at the start ${e0.r.dEL.toExponential(1)} J (${e0.name})`);
    // the yaw rate after a touch of the barrier, whichever car (the independent check: the new physics left the barrier at up to 52 rad/s, a car
    // rolling over at up to 14, the classic with its grip whole over 9 too: the limit was for a classic car with its grip lost only)
    const SW = [], rl = (c) => { c.rl = { t: 0, T: 1.58, turns: 2, dir: 1, H: 1.5, k: 0 }; };
    for (const [id, ph] of [['rally', 'nova'], ['mravlja', 'nova'], ['titan', 'nova'], ['formula', 'nova'], ['mravlja', 'cs']]) for (const th of [20, 45, 90]) for (const off of [-60, 60]) for (const kmh of [100, 200]) for (const w0 of [0, 4, -4, 8, -8])
      SW.push({ name: `${id} ${ph} ${th}/${th + off}/${kmh}/${w0}`, g: ph === 'nova' ? 'nova' : 'cs', r: skid(REAL, th, th + off, kmh, w0, 1, 3, { id, ph }), s: skid(SIM, th, th + off, kmh, w0, 1, 3, { id, ph }) });
    for (const id of ['rally', 'titan']) for (const th of [20, 30, 45, 60, 90]) for (const off of [-30, 30]) for (const kmh of [100, 200]) for (const w0 of [4, -4, 8, -8])
      SW.push({ name: `${id} rolling over ${th}/${th + off}/${kmh}/${w0}`, g: 'rl', r: skid(REAL, th, th + off, kmh, w0, 1, 2, { id, pre: rl }), s: skid(SIM, th, th + off, kmh, w0, 1, 2, { id, pre: rl }) });
    const G = (g) => SW.filter(x => x.g === g), top = (g, v) => G(g).reduce((a, b) => (b[v].wT > a[v].wT ? b : a)), over = (g) => G(g).filter(x => x.s.wT > 9.001).length;
    ok('Realistična, the barrier, the yaw rate after a touch whichever car (460 scenes: the new physics, BURJA R7, MRAVLJA, TITAN and FORMULA ORKAN, and the classic MRAVLJA sliding and spinning at up to 8 rad/s into the barrier at 100 and 200 km/h; BURJA R7 and TITAN rolling over into it): right after a touch no car turns faster than 9 rad/s, nothing NaN; Simulacija leaves the barrier faster than that in at least 30 scenes of the new physics and 5 of a car rolling over',
      SW.every(x => x.r.n > 0 && !x.r.nan && x.r.wT <= 9 + 1e-9) && over('nova') >= 30 && over('rl') >= 5,
      ['nova', 'cs', 'rl'].map(g => `${g}: at most ${f(top(g, 'r').r.wT, 3)} rad/s (${top(g, 'r').name}); Simulacija ${f(top(g, 's').s.wT, 2)} rad/s (${top(g, 's').name}), over 9 in ${over(g)} of ${G(g).length}`).join('; '));
  }

  // a thing by the road (Race.setProps: cone, tyre, bale, bstack, lamp) in the car's way, off m off its line; beside it the same run without the
  // thing (the twin). loss: the speed lost to the twin at the last touch, % of the speed before the first. o.pre(c): before the first step; o.id: the model
  function prop(tx, kind, kmh, off, secs, o) {
    return test(tx, () => {
      const mk = (withProp) => { const race = mkRace(o && o.id), P = race.player; placeCar(P, OV.px[I0], 0, 0, kmh / 3.6); if (o && o.pre) o.pre(P);
        if (withProp) { race.setProps([{ kind, x: P.x, z: P.z, yaw: 0, col: 0, i: I0 }], null); const K = race.props[0].K, ahead = P.circles[P.circles.length - 1] + P.rad + (K.reach || K.rh) + 0.6;
          race.setProps([{ kind, x: P.x + ahead, z: off, yaw: 0, col: 0, i: I0 }], null); }
        return race; };
      const A = mk(true), B = mk(false), P = A.player, Q = B.player, L = [];
      let first = 0, last = 0, fast = -Infinity, v0 = 0, st1 = null, nan = false, loss = 0;
      for (let k = 1; k <= Math.round(secs / DT); k++) {
        const vb = Math.hypot(P.vx, P.vz); stepR(A, k); stepR(B, k);
        if (P.hitDebris > 0) { last = k; if (!first) { first = k; v0 = vb; st1 = sv(P); } loss = (Math.hypot(Q.vx, Q.vz) - Math.hypot(P.vx, P.vz)) / v0 * 100; }
        fast = Math.max(fast, Math.hypot(P.vx, P.vz) - Math.hypot(Q.vx, Q.vz)); if (!fin(P)) nan = true;
        L.push(stateLine(P) + '|' + stateLine(A.props[0]) + (P.tl ? '|' + stateLine(P.tl) : ''));
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

  // a loose part (Race.spawnDebris: shed by a car 12 m ahead at the same speed) in the car's way; beside it the same run without the part (the
  // twin). n: the steps with a touch; loss: the speed lost to the twin at the last touch, % of the speed before the first. o.pre(c): before the
  // first step; o.id: the model; o.rnd: other random numbers in the steps (the part's flight to the car is the same: its throw has its own)
  function part(tx, name, kmh, secs, o) {
    return test(tx, () => {
      const v = kmh / 3.6, mk = (withPart) => { const race = mkRace(o && o.id), P = race.player; placeCar(P, OV.px[I0], 0, 0, v); if (o && o.pre) o.pre(P);
        if (withPart) { const Dn = new C.Car(C.MODELS[4], { phys: 'cs' }); placeCar(Dn, P.x + 12, 0, 0, v); race.spawnDebris(Dn, name, seeded(7)); }
        return race; };
      const A = mk(true), B = mk(false), P = A.player, Q = B.player, L = [];
      let first = 0, n = 0, fast = -Infinity, v0 = 0, nan = false, loss = 0;
      for (let k = 1; k <= Math.round(secs / DT); k++) {
        const vb = Math.hypot(P.vx, P.vz);
        for (const r of [A, B]) { for (const c of r.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; } Math.random = seeded(((o && o.rnd) || 1000) + k); r.step(DT); }
        if (P.hitDebris > 0) { n++; if (!first) { first = k; v0 = vb; } loss = (Math.hypot(Q.vx, Q.vz) - Math.hypot(P.vx, P.vz)) / v0 * 100; }
        fast = Math.max(fast, Math.hypot(P.vx, P.vz) - Math.hypot(Q.vx, Q.vz)); if (!fin(P)) nan = true;
        L.push(stateLine(P) + (P.tl ? '|' + stateLine(P.tl) : ''));   // (the car and its trailer; the part's own spin after a knock is random in every version)
      }
      return { first, n, loss, fast, nan, L, end: [loss, P.x, P.z, P.h * D, Math.hypot(P.vx, P.vz) * 3.6] };
    });
  }
  const PARTS = [['hood', 120], ['hood', 200], ['bumperF', 120], ['bumperF', 200], ['trunk', 60], ['trunk', 120]], pt = {};
  for (const [name, kmh] of PARTS) pt[name + '-' + kmh] = { name: name + '-' + kmh, r: part(REAL, name, kmh, 2), r2: part(REAL, name, kmh, 2, { rnd: 5000 }), s: part(SIM, name, kmh, 2), s2: part(SIM, name, kmh, 2, { rnd: 5000 }) };
  {
    const Pq = Object.values(pt), lyS = part(SIM, 'hood', 60, 3), lyR = part(REAL, 'hood', 60, 3);
    ok('Realistična, a loose part in the way: a bonnet, a front bumper and a boot lid shed by a car ahead (6 scenes: 60 to 200 km/h, beside each the same run without the part) take the speed their mass takes: under 1.6 % and less than half of what Simulacija takes; the car is never faster than without the part, nothing NaN; the knock takes no random number (other random numbers in the steps: the car\'s state after every step is the same, while Simulacija\'s car twitches by chance from the knock\'s step on); a part lying on the road (a bonnet at 60 km/h) is run over as in Simulacija, to the last digit',
      Pq.every(x => x.r.first > 0 && x.r.first === x.s.first && !x.r.nan && !x.s.nan && x.r.loss > 0.05 && x.r.loss < 1.6 && x.s.loss > 2 * x.r.loss && x.r.fast <= 1e-9 && same(x.r.L, x.r2.L) && firstDiff(x.s.L, x.s2.L) === x.s.first)
        && lyS.n > 0 && lyS.first > 60 && same(lyS.L, lyR.L),
      `the loss, Realistična / Simulacija: ${Pq.map(x => `${x.name} ${f(x.r.loss, 2)} / ${f(x.s.loss, 2)} % (step ${x.r.first}, ${x.r.n} / ${x.s.n} touches)`).join('; ')}; lying (hood-60): run over at step ${lyS.first}, ${f(lyR.loss, 2)} / ${f(lyS.loss, 2)} %`);
  }

  // -- no touch: a car that touches nothing drives the same to the last digit whatever the choice. Two races side by side, the same but for the
  // choice: cv 1 and cv 6, each in a core of its own (the default is cv 1: the choice, above), the whole state after every step (raceState: the
  // race, the cars, the debris). mk(K): the race in that core; o.drive(K, race, k): a driver in place of the autopilot; o.more(race): more state
  const C1 = loadCore(), C6 = loadCore(), KS = [C1, C6]; C1.setTest(SIM); C6.setTest(REAL);
  function twin(mk, secs, o) {
    const R = KS.map(mk), P = R.map(r => r.player);
    let touch = 0, diff = 0, fld = '', vmax = 0, hw = 0, wallAt = 0, pit = 0;
    for (let k = 1; k <= Math.round(secs / DT); k++) {
      const L = R.map((r, j) => { for (const c of r.cars) c.hitCar = c.hitWall = c.hitDebris = 0; Math.random = seeded(1000 + k);
        if (o && o.drive) o.drive(KS[j], r, k); else KS[j].aiControl(P[j], r, DT); r.step(DT); return raceState(r) + (o && o.more ? '\n' + o.more(r) : ''); });
      if (!touch && P.some(c => c.hitCar || c.hitWall || c.hitDebris || c.xgl || c.cSx || c.cSz || c.csKc)) touch = k;
      if (!diff && L[0] !== L[1]) { diff = k; fld = field(L[0], L[1]); }
      if (!wallAt && P[0].hitWall > 0) wallAt = k;
      vmax = Math.max(vmax, P[0].speed); hw = Math.max(hw, P[0].hitWall, P[1].hitWall); if (P[0].inPit && P[1].inPit) pit++;
    }
    return { R, P, touch, diff, fld, vmax, hw, wallAt, pit };
  }
  const raceOn = (K, tid, o) => { Math.random = seeded(64); const r = new K.Race(new K.Track(K.TRACKS.find(d => d.id === tid)), Object.assign({ numAI: 0, playerGrid: 1, laps: 99, playerModel: K.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }, o)); r.start(); return r; };
  // off the road from t0 to t1 s (the wheel hard over, full throttle), the autopilot otherwise
  const into = (t0, t1) => (K, r, k) => { const c = r.player, t = k * DT; if (t >= t0 && t < t1) { c.inSteer = -1; c.inThr = 1; c.inBrk = 0; c.inHand = 0; c.digitalSteer = true; } else { c.digitalSteer = false; K.aiControl(c, r, DT); } };
  // alone on a real track, cones standing by the barriers
  function solo(tid, o) {
    const pl = (r) => r.props.map(b => stateLine(b)).join('\n'); let p0 = null;
    const t = twin((K) => { const r = raceOn(K, tid, { phys: o.phys || 'cs', rain: o.rain || 0 }), T = r.track, list = [];
      for (let i = 0, n = 0; i < T.N; i += 25, n++) { const sd = n % 2 ? 1 : -1, B = sd > 0 ? T.br[i] : T.bl[i], w = T.wa ? T.wa[i] : T.w; if (B - 0.6 > w + 1.2) list.push({ kind: 'cone', x: T.px[i] + T.nx[i] * sd * (B - 0.6), z: T.pz[i] + T.nz[i] * sd * (B - 0.6), yaw: 0, col: 0, i }); }
      r.setProps(list, null); if (p0 == null) p0 = pl(r); return r; }, o.secs, o);
    const pe = t.R.map(pl);
    return { touch: t.touch, diff: t.diff, fld: t.fld, vmax: t.vmax, cones: t.R[0].props.length, moved: pe[0] !== p0, props: pe[0] === pe[1], dist: t.P[0].dist };
  }
  // 100 km/h into the front part of a standing car (idB: its model), in Simulacija and in Realistična
  const tb = (idB) => SR.tbone(HC, 100 / 3.6, 1.2, 1, idB), knS = knock(HC, SIM, tb(), 1, { lines: true }), knR = knock(HC, REAL, tb(), 1, { lines: true });
  {
    const all = [['spa', 0, 'cs'], ['spa', 1, 'cs'], ['bathurst', 0, 'cs'], ['bathurst', 1, 'cs'], ['spa', 0, 'nova']].map(([tid, rain, phys]) => Object.assign(solo(tid, { rain, phys, secs: phys === 'nova' ? 20 : 60 }), { name: `${tid} ${rain ? 'wet' : 'dry'}${phys === 'nova' ? ' (the new physics, 20 s)' : ''}` }));
    const bad = all.find(x => x.diff || x.touch || x.moved || !x.props);
    ok('Realistična, no touch: alone on Spa and Bathurst (60 s on the autopilot, dry and wet; cones standing by the barriers) the whole state of the race and of the car after every step is the same in cv 6 as in cv 1; the car touches nothing there (no knock, barrier or thing, no grip lost, no slide left by a knock) and no cone moves',
      all.every(x => !x.diff && !x.touch && !x.moved && x.props && x.cones >= 20 && x.dist > 300),
      bad ? `${bad.name}: ${bad.touch ? `the scenario touched something at step ${bad.touch}` : bad.diff ? `cv 6 differs from cv 1 at step ${bad.diff}: ${bad.fld}` : 'a cone moved or the cones differ'}`
        : all.map(x => `${x.name}: ${f(x.dist, 0)} m, top ${f(x.vmax * 3.6, 0)} km/h, ${x.cones} cones`).join('; '));
    // the control: the same comparison finds a touch
    const cr = solo('spa', { secs: 12, drive: into(6, 8.5) }), kd = firstDiff(knS.L, knR.L);
    ok('Realistična, no touch, the control: the same comparison finds a touch: turned off the road at Spa after 6 s, cv 6 and cv 1 are the same up to the first touch and differ within a second of it; 100 km/h into the front part of a standing car: the same up to the first knock, different from that step on',
      cr.touch > 0 && cr.diff >= cr.touch && cr.diff <= cr.touch + 120 && !!knS.first && !!knR.first && knS.first.i === knR.first.i && kd === knS.first.i,
      `Spa: the first touch at step ${cr.touch}, the first difference at step ${cr.diff} (${cr.fld}); the plane: the first knock at step ${knS.first ? knS.first.i : '?'}, the first difference at step ${kd}`);
  }
  // the plane with given inputs, both physics: a slalom, braking into a turn, a handbrake turn, grass
  {
    const stepIn = (H, c, I) => { c.inSteer = I.st || 0; c.inThr = I.thr || 0; c.inBrk = I.brk || 0; c.inHand = I.hand || 0; c.steer += C.clamp(c.inSteer - c.steer, -6 * DT, 6 * DT); c.step(DT, H.plane); };
    const DRV = {
      slalom: { v: 100, I: (t) => ({ st: 0.5 * Math.sin(2 * Math.PI * t / 2.4), thr: 0.4 }) },
      braking: { v: 150, I: (t) => (t < 0.5 ? { thr: 1 } : { brk: 0.9, st: t < 2.5 ? 0.3 : 0 }) },
      handbrake: { v: 90, I: (t) => (t < 0.5 ? { thr: 0.5 } : t < 1.6 ? { st: 0.8, hand: 1 } : { st: -0.3, thr: 0.6 }) },
      grass: { v: 80, surf: 2, I: (t) => ({ st: 0.4 * Math.sin(2 * Math.PI * t / 3), thr: 0.7 }) },
    };
    const drive = (H, tx, k) => test(tx, () => { const d = DRV[k], c = H.mkCar('rally', { v: d.v }), L = []; let turn = 0, h = c.h; H.surf(d.surf || 0);
      try { for (let i = 1; i <= Math.round(5 / DT); i++) { stepIn(H, c, d.I(i * DT)); turn += Math.abs(wrap(c.h - h)); h = c.h; L.push(stateLine(c)); } } finally { H.surf(0); }
      return { L, touch: !!(c.xgl || c.cSx || c.cSz || c.csKc), turn: turn * D, v: c.speed * 3.6, nan: !fin(c) }; });
    const res = []; for (const [H, ph] of [[HC, 'classic'], [HN, 'new']]) for (const k in DRV) { const d = drive(H, null, k), s = drive(H, SIM, k), r = drive(H, REAL, k); res.push({ name: `${k} (${ph})`, d, s, r, ok: same(d.L, s.L) && same(s.L, r.L) && !r.touch && !r.nan && r.turn > 20, at: firstDiff(s.L, r.L) || firstDiff(d.L, s.L) }); }
    const bad = res.find(x => !x.ok);
    ok('Realistična, no touch, the plane: with the same inputs (a slalom at 100 km/h, braking from 150 km/h into a turn, a handbrake turn at 90 km/h, grass at 80 km/h; 5 s each, the classic and the new physics) the car\'s whole state after every step is the same in cv 6, in cv 1 and by default',
      res.length === 8 && !bad, bad ? `${bad.name}: ${bad.at ? `differs at step ${bad.at}: ${field(bad.s.L[bad.at - 1], bad.r.L[bad.at - 1])}` : 'the scenario touched something or did not drive'}` : res.map(x => `${x.name}: ${f(x.r.v, 0)} km/h, turned ${f(x.r.turn, 0)} deg`).join('; '));
  }

  // through a race's own step (the car's step, the barrier, a semi-trailer's kingpin and its barrier): a lone car on the straight, th deg off
  // the road toward the barrier on the side. first: the first step with a touch (firstC the car's, firstT its trailer's)
  function ride(tx, id, th, kmh, side, secs) {
    return test(tx, () => {
      const race = mkRace(id), c = race.player, P = spot(c, side, th / D, 0.3), L = [], tl = c.tl, t2 = tl && tl.next;
      placeCar(c, P.x, P.z, P.h, kmh / 3.6);
      let firstC = 0, firstT = 0, nan = false;
      for (let k = 1; k <= Math.round(secs / DT); k++) {
        c.wallX = NaN; if (tl) tl.wallX = NaN; if (t2) t2.wallX = NaN;
        stepR(race, k);
        if (!firstC && !Number.isNaN(c.wallX)) firstC = k; if (!firstT && ((tl && !Number.isNaN(tl.wallX)) || (t2 && !Number.isNaN(t2.wallX)))) firstT = k;
        if (!fin(c)) nan = true; L.push(stateLine(c) + (tl ? '|' + stateLine(tl) : ''));
      }
      const q = OV.query(c.x, c.z, c.q.i, _cq);
      return { first: firstC && firstT ? Math.min(firstC, firstT) : firstC || firstT, firstC, firstT, nan, L, end: [q.s, q.d, wrap(c.h - OV.hd[q.i]) * D, Math.hypot(c.vx, c.vz) * 3.6] };
    });
  }

  // -- the other versions: the same knock, barrier and thing by the road end in the same state as before Realistična got rules of its own. The
  // reference tests/golden/trki.json keeps, for every version, a digest of the whole state after every step (and the end, to read). After a
  // wanted change of a version: node tests/trki.test.js --update
  {
    const digest = (L) => crypto.createHash('sha256').update(L.join('\n')).digest('hex').slice(0, 24);
    const gold = {}, ref = (key, r) => { gold[key] = { digest: digest(r.L), end: r.end.map(x => +x.toFixed(3)) }; };
    const sc = (k) => (H) => { const S = SC[k](H); return [{ A: S.P, B: S.O }, { iA: S.iP, iB: S.iO, lines: true }, 2]; }, sr = (mk) => (H) => [mk(H), { lines: true }, 1.5];
    const GK = [['stand', HC, sc('stand')], ['bump', HC, sc('bump')], ['drift3', HC, sc('drift3')], ['rub', HC, sc('rub')], ['pit', HC, sc('pit')], ['pit-nova', HN, sc('pit')],
      ['tbone-front-120', HC, sr(H => SR.tbone(H, 120 / 3.6, 1.2, 1))], ['tbone-rear-60', HC, sr(H => SR.tbone(H, 60 / 3.6, -1.2, 1))], ['head-off-120', HC, sr(H => SR.head(H, 120 / 3.6, 0.6, 1))],
      ['rear-off-120', HC, sr(H => SR.rear(H, 120 / 3.6, 0.6, 1))], ['pit-60-rear-8', HC, sr(H => SR.pit(H, 60 / 3.6, 8, 1, 0))], ['pit-120-front-4', HC, sr(H => SR.pit(H, 120 / 3.6, 4, 1, 1))]];
    const GW = [[5, 60], [15, 120], [30, 120], [90, 60], [85, 120]], GP = [['cone', 120], ['tyre', 60], ['bale', 120], ['bstack', 60], ['lamp', 60]], GD = [['hood', 120], ['bumperF', 200]];
    for (const [id, tx] of VS) {
      for (const [name, H, mk] of GK) { const [S, o, secs] = mk(H); ref(`knock/${name}/${id}`, knock(H, tx, S, secs, o)); }
      for (const [th, kmh] of GW) ref(`wall/${th}-${kmh}/${id}`, wall(tx, th, kmh, 1, 2));
      for (const [kind, kmh] of GP) ref(`prop/${kind}-${kmh}/${id}`, prop(tx, kind, kmh, 0, 1.2));
      for (const [name, kmh] of GD) ref(`part/${name}-${kmh}/${id}`, part(tx, name, kmh, 2));
      ref(`rig/wall-15-90/${id}`, ride(tx, RIG, 15, 90, 1, 2));
    }
    const keys = Object.keys(gold), G0 = !UPDATE && fs.existsSync(GFILE) ? JSON.parse(fs.readFileSync(GFILE, 'utf8')) : {};
    if (UPDATE) { fs.writeFileSync(GFILE, JSON.stringify(gold, null, 1) + '\n'); console.log(`reference written: tests/golden/trki.json (${keys.length} entries)`); }
    const bad = UPDATE ? [] : keys.filter(k => !G0[k] || G0[k].digest !== gold[k].digest), gone = UPDATE ? [] : Object.keys(G0).filter(k => !gold[k]);
    for (const k of bad) console.log(G0[k] ? `CHANGED ${k} (was ${G0[k].digest} [${G0[k].end}], now ${gold[k].digest} [${gold[k].end}])` : `NO REFERENCE ${k}`);
    for (const k of gone) console.log(`NOT RUN ${k}`);
    const dg = (k) => gold[k].digest, five = ['sim', 'arc', 'soft', 'stunt', 'old'], eq = (grp, ids) => keys.filter(k => k.startsWith(grp) && k.endsWith('/' + ids[0])).every(k => ids.every(id => dg(k.replace(/[^/]+$/, id)) === dg(k)));
    const mine = keys.filter(k => k.endsWith('/real') && !k.startsWith('rig/')), own = mine.filter(k => dg(k) !== dg(k.replace(/real$/, 'sim'))), asSim = mine.filter(k => !own.includes(k)).map(k => k.replace(/\/real$/, ''));
    ok('the versions, the reference (tests/golden/trki.json): 12 knocks between cars, 5 barriers, 5 things by the road, 2 loose parts and a truck with its semi-trailer at the barrier end in the recorded state in each of the six versions (the whole state after every step); the barrier, the things and the loose parts are the same in cv 1 to 5 (the walls as they were); Realistična has its own in at least 16 of the 24 scenes and Simulacija\'s for the truck with its trailer',
      keys.length === 25 * 6 && !bad.length && !gone.length && eq('wall/', five) && eq('prop/', five) && eq('part/', five) && eq('rig/', ['sim', 'old', 'real']) && own.length >= 16,
      UPDATE ? `${keys.length} entries written` : bad.length || gone.length ? `${bad.length} changed or without a reference, ${gone.length} not run: ${bad.concat(gone).slice(0, 6).join(', ')} (after a wanted change of a version: node tests/trki.test.js --update; npm run golden:update does not write this reference)` : `${keys.length} entries; Realistična differs from Simulacija in ${own.length} of ${mine.length} (as Simulacija: ${asSim.join(', ') || 'none'})`);
  }

  // -- the exemptions (Core krOn): a truck with its semi-trailer (c.tl), a car in the run from the police (c.ck) and a car in the pit lane (c.inPit)
  // keep Simulacija's rules in Realistična at each of the places that ask: the knock (kTake), the slide a knock leaves (stepCS), the barrier
  // (wallCollide), the things by the road (propCarHit) and a loose part (debrisHit). Beside each scene the same one without the mark, which does differ
  // the slide a knock leaves, made by hand as kTake leaves it: 8 m/s across at 100 km/h, no inputs
  const slide = (tx, id, pre) => test(tx, () => { const c = HC.mkCar(id || 'rally', { v: 100 }), L = []; c.vz += 8; c.cSx = 0; c.cSz = 8; c.cSr = 8; if (pre) pre(c);
    for (let i = 0; i < Math.round(1.5 / DT); i++) { HC.step(c, idle()); L.push(stateLine(c)); } return L; });
  const two = (fn) => [fn(SIM), fn(REAL)], eqL = (p) => p[0].length > 0 && same(p[0], p[1]), lines = (p) => p.map(x => x.L);
  {
    // without a mark every one of the five differs
    const sl0 = two(tx => slide(tx)), w0 = [wl['30/120'].s, wl['30/120'].r], p0 = [prop(SIM, 'bale', 120, 0, 1.2), pr['bale-120'].r], d0 = [pt['hood-120'].s, pt['hood-120'].r];
    const base = !eqL(sl0) && !eqL(lines(w0)) && w0[0].first > 0 && !eqL(lines(p0)) && p0[0].first > 0 && !eqL(lines(d0)) && d0[0].first > 0 && knS.first.lb !== knR.first.lb;
    const hood = (o) => two(tx => part(tx, 'hood', 120, 2, o));

    // a truck with its semi-trailer; the same tractor without one is not exempt
    const TR = 'titan', rw = two(tx => ride(tx, RIG, 15, 90, 1, 2)), tw = two(tx => ride(tx, TR, 15, 90, 1, 2)), rp = two(tx => prop(tx, 'bale', 60, 0, 1.2, { id: RIG })), tp = two(tx => prop(tx, 'bale', 60, 0, 1.2, { id: TR }));
    const rs = two(tx => slide(tx, RIG)), ts = two(tx => slide(tx, TR)), rk = two(tx => knock(HC, tx, tb(RIG), 1, { lines: true })), tk = two(tx => knock(HC, tx, tb(TR), 1, { lines: true }));
    const lb = (p) => (p[0].first && p[1].first && p[0].first.i === p[1].first.i ? p[0].first.lb === p[1].first.lb : null);
    // a loose part; the truck into a standing car and into a standing truck (80 km/h, nose-on: the push is along the one that hits, whose own share is the same
    // in both versions with or without the mark; what tells them apart is the one hit)
    const rd = hood({ id: RIG }), td = hood({ id: TR }), into2 = (idB, idA) => two(tx => knock(HC, tx, SR.tbone(HC, 80 / 3.6, 1.2, 1, idB, idA), 1, { lines: true }));
    const rc = into2(null, RIG), rr = into2(RIG, RIG), tt = into2(TR, TR);
    ok('Realistična, exempt: a truck with its semi-trailer keeps Simulacija\'s rules: at the barrier (15 deg, 90 km/h, through the race\'s step: the tractor and the trailer both touch it), at a bale, at a loose part (a bonnet at 120 km/h) and in the slide a knock leaves its whole state after every step is the same in cv 6 as in cv 1; hit by a car at 100 km/h it takes its share as in cv 1, the car it hits at 80 km/h takes Realistična\'s, and a truck into a standing truck is the same to the end; the same tractor without the trailer differs in all of them',
      base && !!RIG && model(RIG).mass === model(TR).mass && !model(TR).trailer && eqL(lines(rw)) && rw[0].firstC > 1 && rw[0].firstT > 1 && !rw[1].nan && eqL(lines(rp)) && rp[0].first > 0 && eqL(lines(rd)) && rd[0].first > 0 && eqL(rs) && lb(rk) === true
        && lb(rc) === false && eqL(lines(rr)) && rr[0].hits > 0
        && !eqL(lines(tw)) && firstDiff(tw[0].L, tw[1].L) === tw[0].first && !eqL(lines(tp)) && !eqL(lines(td)) && td[0].first > 0 && !eqL(ts) && lb(tk) === false && !eqL(lines(tt)),
      `${RIG}: the tractor touches the barrier at step ${rw[0].firstC}, the trailer at step ${rw[0].firstT}, the bale at step ${rp[0].first} (loss ${f(rp[0].loss, 2)} / ${f(rp[1].loss, 2)} %), the bonnet at step ${rd[0].first} (${f(rd[0].loss, 2)} / ${f(rd[1].loss, 2)} %); a truck into a truck: ${rr[0].hits} touches, the one hit turned ${f(rr[0].turn, 1)} / ${f(rr[1].turn, 1)} deg; ${TR}: the barrier at step ${tw[0].first}, cv 6 differs from step ${firstDiff(tw[0].L, tw[1].L)}; the bale ${f(tp[0].loss, 2)} / ${f(tp[1].loss, 2)} %, the bonnet ${f(td[0].loss, 2)} / ${f(td[1].loss, 2)} %, into its like ${f(tt[0].turn, 1)} / ${f(tt[1].turn, 1)} deg; without a mark ${base ? 'all five differ' : 'NOT all five differ'}`);

    // the run from the police: the game's own mark on a real run (Chapman's Peak: an open road with traffic and a patrol car), turned into the barrier
    const ckOf = (c) => { c.ck = { m: mOf(c) + 90, gl: 0, glT: 1 }; };
    const ch = twin((K) => raceOn(K, 'chapman', { laps: 1, seed: 11, difficulty: 3, police: true }), 9, { drive: into(4, 6.5), more: (r) => r.pol.cars.map(c => stateLine(c)).join('\n') });
    const cw = two(tx => wall(tx, 30, 120, 1, 2, { pre: ckOf })), cp = two(tx => prop(tx, 'bale', 120, 0, 1.2, { pre: ckOf })), cs = two(tx => slide(tx, 'rally', ckOf)), cd = hood({ pre: ckOf });
    const ck1 = two(tx => knock(HC, tx, tb(), 1, { lines: true, pre: (A, B) => ckOf(B) })), ck2 = two(tx => knock(HC, tx, tb(), 1, { lines: true, pre: (A, B) => { ckOf(A); ckOf(B); } }));
    ok('Realistična, exempt: a car in the run from the police keeps Simulacija\'s rules: a real run (Chapman\'s Peak, the player\'s car with the chase\'s mark, turned into the barrier after 4 s) is the same in cv 6 as in cv 1 after every step, the patrol car with it; a car with the mark at the barrier (30 deg, 120 km/h), at a bale, at a loose part (a bonnet at 120 km/h) and in the slide a knock leaves is the same after every step; hit at 100 km/h it takes its share as in cv 1 (two cars with the mark: the same to the end)',
      base && !!ch.P[0].ck && !!ch.P[1].ck && ch.R[0].pol.cars.length > 0 && ch.hw > 3 && !ch.diff && eqL(lines(cw)) && cw[0].first > 0 && eqL(lines(cp)) && cp[0].first > 0 && eqL(lines(cd)) && cd[0].first > 0 && eqL(cs) && lb(ck1) === true && eqL(lines(ck2)) && !same(ck1[0].L, ck1[1].L),
      `the run: ${ch.R[0].pol.cars.length} patrol car(s), the barrier first at step ${ch.wallAt} (the hardest ${f(ch.hw, 1)} m/s), ${ch.diff ? `cv 6 differs at step ${ch.diff}: ${ch.fld}` : 'no difference'}; the barrier at step ${cw[0].first}, the bale ${f(cp[0].loss, 2)} / ${f(cp[1].loss, 2)} % (without the mark ${f(p0[0].loss, 2)} / ${f(p0[1].loss, 2)} %), the bonnet ${f(cd[0].loss, 2)} / ${f(cd[1].loss, 2)} % (without ${f(d0[0].loss, 2)} / ${f(d0[1].loss, 2)} %)`);

    // the pit lane: a real one (Spa: the car in the middle of the lane, 30 deg toward its wall at 55 km/h, the race's own step keeps it in the lane)
    const inPit = (c) => { c.inPit = true; };
    const pl = twin((K) => { const r = raceOn(K, 'spa', { laps: 9 }), T = r.track, c = r.player, P = T.def.pit, sM = T.startS + (P[1] + P[2]) / 2, i = Math.round((((sM % T.len) + T.len) % T.len) / T.ds) % T.N, pz = T.pitAt(i * T.ds), d = pz.o * pz.sd, h = T.hd[i] + pz.sd * 30 / D;
      c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, h); c.locked = false; c.steer = 0; c.inSteer = c.inThr = c.inBrk = c.inHand = 0; c.digitalSteer = true; c.vx = Math.cos(h) * 55 / 3.6; c.vz = Math.sin(h) * 55 / 3.6; c.gear = 2;
      c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s; c.inPit = true; return r; }, 2, { drive: () => {} });
    const pw = two(tx => wall(tx, 30, 120, 1, 2, { pre: inPit })), pp = two(tx => prop(tx, 'bale', 120, 0, 1.2, { pre: inPit })), ps = two(tx => slide(tx, 'rally', inPit)), pd = hood({ pre: inPit });
    const pk = two(tx => knock(HC, tx, tb(), 1, { lines: true, pre: (A, B) => inPit(B) })), po = knock(HC, OLD, tb(), 1, { lines: true, pre: (A, B) => inPit(B) });
    ok('Realistična, exempt: a car in the pit lane keeps Simulacija\'s rules: in a real pit lane (Spa, 30 deg into the lane\'s wall at 55 km/h, in the lane at every step) the whole state after every step is the same in cv 6 as in cv 1; a car with the lane\'s mark at the barrier (30 deg, 120 km/h), at a bale, at a loose part (a bonnet at 120 km/h) and in the slide a knock leaves is the same after every step; a knock on it is the old knock (Stara\'s) in both',
      base && pl.pit === Math.round(2 / DT) && pl.hw > 3 && !pl.diff && eqL(lines(pw)) && pw[0].first > 0 && eqL(lines(pp)) && pp[0].first > 0 && eqL(lines(pd)) && pd[0].first > 0 && eqL(ps) && eqL(lines(pk)) && pk[0].hits > 0 && same(pk[1].L, po.L),
      `the lane: in it for ${pl.pit} steps, its wall first at step ${pl.wallAt} (the hardest ${f(pl.hw, 1)} m/s), ${pl.diff ? `cv 6 differs at step ${pl.diff}: ${pl.fld}` : 'no difference'}; the barrier at step ${pw[0].first}, the bale ${f(pp[0].loss, 2)} / ${f(pp[1].loss, 2)} %, the bonnet ${f(pd[0].loss, 2)} / ${f(pd[1].loss, 2)} %; the knock: ${pk[0].hits} touches, the car hit turned ${f(pk[1].turn, 1)} deg (without the mark ${f(knR.turn, 1)}, Simulacija ${f(knS.turn, 1)})`);
  }

  // -- the online race: with a friend's car in the race the game gives the core no choice (js/game.js testOf(net): {}), so the knocks are
  // Simulacija's on both sides whatever is chosen in the menu
  {
    const src = fs.readFileSync(path.join(ROOT, 'js', 'game.js'), 'utf8'), m = /const testOf = \(net\) => \{[^\n]*\n[^\n]*\}; \};/.exec(src);
    let on = null, off = null, err = '';
    try { const S = new Proxy({ crV: 5 }, { get: (o, k) => (k in o ? o[k] : 0) }), LV = new Proxy({}, { get: () => [null] });
      const testOf = new Function('S', 'TEST_LV', m[0] + '\nreturn testOf;')(S, LV); on = testOf(true); off = testOf(false); } catch (e) { err = String(e && e.message || e); }
    C.setTest(on || REAL); const cvOn = C.TX.cv; C.setTest(off); const cvOff = C.TX.cv; C.setTest(null);
    const calls = (src.match(/setTest\(/g) || []).length, via = (src.match(/Core\.setTest\(testOf\(/g) || []).length;
    // what the game hands testOf: at the start of a race the race's own word that it is online (on), and when the settings change during a race
    // whether a friend's car is in it; a call with anything else (testOf(false): the menu's choice online too) is a miss
    const atStart = (src.match(/Core\.setTest\(testOf\(!!on\)\);/g) || []).length, atSet = (src.match(/Core\.setTest\(testOf\(race && race\.player && race\.cars\.some\(c => c\.net\)\)\);/g) || []).length;
    // a friend's car (net) into the front part of the standing local car: the local car takes its share by the version
    const net = (tx) => { const S = tb(); S.A.net = true; return knock(HC, tx, S, 1, { lines: true }); };
    const nOn = net(on || REAL), nS = net(SIM), nR = net(REAL);
    ok('the online race: with a friend\'s car in the race the game gives the core no choice (js/game.js: testOf(true) is {}, every Core.setTest there goes through testOf, and the two calls there hand it whether the race is online: testOf(!!on) at the start, testOf(a friend\'s car is in the race) when the settings change), so Realistična chosen in the menu (testOf(false): cv 6) is Simulacija online: a friend\'s car into the local one ends as Simulacija\'s to the last digit, not as Realistična\'s',
      !!m && !err && !!on && JSON.stringify(on) === '{}' && !!off && off.cv === 6 && cvOn === null && cvOff === 6 && calls === 2 && via === 2 && atStart === 1 && atSet === 1 && !!nOn.first && same(nOn.L, nS.L) && !same(nR.L, nS.L),
      err || `testOf(true) ${JSON.stringify(on)}, testOf(false).cv ${off && off.cv}; setTest calls in the game ${calls}, through testOf ${via} (at the start with the race's word ${atStart}, at a change of the settings with the friend's car ${atSet}); the local car turned ${f(nOn.turn, 1)} deg (Simulacija ${f(nS.turn, 1)}, Realistična ${f(nR.turn, 1)})`);
  }

  // -- Nastavitve: the game's default is Realistična (js/game.js DEF, the one-time move tdgp-defaults-v6, the rows of index.html), the core's
  // own stays Simulacija (KV_DEF: a Core nobody tells anything, as the Node tests and the online race have it; the choice, above), so no
  // reference of the drive moves; »Odpadli deli: Izklop« is Core TX.deb 0 (tests/odpadli-deli.test.js), »Odpadlo kolo« the race's wheel
  // rule (tests/wheels.test.js: with it and without); none of them reaches a race with a friend
  {
    const src = fs.readFileSync(path.join(ROOT, 'js', 'game.js'), 'utf8'), html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const m = /const testOf = \(net\) => \{[^\n]*\n[^\n]*\}; \};/.exec(src), def = (/\n  const DEF = \{[^\n]*/.exec(src) || [''])[0];
    const v6 = (/if \(!localStorage\.getItem\('tdgp-defaults-v6'\)\) \{ ([^\n]*?) localStorage\.setItem\('tdgp-defaults-v6', '1'\);/.exec(src) || [])[1] || '';
    const has = (t, k, v) => new RegExp('(^|[^A-Za-z.])' + k + '(: | = )' + v + '([,; }]|$)').test(t);
    const of = (o, friend) => { const S = new Proxy(o, { get: (t, k) => (k in t ? t[k] : 0) }), LV = new Proxy({}, { get: () => [null] }); return new Function('S', 'TEST_LV', m[0] + '\nreturn testOf;')(S, LV)(friend); };
    let on = null, off = null, net = null, err = '';
    try { on = of({ crV: 5, debris: 1 }, false); off = of({ crV: 5, debris: 0 }, false); net = of({ crV: 5, debris: 0 }, true); } catch (e) { err = String(e && e.message || e); }
    const txOf = (o) => { C.setTest(o); const r = { cv: C.TX.cv, deb: C.TX.deb }; C.setTest(null); return r; };
    const core = txOf(null), tOn = txOf(on || { deb: 0 }), tOff = txOf(off || {}), tNet = txOf(net || { cv: 6, deb: 0 });
    const row = (key) => { const out = [], re = new RegExp('data-set="' + key + '">(.*?)</div>', 'g'); let x; while ((x = re.exec(html))) out.push((x[1].match(/data-v="[^"]*"/g) || []).map(t => t.replace(/[^0-9]/g, '')).join(',')); return out.join(' | '); };
    const rows = { crV: row('crV'), debris: row('debris'), wheelOver: row('wheelOver'), damage: row('damage') };
    const wheel = /wheelRule: solo \|\| chase \|\| !\+S\.wheelOver \? undefined : WHEEL_RULE,/.test(src);
    const valid = /S\.crV = Number\.isInteger\(\+S\.crV\) && \+S\.crV >= 0 && \+S\.crV <= CR_REAL \? \+S\.crV : CR_REAL;/.test(src) && /CR_OLD = 4, CR_REAL = 5;/.test(src);
    ok('Nastavitve: the game\'s default is Realistična (js/game.js DEF: Trki 5, Odpadli deli Vklop, Odpadlo kolo Konec dirke, Poškodbe Samo videz; the one-time move tdgp-defaults-v6 sets the first three and leaves Poškodbe; a stored version out of range becomes Realistična; index.html: Trki Realistično / Kot zdaj in Nastavitve and in the pause, the four older versions in Preizkus), the core\'s own stays Simulacija (no choice given: no version, no deb), so the references of the drive do not move; Odpadli deli: Vklop gives the core nothing, Izklop TX.deb 0, a race with a friend neither (and no version); Odpadlo kolo: Dirka teče naprej gives the race no wheel rule',
      !!m && !err && !!def && has(def, 'crV', '5') && has(def, 'debris', '1') && has(def, 'wheelOver', '1') && has(def, 'damage', '1') && has(v6, 'S\\.crV', '5') && has(v6, 'S\\.debris', '1') && has(v6, 'S\\.wheelOver', '1') && !/damage/.test(v6) && valid && wheel
        && C.KV_IDS[1] === 'sim' && C.KV_IDS[6] === 'real' && core.cv === null && core.deb === null && !!on && on.cv === 6 && on.deb === null && tOn.cv === 6 && tOn.deb === null && !!off && off.cv === 6 && off.deb === 0 && tOff.cv === 6 && tOff.deb === 0
        && !!net && JSON.stringify(net) === '{}' && tNet.cv === null && tNet.deb === null && rows.crV === '5,0 | 1,2,3,4 | 5,0' && rows.debris === '0,1' && rows.wheelOver === '1,0' && rows.damage === '0,1,2',
      err || `DEF: crV ${has(def, 'crV', '5') ? 5 : '?'}, debris ${has(def, 'debris', '1') ? 1 : '?'}, wheelOver ${has(def, 'wheelOver', '1') ? 1 : '?'}, damage ${has(def, 'damage', '1') ? 1 : '?'}; the move: ${v6.trim()}; the core alone: cv ${core.cv}, deb ${core.deb}; Vklop: cv ${tOn.cv}, deb ${tOn.deb}; Izklop: cv ${tOff.cv}, deb ${tOff.deb}; with a friend ${JSON.stringify(net)}: cv ${tNet.cv}, deb ${tNet.deb}; the rows: crV ${rows.crV}; debris ${rows.debris}; wheelOver ${rows.wheelOver}; damage ${rows.damage}`);
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
  const w = [OLD, SIM, ARC, SOFT, STUNT].map(hit), wr = hit({ cv: 6 });
  ok('walls: the knock off the barrier is the same in cv 1 to 5 (the user\'s: the walls stay as they were); Realistična has its own (its barrier checks above)', w.every(x => x === w[0]) && wr !== w[0], w.join(' | ') + ' | Realistična: ' + wr);
}

// ---- races ----
function race(tid, tx) {
  return test(tx, () => {
    Math.random = seeded(64); const T = new C.Track(C.TRACKS.find(d => d.id === tid));
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); r.start();
    const sp = new Map(), glue = new Map(), pv = new Map(); let spins = 0, glued = 0, nan = false, hits = 0, gain = 0, gainAt = '', top = 0, wmax = 0;
    for (let k = 1; k <= 150 / DT; k++) {
      Math.random = seeded(1000 + k); C.aiControl(r.player, r, DT); r.step(DT);
      for (const c of r.cars) { if (!Number.isFinite(c.x + c.z + c.vx + c.vz + c.w)) nan = true; if (c.hitCar > 3) hits++; c.hitCar = 0;
        const v = Math.hypot(c.vx, c.vz), p = pv.get(c); if (p != null && v - p > gain) { gain = v - p; gainAt = `${c.m.id} ${f(p * 3.6, 0)} -> ${f(v * 3.6, 0)} km/h at ${f(k * DT, 1)} s`; } pv.set(c, v); top = Math.max(top, v * 3.6); wmax = Math.max(wmax, Math.abs(c.w));   // (the most speed gained in a step: a knock; the fastest; the fastest turn)
        const s = Math.abs(c.beta || 0) > 0.7 && c.speed > 8; if (s && !sp.get(c)) spins++; sp.set(c, s); }
      if (k % 12 === 0) for (let a = 0; a < r.cars.length; a++) for (let b = a + 1; b < r.cars.length; b++) { const A = r.cars[a], B = r.cars[b], dx = B.x - A.x, dz = B.z - A.z; if (dx * dx + dz * dz > 36) { glue.set(a * 100 + b, 0); continue; }
        const ch = Math.cos(A.h), sh = Math.sin(A.h), lx = dx * ch + dz * sh, lz = -dx * sh + dz * ch, touch = Math.abs(lx) < A.m.len * 0.9 && Math.abs(lz) < (A.m.wid + B.m.wid) * 0.5 + 0.08 && A.speed > 5;
        const n = touch ? (glue.get(a * 100 + b) || 0) + 1 : 0; glue.set(a * 100 + b, n); if (n === 20) glued++; }
    }
    return { nan, spins, glued, hits, gain, gainAt, top, wmax, moving: r.cars.filter(c => c.speed > 5).length, n: r.cars.length };
  });
}
for (const tid of ['spa', 'bathurst']) {
  const res = [SIM, ARC, SOFT, REAL, STUNT, OLD].map(tx => race(tid, tx)), nm = ['Simulacija', 'Arkadna', 'Mehka', 'Realistična', 'Kaskaderska', 'Stara'];
  ok(`race ${tid} in every version: nothing NaN, every car moving, no two cars glued side by side for 2 s, spins at most 4 in Simulacija, Arkadna, Mehka and Realistična`,
    res.every(x => !x.nan && x.moving === x.n && x.glued === 0) && res.slice(0, 4).every(x => x.spins <= 4), res.map((x, i) => `${nm[i]}: ${x.hits} knocks, ${x.spins} spins, ${x.glued} glued, ${x.moving}/${x.n} moving`).join('; '));
  // Realistična: no launch (a knock gives a car no speed and no turn out of nothing)
  const R6 = res[3], others = res.filter(x => x !== R6), topO = Math.max(...others.map(x => x.top));
  ok(`race ${tid} in Realistična, no launch: no knock gives a car more than 8 m/s in a step, no car is faster than the fastest of the other versions by more than 5 km/h and none turns faster than 9 rad/s`,
    !R6.nan && R6.gain < 8 && R6.top < topO + 5 && R6.wmax <= 9 + 1e-9,
    `the most gained in a step ${f(R6.gain, 2)} m/s (${R6.gainAt}; the other versions ${f(Math.max(...others.map(x => x.gain)), 2)}), the fastest ${f(R6.top, 0)} km/h (the other versions ${f(topO, 0)}), the fastest turn ${f(R6.wmax, 2)} rad/s`);
}

let bad = 0;
console.log('== trki med avti (različice)');
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} checks`);
process.exitCode = bad ? 1 : 0;
