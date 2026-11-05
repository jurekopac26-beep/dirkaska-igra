// Special mission 51 · Dinozaver na tovornjaku (js/missions/m51.js, the kit js/missions/kit.js), no browser: its race (Crystal Palace, one
// lap alone, the low-loader on the racing truck's physics with its own limiter), the height (raised K.HI, lowered K.LO and slow), the
// railway bridge (raised into it: failed; lowered: under it), the branches (low towards the edges: down the middle clear, at the side a hit
// costs the statue), the parked cars (a knock costs it), PROSTOR at the next low thing, too many hits: failed; the finish line: done.
//   node tests/m51.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm51.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('51'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'cpalace'));
check('51: on Crystal Palace, a real track', D.track === 'cpalace' && !Core.TRACKS.find(t => t.id === 'cpalace').test);
const o = D.opts(D);
check('its race: one lap alone, the low-loader (the racing truck\'s physics on a copy, 14 m, its own limiter), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel.vLim === K.VMAX && o.playerModel.len === 14 && Core.MODELS.find(m => m.id === 'titan').vLim === 160);
const mk = () => ({ player: { q: { s: T.startS + 100, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, m: Object.assign({}, o.playerModel), finished: false }, track: T });
const at = (r, s, v, d) => { const i = T.idx(s), P = r.P; P.q.s = s; P.q.d = d || 0; P.x = T.px[i] + T.nx[i] * (d || 0); P.z = T.pz[i] + T.nz[i] * (d || 0); P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * v; P.vz = T.tz[i] * v; };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: VIŠINA TOVORA 4,6 m, DINOZAVER 100 %', r.vals.visina.text === '4,6 m' && r.vals.dino.text === '100 %', JSON.stringify(r.vals));
// the bridge ahead: PROSTOR negative raised, the hint says lower; lowered: positive, slow
const sB = T.startS + K.BRIDGE;
at(r, sB - 80, 10); r.step(0.1);
check('the bridge 80 m ahead, raised: PROSTOR −0,25 m POD MOSTOM, the hint says lower it', /^−0,25 m POD MOSTOM/.test(r.vals.prostor.text) && /spusti podvozje/.test(r.hint), r.vals.prostor.text);
r.toggle = true; for (let k = 0; k < 30; k++) { at(r, sB - 80, 4); r.step(0.1); }
check('lowered: 4,2 m, PROSTOR +0,15 m, the limiter at K.VLO', r.vals.visina.text === '4,2 m ↓' && /^\+0,15 m/.test(r.vals.prostor.text) && F.player.m.vLim === K.VLO, r.vals.visina.text + ' ' + r.vals.prostor.text);
for (let s = sB - 20; s <= sB + 20; s += 1) { at(r, s, 4); r.step(0.05); }
check('lowered under the bridge: through, no harm', !r.end && r.hp === 1, String(r.end));
r.toggle = true; for (let k = 0; k < 30; k++) { at(r, sB + 60, 10); r.step(0.1); }
check('raised again past it: 4,6 m, the limiter back at K.VMAX', r.vals.visina.text === '4,6 m' && F.player.m.vLim === K.VMAX);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
for (let s = sB - 30; s <= sB && !r.end; s += 1) { at(r, s, 8); r.step(0.05); }
check('raised into the bridge: failed', r.end === 'fail' && /most/.test(r.why), r.why);
// the branches: low towards the edges
check('the branches over the middle: room for the raised statue (|d| up to ~1 m), not 2 m aside; lowered 2 m aside fine', D.branchAt(0.9 + K.HALF) > K.HI && D.branchAt(2 + K.HALF) < K.HI && D.branchAt(2 + K.HALF) > K.LO);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
const sT = T.startS + K.TREES[0];
for (let s = sT - 40; s <= sT + 40; s += 1) { at(r, s, 8, 0.3); r.step(0.05); }
check('down the middle under the trees: no harm', r.hp === 1 && !r.end, r.hp.toFixed(2));
for (let s = sT + 40; s <= sT + 60; s += 1) { at(r, s, 8, 2.5); r.step(0.05); }
const sT2 = T.startS + K.TREES[1]; at(r, sT2 - 30, 8, 2.5); r.step(0.05);
check('PROSTOR before the next trees 2,5 m aside: negative (VEJE), the hint says the middle', /^−.* VEJE$/.test(r.vals.prostor.text) && /sredini/.test(r.hint), r.vals.prostor.text + ' | ' + r.hint);
for (let s = sT2 - 30; s <= sT2 + 30; s += 1) { at(r, s, 8, 2.5); r.step(0.05); }
check('2,5 m aside under them: one hit (DINOZAVER 75 %)', Math.abs(r.hp - (1 - K.HB)) < 1e-9 && r.vals.dino.text === '75 %', r.vals.dino.text);
// the parked cars
const c0 = r.cars[0];
check('the parked cars: by the edge, the middle of the road free', r.cars.every(c => { const q = T.query(c.x, c.z, T.idx(c.s), {}); return Math.abs(q.d) > 2.4; }));
{ let free = true; for (let s = c0.s - 20; s <= c0.s + 20; s += 1) { at(r, s, 0, -0.5); if (MisKit.block(r.P, c0) > 0) free = false; } check('driven past them in the middle: no touch', free); }
{ const P = r.P, i = T.idx(c0.s - 9); at(r, c0.s - 9, 6, 3.2); P.q.s = c0.s - 9; r.step(0.05); for (let k = 0; k < 6; k++) { P.x += P.vx * 0.1; P.z += P.vz * 0.1; P.q.s += 0.6; r.step(0.05); } }
check('into a parked car: DINOZAVER down by K.HC more', Math.abs(r.hp - (1 - K.HB - K.HC)) < 1e-9, r.hp.toFixed(2));
r.hp = 0.1; for (let s = sT2 - 30; s <= sT2 + 30 && !r.end; s += 1) { at(r, s, 8, 2.5); r.step(0.05); }
check('one hit too many: failed, the statue broken', r.end === 'fail' && /poškodovan/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.finished = true; r.step(0.1);
check('over the finish line: done', r.end === 'win', String(r.end));
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
