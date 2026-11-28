'use strict';
// Enkratna predelava B -> C v wt-f1/js/core.js (globina drugih vogalov = plitvejsa od ravne crte in crte ograje)
const fs = require('fs'), f = process.argv[2]; let s = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('sidro ' + n + 'x: ' + a.slice(0, 80)); s = s.replace(a, b); };
rep("for (let j = 0; j < P.length; j++) { const d = D ? D[j] : (P[j][0] * ch - P[j][1] * sh - wx) * nx + (P[j][0] * sh + P[j][1] * ch - wz) * nz; if (j !== k && d < dm) dm = d; }",
    "for (let j = 0; j < P.length; j++) { const l = (P[j][0] * ch - P[j][1] * sh - wx) * nx + (P[j][0] * sh + P[j][1] * ch - wz) * nz, d = D ? Math.max(D[j], l) : l; if (j !== k && d < dm) dm = d; }");
rep("t = clamp(1 - ((j === k ? 0 : D ? D[j] : (ox - wx) * nx + (oz - wz) * nz) - dm) / cr, 0, 1);",
    "l = (ox - wx) * nx + (oz - wz) * nz, t = clamp(1 - ((j === k ? 0 : D ? Math.max(D[j], l) : l) - dm) / cr, 0, 1);");
rep("  // How far behind the other corners are: on the road's side barrier by the barrier's own line at each corner (wallRoom: one that narrows or\n  // bends is not the straight line through corner k, and a corner that line puts in it may stand a car's length clear of it), elsewhere along\n  // the normal at corner k. → 1 the push given, 0 none (wallCollide: no push, no blow, so no dent of it either)",
    "  // How far behind the other corners are: along the normal at corner k, but on the road's side barrier no deeper than the barrier's own line\n  // at each corner puts it (wallRoom: a barrier that narrows or bends away is not the straight line through corner k, and a corner that line\n  // puts in it may stand a car's length clear of it). → 1 the push given, 0 none (wallCollide: no push, no blow, so no dent of it either)");
fs.writeFileSync(f, s); console.log('ok');
