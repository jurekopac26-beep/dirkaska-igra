// Trki avto : avto, meritve (analiza za temo »bolj realistični trki«, 9. 11. 2026): two cars of the same model on the flat test plane
// (tests/lib/handling.js), stepped as Race._step steps them (each car: its inputs, the steer's rate, Car.step; then Core.carCollide for the
// pair), the game's own knock (kCollide / kTake, or the old carCollide with --cv 5) and nothing of it written anew here. What is measured
// is only read off the cars' states before and after every carCollide call and every step.
//   node tools/trki/avto-avto.js                 the whole matrix, the classic physics (cs) and the new (nova), the default version
//   node tools/trki/avto-avto.js --cv 4          the same with another version of the knocks (Core.setTest({ cv }): 1 Simulacija ... 5 Stara)
//   node tools/trki/avto-avto.js --json          the results as JSON on stdout (every scenario, every metric)
//   node tools/trki/avto-avto.js --only tbone    only the scenarios whose name holds the text (cs, the main matrix)
//   node tools/trki/avto-avto.js --trace head-120-o [--phys nova] [--mode hold] [--role RR] [--car kaze] [--ph 0.5] [--tspan 2]
//                                                one scenario step by step (the first 0.5 s after the touch, or --tspan s)
// The matrix (V = 60, 120, 200 km/h; A the car that hits, B the car hit):
//   head-V-c|o        both at V towards each other, centred | half a width (0.9 m) to the side
//   rear-V-stand|bump-c|o   A at V into a standing B | into B at V - 30 km/h, centred | half a width to the side
//   tbone-V-stand|cross-mid|front|rear   A at V square into the side of a standing B | of B crossing at V; at its middle, front axle, rear axle
//   side-V-a3|a10-eq|dv20   side by side, A steers into B at 3 | 10 deg and leans on it for 1.5 s; both at V | B 20 km/h slower (scraping past)
//   pit-V-rear|front-2|4|8  A's front corner into B's rear | front quarter, closing sideways at 2 | 4 | 8 m/s, both at V
// Roles: PR the player hits a rival (the main matrix but for pit), RP a rival hits the player (pit), RR two rivals. Inputs after the touch:
// none (no pedal, no steer; before the touch the speed is held) or hold (the throttle holds the speed the car came with; no steer); the side
// scenarios always drive (A: 0.2 of the lock into B for 1.5 s, then it straightens up; B keeps its lane with `hold`, does nothing with `none`).
// Every scenario runs four times, its first touch a quarter of a step's travel later each time (the step is 1/120 s: at 200 km/h head on the
// cars close 0.93 m a step), to see what depends on where in the step the bodies meet.
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests', 'lib', 'core.js'));
const { seeded } = require(path.join(ROOT, 'tests', 'lib', 'sim.js'));
const handling = require(path.join(ROOT, 'tests', 'lib', 'handling.js'));

const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const CV = arg('--cv') != null ? +arg('--cv') : null, JSON_OUT = argv.includes('--json'), ONLY = arg('--only'), TRACE = arg('--trace');
const C = loadCore();
const RIG = { cs: handling(C, 'cs'), nova: handling(C, 'nova') };
const DT = 1 / 120, D = 180 / Math.PI, SECS = 6;   // (SECS: the time followed after the first touch)
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const setCv = () => C.setTest(CV != null ? { cv: CV } : null);
const VERSION = () => { const id = C.KV_IDS[C.TX.cv != null ? C.TX.cv : 1]; return id || 'sim'; };

// ---- the cars ----
function mk(H, id, player) { const c = H.mkCar(id, { v: 0 }); c.isPlayer = !!player; c.noReverse = true; return c; }
// a car put at (x, z), its nose at h, driving at v (m/s) along dir (its nose when left out); a sensible gear (as the rig's mkCar), the
// speed holder's throttle where it settles alone at that speed
const thrAt = new Map();
function thrFor(H, id, v, phys) {
  const k = phys + id + v.toFixed(2); if (thrAt.has(k)) return thrAt.get(k);
  const c = H.mkCar(id, { v: v * 3.6 }); for (let i = 0; i < 360; i++) H.step(c, { thr: 'hold' });
  thrAt.set(k, c._thrI); return c._thrI;
}
function put(H, c, x, z, h, v, dir) {
  const M = c.m, a = dir == null ? h : dir;
  c.place(x, z, h); c.vx = v * Math.cos(a); c.vz = v * Math.sin(a);
  for (let g = 1; g <= M.gears.length; g++) { c.gear = g; if (v / M.rw * M.gears[g - 1] * M.final * 9.5493 < M.redline * 0.9) break; }
  c._vT = v; c._thrI = v > 1 ? thrFor(H, M.id, v, c.phys) : 0; c._v = v;
}
// one car's step as Race._step makes it: the inputs, the steer at its rate (the player's analogue 16 a second, a rival's 10), Car.step.
// thr 'hold': the rig's speed holder (tests/lib/handling.js step)
function drive(H, c, I) {
  c.inSteer = I.st || 0; c.inBrk = I.brk || 0; c.inHand = 0;
  if (I.thr === 'hold') { const e = c._vT - c.speed; c._thrI = clamp(c._thrI + e * 0.8 * DT, 0, 1); c.inThr = clamp(c._thrI + 0.35 * e, 0, 1); } else c.inThr = I.thr || 0;
  const rate = c.isPlayer ? 16 : 10;
  c.steer += clamp(c.inSteer - c.steer, -rate * DT, rate * DT);
  c.step(DT, H.plane);
}
// keeping a lane (z0) with the steer, as tests/trki.test.js does
const lane = (c, z0) => clamp(-(0.35 * (c.z - z0) + 2.0 * c.h + 0.25 * c.vz / Math.max(5, c.speed)), -1, 1);

// ---- the scenarios: S = { A, B, iA(t, th), iB(t, th), swap } (th: seconds since the first touch, null before it) ----
// o: { H, id, role ('PR' | 'RP' | 'RR'), mode ('none' | 'hold'), ph (0-1: the first touch that share of a step's travel later) }
function pair(o) { const A = mk(o.H, o.id, o.role === 'PR'), B = mk(o.H, o.idB || o.id, o.role === 'RP'); return [A, B]; }
const pedal = (o) => (t, th) => ({ st: 0, thr: th == null || o.mode === 'hold' ? 'hold' : 0 });
const SCN = {
  head(o, V, off) {
    const [A, B] = pair(o), L = A.m.len, gap = 0.3 + o.ph * 2 * V * DT;
    put(o.H, B, 0, 0, Math.PI, V); put(o.H, A, -(L + gap), off ? A.m.wid / 2 : 0, 0, V);
    return { A, B, iA: pedal(o), iB: pedal(o), swap: () => A.x > B.x };
  },
  rear(o, V, bump, off) {
    const [A, B] = pair(o), L = A.m.len, vB = bump ? V - 30 / 3.6 : 0, gap = 0.3 + o.ph * (V - vB) * DT;
    put(o.H, B, 0, 0, 0, vB); put(o.H, A, -(L + gap), off ? A.m.wid / 2 : 0, 0, V);
    return { A, B, iA: pedal(o), iB: pedal(o), swap: () => A.x > B.x };
  },
  // B's nose points along +z, A drives along +x into the side of B that faces it; s: where along B (0 its middle, +a its front axle, -b its rear axle)
  tbone(o, V, cross, where) {
    const [A, B] = pair(o), M = A.m, s = where === 'front' ? M.a : where === 'rear' ? -M.b : 0, gap = 0.3 + o.ph * V * DT, vB = cross ? V : 0;
    put(o.H, B, 0, -vB * (gap / V), Math.PI / 2, vB); put(o.H, A, -(M.wid / 2 + M.len / 2 + gap), s, 0, V);
    return { A, B, iA: pedal(o), iB: pedal(o), swap: () => false };
  },
  // side by side: A alongside B (or 2.5 m behind when B is 20 km/h slower), its nose and its way al rad into B; from the touch A holds 0.2 of
  // the lock into B for 1.5 s, then straightens up (its nose along the road again, no way back to its lane); B keeps its lane (mode hold)
  // or does nothing (mode none)
  side(o, V, al, dv) {
    const [A, B] = pair(o), W = A.m.wid, z0 = W + 0.25 + o.ph * V * Math.sin(al) * DT, vB = V - dv;
    put(o.H, B, 0, z0, 0, vB); put(o.H, A, dv ? -2.5 : 0, 0, al, V);
    return { A, B, swap: () => false,
      iA: (t, th) => ({ st: th == null ? 0 : th < 1.5 ? 0.2 : clamp(-2.0 * A.h - 0.25 * A.vz / Math.max(5, A.speed), -0.5, 0.5), thr: 'hold' }),
      iB: () => ({ st: o.mode === 'hold' ? lane(B, z0) : 0, thr: 'hold' }) };
  },
  // B along +x at V; A beside it (on its -z side) at V, its way and its nose al = asin(vc / V) into B: A's front corner meets B's flank lx
  // along B (rear: 0.35 of its length behind its middle, as the PIT of tests/trki.test.js; front: as far ahead)
  pit(o, V, vc, front) {
    const [A, B] = pair(o), M = A.m, L = M.len, W = M.wid, al = Math.asin(vc / V), lx = (front ? 0.35 : -0.35) * L, gap = 0.3 + o.ph * vc * DT, tc = gap / vc;
    const cx = lx - V * (Math.cos(al) - 1) * tc, cz = -W / 2 - gap;   // (A's corner now, in B's frame)
    put(o.H, B, 0, 0, 0, V); put(o.H, A, cx - (L / 2 * Math.cos(al) - W / 2 * Math.sin(al)), cz - (L / 2 * Math.sin(al) + W / 2 * Math.cos(al)), al, V);
    return { A, B, iA: pedal(o), iB: pedal(o), swap: () => false };
  },
};
const VS = [60, 120, 200];
function matrix() {
  const L = [];
  for (const kmh of VS) { const V = kmh / 3.6;
    for (const off of [0, 1]) L.push({ name: `head-${kmh}-${off ? 'o' : 'c'}`, grp: 'head', kmh, role: 'PR', make: (o) => SCN.head(o, V, off) });
    for (const bump of [0, 1]) for (const off of [0, 1]) L.push({ name: `rear-${kmh}-${bump ? 'bump' : 'stand'}-${off ? 'o' : 'c'}`, grp: 'rear', kmh, role: 'PR', make: (o) => SCN.rear(o, V, bump, off) });
    for (const cross of [0, 1]) for (const w of ['mid', 'front', 'rear']) L.push({ name: `tbone-${kmh}-${cross ? 'cross' : 'stand'}-${w}`, grp: 'tbone', kmh, role: 'PR', make: (o) => SCN.tbone(o, V, cross, w) });
    for (const dv of [0, 20]) for (const a of [3, 10]) L.push({ name: `side-${kmh}-a${a}-${dv ? 'dv20' : 'eq'}`, grp: 'side', kmh, role: 'PR', make: (o) => SCN.side(o, V, a / D, dv / 3.6) });
    for (const fr of [0, 1]) for (const vc of [2, 4, 8]) L.push({ name: `pit-${kmh}-${fr ? 'front' : 'rear'}-${vc}`, grp: 'pit', kmh, role: 'RP', make: (o) => SCN.pit(o, V, vc, fr) });
  }
  return L;
}
// the scenarios run again with other roles, the other car, on a real track
const KEY = ['head-120-c', 'head-120-o', 'rear-120-stand-c', 'rear-120-bump-o', 'tbone-120-stand-mid', 'tbone-120-stand-rear', 'tbone-120-cross-front', 'side-120-a3-eq', 'side-120-a10-dv20', 'pit-120-rear-4', 'pit-120-rear-8', 'pit-120-front-8'];

// ---- the measuring ----
// the true boxes' overlap (length x width, as drawn): null apart, else the least overlap over the four face normals (m) and that normal
// (from b to a). Only a measure: nothing is fed back to the cars
function boxOv(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z; let ov = Infinity, nx = 0, nz = 0;
  for (let q = 0; q < 4; q++) {
    const h = (q < 2 ? a.h : b.h) + (q & 1 ? Math.PI / 2 : 0), Lx = Math.cos(h), Lz = Math.sin(h);
    const ra = a.m.len / 2 * Math.abs(Math.cos(a.h - h)) + a.m.wid / 2 * Math.abs(Math.sin(a.h - h)), rb = b.m.len / 2 * Math.abs(Math.cos(b.h - h)) + b.m.wid / 2 * Math.abs(Math.sin(b.h - h));
    const d = dx * Lx + dz * Lz, o = ra + rb - Math.abs(d);
    if (o <= 0) return null;
    if (o < ov) { ov = o; const s = d > 0 ? -1 : 1; nx = Lx * s; nz = Lz * s; }
  }
  return { pen: ov, nx, nz };
}
const snap = (c) => ({ x: c.x, z: c.z, h: c.h, vx: c.vx, vz: c.vz, w: c.w, gl: c.xgl || 0, kc: c.csKc || 0, cs: Math.hypot(c.cSx || 0, c.cSz || 0), cx: c.contactX, cz: c.contactZ, dmg: c.dmg || 0 });
const AT = [DT, 0.1, 0.5, 2];   // (the moments read after the first touch: the step of the touch, +0.1 s, +0.5 s, +2 s)

function run(S, o, trace) {
  const R0 = Math.random; Math.random = seeded(64);
  try {
    const H = o.H, cars = [S.A, S.B], mass = cars.map(c => c.m.mass + (c.fuelKg || 0)), In = cars.map(c => c.I);
    const ke = (s, k) => 0.5 * mass[k] * (s.vx * s.vx + s.vz * s.vz) + 0.5 * In[k] * s.w * s.w, sp = (s) => Math.hypot(s.vx, s.vz);
    const K = [0, 1], car = K.map(() => ({ turnMax: 0, wPk: 0, gl: 0, glBack: null, kc: 0, cs: 0, dwRig: 0, dwTak: 0, dvLong: 0, dvLat: 0, off: [], vMin: Infinity, tMin: 0, tV95: null }));
    let t1 = null, pre = null, X0 = null, L0 = 0, E0 = 0, p0 = [0, 0], scale = 1, nan = false;
    let Ek = 0, gainN = 0, gainMax = 0, pk = [0, 0], Lk = 0, nImp = 0, nClu = 0, prevImp = false, pop = 0, ovMax = 0, ovLeft = 0, nOv = 0, tLast = 0, tog = 0, prevOv = false, flips = 0, prevSg = 0, stick = 0, swapped = false, impMax = 0, vnFirst = 0, eFirst = null, nBig = 0;
    const samp = AT.map(() => null); let series = [];
    for (let i = 1; i <= (3 + (o.secs || SECS)) / DT; i++) {
      const t = i * DT, th = t1 == null ? null : t - t1;
      drive(H, S.A, S.iA(t, th)); drive(H, S.B, S.iB(t, th));
      const p = cars.map(snap), ov = boxOv(S.A, S.B);
      const imp = C.carCollide(S.A, S.B);
      const q = cars.map(snap);
      const moved = Math.max(...K.map(k => Math.hypot(q[k].x - p[k].x, q[k].z - p[k].z)));
      const knock = K.some(k => q[k].vx !== p[k].vx || q[k].vz !== p[k].vz || q[k].w !== p[k].w || q[k].kc !== p[k].kc);
      if (!K.every(k => Number.isFinite(q[k].x + q[k].z + q[k].h + q[k].vx + q[k].vz + q[k].w))) nan = true;
      if (t1 == null) {
        if (!(knock || moved > 0)) continue;
        t1 = t; pre = p; E0 = ke(p[0], 0) + ke(p[1], 1); p0 = [mass[0] * p[0].vx + mass[1] * p[1].vx, mass[0] * p[0].vz + mass[1] * p[1].vz]; scale = mass[0] * sp(p[0]) + mass[1] * sp(p[1]);
        X0 = knock && Number.isFinite(q[0].cx) ? [q[0].cx, q[0].cz] : [(p[0].x + p[1].x) / 2, (p[0].z + p[1].z) / 2];
        for (const k of K) { const c = car[k]; c.h0 = p[k].h; c.v0 = sp(p[k]); c.dir0 = c.v0 > 1 ? Math.atan2(p[k].vz, p[k].vx) : p[k].h; c.x0 = p[k].x; c.z0 = p[k].z; c.hU = p[k].h; c.hP = p[k].h; }
        // (the closing speed along the boxes' normal, before the knock: what the bounce is measured against)
        if (ov) vnFirst = -((p[0].vx - p[1].vx) * ov.nx + (p[0].vz - p[1].vz) * ov.nz);
      }
      const tt = t - t1;
      const Lof = (s) => K.reduce((a, k) => a + mass[k] * ((s[k].x - X0[0]) * s[k].vz - (s[k].z - X0[1]) * s[k].vx) + In[k] * s[k].w, 0);
      if (tt === 0) L0 = Lof(p);
      // ---- inside the carCollide call: the pair's energy, momentum and turning momentum, each car's share ----
      if (knock) {
        const dE = ke(q[0], 0) + ke(q[1], 1) - ke(p[0], 0) - ke(p[1], 1); Ek += dE; if (dE > 1e-6) { gainN++; gainMax = Math.max(gainMax, dE); }
        for (const k of K) { pk[0] += mass[k] * (q[k].vx - p[k].vx); pk[1] += mass[k] * (q[k].vz - p[k].vz); }
        Lk += Lof(q) - Lof(p); nImp++; if (!prevImp) nClu++; impMax = Math.max(impMax, imp || 0);
        if (K.some(k => Math.hypot(q[k].vx - p[k].vx, q[k].vz - p[k].vz) >= 0.1)) nBig++;   // (a knock that changes a car's speed by 0.1 m/s or more: the others are a car leaning on another)
        for (const k of K) { const c = car[k], Px = mass[k] * (q[k].vx - p[k].vx), Pz = mass[k] * (q[k].vz - p[k].vz), rx = q[k].cx - q[k].x, rz = q[k].cz - q[k].z;
          if (Number.isFinite(rx + rz)) c.dwRig += (rx * Pz - rz * Px) / In[k];   // (the yaw rate a free rigid body would take from this push at this contact)
          c.dwTak += q[k].w - p[k].w;
          const ch = Math.cos(p[k].h), sh = Math.sin(p[k].h); c.dvLong += (q[k].vx - p[k].vx) * ch + (q[k].vz - p[k].vz) * sh; c.dvLat += -(q[k].vx - p[k].vx) * sh + (q[k].vz - p[k].vz) * ch; }
        if (eFirst == null && ov && vnFirst > 0.01) eFirst = ((q[0].vx - q[1].vx) * ov.nx + (q[0].vz - q[1].vz) * ov.nz) / vnFirst;   // (the first knock's bounce at the cars' middles: the share of the closing speed they part with)
      }
      prevImp = knock; pop = Math.max(pop, moved);
      // ---- the contact: the true boxes into each other ----
      if (ov) { nOv++; tLast = tt; ovMax = Math.max(ovMax, ov.pen); if (!prevOv && tt > 0) tog++;
        const vn = (p[0].vx - p[1].vx) * ov.nx + (p[0].vz - p[1].vz) * ov.nz, sg = vn > 0.05 ? 1 : vn < -0.05 ? -1 : 0; if (sg && prevSg && sg !== prevSg) flips++; if (sg) prevSg = sg;
        if (Math.hypot(q[0].vx - q[1].vx, q[0].vz - q[1].vz) < 0.5) stick += DT;
        const ov2 = boxOv(S.A, S.B); ovLeft = ov2 ? ov2.pen : 0;
      } else prevSg = 0;
      prevOv = !!ov; if (S.swap()) swapped = true;
      // ---- each car ----
      for (const k of K) { const c = car[k], s = q[k], v = sp(s);
        c.hU += wrap(s.h - c.hP); c.hP = s.h;   // (the heading unwound: a spin of several turns counted whole)
        const turn = c.hU - c.h0; if (Math.abs(turn) > Math.abs(c.turnMax)) c.turnMax = turn;
        c.wPk = Math.max(c.wPk, Math.abs(s.w)); c.kc = Math.max(c.kc, Math.abs(s.kc)); c.cs = Math.max(c.cs, s.cs);
        if (s.gl > c.gl) c.gl = s.gl; if (c.gl > 0 && !s.gl && c.glBack == null) c.glBack = tt;
        const sl = v > 1 ? Math.abs(wrap(Math.atan2(s.vz, s.vx) - s.h)) : 0;   // (the nose off the way it travels; a car all but standing: 0)
        c.off.push(sl > 3 / D || Math.abs(s.w) > 5 / D ? 1 : 0);
        if (v < c.vMin) { c.vMin = v; c.tMin = tt; } if (c.tV95 == null && tt > c.tMin && v >= 0.95 * c.v0 && c.vMin < 0.95 * c.v0) c.tV95 = tt;
      }
      for (let j = 0; j < AT.length; j++) if (samp[j] == null && tt >= AT[j] - DT - 1e-9) samp[j] = { q, E: ke(q[0], 0) + ke(q[1], 1), p: [mass[0] * q[0].vx + mass[1] * q[1].vx, mass[0] * q[0].vz + mass[1] * q[1].vz], L: Lof(q), turn: K.map(k => car[k].hU - car[k].h0) };
      if (trace && tt < trace) series.push({ t: tt, ov: ov ? ov.pen : 0, imp: knock ? (imp || 0) : null, moved, q });
      if (tt >= (o.secs || SECS)) break;
    }
    if (t1 == null) return { hit: false };
    const end = cars.map(snap), r1 = (x, d = 1) => x == null || !Number.isFinite(x) ? null : +x.toFixed(d);
    const out = { hit: true, nan, E0: r1(E0 / 1000), vn: r1(vnFirst * 3.6), e: r1(eFirst, 2),
      lostKnock: r1(-Ek / E0 * 100), lostAt: samp.map(s => s ? r1((1 - s.E / E0) * 100) : null), gainN, gainMax: r1(gainMax, 0),
      pErrKnock: r1(Math.hypot(pk[0], pk[1]) / scale * 100, 2), pErrAt: samp.map(s => s ? r1(Math.hypot(s.p[0] - p0[0], s.p[1] - p0[1]) / scale * 100) : null),
      L0: r1(L0, 0), LKnock: r1(Lk, 0), LAt: samp.map(s => s ? r1(s.L, 0) : null),
      nImp, nBig, nClu, impMax: r1(impMax * 3.6), tContact: r1(nOv * DT, 3), tApart: r1(tLast + (nOv ? DT : 0), 3), steps: Math.round(tLast / DT) + (nOv ? 1 : 0), stick: r1(stick, 3), toggles: tog, flips,
      pop: r1(pop * 100), ovMax: r1(ovMax * 100), ovLeft: r1(ovLeft * 100), swapped, car: [] };
    for (const k of K) { const c = car[k]; let ts = null; for (let j = c.off.length - 1; j >= 0; j--) { if (c.off[j]) { ts = j + 1 < c.off.length ? (j + 1) * DT : null; break; } if (j === 0) ts = 0; }
      const ex = (s) => s && sp(s.q[k]) > 1 ? r1(wrap(Math.atan2(s.q[k].vz, s.q[k].vx) - c.dir0) * D) : null;
      const ch = Math.cos(c.dir0), sh = Math.sin(c.dir0), s2 = samp[3] ? samp[3].q[k] : end[k];
      out.car.push({ v0: r1(c.v0 * 3.6), v: samp.map(s => s ? r1(sp(s.q[k]) * 3.6) : null), vEnd: r1(sp(end[k]) * 3.6), vMin: r1(c.vMin * 3.6), tV95: r1(c.tV95, 2),
        turnMax: r1(c.turnMax * D), turn: samp.map(s => s ? r1(s.turn[k] * D) : null), turnEnd: r1((c.hU - c.h0) * D),
        exit05: ex(samp[2]), exit2: ex(samp[3]), wPk: r1(c.wPk * D), tStraight: r1(ts, 2), gl: r1(c.gl, 2), glBack: r1(c.glBack, 2), kc: r1(c.kc * D), cs: r1(c.cs, 2),
        dwRig: r1(c.dwRig * D, 0), dwTak: r1(c.dwTak * D, 0), dvLong: r1(c.dvLong * 3.6), dvLat: r1(c.dvLat * 3.6), shift2: r1(-(s2.x - c.x0) * sh + (s2.z - c.z0) * ch, 2), dmg: r1(end[k].dmg, 2) }); }
    if (trace) out.series = series;
    return out;
  } finally { Math.random = R0; }
}

// ---- the runs ----
// a scenario of the matrix: mode none in four phases (the first the row's numbers, all four its spread) and mode hold once
function runRow(sc, H, o) {
  const base = Object.assign({ H, id: 'rally', role: sc.role, mode: 'none', ph: 0 }, o || {});
  const one = (mode, ph) => { setCv(); try { const oo = Object.assign({}, base, { mode, ph }); return run(sc.make(oo), oo); } finally { C.setTest(null); } };
  const ph = [0, 0.25, 0.5, 0.75].map(p => one('none', p)), hold = one('hold', 0), r = ph[0];
  if (!r.hit) return { name: sc.name, grp: sc.grp, kmh: sc.kmh, role: base.role, hit: false };
  const rng = (f) => { const v = ph.filter(x => x.hit).map(f).filter(x => x != null); return v.length ? [Math.min(...v), Math.max(...v)] : null; };
  return Object.assign({ name: sc.name, grp: sc.grp, kmh: sc.kmh, role: base.role, phys: H === RIG.nova ? 'nova' : 'cs' }, r, {
    spread: { vA: rng(x => x.car[0].v[1]), vB: rng(x => x.car[1].v[1]), ovMax: rng(x => x.ovMax), turnA: rng(x => Math.abs(x.car[0].turnMax)), turnB: rng(x => Math.abs(x.car[1].turnMax)), nImp: rng(x => x.nImp), lost: rng(x => x.lostKnock),
      swapped: ph.filter(x => x.swapped).length, nan: ph.some(x => x.nan) || hold.nan, gainN: Math.max(...ph.map(x => x.gainN || 0)) },
    hold: hold.hit ? { tV95: hold.car.map(c => c.tV95), vMin: hold.car.map(c => c.vMin), v2: hold.car.map(c => c.v[3]), turnMax: hold.car.map(c => c.turnMax), tStraight: hold.car.map(c => c.tStraight), gl: hold.car.map(c => c.gl), lost2: hold.lostAt[3], stick: hold.stick, flips: hold.flips, pop: hold.pop, ovMax: hold.ovMax } : null });
}

// ---- the step against the speed: A at V into a standing B, `off` of a width to the side, the first touch at 24 places in the step. What the
// knock makes of it: A's and B's speed 0.1 s on (the least and the most over the 24), the deepest overlap of the true boxes, the largest
// move a carCollide call made (pop), and in how many of the 24 A got past B within a second (its middle ahead of B's) ----
function sweep(H) {
  const rows = [];
  for (const kmh of [60, 120, 200, 300, 400]) for (const off of [0, 0.25, 0.5, 0.75, 0.9]) {
    const V = kmh / 3.6, o = { H, id: 'rally', role: 'PR', mode: 'none', secs: 1 }, R = [];
    for (let k = 0; k < 24; k++) { setCv(); try {
      const [A, B] = pair(o), L = A.m.len, gap = 0.3 + k / 24 * V * DT; put(H, B, 0, 0, 0, 0); put(H, A, -(L + gap), off * A.m.wid, 0, V);
      const none = (t, th) => ({ st: 0, thr: th == null ? 'hold' : 0 });
      R.push(run({ A, B, iA: none, iB: none, swap: () => A.x > B.x }, o));
    } finally { C.setTest(null); } }
    const hit = R.filter(x => x.hit), mm = (f) => hit.length ? [Math.min(...hit.map(f)), Math.max(...hit.map(f))] : null;
    rows.push({ kmh, off, n: R.length, hit: hit.length, vA: mm(x => x.car[0].v[1]), vB: mm(x => x.car[1].v[1]), turnA: mm(x => Math.abs(x.car[0].turnMax)), turnB: mm(x => Math.abs(x.car[1].turnMax)), ovMax: mm(x => x.ovMax), pop: mm(x => x.pop), lost: mm(x => x.lostKnock),
      past: hit.filter(x => x.swapped).length, light: hit.filter(x => x.car[0].v[1] > 0.9 * kmh).length, nan: R.some(x => x.nan) });
  }
  return rows;
}

// ---- a real track (the cross-check): the same two cars put on Spa's or Bathurst's straight in a race of the game (Race.step: its own loop,
// aiControl, Car.step, carCollide for every pair, wallCollide), the car hit passive (locked: no pedal, no steer), the player with no pedal ----
function trackRun(tid, kind, dmg = 2) {   // (dmg: the race's damage setting; 0: no panels come off, no loose panels on the road)
  const R0 = Math.random; Math.random = seeded(64);
  try {
    setCv();
    const T = new C.Track(C.TRACKS.find(d => d.id === tid)), n = T.px.length, ds = T.len / n;
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS.find(m => m.id === 'rally'), assist: 2, seed: 9, difficulty: 1, damage: dmg, phys: 'cs' }); r.start();
    for (let k = 1; k <= 3 / DT; k++) { Math.random = seeded(1000 + k); C.aiControl(r.player, r, DT); r.step(DT); }   // (the start over: the launch, the rivals' reaction times)
    // the straightest, flattest 240 m well away from the grid
    let best = null; const w = Math.round(120 / ds);
    for (let i = Math.round(n * 0.2); i < Math.round(n * 0.8); i++) { let m = 0; for (let k = -w; k <= w; k += 4) { const j = (i + k + n) % n; m = Math.max(m, Math.abs(T.tx[i] * T.tz[j] - T.tz[i] * T.tx[j])); }
      const sc = m + 2 * Math.abs(T.grade[i] || 0); if (!best || sc < best.sc) best = { i, sc, m }; }
    const i = best.i, h = Math.atan2(T.tz[i], T.tx[i]), ox = T.px[i], oz = T.pz[i], A = r.player, B = r.cars.find(c => !c.isPlayer && c.m.id === 'kaze');
    const at = (c, lx, lz, hh, v) => { const x = ox + lx * Math.cos(h) - lz * Math.sin(h), z = oz + lx * Math.sin(h) + lz * Math.cos(h); c.place(x, z, h + hh); c.vx = v * Math.cos(h + hh); c.vz = v * Math.sin(h + hh);
      for (let g = 1; g <= c.m.gears.length; g++) { c.gear = g; if (v / c.m.rw * c.m.gears[g - 1] * c.m.final * 9.5493 < c.m.redline * 0.9) break; } };
    const V = 120 / 3.6, LA = A.m.len, LB = B.m.len, WB = B.m.wid;
    if (kind === 'rear-stand-c') { at(B, 0, 0, 0, 0); at(A, -((LA + LB) / 2 + 0.3), 0, 0, V); }
    else if (kind === 'head-o') { at(B, 0, 0, Math.PI, V); at(A, -((LA + LB) / 2 + 0.3), A.m.wid / 2, 0, V); }
    else { at(B, 0, 0, Math.PI / 2, 0); at(A, -(WB / 2 + LA / 2 + 0.3), -B.m.b, 0, V); }   // (tbone-stand-rear)
    B.locked = true; B.relT = 0; A.locked = false; A.inThr = 0; A.inBrk = 0; A.inSteer = 0;
    const sp = (c) => Math.hypot(c.vx, c.vz); let t1 = null; const h0 = [A.h, B.h], hU = [A.h, B.h], tm = [0, 0], out = { v: [[], []], gl: [0, 0] }, hc0 = [A.hitCar, B.hitCar];
    for (let k = 1; k <= 3 / DT; k++) {
      Math.random = seeded(5000 + k); const v0 = [sp(A), sp(B)]; A.inThr = 0; A.inBrk = 0; A.inSteer = 0; B.locked = true;
      r.step(DT);
      if (t1 == null && (Math.abs(sp(B) - v0[1]) > 0.5 || Math.abs(sp(A) - v0[0]) > 0.5)) { t1 = k * DT - DT; out.v0 = v0.map(x => +(x * 3.6).toFixed(1)); }
      if (t1 == null) continue;
      const tt = k * DT - t1; [A, B].forEach((c, q) => { hU[q] += wrap(c.h - (hU[q])); tm[q] = Math.max(tm[q], Math.abs(hU[q] - h0[q])); out.gl[q] = Math.max(out.gl[q], c.xgl || 0); });
      for (let j = 0; j < AT.length; j++) if (out.v[0][j] == null && tt >= AT[j] - 1e-9) { out.v[0][j] = +(sp(A) * 3.6).toFixed(1); out.v[1][j] = +(sp(B) * 3.6).toFixed(1); }
      if (tt >= 2 + DT) break;
    }
    out.turnMax = tm.map(x => +(x * D).toFixed(1)); out.hit = t1 != null; out.dmg = dmg; out.loose = r.debrisId || 0; out.where = { tid, s: Math.round(i * ds), bend: +best.m.toFixed(4), grade: +(T.grade[i] || 0).toFixed(3) };
    return out;   // (out.loose: the panels that came off and lie on the road)
  } finally { C.setTest(null); Math.random = R0; }
}
// the same on the plane, with the same two models
function planeRun(kind) {
  const H = RIG.cs, V = 120 / 3.6, o = { H, id: 'rally', idB: 'kaze', role: 'PR', mode: 'none', ph: 0 };
  setCv();
  try {
    const [A, B] = pair(o), LA = A.m.len, LB = B.m.len;
    if (kind === 'rear-stand-c') { put(H, B, 0, 0, 0, 0); put(H, A, -((LA + LB) / 2 + 0.3), 0, 0, V); }
    else if (kind === 'head-o') { put(H, B, 0, 0, Math.PI, V); put(H, A, -((LA + LB) / 2 + 0.3), A.m.wid / 2, 0, V); }
    else { put(H, B, 0, 0, Math.PI / 2, 0); put(H, A, -(B.m.wid / 2 + LA / 2 + 0.3), -B.m.b, 0, V); }
    const none = () => ({ st: 0, thr: 0 });
    return run({ A, B, iA: none, iB: none, swap: () => false }, o);
  } finally { C.setTest(null); }
}

// ---- the output ----
const f = (x, d = 0) => x == null || !Number.isFinite(x) ? '-' : x.toFixed(d);
const sl = (a, d = 0) => a.map(x => f(x, d)).join('/');
const rg = (a, d = 0) => a == null ? '-' : a[0] === a[1] ? f(a[0], d) : f(a[0], d) + '..' + f(a[1], d);
function table(title, rows, cols) {
  const cells = rows.map(r => cols.map(c => String(c[1](r)))), wd = cols.map((c, i) => Math.max(c[0].length, ...cells.map(x => x[i].length)));
  console.log('\n' + title); console.log(cols.map((c, i) => c[0].padEnd(wd[i])).join(' | '));
  for (const x of cells) console.log(x.map((s, i) => s.padEnd(wd[i])).join(' | '));
}
const T_SPEED = [
  ['scenario', r => r.name], ['role', r => r.role], ['vn km/h', r => f(r.vn)], ['e', r => f(r.e, 2)],
  ['A km/h: before > step/+0.1/+0.5/+2 s', r => f(r.car[0].v0) + ' > ' + sl(r.car[0].v)], ['B km/h: before > step/+0.1/+0.5/+2 s', r => f(r.car[1].v0) + ' > ' + sl(r.car[1].v)],
  ['E0 kJ', r => f(r.E0)], ['E lost %: in knocks, at +0.1/+0.5/+2 s', r => f(r.lostKnock, 1) + ', ' + sl(r.lostAt.slice(1), 1)], ['gain', r => r.gainN ? r.gainN + 'x (' + f(r.gainMax) + ' J)' : '0'],
  ['p err %: in knocks, +0.1/+0.5/+2 s', r => f(r.pErrKnock, 2) + ', ' + sl(r.pErrAt.slice(1), 1)], ['hold: back at 95 % A/B s', r => r.hold ? sl(r.hold.tV95, 1) : '-'], ['hold: lowest A/B km/h', r => r.hold ? sl(r.hold.vMin) : '-'],
];
const T_TURN = [
  ['scenario', r => r.name], ['turn deg max A/B', r => sl(r.car.map(c => c.turnMax))], ['turn +0.5 s A/B', r => sl(r.car.map(c => c.turn[2]))], ['turn +2 s A/B', r => sl(r.car.map(c => c.turn[3]))],
  ['exit +2 s A/B', r => sl(r.car.map(c => c.exit2))], ['yaw pk deg/s A/B', r => sl(r.car.map(c => c.wPk))], ['rigid dw deg/s A/B', r => sl(r.car.map(c => c.dwRig))], ['taken dw A/B', r => sl(r.car.map(c => c.dwTak))],
  ['kick deg A/B', r => sl(r.car.map(c => c.kc), 1)], ['slide m/s A/B', r => sl(r.car.map(c => c.cs), 1)], ['xgl A/B', r => sl(r.car.map(c => c.gl), 2)], ['xgl back s', r => sl(r.car.map(c => c.glBack), 2)],
  ['straight s A/B', r => sl(r.car.map(c => c.tStraight), 2)], ['shift +2 s m A/B', r => sl(r.car.map(c => c.shift2), 1)], ['hold: turn max A/B', r => r.hold ? sl(r.hold.turnMax) : '-'], ['hold: straight A/B', r => r.hold ? sl(r.hold.tStraight, 2) : '-'],
];
const T_TOUCH = [
  ['scenario', r => r.name], ['knocks: hard / all (runs)', r => r.nBig + ' / ' + r.nImp + ' (' + r.nClu + ')'], ['boxes overlap s', r => f(r.tContact, 2)], ['apart after steps', r => String(r.steps)], ['stick s', r => f(r.stick, 2)],
  ['toggles', r => String(r.toggles)], ['flips', r => String(r.flips)], ['pop cm', r => f(r.pop, 1)], ['overlap max cm', r => f(r.ovMax)], ['left cm', r => f(r.ovLeft, 1)], ['swapped', r => r.swapped ? 'YES' : '-'],
  ['phases: A +0.1 s', r => rg(r.spread.vA)], ['B +0.1 s', r => rg(r.spread.vB)], ['overlap cm', r => rg(r.spread.ovMax)], ['turn B', r => rg(r.spread.turnB)], ['knocks', r => rg(r.spread.nImp)], ['swapped', r => r.spread.swapped + '/4'],
  ['dmg A/B', r => sl(r.car.map(c => c.dmg), 2)], ['NaN', r => r.nan || r.spread.nan ? 'NaN' : '-'],
];
const T_SHORT = [
  ['scenario', r => r.name + (r.tag ? ' ' + r.tag : '')], ['A km/h: before > step/+0.5/+2 s', r => f(r.car[0].v0) + ' > ' + sl([r.car[0].v[0], r.car[0].v[2], r.car[0].v[3]])], ['B km/h', r => f(r.car[1].v0) + ' > ' + sl([r.car[1].v[0], r.car[1].v[2], r.car[1].v[3]])],
  ['E lost % knocks/+2 s', r => f(r.lostKnock, 1) + '/' + f(r.lostAt[3], 1)], ['p err % knocks', r => f(r.pErrKnock, 2)], ['turn max A/B', r => sl(r.car.map(c => c.turnMax))], ['turn +2 s A/B', r => sl(r.car.map(c => c.turn[3]))], ['yaw pk A/B', r => sl(r.car.map(c => c.wPk))],
  ['rigid dw A/B', r => sl(r.car.map(c => c.dwRig))], ['taken dw A/B', r => sl(r.car.map(c => c.dwTak))], ['xgl A/B', r => sl(r.car.map(c => c.gl), 2)], ['straight s A/B', r => sl(r.car.map(c => c.tStraight), 2)],
  ['knocks hard/all', r => r.nBig + '/' + r.nImp], ['stick s', r => f(r.stick, 2)], ['flips', r => String(r.flips)], ['overlap cm', r => rg(r.spread.ovMax)], ['swapped', r => r.spread.swapped + '/4'], ['gain', r => String(r.spread.gainN)], ['NaN', r => r.nan || r.spread.nan ? 'NaN' : '-'],
];

function main() {
  const M = matrix(), byName = new Map(M.map(s => [s.name, s]));
  if (TRACE) {   // one scenario, step by step
    const sc = byName.get(TRACE); if (!sc) { console.error('no such scenario: ' + TRACE + '\n' + M.map(s => s.name).join(' ')); process.exit(1); }
    const H = RIG[arg('--phys') === 'nova' ? 'nova' : 'cs'], o = { H, id: arg('--car') || 'rally', role: arg('--role') || sc.role, mode: arg('--mode') || 'none', ph: +(arg('--ph') || 0) };
    setCv(); const r = run(sc.make(o), o, +(arg('--tspan') || 0.5)); C.setTest(null);
    console.log(`${sc.name} (${o.role}, ${o.mode}, ${H === RIG.nova ? 'nova' : 'cs'}, version ${VERSION()})`);
    console.log('  t s  | overlap cm | knock km/h | A: km/h  nose deg  yaw deg/s  kick deg  slide m/s  xgl | B: km/h  nose deg  yaw deg/s  kick deg  slide m/s  xgl');
    const c0 = r.series[0].q.map(s => s.h);
    for (const s of r.series) console.log(`${s.t.toFixed(3)} | ${(s.ov * 100).toFixed(1).padStart(6)} | ${s.imp == null ? '     -' : (s.imp * 3.6).toFixed(1).padStart(6)} | ` + s.q.map((q, k) => `${(Math.hypot(q.vx, q.vz) * 3.6).toFixed(1).padStart(6)} ${(wrap(q.h - c0[k]) * D).toFixed(1).padStart(7)} ${(q.w * D).toFixed(0).padStart(6)} ${(q.kc * D).toFixed(1).padStart(6)} ${q.cs.toFixed(2).padStart(6)} ${q.gl.toFixed(2)}`).join(' | '));
    delete r.series; console.log(JSON.stringify(r));
    return;
  }
  const sel = M.filter(s => !ONLY || s.name.includes(ONLY));
  const res = { tool: 'tools/trki/avto-avto.js', cv: CV, version: null, dt: DT, car: 'rally', cs: [], nova: [], roles: [], car2: [], car3: [], sweep: { cs: [], nova: [] }, order: null, track: [] };
  setCv(); res.version = VERSION(); C.setTest(null);
  res.cs = sel.map(s => runRow(s, RIG.cs));
  res.nova = sel.map(s => runRow(s, RIG.nova));
  if (!ONLY) {
    for (const nm of KEY) for (const role of ['PR', 'RP', 'RR']) { const r = runRow(byName.get(nm), RIG.cs, { role }); r.tag = role; res.roles.push(r); }
    for (const nm of KEY) { const r = runRow(byName.get(nm), RIG.cs, { id: 'kaze' }); r.tag = 'kaze'; res.car2.push(r); }
    // (a mid-engined car, its front axle further from its middle than its rear: the knocks that turn a car without pushing it across)
    for (const nm of ['head-120-o', 'head-200-o', 'rear-60-stand-o', 'rear-120-stand-o', 'rear-200-stand-o', 'tbone-120-stand-rear', 'pit-120-rear-8']) for (const id of ['rally', 'strega']) { const r = runRow(byName.get(nm), RIG.cs, { id }); r.tag = id; res.car3.push(r); }
    res.sweep.cs = sweep(RIG.cs); res.sweep.nova = sweep(RIG.nova);
    // carCollide(a, b) against carCollide(b, a): the same knock whichever car the race's list has first
    { const sc = byName.get('tbone-120-stand-rear'), o = { H: RIG.cs, id: 'rally', role: 'PR', mode: 'none', ph: 0 }; setCv();
      const S1 = sc.make(o), a = run(S1, o), S2 = sc.make(o), b = run({ A: S2.B, B: S2.A, iA: S2.iB, iB: S2.iA, swap: () => false }, o); C.setTest(null);
      res.order = { scenario: sc.name, ab: [a.car[0].v[2], a.car[1].v[2], a.car[1].turnMax], ba: [b.car[1].v[2], b.car[0].v[2], b.car[0].turnMax] }; }
    // (the plane has no damage model: with the race's damage on, the panels knocked off lie on the road and the cars run over them; the last
    // row is the same T-bone with the damage off)
    for (const [tid, kind, dmg] of [['spa', 'rear-stand-c', 2], ['spa', 'head-o', 2], ['spa', 'tbone-stand-rear', 2], ['spa', 'tbone-stand-rear', 0], ['bathurst', 'rear-stand-c', 2]]) {
      const t = trackRun(tid, kind, dmg), p = planeRun(kind); res.track.push({ tid, kind, dmg, track: t, plane: { v0: p.car.map(c => c.v0), v: p.car.map(c => c.v), turnMax: p.car.map(c => Math.abs(c.turnMax)), gl: p.car.map(c => c.gl) } }); }
  }
  if (JSON_OUT) { console.log(JSON.stringify(res)); return; }
  console.log(`== trki avto : avto (version ${res.version}${CV != null ? ', --cv ' + CV : ', the default'}; the car: rally, 1150 kg, 3.95 x 1.80 m; A the car that hits, B the car hit; inputs after the touch: none, the hold columns: the throttle holds the speed)`);
  for (const [ph, rows] of [['cs (the classic physics)', res.cs], ['nova (the new physics)', res.nova]]) {
    const ok = rows.filter(r => r.hit), miss = rows.filter(r => !r.hit);
    table(`-- ${ph}: speeds, energy, momentum`, ok, T_SPEED); table(`-- ${ph}: the turn`, ok, T_TURN); table(`-- ${ph}: the contact`, ok, T_TOUCH);
    if (miss.length) console.log('no touch: ' + miss.map(r => r.name).join(' '));
  }
  if (!ONLY) {
    table('-- cs: the roles (PR the player hits a rival, RP a rival hits the player, RR two rivals)', res.roles.filter(r => r.hit), T_SHORT);
    table('-- cs: another car (kaze, 1240 kg, 4.35 x 1.78 m, rear drive)', res.car2.filter(r => r.hit), T_SHORT);
    table('-- cs: the same knocks, rally (front axle 1.15 m, rear 1.25 m from its middle) against strega (1.34 m, 1.12 m)', res.car3.filter(r => r.hit), T_SHORT);
    for (const ph of ['cs', 'nova']) table(`-- ${ph}: the step against the speed (A at V into a standing B, off of a width to the side; 24 places of the first touch in the step)`, res.sweep[ph], [
      ['V km/h', r => String(r.kmh)], ['off', r => r.off.toFixed(2)], ['touched', r => r.hit + '/' + r.n], ['A +0.1 s km/h', r => rg(r.vA)], ['B +0.1 s km/h', r => rg(r.vB)], ['E lost in knocks %', r => rg(r.lost)], ['turn A deg', r => rg(r.turnA)], ['turn B deg', r => rg(r.turnB)],
      ['overlap cm', r => rg(r.ovMax)], ['pop cm', r => rg(r.pop)], ['A past B', r => r.past + '/' + r.hit], ['A keeps > 90 % of V', r => r.light + '/' + r.hit], ['NaN', r => r.nan ? 'NaN' : '-']]);
    console.log(`\n-- cs: the order of the pair (${res.order.scenario}; A +0.5 s km/h, B +0.5 s km/h, B's turn deg): carCollide(A, B) ${res.order.ab.join(' / ')}, carCollide(B, A) ${res.order.ba.join(' / ')}`);
    console.log('\n-- cs: a real track against the plane (the player\'s rally into a rival\'s kaze, 120 km/h, no pedals; Race.step on the track)');
    for (const x of res.track) console.log(`${x.tid} ${x.kind} (s ${x.track.where.s} m, grade ${x.track.where.grade}, damage ${x.dmg}, loose panels ${x.track.loose}): track A ${f(x.track.v0[0])} > ${sl(x.track.v[0])}, B ${f(x.track.v0[1])} > ${sl(x.track.v[1])}, turn ${sl(x.track.turnMax)}, xgl ${sl(x.track.gl, 2)} | plane A ${f(x.plane.v0[0])} > ${sl(x.plane.v[0])}, B ${f(x.plane.v0[1])} > ${sl(x.plane.v[1])}, turn ${sl(x.plane.turnMax)}, xgl ${sl(x.plane.gl, 2)}`);
  }
}
main();
