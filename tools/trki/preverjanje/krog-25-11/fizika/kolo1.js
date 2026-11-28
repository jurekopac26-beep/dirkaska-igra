'use strict';
// kolesar (_runBikeR prek Traffic._hitVeh) in pesec (_hitPedR) v Realisticni (cv 6): NaN, energija avta, hitrost avta, gibalna kolicina avto + kolo
// Nic v repozitoriju: jedro v pomnilniku (K = KC za neposreden klic _hitPedR).
const { SNAP, loadInst, rng } = require('./lib.js');
const { C, SIM } = loadInst(SNAP, [['_hitPedR(c, p, K, rx, rz) {', '_hitPedR(c, p, K, rx, rz) { K = K || KC;'],
  ['      kTake(c, Px, Pz, rax, raz, ma, Ia, K, null);\n      if (!c.air) c.csKc = clamp((c.csKc || 0) + (R() - 0.5) * 0.24', '      globalThis.__BK = { nx, nz, vn, Px, Pz, k, sd, lx, lz, rax, raz, ma, pm: K.pm, bvx: v.vx, bvz: v.vz, sp };\n      kTake(c, Px, Pz, rax, raz, ma, Ia, K, null);\n      if (!c.air) c.csKc = clamp((c.csKc || 0) + (R() - 0.5) * 0.24']]);
C.setTest({ cv: 6 });
const N = +(process.env.N || 40000), R = rng(+(process.env.SEED || 3)), u = (a, b) => a + (b - a) * R(), r3 = (x) => +x.toFixed(3);
function ovalPts(L, Rr) { const p = [], r = Math.PI / 180; for (let x = 0; x < L; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([L + Rr * Math.cos(a * r), Rr + Rr * Math.sin(a * r)]); for (let x = L; x > 0; x -= 100) p.push([x, 2 * Rr]); for (let a = 90; a < 270; a += 15) p.push([Rr * Math.cos(a * r), Rr + Rr * Math.sin(a * r)]); return p; }
const T = new C.Track({ id: 'predmeti-krog', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50 });
const ids = C.MODELS.filter((m) => !m.trailer).map((m) => m.id), races = {};
function raceOf(id) { if (races[id]) return races[id]; Math.random = SIM.seeded(1); const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: C.MODELS.find((m) => m.id === id), assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs', endless: true }); race.start(); race.tf.win.dens = 0; for (const q of race.tf.veh) q.off = true; return (races[id] = race); }
const mk = () => ({ n: 0, hit: 0, nan: 0, eGor: 0, eMaxJ: 0, vGor: 0, dvMax: 0, dPmax: 0, worst: null });
const S = { 'kolo w=0': mk(), 'kolo |w|<=3': mk(), 'kolo |w|>3': mk(), 'pesec w=0': mk(), 'pesec |w|<=3': mk(), 'pesec |w|>3': mk() };
const cls = (w) => w === 0 ? 'w=0' : Math.abs(w) <= 3 ? '|w|<=3' : '|w|>3';
for (let n = 0; n < N; n++) {
  const id = ids[Math.floor(R() * ids.length)], race = raceOf(id), P = race.player, tf = race.tf, bike = n % 2 === 0;
  const s0 = 150 * T.ds + 30, ma = P.m.mass, Ia = P.I;
  const sp = Math.exp(u(Math.log(2.6), Math.log(90))), hd = u(-Math.PI, Math.PI), w = R() < 0.4 ? 0 : R() < 0.5 ? u(-3, 3) : u(-9, 9);
  const set = (x, z, h) => { P.place(x, z, h); const sl = u(-0.6, 0.6) * (R() < 0.5 ? 0 : 1); P.vx = sp * Math.cos(h + sl); P.vz = sp * Math.sin(h + sl); P.w = w; P.xgl = 0; P.csKc = 0; P.cSx = 0; P.cSz = 0; P.air = 0; P.rl = null; P.dmg = 0; P.hitCar = 0; P.fuelKg = 0; };
  const ke = () => 0.5 * ma * (P.vx * P.vx + P.vz * P.vz) + 0.5 * Ia * P.w * P.w;
  let key, c0, e0, bv0 = null, veh = null, ped = null;
  if (bike) {
    veh = tf._veh(1, 4, s0, 4); veh.off = true; tf._winPlace(veh, s0, 0); veh.v = process.env.BV != null ? +process.env.BV : u(0, 9); tf._pose(veh, 0); veh.st = 0; veh.nc = 0;
    const reach = (Math.hypot(P.m.len, P.m.wid) + Math.hypot(veh.len, veh.wid)) * 0.5, r = u(0.2, 1) * reach, th = u(-Math.PI, Math.PI);
    set(veh.x + r * Math.cos(th), veh.z + r * Math.sin(th), hd);
    key = 'kolo ' + cls(w); c0 = [P.vx, P.vz, P.w]; e0 = ke(); bv0 = [veh.vx || 0, veh.vz || 0, veh.mass];
    const imp = tf._hitVeh(P, veh);
    { const k = tf.veh.indexOf(veh); if (k >= 0) tf.veh.splice(k, 1); if (veh.rider) { const j = tf.ped.indexOf(veh.rider); if (j >= 0) tf.ped.splice(j, 1); } }
    S[key].n++; if (!veh.rider) continue;   // (ni bil povozen: drug primer ali brez dotika)
  } else {
    ped = tf._ped(Math.floor(R() * 3), s0, 1, 'walk');
    const hl = P.m.len / 2 + 0.22, hw = P.m.wid / 2 + 0.22, lx = u(-hl, hl), lz = u(-hw, hw);
    set(ped.x - (lx * Math.cos(hd) - lz * Math.sin(hd)), ped.z - (lx * Math.sin(hd) + lz * Math.cos(hd)), hd);
    key = 'pesec ' + cls(w); c0 = [P.vx, P.vz, P.w]; e0 = ke();
    tf._hitPedR(P, ped, null, ped.x - P.x, ped.z - P.z);
    { const j = tf.ped.indexOf(ped); if (j >= 0) tf.ped.splice(j, 1); }
    S[key].n++;
  }
  const s = S[key]; s.hit++;
  const vals = [P.vx, P.vz, P.w, P.x, P.z, P.dmg, P.csKc].concat(veh ? [veh.vx, veh.vz, veh.w, veh.x, veh.z, veh.rider.vx, veh.rider.vz] : [ped.vx, ped.vz, ped.x, ped.z]);
  if (!vals.every(Number.isFinite)) { s.nan++; if (s.nan < 3) console.log('NAN', key, id, JSON.stringify(vals)); continue; }
  const dE = ke() - e0, v1 = Math.hypot(P.vx, P.vz), dv = v1 - sp;
  if (dE > 1e-3) { s.eGor++; if (dE > s.eMaxJ) { s.eMaxJ = dE; s.worst = { id, masa: ma, v0: r3(sp), v1: r3(v1), w0: r3(c0[2]), w1: r3(P.w), dE: r3(dE) }; } }
  if (dv > 1e-9) { s.vGor++; if (dv > s.dvMax) { s.dvMax = dv; if (veh) s.worstV = Object.assign({ id, h: r3(P.h), v0: [r3(c0[0]), r3(c0[1])], v1: [r3(P.vx), r3(P.vz)], w0: r3(c0[2]), w1: r3(P.w), csKc: r3(P.csKc) }, JSON.parse(JSON.stringify(globalThis.__BK, (k, v) => typeof v === 'number' ? +v.toFixed(3) : v))); } }
  if (veh && globalThis.__BK) { const b = globalThis.__BK; const cat = b.vn > 0 ? 'zapira' : 'neZapira'; const o = (s.cat = s.cat || {})[cat] = (s.cat || {})[cat] || { n: 0, eGor: 0, eMaxJ: 0, vGor: 0, dvMax: 0 }; o.n++; if (dE > 1e-3) { o.eGor++; if (dE > o.eMaxJ) o.eMaxJ = r3(dE); } if (dv > 1e-9) { o.vGor++; if (dv > o.dvMax) o.dvMax = r3(dv); } }
  if (veh) { const dP = Math.hypot(ma * (P.vx - c0[0]) + bv0[2] * (veh.vx - bv0[0]), ma * (P.vz - c0[1]) + bv0[2] * (veh.vz - bv0[1])); if (dP > s.dPmax) s.dPmax = dP; }
  else { const dP = Math.hypot(ma * (P.vx - c0[0]) + 75 * ped.vx, ma * (P.vz - c0[1]) + 75 * ped.vz); if (dP > s.dPmax) s.dPmax = dP; }
}
for (const k of Object.keys(S)) { const s = S[k]; console.log(k.padEnd(14), JSON.stringify({ klicev: s.n, zadetkov: s.hit, nan: s.nan, avtoEgor: s.eGor, avtoEmaxJ: r3(s.eMaxJ), hitrostGor: s.vGor, dvMax: r3(s.dvMax), dPmax: +s.dPmax.toExponential(2), najhuje: s.worst, najHitrost: s.worstV, poZapiranju: s.cat })); }
