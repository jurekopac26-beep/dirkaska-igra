// Determinism / regression net: 8 tracks x 3 set-ups x 2 physics, 60 s each. The full state of every car is
// hashed every 10 s and compared with tests/golden/sim.json. Any change to the physics, AI or race rules shows up here.
//   node tests/golden.test.js            check
//   node tests/golden.test.js --update   write new reference values (only after an intended change!)
//   node tests/golden.test.js --only=monaco,cs
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore } = require('./lib/core.js');
const { TRACK_IDS, PHYSICS, SETUPS, runScenario } = require('./lib/sim.js');

const FILE = path.join(__dirname, 'golden', 'sim.json');
const update = process.argv.includes('--update');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const C = loadCore();
const golden = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const out = {};
let bad = 0, n = 0;
const t0 = Date.now();
for (const tid of TRACK_IDS) for (const sn of Object.keys(SETUPS)) for (const phys of PHYSICS) {
  const key = `${tid}/${sn}/${phys}`;
  if (only.length && !only.every(o => key.split('/').includes(o))) { if (golden[key]) out[key] = golden[key]; continue; }
  const r = runScenario(C, tid, sn, phys);
  out[key] = r; n++;
  const g = golden[key];
  const ok = g && g.digest === r.digest;
  if (!update && !ok) bad++;
  console.log(`${key.padEnd(26)} ${r.digest} lead ${String(r.lead).padStart(7)} m ${update ? '' : ok ? 'OK' : g ? 'CHANGED (was ' + g.digest + ', lead ' + g.lead + ' m)' : 'NO REFERENCE'}`);
}
if (update) { fs.writeFileSync(FILE, JSON.stringify(out, null, 1) + '\n'); console.log(`written ${FILE} (${n} scenarios, ${((Date.now() - t0) / 1000).toFixed(0)} s)`); }
else { console.log(bad ? `FAIL: ${bad} of ${n} scenarios changed` : `OK: all ${n} scenarios identical (${((Date.now() - t0) / 1000).toFixed(0)} s)`); process.exit(bad ? 1 : 0); }
