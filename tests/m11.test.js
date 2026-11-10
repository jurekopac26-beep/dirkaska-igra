// Special mission 11 · Ognjena reka (js/missions/m11.js, the kit js/missions/kit.js), no browser: its race (Mauna Kea, alone, the 4x4
// MEDVED 4x4), the start K.TOP m below the finish line facing down the road; the three lava flows (coming down the slope, then over the
// road from their side until only K.GAP m are left at their time: closed), the car in the lava slowed and burning, a closed crossing
// ahead: failed; the stones (a red circle on the way ahead, the stone K.WARN s later: in the circle AVTO down K.ROCK, outside nothing),
// AVTO at 0: failed; the ash; at the start line: done; the gauges. Driven with the physics: the mission's own driver (dodging the circles,
// the open side of the flows) down in time with stars, a slow driver too late at a closed crossing.
//   node tests/m11.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm11.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('11'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'maunakea'), T = new Core.Track(TD);
check('11: on Mauna Kea (a test track since the US ones went to the test tracks; the mission stays on it until the user decides), the 4x4 (MEDVED 4x4)', D.track === 'maunakea' && D.car === 'medved' && !!Core.MODELS.find(m => m.id === 'medved'));
check('its race: alone', D.opts(D).tt === true);
const M = Core.MODELS.find(m => m.id === 'medved');
const race = (seed) => { const R = new Core.Race(T, Object.assign({ phys: 'cs', seed }, D.opts(D), { numAI: 0, laps: 1, playerModel: M })); D.made(R); R.start(); return R; };
let R = race(3);
const i0 = T.idx(T.finishS - K.TOP), fw = Math.cos(R.player.h) * T.tx[i0] + Math.sin(R.player.h) * T.tz[i0];
check('the start: K.TOP m below the finish line by the domes, facing down the road', Math.abs(R.player.q.s - (T.finishS - K.TOP)) < 5 && fw < -0.95, `${R.player.q.s.toFixed(0)} ${fw.toFixed(2)}`);

const mk = () => ({ player: { q: { s: T.finishS - K.TOP, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, finished: false }, track: T });
const at = (r, s, d, v) => { const i = T.idx(s), P = r.P; P.q.s = s; P.q.d = d || 0; P.x = T.px[i] + T.nx[i] * (d || 0); P.z = T.pz[i] + T.nz[i] * (d || 0); P.h = Math.atan2(-T.tz[i], -T.tx[i]); P.vx = -T.tx[i] * (v || 0); P.vz = -T.tz[i] * (v || 0); };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('begin: PREHODI ODPRTI 3 / 3, ZAPRE SE (time · km), PEPEL 0 %, AVTO 100 %', r.vals.prehodi.text === '3 / 3' && /^0?3:20 · 2,5 km$/.test(r.vals.zapre.text) && r.vals.pepel.text === '0 %' && r.vals.avto.text === '100 %', JSON.stringify(r.vals));
check('three flows down the road, in order, the last above the valley; their times one after another', r.cx.length === 3 && r.cx.every((c, k) => !k || (c.s < r.cx[k - 1].s && c.c > r.cx[k - 1].c)) && r.cx[2].s > r.sEnd + 300);
// the flows: off the road at first, coming down the slope, over the road from their side, closed at their time
const c0 = r.cx[0];
const flowAt = (t) => { r.t = t; D.flows(r); return c0.e; };
check('a flow before its time: K.FAR m off the road', flowAt(0) === K.FAR && !c0.closed);
check('coming down the slope toward the road', flowAt(c0.a - K.PRE / 2) < K.FAR && flowAt(c0.a - K.PRE / 2) > c0.w);
check('half its time over the road: half of it covered', Math.abs(flowAt(c0.a + K.FLOW / 2) - (c0.w - (2 * c0.w - K.GAP) / 2)) < 1e-6 && !c0.closed, c0.e.toFixed(2));
check('at its time only K.GAP m left on the other side: closed', Math.abs(flowAt(c0.c) - (-c0.w + K.GAP)) < 1e-6 && c0.closed);
// in the lava: slowed, burning
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.nextRock = 1e9;
r.t = r.cx[0].a + K.FLOW / 2; at(r, r.cx[0].s + 2, r.cx[0].side * 2, 10); r.step(0.5);
check('in the lava: AVTO down, the car slowed, the hint', r.inLava && r.hp < 1 - K.BURN * 0.4 && Math.hypot(F.player.vx, F.player.vz) < 10 * 0.5 && /Lava!/.test(r.hint), `${r.hp.toFixed(2)} ${Math.hypot(F.player.vx, F.player.vz).toFixed(1)} ${r.hint}`);
const hp1 = r.hp; at(r, r.cx[0].s + 2, -r.cx[0].side * 4, 10); r.step(0.5);
check('on the open side of it: no burning, the hint names the open side', !r.inLava && r.hp === hp1 && /(levem|desnem) robu|robu/.test(r.hint) || /krog|kamen/.test(r.hint), `${r.hp.toFixed(2)} ${r.hint}`);
at(r, r.cx[0].s - K.LEN, 0, 10); r.step(0.1);
check('below it: passed, ZAPRE SE now the next one', r.cx[0].passed && !r.cx[1].passed && /^\d+:\d\d · 1,\d km$/.test(r.vals.zapre.text), r.vals.zapre.text);
// a crossing closed ahead: failed
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.nextRock = 1e9; at(r, r.cx[0].s + 300, 0, 15); r.t = K.C[0] - 0.05; r.step(0.1);
check('a crossing closed ahead of the car: failed', r.end === 'fail' && /zaprla/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.nextRock = 1e9; at(r, r.cx[0].s - 100, 0, 15); for (const c of r.cx) if (c.k === 0) c.passed = true; r.t = K.C[0] + 1; r.step(0.1);
check('a crossing closed behind the car: on, PREHODI ODPRTI 2 / 3', !r.end && r.vals.prehodi.text === '2 / 3', `${r.end} ${r.vals.prehodi.text}`);
// the stones
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.t = K.R0 - 0.01; const s0 = T.finishS - 600; at(r, s0, 0, 20); r.step(0.05);
const k1 = r.rocks[0];
check('a stone: its circle on the way ahead (where the car will be in K.WARN s), on the road', !!k1 && Math.abs((s0 - k1.s) - 20 * K.WARN) < 3 && Math.abs(k1.d) <= T.wS(k1.s) - 1 + 1e-6 && /krog/.test(r.hint), JSON.stringify(k1 && { ds: s0 - k1.s, d: k1.d }) + ' ' + r.hint);
const hp0 = r.hp; at(r, k1.s, k1.d, 20); r.t = k1.land - 0.01; r.step(0.05);
check('the car in the circle when it lands: AVTO down K.ROCK, shaken', k1.done && k1.hit && Math.abs(hp0 - r.hp - K.ROCK) < 1e-6 && Math.hypot(F.player.vx, F.player.vz) < 20 * 0.6 && /kamen/.test(r.hint), `${r.hp} ${r.hint}`);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.t = K.R0 - 0.01; at(r, s0, 0, 20); r.step(0.05);
const k2 = r.rocks[0]; at(r, k2.s, k2.d > 0 ? k2.d - K.RHIT - 0.5 : k2.d + K.RHIT + 0.5, 20); r.t = k2.land - 0.01; r.step(0.05);
check('the car out of the circle: nothing', k2.done && !k2.hit && r.hp === 1, `${r.hp}`);
check('the next stone a few seconds later', r.nextRock >= K.R0 + K.EVERY[0] - 0.1 && r.nextRock <= K.R0 + K.EVERY[1] + 0.1, String(r.nextRock));
r.hp = K.ROCK * 0.5; const k3 = { s: k2.s, d: 0, x: F.player.x, z: F.player.z, y: 0, t0: r.t, land: r.t, done: false }; r.rocks.push(k3); r.step(0.05);
check('AVTO at 0 from the stones: failed', r.end === 'fail' && /kamni/.test(r.why), r.why);
// the ash, the valley
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.nextRock = 1e9; at(r, T.finishS - 600, 0, 15); r.t = K.ASH / 2; r.step(0.1);
check('the ash thicker as the time goes by', r.vals.pepel.text === '50 %', r.vals.pepel.text);
for (const c of r.cx) c.passed = true; at(r, T.startS - 1, 0, 15); r.step(0.1);
check('at the start line (the valley): done', r.end === 'win');
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.finished = true; r.step(0.1);
check('up over the finish at the summit: failed', r.end === 'fail' && /dolino/.test(r.why), r.why);
// driven with the physics: the mission's own driver down in time; a slow one too late
const drive = (R, o) => {
  const r = new Missions.Run(D, R); D.begin.call(D, r); const P = R.player;
  for (let t = 0; t < 600 && !r.end; t += 1 / 60) { const a = D.pilot(r, o); P.inSteer = a[0]; P.inThr = a[1]; P.inBrk = a[2]; R.step(1 / 60); r.step(1 / 60); }
  return r;
};
r = drive(race(4), {});
check('the mission\'s own driver (dodging the circles, on the open side of the flows): down in time, stars', r.end === 'win' && r.stars >= 2 && r.hp > 0.4, `${r.end} ${r.why} t ${r.t.toFixed(0)} hp ${r.hp.toFixed(2)} hits ${r.hits} burnt ${r.burnt.toFixed(1)}`);
r = drive(race(5), { v: 11, lat: 2.4 });
check('a slow driver: a crossing closes ahead of it, failed', r.end === 'fail' && /zaprla/.test(r.why), `${r.end} ${r.why} t ${r.t.toFixed(0)}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
