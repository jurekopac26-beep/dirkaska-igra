'use strict';
// avto-avto: en sam klic Core.carCollide (cv 6) na nakljucnih prekrivajocih se parih; gibalna kolicina, energija, NaN, zrcalo, zamenjava vlog
const { SNAP, load, rng } = require('./lib.js');
const { C, handling } = load(process.env.ROOT || SNAP);
const CV = process.env.CV != null ? +process.env.CV : 6;
C.setTest({ cv: CV });
const H = { cs: handling(C, 'cs'), nova: handling(C, 'nova') };
const N = +(process.env.N || 200000), R = rng(+(process.env.SEED || 1));
const ids = C.MODELS.filter(m => !m.trailer).map(m => m.id);
const u = (a, b) => a + (b - a) * R();
function mk(phys, id, pl) { const c = H[phys].mkCar(id, { v: 0 }); c.isPlayer = !!pl; return c; }
function st(c) { const pmf = 1; const m = (c.m.mass + (c.fuelKg || 0)), I = c.I * m / c.m.mass; return { m, I, x: c.x, z: c.z, h: c.h, vx: c.vx, vz: c.vz, w: c.w, xgl: c.xgl || 0, csKc: c.csKc || 0, cSx: c.cSx || 0, cSz: c.cSz || 0 }; }
const E = (s) => 0.5 * s.m * (s.vx * s.vx + s.vz * s.vz) + 0.5 * s.I * s.w * s.w;
function setup(c, S) { c.place(S.x, S.z, S.h); c.vx = S.vx; c.vz = S.vz; c.w = S.w; c.xgl = S.xgl || 0; c.xglT = S.xgl ? 0.5 : 0; c.csKc = S.csKc || 0; c.cSx = 0; c.cSz = 0; c.cSr = null; c.air = S.air || 0; c.rl = S.rl || null; c.hitCar = 0; c.fxCar = 0; c.dmg = 0; c.fuelKg = S.fuel || 0;
  c.dz = [0, 0, 0, 0]; c.cd = [0, 0, 0, 0]; c.dents = []; c.lost = {}; c.detach = []; c.flat = 0; }
const stats = { n: 0, hit: 0, dEmax: 0, dEmaxRel: 0, dPmax: 0, nan: 0, wmax: 0, dEpos: 0, mirr: 0, swap: 0, worst: null, worstP: null, worstM: null, worstS: null, dLmax: 0, worstL: null };
const cache = {};
function car(phys, id, pl, slot) { const k = phys + id + pl + slot; return cache[k] || (cache[k] = mk(phys, id, pl)); }
function run(S, slotA, slotB) {
  const a = car(S.pa, S.ia, S.pla, slotA), b = car(S.pb, S.ib, S.plb, slotB);
  setup(a, S.A); setup(b, S.B);
  const a0 = st(a), b0 = st(b);
  const imp = C.carCollide(a, b);
  const a1 = st(a), b1 = st(b);
  return { a0, b0, a1, b1, imp, a, b };
}
function mirrorS(S) { const m = (s) => Object.assign({}, s, { z: -s.z, h: -s.h, vz: -s.vz, w: -s.w, csKc: -(s.csKc || 0) }); return Object.assign({}, S, { A: m(S.A), B: m(S.B) }); }
function swapS(S) { return { pa: S.pb, pb: S.pa, ia: S.ib, ib: S.ia, pla: S.plb, plb: S.pla, A: S.B, B: S.A }; }
const MODE = process.env.MODE || 'mix';
for (let n = 0; n < N; n++) {
  const pa = MODE === 'nova' ? 'nova' : MODE === 'mixphys' ? (R() < 0.5 ? 'cs' : 'nova') : 'cs', pb = MODE === 'nova' ? 'nova' : MODE === 'mixphys' ? (R() < 0.5 ? 'cs' : 'nova') : 'cs';
  const ia = ids[Math.floor(R() * ids.length)], ib = ids[Math.floor(R() * ids.length)];
  const role = R(); const pla = role < 0.33, plb = role >= 0.33 && role < 0.5;
  const vmax = MODE === 'fast' ? 150 : 70;
  const sp = u(0, vmax), dir = u(-Math.PI, Math.PI);
  const A = { x: 0, z: 0, h: u(-Math.PI, Math.PI), vx: 0, vz: 0, w: R() < 0.5 ? 0 : u(-9, 9), xgl: R() < 0.3 ? u(0, 1) : 0, csKc: R() < 0.3 ? u(-0.3, 0.3) : 0, fuel: R() < 0.3 ? u(0, 80) : 0, air: MODE === 'air' && R() < 0.5 ? 1 : 0 };
  const B = { x: 0, z: 0, h: u(-Math.PI, Math.PI), vx: 0, vz: 0, w: R() < 0.5 ? 0 : u(-9, 9), xgl: R() < 0.3 ? u(0, 1) : 0, csKc: R() < 0.3 ? u(-0.3, 0.3) : 0, fuel: R() < 0.3 ? u(0, 80) : 0, air: MODE === 'air' && R() < 0.5 ? 1 : 0 };
  const ma = C.MODELS.find(m => m.id === ia), mb = C.MODELS.find(m => m.id === ib);
  const reach = (Math.hypot(ma.len, ma.wid) + Math.hypot(mb.len, mb.wid)) * 0.5, r = u(0, reach), th = u(-Math.PI, Math.PI);
  B.x = r * Math.cos(th); B.z = r * Math.sin(th);
  // skupna hitrost + relativna
  const cvx = sp * Math.cos(dir), cvz = sp * Math.sin(dir), rel = Math.exp(u(Math.log(0.05), Math.log(MODE === 'fast' ? 200 : 60))), rd = u(-Math.PI, Math.PI);
  A.vx = cvx + 0.5 * rel * Math.cos(rd); A.vz = cvz + 0.5 * rel * Math.sin(rd); B.vx = cvx - 0.5 * rel * Math.cos(rd); B.vz = cvz - 0.5 * rel * Math.sin(rd);
  const S = { pa, pb, ia, ib, pla, plb, A, B };
  const o = run(S, 'a', 'b'); stats.n++;
  const all = [o.a1.vx, o.a1.vz, o.a1.w, o.b1.vx, o.b1.vz, o.b1.w, o.a1.x, o.a1.z, o.b1.x, o.b1.z, o.a1.csKc, o.b1.csKc, o.a1.cSx, o.a1.cSz, o.b1.cSx, o.b1.cSz, o.a1.xgl, o.b1.xgl];
  if (!all.every(Number.isFinite)) { stats.nan++; if (stats.nan < 4) console.log('NAN', JSON.stringify(S), JSON.stringify(o.a1), JSON.stringify(o.b1)); continue; }
  if (!(o.imp > 0)) { /* brez sunka */ }
  else stats.hit++;
  const E0 = E(o.a0) + E(o.b0), E1 = E(o.a1) + E(o.b1), dE = E1 - E0;
  const dPx = o.a0.m * (o.a1.vx - o.a0.vx) + o.b0.m * (o.b1.vx - o.b0.vx), dPz = o.a0.m * (o.a1.vz - o.a0.vz) + o.b0.m * (o.b1.vz - o.b0.vz), dP = Math.hypot(dPx, dPz);
  if (dE > 1e-3) { stats.dEpos++; const spin = (S.A.w !== 0 || S.B.w !== 0), gl = (S.A.xgl > 0 || S.B.xgl > 0), kc = (S.A.csKc !== 0 || S.B.csKc !== 0), pl = S.pla || S.plb;
    const key = (spin ? 'spin ' : 'nospin ') + (gl ? 'xgl ' : 'noxgl ') + (pl ? 'igralec' : 'tekmeca'); stats.cls = stats.cls || {}; stats.cls[key] = (stats.cls[key] || 0) + 1;
    if (!spin) { stats.ns = stats.ns || []; stats.ns.push({ dE: +dE.toFixed(2), E0: Math.round(E0), imp: +o.imp.toFixed(3), ia: S.ia, ib: S.ib, pla: S.pla, plb: S.plb, xa: S.A.xgl, xb: S.B.xgl, wa1: +o.a1.w.toFixed(3), wb1: +o.b1.w.toFixed(3) }); }
    if (dE / E0 > (stats.relMax || 0)) { stats.relMax = dE / E0; stats.worstRel = { S, dE, E0, imp: o.imp, wa1: o.a1.w, wb1: o.b1.w }; } }
  if (dE > stats.dEmax) { stats.dEmax = dE; stats.worst = { S, dE, E0, imp: o.imp, a0: o.a0, a1: o.a1, b0: o.b0, b1: o.b1 }; }
  if (dP > stats.dPmax) { stats.dPmax = dP; stats.worstP = { S, dP }; }
  stats.wmax = Math.max(stats.wmax, Math.abs(o.a1.w) > Math.abs(o.a0.w) ? Math.abs(o.a1.w) : 0, Math.abs(o.b1.w) > Math.abs(o.b0.w) ? Math.abs(o.b1.w) : 0);
  // zrcalo
  if (n % 4 === 0) { const sv = [o.a1.vx, o.a1.vz, o.a1.w, o.b1.vx, o.b1.vz, o.b1.w, o.a1.x, o.a1.z, o.b1.x, o.b1.z, o.a1.csKc, o.b1.csKc, o.a1.xgl, o.b1.xgl];
    const m = run(mirrorS(S), 'a', 'b'), mv = [m.a1.vx, -m.a1.vz, -m.a1.w, m.b1.vx, -m.b1.vz, -m.b1.w, m.a1.x, -m.a1.z, m.b1.x, -m.b1.z, -m.a1.csKc, -m.b1.csKc, m.a1.xgl, m.b1.xgl];
    let d = 0; for (let i = 0; i < sv.length; i++) d = Math.max(d, Math.abs(sv[i] - mv[i])); if (d > stats.mirr) { stats.mirr = d; stats.worstM = { S, d, sv, mv }; }
    const s = run(swapS(S), 'b2', 'a2'), swv = [s.b1.vx, s.b1.vz, s.b1.w, s.a1.vx, s.a1.vz, s.a1.w, s.b1.x, s.b1.z, s.a1.x, s.a1.z, s.b1.csKc, s.a1.csKc, s.b1.xgl, s.a1.xgl];
    let d2 = 0; for (let i = 0; i < sv.length; i++) d2 = Math.max(d2, Math.abs(sv[i] - swv[i])); if (d2 > stats.swap) { stats.swap = d2; stats.worstS = { S, d: d2, sv, swv }; } }
}
const W = stats.worst;
console.log(JSON.stringify({ cv: CV, mode: MODE, n: stats.n, hit: stats.hit, nan: stats.nan, dEpos: stats.dEpos, dEmax_J: +stats.dEmax.toFixed(3), dPmax: stats.dPmax, wGrowMax: +stats.wmax.toFixed(3), mirrMax: stats.mirr, swapMax: stats.swap }));
console.log('razredi dE>0:', JSON.stringify(stats.cls || {}), 'relMax', stats.relMax);
if (stats.ns) { stats.ns.sort((x, y) => y.dE - x.dE); console.log('brez zacetnega vrtenja, najhujsi:', JSON.stringify(stats.ns.slice(0, 4)), 'vseh', stats.ns.length); }
if (W && W.dE > 1e-3) console.log('worstE', JSON.stringify({ dE: W.dE, E0: W.E0, imp: W.imp, S: W.S, wa1: W.a1.w, wb1: W.b1.w }));
if (stats.worstRel) console.log('worstRel', JSON.stringify(stats.worstRel));
if (stats.dPmax > 1e-6) console.log('worstP', JSON.stringify(stats.worstP));
if (stats.mirr > 1e-6) console.log('worstMirror', JSON.stringify(stats.worstM));
if (stats.swap > 1e-6) console.log('worstSwap', JSON.stringify(stats.worstS));
