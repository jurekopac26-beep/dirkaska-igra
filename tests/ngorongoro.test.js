// Ngorongoro: an open road with three ways to drive it on one card (def.modes: the race, the time trial and the duel in the traffic), a descent
// (def.descent: the commentator's descent lines, the AI's braking with the slope). The road: the real line of the one-way cobbled descent road
// down the western wall of the Ngorongoro crater (Tanzania), at full scale and about 3 km: from the rim at Windy Gap (~2169 m) past the gate of
// the descent road (its barrier), round its one hairpin (def.curves) and down the wall at 12-17 % to the crater floor (~1818 m at the finish).
// One way (def.oneWay: everybody goes down, the slow lane on the left, def.leftHand), the whole road cobbled (def.setts: the setts' surface,
// less grip), the run-up on the rim road gravel (def.surf). Its data as tools/ngorongoro/build.py wrote it and its own world
// (js/world-ngorongoro.js) reads it: the terrain's rows, the land cover's run-length code, the viewpoint at Windy Gap, the gate, the rangers'
// huts, the far view's grid with Lake Magadi. The traffic of the duel: only the safari cars and vans, all going down, no bicycles, nobody on
// foot. A whole race (12 AI + the player on autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the
// traffic on autopilot: both reach the finish and the traffic keeps moving. The medal times of the time trial: the stock rally car on the
// autopilot, dry and in the rain; the co-driver's calls. The places on the HUD in English (js/lang.js, Lang.place). The animals by the road:
// tests/browser/ngorongoro.test.mjs.
//   node tests/ngorongoro.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'ngorongoro'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, a descent, three ways to drive it, one way with the slow lane on the left, its checkpoints; at full scale, about
// 3 km, ~351 m down and never up; cobbled all the way, the run-up gravel; its name as the rules want it
check('track: an open road, a descent (def.descent) with three ways to drive it (race, time trial, traffic), one way (def.oneWay, def.leftHand), 4 checkpoints, the road 9 m wide, named "Kraj, Država"',
  def.open && def.descent && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic' && def.oneWay && def.leftHand && T.cpS.length === 4 && T.cpS.every((s, k) => !k || s > T.cpS[k - 1]) &&
  T.w === 4.5 && def.name === 'Ngorongoro, Tanzanija' && def.en.name === 'Ngorongoro, Tanzania' && !def.altTop,
  `race ${Math.round(T.raceLen)} m, checkpoints ${T.cpS.map(s => Math.round(s - T.startS)).join(', ')} m, ${def.alt[0]} -> ${def.alt[1]} m, modes ${(def.modes || []).join(',')}`);
{
  let up = 0, gmax = 0; for (let i = T.startIdx + 1; i <= T.finishIdx; i++) { up = Math.max(up, T.hy[i] - Math.min(...T.hy.subarray(T.startIdx, i))); gmax = Math.max(gmax, -T.grade[i]); }
  const drop = T.hStart - T.hFinish;
  check('track: from the rim at Windy Gap (~2169 m) down to the crater floor (~1818 m), 2.9-3.05 km, falling all the way, the steepest grade 15-17.5 %, ~12 % on average',
    Math.round(T.altAt(T.hStart)) === 2169 && Math.round(T.altAt(T.hFinish)) === 1818 && def.alt.join() === '2169,1818' && T.raceLen > 2900 && T.raceLen < 3050 && Math.abs(def.realKm - T.raceLen / 1000) < 0.02 &&
    up < 0.3 && gmax > 0.15 && gmax < 0.175 && drop / T.raceLen > 0.11 && drop / T.raceLen < 0.13,
    `${Math.round(T.raceLen)} m, ${drop.toFixed(1)} m down, never up more than ${up.toFixed(2)} m, steepest ${(gmax * 100).toFixed(1)} %, average ${(drop / T.raceLen * 100).toFixed(1)} %`);
}
{
  let on = 0, all = 0; for (let i = T.startIdx; i <= T.finishIdx; i++) { all++; if (T.settAt && T.settAt[i]) on++; }
  let past = 0, nPast = 0; for (let i = T.finishIdx; i < T.N - 2; i++) { nPast++; if (T.settAt && T.settAt[i]) past++; }
  let grav = 0; for (let i = 0; i < T.startIdx - 2; i++) if (T.sf[i] === 5) grav++;
  check('track: the cobbles (def.setts) from the start line all the way down and past the finish to the cars\' slots; the rim road of the run-up gravel (def.surf)',
    on === all && past === nPast && grav === T.startIdx - 2, `${on}/${all} samples of the race, ${past}/${nPast} past the finish, ${grav}/${T.startIdx - 2} of the run-up on gravel`);
}
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('ngorongoro'));

// 2. the hairpin: one, a real bend of the line the way its sign says (135 degrees and more within 120 m of road, near its sign), its sign's
// altitude the road's own, no bend under a 10 m radius; flatter round its tip than down the wall. The places on the HUD (the gate, the hairpin,
// the wall, the ledge half way down, the floor) at the road's own altitudes, in order, each with the commentator's lines
{
  const turnAt = (c, h) => { const a = T.idx(c - h), b = T.idx(c + h); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; };
  const cv = def.curves || [], turn = cv.map(([d, , dir]) => { let best = 0; for (let c = d - 40; c <= d + 40; c += 4) for (const h of [20, 30, 40, 50, 60]) best = Math.max(best, turnAt(T.startS + c, h) * dir); return best * dir; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  let kmax = 0; for (let i = T.startIdx; i < T.finishIdx; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let gin = 0, nin = 0, gout = 0, nout = 0;
  for (let i = T.startIdx; i < T.finishIdx; i++) { const s = i * T.ds - T.startS, g = Math.abs(T.grade[i]); if (cv.some(([d]) => Math.abs(s - d) < 12)) { gin += g; nin++; } else if (s > 400 && s < 2600) { gout += g; nout++; } }
  check('hairpin: one, a bend of 135 degrees and more the way its sign says, the sign\'s altitude the road\'s, no bend under a 10 m radius, flatter round its tip than down the wall',
    cv.length === 1 && Math.abs(turn[0]) > 2.35 && Math.sign(turn[0]) === cv[0][2] && Math.abs(cv[0][1] - alt[0]) < 3 && 1 / kmax >= 10 && gin / nin < 0.92 * gout / nout,
    `turn ${Math.round(turn[0] * 57.3)} deg, sign ${cv[0][1]} m / road ${Math.round(alt[0])} m, tightest radius ${(1 / kmax).toFixed(1)} m, grade round the tip ${(gin / nin * 100).toFixed(1)} %, down the wall ${(gout / nout * 100).toFixed(1)} %`);
  const L = T.names, num = (q) => +q.n.match(/(\d)\.(\d{3}) m$/).slice(1).join(''), at = (q) => T.altAt(T.hy[T.idx(T.startS + q.d)]);
  const want = [/^Zapornica · /, /^Serpentina · /, /^Stena kraterja · /, /^Polica · /, /^Dno kraterja · /];
  check('places: the gate, the hairpin (at its sign), the crater wall, the ledge and the crater floor, in order down the road, each at the road\'s altitude, each with the commentator\'s lines',
    L.length === 5 && L.every((q, k) => want[k].test(q.n) && /· \d\.\d{3} m$/.test(q.n) && Math.abs(num(q) - at(q)) < 2 && q.say && q.say.length >= 2 && (!k || q.d > L[k - 1].d)) && Math.abs(L[1].d - cv[0][0]) < 1,
    L.map(q => `${q.n} @${Math.round(q.d)} (${Math.round(at(q))} m)`).join(' | '));
}

// 3. the data for the road's own world (tools/ngorongoro/build.py): the terrain rows and residuals, the land cover cell for cell (grass most of
// it, the bush, a few trees), the viewpoint at Windy Gap by the start, the gate on the road at its sign, the rangers' huts and the toilets by
// it, the round huts of the boma far up on the rim, the far view's grid of the crater with Lake Magadi on its floor
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals (20 m cells), the land cover cell for cell (grass most of it, the bush, a few trees)', rows && res && D.cell === 20 && cells === L.nx * L.nz && maxC <= 6 && cnt[0] > cells * 0.7 && cnt[2] > 2000 && cnt[1] > 50,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, trees ${cnt[1]}, shrubs ${cnt[2]}, built ${cnt[3]}, bare ${cnt[4]})`);
  const q = (p) => { const r = T.query(p[0], p[1], -1, {}); return { s: r.s - T.startS, d: r.d }; };
  const v = (def.views || []).map(q), g = (def.gates || []).map(q), b = (def.bld || []).map(q), hutMin = Math.min(...(def.huts || []).map(h => Math.abs(q(h).d)));
  check('data: the viewpoint at Windy Gap by the start, the gate on the road at its sign, the rangers\' huts and the toilets by the gate, the boma\'s round huts far up on the rim',
    v.length === 1 && Math.abs(v[0].s) < 80 && Math.abs(v[0].d) < 45 && g.length === 1 && Math.abs(g[0].d) < 1 && Math.abs(g[0].s - T.names[0].d) < 10 &&
    b.length === 3 && b.every(p => Math.abs(p.s - T.names[0].d) < 40 && Math.abs(p.d) > T.w + 0.5 && Math.abs(p.d) < 45) && def.bld.filter(p => p[5] === 1).length === 1 && def.huts.length >= 20 && hutMin > 300,
    `viewpoint ${v.map(p => `${Math.round(p.s)} m / ${p.d.toFixed(1)}`)}, gate ${g.map(p => `${Math.round(p.s)} m / ${p.d.toFixed(1)}`)}, buildings ${b.map(p => `${Math.round(p.s)} m / ${p.d.toFixed(1)}`).join(', ')}, ${def.huts.length} huts, the nearest ${Math.round(hutMin)} m off the road`);
  const F = def.farDem, nf = F.nx * F.nz, wet = F.lake.reduce((a, b, k) => a + (k % 2 ? b : 0), 0);
  check('data: the far view (the crater on a 300 m grid ~15 km round, heights 2 bytes a node, the land cover of each node), Lake Magadi on the floor (def.far.lake: below the finish)',
    Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 300 && F.cls && F.cls.length > 100 && wet > 100 && wet < nf / 10 &&
    def.far && def.far.lake && def.far.lake[2] < def.alt[1] - 50 && def.far.lake[2] > 1650,
    `far ${F.nx}x${F.nz} from ${F.lo} m, the lake ${wet} nodes (${(wet / nf * 100).toFixed(1)} %) at ${def.far.lake[2]} m`);
}

// 4. the traffic of the duel: only the safari cars and their vans, all going down the one-way road, no buses, motorbikes, lorries or bicycles,
// nobody on foot by the road (the crater's animals are the world's)
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const cars = tf.veh.filter(v => v.kind === 0 && v.p === 0), vans = tf.veh.filter(v => v.kind === 1 && v.p === 1);
  check('traffic: only the safari cars and vans, all going down (one way), no buses, motorbikes, lorries or bicycles, nobody on foot',
    tf.veh.length > 8 && cars.length + vans.length === tf.veh.length && cars.length > 0 && vans.length > 0 && tf.veh.every(v => v.dir > 0) && !(tf.ped || []).length,
    `${tf.veh.length} vehicles: ${cars.length} cars, ${vans.length} vans, going down ${tf.veh.filter(v => v.dir > 0).length}, ${(tf.ped || []).length} on foot`);
}

// 5. the ways to drive it (and an online race: always the race)
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line on the rim road; online always the race',
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

// 7. a whole duel in the traffic on autopilot (both cars): both reach the finish past the safari vehicles, the traffic keeps moving
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
  check('duel: both reach the finish through the traffic going down, no vehicle standing for long', r.cars.every(c => c.finished) && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

// 8. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower (the wet setts); gold is the stock rally car on
// the autopilot x 1.01, dry and in the rain, without a rescue or a wall; the splits in order
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const run = (rain) => {
    const orig = Math.random; Math.random = seeded(3);
    try {
      const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1, rain })), P = r.player; r.start();
      let t = 0, k = 0, walls = 0, resc = 0; while (!P.finished && t < 400) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.hitWall > 3) walls++; P.hitWall = 0; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
      return { P, walls, resc };
    } finally { Math.random = orig; }
  };
  const d = run(0), w = run(1);
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01 (dry and wet), no rescue, no wall, the splits in order',
    asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && d.P.finished && w.P.finished && !d.resc && !d.walls && !w.resc && Math.abs(d.P.finishTime * 1.01 - M.cs[0]) < 1.5 && Math.abs(w.P.finishTime * 1.01 - M.wet.cs[0]) < 1.5 &&
    d.P.splits.length === 4 && d.P.splits.every((s, k) => !k || s > d.P.splits[k - 1]),
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s; autopilot ${d.P.finishTime ? d.P.finishTime.toFixed(1) : '-'} s, in the rain ${w.P.finishTime ? w.P.finishTime.toFixed(1) : '-'} s, splits ${d.P.splits.map(s => s.toFixed(1)).join(' / ')}`);
}

// 9. the co-driver of the time trial (a descent reads its notes as a rally stage does): the calls in order within the run, the hairpin
// called the way it turns, the last call to the finish
{
  const N = T.paceNotes(), txt = N.map(c => c.text), hairs = txt.reduce((a, t) => a + (t.match(/hairpin (left|right)/g) || []).length, 0);
  check('co-driver: calls in order within the run, the hairpin called (right), the last call to the finish',
    N.length > 6 && N.every((c, k) => c.s >= T.startS && c.s < T.finishS && (k === 0 || c.s > N[k - 1].s)) && hairs === 1 && txt.some(t => /hairpin right/.test(t)) && /to finish$/.test(txt[txt.length - 1]),
    `${N.length} calls: ${txt.join(' | ')}`);
}

// 10. the places on the HUD in English (js/lang.js, Lang.place): the names by its dictionary, the heights by its rules
{
  const ctx = { navigator: { language: 'en' }, localStorage: { getItem() { return null; }, setItem() {} }, document: { documentElement: {}, querySelectorAll() { return []; }, addEventListener() {} } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'lang.js'), 'utf8'), ctx);
  ctx.Lang.set('en');
  const en = T.names.map(q => ctx.Lang.place(q.n));
  check('names: the HUD\'s places in English (The Gate · 2,157 m, Hairpin · 2,145 m, Crater Wall · 2,055 m, The Ledge · 1,984 m, Crater Floor · 1,831 m)',
    en.join(' | ') === 'The Gate · 2,157 m | Hairpin · 2,145 m | Crater Wall · 2,055 m | The Ledge · 1,984 m | Crater Floor · 1,831 m', en.join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
