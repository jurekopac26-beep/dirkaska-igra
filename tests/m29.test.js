// Special mission 29 · Božična noč (js/missions/m29.js, the kit js/missions/kit.js), no browser: its race (Štajerska, alone, one lap, the
// pickup: the 4x4's physics at most K.VMAX km/h); the villages (K.N houses with lights, houses with lit windows among them, none on a road,
// a circle before each door); VRZI: held, the power (K.DMIN .. K.DMAX m in K.HOLD s), the dot on the line to the circle (across the
// pickup's speed too), a tap throws nothing; let go: in the air, landed in the circle a hit (ZADETKI V KROG), short or long in the snow,
// onto the house in the window; a house passed without its present lost; the end: the presents gone (the stars by the hits), too few
// left failed, midnight failed. Driven with the physics: the mission's own driver done with all twelve (3 stars), passing two houses
// 2 stars, letting go late and never throwing failed.
//   node tests/m29.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm29.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('29'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'rbring'), T = new Core.Track(TD);
check('29: on Štajerska (rbring), a real track, a limit (midnight)', D.track === 'rbring' && !TD.test && D.limit === K.LIMIT);
const o = D.opts(D);
check('its race: alone, one lap, the pickup: the 4x4 (MEDVED 4x4) at most K.VMAX km/h, no damage', o.tt && o.laps === 1 && o.playerModel.id === 'medved' && o.playerModel.vLim === K.VMAX && o.damage === 0);

// the villages
const H = D.layout(T), TG = H.filter(h => h.tgt);
check('the villages: K.N houses with lights (three in each), houses with lit windows among them', TG.length === K.N && D.V.every(v => TG.filter(h => h.s >= v.a - 40 && h.s <= v.b + 40).length === 3) && H.length - TG.length >= 40, `${TG.length} + ${H.length - TG.length}`);
const edge = (x, z) => { const q = T.query(x, z, -1, {}); return Math.abs(q.d) - T.wS(q.s); };
const worst = Math.min(...H.map(h => Math.min(...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => edge(h.x + h.tx * a * h.L / 2 + h.ox * b * h.W / 2, h.z + h.tz * a * h.L / 2 + h.oz * b * h.W / 2)))));
check('none on a road: every house\'s corners at least K.CLEAR m past the nearest road\'s edge (the circuit doubles back)', worst >= K.CLEAR - 1e-6, worst.toFixed(2) + ' m');
check('each circle K.CIRC m past the road\'s edge on its house\'s side, before the door (between the road and the front wall)', TG.every(h => { const q = T.query(h.cx, h.cz, T.idx(h.s), {}); return Math.abs(Math.abs(q.d) - T.wS(q.s) - K.CIRC) < 0.3 && Math.sign(q.d) === h.side && Math.hypot(h.cx - h.x, h.cz - h.z) > h.W / 2 + K.R; }));

const mk = () => ({ player: { q: { s: 100, d: 0 }, x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, dist: 100, finished: false }, track: T, cars: [] });
const at = (r, s, d, v) => { const i = T.idx(s), P = r.P; P.q.s = s; P.dist = s; P.q.d = d || 0; P.x = T.px[i] + T.nx[i] * (d || 0); P.z = T.pz[i] + T.nz[i] * (d || 0); P.h = T.hd[i]; P.vx = T.tx[i] * (v || 0); P.vz = T.tz[i] * (v || 0); };
const hold = (r, t) => { r.down = true; for (let k = 0; k < Math.round(t / 0.05); k++) r.step(0.05); r.down = false; };
const land = (r) => { r.step(0.05); const f = r.fly; for (let k = 0; k < 60 && r.fly; k++) r.step(0.05); return f; };
let F = mk(), r = new Missions.Run(D, F); D.begin.call(D, r);
check('begin: DARILA 12 / 12, ZADETKI V KROG 0 / 12, MOČ —', r.vals.darila.text === K.N + ' / ' + K.N && r.vals.zad.text === '0 / ' + K.N && r.vals.moc.text === '—', JSON.stringify(r.vals));
const h0 = r.tg[0]; at(r, h0.s - 14, 3 * h0.side, 0); r.step(0.05);
check('by the first house with lights: it is the target, TARČA its circle\'s distance', D.target(r) === h0 && /^\d+ m$/.test(r.vals.tarca.text) && Math.abs(parseInt(r.vals.tarca.text) - Math.hypot(h0.cx - r.P.x, h0.cz - r.P.z)) < 1, r.vals.tarca.text);
r.down = true; for (let k = 0; k < 15; k++) r.step(0.05);
const cross = r.dot && Math.abs((r.dot.x - r.dot.bx) * (h0.cz - r.dot.bz) - (r.dot.z - r.dot.bz) * (h0.cx - r.dot.bx)) / r.dot.lam;
check('VRZI held K.HOLD/2 s: MOČ 50 %, the dot on the line to the circle, half the way out', r.vals.moc.text === '50 %' && cross < 0.01 && Math.abs(r.dot.lam - (K.DMIN + K.DMAX) / 2) < 0.01, `${r.vals.moc.text} ${cross} ${r.dot && r.dot.lam}`);
r.down = false; r.hold = 0; r.dot = null;
hold(r, 0.05); r.step(0.05);
check('a tap (shorter than K.TAP s): nothing thrown, the hint', !r.fly && r.gifts === K.N && /dlje/.test(r.hint), r.hint);
// held just long enough for the circle (stopped: D its distance), let go: a hit
const need = (r, h) => { const g = Math.hypot(h.cx - (r.P.x + Math.cos(r.P.h) * K.BED), h.cz - (r.P.z + Math.sin(r.P.h) * K.BED)); return (g - K.DMIN) / (K.DMAX - K.DMIN) * K.HOLD; };
hold(r, need(r, h0)); r.step(0.05);
check('let go with the dot in the circle: the present in the air, DARILA 11', !!r.fly && r.fly.res === 'hit' && r.gifts === K.N - 1 && r.vals.darila.text === (K.N - 1) + ' / ' + K.N);
land(r);
check('landed in the circle: a hit, ZADETKI V KROG 1, the house done, the next one the target', h0.got && r.hits === 1 && r.vals.zad.text === '1 / ' + K.N && /Zadetek/.test(r.hint) && r.snow.length === 1, `${r.hits} ${r.hint}`);
// short, long onto the house (in the window)
const h1 = r.tg[1]; at(r, h1.s - 14, 3 * h1.side, 0); r.step(0.05);
hold(r, need(r, h1) - 0.3); let f = land(r);
check('let go early: short, in the snow', f.res === 'short' && !h1.got && /Prekratko/.test(r.hint) && r.gifts === K.N - 2, `${f.res} ${r.hint}`);
at(r, h1.s - 1.3, 3 * h1.side, 0); r.step(0.05);   // (abreast: the bed level with the door, the line to the circle on into the house)
hold(r, need(r, h1) + (K.FRONT - K.CIRC + h1.W / 2) / (K.DMAX - K.DMIN) * K.HOLD); f = land(r);
check('let go late, onto the house: in the window', f.res === 'okno' && !h1.got && /okno/.test(r.hint), `${f.res} ${r.hint}`);
// aimed across the pickup's speed: moving, held for the circle along the line, a hit
at(r, h1.s - 30, 3 * h1.side, 15); r.step(0.05); at(r, h1.s - 30, 3 * h1.side, 15);
let hd = 0; for (; hd < 3; hd += 0.01) { const A = D.aim(r, h1, D.dist(hd)); if (A.lam >= A.g) break; }
const A1 = D.aim(r, h1, D.dist(hd)), drift = Math.hypot(r.P.vx, r.P.vz) * A1.ft;
check('moving at 15 m/s: the dot still on the line to the circle (thrown with the pickup\'s speed: farther than the throw)', A1.lam > A1.D && Math.abs(A1.lam - A1.g) < 0.3 && drift > 5, `lam ${A1.lam.toFixed(1)} D ${A1.D.toFixed(1)} g ${A1.g.toFixed(1)}`);
r.hold = hd; D.throwAt(r, h1); r.hold = 0; f = land(r);
check('let go there: a hit', f.res === 'hit' && h1.got && r.hits === 2, f.res);
// passed without its present
const h2 = r.tg[2]; at(r, h2.s + K.PASS + 1, 0, 0); r.step(0.05);
check('a house left K.PASS m behind without its present: lost (the hint)', h2.gone && r.lost === 1 && /zgrešil/.test(r.hint), r.hint);
// the end
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.hits = K.N; r.gifts = 0; r.step(0.05);
check('the presents gone, all twelve in the circles: done, 3 stars', r.end === 'win' && r.stars === 3);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.hits = K.N - 2; r.gifts = 0; r.step(0.05);
check('ten: done, 2 stars', r.end === 'win' && r.stars === 2);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.hits = K.NEED; r.gifts = 0; r.step(0.05);
check('eight: done, 1 star', r.end === 'win' && r.stars === 1);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.hits = 3; r.gifts = K.NEED - 4; r.step(0.05);
check('fewer presents left than hits still needed: failed', r.end === 'fail' && /Premalo/.test(r.why), r.why);
F = mk(); r = new Missions.Run(D, F); D.begin.call(D, r); r.t = K.LIMIT; r.step(0.05);
check('midnight: failed', r.end === 'fail' && /polnoč/.test(r.why), r.why);
// driven with the physics
const race = (seed) => { const R = new Core.Race(T, Object.assign({ phys: 'cs', seed }, D.opts(D))); R.start(); return R; };
const drive = (R, po) => {
  const r = new Missions.Run(D, R); D.begin.call(D, r); const P = R.player;
  for (let t = 0; t < 400 && !r.end; t += 1 / 60) { const a = D.pilot(r, po); P.inSteer = a[0]; P.inThr = a[1]; P.inBrk = a[2]; R.step(1 / 60); r.step(1 / 60); }
  return r;
};
r = drive(race(3), {});
check('the mission\'s own driver (on the house\'s side, VRZI held, let go with the dot in the circle): all twelve, 3 stars', r.end === 'win' && r.hits === K.N && r.stars === 3, `${r.end} ${r.why} t ${r.t.toFixed(0)} hits ${r.hits}`);
r = drive(race(4), { skip: [1, 5] });
check('driving past two houses: done with ten, 2 stars', r.end === 'win' && r.hits === K.N - 2 && r.stars === 2 && r.lost === 2, `${r.end} t ${r.t.toFixed(0)} hits ${r.hits} lost ${r.lost} stars ${r.stars}`);
r = drive(race(5), { late: 0.15 });
check('letting go late: long, failed', r.end === 'fail' && r.hits < K.NEED && r.snow.every(f => f.res !== 'hit'), `${r.end} ${r.why} t ${r.t.toFixed(0)} hits ${r.hits}`);
r = drive(race(6), { never: true });
check('never throwing: failed', r.end === 'fail' && r.hits === 0, `${r.end} ${r.why} t ${r.t.toFixed(0)}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
