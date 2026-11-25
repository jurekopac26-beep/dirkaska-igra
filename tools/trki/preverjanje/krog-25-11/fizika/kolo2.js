'use strict';
// kolesar v Realisticni (cv 6), PRVI dotik kot v igri: avto se kolesu pribliza po korakih 1/120 s (v sistemu kolesa), Traffic._hitVeh vsak korak, do povozenja.
// Meri: hitrost in energijo avta, energijo para avto + kolo (90 kg), delez prvih dotikov, ki se ne zapirajo (vn <= 0: samo stranski sunek).
// Nic v repozitoriju: jedro v pomnilniku (zapis vmesnih vrednosti _runBikeR v globalThis.__BK).
const { SNAP, loadInst, rng } = require('./lib.js');
const { C, SIM } = loadInst(SNAP, [
  ['      kTake(c, Px, Pz, rax, raz, ma, Ia, K, null);\n      if (!c.air) c.csKc = clamp((c.csKc || 0) + (R() - 0.5) * 0.24', '      globalThis.__BK = { nx, nz, vn, k, sd, lx, lz, ma, mb, sp, kick: [mb * sh * sd * k, -mb * ch * sd * k], push: [Px - mb * sh * sd * k, Pz + mb * ch * sd * k] };\n      kTake(c, Px, Pz, rax, raz, ma, Ia, K, null);\n      if (!c.air) c.csKc = clamp((c.csKc || 0) + (R() - 0.5) * 0.24']]);
C.setTest({ cv: 6 });
const E = process.env, N = +(E.N || 12000), R = rng(+(E.SEED || 3)), u = (a, b) => a + (b - a) * R(), r3 = (x) => +x.toFixed(3), DT = 1 / 120;
function ovalPts(L, Rr) { const p = [], r = Math.PI / 180; for (let x = 0; x < L; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([L + Rr * Math.cos(a * r), Rr + Rr * Math.sin(a * r)]); for (let x = L; x > 0; x -= 100) p.push([x, 2 * Rr]); for (let a = 90; a < 270; a += 15) p.push([Rr * Math.cos(a * r), Rr + Rr * Math.sin(a * r)]); return p; }
const T = new C.Track({ id: 'predmeti-krog', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50 });
const ids = C.MODELS.filter((m) => !m.trailer).map((m) => m.id), races = {};
function raceOf(id) { if (races[id]) return races[id]; Math.random = SIM.seeded(1); const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: C.MODELS.find((m) => m.id === id), assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs', endless: true }); race.start(); race.tf.win.dens = 0; for (const q of race.tf.veh) q.off = true; return (races[id] = race); }
const mk = () => ({ scen: 0, hit: 0, nan: 0, neZapira: 0, vGor001: 0, vGor01: 0, dvMax: 0, eAvtoGor: 0, eAvtoMaxJ: 0, eParGor: 0, eParMaxJ: 0, worst: null });
const S = { 'brez zdrsa, kolo stoji': mk(), 'brez zdrsa, kolo vozi': mk(), 'zdrs do 0.3, kolo stoji': mk(), 'zdrs do 0.3, kolo vozi': mk(), 'zdrs 0.3-0.6, kolo stoji': mk(), 'zdrs 0.3-0.6, kolo vozi': mk() };
for (let n = 0; n < N; n++) {
  const id = ids[Math.floor(R() * ids.length)], race = raceOf(id), P = race.player, tf = race.tf;
  const s0 = 150 * T.ds + 30, ma = P.m.mass, Ia = P.I, cl = n % 3, ride = (n >> 2) % 2;
  const sp = Math.exp(u(Math.log(2.6), Math.log(90))), va = u(-Math.PI, Math.PI), sl = cl === 0 ? 0 : cl === 1 ? u(-0.3, 0.3) : (R() < 0.5 ? -1 : 1) * u(0.3, 0.6), h = va - sl;
  const key = (cl === 0 ? 'brez zdrsa' : cl === 1 ? 'zdrs do 0.3' : 'zdrs 0.3-0.6') + (ride ? ', kolo vozi' : ', kolo stoji'), s = S[key]; s.scen++;
  const veh = tf._veh(1, 4, s0, 4); veh.off = true; tf._winPlace(veh, s0, 0); veh.v = ride ? u(2, 9) : 0; tf._pose(veh, 0); veh.st = 0; veh.nc = 0;
  const bvx = veh.vx || 0, bvz = veh.vz || 0, mb = veh.mass, vx = sp * Math.cos(va), vz = sp * Math.sin(va), rx = vx - bvx, rz = vz - bvz, rl = Math.hypot(rx, rz);
  const drop = () => { const k = tf.veh.indexOf(veh); if (k >= 0) tf.veh.splice(k, 1); if (veh.rider) { const j = tf.ped.indexOf(veh.rider); if (j >= 0) tf.ped.splice(j, 1); } };
  if (rl < 1) { drop(); continue; }
  const ux = rx / rl, uz = rz / rl, reach = (Math.hypot(P.m.len, P.m.wid) + Math.hypot(veh.len, veh.wid)) * 0.5, D = reach + 0.5, lat = u(-0.9, 0.9) * reach;
  let x = veh.x - ux * D - uz * lat, z = veh.z - uz * D + ux * lat, hit = false; const M = Math.ceil((2 * D + 1) / (rl * DT));
  globalThis.__BK = null;
  for (let k = 0; k < M && !hit; k++) {
    P.place(x, z, h); P.vx = vx; P.vz = vz; P.w = 0; P.xgl = 0; P.csKc = 0; P.cSx = 0; P.cSz = 0; P.air = 0; P.rl = null; P.dmg = 0; P.hitCar = 0; P.fuelKg = 0;
    tf._hitVeh(P, veh); if (veh.rider) hit = true; else { if (P.vx !== vx || P.vz !== vz) { hit = true; s.drugo = (s.drugo || 0) + 1; globalThis.__BK = null; } x += rx * DT; z += rz * DT; }
  }
  if (!hit || !globalThis.__BK) { drop(); continue; }
  s.hit++; const b = globalThis.__BK;
  if (![P.vx, P.vz, P.w, veh.vx, veh.vz].every(Number.isFinite)) { s.nan++; drop(); continue; }
  const v1 = Math.hypot(P.vx, P.vz), dv = v1 - sp, eA0 = 0.5 * ma * sp * sp, eA1 = 0.5 * ma * v1 * v1 + 0.5 * Ia * P.w * P.w, dEa = eA1 - eA0;
  const dEp = dEa + 0.5 * mb * (veh.vx * veh.vx + veh.vz * veh.vz) - 0.5 * mb * (bvx * bvx + bvz * bvz);
  if (!(b.vn > 0)) s.neZapira++;
  if (dv > 0.01) s.vGor001++; if (dv > 0.1) s.vGor01++;
  if (dv > s.dvMax) { s.dvMax = dv; s.worst = { id, masa: ma, v0: r3(sp), v1: r3(v1), zdrs: r3(sl), vn: r3(b.vn), k: r3(b.k), n: [r3(b.nx), r3(b.nz)], lok: [r3(b.lx), r3(b.lz)], sunekN: r3(Math.hypot(b.push[0], b.push[1])), sunekStran: r3(Math.hypot(b.kick[0], b.kick[1])), dEavtoJ: r3(dEa), dEparJ: r3(dEp), w1: r3(P.w) }; }
  if (dEa > 1) { s.eAvtoGor++; if (dEa > s.eAvtoMaxJ) s.eAvtoMaxJ = dEa; }
  if (dEp > 1) { s.eParGor++; if (dEp > s.eParMaxJ) s.eParMaxJ = dEp; }
  drop();
}
for (const k of Object.keys(S)) { const s = S[k]; s.dvMax = r3(s.dvMax); s.eAvtoMaxJ = r3(s.eAvtoMaxJ); s.eParMaxJ = r3(s.eParMaxJ); console.log(k.padEnd(26), JSON.stringify(s)); }
