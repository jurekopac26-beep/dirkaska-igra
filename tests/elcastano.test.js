// El Castaño: an open road with four ways to drive it on one card (the race, the time trial, the duel in the traffic and the run from the
// police). The road: the real line (OpenStreetMap) of the narrow road from El Castaño up through the cloud forest of the coastal range of
// Venezuela, at full scale and about 7.9 km from ~986 m over the two bridges of the river (Río Madre Vieja), round its eight hairpins
// (def.curves) and La Regresiva del Diablo to the pass (~1606 m). They drive on the right in Venezuela. Its data as tools/elcastano/build.py
// wrote it and World.gore (js/world-gore.js, js/world-elcastano.js) reads it: the terrain, the land cover (the forest most of it), the river
// beds, the three bridges (no guardrails on them), the far view's grid. A whole race on autopilot: every car finishes and pulls up past the
// line; a whole duel in the traffic. The medal times: the stock rally car on the autopilot. The places on the HUD in English (Lang.place).
//   node tests/elcastano.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'elcastano'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const right = (v) => v.d * v.dir > 0.5;

// 1. the track: an open road, four ways to drive it, 4 checkpoints, on the right; 7.8-8.0 km from ~986 m to ~1606 m, at most ~14.5 % up
check('track: an open road with four ways to drive it, 4 checkpoints, the road 8 m wide, on the right, named "Kraj, Država", not a test track',
  def.open && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 4 && !def.leftHand &&
  def.name === 'El Castaño, Venezuela' && def.en.name === 'El Castaño, Venezuela' && def.theme === 'elcastano' && !def.test && !def.pending,
  `race ${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
{
  let top = -1e9, low = 1e9, gmax = 0, gmin = 0;
  for (let i = T.startIdx; i <= T.finishIdx; i++) { const a = T.altAt(T.hy[i]); top = Math.max(top, a); low = Math.min(low, a); }
  for (let i = T.startIdx; i < T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  check('track: from ~986 m to the pass (~1606 m), 7.8-8.0 km, at most ~14.5 % up and ~7 % down; ~240 m past the line for the slots',
    Math.abs(def.alt[0] - 986) < 5 && Math.abs(def.alt[1] - 1606) < 5 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 2 && low > 975 && top < 1615 &&
    T.raceLen > 7800 && T.raceLen < 8000 && Math.abs(def.realKm - T.raceLen / 1000) < 0.02 && gmax < 0.145 && gmin > -0.07 && T.len - T.finishS > 200,
    `${Math.round(T.raceLen)} m, the road ${Math.round(low)}-${Math.round(top)} m, steepest ${(gmax * 100).toFixed(1)} % up, ${(-gmin * 100).toFixed(1)} % down, ${Math.round(T.len - T.finishS)} m past the line`);
  check('track: not in the big championship', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('elcastano'));
}

// 2. the hairpins (def.curves): 8, in order, each a real bend the way its sign says (over 120 degrees), each altitude the road's; the names
// on the HUD (the two bridges, the river, La Regresiva del Diablo) in order, each altitude the road's, each with the commentator's lines
{
  const cv = def.curves || [], k = T.k, N = T.N;
  const turn = cv.map(([d]) => { const m = T.idx(T.startS + d), sg = Math.sign(k[m]) || 1; let a = m, b = m;
    while (a > 0 && Math.sign(k[a - 1]) === sg && Math.abs(k[a - 1]) > 1 / 120) a--;
    while (b < N - 1 && Math.sign(k[b + 1]) === sg && Math.abs(k[b + 1]) > 1 / 120) b++;
    let s = 0; for (let i = a; i < b; i++) s += k[i] * T.ds; return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  check('bends: 8 hairpins over 120 degrees, in order, each the way its sign says, each sign\'s altitude the road\'s',
    cv.length === 8 && cv.every((c, q) => !q || c[0] > cv[q - 1][0] + 50) && turn.every((s, q) => Math.abs(s) > 2.09 && Math.sign(s) === cv[q][2]) && cv.every((c, q) => Math.abs(c[1] - alt[q]) < 3),
    cv.map((c, q) => `${c[0]} m: ${Math.round(turn[q] * 57.3)} deg`).join(', '));
  const nm = T.names.map(q => q.n), at = (q) => T.altAt(T.hy[T.idx(T.startS + q.d)]), num = (q) => { const m = q.n.match(/ · (\d)\.(\d{3}) m$/); return m ? +(m[1] + m[2]) : NaN; };
  check('names: the bridge, Río Madre Vieja, La Regresiva del Diablo, the bridge, in order, each altitude the road\'s, each with the commentator\'s lines',
    nm.length === 4 && /^Most · /.test(nm[0]) && /^Río Madre Vieja · /.test(nm[1]) && /^La Regresiva del Diablo · /.test(nm[2]) && /^Most · /.test(nm[3]) &&
    T.names.every(q => Math.abs(num(q) - at(q)) < 3) && T.names.every((q, j) => (!j || q.d > T.names[j - 1].d) && q.say && q.say.length >= 2) && T.names[3].d <= T.raceLen,
    T.names.map(q => `${q.n} (${Math.round(at(q))} m)`).join(' | '));
}

// 3. the data for World.gore: the terrain rows and residuals, the land cover cell for cell (the forest most of it), the river beds near the
// road, the three bridges (OpenStreetMap's), the first and last named places on a bridge, the far view's grid
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), res = Buffer.from(D.res, 'base64').length === D.rows.reduce((s, r) => s + r[1], 0);
  let cells = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (the forest most of it)', rows && res && cells === L.nx * L.nz && cnt[1] > cells / 2,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: forest ${cnt[1]}, grass ${cnt[0]}, shrubs ${cnt[2]}, built ${cnt[3]})`);
  const RB = def.riverBeds || [], beds = RB.every(b => b.length >= 5 && (b.length - 1) % 2 === 0 && b[0] >= 2 && b[0] <= 6);
  const B = def.bridges || [];
  check('data: the river beds (the river 6 m, the streams 2-3 m), the three bridges along the road in order, the first and last names on a bridge',
    RB.length >= 3 && beds && B.length === 3 && B.every(([a, b], q) => b > a && b - a < 20 && (!q || a > B[q - 1][1])) &&
    Math.abs(T.names[0].d - B[0][0]) < 12 && Math.abs(T.names[3].d - B[2][0]) < 12 && B[2][1] < T.raceLen,
    `${RB.length} beds, bridges ${B.map(b => b.join('-')).join(', ')}`);
  const F = def.farDem;
  check('data: the far view\'s grid', F && F.nx > 10 && F.nz > 10 && Buffer.from(F.b64, 'base64').length === 2 * F.nx * F.nz, F ? `${F.nx}x${F.nz}, cell ${F.cell} m` : 'none');
}

// 4. the traffic keeps right, both ways on its own half; cars, vans, motorbikes, minibuses
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const own = tf.veh.filter(right);
  check('traffic: keeps right (both ways on its own half)', tf.sd === 1 && own.length === tf.veh.length && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && tf.veh.length > 8,
    `${tf.veh.length} vehicles, on the right ${own.length}`);
}

// 5. the ways to drive it: the time trial alone, the race with 13 cars, online always the race, the run from the police on the right half
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), pol = new C.Race(T, opts({ numAI: 0, playerGrid: 1, police: true, damage: 2 }));
  tt.start(); race.start(); pol.start();
  check('mode: the time trial (alone on the line), the race (13 cars behind the line), the run from the police (on the right half, the police and the traffic on it)',
    tt.timeTrial && tt.cars.length === 1 && !race.timeTrial && race.cars.length === 13 && !!pol.pol && !!pol.tf && pol.player.q.d > 1,
    `police start at ${pol.player.q.d.toFixed(2)} m across`);
  Math.random = orig;
}

// 6. a whole race on autopilot: every car finishes, then pulls up in its own slot past the line
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach the finish', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, v: c.speed, parked: !!c.parked }; });
  check('race: past the line every car stops in its own slot, before the end of the road', slots.every(p => p.parked && p.v < 0.3 && p.s > 20 && p.s < T.len - T.finishS - 5),
    slots.sort((a, b) => a.pos - b.pos).map(p => `P${p.pos}@${p.s.toFixed(0)}m`).join(' '));
}

// 7. a whole duel in the traffic on autopilot: both reach the finish, nobody on foot knocked down
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0;
  while (t < 900 && r.cars.some(c => !c.finished)) { Math.random = seeded(7000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the finish through the traffic, no one on foot knocked down', r.cars.every(c => c.finished) && !hits, `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s`);
}

// 8. the medal times (dry and wet): gold < silver < bronze, the rain slower; gold = the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

// 9. the places on the HUD in English: Bridge and the altitudes by Lang.place's rules, the place names as they are; the escape's "To the pass"
{
  const ctx = { navigator: { language: 'en' }, localStorage: { getItem() { return null; }, setItem() {} }, document: { documentElement: {}, querySelectorAll() { return []; }, addEventListener() {} } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), ctx);
  ctx.Lang.set('en');
  const en = T.names.map(q => ctx.Lang.place(q.n));
  check('names: the HUD\'s places in English (Bridge · 1,002 m, Río Madre Vieja, La Regresiva del Diablo, Bridge), the escape\'s "To the pass"',
    /^Bridge · 1,0\d\d m$/.test(en[0]) && /^Río Madre Vieja · 1,0\d\d m$/.test(en[1]) && /^La Regresiva del Diablo · 1,3\d\d m$/.test(en[2]) && /^Bridge · 1,5\d\d m$/.test(en[3]) &&
    ctx.Lang.place(def.escTo) === 'To the pass', en.join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
