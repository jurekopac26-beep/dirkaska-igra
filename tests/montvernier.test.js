// Lacets de Montvernier: an open road with two ways to drive it on one card (def.modes: the race and the time trial), 18 numbered hairpins
// stacked on the cliff. The real road is ~4.5 m wide with its legs ~11 m apart; the game's road is 12 m wide, so the ladder is pulled apart:
// every two points of the road more than 60 m apart along it at least 24 m apart, the hairpins opened to a radius of ~12 m (the centre line);
// on the ladder the barriers stand 2.4 m past the road's edge on both sides (the stone parapets of the real road stand at its edge). The two
// modes (opts.tt: the player alone on the line; without it 13 cars on the grid behind it), a whole race to Montvernier (every car finishes and
// pulls up in its own slot past the line) and the time trial on autopilot (within the medal times, the rain slower).
//   node tests/montvernier.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'montvernier'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const hp = def.hairpins || [], s0 = T.startS + hp[0][0] - 30, s1 = T.startS + hp[hp.length - 1][0] + 30;

// 1. the track: an open road, both ways to drive it, 18 lacets turning left and right in turn up the ladder; not a round of the big championship
check('track: an open road with two ways to drive it (def.modes: race, time trial), 4 checkpoints, from 501 m to 787 m', def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt' && T.cpS.length === 4 && def.alt.join('-') === '501-787',
  `race ${Math.round(T.raceLen)} m (the real one ${def.realKm} km), ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m`);
check('track: the road 12 m wide (the real one ~4.5 m)', T.w === 6 && T.surface(T.query(T.px[T.idx(T.startS + 900)], T.pz[T.idx(T.startS + 900)], -1, {})) === 0, `half width ${T.w} m`);
check('track: 18 numbered lacets, in order along the road, left and right in turn, each one a hairpin (the road turns 140-230 degrees)',
  hp.length === 18 && hp.every((h, k) => !k || (h[0] > hp[k - 1][0] && h[2] === -hp[k - 1][2])) && hp.every(([d], k) => {
    const a = T.idx(T.startS + d - 30), b = T.idx(T.startS + d + 30); let turn = 0; for (let i = a; i < b; i++) turn += T.k[i] * T.ds; return Math.abs(turn) > (k ? 2.6 : 2.0) && Math.abs(turn) < 4.2; }),
  hp.map(h => Math.round(h[0]) + (h[2] > 0 ? 'R' : 'L')).join(' '));
check('track: the lacets climb from 526 m to 725 m, the altitudes on their boards rising', hp[0][1] === 526 && hp[17][1] === 725 && hp.every((h, k) => !k || h[1] > hp[k - 1][1]), hp.map(h => h[1]).join(' '));
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('montvernier'));

// 2. the ladder made for the wider road: the legs at least 24 m apart, the hairpins opened, the barriers by the road, the grade the real one's
{
  let minD = 1e9, at = 0;
  for (let i = 0; i < T.N; i += 2) for (let j = i + 32; j < T.N; j += 2) { const d = Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]); if (d < minD) { minD = d; at = i; } }
  check('ladder: every two points of the road more than 60 m apart along it lie at least 24 m apart (the legs pulled apart for the 12 m road)', minD > 23.8, `closest ${minD.toFixed(1)} m (at ${Math.round(at * T.ds - T.startS)} m)`);
  let minR = 1e9; for (let i = T.idx(T.startS); i < T.idx(T.finishS); i++) minR = Math.min(minR, 1 / Math.max(1e-6, Math.abs(T.k[i])));
  check('ladder: the hairpins opened to a radius of ~12 m (the real ones ~4.5 m)', minR > 11, `tightest ${minR.toFixed(1)} m`);
  let on = 0, all = 0, mx = 0; for (let s = s0; s < s1; s += T.ds) { const i = T.idx(s); for (const b of [T.bl[i], T.br[i]]) { all++; if (Math.abs(b - T.w - 2.4) < 0.05) on++; mx = Math.max(mx, b - T.w); } }
  check('ladder: the barriers (the parapets) 2.4 m past the road\'s edge on both sides, from below the first lacet to past the last', on / all > 0.98 && mx < 2.5, `${(100 * on / all).toFixed(1)} % of the samples, at most ${mx.toFixed(2)} m`);
  let g = 0; for (let i = T.idx(T.startS); i < T.idx(T.finishS); i++) g = Math.max(g, T.grade[i]);
  const avg = (T.hy[T.idx(s1)] - T.hy[T.idx(s0)]) / (s1 - s0);
  check('ladder: the grade the real road\'s (7-10 %, at most 11 %)', g < 0.11 && avg > 0.07 && avg < 0.1, `average on the ladder ${(avg * 100).toFixed(1)} %, steepest ${(g * 100).toFixed(1)} %`);
}

// 3. the two ways to drive it (and an online race: always the race)
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  check('mode: opts.tt is the time trial, the player alone on the start line', tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5, `${tt.cars.length} car, ${tt.player.dist.toFixed(1)} m from the line`);
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  let minGap = 1e9; for (const a of race.cars) for (const b of race.cars) if (a !== b) minGap = Math.min(minGap, Math.hypot(a.x - b.x, a.z - b.z));
  check('mode: without it the race, 13 cars on the grid behind the line in Pontamafrey, all on the asphalt, none on another', !race.timeTrial && race.cars.length === 13 && backs[0] >= 8.9 && backs[12] < T.startS - 5 && minGap > 4 && race.cars.every(c => Math.abs(T.query(c.x, c.z, -1, {}).d) < T.w - 0.9),
    'grid ' + backs.map(b => b.toFixed(0)).join(' ') + `, closest two ${minGap.toFixed(1)} m apart`);
  check('mode: an online race (opts.remote) is always the race', !net.timeTrial && net.cars.length === 2);
  Math.random = orig;
}

// 4. a whole race up the lacets on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0, walls = 0;
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) { if (c.isPlayer && (c.stuckT > 3 || c.wrongT > 3)) { r.rescue(c); resc++; } if (!c.finished && c.hitWall > 3) walls++; c.hitWall = 0; }
  }
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  check('race: all 13 cars reach Montvernier, hardly a touch of the parapets', fin.length === 13 && walls < 10, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), wall contacts ${walls}, player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line in the village every car stops in its own slot (70 m on, 9 m apart, both sides in turn)', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 5. the time trial on autopilot (the stock rally car): within the medal times (the autopilot's time x 1.01 is gold); in the rain slower, its own medals
{
  const run = (rain) => { const orig = Math.random; Math.random = seeded(3); const r = new C.Race(T, opts({ tt: true, rain })); r.start(); let t = 0, k = 0;
    while (t < 400 && !r.player.finished) { Math.random = seeded(5000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT); t += DT; } Math.random = orig; return r.player.finishTime || Infinity; };
  const dry = run(0), wet = run(1), M = def.medals.cs, W = def.medals.wet.cs;
  check('time trial: the autopilot reaches Montvernier just inside the gold time, the medals 1 / 6 / 14 % slower', dry < M[0] && dry > M[0] / 1.03 && M[0] < M[1] && M[1] < M[2], `${dry.toFixed(2)} s, medals ${M.join(' / ')} s`);
  check('time trial: slower in the rain, with medals of its own', wet > dry * 1.02 && wet < W[0] && wet > W[0] / 1.03, `${wet.toFixed(2)} s, medals ${W.join(' / ')} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
