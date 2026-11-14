// p5: the semi-trailer against a real track's barrier (Spa straight / Bathurst), Race.step; inputs nic / plin (no steer) / stran03 / zavora (brake only)
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
const a = process.argv.slice(2), TID = a[0] || 'spa', SIDE = +(a[1] || -1), FROM = +(a[2] || 1200), TO = +(a[3] || 2300);
const T = L.track(TID), d0 = L.straight(T, SIDE, FROM, TO), i0 = T.idx(T.startS + d0), B = SIDE > 0 ? T.br[i0] : T.bl[i0];
const RIG = (C.MODELS.find(m => m.trailer && !m.trailer.next) || {}).id;
function run(o) {
  const race = L.mkRace(T, o.id || RIG, o.phys || 'cs', { damage: 1 }), c = race.player, th = o.th / D, v = o.kmh / 3.6;
  const reach = c.m.len / 2 * Math.sin(th) + c.m.wid / 2 * Math.cos(th), dd = SIDE * (B - 0.3 - reach);
  L.put(c, T, T.px[i0] + T.nx[i0] * dd, T.pz[i0] + T.nz[i0] * dd, T.hd[i0] + SIDE * th, v);
  if (c.tl) { const R = c.tl; R.vx = c.vx; R.vz = c.vz; if (R.next) { R.next.vx = c.vx; R.next.vz = c.vz; } }
  let k0 = -1, fold = 0, foldT = null, tlT = 0, trT = 0; const sp = [], rows = [];
  for (let k = 0; k < 7 * 120; k++) {
    const t = k0 >= 0 ? (k - k0) * DT : -1;
    c.inThr = o.inp === 'nic' || o.inp === 'zavora' ? 0 : 1; c.inBrk = o.inp === 'zavora' && k0 >= 0 ? 1 : 0; c.inSteer = 0;
    if (o.inp === 'stran03' && t >= 0.3) { c.digitalSteer = false; const he = SIDE * wrap(c.h - T.hd[c.q.i]); c.inSteer = -SIDE * C.clamp(3 * (he + 0.05), -1, 1) * (t < 2 ? 1 : 0); }
    c.wallX = NaN; if (c.tl) c.tl.wallX = NaN;
    race.step(DT);
    const hit = c.hitWall; c.hitWall = 0; c.hitCar = 0;
    if (hit > 0 && k0 < 0) k0 = k;
    if (k0 >= 0) { const fa = c.tl ? Math.abs(wrap(c.tl.h - c.h)) * D : 0; if (fa > fold) { fold = fa; foldT = (k - k0) * DT; } if (c.tl && !Number.isNaN(c.tl.wallX)) tlT += DT; if (!Number.isNaN(c.wallX)) trT += DT; sp.push({ v: Math.hypot(c.vx, c.vz) * 3.6, fa }); }
  }
  const at = (t) => sp[Math.round(t / DT)] || {}, f = (x, d = 0) => x == null ? '-' : x.toFixed(d);
  return { proga: TID, avto: o.id || RIG, fiz: o.phys || 'cs', kot: o.th, kmh: o.kmh, vnos: o.inp, v0: f(sp[0] && sp[0].v), v05: f(at(0.5).v), v2: f(at(2).v), v4: f(at(4).v), 'zlom0.3': f(at(0.3).fa, 1), 'zlom1': f(at(1).fa, 1), 'zlom4': f(at(4).fa, 1), zlomMax: f(fold, 1), ob: f(foldT, 2), prikNaOgraji: f(tlT, 2), vlacNaOgraji: f(trT, 2), sk: f(c.dmg * 100) };
}
const rows = [];
for (const [th, kmh] of [[5, 120], [5, 60], [15, 120], [3, 120]]) for (const inp of ['nic', 'plin', 'stran03', 'zavora']) rows.push(run({ th, kmh, inp }));
rows.push(run({ th: 5, kmh: 120, inp: 'nic', phys: 'nova' })); rows.push(run({ th: 5, kmh: 120, inp: 'plin', phys: 'nova' }));
rows.push(run({ th: 5, kmh: 120, inp: 'nic', id: 'titan' }));
console.table(rows);
