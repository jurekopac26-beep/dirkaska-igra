// Atitlán: an open road with four ways to drive it on one card, as Mã Pí Lèng, Wadi Mujib, Sans Souci and Banaue (def.modes: the race, the time
// trial, the duel in the traffic and the run from the police); the last of the five short roads outside Europe (docs/nove-proge-1-0.md, Del 4: K5).
// The road: the real line of the RN-1 from Sololá down towards Lake Atitlán (the highlands of Guatemala), at full scale and just under 1 km: from
// ~2.068 m at the edge of the town past the hospital, round the two hairpins (def.curves), past the town's houses and under the power line, down
// through the pine woods to the finish (~1.989 m, the road's low point). The traffic keeps right. Its data as tools/kratke/build.py wrote it and
// the five roads' world (js/world-kratke.js) reads it: the terrain's rows, the land cover's run-length code (the woods, the town's built-up cells),
// the map's houses and the hospital's pavilions, the two pitches, the restaurant by the road, the power line's towers, the far view's grid with
// the lake (its own level) and the three volcanoes (San Pedro, Tolimán, Atitlán). The open road's traffic is its own mix (def.traffic: cars,
// pick-ups and vans, the buses, the motorbikes). A whole race (12 AI + the player on autopilot): every car finishes and pulls up in its own
// slot past the line; a whole duel in the traffic on autopilot: both reach the finish and the traffic keeps moving. The medal times of the time
// trial: the stock rally car on the autopilot. The places on the HUD in English (js/lang.js, Lang.place).
//   node tests/atitlan.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'atitlan'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints; at full scale and no longer than 1 km (the user's short roads); its name
// as the rules want it; the traffic on the right
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 2 checkpoints, the road 9 m wide, the traffic on the right, named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 2 && T.w === 4.5 && !def.leftHand && def.name === 'Atitlán, Gvatemala' && def.en.name === 'Atitlán, Guatemala',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt[0]} -> ${def.alt[1]} m, modes ${(def.modes || []).join(',')}`);
let top = -1e9, low = 1e9;
for (let i = T.startIdx; i <= T.finishIdx; i++) { const a = T.altAt(T.hy[i]); top = Math.max(top, a); low = Math.min(low, a); }
check('track: from ~2.068 m (the top, at the start) down round the hairpins and through the woods to the finish (~1.989 m, the low point), 0.97-1.0 km',
  Math.abs(def.alt[0] - 2068) < 5 && Math.abs(def.alt[1] - 1989) < 5 && Math.abs(top - def.alt[0]) < 1.5 && Math.abs(low - def.alt[1]) < 1.5 &&
  T.raceLen > 970 && T.raceLen <= 1000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.02,
  `${Math.round(T.raceLen)} m, the road ${Math.round(low)}-${Math.round(top)} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('atitlan'));
check('track: the run-up for the grid behind the start (~210 m) and the room for the cars past the finish (~250 m), on the same road',
  T.startS > 190 && T.len - T.finishS > 230, `${Math.round(T.startS)} m before the line, ${Math.round(T.len - T.finishS)} m past the finish`);

// 2. the two hairpins below the hospital: real bends of the line the way their signs say (150 degrees and more within 120 m of road, near
// their signs, the first to the right, the second to the left), their signs' altitudes the road's own; the HUD and the commentator know them,
// after the hospital, and the town, the power line, the woods and the view of the lake after them
{
  const turnAt = (c, h) => { const a = T.idx(c - h), b = T.idx(c + h); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; };
  const cv = def.curves || [], turn = cv.map(([d, , dir]) => { let best = 0; for (let c = d - 40; c <= d + 40; c += 4) for (const h of [20, 30, 40, 50, 60]) best = Math.max(best, turnAt(T.startS + c, h) * dir); return best * dir; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  check('hairpins: 2, bends of 150 degrees and more the way their signs say (right, then left), their signs\' altitudes the road\'s',
    cv.length === 2 && cv[0][2] === 1 && cv[1][2] === -1 && turn.every((a, k) => Math.abs(a) > 2.6 && Math.sign(a) === cv[k][2] && Math.abs(cv[k][1] - alt[k]) < 3),
    `turn ${turn.map(a => Math.round(a * 57.3)).join(' ')}, altitude ${alt.map(a => Math.round(a)).join(' ')}`);
  const num = (q) => +q.n.match(/(\d)\.(\d{3}) m$/).slice(1).join(''), at = (q) => T.altAt(T.hy[T.idx(T.startS + q.d)]), hp = T.names.filter(q => /^Serpentina \d · \d\.\d{3} m$/.test(q.n));
  const order = ['Bolnišnica', hp[0] && hp[0].n, hp[1] && hp[1].n, 'Sololá', 'Pod daljnovodom', 'Borov gozd', 'Pogled na jezero'];
  check('places: the HUD and the commentator know the hospital, the hairpins (Serpentina 1 · 2.060 m, Serpentina 2 · 2.054 m, at their altitudes), the town, the power line, the woods and the view of the lake, in order',
    hp.length === 2 && hp.every((q, k) => q.n.startsWith('Serpentina ' + (k + 1) + ' ') && Math.abs(num(q) - at(q)) < 3 && Math.abs(q.d - cv[k][0]) < 1) &&
    T.names.length === 7 && T.names.every((q, k) => q.n === order[k] && q.say && q.say.length && (!k || q.d > T.names[k - 1].d)) && T.names[6].d < T.raceLen,
    T.names.map(q => `${q.n}@${q.d}`).join(' | '));
  // the grades: down all the way, 12 % at the most, ~79 m down from the start to the finish
  let gmax = 0; for (let i = T.startIdx; i < T.finishIdx; i++) gmax = Math.max(gmax, Math.abs(T.grade[i]));
  check('grades: nowhere steeper than ~13 %, ~79 m down from the start to the finish', gmax < 0.13 && gmax > 0.08 && Math.abs(T.hFinish - T.hStart + 79) < 3,
    `steepest ${(gmax * 100).toFixed(1)} %, finish ${(T.hFinish - T.hStart).toFixed(1)} m`);
}

// 3. the data for the road's own world (tools/kratke/build.py): the terrain rows, the land cover cell for cell (the woods the most, the town's
// built-up cells, no bare rock, no water near the road); the map's houses and the hospital's long pavilions, the pitches (the football pitch,
// the basketball court), the restaurant by the road, the power line on its towers across the road, the town's lanes; no bus stops, no
// bridge, no viewpoints; the far view's grid with the lake (its nodes flat at its level) and the three volcanoes on the horizon
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (the woods the most, the town built up, no bare rock, no water)', rows && res && cells === L.nx * L.nz && maxC <= 6 &&
    cnt[1] > cells / 3 && cnt[3] > cells / 5 && cnt[4] === 0 && cnt[5] === 0,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, trees ${cnt[1]}, shrubs ${cnt[2]}, built ${cnt[3]}, bare ${cnt[4]}, water ${cnt[5]}, fields ${cnt[6]})`);
  const kinds = (def.bld || []).reduce((o, b) => { const k = b[b.length - 1]; o[k] = (o[k] || 0) + 1; return o; }, {});
  const sOf = (x, z) => T.query(x, z, -1, {}).s - T.startS, pw = (def.power || [])[0] || [], tw = [];
  for (let k = 1; k + 1 < pw.length; k += 2) tw.push([pw[k], pw[k + 1]]);
  const roadD = (x, z) => { const q = T.query(x, z, -1, {}); return Math.abs(q.d); };
  check('data: the map\'s houses and the hospital\'s pavilions, a football pitch and a basketball court, the restaurant by the road (~110 m), the power line (8 towers, one by the road), the town\'s lanes; no bus stops, no bridge, no viewpoints',
    (def.bld || []).length > 40 && kinds[0] > 25 && kinds[2] >= 10 && (def.pitches || []).map(p => p[0]).sort().join(',') === '1,2' &&
    (def.eat || []).length === 1 && Math.abs(sOf(...def.eat[0]) - 108) < 20 && (def.power || []).length === 1 && tw.length === 8 && tw.some(([x, z]) => roadD(x, z) < 60) &&
    (def.lanes || []).length > 0 && !(def.stops || []).length && !(def.bridges || []).length && !(def.views || []).length,
    `${(def.bld || []).length} buildings (${JSON.stringify(kinds)}), pitches ${(def.pitches || []).map(p => p[0]).join(',')}, restaurant at ${(def.eat || []).map(([x, z]) => Math.round(sOf(x, z))).join(' ')} m, ` +
    `${tw.length} towers (nearest ${Math.round(Math.min(...tw.map(([x, z]) => roadD(x, z))))} m from the road), ${(def.lanes || []).length} lanes`);
  const F = def.farDem, nf = F.nx * F.nz, b = Buffer.from(F.b64, 'base64'), wet = new Uint8Array(nf);
  for (let k = 0, p = 0, v = 0; k < F.lake.length; k++) { if (v) wet.fill(1, p, p + F.lake[k]); p += F.lake[k]; v ^= 1; }
  const hNear = (x, z) => { let m = 0; for (let j = 0; j < F.nz; j++) for (let i = 0; i < F.nx; i++) if (Math.hypot(F.x0 + i * F.cell - x, F.z0 + j * F.cell - z) < 1200) m = Math.max(m, F.lo + b.readUInt16BE(2 * (j * F.nx + i)) / 2); return m; };
  let nw = 0, hmax = 0; for (let k = 0; k < nf; k++) { hmax = Math.max(hmax, F.lo + b.readUInt16BE(2 * k) / 2); if (wet[k]) nw++; }
  const lk = def.far && def.far.lake, li = lk ? Math.round((lk[0] - F.x0) / F.cell) : -1, lj = lk ? Math.round((lk[1] - F.z0) / F.cell) : -1;
  const volc = [[-9732, 11852], [-1332, 16752], [-1032, 20052]].map(([x, z]) => hNear(x, z));   // (San Pedro, Tolimán, Atitlán: their tops in the game's frame)
  check('data: the far view (~23 x 32 km on a 300 m grid): the lake (over 1.000 wet nodes, its middle wet, its level 1.555,5 m), the volcanoes San Pedro (~3.000 m), Tolimán (~3.150 m) and Atitlán (~3.500 m)',
    b.length === 2 * nf && F.lake.reduce((a, c) => a + c, 0) === nf && F.cell === 300 && F.nx * F.cell > 22000 && F.nz * F.cell > 30000 && nw > 1000 && lk && lk[2] === 1555.5 && wet[lj * F.nx + li] === 1 &&
    volc[0] > 2900 && volc[1] > 3050 && volc[2] > 3400 && hmax === volc[2],
    `far ${F.nx}x${F.nz} from ${F.lo} m, up to ${Math.round(hmax)} m, ${nw} wet nodes, the volcanoes ${volc.map(Math.round).join(' / ')} m`);
}

// 4. the open road's traffic: cars, pick-ups and vans the most of the motor traffic (def.traffic.mix: [car, van, bus, motorbike, truck]), the
// buses and the motorbikes too, both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const M = def.traffic.mix, motor = tf.veh.filter(v => v.kind !== 4), by = [0, 1, 2, 3].map(k => motor.filter(v => v.kind === k).length);
  check('traffic: cars and vans the most of the mix, buses and motorbikes too, both ways', M[0] + M[1] > 0.5 && M[2] >= 0.1 && M[3] >= 0.1 && motor.length >= 5 && by[0] + by[1] > 0 && by[2] > 0 && by[3] > 0 &&
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

// 9. the places on the HUD in English (js/lang.js, Lang.place): the hospital, the power line, the woods, the view of the lake and the escape's
// goal by its dictionary, the town by its own name, the hairpins and their altitudes by their rules
{
  const ctx = { navigator: { language: 'en' }, localStorage: { getItem() { return null; }, setItem() {} }, document: { documentElement: {}, querySelectorAll() { return []; }, addEventListener() {} } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), ctx);
  ctx.Lang.set('en');
  const en = T.names.map(q => ctx.Lang.place(q.n));
  check('names: the HUD\'s places in English (Hospital, Hairpin 1 · 2,060 m, Hairpin 2 · 2,054 m, Sololá, Under the Power Line, Pine Woods, Lake View), the escape\'s goal',
    en.join('|') === 'Hospital|Hairpin 1 · 2,060 m|Hairpin 2 · 2,054 m|Sololá|Under the Power Line|Pine Woods|Lake View' && ctx.Lang.place(def.escTo) === 'To the lake', en.join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
