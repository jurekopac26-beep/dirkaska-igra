// (testi) after `node tests/golden.test.js --update --only=killar` or `node tests/races.test.js --update --only=killar` (which write only the
// real tracks' keys, so the frozen test tracks' keys and the order are lost): puts only one track's keys into the file as it was before.
//   node testi-prenesi-kljuce.js <file as it was (e.g. from git show HEAD:tests/golden/sim.json)> <the updated file> <out> [id, default killar]
'use strict';
const fs = require('fs'), [was, now, out, id = 'killar'] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(was, 'utf8')), B = JSON.parse(fs.readFileSync(now, 'utf8')), mine = (k) => k.split('/')[0] === id;
let ch = 0; for (const k of Object.keys(A)) if (mine(k)) { if (!(k in B)) throw new Error('the updated file has no ' + k); if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) ch++; A[k] = B[k]; }
for (const k of Object.keys(B)) if (mine(k) && !(k in A)) { A[k] = B[k]; ch++; }
fs.writeFileSync(out, JSON.stringify(A, null, 1) + '\n');
console.log(`${out}: ${Object.keys(A).length} keys, ${ch} of ${id} changed, the others and their order as they were`);
