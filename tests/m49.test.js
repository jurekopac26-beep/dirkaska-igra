// Special mission 49 · Zataknjeno kolo (js/missions/m49.js, the kit js/missions/kit.js), no browser: its race (Suzuka, alone, one run, the
// aerial ladder on the racing truck's physics with its own limiter), the wheel beside the West straight (its cabins round it, people in
// eight of them, all high enough for the ladder), stopped by the wheel: the ladder the player's (the finger, at the ladder's own pace; r.auto here),
// the basket held at a cabin: its people in the basket (four at most), the basket down: on the ground, all down: done; past the wheel,
// the time up: failed; the gauges.
//   node tests/m49.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm49.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('49'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'suzuka'));
check('49: on Suzuka, a real track', D.track === 'suzuka' && !Core.TRACKS.find(t => t.id === 'suzuka').test);
const o = D.opts(D);
check('its race: alone, one run, the aerial ladder (the racing truck slower), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel.id === 'titan' && o.playerModel.vLim < 120, JSON.stringify({ vLim: o.playerModel.vLim }));
const sW = (T.startS + K.AT) % T.len;
const mk = () => { const p = { q: { s: sW - 2000 }, x: 0, z: 0, h: 0, vx: 20, vz: 0, w: 0, finished: false }; return { player: p, track: T }; };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
const full = r.W.cab.filter(c => c.n > 0);
check('the wheel: 16 cabins, people in 8 (2 each), every one 7 m or more over the ground', r.W.cab.length === 16 && full.length === 8 && r.total === 16 && full.every(c => c.ly >= 7), full.map(c => c.ly.toFixed(1)).join(' '));
check('the wheel beside the road (its cabins within the ladder\'s reach of the stopping place)', (() => { const i = T.idx(sW - K.AHEAD); return full.every(c => Math.hypot(c.x - T.px[i], c.y - T.hy[i], c.z - T.pz[i]) < 34); })());
check('begin: the panel (length 7,2 m, 0°, 0 / 16, 0 / 4)', r.vals.len.text === '7,2 m' && r.vals.kot.text === '0°' && r.vals.res.text === '0 / 16' && r.vals.kos.text === '0 / 4', JSON.stringify(r.vals));
r.step(1 / 60);
check('on the way: the hint says how far', /km/.test(r.hint), r.hint);
F.player.q.s = sW - K.AHEAD; F.player.vx = 1; r.step(1 / 60); r.step(1 / 60);
check('stopped by the wheel: the ladder the player\'s, the truck held', r.stage === 'ladder' && F.player.locked === true, r.stage);
// the sliders: the ladder follows at its own pace
r.auto = { lift: 1, ext: 1 }; r.step(1);
check('the ladder sent up and out: it rises and extends at its own pace (not at once)', r.truck.lift > 0.2 && r.truck.lift < 0.35 && r.truck.ext > 0.1 && r.truck.ext < 0.2, `${r.truck.lift.toFixed(2)} ${r.truck.ext.toFixed(2)}`);
check('the basket sways more with the ladder moving', r.sway > 0, r.sway.toFixed(3));
// the basket held at a cabin (the test puts it there: no THREE here)
r.auto = { lift: r.truck.lift / K.LIFT, ext: r.truck.ext };
const g1 = D.target(r); r.tipT = { x: g1.x, y: g1.y, z: g1.z };
for (let i = 0; i < 60 * (K.HOLD + 0.2); i++) r.step(1 / 60);
check('the basket held at a cabin: its two people in the basket', r.inB === 2 && g1.n === 0, `${r.inB} ${g1.n}`);
const g2 = D.target(r); r.tipT = { x: g2.x + K.REACH * 2, y: g2.y, z: g2.z };
for (let i = 0; i < 60 * 3; i++) r.step(1 / 60);
check('too far from the next cabin: nobody steps over', r.inB === 2 && g2.n === 2);
r.tipT = { x: g2.x, y: g2.y, z: g2.z }; for (let i = 0; i < 60 * (K.HOLD + 0.2); i++) r.step(1 / 60);
check('the basket full (4)', r.inB === 4 && r.vals.kos.text === '4 / 4' && /poln/.test(r.hint), r.hint);
r.auto = { lift: 0, ext: 0 }; delete r.tipT; for (let i = 0; i < 60 * 12; i++) r.step(1 / 60);
check('the basket down by the ground: the four on the ground', r.saved === 4 && r.inB === 0 && r.vals.res.text === '4 / 16', `${r.saved} ${r.inB}`);
// everyone down: done
for (const c of r.W.cab) c.n = 0; r.inB = 0; r.saved = r.total; r.step(1 / 60);
check('everyone down: done, the truck let go', r.end === 'win' && F.player.locked === false);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.finished = true; r.step(0.1);
check('over the finish line (a lap on): failed', r.end === 'fail' && /mimo/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); for (let i = 0; i < D.limit * 4 + 4 && !r.end; i++) r.step(0.25);
check('the time up: failed', r.end === 'fail' && /časa/.test(r.why), r.why);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
