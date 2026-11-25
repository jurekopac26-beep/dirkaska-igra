'use strict';
// predmeti ob cesti: en klic propCarHit (cv 6), predmet STOJI (razen razreda »giblje«); energija in hitrost avta, energija para (predmet: samo vodoravno gibanje = spodnja meja)
const { SNAP, loadInst, rng } = require('./lib.js');
const { C, SIM, handling } = loadInst(process.env.ROOT || SNAP, [['function propCarHit(race, c, b) {', 'globalThis.__X = { propCarHit: (r, c, b) => propCarHit(r, c, b), kinds: () => Object.keys(PROPK) };\n  function propCarHit(race, c, b) {']]);
const CV = process.env.CV != null ? +process.env.CV : 6; C.setTest({ cv: CV });
const X = globalThis.__X, N = +(process.env.N || 120000), R = rng(+(process.env.SEED || 5)), u = (a, b) => a + (b - a) * R(), WMAX = +(process.env.WMAX || 9), XGL = process.env.XGL != null ? +process.env.XGL : -1;
const H = handling(C, 'cs'), ids = C.MODELS.filter(m => !m.trailer).map(m => m.id), cache = {};
const car = (id, pl) => cache[id + pl] || (cache[id + pl] = Object.assign(H.mkCar(id, { v: 0 }), { isPlayer: !!pl }));
function setup(c, S) { c.place(S.x, S.z, S.h); c.vx = S.vx; c.vz = S.vz; c.w = S.w; c.xgl = S.xgl || 0; c.xglT = S.xgl ? 0.5 : 0; c.csKc = 0; c.cSx = 0; c.cSz = 0; c.cSr = null; c.air = 0; c.rl = null; c.hitDebris = 0; c.dmg = 0; c.fuelKg = S.fuel || 0;
  c.dz = [0, 0, 0, 0]; c.cd = [0, 0, 0, 0]; c.dents = []; c.lost = {}; c.detach = []; c.flat = 0; }
const cm = (c) => c.m.mass + (c.fuelKg || 0), Ec = (c) => { const m = cm(c); return 0.5 * m * (c.vx * c.vx + c.vz * c.vz) + 0.5 * c.I * m / c.m.mass * c.w * c.w; }, r3 = (x) => +x.toFixed(3);
const SU = SIM.SETUPS.race, race = SIM.makeRace(C, 'spa', (C2, tt, t) => Object.assign(SU.opts(C2, tt, 'cs', t), { numAI: 0, playerGrid: 1 })), T = race.track, I0 = 300, X0 = T.px[I0], Z0 = T.pz[I0];
race.propFx = () => {}; const kinds = X.kinds().filter(k => { race.setProps([{ kind: k, x: X0, z: Z0, yaw: 0, col: 0, i: I0 }], null); return race.props.length > 0; });
const CL = {}, cls = (k) => CL[k] || (CL[k] = { hit: 0, avtoE: 0, avtoEmaxJ: 0, avtoErel: 0, dvMax: 0, parE: 0, parEmaxJ: 0, parErel: 0, ex: null, exV: null });
let nan = 0, n = 0;
for (; n < N; n++) { const kind = kinds[(R() * kinds.length) | 0]; race.setProps([{ kind, x: X0, z: Z0, yaw: u(-Math.PI, Math.PI), col: 0, i: I0 }], null); const b = race.props[0], K = b.K;
  const id = ids[(R() * ids.length) | 0], sp = Math.exp(u(Math.log(1), Math.log(80))), dir = u(-Math.PI, Math.PI), wr = R();
  const S = { id, pl: R() < 0.3, h: u(-Math.PI, Math.PI), vx: sp * Math.cos(dir), vz: sp * Math.sin(dir), w: wr < 0.35 ? 0 : wr < 0.7 ? u(-Math.min(3, WMAX), Math.min(3, WMAX)) : u(-WMAX, WMAX), xgl: XGL >= 0 ? XGL : R() < 0.4 ? u(0, 1) : 0, fuel: R() < 0.3 ? u(0, 80) : 0 };
  const c = car(S.id, S.pl), ci = c.circles[(R() * c.circles.length) | 0], phi = u(-Math.PI, Math.PI), rho = u(0.05, 0.99) * (c.rad + K.rh);
  S.x = b.x - Math.cos(phi) * rho - Math.cos(S.h) * ci; S.z = b.z - Math.sin(phi) * rho - Math.sin(S.h) * ci; setup(c, S); c.y = b.y - K.h0;
  const mov = !K.breaks && R() < 0.15; if (mov) { const bs = u(0, 15), bd = u(-Math.PI, Math.PI); b.vx = bs * Math.cos(bd); b.vz = bs * Math.sin(bd); b.sleep = false; }
  const e0 = Ec(c), v0 = [b.vx, b.vz], s0 = Math.hypot(S.vx, S.vz);
  X.propCarHit(race, c, b);
  const parts = b.parts && b.dead ? b.parts : null, things = parts ? parts.map(p => [p.K.m, p.vx, p.vz]) : [[K.m, b.vx, b.vz]];
  if (![c.vx, c.vz, c.w, c.x, c.z, c.csKc || 0, b.x, b.z, b.vx, b.vz, b.vy].every(Number.isFinite) || !things.every(t => Number.isFinite(t[1]) && Number.isFinite(t[2]))) { nan++; continue; }
  if (c.vx === S.vx && c.vz === S.vz && c.w === S.w) continue;
  const key = mov ? 'giblje' : S.w === 0 ? 'stoji, w=0' : Math.abs(S.w) <= 3 ? 'stoji, |w|<=3' : 'stoji, |w|>3', Q = cls(key); Q.hit++;
  const e1 = Ec(c), dEc = e1 - e0, eb0 = 0.5 * K.m * (v0[0] * v0[0] + v0[1] * v0[1]), eb1 = things.reduce((a, t) => a + 0.5 * t[0] * (t[1] * t[1] + t[2] * t[2]), 0), dE = dEc + eb1 - eb0, dv = Math.hypot(c.vx, c.vz) - s0;
  const info = () => ({ vrsta: kind, mPredmeta: K.m, avto: S.id, mAvta: r3(cm(c)), igralec: S.pl, E0: Math.round(e0), dEavto: r3(dEc), dEpar: r3(dE), v0: r3(s0), v1: r3(Math.hypot(c.vx, c.vz)), w0: r3(S.w), w1: r3(c.w), xgl: r3(S.xgl), predmetV1: r3(Math.hypot(b.vx, b.vz)) });
  if (dEc > 1e-6) { Q.avtoE++; Q.avtoErel = Math.max(Q.avtoErel, dEc / e0); if (dEc > Q.avtoEmaxJ) { Q.avtoEmaxJ = dEc; Q.ex = info(); } }
  if (dv > Q.dvMax) { Q.dvMax = dv; Q.exV = info(); }
  if (dE > 1e-6) { Q.parE++; Q.parEmaxJ = Math.max(Q.parEmaxJ, dE); Q.parErel = Math.max(Q.parErel, dE / (e0 + eb0)); }
}
console.log(JSON.stringify({ cv: CV, klicev: n, nan, wMax: WMAX, xgl: XGL }));
for (const k of Object.keys(CL).sort()) { const Q = CL[k]; console.log(k, JSON.stringify({ zadetkov: Q.hit, avtoEgor: Q.avtoE, avtoEmaxJ: r3(Q.avtoEmaxJ), avtoErelMax: +Q.avtoErel.toExponential(2), dvMax: r3(Q.dvMax), parEgor: Q.parE, parEmaxJ: r3(Q.parEmaxJ), parErelMax: +Q.parErel.toExponential(2) })); console.log('   najvec E', JSON.stringify(Q.ex)); console.log('   najvec dv', JSON.stringify(Q.exV)); }
