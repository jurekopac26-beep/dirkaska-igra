// Chamarel, Mavricij: an open road with four ways to drive it on one card, as Džebel Hafit (def.modes: the race, the time trial, the duel in
// the traffic and the run from the police). The road: the real line of the road from the south-west coast of Mauritius above Case Noyale up the
// forested wall of the highlands to the plateau of Chamarel, at full scale and about 5.0 km: from above the coast (~34 m) through the forest and
// the three hairpins, past the viewpoint at the top of the climb (~300 m), down into the village of Chamarel and up again toward Plaine
// Champagne, to the line (~373 m). Its data as tools/proga-podatki.py wrote it and the shared world of the passes (js/world-prelaz.js, with
// Chamarel's viewpoint and sugar cane in js/world-chamarel.js) reads it: the terrain's rows, the land cover's run-length code (8 classes: the
// forest most of it), the satellite colours, the far view's grid (the ocean off the coast in it), the map's buildings (OpenStreetMap's only).
// No fall anywhere (only Killar has one). Left-hand traffic (def.leftHand), as on Mauritius. A whole race (12 AI + the player on autopilot):
// every car finishes and pulls up in its own slot past the line; a whole duel in the traffic on autopilot: both reach the line and the traffic
// keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/chamarel.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'chamarel'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const altD = (d) => T.altAt(T.hy[T.idx(T.startS + d)]);

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale, about 5.0 km; its name as the rules want it; no sea
// along the road; left-hand traffic; no fall off the edge (the rule: only Killar), the drop side held by the rails
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, two narrow lanes, named "Kraj, Država", no sea, left-hand traffic',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 3.6 && def.name === 'Chamarel, Mavricij' && def.en.name === 'Chamarel, Mauritius' && !def.sea && def.leftHand === true,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt.join(' -> ')} m, modes ${(def.modes || []).join(',')}`);
check('track: from above the coast (~34 m) up the hairpins, through Chamarel, to the line toward Plaine Champagne (~373 m), 4.9-5.1 km', Math.abs(def.alt[0] - 34) < 3 && Math.abs(def.alt[1] - 372.6) < 3 && T.raceLen > 4900 && T.raceLen <= 5100 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 0.5,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: no fall off the edge anywhere (no def.drops, no drop point: only Killar has one)', !def.drops && T.dropAt === null, `drops ${JSON.stringify(def.drops)}, dropAt ${T.dropAt}`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('chamarel'));

// 2. the names on the HUD (Case Noyale, the forest, the switchbacks, the viewpoint, Chamarel, toward Plaine Champagne), each
// sign's height the road's own metres (def.alt: the finish to a tenth, so the climb between start and finish is not scaled: altAt); the grades
{
  const nm = T.names.map(q => q.n), num = (q) => Number(q.n.replace(/^.* · /, '').replace(/ m$/, '').replace('.', ''));
  const signs = T.names.every(q => !/ · \d/.test(q.n) || Math.abs(num(q) - altD(q.d)) < 1.5), want = ['Case Noyale', 'Gozd', 'Serpentine', 'Razgledišče', 'Chamarel', 'Proti Plaine Champagne'];
  check('names: the HUD and the commentator know them (Case Noyale, the forest, the switchbacks, the viewpoint, Chamarel, toward Plaine Champagne), in order, each height the road\'s, no person\'s or firm\'s name',
    nm.length === 6 && want.every((w, k) => nm[k] === w || nm[k].startsWith(w + ' · ')) && nm.filter(q => / · \d/.test(q)).length === 3 && T.names.every((q, k) => !k || q.d > T.names[k - 1].d) && T.names[T.names.length - 1].d <= T.raceLen && signs && T.names.every(q => q.say && q.say.length >= 2),
    nm.join(' | '));
  // the grades: up to ~13 % in the hairpins, down to ~9 % into the village; ~339 m up from the start to the line
  let gmax = -1, gmin = 1; for (let i = T.startIdx; i < T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  check('grades: up to ~13 % in the hairpins, down to ~9 % into the village of Chamarel; ~339 m up from the start to the line', gmax > 0.11 && gmax < 0.14 && gmin < -0.06 && gmin > -0.11 && Math.abs(altD(T.raceLen) - altD(0) - 338.6) < 5,
    `steepest ${(gmax * 100).toFixed(1)} % up, ${(gmin * 100).toFixed(1)} % down, ${altD(0).toFixed(1)} -> ${altD(T.raceLen).toFixed(1)} m`);
}

// 3. the data for the shared world of the passes (tools/proga-podatki.py): the terrain rows, the land cover cell for cell (the forest most of
// it, the grass and the shrubs, the village), one satellite colour per terrain cell near the road, the far view's grid (the ocean off the
// coast), the map's buildings
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (the forest most of it, the grass and the shrubs, a little built-up, a little water)', rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[1] > cells * 0.6 && cnt[0] + cnt[2] > cells * 0.2 && cnt[3] > cells * 0.003 && cnt[5] > 0,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, forest ${cnt[1]}, shrubs ${cnt[2]}, built-up ${cnt[3]}, rock ${cnt[4]}, water ${cnt[5]}, scree ${cnt[7]})`);
  check('data: the ground\'s satellite colours, one (RGB 5-6-5) per terrain cell near the road', Buffer.from(def.col.b64, 'base64').length === 2 * cellsNear, `${cellsNear} cells`);
  const F = def.farDem, nf = F.nx * F.nz; let wet = 0; for (let k = 0, v = 0; k < F.lake.length; k++) { if (v) wet += F.lake[k]; v ^= 1; }
  check('data: the far view (~9 km round on a 250 m grid, heights 2 bytes a node), the ocean off the south-west coast in it', Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250 && F.lo <= 1 && wet > nf * 0.2,
    `${F.nx}x${F.nz}, lowest ${F.lo} m, ${wet} wet nodes`);
  check('data: the map\'s buildings (OpenStreetMap\'s own: tools/proga-podatki.py keeps no others: the houses of Chamarel by the road) and the car parks', (def.bld || []).length >= 40 && (def.pulls || []).length >= 1,
    `${(def.bld || []).length} buildings, ${(def.pulls || []).length} car parks`);
}

// 4. the open road's traffic: cars, vans and buses both ways, cyclists; vehicles on their own (left) halves of the road (Mauritius drives on the left)
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const cars = tf.veh.filter(v => v.kind === 0), vans = tf.veh.filter(v => v.kind === 1), buses = tf.veh.filter(v => v.kind === 2), bikes = tf.veh.filter(v => v.kind === 4);
  check('traffic: cars, vans and buses both ways, cyclists, everyone on the left half', tf.veh.length > 8 && cars.length > 0 && vans.length + buses.length >= 3 && buses.length >= 1 && bikes.length >= 1 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && tf.sd === -1,
    `${tf.veh.length} vehicles: ${cars.length} cars, ${vans.length} vans, ${buses.length} buses, ${tf.veh.filter(v => v.kind === 3).length} motorbikes, ${bikes.length} cyclists`);
}

// 5. the ways to drive it (and an online race: always the race)
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line; online always the race',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5 && !net.timeTrial && net.cars.length === 2,
    'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  Math.random = orig;
}

// 6. a whole race up to Chamarel on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach the line', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot, before the end of the road', slots.every(p => p.parked && p.v < 0.3 && p.s > 20 && p.s < T.len - T.finishS - 5),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the line, nobody on foot knocked down, the traffic keeps moving
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0; const stand = new Map();
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the line through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

// 8. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
