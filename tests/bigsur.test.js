// Big Sur: an open road with four ways to drive it on one card, as Vršič and Los Caracoles (def.modes: the race, the time trial, the duel in
// the traffic and the run from the police). The road: Highway 1 in the real scale, from ~1 km north of the Rocky Creek Bridge (~71 m above the
// sea) over the Rocky Creek and Bixby Creek bridges (def.bridges, the second ~80 m over its creek) up to Hurricane Point (~171 m), 4.0 km; the
// grades nowhere steeper than 9 %; the pull-outs on the ocean side (def.wide: the barrier moves out over them). The open road's traffic is
// its own mix (def.traffic): cars, camper vans and many motorbikes, hardly a truck. A whole race up to Hurricane Point (12 AI + the player on
// autopilot): every car finishes and pulls up in its own slot past the line; a whole duel in the traffic on autopilot: both reach the top
// and the traffic keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/bigsur.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'bigsur'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);

// 1. the track: an open road, four ways to drive it, its checkpoints and climb, at most 5 km of road; not a round of the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 9.2 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 4.6,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: ~4.0 km from north of Rocky Creek (~71 m) up to Hurricane Point (~171 m), the whole road under 5 km', Math.abs(def.alt[0] - 71) < 5 && Math.abs(def.alt[1] - 171) < 5 && T.raceLen > 3900 && T.raceLen < 4100 && T.len < 5000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1,
  `${Math.round(T.raceLen)} m of ${Math.round(T.len)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('bigsur'));

// 2. the bridges and the climb: Rocky Creek, then Bixby Creek (~220-250 m long), the road high over the creek there; the low point at Rocky
// Creek, the grades at most 9 %, the HUD's places in order
{
  const B = def.bridges || [], alt = (d) => T.altAt(T.hy[T.idx(T.startS + d)]);
  const bx = B[1] || [0, 0], deck = alt((bx[0] + bx[1]) / 2);
  check('bridges: Rocky Creek, then Bixby Creek (200-260 m), its deck 80-95 m above the sea', B.length === 2 && B[0][1] < bx[0] && bx[1] - bx[0] > 200 && bx[1] - bx[0] < 260 && deck > 80 && deck < 95,
    B.map(([a, b]) => `${Math.round(a)}-${Math.round(b)} m`).join(', ') + `, Bixby deck ${deck.toFixed(1)} m`);
  let gmax = 0, lo = 1e9, loD = 0; for (let i = T.startIdx; i <= T.finishIdx; i++) { gmax = Math.max(gmax, Math.abs(T.grade[i])); const a = T.altAt(T.hy[i]); if (a < lo) { lo = a; loD = i * T.ds - T.startS; } }
  check('grades: nowhere steeper than 9 %; the lowest point by the Rocky Creek Bridge, the climb to Hurricane Point the steadiest', gmax < 0.092 && loD > B[0][0] - 150 && loD < B[0][1] + 150 && alt(3000) > alt(2500) && alt(3500) > alt(3000),
    `steepest ${(gmax * 100).toFixed(1)} %, lowest ${lo.toFixed(1)} m at ${Math.round(loD)} m`);
  const nm = T.names.map(q => q.n);
  check('places: the HUD and the commentator know them in order (Rocky Creek, Castle Rock, Old Coast Road, Bixby Creek, Hurricane Point)', /Rocky Creek/.test(nm[0]) && /Castle Rock/.test(nm[1]) && /Old Coast Road/.test(nm[2]) && /Bixby/.test(nm[3]) && /^Hurricane Point/.test(nm[4]) && T.names.every(q => q.say),
    nm.join(' | '));
}

// 3. the pull-outs: on the ocean side (right) the barrier moves out over the gravel apron (def.wide), back in between them
{
  const W = def.wide || [], ins = W.map(([a, b]) => { const i = T.idx(T.startS + (a + b) / 2); return T.br[i] - T.w; });
  check('pull-outs: ten on the right, the barrier there 8 m or more past the road\'s edge', W.length === 10 && W.every(q => q[2] === 1) && ins.every(v => v > 8),
    ins.map(v => v.toFixed(1)).join(' '));
}

// 4. the open road's traffic: cars, camper vans and motorbikes on their own halves of the road, hardly a truck
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2, seed: 3 })), tf = d.tf;
  Math.random = orig;
  const cars = tf.veh.filter(v => v.kind === 0), vans = tf.veh.filter(v => v.kind === 1), motos = tf.veh.filter(v => v.kind === 3), trucks = tf.veh.filter(v => v.p === 5);
  const sides = tf.veh.filter(v => v.kind < 4).every(v => v.d * v.dir > 0.3 && Math.abs(v.d) < T.w);
  check('traffic: both ways, cars ahead of the camper vans and the motorbikes, few trucks, each on its own half of the road',
    cars.length > vans.length && vans.length > 0 && motos.length > 0 && trucks.length <= 3 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && sides,
    `${tf.veh.length} vehicles: ${cars.length} cars, ${vans.length} vans, ${motos.length} motorbikes, ${trucks.length} trucks, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
}

// 5. the ways to drive it (and an online race: always the race)
{
  const orig = Math.random; Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line; online always the race',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5 && !net.timeTrial && net.cars.length === 2,
    'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  Math.random = orig;
}

// 6. a whole race up to Hurricane Point on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach Hurricane Point', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach Hurricane Point, nobody on foot knocked down, the traffic keeps moving
{
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0; const stand = new Map();
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); }
  }
  Math.random = orig;
  const ev = r.tf, hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach Hurricane Point through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${ev.veh.length} vehicles`);
}

// 8. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

// 9. the run from the police (no checkpoint, no building: as Los Caracoles): the chase from the start, the escape over the finish at Hurricane
//    Point; whole runs on autopilot at the easy level end in an escape or an arrest, never in a stuck car
{
  const runs = [11, 12, 13].map(seed => {
    const orig = Math.random; Math.random = seeded(3);
    const r = new C.Race(T, opts({ seed, difficulty: 0, numAI: 0, playerGrid: 1, police: true, damage: 2 })), P = r.player, pol = r.pol;
    r.start(); let t = 0, k = 0;
    while (t < 600 && !P.finished && !(pol && pol.busted)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig;
    return { seed, pol: !!pol, escaped: !!(pol && pol.escaped && P.finished), busted: !!(pol && pol.busted), t, at: P.q.s - T.startS };
  });
  check('police: the chase from the start, every run on autopilot ends in an escape over Hurricane Point or an arrest', runs.every(r => r.pol && (r.escaped || r.busted)),
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m`).join('; '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
