// The new physics, 'nova' (Nastavitve → Fizika vožnje: Nova; Car.stepNova, NVK in core.js), next to the classic 'cs' (which stays as it was:
// golden.test.js). Checked here:
// - the choice: a Car / Race with phys 'nova' drives the new physics, anything else the classic one
// - on the flat test plane (tests/lib/handling.js, BURJA R7 'rally' and KAZE RS 'kaze', the drift assist high unless noted): full lock at 60 and
//   100 km/h corners at 1.9-2.4 g and does not spin; braking hard in a corner rotates the car a little, no spin; straight braking from
//   150 km/h does not rotate it; the same engine and brakes as cs (0-100 km/h and 100-0 km/h within 2 %); with the low assist the
//   throttle in a corner turns the rear-wheel-drive car more than with the high one (the tail steps out)
// - full lock on the buttons (the phone's steering) from 60, 110 and 160 km/h with the throttle holding the speed, the drift assist high,
//   in a front-, a rear- and a four-wheel-drive car, the formula, the truck and the little rear-engined car: the car grips with a little slide
//   (peak under 20 deg; the reference video: ~21 deg against the view in a quick corner, the view's lag included), no spin; with the low
//   assist at 110 km/h under 35 deg
// - the low assist: full throttle in a corner steps a rear-driven car's tail out (the V8: 10-45 deg) and does not spin it (the formula
//   neither); braking hard in a corner does not spin a front-driven car or the little rear-engined one
// - the kerbs: the wheels on one lift the car a little (up to 2-8 cm, the body rolled away from them) and it settles again past it; a cs
//   car is never lifted
// - car contacts: a rear-end knock bounces the cars apart (they part at 0.3 of the closing speed or more; cs about 0.1), a knock
//   on a rear corner turns the car hit (cs: no yaw from it); the walls as in cs (the user's: the same impulse for both physics)
// - a race (Spa, Bathurst: 12 rivals, 150 s): nothing NaN, every car moving, no more knocks between the cars than 1.5x cs's + 20, at
//   most 6 slides past 40 deg in the field; the rivals over the kerbs at the apex and the exit as in the reference video (a wheel on a
//   kerb 6 % of the time or more; cs's under 3 %); the autopilot's lap alone on Bathurst within 4 % of cs's
//   node tests/nova.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { seeded } = require('./lib/sim.js');

const C = loadCore();
const HC = require('./lib/handling.js')(C, 'cs'), HN = require('./lib/handling.js')(C, 'nova');
const { DT } = HN, D = 180 / Math.PI;
const checks = [];
const ok = (name, cond, detail) => checks.push({ name, ok: !!cond, detail });
const f = (v, d = 2) => Number.isFinite(v) ? v.toFixed(d) : String(v);

// ---- the choice ----
{
  const a = new C.Car(C.MODELS[0], { phys: 'nova' }), b = new C.Car(C.MODELS[0], { phys: 'rally' }), c = new C.Car(C.MODELS[0], {});
  const T = new C.Track(C.TRACKS.find(d => d.id === 'spa'));
  const r1 = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 1, phys: 'nova', seed: 1 }), r2 = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 1, phys: 'arcade', seed: 1 });
  ok('the choice: phys nova drives the new physics, anything else the classic one (Car, Race and all its cars)',
    a.phys === 'nova' && b.phys === 'cs' && c.phys === 'cs' && r1.cars.every(x => x.phys === 'nova') && r2.cars.every(x => x.phys === 'cs') && r1.opts.phys === 'nova' && r2.opts.phys === 'cs',
    `${a.phys} ${b.phys} ${c.phys} / ${r1.cars.map(x => x.phys).join(',')} / ${r2.cars.map(x => x.phys).join(',')}`);
}

// ---- the flat test plane ----
for (const kmh of [60, 100]) {
  const s = HN.steady('rally', kmh, 1.0);
  ok(`plane: full lock at ${kmh} km/h corners at 1.9-2.4 g`, s.ay >= 1.9 && s.ay <= 2.4, f(s.ay) + ' g, slide ' + f(s.slip, 1) + ' deg');
}
{ // full lock held 2 s at 100 km/h (keys): no spin
  const c = HN.mkCar('rally', { v: 100, digital: true }); let mx = 0;
  for (let i = 0; i < 2 / DT; i++) { HN.step(c, { st: 1, thr: 'hold' }); mx = Math.max(mx, Math.abs(c.beta) * D); }
  ok('plane: full lock held 2 s at 100 km/h does not spin the car (slide < 40 deg)', mx < 40, f(mx, 1) + ' deg');
}
for (const id of ['rally', 'kaze']) {
  const p = HN.pedal(id, 'brake');
  ok(`plane: braking hard in a 100 km/h corner rotates the ${id} a little, no spin (0-30 deg more)`, !p.spun && p.pk >= 0 && p.pk < 30, f(p.pk, 1) + ' deg');
}
{
  const N = HN.longi('rally'), S = HC.longi('rally');
  ok('plane: straight braking from 150 km/h does not rotate the car (< 1 deg)', N.bmax < 1, f(N.bmax, 2) + ' deg');
  ok('plane: the same engine and brakes as cs (0-100 km/h, 100-0 km/h within 2 %)', Math.abs(N.t100 / S.t100 - 1) < 0.02 && Math.abs(N.d100 / S.d100 - 1) < 0.02,
    `0-100 ${f(N.t100)} s (cs ${f(S.t100)}), 100-0 ${f(N.d100, 1)} m (cs ${f(S.d100, 1)})`);
}
{ // the throttle in a corner, kaze (FR): the low assist lets the tail out more than the high one
  const thrRot = (assist) => { const c = HN.mkCar('kaze', { v: 80, assist }); for (let i = 0; i < 3 / DT; i++) HN.step(c, { st: 0.8, thr: 'hold' }); const b0 = Math.abs(c.beta); let mx = 0;
    for (let i = 0; i < 1.2 / DT; i++) { HN.step(c, { st: 0.8, thr: 1 }); mx = Math.max(mx, Math.abs(c.beta) - b0); } return mx * D; };
  const lo = thrRot(0), hi = thrRot(2);
  ok('plane: full throttle in a corner turns the KAZE RS (FR) more with the low drift assist than with the high one', lo > hi + 2, `low +${f(lo, 1)} deg, high +${f(hi, 1)} deg`);
}

// ---- full lock on the buttons; the low assist's throttle and brakes ----
{
  const lock = (id, kmh, assist) => { const c = HN.mkCar(id, { v: kmh, assist, digital: true }); for (let i = 0; i < 0.3 / DT; i++) HN.step(c, { st: 0, thr: 'hold' });
    let mx = 0; for (let i = 0; i < 3 / DT; i++) { HN.step(c, { st: 1, thr: 'hold' }); mx = Math.max(mx, Math.abs(c.beta)); } return mx * D; };
  const ids = ['pico', 'kaze', 'rally', 'formula', 'truck', 'miska'], hi = [], lo = [];
  for (const id of ids) { for (const v of [60, 110, 160]) hi.push([id + '@' + v, lock(id, v, 2)]); lo.push([id, lock(id, 110, 0)]); }
  const wH = hi.reduce((a, b) => b[1] > a[1] ? b : a), wL = lo.reduce((a, b) => b[1] > a[1] ? b : a);
  ok('plane: full lock on the buttons, assist high: a little slide in every car (peak < 20 deg), low assist at 110 km/h < 35 deg', wH[1] < 20 && wL[1] < 35,
    `high: most ${f(wH[1], 1)} deg (${wH[0]}), low: most ${f(wL[1], 1)} deg (${wL[0]})`);
  const ped = (id, what) => { const c = HN.mkCar(id, { v: what === 'thr' ? 70 : 100, assist: 0 }); for (let i = 0; i < 3 / DT; i++) HN.step(c, { st: 0.7, thr: 'hold' }); const b0 = Math.abs(c.beta); let mx = 0, sp = 0;
    for (let i = 0; i < 1.5 / DT; i++) { HN.step(c, { st: 0.7, thr: what === 'thr' ? 1 : 0, brk: what === 'brk' ? 1 : 0 }); mx = Math.max(mx, Math.abs(c.beta) - b0); sp = Math.max(sp, Math.abs(c.beta)); } return { d: mx * D, sp: sp > 1.2 }; };
  const mu = ped('muscle', 'thr'), fo = ped('formula', 'thr'), pb = ped('pico', 'brk'), mb = ped('miska', 'brk');
  ok('plane, low assist: full throttle in a corner steps the V8\'s tail out (10-45 deg), no spin (nor the formula\'s)', mu.d >= 10 && mu.d <= 45 && !mu.sp && !fo.sp, `V8 +${f(mu.d, 1)} deg, formula +${f(fo.d, 1)} deg`);
  ok('plane, low assist: braking hard in a corner spins neither the front-driven PICO nor the rear-engined MIŠKA', !pb.sp && !mb.sp, `PICO +${f(pb.d, 1)} deg, MIŠKA +${f(mb.d, 1)} deg`);
}

// ---- the kerbs: a plane with a kerb on the right (+z side) from x 20 m to 40 m, the car runs along x with its right wheels on it ----
{
  const kerb = { hasElev: false, def: {}, open: false, rings: [], altC: [],
    query(x, z, h, o) { o = o || {}; Object.assign(o, { i: 0, a: 0, s: x, d: z, tx: 1, tz: 0, nx: 0, nz: 1, x, z, bl: 1e9, br: 1e9 }); return o; },
    surface(q) { return q.s > 20 && q.s < 40 && q.d > 0.3 ? 1 : 0; } };
  const run = (phys) => { const H = phys === 'nova' ? HN : HC, c = H.mkCar('rally', { v: 60 }); c.place(0, 0, 0); c.locked = false; c.vx = 60 / 3.6; let yMax = 0, rAt = 0, y60 = 0;
    for (let i = 0; i < 3 / DT; i++) { c.inSteer = 0; c.inThr = 0.3; c.inBrk = 0; c.step(DT, kerb); const y = c.nvY || 0; if (y > yMax) { yMax = y; rAt = c.nvR || 0; } if (c.x > 60) y60 = Math.max(y60, Math.abs(y)); }
    return { yMax, rAt, y60, onCurb: c.onCurb }; };
  const n = run('nova'), s = run('cs');
  ok('kerbs: the wheels on one lift the nova car a little (2-8 cm), the body rolled away from them, and it settles past it (< 5 mm)', n.yMax > 0.02 && n.yMax < 0.08 && n.rAt < 0 && n.y60 < 0.005,
    `lift ${f(n.yMax * 100, 1)} cm, roll ${f(n.rAt * D, 2)} deg, past it ${f(n.y60 * 1000, 1)} mm`);
  ok('kerbs: a cs car is never lifted', s.yMax === 0, 'lift ' + s.yMax);
}

// ---- car contacts ----
{
  const rear = (phys) => { const H = phys === 'nova' ? HN : HC, A = H.mkCar('rally', { v: 72 }), B = H.mkCar('rally', { v: 36 }); A.place(0, 0, 0); A.vx = 20; B.place(A.m.len + 0.05, 0, 0); B.vx = 10;
    const imp = C.carCollide(B, A); return { imp, part: (B.vx - A.vx) / 10 }; };
  const n = rear('nova'), s = rear('cs');
  ok('car contacts: a rear-end knock bounces the cars apart (nova: they part at 0.3 of the closing speed or more, more than cs)', n.part >= 0.3 && n.part > s.part + 0.15, `nova ${f(n.part)}, cs ${f(s.part)} of the closing speed`);
  const corner = (phys) => { const H = phys === 'nova' ? HN : HC, A = H.mkCar('rally', { v: 0 }), B = H.mkCar('rally', { v: 0 }); A.place(0, 0, 0); A.vx = 15; B.place(A.m.len * 0.85, A.m.wid * 0.7, 0); B.vx = 10;
    C.carCollide(B, A); return B.w; };
  const wn = corner('nova'), ws = corner('cs');
  ok('car contacts: a knock on a rear corner turns the car hit (nova > 0.2 rad/s; cs no yaw from it)', Math.abs(wn) > 0.2 && Math.abs(ws) < 1e-9, `nova ${f(wn)} rad/s, cs ${f(ws, 3)} rad/s`);
}
{ // the walls: the same impulse for both physics (a car at 25 m/s, 20 deg into a wall)
  const T = new C.Track(C.TRACKS.find(d => d.id === 'spa'));
  const hit = (phys) => { const c = new C.Car(C.MODELS[4], { phys }); const i = 200, s = i * T.ds, br = T.br[i];
    c.place(T.px[i] - T.nx[i] * (br - 0.5), T.pz[i] - T.nz[i] * (br - 0.5), Math.atan2(T.tz[i], T.tx[i]) - 0.35); c.q.i = i; T.query(c.x, c.z, i, c.q);
    const v = 25, h = c.h; c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v; c.w = 0.2; c.wq.forEach(q => q.i = -1); for (let k = 0; k < 30; k++) { c.x += c.vx / 120; c.z += c.vz / 120; T.query(c.x, c.z, c.q.i, c.q); C.wallCollide(c, T); }
    return [c.x, c.z, c.vx, c.vz, c.w].map(x => x.toFixed(6)).join(','); };
  const a = hit('nova'), b = hit('cs');
  ok('walls: the same knock off the barrier for both physics (the user\'s: keep it so)', a === b, a === b ? 'identical' : `nova ${a} / cs ${b}`);
}

// ---- races ----
function pack(tid, phys) {
  Math.random = seeded(64);
  const T = new C.Track(C.TRACKS.find(d => d.id === tid));
  const race = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys });
  race.start();
  const pc = new Map(), ps = new Map(); let hits = 0, slides = 0, nan = false, kerb = 0, tot = 0;
  for (let k = 1; k <= 150 / DT; k++) {
    Math.random = seeded(1000 + k);
    C.aiControl(race.player, race, DT); race.step(DT);
    for (const c of race.cars) { if (!Number.isFinite(c.x + c.z + c.vx + c.vz + c.w)) nan = true;
      const h = c.hitCar > 3; if (h && !pc.get(c)) hits++; pc.set(c, h); c.hitCar = 0;
      const sl = Math.abs(c.beta || 0) > 0.7 && c.speed > 8; if (sl && !ps.get(c)) slides++; ps.set(c, sl);
      if (!c.isPlayer) { tot++; if (c.onCurb) kerb++; } }
  }
  return { hits, slides, nan, moving: race.cars.filter(c => c.speed > 5).length, n: race.cars.length, kerb: kerb / tot };
}
for (const tid of ['spa', 'bathurst']) {
  const n = pack(tid, 'nova'), s = pack(tid, 'cs');
  ok(`race ${tid}: nothing NaN, every car moving, knocks between cars <= 1.5x cs's + 20, slides past 40 deg <= 6`, !n.nan && n.moving === n.n && n.hits <= 1.5 * s.hits + 20 && n.slides <= 6,
    `nova ${n.hits} knocks, ${n.slides} slides, ${n.moving}/${n.n} moving; cs ${s.hits} knocks, ${s.slides} slides`);
  ok(`race ${tid}: the rivals over the kerbs (a wheel on one 6 % of the time or more; cs under 3 %)`, n.kerb >= 0.06 && s.kerb < 0.03, `nova ${f(n.kerb * 100, 1)} %, cs ${f(s.kerb * 100, 1)} %`);
}
{
  const lap = (phys) => { Math.random = seeded(5); const T = new C.Track(C.TRACKS.find(d => d.id === 'bathurst'));
    const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, playerModel: C.MODELS[4], assist: 2, seed: 3, difficulty: 1, damage: 2, phys }); race.start(); const P = race.player;
    for (let k = 1; k <= 400 / DT && P.lapTimes.length < 2; k++) { Math.random = seeded(1000 + k); C.aiControl(P, race, DT); race.step(DT); } return P.lapTimes[1]; };
  const n = lap('nova'), s = lap('cs');
  ok('race bathurst: the autopilot\'s flying lap alone within 4 % of cs\'s', n > 0 && Math.abs(n / s - 1) < 0.04, `nova ${f(n, 1)} s, cs ${f(s, 1)} s`);
}

let bad = 0;
console.log('== nova fizika (Fizika vožnje: Nova)');
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} checks`);
process.exitCode = bad ? 1 : 0;
