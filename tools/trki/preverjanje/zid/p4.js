// p4: time series on the measurers' oval ('asfalt' / 'trava') or a real track, Race.step; args: road th kmh inp(nic|plin|stran|vanj|stran03) phys every secs dmg
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
function ovalPts(Ls, R) { const p = [], r = Math.PI / 180; for (let x = 0; x < Ls; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([Ls + R * Math.cos(a * r), R + R * Math.sin(a * r)]); for (let x = Ls; x > 0; x -= 100) p.push([x, 2 * R]); for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]); return p; }
const a = process.argv.slice(2), ROAD = a[0] || 'asfalt', TH = +(a[1] || 15), KMH = +(a[2] || 60), INP = a[3] || 'nic', PHYS = a[4] || 'cs', EVERY = +(a[5] || 30), SECS = +(a[6] || 4), DMG = +(a[7] || 1), ID = a[8] || 'rally';
let T, SIDE, i0;
if (ROAD === 'asfalt') { T = new C.Track({ id: 'v-asf', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4, walls: [[100, 1400, 1, -1.5, 20]] }); SIDE = 1; i0 = T.nearestIdx(750, 0); }
else if (ROAD === 'trava') { T = new C.Track({ id: 'v-tr', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4 }); SIDE = 1; i0 = T.nearestIdx(750, 0); }
else if (ROAD === 'bathurst') { T = L.track('bathurst'); SIDE = -1; i0 = T.idx(T.startS + L.straight(T, -1, 400, 1250)); }
else if (ROAD === 'gora') { T = L.track('bathurst'); SIDE = 1; i0 = T.idx(T.startS + L.straight(T, 1, 1750, 3800)); }
else { T = L.track('spa'); SIDE = -1; i0 = T.idx(T.startS + L.straight(T, -1, 1200, 2300)); }
const B = SIDE > 0 ? T.br[i0] : T.bl[i0];
const race = L.mkRace(T, ID, PHYS, { damage: DMG }), c = race.player, th = TH / D, v = KMH / 3.6;
const reach = c.m.len / 2 * Math.sin(th) + c.m.wid / 2 * Math.cos(th), dd = SIDE * (B - 0.3 - reach);
L.put(c, T, T.px[i0] + T.nx[i0] * dd, T.pz[i0] + T.nz[i0] * dd, T.hd[i0] + SIDE * th, v);
let k0 = -1, tch = 0, lastT = -1; const f = (x, d = 1) => x.toFixed(d).padStart(7);
console.log(`${ROAD} ${ID} ${TH} deg ${KMH} km/h ${INP} ${PHYS} dmg ${DMG}`);
console.log('      t       v  vn(vzid)     nos    zdrs       w rob(cm)     hit  volan  stikov  povrs');
let n = 0;
for (let k = 0; k < SECS * 120 + 120; k++) {
  const t = k0 >= 0 ? (k - k0) * DT : -1;
  c.inThr = INP === 'nic' ? 0 : 1; c.inSteer = 0; c.inBrk = 0;
  if (INP === 'stran' && k0 >= 0) c.inSteer = -SIDE; if (INP === 'stran03' && t >= 0.3) c.inSteer = -SIDE; if (INP === 'vanj') c.inSteer = SIDE;
  if ((INP === 'stran' || INP === 'stran03') && c.inSteer && SIDE * wrap(c.h - T.hd[c.q.i]) < -0.12) c.inSteer = 0;
  race.step(DT);
  const i = c.q.i, mx = SIDE * T.nx[i], mz = SIDE * T.nz[i], hit = c.hitWall; c.hitWall = 0; c.hitCar = 0;
  if (hit > 0 && k0 < 0) k0 = k;
  const rm = L.room(c, T, SIDE); if (k0 >= 0 && (hit > 0 || rm < 1e-4)) { n++; lastT = (k - k0) * DT; }
  if (k0 >= 0 && ((k - k0) % EVERY === 0 || hit > 2.5)) { console.log(f((k - k0) * DT, 3), f(Math.hypot(c.vx, c.vz) * 3.6), f((c.vx * mx + c.vz * mz) * 3.6), f(SIDE * wrap(c.h - T.hd[i]) * D), f(wrap(Math.atan2(c.vz, c.vx) - c.h) * D), f(c.w * D, 0), f(rm * 100), f(hit, 2), f(c.steer, 2), f(n, 0), '  ', (c.ws || []).join('')); n = 0; }
  if (k0 >= 0 && (k - k0) * DT > SECS) break;
}
console.log('zadnji stik ob t =', lastT.toFixed(2), 's; skoda', (c.dmg * 100).toFixed(0), '%');
