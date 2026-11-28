// p7: (a) near-perpendicular hits from either side (mirror cases must mirror); (b) a flat side slap (the car along the wall, sliding into it);
// (c) backwards into the wall. Race.step on the asphalt-to-the-barrier oval (right wall) and on Bathurst (left wall)
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
function ovalPts(Ls, R) { const p = [], r = Math.PI / 180; for (let x = 0; x < Ls; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([Ls + R * Math.cos(a * r), R + R * Math.sin(a * r)]); for (let x = Ls; x > 0; x -= 100) p.push([x, 2 * R]); for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]); return p; }
const TA = new C.Track({ id: 'v-asf', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4, walls: [[100, 1400, 1, -1.5, 20], [100, 1400, -1, -1.5, 20]] });
// o: side, hv (deg: the travel's angle to the wall, 90 = straight in, >90 = in and backwards along the track), hb (deg: the nose's angle to the wall line; default = hv), kmh
function run(o) {
  const T = TA, SIDE = o.side, i0 = T.nearestIdx(750, 0), B = SIDE > 0 ? T.br[i0] : T.bl[i0];
  const race = L.mkRace(T, o.id || 'rally', o.phys || 'cs', { damage: 1 }), c = race.player, hv = o.hv / D, hb = (o.hb == null ? o.hv : o.hb) / D, v = o.kmh / 3.6;
  // the reach of the body toward the wall at the nose angle hb
  let reach = 0; for (const p of c.corners) reach = Math.max(reach, p[0] * Math.sin(hb) + SIDE * p[1] * Math.cos(hb) * SIDE);
  reach = Math.max(...c.corners.map(p => p[0] * Math.sin(hb) + p[1] * Math.cos(hb)), ...c.corners.map(p => p[0] * Math.sin(hb) - p[1] * Math.cos(hb)));
  const dd = SIDE * (B - 0.3 - reach);
  L.put(c, T, T.px[i0] + T.nx[i0] * dd, T.pz[i0] + T.nz[i0] * dd, T.hd[i0] + SIDE * hb, v, T.hd[i0] + SIDE * hv);
  const mx = SIDE * T.nx[i0], mz = SIDE * T.nz[i0], tx = T.tx[i0], tz = T.tz[i0];
  let k0 = -1, wPk = 0, hitMax = 0, ud = 0; const rec = [];
  for (let k = 0; k < 4 * 120; k++) {
    c.inThr = 0; c.inSteer = 0; c.inBrk = 0;
    const pv = { vn: c.vx * mx + c.vz * mz, vt: c.vx * tx + c.vz * tz, h: c.h };
    race.step(DT);
    const hit = c.hitWall; c.hitWall = 0; c.hitCar = 0;
    if (hit > 0 && k0 < 0) { k0 = k; rec.pre = pv; }
    if (k0 >= 0) { wPk = Math.max(wPk, Math.abs(c.w)); hitMax = Math.max(hitMax, hit); if (hit > 2.5) ud++; rec.push({ vn: c.vx * mx + c.vz * mz, vt: c.vx * tx + c.vz * tz, w: c.w, h: c.h, room: L.room(c, T, SIDE), hit }); }
  }
  const at = (t) => rec[Math.round(t / DT)], f = (x, d = 1) => x == null ? '-' : x.toFixed(d), P = rec.pre, a1 = rec[0], a5 = at(0.5), a2 = at(2);
  return { stran: SIDE > 0 ? 'desna' : 'leva', 'kot poti': o.hv, 'kot nosu': o.hb == null ? o.hv : o.hb, kmh: o.kmh, 'vn0': f(P.vn * 3.6), 'vt0': f(P.vt * 3.6), 'vn 1.korak': f(a1.vn * 3.6), 'vt 1.korak': f(a1.vt * 3.6), 'w 1.korak': f(a1.w * D * SIDE, 0), 'vn 0.5s': f(a5.vn * 3.6), 'vt 0.5s': f(a5.vt * 3.6), 'nos 0.5s': f(SIDE * wrap(a5.h - T.hd[i0]) * D), 'nos 2s': f(SIDE * wrap(a2.h - T.hd[i0]) * D), 'v 2s': f(Math.hypot(a2.vn, a2.vt) * 3.6), wPk: f(wPk * D, 0), hit: f(hitMax), ud, sk: f(c.dmg * 100, 0) };
}
const rows = [];
if (!process.argv[2] || process.argv[2] === 'a') { for (const side of [1, -1]) for (const hv of [80, 85, 90, 95, 100]) rows.push(run({ side, hv, kmh: 100 })); console.table(rows); }
const r2 = [];
if (!process.argv[2] || process.argv[2] === 'b') {
  for (const side of [1, -1]) { r2.push(run({ side, hv: 10, hb: 0, kmh: 120 })); r2.push(run({ side, hv: 20, hb: 0, kmh: 100 })); r2.push(run({ side, hv: 90, hb: 0, kmh: 40 })); r2.push(run({ side, hv: 30, hb: -20, kmh: 100 })); r2.push(run({ side, hv: 30, hb: 180 + 30, kmh: 100 })); }
  console.table(r2);
}
