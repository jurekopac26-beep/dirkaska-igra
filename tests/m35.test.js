// Special mission 35 · Reševalci na plaži (js/missions/m35.js, the kit js/missions/kit.js), no browser: its race (Newcastle, alone, the
// lifeguard's quad on the MRAVLJA's physics), the place over the beach (the road ~15 m over the sea, the water's edge on its right), the
// start before Turn 1, the swell (none on the beach, coming in), the stop (the zone, slow: PRESEDI NA SKUTER; too early, past it), the
// jet ski (steered, only on the sea: never onto the sand), the swimmer seen on a crest (from the road; from the jet ski only from close
// by: the ring shrinks), the rip carrying him out, the pick-up (beside him, slow, K.PULL s; too fast: none), the tow (slower), the beach:
// done; his strength: at 0 failed (about 4 minutes parked); round to the finish: failed; the gauges.
//   node tests/m35.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm35.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('35'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'newcastle'), T = new Core.Track(TD);
check('35: on Newcastle, a real track', D.track === 'newcastle' && !!TD && !TD.test);
const o = D.opts(D);
check('its race: alone, one run, the quad on the MRAVLJA (75 km/h), no damage', o.tt && o.laps === 1 && o.damage === 0 && o.playerModel.id === 'mravlja' && o.playerModel.vLim === 75, JSON.stringify({ tt: o.tt, m: o.playerModel.id }));
check('no time limit (the swimmer\'s strength is the clock); the stars in order', !D.limit && D.stars[0] < D.stars[1]);
// the place over the beach: the road ~15 m over the sea, the water's edge ~90 m off on its right
const E = [-96, 606], N = [0.6, 0.8], iS = T.idx(K.STOP), lat = (E[0] - T.px[iS]) * T.nx[iS] + (E[1] - T.pz[iS]) * T.nz[iS];
check('the stop over the beach: the road 12-20 m up, the water\'s edge 60-110 m off its centre line', T.hy[iS] > 12 && T.hy[iS] < 20 && Math.abs(lat) > 60 && Math.abs(lat) < 110, `${T.hy[iS].toFixed(1)} m, ${lat.toFixed(1)} m`);
check('the sea seaward of the edge: N points away from the road', ((E[0] - T.px[iS]) * N[0] + (E[1] - T.pz[iS]) * N[1]) > 60);
// the race made: the quad on the pit straight before Turn 1
const car = { place(x, z, h) { this.x = x; this.z = z; this.h = h; }, cp: 0, splits: [] };
D.made({ track: T, player: car });
check('made: the quad K.STOP - K.S0 m before the beach, on the road', Math.abs(car.q.s - (T.startS + K.S0) % T.len) < 3 && Math.abs(car.y - T.hy[T.idx(K.S0)]) < 0.01 && K.STOP - K.S0 > 700, `${car.q.s.toFixed(0)}`);

const mk = (s) => { const i = T.idx(s), p = { q: { s }, x: T.px[i], z: T.pz[i], y: T.hy[i], h: T.hd[i], vx: 0, vz: 0, w: 0, finished: false, stuckT: 0, wrongT: 0 }; return { player: p, track: T }; };
const put = (F, s, v) => { const i = T.idx(s), P = F.player; P.q.s = s; P.x = T.px[i]; P.z = T.pz[i]; P.h = T.hd[i]; P.vx = Math.cos(P.h) * (v || 0); P.vz = Math.sin(P.h) * (v || 0); };
const seaD = (x, z) => (x - E[0]) * N[0] + (z - E[1]) * N[1];
let F = mk(K.S0), r = new Missions.Run(D, F); D.begin.call(D, r);
check('begin: the quad stage, the panel (the swimmer ~m, his strength 62 %, the waves 1,2 m)', r.stage === 'quad' && /^~\d+ m$/.test(r.vals.dist.text) && r.vals.moc.text === '62 %' && r.vals.val.text === '1,2 m', JSON.stringify(r.vals));
check('the swimmer out beyond the waves (150-200 m from the water\'s edge), the jet ski at the edge (in the water)', seaD(r.sw.x, r.sw.z) > 150 && seaD(r.sw.x, r.sw.z) < 200 && seaD(r.ski.x, r.ski.z) > 2 && seaD(r.ski.x, r.ski.z) < 6, `${seaD(r.sw.x, r.sw.z).toFixed(0)} ${seaD(r.ski.x, r.ski.z).toFixed(1)}`);
r.step(1 / 60);
check('far from the beach: Do plaže N m, no jet ski yet', /^Do plaže: \d+ m$/.test(r.hint) && r.stage === 'quad' && !r.ski.on, r.hint);
// the swell: none at the water's edge, up to K.WAVE on the open sea, coming in toward the beach
let wMax = 0, wEdge = 0;
{ const w = (d, t) => { r.ski.place(E[0] + N[0] * d, E[1] + N[1] * d, 0); r.ski.t = t; r.ski.step(0, 0, 0, 0); return r.ski.y; };
  for (let t = 0; t < 8; t += 0.1) { wMax = Math.max(wMax, w(120, t)); wEdge = Math.max(wEdge, w(3, t)); }
  let crest = 0, best = -1; for (let d = 100; d < 100 + K.WLEN; d += 0.5) { const y = w(d, 0); if (y > best) { best = y; crest = d; } }
  let crest2 = 0; best = -1; for (let d = crest - K.WLEN / 2; d < crest + K.WLEN / 2; d += 0.5) { const y = w(d, 1); if (y > best) { best = y; crest2 = d; } }
  check('the swell: up to K.WAVE out at sea, none at the water\'s edge, the crests coming in at K.WV m/s', wMax > K.WAVE * 0.95 && wMax <= K.WAVE + 1e-9 && wEdge === 0 && Math.abs((crest - crest2) - K.WV) < 1, `${wMax.toFixed(2)} ${wEdge} ${(crest - crest2).toFixed(1)}`);
  F = mk(K.S0); r = new Missions.Run(D, F); D.begin.call(D, r); }
// the swimmer seen from the road on a crest: POMOČ! (no ring shrinking from afar)
let seenQ = 0; for (let i = 0; i < 60 * 8; i++) { r.step(1 / 60); if (r.seen) seenQ++; }
check('from the road the swimmer is seen on a crest now and then (20-45 % of the time), the ring not smaller', seenQ > 60 * 8 * 0.2 && seenQ < 60 * 8 * 0.45 && r.ring.R === K.R0, `${(seenQ / 480 * 100).toFixed(0)} % R ${r.ring.R}`);
// the stop: too early, in the zone too fast, slow in the zone, past it
put(F, K.STOP - K.ZONE - 30, 0); r.step(1 / 60);
check('stopped before the zone: still Do plaže', /^Do plaže: \d+ m$/.test(r.hint), r.hint);
put(F, K.STOP + 5, 8); r.step(1 / 60);
check('in the zone, fast: Ustavi nad plažo', r.hint === 'Ustavi nad plažo.', r.hint);
put(F, K.STOP + K.ZONE + 20, 0); r.step(1 / 60);
check('past it: missed, back', /zgrešil/.test(r.hint), r.hint);
put(F, K.STOP - 10, 0); r.step(1 / 60);
check('in the zone, stopped: Presedi na skuter!', r.hint === 'Presedi na skuter!' && r.stage === 'quad', r.hint);
r.autoSki = true; r.step(1 / 60);
check('PRESEDI NA SKUTER: on the jet ski, the quad held', r.stage === 'ski' && r.ski.on && F.player.locked === true, `${r.stage} ${F.player.locked}`);
// the jet ski: toward the beach it stops at the water (never on the sand); out to sea it goes
const S = r.ski;
r.autoIn = [0, 0, 0]; S.place(E[0] + N[0] * 4, E[1] + N[1] * 4, Math.atan2(-N[1], -N[0])); r.autoIn = [0, 1, 0];
for (let i = 0; i < 60 * 4; i++) r.step(1 / 60);
check('full ahead toward the beach: stopped in the water (never on the sand)', seaD(S.x, S.z) > 1 && S.stuck, seaD(S.x, S.z).toFixed(2));
S.place(E[0] + N[0] * 4, E[1] + N[1] * 4, Math.atan2(N[1], N[0]));
for (let i = 0; i < 60 * 4; i++) r.step(1 / 60);
check('full ahead out to sea: away from the edge at speed', seaD(S.x, S.z) > 25 && S.speed > 8, `${seaD(S.x, S.z).toFixed(1)} ${S.speed.toFixed(1)}`);
// up the face of the crests it is slower than in the flat water (out through the waves, at full throttle)
{ const v0 = []; for (const wv of [true, false]) { const save = K.BUMP; if (!wv) K.BUMP = 0; S.place(E[0] + N[0] * 60, E[1] + N[1] * 60, Math.atan2(N[1], N[0])); S.v = K.VMAX; for (let i = 0; i < 60 * 5; i++) r.step(1 / 60); v0.push(seaD(S.x, S.z) - 60); K.BUMP = save; }
  check('out through the waves: slower up the crests\' faces', v0[0] < v0[1] - 3 && v0[0] > v0[1] * 0.7, v0.map(v => v.toFixed(1)).join(' < ')); }
// far from the swimmer: not seen from the jet ski (low on the water); close: seen on a crest, the ring shrinks round him
S.place(r.sw.x - N[0] * (K.SIGHT + 30), r.sw.z - N[1] * (K.SIGHT + 30), Math.atan2(N[1], N[0])); r.autoIn = [0, 0, 1];
let seenFar = 0; for (let i = 0; i < 60 * 8; i++) { S.place(r.sw.x - N[0] * (K.SIGHT + 30), r.sw.z - N[1] * (K.SIGHT + 30), S.h); r.step(1 / 60); if (r.seen) seenFar++; }
check('from the jet ski far off: the swimmer not seen', seenFar === 0, String(seenFar));
const R0 = r.ring.R; let seenNear = 0;
for (let i = 0; i < 60 * 8; i++) { S.place(r.sw.x - N[0] * 20, r.sw.z - N[1] * 20, S.h); r.step(1 / 60); if (r.seen) seenNear++; }
check('within K.SIGHT m: seen on the crests, the ring smaller round him', seenNear > 0 && r.ring.R < R0 && Math.hypot(r.ring.x - r.sw.x, r.ring.z - r.sw.z) <= r.ring.R, `${R0} -> ${r.ring.R.toFixed(1)}`);
// the rip takes him out and along
const sw0 = { d: seaD(r.sw.x, r.sw.z) }; for (let i = 0; i < 60 * 10; i++) r.step(1 / 60);
check('the rip: the swimmer carried out (K.RIP m/s)', Math.abs(seaD(r.sw.x, r.sw.z) - sw0.d - K.RIP[0] * 10) < 0.2, (seaD(r.sw.x, r.sw.z) - sw0.d).toFixed(2));
// the pick-up: beside him too fast: none; slow: after K.PULL s on the sled
S.place(r.sw.x - 2, r.sw.z, 0); S.v = 6; r.autoIn = [0, 1, 0]; r.step(1 / 60);
check('beside him too fast: Ustavi ob plavalcu, no pick-up', r.stage === 'ski' && r.pull === 0 && /Ustavi ob plavalcu/.test(r.hint), r.hint);
r.autoIn = [0, 0, 0]; let tPull = 0; for (let i = 0; i < 60 * 3 && r.stage === 'ski'; i++) { S.place(r.sw.x - 2, r.sw.z, 0); S.v = 0; r.step(1 / 60); tPull += 1 / 60; }
check('beside him, stopped: on the sled after K.PULL s', r.stage === 'sled' && Math.abs(tPull - K.PULL) < 0.05 && r.vals.dist.text === 'na saneh', `${r.stage} ${tPull.toFixed(2)}`);
const str1 = r.str; for (let i = 0; i < 60 * 5; i++) { S.place(r.sw.x - 40, r.sw.z, Math.PI); r.step(1 / 60); }
check('on the sled: his strength no longer falls; back to the beach', r.str === str1 && /nazaj na obalo/.test(r.hint), r.hint);
S.place(E[0] + N[0] * 60, E[1] + N[1] * 60, Math.atan2(-N[1], -N[0])); r.autoIn = [0, 1, 0]; let vMaxT = 0;
for (let i = 0; i < 60 * 30 && !r.end; i++) { r.step(1 / 60); vMaxT = Math.max(vMaxT, S.speed); }
check('the tow: no faster than K.VTOW; at the beach: done, the jet ski off (the camera back on the quad)', r.end === 'win' && vMaxT <= K.VTOW + 1e-9 && !S.on && r.stage === 'done', `${r.end} ${vMaxT.toFixed(2)}`);
// his strength: parked on the quad he gives up in about 4 minutes; failed
F = mk(K.STOP - 10); r = new Missions.Run(D, F); D.begin.call(D, r);
let tF = 0; for (let i = 0; i < 60 * 400 && !r.end; i++) { r.step(1 / 60); tF += 1 / 60; }
check('his strength runs out in 3.5-4.5 minutes: failed', r.end === 'fail' && /moči/.test(r.why) && tF > 210 && tF < 270 && r.vals.moc.text === '0 %', `${tF.toFixed(0)} s ${r.why}`);
check('the stars: 3 within the strength\'s time with room to search', D.stars[1] < tF - 30);
// round the lap to the finish without the rescue: failed
F = mk(K.STOP + 100); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.finished = true; r.step(0.1);
check('over the finish line (past the beach): failed', r.end === 'fail' && /mimo plaže/.test(r.why), r.why);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
