// Determinism / regression net: every track x 5 set-ups (race, title demo, upgraded car, crash, crash in the formula car)
// (Circuit Superstars physics, keys .../cs), 60 s each (the crash set-ups on a track with pits 80 s or more: they end with a pit stop and the repair). The full state of the race, every
// car and the loose panels is hashed every 10 s and compared with tests/golden/sim.json: a change to the physics, AI,
// damage, pits or race rules shows up here (finishing is covered by races.test.js). The crash runs must really crash
// (damage, loose panels, the repair on a track with pits), so a change can not quietly turn them into a plain drive.
//   node tests/golden.test.js            check
//   node tests/golden.test.js --update   write new reference values (only after an intended change!)
//   node tests/golden.test.js --only=monaco,cs
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore } = require('./lib/core.js');
const { trackIds, PHYSICS, SETUPS, runScenario } = require('./lib/sim.js');

const FILE = path.join(__dirname, 'golden', 'sim.json');
const update = process.argv.includes('--update');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const C = loadCore();
const golden = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const out = {};
let bad = 0, n = 0;
const t0 = Date.now();
for (const tid of trackIds(C)) for (const sn of Object.keys(SETUPS)) for (const phys of PHYSICS) {
  const key = `${tid}/${sn}/${phys}`;
  if (only.length && !only.every(o => key.split('/').includes(o))) { if (golden[key]) out[key] = golden[key]; continue; }
  const r = runScenario(C, tid, sn, phys);
  out[key] = r; n++;
  const g = golden[key], cv = r.cover;
  const ok = g && g.digest === r.digest;
  const covered = !SETUPS[sn].drive || (cv.dmg >= 0.2 && cv.loose >= 1 && (!C.TRACKS.find(d => d.id === tid).pit || cv.repairs >= 1));   // (the crash set-ups)
  if ((!update && !ok) || !covered) bad++;
  console.log(`${key.padEnd(26)} ${r.digest} lead ${String(r.lead).padStart(7)} m ${SETUPS[sn].drive ? `damage ${cv.dmg} loose ${cv.loose} rescues ${cv.rescues} repairs ${cv.repairs} ` : ''}` +
    `${!covered ? 'FAIL: this run does not really crash (damage 0.2+, a loose panel; the pit repair on a track with pits): adjust crashDrive in tests/lib/sim.js ' : ''}` +
    `${update ? '' : ok ? 'OK' : g ? 'CHANGED (was ' + g.digest + ', lead ' + g.lead + ' m)' : 'NO REFERENCE'}`);
}
if (update) {
  if (bad) { console.log('not written: fix the failures first'); process.exit(1); }
  fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + '\n'); console.log(`written ${FILE} (${n} scenarios, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
else { console.log(bad ? `FAIL: ${bad} of ${n} scenarios changed` : `OK: all ${n} scenarios identical (${((Date.now() - t0) / 1000).toFixed(0)} s)`); process.exit(bad ? 1 : 0); }
