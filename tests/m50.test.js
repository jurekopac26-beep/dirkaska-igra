// Special mission 50 · Panji na pašo (js/missions/m50.js, the kit js/missions/kit.js: MisKit.ride), no browser: its race (Medvode, alone,
// the lorry on the off-roader's physics with its own limiter and soft brakes, no damage), the start K.S0 m past the start line beyond the
// Sava bridge, the bees' calm (a pothole: one jolt a hole, harder the faster; a bend too fast; back up after a smooth while), at 0 failed,
// the sun setting at the limit: failed, over the line: done; the gauges; driven on the road round the holes: done, through them at the
// racing pace: failed.
//   node tests/m50.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm50.js'));
const { careful } = require('./lib/drive.js');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('50'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'medvode'), T = new Core.Track(TD);
check('50: on Medvode, a real track', D.track === 'medvode' && !TD.test);
const o = D.opts(D);
check('its race: alone, one run, the lorry slow with soft brakes (a copy of the model), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel.vLim === K.VMAX && o.playerModel.brakeK === K.BRK && Core.MODELS.find(m => m.id === 'medved').vLim !== K.VMAX);
check('the holes on the way, the last ones on the gravel castle road (from 5238 m)', K.HOLES.length >= 10 && K.HOLES.filter(h => h[0] > 5238).length >= 5 && K.HOLES.every(h => h[0] > K.S0 && h[0] < TD.surf[0][1] - 100 && Math.abs(h[1]) < T.wS(T.startS + h[0]) - 1));
const race = (seed) => { const R = new Core.Race(T, Object.assign({ phys: 'cs', seed }, { numAI: 0, laps: 1, tt: true, traffic: false }, o)); D.made(R); R.start(); return R; };
let R = race(3);
check('the start: K.S0 m past the start line', Math.abs(R.player.q.s - (T.startS + K.S0)) < 5, R.player.q.s.toFixed(0));

// a run on a car of its own, put on the road at s (d across), at v along it
const mk = () => ({ player: { x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, dist: K.S0, q: { s: T.startS + K.S0 }, hitWall: 0, hitCar: 0, finished: false }, track: T });
const at = (r, s, d, v) => { const i = T.idx(s), P = r.P; P.q.s = s; P.x = T.px[i] + T.nx[i] * d; P.z = T.pz[i] + T.nz[i] * d; P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * v; P.vz = T.tz[i] * v; P.w = 0; P.dist = s - T.startS; };
const roll = (r, s0, s1, d, v) => { for (let s = s0; s <= s1 && !r.end; s += v / 60) { at(r, s, d, v); r.step(1 / 60); } };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: ČEBELE mirne, SUNKI 0, DO PAŠE 2,4 km, SONCE ZAIDE čez 5 min', r.vals.cebele.text === 'mirne' && r.vals.sunki.text === '0' && r.vals.pasa.text === '2,4 km' && r.vals.sonce.text === 'čez 5 min', JSON.stringify(r.vals));
const h0 = r.holes[0], hd = (h) => { const i = T.idx(h.s); return (h.x - T.px[i]) * T.nx[i] + (h.z - T.pz[i]) * T.nz[i]; };
roll(r, h0.s - 30, h0.s + 20, hd(h0) + 3.2, 8);
check('past the first hole beside it: no jolt', r.ride.n === 0 && r.ride.calm === 1, `${r.ride.n} ${r.ride.calm}`);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
roll(r, h0.s - 30, h0.s + 4, hd(h0) - 1.0, 6);   // (the left wheels over it: centred on it, it goes between the wheels)
const c6 = 1 - r.ride.calm;
check('through it slowly: one jolt (front and rear wheels the same one), the hint says steer round', r.ride.n === 1 && c6 > 0.1 && /Luknja/.test(r.hint), `${r.ride.n} ${c6.toFixed(3)} ${r.hint}`);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
roll(r, h0.s - 30, h0.s + 20, hd(h0) - 1.0, 15);
check('through it fast: a harder jolt', r.ride.n === 1 && 1 - r.ride.calm > c6 * 1.5, (1 - r.ride.calm).toFixed(3));
r.ride.calm = 0.05; const h2 = r.holes[2]; roll(r, h2.s - 20, h2.s + 5, hd(h2) + 1.0, 12);
check('the bees at 0: failed, angry', r.end === 'fail' && /razjezile/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); at(r, T.startS + K.S0, 0, 0); r.t = D.limit - 0.01; r.step(0.05);
check('the sun set at the limit: failed', r.end === 'fail' && /zašlo/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); at(r, T.startS + K.S0, 0, 0); r.t = 150; F.player.finished = true; r.step(0.05);
check('over the line with the bees calm: done, 3 stars', r.end === 'win' && r.stars === 3);

// on the road: round the holes (the autopilot's line moved off each one ahead), slowing for the bends: done; through them at the racing pace: failed
const dodge = (P, run) => { const qs = P.q.s, h = run.holes.find(h => !h.done && h.s > qs - 3 && h.s < qs + 60); if (!h) { P.laneBias = 0; return; } const i = T.idx(h.s), d = hd(h); P.laneBias = (d > 0 ? d - 2.3 : d + 2.3) - T.rl[i]; };
R = race(3); r = new Missions.Run(D, R); D.begin.call(D, r);
careful(R, r, { vmax: 50 / 3.6, lat: 2.6, maxT: 320, pre: dodge });
check('round the holes, slowing for the bends: done with the bees calm', r.end === 'win' && r.ride.calm > 0.4 && r.stars >= 2, `${r.end} ${r.why} t ${r.t.toFixed(0)} calm ${r.ride.calm.toFixed(2)} jolts ${r.ride.n}`);
R = race(4); r = new Missions.Run(D, R); D.begin.call(D, r);
careful(R, r, { vmax: 55 / 3.6, lat: 0, maxT: 320 });
check('through the holes at the racing line\'s pace: failed, the bees angry', r.end === 'fail' && /razjezile/.test(r.why), `${r.end} t ${r.t.toFixed(0)} s ${R.player.q.s.toFixed(0)}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
