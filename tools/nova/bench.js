// JS time of a 100-car Nürburg race (the LOD field), cs vs nova: node bench.js [secs]
'use strict';
const ROOT = process.env.GAME_ROOT || require('path').resolve(__dirname, '../..');
const { loadCore } = require(ROOT + '/tests/lib/core.js');
const { seeded } = require(ROOT + '/tests/lib/sim.js');
const C = loadCore();
const DT = 1 / 120, secs = +(process.argv[2] || 30), tid = process.argv[3] || 'nring', nAI = +(process.argv[4] || 99);
for (const phys of (process.env.PH || 'cs,nova').split(',')) {
  Math.random = seeded(7);
  const T = new C.Track(C.TRACKS.find(d => d.id === tid));
  const r = new C.Race(T, { numAI: nAI, playerGrid: 12, playerModel: C.MODELS[0], assist: 2, seed: 9, difficulty: 1, damage: 2, laps: 3, phys });
  r.start();
  let nan = false; const t0 = process.hrtime.bigint(); let tStep = 0n;
  for (let k = 1; k <= secs / DT; k++) {
    Math.random = seeded(100 + k);
    const a = process.hrtime.bigint(); C.aiControl(r.player, r, DT); r.step(DT); tStep += process.hrtime.bigint() - a;
    if (k % 120 === 0) for (const c of r.cars) if (!Number.isFinite(c.x + c.z)) nan = true;
  }
  const ms = Number(tStep) / 1e6;
  console.log(`${tid} ${r.cars.length} cars ${phys}: ${(ms / secs).toFixed(1)} ms per race second (${(ms / (secs / DT)).toFixed(3)} ms/step) nan=${nan}`);
}
