// Padec čez rob kot togo telo (js/core.js: FALL, fallBody; the user's decision of 10. 11. 2026: »Analiziraj kako avto zapelje cez rob in se
// prevrne v prepad in popravi da bo cimbolj realisticno«; docs/trki-realizem.md, »Padec čez rob (Killar)«).
// A car that goes over the edge on a track whose ground beyond the edge the core knows (Track.floor: Killar) is a rigid body on that ground:
// it tips about the edge, falls, tumbles and slides down the slope and comes to rest; it never sinks into the ground, never gains energy and
// never bounces; a hard knock dents it where it struck; then it is put back on the road where it went over.
//   1. a made-up slope beside a real road (Spa without its hills, along its longest straight; the ground's function is given to the track
//      here, so the test runs in a tree without Killar too): the rules above, measured by the test's own arithmetic on the body's points;
//   2. the tracks: only a track with def.floor uses the body (Killar and no other), every other fall is the old one;
//   3. Killar, where it is in the tree: cars driven over its edge at five places.
//   node tests/padec.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded, stateLine } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const orig = Math.random, G = 9.81, CAP = 1.5, HOLD = 0.8, SLAB = 1.5;   // (FALL's own numbers in js/core.js: g, cap, hold, slab)
// CAP is the game's longest fall (the user's decision of 10. 11. 2026: »Vrni tako kot prej po 1,5s«). The body itself is followed for longer here
// (LONG seconds, the race's opts.fallCap), to where the ground lets it come to rest: what it does in the game's 1.5 s is the beginning of that
const LONG = 8, SNAP = 160;   // (SNAP: a step within the game's 1.5 s)
const opts = (o) => Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tt: true, damage: 2, fallCap: LONG }, o);
const med = (a) => { a = a.slice().sort((x, y) => x - y); return a.length ? a[a.length >> 1] : NaN; };

// what the test reads off a falling body each step (B = car.fall.b): the deepest any point of its hull is in the ground (depth(x, y, z): the
// test's own measure of the ground), its energy (as a height: J / (m g)), how it stands
function watch(B, m, depth) {
  const P = B.G.P, R = B.R; let pen = 0;
  for (let i = 0; i < B.G.n; i++) {
    const lx = P[3 * i], ly = P[3 * i + 1], lz = P[3 * i + 2];
    const d = depth(B.x + R[0] * lx + R[1] * ly + R[2] * lz, B.y + R[3] * lx + R[4] * ly + R[5] * lz, B.z + R[6] * lx + R[7] * ly + R[8] * lz);
    if (d > pen) pen = d;
  }
  const wb = [R[0] * B.wx + R[3] * B.wy + R[6] * B.wz, R[1] * B.wx + R[4] * B.wy + R[7] * B.wz, R[2] * B.wx + R[5] * B.wy + R[8] * B.wz];
  const e = (0.5 * m * (B.vx * B.vx + B.vy * B.vy + B.vz * B.vz) + 0.5 * (wb[0] * wb[0] / B.iI[0] + wb[1] * wb[1] / B.iI[1] + wb[2] * wb[2] / B.iI[2])) / (m * G) + B.y;
  return { pen, e };
}
// a fall followed to its end: step() the race's, P the car, depth the ground's measure, line(x, z) how far beyond the edge (m). Besides: tp, the
// most the body moved in a step beyond what its speed (before or after the step, the greater) takes it (a push out of the ground with no speed
// behind it); mirror, whether the car's own numbers were the body's every step (where it is, how it moves, its heading its nose's); roofK,
// sideK, the knocks on its roof and elsewhere; snap, its state after SNAP steps; frz, frw, the speed and the turning it was stopped from when it
// was taken to lie still; kd, the damage its knocks make by the rule (0.012 a m/s above 3 m/s) against bd, what the body counted; up0, its own
// up after its first step. flip: the body set upside down (its nose where it was, not
// turning) and lifted a metre after its first step: the test's way to a landing flat on the roof
function follow(r, P, depth, line, kMax, rnd, flip) {
  const s0 = P.q.s, d0 = P.dist, dm0 = P.dmg, m = P.m.mass || 1200, y0 = P.y || 0;
  let B = null, pen = 0, e0 = null, eUp = 0, ePrev = null, eLow = 1e18, eRise = 0, vUp = 0, t = 0, frozen = true, minUp = 1, touched = 0, drop = 0, out = 0, w1 = 0, vo1 = 0, k = 0, fin = true, stuck = 0, rise = 0, yLow = 1e9, tilt1 = 1, tp = 0, mirror = true, roofK = 0, sideK = 0, snap = '', hn0 = 0, v0 = -1, wP = 0, frz = 0, frw = 0, kd = 0, up0 = null;
  for (; k < (kMax || 120 * 14) && P.fall; k++) {
    Math.random = seeded(rnd ? rnd + 3 * k : 100 + k); P.inThr = 0; P.inBrk = 0; P.inSteer = 0;
    const F = P.fall; r.step(DT); B = F.b; if (!B) break;
    if (flip && k === 0) { const Q = B.q, hh = -P.h / 2; Q[0] = Math.cos(hh); Q[1] = 0; Q[2] = -Math.sin(hh); Q[3] = 0; B.wx = B.wy = B.wz = 0; B.y += 1; continue; }
    { const v1 = Math.hypot(B.vx, B.vy, B.vz), w1 = Math.hypot(B.wx, B.wy, B.wz); if (v0 >= 0) { tp = Math.max(tp, Math.hypot(B.x - B.px, B.y - B.py, B.z - B.pz) - Math.max(v0, v1) * DT); if (v1 === 0 && w1 === 0) { if (v0 > frz) frz = v0; if (wP > frw) frw = wP; } } v0 = v1; wP = w1; }
    if (B.hn > hn0) { hn0 = B.hn; kd += 0.012 * (B.hv - 3); if (B.hr) roofK++; else sideK++; }
    if (!B.done && !(P.x === B.x && P.z === B.z && P.y === B.y - B.hc && P.roadY === P.y && P.vx === B.vx && P.vy === B.vy && P.vz === B.vz && P.w === -B.wy && P.air === 1 && (B.R[0] * B.R[0] + B.R[6] * B.R[6] <= 0.09 || P.h === Math.atan2(B.R[6], B.R[0])))) mirror = false;
    if (k === SNAP) snap = JSON.stringify([B.x, B.y, B.z, B.q, B.vx, B.vy, B.vz, B.wx, B.wy, B.wz, B.hn]);
    t = F.t; const W = watch(B, m, depth); if (!B.done) { if (W.pen > pen) pen = W.pen; if (P.q.s !== s0 || P.dist !== d0) frozen = false; if (P.stuckT > stuck) stuck = P.stuckT; }
    if (e0 == null) e0 = W.e; if (ePrev != null && W.e > ePrev) eUp += W.e - ePrev; ePrev = W.e; if (W.e < eLow) eLow = W.e; else if (W.e - eLow > eRise) eRise = W.e - eLow;
    if (B.nc || B.hn) touched = 1; if (touched && B.vy > vUp) vUp = B.vy;
    if (B.R[4] < minUp) minUp = B.R[4]; if (t <= 1.5 + 1e-9) tilt1 = Math.min(tilt1, B.R[4]); if (y0 - (B.y - B.hc) > drop) drop = y0 - (B.y - B.hc); out = line(B.x, B.z);
    if (B.y < yLow) yLow = B.y; else if (touched && B.y - yLow > rise) rise = B.y - yLow;
    if (k === 0) { w1 = Math.hypot(B.wx, B.wy, B.wz); vo1 = B.vx * B.nx + B.vz * B.nz; up0 = [B.R[1], B.R[4], B.R[7]]; }
    if (!Number.isFinite(B.x + B.y + B.z + B.vx + B.vy + B.vz + B.wx + B.wy + B.wz + B.q[0] + B.q[1] + B.q[2] + B.q[3])) fin = false;
  }
  return { B, t, pen, eUp, eRise, vUp, frozen, minUp, tilt1, drop, out, w1, vo1, fin, stuck, rise, tp, mirror, roofK, sideK, snap, frz, frw, kd, bd: B ? B.dmg : 0, up0, top: P.dents.filter(d => d.top).length, roofDmg: P.roofDmg || 0, steps: k, end: B ? B.done : -1, hits: B ? B.hn : 0, dmg: P.dmg - dm0, dents: P.dents.length, back: P.q.s - s0, falls: P.falls || 0, free: !P.fall, air: P.air, s0 };
}

// 1. the made-up slope: beyond a straight line (the road's left line, Track.bl, where the cars are sent over, on the road's longest straight: the
//    road's own line is never more than half a metre inside it over the falls' length) the ground falls at `deg` to `deep` metres under the road,
//    level from there on, known out to `far` metres beyond the line; inside the line level ground at the road's height and the road's own platform
//    (level: the track without its hills). The ground's slope is its height's own (a plane, a crease at its top and at its foot)
{
  const def = C.TRACKS.find(d => d.id === 'spa'), flat = Object.assign({}, def, { elev: null, bumps: null, bank: null });
  // (where: 60 m into the 500 m of the road whose heading changes least)
  const place = (T) => { const n = Math.round(500 / T.ds); let bi = 0, bs = 1e9;
    for (let i = 0; i < T.N; i += 5) { let lo = 0, hi = 0; for (let j = 1; j <= n; j++) { let d = T.hd[(i + j) % T.N] - T.hd[i]; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; if (d < lo) lo = d; if (d > hi) hi = d; } if (hi - lo < bs) { bs = hi - lo; bi = i; } }
    return (bi + Math.round(60 / T.ds)) % T.N; };
  const make = (deg, deep, far) => {
    const T = new C.Track(flat), k = Math.tan(deg * Math.PI / 180), i = place(T), ox = T.px[i] - T.nx[i] * T.bl[i], oz = T.pz[i] - T.nz[i] * T.bl[i], ux = -T.nx[i], uz = -T.nz[i];
    const line = (x, z) => (x - ox) * ux + (z - oz) * uz;   // (how far beyond the line)
    T.floor = { made: 1 };
    T.floorAt = (x, z, out) => { const d = line(x, z); if (d < -8 || d > far) return false; const on = d > 0 && k * d < deep; out.h = -Math.min(deep, k * Math.max(0, d)); out.gx = on ? -k * ux : 0; out.gz = on ? -k * uz : 0; return true; };
    const cs = Math.cos(Math.atan(k));
    // (the test's own measure: beyond the line under the slope's plane, along its normal; inside the line under the road, no deeper than the platform is thick; at the line's own corner the nearer way out)
    const depth = (x, y, z) => { const d = line(x, z); if (d > far || d < -8) return 0; if (d >= 0) { const h = -Math.min(deep, k * d); return y < h ? (k * d < deep ? Math.min((h - y) * cs, -y > 0 ? Math.hypot(d, -y) : 1e9) : h - y) : 0; } return y < 0 && y > -SLAB ? Math.min(-y, -d) : 0; };
    return { T, i, line, depth };
  };
  // a car sent over the line at the slope's own place: v m/s, its nose ang degrees off the road's line toward the edge, its middle 2 cm inside the line
  // (o.seed, o.rnd: other random numbers at the race's making and round every step)
  const send = (W, o) => {
    const T = W.T; Math.random = seeded(o.seed || 3);
    const r = new C.Race(T, opts({ playerModel: C.MODELS[o.model == null ? 4 : o.model], fallCap: o.game ? 0 : LONG })), P = r.player; r.start();   // (o.game: the game's own longest fall)
    const i = W.i, a = o.ang * Math.PI / 180, h = T.hd[i] - a, d = -(T.bl[i] - 0.02);
    P.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, h); P.vx = Math.cos(h) * o.v; P.vz = Math.sin(h) * o.v; P.w = o.w || 0; P.y = P.py = 0; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s;
    P.fall = { t: 0, raw: 1 }; P.air = 1;   // (the fall begun by hand: no push across the edge to take back out)
    const R = follow(r, P, W.depth, W.line, o.kMax, o.rnd, o.flip); Math.random = orig; R.P = P; R.r = r; return R;
  };
  const W45 = make(45, 12, 200), crawl = send(W45, { v: 1.2, ang: 60 }), slow = send(W45, { v: 8, ang: 25 }), fast = send(W45, { v: 28, ang: 20 }), side = send(W45, { v: 14, ang: 85, w: 1.5 });
  const all = [crawl, slow, fast, side], names = ['4 km/h at 60°', '29 km/h at 25°', '101 km/h at 20°', '50 km/h at 85°, spinning'];
  check('a body: on a track with a floor a car over the edge falls as a rigid body (car.fall.b), every number of it finite to its end',
    all.every(x => x.B && x.fin && x.steps > 10), all.map((x, k) => `${names[k]}: ${x.t.toFixed(2)} s`).join('; '));
  check('never in the ground: no point of the hull more than 3 cm under the slope, under the level ground below it or under the road, at any step of any fall',
    all.every(x => x.pen <= 0.03), all.map((x, k) => `${names[k]}: ${(x.pen * 100).toFixed(1)} cm`).join('; '));
  check('never more energy: its energy (speed, turning, height; as a height) never rises more than 0.15 m above the least it has had (a hard knock\'s push out of the ground, the knock itself taking far more), all its rises of a whole fall together less than 0.5 m',
    all.every(x => x.eRise < 0.15 && x.eUp < 0.5), all.map((x, k) => `${names[k]}: +${x.eRise.toFixed(3)} m at the most, +${x.eUp.toFixed(3)} m in all`).join('; '));
  check('it tips over the edge: at a crawl it turns as it goes over (0.3-2 rad/s from its first step, its floor more than 30° from level within 1.5 s) and ends more than 10 m down',
    crawl.w1 > 0.3 && crawl.w1 < 2 && crawl.tilt1 < Math.cos(30 * Math.PI / 180) && crawl.drop > 10, `turning ${crawl.w1.toFixed(2)} rad/s at once, up ${crawl.tilt1.toFixed(2)} after 1.5 s, ${crawl.drop.toFixed(1)} m down`);
  check('it tumbles and comes to rest: the crawl (its nose goes down over the edge) and the fast one roll past their side (their up below level at some time), every one of the four is knocked on the ground and lies still at the foot of the slope (12 m down; taken to lie only from less than 0.5 m/s and 0.7 rad/s) before the longest fall is up (8 s), then is put back',
    crawl.minUp < 0 && fast.minUp < 0 && all.every(x => x.hits >= 1 && x.end === 1 && x.t < LONG && x.free && x.drop > 11 && x.frz < 0.5 && x.frw < 0.7), all.map((x, k) => `${names[k]}: up ${x.minUp.toFixed(2)} at the least, ${x.hits} knocks, end ${x.end} after ${x.t.toFixed(2)} s`).join('; '));
  check('put back where it went over: on the road within 3 m of where its middle crossed the line, one fall counted, on its wheels (not in the air), its place on the road, its distance and its stuck timer untouched all the fall',
    all.every(x => Math.abs(x.back) < 3 && x.falls === 1 && !x.air && x.frozen && x.stuck < 0.2 && Math.abs(x.P.q.d) < x.r.track.w), all.map((x, k) => `${names[k]}: ${x.back.toFixed(1)} m on, falls ${x.falls}, frozen ${x.frozen}`).join('; '));
  check('damage from the knocks: a hard fall dents the car where it struck (more than 0.1 and at most 0.5 of damage a fall, a dent a knock), the crawl too once it tumbles; the body counts 0.012 a m/s of every knock above 3 m/s, 0.5 at the most',
    all.every(x => x.dmg > 0.02 && x.dmg <= 0.5 + 1e-9 && x.dents >= 1 && x.kd > 0 && Math.abs(x.bd - Math.min(0.5, x.kd)) < 1e-9) && fast.dmg > 0.1, all.map((x, k) => `${names[k]}: +${x.dmg.toFixed(2)}, ${x.dents} dents`).join('; '));
  // no bounce: dropped flat from 2.5 m onto level ground (the slope 1 m deep: a step), the body never rises again by more than its own turning lets a corner lift it
  { const W = make(80, 2.5, 200), d = send(W, { v: 6, ang: 90 });
    check('no bounce: off a 2.5 m step onto level ground it lands and stays down (after its first touch its middle never more than 0.6 m above its lowest point, never rising faster than 2.5 m/s), rolls on on its wheels and lies still within 4 s (stopped from less than 0.5 m/s, not while it still rolls)',
      d.B && d.end === 1 && d.t < 4 + HOLD && d.rise < 0.6 && d.vUp < 2.5 && d.pen <= 0.03 && d.frz < 0.5 && d.out > 4, `rise ${d.rise.toFixed(2)} m, fastest up ${d.vUp.toFixed(2)} m/s, still after ${d.t.toFixed(2)} s ${d.out.toFixed(1)} m out, stopped from ${d.frz.toFixed(2)} m/s, ${(d.pen * 100).toFixed(1)} cm deep at the most`); }
  // friction: on a gentle slope (10°: less than even its rolling wheels hold) it stops on the slope; on a steep one (60°) it does not
  { const g = send(make(10, 60, 400), { v: 3, ang: 90 }), s = send(make(60, 60, 200), { v: 3, ang: 90 });
    check('friction: on a 10° slope it stops on the slope itself (at rest less than 25 m beyond the edge, not at its foot 340 m out); on a 60° slope it goes on down (more than 15 m down, never at rest on it)',
      g.end === 1 && g.out < 25 && g.drop < 5 && s.drop > 15 && (s.end !== 1 || s.drop > 59), `10°: end ${g.end}, ${g.out.toFixed(1)} m out, ${g.drop.toFixed(1)} m down; 60°: end ${s.end}, ${s.drop.toFixed(1)} m down after ${s.t.toFixed(2)} s`); }
  // the ground's end: where the track knows no ground (20 m beyond the line here) the fall ends at once, the car put back; and the longest fall
  { const o = send(make(45, 300, 20), { v: 20, ang: 60 }), c = send(make(50, 2000, 4000), { v: 10, ang: 60 });
    check('the ends: with no ground known under it (20 m beyond the edge) the fall ends within 0.5 s and the car is put back; on a slope without end it is put back after the longest fall asked for (8 s here); either way damaged by at least the old fall\'s 0.32',
      o.end === 2 && o.free && o.out > 19 && o.out < 20 + 14 && c.end === 3 && c.free && Math.abs(c.t - LONG) < 0.02 && c.pen <= 0.03 && o.dmg >= 0.32 - 1e-9 && c.dmg >= 0.32 - 1e-9, `no ground: end ${o.end} at ${o.out.toFixed(1)} m out after ${o.t.toFixed(2)} s, +${o.dmg.toFixed(2)}; no end: end ${c.end} after ${c.t.toFixed(2)} s, ${c.drop.toFixed(0)} m down, +${c.dmg.toFixed(2)}`); }
  // the same fall twice, with other random numbers in the air: the same to the last digit
  { const key = (x) => JSON.stringify([x.t, x.B.x, x.B.y, x.B.z, x.B.q, x.B.hn, x.dmg, x.P.x, x.P.z, x.P.h]);
    const a = key(fast), b = key(send(W45, { v: 28, ang: 20, seed: 77, rnd: 5000 }));
    check('no chance in it: the same fall with other random numbers drawn round it ends the same to the last digit', a === b, a === b ? `${fast.t.toFixed(2)} s, ${fast.hits} knocks` : `${a} | ${b}`); }
  // other bodies: the lightest and the heaviest car of the game, the lowest and the tallest hull
  { const by = (f) => C.MODELS.map((M, k) => [f(M), k]).filter(x => Number.isFinite(x[0])).sort((a, b) => a[0] - b[0]), ms = by(M => M.mass), ls = by(M => M.len);
    const pick = [...new Set([ms[0][1], ms[ms.length - 1][1], ls[0][1], ls[ls.length - 1][1]])].filter(k => !C.MODELS[k].trailer && !C.MODELS[k].tl), R = pick.map(k => send(W45, { v: 12, ang: 40, model: k }));
    check('every body: the lightest, the heaviest, the shortest and the longest vehicle of the game fall the same way (finite, never more than 3 cm in the ground, no energy gained, put back)',
      R.every(x => x.B ? x.fin && x.pen <= 0.03 && x.eRise < 0.15 && x.free && x.falls === 1 : x.free && x.falls === 1), R.map((x, j) => `${C.MODELS[pick[j]].id || pick[j]}: ${x.B ? `${x.t.toFixed(2)} s, ${(x.pen * 100).toFixed(1)} cm, +${x.eRise.toFixed(3)} m` : 'the old fall (a trailer)'}`).join('; ')); }
  // the game's own fall: the body for the old fall's time (the user's decision of 10. 11. 2026: »Vrni tako kot prej po 1,5s«): the long fall's
  // beginning to the last digit, then the car is put back as it always was
  { const gm = [send(W45, { v: 1.2, ang: 60, game: 1 }), send(W45, { v: 8, ang: 25, game: 1 }), send(W45, { v: 28, ang: 20, game: 1 }), send(W45, { v: 14, ang: 85, w: 1.5, game: 1 })];
    check('the game\'s fall lasts 1.5 s: the same body as the long fall to the last digit while it lasts (its state after 1.34 s), then the car is back on the road within 3 m of where it went over, on its wheels, one fall counted, damaged by the old fall\'s 0.32 at least and 0.5 at most; the crawl has tipped more than 30° by then',
      gm.every((x, k) => x.B && x.fin && x.end === 3 && Math.abs(x.t - CAP) < 0.02 && x.snap && x.snap === all[k].snap && x.free && !x.air && x.falls === 1 && Math.abs(x.back) < 3 && x.frozen && x.pen <= 0.03 && x.dmg >= 0.32 - 1e-9 && x.dmg <= 0.5 + 1e-9) && gm[0].tilt1 < Math.cos(30 * Math.PI / 180),
      gm.map((x, k) => `${names[k]}: end ${x.end} after ${x.t.toFixed(2)} s, ${x.drop.toFixed(1)} m down, up ${x.tilt1.toFixed(2)}, +${x.dmg.toFixed(2)}${x.snap === all[k].snap ? '' : ', NOT the long fall\'s beginning'}`).join('; ')); }
  check('the car is its body: every step of a fall the car\'s own numbers are the body\'s (where it is, its height the centre\'s less the centre\'s own, how it moves and turns, its heading its nose\'s, in the air), and the body never moves in a step more than 0.1 m further than its speed takes it (no push out of the ground with no speed behind it)',
    all.every(x => x.mirror && x.tp < 0.1), all.map((x, k) => `${names[k]}: ${x.mirror ? 'the same' : 'NOT the same'}, ${(x.tp * 100).toFixed(1)} cm`).join('; '));
  // the roof: a knock on it dents it from above (a dent with top; car.roofDmg 0.3 more), a knock elsewhere never does (the roof then sags only as all damage makes it)
  { const W = make(80, 2.5, 200), set = all.concat([send(W, { v: 6, ang: 90 }), send(W, { v: 6, ang: 90, flip: 1 })]), wr = set.filter(x => x.roofK > 0), nr = set.filter(x => !x.roofK && x.sideK > 0);
    check('the roof: a fall with a knock on the roof (off a 2.5 m step upside down) leaves a dent in the roof from above and the roof crushed by 0.3 at least (car.roofDmg), a fall knocked only elsewhere leaves no dent from above',
      wr.length >= 1 && nr.length >= 1 && wr.every(x => x.top >= 1 && x.roofDmg >= 0.3 - 1e-9) && nr.every(x => x.top === 0), `${wr.length} falls with the roof knocked (${wr.map(x => x.top).join(', ')} dents from above), ${nr.length} without (${nr.map(x => x.top).join(', ')})`); }
  // many falls: five speeds, three angles to the edge, two slopes
  { const W65 = make(65, 40, 200), g = []; for (const W of [W45, W65]) for (const v of [1.2, 5, 14, 28, 40]) for (const ang of [10, 40, 85]) g.push(send(W, { v, ang }));
    const worst = (fn) => Math.max(...g.map(fn));
    check('thirty falls (4 to 144 km/h, at 10°, 40° and 85° to the edge, down a 45° and a 65° slope): every one finite, no point more than 3 cm in the ground, no energy gained (0.15 m), no move without speed (0.1 m), the car its body, ended and put back, one fall counted, damaged by 0.32 to 0.5',
      g.every(x => x.B && x.fin && x.pen <= 0.03 && x.eRise < 0.15 && x.tp < 0.1 && x.mirror && x.end >= 1 && x.free && x.falls === 1 && x.dmg >= 0.32 - 1e-9 && x.dmg <= 0.5 + 1e-9),
      `${(worst(x => x.pen) * 100).toFixed(1)} cm, +${worst(x => x.eRise).toFixed(3)} m, ${(worst(x => x.tp) * 100).toFixed(1)} cm at the most; ends at rest ${g.filter(x => x.end === 1).length}, no ground ${g.filter(x => x.end === 2).length}, longest fall ${g.filter(x => x.end === 3).length}`); }
  // the road's side: beyond the line a step down (1.3 m: less than the platform is thick) onto ground that rises away from the road at 20°: a car that
  // drops into the ditch slides back against the road's side and is held by it: not pushed up through the road, not let in under it
  { const T = new C.Track(flat), i = place(T), ox = T.px[i] - T.nx[i] * T.bl[i], oz = T.pz[i] - T.nz[i] * T.bl[i], ux = -T.nx[i], uz = -T.nz[i], D = 1.3, k = Math.tan(20 * Math.PI / 180), cs = Math.cos(20 * Math.PI / 180);
    const line = (x, z) => (x - ox) * ux + (z - oz) * uz;
    T.floor = { made: 1 };
    T.floorAt = (x, z, out) => { const d = line(x, z); if (d < -8 || d > 200) return false; if (d > 0) { out.h = -D + k * d; out.gx = k * ux; out.gz = k * uz; } else { out.h = 0; out.gx = 0; out.gz = 0; } return true; };
    const depth = (x, y, z) => { const d = line(x, z); if (d > 200 || d < -8) return 0; if (d >= 0) { const h = -D + k * d; return y < h ? (h - y) * cs : 0; } return y < 0 && y > -SLAB ? Math.min(-y, -d) : 0; };
    const x = send({ T, i, line, depth }, { v: 6, ang: 20 }), B = x.B;
    check('the road\'s side: off a 1.3 m step into a ditch whose far side rises at 20° the car comes to rest against the road\'s side: lower than the road, its middle more than 0.5 m beyond the line (not under the road), no point more than 3 cm in the road\'s side or in the ground, never pushed up through the road (no move without speed, no energy gained)',
      B && x.fin && x.end === 1 && x.pen <= 0.03 && x.tp < 0.1 && x.eRise < 0.15 && x.out > 0.5 && x.out < 3 && B.y - B.hc < -0.3 && x.free, B ? `end ${x.end} after ${x.t.toFixed(2)} s, its middle ${x.out.toFixed(2)} m beyond the line and ${(-(B.y - B.hc)).toFixed(2)} m under the road, ${(x.pen * 100).toFixed(1)} cm deep, ${(x.tp * 100).toFixed(1)} cm, +${x.eRise.toFixed(3)} m` : 'no body'); }
  // a verge: a side with no drop (Track.fallAt 0 there) and no ground drawn beyond its line: the road's height goes on (to FALL.reach, 5 m, beyond the line)
  { const T = new C.Track(flat), i = place(T), ox = T.px[i] - T.nx[i] * T.bl[i], oz = T.pz[i] - T.nz[i] * T.bl[i], ux = -T.nx[i], uz = -T.nz[i];
    const line = (x, z) => (x - ox) * ux + (z - oz) * uz;
    T.floor = { made: 1 }; T.fallAt = [new Uint8Array(T.N), new Uint8Array(T.N)];
    T.floorAt = (x, z, out) => { const d = line(x, z); if (d < -8 || d > 0) return false; out.h = 0; out.gx = 0; out.gz = 0; return true; };
    const depth = (x, y, z) => { const d = line(x, z); return d > -8 && d < 5 && y < 0 && y > -SLAB ? -y : 0; };
    const x = send({ T, i, line, depth }, { v: 6, ang: 20 });
    check('a verge: where the side has no drop and no ground is drawn beyond the line, a car sent across the line stays at the road\'s height (the road\'s platform goes on), rolls to a stop and is put back: it does not fall through',
      x.B && x.fin && x.end === 1 && x.out > 0.5 && x.out < 5 && x.drop < 0.05 && x.pen <= 0.03 && x.free && x.falls === 1, x.B ? `end ${x.end} after ${x.t.toFixed(2)} s, ${x.out.toFixed(1)} m beyond the line, ${(x.drop * 100).toFixed(1)} cm down, ${(x.pen * 100).toFixed(1)} cm deep` : 'no body'); }
  // every vehicle's hull: as tall as the vehicle is drawn (its own data: def.look.body.roofY, else def.parts.ht), its centre of mass 0.25 to 0.45 of that up
  { const rows = [], old = [];
    for (let k = 0; k < C.MODELS.length; k++) { const M = C.MODELS[k]; if (M.trailer) { old.push(k); continue; } const x = send(W45, { v: 5, ang: 60, model: k, kMax: 1 }); if (!x.B) { rows.push({ id: M.id, H: 0, hc: 0, own: 0 }); continue; }
      const D = M.def, own = D ? (D.look && D.look.body && D.look.body.roofY) || (D.parts && D.parts.ht) || 0 : 0; rows.push({ id: M.id, H: x.B.G.H, hc: x.B.G.hc, own }); }
    const kit = rows.filter(r => r.own), badH = kit.filter(r => Math.abs(r.H - r.own) > 0.03), badC = rows.filter(r => !(r.H >= 0.8 && r.H <= 4 && r.hc >= 0.25 * r.H - 1e-9 && r.hc <= 0.45 * r.H + 1e-9));
    check('every vehicle\'s hull: as tall as the vehicle is drawn where its own data say how tall (within 3 cm), its centre of mass 0.25 to 0.45 of that up',
      rows.length > 0 && !badH.length && !badC.length, `${rows.length} vehicles, ${kit.length} with their own height (${kit.length ? Math.min(...kit.map(r => r.H)).toFixed(2) + ' to ' + Math.max(...kit.map(r => r.H)).toFixed(2) + ' m' : 'none in this tree'})${badH.length ? '; NOT as tall as drawn: ' + badH.map(r => `${r.id} ${r.H} against ${r.own}`).join(', ') : ''}${badC.length ? '; the centre: ' + badC.map(r => `${r.id} ${r.hc.toFixed(2)} of ${r.H}`).join(', ') : ''}`);
    // a vehicle with a semi-trailer: the old fall (Race._fall's own lines), beside a known ground too
    if (old.length) { const T = W45.T; Math.random = seeded(3); const r = new C.Race(T, opts({ playerModel: C.MODELS[old[0]], fallCap: 0 })), P = r.player; r.start();
      const i = W45.i, h = T.hd[i] - 1, d = -(T.bl[i] - 0.02); P.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, h); P.vx = Math.cos(h) * 8; P.vz = Math.sin(h) * 8; P.y = P.py = 0; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.fall = { t: 0 }; P.air = 1;
      let body = 0, k = 0; for (; k < 120 * 4 && P.fall; k++) { Math.random = seeded(100 + k); P.inThr = 0; P.inBrk = 0; P.inSteer = 0; const F = P.fall; r.step(DT); if (F.b) body++; } Math.random = orig;
      check('a vehicle with a semi-trailer falls as it always did (no body: the old fall, over within 2 s), beside a known ground too', !!P.tl && !body && !P.fall && k * DT < 2, `${C.MODELS[old[0]].id}: ${body ? 'a body' : 'the old fall'}, ${(k * DT).toFixed(2)} s`); }
    else console.log('     (no vehicle with a semi-trailer in this tree)'); }
  // a race beside the made-up slope with no one over the edge: the track's floor changes nothing for a car on the road
  { const run = (floor) => { const W = make(45, 30, 200), T = W.T; if (!floor) { T.floor = null; } Math.random = seeded(9); const r = new C.Race(T, opts({ numAI: 5, playerGrid: 3, tt: false })); r.start(); const L = [];
      for (let k = 0; k < 120 * 20; k++) { Math.random = seeded(300 + k); const P = r.player; P.inThr = 1; P.inBrk = 0; P.inSteer = 0; if (k < 360 || k % 3 === 0) { /* (the player flat out along the start straight; then every step the same) */ } r.step(DT); if (k % 60 === 59) L.push(r.cars.map(c => stateLine ? stateLine(c) : [c.x, c.z, c.h, c.vx, c.vz, c.w, c.dist].join(',')).join('|')); }
      Math.random = orig; return { L, fell: r.cars.some(c => c.falls) }; };
    const a = run(true), b = run(false);
    check('on the road nothing changes: six cars racing 20 s beside the slope, no one over the edge: every car\'s state the same to the last digit with the floor and without it',
      !a.fell && !b.fell && a.L.length === b.L.length && a.L.every((l, k) => l === b.L[k]), `${a.L.length} samples of 6 cars`); }
}

// 2. the tracks: the body only where the ground beyond the edge is known (def.floor): Killar and no other track of the game
{
  const withFloor = C.TRACKS.filter(d => d.floor).map(d => d.id);
  check('the tracks: only Killar has the ground beyond its edge in its file (def.floor); a car falls as a body nowhere else (the user\'s decision of 10. 11. 2026: for now only on Killar)',
    withFloor.every(id => id === 'killar'), withFloor.length ? withFloor.join(', ') : 'no track with a floor in this tree (Killar not in it yet)');
}

// 3. Killar (where the tree has it): driven over its edge on the left at five places, slowly and fast, each fall followed to its end and as the
//    game shows it (1.5 s); at its hairpin and bridge (two legs of the road one over the other), on both sides, the game's fall
{
  const def = C.TRACKS.find(d => d.id === 'killar' && d.floor);
  if (!def) console.log('     (Killar is not in this tree: its falls are not measured here)');
  else {
    const T = new C.Track(def), fo = {}, q = {}; let hint = -1, sg = -1;   // (sg: the side the car goes over, -1 the left)
    const at = (x, z) => { T.queryRoute(x, z, hint, q); hint = q.i; return q; };
    // (the test's own measure on Killar: under the drawn ground, along its normal, where the point is more than 0.5 m beyond the edge's line and the floor has a cell)
    const line = (x, z) => { const Q = at(x, z); return sg < 0 ? -Q.d - Q.bl : Q.d - Q.br; };
    const depth = (x, y, z) => { if (line(x, z) < 0.5 || !T.floorAt(x, z, fo)) return 0; return y < fo.h ? (fo.h - y) / Math.hypot(fo.gx, 1, fo.gz) : 0; };
    const drive = (m, kmh, deg, game, side, edge) => {
      Math.random = seeded(3); sg = side || -1; hint = -1;
      const r = new C.Race(T, opts({ fallCap: game ? 0 : LONG })), P = r.player; r.start();
      const v = kmh / 3.6, a = deg * Math.PI / 180, i = T.idx(T.startS + m), ins = edge ? 0.02 : 1.975 * Math.sin(a) + 0.9 * Math.cos(a) + 0.15, h = T.hd[i] + sg * a, o = sg * ((sg < 0 ? T.bl[i] : T.br[i]) - ins);
      P.place(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, h); P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v; P.y = P.py = T.hy[i]; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s;
      let k = 0, vo = 0; const Q0 = {}; if (edge) { P.fall = { t: 0, raw: 1 }; P.air = 1; }   // (edge: its middle 2 cm inside the line, the fall begun by hand)
      for (; k < 120 * 12 && !P.fall; k++) { Math.random = seeded(100 + k); const sp = Math.hypot(P.vx, P.vz); P.inThr = sp < v ? 0.7 : 0; P.inBrk = sp > v * 1.03 ? 0.4 : 0; P.inSteer = 0;
        T.query(P.x, P.z, P.q.i, Q0); vo = sg * (P.vx * Q0.nx + P.vz * Q0.nz) / (Math.hypot(Q0.nx, Q0.nz) || 1); r.step(DT); }
      if (!P.fall) { Math.random = orig; return null; }
      T.query(P.x, P.z, P.q.i, Q0); const gr = T.hasElev ? T.elevAt(Q0.s, {}).grade : 0, tl = Math.hypot(Q0.tx, Q0.tz) || 1;
      const R = follow(r, P, depth, line); Math.random = orig; R.vo = vo; R.P = P; R.r = r; R.gr = gr; R.upT = R.up0 ? (R.up0[0] * Q0.tx + R.up0[2] * Q0.tz) / tl : NaN; return R;
    };
    const M = [300, 524, 1279, 2500, 3900], R = M.flatMap(m => [drive(m, 29, 17), drive(m, 90, 20)]), ok = R.filter(Boolean);
    const lab = (k) => `${M[k >> 1]} m ${k & 1 ? 'fast' : 'slow'}`;
    check('Killar: over the edge at 0.3, 0.52, 1.28, 2.5 and 3.9 km, at 29 km/h and at 90 km/h, the car falls as a body every time', ok.length === R.length && ok.every(x => x.B && x.fin), `${ok.length} of ${R.length} falls`);
    check('Killar: the body starts standing on the road as it slopes there (after its first step its own up leans along the road by the road\'s grade, up to 2.2 % at these places: within 0.3 %)',
      ok.every(x => Math.abs(x.upT + x.gr / Math.hypot(1, x.gr)) < 0.003) && ok.some(x => Math.abs(x.gr) > 0.015), ok.map((x, k) => `${lab(k)}: ${(-x.upT * 100).toFixed(2)} against ${(x.gr * 100).toFixed(2)} %`).join('; '));
    check('Killar: no point of the car ever more than 5 cm under the ground drawn below the edge (def.floor), and no energy gained (never more than 0.15 m of height above the least it has had)',
      ok.every(x => x.pen <= 0.05 && x.eRise < 0.15), ok.map((x, k) => `${lab(k)}: ${(x.pen * 100).toFixed(1)} cm, +${x.eRise.toFixed(2)} m`).join('; '));
    check('Killar: followed for up to 8 s every fall ends (at rest, where the known ground ends, or after the 8 s), the car back on the road within 3 m of where it went over, one fall counted, its place on the road untouched all the fall',
      ok.every(x => x.end >= 1 && x.end <= 3 && x.t <= LONG + 0.02 && x.free && Math.abs(x.back) < 3 && x.falls === 1 && x.frozen && !x.air), ok.map((x, k) => `${lab(k)}: end ${x.end} after ${x.t.toFixed(2)} s, ${x.drop.toFixed(0)} m down`).join('; '));
    check('Killar: the falls are falls: the slow ones go over the edge no faster than they drove (no push across it), most of them tumble past their side and are knocked on the slope, none is damaged by more than 0.6',
      ok.every((x, k) => k & 1 || x.vo1 < x.vo + 0.3) && ok.filter(x => x.minUp < 0).length >= 6 && ok.filter(x => x.hits >= 1).length >= 7 && ok.every(x => x.dmg <= 0.6 + 1e-9), ok.map((x, k) => `${lab(k)}: ${x.vo.toFixed(1)} -> ${x.vo1.toFixed(1)} m/s across, up ${x.minUp.toFixed(2)}, ${x.hits} knocks, +${x.dmg.toFixed(2)}`).join('; '));
    // the same falls as the game shows them: 1.5 s of the body, then back on the road
    const Rg = M.flatMap(m => [drive(m, 29, 17, 1), drive(m, 90, 20, 1)]), og = Rg.filter(Boolean);
    check('Killar, the game\'s fall: the same ten falls end after 1.5 s at the latest, the long fall\'s own beginning (the body\'s state after 1.34 s the same to the last digit); the car back on the road within 3 m of where it went over, on its wheels, one fall counted, damaged by 0.32 to 0.6; never more than 5 cm in the ground, no energy gained, no move without speed (0.1 m), the car its body every step',
      og.length === Rg.length && ok.length === R.length && og.every((x, k) => x.B && x.fin && x.end >= 1 && x.t <= CAP + 0.02 && x.free && !x.air && x.falls === 1 && Math.abs(x.back) < 3 && x.frozen && x.mirror && x.pen <= 0.05 && x.eRise < 0.15 && x.tp < 0.1 && x.dmg >= 0.32 - 1e-9 && x.dmg <= 0.6 + 1e-9 && (!x.snap || x.snap === ok[k].snap)) && og.filter(x => x.snap).length >= 8,
      og.map((x, k) => `${lab(k)}: end ${x.end} after ${x.t.toFixed(2)} s, ${x.drop.toFixed(1)} m down, up ${x.tilt1.toFixed(2)}, +${x.dmg.toFixed(2)}${!x.snap || x.snap === ok[k].snap ? '' : ', NOT the long fall\'s beginning'}`).join('; '));
    // where the known ground ends (30 m beyond the edge): a body whose points come back over it from where none is known is not let sink into it
    { const E = [drive(482, 130, 30), drive(565.9, 5, 30)], oe = E.filter(Boolean);
      check('Killar, where the known ground ends (0.48 km at 130 km/h, 0.57 km at 5 km/h, followed to the end): the fall ends there (no ground known), no point of the car more than 5 cm in the ground on the way, no energy gained, no move without speed',
        oe.length === 2 && oe.every(x => x.B && x.fin && x.end === 2 && x.free && x.pen <= 0.05 && x.eRise < 0.15 && x.tp < 0.15), oe.map(x => `end ${x.end} after ${x.t.toFixed(2)} s, ${x.drop.toFixed(0)} m down, ${(x.pen * 100).toFixed(1)} cm, +${x.eRise.toFixed(3)} m, ${(x.tp * 100).toFixed(1)} cm`).join('; ')); }
    // the hairpin and the bridge (4.03-4.06 km: the road's two legs side by side and one over the other), over both sides
    const X = [[4036, -1], [4048, -1], [4060, -1], [4041.6, 1], [4049.6, 1]], Rx = X.flatMap(([m, sd]) => [drive(m, 29, 17, 1, sd), drive(m, 90, 20, 1, sd), drive(m, 50, 80, 1, sd)]).concat([drive(4048, 50, 5, 0, -1, 1), drive(4042, 50, 5, 0, -1, 1)]), ox = Rx.filter(Boolean);   // (the last two: begun at the line, along it, and followed to their end)
    check('Killar, the hairpin and the bridge (4.04-4.06 km, over the left and the right side at 29, 90 and 50 km/h, the game\'s fall; and two begun at the line at 50 km/h along it, followed to their end): a body every time, never moved more than 0.15 m in a step without the speed for it (not pushed across the road\'s edge or up through it), no energy gained, the game\'s over within 1.5 s and the car back within 3 m of where it went over',
      ox.length >= 12 && ox.every(x => x.B && x.fin && x.end >= 1 && x.t <= (x.r.opts.fallCap || CAP) + 0.02 && x.free && !x.air && x.falls === 1 && Math.abs(x.back) < 3 && x.mirror && x.eRise < 0.15 && x.tp < 0.15),
      `${ox.length} of ${Rx.length} went over; the most moved without speed ${(Math.max(...ox.map(x => x.tp)) * 100).toFixed(1)} cm, energy +${Math.max(...ox.map(x => x.eRise)).toFixed(3)} m at the most; ends at rest ${ox.filter(x => x.end === 1).length}, no ground ${ox.filter(x => x.end === 2).length}, the longest fall ${ox.filter(x => x.end === 3).length}`);
  }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
