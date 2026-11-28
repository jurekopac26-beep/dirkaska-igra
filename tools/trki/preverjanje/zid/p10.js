// p10: where on the real (not test) tracks does the asphalt (or paving) reach the outside barrier of a bend? metres of bend (R < 250 m) with the
// outside barrier within 1 m of the road surface's edge, and the hard surface right up to it
'use strict';
const L = require('./lib.js'), { C, D, wrap } = L;
const rows = [];
for (const def of C.TRACKS) { if (def.test) continue; let T; try { T = new C.Track(def); } catch (e) { continue; }
  if (T.free) continue; const N = T.N, ds = T.len / N; let bend = 0, near = 0, hard = 0, best = null, run = 0, runS = 0, bestRun = 0, bestAt = 0, bestR = 0, turnSum = 0, bestTurn = 0;
  for (let i = 0; i < N; i++) { const j = (i + 1) % N, dh = wrap(T.hd[j] - T.hd[i]), R = Math.abs(dh) > 1e-6 ? ds / Math.abs(dh) : 1e9; if (R > 250) { run = 0; turnSum = 0; continue; }
    bend += ds; const side = dh > 0 ? -1 : 1, B = side > 0 ? T.br[i] : T.bl[i], w = T.wAt ? T.wAt(i) : T.w, gap = B - w;
    const q = T.query(T.px[i] + T.nx[i] * side * (B - 0.4), T.pz[i] + T.nz[i] * side * (B - 0.4), i, {}), sf = T.surface(q), isHard = sf === 0 || sf === 1 || sf === 4 || sf === 7;
    if (isHard) { hard += ds; run += ds; turnSum += Math.abs(dh); if (run > bestRun) { bestRun = run; bestAt = i; bestTurn = turnSum; } } else { run = 0; turnSum = 0; }
    if (gap < 1) near += ds; }
  rows.push({ id: def.id, ime: def.name, pending: !!def.pending, 'dolzina m': T.len.toFixed(0), 'ovinki R<250 m': bend.toFixed(0), 'zunanja ograja <1 m od roba': near.toFixed(0), 'trda podlaga do zunanje ograje m': hard.toFixed(0), '% ovinkov': (hard / Math.max(1, bend) * 100).toFixed(0), 'najdaljsi tak ovinek m': bestRun.toFixed(0), 'zasuk deg': (bestTurn * D).toFixed(0) }); }
rows.sort((a, b) => b['trda podlaga do zunanje ograje m'] - a['trda podlaga do zunanje ograje m']);
console.log('pravih prog:', rows.length); console.table(rows.slice(0, 22));
const tot = rows.reduce((a, r) => a + +r['trda podlaga do zunanje ograje m'], 0), totB = rows.reduce((a, r) => a + +r['ovinki R<250 m'], 0);
console.log('skupaj: trda podlaga do zunanje ograje v ovinkih', tot.toFixed(0), 'm od', totB.toFixed(0), 'm ovinkov =', (tot / totB * 100).toFixed(0), '%; prog z vsaj 200 m:', rows.filter(r => +r['trda podlaga do zunanje ograje m'] >= 200).length);
