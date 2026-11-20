'use strict';
const { C, RIG, DT, D, KMH, car, setv, sim, none, f, clamp, massOf } = require('./v1.js');
const row = (name, r, extra = '') => { if (!r.hit) { console.log(name + ': NO HIT'); return; } const a = r.st[0], b = r.st[1];
  console.log(`${name.padEnd(38)} | A ${f(a.v0 * KMH, 0)} > ${[0.1, 0.5, 2].map(m => f(a.v[m].v * KMH, 0)).join('/')} | B ${f(b.v0 * KMH, 0)} > ${[0.1, 0.5, 2].map(m => f(b.v[m].v * KMH, 0)).join('/')} | turnMax ${f(a.turnMax * D, 1)}/${f(b.turnMax * D, 1)} | wMax ${f(a.wMax * D, 0)}/${f(b.wMax * D, 0)} | rigid ${f(a.dwRig * D, 0)}/${f(b.dwRig * D, 0)} taken ${f(a.dwTak * D, 0)}/${f(b.dwTak * D, 0)} | xgl ${f(a.gl, 2)}/${f(b.gl, 2)} | n ${r.nK} gain ${r.gainN}x ${f(r.gainMax / 1000, 1)} kJ pErr ${f(r.pErr * 100, 2)} % | dmg ${f(r.A.dmg, 2)}/${f(r.B.dmg, 2)} ${extra}`); };
const V = (k) => k / KMH;
function head(phys, kmh, off, o = {}) { C.setTest(o.cv != null ? { cv: o.cv } : null);
  const A = car(phys, o.idA || 'rally', true), B = car(phys, o.idB || 'rally', false), gap = 0.4 + (o.ph || 0) * 2 * V(kmh) * DT;
  setv(B, 0, 0, Math.PI, V(o.kmhB != null ? o.kmhB : kmh)); setv(A, -((A.m.len + B.m.len) / 2 + gap), off * A.m.wid, 0, V(kmh));
  const r = sim(A, B, Object.assign({ phys, T: 3, inA: none, inB: none }, o)); C.setTest(null); return r; }
function rear(phys, kmh, kmhB, off, o = {}) { C.setTest(o.cv != null ? { cv: o.cv } : null);
  const A = car(phys, o.idA || 'rally', o.plA != null ? o.plA : true), B = car(phys, o.idB || 'rally', !!o.plB), gap = 0.4 + (o.ph || 0) * V(kmh - kmhB) * DT;
  setv(B, 0, 0, 0, V(kmhB)); setv(A, -((A.m.len + B.m.len) / 2 + gap), off * A.m.wid, 0, V(kmh));
  const r = sim(A, B, Object.assign({ phys, T: 3, inA: o.inA || none, inB: none }, o)); C.setTest(null); return r; }
const arg = process.argv[2] || 'all';
if (arg === 'all' || arg === 'head') {
  for (const kmh of [60, 120, 200]) { row(`cs head-${kmh}-o AB`, head('cs', kmh, 0.5)); row(`cs head-${kmh}-o BA (order swapped)`, head('cs', kmh, 0.5, { order: 'BA' })); }
  for (const ph of [0.25, 0.5, 0.75]) row(`cs head-200-o ph ${ph}`, head('cs', 200, 0.5, { ph }));
  row('nova head-120-o', head('nova', 120, 0.5)); row('cs head-120-c', head('cs', 120, 0)); row('cs head-120-c Stara', head('cs', 120, 0, { cv: 5 }));
  for (const id of ['rally', 'strega', 'kaze']) for (const kmh of [60, 120, 200]) row(`cs rear-${kmh}-stand-o ${id}`, rear('cs', kmh, 0, 0.5, { idA: id, idB: id }));
  row('cs rear-120-stand-c', rear('cs', 120, 0, 0)); row('cs rear-120-bump-c (90)', rear('cs', 120, 90, 0)); row('cs rear-120-bump-o (90)', rear('cs', 120, 90, 0.5));
}
if (arg === 'all' || arg === 'mass') {
  // damage against mass; Arkadna's pm
  row('cs head-120 miska(A) / kamen(B)', head('cs', 120, 0, { idA: 'miska', idB: 'kamen' }));
  row('cs head-120 kamen(A) / miska(B)', head('cs', 120, 0, { idA: 'kamen', idB: 'miska' }));
  row('cs head-120 kamen / kamen', head('cs', 120, 0, { idA: 'kamen', idB: 'kamen' }));
  row('cs head-120 miska / miska', head('cs', 120, 0, { idA: 'miska', idB: 'miska' }));
  row('cs head 60+60 kamen / miska', head('cs', 60, 0, { idA: 'kamen', idB: 'miska' }));
  row('cs rear 120>90 rally/rally sim', rear('cs', 120, 90, 0));
  row('cs rear 120>90 rally/rally Arkadna, A player', rear('cs', 120, 90, 0, { cv: 2 }));
  row('cs rear 120>90 rally/rally Arkadna, B player', rear('cs', 120, 90, 0, { cv: 2, plA: false, plB: true }));
  row('cs rear 120>90 rally(A)>kamen(B)', rear('cs', 120, 90, 0, { idB: 'kamen' }));
}
if (arg === 'all' || arg === 'deep') {
  for (const kmh of [120, 200, 300]) for (const off of [0.5, 0.75]) { const R = []; for (let k = 0; k < 24; k++) { const r = rear('cs', kmh, 0, off, { ph: k / 24, T: 1 }); if (r.hit) R.push(r); }
    const vA = R.map(r => r.st[0].v[0.1].v * KMH), vB = R.map(r => r.st[1].v[0.1].v * KMH), past = R.filter(r => r.A.x > r.B.x).length, light = vA.filter(v => v > 0.9 * kmh).length;
    console.log(`cs A ${kmh} km/h into a standing B, off ${off}: touched ${R.length}/24 | A +0.1 s ${f(Math.min(...vA), 0)}..${f(Math.max(...vA), 0)} | B +0.1 s ${f(Math.min(...vB), 0)}..${f(Math.max(...vB), 0)} | A past B (after 1 s) ${past}/24 | A keeps > 90 % ${light}/24 | turn A ${f(Math.min(...R.map(r => Math.abs(r.st[0].turnMax * D))), 0)}..${f(Math.max(...R.map(r => Math.abs(r.st[0].turnMax * D))), 0)}`); }
}
if (arg === 'all' || arg === 'go') {
  // the striker flat out from the touch: when is it back at 95 % of its speed
  const full = (t, th) => ({ thr: 1 });
  for (const [nm, mk] of [['rear-120-stand-c', () => rear('cs', 120, 0, 0, { inA: full, trace: 6, T: 6 })], ['rear-60-stand-c', () => rear('cs', 60, 0, 0, { inA: full, trace: 6, T: 6 })]]) {
    const r = mk(), tr = r.trace, v0 = r.st[0].v0; let vmin = 1e9, tmin = 0, t95 = null; for (const s of tr) { const v = Math.hypot(s.A.vx, s.A.vz); if (v < vmin) { vmin = v; tmin = s.t; } if (t95 == null && s.t > tmin && v >= 0.95 * v0 && vmin < 0.95 * v0) t95 = s.t; }
    console.log(`${nm} A flat out after the touch: lowest ${f(vmin * KMH, 0)} km/h at ${f(tmin, 2)} s, back at 95 % after ${f(t95, 2)} s; B at 2 s ${f(r.st[1].v[2].v * KMH, 0)}`); }
  // a free run for comparison: rally flat out from 53 km/h and from 67 km/h to 114 km/h
  for (const from of [53, 67, 26]) { const c = car('cs', 'rally', true); setv(c, 0, 0, 0, V(from)); let t = 0; const tgt = from === 26 ? 57 : 114; while (Math.hypot(c.vx, c.vz) * KMH < tgt && t < 20) { c.inThr = 1; c.inSteer = 0; c.inBrk = 0; c.step(DT, RIG.cs.plane); t += DT; } console.log(`free rally flat out ${from} > ${tgt} km/h: ${f(t, 2)} s`); }
}
module.exports = { head, rear };
