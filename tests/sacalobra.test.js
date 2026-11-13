// Sa Calobra: an open road raced downhill (def.descent) with four ways to drive it on one card, as Bâlea and Izoard (def.modes: the race,
// the time trial, the duel in the traffic and the run from the police). The road: the real line of the road down to Sa Calobra (Ma-2141,
// Mallorca, Spain), at full scale and about 5 km: from just under the Coll dels Reis (~679 m) over the bridge of the knot (Nus de sa Corbata:
// the road loops round and passes under itself, a crossing on two levels the engine finds from the heights, Track._findCrossings) and down
// twelve hairpins (def.curves, the game's numbering from the top) to 337 m above the valley, the hairpins flatter than the legs between them.
// Its data as tools/proga/proga.py wrote it and the shared world of the passes (js/world-prelaz.js) reads it: the terrain's rows, the land
// cover's run-length code (8 classes: bare limestone, dry grass and the macchia's shrubs the most of it, a few pines and holm oaks), the
// satellite colours (one RGB 5-6-5 per terrain cell near the road), the far view's grid with the sea in it. The open road's traffic is its own
// mix (def.traffic): a summer road to a famous cove, the cyclists going down as fast as the cars (Traffic._dn). A whole race down (12 AI + the
// player on autopilot): every car finishes and pulls up in its own slot past the line, before the end of the road; a whole duel in the traffic
// on autopilot: both reach the finish and the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/sacalobra.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'sacalobra'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road raced downhill, four ways to drive it, its checkpoints and descent; at full scale, about 5 km (no more: the rule
// for the new tracks); its name as the rules want it
check('track: an open road downhill with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 9 m wide, named "Kraj, Država"',
  def.open && def.descent && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 4.5 && def.name === 'Sa Calobra, Španija' && def.en.name === 'Sa Calobra, Spain',
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from ~679 m down to 337 m above Sa Calobra, 4.8-5.0 km', Math.abs(def.alt[0] - 679) < 15 && def.alt[1] === 337 && T.raceLen > 4800 && T.raceLen <= 5000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit); the menu lists it with the open roads (a descent with a race and traffic is no rally stage)',
  !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('sacalobra') && !def.rally && !def.timeTrial);

// 2. the knot: one crossing on two levels, the road over the bridge first (55 m after the start), round the loop and under it (~200 m), the
// two legs square to each other and at least 7.5 m apart in height; the road's query keeps a car on its own level (the hint: its last sample)
{
  const X = T.cross || [], c = X[0] || {}, sUp = c.up * T.ds - T.startS, sLo = c.lo * T.ds - T.startS;
  check('knot: one crossing, the bridge first (40-70 m after the start), the road under it 180-215 m after the start, the legs square (sin > 0.95) and >= 7.4 m apart',
    X.length === 1 && sUp > 40 && sUp < 70 && sLo > 180 && sLo < 215 && Math.abs(c.sin) > 0.95 && c.dy >= 7.4,
    X.map(q => `up ${(q.up * T.ds - T.startS).toFixed(1)} m, lo ${(q.lo * T.ds - T.startS).toFixed(1)} m, dy ${q.dy.toFixed(2)} m, sin ${q.sin.toFixed(2)}`).join(' | '));
  const qa = X.length ? T.query(c.x, c.z, Math.round(c.lo), {}) : {}, qb = X.length ? T.query(c.x, c.z, Math.round(c.up), {}) : {};
  check('knot: at the crossing point the road\'s query stays on the level the car is on (the lower leg from the lower, the bridge from the bridge)',
    X.length && Math.abs(qa.i - c.lo) < 3 && Math.abs(qb.i - c.up) < 3, `from the lower leg ${qa.i}, from the bridge ${qb.i}`);
}

// 3. the twelve hairpins (and the knot's loop before them): in order down the road, each a real bend of the line the way its sign says
// (~150 degrees and more over its own length), each sign's altitude the road's own; the HUD knows them, the knot, the spring, the torrent, the
// rock gate and the finish above Sa Calobra
{
  const cv = def.curves || [], st = Math.round(10 / T.ds), turn = cv.map(([d, , dir]) => {   // (each bend over its own length: out from the apex while the road keeps turning its way, 2 degrees and more every 10 m)
    const i0 = T.idx(T.startS + d), sg = (i, j) => wrap(T.hd[j] - T.hd[i]) * dir; let a = i0, b = i0, s = 0;
    while (a - st > 0 && sg(a - st, a) > 0.035) a -= st; while (b + st < T.N - 1 && sg(b, b + st) > 0.035) b += st;
    for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > 2.53 && Math.sign(a) === cv[k][2]), own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('hairpins: the knot\'s loop (~270 degrees) and 12 hairpins, in order down the road, each a bend of ~150 degrees and more the way its sign says, each sign\'s altitude the road\'s',
    cv.length === 13 && Math.abs(turn[0]) > 4.2 && order && bends && own, `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}, altitudes ${alt.map(a => Math.round(a)).join(' ')}`);
  const hp = T.names.filter(q => /^Serpentina \d+ · \d{3} m$/.test(q.n)), hpOk = hp.length === 12 && hp.every((q, k) => q.n === `Serpentina ${k + 1} · ${cv[k + 1][1]} m` && Math.abs(q.d - cv[k + 1][0]) < 1);
  check('hairpins: the HUD and the commentator know them (Serpentina 1 .. 12 at the signs\' altitudes, the knot, the spring, the torrent, the rock gate, the finish above Sa Calobra)',
    hpOk && ['Nus de sa Corbata', 'Font de sa Mata', "Torrent d'Es Racó", 'Skalna vrata'].every(m => T.names.some(q => q.n === m && q.say)) && T.names[T.names.length - 1].n === `Nad Sa Calobro · ${def.alt[1]} m`,
    T.names.map(q => q.n).join(' | '));
  // the descent is on the legs: the grade through the hairpins' apexes (+-12 m) gentler than on the legs between them; down all the way,
  // nowhere steeper than ~12 %
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0, gup = 0;
  const near = (s) => cv.some(([d]) => Math.abs(s - T.startS - d) < 12), far = (s) => cv.every(([d]) => Math.abs(s - T.startS - d) > 45);
  for (let i = T.startIdx; i < T.finishIdx; i++) { const s = i * T.ds, g = -T.grade[i]; gmax = Math.max(gmax, g); gup = Math.max(gup, -g); if (near(s)) { gin += g; nin++; } else if (far(s)) { gout += g; nout++; } }
  check('grades: the hairpins gentler than the legs, the road falling all the way, nowhere steeper than ~12 %', gin / nin < 0.9 * gout / nout && gmax < 0.125 && gup < 0.005 && T.hStart - T.hFinish > 330,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %, up at most ${(gup * 100).toFixed(1)} %, down ${Math.round(T.hStart - T.hFinish)} m`);
}

// 4. the data for the shared world of the passes (tools/proga): the terrain rows, the land cover cell for cell (bare limestone, dry grass and
// the macchia the most of it, a few pines and oaks, rock faces; no snow, no lake), one satellite colour per terrain cell near the road, the
// buildings and car parks by the knot, the far view's grid with the sea in it
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), cellsNear = D.rows.reduce((s, r) => s + r[1], 0), res = Buffer.from(D.res, 'base64').length === cellsNear;
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('data: the terrain rows and residuals, the land cover cell for cell (bare limestone, dry grass, the macchia the most; a few trees and rock faces; no snow, no water)',
    rows && res && cells === L.nx * L.nz && maxC <= 7 && cnt[7] > cells * 0.2 && cnt[0] > cells * 0.2 && cnt[2] > cells * 0.12 && cnt[1] > 300 && cnt[1] < cells * 0.15 && cnt[4] > 300 && cnt[5] === 0 && cnt[6] === 0,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, trees ${cnt[1]}, shrubs ${cnt[2]}, built ${cnt[3]}, rock ${cnt[4]}, water ${cnt[5]}, snow ${cnt[6]}, bare ${cnt[7]})`);
  check('data: the ground\'s satellite colours, one (RGB 5-6-5) per terrain cell near the road', Buffer.from(def.col.b64, 'base64').length === 2 * cellsNear, `${cellsNear} cells`);
  const near = (x, z) => { let b = 1e9; for (let i = 0; i < T.N; i += 2) b = Math.min(b, Math.hypot(T.px[i] - x, T.pz[i] - z)); return b; };
  const pulls = (def.pulls || []).filter(p => near(p[0], p[1]) < 30).length, knotB = (def.bld || []).filter(b => Math.hypot(b[0] - T.cross[0].x, b[1] - T.cross[0].z) < 60).length;
  check('data: the car parks by the road (OpenStreetMap: 4 and more within 30 m of it), a building by the knot, no lakes, no cable car', pulls >= 4 && knotB >= 1 && !(def.lakes || []).length && !(def.cables || []).length,
    `${pulls} car parks by the road, ${knotB} buildings by the knot, ${(def.bld || []).length} buildings`);
  const F = def.farDem, nf = F.nx * F.nz, wet = F.lake.reduce((s, v, k) => s + (k % 2 ? v : 0), 0);
  check('data: the far view (~9 km round on a 250 m grid from the sea\'s level, heights 2 bytes a node, the sea as runs of wet nodes)', Buffer.from(F.b64, 'base64').length === 2 * nf && F.lake.reduce((a, b) => a + b, 0) === nf && F.cell === 250 && F.lo === 0 && wet > nf * 0.2,
    `${F.nx}x${F.nz}, lowest ${F.lo} m, ${wet} wet nodes of ${nf}`);
}

// 5. the open road's traffic: cars, coaches and motorbikes, many cyclists both ways, hardly any trucks; on a descent the cyclists going down
// as fast as the cars (Traffic._dn: along the road's way), the ones coming up slow
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0), cyc = tf.veh.filter(v => v.kind === 4);
  check('traffic: cars, coaches, motorbikes and many cyclists both ways, hardly any trucks', tf.veh.length > 8 && bikes.length >= 2 && cars.length > trucks.length * 3 && cyc.length >= 6 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans and coaches, ${bikes.length} motorbikes, ${trucks.length} trucks, ${cyc.length} cyclists`);
  const down = cyc.filter(v => v.dir > 0), up = cyc.filter(v => v.dir < 0), mean = (a) => a.reduce((s, v) => s + v.v0, 0) / Math.max(1, a.length);
  check('traffic: on the descent the cyclists going down (along the road) are the fast ones, those coming up slow (def.descent, Traffic._dn)',
    down.length >= 2 && up.length >= 2 && tf._dn(1) && !tf._dn(-1) && mean(down) > 1.6 * mean(up), `down ${down.length} at ${mean(down).toFixed(1)} m/s, up ${up.length} at ${mean(up).toFixed(1)} m/s`);
}

// 6. the ways to drive it (and an online race: always the race)
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

// 7. a whole race down on autopilot (over the bridge and under it): every car finishes, then pulls up in its own slot past the line (before
// the end of the road) and stays there
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
  check('race: all 13 cars reach the finish above Sa Calobra', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot, before the end of the road', slots.every(p => p.parked && p.v < 0.3 && p.s > 20 && p.s < T.len - T.finishS - 5),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 8. a whole duel in the traffic on autopilot (both cars): both reach the finish, nobody on foot knocked down, the traffic keeps moving
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

// 9. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

// 10. the hills where no wall is drawn (the user, 13. 11. 2026 23.06, stamp 2b259ef7, the race, lap 1, s ≈ 1141 m: »zbriši vdolbljeno korito, ki
// je ostalo. Še vedno se zabijem v nevidno ograjo, čeprav ograje ni več«): where buildPrelaz draws no rail and no wall the verge runs on into
// the ground (no ditch) and a hill takes the car past the barrier line (def.hills, tools/sacalobra-hribi.mjs; Track.hill), as Chapman's Peak's
// (tests/chapman.test.js, 7.). Driven into it (10/20/30 m/s, 10/30/60°, the report's place and two more): past the line, never past the soft
// limit, no wall's knock and no damage, never rolled over, no stop at once; on along it, or stuck and put back (the button)
{
  const H = T.hill, on = (sR, si) => !!(H && H.on[si][T.idx(T.startS + sR)]), len = (si) => H ? H.on[si].reduce((a, b) => a + b, 0) * T.ds : 0;
  check('hills: at the report\'s place (1141 m, right) and on long stretches both sides (where no wall is drawn: tests/browser/world.test.mjs)',
    on(1141, 1) && on(1700, 0) && on(3250, 0) && len(0) > 1800 && len(1) > 1800, H ? `left ${len(0).toFixed(0)} m, right ${len(1).toFixed(0)} m of ${T.raceLen.toFixed(0)} m` : 'no hills');
  const drive = (sR, side, deg, v, secs) => {
    const orig = Math.random; Math.random = seeded(7);
    const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player, i = T.idx(T.startS + sR), bar = side > 0 ? T.br[i] : T.bl[i], off = side * (bar - 2.5), h = T.hd[i] + side * deg * Math.PI / 180;
    P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, h); P.y = P.py = T.hy[i]; P.q = T.query(P.x, P.z, i, {}); P.sPrev = P.q.s; P.dist = sR; P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v; r.start();
    const si = side > 0 ? 1 : 0, q2 = {}, win = []; let past = -9, over = -9, lift = 0, resc = null, back = null, wall = 0, dmg = 0, roll = 0, inHill = false, g10 = 0, end = null;
    for (let t = 0; t < secs && !resc && back == null && end == null; t += DT) {
      P.inThr = 0.3; P.inBrk = 0; P.inSteer = 0; P.inHand = 0; r.step(DT);
      win.push([P.vx, P.vz]); if (win.length > 13) win.shift(); if (win.length === 13) g10 = Math.max(g10, Math.hypot(win[12][0] - win[0][0], win[12][1] - win[0][1]) / (12 * DT) / 9.81);
      if (!H.on[si][P.q.i] || !H.on[si][Math.min(T.N - 1, P.q.i + 3)]) { end = t; break; }   // (along the road to the hill's end: a wall stands there, drawn)
      const q = P.q, ry = T.elevAt(q.s, {}).y, ch = Math.cos(P.h), sh = Math.sin(P.h); lift = Math.max(lift, P.y - ry);
      let deep = -9; for (const [cx, cz] of P.corners) { const qq = T.query(P.x + cx * ch - cz * sh, P.z + cx * sh + cz * ch, q.i, q2); if (Math.sign(qq.d) !== side) continue;
        const o = Math.abs(qq.d) - (side > 0 ? qq.br : qq.bl), b = Math.min(T.N - 1, qq.a + 1); deep = Math.max(deep, o); if (o > 0) over = Math.max(over, o - (H.lim[si][qq.a] + (H.lim[si][b] - H.lim[si][qq.a]) * qq.t)); }
      past = Math.max(past, deep); if (deep > 0) inHill = true;
      wall = Math.max(wall, P.hitWall || 0); dmg = Math.max(dmg, +P.dmg || 0, (P.dz || []).reduce((a, x) => a + (+x || 0), 0), (P.dents || []).length, P.flat ? 1 : 0); if (P.rl) roll = 1;
      if (inHill && lift > 0.3 && P.y - ry < 0.05) back = t;
      if (P.stuckT > 2.5) { r.rescue(P); r.step(DT); resc = { d: P.q.d, dy: P.y - T.elevAt(P.q.s, {}).y }; } }
    Math.random = orig; return { past, over, lift, resc, back, wall, dmg, roll, g10, end, vEnd: Math.hypot(P.vx, P.vz) };
  };
  if (H) {
    const all = [], f = (x, k) => x.toFixed(k == null ? 1 : k);
    for (const [sR, side, where] of [[1141, 1, '1141 m right'], [1700, -1, '1700 m left'], [3250, -1, '3250 m left']]) for (const v of [10, 20, 30]) for (const deg of [10, 30, 60]) all.push(Object.assign(drive(sR, side, deg, v, 6), { where, v, deg }));
    const worst = (k) => all.reduce((a, x) => x[k] > a[k] ? x : a), say = (x) => `${x.where}, ${x.v} m/s at ${x.deg}°`;
    check('hills: driven into the hill (three places, 10/20/30 m/s, 10/30/60°) a car goes past the barrier line, never past the soft limit',
      all.every(x => x.past > 0.5 && x.over < 0.05), `the least past ${f(all.reduce((a, x) => Math.min(a, x.past), 9), 2)} m, the most over the limit ${f(worst('over').over, 3)} m (${say(worst('over'))})`);
    check('hills: no wall there (no knock, no damage) and never rolled over', all.every(x => x.wall === 0 && x.dmg === 0 && !x.roll), `wall ${f(worst('wall').wall)} m/s (${say(worst('wall'))}), damage ${f(worst('dmg').dmg)}`);
    check('hills: never a stop at once (at 30 m/s and 60° at most 20 g over 0.1 s, else at most 10 g)', all.every(x => x.g10 <= (x.v === 30 && x.deg === 60 ? 20 : 10)),
      `the hardest ${f(worst('g10').g10)} g (${say(worst('g10'))})`);
    check('hills: the ground there level or a slope (no hill to climb back down): the car drives on along it to the hill\'s end, or still rolls at 6 s, or held against the limit it is stuck and put back (the button)',
      all.every(x => x.end != null || x.vEnd > 1 || (x.resc && Math.abs(x.resc.d) < T.w && Math.abs(x.resc.dy) < 0.05)),
      `to its end ${all.filter(x => x.end != null).length}, rolling ${all.filter(x => x.end == null && !x.resc && x.vEnd > 1).length}, put back ${all.filter(x => x.resc).length} of ${all.length}`);
  }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
