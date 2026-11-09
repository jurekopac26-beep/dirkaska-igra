// Gudauri: an open road with four ways to drive it on one card, as Bâlea (def.modes: the race, the time trial, the duel in the traffic and the
// run from the police). The road: the real line of the Georgian Military Road up through the ski village of Gudauri (Georgia, the Greater
// Caucasus), at full scale and about 4.8 km: from ~1953 m up four hairpins (def.curves, the game's numbering from the bottom) on the open slopes
// above the White Aragvi's valley, through the hotels of the upper village to ~2213 m before the first avalanche gallery. Its data as
// tools/proga/proga.py wrote it and the shared world of the passes (js/world-prelaz.js) reads it: the terrain's rows, the land cover's run-length
// code (8 classes: the meadows, the planted pine, the village), the satellite colours, the village's buildings (the hotels and the apartment
// blocks among them), the ski slopes' chair lifts, the power line across the road with its towers, the far view's grid. The open road's traffic
// is its own mix (def.traffic): the main road to the border, many long-distance trucks, few motorbikes. A whole race up to the gallery (12 AI +
// the player on autopilot): every car finishes and pulls up in its own slot past the line, before the gallery; a whole duel in the traffic on
// autopilot: both reach the top and the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/gudauri.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'gudauri'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints and climb; at full scale, about 4.8 km; its name as the rules want it
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 11 m wide, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5 && def.name === 'Gudauri, Gruzija' && def.en.name === 'Gudauri, Georgia',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from ~1953 m up to the gallery (~2213 m), 4.7-4.85 km', Math.abs(def.alt[0] - 1953) < 15 && Math.abs(def.alt[1] - 2213) < 10 && T.raceLen > 4700 && T.raceLen <= 4850 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('gudauri'));

// 2. the four hairpins: in order up the road, each a real bend of the line the way its sign says (150 degrees and more over 120 m round it),
// each sign's altitude the road's own; the HUD knows them, the view over the valley, the village and the gallery at the finish
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 60), b = T.idx(T.startS + d + 60); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > 2.55 && Math.sign(a) === cv[k][2]), own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('hairpins: 4, in order up the road, each a bend of 150 degrees and more the way its sign says, each sign\'s altitude the road\'s', cv.length === 4 && order && bends && own,
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}, altitudes ${alt.map(a => Math.round(a)).join(' ')}`);
  check('hairpins: the HUD and the commentator know them (Serpentina 1 .. 4, the view over the Aragvi, the village, the gallery at the finish)',
    T.names.filter(q => /^Serpentina \d+ · \d\.\d{3} m$/.test(q.n)).length === 4 && T.names.some(q => q.n === 'Razgled na dolino Aragvija' && q.say) && T.names.some(q => q.n === 'Gudauri' && q.say) &&
    /^Pred plazovno galerijo · 2\.21\d m$/.test(T.names[T.names.length - 1].n),
    T.names.map(q => q.n).join(' | '));
  // the climb is on the legs: the grade through the hairpins' apexes (+-12 m) lower than on the legs between them; nowhere steeper than ~10.5 %
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  const near = (s) => cv.some(([d]) => Math.abs(s - T.startS - d) < 12), far = (s) => cv.every(([d]) => Math.abs(s - T.startS - d) > 45);
  for (let i = T.startIdx; i < T.finishIdx; i++) { const s = i * T.ds, g = T.grade[i]; gmax = Math.max(gmax, g); if (near(s)) { gin += g; nin++; } else if (far(s)) { gout += g; nout++; } }
  check('grades: the hairpins flatter than the legs, the road climbing all the way, nowhere steeper than ~10.5 %', gin / nin < 0.8 * gout / nout && gmax < 0.105 && T.hFinish > T.hStart + 240,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %, climb ${Math.round(T.hFinish - T.hStart)} m`);
}

// 3. the data for the shared world of the passes (tools/proga): the terrain rows, the land cover cell for cell (the meadows most of it, the pine
// planted round the lower village, the village, scree), one satellite colour per terrain cell near the road, the village's buildings (the hotels
// and the apartment blocks among them, many by the road), the ski slopes' chair lifts, the power line across the road and its towers, the far
// view's grid
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (meadows most, the planted pine, the village, scree)', rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[0] > cells / 2 && cnt[1] > 1000 && cnt[3] > 500 && cnt[7] > 500,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, forest ${cnt[1]}, shrubs ${cnt[2]}, built-up ${cnt[3]}, rock ${cnt[4]}, scree ${cnt[7]})`);
  check('data: the ground\'s satellite colours, one (RGB 5-6-5) per terrain cell near the road', Buffer.from(def.col.b64, 'base64').length === 2 * cellsNear, `${cellsNear} cells`);
  const P = def.points, dRoad = (x, z) => { let d = 1e9; for (const [px, pz] of P) d = Math.min(d, Math.hypot(x - px, z - pz)); return d; };
  const big = def.bld.filter(b => b[6] === 2), bigNear = big.filter(b => dRoad(b[0], b[1]) < 60);
  check('data: the village\'s buildings, the hotels and the apartment blocks among them (over 260 m²), many of them by the road', def.bld.length > 250 && big.length > 60 && bigNear.length > 20,
    `${def.bld.length} buildings, ${big.length} big, ${bigNear.length} of them within 60 m of the road`);
  const lifts = (def.cables || []).filter(c => c.k === 'chair_lift'), liftD = Math.min(...lifts.map(c => { let d = 1e9; for (let k = 0; k < c.p.length; k += 2) d = Math.min(d, dRoad(c.p[k], c.p[k + 1])); return d; }));
  check('data: the ski slopes\' chair lifts above the road (their lines, the stations and pylons)', lifts.length >= 3 && liftD < 400 && (def.pylons || []).length / 3 >= 10, `${lifts.length} chair lifts, the nearest point ${Math.round(liftD)} m from the road's line, ${(def.pylons || []).length / 3} pylons and stations`);
  const pw = (def.power || [])[0], tow = []; for (let k = 0; k + 2 < (def.poles || []).length; k += 3) if (def.poles[k + 2]) tow.push(dRoad(def.poles[k], def.poles[k + 1]));
  check('data: the power line by the road, its steel towers', pw && pw.p.length >= 8 && tow.length >= 8 && Math.min(...tow) < 40, `${pw ? pw.p.length / 2 : 0} points, ${tow.length} towers within 400 m, the nearest ${Math.round(Math.min(...tow))} m from the road's line`);
  const F = def.farDem, nf = F.nx * F.nz;
  check('data: the far view (~9 km round on a 250 m grid, heights 2 bytes a node, the lakes as runs)', Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250,
    `${F.nx}x${F.nz}, lowest ${F.lo} m`);
}

// 4. the open road's traffic: the main road to the border, many long-distance trucks, few motorbikes; vehicles both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0);
  check('traffic: cars, minibuses and many trucks both ways, few motorbikes', tf.veh.length > 8 && trucks.length >= 4 && trucks.length > bikes.length && cars.length > trucks.length && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
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

// 6. a whole race up to the gallery on autopilot: every car finishes, then pulls up in its own slot past the line (before the gallery) and stays there
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
  check('race: all 13 cars reach the top', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot, before the end of the road', slots.every(p => p.parked && p.v < 0.3 && p.s > 20 && p.s < T.len - T.finishS - 5),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody on foot knocked down, the traffic keeps moving
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
  check('duel: both reach the top through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
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
