// Palomar Mountain: an open road with four ways to drive it on one card, as Vršič and Mulholland Highway (def.modes: the race, the time trial,
// the duel in the traffic and the run from the police). The road: the South Grade Road (S6) in the real scale, from 0.7 km above State Route 76
// (~859 m) up its ladder of hairpins to ~1435 m (no more than 8 km), grades of at most ~11 %; the thirteen hairpins in order up the road, each
// turning the way the real one does (the signs' altitudes the road's own), the places for the HUD and the commentator in order; the side roads
// (OpenStreetMap: streets, driveways and tracks) on the side and at the place where they meet the road, the turnout where the barrier opens.
// The open road's traffic is its own mix (def.traffic): many motorbikes and cyclists, no buses, no trucks. A whole race to the top (12 AI + the
// player on autopilot), dry and in the rain: every car finishes and pulls up in its own slot past the line; a whole duel in the traffic on autopilot;
// the run from the police (the chase from the start, the escape over the finish). The medal times: the stock rally car on the autopilot. Only
// geographic names.
//   node tests/palomar.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore(), Lang = require(path.join(ROOT, 'js', 'lang.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'palomar'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const orig = Math.random;

// 1. the track: an open road, four ways to drive it, its checkpoints and climb, the real scale (8 km at most); not in the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 10 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from ~859 m up to ~1435 m, ~8.0 km in the real scale (no more than 8 km)', Math.abs(def.alt[0] - 859) < 10 && Math.abs(def.alt[1] - 1435) < 10 && T.raceLen > 7900 && T.raceLen <= 8000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(T.altAt(T.hStart) - def.alt[0]) < 1 && Math.abs(def.realKm * 1000 - T.raceLen) < 30,
  `${Math.round(T.raceLen)} m (realKm ${def.realKm}), ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('palomar'));

// 2. the climb: the grades (at most ~11 %, never down: the road climbs all the way), ~576 m in all
{
  let gmax = 0, gmin = 1; for (let i = T.startIdx; i <= T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  const mid = T.altAt(T.hy[T.idx(T.startS + 4000)]);
  check('grades: nowhere steeper than ~11.5 %, never downhill, a climb of ~576 m (at 4 km ~1140-1160 m)', gmax < 0.115 && gmin > -0.005 && Math.abs(T.hFinish - T.hStart - 576) < 10 && mid > 1130 && mid < 1170,
    `steepest ${(gmax * 100).toFixed(1)} %, least ${(gmin * 100).toFixed(1)} %, climb ${(T.hFinish - T.hStart).toFixed(0)} m, at 4 km ${mid.toFixed(0)} m`);
}

// 3. the thirteen hairpins in order up the road: each a turn of ~145-240 deg the way the real one turns (right / left as on the sign data), its
// sign's altitude the road's own; no hairpin tighter than ~22 m (the real ones: ~23-27 m); the real sequence of turns L R L L R L R L R L R L R
{
  const H = def.hairpins, seq = H.map(h => (h[2] > 0 ? 'R' : 'L')).join('');
  const turns = H.map(([d, , dir]) => { let a = 0; for (let x = d - 70; x <= d + 70; x += T.ds) a += T.k[T.idx(T.startS + x)] * T.ds; return a * 180 / Math.PI; });
  const ok = H.length === 13 && H.every((h, k) => !k || h[0] > H[k - 1][0]) && H.every((h, k) => Math.sign(turns[k]) === h[2] && Math.abs(turns[k]) > 140) && H.every(h => Math.abs(T.altAt(T.hy[T.idx(T.startS + h[0])]) - h[1]) < 2);
  check('hairpins: thirteen in order up the road, each turning the real way by 140 deg and more, the signs\' altitudes the road\'s', ok && seq === 'LRLLRLRLRLRLR',
    H.map((h, k) => `${k + 1}:${h[2] > 0 ? 'R' : 'L'}${Math.round(turns[k])}@${Math.round(h[0])}`).join(' '));
  let rmin = 1e9; for (let i = T.startIdx; i < T.finishIdx; i++) if (Math.abs(T.k[i]) > 1e-4) rmin = Math.min(rmin, 1 / Math.abs(T.k[i]));
  const tight = T.corners.filter(c => c.sev >= 2 && c.i0 * T.ds > T.startS && c.i1 * T.ds < T.finishS).length;
  check('bends: the tightest of a ~22-30 m radius (the real line, smoothed only a little), thirty tight bends and more', rmin > 21 && rmin < 30 && tight >= 30, `the tightest ${rmin.toFixed(1)} m, ${tight} tight bends`);
}

// 4. the places: in order up the road, Pauma Valley at the start, every hairpin with its altitude, the turnout, Palomar Mountain at the finish;
// only geographic names; in English Hairpin N and Turnout
{
  const N = T.names, ok = N.every((q, k) => !k || q.d > N[k - 1].d);
  check('places: in order up the road (Pauma Valley ... Hairpin 1-13, the turnout ... Palomar Mountain at the finish)', ok && N.length === 16 && N[0].n === 'Pauma Valley' && /^Palomar Mountain · 1\.4\d\d m$/.test(N[N.length - 1].n) && N[N.length - 1].d > T.raceLen - 30 && N.filter(q => /^Serpentina \d+ · /.test(q.n)).length === 13,
    N.map(q => `${q.n}@${Math.round(q.d)}`).join(', '));
  Lang.set('en'); const en = N.map(q => Lang.place(q.n)); Lang.set('sl');
  check('places: in English Hairpin N · altitude and Turnout · altitude', en.includes('Hairpin 1 · 882 m') && en.some(s => /^Turnout · 1,1\d\d m$/.test(s)), en.slice(1, 3).concat(en.filter(s => /Turnout/.test(s))).join(', '));
  const all = JSON.stringify([def.name, def.en.name, def.escTo, def.en.escTo, N.map(q => [q.n, q.say]), def.comm, def.police, def.sideRoads.map(r => r[9])]);
  check('names: the track is Palomar Mountain, ZDA (USA in English); no observatory\'s, shop\'s, agency\'s or brand\'s name anywhere in the names and lines', def.name === 'Palomar Mountain, ZDA' && def.en.name === 'Palomar Mountain, USA' && !/hale|caltech|mother'?s kitchen|store|harley|ducati|honda|yamaha|sheriff|chp|cleveland/i.test(all), def.name);
}

// 5. the side roads (OpenStreetMap): seven, at their real junctions, the barrier open in each mouth; the turnout: the barrier moved out on the left
{
  const S = T.stubs || [], gaps = S.every(st => { const G = T.gap[st.side > 0 ? 1 : 0]; let k = 0; for (let i = st.i0 - 60; i <= st.i0 + 60; i++) if (G[Math.max(0, Math.min(T.N - 1, i))]) k++; return k >= 2; });
  check('side roads: seven (a street, driveways, tracks) where they meet the road, each with its mouth open in the barrier', S.length === 7 && gaps && S.every((st, k) => Math.abs(st.s0 - T.startS - def.sideRoads[k][0]) < 6),
    S.map(st => `${Math.round(st.s0 - T.startS)}${st.side > 0 ? 'R' : 'L'}/${st.kind}`).join(' '));
  const [d, x, z, sd] = def.turnout, i = T.idx(T.startS + d), q = T.query(x, z, i, {});
  check('turnout: beside the road on the left at ~3.87 km (OpenStreetMap), the barrier moved out along it so a car can pull in', sd === -1 && q.d < -12 && T.bl[i] > -q.d + 2,
    `at ${Math.round(q.s - T.startS)} m, ${q.d.toFixed(1)} m across, the barrier at ${T.bl[i].toFixed(1)} m`);
}

// 6. the traffic of the open road: many motorbikes and cyclists, no buses, no trucks, both ways on their own half of the road
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0), trucks = tf.veh.filter(v => v.p === 5), buses = tf.veh.filter(v => v.kind === 2), cyc = tf.veh.filter(v => v.kind === 4);
  const sides = tf.veh.filter(v => v.kind !== 4).every(v => v.d * v.dir > 0.3 && Math.abs(v.d) < T.w);
  check('traffic: cars and many motorbikes both ways on their own half of the road (a third of the vehicles or so), cyclists, no buses, no trucks',
    bikes.length >= 6 && bikes.length > tf.veh.length * 0.15 && cars.length > bikes.length && !trucks.length && !buses.length && cyc.length >= 6 && bikes.some(v => v.dir > 0) && bikes.some(v => v.dir < 0) && sides,
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${buses.length} buses, ${bikes.length} motorbikes, ${cyc.length} cyclists`);
}

// 7. the ways to drive it (and an online race: always the race)
{
  Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line; online always the race',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5 && !net.timeTrial && net.cars.length === 2,
    'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  Math.random = orig;
}

var DRY = 0, WET = 0;
// 8. a whole race up to the top on autopilot, dry and in the rain: every car finishes, then pulls up in its own slot past the line and stays there
for (const wet of [false, true]) {
  Math.random = seeded(3);
  const r = new C.Race(T, opts(wet ? { rain: 1 } : {})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos), lbl = wet ? 'race in the rain' : 'race';
  check(`${lbl}: all 13 cars reach the top${wet ? ' (the rain on: slower than in the dry)' : ''}`, fin.length === 13 && (!wet || r.rain === 1), `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check(`${lbl}: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)`, slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
  if (wet) WET = fin[0] ? fin[0].finishTime : 0; else DRY = fin[0] ? fin[0].finishTime : 0;
}
check('rain: the winner slower in the rain than in the dry', WET > DRY, `dry ${DRY && DRY.toFixed(1)} s, wet ${WET && WET.toFixed(1)} s`);

// 9. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody knocked down, the traffic keeps moving
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0; const stand = new Map();
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the top through the traffic, no one knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

// 10. the run from the police: no checkpoint, no building (the chase from the start, the escape over the finish); the patrol cars read POLICE;
// whole runs on autopilot at the easy level end in an escape or an arrest, the autopilot gets away at least once in three
{
  const popts = (o) => Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 0, damage: 2, police: true }, o);
  const runs = [11, 12, 13].map(seed => {
    Math.random = seeded(3);
    const r = new C.Race(T, popts({ seed })), P = r.player, pol = r.pol, pc = pol.cars[0];
    const st = { stage: pol.stage, chk: pol.chk, goal: pol.goal, chase: pc && pc.pol.mode === 'chase' };
    r.start();
    let t = 0, k = 0, nan = false;
    while (t < 900 && !P.finished) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
      if (!Number.isFinite(P.x + P.z)) nan = true;
    }
    Math.random = orig;
    return { seed, st, nan, t, escaped: pol.escaped && !pol.busted && P.finished, busted: pol.busted, at: P.q.s - T.startS };
  });
  check('police: the chase from the start, the escape over the finish at the top; on autopilot at the easy level it gets away at least once in three; the patrol cars read POLICE',
    def.police.label === 'POLICE' && runs.every(r => r.st.stage === 'chase' && !r.st.chk && !r.st.goal && r.st.chase && !r.nan && (r.escaped || r.busted)) && runs.some(r => r.escaped),
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m`).join('; '));
}

// 11. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const run = (wet) => { Math.random = seeded(3);
    const r = new C.Race(T, opts(Object.assign({ tt: true, numAI: 0, playerGrid: 1 }, wet ? { rain: 1 } : {}))), P = r.player; r.start();
    let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig; return P.finished ? P.finishTime : 0; };
  const dry = run(false), wet = run(true);
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01 (dry and wet)', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && Math.abs(dry * 1.01 - M.cs[0]) < 1.5 && Math.abs(wet * 1.01 - M.wet.cs[0]) < 2.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${dry.toFixed(1)} s / ${wet.toFixed(1)} s in the rain`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
