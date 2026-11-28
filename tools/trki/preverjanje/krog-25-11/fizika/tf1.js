'use strict';
// promet »Po masah«: neposreden klic Traffic._hitVeh (cv 6) na nakljucnih prekrivajocih se parih avto - vozilo; gibalna kolicina, energija, NaN
const { SNAP, load, rng } = require('./lib.js');
const { C, SIM } = load(process.env.ROOT || SNAP);
const TF = process.env.TF != null ? +process.env.TF : null;
C.setTest({ cv: 6, tf: TF });
const N = +(process.env.N || 20000), R = rng(+(process.env.SEED || 3)), u = (a, b) => a + (b - a) * R();
function ovalPts(L, Rr) { const p = [], r = Math.PI / 180; for (let x = 0; x < L; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([L + Rr * Math.cos(a * r), Rr + Rr * Math.sin(a * r)]); for (let x = L; x > 0; x -= 100) p.push([x, 2 * Rr]); for (let a = 90; a < 270; a += 15) p.push([Rr * Math.cos(a * r), Rr + Rr * Math.sin(a * r)]); return p; }
const T = new C.Track({ id: 'predmeti-krog', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50 });
const ids = C.MODELS.filter(m => !m.trailer).map(m => m.id);
const races = {};
function raceOf(id) { if (races[id]) return races[id]; Math.random = SIM.seeded(1); const race = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 99, playerModel: C.MODELS.find(m => m.id === id), assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs', endless: true }); race.start(); race.tf.win.dens = 0; for (const q of race.tf.veh) q.off = true; return (races[id] = race); }
const S = { n: 0, hit: 0, nan: 0, cls: {}, worst: {}, dPl: 0, dPfree: 0, clampN: 0, knockN: 0 };
const MODE = process.env.MODE || 'mix';
for (let n = 0; n < N; n++) {
  const id = ids[Math.floor(R() * ids.length)], race = raceOf(id), P = race.player, tf = race.tf;
  const p = MODE === 'truck' ? 5 : Math.floor(R() * 6), kind = p === 5 ? 2 : p, dir = 1, st = MODE === 'lane' ? 0 : MODE === 'free' ? 1 : [0, 0, 1, 2][Math.floor(R() * 4)];
  if (kind === 4 && st === 0) { n--; continue; }   // kolo na pasu: _runBikeR posebej
  const s0 = 150 * T.ds + 30;
  const veh = tf._veh(dir, kind, s0, p); veh.off = true; tf._winPlace(veh, s0, 0);
  veh.v = st === 0 ? u(0, 30) : 0; tf._pose(veh, 0); veh.st = st; veh.nc = 0;
  if (st === 1) { veh.h = u(-Math.PI, Math.PI); const sp = u(0, 30), d = u(-Math.PI, Math.PI); veh.vx = sp * Math.cos(d); veh.vz = sp * Math.sin(d); veh.w = R() < 0.5 ? 0 : u(-4, 4); }
  if (st === 2) { veh.vx = 0; veh.vz = 0; veh.w = 0; veh.v = 0; }
  const reach = (Math.hypot(P.m.len, P.m.wid) + Math.hypot(veh.len, veh.wid)) * 0.5, r = u(0.3, 1) * reach, th = u(-Math.PI, Math.PI);
  P.place(veh.x + r * Math.cos(th), veh.z + r * Math.sin(th), u(-Math.PI, Math.PI));
  const rel = Math.exp(u(Math.log(0.1), Math.log(MODE === 'truck' ? 45 : 70))), rd = u(-Math.PI, Math.PI);
  P.vx = veh.vx + rel * Math.cos(rd); P.vz = veh.vz + rel * Math.sin(rd); P.w = R() < 0.5 ? 0 : u(-6, 6); P.xgl = R() < 0.3 ? u(0, 1) : 0; P.csKc = 0; P.cSx = 0; P.cSz = 0; P.air = 0; P.rl = null; P.dmg = 0; P.hitCar = 0; P.fuelKg = R() < 0.3 ? u(0, 60) : 0;

  const ma = P.m.mass + (P.fuelKg || 0), Ia = P.I * ma / P.m.mass, mb = veh.mass, Ib = mb * (veh.len * veh.len + veh.wid * veh.wid) / 12;
  const lx = T.tx[veh.i], lz = T.tz[veh.i];
  const c0 = { vx: P.vx, vz: P.vz, w: P.w }, v0 = { st, vx: veh.vx, vz: veh.vz, w: veh.w, v: veh.v, d: veh.d, s: veh.s };
  const E0 = 0.5 * ma * (c0.vx ** 2 + c0.vz ** 2) + 0.5 * Ia * c0.w ** 2 + 0.5 * mb * (v0.vx ** 2 + v0.vz ** 2) + 0.5 * Ib * v0.w ** 2;
  const imp = tf._hitVeh(P, veh);
  // odstrani vozilo iz seznama (da ne raste)
  { const k = tf.veh.indexOf(veh); if (k >= 0) tf.veh.splice(k, 1); if (veh.rider) { const j = tf.ped.indexOf(veh.rider); if (j >= 0) tf.ped.splice(j, 1); } }
  S.n++; if (!(imp > 0)) continue; S.hit++;
  const st1 = veh.st, bvx = st1 === 0 ? lx * veh.v * dir : veh.vx, bvz = st1 === 0 ? lz * veh.v * dir : veh.vz, bw = st1 === 0 ? 0 : veh.w;
  const vals = [P.vx, P.vz, P.w, P.x, P.z, bvx, bvz, bw, veh.x, veh.z, veh.s, veh.d, P.csKc, P.xgl];
  if (!vals.every(Number.isFinite)) { S.nan++; if (S.nan < 3) console.log('NAN', id, p, st, JSON.stringify(vals)); continue; }
  const E1 = 0.5 * ma * (P.vx ** 2 + P.vz ** 2) + 0.5 * Ia * P.w ** 2 + 0.5 * mb * (bvx ** 2 + bvz ** 2) + 0.5 * Ib * bw ** 2, dE = E1 - E0;
  const dPx = ma * (P.vx - c0.vx) + mb * (bvx - v0.vx), dPz = ma * (P.vz - c0.vz) + mb * (bvz - v0.vz);
  const key = 'p' + p + ' st' + st + '>' + st1;
  const c = S.cls[key] || (S.cls[key] = { n: 0, dEpos: 0, dEmax: 0, dPmax: 0, dPlane: 0, clamp: 0 });
  c.n++;
  const along = dPx * lx + dPz * lz, dPall = Math.hypot(dPx, dPz);
  if (st1 === 0) { const cl = veh.v === 0 && v0.v > 0 || (veh.v === 0 && Math.abs(along) > 1e-6); if (cl) c.clamp++; else c.dPlane = Math.max(c.dPlane, Math.abs(along)); }
  else if (st === 2 && st1 === 2) { /* stojeca razbitina: nepremicna */ }
  else c.dPmax = Math.max(c.dPmax, dPall);
  if (dE > 1e-3) { c.dEpos++; if (dE > c.dEmax) { c.dEmax = dE; c.w = { id, imp: +imp.toFixed(2), dE: +dE.toFixed(1), E0: Math.round(E0), c0, c1: { vx: P.vx, vz: P.vz, w: P.w }, v0, v1: { vx: bvx, vz: bvz, w: bw, v: veh.v }, ma, pl: P.isPlayer }; } }
}
console.log(JSON.stringify({ tf: TF, mode: MODE, n: S.n, hit: S.hit, nan: S.nan }));
for (const k of Object.keys(S.cls).sort()) { const c = S.cls[k]; console.log(k.padEnd(12), 'n', String(c.n).padEnd(5), 'dE>0', String(c.dEpos).padEnd(4), 'dEmax', c.dEmax.toFixed(1).padEnd(10), 'dPpar', c.dPmax.toExponential(1), 'dPpas', c.dPlane.toExponential(1), 'obrez', c.clamp, c.w ? JSON.stringify(c.w, (k, v) => typeof v === 'number' ? +v.toFixed(3) : v).slice(0, 420) : ''); }
