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
//   a close train with a wheel-to-wheel field (aiSpr, aiPush, aiSide, aiFol: more of the time a car is right behind another); the weight (cMass:
//   the other car heavier in a knock with the player only), the sparks (cFx 0: none, the scrape marks stay); the realistic knocks (cBox flat
//   bumpers, cScrub the classic tyres' hold, cE 0, cMu 0.5): a racing bump does not throw the player's car aside, no bounce and no pop, a heavy
//   car hardly moves when hit or leant on, a car driving along hit from the side keeps its direction; a race with them (Spa, Bathurst): nothing
//   NaN, every car moving, knocks <= 1.5x the default's + 20, slides past 40 deg <= 6
// - Trki med avti brez odboja (Nastavitve; setTest nb 1, over the rows of the knocks): a rival turning into the player's side or into its rear
//   corner does not push the player away or turn it (Realističen, težak does; the new physics: under 2 m/s, turned under 8 deg), the player's own
//   bump or knock into a standing car: no bounce, no turn, no pop, the car hit hardly moves; Razbijanje: odboji in vrtenje and prevračanje do
//   nothing in a knock between cars (the same car rolls over without it), the sparks stay; in the tightest corners a rival drifting into the
//   player hardly moves it whichever order the cars come in; a rival at 130 km/h into the player's rear quarter, the player reversing into a
//   standing rival; a knock into a traffic car moves the player 4 cm at once at most, a standing traffic car or a lying bicycle hit at 45 m/s slides
//   away (the car does not sink in or drive through); who hits whom goes over gradually (no flip for 0.01 m/s), along the road only while the cars
//   close along it; the walls as they were; a race with it (Spa, Bathurst)
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
  // the weight: the other car counts cMass times heavier in a knock with the player (and only then), no sparks with cFx 0
  const heavyHit = (H, tx, pl) => test(tx, () => { const P = H.mkCar('rally', { v: 100 }), O = H.mkCar('rally', { v: 0 }); P.isPlayer = pl; O.isPlayer = false; O.place(0, 0, 0); P.place(-O.m.len - 0.02, 0, 0); P.vx = 27.8; P.fxCar = O.fxCar = 0; P.fxQ = O.fxQ = 0; C.carCollide(P, O); return { p: P.vx, o: O.vx, fx: P.fxQ || O.fxQ ? 0 : Math.max(P.fxCar, O.fxCar), rec: Math.max(P.fxCar, O.fxCar) }; });
  const hv0 = heavyHit(HC, null, true), hv1 = heavyHit(HC, { cE: 0, cMass: 12, cFx: 0 }, true), hv2 = heavyHit(HC, { cE: 0, cMass: 12, cFx: 0 }, false), hv3 = heavyHit(HN, { cE: 0, cMass: 12 }, true);
  ok('Preizkus: the other car 12 times heavier: the player\'s speed goes into it (both leave at about 1/13 of 100 km/h), between two rivals nothing changes, no sparks with cFx 0 (the scrape marks stay: fxCar), sparks by default; the new physics the same',
    Math.abs(hv1.p - 27.8 / 13) < 0.3 && Math.abs(hv1.o - 27.8 / 13) < 0.3 && Math.abs(hv2.o - hv0.o) > 1 && hv2.o > 5 && hv1.fx === 0 && hv1.rec > 3 && hv0.fx > 3 && Math.abs(hv3.p - 27.8 / 13) < 0.3,
    `by default ${f(hv0.p * 3.6)} / ${f(hv0.o * 3.6)} km/h, heavy ${f(hv1.p * 3.6)} / ${f(hv1.o * 3.6)}, two rivals ${f(hv2.p * 3.6)} / ${f(hv2.o * 3.6)}, new ${f(hv3.p * 3.6)} / ${f(hv3.o * 3.6)}`);
  // the turn: a light knock (the classic's attitude kick csKc is capped at 0.4 rad: 0.15 stays under it), the new physics' yaw rate
  const lite = (H, tx) => test(tx, () => { const A = H.mkCar('rally', { v: 60 }), B = H.mkCar('rally', { v: 60 }); A.place(0, 0, 0); A.vx = 16.7; B.place(A.m.len - 3.0, 1.55, -0.06); B.vx = 16.7 * Math.cos(-0.06); B.vz = 16.7 * Math.sin(-0.06); B.h = -0.06;
    C.carCollide(B, A); return [Math.abs(A.csKc), Math.abs(A.w)]; });
  const yc = [null, { cYaw: 0 }, { cYaw: 0.15 }, { cYaw: 1.6 }].map(t => lite(HC, t)[0]), yn = [null, { cYaw: 0 }, { cYaw: 0.4 }].map(t => lite(HN, t)[1]);
  ok('Preizkus: the turn of a knock: the classic kick none with cYaw 0, small with 0.15, more than by default with 1.6 (its cap grows too); the new physics\' spin none with 0, less with 0.4', yc[1] === 0 && yc[2] > 0 && yc[2] < 0.5 * yc[0] && yc[3] > yc[0] + 0.1 && yn[1] === 0 && yn[2] > 0 && yn[2] < yn[0],
    `classic ${yc.map(x => f(x, 3)).join(' / ')} rad, new ${yn.map(x => f(x, 3)).join(' / ')} rad/s`);
  // the realistic knocks (Realističen, težak): two cars on the plane stepped as a race does (both step, then the knock); lane: a driver holding its line
  const REAL = { cE: 0, cMu: 0.5, cYaw: 1, cBox: 1, cScrub: 1 }, D = 180 / Math.PI;
  const lane = (c, z0) => Math.max(-1, Math.min(1, -(0.35 * (c.z - z0) + 2.0 * c.h + 0.25 * c.vz / Math.max(5, c.speed))));
  const duel = (H, tx, set, secs) => test(tx, () => { const S = set(H), P = S.P, O = S.O, x0 = O.x, z0 = O.z, h0 = O.h; let pop = 0, sep = 0, hP = 0, hO = 0, oz = 0, t1 = null;
    for (let i = 1; i <= secs / DT; i++) { H.step(P, S.iP(i * DT)); H.step(O, S.iO(i * DT)); const x = P.x, z = P.z, m = C.carCollide(P, O); pop = Math.max(pop, Math.hypot(P.x - x, P.z - z));
      oz = Math.max(oz, Math.abs(-(O.x - x0) * Math.sin(h0) + (O.z - z0) * Math.cos(h0)));   // (the other car pushed aside: from the start, a push without a knock too)
      if (m > 0 && t1 == null) t1 = i; if (t1 == null) continue;
      const dx = O.x - P.x, dz = O.z - P.z, d = Math.hypot(dx, dz); sep = Math.max(sep, ((O.vx - P.vx) * dx + (O.vz - P.vz) * dz) / d);
      hP = Math.max(hP, Math.abs(P.h) * D); hO = Math.max(hO, Math.abs(O.h - h0) * D); }
    return { hit: t1 != null, pop, sep, hP, hO, hE: Math.abs(O.h - h0) * D, oz, om: Math.hypot(O.x - x0, O.z - z0), pv: P.speed, ov: O.speed }; });
  const car = (H, v, pl) => { const c = H.mkCar('rally', { v }); c.isPlayer = pl; c.noReverse = true; return c; };
  // a racing bump: the player at 120 km/h into a car at 100, 0.6 m off its middle, both holding their lines
  const bump = (H) => { const P = car(H, 120, true), O = car(H, 100, false); O.place(0, 0, 0); P.place(-O.m.len - 0.3, 0.6, 0); P.vx = 33.3; O.vx = 27.8;
    return { P, O, iP: () => ({ st: lane(P, 0.6), thr: 'hold' }), iO: () => ({ st: lane(O, 0), thr: 'hold' }) }; };
  // 50 km/h into a standing car (its brakes on), the player keeping the throttle
  const stand = (H) => { const P = car(H, 50, true), O = car(H, 0, false); O.place(0, 0, 0); P.place(-O.m.len - 0.05, 0, 0); P.vx = 13.9;
    return { P, O, iP: () => ({ st: lane(P, 0), thr: 'hold' }), iO: () => ({ st: 0, thr: 0, brk: 1 }) }; };
  // side by side at 100 km/h, the player leaning on the other car for 1 s
  const lean = (H) => { const P = car(H, 100, true), O = car(H, 100, false), w = O.m.wid + 0.15; P.place(0, 0, 0); O.place(0, w, 0); P.vx = O.vx = 27.8;
    return { P, O, iP: (t) => ({ st: t < 1 ? 0.25 : lane(P, 0), thr: 'hold' }), iO: () => ({ st: lane(O, w), thr: 'hold' }) }; };
  // a car driving along at 100 km/h hit in its flank by one at 20 deg to it (the other keeps its wheel straight)
  const flank = (H) => { const P = car(H, 100, true), O = car(H, 100, false), a = 0.35, L = O.m.len; O.place(0, 0, 0); O.vx = 27.8; P.place(-Math.cos(a) * L / 2, -0.98 - Math.sin(a) * L / 2, a); P.vx = 27.8 * Math.cos(a); P.vz = 27.8 * Math.sin(a);
    return { P, O, iP: () => ({ st: 0, thr: 0 }), iO: () => ({ st: 0, thr: 'hold' }) }; };
  const bu0 = duel(HC, null, bump, 1.5), bu1 = duel(HC, REAL, bump, 1.5), bu8 = duel(HC, { ...REAL, cMass: 8 }, bump, 1.5);
  ok('Preizkus: realistic knocks (classic): a racing bump 0.6 m off the middle does not throw the player\'s car aside (it turns under 3 deg, the old round ends 4 deg or more), no bounce apart; with the other car 8x heavier the player takes its speed',
    bu0.hit && bu1.hit && bu1.hP < 3 && bu0.hP >= 4 && bu1.sep < 0.3 && bu8.hP < 3 && bu8.sep < 0.3 && Math.abs(bu8.pv - 27.8) < 1.5,
    `the player turns ${f(bu0.hP, 1)} -> ${f(bu1.hP, 1)} deg (8x: ${f(bu8.hP, 1)}), apart at ${f(bu1.sep * 3.6, 1)} km/h, 8x: the player at ${f(bu8.pv * 3.6, 0)} km/h`);
  const st0 = duel(HC, null, stand, 2), st8 = duel(HC, { ...REAL, cMass: 8 }, stand, 2), stn = duel(HN, { ...REAL, cMass: 8 }, stand, 2);
  ok('Preizkus: realistic knocks: 50 km/h into a standing car 8x heavier: no pop (under 4 cm a step; the old 10 cm or more), no bounce, the player stopped, the other moved under 0.5 m (the old one: 3 m or more); the new physics the same',
    st8.pop < 0.04 && st0.pop >= 0.1 && st8.sep < 0.3 && st8.pv < 1.5 && st8.om < 0.5 && st0.om >= 3 && stn.pop < 0.04 && stn.om < 0.5 && stn.pv < 1.5,
    `pop ${f(st0.pop * 100, 0)} -> ${f(st8.pop * 100, 0)} cm, the other moved ${f(st0.om, 1)} -> ${f(st8.om, 2)} m, the player at ${f(st8.pv * 3.6, 1)} km/h; new: ${f(stn.pop * 100, 0)} cm, ${f(stn.om, 2)} m`);
  const le0 = duel(HC, null, lean, 2.5), le8 = duel(HC, { ...REAL, cMass: 8 }, lean, 2.5);
  ok('Preizkus: realistic knocks: leaning on a car 8x heavier at 100 km/h for 1 s pushes it aside under 0.2 m (the old: 0.6 m or more)', le8.hit && le8.oz < 0.2 && le0.oz >= 0.6, `${f(le0.oz, 2)} -> ${f(le8.oz, 2)} m`);
  const fl0 = duel(HC, null, flank, 1.2), fl1 = duel(HC, REAL, flank, 1.2), fln = duel(HN, REAL, flank, 1.2);
  ok('Preizkus: realistic knocks: a car driving along hit in its flank keeps its direction (under 6 deg at most; the old classic turns 9 deg or more): the tyres hold the push; the new physics back within 6 deg after 1.2 s',
    fl0.hit && fl1.hit && fl1.hO < 6 && fl0.hO >= 9 && fln.hE < 6, `classic ${f(fl0.hO, 1)} -> ${f(fl1.hO, 1)} deg, new ${f(fln.hO, 1)} deg at most, ${f(fln.hE, 1)} after 1.2 s`);
  // Trki med avti brez odboja (TX.nb): one switch over the other knock settings; the car hit the heavier one, no bounce, no turn, the sparks stay
  C.setTest({ nb: 1, cE: 0.6, cYaw: 1.6, cMass: 1, cBox: 0, cFx: 0, cScrub: 0, cMu: 0 }); const nbT = Object.assign({}, C.TX); C.setTest({ nb: 2 }); const nb2 = C.TX.nb; C.setTest(null);
  ok('Trki med avti brez odboja: setTest({ nb: 1 }) puts its own knock settings over the rows (no bounce, no turn, 8x, rub 0.5, flat bumpers, the tyres\' hold, sparks on), only 1 turns it on, setTest(null) clears it',
    nbT.nb === 1 && nbT.cE === 0 && nbT.cYaw === 0 && nbT.cMass === 8 && nbT.cMu === 0.5 && nbT.cBox === 1 && nbT.cScrub === 1 && nbT.cFx === 1 && nb2 === null && all(), JSON.stringify(nbT));
  const NB = { nb: 1 }, REAL8 = { ...REAL, cMass: 8, cFx: 0 };   // (REAL8: Realističen, težak as the settings give it)
  // the player's wheel straight (what the knock alone does): the largest sideways speed and turn of the player after the first touch, the parting, the pop
  const push = (H, tx, set, secs) => test(tx, () => { const S = set(H), P = S.P, O = S.O, x0 = O.x, z0 = O.z; let vz = 0, h = 0, sep = 0, pop = 0, hit = false;
    for (let i = 1; i <= secs / DT; i++) { H.step(P, S.iP); H.step(O, S.iO); const x = P.x, z = P.z, m = C.carCollide(P, O); pop = Math.max(pop, Math.hypot(P.x - x, P.z - z)); if (m > 0) hit = true; if (!hit) continue;
      vz = Math.max(vz, Math.abs(P.vz)); h = Math.max(h, Math.abs(P.h) * D); const dx = O.x - P.x, dz = O.z - P.z, d = Math.hypot(dx, dz); sep = Math.max(sep, ((O.vx - P.vx) * dx + (O.vz - P.vz) * dz) / d); }
    return { hit, vz, h, sep, pop, pv: P.speed, om: Math.hypot(O.x - x0, O.z - z0) }; });
  // a rival at 100 km/h turning into the player's side at 15 deg; a rival into the player's rear corner at 17 deg; 100 km/h into a standing car 0.9 m off its middle
  const swiped = (H) => { const P = car(H, 100, true), O = car(H, 100, false), a = -0.26; P.place(0, 0, 0); P.vx = 27.8; O.place(P.m.len - 3.0, 2.2, a); O.vx = 27.8 * Math.cos(a); O.vz = 27.8 * Math.sin(a); return { P, O, iP: { st: 0, thr: 'hold' }, iO: { st: 0, thr: 'hold' } }; };
  const pit = (H) => { const P = car(H, 100, true), O = car(H, 100, false), a = 0.3; P.place(0, 0, 0); P.vx = 27.8; O.place(-P.m.len * 0.7, -P.m.wid - 0.45, a); O.vx = 27.8 * Math.cos(a); O.vz = 27.8 * Math.sin(a); return { P, O, iP: { st: 0, thr: 'hold' }, iO: { st: 0, thr: 'hold' } }; };
  const standZ = (H) => { const P = car(H, 100, true), O = car(H, 0, false); O.place(0, 0, 0); P.place(-O.m.len - 0.05, 0.9, 0); P.vx = 27.8; return { P, O, iP: { st: 0, thr: 0 }, iO: { st: 0, thr: 0, brk: 1 } }; };
  const sw1 = push(HC, REAL8, swiped, 1.2), sw2 = push(HC, NB, swiped, 1.2), pi1 = push(HC, REAL8, pit, 1.2), pi2 = push(HC, NB, pit, 1.2);
  ok('Trki med avti brez odboja (classic): a rival turning into the player\'s side does not push the player away (under 2 m/s sideways, turned under 3 deg, no parting; Realističen, težak 5 m/s or more), nor one into its rear corner (under 2 m/s, under 2 deg)',
    sw2.hit && sw2.vz < 2 && sw2.h < 3 && sw2.sep < 0.3 && sw1.vz >= 5 && pi2.hit && pi2.vz < 2 && pi2.h < 2 && pi1.vz >= 5,
    `side ${f(sw1.vz * 3.6, 1)} -> ${f(sw2.vz * 3.6, 1)} km/h, ${f(sw1.h, 1)} -> ${f(sw2.h, 1)} deg; rear corner ${f(pi1.vz * 3.6, 1)} -> ${f(pi2.vz * 3.6, 1)} km/h, ${f(pi2.h, 1)} deg`);
  const bnb = duel(HC, NB, bump, 1.5), sz1 = push(HC, REAL8, standZ, 2), sz2 = push(HC, NB, standZ, 2);
  ok('Trki med avti brez odboja (classic): the player\'s racing bump 0.6 m off the middle: not turned (under 0.5 deg; the realistic 2 deg), no bounce, no pop, it takes the other car\'s speed; 100 km/h into a standing car 0.9 m off its middle: stopped, not turned (the realistic 5 deg or more), the other moved under 0.6 m',
    bnb.hit && bnb.hP < 0.5 && bnb.sep < 0.1 && bnb.pop < 0.01 && Math.abs(bnb.pv - 27.8) < 1.5 && sz2.hit && sz2.h < 1 && sz2.pv < 1 && sz2.om < 0.6 && sz2.sep < 0.1 && sz1.h >= 5,
    `bump: ${f(bnb.hP, 2)} deg, apart ${f(bnb.sep * 3.6, 2)} km/h, pop ${f(bnb.pop * 100, 1)} cm, ${f(bnb.pv * 3.6, 0)} km/h; standing car: ${f(sz1.h, 1)} -> ${f(sz2.h, 1)} deg, ${f(sz2.pv * 3.6, 1)} km/h, the other ${f(sz2.om, 2)} m`);
  const nsw = push(HN, NB, swiped, 1.2), npi = push(HN, NB, pit, 1.2), nsz = push(HN, NB, standZ, 2);
  ok('Trki med avti brez odboja (new physics): the rival into the player\'s side or rear corner (both touching) pushes it under 2 m/s sideways, turned under 8 deg; into a standing car: stopped, not turned, no bounce',
    nsw.hit && npi.hit && nsz.hit && nsw.vz < 2 && nsw.h < 8 && npi.vz < 2 && npi.h < 8 && nsz.h < 1 && nsz.pv < 1 && nsz.sep < 0.1, `side ${f(nsw.vz * 3.6, 1)} km/h ${f(nsw.h, 1)} deg, rear corner ${f(npi.vz * 3.6, 1)} km/h ${f(npi.h, 1)} deg, standing ${f(nsz.h, 1)} deg ${f(nsz.pv * 3.6, 1)} km/h`);
  // a hard knock on the side with Razbijanje: odboji in vrtenje and prevračanje on: no grip lost, no rolling over; the sparks as ever. One knock in ten
  // rolls a car over (XROLL.p, a hash of the car's id): the car hit gets the first id that rolls over without the switch
  const side = (tx, id) => test(tx, () => { C.setCrash({ bump: 1, roll: 1 }); try { const P = car(HC, 100, true), O = car(HC, 0, false); O.id = id; P.id = id + 100; O.place(0, 0, Math.PI / 2); P.place(-P.m.len / 2 - O.m.wid / 2 - 0.02, 0, 0); P.vx = 27.8; P.fxQ = O.fxQ = 0; P.fxCar = O.fxCar = 0;
    let rl = false, gl = 0; for (let k = 0; k < 4; k++) { C.carCollide(P, O); rl = rl || !!P.rl || !!O.rl; gl = Math.max(gl, P.xgl || 0, O.xgl || 0); P.x += P.vx * DT; }
    return { rl, gl, fx: P.fxQ || O.fxQ ? 0 : Math.max(P.fxCar, O.fxCar) }; } finally { C.setCrash(null); } });
  let rid = 0; for (let id = 1; id <= 100 && !rid; id++) if (side(null, id).rl) rid = id;
  const sd0 = side(null, rid), sd1 = side(NB, rid);
  ok('Trki med avti brez odboja: a hard knock with Razbijanje: odboji in vrtenje and prevračanje on loses no grip and rolls no car over (without it the same car loses grip and rolls over), the sparks stay',
    rid > 0 && sd0.rl && sd0.gl > 0 && !sd1.rl && sd1.gl === 0 && sd1.fx > 3, JSON.stringify({ id: rid, off: sd0, on: sd1 }));
  // in a corner who hits whom is seen on each car's own road: the player and a rival side by side in the tightest corners of Spa, Bathurst and the
  // Red Bull Ring (12 and 20 m/s, the rival 2 m ahead or behind, on either side), the rival drifting into the player at 1 m/s; one knock, both
  // orders of the cars (the race calls carCollide either way): the player's share of the two cars' change of speed
  const wrapA = (x) => Math.atan2(Math.sin(x), Math.cos(x));
  const corner = (T, i0, v, di, dO, pFirst) => test(NB, () => { const N = T.N, mk = (pl) => { const c = new C.Car(C.MODELS.find(m => m.id === 'rally'), { isPlayer: pl, phys: 'cs', assist: 2 }); c.locked = false; return c; }, P = mk(true), O = mk(false);
    const put = (c, i, d, drift) => { const k = ((i % N) + N) % N, h = T.hd[k]; c.place(T.px[k] + T.nx[k] * d, T.pz[k] + T.nz[k] * d, h); c.q = T.query(c.x, c.z, k, c.q); c.vx = Math.cos(h) * v - Math.sin(h) * drift; c.vz = Math.sin(h) * v + Math.cos(h) * drift; c.w = v * wrapA(T.hd[(k + 1) % N] - h) / T.ds; };
    const sg = Math.sign(dO); put(P, i0, 0, 0); const p0 = [P.x, P.z, P.vx, P.vz, P.h, P.w]; let r = 0;
    for (let d = dO; Math.abs(d) > 0.5 && !(r > 0); d -= sg * 0.002) { Object.assign(P, { x: p0[0], z: p0[1], vx: p0[2], vz: p0[3], h: p0[4], w: p0[5], csKc: 0, cSx: 0, cSz: 0 }); put(O, i0 + di, d, -sg); r = pFirst ? C.carCollide(P, O) : C.carCollide(O, P); }
    const dp = Math.hypot(P.vx - p0[2], P.vz - p0[3]), dr = Math.hypot(O.vx - Math.cos(O.h) * v + Math.sin(O.h) * -sg, O.vz - Math.sin(O.h) * v - Math.cos(O.h) * -sg);
    return r > 0.3 ? dp / (dp + dr) : null; });
  let cn = 0, cbad = 0, cmax = 0;
  for (const tid of ['spa', 'bathurst', 'rbring']) { const T = new C.Track(C.TRACKS.find(d => d.id === tid)), ks = []; for (let i = 0; i < T.N; i++) ks.push([Math.abs(T.k[i]), i]); ks.sort((x, y) => y[0] - x[0]);
    for (const [, i0] of ks.slice(0, 2)) for (const v of [12, 20]) for (const di of [-1, 1]) for (const dO of [2.4, -2.4]) for (const pf of [false, true]) { const sh = corner(T, i0, v, di, dO, pf); if (sh == null) continue; cn++; cmax = Math.max(cmax, sh); if (!(sh <= 0.25)) cbad++; } }
  ok('Trki med avti brez odboja: in a corner a rival drifting into the player hardly moves it, whichever order the cars come in (the player\'s share of the knock under 25 % every time)',
    cn >= 40 && cbad === 0, `${cn} knocks in corners, the player over 25 % in ${cbad}, the most ${f(cmax * 100, 0)} %`);
  // the verdict goes over gradually: flank to flank, both moving over at each other at 3.00 and 3.01 m/s, the split about even (the player not 8 times
  // heavier for 0.01 m/s), the rival alone moving over: the player heavy; corner to corner at 45 deg, the rival moving over into the player's front
  // corner at 2 m/s: the cars part along the road (the player 0.5 m/s slower behind it), so only across tells: the player hardly moves; a hair
  // faster or slower along the road (0.01 m/s) changes the split only a little
  const flank2 = (up, uo, pf) => test(NB, () => { const P = car(HC, 90, true), O = car(HC, 90, false); P.place(0, 0, 0); O.place(0, P.m.wid - 0.01, 0); P.vx = O.vx = 25; P.vz = up; O.vz = -uo;
    const r = pf ? C.carCollide(P, O) : C.carCollide(O, P), dp = Math.hypot(P.vx - 25, P.vz - up), dr = Math.hypot(O.vx - 25, O.vz + uo); return r > 0 ? dp / (dp + dr) : NaN; });
  const c45 = (dv, pf) => test(NB, () => { const P = car(HC, 90, true), O = car(HC, 90, false), L = P.m.len, W = P.m.wid, r = Math.min(0.3, W * 0.45), g = 2 * r - 0.012;
    P.place(0, 0, 0); P.vx = 25 + dv; O.place(L - 2 * r + g * Math.SQRT1_2, W - 2 * r + g * Math.SQRT1_2, 0); O.vx = 25; O.vz = -2;
    const k = pf ? C.carCollide(P, O) : C.carCollide(O, P), dp = Math.hypot(P.vx - 25 - dv, P.vz), dr = Math.hypot(O.vx - 25, O.vz + 2); return k > 0 ? dp / (dp + dr) : NaN; });
  const fe = [flank2(3, 3.01, true), flank2(3.01, 3, false), flank2(0, 3, true), flank2(0, 3, false)], ce = [c45(-0.5, true), c45(-0.5, false), c45(-0.01, true), c45(0.01, false)];
  ok('Trki med avti brez odboja: who hits whom goes over gradually: both moving over at each other (3.00 / 3.01 m/s) split about even (40-60 %), the rival alone: the player under 20 %; corner to corner, the rival moving over while the cars part along the road: the player under 20 %, a hair along the road changes it under 5 points',
    fe.slice(0, 2).every(x => x >= 0.4 && x <= 0.6) && fe.slice(2).every(x => x < 0.2) && ce.every(x => x < 0.2) && Math.abs(ce[2] - ce[3]) < 0.05,
    `flank ${fe.map(x => f(x * 100, 0) + ' %').join(' / ')}; corner ${ce.map(x => f(x * 100, 0) + ' %').join(' / ')}`);
  // a rival at 130 km/h at 46 deg into the player's rear quarter (the cars part along the road: only across tells); the player reversing into a rival
  // standing behind it with its brakes on (the player hits it)
  const tbone = (H) => test(NB, () => { const P = car(H, 100, true), O = car(H, 130, false), a = 0.8; P.place(0, 0, 0); P.vx = 27.8; O.place(-P.m.len * 0.35 - Math.cos(a) * 2.6, -Math.sin(a) * 2.6 - 0.9, a); O.vx = 36.1 * Math.cos(a); O.vz = 36.1 * Math.sin(a);
    let vz = 0, h = 0, hit = false; for (let i = 1; i <= 1.2 / DT; i++) { H.step(P, { st: 0, thr: 'hold' }); H.step(O, { st: 0, thr: 'hold' }); if (C.carCollide(P, O) > 0) hit = true; if (hit) { vz = Math.max(vz, Math.abs(P.vz)); h = Math.max(h, Math.abs(P.h) * D); } } return { hit, vz, h }; });
  const backUp = (H) => test(NB, () => { const P = car(H, 0, true), O = car(H, 0, false); P.noReverse = false; P.place(0, 0, 0); O.place(-P.m.len - 0.3, 0, 0); P.vx = -3; P.gear = -1; const x0 = O.x; let hit = false;
    for (let i = 1; i <= 1 / DT; i++) { H.step(P, { st: 0, thr: 0, brk: 1 }); H.step(O, { st: 0, thr: 0, brk: 1 }); if (C.carCollide(P, O) > 0) hit = true; } return { hit, om: Math.abs(O.x - x0) }; });
  const tb1 = tbone(HC), tb2 = tbone(HN), rv1 = backUp(HC), rv2 = backUp(HN);
  ok('Trki med avti brez odboja: a rival at 130 km/h into the player\'s rear quarter pushes it under 2.5 m/s sideways (classic and new physics); the player reversing into a standing rival hardly moves it (under 0.3 m)',
    tb1.hit && tb2.hit && tb1.vz < 2.5 && tb2.vz < 2.5 && rv1.hit && rv2.hit && rv1.om < 0.3 && rv2.om < 0.3,
    `rear quarter: classic ${f(tb1.vz * 3.6, 1)} km/h ${f(tb1.h, 1)} deg, new ${f(tb2.vz * 3.6, 1)} km/h ${f(tb2.h, 1)} deg; reversing: the rival moved ${f(rv1.om, 2)} / ${f(rv2.om, 2)} m`);
  // the traffic (the duel up Vršič): the player 25 cm into the rear of a traffic car and 8 m/s faster: one knock moves it NB.cap at most (no pop),
  // without the switch the whole overlap at once
  const tfKnock = (tx) => test(tx, () => { Math.random = seeded(3); const T = new C.Track(C.TRACKS.find(d => d.id === 'vrsic'));
    const r = new C.Race(T, { numAI: 1, playerGrid: 2, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, damage: 2, traffic: true }); r.start();
    const P = r.player, v = r.tf.veh.find(x => x.kind === 0 && x.dir > 0 && x.s - T.startS > 2500 && x.s - T.startS < 6000), ch = Math.cos(v.h), sh = Math.sin(v.h), back = v.len / 2 + P.m.len / 2 - 0.25;
    P.place(v.x - ch * back, v.z - sh * back, v.h); P.q = T.query(P.x, P.z, -1, P.q); P.vx = ch * (v.v + 8); P.vz = sh * (v.v + 8); const x0 = P.x, z0 = P.z, imp = r.tf._hitVeh(P, v);
    return { imp, pop: Math.hypot(P.x - x0, P.z - z0) }; });
  // a standing traffic vehicle (knocked loose earlier, at rest) hit from behind at 45 m/s, the whole race step: with the switch it slides away with its
  // share, the car does not sink into it or drive through it
  const tfStand = (kind) => test(NB, () => { Math.random = seeded(3); const T = new C.Track(C.TRACKS.find(d => d.id === 'vrsic'));
    const r = new C.Race(T, { numAI: 1, playerGrid: 2, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, damage: 2, traffic: true }); r.start();
    for (const c of r.cars) if (!c.isPlayer) { const i = T.idx(T.finishS - 150); c.place(T.px[i] + T.nx[i] * 2, T.pz[i] + T.nz[i] * 2, T.hd[i]); c.q = T.query(c.x, c.z, i, c.q); c.locked = true; }
    const P = r.player, v = r.tf.veh.find(x => x.kind === 0 && x.dir > 0 && x.s - T.startS > 2500 && x.s - T.startS < 6000);
    for (const o of r.tf.veh) if (o !== v && Math.abs(o.s - v.s) < 400) o.off = true; for (const pd of r.tf.ped) if (Math.abs(pd.s - v.s) < 400) pd.off = true;
    const K = { 0: [4.3, 1.8, 1300], 4: [1.8, 0.6, 90] }[kind]; v.kind = kind; v.len = K[0]; v.wid = K[1]; v.mass = K[2]; v.st = 2; v.t = 0; v.nc = 0; v.vx = v.vz = v.w = 0; v.v = 0; if (v.grp) { v.grp.m.splice(v.grp.m.indexOf(v), 1); v.grp = null; }
    const ch = Math.cos(v.h), sh = Math.sin(v.h), back = v.len / 2 + P.m.len / 2 + 0.2; P.place(v.x - ch * back, v.z - sh * back, v.h); P.y = P.py = P.roadY = T.hy[T.idx(v.s)]; P.q = T.query(P.x, P.z, -1, P.q); P.sPrev = P.q.s; P.vx = ch * 45; P.vz = sh * 45; P.locked = false;
    let pen = 0, through = false; for (let i = 0; i < 2 / DT; i++) { P.inThr = 0.5; P.inBrk = 0; P.inSteer = 0; P.inHand = 0; r.step(DT);
      const cv = Math.cos(v.h), sv = Math.sin(v.h), nbs = Math.max(2, Math.round(v.len / v.wid)); for (const ci of P.circles) { const ax = P.x + Math.cos(P.h) * ci, az = P.z + Math.sin(P.h) * ci; for (let j = 0; j < nbs; j++) { const o = -(v.len - v.wid) / 2 + j * (v.len - v.wid) / (nbs - 1); pen = Math.max(pen, P.rad + v.wid / 2 - Math.hypot(ax - v.x - cv * o, az - v.z - sv * o)); } }
      if ((P.x - v.x) * cv + (P.z - v.z) * sv > 0.3) through = true; }
    return { pen, through, vv: Math.hypot(v.vx, v.vz) }; });
  const ts0 = tfStand(0), ts4 = tfStand(4);
  ok('Trki med avti brez odboja: a standing traffic car or a lying bicycle hit at 45 m/s slides away with its share; the car does not sink in (under 0.35 m, one step at that speed) or drive through',
    !ts0.through && !ts4.through && ts0.pen < 0.35 && ts4.pen < 0.35 && ts0.vv > 5 && ts4.vv > 5, `car: ${f(ts0.pen, 2)} m deep, slides at ${f(ts0.vv * 3.6, 0)} km/h; bicycle: ${f(ts4.pen, 2)} m, ${f(ts4.vv * 3.6, 0)} km/h`);
  const tk0 = tfKnock(null), tk1 = tfKnock(NB);
  ok('Trki med avti brez odboja: a knock into a traffic car moves the player at most 4 cm at once (without it the whole overlap)',
    tk0.imp > 3 && tk1.imp > 3 && tk1.pop <= 0.0401 && tk0.pop > 0.06, `pop ${f(tk0.pop * 100, 1)} -> ${f(tk1.pop * 100, 1)} cm (closing ${f(tk1.imp * 3.6, 0)} km/h)`);
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
  C.setTest({ nb: 1 }); const w1 = hit('cs'), w2 = hit('nova'); C.setTest(null);
  ok('walls: Trki med avti brez odboja leaves the knock off the barrier as it was (the user\'s), for both physics', w1 === b && w2 === a, w1 === b && w2 === a ? 'identical' : `cs ${w1} / ${b}, nova ${w2} / ${a}`);
}

// ---- races ----
function pack(tid, phys, tx) {
  C.setTest(tx || null); Math.random = seeded(64);
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
  C.setTest(null);
  return { hits, slides, nan, moving: race.cars.filter(c => c.speed > 5).length, n: race.cars.length, kerb: kerb / tot };
}
for (const tid of ['spa', 'bathurst']) {
  const n = pack(tid, 'nova'), s = pack(tid, 'cs');
  ok(`race ${tid}: nothing NaN, every car moving, knocks between cars <= 1.5x cs's + 20, slides past 40 deg <= 6`, !n.nan && n.moving === n.n && n.hits <= 1.5 * s.hits + 20 && n.slides <= 6,
    `nova ${n.hits} knocks, ${n.slides} slides, ${n.moving}/${n.n} moving; cs ${s.hits} knocks, ${s.slides} slides`);
  ok(`race ${tid}: the rivals over the kerbs (a wheel on one 6 % of the time or more; cs under 3 %)`, n.kerb >= 0.06 && s.kerb < 0.03, `nova ${f(n.kerb * 100, 1)} %, cs ${f(s.kerb * 100, 1)} %`);
  const r = pack(tid, 'cs', { cE: 0, cMu: 0.5, cYaw: 1, cBox: 1, cScrub: 1, cMass: 8, cFx: 0 });
  ok(`race ${tid} with the realistic knocks (Realističen, težak; classic): nothing NaN, every car moving, knocks <= 1.5x the default's + 20, slides past 40 deg <= 6`, !r.nan && r.moving === r.n && r.hits <= 1.5 * s.hits + 20 && r.slides <= 6,
    `${r.hits} knocks, ${r.slides} slides, ${r.moving}/${r.n} moving; by default ${s.hits} knocks`);
  const nb = pack(tid, 'cs', { nb: 1 });
  ok(`race ${tid} with Trki med avti brez odboja (classic): nothing NaN, every car moving, knocks <= 1.5x the default's + 20, slides past 40 deg <= 6`, !nb.nan && nb.moving === nb.n && nb.hits <= 1.5 * s.hits + 20 && nb.slides <= 6,
    `${nb.hits} knocks, ${nb.slides} slides, ${nb.moving}/${nb.n} moving; by default ${s.hits} knocks`);
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
