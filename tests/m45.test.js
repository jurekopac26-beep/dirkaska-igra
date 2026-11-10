// Special mission 45 · Turistični vlakec (js/missions/m45.js, the kit js/missions/kit.js), no browser: its race (Livorno, one run alone, the
// locomotive on the 4x4's physics with its own limiter), the sharp bends on the way (the streets of Ardenza), the panel (OVINEK, POTNIKI,
// ZADNJI); the wagons in a chain (straight behind on a straight, in a bend cutting its inside, the last one the most); the kerb (a corner of
// a wagon over the road's edge: POTNIKI K.HIT less, once each time; at K.PMIN failed), wide through the bend none; stopped in the yellow box
// at the viewpoint done (the stars by the passengers), past it failed. Driven with the physics: the mission's own driver (wide through the
// bends, stopped in the box) done with 3 stars in 6-8 min; on the inside of the bends failed (the passengers scared).
//   node tests/m45.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm45.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('45'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'livorno'), T = new Core.Track(TD);
check('45: on Livorno (livorno), a real track', D.track === 'livorno' && !TD.test);
const o = D.opts(D), M0 = Core.MODELS.find(m => m.id === 'medved');
check('its race: one run alone, the locomotive on the 4x4\'s physics (a copy, its own limiter K.VMAX m/s), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel.id === 'medved' && o.playerModel !== M0 && o.playerModel.vLim === K.VMAX * 3.6 && M0.vLim !== o.playerModel.vLim);
// a race of its own for the steps by hand: the locomotive put on the road at s, d m across
const mk = (s) => { const i = T.idx(s); return { player: { q: { s, d: 0 }, dist: s - T.startS, x: T.px[i], z: T.pz[i], h: Math.atan2(T.tz[i], T.tx[i]), vx: 0, vz: 0, w: 0, m: { wid: 2, len: 4.5 }, finished: false }, track: T }; };
const put = (P, s, d, v) => { const i = T.idx(s); P.q.s = s; P.q.d = d; P.dist = s - T.startS; P.x = T.px[i] + T.nx[i] * d; P.z = T.pz[i] + T.nz[i] * d; P.h = Math.atan2(T.tz[i], T.tx[i]); P.vx = T.tx[i] * v; P.vz = T.tz[i] * v; };
// along the road from s0 to s1 (0.5 m steps at 6 m/s), d(s) m across, the wagons following
const go = (r, s0, s1, d, each) => { for (let s = s0; s <= s1 && !r.end; s += 0.5) { put(r.P, s, typeof d === 'function' ? d(s) : d, 6); r.step(0.5 / 6); if (each) each(s); } };
const s0 = T.startS;
let F = mk(s0 - K.PRE), r = new Missions.Run(D, F); D.begin.call(D, r);
const B = r.bends;
check('the sharp bends on the way (under K.RC m): at least 5, all on the seafront and in the streets of Ardenza (before 1 km), none on the climb to the viewpoint', B.length >= 5 && B[0].a > -K.PRE && B.every(c => c.R < K.RC && c.b < 1000), JSON.stringify(B.map(c => [c.a, c.b, c.side, Math.round(c.R)])));
check('the start (K.PRE m before the line): OVINEK the first bend\'s side and distance, POTNIKI ' + K.P0 + ', ZADNJI NA CESTI', r.vals.ovinek.text === (B[0].side > 0 ? 'DESNI' : 'LEVI') + ' · ' + Math.round(B[0].a + K.PRE) + ' m' && r.vals.potniki.text === String(K.P0) && r.vals.zadnji.text === 'NA CESTI', JSON.stringify(r.vals));
// the straightest 80 m of the climb (the least of the sharpest bend in it)
let sS = 0, kS = 1; for (let a = 200; a < K.STOP - 100; a += 10) { let km = 0; for (let x = a; x <= a + 80; x += 2) km = Math.max(km, Math.abs(T.k[T.idx(s0 + x)])); if (km < kS) { kS = km; sS = a; } }
F = mk(s0 + sS); r = new Missions.Run(D, F); D.begin.call(D, r);
go(r, s0 + sS, s0 + sS + 80, 0);
const P0 = r.P, gap = (a, b) => Math.hypot(a.hx - b.hx, a.hz - b.hz);
check('a straight: the wagons straight behind the locomotive (under 2°), their couplings K.LC m apart', r.w.every(w => Math.abs(Math.atan2(Math.sin(w.h - P0.h), Math.cos(w.h - P0.h))) < 0.03) && Math.abs(gap(r.w[0], r.w[1]) - K.LC) < 1e-6 && Math.abs(Math.hypot(r.w[0].hx - P0.x, r.w[0].hz - P0.z) - K.C0) < 1e-6, `R ${Math.round(1 / kS)} m: ` + r.w.map(w => (w.h - P0.h).toFixed(4)).join(' '));
// the sharpest bend down the middle: each wagon's axle on the inside of it, the last one the most
const C = B.reduce((a, c) => (c.R < a.R ? c : a)), cut = [0, 0, 0];
F = mk(s0 + C.a - 60); r = new Missions.Run(D, F); D.begin.call(D, r);
go(r, s0 + C.a - 60, s0 + C.b + 25, 0, () => r.w.forEach((w, k) => { const ax = w.hx - Math.cos(w.h) * K.LW, az = w.hz - Math.sin(w.h) * K.LW, q = T.query(ax, az, T.idx(r.P.q.s - K.C0 - K.LC * k - K.LW), {}); cut[k] = Math.max(cut[k], C.side * q.d); }));
check('the sharpest bend (R ' + Math.round(C.R) + ' m) down the middle: the wagons cut its inside, each more than the one ahead of it', cut[0] > 0.3 && cut[1] > cut[0] + 0.1 && cut[2] > cut[1] + 0.1, cut.map(x => x.toFixed(2)).join(' '));
// on its inside: the kerb, POTNIKI K.HIT less, once each time
F = mk(s0 + C.a - 60); r = new Missions.Run(D, F); D.begin.call(D, r);
let first = null, wasOn = false, lastOn = false;
const inside = (s) => C.side * clamp01((s - (s0 + C.a - 40)) / 20) * (T.wS(s) - 1.3);
go(r, s0 + C.a - 60, s0 + C.b + 25, inside, () => { if (r.hits && !first) first = { hits: r.hits, happy: r.happy, hint: r.hint, pop: !!r.pop }; wasOn = wasOn || r.w.some(w => w.on); lastOn = lastOn || (r.w[K.N - 1].on && r.vals.zadnji.text === 'NA ROBNIKU'); });
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
check('on the inside of the bend: a wagon on the kerb, POTNIKI ' + K.HIT + ' less for it, the message; the last one on it: ZADNJI NA ROBNIKU', !!first && first.happy === K.P0 - K.HIT * first.hits && first.pop && /Robnik/.test(first.hint) && lastOn, JSON.stringify(first) + ' last ' + lastOn);
check('each wagon over the kerb counted once for each time it gets there (no more than three for the three of them in one bend)', r.hits >= 1 && r.hits <= K.N && r.happy === K.P0 - K.HIT * r.hits && wasOn, `${r.hits} ${r.happy}`);
// wide through the same bend: no kerb
F = mk(s0 + C.a - 60); r = new Missions.Run(D, F); D.begin.call(D, r);
let worst = -9;
go(r, s0 + C.a - 60, s0 + C.b + 25, (s) => -C.side * clamp01((s - (s0 + C.a - 50)) / 20) * 1.6, () => { worst = Math.max(worst, ...r.w.map(w => w.ov)); });
check('wide through the same bend: no wagon on the kerb, POTNIKI ' + K.P0, r.hits === 0 && r.happy === K.P0 && worst < K.CURB, `${r.hits} worst ${worst.toFixed(2)}`);
// the kerb again and again: the passengers scared, failed
F = mk(s0 + 100); r = new Missions.Run(D, F); D.begin.call(D, r);
for (let k = 0; k < 12 && !r.end; k++) { r.w[0].ov = -1; const sv = D.over; D.over = (rr, w) => (w === rr.w[0] && k % 2 === 0 ? 0.5 : -1); r.step(1 / 60); D.over = sv; }
check('the kerb again and again: at POTNIKI ' + K.PMIN + ' failed (the passengers scared)', r.end === 'fail' && /prestrašeni/.test(r.why) && r.happy <= K.PMIN, `${r.end} ${r.why} ${r.happy}`);
// the viewpoint: stopped in the yellow box for K.HOLD s; the stars by the passengers
const stopAt = (s, happy) => { const F = mk(s0 + s), r = new Missions.Run(D, F); D.begin.call(D, r); r.happy = happy; for (let k = 0; k < 120 && !r.end; k++) { put(r.P, s0 + s, 0, 0); r.step(1 / 60); } return r; };
let q = stopAt(K.STOP + 2, K.P0);
check('stopped in the yellow box at the viewpoint for K.HOLD s: done, 3 stars', q.end === 'win' && q.stars === 3 && q.t >= K.HOLD && q.t < K.HOLD + 0.1, `${q.end} ${q.stars} ${q.t.toFixed(2)}`);
const q2 = stopAt(K.STOP - 3, K.P0 - 2 * K.HIT), q1 = stopAt(K.STOP, K.P0 - 5 * K.HIT);
check('the stars by the passengers (' + (K.P0 - 2 * K.HIT) + ': 2, ' + (K.P0 - 5 * K.HIT) + ': 1)', q2.end === 'win' && q2.stars === 2 && q1.end === 'win' && q1.stars === 1, `${q2.stars} ${q1.stars}`);
q = stopAt(K.STOP - K.ZONE - 2, K.P0);
check('stopped short of the box: not yet, the hint to stop in it', !q.end && /rumenem okvirju/.test(q.hint), `${q.end} ${q.hint}`);
F = mk(s0 + K.STOP - 20); r = new Missions.Run(D, F); D.begin.call(D, r);
go(r, s0 + K.STOP - 20, s0 + K.STOP + K.PAST + 5, 0);
check('past the viewpoint by K.PAST m: failed', r.end === 'fail' && /mimo razgledne/.test(r.why), `${r.end} ${r.why}`);
// driven with the physics
const race = (seed) => { const R = new Core.Race(T, Object.assign({ phys: 'cs', seed, numAI: 0, flying: 0, rain: 0, weather: null, fuel: false, flags: false, chars: false, slip: false, faults: false, radio: false, traffic: false, police: false }, D.opts(D))); D.made(R); R.start(); return R; };
let R0 = race(2);
check('made: the train K.PRE m before the line on the seafront, facing up the road', Math.abs(R0.player.dist + K.PRE) < 0.5 && Math.cos(R0.player.h - Math.atan2(T.tz[T.idx(s0 - K.PRE)], T.tx[T.idx(s0 - K.PRE)])) > 0.99, R0.player.dist.toFixed(1));
const drive = (seed, po) => {
  const R = race(seed), r = new Missions.Run(D, R); D.begin.call(D, r); const P = R.player; let vmax = 0;
  for (let t = 0; t < K.LIMIT + 5 && !r.end; t += 1 / 60) { const a = D.pilot(r, po); P.inSteer = a[0]; P.inThr = a[1]; P.inBrk = a[2]; R.step(1 / 60); r.step(1 / 60); vmax = Math.max(vmax, Math.hypot(P.vx, P.vz)); }
  return Object.assign(r, { vmax });
};
r = drive(3, {});
check('the mission\'s own driver (wide through the bends, stopped in the box): done, 3 stars, in 6-8 min', r.end === 'win' && r.stars === 3 && r.t > 360 && r.t < 480, `${r.end} ${r.why || ''} t ${r.t.toFixed(0)} hits ${r.hits} stars ${r.stars}`);
check('the limiter: the train never faster than K.VMAX (+0,3 m/s)', r.vmax < K.VMAX + 0.3, r.vmax.toFixed(2));
r = drive(4, { cut: true });
check('on the inside of the bends: the wagons on the kerbs, failed (the passengers scared)', r.end === 'fail' && /prestrašeni/.test(r.why) && r.hits >= (K.P0 - K.PMIN) / K.HIT, `${r.end} ${r.why} hits ${r.hits} t ${r.t.toFixed(0)}`);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
