// Meteora: an open road with four ways to drive it on one card, as Bâlea and Jebel Hafeet (def.modes: the race, the time trial, the duel
// in the traffic and the run from the police). The road: the real line of the road from the village of Kastraki up between the sandstone
// and conglomerate pillars of Meteora above the plain of Thessaly (Greece), at full scale and about 5.9 km: from the village (~254 m) through
// two hairpins and past the monasteries on the rocks, over the saddle (~538 m) and down a little to the end of the road below the last
// monastery (~504 m). Its data as tools/proga writes it and the shared world of the passes (js/world-prelaz.js, with the pillars and the
// monasteries in js/world-meteora.js) reads it: the terrain's rows, the land cover's run-length code (8 classes: the oak scrub and the grass
// most of it, bare rock on the pillars, the village built-up), the satellite colours (one RGB 5-6-5 per terrain cell near the road), the far
// view's grid, the map's buildings (OpenStreetMap's only). No fall anywhere (only Killar has one): the rails hold the car. The open road's
// traffic is its own mix (def.traffic), on the right. A whole race (12 AI + the player on autopilot): every car finishes and pulls up in its
// own slot past the line; a whole duel in the traffic on autopilot: both reach the end and the traffic keeps moving. The medal times of the
// time trial: the stock rally car on the autopilot.
//   node tests/meteora.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'meteora'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const altD = (d) => T.altAt(T.hy[T.idx(T.startS + d)]);

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale, about 5.9 km; its name as the rules want it; no sea; no
// fall off the edge (the rule: only Killar)
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 7 m wide, named "Kraj, Država", no sea',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 3.5 && def.name === 'Meteora, Grčija' && def.en.name === 'Meteora, Greece' && !def.sea,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt.join(' -> ')} m, modes ${(def.modes || []).join(',')}`);
check('track: from Kastraki (~254 m) over the saddle to the end of the road below the last monastery (~504 m), 5.7-6.2 km', Math.abs(def.alt[0] - 254) < 3 && Math.abs(def.alt[1] - 503.6) < 3 && T.raceLen > 5700 && T.raceLen <= 6200 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 0.5,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: no fall off the edge anywhere (no def.drops, no drop point: only Killar has one)', !def.drops && T.dropAt === null, `drops ${JSON.stringify(def.drops)}, dropAt ${T.dropAt}`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('meteora'));

// 2. the names on the HUD (the village, below the pillars, the monastery by the road, the two hairpins, the saddle, the end of the road), each
// sign's height the road's own metres; the grades
{
  const nm = T.names.map(q => q.n), num = (q) => Number(q.n.replace(/^.* · /, '').replace(/ m$/, '').replace('.', ''));
  const signs = T.names.every(q => !/ · \d/.test(q.n) || Math.abs(num(q) - altD(q.d)) < 1.5), want = ['Kastraki', 'Pod stebri', 'Samostan ob cesti', 'Serpentina 1', 'Serpentina 2', 'Sedlo', 'Konec ceste'];
  check('names: the HUD and the commentator know them (the village, the pillars, the monastery, the hairpins, the saddle, the end), in order, each height the road\'s, no person\'s or firm\'s name',
    nm.length === 7 && want.every((w, k) => nm[k].startsWith(w + ' · ')) && T.names.every((q, k) => !k || q.d > T.names[k - 1].d) && T.names[T.names.length - 1].d <= T.raceLen && signs && T.names.every(q => q.say && q.say.length >= 2),
    nm.join(' | '));
  // the grades: up to the saddle (~538 m, about 5 km from the start), then down a little to the end of the road; ~250 m up from the start to the line
  let gmax = -1, gmin = 1; for (let i = T.startIdx; i < T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  let top = -1e9, topD = 0; for (let d = 0; d <= T.raceLen; d += 5) { const a = altD(d); if (a > top) { top = a; topD = d; } }
  check('grades: up to the saddle (~538 m, 4.7-5.3 km from the start), down after it to the end; up to ~15 % at most, down no more than ~10 %; ~250 m up from the start to the line',
    gmax > 0.06 && gmax < 0.16 && gmin > -0.1 && Math.abs(top - 538) < 4 && topD > 4700 && topD < 5300 && Math.abs(altD(T.raceLen) - altD(0) - 250) < 6,
    `steepest ${(gmax * 100).toFixed(1)} % up, ${(gmin * 100).toFixed(1)} % down, ${altD(0).toFixed(1)} -> ${top.toFixed(1)} m at ${topD} m -> ${altD(T.raceLen).toFixed(1)} m`);
}

// 3. the data for the shared world of the passes (tools/proga): the terrain rows, the land cover cell for cell (the scrub and the dry grass
// with the grass most of it, the bare rock of the pillars, the village built-up), one satellite colour per terrain cell near the road, the far
// view's grid, the map's buildings (the village's at the start, the monasteries' along the rest of the road)
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (oak woods, scrub and grass most of it, the bare rock of the pillars, the village built-up, no water)', rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[0] + cnt[1] + cnt[2] > cells * 0.85 && cnt[1] > cells * 0.2 && cnt[3] > cells * 0.02 && cnt[4] > 100 && cnt[5] === 0,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, forest ${cnt[1]}, shrubs ${cnt[2]}, built-up ${cnt[3]}, rock ${cnt[4]}, water ${cnt[5]}, scree ${cnt[7]})`);
  check('data: the ground\'s satellite colours, one (RGB 5-6-5) per terrain cell near the road', Buffer.from(def.col.b64, 'base64').length === 2 * cellsNear, `${cellsNear} cells`);
  const F = def.farDem, nf = F.nx * F.nz; let wet = 0; for (let k = 0, v = 0; k < F.lake.length; k++) { if (v) wet += F.lake[k]; v ^= 1; }
  check('data: the far view (~9 km round on a 250 m grid, heights 2 bytes a node), the plain round the hill, hardly any water in it', Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250 && wet < nf * 0.05,
    `${F.nx}x${F.nz}, lowest ${F.lo} m, ${wet} wet nodes`);
  const i0 = T.idx(T.startS), along = (b) => { let bi = 0, bd = 1e18; for (let i = 0; i < T.N; i += 2) { const q = (T.px[i] - b[0]) ** 2 + (T.pz[i] - b[1]) ** 2; if (q < bd) { bd = q; bi = i; } } return (bi - i0) * T.ds; };
  const far = (def.bld || []).filter(b => along(b) > 1500).length;
  check('data: the map\'s buildings (OpenStreetMap\'s own: Kastraki\'s at the start, the monasteries\' along the rest of the road) and the car parks', (def.bld || []).length >= 300 && far >= 20 && (def.pulls || []).length >= 3,
    `${(def.bld || []).length} buildings (${far} past the first 1.5 km), ${(def.pulls || []).length} car parks`);
}

// 4. the open road's traffic: cars, vans and buses both ways, cyclists; vehicles on their own (right) halves of the road (Greece drives on the right)
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const cars = tf.veh.filter(v => v.kind === 0), vans = tf.veh.filter(v => v.kind === 1), buses = tf.veh.filter(v => v.kind === 2), bikes = tf.veh.filter(v => v.kind === 4);
  check('traffic: cars, vans and buses both ways, cyclists, everyone on the right half', tf.veh.length > 8 && cars.length > 0 && vans.length + buses.length >= 2 && buses.length >= 1 && bikes.length >= 1 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && tf.sd === 1,
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

// 6. a whole race up to the end of the road on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
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
  check('race: all 13 cars reach the end of the road', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
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
  check('duel: both reach the end through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
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
