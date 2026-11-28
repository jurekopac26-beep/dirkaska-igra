// Independent check of 'predmeti-tresenje': after the knock, when does the prop come to rest (Spa's straight, Race.step, 12 s)
'use strict';
const L = require('./lib.js'), { DT, KMH } = L;
for (const kind of ['meter', 'rssign', 'hydrant', 'barrel', 'cone', 'sign']) for (const kmh of [60, 120]) {
  const T = L.track('spa'), S = L.straight(T, 0.4), race = L.mkRace(T, 'rally'), P = race.player; L.put(P, T, S.i, 0, kmh / KMH, 0);
  const hx = Math.cos(P.h), hz = Math.sin(P.h), front = P.circles[P.circles.length - 1] + P.rad;
  race.setProps([{ kind, x: P.x + hx * (front + 3), z: P.z + hz * (front + 3), yaw: P.h, col: 0, i: S.i }], null);
  const b = race.props[0]; let last = 0, tSleep = null, vLate = 0, wLate = 0, hit = null;
  for (let k = 0; k < 24 / DT; k++) { P.inThr = 0; P.inSteer = 0; P.inBrk = 0; L.step(race); const t = (k + 1) * DT, v = Math.hypot(b.vx || 0, b.vz || 0, b.vy || 0), w = Math.max(Math.abs(b.wx || 0), Math.abs(b.wy || 0), Math.abs(b.wz || 0), Math.abs(b.w || 0));
    if (hit == null && b.hit1) hit = t; if (hit != null && !b.sleep && !b.dead && (v > 0.05 || w > 0.05)) last = t - hit; if (hit != null && tSleep == null && (b.sleep || b.dead)) tSleep = t - hit;
    if (hit != null && t - hit > 8 && t - hit < 12 && !b.sleep) { vLate = Math.max(vLate, v); wLate = Math.max(wLate, w); } }
  console.log(`${kind} ${b.K.m} kg ${kmh} km/h: zadnje gibanje ${last.toFixed(1)} s po zadetku, spi po ${tSleep == null ? '-' : tSleep.toFixed(1) + ' s'}, 8-12 s po zadetku: v do ${vLate.toFixed(2)} m/s, w do ${wLate.toFixed(2)} rad/s`);
}
