// Killar (India, Himachal Pradesh): an open road with three ways to drive it on one card (def.modes: the race against 21 rivals, the time
// trial and the duel in the traffic; a single lane of gravel, so the grid's two columns stand closer together). The road: the real line from the village of Killar along the cliff above the
// Chenab, into the side valley of the Hangrung Nala and over its bridge, 4.4 km in its real scale, nearly level (~2,400 m), no steeper than
// ~8.5 %; gravel all the way (def.roadSurface). No barriers but a wooden fence on the left (def.unfenced, def.fence, the user's decisions of
// 9. 11. 2026): it holds a car, a hit across it at more than 6.5 m/s breaks a panel or two (they stay broken to the race's end), and a car
// whose middle goes through it past the edge of a drop above the river (def.drops: right past the narrow shoulder) or off the bridge's deck
// falls (Race._fall), fast or at a crawl; elsewhere one more than 10 m from the road's edge is put back on it after 0.3 s (Race._offRoad);
// in a race of 13 on the autopilot few go over. The open road's traffic is its own mix (def.traffic): jeeps,
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
//    (Track.dropAt), the other side's verge farther out. A wooden fence on the left (def.fence, the user's decision of 9. 11. 2026 at
//    ~18.30): along every drop, none on the bridge over the Hangrung Nala; no barrier on the right: a car goes off both sides of the bridge
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

// 4. the fence and the edge: a car hitting the fence above the threshold breaks it, goes through and falls into the drop, is put back on the
//    road where it went over, damaged; below it the fence holds the car (it slides along); through a broken panel a car falls even at a
//    crawl, off both sides of the bridge too; on the mountain's side no wall: 9 m from the road's edge the car stays, 11 m it is put back
{
  const [a, b, sd] = def.drops.find(([a, b]) => b - a > 80), sm = T.startS + (a + b) / 2, [ba, bb] = def.bridges[0];
  const run = (s, side, v, ang, thr, pre) => {
    Math.random = seeded(3);
    const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, damage: 2 })), P = r.player; r.start(); if (pre) pre(r);
    const i = T.idx(s), h = T.hd[i] + side * ang, o = side * (T.w - 1.5);
    P.place(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, h); P.y = P.py = T.hy[i]; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v;
    let fell = false, minY = 1e9, wall = 0, out = -1e9, past = -1e9; const y0 = T.hy[i], d0 = P.dmg;
    for (let k = 0; k < 120 * 4; k++) { Math.random = seeded(100 + k); P.inThr = thr; P.inBrk = 0; P.inSteer = 0; r.step(DT); if (P.fall) fell = true; minY = Math.min(minY, P.y);
      wall = Math.max(wall, P.hitWall || 0); P.hitWall = 0; if (!fell && !P.offN) { out = Math.max(out, side * P.q.d - T.w); past = Math.max(past, side * P.q.d - (side > 0 ? P.q.br : P.q.bl)); } if (P.offN) P.inThr = 0; }
    Math.random = orig;
    const q = T.query(P.x, P.z, P.q.i, {});
    return { fell, drop: y0 - minY, falls: P.falls || 0, put: P.offN || 0, brk: r.fence.n, back: Math.abs(q.d) < T.w && Math.abs(P.y - T.elevAt(q.s).y) < 0.5, along: q.s - s, dmg: P.dmg - d0, wall, out, past, fin: Number.isFinite(P.x + P.z + P.y) };
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
  const brL = run(T.startS + ba + 8, -1, 8, 1, 0), brR = run(T.startS + ba + 8, 1, 10, 0.5, 0), up = run(sm, -sd, 15, 0.45, 0), at9 = stand(sm, 9), at11 = stand(sm, 11);
  check('the fence: at 90 km/h into it the car breaks a panel or two, goes through and falls (more than 8 m down), then it is back on the road near where it went over, damaged',
    fast.brk >= 1 && fast.brk <= 3 && fast.fell && fast.falls === 1 && fast.drop > 8 && fast.back && Math.abs(fast.along) < 60 && fast.dmg > 0.2 && fast.fin,
    `${fast.brk} panels broken, fell ${fast.drop.toFixed(1)} m, back on the road ${fast.back} ${fast.along.toFixed(0)} m on, damage +${fast.dmg.toFixed(2)}`);
  check('the fence: hit at ~29 km/h across it, it breaks; at ~19 km/h it holds the car (no fall); sliding along it, it holds the car on the road',
    above.brk >= 1 && above.fell && below.brk === 0 && !below.fell && below.wall > 0 && slide.brk === 0 && !slide.fell && slide.wall > 0 && slide.past < 0.5 && slide.fin,
    `above: ${above.brk} broken, fell ${above.fell}; below: ${below.brk} broken, hit ${below.wall.toFixed(1)} m/s; slide: ${slide.brk} broken, middle ${slide.past.toFixed(2)} m from the fence's line`);
  check('through a broken panel a car falls at a crawl too, and off both sides of the bridge (no fence there)',
    crawl.fell && crawl.falls === 1 && crawl.back && crawl.dmg > 0.2 && [brL, brR].every(x => x.fell && x.falls === 1 && x.back && !x.wall),
    `crawl: fell ${crawl.fell}, damage +${crawl.dmg.toFixed(2)}; the bridge: left ${brL.fell}, right ${brR.fell}`);
  check('off the road on the mountain side: no wall, no fall; 9 m from the road it stays, 11 m it is put back; driven off, it is put back at 10 m, not damaged',
    at9 === 0 && at11 === 1 && !up.fell && up.put === 1 && up.back && !up.wall && up.dmg < 0.01 && up.out > 9.5 && up.out < 12 && up.fin,
    `standing 9 m: put back ${at9}, 11 m: ${at11}; driven: put back ${up.put} at ${up.out.toFixed(1)} m from the road, damage +${up.dmg.toFixed(3)}`);
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
  check('race: 13 cars on the autopilot, three races: every car at the finish, at most one in six through the fence and over the edge', fin === cars && falls <= cars / 6,
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
