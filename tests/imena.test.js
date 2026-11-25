// The forbidden-names test (CLAUDE.md, »Pravna varnost«): the texts the game shows carry only geographic names: no car make, company,
// tyre or oil maker, sponsor, venue, event or series, and never the name of a real person. The word list is tests/lib/prepovedana-imena.js
// (add a name there; never shorten it to make the test pass: rename the text in the game). Every text of the real tracks (the
// frozen test and pending tracks are skipped), every vehicle's name and description, every driver and championship, and the whole
// dictionary of js/lang.js (both the Slovenian keys and the English values) is scanned, each as a whole word without case and diacritics.
// The descriptive corner names of the circuits that once had a trademark or a person's name are in maketa-menija/README.md.
//   node tests/imena.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const W = require('./lib/prepovedana-imena.js');
const Lang = require(path.join(ROOT, 'js', 'lang.js'));
const C = loadCore();

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const rx = (w) => new RegExp('(^|[^a-z0-9])' + fold(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+') + '($|[^a-z0-9])');
const GROUPS = Object.keys(W);
const RX = {}; for (const g of GROUPS) RX[g] = W[g].map(w => [w, rx(w)]);
const hitsIn = (text) => { const f = fold(text), out = []; for (const g of GROUPS) for (const [w, re] of RX[g]) if (re.test(f)) out.push(g + ': ' + w); return out; };

// every string of an object tree (functions skipped), with where it came from
const strs = [];
const walk = (v, where, d = 0) => { if (d > 8 || v == null) return; if (typeof v === 'string') strs.push([where, v]);
  else if (typeof v === 'object') for (const k of Object.keys(v)) { if (typeof v[k] !== 'function') walk(v[k], where, d + 1); } };

const real = C.TRACKS.filter(t => !t.test && !t.pending);
for (const t of real) walk(t, 'proga ' + t.id);
for (const m of C.MODELS) walk({ name: m.name, desc: m.desc }, 'avto ' + m.id);
walk(C.DRIVER_NAMES, 'vozniki'); walk(C.CHAMPS, 'prvenstva'); walk(C.CATS, 'kategorije');
for (const k of Object.keys(Lang.EN)) { strs.push(['lang (ključ)', k]); strs.push(['lang (' + k.slice(0, 30) + ')', Lang.EN[k]]); }

check('seznam imen ni prazen in vsaka skupina ima vnose', GROUPS.length >= 4 && GROUPS.every(g => W[g].length >= 10), GROUPS.map(g => g + ' ' + W[g].length).join(', '));
check('pregledana so besedila prav vseh pravih prog, avtov in slovarja', real.length >= 60 && C.MODELS.length >= 20 && strs.length > 5000, real.length + ' prog, ' + C.MODELS.length + ' avtov, ' + strs.length + ' besedil');
// the test must not be vacuous: the matcher finds a planted name in each group, ignoring case and diacritics, and spares a longer word
check('iskalnik najde podtaknjeno ime v vsaki skupini', GROUPS.every(g => hitsIn('Right at ' + W[g][0].toUpperCase() + '!').length > 0));
check('iskalnik ne sproži na daljši besedi', hitsIn('Fordable crossing, Mercedesian').length === 0 && hitsIn('Total prost').length === 0);

const found = new Map();
for (const [where, s] of strs) for (const h of hitsIn(s)) { const k = where + ' | ' + h; if (!found.has(k)) found.set(k, s); }
for (const g of GROUPS) {
  const mine = [...found].filter(([k]) => k.split(' | ')[1].startsWith(g + ':'));
  check('nobenega imena iz skupine »' + g + '« v besedilih igre', mine.length === 0, mine.slice(0, 6).map(([k, s]) => k + ' (»' + s.slice(0, 60) + '«)').join('; ') + (mine.length > 6 ? ' … +' + (mine.length - 6) : ''));
}
console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
