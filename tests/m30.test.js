// Special mission 30 · Ratrak (js/missions/m30.js, the kit js/missions/kit.js), no browser: its race (Mount Baldy, alone, the snowcat on
// the racing 4x4's physics with its own limiter, no damage), the start K.S0 m past the start line, the cells groomed where the snowcat
// passes on the road (not off it, not standing), the winch hooked on a steep stretch to a post at its top and let go past it, its tension
// by the speed (the drum's pace in the green, faster slack: it slides back, stopped too tight: the cable snaps after K.SNAP s), over the
// finish: done with K.NEED of the road groomed, else failed; the gauges.
//   node tests/m30.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm30.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('30'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'baldy'));
check('30: on Mount Baldy, a real track', D.track === 'baldy' && !Core.TRACKS.find(t => t.id === 'baldy').test);
const o = D.opts(D);
check('its race: alone, the snowcat (the 4x4\'s physics, slow: its own limiter on a copy), no damage', o.tt && o.damage === 0 && o.playerModel && o.playerModel.vLim === K.VMAX && o.playerModel !== Core.MODELS.find(m => m.id === 'truck') && !Core.MODELS.find(m => m.id === 'truck').vLim, JSON.stringify({ vLim: o.playerModel && o.playerModel.vLim }));
const race = new Core.Race(T, Object.assign({ phys: 'cs', seed: 3 }, o));
D.made(race);
check('the start: K.S0 m past the start line, on the road', Math.abs(race.player.q.s - (T.startS + K.S0)) < 5 && Math.abs(race.player.dist - K.S0) < 1, race.player.q.s.toFixed(0));

// a stand-in player on the centre line at s, moving up the road at v m/s
const mk = () => ({ player: { q: { s: T.startS + K.S0, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, finished: false }, track: T });
const at = (r, s, v, d) => { const i = T.idx(s), P = r.P; P.q.s = s; P.q.d = d || 0; P.x = T.px[i] + T.nx[i] * (d || 0); P.z = T.pz[i] + T.nz[i] * (d || 0); P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * v; P.vz = T.tz[i] * v; };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: nothing groomed, the winch free, SMUČARJI OB 7:00', r.done === 0 && r.vals.urejeno.text === '0 %' && r.vals.vitel.text === 'prost' && r.vals.smucarji.text === '7:00', JSON.stringify(r.vals));
// the first steep stretch from the start
let ks = 0; while (ks < r.g.length && r.g[ks] < K.STEEP) ks++;
const sSteep = r.s0 + ks * K.CELL;
check('a steep stretch ahead (over K.STEEP), within 300 m of the start', ks < r.g.length && ks * K.CELL < 300, String(ks * K.CELL));
// grooming: driving on the road grooms, standing or off the road does not
at(r, r.s0 + 10, 0); r.step(0.1);
check('standing: nothing groomed', r.done === 0, String(r.done));
at(r, r.s0 + 10, 6, T.wS(r.s0 + 10) + 5); r.step(0.1);
check('off the road: nothing groomed', r.done === 0, String(r.done));
for (let s = r.s0 + 1; s < sSteep - 2; s += 0.6) { at(r, s, 6); r.step(0.1); }
const before = r.done;
check('along the road: each cell passed groomed, UREJENO in %', before >= Math.floor((sSteep - r.s0) / K.CELL) - 1 && /^\d+ %$/.test(r.vals.urejeno.text) && !r.hook, `${before} ${r.vals.urejeno.text}`);
// the steep stretch: hooked, to a post at its top beside the road
at(r, sSteep + 1, K.VD); r.step(0.1);
check('on the steep stretch: the winch hooked, its post up the road beside it', !!r.hook && r.hook.s > sSteep + 30 && /^\d+ %$/.test(r.vals.vitel.text), JSON.stringify(r.hook));
for (let k = 0; k < 40; k++) { at(r, sSteep + 2 + k * 0.5, K.VD); r.step(0.1); }
check('at the drum\'s pace: in the green (between slack and too tight)', r.ten > K.SLACK && r.ten < K.TIGHT && !r.end, r.ten.toFixed(2));
// faster than the drum: slack, it slides back (pushed down the road, its grip lost)
const s1 = sSteep + 25, i1 = T.idx(s1);
for (let k = 0; k < 30; k++) { at(r, s1, K.VD * 1.8); r.step(0.1); }
const P = r.P, back = P.vx * T.tx[i1] + P.vz * T.tz[i1];
r.step(0.1);
check('faster than the drum: slack, it slides back (pushed down, grip lost), the hint says slower', r.ten < K.SLACK && P.xgl > 0 && P.vx * T.tx[i1] + P.vz * T.tz[i1] < back && /ohlapen/.test(r.hint), `${r.ten.toFixed(2)} ${P.xgl}`);
// stopped: too tight, the cable snaps after K.SNAP s
for (let k = 0; k < 10 * (K.SNAP - 1); k++) { at(r, s1, 0); r.step(0.1); }
check('stopped on the steep stretch: too tight, warned, not snapped yet', r.ten > K.TIGHT && !r.end && /prenapet/.test(r.hint), r.ten.toFixed(2));
for (let k = 0; k < 40; k++) { at(r, s1, 0); r.step(0.1); }
check('too tight for K.SNAP s: the cable snaps, failed', r.end === 'fail' && /strgala/.test(r.why), r.why);
// past the post: let go
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
at(r, sSteep + 1, K.VD); r.step(0.1); const top = r.hook.s;
at(r, top - 2, K.VD); r.step(0.1);
check('at the post: the winch let go', !r.hook && r.vals.vitel.text === 'prost', String(top));
// the finish: done with the road groomed, else failed
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
r.done = Math.ceil(r.cells.length * K.NEED); F.player.finished = true; at(r, r.s1 - 1, 0); r.step(0.1);
check('over the finish with K.NEED groomed: done, stars by the time', r.end === 'win' && r.stars === 3, `${r.end} ${r.stars}`);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
r.done = Math.floor(r.cells.length * 0.5); F.player.finished = true; at(r, r.s1 - 1, 0); r.step(0.1);
check('over the finish with half of it groomed: failed, how much said', r.end === 'fail' && /50 %/.test(r.why), r.why);
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
