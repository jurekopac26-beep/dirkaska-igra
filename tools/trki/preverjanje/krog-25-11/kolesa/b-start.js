// startS in igralčeva razdalja od starta (tools/trki/zrcalne-dirke.js meri c.dist = q.s - T.startS)
const path = require('path');
const ROOT = process.env.TRKI_SNAP || require('path').join(__dirname, '..', '..', '..', '..', '..');
const { loadCore } = require(path.join(ROOT, 'tests/lib/core.js'));
const SIM = require(path.join(ROOT, 'tests/lib/sim.js'));
const C = loadCore(); C.setTest({ cv: 6 });
Math.random = SIM.seeded(81);
const race = SIM.makeRace(C, 'sacalobra', (C2, tt) => Object.assign(SIM.SETUPS.race.opts(C2, tt, 'cs'), { seed: 81 - 68 }));
const P = race.player, T = race.track;
console.log('startS', T.startS, 'len', T.len, 'laps', race.opts.laps, 'P.q.s', P.q.s.toFixed(1), 'P.dist', (P.dist || 0).toFixed(1));
let k = 0; const N = Math.round(110 / SIM.DT); let first = null;
for (; k < N;) { k++; for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; } SIM.stepRace(C, race, k); if (first == null && k * SIM.DT > 30 && P.speed < 0.5) first = k * SIM.DT; }
console.log('po 110 s: q.s', P.q.s.toFixed(1), 'dist', (P.dist || 0).toFixed(1), 'lap', P.lap, 'stoji od', first && first.toFixed(2), 'stuckT', P.stuckT.toFixed(1));
