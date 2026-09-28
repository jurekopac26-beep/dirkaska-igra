// Runs the test suites one after another (each in its own process) and prints a summary.
//   node tests/run.js           everything
//   node tests/run.js node      only the Node tests (physics, AI, races; ~1 min)
//   node tests/run.js browser   only the browser tests (Playwright; ~7 min with software WebGL)
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

const SUITES = {
  node: ['stamp.test.js', 'golden.test.js', 'races.test.js', 'cs-handling.test.js'],
  browser: ['browser/smoke.test.mjs', 'browser/world.test.mjs', 'browser/pits.test.mjs', 'browser/memory.test.mjs'],
};
const which = process.argv[2];
const list = which ? SUITES[which] : [...SUITES.node, ...SUITES.browser];
if (!list) { console.error('unknown suite: ' + which + ' (node | browser)'); process.exit(2); }

const results = [];
for (const f of list) {
  const t0 = Date.now();
  console.log(`\n### ${f}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { stdio: 'inherit' });
  results.push({ f, ok: r.status === 0, s: ((Date.now() - t0) / 1000).toFixed(0) });
}
console.log('\n=== summary');
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.f} (${r.s} s)`);
process.exit(results.every(r => r.ok) ? 0 : 1);
