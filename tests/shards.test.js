// The shares of the test runner (tests/run.js --shard k/n; GitHub runs the browser tests in 4 shares on 4 machines at once, see
// .github/workflows/tests.yml): for every suite and 1-6 shares each test in exactly one share, none left out; the browser tests' 4 shares
// about as long as each other (by run.js's SECS); every browser test that takes long (over 4 min) has its time in SECS, and SECS names
// only tests in the list; a bad --shard stops with an error, never runs everything.
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

// 1. every suite, 1-6 shares: each test in exactly one share
{
  const out = [];
  for (const suite of ['node', 'fleet', 'browser']) {
    const all = lines(run(suite, '--list'));
    for (let k = 1; k <= 6; k++) {
      let got = [];
      for (let j = 1; j <= k; j++) got = got.concat(lines(run(suite, '--shard', `${j}/${k}`, '--list')).slice(1));
      const ok = all.length > 0 && got.length === all.length && new Set(got).size === got.length && all.every(f => got.includes(f));
      if (!ok) out.push(`${suite} in ${k}: ${got.length} of ${all.length}`);
    }
  }
  check('every suite in 1-6 shares: each test in exactly one share, none left out', !out.length, out.join('; ') || 'node, fleet, browser');
}

// 2. the browser tests in 4 shares (as on GitHub): about as long as each other
{
  const head = lines(run('browser', '--shard', '1/4', '--list'))[0] || '', m = /the shares: ([\d, ]+) min/.exec(head), mins = m ? m[1].split(', ').map(Number) : [];
  check('the browser tests in 4 shares about as long as each other (the longest at most 15 % over the mean)', mins.length === 4 && Math.max(...mins) <= 1.15 * mins.reduce((a, b) => a + b, 0) / 4, head);
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

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
