// Independent check (verifier): two cars on the flat plane, stepped as Race._step (cars step, then the pair). My own placement and reading.
'use strict';
const path = require('path');
const ROOT = require('path').join(__dirname, '..', '..', '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const C = loadCore();
const handling = require(path.join(ROOT, 'tests/lib/handling.js'));
const RIG = { cs: handling(C, 'cs'), nova: handling(C, 'nova') };
const DT = 1 / 120, D = 180 / Math.PI, KMH = 3.6;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const f = (x, d = 1) => x == null || !Number.isFinite(x) ? '-' : x.toFixed(d);

function car(phys, id, player) {
  const c = RIG[phys].mkCar(id, { v: 0 });
  c.isPlayer = !!player; c.noReverse = true; return c;
}
function setv(c, x, z, h, v, dir) {
  const a = dir == null ? h : dir, M = c.m;
  c.place(x, z, h); c.vx = v * Math.cos(a); c.vz = v * Math.sin(a);
  for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
}
const massOf = (c) => c.m.mass + (c.fuelKg || 0);
const keOf = (c) => 0.5 * massOf(c) * (c.vx * c.vx + c.vz * c.vz) + 0.5 * c.I * c.w * c.w;
// o: { phys, T (s after the first knock), inA(t, th, A, B), inB(...), order ('AB' | 'BA'), ghostAfter (s after the first knock A no longer collides), preCoast }
function sim(A, B, o) {
  const plane = RIG[o.phys].plane, cars = [A, B];
  const st = cars.map(c => ({ hU: c.h, hP: c.h, h0: c.h, turnMax: 0, wMax: 0, gl: 0, v: {}, x0: 0, z0: 0, dvx: 0, dvz: 0, dwTak: 0, dwRig: 0, kcMax: 0 }));
  let tK = null; let t1 = null, gainN = 0, gainMax = 0, nK = 0, pErr = 0, pScale = 1, E0 = 0, first = null;
  const marks = [0.1, 0.5, 1, 2, 3];
  const trace = [];
  const N = Math.round((4 + o.T) / DT);
  for (let i = 1; i <= N; i++) {
    const t = i * DT, th = t1 == null ? null : t - t1;
    for (let k = 0; k < 2; k++) { const c = cars[k], I = (k ? o.inB : o.inA)(t, th, A, B) || {};
      c.inSteer = I.st || 0; c.inThr = I.thr || 0; c.inBrk = I.brk || 0; c.inHand = 0;
      const rate = c.isPlayer ? 16 : 10; c.steer += clamp(c.inSteer - c.steer, -rate * DT, rate * DT);
      c.step(DT, plane); }
    const b4 = cars.map(c => ({ vx: c.vx, vz: c.vz, w: c.w, x: c.x, z: c.z, ke: keOf(c) }));
    const ghost = o.ghostAfter != null && tK != null && t - tK > o.ghostAfter - 1e-9;
    const imp = ghost ? 0 : (o.order === 'BA' ? C.carCollide(B, A) : C.carCollide(A, B));
    const ch = cars.some((c, k) => c.vx !== b4[k].vx || c.vz !== b4[k].vz || c.w !== b4[k].w);
    const mv = cars.some((c, k) => c.x !== b4[k].x || c.z !== b4[k].z);
    if (t1 == null && (ch || mv)) { t1 = t; E0 = b4[0].ke + b4[1].ke; pScale = massOf(A) * Math.hypot(b4[0].vx, b4[0].vz) + massOf(B) * Math.hypot(b4[1].vx, b4[1].vz);
      cars.forEach((c, k) => { st[k].h0 = c.h; st[k].hU = c.h; st[k].hP = c.h; st[k].x0 = b4[k].x; st[k].z0 = b4[k].z; st[k].v0 = Math.hypot(b4[k].vx, b4[k].vz); st[k].vx0 = b4[k].vx; st[k].vz0 = b4[k].vz; }); }
    if (ch) { nK++; if (tK == null) tK = t; const dE = keOf(A) + keOf(B) - b4[0].ke - b4[1].ke; if (dE > 1e-6) { gainN++; gainMax = Math.max(gainMax, dE); }
      let px = 0, pz = 0;
      cars.forEach((c, k) => { const m = massOf(c), Px = m * (c.vx - b4[k].vx), Pz = m * (c.vz - b4[k].vz); px += Px; pz += Pz;
        const rx = c.contactX - c.x, rz = c.contactZ - c.z; if (Number.isFinite(rx + rz)) st[k].dwRig += (rx * Pz - rz * Px) / c.I; st[k].dwTak += c.w - b4[k].w; st[k].dvx += c.vx - b4[k].vx; st[k].dvz += c.vz - b4[k].vz; });
      pErr = Math.max(pErr, Math.hypot(px, pz) / pScale);
      if (!first) first = { imp, dvA: Math.hypot(A.vx - b4[0].vx, A.vz - b4[0].vz), dvB: Math.hypot(B.vx - b4[1].vx, B.vz - b4[1].vz), dwA: A.w - b4[0].w, dwB: B.w - b4[1].w, kcA: A.csKc, kcB: B.csKc, glA: A.xgl || 0, glB: B.xgl || 0 }; }
    if (t1 == null) continue;
    const tt = t - t1;
    cars.forEach((c, k) => { const S = st[k]; S.hU += wrap(c.h - S.hP); S.hP = c.h; const tu = S.hU - S.h0; if (Math.abs(tu) > Math.abs(S.turnMax)) S.turnMax = tu;
      S.wMax = Math.max(S.wMax, Math.abs(c.w)); S.gl = Math.max(S.gl, c.xgl || 0); S.kcMax = Math.max(S.kcMax, Math.abs(c.csKc || 0));
      for (const m of marks) if (S.v[m] == null && tt >= m - 1e-9) S.v[m] = { v: Math.hypot(c.vx, c.vz), vx: c.vx, vz: c.vz, x: c.x, z: c.z, turn: tu, w: c.w }; });
    if (o.trace && tt <= o.trace) trace.push({ t: tt, A: { x: A.x, z: A.z, h: A.h, vx: A.vx, vz: A.vz, w: A.w, gl: A.xgl || 0 }, B: { x: B.x, z: B.z, h: B.h, vx: B.vx, vz: B.vz, w: B.w, gl: B.xgl || 0, cs: Math.hypot(B.cSx || 0, B.cSz || 0) }, imp: ch ? imp : null });
    if (tt >= o.T) break;
  }
  return { hit: t1 != null, st, gainN, gainMax, nK, pErr, E0, first, trace, A, B };
}
const none = () => ({});
module.exports = { C, RIG, DT, D, KMH, car, setv, sim, none, f, clamp, wrap, massOf, keOf };

if (require.main === module) {
  const arg = process.argv[2] || 'all';
  const V = (kmh) => kmh / KMH;
  const tbone = (phys, kmh, vBk, where, o = {}) => {
    C.setTest(o.cv != null ? { cv: o.cv } : null);
    const A = car(phys, o.idA || 'rally', o.plA != null ? o.plA : true), B = car(phys, o.idB || 'rally', o.plB != null ? o.plB : false), M = B.m;
    const s = where === 'front' ? M.a : where === 'rear' ? -M.b : 0, gap = 0.4 + (o.ph || 0) * V(kmh) * DT, tHit = gap / V(kmh);
    setv(B, 0, -V(vBk) * tHit, Math.PI / 2, V(vBk)); setv(A, -(M.wid / 2 + A.m.len / 2 + gap), s, 0, V(kmh));
    const r = sim(A, B, Object.assign({ phys, T: 3, inA: o.inA || none, inB: none }, o)); C.setTest(null); return r;
  };
  const row = (name, r) => { if (!r.hit) { console.log(name + ': NO HIT'); return; } const a = r.st[0], b = r.st[1];
    console.log(`${name.padEnd(34)} | A v0 ${f(a.v0 * KMH, 0)} > ${[0.1, 0.5, 2].map(m => f(a.v[m].v * KMH, 0)).join('/')} | B v0 ${f(b.v0 * KMH, 0)} > ${[0.1, 0.5, 2].map(m => f(b.v[m].v * KMH, 0)).join('/')} | turnMax A/B ${f(a.turnMax * D, 1)}/${f(b.turnMax * D, 1)} | wMax ${f(a.wMax * D, 0)}/${f(b.wMax * D, 0)} | rigid dw ${f(a.dwRig * D, 0)}/${f(b.dwRig * D, 0)} taken ${f(a.dwTak * D, 0)}/${f(b.dwTak * D, 0)} | xgl ${f(a.gl, 2)}/${f(b.gl, 2)} | kick ${f(a.kcMax * D, 1)}/${f(b.kcMax * D, 1)} | knocks ${r.nK} gain ${r.gainN}x ${f(r.gainMax / 1000, 1)} kJ (E0 ${f(r.E0 / 1000, 0)}) pErr ${f(r.pErr * 100, 2)} %`); };
  if (arg === 'all' || arg === 'tbone') {
    console.log('rally: mass', RIG.cs.mkCar('rally', { v: 0 }).m.mass, 'I', RIG.cs.mkCar('rally', { v: 0 }).I, 'a/b', RIG.cs.mkCar('rally', { v: 0 }).m.a, RIG.cs.mkCar('rally', { v: 0 }).m.b, 'len/wid', RIG.cs.mkCar('rally', { v: 0 }).m.len, RIG.cs.mkCar('rally', { v: 0 }).m.wid);
    for (const phys of ['cs', 'nova']) for (const kmh of [60, 120, 200]) for (const vB of [0, kmh]) for (const w of ['front', 'mid', 'rear']) row(`${phys} tbone-${kmh}-${vB ? 'cross' : 'stand'}-${w}`, tbone(phys, kmh, vB, w));
    for (const w of ['front', 'mid', 'rear']) for (const vB of [0, 60]) row(`cs tbone-120 B ${vB} km/h ${w}`, tbone('cs', 120, vB, w));
    for (const w of ['front', 'mid', 'rear']) for (const vB of [0, 60]) row(`nova tbone-120 B ${vB} km/h ${w}`, tbone('nova', 120, vB, w));
    // roles: the player hit (B the player)
    row('cs tbone-120-cross-front B=player', tbone('cs', 120, 120, 'front', { plA: false, plB: true }));
    row('cs tbone-120-stand-front B=player', tbone('cs', 120, 0, 'front', { plA: false, plB: true }));
    // order of the pair
    row('cs tbone-120-cross-front BA', tbone('cs', 120, 120, 'front', { order: 'BA' }));
    // phases
    for (const ph of [0.25, 0.5, 0.75]) row(`cs tbone-200-stand-rear ph ${ph}`, tbone('cs', 200, 0, 'rear', { ph }));
    for (const ph of [0, 0.25, 0.5, 0.75]) row(`cs tbone-200-cross-mid ph ${ph}`, tbone('cs', 200, 200, 'mid', { ph }));
  }
  if (arg === 'all' || arg === 'slide') {
    // the hit car's speed across after a T-bone at its middle: its deceleration alone (A made a ghost right after the first knock) and with A behind it
    for (const phys of ['cs', 'nova']) for (const kmh of [60, 120, 200]) for (const gh of [0, null]) {
      const r = tbone(phys, kmh, 0, 'mid', { trace: 3, T: 4, ghostAfter: gh == null ? undefined : gh }); const tr = r.trace;
      const v = (t) => { const s = tr.find(x => x.t >= t - 1e-9); return s ? Math.hypot(s.B.vx, s.B.vz) : NaN; };
      const stop = tr.find(x => Math.hypot(x.B.vx, x.B.vz) < 0.3), b0 = tr[0].B, bs = stop ? stop.B : tr[tr.length - 1].B;
      const va = (t) => { const s = tr.find(x => x.t >= t - 1e-9); return s ? Math.hypot(s.A.vx, s.A.vz) : NaN; };
      console.log(`${phys} tbone-${kmh}-stand-mid ${gh == null ? 'A stays' : 'A ghost'}: B m/s at 0/0.1/0.2/0.3/0.5: ${[0, 0.1, 0.2, 0.3, 0.5].map(t => f(v(t), 2)).join(' / ')} | decel 0-0.2 s ${f((v(0) - v(0.2)) / 0.2 / 9.81, 2)} g, 0.1-0.3 s ${f((v(0.1) - v(0.3)) / 0.2 / 9.81, 2)} g | B stops after ${stop ? f(stop.t, 2) : '>3'} s, ${f(Math.hypot(bs.x - b0.x, bs.z - b0.z), 1)} m | A m/s at 0.1/0.5/1: ${[0.1, 0.5, 1].map(t => f(va(t), 1)).join('/')}`);
    }
    const H = RIG.cs; console.log('rally steady cornering (cs): 100 km/h full lock ay g', f(H.steady('rally', 100, 1.0).ay, 2), ' 60 km/h', f(H.steady('rally', 60, 1.0).ay, 2), '| longi', JSON.stringify(H.longi('rally')));
  }
}
