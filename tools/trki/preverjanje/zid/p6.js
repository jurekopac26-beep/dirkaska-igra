// p6: riding the barrier round a bend on purpose (a clever driver: along the outside wall from the start, full throttle, no brakes), against
// the game's own driver (aiControl) on the same road; asphalt up to the barrier (a street circuit) and with 4 m of grass before it
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
function ovalPts(Ls, R) { const p = [], r = Math.PI / 180; for (let x = 0; x < Ls; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([Ls + R * Math.cos(a * r), R + R * Math.sin(a * r)]); for (let x = Ls; x > 0; x -= 100) p.push([x, 2 * R]); for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]); return p; }
function mkTrack(Rb, tla) {
  const def = { id: 'v-ov-' + Rb + tla, name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, Rb), startX: 50, edgeBar: 4 };
  if (tla === 'asfalt') def.walls = [[1300, 2200, -1, -1.5, 20]];
  return new C.Track(def);
}
function run(o) {
  const T = mkTrack(o.R, o.tla), race = L.mkRace(T, o.id || 'rally', o.phys || 'cs', { damage: o.dmg == null ? 1 : o.dmg }), c = race.player, v = o.kmh / 3.6;
  const i0 = T.nearestIdx(1250, 0), i1 = T.nearestIdx(1560, 0), Bl = T.bl[i1];
  // start: x = 1250 on the first straight, 350 m before the bend. The rider: 0.25 m from the outside (left) wall as it is at the bend; the autopilot: the middle
  const dd = o.kaj === 'avtopilot' ? 0 : -(Bl - c.m.wid / 2 - 0.25);
  L.put(c, T, T.px[i0] + T.nx[i0] * dd, T.pz[i0] + T.nz[i0] * dd, T.hd[i0], v);
  let tIn = null, tOut = null, tEnd = null, vMin = 1e9, vIn = 0, vOut = 0, hitMax = 0, ud = 0, tch = 0, t = 0, d0 = c.dist, sEnd = null;
  const xEnd = 1600 - (o.after || 300);
  for (let k = 0; k < 40 * 120; k++) {
    if (o.kaj === 'avtopilot') C.aiControl(c, race, DT);
    else { c.inThr = 1; c.inBrk = 0; c.inSteer = o.steer || 0; if (o.kaj === 'po ograji+volan') { const he = wrap(c.h - T.hd[c.q.i]); c.digitalSteer = false; c.inSteer = C.clamp(-3 * (he + 0.03), -1, 1); } }   // (the nose held 1.7 deg toward the wall: just leaning on it)
    c.wallX = NaN;
    race.step(DT); t += DT;
    const hit = c.hitWall; c.hitWall = 0; c.hitCar = 0; const sp = Math.hypot(c.vx, c.vz) * 3.6;
    if (hit > hitMax) hitMax = hit; if (hit > 2.5) ud++; if (!Number.isNaN(c.wallX)) tch++;
    if (tIn == null && c.x >= 1600 && c.z < o.R) { tIn = t; vIn = sp; }
    if (tIn != null && tOut == null) vMin = Math.min(vMin, sp);
    if (tIn != null && tOut == null && c.z >= o.R && c.x <= 1600) { tOut = t; vOut = sp; }
    if (tOut != null && c.x <= xEnd) { tEnd = t; sEnd = sp; break; }
  }
  const f = (x, d = 0) => x == null ? '-' : x.toFixed(d);
  return { R: o.R, tla: o.tla, fiz: o.phys || 'cs', kaj: o.kaj, 'do ovinka s': f(tIn, 2), 'ovinek s': f(tOut - tIn, 2), 'skupaj s': f(tEnd, 2), vIn: f(vIn), vMin: f(vMin), vOut: f(vOut), vKonec: f(sEnd), hit: f(hitMax, 1), ud, stik: f(tch * DT, 2), sk: f(c.dmg * 100) };
}
const rows = [];
const Rs = process.argv[2] ? process.argv.slice(2).map(Number) : [60];
for (const R of Rs) for (const tla of ['asfalt', 'trava']) for (const phys of ['cs', 'nova']) for (const kaj of ['avtopilot', 'po ograji', 'po ograji+volan']) rows.push(run({ R, tla, phys, kaj, kmh: 200 }));
console.table(rows);
