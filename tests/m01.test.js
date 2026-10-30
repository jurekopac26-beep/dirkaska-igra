// Special mission 01 · Požar na vrhu (js/missions/m01.js, the kit js/missions/kit.js), no browser: its race (Vršič, alone, the fire engine on
// the racing truck's physics with its own limiter, no damage), the start K.S0 m below the house on the hairpins, the fire growing and the
// house burning on the way, stopped in front of the house: the crew works (the truck held), the water aimed at a flame puts it out, the
// others grow back, all out: done; the water gone, the house burnt, driven past the house: failed; the gauges.
//   node tests/m01.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm01.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('01'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'vrsic'));
check('01: on Vršič, a real track', D.track === 'vrsic' && !Core.TRACKS.find(t => t.id === 'vrsic').test);
const o = D.opts(D);
check('its race: alone, the fire engine (the racing truck\'s physics, slower), no damage', o.tt && o.damage === 0 && o.playerModel && o.playerModel.id === 'titan' && o.playerModel.vLim < 120 && o.playerModel !== Core.MODELS.find(m => m.id === 'titan') && Core.MODELS.find(m => m.id === 'titan').vLim === 160, JSON.stringify({ vLim: o.playerModel && o.playerModel.vLim }));

// the start: a real race, the player moved up the road
const race = new Core.Race(T, Object.assign({ phys: 'cs', seed: 3 }, Missions.opts.call(null) || {}, o));
D.made(race);
const P = race.player, sH = T.finishS - K.HOUSE;
check('the start: K.S0 m below the house, on the road', Math.abs(P.q.s - (sH - K.S0)) < 5 && Math.abs(P.dist - (sH - K.S0 - T.startS)) < 1, `${P.q.s.toFixed(0)} ${(sH - K.S0).toFixed(0)}`);

const mk = () => { const p = { q: { s: sH - 2000 }, x: 0, z: 0, h: 0, vx: 20, vz: 0, w: 0, finished: false }; return { player: p, track: T }; };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('begin: the house 100 %, the fire small, the water full', r.house === 1 && r.f === K.F0 && r.water === K.WATER && r.vals.voda.text === K.WATER + ' l' && r.vals.hisa.text === '100 %', JSON.stringify(r.vals));
for (let i = 0; i < 60 * 30; i++) r.step(1 / 60);
check('30 s on the way: the fire grows, the house burns', r.f > K.F0 + 0.1 && r.house < 1 && r.stage === 'drive' && !r.end, `${r.f.toFixed(2)} ${r.house.toFixed(3)}`);
check('the hint: how far to the house', /km/.test(r.hint), r.hint);
// in front of the house, slow: the truck pulls up and the crew starts
F.player.q.s = sH - 15; F.player.vx = 2; r.step(1 / 60); r.step(1 / 60);
check('stopped in front of the house: the crew works, the truck held', r.stage === 'fight' && F.player.locked === true && F.player.vx === 0, r.stage);
const w0 = r.water;
r.autoSpray = { x: r.H.fl[0][0], y: r.H.fl[0][1], z: r.H.fl[0][2] };
for (let i = 0; i < 60 * 1; i++) r.step(1 / 60);
check('the water on a flame: it goes down, the water used', r.fl[0] < r.fl[1] && Math.abs(w0 - r.water - K.FLOW) < 0.5, `${r.fl[0].toFixed(2)} ${r.fl[1].toFixed(2)} ${(w0 - r.water).toFixed(1)}`);
for (let k = 0; k < K.SPOTS; k++) { r.autoSpray = { x: r.H.fl[k][0], y: r.H.fl[k][1], z: r.H.fl[k][2] }; for (let i = 0; i < 60 * 4 && r.fl[k] > 0; i++) r.step(1 / 60); }
check('every flame out: done, the truck let go', r.end === 'win' && r.f === 0 && F.player.locked === false, `${r.end} ${r.f}`);
// failed: the water, the house, past the house
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.q.s = sH - 15; F.player.vx = 0; r.step(1 / 60); r.water = 1; r.autoSpray = { x: 0, y: 0, z: 0 }; r.step(0.5);
check('the water gone, the fire still on: failed', r.end === 'fail' && /vode/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.house = 0.001; r.f = 1; r.step(0.5);
check('the house at 0 %: failed', r.end === 'fail' && /zgorela/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.finished = true; r.step(0.1);
check('over the finish, past the house: failed', r.end === 'fail' && /mimo/.test(r.why), r.why);
check('the house can wait for the drive: at full fire it lasts longer than the time limit\'s drive', 1 / K.BURN > 300);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
