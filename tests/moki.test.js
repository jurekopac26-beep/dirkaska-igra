// Moki Dugway: an open road with two ways to drive it on one card (def.modes: the time trial and the duel in the traffic; the road is too
// narrow for a grid of thirteen, so there is no race against the field). The road: the real line up the five switchbacks cut into the cliff
// of Cedar Mesa (def.curves, from ~1,700 m to ~1,920 m), 4.95 km and ~336 m of climb in its real scale, no steeper than ~10.5 %; gravel
// between the two paved ends (def.paved: the asphalt's surface there, the makadam's on the gravel). The open road's traffic is its own mix
// (def.traffic): cars, pickups and motorbikes, no buses or trucks. A whole duel in the traffic on autopilot: both reach the mesa and the
// traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/moki.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'moki'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 1, playerGrid: 2, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, two ways to drive it, its checkpoints and climb; narrow; not a round of the big championship
check('track: an open road with two ways to drive it (def.modes: time trial, traffic), 4 checkpoints, the road 9 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'tt,traffic' && T.cpS.length === 4 && T.w === 4.5,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from the Valley of the Gods (~1,624 m) up to Cedar Mesa (~1,961 m), at most 5 km, ~336 m of climb', Math.abs(def.alt[0] - 1624) < 10 && Math.abs(def.alt[1] - 1961) < 10 &&
  T.raceLen > 4800 && T.raceLen <= 5000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
{
  let gmax = 0; for (let i = T.startIdx; i < T.finishIdx; i++) gmax = Math.max(gmax, T.grade[i]);
  check('track: nowhere steeper than ~10.5 %, never downhill to the finish', gmax < 0.11 && T.hy.slice(T.startIdx, T.finishIdx).every((h, k, a) => !k || h >= a[k - 1] - 0.05), `steepest ${(gmax * 100).toFixed(1)} %`);
}
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('moki'));

// 2. the five switchbacks: in order up the road, each a real hairpin of the line (over 150 degrees within 60 m), their altitudes the road's own
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 60), b = T.idx(T.startS + d + 60); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  check('switchbacks: five, in order up the road, each a hairpin the way its sign says', cv.length === 5 && cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 100) && turn.every((a, k) => Math.abs(a) > 2.6 && Math.sign(a) === cv[k][2]),
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}`);
  check('switchbacks: from ~1,700 m to ~1,920 m, each sign\'s altitude the road\'s; the HUD knows them (Serpentina 1 .. 5) and the mesa at the finish',
    Math.abs(alt[0] - 1702) < 15 && Math.abs(alt[4] - 1922) < 15 && cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3) && T.names.filter(q => /^Serpentina \d/.test(q.n)).length === 5 && /^Cedar Mesa/.test(T.names[T.names.length - 1].n),
    `${alt.map(a => Math.round(a)).join(', ')} m; ${T.names.length} places`);
  // the legs of the switchbacks: kept apart (the barriers between them never closer than 2 m past the road's edge)
  let mn = 99; for (let i = T.startIdx; i < T.finishIdx; i++) mn = Math.min(mn, T.bl[i], T.br[i]);
  check('switchbacks: the barriers at least 2 m past the road\'s edges everywhere', mn > T.w + 2, `nearest ${mn.toFixed(2)} m from the centre line`);
}

// 3. the surface: asphalt on the paved ends, gravel (makadam) between them
{
  const q = {}, at = (d) => { const i = T.idx(T.startS + d); return T.surface(T.query(T.px[i], T.pz[i], i, q)); };
  const [p0, p1] = def.paved, gr = [p0[1] + 20, (p0[1] + p1[0]) / 2, p1[0] - 20].map(at), as = [20, p0[1] - 20, p1[0] + 20, T.raceLen - 10].map(at);
  check('surface: gravel from the foot of the cliff to the rim (~3.3 km), asphalt on both ends', gr.every(s => s === 5) && as.every(s => s === 0) && p1[0] - p0[1] > 3000,
    `gravel ${Math.round(p0[1])}-${Math.round(p1[0])} m: ${gr.join(',')}, asphalt ${as.join(',')}`);
}

// 4. the open road's traffic: cars, pickups and motorbikes both ways, no buses or trucks
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const motor = tf.veh.filter(v => v.kind !== 4);
  check('traffic: cars, pickups and motorbikes both ways on their own halves of the road, no buses or trucks',
    motor.length >= 20 && !motor.some(v => v.kind === 2 || v.p === 5) && motor.some(v => v.dir > 0) && motor.some(v => v.dir < 0) && motor.every(v => v.d * v.dir > 0.5 && Math.abs(v.d) < T.w),
    `${motor.length} vehicles: ${motor.filter(v => v.kind === 0).length} cars, ${motor.filter(v => v.kind === 1).length} pickups, ${motor.filter(v => v.kind === 3).length} motorbikes, ${tf.veh.length - motor.length} cyclists`);
}

// 5. the ways to drive it: opts.tt the time trial, opts.traffic the duel; no race of thirteen
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), duel = new C.Race(T, opts({ traffic: true }));
  Math.random = orig;
  check('mode: opts.tt is the time trial (the player alone on the line); opts.traffic the duel with one rival', tt.timeTrial && tt.cars.length === 1 && !duel.timeTrial && duel.cars.length === 2 && !!duel.tf);
}

// 6. a whole duel in the traffic on autopilot (both cars): both reach the mesa, nobody on foot knocked down, the traffic keeps moving
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0; const stand = new Map();
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach Cedar Mesa through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

// 7. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
