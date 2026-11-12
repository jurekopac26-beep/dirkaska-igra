// No spare wheel on any vehicle (the user's decision of 12. 11. 2026 through Matej, board #382, comment 6812399354: »avtom ne dodajaj
// rezervnega kolesa, … to smo ukinl da lahko zamenjas kolo, sedaj si ves cas neunicljiv ko pa guma odpade je pa konec igre«;
// docs/odlocitve.md, »Avti«). The tyres KAMEN and PEŠČENJAK carry behind the cab stay ordinary parts, MEDVED's and VRAN's are their
// tailgates' (the sub-range 'spare'), TUR's in its bed body, the TITAN CISTERNA's four on its rack the trailer's body: none of them
// carries spare: 1 (Core.SPARE, docs/deli.md »Rezervno kolo«, stays in the core unused), nor tl. A new vehicle must not add one.
//   node tests/rezervna-kolesa.test.js
'use strict';
const { loadCore } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

{
  const has = [];
  for (const M of C.MODELS) { const PT = C.partsOf(M); for (const k of Object.keys(PT)) if (PT[k].spare || PT[k].tl) has.push(M.id + '.' + k); }
  check(`no vehicle has a spare wheel (spare: 1, tl: 1) among its parts (${C.MODELS.length} vehicles)`, !has.length, has.join(' '));
}
{
  const want = { kamen: ['spareL', 'spareR'], pescenjak: ['spareL', 'spareR'] }, miss = [];
  for (const id of Object.keys(want)) { const M = C.MODELS.find(m => m.id === id), PT = M && C.partsOf(M); for (const k of want[id]) if (!PT || !PT[k]) miss.push(id + '.' + k); }
  check('KAMEN and PEŠČENJAK keep their tyres behind the cab as ordinary parts', !miss.length, miss.join(' '));
}
{
  const M = C.MODELS.find(m => m.id === 'medved'), PT = M && C.partsOf(M);
  check('MEDVED: its tyre is its tailgate\'s again (no part of its own)', PT && PT.tailgate && !PT.spare);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
