// The real tracks' own settings and world parts in their own files (docs/razdelitev-prog.md, tools/razdeli-proge.mjs), so that branches
// which add or change different tracks do not meet in the same line: no real track's entry is left in the shared lists (js/render.js
// THEMES and SPLIT, js/game.js EN_NAME and RAIN_P, js/world.js CLOUD_TH, ROAD_WEAR, GRASS_NAT, LAWN, BB_CLASSIC and the grids World.build
// frees, js/world-zivali.js ZIV) and Bathurst's, Rio's and Crystal Palace's own parts are in js/world-<theme>.js, not in js/world-rbring.js.
// On a copy, as a branch from before the split brings it: an entry put back into a list goes to its track's file (the same value quietly,
// another only with --seznam, the list's, or --proga, the file's, for one track --seznam=<id>), a new track's entry makes the block in its file, a grid freed the old way
// becomes World.keep in its world's file, a part of Rio's added to js/world-rbring.js goes to js/world-rio.js; a second run changes nothing.
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
  edit('js/game.js', "grom: 'Thunder Cape' }", "grom: 'Thunder Cape', spa: 'Spa', livorno: 'Livorno' }");   // (Spa's as it is in its file; Livorno's new)
  edit('js/world.js', 'const GRASS_NAT = { lake: 0.75 };', 'const GRASS_NAT = { lake: 0.75, spa: 0.85 };');
  edit('js/world.js', '    for (const k in KEEP)', "    if (THEME !== 'livorno') API.LV = null;                          // (and Livorno's)\n    for (const k in KEEP)");
  edit('js/world-rbring.js', '  function buildRbring(', "  function rioTest() { return T.len; }   // (a part of Rio's, added the old way)\n  function buildRbring(");
  let r = run(tmp);
  check('the old way brought back: the tool takes it (exit 0)', r.status === 0, said(r));
  check("EN_NAME: Spa's (the same as in its file) and Livorno's gone from js/game.js", !/\b(spa|livorno): '/.test(lineOf('js/game.js', /const EN_NAME = \{/)), lineOf('js/game.js', /const EN_NAME = \{/).slice(0, 200));
  check("Livorno's English name in its file (say), in the block of its own settings", /^    say: 'Livorno',$/m.test(rd('js/tracks/livorno.js')) && rd('js/tracks/livorno.js').includes('tools/razdeli-proge.mjs'));
  check("GRASS_NAT: Spa's gone, the test track's kept", lineOf('js/world.js', /const GRASS_NAT = \{/).includes('{ lake: 0.75 }'), lineOf('js/world.js', /const GRASS_NAT = \{/));
  check("the grid freed the old way: World.keep('LV', 'livorno') before World.ext.livorno, the line gone from World.build",
    /World\.keep\('LV', 'livorno'\);[^\n]*\n\s*World\.ext\.livorno =/.test(rd('js/world-livorno.js')) && !rd('js/world.js').includes("API.LV = null"));
  { const was = fs.readFileSync(path.join(REPO, 'js/world-rio.js'), 'utf8'), now = rd('js/world-rio.js'), add = now.split('\n').filter(l => l.includes('function rioTest()'));
    check("Rio's part added to js/world-rbring.js is in js/world-rio.js, the rest of it as it was (its prologue, exports)", add.length === 1 && now.split('\n').filter(l => l !== add[0]).join('\n') === was && !rd('js/world-rbring.js').includes('function rioTest()')); }
  r = run(tmp, '--check');
  check('a second run changes nothing (--check)', r.status === 0, said(r));
  // a value other than its file's: only with a choice
  edit('js/game.js', 'const RAIN_P = {};', 'const RAIN_P = { spa: 0.6 };');
  r = run(tmp);
  check("Spa's rain 0.6 in RAIN_P, 0.5 in its file: no choice, no change (exit 2)", r.status === 2 && lineOf('js/game.js', /const RAIN_P = /).includes('spa: 0.6'), said(r));
  r = run(tmp, '--proga');
  check('--proga: its file\'s 0.5 kept, the list\'s entry gone', r.status === 0 && /say: 'Spa', rainP: 0\.5,/.test(rd('js/tracks/spa.js')) && lineOf('js/game.js', /const RAIN_P = /).includes('const RAIN_P = {};'), said(r));
  edit('js/game.js', 'const RAIN_P = {};', 'const RAIN_P = { spa: 0.6 };');
  r = run(tmp, '--seznam');
  check("--seznam: the list's 0.6 in its file", r.status === 0 && /say: 'Spa', rainP: 0\.6,/.test(rd('js/tracks/spa.js')), said(r));
  // the choice for some tracks only: another's difference still stops it
  edit('js/game.js', 'const RAIN_P = {};', 'const RAIN_P = { spa: 0.7, nring: 0.9 };');
  r = run(tmp, '--seznam=spa');
  check("--seznam=spa: Nürburg's difference has no choice, no change (exit 2)", r.status === 2 && said(r).includes('nring.js rainP') && !said(r).includes('spa.js') && /say: 'Spa', rainP: 0\.6,/.test(rd('js/tracks/spa.js')), said(r));
  r = run(tmp, '--seznam=spa', '--proga=nring');
  check("--seznam=spa --proga=nring: Spa's 0.7 from the list, Nürburg's 0.45 kept, the list's entries gone", r.status === 0 && /say: 'Spa', rainP: 0\.7,/.test(rd('js/tracks/spa.js')) && /say: 'Nürburg', rainP: 0\.45,/.test(rd('js/tracks/nring.js')) && lineOf('js/game.js', /const RAIN_P = /).includes('const RAIN_P = {};'), said(r));
  // a part of Rio's changed the old way (in js/world-rbring.js, as a branch from before the split brings it): only with a choice
  edit('js/world-rbring.js', '  function buildRbring(', "  function rioTest() { return T.len + 1; }   // (a part of Rio's, changed the old way)\n  function buildRbring(");
  r = run(tmp);
  check("Rio's part changed the old way: no choice, no change (exit 2)", r.status === 2 && said(r).includes('world-rio.js rioTest') && rd('js/world-rbring.js').includes('T.len + 1') && !rd('js/world-rio.js').includes('T.len + 1'), said(r));
  r = run(tmp, '--seznam=rio');
  check('--seznam=rio: the changed part in js/world-rio.js, gone from js/world-rbring.js', r.status === 0 && rd('js/world-rio.js').includes('{ return T.len + 1; }') && !rd('js/world-rio.js').includes('{ return T.len; }') && !rd('js/world-rbring.js').includes('rioTest'), said(r));
  r = run(tmp, '--seznm');
  check('an option it does not know: an error (exit 2), no change', r.status === 2 && /--seznm/.test(said(r)), said(r));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
