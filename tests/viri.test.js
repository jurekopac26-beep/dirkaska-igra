// Viri prog (README.md, razdelek »Zasluge«): vsaka prava proga ima tam vir in licenco: podatke OpenStreetMap z licenco ODbL 1.0 in
// višinski model (Copernicus DEM, SRTM, USGS 3DEP, ArcticDEM, ...) z navedbo avtorja ali licence. Izjema so ročno narisane proge (HAND_DRAWN:
// vrstica mora reči, da so brez podatkov OpenStreetMap in višinskega modela). Zamrznjene proge (test: true, pending: true) so preskočene.
// Različica proge (variantOf) ima vire svoje osnove. Odločitev uporabnika 25. 11. 2026 (tabla #382, točka 6).
//   node tests/viri.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// the .md of the repository's root that holds the credits (the section »Zasluge«): found by its heading, not by name, so a change to it runs this
// test in GitHub's job Dokumenti (tests/run.js MD_TESTS) like fleet.test.js, not the whole circle
const readme = fs.readdirSync(ROOT).filter(f => /\.md$/.test(f)).map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).find(t => /\n## Zasluge\b/.test(t)) || '';
const from = readme.indexOf('\n## Zasluge');
const rest = readme.slice(from + 1);
const end = rest.indexOf('\n## ', 3);
const lines = (end < 0 ? rest : rest.slice(0, end)).split('\n').filter(l => l.startsWith('- '));

const HAND_DRAWN = new Set(['pikes']);   // (ročno narisana postavitev in višine, brez OSM in višinskega modela: docs/proge/pikes.md)
// višinski modeli, ki jih Zasluge poznajo (Copernicus DEM GLO-30, SRTM, 3DEP, ArcticDEM, avstrijski DGM, valonski MNT, lidar, Terrain Tiles)
const DEM = /copernicus dem|copernicus worlddem|srtm|3dep|arcticdem|digitales gelandemodell|modele numerique de terrain|lidar|terrain tiles/;

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

const C = loadCore();
const byId = Object.fromEntries(C.TRACKS.map(t => [t.id, t]));
const real = C.TRACKS.filter(t => !t.test && !t.pending);
// vrstice, ki omenjajo progo: ime kraja (sklonljivo: Livorno → Livorna, zato brez končnega samoglasnika) ali js/tracks/<id>.js
const mentions = (t) => {
  const base = byId[t.variantOf] || t;
  const city = fold(base.name.split(',')[0].replace(/\s*\(.*\)/, ''));
  const stem = city.length >= 4 && /[aeiou]$/.test(city) ? city.slice(0, -1) : city;
  const re = new RegExp('(^|[^a-z])' + stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return lines.filter(l => { const f = fold(l); return re.test(f) || f.includes('js/tracks/' + base.id + '.js'); });
};

check('korenski .md ima razdelek »Zasluge« z vrsticami', lines.length > 100, lines.length + ' vrstic');
check('proge za preverjanje: prave (ne test, ne pending)', real.length >= 60, real.length + ' prog');

const noLine = [], noOsm = [], noOdbl = [], noDem = [], noAuthor = [], badHand = [];
for (const t of real) {
  const base = byId[t.variantOf] || t;
  const ls = mentions(t), all = fold(ls.join('\n'));
  if (!ls.length) { noLine.push(t.id); continue; }
  if (HAND_DRAWN.has(base.id)) { if (!/brez podatkov openstreetmap/.test(all)) badHand.push(t.id); continue; }
  const osm = ls.filter(l => /openstreetmap/i.test(l));
  if (!osm.length) noOsm.push(t.id);
  else if (!osm.some(l => /ODbL 1\.0/.test(l) && /opendatacommons\.org\/licenses\/odbl/.test(l))) noOdbl.push(t.id);
  const dem = ls.filter(l => DEM.test(fold(l)));
  if (!dem.length) noDem.push(t.id);
  else if (!dem.some(l => /©|javna domena|licenca|produced using/i.test(l))) noAuthor.push(t.id);
}
check('vsaka prava proga je v »Zaslugah« imenovana', !noLine.length, noLine.join(', '));
check('ročno narisane proge (pikes, pikesg) pišejo, da so brez OpenStreetMap in višinskega modela', !badHand.length, badHand.join(', '));
check('vsaka prava proga ima vrstico z virom OpenStreetMap', !noOsm.length, noOsm.join(', '));
check('vir OpenStreetMap vsake prave proge ima licenco ODbL 1.0 (z navezavo)', !noOdbl.length, noOdbl.join(', '));
check('vsaka prava proga ima višinski model', !noDem.length, noDem.join(', '));
check('višinski model vsake prave proge ima avtorja ali licenco', !noAuthor.length, noAuthor.join(', '));

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
