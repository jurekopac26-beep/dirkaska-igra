// Special mission 46 · Požar v predoru (js/missions/m46.js, the kit js/missions/kit.js), no browser: its race (Uncompahgre, alone, the fire
// engine), the tunnel (the trapped cars in it, the burning lorry deep in it), the air used only in the smoke, stopped beside a car: its
// people aboard, before the lorry the crew sprays while driving (out in K.OUTT s), out of the tunnel with everyone: done; the air gone, into the fire, out
// with people left behind: failed; the visibility with the fire out; the gauges.
//   node tests/m46.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm46.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('46'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'uncompahgre'));
check('46: on Uncompahgre, a real track', D.track === 'uncompahgre' && !Core.TRACKS.find(t => t.id === 'uncompahgre').test);
const o = D.opts(D);
check('its race: alone, the fire engine (slower), no damage', o.tt && o.damage === 0 && o.playerModel.id === 'titan' && o.playerModel.vLim < 120);
const s0 = T.startS + K.AT;
check('the tunnel within the road (before its finish)', s0 + K.LEN + 20 < T.finishS, `${(s0 + K.LEN).toFixed(0)} ${T.finishS.toFixed(0)}`);
const mk = (s) => { const p = { q: { s }, x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, finished: false }; return { player: p, track: T }; };
let F = mk(s0 - 500), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the trapped cars before the lorry, 5 people', r.cars.every(c => c.s < r.sL - 20) && r.total === 5, String(r.total));
check('begin: the panel (6 m in the smoke, the air, 0 / 5)', r.vals.vis.text === K.VIS + ' m' && r.vals.res.text === '0 / 5' && /min/.test(r.vals.air.text), JSON.stringify(r.vals));
F.player.vx = 20; for (let i = 0; i < 60 * 5; i++) r.step(1 / 60);
check('outside the tunnel: no air used', r.air === K.AIR);
F.player.q.s = s0 + 20; for (let i = 0; i < 60 * 5; i++) r.step(1 / 60);
check('in the smoke: the air used', Math.abs(r.air - (K.AIR - 5)) < 0.05, r.air.toFixed(2));
// a car: driven past (no stop), stopped beside it
const c0 = r.cars[0], n0 = c0.n; F.player.q.s = c0.s; F.player.vx = 8; for (let i = 0; i < 60 * 4; i++) r.step(1 / 60);
check('driven past a car: nobody aboard', r.aboard === 0);
F.player.vx = 0; for (let i = 0; i < 60 * (K.LOAD + 0.2); i++) r.step(1 / 60);
check('stopped beside it: its people aboard', r.aboard === n0 && n0 > 0 && c0.n === 0 && r.vals.res.text === r.aboard + ' / 5', r.vals.res.text);
// out with people left behind: failed
F.player.q.s = r.s1 + 10; for (const c of r.cars) c.n = 0; r.aboard = 3; r.f = 0; r.step(0.1);
check('out of the tunnel with people left behind: failed', r.end === 'fail' && /ostali/.test(r.why), r.why);
// into the fire
F = mk(s0 + 100); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.q.s = r.sL - 2; F.player.vx = 6; r.step(0.1);
check('driven into the burning lorry: failed', r.end === 'fail' && /ogenj/.test(r.why), r.why);
// the air gone
F = mk(s0 + 100); r = new Missions.Run(D, F); D.begin.call(D, r); r.air = 0.05; r.step(0.1);
check('the air gone in the smoke: failed', r.end === 'fail' && /zraka/.test(r.why), r.why);
// the whole run: everyone aboard, the lorry's fire out while driving up to it, out of the tunnel: done
F = mk(s0 + 100); r = new Missions.Run(D, F); D.begin.call(D, r);
for (const c of r.cars) { F.player.q.s = c.s; for (let i = 0; i < 60 * (K.LOAD + 0.2); i++) r.step(1 / 60); }
check('every car: everyone aboard', r.aboard === r.total);
F.player.q.s = r.sL - 15; F.player.x = r.lorry.x - 12; F.player.z = r.lorry.z; F.player.vx = 4; r.step(1 / 60);
check('before the lorry, driving: the crew sprays (the hint), the truck not held', /curek/.test(r.hint) && !F.player.locked && F.player.vx === 4, r.hint);
r.autoSpray = { x: r.lorry.x, y: r.lorry.y + 2, z: r.lorry.z }; let tOut = 0; for (let i = 0; i < 60 * 8 && r.f > 0; i++) { r.step(1 / 60); tOut += 1 / 60; }
check('the water on the lorry: its whole fire out in K.OUTT s, the smoke thinner', r.f === 0 && Math.abs(tOut - K.OUTT) < 0.3 && r.vals.vis.text === K.VIS1 + ' m' && r.vals.ogenj.text === 'pogašen', `${tOut.toFixed(2)} ${r.vals.vis.text}`);
r.autoSpray = null; F.player.q.s = r.s1 + 10; F.player.vx = 10; r.step(0.1);
check('out of the far portal with everyone: done', r.end === 'win');

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
