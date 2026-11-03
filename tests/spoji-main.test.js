// tools/spoji-main.mjs on a small repository of its own (a temp folder, no network): a merge whose conflicts are only in content
// stamps (index.html), rows both sides added (a table in a .md), a test list both sides extended (tests/run.js; each new test where its
// side put it) and one real conflict
// (the same line of a .md changed on both sides). The tool resolves the mechanical ones, stamps the merged files and leaves only the
// real conflict (exit 1); without it the merge is committed (exit 0) and every stamp is current. Also: a merge without conflicts
// that changes a file both sides changed (its stamp), a fast-forward, an up-to-date branch and uncommitted changes (exit 2).
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert');

const TOOL = path.join(__dirname, '..', 'tools', 'spoji-main.mjs'), STAMP = path.join(__dirname, '..', 'tools', 'stamp.js');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spoji-main-'));
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@t' };
const git = (...a) => {
  const r = spawnSync('git', a, { cwd: dir, encoding: 'utf8', env });
  if (r.status) throw new Error(`git ${a.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
};
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), s); };
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const stamp = (...a) => spawnSync(process.execPath, [STAMP, ...a], { encoding: 'utf8', env: { ...env, GAME_ROOT: dir } });
const tool = (...a) => spawnSync(process.execPath, [TOOL, ...a, '--no-fetch'], { cwd: dir, encoding: 'utf8', env });
const commit = (msg) => { assert.strictEqual(stamp().status, 0); git('add', '-A'); git('commit', '-q', '-m', msg); };
const parents = () => git('rev-list', '--parents', '-n', '1', 'HEAD').split(' ').length - 1;
const conflicted = () => git('diff', '--name-only', '--diff-filter=U').split('\n').filter(Boolean);

try {
  git('init', '-q');
  git('config', 'commit.gpgsign', 'false');
  git('checkout', '-q', '-b', 'main');
  write('js/a.js', 'var A = 1;\n');
  write('js/b.js', 'var B = 1;\n');
  write('js/c.js', 'var C = 1;\n\n\n\n\nvar C2 = 1;\n');
  write('index.html', '<!doctype html>\n<script src="js/a.js"></script>\n<script src="js/b.js"></script>\n<script src="js/c.js"></script>\n');
  write('docs/kazalo.md', '# Kazalo\n\n| a | b |\n|---|---|\n| 1 | 2 |\n');
  write('tests/run.js', "const T = {\n  node: ['a.test.js', 'b.test.js'],\n};\nmodule.exports = T;\n");
  write('docs/x.md', 'ena\ndva\ntri\n');
  commit('osnova');
  git('branch', 'veja');
  git('branch', 'ff');

  // main: a.js, the start of c.js, a new script at the top, a changed row and a new one, a test, a line of x.md
  write('js/a.js', 'var A = 2;\n');
  write('js/c.js', 'var C = 2;\n\n\n\n\nvar C2 = 1;\n');
  write('js/m.js', 'var M = 1;\n');
  write('index.html', read('index.html').replace('<script src="js/a.js', '<script src="js/m.js"></script>\n<script src="js/a.js'));
  write('docs/kazalo.md', read('docs/kazalo.md').replace('| 1 | 2 |\n', '| 1 | 2 (main) |\n| 3 | 4 |\n'));
  write('tests/run.js', read('tests/run.js').replace("'a.test.js', ", "'a.test.js', 'main.test.js', "));
  write('docs/x.md', 'ena\nDVA (main)\ntri\n');
  commit('main');

  // the branch: b.js, the end of c.js, another script at the top, a row before the changed one and one at the end, another test,
  // the same line of x.md
  git('checkout', '-q', 'veja');
  write('js/b.js', 'var B = 2;\n');
  write('js/c.js', 'var C = 1;\n\n\n\n\nvar C2 = 2;\n');
  write('js/v.js', 'var V = 1;\n');
  write('index.html', read('index.html').replace('<script src="js/a.js', '<script src="js/v.js"></script>\n<script src="js/a.js'));
  write('docs/kazalo.md', read('docs/kazalo.md').replace('| 1 | 2 |\n', '| 0 | 0 |\n| 1 | 2 |\n| 5 | 6 |\n'));
  write('tests/run.js', read('tests/run.js').replace("'b.test.js'", "'b.test.js', 'veja.test.js'"));
  write('docs/x.md', 'ena\nDVA (veja)\ntri\n');
  commit('veja');

  // 1. with the real conflict: only docs/x.md is left, the rest is resolved and staged
  let r = tool('main');
  assert.strictEqual(r.status, 1, r.stdout + r.stderr);
  assert.deepStrictEqual(conflicted(), ['docs/x.md'], r.stdout);
  assert.match(r.stdout, /docs\/x\.md \(1 del, vrstica 2\)/);
  assert.ok(!/<<<<<<<|>>>>>>>/.test(read('index.html') + read('docs/kazalo.md') + read('tests/run.js')));
  assert.match(read('docs/x.md'), /<<<<<<<[^\n]*\nDVA \(veja\)\n\|\|\|\|\|\|\|[^\n]*\ndva\n=======\nDVA \(main\)\n>>>>>>>/);
  git('merge', '--abort');

  // 2. without it (the branch takes main's line): merged and committed, every stamp current
  write('docs/x.md', 'ena\nDVA (main)\ntri\n');
  git('commit', '-q', '-am', 'x kot main');
  r = tool('main');
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.strictEqual(parents(), 2);
  assert.strictEqual(git('status', '--porcelain'), '');
  assert.strictEqual(stamp('--check').status, 0, 'žigi po spoju');
  assert.strictEqual(read('js/c.js'), 'var C = 2;\n\n\n\n\nvar C2 = 2;\n');
  assert.strictEqual(read('docs/kazalo.md'), '# Kazalo\n\n| a | b |\n|---|---|\n| 0 | 0 |\n| 1 | 2 (main) |\n| 3 | 4 |\n| 5 | 6 |\n');
  assert.match(read('tests/run.js'), /node: \['a\.test\.js', 'main\.test\.js', 'b\.test\.js', 'veja\.test\.js'\],/);   // (main's test where main put it)
  assert.match(read('index.html'), /<!doctype html>\n<script src="js\/v\.js\?v=\w+"><\/script>\n<script src="js\/m\.js\?v=\w+"><\/script>\n<script src="js\/a\.js/);
  assert.match(r.stdout, /index\.html/);

  // 3. again: up to date
  const head = git('rev-parse', 'HEAD');
  r = tool('main');
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.strictEqual(git('rev-parse', 'HEAD'), head);

  // 4. a merge without conflicts that changes c.js on both sides: its stamp goes into the merge commit
  git('checkout', '-q', '-b', 'brez', 'main');
  write('js/c.js', 'var C = 3;\n\n\n\n\nvar C2 = 1;\n');
  commit('brez: c.js');
  git('checkout', '-q', 'main');
  write('js/c.js', 'var C = 2;\n\n\n\n\nvar C2 = 3;\n');
  commit('main: c.js');
  git('checkout', '-q', 'brez');
  r = tool('main');
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.strictEqual(parents(), 2);
  assert.strictEqual(git('status', '--porcelain'), '');
  assert.strictEqual(stamp('--check').status, 0, 'žig datoteke, ki sta jo spremenili obe strani');

  // 5. a fast-forward: main's commits stay as they are
  git('checkout', '-q', 'ff');
  r = tool('main');
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.strictEqual(git('rev-parse', 'HEAD'), git('rev-parse', 'main'));

  // 6. uncommitted changes: nothing is done
  write('js/a.js', 'var A = 9;\n');
  r = tool('main');
  assert.strictEqual(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stderr, /neshranjene spremembe/);
  console.log('OK: spoji-main reši spore v žigih, dodanih vrsticah in seznamih testov, pravi spor pusti');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
