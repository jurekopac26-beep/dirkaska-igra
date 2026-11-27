'use strict';
// fizika-6, krog 27. 11.: primerjava dveh dreves po prizorih. Bere izpisa kolo2.js (IZPIS=<datoteka>) z drevesa pred spremembo in po njej
// in pove, v koliko zadetkih je izid (hitrost in vrtenje avta, hitrost in vrtenje kolesa, poškodba) enak do zadnjega bita in kje se razlikuje.
// Razredi so po drevesu po spremembi: dotik se ne zapira (vn <= 0), met vstran manjši od polnega, poln met.
// Zagon: IZPIS=pred.txt TRKI_SNAP=<drevo pred> N=12000 SEED=3 node kolo2.js > /dev/null
//        IZPIS=po.txt N=12000 SEED=3 node kolo2.js > /dev/null
//        node primerjaj.js pred.txt po.txt
const fs = require('fs');
const rd = (f) => { const m = new Map(); for (const l of fs.readFileSync(f, 'utf8').split('\n')) { if (!l) continue; const a = l.split(' '); m.set(a[0], a); } return m; };
const A = rd(process.argv[2]), B = rd(process.argv[3]), r3 = (x) => +x.toFixed(3);
const mk = () => ({ zadetkov: 0, enako: 0, drugace: 0, dvAvtoMax: 0, dwAvtoMax: 0, dvKoloMax: 0 }), S = { 'ne zapira': mk(), 'met manjsi': mk(), 'poln met': mk() };
let samoPred = 0, samoPo = 0, varovalo = 0;
for (const k of A.keys()) if (!B.has(k)) samoPred++;
for (const [k, b] of B) {
  const a = A.get(k); if (!a) { samoPo++; continue; }
  const vn = +b[1], kk = +b[2], k0 = +b[3], s = S[!(vn > 0) ? 'ne zapira' : kk < k0 * (1 - 1e-12) ? 'met manjsi' : 'poln met']; s.zadetkov++;
  if (b[4] !== '-') varovalo++;
  let same = a[1] === b[1]; for (let i = 5; i <= 11; i++) if (a[i] !== b[i]) same = false;
  if (same) { s.enako++; continue; }
  s.drugace++;
  s.dvAvtoMax = Math.max(s.dvAvtoMax, Math.hypot(a[5] - b[5], a[6] - b[6])); s.dwAvtoMax = Math.max(s.dwAvtoMax, Math.abs(a[7] - b[7])); s.dvKoloMax = Math.max(s.dvKoloMax, Math.hypot(a[8] - b[8], a[9] - b[9]));
}
for (const k of Object.keys(S)) { const s = S[k]; s.dvAvtoMax = r3(s.dvAvtoMax); s.dwAvtoMax = r3(s.dwAvtoMax); s.dvKoloMax = r3(s.dvKoloMax); console.log(k.padEnd(12), JSON.stringify(s)); }
console.log('skupaj'.padEnd(12), JSON.stringify({ pred: A.size, po: B.size, samoPred, samoPo, varovalo }));
