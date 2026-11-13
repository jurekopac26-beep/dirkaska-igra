// Dadès: an open road with four ways to drive it on one card, as Bâlea (def.modes: the race, the time trial, the duel in the traffic and the
// run from the police). The road: the real line of road R704 up the valley of the Oued Dadès in the High Atlas (Morocco), at full scale and
// about 3.2 km: from the valley floor (~1733 m) up the famous stack of four hairpins (def.curves, the game's numbering from the bottom) to the
// saddle above them (~1830 m, def.altTop: the HUD's altitude goes up to it), then down into the gorge and along the river to the finish (~1738 m).
// Its data as tools/dades/build.py wrote it and its own world (js/world-dades.js) reads it: the terrain's rows, the land cover's run-length
// code (7 classes), the river with its water level, the buildings, the viewpoints and the car parks, the far view's grid. The open road's
// traffic is its own mix (def.traffic). A whole race (12 AI + the player on autopilot): every car finishes and pulls up in its own slot past
// the line; a whole duel in the traffic on autopilot: both reach the finish and the traffic keeps moving. The medal times of the time trial:
// the stock rally car on the autopilot. The places on the HUD in English (js/lang.js, Lang.place).
//   node tests/dades.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'dades'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale, about 3.2 km; its name as the rules want it
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 9 m wide, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 4.5 && def.name === 'Dadès, Maroko' && def.en.name === 'Dadès, Morocco',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt[0]} -> ${def.altTop} -> ${def.alt[1]} m, modes ${(def.modes || []).join(',')}`);
let top = -1e9, low = 1e9;
for (let i = T.startIdx; i <= T.finishIdx; i++) { const a = T.altAt(T.hy[i]); top = Math.max(top, a); low = Math.min(low, a); }
check('track: from the valley floor (~1733 m) up to the saddle (~1830 m, def.altTop: the road\'s own top) and down to the river (~1738 m), 3.1-3.3 km',
  Math.abs(def.alt[0] - 1733) < 10 && Math.abs(def.alt[1] - 1738) < 10 && Math.abs(def.altTop - 1830) < 10 && Math.abs(top - def.altTop) < 3 && low > def.alt[0] - 8 &&
  T.raceLen > 3100 && T.raceLen <= 3300 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.02,
  `${Math.round(T.raceLen)} m, the road ${Math.round(low)}-${Math.round(top)} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('dades'));

// 2. the four hairpins: in order up the road, each a real bend of the line the way its sign says (150 degrees and more over 120 m round it),
// each sign's altitude the road's own; the HUD knows them, the top of the hairpins, the gorge and the river at the finish
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 60), b = T.idx(T.startS + d + 60); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > 2.55 && Math.sign(a) === cv[k][2]), own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('hairpins: 4, in order up the road, each a bend of 150 degrees and more the way its sign says, each sign\'s altitude the road\'s', cv.length === 4 && order && bends && own,
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}, altitudes ${alt.map(a => Math.round(a)).join(' ')}`);
  const nm = (re) => T.names.find(q => re.test(q.n)), tp = nm(/^Vrh serpentin · \d\.\d{3} m$/), riv = T.names[T.names.length - 1];
  const at = (q) => T.altAt(T.hy[T.idx(T.startS + q.d)]), num = (q) => +q.n.match(/(\d)\.(\d{3}) m$/).slice(1).join('');
  check('hairpins: the HUD and the commentator know them (Serpentina 1 .. 4), the top of the hairpins at its altitude, the gorge and the river at the finish',
    T.names.filter(q => /^Serpentina \d+ · \d\.\d{3} m$/.test(q.n) && q.say).length === 4 && tp && Math.abs(num(tp) - at(tp)) < 3 && T.names.some(q => q.n === 'Soteska Dadès' && q.say) &&
    /^Reka Dadès · 1\.7\d\d m$/.test(riv.n) && Math.abs(num(riv) - at(riv)) < 3, T.names.map(q => q.n).join(' | '));
  // up the hairpins and down into the gorge: the grade through the hairpins' apexes (+-12 m) lower than on the legs between them; nowhere
  // steeper than ~12 %
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  const near = (s) => cv.some(([d]) => Math.abs(s - T.startS - d) < 12), far = (s) => cv.every(([d]) => Math.abs(s - T.startS - d) > 45) && s - T.startS > 300 && s - T.startS < 1050;
  for (let i = T.startIdx; i < T.finishIdx; i++) { const s = i * T.ds, g = T.grade[i]; gmax = Math.max(gmax, Math.abs(g)); if (near(s)) { gin += g; nin++; } else if (far(s)) { gout += g; nout++; } }
  const hTop = Math.max(...Array.from(T.hy.slice(T.startIdx, T.finishIdx)));
  check('grades: the hairpins flatter than the legs, nowhere steeper than ~12 %, ~95 m up to the saddle and down again to the river', gin / nin < 0.9 * gout / nout && gmax < 0.122 && hTop > T.hStart + 85 && Math.abs(T.hFinish - T.hStart) < 10,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %, up ${Math.round(hTop - T.hStart)} m, finish ${(T.hFinish - T.hStart).toFixed(1)} m`);
}

// 3. the data for the road's own world (tools/dades/build.py): the terrain rows, the land cover cell for cell (stony steppe most of it, bare
// rock, the river's trees), the river with its level below the road, the buildings, the viewpoints, the car parks, the far view's grid
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (stony steppe most, bare rock, the river\'s trees)', rows && res && cells === L.nx * L.nz && maxC <= 6 && cnt[0] > cells / 2 && cnt[4] > 500 && cnt[1] > 100,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: steppe ${cnt[0]}, trees ${cnt[1]}, shrubs ${cnt[2]}, built ${cnt[3]}, bare ${cnt[4]})`);
  const R = (def.river || [])[0] || [], nr = R.length / 3;
  let below = true, close = 1e9; for (let k = 0; k < nr; k++) { const q = T.query(R[3 * k], R[3 * k + 1], -1, {}); close = Math.min(close, q.d < 0 ? -q.d : q.d); if (R[3 * k + 2] / 10 > T.hy[q.i] - 0.5) below = false; }
  let down = true; for (let k = 1; k < nr; k++) if (R[3 * k + 2] > R[3 * k - 1]) down = false;
  check('data: the river (OpenStreetMap\'s Oued Dadès), its water below the road and never flowing uphill, beside the road in the valley', nr > 200 && below && down && close < 40,
    `${nr} points, ${(R[2] / 10).toFixed(1)} -> ${(R[R.length - 1] / 10).toFixed(1)} m from the start line's height, nearest ${close.toFixed(0)} m from the road's centre line`);
  const F = def.farDem, nf = F.nx * F.nz;
  check('data: the buildings (generic), 10 viewpoints, the car parks, the far view (~9 km round on a 250 m grid, heights 2 bytes a node)',
    (def.bld || []).length >= 2 && (def.views || []).length === 10 && (def.parks || []).length >= 2 && Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250,
    `${def.bld.length} buildings, ${def.views.length} viewpoints, ${def.parks.length} car parks, far ${F.nx}x${F.nz} from ${F.lo} m`);
}

// 4. the open road's traffic: cars most, vans and minibuses, motorbikes, a few lorries; vehicles on their own halves of the road both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0);
  check('traffic: cars most, vans, minibuses, motorbikes and a few lorries both ways', tf.veh.length > 8 && cars.length > tf.veh.length / 3 && cars.length > trucks.length * 3 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
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

// 9. the places on the HUD in English (js/lang.js, Lang.place): the hairpins and their altitudes by its rules, the gorge and the river by its dictionary
{
  const ctx = { navigator: { language: 'en' }, localStorage: { getItem() { return null; }, setItem() {} }, document: { documentElement: {}, querySelectorAll() { return []; }, addEventListener() {} } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), ctx);
  ctx.Lang.set('en');
  const en = T.names.map(q => ctx.Lang.place(q.n));
  check('names: the HUD\'s places in English (Hairpin 1 · 1,752 m, Top of the Switchbacks, Dadès Gorge, Dadès River)', en[0] === 'Hairpin 1 · 1,752 m' && /^Top of the Switchbacks · 1,8\d\d m$/.test(en[4]) &&
    en[5] === 'Dadès Gorge' && /^Dadès River · 1,7\d\d m$/.test(en[6]) && ctx.Lang.place(def.escTo) === 'To the gorge', en.join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
