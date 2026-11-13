// Canaries: an open road on the west coast of Saint Lucia with four ways to drive it on one card, as Kanaba (def.modes: the race, the time trial,
// the duel in the traffic and the run from the police). The road: the real line of the coast road north from the village of Canaries at full
// scale and just under 5 km: from ~44 m above the bay past the hamlet of Anse La Verdue up the forested ridge (~177 m), down into the valley
// (~82 m) and up a hairpin (a left, ~170 degrees) to ~178 m at the line, the road's highest point. They drive on the left (def.leftHand). The drop beside the road has a
// guardrail and the track's wall behind it: no car falls over the edge (falling is Killar's alone). Its data as tools/proga/proga.py wrote it and
// the shared world of the passes (js/world-prelaz.js) reads it: the terrain's rows, the land cover's run-length code (the tropical forest most of
// it), the satellite colours, the far view's grid; one small lake, no cable car. The open road's traffic is its own mix (def.traffic): cars and
// minibuses most. A whole race (12 AI + the player on autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in
// the traffic on autopilot. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/canaries.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'canaries'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale, just under 5 km; driven on the left; its name as the rules want it
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 9 m wide, on the left, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 4.5 && def.leftHand && def.name === 'Canaries, Sveta Lucija' && def.en.name === 'Canaries, Saint Lucia',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from ~44 m over the ridge and the valley up to ~178 m, 4.9-5 km (the rule: 1-5 km)', Math.abs(def.alt[0] - 44) < 10 && Math.abs(def.alt[1] - 178) < 10 && T.raceLen > 4900 && T.raceLen <= 5000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('canaries'));
check('track: no drop to fall into (falling over the edge is Killar\'s alone: the guardrail and the wall stop every car)', !def.dropAt && !T.def.dropAt);

// 2. the named places: the ridge the highest point before the valley, its sign's altitude the road's own; the hairpin a real left of ~170 degrees;
// the HUD knows the hamlet, the ridge, the valley and the hairpin, in order along the road
{
  const alt = (d) => T.altAt(T.hy[T.idx(T.startS + d)]);
  let top = -1e9, topD = 0; for (let d = 0; d < 3500; d += 5) { const h = alt(d); if (h > top) { top = h; topD = d; } }
  const ridge = T.names.find(q => /^Greben · \d+ m$/.test(q.n)), ridgeH = ridge ? +ridge.n.match(/(\d+) m$/)[1] : 0;
  check('places: the ridge is the top of the road before the valley (within 60 m), its sign\'s altitude the road\'s', !!ridge && Math.abs(ridge.d - topD) < 60 && Math.abs(ridgeH - top) < 3 && ridge.say,
    `top ${top.toFixed(0)} m at ${topD} m, sign ${ridge ? ridge.n + ' at ' + ridge.d : '-'}`);
  const hp = T.names.find(q => q.n === 'Serpentina'); let turn = 0;
  if (hp) { const a = T.idx(T.startS + hp.d - 40), b = T.idx(T.startS + hp.d + 40); for (let i = a; i < b; i++) turn += wrap(T.hd[i + 1] - T.hd[i]); }
  check('places: the hairpin is a left of 150 degrees and more', !!hp && turn < -2.6, `turn ${Math.round(turn * 57.3)} degrees`);
  const ns = T.names.map(q => q.n.split(' · ')[0]);
  check('places: the HUD and the commentator know the hamlet, the ridge, the valley and the hairpin, in order', ns.join('|') === 'Anse La Verdue|Greben|Dolina|Serpentina' && T.names.every((q, k) => !k || q.d > T.names[k - 1].d),
    T.names.map(q => q.n).join(' | '));
  // up the ridge, down to the valley and up again, nowhere steeper than ~12.5 %
  let gmax = 0; for (let i = T.startIdx; i < T.finishIdx; i++) gmax = Math.max(gmax, Math.abs(T.grade[i]));
  check('grades: ~135 m up from the start to the finish over the ridge and the valley, nowhere steeper than ~12.5 %', gmax < 0.125 && T.hFinish > T.hStart + 100,
    `steepest ${(gmax * 100).toFixed(1)} %, ${Math.round(T.hFinish - T.hStart)} m start to finish`);
}

// 3. the data for the shared world of the passes (tools/proga): the terrain rows, the land cover cell for cell (the forest most of it, shrubs, the
// villages), one satellite colour per terrain cell near the road, the far view's grid; one small lake and no cable car
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (the forest most, shrubs, the villages)', rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[1] > cells / 2 && cnt[2] > 1000 && cnt[3] > 100,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, forest ${cnt[1]}, shrubs ${cnt[2]}, built ${cnt[3]}, scree ${cnt[7]})`);
  check('data: the ground\'s satellite colours, one (RGB 5-6-5) per terrain cell near the road', Buffer.from(def.col.b64, 'base64').length === 2 * cellsNear, `${cellsNear} cells`);
  check('data: one small lake and no cable car', (def.lakes || []).length === 1 && !(def.cables || []).length && !(def.pylons || []).length);
  const F = def.farDem, nf = F.nx * F.nz, wet = F.lake.reduce((s, v, k) => s + (k % 2 ? v : 0), 0);
  check('data: the far view (~9 km round on a 250 m grid, heights 2 bytes a node, the lakes as runs)', Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250,
    `${F.nx}x${F.nz}, lowest ${F.lo} m, ${wet} wet nodes`);
}

// 4. the open road's traffic: the island's coast road, cars and minibuses most, few lorries and motorbikes; vehicles both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0), vans = tf.veh.filter(v => v.kind === 1);
  check('traffic: cars and minibuses most, both ways, fewer lorries and motorbikes', tf.veh.length > 8 && cars.length + vans.length > trucks.length + bikes.length && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${cars.length} cars, ${vans.length} vans, ${bikes.length} motorbikes, ${trucks.length} trucks, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
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

// 6. a whole race along the coast road on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
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
