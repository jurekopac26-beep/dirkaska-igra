// Medeu: an open road with four ways to drive it on one card, as Bâlea (def.modes: the race, the time trial, the duel in the traffic and the
// run from the police). The road: the real line of the road above Almaty (Kazakhstan), at full scale and about 5 km: from the square by the
// great open-air ice rink of Medeu (~1669 m) up two hairpins (def.curves, the game's numbering from the bottom) onto the mudflow dam, along its
// crest, past the basin behind it and up the gorge of the Kishi Almaty to ~1966 m. Its data as tools/proga/proga.py wrote it and the shared
// world of the passes (js/world-prelaz.js, with Medeu's own landmarks in js/world-medeu.js) reads it: the terrain's rows, the land cover's
// run-length code (8 classes: forest and meadows most of it), the satellite colours (one RGB 5-6-5 per terrain cell near the road), the two
// ponds, the gondola's line and pylons, the far view's grid, the map's buildings (OpenStreetMap's only). The open road's traffic is its own
// mix (def.traffic): the city's outing, cars and many minibuses and buses. A whole race (12 AI + the player on autopilot): every car finishes and
// pulls up in its own slot past the line; a whole duel in the traffic on autopilot: both reach the gorge and the traffic keeps moving. The
// medal times of the time trial: the stock rally car on the autopilot.
//   node tests/medeu.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'medeu'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints and climb; at full scale, about 5 km; its name as the rules want it
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 10 m wide, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5 && def.name === 'Medeu, Kazahstan' && def.en.name === 'Medeu, Kazakhstan',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from the rink\'s square (~1669 m) up to the gorge (~1966 m), 4.9-5.1 km', Math.abs(def.alt[0] - 1669) < 10 && Math.abs(def.alt[1] - 1966) < 10 && T.raceLen > 4900 && T.raceLen <= 5100 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('medeu'));

// 2. the two hairpins: in order up the road, each a real bend of the line the way its sign says (150 degrees and more over 120 m round it), each
// sign's altitude the road's own; the HUD knows them, the rink, the dam and the gorge at the finish
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 60), b = T.idx(T.startS + d + 60); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > 2.55 && Math.sign(a) === cv[k][2]), own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('hairpins: 2, in order up the road, each a bend of 150 degrees and more the way its sign says, each sign\'s altitude the road\'s', cv.length === 2 && order && bends && own,
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}, altitudes ${alt.map(a => Math.round(a)).join(' ')}`);
  check('names: the HUD and the commentator know them (the rink, Serpentina 1 and 2, the dam, the gorge at the finish), no person\'s or firm\'s name',
    /^Medeu · 1\.6\d\d m$/.test(T.names[0].n) && T.names.filter(q => /^Serpentina \d+ · \d\.\d{3} m$/.test(q.n)).length === 2 && T.names.some(q => q.n === 'Jez Medeu' && q.say) && /^Soteska Kiši Almati · 1\.96\d m$/.test(T.names[T.names.length - 1].n),
    T.names.map(q => q.n).join(' | '));
  // the road's grades as the terrain model gives them along the line: the steep legs up to the dam and in the gorge (up to ~15 %), the dip
  // past the basin behind the dam; the whole climb ~297 m
  let gmax = 0, gmin = 0; for (let i = T.startIdx; i < T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  const dam = T.altAt(T.hy[T.idx(T.startS + 2650)]);
  check('grades: up to ~15 % on the steep legs, no steeper than ~14 % down into the dip, the dam\'s crest ~1,898 m, the climb ~297 m', gmax < 0.155 && gmin > -0.14 && Math.abs(dam - 1898) < 6 && Math.abs(T.hFinish - T.hStart - 297) < 6,
    `steepest ${(gmax * 100).toFixed(1)} % up, ${(gmin * 100).toFixed(1)} % down, the dam ${Math.round(dam)} m, climb ${Math.round(T.hFinish - T.hStart)} m`);
}

// 3. the data for the shared world of the passes (tools/proga): the terrain rows, the land cover cell for cell (meadows, the spruce forest,
// shrubs, scree, a little built-up land), one satellite colour per terrain cell near the road, the ponds, the gondola, the far view's grid, the
// map's buildings
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (meadows, forest and shrubs most of it, scree, built-up land)', rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[0] + cnt[1] + cnt[2] > cells * 0.85 && cnt[1] > cells * 0.15 && cnt[3] > 100 && cnt[7] > 300,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, forest ${cnt[1]}, shrubs ${cnt[2]}, built-up ${cnt[3]}, rock ${cnt[4]}, water ${cnt[5]}, scree ${cnt[7]})`);
  check('data: the ground\'s satellite colours, one (RGB 5-6-5) per terrain cell near the road', Buffer.from(def.col.b64, 'base64').length === 2 * cellsNear, `${cellsNear} cells`);
  const pyl = (def.pylons || []).length / 3, line = (def.cables || [])[0];
  check('data: the two ponds, the gondola over the dam (its line, pylons and stations)', (def.lakes || []).length === 2 && line && line.p.length >= 12 && pyl >= 10,
    `${(def.lakes || []).length} ponds, ${line ? line.p.length / 2 : 0} points, ${pyl} pylons and stations`);
  const F = def.farDem, nf = F.nx * F.nz;
  check('data: the far view (~9 km round on a 250 m grid, heights 2 bytes a node, the lakes as runs)', Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250,
    `${F.nx}x${F.nz}, lowest ${F.lo} m`);
  check('data: the map\'s buildings (OpenStreetMap\'s own: tools/proga keeps no others), the rink among them', (def.bld || []).length > 80 && (def.bld || []).some(b => Math.hypot(b[0] - 113.4, b[1] - 281.7) < 2),
    `${(def.bld || []).length} buildings`);
}

// 4. the open road's traffic: cars, minibuses and buses both ways, a few motorbikes; vehicles on their own halves of the road
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const cars = tf.veh.filter(v => v.kind === 0), vans = tf.veh.filter(v => v.kind === 1), buses = tf.veh.filter(v => v.kind === 2);
  check('traffic: cars, many minibuses and buses both ways', tf.veh.length > 8 && cars.length > 0 && vans.length + buses.length >= cars.length * 0.5 && buses.length >= 2 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${cars.length} cars, ${vans.length} vans, ${buses.length} buses, ${tf.veh.filter(v => v.kind === 3).length} motorbikes, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
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
  check('race: all 13 cars reach the gorge', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot, before the end of the road', slots.every(p => p.parked && p.v < 0.3 && p.s > 20 && p.s < T.len - T.finishS - 5),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the gorge, nobody on foot knocked down, the traffic keeps moving
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
  check('duel: both reach the gorge through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
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
