// Special mission 54 · Dirka tovornjakov (js/missions/m54.js, the kit js/missions/kit.js), no browser: its race (Nürburg, a standing start
// among the truck's own field of TITANs, one run to the line, the easy rivals), the grid moved to K.S0 m past the start line (two by two,
// everyone near it, the race runs from there: all of them on the move, none rescued), the brakes' heat (braking heats them, hot they fade),
// the water (HLADI held cools them faster and drains the tank at K.USE a second; empty: no more), the finish (first: done; any other place:
// failed with the place), the gauges.
//   node tests/m54.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm54.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('54'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'nring'));
check('54: on Nürburg, a real track', D.track === 'nring' && !Core.TRACKS.find(t => t.id === 'nring').test);
const o = D.opts(D);
check('its race: rivals, one run, a standing start, the player a TITAN (160 km/h limiter, a copy), K.GRID on the grid, no damage', !o.tt && o.numAI === K.N && o.laps === 1 && !o.flying && o.playerGrid === K.GRID && o.playerModel.vLim === 160 && o.playerModel !== Core.MODELS.find(m => m.id === 'titan') && o.damage === 0);
const race = new Core.Race(T, Object.assign({ phys: 'cs', seed: 3 }, o));
D.made(race);
const near = race.cars.every(c => c.q.s <= T.startS + K.S0 && c.q.s > T.startS + K.S0 - 60 && Math.abs(c.q.d) < T.wS(c.q.s));
check('the grid at K.S0: all ' + race.cars.length + ' trucks within 60 m before it, on the road, two by two', near && race.cars.length >= 8 && race.cars.every(c => c.m.id === 'titan'), race.cars.map(c => (c.q.s - T.startS).toFixed(0) + '/' + c.q.d.toFixed(1)).join(' '));
check('the player K.GRID on it', race.player.grid === K.GRID);
race.start(); const d0 = race.cars.map(c => c.dist);
for (let k = 0; k < 20 * 20; k++) { Core.aiControl(race.player, race, 0.05); race.step(0.05); }
check('20 s on: every truck on the move down the road from there, none put back by the marshals, the player not wrong-way', race.cars.every((c, i) => c.dist - d0[i] > 150 && !c.finished) && race.player.wrongT === 0, race.cars.map((c, i) => (c.dist - d0[i]).toFixed(0)).join(' '));
// the brakes and the water (a stand-in player)
const mk = () => ({ player: { q: { s: T.startS + K.S0, d: 0 }, x: 0, z: 0, h: 0, vx: 40, vz: 0, inBrk: 0, pos: 5, finished: false }, track: T, cars: new Array(10) });
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: OMEJEVALNIK 160, POLOŽAJ 5 / 10, ZAVORE 0 %, VODA 100 %', r.vals.omej.text === '160' && r.vals.pol.text === '5 / 10' && r.vals.zavore.text === '0 %' && r.vals.voda.text === '100 %', JSON.stringify(r.vals));
const brake = (r, sec) => { for (let k = 0; k < sec * 20; k++) { r.P.vx = 40; r.P.vz = 0; r.P.inBrk = 1; r.step(0.05); } r.P.inBrk = 0; };
brake(r, 1.5);
check('a hard braking from 144 km/h for 1.5 s: ZAVORE ' + r.vals.zavore.text, r.br.heat > 0.6 && r.br.heat < 1, r.br.heat.toFixed(2));
brake(r, 1.5); r.P.vx = 40; r.P.inBrk = 1; const v0 = r.P.vx; r.step(0.05);
check('another: over-hot, they fade (some of the braking given back), the hint says so', r.br.fade > 0 && r.P.vx > v0 && /pregrete/.test(r.hint), r.br.fade.toFixed(2));
// cooling: with the water faster, the tank draining
const cool = (water, sec) => { const x = mk(), q = new Missions.Run(D, x); D.begin.call(D, q); q.br.heat = 1; q.autoCool = water; for (let k = 0; k < sec * 20; k++) { x.player.inBrk = 0; q.step(0.05); } return q; };
const dry = cool(false, 5), wet = cool(true, 5);
check('5 s off the brakes: with HLADI held they cool much faster (' + dry.br.heat.toFixed(2) + ' → ' + wet.br.heat.toFixed(2) + '), VODA down by 5 x K.USE', wet.br.heat < dry.br.heat - 0.4 && Math.abs(wet.water - (1 - 5 * K.USE)) < 0.01 && dry.water === 1);
const empty = cool(true, 20);
check('held on: the tank empty, no more cooling from it (VODA 0 %), the hint says so', empty.water === 0 && !empty.cooling && empty.vals.voda.text === '0 %' && /Vode ni/.test(empty.hint), empty.hint);
// the finish
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.pos = 1; F.player.finished = true; r.step(0.05);
check('over the line first: done', r.end === 'win', String(r.end));
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.pos = 3; F.player.finished = true; r.step(0.05);
check('over the line third: failed, the place said', r.end === 'fail' && /3\. mestu/.test(r.why), r.why);
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
