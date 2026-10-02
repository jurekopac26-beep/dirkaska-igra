// The field of a race (Izberi progo: Tekmovalci; no browser): up to 22 cars on the grid, on every track. Every driver of the roster has a name,
// a car number, a colour and three letters (the timing tower's code) of its own, none twice; the grid leaves room between neighbours (no two cars on
// the same spot, also on the open roads); a race of the full field runs on, every car moving (none lost on the way, no NaN). A track's own full
// field (def.rivals, the Nürburgring's 20) stays as it was without opts.fixedField and gives way to it, which is what the game passes for the
// field the player chose; a small field is only that many cars, the player on the grid's last place.
//   node tests/field.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const code = (name) => String(name).split(/[\s.]+/).filter(Boolean).pop().slice(0, 3).toUpperCase();   // (as the timing tower writes it: M. Kovač -> KOV)
const opts = (o) => Object.assign({ numAI: 21, fixedField: true, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 9, difficulty: 1, damage: 2 }, o);
const circuits = C.TRACKS.filter(d => !d.timeTrial);

// 1. the roster: enough drivers for a field of 22, none twice
{
  const D = Array.from({ length: 24 }, (_, k) => C.aiDriver(k));
  const names = new Set(D.map(d => d.name)), codes = new Set(D.map(d => code(d.name))), colors = new Set(D.map(d => d.color));
  check('roster: 24 drivers, no name, three-letter code or colour twice', names.size === 24 && codes.size === 24 && colors.size === 24, `${names.size} names, ${codes.size} codes, ${colors.size} colours`);
  check('roster: the first twelve (the championship\'s) are the same as ever', C.aiDriver(0).name === 'M. Kovač' && C.aiDriver(11).name === 'G. Moretti' && C.champKeys(12).length === 13);
}

// 2. every track: 22 cars, each with its own name, number, colour and code; room between the neighbours
for (const def of circuits) {
  const T = new C.Track(def), r = new C.Race(T, opts({}));
  const cs = r.cars, ai = cs.filter(c => !c.isPlayer);
  const uniq = (f) => new Set(cs.map(f)).size === cs.length;
  let gap = 1e9; for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) gap = Math.min(gap, Math.hypot(cs[i].x - cs[j].x, cs[i].z - cs[j].z));
  check(`${def.id}: 22 cars (21 rivals and the player, 12th on the grid), nothing twice, the cars apart`,
    cs.length === 22 && !!r.player && r.player.grid === 12 && uniq(c => c.num) && new Set(ai.map(c => c.name)).size === 21 && new Set(ai.map(c => code(c.name))).size === 21 && new Set(ai.map(c => c.color)).size === 21 && gap > 4,
    `${cs.length} cars, nearest two ${gap.toFixed(1)} m`);
}

// 3. a track's own full field: the Nürburgring's 20 rivals as before, the field the player chose when the game says so
{
  const def = C.TRACKS.find(d => d.rivals), T = new C.Track(def);
  const a = new C.Race(T, opts({ numAI: 12, fixedField: false })).cars.length, b = new C.Race(T, opts({ numAI: 12 })).cars.length, c = new C.Race(T, opts({ numAI: 21 })).cars.length;
  check(`${def.id}: its own full field (${def.rivals} rivals) without opts.fixedField, the player's field with it`, !!def && a === def.rivals + 1 && b === 13 && c === 22, `${a} / ${b} / ${c} cars`);
}

// 4. a small field: only that many cars, the player where the grid ends
for (const nAI of [5, 11, 15]) {
  const r = new C.Race(new C.Track(C.TRACKS.find(d => d.id === 'jezero')), opts({ numAI: nAI }));
  check(`field of ${nAI + 1}: ${nAI + 1} cars, the player ${Math.min(nAI + 1, 12)}th on the grid`, r.cars.length === nAI + 1 && r.player.grid === Math.min(nAI + 1, 12), `${r.cars.length} cars, grid ${r.player.grid}`);
}

// 5. the full field races on (autopilot, 45 s): every car finite and moving, none stuck; a tight street circuit, an open road, the long ring
for (const id of ['monaco', 'vrsic', 'nring']) {
  const r = new C.Race(new C.Track(C.TRACKS.find(d => d.id === id)), opts({})); r.start();
  let nan = false;
  for (let k = 0; k < 45 * 120; k++) {
    Math.random = seeded(1000 + k); C.aiControl(r.player, r, DT); r.step(DT);
    if (k % 600 === 0 && r.cars.some(c => !Number.isFinite(c.x) || !Number.isFinite(c.z) || !Number.isFinite(c.speed))) nan = true;
  }
  const moving = r.cars.filter(c => c.speed * 3.6 > 20).length, stuck = r.cars.filter(c => c.stuckT > 3).length;
  check(`${id}: 22 cars race on for 45 s, all finite and moving, none stuck`, !nan && moving === 22 && stuck === 0, `${moving}/22 above 20 km/h, ${stuck} stuck, leader ${Math.max(...r.cars.map(c => c.dist)).toFixed(0)} m`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
