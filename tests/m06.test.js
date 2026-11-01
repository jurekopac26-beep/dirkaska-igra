// Special mission 06 · Srce v hladilni torbi (js/missions/m06.js), no browser: its race (the Santa Monica Mountains, the escort ahead in the traffic of cars,
// vans and trucks only), the organ warming up (the time, a hard knock once, faster with the escort far ahead; lost at 8 °C), the escort's
// pace by the gap (slower when the player is far behind, quicker when close or ahead), left behind over 300 m for 8 s: lost; the gauges.
//   node tests/m06.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
require(path.join(ROOT, 'js', 'missions', 'm06.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('06'), K = D.K;
check('06: in the Santa Monica Mountains, in the JELEN GT', D.track === 'mulholland' && D.car === 'jelen' && !!Core.TRACKS.find(t => t.id === 'mulholland') && !!Core.MODELS.find(m => m.id === D.car));
const o = D.opts(D);
check('its race: the traffic, one car ahead of the player (the escort), only cars, vans and trucks', o.traffic && o.numAI === 1 && o.playerGrid === 2 && !o.tt && o.tfCars[3] === 0 && o.tfCars.length === 5 && Math.abs(o.tfCars.reduce((a, b) => a + b, 0) - 1) < 1e-9, JSON.stringify(o));

const mk = () => { const esc = { dist: 40, skCap: 1 }; return { race: { player: { dist: 0, finished: false, hitWall: 0, hitCar: 0 }, track: { len: 4300, raceLen: 4170 }, escort: esc }, esc }; };
let F = mk(), r = new Missions.Run(D, F.race); D.begin.call(D, r);
check('the start: the organ at 4 °C, the gauges set', r.temp === K.T0 && /^4,0 °C$/.test(r.vals.organ.text) && r.vals.hosp.text === '4,2 km', JSON.stringify(r.vals));
for (let i = 0; i < 600; i++) { F.race.player.dist += 0.5; F.esc.dist += 0.5; r.step(1 / 60); }
check('10 s with the escort close: warmer by RISE x 10', Math.abs(r.temp - (K.T0 + K.RISE * 10)) < 1e-6 && !r.end, String(r.temp));
check('the gauges: the escort 40 m, the hospital closer', r.vals.esc.text === '40 m' && r.vals.hosp.text === '3,9 km', JSON.stringify(r.vals));
const t0 = r.temp; F.race.player.hitWall = 5; r.step(1 / 60); r.step(1 / 60); F.race.player.hitWall = 0; r.step(1 / 60);
check('a hard knock: once +HIT (not every step it lasts)', Math.abs(r.temp - t0 - K.HIT - K.RISE * 3 / 60) < 1e-6, String(r.temp - t0));
// the escort's pace
F.esc.dist = F.race.player.dist + 10; r.step(1 / 60); const near = F.esc.skCap;
F.esc.dist = F.race.player.dist + 50; r.step(1 / 60); const mid = F.esc.skCap;
F.esc.dist = F.race.player.dist + 200; r.step(1 / 60); const far = F.esc.skCap;
check('the escort: quicker close, its own pace in between, slower far ahead (not under SLOW)', near > mid && mid > far && far >= K.SLOW, `${near} ${mid} ${far}`);
check('far ahead: the hint says catch up', /dohiti/.test(r.hint), r.hint);
F.esc.dist = F.race.player.dist - 20; r.step(1 / 60);
check('the player ahead of the escort: the hint says do not pass', /Ne prehitevaj/.test(r.hint), r.hint);
// lost: the organ, the escort
F = mk(); r = new Missions.Run(D, F.race); D.begin.call(D, r); r.temp = K.TMAX - 0.001; r.step(0.5);
check('8 °C: failed, the organ', r.end === 'fail' && /segrel/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F.race); D.begin.call(D, r); F.esc.dist = 400;
for (let i = 0; i < 60 * 7; i++) r.step(1 / 60);
check('over 300 m behind for 7 s: still on', !r.end);
for (let i = 0; i < 60 * 2; i++) r.step(1 / 60);
check('for 8 s: failed, the escort lost', r.end === 'fail' && /spremstvo/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F.race); D.begin.call(D, r); F.race.player.finished = true; r.t = 150; r.step(0.1);
check('over the finish at the top: done, 3 stars in 165 s', r.end === 'win' && r.stars === 3);
check('the organ\'s budget: 8 °C after 250 s at the escort\'s side, more than the escort\'s own run (~140 s)', Math.abs((K.TMAX - K.T0) / K.RISE - 250) < 1);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
