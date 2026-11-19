// Izoard: an open road with four ways to drive it on one card, as Bâlea (def.modes: the race, the time trial, the duel in the traffic and the
// run from the police). The road: the real line of the north side of the road over the Col d'Izoard (D902, the Hautes-Alpes, France), at full
// scale and about 5 km: from ~1973 m up eighteen hairpins (def.curves, the game's numbering from the bottom) through the larch and pine forest
// and over the pasture to the col (2360 m), the hairpins flatter than the legs between them. Its data as tools/proga/proga.py wrote it and the
// shared world of the passes (js/world-prelaz.js) reads it: the terrain's rows, the land cover's run-length code (8 classes: forest most of it,
// pasture, shrubs, scree), the satellite colours (one RGB 5-6-5 per terrain cell near the road), the power line along the road and its poles,
// the col's obelisk, the far view's grid. The open road's traffic is its own mix (def.traffic): a summer road over a famous col, cyclists all
// the way up. A whole race up to the col (12 AI + the player on autopilot): every car finishes and pulls up in its own slot past the line, before
// the end of the road; a whole duel in the traffic on autopilot: both reach the col and the traffic keeps moving. The medal times of the time
// trial: the stock rally car on the autopilot.
//   node tests/izoard.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'izoard'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints and climb; at full scale, about 5 km (no more: the rule for the new tracks);
// its name as the rules want it
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 10 m wide, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5 && def.name === 'Izoard, Francija' && def.en.name === 'Izoard, France',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from ~1973 m up to the col (2360 m), 4.8-5.0 km', Math.abs(def.alt[0] - 1973) < 15 && def.alt[1] === 2360 && T.raceLen > 4800 && T.raceLen <= 5000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('izoard'));

// 2. the eighteen hairpins: in order up the road, each a real bend of the line the way its sign says (~150 degrees and more over its own length),
// each sign's altitude the road's own; the HUD knows them, the two ravines and the col at the finish
{
  const cv = def.curves || [], st = Math.round(10 / T.ds), turn = cv.map(([d, , dir]) => {   // (each bend over its own length: out from the apex while the road keeps turning its way, 2 degrees and more every 10 m)
    const i0 = T.idx(T.startS + d), sg = (i, j) => wrap(T.hd[j] - T.hd[i]) * dir; let a = i0, b = i0, s = 0;
    while (a - st > 0 && sg(a - st, a) > 0.035) a -= st; while (b + st < T.N - 1 && sg(b, b + st) > 0.035) b += st;
    for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > 2.53 && Math.sign(a) === cv[k][2]), own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('hairpins: 18, in order up the road, each a bend of ~150 degrees and more the way its sign says, each sign\'s altitude the road\'s', cv.length === 18 && order && bends && own,
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}, altitudes ${alt.map(a => Math.round(a)).join(' ')}`);
  check('hairpins: the HUD and the commentator know them (Serpentina 1 .. 18, the two ravines, the col at the finish)',
    T.names.filter(q => /^Serpentina \d+ · \d\.\d{3} m$/.test(q.n)).length === 18 && T.names.some(q => q.n === "Ravin d'Izoard" && q.say) && T.names.some(q => q.n === "Ravin du Col d'Izoard" && q.say) && T.names[T.names.length - 1].n === "Col d'Izoard · 2.360 m",
    T.names.map(q => q.n).join(' | '));
  // the climb is on the legs: the grade through the hairpins' apexes (+-12 m) lower than on the legs between them; nowhere steeper than ~12 %
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  const near = (s) => cv.some(([d]) => Math.abs(s - T.startS - d) < 12), far = (s) => cv.every(([d]) => Math.abs(s - T.startS - d) > 45);
  for (let i = T.startIdx; i < T.finishIdx; i++) { const s = i * T.ds, g = T.grade[i]; gmax = Math.max(gmax, g); if (near(s)) { gin += g; nin++; } else if (far(s)) { gout += g; nout++; } }
  check('grades: the hairpins flatter than the legs, the road climbing all the way, nowhere steeper than ~12 %', gin / nin < 0.8 * gout / nout && gmax < 0.125 && T.hFinish > T.hStart + 370,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %, climb ${Math.round(T.hFinish - T.hStart)} m`);
}

// 3. the data for the shared world of the passes (tools/proga): the terrain rows, the land cover cell for cell (forest the most of it, pasture,
// shrubs, scree; no lake), one satellite colour per terrain cell near the road, the power line and its poles along the road, the col's obelisk,
// the far view's grid
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (forest the most, pasture, shrubs, scree, no water)', rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[1] > cells * 0.35 && cnt[1] === Math.max(...cnt) && cnt[0] > cells * 0.15 && cnt[2] > 500 && cnt[7] > cells * 0.15 && cnt[5] === 0,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, forest ${cnt[1]}, shrubs ${cnt[2]}, rock ${cnt[4]}, water ${cnt[5]}, scree ${cnt[7]})`);
  check('data: the ground\'s satellite colours, one (RGB 5-6-5) per terrain cell near the road', Buffer.from(def.col.b64, 'base64').length === 2 * cellsNear, `${cellsNear} cells`);
  const line = (def.power || [])[0], poles = (def.poles || []).length / 3, near = (x, z) => { let b = 1e9; for (let i = 0; i < T.N; i += 2) b = Math.min(b, Math.hypot(T.px[i] - x, T.pz[i] - z)); return b; };
  const pts = []; if (line) for (let k = 0; k < line.p.length; k += 2) pts.push(near(line.p[k], line.p[k + 1]));
  check('data: the power line up the road (OpenStreetMap: its line, a pole at each point; 18 and more of them within 120 m of the road, from the start up to the refuge), no lakes, no cable car',
    def.power.length === 1 && pts.length >= 20 && poles >= 20 && pts.filter(d => d < 120).length >= 18 && pts[0] < 60 && !(def.lakes || []).length && !(def.cables || []).length,
    `${pts.length} points, ${poles} poles, ${pts.filter(d => d < 120).length} within 120 m of the road, the top end ${pts[0] ? pts[0].toFixed(0) : '-'} m from it`);
  const ob = def.obelisk, dOb = ob ? near(ob[0], ob[1]) : 1e9, fOb = ob ? Math.hypot(ob[0] - def.finish[0], ob[1] - def.finish[1]) : 1e9;
  check('data: the col\'s obelisk beside the road at the finish (off the road, within 40 m of the line)', ob && dOb > 12 && fOb < 40, ob ? `${dOb.toFixed(1)} m from the road, ${fOb.toFixed(1)} m from the finish` : 'none');
  const F = def.farDem, nf = F.nx * F.nz, wet = F.lake.reduce((s, v, k) => s + (k % 2 ? v : 0), 0);
  check('data: the far view (~9 km round on a 250 m grid, heights 2 bytes a node, the lakes as runs)', Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250,
    `${F.nx}x${F.nz}, lowest ${F.lo} m, ${wet} wet nodes`);
}

// 4. the open road's traffic: cars and motorbikes, cyclists all the way up, hardly any trucks; vehicles on their own halves of the road both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0);
  check('traffic: cars, campers, motorbikes and many cyclists both ways, hardly any trucks', tf.veh.length > 8 && bikes.length >= 2 && cars.length > trucks.length * 3 && tf.veh.filter(v => v.kind === 4).length >= 6 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
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

// 6. a whole race up to the col on autopilot: every car finishes, then pulls up in its own slot past the line (before the end of the road) and stays there
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
  check('race: all 13 cars reach the col', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot, before the end of the road', slots.every(p => p.parked && p.v < 0.3 && p.s > 20 && p.s < T.len - T.finishS - 5),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the col, nobody on foot knocked down, the traffic keeps moving
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
  check('duel: both reach the col through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
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
