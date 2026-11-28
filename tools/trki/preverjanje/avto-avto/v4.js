// Verifier, part 4: Stara touch distance, stunt energy, online (net) co-simulation with delay, can the player catch a slide, low speed, door to door in a corner
'use strict';
const { C, RIG, DT, D, KMH, car, setv, sim, none, f, clamp, wrap, massOf, keOf } = require('./v1.js');
const V = (k) => k / KMH, arg = process.argv[2] || 'all';
const plane = RIG.cs.plane;
const hold = (c, vT) => { let I = 0.3; return () => { const e = vT - Math.hypot(c.vx, c.vz); I = clamp(I + e * 0.8 * DT, 0, 1); return { thr: clamp(I + 0.35 * e, 0, 1) }; }; };
const stepCar = (c, I) => { I = I || {}; c.inSteer = I.st || 0; c.inThr = I.thr || 0; c.inBrk = I.brk || 0; c.inHand = 0; const rate = c.isPlayer ? 16 : 10; c.steer += clamp(c.inSteer - c.steer, -rate * DT, rate * DT); c.step(DT, plane); };

if (arg === 'all' || arg === 'stara') {
  for (const cv of [null, 5]) {
    C.setTest(cv != null ? { cv } : null);
    const A = car('cs', 'rally', true), B = car('cs', 'rally', false), L = A.m.len;
    setv(B, 0, 0, 0, V(90)); setv(A, -(L + 1.0), 0, 0, V(120));
    let hit = null;
    for (let i = 0; i < 600 && !hit; i++) { stepCar(A); stepCar(B);
      const g = (B.x - L / 2) - (A.x + L / 2), vA = A.vx, vB = B.vx; const imp = C.carCollide(A, B);
      if (A.vx !== vA || B.vx !== vB) hit = { gap: g, imp, dvA: (A.vx - vA) * KMH, dvB: (B.vx - vB) * KMH }; }
    console.log('rear 120>90 cv', cv, hit ? `gap between the true boxes at the first knock ${f(hit.gap * 100, 1)} cm, dv A/B ${f(hit.dvA, 1)}/${f(hit.dvB, 1)} km/h` : 'NO HIT');
    // lean 3 deg at 120 km/h
    const A2 = car('cs', 'rally', true), B2 = car('cs', 'rally', false), W = A2.m.wid, al = 3 / D;
    setv(B2, 0, 0, 0, V(120)); setv(A2, 0, -(W + 0.25), al, V(120));
    const r = sim(A2, B2, { phys: 'cs', T: 1.5, inA: none, inB: none });
    console.log('  lean 3 deg 120 cv', cv, r.hit ? `knocks ${r.nK}, B turnMax ${f(r.st[1].turnMax * D, 1)} deg, B lateral dv by knocks ${f(r.st[1].dvz, 2)} m/s, A turnMax ${f(r.st[0].turnMax * D, 1)}` : 'NO HIT');
    C.setTest(null);
  }
}

function tbone(kmh, vBk, where, o = {}) {
  C.setTest(o.cv != null ? { cv: o.cv } : null);
  const A = car('cs', 'rally', true), B = car('cs', 'rally', false), M = B.m;
  const s = where === 'front' ? M.a : where === 'rear' ? -M.b : 0, gap = 0.4, tHit = gap / V(kmh);
  setv(B, 0, -V(vBk) * tHit, Math.PI / 2, V(vBk)); setv(A, -(M.wid / 2 + A.m.len / 2 + gap), s, 0, V(kmh));
  const r = sim(A, B, Object.assign({ phys: 'cs', T: 3, inA: none, inB: none }, o)); C.setTest(null); return r;
}
if (arg === 'all' || arg === 'stunt') {
  for (const cv of [1, 3, 4]) for (const w of ['front', 'rear']) { const r = tbone(120, 0, w, { cv }); const b = r.st[1];
    console.log(`T 120 > standing ${w} cv ${cv} (${C.KV_IDS[cv]}): B turnMax ${f(b.turnMax * D, 1)} wMax ${f(b.wMax * D, 0)} rigid dw ${f(b.dwRig * D, 0)} taken ${f(b.dwTak * D, 0)} | gain ${r.gainN}x max ${f(r.gainMax / 1000, 2)} kJ (${f(100 * r.gainMax / r.E0, 2)} % of E0 ${f(r.E0 / 1000, 0)} kJ) pErr ${f(r.pErr * 100, 2)} %`); }
}

// online: two phones, each steps its own car and shows the other one from a state Lag steps old (no reaction of the ghost in between)
function cosim(kind, Lag) {
  const A = car('cs', 'rally', true), gB = car('cs', 'rally', false), B = car('cs', 'rally', true), gA = car('cs', 'rally', false); gB.net = true; gA.net = true;
  const L = A.m.len, W = A.m.wid;
  if (kind === 'head') { setv(A, -(L / 2 + 20), 0, 0, V(120)); setv(B, L / 2 + 20, 0, Math.PI, V(120)); }
  else if (kind === 'rear') { setv(A, -(L + 6), 0, 0, V(120)); setv(B, 0, 0, 0, V(90)); }
  else { setv(A, -(W / 2 + L / 2 + 15), 0, 0, V(120)); setv(B, 0, 0, Math.PI / 2, 0); }
  const snap = (c) => ({ x: c.x, z: c.z, h: c.h, vx: c.vx, vz: c.vz, w: c.w });
  const put = (g, s) => { g.place(s.x, s.z, s.h); g.vx = s.vx; g.vz = s.vz; g.w = s.w; };
  const hist = []; let t1 = null, nA = 0, nB = 0; const out = {};
  for (let i = 0; i < 6 * 120; i++) {
    stepCar(A); stepCar(B); hist.push([snap(A), snap(B)]);
    const old = hist[Math.max(0, hist.length - 1 - Lag)]; put(gB, old[1]); put(gA, old[0]);
    const a0 = [A.vx, A.vz], b0 = [B.vx, B.vz];
    C.carCollide(A, gB); C.carCollide(gA, B);
    if (A.vx !== a0[0] || A.vz !== a0[1]) { nA++; if (t1 == null) t1 = i; }
    if (B.vx !== b0[0] || B.vz !== b0[1]) { nB++; if (t1 == null) t1 = i; }
    if (t1 != null) for (const m of [0.1, 0.5, 1, 2]) if (out[m] == null && (i - t1) * DT >= m - 1e-9) out[m] = [A.vx * KMH, B.vx * KMH, Math.hypot(A.vx, A.vz) * KMH, Math.hypot(B.vx, B.vz) * KMH];
    if (t1 != null && (i - t1) * DT > 2.05) break;
  }
  return { out, nA, nB };
}
if (arg === 'all' || arg === 'net') {
  for (const kind of ['head', 'rear', 'T']) {
    // one phone, both cars real (the single player result)
    const A = car('cs', 'rally', true), B = car('cs', 'rally', false), L = A.m.len, W = A.m.wid;
    if (kind === 'head') { setv(A, -(L / 2 + 2), 0, 0, V(120)); setv(B, L / 2 + 2, 0, Math.PI, V(120)); } else if (kind === 'rear') { setv(A, -(L + 1), 0, 0, V(120)); setv(B, 0, 0, 0, V(90)); } else { setv(A, -(W / 2 + L / 2 + 1), 0, 0, V(120)); setv(B, 0, 0, Math.PI / 2, 0); }
    const r = sim(A, B, { phys: 'cs', T: 2, inA: none, inB: none });
    console.log(`${kind}: one phone: A vx ${[0.1, 0.5, 1, 2].map(m => f(r.st[0].v[m].vx * KMH, 0)).join('/')} km/h, B vx ${[0.1, 0.5, 1, 2].map(m => f(r.st[1].v[m].vx * KMH, 0)).join('/')}`);
    for (const Lag of [1, 6, 12, 24]) { const q = cosim(kind, Lag), o = q.out;
      console.log(`  two phones, delay ${Lag} steps (${f(Lag * DT * 1000, 0)} ms): A vx at 0.1/0.5/1/2 s ${[0.1, 0.5, 1, 2].map(m => o[m] ? f(o[m][0], 0) : '-').join('/')} | B vx ${[0.1, 0.5, 1, 2].map(m => o[m] ? f(o[m][1], 0) : '-').join('/')} | knocks A ${q.nA} B ${q.nB}`); }
  }
}

function pit(kmh, vc, o = {}) {
  const Vv = kmh / KMH, A = car('cs', 'rally', false), B = car('cs', 'rally', true), M = A.m, L = M.len, W = M.wid;
  const al = Math.asin(vc / Vv), lx = -0.35 * L, gap = 0.4, tc = gap / vc;
  const cx = lx - Vv * (Math.cos(al) - 1) * tc, cz = -W / 2 - gap;
  setv(B, 0, 0, 0, Vv); setv(A, cx - (L / 2 * Math.cos(al) - W / 2 * Math.sin(al)), cz - (L / 2 * Math.sin(al) + W / 2 * Math.cos(al)), al, Vv);
  const hA = hold(A, Vv), hB = hold(B, Vv);
  const inA = (t, th) => th == null ? hA() : {};
  const inB = (t, th) => th == null ? hB() : (o.inB2 ? o.inB2(B, th) : {});
  return sim(A, B, Object.assign({ phys: 'cs', T: 4, inA, inB }, o));
}
if (arg === 'all' || arg === 'catch') {
  const drivers = { 'no input': null, 'countersteer (P on heading)': (B) => ({ st: clamp(-3 * B.h, -1, 1) }), 'full lock against': (B) => ({ st: B.h < 0 ? 1 : -1 }), 'full lock with the spin': (B) => ({ st: B.h < 0 ? -1 : 1 }), 'full brake': () => ({ brk: 1 }), 'full throttle': () => ({ thr: 1 }) };
  for (const [kmh, vc] of [[60, 6], [120, 8], [120, 10]]) for (const [nm, fn] of Object.entries(drivers)) {
    const r = pit(kmh, vc, { ghostAfter: 0, inB2: fn }); const b = r.st[1];
    console.log(`first knock only, ${kmh} km/h ${vc} m/s, B ${nm.padEnd(28)}: turnMax ${f(b.turnMax * D, 1)} deg, turn at 0.5/1/2/3 s ${[0.5, 1, 2, 3].map(m => f(b.v[m].turn * D, 0)).join('/')}, xgl ${f(b.gl, 2)}, v at 1/2 s ${f(b.v[1].v * KMH, 0)}/${f(b.v[2].v * KMH, 0)} km/h, z at 2 s ${f(b.v[2].z, 1)} m`);
  }
}
if (arg === 'all' || arg === 'low') {
  for (const kmh of [20, 30, 40, 50]) for (const vc of [2, 3, 4, 5]) { if (vc >= V(kmh) * 0.9) continue;
    const r1 = pit(kmh, vc, { ghostAfter: 0 }), r2 = pit(kmh, vc), b1 = r1.st[1], b2 = r2.st[1];
    console.log(`pit ${kmh} km/h ${vc} m/s: first knock only: turnMax ${f(b1.turnMax * D, 1)} xgl ${f(b1.gl, 2)} wMax ${f(b1.wMax * D, 0)} | whole contact: turnMax ${f(b2.turnMax * D, 1)} xgl ${f(b2.gl, 2)} wMax ${f(b2.wMax * D, 0)} knocks ${r2.nK} rigid dw ${f(b2.dwRig * D, 0)} taken ${f(b2.dwTak * D, 0)}`); }
}

// door to door in a corner: B (the player, outside) in a steady corner, A (a rival) alongside on the inside with the same state, closing across at vc
function corner(kmh, steer, vc, withA, o = {}) {
  const B = car('cs', 'rally', true), A = car('cs', 'rally', false), v0 = kmh / KMH;
  setv(B, 0, 0, 0, v0); const hB = hold(B, v0);
  for (let i = 0; i < 5 * 120; i++) stepCar(B, Object.assign(hB(), { st: steer }));
  const sp0 = Math.hypot(B.vx, B.vz), sgn = Math.sign(B.w) || 1, nx = -Math.sin(B.h) * sgn, nz = Math.cos(B.h) * sgn, ay = Math.abs(B.w) * sp0 / 9.81;
  let hA = null;
  if (withA) { const W = B.m.wid, gap = 0.3, side = o.outside ? -1 : 1; const bvx = B.vx, bvz = B.vz;
    const bk = o.back || 0; setv(A, B.x + side * nx * (W + gap) - Math.cos(B.h) * bk, B.z + side * nz * (W + gap) - Math.sin(B.h) * bk, B.h, sp0); A.vx = bvx - side * nx * vc; A.vz = bvz - side * nz * vc; A.gear = B.gear; A.w = B.w; A.steer = B.steer; if (B.rpm != null) A.rpm = B.rpm; hA = hold(A, v0); }
  const out = []; let nK = 0, gl = 0, wMax = 0, glA = 0;
  for (let i = 1; i <= 3 * 120; i++) {
    stepCar(B, Object.assign(hB(), { st: steer }));
    if (withA) { stepCar(A, Object.assign(hA(), { st: steer })); const q = [B.vx, B.vz, B.w]; C.carCollide(A, B); if (B.vx !== q[0] || B.vz !== q[1] || B.w !== q[2]) nK++; glA = Math.max(glA, A.xgl || 0); }
    gl = Math.max(gl, B.xgl || 0); wMax = Math.max(wMax, Math.abs(B.w));
    out.push({ x: B.x, z: B.z, h: B.h, v: Math.hypot(B.vx, B.vz), w: B.w, ax: withA ? A.x : 0, az: withA ? A.z : 0, ah: withA ? A.h : 0, av: withA ? Math.hypot(A.vx, A.vz) : 0 });
  }
  return { out, nK, gl, glA, ay, sp0, w0: B.w, wMax };
}
if (arg === 'all' || arg === 'corner') {
  for (const [kmh, steer] of [[100, 0.25], [100, 0.5], [100, 1.0], [160, 0.5]]) {
    const base = corner(kmh, steer, 0, false);
    console.log(`corner ${kmh} km/h steer ${steer}: steady ${f(base.sp0 * KMH, 0)} km/h, ${f(base.ay, 2)} g, yaw ${f(base.w0 * D, 1)} deg/s, radius ${f(base.sp0 / Math.abs(base.w0), 0)} m`);
    for (const outside of [false, true]) for (const vc of [0.5, 1, 2, 4]) { const r = corner(kmh, steer, vc, true, { outside });
      const dv = (t) => { const i = Math.round(t * 120) - 1, a = r.out[i], b = base.out[i]; return { d: Math.hypot(a.x - b.x, a.z - b.z), dh: wrap(a.h - b.h) * D, dvk: (a.v - b.v) * KMH }; };
      const hmax = r.out.reduce((m, a, i) => Math.max(m, Math.abs(wrap(a.h - base.out[i].h)) * D), 0);
      console.log(`   A ${outside ? 'outside' : 'inside '} closing ${vc} m/s: B off its line by ${[0.5, 1, 2, 3].map(t => f(dv(t).d, 1)).join('/')} m at 0.5/1/2/3 s, heading off ${[0.5, 1, 2, 3].map(t => f(dv(t).dh, 0)).join('/')} deg (max ${f(hmax, 0)}), speed off ${[1, 3].map(t => f(dv(t).dvk, 0)).join('/')} km/h, B xgl ${f(r.gl, 2)} wMax ${f(r.wMax * D, 0)} deg/s, knocks ${r.nK}, A xgl ${f(r.glA, 2)}`); }
  }
}

if (arg === 'cornerpit') {
  for (const [kmh, steer] of [[100, 0.02], [100, 0.5], [100, 1.0], [160, 1.0]]) {
    const base = corner(kmh, steer, 0, false), L = 3.95;
    console.log(`corner ${kmh} km/h steer ${steer}: steady ${f(base.sp0 * KMH, 0)} km/h, ${f(base.ay, 2)} g, radius ${f(base.sp0 / Math.abs(base.w0), 0)} m`);
    for (const outside of [false, true]) for (const vc of [1, 2, 3, 4, 6]) { const r = corner(kmh, steer, vc, true, { outside, back: 0.65 * L });
      const dv = (t) => { const i = Math.round(t * 120) - 1, a = r.out[i], b = base.out[i]; return { d: Math.hypot(a.x - b.x, a.z - b.z), dh: wrap(a.h - b.h) * D, dvk: (a.v - b.v) * KMH }; };
      let hU = 0, hP = 0, hmax = 0; r.out.forEach((a, i) => { const dh = wrap(a.h - base.out[i].h); hU += wrap(dh - hP); hP = dh; if (Math.abs(hU) > Math.abs(hmax)) hmax = hU; });
      console.log(`   A ${outside ? 'outside' : 'inside '} into the rear quarter, closing ${vc} m/s: B heading off max ${f(hmax * D, 0)} deg (at 0.5/1/2/3 s ${[0.5, 1, 2, 3].map(t => f(dv(t).dh, 0)).join('/')}), off line ${[1, 2, 3].map(t => f(dv(t).d, 1)).join('/')} m, speed off ${f(dv(3).dvk, 0)} km/h, xgl ${f(r.gl, 2)}, wMax ${f(r.wMax * D, 0)} deg/s, knocks ${r.nK}`); }
  }
}
