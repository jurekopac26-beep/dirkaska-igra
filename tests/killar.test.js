// Killar (India, Himachal Pradesh): an open road with three ways to drive it on one card (def.modes: the race against 21 rivals, the time
// trial and the duel in the traffic; a single lane of gravel, so the grid's two columns stand closer together). The road: the real line from the village of Killar along the cliff above the
// Chenab, into the side valley of the Hangrung Nala and over its bridge, 4.4 km in its real scale, nearly level (~2,400 m), no steeper than
// ~8.5 %; gravel all the way (def.roadSurface). No barriers but a wooden fence on the left (def.unfenced, def.fence, the user's decisions of
// 9. 11. 2026), brittle as the delineators (~22.21): any touch breaks a panel or a few (they stay broken to the race's end), the car not
// thrown back and barely slowed, and a car whose middle goes through it past the edge of a drop above the river (def.drops: right past the narrow shoulder) or off the bridge's deck
// falls (Race._fall), fast or at a crawl, onto the slope drawn below (def.floor: it lands and slides on it, never sinks into it, and is soon
// put back); elsewhere one more than 10 m from the road's edge is put back on it after 0.3 s (Race._offRoad),
// but where the cut beside the road is steep the rock stops it first, as a wall of the terrain (def.rock: no barrier on the right, the rockfall
// net there only a look); in a race of 13 on the autopilot few go over. The open road's traffic is its own mix (def.traffic): jeeps,
// pickups and motorbikes, a few lorries and buses. A whole duel in the traffic on autopilot: both reach the finish and the traffic keeps
// moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/killar.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'killar'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 1, playerGrid: 2, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const orig = Math.random;

// 1. the track: an open road, three ways to drive it, its checkpoints; narrow; named as the rules want; not a round of the big championship
check('track: an open road with three ways to drive it (def.modes: race, time trial, traffic), 4 checkpoints, the road 9 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic' && T.cpS.length === 4 && T.w === 4.5,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: named "Killar, Indija" ("Killar, India" in English), a real place (no test track)', def.name === 'Killar, Indija' && def.en && def.en.name === 'Killar, India' && !def.test);
{
  let gmax = 0; for (let i = T.startIdx; i < T.finishIdx; i++) gmax = Math.max(gmax, T.grade[i]);
  check('track: from Killar (~2,400 m) 4.4 km along the cliff (the real length), nearly level, nowhere steeper than ~8.5 %',
    Math.abs(def.alt[0] - 2402) < 10 && Math.abs(def.alt[1] - 2412) < 10 && T.raceLen > 4300 && T.raceLen < 4500 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 2 && gmax < 0.09,
    `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m, steepest ${(gmax * 100).toFixed(1)} %`);
}
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('killar'));
check('track: the HUD knows the places in order (Killar, the Chenab, the Hangrung Nala, the finish)',
  T.names.map(q => q.n.split(' · ')[0]).join('|') === 'Killar|Reka Chenab|Hangrung Nala|Cilj' && T.names.every(q => q.say), T.names.map(q => q.n + ' @' + Math.round(q.d)).join(', '));

// 2. the surface: gravel (makadam) all the way
{
  const q = {}, at = (d) => { const i = T.idx(T.startS + d); return T.surface(T.query(T.px[i], T.pz[i], i, q)); }, sf = [20, 1000, 2200, 3300, 4300].map(at);
  check('surface: gravel all the way', sf.every(s => s === 5), sf.join(','));
}

// 3. the drops: most of the road on the edge of the drop to the river (on the left, the valley's side): the edge 1.2 m past the road
//    (Track.dropAt), the other side's verge farther out. A wooden fence on the left (def.fence, the user's decision of 9. 11. 2026
//    between ~18.10 and ~18.20): along every drop, none on the bridge over the Hangrung Nala; no barrier on the right: a car goes off both sides of the bridge
//    (Track.fallAt), elsewhere it is put back on the road 10 m from the road's edge after 0.3 s
{
  const D = T.dropAt; let len = 0, edge = true, onBr = false;
  for (let i = 0; i < T.N; i++) for (let sd = 0; sd < 2; sd++) if (D[sd][i]) { len += T.ds; const b = sd ? T.br[i] : T.bl[i]; if (Math.abs(b - (T.w + 1.2)) > 0.01) edge = false;
    const s = i * T.ds - T.startS; if (def.bridges.some(([a, c]) => s > a - 2 && s < c + 2)) onBr = true; }
  const other = []; for (const [a, b, sd] of def.drops) { const i = T.idx(T.startS + (a + b) / 2); other.push(sd > 0 ? T.bl[i] : T.br[i]); }
  check('drops: more than two thirds of the race on the edge of the drop (on the left), the edge 1.2 m past the road (the other side farther out); not on the bridge',
    D && len > T.raceLen * 0.67 && edge && !onBr && def.drops.every(d => d[2] === -1) && other.every(v => v > T.w + 1.9) && def.bridges.length === 1,
    `${def.drops.length} stretches, ${Math.round(len)} m of ${Math.round(T.raceLen)} m, the other side at least ${Math.min(...other).toFixed(2)} m from the centre`);
  const F = T.fallAt, [ba, bb] = def.bridges[0], bi = T.idx(T.startS + (ba + bb) / 2), FN = T.fence, kAt = (d) => Math.floor((T.startS + d - FN.s0) / FN.P);
  let fenced = !!FN; if (FN) for (const [a, b] of def.drops) for (let d = a + 1; d < b - 1; d++) { const k = kAt(d); if (!(k >= 0 && k < FN.n && FN.on[k])) fenced = false; }
  const brOpen = !!FN && [ba + 1, (ba + bb) / 2, bb - 1].every(d => !FN.on[kAt(d)]);
  check('a wooden fence on the left (def.fence, panels of 3 m) along every drop, none on the bridge; no barrier on the right (put back 10 m from the road after 0.3 s); off both sides of the bridge a car falls',
    fenced && brOpen && FN.side === -1 && FN.P === 3 && T.unf && T.unf[0] === 10 && T.unf[1] === 0.3 && F && F[0][bi] && F[1][bi] && D[0].every((v, i) => !v || F[0][i]),
    `${FN ? FN.on.reduce((a, b) => a + b, 0) : 0} panels, unfenced ${JSON.stringify(def.unfenced)}`);
}

// 4. the fence and the edge: the fence is brittle, as the delineators (def.fence.vBreak 0, the user's decision of 9. 11. 2026 at ~22.21:
//    »naredi da je ograja krhka tak kot kolicki ki so ob cesti in se takoj razbije«): any touch breaks a panel or a few, at any speed and
//    angle, the car not thrown back (its speed across the fence kept) and barely slowed; a car whose middle goes past the edge falls into the
//    drop and is put back on the road where it went over, damaged; through a broken panel a car falls even at a crawl, off both sides of the
//    bridge too; on the mountain's side no wall: 9 m from the road's edge the car stays, 11 m it is put back. Falling, the car lands on the
//    slope drawn below it (def.floor, Track.floorAt: the terrain the world draws; the user's report of 9. 11. 2026 at ~23.48: »padel v grafiko
//    in postal neviden«): never under it, and put back on the road at most 0.5 s after it touched it
{
  const [a, b, sd] = def.drops.find(([a, b]) => b - a > 80), sm = T.startS + (a + b) / 2, [ba, bb] = def.bridges[0];
  const run = (s, side, v, ang, thr, pre, off = 1.5) => {   // (thr < 0: the speed held at v until the car first touches the fence or a wall, then off;
    // off: the car's middle that far inside the road's edge at the start; the touch: its speed and its speed across the fence then, the least across it
    // in 0.2 s after, its speed 0.1 s after)
    Math.random = seeded(3);
    const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, damage: 2 })), P = r.player; r.start(); if (pre) pre(r);
    const i = T.idx(s), h = T.hd[i] + side * ang, o = side * (T.w - off);
    P.place(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, h); P.y = P.py = T.hy[i]; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v;
    let fell = false, minY = 1e9, wall = 0, out = -1e9, past = -1e9, t0 = -1, v0 = 0, vn0 = 0, vnMin = 1e9, v1 = 0, under = 1e9, cells = 0, tf = -1, tl = -1, tp = -1; const y0 = T.hy[i], d0 = P.dmg, fo = {};
    const across = () => side * (P.vx * T.nx[P.q.i] + P.vz * T.nz[P.q.i]);
    for (let k = 0; k < 120 * 4; k++) { Math.random = seeded(100 + k); const sp = Math.hypot(P.vx, P.vz), vn = across(), n0 = r.fence.n;
      P.inThr = thr >= 0 ? thr : t0 < 0 && sp < v ? 0.7 : 0; P.inBrk = thr < 0 && t0 < 0 && sp > v * 1.03 ? 0.4 : 0; P.inSteer = 0; r.step(DT); if (P.fall) fell = true; minY = Math.min(minY, P.y);
      if (P.fall) { if (tf < 0) tf = k; if (T.floorAt(P.x, P.z, fo)) { under = Math.min(under, P.y - fo.h); cells++; } if (tl < 0 && P.fall.land) tl = k; } else if (tf >= 0 && tp < 0) tp = k;   // (the drawn ground under the falling car's middle)
      if (t0 < 0 && ((P.hitWall || 0) > 0 || r.fence.n > n0)) { t0 = k; v0 = sp; vn0 = vn; }
      if (t0 >= 0 && !fell && k - t0 <= 24) { vnMin = Math.min(vnMin, across()); if (k - t0 === 12) v1 = Math.hypot(P.vx, P.vz); }
      wall = Math.max(wall, P.hitWall || 0); P.hitWall = 0; if (!fell && !P.offN) { out = Math.max(out, side * P.q.d - T.w); past = Math.max(past, side * P.q.d - (side > 0 ? P.q.br : P.q.bl)); } if (P.offN) P.inThr = 0; }
    Math.random = orig;
    const q = T.query(P.x, P.z, P.q.i, {});
    return { fell, drop: y0 - minY, falls: P.falls || 0, put: P.offN || 0, brk: r.fence.n, back: Math.abs(q.d) < T.w && Math.abs(P.y - T.elevAt(q.s).y) < 0.5, along: q.s - s, dmg: P.dmg - d0, wall, out, past, fin: Number.isFinite(P.x + P.z + P.y),
      touch: t0 >= 0, v0, vn0, vnMin, loss: v0 > 0 && v1 > 0 ? (1 - v1 / v0) * 100 : NaN,
      under, cells, land: tl < 0 ? -1 : (tl - tf) * DT, slid: tl < 0 || tp < 0 ? -1 : (tp - tl) * DT, fallT: tf < 0 || tp < 0 ? -1 : (tp - tf) * DT };
  };
  const stand = (s, off) => {   // a car standing still off the road on the right, its middle off metres from the road's edge, for 1 s
    Math.random = seeded(5);
    const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, damage: 2 })), P = r.player; r.start();
    const i = T.idx(s), o = T.w + off; P.place(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, T.hd[i]); P.y = P.py = T.hy[i]; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s;
    for (let k = 0; k < 120; k++) { Math.random = seeded(700 + k); P.inThr = 0; P.inBrk = 1; P.inSteer = 0; r.step(DT); }
    Math.random = orig; return P.offN || 0;
  };
  const brkAll = (r) => r.fence.brk.fill(0.001);
  const fast = run(sm, sd, 25, 0.35, 0), above = run(sm, sd, 15, 0.56, 0), below = run(sm, sd, 15, 0.36, 0), slide = run(sm, sd, 14, 0.2, 0.3), crawl = run(sm, sd, 2.5, 0.6, 0.12, brkAll);
  const soft = [run(sm, sd, 20 / 3.6, 0.52, -1), run(sm, sd, 20 / 3.6, 0.175, -1, null, 0.3), run(sm, sd, 60 / 3.6, 0.087, -1, null, 0.3), run(sm, sd, 120 / 3.6, 0.087, -1, null, 0.3),
    run(T.startS + 700, -1, 90 / 3.6, 0.035, -1, null, 0.2)];   // (the last: the user's report of 9. 11. 2026 at ~23.48, at 0.7 km the car slid along the fence: brushing it at 2° at 90 km/h)
  const brL = run(T.startS + ba + 8, -1, 8, 1, 0), brR = run(T.startS + ba + 8, 1, 10, 0.5, 0), up = run(sm, -sd, 15, 0.45, 0), at9 = stand(sm, 9), at11 = stand(sm, 11);
  check('the fence is brittle, as the delineators: touched at 20 km/h (at 30° and at 10°), brushed at 5° at 60 and 120 km/h and at 2° at 90 km/h at 0.7 km, it breaks at once, holding nothing: the car not thrown back (at least 70 % of its speed across the fence kept), less than 5 % of its speed lost in 0.1 s',
    soft.every(x => x.touch && x.brk >= 1 && x.wall === 0 && x.vn0 > 0.3 && x.vnMin > 0.7 * x.vn0 && x.loss < 5 && x.fin),
    soft.map((x, k) => `${['20 km/h 30°', '20 km/h 10°', '60 km/h 5°', '120 km/h 5°', '90 km/h 2° at 0.7 km'][k]}: ${x.brk} broken, across ${x.vn0.toFixed(2)} -> least ${x.vnMin.toFixed(2)} m/s, speed -${x.loss.toFixed(1)} %`).join('; '));
  check('the fence: at 90 km/h into it the car breaks a few panels, goes through and falls (more than 3 m down, onto the slope below), then it is back on the road near where it went over, damaged',
    fast.brk >= 1 && fast.brk <= 4 && fast.fell && fast.falls === 1 && fast.drop > 3 && fast.back && Math.abs(fast.along) < 60 && fast.dmg > 0.2 && fast.fin,
    `${fast.brk} panels broken, fell ${fast.drop.toFixed(1)} m, back on the road ${fast.back} ${fast.along.toFixed(0)} m on, damage +${fast.dmg.toFixed(2)}`);
  // falling onto the slope (def.floor): at five places along the drops, slowly (29 km/h at 17° off the road's line) and fast (90 km/h at 20°)
  const ontoM = [300, 524, 1279, 2500, 3900], onto = ontoM.flatMap(m => [run(T.startS + m, -1, 8, 0.3, 0), run(T.startS + m, -1, 25, 0.35, 0)]);
  check('over the edge the car lands on the slope drawn below it (def.floor; the user\'s report of 9. 11. 2026 at ~23.48: »padel v grafiko in postal neviden«): at 0.3, 0.52, 1.28, 2.5 and 3.9 km, slowly and fast, its middle never under the ground drawn there, and back on the road at most 0.5 s after it first touched it (1.6 s after it went over at the latest)',
    onto.every(x => x.fell && x.falls === 1 && x.cells > 0 && x.under > -0.1 && x.back && x.fallT > 0 && x.fallT <= 1.61 && (x.land < 0 || x.slid <= 0.51) && x.fin) && onto.filter(x => x.land >= 0).length >= 6,
    onto.map((x, k) => `${ontoM[k >> 1]} m ${k & 1 ? 'fast' : 'slow'}: ${x.land >= 0 ? `touched after ${x.land.toFixed(2)} s, slid ${x.slid.toFixed(2)} s` : 'no touch'}, at least ${x.under.toFixed(2)} m over the ground, back after ${x.fallT.toFixed(2)} s`).join('; '));
  check('the fence holds no car: hit at ~29 and ~19 km/h across it, or sliding along it at 50 km/h, it breaks and the car goes through and falls, then it is back on the road',
    [above, below, slide].every(x => x.brk >= 1 && x.fell && x.falls === 1 && x.back && x.wall === 0 && x.fin),
    [above, below, slide].map((x, k) => `${['~29 km/h', '~19 km/h', 'sliding'][k]}: ${x.brk} broken, fell ${x.fell}, back ${x.back}`).join('; '));
  check('through a broken panel a car falls at a crawl too, and off both sides of the bridge (no fence there)',
    crawl.fell && crawl.falls === 1 && crawl.back && crawl.dmg > 0.2 && [brL, brR].every(x => x.fell && x.falls === 1 && x.back && !x.wall),
    `crawl: fell ${crawl.fell}, damage +${crawl.dmg.toFixed(2)}; the bridge: left ${brL.fell}, right ${brR.fell}`);
  check('off the road on the mountain side: no wall, no fall; 9 m from the road it stays, 11 m it is put back; driven off, it is put back at 10 m, not damaged',
    at9 === 0 && at11 === 1 && !up.fell && up.put === 1 && up.back && !up.wall && up.dmg < 0.01 && up.out > 9.5 && up.out < 12 && up.fin,
    `standing 9 m: put back ${at9}, 11 m: ${at11}; driven: put back ${up.put} at ${up.out.toFixed(1)} m from the road, damage +${up.dmg.toFixed(3)}`);
  // the rock (def.rock, Track.rock: tools/killar-skala.mjs from the ground drawn): where the cut on the right is steep, the rock stops the car
  // as a wall of the terrain (no fall, not put back: it never gets 10 m from the road); its line past the barrier's, within 11.5 m of the road
  const RK = T.rock, Rr = RK && RK[1];
  let ri = -1; if (Rr) for (let i = 0; i < T.N; i++) if (Rr[i] > 0 && (ri < 0 || Rr[i] < Rr[ri]) && !(T.fallAt && T.fallAt[1][i])) ri = i;
  const lineOk = !!RK && [0, 1].every(k => RK[k].every((v, i) => !v || (v >= (k ? T.br[i] : T.bl[i]) + 1.2 && v <= T.w + 11.6)));
  const rk = ri >= 0 ? run(ri * T.ds, 1, 12, 0.5, 0.4) : null, rkR = ri >= 0 ? Rr[ri] : 0;
  check('the rock: where the cut on the right is steep (def.rock), the car driven into it at 43 km/h stops at the rock as at a wall: no fall, not put back, its middle short of the rock\'s line',
    lineOk && rk && !rk.fell && rk.put === 0 && rk.wall > 0 && rk.out + T.w < rkR && rk.out > rkR - T.w - 3 && rk.fin,
    rk ? `the rock ${rkR.toFixed(1)} m from the middle (${(ri * T.ds - T.startS).toFixed(0)} m after the start), the car's middle at most ${(rk.out + T.w).toFixed(1)} m, hit ${rk.wall.toFixed(1)} m/s, put back ${rk.put}` : 'no rock');
}

// 4b. a race of 13 on the autopilot, three times: every car at the finish, few of them through the fence or over the edge
{
  let falls = 0, fin = 0, cars = 0, put = 0, brk = 0;
  for (const seed of [1, 2, 3]) {
    Math.random = seeded(seed);
    const r = new C.Race(T, opts({ numAI: 12, playerGrid: 12, seed, difficulty: 1 + (seed % 3), damage: 2 })), P = r.player; r.start();
    let t = 0, k = 0; while (t < 400 && r.cars.some(c => !c.finished)) { Math.random = seeded(9000 + seed * 100000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig;
    falls += r.cars.reduce((a, c) => a + (c.falls || 0), 0); put += r.cars.reduce((a, c) => a + (c.offN || 0), 0); fin += r.cars.filter(c => c.finished).length; cars += r.cars.length; brk += r.fence.n;
  }
  check('race: 13 cars on the autopilot, three races: every car at the finish, at most one in three through the fence and over the edge (the fence brittle: in 18 races about one in five, 44 of 234)', fin === cars && falls <= cars / 3,
    `${fin}/${cars} at the finish, ${falls} falls, ${brk} fence panels broken, ${put} put back on the road`);
}

// 5. the open road's traffic: jeeps, pickups and motorbikes both ways on their own halves of the road, a few lorries and buses
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({ traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const motor = tf.veh.filter(v => v.kind !== 4);
  check('traffic: cars, pickups and motorbikes both ways on their own halves of the road',
    motor.length >= 15 && motor.some(v => v.dir > 0) && motor.some(v => v.dir < 0) && motor.every(v => v.d * v.dir > 0.5 && Math.abs(v.d) < T.w) && [0, 1, 3].every(k => motor.some(v => v.kind === k)),
    `${motor.length} vehicles: ${motor.filter(v => v.kind === 0).length} cars, ${motor.filter(v => v.kind === 1).length} pickups, ${motor.filter(v => v.kind === 2).length} buses, ${motor.filter(v => v.kind === 3).length} motorbikes, ${tf.veh.length - motor.length} cyclists`);
}

// 6. the ways to drive it: the race (thirteen cars on the grid behind the line, its two columns on the narrow road), opts.tt the time trial,
// opts.traffic the duel
{
  Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), duel = new C.Race(T, opts({ traffic: true })), race = new C.Race(T, opts({ numAI: 12, playerGrid: 12 }));
  Math.random = orig;
  race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b), lat = Math.max(...race.cars.map(c => Math.abs(c.q.d)));
  check('mode: opts.tt is the time trial (the player alone on the line); opts.traffic the duel with one rival', tt.timeTrial && tt.cars.length === 1 && !duel.timeTrial && duel.cars.length === 2 && !!duel.tf);
  check('mode: without them the race, 13 cars on the grid behind the line, every one of them on the road', !race.timeTrial && race.cars.length === 13 && backs[0] > 0 && backs[12] < T.startS - 5 && lat + 1 < T.w,
    'grid ' + backs.map(b => b.toFixed(0)).join(' ') + `, at most ${lat.toFixed(1)} m off the centre line`);
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the finish, nobody on foot knocked down, the traffic keeps moving
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ traffic: true, damage: 2 })), P = r.player; r.start();
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
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, falls ${r.cars.reduce((a, c) => a + (c.falls || 0), 0)}, ${r.tf.veh.length} vehicles`);
}

// 8. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
