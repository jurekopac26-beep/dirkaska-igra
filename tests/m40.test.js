// Special mission 40 · Varnostni avto (js/missions/m40.js, the kit js/missions/kit.js), no browser: its race (Bathurst, the player's car,
// VORTEX, on pole with the field of K.NAI behind it, one lap, no damage; race.fl with the safety car out and no car of its own: nobody
// overtakes); the reference from the grid (a lap of ~230 s); begin: DELTA, KOLONA, ODSTRANJEVANJE 0 %, GUME; standing still the tyres go
// cold (failed); the field over K.BREAK m behind for K.BREAKT s: apart (failed); the wreck cleared after K.CLR s, UGASNI LUČI only then;
// into the pit lane with the lights off done (the stars by DELTA), with them on or before the road is clear failed; over the line failed.
// Driven with the physics: the mission's own driver (the reference pace, the lights off, into the pit lane) done with 3 stars, nobody past
// the safety car and the field close behind it all the way; too slow failed (the tyres), too fast failed (the queue), the lights left on
// failed, on over the line failed.
//   node tests/m40.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm40.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('40'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'bathurst'), T = new Core.Track(TD);
check('40: on Bathurst (bathurst), a real track with a pit lane, the safety car VORTEX, a limit', D.track === 'bathurst' && !TD.test && !!TD.pit && D.car === 'vortex' && D.limit === K.LIMIT);
const o = D.opts(D);
check('its race: the field of K.NAI behind the player\'s car on pole, one lap, no damage', o.tt === false && o.numAI === K.NAI && o.playerGrid === 1 && o.laps === 1 && o.damage === 0);
// the race as the game makes it (Missions' own defaults, the mission's car), its made() before the start
const race = (seed) => {
  const R = new Core.Race(T, Object.assign({ phys: 'cs', seed, flying: 0, rain: 0, weather: null, fuel: false, flags: false, chars: false, slip: false, faults: false, radio: false, traffic: false, police: false }, D.opts(D), { playerModel: Core.MODELS.find(m => m.id === D.car) }));
  D.made(R); R.start(); return R;
};
let R = race(3), r = new Missions.Run(D, R); D.begin.call(D, r);
const P = R.player, ai = R.cars.filter(c => !c.isPlayer);
check('made: the safety car out with no car of its own (nobody overtakes); the field behind the player\'s car on the grid', R.fl && R.fl.sc && R.fl.sc.state === 'mis' && !R.fl.sc.car && ai.length === K.NAI && ai.every(c => R._noPass(c) && c.dist < P.dist), JSON.stringify(R.cars.map(c => Math.round(c.dist))));
const tLap = D.tD(r, T.raceLen || T.len);
check('the reference from the grid: a lap of 200-260 s', tLap > 200 && tLap < 260, tLap.toFixed(1) + ' s');
check('begin: DELTA +0,0 s, KOLONA, ODSTRANJEVANJE 0 %, GUME ' + K.T0 + ' °C', r.vals.delta.text === '+0,0 s' && r.vals.odst.text === '0 %' && r.vals.gume.text === K.T0 + ' °C', JSON.stringify(r.vals));
// standing still: the tyres go cold
for (let k = 0; k < 60 * 30 && !r.end; k++) r.step(1 / 60);
check('standing still: the tyres cool, failed in 8-14 s', r.end === 'fail' && /ohladile/.test(r.why) && r.t > 8 && r.t < 14, `${r.why} ${r.t.toFixed(1)}`);
// the field over K.BREAK m behind for K.BREAKT s: apart
R = race(3); r = new Missions.Run(D, R); D.begin.call(D, r);
const put = (d0) => { R.player.dist = d0; R.cars.filter(c => !c.isPlayer).forEach((c, k) => { c.dist = d0 - K.BREAK - 10 - 8 * k; }); };
r.rs = 1; let tb = null;
for (let k = 0; k < 60 * 10 && !r.end; k++) { put(800); r.temp = K.T0; r.step(1 / 60); if (r.vals.kol.text === Math.round(K.BREAK + 10) + ' m' && tb == null) tb = r.t; }
check('the field over K.BREAK m behind for K.BREAKT s: apart, failed', r.end === 'fail' && /razpadla/.test(r.why) && r.t > K.BREAKT && r.t < K.BREAKT + 0.5 && tb != null, `${r.why} ${r.t.toFixed(2)}`);
// the wreck cleared after K.CLR s; the lights off only then; into the pits
R = race(3); r = new Missions.Run(D, R); D.begin.call(D, r);
const hold = () => { r.temp = K.T0; r.g1 = 15; };
r.press = true; r.t = K.CLR * 0.5; hold(); r.step(1 / 60);
check('before the road is clear: ODSTRANJEVANJE ~50 %, UGASNI LUČI does nothing', !r.clear && !r.off && r.vals.odst.text === '50 %', r.vals.odst.text);
r.press = false; r.t = K.CLR; hold(); r.step(1 / 60);
check('after K.CLR s: the road clear (100 %), the message to switch off the lights', r.clear && r.vals.odst.text === '100 %' && /Ugasni luči/.test(r.hint) && !r.off, r.hint);
r.press = true; hold(); r.step(1 / 60);
check('UGASNI LUČI: the lights off, the way into the pits', r.off && /zapelji levo v bokse/.test(r.hint), r.hint);
const pitIn = (setup) => { const R2 = race(3), r2 = new Missions.Run(D, R2); D.begin.call(D, r2); setup(r2, R2); R2.player.inPit = true; r2.temp = K.T0; r2.step(1 / 60); return r2; };
let q = pitIn((r2) => { r2.t = K.CLR + 10; r2.step(1 / 60); });
check('into the pits with the lights on: failed', q.end === 'fail' && /prižganimi/.test(q.why), q.why);
q = pitIn((r2) => { r2.t = 30; });
check('into the pits before the road is clear: failed', q.end === 'fail' && /preden je bila proga čista/.test(q.why), q.why);
const lap = (dl) => pitIn((r2, R2) => { r2.t = K.CLR + 10; r2.press = true; r2.step(1 / 60); R2.player.dist = r2.pitS + 5; r2.t = D.tD(r2, r2.pitS + 5) + dl; });
q = lap(2); const q2 = lap(10), q1 = lap(-25);
check('into the pits with the lights off: done; the stars by DELTA (2 s: 3, 10 s: 2, 25 s early: 1)', q.end === 'win' && q.stars === 3 && q2.end === 'win' && q2.stars === 2 && q1.end === 'win' && q1.stars === 1, `${q.end} ${q.stars} ${q2.stars} ${q1.stars}`);
R = race(3); r = new Missions.Run(D, R); D.begin.call(D, r); D.finish.call(D, r);
check('over the line without going in: failed', r.end === 'fail' && /Nisi zapeljal v bokse/.test(r.why), r.why);
// driven with the physics
const drive = (seed, po) => {
  const R = race(seed), r = new Missions.Run(D, R); D.begin.call(D, r); const P = R.player;
  const st = { ahead: 0, gMin: 1e9, gMax: 0 };
  for (let t = 0; t < 420 && !r.end; t += 1 / 60) {
    const a = D.pilot(r, po); P.inSteer = a[0]; P.inThr = a[1]; P.inBrk = a[2]; R.step(1 / 60); r.step(1 / 60);
    if (R.cars.some(c => !c.isPlayer && c.dist > P.dist)) st.ahead++;
    if (r.t > 15 && r.g1 != null) { st.gMin = Math.min(st.gMin, r.g1); st.gMax = Math.max(st.gMax, r.g1); }
  }
  return Object.assign(r, { st });
};
r = drive(3, {});
check('the mission\'s own driver (the reference pace, the lights off once clear, into the pit lane): done, 3 stars', r.end === 'win' && r.stars === 3 && r.off && r.t > 200 && r.t < 280, `${r.end} ${r.why || ''} t ${r.t.toFixed(0)} delta ${r.delta.toFixed(1)} stars ${r.stars}`);
check('nobody past the safety car, the field close behind it all the way (KOLONA 5 m .. K.WARN)', r.st.ahead === 0 && r.st.gMin > 5 && r.st.gMax < K.WARN, JSON.stringify(r.st));
check('the tyres warm all the way (over K.TWARN)', r.temp > K.TWARN, r.temp.toFixed(1));
r = drive(4, { pace: 0.6 });
check('too slow (0.6 of the pace): the tyres cold, failed', r.end === 'fail' && /ohladile/.test(r.why), `${r.end} ${r.why} t ${r.t.toFixed(0)}`);
r = drive(5, { pace: 1.35 });
check('too fast (1.35 of the pace): the field apart, failed', r.end === 'fail' && /razpadla/.test(r.why), `${r.end} ${r.why} t ${r.t.toFixed(0)}`);
r = drive(6, { never: true });
check('the lights left on: into the pits failed', r.end === 'fail' && /prižganimi/.test(r.why), `${r.end} ${r.why} t ${r.t.toFixed(0)}`);
r = drive(7, { noPit: true });
check('on over the line without going in: failed', r.end === 'fail' && /Nisi zapeljal/.test(r.why), `${r.end} ${r.why} t ${r.t.toFixed(0)}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
