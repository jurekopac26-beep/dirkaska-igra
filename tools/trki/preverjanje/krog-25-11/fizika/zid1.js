'use strict';
// zid: en sam klic Core.wallCollide (cv 6) za avto z vogalom v ograji ravne ceste; energija, NaN, zasuk, ostanek prekrivanja, zrcalo, skoda brez sunka
const { SNAP, load, rng } = require('./lib.js');
const { C, handling } = load(process.env.ROOT || SNAP);
const CV = process.env.CV != null ? +process.env.CV : 6;
C.setTest({ cv: CV });
const H = { cs: handling(C, 'cs'), nova: handling(C, 'nova') };
const N = +(process.env.N || 200000), R = rng(+(process.env.SEED || 1)), MODE = process.env.MODE || 'mix', DT = 1 / 120;
const pts = []; for (let x = 0; x <= 4000; x += 100) pts.push([x, 0]);
const T = new C.Track({ id: 'fizika-cesta', name: 'Ravnina, Preizkus', open: true, laps: 1, halfWidth: 6, points: pts, start: [300, 0], finish: [3700, 0] });
const ids = C.MODELS.filter(m => MODE === 'tl' ? m.trailer : !m.trailer).map(m => m.id);
const u = (a, b) => a + (b - a) * R();
const cache = {};
function car(phys, id, pl, slot) { const k = phys + id + pl + slot; if (cache[k]) return cache[k]; const c = H[phys].mkCar(id, { v: 0 }); c.isPlayer = !!pl; return (cache[k] = c); }
const q0 = T.query(1000, 0, -1, {});
function setup(c, S) {
  c.place(S.x, S.z, S.h); c.vx = S.vx; c.vz = S.vz; c.w = S.w; c.xgl = S.xgl || 0; c.xglT = S.xgl ? 0.5 : 0; c.air = S.air || 0; c.rl = null; c.hitWall = 0; c.fxWall = 0;
  c.dmg = 0; c.dz = [0, 0, 0, 0]; c.cd = [0, 0, 0, 0]; c.dents = []; c.lost = {}; c.detach = []; c.flat = 0; c.px = S.x; c.pz = S.z;
  c.q = {}; T.query(c.x, c.z, -1, c.q);
}
const E = (c) => 0.5 * c.m.mass * (c.vx * c.vx + c.vz * c.vz) + 0.5 * c.I * c.w * c.w;
const _q = {};
function maxPen(c) { const ch = Math.cos(c.h), sh = Math.sin(c.h); let p = 0; for (const P of c.corners) { const q = T.query(c.x + P[0] * ch - P[1] * sh, c.z + P[0] * sh + P[1] * ch, c.q.i, _q); p = Math.max(p, q.d - q.br, -q.bl - q.d); } return p; }
function run(S, slot) {
  const c = car(S.phys, S.id, S.pl, slot); setup(c, S);
  const e0 = E(c), s0 = { vx: c.vx, vz: c.vz, w: c.w, x: c.x, z: c.z, pen: maxPen(c), dmg: c.dmg };
  const hit = C.wallCollide(c, T, false, null, DT);
  return { c, e0, e1: E(c), s0, hit, s1: { vx: c.vx, vz: c.vz, w: c.w, x: c.x, z: c.z, pen: maxPen(c), dmg: c.dmg, xgl: c.xgl || 0 } };
}
const st = { n: 0, touch: 0, hitR: 0, nan: 0, dEpos: 0, dEmax: 0, wGrow: 0, penLeft: 0, mirr: 0, noImp: 0, noImpHit: 0, noImpDmg: 0, in2: 0 };
let worstE = null, worstM = null, worstPen = null, worstNo = null, worstW = null;
for (let n = 0; n < N; n++) {
  const phys = MODE === 'nova' ? 'nova' : MODE === 'mixphys' ? (R() < 0.5 ? 'cs' : 'nova') : 'cs';
  const id = ids[Math.floor(R() * ids.length)], pl = R() < 0.5, sd = R() < 0.5 ? 1 : -1;
  const c0 = car(phys, id, pl, 'a');
  const h = R() < 0.15 ? (Math.round(u(-4, 4)) * Math.PI / 2 + (R() < 0.5 ? 0 : u(-0.02, 0.02))) : u(-Math.PI, Math.PI), ch = Math.cos(h), sh = Math.sin(h);
  let ext = -1e9; for (const P of c0.corners) ext = Math.max(ext, sd * ((P[0] * ch - P[1] * sh) * q0.nx + (P[0] * sh + P[1] * ch) * q0.nz));
  const pen = Math.exp(u(Math.log(1e-4), Math.log(MODE === 'deep' ? 3 : 0.4))), B = sd > 0 ? q0.br : q0.bl, dc = sd * (B + pen - ext), x0 = u(600, 3000);
  const sp = Math.exp(u(Math.log(0.05), Math.log(MODE === 'fast' ? 300 : 95))), wallDir = Math.atan2(sd * q0.nz, sd * q0.nx), dir = R() < 0.8 ? wallDir + u(-1.55, 1.55) : u(-Math.PI, Math.PI);
  const S = { phys, id, pl, x: x0 + q0.nx * dc, z: q0.nz * dc, h, vx: sp * Math.cos(dir), vz: sp * Math.sin(dir), w: R() < 0.45 ? 0 : u(-9, 9), xgl: R() < 0.3 ? u(0, 1) : 0, air: MODE === 'air' && R() < 0.5 ? 1 : 0 };
  const o = run(S, 'a'); st.n++;
  const all = [o.s1.vx, o.s1.vz, o.s1.w, o.s1.x, o.s1.z, o.hit, o.s1.xgl];
  if (!all.every(Number.isFinite)) { st.nan++; if (st.nan < 4) console.log('NAN', JSON.stringify(S), JSON.stringify(o.s1), o.hit); continue; }
  if (o.s0.pen > 0) st.touch++;
  if (o.hit > 0) st.hitR++;
  const dE = o.e1 - o.e0;
  if (dE > 1e-5) { st.dEpos++; if (dE > st.dEmax) { st.dEmax = dE; worstE = { S, dE, e0: o.e0, hit: o.hit, s1: o.s1 }; } }
  if (Math.abs(o.s1.w) > Math.max(Math.abs(o.s0.w), 9) + 1e-9) { st.wGrow++; worstW = { S, w1: o.s1.w }; }
  if (o.s1.pen > 1e-6) { st.penLeft++; if (!worstPen || o.s1.pen > worstPen.pen) worstPen = { S, pen0: o.s0.pen, pen: o.s1.pen, hit: o.hit }; }
  const moved = Math.abs(o.s1.vx - o.s0.vx) + Math.abs(o.s1.vz - o.s0.vz) + Math.abs(o.s1.w - o.s0.w);
  if (o.hit > 0 && moved === 0) { st.noImp++; if (o.hit > 2.5) { st.noImpHit++; if (o.s1.dmg > o.s0.dmg) st.noImpDmg++; if (!worstNo || o.hit > worstNo.hit) worstNo = { S, hit: o.hit, dmg: o.s1.dmg, s1: o.s1 }; } }
  if (n % 3 === 0) { const B2 = sd > 0 ? q0.bl : q0.br, dcM = -sd * (B2 + pen - ext), M = Object.assign({}, S, { z: q0.nz * dcM, h: -S.h, vz: -S.vz, w: -S.w }), m = run(M, 'b');   // (zrcalna slika ob SVOJI ograji: br in bl nista enaka)
    const d = Math.max(Math.abs(m.s1.vx - o.s1.vx), Math.abs(m.s1.vz + o.s1.vz), Math.abs(m.s1.w + o.s1.w), Math.abs(m.s1.x - o.s1.x), Math.abs((m.s1.z - M.z) + (o.s1.z - S.z)), Math.abs(m.hit - o.hit), Math.abs(m.s1.dmg - o.s1.dmg), Math.abs(m.s1.xgl - o.s1.xgl));
    if (d > st.mirr) { st.mirr = d; worstM = { S, d, a: o.s1, b: m.s1, ha: o.hit, hb: m.hit }; } }
}
console.log(JSON.stringify(Object.assign({ cv: CV, mode: MODE, br: q0.br, bl: q0.bl }, st)));
const sh = (o) => o && JSON.stringify(o, (k, v) => typeof v === 'number' ? +v.toPrecision(6) : v);
if (worstE) console.log('najvec energije:', sh(worstE));
if (worstW) console.log('zasuk nad mejo:', sh(worstW));
if (worstPen) console.log('ostanek prekrivanja:', sh(worstPen));
if (worstNo) console.log('udarec brez sunka:', sh(worstNo));
if (worstM && st.mirr > 1e-9) console.log('zrcalo:', sh(worstM));
