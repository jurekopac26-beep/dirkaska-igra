// Medvode to Smlednik: the real road at its real width (an open road with four ways to drive it on one card, as Mulholland Highway: def.modes,
// the race, the time trial, the duel in the traffic and the run from the police). The road: from the football ground on Medvoška cesta in
// Medvode to the old castle above Smlednik (~6.2 km, ~320 -> ~500 m), its own width along the way (6.4 m on Medvoška cesta, 7.5 m on Gorenjska
// cesta, 3.7 m up the castle road: def.widths), the sidewalks, the bridge over the Sava with its parapets close to the road; every junction
// (the side roads), the four roundabouts (three of them driven round, the oncoming traffic on its own way round them and the split approaches:
// def.altDn), the bus stops and the zebra crossings; the houses, garden walls and fences beside the road are the barrier there (def.walls); the
// places for the HUD and the commentator in order along the road; only geographic names. The traffic: both ways, the oncoming vehicles round the
// rings on their own lines, none up the narrow castle road (def.trafficEnd), pulling onto the shoulder for the police where the road is narrow
// (def.pullOff). A whole race on autopilot (every car finishes and pulls up in its own slot past the line), a whole duel in the traffic, the run
// from the police (the autopilot gets away at least once in three on easy). The medal times of the time trial: the stock rally car on the
// autopilot. The scenery's data (terrain, land cover, canopy, buildings, water, streets) in the track file.
//   node tests/medvode.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore(), Lang = require(path.join(ROOT, 'js', 'lang.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'medvode'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const orig = Math.random;
const at = (d) => T.idx(T.startS + d);

// 1. the track: an open road, four ways to drive it, its checkpoints, the real scale; not in the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from Medvode (~320 m) up to the castle above Smlednik (~500 m), ~6.2 km in the real scale', Math.abs(def.alt[0] - 320) < 10 && Math.abs(def.alt[1] - 500) < 15 && T.raceLen > 6000 && T.raceLen < 6600 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm * 1000 - T.raceLen) < 60,
  `${Math.round(T.raceLen)} m (realKm ${def.realKm}), ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('medvode'));

// 2. the real widths: Medvoška cesta 6.4 m, Gorenjska cesta 7.5 m, the regional road ~6 m, Smlednik 4.8 m, the castle road 3.7 m; the sidewalks
// part of the road; the bridge over the Sava (~312 m) between its parapets, 1.6 m from the asphalt
{
  const w = (d) => 2 * T.wAt(at(d)), wk = T.walk ? T.walk[0].filter(v => v > 0.5).length + T.walk[1].filter(v => v > 0.5).length : 0;
  check('widths: 6.4 m on Medvoška cesta, 7.5 m on Gorenjska cesta, ~6 m to Zbilje and over the bridge, 4.8 m in Smlednik, 3.7 m up the castle road',
    Math.abs(w(100) - 6.4) < 0.15 && Math.abs(w(800) - 7.5) < 0.15 && Math.abs(w(1500) - 6.1) < 0.3 && Math.abs(w(3700) - 6.3) < 0.4 && Math.abs(w(4900) - 4.8) < 0.15 && Math.abs(w(5800) - 3.7) < 0.15,
    [100, 800, 1500, 3700, 4900, 5800].map(d => `${d}: ${w(d).toFixed(2)} m`).join(', '));
  check('sidewalks: along the villages, part of the road (T.walk)', wk * T.ds > 2500, `${(wk * T.ds / 1000).toFixed(1)} km of sidewalk (both sides)`);
  const [b0, b1] = def.bridges[0], i = at((b0 + b1) / 2);
  check('bridge: ~312 m over the Sava, the barriers 1.6 m past the asphalt there (def.narrow)', Math.abs(b1 - b0 - 312) < 3 && T.bl[i] - T.wAt(i) < 1.7 && T.br[i] - T.wAt(i) < 1.7,
    `${(b1 - b0).toFixed(0)} m, barriers ${(T.bl[i] - T.wAt(i)).toFixed(2)} / ${(T.br[i] - T.wAt(i)).toFixed(2)} m past the edges`);
  let nIn = 0, nB = 0; for (const b of def.bld) { const [x, z, L, W, ang] = b, c = Math.cos(ang), s = Math.sin(ang); if (b[8] || L * W > 4000) continue;
    const Q = [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]].map(([u, v]) => { const px = x + c * u - s * v, pz = z + s * u + c * v; return T.query(px, pz, T.nearestIdx(px, pz), {}); });
    if (Q.some(q => q.k < 0 && !q.over && Math.abs(q.d) < T.wAt(q.a))) continue;   // (one the data puts on the road itself: the scenery leaves it out)
    nB++; if (Q.some(q => q.k < 0 && !q.over && !T.gap[q.d > 0 ? 1 : 0][q.a] && Math.abs(q.d) < (q.d > 0 ? q.br : q.bl) - 0.6)) nIn++; }   // (beside a side road's mouth the barrier is open)
  check('walls: the houses, garden walls and fences beside the road are its barrier there (def.walls): no house inside it', def.walls.length > 100 && nIn === 0, `${def.walls.length} walls, ${nIn} of ${nB} houses inside the barriers`);
}

// 3. every junction: the side roads, the four roundabouts (three driven round), the oncoming traffic's own way round them (altDn), the bus stops and
// the zebra crossings
{
  const R = def.rings || [];
  check('junctions: every street, lane and track that meets the road (side roads), the four roundabouts (three driven round, the big one at Na klancu passed on its slip road)',
    T.stubs.length >= 80 && R.length === 4 && R.filter(r => r.drive).length === 3 && R.every(r => r.r > 11 && r.r < 22), `${T.stubs.length} side roads, rings ${R.map(r => `r ${r.r} @${Math.round(r.d)}${r.drive ? '' : ' (passed)'}`).join(', ')}`);
  check('one-way: the oncoming traffic\'s own lines round the rings and the split approaches (altDn), each a stretch of the road with a line of points',
    def.altDn.length === 5 && def.altDn.every(a => a.b > a.a && a.P.length >= 30 && a.P.length % 3 === 0), def.altDn.map(a => `${Math.round(a.a)}-${Math.round(a.b)}`).join(', '));
  check('stops and crossings: the bus stops (OSM, with their names) and the zebra crossings on the road', def.stops.length >= 12 && def.stops.every(s => s[2]) && def.zebras.length >= 12, `${def.stops.length} stops, ${def.zebras.length} zebra crossings`);
}

// 4. the places: in order along the road, the commentator's lines for each, the castle at the finish; only geographic names (no club, business,
// school or brand; the buildings keep none but the castle's); in English on the HUD
{
  const N = T.names, ok = N.every((q, k) => !k || q.d > N[k - 1].d) && N.every(q => q.say && q.say.length);
  check('places: in order along the road (Medvode, its roundabout ... the bridge over the Sava ... Smlednik, the old castle at the finish), each with the commentator\'s lines',
    ok && N.length >= 12 && N[0].n === 'Medvode' && N.some(q => q.n === 'Most čez Savo') && /^Stari grad/.test(N[N.length - 1].n) && Math.abs(N[N.length - 1].d - T.raceLen) < 30, N.map(q => `${q.n}@${Math.round(q.d)}`).join(', '));
  const all = JSON.stringify([def.name, def.en, def.desc, def.escTo, N.map(q => [q.n, q.say]), def.comm, def.police, def.stops.map(s => s[2]), def.sideRoads.map(r => r[9]), def.bld.map(b => b[7])]);
  check('names: Medvode, Slovenija (Slovenia in English); no club, police station, library, fire brigade, school or brand anywhere in the names and lines',
    def.name === 'Medvode, Slovenija' && def.en.name === 'Medvode, Slovenia' && !/\bNK\b|nogometni klub|policijsk|knjižnic|PGD|gasil|glasben|občina|dom starejših|\bOŠ\b/i.test(all) && def.bld.every(b => !b[7] || b[7] === 'Stari grad'), def.name);
  Lang.set('en'); const en = N.map(q => Lang.place(q.n)); Lang.set('sl');
  check('names: in English on the HUD (the roundabouts, the bridge, the lake, the castle)', en.includes('Roundabout · Medvode') && en.includes('Sava Bridge') && en.includes('Lake Zbilje') && /^Old Castle · \d{3} m$/.test(en[en.length - 1]), en.join(', '));
}

// 5. the traffic: both ways; the oncoming vehicles round the rings on their own lines (off the route), none up the castle road; on the narrow
// roads they pull onto the shoulder for the police
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf; d.start();
  let alt = 0, off = 0, beyond = 0;
  for (let k = 0; k < 120 * 60; k++) { Math.random = seeded(3000 + k); for (const c of d.cars) c.inThr = c.inBrk = c.inSteer = 0; d.step(DT);
    if (k % 30 === 0) for (const v of tf.veh) { if (v.alt) { alt++; const i = T.nearestIdx(v.x, v.z); if (Math.hypot(v.x - T.px[i], v.z - T.pz[i]) > T.wAt(i) + 1) off++; } if (v.s > T.startS + def.trafficEnd + 5) beyond++; } }
  Math.random = orig;
  check('traffic: both ways; round the rings and on the split approaches the oncoming vehicles drive their own lines, off the route; none up the castle road',
    tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && alt > 20 && off > alt * 0.5 && !beyond, `${tf.veh.length} vehicles, ${alt} seen on their own line (${off} off the route), ${beyond} past the castle road's foot`);
  const v = { dir: 1, s: T.startS + 4900, kind: 0, wid: 1.8 }, e = tf._edge(v);
  check('traffic: on the 4.8 m road through Smlednik a car pulling over for the police goes onto the shoulder (def.pullOff)', Math.abs(e) > T.wAt(at(4900)) - 0.9 + 0.5, `its middle ${e.toFixed(2)} m from the centre line, the asphalt's edge ${T.wAt(at(4900)).toFixed(2)} m`);
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

// 7. a whole race up to the castle on autopilot: every car finishes, then pulls up in its own slot past the line and stays there
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 700 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach the castle', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check('race: past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)', slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 8. a whole duel in the traffic on autopilot (both cars): both reach the castle, nobody knocked down, the traffic keeps moving
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0; const stand = new Map();
  while (t < 700 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the castle through the traffic, no one knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 40,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

// 9. the run from the police: no checkpoint, no building (the chase from the start, the escape over the finish); the patrol cars read POLICIJA;
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
  check('police: the chase from the start, the escape over the finish at the castle; on autopilot at the easy level it gets away at least once in three; the patrol cars read POLICIJA',
    def.police.label === 'POLICIJA' && runs.every(r => r.st.stage === 'chase' && !r.st.chk && !r.st.goal && r.st.chase && !r.nan && (r.escaped || r.busted)) && runs.some(r => r.escaped),
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m`).join('; '));
}

// 10. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

// 11. the scenery's data in the track file: the terrain, the land cover, the canopy, the buildings (OSM footprints), the water (the Sava, the lake),
// the streets, paths, the railway, the power lines, fences and hedges, the sports grounds
{
  const k = def.bld.reduce((a, b) => (a[b[6]] = (a[b[6]] || 0) + 1, a), {});
  check('scenery: terrain, land cover, canopy, ~1900 buildings (houses, flats, churches, the castle), the Sava and the lake, the streets and paths, the railway, the power lines, fences and hedges, the sports grounds',
    def.dem && def.dem.rows && def.lc && def.lc.rle && def.cano && def.cano.rle && def.bld.length > 1500 && k[0] > 1000 && k[2] >= 2 && k[6] === 1 && def.water.some(w => w[0] === 'lake') && def.water.some(w => w[0] === 'river') &&
    def.roads.length > 200 && def.paths.length > 50 && def.rail.length && def.power.length && def.fences.length > 100 && def.pitches.length >= 5,
    `${def.bld.length} buildings (${JSON.stringify(k)}), ${def.water.length} water, ${def.roads.length} streets, ${def.paths.length} paths, ${def.fences.length} fences`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
