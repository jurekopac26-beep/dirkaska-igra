// Special mission 09 · Krilo vetrnice (js/missions/m09.js, the kit js/missions/kit.js), no browser: its race (Katu-Jaryk, alone, the
// tractor on the racing truck's physics at walking pace), the start K.S0 m past the start line, the rear axle (the keys move it, it stays
// where it was left; turned, the trailer's rear swings that way), the blade's sweep in the hairpins (the axle straight: it hits the first
// crags, the second hit fails; turned the side each crag asks: it misses them all), PROSTOR DO SKALE and the hint naming the side, the end
// of the descent: done.
//   node tests/m09.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm09.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('09'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'katu'));
check('09: on Katu-Jaryk, a real track', D.track === 'katu' && !Core.TRACKS.find(t => t.id === 'katu').test);
const o = D.opts(D);
check('its race: alone, the tractor (the racing truck\'s physics on a copy, at walking pace), no damage', o.tt && o.damage === 0 && o.playerModel.vLim === K.VMAX && Core.MODELS.find(m => m.id === 'titan').vLim === 160);
const race = new Core.Race(T, Object.assign({ phys: 'cs', seed: 3 }, o));
D.made(race);
check('the start: K.S0 m past the start line, above the hairpins', Math.abs(race.player.q.s - (T.startS + K.S0)) < 5, race.player.q.s.toFixed(0));
const mk = (s) => { const i = T.idx(s); return { player: { q: { s, d: 0 }, x: T.px[i], z: T.pz[i], h: Math.atan2(T.tz[i], T.tx[i]), vx: 0, vz: 0, w: 0, m: { wid: 2.5, len: 6.4 }, finished: false }, track: T }; };
// along the centre line from s0 to s1 (0.5 m steps at 5 m/s); axle(s): the rear axle wanted there (moved at K.RATE)
const go = (r, s0, s1, axle, each) => { for (let s = s0; s <= s1 && !r.end; s += 0.5) { const i = T.idx(s), P = r.P; P.q.s = s; P.x = T.px[i]; P.z = T.pz[i]; P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * 5; P.vz = T.tz[i] * 5;
  if (axle) { const w = axle(s); r.axle += Math.max(-K.RATE * 0.1, Math.min(K.RATE * 0.1, w - r.axle)); } r.step(0.1); if (each) each(s); } };
const s0 = T.startS + K.S0;
let F = mk(s0), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: PROSTOR DO SKALE —, ZADNJA OS 0, KRILO 100 %', r.vals.skala.text === '—' && r.vals.os.text === '0' && r.vals.krilo.text === '100 %', JSON.stringify(r.vals));
// the keys (no DOM: pressed through the kit's press)
r.keys = MisKit.keys(r, [{ k: 'l', label: 'OS L' }, { k: 'd', label: 'OS D' }]);
r.keys.press('d', true); for (let k = 0; k < 5; k++) r.step(0.1); r.keys.press('d', false); r.step(0.1);
check('OS D held half a second: the axle 60 % right; let go: it stays', Math.abs(r.axle - K.RATE * 0.5) < 0.01 && r.vals.os.text === 'D 60 %', r.vals.os.text);
r.keys.press('l', true); for (let k = 0; k < 20; k++) r.step(0.1); r.keys.press('l', false); r.step(0.1);
check('OS L held two seconds: all the way left, no further', r.axle === -1 && r.vals.os.text === 'L 100 %', r.vals.os.text);
// turned on a straight: the trailer's rear swings that way
F = mk(s0); r = new Missions.Run(D, F); D.begin.call(D, r); r.axle = 1;
let sS = s0, kS = 1; for (let s = s0; s < s0 + 150; s += 5) { const i = T.idx(s - 15), j = T.idx(s + 15); const a = Math.abs(Math.atan2(Math.sin(Math.atan2(T.tz[j], T.tx[j]) - Math.atan2(T.tz[i], T.tx[i])), Math.cos(Math.atan2(T.tz[j], T.tx[j]) - Math.atan2(T.tz[i], T.tx[i])))); if (a < kS) { kS = a; sS = s; } }
go(r, sS - 20, sS + 4); { const [ax, az] = r.tr.at(K.LEN), q = T.query(ax, az, T.idx(sS - K.LEN), {}); check('the axle turned right on a straight: the trailer\'s rear swings right of the road\'s middle', q.d > 0.5, q.d.toFixed(2)); }
// the descent with the axle straight: the blade hits the first crags (the second hit: failed)
const want = (s) => { let w = 0; K.PINS.forEach((p, k) => { const sp = T.startS + p; if (s - K.HITCH > sp - 60 && s - K.HITCH < sp + 50) w = K.ROCKS[k][2]; }); return w; };
F = mk(s0); r = new Missions.Run(D, F); D.begin.call(D, r);
let hint1 = '', room1 = 99, seen = false; go(r, s0, T.startS + K.END, () => 0, (s) => { if (!seen && r.near && r.room < room1) { room1 = r.room; if (!hint1 || r.room > 0) hint1 = r.hint; } if (r.hits) seen = true; });
check('the axle left straight: the blade hits a crag (KRILO 50 %) and a second: failed', r.end === 'fail' && r.hits === 2 && /skalo/.test(r.why), `${r.hits} ${r.why}`);
check('… before the first hit PROSTOR DO SKALE fell to nothing and the hint named the side to turn the axle (' + hint1 + ')', room1 < 0.5 && new RegExp(K.ROCKS[0][2] > 0 ? 'desno' : 'levo').test(hint1), room1.toFixed(2));
// the axle turned the side each crag asks: none hit, to the end
F = mk(s0); r = new Missions.Run(D, F); D.begin.call(D, r);
let minRoom = 99; go(r, s0, T.startS + K.END + 1, want, () => { if (r.room != null) minRoom = Math.min(minRoom, r.room); });
check('the axle turned as each crag asks: none hit, down to the end: done', r.end === 'win' && r.hits === 0, `${r.end} ${r.hits} room ${minRoom.toFixed(1)}`);
check('the crags stand off the road (the tractor never touches them)', r.rocks.every(c => Math.abs(c.d) > T.wS(c.s) + 2));
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
