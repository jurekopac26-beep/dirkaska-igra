// The open road's traffic (Vršič's duel, Race opts.traffic: race.tf): only in the duel with one rival up the open road (and in the run from
// the police); vehicles both ways on their own halves of the road (cars, vans, buses, motorbikes, cyclists at the edge), people on the
// sidewalks, at the bus stops and hikers by the huts; the same seed, the same traffic. A whole duel on autopilot (both cars): both reach the
// pass, few knocks, nobody on foot knocked down by the AI, the traffic keeps flowing (never stuck for long). Someone on foot sees a car
// coming and runs out of its way (off the road when they are on a sidewalk, never onto it); one hit is thrown, lands, lies there, gets up
// and walks on; knocking down someone on foot or a cyclist costs 5 s in the duel. A traffic car waits at a zebra crossing someone walks
// over; one knocked hard comes loose, slides to a stop (and the race car takes damage); a cyclist knocked falls off.
//   node tests/traffic.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'vrsic'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 1, playerGrid: 2, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, damage: 2, traffic: true }, o);
const finite = (tf) => tf.veh.every(v => Number.isFinite(v.x + v.z + v.s + v.d + v.v)) && tf.ped.every(p => Number.isFinite(p.x + p.z + p.s + p.d));
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
  Math.random = orig;
}

// 2. the same seed, the same traffic (its own random numbers); another seed, other traffic
{
  const run = (seed) => { Math.random = seeded(3); const r = new C.Race(T, opts({ seed })); r.start(); for (let k = 0; k < 120 * 20; k++) { Math.random = seeded(100 + k); C.aiControl(r.player, r, DT); r.step(DT); } Math.random = orig;
    return r.tf.veh.map(v => v.s.toFixed(3) + ':' + v.d.toFixed(3)).join(',') + '|' + r.tf.ped.map(p => p.s.toFixed(3) + ':' + p.d.toFixed(3)).join(','); };
  const a = run(11), b = run(11), c = run(12);
  check('the same seed gives the same traffic after 20 s; another seed other traffic', a === b && a !== c, `${a.length} chars of state`);
}

// 3. a whole duel on autopilot (both cars): both reach the pass, few knocks, nobody on foot knocked down, the traffic flowing
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player, tf = r.tf; r.start();
  let t = 0, k = 0, ev = 0, resc = 0, still = new Map(), maxStill = 0, bad2 = false;
  const hits = { ped: 0, bike: 0, crash: 0 };
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (tf.ev !== ev) { ev = tf.ev; hits[tf.evK]++; }
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    if (k % 12 === 0) { for (const v of tf.veh) { const near = r.cars.some(c => Math.abs(c.q.s - v.s) < 300); const st = !v.off && v.st === 0 && v.v < 0.3 && near ? (still.get(v) || 0) + 0.1 : 0; still.set(v, st); maxStill = Math.max(maxStill, st); }
      if (!finite(tf)) bad2 = true; }
  }
  Math.random = orig;
  const R = r.cars.find(c => !c.isPlayer);
  check('a whole duel on autopilot: both reach the pass (at most a minute apart), the player never rescued', P.finished && R.finished && Math.abs(P.finishTime - R.finishTime) < 60 && t < 600 && !resc,
    `player ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s, rival ${R.finishTime ? R.finishTime.toFixed(1) : '-'} s, rescues ${resc}`);
  check('the duel: few knocks with the traffic, nobody on foot knocked down, no penalty for the rival', hits.crash <= 8 && hits.ped === 0 && !(R.tfPen > 0), `${hits.crash} knocks, ${hits.ped} people, ${hits.bike} cyclists; penalties player ${P.tfPen || 0} s, rival ${R.tfPen || 0} s`);
  check('the traffic keeps flowing near the race (no vehicle stuck for long), every position finite', maxStill < 30 && !bad2, `longest standing ${maxStill.toFixed(1)} s`);
}

// 4. someone on foot: sees a car coming at them and runs out of its way; on a sidewalk away from the road (never onto it)
{
  const r = duel({}), tf = r.tf, P = r.player;
  const p = tf.ped.find(q => q.st === 'walk' && !q.hike && q.side > 0 && q.s - T.startS > 300 && q.s - T.startS < 900);
  p.st = 'stop'; p.a0 = p.a1 = p.s; p.d = T.w + 0.6; tf._pedPose(p);   // (standing on the sidewalk by the kerb)
  put(r, p.s - T.startS - 60, T.w - 1, 20);
  let minD = 1e9, fled = false;
  for (let k = 0; k < 120 * 3.5; k++) { drive(P, T.w - 1, 20); r.step(DT); if (p.st === 'flee') fled = true; if (fled) minD = Math.min(minD, Math.abs(p.d)); }
  check('someone on the sidewalk with a car coming along the kerb runs off, away from the road (never onto the asphalt)', fled && minD > T.w - 0.05 && Math.abs(p.d) > T.w + 1.5 && p.st !== 'fly',
    `ran to ${p.d.toFixed(1)} m (the asphalt ends at ${T.w} m), nearest the road ${minD.toFixed(2)} m, now ${p.st}`);
  // on the road (over a zebra crossing): out of the car's path, to the side they are on of its line
  const r2 = duel({}), tf2 = r2.tf, P2 = r2.player, q = tf2.ped.find(x => x.st === 'walk' && !x.hike && x.s - T.startS > 300 && x.s - T.startS < 900);
  q.st = 'cross'; q.t = 0; q.d = 1.2; q.dT = -T.w - 1; q.a0 = q.a1 = q.s; tf2._pedPose(q);
  put(r2, q.s - T.startS - 55, 0.2, 20);
  let hit = false, side = 0;
  for (let k = 0; k < 120 * 3; k++) { P2.inThr = 0.3; P2.inBrk = 0; P2.inSteer = 0; P2.steer = 0; r2.step(DT); if (q.st === 'fly') hit = true; if (q.st === 'flee' && !side) side = q.fsd; }
  check('someone crossing the road with a car coming at them runs out of its path, to their side of its line, and is not hit', side === 1 && !hit && q.d > 0.2 + 1.3,
    `ran to ${q.d.toFixed(1)} m (the car at 0.2 m), way ${side}, ${hit ? 'hit' : 'not hit'}`);
}

// 5. someone hit: thrown, lands, lies there, gets up, walks on; the duel's 5 s for it (and for a cyclist)
{
  const r = duel({}), tf = r.tf, P = r.player;
  const p = tf.ped.find(q => q.st === 'walk' && !q.hike && q.s - T.startS > 300 && q.s - T.startS < 900);
  p.st = 'stand'; p.t = -99; p.d = 0; p.re = 5; p.a0 = p.a1 = p.s; tf._pedPose(p);   // (standing on the road, looking the other way)
  put(r, p.s - T.startS - 6, 0, 18);
  const seen = new Set(); let ev = null, v0 = P.speed;
  for (let k = 0; k < 120 * 16; k++) { P.inThr = 0; P.inBrk = seen.has('fly') ? 1 : 0; P.inSteer = 0; r.step(DT); seen.add(p.st); if (!ev && tf.ev) ev = { k: tf.evK, car: tf.evCar === P, v: P.speed }; }
  check('someone hit is thrown, lands, lies there, gets up and walks on; the game hears of it', ['fly', 'down', 'up'].every(s => seen.has(s)) && (p.st === 'walk' || p.st === 'back' || p.st === 'limp') && ev && ev.k === 'ped' && ev.car && ev.v < v0,
    `states ${[...seen].join(' > ')}, event ${ev ? ev.k : '-'}`);
  check('the duel: 5 s for knocking down someone on foot', P.tfPen === 5, `penalty ${P.tfPen || 0} s`);
  // a cyclist knocked: the rider falls off (thrown as a person), the bicycle slides away; 5 s more
  const r2 = duel({}), tf2 = r2.tf, P2 = r2.player, b = tf2.veh.find(v => v.kind === 4 && v.dir > 0 && v.s - T.startS > 2500 && v.s - T.startS < 6000);
  put(r2, b.s - T.startS - 7, b.d, b.v + 12);
  let evB = null; for (let k = 0; k < 120 * 2; k++) { P2.inThr = 0.5; P2.inBrk = 0; P2.inSteer = 0; P2.steer = 0; r2.step(DT); if (!evB && tf2.ev) evB = tf2.evK; }
  const rider = b.rider;
  check('a cyclist knocked falls off (thrown), the bicycle comes loose; 5 s in the duel', evB === 'bike' && b.st > 0 && rider && rider.kind === 3 && P2.tfPen === 5, `event ${evB}, bicycle ${b.st}, rider ${rider ? rider.st : '-'}, penalty ${P2.tfPen || 0} s`);
}

// 6. a traffic car waits at a zebra crossing someone walks over, then drives on
{
  const r = duel({}, true), tf = r.tf, z = tf.zeb[3], P = r.player;
  for (const c of r.cars) c.locked = true;
  put(r, z.s - T.startS - 200, -3, 0); P.locked = true; P.vx = P.vz = 0;   // (standing well below, so the people nearby move)
  for (const v of tf.veh) if (Math.abs(v.s - z.s) < 90) v.off = true;
  const v = tf.veh.find(x => x.kind === 0 && x.dir > 0 && !x.off); v.s = z.s - 45; v.d = v.dT = tf._lane(v); v.v = 12; v.pass = null; v.st = 0; tf._pose(v, 0);
  const p = tf.ped.find(q => q.st === 'walk' && !q.hike); p.s = z.s; p.side = -1; p.st = 'cross'; p.zi = 3; z.busy++; p.d = -T.w - 0.3; p.dT = T.w + 1; p.a0 = z.s - 20; p.a1 = z.s + 20; tf._pedPose(p);
  let minGap = 1e9, stopped = false;
  for (let k = 0; k < 120 * 16; k++) { r.step(DT); if (p.st === 'cross') { minGap = Math.min(minGap, z.s - v.s - v.len / 2); if (v.v < 0.2) stopped = true; } }
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

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
