// Medvode to Smlednik: the real road at its real width as a race circuit (an open road with four ways to drive it on one card, as Mulholland Highway:
// def.modes, the race, the time trial, the duel in the traffic and the run from the police). The road: from the football ground on Medvoška cesta in
// Medvode to the old castle above Smlednik (~6.3 km, ~320 -> ~500 m), ~5.6 m wide on average (7.5 m on Gorenjska cesta, 6.4 m on Medvoška cesta, 3.7 m
// up the castle road: def.widths), gravel (makadam) where OSM has it unpaved (the castle road: def.surf), the sidewalks, the bridge over the Sava (118 m)
// with its parapets close to the road, Gorenjska cesta's overpass over the road (def.overpass); a race circuit's barrier along the whole road with the
// run-off out to it on its real surfaces (def.barrier: the houses' fronts the barrier where they stand nearer; def.roSurf: asphalt, paving, grass, gravel); every junction (the side roads, closed by the barrier),
// the four roundabouts (all driven round: Medvode's the long way, Na klancu's and Zbilje's clockwise, the wrong way round the island, a wall across the
// side each leaves out; Smlednik's free either way round), the oncoming traffic's own way where the route is one-way (def.altDn), the bus stops and the
// zebra crossings; the places for the HUD and the commentator in order along the road; only geographic names. The traffic: both ways, the oncoming
// vehicles on their own lines, none up the castle road (def.trafficEnd), pulling onto the shoulder for the police (def.pullOff). A whole race on autopilot
// (every car finishes and pulls up in its own slot past the line; the AI cars keep to the road and the run-off's paved parts), a whole duel in the traffic,
// the run from the police (the autopilot gets away now and then on easy). The medal times of the time trial: the stock rally car on the
// autopilot. The run-off's surfaces as the track file has them (def.roSurf, read here on its own): what the cars drive on there, the paved part the AI
// keeps to. The scenery's data (terrain, land cover, canopy, buildings, water, streets) in the track file. The islands (r9): the rings' central islands
// dense tall grass a car may cut across (def.rings isl 'tall': Track.surface's TALL, grass and slower; solid only in the very middle, R.mid; the walls
// across the closed sides from that middle out past the zone's circle), every other island (def.splitIsl) grass flush with the ground; the AI round the
// rings on their roads (on a track file without them yet, the engine's rules on its rings made tall here).
//   node tests/medvode.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore(), Lang = require(path.join(ROOT, 'js', 'lang.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'medvode'), T = new C.Track(def);
// (p10) the user's drawn windows (def.mvWin): there World draws their road, sidewalks and markings, none of its own (side roads, lanes)
const inWinT = (x, z) => (def.mvWin || []).some(w => { const P = w.poly; let c = false; for (let i = 0, j = P.length - 2; i < P.length; j = i, i += 2) if ((P[i + 1] > z) !== (P[j + 1] > z) && x < (P[j] - P[i]) * (z - P[i + 1]) / (P[j + 1] - P[i + 1]) + P[i]) c = !c; return c; });
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
// cesta over the road on its bridge; the race circuit's barrier along the whole road, the run-off out to it (def.barrier: ~9 m past the edge where there
// is room, nearer where a house stands closer, its front the barrier), the side roads closed by it. Places by their position (the route's metres move with its
// rings)
const PL = { medvoska: [95.3, 29.0], gorenjska: [168.4, -422.2], zbiljska: [155.3, -1057.7], lake: [951.8, -2053.2], bridge: [1319.1, -2544.2], smlednik: [2137.8, -2669.8],
  smlednik2: [2079.7, -2594.9], castleFoot: [2098.9, -2508.5], castle1: [2142.4, -2536.7], castle2: [2511.4, -2518.1], castle3: [2559.1, -2562.5] };
const iAt = (p) => T.nearestIdx(p[0], p[1]), dAt = (p) => iAt(p) * T.ds - T.startS;
{
  const w = (p) => 2 * T.wAt(iAt(p)), wk = T.walk ? T.walk[0].filter(v => v > 0.5).length + T.walk[1].filter(v => v > 0.5).length : 0;
  let ws = 0, wn = 0; for (let d = 0; d < T.raceLen; d += 2) { ws += 2 * T.wAt(at(d)); wn++; }
  check('widths: the real ones, ~5.8 m on average (the user\'s drawn windows: their carriageways, both directions on the rings\' legs): 7.5 m on Gorenjska cesta, 6.4 m on Medvoška cesta, ~6.2 m on the regional road, 6.5 m on the bridge, 4.8 m through Smlednik, 3.7 m up the castle road',
    Math.abs(ws / wn - 5.8) < 0.4 && Math.abs(w(PL.gorenjska) - 7.5) < 0.2 && Math.abs(w(PL.medvoska) - 6.4) < 0.2 && Math.abs(w(PL.zbiljska) - 6.2) < 0.3 && Math.abs(w(PL.bridge) - 6.5) < 0.2 && Math.abs(w(PL.smlednik) - 4.8) < 0.2 && Math.abs(w(PL.castle2) - 3.7) < 0.2,
    `average ${(ws / wn).toFixed(2)} m; ` + Object.entries(PL).map(([k, p]) => `${k}: ${w(p).toFixed(2)} m`).join(', '));
  const sf = (p) => T.sf ? T.sf[iAt(p)] : 0, sfs = [PL.lake, PL.smlednik2, PL.castle1, PL.castle2, PL.castle3].map(sf);
  check('surface: gravel (makadam) where OSM has the road unpaved, the castle road from its foot to the end; asphalt before', sfs.join() === '0,0,5,5,5' && def.surf.length === 1 && Math.abs(def.surf[0][0] - dAt(PL.castleFoot)) < 6,
    `surface by the lake, in Smlednik, up the castle road (3): ${sfs.join(' ')}, def.surf ${JSON.stringify(def.surf)}, the foot at d ${dAt(PL.castleFoot).toFixed(0)}`);
  check('sidewalks: along the villages, part of the road (T.walk)', wk * T.ds > 2500, `${(wk * T.ds / 1000).toFixed(1)} km of sidewalk (both sides)`);
  const [b0, b1] = def.bridges[0], i = at((b0 + b1) / 2);
  check('bridge: 118 m over the Sava (OSM), the barriers 1.6 m past the asphalt there (its parapets)', Math.abs(b1 - b0 - 118) < 3 && T.bl[i] - T.wAt(i) < 1.7 && T.br[i] - T.wAt(i) < 1.7,
    `${(b1 - b0).toFixed(0)} m, barriers ${(T.bl[i] - T.wAt(i)).toFixed(2)} / ${(T.br[i] - T.wAt(i)).toFixed(2)} m past the edges`);
  const dropB = new Set(def.dropBld || []);   // (def.dropBld: the footprints the course takes in, left out of the scenery (World) and of Track.onBuilding)
  let nIn = 0, nB = 0; for (const [bk, b] of def.bld.entries()) { const [x, z, L, W, ang] = b, c = Math.cos(ang), s = Math.sin(ang); if (b[8] || dropB.has(bk) || L * W > 4000 || L < 2.2 || W < 2.2) continue;   // (the sheds under 2.2 m across: the scenery leaves them out)
    const Q = [[0, 0], [-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]].map(([u, v]) => { const px = x + c * u - s * v, pz = z + s * u + c * v; return T.query(px, pz, T.nearestIdx(px, pz), {}); });
    if (Q.some(q => (q.k < 0 && !q.over && Math.abs(q.d) < T.wAt(q.a)) || (q.k >= 0 && q.st <= T.stubs[q.k].Lend && Math.abs(q.u) <= (q.st < T.stubs[q.k].te ? T.stubHw(T.stubs[q.k], q.st) : T.stubs[q.k].hw) + 0.3))) continue;   // (one the data puts on the road itself or on a side road: the scenery leaves it out)
    nB++; if (Q.some(q => q.k < 0 && !q.over && Math.abs(q.d) < (q.d > 0 ? q.br : q.bl) - 0.6)) nIn++; }
  const segD = (L, x, z) => { let m = 1e9; for (let k = 0; k + 3 < L.length; k += 2) { const ax = L[k], az = L[k + 1], dx = L[k + 2] - ax, dz = L[k + 3] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1e-9))); m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return m; };
  const atFront = (x, z) => T.onBuilding(x, z, 1.0) || (def.fences || []).some(([kd, L]) => (kd === 2 || kd === 3) && segD(L, x, z) < 1.0);   // (a house's or a wall's front right behind the barrier: it is the barrier there)
  let run = 0, full = 0, near = 0, nS = 0, fronts = 0; for (let i = 0; i < T.N; i += 3) { const s = i * T.ds - T.startS; if (def.bridges.some(([a, b]) => s > a - 3 && s < b + 3)) continue;
    for (const sd of [0, 1]) { const bar = sd ? T.br[i] : T.bl[i], b = bar - T.wAt(i) - (T.walk ? T.walk[sd][i] : 0); nS++; run += b; if (b >= 4.9) full++;   // (full: the user's 5 m)
      if (b < 0.55) { const o = (sd ? 1 : -1) * (bar + 0.3); if (bar - T.wAt(i) >= 0.25 && atFront(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o)) fronts++; else near++; } } }
  check('barrier: a race circuit\'s along the whole road (def.barrier), the run-off out to it: 5 m past the asphalt or the sidewalk where there is room (the user\'s rule: on average over 5 m, 60 % of it at least 4.9 m), never nearer than 0.6 m but at a house\'s or a wall\'s front standing closer (the front the barrier there, 0.25 m past the asphalt at least), no house inside it; the side roads closed across their mouths (def.sideClosed: no gap)',
    !!def.barrier && def.sideClosed && !T.gap[0].some(v => v) && !T.gap[1].some(v => v) && run / nS > 5 && full / nS > 0.6 && near === 0 && nIn === 0,
    `${(run / nS).toFixed(2)} m past the edge on average, ${(100 * full / nS).toFixed(0)} % of it at least 4.9 m, ${near} places nearer than 0.55 m (${fronts} more at a front), ${nIn} of ${nB} houses inside the barriers`);
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
    // (a car driven down it, 0.5 m a step: the first place it is pushed back over 1 m; the user's barrier rule may take its first metres into the run-off, then
    // it is closed where it meets the ring's zone: the wall across the ring's closed side (rings[].shut, out past the zone's circle) and the route's barrier)
    let stop = null; if (slip) for (let t = 2.5; t < T.stubs[k].L; t += 0.5) { const a = T.stubPt(k, t - 0.5, {}), p = T.stubPt(k, t, {}), d = push(p.x, p.z, p.h, a.x, a.z);
      if (d > 1) { const q = T.queryRoute(p.x, p.z, T.nearestIdx(p.x, p.z), {}), dx = p.x - RB.c[0], dz = p.z - RB.c[1];
        stop = { t, d, past: Math.abs(q.d) - (q.d > 0 ? q.br : q.bl), zone: T.inZone(p.x, p.z), shut: (RB.shut || []).some(u => dx * Math.cos(u) + dz * Math.sin(u) > 0 && Math.abs(-dx * Math.sin(u) + dz * Math.cos(u)) < 3) }; break; } }
    check('big ring: its slip lane to Kranj closed (a car driven down it is pushed back where it runs past the barrier, or where it meets the ring\'s zone and the wall across its closed side)', !!stop,
      `the slip lane ${far ? `${far.past.toFixed(1)} m past the barrier at most (${far.t} m along it)` : 'not found'}; ${stop ? `a car driven down it stopped ${stop.t} m along it, pushed back ${stop.d.toFixed(1)} m (its middle ${stop.past > 0 ? `${stop.past.toFixed(1)} m past the barrier` : `${(-stop.past).toFixed(1)} m inside the barrier`}${stop.zone ? ', in the ring\'s zone' : ''}${stop.shut ? ', at the ring\'s wall across its closed side' : ''})` : 'a car driven down it never stopped'}`); }
  const laneBad = [], laneOut = [];
  def.altDn.forEach((A, n) => { const N = A.P.length / 3, cum = [0], o = A.open || [0, 1];
    for (let k = 1; k < N; k++) cum.push(cum[k - 1] + Math.hypot(A.P[k * 3] - A.P[k * 3 - 3], A.P[k * 3 + 1] - A.P[k * 3 - 2]));
    for (const dir of [1, -1]) { let worst = 0;
      for (let k = 1; k < N - 1; k++) { if (cum[k] < o[0] * cum[N - 1] + 3 || cum[k] > o[1] * cum[N - 1] - 3) continue; let tx = A.P[k * 3 + 3] - A.P[k * 3 - 3], tz = A.P[k * 3 + 4] - A.P[k * 3 - 2]; if (dir < 0) { tx = -tx; tz = -tz; } worst = Math.max(worst, push(A.P[k * 3], A.P[k * 3 + 1], Math.atan2(tz, tx))); }
      if (worst > 0.12) laneBad.push(`lane ${n} ${dir > 0 ? 'along' : 'against'}: ${worst.toFixed(2)} m`); }
    if (o[0] > 0.15) { const k = Math.round(o[0] * 0.4 * (N - 1)); if (!inWinT(A.P[k * 3], A.P[k * 3 + 1])) laneOut.push(push(A.P[k * 3], A.P[k * 3 + 1], 0)); } });   // (p10: in a window the user's road, both carriageways, inside the barrier)
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

// 7. a whole race up to the castle on autopilot: every car finishes, then pulls up in its own slot past the line and stays there. The AI keeps to the
// road and the run-off's paved parts (Track.roPv): per car the time with two wheels or more on the run-off's grass or gravel (ws 2, or 5 where the road
// at that wheel is not makadam itself: beside the castle road its gravel is as the road; a ring's tall island is not the run-off), at most 3 s in the whole
// race of its own accord (no car alongside in the last second), 5 s in all with the knocks in the pack
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player; r.start();
  let t = 0, k = 0, resc = 0; const off2 = r.cars.map(() => 0), off1 = r.cars.map(() => 0), offA = r.cars.map(() => 0), along = r.cars.map(() => -1e9);
  const hitT = r.cars.map(() => -1e9), islIn = r.cars.map(() => null), onIslK = r.cars.map(() => 0);
  const TALLR = T.rings.filter(R => R.tall), onTallW = (q) => TALLR.some(R => (q.x - R.x) ** 2 + (q.z - R.z) ** 2 < R.ie * R.ie), offR = r.cars.map(() => 0), offRS = r.cars.map(() => 0);   // (offR: two wheels on the run-off's grass or gravel, a tall island's wheels left out; offRS: of it alone)
  const offWR = (c) => { let n = 0; for (let w = 0; w < 4; w++) { const s = c.ws[w]; if ((s === 2 || (s === 5 && !(T.sf && T.sf[c.wq[w].a] === 5))) && !onTallW(c.wq[w])) n++; } return n; };   // (the last car contact; the current visit to an island: knocked onto it (a contact within 1.5 s before it went on) or of its own accord; onIslK: the time knocked)
  const ISL = T.rings.filter(R => R.zr > 0).map(R => ({ R, e: R.tall ? R.ie : R.r - R.hw - 0.35 })), onIsl = r.cars.map(() => 0);   // (the rings' islands out to their edge (World's): a car's middle in one)   // (per car: the time with two wheels or more, one or more, on the run-off's grass or gravel; offA: of off2 with another car alongside, now or in the last second)
  const offW = (c) => { let n = 0; for (let w = 0; w < 4; w++) { const s = c.ws[w]; if (s === 2 || (s === 5 && !(T.sf && T.sf[c.wq[w].a] === 5))) n++; } return n; };
  while (t < 700 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    r.cars.forEach((c, j) => { if (c.finished) return; const n = offW(c); if (r.cars.some(o => o !== c && !o.finished && Math.abs(o.q.s - c.q.s) < 6 && Math.abs(o.q.d - c.q.d) < 2.6)) along[j] = t;
      if (n >= 1) off1[j] += DT; if (n >= 2) { off2[j] += DT; if (t - along[j] < 1) offA[j] += DT; }
      if (offWR(c) >= 2) { offR[j] += DT; if (t - along[j] >= 1 && Math.hypot(c.vx, c.vz) > 1) offRS[j] += DT; }   // (p10: a car stopped against the barrier, waiting for its rescue, is not driving there)
      if ((c.hitCar || 0) > 0.3) hitT[j] = t;
      if (ISL.some(o => (c.x - o.R.x) ** 2 + (c.z - o.R.z) ** 2 < o.e * o.e)) { if (!islIn[j]) islIn[j] = t - hitT[j] < 1.5 ? 'knocked' : 'own'; if (islIn[j] === 'own') onIsl[j] += DT; else onIslK[j] += DT; } else islIn[j] = null; });
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check('race: all 13 cars reach the castle', fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const jP = r.cars.indexOf(P), most = Math.max(...offR.filter((v, j) => j !== jP)), mostS = Math.max(...offRS.filter((v, j) => j !== jP));
  check('race: the AI cars keep to the road and the run-off\'s paved parts (Track.roPv): none with two wheels on the run-off\'s grass or gravel (ws 2 / 5, the castle road\'s own makadam aside; a ring\'s tall island is not the run-off) for more than 3 s of its own accord (no car alongside in the last second, moving) in the whole race, 5 s in all with the knocks in the pack',
    mostS <= 3 && most <= 5, `per car, two wheels on the run-off alone / in all (two wheels anywhere / one): ${r.cars.map((c, j) => `${j === jP ? 'player' : '#' + j} ${offRS[j].toFixed(1)}/${offR[j].toFixed(1)} (${off2[j].toFixed(1)}/${off1[j].toFixed(1)})`).join(', ')} s; the most ${mostS.toFixed(1)} s alone, ${most.toFixed(1)} s in all (the player's autopilot ${offRS[jP].toFixed(1)} / ${offR[jP].toFixed(1)} s); ` +
    `of all the two-wheel time ${(100 * offA.reduce((a, b) => a + b, 0) / Math.max(1e-9, off2.reduce((a, b) => a + b, 0))).toFixed(0)} % with another car alongside`);
  const islMost = Math.max(...onIsl.filter((v, j) => j !== jP)), islMostK = Math.max(...onIslK.filter((v, j) => j !== jP));
  check('race: the AI cars drive round the rings on the ring roads, not across their islands (the tall grass, def.rings isl \'tall\': no AI car\'s middle on an island of its own accord (no car contact in the 1.5 s before it went on) for more than 0.3 s in the whole race; one knocked onto it by another back on the ring road soon, at most 2.5 s in all)',
    islMost <= 0.3 && islMostK <= 2.5, `per car, of its own accord / knocked on: ${r.cars.map((c, j) => `${j === jP ? 'player' : '#' + j} ${onIsl[j].toFixed(1)}/${onIslK[j].toFixed(1)}`).join(', ')} s on an island (${ISL.filter(o => o.R.tall).length} of ${ISL.length} rings tall in this file)`);
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
// whole runs on autopilot at the easy level end in an escape or an arrest, the autopilot gets away now and then. Each run's end is chaotic (any
// change to the road, its run-off or the traffic reshuffles which seeds get away): over seeds 11-40 it gets away about one time in three (10 of
// 30 with the run-off's real surfaces, as before them), so the runs go on from seed 11 until one gets away, twenty at most (a false alarm about
// once in 3000)
{
  const popts = (o) => Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 0, damage: 2, police: true }, o);
  const runs = [];
  for (let seed = 11; seed <= 30 && !runs.some(r => r.escaped); seed++) runs.push((() => {
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
  })());
  check('police: the chase from the start, the escape over the finish at the castle; on autopilot at the easy level it gets away now and then (one run in twenty at least, from seed 11 on); the patrol cars read POLICIJA',
    def.police.label === 'POLICIJA' && runs.every(r => r.st.stage === 'chase' && !r.st.chk && !r.st.goal && r.st.chase && !r.nan && (r.escaped || r.busted)) && runs.some(r => r.escaped),
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m`).join('; '));
}

// 10. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01 (with the
// run-off's real surfaces too: the autopilot keeps to the road)
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0, off = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    let nw = 0; for (let w = 0; w < 4; w++) { const s = P.ws[w]; if (s === 2 || (s === 5 && !(T.sf && T.sf[P.wq[w].a] === 5))) nw++; } if (nw >= 2 && !P.finished) off += DT; }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s (${off.toFixed(1)} s of it with two wheels on the run-off's grass or gravel)`);
}

// 10b. the run-off's real surfaces (def.roSurf): the track file's raster for this route (N, 4 columns a sample, 0.5 m cells, nd rows across (62 in the first files, more
// as the barrier went out to 5 m past the edge: the atlas's strips nd + 2 rows); the four rings'
// in Track.rings' order), decoded by Core into the atlas World draws (Track.roM, at most 4096 x 4096 RGBA); all four kinds of ground in it, neither all
// asphalt nor all grass. Track.surface over a grid of points all over the run-off (every 4 m along both sides, ~1.1 m apart across, jittered; the rings'
// zones on a polar grid) is the track file's own class at the point, found here on its own: a reference decoder of the run-length code, the point
// inverted to (s, d) between the samples' normals (the run-off's rows: p(f) + d n(f), p and n lerped, n not normalised) by bisection, the nearest texel
// (in a ring's zone the ring's raster at (x, z)); but within 0.6 m of a class boundary (there the blur and the GPU's filter draw the line). The paved
// run-off the AI keeps to (Track.roPv) lies between the road's edge and the barrier, and the track file has it paved (asphalt, paving; beside the castle
// road its gravel too) but within 0.6 m of a boundary
{
  const R = def.roSurf, M = T.roM, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', SF = [0, 0, 2, 5], NM = ['asphalt', 'paving', 'grass', 'gravel'], lerp = (a, b, t) => a + (b - a) * t;
  const dec = (s, n) => { const out = new Uint8Array(n); let k = 0, v = 0, m = 1;   // (the run-length code: per run (length - 1) * 4 + class, little-endian base-32 digits, bit 32 while more follow; null on any flaw)
    for (const ch of s) { const q = A64.indexOf(ch); if (q < 0) return null; v += (q & 31) * m; m *= 32; if (q & 32) continue; const len = Math.floor(v / 4) + 1; if (k + len > n) return null; out.fill(v % 4, k, k + len); k += len; v = 0; m = 1; }
    return k === n && m === 1 ? out : null; };
  const Cn = R ? (T.N - 1) * R.per + 1 : 0, cls = R ? dec(R.rle, R.nd * Cn) : null, rings = R ? R.rings.map(g => dec(g.rle, g.n * g.n)) : [];
  check('run-off: its surfaces in the track file for this route (def.roSurf: N, 4 columns a sample, 0.5 m cells, nd rows (40-254: the atlas\'s strips nd + 2 rows); the four rings\' in Track.rings\' order), decoded into the atlas (Track.roM: at most 4096 x 4096)',
    !!R && R.N === T.N && R.per === 4 && R.cell === 0.5 && R.nd >= 40 && R.nd <= 254 && !!cls && !!M && M.rs === R.nd + 2 && rings.length === 4 && rings.every(Boolean) && R.rings.every((g, k) => T.rings[k] && Math.hypot(g.x - T.rings[k].x, g.z - T.rings[k].z) < 0.5) &&
    !!M && M.W <= 4096 && M.H <= 4096 && M.data.length === M.W * M.H * 4 && M.rings.length === 4,
    R ? `${R.nd} x ${Cn} + 4 x ${R.rings[0].n}^2 texels, ${(R.rle.length / 1024).toFixed(1)} KB; atlas ${M ? M.W + ' x ' + M.H : '-'}` : 'none');
  const BT = 0.6 / (R ? R.cell : 0.5), edgeAt = (a, sd) => T.wAt(a) + (T.walk ? T.walk[sd][a] : 0);
  const nearB = (A, w, h, fx, fy, ref) => {   // (a texel of another class within 0.6 m: its cell)
    for (let b = Math.max(0, Math.floor(fy - BT - 0.5)); b <= Math.min(h - 1, Math.ceil(fy + BT + 0.5)); b++) for (let c = Math.max(0, Math.floor(fx - BT - 0.5)); c <= Math.min(w - 1, Math.ceil(fx + BT + 0.5)); c++) {
      if (A[b * w + c] === ref) continue; const dx = Math.max(0, Math.abs(fx - c) - 0.5), dy = Math.max(0, Math.abs(fy - b) - 0.5); if (dx * dx + dy * dy < BT * BT) return true; }
    return false; };
  const inv = (x, z, i0) => {   // (x, z) -> f samples along, d across: between which two samples' normals the point lies (by bisection), the nearest such to i0; amb: another one more than 1 m off (a fold on a hairpin's inside)
    const sols = [];
    for (let a = Math.max(0, i0 - 12); a <= Math.min(T.N - 2, i0 + 12); a++) {
      const at = (u) => { const nx = lerp(T.nx[a], T.nx[a + 1], u), nz = lerp(T.nz[a], T.nz[a + 1], u), gx = x - lerp(T.px[a], T.px[a + 1], u), gz = z - lerp(T.pz[a], T.pz[a + 1], u); return [gx * nz - gz * nx, (gx * nx + gz * nz) / (nx * nx + nz * nz)]; };
      let lo = 0, hi = 1, hl = at(0)[0]; if (hl * at(1)[0] > 0) continue;
      for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2, hm = at(m)[0]; if (hm === 0) { lo = hi = m; break; } if ((hm > 0) === (hl > 0)) { lo = m; hl = hm; } else hi = m; }
      const u = (lo + hi) / 2; sols.push({ f: a + u, d: at(u)[1], a, u }); }
    if (!sols.length) return null; sols.sort((p, q) => Math.abs(p.f - i0) - Math.abs(q.f - i0)); const s = sols[0];
    s.amb = sols.some(o => Math.abs(o.f - s.f) * T.ds > 1 || Math.abs(o.d - s.d) > 1); return s; };
  const hsh = (a, b) => { let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };   // (a fixed jitter)
  const pts = [];   // [x, z, the sample it was laid out from (-1: round a ring)]
  for (let i = 2; i < T.N - 2; i += 2) for (const sd of [0, 1]) { const sg = sd ? 1 : -1, e = edgeAt(i, sd), bar = sd ? T.br[i] : T.bl[i];
    for (let k = 0, o = e + 0.6; o < bar - 0.3; k++, o += 1.1) { const t = (hsh(i * 2 + sd, k) - 0.5) * T.ds, oo = o + 0.5 * (hsh(k + 7, i * 2 + sd) - 0.5);
      pts.push([T.px[i] + T.tx[i] * t + T.nx[i] * sg * oo, T.pz[i] + T.tz[i] * t + T.nz[i] * sg * oo, i]); } }
  for (const Rg of T.rings) if (Rg.zr > 0) for (let k = 0; k < 144; k++) for (let j = 0, rr = Rg.rs + 0.6; rr < Rg.zr - 0.3; j++, rr += 0.9) { const a = (k + hsh(k, j)) / 144 * 2 * Math.PI, r2 = rr + 0.4 * (hsh(j, k) - 0.5); pts.push([Rg.x + Math.cos(a) * r2, Rg.z + Math.sin(a) * r2, -1]); }
  const cnt = [0, 0, 0, 0], ex = []; let n = 0, nZ = 0, bad = 0, near = 0, amb = 0, hsMax = 0, hsN = 0;
  if (cls && rings.every(Boolean)) for (const [x, z, i] of pts) {
    const hint = i >= 0 ? i : T.nearestIdx(x, z), q = T.query(x, z, hint, {}); if (q.deep) continue;
    if (Math.abs(q.d) <= Math.max(edgeAt(q.a, q.d > 0 ? 1 : 0), edgeAt(Math.min(T.N - 1, q.a + 1), q.d > 0 ? 1 : 0)) + 0.3) continue;   // (the road's own surface, its sidewalks: not the run-off)
    const zk = T.rings.findIndex(Rg => Rg.zr > 0 && (x - Rg.x) ** 2 + (z - Rg.z) ** 2 < Rg.zr * Rg.zr); let ref, nb;
    if (zk >= 0) { const g = R.rings[zk], A = rings[zk], gn = g.n, fx = (x - g.x) / R.cell + (gn - 1) / 2, fy = (z - g.z) / R.cell + (gn - 1) / 2;
      if (Math.hypot(x - T.rings[zk].x, z - T.rings[zk].z) < T.rings[zk].rs + 0.5) continue;   // (the solid island)
      ref = A[Math.round(fy) * gn + Math.round(fx)]; nb = nearB(A, gn, gn, fx, fy, ref); }
    else { if (i < 0) continue; const v = inv(x, z, hint); if (!v || v.amb) { amb++; continue; }
      const sd = v.d > 0 ? 1 : 0, bar = lerp(sd ? T.br[v.a] : T.bl[v.a], sd ? T.br[v.a + 1] : T.bl[v.a + 1], v.u);
      if (Math.abs(v.d) <= Math.max(edgeAt(v.a, sd), edgeAt(v.a + 1, sd)) + 0.3 || Math.abs(v.d) > bar - 0.3) continue;
      const fx = v.f * R.per, fy = v.d / R.cell + (R.nd - 1) / 2; if (fy < 0 || fy > R.nd - 1) continue;
      ref = cls[Math.round(fy) * Cn + Math.round(fx)]; nb = nearB(cls, Cn, R.nd, fx, fy, ref);
      const o = {}, hs = T.hs(q, o); if (o.a >= 0) { hsMax = Math.max(hsMax, Math.abs(hs / T.ds - v.f) * T.ds); hsN++; } }
    if (nb) { near++; continue; }
    n++; if (zk >= 0) nZ++; cnt[ref]++;
    const Rz = zk >= 0 ? T.rings[zk] : null, tall = Rz && Rz.tall && Math.hypot(x - Rz.x, z - Rz.z) < Rz.ie, want = tall ? (ref === 2 ? 9 : -1) : SF[ref];   // (a tall island's grass: TALL, 9; drawn there as anything but grass: wrong)
    const sf = T.surface(q); if (sf !== want) { bad++; if (ex.length < 6) ex.push(`(${x.toFixed(1)}, ${z.toFixed(1)})${zk >= 0 ? ' ring ' + zk : ' d ' + (q.s - T.startS).toFixed(0) + ' ' + q.d.toFixed(2)}: ${NM[ref]} -> ${sf}`); } }
  const sh = cnt.map(v => v / Math.max(1, n)), pct = (v) => (100 * v).toFixed(1) + ' %';
  check('run-off: Track.surface over a grid of points all over it is the track file\'s class there (a reference decoder, an inversion of its own, the nearest texel; asphalt and paving drive as asphalt, grass as grass (on a ring\'s tall island as its tall grass), gravel as makadam) but within 0.6 m of a class boundary',
    n > 15000 && nZ > 2000 && bad === 0, `${n} points (${nZ} in the rings' zones), ${bad} not${ex.length ? ' (' + ex.join('; ') + ')' : ''}; ${near} within 0.6 m of a boundary, ${amb} on a fold left out; Track.hs within ${(hsMax * 100).toFixed(1)} cm of the inversion (${hsN} points)`);
  check('run-off: as it is, not all asphalt (asphalt and grass each at least 10 % of the points, paving and gravel there too)', sh[0] >= 0.1 && sh[2] >= 0.1 && cnt[1] > 0 && cnt[3] > 0,
    `asphalt ${pct(sh[0])}, paving ${pct(sh[1])}, grass ${pct(sh[2])}, gravel ${pct(sh[3])}`);
  let pvBad = 0, pvSum = 0, pvN = 0, pvOff = 0; const pvEx = [];
  if (T.roPv) for (let i = 0; i < T.N; i++) for (const sd of [0, 1]) { const e = edgeAt(i, sd), b = sd ? T.br[i] : T.bl[i], p = T.roPv[sd][i], sg = sd ? 1 : -1, grav = T.sf && T.sf[i] === 5; if (p < e - 1e-3 || p > Math.max(e, b) + 1e-3) pvBad++; pvSum += p - e;
    if (cls) for (let o = e + 0.25; o <= p - 0.25 + 1e-6; o += 0.25) { const x = T.px[i] + T.nx[i] * sg * o, z = T.pz[i] + T.nz[i] * sg * o, zk = T.rings.findIndex(Rg => Rg.zr > 0 && (x - Rg.x) ** 2 + (z - Rg.z) ** 2 < Rg.zr * Rg.zr); let ref, nb;
      if (zk >= 0) { const g = R.rings[zk], gn = g.n, fx = (x - g.x) / R.cell + (gn - 1) / 2, fy = (z - g.z) / R.cell + (gn - 1) / 2; ref = rings[zk][Math.round(fy) * gn + Math.round(fx)]; nb = nearB(rings[zk], gn, gn, fx, fy, ref); }
      else { const fx = i * R.per, fy = sg * o / R.cell + (R.nd - 1) / 2; ref = cls[Math.round(fy) * Cn + fx]; nb = nearB(cls, Cn, R.nd, fx, fy, ref); }
      pvN++; if (!nb && ref > 1 && !(grav && ref === 3)) { pvOff++; if (pvEx.length < 4) pvEx.push(`d ${(i * T.ds - T.startS).toFixed(0)} ${sd ? 'right' : 'left'} ${o.toFixed(2)}: ${NM[ref]}`); } } }
  check('run-off: the paved part the AI keeps to (Track.roPv) lies between the road\'s edge and the barrier on each side, and the track file has it paved (asphalt or paving; beside the castle road its gravel too) but within 0.6 m of a boundary',
    !!T.roPv && pvBad === 0 && pvOff === 0 && pvN > 1000, T.roPv ? `${pvBad} out of range, on average ${(pvSum / 2 / T.N).toFixed(2)} m paved past the edge; ${pvOff} of ${pvN} points inside it not paved${pvEx.length ? ' (' + pvEx.join('; ') + ')' : ''}` : 'none');
  // the raster is the one made for this route (roSurf.hash: Track._roHash, the centre line, normals, edges, barrier and rings to the cm): one made for
  // another (the same N, a barrier moved) is left out, the run-off as without it; the atlas is made when first asked for (a track the menu's list
  // builds keeps none)
  { const fresh = new C.Track(def), lazy = fresh._roM === undefined, built = !!fresh.roM, stale = new C.Track(Object.assign({}, def, { roSurf: Object.assign({}, R, { hash: 'x' }) }));
    check('run-off: the raster made for this route (def.roSurf.hash = Track._roHash; one for another route left out: the run-off as without it), the atlas made only when first asked for',
      !!R && R.hash === T._roHash() && lazy && built && stale.roM === null && stale.roPv === null, `hash ${R ? R.hash : '-'} / ${T._roHash()}; lazy ${lazy}, then built ${built}; another route's: ${stale.roM === null ? 'left out' : 'used'}`); }
  // what World draws on the run-off's ground of its own drives as it looks (rosurf.py writes it into the raster as drawn): the side roads' footprints
  // (Track.stubs, 0.5 m inside their edges: asphalt, a gravel one makadam), the oncoming lanes (def.altDn, 0.6 m inside: asphalt) and the splitter
  // islands between them and the route (World's quads: asphalt, as they drove before the run-off had its surfaces)
  { const want = [], HW = def.altHw || 2.4, WA = T.wa || new Float64Array(T.N).fill(T.w), inRun = (x, z, hint) => { const q = T.query(x, z, hint, {}); if (q.deep || q.over) return null;
      const zk = T.rings.findIndex(Rg => Rg.zr > 0 && (x - Rg.x) ** 2 + (z - Rg.z) ** 2 < Rg.zr * Rg.zr);
      if (zk >= 0) { const Rg = T.rings[zk], dd = Math.hypot(x - Rg.x, z - Rg.z); return dd > Rg.r + Rg.hw + 0.5 && dd < Rg.zr - 0.5 && Math.abs(q.d) > edgeAt(q.a, q.d > 0 ? 1 : 0) + 0.5 ? q : null; }
      return Math.abs(q.d) > Math.max(edgeAt(q.a, q.d > 0 ? 1 : 0), edgeAt(Math.min(T.N - 1, q.a + 1), q.d > 0 ? 1 : 0)) + 0.5 && Math.abs(q.d) < (q.d > 0 ? q.br : q.bl) - 0.3 ? q : null; };
    const lanes = (def.altDn || []).map(A => { const L = []; for (let k = 0; k + 2 < A.P.length; k += 3) L.push([A.P[k], A.P[k + 1]]); return L; }), onLane = (x, z) => lanes.some(L => L.some((p, k) => k && (() => { const a = L[k - 1], dx = p[0] - a[0], dz = p[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) < HW + 0.6; })()));
    const onPaved = (x, z) => (T.stubs || []).some(S => { if (S.grav) return false; const F = {}; for (let t = 0; t <= S.Lend; t += 0.5) { const p = T.stubPt(S.k, t, F); if (Math.hypot(x - p.x, z - p.z) < (t < S.te ? T.stubHw(S, t) : Math.min(T.stubHw(S, t), S.hw)) + 0.6) return true; } return false; });   // (a gravel road's mouth shared with a paved one: asphalt)
    const sHw = (S, t) => t < S.te ? T.stubHw(S, t) : Math.min(T.stubHw(S, t), S.hw);   // (a kerb return narrower than the raster's 0.5 m cells, the half width jumping by over 1 m within 0.5 m: left out)
    for (const S of T.stubs || []) { const F = {}; for (let t = 0; t <= S.Lend; t += 0.5) { const p = T.stubPt(S.k, t, F), hw = sHw(S, t) - 0.5; if (hw < 0.3 || Math.abs(sHw(S, t + 0.5) - sHw(S, t)) > 1 || (t >= 0.5 && Math.abs(sHw(S, t - 0.5) - sHw(S, t)) > 1)) continue;
      for (const u of [-hw, 0, hw]) { const x = p.x - p.tz * u, z = p.z + p.tx * u; if (inWinT(x, z)) continue; const q = inRun(x, z, T.stubHint(S.k, t)); if (q && !(S.grav && (onLane(x, z) || onPaved(x, z)))) want.push(['side road ' + S.k, q, S.grav ? 5 : 0]); } } }   // (p10: none in a window)
    for (const L of lanes) for (let k = 1; k < L.length; k++) { const a = L[k - 1], b = L[k], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
      for (let f = 0; f < l; f += 1) for (const o of [-(HW - 0.6), 0, HW - 0.6]) { const x = a[0] + dx * f / l - dz / l * o, z = a[1] + dz * f / l + dx / l * o; if (inWinT(x, z)) continue; const q = inRun(x, z, T.nearestIdx(x, z)); if (q) want.push(['lane', q, 0]); } }
    let nIsl = 0; if (!def.splitIsl) for (const AL of def.altDn || []) { const L = []; for (let k = 0; k + 2 < AL.P.length; k += 3) L.push([AL.P[k], AL.P[k + 1]]); const n = L.length, QS = {};   // (World.buildMedvode's islands: where the lane runs 0.4-10 m off the route's asphalt near a ring)
      const nrm = L.map((p, k) => { const a = L[Math.max(0, k - 1)], b = L[Math.min(n - 1, k + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
      const rows = L.map(([x, z], k) => { if (!(def.rings || []).some(r => Math.hypot(x - r.c[0], z - r.c[1]) < r.r + 45 && Math.hypot(x - r.c[0], z - r.c[1]) > r.r + (r.hw || 2.9) + 0.7)) return null;
        const q = T._qMain(x, z, T.nearestIdx(x, z), QS); if (q.over) return null; const sd = q.d > 0 ? 1 : -1, gap = Math.abs(q.d) - WA[q.a] - HW; if (gap < 0.4 || gap > 10) return null;
        const [nx, nz] = nrm[k], toR = (q.nx * nx + q.nz * nz) * sd > 0 ? -1 : 1;
        return { a: [x + nx * toR * (HW + 0.05), z + nz * toR * (HW + 0.05)], b: [q.x - q.nx * sd * (Math.abs(q.d) - WA[q.a] - 0.05), q.z - q.nz * sd * (Math.abs(q.d) - WA[q.a] - 0.05)], i: q.a }; });
      for (let k = 0; k + 1 < n; k++) { const P = rows[k], Q = rows[k + 1]; if (!P || !Q || Math.abs(P.i - Q.i) > 4) continue; nIsl++;
        for (const [u, v] of [[0.5, 0.5], [0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]]) { const x = (P.a[0] * (1 - u) + P.b[0] * u) * (1 - v) + (Q.a[0] * (1 - u) + Q.b[0] * u) * v, z = (P.a[1] * (1 - u) + P.b[1] * u) * (1 - v) + (Q.a[1] * (1 - u) + Q.b[1] * u) * v;
          const q = T.query(x, z, P.i, {}); if (!q.deep && Math.abs(q.d) > edgeAt(q.a, q.d > 0 ? 1 : 0) + 0.3) want.push(['island', q, 0]); } } }
    const inPolyT = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 2; i < P.length; j = i, i += 2) if ((P[i + 1] > z) !== (P[j + 1] > z) && x < (P[j] - P[i]) * (z - P[i + 1]) / (P[j + 1] - P[i + 1]) + P[i]) c = !c; return c; };
    const dEdge = (P, x, z) => { let d = 1e9; for (let i = 0, j = P.length - 2; i < P.length; j = i, i += 2) { const ax = P[j], az = P[j + 1], dx = P[i] - ax, dz = P[i + 1] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1e-9))); d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return d; };
    for (const F of def.splitIsl || []) { const P = Array.isArray(F) ? F : F.p; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let k = 0; k + 1 < P.length; k += 2) { x0 = Math.min(x0, P[k]); x1 = Math.max(x1, P[k]); z0 = Math.min(z0, P[k + 1]); z1 = Math.max(z1, P[k + 1]); } nIsl++;   // (the track file's own islands: grass, flush; 0.6 m inside their outline)
      for (let x = x0; x <= x1; x += 0.7) for (let z = z0; z <= z1; z += 0.7) if (inPolyT(P, x, z) && dEdge(P, x, z) > 0.6) { const q = T.query(x, z, T.nearestIdx(x, z), {}); if (!q.deep && Math.abs(q.d) > edgeAt(q.a, q.d > 0 ? 1 : 0) + 0.3) want.push(['island', q, 2]); } }
    const cnt = {}, bad = {}, ex = []; for (const [k, q, sf] of want) { const kk = k.startsWith('side') ? (sf ? 'gravel side roads' : 'side roads') : k + 's'; cnt[kk] = (cnt[kk] || 0) + 1; const got = T.surface(q);
      if (got !== sf) { bad[kk] = (bad[kk] || 0) + 1; if (bad[kk] <= 3) ex.push(`${k} (${q.x.toFixed(1)}, ${q.z.toFixed(1)}) d ${(q.s - T.startS).toFixed(0)}: ${got} not ${sf}`); } }   // (the first three of each kind)
    const nb = Object.values(bad).reduce((a, b) => a + b, 0);
    check('run-off: what World draws on it of its own drives as it looks: the side roads\' mouths (asphalt, a gravel one makadam), the oncoming lanes (asphalt) and the islands (World\'s own between the lanes and the route: asphalt as before; the track file\'s def.splitIsl: grass, flush)',
      (cnt['side roads'] || 0) > 500 && (cnt.lanes || 0) > 200 && (cnt.islands || 0) > 50 && nb === 0, `points ${JSON.stringify(cnt)} (${nIsl} ${def.splitIsl ? 'islands of the track file' : 'island quads'}), not as drawn ${JSON.stringify(bad)}${ex.length ? ': ' + ex.join('; ') : ''}`); }
}

// 12. r9, the islands (the user: "all islands grass, the signs on them knocked down"; a ring's island "dense tall grass instead of the sand", "you must go
// round the roundabout, but you can cut it across the grass: the barrier only in its middle", "the tyres up to its middle"): the engine's rules, on the track
// file's own (def.rings isl 'tall' / mid, def.splitIsl) or, with a file without them yet, on its rings made tall here (mid 1.6 m, Na klancu's 2 m)
{
  const tallData = (def.rings || []).some(r => r.isl === 'tall');
  const defT = tallData ? def : Object.assign({}, def, { rings: def.rings.map(r => Object.assign({}, r, { isl: 'tall', mid: r.r > 18 ? 2 : 1.6 })) }), TT = tallData ? T : new C.Track(defT);
  const rc = new C.Race(TT, opts({ numAI: 0, playerGrid: 1, tt: true, damage: 0 })), P = rc.player; Math.random = seeded(3); rc.start(); Math.random = orig; rc.state = 'racing'; P.locked = false;
  const push = (x, z, h, fx, fz) => { P.x = x; P.z = z; P.h = h; P.px = fx != null ? fx : x; P.pz = fz != null ? fz : z; P.vx = P.vz = P.w = 0; P.q.i = TT.nearestIdx(x, z); C.wallCollide(P, TT, true); return Math.hypot(P.x - x, P.z - z); };
  const nearWall = (R, x, z, m) => R.shut.some(S => { const dx = x - R.x, dz = z - R.z; return dx * S.ux + dz * S.uz > R.rs - 1 && Math.abs(-dx * S.uz + dz * S.ux) < m; });
  // (a) drivable: a car anywhere on the island (its middle from the middle's tyres + 1.6 m out to 0.6 m inside the edge; not across a wall) stands free, on the tall
  // grass (Track.surface 9), its wheels on grass to the rest of the game (Car.ws 2: the sound, the marks, the dirt, the commentator, the network)
  const free = [], wsTxt = []; let nPt = 0, nFree = 0, n9 = 0, wsOk = 0, wsN = 0;
  for (const R of TT.rings) { if (!R.tall) continue;
    for (let k = 0; k < 24; k++) { const a = k / 24 * 2 * Math.PI;
      for (const rr of [R.mid + 1.6, (R.mid + R.ie) / 2, R.ie - 0.6]) { const x = R.x + Math.cos(a) * rr, z = R.z + Math.sin(a) * rr; if (nearWall(R, x, z, 2.7)) continue; nPt++;
        const pz = push(x, z, a + Math.PI / 2); if (pz < 0.01) nFree++; else if (free.length < 4) free.push(`${Math.round(R.x)},${Math.round(R.z)} r ${rr.toFixed(1)}: pushed ${pz.toFixed(2)} m`);
        if (TT.surface(TT.query(x, z, TT.nearestIdx(x, z), {})) === 9) n9++;
        if (k % 6 === 0 && rr === (R.mid + R.ie) / 2) { P.place(x, z, a + Math.PI / 2); P.q = TT.query(x, z, TT.nearestIdx(x, z), P.q); P.y = P.py = TT.yAt(P.q); P.roadY = P.y; P.vx = P.vz = 0; P.step(DT, TT); wsN++; if (P.ws.every(v => v === 2)) wsOk++; else if (wsTxt.length < 3) wsTxt.push(P.ws.join('')); } } } }
  check('islands: every ring\'s island is dense tall grass a car may drive across (def.rings isl \'tall\'): nothing in the way on it but its middle and the walls, Track.surface the tall grass (9) all over it, the car\'s wheels on grass to the rest of the game (ws 2)',
    TT.rings.length === 4 && TT.rings.every(R => R.tall) && nPt > 150 && nFree === nPt && n9 === nPt && wsN >= 12 && wsOk === wsN,
    `${tallData ? 'the track file\'s islands' : 'the rings made tall here (the track file has none yet)'}: ${nFree} of ${nPt} points free${free.length ? ' (' + free.join('; ') + ')' : ''}, ${n9} on the tall grass; wheels on grass ${wsOk} of ${wsN}${wsTxt.length ? ' (' + wsTxt.join(', ') + ')' : ''}; mid ${TT.rings.map(R => R.mid).join(', ')} m, the grass out to ${TT.rings.map(R => R.ie.toFixed(2)).join(', ')} m`);
  // (b) slower: on the flat test plane a car coasting from 60 km/h for 2 s, on asphalt, the verge's grass and the tall grass; and one held at full throttle
  { const H = require('./lib/handling.js')(C), coast = (sf, thr) => { H.surf(sf); const c = H.mkCar('rally', { v: 60 }); for (let i = 0; i < 2 * 120; i++) H.step(c, { st: 0, thr }); H.surf(0); return Math.hypot(c.vx, c.vz) * 3.6; };
    const v = [0, 2, 9].map(sf => coast(sf, 0)), vt = [0, 2, 9].map(sf => coast(sf, 1));
    check('islands: the tall grass holds a car back harder than the verge\'s grass (coasting from 60 km/h for 2 s, and at full throttle), the grass harder than asphalt',
      v[2] < v[1] - 3 && v[1] < v[0] - 3 && vt[2] < vt[1] - 2 && vt[1] < vt[0], `coasting: asphalt ${v[0].toFixed(1)}, grass ${v[1].toFixed(1)}, tall grass ${v[2].toFixed(1)} km/h; full throttle: ${vt.map(x => x.toFixed(1)).join(', ')} km/h`); }
  // (c) the middle holds: a car put down on it (any heading, its middle up to the middle's radius off) is pushed clear; one driven at it head-on or sliding into it broadside
  // is stopped against it (its body never over it: the car's circles, not only its corners)
  const mid = [], drive = [];
  for (const R of TT.rings) { if (!R.tall) continue; let least = 1e9;
    for (const h of [0, 1, 2]) for (const o of [0, 0.6, 1.2]) least = Math.min(least, push(R.x + o, R.z, h));
    mid.push(least);
    for (const [hd, back] of [[0, 4.6], [Math.PI / 2, 2.6], [0.4, 3.9]]) {   // (head-on along +x; broadside: heading +z, sliding along +x; at an angle; the car's body back m from the middle's edge)
      Math.random = seeded(9); const r2 = new C.Race(TT, opts({ numAI: 0, playerGrid: 1, tt: true, damage: 0 })), Q = r2.player; r2.start(); Math.random = orig; r2.state = 'racing'; Q.locked = false;
      const x0 = R.x - (R.mid + back), z0 = R.z; Q.place(x0, z0, hd); Q.q = TT.query(x0, z0, TT.nearestIdx(x0, z0), Q.q); Q.y = Q.py = TT.yAt(Q.q); Q.roadY = Q.y; Q.vx = 9; Q.vz = 0; Q.w = 0;
      let near = 1e9; for (let k = 0; k < 120 * 2; k++) { Q.inThr = 0; Q.inBrk = 0; Q.inSteer = 0; r2.step(DT); for (const ci of Q.circles) near = Math.min(near, Math.hypot(Q.x + Math.cos(Q.h) * ci - R.x, Q.z + Math.sin(Q.h) * ci - R.z) - Q.rad); }
      drive.push([Math.round(R.x), hd, near - R.mid]); } }
  check('islands: the only solid thing on a ring\'s island is its middle (the stone in its ring of tyres, R.mid across): a car put down on it is pushed clear, one driven at it head-on, at an angle or sliding into it broadside at 9 m/s is stopped against it (its body never more than 0.3 m into it)',
    mid.length === 4 && mid.every(v => v > 0.5) && drive.length === 12 && drive.every(([, , n]) => n > -0.3),
    `pushed clear by at least ${mid.map(v => v.toFixed(1)).join(', ')} m; driven at it: ${drive.map(([x, h, n]) => `${x} ${h === 0 ? 'head-on' : h > 1 ? 'broadside' : 'angle'} ${n.toFixed(2)} m`).join(', ')} (its body's nearest to the middle's edge)`);
  // (d) the walls across the closed sides run from the middle out past the zone's circle (the user: "the tyres up to the middle"): a car crossing one is stopped on the
  // island (near the middle, halfway out), on the ring's road and out by the zone's circle; and the fence's run of it starts at the middle
  const FRT = TT.fenceRuns(), wl = [];
  for (const R of TT.rings) for (const S of R.shut) { const run = FRT.runs.find(w => w.shut && TT.rings[w.ref] === R), a0 = run ? Math.hypot(run.pts[0] - R.x, run.pts[1] - R.z) : 1e9;
    const st = [R.mid + 0.8, (R.mid + R.ie) / 2, R.r, R.zr - 1].map(t => { const x = R.x + S.ux * t, z = R.z + S.uz * t; return push(x - S.uz * 0.1, z + S.ux * 0.1, Math.atan2(S.uz, S.ux) + Math.PI / 2, x + S.uz * 1.5, z - S.ux * 1.5); });
    wl.push({ x: Math.round(R.x), r0: S.r0, r1: S.r1, a0, st }); }
  check('islands: the walls across the closed sides (rings[].shut) run from the middle (R.mid) out past the zone\'s circle: a car crossing one is stopped on the island by its middle, halfway out, on the ring\'s road and by the zone\'s circle; the fence\'s run starts at the middle',
    wl.length === 3 && wl.every(w => { const R = TT.rings.find(Q => Math.round(Q.x) === w.x); return w.r0 <= R.mid && w.st.every(v => v > 0.2) && w.a0 < R.mid + 0.1 && w.r1 > R.zr + 10; }),
    wl.map(w => `ring ${w.x}: the wall ${w.r0.toFixed(1)}-${w.r1.toFixed(1)} m, its fence from ${w.a0.toFixed(2)} m, a car pushed back ${w.st.map(v => v.toFixed(2)).join(' / ')} m`).join('; '));
  // (e) the other islands (def.splitIsl: the rings' splitter islands, Smlednik's corner lenses, Gorenjska's medians): flush with the ground the cars drive on (Track.yAt
  // steps under 3 cm across their outline; no barrier on them), grass where the run-off's surfaces are (Track.surface 2)
  if (def.splitIsl) { let n = 0, pushed = 0, grass = 0, step = 0; const why = [], wf = T.wallFree(0.3);
    const inPolyF = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 2; i < P.length; j = i, i += 2) if ((P[i + 1] > z) !== (P[j + 1] > z) && x < (P[j] - P[i]) * (z - P[i + 1]) / (P[j + 1] - P[i + 1]) + P[i]) c = !c; return c; };
    const dEdgeF = (P, x, z) => { let d = 1e9; for (let i = 0, j = P.length - 2; i < P.length; j = i, i += 2) { const ax = P[j], az = P[j + 1], dx = P[i] - ax, dz = P[i + 1] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1e-9))); d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return d; };
    for (const F of def.splitIsl) { const Pp = Array.isArray(F) ? F : F.p, m = Pp.length / 2;
      for (let k = 0; k < m; k += 3) { const x = Pp[2 * k], z = Pp[2 * k + 1], j = (k + 1) % m, dx = Pp[2 * j] - x, dz = Pp[2 * j + 1] - z, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
        const yo = (o) => T.yAt(T.query(x + nx * o, z + nz * o, T.nearestIdx(x, z), {})), ya = yo(0.5), yb = yo(-0.5), sl = (yo(1.5) - yo(-1.5)) / 3;   // (p10: a step, not the ground's own slope: the jump across the outline against the slope either side of it)
        n++; if (Math.abs(ya - yb - sl) > 0.03) { step++; if (why.length < 3) why.push(`(${x.toFixed(1)}, ${z.toFixed(1)}) ${(ya - yb - sl).toFixed(3)} m`); }
        if (!(wf.route(x, z, 0) || wf.ring(x, z, -1))) pushed++; } }
    const inner = (F) => { const Pp = Array.isArray(F) ? F : F.p; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, best = null, bd = -1; for (let k = 0; k + 1 < Pp.length; k += 2) { x0 = Math.min(x0, Pp[k]); x1 = Math.max(x1, Pp[k]); z0 = Math.min(z0, Pp[k + 1]); z1 = Math.max(z1, Pp[k + 1]); }
      for (let x = x0; x <= x1; x += 0.25) for (let z = z0; z <= z1; z += 0.25) { if (!inPolyF(Pp, x, z)) continue; const d = dEdgeF(Pp, x, z); if (d > bd) { bd = d; best = [x, z]; } } return best; };   // (the point deepest inside it)
    for (const F of def.splitIsl) { const pI = inner(F); if (pI && T.surface(T.query(pI[0], pI[1], T.nearestIdx(pI[0], pI[1]), {})) === 2) grass++; }
    check('islands: the other islands (def.splitIsl: splitter islands, corner lenses, medians) are grass flush with the ground the cars drive on: no step across their outline (Track.yAt within 3 cm over a metre, past the ground\'s own slope), inside the cars\' free ground (no barrier on them), grass at the point deepest inside each (Track.surface 2)',
      n > 20 && step === 0 && pushed === 0 && grass === def.splitIsl.length, `${def.splitIsl.length} islands: ${step} steps of ${n} points round them${why.length ? ' (' + why.join('; ') + ')' : ''}, ${pushed} outside the free ground, grass in ${grass} of them`); }
  else check('islands: the other islands are World\'s own between the lanes and the route (this track file has no def.splitIsl): as before', !def.splitIsl);
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
