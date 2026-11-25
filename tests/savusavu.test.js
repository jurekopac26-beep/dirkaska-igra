// Savusavu: an open road with four ways to drive it on one card, as Hải Vân (def.modes: the race, the time trial, the duel in the traffic and
// the run from the police). The road: the real line of the coast road east of Savusavu on Vanua Levu (Fiji), at full scale and about 2.5 km:
// from the plateau by the airfield (~5 m) north over a low wooded ridge (~78 m) and down to the edge of the town (~12 m); no hairpins, left-hand
// traffic. Its data as tools/proga/proga.py wrote it and the shared world of the passes (js/world-prelaz.js) reads it: the terrain's rows, the
// land cover's run-length code (8 classes, forest and bush most of it), the satellite colours (one RGB 5-6-5 per terrain cell near the road),
// the far view's grid with the sea of the bay. The open road's traffic is its own mix (def.traffic): cars, minibuses, buses and lorries. A whole
// race into the town (12 AI + the player on autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the
// traffic on autopilot: both reach the town and the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/savusavu.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'savusavu'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale, about 2.5 km; left-hand traffic; its name as the rules want it
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 10 m wide, left-hand traffic, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5 && def.leftHand === true && def.name === 'Savusavu, Fidži' && def.en.name === 'Savusavu, Fiji',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from ~5 m by the airfield over the ridge (~78 m) to the town (~12 m), 2.4-2.6 km', Math.abs(def.alt[0] - 5) < 5 && Math.abs(def.alt[1] - 12) < 5 && T.raceLen > 2400 && T.raceLen <= 2600 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('savusavu'));

// 2. the ridge: up and down (the top of the road where its sign says, at the sign's altitude), no hairpins; the HUD knows the plateau, the
// ridge, the bay and the town at the finish
{
  let top = -1e9, ts = 0, gmax = 0;
  for (let i = T.startIdx; i < T.finishIdx; i++) { gmax = Math.max(gmax, Math.abs(T.grade[i])); if (T.hy[i] > top) { top = T.hy[i]; ts = i * T.ds - T.startS; } }
  const sl = T.names.find(q => /^Sleme · \d{2} m$/.test(q.n));
  check('ridge: the road\'s top within 40 m of the ridge\'s sign, at its altitude; no hairpins; nowhere steeper than ~12.5 % up or down',
    !!sl && Math.abs(sl.d - ts) < 40 && Math.abs(+sl.n.match(/(\d+) m$/)[1] - T.altAt(top)) < 2 && !(def.curves || []).length && gmax < 0.125 && T.hFinish - T.hStart < 15 && top - T.hStart > 60,
    `top ${T.altAt(top).toFixed(1)} m at ${Math.round(ts)} m, steepest ${(gmax * 100).toFixed(1)} %`);
  check('names: the HUD and the commentator know the plateau, the ridge, the bay and the town at the finish',
    T.names.length === 4 && T.names[0].n === 'Planota pri letališču' && T.names.some(q => q.n === 'Nad zalivom Savusavu' && q.say) && T.names[3].n === 'Savusavu' && T.names[3].d > T.raceLen - 30,
    T.names.map(q => q.n).join(' | '));
}

// 3. the data for the shared world of the passes (tools/proga): the terrain rows, the land cover cell for cell (forest and bush most of it),
// one satellite colour per terrain cell near the road, the far view's grid with the sea of the bay (wet nodes)
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (forest and bush most)', rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[1] + cnt[2] > cells / 2,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: ${cnt.join(' ')})`);
  check('data: the ground\'s satellite colours, one (RGB 5-6-5) per terrain cell near the road', Buffer.from(def.col.b64, 'base64').length === 2 * cellsNear, `${cellsNear} cells`);
  const F = def.farDem, nf = F.nx * F.nz, wet = F.lake.reduce((s, v, k) => s + (k % 2 ? v : 0), 0);
  check('data: the far view (~9 km round on a 250 m grid, heights 2 bytes a node, the sea as wet runs, a good part of it)', Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250 && wet > nf / 5,
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
