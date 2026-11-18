// The sorting of a change for GitHub's tests (tests/lib/krog.js, tests/run.js --krog; .github/workflows/tests.yml, docs/krog-testov.md;
// the user's decision of 9. 11. 2026), in a repository of its own, each case a commit from the same base: only documents -> dokumenti;
// only a track's own files and its entries in the shared files -> proge (the track, its variant, the tracks whose world builds with a
// changed one); a new track after all the others with its flag, tests, references and translations -> proge; anything else -> vse: the
// game's code with a track, a new track before another, a test track's file, a track deleted, another track's reference, a translation
// changed or there already, a shared file gone, the workflow, a flag alone, a .md a test reads (KODA_MD). PROGE (tests/lib/sim.js):
// only these real tracks, an unknown one an error, never with --update. --krog on the command line: the outputs for the workflow
// (GITHUB_OUTPUT), every test when it cannot sort, a bad option an error.
//   node tests/krog.test.js
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { razvrsti } = require('./lib/krog.js');

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const RUN = path.join(__dirname, 'run.js');

// 1. the cases, in a repository of their own
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'krog-'));
const git = (...a) => {
  const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${a.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
};
const put = (f, txt) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), txt); };
const get = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const edit = (f, a, b) => { const t = get(f); if (!t.includes(a)) throw new Error(`${f}: no ${a}`); put(f, t.replace(a, b)); };
const rm = (f) => fs.rmSync(path.join(dir, f));
const track = (id, more = '') => `var TRACK_DEFS = TRACK_DEFS || [];\nTRACK_DEFS.push({ id: '${id}', name: '${id.toUpperCase()}, Država'${more} });\n`;
const skr = (f) => `<script src="js/${f}.js"></script>`;
try {
  git('init', '-q');
  put('index.html', ['<!doctype html>', skr('three'), skr('tracks/aaa'), skr('tracks/bbb'), skr('tracks/ab'), skr('tracks/ccc'), skr('tracks/ttt'),
    skr('core'), skr('world-gora'), skr('world-ccc'), skr('world-kamp'), skr('menu'), skr('lang'), ''].join('\n'));
  put('js/tracks/aaa.js', track('aaa', ", theme: 'gora'"));
  put('js/tracks/bbb.js', track('bbb'));
  // (a variant: its file reads its track's, after it in index.html, before it by name; as js/tracks/pikesg.js)
  put('js/tracks/ab.js', "var TRACK_DEFS = TRACK_DEFS || [];\n(function () { const P = TRACK_DEFS.find(d => d.id === 'bbb'); if (!P) return; TRACK_DEFS.push(Object.assign({}, P, { id: 'ab', variantOf: 'bbb' })); })();\n");
  put('js/tracks/ccc.js', track('ccc', ", theme: 'ccc'"));
  put('js/tracks/ttt.js', track('ttt', ", theme: 'kamp', test: true"));
  put('js/core.js', 'var Core = {};\n');
  put('js/world-gora.js', 'World.ext.gora = function () {};\n');
  put('js/world-ccc.js', 'World.ext.ccc = function () { World.ext.gora(); };\n');   // (a real track's world built with the mountains')
  put('js/world-kamp.js', 'World.ext.kamp = function () { World.ext.gora(); };\n');   // (a test track's: frozen, never in the short round)
  put('js/lang.js', "const EN = {\n  'AAA, Država': 'AAA, Country',\n  'BBB, Država': 'BBB, Country',\n};\n");
  put('js/routes.js', 'window.ROUTES = {"aaa":[[1,2]],"bbb":[[3,4]]};\n');
  put('js/menu.js', 'const FLAG_FILES = {"Država":"dr.svg"};\nfunction menu() {}\n');
  put('tests/golden/sim.json', JSON.stringify({ 'aaa/race/cs': { digest: 'a1' }, 'bbb/race/cs': { digest: 'b1' }, 'ccc/race/cs': { digest: 'c1' } }, null, 1) + '\n');
  put('tests/run.js', "const SUITES = {\n  node: ['golden.test.js', 'aaa.test.js', 'lang.test.js'],\n  browser: ['browser/smoke.test.mjs', 'browser/aaa-castle.test.mjs'],\n};\nconst SECS = { 'browser/smoke.test.mjs': 700, 'browser/aaa-castle.test.mjs': 90 };\n");
  put('tests/lib/sim.js', "// crash times\nconst CRASH_AT = { aaa: 12.5, 'bbb/x': 3 };\nmodule.exports = { CRASH_AT };\n");
  put('tests/aaa.test.js', 'aaa\n'); put('tests/browser/aaa-castle.test.mjs', 'aaa castle\n');
  put('docs/proge/aaa.md', '# AAA\n'); put('README.md', '# Igra\n'); put('docs/gorske-proge.md', '# Gorske\n');
  put('assets/tracks/aaa.webp', 'a'); put('assets/tracks/ttt.webp', 't'); put('assets/flags/dr.svg', '<svg/>');
  put('tools/aaa/config.json', '{}\n'); put('.github/workflows/tests.yml', 'name: Testi\n');
  git('add', '-A'); git('commit', '-q', '-m', 'base');
  const base = git('rev-parse', 'HEAD');

  const primer = (ime, spremeni, vrsta, proge) => {
    git('checkout', '-q', '--detach', base);
    spremeni(); git('add', '-A'); git('commit', '-q', '--allow-empty', '-m', ime);
    let r;
    try { r = razvrsti({ base, head: 'HEAD', cwd: dir, kodaMd: ['docs/gorske-proge.md'] }); } catch (e) { r = { vrsta: 'error', proge: [], zakaj: [e.message] }; }
    const ok = r.vrsta === vrsta && (!proge || r.proge.join() === proge.join());
    check(`${ime}: ${vrsta}${proge && proge.length ? ` (${proge.join(', ')})` : ''}`, ok, `${ok ? '' : `${r.vrsta} (${r.proge.join(', ')}): `}${r.zakaj.slice(0, 3).join('; ')}`);
  };

  primer('only documents: a track\'s description, the README, a new page, a picture under docs/', () => {
    edit('docs/proge/aaa.md', '# AAA', '# AAA, Država'); edit('README.md', '# Igra', '# Igra\nNova vrstica.'); put('docs/novo.md', '# Novo\n'); put('docs/slike/x.png', 'x');
  }, 'dokumenti', []);
  primer('a .md a test reads (KODA_MD)', () => edit('docs/gorske-proge.md', '# Gorske', '# Gorske proge'), 'vse');
  primer('a track\'s own files and its entries in the shared files', () => {
    edit('js/tracks/aaa.js', "theme: 'gora'", "theme: 'gora', len: 2"); edit('docs/proge/aaa.md', '# AAA', '# AAA 2');
    put('assets/tracks/aaa.webp', 'a2'); put('assets/tracks/aaa-rain.webp', 'r'); put('assets/maps/corner-aaa.webm', 'v');
    edit('tests/aaa.test.js', 'aaa', 'aaa 2'); edit('tools/aaa/config.json', '{}', '{"a":1}');
    edit('tests/golden/sim.json', '"a1"', '"a2"'); edit('js/routes.js', '"aaa":[[1,2]]', '"aaa":[[1,2],[5,6]]');
    edit('js/lang.js', "  'BBB, Država'", "  'AAA opis': 'AAA description',   // (the description)\n  'BBB, Država'");
    edit('tests/run.js', "'browser/aaa-castle.test.mjs': 90", "'browser/aaa-castle.test.mjs': 120");
    edit('tests/lib/sim.js', 'aaa: 12.5', 'aaa: 13'); edit('tests/lib/sim.js', '// crash times', '// crash times\n// (aaa: later)');
  }, 'proge', ['aaa']);
  const nova = (pred) => {
    put('js/tracks/ddd.js', track('ddd', ", theme: 'ddd'").replace('Država', 'Novadržava'));
    edit('index.html', pred ? skr('tracks/aaa') : skr('tracks/ttt'), pred ? `${skr('tracks/ddd')}\n${skr('tracks/aaa')}` : `${skr('tracks/ttt')}\n${skr('tracks/ddd')}`);
  };
  primer('a new track after all the others: its script lines, world, references, tests and their times, translations, route, flag, tools', () => {
    nova(false); edit('index.html', skr('world-kamp'), `${skr('world-kamp')}\n${skr('world-ddd')}`); put('js/world-ddd.js', 'World.ext.ddd = function () {};\n');
    edit('tests/golden/sim.json', '"ccc/race/cs": {', '"ddd/race/cs": {\n  "digest": "d1"\n },\n "ccc/race/cs": {');
    edit('tests/run.js', "'lang.test.js']", "'lang.test.js', 'ddd.test.js']"); edit('tests/run.js', "'browser/aaa-castle.test.mjs'],", "'browser/aaa-castle.test.mjs', 'browser/ddd-most.test.mjs'],");
    edit('tests/run.js', '90 };', "90, 'browser/ddd-most.test.mjs': 50 };");
    put('tests/ddd.test.js', 'ddd\n'); put('tests/browser/ddd-most.test.mjs', 'ddd\n');
    edit('js/lang.js', '};', "  'DDD, Novadržava': 'DDD, Newcountry',\n};");
    put('assets/flags/nd.svg', '<svg/>'); edit('js/menu.js', '"Država":"dr.svg"', '"Država":"dr.svg","Novadržava":"nd.svg"');
    edit('js/routes.js', '"bbb":[[3,4]]', '"bbb":[[3,4]],"ddd":[[7,8]]'); put('tools/ddd/config.json', '{}\n'); put('docs/proge/ddd.md', '# DDD\n');
  }, 'proge', ['ddd']);
  primer('a new track before another (the order of Core.TRACKS)', () => nova(true), 'vse', ['ddd']);
  primer('a track and the game\'s code', () => { edit('js/tracks/aaa.js', "theme: 'gora'", "theme: 'gora', len: 2"); edit('js/core.js', '{}', '{ v: 2 }'); }, 'vse', ['aaa']);
  primer('a world: the tracks of its theme and those whose world builds with it, not a test track\'s', () => edit('js/world-gora.js', '{}', '{ return 1; }'), 'proge', ['aaa', 'ccc']);
  primer('a track and its variant (the variant\'s file after the track\'s in index.html)', () => edit('js/tracks/bbb.js', "Država'", "Država', len: 3"), 'proge', ['ab', 'bbb']);
  primer('a test track\'s file (frozen)', () => edit('js/tracks/ttt.js', 'test: true', 'test: true, len: 1'), 'vse');
  primer('a test track\'s picture (frozen)', () => put('assets/tracks/ttt.webp', 't2'), 'vse');
  primer('a track deleted', () => { rm('js/tracks/ccc.js'); edit('index.html', skr('tracks/ccc') + '\n', ''); }, 'vse');
  primer('a track and another track\'s reference', () => { edit('js/tracks/aaa.js', "theme: 'gora'", "theme: 'gora', len: 2"); edit('tests/golden/sim.json', '"b1"', '"b2"'); }, 'vse', ['aaa']);
  primer('a track and a translation changed', () => { edit('js/tracks/aaa.js', "theme: 'gora'", "theme: 'gora', len: 2"); edit('js/lang.js', "'BBB, Country'", "'BBB, Land'"); }, 'vse', ['aaa']);
  primer('a track and a translation that is there already', () => { edit('js/tracks/aaa.js', "theme: 'gora'", "theme: 'gora', len: 2"); edit('js/lang.js', '};', "  'BBB, Država': 'BBB, Land',\n};"); }, 'vse', ['aaa']);
  primer('a track and a shared file gone', () => { edit('js/tracks/aaa.js', "theme: 'gora'", "theme: 'gora', len: 2"); rm('js/routes.js'); }, 'vse', ['aaa']);
  primer('a track and the workflow', () => { edit('js/tracks/aaa.js', "theme: 'gora'", "theme: 'gora', len: 2"); edit('.github/workflows/tests.yml', 'Testi', 'Testi 2'); }, 'vse', ['aaa']);
  primer('a flag alone (no track of its own)', () => { put('assets/flags/nd.svg', '<svg/>'); edit('js/menu.js', '"Država":"dr.svg"', '"Država":"dr.svg","Novadržava":"nd.svg"'); }, 'vse', []);
} finally { fs.rmSync(dir, { recursive: true, force: true }); }

// 2. PROGE: only these real tracks; an unknown or a test track's id an error, so is --update (the references would keep only these)
{
  const sim = (env, ...argv) => spawnSync(process.execPath, ['-e', "const s = require(process.argv[1]); try { console.log(JSON.stringify([s.izbrane(['aaa', 'bbb', 'ccc']), s.najmanj(14)])); } catch (e) { console.log('error: ' + e.message); }", path.join(__dirname, 'lib', 'sim.js'), ...argv],
    { encoding: 'utf8', env: Object.assign({}, process.env, { PROGE: env }) }).stdout.trim();
  const got = [sim(''), sim('bbb'), sim(' ccc , aaa '), sim('aaa,zzz'), sim('bbb', '--update')];
  check('PROGE: every real track without it; only those named, in the game\'s order (najmanj: as many as named); an unknown one an error, so is --update',
    got[0] === '[["aaa","bbb","ccc"],14]' && got[1] === '[["bbb"],1]' && got[2] === '[["aaa","ccc"],2]' && /^error: PROGE: not a real track.*zzz/.test(got[3]) && /^error: PROGE=bbb with --update/.test(got[4]), got.join(' | '));
}

// 3. --krog on the command line: what it prints and gives the workflow (GITHUB_OUTPUT); every test when it cannot sort; a bad option an error
{
  const out = path.join(os.tmpdir(), `krog-izhod-${process.pid}.txt`);
  const krog = (...a) => { fs.writeFileSync(out, ''); const r = spawnSync(process.execPath, [RUN, '--krog', ...a], { encoding: 'utf8', env: Object.assign({}, process.env, { GITHUB_OUTPUT: out }) }); return { st: r.status, out: r.stdout, gh: fs.readFileSync(out, 'utf8') }; };
  try {
    const nic = krog('--base', 'HEAD', '--head', 'HEAD', '--github'), napaka = krog('--base', 'ni-takega-commita', '--github'), slabo = krog('--list');
    check('--krog: no file changed -> dokumenti (and its outputs vrsta, proge, datoteke for the workflow)', nic.st === 0 && /: 0 files changed: dokumenti\b/.test(nic.out) && nic.gh === 'vrsta=dokumenti\nproge=\ndatoteke=\n', nic.out.split('\n')[0] + ' | ' + JSON.stringify(nic.gh));
    check('--krog: a base it cannot read -> vse (every test), never an error that would stop the workflow', napaka.st === 0 && /vrsta=vse\n/.test(napaka.gh), napaka.out.split('\n').slice(0, 2).join(' | '));
    check('--krog with another option (--list): an error (exit 2)', slabo.st === 2 && !slabo.gh);
  } finally { fs.rmSync(out, { force: true }); }
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
