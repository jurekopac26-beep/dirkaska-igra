// Special mission 55 · Medvedi na cesti (js/missions/m55.js, the kit js/missions/kit.js), no browser: its race (Beartooth, alone, the
// ranger's off-roader, no damage), the start K.S0 m past the start line, the jam in the right lane and the bears on the road ahead of it
// on a straight, the tourists beside their cars; MEGAFON only near them (in reach: back into their cars), HUPA only with them all in:
// from 25-60 m the bears move off the road, too close or too soon after the last one the mother grows restless, too far nothing; staying
// too close: she charges, failed; the bears off the road: the jam cleared, done; the gauges; driven on the road: stopping 40 m short and
// honking with pauses done, driving up to 15 m failed.
//   node tests/m55.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm55.js'));
const { careful } = require('./lib/drive.js');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('55'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'beartooth'), T = new Core.Track(TD);
check('55: on Beartooth, a real track', D.track === 'beartooth' && !TD.test);
const o = D.opts(D);
check('its race: alone, the ranger\'s off-roader (a copy of the model), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel.id === 'medved' && o.playerModel.vLim === K.VMAX);
check('the jam and the bears on a straight (no bend from 110 m before the bears to 80 m past)', (() => { for (let d = -110; d <= 80; d += 5) if (Math.abs(T.k[T.idx(T.startS + K.SB + d)]) > 0.005) return false; return true; })());

const mk = () => ({ player: { x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, dist: 0, q: { s: 0 }, hitWall: 0, hitCar: 0, finished: false, m: { len: 4.8, wid: 1.95 } }, track: T });
// the ranger at `back` m short of the bears in the left lane, standing
const put = (r, back, d) => { const s = r.sB - back, i = T.idx(s), P = r.P; P.q.s = s; P.x = T.px[i] + T.nx[i] * (d == null ? -r.w * 0.5 : d); P.z = T.pz[i] + T.nz[i] * (d == null ? -r.w * 0.5 : d); P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = 0; P.vz = 0; };
const wait = (r, sec, back) => { for (let t = 0; t < sec - 1e-9 && !r.end; t += 1 / 30) { put(r, back); r.step(1 / 30); } };
const press = (r, back) => { r.btn.n = 1; put(r, back); r.step(1 / 30); };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: MEDVEDI mirni, TURISTI ZUNAJ 3, ZASTOJ 7 vozil, the hint says the megaphone first', r.vals.med.text === 'mirni' && r.vals.tur.text === '3' && r.vals.zas.text === '7 vozil' && /megafonom/.test(r.hint), JSON.stringify(r.vals));
wait(r, 0.5, 150);
check('far from the tourists: the hint says closer', /bliže turistom/.test(r.hint), r.hint);
press(r, 150); wait(r, 3, 150);
check('MEGAFON out of reach: nobody goes back', r.tour.every(q => q.out), String(r.tour.filter(q => q.out).length));
press(r, 40); wait(r, 2.5, 40);
check('MEGAFON from 40 m short of the bears (the tourists in reach): all back in their cars, TURISTI ZUNAJ 0', r.tour.every(q => !q.out) && r.vals.tur.text === '0', r.vals.tur.text);
const d0 = r.bears.map(b => Math.abs(b.d));
press(r, 80); wait(r, 4, 80);
check('HUPA from 80 m: too far, the bears stay', r.bears.every((b, k) => Math.abs(Math.abs(b.d) - d0[k]) < 0.01) && r.ag < 0.05, r.hint);
press(r, 40); wait(r, 0.5, 40);
check('HUPA from 40 m: the bears move off toward the roomier side, the mother calm', r.bears.every(b => Math.abs(b.dt) >= K.STEP) && r.vals.med.text === 'mirni' && /umikajo/.test(r.hint), JSON.stringify(r.bears.map(b => b.dt.toFixed(1))));
press(r, 40);
check('HUPA again at once: too loud, the mother restless', r.ag >= K.LOUD && /Preglasno/.test(r.hint), r.ag.toFixed(2));
wait(r, 4, 40); const ag = r.ag;
check('waiting away from her: she calms down', ag < K.LOUD, ag.toFixed(2));
press(r, 18); wait(r, 0.2, 18);
check('HUPA from 18 m: too close, restless, the hint says back off', r.ag > ag + K.LOUD * 0.9 && /Preblizu/.test(r.hint), `${r.ag.toFixed(2)} ${r.hint}`);
wait(r, 6, 10);
check('staying 10 m from her: she charges, failed', r.end === 'fail' && /nevarna/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
press(r, 40); wait(r, 2.5, 40);
for (let k = 0; k < 6 && !r.end; k++) { press(r, 42); wait(r, K.GAP + 0.5, 42); }
wait(r, 20, 42);
check('the tourists in, honking from 42 m with pauses: the bears off the road, the jam cleared, done', r.end === 'win' && r.vals.zas.text === 'razžen' && r.bears.every(b => Math.abs(b.d) > r.w + K.OFF), `${r.end} ${r.why} ${JSON.stringify(r.bears.map(b => b.d.toFixed(1)))}`);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); wait(r, 0.1, 40);
const P = r.P, sow = r.place(r.bears[0]); P.x = sow.x - 3 * Math.cos(P.h); P.z = sow.z - 3 * Math.sin(P.h); P.vx = 6 * Math.cos(P.h); P.vz = 6 * Math.sin(P.h); r.step(1 / 30);
check('into the mother bear: failed', r.end === 'fail' && /medveda/.test(r.why), r.why);

// on the road: in the left lane past the jam, stopping 40 m short of the bears, the megaphone, the horn with pauses: done; up to 15 m: failed
const race = (seed) => { const R = new Core.Race(T, Object.assign({ phys: 'cs', seed }, { numAI: 0, laps: 1, tt: true, traffic: false }, o)); D.made(R); R.start(); return R; };
const lane = (P, run) => { P.laneBias = P.q.s > run.sB - 260 ? -run.w * 0.5 - T.rl[T.idx(P.q.s)] : 0; };
const stopAt = (back) => (P, run) => { run.autoBtn = true; const v = Math.hypot(P.vx, P.vz), rem = run.sB - back - P.q.s, vt = Math.sqrt(2 * 1.5 * Math.max(0, rem)); if (rem < 200) { P.inThr = v < vt - 0.3 ? 1 : 0; P.inBrk = v > vt + 0.5 ? 1 : 0; } };
let R = race(3); r = new Missions.Run(D, R); D.begin.call(D, r);
check('the start: K.S0 m past the start line', Math.abs(R.player.q.s - (T.startS + K.S0)) < 5, R.player.q.s.toFixed(0));
careful(R, r, { vmax: 60 / 3.6, lat: 2.6, maxT: 200, pre: lane, ctrl: stopAt(40) });
check('past the jam, stopped 40 m short, megaphone, horn with pauses: done, 3 stars', r.end === 'win' && r.stars === 3, `${r.end} ${r.why} t ${r.t.toFixed(0)}`);
R = race(4); r = new Missions.Run(D, R); D.begin.call(D, r);
careful(R, r, { vmax: 60 / 3.6, lat: 2.6, maxT: 200, pre: lane, ctrl: stopAt(15) });
check('up to 15 m from the bears: failed', r.end === 'fail' && /nevarna/.test(r.why), `${r.end} ${r.why}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
