// Special mission 33 · Odvoz snega (js/missions/m33.js, the kit js/missions/kit.js), no browser: its race (Montréal, alone, the dump truck on
// the racing truck's physics with its own limiter, no damage, no end at a finish line), the blower on the right lane waiting for a truck
// beside it and moving on with one, the arc's landing left of it, the box under it filling (not beside it, not far off), a full truck
// counted and the blower waiting for the swap (the box empty after it), K.NEED trucks: done; into the blower fast: failed; the gauges.
//   node tests/m33.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm33.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('33'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'montreal'));
check('33: on Montréal, a real track', D.track === 'montreal' && !Core.TRACKS.find(t => t.id === 'montreal').test);
const o = D.opts(D);
check('its race: alone, the dump truck (the racing truck\'s physics, slow: its own limiter on a copy), no damage', o.tt && o.damage === 0 && o.playerModel && o.playerModel.vLim === K.VMAX && Core.MODELS.find(m => m.id === 'titan').vLim === 160, JSON.stringify({ vLim: o.playerModel && o.playerModel.vLim }));

// a stand-in truck: its box `el` m behind the arc's landing along the road, `ew` m across, moving at v
const mk = () => ({ player: { q: { s: 0, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, m: { wid: 2.5 }, finished: false }, track: T });
const put = (r, el, ew, v) => { const i = T.idx(r.fs), tx = T.tx[i], tz = T.tz[i], nx = T.nx[i], nz = T.nz[i], P = r.P;
  const bx = r.land.x - tx * el - nx * ew, bz = r.land.z - tz * el - nz * ew; P.h = Math.atan2(tz, tx); P.x = bx - tx * K.BOX; P.z = bz - tz * K.BOX;
  const q = T.query(P.x, P.z, i, {}); P.q.s = q.s; P.q.d = q.d; P.vx = tx * v; P.vz = tz * v; };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: the blower K.S0 m past the start line on the right lane, the box empty, 0 / 4', Math.abs(r.fs - T.startS - K.S0) < 1e-6 && r.vals.kiper.text === '0 %' && r.vals.polni.text === '0 / 4', JSON.stringify(r.vals));
const lat = (x, z) => { const q = T.query(x, z, T.idx(r.fs), {}); return q.d; };
check('the blower on the right of the centre line, its arc landing on the left of it', Math.abs(lat(r.fx, r.fz) - K.LANE) < 0.3 && Math.abs(lat(r.land.x, r.land.z) - (K.LANE - K.SIDE)) < 0.3, `${lat(r.fx, r.fz).toFixed(2)} ${lat(r.land.x, r.land.z).toFixed(2)}`);
// far behind: it waits
r.P.q.s = r.fs - 60; r.P.q.d = K.LANE - K.SIDE; r.P.x = 1e4; const fs0 = r.fs; r.step(0.5);
check('no truck beside it: the blower waits, the hint says catch up', r.fs === fs0 && !r.near && /Dohiti/.test(r.hint), r.hint);
// beside it, the box under the arc: it fills and the blower moves on
put(r, 0, 0, K.VF); r.step(0.5);
check('the box under the arc: hit, it fills, the blower moves on, CUREK ZADENEŠ', r.hit && r.fill > 0 && r.fs > fs0 && r.vals.curek.text === 'ZADENEŠ', `${r.fill} ${r.vals.curek.text}`);
const f1 = r.fill;
put(r, K.HITL + 0.5, 0, K.VF); r.step(0.5);
check('the box too far back: not hit, the hint says a little forward', !r.hit && r.fill === f1 && /naprej/.test(r.hint), r.hint);
put(r, 0, K.HITW + 0.4, K.VF); r.step(0.5);
check('the box too far left: not hit, the hint says closer to the blower', !r.hit && r.fill === f1 && /desno/.test(r.hint), r.hint);
// full: counted, the swap (the blower waits, nothing fills), then the box empty
r.fill = 0.999; put(r, 0, 0, K.VF); r.step(0.5);
const fsSwap = r.fs;
check('full: one truck counted, the swap begins', r.full === 1 && r.swap > 0 && r.vals.polni.text === '1 / 4' && /naslednji/.test(r.hint), JSON.stringify({ full: r.full, swap: r.swap }));
for (let k = 0; k < Math.ceil(K.SWAP / 0.5) - 1; k++) { put(r, 0, 0, K.VF); r.step(0.5); }
check('during the swap: the blower waits, nothing fills', r.fs === fsSwap && r.fill === 1 && !r.hit, `${r.fs} ${fsSwap}`);
put(r, 0, 0, K.VF); r.step(0.5); put(r, 0, 0, K.VF); r.step(0.5);
check('after the swap: the box empty and filling again', r.fill > 0 && r.fill < 0.05 && r.swap <= 0, String(r.fill));
r.full = K.NEED - 1; r.fill = 0.999; put(r, 0, 0, K.VF); r.step(0.5);
check('the last truck full: done', r.end === 'win' && r.full === K.NEED, `${r.end} ${r.full}`);
// into the blower: a soft touch is a bump, a fast one fails
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
{ const i = T.idx(r.fs), P = r.P; P.h = Math.atan2(T.tz[i], T.tx[i]); P.x = r.fx - T.tx[i] * (K.FL / 2 + 1.0); P.z = r.fz - T.tz[i] * (K.FL / 2 + 1.0); P.q.s = r.fs; P.q.d = K.LANE; P.vx = T.tx[i] * 1.5; P.vz = T.tz[i] * 1.5; r.step(0.1);
  check('into the blower slowly: pushed back, not failed', !r.end && P.vx * T.tx[i] + P.vz * T.tz[i] <= 0.01, String(r.end));
  P.x = r.fx - T.tx[i] * (K.FL / 2 + 1.0); P.z = r.fz - T.tz[i] * (K.FL / 2 + 1.0); P.vx = T.tx[i] * 8; P.vz = T.tz[i] * 8; r.step(0.1);
  check('into the blower fast: failed', r.end === 'fail' && /frezo/.test(r.why), r.why); }
// no finish line: the line crossed is not the end
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.finished = true; r.P.x = 1e4; r.step(0.1);
check('over the line: not the end (the trucks or the time end it)', !r.end, String(r.end));
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
