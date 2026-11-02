// tools/shot.mjs's options (sklop 14 in docs/orodje-za-napake.md), read before any browser starts: --pokonci and --lezece (each alone and
// both) are known options, as are --m, --t, --vreme, --nizka, --pred, --root, --out and --nabor; an unknown one is named in the usage line. Without
// a track (and without --nabor) the tool prints its usage and exits with 2, so nothing here opens the game.
//   node tests/shot.test.js
'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const run = (...a) => { const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'shot.mjs'), ...a], { encoding: 'utf8', timeout: 60000 }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };

for (const a of [['--pokonci'], ['--lezece'], ['--pokonci', '--lezece'], ['--lezece', '--m', '1284', '--vreme', 'dez', '--out', 'x'], ['--t', '20', '--root', '.', '--pokonci'], ['--nizka', '--m', '400']]) {
  const r = run(...a);
  check(a.join(' ') + ': known (the usage only for the missing track)', r.code === 2 && /usage:/.test(r.out) && !/unknown/.test(r.out), r.out.trim().split('\n').pop());
}
{
  const r = run('--pokonci', '--lezeče');
  check('--lezeče (not an option): named as unknown', r.code === 2 && /unknown: --lezeče/.test(r.out), r.out.trim().split('\n').pop());
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
