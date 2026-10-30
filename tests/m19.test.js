// Special mission 19 · Pred plimo (js/missions/m19.js, the kit js/missions/kit.js), no browser: its race (Townsville, alone, the doctor's
// white MEDVED), the island in the creek on the left of the low road of Turn 1 (ahead of the yellow stop box: in view upright), the tide's water over the low ground round it (none
// at the start line), rising K.RISE m a second; the stop in the box (too fast: no stop; short of it: no stop), the doctor's walk, the treatment and his
// walk back with the car held; off the low road to the dry with the doctor: done (not while still on the low road); the water over the
// wheels' hubs floats the car sideways, at K.DEEP it drowns: failed; past the island round the lap: failed; the time up: failed; the
// numbers (a good run beats the tide, the tide drowns the low road before the time is up); the gauges.
//   node tests/m19.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm19.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('19'), K = D.K, TD = Core.TRACKS.find(t => t.id === 'townsville');
const T = new Core.Track(TD);
check('19: Townsville, a real track, in the MEDVED', D.track === 'townsville' && !!TD && !TD.test && D.car === 'medved' && !!Core.MODELS.find(m => m.id === 'medved'));
check('the texts and the panel: MORJE (a bar), OTOK, ZDRAVNIK', D.title === 'Pred plimo' && D.rows.map(r => r.k).join() === 'sea,isl,doc' && D.rows[0].bar);
const o = D.opts(D);
check('its race: alone, one lap, no damage, the 4x4 in white', o.tt && o.laps === 1 && o.damage === 0 && o.playerColor === 0xf2f4f6, JSON.stringify(o));
check('the start line at s 0 (the mission\'s s are from it)', (T.startS || 0) === 0, String(T.startS));

// a fake race: the player on the road at s (m from the start line), off the centre line by d
const put = (P, s, d) => { const L = T.len, sa = ((s % L) + L) % L, i = T.idx(sa); P.q = { s: sa, d: d || 0 }; P.x = T.px[i] + T.nx[i] * (d || 0); P.z = T.pz[i] + T.nz[i] * (d || 0); P.roadY = T.hy[i]; };
const mk = (s) => { const p = { vx: 0, vz: 0, w: 0, h: 0, finished: false, locked: false }; put(p, s); return { player: p, track: T }; };
const run = (F) => { const r = new Missions.Run(D, F); D.begin.call(D, r); return r; };
const steps = (r, sec, each) => { for (let k = 0; k < Math.round(sec * 60) && !r.end; k++) { r.step(1 / 60); if (each) each(r); } };

let F = mk(-10), r = run(F);
check('begin: the tide low, the doctor in the car; the panel', r.lvl === K.L0 && r.doc === 'car' && r.vals.sea.text === '0,5 m pod cesto' && r.vals.isl.text === Math.round(K.ISL + 10) + ' m' && r.vals.doc.text === 'v avtu', JSON.stringify(r.vals));
{ const i = T.idx(K.ISL), sc = (r.isl.x - T.px[i]) * T.nx[i] + (r.isl.z - T.pz[i]) * T.nz[i];
  check('the island: left of the road (against the normal), K.OFF m out, on the low road (Turn 1)', K.SIDE === -1 && Math.abs(sc + K.OFF) < 0.01 && T.hy[i] < -0.15 && Math.abs(T.hy[i] - K.LOW) < 0.05, `${sc.toFixed(1)} ${T.hy[i].toFixed(2)}`); }
check('the doctor\'s way: the road\'s edge, the footbridge, the island (all on the left)', r.walk.length === 4 && r.walk.every(p => { const i = T.idx(K.ISL); return (p.x - T.px[i]) * T.nx[i] + (p.z - T.pz[i]) * T.nz[i] < -5; }));
check('the stop box before the footbridge: the island ahead of a car stopped in it', K.STOP + K.ZONE < K.ISL - 5 && K.STOP - K.ZONE > K.DRY[0]);
{ const W = r.W, at = (s, d) => { const i = T.idx(s); return W.at(T.px[i] + T.nx[i] * (d || 0), T.pz[i] + T.nz[i] * (d || 0)); };
  check('the tide\'s water: over the low road and the island, none at the start line nor up the hill past Turn 1', at(K.ISL) === K.L0 && at(K.ISL, K.OFF) === K.L0 && at(0) === -Infinity && at(1000) === -Infinity, `${at(K.ISL)} ${at(0)} ${at(1000)}`);
  check('its rim sinks under the creek\'s own water (no edge to see)', K.L0 + K.RISE * D.limit - K.DROP < K.WY && K.R1 > K.R0); }
steps(r, 10);
check('10 s: the tide up by K.RISE a second, still under the road', Math.abs(r.lvl - (K.L0 + 10 * K.RISE)) < 1e-9 && r.depth === 0 && /pod cesto/.test(r.vals.sea.text), r.vals.sea.text);

// in the stop box: short of it, no stop; too fast, no stop; slowly: the doctor out, the car held
put(F.player, K.STOP - K.ZONE - 3, -2); F.player.vx = 0; r.step(1 / 60);
check('stopped short of the box: the doctor stays in the car', r.doc === 'car');
put(F.player, K.STOP + 2, -2); F.player.vx = K.VSTOP + 3; r.step(1 / 60);
check('in the box too fast: the doctor stays in the car', r.doc === 'car' && /okvirju/.test(r.hint), r.hint);
F.player.vx = 0.5; r.step(1 / 60);
check('stopped in the box: the doctor out, the car held', r.doc === 'out' && F.player.locked && r.vals.isl.text === 'tukaj' && r.vals.doc.text === 'na brvi', JSON.stringify(r.vals));
F.player.vx = 5; r.step(1 / 60);
check('held: the car does not move', F.player.vx === 0 && F.player.locked);
steps(r, K.WALK + 0.1);
check('over the footbridge: the treatment (the share in the panel)', r.doc === 'treat' && /^oskrba \d+ %$/.test(r.vals.doc.text) && F.player.locked, r.doc + ' ' + r.vals.doc.text);
steps(r, K.TREAT / 2);
check('half the treatment: 50 %', r.vals.doc.text === 'oskrba 50 %' || r.vals.doc.text === 'oskrba 49 %' || r.vals.doc.text === 'oskrba 51 %', r.vals.doc.text);
steps(r, K.TREAT / 2 + 0.1);
check('treated: the doctor walks back (the car still held)', r.doc === 'in' && F.player.locked);
steps(r, K.WALK + 0.1);
check('the doctor back in the car: the car free, no win yet (still on the low road)', r.doc === 'back' && !F.player.locked && !r.end && r.vals.doc.text === 'nazaj v avtu' && r.vals.isl.text === 'oskrbljen', `${r.doc} ${r.end}`);
const tBack = r.t;
check('a good run (at the island by 25 s): the doctor back before the sea reaches the wheels', 25 + 2 * K.WALK + K.TREAT < (K.LOW + K.SLIP - K.L0) / K.RISE - 20 && tBack < (K.LOW + K.SLIP - K.L0) / K.RISE, tBack.toFixed(1));
// off the low road forward, to the dry: done
put(F.player, K.DRY[1] + 20, 0); r.step(1 / 60);
check('with the doctor, off the low road to the dry: done (3 stars for a quick run)', r.end === 'win' && r.stars === 3, `${r.end} ${r.t.toFixed(1)} ${r.stars}`);
// or back the way it came
F = mk(K.ISL); r = run(F); r.doc = 'back'; put(F.player, K.DRY[0] - 30, 0); r.step(1 / 60);
check('back the way it came (the wrong way allowed) to the dry: done', r.end === 'win' && F.player.wrongT === 0);
// the doctor not in the car: not done on the dry
F = mk(K.DRY[1] + 30); r = run(F); steps(r, 2);
check('on the dry without the island: not done', !r.end && r.doc === 'car');
// the water over the road: holds the car back, over the hubs it floats it sideways, deep: drowned
F = mk(K.ISL); r = run(F); r.doc = 'back'; r.t = (K.LOW + 0.2 - K.L0) / K.RISE; put(F.player, K.ISL, 0); F.player.vx = 10; r.step(0.1);
check('0.2 m of water on the road: the car held back, not floating', r.depth > 0.15 && r.depth < K.SLIP && Math.hypot(F.player.vx, F.player.vz) < 10 && Math.abs(F.player.q.d) < 1e-9, `${r.depth.toFixed(2)} ${F.player.vx.toFixed(2)}`);
r.t = (K.LOW + K.SLIP + 0.2 - K.L0) / K.RISE; F.player.vx = 0; const x0 = F.player.x, z0 = F.player.z; r.step(0.5);
const i0 = T.idx(K.ISL), side = (F.player.x - x0) * T.nx[i0] + (F.player.z - z0) * T.nz[i0];
check('over the hubs: the tide floats the car sideways, inland (away from the creek)', side < -0.1 && /drseti/.test(r.hint), `${side.toFixed(2)} ${r.hint}`);
check('the gauge red over the hubs', r.vals.sea.col === '#e8452c' && / na cesti$/.test(r.vals.sea.text), JSON.stringify(r.vals.sea));
r.t = (K.LOW + K.DEEP + 0.03 - K.L0) / K.RISE; put(F.player, K.ISL, 0); r.step(1 / 60);
check('K.DEEP of water: the engine drowned, failed', r.end === 'fail' && /zalilo/.test(r.why), r.why);
check('waiting at the island, the tide drowns the low road before the time is up', (K.LOW + K.DEEP - K.L0) / K.RISE < D.limit - 10);
// round the lap to the finish line
F = mk(1500); r = run(F); F.player.finished = true; r.step(1 / 60);
check('over the finish without the island: failed', r.end === 'fail' && /mimo otoka/.test(r.why), r.why);
F = mk(1500); r = run(F); r.doc = 'back'; F.player.finished = true; r.step(1 / 60);
check('over the finish with the doctor back: done', r.end === 'win');
// past the footbridge, the doctor still in the car: the hint to back up
F = mk(K.ISL + 20); r = run(F); r.step(1 / 60);
check('past the footbridge: back up to the box', /vzvratno/.test(r.hint), r.hint);
// the time up
F = mk(-10); r = run(F); r.t = D.limit - 0.01; r.lvl = K.L0; r.step(0.05);
check('the time up: failed', r.end === 'fail' && /časa/.test(r.why), r.why);
check('stars: [3 stars, 2 stars] in order, under the time', D.stars[0] < D.stars[1] && D.stars[1] < D.limit);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
