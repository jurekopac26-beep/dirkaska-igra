// Gneča (docs/gneca-meritve.md): a light check of what the rivals cost a physics step (Race.step, 1/120 s) in a field the game races
// (8 and 24 cars; LOD only above LOD.min, so every car here at the full rate), on Spa from the grid, the player on the autopilot.
// Times are the machine's, so only ratios are checked, with room: the field of 24 at most 30× the player alone and at most 4.5× the
// field of 8 (linear would be 3×; a search over every pair of cars or a loop over the field inside each car's step shows as 6-9×).
// Measured 28. 11. (node): 1 car 0.034 ms, 8 cars 0.22, 16 cars 0.33, 24 cars 0.30-0.41 (ratios 9-12× and 1.4-1.9×).
// Also: no NaN, every car stepped every step (no LOD below LOD.min), every car on the way.
//   node tests/gneca.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const d = C.TRACKS.find(x => x.id === 'spa'), T = new C.Track(d);

// median ms of a Race.step over 3 s after 1 s (the best of two runs: the machine's own hiccups out)
function measure(cars) {
  let best = Infinity, info = null;
  for (let rep = 0; rep < 2; rep++) {
    const r = new C.Race(T, { numAI: cars - 1, playerGrid: Math.min(cars, 12), playerModel: C.MODELS[0], playerUpg: { motor: 0, gume: 0, zavore: 0, aero: 0 }, assist: 2, seed: 9 + rep,
      difficulty: 1, damage: 2, phys: 'cs', laps: 3, fuel: false, rain: 0, tyres: !!d.pit, compounds: true, flags: true, chars: true, slip: true, faults: true, radio: true, champ: true });
    r.start();
    const P = r.cars.find(c => c.isPlayer), orig = Math.random, ts = [], d0 = r.cars.map(c => c.dist);
    let nan = false, lod = false;
    try {
      for (let k = 1; k <= Math.round(4 / DT); k++) {
        Math.random = seeded(1000 + k); C.aiControl(P, r, DT);
        const t0 = process.hrtime.bigint(); r.step(DT); const t1 = process.hrtime.bigint();
        if (k > Math.round(1 / DT)) ts.push(Number(t1 - t0) / 1e6);
        if (r._lod && r._lod.on) lod = true;
        for (const c of r.cars) if (!Number.isFinite(c.x + c.z + c.vx + c.vz)) nan = true;
      }
    } finally { Math.random = orig; }
    ts.sort((a, b) => a - b);
    const med = ts[ts.length >> 1];
    if (med < best) best = med;
    info = { n: r.cars.length, nan, lod, moved: r.cars.filter((c, i) => c.dist - d0[i] > 20).length, state: r.state };
  }
  return Object.assign(info, { ms: best });
}

const one = measure(1), eight = measure(8), field = measure(24);
const line = `1 car ${one.ms.toFixed(3)} ms, 8 cars ${eight.ms.toFixed(3)}, 24 cars ${field.ms.toFixed(3)} (median of a step, node)`;
console.log(line);
check('24 cars racing from the grid: no NaN, all on the way, every car at the full rate (no LOD below LOD.min)',
  field.n === 24 && !field.nan && !field.lod && field.moved === 24 && field.state === 'racing', JSON.stringify(field));
check('the field of 24 at most 30× the player alone a step', field.ms <= 30 * one.ms, (field.ms / one.ms).toFixed(1) + '×');
check('the field of 24 at most 4.5× the field of 8 a step (the rivals\' cost linear in the field)', field.ms <= 4.5 * eight.ms, (field.ms / eight.ms).toFixed(2) + '×');

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
