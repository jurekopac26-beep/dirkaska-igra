// p8: the pit wall's nose: the player down the way in at several offsets from the pit wall's line; the largest sideways move in one step. Spa and Bathurst, Race.step
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
const rows = [];
for (const tid of ['spa', 'bathurst']) { const T = L.track(tid), J = T.pitJ(); if (!J) { console.log(tid, 'brez pitJ'); continue; }
  const sN = T.startS + J.ga, pz = T.pitAt(sN + 2), i = T.idx(sN - 45);
  for (const kmh of [60, 120]) for (const off of [-1.2, -0.6, -0.2, 0, 0.2, 0.6, 1.2]) {
    const race = L.mkRace(T, 'rally', 'cs', { damage: 1 }), c = race.player, o = pz.sd * (pz.wall + off);
    L.put(c, T, T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o, T.hd[i], kmh / 3.6);
    let skok = 0, tS = null, hit = 0, v0 = 0, vMin = 1e9, pd = null, dmg = 0, px = c.x, pzz = c.z, pop = 0;
    for (let k = 0; k < 3 * 120; k++) { c.inThr = 0.3; c.inSteer = 0; c.inBrk = 0; const vb = Math.hypot(c.vx, c.vz);
      const bx = c.x, bz = c.z; race.step(DT);
      // the sideways part of this step's move (across the car's own travel direction before the step)
      const mvx = c.x - bx, mvz = c.z - bz, sp = Math.hypot(c.vx, c.vz) || 1, lat = Math.abs(mvx * (-c.vz / sp) + mvz * (c.vx / sp));
      if (lat > pop) { pop = lat; tS = k * DT; v0 = vb * 3.6; }
      hit = Math.max(hit, c.hitWall); c.hitWall = 0; c.hitCar = 0; vMin = Math.min(vMin, Math.hypot(c.vx, c.vz) * 3.6); }
    rows.push({ proga: tid, 'vrzel konec (m od starta)': J.ga.toFixed(0), kmh, 'odmik od crte zidu m': off, 'skok vstran cm': (pop * 100).toFixed(0), 'ob s': tS.toFixed(2), 'v pred': v0.toFixed(0), hit: hit.toFixed(1), sk: (c.dmg * 100).toFixed(0), inPit: !!c.inPit });
  } }
console.table(rows);
