// Special mission 43 · Vroče zavore (js/missions/m43.js, the kit js/missions/kit.js), no browser: its race (Rio do Rastro, alone, the
// heavy truck on the racing truck's physics), the start at the top facing down (the road the other way), the gears (NIŽJE / VIŠJE: the
// limiter the gear's, a lower one only slow enough), the engine braking (stronger in a lower gear), the brakes' heat (braking heats them,
// hot they fade, gone: no braking until they cool), the escape lane (the sand slows the truck hard and cools the brakes), into a bend too
// fast or over K.RUN: failed; the valley: done; the gauges.
//   node tests/m43.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm43.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('43'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'rastro'));
check('43: on Rio do Rastro, a real track', D.track === 'rastro' && !Core.TRACKS.find(t => t.id === 'rastro').test);
const o = D.opts(D);
check('its race: alone, the truck (the racing truck\'s physics on a copy, heavy, its limiter the 3rd gear\'s), no damage', o.tt && o.damage === 0 && o.playerModel.vLim === K.VG[2] && o.playerModel.mass > 20000 && Core.MODELS.find(m => m.id === 'titan').vLim === 160);
const race = new Core.Race(T, Object.assign({ phys: 'cs', seed: 3 }, o));
D.made(race);
const P0 = race.player, i0 = T.idx(T.startS + K.S0);
check('the start: K.S0 m past the start line (high up), facing down the road', Math.abs(P0.q.s - (T.startS + K.S0)) < 5 && Math.cos(P0.h - Math.atan2(T.tz[i0], T.tx[i0])) < -0.99 && T.hy[i0] - T.hy[T.idx(T.startS + K.END)] > 250, P0.q.s.toFixed(0));

const mk = () => ({ player: { q: { s: T.startS + K.S0, d: 0, tx: 1, tz: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, inThr: 0, inBrk: 0, gradeNow: 0, m: Object.assign({}, o.playerModel), finished: false }, track: T });
// down the road at s, v m/s, d m across (the grade from the heights)
const at = (r, s, v, d) => { const i = T.idx(s), P = r.P, h = Math.atan2(T.tz[i], T.tx[i]) + Math.PI; P.q.s = s; P.q.d = d || 0; P.q.tx = T.tx[i]; P.q.tz = T.tz[i]; P.x = T.px[i] + T.nx[i] * (d || 0); P.z = T.pz[i] + T.nz[i] * (d || 0); P.h = h; P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v;
  P.gradeNow = (T.hy[T.idx(s + 5)] - T.hy[T.idx(s - 5)]) / 10; };
const spd = (r) => Math.hypot(r.P.vx, r.P.vz);
let sS = 0, kS = 1, sH = 0, kH = 0; for (let s = T.startS + K.END + 50; s < T.startS + K.S0 - 50; s += 5) { const i = T.idx(s - 6), j = T.idx(s + 6); let a = Math.atan2(T.tz[j], T.tx[j]) - Math.atan2(T.tz[i], T.tx[i]); a = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); if (a < kS && (T.hy[T.idx(s + 5)] - T.hy[T.idx(s - 5)]) > 0.9 && D.rampAt(T, s, 0) < 0 && D.rampAt(T, s, -3) < 0) { kS = a; sS = s; } if (a > kH) { kH = a; sH = s; } }
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: ZAVORE 0 %, PRESTAVA 3, DO DOLINE 3,1 km', r.vals.zavore.text === '0 %' && r.vals.prestava.text === '3' && r.vals.dol.text === '3,1 km', JSON.stringify(r.vals));
// the gears
at(r, sS, 15); D.shift(r, -1);
check('at 54 km/h no 2nd gear (over 1.1 x its 34 km/h): still 3rd, the hint says brake first', r.gear === 3 && r.warnT > 0, String(r.gear));
r.step(0.05); check('… the hint', /najprej zaviraj/.test(r.hint), r.hint);
at(r, sS, 8); D.shift(r, -1);
check('at 29 km/h: down to 2nd, the limiter 34 km/h', r.gear === 2 && F.player.m.vLim === 34, String(r.gear));
D.shift(r, 1); D.shift(r, 1); D.shift(r, 1); D.shift(r, 1);
check('up to 5th and no further, the limiter 82 km/h', r.gear === 5 && F.player.m.vLim === 82);
// the engine braking off the throttle on a steep straight: 2nd holds the truck back more than 5th
const coast = (g) => { const x = mk(), q = new Missions.Run(D, x); D.begin.call(D, q); q.gear = g; at(q, sS, 14); const v0 = spd(q); q.step(1); return spd(q) - v0; };
const d2 = coast(2), d5 = coast(5);
check('down the steep road off the throttle: in 2nd the truck slows, in 5th it speeds up (its weight)', d2 < 0 && d5 > 0, `${d2.toFixed(2)} ${d5.toFixed(2)}`);
// the brakes: braking heats them, hot they fade, gone: none
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
for (let k = 0; k < 20; k++) { at(r, sS, 15); F.player.inBrk = 1; r.step(0.05); }
check('a second of full braking at 54 km/h: ZAVORE up to ' + r.vals.zavore.text, r.br.heat > 0.15 && r.br.heat < 0.6, r.br.heat.toFixed(2));
for (let k = 0; k < 200 && !r.gone; k++) { at(r, sS, 15); F.player.inBrk = 1; r.step(0.05); }
check('braking on and on: the brakes gone, ZAVORE ODPOVEDALE, the hint says the escape lane', r.gone && r.vals.zavore.text === 'ODPOVEDALE' && /izletni pas/.test(r.hint), r.vals.zavore.text);
at(r, sS, 15); F.player.inBrk = 1; const vb = spd(r); r.step(0.1);
check('gone: the brake pedal does nothing (only the engine and the slope)', spd(r) >= vb - 0.12, `${vb.toFixed(2)} -> ${spd(r).toFixed(2)}`);
// the escape lane: the sand stops it and cools the brakes
const [ra, rb] = K.RAMPS[0], sR = T.startS + (ra + rb) / 2;
check('the escape lanes: on the right half going down (the side of -n), the left half free', D.rampAt(T, sR, -2.5) === 0 && D.rampAt(T, sR, 2) < 0);
const h0 = r.br.heat; let tStop = 0; F.player.inBrk = 0; at(r, T.startS + rb, 15, -2.5); for (let k = 0; k < 200 && spd(r) > 0.5; k++) { const v = spd(r), s = F.player.q.s - v * 0.05; at(r, s, v, -2.5); r.step(0.05); tStop += 0.05; }
check('into the escape lane at 54 km/h: stopped in the sand within its length, the hint says so', spd(r) <= 0.5 && F.player.q.s > T.startS + ra && /Izletni pas/.test(r.hint), `${tStop.toFixed(1)} s, s=${(F.player.q.s - T.startS).toFixed(0)}`);
for (let k = 0; k < 400 && r.gone; k++) { at(r, F.player.q.s, 0, -2.5); r.step(0.1); }
check('standing in it: the brakes cool and come back', !r.gone && r.br.heat < h0, r.br.heat.toFixed(2));
// failures: too fast, into a bend too fast
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); at(r, sS, (K.RUN + 2) / 3.6); r.step(0.05);
check('over K.RUN km/h: failed, the truck ran away', r.end === 'fail' && /ušel/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); at(r, sH, 12); r.step(0.05);
check('into the sharpest hairpin at 43 km/h: off the road, failed', r.end === 'fail' && /zletel/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); at(r, sH, 5); r.step(0.05);
check('… at 18 km/h: fine', !r.end, String(r.end));
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); at(r, T.startS + K.END - 1, 8); r.step(0.05);
check('in the valley (K.END): done', r.end === 'win', String(r.end));
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
