// I17 korak 4 (docs/hitro-nalaganje.md): js/tracks/glave.js, the heads of the lazy real tracks (tools/glave-prog.js). The file is what
// the tool writes; each head has its track's small fields exactly as the full file gives them (so the menu, the themes and the lists that
// read TRACK_DEFS at load time see the same as before) and its hd as a built track gives it; a lazy track's full file merged over its head
// leaves one def, the full one; no frozen track (CLAUDE.md »Testne proge«) has a head; index.html loads glave.js before the track scripts
// and each head's full file only as a lazy link.
//   node tests/glave-prog.test.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const G = require('../tools/glave-prog.js');
const { loadCore } = require('./lib/core.js');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const check = (name, ok, detail) => { if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail && !ok ? ' — ' + detail : ''}`); };

const cur = fs.readFileSync(path.join(ROOT, G.OUT), 'utf8');
check('js/tracks/glave.js is what tools/glave-prog.js writes', cur === G.build(ROOT), 'node tools/glave-prog.js');

const ctx = vm.createContext({}); vm.runInContext(cur, ctx);
const heads = vm.runInContext('TRACK_DEFS', ctx), order = vm.runInContext('TRACK_ORDER', ctx);
const { defs } = G.defsOf(ROOT), fz = G.frozen(ROOT), full = (id) => defs.find(d => d.id === id);
check('every head is a real track (no test, pending or frozen one)', heads.every(h => h.head && !h.test && !h.pending && !fz.has(h.id)), heads.filter(h => fz.has(h.id)).map(h => h.id).join(','));
const wrong = [];
for (const h of heads) {
  const d = full(h.id); if (!d) { wrong.push(h.id + ': no full file'); continue; }
  for (const k of Object.keys(h)) if (k !== 'head' && k !== 'hd' && JSON.stringify(h[k]) !== JSON.stringify(d[k])) wrong.push(h.id + '.' + k);
  for (const k of Object.keys(d)) if (typeof d[k] !== 'function' && JSON.stringify(d[k]).length <= G.HEAD_MAX && !(k in h)) wrong.push(h.id + '.' + k + ' missing');
}
check('each head has its track\'s small fields as the full file gives them', !wrong.length, wrong.slice(0, 8).join(', '));
check('TRACK_ORDER has every track once', order.length === new Set(order).size && defs.every(d => order.includes(d.id)));

const C = loadCore(ROOT), hdWrong = [];
for (const h of heads) {
  const d = C.TRACKS.filter(x => x.id === h.id);
  if (d.length !== 1 || d[0].head) { hdWrong.push(h.id + ': not one full def'); continue; }
  const T = new C.Track(d[0]), r = (x) => Math.round(x * 1000) / 1000;
  if (h.hd.len !== r(T.len) || h.hd.race !== r(T.raceLen) || h.hd.qb !== r(T.qualiBack()) || h.hd.nc !== T.corners.length) hdWrong.push(h.id + '.hd');
}
check('a full file merged over its head is one full def; hd is what its built track gives', !hdWrong.length, hdWrong.join(', '));
// the career's path (js/kariera.js, Kariera.pot: the cups by the tracks' km) is the same from the heads as from the full files (hd.km)
const K = require('../js/kariera.js'), byHead = new Map(heads.map(h => [h.id, h]));
check('Kariera.pot from the heads (hd.km) is the one from the full files', JSON.stringify(K.pot(defs.map(d => byHead.get(d.id) || d), C.CATS)) === JSON.stringify(K.pot(defs, C.CATS)));
check('Core.TRACKS keeps the order of TRACK_ORDER', C.TRACKS.map(d => d.id).join() === order.filter(id => C.TRACKS.some(d => d.id === id)).join());

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const at = (re) => { const m = re.exec(html); return m ? m.index : -1; };
const g = at(/<script\b[^>]*src="js\/tracks\/glave\.js/), first = at(/<script\b[^>]*src="js\/tracks\/(?!glave)/);
check('index.html loads glave.js before the track scripts', g >= 0 && (first < 0 || g < first));
const notLazy = heads.filter(h => !new RegExp('<link rel="x-lazy-script" data-lazy="proga-' + h.id + '" href="js/tracks/').test(html) || new RegExp('<script\\b[^>]*src="js/tracks/' + h.id + '\\.js').test(html)).map(h => h.id);
check('each head\'s full file is only a lazy link (data-lazy="proga-<id>")', !notLazy.length, notLazy.join(','));

console.log(bad ? `FAIL ${bad}` : 'glave-prog OK');
process.exit(bad ? 1 : 0);
