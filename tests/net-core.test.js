// The friends' cars in an online race (Core only, no browser): the race leaves them to the network, a collision moves only the
// local car (the friend's phone moves the friend's car), and the finish order follows the times from the phones. A room of four:
// three friends' cars on their slots, two rows of two. A quick match of 22: on every track, all of them behind the line.
//   node tests/net-core.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
Math.random = seeded(21);
const T = new C.Track(C.TRACKS.find(d => d.id === 'jezero'));
const mk = () => new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', playerModel: C.MODELS[0], seed: 3,
  remote: { model: C.MODELS[2], color: 0x1c5fd6, num: 5, name: 'Bor', grid: 2 } });

// 1. the grid: the player first, the friend second, nobody else
let r = mk();
check('grid: the player and the friend, no AI', r.cars.length === 2 && r.player.grid === 1 && r.remote.grid === 2 && r.remote.net === true && !r.player.net && r.remote.name === 'Bor' && r.remote.num === 5,
  `${r.cars.length} cars, friend grid ${r.remote.grid} num ${r.remote.num}`);
{ const P = r.player, F = r.remote, side = (F.x - P.x) * Math.sin(P.h) - (F.z - P.z) * Math.cos(P.h), along = (F.x - P.x) * Math.cos(P.h) + (F.z - P.z) * Math.sin(P.h);
  check('grid: side by side on the front row, the same distance to the line', P.dist === F.dist && P.dist === -9 && Math.abs(along) < 0.5 && Math.abs(side) > 5,
    `distance ${P.dist} / ${F.dist} m, ${along.toFixed(2)} m apart along the road, ${side.toFixed(1)} m across`); }

// 2. the race does not drive the friend's car: after 3 s of racing it stands where the network put it; the player drives on
r.start();
const x0 = r.remote.x, z0 = r.remote.z, p0 = r.player.dist;
for (let k = 0; k < 3 / DT; k++) { C.aiControl(r.player, r, DT); r.step(DT); }
check('the race leaves the friend\'s car alone (no physics, no AI, no progress of its own)', r.remote.x === x0 && r.remote.z === z0 && r.remote.dist === r.remote.dist && r.player.dist > p0 + 10,
  `friend moved ${Math.hypot(r.remote.x - x0, r.remote.z - z0).toFixed(3)} m, player ${(r.player.dist - p0).toFixed(1)} m`);

// 3. a collision: the friend's car stays where it is (its own phone moves it), the local car is pushed away and takes its share
r = mk(); r.start();
const P = r.player, F = r.remote;
const gap = P.circles[2] - F.circles[0] + P.rad + F.rad - 0.25;   // right in front of the player, the bumpers 25 cm into each other
F.x = P.x + Math.cos(P.h) * gap; F.z = P.z + Math.sin(P.h) * gap; F.h = P.h; F.vx = F.vz = 0;
P.vx = Math.cos(P.h) * 12; P.vz = Math.sin(P.h) * 12;
const fx = F.x, fz = F.z, d0 = Math.hypot(F.x - P.x, F.z - P.z);
r.step(DT);
const d1 = Math.hypot(F.x - P.x, F.z - P.z), vIn = P.vx * Math.cos(P.h) + P.vz * Math.sin(P.h);
check('collision: the friend\'s car is not moved, the local car is pushed apart and slowed', F.x === fx && F.z === fz && F.vx === 0 && F.vz === 0 && d1 > d0 && vIn < 11 && F.dmg === 0,
  `gap ${d0.toFixed(2)} -> ${d1.toFixed(2)} m, player speed along ${vIn.toFixed(2)} m/s, friend damage ${F.dmg}`);

// ... and the same on the friend's phone, where the friend's car comes first in the race's list (the pair the other way round)
r = new C.Race(T, { numAI: 0, playerGrid: 2, laps: 1, phys: 'cs', playerModel: C.MODELS[2], seed: 3, remote: { model: C.MODELS[0], num: 1, name: 'Ana', grid: 1 } });
r.start();
const P2 = r.player, F2 = r.remote, gap2 = P2.circles[2] - F2.circles[0] + P2.rad + F2.rad - 0.25;
F2.x = P2.x + Math.cos(P2.h) * gap2; F2.z = P2.z + Math.sin(P2.h) * gap2; F2.h = P2.h; F2.vx = F2.vz = 0;
P2.vx = Math.cos(P2.h) * 12; P2.vz = Math.sin(P2.h) * 12;
const fx2 = F2.x, fz2 = F2.z, e0 = Math.hypot(F2.x - P2.x, F2.z - P2.z);
r.step(DT);
const e1 = Math.hypot(F2.x - P2.x, F2.z - P2.z), vIn2 = P2.vx * Math.cos(P2.h) + P2.vz * Math.sin(P2.h);
check('collision on the friend\'s phone (the friend\'s car first in the list): the same', r.cars[0] === F2 && F2.x === fx2 && F2.z === fz2 && F2.vx === 0 && F2.vz === 0 && e1 > e0 && vIn2 < 11 && F2.dmg === 0,
  `gap ${e0.toFixed(2)} -> ${e1.toFixed(2)} m, player speed along ${vIn2.toFixed(2)} m/s, friend damage ${F2.dmg}`);

// 4. the finish: times from both phones decide the order, whatever order the messages come in
r = mk(); r.start();
r.player.finished = true; r.player.finishTime = 61.2; r.finishOrder.push(r.player); r.player.finishPos = 1;   // (as the race marks the local finish)
r.netFinish(r.remote, 60.9);   // the friend's finish arrives later, with an earlier time
r.step(DT);
check('finish: the earlier time wins even when its message comes later', r.remote.finishPos === 1 && r.player.finishPos === 2 && r.order[0] === r.remote,
  `friend ${r.remote.finishPos}. (60.9 s), player ${r.player.finishPos}. (61.2 s)`);
r.netFinish(r.remote, 10);   // (a repeated message changes nothing)
check('finish: a repeated finish message changes nothing', r.remote.finishTime === 60.9, `${r.remote.finishTime}`);
r.netFinish(r.player, 60.7);   // my time measured on the shared clock replaces the local one, and the order follows it
check('finish: my time on the shared clock replaces the local one, the order follows', r.player.finishTime === 60.7 && r.player.finishPos === 1 && r.remote.finishPos === 2 && r.finishOrder.length === 2,
  `player ${r.player.finishPos}. (${r.player.finishTime} s), friend ${r.remote.finishPos}. (${r.remote.finishTime} s)`);

// 3. a race of four (a private room): the three friends' cars, each on its slot; two rows of two; none of them driven here; the
// order of the finish from the four times
{
  const q = new C.Race(T, { numAI: 0, playerGrid: 3, laps: 1, phys: 'cs', playerModel: C.MODELS[0], seed: 3,
    remote: [{ id: 'h', model: C.MODELS[1], num: 1, name: 'Ana', grid: 1 }, { id: 'g1', model: C.MODELS[2], num: 2, name: 'Bor', grid: 2 }, { id: 'g3', model: C.MODELS[3], num: 4, name: 'Dan', grid: 4 }] });
  const R = q.remotes, byGrid = q.cars.slice().sort((a, b) => a.grid - b.grid);
  check('four: the player and three friends, each friend on its slot with its id and number, the first of them the friend', q.cars.length === 4 && R.length === 3 && R.every(c => c.net) && q.remote === R[0] && q.player.grid === 3 &&
    R.map(c => c.netOf.id + '@' + c.grid + '#' + c.num).join() === 'h@1#1,g1@2#2,g3@4#4', R.map(c => c.netOf.id + '@' + c.grid + '#' + c.num).join());
  check('four: two rows of two (9 m and 16.5 m behind the line)', byGrid.map(c => c.dist).join() === '-9,-9,-16.5,-16.5', byGrid.map(c => c.dist).join());
  q.start(); const xs = R.map(c => c.x + ',' + c.z);
  for (let k = 0; k < 2 / DT; k++) { C.aiControl(q.player, q, DT); q.step(DT); }
  check('four: none of the friends\' cars is driven here', R.every((c, i) => c.x + ',' + c.z === xs[i]), '');
  q.netFinish(R[2], 61.5); q.netFinish(R[0], 60.2); q.netFinish(q.player, 60.9); q.netFinish(R[1], 62.0); q.step(DT);
  check('four: the finish order from the four times', q.finishOrder.map(c => c.name).join() === 'Ana,TI,Dan,Bor' && q.order[0] === R[0] && q.player.finishPos === 2, q.finishOrder.map(c => c.name + ' ' + c.finishTime).join(', '));
}

// 4. a quick match of 22 (Počakaj prijatelja): on every track that races, the player and 21 friends, two abreast behind the line,
// none on top of another; on an open road all of them on the road below the line
{
  const bad22 = [];
  for (const d of C.TRACKS.filter(t => !t.timeTrial)) {
    const Tq = new C.Track(d), rem = [];
    for (let g = 1; g <= 21; g++) rem.push({ id: g === 1 ? 'h' : 'g' + (g - 1), model: C.MODELS[g % 4], num: g + 1, name: 'P' + g, grid: g });
    const q = new C.Race(Tq, { numAI: 0, playerGrid: 22, laps: 1, phys: 'cs', playerModel: C.MODELS[0], seed: 3, remote: rem });
    let near = Infinity; for (let i = 0; i < q.cars.length; i++) for (let j = i + 1; j < q.cars.length; j++) near = Math.min(near, Math.hypot(q.cars[i].x - q.cars[j].x, q.cars[i].z - q.cars[j].z));
    const back = Math.max(...q.cars.map(c => -c.dist));
    if (q.cars.length !== 22 || q.remotes.length !== 21 || !q.cars.every(c => c.dist < 0) || near < 2.5 || (Tq.open && back > Tq.startS - 4)) bad22.push(`${d.id}: ${q.cars.length} cars, nearest two ${near.toFixed(1)} m apart, last ${back.toFixed(1)} m back`);
  }
  check('22: on every track the player and 21 friends behind the line, none on top of another (an open road: all below the line)', !bad22.length, bad22.slice(0, 4).join(' | '));
}

// beg s prijatelji (docs/novosti-e.md, B1 and B2): online on an open road with traffic (Rio do Rastro). The traffic on both phones from the
// host's seed, the same while the race cars are far from it; the patrol car (the friend's on my phone, mine on its) in the police look.
// The traffic on each phone reacts to the friend's car as to its own: pulls over for the friend's patrol car (its siren), brakes for the
// friend's car in its lane, a knock moves only the vehicle (the friend's phone moves its car). An online race without it: no traffic, no
// patrol car, as before
{
  const TV = new C.Track(C.TRACKS.find(d => d.id === 'rastro'));
  const phone = (me, it, o) => new C.Race(TV, { numAI: 0, playerGrid: me === 'h' ? 1 : 2, laps: 1, phys: 'cs', playerModel: C.MODELS[0],
    netTf: o.tf, seed: o.seed, playerPolice: !!o.tf && o.pol === me,
    remote: [{ id: it, model: C.MODELS[2], color: 0x1c5fd6, num: 5, name: it === 'h' ? 'Ana' : 'Bor', grid: it === 'h' ? 1 : 2, police: !!o.tf && o.pol === it }] });
  const beg = { tf: true, seed: 12345, pol: 'g1' };
  const A = phone('h', 'g1', beg), B = phone('g1', 'h', beg);
  const sig = (r) => r.tf ? r.tf.veh.map(v => v.kind + ':' + v.dir + ':' + v.s.toFixed(3)).join(' ') : '';
  check('beg B1: the traffic online, on both phones the same from the host\'s seed (no police of the game)', !!A.tf && !!B.tf && A.tf.veh.length > 5 && sig(A) === sig(B) && !A.pol && !B.pol,
    `${A.tf ? A.tf.veh.length : 0} / ${B.tf ? B.tf.veh.length : 0} vehicles`);
  check('beg B1: another seed, other traffic', sig(phone('h', 'g1', { tf: true, seed: 999, pol: 'g1' })) !== sig(A));
  const N = phone('h', 'g1', { tf: false, pol: 'g1' });
  check('beg B1: an online race without it: no traffic and no patrol car, as before', !N.tf && !N.pol && !N.cars.some(c => c.police));
  check('beg B2: the patrol car: the friend\'s on my phone, mine on its phone, in the chase', A.remote.police && A.remote.pol.mode === 'chase' && A.remote.pol.kind === 'car' && !A.player.police && B.player.police && !B.remote.police);
  // the two phones for 40 s: each drives its own car (the AI's hands), the other's car follows what its phone sends (here at once, a step
  // later). Each phone works out the traffic near the cars itself (who pulls over, a knock): the vehicles that never came within 300 m of
  // a race car (nor went round from the top to the bottom) are the same on both
  const keys = ['x', 'z', 'y', 'h', 'vx', 'vz', 'vy', 'w', 'vl', 'dist'];
  const copy = (from, to) => { for (const k of keys) to[k] = from[k]; to.px = to.x; to.pz = to.z; to.py = to.y; to.ph = to.h; };
  A.start(); B.start();
  const near = new Set(), lastS = new Map();
  const mark = (r) => { for (const v of r.tf.veh) { if (Math.abs(v.s - (lastS.has(r.tf) && lastS.get(r.tf).get(v.id) != null ? lastS.get(r.tf).get(v.id) : v.s)) > 500 || r.cars.some(c => Math.hypot(c.x - v.x, c.z - v.z) < 300)) near.add(v.id); }
    lastS.set(r.tf, new Map(r.tf.veh.map(v => [v.id, v.s]))); };
  let worst = 0, cmp = 0, siren = null; const yl = [new Set(), new Set()];   // (the vehicles that pulled over on each phone)
  for (let k = 0; k < 40 / DT; k++) {
    C.aiControl(A.player, A, DT); C.aiControl(B.player, B, DT);
    A.step(DT); B.step(DT);
    copy(A.player, B.remote); copy(B.player, A.remote);
    mark(A); mark(B);
    for (const [j, r] of [[0, A], [1, B]]) for (const v of r.tf.veh) if (v.yl === 1) yl[j].add(v.id);
    if (siren == null && !A.remote.locked && !B.player.locked) siren = A.tf._siren(A.remote) && !A.tf._siren(A.player) && B.tf._siren(B.player) && !B.tf._siren(B.remote);
    if (k % 60 === 59) { const byId = new Map(B.tf.veh.map(v => [v.id, v]));
      for (const a of A.tf.veh) { const b = byId.get(a.id); if (!b || near.has(a.id)) continue; cmp++; worst = Math.max(worst, Math.hypot(a.x - b.x, a.z - b.z)); } }
  }
  check('beg B2: the siren: the patrol car\'s on both phones, not the one running from it', siren === true);
  check('beg B2: 40 s: the traffic pulls over for the patrol car on both phones (on mine for the friend\'s)', yl[0].size > 0 && yl[1].size > 0, `${yl[0].size} / ${yl[1].size} vehicles pulled over`);
  check('beg B1: 40 s on two phones: the traffic away from the cars the same on both (within 0.1 m)', cmp > 500 && worst < 0.1 && A.tf.veh.length === B.tf.veh.length,
    `${cmp} positions of ${A.tf.veh.length - near.size} vehicles away from the cars compared (${near.size} came near), the worst ${worst.toFixed(3)} m apart; the cars at ${A.player.dist.toFixed(0)} / ${B.player.dist.toFixed(0)} m`);
  // the friend's car put by a vehicle, as the network would (a vehicle on its way with nothing ahead, far from the other car): on my phone
  // the friend's patrol car coming up 45 m behind it, siren on: it pulls over and brakes; on the patrol's phone the car running from it
  // (mine there): no pulling over for it, but standing in its lane 35 m ahead: it brakes; the patrol car into its back: the vehicle
  // knocked, the friend's car where it was, as fast (its phone moves it)
  const put = (r, c, s, d, dir, sp) => { const TT = r.track, i = TT.idx(s), tx = TT.tx[i] * dir, tz = TT.tz[i] * dir;
    c.x = c.px = TT.px[i] + TT.nx[i] * d; c.z = c.pz = TT.pz[i] + TT.nz[i] * d; c.h = c.ph = Math.atan2(tz, tx); c.vx = tx * sp; c.vz = tz * sp; c.w = 0; TT.query(c.x, c.z, -1, c.q); };
  const behind = (r, c, v, gap, sp) => { const TT = r.track, i = TT.idx(v.s), tx = TT.tx[i] * v.dir, tz = TT.tz[i] * v.dir;   // (gap m behind the vehicle where it is, along the road)
    c.x = c.px = v.x - tx * gap; c.z = c.pz = v.z - tz * gap; c.h = c.ph = Math.atan2(tz, tx); c.vx = tx * sp; c.vz = tz * sp; c.w = 0; TT.query(c.x, c.z, -1, c.q); };
  const pick = (r) => r.tf.veh.find(v => !v.off && v.st === 0 && !v.alt && !v.grp && v.kind < 3 && v.v > 6 && v.gap > 1e8 && !v.yl && r.cars.every(c => Math.hypot(c.x - v.x, c.z - v.z) > 400));
  const go = (r) => { r.start(); for (let k = 0; k < 12 / DT && (r.player.locked || r.remote.locked || !pick(r)); k++) { C.aiControl(r.player, r, DT); r.step(DT); } return pick(r); };
  { const A2 = phone('h', 'g1', beg), v = go(A2), P = A2.remote, v0 = v ? v.v : 0, e0 = v ? Math.abs(v.d - A2.tf._edge(v)) : 0;
    let y1 = false;
    if (v) for (let k = 0; k < 2 / DT; k++) { put(A2, P, v.s - v.dir * 45, v.d, v.dir, v.v + 10); C.aiControl(A2.player, A2, DT); A2.step(DT); if (k === 0) y1 = v.yl === 1; }
    check('beg B2: on my phone the traffic pulls over for the friend\'s patrol car: over to its edge, braking', !!v && y1 && v.yl === 1 && v.v < v0 - 2 && Math.abs(v.d - A2.tf._edge(v)) < e0 - 0.2,
      v ? `pulling over from the first step ${y1}, ${(v0 * 3.6).toFixed(0)} -> ${(v.v * 3.6).toFixed(0)} km/h in 2 s, ${e0.toFixed(2)} -> ${Math.abs(v.d - A2.tf._edge(v)).toFixed(2)} m from its edge` : 'no vehicle');
    const w = v && pick(A2);
    if (w) { const wv = w.v; behind(A2, P, w, (w.len + P.m.len) / 2 - 0.5, w.v + 8); const sx = P.x, sz = P.z, svx = P.vx, svz = P.vz;
      A2.step(DT);
      check('beg B2: the friend\'s patrol car into a vehicle\'s back: the vehicle knocked, the friend\'s car not moved by it', (w.st === 1 || w.v < wv - 3) && P.x === sx && P.z === sz && P.vx === svx && P.vz === svz,
        `vehicle ${w.st === 1 ? 'knocked loose' : 'on its way'} at ${(Math.hypot(w.vx, w.vz) * 3.6).toFixed(0)} km/h (was ${(wv * 3.6).toFixed(0)}), the friend's car moved ${Math.hypot(P.x - sx, P.z - sz).toFixed(3)} m`); }
    else check('beg B2: the friend\'s patrol car into a vehicle\'s back: the vehicle knocked, the friend\'s car not moved by it', false, 'no vehicle'); }
  { const B2 = phone('g1', 'h', beg), v = go(B2), F = B2.remote;
    let none = !!v;
    if (v) for (let k = 0; k < 1 / DT; k++) { put(B2, F, v.s - v.dir * 45, v.d, v.dir, v.v + 10); C.aiControl(B2.player, B2, DT); B2.step(DT); if (v.yl) none = false; }
    const u = v && pick(B2);
    if (u) { put(B2, F, u.s + u.dir * 35, u.d, u.dir, 0); C.aiControl(B2.player, B2, DT); B2.step(DT); }
    check('beg B2: on the patrol\'s phone no pulling over for the car running from it, the traffic brakes for it in its lane', none && !!u && u.gap < 35 && u.acc < -1,
      u ? `pulled over for it: ${!none}; standing 35 m ahead: gap ${u.gap.toFixed(1)} m, ${u.acc.toFixed(1)} m/s2` : 'no vehicle'); }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
