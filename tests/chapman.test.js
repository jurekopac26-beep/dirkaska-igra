// Chapman's Peak: an open road with four ways to drive it on one card, as Vršič and Los Caracoles (def.modes: the race, the time trial, the
// duel in the traffic and the run from the police), from Hout Bay up the cliffs above the Atlantic to the view point at the highest point of
// the road: at most 5 km, in the real scale. They drive on the left in South Africa (def.leftHand): the traffic keeps to the left half of the
// road both ways (uphill on the left, downhill on the right as the race sees it), goes round things on its right, a bus pulls in to the left;
// the police start the run on the left half too. Vršič's traffic still keeps right. A whole race up to the view point (12 AI + the player on
// autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the traffic on autopilot: both reach the top and
// the traffic keeps moving, on its own (left) half. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/chapman.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'chapman'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const left = (v) => v.d * v.dir < -0.5;   // (a vehicle on its own half when they keep left: + across the road is the right looking uphill)

// 1. the track: an open road, four ways to drive it, driven on the left; at most 5 km, from Hout Bay (~20 m) up to the view point (~150 m)
check('track: an open road with four ways to drive it, 4 checkpoints, the road 16.9 m wide (1.3 x the drawn 13 m), the traffic on the left (def.leftHand)',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === def.halfWidth * 1.3 && def.leftHand === true,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from Hout Bay (~20 m) up to the view point (~150 m), 4.5-5 km, the climb ~130 m', T.raceLen > 4500 && T.raceLen <= 5000 && Math.abs(def.alt[0] - 19) < 10 && Math.abs(def.alt[1] - 153) < 15 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('chapman'));
{
  let gmax = 0, gmin = 0; for (let i = T.idx(T.startS); i < T.idx(T.finishS); i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  const nm = T.names.map(q => q.n), turns = T.corners.filter(c => c.sev >= 2).length;
  check('road: winding (a bend after another), the grades as the real road (up to ~8 %), the places on the HUD from Hout Bay to the view point',
    gmax < 0.09 && gmin > -0.04 && turns >= 10 && nm[0] === 'Hout Bay' && /^Chapman's Peak · \d+ m$/.test(nm[nm.length - 1]) && nm.includes('Cestninska postaja') && T.names.every((q, k) => !k || q.d > T.names[k - 1].d) && T.names[T.names.length - 1].d <= T.raceLen,
    `steepest ${(gmax * 100).toFixed(1)} % up, ${(gmin * 100).toFixed(1)} % down, ${turns} bends, places ${nm.join(' | ')}`);
}

// 2. the traffic keeps left (Chapman's Peak) and right (Vršič): every vehicle on its own half, both ways; no trucks on the cliffs
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  const V = new C.Track(C.TRACKS.find(x => x.id === 'vrsic')), dv = new C.Race(V, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 }));
  Math.random = orig;
  const own = tf.veh.filter(left), bikes = tf.veh.filter(v => v.kind === 4);
  check('traffic: keeps left on Chapman\'s Peak (uphill on the left half, downhill on the right as the race sees it), cyclists at the left edge; no trucks',
    tf.sd === -1 && own.length === tf.veh.length && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && bikes.length > 0 && bikes.every(v => v.d * v.dir < -(T.w - 1)) && !tf.veh.some(v => v.p === 5),
    `${tf.veh.length} vehicles (${tf.veh.filter(v => v.dir > 0).length} up, ${tf.veh.filter(v => v.dir < 0).length} down), on the left ${own.length}, cyclists ${bikes.length}, motorbikes ${tf.veh.filter(v => v.kind === 3).length}`);
  check('traffic: Vršič keeps right as before', dv.tf.sd === 1 && dv.tf.veh.every(v => v.d * v.dir > 0.5), `${dv.tf.veh.length} vehicles`);
  // a vehicle pulling over for the police goes to its own (left) edge and indicates that way; going round a wreck it passes on its right
  const a = tf.veh.find(v => v.dir > 0 && v.kind === 0), e = tf._edge(a), b = tf.veh.find(v => v.dir < 0 && v.kind === 0), eb = tf._edge(b);
  check('traffic: its edge (pulling over) is the left one both ways', e < -T.w + 1.5 && eb > T.w - 1.5, `uphill car ${e.toFixed(2)} m, downhill car ${eb.toFixed(2)} m`);
}

// 3. the ways to drive it; the run from the police starts on the left half
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), pol = new C.Race(T, opts({ numAI: 0, playerGrid: 1, police: true, damage: 2 }));
  tt.start(); race.start(); pol.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5, 'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  check('mode: the run from the police: the player starts on the left half of the road, the traffic and the police on it', !!pol.pol && !!pol.tf && pol.player.q.d < -1,
    `the player at ${pol.player.q.d.toFixed(2)} m across the road`);
  Math.random = orig;
}

// 4. a whole race up to the view point on autopilot: every car finishes, then pulls up in its own slot past the line
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach the view point', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 5. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody on foot knocked down, the traffic keeps moving and keeps left
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0, nL = 0, nAll = 0; const stand = new Map();
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); if (!v.off && v.st === 0 && !v.yl && !v.pass && v.v > 2) { nAll++; if (left(v)) nL++; } }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the view point through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
  check('duel: the moving traffic keeps left all the way (98 % and more of the samples)', nAll > 200 && nL / nAll >= 0.98, `${nL}/${nAll} on the left`);
}

// 6. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
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
