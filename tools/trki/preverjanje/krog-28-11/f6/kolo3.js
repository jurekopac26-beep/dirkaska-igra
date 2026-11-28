'use strict';
// fizika-6, krog 28. 11.: LASTNO VRTENJE KOLESA povoženega kolesarja po zadetku (_runBikeR prek Traffic._hitVeh, Realistična, cv 6).
// Prizori so isti kot v ../../krog-27-11/f6/kolo1.js (EN klic na naključnem prekritju; avto se lahko vrti do 9 rad/s in drsi do 0,6 rad;
// kolo vozi 0 do 9 m/s ali stoji), le da je vsak klic kolesar (pešca ni), zato števci z dnevniki kolo1 niso primerljivi po vrsticah.
// Meri po legi dotika glede na kolo (zadaj, spredaj: sunek vzdolž kolesa; bok: sunek počez):
//   wPovp, wMax          vrtenje kolesa po zadetku (rad/s)
//   EsPovpJ, EsMaxJ      energija tega vrtenja, 0,5 Ib w² (Ib po formuli igre: m (d² + š²) / 12)
//   parBrez, parBrezMaxJ energija para BREZ vrtenja kolesa (gibanje in vrtenje avta, gibanje kolesa) zraste za več kot 0,001 J
//   parZ, parZMaxJ       energija para Z vrtenjem kolesa zraste za več kot 0,001 J
//   neplacano            vrtenje kolesa je vredno več, kot je par pri dotiku izgubil (isto kot parZ, če par brez vrtenja ne pridobi)
//   poSunku              vrtenje se ujema s sunkom: w = -rnb J / Ib (na 1e-9 rad/s; rnb je ročica sunka okoli težišča kolesa)
//   neZapira: n, zVrtenjem, wMax, EsMaxJ   dotik se ne zapira (avto počasnejši od kolesa pred sabo), kolo se vseeno zavrti
// Jedro je instrumentirano v pomnilniku, drevo ostane nedotaknjeno.
// Zagon: node kolo3.js                          to drevo (N=40000 SEED=3; kolo vozi 0 do 9 m/s)
//        BV=0 node kolo3.js                     kolo stoji
//        TRKI_SNAP=<drevo pred> node kolo3.js   drevo pred spremembo (git worktree add --detach <mapa> 666d326)
const path = require('path');
const { SNAP, loadInst, rng } = require('../../krog-25-11/fizika/lib.js');
const A = '      if (!c.air) c.csKc = clamp((c.csKc || 0) + (R() - 0.5) * 0.24';
const { C, SIM } = loadInst(SNAP, [[A, '      globalThis.__BK = { vn, k, sp, Ib, mb, rnb: rbx * nz - rbz * nx, J: (Px - mb * sh * sd * k) * nx + (Pz + mb * ch * sd * k) * nz, cn: nx * Math.cos(v.h) + nz * Math.sin(v.h), lb: rbx * Math.cos(v.h) + rbz * Math.sin(v.h) };\n' + A]]);
C.setTest({ cv: 6 });
const N = +(process.env.N || 40000), R = rng(+(process.env.SEED || 3)), u = (a, b) => a + (b - a) * R(), r3 = (x) => +x.toFixed(3);
function ovalPts(L, Rr) { const p = [], r = Math.PI / 180; for (let x = 0; x < L; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([L + Rr * Math.cos(a * r), Rr + Rr * Math.sin(a * r)]); for (let x = L; x > 0; x -= 100) p.push([x, 2 * Rr]); for (let a = 90; a < 270; a += 15) p.push([Rr * Math.cos(a * r), Rr + Rr * Math.sin(a * r)]); return p; }
const T = new C.Track({ id: 'predmeti-krog', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50 });
const ids = C.MODELS.filter((m) => !m.trailer).map((m) => m.id), races = {};
function raceOf(id) { if (races[id]) return races[id]; Math.random = SIM.seeded(1); const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: C.MODELS.find((m) => m.id === id), assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs', endless: true }); race.start(); race.tf.win.dens = 0; for (const q of race.tf.veh) q.off = true; return (races[id] = race); }
const mk = () => ({ n: 0, wSum: 0, wMax: 0, esSum: 0, esMax: 0, parBrez: 0, parBrezMax: 0, parZ: 0, parZMax: 0, neplacano: 0, poSunku: 0, naj: null });
const S = { zadaj: mk(), spredaj: mk(), bok: mk() }, NZ = { n: 0, zVrtenjem: 0, wMax: 0, EsMaxJ: 0 };
let klicev = 0, zadetkov = 0, nan = 0;
for (let n = 0; n < N; n++) {
  const id = ids[Math.floor(R() * ids.length)], race = raceOf(id), P = race.player, tf = race.tf, bike = n % 2 === 0;
  const s0 = 150 * T.ds + 30, ma = P.m.mass, Ia = P.I;
  const sp = Math.exp(u(Math.log(2.6), Math.log(90))), hd = u(-Math.PI, Math.PI), w = R() < 0.4 ? 0 : R() < 0.5 ? u(-3, 3) : u(-9, 9);
  const set = (x, z, h) => { P.place(x, z, h); const sl = u(-0.6, 0.6) * (R() < 0.5 ? 0 : 1); P.vx = sp * Math.cos(h + sl); P.vz = sp * Math.sin(h + sl); P.w = w; P.xgl = 0; P.csKc = 0; P.cSx = 0; P.cSz = 0; P.air = 0; P.rl = null; P.dmg = 0; P.hitCar = 0; P.fuelKg = 0; };
  const ke = () => 0.5 * ma * (P.vx * P.vx + P.vz * P.vz) + 0.5 * Ia * P.w * P.w;
  globalThis.__BK = null; klicev++;
  const veh = tf._veh(1, 4, s0, 4); veh.off = true; tf._winPlace(veh, s0, 0); veh.v = process.env.BV != null ? +process.env.BV : u(0, 9); tf._pose(veh, 0); veh.st = 0; veh.nc = 0;
  const reach = (Math.hypot(P.m.len, P.m.wid) + Math.hypot(veh.len, veh.wid)) * 0.5, r = u(0.2, 1) * reach, th = u(-Math.PI, Math.PI);
  set(veh.x + r * Math.cos(th), veh.z + r * Math.sin(th), hd);
  const e0 = ke(), b0 = [veh.vx || 0, veh.vz || 0], mb = veh.mass, w0 = veh.w || 0;
  tf._hitVeh(P, veh);
  { const k = tf.veh.indexOf(veh); if (k >= 0) tf.veh.splice(k, 1); if (veh.rider) { const j = tf.ped.indexOf(veh.rider); if (j >= 0) tf.ped.splice(j, 1); } }
  const b = globalThis.__BK; if (!veh.rider || !b) continue;   // (ni bil povožen: drug primer ali brez dotika)
  zadetkov++;
  if (![P.vx, P.vz, P.w, veh.vx, veh.vz, veh.w].every(Number.isFinite)) { nan++; continue; }
  const Es = 0.5 * b.Ib * (veh.w * veh.w - w0 * w0), dBrez = ke() - e0 + 0.5 * mb * (veh.vx * veh.vx + veh.vz * veh.vz - b0[0] * b0[0] - b0[1] * b0[1]), dZ = dBrez + Es, aw = Math.abs(veh.w);
  if (!(b.vn > 0)) { NZ.n++; if (veh.w !== 0) NZ.zVrtenjem++; if (aw > NZ.wMax) NZ.wMax = r3(aw); if (Es > NZ.EsMaxJ) NZ.EsMaxJ = r3(Es); continue; }
  const s = S[Math.abs(b.cn) < Math.SQRT1_2 ? 'bok' : b.lb < 0 ? 'zadaj' : 'spredaj'];
  s.n++; s.wSum += aw; if (aw > s.wMax) s.wMax = aw; s.esSum += Es; if (Es > s.esMax) s.esMax = Es;
  if (dBrez > 1e-3) { s.parBrez++; if (dBrez > s.parBrezMax) s.parBrezMax = dBrez; }
  if (dZ > 1e-3) { s.parZ++; if (dZ > s.parZMax) { s.parZMax = dZ; s.naj = { id, v0: r3(sp), w0: r3(w), vn: r3(b.vn), k: r3(b.k), kolo0: [r3(b0[0]), r3(b0[1])], wKolo: r3(veh.w), EsJ: r3(Es), dBrezJ: r3(dBrez), dZJ: r3(dZ) }; } }
  if (Es > Math.max(0, -dBrez) + 1e-3) s.neplacano++;
  if (Math.abs(veh.w - w0 + b.rnb * b.J / b.Ib) < 1e-9) s.poSunku++;
}
console.log('klicev', klicev, 'zadetkov', zadetkov, 'nan', nan);
for (const k of Object.keys(S)) { const s = S[k];
  console.log(k.padEnd(8), JSON.stringify({ zapira: s.n, wPovp: r3(s.wSum / (s.n || 1)), wMax: r3(s.wMax), EsPovpJ: r3(s.esSum / (s.n || 1)), EsMaxJ: r3(s.esMax), parBrez: s.parBrez, parBrezMaxJ: r3(s.parBrezMax), parZ: s.parZ, parZMaxJ: r3(s.parZMax), neplacano: s.neplacano, poSunku: s.poSunku, najPar: s.naj })); }
console.log('neZapira', JSON.stringify(NZ));
