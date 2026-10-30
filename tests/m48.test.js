// Special mission 48 · Narasla reka (js/missions/m48.js, the kit js/missions/kit.js), no browser: its race (Longford, alone, in the rain,
// the rescue truck on the KAMEN's physics), the river rising toward the first wooden bridge's deck, the logs down the river (under the
// bridge on the river's line) jamming against its piles once the water is close to the deck, the farm (stopped: they climb on one by one,
// K.CAP at most; ODPELJI leaves with fewer; too fast: nobody), the town (stopped: they climb down; the truck turned round toward the farm,
// its place and height kept), the truck turned toward the bridge at the farm when it came from the town, too fast over the bridge with
// people: damage; no wrong way, no Na progo on the road; everybody in the town: done; the bridge gone or over the finish: failed; the gauges.
//   node tests/m48.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm48.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('48'), K = D.K;
const TD = Core.TRACKS.find(t => t.id === 'longford'), T = new Core.Track(TD);
check('48: on Longford, a real track', D.track === 'longford' && !!TD && !TD.test);
const o = D.opts(D);
check('its race: alone, one run, in the rain, the truck on the KAMEN (slower), no damage', o.tt && o.laps === 1 && o.rain === 1 && o.damage === 0 && o.playerModel.id === 'kamen' && o.playerModel.vLim === 80, JSON.stringify({ tt: o.tt, rain: o.rain, m: o.playerModel.id }));
check('9 people, at most 4 on the truck; no clock of its own, the stars in order', K.N === 9 && K.CAP === 4 && D.limit === 0 && D.stars[0] < D.stars[1]);
check('the places in the order of the road: the start, the farm, the bridge (the river under it), the town', K.S0 < K.FARM && K.FARM + K.ZONE < K.BR[0] && K.BR[0] < K.RIV && K.RIV < K.BR[1] && K.BR[1] < TD.lf.town[0] + 40 && K.TOWN < TD.lf.town[1] && TD.lf.bridges[0][0] === K.BR[0]);
check('the deck over the river (from the track: the road on the bridge), the water starting 2 m under it', Math.abs(T.hy[T.idx(K.RIV)] - K.DECK) < 0.15 && K.DECK - K.L0 > 1.9 && K.L0 > -31.2);

// a fake truck on the track: at s, heading along the road (dir 1) or back (-1)
const mk = (s, dir) => { const i = T.idx(s), P = { x: T.px[i], z: T.pz[i], h: T.hd[i] + (dir < 0 ? Math.PI : 0), y: T.hy[i], py: T.hy[i], roadY: T.hy[i], vx: 0, vz: 0, w: 0, finished: false, wrongT: 0, stuckT: 0, q: null,
  place(x, z, h) { this.x = x; this.z = z; this.h = h; this.y = this.py = 0; this.vx = this.vz = this.w = 0; } };
  P.q = T.query(P.x, P.z, i, {}); return { player: P, track: T }; };
const put = (P, s, dir) => { const i = T.idx(s); P.x = T.px[i]; P.z = T.pz[i]; P.h = T.hd[i] + (dir < 0 ? Math.PI : 0); P.y = P.roadY = T.hy[i]; P.q = T.query(P.x, P.z, i, {}); };
const run = (s, dir) => { const F = mk(s, dir || 1), r = new Missions.Run(D, F); D.begin.call(D, r); return { F, r, P: F.player }; };
const steps = (r, sec, dt) => { dt = dt || 1 / 30; for (let t = 0; t < sec - 1e-9 && !r.end; t += dt) r.step(dt); };

let { r, P } = run(K.S0);
check('begin: the panel (the water 207 cm under the deck, 0 / 9, the bridge holds the rise\'s time, the logs under it)', r.vals.gap.text === '207 cm' && r.vals.evak.text === '0 / 9' && r.vals.most.text === 'še ' + Missions.clock((K.DECK - K.L0) / K.RISE) && r.vals.plavje.text === 'pod mostom', JSON.stringify(r.vals));
check('the farm\'s people beside the road, the gathering place in the town on the other side of the road', (() => { const a = T.query(r.wait.x, r.wait.z, T.idx(K.FARM), {}), b = T.query(r.dropAt.x, r.dropAt.z, T.idx(K.TOWN), {}); return Math.abs(a.d) > T.wS(K.FARM) + 2 && Math.abs(a.d) < 10 && Math.abs(a.s - K.FARM) < 2 && Math.abs(b.d) > T.wS(K.TOWN) && Math.abs(b.s - K.TOWN) < 2; })());
// the river: under the bridge, the logs' line downstream (the water level falls along the centre line)
{ const p0 = r.riv(0), iB = T.idx(K.RIV), dB = Math.hypot(p0.x - T.px[iB], p0.z - T.pz[iB]), rv = TD.rivers.find(x => /South Esk/.test(x[0]))[1];
  let k0 = 0, bd = 1e9; rv.forEach((p, k) => { const d = Math.hypot(p[0] - p0.x, p[1] - p0.z); if (d < bd) { bd = d; k0 = k; } });
  const a = r.riv(-300), b = r.riv(300), la = rv.reduce((m, p) => Math.hypot(p[0] - a.x, p[1] - a.z) < Math.hypot(m[0] - a.x, m[1] - a.z) ? p : m), lb = rv.reduce((m, p) => Math.hypot(p[0] - b.x, p[1] - b.z) < Math.hypot(m[0] - b.x, m[1] - b.z) ? p : m);
  check('the river\'s line crosses the road at the bridge; the logs go downstream (the water lower down the line)', dB < 20 && lb[3] <= la[3] && rv.indexOf(lb) > rv.indexOf(la), `${dB.toFixed(1)} ${la[3]} ${lb[3]}`); }
// the water rises
steps(r, 100);
check('100 s: the water risen K.RISE a second, the bridge\'s life the time to the deck', Math.abs(r.lvl - (K.L0 + K.RISE * 100)) < 0.01 && Math.abs(r.life - ((K.DECK - r.lvl) / K.RISE - r.dmg)) < 0.01 && !r.end, `${r.lvl.toFixed(3)} ${r.life.toFixed(1)}`);
check('no wrong way, the logs under the bridge (no damage, the water far under the deck)', P.wrongT === 0 && r.dmg === 0 && r.hits === 0);
P.wrongT = 3; P.stuckT = 2; r.step(0.1);
check('every step: no NAPAČNA SMER (wrongT 0), stopped on the road: no Na progo (stuckT 0)', P.wrongT === 0 && P.stuckT === 0);
P.q.d = 20; P.stuckT = 2; r.step(0.1); P.q.d = 0;
check('stopped off the road: the rescue stays possible', P.stuckT === 2);

// the farm: driving through it, nobody boards
({ r, P } = run(K.FARM)); P.vx = 8; steps(r, 3);
check('through the farm too fast: nobody boards', r.aboard === 0 && r.stage === 'drive', r.stage);
P.vx = 0; steps(r, K.BOARD * 1.5);
check('stopped at the farm: held, the first one on board after K.BOARD s, ODPELJI shown', r.stage === 'load' && P.locked === true && r.aboard === 1 && r.farm === 8 && /ODPELJI/.test(r.hint) && r.vals.evak.text === '0 / 9 (+1)', `${r.stage} ${r.aboard} ${r.hint}`);
const h0 = P.h; steps(r, K.BOARD * 3 + 0.2);
check('full (K.CAP): off toward the bridge, no turn needed (it faces it), let go', r.aboard === K.CAP && r.farm === K.N - K.CAP && r.stage === 'go' && !P.locked && P.h === h0, `${r.aboard} ${r.stage}`);
steps(r, 2);
check('full: nobody more boards while it stands there', r.aboard === K.CAP && r.farm === K.N - K.CAP);
// ODPELJI with fewer
({ r, P } = run(K.FARM)); steps(r, K.BOARD + 0.1); r.autoGo = true; r.step(1 / 30);
check('ODPELJI: off with fewer (one on the truck)', r.aboard === 1 && r.stage === 'go' && !P.locked, `${r.aboard} ${r.stage}`);

// over the bridge: slowly, no damage; fast with people: damage
({ r, P } = run(K.FARM)); steps(r, K.BOARD * 4 + 0.3); put(P, K.RIV, 1); P.vx = K.VBR * 0.8; steps(r, 2);
check('over the bridge slowly with people: no damage', r.aboard === K.CAP && r.dmg === 0, `${r.dmg}`);
P.vx = K.VBR * 2; P.vz = 0; const L0 = r.life; steps(r, 2);
check('over the bridge too fast with people: the bridge gives (about K.SPDMG s a second a person, times the speed over K.VBR)', r.dmg > K.SPDMG * K.CAP * 2 * 1.5 && L0 - r.life > r.dmg * 0.9, `${r.dmg.toFixed(1)}`);

// the town: they climb down, then the truck is turned round toward the farm
({ r, P } = run(K.FARM)); steps(r, K.BOARD * 4 + 0.3); put(P, K.TOWN, 1); P.vx = P.vz = 0; const x0 = P.x, z0 = P.z, y0 = P.y; steps(r, K.DROP + 0.1);
check('stopped at the gathering place: held, one climbs down after K.DROP s', r.stage === 'drop' && P.locked && r.safe === 1 && r.aboard === K.CAP - 1 && /izstopajo/.test(r.hint), `${r.stage} ${r.safe}`);
steps(r, K.DROP * 3 + 0.1);
check('all down: the truck turning round (held)', r.safe === K.CAP && r.aboard === 0 && r.stage === 'turn' && P.locked, `${r.safe} ${r.stage}`);
steps(r, K.TURN / 2);
const mid = Math.cos(P.h - T.hd[T.idx(K.TOWN)]);
steps(r, K.TURN / 2 + 0.2);
check('turned: over K.TURN s (half way across the road), now toward the farm; its place, height and road kept; let go', Math.abs(mid) < 0.5 && Math.cos(P.h - T.hd[T.idx(K.TOWN)]) < -0.99 && Math.hypot(P.x - x0, P.z - z0) < 0.01 && P.y === y0 && P.roadY === y0 && Math.abs(P.q.s - K.TOWN) < 2 && !P.locked && r.stage === 'go', `${mid.toFixed(2)} ${P.y} ${P.q.s.toFixed(1)}`);
check('the hint: back to the farm', /kmetijo/.test(r.hint), r.hint);
// back at the farm, from the town: loaded, then turned toward the bridge
put(P, 1650, -1); P.vx = 10; r.step(0.1); put(P, K.FARM, -1); P.vx = 0; steps(r, K.BOARD * 4 + 0.1);
check('at the farm from the town: full again, turned toward the bridge', r.aboard === K.CAP && r.farm === K.N - 2 * K.CAP && r.stage === 'turn', `${r.aboard} ${r.stage}`);
steps(r, K.TURN + 0.2);
check('turned toward the bridge', Math.cos(P.h - T.hd[T.idx(K.FARM)]) > 0.99 && r.stage === 'go');
const trip = (back) => { put(P, 1650, back ? -1 : 1); P.vx = 3; r.step(0.1); put(P, back ? K.FARM : K.TOWN, back ? -1 : 1); P.vx = 0; steps(r, back ? K.BOARD * 2 + K.TURN + 0.4 : K.DROP * 5 + K.TURN + 0.4); };
trip(false); check('the second load down in the town, turned back', r.safe === 2 * K.CAP && r.stage === 'go' && Math.cos(P.h - T.hd[T.idx(K.TOWN)]) < -0.99, `${r.safe} ${r.stage}`);
trip(true); check('the last one: on board (nobody left at the farm), off toward the bridge', r.aboard === 1 && r.farm === 0 && r.stage === 'go' && !r.btn.shown, `${r.aboard} ${r.stage}`);
trip(false);
check('everybody in the town: done', r.end === 'win' && r.safe === K.N && r.vals.evak.text === '9 / 9', `${r.end} ${r.safe}`);

// the logs: with the water close to the deck they hit the bridge (each K.HITDMG s); the panel says so
({ r, P } = run(K.S0)); r.t = (K.DECK - K.HITGAP + 0.3 - K.L0) / K.RISE; steps(r, 60);
check('the water within K.HITGAP of the deck: logs hit the bridge (K.HITDMG s each)', r.hits >= 2 && Math.abs(r.dmg - r.hits * K.HITDMG) < 1e-9 && r.vals.plavje.text !== 'pod mostom', `${r.hits} ${r.dmg} ${r.vals.plavje.text}`);
({ r, P } = run(K.S0)); steps(r, 120);
check('the water low: the logs pass under the bridge', r.hits === 0 && r.vals.plavje.text === 'pod mostom');
// the bridge gone with people left: failed
({ r, P } = run(K.S0)); r.dmg = (K.DECK - K.L0) / K.RISE - 5; steps(r, 6);
check('the bridge gone, people left: failed', r.end === 'fail' && /zalila/.test(r.why), r.why);
({ r, P } = run(K.S0)); steps(r, (K.DECK - K.L0) / K.RISE + 2, 0.5);
check('without hurry: the water on the deck by the rise\'s time at the latest, failed', r.end === 'fail' && r.t <= (K.DECK - K.L0) / K.RISE + 0.5, `${r.t}`);
// over the finish line before everybody is safe
({ r, P } = run(K.S0)); P.finished = true; r.step(0.1);
check('over the finish (a lap on): failed', r.end === 'fail' && /mimo/.test(r.why), r.why);

// the time: the logs from the time they hit to the deck: the bridge holds 7 minutes and more, more than the stars' times
{ const t1 = (K.DECK - K.HITGAP - K.L0) / K.RISE, every = (K.LOGR[1] - K.LOGR[0]) / K.LOGV / K.LOGS, tEnd = ((K.DECK - K.L0) / K.RISE + K.HITDMG * t1 / every) / (1 + K.HITDMG / every);
  check('the playing time: the bridge holds about 7-8 minutes (the logs at their full rate), past the 2 stars\' time', tEnd > 420 && tEnd < 500 && tEnd > D.stars[1] + 40, tEnd.toFixed(0)); }

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
