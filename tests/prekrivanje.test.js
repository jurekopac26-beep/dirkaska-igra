// tools/prekrivanje.mjs: open PRs that change the same track or the same file, and the owner's account
// (docs/odlocitve.md, »Brez dvojnega dela«, point 3). Offline: the pure helpers and the CLI on a fixture (--json), no network.
// The account (Lastnik line, Predaja with an arrow only, the Claude-Session prefix, a learned prefix, a -bt branch, one account
// in the text), the hot files, the wide PRs, the groups of different accounts, --proga / --datoteka / --pr and the exit codes.
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert');

const TOOL = path.join(__dirname, '..', 'tools', 'prekrivanje.mjs');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prekrivanje-'));
const tool = (...a) => spawnSync(process.execPath, [TOOL, ...a], { cwd: dir, encoding: 'utf8', env: { ...process.env, HTTPS_PROXY: '', https_proxy: '' } });

(async () => {
  try {
    const M = await import(TOOL.startsWith('/') ? 'file://' + TOOL : TOOL);
    const ids = new Set(['kildare', 'medvode', 'koli']);

    // tracks of a file: a name part or a folder that is a track id
    assert.deepStrictEqual(M.progeDatoteke('js/world-kildare.js', ids), ['kildare']);
    assert.deepStrictEqual(M.progeDatoteke('tests/medvode-props.test.js', ids), ['medvode']);
    assert.deepStrictEqual(M.progeDatoteke('assets/tracks/koli-rain.webp', ids), ['koli']);
    assert.deepStrictEqual(M.progeDatoteke('docs/proge/kildare.md', ids), ['kildare']);
    assert.deepStrictEqual(M.progeDatoteke('js/core.js', ids), []);
    assert.strictEqual(M.vroca('tests/golden/world.json'), 'tests/golden/');
    assert.strictEqual(M.vroca('js/render.js'), 'js/render.js');
    assert.strictEqual(M.vroca('js/renderx.js'), null);

    // owner from the body: Lastnik, Predaja only with an arrow
    assert.deepStrictEqual(M.lastnikIzOpisa('**Lastnik: partyslo, od 20. 11. 2026**\nx'), { racun: 'partyslo', vir: 'lastnik' });
    assert.deepStrictEqual(M.lastnikIzOpisa('Lastnik: partyslo, od 20. 11.\nPredaja: partyslo → croatiadata, 24. 11.'), { racun: 'croatiadata', vir: 'predaja' });
    assert.deepStrictEqual(M.lastnikIzOpisa('Lastnik: partyslo, od 20. 11.\n## Predaja\nNaslednja seja biketraveler …'), { racun: 'partyslo', vir: 'lastnik' });
    assert.strictEqual(M.lastnikIzOpisa('Lastnik: nekdo, od 1. 1.'), null);
    assert.strictEqual(M.sejaIzSporocila('x\n\nClaude-Session: https://claude.ai/code/session_01UuPU9abc\n'), 'session_01UuPU9abc');
    assert.strictEqual(M.sejaIzSporocila('brez'), null);

    const prs = [
      { number: 1, title: 'Kildare boksi', branch: 'a', body: 'Lastnik: croatiadata, od 25. 11. 2026', files: ['js/tracks/kildare.js', 'js/core.js', 'tools/x.mjs'], session: 'session_01BFNqNaaa' },
      { number: 2, title: 'Kildare stavbe', branch: 'b', body: 'opis', files: ['js/world-kildare.js', 'js/core.js', 'tools/x.mjs'], session: 'session_01WbgGzbbb' },
      { number: 3, title: 'Medvode', branch: 'proge-bt', body: '', files: ['js/world-medvode.js', 'README.md'], session: null },
      { number: 4, title: 'Medvode ograja (partyslo)', branch: 'c', body: '', files: ['tests/medvode-fence.test.js', 'README.md'], session: null },
      { number: 5, title: 'Koli', branch: 'd', body: 'Lastnik: partyslo, od 1. 11.', files: ['js/tracks/koli.js'], session: 'session_01NOVOxccc' },
      { number: 6, title: 'Koli sneg', branch: 'e', body: '', files: ['js/world-koli.js', 'tests/golden/world.json'], session: 'session_01NOVOxddd' },
      { number: 7, title: 'Zbirna', branch: 'f', body: 'Lastnik: partyslo, od 1. 11.', files: ['js/tracks/kildare.js', 'js/tracks/medvode.js', 'tests/golden/world.json'], session: 'session_01BFNqNeee' },
    ];
    M.dolociRacune(prs);
    const by = (n) => prs.find((p) => p.number === n);
    assert.deepStrictEqual([by(1).racun, by(1).vir, by(1).commit], ['croatiadata', 'lastnik', 'croatiadata']);
    assert.deepStrictEqual([by(2).racun, by(2).vir], ['partyslo', 'seja']);            // the session prefix table
    assert.deepStrictEqual([by(3).racun, by(3).vir], ['biketraveler', 'veja']);        // a -bt branch
    assert.deepStrictEqual([by(4).racun, by(4).vir], ['partyslo', 'opis']);            // one account in the title
    assert.deepStrictEqual([by(6).racun, by(6).vir], ['partyslo', 'seja']);            // a prefix learned from #5's Lastnik line
    assert.strictEqual(M.oznaka(by(7)), '#7 partyslo[croatiadata]');                    // the last commit by another account
    assert.strictEqual(M.oznaka(by(3)), '#3 biketraveler?');
    assert.strictEqual(M.dolociRacune([{ ...prs[5], body: '' }], { session_01NOVOxddd: 'croatiadata' })[0].racun, 'croatiadata');   // --seje

    // groups: wide PRs aside, hot files always, tracks and other files only across accounts
    assert.deepStrictEqual(M.siroki(prs, ids, 1).map((p) => p.number), [7]);
    const r = M.prekrivanja(prs, ids, { siroki: M.siroki(prs, ids, 1) });
    assert.deepStrictEqual(r.vroce.map(([k, l]) => [k, l.map((p) => p.number)]), [['js/core.js', [1, 2]], ['tests/golden/', [6, 7]]]);
    assert.deepStrictEqual(r.proge.map(([k, l]) => [k, l.map((p) => p.number)]), [['kildare', [1, 2]], ['medvode', [3, 4]]]);
    assert.strictEqual(r.istiRacun, 1);                                                  // koli: #5 and #6 both partyslo
    assert.deepStrictEqual(r.datoteke.map(([k]) => k), ['tools/x.mjs']);                 // README.md is common: only with --vse
    assert.ok(M.prekrivanja(prs, ids, { vse: true }).datoteke.some(([k]) => k === 'README.md'));
    const p1 = M.pari(prs, 1, ids);
    assert.deepStrictEqual(p1.map(([b, d]) => [b.number, d.proge, d.datoteke.length]), [[2, ['kildare'], 2], [7, ['kildare'], 1]]);
    assert.strictEqual(M.pari(prs, 99, ids), null);

    // the CLI on a fixture; ids come from js/tracks/ of the checkout (kildare, medvode and koli are there)
    const f = path.join(dir, 'prs.json');
    fs.writeFileSync(f, JSON.stringify(prs.map(({ number, title, branch, body, files, session }) => ({ number, title, branch, body, files, session }))));
    let c = tool('--json', f, '--siroki', '1');
    assert.strictEqual(c.status, 2, c.stderr);
    assert.ok(/^Odprtih PR: 7$/m.test(c.stdout), c.stdout);
    assert.ok(/Široki PR .*#7 partyslo\[croatiadata\]/.test(c.stdout), c.stdout);
    assert.ok(/^  js\/core\.js \(2\): #1 croatiadata, #2 partyslo$/m.test(c.stdout), c.stdout);
    assert.ok(/^  medvode \(2\): #3 biketraveler\?, #4 partyslo\?$/m.test(c.stdout), c.stdout);
    assert.ok(/še 1 prog samo z istim računom/.test(c.stdout) && /^\? = račun ugibam/m.test(c.stdout), c.stdout);
    assert.ok(c.stdout.trim().split('\n').length <= 20, c.stdout);
    c = tool('--json', f, '--proga', 'koli');
    assert.strictEqual(c.status, 2);
    assert.ok(/^Proga koli: 2 odprtih PR\n  #5 partyslo  Koli\n  #6 partyslo  Koli sneg$/.test(c.stdout.trim()), c.stdout);
    c = tool('--json', f, '--datoteka', 'tests/golden/');
    assert.ok(/^tests\/golden\/: 2 odprtih PR/.test(c.stdout), c.stdout);
    c = tool('--json', f, '--pr', '3');
    assert.ok(/^#3 si deli proge ali datoteke z 2 PR/.test(c.stdout) && /#4 partyslo\?: proge medvode/.test(c.stdout), c.stdout);
    c = tool('--json', f, '--pr', '99');
    assert.strictEqual(c.status, 0);
    assert.ok(/ni med odprtimi/.test(c.stdout));
    fs.writeFileSync(f, JSON.stringify([prs[0], { ...prs[4], files: ['js/tracks/koli.js'] }].map(({ number, title, branch, body, files, session }) => ({ number, title, branch, body, files, session }))));
    c = tool('--json', f);
    assert.strictEqual(c.status, 0, c.stdout);                                           // no overlap: exit 0
    assert.ok(/Vroče datoteke: brez prekrivanja/.test(c.stdout) && /Proge z različnimi računi: brez prekrivanja/.test(c.stdout), c.stdout);
    c = tool('--json', path.join(dir, 'ni.json'));
    assert.strictEqual(c.status, 1);
    console.log('prekrivanje: OK');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
})();
