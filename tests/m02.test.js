// Special mission 02 · Zlata ura (js/missions/m02.js, the kit js/missions/kit.js: MisKit.ride, hospital), no browser: its race (Newcastle,
// a real track: the mission moved off Monte Carlo, a test track now; alone, one lap, the ambulance on the van's physics with its own
// limiter and softer brakes, no damage), the accident on the coast road on the roomier side, stopping by it: NALOŽI, the van held while
// the crew loads (K.LOAD s); then the pulse from K.HR0 (up with a jolt, a knock; down slowly when smooth; worse with the time), at
// K.HRMAX failed; over the line with the patient: done; without: failed; the gauges; driven on the road: carefully done, at the racing
// pace the patient lost.
//   node tests/m02.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm02.js'));
const { careful } = require('./lib/drive.js');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('02'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'newcastle'), T = new Core.Track(TD);
check('02: on Newcastle, a real track (not on Monte Carlo, a test track)', D.track === 'newcastle' && !TD.test && Core.TRACKS.find(t => t.id === 'monaco').test);
const o = D.opts(D);
check('its race: alone, one lap, the ambulance (the van, its own limiter, softer brakes: a copy), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel.id === 'superkombi' && o.playerModel.vLim === K.VMAX && o.playerModel.brakeK === K.BRK && Core.MODELS.find(m => m.id === 'superkombi').brakeK !== K.BRK);

const mk = () => ({ player: { x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, dist: 0, q: { s: 0 }, hitWall: 0, hitCar: 0, finished: false }, track: T });
const put = (r, s, d, v) => { const i = T.idx(s), P = r.P; P.q.s = s; P.dist = s - T.startS; P.x = T.px[i] + T.nx[i] * d; P.z = T.pz[i] + T.nz[i] * d; P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * v; P.vz = T.tz[i] * v; P.w = 0; };
const steps = (r, sec, f) => { for (let t = 0; t < sec - 1e-9 && !r.end; t += 1 / 60) { if (f) f(t); r.step(1 / 60); } };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the accident on the roomier side of the coast road, at the road\'s edge', Math.abs(Math.hypot(r.site.x - T.px[r.site.i], r.site.z - T.pz[r.site.i]) - (T.wS(r.sA) - 3.2)) < 0.1 && r.site.side === (T.br[r.site.i] >= T.bl[r.site.i] ? 1 : -1));
check('the start: UTRIP —, STANJE čaka pomoč, CILJ nesreča 1,6 km', r.vals.hr.text === '—' && r.vals.stanje.text === 'čaka pomoč' && /^nesreča 1,[67] km$/.test(r.vals.cilj.text), JSON.stringify(r.vals));
const dSide = r.site.side * (T.wS(r.sA) - 6.7);
steps(r, 0.5, () => put(r, r.sA - 40, dSide, 0));
check('stopped 40 m short: not there yet', r.st === 'go' && /Ustavi ob kraju/.test(r.hint), r.hint);
steps(r, 0.5, () => put(r, r.sA, dSide, 3));
check('by it at 11 km/h: not stopped, no loading', r.st === 'go');
steps(r, 0.5, () => put(r, r.sA, dSide, 0));
check('stopped by it: the hint says load', r.st === 'go' && /Naloži/.test(r.hint), r.hint);
r.btn.n = 1; steps(r, 0.1, () => put(r, r.sA, dSide, 0));
check('NALOŽI: the crew loads, the van held', r.st === 'load' && F.player.locked && r.vals.stanje.text === 'nalaganje');
steps(r, K.LOAD, () => { if (r.st === 'load') put(r, r.sA, dSide, 0); });
check('after K.LOAD s: off to the hospital, UTRIP ' + K.HR0 + ', the van free', r.st === 'carry' && !F.player.locked && Math.abs(r.hr - K.HR0) < 1 && /^♥ 13[89] \/ min$/.test(r.vals.hr.text) && /^bolnišnica /.test(r.vals.cilj.text), JSON.stringify(r.vals));
const h0 = r.hr; let s = r.sA;
steps(r, 20, () => { s += 12 / 60; put(r, s, 0, 12); });
check('20 s smooth on a straight: the pulse down', r.hr < h0 - 1, `${h0.toFixed(1)} -> ${r.hr.toFixed(1)}`);
const h1 = r.hr; F.player.hitWall = 6; put(r, s, 0, 12); r.step(1 / 60); const said = r.hint; F.player.hitWall = 0; put(r, s, 0, 12); r.step(1 / 60);
check('a knock: the pulse jumps, the hint says so', r.hr > h1 + 15 && /Trk/.test(said), `${h1.toFixed(1)} -> ${r.hr.toFixed(1)}`);
r.ride.calm = 0.02; steps(r, 1, (t) => { put(r, s, 0, 15); r.P.w = 0.6; });
check('at ' + K.HRMAX + ' a minute: failed, the patient lost', r.end === 'fail' && /ni preživel/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); put(r, 10, 0, 10); F.finished = true; F.player.finished = true; r.step(0.1);
check('over the line without the patient: failed', r.end === 'fail' && /nisi naložil/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.st = 'carry'; r.tLoad = 0; r.ride.calm = 0.8; r.t = 150; put(r, 10, 0, 10); F.player.finished = true; r.step(0.1);
check('over the line with the patient: done, 3 stars', r.end === 'win' && r.stars === 3);

// on the road: to the accident, stopping by it, then carefully to the hospital: done; at the racing pace with the patient: lost
const race = (seed) => { const R = new Core.Race(T, Object.assign({ phys: 'cs', seed }, { numAI: 0, laps: 1, tt: true, traffic: false }, o)); R.start(); return R; };
const lane = (P, run) => { P.laneBias = run.st === 'go' && run.sA - P.q.s < 150 && run.sA - P.q.s > -5 ? run.site.side * (T.wS(run.sA) - 6.7) - T.rl[T.idx(P.q.s)] : 0; };
const stop = (P, run) => { run.autoLoad = true; if (run.st !== 'go') return; const rem = run.sA - P.q.s, v = Math.hypot(P.vx, P.vz), vt = Math.sqrt(2 * 2.5 * Math.max(0, rem)); if (rem < 250 && rem > -10) { P.inThr = v < vt - 0.3 ? 1 : 0; P.inBrk = v > vt + 0.5 ? 1 : 0; } };
let R = race(3); r = new Missions.Run(D, R); D.begin.call(D, r);
careful(R, r, { vmax: 80 / 3.6, lat: 2.6, maxT: 240, pre: lane, ctrl: stop });
check('to the accident, stopped by it, loaded, carefully to the hospital: done, the patient stable', r.end === 'win' && r.hr < 145 && r.stars >= 2, `${r.end} ${r.why} t ${r.t.toFixed(0)} hr ${r.hr && r.hr.toFixed(0)}`);
R = race(4); r = new Missions.Run(D, R); D.begin.call(D, r);
careful(R, r, { vmax: 110 / 3.6, lat: 0, maxT: 240, pre: lane, ctrl: stop });
check('with the patient at the racing pace (the autopilot\'s braking): the patient lost', r.end === 'fail' && /ni preživel/.test(r.why), `${r.end} ${r.why} t ${r.t.toFixed(0)}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
