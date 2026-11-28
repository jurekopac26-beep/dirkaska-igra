// p3: is the loss after the first step the track's surface, the debris or something else? Race.step on Bathurst and on the measurers' oval definitions
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
function ovalPts(Ls, R) { const p = [], r = Math.PI / 180; for (let x = 0; x < Ls; x += 100) p.push([x, 0]); for (let a = -90; a < 90; a += 15) p.push([Ls + R * Math.cos(a * r), R + R * Math.sin(a * r)]); for (let x = Ls; x > 0; x -= 100) p.push([x, 2 * R]); for (let a = 90; a < 270; a += 15) p.push([R * Math.cos(a * r), R + R * Math.sin(a * r)]); return p; }
const TR = {
  asfalt: () => ({ T: new C.Track({ id: 'v-asf', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4, walls: [[100, 1400, 1, -1.5, 20]] }), side: 1, at: (T) => T.nearestIdx(750, 0) }),
  trava: () => ({ T: new C.Track({ id: 'v-tr', name: 'Ravnina, Preizkus', halfWidth: 6, points: ovalPts(1600, 220), startX: 50, edgeBar: 4 }), side: 1, at: (T) => T.nearestIdx(750, 0) }),
  bathurst: () => { const T = L.track('bathurst'); return { T, side: -1, at: () => T.idx(T.startS + L.straight(T, -1, 400, 1250)) }; },
  bathurstGora: () => { const T = L.track('bathurst'); return { T, side: 1, at: () => T.idx(T.startS + L.straight(T, 1, 1750, 3800)) }; },
  spa: () => { const T = L.track('spa'); return { T, side: -1, at: () => T.idx(T.startS + L.straight(T, -1, 1200, 2300)) }; },
};
function run(o) {
  const X = TR[o.tr](), T = X.T, SIDE = X.side, i0 = X.at(T), B = SIDE > 0 ? T.br[i0] : T.bl[i0];
  const race = L.mkRace(T, o.id || 'rally', o.phys || 'cs', { damage: o.dmg == null ? 2 : o.dmg }), c = race.player, th = o.th / D, v = o.kmh / 3.6;
  if (o.noDebris) race.spawnDebris = () => {};
  const reach = c.m.len / 2 * Math.sin(th) + c.m.wid / 2 * Math.cos(th), dd = SIDE * (B - (o.gap == null ? 0.3 : o.gap) - reach);
  L.put(c, T, T.px[i0] + T.nx[i0] * dd, T.pz[i0] + T.nz[i0] * dd, T.hd[i0] + SIDE * th, v);
  let k0 = -1, last = -1, rec = [], deb = 0, hits = 0;
  for (let k = 0; k < 7 * 120; k++) {
    c.inThr = o.inp === 'plin' ? 1 : 0; c.inSteer = 0; c.inBrk = 0;
    const pv = Math.hypot(c.vx, c.vz);
    race.step(DT);
    const hit = c.hitWall; c.hitWall = 0; c.hitCar = 0;
    const r = { hit, room: L.room(c, T, SIDE), sp: Math.hypot(c.vx, c.vz), w: c.w, slip: wrap(Math.atan2(c.vz, c.vx) - c.h), he: SIDE * wrap(c.h - T.hd[c.q.i]), psp: pv };
    r.touch = hit > 0 || r.room < 1e-4; if (hit > 0 && k0 < 0) k0 = k; if (hit > 2.5) hits++;
    deb = Math.max(deb, race.debris.length); rec.push(r);
  }
  let kL = -1; for (let k = k0, lt = k0; k < rec.length; k++) { if (rec[k].touch) lt = k; else if (k - lt >= 30) { kL = lt; break; } }
  let rav = null; for (let k = k0, n = 0; k < rec.length; k++) { const r = rec[k], ok = !r.touch && Math.abs(r.w) < 0.052 && (r.sp < 0.5 || Math.abs(r.slip) < 0.052); n = ok ? n + 1 : 0; if (n >= 30) { rav = (k - 29 - k0) * DT; break; } }
  const at = (t) => rec[k0 + Math.round(t / DT)], f = (x, d = 0) => x == null ? '-' : x.toFixed(d);
  return { proga: o.tr, rob: f(B - (T.wAt ? T.wAt(i0) : T.w), 1), kot: o.th, kmh: o.kmh, fiz: o.phys || 'cs', dmg: o.dmg == null ? 2 : o.dmg, kosi: o.noDebris ? 'brez' : 'da', nKosov: deb, v0: f(rec[k0].psp * 3.6), v1: f(rec[k0].sp * 3.6), 'v0.15': f(at(0.15).sp * 3.6), vL: kL >= 0 ? f(rec[kL].sp * 3.6) : '-', drs: (kL >= 0 ? '' : '>') + f(((kL >= 0 ? kL : rec.length - 1) - k0 + 1) * DT, 2), v05: f(at(0.5).sp * 3.6), v2: f(at(2).sp * 3.6), rav: f(rav, 2), ud: hits, sk: f(c.dmg * 100) };
}
const rows = [];
const cases = process.argv[2] === 'vse' ? [[15, 120], [15, 200], [30, 120], [30, 200]] : [[30, 200]];
for (const [th, kmh] of cases) for (const tr of ['asfalt', 'trava', 'bathurst', 'bathurstGora', 'spa']) for (const noDebris of [false, true]) rows.push(run({ tr, th, kmh, noDebris }));
console.table(rows);
if (process.argv[2] === 'vse') { const r2 = []; for (const [th, kmh] of cases) for (const dmg of [0, 1]) r2.push(run({ tr: 'asfalt', th, kmh, dmg })); console.table(r2); }
