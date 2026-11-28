'use strict';
// Povzetek parov iz zid13 (LINES=1) po kotu karoserije do ograje in hitrosti: node zid13-povzetek.js zid13-pred.log zid13-po.log
// Vir merila: docs/trki-realizem.md, »Resnični trki (odprti viri)«, vrstica »Tog betonski zid po kotih« (udarec repa 0,15–0,3 s po sprednjem vogalu).
const fs = require('fs');
const med = (A) => { if (!A.length) return null; const S = A.slice().sort((x, y) => x - y); return +S[Math.min(S.length - 1, Math.floor(0.5 * S.length))].toFixed(3); };
const row = (ime, P) => ({ skupina: ime, parov: P.length, medianaRazmika: med(P.map((p) => p.razmik)), v015do030: P.filter((p) => p.razmik >= 0.15 && p.razmik <= 0.3).length,
  medianaRazmerja: med(P.map((p) => p.zadaj / p.spredaj)), repHitrejsi: P.filter((p) => p.zadaj > p.spredaj).length, razmerjeNad15: P.filter((p) => p.zadaj > 1.5 * p.spredaj).length });
for (const f of process.argv.slice(2)) { const P = fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.startsWith('{"run"')).map((l) => JSON.parse(l));
  console.log(f); for (const r of [row('vsi', P), row('kot pod 10', P.filter((p) => p.kot < 10)), row('kot vsaj 10', P.filter((p) => p.kot >= 10)), row('kot 15-35', P.filter((p) => p.kot >= 15 && p.kot <= 35)),
    row('kot 15-35, 20-35 m/s', P.filter((p) => p.kot >= 15 && p.kot <= 35 && p.v >= 20 && p.v <= 35)), row('igralec', P.filter((p) => p.igralec)), row('tekmeci', P.filter((p) => !p.igralec))]) console.log(' ' + JSON.stringify(r)); }
