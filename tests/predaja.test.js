// tools/predaja.mjs: the draft of a handoff from a branch's commits, on a small repository of its own (a temp folder, no network).
// The files by theme, the open questions (keys in the commit messages and lines added to docs/vprasanja.md), what is left (TODO / ostane
// lines), the test result (--test, a file, or none), the length (up to ~20 lines), the last line (the session's link), an error without
// a base (exit 2), and the pure helpers.
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert');

const TOOL = path.join(__dirname, '..', 'tools', 'predaja.mjs');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'predaja-'));
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@t' };
const git = (...a) => { const r = spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }); if (r.status) throw new Error(`git ${a.join(' ')}: ${r.stderr}`); return r.stdout.trim(); };
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), s); };
const tool = (...a) => spawnSync(process.execPath, [TOOL, ...a], { cwd: dir, encoding: 'utf8', env });

(async () => {
  try {
    const M = await import(TOOL.startsWith('/') ? 'file://' + TOOL : TOOL);

    // pure helpers
    assert.deepStrictEqual(M.groupFiles(['tests/a.test.js', 'js/tracks/x.js', 'js/world.js', 'tools/t.mjs', 'CLAUDE.md', 'docs/proge/x.md', 'docs/zz.md', 'index.html']).map(g => g[0]),
      ['Proge', 'Svet in koda', 'Testi', 'Orodja', 'Pravila', 'Dokumenti', 'Drugo']);
    assert.deepStrictEqual(M.openQuestions(['a\nvprašanje `chase-1`', 'vprasanja: k2, `k3`\nvprasanje: ne'], ['- ena vrstica']).keys, ['chase-1', 'k2', 'k3']);
    assert.deepStrictEqual(M.leftOver(['x\nTODO: prva stvar\n- ostane: druga\nostane nič\nTODO:']), ['prva stvar', 'druga', 'nič']);
    assert.strictEqual(M.testResult('a\nb\nOK 12 testov'), 'OK 12 testov');
    assert.strictEqual(M.testResult('3 failed, 4 passed'), 'FAIL 3 padlih');
    assert.strictEqual(M.testResult(''), null);

    git('init', '-q'); git('config', 'commit.gpgsign', 'false'); git('checkout', '-q', '-b', 'main');
    write('README.md', 'x\n'); write('docs/vprasanja.md', '# V\n'); git('add', '-A'); git('commit', '-q', '-m', 'osnova');
    // no branch work yet: an empty draft
    let r = tool('--base', 'main', '--test', 'OK 0 testov');
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(/0 commitov, 0 datotek/.test(r.stdout), r.stdout);
    assert.ok(/Ostane: nič\./.test(r.stdout) && /Odprta vprašanja: ni\./.test(r.stdout));

    git('checkout', '-q', '-b', 'veja');
    write('js/tracks/a.js', 'var A;\n'); write('js/tracks/b.js', 'var B;\n'); write('js/tracks/c.js', 'var C;\n'); write('js/tracks/d.js', 'var D;\n');
    write('tests/a.test.js', ''); write('docs/vprasanja.md', '# V\n- Ali je A prav?\n');
    git('add', '-A'); git('commit', '-q', '-m', 'Proge: A do D', '-m', 'vprašanje `proga-a`\nTODO: slika menija\nostane: dež');
    write('tools/t.mjs', ''); git('add', '-A'); git('commit', '-q', '-m', 'Orodje t', '-m', 'vprasanja: k2, k3');

    fs.mkdirSync(path.join(dir, 'test-results'), { recursive: true });
    write('test-results/related.txt', 'related to 3 changed files\nOK 7 testov\n');
    r = tool('--base', 'main', '--za', 'Združevanje partyslo', '--seja', 'https://claude.ai/code/session_x');
    assert.strictEqual(r.status, 0, r.stderr);
    const o = r.stdout, lines = o.split('\n').filter(Boolean);
    assert.ok(/^## Predaja za sejo »Združevanje partyslo«/.test(o), o);
    assert.ok(/`veja` proti `main`: 2 commitov, 7 datotek/.test(o) || /2 commitov, 6 datotek/.test(o), o);
    assert.ok(/- Proge \(4\): a\.js, b\.js, c\.js \+1/.test(o), o);
    assert.ok(/- Testi \(1\)/.test(o) && /- Orodja \(1\)/.test(o));
    assert.ok(/`proga-a`; `k2`; `k3`; Ali je A prav\?/.test(o), o);
    assert.ok(/Ostane: slika menija; dež\./.test(o), o);
    assert.ok(/Testi \(`npm run test:related`\): OK 7 testov\./.test(o), o);
    assert.strictEqual(o.trimEnd().split('\n').pop(), 'https://claude.ai/code/session_x');
    assert.ok(lines.length <= 20, 'too long: ' + lines.length);
    // --test beats the file; --izpis writes a file; no result at all says so
    assert.ok(/: FAIL 1 padlih\./.test(tool('--base', 'main', '--test', 'FAIL 1 padlih').stdout));
    tool('--base', 'main', '--izpis', path.join(dir, 'izpis.txt')); assert.ok(/Predaja/.test(fs.readFileSync(path.join(dir, 'izpis.txt'), 'utf8')));
    fs.rmSync(path.join(dir, 'test-results'), { recursive: true });
    assert.ok(/ni shranjenega rezultata/.test(tool('--base', 'main').stdout));
    // a base that does not exist
    r = tool('--base', 'nikjer'); assert.strictEqual(r.status, 2); assert.ok(/no base/.test(r.stderr));
    console.log('OK predaja');
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
})();
