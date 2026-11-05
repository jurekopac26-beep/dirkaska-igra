// The endless drive in the traffic (docs/neskoncna-voznja.md), no browser: js/core.js's Endless (race.en, opts.endless) and the traffic's
// window round the player (Traffic._winStep): the pool and the window, the density by the distance, new vehicles out of sight, the points
// for the speed (double in the oncoming lane), the close passes and the combo, a touch and the end, on again from the road's start, the
// quick entry; a run repeatable bit for bit. On Vršič, Chapman's Peak (driving on the left) and Irohazaka (one-way).
//   node tests/neskoncna.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');
const C = loadCore(), EN = C.EN;

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const f1 = (x) => (Math.round(x * 10) / 10).toString();

const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const mk = (id, o) => new C.Race(track(id), Object.assign({ numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', seed: 3, playerModel: C.MODELS[4], assist: 2, traffic: true, endless: true, flying: 3, fuel: false }, o));
const sp = (tf, dir) => dir > 0 ? (tf.ow ? 200 : 290) : 250;
const want = (tf, dir) => Math.round(tf.win.dens * EN.ahead / sp(tf, dir));
// the player's car at s, d across the road, at kmh along it (a gear to fit), the drive's own measure from there
const putP = (r, s, d, kmh) => {
  const T = r.track, P = r.player, i = T.idx(s), x = T.px[i] + T.nx[i] * d, z = T.pz[i] + T.nz[i] * d, v = kmh / 3.6;
  P.place(x, z, T.hd[i]); if (T.hasElev) { P.y = P.py = T.hy[i]; P.roadY = P.y; }
  P.vx = Math.cos(P.h) * v; P.vz = Math.sin(P.h) * v;
  let g = 1; while (g < P.m.gears.length && v / P.m.rw * P.m.gears[g - 1] * P.m.final * 9.5493 > P.m.redline * 0.8) g++; P.gear = g;
  P.q = T.query(x, z, i, P.q); P.sPrev = P.q.s; P.dist = P.q.s - T.startS;
  if (r.en) { r.en.sPrev = P.q.s; r.en.back = 0; }
  return P;
};
// a straight stretch (no bend sharper than 250 m of radius from 40 m before to 80 m past)
const straight = (T, from) => { for (let s = from; s < T.finishS - 400; s += 10) { let ok = true; for (let u = -40; u <= 80; u += 2) if (Math.abs(T.k[T.idx(s + u)]) > 0.004) { ok = false; break; } if (ok) return s; } return -1; };
// a drive by the autopilot with the vehicles' contacts off and its knocks on the walls let go, put back on the road when stuck (the
// window's work, not the autopilot's driving); Math.random seeded (the autopilot's own choices: the run repeatable)
const ghost = (r, secs, each) => {
  const P = r.player, E = r.en, st = E.step.bind(E), rnd = Math.random; let t = 0;
  E.step = (dt) => { P.hitWall = 0; st(dt); }; Math.random = seeded(11);
  try { while (t < secs && !r.en.over) { for (const v of r.tf.veh) v.nc = 1e9; C.aiControl(P, r, DT); r.step(DT); t += DT; for (const c of r.cars) { c.hitWall = 0; c.hitCar = 0; } if (P.stuckT > 3) r.rescue(P); if (each) each(t); } }
  finally { Math.random = rnd; E.step = st; }
  return t;
};

// 1. the set-up: the pool, the window at the start, no bicycles and nobody on foot, no checkpoints, the road's own mix
for (const id of ['vrsic', 'chapman', 'iroha']) {
  const r = mk(id), tf = r.tf, E = r.en, P = r.player, T = r.track, ways = tf.ow ? [1] : [1, -1];
  const pool = ways.every(dir => tf.veh.filter(v => v.dir === dir).length === Math.ceil(EN.densMax * EN.ahead / sp(tf, dir)) + 4);
  const on = tf.veh.filter(v => !v.off), ps = P.q.s;
  check(`${id}: race.en and the window (race.tf.win); the pool: enough for the densest window, each way`, !!E && !!tf.win && pool, tf.veh.length + ' vehicles');
  check(`${id}: no bicycles, nobody on foot or at a stop`, !tf.veh.some(v => v.kind === 4) && tf.ped.length === 0 && tf.grp.length === 0);
  check(`${id}: at the start, every way's window full (${ways.map(d => want(tf, d)).join(' / ')}) and every vehicle ${EN.reset} m or more ahead`,
    ways.every((dir, k) => tf.win.n[k] === want(tf, dir)) && on.every(v => v.s >= ps + EN.reset - 1e-6), tf.win.n.join(' / ') + ', the nearest ' + f1(Math.min(...on.map(v => v.s - ps))) + ' m');
  check(`${id}: no checkpoints (no split times), no finish`, P.cp === T.cpS.length);
  if (id === 'chapman') { const M = T.def.traffic.mix, mt = tf.veh.filter(v => v.kind === 2 && v.p === 2).length / tf.veh.length; check('chapman: the road\'s own mix (its buses)', mt > 0 && Math.abs(mt - M[2]) < 0.12, f1(mt * 100) + ' % buses'); }
}
{
  const r = mk('vrsic', { traffic: false }), r2 = mk('vrsic', { endless: false }), r3 = new C.Race(track('bathurst'), { numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', seed: 3, playerModel: C.MODELS[4], endless: true });
  check('opts.endless: its traffic with it; the duel (opts.endless off): the whole road\'s traffic; a circuit: none', !!r.en && !!r.tf && !!r.tf.win && !r2.en && !!r2.tf && !r2.tf.win && !r3.en && !r3.tf);
}

// 2. a long drive (the contacts off): new vehicles only out of sight (300 m along the road, 260 m in a straight line), the window as full
// as the density asks, the density by the distance, the speed's points, on again from the start (Chapman's Peak: 5 km), no finish
for (const [id, secs] of [['vrsic', 700], ['chapman', 300], ['iroha', 200]]) {
  const r = mk(id), tf = r.tf, W = tf.win, E = r.en, P = r.player, T = r.track;
  const place = tf._winPlace.bind(tf), fill = tf._winFill.bind(tf); let filling = false, nPl = 0, near = [];
  tf._winPlace = (v, s) => { if (!filling) { nPl++; const i = T.idx(s), e = Math.hypot(T.px[i] - P.x, T.pz[i] - P.z); if (s - W.ps < EN.spawn - 1e-6 || e <= EN.spawnR) near.push(f1(s - W.ps) + '/' + f1(e)); } place(v, s); };
  tf._winFill = (a, b) => { filling = true; fill(a, b); filling = false; };
  r.start();
  let full = 0, samples = 0, dens = true, mono = true, sc = 0, dEv = 0, seen = 0, stages = 0, sAfter = -1;
  ghost(r, secs, (t) => {
    if (E.score < sc - 1e-6) mono = false; sc = E.score;
    if (Math.abs(W.dens - Math.min(EN.densMax, 1 + EN.densKm * E.dist / 1000)) > 1e-9) dens = false;
    for (const e of E.log) if (e.n > seen) { seen = e.n; if (e.k === 'dens') dEv++; if (e.k === 'stage') { stages++; sAfter = P.q.s; } }
    if (t > 30 && P.q.s < T.finishS - EN.ahead) { samples++; if ([1, -1].every((dir, k) => (tf.ow && dir < 0) || W.n[k] >= want(tf, dir) - 1)) full++; }
  });
  const dn = Math.min(EN.densMax, 1 + EN.densKm * E.dist / 1000);
  check(`${id}: ${nPl} new vehicles in ${secs} s, every one out of sight`, nPl > 20 && !near.length, near.slice(0, 5).join(', '));
  check(`${id}: the window full (at most one short) most of the time`, samples > 0 && full / samples > (id === 'iroha' ? 0.7 : 0.9), f1(100 * full / Math.max(1, samples)) + ' %');
  check(`${id}: the density 1 + ${EN.densKm} a km (x${f1(dn)} after ${f1(E.dist / 1000)} km), at most x${EN.densMax}; a step every half`, dens && dEv === Math.floor(dn * 2 + 1e-9) - 2, dEv + ' steps');
  check(`${id}: the score only grows, = the speed's points + the close passes'`, mono && E.score > 1000 && Math.abs(E.score - E.spd - E.bonus) < 1e-6, f1(E.score) + ' = ' + f1(E.spd) + ' + ' + E.bonus);
  check(`${id}: no end, no finish`, !E.over && !P.finished && r.state === 'racing', E.over ? E.over.why : '');
  if (id === 'chapman') check('chapman: on again from the start at the end of the road (stage 2), past the line', stages === 1 && E.stage === 2 && sAfter >= T.startS - 1 && sAfter < T.startS + 20, 'stages ' + stages + ', from ' + f1(sAfter - T.startS) + ' m');
  if (id === 'vrsic') check('vrsic: the density x4 at the most (15 km on)', E.dist > 15000 && W.dens === EN.densMax, f1(E.dist / 1000) + ' km');
}

// 3. the close passes (the player still, a vehicle past it): an oncoming car at 0.4, 0.8 and 1.4 m, the combo; too slow; overtaking
{
  const r = mk('vrsic', { flying: 0 }), tf = r.tf, E = r.en, T = r.track, sd = tf.sd, s0 = straight(T, T.startS + 400);
  const P = putP(r, s0, sd * T.wS(s0) * 0.45, 100), hw = P.m.wid / 2;
  const pass = (dir, gap, kmh, vo, touch) => {
    for (const v of tf.veh) v.off = true;
    const o = tf.veh.find(v => v.dir === dir && v.kind === 0); tf._winPlace(o, P.q.s + 20); o.v = vo / 3.6;
    o.d = P.q.d + (dir < 0 ? -sd : sd) * (gap + o.wid / 2 + hw); const ev = E.ev;
    for (let r0 = 20; r0 >= -20; r0 -= 0.25) { o.s = P.q.s + r0; tf._pose(o, 0); E._passes(kmh / 3.6, !!touch && Math.abs(r0) < 2); }
    return E.log.filter(e => e.n > ev);
  };
  if (s0 < 0) check('vrsic: a straight for the close passes', false);
  else {
    const a = pass(-1, 0.4, 100, 70), b = pass(-1, 0.8, 100, 70), c = pass(-1, 1.4, 100, 70);
    check('0.4 m from an oncoming car at 100 km/h: ZELO TESNO, 500 points', a.length === 1 && a[0].k === 'vnear' && a[0].pts === 500 && Math.abs(a[0].gap - 0.4) < 0.03, JSON.stringify(a));
    check('0.8 m next: TESNO, 200 x the combo x2', b.length === 1 && b[0].k === 'near' && b[0].pts === 400 && b[0].combo === 2, JSON.stringify(b));
    check('1.4 m: nothing (the combo kept)', c.length === 0 && E.combo === 2 && E.vnear === 1 && E.near === 1 && E.bonus === 900);
    for (let k = 0; k < 4; k++) pass(-1, 0.8, 100, 70);
    check(`the combo at most x${EN.comboMax}`, E.combo === EN.comboMax && E.log[E.log.length - 1].pts === 200 * EN.comboMax);
    const sl = pass(-1, 0.4, 60, 70), tch = pass(-1, 0.4, 100, 70, true);
    check('at 60 km/h (under 70): nothing; touching it: nothing', sl.length === 0 && tch.length === 0);
    const ov = pass(1, 0.6, 100, 40), ov2 = pass(1, 0.6, 100, 90);
    check('overtaking one going the same way: 60 km/h faster, a close pass; 10 km/h faster, nothing', ov.length === 1 && ov[0].k === 'near' && ov2.length === 0, JSON.stringify(ov.concat(ov2)));
  }
}

// 4. a touch breaks the combo; the end: a crash into a vehicle, the wall, rolling over, falling, two wheels gone
{
  const r = mk('vrsic', { flying: 0 }), tf = r.tf, E = r.en, T = r.track, sd = tf.sd, s0 = straight(T, T.startS + 400);
  r.start(); const P = putP(r, s0, sd * T.wS(s0) * 0.45, 100); tf._winFill(EN.spawn, 0);
  E.combo = 3; E.comboT = 4; P.hitCar = 1.0; r.step(DT);
  const tap = E.log[E.log.length - 1];
  check('a touch of a vehicle (1 m/s): the combo gone, the drive on', E.combo === 0 && !E.over && tap.k === 'tap');
  P.hitCar = 0; E.combo = 2; E.comboT = 4; P.hitWall = 1.0; r.step(DT);
  check('the wall brushed (1 m/s): nothing', E.combo === 2 && !E.over);
  P.hitWall = 7; r.step(DT);
  check('the wall at 7 m/s: the end (wall)', !!E.over && E.over.why === 'wall' && E.log[E.log.length - 1].k === 'over');
  const sc = E.score; r.step(DT);
  check('after the end: no more points', E.score === sc);
  for (const [k, set] of [['roll', (P) => { P.rl = {}; }], ['fall', (P) => { P.fall = {}; }], ['wheels', (P) => { P.wreck = { nL: 2 }; }]]) {
    const q = mk('vrsic', { flying: 0 }); q.start(); const Q = putP(q, s0, sd * q.track.wS(s0) * 0.45, 100); set(Q); q.en.step(DT);
    check(`${k}: the end`, !!q.en.over && q.en.over.why === k);
  }
  // into a car standing in the player's lane, at 100 km/h, flat out and straight on
  const q = mk('vrsic', { flying: 0 }); q.start();
  const Q = putP(q, s0, sd * q.track.wS(s0) * 0.45, 100); q.tf._winFill(EN.spawn, 0);
  const o = q.tf.veh.find(v => v.off && v.dir > 0 && v.kind === 0); q.tf._winPlace(o, Q.q.s + 30); o.d = o.dT = Q.q.d; o.v0 = 0.01; o.v = 0; q.tf._pose(o, 0);
  let t = 0; while (t < 4 && !q.en.over) { Q.inThr = 1; Q.inBrk = 0; Q.inSteer = 0; q.step(DT); t += DT; for (const c of q.cars) { c.hitWall = 0; c.hitCar = 0; } }
  check('into a car standing in the lane: the end (crash)', !!q.en.over && q.en.over.why === 'crash', q.en.over ? q.en.over.why + ' at ' + f1(t) + ' s' : 'none');
}

// 5. the speed's points: double in the oncoming lane; none for the same stretch again (back and forth)
{
  const run = (side, back) => {
    const r = mk('vrsic', { flying: 0 }), T = r.track, s0 = straight(T, T.startS + 400); r.start();
    const P = putP(r, s0, side * r.tf.sd * T.wS(s0) * 0.45, 110); r.tf._winFill(EN.spawn, 0);
    let t = 0; while (t < 1.5) { P.inThr = 0.6; P.inBrk = 0; P.inSteer = 0; for (const v of r.tf.veh) v.nc = 1e9; r.step(DT); t += DT; }
    if (back) { const s1 = P.q.s; putP(r, s0, side * r.tf.sd * T.wS(s0) * 0.45, 110); r.en.sPrev = s1; r.en.back = 0; const p = r.en.spd; r.step(DT); return [p, r.en.spd]; }
    return [r.en.spd, r.en.opp];
  };
  const own = run(1), opp = run(-1), back = run(1, true);
  check('the oncoming lane: double the speed\'s points', own[0] > 50 && Math.abs(opp[0] / own[0] - 2) < 0.08 && own[1] === 0 && opp[1] > 30, f1(own[0]) + ' / ' + f1(opp[0]));
  check('back over road already driven: no points', back[1] === back[0], f1(back[0]) + ' -> ' + f1(back[1]));
}

// 6. on again from the start: the speed, the heading to the road, the combo and the score kept; the window full again
{
  const r = mk('chapman', { flying: 0 }), tf = r.tf, E = r.en, T = r.track; r.start();
  const P = putP(r, T.finishS - EN.wrapEnd - 15, tf.sd * T.wS(T.finishS - 80) * 0.4, 90); tf._winFill(EN.spawn, 0);
  E.combo = 2; E.comboT = 4.5; E.score = 1234; let t = 0, b = null, a = null;
  const rel = () => { const i = P.q.i; return Math.atan2(Math.sin(P.h - T.hd[i]), Math.cos(P.h - T.hd[i])); }, wr = E._wrap.bind(E);
  E._wrap = () => { b = [P.speed, rel(), P.q.d]; wr(); a = [P.speed, rel(), P.q.d]; };
  while (t < 2 && E.stage === 1) { P.inThr = 0.5; P.inBrk = 0; P.inSteer = 0; r.step(DT); t += DT; }
  check('chapman: at the end of the road, on again from the start line (stage 2)', E.stage === 2 && !!a && Math.abs(P.q.s - T.startS - EN.wrapTo) < 3 && E.log[E.log.length - 1].k === 'stage', f1(P.q.s - T.startS) + ' m past the line');
  check('the speed, the angle to the road and the place across it kept; the combo and the score too', !!a && Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 0.02 && Math.abs(a[2] - b[2]) < 0.05 && E.combo === 2 && E.score >= 1234,
    a ? f1(b[0] * 3.6) + ' -> ' + f1(a[0] * 3.6) + ' km/h, ' + f1(b[1] * 57.3) + '° -> ' + f1(a[1] * 57.3) + '°, ' + f1(b[2]) + ' -> ' + f1(a[2]) + ' m' : '');
  check('the window full again, every vehicle ahead', tf.win.n[0] === want(tf, 1) && tf.win.n[1] === want(tf, -1) && tf.veh.filter(v => !v.off).every(v => v.s > P.q.s));
  for (let k = 0; k < 120; k++) { P.inThr = 0.5; P.inBrk = 0; P.inSteer = 0; r.step(DT); }
  check('on the road, no fall, no finish', !P.fall && !P.finished && !E.over && P.q.s > T.startS);
}

// 7. the quick entry: ?proga=<id>&nacin=neskoncno (or endless) on a real road with traffic, not elsewhere
{
  const Q = C.quickArgs;
  check('quick entry: nacin=neskoncno / endless on Vršič', Q('?proga=vrsic&nacin=neskoncno').mode === 'endless' && Q('?proga=vrsic&nacin=endless').mode === 'endless');
  check('quick entry: not on a circuit (Bathurst)', Q('?proga=bathurst&nacin=neskoncno').mode === null);
}

// 8. a run repeatable bit for bit
{
  const go = () => { const r = mk('vrsic'); r.start(); ghost(r, 90); return [r.en.score, r.en.dist, r.player.x, r.player.z].concat(r.tf.veh.map(v => v.off ? -1 : v.s)).join(','); };
  check('the same run twice: the same, bit for bit', go() === go());
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
