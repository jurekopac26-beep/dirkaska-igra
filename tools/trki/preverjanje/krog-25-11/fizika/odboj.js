'use strict';
// dosezena povrnitev in trenje v Realisticni (cv 6) proti tabeli virov (docs/trki-realizem.md, "Resnicni trki (odprti viri)"):
//   avto-avto celno, sredisce v sredisce: e = hitrost razmika / hitrost zblizevanja (klici Core.carCollide s premikom po korakih, brez sil koles)
//   avto-zid pravokotno z nosom: odbojna hitrost (klici Core.wallCollide s premikom po korakih)
//   trenje: razmerje vzdolznega in pravokotnega sunka pri oplazenju (en klic)
// Nic v repozitoriju.
const { SNAP, MAIN, load } = require('./lib.js');
const ROOT = process.env.ROOT === 'main' ? MAIN : SNAP, CV = process.env.CV != null ? +process.env.CV : 6;
const { C, handling } = load(ROOT);
C.setTest(CV ? { cv: CV } : null);
const H = handling(C, 'cs'), DT = 1 / 120, r3 = (x) => +x.toFixed(3);
const MS = C.MODELS.filter((m) => !m.trailer).slice().sort((a, b) => a.mass - b.mass), LIGHT = MS[0].id, HEAVY = MS[MS.length - 1].id;
const cache = {};
function car(id, slot) { const k = id + slot; if (cache[k]) return cache[k]; const c = H.mkCar(id, { v: 0 }); c.isPlayer = false; return (cache[k] = c); }
function reset(c, x, z, h, vx, vz) { c.place(x, z, h); c.vx = vx; c.vz = vz; c.w = 0; c.xgl = 0; c.xglT = 0; c.csKc = 0; c.cSx = 0; c.cSz = 0; c.cSr = null; c.air = 0; c.rl = null; c.hitCar = 0; c.fxCar = 0; c.hitWall = 0; c.fxWall = 0;
  c.dmg = 0; c.dz = [0, 0, 0, 0]; c.cd = [0, 0, 0, 0]; c.dents = []; c.lost = {}; c.detach = []; c.flat = 0; c.fuelKg = 0; c.px = x; c.pz = z; }
const move = (c) => { c.px = c.x; c.pz = c.z; c.x += c.vx * DT; c.z += c.vz * DT; c.h += c.w * DT; };
// ---- avto-avto celno
console.log(`== avto-avto celno (${process.env.ROOT || 'snap'}, cv ${CV}); vir: pod 5 km/h 0,4-0,7; 7-16 km/h 0,15-0,35; 25-60 km/h 0,05-0,2; 100 km/h in vec 0-0,1, odbojna hitrost 3-10 km/h`);
for (const [ia, ib] of [['rally', 'rally'], [LIGHT, HEAVY]]) {
  const row = [];
  for (const kmh of [3.6, 5, 10, 16, 30, 60, 100, 160, 240]) {
    const v = kmh / 3.6, a = car(ia, 'a'), b = car(ib, 'b');
    reset(a, -(a.m.len / 2 - 0.01), 0, 0, v / 2, 0); reset(b, b.m.len / 2 - 0.01, 0, Math.PI, -v / 2, 0);
    let calls = 0, imps = 0;
    for (let k = 0; k < 40; k++) { const imp = C.carCollide(a, b); calls++; if (imp) imps++; if (b.vx - a.vx > 0 && !imp && k > 2) break; move(a); move(b); }
    const sep = b.vx - a.vx, ok = [a.vx, a.vz, a.w, b.vx, b.vz, b.w].every(Number.isFinite);
    row.push(`${kmh}: e ${r3(sep / v)} (razmik ${r3(sep * 3.6)} km/h, sunkov ${imps}${ok ? '' : ', NaN'})`);
  }
  console.log(`  ${ia} (${C.MODELS.find((m) => m.id === ia).mass} kg) / ${ib} (${C.MODELS.find((m) => m.id === ib).mass} kg)\n    ` + row.join('\n    '));
}
// ---- avto-zid pravokotno
const pts = []; for (let x = 0; x <= 4000; x += 100) pts.push([x, 0]);
const T = new C.Track({ id: 'fizika-cesta', name: 'Ravnina, Preizkus', open: true, laps: 1, halfWidth: 6, points: pts, start: [300, 0], finish: [3700, 0] });
const q0 = T.query(1000, 0, -1, {}), tx = -q0.nz, tz = q0.nx;
const _q = {};
function maxPen(c) { const ch = Math.cos(c.h), sh = Math.sin(c.h); let p = -1e9; for (const P of c.corners) { const q = T.query(c.x + P[0] * ch - P[1] * sh, c.z + P[0] * sh + P[1] * ch, c.q.i, _q); p = Math.max(p, q.d - q.br, -q.bl - q.d); } return p; }
function wallRun(id, kmh, deg) {
  const c = car(id, 'w'), v = kmh / 3.6, a = deg * Math.PI / 180, hx = Math.cos(a) * tx + Math.sin(a) * q0.nx, hz = Math.cos(a) * tz + Math.sin(a) * q0.nz, h = Math.atan2(hz, hx), ch = Math.cos(h), sh = Math.sin(h);
  let ext = -1e9; for (const P of c.corners) ext = Math.max(ext, (P[0] * ch - P[1] * sh) * q0.nx + (P[0] * sh + P[1] * ch) * q0.nz);
  const d = q0.br - ext + 0.02; reset(c, 1000 + q0.nx * d, q0.nz * d, h, v * hx, v * hz); c.q = {}; T.query(c.x, c.z, -1, c.q);
  const vn0 = c.vx * q0.nx + c.vz * q0.nz, vt0 = c.vx * tx + c.vz * tz; let first = null, hits = 0, dmg = 0;
  for (let k = 0; k < 60; k++) {
    const s = [c.vx, c.vz, c.w]; const hit = C.wallCollide(c, T, false, null, DT);
    if (c.vx !== s[0] || c.vz !== s[1] || c.w !== s[2]) { hits++; if (!first) first = { dn: (c.vx - s[0]) * q0.nx + (c.vz - s[1]) * q0.nz, dt: (c.vx - s[0]) * tx + (c.vz - s[1]) * tz }; }
    if (maxPen(c) < -0.05 && c.vx * q0.nx + c.vz * q0.nz <= 0) break;
    move(c); T.query(c.x, c.z, c.q.i, c.q);
  }
  const vn1 = c.vx * q0.nx + c.vz * q0.nz, vt1 = c.vx * tx + c.vz * tz, ok = [c.vx, c.vz, c.w, c.x, c.z].every(Number.isFinite);
  return { kmh, deg, vn0: r3(vn0), odbojKmh: r3(-vn1 * 3.6), e: r3(-vn1 / vn0), hitrostPo: r3(Math.hypot(vn1, vt1) / v), w: r3(c.w), sunkov: hits, trenjePrviSunek: first && first.dn ? r3(Math.abs(first.dt / first.dn)) : null, skoda: r3(c.dmg), nan: !ok };
}
console.log('== avto-zid pravokotno z nosom; vir: odbojna hitrost 3-7 km/h pri 50 in 3-10 km/h pri 100 km/h; odboj kot avto-avto');
for (const id of ['rally', LIGHT, HEAVY]) for (const kmh of [5, 10, 16, 30, 50, 100, 200]) console.log('  ' + id.padEnd(8) + JSON.stringify(wallRun(id, kmh, 90)));
console.log('== avto-zid oplazenje, prvi sunek: razmerje vzdolznega in pravokotnega sunka; vir: karoserija ob beton 0,15-0,4, ob jekleno ograjo 0,2-0,4');
for (const id of ['rally', HEAVY]) for (const [kmh, deg] of [[100, 5], [100, 10], [100, 20], [100, 25], [110, 20], [200, 10], [100, 45]]) console.log('  ' + id.padEnd(8) + JSON.stringify(wallRun(id, kmh, deg)));
// ---- trenje avto-avto: bok ob bok, vzdolzna razlika hitrosti in bocno zapiranje (en klic)
console.log('== avto-avto bok ob bok, en klic: razmerje vzdolznega in bocnega sunka; vir: avto-avto 0,3-0,6');
for (const [dvx, vz] of [[10, 1], [10, 3], [30, 1], [3, 3], [1, 5], [10, 0.3]]) {
  const a = car('rally', 'a'), b = car('rally', 'b');
  reset(a, 0, 0, 0, 30 + dvx, vz); reset(b, 0, a.m.wid / 2 + b.m.wid / 2 - 0.02, 0, 30, 0);
  const imp = C.carCollide(a, b), dx = a.vx - (30 + dvx), dz = a.vz - vz;
  console.log('  ' + JSON.stringify({ razlikaVzdolz: dvx, zapiranje: vz, sunek: !!imp, dvx: r3(dx), dvz: r3(dz), razmerje: dz ? r3(Math.abs(dx / dz)) : null, wA: r3(a.w), wB: r3(b.w) }));
}
