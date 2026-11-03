// Special mission 34 · Mestni avtobus (js/missions/m34.js, the kit js/missions/kit.js: MisKit.ride), no browser: its race (Toronto, alone,
// one lap, the bus on the racing truck's physics with its own limiter and soft brakes, no damage), the stops (on straights, on the right),
// stopping at one (the front door at the yellow line, the right side at the kerb, slow): the doors opened (ODPRI VRATA), the bus held
// while the people board, then on to the next; too far from the kerb or short of the line: no doors, the hint says why; a stop driven
// past: missed, +K.PEN s, more than K.MAXMISS: failed; the comfort (the full brake held at speed, a knock) as five stars; ZAMUDA against
// the timetable; done over the line with every stop behind; driven on the road stopping at each: done, never stopping: failed.
//   node tests/m34.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm34.js'));
const { careful } = require('./lib/drive.js');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('34'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'toronto'), T = new Core.Track(TD);
check('34: in Toronto, a real track', D.track === 'toronto' && !TD.test);
const o = D.opts(D);
check('its race: alone, one lap, the bus (12 m, slow, soft brakes: a copy of the model), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel.len === 12 && o.playerModel.vLim === K.VMAX && o.playerModel.brakeK === K.BRK && Core.MODELS.find(m => m.id === 'titan').len !== 12);
check('the stops on straights (no bend within 45 m before, 25 m after), the road wide enough', K.STOPS.every(s => { for (let d = -45; d <= 25; d += 5) if (Math.abs(T.k[T.idx(T.startS + s + d)]) > 0.004) return false; return T.wS(T.startS + s) > 5; }));

const mk = () => ({ player: { x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, dist: 0, hitWall: 0, hitCar: 0, finished: false, m: { len: 12, wid: 2.55 } }, track: T });
// the bus at stop k: its front door `along` m past the line, its right side `kerb` m off the kerb, at v along the road
const put = (r, k, along, kerb, v) => { const p = r.stops[k], i = p.i, d = p.w - kerb - K.WID / 2, P = r.P; P.h = Math.atan2(T.tz[i], T.tx[i]); P.x = p.x + T.tx[i] * (along - K.DX) + T.nx[i] * d; P.z = p.z + T.tz[i] * (along - K.DX) + T.nz[i] * d; P.vx = T.tx[i] * v; P.vz = T.tz[i] * v; P.w = 0; P.q = { s: p.s + along - K.DX }; };
const hold = (r, k, along, kerb, sec) => { for (let t = 0; t < sec - 1e-9 && !r.end; t += 1 / 30) { if (r.st !== 'board') put(r, k, along, kerb, 0); r.step(1 / 30); } };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: POSTAJA 1 / 6, ZAMUDA +0:20 (a little late), UDOBJE ★★★★★', r.vals.post.text === '1 / 6' && r.vals.zam.text === '+0:20' && r.vals.udo.text === '★★★★★', JSON.stringify(r.vals));
hold(r, 0, -4, 0.5, 1);
check('stopped with the door 4 m short of the line: no doors, the hint says so', r.st === 'drive' && /rumeni črti/.test(r.hint), r.hint);
hold(r, 0, 0, 2.5, 1);
check('at the line, 2.5 m off the kerb: no doors, the hint says closer to the kerb', r.st === 'drive' && /pločniku/.test(r.hint), r.hint);
hold(r, 0, 0.5, 0.5, 0.5);
check('at the line by the kerb, stopped: the hint says open the doors', r.st === 'drive' && /Odpri vrata/.test(r.hint), r.hint);
r.btn.n = 1; hold(r, 0, 0.5, 0.5, 0.1);
check('ODPRI VRATA: the people board, the bus held', r.st === 'board' && F.player.locked, r.st);
hold(r, 0, 0.5, 0.5, K.BOARD);
check('after K.BOARD s: on to the next stop (POSTAJA 2 / 6), the bus free, ZAMUDA by the timetable', r.st === 'drive' && r.k === 1 && r.served === 1 && !F.player.locked && r.vals.post.text === '2 / 6' && /^[+−]\d:\d\d$/.test(r.vals.zam.text), JSON.stringify(r.vals));
const t0 = r.t; put(r, 1, K.MISS + 1, 0.5, 8); r.step(1 / 30);
check('the next stop driven past: missed, +' + K.PEN + ' s, on to the one after', r.k === 2 && r.missed === 1 && r.t - t0 > K.PEN - 0.1 && /Zgrešil si postajo/.test(r.hint), `${r.k} ${r.missed} ${(r.t - t0).toFixed(1)} ${r.hint}`);
put(r, 2, K.MISS + 1, 0.5, 8); r.step(1 / 30);
check('two missed: still on', !r.end && r.missed === 2);
put(r, 3, K.MISS + 1, 0.5, 8); r.step(1 / 30);
check('three missed: failed', r.end === 'fail' && /preveč postaj/.test(r.why), r.why);
// the comfort: the full brake held at speed (~3.8 m/s2) drops it, a knock too
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
for (let t = 0, v = 12; t < 2.5; t += 1 / 60) { v -= 3.8 / 60; put(r, 0, -200 + t * 10, 3, v); r.step(1 / 60); }
check('the full brake held from 43 km/h: a jolt, the hint says brake gently, the comfort a star less', r.ride.n >= 1 && r.vals.udo.text === '★★★★☆' && /Zaviraj mehko/.test(r.hint), `${r.ride.n} ${r.ride.calm.toFixed(3)} ${r.vals.udo.text} ${r.hint}`);
F.player.hitWall = 6; put(r, 0, -150, 3, 5); r.step(1 / 60); F.player.hitWall = 0;
check('a knock: the comfort down more', r.ride.calm < 0.7, r.vals.udo.text);
r.ride.calm = 0.01; for (let t = 0; t < 1; t += 1 / 60) { put(r, 0, -100, 3, 12 - t * 4); r.step(1 / 60); }
check('the comfort at 0: failed, the passengers fell', r.end === 'fail' && /padli/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.k = 3; F.player.finished = true; r.step(0.1);
check('over the line with stops still ahead: failed', r.end === 'fail' && /vseh postajah/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.k = r.stops.length; r.t = 300; F.player.finished = true; r.step(0.1);
check('over the line with every stop behind: done, 3 stars', r.end === 'win' && r.stars === 3);

// on the road: to the kerb before each stop, braking in taps so the door stops at the line, the doors opened: done; never stopping: failed
const race = (seed) => { const R = new Core.Race(T, Object.assign({ phys: 'cs', seed }, { numAI: 0, laps: 1, tt: true, traffic: false }, o)); R.start(); return R; };
const lane = (P, run) => { const p = run.stops[run.k]; if (!p) { P.laneBias = 0; return; } P.laneBias = D.door(run).along > -150 ? (p.w - K.WID / 2 - 0.5) - T.rl[p.i] : 0; };
const stop = (P, run) => { run.autoDoor = true; const p = run.stops[run.k]; if (!p || run.st === 'board') return; const A = D.door(run).along; if (A < -150 || A > 2) return; const v = Math.hypot(P.vx, P.vz), vt = Math.sqrt(2 * 1.2 * Math.max(0, -A - 0.2)); if (v > vt + 0.5) { P.inThr = 0; P.inBrk = 1; } else if (v < vt - 0.3 && v < 9) { P.inThr = 1; P.inBrk = 0; } else { P.inThr = 0; P.inBrk = 0; } };
let R = race(3); r = new Missions.Run(D, R); D.begin.call(D, r);
careful(R, r, { vmax: 40 / 3.6, lat: 2.6, maxT: 600, pre: lane, ctrl: stop });
check('stopping at each stop by the kerb, the doors at the line: done, every stop served, comfortable, 3 stars', r.end === 'win' && r.served === K.STOPS.length && r.ride.calm > 0.6 && r.stars === 3, `${r.end} ${r.why} t ${r.t.toFixed(0)} served ${r.served} ${r.vals.udo.text} ${r.vals.zam.text}`);
R = race(4); r = new Missions.Run(D, R); D.begin.call(D, r);
careful(R, r, { vmax: 40 / 3.6, lat: 2.6, maxT: 600 });
check('never stopping: three stops missed, failed', r.end === 'fail' && /preveč postaj/.test(r.why), `${r.end} ${r.why}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
