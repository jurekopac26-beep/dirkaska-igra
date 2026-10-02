// Mulholland Highway: an open road with four ways to drive it on one card, as Vršič and Los Caracoles (def.modes: the race, the time trial,
// the duel in the traffic and the run from the police). The road: the real line up the bends from Cornell to the top at Brewster Road (~4.2 km,
// no more than 5 km), the climb from ~256 m to ~544 m with grades of at most ~11 %, the tight bends of its best-known stretch (a dozen and more, the
// tightest of a ~17 m radius), the places for the HUD and the commentator in order up the road. The open road's traffic is its own mix
// (def.traffic): many motorbikes, no trucks. A whole race to the top (12 AI + the player on autopilot): every car finishes and pulls up
// in its own slot past the line; a whole duel in the traffic on autopilot; the run from the police (no checkpoint, no building: the chase from
// the start, the escape over the finish). The medal times of the time trial: the stock rally car on the autopilot. Only geographic names.
//   node tests/mulholland.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore(), Lang = require(path.join(ROOT, 'js', 'lang.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'mulholland'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const orig = Math.random;

// 1. the track: an open road, four ways to drive it, its checkpoints and climb, the real scale (5 km at most); not in the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 12 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 6,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from Cornell (~256 m) up to Brewster Road (~544 m), ~4.2 km in the real scale (no more than 5 km)', Math.abs(def.alt[0] - 256) < 10 && Math.abs(def.alt[1] - 544) < 10 && T.raceLen > 4000 && T.raceLen <= 5000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm * 1000 - T.raceLen) < 60,
  `${Math.round(T.raceLen)} m (realKm ${def.realKm}), ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('mulholland'));

// 2. the shape and the climb: the bends (a dozen tight ones and more, none tighter than ~14 m), the grades (at most ~11.5 %, the road climbs
// from the start to the top of the bends, ~290 m in all)
{
  let rmin = 1e9; for (let i = T.startIdx; i < T.finishIdx; i++) if (Math.abs(T.k[i]) > 1e-4) rmin = Math.min(rmin, 1 / Math.abs(T.k[i]));
  const tight = T.corners.filter(c => c.sev >= 2 && c.i0 * T.ds > T.startS && c.i1 * T.ds < T.finishS).length;
  check('bends: a dozen tight bends and more, the tightest of a ~16-20 m radius (the line smoothed, nothing cut)', tight >= 12 && rmin > 14 && rmin < 30, `${tight} tight bends, the tightest ${rmin.toFixed(1)} m`);
  let gmax = 0, gmin = 0; for (let i = T.startIdx; i <= T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  const mid = T.altAt(T.hy[T.idx(T.startS + 2400)]);
  check('grades: nowhere steeper than ~11.5 %, a climb of ~290 m (at 2.4 km ~370-410 m)', gmax < 0.115 && gmin > -0.115 && T.hFinish - T.hStart > 270 && mid > 360 && mid < 410,
    `steepest ${(gmax * 100).toFixed(1)} % up, ${(gmin * 100).toFixed(1)} % down, climb ${(T.hFinish - T.hStart).toFixed(0)} m, at 2.4 km ${mid.toFixed(0)} m`);
}

// 3. the places: in order up the road, the commentator's lines for each, Brewster Road at the finish; only geographic names (no businesses), the
// viewpoint's Slovene label in English on the HUD
{
  const N = T.names, ok = N.every((q, k) => !k || q.d > N[k - 1].d) && N.every(q => q.say && q.say.length);
  check('places: in order up the road (La Sierra Creek, Seminole Drive, Elephant Rock ... Brewster Road at the finish), each with the commentator\'s lines', ok && N.length === 7 && N[0].n === 'La Sierra Creek' && /^Brewster Road/.test(N[N.length - 1].n) && N[N.length - 1].d > T.raceLen - 30,
    N.map(q => `${q.n}@${Math.round(q.d)}`).join(', '));
  const all = JSON.stringify([def.name, def.en.name, def.escTo, def.en.escTo, N.map(q => [q.n, q.say]), def.comm, def.police]);   // (the description may name the riders' nickname for the bends)
  check('names: the track is Mulholland Highway, no nickname as its name, no bar, shop or brand anywhere in the names and lines', def.name === 'Mulholland Highway' && def.en.name === 'Mulholland Highway' && !/snake|rock store|harley|ducati|honda|yamaha/i.test(all),
    def.name);
  check('names: the viewpoint in English on the HUD (Viewpoint · 522 m)', /^Viewpoint · \d{3} m$/.test((Lang.set('en'), Lang.place(N.find(q => /^Razgled/.test(q.n)).n))), (Lang.set('en'), Lang.place(N.find(q => /^Razgled/.test(q.n)).n)));
  Lang.set('sl');
}

// 4. the traffic of the open road: many motorbikes, no trucks, both ways on their own half of the road
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0), trucks = tf.veh.filter(v => v.p === 5);
  const sides = tf.veh.filter(v => v.kind !== 4).every(v => v.d * v.dir > 0.3 && Math.abs(v.d) < T.w);
  check('traffic: cars and many motorbikes both ways on their own half of the road (a third of the vehicles or so), no trucks',
    bikes.length >= 4 && bikes.length > tf.veh.length * 0.15 && cars.length > bikes.length && !trucks.length && bikes.some(v => v.dir > 0) && bikes.some(v => v.dir < 0) && sides,
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${tf.veh.filter(v => v.kind === 2).length} buses, ${bikes.length} motorbikes, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
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

// 6. a whole race up to the top on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 600 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach the top', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
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
  check('duel: both reach the top through the traffic, no one knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

// 8. the run from the police: no checkpoint, no building (the chase from the start, the escape over the finish); the patrol cars read POLICE;
// whole runs on autopilot at the easy level end in an escape or an arrest, the autopilot gets away at least once in three
{
  const popts = (o) => Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 0, damage: 2, police: true }, o);
  const runs = [11, 12, 13].map(seed => {
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
  check('police: the chase from the start, the escape over the finish at the top; on autopilot at the easy level it gets away at least once in three; the patrol cars read POLICE',
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
