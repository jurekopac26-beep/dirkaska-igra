// Svetovi, ki se naložijo šele ob potrebi (I17, korak 5, docs/hitro-nalaganje.md; tools/svet-odvisnosti.mjs): index.html ima lene
// povezave (<link rel="x-lazy-script" data-lazy="svet-<ime>" data-svet="<teme>" href>, ključi za js/leno.js) natanko za datoteke, ki jih orodje izračuna iz kode svetov; lena je samo
// datoteka, ki jo rabijo samo prave proge (zamrznjene, testne in proge na odločanju ostanejo ob zagonu, CLAUDE.md »Testne proge«); lena
// datoteka rabi samo datoteke ob zagonu in lene pred seboj za iste teme; vsaka lena datoteka spada vsaj k eni pravi progi.
//   node tests/svet-odvisnosti.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./lib/core.js');

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } };
(async () => {
  const T = await import(path.join(ROOT, 'tools/svet-odvisnosti.mjs'));
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const M = T.manifest(html), tr = T.tracks();
  ok(!M.problems.length, 'odvisnosti lenih datotek: ' + M.problems.join('; '));
  ok(T.rewrite(html) === html, 'index.html: lene povezave niso, kot jih izračuna orodje (node tools/svet-odvisnosti.mjs --write)');
  ok(M.lazy.length > 0, 'nobena datoteka sveta ni lena');
  // povezave v index.html: vsaka lena ima svoje teme, nobena ni hkrati <script src>
  for (const f of M.lazy) {
    ok(!html.includes(`<script src="${f}"`), f + ': lena, a v index.html še <script src>');
    ok(M.themes[f] && M.themes[f].length, f + ': lena brez proge');
    ok(html.includes(`data-lazy="${T.lazyKey(f)}" data-svet=`), f + ': lena brez ključa ' + T.lazyKey(f) + ' (js/leno.js)');
  }
  // zamrznjene proge: vse njihove datoteke ob zagonu
  const A = T.analyse(html);
  for (const [id, t] of Object.entries(tr)) if (t.frozen) {
    const f = A.themes[t.theme]; if (!f) continue;
    for (const x of A.closure(f)) ok(!M.lazy.includes(x), id + ' (zamrznjena): ' + x + ' je lena');
  }
  // prave proge: njihove lene datoteke v vrstnem redu index.html, s temo proge v data-svet
  for (const [id, t] of Object.entries(M.tracks)) for (const f of t.lazy) ok(M.themes[f].includes(t.theme), id + ': ' + f + ' brez teme ' + t.theme);
  // World.need in World.needAll v js/world.js; World.build vrže napako, ko svet ni naložen
  const w = fs.readFileSync(path.join(ROOT, 'js/world.js'), 'utf8');
  ok(/return \{ build, need, needAll,/.test(w), 'js/world.js: World.need, World.needAll');
  ok(/if \(!EXT\[THEME\] && lazyTags\(THEME\)\.length\) throw/.test(w), 'js/world.js: World.build brez naloženega sveta ne gradi splošnega sveta');
  console.log(fails ? `svet-odvisnosti: ${fails} FAIL` : `svet-odvisnosti: OK (${M.lazy.length} lenih, ${Object.keys(M.tracks).length} pravih prog)`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL ' + (e && e.stack || e)); process.exit(1); });
