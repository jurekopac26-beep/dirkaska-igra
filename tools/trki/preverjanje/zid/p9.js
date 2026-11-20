// p9: (a) the edge of a drop through Race.step; (b) nova's chatter on the barrier (touch flag changes, by the corners' room and by hitWall);
// (c) an AI car (aiControl) after an oblique hit: how long on the wall, when back at pace
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
const part = process.argv[2] || 'abc';
if (part.includes('a')) {
  const pts = []; for (let x = 0; x <= 1200; x += 100) pts.push([x, 0]);
  const T = new C.Track({ id: 'v-odprta', name: 'Ravnina, Preizkus', open: true, halfWidth: 6, points: pts, startX: 50, edgeBar: 4, drops: [[300, 700, 1]] });
  const rows = [], i = T.nearestIdx(550, 0);
  for (const [th, kmh] of [[10, 45], [10, 50], [10, 55], [10, 60], [3, 120], [3, 180], [20, 20], [20, 30]]) {
    const race = L.mkRace(T, 'rally', 'cs', { damage: 1 }), c = race.player, t = th / D, reach = c.m.len / 2 * Math.sin(t) + c.m.wid / 2 * Math.cos(t), dd = T.br[i] - 0.3 - reach;
    L.put(c, T, T.px[i] + T.nx[i] * dd, T.pz[i] + T.nz[i] * dd, T.hd[i] + t, kmh / 3.6);
    let k0 = -1, fell = null, tch = 0, v2 = null, hitMax = 0, dOut = 0;
    for (let k = 0; k < 5 * 120; k++) { c.inThr = 0; c.inSteer = 0; c.wallX = NaN; race.step(DT); const hit = c.hitWall; c.hitWall = 0; if (c.fall && fell == null) { fell = k * DT; break; }
      if (!Number.isNaN(c.wallX)) { if (k0 < 0) k0 = k; tch++; } hitMax = Math.max(hitMax, hit); dOut = Math.max(dOut, c.q.d + c.m.wid / 2 - T.w); if (k0 >= 0 && k - k0 === 240) v2 = Math.hypot(c.vx, c.vz) * 3.6; }
    rows.push({ kot: th, kmh, 'navzven m/s': (kmh / 3.6 * Math.sin(t)).toFixed(2), pade: fell != null, 'na robu s': (tch * DT).toFixed(2), 'v po 2 s': v2 == null ? '-' : v2.toFixed(0), hit: hitMax.toFixed(1), 'bok najvec m od asfalta': dOut.toFixed(2), rob: (T.br[i] - T.w).toFixed(2) });
  }
  console.table(rows);
}
function ovalPts(Ls, R) { const p = [], r = Math.PI / 180; for (let x = 0; x < Ls; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([Ls + R * Math.cos(a * r), R + R * Math.sin(a * r)]); for (let x = Ls; x > 0; x -= 100) p.push([x, 2 * R]); for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]); return p; }
const TA = new C.Track({ id: 'v-asf', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4, walls: [[100, 1400, 1, -1.5, 20]] });
if (part.includes('b')) {
  const rows = [];
  for (const [road, T, SIDE, i0] of [['asfalt', TA, 1, TA.nearestIdx(750, 0)], ['spa', L.track('spa'), -1, null]]) for (const phys of ['cs', 'nova']) for (const [th, kmh] of [[5, 60], [5, 120], [15, 120], [30, 200]]) {
    const ii = i0 != null ? i0 : T.idx(T.startS + L.straight(T, SIDE, 1200, 2300)), B = SIDE > 0 ? T.br[ii] : T.bl[ii];
    const race = L.mkRace(T, 'rally', phys, { damage: 1 }), c = race.player, t = th / D, reach = c.m.len / 2 * Math.sin(t) + c.m.wid / 2 * Math.cos(t), dd = SIDE * (B - 0.3 - reach);
    L.put(c, T, T.px[ii] + T.nx[ii] * dd, T.pz[ii] + T.nz[ii] * dd, T.hd[ii] + SIDE * t, kmh / 3.6);
    let k0 = -1, prev = false, tog = 0, eps = 0, gapN = 99, tch = 0, hits = 0, maxGap = 0, maxHit14 = 0, n14 = 0, t14 = 0, last = -1, popMax = 0, dmgHits = 0;
    for (let k = 0; k < 7 * 120; k++) { c.inThr = 0; c.inSteer = 0; c.wallX = NaN; const bx = c.x, bz = c.z, bvx = c.vx, bvz = c.vz; race.step(DT); const hit = c.hitWall; c.hitWall = 0; c.hitCar = 0;
      const touch = !Number.isNaN(c.wallX); if (touch && k0 < 0) k0 = k; if (k0 < 0) continue;
      if (touch !== prev) tog++; prev = touch; if (touch) { tch++; last = k; if (gapN >= 6) eps++; gapN = 0; } else gapN++; if (hit > 2.5) dmgHits++;
      const tt = (k - k0) * DT; if (tt >= 1 && tt < 4) { n14++; if (touch) t14++; maxHit14 = Math.max(maxHit14, hit); maxGap = Math.max(maxGap, L.room(c, T, SIDE)); } }
    rows.push({ cesta: road, fiz: phys, kot: th, kmh, 'loceni dotiki': eps, 'preklopi/s (do zadnjega stika)': (tog / Math.max(DT, (last - k0 + 1) * DT)).toFixed(0), 'stik s': (tch * DT).toFixed(2), 'zadnji stik s': ((last - k0) * DT).toFixed(2), '1-4 s: delez stika %': (t14 / n14 * 100).toFixed(0), '1-4 s: najv. reza cm': (maxGap * 100).toFixed(1), '1-4 s: najv. hit': maxHit14.toFixed(2), 'udarci s skodo': dmgHits, sk: (c.dmg * 100).toFixed(0) });
  }
  console.table(rows);
}
if (part.includes('c')) {
  const rows = [];
  for (const [road, T, SIDE, i0] of [['asfalt', TA, 1, TA.nearestIdx(750, 0)], ['spa', L.track('spa'), -1, null], ['bathurst', L.track('bathurst'), -1, null]]) for (const phys of ['cs', 'nova']) for (const [th, kmh] of [[5, 120], [15, 120], [30, 120], [60, 80], [90, 60]]) {
    const ii = i0 != null ? i0 : T.idx(T.startS + L.straight(T, SIDE, road === 'spa' ? 1200 : 400, road === 'spa' ? 2300 : 1250)), B = SIDE > 0 ? T.br[ii] : T.bl[ii];
    const race = L.mkRace(T, 'rally', phys, { damage: 1, numAI: 1 }), P = race.player, c = race.cars.find(x => !x.isPlayer), t = th / D, reach = c.m.len / 2 * Math.sin(t) + c.m.wid / 2 * Math.cos(t), dd = SIDE * (B - 0.3 - reach);
    // the player far away and parked
    const jj = (ii + Math.floor(T.N / 2)) % T.N; L.put(P, T, T.px[jj], T.pz[jj], T.hd[jj], 0); P.locked = true;
    L.put(c, T, T.px[ii] + T.nx[ii] * dd, T.pz[ii] + T.nz[ii] * dd, T.hd[ii] + SIDE * t, kmh / 3.6); c.digitalSteer = false;
    let k0 = -1, tch = 0, last = -1, v = [], hitN = 0, stuck = 0, minV = 1e9, rev = 0, d0 = null;
    for (let k = 0; k < 12 * 120; k++) { c.wallX = NaN; race.step(DT); const hit = c.hitWall; c.hitWall = 0; c.hitCar = 0; const touch = !Number.isNaN(c.wallX);
      if (touch && k0 < 0) { k0 = k; d0 = c.dist; } if (k0 < 0) continue; if (touch) { tch++; last = k; } if (hit > 2.5) hitN++; const sp = Math.hypot(c.vx, c.vz) * 3.6; v.push(sp); if (sp < 5) stuck++; if (c.gear < 0 || (c.vx * Math.cos(c.h) + c.vz * Math.sin(c.h)) < -0.5) rev++; }
    const at = (s) => v[Math.round(s / DT)];
    rows.push({ cesta: road, fiz: phys, kot: th, kmh, 'stik s': (tch * DT).toFixed(2), 'zadnji stik s': ((last - k0) * DT).toFixed(2), 'v 1s': at(1).toFixed(0), 'v 3s': at(3).toFixed(0), 'v 6s': at(6).toFixed(0), 'v 10s': at(10).toFixed(0), 'pod 5 km/h s': (stuck * DT).toFixed(1), 'vzvratno s': (rev * DT).toFixed(1), 'pot v 10 s m': (c.dist - d0).toFixed(0), 'udarci': hitN, sk: (c.dmg * 100).toFixed(0) });
  }
  console.table(rows);
}
