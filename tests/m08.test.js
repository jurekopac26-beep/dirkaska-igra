// Special mission 08 · Izgubljeni v gozdu (js/missions/m08.js, the kit js/missions/kit.js), no browser: its race (Ouninpohja, alone, the
// pickup on MEDVED's physics, no damage); the three hikers in the forest off the road; the searchlight turns toward its aim (its motor: not
// at once), kept K.NEAR..K.FAR m out; a hiker in its pool for K.LIT s is found (NAJDENI), walks out to the road's edge, gets in when the
// pickup stops by them (not while it drives past); the battery runs down while it shines, faster the further; all three in, at the
// rescuers: done; empty: failed; over the finish without them: failed.
//   node tests/m08.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm08.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('08'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'ouninpohja'));
check('08: on Ouninpohja, a real track', D.track === 'ouninpohja' && !Core.TRACKS.find(t => t.id === 'ouninpohja').test);
const o = D.opts(D);
check('its race: alone, the pickup (MEDVED\'s physics on a copy), no damage', o.tt && o.damage === 0 && o.playerModel && o.playerModel !== Core.MODELS.find(m => m.id === 'medved') && o.playerModel.mass === Core.MODELS.find(m => m.id === 'medved').mass);

const mk = () => ({ player: { q: { s: T.startS, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, finished: false }, track: T });
const at = (r, s, v, d) => { const i = T.idx(s), P = r.P; P.q.s = s; P.q.d = d || 0; P.x = T.px[i] + T.nx[i] * (d || 0); P.z = T.pz[i] + T.nz[i] * (d || 0); P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * v; P.vz = T.tz[i] * v; };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: NAJDENI 0 / 3, the battery full', r.vals.najdeni.text === '0 / 3' && r.vals.baterija.text === '100 %', JSON.stringify(r.vals));
check('three hikers in the forest, 15 m and more off the road\'s edge', r.h.length === 3 && r.h.every(h => { const q = T.query(h.x, h.z, T.idx(h.s), {}); return Math.abs(q.d) > T.wS(h.s) + 15; }), r.h.map(h => h.s).join());
// the searchlight's aim: straight ahead without a finger; toward the hiker with autoAim, turned by its motor
for (let k = 0; k < 10; k++) { at(r, r.h[0].s - 40, 0); r.step(0.1); }
check('no finger: the searchlight straight ahead', Math.abs(r.yaw - r.P.h) < 0.3 && Math.abs(r.dist - 20) < 3, `${r.yaw.toFixed(2)} ${r.P.h.toFixed(2)} ${r.dist.toFixed(1)}`);
r.autoAim = true; const y0 = r.yaw; r.step(0.1);
const h0 = r.h[0], want = Math.atan2(h0.z - r.P.z, h0.x - r.P.x);
check('aimed at a hiker: it turns toward them, not at once', Math.abs(r.yaw - y0) > 0.05 && Math.abs(r.yaw - y0) <= 0.26, `${y0.toFixed(2)} ${r.yaw.toFixed(2)} ${want.toFixed(2)}`);
const bat0 = r.bat;
for (let k = 0; k < 40 && h0.st === 'lost'; k++) { at(r, h0.s - 40, 0); r.step(0.1); }
check('in the pool for K.LIT s: found (NAJDENI 1 / 3), walking out to the road', h0.st === 'walk' && r.vals.najdeni.text === '1 / 3', `${h0.st} ${h0.lit.toFixed(2)}`);
check('the battery runs down while it shines', r.bat < bat0, `${bat0.toFixed(2)} ${r.bat.toFixed(2)}`);
// driving past: not picked up; stopped by them at the road's edge: in
for (let k = 0; k < 300 && h0.st === 'walk'; k++) { at(r, h0.s - 40, 0); r.step(0.1); }
check('at the road\'s edge: waiting', h0.st === 'wait' && /ustavi/.test(r.hint), `${h0.st} ${r.hint}`);
at(r, h0.s, 8); r.step(0.1);
check('driving past at 8 m/s: not picked up', h0.st === 'wait');
at(r, h0.s, 0.5); r.step(0.1);
check('stopped by them: in the back', h0.st === 'in' && r.aboard === 1, `${h0.st} ${r.aboard}`);
// farther shines faster (a finger's point near, far)
const drain = (d) => { const x = new Missions.Run(D, mk()); D.begin.call(D, x); at(x, 500, 0); const P = x.P; x.aim = { touched: true, point: { x: P.x + Math.cos(P.h) * d, z: P.z + Math.sin(P.h) * d }, o: {} };
  for (let k = 0; k < 30; k++) x.step(0.1); const b = x.bat; for (let k = 0; k < 10; k++) x.step(0.1); return b - x.bat; };
check('the battery: faster the further it shines', drain(K.FAR) > drain(K.NEAR) * 1.2, `${drain(K.FAR).toFixed(3)} ${drain(K.NEAR).toFixed(3)}`);
// all three in, at the rescuers: done; empty: failed; over the finish without them: failed
r.h.forEach(h => { h.st = 'in'; }); r.aboard = 3; at(r, r.base - 5, 8); r.step(0.1);
check('all three in, nearly at the rescuers: not done yet', !r.end);
at(r, r.base + 1, 8); r.step(0.1);
check('all three in, at the rescuers: done', r.end === 'win', r.end);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.bat = 0.01; at(r, 600, 10); r.step(0.5);
check('the battery empty: failed, why', r.end === 'fail' && /Baterija/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.finished = true; at(r, T.finishS, 10); r.step(0.1);
check('over the finish without them: failed', r.end === 'fail', r.why);
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
