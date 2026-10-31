// Special mission 47 · Gozdni požar (js/missions/m47.js, the kit js/missions/kit.js), no browser: its race (Great Alpine Road, alone, the
// fire engine), the fire's edge (K.N cells along the road on one side, the farm on the other), the cells creeping toward the road with the
// wind and growing back, the water on a cell (slowly enough and within reach) putting it out, too fast or too far: no water, the pond
// filling the tank, a cell at the road: the fire jumps it, failed; all out: done; past the fire: failed; the gauges.
//   node tests/m47.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

global.Core = loadCore();
global.Lang = require(path.join(ROOT, 'js', 'lang.js'));
global.Missions = require(path.join(ROOT, 'js', 'missions.js'));
global.MisKit = require(path.join(ROOT, 'js', 'missions', 'kit.js'));
require(path.join(ROOT, 'js', 'missions', 'm47.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const D = Missions.byId('47'), K = D.K;
const T = new Core.Track(Core.TRACKS.find(t => t.id === 'greatalpine'));
check('47: on the Great Alpine Road, a real track', D.track === 'greatalpine' && !Core.TRACKS.find(t => t.id === 'greatalpine').test);
const o = D.opts(D);
check('its race: alone, the fire engine (slower), no damage', o.tt && o.damage === 0 && o.playerModel.id === 'titan' && o.playerModel.vLim < 120);
const mk = (s) => { const p = { q: { s }, x: 0, z: 0, h: 0, vx: 0, vz: 0, w: 0, finished: false }; return { player: p, track: T }; };
const s1 = T.startS + K.S0;
let F = mk(s1 - 500), r = new Missions.Run(D, F); D.begin.call(D, r);
check('the fire: K.N cells along the road, all burning, the nearest at least 14 m from the road', r.cells.length === K.N && r.cells.every(c => c.f > 0 && c.d >= K.D0[0]) && r.cells[K.N - 1].s - r.cells[0].s < K.LEN, String(Math.min(...r.cells.map(c => c.d))));
check('the cells on one side, the farm on the other', (() => { const c = r.cells[10], i = T.idx(c.s), sc = (c.x - T.px[i]) * T.nx[i] + (c.z - T.pz[i]) * T.nz[i], j = T.idx(r.sP), sp = (r.pond.x - T.px[j]) * T.nx[j] + (r.pond.z - T.pz[j]) * T.nz[j]; return Math.sign(sc) === r.side && Math.sign(sp) === -r.side; })());
check('begin: the panel (the water full, 0 % out, the wind)', r.vals.voda.text === K.WATER + ' l' && r.vals.pog.text === '0 %' && r.vals.veter.text === K.WIND + ' km/h', JSON.stringify(r.vals));
const d0 = r.cells.map(c => c.d); for (let i = 0; i < 60 * 10; i++) r.step(1 / 60);
check('10 s: every cell nearer the road (the wind)', r.cells.every((c, k) => c.d < d0[k]) && !r.end);
// on a cell, slowly: it goes out
const c0 = r.cells[3]; F.player.q.s = c0.s; F.player.x = c0.x - 10; F.player.z = c0.z; r.autoSpray = { x: c0.x, y: c0.y, z: c0.z };
const w0 = r.water; for (let i = 0; i < 60 * 3; i++) r.step(1 / 60);
check('the water on a cell, standing: out in under 3 s, the water used', c0.f === 0 && r.water < w0 - K.FLOW * 1, `${c0.f} ${(w0 - r.water).toFixed(0)}`);
check('POGAŠENO counts it', r.vals.pog.text === Math.round(100 / K.N) + ' %', r.vals.pog.text);
const c1 = r.cells[4]; F.player.vx = K.VMAX + 1; r.autoSpray = { x: c1.x, y: c1.y, z: c1.z }; F.player.x = c1.x - 10; F.player.z = c1.z; const f1 = c1.f, w1 = r.water; r.step(0.5);
check('too fast: no water', c1.f >= f1 && r.water === w1 && /Prehitro/.test(r.hint), r.hint);
F.player.vx = 0; F.player.x = c1.x - K.RANGE - 5; r.step(0.5);
check('too far: no water', r.water === w1 && /Predaleč/.test(r.hint), r.hint);
r.autoSpray = null;
// the pond fills the tank
r.water = 100; F.player.q.s = r.sP; F.player.vx = 0; r.step(1);
check('stopped at the pond: the tank fills', r.water > 100 + K.FILL * 0.9 && /Polnjenje/.test(r.hint), `${r.water.toFixed(0)} ${r.hint}`);
// a cell at the road: the fire jumps it
r.cells[7].d = 0.001; r.step(0.1);
check('a burning cell at the road: failed', r.end === 'fail' && /preskočil/.test(r.why), r.why);
F = mk(s1 + 100); r = new Missions.Run(D, F); D.begin.call(D, r); for (const c of r.cells) c.f = 0; r.step(0.1);
check('every cell out: done', r.end === 'win');
F = mk(s1 + 100); r = new Missions.Run(D, F); D.begin.call(D, r); F.player.finished = true; r.step(0.1);
check('over the finish (past the fire): failed', r.end === 'fail' && /mimo/.test(r.why), r.why);
check('the time: the nearest cell takes longer to reach the road than the drive and a pass along the fire', K.D0[0] / K.CREEP > 300 && D.limit > K.D0[0] / K.CREEP);

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
