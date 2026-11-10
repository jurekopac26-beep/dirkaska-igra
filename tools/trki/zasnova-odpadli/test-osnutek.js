// Odpadli deli: the parts a car sheds (Race.spawnDebris, Core stepDebris with its numbers DEB, debrisHit) stop on the road as sheet metal,
// plastic and wheels do, not as on ice (the user's, 10. 11. 2026: »sedaj drajsajo še nekaj časa, kot da so na ledu«). Through the game's own
// Race, on a flat test road in three grounds (asphalt, grass, gravel: the road's own surface, def.surf) and on Spa:
//   - every kind of part at 60 / 120 / 200 km/h lies nearer and stops sooner than before (PREJ: the numbers of the tree before the change);
//     on grass sooner than on tarmac, on gravel sooner still
//   - a wheel is on its tread, upright, turning as the road turns it, goes further than the panels, then falls over and lies flat
//   - no piece gains speed, none is ever under the road, the barriers hold it, the list keeps 40 at most, the same throw ends the same
//   - a race in which no part comes off is the reference's to the last digit; pieces nobody touches change no car
//   - the car that shed a part is not touched by it in its first second (before: braked by it step after step); another car's part in its
//     way costs it one knock a pass; in every collision version (Nastavitve »Trki med avti«)
// (a piece lying on the road, driven over: tests/debris.test.js)
//   node tests/odpadli-deli.test.js            check
//   node tests/odpadli-deli.test.js --prej     print PREJ of the tree given (GAME_ROOT=<a tree from before the change>)
'use strict';
const path = require('path'), fs = require('fs');
const HR = process.env.DELI_HARNESS ? path.join(process.env.DELI_HARNESS, 'tests') : __dirname;   // (in tests/: __dirname; run from tools/trki/zasnova-odpadli/: DELI_HARNESS=<the absolute path of the tree>)
const { loadCore } = require(path.join(HR, 'lib', 'core.js'));
const SIM = require(path.join(HR, 'lib', 'sim.js'));
const C = loadCore(), DT = SIM.DT, KMH = 3.6, SEED = 20261110, SPEEDS = [60, 120, 200], NT = 12;
const MD = C.MODELS.find(m => m.id === 'sokol'), PT = C.partsOf(MD), DEB = C.DEB || null, EDGE = DEB ? DEB.edge : 0;
const PARTS = ['hood', 'trunk', 'doorL', 'bumperF', 'bumperR', 'fenderL', 'wing', 'mirrorL', 'headL', 'wheelFL', 'wheelRL'];
// before the change (js/core.js stepDebris of 6e6c6228: 6.5 m/s2 on the ground only, on every surface): the mean way m and time s of NT
// throws at 60, 120, 200 km/h on the flat tarmac road, these very throws (--prej prints it)
const PREJ = {
  hood: [[31.5, 3.22], [79.7, 5.01], [176.6, 7.41]],
  trunk: [[13.0, 2.20], [49.4, 4.00], [130.4, 6.39]], doorL: [[23.3, 2.81], [65.2, 4.55], [153.9, 6.92]],
  bumperF: [[29.2, 3.07], [75.6, 4.86], [170.1, 7.25]], bumperR: [[11.1, 1.97], [44.8, 3.77], [122.3, 6.16]], fenderL: [[28.8, 3.07], [74.9, 4.85], [169.0, 7.24]],
  wing: [[12.7, 2.17], [48.7, 3.96], [129.3, 6.36]], mirrorL: [[26.4, 2.98], [70.7, 4.73], [162.4, 7.11]], headL: [[29.5, 3.09], [76.1, 4.88], [170.9, 7.27]],
  wheelFL: [[27.7, 2.99], [73.0, 4.78], [165.9, 7.17]], wheelRL: [[12.5, 2.08], [46.9, 3.85], [125.4, 6.24]]
};
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const f = (x, k) => x.toFixed(k == null ? 1 : k), mean = (a) => a.reduce((p, c) => p + c, 0) / (a.length || 1);

// ---- the roads and the cars ----
function ovalPts(L, R) { const p = [], r = Math.PI / 180;
  for (let x = 0; x < L; x += 100) p.push([x, 0]);
  for (let a = -90; a < 90; a += 15) p.push([L + R * Math.cos(a * r), R + R * Math.sin(a * r)]);
  for (let x = L; x > 0; x -= 100) p.push([x, 2 * R]);
  for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]);
  return p; }
const GROUND = { asfalt: null, trava: 'grass', pesek: 'gravel' }, _roads = {};
// a flat road of the test's own (two 1.6 km straights, 6 m half width, the barriers 11.5 and 12.5 m from its middle; the class and every rule are the game's), its own surface the ground asked for; or a real track
function road(name) {
  if (_roads[name]) return _roads[name];
  let def = C.TRACKS.find(d => d.id === name);
  if (!def) { def = { id: 'deli-' + name, name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50 }; if (GROUND[name]) def.surf = [[-1e6, 1e6, GROUND[name]]]; }
  return (_roads[name] = new C.Track(def));
}
function straight(T) { let best = 0, b0 = 0, run = 0; for (let i = 0; i < T.N; i++) { if (Math.abs(T.k[i]) < 5e-4) { run++; if (run > best) { best = run; b0 = i - run + 1; } } else run = 0; } return b0 + Math.floor(best * 0.25); }
function put(c, T, i, v, turn) {   // at sample i, heading along the road turned by `turn`, v m/s along its heading
  const h = T.hd[i] + (turn || 0); c.place(T.px[i], T.pz[i], h); if (T.hasElev) { c.y = c.py = T.hy[i]; c.roadY = c.y; }
  c.locked = false; c.steer = 0; c.inSteer = c.inThr = c.inBrk = c.inHand = 0; c.digitalSteer = true; c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v;
  const M = c.m; for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
  c.q = T.query(c.x, c.z, i, c.q || {}); c.sPrev = c.q.s; c.dist = c.q.s - T.startS;
}
// a race of one car (the player's; at: parked at that sample), and a donor: a car of the same model that is not in the race
function lone(T, at) {
  Math.random = SIM.seeded(SEED);
  const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: MD, assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); race.start();
  if (at != null) put(race.player, T, at, 0);
  return race;
}
function donor(T, i, v, turn) { const D = new C.Car(MD, { phys: 'cs' }); put(D, T, i, v, turn); if (!T.hasElev) D.y = 0; return D; }
// the pose as js/render.js draws it (rotation.set(d.rx, -d.yaw, d.rz), order YXZ): R = Ry(-yaw) Rx(rx) Rz(rz), and the turning between two poses
function rot(d) { const cx = Math.cos(d.rx), sx = Math.sin(d.rx), cy = Math.cos(-d.yaw), sy = Math.sin(-d.yaw), cz = Math.cos(d.rz), sz = Math.sin(d.rz);
  return [cy * cz + sy * sx * sz, -cy * sz + sy * sx * cz, sy * cx, cx * sz, cx * cz, -sx, -sy * cz + cy * sx * sz, sy * sz + cy * sx * cz, cy * cx]; }
function omega(A, B) { const m = (i, j) => B[i * 3] * A[j * 3] + B[i * 3 + 1] * A[j * 3 + 1] + B[i * 3 + 2] * A[j * 3 + 2];
  return [(m(2, 1) - m(1, 2)) / (2 * DT), (m(0, 2) - m(2, 0)) / (2 * DT), (m(1, 0) - m(0, 1)) / (2 * DT)]; }
// the game's gravity for a piece, read off one in flight (Core does not give JUMP_G out)
const G = (() => { const T = road('asfalt'), race = lone(T, 1000); race.spawnDebris(donor(T, 150, 30), 'hood', SIM.seeded(1)); const d = race.debris[0], v0 = d.vy; race.step(DT); return (v0 - d.vy) / DT; })();

// n throws of each of the parts off the donor at sample i0 (v along the road turned by `turn`; nobody's parts: the donor is not in the race),
// every piece watched step by step until all rest (or secs): how far, how long, and what must hold of every step
const _q = {};
function throws(T, i0, kmh, parts, cnt, secs, turn, seed) {
  const orig = Math.random; try {
  const race = lone(T, (i0 + (T.N >> 1)) % T.N), P = race.player, D = donor(T, i0, kmh / KMH, turn), rnd = SIM.seeded(seed || SEED), S = [];
  for (let k = 0; k < cnt; k++) for (const p of parts) { race.spawnDebris(D, p, rnd); const d = race.debris[race.debris.length - 1]; d.by = null; d.byT = 0;
    S.push({ d, x: d.x, z: d.z, last: 0, restK: 0, gain: 0, bounce: -1, rise: 0, under: 0, room: 1e9, tread: 0, slip: 0, slipN: 0, up: 0, fwd: 0, fwdN: 0, apex: Infinity, top: d.y, rising: d.vy > 0 }); }
  for (let k = 1; k <= secs * 120; k++) {
    for (const s of S) { const d = s.d; s.sp0 = Math.hypot(d.vx, d.vz); s.vy0 = d.vy; s.g0 = d.ground; s.R0 = d.rest ? null : rot(d); s.r0 = d.roll; }
    P.inThr = 0; P.inBrk = 1; race.step(DT);
    let all = true;
    for (const s of S) { const d = s.d; if (s.restK || d.dead) continue;   // (dead: pushed off the list by the cap of 40)
      const sp = Math.hypot(d.vx, d.vz), W = d.wh || 0, re = W ? d.r : EDGE * d.r, uy = Math.cos(d.rx) * Math.cos(d.rz), yR = T.yAt(d.q), y = d.y - yR;
      if (sp >= 0.05) s.last = k;
      s.gain = Math.max(s.gain, sp - s.sp0);
      if (!s.g0 && d.vy > 0 && s.vy0 - G * DT <= 0) s.bounce = Math.max(s.bounce, d.vy + (s.vy0 - G * DT));           // (its speed up after a landing less its fall)
      s.under = Math.max(s.under, 0.02 + d.h * 0.5 * Math.abs(uy) + re * Math.sqrt(Math.max(0, 1 - uy * uy)) - y);     // (its middle against its own height at its tilt)
      if (d.vy > 0 && !d.ground && !s.rising) { s.rising = true; s.top = y; }
      if (s.rising && (d.vy <= 0 || d.ground)) { s.rising = false; s.rise = Math.max(s.rise, s.top - s.apex - Math.max(0, d.r - d.h * 0.5)); s.apex = Math.min(s.apex, s.top); }
      if (y > s.top) s.top = y;
      const g = T.query(d.x, d.z, d.q ? d.q.i : i0, _q); s.room = Math.min(s.room, (g.d > 0 ? g.br : g.bl) - Math.abs(g.d) - d.r * 0.5);
      if (d.roll === 1) s.tread++;
      if (sp > 1 && d.ground && s.g0 && s.R0) { const w = omega(s.R0, rot(d));
        if (d.roll === 1 && s.r0 === 1 && s.tread > 60) { s.slip += Math.hypot(d.vx + w[2] * d.r, d.vz - w[0] * d.r) / sp; s.slipN++; s.up = Math.max(s.up, Math.abs(uy)); }   // v + w x (-r y): its lowest point
        else if (!W && DEB && sp > DEB.vT) { s.fwd += (w[0] * d.vz - w[2] * d.vx) / sp * re / sp; s.fwdN++; } }   // w . (y x v^): end over end forward along its travel
      if (d.rest) s.restK = k; else all = false; }
    if (all) break; }
  return S.map(s => ({ part: s.d.part, far: Math.hypot(s.d.x - s.x, s.d.z - s.z), t: s.last * DT, rest: s.restK * DT, gain: s.gain, bounce: s.bounce, rise: s.rise, under: s.under, room: s.room, tread: s.tread * DT,
    slip: s.slipN ? s.slip / s.slipN : null, up: s.up, fwd: s.fwdN ? s.fwd / s.fwdN : null, roll: s.d.roll || 0, flat: Math.abs(Math.cos(s.d.rx) * Math.cos(s.d.rz)), line: SIM.stateLine(s.d), dead: s.d.dead }));
  } finally { Math.random = orig; }
}
// the car and its own parts: the race's car at sample i0 sheds them (Core.detachPart) and drives on; keep false: the pieces taken off the road as they land on the list (the same run without them)
function own(T, i0, parts, kmh, inp, secs, keep) {
  const orig = Math.random; try {
  const race = lone(T), P = race.player; put(P, T, i0, kmh / KMH); for (const p of parts) C.detachPart(P, p);
  let t1 = 0, hits = 0, shed = 0;
  for (let k = 1; k <= Math.round(secs * 120); k++) { P.hitWall = P.hitCar = P.hitDebris = 0; P.inThr = inp === 'plin' ? 1 : 0; P.inBrk = inp === 'zavora' ? 1 : 0; P.inSteer = 0; race.step(DT);
    shed = Math.max(shed, race.debrisId || 0);
    if (!keep && race.debris.length) { for (const d of race.debris) d.dead = true; race.debris.length = 0; }
    if (P.hitDebris > 0) { hits++; if (!t1) t1 = k * DT; } }
  return { v: Math.hypot(P.vx, P.vz), t1, hits, shed };
  } finally { Math.random = orig; }
}
// another car's part in the car's way: a donor 12 m ahead of the player's car, at its speed, sheds it; the steps the car is touched in and the share of its speed each takes
function knock(part, kmh, secs) {
  const orig = Math.random; try {
  const T = road('asfalt'), race = lone(T), P = race.player, v = kmh / KMH, hits = []; put(P, T, 150, v);
  race.spawnDebris(donor(T, 156, v), part, SIM.seeded(SEED));
  for (let k = 1; k <= secs * 120; k++) { P.hitDebris = 0; P.inThr = P.inBrk = P.inSteer = 0; const v0 = Math.hypot(P.vx, P.vz); race.step(DT); if (P.hitDebris > 0) hits.push({ t: +(k * DT).toFixed(3), loss: 1 - Math.hypot(P.vx, P.vz) / v0 }); }
  return hits;
  } finally { Math.random = orig; }
}

// ---- the flat road: every part, three speeds, three grounds ----
const CELL = {};
for (const g in GROUND) { if (process.argv.includes('--prej') && g !== 'asfalt') continue; for (const p of PARTS) for (const kmh of SPEEDS) CELL[g + '/' + p + '/' + kmh] = throws(road(g), 150, kmh, [p], NT, 60); }
const cell = (g, p, kmh) => CELL[g + '/' + p + '/' + kmh], far = (g, p, kmh) => mean(cell(g, p, kmh).map(r => r.far)), tim = (g, p, kmh) => mean(cell(g, p, kmh).map(r => r.t));
if (process.argv.includes('--prej')) { console.log('const PREJ = { ' + PARTS.map(p => p + ': [' + SPEEDS.map(v => '[' + f(far('asfalt', p, v)) + ', ' + f(tim('asfalt', p, v), 2) + ']').join(', ') + ']').join(', ') + ' };'); process.exit(0); }
const ALL = Object.keys(CELL).reduce((a, k) => a.concat(CELL[k]), []);
{
  let worstF = 0, worstT = 0, at = '';
  for (const p of PARTS) SPEEDS.forEach((v, i) => { const a = far('asfalt', p, v) / PREJ[p][i][0], b = tim('asfalt', p, v) / PREJ[p][i][1]; if (a > worstF) { worstF = a; at = p + ' ' + v; } worstT = Math.max(worstT, b); });
  check('every part at 60 / 120 / 200 km/h lies nearer and stops sooner than before on tarmac (at most 0.6 x the way, 0.7 x the time)', worstF <= 0.6 && worstT <= 0.7, `worst ${f(worstF, 2)} x the way (${at}), ${f(worstT, 2)} x the time`);
  const maxRest = Math.max(...ALL.map(r => r.rest || 99)), maxFar = Math.max(...ALL.map(r => r.far));
  check('every piece comes to rest, within 5 s and 70 m of where it came off, lying flat', ALL.every(r => r.rest > 0 && r.flat > 0.9998) && maxRest <= 5 && maxFar <= 70, `${ALL.length} throws: the longest ${f(maxRest, 2)} s, the furthest ${f(maxFar)} m`);
  let order = 0, cells = 0, wf = 0, wg = 0;
  for (const p of PARTS) for (const v of SPEEDS) { cells++; const ta = tim('asfalt', p, v), tg = tim('trava', p, v), tp = tim('pesek', p, v), fa = far('asfalt', p, v), fg = far('trava', p, v), fp = far('pesek', p, v);
    if (tg < ta && tp < tg && fg <= fa * 1.02 && fp <= fg * 1.02) order++; wg = Math.max(wg, tg / ta); wf = Math.max(wf, tp / tg); }
  check('on grass sooner than on tarmac, on gravel sooner than on grass (the time; the way no longer), every part and speed', order === cells, `${order} of ${cells} cells; grass at most ${f(wg, 2)} x tarmac's time, gravel ${f(wf, 2)} x grass's`);
  const front = (v) => Math.max(far('asfalt', 'hood', v), far('asfalt', 'bumperF', v), far('asfalt', 'fenderL', v)), wr = SPEEDS.map(v => far('asfalt', 'wheelFL', v) / front(v));
  check('a wheel goes further than the panels off the same end of the car (1.1 x at 60 km/h, 1.4 x at 120 and 200)', wr[0] >= 1.1 && wr[1] >= 1.4 && wr[2] >= 1.4, wr.map(x => f(x, 2)).join(' / ') + ' x the furthest of bonnet, front bumper, fender');
  const WH = ALL.filter(r => PT[r.part].wh != null), w120 = cell('asfalt', 'wheelFL', 120), slip = mean(WH.filter(r => r.slip != null).map(r => r.slip)), up = Math.max(...WH.map(r => r.up));
  check('a wheel is on its tread (the front one at 120 km/h for over a second), upright, turning as the road turns it (its lowest point under 0.15 x its speed), then falls and lies flat',
    WH.every(r => r.tread > 0 && r.roll === 2 && r.flat > 0.9998) && Math.min(...w120.map(r => r.tread)) > 1 && slip < 0.15 && up < 0.5 && ALL.every(r => PT[r.part].wh != null || r.roll === 0),
    `${WH.length} wheels: on the tread ${f(Math.min(...w120.map(r => r.tread)), 2)} s at least (front, 120 km/h), lowest point ${f(slip, 3)} x its speed, the most it leans |uy| ${f(up, 2)}`);
  const PAN = ALL.filter(r => r.fwd != null), fw = mean(PAN.map(r => r.fwd));
  check('a panel faster than it can lie down goes end over end forward along its travel (drawn turning with it)', PAN.length > 0 && fw > 0.1, `${PAN.length} throws, its edge at ${f(fw, 2)} x its speed on average`);
  const gain = Math.max(...ALL.map(r => r.gain)), bounce = Math.max(...ALL.map(r => r.bounce)), rise = Math.max(...ALL.map(r => r.rise));
  check('no piece gains speed: none faster along the road after a step, no bounce faster up than its fall, no top higher than the one before (but for a sheet rising on its edge)', gain < 1e-9 && bounce < 1e-6 && rise < 1e-6,
    `the most gained in a step ${gain.toExponential(1)} m/s, a bounce over its fall ${bounce.toExponential(1)} m/s, a top over the last ${rise.toExponential(1)} m`);
  const under = Math.max(...ALL.map(r => r.under));
  check('never under the road: its middle never lower than its own height at its tilt', under < 1e-6, `the deepest ${under.toExponential(1)} m`);
  const again = throws(road('asfalt'), 150, 120, ['hood'], NT, 60).concat(throws(road('trava'), 150, 200, ['wheelFL'], NT, 60)), first = cell('asfalt', 'hood', 120).concat(cell('trava', 'wheelFL', 200));
  check('no chance: the same throws again end the same to the last digit', again.length === first.length && again.every((r, i) => r.line === first[i].line), `${again.length} pieces`);
}
// ---- the barriers, the list ----
{
  const R = throws(road('asfalt'), 150, 120, ['hood', 'bumperF', 'wheelFL', 'mirrorL'], 6, 60, Math.PI / 3).concat(throws(road('asfalt'), 150, 200, ['hood', 'bumperF', 'wheelFL', 'mirrorL'], 6, 60, -Math.PI / 2.5));
  const room = Math.min(...R.map(r => r.room)), hit = R.filter(r => r.room < 0.05).length;
  check('thrown across the road at 120 and 200 km/h: the barriers hold every piece (none past the line), it gains nothing off them and comes to rest', room > -0.01 && hit >= R.length / 2 && R.every(r => r.rest > 0 && r.gain < 1e-9),
    `${hit} of ${R.length} reach a barrier, the least room ${f(room, 3)} m`);
  const S = road('spa'); let rm = 1e9, un = 0, mv = 0, cnt = 0;
  for (let i = 0; i < S.N; i += 250) for (const kmh of [120, 200]) { const Q = throws(S, i, kmh, ['hood', 'wheelFL'], 2, 30, 0, SEED + i); for (const r of Q) { cnt++; rm = Math.min(rm, r.room); un = Math.max(un, r.under); if (!r.rest) mv++; } }
  check('Spa, all round the lap (uphill, downhill, the barriers near): every piece at rest within 30 s, inside the barriers, never under the road', mv === 0 && rm > -0.01 && un < 1e-6, `${cnt} throws: still moving ${mv}, the least room ${f(rm, 3)} m, the deepest ${un.toExponential(1)} m`);
  const many = throws(road('asfalt'), 150, 60, ['mirrorL'], 45, 20);
  check('the road keeps 40 pieces at most: of 45 thrown the first five are gone', many.filter(r => r.dead).length === 5 && many.slice(0, 5).every(r => r.dead), `${many.filter(r => r.dead).length} gone`);
}
// ---- a race in which no part comes off; pieces nobody touches ----
{
  const ref = JSON.parse(fs.readFileSync(path.join(HR, 'golden', 'sim.json'), 'utf8'))['spa/race/cs'], r = SIM.runScenario(C, 'spa', 'race', 'cs');
  check('a race in which no part comes off (Spa, 13 cars, 60 s) is the reference\'s to the last digit (tests/golden/sim.json spa/race/cs)', !!ref && r.cover.loose === 0 && r.digest === ref.digest, `${r.digest}, parts shed ${r.cover.loose}`);
  const quiet = (pieces) => { const orig = Math.random; try { Math.random = SIM.seeded(7);
    const T = road('spa'), race = new C.Race(T, { numAI: 5, playerGrid: 3, laps: 2, playerModel: MD, assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); race.start();
    if (pieces) { const D = donor(T, (race.player.q.i + (T.N >> 1)) % T.N, 200 / KMH), rnd = SIM.seeded(SEED); for (let k = 0; k < 2; k++) for (const p of ['hood', 'bumperF', 'doorL', 'wheelFL', 'wheelRL', 'mirrorL']) race.spawnDebris(D, p, rnd); }
    const L = []; for (let k = 1; k <= 10 * 120; k++) { SIM.stepRace(C, race, k); if (k % 120 === 0) L.push(race.cars.map(c => SIM.stateLine(c) + '|' + (c.dents || []).map(SIM.stateLine).join('/')).join('\n')); }
    return { L: L.join('\n'), cnt: race.debris.length, rest: race.debris.every(d => d.rest) }; } finally { Math.random = orig; } };
  const a = quiet(false), b = quiet(true);
  check('twelve pieces thrown half a lap from the cars (Spa, 6 cars, 10 s): every car\'s state the same to the last digit as without them (a piece takes no random number)', a.cnt === 0 && b.cnt === 12 && b.rest && a.L === b.L, `pieces ${b.cnt}, all at rest ${b.rest}`);
}
// ---- the car and its own part; another car's part; every collision version ----
{
  const SETS = ['bumperF', 'hood', 'fenderL', 'wheelFL', 'mirrorL', 'bumperF+hood+fenderL+fenderR'], rows = [];
  for (const rd of ['asfalt', 'spa']) { const T = road(rd), i0 = rd === 'spa' ? straight(T) : 150;
    for (const ps of SETS) for (const kmh of [20, 60, 120, 200]) for (const inp of ['prosto', 'plin', 'zavora']) { const parts = ps.split('+'), A = own(T, i0, parts, kmh, inp, 1, true), B = own(T, i0, parts, kmh, inp, 1, false);
      rows.push({ id: rd + ' ' + ps + ' ' + kmh + ' ' + inp, hits: A.hits, dv: Math.abs(A.v - B.v), shed: A.shed >= parts.length /* (a bumper takes its lamps with it) */ }); } }
  const touched = rows.filter(r => r.hits > 0), dv = Math.max(...rows.map(r => r.dv));
  check('the car that sheds a part (bumper, bonnet, fender, wheel, mirror, four at once; 20 to 200 km/h; coasting, on the throttle, braking; flat road and Spa) is not touched by it in its first second: its speed after 1 s the same as without the piece',
    rows.every(r => r.shed) && touched.length === 0 && dv < 1e-9, `${rows.length} runs: touched ${touched.length}${touched.length ? ' (' + touched[0].id + ': ' + touched[0].hits + ' steps)' : ''}, the largest difference of speed ${dv.toExponential(1)} m/s`);
  const kb = knock('hood', 120, 5), km = knock('bumperF', 120, 5), kf = knock('trunk', 120, 5), lim = (m) => Math.min(0.06, m * 0.004) + 0.002;
  check('another car\'s part in the way (the bonnet, the front bumper, the boot lid of a car 12 m ahead, 120 km/h): one knock in 5 s (before: two), no more than before (the lesser of 6 % and 0.4 % a kg of the part)',
    kb.length === 1 && km.length === 1 && kf.length === 1 && kb[0].loss <= lim(PT.hood.m) && km[0].loss <= lim(PT.bumperF.m) && kf[0].loss <= lim(PT.trunk.m),
    `touched in ${kb.length} / ${km.length} / ${kf.length} steps, the speed lost ${[kb, km, kf].map(h => h.map(x => f(x.loss * 100, 2)).join('+') || '-').join(' / ')} %`);
  const base = throws(road('asfalt'), 150, 120, ['hood', 'wheelFL'], 4, 60).map(r => r.line).join('\n'); let okV = 0; const det = [];
  for (let cv = 1; cv < C.KV_IDS.length; cv++) { C.setTest({ cv });
    const A = own(road('asfalt'), 150, ['bumperF', 'hood', 'fenderL', 'fenderR'], 120, 'plin', 1, true), k = knock('hood', 120, 5), same = throws(road('asfalt'), 150, 120, ['hood', 'wheelFL'], 4, 60).map(r => r.line).join('\n') === base;
    if (A.hits === 0 && A.shed >= 4 && k.length === 1 && same) okV++; det.push(C.KV_IDS[cv] + ' ' + A.hits + '/' + k.length + (same ? '' : '/other')); }
  C.setTest({});
  check('in every collision version (Trki med avti): its own parts do not touch the car in its first second, another car\'s bonnet knocks it once, the pieces end the same', okV === C.KV_IDS.length - 1, det.join(', ') + ' (own touches / knocks)');
}
console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
