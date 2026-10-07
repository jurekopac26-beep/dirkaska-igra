// Medvode to Smlednik: the real road widened to the usual width of the race tracks (an open road with four ways to drive it on one card, as
// Mulholland Highway: def.modes, the race, the time trial, the duel in the traffic and the run from the police). The road: from the football
// ground on Medvoška cesta in Medvode to the old castle above Smlednik (~6.2 km, ~320 -> ~500 m), ~14.8 m wide on average (the usual width +30 %) with the real
// widths' order kept (18.2 m on Gorenjska cesta, 16.3 m on Medvoška cesta, 11.1 m up the castle road: def.widths), gravel (makadam) where OSM
// has it unpaved (the castle road: def.surf), the sidewalks, the bridge over the Sava (118 m) with its parapets close to the road, Gorenjska
// cesta's overpass over the road (def.overpass); every junction (the side roads), the four roundabouts (three of them driven round, both
// ways round the islands free, the islands solid, the oncoming traffic on its own way round them and the split approaches, those lanes road too: def.altDn), the bus stops and the zebra crossings;
// the houses, garden walls and fences beside the road are the barrier there (def.walls); the places for the HUD and the commentator in order
// along the road; only geographic names. The traffic: both ways, the oncoming vehicles round the rings on their own lines, none up the castle
// road (def.trafficEnd), pulling onto the shoulder for the police (def.pullOff). A whole race on autopilot (every car finishes and pulls up in its own slot past the line), a whole duel in the traffic, the run
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

// 2. the widths: the real ones (Medvoška cesta 6.4 m, Gorenjska cesta 7.5 m, the regional road ~6 m, the bridge 6.5 m, Smlednik 4.8 m, the
// castle road 3.7 m) widened to the race tracks' usual ~11.4 m on average, their order kept; gravel up the castle road; the sidewalks part of the
// road; the bridge over the Sava (118 m) between its parapets, 1.6 m from the asphalt; Gorenjska cesta over the road on its bridge
{
  const w = (d) => 2 * T.wAt(at(d)), wk = T.walk ? T.walk[0].filter(v => v > 0.5).length + T.walk[1].filter(v => v > 0.5).length : 0;
  let ws = 0, wn = 0; for (let d = 0; d < T.raceLen; d += 2) { ws += w(d); wn++; }
  check('widths: ~14.8 m on average (the race tracks\' usual 11.4 m and 30 % more), the real order kept: 18.2 m on Gorenjska cesta > 16.3 m on Medvoška cesta, the regional road and the bridge > 12.7 m in Smlednik > 11.1 m up the castle road',
    Math.abs(ws / wn - 14.8) < 0.5 && Math.abs(w(800) - 18.2) < 0.4 && Math.abs(w(100) - 16.3) < 0.4 && Math.abs(w(1593) - 16.1) < 0.5 && Math.abs(w(3793) - 16.4) < 0.5 && Math.abs(w(4993) - 12.7) < 0.4 && Math.abs(w(5893) - 11.1) < 0.4,
    `average ${(ws / wn).toFixed(2)} m; ` + [100, 800, 1593, 3793, 4993, 5893].map(d => `${d}: ${w(d).toFixed(2)} m`).join(', '));
  const sf = (d) => T.sf ? T.sf[at(d)] : 0, sfs = [3093, 5093, 5293, 5893, 6293].map(sf);
  check('surface: gravel (makadam) where OSM has the road unpaved, the castle road from its foot (d ~5241) to the end; asphalt before', sfs.join() === '0,0,5,5,5' && def.surf.length === 1 && Math.abs(def.surf[0][0] - 5241) < 5,
    `surface at 3093/5093/5293/5893/6293: ${sfs.join(' ')}, def.surf ${JSON.stringify(def.surf)}`);
  check('sidewalks: along the villages, part of the road (T.walk)', wk * T.ds > 2500, `${(wk * T.ds / 1000).toFixed(1)} km of sidewalk (both sides)`);
  const [b0, b1] = def.bridges[0], i = at((b0 + b1) / 2);
  check('bridge: 118 m over the Sava (OSM), the barriers 1.6 m past the asphalt there (def.narrow)', Math.abs(b1 - b0 - 118) < 3 && T.bl[i] - T.wAt(i) < 1.7 && T.br[i] - T.wAt(i) < 1.7,
    `${(b1 - b0).toFixed(0)} m, barriers ${(T.bl[i] - T.wAt(i)).toFixed(2)} / ${(T.br[i] - T.wAt(i)).toFixed(2)} m past the edges`);
  let nIn = 0, nB = 0; for (const b of def.bld) { const [x, z, L, W, ang] = b, c = Math.cos(ang), s = Math.sin(ang); if (b[8] || L * W > 4000 || L < 2.2 || W < 2.2) continue;   // (the sheds under 2.2 m across: the scenery leaves them out)
    const Q = [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]].map(([u, v]) => { const px = x + c * u - s * v, pz = z + s * u + c * v; return T.query(px, pz, T.nearestIdx(px, pz), {}); });
    if (Q.some(q => (q.k < 0 && !q.over && Math.abs(q.d) < T.wAt(q.a)) || (q.k >= 0 && q.st <= T.stubs[q.k].Lend && Math.abs(q.u) <= (q.st < T.stubs[q.k].te ? T.stubHw(T.stubs[q.k], q.st) : T.stubs[q.k].hw) + 0.3))) continue;   // (one the data puts on the road itself or on a side road: the scenery leaves it out)
    nB++; if (Q.some(q => q.k < 0 && !q.over && !T.gap[q.d > 0 ? 1 : 0][q.a] && Math.abs(q.d) < (q.d > 0 ? q.br : q.bl) - 0.6)) nIn++; }   // (beside a side road's mouth the barrier is open)
  let far = 0, nS = 0; for (let i = 0; i < T.N; i += 3) for (const sd of [0, 1]) { const b = (sd ? T.br[i] : T.bl[i]) - T.wAt(i) - (T.walk ? T.walk[sd][i] : 0); nS++; if (b > 1.7) far++; }
  check('barrier: right along the road all the way (def.edgeBar: 0.8 m past the asphalt or the sidewalk, the bridge\'s parapets 1.6 m), the side roads closed across their mouths (def.sideClosed: no gap); the few houses nearer pull it in (def.walls), none inside it',
    def.edgeBar === 0.8 && def.sideClosed && !T.gap[0].some(v => v) && !T.gap[1].some(v => v) && far === 0 && nIn === 0, `${far} of ${nS} places with the barrier over 1.7 m out, ${def.walls.length} walls, ${nIn} of ${nB} houses inside the barriers`);
  const O = (def.overpass || [])[0], oy = O ? Math.max(...O.P.filter((v, k) => k % 3 === 2)) : 0, io = O ? at((O.d[0] + O.d[1]) / 2) : 0;
  check('overpass: Gorenjska cesta crosses over the road on its bridge at d ~193 (OSM), its deck over 5 m above the road, the abutments the barrier under it',
    !!O && O.d[0] < 193 && O.d[1] > 193 && oy - T.hy[io] > 5 && T.bl[io] - T.wAt(io) < 3 && T.br[io] - T.wAt(io) < 3, O ? `deck ${(oy - T.hy[io]).toFixed(1)} m over the road, d ${O.d.join('-')}` : 'none');
}

// 3. every junction: the side roads, the four roundabouts (three driven round), the oncoming traffic's own way round them (altDn), the bus stops and
// the zebra crossings
{
  const R = def.rings || [];
  check('junctions: every street, lane and track that meets the road (side roads, closed at the road), the four roundabouts, all four driven round (the big one at Na klancu the long way, west and north round its island: its slip lane closed)',
    T.stubs.length >= 80 && R.length === 4 && R.filter(r => r.drive).length === 4 && R.every(r => r.r > 11 && r.r < 22), `${T.stubs.length} side roads, rings ${R.map(r => `r ${r.r} @${Math.round(r.d)}${r.drive ? '' : ' (passed)'}`).join(', ')}`);
  // both ways round every island, the oncoming lanes are road (Track.rings, altC; the game's own wallCollide on a car that stands where it is told)
  const rc = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, damage: 0 })), P = rc.player; Math.random = seeded(3); rc.start(); Math.random = orig;
  const push = (x, z, h) => { P.x = x; P.z = z; P.h = h; P.vx = P.vz = P.w = 0; P.q.i = T.nearestIdx(x, z); C.wallCollide(P, T, true); return Math.hypot(P.x - x, P.z - z); };
  const ringBad = [], isl = [];
  for (const r of R) { if (r.zone === false) continue; let worst = 0; for (let k = 0; k < 36; k++) { const a = k / 36 * 2 * Math.PI; for (const dir of [1, -1]) worst = Math.max(worst, push(r.c[0] + Math.cos(a) * r.r, r.c[1] + Math.sin(a) * r.r, a + dir * Math.PI / 2)); }
    if (worst > 0.12 || !T.inRingZone(r.c[0] + r.r, r.c[1])) ringBad.push(`${Math.round(r.d)}: ${worst.toFixed(2)}`);
    isl.push(push(r.c[0], r.c[1], 0)); }
  check('rings: the three small ones free both ways round the island (no barrier in the ring\'s zone, no wrong way), the island itself solid', !ringBad.length && isl.length === 3 && isl.every(v => v > 1), ringBad.length ? 'blocked ' + ringBad.join(', ') : `islands push a car out by ${isl.map(v => v.toFixed(1)).join(', ')} m`);
  // the big ring at Na klancu: the route up the left carriageway, round the island west and north to the exit to Zbiljska cesta (the user's way); the slip lane (OSM w... f5d2b0)
  // closed, the other half of the ring closed, the wrong way counted there
  { const B = R.find(r => r.zone === false), ang = (s) => { const i = at(s); return Math.atan2(T.pz[i] - B.c[1], T.px[i] - B.c[0]); };
    let onRing = 0, a0 = null, turn = 0; for (let d = B.d - 140; d < B.d + 140; d += 2) { const i = at(d); if (Math.abs(Math.hypot(T.px[i] - B.c[0], T.pz[i] - B.c[1]) - B.r) < 1) { const a = ang(d); if (a0 !== null) { let da = a - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; turn += da; } a0 = a; onRing += 2; } }
    const slip = def.sideRoads.find(r => r[9] === 'Gorenjska cesta' && r[1] > 0 && Math.abs(r[0] - (B.d - 170)) < 40), sp = slip ? T.stubPt(def.sideRoads.indexOf(slip), 30, {}) : null, blocked = sp ? push(sp.x, sp.z, sp.h) : 0;
    check('big ring: the route round it the long way (clockwise on the map: west, north, out east to Zbiljska cesta), on the ring for ~250 deg; its slip lane closed (a car on it is pushed back), no zone (the route\'s own barriers round it)',
      B && !T.inRingZone(B.c[0] + B.r, B.c[1]) && turn > 3.8 && onRing > 80 && blocked > 1, `on the ring ${onRing} m, turning ${(turn * 180 / Math.PI).toFixed(0)} deg, the slip lane: a car on it pushed ${blocked.toFixed(1)} m`); }
  const laneBad = [];
  def.altDn.forEach((A, n) => { for (const dir of [1, -1]) { let worst = 0; const N = A.P.length / 3, cum = [0], o = A.open || [0, 1];
      for (let k = 1; k < N; k++) cum.push(cum[k - 1] + Math.hypot(A.P[k * 3] - A.P[k * 3 - 3], A.P[k * 3 + 1] - A.P[k * 3 - 2]));
      for (let k = 1; k < N - 1; k++) { if (cum[k] < o[0] * cum[N - 1] + 3 || cum[k] > o[1] * cum[N - 1] - 3) continue; let tx = A.P[k * 3 + 3] - A.P[k * 3 - 3], tz = A.P[k * 3 + 4] - A.P[k * 3 - 2]; if (dir < 0) { tx = -tx; tz = -tz; } worst = Math.max(worst, push(A.P[k * 3], A.P[k * 3 + 1], Math.atan2(tz, tx))); }
      if (worst > 0.12) laneBad.push(`lane ${n} ${dir > 0 ? 'along' : 'against'}: ${worst.toFixed(2)} m`); } });
  check('lanes: a car drives every oncoming lane (altDn) both ways without meeting a wall — they are road as the route is (their open part: the ring\'s northern leg in from the ring\'s edge, none of Gorenjska cesta\'s own carriageway behind the fence)', !laneBad.length, laneBad.length ? laneBad.join(', ') : `${def.altDn.length} lanes, both ways`);
  { const g = def.altDn.find(A => A.open && A.open[1] <= A.open[0]), leg = def.altDn.find(A => A.open && A.open[0] > 0.2), Pt = (A, f) => { let k = Math.round(f * (A.P.length / 3 - 1)); return [A.P[k * 3], A.P[k * 3 + 1], Math.atan2(A.P[k * 3 + 4] - A.P[k * 3 + 1], A.P[k * 3 + 3] - A.P[k * 3])]; };
    const pg = g ? push(...Pt(g, 0.6)) : 0, pl = leg ? push(...Pt(leg, leg.open[0] * 0.4)) : 0;
    check('lanes: behind the fence past their open part — a car on Gorenjska cesta\'s southbound carriageway beside the ramp, or up the first ring\'s northern leg, is pushed back (no dead end off the route)', g && leg && pg > 1 && pl > 1, `pushed ${pg.toFixed(1)} m on Gorenjska cesta, ${pl.toFixed(1)} m up the northern leg`); }
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
  const v = { dir: 1, s: T.startS + 4993, kind: 0, wid: 1.8 }, e = tf._edge(v), ib = at(4993);
  check('traffic: on the village street through Smlednik a car pulling over for the police goes onto the shoulder as far as the barrier lets it (def.pullOff)', Math.abs(e) + 0.9 > T.wAt(ib) + 0.2 && Math.abs(e) + 0.9 < Math.min(T.bl[ib], T.br[ib]), `its middle ${e.toFixed(2)} m from the centre line, the asphalt's edge ${T.wAt(ib).toFixed(2)} m, the barrier ${Math.min(T.bl[ib], T.br[ib]).toFixed(2)} m`);
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
