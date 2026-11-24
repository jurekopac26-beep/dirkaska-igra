// Determinism / regression net: every track x 5 set-ups (race, title demo, upgraded car, crash, crash in the formula car)
// (Circuit Superstars physics, keys .../cs), 60 s each (the crash set-ups on a track with pits 80 s or more: they end with a pit stop and the repair). The full state of the race, every
// car and the loose panels is hashed every 10 s and compared with tests/golden/sim.json: a change to the physics, AI,
// damage, pits or race rules shows up here (finishing is covered by races.test.js). The crash runs must really crash
// (damage, loose panels, the repair on a track with pits), so a change can not quietly turn them into a plain drive.
//   node tests/golden.test.js            check
//   node tests/golden.test.js --update   write new reference values (only after an intended change!)
//   node tests/golden.test.js --only=monaco,cs
// The scenarios run in worker threads (22. 11. 2026, #953: one after another 476 scenarios took ~13 min, the slowest of test:related),
// GOLDEN_JOBS of them at once (default: every processor; 1 = in this thread, as before). Each scenario is independent (its own Track,
// Race and seeded Math.random; each worker its own Core), so the digests are the same whichever worker runs it and in what order; the
// lines are printed as the scenarios end, sim.json is written in the old order
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { loadCore } = require('./lib/core.js');
const { trackIds, PHYSICS, SETUPS, runScenario } = require('./lib/sim.js');

if (!isMainThread) {   // a worker: Core of its own, scenarios one at a time as the main thread hands them out
  const C = loadCore();
  parentPort.on('message', (m) => {
    if (m == null) return process.exit(0);
    const [tid, sn, phys] = m.split('/');
    parentPort.postMessage({ key: m, r: runScenario(C, tid, sn, phys) });
  });
  parentPort.postMessage(null);   // (ready)
  return;
}

const FILE = path.join(__dirname, 'golden', 'sim.json');
const update = process.argv.includes('--update');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const C = loadCore();
const golden = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const keys = [], todo = [];
for (const tid of trackIds(C)) for (const sn of Object.keys(SETUPS)) for (const phys of PHYSICS) {
  const key = `${tid}/${sn}/${phys}`;
  keys.push(key);
  if (!(only.length && !only.every(o => key.split('/').includes(o)))) todo.push(key);
}
const out = {};
let bad = 0, n = 0;
const t0 = Date.now();
function report(key, r) {
  const [tid, sn] = key.split('/');
  out[key] = r; n++;
  const g = golden[key], cv = r.cover;
  const ok = g && g.digest === r.digest;
  const covered = !SETUPS[sn].drive || (cv.dmg >= 0.2 && cv.loose >= 1 && (!C.TRACKS.find(d => d.id === tid).pit || cv.repairs >= 1));   // (the crash set-ups)
  if ((!update && !ok) || !covered) bad++;
  console.log(`${key.padEnd(26)} ${r.digest} lead ${String(r.lead).padStart(7)} m ${SETUPS[sn].drive ? `damage ${cv.dmg} loose ${cv.loose} rescues ${cv.rescues} repairs ${cv.repairs} ` : ''}` +
    `${!covered ? 'FAIL: this run does not really crash (damage 0.2+, a loose panel; the pit repair on a track with pits): adjust crashDrive in tests/lib/sim.js ' : ''}` +
    `${update ? '' : ok ? 'OK' : g ? 'CHANGED (was ' + g.digest + ', lead ' + g.lead + ' m)' : 'NO REFERENCE'}`);
}
function finish() {
  const all = {};
  for (const key of keys) { if (out[key]) all[key] = out[key]; else if (golden[key]) all[key] = golden[key]; }   // (--only: the others kept as they were)
  if (update) {
    if (bad) { console.log('not written: fix the failures first'); process.exit(1); }
    fs.writeFileSync(FILE, JSON.stringify(all, null, 1) + '\n'); console.log(`written ${FILE} (${n} scenarios, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  else { console.log(bad ? `FAIL: ${bad} of ${n} scenarios changed` : `OK: all ${n} scenarios identical (${((Date.now() - t0) / 1000).toFixed(0)} s)`); process.exit(bad ? 1 : 0); }
}

const JOBS = Math.max(1, Math.min(todo.length, Math.floor(+process.env.GOLDEN_JOBS || os.cpus().length)));
if (JOBS === 1) { for (const key of todo) { const [tid, sn, phys] = key.split('/'); report(key, runScenario(C, tid, sn, phys)); } finish(); }
else {
  console.log(`${todo.length} scenarios, ${JOBS} at once (GOLDEN_JOBS)`);
  let next = 0, live = JOBS;
  for (let w = 0; w < JOBS; w++) {
    const wk = new Worker(__filename);
    const give = () => wk.postMessage(next < todo.length ? todo[next++] : null);
    wk.on('message', (m) => { if (m) report(m.key, m.r); give(); });
    wk.on('error', (e) => { console.log(`FAIL: a worker stopped: ${e.stack || e}`); process.exit(1); });
    wk.on('exit', () => { if (--live === 0) { if (n < todo.length) { console.log(`FAIL: ${todo.length - n} scenarios not run`); process.exit(1); } finish(); } });
  }
}
