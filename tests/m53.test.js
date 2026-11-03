// Special mission 53 · Snežne verige (js/missions/m53.js, the kit js/missions/kit.js), no browser: its race (Los Caracoles, alone, the coach
// on the racing truck's physics with its own limiter, no damage), the start K.S0 m past the start line below the hairpins, the chains (the
// coach held; held for K.FIT s a wheel, let go early none; four on: free), the grip on the snow (full throttle slow spins the wheels and
// loses the drive, a bend too fast slides it), the truck lying across the road (a slanted knock into it fails), the barrier: done; the
// pass closing at the limit: failed; the gauges.
//   node tests/m53.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm53.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('53'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'caracoles'));
check('53: on Los Caracoles, a real track', D.track === 'caracoles' && !Core.TRACKS.find(t => t.id === 'caracoles').test);
const o = D.opts(D);
check('its race: alone, the coach (the racing truck\'s physics, 12 m, slow: its own limiter on a copy), no damage', o.tt && o.damage === 0 && o.playerModel.vLim === K.VMAX && o.playerModel.len === 12 && Core.MODELS.find(m => m.id === 'titan').vLim === 160, JSON.stringify({ vLim: o.playerModel.vLim }));
const race = new Core.Race(T, Object.assign({ phys: 'cs', seed: 3 }, o));
D.made(race);
check('the start: K.S0 m past the start line, below the hairpins', Math.abs(race.player.q.s - (T.startS + K.S0)) < 5, race.player.q.s.toFixed(0));

const mk = () => ({ player: { q: { s: T.startS + K.S0, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, inThr: 0, m: { wid: 2.55, len: 12 }, finished: false }, track: T });
const at = (r, s, v, d) => { const i = T.idx(s), P = r.P; P.q.s = s; P.q.d = d || 0; P.x = T.px[i] + T.nx[i] * (d || 0); P.z = T.pz[i] + T.nz[i] * (d || 0); P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * v; P.vz = T.tz[i] * v; P.w = 0; };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: the chains first, 0 / 4, OPRIJEM 100 %, ZAPORA čez 10 min, POTNIKI 46', r.stage === 'chains' && r.vals.verige.text === '0 / 4' && r.vals.oprijem.text === '100 %' && r.vals.zapora.text === 'čez 10 min' && r.vals.potniki.text === '46', JSON.stringify(r.vals));
// the chains: held long enough, one; let go early, none; the coach held all the while
r.held = true; for (let k = 0; k < 10; k++) r.step(K.FIT / 20); r.held = false; r.step(0.1);
check('let go after half the time: no chain, the coach held', r.chains === 0 && r.fit === 0 && F.player.locked, `${r.chains} ${r.fit}`);
r.held = true; for (let k = 0; k < 21; k++) r.step(K.FIT / 20);
check('held for K.FIT s: one chain on, VERIGE 1 / 4, the coach held, the hint says hold', r.chains === 1 && r.vals.verige.text === '1 / 4' && F.player.locked && /Drži/.test(r.hint), r.vals.verige.text);
r.held = false; r.autoChain = true; for (let k = 0; k < 80 && r.stage === 'chains'; k++) r.step(0.1);
check('four on: off it goes (the coach free)', r.chains === 4 && r.stage === 'drive' && !F.player.locked, `${r.chains} ${r.stage}`);
// the grip: full throttle slow spins the wheels (the drive lost), easy on the gas holds it
const s1 = T.startS + K.S0 + 40;
for (let k = 0; k < 20; k++) { at(r, s1, 2); F.player.inThr = 1; r.step(0.1); }
const spun = r.spin, g1 = r.grip;
at(r, s1, 2); F.player.inThr = 1; r.vf = 2; F.player.vx *= 1.5; F.player.vz *= 1.5; const vBefore = Math.hypot(F.player.vx, F.player.vz); r.step(0.1);
check('full throttle when slow: the wheels spin (OPRIJEM down, the gain in speed partly lost, the grip gone sideways too), the hint says ease off', spun > 0.4 && g1 < 0.7 && Math.hypot(F.player.vx, F.player.vz) < vBefore && F.player.xgl > 0.3 && /popusti plin/.test(r.hint), `${spun.toFixed(2)} ${g1.toFixed(2)}`);
for (let k = 0; k < 30; k++) { at(r, s1, 8); F.player.inThr = 0; r.step(0.1); }
check('off the gas: the grip back', r.spin < 0.05 && r.grip > 0.95, `${r.spin.toFixed(3)} ${r.grip.toFixed(2)}`);
at(r, s1, 12); F.player.w = 0.6; r.step(0.1);
check('a bend too fast (the sideways pull over K.LAT): it slides, the hint says slower', r.slide > 0.35 && r.grip < 0.7 && /drsi/.test(r.hint), `${r.slide.toFixed(2)} ${r.grip.toFixed(2)}`);
// the truck across the road: a slanted knock fails; the left lane past it is free
const sT = T.startS + K.TRUCK, iT = T.idx(sT);
check('the truck: across the right half of the road, the left lane free past it (the coach fits)', (() => { const q = T.query(r.wk.x, r.wk.z, iT, {}); return q.d > 2 && q.d < 4; })(), JSON.stringify(r.wk));
{ let free = true; for (let s = sT - 15; s <= sT + 15; s += 1) { at(r, s, 0, -3.6); if (MisKit.block(r.P, r.wk) > 0) free = false; } check('driven past on the left (3.6 m left of the centre line): no touch', free); }
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.stage = 'drive';
{ const P = r.P; P.h = r.wk.h + Math.PI / 2; P.x = r.wk.x - Math.cos(P.h) * 6.8; P.z = r.wk.z - Math.sin(P.h) * 6.8; P.vx = Math.cos(P.h) * 6; P.vz = Math.sin(P.h) * 6; P.q.s = sT; r.step(0.1); }
check('into the truck\'s side at 6 m/s: failed, the passengers hurt', r.end === 'fail' && /trčil/.test(r.why), r.why);
// the barrier: done; the limit: the pass closed
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.stage = 'drive'; at(r, T.startS + K.END + 1, 10); r.step(0.1);
check('at the barrier before the gallery: done', r.end === 'win', String(r.end));
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.stage = 'drive'; at(r, T.startS + K.S0 + 500, 10); r.t = D.limit - 30; r.step(0.1);
check('half a minute left: ZAPORA in seconds', r.vals.zapora.text === 'čez 30 s' && !r.end, r.vals.zapora.text);
r.t = D.limit; r.step(0.1);
check('the limit: failed, the pass closed', r.end === 'fail' && /zaprli/.test(r.why), r.why);
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
