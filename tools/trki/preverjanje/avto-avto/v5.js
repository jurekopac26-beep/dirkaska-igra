// Verifier, part 5: a rig (tractor + trailer) pushing a car from behind (how often the contact breaks and returns) and a car into the cab's side
'use strict';
const { C, RIG, DT, D, KMH, car, setv, sim, none, f, clamp, wrap } = require('./v1.js');
const V = (k) => k / KMH, arg = process.argv[2] || 'all';
const stepCar = (c, plane) => { c.inSteer = 0; c.inThr = 0; c.inBrk = 0; c.inHand = 0; c.step(DT, plane); };
if (arg === 'all' || arg === 'push') {
  for (const [idA, vA, vB] of [['cisterna', 60, 32], ['zrcalni', 60, 32], ['zrcalni', 120, 91], ['rally', 60, 32], ['kamen', 60, 32]]) {
    let A, B; try { A = car('cs', idA, true); B = car('cs', 'rally', false); } catch (e) { console.log(idA, 'ERR', e.message); continue; }
    const plane = RIG.cs.plane, LA = A.m.len, LB = B.m.len;
    setv(B, 0, 0, 0, V(vB)); setv(A, -(LA / 2 + LB / 2 + 1.0), 0, 0, V(vA));
    let nK = 0, nBig = 0, renew = 0, was = false, t1 = null, steps = 0, vB1 = null;
    for (let i = 0; i < 6 * 120; i++) { stepCar(A, plane); stepCar(B, plane);
      const q = [A.vx, B.vx, A.x, B.x]; const imp = C.carCollide(A, B);
      const ch = A.vx !== q[0] || B.vx !== q[1], mv = A.x !== q[2] || B.x !== q[3], touch = ch || mv;
      if (t1 == null && touch) t1 = i;
      if (t1 == null) continue;
      steps++; if (ch) { nK++; if (imp > 0.5) nBig++; } if (touch && !was && steps > 1) renew++; was = touch;
      if (steps === 120) vB1 = B.vx * KMH;
      if (steps >= 240) break; }
    console.log(`${idA} ${vA} > rally ${vB} from behind (mass ${A.m.mass}${A.tl ? ' + trailer' : ''}): knocks ${nK} in ${steps} steps, over 0.5 m/s ${nBig}, contact renewed ${renew} times, A/B after 2 s ${f(A.vx * KMH, 0)}/${f(B.vx * KMH, 0)} km/h`);
  }
}
if (arg === 'all' || arg === 'cab') {
  for (const phys of ['cs', 'nova']) {
    let A, B; try { A = car(phys, 'rally', true); B = car(phys, 'cisterna', false); } catch (e) { console.log('ERR', e.message); continue; }
    const M = B.m, gap = 0.4, tHit = gap / V(100);
    setv(B, 0, -V(60) * tHit, Math.PI / 2, V(60)); setv(A, -(M.wid / 2 + A.m.len / 2 + gap), M.a != null ? M.a : M.len * 0.3, 0, V(100));
    const r = sim(A, B, { phys, T: 3, inA: none, inB: none }); if (!r.hit) { console.log(phys, 'NO HIT'); continue; }
    const a = r.st[0], b = r.st[1];
    console.log(`${phys} car 100 > cab side at the front axle (rig 60 across; tractor a ${M.a} len ${M.len} mass ${M.mass}, I ${f(B.I, 0)}): tractor turnMax ${f(b.turnMax * D, 1)} deg, wMax ${f(b.wMax * D, 0)} deg/s, xgl ${f(b.gl, 2)}, rigid dw ${f(b.dwRig * D, 0)} taken ${f(b.dwTak * D, 0)} | car turnMax ${f(a.turnMax * D, 1)} wMax ${f(a.wMax * D, 0)} | car v 0.1/2 s ${f(a.v[0.1].v * KMH, 0)}/${f(a.v[2].v * KMH, 0)}, tractor ${f(b.v[0.1].v * KMH, 0)}/${f(b.v[2].v * KMH, 0)} | knocks ${r.nK}`);
  }
}
if (arg === 'all' || arg === 'roles') {
  const hold = (c, vT) => { let I = 0.3; return () => { const e = vT - Math.hypot(c.vx, c.vz); I = clamp(I + e * 0.8 * DT, 0, 1); return { thr: clamp(I + 0.35 * e, 0, 1) }; }; };
  for (const [nm, plA, plB, scB] of [['I>T', true, false, false], ['T>I', false, true, false], ['T>T', false, false, false], ['I>sc', true, false, true]]) for (const one of [true, false]) {
    const Vv = V(120), vc = 8, A = car('cs', 'rally', plA), B = car('cs', 'rally', plB), L = A.m.len, W = A.m.wid; if (scB) B.sc = true;
    const al = Math.asin(vc / Vv), gap = 0.4, tc = gap / vc, cx = -0.35 * L - Vv * (Math.cos(al) - 1) * tc, cz = -W / 2 - gap;
    setv(B, 0, 0, 0, Vv); setv(A, cx - (L / 2 * Math.cos(al) - W / 2 * Math.sin(al)), cz - (L / 2 * Math.sin(al) + W / 2 * Math.cos(al)), al, Vv);
    const hA = hold(A, Vv), hB = hold(B, Vv);
    const r = sim(A, B, { phys: 'cs', T: 3, inA: (t, th) => th == null ? hA() : {}, inB: (t, th) => th == null ? hB() : {}, ghostAfter: one ? 0 : undefined }); const b = r.st[1];
    console.log(`rear corner 8 m/s at 120, ${nm} ${one ? 'first knock only' : 'whole contact  '}: B turnMax ${f(b.turnMax * D, 1)} deg, xgl ${f(b.gl, 2)}, wMax ${f(b.wMax * D, 0)} deg/s`);
  }
}
