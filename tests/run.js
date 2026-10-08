// Runs the test suites one after another (each in its own process) and prints a summary.
//   node tests/run.js           everything
//   node tests/run.js node      only the Node tests (physics, AI, races; ~4 min)
//   node tests/run.js browser   only the browser tests (Playwright; ~75 min with software WebGL)
//   node tests/run.js fleet     only the vehicle fleet (the render kit's rules, the registry, every vehicle's handling, destruction and AI; how each is drawn; the car screen; ~10 min)
// A test that runs longer than TEST_TIMEOUT_MIN minutes (default 15) is stopped and counted as failed, so a hung test
// still ends with the summary.
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

const SUITES = {
  node: ['stamp.test.js', 'golden.test.js', 'roll.test.js', 'knock.test.js', 'races.test.js', 'cs-handling.test.js', 'net-core.test.js', 'crossover.test.js', 'champ.test.js', 'rally.test.js', 'quali.test.js', 'weather.test.js', 'compounds.test.js', 'flags.test.js', 'vrsic.test.js', 'junctions.test.js', 'katu.test.js', 'traffic.test.js', 'police.test.js', 'caracoles.test.js', 'chapman.test.js', 'bigsur.test.js', 'tianmen.test.js', 'uncompahgre.test.js', 'sani.test.js', 'iroha.test.js', 'mulholland.test.js', 'palomar.test.js', 'beartooth.test.js', 'rastro.test.js', 'moki.test.js', 'baldy.test.js', 'cpalace.test.js', 'riverside.test.js', 'monterey.test.js', 'longford.test.js', 'newcastle.test.js', 'rio.test.js', 'toronto.test.js', 'medvode.test.js', 'medvode-props.test.js', 'medvode-fence.test.js', 'bangsaen.test.js', 'lang.test.js', 'fuel.test.js', 'rivals.test.js', 'slip.test.js', 'faults.test.js', 'radio.test.js'],
  fleet: ['kit.test.js', 'fleet.test.js', 'browser/fleet.test.mjs', 'browser/cars-ui.test.mjs'],
  browser: ['browser/smoke.test.mjs', 'browser/app.test.mjs', 'browser/crash.test.mjs', 'browser/world.test.mjs', 'browser/pits.test.mjs', 'browser/champ.test.mjs', 'browser/quali.test.mjs', 'browser/weather.test.mjs', 'browser/flags.test.mjs', 'browser/career.test.mjs', 'browser/replay.test.mjs', 'browser/atmos.test.mjs', 'browser/sound.test.mjs', 'browser/cockpit.test.mjs', 'browser/gfx.test.mjs', 'browser/look.test.mjs', 'browser/look2.test.mjs', 'browser/carlow.test.mjs', 'browser/camtilt.test.mjs', 'browser/pad.test.mjs', 'browser/memory.test.mjs', 'browser/perf.test.mjs', 'browser/online.test.mjs', 'browser/online4.test.mjs', 'browser/medvode-castle.test.mjs', 'browser/medvode-fence.test.mjs', 'browser/medvode-props.test.mjs', 'browser/lang.test.mjs', 'browser/menu.test.mjs', 'browser/saver.test.mjs', 'browser/tower.test.mjs', 'browser/share.test.mjs', 'browser/sky.test.mjs', 'browser/fuel.test.mjs', 'browser/rivals.test.mjs', 'browser/school.test.mjs', 'browser/slip.test.mjs', 'browser/faults.test.mjs', 'browser/radio.test.mjs', 'browser/chal.test.mjs', 'browser/onchamp.test.mjs', 'browser/hlvid.test.mjs', 'browser/ctrl.test.mjs', 'browser/rio.test.mjs'],
};
const which = process.argv[2];
const list = which ? SUITES[which] : [...SUITES.node, ...SUITES.fleet, ...SUITES.browser];
if (!list) { console.error('unknown suite: ' + which + ' (node | fleet | browser)'); process.exit(2); }
const LIMIT = (+process.env.TEST_TIMEOUT_MIN || 15) * 60000;
// (the memory test goes three times through every track, the smoke and the phone budget tests drive on each: they grow with each new track, so they get twice the time)
const LIMIT_OF = (f) => (/memory\.test/.test(f) ? 3 : /smoke\.test|perf\.test/.test(f) ? 2 : 1) * LIMIT;   // (the memory test: three times)

const results = [];
for (const f of list) {
  const t0 = Date.now();
  console.log(`\n### ${f}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { stdio: 'inherit', timeout: LIMIT_OF(f), killSignal: 'SIGKILL' });
  const timedOut = !!(r.error && r.error.code === 'ETIMEDOUT');
  if (timedOut) console.log(`FAIL ${f}: stopped after ${LIMIT_OF(f) / 60000} min (TEST_TIMEOUT_MIN)`);
  results.push({ f, ok: r.status === 0, s: ((Date.now() - t0) / 1000).toFixed(0), timedOut });
}
console.log('\n=== summary');
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.f} (${r.s} s)${r.timedOut ? ' — timed out' : ''}`);
process.exit(results.every(r => r.ok) ? 0 : 1);
