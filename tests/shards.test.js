// The shares of the test runner (tests/run.js --shard k/n; GitHub runs the browser tests in 6 shares on 6 machines at once, see
// .github/workflows/tests.yml): for every suite and 1-8 shares each test in exactly one share, none left out; the browser tests' shares
// as many as the workflow's (its matrix and its --shard k/n) and about as long as each other (by run.js's SECS); every browser test that
// takes long (over 4 min) has its time in SECS, and SECS names only tests in the list; a bad --shard stops with an error, never runs
// everything. --related (npm run test:related): the tests of the files given (--files) by their names and RELATED; --quiet: a passing test
// prints nothing, the summary how many passed. --koda: the code's fingerprint, the same when only documents (.md) change, not when the code
// or a .md a test reads (KODA_MD) does; every .md a test reads by its name is in KODA_MD. --dokumenti: the tests that read .md files they do
// not name (MD_TESTS), every test that lists the repository's files among them, each in a suite too, and GitHub's job Dokumenti runs them.
//   node tests/shards.test.js
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RUN = path.join(__dirname, 'run.js');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const run = (...a) => spawnSync(process.execPath, [RUN, ...a], { encoding: 'utf8' });
const lines = (r) => r.stdout.trim().split('\n').filter(Boolean);

// 1. every suite, 1-8 shares: each test in exactly one share
{
  const out = [];
  for (const suite of ['node', 'fleet', 'browser']) {
    const all = lines(run(suite, '--list'));
    for (let k = 1; k <= 8; k++) {
      let got = [];
      for (let j = 1; j <= k; j++) got = got.concat(lines(run(suite, '--shard', `${j}/${k}`, '--list')).slice(1));
      const ok = all.length > 0 && got.length === all.length && new Set(got).size === got.length && all.every(f => got.includes(f));
      if (!ok) out.push(`${suite} in ${k}: ${got.length} of ${all.length}`);
    }
  }
  check('every suite in 1-8 shares: each test in exactly one share, none left out', !out.length, out.join('; ') || 'node, fleet, browser');
}

// 2. the browser tests in as many shares as on GitHub (each job's matrix 1..n, its --shard k/n and its name k/n: the full suite's, browser,
// and the short round's, kratek-brskalnik): the full suite's about as long as each other
{
  const wf = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'tests.yml'), 'utf8');
  const deli = (id) => {
    const j = (new RegExp(`\\n  ${id}:\\n([\\s\\S]*?)(?=\\n  [\\w-]+:\\n|$)`).exec(wf) || [])[1] || '';
    const mat = /shard: \[([\d, ]+)\]/.exec(j), arg = /--shard \$\{\{ matrix\.shard \}\}\/(\d+)/.exec(j), name = /(?:^|\n)    name: [^\n]*\$\{\{ matrix\.shard \}\}\/(\d+)\)/.exec(j);
    const ks = mat ? mat[1].split(',').map(Number) : [], n = arg ? +arg[1] : 0;
    return { n, ok: n > 1 && ks.join() === Array.from({ length: n }, (_, i) => i + 1).join() && !!name && +name[1] === n, txt: `${id}: matrix [${ks.join(', ')}], --shard k/${arg ? arg[1] : '?'}, name k/${name ? name[1] : '?'}` };
  };
  const B = deli('browser'), K = deli('kratek-brskalnik'), n = B.n;
  check('the workflow\'s browser shares agree (the full suite\'s job and the short round\'s): the matrix 1..n, --shard k/n and the job\'s name k/n', B.ok && K.ok, `${B.txt}; ${K.txt}`);
  const head = lines(run('browser', '--shard', `1/${n || 4}`, '--list'))[0] || '', m = /the shares: ([\d, ]+) min/.exec(head), mins = m ? m[1].split(', ').map(Number) : [];
  check(`the browser tests in ${n} shares about as long as each other (the longest at most 15 % over the mean)`, n > 1 && mins.length === n && Math.max(...mins) <= 1.15 * mins.reduce((a, b) => a + b, 0) / n, head);
}

// 3. SECS: every long browser test has its time; no name in it that is not in the list (a renamed or dropped test)
{
  const src = fs.readFileSync(RUN, 'utf8'), secs = [...src.slice(src.indexOf('const SECS = {'), src.indexOf('};', src.indexOf('const SECS = {'))).matchAll(/'([^']+)': (\d+)/g)].map(m => [m[1], +m[2]]);
  const list = lines(run('browser', '--list')), stray = secs.filter(([f]) => !list.includes(f)).map(([f]) => f);
  const big = ['browser/memory.test.mjs', 'browser/perf.test.mjs', 'browser/smoke.test.mjs', 'browser/gfx.test.mjs', 'browser/world.test.mjs'].filter(f => !secs.some(([g, s]) => g === f && s > 240));
  check('SECS names only tests in the browser list and has the long ones (memory, perf, smoke, gfx, world: over 4 min)', secs.length > 0 && !stray.length && !big.length, `${secs.length} times${stray.length ? ', not in the list: ' + stray.join(', ') : ''}${big.length ? ', missing or short: ' + big.join(', ') : ''}`);
}

// 4. a bad --shard: an error (exit 2), nothing run
{
  const res = ['0/4', '5/4', '2', 'x/y', ''].map(a => { const r = a ? run('browser', '--shard', a, '--list') : run('browser', '--shard'); return { a, st: r.status, out: r.stdout.trim() }; });
  check('a bad --shard (0/4, 5/4, 2, x/y, none) stops with an error, runs nothing', res.every(r => r.st === 2 && !r.out), res.map(r => `"${r.a}" exit ${r.st}`).join(', '));
}

// 5. --related: the tests of the files changed
{
  const rel = (files) => { const r = run('--related', '--files', files, '--list'); return r.status === 0 ? lines(r).slice(1) : ['exit ' + r.status]; };
  const cases = [
    ['docs/proge/medvode.md', ['testne-proge.test.js', 'medvode.test.js', 'medvode-props.test.js', 'medvode-fence.test.js', 'fleet.test.js', 'browser/medvode-castle.test.mjs', 'browser/medvode-fence.test.mjs', 'browser/medvode-props.test.mjs']],
    ['js/world-montreal.js', ['stamp.test.js', 'razdelitev.test.js', 'montreal.test.js', 'browser/world.test.mjs', 'browser/gfx.test.mjs']],
    ['js/core.js', ['stamp.test.js', 'menu-lens.test.js', 'golden.test.js', 'repro.test.js', 'nova.test.js', 'trki.test.js', 'padec.test.js', 'rally.test.js', 'sovoznik.test.js', 'sovoznik-glas.test.js', 'weather.test.js', 'oprijem.test.js', 'ljudje-mesta.test.js', 'katu.test.js', 'serpentine.test.js', 'start.test.js', 'grid.test.js', 'rivals-n.test.js', 'debris.test.js', 'odpadli-deli.test.js', 'quick.test.js', 'neskoncna.test.js', 'cisterna.test.js', 'zrcalni.test.js', 'rezervna-kolesa.test.js', 'browser/repro.test.mjs', 'browser/padec.test.mjs']],
    ['tests/browser/quick.test.mjs', ['quick.test.js', 'browser/quick.test.mjs']],   // (and the Node test of its theme)
    ['README.md', ['fleet.test.js']],
    ['tools/carshots.mjs', []],
    ['assets/maps/corner-spa.webm', ['testne-proge.test.js', 'menu-corner.test.js', 'browser/menu.test.mjs']],   // (an asset: its tests by RELATED only, not the track's by its name)
    ['assets/tracks/gozd.webp', ['testne-proge.test.js']],   // (a test track's picture: only the freeze, CLAUDE.md »Testne proge«)
  ];
  const off = cases.map(([f, want]) => [f, rel(f)]).filter(([f, got], i) => got.join() !== cases[i][1].join());
  check('--related --files: a file\'s tests by name (a track\'s description, a world of its own), the big shared files by RELATED, a changed test itself (and its theme\'s), the .md files the brand check; none for an unrelated tool; an asset\'s by RELATED only; where the test tracks\' files are, the freeze',
    !off.length, off.map(([f, got]) => `${f}: ${got.join(', ') || 'none'}`).join('; '));
  const r = run('--files', 'js/core.js', '--list');
  check('--files without --related: an error (exit 2)', r.status === 2);
}

// 6. --quiet: a passing test prints nothing of its own, the summary how many passed
{
  const r = run('--related', '--files', 'tools/stamp.js', '--quiet'), out = r.stdout;
  check('--quiet: only the summary for a passing test (stamp.test.js)', r.status === 0 && !/###|^OK  /m.test(out) && /^1 of 1 tests passed/m.test(out), out.trim().split('\n').slice(-3).join(' | '));
}

// 7. --koda: the code's fingerprint (in a repository of its own, a commit for each change): the same when only documents (.md) change or
// go, another when a file of code, a .md a test reads (KODA_MD), a file's mode or its name changes; with anything else an error
{
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'koda-'));
  const git = (...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { cwd: dir, encoding: 'utf8' });
  const put = (f, txt) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), txt); };
  const fp = () => { git('add', '-A'); git('commit', '-q', '--allow-empty', '-m', 'x'); const r = spawnSync(process.execPath, [RUN, '--koda'], { cwd: dir, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : 'exit ' + r.status; };
  try {
    git('init', '-q');
    put('js/a.js', 'a'); put('docs/x.md', 'x'); put('README.md', 'r'); put('docs/gorske-proge.md', 'g');
    const f0 = fp();
    put('docs/x.md', 'x2'); put('README.md', 'r2'); put('docs/novo/y.md', 'y'); const f1 = fp();   // (documents changed, a new one)
    fs.rmSync(path.join(dir, 'docs/x.md')); const f2 = fp();   // (a document gone)
    put('docs/gorske-proge.md', 'g2'); const f3 = fp();   // (a .md a test reads)
    put('js/a.js', 'a2'); const f4 = fp();   // (code)
    fs.chmodSync(path.join(dir, 'js/a.js'), 0o755); const f5 = fp();   // (a file's mode)
    fs.renameSync(path.join(dir, 'js/a.js'), path.join(dir, 'js/b.js')); const f6 = fp();   // (a file's name)
    put('js/c.md.js', 'c'); const f7 = fp();   // (no .md: code)
    const differ = [f0, f3, f4, f5, f6, f7];
    check('--koda: a fingerprint (64 hex digits), the same when only documents (.md) change or go, another for code, a .md a test reads (KODA_MD), a file\'s mode or name',
      /^[0-9a-f]{64}$/.test(f0) && f1 === f0 && f2 === f0 && new Set(differ).size === differ.length, [f0, f1, f2, f3, f4, f5, f6, f7].map(f => f.slice(0, 8)).join(' '));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  const r = run('--koda', '--list');
  check('--koda with anything else: an error (exit 2)', r.status === 2 && !r.stdout.trim());
}

// 8. every .md a test reads by its name (a name ending in .md on a line that reads a file) is in KODA_MD: a change to it then runs every
// test (the code's fingerprint changes), not only the documents' test
{
  const kodaMd = ((/const KODA_MD = \[([^\]]*)\]/.exec(fs.readFileSync(RUN, 'utf8')) || [])[1] || '').match(/'[^']+'/g) || [], base = kodaMd.map(q => path.basename(q.slice(1, -1)));
  const stray = [];
  for (const d of ['', 'lib', 'browser']) for (const f of fs.readdirSync(path.join(__dirname, d)).filter(f => /\.m?js$/.test(f))) {
    for (const l of fs.readFileSync(path.join(__dirname, d, f), 'utf8').split('\n')) {
      if (!/readFile/.test(l) || /^\s*\/\//.test(l)) continue;
      for (const m of l.matchAll(/['"`]([^'"`]*\.md)['"`]/g)) if (!base.includes(path.basename(m[1]))) stray.push(`${path.join(d, f)}: ${m[1]}`);
    }
  }
  check('every .md a test reads by its name is in KODA_MD (tests/run.js): a change to it runs every test', kodaMd.length > 0 && !stray.length, stray.join('; ') || kodaMd.join(', '));
}

// 9. every test that lists the repository's files (git ls-files, or the root's folder) reads .md files it does not name: it is in MD_TESTS
// (tests/run.js --dokumenti), which GitHub's job Dokumenti runs also when the same code has passed every test already (the code's
// fingerprint leaves the .md files out); each of MD_TESTS is in a suite as well, so a change to the code runs it with the rest
{
  const md = lines(run('--dokumenti', '--list')), all = ['node', 'fleet', 'browser'].flatMap(s => lines(run(s, '--list'))), lister = [];
  for (const d of ['', 'lib', 'browser']) for (const f of fs.readdirSync(path.join(__dirname, d)).filter(f => /\.m?js$/.test(f) && f !== 'run.js')) {
    const src = fs.readFileSync(path.join(__dirname, d, f), 'utf8').split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
    if (/['"]ls-files['"]|readdirSync\(\s*(ROOT|REPO)\s*[,)]/.test(src)) lister.push(path.posix.join(d, f));
  }
  const wf = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'tests.yml'), 'utf8'), job = (/\n  dokumenti:\n([\s\S]*?)(\n  \w[\w-]*:\n|$)/.exec(wf) || [])[1] || '';
  const stray = lister.filter(f => !md.includes(f)), lone = md.filter(f => !all.includes(f));
  check('every test that lists the repository\'s files is in MD_TESTS (tests/run.js --dokumenti), each of them in a suite too; GitHub\'s job Dokumenti runs them',
    md.length > 0 && lister.length > 0 && !stray.length && !lone.length && /node tests\/run\.js --dokumenti\b/.test(job),
    [stray.length ? 'not in MD_TESTS: ' + stray.join(', ') : '', lone.length ? 'in no suite: ' + lone.join(', ') : '', /--dokumenti/.test(job) ? '' : 'job dokumenti does not run tests/run.js --dokumenti'].filter(Boolean).join('; ') || md.join(', '));
}

// 10. the short round (tests/run.js --kratek; GitHub's for a change of only tracks, tests/lib/krog.js): every test over every track (one that
// calls trackIds) is in PO_PROGAH, each in a suite; it runs them only on the tracks named (PROGE) with the related tests of the files and the
// frozen tracks' guard: node those without the browser, browser those in it; a new track's round in the workflow's shares within ~30 min
// (PROGA_SECS: the times with these tracks); a bad --kratek an error
{
  const src = fs.readFileSync(RUN, 'utf8'), po = (((/const PO_PROGAH = \[([^\]]*)\]/.exec(src) || [])[1] || '').match(/'[^']+'/g) || []).map(q => q.slice(1, -1));
  const klic = [], all = ['node', 'fleet', 'browser'].flatMap(s => lines(run(s, '--list')));
  for (const d of ['', 'browser']) for (const f of fs.readdirSync(path.join(__dirname, d)).filter(f => /\.test\.m?js$/.test(f))) {
    if (/\btrackIds\(/.test(fs.readFileSync(path.join(__dirname, d, f), 'utf8'))) klic.push(path.posix.join(d, f));
  }
  const brez = klic.filter(f => !po.includes(f)), tuji = po.filter(f => !all.includes(f));
  check('every test over every track (it calls trackIds) is in PO_PROGAH (tests/run.js), each in a suite: the short round runs it on the tracks changed', klic.length > 0 && !brez.length && !tuji.length,
    [brez.length ? 'not in PO_PROGAH: ' + brez.join(', ') : '', tuji.length ? 'in no suite: ' + tuji.join(', ') : ''].filter(Boolean).join('; ') || po.join(', '));
  const F = 'js/tracks/balea.js,index.html,js/lang.js,tests/golden/races.json,docs/proge/balea.md,assets/tracks/balea.webp';
  const nd = lines(run('--kratek', 'balea', '--files', F, 'node', '--list')), br = lines(run('--kratek', 'balea', '--files', F, 'browser', '--list'));
  const manj = (l, b) => po.filter(f => f.startsWith('browser/') === b).concat(b ? ['browser/lang.test.mjs'] : ['testne-proge.test.js', 'balea.test.js', 'lang.test.js']).filter(f => !l.includes(f));
  const mn = manj(nd.slice(1), false), mb = manj(br.slice(1), true), tujci = nd.slice(1).filter(f => f.startsWith('browser/')).concat(br.slice(1).filter(f => !f.startsWith('browser/')));
  check('--kratek balea: the tests over every track, the related tests (balea.test.js, lang), the frozen tracks\' guard; node and browser apart',
    /^the short round of balea \(PROGE\)/.test(nd[0] || '') && !mn.length && !mb.length && !tujci.length, [mn.length ? 'node lacks ' + mn.join(', ') : '', mb.length ? 'browser lacks ' + mb.join(', ') : '', tujci.length ? 'in the wrong list: ' + tujci.join(', ') : ''].filter(Boolean).join('; ') || `node ${nd.length - 1}, browser ${br.length - 1}`);
  const wf = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'tests.yml'), 'utf8'), k = +((/--kratek [^\n]* browser --shard \$\{\{ matrix\.shard \}\}\/(\d+)/.exec(wf) || [])[1] || 0);
  const head = lines(run('--kratek', 'balea', '--files', F, 'browser', '--shard', `1/${k || 3}`, '--list'))[1] || '', m = /the shares: ([\d, ]+) min/.exec(head), mins = m ? m[1].split(', ').map(Number) : [];
  check(`a new track's short round in the workflow's ${k} browser shares: each within 30 min on GitHub (PROGA_SECS)`, k > 1 && mins.length === k && Math.max(...mins) <= 30, head);
  const slabo = [['--kratek', '--list'], ['--kratek', 'balea', 'fleet', '--list'], ['--kratek', 'balea', '--related', '--list'], ['--kratek', 'balea', '--koda']].map(a => ({ a: a.join(' '), r: run(...a) }));
  check('a bad --kratek (no track, the fleet suite, with --related or --koda): an error (exit 2), nothing run', slabo.every(x => x.r.status === 2 && !x.r.stdout.trim()), slabo.map(x => `${x.a}: exit ${x.r.status}`).join(', '));
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
