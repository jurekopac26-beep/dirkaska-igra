'use strict';
// fizika-6, krog 28. 11.: lastno vrtenje kolesa povoženega kolesarja v Realistični (cv 6), PRVI dotik kot v igri, po hitrosti zbliževanja.
// Prizori in vrstni red naključnih števil so isti kot v ../../krog-27-11/f6/kolo2.js (avto se kolesu približa po korakih 1/120 s, pred dotikom
// se ne vrti, zdrs do 0,6 rad, kolo stoji ali vozi 2-9 m/s); šteje pa se samo vrtenje kolesa (90 kg, vztrajnostni moment Ib iz jedra).
// Razredi po hitrosti zbliževanja (km/h): do 30, 30-60, 60-120, 120-200, nad 200. V vsakem:
//   zapira                dotiki, ki se zapirajo (vn > 0)
//   wPovp, wMed, w90, wMax  velikost vrtenja kolesa po zadetku (rad/s): povprečje, mediana, 90. percentil, največ
//   rocicaPovp            povprečna ročica sunka okoli središča kolesa (m)
//   EsPovpJ, EsMaxJ       energija lastnega vrtenja kolesa (J)
//   delezIzgube           povprečni delež energije, ki jo par izgubi brez vrtenja kolesa, ki gre v vrtenje kolesa
//   parZ, parZMaxJ        energija para Z vrtenjem kolesa zraste za več kot 1 J
//   neplacano             vrtenje kolesa je večje od tega, kar par izgubi drugje
//   poSunku               vrtenje je enako navoru sunka (-rnb * J / Ib) na 1e-9
//   mirujePovpS, mirujeMaxS  čas, da vrtenje pade pod 0,25 rad/s (upad exp(-2,2 t) iz jedra)
// neZapira {n, zVrtenjem, wMax}: dotiki, ki se ne zapirajo, in koliko jih kolesu vseeno da vrtenje.
// Jedro je instrumentirano v pomnilniku, drevo ostane nedotaknjeno.
// Zagon: node kolo4.js (N=12000 SEED=3)   to drevo;   TRKI_SNAP=<drevo pred> node kolo4.js   drevo pred spremembo (git worktree add --detach <mapa> 666d326)
const { SNAP, loadInst, rng } = require('../../krog-25-11/fizika/lib.js');
const A = '      if (!c.air) c.csKc = clamp((c.csKc || 0) + (R() - 0.5) * 0.24';
const { C, SIM } = loadInst(SNAP, [[A, '      globalThis.__BK = { vn, k, sp, Ib, mb, rnb: rbx * nz - rbz * nx, J: (Px - mb * sh * sd * k) * nx + (Pz + mb * ch * sd * k) * nz };\n' + A]]);
C.setTest({ cv: 6 });
const E = process.env, N = +(E.N || 12000), R = rng(+(E.SEED || 3)), u = (a, b) => a + (b - a) * R(), r3 = (x) => +x.toFixed(3), DT = 1 / 120;
function ovalPts(L, Rr) { const p = [], r = Math.PI / 180; for (let x = 0; x < L; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([L + Rr * Math.cos(a * r), Rr + Rr * Math.sin(a * r)]); for (let x = L; x > 0; x -= 100) p.push([x, 2 * Rr]); for (let a = 90; a < 270; a += 15) p.push([Rr * Math.cos(a * r), Rr + Rr * Math.sin(a * r)]); return p; }
const T = new C.Track({ id: 'predmeti-krog', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50 });
const ids = C.MODELS.filter((m) => !m.trailer).map((m) => m.id), races = {};
function raceOf(id) { if (races[id]) return races[id]; Math.random = SIM.seeded(1); const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: C.MODELS.find((m) => m.id === id), assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs', endless: true }); race.start(); race.tf.win.dens = 0; for (const q of race.tf.veh) q.off = true; return (races[id] = race); }
const RAZ = [['do 30 km/h', 30], ['30-60 km/h', 60], ['60-120 km/h', 120], ['120-200 km/h', 200], ['nad 200 km/h', Infinity]];
const S = RAZ.map(() => ({ zapira: 0, w: [], roc: 0, es: 0, esMax: 0, del: 0, delN: 0, parZ: 0, parZMax: 0, nepl: 0, poS: 0 })), NZ = { n: 0, zVrtenjem: 0, wMax: 0 };
let hits = 0, nan = 0;
for (let n = 0; n < N; n++) {
  const id = ids[Math.floor(R() * ids.length)], race = raceOf(id), P = race.player, tf = race.tf;
  const s0 = 150 * T.ds + 30, ma = P.m.mass, Ia = P.I, cl = n % 3, ride = (n >> 2) % 2;
  const sp = Math.exp(u(Math.log(2.6), Math.log(90))), va = u(-Math.PI, Math.PI), sl = cl === 0 ? 0 : cl === 1 ? u(-0.3, 0.3) : (R() < 0.5 ? -1 : 1) * u(0.3, 0.6), h = va - sl;
  const veh = tf._veh(1, 4, s0, 4); veh.off = true; tf._winPlace(veh, s0, 0); veh.v = ride ? u(2, 9) : 0; tf._pose(veh, 0); veh.st = 0; veh.nc = 0;
  const bvx = veh.vx || 0, bvz = veh.vz || 0, mb = veh.mass, vx = sp * Math.cos(va), vz = sp * Math.sin(va), rx = vx - bvx, rz = vz - bvz, rl = Math.hypot(rx, rz), w0 = veh.w || 0;
  const drop = () => { const k = tf.veh.indexOf(veh); if (k >= 0) tf.veh.splice(k, 1); if (veh.rider) { const j = tf.ped.indexOf(veh.rider); if (j >= 0) tf.ped.splice(j, 1); } };
  if (rl < 1) { drop(); continue; }
  const ux = rx / rl, uz = rz / rl, reach = (Math.hypot(P.m.len, P.m.wid) + Math.hypot(veh.len, veh.wid)) * 0.5, D = reach + 0.5, lat = u(-0.9, 0.9) * reach;
  let x = veh.x - ux * D - uz * lat, z = veh.z - uz * D + ux * lat, hit = false; const M = Math.ceil((2 * D + 1) / (rl * DT));
  globalThis.__BK = null;
  for (let k = 0; k < M && !hit; k++) {
    P.place(x, z, h); P.vx = vx; P.vz = vz; P.w = 0; P.xgl = 0; P.csKc = 0; P.cSx = 0; P.cSz = 0; P.air = 0; P.rl = null; P.dmg = 0; P.hitCar = 0; P.fuelKg = 0;
    tf._hitVeh(P, veh); if (veh.rider) hit = true; else { if (P.vx !== vx || P.vz !== vz) { hit = true; globalThis.__BK = null; } x += rx * DT; z += rz * DT; }
  }
  if (!hit || !globalThis.__BK) { drop(); continue; }
  hits++; const b = globalThis.__BK, w1 = veh.w || 0;
  if (![P.vx, P.vz, P.w, veh.vx, veh.vz, w1].every(Number.isFinite)) { nan++; drop(); continue; }
  const v1 = Math.hypot(P.vx, P.vz), dBrez = 0.5 * ma * (v1 * v1 - sp * sp) + 0.5 * Ia * P.w * P.w + 0.5 * mb * (veh.vx * veh.vx + veh.vz * veh.vz - bvx * bvx - bvz * bvz);
  const Es = 0.5 * b.Ib * (w1 * w1 - w0 * w0), aw = Math.abs(w1 - w0);
  if (!(b.vn > 0)) { NZ.n++; if (aw > 1e-12) { NZ.zVrtenjem++; if (aw > NZ.wMax) NZ.wMax = aw; } drop(); continue; }
  const s = S[RAZ.findIndex((q) => rl * 3.6 < q[1])]; s.zapira++; s.w.push(aw); s.roc += Math.abs(b.rnb); s.es += Es; if (Es > s.esMax) s.esMax = Es;
  if (dBrez < -1) { s.del += Es / -dBrez; s.delN++; }
  if (dBrez + Es > 1) { s.parZ++; if (dBrez + Es > s.parZMax) s.parZMax = dBrez + Es; }
  if (Es > Math.max(0, -dBrez) + 1e-3) s.nepl++;
  if (Math.abs(w1 - w0 + b.rnb * b.J / b.Ib) < 1e-9) s.poS++;
  drop();
}
console.log('prizorov', N, 'zadetkov', hits, 'nan', nan);
const mir = (w) => (w > 0.25 ? Math.log(w / 0.25) / 2.2 : 0);
RAZ.forEach((q, i) => { const s = S[i], w = s.w.sort((a, b) => a - b), n = w.length, at = (f) => (n ? w[Math.min(n - 1, Math.floor(f * n))] : 0), sum = w.reduce((a, c) => a + c, 0);
  console.log(q[0].padEnd(13), JSON.stringify({ zapira: n, wPovp: r3(n ? sum / n : 0), wMed: r3(at(0.5)), w90: r3(at(0.9)), wMax: r3(n ? w[n - 1] : 0), rocicaPovp: r3(n ? s.roc / n : 0), EsPovpJ: r3(n ? s.es / n : 0), EsMaxJ: r3(s.esMax),
    delezIzgube: r3(s.delN ? s.del / s.delN : 0), parZ: s.parZ, parZMaxJ: r3(s.parZMax), neplacano: s.nepl, poSunku: s.poS, mirujePovpS: r3(n ? w.reduce((a, c) => a + mir(c), 0) / n : 0), mirujeMaxS: r3(n ? mir(w[n - 1]) : 0) })); });
NZ.wMax = r3(NZ.wMax); console.log('neZapira'.padEnd(13), JSON.stringify(NZ));
