// The real tracks' own settings and world parts in their own files (docs/razdelitev-prog.md, tools/razdeli-proge.mjs), so that branches
// which add or change different tracks do not meet in the same line: no real track's entry is left in the shared lists (js/render.js
// THEMES and SPLIT, js/game.js EN_NAME and RAIN_P, js/world.js CLOUD_TH, ROAD_WEAR, GRASS_NAT, LAWN, BB_CLASSIC and the grids World.build
// frees, js/world-zivali.js ZIV) and Bathurst's, Rio's and Crystal Palace's own parts are in js/world-<theme>.js, not in js/world-rbring.js.
// On a copy, as a branch from before the split brings it: an entry put back into a list goes to its track's file (the same value quietly,
// another only with --seznam, the list's, or --proga, the file's, for one track --seznam=<id>), THEMES or SPLIT alone (a merge keeps one
// half) takes the other half from the file, a new track's entry makes the block in its file, a grid freed the old way becomes World.keep in
// its world's file, a part of Crystal Palace's added to js/world-rbring.js goes to js/world-cpalace.js, of Rio's to js/world-rio.js (a destructured const too, with the helpers it
// uses, also through a spread), what js/world-rbring.js reads of a part is exported by it (not a let), a copy of a small helper follows the
// shared file; a second run changes nothing. The anchors are the lists' declarations, not a test track's entry (they go before Google Play).
// Rio has been a test track since 5. 11. 2026 (CLAUDE.md »Testne proge«): the tool still splits its parts, but names its file by its theme
// then (only a real track's name goes in the prologue), so the part added and changed the old way, whole file compared, is Crystal Palace's.
//   node tests/razdelitev.test.js
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.join(__dirname, '..'), TOOL = path.join(REPO, 'tools', 'razdeli-proge.mjs');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail && !ok ? ' — ' + detail : ''}`); };
const run = (root, ...args) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', env: Object.assign({}, process.env, root ? { RAZDELI_ROOT: root } : {}) });
const said = (r) => (r.stdout + r.stderr).trim().slice(0, 400);

// 1. the repository
{ const r = run(null, '--check'); check('the repository: no real track in the shared lists, the world parts in their files (tools/razdeli-proge.mjs --check)', r.status === 0, said(r)); }

// 2. a copy, with what a branch from before the split would bring
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'razdelitev-'));
try {
  const cp = (f) => { fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); fs.copyFileSync(path.join(REPO, f), path.join(tmp, f)); };
  cp('index.html');
  for (const f of fs.readdirSync(path.join(REPO, 'js/tracks'))) cp('js/tracks/' + f);
  for (const f of fs.readdirSync(path.join(REPO, 'js'))) if (/^(world[\w-]*|game|render)\.js$/.test(f)) cp('js/' + f);
  const rd = (f) => fs.readFileSync(path.join(tmp, f), 'utf8'), wr = (f, s) => fs.writeFileSync(path.join(tmp, f), s);
  const edit = (f, a, b) => { const s = rd(f); if (!s.includes(a)) throw new Error(`${f}: no »${a}«`); wr(f, s.replace(a, b)); };
  const lineOf = (f, re) => rd(f).split('\n').find(l => re.test(l)) || '';
  const putIn = (f, name, ents) => edit(f, `const ${name} = {`, `const ${name} = { ${ents},`);   // (entries at the start of a list, as the old way had them)
  const en0 = lineOf('js/game.js', /const EN_NAME = \{/), gn0 = lineOf('js/world.js', /const GRASS_NAT = \{/), rp0 = lineOf('js/game.js', /const RAIN_P = \{/);
  putIn('js/game.js', 'EN_NAME', "spa: 'Spa', livorno: 'Livorno'");   // (Spa's as it is in its file; Livorno's new)
  putIn('js/world.js', 'GRASS_NAT', 'spa: 0.85');
  edit('js/world.js', '    for (const k in KEEP)', "    if (THEME !== 'livorno') API.LV = null;                          // (and Livorno's)\n    for (const k in KEEP)");
  edit('js/world-rbring.js', '  function buildRbring(', "  function cpTest() { return T.len; }   // (a part of Crystal Palace's, added the old way)\n  function buildRbring(");
  let r = run(tmp);
  check('the old way brought back: the tool takes it (exit 0)', r.status === 0, said(r));
  check("EN_NAME: Spa's (the same as in its file) and Livorno's gone from js/game.js, the rest of it as it was", lineOf('js/game.js', /const EN_NAME = \{/) === en0, lineOf('js/game.js', /const EN_NAME = \{/).slice(0, 200));
  check("Livorno's English name in its file (say), in the block of its own settings", /^    say: 'Livorno',$/m.test(rd('js/tracks/livorno.js')) && rd('js/tracks/livorno.js').includes('tools/razdeli-proge.mjs'));
  check("GRASS_NAT: Spa's gone, the rest of it as it was", lineOf('js/world.js', /const GRASS_NAT = \{/) === gn0, lineOf('js/world.js', /const GRASS_NAT = \{/));
  check("the grid freed the old way: World.keep('LV', 'livorno') before World.ext.livorno, the line gone from World.build",
    /World\.keep\('LV', 'livorno'\);[^\n]*\n\s*World\.ext\.livorno =/.test(rd('js/world-livorno.js')) && !rd('js/world.js').includes("API.LV = null"));
  { const was = fs.readFileSync(path.join(REPO, 'js/world-cpalace.js'), 'utf8'), now = rd('js/world-cpalace.js'), add = now.split('\n').filter(l => l.includes('function cpTest()'));
    check("Crystal Palace's part added to js/world-rbring.js is in js/world-cpalace.js, the rest of it as it was (its prologue, exports)", add.length === 1 && now.split('\n').filter(l => l !== add[0]).join('\n') === was && !rd('js/world-rbring.js').includes('function cpTest()')); }
  r = run(tmp, '--check');
  check('a second run changes nothing (--check)', r.status === 0, said(r));
  // a value other than its file's: only with a choice
  putIn('js/game.js', 'RAIN_P', 'spa: 0.6');
  r = run(tmp);
  check("Spa's rain 0.6 in RAIN_P, 0.5 in its file: no choice, no change (exit 2)", r.status === 2 && lineOf('js/game.js', /const RAIN_P = /).includes('spa: 0.6'), said(r));
  r = run(tmp, '--proga');
  check('--proga: its file\'s 0.5 kept, the list\'s entry gone', r.status === 0 && /say: 'Spa', rainP: 0\.5,/.test(rd('js/tracks/spa.js')) && lineOf('js/game.js', /const RAIN_P = /) === rp0, said(r));
  putIn('js/game.js', 'RAIN_P', 'spa: 0.6');
  r = run(tmp, '--seznam');
  check("--seznam: the list's 0.6 in its file", r.status === 0 && /say: 'Spa', rainP: 0\.6,/.test(rd('js/tracks/spa.js')), said(r));
  // the choice for some tracks only: another's difference still stops it
  putIn('js/game.js', 'RAIN_P', 'spa: 0.7, nring: 0.9');
  r = run(tmp, '--seznam=spa');
  check("--seznam=spa: Nürburg's difference has no choice, no change (exit 2)", r.status === 2 && said(r).includes('nring.js rainP') && !said(r).includes('spa.js') && /say: 'Spa', rainP: 0\.6,/.test(rd('js/tracks/spa.js')), said(r));
  r = run(tmp, '--seznam=spa', '--proga=nring');
  check("--seznam=spa --proga=nring: Spa's 0.7 from the list, Nürburg's 0.45 kept, the list's entries gone", r.status === 0 && /say: 'Spa', rainP: 0\.7,/.test(rd('js/tracks/spa.js')) && /say: 'Nürburg', rainP: 0\.45,/.test(rd('js/tracks/nring.js')) && lineOf('js/game.js', /const RAIN_P = /) === rp0, said(r));
  // THEMES or SPLIT alone, as a merge with main brings them (the branch's side where it changed one, main's of the other): the other half from the file
  const LK = /^\s*look: \{/, lk0 = lineOf('js/tracks/spa.js', LK), [, base0, split0] = /look: (\{.*), split: (\[\[[^\]]*\], \[[^\]]*\]\]) \},/.exec(lk0) || [];
  const looks = (r) => ((r.stdout + r.stderr).match(/\.js look/g) || []).length;
  edit('js/render.js', '  const THEMES = {', `  const THEMES = {\n    spa: ${base0.replace(/fog: 0x[0-9a-f]+/, 'fog: 0x123456')} },`);
  r = run(tmp);
  check("THEMES.spa alone, its fog changed: only Spa's look differs, without its split (exit 2)", r.status === 2 && said(r).includes('spa.js look (brez split)') && looks(r) === 1, said(r));
  r = run(tmp, '--seznam=spa');
  let lk = lineOf('js/tracks/spa.js', LK);
  check("--seznam=spa: Spa's look with the list's fog, its split and comment as they were", r.status === 0 && lk.includes('fog: 0x123456') && lk.includes(`, split: ${split0} },`) && lk.endsWith(lk0.slice(lk0.indexOf('//'))), said(r) || lk);
  edit('js/render.js', '  const SPLIT = {', '  const SPLIT = {\n    spa: [[0.9, 1.0, 1.1], [1.1, 1.0, 0.9]],');
  r = run(tmp);
  check("SPLIT.spa alone, changed: only Spa's look.split differs (exit 2)", r.status === 2 && said(r).includes('spa.js look.split') && looks(r) === 1, said(r));
  r = run(tmp, '--seznam=spa');
  lk = lineOf('js/tracks/spa.js', LK);
  check("--seznam=spa: Spa's split from the list, the rest of its look as it was; a second run changes nothing", r.status === 0 && lk.includes('fog: 0x123456') && lk.includes(', split: [[0.9, 1.0, 1.1], [1.1, 1.0, 0.9]] },') && run(tmp, '--check').status === 0, said(r) || lk);
  // a part of Crystal Palace's changed the old way (in js/world-rbring.js, as a branch from before the split brings it): only with a choice
  edit('js/world-rbring.js', '  function buildRbring(', "  function cpTest() { return T.len + 1; }   // (a part of Crystal Palace's, changed the old way)\n  function buildRbring(");
  r = run(tmp);
  check("Crystal Palace's part changed the old way: no choice, no change (exit 2)", r.status === 2 && said(r).includes('world-cpalace.js cpTest') && rd('js/world-rbring.js').includes('T.len + 1') && !rd('js/world-cpalace.js').includes('T.len + 1'), said(r));
  r = run(tmp, '--seznam=cpalace');
  check('--seznam=cpalace: the changed part in js/world-cpalace.js, gone from js/world-rbring.js', r.status === 0 && rd('js/world-cpalace.js').includes('{ return T.len + 1; }') && !rd('js/world-cpalace.js').includes('{ return T.len; }') && !rd('js/world-rbring.js').includes('cpTest'), said(r));
  // what the shared builder reads of a part, and what it exported of it the old way: exported by the part, taken from API by the builder
  edit('js/world-rbring.js', '  function buildRbring(', '  function rbKart() { return rioKartGeo(); }   // (the builder reads a part of Rio\'s it did not)\n  function buildRbring(');
  edit('js/world-rbring.js', '  Object.assign(API, { ', '  Object.assign(API, { rioGround, ');
  r = run(tmp);
  const rioEx = lineOf('js/world-rio.js', /^  Object\.assign\(API, \{/), rbTake = lineOf('js/world-rbring.js', /^  const \{ .*\} = API;.*razdeli-proge/);
  check("rioKartGeo read by js/world-rbring.js, rioGround in its export: both exported by js/world-rio.js, taken from API by js/world-rbring.js, gone from its export",
    r.status === 0 && /\brioGround\b.*\brioKartGeo\b/.test(rioEx) && /\brioKartGeo\b/.test(rbTake) && !/\brioGround\b/.test(lineOf('js/world-rbring.js', /^  Object\.assign\(API, \{/)) && run(tmp, '--check').status === 0, said(r) || rioEx);
  // a let of a part read by the shared builder: World.api would hold its value at the load only, so not exported (exit 2, no change)
  const rb1 = rd('js/world-rbring.js');
  edit('js/world-rbring.js', '  function buildRbring(', '  function rbW() { return RIO_W; }\n  function buildRbring(');
  r = run(tmp);
  check("js/world-rbring.js reads RIO_W, a let of js/world-rio.js: an error (exit 2), no change", r.status === 2 && said(r).includes('RIO_W') && !lineOf('js/world-rio.js', /^  Object\.assign\(API, \{/).includes('RIO_W'), said(r));
  wr('js/world-rbring.js', rb1);
  // parts of Rio's the old way: a destructured const, a spread and a ternary of helpers it did not take from API yet; a statement of the part
  // file's own kept when the tool makes the file again
  edit('js/world-rio.js', '  API.rbLook = ', '  if (!API.rioSeen) API.rioSeen = 1;   // (a statement of its own)\n  API.rbLook = ');
  edit('js/world-rbring.js', '  function buildRbring(', '  const [RIO_Q1, RIO_Q2] = [1, 2];   // (destructured)\n  function rioQ(k) { return [...atS(RIO_Q1, 0), k ? vary: wrapS, RIO_Q2]; }\n  function buildRbring(');
  r = run(tmp);
  const rio = rd('js/world-rio.js'), take = lineOf('js/world-rio.js', /^  const \{ .*\} = API;/);
  check("the destructured const and the function in js/world-rio.js, gone from js/world-rbring.js; atS (in a spread), vary and wrapS taken from API; its own statement kept",
    r.status === 0 && rio.includes('  const [RIO_Q1, RIO_Q2] = [1, 2];') && rio.includes('function rioQ(k)') && !/RIO_Q1|rioQ/.test(rd('js/world-rbring.js')) && ['atS', 'vary', 'wrapS'].every(n => new RegExp(`\\b${n}\\b`).test(take)) && rio.includes('if (!API.rioSeen) API.rioSeen = 1;') && run(tmp, '--check').status === 0, said(r) || take);
  // a copy of a small helper (sAtS) follows the shared file's
  const sa = lineOf('js/world-rbring.js', /^  const sAtS = /);
  edit('js/world-rbring.js', sa, sa.replace(' % T.len;', ' % T.len;   ').replace('(d) =>', '(d) => 0 +'));
  r = run(tmp, '--check');
  const r2 = run(tmp);
  check("sAtS changed in js/world-rbring.js: --check finds the copy in js/world-rio.js (exit 1), the tool makes it the same", r.status === 1 && r2.status === 0 && lineOf('js/world-rio.js', /^  const sAtS = /) === lineOf('js/world-rbring.js', /^  const sAtS = /) && said(r2).includes('kopija sAtS'), said(r) + ' / ' + said(r2));
  r = run(tmp, '--seznm');
  check('an option it does not know: an error (exit 2), no change', r.status === 2 && /--seznm/.test(said(r)), said(r));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
