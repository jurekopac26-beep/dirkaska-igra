// Medvode to Smlednik: the real road at its real width as a race circuit (an open road with four ways to drive it on one card, as Mulholland Highway:
// def.modes, the race, the time trial, the duel in the traffic and the run from the police). The road: from the football ground on Medvoška cesta in
// Medvode to the old castle above Smlednik (~6.3 km, ~320 -> ~500 m), ~5.6 m wide on average (7.5 m on Gorenjska cesta, 6.4 m on Medvoška cesta, 3.7 m
// up the castle road: def.widths), gravel (makadam) where OSM has it unpaved (the castle road: def.surf), the sidewalks, the bridge over the Sava (118 m)
// with its parapets close to the road, Gorenjska cesta's overpass over the road (def.overpass); a race circuit's barrier along the whole road with the
// asphalt run-off out to it (def.barrier: the houses' fronts the barrier where they stand nearer); every junction (the side roads, closed by the barrier),
// the four roundabouts (all driven round: Medvode's the long way, Na klancu's and Zbilje's clockwise, the wrong way round the island, a wall across the
// side each leaves out; Smlednik's free either way round), the oncoming traffic's own way where the route is one-way (def.altDn), the bus stops and the
// zebra crossings; the places for the HUD and the commentator in order along the road; only geographic names. The traffic: both ways, the oncoming
// vehicles on their own lines, none up the castle road (def.trafficEnd), pulling onto the shoulder for the police (def.pullOff). A whole race on autopilot
// (every car finishes and pulls up in its own slot past the line), a whole duel in the traffic, the run from the police (the autopilot gets away at least
// once in three on easy). The medal times of the time trial: the stock rally car on the autopilot. The scenery's data (terrain, land cover, canopy,
// buildings, water, streets) in the track file.
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

// 2. the widths: the real ones (Medvoška cesta 6.4 m, Gorenjska cesta 7.5 m, the regional road ~6.2 m, the bridge 6.5 m, Smlednik 4.8 m, the castle road
// 3.7 m); gravel up the castle road; the sidewalks part of the road; the bridge over the Sava (118 m) between its parapets, 1.6 m from the asphalt; Gorenjska
// cesta over the road on its bridge; the race circuit's barrier along the whole road, the asphalt run-off out to it (def.barrier: ~9 m past the edge where there
// is room, nearer where a house stands closer, its front the barrier), the side roads closed by it. Places by their position (the route's metres move with its
// rings)
const PL = { medvoska: [95.3, 29.0], gorenjska: [168.4, -422.2], zbiljska: [155.3, -1057.7], lake: [951.8, -2053.2], bridge: [1319.1, -2544.2], smlednik: [2137.8, -2669.8],
  smlednik2: [2079.7, -2594.9], castleFoot: [2098.9, -2508.5], castle1: [2142.4, -2536.7], castle2: [2511.4, -2518.1], castle3: [2559.1, -2562.5] };
const iAt = (p) => T.nearestIdx(p[0], p[1]), dAt = (p) => iAt(p) * T.ds - T.startS;
{
  const w = (p) => 2 * T.wAt(iAt(p)), wk = T.walk ? T.walk[0].filter(v => v > 0.5).length + T.walk[1].filter(v => v > 0.5).length : 0;
  let ws = 0, wn = 0; for (let d = 0; d < T.raceLen; d += 2) { ws += 2 * T.wAt(at(d)); wn++; }
  check('widths: the real ones, ~5.6 m on average: 7.5 m on Gorenjska cesta, 6.4 m on Medvoška cesta, ~6.2 m on the regional road, 6.5 m on the bridge, 4.8 m through Smlednik, 3.7 m up the castle road',
    Math.abs(ws / wn - 5.6) < 0.4 && Math.abs(w(PL.gorenjska) - 7.5) < 0.2 && Math.abs(w(PL.medvoska) - 6.4) < 0.2 && Math.abs(w(PL.zbiljska) - 6.2) < 0.3 && Math.abs(w(PL.bridge) - 6.5) < 0.2 && Math.abs(w(PL.smlednik) - 4.8) < 0.2 && Math.abs(w(PL.castle2) - 3.7) < 0.2,
    `average ${(ws / wn).toFixed(2)} m; ` + Object.entries(PL).map(([k, p]) => `${k}: ${w(p).toFixed(2)} m`).join(', '));
  const sf = (p) => T.sf ? T.sf[iAt(p)] : 0, sfs = [PL.lake, PL.smlednik2, PL.castle1, PL.castle2, PL.castle3].map(sf);
  check('surface: gravel (makadam) where OSM has the road unpaved, the castle road from its foot to the end; asphalt before', sfs.join() === '0,0,5,5,5' && def.surf.length === 1 && Math.abs(def.surf[0][0] - dAt(PL.castleFoot)) < 6,
    `surface by the lake, in Smlednik, up the castle road (3): ${sfs.join(' ')}, def.surf ${JSON.stringify(def.surf)}, the foot at d ${dAt(PL.castleFoot).toFixed(0)}`);
  check('sidewalks: along the villages, part of the road (T.walk)', wk * T.ds > 2500, `${(wk * T.ds / 1000).toFixed(1)} km of sidewalk (both sides)`);
  const [b0, b1] = def.bridges[0], i = at((b0 + b1) / 2);
  check('bridge: 118 m over the Sava (OSM), the barriers 1.6 m past the asphalt there (its parapets)', Math.abs(b1 - b0 - 118) < 3 && T.bl[i] - T.wAt(i) < 1.7 && T.br[i] - T.wAt(i) < 1.7,
    `${(b1 - b0).toFixed(0)} m, barriers ${(T.bl[i] - T.wAt(i)).toFixed(2)} / ${(T.br[i] - T.wAt(i)).toFixed(2)} m past the edges`);
  let nIn = 0, nB = 0; for (const b of def.bld) { const [x, z, L, W, ang] = b, c = Math.cos(ang), s = Math.sin(ang); if (b[8] || L * W > 4000 || L < 2.2 || W < 2.2) continue;   // (the sheds under 2.2 m across: the scenery leaves them out)
    const Q = [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]].map(([u, v]) => { const px = x + c * u - s * v, pz = z + s * u + c * v; return T.query(px, pz, T.nearestIdx(px, pz), {}); });
    if (Q.some(q => (q.k < 0 && !q.over && Math.abs(q.d) < T.wAt(q.a)) || (q.k >= 0 && q.st <= T.stubs[q.k].Lend && Math.abs(q.u) <= (q.st < T.stubs[q.k].te ? T.stubHw(T.stubs[q.k], q.st) : T.stubs[q.k].hw) + 0.3))) continue;   // (one the data puts on the road itself or on a side road: the scenery leaves it out)
    nB++; if (Q.some(q => q.k < 0 && !q.over && Math.abs(q.d) < (q.d > 0 ? q.br : q.bl) - 0.6)) nIn++; }
  const segD = (L, x, z) => { let m = 1e9; for (let k = 0; k + 3 < L.length; k += 2) { const ax = L[k], az = L[k + 1], dx = L[k + 2] - ax, dz = L[k + 3] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1e-9))); m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return m; };
  const atFront = (x, z) => T.onBuilding(x, z, 1.0) || (def.fences || []).some(([kd, L]) => (kd === 2 || kd === 3) && segD(L, x, z) < 1.0);   // (a house's or a wall's front right behind the barrier: it is the barrier there)
  let run = 0, full = 0, near = 0, nS = 0, fronts = 0; for (let i = 0; i < T.N; i += 3) { const s = i * T.ds - T.startS; if (def.bridges.some(([a, b]) => s > a - 3 && s < b + 3)) continue;
    for (const sd of [0, 1]) { const bar = sd ? T.br[i] : T.bl[i], b = bar - T.wAt(i) - (T.walk ? T.walk[sd][i] : 0); nS++; run += b; if (b > 8.9) full++;
      if (b < 0.55) { const o = (sd ? 1 : -1) * (bar + 0.3); if (bar - T.wAt(i) >= 0.25 && atFront(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o)) fronts++; else near++; } } }
  check('barrier: a race circuit\'s along the whole road (def.barrier), the asphalt run-off out to it: ~9 m past the asphalt or the sidewalk where there is room (on average over 5 m), never nearer than 0.6 m but at a house\'s or a wall\'s front standing closer (the front the barrier there, 0.25 m past the asphalt at least), no house inside it; the side roads closed across their mouths (def.sideClosed: no gap)',
    !!def.barrier && def.sideClosed && !T.gap[0].some(v => v) && !T.gap[1].some(v => v) && run / nS > 5 && full / nS > 0.3 && near === 0 && nIn === 0,
    `${(run / nS).toFixed(2)} m past the edge on average, ${(100 * full / nS).toFixed(0)} % of it the full run-off, ${near} places nearer than 0.55 m (${fronts} more at a front), ${nIn} of ${nB} houses inside the barriers`);
  const O = (def.overpass || [])[0], oy = O ? Math.max(...O.P.filter((v, k) => k % 3 === 2)) : 0, io = O ? at((O.d[0] + O.d[1]) / 2) : 0;
  check('overpass: Gorenjska cesta crosses over the road on its bridge at d ~193 (OSM), its deck over 5 m above the road, the abutments the barrier under it',
    !!O && O.d[0] < 193 && O.d[1] > 193 && oy - T.hy[io] > 5 && T.bl[io] - T.wAt(io) < 3 && T.br[io] - T.wAt(io) < 3, O ? `deck ${(oy - T.hy[io]).toFixed(1)} m over the road, d ${O.d.join('-')}` : 'none');
}

// 3. every junction: the side roads, the four roundabouts (all four driven round: the first one the long way round, the big one at Na klancu and the one in Zbilje
// clockwise round the island, the wrong way, a wall across the side of each the route leaves out; the one at Smlednik free either way round), the oncoming
// traffic's own way where the route is one-way (altDn), the bus stops and the zebra crossings
{
  const R = def.rings || [], ringAt = (x, z) => R.find(r => Math.hypot(r.c[0] - x, r.c[1] - z) < 1.5);
  const RA = ringAt(261.13, -27.17), RB = ringAt(45.94, -594.11), RC = ringAt(213.81, -1705.93), RD = ringAt(1509.1, -2791.41);
  check('junctions: every street, lane and track that meets the road (side roads, closed at the road), the four roundabouts, all four driven round',
    T.stubs.length >= 80 && R.length === 4 && R.filter(r => r.drive).length === 4 && R.every(r => r.r > 11 && r.r < 22) && RA && RB && RC && RD, `${T.stubs.length} side roads, rings ${R.map(r => `r ${r.r} @${Math.round(r.d)}`).join(', ')}`);
  const swept = (r) => { let a0 = null, turn = 0, on = 0; for (let i = 0; i < T.N; i++) { if (Math.abs(Math.hypot(T.px[i] - r.c[0], T.pz[i] - r.c[1]) - r.r) > 1) { if (on > 4) break; continue; }
      const a = Math.atan2(T.pz[i] - r.c[1], T.px[i] - r.c[0]); if (a0 !== null) { let da = a - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; turn += da; } a0 = a; on++; }
    return turn * 180 / Math.PI; };   // (+: clockwise on the map)
  const sw = [RA, RB, RC, RD].map(r => r ? swept(r) : 0);
  check('rings: the way round each (on the map): Medvode\'s anticlockwise the long way (~200 deg), Na klancu clockwise (~265 deg), Zbilje clockwise the long way (over 200 deg on its circle), Smlednik anticlockwise straight across (~120 deg)',
    sw[0] < -180 && sw[0] > -230 && sw[1] > 240 && sw[1] < 290 && sw[2] > 200 && sw[2] < 330 && sw[3] < -100 && sw[3] > -140, `swept ${sw.map(v => v.toFixed(0)).join(', ')} deg`);
  check('rings: a wall across the side of the road each of the first three leaves out (rings[].shut); Smlednik\'s open both ways round', [RA, RB, RC].every(r => r && (r.shut || []).length === 1) && RD && !(RD.shut || []).length,
    [RA, RB, RC, RD].map(r => r ? JSON.stringify(r.shut || []) : '-').join(' '));
  // both ways round every island but at the walls; the islands solid; a car crossing a wall is stopped (Track.rings, the game's own wallCollide on a car that stands where it is told)
  const rc = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, damage: 0 })), P = rc.player; Math.random = seeded(3); rc.start(); Math.random = orig;
  const push = (x, z, h, fx, fz) => { P.x = x; P.z = z; P.h = h; P.px = fx != null ? fx : x; P.pz = fz != null ? fz : z; P.vx = P.vz = P.w = 0; P.q.i = T.nearestIdx(x, z); C.wallCollide(P, T, true); return Math.hypot(P.x - x, P.z - z); };
  const ringBad = [], isl = [], walls = [];
  for (const r of R) { let worst = 0; const sh = r.shut || [];
    for (let k = 0; k < 36; k++) { const a = k / 36 * 2 * Math.PI; if (sh.some(t => Math.abs(((a - t + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) < 0.3)) continue;
      for (const dir of [1, -1]) worst = Math.max(worst, push(r.c[0] + Math.cos(a) * r.r, r.c[1] + Math.sin(a) * r.r, a + dir * Math.PI / 2)); }
    if (worst > 0.12 || !T.inRingZone(r.c[0] + r.r, r.c[1])) ringBad.push(`${Math.round(r.d)}: ${worst.toFixed(2)}`);
    isl.push(push(r.c[0], r.c[1], 0));
    for (const t of sh) { const ux = Math.cos(t), uz = Math.sin(t), x = r.c[0] + ux * r.r, z = r.c[1] + uz * r.r;   // (the car's centre 1.5 m on one side before the step, its corner now 0.1 m past the wall)
      walls.push(push(x - uz * 0.1, z + ux * 0.1, t + Math.PI / 2, x + uz * 1.5, z - ux * 1.5)); } }
  check('rings: free round the island both ways but at the walls (no barrier in the zone, no wrong way), the islands solid, the walls across the closed sides hold', !ringBad.length && isl.length === 4 && isl.every(v => v > 1) && walls.length === 3 && walls.every(v => v > 0.2),
    `${ringBad.length ? 'blocked ' + ringBad.join(', ') + '; ' : ''}islands push a car out by ${isl.map(v => v.toFixed(1)).join(', ')} m, the walls by ${walls.map(v => v.toFixed(2)).join(', ')} m`);
  { const slip = def.sideRoads.find(r => r[9] === 'Gorenjska cesta' && r[1] > 0 && Math.abs(r[0] - (RB.d - 170)) < 40), k = def.sideRoads.indexOf(slip); let far = null;   // (its first metres are the run-off, its last the big ring's zone: between them it runs on past the barrier)
    if (slip) for (let t = 2; t < T.stubs[k].L; t += 1) { const p = T.stubPt(k, t, {}), q = T.queryRoute(p.x, p.z, T.nearestIdx(p.x, p.z), {}), past = Math.abs(q.d) - (q.d > 0 ? q.br : q.bl); if (!T.inZone(p.x, p.z) && (!far || past > far.past)) far = { p, past, t }; }
    const blocked = far && far.past > 0.8 ? push(far.p.x, far.p.z, far.p.h) : 0;
    check('big ring: its slip lane to Kranj closed where it runs past the barrier (a car on it there is pushed back)', blocked > 1, `the slip lane ${far ? `${far.past.toFixed(1)} m past the barrier ${far.t} m along it` : 'not found'}: a car on it there pushed ${blocked.toFixed(1)} m`); }
  const laneBad = [], laneOut = [];
  def.altDn.forEach((A, n) => { const N = A.P.length / 3, cum = [0], o = A.open || [0, 1];
    for (let k = 1; k < N; k++) cum.push(cum[k - 1] + Math.hypot(A.P[k * 3] - A.P[k * 3 - 3], A.P[k * 3 + 1] - A.P[k * 3 - 2]));
    for (const dir of [1, -1]) { let worst = 0;
      for (let k = 1; k < N - 1; k++) { if (cum[k] < o[0] * cum[N - 1] + 3 || cum[k] > o[1] * cum[N - 1] - 3) continue; let tx = A.P[k * 3 + 3] - A.P[k * 3 - 3], tz = A.P[k * 3 + 4] - A.P[k * 3 - 2]; if (dir < 0) { tx = -tx; tz = -tz; } worst = Math.max(worst, push(A.P[k * 3], A.P[k * 3 + 1], Math.atan2(tz, tx))); }
      if (worst > 0.12) laneBad.push(`lane ${n} ${dir > 0 ? 'along' : 'against'}: ${worst.toFixed(2)} m`); }
    if (o[0] > 0.15) { const k = Math.round(o[0] * 0.4 * (N - 1)); laneOut.push(push(A.P[k * 3], A.P[k * 3 + 1], 0)); } });
  check('lanes: the oncoming lanes (altDn) are road where they run inside the barrier (the run-off), a car drives them both ways; past it they run on behind the barrier (a car there is pushed back)', !laneBad.length && laneOut.every(v => v > 0.5),
    laneBad.length ? laneBad.join(', ') : `${def.altDn.length} lanes, both ways; behind the barrier pushed ${laneOut.map(v => v.toFixed(1)).join(', ')} m`);
  check('one-way: the oncoming traffic\'s own lines round the rings and the split approaches (altDn), each a stretch of the road with a line of points',
    def.altDn.length >= 4 && def.altDn.every(a => a.b > a.a && a.P.length >= 30 && a.P.length % 3 === 0), def.altDn.map(a => `${Math.round(a.a)}-${Math.round(a.b)}`).join(', '));
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
  const ib = iAt(PL.smlednik), v = { dir: 1, s: ib * T.ds, kind: 0, wid: 1.8 }, e = tf._edge(v);
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
      if (P.stuckT > 2.5 || P.wrongT > 3) r.rescue(P);   // (as soon as the game offers the rescue button: pushed into the barrier by a patrol car, the autopilot does not back out by itself)
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
