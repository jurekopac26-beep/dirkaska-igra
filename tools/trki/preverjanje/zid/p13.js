// p13: what leaning on the barrier costs: full throttle from the same speed (a) free, in the middle of the road, (b) on the barrier after a 5 / 15 deg touch
// with no steering, (c) the steering held INTO the barrier all the time (grinding along it). Asphalt up to the barrier, Race.step, damage 1. Also own debris hits counted.
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
function ovalPts(Ls, R) { const p = [], r = Math.PI / 180; for (let x = 0; x < Ls; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([Ls + R * Math.cos(a * r), R + R * Math.sin(a * r)]); for (let x = Ls; x > 0; x -= 100) p.push([x, 2 * R]); for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]); return p; }
const T = new C.Track({ id: 'v-asf', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4, walls: [[100, 1400, 1, -1.5, 20]] }), i0 = T.nearestIdx(300, 0), B = T.br[i0];
function run(o) {
  const race = L.mkRace(T, o.id || 'rally', o.phys || 'cs', { damage: 1 }), c = race.player, th = (o.th || 0) / D, reach = c.m.len / 2 * Math.sin(th) + c.m.wid / 2 * Math.cos(th);
  const dd = o.kaj === 'prosto' ? -2 : B - 0.3 - reach;
  L.put(c, T, T.px[i0] + T.nx[i0] * dd, T.pz[i0] + T.nz[i0] * dd, T.hd[i0] + th, o.kmh / 3.6);
  let k0 = o.kaj === 'prosto' ? 0 : -1, tch = 0, v = [], hitMax = 0, sumHit = 0, x0 = null;
  for (let k = 0; k < 8 * 120; k++) { c.inThr = 1; c.inBrk = 0; c.inSteer = o.kaj === 'vanj' ? 1 : 0; c.wallX = NaN; race.step(DT); const hit = c.hitWall; c.hitWall = 0; c.hitCar = 0;
    if (hit > 0 && k0 < 0) k0 = k; if (k0 < 0) continue; if (x0 == null) x0 = c.dist; if (!Number.isNaN(c.wallX)) tch++; if (k > k0) { hitMax = Math.max(hitMax, hit); sumHit += hit; } v.push({ v: Math.hypot(c.vx, c.vz) * 3.6, d: c.dist - x0, he: wrap(c.h - T.hd[c.q.i]) * D }); if (v.length > 5 * 120) break; }
  const at = (s) => v[Math.round(s / DT)] || {}, f = (x, d = 0) => x == null ? '-' : x.toFixed(d);
  return { kaj: o.kaj, fiz: o.phys || 'cs', kot: o.th || 0, kmh: o.kmh, 'v 0s': f(v[0].v), 'v 1s': f(at(1).v), 'v 2s': f(at(2).v), 'v 4s': f(at(4).v), 'pot 4s m': f(at(4).d), 'nos 2s deg': f(at(2).he, 1), 'stik s (od 5)': f(tch * DT, 2), 'najv. hit po prvem': f(hitMax, 2), sk: f(c.dmg * 100) };
}
const rows = [];
for (const phys of ['cs', 'nova']) for (const kmh of [60, 120]) { rows.push(run({ kaj: 'prosto', kmh: kmh - (kmh === 60 ? 1 : 0), phys })); rows.push(run({ kaj: 'brez volana', th: 5, kmh, phys })); rows.push(run({ kaj: 'brez volana', th: 15, kmh, phys })); rows.push(run({ kaj: 'vanj', th: 5, kmh, phys })); }
console.table(rows);
