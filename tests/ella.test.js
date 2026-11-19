// Ella: an open road with four ways to drive it on one card, as Dadès (def.modes: the race, the time trial, the duel in the traffic and the
// run from the police). The road: the real line of road A23 in the hill country of Sri Lanka, at full scale and about 3.95 km: from the hamlet
// of Pattiyakumbura (~681 m) up through the forest under Ella Rock, over the two streams (two bridges), up the three hairpins below the town
// (def.curves, the game's numbering of the hairpins from the bottom) to Ella (~992 m). They drive on the left in Sri Lanka (def.leftHand): the
// traffic keeps to the left half of the road both ways. Its data as tools/ella/build.py wrote it and its own world (js/world-ella.js) reads
// it: the terrain's rows, the land cover's run-length code (8 classes: forest most of it, grass, the town, the tea gardens, the fields), the
// streams crossing the road under its bridges, the buildings, the bus stops, the viewpoints, the car parks, the far view's grid. A whole race
// (12 AI + the player on autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the traffic on autopilot:
// both reach the finish and the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot. The places on
// the HUD in English (js/lang.js, Lang.place).
//   node tests/ella.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'ella'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const left = (v) => v.d * v.dir < -0.5;   // (a vehicle on its own half when they keep left: + across the road is the right looking uphill)

// 1. the track: an open road, four ways to drive it, its checkpoints, the traffic on the left; at full scale, about 3.95 km, up from ~681 m
// to ~992 m; its name as the rules want it
check('track: an open road with four ways to drive it (race, time trial, traffic, police), 4 checkpoints, the road 9 m wide, on the left (def.leftHand), named "Kraj, Država"',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 4.5 && def.leftHand === true &&
  def.name === 'Ella, Šrilanka' && def.en.name === 'Ella, Sri Lanka' && !def.test && !def.pending,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt[0]} -> ${def.alt[1]} m, modes ${(def.modes || []).join(',')}`);
{
  let top = -1e9, low = 1e9, gmax = 0, gmin = 0;
  for (let i = T.startIdx; i <= T.finishIdx; i++) { const a = T.altAt(T.hy[i]); top = Math.max(top, a); low = Math.min(low, a); }
  for (let i = T.startIdx; i < T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  check('track: from Pattiyakumbura (~681 m) up to Ella (~992 m), 3.9-4.0 km, a climb: up to ~12 %, down at most ~4 %; ~260 m past the line for the slots',
    Math.abs(def.alt[0] - 681) < 5 && Math.abs(def.alt[1] - 992) < 5 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && low > def.alt[0] - 3 && top < def.alt[1] + 3 &&
    T.raceLen > 3900 && T.raceLen <= 4000 && Math.abs(def.realKm - T.raceLen / 1000) < 0.02 && gmax < 0.125 && gmin > -0.045 && T.len - T.finishS > 200,
    `${Math.round(T.raceLen)} m, the road ${Math.round(low)}-${Math.round(top)} m, steepest ${(gmax * 100).toFixed(1)} % up, ${(-gmin * 100).toFixed(1)} % down, ${Math.round(T.len - T.finishS)} m past the line`);
  check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('ella'));
}

// 2. the bends (def.curves): in order up the road, each a real bend of the line the way its sign says (from where it starts turning to where
// it stops, over 120 degrees), each sign's altitude the road's own; the three hairpins below the town the tightest; the HUD and the
// commentator know them, Ella Rock and the town
{
  const cv = def.curves || [], k = T.k, N = T.N;
  const turn = cv.map(([d]) => { const m = T.idx(T.startS + d), sg = Math.sign(k[m]) || 1; let a = m, b = m;
    while (a > 0 && Math.sign(k[a - 1]) === sg && Math.abs(k[a - 1]) > 1 / 120) a--;
    while (b < N - 1 && Math.sign(k[b + 1]) === sg && Math.abs(k[b + 1]) > 1 / 120) b++;
    let s = 0; for (let i = a; i < b; i++) s += k[i] * T.ds; return { s, r: 1 / Math.max(...Array.from(k.slice(a, b + 1), Math.abs)) }; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, q) => !q || c[0] > cv[q - 1][0] + 50), bends = turn.every((t, q) => Math.abs(t.s) > 2.09 && Math.sign(t.s) === cv[q][2]), own = cv.every((c, q) => Math.abs(c[1] - alt[q]) < 3);
  check('bends: 5 over 120 degrees, in order up the road, each the way its sign says, each sign\'s altitude the road\'s; the hairpins under 20 m round, the upper two under 10 m',
    cv.length === 5 && order && bends && own && [1, 2, 3].every(q => turn[q].r < 20) && turn[2].r < 10 && turn[3].r < 10,
    cv.map((c, q) => `${c[0]} m: ${Math.round(turn[q].s * 57.3)} deg r ${turn[q].r.toFixed(1)} m at ${Math.round(alt[q])} m`).join(', '));
  const nm = T.names.map(q => q.n), at = (q) => T.altAt(T.hy[T.idx(T.startS + q.d)]), num = (q) => { const m = q.n.match(/ · (\d+) m$/); return m ? +m[1] : NaN; };
  const hp = T.names.filter(q => /^Serpentina \d · \d+ m$/.test(q.n));
  check('names: the hairpins (Serpentina 1 .. 3) on def.curves\' three tightest, Pattiyakumbura, Ella Rock and Ella, in order, each altitude the road\'s, each with the commentator\'s lines',
    hp.length === 3 && hp.every((q, j) => Math.abs(q.d - cv[j + 1][0]) < 1 && Math.abs(num(q) - at(q)) < 3) && /^Pattiyakumbura · \d+ m$/.test(nm[0]) && Math.abs(num(T.names[0]) - at(T.names[0])) < 3 &&
    nm.includes('Ella Rock') && /^Ella · 99\d m$/.test(nm[nm.length - 1]) && Math.abs(num(T.names[nm.length - 1]) - at(T.names[nm.length - 1])) < 3 &&
    T.names.every((q, j) => (!j || q.d > T.names[j - 1].d) && q.say && q.say.length >= 2) && T.names[T.names.length - 1].d <= T.raceLen, nm.join(' | '));
}

// 3. the data for the road's own world (tools/ella/build.py): the terrain rows, the land cover cell for cell (forest most of it, the grass,
// the town, the tea gardens, the fields), the streams crossing the road under its two bridges, the buildings, the bus stops, the viewpoints,
// the car parks, the far view's grid
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (forest most, grass, the town, the tea gardens, the fields)',
    rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[1] > cells / 2 && cnt[0] > cells / 10 && cnt[3] > 200 && cnt[6] > 100 && cnt[7] > 100,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, trees ${cnt[1]}, built ${cnt[3]}, tea ${cnt[6]}, fields ${cnt[7]})`);
  // the streams (OpenStreetMap's waterways): each bridge over one of them, the two crossings of the road there
  const cross = [];
  (def.streams || []).forEach((p) => { let prev = null; for (let j = 0; j + 1 < p.length; j += 2) { const q = T.query(p[j], p[j + 1], -1, {});
    if (prev && Math.sign(q.d) !== Math.sign(prev.d) && Math.abs(q.s - prev.s) < 30 && Math.abs(q.d) < 60 && Math.abs(prev.d) < 60) cross.push(q.s - T.startS); prev = q; } });
  const br = def.bridges || [], over = br.every(([a, b]) => cross.some(s => s > a - 15 && s < b + 15));
  check('data: the streams, the two bridges each over one where it crosses the road (the second at the first hairpin: the stream from the Kital Ella falls)',
    (def.streams || []).length >= 8 && br.length === 2 && br.every(([a, b]) => b > a + 10 && b - a < 40) && over && Math.abs(br[1][0] - def.curves[1][0]) < 60,
    `${def.streams.length} streams, crossing at ${cross.map(s => Math.round(s)).join(', ')} m, bridges ${br.map(([a, b]) => `${a}-${b}`).join(', ')} m`);
  const F = def.farDem, nf = F.nx * F.nz, B = def.bld || [], st = def.stops || [];
  check('data: the buildings (generic: houses, guesthouses and shops, public), the bus stops by the road, 2 viewpoints, 2 car parks, the shops and cafés, the far view (~10 km round on a 250 m grid)',
    B.length > 400 && B.every(b => b.length === 7 && [0, 1, 5, 6].includes(b[5])) && B.filter(b => b[5] === 5).length > 20 && st.length >= 4 && st.every(s => s.length === 3 && Math.abs(s[1]) === 1) &&
    (def.views || []).length === 2 && (def.parks || []).length === 2 && (def.poi || []).length >= 8 && Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250,
    `${B.length} buildings (${B.filter(b => b[5] === 5).length} guesthouses and shops), ${st.length} stops, ${def.views.length} viewpoints, ${def.parks.length} car parks, ${def.poi.length} shops and cafés, far ${F.nx}x${F.nz} from ${F.lo} m`);
}

// 4. the traffic keeps left (Ella) and right (Vršič): every vehicle on its own half, both ways; the trunk road's own mix: cars, vans, many
// buses and motorbikes, lorries, a few cyclists at the left edge
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  const V = new C.Track(C.TRACKS.find(x => x.id === 'vrsic')), dv = new C.Race(V, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 }));
  Math.random = orig;
  const own = tf.veh.filter(left), kinds = [0, 1, 2, 3, 4].map(k => tf.veh.filter(v => v.kind === k).length), cyc = tf.veh.filter(v => v.kind === 4);
  check('traffic: keeps left (uphill on the left half, downhill on the right as the race sees it), cyclists at the left edge; cars, vans, buses, motorbikes and lorries',
    tf.sd === -1 && own.length === tf.veh.length && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && cyc.every(v => v.d * v.dir < -(T.w - 1)) &&
    kinds[0] > 0 && kinds[3] > 0 && tf.veh.some(v => v.p === 5) && tf.veh.length > 8,
    `${tf.veh.length} vehicles (${tf.veh.filter(v => v.dir > 0).length} up, ${tf.veh.filter(v => v.dir < 0).length} down), on the left ${own.length}; cars ${kinds[0]}, vans ${kinds[1]}, buses ${kinds[2]}, motorbikes ${kinds[3]}, cyclists ${kinds[4]}, lorries ${tf.veh.filter(v => v.p === 5).length}`);
  check('traffic: Vršič keeps right as before', dv.tf.sd === 1 && dv.tf.veh.every(v => v.d * v.dir > 0.5), `${dv.tf.veh.length} vehicles`);
}

// 5. the ways to drive it (and an online race: always the race); the run from the police starts on the left half
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  const pol = new C.Race(T, opts({ numAI: 0, playerGrid: 1, police: true, damage: 2 }));
  tt.start(); race.start(); pol.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line; online always the race',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5 && !net.timeTrial && net.cars.length === 2,
    'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  check('mode: the run from the police: the player starts on the left half of the road, the traffic and the police on it', !!pol.pol && !!pol.tf && pol.player.q.d < -1,
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

// 9. the places on the HUD in English (js/lang.js, Lang.place): the hairpins and their altitudes by its rules, the place names as they are;
// the result of an escape ('Do Elle' -> 'To Ella')
{
  const ctx = { navigator: { language: 'en' }, localStorage: { getItem() { return null; }, setItem() {} }, document: { documentElement: {}, querySelectorAll() { return []; }, addEventListener() {} } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), ctx);
  ctx.Lang.set('en');
  const en = T.names.map(q => ctx.Lang.place(q.n));
  check('names: the HUD\'s places in English (Pattiyakumbura, Ella Rock, Hairpin 1 .. 3 with their altitudes, Ella), the escape\'s "To Ella"',
    en[0] === T.names[0].n && en[1] === 'Ella Rock' && /^Hairpin 1 · 8\d\d m$/.test(en[2]) && /^Hairpin 3 · 9\d\d m$/.test(en[4]) && en[5] === T.names[5].n && ctx.Lang.place(def.escTo) === 'To Ella', en.join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
