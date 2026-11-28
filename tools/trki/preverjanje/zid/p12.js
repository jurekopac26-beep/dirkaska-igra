// p12: (a) the new map's edge (track.free) through Race.step; (b) the rig head-on on a 44 m wide road: steps with damage, against the tractor alone
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
function ovalPts(Ls, R) { const p = [], r = Math.PI / 180; for (let x = 0; x < Ls; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([Ls + R * Math.cos(a * r), R + R * Math.sin(a * r)]); for (let x = Ls; x > 0; x -= 100) p.push([x, 2 * R]); for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]); return p; }
{ const T = new C.Track({ id: 'v-free', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4 }); T.free = [-1e4, 1e4, -1e4, 3];
  const rows = [];
  for (const [th, kmh] of [[30, 120], [60, 100], [90, 80]]) for (const phys of ['cs', 'nova']) { const race = L.mkRace(T, 'rally', phys, { damage: 1 }), c = race.player; L.put(c, T, 750, 0, th / D, kmh / 3.6);
    let k0 = -1, hitMax = 0, v1 = null, vx0 = 0, vz0 = 0, on = 0, w = 0;
    for (let k = 0; k < 4 * 120; k++) { c.inThr = 0; c.inSteer = 0; const b = { vx: c.vx, vz: c.vz }; race.step(DT); hitMax = Math.max(hitMax, c.hitWall); c.hitWall = 0;
      if (c.z >= 3 - 1e-9) { on++; if (k0 < 0) { k0 = k; vx0 = b.vx; vz0 = b.vz; v1 = Math.hypot(c.vx, c.vz); } } w = Math.max(w, Math.abs(c.w)); }
    const ch = Math.cos(c.h), sh = Math.sin(c.h), over = Math.max(...c.corners.map(p => c.z + p[0] * sh + p[1] * ch)) - 3;
    rows.push({ fiz: phys, kot: th, kmh, 'v pred': (Math.hypot(vx0, vz0) * 3.6).toFixed(1), 'v po 1. koraku': (v1 * 3.6).toFixed(1), 'v*cos': (Math.hypot(vx0, vz0) * Math.cos(Math.atan2(vz0, vx0)) * 3.6).toFixed(1), hitWall: hitMax.toFixed(2), sk: (c.dmg * 100).toFixed(0), 'na robu s': (on * DT).toFixed(2), 'vogal cez rob m (konec)': over.toFixed(2), 'v konec': (Math.hypot(c.vx, c.vz) * 3.6).toFixed(0) }); }
  console.table(rows); }
{ const T = new C.Track({ id: 'v-sir', name: 'Ravnina, Preizkus', halfWidth: 22, points: ovalPts(1600, 260), startX: 50, edgeBar: 4, walls: [[100, 1400, 1, -1.5, 20]] }), i0 = T.nearestIdx(750, 0), B = T.br[i0];
  const RIG = (C.MODELS.find(m => m.trailer && !m.trailer.next) || {}).id, rows = [];
  for (const id of [RIG, 'titan']) for (const kmh of [60, 120]) for (const dmg of [1, 2]) { const race = L.mkRace(T, id, 'cs', { damage: dmg }), c = race.player, th = Math.PI / 2, reach = c.m.len / 2, dd = B - 0.3 - reach;
    L.put(c, T, T.px[i0] + T.nx[i0] * dd, T.pz[i0] + T.nz[i0] * dd, T.hd[i0] + th, kmh / 3.6); if (c.tl) { c.tl.vx = c.vx; c.tl.vz = c.vz; }
    let k0 = -1, ud = 0, hits = [], v1 = null, stop = null, dmgSteps = [], prevD = 0;
    for (let k = 0; k < 3 * 120; k++) { c.inThr = 0; c.inSteer = 0; race.step(DT); const hit = c.hitWall; c.hitWall = 0; c.hitCar = 0; if (hit > 0 && k0 < 0) { k0 = k; v1 = Math.hypot(c.vx, c.vz) * 3.6; }
      if (hit > 2.5) { ud++; hits.push(hit.toFixed(1)); } if (c.dmg > prevD + 1e-9) { dmgSteps.push(((c.dmg - prevD) * 100).toFixed(0)); prevD = c.dmg; } if (k0 >= 0 && stop == null && Math.hypot(c.vx, c.vz) < 0.5) stop = (k - k0) * DT; }
    rows.push({ avto: id, kmh, dmgMode: dmg, 'v po 1. koraku': v1.toFixed(0), 'stoji po s': stop == null ? '-' : stop.toFixed(2), 'koraki s hit > 2.5': ud, 'hit m/s po korakih': hits.join(' '), 'skoda po korakih %': dmgSteps.join('+'), 'skoda %': (c.dmg * 100).toFixed(0) }); }
  console.table(rows); }
