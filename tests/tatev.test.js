// Tatev: an open road with four ways to drive it on one card, as Mã Pí Lèng and Wadi Mujib (def.modes: the race, the time trial, the duel
// in the traffic and the run from the police). The road: the real line of the H-46 in the Vorotan gorge (Syunik, Armenia), at full scale and
// about 7.2 km: from the gorge's western rim (~1215 m) down the slope to the natural rock bridge over the river (~1013 m, the road's lowest
// point), along the river past the warm spring and up the hairpins of the eastern wall towards Tatev (~1440 m). Its data as
// tools/kratke/build.py wrote it and the short roads' world (js/world-kratke.js) reads it: the terrain's rows, the land cover's run-length
// code (7 classes), the information board, the shrine and the café by the road, the far view's grid. A whole race (12 AI + the player on
// autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the traffic on autopilot: both reach the finish
// and the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot. The places on the HUD in English
// (js/lang.js, Lang.place).
//   node tests/tatev.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'tatev'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const sOf = (p) => { const q = T.query(p[0], p[1], -1, {}); return { s: q.s - T.startS, d: q.d }; };
const altD = (d) => T.altAt(T.hy[T.idx(T.startS + d)]);

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale, 3-8 km (the group's rule); its name as the rules want it;
// no fall off the edge (the rule: only Killarney)
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 3 checkpoints, named "Kraj, Država", a real track (confirmed by the user 26. 11. 2026: not test, not pending)',
  def.open && !def.test && !def.pending && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 3 && def.name === 'Tatev, Armenija' && def.en.name === 'Tatev, Armenia',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt[0]} -> ${def.alt[1]} m, modes ${(def.modes || []).join(',')}`);
let top = -1e9, low = 1e9, sLow = 0;
for (let i = T.startIdx; i <= T.finishIdx; i++) { const a = T.altAt(T.hy[i]); if (a < low) { low = a; sLow = i * T.ds - T.startS; } top = Math.max(top, a); }
check('track: from the rim (~1215 m) down to the rock bridge (~1013 m, the lowest point, ~2.2-2.6 km in) and up to the finish towards Tatev (~1440 m), 7.0-7.3 km',
  Math.abs(def.alt[0] - 1215) < 4 && Math.abs(def.alt[1] - 1440) < 4 && Math.abs(low - 1013) < 6 && sLow > 2050 && sLow < 2600 &&
  T.raceLen > 7000 && T.raceLen < 7300 && Math.abs(def.realKm - T.raceLen / 1000) < 0.02,
  `${Math.round(T.raceLen)} m, the road ${Math.round(low)}-${Math.round(top)} m (the lowest ${Math.round(sLow)} m from the start)`);
check('track: no fall off the edge anywhere (no def.drops: only Killarney has one)', !def.drops && T.dropAt == null, `drops ${JSON.stringify(def.drops)}, dropAt ${T.dropAt}`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('tatev'));
check('track: the run-up for the grid behind the start (~200 m) and the room for the cars past the finish (~260 m), on the same road',
  T.startS > 180 && T.len - T.finishS > 230, `${Math.round(T.startS)} m before the line, ${Math.round(T.len - T.finishS)} m past the finish`);

// 2. the bends (def.curves): in order along the road, each a real bend the way its sign says (135 degrees and more within 120 m of road),
// each sign's altitude the road's own; the names on the HUD in order, each height the road's
{
  const turnAt = (c, h) => { const a = T.idx(c - h), b = T.idx(c + h); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; };
  const cv = def.curves || [], turn = cv.map(([d, , dir]) => { let best = 0; for (let c = d - 40; c <= d + 40; c += 4) for (const h of [20, 30, 40, 50, 60]) best = Math.max(best, turnAt(T.startS + c, h) * dir); return best * dir; });
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.filter((a, k) => Math.abs(a) > 2.35 && Math.sign(a) === cv[k][2]).length, own = cv.every((c) => Math.abs(c[1] - altD(c[0])) < 3);
  check('bends: 15 and more, in order, at least 12 of them hairpins of 135 degrees and more the way their signs say, each sign\'s altitude the road\'s',
    cv.length >= 15 && order && bends >= 12 && own, `${cv.length} bends, ${bends} hairpins: ${turn.map(a => Math.round(a * 57.3)).join(' ')}`);
  const num = (q) => Number(q.n.replace(/^.* · /, '').replace(/ m$/, '').replace('.', ''));
  const nm = T.names.map(q => q.n), signs = T.names.every(q => !/ · \d/.test(q.n) || Math.abs(num(q) - altD(q.d)) < 3);
  const br = T.names.find(q => q.n.startsWith('Hudičev most'));
  check('names: the HUD and the commentator know them (the ruins, the rock bridge at the lowest point, the river, the warm spring, the hairpins, the fountain), in order, each height the road\'s',
    nm.length >= 8 && T.names.every((q, k) => q.say && (!k || q.d > T.names[k - 1].d)) && T.names[T.names.length - 1].d <= T.raceLen && signs && br && Math.abs(altD(br.d) - low) < 4 && Math.abs(br.d - sLow) < 300,
    nm.join(' | '));
  let gmax = 0; for (let i = T.startIdx; i < T.finishIdx; i++) gmax = Math.max(gmax, Math.abs(T.grade[i]));
  check('grades: nowhere steeper than ~13 % (the road\'s own, smoothed over ~6 m)', gmax < 0.13, `steepest ${(gmax * 100).toFixed(1)} %`);
}

// 3. the data for the road's own world (tools/kratke/build.py): the terrain rows, the land cover cell for cell, the information board, the
// shrine and the café within 60 m of the road (the camera's band), the far view's grid
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (grass, trees and shrubs most of it)', rows && res && cells === L.nx * L.nz && maxC <= 6 && cnt[0] + cnt[1] + cnt[2] > cells / 2,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, trees ${cnt[1]}, shrubs ${cnt[2]}, built ${cnt[3]}, bare ${cnt[4]}, fields ${cnt[6]})`);
  const M = (def.marks || []).map(m => Object.assign({ k: m[2] }, sOf(m))), b = (def.boards || []).map(sOf);
  check('data: the shrine and the café, the information board, by the road (the board within 60 m, the ruins\' shrine on the slope above within 90 m) on the race\'s stretch',
    M.map(m => m.k).sort().join(',') === 'cafe,shrine' && M.concat(b).every(m => Math.abs(m.d) < 90 && m.s > 0 && m.s < T.raceLen) && b.every(m => Math.abs(m.d) < 60) && b.length === 1,
    M.concat(b).map(m => `${m.k || 'board'} ${Math.round(m.s)} m/${m.d.toFixed(1)}`).join(', '));
  const F = def.farDem, nf = F.nx * F.nz;
  check('data: the far view (~24 km round on a 300 m grid, heights 2 bytes a node; no lakes)',
    Buffer.from(F.b64, 'base64').length === 2 * nf && F.cell === 300 && F.nx * F.cell > 23000, `far ${F.nx}x${F.nz} from ${F.lo} m`);
}

// 4. the open road's traffic: cars the most, vans, buses and lorries, a few motorbikes; both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const motor = tf.veh.filter(v => v.kind !== 4), cars = motor.filter(v => v.kind === 0);
  check('traffic: cars the most of the motor traffic, both ways', motor.length >= 5 && cars.length >= motor.length / 3 && motor.some(v => v.dir > 0) && motor.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${cars.length} cars, ${motor.length - cars.length} others, ${tf.veh.length - motor.length} cyclists`);
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

// 9. the places on the HUD in English (js/lang.js, Lang.place): the hairpins and their altitudes by its rules, the others and the escape's
// goal by its dictionary
{
  const ctx = { navigator: { language: 'en' }, localStorage: { getItem() { return null; }, setItem() {} }, document: { documentElement: {}, querySelectorAll() { return []; }, addEventListener() {} } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), ctx);
  ctx.Lang.set('en');
  const en = T.names.map(q => ctx.Lang.place(q.n)), still = en.filter(e => /[čšž]|Serpentina|Reka |Zadnja/.test(e));
  check('names: the HUD\'s places in English (Devil\'s Bridge · 1,016 m, Hairpin 3 · 1,042 m, Last Hairpin · 1,379 m), none left in Slovenian, the escape\'s goal',
    en.includes('Devil\'s Bridge · 1,016 m') && en.includes('Hairpin 3 · 1,042 m') && en.includes('Last Hairpin · 1,379 m') && !still.length && ctx.Lang.place(def.escTo) === 'To Tatev', en.join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
