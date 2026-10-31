// Special mission 37 · Poplava (js/missions/m37.js, the kit js/missions/kit.js), no browser: its race (Bang Saen, alone, in the rain, the
// amphibian on the MEDVED's physics), the houses (by the road, behind its barriers, their roofs over the water), the water rising (+5 cm a
// minute), deep water: it swims (slow, the current toward the sea), the throw (stopped by a house, near enough: the ring, a person down the
// line onto the deck; too fast or too far: none; drifted off: the line slips), the dry ground at the hairpin (stopped: they step out), all
// on dry ground: done; the time up or driven round to the finish: failed; the gauges.
//   node tests/m37.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm37.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('37'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'bangsaen'), T = new Core.Track(TD);
check('37: on Bang Saen, a real track', D.track === 'bangsaen' && !!TD && !TD.test);
const o = D.opts(D);
check('its race: alone, one run, in the rain, the amphibian on the MEDVED (slower), no damage', o.tt && o.laps === 1 && o.rain === 1 && o.damage === 0 && o.playerModel.id === 'medved' && o.playerModel.vLim === 70, JSON.stringify({ tt: o.tt, rain: o.rain, m: o.playerModel.id }));
check('8 people on 6 houses; 10 minutes', K.N === 8 && K.H === 6 && D.limit === 600 && D.stars[0] < D.stars[1] && D.stars[1] < D.limit);
const at = (s) => { const i = T.idx((T.startS + s) % T.len); return { i, x: T.px[i], z: T.pz[i], y: T.hy[i], h: T.hd[i] }; };
const lvlEnd = K.L0 + K.RISE * K.LIMIT;
// the houses: by the road at their s, 10-18 m off its centre line (behind the barriers at ~8 m, within reach of the throw), the roofs
// well over the water, in the order of the road; the hairpin dry the whole time, the start deep (it swims)
const lat = D.HOUSES.map(([s, x, z]) => { const q = T.query(x, z, at(s).i, {}); return { ds: Math.abs(q.s - (T.startS + s) % T.len), d: Math.abs(q.d) }; });
check('the houses by the road: at their s, 10-18 m from the centre line', lat.every(l => l.ds < 3 && l.d > 10 && l.d < 18), JSON.stringify(lat.map(l => l.d.toFixed(1))));
check('the roofs over the water at the end (by 2.5 m and more), the houses in the order of the road between the start and the dry ground', D.HOUSES.every(h => h[3] > lvlEnd + 2.5) && D.HOUSES.every((h, k) => h[0] > K.S0 && h[0] < K.DRY[0] && (!k || h[0] > D.HOUSES[k - 1][0])));
let dryMin = 1e9; for (let s = K.DRY[0]; s <= K.DRY[1]; s += 2) dryMin = Math.min(dryMin, at(s).y);
check('the hairpin dry the whole time (the water at the end under its road)', dryMin > lvlEnd + 0.2, `${dryMin.toFixed(2)} > ${lvlEnd.toFixed(2)}`);
check('the start on the beach road under deep water (it swims)', K.L0 - at(K.S0).y > K.SWIM + 0.5, (K.L0 - at(K.S0).y).toFixed(2));

const mk = (s) => { const a = at(s), p = { q: { s: a.i >= 0 ? (T.startS + s) % T.len : 0 }, x: a.x, z: a.z, y: a.y, roadY: a.y, h: a.h, vx: 0, vz: 0, w: 0, finished: false, stuckT: 0, wrongT: 0 }; return { player: p, track: T }; };
const put = (F, s, dl) => { const a = at(s), P = F.player; P.q.s = (T.startS + s) % T.len; P.x = a.x + T.nx[a.i] * (dl || 0); P.z = a.z + T.nz[a.i] * (dl || 0); P.roadY = P.y = a.y; P.h = a.h; P.vx = P.vz = 0; };
let F = mk(K.S0), r = new Missions.Run(D, F); D.begin.call(D, r);
check('begin: the panel (0 / 8 rescued, the depth over 2 m, the water +0 of 50 cm), 8 people on the roofs', r.vals.res.text === '0 / 8' && /^2,\d m$/.test(r.vals.depth.text) && r.vals.rise.text === '+0 / 50 cm' && r.who.length === 8 && r.who.every(p => p.at === 'roof'), JSON.stringify(r.vals));
r.step(1 / 60);
check('the start: deep water (over K.SWIM m)', r.depth > K.SWIM && !r.end, r.depth.toFixed(2));
for (let i = 0; i < 60 * 60; i++) r.step(1 / 60);
check('a minute: the water up 5 cm, the gauge +5 / 50 cm', Math.abs(r.lvl - (K.L0 + 0.05)) < 1e-3 && r.vals.rise.text === '+5 / 50 cm', `${r.lvl.toFixed(3)} ${r.vals.rise.text}`);
// standing in deep water: the current takes it toward the sea
put(F, K.S0); for (let i = 0; i < 60 * 3; i++) r.step(1 / 60);
const drift = F.player.vx * r.cur[0] + F.player.vz * r.cur[1];
check('deep water, standing: the current pushes it toward the sea', drift > 0.2 && Math.hypot(F.player.vx, F.player.vz) < 1.6, `${F.player.vx.toFixed(2)} ${F.player.vz.toFixed(2)}`);
// fast in deep water: held to the swimming speed
put(F, K.S0); F.player.vx = Math.cos(F.player.h) * 15; F.player.vz = Math.sin(F.player.h) * 15; for (let i = 0; i < 60 * 3; i++) r.step(1 / 60);
check('swimming: slowed to about K.VSWIM', Math.hypot(F.player.vx, F.player.vz) < K.VSWIM + 1, Math.hypot(F.player.vx, F.player.vz).toFixed(2));
// the throw: stopped by the first house
const h0 = r.houses[0];
put(F, D.HOUSES[0][0]); F.player.vx = 3; r.autoThrow = true; r.step(1 / 60);
check('too fast by a house: no throw', !r.act, String(!!r.act));
put(F, D.HOUSES[0][0] + K.NEAR + 15); r.autoThrow = true; r.step(1 / 60);
check('too far from the house: no throw', !r.act, String(!!r.act));
r.autoThrow = false; put(F, D.HOUSES[0][0]); r.step(1 / 60);
check('stopped by a house: VRZI OBROČ, the hint says throw', /Vrzi obroč/.test(r.hint), r.hint);
r.autoThrow = true; r.step(1 / 60);
check('the throw: the ring flies', !!r.act && r.act.h === h0 && /Obroč/.test(r.hint), r.hint);
for (let i = 0; i < 60 * (K.FLY + K.SLIDE + 0.2); i++) { put(F, D.HOUSES[0][0]); r.step(1 / 60); }
check('down the line onto the deck: 1 aboard, the house empty, the panel 0 / 8 (+1)', r.aboard === 1 && h0.left === 0 && r.who[0].at === 'aboard' && r.vals.res.text === '0 / 8 (+1)', r.vals.res.text);
// drifted off during a throw: the line slips
const h1 = r.houses[1]; put(F, D.HOUSES[1][0]); r.autoThrow = true; r.step(1 / 60);
check('the next house: the throw', r.act && r.act.h === h1);
put(F, D.HOUSES[1][0] + K.FAR + 10); r.step(1 / 60);
check('drifted further than K.FAR: the line slips, the person still on the roof', !r.act && h1.left === 2 && r.slips === 1 && /odnesel/.test(r.hint), r.hint);
// the dry ground at the hairpin: moving, they stay aboard; stopped, they step out
put(F, (K.DRY[0] + K.DRY[1]) / 2); F.player.vx = 10; r.step(1 / 60);
check('at the hairpin, still driving: they stay aboard', r.aboard === 1 && r.saved === 0);
put(F, (K.DRY[0] + K.DRY[1]) / 2); r.step(1 / 60);
check('stopped on the dry ground: they step out (1 / 8)', r.aboard === 0 && r.saved === 1 && r.vals.res.text === '1 / 8' && r.who[0].at === 'safe', r.vals.res.text);
check('dry ground: no water there', r.depth === 0, String(r.depth));
put(F, K.DRY[1] + 30); r.sayT = 0; r.step(1 / 60);
check('past the dry ground with people still on the roofs: back for them', /vrni se/.test(r.hint), r.hint);
// all of them on dry ground: done
for (const p of r.who) if (p.at === 'roof') { p.at = 'aboard'; p.h.left--; r.aboard++; }
put(F, (K.DRY[0] + K.DRY[1]) / 2); r.step(1 / 60);
check('all 8 on dry ground: done', r.end === 'win' && r.saved === 8, `${r.end} ${r.saved}`);
// the failures
F = mk(K.S0); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.finished = true; r.step(0.1);
check('driven round to the finish line: failed', r.end === 'fail' && /mimo/.test(r.why), r.why);
F = mk(K.S0); r = new Missions.Run(D, F); D.begin.call(D, r); for (let i = 0; i < 10 * 601 && !r.end; i++) r.step(0.1);
check('the time up (the water up half a metre): failed', r.end === 'fail' && /časa/.test(r.why) && r.vals.rise.text === '+50 / 50 cm', `${r.why} ${r.vals.rise.text}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
