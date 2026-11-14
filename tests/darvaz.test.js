// Darvaz: an open road with four ways to drive it on one card, as Bâlea (def.modes: the race, the time trial, the duel in the traffic and
// the run from the police). The road: the real line of the M41 (РБ04) along the right bank of the Panj in the gorge of the Darvaz range
// (Tajikistan), at full scale and about 3.9 km, driven upriver: nearly level (~1505 m), bend after bend on the ledge at the foot of the walls.
// Its data as tools/proga/proga.py wrote it and the shared world of the passes (js/world-prelaz.js) reads it: the terrain's rows, the land
// cover's run-length code (8 classes: rock and scree most of it), the satellite colours, the Panj beside the road, the far view's grid. The
// open road's traffic is its own mix (def.traffic): lorries, cars and minibuses both ways. A whole race up the gorge (12 AI + the player on
// autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the traffic on autopilot: both reach the finish
// and the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/darvaz.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'darvaz'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale, about 3.9 km; its name as the rules want it
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 10 m wide, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5 && def.name === 'Darvaz, Tadžikistan' && def.en.name === 'Darvaz, Tajikistan',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: ~1505 m all the way, 3.8-4.1 km', Math.abs(def.alt[0] - 1504) < 10 && Math.abs(def.alt[1] - 1507) < 10 && T.raceLen > 3800 && T.raceLen <= 4100 && Math.abs(def.realKm - T.raceLen / 1000) < 0.1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('darvaz'));

// 2. the road along the river: twisty (the heading turning through 600 degrees and more over the race), nearly level (nowhere steeper than 4 %);
// the HUD and the commentator know the bridge on the side stream, the wall above the Panj and the gorge, in order up the road
{
  let turn = 0, gmax = 0;
  for (let i = T.startIdx; i < T.finishIdx; i++) { turn += Math.abs(wrap(T.hd[i + 1] - T.hd[i])); gmax = Math.max(gmax, Math.abs(T.grade[i])); }
  check('road: twisty along the river (600 degrees of turning and more), nearly level (nowhere steeper than 4 %)', turn * 57.3 > 600 && gmax < 0.04,
    `turning ${Math.round(turn * 57.3)} degrees, steepest ${(gmax * 100).toFixed(1)} %`);
  const want = ['Most čez Pšiharv', 'Stena nad Panjem', 'Soteska Darvaz'], got = want.map(w => T.names.find(q => q.n.startsWith(w)));
  check('names: the HUD and the commentator know the bridge, the wall above the Panj and the gorge, in order up the road',
    got.every(q => q && q.say && q.say.length) && got.every((q, k) => !k || q.d > got[k - 1].d), T.names.map(q => q.n).join(' | '));
}

// 3. the data for the shared world of the passes (tools/proga): the terrain rows, the land cover cell for cell (rock faces and scree most of
// it, the river), one satellite colour per terrain cell near the road, the Panj beside the road, the far view's grid
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (rock most, scree, the river, little grass, no snow)', rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[4] > cells / 2 && cnt[7] > cells / 10 && cnt[5] > 500 && cnt[0] < cells / 10 && cnt[6] === 0,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, shrubs ${cnt[2]}, rock ${cnt[4]}, water ${cnt[5]}, scree ${cnt[7]})`);
  check('data: the ground\'s satellite colours, one (RGB 5-6-5) per terrain cell near the road', Buffer.from(def.col.b64, 'base64').length === 2 * cellsNear, `${cellsNear} cells`);
  // the Panj: the biggest water, its shore within ~60 m of the road along the wall (the bridge, the wall, the gorge)
  const river = (def.lakes || []).slice().sort((a, b) => b[0] - a[0])[0], shore = [];
  if (river) for (let k = 1; k < river.length; k += 2) shore.push([river[k], river[k + 1]]);
  const near = ['Most čez Pšiharv', 'Stena nad Panjem', 'Soteska Darvaz'].map(w => { const q = T.names.find(m => m.n.startsWith(w)), i = T.idx(T.startS + q.d);
    return Math.min(...shore.map(p => Math.hypot(p[0] - T.px[i], p[1] - T.pz[i]))); });
  check('data: the Panj (over 20 ha of it in the box), its shore within ~70 m of the road at the bridge, the wall and the gorge', river && river[0] > 200000 && near.every(d => d < 70),
    river ? `${Math.round(river[0] / 10000)} ha, shore ${near.map(d => Math.round(d)).join(' / ')} m from the road` : 'none');
  const F = def.farDem, nf = F.nx * F.nz;
  check('data: the far view (~9 km round on a 250 m grid, heights 2 bytes a node, the water as runs)', Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250,
    `${F.nx}x${F.nz}, lowest ${F.lo} m`);
}

// 4. the open road's traffic: lorries, cars and minibuses both ways, a few touring cyclists
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), cars = tf.veh.filter(v => v.kind === 0), bikes = tf.veh.filter(v => v.kind === 3);
  check('traffic: lorries, cars and minibuses both ways (many lorries, few motorbikes)', tf.veh.length > 8 && trucks.length >= 4 && cars.length >= 4 && bikes.length <= trucks.length && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${bikes.length} motorbikes, ${trucks.length} lorries, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
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

// 6. a whole race up the gorge on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
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
  check('race: all 13 cars reach the finish', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot, before the end of the road', slots.every(p => p.parked && p.v < 0.3 && p.s > 20 && p.s < T.len - T.finishS - 5),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the finish, nobody on foot knocked down, the traffic keeps moving
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
  check('duel: both reach the finish through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
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
  // in winter (the cold tarmac, docs/dez-sneg.md): its own set, slower than the summer's, the snow slower still; gold = the same car's winter run x 1.01
  const Z = M.winter; Math.random = seeded(3);
  const rz = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1, winter: true })), Pz = rz.player; rz.start();
  t = 0; k = 0; while (!Pz.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(Pz, rz, DT); rz.step(DT); t += DT; if (Pz.stuckT > 3 || Pz.wrongT > 3) rz.rescue(Pz); }
  Math.random = orig;
  check('winter medals: gold < silver < bronze, in winter and in the snow; slower than the summer\'s, the snow slowest; gold = the stock rally car\'s winter run x 1.01',
    !!Z && asc(Z.cs) && asc(Z.wet.cs) && Z.cs[0] > M.cs[0] && Z.wet.cs[0] >= Z.cs[0] && Z.wet.cs[0] > M.wet.cs[0] && Pz.finished && Math.abs(Pz.finishTime * 1.01 - Z.cs[0]) < 1.5,
    Z ? `winter ${Z.cs.join('/')} s, snow ${Z.wet.cs.join('/')} s, autopilot ${Pz.finishTime ? Pz.finishTime.toFixed(1) : '-'} s` : 'no winter medals');
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
