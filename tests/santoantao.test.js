// Santo Antão: an open road with four ways to drive it on one card, as Dadès (def.modes: the race, the time trial, the duel in the traffic and
// the run from the police). The road: the real line of the cobbled road EN1-SA-01 on the island of Santo Antão (Cape Verde), at full scale and
// about 5 km: along the narrow ridge of Delgadim (~672 m at the start), over its saddle (~652 m) and its top (~710 m, def.altTop: the HUD's
// altitude goes up to it) and down six hairpins (def.curves) towards Ribeira Grande (~336 m at the finish). The whole road is cobbled
// (def.setts: the setts' surface, less grip). Its data as tools/santoantao/build.py wrote it and its own world (js/world-santoantao.js) reads
// it: the terrain's rows, the land cover's run-length code (7 classes), the viewpoints, the houses, the far view's grid with the sea. The open
// road's traffic is its own mix (def.traffic). A whole race (12 AI + the player on autopilot): every car finishes and pulls up in its own slot
// past the line; a whole duel in the traffic on autopilot: both reach the finish and the traffic keeps moving. The medal times of the time
// trial: the stock rally car on the autopilot. The places on the HUD in English (js/lang.js, Lang.place).
//   node tests/santoantao.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'santoantao'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale, about 5 km, cobbled all the way; its name as the rules want it
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 9 m wide, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 4.5 && def.name === 'Santo Antão, Zelenortski otoki' && def.en.name === 'Santo Antão, Cape Verde',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt[0]} -> ${def.altTop} -> ${def.alt[1]} m, modes ${(def.modes || []).join(',')}`);
let top = -1e9, low = 1e9;
for (let i = T.startIdx; i <= T.finishIdx; i++) { const a = T.altAt(T.hy[i]); top = Math.max(top, a); low = Math.min(low, a); }
check('track: from the ridge (~672 m) over the saddle and the top (~710 m, def.altTop: the road\'s own top) down to above Ribeira Grande (~336 m), 4.9-5.05 km',
  Math.abs(def.alt[0] - 672) < 10 && Math.abs(def.alt[1] - 336) < 10 && Math.abs(def.altTop - 710) < 10 && Math.abs(top - def.altTop) < 3 && low > def.alt[1] - 3 &&
  T.raceLen > 4900 && T.raceLen <= 5050 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.02,
  `${Math.round(T.raceLen)} m, the road ${Math.round(low)}-${Math.round(top)} m`);
{
  let on = 0, all = 0; for (let i = T.startIdx; i <= T.finishIdx; i++) { all++; if (T.settAt && T.settAt[i]) on++; }
  let run = 0; for (let i = 0; i < T.N; i++) if (T.settAt && T.settAt[i]) run++;
  check('track: the cobbles (def.setts) all the way, from the grid behind the start line to the cars\' slots past the finish', on === all && run > T.N - 4, `${on}/${all} samples of the race, ${run}/${T.N} of the road`);
}
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('santoantao'));

// 2. the six hairpins: in order down the road, each a real bend of the line the way its sign says (135 degrees and more within 120 m of road,
// near its sign: the fourth is the last of a zigzag of tight bends, so a window centred on the sign would add the bend before it, the other
// way), each sign's altitude the road's own; the HUD knows them, the saddle of Delgadim, the top of the ridge and Ribeira Grande at the finish
{
  const turnAt = (c, h) => { const a = T.idx(c - h), b = T.idx(c + h); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; };
  const cv = def.curves || [], turn = cv.map(([d, , dir]) => { let best = 0; for (let c = d - 40; c <= d + 40; c += 4) for (const h of [20, 30, 40, 50, 60]) best = Math.max(best, turnAt(T.startS + c, h) * dir); return best * dir; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > 2.35 && Math.sign(a) === cv[k][2]), own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('hairpins: 6, in order down the road, each a bend of 135 degrees and more the way its sign says, each sign\'s altitude the road\'s', cv.length === 6 && order && bends && own,
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}, altitudes ${alt.map(a => Math.round(a)).join(' ')}`);
  const nm = (re) => T.names.find(q => re.test(q.n)), num = (q) => +q.n.match(/(\d+) m$/)[1], at = (q) => T.altAt(T.hy[T.idx(T.startS + q.d)]);
  const sad = nm(/^Delgadim · \d{3} m$/), tp = nm(/^Vrh grebena · \d{3} m$/), fin = T.names[T.names.length - 1];
  check('hairpins: the HUD and the commentator know them (Serpentina 1 .. 6), the saddle of Delgadim and the top of the ridge at their altitudes, Ribeira Grande at the finish',
    T.names.filter(q => /^Serpentina \d+ · \d{3} m$/.test(q.n) && q.say).length === 6 && sad && sad.say && tp && tp.say && Math.abs(num(sad) - at(sad)) < 3 && Math.abs(num(tp) - at(tp)) < 3 &&
    /^Ribeira Grande · 3\d\d m$/.test(fin.n) && Math.abs(num(fin) - at(fin)) < 3 && fin.say, T.names.map(q => q.n).join(' | '));
  // down the hairpins: the grade through the hairpins' apexes (+-12 m) lower than on the legs between them; nowhere steeper than ~12 %; the
  // saddle below the start and the top above it, then ~336 m down to the finish
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  const near = (s) => cv.some(([d]) => Math.abs(s - T.startS - d) < 12), far = (s) => cv.every(([d]) => Math.abs(s - T.startS - d) > 45) && s - T.startS > 900;
  for (let i = T.startIdx; i < T.finishIdx; i++) { const s = i * T.ds, g = Math.abs(T.grade[i]); gmax = Math.max(gmax, g); if (near(s)) { gin += g; nin++; } else if (far(s)) { gout += g; nout++; } }
  const hTop = Math.max(...Array.from(T.hy.slice(T.startIdx, T.finishIdx))), hSad = Math.min(...Array.from(T.hy.slice(T.startIdx, T.idx(T.startS + def.top))));
  check('grades: the hairpins flatter than the legs, nowhere steeper than ~12 %, the saddle below the start, the top ~38 m above it, ~336 m down to the finish',
    gin / nin < 0.9 * gout / nout && gmax < 0.122 && hSad < T.hStart - 12 && hTop > T.hStart + 30 && Math.abs(T.hFinish - T.hStart + 336) < 3,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %, saddle ${(hSad - T.hStart).toFixed(1)} m, top +${Math.round(hTop - T.hStart)} m, finish ${(T.hFinish - T.hStart).toFixed(1)} m`);
}

// 3. the data for the road's own world (tools/santoantao/build.py): the terrain rows, the land cover cell for cell (grass most of it, the
// shrubs, the trees, the terraced fields), the two viewpoints on the saddle, the information board there, the houses, the far view's grid
// with the sea round the island
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (grass most, shrubs, trees, the terraced fields)', rows && res && cells === L.nx * L.nz && maxC <= 6 && cnt[0] > cells / 2 && cnt[2] > 2000 && cnt[1] > 500 && cnt[6] > 1000,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, trees ${cnt[1]}, shrubs ${cnt[2]}, built ${cnt[3]}, bare ${cnt[4]}, fields ${cnt[6]})`);
  const onSaddle = (p) => { const q = T.query(p[0], p[1], -1, {}); return Math.abs(q.d) < 8 && Math.abs(q.s - T.startS - (T.names[0] || {}).d) < 40; };
  check('data: the two viewpoints and the information board on the saddle of Delgadim (by the road there), the houses (generic)', (def.views || []).length === 2 && def.views.every(onSaddle) && (def.boards || []).length === 1 && onSaddle(def.boards[0]) && (def.bld || []).length >= 40,
    `${def.views.length} viewpoints, ${def.boards.length} board, ${def.bld.length} houses`);
  const F = def.farDem, nf = F.nx * F.nz, wet = F.lake.reduce((a, b, k) => a + (k % 2 ? b : 0), 0);
  check('data: the far view (~24 km round on a 300 m grid, heights 2 bytes a node), the sea round the island (a third of it and more; def.far.lake: at 0 m)',
    Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 300 && wet > nf / 3 && def.far && def.far.lake && def.far.lake[2] === 0,
    `far ${F.nx}x${F.nz} from ${F.lo} m, sea ${Math.round(wet / nf * 100)} %`);
}

// 4. the open road's traffic: cars most, vans and minibuses, motorbikes, a few lorries; vehicles on their own halves of the road both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0);
  const vans = tf.veh.filter(v => v.kind === 1), buses = tf.veh.filter(v => v.p === 2);
  check('traffic: cars and vans the most, the island\'s minibuses, motorbikes and a few lorries both ways', tf.veh.length > 8 && cars.length + vans.length > tf.veh.length / 2 && buses.length >= 2 && cars.length > trucks.length * 2 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${cars.length} cars, ${vans.length} vans, ${buses.length} minibuses, ${bikes.length} motorbikes, ${trucks.length} trucks, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
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

// 6. a whole race on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 900 && r.cars.some(c => !c.finished)) {
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
  while (t < 900 && r.cars.some(c => !c.finished)) {
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
  let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

// 9. the places on the HUD in English (js/lang.js, Lang.place): the hairpins and their altitudes by its rules, the top of the ridge by its
// dictionary, Delgadim and Ribeira Grande as they are
{
  const ctx = { navigator: { language: 'en' }, localStorage: { getItem() { return null; }, setItem() {} }, document: { documentElement: {}, querySelectorAll() { return []; }, addEventListener() {} } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), ctx);
  ctx.Lang.set('en');
  const en = T.names.map(q => ctx.Lang.place(q.n));
  check('names: the HUD\'s places in English (Delgadim · 652 m, Top of the Ridge · 710 m, Hairpin 1 · 680 m, Ribeira Grande · 343 m)', en[0] === 'Delgadim · 652 m' && en[1] === 'Top of the Ridge · 710 m' &&
    en[2] === 'Hairpin 1 · 680 m' && en[en.length - 1] === 'Ribeira Grande · 343 m' && ctx.Lang.place(def.escTo) === 'To Ribeira Grande', en.join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
