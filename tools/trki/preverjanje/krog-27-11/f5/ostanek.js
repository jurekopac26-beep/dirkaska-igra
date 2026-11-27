'use strict';
// fizika-5, krog 27. 11.: kaj ostane po varovalu energije (Realistična, cv 6). Vzorčenje je do zadnjega klica enako kot v
// ../../krog-25-11/fizika/pred2.js (isti N in SEED dasta iste primere); doda razcep preostalih primerov:
//   kup (predmet, ki se razleti na kose) / cel predmet;
//   pri kupu energija para brez stranskega razleta kosov (eb iz propCarHit: to, kar avto plača) in energija razleta posebej;
//   pri gibajočem predmetu: ali ga je po udarcu ustavila omejitev hitrosti (min(K.vmax || 18, 0,72 |v avta| + 2)).
// Zagon (v tej mapi): N=120000 SEED=5 node ostanek.js
const { SNAP, loadInst, rng } = require('../../krog-25-11/fizika/lib.js');
const { C, SIM, handling } = loadInst(process.env.ROOT || SNAP, [
  ['function propCarHit(race, c, b) {', 'globalThis.__X = { propCarHit: (r, c, b) => propCarHit(r, c, b), kinds: () => Object.keys(PROPK) };\n  function propCarHit(race, c, b) {'],
  ['propPush(c, -qx, -qz, rcx, rcz, eb); }', 'globalThis.__EB = eb; propPush(c, -qx, -qz, rcx, rcz, eb); }']]);
C.setTest({ cv: 6 });
const X = globalThis.__X, N = +(process.env.N || 120000), R = rng(+(process.env.SEED || 5)), u = (a, b) => a + (b - a) * R(), WMAX = 9;
const H = handling(C, 'cs'), ids = C.MODELS.filter(m => !m.trailer).map(m => m.id), cache = {};
const car = (id, pl) => cache[id + pl] || (cache[id + pl] = Object.assign(H.mkCar(id, { v: 0 }), { isPlayer: !!pl }));
function setup(c, S) { c.place(S.x, S.z, S.h); c.vx = S.vx; c.vz = S.vz; c.w = S.w; c.xgl = S.xgl || 0; c.xglT = S.xgl ? 0.5 : 0; c.csKc = 0; c.cSx = 0; c.cSz = 0; c.cSr = null; c.air = 0; c.rl = null; c.hitDebris = 0; c.dmg = 0; c.fuelKg = S.fuel || 0;
  c.dz = [0, 0, 0, 0]; c.cd = [0, 0, 0, 0]; c.dents = []; c.lost = {}; c.detach = []; c.flat = 0; }
const cm = (c) => c.m.mass + (c.fuelKg || 0), Ec = (c) => { const m = cm(c); return 0.5 * m * (c.vx * c.vx + c.vz * c.vz) + 0.5 * c.I * m / c.m.mass * c.w * c.w; }, r1 = (x) => +x.toFixed(1);
const SU = SIM.SETUPS.race, race = SIM.makeRace(C, 'spa', (C2, tt, t) => Object.assign(SU.opts(C2, tt, 'cs', t), { numAI: 0, playerGrid: 1 })), T = race.track, I0 = 300, X0 = T.px[I0], Z0 = T.pz[I0];
race.propFx = () => {}; const kinds = X.kinds().filter(k => { race.setProps([{ kind: k, x: X0, z: Z0, yaw: 0, col: 0, i: I0 }], null); return race.props.length > 0; });
const CL = {}, cls = (k) => CL[k] || (CL[k] = { zadetkov: 0, avtoGor: 0, avtoGorMaxJ: 0, avtoGorZasukHitreje: 0, parGor: 0, parGorMaxJ: 0, parBrezRazletaGor: 0, parBrezRazletaMaxJ: 0, razletMaxJ: 0, ustavilaOmejitev: 0, vrste: {} });
for (let n = 0; n < N; n++) { const kind = kinds[(R() * kinds.length) | 0]; race.setProps([{ kind, x: X0, z: Z0, yaw: u(-Math.PI, Math.PI), col: 0, i: I0 }], null); const b = race.props[0], K = b.K;
  const id = ids[(R() * ids.length) | 0], sp = Math.exp(u(Math.log(1), Math.log(80))), dir = u(-Math.PI, Math.PI), wr = R();
  const S = { id, pl: R() < 0.3, h: u(-Math.PI, Math.PI), vx: sp * Math.cos(dir), vz: sp * Math.sin(dir), w: wr < 0.35 ? 0 : wr < 0.7 ? u(-Math.min(3, WMAX), Math.min(3, WMAX)) : u(-WMAX, WMAX), xgl: R() < 0.4 ? u(0, 1) : 0, fuel: R() < 0.3 ? u(0, 80) : 0 };
  const c = car(S.id, S.pl), ci = c.circles[(R() * c.circles.length) | 0], phi = u(-Math.PI, Math.PI), rho = u(0.05, 0.99) * (c.rad + K.rh);
  S.x = b.x - Math.cos(phi) * rho - Math.cos(S.h) * ci; S.z = b.z - Math.sin(phi) * rho - Math.sin(S.h) * ci; setup(c, S); c.y = b.y - K.h0;
  const mov = !K.breaks && R() < 0.15; if (mov) { const bs = u(0, 15), bd = u(-Math.PI, Math.PI); b.vx = bs * Math.cos(bd); b.vz = bs * Math.sin(bd); b.sleep = false; }
  const e0 = Ec(c), v0 = [b.vx, b.vz];
  globalThis.__EB = null; X.propCarHit(race, c, b);
  const parts = b.parts && b.dead ? b.parts : null, things = parts ? parts.map(p => [p.K.m, p.vx, p.vz]) : [[K.m, b.vx, b.vz]];
  if (![c.vx, c.vz, c.w, b.vx, b.vz].every(Number.isFinite)) continue;
  if (c.vx === S.vx && c.vz === S.vz && c.w === S.w) continue;
  const key = (mov ? 'giblje' : S.w === 0 ? 'stoji, w=0' : Math.abs(S.w) <= 3 ? 'stoji, |w|<=3' : 'stoji, |w|>3') + (mov ? (S.w === 0 ? ', w=0' : ', avto se vrti') : parts ? ', kup' : ', cel'), Q = cls(key); Q.zadetkov++;
  const dEc = Ec(c) - e0, eb0 = 0.5 * K.m * (v0[0] * v0[0] + v0[1] * v0[1]), eb1 = things.reduce((a, t) => a + 0.5 * t[0] * (t[1] * t[1] + t[2] * t[2]), 0), dE = dEc + eb1 - eb0;
  if (dEc > 1e-6) { Q.avtoGor++; Q.avtoGorMaxJ = Math.max(Q.avtoGorMaxJ, dEc); if (Math.abs(c.w) > Math.abs(S.w)) Q.avtoGorZasukHitreje++; }
  if (dE > 1e-6) { Q.parGor++; Q.parGorMaxJ = Math.max(Q.parGorMaxJ, dE); Q.vrste[kind] = (Q.vrste[kind] || 0) + 1;
    if (mov) { const cap = Math.min(K.vmax || 18, 0.72 * sp + 2), hs = Math.hypot(b.vx, b.vz); if (Math.abs(hs - cap) < 1e-9 && hs < Math.hypot(v0[0], v0[1])) Q.ustavilaOmejitev++; } }
  if (parts && globalThis.__EB != null) { const brez = dEc + globalThis.__EB, razlet = eb1 - eb0 - globalThis.__EB; Q.razletMaxJ = Math.max(Q.razletMaxJ, razlet);
    if (brez > 1e-6) { Q.parBrezRazletaGor++; Q.parBrezRazletaMaxJ = Math.max(Q.parBrezRazletaMaxJ, brez); } }
}
for (const k of Object.keys(CL).sort()) { const Q = CL[k]; for (const f of ['avtoGorMaxJ', 'parGorMaxJ', 'parBrezRazletaMaxJ', 'razletMaxJ']) Q[f] = r1(Q[f]);
  if (!/kup/.test(k)) { delete Q.parBrezRazletaGor; delete Q.parBrezRazletaMaxJ; delete Q.razletMaxJ; } if (!/giblje/.test(k)) delete Q.ustavilaOmejitev; console.log(k, JSON.stringify(Q)); }
