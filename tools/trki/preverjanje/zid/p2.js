// p2: time series of one oblique hit through Race.step (real track), damage mode 2 (Vklop) against 1 (Samo videz, the game's default) and 0
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
const a = process.argv.slice(2), TID = a[0] || 'bathurst', SIDE = +(a[1] || -1), TH = +(a[2] || 30), KMH = +(a[3] || 200), DMG = +(a[4] || 2), PHYS = a[5] || 'cs', INP = a[6] || 'nic', EVERY = +(a[7] || 6), SECS = +(a[8] || 2.5), FROM = +(a[9] || 400), TO = +(a[10] || 1250);
const T = L.track(TID), d0 = L.straight(T, SIDE, FROM, TO), i0 = T.idx(T.startS + d0), B = SIDE > 0 ? T.br[i0] : T.bl[i0];
const race = L.mkRace(T, 'rally', PHYS, { damage: DMG }), c = race.player, th = TH / D, v = KMH / 3.6;
const reach = c.m.len / 2 * Math.sin(th) + c.m.wid / 2 * Math.cos(th), dd = SIDE * (B - 0.6 - reach);
L.put(c, T, T.px[i0] + T.nx[i0] * dd, T.pz[i0] + T.nz[i0] * dd, T.hd[i0] + SIDE * th, v);
console.log(`${TID} ${d0} m, ograja ${B.toFixed(2)} m, pol sirine ${(T.wAt ? T.wAt(i0) : T.w).toFixed(2)}; dmgMode ${c.dmgMode}, wreck ${!!c.wreck}, kit ${!!(C.kitParts && C.kitParts(c.m))}`);
let k0 = -1; const f = (x, d = 1) => x.toFixed(d).padStart(7);
console.log('      t     v   vn(v zid) nos(deg) zdrs(deg) w(deg/s) rob(cm)   hit   dmg  wl  debris  povrs');
for (let k = 0; k < SECS * 120 + 60; k++) {
  c.inThr = INP === 'nic' ? 0 : 1; c.inSteer = 0; c.inBrk = 0;
  race.step(DT);
  const i = c.q.i, mx = SIDE * T.nx[i], mz = SIDE * T.nz[i], hit = c.hitWall; c.hitWall = 0; c.hitCar = 0;
  if (hit > 0 && k0 < 0) k0 = k;
  if (k0 >= 0 && ((k - k0) % EVERY === 0 || hit > 0.5)) console.log(f((k - k0) * DT, 3), f(Math.hypot(c.vx, c.vz) * 3.6), f((c.vx * mx + c.vz * mz) * 3.6), f(SIDE * wrap(c.h - T.hd[i]) * D), f(wrap(Math.atan2(c.vz, c.vx) - c.h) * D), f(c.w * D, 0), f(L.room(c, T, SIDE) * 100), f(hit), f(c.dmg * 100, 0), String(c.wreck ? c.wreck.wl : '-').padStart(3), String(race.debris.length).padStart(5), '  ', (c.ws || []).join(''));
  if (k0 >= 0 && (k - k0) * DT > SECS) break;
}
