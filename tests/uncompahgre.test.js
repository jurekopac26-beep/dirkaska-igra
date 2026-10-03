// The Uncompahgre Gorge (U.S. Route 550 south of Ouray, the Million Dollar Highway): an open road with four ways to drive it on one card, as
// Vršič and Los Caracoles (def.modes: the race, the time trial, the duel in the traffic and the run from the police). The road: the real line
// up the gorge, 4.9 km (the real length, at most 5 km), from ~2540 m to ~2860 m with grades of at most 10 %; the little rock tunnel and the
// Riverside snow shed (def.galleries: the barriers close in to their walls), the bridge at Bear Creek Falls. No guard rails above the gorge
// (def.drops): there the limit stands right past the narrow shoulder, and a car that runs over it falls down the cliff (Race._fall) and is put
// back on the road where it went over, badly damaged; a slow touch only holds it at the edge. A whole race (12 AI + the player on autopilot):
// every car finishes and pulls up in its own slot past the line; a whole duel in the traffic; a run from the police from the start; the medal
// times of the time trial: the stock rally car on the autopilot.
//   node tests/uncompahgre.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'uncompahgre'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const orig = Math.random;

// 1. the track: an open road, four ways to drive it, its checkpoints and climb; not a round of the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 10 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from above Ouray (~2540 m) up the gorge (~2860 m), 4.9 km of the real road (at most 5 km), grades of at most 10 %', Math.abs(def.alt[0] - 2543) < 15 && Math.abs(def.alt[1] - 2860) < 15 && T.raceLen > 4800 && T.raceLen <= 5000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.max(...T.grade) < 0.105,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m, steepest ${(Math.max(...T.grade) * 100).toFixed(1)} %`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('uncompahgre'));
check('track: the HUD knows the places in order (the gorge, the tunnel, Bear Creek Falls, Alpine Loop, the Mother Cline slide, the Riverside shed, the finish)',
  T.names.map(q => q.n.split(' · ')[0]).join('|') === 'Soteska Uncompahgre|Predor|Slap Bear Creek|Alpine Loop|Plaz Mother Cline|Galerija Riverside|Cilj' && T.names.every(q => q.say),
  T.names.map(q => q.n + ' @' + Math.round(q.d)).join(', '));

// 2. the galleries and the bridge: the barriers close in to the tunnel's and the shed's walls (1.6 m past the road's edges); the tunnel before
//    the bridge, the shed near the top
{
  const G = def.galleries || [], ins = [];
  for (const [a, b] of G) for (let s = a + 5; s < b - 5; s += 5) { const i = T.idx(T.startS + s); ins.push(Math.max(T.bl[i], T.br[i])); }
  const [br] = def.bridges;
  check('galleries: the rock tunnel and the Riverside snow shed over the road, the barriers at their walls inside (w + 1.6 m); the bridge between them',
    G.length === 2 && G[0][3] === 1 && ins.every(v => Math.abs(v - (T.w + 1.6)) < 0.01) && G[0][1] < br[0] && br[1] < G[1][0] && G[1][1] < T.raceLen,
    `tunnel ${Math.round(G[0][1] - G[0][0])} m at ${Math.round(G[0][0])} m, bridge ${Math.round(br[1] - br[0])} m at ${Math.round(br[0])} m, shed ${Math.round(G[1][1] - G[1][0])} m at ${Math.round(G[1][0])} m; inside ${Math.max(...ins).toFixed(2)} m`);
}

// 3. the drops: more than half of the road has the gorge right beside it, no barrier: the limit 1.2 m past the edge (Track.dropAt), the other
//    side's and the rest of the road's farther out; none on the bridge, in the tunnel or the shed
{
  const D = T.dropAt; let len = 0, edge = true, inGal = false;
  for (let i = 0; i < T.N; i++) for (let sd = 0; sd < 2; sd++) if (D[sd][i]) { len += T.ds; const b = sd ? T.br[i] : T.bl[i]; if (Math.abs(b - (T.w + 1.2)) > 0.01) edge = false;
    const s = i * T.ds - T.startS; if ([...def.galleries, ...def.bridges].some(([a, c]) => s > a - 2 && s < c + 2)) inGal = true; }
  const other = []; for (const [a, b, sd] of def.drops) { const i = T.idx(T.startS + (a + b) / 2); other.push(sd > 0 ? T.bl[i] : T.br[i]); }
  check('drops: more than half of the race on the edge of the gorge, the limit 1.2 m past the asphalt there (the other side farther out); not on the bridge or under a roof',
    D && len > T.raceLen * 0.5 && edge && !inGal && other.every(v => v > T.w + 1.9),
    `${def.drops.length} stretches, ${Math.round(len)} m of ${Math.round(T.raceLen)} m, the other side at least ${Math.min(...other).toFixed(2)} m from the centre`);
}

// 4. over the edge: a car driven into the drop at a slant falls (it leaves the road, drops, is put back on the road where it went over, damaged,
//    the race goes on); the same edge touched slowly only holds it
{
  const [a, b, sd] = def.drops.find(([a, b]) => b - a > 80), s = T.startS + (a + b) / 2, i = T.idx(s);
  const run = (v, ang) => {
    Math.random = seeded(3);
    const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, damage: 2 })), P = r.player; r.start();
    const h = T.hd[i] + sd * ang, o = sd * (T.w - 1.5);
    P.place(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, h); P.y = P.py = T.hy[i]; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v;
    let fell = false, minY = 1e9, t = 0; const y0 = T.hy[i], d0 = P.dmg;
    for (let k = 0; k < 120 * 4; k++) { Math.random = seeded(100 + k); P.inThr = 0; P.inBrk = v < 5 ? 1 : 0; P.inSteer = 0; r.step(DT); t += DT; if (P.fall) fell = true; minY = Math.min(minY, P.y); }
    Math.random = orig;
    const q = T.query(P.x, P.z, P.q.i, {});
    return { fell, drop: y0 - minY, falls: P.falls || 0, back: Math.abs(q.d) < T.w && Math.abs(P.y - T.elevAt(q.s).y) < 0.5, along: q.s - s, dmg: P.dmg - d0, fin: Number.isFinite(P.x + P.z + P.y) };
  };
  const fast = run(25, 0.35), slow = run(1.8, 0.6);
  check('over the edge: at 90 km/h into the drop the car falls (more than 8 m down), then it is back on the road near where it went over, damaged; at a crawl the edge holds it',
    fast.fell && fast.falls === 1 && fast.drop > 8 && fast.back && Math.abs(fast.along) < 60 && fast.dmg > 0.2 && fast.fin && !slow.fell && !slow.falls && slow.fin,
    `fast: fell ${fast.drop.toFixed(1)} m, back on the road ${fast.back} ${fast.along.toFixed(0)} m on, damage +${fast.dmg.toFixed(2)}; slow: fell ${slow.fell}`);
}

// 5. the ways to drive it (and an online race: always the race)
{
  Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line; online always the race',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5 && !net.timeTrial && net.cars.length === 2,
    'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  Math.random = orig;
}

// 6. a whole race up the gorge on autopilot: every car finishes (the ones that went over the edge too), then pulls up in its own slot past the line
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos), falls = r.cars.reduce((a, c) => a + (c.falls || 0), 0);
  check('race: all 13 cars reach the top', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}, falls over the edge ${falls}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the top, the traffic (cars, vans, motorbikes, a few lorries) keeps moving
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0; const stand = new Map();
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); }
  }
  Math.random = orig;
  const ev = r.tf, kinds = new Set(ev.veh.map(v => v.kind));
  check('duel: both reach the top through the traffic (cars, vans and motorbikes both ways), no vehicle standing for long', r.cars.every(c => c.finished) && standMax < 30 && kinds.has(0) && kinds.has(1) && kinds.has(3),
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, longest stand ${standMax.toFixed(1)} s, ${ev.veh.length} vehicles`);
}

// 8. the run from the police: no checkpoint and no building (as Los Caracoles): the chase from the start, the escape over the finish; on autopilot
//    at the easy level it gets away now and then
{
  const runs = [11, 12, 13].map(seed => {
    Math.random = seeded(3);
    const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, damage: 2, police: true, seed, difficulty: 0 })), P = r.player, pol = r.pol, pc = pol.cars[0];
    const st = { stage: pol.stage, chk: pol.chk, goal: pol.goal, chase: pc && pc.pol.mode === 'chase' };
    r.start();
    let t = 0, k = 0, nan = false;
    while (t < 600 && !P.finished && !pol.busted) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
      if (k % 60 === 0 && !(pol.cars.every(c => Number.isFinite(c.x + c.z)) && Number.isFinite(P.x + P.z))) nan = true;
    }
    Math.random = orig;
    return { seed, st, nan, t, escaped: pol.escaped && !pol.busted && P.finished, busted: !!pol.busted, at: P.q.s - T.startS };
  });
  check('police: the chase from the start (no checkpoint, no building), the escape over the finish; on autopilot at the easy level it gets away now and then',
    runs.every(r => r.st.stage === 'chase' && !r.st.chk && !r.st.goal && r.st.chase && !r.nan && (r.escaped || r.busted)) && runs.some(r => r.escaped),
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m`).join('; '));
}

// 9. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
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
