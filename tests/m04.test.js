// Special mission 04 · Vlečna služba (js/missions/m04.js, the kit js/missions/kit.js), no browser: its race (Pikes Peak, alone, the tow
// truck on TITAN's physics with its own limiter, no damage), the start K.TOP m below the finish line facing down the road; the crew
// hooks the car first (the truck held K.HOOK s); the strap's tension by the braking and the speed (gentle: low; hard from a speed: red,
// it snaps after K.SNAP s: failed); the car behind swung out in a bend too fast and knocked when the truck hits (ŠKODA NA AVTU, 100 %:
// failed); down at the start line: done; the gauges.
//   node tests/m04.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm04.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('04'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'pikes'));
check('04: on Pikes Peak, a real track', D.track === 'pikes' && !Core.TRACKS.find(t => t.id === 'pikes').test);
const o = D.opts(D);
check('its race: alone, the tow truck (TITAN\'s physics on a copy, its own limiter), no damage', o.tt && o.damage === 0 && o.playerModel && o.playerModel.vLim === K.VMAX && o.playerModel !== Core.MODELS.find(m => m.id === 'titan'), JSON.stringify({ vLim: o.playerModel && o.playerModel.vLim }));
const race = new Core.Race(T, Object.assign({ phys: 'cs', seed: 3 }, o));
D.made(race);
const i0 = T.idx(T.finishS - K.TOP), fw = Math.cos(race.player.h) * T.tx[i0] + Math.sin(race.player.h) * T.tz[i0];
check('the start: K.TOP m below the finish line, facing down the road', Math.abs(race.player.q.s - (T.finishS - K.TOP)) < 5 && fw < -0.95, `${race.player.q.s.toFixed(0)} ${fw.toFixed(2)}`);

// a stand-in truck on the centre line at s, going down the road at v m/s
const mk = () => ({ player: { q: { s: T.finishS - K.TOP, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, finished: false, hitWall: 0, hitCar: 0 }, track: T });
const at = (r, s, v, w) => { const i = T.idx(s), P = r.P; P.q.s = s; P.x = T.px[i]; P.z = T.pz[i]; P.h = Math.atan2(-T.tz[i], -T.tx[i]); P.vx = -T.tx[i] * v; P.vz = -T.tz[i] * v; P.w = w || 0; };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: the strap slack, no damage, DO DOLINE in km', r.vals.vrv.text === '12 %' && r.vals.skoda.text === '0 %' && /^6,\d km$/.test(r.vals.dolina.text), JSON.stringify(r.vals));
at(r, T.finishS - K.TOP, 0); r.step(0.1);
check('first the crew hooks the car: the truck held, the hint says so', r.stage === 'hook' && F.player.locked && /pripenja/.test(r.hint), r.hint);
for (let k = 0; k < K.HOOK * 10 + 2; k++) { at(r, T.finishS - K.TOP, 0); r.step(0.1); }
check('after K.HOOK s: towing, the truck let go', r.stage === 'tow' && !F.player.locked, r.stage);
// gentle: down the road at a steady 10 m/s
let s = T.finishS - K.TOP;
for (let k = 0; k < 100; k++) { s -= 1; at(r, s, 10); r.step(0.1); }
check('driving down steadily: the strap low (green)', r.ten < 0.3 && !r.end && r.vals.vrv.text === Math.round(r.ten * 100) + ' %', r.ten.toFixed(2));
// braking gently from a low speed: under the red
let v = 6; for (let k = 0; k < 15; k++) { v = Math.max(0, v - 0.4); s -= v * 0.1; at(r, s, v); r.step(0.1); }
check('braking from a low speed: under the red', r.ten < K.RED && !r.end, r.ten.toFixed(2));
for (let k = 0; k < 40; k++) { s -= 1; at(r, s, 10); r.step(0.1); }
// hard braking from a high speed: red, then it snaps
v = 20; for (let k = 0; k < 6; k++) { s -= 2; at(r, s, v); r.step(0.1); }
let red = false;
for (let k = 0; k < 40 && !r.end; k++) { v = Math.max(8, v - 0.7); s -= v * 0.1; at(r, s, v); r.step(0.1); if (r.ten > K.RED) red = true; }
check('hard braking from a high speed: the strap red, it snaps (failed, why)', red && r.end === 'fail' && /strgala/.test(r.why), `${r.ten.toFixed(2)} ${r.end} ${r.why}`);
// the car behind: a bend too fast swings it (damage), a knock into a wall too; at 100 %: failed
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
for (let k = 0; k < K.HOOK * 10 + 2; k++) { at(r, T.finishS - K.TOP, 0); r.step(0.1); }
s = T.finishS - K.TOP;
for (let k = 0; k < 20; k++) { s -= 0.8; at(r, s, 8, 0.2); r.step(0.1); }
check('a bend at a gentle pace: no damage', r.dmg === 0, r.dmg.toFixed(3));
for (let k = 0; k < 20; k++) { s -= 0.8; at(r, s, 8, 0.8); r.step(0.1); }
const d1 = r.dmg;
check('a bend too fast (6.4 m/s2 across): the car swings out, damaged, the hint says so', d1 > 0 && /zanaša/.test(r.hint), `${d1.toFixed(3)} ${r.hint}`);
at(r, s, 8); F.player.hitWall = 6; r.step(0.1); F.player.hitWall = 0;
check('the truck hits a wall: the car behind knocked', r.dmg > d1 + 0.2 && /^\d+ %$/.test(r.vals.skoda.text), r.vals.skoda.text);
for (let k = 0; k < 6 && !r.end; k++) { at(r, s, 8); F.player.hitWall = 8; r.step(0.1); }
check('at 100 % damage: failed, why', r.end === 'fail' && /poškodovan/.test(r.why), r.why);
// down at the start line: done
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
for (let k = 0; k < K.HOOK * 10 + 2; k++) { at(r, T.finishS - K.TOP, 0); r.step(0.1); }
at(r, T.startS + 3, 6); r.step(0.1); check('nearly down: not done yet', !r.end);
at(r, T.startS - 1, 6); r.step(0.1);
check('down at the start line: done, stars by the time', r.end === 'win' && r.stars === 3, `${r.end} ${r.stars}`);
check('its own driver down the road (tests, pictures): steer, throttle, brake', Array.isArray(D.pilot(r)) && D.pilot(r).length === 3);
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
