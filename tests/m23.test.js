// Special mission 23 · Lovec na meteorite (js/missions/m23.js, the kit js/missions/kit.js), no browser: its race (Marrakesh, the 4x4
// MEDVED 4x4, K.R rival hunters in 4x4s spread round the circuit, slower: K.RV km/h at most), at night; the stones: a ring K.AHEAD m
// ahead on the road K.WARN s before each lands, one every K.EVERY s; landed hot, cool after K.COOL s; stopped at a hot one: too hot,
// stopped at a cool one: picked up (METEORITI), driving past it: not; a rival driving past a cool one takes it (TEKMECI); K.NEED: done;
// fewer left than still needed: failed; the gauges. Driven with the physics: the mission's own driver (to each ring, stopped until the
// stone cools) done with 3 stars, a slow one done too with some lost, one that never stops failed.
//   node tests/m23.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm23.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('23'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'marrakesh'), T = new Core.Track(TD);
check('23: on Marrakesh, a real track, the 4x4 (MEDVED 4x4)', D.track === 'marrakesh' && !TD.test && D.car === 'medved');
const o = D.opts(D);
check('its race: K.R rivals, laps enough that nobody finishes, no damage', o.numAI === K.R && o.laps >= 50 && !o.tt && o.damage === 0);
const M = Core.MODELS.find(m => m.id === 'medved');
const race = (seed) => { const R = new Core.Race(T, Object.assign({ phys: 'cs', seed }, D.opts(D), { playerModel: M })); D.made(R); R.start(); return R; };
let R = race(3);
const H = R.cars.filter(c => c.hunter);
check('the rivals: K.R hunters in 4x4s (MEDVED 4x4, at most K.RV km/h), spread round the circuit ahead', H.length === K.R && H.every(c => c.m.id === 'medved' && c.m.vLim === K.RV) && H.every((c, k) => Math.abs(c.q.s - (T.startS + K.RS[k])) < 6), H.map(c => c.m.id + ' ' + c.q.s.toFixed(0)).join(', '));

const mk = () => ({ player: { q: { s: 100, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, finished: false }, track: T, cars: [] });
const at = (r, s, d, v) => { const i = T.idx(s), P = r.P; P.q.s = s; P.q.d = d || 0; P.x = T.px[i] + T.nx[i] * (d || 0); P.z = T.pz[i] + T.nz[i] * (d || 0); P.h = T.hd[i]; P.vx = T.tx[i] * (v || 0); P.vz = T.tz[i] * (v || 0); };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('begin: METEORITI 0 / 8, NASLEDNJI UDAR, TEKMECI 0', r.vals.met.text === '0 / ' + K.NEED && /^0?0:0\d$/.test(r.vals.udar.text) && r.vals.tek.text === '0', JSON.stringify(r.vals));
at(r, 100, 0, 0); r.t = K.T0 - K.WARN - 0.01; r.step(0.05);
const s1 = r.stones[0];
check('K.WARN s before the first lands: its ring K.AHEAD m ahead, on the road', !!s1 && s1.state === 'ring' && s1.s - 100 >= K.AHEAD[0] && s1.s - 100 <= K.AHEAD[1] && Math.abs(s1.d) <= T.wS(s1.s) - 1.6 + 1e-6, JSON.stringify(s1 && { s: s1.s, d: s1.d }));
check('NASLEDNJI UDAR: the time to it', /^0?0:0[56]$/.test(r.vals.udar.text), r.vals.udar.text);
at(r, s1.s, s1.d, 0); r.t = s1.land - 0.01; r.step(0.05);
check('landed: hot; stopped at it: too hot (the hint), not picked up', s1.state === 'hot' && r.got === 0 && /prevroč/.test(r.hint), `${s1.state} ${r.hint}`);
r.t = s1.land + K.COOL - 0.02; at(r, s1.s, s1.d, 10); r.step(0.05);
check('cool after K.COOL s; driving past it: not picked up', s1.state === 'cool' && r.got === 0, s1.state);
at(r, s1.s, s1.d, 0); r.step(0.05);
check('stopped at the cool stone: picked up, METEORITI 1 / 8', s1.state === 'got' && r.got === 1 && r.vals.met.text === '1 / ' + K.NEED && /tvoj/.test(r.hint), `${s1.state} ${r.vals.met.text} ${r.hint}`);
check('the next one K.EVERY s after the first', Math.abs(r.nextT - (K.T0 + K.EVERY)) < 1e-6);
// a rival takes a cool one it drives past
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); at(r, 100, 0, 0); r.t = K.T0 - K.WARN; r.step(0.05);
const s2 = r.stones[0], hunter = { hunter: true, x: s2.x + 2, z: s2.z, q: { s: s2.s - 2 } }; F.cars.push(hunter);
r.t = s2.land + 1; r.step(0.05);
check('a rival by a hot stone: leaves it', s2.state === 'hot' && r.lost === 0);
check('TEKMECI: how far the nearest rival is behind the stone', /^0 · \d+ m$/.test(r.vals.tek.text), r.vals.tek.text);
r.t = s2.land + K.COOL + 0.1; r.step(0.05);
check('a rival by a cool stone: takes it, TEKMECI 1', s2.state === 'rival' && r.lost === 1 && /^1/.test(r.vals.tek.text) && /Tekmec/.test(r.hint), `${s2.state} ${r.vals.tek.text} ${r.hint}`);
// the end: K.NEED done; fewer left than needed: failed
r.got = K.NEED - 1; const s3 = { n: 99, s: 100, d: 0, x: F.player.x, z: F.player.z, y: 0, land: 0, state: 'cool', heat: 0 }; r.stones.push(s3); at(r, 100, 0, 0); r.step(0.05);
check('the eighth picked up: done', r.end === 'win');
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.lost = K.N - K.NEED + 1; r.fell = K.N - K.NEED + 1; r.nextT = 1e9; r.step(0.05);
check('fewer stones left than still needed: failed', r.end === 'fail' && /preveč/.test(r.why), r.why);
// driven with the physics
const drive = (R, mode) => {
  const r = new Missions.Run(D, R); D.begin.call(D, r); const P = R.player;
  for (let t = 0; t < 600 && !r.end; t += 1 / 60) {
    if (mode === 'race') Core.aiControl(P, R, 1 / 60); else { const a = D.pilot(r, mode === 'slow' ? { v: 11, lat: 3 } : {}); P.inSteer = a[0]; P.inThr = a[1]; P.inBrk = a[2]; }
    R.step(1 / 60); r.step(1 / 60);
  }
  return r;
};
r = drive(race(3), 'pilot');
check('the mission\'s own driver (to each ring, stopped until the stone cools): done, 3 stars', r.end === 'win' && r.stars === 3, `${r.end} ${r.why} t ${r.t.toFixed(0)} got ${r.got} lost ${r.lost}`);
r = drive(race(4), 'slow');
check('a slow driver (40 km/h): done, some lost to the rivals, fewer stars', r.end === 'win' && r.lost > 0 && r.stars < 3, `${r.end} t ${r.t.toFixed(0)} got ${r.got} lost ${r.lost} stars ${r.stars}`);
r = drive(race(5), 'race');
check('one that never stops: the rivals take them, failed', r.end === 'fail' && r.got === 0, `${r.end} ${r.why} t ${r.t.toFixed(0)} lost ${r.lost}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
