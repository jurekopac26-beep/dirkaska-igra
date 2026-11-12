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
//   - that time ends (its own part, a part it knocked away: untouched 1.5 s after, touched as any car 2.5 s after) and is each car's own:
//     two cars at one piece (side by side, a part between them or arriving between them) are touched once a piece, not step after step,
//     and a second car's knock does not lengthen the first one's time
//   - in that time the car does not drive through a part still moving: one in its way is shouldered aside, at no price to the car; the push
//     (DEB.push, under DEB_RUN.v) gives it no speed beyond what it had or the car's own and the push: a part between a standing car and
//     the barrier is not shot out along the gap, one between two standing cars lies at once and no car's ending time knocks it
//   - a spare wheel is a tyre like the vehicle's own: on its tread, then over and flat
//   - checks 25 to 40 (the independent check of 11. 11. 2026): no random number of the race, the banked bend, every ground of DEB's tables,
//     the push's size and what it is measured against, the cap's fix, the wheel's veer, wobble and knock, bounce and landing, the 2 s to the step
//     (a pass over a lying part begun in the car's time is not paid in its middle), the push no source of speed (O1, O2)
//   - checks 41 to 45: Nastavitve »Odpadli deli: Izklop« (Core TX.deb 0): a part comes off and flies the same to the last digit, no car
//     touches it (another car's part in the way, its own parts: the car's whole state after every step as with no part at all, no random
//     number more or less; under every one of the six versions of the knocks), a piece that has come to rest is off the road; a race in
//     which no part comes off is the reference's, a race with a crash is Vklop's to the last digit until a car first touches a piece there
// (a piece lying on the road, driven over: tests/debris.test.js)
//   node tests/odpadli-deli.test.js            check
//   node tests/odpadli-deli.test.js --prej     print PREJ of the tree given (GAME_ROOT=<a tree from before the change>)
'use strict';
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const HR = __dirname;
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
// ---- the exemption ends; two cars at one piece (the rule is each car's own: debrisHit, d.by) ----
// the car over a piece on the road `at` s after the piece left it (ownPart: its own front bumper, shed at 20 km/h; else another car's, knocked away by
// it at 120 km/h): put 5 m short of the piece `at` - 0.5 s after (or putK steps after), 10 m/s faster than it; the steps it is touched in within
// 1.5 s, the first one's (first s, firstK steps after) share of its speed, and over: the step it is first over the piece (as debrisHit tests it)
const onIt = (c, d) => { if (d.y - (c.y || 0) > 1.3) return false; const ch = Math.cos(c.h), sh = Math.sin(c.h), r = c.rad + d.r * 0.7;
  return c.circles.some(o => (d.x - c.x - ch * o) ** 2 + (d.z - c.z - sh * o) ** 2 < r * r); };
function meetAgain(ownPart, at, putK) {
  const orig = Math.random; try {
  const T = road('asfalt'), race = lone(T), P = race.player; let k = 0;
  const step = () => { P.hitDebris = 0; P.inThr = P.inBrk = P.inSteer = 0; race.step(DT); k++; return P.hitDebris > 0; };
  if (ownPart) { put(P, T, 150, 20 / KMH); C.detachPart(P, 'bumperF'); step(); }
  else { put(P, T, 150, 120 / KMH); race.spawnDebris(donor(T, 156, 120 / KMH), 'bumperF', SIM.seeded(SEED)); const d0 = race.debris[0]; let hit = false, lying = false;
    for (let i = 0; i < 360 && !hit; i++) { lying = d0.rest || (d0.ground && Math.hypot(d0.vx, d0.vz) < 3); hit = step(); }
    if (!hit || lying) return { err: hit ? 'run over lying, not knocked' : 'never knocked' }; }
  const t0 = k, d = race.debris[0];
  put(P, T, 1000, 0);                                               // (away: the piece comes to rest alone)
  while (putK != null ? k - t0 < putK : (k - t0) * DT < at - 0.5 - 1e-9) step();
  const i = T.query(d.x, d.z, -1, {}).i, h = T.hd[i], vp = 10 + Math.max(0, d.vx * Math.cos(h) + d.vz * Math.sin(h));
  put(P, T, i, vp); P.place(d.x - Math.cos(h) * 5, d.z - Math.sin(h) * 5, h); P.vx = Math.cos(h) * vp; P.vz = Math.sin(h) * vp; P.q = T.query(P.x, P.z, i, P.q);
  let hits = 0, first = 0, firstK = 0, loss = 0, over = 0;
  for (let j = 0; j < 180; j++) { const v0 = Math.hypot(P.vx, P.vz), hit = step(); if (!over && onIt(P, d)) over = k - t0;
    if (hit) { hits++; if (!first) { firstK = k - t0; first = firstK * DT; loss = 1 - Math.hypot(P.vx, P.vz) / v0; } } }
  return { hits, first, firstK, loss, m: d.m, over };
  } finally { Math.random = orig; }
}
// the player's car sheds `parts` at kmh; the other cars ([m behind it, m beside it] each, the same model) coast as it does (c.ctl: no driver): the steps each is touched in
function pack(kmh, parts, others, secs) {
  const orig = Math.random; try {
  Math.random = SIM.seeded(SEED);
  const T = road('asfalt'), race = new C.Race(T, { numAI: others.length, playerGrid: 1, laps: 99, playerModel: MD, fieldModel: MD, assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); race.start();
  const A = race.player, O = race.cars.filter(c => !c.isPlayer), v = kmh / KMH; put(A, T, 150, v);
  O.forEach((c, j) => { const [back, lat] = others[j]; c.ctl = () => {}; put(c, T, 150, v); c.place(A.x - Math.cos(A.h) * back - Math.sin(A.h) * lat, A.z - Math.sin(A.h) * back + Math.cos(A.h) * lat, A.h); c.vx = A.vx; c.vz = A.vz; c.q = T.query(c.x, c.z, -1, c.q || {}); });
  for (const p of parts) C.detachPart(A, p);
  const hits = race.cars.map(() => 0); let shed = 0;
  for (let k = 1; k <= secs * 120; k++) { for (const c of race.cars) { c.hitDebris = 0; c.inThr = c.inBrk = c.inSteer = 0; } race.step(DT); shed = Math.max(shed, race.debrisId || 0); race.cars.forEach((c, j) => { if (c.hitDebris > 0) hits[j]++; }); }
  return { A: hits[race.cars.indexOf(A)], O: O.map(c => hits[race.cars.indexOf(c)]), shed };
  } finally { Math.random = orig; }
}
{
  const lim = (m) => Math.min(0.06, (m || 0) * 0.004) + 0.005, said = (a, b) => a.err || b.err || `touched in ${a.hits} / ${b.hits} steps, the speed lost ${f(b.loss * 100, 2)} % at ${f(b.first, 2)} s`;
  const a = meetAgain(true, 1.5), b = meetAgain(true, 2.5);
  check('its own part on the road: the car that shed it runs over it untouched 1.5 s after and is touched as any car 2.5 s after (one touch)', !a.err && !b.err && a.hits === 0 && b.hits === 1 && b.loss > 0 && b.loss <= lim(b.m), said(a, b));
  const c = meetAgain(false, 1.5), e = meetAgain(false, 2.5);
  check('a part the car knocked away: the car runs over it untouched 1.5 s after the knock and is touched as any car 2.5 s after (one touch)', !c.err && !e.err && c.hits === 0 && e.hits === 1 && e.loss > 0 && e.loss <= lim(e.m), said(c, e));
  const R = []; for (const kmh of SPEEDS) for (const p of ['fenderR', 'doorR']) R.push(Object.assign({ id: kmh + ' ' + p }, pack(kmh, [p], [[0, 2.3]], 6)));
  const w = R.slice().sort((x, y) => (y.A + y.O[0]) - (x.A + x.O[0]))[0];
  check('two cars side by side (2.3 m), one sheds its right fender or door between them (60, 120, 200 km/h): the car that shed it is not touched by it, the other at most once a piece',
    R.every(r => r.shed >= 1 && r.A === 0 && r.O[0] <= r.shed), `${R.length} runs; the worst (${w.id}, ${w.shed} piece${w.shed > 1 ? 's' : ''}): the car that shed it touched in ${w.A} steps, the other in ${w.O[0]}`);
  const Q = []; for (const kmh of SPEEDS) for (const p of ['bumperR', 'bumperF', 'hood']) for (const back of [6, 8]) Q.push(Object.assign({ id: kmh + ' ' + p + ' ' + back + ' m' }, pack(kmh, [p], [[back, 1.15], [back, -1.15]], 6)));
  const most = (r) => Math.max(...r.O), v = Q.slice().sort((x, y) => (most(y) - y.shed) - (most(x) - x.shed))[0];
  check('a part arriving between two cars side by side 6 and 8 m behind the car that shed it (rear and front bumper, bonnet; 60, 120, 200 km/h): each of them touched at most once a piece',
    Q.every(r => r.shed >= 1 && r.A === 0 && most(r) <= r.shed), `${Q.length} runs; the worst (${v.id}, ${v.shed} piece${v.shed > 1 ? 's' : ''}): touched in ${v.O.join(' and ')} steps`);
}
// one piece, two cars one after the other: A knocks another car's front bumper away (120 km/h), B knocks it on 0.5 s later while it still
// flies or tumbles; then `who` (A or B) comes over it 2.1 to 2.4 s after A's knock, 20 m/s faster than it: the steps it is touched in
function twoKnocks(who) {
  const orig = Math.random; try {
  Math.random = SIM.seeded(SEED);
  const T = road('asfalt'), race = new C.Race(T, { numAI: 1, playerGrid: 1, laps: 99, playerModel: MD, fieldModel: MD, assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); race.start();
  const A = race.player, B = race.cars.find(c => !c.isPlayer); B.ctl = () => {}; let k = 0, tA = 0, tB = 0;
  const step = () => { for (const c of race.cars) { c.hitDebris = 0; c.inThr = c.inBrk = c.inSteer = 0; } race.step(DT); k++; };
  const behind = (c, d, gap, dv) => { const i = T.query(d.x, d.z, -1, {}).i, h = T.hd[i], vp = dv + Math.max(0, d.vx * Math.cos(h) + d.vz * Math.sin(h));   // gap m short of the piece, dv m/s faster than it
    put(c, T, i, vp); c.place(d.x - Math.cos(h) * gap, d.z - Math.sin(h) * gap, h); c.vx = Math.cos(h) * vp; c.vz = Math.sin(h) * vp; c.q = T.query(c.x, c.z, i, c.q); };
  const moving = (d) => !d.rest && !(d.ground && Math.hypot(d.vx, d.vz) < 3);   // (not lying: a touch is a knock, debrisHit)
  put(B, T, 2000, 0); put(A, T, 150, 120 / KMH); race.spawnDebris(donor(T, 156, 120 / KMH), 'bumperF', SIM.seeded(SEED)); const d = race.debris[0];
  for (let i = 0; i < 360 && !tA; i++) { const m = moving(d); step(); if (A.hitDebris > 0) { if (!m) return { err: 'A ran over it lying' }; tA = k; } }
  if (!tA) return { err: 'A never knocked it' };
  put(A, T, 1000, 0);
  while (k - tA < 36) step();
  behind(B, d, 5, 10);
  for (let i = 0; i < 120 && !tB; i++) { const m = moving(d); step(); if (B.hitDebris > 0) { if (!m) return { err: 'B ran over it lying' }; tB = k; } }
  if (!tB) return { err: 'B never knocked it' };
  put(B, T, 2000, 0);
  while (k - tA < 240) step();                                      // (2 s after A's knock: A's time is up, B's runs on)
  const c = who === 'A' ? A : B; behind(c, d, 5, 20);
  let hits = 0, first = 0; for (let i = 0; i < 60; i++) { step(); if (c.hitDebris > 0) { hits++; if (!first) first = (k - tA) * DT; } }
  return { hits, first, gap: (tB - tA) * DT };
  } finally { Math.random = orig; }
}
{
  const a = twoKnocks('A'), b = twoKnocks('B');
  check('each car its own time: a part knocked away by one car and 0.5 s later by another touches the first again 2 s after its own knock, while the second still passes over it untouched',
    !a.err && !b.err && a.gap >= 0.45 && a.hits === 1 && a.first > 2 && a.first < a.gap + 2 && b.hits === 0,
    a.err || b.err || `the second knock ${f(a.gap, 2)} s after the first; the first car touched in ${a.hits} step${a.hits === 1 ? '' : 's'} (${f(a.first, 2)} s after its knock), the second in ${b.hits}`);
}
// ---- its own part in its way: shouldered aside, not driven through (debrisHit, DEB.push) ----
// the car sheds front parts and drives on for 2 s: the steps in which a part still moving (flying, tumbling, scraping: not lying) has its middle
// deep inside the car (between its end circles, within 0.6 x its half width of its axis), after its first 0.1 s
function through(M, parts, kmh, inp) {
  const orig = Math.random; try {
  Math.random = SIM.seeded(SEED);
  const T = road('asfalt'), race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: M, assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); race.start();
  const P = race.player; put(P, T, 150, kmh / KMH); for (const p of parts) C.detachPart(P, p);
  let deep = 0, hits = 0;
  for (let k = 1; k <= 240; k++) { P.hitDebris = 0; P.inThr = 0; P.inBrk = inp === 'zavora' ? 1 : 0; P.inSteer = 0; race.step(DT); if (P.hitDebris > 0) hits++; if (k <= 12) continue;
    const ch = Math.cos(P.h), sh = Math.sin(P.h), c0 = P.circles[0], c1 = P.circles[P.circles.length - 1];
    for (const d of race.debris) { if (d.rest || (d.ground && Math.hypot(d.vx, d.vz) < 3) || d.y - (P.y || 0) > 1.3) continue;
      const dx = d.x - P.x, dz = d.z - P.z, lo = dx * ch + dz * sh, la = dz * ch - dx * sh; if (lo > c0 && lo < c1 && Math.abs(la) < 0.6 * P.rad) deep++; } }
  return { deep, hits };
  } finally { Math.random = orig; }
}
{
  const rows = [];
  for (const id of ['sokol', 'tiger']) { const M = C.MODELS.find(m => m.id === id);
    for (const ps of ['bumperF', 'hood', 'bumperF+hood+fenderL+fenderR']) for (const kmh of SPEEDS) for (const inp of ['prosto', 'zavora']) rows.push(Object.assign({ id: id + ' ' + ps + ' ' + kmh + ' ' + inp }, through(M, ps.split('+'), kmh, inp))); }
  const w = rows.slice().sort((a, b) => b.deep - a.deep)[0], sum = rows.reduce((a, r) => a + r.deep, 0), hits = rows.reduce((a, r) => a + r.hits, 0);
  check('the car does not drive through its own parts (front bumper, bonnet, four front parts at once; a car and a kit car; 60, 120, 200 km/h; coasting, braking): one still moving in its way is shouldered aside (deep inside the car for 0.3 s at most a run: the push of 2.5 m/s, under DEB_RUN.v, clears it later than 4 did, 0.12 s), and the car is not touched',
    rows.every(r => r.deep <= 36) && hits === 0, `${rows.length} runs: ${sum} steps of a part deep inside its car in all, the worst ${w.deep} (${w.id}); the car touched in ${hits} steps`);
}
// ---- a spare wheel (a part with spare: 1; a tyre like the vehicle's own): on its tread like a wheel, not a panel ----
{
  const orig = Math.random, T = road('asfalt'), det = []; let cnt = 0, wh = 0, tread = 0, flat = 0, sink = 0;
  try { for (const id of ['kamen', 'medved', 'pescenjak', 'cisterna']) { const M = C.MODELS.find(m => m.id === id), P = C.partsOf(M), SP = Object.keys(P).filter(p => P[p].spare);
    const race = lone(T, 1000), D = new C.Car(M, { phys: 'cs' }), rnd = SIM.seeded(SEED), S = []; put(D, T, 150, 120 / KMH); D.y = 0; if (D.tl) { C.tlPlace(D, T); D.tl.vx = D.vx; D.tl.vz = D.vz; }
    for (let k = 0; k < 4; k++) for (const p of SP) { race.spawnDebris(D, p, rnd); const d = race.debris[race.debris.length - 1]; d.by = null; d.byT = 0; S.push({ d, x: d.x, z: d.z, tread: 0, sink: 0 }); }
    for (let k = 1; k <= 30 * 120 && !S.every(s => s.d.rest); k++) { race.player.inBrk = 1; race.step(DT);
      for (const s of S) { const d = s.d, uy = Math.cos(d.rx) * Math.cos(d.rz); if (d.roll === 1) s.tread++;
        if (!d.rest) s.sink = Math.max(s.sink, T.yAt(d.q) + 0.02 - (d.y - d.h * 0.5 * Math.abs(uy) - d.r * Math.sqrt(Math.max(0, 1 - uy * uy)))); } }   // (the tyre's true rim, radius r, against the road)
    for (const s of S) { const d = s.d; cnt++; if (d.wh === 1 || d.wh === -1) wh++; if (s.tread > 0 && d.roll === 2) tread++; if (d.rest && Math.abs(Math.cos(d.rx) * Math.cos(d.rz)) > 0.9998) flat++; sink = Math.max(sink, s.sink); }
    det.push(id + ' ' + SP.length + ' (' + f(mean(S.map(s => Math.hypot(s.d.x - s.x, s.d.z - s.z)))) + ' m)'); }
  } finally { Math.random = orig; }
  check('a spare wheel that comes off (the off-roader\'s, the pick-up\'s, the buggy\'s, the semi-trailer\'s; 120 km/h) is a tyre like the vehicle\'s own: on its tread, then over and flat, its rim never in the road',
    cnt > 0 && wh === cnt && tread === cnt && flat === cnt && sink < 1e-6, `${cnt} throws: a wheel ${wh}, on the tread then fallen ${tread}, at rest flat ${flat}, its rim at most ${f(sink * 100, 1)} cm in the road; ${det.join(', ')}`);
}
// ==== checks 25 to 40 (from the independent check of the finished code, 11. 11. 2026) ====
// Each fails on a changed js/core.js that checks 1 to 24 let through (the name of that change in brackets): a piece drawing a random number of
// the race, the banked bend dropped from a piece's height, a ground of DEB's tables turned to ice, a push of another size or measured against
// the road, the cap's fix, a wheel's veer, wobble and knock, the bounce by ground, the landing's keep, the tumbling throw by throw, the 2 s
// and a pass paid in its middle (K2), the push without its limit (O1) or over DEB_RUN.v (O2).

// ---- 25, 26: the pieces take no random number of the race [rand_extra, rand_land] ----
// Check 14 cannot see a draw: it steps with SIM.stepRace, which seeds Math.random anew before every step, so a number taken in one step
// changes nothing in the next. Here the numbers are counted (Core's rand() is Math.random in a race that is not a replay): the same run
// with the pieces on the road and with them taken off it asks Math.random exactly as often.
// The car travels along the road at kmh, pointing `slip` rad off its travel (0: straight; else it slides), sheds `parts` and goes on 1.9 s
// (its own time, DEB.own, is 2 s). keep false: the pieces taken off the road as they land on the list.
// Also what the push does (checks 30, 31): a panel's own step only scales its speed along the road (stepDebris), so a panel whose travel
// turns in a step, away from the barriers, was shouldered aside in it: `off` is the most its speed across the car, against the car,
// differs from DEB.push after such a step, `fast` the most that speed is (the number itself is checked too: at most 5 m/s, a shove, not a shot)
function shoulder(kmh, slip, parts, inp, keep) {
  const orig = Math.random; try {
  const T = road('asfalt'), race = lone(T), P = race.player, v = kmh / KMH, h0 = T.hd[150], g = Math.random; let drawn = 0;
  Math.random = () => { drawn++; return g(); };
  put(P, T, 150, v, slip); P.vx = Math.cos(h0) * v; P.vz = Math.sin(h0) * v; for (const p of parts) C.detachPart(P, p);
  let hits = 0, pushes = 0, off = 0, fast = 0, deep = 0, shed = 0;
  for (let k = 1; k <= 228; k++) {
    const pre = race.debris.map(d => [d, d.vx, d.vz]);
    P.hitDebris = 0; P.inThr = 0; P.inBrk = inp === 'zavora' ? 1 : 0; P.inSteer = 0; race.step(DT); if (P.hitDebris > 0) hits++; shed = Math.max(shed, race.debrisId || 0);
    const ch = Math.cos(P.h), sh = Math.sin(P.h), c0 = P.circles[0], c1 = P.circles[P.circles.length - 1];
    for (const [d, vx, vz] of pre) { if (d.wh || d.dead) continue;
      const q = T.query(d.x, d.z, d.q ? d.q.i : 150, _q); if ((q.d > 0 ? q.br : q.bl) - Math.abs(q.d) - d.r * 0.5 < 1) continue;   // (a barrier turns it too)
      if (Math.abs(vx * d.vz - vz * d.vx) <= 1e-9 * (1 + Math.hypot(vx, vz) * Math.hypot(d.vx, d.vz))) continue;
      const la = (d.z - P.z) * ch - (d.x - P.x) * sh, s = la < -0.05 ? -1 : la > 0.05 ? 1 : (d.id & 1 ? 1 : -1), rel = ((d.vz - P.vz) * ch - (d.vx - P.vx) * sh) * s;   // (the side as debrisHit picks it)
      pushes++; off = Math.max(off, Math.abs(rel - DEB.push)); fast = Math.max(fast, rel); }
    if (k > 12) for (const d of race.debris) { if (d.rest || (d.ground && Math.hypot(d.vx, d.vz) < 3) || d.y - (P.y || 0) > 1.3) continue;   // (deep inside the car: as check 23 counts it)
      const dx = d.x - P.x, dz = d.z - P.z, lo = dx * ch + dz * sh, la = dz * ch - dx * sh; if (lo > c0 && lo < c1 && Math.abs(la) < 0.6 * P.rad) deep++; }
    if (!keep && race.debris.length) { for (const d of race.debris) d.dead = true; race.debris.length = 0; } }
  return { drawn, hits, pushes, off, fast, deep, shed };
  } finally { Math.random = orig; }
}
// twelve pieces nobody touches (the car parked 1.7 km away), until all rest: the numbers Math.random gave (pieces false: the same steps without them)
function quietDraws(pieces, steps) {
  const orig = Math.random; try {
  const T = road('asfalt'), race = lone(T, 1000), g = Math.random; let drawn = 0, k = 0;
  if (pieces) { const D = donor(T, 150, 200 / KMH), rnd = SIM.seeded(SEED); for (let j = 0; j < 2; j++) for (const p of ['hood', 'bumperF', 'doorL', 'wheelFL', 'wheelRL', 'mirrorL']) race.spawnDebris(D, p, rnd); }
  Math.random = () => { drawn++; return g(); };
  const n2 = steps || 20 * 120; while (k < n2) { k++; race.player.inBrk = 1; race.step(DT); if (!steps && race.debris.every(d => d.rest)) break; }
  return { drawn, steps: k, rest: race.debris.every(d => d.rest), cnt: race.debris.length };
  } finally { Math.random = orig; }
}
const FOUR = ['bumperF', 'hood', 'fenderL', 'fenderR'];
{
  const b = quietDraws(true), a = quietDraws(false, b.steps);
  check('twelve pieces flying, landing, rolling and scraping to rest with no car near take no random number: Math.random is asked as often as in the same steps without them',
    b.cnt === 12 && b.rest && a.steps === b.steps && a.drawn === b.drawn, `${b.steps} steps: ${b.drawn} numbers with the pieces, ${a.drawn} without`);
  const rows = []; for (const kmh of [120, 200]) for (const inp of ['prosto', 'zavora']) { const A = shoulder(kmh, 0, FOUR, inp, true), B = shoulder(kmh, 0, FOUR, inp, false); rows.push({ id: kmh + ' ' + inp, A, B }); }
  const w = rows.find(r => r.A.drawn !== r.B.drawn) || rows[0], pushes = rows.reduce((s, r) => s + r.A.pushes, 0);
  check('the car shouldering its own four front parts aside (120, 200 km/h; coasting, braking; 1.9 s) takes no random number for it: Math.random is asked as often as in the same run with the pieces taken off the road (the throw\'s own numbers: both)',
    rows.every(r => r.A.shed >= 4 && r.A.drawn === r.B.drawn && r.A.drawn >= 20 && r.A.hits === 0) && pushes > 0,
    `${rows.length} runs, ${pushes} steps with a push; ${w.id}: ${w.A.drawn} numbers with the pieces, ${w.B.drawn} without`);
}

// ---- 27: on a banked bend a piece lies on the banked road [nobank] ----
// (the Nordschleife's banked bends, the only banking on a real track: Track.bank, bankAt; the test's flat roads and Spa have none)
{
  const orig = Math.random, T = road('nring'), _b = {}; let ib = 0, cnt = 0, rest = 0, off = 0, under = 0, banked = 0, most = 0;
  for (let i = 0; i < T.N; i++) if (T.bank && T.bank[i] > T.bank[ib]) ib = i;
  try { for (const turn of [0.5, -0.5, 0]) { const race = lone(T, (ib + (T.N >> 1)) % T.N), D = donor(T, ib, 50 / KMH, turn), rnd = SIM.seeded(SEED + 1), S = [];
    for (let k = 0; k < 3; k++) for (const p of ['hood', 'bumperF', 'wheelFL', 'mirrorL']) { race.spawnDebris(D, p, rnd); const d = race.debris[race.debris.length - 1]; d.by = null; d.byT = 0; S.push(d); }
    const road0 = (d) => T.yAt(d.q) + T.bankAt(d.q.s, d.q.d, _b).dy;
    for (let k = 1; k <= 30 * 120 && !S.every(d => d.rest); k++) { race.player.inBrk = 1; race.step(DT);
      for (const d of S) { if (d.rest) continue; const uy = Math.cos(d.rx) * Math.cos(d.rz), re = d.wh ? d.r : EDGE * d.r;
        under = Math.max(under, road0(d) + 0.02 + d.h * 0.5 * Math.abs(uy) + re * Math.sqrt(Math.max(0, 1 - uy * uy)) - d.y); } }
    for (const d of S) { cnt++; if (!d.rest) continue; rest++; const dy = T.bankAt(d.q.s, d.q.d, _b).dy; const uy = Math.cos(d.rx) * Math.cos(d.rz), re = d.wh ? d.r : EDGE * d.r; off = Math.max(off, Math.abs(d.y - (road0(d) + 0.02 + d.h * 0.5 * Math.abs(uy) + re * Math.sqrt(Math.max(0, 1 - uy * uy))))); most = Math.max(most, Math.abs(dy)); if (Math.abs(dy) > 0.05) banked++; } }
  } finally { Math.random = orig; }
  check('on a banked bend (the Nordschleife\'s steepest) a piece lies on the banked road: at rest its middle its own height (at its tilt) over the road as banked there, never under it on the way',
    !!T.bank && rest === cnt && banked >= cnt / 3 && off < 1e-6 && under < 1e-6, `${cnt} throws at sample ${ib}: ${banked} at rest where the banking moves the road over 5 cm (the most ${f(most, 2)} m); off the banked road by ${off.toExponential(1)} m at most, under it ${under.toExponential(1)} m`);
}

// ---- 28: every ground the game has (T.surface's codes 0 .. 8) [makadam_ice, kerb_ice] ----
// (a code past the tables, DEB's fallback to tarmac [nofallback], cannot be checked this way and cannot happen in the game: with surface() answering 9
// the parked car's own step throws first, Car.stepCS: CSSURF[9] is undefined)
// (the test's grounds are asphalt, grass, gravel: 0, 2, 3. A kerb 1, paving 4, makadam 5, a puddle on it 6, cobbles 7 and wet cobbles 8 are
// never under a piece in the 24 checks; makadam is the road of real stages.) A road that is the asked ground everywhere: the flat road, its
// surface() answering the code
const coded = (code) => { const T = new C.Track(road('asfalt').def); T.surface = () => code; return T; };
{
  const NAME = ['asphalt', 'kerb', 'grass', 'gravel', 'paving', 'makadam', 'puddle', 'cobbles', 'wet cobbles'], R = [];
  for (let code = 0; code <= 8; code++) { const T = coded(code), h = throws(T, 150, 120, ['hood'], NT, 60), w = throws(T, 150, 120, ['wheelFL'], NT, 60);
    R.push({ code, th: mean(h.map(r => r.t)), tw: mean(w.map(r => r.t)), fh: mean(h.map(r => r.far)), fw: mean(w.map(r => r.far)), rest: h.concat(w).every(r => r.rest > 0 && r.flat > 0.9998) }); }
  const A = R[0], Gr = R[2], Pe = R[3], within = (r) => r.th <= A.th * 1.0001 && r.tw <= A.tw * 1.0001 && r.th >= Pe.th * 0.9999 && r.tw >= Pe.tw * 0.9999 && r.fh <= A.fh * 1.02 && r.fw <= A.fw * 1.02;
  const soft = (r) => r.th < A.th && r.tw < A.tw && r.th > Gr.th && r.tw > Gr.tw;
  check('on every ground the game has (kerb, paving, makadam, a puddle, cobbles dry and wet) a bonnet and a wheel at 120 km/h come to rest, no later and no further than on tarmac, no sooner than in gravel; on makadam and in a puddle sooner than on tarmac, later than on grass',
    R.every(r => r.rest && within(r)) && soft(R[5]) && soft(R[6]), R.map(r => `${NAME[r.code]} ${f(r.th, 2)} / ${f(r.tw, 2)} s`).join(', ') + ' (bonnet / wheel)');
}

// ---- 29: the cap's own fix: a piece pushed off the list while it still rolls or tumbles is not left "on the ground" [cap_nofix] ----
// (js/render.js keeps a dead piece drawn while d.rest || d.ground, with the wrecks kept on the road: one frozen on its edge would stand there)
{
  const orig = Math.random; let r = {};
  try { const T = road('asfalt'), race = lone(T, 1000), rnd = SIM.seeded(SEED), D = donor(T, 150, 120 / KMH), tilt = (d) => Math.abs(Math.cos(d.rx) * Math.cos(d.rz));
    const go = (n) => { for (let k = 0; k < n; k++) { race.player.inBrk = 1; race.step(DT); } };
    for (let k = 0; k < 10; k++) for (const p of ['wheelFL', 'hood', 'bumperF', 'wheelRL']) race.spawnDebris(D, p, rnd);
    const A = race.debris.slice(0, 12); go(150);                                              // 1.25 s on: the wheels on their treads, the panels end over end
    const up = A.filter(d => !d.rest && d.ground && tilt(d) < 0.94);
    for (let k = 0; k < 12; k++) race.spawnDebris(D, 'mirrorL', rnd);                          // twelve more: the first twelve go
    r = { n: up.length, gone: A.every(d => d.dead) && race.debris.length === 40, off: up.filter(d => !d.ground).length };
    for (let k = 0; k < 40 && !race.debris.every(d => d.rest); k++) go(120);
    const B = race.debris.slice(0, 5); r.lay = B.every(d => d.rest && d.ground);
    for (let k = 0; k < 5; k++) race.spawnDebris(D, 'mirrorL', rnd);                           // five more: five lying at rest go, and stay as they lie
    r.stay = B.every(d => d.dead && d.rest && d.ground);
  } finally { Math.random = orig; }
  check('the cap of 40: a piece pushed off the list while it rolls or tumbles on the road is no longer "on the ground" (not left drawn on its edge); one pushed off at rest stays as it lies',
    r.gone && r.n > 0 && r.off === r.n && r.lay && r.stay, `${r.n} of the first twelve rolling or tumbling when pushed off: ${r.off} off the ground; five at rest pushed off: ${r.stay ? 'still at rest' : 'changed'}`);
}

// ---- 30, 31: the push is DEB.push across the car, against the car, a shove and not a shot [push_40, push_abs, push_radial] ----
{
  const S = [], Z = [];
  for (const kmh of [60, 120, 200]) for (const inp of ['prosto', 'zavora']) S.push(Object.assign({ id: kmh + ' ' + inp }, shoulder(kmh, 0, FOUR, inp, true)));
  for (const kmh of [60, 120, 200]) for (const slip of [0.5, -0.5, 1.2]) Z.push(Object.assign({ id: kmh + ' km/h, ' + slip + ' rad' }, shoulder(kmh, slip, FOUR, 'prosto', true)));
  const sum = (a, k) => a.reduce((s, r) => s + r[k], 0), worst = (a) => a.slice().sort((x, y) => y.off - x.off)[0], ws = worst(S), wz = worst(Z), wd = Z.slice().sort((x, y) => y.deep - x.deep)[0];
  check('a part shouldered aside by its car driving straight (four front parts; 60, 120, 200 km/h; coasting, braking) leaves it at DEB.push m/s across the car, 5 m/s at most (a shove, not a shot); the car is not touched',
    sum(S, 'pushes') > 0 && S.every(r => r.off < 1e-6 && r.fast <= 5 && r.hits === 0 && r.shed >= 4), `${S.length} runs, ${sum(S, 'pushes')} steps with a push: its speed across the car ${f(Math.max(...S.map(r => r.fast)), 2)} m/s at most (5 allowed), off DEB.push by ${ws.off.toExponential(1)} at most (${ws.id})`);
  check('the same of a car sliding (pointing 0.5, -0.5, 1.2 rad off its travel; 60, 120, 200 km/h): the push is against the car, not against the road, the car is not touched and does not drive through the parts (deep inside it for 0.25 s at most a run)',
    sum(Z, 'pushes') > 0 && Z.every(r => r.off < 1e-6 && r.fast <= 5 && r.hits === 0 && r.shed >= 4 && r.deep <= 30), `${Z.length} runs, ${sum(Z, 'pushes')} steps with a push: ${f(Math.max(...Z.map(r => r.fast)), 2)} m/s across the car at most, off DEB.push by ${wz.off.toExponential(1)} at most (${wz.id}); deep inside the car ${sum(Z, 'deep')} steps in all, the worst ${wd.deep} (${wd.id})`);
}

// ---- 32, 33: a wheel turns towards the side of the car it came off, and wobbles [veer0, veer_flip, wh_side, nowobble] ----
// NT throws straight along the road at 120 km/h: how far its travel turns while it rolls on its tread on the ground (rad; + towards the car's +lz side)
function veers(part) {
  const orig = Math.random; try {
  const T = road('asfalt'), race = lone(T, 1000), D = donor(T, 150, 120 / KMH), rnd = SIM.seeded(SEED), S = [];
  for (let k = 0; k < NT; k++) { race.spawnDebris(D, part, rnd); const d = race.debris[race.debris.length - 1]; d.by = null; d.byT = 0; S.push({ d, turn: 0 }); }
  for (let k = 1; k <= 20 * 120 && !S.every(s => s.d.rest); k++) {
    for (const s of S) { const d = s.d; s.vx = d.vx; s.vz = d.vz; s.on = d.roll === 1 && d.ground; }
    race.player.inBrk = 1; race.step(DT);
    for (const s of S) { const d = s.d; if (s.on && d.roll === 1 && d.ground && Math.hypot(d.vx, d.vz) > 0.5) s.turn += Math.atan2(s.vx * d.vz - s.vz * d.vx, s.vx * d.vx + s.vz * d.vz); } }
  return S.map(s => s.turn);
  } finally { Math.random = orig; }
}
{
  const WHS = Object.keys(PT).filter(p => PT[p].wh != null), V = WHS.map(p => ({ p, lz: PT[p].lz, t: veers(p) }));
  check('a wheel rolling on its tread turns towards the side of the car it came off (left wheels one way, right wheels the other; every throw, over 0.3 rad)',
    V.length === 4 && V.some(v => v.lz < 0) && V.some(v => v.lz > 0) && V.every(v => v.t.every(t => t * v.lz > 0 && Math.abs(t) > 0.3)), V.map(v => `${v.p} ${f(mean(v.t), 2)}`).join(', ') + ' rad (+: towards +lz)');
  const WH = ALL.filter(r => PT[r.part].wh != null), up = WH.map(r => r.up).filter(x => x > 0);
  const lean = up.filter(x => x > 0.2).length;
  check('a rolling wheel wobbles: it leans off the upright as it slows (|uy| over 0.2 at its most, at least half of the wheels that rolled a while)', up.length > WH.length / 2 && lean >= up.length / 2, `${up.length} wheels: ${lean} lean over 0.2; the most each leans |uy| ${f(Math.min(...up), 2)} .. ${f(Math.max(...up), 2)}`);
}

// ---- 34: a car's knock takes a wheel off its tread until it lands again [knock_keeproll] ----
// a wheel thrown at 120 km/h; once it rolls on the road on its tread (over 4.5 m/s: under 3 it would be run over as a lying piece) the car comes up its line 3.5 m behind it, 10 m/s faster
{
  const orig = Math.random; let r = { err: 'the wheel never rolled' };
  try { const T = road('asfalt'), race = lone(T, 1000), P = race.player;
    race.spawnDebris(donor(T, 150, 120 / KMH), 'wheelFL', SIM.seeded(SEED)); const d = race.debris[0]; d.by = null; d.byT = 0;
    const step = () => { P.hitDebris = 0; P.inThr = P.inBrk = P.inSteer = 0; race.step(DT); return P.hitDebris > 0; };
    let k = 0; while (k++ < 600 && !d.rest && !(d.roll === 1 && d.ground && Math.hypot(d.vx, d.vz) > 4.5)) step();
    if (d.roll === 1 && d.ground && !d.rest) { r = { err: 'never knocked' };
      const sp = Math.hypot(d.vx, d.vz), h = Math.atan2(d.vz, d.vx), i = T.query(d.x, d.z, -1, {}).i;
      put(P, T, i, sp + 10); P.place(d.x - Math.cos(h) * 3.5, d.z - Math.sin(h) * 3.5, h); P.vx = Math.cos(h) * (sp + 10); P.vz = Math.sin(h) * (sp + 10); P.q = T.query(P.x, P.z, i, P.q);
      let kn = false, air = 0, bad2 = 0, again = false;
      for (k = 0; k < 30 * 120 && !d.rest; k++) { const r0 = d.roll, hit = step();
        if (!kn) { if (hit) { kn = true; r = { was: r0, at: d.roll, up: !d.ground }; put(P, T, 1000, 0); } else if (k > 240) break; continue; }
        if (!again) { if (d.roll === 1) again = true; else { air++; if (d.ground || d.roll !== 0) bad2++; } } }
      if (kn) Object.assign(r, { air, bad: bad2, again, end: d.roll, flat: d.rest && Math.abs(Math.cos(d.rx) * Math.cos(d.rz)) > 0.9998 }); }
  } finally { Math.random = orig; }
  check('a wheel rolling on its tread knocked on by a car (the car up its line, 10 m/s faster) is off its tread while it flies (roll 0), on it again from its landing, then falls and lies flat',
    !r.err && r.was === 1 && r.at === 0 && r.up && r.air > 0 && r.bad === 0 && r.again && r.end === 2 && r.flat, r.err || `roll ${r.was} before the knock, ${r.at} after; ${r.air} steps in the air off its tread; on it again ${r.again}; at rest roll ${r.end}, flat ${r.flat}`);
}

// ---- 35, 36: a landing: the ground's own bounce, and the share of its speed it keeps [sE_one, land_tarmac, nobounce, keep0] ----
// bonnets and front bumpers thrown at kmh on a ground: the mean of each one's first bounce over its fall, and the least share of its speed along the road any landing leaves a piece
function lands(T, kmh) {
  const orig = Math.random; try {
  const race = lone(T, 1000), D = donor(T, 150, kmh / KMH), rnd = SIM.seeded(SEED), S = [];
  for (let k = 0; k < NT; k++) for (const p of ['hood', 'bumperF']) { race.spawnDebris(D, p, rnd); const d = race.debris[race.debris.length - 1]; d.by = null; d.byT = 0; S.push({ d, e: -1 }); }
  let keep = 1, cnt = 0;
  for (let k = 1; k <= 20 * 120 && !S.every(s => s.d.rest); k++) {
    for (const s of S) { const d = s.d; s.sp0 = Math.hypot(d.vx, d.vz); s.vy0 = d.vy; s.g0 = d.ground; }
    race.player.inBrk = 1; race.step(DT);
    for (const s of S) { const d = s.d, vn = -(s.vy0 - G * DT); if (s.g0 || vn <= 0 || !(d.ground || d.vy > 0)) continue;   // a landing: it fell, now it is on the ground or on its way up
      if (s.e < 0) s.e = Math.max(0, d.vy) / vn; if (s.sp0 > 1) { cnt++; keep = Math.min(keep, Math.hypot(d.vx, d.vz) / s.sp0); } } }
  return { e: mean(S.filter(s => s.e >= 0).map(s => s.e)), keep, cnt };
  } finally { Math.random = orig; }
}
{
  const a = lands(coded(0), 120), g = lands(coded(2), 120), p = lands(coded(3), 120);
  check('a panel thuds into grass and a gravel bed: its first bounce (over its fall) lower on grass than on tarmac, lower still in gravel', a.e > 0.1 && g.e < a.e * 0.8 && p.e < g.e * 0.8, `tarmac ${f(a.e, 2)}, grass ${f(g.e, 2)}, gravel ${f(p.e, 2)} x its fall`);
  const slow = [20, 30, 45].map(kmh => lands(coded(0), kmh)), least = Math.min(...slow.map(r => r.keep)), cnt = slow.reduce((s, r) => s + r.cnt, 0);
  check('a landing on tarmac never stops a piece dead: it keeps at least a quarter of its speed along the road (bonnets and bumpers at 20, 30, 45 km/h, every landing; DEB.keep)', cnt > 0 && least >= 0.25, `${cnt} landings: the least kept ${f(least, 3)} x (DEB.keep ${DEB.keep})`);
}

// ---- 37: the panels that go end over end turn forward throw by throw, not only on their mean [tum_nocos] ----
// (check 6 takes the mean over all throws: with the upside-down correction of the turn about the piece's z dropped, 86 of 551 throws turn
// backwards, down to -0.47 x their speed, and the mean is still over 0.1. On the final tree 4 of 551 are a little under 0, to -0.07: short
// tumbles in which the piece's other axis settling flat, relaxAng, outweighs the turn. So: 3 in 100 at most, none under -0.15)
{
  const PAN = ALL.filter(r => r.fwd != null), back = PAN.filter(r => !(r.fwd > 0)), least = Math.min(...PAN.map(r => r.fwd));
  check('the panels that go end over end turn forward along their travel throw by throw, not only on their mean (3 in 100 at most a little backwards on the whole, none faster than 0.15 x its speed)',
    PAN.length > 0 && back.length <= PAN.length * 0.03 && least > -0.15, `${PAN.length} throws: ${back.length} backwards on the whole, the least ${f(least, 3)} x its speed`);
}

// ---- 38: the time is 2 s, to the step, and a pass begun in it is not paid in its middle [own_18, own_22, again_18, again_22, k2_paid] ----
// (checks 18 and 19 meet the part 1.24 s and 2.24 s after it left the car and are over it for half a second: any DEB.own or DEB.again from
// about 1.75 to 2.24 s passes them. Here the car comes over the lying part in the steps about its time's end, step by step (put 5 m short
// of it, 10 m/s faster: it is over it for ~0.5 s): one that comes over it before the time ends is not touched in the whole pass (before
// K2: paid in its middle, in the step the time ended), one that comes over it as the time ends or after is touched once, as it comes)
{
  const lim = (m) => Math.min(0.06, (m || 0) * 0.004) + 0.005;
  // (put step by step so that it comes over the part from 1.88 to 2.12 s after; a step's put may come over it a step later than the one before)
  const scan = (own) => { const c0 = meetAgain(own, 0, 200); if (c0.err || !c0.over) return { err: c0.err || 'never over it' };
    const L = c0.over - 200, R = []; for (let pk = 226 - L; pk <= 254 - L; pk++) { const r = meetAgain(own, 0, pk); R.push(Object.assign({ kA: r.over }, r)); }
    const kE = (R.find(r => r.hits > 0) || {}).kA, bad = R.filter(r => r.err || !r.over || (kE == null || r.kA < kE ? r.hits !== 0 : r.hits !== 1 || r.firstK !== r.kA || !(r.loss > 0) || r.loss > lim(r.m)));
    return { R, kE, bad, ok: kE != null && Math.abs(kE * DT - 2) < 0.013 && R.some(r => r.kA === kE - 1) && !bad.length }; };
  const said = (x) => x.err || `the first touched ${x.kE != null ? 'coming over it ' + f(x.kE * DT, 3) + ' s after' : 'never'}` + (x.bad.length ? `; wrong: ${x.bad.slice(0, 3).map(r => r.err || `over at ${r.over}, ${r.hits} touch${r.hits === 1 ? '' : 'es'} at ${r.firstK}`).join(', ')} (of ${x.R.length})` : `, ${x.R.length} arrivals as they should`);
  const a = scan(true), c = scan(false);
  check('the time is 2 s to the step: a car coming over the lying part (its own part; a part it knocked away) before its time ends is not touched in the whole pass, one coming over it 2.00 s after the part left it or later is touched once, as it comes',
    !a.err && !c.err && a.ok && c.ok, `its own part: ${said(a)}; a part it knocked away: ${said(c)}`);
}

// ---- 39, 40: the push is no source of speed [push_nocap: O1; push_4: O2] ----
// (the independent check of 11. 11. 2026, O1 and O2.) A standing car (braking) 0.05 m off the barrier, its nose 4 or 8 degrees towards it,
// a part in the gap by its front circle, on its list (DEB.own), thrown along the road, back or across it: each push shoves it from the car,
// the barrier back at it. Before, every push gave it speed and it was shot out along the gap (16 m/s, 8 m off); now no push makes it faster
// than it was or than the car's speed (0) and DEB.push. Between two standing cars side by side, the part on both their lists (one car's time
// 2 s, the other's 0.6 or 1.2), pushed by one and the other: before, at 4 m/s, over DEB_RUN.v (3 m/s, the most a lying part moves), it was
// never lying and a car whose time ended knocked it (took back on its list); now a push leaves it under DEB_RUN.v: it lies, nobody knocks it
const I0 = 150, DEG = Math.PI / 180;
// the car's outermost reach across the road at a heading turned a from the road; car c `lat` m across the road at I0, turned by `turn`, standing
function reachOf(c, a) { let m = -1e9; for (const x of c.circles) m = Math.max(m, x * Math.sin(a) + c.rad);
  for (const [rx, rz] of c.corners) m = Math.max(m, rx * Math.sin(a) + Math.abs(rz) * Math.cos(a)); return m; }
function park(T, c, lat, turn) { const q = T.query(T.px[I0], T.pz[I0], I0, {}); put(c, T, I0, 0, turn); c.place(T.px[I0] + q.nx * lat, T.pz[I0] + q.nz * lat, T.hd[I0] + turn);
  c.vx = c.vz = 0; c.q = T.query(c.x, c.z, I0, c.q); c.sPrev = c.q.s; c.noReverse = true; }   // (standing: the brake held at a standstill does not engage reverse, Car.noReverse)
// a part p as race.spawnDebris makes it off car c, put at x, z with the speed given, flat, on the ground or 0.25 m above it, on the lists by / byT
function pieceAt(T, R, c, p, x, z, vx, vz, ground, by, byT) { R.spawnDebris(c, p, SIM.seeded(SEED + 7)); const d = R.debris[R.debris.length - 1];
  d.x = x; d.z = z; d.vx = vx; d.vz = vz; d.vy = ground ? 0 : 1; d.rx = d.rz = 0; d.wx = d.wy = d.wz = 0; d.yaw = c.h; d.q = T.query(x, z, I0, {});
  d.y = T.yAt(d.q) + 0.02 + d.h * 0.5 + (ground ? 0 : 0.25); d.ground = ground; d.rest = false; d.roll = 0; d.by = by.slice(); d.byT = byT.slice(); return d; }
function squeezed(p, ad, sg, u, dir, ground) {
  const orig = Math.random; try {
  const T = road('asfalt'), R = lone(T), P = R.player, q0 = T.query(T.px[I0], T.pz[I0], I0, {}), a = ad * DEG, B = sg > 0 ? q0.br : q0.bl;
  park(T, P, sg * (B - 0.05 - reachOf(P, a)), sg * a);
  const cf = P.circles[P.circles.length - 1], cx = P.x + Math.cos(P.h) * cf, cz = P.z + Math.sin(P.h) * cf, lat = sg * (B - 0.5 * PT[p].r - 0.001);
  const pl = (cx - T.px[I0]) * q0.nx + (cz - T.pz[I0]) * q0.nz, th = P.h + dir * DEG * sg;
  const d = pieceAt(T, R, P, p, cx + q0.nx * (lat - pl), cz + q0.nz * (lat - pl), Math.cos(th) * u, Math.sin(th) * u, ground, [P], [DEB.own]), x0 = d.x, z0 = d.z;
  let vm = 0, far = 0, hits = 0;
  for (let s = 0; s < 4 * 120 && !(d.rest && !d.by.length); s++) { P.hitDebris = 0; P.inThr = 0; P.inBrk = 1; P.inSteer = 0; R.step(DT); if (P.hitDebris > 0) hits++;
    vm = Math.max(vm, Math.hypot(d.vx, d.vz)); far = Math.max(far, Math.hypot(d.x - x0, d.z - z0)); }
  return { vm, far, hits, u };
  } finally { Math.random = orig; }
}
function between(p, gap, ci, byT, u, dir, ground) {
  const orig = Math.random; try {
  Math.random = SIM.seeded(SEED);
  const T = road('asfalt'), R = new C.Race(T, { numAI: 1, playerGrid: 1, laps: 99, playerModel: MD, fieldModel: MD, assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); R.start();
  const A = R.player, B = R.cars.find(c => !c.isPlayer), ra = reachOf(A, 0); B.ctl = () => {};
  park(T, A, -(ra + gap / 2), 0); park(T, B, ra + gap / 2, 0);
  const cx = T.px[I0] + Math.cos(T.hd[I0]) * A.circles[ci], cz = T.pz[I0] + Math.sin(T.hd[I0]) * A.circles[ci], th = T.hd[I0] + dir * DEG;
  const d = pieceAt(T, R, A, p, cx, cz, Math.cos(th) * u, Math.sin(th) * u, ground, [A, B], byT);
  let knocks = 0, hits = 0, vm = 0, last = 0;
  for (let s = 0; s < 10 * 120 && !(d.rest && !d.by.length); s++) { const was = [A, B].map(c => d.by.indexOf(c) >= 0);
    for (const c of R.cars) { c.hitDebris = 0; c.inThr = 0; c.inBrk = 1; c.inSteer = 0; } R.step(DT);
    [A, B].forEach((c, j) => { if (!was[j] && d.by.indexOf(c) >= 0) knocks++; if (c.hitDebris > 0) hits++; });
    const v = Math.hypot(d.vx, d.vz); vm = Math.max(vm, v); if (v >= 0.05) last = (s + 1) * DT; }
  return { knocks, hits, vm, last, rest: d.rest };
  } finally { Math.random = orig; }
}
{
  const S = [];
  for (const p of ['hood', 'bumperF', 'wheelFL', 'mirrorL']) for (const ad of [4, 8]) for (const sg of [1, -1]) for (const [u, dir] of [[0, 0], [1, 90], [2, 180], [2, -90]]) for (const ground of [false, true])
    S.push(Object.assign({ id: `${p}, nose ${ad} deg, ${sg > 0 ? 'right' : 'left'}, ${u} m/s at ${dir} deg, ${ground ? 'on the ground' : 'dropped'}` }, squeezed(p, ad, sg, u, dir, ground)));
  const wv = S.slice().sort((x, y) => (y.vm - Math.max(y.u, DEB.push)) - (x.vm - Math.max(x.u, DEB.push)))[0], wf = S.slice().sort((x, y) => y.far - x.far)[0];
  check('a part between a standing car and the barrier (the bonnet, the front bumper, a wheel, a mirror; the nose 4 or 8 degrees towards it, 0.05 m off it; thrown 0 to 2 m/s): no push makes it faster than it was or than DEB.push (+0.1 m/s), it goes 1 m at most and the car is not touched',
    S.every(r => r.vm <= Math.max(r.u, DEB.push) + 0.1 && r.far <= 1 && r.hits === 0), `${S.length} runs: the fastest ${f(wv.vm, 2)} m/s (${wv.id}), the farthest ${f(wf.far, 2)} m (${wf.id}); the car touched in ${S.reduce((a, r) => a + r.hits, 0)} steps`);
  const W = [];
  for (const p of ['wheelFL', 'bumperF', 'fenderL']) for (const gap of [0.05, 0.15, 0.3, 0.5, 0.8]) for (const ci of [4, 2]) for (const byT of [[2, 0.6], [1.2, 2]]) for (const dir of [90, -90])
    W.push(Object.assign({ id: `${p}, gap ${gap} m, circle ${ci}, times ${byT.join(' / ')} s, 1.5 m/s at ${dir} deg` }, between(p, gap, ci, byT, 1.5, dir, false)));
  const wk = W.slice().sort((x, y) => y.knocks - x.knocks || y.last - x.last)[0];
  check('a part between two standing cars, on both their lists (one car\'s time 2 s, the other\'s 0.6 or 1.2 s; gaps 0.05 to 0.8 m): a push leaves it under DEB_RUN.v (3 m/s), it lies within 1 s, and no car knocks it as its time ends',
    DEB.push < 3 && W.every(r => r.knocks === 0 && r.hits === 0 && r.vm < 3 && r.last <= 1 && r.rest), `${W.length} runs: ${W.reduce((a, r) => a + r.knocks, 0)} knocks, the fastest ${f(Math.max(...W.map(r => r.vm)), 2)} m/s, the last moving ${f(wk.last, 2)} s (${wk.id}), at rest ${W.filter(r => r.rest).length}; a car touched in ${W.reduce((a, r) => a + r.hits, 0)} steps`);
}
// ---- 41 to 45: Odpadli deli: Izklop (Nastavitve »Odpadli deli«; js/game.js testOf: deb 0; Core TX.deb, Race.step) ----
// The user's buttons (the decision of 10. 11. 2026, docs/trki-realizem.md »Gumbi v Nastavitvah«). With Izklop a part still comes off its car and flies as it does (the same
// throw, the same random numbers), but no car touches it (no speed lost, no twitch, no hop, no shove) and a piece that has come to rest is
// taken off the road (dead, as the cap of 40 takes one). A car that touches nothing drives the same to the last digit, whatever is chosen.
const izklop = (fn, cv) => { C.setTest(cv ? { cv, deb: 0 } : { deb: 0 }); try { return fn(); } finally { C.setTest(null); } };
const md5 = (t) => crypto.createHash('md5').update(t).digest('hex');
const firstDiff = (A, B) => { for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) return i + 1; return 0; };   // (the first step two runs differ in; 0: never)
{
  // twelve parts thrown at 200 km/h off a donor, the race's car parked 850 samples on: every piece's whole state after every step until it lies
  const fly = () => { const orig = Math.random; try {
    const T = road('asfalt'), race = lone(T, 1000), P = race.player, D = donor(T, 150, 200 / KMH), rnd = SIM.seeded(SEED), S = [];
    for (let k = 0; k < 2; k++) for (const p of ['hood', 'bumperF', 'doorL', 'wheelFL', 'wheelRL', 'mirrorL']) { race.spawnDebris(D, p, rnd); S.push({ d: race.debris[race.debris.length - 1], L: [], k: 0 }); }
    let lying = 0;
    for (let k = 1; k <= 60 * 120 && S.some(s => !s.k); k++) { P.inThr = 0; P.inBrk = 1; race.step(DT);
      for (const s of S) if (!s.k) { s.L.push(md5(SIM.stateLine(Object.assign({}, s.d, { dead: false })))); if (s.d.rest) { s.k = k; s.dead = s.d.dead; s.on = race.debris.indexOf(s.d) >= 0; } }
      lying = Math.max(lying, race.debris.filter(d => d.rest).length); }
    return { S, lying, left: race.debris.length };
  } finally { Math.random = orig; } };
  const a = fly(), b = izklop(fly), dif = a.S.map((s, i) => firstDiff(s.L, b.S[i].L)).filter(x => x);
  check('Odpadli deli, Izklop: twelve parts thrown at 200 km/h far from any car fly, land and stop the same to the last digit as with Vklop (every piece\'s whole state after every step); with Vklop they lie on the road, with Izklop each is off it in the step it comes to rest',
    a.S.every(s => s.k && !s.dead && s.on) && a.left === 12 && a.lying === 12 && b.S.every(s => s.k && s.dead && !s.on) && b.left === 0 && b.lying === 0 && a.S.every((s, i) => s.k === b.S[i].k) && !dif.length,
    `Vklop: ${a.S.filter(s => s.k).length} at rest (the last after ${f(Math.max(...a.S.map(s => s.k)) * DT, 2)} s), ${a.left} on the road; Izklop: ${b.S.filter(s => s.k && s.dead).length} taken off as they came to rest, ${b.left} on the road, lying on the list at a step's end ${b.lying}; pieces that flew otherwise ${dif.length}`);
}
// another car's part in the car's way (as knock above: a donor 12 m ahead, at the car's speed, sheds it), part null: no part at all. The car's
// whole state after every step, the steps it is touched in, how often Math.random is asked, the pieces left on the road
function pass(part, kmh, secs) {
  const orig = Math.random; try {
  const T = road('asfalt'), race = lone(T), P = race.player, v = kmh / KMH, g = Math.random, L = []; let drawn = 0, hits = 0, lying = 0;
  Math.random = () => { drawn++; return g(); };
  put(P, T, 150, v); if (part) race.spawnDebris(donor(T, 156, v), part, SIM.seeded(SEED));
  for (let k = 1; k <= secs * 120; k++) { P.hitDebris = 0; P.inThr = P.inBrk = P.inSteer = 0; race.step(DT); if (P.hitDebris > 0) hits++; L.push(md5(SIM.stateLine(P)));
    lying = Math.max(lying, race.debris.filter(d => d.rest).length); }
  return { hits, L, drawn, lying, left: race.debris.length };
  } finally { Math.random = orig; }
}
{
  const rows = [], SEC = 10;
  for (const kmh of [60, 120, 200]) { const none = pass(null, kmh, SEC);
    for (const p of ['hood', 'bumperF', 'trunk', 'wheelFL']) { const on = pass(p, kmh, SEC), off = izklop(() => pass(p, kmh, SEC));
      rows.push({ id: p + ' ' + kmh, p, on: on.hits, onDiff: firstDiff(on.L, none.L), off: off.hits, diff: firstDiff(off.L, none.L), drawn: off.drawn - none.drawn, drawnOn: on.drawn - none.drawn, lying: off.lying, left: off.left, leftOn: on.left }); } }
  const badR = rows.filter(r => r.off || r.diff || r.drawn || r.lying || r.left), teeth = rows.filter(r => r.on > 0 && r.onDiff > 0 && r.leftOn === 1);
  check('Odpadli deli, Izklop: another car\'s part in the way (the bonnet, the front bumper, the boot lid, a wheel of a car 12 m ahead; 60, 120, 200 km/h; 10 s): the car is not touched, its whole state after every step is the same to the last digit as with no part thrown, Math.random is asked exactly as often, the piece is off the road once it lies (with Vklop the bonnet and the front bumper touch the car at every speed and lie on the road, and a knock takes random numbers)',
    rows.length === 12 && !badR.length && rows.filter(r => r.p === 'hood' || r.p === 'bumperF').every(r => teeth.indexOf(r) >= 0) && rows.some(r => r.drawnOn > 0),
    `${rows.length} runs: Izklop touched ${rows.reduce((a, r) => a + r.off, 0)} steps, differs from no part in ${rows.filter(r => r.diff).length}, random numbers more or less ${rows.reduce((a, r) => a + Math.abs(r.drawn), 0)}, pieces left ${rows.reduce((a, r) => a + r.left, 0)}${badR.length ? ' (' + badR[0].id + ')' : ''}; Vklop: touched in ${teeth.length} runs (${rows.map(r => r.on).join(' ')} steps), random numbers more ${rows.reduce((a, r) => a + r.drawnOn, 0)}`);
  // in every collision version: Izklop is that version's own drive with no part
  let okV = 0; const det = [];
  for (let cv = 1; cv < C.KV_IDS.length; cv++) { C.setTest({ cv }); let none; try { none = pass(null, 120, 6); } finally { C.setTest(null); }
    const off = izklop(() => pass('hood', 120, 6), cv), d = firstDiff(off.L, none.L); if (!off.hits && !d && off.drawn === none.drawn) okV++; det.push(C.KV_IDS[cv] + ' ' + off.hits + '/' + d); }
  check('Odpadli deli, Izklop in every collision version (Nastavitve »Trki« and Preizkus): another car\'s bonnet in the way does not touch the car, its state after every step is that version\'s with no part thrown', okV === C.KV_IDS.length - 1, det.join(', ') + ' (touches / the first step that differs)');
}
// the car's own parts (as own above; Core.detachPart at kmh, coasting or braking). off: Izklop's run, the pieces left to the game, until none
// is on the road (40 s at most); else the same K steps with every piece taken off the list as it lands on it (no part at all)
function ownRun(parts, kmh, inp, off, K) {
  const orig = Math.random; try {
  const T = road('asfalt'), race = lone(T), P = race.player, L = []; put(P, T, 150, kmh / KMH); for (const p of parts) C.detachPart(P, p);
  let hits = 0, shed = 0, lying = 0;
  for (let k = 1; k <= (K || 40 * 120); k++) { P.hitWall = P.hitCar = P.hitDebris = 0; P.inThr = 0; P.inBrk = inp === 'zavora' ? 1 : 0; P.inSteer = 0; race.step(DT);
    shed = Math.max(shed, race.debrisId || 0); if (P.hitDebris > 0) hits++; L.push(md5(SIM.stateLine(P)));
    if (!off && race.debris.length) { for (const d of race.debris) d.dead = true; race.debris.length = 0; }
    lying = Math.max(lying, race.debris.filter(d => d.rest).length);
    if (off && !K && !race.debris.length) break; }
  return { hits, shed, lying, L, left: race.debris.length };
  } finally { Math.random = orig; }
}
{
  const rows = [];
  for (const ps of ['bumperF+hood+fenderL+fenderR', 'wheelFL', 'doorL+mirrorL+wing']) for (const kmh of [120, 200]) for (const inp of ['prosto', 'zavora']) { const parts = ps.split('+');
    const A = izklop(() => ownRun(parts, kmh, inp, true)), B = ownRun(parts, kmh, inp, false, A.L.length);
    rows.push({ id: ps + ' ' + kmh + ' ' + inp, hits: A.hits, shed: A.shed >= parts.length && A.shed === B.shed, diff: firstDiff(A.L, B.L), lying: A.lying, left: A.left, t: A.L.length * DT }); }
  const badR = rows.filter(r => r.hits || !r.shed || r.diff || r.lying || r.left);
  check('Odpadli deli, Izklop: the car that sheds parts (the front bumper, the bonnet and both fenders; a front wheel; a door, a mirror and the wing; 120 and 200 km/h; coasting, braking) is touched by none of them, its whole state after every step is the same to the last digit as with every piece taken off the road at once, and when the last piece has come to rest the road is empty',
    rows.length === 12 && !badR.length, `${rows.length} runs: touched ${rows.reduce((a, r) => a + r.hits, 0)} steps, differ ${rows.filter(r => r.diff).length}, pieces left ${rows.reduce((a, r) => a + r.left, 0)}, the road empty after ${f(Math.min(...rows.map(r => r.t)), 1)} to ${f(Math.max(...rows.map(r => r.t)), 1)} s${badR.length ? ' (' + badR[0].id + ')' : ''}`);
}
{
  // a race in which no part comes off: the reference's with Izklop too; races with a crash (the formula's and the newer road car's crash
  // set-ups of tests/lib/sim.js on Spa, 13 cars, 30 and 45 s): parts come off, none lies on the list at a step's end, none is ever touched
  // (d.on: a car over it; d.by: a car that knocked it, there only the car it left, for its 2 s), and every car is where Vklop has it to the
  // last digit (its place, speed, heading and turning after every step, its whole state every second) until the step a car first touches
  // a piece there
  const ref = JSON.parse(fs.readFileSync(path.join(HR, 'golden', 'sim.json'), 'utf8'))['spa/race/cs'], r = izklop(() => SIM.runScenario(C, 'spa', 'race', 'cs'));
  const crash = (set, secs) => { const orig = Math.random; try { Math.random = SIM.seeded(7);
    const S = SIM.SETUPS[set], race = SIM.makeRace(C, 'spa', (C2, tt, t) => S.opts(C2, tt, 'cs', t)), L = [], born = {}; let lying = 0, most = 0, kt = 0, touched = 0;
    for (let k = 1; k <= secs * 120; k++) { SIM.stepRace(C, race, k, S.drive);
      let t = false; for (const d of race.debris) { if (!born[d.id]) born[d.id] = k; const by = d.by || [];
        if ((d.on && d.on.length) || by.length > 1 || by.some(c => c.id !== d.car) || (by.length && (k - born[d.id]) * DT > DEB.own + 2 * DT)) t = true; }
      if (t) { touched++; if (!kt) kt = k; }
      lying = Math.max(lying, race.debris.filter(d => d.rest).length); most = Math.max(most, race.debris.length);
      L.push(race.cars.map(c => c.x + ',' + c.z + ',' + c.vx + ',' + c.vz + ',' + c.h + ',' + c.w).join(';') + (k % 120 ? '' : '|' + md5(race.cars.map(c => SIM.stateLine(c)).join('\n')))); }
    return { shed: race.debrisId || 0, lying, most, kt, touched, L, left: race.debris.length };
  } finally { Math.random = orig; } };
  const R = [['formula', 30], ['car', 45]].map(([set, secs]) => { const on = crash(set, secs), off = izklop(() => crash(set, secs)); return { set, on, off, kd: firstDiff(on.L, off.L) }; });
  check('Odpadli deli, Izklop in a race: a race in which no part comes off (Spa, 13 cars, 60 s) is the reference\'s to the last digit (tests/golden/sim.json spa/race/cs); in races with a crash (Spa, 13 cars: the formula\'s, 30 s; the newer road car\'s, 45 s) parts come off, none lies on the list at a step\'s end, no car is ever over one or knocks one, and every car is where Vklop has it to the last digit until the step a car first touches a piece there',
    !!ref && r.cover.loose === 0 && r.digest === ref.digest && R.every(x => x.off.shed > 0 && x.off.lying === 0 && x.off.touched === 0 && x.on.shed > 0 && x.on.lying > 0 && (x.on.kt ? x.kd === 0 || x.kd >= x.on.kt : x.kd === 0)) && R.some(x => x.on.kt > 0 && x.kd >= x.on.kt),
    `${r.digest}; ` + R.map(x => `${x.set}: Izklop ${x.off.shed} parts off, at most ${x.off.most} on the list at once, ${x.off.left} left, lying at a step's end ${x.off.lying}, touched ${x.off.touched}; Vklop ${x.on.shed} parts off, ${x.on.lying} lying, a car first at a piece at step ${x.on.kt || '-'}, the two runs differ from step ${x.kd || '-'}`).join('; '));
}
console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
