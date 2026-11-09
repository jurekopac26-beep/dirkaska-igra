// Banaue: an open road with four ways to drive it on one card, as Mã Pí Lèng, Wadi Mujib and Sans Souci (def.modes: the race, the time trial,
// the duel in the traffic and the run from the police); the fourth of the five short roads outside Europe (docs/nove-proge-1-0.md, Del 4: K4).
// The road: the real line of the road from Bontoc down to Banaue (Ifugao, the Philippines) above the rice terraces, at full scale and just under
// 1 km: from ~1.247 m past the viewpoints and through the village above the terraces, down to the hairpin (def.curves) and the finish (~1.185 m,
// the road's low point). The traffic keeps right. Its data as tools/kratke/build.py wrote it and the five roads' world (js/world-kratke.js)
// reads it: the terrain's rows, the land cover's run-length code (the woods, the rice fields: the terraces, the village's built-up cells), the
// map's houses and shops, the viewpoints (each with its stall), the far view's grid with the high ranges of the Cordillera. The open road's
// traffic is its own mix (def.traffic: cars, the vans and the jeepneys, the tricycles' motorbikes). A whole race (12 AI + the player on
// autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the traffic on autopilot: both reach the finish and
// the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot. The places on the HUD in English
// (js/lang.js, Lang.place).
//   node tests/banaue.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'banaue'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale and no longer than 1 km (the user's short roads); its name
// as the rules want it; the traffic on the right
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 2 checkpoints, the road 9 m wide, the traffic on the right, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 2 && T.w === 4.5 && !def.leftHand && def.name === 'Banaue, Filipini' && def.en.name === 'Banaue, Philippines',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt[0]} -> ${def.alt[1]} m, modes ${(def.modes || []).join(',')}`);
let top = -1e9, low = 1e9;
for (let i = T.startIdx; i <= T.finishIdx; i++) { const a = T.altAt(T.hy[i]); top = Math.max(top, a); low = Math.min(low, a); }
check('track: from ~1.247 m (the top, at the start) down past the village and round the hairpin to the finish (~1.185 m, the low point), 0.97-1.0 km',
  Math.abs(def.alt[0] - 1247) < 5 && Math.abs(def.alt[1] - 1185) < 5 && Math.abs(top - def.alt[0]) < 1.5 && Math.abs(low - def.alt[1]) < 1.5 &&
  T.raceLen > 970 && T.raceLen <= 1000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.02,
  `${Math.round(T.raceLen)} m, the road ${Math.round(low)}-${Math.round(top)} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('banaue'));
check('track: the run-up for the grid behind the start (~200 m) and the room for the cars past the finish (~250 m), on the same road',
  T.startS > 190 && T.len - T.finishS > 230, `${Math.round(T.startS)} m before the line, ${Math.round(T.len - T.finishS)} m past the finish`);

// 2. the hairpin above the town: a real bend of the line the way its sign says (135 degrees and more within 120 m of road, near its sign), its
// sign's altitude the road's own; the HUD and the commentator know it, after the viewpoint, the village and the terraces
{
  const turnAt = (c, h) => { const a = T.idx(c - h), b = T.idx(c + h); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; };
  const cv = def.curves || [], turn = cv.map(([d, , dir]) => { let best = 0; for (let c = d - 40; c <= d + 40; c += 4) for (const h of [20, 30, 40, 50, 60]) best = Math.max(best, turnAt(T.startS + c, h) * dir); return best * dir; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  check('hairpin: 1, a bend of 135 degrees and more the way its sign says, its sign\'s altitude the road\'s', cv.length === 1 && Math.abs(turn[0]) > 2.35 && Math.sign(turn[0]) === cv[0][2] && Math.abs(cv[0][1] - alt[0]) < 3,
    `turn ${turn.map(a => Math.round(a * 57.3)).join(' ')}, altitude ${alt.map(a => Math.round(a)).join(' ')}`);
  const num = (q) => +q.n.match(/(\d)\.(\d{3}) m$/).slice(1).join(''), at = (q) => T.altAt(T.hy[T.idx(T.startS + q.d)]), hp = T.names.filter(q => /^Serpentina · \d\.\d{3} m$/.test(q.n));
  check('places: the HUD and the commentator know the viewpoint, the village above the terraces, the terraces and the hairpin (Serpentina · 1.196 m, at its altitude), in order',
    hp.length === 1 && T.names.length === 4 && T.names.every(q => q.say && q.say.length) && Math.abs(num(hp[0]) - at(hp[0])) < 3 && Math.abs(hp[0].d - cv[0][0]) < 1 &&
    T.names[0].n === 'Razgledišče' && T.names[1].n === 'Vas nad terasami' && T.names[2].n === 'Riževe terase' && T.names[3] === hp[0] && T.names.every((q, k) => !k || q.d > T.names[k - 1].d),
    T.names.map(q => `${q.n}@${q.d}`).join(' | '));
  // the grades: down all the way at 12 % at the most, ~62 m down from the start to the finish
  let gmax = 0; for (let i = T.startIdx; i < T.finishIdx; i++) gmax = Math.max(gmax, Math.abs(T.grade[i]));
  check('grades: nowhere steeper than ~13 %, ~62 m down from the start to the finish', gmax < 0.13 && gmax > 0.08 && Math.abs(T.hFinish - T.hStart + 62) < 3,
    `steepest ${(gmax * 100).toFixed(1)} %, finish ${(T.hFinish - T.hStart).toFixed(1)} m`);
}

// 3. the data for the road's own world (tools/kratke/build.py): the terrain rows, the land cover cell for cell (the woods, the rice fields of the
// terraces, the village's built-up cells, no bare rock); the map's houses and shops, the viewpoints by the road (their stalls); no bus stops, no
// bridge, no side lanes; the far view's grid with the high ranges round the valley (no sea, no lake)
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (the woods and the rice fields the most, the village built up, no bare rock)', rows && res && cells === L.nx * L.nz && maxC <= 6 &&
    cnt[1] > cells / 3 && cnt[6] > cells / 5 && cnt[3] > 50 && cnt[4] === 0,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, trees ${cnt[1]}, shrubs ${cnt[2]}, built ${cnt[3]}, bare ${cnt[4]}, water ${cnt[5]}, fields ${cnt[6]})`);
  const kinds = (def.bld || []).reduce((o, b) => { const k = b[b.length - 1]; o[k] = (o[k] || 0) + 1; return o; }, {}), views = def.views || [];
  const sOf = (x, z) => T.query(x, z, -1, {}).s - T.startS;
  check('data: the map\'s houses (~170) and a few shops, the 4 viewpoints by the road (the last past the finish), no bus stops, no bridge, no side lanes',
    (def.bld || []).length > 120 && kinds[0] > 120 && kinds[2] > 0 && views.length === 4 && views.every(([x, z]) => { const s = sOf(x, z); return s > -60 && s < T.len - T.startS - 20; }) && views.filter(([x, z]) => sOf(x, z) < T.raceLen).length === 3 &&
    !(def.stops || []).length && !(def.bridges || []).length && !(def.lanes || []).length,
    `${(def.bld || []).length} buildings (${JSON.stringify(kinds)}), viewpoints at ${views.map(([x, z]) => Math.round(sOf(x, z))).join(' ')} m`);
  const F = def.farDem, nf = F.nx * F.nz, b = Buffer.from(F.b64, 'base64'), wet = new Uint8Array(nf);
  for (let k = 0, p = 0, v = 0; k < F.lake.length; k++) { if (v) wet.fill(1, p, p + F.lake[k]); p += F.lake[k]; v ^= 1; }
  let nw = 0, hmax = 0; for (let k = 0; k < nf; k++) { hmax = Math.max(hmax, F.lo + b.readUInt16BE(2 * k) / 2); if (wet[k]) nw++; }
  check('data: the far view (~24 km round on a 300 m grid): the valleys from ~470 m, the ranges of the Cordillera over 2.500 m, no sea and no lake',
    b.length === 2 * nf && F.lake.reduce((a, c) => a + c, 0) === nf && F.cell === 300 && F.nx * F.cell > 23000 && !nw && F.lo > 300 && hmax > 2500,
    `far ${F.nx}x${F.nz} from ${F.lo} m, up to ${Math.round(hmax)} m, ${nw} wet nodes`);
}

// 4. the open road's traffic: cars, the vans and the jeepneys the most of the motor traffic (def.traffic.mix: [car, van, bus, motorbike, truck]),
// the tricycles' motorbikes, both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const motor = tf.veh.filter(v => v.kind !== 4), by = [0, 1, 2, 3].map(k => motor.filter(v => v.kind === k).length);
  check('traffic: cars, vans and jeepneys the most of the motor traffic, motorbikes too, both ways', motor.length >= 5 && by[0] + by[1] >= by[2] + by[3] && by[3] > 0 &&
    motor.some(v => v.dir > 0) && motor.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${by[0]} cars, ${by[1]} vans, ${by[2]} buses and lorries, ${by[3]} motorbikes, ${tf.veh.length - motor.length} cyclists`);
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

// 9. the places on the HUD in English (js/lang.js, Lang.place): the viewpoint, the village, the terraces and the escape's goal by its
// dictionary, the hairpin and its altitude by its rules
{
  const ctx = { navigator: { language: 'en' }, localStorage: { getItem() { return null; }, setItem() {} }, document: { documentElement: {}, querySelectorAll() { return []; }, addEventListener() {} } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), ctx);
  ctx.Lang.set('en');
  const en = T.names.map(q => ctx.Lang.place(q.n));
  check('names: the HUD\'s places in English (Viewpoint, Village above the Terraces, Rice Terraces, Hairpin · 1,196 m), the escape\'s goal',
    en[0] === 'Viewpoint' && en[1] === 'Village above the Terraces' && en[2] === 'Rice Terraces' && en[3] === 'Hairpin · 1,196 m' && ctx.Lang.place(def.escTo) === 'To Banaue', en.join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
