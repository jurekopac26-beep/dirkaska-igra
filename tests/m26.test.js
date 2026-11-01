// Special mission 26 · Zadnji odstotek (js/missions/m26.js, the kit js/missions/kit.js), no browser: its race (Tianmen, alone, the
// STRELA EV), the start K.TOP m below the finish line facing down the road; the battery from 3 %: its systems use it slowly, the throttle
// fast, the brake down the slope gives some back (REKUPERACIJA: one braking's share), harder than the regeneration's power is lost;
// DOMET from the use of the last stretch, DO POLNILNICE; empty before the charger: failed; at the charger: done.
//   node tests/m26.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm26.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('26'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'tianmen'));
check('26: on Tianmen, a real track, the electric car', D.track === 'tianmen' && D.car === 'ev' && !Core.TRACKS.find(t => t.id === 'tianmen').test && !!Core.MODELS.find(m => m.id === 'ev'));
check('its race: alone', D.opts(D).tt === true);
const race = new Core.Race(T, Object.assign({ phys: 'cs', seed: 3 }, D.opts(D), { playerModel: Core.MODELS.find(m => m.id === 'ev') }));
D.made(race);
const i0 = T.idx(T.finishS - K.TOP), fw = Math.cos(race.player.h) * T.tx[i0] + Math.sin(race.player.h) * T.tz[i0];
check('the start: K.TOP m below the finish line at the top, facing down the road', Math.abs(race.player.q.s - (T.finishS - K.TOP)) < 5 && fw < -0.95, `${race.player.q.s.toFixed(0)} ${fw.toFixed(2)}`);

const mk = () => ({ player: { q: { s: T.finishS - K.TOP, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, m: { mass: 1720 }, inThr: 0, inBrk: 0, finished: false }, track: T });
const at = (r, s, v, thr, brk) => { const i = T.idx(s), P = r.P; P.q.s = s; P.x = T.px[i]; P.z = T.pz[i]; P.h = Math.atan2(-T.tz[i], -T.tx[i]); P.vx = -T.tx[i] * v; P.vz = -T.tz[i] * v; P.inThr = thr || 0; P.inBrk = brk || 0; };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the start: BATERIJA 3,0 %, DO POLNILNICE in km, no regeneration yet', r.vals.baterija.text === '3,0 %' && /^4,\d km$/.test(r.vals.polnilnica.text) && r.vals.rekup.text === '+0,00 %', JSON.stringify(r.vals));
// rolling down at a steady speed, no pedals: only the systems use it
let s = T.finishS - K.TOP; const b0 = r.b;
for (let k = 0; k < 100; k++) { s -= 1; at(r, s, 10); r.step(0.1); }
const base = b0 - r.b;
check('rolling down, no pedals: a little used (the systems, K.BASE kW)', base > 0 && Math.abs(base - K.BASE * 10 / K.CAP) < 1e-3, base.toFixed(4));
check('DOMET from the use of the last stretch (km), more than the way left', /^\d+,\d km$/.test(r.vals.domet.text), r.vals.domet.text);
// the throttle: fast
const b1 = r.b;
for (let k = 0; k < 100; k++) { s -= 1.5; at(r, s, 15, 1); r.step(0.1); }
check('on the throttle: many times faster', b1 - r.b > base * 10, (b1 - r.b).toFixed(4));
check('the hint says the throttle empties it', /Plin/.test(r.hint), r.hint);
// the brake down the slope: some back (holding the speed: the slope's pull taken by the brake)
const b2 = r.b;
for (let k = 0; k < 50; k++) { s -= 1; at(r, s, 10, 0, 1); r.step(0.1); }
check('braking down the slope: the battery gets some back (more than the systems use)', r.b > b2 && /^\+0,\d\d %$/.test(r.vals.rekup.text) && r.vals.rekup.text !== '+0,00 %', `${(r.b - b2).toFixed(4)} ${r.vals.rekup.text}`);
// harder than the regeneration's power: lost (no more back than its cap)
const b3 = r.b; let v = 20;
for (let k = 0; k < 20; k++) { v -= 0.8; s -= v * 0.1; at(r, s, v, 0, 1); r.step(0.1); }
const capd = (K.REGEN * K.EFF - K.BASE) * 2 / K.CAP;
check('braking hard: no more back than the regeneration\'s power (the rest in the friction brakes), the hint says brake earlier', r.b - b3 <= capd + 1e-6 && /Premočno/.test(r.hint), `${(r.b - b3).toFixed(4)} ${capd.toFixed(4)} ${r.hint}`);
// empty before the charger: failed
r.b = 0.01; at(r, s, 15, 1); r.step(0.5);
check('empty before the charger: failed, why', r.end === 'fail' && /izpraznila/.test(r.why), r.why);
// at the charger: done
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r);
at(r, r.sEnd + 2, 5); r.step(0.1); check('just above the charger: not done yet', !r.end);
at(r, r.sEnd - 1, 5); r.step(0.1);
check('at the charger (K.END m before the start line): done', r.end === 'win' && r.sEnd < T.startS, `${r.end} ${r.sEnd}`);
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
