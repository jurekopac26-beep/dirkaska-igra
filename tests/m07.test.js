// Special mission 07 · Cisterna (js/missions/m07.js, the kit js/missions/kit.js), no browser: its race (Sani Pass, alone, the tanker on
// the off-road truck's physics with its own limiter, 10 m), the start K.S0 m past the start line, the fuel's slosh (none on a straight,
// out of a bend taken fast it leans the tanker and pushes it out of the bend, and keeps swinging after it), slow through a hairpin fine,
// too fast: the tanker rolls over (failed); the top: done; the gauges.
//   node tests/m07.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm07.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('07'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'sani'));
check('07: on Sani Pass, a real track', D.track === 'sani' && !Core.TRACKS.find(t => t.id === 'sani').test);
const o = D.opts(D);
check('its race: alone, the tanker (the off-road truck\'s physics on a copy, 10 m, its own limiter), no damage', o.tt && o.damage === 0 && o.playerModel.vLim === K.VMAX && o.playerModel.len === 10 && Core.MODELS.find(m => m.id === 'truck').len < 6);
const race = new Core.Race(T, Object.assign({ phys: 'cs', seed: 3 }, o));
D.made(race);
check('the start: K.S0 m past the start line, below the hairpins', Math.abs(race.player.q.s - (T.startS + K.S0)) < 5, race.player.q.s.toFixed(0));

const mk = () => ({ player: { q: { s: T.startS + K.S0, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, m: { wid: 2.5, len: 10 }, finished: false }, track: T });
const at = (r, s, v) => { const i = T.idx(s), P = r.P; P.q.s = s; P.x = T.px[i]; P.z = T.pz[i]; P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * v; P.vz = T.tz[i] * v; };
// the sharpest hairpin and a straight
let sH = 0, kH = 0, sS = 0, kS = 1; for (let s = T.startS + K.S0; s < T.startS + T.raceLen - 20; s += 5) { const k = Math.abs(D.bend(T, s)); if (k > kH) { kH = k; sH = s; } if (k < kS) { kS = k; sS = s; } }
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: NAGIB 0 %, PLJUSKANJE 0 %, DO VRHA 2,8 km', r.vals.nagib.text === '0 %' && r.vals.pljusk.text === '0 %' && r.vals.vrh.text === '2,8 km', JSON.stringify(r.vals));
for (let k = 0; k < 60; k++) { at(r, sS, 13); r.step(0.05); }
check('a straight at the limiter: no slosh, no lean', Math.abs(r.slosh) < 0.05 && Math.abs(r.tilt) < 0.05 && !r.end, `${r.slosh.toFixed(3)} ${r.tilt.toFixed(3)}`);
// slow through the hairpin: fine
for (let k = 0; k < 80; k++) { at(r, sH, 3.5); r.step(0.05); }
check('the sharpest hairpin (radius ' + (1 / kH).toFixed(0) + ' m) at 12 km/h: a little lean, no harm', Math.abs(r.tilt) < 0.5 && !r.end, r.tilt.toFixed(2));
// fast into it: the slosh grows, pushes it out of the bend, the lean warns, then it rolls over
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
const side = Math.sign(D.bend(T, sH));
let pushed = 0, warned = false, maxT = 0;
for (let k = 0; k < 40 && !r.end; k++) { at(r, sH, 6.5); const nx = -Math.sin(r.P.h), nz = Math.cos(r.P.h); r.step(0.05); pushed += (r.P.vx * nx + r.P.vz * nz) * -side; if (/nagiba/.test(r.hint)) warned = true; maxT = Math.max(maxT, Math.abs(r.tilt)); }
check('fast into the hairpin: the fuel swings out (PLJUSKANJE up), pushes the tanker out of the bend, the hint warns', Math.abs(r.slosh) > 0.6 && pushed > 0 && warned && r.vals.pljusk.frac > 0.6, `${r.slosh.toFixed(2)} ${pushed.toFixed(2)}`);
check('too fast for long enough: the tanker rolls over (failed)', r.end === 'fail' && /prevrnila/.test(r.why) && maxT >= 1, r.why);
// the slosh keeps swinging after a bend
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
for (let k = 0; k < 20; k++) { at(r, sH, 4.6); r.step(0.05); }
const s1 = r.slosh; let flip = false; for (let k = 0; k < 30; k++) { at(r, sS, 4.6); r.step(0.05); if (Math.sign(r.slosh) !== Math.sign(s1) && Math.abs(r.slosh) > 0.1) flip = true; }
check('out of the bend onto a straight: the fuel swings back the other way before it settles', Math.abs(s1) > 0.3 && flip && !r.end, `${s1.toFixed(2)} ${flip}`);
for (let k = 0; k < 200; k++) { at(r, sS, 4.6); r.step(0.05); }
check('… and settles', Math.abs(r.slosh) < 0.05, r.slosh.toFixed(3));
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); at(r, T.startS + T.raceLen - 50, 5); F.player.finished = true; r.step(0.1);
check('at the top (the finish line): done', r.end === 'win', String(r.end));
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
