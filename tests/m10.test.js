// Special mission 10 · Pobegla čreda (js/missions/m10.js, the kit js/missions/kit.js), no browser: its race (Harju, alone, the pickup on the
// off-roader's physics with its own limiter, no damage), the start behind the herd on the gravel path, the cows (in the path's frame: on
// it and beside it), the pen on the path's right with its gate; the cows walk on ahead of the pickup following them, left alone they
// spread toward the trees and are lost past the wall, the pickup fast near them scatters them; through the gate into the pen (the fence
// elsewhere keeps them out); all in: done; more than K.LOSE lost: failed; the gauges; driven on the road: slowly behind the herd, done;
// fast into it or standing: failed.
//   node tests/m10.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm10.js'));
const { careful } = require('./lib/drive.js');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('10'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'harju'), T = new Core.Track(TD);
check('10: on Harju, a real track', D.track === 'harju' && !TD.test);
const o = D.opts(D);
check('its race: alone, the pickup (a copy of the model, slow), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel.id === 'medved' && o.playerModel.vLim === K.VMAX);
check('the herd and the pen on the path through the park (no tight bend from the start to the pen), the pen before the finish', (() => { for (let s = K.S0; s <= K.PEN + K.PL; s += 5) if (Math.abs(T.k[T.idx(T.startS + s)]) > 0.04) return false; return true; })() && K.PEN + K.PL < T.finishS - T.startS);

const mk = () => ({ player: { x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, dist: 0, q: { s: 0 }, hitWall: 0, hitCar: 0, finished: false }, track: T });
const put = (r, s, d, v) => { const i = T.idx(s), P = r.P; P.q.s = s; P.x = T.px[i] + T.nx[i] * (d || 0); P.z = T.pz[i] + T.nz[i] * (d || 0); P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * (v || 0); P.vz = T.tz[i] * (v || 0); };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: V OGRADI 0 / 9, V GOZDU 0 / 3, DO OGRADE ' + (K.PEN - K.S0) + ' m', r.vals.pen.text === '0 / 9' && r.vals.lost.text === '0 / 3' && r.vals.gate.text === (K.PEN - K.S0) + ' m', JSON.stringify(r.vals));
check('nine cows between K.C0 and K.C1, on the path and beside it (within its walls)', r.cows.length === 9 && r.cows.every(c => c.s >= T.startS + K.C0 && c.s <= T.startS + K.C1 + 10 && Math.abs(c.d) <= r.wall(c.s, c.d) + 1.5));
// a cow alone ahead of the pickup following it at 9 m: it walks on, toward the path's middle
const one = (r, k) => { r.cows.forEach((c, j) => { if (j !== k) { c.st = 'pen'; } }); return r.cows[k]; };
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); let c = one(r, 0); c.s = T.startS + 1950; c.d = 3; r.pin = 0;
for (let t = 0; t < 5; t += 1 / 30) { put(r, c.s - 9, 0, 1.5); r.step(1 / 30); }
check('followed at 9 m: the cow walks on ahead, on the path', c.s > T.startS + 1955 && Math.abs(c.d) < r.wall(c.s, c.d) && c.st === 'free', `${(c.s - T.startS).toFixed(1)} ${c.d.toFixed(2)}`);
const s1 = c.s; for (let t = 0; t < 4; t += 1 / 30) { put(r, c.s - 60, 0, 0); r.step(1 / 30); }
check('left alone: it stops going on and wanders off sideways', Math.abs(c.s - s1) < 3 && Math.abs(c.d) > 1.0, `${(c.s - s1).toFixed(1)} ${c.d.toFixed(2)}`);
for (let t = 0; t < 60 && c.st === 'free'; t += 1 / 30) { put(r, c.s - 60, 0, 0); r.step(1 / 30); }
check('left alone long: past the wall into the forest, lost (V GOZDU 1 / 3)', c.st === 'lost' && r.vals.lost.text === '1 / 3', `${c.st} ${c.d.toFixed(1)}`);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); c = one(r, 0); c.s = T.startS + 1950; c.d = 0.5;
put(r, c.s - 12, 0, 10); r.step(1 / 30);
check('the pickup at 36 km/h 12 m behind it: the cow bolts sideways, the hint says too fast', c.scT > 0 && /Prehitro/.test(r.hint), `${c.scT} ${r.hint}`);
// the pen: through the gate in; along the fence beside it: kept out
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); c = one(r, 0); c.s = r.gs - 3; c.d = 0; r.pin = 0;
for (let t = 0; t < 8 && c.st === 'free'; t += 1 / 30) { put(r, c.s - 30, 0, 0); r.step(1 / 30); }
check('at the gate: the cow goes into the pen; all in: done', c.st === 'pen' && r.pin === 1 && r.end === 'win', `${c.st} ${r.end}`);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); c = one(r, 0); c.s = r.gs + K.GATE + 2; c.d = r.w0 - 1; c.scT = 3; c.sc = 1;
for (let t = 0; t < 0.8; t += 1 / 30) { put(r, c.s - 30, 0, 0); r.step(1 / 30); }
check('bolting at the fence beside the gate: kept out of the pen', c.st !== 'pen' && c.d <= r.w0 - 0.5, `${c.st} ${c.d.toFixed(2)}`);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.cows.slice(0, 3).forEach(c => { c.d = 30; }); put(r, T.startS + K.S0, 0, 0); r.step(1 / 30);
check('three lost: failed', r.end === 'fail' && /gozd/.test(r.why), r.why);

// on the road: slowly behind the herd (8 m behind the last cow, at most 13 km/h), waiting at the pen: done; fast into it, or standing: failed
const race = (seed) => { const R = new Core.Race(T, Object.assign({ phys: 'cs', seed }, { numAI: 0, laps: 1, tt: true, traffic: false }, o)); D.made(R); R.start(); return R; };
const lane = (P, run) => { const f = run.cows.filter(c => c.st === 'free'); if (!f.length) return; const md = f.reduce((a, c) => a + c.d, 0) / f.length; P.laneBias = Math.max(-2, Math.min(2, md * 0.7)) - T.rl[T.idx(P.q.s)]; };
const herd = (P, run) => { const f = run.cows.filter(c => c.st === 'free'); if (!f.length) return; const me = D.me(run), sr = Math.min(...f.map(c => c.s)), v = Math.hypot(P.vx, P.vz);
  if (sr > run.gs - K.LURE + 4) { P.inThr = 0; P.inBrk = v > 0.3 ? 1 : 0; return; } const vt = Math.max(0, Math.min(3.5, (sr - 8 - me.s) * 0.4)); P.inThr = v < vt - 0.2 ? 1 : 0; P.inBrk = v > vt + 0.6 ? 1 : 0; };
let R = race(3); r = new Missions.Run(D, R); D.begin.call(D, r);
check('the start: K.S0 m past the start line, behind the herd', Math.abs(R.player.q.s - (T.startS + K.S0)) < 5 && R.player.q.s < Math.min(...r.cows.map(c => c.s)) - 20, R.player.q.s.toFixed(0));
careful(R, r, { vmax: 20 / 3.6, lat: 2.6, maxT: 300, pre: lane, ctrl: herd });
check('slowly behind the herd, waiting at the pen: all nine in, done, 3 stars', r.end === 'win' && r.pin === 9 && r.stars === 3, `${r.end} ${r.why} t ${r.t.toFixed(0)} in ${r.pin} lost ${r.lost}`);
R = race(4); r = new Missions.Run(D, R); D.begin.call(D, r);
careful(R, r, { vmax: 30 / 3.6, lat: 2.6, maxT: 300 });
check('at 30 km/h into the herd: scattered, three lost, failed', r.end === 'fail' && /gozd/.test(r.why), `${r.end} ${r.why} t ${r.t.toFixed(0)}`);
R = race(5); r = new Missions.Run(D, R); D.begin.call(D, r);
careful(R, r, { vmax: 0, lat: 0, maxT: 300 });
check('standing at the start: the cows wander off into the forest, failed', r.end === 'fail' && /gozd/.test(r.why) && r.t > 15, `${r.end} t ${r.t.toFixed(0)}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
