// Runs the test suites one after another (each in its own process) and prints a summary.
//   node tests/run.js           everything
//   node tests/run.js node      only the Node tests (physics, AI, races; ~4 min)
//   node tests/run.js browser   only the browser tests (Playwright; ~60 min with software WebGL)
// A test that runs longer than TEST_TIMEOUT_MIN minutes (default 15) is stopped and counted as failed, so a hung test
// still ends with the summary.
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

const SUITES = {
  node: ['stamp.test.js', 'golden.test.js', 'races.test.js', 'cs-handling.test.js', 'net-core.test.js', 'crossover.test.js', 'champ.test.js', 'rally.test.js', 'quali.test.js', 'weather.test.js', 'compounds.test.js', 'flags.test.js', 'vrsic.test.js', 'katu.test.js', 'traffic.test.js', 'police.test.js', 'caracoles.test.js', 'chapman.test.js', 'bigsur.test.js', 'lang.test.js', 'fuel.test.js', 'rivals.test.js'],
  browser: ['browser/smoke.test.mjs', 'browser/app.test.mjs', 'browser/world.test.mjs', 'browser/pits.test.mjs', 'browser/champ.test.mjs', 'browser/quali.test.mjs', 'browser/weather.test.mjs', 'browser/flags.test.mjs', 'browser/career.test.mjs', 'browser/replay.test.mjs', 'browser/atmos.test.mjs', 'browser/sound.test.mjs', 'browser/cockpit.test.mjs', 'browser/gfx.test.mjs', 'browser/look.test.mjs', 'browser/look2.test.mjs', 'browser/pad.test.mjs', 'browser/memory.test.mjs', 'browser/perf.test.mjs', 'browser/online.test.mjs', 'browser/online4.test.mjs', 'browser/lang.test.mjs', 'browser/saver.test.mjs', 'browser/tower.test.mjs', 'browser/share.test.mjs', 'browser/sky.test.mjs', 'browser/fuel.test.mjs', 'browser/rivals.test.mjs', 'browser/school.test.mjs'],
};
const which = process.argv[2];
const list = which ? SUITES[which] : [...SUITES.node, ...SUITES.browser];
if (!list) { console.error('unknown suite: ' + which + ' (node | browser)'); process.exit(2); }
const LIMIT = (+process.env.TEST_TIMEOUT_MIN || 15) * 60000;

const results = [];
for (const f of list) {
  const t0 = Date.now();
  console.log(`\n### ${f}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { stdio: 'inherit', timeout: LIMIT, killSignal: 'SIGKILL' });
  const timedOut = !!(r.error && r.error.code === 'ETIMEDOUT');
  if (timedOut) console.log(`FAIL ${f}: stopped after ${LIMIT / 60000} min (TEST_TIMEOUT_MIN)`);
  results.push({ f, ok: r.status === 0, s: ((Date.now() - t0) / 1000).toFixed(0), timedOut });
}
console.log('\n=== summary');
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.f} (${r.s} s)${r.timedOut ? ' — timed out' : ''}`);
process.exit(results.every(r => r.ok) ? 0 : 1);
