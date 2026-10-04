// The open road's traffic (Vršič's duel, Race opts.traffic: race.tf): only in the duel with one rival up the open road (and in the run from
// the police); vehicles both ways on their own halves of the road (cars, vans, buses, motorbikes, cyclists at the edge, most of them in
// training groups riding in single file), people on the sidewalks (alone or in groups two abreast, some with a dog on a leash), at the bus
// stops and hikers by the huts, all between the asphalt and the barriers; the same seed, the same traffic. A whole duel on autopilot (both
// cars): both reach the pass, few knocks, nobody on foot run over by the AI, the traffic keeps flowing. The traffic drives calmly (no hard
// braking unless something is right ahead, never sideways, never over 70 km/h on the open road). Someone on foot sees a car coming and runs
// out of its way (off the road when they are on a sidewalk, never onto it); someone hit is run over (never thrown up), lies there dead for
// good with the blood spreading round them, the car barely slowed; a cyclist run over slows the car more, the bicycle knocked a few metres
// away; 5 s in the duel for either. A traffic car waits at a zebra crossing someone walks over; one knocked hard comes loose, slides to a
// stop (and the race car takes damage). The groups keep together as they walk and ride; a dog stays on its leash and sits when its owner
// stands. In the run from the police the traffic pulls over and stops at the edge only for a patrol car in the chase very close, then
// drives on; one 150 m behind changes nothing.
//   node tests/traffic.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'vrsic'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 1, playerGrid: 2, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, damage: 2, traffic: true }, o);
const polOpts = { police: true, traffic: false, numAI: 0, playerGrid: 1 };
const finite = (tf) => tf.veh.every(v => Number.isFinite(v.x + v.z + v.s + v.d + v.v)) && tf.ped.every(p => Number.isFinite(p.x + p.z + p.s + p.d));
const bar = (s, d) => { const i = T.idx(s); return d > 0 ? T.br[i] : T.bl[i]; };   // (the barrier on that side, m from the middle)
const evs = (tf, n0, k) => tf.log.filter(e => e.n > n0 && (!k || e.k === k));   // (the traffic's events since n0)
// a fresh duel with the race under way; the rival (and, unless kept, the player) moved far up the road, out of the way
function duel(o, keep) {
  Math.random = seeded(3);
  const r = new C.Race(T, opts(o)); r.start();
  if (!keep) for (const c of r.cars) { const i = T.idx(T.finishS - 150), d = c.isPlayer ? -2 : 2; c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i]); c.y = c.py = c.roadY = T.hy[i]; c.q = T.query(c.x, c.z, i, c.q); c.locked = true; }
  return r;
}
// the player's car put at s (m after the start line), d across the road, driving up it at v
function put(r, s, d, v) {
  const P = r.player, i = T.idx(T.startS + s); P.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i]); P.y = P.py = P.roadY = T.hy[i];
  P.vx = T.tx[i] * v; P.vz = T.tz[i] * v; P.vl = v; P.locked = false; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; return P;
}
// any car (a patrol car too) put at the absolute road position s, d across it, driving up it at v
function putC(c, s, d, v) { const i = T.idx(s); c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i]); c.y = c.py = c.roadY = T.hy[i]; c.vx = T.tx[i] * v; c.vz = T.tz[i] * v; c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s; c.dist = c.q.s - T.startS; }
// hold the player's car on a line d across the road at about vT (m/s): steering at a point 14 m ahead on it
function drive(P, d, vT) {
  const i = T.idx(P.q.s + 14), tx = T.px[i] + T.nx[i] * d, tz = T.pz[i] + T.nz[i] * d, ch = Math.cos(P.h), sh = Math.sin(P.h), dx = tx - P.x, dz = tz - P.z;
  const lx = dx * ch + dz * sh, ly = -dx * sh + dz * ch, kap = 2 * Math.sin(Math.atan2(ly, lx)) / Math.max(3, Math.hypot(lx, ly));
  P.inSteer = Math.max(-1, Math.min(1, kap * 9)); P.inThr = P.speed < vT ? 1 : 0; P.inBrk = P.speed > vT + 2 ? 0.4 : 0; P.inHand = 0;
}
const orig = Math.random;

// 1. only where it belongs: the duel (and the run from the police) up the open road; never in the race, the time trial, the title demo or on a circuit
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({})), race = new C.Race(T, opts({ traffic: false, numAI: 12, playerGrid: 12 })), tt = new C.Race(T, opts({ tt: true })), demo = new C.Race(T, opts({ noPlayer: true }));
  const circ = new C.Race(new C.Track(C.TRACKS.find(x => x.id === 'jezero')), opts({}));
  check('only in the duel on the open road: the player and one rival, the traffic and the people (race.tf); not in the race, the time trial, the demo, on a circuit',
    d.tf && d.cars.length === 2 && d.cars.filter(c => c.isPlayer).length === 1 && !race.tf && !tt.tf && !demo.tf && !circ.tf, `${d.cars.length} cars, ${d.tf ? d.tf.veh.length : 0} vehicles, ${d.tf ? d.tf.ped.length : 0} people`);
  const tf = d.tf, up = tf.veh.filter(v => v.dir > 0), dn = tf.veh.filter(v => v.dir < 0), kinds = [0, 1, 2, 3, 4].map(k => tf.veh.filter(v => v.kind === k).length);
  const sides = tf.veh.every(v => v.kind === 4 ? Math.abs(v.d - v.dir * (T.w - 0.7)) < 0.01 : v.d * v.dir > 1.5 && Math.abs(v.d) < T.w - 0.8);
  check('the traffic: vehicles both ways (uphill on the right half, downhill on the left), cars, vans, buses, motorbikes, cyclists at the edge of their side',
    up.length >= 25 && dn.length >= 25 && kinds.every(k => k > 0) && sides, `${up.length} up, ${dn.length} down; cars ${kinds[0]}, vans ${kinds[1]}, buses ${kinds[2]}, motorbikes ${kinds[3]}, bicycles ${kinds[4]}`);
  const walkers = tf.ped.filter(p => p.st === 'walk' && !p.hike), onWalk = walkers.every(p => Math.abs(p.d) > T.w + 0.3), stops = tf.ped.filter(p => p.st === 'stop').length, hikers = tf.ped.filter(p => p.hike).length;
  check('the people: walkers on the sidewalks (off the asphalt), people at the bus stops, hikers by the huts; the zebra crossings',
    walkers.length >= 60 && onWalk && stops >= 12 && hikers >= 20 && tf.zeb.length === 5, `${walkers.length} on the sidewalks, ${stops} at the bus stops, ${hikers} hikers, ${tf.zeb.length} zebras`);
  // the cyclists: training groups of 3-7 in single file (the same line at the edge, one bicycle length and a little behind each other; the ones
  // behind a little keener, so they keep up), a quarter of them or so alone
  const groups = [...new Set(tf.veh.filter(v => v.grp).map(v => v.grp))], solo = tf.veh.filter(v => v.kind === 4 && !v.grp).length;
  const file = groups.every(g => g.m.length >= 3 && g.m.length <= 7 && g.m.every((v, i) => v.kind === 4 && v.dir === g.m[0].dir && Math.abs(v.d - g.m[0].d) < 0.01 && v.v0 >= g.m[0].v0 - 1e-9 &&
    (!i || Math.abs((g.m[i - 1].s - v.s) * v.dir - 2.6) < 0.05)));
  check('the cyclists: training groups of 3-7 riding in single file (one behind the other at the edge), some alone',
    groups.length >= 6 && file && solo >= 1 && solo < groups.length, `${groups.length} groups (${groups.map(g => g.m.length).join(',')}), ${solo} alone`);
  // the people walking together: groups of 2-8, two abreast (a pair side by side in each row, the rows ~0.95 m apart), about a third alone;
  // everyone off the asphalt and inside the barriers (the road 30 % wider, the barriers where they were: ~1.45 m at the least)
  const pg = tf.grp, alone = tf.ped.filter(p => p.st === 'walk' && !p.grp).length;
  const abreast = pg.every(g => g.m.length >= 2 && g.m.length <= 8 && g.m.every((p, i) => p.row === i >> 1 && p.col === (i & 1) && Math.abs(p.s - (g.s - g.pdir * p.row * 0.95)) < 0.01 &&
    (!(i & 1) || (Math.abs(p.s - g.m[i - 1].s) < 0.01 && Math.abs(Math.abs(p.d) - Math.abs(g.m[i - 1].d)) > 0.25 && Math.abs(Math.abs(p.d) - Math.abs(g.m[i - 1].d)) < 1.0))));
  const inside = tf.ped.every(p => Math.abs(p.d) > T.w + 0.25 && Math.abs(p.d) < bar(p.s, p.d) - 0.3), sizes = {}; for (const g of pg) sizes[g.m.length] = (sizes[g.m.length] || 0) + 1;
  check('the people: groups of 2-8 walking two abreast (rows ~0.95 m apart), about a third alone; all between the asphalt and the barriers',
    pg.length >= 25 && abreast && alone / (alone + pg.length) > 0.2 && alone / (alone + pg.length) < 0.5 && inside && Object.keys(sizes).some(k => +k >= 5),
    `${pg.length} groups (sizes ${JSON.stringify(sizes)}), ${alone} alone; inside the barriers ${inside}`);
  const dogs = tf.ped.filter(p => p.dog);
  check('some walk a dog on a leash (a grown-up local or hiker, the dog beside them)', dogs.length >= 3 && dogs.every(p => p.kind !== 2 && p.kind !== 3 && Math.hypot(p.dog.x - p.x, p.dog.z - p.z) < 1.8),
    `${dogs.length} dogs (${dogs.filter(p => p.hike).length} with hikers)`);
  Math.random = orig;
}

// 2. the same seed, the same traffic (its own random numbers); another seed, other traffic
{
  const run = (seed) => { Math.random = seeded(3); const r = new C.Race(T, opts({ seed })); r.start(); for (let k = 0; k < 120 * 20; k++) { Math.random = seeded(100 + k); C.aiControl(r.player, r, DT); r.step(DT); } Math.random = orig;
    return r.tf.veh.map(v => v.s.toFixed(3) + ':' + v.d.toFixed(3)).join(',') + '|' + r.tf.ped.map(p => p.s.toFixed(3) + ':' + p.d.toFixed(3)).join(','); };
  const a = run(11), b = run(11), c = run(12);
  check('the same seed gives the same traffic after 20 s; another seed other traffic', a === b && a !== c, `${a.length} chars of state`);
}

// 3. a whole duel on autopilot (both cars): both reach the pass, few knocks, nobody on foot run over, the traffic flowing
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player, tf = r.tf; r.start();
  let t = 0, k = 0, ev = 0, resc = 0, still = new Map(), maxStill = 0, bad2 = false;
  const hits = { ped: 0, bike: 0, crash: 0 };
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (tf.ev !== ev) { for (const e of evs(tf, ev)) hits[e.k]++; ev = tf.ev; }
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    if (k % 12 === 0) { for (const v of tf.veh) { const near = r.cars.some(c => Math.abs(c.q.s - v.s) < 300); const st = !v.off && v.st === 0 && v.v < 0.3 && near ? (still.get(v) || 0) + 0.1 : 0; still.set(v, st); maxStill = Math.max(maxStill, st); }
      if (!finite(tf)) bad2 = true; }
  }
  Math.random = orig;
  const R = r.cars.find(c => !c.isPlayer);
  check('a whole duel on autopilot: both reach the pass (at most a minute apart), the player never rescued', P.finished && R.finished && Math.abs(P.finishTime - R.finishTime) < 60 && t < 600 && !resc,
    `player ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s, rival ${R.finishTime ? R.finishTime.toFixed(1) : '-'} s, rescues ${resc}`);
  check('the duel: few knocks with the traffic, nobody on foot run over, no penalty for the rival', hits.crash <= 8 && hits.ped === 0 && !(R.tfPen > 0), `${hits.crash} knocks, ${hits.ped} people, ${hits.bike} cyclists; penalties player ${P.tfPen || 0} s, rival ${R.tfPen || 0} s`);
  check('the traffic keeps flowing near the race (no vehicle stuck for long), every position finite', maxStill < 30 && !bad2, `longest standing ${maxStill.toFixed(1)} s`);
}

// 3b. calm driving: the run from the police on autopilot for 120 s, the vehicles within 150 m of the player: no braking harder than 4 m/s^2
//     unless something is within 6 m ahead of it, never sideways (the sideways speed under 0.2 x its speed, but going round something),
//     never over 70 km/h on the open road (95 % of the time under 60); some pull over for the patrol cars and stop at the edge
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts(polOpts)), P = r.player, tf = r.tf; r.start();
  let n = 0, hard = 0, side = 0, vmax = 0, yl = new Set(), edge = 0; const vs = [], ex = [];
  for (let k = 0; k < 120 * 120; k++) {
    Math.random = seeded(5000 + k); C.aiControl(P, r, DT); r.step(DT);
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 6) continue;
    for (const v of tf.veh) {
      if (v.off || v.st || Math.abs(v.s - P.q.s) > 150) continue;
      n++;
      if (v.acc < -4 && v.gap > 6) { hard++; if (ex.length < 3) ex.push(`kind ${v.kind} ${v.acc.toFixed(1)} m/s^2 gap ${v.gap.toFixed(0)} m`); }
      if (v.v > 4 && !v.pass && Math.abs(v.sv) > 0.2 * v.v) side++;
      const i = T.idx(v.s); if (!(T.walk[0][i] > 0.5 || T.walk[1][i] > 0.5)) { vmax = Math.max(vmax, v.v); vs.push(v.v); }
      if (v.yl) yl.add(v); if (v.yl === 1 && v.v < 0.3 && Math.abs(v.d) > T.w - v.wid / 2 - 0.5) edge++;
    }
  }
  Math.random = orig; vs.sort((a, b) => a - b);
  const p95 = vs[Math.floor(vs.length * 0.95)];
  check('calm driving (the run from the police, autopilot, 120 s): no hard braking unless something is right ahead, never sideways, never over 70 km/h on the open road; some pull over and stop at the edge for the police',
    n > 2000 && !hard && !side && vmax < 19.5 && p95 < 60 / 3.6 && yl.size >= 3 && edge > 0,
    `${n} samples: hard braking ${hard} ${ex.join('; ')}, sideways ${side}, top ${(vmax * 3.6).toFixed(0)} km/h (95 % under ${(p95 * 3.6).toFixed(0)}), ${yl.size} pulled over, ${edge} samples stopped at the edge`);
}

// 4. someone on foot: sees a car coming at them and runs out of its way; on a sidewalk away from the road (never onto it)
{
  const r = duel({}), tf = r.tf, P = r.player;
  const p = tf.ped.find(q => q.st === 'walk' && !q.hike && !q.grp && q.side > 0 && q.s - T.startS > 300 && q.s - T.startS < 900);
  p.st = 'stop'; p.a0 = p.a1 = p.s; p.d = T.w + 0.6; tf._pedPose(p);   // (standing on the sidewalk by the kerb)
  put(r, p.s - T.startS - 60, T.w - 1, 20);
  let minD = 1e9, fled = false;
  for (let k = 0; k < 120 * 3.5; k++) { drive(P, T.w - 1, 20); r.step(DT); if (p.st === 'flee') fled = true; if (fled) minD = Math.min(minD, Math.abs(p.d)); }
  check('someone on the sidewalk with a car coming along the kerb runs off, away from the road (never onto the asphalt)', fled && minD > T.w - 0.05 && Math.abs(p.d) > T.w + 1.5 && p.st !== 'hit' && p.st !== 'dead',
    `ran to ${p.d.toFixed(1)} m (the asphalt ends at ${T.w} m), nearest the road ${minD.toFixed(2)} m, now ${p.st}`);
  // on the road (over a zebra crossing): out of the car's path, to the side they are on of its line
  const r2 = duel({}), tf2 = r2.tf, P2 = r2.player, q = tf2.ped.find(x => x.st === 'walk' && !x.hike && !x.grp && x.s - T.startS > 300 && x.s - T.startS < 900);
  q.st = 'cross'; q.t = 0; q.d = 1.2; q.dT = -T.w - 1; q.a0 = q.a1 = q.s; tf2._pedPose(q);
  put(r2, q.s - T.startS - 55, 0.2, 20);
  let hit = false, side = 0;
  for (let k = 0; k < 120 * 3; k++) { P2.inThr = 0.3; P2.inBrk = 0; P2.inSteer = 0; P2.steer = 0; r2.step(DT); if (q.st === 'hit' || q.st === 'dead') hit = true; if (q.st === 'flee' && !side) side = q.fsd; }
  check('someone crossing the road with a car coming at them runs out of its path, to their side of its line, and is not hit', side === 1 && !hit && q.d > 0.2 + 1.3,
    `ran to ${q.d.toFixed(1)} m (the car at 0.2 m), way ${side}, ${hit ? 'hit' : 'not hit'}`);
}

// 5. someone hit: run over (shoved along the road under the car, never thrown up), lying there dead for good (never up again, not when the
//    cars are far away either), the blood spreading round them (~0.1 m to ~1 m in ~9 s); the car loses a little speed (~0.06 v + 0.4 m/s);
//    nobody is hit twice; the traffic stops for the body, the AI's corridor goes round it; the duel's 5 s. A cyclist run over: the car loses
//    more (~0.15 v + 1 m/s) and its front a little damage, the rider dead on the road, the bicycle a few metres away
{
  const r = duel({}), tf = r.tf, P = r.player;
  const p = tf.ped.find(q => q.st === 'walk' && !q.hike && !q.grp && q.s - T.startS > 300 && q.s - T.startS < 900);
  p.st = 'stand'; p.t = -99; p.d = 0; p.re = 5; p.a0 = p.a1 = p.s; tf._pedPose(p);   // (standing on the road, looking the other way)
  for (const v of tf.veh) if (Math.abs(v.s - p.s) < 150) v.off = true;
  put(r, p.s - T.startS - 6, 0, 18);
  const seen = new Set(), x0 = p.x, z0 = p.z; let ev = null, vPrev = 0, vHit = 0, yUp = 0, dv = 0, bl1 = 0, bl2 = 0, tDead = -1, t = 0;
  for (let k = 0; k < 120 * 12; k++) {
    P.inThr = 0; P.inBrk = ev ? 1 : 0; P.inSteer = 0; vPrev = P.speed; r.step(DT); t += DT; seen.add(p.st);
    yUp = Math.max(yUp, p.y - T.elevAt(p.s).y);
    if (!ev && tf.log.length) { ev = tf.log[0]; dv = vPrev - P.speed; vHit = vPrev; }
    if (p.st === 'dead' && tDead < 0) tDead = t; if (tDead > 0 && !bl1 && t - tDead > 2) bl1 = p.bl;
  }
  bl2 = p.bl;
  const lie = Math.hypot(p.x - x0, p.z - z0), still = { s: p.s, d: p.d }, n0 = tf.ev;
  for (const c of r.cars) { c.locked = true; putC(c, T.startS + 2500, c.isPlayer ? -2 : 2, 0); }   // (the race far away: out of sight)
  for (let k = 0; k < 120 * 3; k++) r.step(DT);
  const stays = p.st === 'dead' && Math.abs(p.s - still.s) < 1e-6 && Math.abs(p.d - still.d) < 1e-6 && tf.onRoad.includes(p);
  check('someone hit is run over: never thrown up, shoved a little along the road and lying there dead for good (also once the race is far away); the game hears of it once',
    ev && ev.k === 'ped' && ev.c === P && tf.ev === 1 && seen.has('hit') && seen.has('dead') && !seen.has('fly') && !seen.has('down') && !seen.has('up') && yUp < 0.05 && lie > 0.3 && lie < 8 && stays && tf.ev === n0,
    `states ${[...seen].join(' > ')}, ${tf.ev} event(s) (${ev ? ev.k : '-'}), highest ${yUp.toFixed(2)} m off the road, lies ${lie.toFixed(1)} m from where it was hit, still dead far away ${stays}`);
  const dvT = 0.06 * vHit + 0.4;
  check('running someone over: the car barely slowed (~0.06 v + 0.4 m/s), the blood spreads round them (~1 m in ~9 s)', dv > 0.7 * dvT && dv < 1.4 * dvT && bl1 > 0.3 && bl1 < bl2 && bl2 > 0.85 && bl2 < 1.45 && P.dmg === 0,
    `slowed ${dv.toFixed(2)} m/s at ${vHit.toFixed(1)} m/s (about ${dvT.toFixed(2)}), blood ${bl1.toFixed(2)} m after 2 s, ${bl2.toFixed(2)} m now, car damage ${P.dmg.toFixed(2)}`);
  check('the duel: 5 s for running someone over', P.tfPen === 5, `penalty ${P.tfPen || 0} s`);
  // the body on the road (moved over into the uphill lane): a traffic car coming up its lane stops short of it and then drives round it; the
  // AI's corridor keeps clear of it; a car driving over it does not hit them again
  const v = tf.veh.find(x => x.kind === 0 && x.dir > 0 && !x.off); for (const o of tf.veh) if (o !== v && Math.abs(o.s - p.s) < 200) o.off = true;
  p.d = tf._lane(v); tf._pedPose(p);
  v.s = p.s - 60; v.d = v.dT = p.d; v.v = 12; v.st = 0; v.pass = null; v.yl = 0; v.sv = 0; tf._pose(v, 0);
  let minG = 1e9, waited = false; for (let k = 0; k < 120 * 14; k++) { r.step(DT); const g = p.s - v.s - v.len / 2; if (g > 0 && Math.abs(v.d - p.d) < 1.5) minG = Math.min(minG, g); if (v.v < 0.1 && g > 0) waited = true; }
  P.locked = false; putC(P, p.s - 40, p.d, 15); const out = {}; tf.aiPlan(P, 15, out); const clear = out.hi < p.d - 0.6 - P.m.wid / 2 || out.lo > p.d + 0.6 + P.m.wid / 2;
  const past = v.s - p.s; v.off = true; putC(P, p.s - 3, p.d, 6); const n1 = tf.ev; for (let k = 0; k < 120 * 2; k++) { P.inThr = 0.3; P.inBrk = 0; P.inSteer = 0; r.step(DT); }
  check('the body on the road: the traffic stops short of it and drives round it, the AI\'s corridor goes round it, a car over it does not hit them again',
    waited && minG > 1.5 && past > 5 && clear && tf.ev === n1 && p.st === 'dead', `the car stopped ${minG.toFixed(1)} m short, then ${past.toFixed(0)} m past; corridor ${out.lo.toFixed(1)}..${out.hi.toFixed(1)} m (the body at ${p.d.toFixed(1)} m); ${tf.ev - n1} more events ${evs(tf, n1).map(e => e.k).join(',')}`);
  // a cyclist run over (the last of a group, or one alone): the rider dead on the road, the bicycle knocked a few metres away and lying there;
  // the car slowed more than by someone on foot, its front a little damaged; 5 s more
  const r2 = duel({}), tf2 = r2.tf, P2 = r2.player, b = tf2.veh.find(x => x.kind === 4 && x.dir > 0 && (!x.grp || x.grp.m[x.grp.m.length - 1] === x) && x.s - T.startS > 2500 && x.s - T.startS < 9000);
  for (const o of tf2.veh) if (o !== b && Math.abs(o.s - b.s) < 60) o.off = true;
  put(r2, b.s - T.startS - 7, b.d, 18);
  let evB = null, dvB = 0, vB = 0; for (let k = 0; k < 120 * 6; k++) { P2.inThr = 0; P2.inBrk = evB ? 1 : 0; P2.inSteer = 0; P2.steer = 0; const v0 = P2.speed; r2.step(DT); if (!evB && tf2.log.length) { evB = tf2.log[0]; dvB = v0 - P2.speed; vB = v0; } }
  const rider = b.rider, apart = rider ? Math.hypot(b.x - rider.x, b.z - rider.z) : 0, dvBT = 0.15 * vB + 1;
  check('a cyclist run over: the rider dead on the road, the bicycle knocked a few metres away and lying there; 5 s in the duel',
    evB && evB.k === 'bike' && evB.c === P2 && b.st === 2 && rider && rider.kind === 3 && rider.st === 'dead' && apart > 1.5 && apart < 14 && P2.tfPen === 5 && tf2.ev === 1,
    `event ${evB ? evB.k : '-'}, bicycle ${b.st} ${apart.toFixed(1)} m from the rider (${rider ? rider.st : '-'}), penalty ${P2.tfPen || 0} s`);
  check('the cyclist slows the car more than someone on foot (~0.15 v + 1 m/s) and damages its front a little', dvB > 1.5 * dv && dvB > 0.6 * dvBT && dvB < 1.5 * dvBT && P2.dmg > 0.01 && P2.dmg < 0.1,
    `slowed ${dvB.toFixed(2)} m/s at ${vB.toFixed(1)} m/s (someone on foot: ${dv.toFixed(2)} at ${vHit.toFixed(1)}), damage ${P2.dmg.toFixed(3)}`);
}

// 6. a traffic car waits at a zebra crossing someone walks over, then drives on
{
  const r = duel({}, true), tf = r.tf, z = tf.zeb[3], P = r.player;
  for (const c of r.cars) c.locked = true;
  put(r, z.s - T.startS - 200, -3, 0); P.locked = true; P.vx = P.vz = 0;   // (standing well below, so the people nearby move)
  for (const v of tf.veh) if (Math.abs(v.s - z.s) < 90) v.off = true;
  const v = tf.veh.find(x => x.kind === 0 && x.dir > 0 && !x.off); v.s = z.s - 45; v.d = v.dT = tf._lane(v); v.v = 12; v.pass = null; v.st = 0; tf._pose(v, 0);
  const p = tf.ped.find(q => q.st === 'walk' && !q.hike && !q.grp); p.s = z.s; p.side = -1; p.st = 'cross'; p.zi = 3; z.busy++; p.d = -T.w - 0.3; p.dT = T.w + 1; p.a0 = z.s - 20; p.a1 = z.s + 20; tf._pedPose(p);
  let minGap = 1e9, stopped = false;
  for (let k = 0; k < 120 * 26; k++) { r.step(DT); if (p.st === 'cross') { minGap = Math.min(minGap, z.s - v.s - v.len / 2); if (v.v < 0.2) stopped = true; } }
  check('a traffic car stops before a zebra crossing while someone walks over it, then drives on', stopped && minGap > 1 && p.st === 'walk' && v.s > z.s + 20,
    `nearest ${minGap.toFixed(1)} m before the crossing, the person ${p.st}, the car ${(v.s - z.s).toFixed(0)} m past it`);
}

// 7. a traffic car knocked hard comes loose, slides to a stop; the race car takes damage (a knock the game hears of)
{
  const r = duel({}), tf = r.tf, P = r.player, v = tf.veh.find(x => x.kind === 0 && x.dir > 0 && x.s - T.startS > 2500 && x.s - T.startS < 6000);
  put(r, v.s - T.startS - 9, v.d, v.v + 16);
  let ev = null; for (let k = 0; k < 120 * 1; k++) { P.inThr = 1; P.inBrk = 0; P.inSteer = 0; P.steer = 0; r.step(DT); if (!ev && tf.ev) ev = tf.evK; }
  const loose = v.st > 0; for (let k = 0; k < 120 * 8; k++) { P.inThr = 0; P.inBrk = 1; r.step(DT); }
  check('a traffic car knocked hard comes loose and slides to a stop; the race car is damaged; the game hears of the knock', loose && v.st === 2 && P.dmg > 0 && ev === 'crash',
    `vehicle ${v.st}, car damage ${P.dmg.toFixed(2)}, event ${ev}`);
}

// 8. the groups as they go (the duel, the player standing in Kranjska Gora, 40 s): the people walking together keep two abreast (a pair side
//    by side, the rows close behind each other; turning round at the end of their stretch, the rows the other way round), the cyclists
//    ride on in single file close behind each other; a dog keeps on its leash beside its owner and sits once its owner stands
{
  const r = duel({}), tf = r.tf, P = r.player;
  put(r, 450, -T.w + 1.2, 0); P.locked = true;
  let rows = 0, rowBad = 0, file = 0, fileBad = 0, leash = 0, ex = []; const turned = new Set(), flip0 = new Map(tf.grp.map(g => [g, g.flip]));
  const near = tf.grp.filter(g => Math.abs(g.s - P.q.s) < 400), tg = near.find(g => g.m.length >= 4);   // (one of them 3 m short of the end of its stretch: it turns round)
  if (tg.pdir > 0) tg.a1 = tg.s + 3; else tg.a0 = tg.s - 3;
  for (let k = 0; k < 120 * 40; k++) {
    r.step(DT); if (k % 30) continue;
    for (const g of near) { if (!g.m.every(p => p.st === 'walk') || g.m.length < 2) continue; if (g.flip !== flip0.get(g)) turned.add(g);
      for (let i = 1; i < g.m.length; i += 2) { const a = g.m[i - 1], b = g.m[i]; rows++; const dd = Math.abs(Math.abs(b.d) - Math.abs(a.d)); if (Math.abs(a.s - b.s) > 0.5 || dd < 0.25 || dd > 1.0) { rowBad++; if (ex.length < 3) ex.push(`row ds ${(a.s - b.s).toFixed(2)} dd ${dd.toFixed(2)}`); } }
      for (let i = 2; i < g.m.length; i += 2) { const a = g.m[i - 2], b = g.m[i]; rows++; if (Math.abs(Math.abs(a.s - b.s) - 0.95) > 0.5) { rowBad++; if (ex.length < 3) ex.push(`rows ${Math.abs(a.s - b.s).toFixed(2)} m apart`); } } }
    for (const v of tf.veh) { if (!v.grp || v.gi || v.off || v.st || !v.grp.m.every(o => !o.off && o.st === 0)) continue; const m = v.grp.m;   // (close: 3.5 m between the wheels at most, or 0.6 s at their speed)
      for (let i = 1; i < m.length; i++) { file++; const gap = (m[i - 1].s - m[i].s) * v.dir - 1.8; if (Math.abs(m[i].d - m[i - 1].d) > 0.05 || gap < 0.2 || gap > Math.max(3.5, 0.6 * m[i].v)) { fileBad++; if (ex.length < 5) ex.push(`file gap ${gap.toFixed(2)} at ${m[i].v.toFixed(1)} m/s`); } } }
    for (const p of tf.ped) if (p.dog && !p.off && Math.abs(p.s - P.q.s) < 420 && Math.hypot(p.dog.x - p.x, p.dog.z - p.z) > 1.75) leash++;
  }
  check('the groups as they go: people two abreast in close rows (turning round at the ends of their stretch), cyclists in single file close behind each other',
    rows > 200 && rowBad / rows < 0.02 && file > 200 && fileBad / file < 0.02 && turned.has(tg), `${rows} row checks (${rowBad} off), ${file} file checks (${fileBad} off), ${turned.size} groups turned round; ${ex.join('; ')}`);
  const o = tf.ped.find(p => p.dog && Math.abs(p.s - P.q.s) < 400) || tf.ped.find(p => p.dog);
  o.st = 'stop'; o.a0 = o.a1 = o.s; if (o.grp) tf._ungroup(o); for (let k = 0; k < 120 * 3; k++) r.step(DT);
  check('a dog on its leash: always within the leash of its owner; it sits once its owner stands', !leash && o.dog.sit > 0.9 && Math.hypot(o.dog.x - o.x, o.dog.z - o.z) < 1.75,
    `${leash} times off the leash; standing: sits ${o.dog.sit.toFixed(2)}, ${Math.hypot(o.dog.x - o.x, o.dog.z - o.z).toFixed(2)} m away`);
}

// 9. the run from the police: a traffic car with a patrol car in the chase coming up from 120 m behind fast indicates, pulls over to the edge of
//    its side and stops there (before the patrol car is by, or within 1.5 s after), braking gently; once it has gone by, it indicates the
//    other way and pulls back into its lane, above 8 m/s within 10 s. A patrol car 150 m behind changes nothing; in the duel nobody pulls over
{
  const scene = (back, vP, kind) => {
    Math.random = seeded(3); const r = new C.Race(T, opts(polOpts)); r.start(); const P = r.player, pol = r.pol, tf = r.tf, s0 = T.startS + 4600;
    for (const v of tf.veh) if (Math.abs(v.s - s0) < 600) v.off = true;
    for (const c of pol.cars) putC(c, s0 - 900, 2, 0);
    const v = tf.veh.find(x => x.kind === kind && x.dir === 1 && !x.grp); v.off = false; v.st = 0; v.s = s0; v.d = v.dT = tf._lane(v); v.v = 14; v.sv = 0; v.yl = 0; tf._pose(v, 0);
    putC(P, s0 + 350, 1.5, 0); P.locked = true;
    const c = pol._car(s0 - back, 2, 0, 'chase', 0); c.locked = false; c.vx = Math.cos(c.h) * vP; c.vz = Math.sin(c.h) * vP;
    return { r, v, c, tf };
  };
  const { r, v, c, tf } = scene(120, 30, 0); let t = 0, tPass = null, tAt = null, tBack = null, indIn = true, indOut = false, accMin = 0;
  for (let k = 0; k < 120 * 20; k++) { Math.random = seeded(9000 + k); r.step(DT); t += DT;
    if (tPass == null && c.q.s > v.s) tPass = t;
    if (v.yl === 1 && v.ind !== 1) indIn = false; if (v.yl === 2 && v.ind === -1) indOut = true; if (v.yl) accMin = Math.min(accMin, v.acc);
    if (tAt == null && Math.abs(v.d) > T.w - v.wid / 2 - 0.5 && v.v < 0.3) tAt = t;
    if (tAt != null && tBack == null && Math.abs(v.d - tf._lane(v)) < 0.5 && v.v > 8) tBack = t; }
  Math.random = orig;
  check('the run from the police: a patrol car in the chase coming up fast from 120 m behind: the car indicates, pulls over to the edge and stops (by the time it passes, or within 1.5 s), gently',
    tPass != null && tAt != null && tAt < tPass + 1.5 && indIn && accMin > -4, `the patrol car by after ${tPass != null ? tPass.toFixed(1) : '-'} s, stopped at the edge after ${tAt != null ? tAt.toFixed(1) : '-'} s, braking ${accMin.toFixed(1)} m/s^2 at most`);
  check('... once it has gone by: indicates the other way, back into its lane and above 8 m/s within 10 s', tBack != null && tBack < tPass + 10 && indOut && v.yl === 0,
    `back at speed in its lane ${tBack != null ? (tBack - tPass).toFixed(1) + ' s after it went by' : 'never'}`);
  const B = scene(150, 14, 0); let calm = true;
  for (let k = 0; k < 120 * 1.5; k++) { Math.random = seeded(9500 + k); B.r.step(DT); if (B.v.yl || Math.abs(B.v.d - B.tf._lane(B.v)) > 0.05) calm = false; }
  Math.random = orig;
  const D = duel({}); let dy = 0; for (let k = 0; k < 120 * 10; k++) { Math.random = seeded(9700 + k); C.aiControl(D.player, D, DT); D.step(DT); for (const v of D.tf.veh) if (v.yl) dy++; }
  Math.random = orig;
  check('a patrol car 150 m behind: the car drives on as it was; in the duel (no police) nobody pulls over', calm && !dy, `150 m behind: ${calm ? 'no reaction' : 'pulled over'}, ${(B.c.q.s - B.v.s).toFixed(0)} m behind after 1.5 s; the duel ${dy}`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
