// Koror: an open road with four ways to drive it on one card, as Savusavu (def.modes: the race, the time trial, the duel in the traffic and
// the run from the police). The road: the real line of the main road from the southern tip of Babeldaob over the bridge, along the causeways by the lagoon and
// up the wooded hill into Koror (Palau), at full scale and about 3.3 km: from ~5 m above the bridge down to the causeways (~3 m) and up the
// hill to the town (~56 m); right-hand traffic. The bridge is drawn as a walled causeway (def.bridges: the sea floor right past its barriers).
// Its data as tools/proga/proga.py wrote it and the shared world of the passes (js/world-prelaz.js) reads it: the terrain's rows, the land
// cover's run-length code, the satellite colours (one RGB 5-6-5 per terrain cell near the road), the far view's grid with the lagoon. A whole
// race into the town (12 AI + the player on autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the
// traffic on autopilot: both reach the town and the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/koror.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'koror'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale, about 3.3 km; right-hand traffic; its name as the rules want it
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 10 m wide, right-hand traffic, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5 && !def.leftHand && def.name === 'Koror, Palau' && def.en.name === 'Koror, Palau',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from ~5 m above the bridge over the lagoon and up to the town (~56 m), 3.2-3.4 km', Math.abs(def.alt[0] - 5) < 5 && Math.abs(def.alt[1] - 56) < 5 && T.raceLen > 3200 && T.raceLen <= 3400 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('koror'));

// 2. the lagoon: the bridge and the causeways low over the sea (def.sea, def.bridges), then the climb up the hill; no hairpins; the HUD knows
// the bridge, the causeways, the hill and the town at the finish
{
  let low = 1e9, gmax = 0;
  for (let i = T.startIdx; i < T.finishIdx; i++) { gmax = Math.max(gmax, Math.abs(T.grade[i])); const d = i * T.ds - T.startS; if (d > 900 && d < 1750) low = Math.min(low, T.altAt(T.hy[i])); }
  const br = def.bridges || [];
  check('lagoon: the sea\'s level set (def.sea), one bridge of 300-500 m early on, the causeways within 4 m of the sea; no hairpins; nowhere steeper than ~14 %',
    !!def.sea && def.sea.y === 0 && br.length === 1 && br[0][1] - br[0][0] > 300 && br[0][1] - br[0][0] < 500 && br[0][0] < 400 && low < 4 && low > 0.5 && !(def.curves || []).length && gmax < 0.14 && T.hFinish - T.hStart > 45,
    `bridge ${br.map(b => b.join('-')).join(',')} m, causeways lowest ${low.toFixed(1)} m, steepest ${(gmax * 100).toFixed(1)} %`);
  check('names: the HUD and the commentator know the bridge, the causeways, the hill and the town at the finish',
    T.names.length === 4 && T.names[0].n === 'Most čez kanal' && T.names.some(q => q.n === 'Nasipi ob laguni' && q.say) && T.names[3].n === 'Koror' && T.names[3].d > T.raceLen - 150,
    T.names.map(q => q.n).join(' | '));
}

// 3. the data for the shared world of the passes (tools/proga): the terrain rows, the land cover cell for cell (the lagoon, forest and bush),
// one satellite colour per terrain cell near the road, the far view's grid with the lagoon (wet nodes)
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (the lagoon\'s water a good part, forest and bush most of the land)', rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[5] > cells / 4 && cnt[1] + cnt[2] > (cells - cnt[5]) / 2,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: ${cnt.join(' ')})`);
  check('data: the ground\'s satellite colours, one (RGB 5-6-5) per terrain cell near the road', Buffer.from(def.col.b64, 'base64').length === 2 * cellsNear, `${cellsNear} cells`);
  const F = def.farDem, nf = F.nx * F.nz, wet = F.lake.reduce((s, v, k) => s + (k % 2 ? v : 0), 0);
  check('data: the far view (~9 km round on a 250 m grid, heights 2 bytes a node, the lagoon as wet runs, a good part of it)', Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250 && wet > nf / 5,
    `${F.nx}x${F.nz}, lowest ${F.lo} m, ${wet} wet nodes`);
}

// 4. the open road's traffic: cars most, buses and lorries, few motorbikes; vehicles both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0);
  check('traffic: cars most, both ways', tf.veh.length > 8 && cars.length >= trucks.length && cars.length >= bikes.length && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${bikes.length} motorbikes, ${trucks.length} trucks, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
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

// 6. a whole race into the town on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
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
  check('race: all 13 cars reach the town', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot, before the end of the road', slots.every(p => p.parked && p.v < 0.3 && p.s > 20 && p.s < T.len - T.finishS - 5),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the town, nobody on foot knocked down, the traffic keeps moving
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
  check('duel: both reach the town through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
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
