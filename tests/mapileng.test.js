// Mã Pí Lèng: an open road with four ways to drive it on one card, as Dadès and Santo Antão (def.modes: the race, the time trial, the duel
// in the traffic and the run from the police); the first of the five short roads outside Europe (docs/nove-proge-1-0.md, Del 4: K1). The
// road: the real line of the national road QL4C on the karst plateau of Đồng Văn (Hà Giang, Vietnam), at full scale and just under 1 km: up
// from ~1184 m through three hairpins (def.curves) to the crest by the memorial to the road's builders (~1256 m, the road's own top) and a
// little down to the finish (~1245 m); the viewpoint over the canyon a little past the line. Its data as tools/kratke/build.py wrote it and
// the five roads' world (js/world-kratke.js) reads it: the terrain's rows, the land cover's run-length code (7 classes), the viewpoint, the
// information board, the memorial, the shrine, the museum and the café by the road, the far view's grid. The open road's traffic is its own
// mix (def.traffic: the motorbikes of the mountain roads the most). A whole race (12 AI + the player on autopilot): every car finishes and
// pulls up in its own slot past the line; a whole duel in the traffic on autopilot: both reach the finish and the traffic keeps moving. The
// medal times of the time trial: the stock rally car on the autopilot. The places on the HUD in English (js/lang.js, Lang.place).
//   node tests/mapileng.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'mapileng'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const sOf = (p) => { const q = T.query(p[0], p[1], -1, {}); return { s: q.s - T.startS, d: q.d }; };

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale and no longer than 1 km (the user's short roads); its name
// as the rules want it
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 2 checkpoints, the road 9 m wide, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 2 && T.w === 4.5 && def.name === 'Mã Pí Lèng, Vietnam' && def.en.name === 'Mã Pí Lèng, Vietnam',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt[0]} -> ${def.alt[1]} m, modes ${(def.modes || []).join(',')}`);
let top = -1e9, low = 1e9, sTop = 0;
for (let i = T.startIdx; i <= T.finishIdx; i++) { const a = T.altAt(T.hy[i]); if (a > top) { top = a; sTop = i * T.ds - T.startS; } low = Math.min(low, a); }
check('track: up from ~1184 m through the hairpins to the crest by the memorial (~1256 m, the road\'s top) and a little down to the finish (~1245 m), 0.97-1.0 km',
  Math.abs(def.alt[0] - 1184) < 5 && Math.abs(def.alt[1] - 1245) < 5 && Math.abs(top - 1256) < 4 && sTop > 780 && sTop < 940 && low > def.alt[0] - 3 &&
  T.raceLen > 970 && T.raceLen <= 1000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.02,
  `${Math.round(T.raceLen)} m, the road ${Math.round(low)}-${Math.round(top)} m (the top ${Math.round(sTop)} m from the start)`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('mapileng'));
check('track: the run-up for the grid behind the start (~220 m) and the room for the cars past the finish (~245 m), on the same road',
  T.startS > 200 && T.len - T.finishS > 230, `${Math.round(T.startS)} m before the line, ${Math.round(T.len - T.finishS)} m past the finish`);

// 2. the three hairpins: in order up the road, each a real bend of the line the way its sign says (135 degrees and more within 120 m of
// road, near its sign), each sign's altitude the road's own; the HUD knows them and the memorial
{
  const turnAt = (c, h) => { const a = T.idx(c - h), b = T.idx(c + h); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; };
  const cv = def.curves || [], turn = cv.map(([d, , dir]) => { let best = 0; for (let c = d - 40; c <= d + 40; c += 4) for (const h of [20, 30, 40, 50, 60]) best = Math.max(best, turnAt(T.startS + c, h) * dir); return best * dir; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > 2.35 && Math.sign(a) === cv[k][2]), own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('hairpins: 3, in order up the road, each a bend of 135 degrees and more the way its sign says, each sign\'s altitude the road\'s', cv.length === 3 && order && bends && own,
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}, altitudes ${alt.map(a => Math.round(a)).join(' ')}`);
  const num = (q) => +q.n.match(/(\d)\.(\d{3}) m$/).slice(1).join(''), at = (q) => T.altAt(T.hy[T.idx(T.startS + q.d)]), hp = T.names.filter(q => /^Serpentina \d+ · \d\.\d{3} m$/.test(q.n));
  const mem = T.names.find(q => q.n === 'Spomenik');
  check('hairpins: the HUD and the commentator know them (Serpentina 1 .. 3, at their altitudes) and the memorial (no altitude: the HUD\'s altitude stops at the finish\'s)',
    hp.length === 3 && hp.every((q, k) => q.say && q.n.startsWith('Serpentina ' + (k + 1) + ' ') && Math.abs(num(q) - at(q)) < 3 && Math.abs(q.d - cv[k][0]) < 1) &&
    mem && mem.say && Math.abs(mem.d - sTop) < 60, T.names.map(q => q.n).join(' | '));
  // up the hairpins: the grade through the hairpins' apexes (+-12 m) lower than on the legs between them, nowhere steeper than ~12.5 %
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  const near = (s) => cv.some(([d]) => Math.abs(s - T.startS - d) < 12), far = (s) => cv.every(([d]) => Math.abs(s - T.startS - d) > 45);
  for (let i = T.startIdx; i < T.finishIdx; i++) { const s = i * T.ds, g = Math.abs(T.grade[i]); gmax = Math.max(gmax, g); if (near(s)) { gin += g; nin++; } else if (far(s)) { gout += g; nout++; } }
  check('grades: the hairpins flatter than the legs, nowhere steeper than ~12.5 %, ~61 m up to the finish',
    gin / nin < 0.95 * gout / nout && gmax < 0.125 && Math.abs(T.hFinish - T.hStart - 61) < 3,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %, finish +${(T.hFinish - T.hStart).toFixed(1)} m`);
}

// 3. the data for the road's own world (tools/kratke/build.py): the terrain rows, the land cover cell for cell (grass most of it, the trees,
// the maize fields), the viewpoint over the canyon past the line, the information board, the memorial, the shrine and the museum by the
// crest, the café; no houses on this stretch; the far view's grid
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (grass most, trees, the maize fields)', rows && res && cells === L.nx * L.nz && maxC <= 6 && cnt[0] > cells / 2 && cnt[1] > 1000 && cnt[6] > 50,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, trees ${cnt[1]}, shrubs ${cnt[2]}, built ${cnt[3]}, bare ${cnt[4]}, fields ${cnt[6]})`);
  const v = (def.views || []).map(sOf), b = (def.boards || []).map(sOf), mem = T.names.find(q => q.n === 'Spomenik') || { d: -1e9 };
  check('data: the viewpoint over the canyon a little past the finish (by the road), the information board by the memorial',
    v.length === 1 && v[0].s > T.raceLen + 100 && v[0].s < T.len - T.startS - 30 && Math.abs(v[0].d) < 12 && b.length === 1 && Math.abs(b[0].s - mem.d) < 40 && Math.abs(b[0].d) < 60,
    `viewpoint ${v.map(p => `${Math.round(p.s)} m/${p.d.toFixed(1)}`).join(' ')}, board ${b.map(p => `${Math.round(p.s)} m/${p.d.toFixed(1)}`).join(' ')}`);
  const M = (def.marks || []).map(m => Object.assign({ k: m[2] }, sOf(m))), kinds = M.map(m => m.k).sort().join(',');
  const byMem = M.filter(m => m.k !== 'cafe').every(m => Math.abs(m.s - mem.d) < 50);
  check('data: the memorial, the shrine and the museum by the crest, the café lower down; all within 60 m of the road (the camera\'s band); no houses',
    kinds === 'cafe,monument,museum,shrine' && byMem && M.every(m => Math.abs(m.d) < 60 && m.s > 0 && m.s < T.raceLen) && (def.bld || []).length === 0,
    M.map(m => `${m.k} ${Math.round(m.s)} m/${m.d.toFixed(1)}`).join(', '));
  const F = def.farDem, nf = F.nx * F.nz;
  check('data: the far view (~24 km round on a 300 m grid, heights 2 bytes a node; no lakes: the Nho Quế is a narrow river in its canyon)',
    Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 300 && F.nx * F.cell > 23000,
    `far ${F.nx}x${F.nz} from ${F.lo} m`);
}

// 4. the open road's traffic: the motorbikes the most of the motor traffic (the mountain roads of Hà Giang), the minibuses, cars; both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const motor = tf.veh.filter(v => v.kind !== 4), mb = motor.filter(v => v.kind === 3), others = [0, 1, 2].map(k => motor.filter(v => v.kind === k).length);
  check('traffic: the motorbikes the most of the motor traffic, minibuses and cars, both ways', motor.length >= 5 && mb.length >= Math.max(...others) && mb.length >= motor.length / 3 &&
    motor.some(v => v.dir > 0) && motor.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${mb.length} motorbikes, ${others[0]} cars, ${others[1]} vans, ${others[2]} buses and lorries, ${tf.veh.length - motor.length} cyclists`);
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

// 9. the places on the HUD in English (js/lang.js, Lang.place): the hairpins and their altitudes by its rules, the memorial and the escape's
// goal by its dictionary
{
  const ctx = { navigator: { language: 'en' }, localStorage: { getItem() { return null; }, setItem() {} }, document: { documentElement: {}, querySelectorAll() { return []; }, addEventListener() {} } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), ctx);
  ctx.Lang.set('en');
  const en = T.names.map(q => ctx.Lang.place(q.n));
  check('names: the HUD\'s places in English (Hairpin 1 · 1,210 m .. Hairpin 3 · 1,243 m, Memorial), the escape\'s goal', en[0] === 'Hairpin 1 · 1,210 m' && en[2] === 'Hairpin 3 · 1,243 m' &&
    en[en.length - 1] === 'Memorial' && ctx.Lang.place(def.escTo) === 'To the Mã Pí Lèng pass', en.join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
