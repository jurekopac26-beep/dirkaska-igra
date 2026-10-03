// Mount Lemmon: an open road with four ways to drive it on one card, as Vršič and Los Caracoles (def.modes: the race, the time trial,
// the duel in the traffic and the run from the police). The road: the real line of the Catalina Highway from above Bear Canyon past Windy Point,
// Geology Vista and Hoodoo Vista to San Pedro Vista (~8 km, no more than 8 km), the climb from ~1868 m to ~2242 m with grades of at most ~8.5 %,
// its bends in the real order, each turning the real way (as measured on the OpenStreetMap line), the places for the HUD and the commentator
// in order up the road, the mileposts. The car parks of the vistas open the barrier (def.wide) on their side; the side roads (Rose Canyon
// Road, Willow Canyon, the forest road) are drivable. The open road's traffic is its own mix (def.traffic): many cyclists, motorbikes,
// hardly a truck. A whole race to the top (12 AI + the player on autopilot), dry and in the rain: every car finishes and pulls up in its own
// slot past the line; a whole duel in the traffic on autopilot; the run from the police (no checkpoint, no building: the chase from the start,
// the escape over the finish). The medal times of the time trial: the stock rally car on the autopilot. Only geographic names.
//   node tests/lemmon.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore(), Lang = require(path.join(ROOT, 'js', 'lang.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'lemmon'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const orig = Math.random;

// 1. the track: an open road, four ways to drive it, its checkpoints and climb, the real scale (8 km at most); not in the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 12 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 6,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from above Bear Canyon (~1868 m) up to San Pedro Vista (~2242 m), ~8 km in the real scale (no more than 8 km)', Math.abs(def.alt[0] - 1868) < 10 && Math.abs(def.alt[1] - 2242) < 10 && T.raceLen > 7800 && T.raceLen <= 8000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm * 1000 - T.raceLen) < 60,
  `${Math.round(T.raceLen)} m (realKm ${def.realKm}), ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: named Mount Lemmon, ZDA (Mount Lemmon, USA in English); not in the big championship (an open road is no circuit)', def.name === 'Mount Lemmon, ZDA' && def.en.name === 'Mount Lemmon, USA' && !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('lemmon'));

// 2. the shape and the climb: the bends in the real order up the road, each turning the real way (left / right as on the OpenStreetMap line:
// the sharp left above Bear Canyon, the long right round Windy Point, the right and lefts by Hoodoo Vista, the two rights below the Rose
// Canyon turn ...), none tighter than ~35 m (the highway's sweeping curves); the grades (at most ~8.5 %, a climb of ~370 m)
{
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const turn = (a, b) => { let t = 0; for (let s = a; s < b; s += 2) { const i = T.idx(T.startS + s), j = T.idx(T.startS + s + 2); t += wrap(T.hd[j] - T.hd[i]); } return t * 180 / Math.PI; };   // (+: right)
  const BENDS = [[400, 540, -1, 40, 'left above Bear Canyon'], [1060, 1230, -1, 60, 'left'], [1820, 1920, -1, 35, 'left'], [2320, 2570, 1, 110, 'right round Windy Point'], [2580, 2650, -1, 15, 'left past Windy Point'],
    [4120, 4170, -1, 15, 'left at Hoodoo Vista'], [4220, 4320, 1, 40, 'right past Hoodoo Vista'], [4770, 4870, -1, 30, 'left below Lizard Rock'], [5990, 6100, -1, 40, 'left'], [6210, 6310, -1, 35, 'left'],
    [6550, 6710, 1, 60, 'right'], [6940, 7080, 1, 60, 'right below the Rose Canyon turn'], [7150, 7240, -1, 30, 'left'], [7560, 7670, -1, 40, 'left before San Pedro Vista']];
  const res = BENDS.map(([a, b, dir, deg, name]) => ({ name, a, t: turn(a, b), ok: Math.sign(turn(a, b)) === dir && Math.abs(turn(a, b)) >= deg }));
  check('bends: in the real order up the road, each turning the real way (as on the OpenStreetMap line)', res.every(r => r.ok), res.map(r => `${r.a} m ${r.t > 0 ? 'R' : 'L'}${Math.abs(r.t).toFixed(0)}°${r.ok ? '' : ' (' + r.name + '!)'}`).join(', '));
  let rmin = 1e9; for (let i = T.startIdx; i < T.finishIdx; i++) if (Math.abs(T.k[i]) > 1e-4) rmin = Math.min(rmin, 1 / Math.abs(T.k[i]));
  check('bends: the sweeping curves of a modern mountain highway, none tighter than ~35 m', rmin > 35, `the tightest ${rmin.toFixed(1)} m`);
  let gmax = 0, gmin = 0; for (let i = T.startIdx; i <= T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  const wp = T.altAt(T.hy[T.idx(T.startS + 2357)]);
  check('grades: nowhere steeper than ~8.5 %, a climb of ~370 m (Windy Point Vista at ~2000 m)', gmax < 0.09 && gmin > -0.09 && T.hFinish - T.hStart > 350 && wp > 1985 && wp < 2025,
    `steepest ${(gmax * 100).toFixed(1)} % up, ${(gmin * 100).toFixed(1)} % down, climb ${(T.hFinish - T.hStart).toFixed(0)} m, Windy Point ${wp.toFixed(0)} m`);
}

// 3. the places: in order up the road, the commentator's lines for each, San Pedro Vista at the finish; only geographic names (no businesses,
// no events, no brands); the mileposts in order, a mile apart (Windy Point Vista at milepost 14)
{
  const N = T.names, ok = N.every((q, k) => !k || q.d > N[k - 1].d) && N.every(q => q.say && q.say.length);
  check('places: in order up the road (Bear Canyon, Windy Point Vista, Geology Vista, Hoodoo Vista, Lizard Rock, Rose Canyon, San Pedro Vista at the finish), each with the commentator\'s lines',
    ok && N.length === 7 && N[0].n === 'Bear Canyon' && N[1].n === 'Windy Point Vista' && N[3].n === 'Hoodoo Vista' && /^San Pedro Vista · 2\.2\d\d m$/.test(N[N.length - 1].n) && N[N.length - 1].d > T.raceLen - 30,
    N.map(q => `${q.n}@${Math.round(q.d)}`).join(', '));
  const all = JSON.stringify([def.name, def.en, def.desc, def.escTo, N.map(q => [q.n, q.say]), def.comm, def.police, (def.sideRoads || []).map(r => r[9])]);
  check('names: only geographic names, no lodge, shop, restaurant, observatory or brand anywhere in the names and lines', !/lodge|store|restaurant|cafe|café|inn\b|observatory|ski valley|realty|coffee|harley|ducati|honda|yamaha|ford|chevrolet/i.test(all));
  const MP = def.mileposts || [], wpMP = MP.find(m => m[1] === 14);
  check('mileposts: 13 to 17 in order, a mile (1609 m) apart, milepost 14 at Windy Point Vista', MP.length === 5 && MP.every((m, k) => !k || (m[1] === MP[k - 1][1] + 1 && Math.abs(m[0] - MP[k - 1][0] - 1609) < 2)) && wpMP && Math.abs(wpMP[0] - 2357) < 60,
    MP.map(m => `MP${m[1]}@${m[0]}`).join(', '));
}

// 4. the car parks and the side roads: the barrier opens along every car park on its own side; the side roads (OpenStreetMap: all on the left
// going up) can be driven into, Rose Canyon Road the longest
{
  const lots = def.lots || [], wide = lots.every(L => { const i = T.idx(T.startS + (L[0] + L[1]) / 2), b = L[2] > 0 ? T.br[i] : T.bl[i]; return b > T.w + 10; });
  check('car parks: Windy Point (both sides), Geology Vista, the trailhead and San Pedro Vista, the barrier opened beside each', lots.length === 6 && wide && lots.filter(L => L[0] > 2350 && L[1] < 2520).length === 2,
    lots.map(L => `${Math.round(L[0])}-${Math.round(L[1])} ${L[2] > 0 ? 'R' : 'L'}`).join(', '));
  const S = T.stubs || [], rose = S.find(s => s.name === 'Rose Canyon');
  check('side roads: three, all on the left going up, Rose Canyon Road ~130 m to its fee booth\'s gate', S.length === 3 && S.every(s => s.side < 0) && rose && rose.L > 100 && Math.abs(rose.s - 7274) < 20,
    S.map(s => `${s.name || '-'}@${Math.round(s.s)} L ${Math.round(s.L)} m`).join(', '));
}

// 5. the traffic of the open road: many cyclists, motorbikes, both ways on their own half of the road
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const cyc = tf.veh.filter(v => v.kind === 4), bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0);
  const sides = tf.veh.filter(v => v.kind !== 4).every(v => v.d * v.dir > 0.3 && Math.abs(v.d) < T.w);
  check('traffic: many cyclists (both ways), motorbikes, cars on their own half of the road', cyc.length >= 20 && cyc.some(v => v.dir > 0) && cyc.some(v => v.dir < 0) && bikes.length >= 4 && cars.length > bikes.length && sides,
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${tf.veh.filter(v => v.kind === 2).length} buses, ${bikes.length} motorbikes, ${cyc.length} cyclists`);
}

// 6. the ways to drive it (and an online race: always the race)
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

// 7. a whole race up to San Pedro Vista on autopilot, dry and in the rain: every car finishes, then pulls up in its own slot past the line and stays there
for (const rain of [false, true]) {
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ rain })), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 900 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos), w = rain ? 'in the rain' : 'dry';
  check(`race (${w}): all 13 cars reach San Pedro Vista`, fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check(`race (${w}): past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)`, slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 8. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody knocked down, the traffic keeps moving
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

// 9. the run from the police: no checkpoint, no building (the chase from the start, the escape over the finish); the patrol cars read POLICE;
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
  check('police: the chase from the start, the escape over the finish at San Pedro Vista; on autopilot at the easy level it gets away at least once in three; the patrol cars read POLICE',
    def.police.label === 'POLICE' && runs.every(r => r.st.stage === 'chase' && !r.st.chk && !r.st.goal && r.st.chase && !r.nan && (r.escaped || r.busted)) && runs.some(r => r.escaped),
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m`).join('; '));
}

// 10. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const run = (rain) => { Math.random = seeded(3);
    const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1, rain })), P = r.player; r.start();
    let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig; return P.finished ? P.finishTime : NaN; };
  const dry = run(false), wet = run(true);
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01 (dry and wet)', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && Math.abs(dry * 1.01 - M.cs[0]) < 1.5 && Math.abs(wet * 1.01 - M.wet.cs[0]) < 2.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${dry.toFixed(1)} s dry, ${wet.toFixed(1)} s wet`);
}

// 11. the English page: the description and the escape's line in English; the HUD's places stay as they are (names)
{
  Lang.set('en');
  const ok = /Catalina Highway/.test(def.en.desc) && def.en.escTo === 'To San Pedro Vista' && Lang.place('Windy Point Vista') === 'Windy Point Vista';
  Lang.set('sl');
  check('english: the description, the escape\'s line (To San Pedro Vista), the place names unchanged', ok);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
