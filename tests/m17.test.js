// Special mission 17 · Ledeni most (js/missions/m17.js, the kit js/missions/kit.js), no browser: its race (Trois-Rivières, alone, one
// lap, the box truck on TITAN's physics with its own limiter, no damage); the ice: in the band K.LO..K.HI km/h the cracks close, slower the
// ice sags (RAZPOKE grows), faster it cracks ahead (grows faster the further out), more on thinner ice (LED: its thickness along the road);
// the first K.GRACE s count nothing; at 100 %: failed (why by which); over the line at the end of the lap: done; the gauges.
//   node tests/m17.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm17.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('17'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'troisrivieres'));
check('17: on Trois-Rivières, a real track', D.track === 'troisrivieres' && !Core.TRACKS.find(t => t.id === 'troisrivieres').test);
const o = D.opts(D);
check('its race: alone, one lap, the truck (TITAN\'s physics on a copy, its own limiter), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel && o.playerModel.vLim === K.VMAX && o.playerModel !== Core.MODELS.find(m => m.id === 'titan'));

const mk = () => ({ player: { q: { s: 5, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, finished: false }, track: T });
const at = (r, s, kmh) => { const i = T.idx(s), P = r.P, v = kmh / 3.6; P.q.s = s; P.x = T.px[i]; P.z = T.pz[i]; P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * v; P.vz = T.tz[i] * v; };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: the speed, the ice in cm, RAZPOKE 0 %', r.vals.hitrost.text === '0 km/h' && /^\d\d cm$/.test(r.vals.led.text) && r.vals.razpoke.text === '0 %', JSON.stringify(r.vals));
// pulling away slowly: the grace
let s = 5; for (let k = 0; k < (K.GRACE - 1) * 10; k++) { s += 0.3; at(r, s, 10); r.step(0.1); }
check('pulling away (the first K.GRACE s): nothing counted', r.cr === 0, r.cr.toFixed(1));
// in the band
for (let k = 0; k < 100; k++) { s += 0.83; at(r, s, 30); r.step(0.1); }
check('in the band (30 km/h): no cracks, the speed green, the hint', r.cr === 0 && r.vals.hitrost.col === '#3fbf6a' && r.hint === D.hint, `${r.cr} ${r.vals.hitrost.col}`);
// too slow: sags
for (let k = 0; k < 30; k++) { s += 0.4; at(r, s, 15); r.step(0.1); }
const cSlow = r.cr;
check('too slow (15 km/h): the ice sags, RAZPOKE grows, the hint says so', cSlow > 3 && /Prepočasi/.test(r.hint) && r.vals.razpoke.text === Math.round(cSlow) + ' %', `${cSlow.toFixed(1)} ${r.hint}`);
// back in the band: they close
for (let k = 0; k < 30; k++) { s += 0.83; at(r, s, 30); r.step(0.1); }
check('back in the band: the cracks close up', r.cr < cSlow, r.cr.toFixed(1));
// too fast: cracks ahead, faster the further out
const c0 = r.cr; for (let k = 0; k < 20; k++) { s += 1.1; at(r, s, 40); r.step(0.1); }
const d40 = r.cr - c0, c1 = r.cr; for (let k = 0; k < 20; k++) { s += 1.4; at(r, s, 50); r.step(0.1); }
check('too fast: cracks ahead, the faster the more (50 km/h more than 40), the hint says so', d40 > 0 && r.cr - c1 > d40 && /Prehitro/.test(r.hint), `${d40.toFixed(1)} ${(r.cr - c1).toFixed(1)}`);
for (let k = 0; k < 200 && !r.end; k++) { s += 1.4; at(r, s, 50); r.step(0.1); }
check('at 100 % too fast: failed, the ice cracked ahead', r.end === 'fail' && /počil/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
for (let k = 0; k < 400 && !r.end; k++) { at(r, 300, 3); r.step(0.1); }
check('standing on the ice: it gives way under the truck (failed, why)', r.end === 'fail' && /udrl/.test(r.why), r.why);
// thinner ice: faster cracks
let lo = 1e9, hi = 0, sl = 0, sh = 0; for (let q = 0; q < T.len; q += 5) { const t = parseInt((() => { const x = new Missions.Run(D, mk()); D.begin.call(D, x); at(x, q, 0); D.show(x); return x.vals.led.text; })()); if (t < lo) { lo = t; sl = q; } if (t > hi) { hi = t; sh = q; } }
check('LED: the ice from about K.T0 to K.T1 cm along the road', lo >= K.T0 - 1 && hi <= K.T1 + 1 && hi - lo > 15, `${lo} ${hi}`);
const crAt = (q) => { const x = new Missions.Run(D, mk()); D.begin.call(D, x); x.t = K.GRACE + 1; for (let k = 0; k < 10; k++) { at(x, q, 15); x.step(0.1); } return x.cr; };
check('on thinner ice the cracks grow faster', crAt(sl) > crAt(sh) * 1.3, `${crAt(sl).toFixed(2)} ${crAt(sh).toFixed(2)}`);
// over the line: done
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); at(r, T.len - 2, 30); F.player.finished = true; r.step(0.1);
check('over the line at the end of the lap: done, stars by the time', r.end === 'win' && r.stars === 3, `${r.end} ${r.stars}`);
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
