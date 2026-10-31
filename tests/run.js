// Runs the test suites one after another (each in its own process) and prints a summary.
//   node tests/run.js           everything
//   node tests/run.js node      only the Node tests (physics, AI, races; ~4 min)
//   node tests/run.js browser   only the browser tests (Playwright; ~75 min with software WebGL)
//   node tests/run.js fleet     only the vehicle fleet (the render kit's rules, the garage's parts, the registry, every vehicle's handling, destruction and AI; how each is drawn; the car screen; ~10 min)
//   node tests/run.js browser --shard 2/4         one share of a suite (GitHub runs the browser tests on 4 machines at once, see SECS)
//   node tests/run.js browser --shard 2/4 --list  only print which tests that share has
//   node tests/run.js --related   only the tests related to what changed against main (npm run test:related; see RELATED below)
//   node tests/run.js --related --files js/lang.js,docs/proge/spa.md --list   the same for the files given (no git)
//   --quiet   only the failures (a failed test's FAIL lines and its last lines) and the summary
// A test that runs longer than TEST_TIMEOUT_MIN minutes (default 15), or than TEST_SLOW (default 4) times its usual time on GitHub (SECS)
// if that is longer, is stopped and counted as failed, so a hung test still ends with the summary (LIMIT_OF).
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

const SUITES = {
  node: ['stamp.test.js', 'shards.test.js', 'golden.test.js', 'repro.test.js', 'roll.test.js', 'corner.test.js', 'knock.test.js', 'races.test.js', 'cs-handling.test.js', 'nova.test.js', 'net-core.test.js', 'crossover.test.js', 'champ.test.js', 'rally.test.js', 'quali.test.js', 'weather.test.js', 'compounds.test.js', 'flags.test.js', 'vrsic.test.js', 'pikes.test.js', 'junctions.test.js', 'katu.test.js', 'traffic.test.js', 'police.test.js', 'caracoles.test.js', 'bathurst.test.js', 'chapman.test.js', 'bigsur.test.js', 'tianmen.test.js', 'uncompahgre.test.js', 'sani.test.js', 'iroha.test.js', 'mulholland.test.js', 'palomar.test.js', 'beartooth.test.js', 'rastro.test.js', 'moki.test.js', 'greatalpine.test.js', 'maunakea.test.js', 'baldy.test.js', 'cpalace.test.js', 'riverside.test.js', 'detroit.test.js', 'monterey.test.js', 'longford.test.js', 'newcastle.test.js', 'rio.test.js', 'toronto.test.js', 'medvode.test.js', 'medvode-props.test.js', 'medvode-fence.test.js', 'montreal.test.js', 'bangsaen.test.js', 'troisrivieres.test.js', 'marrakesh.test.js', 'townsville.test.js', 'hotham.test.js', 'lang.test.js', 'fuel.test.js', 'rivals.test.js', 'slip.test.js', 'faults.test.js', 'radio.test.js', 'pits.test.js', 'boards.test.js', 'start.test.js', 'grid.test.js', 'field.test.js', 'hudsigns.test.js', 'wheels.test.js', 'debris.test.js', 'lod.test.js', 'quick.test.js', 'shot.test.js', 'missions.test.js', 'm06.test.js', 'm01.test.js', 'm49.test.js', 'm47.test.js', 'm46.test.js', 'm19.test.js', 'm35.test.js', 'm37.test.js', 'm48.test.js', 'm30.test.js', 'm33.test.js', 'm53.test.js', 'm39.test.js', 'm50.test.js', 'm34.test.js', 'm55.test.js', 'm10.test.js', 'm02.test.js'],
  fleet: ['kit.test.js', 'deli.test.js', 'fleet.test.js', 'browser/fleet.test.mjs', 'browser/cars-ui.test.mjs'],
  browser: ['browser/garage.test.mjs', 'browser/smoke.test.mjs', 'browser/repro.test.mjs', 'browser/flystart.test.mjs', 'browser/newver.test.mjs', 'browser/nvheli.test.mjs', 'browser/app.test.mjs', 'browser/crash.test.mjs', 'browser/nova.test.mjs', 'browser/kolibri.test.mjs', 'browser/wheels.test.mjs', 'browser/world.test.mjs', 'browser/pits.test.mjs', 'browser/repair.test.mjs', 'browser/carcull.test.mjs', 'browser/champ.test.mjs', 'browser/quali.test.mjs', 'browser/weather.test.mjs', 'browser/flags.test.mjs', 'browser/career.test.mjs', 'browser/replay.test.mjs', 'browser/atmos.test.mjs', 'browser/sound.test.mjs', 'browser/fire.test.mjs', 'browser/gfx.test.mjs', 'browser/look.test.mjs', 'browser/look2.test.mjs', 'browser/carlow.test.mjs', 'browser/camtilt.test.mjs', 'browser/pad.test.mjs', 'browser/memory.test.mjs', 'browser/perf.test.mjs', 'browser/online.test.mjs', 'browser/online4.test.mjs', 'browser/medvode-castle.test.mjs', 'browser/medvode-fence.test.mjs', 'browser/medvode-props.test.mjs', 'browser/lang.test.mjs', 'browser/menu.test.mjs', 'browser/saver.test.mjs', 'browser/tower.test.mjs', 'browser/share.test.mjs', 'browser/sky.test.mjs', 'browser/fuel.test.mjs', 'browser/rivals.test.mjs', 'browser/school.test.mjs', 'browser/slip.test.mjs', 'browser/faults.test.mjs', 'browser/radio.test.mjs', 'browser/chal.test.mjs', 'browser/onchamp.test.mjs', 'browser/hlvid.test.mjs', 'browser/ctrl.test.mjs', 'browser/rio.test.mjs', 'browser/townsville.test.mjs', 'browser/start.test.mjs', 'browser/hudcol.test.mjs', 'browser/hud.test.mjs', 'browser/notes.test.mjs', 'browser/kerb.test.mjs', 'browser/marks.test.mjs', 'browser/boards.test.mjs', 'browser/covers.test.mjs', 'browser/roadside.test.mjs', 'browser/quick.test.mjs', 'browser/seams.test.mjs', 'browser/napake.test.mjs', 'browser/napake-slika.test.mjs', 'browser/napake-zastavice.test.mjs', 'browser/napake-samodejno.test.mjs', 'browser/napake-posnetek.test.mjs', 'browser/missions.test.mjs', 'browser/m06.test.mjs', 'browser/m01.test.mjs', 'browser/m49.test.mjs', 'browser/m47.test.mjs', 'browser/m46.test.mjs', 'browser/m19.test.mjs', 'browser/m35.test.mjs', 'browser/m37.test.mjs', 'browser/m48.test.mjs', 'browser/m30.test.mjs', 'browser/m33.test.mjs', 'browser/m53.test.mjs', 'browser/m39.test.mjs', 'browser/m50.test.mjs', 'browser/m34.test.mjs', 'browser/m55.test.mjs', 'browser/m10.test.mjs', 'browser/m02.test.mjs'],
};
// How long each browser test takes on GitHub (seconds, from the run of main on 29. 10. 2026, Chromium 141): --shard deals the tests out by it,
// and a test's time limit grows with it (LIMIT_OF). Update it from a run's summary when a test grows a lot (smoke, memory, perf, gfx and
// world grow with every track); a test not listed counts as DEF_SECS
const SECS = {
  'browser/memory.test.mjs': 2656, 'browser/perf.test.mjs': 1860, 'browser/crash.test.mjs': 1100, 'browser/smoke.test.mjs': 996, 'browser/gfx.test.mjs': 736,
  'browser/world.test.mjs': 674, 'browser/covers.test.mjs': 653, 'browser/marks.test.mjs': 348, 'browser/hudcol.test.mjs': 342, 'browser/menu.test.mjs': 324,
  'browser/online4.test.mjs': 320, 'browser/notes.test.mjs': 249, 'browser/kerb.test.mjs': 223, 'browser/kolibri.test.mjs': 209, 'browser/school.test.mjs': 194,
  'browser/share.test.mjs': 190, 'browser/onchamp.test.mjs': 188, 'browser/online.test.mjs': 181, 'browser/quali.test.mjs': 169, 'browser/radio.test.mjs': 168,
  'browser/nova.test.mjs': 160, 'browser/chal.test.mjs': 155, 'browser/replay.test.mjs': 147, 'browser/carlow.test.mjs': 140, 'browser/wheels.test.mjs': 138,
  'browser/pad.test.mjs': 134, 'browser/flags.test.mjs': 121, 'browser/slip.test.mjs': 114, 'browser/look.test.mjs': 113, 'browser/roadside.test.mjs': 112,
  'browser/look2.test.mjs': 108, 'browser/fuel.test.mjs': 102, 'browser/rio.test.mjs': 96, 'browser/flystart.test.mjs': 94, 'browser/sound.test.mjs': 87,
  'browser/napake.test.mjs': 81, 'browser/newver.test.mjs': 72, 'browser/weather.test.mjs': 71, 'browser/hlvid.test.mjs': 70, 'browser/app.test.mjs': 70,
  'browser/sky.test.mjs': 70, 'browser/pits.test.mjs': 66, 'browser/medvode-fence.test.mjs': 65, 'browser/carcull.test.mjs': 62, 'browser/seams.test.mjs': 61,
  'browser/camtilt.test.mjs': 58, 'browser/napake-slika.test.mjs': 54, 'browser/lang.test.mjs': 53, 'browser/repair.test.mjs': 52, 'browser/napake-posnetek.test.mjs': 50,
  'browser/ctrl.test.mjs': 50, 'browser/fire.test.mjs': 49, 'browser/champ.test.mjs': 48, 'browser/napake-samodejno.test.mjs': 48, 'browser/faults.test.mjs': 47,
  'browser/boards.test.mjs': 44, 'browser/repro.test.mjs': 43, 'browser/hud.test.mjs': 43, 'browser/start.test.mjs': 42, 'browser/saver.test.mjs': 42,
  'browser/career.test.mjs': 41, 'browser/medvode-props.test.mjs': 37, 'browser/medvode-castle.test.mjs': 36, 'browser/tower.test.mjs': 35,
  'browser/townsville.test.mjs': 29, 'browser/napake-zastavice.test.mjs': 28, 'browser/rivals.test.mjs': 27, 'browser/quick.test.mjs': 26,
  'browser/atmos.test.mjs': 23,
  'browser/garage.test.mjs': 900,
};
const DEF_SECS = 60, secs = (f) => SECS[f] || DEF_SECS;
// one share (k of n) of a list: the longest test first, each to the share with the least time so far (ties: the lower share), each share
// then in the list's own order; the same list always gives the same shares
function shareOf(list, k, n) {
  const load = new Array(n).fill(0), to = new Map();
  for (const f of list.map((f, i) => [f, i]).sort((a, b) => secs(b[0]) - secs(a[0]) || a[1] - b[1]).map(e => e[0])) {
    let j = 0; for (let i = 1; i < n; i++) if (load[i] < load[j]) j = i;
    to.set(f, j); load[j] += secs(f);
  }
  return { mine: list.filter(f => to.get(f) === k - 1), load };
}

// --related: the tests of what changed. A file picks the tests named as it is, or as a part of its name (js/tracks/spa.js, docs/proge/spa.md:
// spa.test.js; js/world-montreal.js: montreal and world; docs/proge/medvode.md: medvode, medvode-props, browser/medvode-castle ...), a changed
// test itself, and the tests RELATED gives for it (the big shared files, which no name matches)
const RELATED = [
  [/^(js|css)\/|^index\.html$|^sw\.js$|^tools\/stamp\.js$/, ['stamp.test.js']],   // (the stamps after every change in js/ or css/)
  [/^js\/core\.js$/, ['golden.test.js', 'start.test.js', 'quick.test.js', 'repro.test.js', 'nova.test.js', 'browser/repro.test.mjs']],
  [/^js\/game\.js$|^index\.html$/, ['lang.test.js', 'browser/quick.test.mjs', 'browser/repro.test.mjs', 'browser/lang.test.mjs', 'browser/nova.test.mjs']],
  [/^js\/(world[\w-]*|render|tex)\.js$/, ['browser/world.test.mjs', 'browser/gfx.test.mjs']],
  [/^js\/input\.js$/, ['browser/ctrl.test.mjs', 'browser/pad.test.mjs']],
  [/^js\/(menu|menu-data)\.js$|^css\/menu\.css$/, ['browser/menu.test.mjs']],
  [/^js\/net\.js$/, ['net-core.test.js', 'browser/online.test.mjs']],
  [/^js\/sfx\.js$/, ['browser/sound.test.mjs']],
  [/^js\/lang\.js$|^js\/tracks\//, ['lang.test.js']],   // (a track's English name and description)
  [/^js\/cars\//, ['kit.test.js', 'deli.test.js', 'fleet.test.js']],
  [/^js\/replay|^css\/style\.css$/, ['browser/replay.test.mjs']],
  [/^js\/napake\.js$|^css\/napake\.css$/, ['browser/replay.test.mjs']],   // (Označi: the replay's twelfth button)
  [/^js\/input\.js$/, ['browser/napake-zastavice.test.mjs', 'browser/napake-samodejno.test.mjs']],
  [/^tools\/posnetek\.mjs$/, ['browser/napake-posnetek.test.mjs']],   // (the recording as a file, opened for Claude)   // (F and the pad's Select: a flag; O: Prikaz za razvijalca)
  [/\.md$/, ['fleet.test.js']],   // (every .md checked for a car maker's name)
  [/^tests\/run\.js$|^\.github\/workflows\//, ['shards.test.js']],
  [/^js\/missions(\.js$|\/)|^css\/missions\.css$/, ['missions.test.js', 'browser/missions.test.mjs']],   // (the special missions: the system and each mission's texts)
  [/^js\/missions\/kit\.js$/, ['m01.test.js', 'browser/m01.test.mjs', 'm49.test.js', 'browser/m49.test.mjs', 'm47.test.js', 'browser/m47.test.mjs', 'm46.test.js', 'browser/m46.test.mjs', 'm19.test.js', 'browser/m19.test.mjs', 'm35.test.js', 'browser/m35.test.mjs', 'm37.test.js', 'browser/m37.test.mjs', 'm48.test.js', 'browser/m48.test.mjs', 'm30.test.js', 'browser/m30.test.mjs', 'm33.test.js', 'browser/m33.test.mjs', 'm53.test.js', 'browser/m53.test.mjs', 'm06.test.js', 'browser/m06.test.mjs', 'm39.test.js', 'browser/m39.test.mjs', 'm50.test.js', 'browser/m50.test.mjs', 'm34.test.js', 'browser/m34.test.mjs', 'm55.test.js', 'browser/m55.test.mjs', 'm10.test.js', 'browser/m10.test.mjs', 'm02.test.js', 'browser/m02.test.mjs']],   // (the missions' shared kit: the fire engine, the fire, the water, the aim; group 3's water, the boat, the skins; group 6's ride, herd, trailer, hospital)
  [/^tests\/lib\/drive\.js$|^tests\/browser\/misdrive\.mjs$/, ['m39.test.js', 'browser/m39.test.mjs', 'm50.test.js', 'browser/m50.test.mjs', 'm34.test.js', 'browser/m34.test.mjs', 'm55.test.js', 'browser/m55.test.mjs', 'm10.test.js', 'browser/m10.test.mjs', 'm02.test.js', 'browser/m02.test.mjs']],   // (the missions' drivers for the tests)
  [/^tests\/lib\//, ['quick.test.js']],
  [/^tests\/browser\/lib\.mjs$/, ['browser/quick.test.mjs']],
];
const stem = (f) => path.basename(f).replace(/\.test\.m?js$/, '').replace(/\.[^.]+$/, '').toLowerCase();
function related(files, all) {
  const want = new Set(), parts = (f) => stem(f).split(/[-_.]/).filter(Boolean);
  for (const f of files) {
    if (all.includes(f.replace(/^tests\//, ''))) want.add(f.replace(/^tests\//, ''));   // (a changed test)
    const fp = parts(f);
    for (const t of all) { const ts = stem(t); if (ts === stem(f) || fp.includes(ts) || fp.includes(ts.split('-')[0])) want.add(t); }
    for (const [re, ts] of RELATED) if (re.test(f)) for (const t of ts) want.add(t);
  }
  return all.filter(t => want.has(t));
}
// what changed against main: the commits since the branch left it, what is not committed yet, the new files
function changedFiles() {
  const git = (...a) => { const r = spawnSync('git', a, { encoding: 'utf8', cwd: path.join(__dirname, '..') }); return r.status === 0 ? r.stdout.trim() : null; };
  const refs = ['origin/main', 'main'].filter(r => git('rev-parse', '--verify', '--quiet', r) != null);
  if (!refs.length) { console.error('--related: no main branch to compare with (git fetch origin main)'); process.exit(2); }
  // (the newer of the two where they differ, one of them not fetched for a while; a shallow clone without the common commit: against main as it is)
  const bases = refs.map(r => git('merge-base', 'HEAD', r) || r), base = bases.reduce((a, b) => git('merge-base', '--is-ancestor', a, b) != null ? b : a);
  return [...new Set([git('diff', '--name-only', base), git('ls-files', '--others', '--exclude-standard')].join('\n').split('\n').filter(Boolean))];
}

const args = process.argv.slice(2), opt = { which: null, shard: null, list: false, quiet: false, related: false, files: null };
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--shard') opt.shard = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : '';
  else if (args[i] === '--list') opt.list = true; else if (args[i] === '--quiet') opt.quiet = true; else if (args[i] === '--related') opt.related = true;
  else if (args[i] === '--files') opt.files = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i].split(',').map(f => f.trim()).filter(Boolean) : [];
  else if (!opt.which) opt.which = args[i]; else { console.error('unexpected argument: ' + args[i]); process.exit(2); }
}
if (opt.files && !opt.related) { console.error('--files goes with --related'); process.exit(2); }
const which = opt.which;
let list = which ? SUITES[which] : [...SUITES.node, ...SUITES.fleet, ...SUITES.browser];
if (!list) { console.error('unknown suite: ' + which + ' (node | fleet | browser)'); process.exit(2); }
if (opt.related) {
  const files = opt.files || changedFiles();
  list = related(files, list);
  console.log(`related to ${files.length} changed file${files.length === 1 ? '' : 's'}: ${list.length} test${list.length === 1 ? '' : 's'}${list.length ? '' : ' (nothing to run)'}`);
}
if (opt.shard != null) {
  const m = /^(\d+)\/(\d+)$/.exec(opt.shard), k = m ? +m[1] : 0, n = m ? +m[2] : 0;
  if (!(n >= 1 && k >= 1 && k <= n)) { console.error('bad --shard: ' + opt.shard + ' (k/n, 1 <= k <= n)'); process.exit(2); }
  const { mine, load } = shareOf(list, k, n);
  console.log(`share ${k}/${n}: ${mine.length} of ${list.length} tests, ~${Math.round(load[k - 1] / 60)} min on GitHub (the shares: ${load.map(l => Math.round(l / 60)).join(', ')} min)`);
  list = mine;
}
if (opt.list) { for (const f of list) console.log(f); process.exit(0); }
const LIMIT = (+process.env.TEST_TIMEOUT_MIN || 15) * 60000;
// (the memory test goes three times through every track, the smoke and the phone budget tests drive on each: they grow with each new track, so they get twice the time;
// the browser fleet test the same: it grows with each vehicle, and with the fields it measures them in, 22 and 100 cars)
// TEST_SLOW: a test may also take that many times its SECS (default 4: a cloud session's machine takes 2 to 2.5 times as long as GitHub's,
// e.g. world and gfx ~25-30 min; GitHub's browser tests 2, tests.yml), so a long test is not stopped only because the machine is slow
const SLOW = +process.env.TEST_SLOW || 4;
const LIMIT_OF = (f) => Math.round(Math.max((/memory\.test/.test(f) ? 3 : /smoke\.test|perf\.test|browser\/fleet\.test|browser\/garage\.test/.test(f) ? 2 : 1) * LIMIT, SLOW * secs(f) * 1000) / 60000) * 60000;   // (the memory test: three times; in whole minutes)

const results = [];
for (const f of list) {
  const t0 = Date.now();
  if (!opt.quiet) console.log(`\n### ${f}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { stdio: opt.quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit', encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, timeout: LIMIT_OF(f), killSignal: 'SIGKILL' });
  const timedOut = !!(r.error && r.error.code === 'ETIMEDOUT');
  if (opt.quiet && r.status !== 0) {   // (quiet: a failed test's FAIL lines and its last lines, a stack trace among them)
    const out = ((r.stdout || '') + '\n' + (r.stderr || '')).split('\n').filter(l => l.trim() && !/^OK\b/.test(l)), fails = out.filter(l => /\bFAIL\b/.test(l));
    console.log(`\n### ${f}`); for (const l of [...new Set([...fails.slice(0, 40), ...out.slice(-15)])]) console.log(l);
  }
  if (timedOut) console.log(`FAIL ${f}: stopped after ${LIMIT_OF(f) / 60000} min (TEST_TIMEOUT_MIN, TEST_SLOW)`);
  results.push({ f, ok: r.status === 0, s: ((Date.now() - t0) / 1000).toFixed(0), timedOut });
  if (r.status !== 0 && process.env.GITHUB_ACTIONS) console.log(`::error title=${f}::${timedOut ? `stopped after ${LIMIT_OF(f) / 60000} min` : `exit ${r.status != null ? r.status : r.signal}`} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);   // (on GitHub: an annotation of the check run, readable where the job's log is not)
}
console.log('\n=== summary');
for (const r of results) if (!opt.quiet || !r.ok) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.f} (${r.s} s)${r.timedOut ? ' — timed out' : ''}`);
if (opt.quiet) console.log(`${results.filter(r => r.ok).length} of ${results.length} tests passed (${results.reduce((a, r) => a + +r.s, 0)} s)`);
process.exit(results.every(r => r.ok) ? 0 : 1);
