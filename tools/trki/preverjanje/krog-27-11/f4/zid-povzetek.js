// fizika-4, krog 27. 11.: primerjava dveh matrik ograje (node tools/trki/zid.js --cv 6 --del matrika --json > <datoteka>) pred in po spremembi.
// Zagon: node zid-povzetek.js <pred.json> <po.json>. Skupina = kot x hitrost x vnos (povprecje cez fiz, avto, tla; 12 prizorov); stolpci so
// zid.js-ovi: ohr = vL / v0 (delez hitrosti ob odhodu od ograje), izh izhodni kot (st), eNL dejanski odboj ob odhodu, dh zasuk nosu (st),
// n locenih dotikov, drs cas na ograji (s), nazaj hitrost stran od ograje 0,5 s po zadetku (km/h). Vsak stolpec: pred > po. Na koncu stevci in sha256 obeh matrik.
'use strict';
const fs = require('fs'), crypto = require('crypto');
const [fa, fb] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(fa, 'utf8')).matrika, B = JSON.parse(fs.readFileSync(fb, 'utf8')).matrika;
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const num = (x) => typeof x === 'number' && isFinite(x);
const avg = (rows, f) => { const v = rows.map(f).filter(num); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
const fx = (x, d) => x == null ? '-' : x.toFixed(d);
const key = (r) => [r.kot, r.kmh, r.vnos].join('|');
const groups = new Map();
A.forEach((r, i) => { const k = key(r); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); });
const cols = [['ohr', (r) => num(r.vL) && r.v0 ? r.vL / r.v0 : null, 3], ['izh', (r) => r.izh, 2], ['eNL', (r) => r.eNL, 3], ['dh', (r) => r.dh, 2],
  ['n', (r) => r.n, 2], ['drs', (r) => r.drs, 2], ['nazaj', (r) => r.nazaj, 2]];
console.log('kot kmh vnos  | ' + cols.map((c) => c[0] + ' pred > po').join(' | ') + ' | odhodov pred > po');
for (const [k, idx] of groups) {
  const a = idx.map((i) => A[i]), b = idx.map((i) => B[i]);
  const [kot, kmh, vnos] = k.split('|');
  console.log([kot.padStart(3), kmh.padStart(3), vnos.padEnd(5)].join(' ') + ' | ' + cols.map((c) => fx(avg(a, c[1]), c[2]) + ' > ' + fx(avg(b, c[1]), c[2])).join(' | ')
    + ' | ' + a.filter((r) => num(r.vL)).length + ' > ' + b.filter((r) => num(r.vL)).length);
}
const cnt = (M, f) => M.filter(f).length;
const st = (ime, f) => console.log(ime + ': ' + cnt(A, f) + ' > ' + cnt(B, f));
st('prizorov', () => true); st('prilepljen (lep)', (r) => r.lep); st('dosegel ograjo na drugi strani (dz)', (r) => num(r.dz)); st('padel (fell)', (r) => r.fell);
st('prevrnitev mogoca (prv)', (r) => r.prv); st('ni se zravnal v 7 s (rav -)', (r) => !num(r.rav));
const mx = (M, f) => Math.max(...M.map(f).filter(num));
console.log('najvecji popravek lege (pop, cm): ' + fx(mx(A, (r) => r.pop), 2) + ' > ' + fx(mx(B, (r) => r.pop), 2) + '; najdlje cez crto (cez, cm): ' + fx(mx(A, (r) => r.cez), 2) + ' > ' + fx(mx(B, (r) => r.cez), 2)
  + '; najvec utripanja (utr, /s): ' + fx(mx(A, (r) => r.utr), 2) + ' > ' + fx(mx(B, (r) => r.utr), 2) + '; najvecji zasuk (w, st/s): ' + fx(mx(A, (r) => r.w), 1) + ' > ' + fx(mx(B, (r) => r.w), 1));
console.log('skoda (sk, %), povprecje: ' + fx(avg(A, (r) => r.sk), 3) + ' > ' + fx(avg(B, (r) => r.sk), 3) + '; najtrsi zadetek (hit, m/s), povprecje: ' + fx(avg(A, (r) => r.hit), 3) + ' > ' + fx(avg(B, (r) => r.hit), 3));
let ch = 0; for (let i = 0; i < A.length; i++) if (JSON.stringify(A[i]) !== JSON.stringify(B[i])) ch++;
console.log('spremenjenih prizorov: ' + ch + ' od ' + A.length);
console.log('sha256 pred ' + sha(fa) + ' (' + fs.statSync(fa).size + ' bajtov)');
console.log('sha256 po   ' + sha(fb) + ' (' + fs.statSync(fb).size + ' bajtov)');
