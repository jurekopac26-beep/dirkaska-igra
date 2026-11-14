// PIT / rear-quarter knocks: my own placement; the single-knock response (A a ghost after the first knock) against the whole contact
'use strict';
const { C, RIG, DT, D, KMH, car, setv, sim, none, f, clamp } = require('./v1.js');
const hold = (c, vT) => { let I = 0.3; return () => { const e = vT - Math.hypot(c.vx, c.vz); I = clamp(I + e * 0.8 * DT, 0, 1); return { thr: clamp(I + 0.35 * e, 0, 1) }; }; };
function pit(phys, kmh, vc, o = {}) {
  C.setTest(o.cv != null ? { cv: o.cv } : null);
  const V = kmh / KMH, A = car(phys, 'rally', !!o.plA), B = car(phys, 'rally', o.plB != null ? o.plB : true), M = A.m, L = M.len, W = M.wid;
  const al = Math.asin(vc / V), lx = (o.front ? 0.35 : -0.35) * L, gap = 0.4 + (o.ph || 0) * vc * DT, tc = gap / vc;
  const cx = lx - V * (Math.cos(al) - 1) * tc, cz = -W / 2 - gap;
  setv(B, 0, 0, 0, V); setv(A, cx - (L / 2 * Math.cos(al) - W / 2 * Math.sin(al)), cz - (L / 2 * Math.sin(al) + W / 2 * Math.cos(al)), al, V);
  // warm up: before the touch both hold their speed (as a driver would), after it: none | hold | A steers back to straight (a driver who does not keep turning in)
  const hA = hold(A, V), hB = hold(B, V);
  const inA = (t, th) => th == null ? hA() : o.mode === 'hold' ? hA() : o.mode === 'away' ? { st: clamp(-2.0 * A.h - 0.25 * A.vz / Math.max(5, Math.hypot(A.vx, A.vz)), -0.5, 0.5), thr: 0 } : {};
  const inB = (t, th) => th == null ? hB() : o.mode === 'hold' ? hB() : {};
  const r = sim(A, B, Object.assign({ phys, T: 4, inA, inB }, o)); C.setTest(null); return r;
}
const row = (name, r) => { if (!r.hit) { console.log(name + ': NO HIT'); return; } const a = r.st[0], b = r.st[1], F = r.first || { imp: NaN, dvB: NaN, dwB: NaN, glB: NaN };
  console.log(`${name.padEnd(40)} | first knock: vn ${f(F.imp, 1)} m/s, dvB ${f(F.dvB, 2)} m/s, dwB ${f(F.dwB * D, 0)} deg/s, xglB ${f(F.glB, 2)} | B turnMax ${f(b.turnMax * D, 1)} wMax ${f(b.wMax * D, 0)} xgl ${f(b.gl, 2)} rigid dw ${f(b.dwRig * D, 0)} taken ${f(b.dwTak * D, 0)} v 0.5/2 s ${f(b.v[0.5].v * KMH, 0)}/${f(b.v[2].v * KMH, 0)} | A turnMax ${f(a.turnMax * D, 1)} | knocks ${r.nK}`); };
const arg = process.argv[2] || 'all';
if (arg === 'all' || arg === 'pit') {
  for (const kmh of [60, 120, 200]) for (const vc of [1, 2, 3, 4, 5, 6, 8, 10]) {
    if (vc >= kmh / KMH) continue;
    row(`cs pit-${kmh}-rear-${vc} whole, none`, pit('cs', kmh, vc));
    row(`cs pit-${kmh}-rear-${vc} whole, hold`, pit('cs', kmh, vc, { mode: 'hold' }));
    row(`cs pit-${kmh}-rear-${vc} A steers away`, pit('cs', kmh, vc, { mode: 'away' }));
    row(`cs pit-${kmh}-rear-${vc} FIRST KNOCK ONLY`, pit('cs', kmh, vc, { ghostAfter: 0 }));
  }
}
if (arg === 'all' || arg === 'phase') {
  for (const vc of [4, 8]) for (const ph of [0, 0.25, 0.5, 0.75]) row(`cs pit-60-rear-${vc} ph ${ph}`, pit('cs', 60, vc, { ph }));
  for (const vc of [2, 4, 8]) row(`cs pit-60-rear-${vc} RR`, pit('cs', 60, vc, { plB: false }));
  for (const vc of [2, 4, 8]) row(`cs pit-60-front-${vc}`, pit('cs', 60, vc, { front: true }));
  for (const vc of [2, 4, 8]) row(`cs pit-120-front-${vc}`, pit('cs', 120, vc, { front: true }));
}
module.exports = { pit, hold };
