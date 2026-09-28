// The friend's car in an online race (Core only, no browser): the race leaves it to the network, a collision moves only the
// local car (the friend's phone moves the friend's car), and the finish order follows the times from both phones.
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

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
