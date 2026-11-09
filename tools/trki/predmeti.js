// Trki: avto v predmete (everything a car can hit that is neither another race car nor the barrier): the loose trackside props (Core
// PROPK, propCarHit, propStep), the parts cars shed (Race.spawnDebris, stepDebris, debrisHit), the open road's traffic and people
// (Traffic._hitVeh, _runBike, _hitPeds), the run from the police (crashCollide, Traffic._hitVehP, boxCollide), a standing semi-trailer and
// a retired car (carCollide). ANALYSIS ONLY: what the game does now, measured, for the plan of a more realistic collision version.
// Nothing here changes the game; the same script measures a future version (--cv).
//   node tools/trki/predmeti.js                 the tables (every part)
//   node tools/trki/predmeti.js --json          the same results as JSON on stdout
//   node tools/trki/predmeti.js --cv 3          a collision version chosen (Core.setTest({ cv }): 1 Simulacija, 2 Arkadna, 3 Mehka,
//                                               4 Kaskaderska, 5 Stara, or a later one; without it the game's default)
//   node tools/trki/predmeti.js --del razbitine only one part (predmeti | vrste | zamik | pocasi | razbitine | svoj | promet | ljudje |
//                                               policija | stavba | prikolica | kup | ograja | proga | dirka)
//   node tools/trki/predmeti.js --cas           part 'kup' also times a race step (wall clock, microseconds: not repeatable to the digit)
// The parts: predmeti (every kind of prop x 60 / 120 / 200 km/h x centred / 0.6 m off centre), vrste (the kinds' own numbers; the same hit
//   by a light and a heavy vehicle), zamik (how far off centre the repeated knocks reach), pocasi (at a crawl), razbitine (a shed part lying,
//   sliding, flying), svoj (the car's own part falling off; a part pushed along), promet, ljudje, policija, stavba, prikolica, kup (many
//   things at once, the cost of a step), ograja (a thing knocked at the barrier), proga (the same on Spa and Bathurst), dirka (seeded races)
// How it measures (the game's own code, no physics written again here):
// - every run is a Race of the game stepped by Race.step, the player's car alone on the road (the inputs zero: coasting) unless the part
//   says otherwise, the knock flags cleared before each step as js/game.js clears them each frame. What the hit cost is told against a
//   control run: the same car from the same place with nothing in its way
// - the road: 'krog' the game's Track built from a flat test oval (two 1.6 km straights, 6 m half width, the barriers where the Track
//   puts them: 5.5 / 6.5 m past the asphalt; the definition is this script's, the class and every rule are the game's); 'cesta' a flat
//   open road of 4 km (the run from the police and its building: only an open road has them). Cross-checked on Spa and Bathurst (part
//   'proga') and in a seeded race (part 'dirka', tests/lib/sim.js)
// - the props are made by Race.setProps (as the scenery builder hands them over), the loose parts by Race.spawnDebris (then laid where
//   the scenario wants them) or by Core.detachPart on the moving car (part 'svoj'), the vehicles by Traffic._veh / _winPlace, the people
//   by Traffic._ped, the patrol cars by Police._car, the semi-trailer and the retired car are cars of the race (opts.fieldModel, Race.retire)
// Columns (shared): v0 the car's speed at the first knock (km/h); n the steps with a knock (1/120 s each: more than one = the thing is
//   hit again and again); dv the speed lost by the last knock against the control (km/h), dv% of v0, dv1 the same 1 s after the first
//   knock; vo the thing's speed after the first knock, voM its highest (km/h), vo/v voM over the car's speed (a light thing struck by a
//   heavy car leaves at (1 + e) v at most); kot its direction off the car's travel (deg); h its highest point over where it stood (m);
//   pot how far from its place it ends (m); mir the time until it lies still (s; '>': not within the run); pA/pP the momentum the car
//   lost over what the thing got (along the travel; 1 = Newton's third law, more: the car pays too much, less: momentum from nowhere);
//   EA / EP the kinetic energy the car lost and the thing has (kJ); w the car's peak yaw rate (deg/s) and dh the furthest its heading got
//   from the control's (deg), dz its path's shift sideways 1.5 s on (m); vmin the lowest share of the control's speed (%; 0: stopped
//   dead); not the steps a point of the thing was inside the car's body (plan view, at the body's height; a thing passing through it);
//   rob the least room to the barrier line (m; negative: that far past it); skok the largest move of the thing in one step that its
//   speed does not explain (m: put back by a barrier or the floor); sk the car's damage after (%)
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const SIM = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));

const args = process.argv.slice(2), opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const CV = opt('--cv') != null && Number.isFinite(+opt('--cv')) ? +opt('--cv') : null, AS_JSON = args.includes('--json'), ONLY = opt('--del'), TIMES = args.includes('--cas');
const C = loadCore();
const SEED = 20261109; Math.random = SIM.seeded(SEED);   // (whatever the core draws outside a race's own numbers: a fixed sequence)
C.setTest(CV != null ? { cv: CV } : null);

const DT = 1 / 120, D = 180 / Math.PI, KMH = 3.6;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const model = (id) => C.MODELS.find(m => m.id === id);
const CAR = 'rally', SPEEDS = [60, 120, 200], OFF = 0.6;   // the test car (BURJA R7, 1150 kg), the speeds, the off-centre hit (m)
const RIG = (C.MODELS.find(m => m.trailer && !m.trailer.next) || C.MODELS.find(m => m.trailer) || {}).id;

// ---- the roads ----
function ovalPts(L, R) {
  const p = [], r = Math.PI / 180;
  for (let x = 0; x < L; x += 100) p.push([x, 0]);
  for (let a = -90; a < 90; a += 15) p.push([L + R * Math.cos(a * r), R + R * Math.sin(a * r)]);
  for (let x = L; x > 0; x -= 100) p.push([x, 2 * R]);
  for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]);
  return p;
}
const _roads = {};
function road(name) {
  if (_roads[name]) return _roads[name];
  let def;
  if (name === 'krog') def = { id: 'predmeti-krog', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50 };
  else if (name === 'cesta') { const pts = []; for (let x = 0; x <= 4000; x += 100) pts.push([x, 0]);
    def = { id: 'predmeti-cesta', name: 'Ravnina, Preizkus', open: true, laps: 1, halfWidth: 6, points: pts, start: [300, 0], finish: [3700, 0], hideout: { s: 2000, side: 1, len: 13, wid: 6.4, door: 4.6 } }; }
  else def = C.TRACKS.find(d => d.id === name);
  return (_roads[name] = new C.Track(def));
}
// a place on a real track: the middle of its longest straight stretch (the curvature under 1 / 2000 m), on the flat roads a fixed sample
function spotOf(T) {
  if (T._spot != null) return T._spot;
  if (T.def.id === 'predmeti-krog') return (T._spot = 150);
  if (T.def.id === 'predmeti-cesta') return (T._spot = 500);
  let best = 0, b0 = 0, run = 0;
  for (let i = 0; i < T.N; i++) { if (Math.abs(T.k[i]) < 5e-4) { run++; if (run > best) { best = run; b0 = i - run + 1; } } else run = 0; }
  return (T._spot = b0 + Math.floor(best * 0.25));   // (a quarter into it: room for the run ahead)
}
function loneRace(T, id, extra) {
  Math.random = SIM.seeded(SEED);   // (every run from the same sequence: a row does not depend on the rows before it)
  const race = new C.Race(T, Object.assign({ numAI: 0, playerGrid: 1, laps: 99, playerModel: model(id || CAR), assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }, extra));
  race.start();
  return race;
}
// the car placed on the road: at sample i, d across it, its heading the road's (+ dh), at v m/s along its heading, in a gear that fits
// the speed (as tests/lib/handling.js), on the road's height, its distance the road's
function putCar(c, T, i, d, v, dh) {
  const h = T.hd[i] + (dh || 0);
  c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, h);
  if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
  c.locked = false; c.steer = 0; c.inSteer = c.inThr = c.inBrk = c.inHand = 0; c.digitalSteer = true;
  c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v;
  const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
  c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s; c.dist = c.q.s - T.startS;
  if (c.tl) { const R = c.tl; R.vx = c.vx; R.vz = c.vz; if (R.next) { R.next.vx = c.vx; R.next.vz = c.vz; } }
}
const carMass = (c) => c.m.mass + (c.fuelKg || 0);
const nose = (c) => c.circles[c.circles.length - 1] + c.rad;   // (the reach of the car's front circle: what the props and the parts meet)
// one step of the race as the game makes it: the knock flags cleared (js/game.js clears them every frame), then Race.step
function stepRace(race) {
  for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; }
  race.step(DT);
}
// the control: the same car from the same place, nothing in its way (per step: speed, heading, x, z)
const _ctl = new Map();
function control(T, o, n) {
  const key = [T.def.id, o.id || CAR, o.i0, o.d || 0, o.kmh, o.dh || 0, o.extra || ''].join('|'); let R = _ctl.get(key);
  if (R && R.n >= n) return R;
  const race = loneRace(T, o.id, o.extraOpts), P = race.player; if (o.prep) o.prep(race);
  putCar(P, T, o.i0, o.d || 0, o.kmh / KMH, o.dh || 0);
  R = { n, v: new Float64Array(n + 1), h: new Float64Array(n + 1), x: new Float64Array(n + 1), z: new Float64Array(n + 1) };
  R.v[0] = Math.hypot(P.vx, P.vz); R.h[0] = P.h; R.x[0] = P.x; R.z[0] = P.z;
  for (let k = 1; k <= n; k++) { stepRace(race); R.v[k] = Math.hypot(P.vx, P.vz); R.h[k] = P.h; R.x[k] = P.x; R.z[k] = P.z; }
  _ctl.set(key, R); return R;
}
// a point of a prop in the world (its quaternion; geometry only)
function propPt(b, p, out) {
  const tx = 2 * (b.qy * p[2] - b.qz * p[1]), ty = 2 * (b.qz * p[0] - b.qx * p[2]), tz = 2 * (b.qx * p[1] - b.qy * p[0]);
  out[0] = b.x + p[0] + b.qw * tx + (b.qy * tz - b.qz * ty); out[1] = b.y + p[1] + b.qw * ty + (b.qz * tx - b.qx * tz); out[2] = b.z + p[2] + b.qw * tz + (b.qx * ty - b.qy * tx); return out;
}
const _p3 = [0, 0, 0], _bq = {};
// is the point (x, y, z) inside the car's body (its box in plan less 5 cm, between 5 cm and 1.3 m over its wheels: the heights the props' own test uses)
function inBody(c, x, y, z) {
  const dx = x - c.x, dz = z - c.z, ch = Math.cos(c.h), sh = Math.sin(c.h), lx = dx * ch + dz * sh, lz = -dx * sh + dz * ch, cy = c.y || 0;
  return Math.abs(lx) < c.m.len / 2 - 0.05 && Math.abs(lz) < c.m.wid / 2 - 0.05 && y > cy + 0.05 && y < cy + 1.3;
}
// the car's side of a run: its speed, heading and place per step against the control; knock(k): was there one in step k
function carStats(P, R, first, last, kEnd, M) {
  const v0 = R.run.v[first - 1], out = { v0: v0 * KMH };
  out.dv = (R.ctl.v[last] - R.run.v[last]) * KMH; out.dvp = (R.ctl.v[last] - R.run.v[last]) / v0 * 100;
  const k1 = Math.min(kEnd, first + 120); out.dv1 = (R.ctl.v[k1] - R.run.v[k1]) * KMH;
  let w = 0, dh = 0, vmin = 1; for (let k = first; k <= Math.min(kEnd, first + 180); k++) { w = Math.max(w, Math.abs(R.run.w[k])); dh = Math.max(dh, Math.abs(wrap(R.run.h[k] - R.ctl.h[k]))); }
  for (let k = first; k <= kEnd; k++) vmin = Math.min(vmin, R.run.v[k] / Math.max(0.01, R.ctl.v[k]));
  const k2 = Math.min(kEnd, first + 180), hx = Math.cos(R.ctl.h[k2]), hz = Math.sin(R.ctl.h[k2]);
  out.w = w * D; out.dh = dh * D; out.dz = Math.abs(-(R.run.x[k2] - R.ctl.x[k2]) * hz + (R.run.z[k2] - R.ctl.z[k2]) * hx); out.vmin = vmin * 100;
  out.pA = M * (R.ctl.v[last] - R.run.v[last]); out.EA = 0.5 * M * (R.ctl.v[last] * R.ctl.v[last] - R.run.v[last] * R.run.v[last]) / 1000;
  return out;
}

// ---- part 'predmeti': a car into a loose trackside prop ----
// the kinds Core knows (PROPK is not exported: their names from its source, each made by Race.setProps, which skips a name it does not know)
function propKinds() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'core.js'), 'utf8'), a = src.indexOf('const PROPK = '), b = src.indexOf('const _pq = {}', a), blk = a >= 0 && b > a ? src.slice(a, b) : '';
  const names = [...blk.matchAll(/^\s{6}([a-z]+):\s*(?:\{|\(\(\))/gm)].map(m => m[1]).concat([...blk.matchAll(/KK\.([a-z]+) = /g)].map(m => m[1]));
  const T = road('krog'), race = loneRace(T), out = [];
  for (const k of [...new Set(names)]) { race.setProps([{ kind: k, x: T.px[300], z: T.pz[300], yaw: 0, col: 0, i: 300 }], null); if (race.props.length) out.push({ kind: k, K: race.props[0].K }); }
  return out;
}
// o: { T, kind, kmh, off, id (the car), d (the car's place across the road), dh (its heading off the road's, rad), gap, secs, list(P, K): more props }
function propRun(o) {
  const T = o.T || road('krog'), i0 = o.i0 != null ? o.i0 : spotOf(T), n = Math.round((o.secs || 8) / DT);
  const race = loneRace(T, o.id), P = race.player, cs = { id: o.id, i0, d: o.d, kmh: o.kmh, dh: o.dh };
  putCar(P, T, i0, o.d || 0, o.kmh / KMH, o.dh || 0);
  race.setProps([{ kind: o.kind, x: P.x, z: P.z, yaw: 0, col: 0, i: i0 }], null);
  const K = race.props[0].K, hx = Math.cos(P.h), hz = Math.sin(P.h), ahead = nose(P) + (K.reach || K.rh) + (o.gap != null ? o.gap : 0.6), off = o.off || 0;
  const x0 = P.x + hx * ahead - hz * off, z0 = P.z + hz * ahead + hx * off;
  const list = [{ kind: o.kind, x: x0, z: z0, yaw: P.h + (o.yaw || 0), col: 0, i: i0 }]; if (o.more) for (const it of o.more(P, K, x0, z0, hx, hz)) list.push(it);
  race.setProps(list, null);
  const props = race.props, y0 = props[0].y, M = carMass(P), run = { v: new Float64Array(n + 1), h: new Float64Array(n + 1), x: new Float64Array(n + 1), z: new Float64Array(n + 1), w: new Float64Array(n + 1) };
  run.v[0] = Math.hypot(P.vx, P.vz); run.h[0] = P.h; run.x[0] = P.x; run.z[0] = P.z;
  let first = 0, last = 0, nHit = 0, kEnd = n, vo = 0, voM = 0, kot = 0, hM = 0, pP = 0, EP = 0, ins = 0, rob = 1e9, skok = 0, awakeMax = 0, awakeSteps = 0, rest = 0;
  const px = props.map(b => b.x), pz = props.map(b => b.z), pvx = props.map(() => 0), pvz = props.map(() => 0);
  for (let k = 1; k <= n; k++) {
    for (let j = 0; j < props.length; j++) { const b = props[j]; px[j] = b.x; pz[j] = b.z; pvx[j] = b.vx; pvz[j] = b.vz; }
    stepRace(race);
    run.v[k] = Math.hypot(P.vx, P.vz); run.h[k] = P.h; run.x[k] = P.x; run.z[k] = P.z; run.w[k] = P.w;
    const hit = P.hitDebris > 0; let awake = 0, allRest = true;
    if (hit) { nHit++; last = k; if (!first) first = k; pP = 0; EP = 0; }
    for (let j = 0; j < props.length; j++) {
      const b = props[j]; if (b.dead || b.hidden) continue;
      const sp = Math.hypot(b.vx, b.vz), BK = b.K;
      if (!b.sleep) { awake++; allRest = false; }
      if (hit) { pP += BK.m * (b.vx * hx + b.vz * hz); EP += (0.5 * BK.m * (sp * sp + b.vy * b.vy) + 0.5 * BK.I * (b.wx * b.wx + b.wy * b.wy + b.wz * b.wz)) / 1000;
        if (k === first && sp > vo) { vo = sp; kot = Math.atan2(-b.vx * hz + b.vz * hx, b.vx * hx + b.vz * hz) * D; } }
      if (b.sleep) continue;
      voM = Math.max(voM, sp); hM = Math.max(hM, b.y - (j === 0 ? y0 : b.fy + BK.h0));
      // a point of it inside the car's body in a step without a knock: it passes through
      if (!hit) { let inn = inBody(P, b.x, b.y, b.z); if (!inn && BK.pts) for (const p of BK.pts) { propPt(b, p, _p3); if (inBody(P, _p3[0], _p3[1], _p3[2])) { inn = true; break; } } if (inn) ins++; }
      const q = T.query(b.x, b.z, b.qi, _bq); rob = Math.min(rob, (q.d > 0 ? q.br : q.bl) - Math.abs(q.d) - BK.rh);
      if (!hit && k > 1) skok = Math.max(skok, Math.hypot(b.x - px[j] - pvx[j] * DT, b.z - pz[j] - pvz[j] * DT) - Math.hypot(b.vx - pvx[j], b.vz - pvz[j]) * DT);
    }
    awakeMax = Math.max(awakeMax, awake); awakeSteps += awake;
    if (first && allRest && !rest) rest = k;
    if (first && k >= first + 180 && allRest) { kEnd = k; break; }
    if (!first && k > 240) { kEnd = k; break; }   // (never touched)
  }
  const b = props[0], live = props.filter(q => !q.dead && !q.hidden), far = Math.max(...live.map(q => Math.hypot(q.x - x0, q.z - z0)));
  const row = { vrsta: o.kind, m: K.m, kmh: o.kmh, off, n: nHit };
  if (!first) return Object.assign(row, { zadet: 0 });
  const ctl = control(T, cs, n), A = carStats(P, { run, ctl }, first, last, kEnd, M);
  return Object.assign(row, { zadet: 1, v0: A.v0, dv: A.dv, dvp: A.dvp, dv1: A.dv1, vo: vo * KMH, voM: voM * KMH, vov: voM * KMH / A.v0, kot, h: hM, pot: far, mir: rest ? (rest - first) * DT : null,
    pAP: pP > 1e-6 ? A.pA / pP : null, EA: A.EA, EP, w: A.w, dh: A.dh, dz: A.dz, vmin: A.vmin, not: ins, rob, skok, sk: (P.dmg || 0) * 100, budnih: awakeMax, korakov: awakeSteps, lezi: b.dead ? null : Math.abs(b.y - b.fy - K.h0) > 0.15 || Math.abs(b.qx) + Math.abs(b.qz) > 0.2 ? 1 : 0 });
}

// ---- part 'razbitine': a car over / into a part another car shed ----
// o: { T, part, donor (model id: whose part), stanje: 'lezi' (lying still) | 'drsi' (sliding on at 6 m/s) | 'leti' (in the air, at 0.7 of the
//      car's speed: just shed by a car ahead at the same speed) | 'tik' (sliding just ahead, 1 m/s slower than the car: pushed along) |
//      'svoj' (falls off this very car: Core.detachPart), kmh, off, id, secs }
function debRun(o) {
  const T = o.T || road('krog'), i0 = o.i0 != null ? o.i0 : spotOf(T), n = Math.round((o.secs || 5) / DT);
  const race = loneRace(T, o.id), P = race.player, v = o.kmh / KMH, cs = { id: o.id, i0, kmh: o.kmh };
  putCar(P, T, i0, 0, v, 0);
  const hx = Math.cos(P.h), hz = Math.sin(P.h), M = carMass(P); let d = null, x0 = P.x, z0 = P.z;
  if (o.stanje === 'svoj') C.detachPart(P, o.part);   // (Race._step throws it: spawnDebris)
  else {
    let donor = P; if (o.donor && o.donor !== P.m.id) { donor = new C.Car(model(o.donor), { phys: 'cs' }); donor.place(P.x, P.z, P.h); donor.y = P.y; }
    race.spawnDebris(donor, o.part); d = race.debris[race.debris.length - 1];
    const ahead = nose(P) + d.r * 0.7 + 0.6, off = o.off || 0;
    x0 = d.x = P.x + hx * ahead - hz * off; z0 = d.z = P.z + hz * ahead + hx * off; d.q = null;
    const gy = T.yAt(T.query(d.x, d.z, i0, {})) + d.h * 0.5 + 0.02;
    d.wx = d.wy = d.wz = 0; d.rx = d.rz = 0; d.vx = d.vz = d.vy = 0; d.y = gy;
    if (o.stanje === 'lezi') { d.rest = true; d.ground = true; }
    else if (o.stanje === 'drsi') { d.rest = false; d.ground = true; d.vx = hx * 6; d.vz = hz * 6; }
    else if (o.stanje === 'tik') { d.rest = false; d.ground = true; d.vx = hx * (v - 1); d.vz = hz * (v - 1); }
    else { d.rest = false; d.ground = false; d.y = gy + 0.5; d.vy = 1; d.vx = hx * v * 0.7; d.vz = hz * v * 0.7; }
  }
  const run = { v: new Float64Array(n + 1), h: new Float64Array(n + 1), x: new Float64Array(n + 1), z: new Float64Array(n + 1), w: new Float64Array(n + 1) };
  run.v[0] = v; run.h[0] = P.h; run.x[0] = P.x; run.z[0] = P.z;
  let first = 0, last = 0, nHit = 0, kEnd = n, vo = 0, voM = 0, kot = 0, hM = 0, pP = 0, EP = 0, rob = 1e9, tLast = 0, y0 = d ? d.y : 0, dm = d ? d.m : 0;
  for (let k = 1; k <= n; k++) {
    stepRace(race);
    if (!d && race.debris.length) { d = race.debris[0]; x0 = d.x; z0 = d.z; y0 = d.y; dm = d.m; }
    run.v[k] = Math.hypot(P.vx, P.vz); run.h[k] = P.h; run.x[k] = P.x; run.z[k] = P.z; run.w[k] = P.w;
    const hit = P.hitDebris > 0, sp = d ? Math.hypot(d.vx, d.vz) : 0;
    if (hit) { nHit++; last = k; if (!first) { first = k; vo = sp; kot = sp > 0.01 ? Math.atan2(-d.vx * hz + d.vz * hx, d.vx * hx + d.vz * hz) * D : 0; } pP = d.m * (d.vx * hx + d.vz * hz); EP = 0.5 * d.m * (sp * sp + d.vy * d.vy) / 1000; }
    if (d && !d.rest) { voM = Math.max(voM, sp); hM = Math.max(hM, d.y - y0); const q = T.query(d.x, d.z, d.q ? d.q.i : i0, _bq); rob = Math.min(rob, (q.d > 0 ? q.br : q.bl) - Math.abs(q.d) - d.r * 0.5); }
    if (first && d.rest && !tLast) tLast = k;
    if (first && k >= first + 180 && d.rest) { kEnd = k; break; }
    if (!first && k > 240) { kEnd = k; break; }
  }
  const row = { del: o.part, od: o.donor || P.m.id, m: dm, stanje: o.stanje, kmh: o.kmh, off: o.off || 0, n: nHit };
  if (!first) return Object.assign(row, { zadet: 0 });
  const ctl = control(T, cs, n), A = carStats(P, { run, ctl }, first, last, kEnd, M);
  // (a part that fell off this car took its share of the momentum with it before the first knock: the control is the car with the part on)
  return Object.assign(row, { zadet: 1, v0: A.v0, dv: A.dv, dvp: A.dvp, dv1: A.dv1, vo: vo * KMH, voM: voM * KMH, vov: voM * KMH / A.v0, kot, h: hM, pot: Math.hypot(d.x - x0, d.z - z0), mir: tLast ? (tLast - first) * DT : null,
    pAP: Math.abs(pP) > 1e-6 ? A.pA / pP : null, EA: A.EA, EP, w: A.w, dh: A.dh, dz: A.dz, vmin: A.vmin, rob: rob > 1e8 ? null : rob, hop: P.hopN || 0, hopH: P.hopH || 0, prehodi: d.on ? d.on.length : 0 });
}

// ---- part 'promet': a car into a vehicle of the traffic (the endless drive's on the flat oval: Traffic._hitVeh; with pol: the run from the
// police on the flat open road: Traffic._hitVehP), 'ljudje': someone on foot (Traffic._hitPeds) ----
const TF_NAME = ['avto', 'kombi', 'avtobus', 'motor', 'kolo', 'tovornjak'];
// two boxes' overlap in plan (the least over the four axes; 0 apart): how deep the car is in the vehicle (geometry only)
function boxOverlap(ax, az, ah, al, aw, bx, bz, bh, bl, bw) {
  const dx = bx - ax, dz = bz - az, ca = Math.cos(ah), sa = Math.sin(ah), cb = Math.cos(bh), sb = Math.sin(bh), AX = [[ca, sa], [-sa, ca], [cb, sb], [-sb, cb]]; let ov = 1e9;
  for (const [lx, lz] of AX) { const ra = al / 2 * Math.abs(ca * lx + sa * lz) + aw / 2 * Math.abs(-sa * lx + ca * lz), rb = bl / 2 * Math.abs(cb * lx + sb * lz) + bw / 2 * Math.abs(-sb * lx + cb * lz), o = ra + rb - Math.abs(dx * lx + dz * lz); if (o <= 0) return 0; ov = Math.min(ov, o); }
  return ov;
}
// o: { p (0 car, 1 van, 2 bus, 3 motorbike, 4 bicycle, 5 truck with its semi-trailer), kmh (the closing speed), vt (the vehicle's own, km/h),
//      off, pol (the run from the police), bok: the car alongside its flank, travelling this many deg into it }
function tfRun(o) {
  const T = road(o.pol ? 'cesta' : 'krog'), i0 = spotOf(T), n = Math.round((o.secs || 6) / DT), vt = (o.vt || 0) / KMH, v = o.kmh / KMH + vt;
  const race = loneRace(T, o.id, o.pol ? { police: true, laps: 1 } : { endless: true }), P = race.player, tf = race.tf;
  let veh;
  const kind = o.p === 5 ? 2 : o.p, s0 = i0 * T.ds;
  if (o.pol) { tf.veh.length = 0; tf.ped.length = 0; veh = tf._veh(1, kind, s0 + 30, o.p); }   // (the road closed for the test: only this vehicle)
  else { tf.win.dens = 0; for (const q of tf.veh) q.off = true; veh = tf._veh(1, kind, s0 + 30, o.p); veh.off = true; tf._winPlace(veh, s0 + 30, 0); }   // (the window of traffic empty, then this one placed as the window places them)
  veh.v = vt; tf._pose(veh, 0);
  const hx = Math.cos(veh.h), hz = Math.sin(veh.h), nxv = -hz, nzv = hx, off = o.off || 0;
  let cx, cz, ch = veh.h;
  if (o.bok) { const a = o.bok / D; ch = veh.h + a; const side = -(veh.wid / 2 + P.m.wid / 2 + 0.25); cx = veh.x - hx * (veh.len / 2 - 1) + nxv * side; cz = veh.z - hz * (veh.len / 2 - 1) + nzv * side; }   // (its nose level with a point 1 m ahead of the vehicle's tail, 0.25 m off its flank)
  else { const back = veh.len / 2 + P.m.len / 2 + 0.5; cx = veh.x - hx * back + nxv * off; cz = veh.z - hz * back + nzv * off; }
  putCar(P, T, i0, 0, v, 0); P.x = P.px = cx; P.z = P.pz = cz; P.h = P.ph = ch; P.vx = Math.cos(ch) * v; P.vz = Math.sin(ch) * v; P.q = T.query(P.x, P.z, i0, P.q); P.sPrev = P.q.s; P.dist = P.q.s - T.startS;
  const M = o.pol ? P.ck.m : carMass(P), mv = veh.mass, tx = Math.cos(ch), tz = Math.sin(ch);
  const p0 = M * v + mv * vt * (hx * tx + hz * tz), E0 = 0.5 * M * v * v + 0.5 * mv * vt * vt;
  let first = 0, nHit = 0, last = 0, v1 = 0, vv1 = 0, pen = 0, kcM = 0, wM = 0, dhM = 0, vmin = 1e9, pL = 0, EL = 0, st1 = 0, rest = 0, gl = 0, vE = 0, kEnd = n;
  const xv0 = veh.x, zv0 = veh.z, h0 = ch;
  for (let k = 1; k <= n; k++) {
    stepRace(race);
    const sp = Math.hypot(P.vx, P.vz), vvx = veh.st === 0 ? Math.cos(veh.h) * veh.v : veh.vx, vvz = veh.st === 0 ? Math.sin(veh.h) * veh.v : veh.vz;
    const hit = P.hitCar > 0 || (veh.kind === 4 && !first && veh.st !== 0);   // (a cyclist run over, Traffic._runBike: no knock flag, the bicycle comes loose)
    if (hit) { nHit++; last = k; if (!first) { first = k; v1 = P.vx * tx + P.vz * tz; vv1 = vvx * tx + vvz * tz; st1 = veh.st; pL = M * v1 + mv * vv1; EL = 0.5 * M * sp * sp + 0.5 * mv * (vvx * vvx + vvz * vvz); } }
    if (first) { pen = Math.max(pen, veh.kind === 4 && veh.st ? 0 : boxOverlap(P.x, P.z, P.h, P.m.len, P.m.wid, veh.x, veh.z, veh.h, veh.len, veh.wid)); kcM = Math.max(kcM, Math.abs(P.csKc || 0)); wM = Math.max(wM, Math.abs(P.w)); dhM = Math.max(dhM, Math.abs(wrap(P.h - h0))); vmin = Math.min(vmin, sp);
      if (P.ck) gl = Math.max(gl, P.ck.gl || 0); if (k === first + 120) vE = sp;
      if (!rest && veh.st !== 1 && k > first + 12) rest = k; if (k >= first + 240 && veh.st !== 1) { kEnd = k; break; } }
    if (!first && k > 360) break;
  }
  const row = { vozilo: TF_NAME[o.p], m: mv, kmh: o.kmh, vt: o.vt || 0, off, bok: o.bok || 0, pol: o.pol ? 1 : 0, n: nHit };
  if (!first) return Object.assign(row, { zadet: 0 });
  const dvc = v - vt;
  return Object.assign(row, { zadet: 1, v1: v1 * KMH, vv1: vv1 * KMH, e: (vv1 - v1) / dvc, dvp: (v - v1) / v * 100, p: pL / p0, E: (1 - EL / E0) * 100, st: st1, pen, kc: kcM * D, w: wM * D, dh: dhM * D, vmin: vmin * KMH, v1s: vE * KMH,
    pot: Math.hypot(veh.x - xv0, veh.z - zv0), mir: rest ? (rest - first) * DT : null, gl, sk: (P.dmg || 0) * 100, dogodek: tf.evK || '' });
}
function pedRun(o) {
  const T = road('krog'), i0 = spotOf(T), n = 360, v = o.kmh / KMH;
  const race = loneRace(T, o.id, { endless: true }), P = race.player, tf = race.tf; tf.win.dens = 0; for (const q of tf.veh) q.off = true;
  const p = tf._ped(0, i0 * T.ds + 30, 1, 'walk');   // (a local on the shoulder of the right side, standing where Traffic puts them)
  const i1 = T.idx(p.s), hx = T.tx[i1], hz = T.tz[i1];
  putCar(P, T, i0, 0, v, 0); const back = P.m.len / 2 + 0.6; P.x = P.px = p.x - hx * back; P.z = P.pz = p.z - hz * back; P.q = T.query(P.x, P.z, i0, P.q); P.sPrev = P.q.s; P.dist = P.q.s - T.startS;
  const cs = { id: o.id, i0, kmh: o.kmh, d: P.q.d, extra: 'ped', extraOpts: { endless: true }, prep: (r) => { r.tf.win.dens = 0; for (const q of r.tf.veh) q.off = true; } };
  const run = { v: new Float64Array(n + 1) }; run.v[0] = v; let first = 0, vp = 0, st = '';
  const x0 = p.x, z0 = p.z;
  for (let k = 1; k <= n; k++) { const ev = tf.ev; stepRace(race); run.v[k] = Math.hypot(P.vx, P.vz); if (!first && tf.ev !== ev) { first = k; vp = Math.hypot(p.vx, p.vz); st = p.st; } }
  const row = { kmh: o.kmh, m: 75 };
  if (!first) return Object.assign(row, { zadet: 0, stanje: p.st });
  const ctl = control(T, cs, n), M = carMass(P), dv = ctl.v[first] - run.v[first];
  return Object.assign(row, { zadet: 1, dv: dv * KMH, dvp: dv / ctl.v[first - 1] * 100, vo: vp * KMH, vov: vp / run.v[first], pAP: M * dv / (75 * vp), pot: Math.hypot(p.x - x0, p.z - z0), stanje: st + ' > ' + p.st, kazen: P.tfPen || 0 });
}

// ---- part 'policija': the player's car into a parked patrol car (Police._car, crashCollide through Police.collide), 'stavba': into a
// wall of the building at the top (boxCollide) ----
// o: { vrsta: 'car' | 'van' | 'moto' | 'uc', kmh, off, kot (the patrol car turned across the road, deg) }
function polRun(o) {
  const T = road('cesta'), i0 = spotOf(T), n = 480, v = o.kmh / KMH;
  const race = loneRace(T, o.id, { police: true, laps: 1 }), P = race.player, pol = race.pol; race.tf.veh.length = 0; race.tf.ped.length = 0;
  putCar(P, T, i0, 2.5, v, 0);
  const pc = pol._car(P.q.s, 2.5, (o.kot || 0) / D, 'park', 0, o.vrsta), back = pc.m.len / 2 + P.m.len / 2 + 0.5 + (o.kot ? pc.m.len / 2 : 0), hx = Math.cos(P.h), hz = Math.sin(P.h), off = o.off || 0;
  pc.x = pc.px = P.x + hx * back - hz * off; pc.z = pc.pz = P.z + hz * back + hx * off; pc.q = T.query(pc.x, pc.z, i0, pc.q); pc.sPrev = pc.q.s;
  const Ma = P.ck.m, Mb = pc.ck.m, p0 = Ma * v, E0 = 0.5 * Ma * v * v;
  let first = 0, nHit = 0, v1 = 0, vb1 = 0, pen = 0, wA = 0, wB = 0, gl = 0, glT = 0, vmin = 1e9, pL = 0, EL = 0, dh = 0, vE = 0, vbE = 0;
  for (let k = 1; k <= n; k++) {
    stepRace(race);
    const sp = Math.hypot(P.vx, P.vz), sb = Math.hypot(pc.vx, pc.vz), hit = P.hitCar > 0;
    if (hit) { nHit++; if (!first) { first = k; v1 = P.vx * hx + P.vz * hz; vb1 = pc.vx * hx + pc.vz * hz; pL = Ma * v1 + Mb * vb1; EL = 0.5 * Ma * sp * sp + 0.5 * Mb * sb * sb + 0.5 * P.I * Ma / P.m.mass * P.w * P.w + 0.5 * pc.I * Mb / pc.m.mass * pc.w * pc.w; } }
    if (first) { pen = Math.max(pen, boxOverlap(P.x, P.z, P.h, P.m.len, P.m.wid, pc.x, pc.z, pc.h, pc.m.len, pc.m.wid)); wA = Math.max(wA, Math.abs(P.w)); wB = Math.max(wB, Math.abs(pc.w)); if (P.ck.gl > gl) { gl = P.ck.gl; glT = P.ck.glT; } vmin = Math.min(vmin, sp); dh = Math.max(dh, Math.abs(wrap(P.h - T.hd[i0])));
      if (k === first + 120) { vE = sp; vbE = sb; } if (k > first + 240) break; }
    if (!first && k > 240) break;
  }
  const row = { patrulja: o.vrsta, m: Mb, kmh: o.kmh, off, kot: o.kot || 0, n: nHit };
  if (!first) return Object.assign(row, { zadet: 0 });
  return Object.assign(row, { zadet: 1, v1: v1 * KMH, vb1: vb1 * KMH, e: (vb1 - v1) / v, dvp: (v - v1) / v * 100, p: pL / p0, E: (1 - EL / E0) * 100, pen, wA: wA * D, wB: wB * D, dh: dh * D, gl, glT, vmin: vmin * KMH, v1s: vE * KMH, vb1s: vbE * KMH, sk: (P.dmg || 0) * 100 });
}
// o: { kmh, kot: the car's travel into the building's wall along the road (deg; 90: square into it) }
function boxRun(o) {
  const T = road('cesta'), n = 360, v = o.kmh / KMH, a = o.kot / D;
  const race = loneRace(T, o.id, { police: true, laps: 1 }), P = race.player, G = race.pol.goal; race.tf.veh.length = 0; race.tf.ped.length = 0;
  const gi = T.idx(G.s), face = T.w + 0.15, reach = P.m.len / 2 * Math.sin(a) + P.m.wid / 2 * Math.cos(a);   // (the wall's face 0.15 m past the asphalt's edge on the building's side)
  putCar(P, T, gi, G.side * (face - reach - 0.4), v, G.side * a);
  const hx = Math.cos(P.h), hz = Math.sin(P.h), nx = T.nx[gi] * G.side, nz = T.nz[gi] * G.side, tx = T.tx[gi], tz = T.tz[gi], vn0 = v * Math.sin(a), vt0 = v * Math.cos(a);
  let first = 0, nHit = 0, vn1 = 0, vt1 = 0, pop = 0, wM = 0, vmin = 1e9, past = -1e9, vE = 0, hE = 0, last = 0;
  for (let k = 1; k <= n; k++) {
    const x = P.x, z = P.z, vx = P.vx, vz = P.vz; stepRace(race);
    const hit = P.hitWall > 0, sp = Math.hypot(P.vx, P.vz);
    if (hit) { nHit++; last = k; if (!first) { first = k; vn1 = P.vx * nx + P.vz * nz; vt1 = P.vx * tx + P.vz * tz; } }
    if (first) { wM = Math.max(wM, Math.abs(P.w)); vmin = Math.min(vmin, sp); if (k === first + 60) { vE = sp; hE = wrap(P.h - T.hd[gi]) * G.side * D; } if (k > first + 120) break; }
    // the car's corners past the wall's face (m), and the wall's push in a step (the place's move the speed does not explain)
    const ch = Math.cos(P.h), sh = Math.sin(P.h); for (const c of P.corners) { const wx = P.x + c[0] * ch - c[1] * sh - T.px[gi], wz = P.z + c[0] * sh + c[1] * ch - T.pz[gi]; if (Math.abs(wx * tx + wz * tz) < G.len / 2) past = Math.max(past, (wx * nx + wz * nz) - face); }
    if (hit) pop = Math.max(pop, Math.hypot(P.x - x - P.vx * DT, P.z - z - P.vz * DT));
    if (!first && k > 240) break;
  }
  const row = { kmh: o.kmh, kot: o.kot, n: nHit };
  if (!first) return Object.assign(row, { zadet: 0 });
  return Object.assign(row, { zadet: 1, eN: -vn1 / vn0, tT: vt0 > 0.1 ? vt1 / vt0 : null, mu: vn0 > 0.1 ? (vt0 - vt1) / (vn0 + vn1) : null, w: wM * D, v05: vE * KMH, izh: hE, vmin: vmin * KMH, pop: pop * 100, cez: Math.max(0, past) * 100, drs: (last - first + 1) * DT, sk: (P.dmg || 0) * 100 });
}

// ---- part 'prikolica': the car into a standing semi-trailer rig (a car of the race: carCollide by Race._step and Race._tlStep) and into a
// retired car standing on the verge (Race.retire: its handbrake on) ----
// o: { kaj: 'prikolica' (the trailer's tail) | 'vlacilec' (a rig's tractor alone would need its own model: the trailer's tail only) | 'odstop', kmh, off }
function rigRun(o) {
  const T = road('krog'), i0 = spotOf(T), n = 600, v = o.kmh / KMH, odstop = o.kaj === 'odstop';
  const race = loneRace(T, o.id, odstop ? { numAI: 1 } : { numAI: 1, fieldModel: { field: [RIG] } }), P = race.player, O = race.cars.find(c => c !== P);
  const d0 = odstop ? T.w + O.m.wid / 2 + 1.6 : 0;
  putCar(O, T, i0 + 30, d0, 0, 0); O.locked = true;
  if (odstop) { O.locked = false; race.retire(O); for (let k = 0; k < 240; k++) stepRace(race); }   // (it brakes where it stands and stays there: retireControl, its handbrake on)
  const B = odstop ? O : O.tl, hx = Math.cos(B.h), hz = Math.sin(B.h), off = o.off || 0, back = B.m.len / 2 + P.m.len / 2 + 0.5;
  putCar(P, T, i0, 0, v, 0); P.x = P.px = B.x - hx * back - hz * off; P.z = P.pz = B.z - hz * back + hx * off; P.h = P.ph = B.h; P.vx = hx * v; P.vz = hz * v; P.q = T.query(P.x, P.z, i0, P.q); P.sPrev = P.q.s; P.dist = P.q.s - T.startS;
  const Ma = carMass(P), Mb = odstop ? carMass(O) : carMass(O) + B.m.mass + (B.next ? B.next.m.mass : 0), p0 = Ma * v;
  const pOf = () => Ma * (P.vx * hx + P.vz * hz) + carMass(O) * (O.vx * hx + O.vz * hz) + (odstop ? 0 : B.m.mass * (B.vx * hx + B.vz * hz) + (B.next ? B.next.m.mass * (B.next.vx * hx + B.next.vz * hz) : 0));
  let first = 0, nHit = 0, v1 = 0, vb1 = 0, pen = 0, wM = 0, vmin = 1e9, p1 = 0, vE = 0, vbE = 0, dh = 0, gl = 0;
  for (let k = 1; k <= n; k++) {
    stepRace(race);
    const sp = Math.hypot(P.vx, P.vz), hit = P.hitCar > 0;
    if (hit) { nHit++; if (!first) { first = k; v1 = P.vx * hx + P.vz * hz; vb1 = B.vx * hx + B.vz * hz; p1 = pOf(); } }
    if (first) { pen = Math.max(pen, boxOverlap(P.x, P.z, P.h, P.m.len, P.m.wid, B.x, B.z, B.h, B.m.len, B.m.wid)); wM = Math.max(wM, Math.abs(P.w)); vmin = Math.min(vmin, sp); dh = Math.max(dh, Math.abs(wrap(P.h - T.hd[i0]))); gl = Math.max(gl, P.xgl || 0);
      if (k === first + 120) { vE = sp; vbE = Math.hypot(B.vx, B.vz); } if (k > first + 240) break; }
    if (!first && k > 240) break;
  }
  const row = { kaj: o.kaj, m: Mb, kmh: o.kmh, off, n: nHit };
  if (!first) return Object.assign(row, { zadet: 0 });
  return Object.assign(row, { zadet: 1, v1: v1 * KMH, vb1: vb1 * KMH, e: (vb1 - v1) / v, dvp: (v - v1) / v * 100, p: p1 / p0, pen, w: wM * D, dh: dh * D, gl, vmin: vmin * KMH, v1s: vE * KMH, vb1s: vbE * KMH, sk: (P.dmg || 0) * 100 });
}

// ---- part 'kup': many things at once (do they pile up, jitter, pass through each other; how many are awake, what a step costs) ----
function pileRun(o) {
  const T = road('krog'), i0 = spotOf(T), n = Math.round(14 / DT), v = o.kmh / KMH;
  const race = loneRace(T, o.id), P = race.player; putCar(P, T, i0, 0, v, 0);
  const hx = Math.cos(P.h), hz = Math.sin(P.h), list = o.list(P.x + hx * 6, P.z + hz * 6, hx, hz, P.h, i0); race.setProps(list, null);
  const props = race.props; let first = 0, nHit = 0, last = 0, awakeMax = 0, awakeSteps = 0, rest = 0, voM = 0, tStep = 0, tN = 0, t0 = 0, tIdle = 0, nIdle = 0;
  const run = new Float64Array(n + 1); run[0] = v;
  for (let k = 1; k <= n; k++) {
    if (TIMES) t0 = Number(process.hrtime.bigint());
    stepRace(race);
    const dtm = TIMES ? (Number(process.hrtime.bigint()) - t0) / 1000 : 0;
    run[k] = Math.hypot(P.vx, P.vz);
    if (P.hitDebris > 0) { nHit++; last = k; if (!first) first = k; }
    let awake = 0; for (const b of props) if (!b.dead && !b.sleep) { awake++; voM = Math.max(voM, Math.hypot(b.vx, b.vz)); }
    if (awake) { awakeSteps += awake; tStep += dtm; tN++; } else { tIdle += dtm; nIdle++; }
    awakeMax = Math.max(awakeMax, awake);
    if (first && !awake && !rest) rest = k; if (awake) rest = 0;
    if (first && rest && k > rest + 60) break;
  }
  // at rest: the things lying in each other (their bounding spheres nearer than 0.68 of their radii' sum: propPair's own reach)
  const live = props.filter(b => !b.dead && !b.hidden); let inEach = 0, lowest = 1e9;
  for (let a = 0; a < live.length; a++) for (let b = a + 1; b < live.length; b++) { const A = live[a], B = live[b], dd = Math.hypot(A.x - B.x, A.y - B.y, A.z - B.z), r = (A.K.rb + B.K.rb) * 0.68; if (dd < r * 0.9) inEach++; lowest = Math.min(lowest, dd / r); }
  const ctl = control(T, { id: o.id, i0, kmh: o.kmh }, n), dv = first ? (ctl.v[last] - run[last]) * KMH : 0;
  return { prizor: o.ime, kosov: live.length, kmh: o.kmh, n: nHit, dv, dvp: first ? dv / (run[first - 1] * KMH) * 100 : 0, budnih: awakeMax, korakov: awakeSteps, mir: rest && first ? (rest - first) * DT : null, voM: voM * KMH, vsebi: inEach, blizu: lowest > 1e8 ? null : lowest,
    us: TIMES && tN ? tStep / tN : null, usMir: TIMES && nIdle ? tIdle / nIdle : null };
}

// ---- part 'ograja': a thing knocked at the barrier (does it stay inside it) ----
function wallRun(o) {
  // the car 2 m inside the barrier on the right, travelling 20 deg toward it; the thing between it and the barrier
  const T = road('krog'), i0 = spotOf(T), B = T.br[i0], dh = 20 / D;
  if (o.del) { const r = debRunAt(T, i0, B, dh, o); return r; }
  return Object.assign(propRun({ T, kind: o.kind, kmh: o.kmh, off: 0, d: B - 3.2, dh, secs: 8 }), { vrsta: o.kind });
}
function debRunAt(T, i0, B, dh, o) {
  const race = loneRace(T), P = race.player, v = o.kmh / KMH, n = 600; putCar(P, T, i0, B - 3.2, v, dh);
  const hx = Math.cos(P.h), hz = Math.sin(P.h); race.spawnDebris(P, o.del); const d = race.debris[0], ahead = nose(P) + d.r * 0.7 + 0.6;
  d.x = P.x + hx * ahead; d.z = P.z + hz * ahead; d.q = null; d.y = T.yAt(T.query(d.x, d.z, i0, {})) + d.h * 0.5 + 0.52; d.vy = 1; d.vx = hx * v * 0.7; d.vz = hz * v * 0.7; d.rest = false; d.ground = false; d.wx = d.wy = d.wz = 0;
  let rob = 1e9, voM = 0, hM = 0, nHit = 0, skok = 0;
  for (let k = 1; k <= n; k++) { const x = d.x, z = d.z, vx = d.vx, vz = d.vz; stepRace(race); if (P.hitDebris > 0) nHit++;
    if (!d.rest) { const q = T.query(d.x, d.z, d.q ? d.q.i : i0, _bq); rob = Math.min(rob, (q.d > 0 ? q.br : q.bl) - Math.abs(q.d) - d.r * 0.5); voM = Math.max(voM, Math.hypot(d.vx, d.vz)); hM = Math.max(hM, d.y);
      if (!(P.hitDebris > 0)) skok = Math.max(skok, Math.hypot(d.x - x - vx * DT, d.z - z - vz * DT) - Math.hypot(d.vx - vx, d.vz - vz) * DT); }
    if (d.rest && k > 120) break; }
  return { vrsta: 'del: ' + o.del, m: d.m, kmh: o.kmh, n: nHit, zadet: nHit ? 1 : 0, voM: voM * KMH, h: hM, rob, skok };
}

// ---- part 'dirka': a seeded race with a crash (tests/lib/sim.js, the set-ups 'formula', 'lm', 'car': the player's car is driven into the
// barrier or the pack, sheds parts, then drives on): every knock of a car on a loose part, gathered per car and part ----
function raceRun(tid, setup, secs) {
  const orig = Math.random;
  try {
    Math.random = SIM.seeded(7);
    const S = SIM.SETUPS[setup], race = SIM.makeRace(C, tid, (C2, tt, t) => S.opts(C2, tt, 'cs', t)), n = Math.round(secs / DT), G = new Map();
    let maxDeb = 0, moving = 0, stepsDeb = 0, tests = 0, nEv = 0, sum = 0, mx = 0, lying = 0;
    for (let k = 1; k <= n; k++) {
      const v0 = race.cars.map(c => Math.hypot(c.vx, c.vz));
      for (const c of race.cars) c.hitDebris = 0;
      SIM.stepRace(C, race, k, S.drive);
      maxDeb = Math.max(maxDeb, race.debris.length); if (race.debris.length) { stepsDeb++; tests += race.debris.length * race.cars.length; for (const d of race.debris) if (!d.rest) moving++; }
      race.cars.forEach((c, j) => { if (!(c.hitDebris > 0)) return;
        const v1 = Math.hypot(c.vx, c.vz); let best = null, bd = 1e9; for (const d of race.debris) { const dd = Math.hypot(d.x - c.x, d.z - c.z); if (dd < bd) { bd = dd; best = d; } }   // (the nearest piece: the one knocked)
        const dv = (v0[j] - v1) * KMH, key = j + '|' + (best ? best.id : '?'), lz = c.hitDebris === 6 || c.hitDebris === 2.5 ? 1 : 0;
        nEv++; sum += dv; mx = Math.max(mx, dv / Math.max(1, v0[j] * KMH) * 100); lying += lz;
        let g = G.get(key); if (!g) G.set(key, g = { proga: tid, postavitev: setup, avto: c.isPlayer ? 'igralec' : c.m.id, masa: c.m.mass, del: best ? best.part : '?', m: best ? best.m : 0, t0: k * DT, t1: 0, n: 0, povozen: 0, v0: v0[j] * KMH, dv: 0 });
        g.n++; g.t1 = k * DT; g.dv += dv; g.povozen += lz; });
    }
    // (dv: the car's whole change of speed in the steps with a knock, the barrier's and the tyres' share with it; izr: the knocks' own share by
    // the game's factor per step for a part of that size, min(6 %, 0.4 % x m), over the n steps)
    const ev = [...G.values()].map(g => Object.assign(g, { dvp: g.dv / Math.max(1, g.v0) * 100, izr: (1 - Math.pow(1 - Math.min(0.06, g.m * 0.004), g.n - g.povozen)) * 100 }));
    return { proga: tid, postavitev: setup, s: secs, kosov: race.debrisId || 0, hkrati: maxDeb, dogodkov: nEv, povozenih: lying, vsotaDv: sum, najvec: mx, premikajocih: stepsDeb ? moving / stepsDeb : 0, preizkusov: stepsDeb ? tests / stepsDeb : 0, ev };
  } finally { Math.random = orig; }
}

// a seeded race of 13 cars on a real track (the set-up 'race': the rivals and the player's autopilot at racing speed, on the throttle) with
// a row of one kind of prop across the road 250 m after the start line: what each car's knocks cost against the same race without them
function raceProps(tid, kind, gap) {
  const orig = Math.random;
  try {
    const n = Math.round(22 / DT), mk = () => { Math.random = SIM.seeded(7); return SIM.makeRace(C, tid, (C2, tt, t) => SIM.SETUPS.race.opts(C2, tt, 'cs', t)); };
    const ctl = mk(), run = mk(), T = run.track, i = T.idx(T.startS + 250), list = [], half = Math.floor((T.w - 0.5) / gap);
    for (let u = -half; u <= half; u++) list.push({ kind, x: T.px[i] + T.nx[i] * u * gap, z: T.pz[i] + T.nz[i] * u * gap, yaw: T.hd[i], col: 0, i });
    run.setProps(list, null);
    const st = run.cars.map(() => ({ n: 0, first: 0, last: 0, v0: 0, dv: 0, lag: null }));
    for (let k = 1; k <= n; k++) {
      const v0 = run.cars.map(c => Math.hypot(c.vx, c.vz));
      for (const c of run.cars) c.hitDebris = 0;
      SIM.stepRace(C, ctl, k); SIM.stepRace(C, run, k);
      run.cars.forEach((c, j) => { const S = st[j], o = ctl.cars[j];
        if (c.hitDebris > 0) { S.n++; S.last = k; if (!S.first) { S.first = k; S.v0 = v0[j]; } S.dv = Math.hypot(o.vx, o.vz) - Math.hypot(c.vx, c.vz); }
        if (S.first && k === S.first + 600) S.lag = o.dist - c.dist; });
    }
    const hit = st.filter(S => S.first), mean = (f) => hit.length ? hit.reduce((a, S) => a + f(S), 0) / hit.length : null, ns = hit.map(S => S.n).sort((a, b) => a - b), lag = hit.filter(S => S.lag != null);
    return { proga: tid, vrsta: kind, kosov: list.length, avtov: hit.length, nMed: ns.length ? ns[ns.length >> 1] : null, nMax: ns.length ? ns[ns.length - 1] : null, v0: mean(S => S.v0 * KMH), dv: mean(S => S.dv * KMH), dvp: mean(S => S.dv / S.v0 * 100), dvpMax: hit.length ? Math.max(...hit.map(S => S.dv / S.v0 * 100)) : null,
      zaostanek: lag.length ? lag.reduce((a, S) => a + S.lag, 0) / lag.length : null, zaostanekMax: lag.length ? Math.max(...lag.map(S => S.lag)) : null };
  } finally { Math.random = orig; }
}

// ---- the tables ----
const f = (v, d = 1) => v == null || (typeof v === 'number' && !Number.isFinite(v)) ? '-' : typeof v === 'number' ? v.toFixed(d) : String(v);
function table(title, note, cols, rows) {
  const out = ['', '== ' + title, ...(note ? [note] : [])];
  const cells = rows.map(r => cols.map(([k, , d]) => r.zadet === 0 && !(k in r) ? '' : f(r[k], d == null ? 1 : d)));
  const wid = cols.map(([, h], j) => Math.max(h.length, ...cells.map(c => c[j].length)));
  out.push(cols.map(([, h], j) => h.padStart(wid[j])).join('  '));
  for (const c of cells) out.push(c.map((s, j) => s.padStart(wid[j])).join('  '));
  return out.join('\n');
}
const PCOLS = [['vrsta', 'vrsta'], ['m', 'kg', 0], ['kmh', 'km/h', 0], ['off', 'zamik'], ['n', 'n', 0], ['dv', 'dv', 2], ['dvp', 'dv%', 2], ['dv1', 'dv1', 2], ['vo', 'vo', 0], ['voM', 'voM', 0], ['vov', 'vo/v', 2], ['kot', 'kot', 0], ['h', 'h', 2], ['pot', 'pot'], ['mir', 'mir'],
  ['pAP', 'pA/pP'], ['EA', 'EA', 1], ['EP', 'EP', 2], ['w', 'w', 0], ['dh', 'dh', 2], ['dz', 'dz', 2], ['vmin', 'vmin', 0], ['not', 'not', 0], ['rob', 'rob'], ['skok', 'skok', 2], ['sk', 'sk', 2]];
const PARTS = {};

PARTS.predmeti = () => {
  const kinds = propKinds(), rows = [];
  for (const { kind } of kinds) for (const kmh of SPEEDS) for (const off of [0, OFF]) rows.push(propRun({ kind, kmh, off }));
  return { rows, text: table('predmeti ob progi: ' + CAR + ' (' + model(CAR).mass + ' kg) v predmet, 60 / 120 / 200 km/h, v sredino in ' + OFF + ' m iz sredine (ravnina)', null, PCOLS, rows) };
};
PARTS.vrste = () => {   // the kinds' own numbers (Core PROPK) and the same hit by a light and a heavy vehicle
  const kinds = propKinds(), rows = kinds.map(({ kind, K }) => ({ vrsta: kind, m: K.m, rh: K.rh, rb: K.rb, h0: K.h0, e: K.e, mu: K.mu, lift: K.lift, I: K.I, dmg: K.dmg, vmax: K.vmax, razpade: K.breaks || '', noge: K.legs ? K.legs.length : 0 }));
  const cars = ['mravlja', 'kolibri', CAR, 'titan'].filter(id => model(id)), rows2 = [];
  for (const id of cars) for (const kind of ['cone', 'bale', 'shelter']) { const r = propRun({ kind, kmh: 120, off: 0, id }); rows2.push(Object.assign({ avto: id, masa: model(id).mass }, r)); }
  return { rows, rows2, text: table('vrste predmetov (Core PROPK): masa kg, polmer stika rh, doseg rb, višina težišča h0, odboj e, trenje mu, dvig, vztrajnost I, škoda dmg, vmax', null,
    [['vrsta', 'vrsta'], ['m', 'kg', 0], ['rh', 'rh', 2], ['rb', 'rb', 2], ['h0', 'h0', 2], ['e', 'e', 2], ['mu', 'mu', 2], ['lift', 'dvig', 2], ['I', 'I', 2], ['dmg', 'dmg', 2], ['vmax', 'vmax', 0], ['razpade', 'razpade v'], ['noge', 'noge', 0]], rows) +
    '\n' + table('isti predmet, različno težki avti (120 km/h, v sredino): izguba hitrosti ni odvisna od mase avta', null, [['avto', 'avto'], ['masa', 'kg avta', 0], ...PCOLS.slice(0, 2), ...PCOLS.slice(4, 8), ['pAP', 'pA/pP'], ['EA', 'EA', 1]], rows2) };
};
PARTS.zamik = () => {   // how far off centre the repeated knocks reach (the car is 1.8 m wide)
  const rows = []; for (const kind of ['cone', 'bale']) for (const kmh of [60, 200]) for (let u = 0; u <= 12; u += 2) rows.push(propRun({ kind, kmh, off: u / 10 }));
  return { rows, text: table('zamik zadetka: koliko korakov avto zadeva isti predmet glede na to, kako daleč iz sredine ga zadene', null, [...PCOLS.slice(0, 7), ['voM', 'voM', 0], ['kot', 'kot', 0], ['h', 'h', 2], ['pAP', 'pA/pP'], ['w', 'w', 0]], rows) };
};
PARTS.pocasi = () => {   // at a crawl: does a heavy thing resist a car pushing it (the prop gives way; under 0.5 m/s of closing speed no knock at all)
  const rows = []; for (const kind of ['cone', 'bale', 'bstack', 'hydrant', 'shelter', 'lamp']) for (const kmh of [5, 15, 30]) rows.push(propRun({ kind, kmh, off: 0 }));
  return { rows, text: table('počasi v predmet (5 / 15 / 30 km/h, v sredino): ali težek predmet avto ustavi ali se mu umakne', null, [...PCOLS.slice(0, 8), ['voM', 'voM', 0], ['vov', 'vo/v', 2], ['pot', 'pot'], ['pAP', 'pA/pP'], ['vmin', 'vmin', 0], ['not', 'not', 0], ['skok', 'skok', 2]], rows) };
};
const DCOLS = [['del', 'del'], ['od', 'od'], ['m', 'm', 1], ['stanje', 'stanje'], ['kmh', 'km/h', 0], ['off', 'zamik'], ['n', 'n', 0], ['dv', 'dv', 2], ['dvp', 'dv%', 2], ['dv1', 'dv1', 2], ['vo', 'vo', 0], ['voM', 'voM', 0], ['vov', 'vo/v', 2], ['kot', 'kot', 0], ['h', 'h', 2], ['pot', 'pot'], ['mir', 'mir'],
  ['pAP', 'pA/pP'], ['EA', 'EA', 1], ['EP', 'EP', 2], ['w', 'w', 0], ['dh', 'dh', 2], ['dz', 'dz', 2], ['vmin', 'vmin', 0], ['rob', 'rob'], ['hop', 'hop', 0], ['hopH', 'hopH', 2]];
PARTS.razbitine = () => {
  const rows = [], list = [['mirrorL', CAR], ['fenderL', CAR], ['bumperF', CAR], ['trunk', CAR], ['hood', CAR], ['wheelFL', 'kolibri'], ['wheelFL', 'titan']].filter(([, id]) => model(id));
  for (const [part, donor] of list) for (const stanje of ['lezi', 'drsi', 'leti']) for (const kmh of SPEEDS) for (const off of [0, OFF]) rows.push(debRun({ part, donor, stanje, kmh, off }));
  const cars = ['mravlja', 'kolibri', CAR, 'titan'].filter(id => model(id)), rows2 = [];
  for (const id of cars) for (const stanje of ['lezi', 'drsi']) rows2.push(Object.assign({ avto: id, masa: model(id).mass }, debRun({ part: 'hood', donor: CAR, stanje, kmh: 120, off: 0, id })));
  return { rows, rows2, text: table('odpadli deli na cesti: ' + CAR + ' čez / v del (leži pri miru; drsi naprej s 6 m/s; leti z 0,7 hitrosti avta)', 'm: »igralna masa« dela (ne kg); hop: poskok karoserije (samo izris), hopH njegova višina (m)', DCOLS, rows) +
    '\n' + table('isti del (pokrov motorja, m 14), različno težki avti, 120 km/h', null, [['avto', 'avto'], ['masa', 'kg avta', 0], ['stanje', 'stanje'], ['n', 'n', 0], ['dv', 'dv', 2], ['dvp', 'dv%', 2], ['pAP', 'pA/pP'], ['EA', 'EA', 1]], rows2) };
};
PARTS.svoj = () => {   // a part falls off the moving car itself (Core.detachPart: as after a knock): does the car run into it
  const rows = []; for (const part of ['bumperF', 'hood', 'fenderL', 'mirrorL', 'bumperR']) for (const kmh of SPEEDS) rows.push(debRun({ part, stanje: 'svoj', kmh, secs: 8 }));
  const rows2 = []; for (const part of ['mirrorL', 'fenderL', 'hood']) for (const kmh of SPEEDS) rows2.push(debRun({ part, stanje: 'tik', kmh, secs: 8 }));   // (a part sliding just ahead of the car: pushed along)
  return { rows, rows2, text: table('del odpade s tega avta med vožnjo (Core.detachPart → Race.spawnDebris): ali ga avto dohiti', 'n: koliko korakov ga avto zadene (isti del večkrat); kontrola: isti avto brez odpadlega dela', DCOLS.filter(c => c[0] !== 'od' && c[0] !== 'off'), rows) +
    '\n' + table('del drsi tik pred avtom (1 m/s počasneje od avta): avto ga rine pred seboj', null, DCOLS.filter(c => c[0] !== 'od' && c[0] !== 'off'), rows2) };
};
const TCOLS = [['vozilo', 'vozilo'], ['m', 'kg', 0], ['kmh', 'km/h', 0], ['vt', 'v voz.', 0], ['off', 'zamik'], ['bok', 'bok°', 0], ['pol', 'pol', 0], ['n', 'n', 0], ['v1', 'v avta', 1], ['vv1', 'v voz.', 1], ['e', 'e', 2], ['dvp', 'dv%', 1], ['p', 'p po/pred', 3], ['E', 'E izg.%', 0], ['st', 'st', 0],
  ['pen', 'vdor', 2], ['kc', 'sunek°', 1], ['w', 'w', 0], ['dh', 'dh', 1], ['vmin', 'vmin', 1], ['v1s', 'v+1s', 1], ['pot', 'pot'], ['mir', 'mir'], ['gl', 'gl', 2], ['sk', 'sk', 1], ['dogodek', 'dogodek']];
PARTS.promet = () => {
  const rows = [];
  for (const p of [0, 1, 2, 5, 3, 4]) for (const kmh of SPEEDS) for (const off of [0, OFF]) rows.push(tfRun({ p, kmh, off }));
  for (const p of [0, 2]) rows.push(tfRun({ p, kmh: 60, vt: 60 }), tfRun({ p, kmh: 60, vt: 60, off: OFF }));   // (a moving vehicle rear-ended: 120 into 60 km/h)
  for (const p of [2, 5]) for (const kmh of [60, 120]) for (const bok of [5, 30]) rows.push(tfRun({ p, kmh, bok }));   // (along a long vehicle's flank, 5 and 30 deg into it)
  for (const p of [0, 1, 2, 3, 4]) for (const kmh of SPEEDS) rows.push(tfRun({ p, kmh, pol: 1 }), tfRun({ p, kmh, off: OFF, pol: 1 }));
  return { rows, text: table('promet: ' + CAR + ' v vozilo prometa od zadaj (stoji, razen kjer ima svojo hitrost); pol 0: Traffic._hitVeh (krogi), pol 1: beg pred policijo, Traffic._hitVehP (pravokotnika)',
    'km/h: hitrost približevanja; v avta / v voz.: hitrosti takoj po prvem dotiku; e: odboj; p po/pred: gibalna količina obeh po trku / pred njim; E izg.: izgubljena kinetična energija; st: 1 vozilo izbito s pasu (prosto telo); vdor: največje prekrivanje (m); sunek°: zasuk nosu (csKc)', TCOLS, rows) };
};
PARTS.ljudje = () => {
  const rows = SPEEDS.map(kmh => pedRun({ kmh }));
  return { rows, text: table('ljudje (pešec 75 kg na bankini, Traffic._hitPeds)', 'vo: hitrost pešca po trku; pA/pP: gibalna količina, ki jo izgubi avto / dobi pešec', [['kmh', 'km/h', 0], ['m', 'kg', 0], ['zadet', 'zadet', 0], ['dv', 'dv', 2], ['dvp', 'dv%', 2], ['vo', 'vo', 1], ['vov', 'vo/v', 2], ['pAP', 'pA/pP', 2], ['pot', 'pot'], ['stanje', 'stanje'], ['kazen', 'kazen s', 0]], rows) };
};
PARTS.policija = () => {
  const rows = [];
  for (const vrsta of ['car', 'van', 'moto']) for (const kmh of SPEEDS) for (const off of [0, OFF]) rows.push(polRun({ vrsta, kmh, off }));
  for (const kmh of SPEEDS) rows.push(polRun({ vrsta: 'car', kmh, kot: 90 }));   // (a roadblock's car across the road)
  return { rows, text: table('beg pred policijo: ' + CAR + ' v parkirano patruljo (crashCollide; mase ck: igralec ' + (model(CAR).mass + 90) + ' kg)', 'v1 / vb1: hitrost avta / patrulje takoj po prvem dotiku; wA / wB: največje vrtenje avta / patrulje (°/s); gl: izgubljen oprijem igralca (0–1), glT s',
    [['patrulja', 'patrulja'], ['m', 'kg', 0], ['kmh', 'km/h', 0], ['off', 'zamik'], ['kot', 'kot°', 0], ['n', 'n', 0], ['v1', 'v1', 1], ['vb1', 'vb1', 1], ['e', 'e', 2], ['dvp', 'dv%', 1], ['p', 'p po/pred', 3], ['E', 'E izg.%', 0], ['pen', 'vdor', 2], ['wA', 'wA', 0], ['wB', 'wB', 0], ['dh', 'dh', 1], ['gl', 'gl', 2], ['glT', 'glT', 2], ['vmin', 'vmin', 1], ['v1s', 'v+1s', 1], ['vb1s', 'vb+1s', 1], ['sk', 'sk', 1]], rows) };
};
PARTS.stavba = () => {
  const rows = []; for (const kmh of SPEEDS) for (const kot of [10, 30, 90]) rows.push(boxRun({ kmh, kot }));
  return { rows, text: table('stavba na vrhu bega pred policijo (boxCollide; samo proga z def.hideout)', 'eN: odboj pravokotno; tT: delež hitrosti vzdolž stene po prvem dotiku; mu: trenje; izh: smer avta 0,5 s po trku (° od stene); pop: največji premik v koraku (cm); cez: vogal čez steno (cm); drs: čas ob steni (s)',
    [['kmh', 'km/h', 0], ['kot', 'kot°', 0], ['n', 'n', 0], ['eN', 'eN', 2], ['tT', 'tT', 2], ['mu', 'mu', 2], ['w', 'w', 0], ['v05', 'v+0,5s', 1], ['izh', 'izh', 1], ['vmin', 'vmin', 1], ['pop', 'pop', 1], ['cez', 'cez', 1], ['drs', 'drs', 2], ['sk', 'sk', 1]], rows) };
};
PARTS.prikolica = () => {
  const rows = [];
  if (RIG) for (const kmh of SPEEDS) for (const off of [0, OFF]) rows.push(rigRun({ kaj: 'prikolica', kmh, off }));
  for (const kmh of SPEEDS) for (const off of [0, OFF]) rows.push(rigRun({ kaj: 'odstop', kmh, off }));
  return { rows, text: table('stoječa polprikolica (' + RIG + ', zadek prikolice) in odstopljen avto na bankini (ročna zavora): carCollide v Race._step', 'm: masa vlečnega vozila s prikolico oz. avta; p po/pred: gibalna količina vseh teles po prvem dotiku / pred njim',
    [['kaj', 'kaj'], ['m', 'kg', 0], ['kmh', 'km/h', 0], ['off', 'zamik'], ['n', 'n', 0], ['v1', 'v1', 1], ['vb1', 'vb1', 1], ['e', 'e', 2], ['dvp', 'dv%', 1], ['p', 'p po/pred', 3], ['pen', 'vdor', 2], ['w', 'w', 0], ['dh', 'dh', 1], ['gl', 'gl', 2], ['vmin', 'vmin', 1], ['v1s', 'v+1s', 1], ['vb1s', 'vb+1s', 1], ['sk', 'sk', 1]], rows) };
};
PARTS.kup = () => {
  const row = (kind, nn, gap) => (x, z, hx, hz, h, i) => { const L = []; for (let k = 0; k < nn; k++) { const u = (k - (nn - 1) / 2) * gap; L.push({ kind, x: x - hz * u, z: z + hx * u, yaw: h, col: 0, i }); } return L; };
  const grid = (kind, nx, nz, gap) => (x, z, hx, hz, h, i) => { const L = []; for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const u = (b - (nz - 1) / 2) * gap; L.push({ kind, x: x + hx * a * gap - hz * u, z: z + hz * a * gap + hx * u, yaw: h, col: 0, i }); } return L; };
  const S = [['vrsta 9 stožcev čez cesto', row('cone', 9, 1.25)], ['3 skladi gum (9 gum)', row('tstack', 3, 1.0)], ['3 skladi bal (9 bal)', row('bstack', 3, 1.9)], ['polje 6 × 5 stožcev', grid('cone', 6, 5, 0.9)], ['polje 4 × 3 zaboji', grid('crate', 4, 3, 1.1)], ['polje 5 × 4 sodi', grid('barrel', 5, 4, 0.8)]];
  const rows = []; for (const [ime, list] of S) for (const kmh of [60, 120]) rows.push(pileRun({ ime, list, kmh }));
  return { rows, text: table('več predmetov hkrati: kup, tresenje, strošek', 'kosov: živih predmetov na koncu; budnih: največ hkrati simuliranih; korakov: vsota budnih predmetov po korakih (strošek); mir: s do zadnjega mirnega; vsebi: pari, ki ležijo drug v drugem; blizu: najmanjša razdalja para / doseg para' + (TIMES ? '; us: mikrosekund na korak dirke z budnimi predmeti, usMir: brez njih' : ''),
    [['prizor', 'prizor'], ['kosov', 'kosov', 0], ['kmh', 'km/h', 0], ['n', 'n', 0], ['dv', 'dv', 1], ['dvp', 'dv%', 1], ['budnih', 'budnih', 0], ['korakov', 'korakov', 0], ['mir', 'mir'], ['voM', 'voM', 0], ['vsebi', 'vsebi', 0], ['blizu', 'blizu', 2], ...(TIMES ? [['us', 'us', 1], ['usMir', 'usMir', 1]] : [])], rows) };
};
PARTS.ograja = () => {
  const rows = []; for (const kind of ['cone', 'tyre', 'bale', 'barrel', 'mlamp', 'lamp']) for (const kmh of [120, 200]) rows.push(wallRun({ kind, kmh }));
  for (const del of ['hood', 'bumperF']) for (const kmh of [120, 200]) rows.push(wallRun({ del, kmh }));
  return { rows, text: table('predmet ob ograji: avto 20° proti ograji, predmet med njim in ograjo (ali ostane znotraj)', 'dv, dv%, vmin: proti istemu avtu, ki v ograjo zapelje brez predmeta; rob: najmanjša razdalja do črte ograje (m; negativno: toliko čez); skok: največji premik v koraku brez hitrosti (m: ograja ga postavi nazaj)',
    [['vrsta', 'vrsta'], ['m', 'kg', 0], ['kmh', 'km/h', 0], ['n', 'n', 0], ['dv', 'dv', 1], ['dvp', 'dv%', 1], ['vmin', 'vmin', 0], ['voM', 'voM', 0], ['h', 'h', 2], ['rob', 'rob', 2], ['skok', 'skok', 2], ['pot', 'pot'], ['mir', 'mir']], rows) };
};
PARTS.proga = () => {   // the same runs on Spa and Bathurst (their longest straights): the flat oval's numbers hold on a real track
  const rows = [];
  for (const tid of ['krog', 'spa', 'bathurst']) { const T = road(tid);
    for (const kind of ['cone', 'bale', 'bboard']) { const r = propRun({ T, kind, kmh: 120, off: 0 }); rows.push({ proga: tid, kaj: kind, n: r.n, dv: r.dv, dvp: r.dvp, voM: r.voM, vov: r.vov, h: r.h, pot: r.pot }); }
    for (const stanje of ['lezi', 'leti']) { const r = debRun({ T, part: 'hood', stanje, kmh: 120, off: 0 }); rows.push({ proga: tid, kaj: 'pokrov ' + stanje, n: r.n, dv: r.dv, dvp: r.dvp, voM: r.voM, vov: r.vov, h: r.h, pot: r.pot }); } }
  return { rows, text: table('ista meritev na ravnini (krog), v Spaju in Bathurstu (najdaljša ravnina proge), 120 km/h v sredino', null, [['proga', 'proga'], ['kaj', 'kaj'], ['n', 'n', 0], ['dv', 'dv', 2], ['dvp', 'dv%', 2], ['voM', 'voM', 0], ['vov', 'vo/v', 2], ['h', 'h', 2], ['pot', 'pot']], rows) };
};
PARTS.dirka = () => {
  const rows3 = []; for (const tid of ['spa', 'bathurst']) for (const [kind, gap] of [['cone', 0.9], ['bale', 1.6], ['bboard', 2.4]]) rows3.push(raceProps(tid, kind, gap));
  const rows = [['spa', 'formula'], ['spa', 'lm'], ['spa', 'car'], ['bathurst', 'formula'], ['bathurst', 'car']].map(([tid, st]) => raceRun(tid, st, 60)), ev = [].concat(...rows.map(r => r.ev)).sort((a, b) => b.dv - a.dv);
  return { rows: rows.map(r => Object.assign({}, r, { ev: undefined })), ev, rows3, text: table('dirka 13 avtov (tests/lib/sim.js, postavitev »race«, na plinu), vrsta predmetov čez cesto 250 m po štartni črti: koliko stane avte (proti isti dirki brez predmetov)',
    'avtov: koliko avtov je zadelo; nMed / nMax: koraki s stikom na avto; v0: povprečna hitrost ob prvem stiku; dv, dv%: povprečna izguba ob zadnjem stiku; dv%max: največja; zaostanek: metri za istim avtom v dirki brez predmetov 5 s po prvem stiku (povprečje, največ)',
    [['proga', 'proga'], ['vrsta', 'vrsta'], ['kosov', 'kosov', 0], ['avtov', 'avtov', 0], ['nMed', 'nMed', 0], ['nMax', 'nMax', 0], ['v0', 'v0', 0], ['dv', 'dv', 1], ['dvp', 'dv%', 1], ['dvpMax', 'dv%max', 1], ['zaostanek', 'zaostanek', 1], ['zaostanekMax', 'zaost.max', 1]], rows3) +
    '\n' + table('dirka s trkom (tests/lib/sim.js, postavitve »formula«, »lm«, »car«: igralčev avto trči, izgubi dele in pelje naprej; 13 avtov, 60 s): odpadli deli v dirki', 'kosov: odpadlih delov; hkrati: največ na cesti (omejitev 40); dogodkov: korakov s trkom avta v del, od tega povozenih (del je ležal); vsotaDv: skupaj izgubljenih km/h; najvec: največja izguba v enem koraku (%); premik.: povprečno delov v gibanju na korak; preizk.: parov avto–del na korak',
    [['proga', 'proga'], ['postavitev', 'postavitev'], ['s', 's', 0], ['kosov', 'kosov', 0], ['hkrati', 'hkrati', 0], ['dogodkov', 'dogodkov', 0], ['povozenih', 'povozenih', 0], ['vsotaDv', 'vsotaDv', 1], ['najvec', 'najvec %', 2], ['premikajocih', 'premik.', 1], ['preizkusov', 'preizk.', 0]], rows) +
    '\n' + table('isti avto in isti del: koraki s stikom (po izgubi, prvih 14)', 't0–t1: prvi in zadnji stik (s); n: korakov s stikom, od tega povozen (ležeč del); v0: hitrost ob prvem stiku; dv: vsa izguba hitrosti v korakih s stikom (km/h; z ograjo in gumami vred), dv% od v0; izr%: delež samih stikov po faktorju igre (min(6 %, 0,4 % × m) na korak)', [['proga', 'proga'], ['postavitev', 'postavitev'], ['avto', 'avto'], ['masa', 'kg', 0], ['del', 'del'], ['m', 'm', 1], ['t0', 't0', 2], ['t1', 't1', 2], ['n', 'n', 0], ['povozen', 'povozen', 0], ['v0', 'v0', 0], ['dv', 'dv', 1], ['dvp', 'dv%', 1], ['izr', 'izr%', 1]], ev.slice(0, 14)) };
};

const res = {}, texts = [];
for (const k of Object.keys(PARTS)) { if (ONLY && ONLY !== k) continue; const r = PARTS[k](); texts.push(r.text); delete r.text; res[k] = r; }
if (AS_JSON) console.log(JSON.stringify({ cv: CV, avto: CAR, deli: res }, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? null : typeof v === 'number' ? +v.toFixed(4) : v)));
else console.log(`Trki: avto v predmete (različica trkov: ${CV != null ? CV : 'privzeta'})` + texts.join('\n'));
