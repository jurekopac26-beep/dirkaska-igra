// Special mission 39 · Konji v prikolici (js/missions/m39.js, the kit js/missions/kit.js: MisKit.ride), no browser: its race (Monterey, alone,
// one lap, the off-roader with its own limiter and soft brakes on a copy of the model), the horses' calm (smooth: no jolt; a bend too fast:
// down and a jolt counted once; a knock: a jolt; back up after a smooth while), at 0 failed; over the line: done; the gauges; driven on
// the road: carefully (slowing for the bends) done with 3 stars, recklessly (the racing pace into the hairpin) failed.
//   node tests/m39.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm39.js'));
const { careful } = require('./lib/drive.js');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('39'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'monterey'), T = new Core.Track(TD);
check('39: on Monterey, a real track', D.track === 'monterey' && !TD.test);
const o = D.opts(D);
check('its race: alone, one lap, the off-roader slow with soft brakes (a copy: the model unchanged), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel.id === 'medved' && o.playerModel.vLim === K.VMAX && o.playerModel.brakeK === K.BRK && Core.MODELS.find(m => m.id === 'medved').brakeK > K.BRK * 2, JSON.stringify({ vLim: o.playerModel.vLim, brakeK: o.playerModel.brakeK }));

// a run on a car of its own: speed v along heading 0, turning at w rad/s
const mk = () => ({ player: { x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, dist: 0, hitWall: 0, hitCar: 0, finished: false }, track: T });
const go = (r, sec, v, w, dt) => { dt = dt || 1 / 60; for (let t = 0; t < sec - 1e-9 && !r.end; t += dt) { const P = r.P; P.vx = v; P.vz = 0; P.w = w || 0; P.dist += v * dt; r.step(dt); } };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: MIR KONJ 100 %, SUNKI 0, DO HLEVA 3,6 km', r.vals.mir.text === '100 %' && r.vals.sunki.text === '0' && r.vals.hlev.text === '3,6 km', JSON.stringify(r.vals));
go(r, 10, 15, 0);
check('10 s straight at 54 km/h: calm, no jolt', r.ride.calm === 1 && r.ride.n === 0 && r.hint === D.hint);
go(r, 0.6, 15, 0.5);   // (15 m/s turning 0.5 rad/s: 7.5 m/s2 across)
check('a bend too fast: the calm down, one jolt, the hint says slower into the bends', r.ride.calm < 0.95 && r.ride.n === 1 && /Prehitro v ovinek/.test(r.hint), `${r.ride.calm.toFixed(3)} ${r.ride.n} ${r.hint}`);
go(r, 0.6, 15, 0.5);
check('the same bend on: still one jolt (counted once), the calm lower', r.ride.n === 1 && r.vals.sunki.text === '1', String(r.ride.n));
go(r, 0.6, 15, 0.12);   // (1.8 m/s2: fine)
const c0 = r.ride.calm; go(r, 1.5, 15, 0);
check('smooth again: not back up at once', r.ride.calm === c0);
go(r, 10, 15, 0);
check('after a smooth while: back up slowly', r.ride.calm > c0 && r.ride.calm < c0 + 0.3, `${c0.toFixed(3)} -> ${r.ride.calm.toFixed(3)}`);
const n0 = r.ride.n, c1 = r.ride.calm; F.player.hitWall = 5; go(r, 0.1, 15, 0); F.player.hitWall = 0; go(r, 0.1, 15, 0);
check('a knock: one jolt, the calm down by about K.KNOCK, the hint', r.ride.n === n0 + 1 && c1 - r.ride.calm > K.KNOCK * 0.9, `${n0} ${r.ride.n} ${(c1 - r.ride.calm).toFixed(3)}`);
go(r, 0.2, 15, 0); r.ride.calm = 0.01; go(r, 1, 15, 0.6);
check('the calm at 0: failed, the horses panicked', r.end === 'fail' && /preplašila/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.t = 200; F.player.finished = true; r.step(0.1);
check('over the line with the horses calm: done, 3 stars under ' + D.stars[0] + ' s', r.end === 'win' && r.stars === 3);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.dist = 3100; go(r, 0.1, 10, 0);
check('near the stable: DO HLEVA in m', /^4\d\d m$/.test(r.vals.hlev.text), r.vals.hlev.text);

// on the road: carefully done (3 stars), recklessly failed
const race = (seed) => { const R = new Core.Race(T, Object.assign({ phys: 'cs', seed }, Missions.opts.call(null) || {}, { numAI: 0, laps: 1, tt: true, traffic: false }, o)); R.start(); return R; };
let R = race(3); r = new Missions.Run(D, R); D.begin.call(D, r);
careful(R, r, { vmax: 60 / 3.6, lat: 2.6, maxT: 400 });
check('driven carefully (slowing for the bends, 60 km/h on the straights): done with the horses calm, 3 stars', r.end === 'win' && r.stars === 3 && r.ride.calm > 0.7, `${r.end} ${r.why} t ${r.t.toFixed(0)} calm ${r.ride.calm.toFixed(2)} jolts ${r.ride.n}`);
R = race(4); r = new Missions.Run(D, R); D.begin.call(D, r);
careful(R, r, { vmax: 60 / 3.6, lat: 0, maxT: 120 });
check('driven at 60 km/h on the racing line\'s braking (too fast into the hairpin with the soft brakes): failed', r.end === 'fail' && /preplašila/.test(r.why), `${r.end} t ${r.t.toFixed(0)} s ${R.player.q.s.toFixed(0)}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
