// The new physics, 'nova' (Nastavitve → Fizika vožnje: Nova; Car.stepNova, NVK in core.js), next to the classic 'cs' (which stays as it was:
// golden.test.js). Checked here:
// - the choice: a Car / Race with phys 'nova' drives the new physics, anything else the classic one
// - on the flat test plane (tests/lib/handling.js, BURJA R7 'rally' and KAZE RS 'kaze', the drift assist high unless noted): full lock at 60 and
//   100 km/h corners at 1.9-2.4 g and does not spin; braking hard in a corner rotates the car a little, no spin; straight braking from
//   150 km/h does not rotate it; the same engine and brakes as cs (0-100 km/h and 100-0 km/h within 2 %); with the low assist the
//   throttle in a corner turns the rear-wheel-drive car more than with the high one (the tail steps out)
// - full lock on the buttons (the phone's steering) from 60, 110 and 160 km/h with the throttle holding the speed, the drift assist high,
//   in a front-, a rear- and a four-wheel-drive car, the formula, the truck and the little rear-engined car: the car slides into the corner
//   (peak 15-32 deg; the reference video: ~21 deg against the view in a quick corner, mostly the car's own slide), no spin; with the low
//   assist at 110 km/h under 35 deg
// - the body's slide in a steady corner (NVK.attT): 0.2-0.4 s x the path rate (the video: ~0.3 deg per deg/s), in phase with it (at
//   0.3 s into a turn-in at least half of the steady slide)
// - the sliding style (Car.nvSl, Nastavitve → Slog nove fizike: Drseč): full lock at 60 km/h 35-60 deg, no spin; it leads the turn (at
//   0.25 s into the turn-in more slide than the normal style)
// - the grass, two wheels on it at 100 km/h, coasting: 0.08-0.18 g more slowing than on the asphalt (the video: 0.1-0.15 g), the car
//   fidgets (the path's turn jitters, rms > 1.5 deg/s; on the asphalt < 0.3); slicks on the makadam corner about as hard as in
//   cs (0.95-1.15 x: their stages as quick as in cs)
// - the Kolibri's own tyres (Car.kt): worn ones, or a burning one, corner less hard (as in cs)
// - the rivals' pace (NVK.aiSpr): their skills spread 0.6 as far as in cs, the fastest the same
// - the low assist: full throttle in a corner steps a rear-driven car's tail out (the V8: 10-45 deg) and does not spin it (the formula
//   neither); braking hard in a corner does not spin a front-driven car or the little rear-engined one
// - the kerbs: the wheels on one lift the car a little (up to 2-8 cm, the body rolled away from them) and it settles again past it; a cs
//   car is never lifted
// - car contacts: a rear-end knock bounces the cars apart (they part at 0.3 of the closing speed or more; cs about 0.1), a knock
//   on a rear corner turns the car hit (cs: no yaw from it); the walls as in cs (the user's: the same impulse for both physics)
// - a race (Spa, Bathurst: 12 rivals, 150 s): nothing NaN, every car moving, no more knocks between the cars than 1.5x cs's + 20, at
//   most 6 slides past 40 deg in the field; the rivals over the kerbs at the apex and the exit as in the reference video (a wheel on a
//   kerb 6 % of the time or more; cs's under 3 %); the autopilot's lap alone on Bathurst within 4 % of cs's
// - Preizkus: tekmeci in trki (Nastavitve; Core.setTest, TX), for either physics and nothing by default: the bounce of a knock (cE: the classic 0.1,
//   the new 0.4, 0 none ... 0.6), the rub along the contact (cMu), the turn a knock gives (cYaw: the classic's attitude kick and the new one's
//   spin, 0 none), the spread of the rivals' paces (aiSpr), the rivals over the kerbs (aiKerb: in the classic physics too, and off in the new one) and
//   a close train with a wheel-to-wheel field (aiSpr, aiPush, aiSide, aiFol: more of the time a car is right behind another)
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
  const wN = hi.reduce((a, b) => b[1] < a[1] ? b : a);
  ok('plane: full lock on the buttons, assist high: every car slides into the corner (peak 15-32 deg), low assist at 110 km/h < 35 deg', wN[1] >= 15 && wH[1] <= 32 && wL[1] < 35,
    `high: ${f(wN[1], 1)} (${wN[0]}) to ${f(wH[1], 1)} deg (${wH[0]}), low: most ${f(wL[1], 1)} deg (${wL[0]})`);
  const ped = (id, what) => { const c = HN.mkCar(id, { v: what === 'thr' ? 70 : 100, assist: 0 }); for (let i = 0; i < 3 / DT; i++) HN.step(c, { st: 0.7, thr: 'hold' }); const b0 = Math.abs(c.beta); let mx = 0, sp = 0;
    for (let i = 0; i < 1.5 / DT; i++) { HN.step(c, { st: 0.7, thr: what === 'thr' ? 1 : 0, brk: what === 'brk' ? 1 : 0 }); mx = Math.max(mx, Math.abs(c.beta) - b0); sp = Math.max(sp, Math.abs(c.beta)); } return { d: mx * D, sp: sp > 1.2 }; };
  const mu = ped('muscle', 'thr'), fo = ped('formula', 'thr'), pb = ped('pico', 'brk'), mb = ped('miska', 'brk');
  ok('plane, low assist: full throttle in a corner steps the V8\'s tail out (10-45 deg), no spin (nor the formula\'s)', mu.d >= 10 && mu.d <= 45 && !mu.sp && !fo.sp, `V8 +${f(mu.d, 1)} deg, formula +${f(fo.d, 1)} deg`);
  ok('plane, low assist: braking hard in a corner spins neither the front-driven PICO nor the rear-engined MIŠKA', !pb.sp && !mb.sp, `PICO +${f(pb.d, 1)} deg, MIŠKA +${f(mb.d, 1)} deg`);
}

// ---- the body's slide in a corner; the sliding style ----
{
  const taus = [['kaze', 80], ['rally', 110], ['formula', 140], ['truck', 70]].map(([id, v]) => { const r = HN.steady(id, v, 0.6); return [id, r.tau]; });
  const lo = taus.reduce((a, b) => b[1] < a[1] ? b : a), hi = taus.reduce((a, b) => b[1] > a[1] ? b : a);
  ok('plane: the body slides in a steady corner by 0.2-0.4 s x the path rate (the video: ~0.3 deg per deg/s)', lo[1] >= 0.2 && hi[1] <= 0.4, taus.map(([id, t]) => `${id} ${f(t)} s`).join(', '));
  const turn = (id, sl) => { const c = HN.mkCar(id, { v: 80, digital: true }); if (sl) c.nvSl = true; for (let i = 0; i < 0.3 / DT; i++) HN.step(c, { st: 0, thr: 'hold' });
    let b03 = 0, b025 = 0, mx = 0; for (let i = 0; i < 3 / DT; i++) { HN.step(c, { st: 0.6, thr: 'hold' }); const b = Math.abs(c.beta) * D; if (i === Math.round(0.3 / DT)) b03 = b; if (i === Math.round(0.25 / DT)) b025 = b; mx = Math.max(mx, b); }
    return { b03, b025, end: Math.abs(c.beta) * D, mx }; };
  const k = turn('kaze', false);
  ok('plane: the slide in phase with the turn (0.3 s into a turn-in at least half of the steady slide)', k.b03 >= 0.5 * k.end, `${f(k.b03, 1)} of ${f(k.end, 1)} deg`);
  const lockS = (id) => { const c = HN.mkCar(id, { v: 60, digital: true }); c.nvSl = true; for (let i = 0; i < 0.3 / DT; i++) HN.step(c, { st: 0, thr: 'hold' });
    let mx = 0; for (let i = 0; i < 3 / DT; i++) { HN.step(c, { st: 1, thr: 'hold' }); mx = Math.max(mx, Math.abs(c.beta) * D); } return mx; };
  const sl = ['kaze', 'formula', 'truck'].map(id => [id, lockS(id)]), sk = turn('kaze', true);
  ok('the sliding style: full lock at 60 km/h 35-60 deg, no spin; ahead of the turn (more slide 0.25 s into it than the normal style)', sl.every(([, b]) => b >= 35 && b <= 60) && sk.b025 > k.b025 + 3,
    sl.map(([id, b]) => `${id} ${f(b, 1)} deg`).join(', ') + `; 0.25 s in: ${f(sk.b025, 1)} deg (normal ${f(k.b025, 1)})`);
}

// ---- the grass: two wheels on it (z > 0), coasting from 100 km/h, the steer holding the line; slicks on the makadam ----
{
  const plane = (sf) => ({ hasElev: false, def: {}, open: false, rings: [], altC: [], query(x, z, h, o) { o = o || {}; Object.assign(o, { i: 0, a: 0, s: x, d: z, tx: 1, tz: 0, nx: 0, nz: 1, x, z, bl: 1e9, br: 1e9 }); return o; },
    surface(q) { return q.d > 0 ? sf : 0; } });
  const run = (sf) => { const T = plane(sf), c = new C.Car(C.MODELS.find(m => m.id === 'rally'), { isPlayer: true, phys: 'nova', assist: 2 }); c.place(0, 0, 0); c.locked = false; c.vx = 100 / 3.6; c.gear = 4;
    const om = []; let pa = 0, v1 = 0, v2 = 0;
    for (let i = 0; i < 2.5 / DT; i++) { c.inSteer = c.steer = Math.max(-1, Math.min(1, -0.25 * c.z - 0.15 * c.vz)); c.inThr = 0; c.inBrk = 0; c.step(DT, T); const a = Math.atan2(c.vz, c.vx); om.push((a - pa) / DT * D); pa = a;
      if (i === Math.round(0.5 / DT)) v1 = Math.hypot(c.vx, c.vz); if (i === Math.round(1 / DT)) v2 = Math.hypot(c.vx, c.vz); }
    let s2 = 0, n = 0; for (let i = 60; i < om.length - 60; i++) { let m = 0; for (let j = i - 60; j <= i + 60; j++) m += om[j]; m /= 121; s2 += (om[i] - m) ** 2; n++; }
    return { dec: (v1 - v2) / 0.5 / 9.81, rms: Math.sqrt(s2 / n) }; };
  const a = run(0), g = run(2);
  ok('grass, two wheels on it at 100 km/h: 0.08-0.18 g more slowing than on the asphalt, the car fidgets (rms of its turn > 1.5 deg/s; asphalt < 0.3)', g.dec - a.dec >= 0.08 && g.dec - a.dec <= 0.18 && g.rms > 1.5 && a.rms < 0.3,
    `+${f(g.dec - a.dec)} g, rms ${f(g.rms, 1)} deg/s (asphalt ${f(a.rms, 1)})`);
  const ay = (H, id) => { H.surf(5); const r = H.steady(id, 70, 1.0).ay; H.surf(0); return r; };
  const fN = ay(HN, 'formula'), fS = ay(HC, 'formula'), lN = ay(HN, 'lm'), lS = ay(HC, 'lm');
  ok('slicks on the makadam: the formula and the prototype corner about as hard as in cs (0.95-1.15 x; 70 km/h, full lock)', [fN / fS, lN / lS].every(r => r >= 0.95 && r <= 1.15),
    `formula ${f(fN)} g (cs ${f(fS)}), prototype ${f(lN)} g (cs ${f(lS)})`);
}

// ---- the Kolibri's own tyres (Car.kt, as cs): worn tyres corner less hard, a burning one less still ----
{
  const ay = (w, hot) => { const c = HN.mkCar('kaze', { v: 80 }); c.kt = { w: [w, w, w, w], d: [0, 0, 0, 0], hot, cold: 0, d0: 0, g: [1, 1, 1, 1, 1] };
    for (let i = 0; i < 4 / DT; i++) HN.step(c, { st: 1, thr: 'hold' }); return Math.abs(c.wPath) * Math.hypot(c.vx, c.vz) / 9.81; };
  const a0 = ay(0, -1), a1 = ay(1, -1), a2 = ay(0, 0);
  ok('the Kolibri\'s tyres with the new physics: worn ones corner less hard, a burning one less than new ones', a1 < a0 - 0.05 && a2 < a0 - 0.05, `new ${f(a0)} g, worn ${f(a1)} g, one burning ${f(a2)} g`);
}

// ---- Preizkus: tekmeci in trki (Core.setTest): the settings over either physics, nothing by default ----
{
  const all = () => Object.keys(C.TX).every(k => C.TX[k] === null);
  C.setTest({ cE: 0.3, aiSpr: 'x', aiPush: NaN, cMu: null }); const part = C.TX.cE === 0.3 && C.TX.aiSpr === null && C.TX.aiPush === null && C.TX.cMu === null; C.setTest(null);
  ok('Preizkus: nothing set by default, only numbers taken, setTest(null) clears them all', all() && part, JSON.stringify(C.TX));
  const test = (tx, fn) => { C.setTest(tx || null); try { return fn(); } finally { C.setTest(null); } };
  // the bounce: a rear-end knock on the plane (72 km/h into 36), the share of the closing speed the cars part at
  const rear = (H, tx) => test(tx, () => { const A = H.mkCar('rally', { v: 72 }), B = H.mkCar('rally', { v: 36 }); A.place(0, 0, 0); A.vx = 20; B.place(A.m.len + 0.05, 0, 0); B.vx = 10; C.carCollide(B, A); return (B.vx - A.vx) / 10; });
  const rc = [null, { cE: 0 }, { cE: 0.25 }, { cE: 0.6 }].map(t => rear(HC, t)), rn = [null, { cE: 0 }].map(t => rear(HN, t));
  ok('Preizkus: the bounce of a knock: classic 0.1 by default, none with cE 0, 0.25 and 0.6 as asked; the new physics 0.4, none with cE 0', Math.abs(rc[0] - 0.1) < 0.03 && Math.abs(rc[1]) < 0.02 && Math.abs(rc[2] - 0.25) < 0.03 && Math.abs(rc[3] - 0.6) < 0.03 && Math.abs(rn[0] - 0.4) < 0.03 && Math.abs(rn[1]) < 0.02,
    `classic ${rc.map(x => f(x)).join(' / ')}, new ${rn.map(x => f(x)).join(' / ')}`);
  // the rub: B turning in against A at 100 km/h, the relative speed after the knock
  const swipe = (H, tx) => test(tx, () => { const A = H.mkCar('rally', { v: 100 }), B = H.mkCar('rally', { v: 100 }); A.place(0, 0, 0); A.vx = 27.8; B.place(A.m.len - 3.0, 1.7, -0.26); B.vx = 27.8 * Math.cos(-0.26); B.vz = 27.8 * Math.sin(-0.26); B.h = -0.26;
    C.carCollide(B, A); return Math.hypot(B.vx - A.vx, B.vz - A.vz); });
  const sc = [null, { cMu: 0.8 }].map(t => swipe(HC, t)), sn = [null, { cMu: 0 }].map(t => swipe(HN, t));
  ok('Preizkus: the rub along the contact: the classic cars share their speed more with cMu 0.8 than by default; the new physics with cMu 0 less than by default', sc[1] < 0.7 * sc[0] && sn[1] > 1.2 * sn[0], `classic ${f(sc[0])} -> ${f(sc[1])} m/s apart, new ${f(sn[0])} -> ${f(sn[1])}`);
  // Težak's weight: the other car counts cMass times heavier in a knock with the player (and only then), no sparks with cFx 0
  const heavyHit = (H, tx, pl) => test(tx, () => { const P = H.mkCar('rally', { v: 100 }), O = H.mkCar('rally', { v: 0 }); P.isPlayer = pl; O.isPlayer = false; O.place(0, 0, 0); P.place(-O.m.len - 0.02, 0, 0); P.vx = 27.8; P.fxCar = O.fxCar = 0; C.carCollide(P, O); return { p: P.vx, o: O.vx, fx: Math.max(P.fxCar, O.fxCar) }; });
  const hv0 = heavyHit(HC, null, true), hv1 = heavyHit(HC, { cE: 0, cMass: 12, cFx: 0 }, true), hv2 = heavyHit(HC, { cE: 0, cMass: 12, cFx: 0 }, false), hv3 = heavyHit(HN, { cE: 0, cMass: 12 }, true);
  ok('Preizkus: the other car 12 times heavier: the player\'s speed goes into it (both leave at about 1/13 of 100 km/h), between two rivals nothing changes, no sparks with cFx 0, sparks by default; the new physics the same',
    Math.abs(hv1.p - 27.8 / 13) < 0.3 && Math.abs(hv1.o - 27.8 / 13) < 0.3 && Math.abs(hv2.o - hv0.o) > 1 && hv2.o > 5 && hv1.fx === 0 && hv0.fx > 3 && Math.abs(hv3.p - 27.8 / 13) < 0.3,
    `by default ${f(hv0.p * 3.6)} / ${f(hv0.o * 3.6)} km/h, heavy ${f(hv1.p * 3.6)} / ${f(hv1.o * 3.6)}, two rivals ${f(hv2.p * 3.6)} / ${f(hv2.o * 3.6)}, new ${f(hv3.p * 3.6)} / ${f(hv3.o * 3.6)}`);
  // the turn: a light knock (the classic's attitude kick csKc is capped at 0.4 rad: 0.15 stays under it), the new physics' yaw rate
  const lite = (H, tx) => test(tx, () => { const A = H.mkCar('rally', { v: 60 }), B = H.mkCar('rally', { v: 60 }); A.place(0, 0, 0); A.vx = 16.7; B.place(A.m.len - 3.0, 1.55, -0.06); B.vx = 16.7 * Math.cos(-0.06); B.vz = 16.7 * Math.sin(-0.06); B.h = -0.06;
    C.carCollide(B, A); return [Math.abs(A.csKc), Math.abs(A.w)]; });
  const yc = [null, { cYaw: 0 }, { cYaw: 0.15 }, { cYaw: 1.6 }].map(t => lite(HC, t)[0]), yn = [null, { cYaw: 0 }, { cYaw: 0.4 }].map(t => lite(HN, t)[1]);
  ok('Preizkus: the turn of a knock: the classic kick none with cYaw 0, small with 0.15, more than by default with 1.6 (its cap grows too); the new physics\' spin none with 0, less with 0.4', yc[1] === 0 && yc[2] > 0 && yc[2] < 0.5 * yc[0] && yc[3] > yc[0] + 0.1 && yn[1] === 0 && yn[2] > 0 && yn[2] < yn[0],
    `classic ${yc.map(x => f(x, 3)).join(' / ')} rad, new ${yn.map(x => f(x, 3)).join(' / ')} rad/s`);
  // the field: the paces' spread and the fastest one the same
  const sp = (phys, tx) => test(tx, () => { Math.random = seeded(5); const T = new C.Track(C.TRACKS.find(d => d.id === 'spa')), r = new C.Race(T, { numAI: 12, playerGrid: 13, laps: 1, phys, seed: 4, difficulty: 1 }), k = r.cars.filter(c => !c.isPlayer).map(c => c.skill); return [Math.min(...k), Math.max(...k)]; });
  const s0 = sp('cs'), s1 = sp('cs', { aiSpr: 0.3 }), s2 = sp('nova', { aiSpr: 1 }), s3 = sp('nova');
  ok('Preizkus: the rivals\' pace spread (aiSpr): 0.3 of the classic\'s with 0.3, the new physics\' own 0.6 by default and the classic\'s with 1, the fastest always the same',
    Math.abs((s1[1] - s1[0]) / (s0[1] - s0[0]) - 0.3) < 0.05 && Math.abs((s2[1] - s2[0]) - (s0[1] - s0[0])) < 1e-9 && Math.abs((s3[1] - s3[0]) / (s0[1] - s0[0]) - C.NVK.aiSpr) < 0.05 && [s1, s2, s3].every(x => Math.abs(x[1] - s0[1]) < 0.01),
    `classic ${f(s0[0], 3)}-${f(s0[1], 3)}, 0.3: ${f(s1[0], 3)}-${f(s1[1], 3)}, new 1: ${f(s2[0], 3)}-${f(s2[1], 3)}, new: ${f(s3[0], 3)}-${f(s3[1], 3)}`);
  // races on Spa (12 rivals, 150 s): the rivals' wheel on a kerb, and how much of the time a car is within half a second behind another
  const spa = (phys, tx) => test(tx, () => { Math.random = seeded(64); const T = new C.Track(C.TRACKS.find(d => d.id === 'spa'));
    const race = new C.Race(T, { numAI: 12, playerGrid: 13, laps: 5, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys, chars: true, slip: true }); race.start();
    let kerb = 0, tot = 0, near = 0, nearN = 0;
    for (let k = 1; k <= 150 / DT; k++) { Math.random = seeded(1000 + k); C.aiControl(race.player, race, DT); race.step(DT);
      for (const c of race.cars) if (!c.isPlayer && k * DT > 8) { tot++; if (c.onCurb) kerb++; }
      if (k * DT > 10 && k % 12 === 0) for (const c of race.cars) { if (c.speed < 8 || c.isPlayer) continue; let nd = 1e9; for (const o of race.cars) { const d = o.dist - c.dist; if (o !== c && d > 0 && d < nd) nd = d; } nearN++; if (nd / c.speed < 0.5) near++; } }
    return { kerb: kerb / tot, near: near / nearN }; });
  const rcs = spa('cs'), rck = spa('cs', { aiKerb: 1.2 }), rnv = spa('nova'), rnk = spa('nova', { aiKerb: 0 }), rtight = spa('cs', { aiSpr: 0.3, aiPush: 0.04, aiSide: 0.15, aiFol: 1.5 });
  ok('Preizkus: the rivals over the kerbs (aiKerb): the classic physics 6 % of the time or more with 1.2, under 3 % by default; the new physics under 3 % with 0, 6 % or more by default',
    rck.kerb >= 0.06 && rcs.kerb < 0.03 && rnv.kerb >= 0.06 && rnk.kerb < 0.03, `classic ${f(rcs.kerb * 100, 1)} % -> ${f(rck.kerb * 100, 1)} %, new ${f(rnv.kerb * 100, 1)} % -> ${f(rnk.kerb * 100, 1)} %`);
  ok('Preizkus: a close train (aiSpr 0.3, aiPush 0.04, aiSide 0.15, aiFol 1.5) on the classic physics: a car within half a second behind another 8 points of the time more than by default',
    rtight.near >= rcs.near + 0.08, `${f(rcs.near * 100, 1)} % -> ${f(rtight.near * 100, 1)} %`);
}

// ---- the rivals' pace ----
{
  const T = new C.Track(C.TRACKS.find(d => d.id === 'spa')), sk = (phys) => { const r = new C.Race(T, { numAI: 12, playerGrid: 13, laps: 1, phys, seed: 4, difficulty: 1 }); const s = r.cars.filter(c => !c.isPlayer).map(c => c.skill); return [Math.min(...s), Math.max(...s)]; };
  const n = sk('nova'), s = sk('cs');
  ok(`the rivals' pace (NVK.aiSpr): spread ${C.NVK.aiSpr} as far as in cs, the fastest the same`, Math.abs((n[1] - n[0]) / (s[1] - s[0]) - C.NVK.aiSpr) < 0.12 && Math.abs(n[1] - s[1]) < 0.01,
    `nova ${f(n[0], 3)}-${f(n[1], 3)}, cs ${f(s[0], 3)}-${f(s[1], 3)}`);
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
