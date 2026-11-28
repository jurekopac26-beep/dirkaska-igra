'use strict';
// predmeti in odpadli kosi: en sam klic propCarHit / debrisHit (cv 6) na nakljucnih stanjih; gibalna kolicina, energija (vodoravna), NaN, zrcalo avta
const { SNAP, loadInst, rng } = require('./lib.js');
const { C, SIM, handling } = loadInst(process.env.ROOT || SNAP, [['function propCarHit(race, c, b) {', 'globalThis.__X = { propCarHit: (r, c, b) => propCarHit(r, c, b), debrisHit: (c, d) => debrisHit(c, d), kinds: () => Object.keys(PROPK) };\n  function propCarHit(race, c, b) {']]);
const CV = process.env.CV != null ? +process.env.CV : 6; C.setTest({ cv: CV });
const X = globalThis.__X, N = +(process.env.N || 60000), R = rng(+(process.env.SEED || 1)), WHAT = process.env.WHAT || 'kos', u = (a, b) => a + (b - a) * R();
const H = handling(C, 'cs'), ids = C.MODELS.filter(m => !m.trailer).map(m => m.id), cache = {};
const car = (id, pl, slot) => cache[id + pl + slot] || (cache[id + pl + slot] = Object.assign(H.mkCar(id, { v: 0 }), { isPlayer: !!pl }));
function setup(c, S) { c.place(S.x, S.z, S.h); c.vx = S.vx; c.vz = S.vz; c.w = S.w; c.xgl = S.xgl || 0; c.xglT = S.xgl ? 0.5 : 0; c.csKc = 0; c.cSx = 0; c.cSz = 0; c.cSr = null; c.air = 0; c.rl = null; c.hitDebris = 0; c.dmg = 0; c.fuelKg = S.fuel || 0; c.y = 0;
  c.dz = [0, 0, 0, 0]; c.cd = [0, 0, 0, 0]; c.dents = []; c.lost = {}; c.detach = []; c.flat = 0; }
const cm = (c) => c.m.mass + (c.fuelKg || 0), Ec = (c) => { const m = cm(c); return 0.5 * m * (c.vx * c.vx + c.vz * c.vz) + 0.5 * c.I * m / c.m.mass * c.w * c.w; };
const fin = (...a) => a.every(Number.isFinite), r3 = (x) => +x.toFixed(3);
const A = { n: 0, hit: 0, nan: 0, dP: 0, carUp: 0, carUpRest: 0, carUpMax: 0, pairUp: 0, pairUpMax: 0, pairUpRel: 0, mirr: 0, ex: null, exRest: null, byKind: {} };
function carState() { const id = ids[(R() * ids.length) | 0], sp = Math.exp(u(Math.log(1), Math.log(80))), dir = u(-Math.PI, Math.PI);
  return { id, pl: R() < 0.3, x: 0, z: 0, h: u(-Math.PI, Math.PI), vx: sp * Math.cos(dir), vz: sp * Math.sin(dir), w: R() < 0.5 ? 0 : u(-9, 9), xgl: R() < 0.4 ? u(0, 1) : 0, fuel: R() < 0.3 ? u(0, 80) : 0 }; }
function account(key, c, e0, p0, m2, v0, v1, S, extra) {   // m2: masa stvari, v0/v1 njena vodoravna hitrost prej/potem
  const e1 = Ec(c), dEc = e1 - e0, dE2 = 0.5 * m2 * (v1[0] * v1[0] + v1[1] * v1[1] - v0[0] * v0[0] - v0[1] * v0[1]), dE = dEc + dE2;
  const dPx = cm(c) * c.vx - p0[0] + m2 * (v1[0] - v0[0]), dPz = cm(c) * c.vz - p0[1] + m2 * (v1[1] - v0[1]); A.dP = Math.max(A.dP, Math.hypot(dPx, dPz)); (A.dPk || (A.dPk = {}))[key] = Math.max((A.dPk || {})[key] || 0, Math.hypot(dPx, dPz));
  const rest = Math.hypot(v0[0], v0[1]) < 1e-9, B = A.byKind[key] || (A.byKind[key] = { hit: 0, carUp: 0, pairUp: 0, pairMax: 0 }); B.hit++;
  if (dEc > 1e-6) { A.carUp++; B.carUp++; if (rest) { A.carUpRest++; if (!A.exRest || dEc > A.exRest.dEc) A.exRest = Object.assign({ key, dEc: r3(dEc), E0: Math.round(e0), id: S.id, m: r3(cm(c)), m2: r3(m2), v0: [r3(S.vx), r3(S.vz)], w0: r3(S.w), v1: [r3(c.vx), r3(c.vz)], w1: r3(c.w), xgl: r3(S.xgl) }, extra); } if (dEc > A.carUpMax) A.carUpMax = dEc; }
  if (dE > 1e-6) { A.pairUp++; B.pairUp++; if (dE > B.pairMax) B.pairMax = dE; if (dE > A.pairUpMax) { A.pairUpMax = dE; A.ex = Object.assign({ key, dE: r3(dE), dEavto: r3(dEc), dEstvar: r3(dE2), E0: Math.round(e0), id: S.id, m: r3(cm(c)), m2: r3(m2), v0: [r3(S.vx), r3(S.vz)], w0: r3(S.w), v1: [r3(c.vx), r3(c.vz)], w1: r3(c.w), s0: v0.map(r3), s1: v1.map(r3), xgl: r3(S.xgl) }, extra); } A.pairUpRel = Math.max(A.pairUpRel, dE / e0); }
}
if (WHAT === 'kos') {
  const mkD = (c, S, D) => { const ch = Math.cos(S.h), sh = Math.sin(S.h), ci = c.circles[D.ci % c.circles.length], r = c.rad + D.r * 0.7; return { id: D.id, x: S.x + ch * ci + Math.cos(D.phi) * D.rho * r, z: S.z + sh * ci + Math.sin(D.phi) * D.rho * r, y: D.y, vx: D.vx, vz: D.vz, vy: 0, wx: 0, wy: 0, wz: 0, r: D.r, m: D.m, ground: D.ground, rest: false, roll: 0, by: null, byT: null, on: null }; };
  for (let n = 0; n < N; n++) { const S = carState(), c = car(S.id, S.pl, 'a'); setup(c, S);
    const ds = R() < 0.25 ? 0 : Math.exp(u(Math.log(0.2), Math.log(40))), dd = u(-Math.PI, Math.PI), D = { id: n, ci: (R() * 8) | 0, phi: u(-Math.PI, Math.PI), rho: R() < 0.02 ? 0 : u(0.05, 0.99), r: u(0.15, 0.6), m: u(0.3, 14), y: u(0, 0.5), vx: ds * Math.cos(dd), vz: ds * Math.sin(dd), ground: R() < 0.6 };
    if (R() < 0.05) { D.vx = S.vx; D.vz = S.vz; }   // nicelna relativna hitrost
    const d = mkD(c, S, D), e0 = Ec(c), p0 = [cm(c) * c.vx, cm(c) * c.vz], v0 = [d.vx, d.vz]; A.n++;
    X.debrisHit(c, d);
    if (!fin(c.vx, c.vz, c.w, c.x, c.z, c.xgl || 0, c.csKc || 0, d.x, d.z, d.vx, d.vz, d.vy)) { A.nan++; if (A.nan < 3) console.log('NAN', JSON.stringify(S), JSON.stringify(D)); continue; }
    const moved = c.vx !== S.vx || c.vz !== S.vz || c.w !== S.w || d.vx !== v0[0] || d.vz !== v0[1]; if (!moved) continue; A.hit++;
    const lying = D.ground && Math.hypot(D.vx, D.vz) < 3; account(lying ? 'lezi' : c.w !== S.w || Math.abs(S.w) > 0 ? 'giblje, avto se vrti' : 'giblje', c, e0, p0, d.m, v0, [d.vx, d.vz], S, { kos: { m: r3(D.m), r: r3(D.r) } });
    if (n % 5 === 0) { const M = Object.assign({}, S, { z: -S.z, h: -S.h, vz: -S.vz, w: -S.w }), c2 = car(S.id, S.pl, 'b'); setup(c2, M); const DM = Object.assign({}, D, { vz: -D.vz, phi: -D.phi }), d2 = mkD(c2, M, DM); X.debrisHit(c2, d2);
      A.mirr = Math.max(A.mirr, Math.abs(c2.vx - c.vx), Math.abs(c2.vz + c.vz), Math.abs(c2.w + c.w)); } }
} else {
  const SU = SIM.SETUPS.race, race = SIM.makeRace(C, 'spa', (C2, tt, t) => Object.assign(SU.opts(C2, tt, 'cs', t), { numAI: 0, playerGrid: 1 })), T = race.track, I0 = 300, X0 = T.px[I0], Z0 = T.pz[I0];
  race.propFx = () => {}; const kinds = X.kinds().filter(k => { race.setProps([{ kind: k, x: X0, z: Z0, yaw: 0, col: 0, i: I0 }], null); return race.props.length > 0; });
  globalThis.kindsDbg = kinds;
  for (let n = 0; n < N; n++) { const kind = kinds[(R() * kinds.length) | 0]; race.setProps([{ kind, x: X0, z: Z0, yaw: u(-Math.PI, Math.PI), col: 0, i: I0 }], null); const b = race.props[0], K = b.K;
    const S = carState(), c = car(S.id, S.pl, 'a'), ci = c.circles[(R() * c.circles.length) | 0], phi = u(-Math.PI, Math.PI), rho = (R() < 0.02 ? 0 : u(0.05, 0.99)) * (c.rad + K.rh);
    S.x = b.x - Math.cos(phi) * rho - Math.cos(S.h) * ci; S.z = b.z - Math.sin(phi) * rho - Math.sin(S.h) * ci; setup(c, S); c.y = b.y - K.h0;
    if (R() < 0.3) { const bs = u(0, 15), bd = u(-Math.PI, Math.PI); b.vx = bs * Math.cos(bd); b.vz = bs * Math.sin(bd); b.sleep = false; }
    const e0 = Ec(c), p0 = [cm(c) * c.vx, cm(c) * c.vz], v0 = [b.vx, b.vz]; A.n++;
    X.propCarHit(race, c, b);
    const parts = b.parts && b.dead ? b.parts : null;
    if (!fin(c.vx, c.vz, c.w, c.x, c.z, c.xgl || 0, c.csKc || 0, b.x, b.z, b.vx, b.vz, b.vy) || (parts && !parts.every(p => fin(p.vx, p.vz, p.vy, p.x, p.z)))) { A.nan++; if (A.nan < 3) console.log('NAN', kind, JSON.stringify(S)); continue; }
    if (c.vx === S.vx && c.vz === S.vz && c.w === S.w) continue; A.hit++;
    if (parts) { let m = 0, px = 0, pz = 0, e = 0; for (const p of parts) { m += p.K.m; px += p.K.m * p.vx; pz += p.K.m * p.vz; e += 0.5 * p.K.m * (p.vx * p.vx + p.vz * p.vz); }
      const e1 = Ec(c), dEc = e1 - e0, dE2 = e - 0.5 * m * (v0[0] * v0[0] + v0[1] * v0[1]), dE = dEc + dE2, Bk = A.byKind[kind] || (A.byKind[kind] = { hit: 0, carUp: 0, pairUp: 0, pairMax: 0 }); Bk.hit++;
      A.dP = Math.max(A.dP, Math.hypot(cm(c) * c.vx - p0[0] + px - m * v0[0], cm(c) * c.vz - p0[1] + pz - m * v0[1]));
      if (dEc > 1e-6) { A.carUp++; Bk.carUp++; if (Math.hypot(v0[0], v0[1]) < 1e-9) A.carUpRest++; if (dEc > A.carUpMax) A.carUpMax = dEc; }
      if (dE > 1e-6) { A.pairUp++; Bk.pairUp++; if (dE > Bk.pairMax) Bk.pairMax = dE; if (dE > A.pairUpMax) { A.pairUpMax = dE; A.ex = { key: kind + ' (sklad)', dE: r3(dE), dEavto: r3(dEc), dEstvar: r3(dE2), E0: Math.round(e0), id: S.id, m: r3(cm(c)), m2: r3(m), kosov: parts.length, v0: [r3(S.vx), r3(S.vz)], w0: r3(S.w), v1: [r3(c.vx), r3(c.vz)], w1: r3(c.w) }; } A.pairUpRel = Math.max(A.pairUpRel, dE / e0); } }
    else account(kind, c, e0, p0, K.m, v0, [b.vx, b.vz], S, { K: { m: K.m, rh: K.rh, kick: K.kick || 1.35 } }); }
}
console.log(JSON.stringify({ kaj: WHAT, cv: CV, n: A.n, hit: A.hit, nan: A.nan, dPmax: +A.dP.toExponential(2), avtoEgor: A.carUp, avtoEgorObMirujoci: A.carUpRest, avtoEgorMax_J: r3(A.carUpMax), parEgor: A.pairUp, parEgorMax_J: r3(A.pairUpMax), parEgorRelMax: +A.pairUpRel.toExponential(2), zrcaloMax: +A.mirr.toExponential(2) }));
console.log('dP po vrstah', JSON.stringify(A.dPk)); if (WHAT !== 'kos') console.log('vrste', JSON.stringify(globalThis.kindsDbg || null));
console.log('primer par', JSON.stringify(A.ex)); console.log('primer mirujoca', JSON.stringify(A.exRest));
console.log(Object.keys(A.byKind).map(k => k + ' ' + JSON.stringify(A.byKind[k])).join('\n'));
