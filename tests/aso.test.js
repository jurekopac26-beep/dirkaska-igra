// Aso: the road along the rim of the Aso caldera (Kumamoto, Japan), an open road with four ways to drive it on one card, as Vršič (def.modes:
// the race, the time trial, the duel in the traffic and the run from the police). The road: the real line from the western rim over the
// signals of the junction, round the north-western corner and along the northern rim, over Route 212, to the turn for Daikanbo and its car
// park (~7.96 km on the real road, no more than 8 km), from ~942 m down to ~855 m and up again to ~902 m, gently rolling; its bends in the
// real order and the real way round (right at the signals; at the turn for Daikanbo right, left, right, right), the long rim between nearly
// straight. The side roads where they meet it (all on the left but one ramp of the junction with Route 212), the bridge over Route 212. Japan
// drives on the left (def.leftHand): the traffic both ways on the left half, cars, many motorbikes, tour buses, trucks and cyclists. A whole
// race (12 AI + the player on autopilot) in the dry and in the rain: every car finishes and pulls up in its own slot past the line; a whole
// duel in the traffic; the run from the police. The medal times: the stock rally car on the autopilot. Only geographic names.
//   node tests/aso.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore(), Lang = require(path.join(ROOT, 'js', 'lang.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'aso'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const orig = Math.random;

// 1. the track: an open road, four ways to drive it, driven on the left, its checkpoints, the real scale (8 km at most); not in the big championship
check('track: an open road with four ways to drive it (race, time trial, traffic, police), 4 checkpoints, two lanes 11 m wide, driven on the left',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5.5 && def.leftHand === true && !def.oneWay,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt.join(' -> ')} m, modes ${(def.modes || []).join(',')}`);
check('track: from the western rim (~942 m) to Daikanbo (~902 m), 7.96 km on the real road, in the game 7.9-8 km (no more than 8 km)',
  Math.abs(def.alt[0] - 942) < 5 && Math.abs(def.alt[1] - 902) < 5 && T.raceLen > 7900 && T.raceLen <= 8000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && def.realKm === 7.96,
  `${Math.round(T.raceLen)} m (realKm ${def.realKm}), ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('aso'));

// 2. the shape: the bends in the real order and the real way round (right at the signals, ~610 m; at the turn for Daikanbo right, left, right,
// right), none of them between (the rim road sweeps gently); the profile: down to ~855 m by the bridge, up again to Daikanbo, no grade over ~11 %
{
  const bends = T.corners.filter(c => c.sev >= 2 && c.i0 * T.ds > T.startS && c.i1 * T.ds < T.finishS).map(c => ({ d: (c.i0 + c.i1) / 2 * T.ds - T.startS, dir: c.dir > 0 ? 'R' : 'L' }));
  const seq = bends.map(b => b.dir).join('');
  check('bends: right at the signals (~610 m), then nothing sharp along the rim, at the turn for Daikanbo right, left, right, right', seq === 'RRLRR' && Math.abs(bends[0].d - 625) < 40 && bends[1].d > 7500 && bends[1].d < 7650,
    bends.map(b => `${b.dir}@${b.d.toFixed(0)}`).join(' '));
  let rmin = 1e9; for (let i = T.startIdx; i < T.finishIdx; i++) if (Math.abs(T.k[i]) > 1e-4) rmin = Math.min(rmin, 1 / Math.abs(T.k[i]));
  let gmax = 0, gmin = 0, low = 1e9; for (let i = T.startIdx; i <= T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); low = Math.min(low, T.altAt(T.hy[i])); }
  check('profile: gently rolling, down to ~850-865 m, up again to Daikanbo; no grade over ~11 %; the tightest bend (the junctions) ~15-25 m', gmax < 0.11 && gmin > -0.11 && low > 845 && low < 870 && rmin > 14 && rmin < 30,
    `steepest ${(gmax * 100).toFixed(1)} % up, ${(gmin * 100).toFixed(1)} % down, lowest ${low.toFixed(0)} m, tightest ${rmin.toFixed(1)} m`);
}

// 3. the side roads (OpenStreetMap): 13, where they meet the road; all on the left (the outer slope) but the ramp down to Route 212 on the
// right; the bridge over Route 212 (its barriers closed in to the parapets)
{
  const S = T.stubs || [], br = def.overpass, i = T.idx(T.startS + br.d);
  check('side roads: 13 where they meet the road, on the left but for the ramp to Route 212 south; the bridge over Route 212 at ~6.39 km, its barriers at the parapets',
    S.length === 13 && S.filter(s => s.side > 0).length === 1 && Math.abs(S.find(s => s.side > 0).s - 6526) < 30 && Math.abs(br.d - 6386) < 20 && T.bl[i] < T.w + 2 && T.br[i] < T.w + 2,
    S.map(s => `${s.side > 0 ? 'R' : 'L'}@${Math.round(s.s)}`).join(' ') + `, bridge @${br.d}`);
}

// 4. the places: in order along the road, the commentator's lines for each, Daikanbo at the finish; only geographic names (no businesses, no
// brands), the Slovene labels in English on the HUD
{
  const N = T.names, ok = N.every((q, k) => !k || q.d > N[k - 1].d) && N.every(q => q.say && q.say.length);
  check('places: in order along the road (Milk Road at the signals, the viewpoint, the northern rim, the five peaks, the bridge over Route 212, Daikanbo at the finish), each with the commentator\'s lines',
    ok && N.length === 6 && N[0].n === 'Mlečna cesta' && N[N.length - 1].n === 'Daikanbo' && N[N.length - 1].d > T.raceLen - 30, N.map(q => `${q.n}@${Math.round(q.d)}`).join(', '));
  const all = JSON.stringify([def.name, def.en.name, def.desc, def.en.desc, def.escTo, def.en.escTo, N.map(q => [q.n, q.say]), def.comm, def.police]);
  check('names: the track is Aso, Japonska (Aso, Japan in English), no shop, rest house, farm or brand anywhere in the names and lines', def.name === 'Aso, Japonska' && def.en.name === 'Aso, Japan' && !/chaya|茶|farm|toyota|honda|yamaha|suzuki|kawasaki|nissan|mazda|subaru|cafe|shop/i.test(all), def.name);
  Lang.set('en');
  const en = N.map(q => Lang.place(q.n));
  check('names: the places in English on the HUD (Milk Road, Viewpoint · 921 m, Northern Caldera Rim, Five Peaks of Aso, Bridge over Route 212, Daikanbo)', en.join('|') === 'Milk Road|Viewpoint · 921 m|Northern Caldera Rim|Five Peaks of Aso|Bridge over Route 212|Daikanbo', en.join(', '));
  Lang.set('sl');
}

// 5. the traffic of the open road, on the LEFT (def.leftHand): both ways, each way on the left half of its direction; cars, many motorbikes,
// tour buses and some trucks, cyclists at the left edge; Vršič's traffic still keeps right
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  const dv = new C.Race(new C.Track(C.TRACKS.find(q => q.id === 'vrsic')), opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 }));
  Math.random = orig;
  const veh = tf.veh.filter(v => v.kind !== 4), bikes = tf.veh.filter(v => v.kind === 3), trucks = tf.veh.filter(v => v.p === 5), buses = tf.veh.filter(v => v.kind === 2 && v.p !== 5), cyc = tf.veh.filter(v => v.kind === 4);
  const left = veh.every(v => v.d * v.dir < -0.3 && Math.abs(v.d) < T.w) && cyc.every(v => v.d * v.dir < 0);
  check('traffic: both ways on the left half of the road (Japan), cars, many motorbikes, tour buses, trucks and cyclists; Vršič still on the right',
    left && veh.some(v => v.dir > 0) && veh.some(v => v.dir < 0) && bikes.length > veh.length * 0.15 && trucks.length >= 1 && buses.length >= 1 && cyc.length >= 2 && dv.tf.veh.filter(v => v.kind !== 4).every(v => v.d * v.dir > 0),
    `${tf.veh.length} vehicles: ${tf.veh.filter(v => v.kind === 0).length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${buses.length} buses, ${trucks.length} trucks, ${bikes.length} motorbikes, ${cyc.length} cyclists`);
}

// 5. the ways to drive it (and an online race: always the race)
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

// 6. a whole race to Daikanbo on autopilot, in the dry and in the rain: every car finishes, then pulls up in its own slot past the line
for (const rain of [false, true]) {
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ rain })), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check(`race${rain ? ' in the rain' : ''}: all 13 cars reach Daikanbo`, fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check(`race${rain ? ' in the rain' : ''}: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)`, slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 7. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody knocked down, the traffic keeps moving
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0; const stand = new Map();
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach Daikanbo through the traffic, no one knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

// 8. the run from the police: no checkpoint, no building (the chase from the start, the escape over the finish); the patrol cars read POLICE;
// whole runs on autopilot at the easy level end in an escape or an arrest, the autopilot gets away at least once in five (8 km: twice as long
// as Mulholland's run, more strips and roadblocks on the way)
{
  const popts = (o) => Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 0, damage: 2, police: true }, o);
  const runs = [11, 12, 13, 14, 15].map(seed => {
    Math.random = seeded(3);
    const r = new C.Race(T, popts({ seed })), P = r.player, pol = r.pol, pc = pol.cars[0];
    const st = { stage: pol.stage, chk: pol.chk, goal: pol.goal, chase: pc && pc.pol.mode === 'chase' };
    r.start();
    let t = 0, k = 0, nan = false;
    while (t < 600 && !P.finished) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
      if (!Number.isFinite(P.x + P.z)) nan = true;
    }
    Math.random = orig;
    return { seed, st, nan, t, escaped: pol.escaped && !pol.busted && P.finished, busted: pol.busted, at: P.q.s - T.startS };
  });
  check('police: the chase from the start, the escape over the finish at Daikanbo; on autopilot at the easy level it gets away at least once in five; the patrol cars read POLICE',
    def.police.label === 'POLICE' && runs.every(r => r.st.stage === 'chase' && !r.st.chk && !r.st.goal && r.st.chase && !r.nan && (r.escaped || r.busted)) && runs.some(r => r.escaped),
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m`).join('; '));
}

// 9. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
