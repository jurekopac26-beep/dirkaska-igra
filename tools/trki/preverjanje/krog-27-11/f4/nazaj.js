// fizika-4, krog 27. 11.: pravokoten trk v ograjo, koliko se avto po odboju odkotali nazaj (vir, docs/trki-realizem.md, »Resnični trki (odprti
// viri)«, vrstica »Zid pravokotno, 50 in 100 km/h«: odbojna hitrost 3–7 km/h pri 50 in 3–10 km/h pri 100 km/h; nazaj največ 0,5–2 m).
// Prizor in korak sta od tools/trki/zid.js (njegov del pred izpisom se tu izvede nespremenjen: ista cesta, postavitev in koraki igre, cv 6, brez vnosa),
// doda se samo branje poti: nazaj = najgloblja lega ob ograji minus lega, ko avto obstane (pod 0,05 m/s) ali po SECS s.
// Zagon: node nazaj.js            številke iz js/core.js
//        WE0=0.2 WEV=6 node nazaj.js   druge številke ograje (KV.real.wall.e0, .eV) brez spremembe kode: stanje pred spremembo ali poskus
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..'), ZID = path.join(ROOT, 'tools', 'trki', 'zid.js');
const src = fs.readFileSync(ZID, 'utf8'), cut = src.indexOf('\nconst OUT = {');
if (cut < 0) throw new Error('zid.js: ne najdem začetka izpisa');
process.argv = [process.argv[0], ZID, '--cv', '6', '--json'];
const Z = new Function('require', '__dirname', 'module', src.slice(0, cut) + '\nreturn { crash, road, C, ORD, LIGHT, TRUCK, DT };')(require, path.dirname(ZID), { exports: {} });
const E = process.env, W = Z.C.KV.real.wall, SECS = +(E.SECS || 20);
if (E.WE0) W.e0 = +E.WE0; if (E.WEV) W.eV = +E.WEV; if (E.WE1) W.e1 = +E.WE1;
console.log('ograja (KV.real.wall): e0 ' + W.e0 + ', e1 ' + W.e1 + ', eV ' + W.eV + ', eT ' + W.eT + '; cv 6, 90 st, brez vnosa, ' + SECS + ' s');
console.log('avto tla kmh | odboj km/h (ob odhodu) | nazaj m | obstane po s');
for (const tla of ['asfalt', 'trava']) { const T = Z.road(tla), i = T.nearestIdx(750, 0);
  for (const id of [Z.ORD, Z.LIGHT, Z.TRUCK]) for (const kmh of (E.KMH || '30,50,60,100').split(',').map(Number)) {
    const r = Z.crash({ T, i, side: 1, id, phys: 'cs', th: 90, kmh, inp: 'nic', tla, mode: 'sam', secs: SECS, keep: true });
    const F = r.F, p = r.rec.map((q) => q.x * F.mx + q.z * F.mz); let pm = -Infinity, km = 0, ks = -1;
    for (let k = 0; k < p.length; k++) if (p[k] > pm) { pm = p[k]; km = k; }
    for (let k = km; k < p.length; k++) if (Math.hypot(r.rec[k].vx, r.rec[k].vz) < 0.05) { ks = k; break; }
    const ke = ks >= 0 ? ks : p.length - 1;
    console.log([id, tla, kmh].join(' ') + ' | ' + (r.vL == null ? '-' : r.vL.toFixed(2)) + ' | ' + (pm - p[ke]).toFixed(2) + ' | ' + (ks >= 0 ? ((ks - km) * Z.DT).toFixed(2) : '> ' + SECS));
  } }
