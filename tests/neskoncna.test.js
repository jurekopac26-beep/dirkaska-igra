// The endless drive in the traffic (docs/neskoncna-voznja.md, »Predelava na krožne proge«), no browser: js/core.js's Endless (race.en,
// opts.endless) on a circuit (Core.EN.tracks: Bathurst) and the traffic's window round the player (Traffic._winStep): one way round the
// loop, the lanes by the road's width, the vehicles' lane changes and sudden brakings, new ones out of sight, across the line without a
// jump; the clock (its start and its run by the level, the seconds a close pass adds, its cap, the end when empty), the density by the
// time, the end at a touch of a vehicle, the points; the mode's tracks, options and top 10 (js/neskoncna.js); the quick entry; a run
// repeatable bit for bit.
//   node tests/neskoncna.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');
const C = loadCore(), EN = C.EN;

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const f1 = (x) => (Math.round(x * 10) / 10).toString();

const ID = 'bathurst';
const def = (id) => C.TRACKS.find(d => d.id === id);
const track = (id) => new C.Track(def(id));
const mk = (o) => new C.Race(track(ID), Object.assign({ numAI: 0, playerGrid: 1, laps: 999, phys: 'cs', seed: 3, playerModel: C.MODELS[4], assist: 2, endless: true, flying: 3, fuel: false, difficulty: 1 }, o));
const want = (tf) => Math.round(tf.win.dens * EN.ahead / EN.sp);
// the player's car at s, d across the road, at kmh along it (a gear to fit), the drive's own measure from there
const putP = (r, s, d, kmh) => {
  const T = r.track, P = r.player, i = T.idx(s), x = T.px[i] + T.nx[i] * d, z = T.pz[i] + T.nz[i] * d, v = kmh / 3.6;
  P.place(x, z, T.hd[i]); if (T.hasElev) { P.y = P.py = T.hy[i]; P.roadY = P.y; }
  P.vx = Math.cos(P.h) * v; P.vz = Math.sin(P.h) * v;
  let g = 1; while (g < P.m.gears.length && v / P.m.rw * P.m.gears[g - 1] * P.m.final * 9.5493 > P.m.redline * 0.8) g++; P.gear = g;
  P.q = T.query(x, z, i, P.q); P.sPrev = P.q.s; P.dist = P.q.s - T.startS;
  if (r.en) { r.en.dPrev = P.dist; r.en.back = 0; }
  if (r.tf && r.tf.win) r.tf.win.ps = T.startS + P.dist;
  return P;
};
// a straight stretch of the lap (no bend sharper than 250 m of radius from 40 m before to 80 m past)
const straight = (T, from) => { for (let s = from; s < from + T.len; s += 10) { let ok = true; for (let u = -40; u <= 80; u += 2) if (Math.abs(T.k[T.idx(s + u)]) > 0.004) { ok = false; break; } if (ok) return s; } return -1; };
// a drive by the autopilot with the vehicles' contacts off and its knocks on the walls let go, put back on the road when stuck, the clock
// kept from running out (the window's and the traffic's work, not the autopilot's driving); Math.random seeded (the autopilot's own
// choices: the run repeatable)
const ghost = (r, secs, each) => {
  const P = r.player, E = r.en, st = E.step.bind(E), rnd = Math.random; let t = 0;
  E.step = (dt) => { P.hitWall = 0; if (E.clock < 10) E.clock = 10; st(dt); }; Math.random = seeded(11);
  try { while (t < secs && !r.en.over) { for (const v of r.tf.veh) v.nc = 1e9; C.aiControl(P, r, DT); r.step(DT); t += DT; for (const c of r.cars) { c.hitWall = 0; c.hitCar = 0; } if (P.stuckT > 3) r.rescue(P); if (each) each(t); } }
  finally { Math.random = rnd; E.step = st; }
  return t;
};

// 1. the set-up: on Bathurst only with opts.endless; the pool, one way, the window at the start, the lanes, the clock and the density by
// the level
{
  const r = mk(), tf = r.tf, E = r.en, P = r.player, T = r.track, W = tf && tf.win;
  check('bathurst: race.en and the window (race.tf.win), the traffic on the loop (tf.loop), one way', !!E && !!W && tf.loop && tf.ow && tf.veh.every(v => v.dir === 1));
  check(`the pool: enough for the densest window (${Math.ceil(EN.densMax * EN.ahead / EN.sp) + 4}), no bicycles, nobody on foot or at a stop`,
    tf.veh.length === Math.ceil(EN.densMax * EN.ahead / EN.sp) + 4 && !tf.veh.some(v => v.kind === 4) && tf.ped.length === 0 && tf.grp.length === 0, tf.veh.length + ' vehicles');
  const on = tf.veh.filter(v => !v.off), ps = T.startS + P.dist;
  check(`at the start: the window full (${want(tf)} at x${EN.dens0[1]}), every vehicle ${EN.reset} m or more ahead`, W.n[0] === want(tf) && on.length === want(tf) && on.every(v => v.s >= ps + EN.reset - 1e-6),
    W.n[0] + ', the nearest ' + f1(Math.min(...on.map(v => v.s - ps))) + ' m');
  const lanes = on.map(v => v.lane), sd = tf.sd;
  check('Bathurst keeps left (def.leftHand): lane 0 on the left, two lanes (5.5 m to the edge), a bus or a truck in lane 0 only',
    T.def.leftHand === true && sd === -1 && lanes.every(l => l === 0 || l === 1) && on.every(v => tf._nl(v.s) === 2 && Math.sign(tf._laneD(v.s, v.lane, v.p)) === (v.lane === 0 ? sd : -sd) && (v.kind !== 2 || v.lane === 0)),
    'lanes ' + lanes.join(''));
  const lv = [0, 1, 2, 3].map(k => mk({ difficulty: k })), odd = [mk({ difficulty: 7 }), mk({ difficulty: undefined })];
  check(`the levels: the clock at the start ${EN.clock.join(' / ')} s, the density x${EN.dens0.join(' / x')}`, lv.every((q, k) => q.en.lv === k && q.en.clock === EN.clock[k] && q.tf.win.dens === EN.dens0[k] && q.tf.win.n[0] === want(q.tf)) && odd[0].en.lv === 3 && odd[1].en.lv === 1,
    lv.map(q => q.en.clock + ' s x' + q.tf.win.dens + ' (' + q.tf.win.n[0] + ')').join(', '));
}
{
  const r = new C.Race(track(ID), { numAI: 0, playerGrid: 1, laps: 2, phys: 'cs', seed: 3, playerModel: C.MODELS[4], traffic: true });
  const o = new C.Race(track('vrsic'), { numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', seed: 3, playerModel: C.MODELS[4], traffic: true, endless: true });
  const np = new C.Race(track(ID), { numAI: 3, noPlayer: true, laps: 2, phys: 'cs', seed: 3, endless: true });
  check('without opts.endless, Bathurst: no traffic; an open road (Vršič) with opts.endless: its own traffic, no endless drive; no player (the menu\'s demo): none', !r.tf && !r.en && !!o.tf && !o.tf.loop && !o.en && !np.en && !np.tf);
}

// 2. a long drive (the contacts off, the clock kept up): new vehicles only out of sight (300 m along the road, 260 m in a straight line),
// the window as full as the density asks, the density by the time, the traffic over the line with no jump, the lane changes (always after
// indicating) and the sudden brakings, no two vehicles in one another, the speed's points, the laps, no finish
{
  const r = mk(), tf = r.tf, W = tf.win, E = r.en, P = r.player, T = r.track, secs = 260;
  const place = tf._winPlace.bind(tf), fill = tf._winFill.bind(tf); let filling = false, nPl = 0; const near = [], fresh = new Set();
  tf._winPlace = (v, s, l) => { fresh.add(v); if (!filling) { nPl++; const i = T.idx(s), e = Math.hypot(T.px[i] - P.x, T.pz[i] - P.z); if (s - W.ps < EN.spawn - 1e-6 || e <= EN.spawnR) near.push(f1(s - W.ps) + '/' + f1(e)); } place(v, s, l); };
  tf._winFill = (a, b) => { filling = true; fill(a, b); filling = false; };
  r.start();
  let full = 0, samples = 0, dens = true, mono = true, sc = 0, dEv = 0, seen = 0, laps = 0, jumps = 0, crossed = 0, lc = 0, lcNoInd = 0, sb = 0, overl = 0, lane1 = 0, onN = 0, behind = 0;
  const prev = new Map();
  ghost(r, secs, (t) => {
    if (E.score < sc - 1e-6) mono = false; sc = E.score;
    if (Math.abs(W.dens - Math.min(EN.densMax, EN.dens0[1] + EN.densUp[1] * Math.floor(E.time / EN.densT))) > 1e-9) dens = false;
    for (const e of E.log) if (e.n > seen) { seen = e.n; if (e.k === 'dens') dEv++; if (e.k === 'lap') laps++; }
    if (t > 10) { samples++; if (W.n[0] >= want(tf) - 1) full++; }
    const ps = T.startS + P.dist;
    for (const v of tf.veh) {
      if (v.off) { prev.delete(v); continue; }
      if (fresh.has(v)) prev.delete(v);   // (parked and put in again in this step: a new one)
      onN++; if (v.lane === 1) lane1++; if (v.s < ps - EN.behind - 5) behind++;
      const p = prev.get(v);
      if (p) {
        if (Math.hypot(v.x - p.x, v.z - p.z) > 1.5 || Math.abs(v.s - p.s) > 1.5) jumps++;
        if (Math.floor(p.s / T.len) !== Math.floor(v.s / T.len)) crossed++;
        if (p.lane !== v.lane) { lc++; if (!(p.lcW > 0)) lcNoInd++; }
        if (!(p.sb > 0) && v.sb > 0) sb++;
      }
      prev.set(v, { x: v.x, z: v.z, s: v.s, lane: v.lane, lcW: v.lcW, sb: v.sb });
    }
    fresh.clear();
    if (Math.round(t / DT) % 12 === 0) for (const a of tf.veh) if (!a.off && a.st === 0) for (const b of tf.veh) if (b.id > a.id && !b.off && b.st === 0 && Math.abs(a.s - b.s) < (a.len + b.len) / 2 && Math.abs(a.d - b.d) < (a.wid + b.wid) / 2) overl++;
  });
  const dn = Math.min(EN.densMax, EN.dens0[1] + EN.densUp[1] * Math.floor(E.time / EN.densT));
  check(`${nPl} new vehicles in ${secs} s, every one out of sight`, nPl > 30 && !near.length, near.slice(0, 5).join(', '));
  check('the window full (at most one short) most of the time; none kept far behind', samples > 0 && full / samples > 0.9 && behind === 0, f1(100 * full / Math.max(1, samples)) + ' %');
  check(`the density x${EN.dens0[1]} + ${EN.densUp[1]} every ${EN.densT} s, at most x${EN.densMax} (x${dn} after ${f1(E.time)} s), an event a step`, dens && W.dens === EN.densMax && dEv === Math.round((dn - EN.dens0[1]) / EN.densUp[1]), dEv + ' steps');
  check(`the traffic over the line (${crossed} times) with no jump`, crossed > 10 && jumps === 0, jumps + ' jumps');
  check(`lane changes (${lc}, ${f1(100 * lane1 / Math.max(1, onN))} % of the time in lane 1), each after the indicator; sudden brakings (${sb})`, lc > 10 && lcNoInd === 0 && sb > 3 && lane1 > 0, lcNoInd + ' without');
  check('no two vehicles in one another', overl === 0, overl + ' times');
  check('the score only grows, = the speed\'s points + the close passes\'', mono && E.score > 3000 && Math.abs(E.score - E.spd - E.bonus) < 1e-6, f1(E.score) + ' = ' + f1(E.spd) + ' + ' + E.bonus);
  check(`round the loop: lap ${E.lap} done (${f1(E.dist / 1000)} km), an event a lap; no end, no finish`, E.lap >= 1 && laps === E.lap && E.lap === Math.floor(P.dist / T.len) && !E.over && !P.finished && r.state === 'racing', E.over ? E.over.why : '');
}

// 3. the clock: a second a second standing still, slower over vRef (twice it: half as fast); how long a run lasts with no close pass at
// 100 km/h by the level (the medium one about a minute: docs/neskoncna-voznja.md); the warning; empty: the end
{
  const last = (kmh, lv) => {
    const r = mk({ flying: 0, difficulty: lv }), T = r.track, s0 = straight(T, T.startS + 300); r.start();
    putP(r, s0, r.tf.sd * T.wS(s0) * 0.45, kmh); let t = 0;
    while (!r.en.over && t < 400) { r.en.step(0.1); t += 0.1; }
    return [t, r.en];
  };
  const r = mk({ flying: 0 }), E = r.en, T = r.track, s0 = straight(T, T.startS + 300); r.start(); putP(r, s0, r.tf.sd * T.wS(s0) * 0.45, 0);
  for (let k = 0; k < 100; k++) E.step(0.1);
  const c0 = E.clock; putP(r, s0, r.tf.sd * T.wS(s0) * 0.45, 2 * EN.vRef[1]); for (let k = 0; k < 100; k++) E.step(0.1);
  check(`standing: a second a second; at ${2 * EN.vRef[1]} km/h (twice vRef): half as fast`, Math.abs(c0 - (EN.clock[1] - 10)) < 1e-6 && Math.abs(E.clock - (c0 - 5)) < 1e-6, f1(EN.clock[1]) + ' -> ' + f1(c0) + ' -> ' + f1(E.clock));
  const L = [0, 1, 2, 3].map(lv => last(100, lv)), t = L.map(x => x[0]);
  check(`at 100 km/h with no close pass the clock lasts ${t.map(f1).join(' / ')} s by the level (medium about a minute), then the end (time)`,
    t[0] > t[1] && t[1] > t[2] && t[2] > t[3] && Math.abs(t[1] - 60) < 1 && t[3] > 20 && t[0] > 100 && L.every(x => x[1].over && x[1].over.why === 'time' && x[1].clock === 0 && x[1].log.some(e => e.k === 'low') && x[1].log[x[1].log.length - 1].k === 'over'));
  const sc = L[1][1].score; L[1][1].step(0.1);
  check('after the end: no more points, the clock stays empty', L[1][1].score === sc && L[1][1].clock === 0);
}

// 4. the close passes (the player alongside a vehicle going the same way, overtaking it): 0.4, 0.8 and 1.4 m, the combo, the seconds on the
// clock (more with the combo, at most twice the start's); too slow; overtaking too slowly
{
  const r = mk({ flying: 0 }), tf = r.tf, E = r.en, T = r.track, sd = tf.sd, s0 = straight(T, T.startS + 300); r.start();
  const P = putP(r, s0, sd * T.wS(s0) * 0.45, 120), hw = P.m.wid / 2;
  const pass = (gap, kmh, vo, k) => {
    putP(r, s0, sd * T.wS(s0) * 0.45, kmh); const ps = T.startS + P.dist;
    for (const v of tf.veh) v.off = true;
    const o = tf.veh.find(v => v.kind === (k || 0)); tf._winPlace(o, ps + 20, 1); o.v = vo / 3.6;
    o.d = P.q.d - sd * (gap + o.wid / 2 + hw); const ev = E.ev;
    for (let r0 = 20; r0 >= -20; r0 -= 0.25) { o.s = ps + r0; tf._pose(o, 0); E._passes(kmh / 3.6); }
    return E.log.filter(e => e.n > ev);
  };
  if (s0 < 0) check('bathurst: a straight for the close passes', false);
  else {
    E.clock = 10;
    const a = pass(0.4, 120, 70), b = pass(0.8, 120, 70), c = pass(1.4, 120, 70);
    check(`0.4 m past one at 120 km/h: ZELO TESNO, 600 points, +${EN.vnearT[1]} s`, a.length === 1 && a[0].k === 'vnear' && a[0].pts === 600 && a[0].add === EN.vnearT[1] && Math.abs(a[0].gap - 0.4) < 0.03, JSON.stringify(a));
    const addB = EN.nearT[1] * (1 + EN.comboAdd);
    check(`0.8 m next: TESNO, 240 x the combo x2, +${addB} s (x${1 + EN.comboAdd} with the combo)`, b.length === 1 && b[0].k === 'near' && b[0].pts === 480 && b[0].combo === 2 && Math.abs(b[0].add - addB) < 1e-9, JSON.stringify(b));
    check('1.4 m: nothing (the combo kept); the clock 10 + both, the seconds added counted', c.length === 0 && E.combo === 2 && E.vnear === 1 && E.near === 1 && E.bonus === 1080 && Math.abs(E.clock - (10 + EN.vnearT[1] + addB)) < 1e-9 && Math.abs(E.add - (EN.vnearT[1] + addB)) < 1e-9, f1(E.clock) + ' s');
    for (let k = 0; k < 4; k++) pass(0.8, 120, 70);
    check(`the combo at most x${EN.comboMax}`, E.combo === EN.comboMax && E.log[E.log.length - 1].pts === 240 * EN.comboMax);
    const cap = EN.clock[1] * EN.clockMax; E.clock = cap - 1; const d = pass(0.4, 120, 70);
    check(`the clock at most ${cap} s (x${EN.clockMax} the start's)`, d.length === 1 && Math.abs(d[0].add - 1) < 1e-9 && Math.abs(E.clock - cap) < 1e-9, f1(E.clock) + ' s');
    const sl = pass(0.4, 60, 30), slow = pass(0.4, 120, 105), bus = pass(0.6, 120, 70, 2);
    check('at 60 km/h (under 70): nothing; only 15 km/h faster than it: nothing; past a bus: TESNO', sl.length === 0 && slow.length === 0 && bus.length === 1 && bus[0].k === 'near', JSON.stringify(sl.concat(slow, bus)));
  }
}

// 5. the end: a touch of a vehicle, a crash into one, the wall (a brush: nothing; a knock: the combo gone; hard: the end), rolling over,
// falling, two wheels gone
{
  const T = track(ID), s0 = straight(T, T.startS + 300);
  const into = (kmh, gapM) => {
    const q = mk({ flying: 0 }); q.start();
    const Q = putP(q, s0, q.tf.sd * q.track.wS(s0) * 0.45, kmh); q.tf._winFill(EN.spawn, 0);
    const o = q.tf.veh.find(v => v.off && v.kind === 0); q.tf._winPlace(o, Q.q.s + gapM, 0); o.d = o.dT = Q.q.d; o.v0 = 0.01; o.v = 0; q.tf._pose(o, 0);
    let t = 0, v = 0; while (t < 6 && !q.en.over) { Q.inThr = kmh < 40 ? 0 : 1; Q.inBrk = 0; Q.inSteer = 0; v = Q.speed; q.step(DT); t += DT; for (const c of q.cars) { c.hitWall = 0; c.hitCar = 0; } }
    return [q.en.over, t, v * 3.6];
  };
  const [a, ta, va] = into(8, 6), [b, tb] = into(100, 40);
  check('a gentle touch of a car standing in the lane (under 10 km/h): the end (touch)', !!a && a.why === 'touch', a ? a.why + ' at ' + f1(ta) + ' s, ' + f1(va) + ' km/h' : 'none');
  check('into it at 100 km/h: the end (crash or touch)', !!b && (b.why === 'crash' || b.why === 'touch'), b ? b.why + ' at ' + f1(tb) + ' s' : 'none');
  const r = mk({ flying: 0 }), E = r.en; r.start(); const P = putP(r, s0, r.tf.sd * T.wS(s0) * 0.45, 100); r.tf._winFill(EN.spawn, 0);
  E.combo = 3; E.comboT = 4; P.hitWall = 1.0; r.step(DT);
  check('the wall brushed (1 m/s): nothing', E.combo === 3 && !E.over);
  P.hitWall = 2.0; r.step(DT);
  check('the wall knocked (2 m/s): the combo gone, the drive on', E.combo === 0 && !E.over && E.log[E.log.length - 1].k === 'tap');
  P.hitWall = 7; r.step(DT);
  check('the wall at 7 m/s: the end (wall)', !!E.over && E.over.why === 'wall' && E.log[E.log.length - 1].k === 'over');
  for (const [k, set] of [['roll', (P) => { P.rl = {}; }], ['fall', (P) => { P.fall = {}; }], ['wheels', (P) => { P.wreck = { nL: 2 }; }]]) {
    const q = mk({ flying: 0 }); q.start(); const Q = putP(q, s0, q.tf.sd * q.track.wS(s0) * 0.45, 100); set(Q); q.en.step(DT);
    check(`${k}: the end`, !!q.en.over && q.en.over.why === k);
  }
}

// 6. the vehicles play fair with the player: no lane change into the player's way (coming up within EN.fair s), no sudden braking with the
// player right behind it; otherwise free
{
  const r = mk({ flying: 0 }), tf = r.tf, T = r.track, sd = tf.sd, s0 = straight(T, T.startS + 300); r.start();
  const at = (gapP, laneP, kmh) => {
    for (const v of tf.veh) v.off = true;
    const P = putP(r, s0, tf._laneD(s0, laneP, 0), kmh), a = tf.veh.find(v => v.kind === 0); tf._winPlace(a, T.startS + P.dist + gapP, 0); a.v = 80 / 3.6;
    tf.cl.length = 0; for (const c of r.cars) tf.cl.push(c);   // (the race cars, as every step has them)
    return a;
  };
  let a = at(30, 1, 150); const lcNear = tf._lcFree(a, 1); a = at(400, 1, 150); const lcFar = tf._lcFree(a, 1);
  a = at(20, 0, 120); const sbNear = tf._sbFree(a); a = at(300, 0, 120); const sbFar = tf._sbFree(a);
  check('a lane change: not with the player 30 m behind in that lane at 150 km/h; with them 400 m behind, yes', !lcNear && lcFar);
  check('a sudden braking: not with the player 20 m behind; 300 m behind, yes', !sbNear && sbFar);
  check('Bathurst\'s lanes: lane 0 on the left (keeping left), lane 1 to its right', sd === -1 && tf._laneD(s0, 0, 0) * sd > 0 && tf._laneD(s0, 1, 0) * sd < 0);
}

// 7. the mode's tracks and options, the top 10 (js/neskoncna.js); the quick entry ?proga=bathurst&nacin=neskoncno (or endless)
{
  global.Core = C;
  const F = require('../js/neskoncna.js');
  const ctx = (id, o) => Object.assign({ md: 'endless', on: false, cr: -1, track: { open: !!def(id).open, def: def(id) } }, o);
  const tracks = C.TRACKS.filter(d => F.modes(d).length).map(d => d.id);
  check('the mode on Bathurst only (Core.EN.tracks): not on the other circuits, the open roads or the test tracks', JSON.stringify(tracks) === JSON.stringify(EN.tracks) && JSON.stringify(EN.tracks) === '["bathurst"]', tracks.join(', '));
  const o = F.opts(ctx(ID));
  check('its options: alone, endless, laps without end, the flying start, no fuel, no flags, no rivals; not online, in the career or on another track',
    !!o && o.numAI === 0 && o.endless === true && o.laps === 999 && o.flying === 3 && o.fuel === false && o.flags === false && o.traffic === false && o.police === false &&
    !F.opts(ctx(ID, { on: true })) && !F.opts(ctx(ID, { cr: 0 })) && !F.opts(ctx(ID, { md: 'race' })) && !F.opts(ctx('spa')) && !F.opts(ctx('vrsic')));
  const B = F.boardOf({ enBoard: [null, 'x', { s: -5 }, { s: 0 }].concat(Array.from({ length: 12 }, (_, k) => ({ s: 1000 + 37 * ((k * 5) % 12), km: 3.2, t: 95, lap: 1, car: 'm' + k, d: 100 + k }))) });
  check(`the top ${F.BOARD}: the best first, nothing else kept`, B.length === F.BOARD && B.every((e, k) => k === 0 || B[k - 1].s >= e.s) && B[0].s === 1000 + 37 * 11 && B.every(e => e.s > 0 && e.lap === 1 && e.km === 3.2), B.map(e => e.s).join(' '));
  const Q = C.quickArgs;
  check('quick entry: nacin=neskoncno / endless on Bathurst; not on an open road (Vršič) or another circuit (Spa)',
    Q('?proga=bathurst&nacin=neskoncno').mode === 'endless' && Q('?proga=bathurst&nacin=endless').mode === 'endless' && Q('?proga=vrsic&nacin=neskoncno').mode === null && Q('?proga=spa&nacin=neskoncno').mode === null);
}

// 8. a run repeatable bit for bit
{
  const go = () => { const r = mk(); r.start(); ghost(r, 60); return [r.en.score, r.en.dist, r.en.clock, r.player.x, r.player.z].concat(r.tf.veh.map(v => v.off ? -1 : v.s + ':' + v.lane)).join(','); };
  check('the same run twice: the same, bit for bit', go() === go());
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
