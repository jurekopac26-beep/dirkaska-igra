// Chapman's Peak: an open road with four ways to drive it on one card, as Vršič and Los Caracoles (def.modes: the race, the time trial, the
// duel in the traffic and the run from the police), from Hout Bay up the cliffs above the Atlantic to the view point at the highest point of
// the road: at most 5 km, in the real scale. They drive on the left in South Africa (def.leftHand): the traffic keeps to the left half of the
// road both ways (uphill on the left, downhill on the right as the race sees it), goes round things on its right, a bus pulls in to the left;
// the police start the run on the left half too. Vršič's traffic still keeps right. A whole race up to the view point (12 AI + the player on
// autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the traffic on autopilot: both reach the top and
// the traffic keeps moving, on its own (left) half. The medal times of the time trial: the stock rally car on the autopilot. The hills behind the
// barrier line (def.hills): a car up onto their foot, put back from them; the sea side's wall as it was. The start's hill beside the old road
// (def.hills.S, the report of 11. 11. 2026): the car driven into it from the report's point climbs it, no knock, still in the race. Across
// the side roads' mouths on the mountain side: a soft stop up the hill past their far edge, never one at once.
//   node tests/chapman.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'chapman'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const left = (v) => v.d * v.dir < -0.5;   // (a vehicle on its own half when they keep left: + across the road is the right looking uphill)

// 1. the track: an open road, four ways to drive it, driven on the left; at most 5 km, from Hout Bay (~20 m) up to the view point (~150 m)
check('track: an open road with four ways to drive it, 4 checkpoints, the road 13 m wide, the traffic on the left (def.leftHand)',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 6.5 && def.leftHand === true,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from Hout Bay (~20 m) up to the view point (~150 m), 4.5-5 km, the climb ~130 m', T.raceLen > 4500 && T.raceLen <= 5000 && Math.abs(def.alt[0] - 19) < 10 && Math.abs(def.alt[1] - 153) < 15 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('chapman'));
{
  let gmax = 0, gmin = 0; for (let i = T.idx(T.startS); i < T.idx(T.finishS); i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  const nm = T.names.map(q => q.n), turns = T.corners.filter(c => c.sev >= 2).length;
  check('road: winding (a bend after another), the grades as the real road (up to ~8 %), the places on the HUD from Hout Bay to the view point',
    gmax < 0.09 && gmin > -0.04 && turns >= 10 && nm[0] === 'Hout Bay' && /^Chapman's Peak · \d+ m$/.test(nm[nm.length - 1]) && nm.includes('Cestninska postaja') && T.names.every((q, k) => !k || q.d > T.names[k - 1].d) && T.names[T.names.length - 1].d <= T.raceLen,
    `steepest ${(gmax * 100).toFixed(1)} % up, ${(gmin * 100).toFixed(1)} % down, ${turns} bends, places ${nm.join(' | ')}`);
}

// 2. the traffic keeps left (Chapman's Peak) and right (Vršič): every vehicle on its own half, both ways; no trucks on the cliffs
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  const V = new C.Track(C.TRACKS.find(x => x.id === 'vrsic')), dv = new C.Race(V, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 }));
  Math.random = orig;
  const own = tf.veh.filter(left), bikes = tf.veh.filter(v => v.kind === 4);
  check('traffic: keeps left on Chapman\'s Peak (uphill on the left half, downhill on the right as the race sees it), cyclists at the left edge; no trucks',
    tf.sd === -1 && own.length === tf.veh.length && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && bikes.length > 0 && bikes.every(v => v.d * v.dir < -(T.w - 1)) && !tf.veh.some(v => v.p === 5),
    `${tf.veh.length} vehicles (${tf.veh.filter(v => v.dir > 0).length} up, ${tf.veh.filter(v => v.dir < 0).length} down), on the left ${own.length}, cyclists ${bikes.length}, motorbikes ${tf.veh.filter(v => v.kind === 3).length}`);
  check('traffic: Vršič keeps right as before', dv.tf.sd === 1 && dv.tf.veh.every(v => v.d * v.dir > 0.5), `${dv.tf.veh.length} vehicles`);
  // a vehicle pulling over for the police goes to its own (left) edge and indicates that way; going round a wreck it passes on its right
  const a = tf.veh.find(v => v.dir > 0 && v.kind === 0), e = tf._edge(a), b = tf.veh.find(v => v.dir < 0 && v.kind === 0), eb = tf._edge(b);
  check('traffic: its edge (pulling over) is the left one both ways', e < -T.w + 1.5 && eb > T.w - 1.5, `uphill car ${e.toFixed(2)} m, downhill car ${eb.toFixed(2)} m`);
}

// 3. the ways to drive it; the run from the police starts on the left half
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), pol = new C.Race(T, opts({ numAI: 0, playerGrid: 1, police: true, damage: 2 }));
  tt.start(); race.start(); pol.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5, 'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  check('mode: the run from the police: the player starts on the left half of the road, the traffic and the police on it', !!pol.pol && !!pol.tf && pol.player.q.d < -1,
    `the player at ${pol.player.q.d.toFixed(2)} m across the road`);
  Math.random = orig;
}

// 4. a whole race up to the view point on autopilot: every car finishes, then pulls up in its own slot past the line
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach the view point', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 5. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody on foot knocked down, the traffic keeps moving and keeps left
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0, nL = 0, nAll = 0; const stand = new Map();
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); if (!v.off && v.st === 0 && !v.yl && !v.pass && v.v > 2) { nAll++; if (left(v)) nL++; } }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the view point through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
  check('duel: the moving traffic keeps left all the way (98 % and more of the samples)', nAll > 200 && nL / nAll >= 0.98, `${nL}/${nAll} on the left`);
}

// 6. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
  const Z = M.winter; check('winter medals: gold < silver < bronze, in winter and in the snow; slower than the summer\'s, the snow slowest', !!Z && asc(Z.cs) && asc(Z.wet.cs) && Z.cs[0] > M.cs[0] && Z.wet.cs[0] >= Z.cs[0] && Z.wet.cs[0] > M.wet.cs[0], Z ? `winter ${Z.cs.join('/')} s, snow ${Z.wet.cs.join('/')} s` : 'no winter medals');
}

// 7. the hills behind the barrier line (def.hills, tools/chapman-hribi.mjs; the user, 11. 11. 2026: »Poprabi da se avto ne zabije v hrib ampak
// zapelje v hrib«): where the ground rises behind it no fence, no ditch and no wall. A car driven into the hill at 10, 20 and 30 m/s, 10°, 30°
// and 60° to the road (the height and the tilt set the limit at 521 m, a rockfall net at 3000 m, the right side at 2050 m) climbs it: higher,
// tilted, never past the soft limit (short of the net), no wall's knock (no damage, no sparks), never a stop at once (the even stop the room
// leaves: at most 20 g over a tenth of a second, a wall takes it in a step), not rolled over; down from the hill again (the slope's pull), or held
// against it with the throttle, stuck and put back (the button, Race.rescue). On the sea side the wall stays; no other track has hills
{
  const H = T.hill, on = (sR, si) => !!(H && H.on[si][T.idx(T.startS + sR)]), len = (si) => H ? H.on[si].reduce((a, b) => a + b, 0) * T.ds : 0;
  check('hills: on the mountain side at the reports\' places (521, 893, 2133 m on the left) and the rock at 2133 m on the right, not on the sea side at 893 m; no other track has hills',
    on(521, 0) && on(893, 0) && on(2133, 0) && on(2133, 1) && !on(893, 1) && len(0) > 4000 && len(1) > 1000 && C.TRACKS.every(d => d.id === 'chapman' || !d.hills),
    H ? `left ${len(0).toFixed(0)} m, right ${len(1).toFixed(0)} m of ${T.raceLen.toFixed(0)} m` : 'no hills');
  const drive = (sR, side, deg, v, thr, secs) => {   // (the player 2.5 m inside the barrier line, turned deg towards it, at v m/s, the throttle held, straight on)
    const orig = Math.random; Math.random = seeded(7);
    const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player, i = T.idx(T.startS + sR), bar = side > 0 ? T.br[i] : T.bl[i], off = side * (bar - 2.5), h = T.hd[i] + side * deg * Math.PI / 180;
    P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, h); P.y = P.py = T.hy[i]; P.q = T.query(P.x, P.z, i, {}); P.sPrev = P.q.s; P.dist = sR; P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v; r.start();
    const si = side > 0 ? 1 : 0, q2 = {}, win = []; let past = -9, over = -9, lift = 0, tilt = 0, resc = null, back = null, wall = 0, dmg = 0, roll = 0, g1 = 0, g10 = 0, vx = P.vx, vz = P.vz, inHill = false;
    for (let t = 0; t < secs && !resc && back == null; t += DT) {
      P.inThr = thr; P.inBrk = 0; P.inSteer = 0; P.inHand = 0; r.step(DT);
      const dv = Math.hypot(P.vx - vx, P.vz - vz); vx = P.vx; vz = P.vz; g1 = Math.max(g1, dv / DT / 9.81);   // (the deceleration: a step, a tenth of a second)
      win.push([P.vx, P.vz]); if (win.length > 13) win.shift(); if (win.length === 13) g10 = Math.max(g10, Math.hypot(win[12][0] - win[0][0], win[12][1] - win[0][1]) / (12 * DT) / 9.81);
      const q = P.q, ry = T.elevAt(q.s, {}).y, ch = Math.cos(P.h), sh = Math.sin(P.h); lift = Math.max(lift, P.y - ry);
      let deep = -9; for (const [cx, cz] of P.corners) { const qq = T.query(P.x + cx * ch - cz * sh, P.z + cx * sh + cz * ch, q.i, q2); if (Math.sign(qq.d) !== side) continue;   // (its corners past the line; the limit there)
        const o = Math.abs(qq.d) - (side > 0 ? qq.br : qq.bl), b = Math.min(T.N - 1, qq.a + 1); deep = Math.max(deep, o); if (o > 0) over = Math.max(over, o - (H.lim[si][qq.a] + (H.lim[si][b] - H.lim[si][qq.a]) * qq.t)); }
      past = Math.max(past, deep); if (deep > 0) inHill = true;
      if (P.hl && P.hl.on) tilt = Math.max(tilt, Math.atan(Math.hypot(P.hl.lat, P.hl.lon)) * 180 / Math.PI);
      wall = Math.max(wall, P.hitWall || 0); dmg = Math.max(dmg, +P.dmg || 0, (P.dz || []).reduce((a, x) => a + (+x || 0), 0), (P.dents || []).length, P.flat ? 1 : 0); if (P.rl) roll = 1;
      if (inHill && lift > 0.3 && P.y - ry < 0.05) back = t;   // (down from the hill again: the slope brought it back to the road's level)
      if (P.stuckT > 2.5) { r.rescue(P); r.step(DT); resc = { t, d: P.q.d, dy: P.y - T.elevAt(P.q.s, {}).y }; } }
    Math.random = orig; return { past, over, lift, tilt, resc, back, wall, dmg, roll, g1, g10, lim: H.lim[si][i] };
  };
  if (H) {
    const all = [], f = (x, k) => x.toFixed(k == null ? 1 : k);
    for (const [sR, side, where] of [[521, -1, '521 m left'], [3000, -1, '3000 m left (the net)'], [2050, 1, '2050 m right']]) for (const v of [10, 20, 30]) for (const deg of [10, 30, 60]) all.push(Object.assign(drive(sR, side, deg, v, 0.3, 6), { where, v, deg }));
    const worst = (k) => all.reduce((a, x) => x[k] > a[k] ? x : a), say = (x) => `${x.where}, ${x.v} m/s at ${x.deg}°`, hard = (x) => x.v === 30 && x.deg === 60;
    check('hills: driven into the hill (10/20/30 m/s, 10/30/60°, three places) a car climbs it: past the barrier line, higher, tilted',
      all.every(x => x.past > 0.8 && x.lift > 0.3 && x.tilt > 10), all.map(x => `${x.v}/${x.deg}° ${f(x.past)} m ${f(x.lift)} m up`).slice(0, 9).join(', ') + ' …');
    check('hills: never past the soft limit (short of a rockfall net: tests/browser/world.test.mjs)', all.every(x => x.over < 0.05),
      `the most over it ${f(worst('over').over, 3)} m (${say(worst('over'))}); the limit ${all.filter((x, k) => k % 9 === 0).map(x => `${x.where} ${f(x.lim, 2)} m`).join(', ')}`);
    check('hills: no wall there (no knock, no damage, no sparks) and never rolled over',
      all.every(x => x.wall === 0 && x.dmg === 0 && !x.roll && x.tilt < 50), `the most tilted ${f(worst('tilt').tilt, 0)}° (${say(worst('tilt'))}); wall ${f(worst('wall').wall)} m/s`);
    check('hills: never a stop at once: at 30 m/s and 60° at most 20 g over 0.1 s (a step at most 25 g; the room the slope leaves), else at most 10 g',
      all.every(x => x.g10 <= (hard(x) ? 20 : 10) && x.g1 <= (hard(x) ? 25 : 13)), `the hardest over 0.1 s ${f(worst('g10').g10)} g (${say(worst('g10'))}), in a step ${f(worst('g1').g1)} g (${say(worst('g1'))})`);
    check('hills: down from the hill again, or held against it stuck and put back (the button) within 6 s',
      all.every(x => x.back != null || (x.resc && Math.abs(x.resc.d) < T.w && Math.abs(x.resc.dy) < 0.05)), `back ${all.filter(x => x.back != null).length}, put back ${all.filter(x => x.resc).length} of ${all.length}` + all.filter(x => x.back == null && !x.resc).map(x => `; neither: ${say(x)}`).join(''));
    const sea = drive(893, 1, 20, 15, 0.3, 3), held = drive(521, -1, 70, 6, 0.8, 8);
    check('hills: at 893 m on the sea side the wall stays at the barrier line (no hill, the car not lifted)', sea.past < 0.05 && sea.lift < 0.02, `its corner ${f(sea.past, 2)} m past the line, up ${f(sea.lift, 2)} m`);
    check('hills: a car held against the hill with the throttle is stuck within 4 s and put back on the road (the button, Race.rescue)', held.resc && held.resc.t < 4 && Math.abs(held.resc.d) < T.w && Math.abs(held.resc.dy) < 0.05,
      held.resc ? `put back after ${f(held.resc.t)} s, ${f(held.resc.d)} m from the middle, ${f(held.resc.dy, 2)} m from the road` : 'never stuck');
  }
}

// 8. the start (the user, 11. 11. 2026 10.34, on the preview: »Na zacetki proge ce zapeljem v hrib se zaletim v hrib namesti zapeljem v hrib«;
// the race's recording: the player at 142 km/h off the road to the left by the grid, across the old road (side road 0, Military Road) and its
// corner against its far side's limit, a wall there then, the knock tearing a wheel off: out of the race). The hill past the old road's far
// side (def.hills.S): from the report's point (x 48.8, z 17.95, heading 0.339, 142 km/h, full throttle) steered a little to the left (and as
// recorded, back to the right): up onto the slope, no wall's knock, no damage, never past its soft limit, still in the race (Race.isOut); as
// recorded back onto the road and on. Along the start, the grid to 75 m, driven into the hill (30 m/s, 30°): no knock there either (a touch
// along the line between the road and the old road at most; the drive over when the car, back across the road, hits the sea side's wall)
{
  const S = T.stubs && T.stubs[0], H = S && S.hill, q0 = T.query(55.85, 20.21, -1, {}), j0 = q0.k === 0 ? Math.min(S.n - 2, q0.kj) : -1;
  check('the start: a hill past the old road\'s far side where the report\'s car hit its limit (side road 0, u > 0)', !!H && j0 >= 0 && H.on[1][j0] === 1 && H.on[1][j0 + 1] === 1 && H.lim[1][j0] > 2,
    H ? `the report's knock ${(q0.s - T.startS).toFixed(0)} m after the start, ${q0.st.toFixed(0)} m along the old road; its soft limit ${H.lim[1][Math.max(0, j0)].toFixed(2)} m` : 'no hills beside the side roads');
  const go = (x0, z0, h0, v, thr, steer, secs) => {   // (the player at x0, z0 heading h0 at v m/s, its pedals and steering (t: s) held)
    const orig = Math.random; Math.random = seeded(7);
    const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player, qa = T.query(x0, z0, -1, {});
    P.place(x0, z0, h0); P.y = P.py = T.yAt(qa); P.q = T.query(x0, z0, qa.i, {}); P.sPrev = P.q.s; P.dist = P.q.s - T.startS; P.vx = Math.cos(h0) * v; P.vz = Math.sin(h0) * v; r.start();
    const y0 = P.y, q2 = {}; let up = 0, rise = 0, wall = 0, sea = 0, dmg = 0, out = false, onK = false, over = -9;
    for (let t = 0; t < secs; t += DT) {
      P.inThr = thr; P.inBrk = 0; P.inSteer = steer(t); P.inHand = 0; r.step(DT);
      if (P.hitWall > 0 && T.query(P.wallX, P.wallZ, P.q.i, q2).d > 0) { sea = P.hitWall; break; }   // (the sea side, to the right: the hill's part over)
      up = Math.max(up, P.y - T.yAt(P.q)); rise = Math.max(rise, P.y - y0); if (P.q.k === 0) onK = true; if (r.isOut(P)) out = true;
      wall = Math.max(wall, P.hitWall || 0); dmg = Math.max(dmg, +P.dmg || 0, (P.dz || []).reduce((a, x) => a + (+x || 0), 0), (P.dents || []).length, P.flat ? 1 : 0);
      if (H) { const ch = Math.cos(P.h), sh = Math.sin(P.h);   // (its corners past the old road's limit on the hill: how far past the soft limit there)
        for (const [cx, cz] of P.corners) { const qq = T.query(P.x + cx * ch - cz * sh, P.z + cx * sh + cz * ch, P.q.i, q2); if (qq.k !== 0) continue;
          const si = qq.u > 0 ? 1 : 0, f = Math.max(0, qq.st / 2), j = Math.min(S.n - 2, Math.floor(f)), w = Math.min(1, f - j), o = Math.abs(qq.u) - (T.stubHw(S, qq.st, qq.u) + S.lim);
          if (o > 0 && (H.on[si][j] || H.on[si][j + 1])) over = Math.max(over, o - (H.lim[si][j] * (1 - w) + H.lim[si][j + 1] * w)); } } }
    Math.random = orig; return { up, rise, wall, sea, dmg, out, onK, over, d: P.q.d, k: P.q.k, kmh: P.speed * 3.6 };
  };
  const f = (x, k) => x.toFixed(k == null ? 1 : k), say = (x) => `wall ${f(x.wall)} m/s, damage ${f(x.dmg, 2)}, ${x.out ? 'OUT' : 'in the race'}, ${f(x.up, 2)} m up the slope, ${f(x.rise, 2)} m higher, the most past the soft limit ${f(x.over, 3)} m`;
  const left = go(48.8, 17.95, 0.339, 142 / 3.6, 1, () => -0.08, 3), rec = go(48.8, 17.95, 0.339, 142 / 3.6, 1, (t) => t < 0.2 ? 0 : t < 0.25 ? 0.09 : 0.26, 3.5);   // (rec: back on the road ~3.1 s on)
  check('the start: from the report\'s point at 142 km/h a little to the left the car drives up the hill past the old road: higher, no knock, no damage, never past its soft limit, still in the race',
    left.onK && left.up > 0.2 && left.rise > 0.2 && left.wall === 0 && !left.sea && left.dmg === 0 && !left.out && left.over < 0.05, say(left));
  check('the start: as recorded (back to the right) the same, then back onto the road and on (> 100 km/h)',
    rec.onK && rec.up > 0.2 && rec.wall === 0 && !rec.sea && rec.dmg === 0 && !rec.out && rec.over < 0.05 && rec.k < 0 && Math.abs(rec.d) < T.w && rec.kmh > 100, say(rec) + `; after 3.5 s ${f(rec.d)} m from the middle at ${f(rec.kmh, 0)} km/h`);
  const grid = [-135, -100, -50, 0, 25, 50, 75].map(sR => { const i = T.idx(T.startS + sR), h = T.hd[i] - 30 * Math.PI / 180;
    return Object.assign(go(T.px[i] - T.nx[i] * 1.5, T.pz[i] - T.nz[i] * 1.5, h, 30, 0.6, () => 0, 2.5), { sR }); });
  check('the start: along the grid and the start (-135 to 75 m) driven into the hill at 30 m/s, 30°: no knock (a touch at most 1 m/s), no damage, still in the race',
    grid.every(x => x.wall <= 1 && x.dmg === 0 && !x.out), grid.map(x => `${x.sR} m: ${x.wall ? 'touch ' + f(x.wall) + ' m/s' : 'no wall'}, ${f(x.up, 2)} m up${x.sea ? ', then the sea side at ' + f(x.sea) + ' m/s' : ''}`).join('; '));
}

// 9. the side roads' mouths on the mountain side (the old road by its mouth at 114 m, the driveway 4 at 2729 m): a car across
// one into the hill past its far edge, from its first sample on at the hill's full limit (def.hills.S's fifth number) and, where the road has
// no hill by the mouth, back to it (Track: S.hill.o): a soft stop, not one at once (the sweep of 11. 11. 2026: before up to 250 g in a step);
// from 1.5 m left of the middle at 115 km/h, 30° to the left, the throttle at 0.6
{
  const zmaj = C.MODELS.find(m => m.id === 'zmaj'), mouth = (sR) => {
    const orig = Math.random; Math.random = seeded(7);
    const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1, playerModel: zmaj, damage: 2 })), P = r.player, i = T.idx(T.startS + sR), h = T.hd[i] - 30 * Math.PI / 180, v = 115 / 3.6;
    P.place(T.px[i] - T.nx[i] * 1.5, T.pz[i] - T.nz[i] * 1.5, h); P.y = P.py = T.hy[i]; P.q = T.query(P.x, P.z, i, {}); P.sPrev = P.q.s; P.dist = sR; P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v; r.start();
    let g1 = 0, wall = 0, dmg = 0, onK = false;
    for (let t = 0; t < 2.5; t += DT) { P.inThr = 0.6; P.inBrk = 0; P.inSteer = 0; P.inHand = 0; P.hitWall = 0; const vx = P.vx, vz = P.vz; r.step(DT);
      if (!(P.hitWall > 0)) g1 = Math.max(g1, Math.hypot(P.vx - vx, P.vz - vz) / DT / 9.81); wall = Math.max(wall, P.hitWall || 0); dmg = Math.max(dmg, +P.dmg || 0); if (P.q.k >= 0) onK = true; if (P.speed < 1 && t > 0.5) break; }
    Math.random = orig; return { sR, g1, wall, dmg, onK };
  };
  const all = [75, 2700, 2725].map(mouth), f = (x, k) => x.toFixed(k == null ? 1 : k);
  check('the side roads\' mouths on the mountain side (75, 2700, 2725 m) driven across at 115 km/h, 30°: no stop at once (a step at most 40 g), no knock, no damage',
    all.every(x => x.onK && x.g1 <= 40 && x.wall <= 1 && x.dmg === 0), all.map(x => `${x.sR} m: ${f(x.g1)} g${x.wall ? ', touch ' + f(x.wall) + ' m/s' : ''}${x.dmg ? ', damage ' + f(x.dmg, 2) : ''}${x.onK ? '' : ', not in the side road'}`).join('; '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
