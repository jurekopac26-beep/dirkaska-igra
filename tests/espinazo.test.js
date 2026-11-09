// Espinazo del Diablo: an open road with four ways to drive it on one card, as Ella (def.modes: the race, the time trial, the duel in the
// traffic and the run from the police). The road: the real line of the old federal road 40 in the Sierra Madre Occidental of Mexico, at full
// scale and about 5.0 km along the narrow crest between two deep canyons: from ~2023 m past the viewpoint, the homesteads of La Tolva and the
// roadside restaurant, round the one hairpin (def.curves) to the edge of El Palmito (~1973 m). They drive on the right in Mexico: the traffic
// keeps to the right half of the road both ways. Its data as tools/espinazo/build.py wrote it and its own world (js/world-espinazo.js) reads
// it: the terrain's rows, the land cover's run-length code (8 classes: the pine-oak forest most of it, the open woodland, the grass, the
// shrubs, the yards, the bare rock, the clearings), the buildings, the cliffs, the viewpoint, the pull-outs, the power line, the restaurant,
// the far view's grid. A whole race (12 AI + the player on autopilot): every car finishes and pulls up in its own slot past the line; a whole
// duel in the traffic on autopilot: both reach the finish and the traffic keeps moving. The medal times of the time trial: the stock rally car
// on the autopilot. The places on the HUD in English (js/lang.js, Lang.place).
//   node tests/espinazo.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'espinazo'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const right = (v) => v.d * v.dir > 0.5;   // (a vehicle on its own half when they keep right)

// 1. the track: an open road, four ways to drive it, its checkpoints, the traffic on the right; at full scale, about 5.0 km, from ~2023 m
// along the crest to ~1973 m; its name as the rules want it
check('track: an open road with four ways to drive it (race, time trial, traffic, police), 4 checkpoints, the road 9 m wide, on the right, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 4.5 && !def.leftHand &&
  def.name === 'Espinazo del Diablo, Mehika' && def.en.name === 'Espinazo del Diablo, Mexico' && def.theme === 'espinazo' && !def.test && !def.pending,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt[0]} -> ${def.alt[1]} m, modes ${(def.modes || []).join(',')}`);
{
  let top = -1e9, low = 1e9, gmax = 0, gmin = 0;
  for (let i = T.startIdx; i <= T.finishIdx; i++) { const a = T.altAt(T.hy[i]); top = Math.max(top, a); low = Math.min(low, a); }
  for (let i = T.startIdx; i < T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  check('track: from the crest (~2023 m) to El Palmito (~1973 m), 4.9-5.05 km, up and down along the ridge (~1954-2031 m), at most ~10 % either way; ~255 m past the line for the slots',
    Math.abs(def.alt[0] - 2023) < 5 && Math.abs(def.alt[1] - 1973) < 5 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && low > 1945 && top < 2040 &&
    T.raceLen > 4900 && T.raceLen <= 5050 && Math.abs(def.realKm - T.raceLen / 1000) < 0.02 && gmax < 0.11 && gmin > -0.11 && T.len - T.finishS > 200,
    `${Math.round(T.raceLen)} m, the road ${Math.round(low)}-${Math.round(top)} m, steepest ${(gmax * 100).toFixed(1)} % up, ${(-gmin * 100).toFixed(1)} % down, ${Math.round(T.len - T.finishS)} m past the line`);
  check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('espinazo'));
}

// 2. the bends (def.curves): in order along the road, each a real bend of the line the way its sign says (from where it starts turning to
// where it stops, over 120 degrees), each sign's altitude the road's own; the hairpin the sharpest; the HUD and the commentator know it, the
// crest, the viewpoint, La Tolva and El Palmito
{
  const cv = def.curves || [], k = T.k, N = T.N;
  const turn = cv.map(([d]) => { const m = T.idx(T.startS + d), sg = Math.sign(k[m]) || 1; let a = m, b = m;
    while (a > 0 && Math.sign(k[a - 1]) === sg && Math.abs(k[a - 1]) > 1 / 120) a--;
    while (b < N - 1 && Math.sign(k[b + 1]) === sg && Math.abs(k[b + 1]) > 1 / 120) b++;
    let s = 0; for (let i = a; i < b; i++) s += k[i] * T.ds; return { s, r: 1 / Math.max(...Array.from(k.slice(a, b + 1), Math.abs)) }; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, q) => !q || c[0] > cv[q - 1][0] + 50), bends = turn.every((t, q) => Math.abs(t.s) > 2.09 && Math.sign(t.s) === cv[q][2]), own = cv.every((c, q) => Math.abs(c[1] - alt[q]) < 3);
  check('bends: 2 over 120 degrees, in order along the road, each the way its sign says, each sign\'s altitude the road\'s; the hairpin over 160 degrees and under 30 m round',
    cv.length === 2 && order && bends && own && Math.abs(turn[1].s) > 2.8 && turn[1].r < 30,
    cv.map((c, q) => `${c[0]} m: ${Math.round(turn[q].s * 57.3)} deg r ${turn[q].r.toFixed(1)} m at ${Math.round(alt[q])} m`).join(', '));
  const nm = T.names.map(q => q.n), at = (q) => T.altAt(T.hy[T.idx(T.startS + q.d)]), num = (q) => { const m = q.n.match(/ · (\d)\.(\d{3}) m$/); return m ? +(m[1] + m[2]) : NaN; };
  check('names: Espinazo del Diablo, the viewpoint, La Tolva, the hairpin (Lasnica, on def.curves\' second) and El Palmito, in order, each altitude the road\'s, each with the commentator\'s lines',
    nm.length === 5 && /^Espinazo del Diablo · /.test(nm[0]) && /^Razgledišče · /.test(nm[1]) && /^La Tolva · /.test(nm[2]) && /^Lasnica · /.test(nm[3]) && /^El Palmito · /.test(nm[4]) &&
    Math.abs(T.names[3].d - cv[1][0]) < 1 && T.names.every(q => Math.abs(num(q) - at(q)) < 3) &&
    T.names.every((q, j) => (!j || q.d > T.names[j - 1].d) && q.say && q.say.length >= 2) && T.names[T.names.length - 1].d <= T.raceLen,
    T.names.map(q => `${q.n} (${Math.round(at(q))} m)`).join(' | '));
}

// 3. the data for the road's own world (tools/espinazo/build.py): the terrain rows, the land cover cell for cell (the pine-oak forest most of
// it, the open woodland, the grass, the shrubs, the yards), the buildings, the cliffs, the viewpoint, the pull-outs, the power line, the
// restaurant, the far view's grid
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (the forest most, the open woodland, grass, shrubs, yards)',
    rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[1] > cells / 2 && cnt[6] > cells / 20 && cnt[0] > 300 && cnt[2] > 200 && cnt[3] > 50,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, forest ${cnt[1]}, shrubs ${cnt[2]}, built ${cnt[3]}, rock ${cnt[4]}, woodland ${cnt[6]}, clearings ${cnt[7]})`);
  const F = def.farDem, nf = F.nx * F.nz, B = def.bld || [], V = def.views || [], P = def.parks || [], near = (x, z, m) => Math.abs(T.query(x, z, -1, {}).d) < m;
  check('data: the buildings (generic: houses, sheds, the restaurant), 5 cliffs, the viewpoint by the road, 2 pull-outs, the power line, the restaurant\'s point, the far view (~10 km round on a 250 m grid)',
    B.length >= 5 && B.every(b => b.length === 7 && [0, 5, 7].includes(b[5])) && B.filter(b => b[5] === 5).length === 1 && (def.cliffs || []).length === 5 &&
    V.length === 1 && near(V[0][0], V[0][1], 40) && P.length === 2 && P.every(p => p.length === 3 && near(p[0], p[1], 40)) && (def.power || []).length >= 1 && (def.poi || []).length === 1 &&
    Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250,
    `${B.length} buildings (${B.filter(b => b[5] === 0).length} houses, ${B.filter(b => b[5] === 7).length} sheds, ${B.filter(b => b[5] === 5).length} restaurant), ${def.cliffs.length} cliffs, ${V.length} viewpoint, ${P.length} pull-outs, ${def.power.length} power line, far ${F.nx}x${F.nz} from ${F.lo} m`);
}

// 4. the traffic keeps right: every vehicle on its own half, both ways; the old road's own mix: the locals' cars and pickups, motorbikes,
// a few buses and logging lorries, the odd cyclist at the right edge
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const own = tf.veh.filter(right), kinds = [0, 1, 2, 3, 4].map(k => tf.veh.filter(v => v.kind === k).length), cyc = tf.veh.filter(v => v.kind === 4);
  check('traffic: keeps right (both ways on its own half), cyclists at the right edge; cars, vans, motorbikes and lorries',
    tf.sd === 1 && own.length === tf.veh.length && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && cyc.every(v => v.d * v.dir > T.w - 1) &&
    kinds[0] > 0 && kinds[1] > 0 && kinds[3] > 0 && tf.veh.some(v => v.p === 5) && tf.veh.length > 8,
    `${tf.veh.length} vehicles (${tf.veh.filter(v => v.dir > 0).length} one way, ${tf.veh.filter(v => v.dir < 0).length} the other), on the right ${own.length}; cars ${kinds[0]}, vans ${kinds[1]}, buses ${kinds[2]}, motorbikes ${kinds[3]}, cyclists ${kinds[4]}, lorries ${tf.veh.filter(v => v.p === 5).length}`);
}

// 5. the ways to drive it (and an online race: always the race); the run from the police starts on the right half
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  const pol = new C.Race(T, opts({ numAI: 0, playerGrid: 1, police: true, damage: 2 }));
  tt.start(); race.start(); pol.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line; online always the race',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5 && !net.timeTrial && net.cars.length === 2,
    'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  check('mode: the run from the police: the player starts on the right half of the road, the traffic and the police on it', !!pol.pol && !!pol.tf && pol.player.q.d > 1,
    `the player at ${pol.player.q.d.toFixed(2)} m across the road`);
  Math.random = orig;
}

// 6. a whole race on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
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
}

// 9. the places on the HUD in English (js/lang.js, Lang.place): the viewpoint, the hairpin and the altitudes by its rules, the place names
// as they are; the result of an escape ('Do El Palmita' -> 'To El Palmito')
{
  const ctx = { navigator: { language: 'en' }, localStorage: { getItem() { return null; }, setItem() {} }, document: { documentElement: {}, querySelectorAll() { return []; }, addEventListener() {} } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), ctx);
  ctx.Lang.set('en');
  const en = T.names.map(q => ctx.Lang.place(q.n));
  check('names: the HUD\'s places in English (Espinazo del Diablo, Viewpoint, La Tolva, Hairpin, El Palmito, with their altitudes as 2,027 m), the escape\'s "To El Palmito"',
    /^Espinazo del Diablo · 2,0\d\d m$/.test(en[0]) && /^Viewpoint · 1,9\d\d m$/.test(en[1]) && /^La Tolva · 2,0\d\d m$/.test(en[2]) && /^Hairpin · 1,9\d\d m$/.test(en[3]) &&
    /^El Palmito · 1,9\d\d m$/.test(en[4]) && ctx.Lang.place(def.escTo) === 'To El Palmito', en.join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
