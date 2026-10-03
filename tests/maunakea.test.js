// Mauna Kea: an open road with four ways to drive it on one card, as Vršič (def.modes: the race, the time trial, the duel in the traffic and the
// run from the police). The road: the real line of the summit road's paved upper part (the island of Hawaiʻi), at full scale and no longer than
// 8 km: from the end of the gravel (~3,600 m) past the road to the radio antenna, the Lake Waiau trailhead and the foot of Puʻu Haukea, through
// the first hairpin at the fork and the second one, round the summit cone Puʻu Wēkiu to the summit ridge (~4,200 m): the bends in their real
// order, each the way it really turns; the asphalt from below the start to the finish (def.paved), the gravel below it and past it. The side
// roads where the real ones meet it (the antenna's road on the right, the fork's other branch and the ridge's road on the left): a car driven
// into one meets no wall until the rail at its end. Its scenery data as the world builder reads it (the terrain's rows, the land cover, the
// observatories without names, the car parks beside the road). The open road's traffic is its own mix (4x4s, vans, minibuses, the
// observatories' pickups; few motorbikes). A whole race up to the top, dry and in the rain (12 AI + the player on autopilot): every car
// finishes and pulls up in its own slot past the line; a whole duel in the traffic; the run from the police; the medal times.
//   node tests/maunakea.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
const Lang = require(path.join(ROOT, 'js', 'lang.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'maunakea'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const orig = Math.random;

// 1. the track: an open road, four ways to drive it, its checkpoints and climb; at full scale, at most 8 km; not a round of the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 11 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 5.5,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from the end of the gravel (~3,600 m) to the summit ridge (~4,200 m), 5.6-5.9 km (at most 8 km)', Math.abs(def.alt[0] - 3599) < 15 && Math.abs(def.alt[1] - 4197) < 15 && T.raceLen > 5600 && T.raceLen < 5900 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: the name is the place and the country (Mauna Kea, ZDA; Mauna Kea, USA), not in the big championship', def.name === 'Mauna Kea, ZDA' && def.en.name === 'Mauna Kea, USA' && !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('maunakea'), def.name);

// 2. the bends: in order up the road, each a real bend of the line the way its sign says; the two hairpins (150 degrees and more: the first at the
// fork, a right; the second a left), the S-bends below the antenna (right, left, right); their altitudes as the road's own; the HUD's places
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 40), b = T.idx(T.startS + d + 40); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 100), bends = turn.every((a, k) => Math.abs(a) > 0.6 && Math.sign(a) === cv[k][2]);
  const hair = cv.filter((c, k) => Math.abs(turn[k]) > 2.6), own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('bends: 8 with chevrons, in order up the road, each the way its sign says; two hairpins (the first a right at ~3.9 km, the second a left at ~4.7 km), the S-bends right-left-right below the antenna',
    cv.length === 8 && order && bends && own && hair.length === 2 && hair[0][2] === 1 && hair[1][2] === -1 && Math.abs(hair[0][0] - 3886) < 40 && Math.abs(hair[1][0] - 4693) < 40 && cv.slice(0, 3).map(c => c[2]).join() === '1,-1,1' && cv[2][0] < 934,
    `turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}, at ${cv.map(c => c[0]).join(' ')} m`);
  // the grades: the road climbing all the way to the finish, nowhere steeper than ~15 %, ~10 % on average; the flat stretch below the fork
  let gmax = 0, gmin = 1; for (let i = T.startIdx; i < T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  const avg = (T.hFinish - T.hStart) / T.raceLen;
  check('grades: climbing all the way (never down), nowhere steeper than ~15 %, ~10 % on average, ~600 m of climb', gmax < 0.152 && gmin > -0.01 && avg > 0.09 && avg < 0.115 && T.hFinish - T.hStart > 560,
    `steepest ${(gmax * 100).toFixed(1)} %, average ${(avg * 100).toFixed(1)} %, climb ${Math.round(T.hFinish - T.hStart)} m`);
  const N = T.names, nm = N.map(q => q.n);
  check('places: in order up the road (the antenna, Lake Waiau, Puʻu Haukea, hairpins 1 and 2, Puʻu Wēkiu, the summit ridge at the finish), each with the commentator\'s lines',
    N.every((q, k) => !k || q.d > N[k - 1].d) && N.every(q => q.say && q.say.length) && ['Radijska antena', 'Jezero Waiau', 'Puʻu Haukea', 'Puʻu Wēkiu'].every(x => nm.includes(x)) && nm.filter(x => /^Serpentina [12] · \d\.\d{3} m$/.test(x)).length === 2 &&
    /^Vrhnji greben · 4\.\d{3} m$/.test(nm[nm.length - 1]) && N[N.length - 1].d > T.raceLen - 30, nm.join(' | '));
  Lang.set('en');
  const en = N.map(q => Lang.place(q.n)); Lang.set('sl');
  check('places: in English on the HUD (Radio Antenna, Lake Waiau, Hairpin 1 · 4,035 m, Summit Ridge · 4,197 m; the Hawaiian names as they are)', en.includes('Radio Antenna') && en.includes('Lake Waiau') && en.some(x => /^Hairpin 1 · 4,\d{3} m$/.test(x)) && /^Summit Ridge · 4,\d{3} m$/.test(en[en.length - 1]) && en.includes('Puʻu Wēkiu'), en.join(' | '));
}

// 3. the surface: asphalt from below the grid to the finish (def.paved, OpenStreetMap: surface=paved), the gravel below it and on past the finish
{
  const q = {}, at = (d) => { const i = T.idx(T.startS + d); T.query(T.px[i], T.pz[i], i, q); return T.surface(q); };
  const paved = [5, 1000, 3000, 5000, T.raceLen - 10].map(at), grid = at(-100), gravel = [-135, T.raceLen + 60].map(at);
  check('surface: asphalt from below the grid (the whole grid on it) to the finish, the gravel below it (from the visitor station) and on past the finish (the ridge\'s track)',
    def.roadSurface === 'makadam' && paved.every(s => s === 0) && grid === 0 && gravel.every(s => s !== 0) && def.paved[0][0] < -110 && Math.abs(def.paved[0][1] - T.raceLen) < 3,
    `asphalt ${paved.join(',')}, grid ${grid}, gravel ${gravel.join(',')}, paved ${def.paved.map(p => p.map(Math.round).join('..')).join(', ')} m`);
}

// 4. the side roads (def.sideRoads, OpenStreetMap): the road to the radio antenna (right, gravel, a gate), the fork's other branch at the first
// hairpin and the road along the summit ridge (left, paved); driven into one (Core.stubDrive): no wall until the rail at its end, the height
// smooth, the progress pinned at the junction deep in it, turned round, out onto the road again; the cones across it knocked over
{
  const S = T.stubs || [];
  check('side roads: 3 where the real ones meet the road (the antenna\'s road on the right at ~0.9 km, the fork\'s branch on the left at the first hairpin, the ridge\'s road on the left before the finish)',
    S.length === 3 && S[0].side === 1 && S[0].grav && S[0].end === 1 && Math.abs(S[0].s0 - T.startS - 934) < 15 && S[1].side === -1 && Math.abs(S[1].s0 - T.startS - 3921) < 30 && S[2].side === -1 && S[2].s0 - T.startS > 5400 && S[2].s0 < T.finishS,
    S.map(s => `${s.side > 0 ? 'R' : 'L'} ${Math.round(s.s0 - T.startS)} m ${s.ang}° ${s.grav ? 'gravel' : 'paved'}, open ${s.L} m`).join(' | '));
  const res = S.map(St => {
    Math.random = seeded(77);
    const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true })), P = r.player; r.start(); P.locked = false;
    r.setProps(T.stubCones(St.k), null); const cones = r.props.map(b => [b.x, b.z]);
    const back = St.ang > 100, i = T.idx(St.s0 + (back ? 16 : -45)), d = St.side * 2.5;
    P.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i] + (back ? Math.PI : 0)); P.y = P.py = T.hy[i]; P.roadY = P.y; const v0 = back ? 5 : 12; P.vx = Math.cos(P.h) * v0; P.vz = Math.sin(P.h) * v0;
    let ph = back ? 'in' : 'road', tP = 0, wall = 0, wallAt = '', maxDy = 0, py = null, dS = 0, sDeep = null, railHit = 0, outOk = false;
    for (let k = 0; k < 120 * 150 && ph !== 'done'; k++) {
      if (ph === 'road') { C.aiControl(P, r, DT); if (P.speed > 9) { P.inThr = 0; P.inBrk = 0.4; } if (Math.abs(P.q.s - St.s0) < 14) ph = 'in'; }
      else if (ph === 'in') { if (C.stubDrive(P, r, St.k, 1)) { ph = 'rail'; tP = 0; } }
      else if (ph === 'rail') { P.inSteer = 0; P.inThr = 1; P.inBrk = 0; P.inHand = 0; tP += DT; if (tP > 2.5) { ph = 'stop'; tP = 0; } }
      else if (ph === 'stop') { P.inThr = 0; P.inBrk = 0; P.inHand = 1; P.inSteer = 0; tP += DT; if (tP > 1) ph = 'out'; }
      else if (ph === 'out') { if (C.stubDrive(P, r, St.k, -1)) { ph = 'back'; tP = 0; } }
      else if (ph === 'back') { if (C.stubDrive(P, r, St.k, -1)) C.aiControl(P, r, DT); tP += DT; if (P.q.k < 0 && Math.abs(P.q.d) < T.w) { outOk = true; ph = 'done'; } if (tP > 10) ph = 'done'; }
      P.hitWall = 0; r.step(DT); const Q = P.q;
      if (Q.k === St.k) { if (py !== null && !P.air) maxDy = Math.max(maxDy, Math.abs(P.y - py)); }
      py = Q.k === St.k ? P.y : null;
      if (Q.deep) { if (sDeep === null) sDeep = Q.s; dS = Math.max(dS, Math.abs(Q.s - sDeep)); } else sDeep = null;
      if (P.hitWall > 0.3) { if (ph === 'rail' && Q.k === St.k && Q.st > St.L - 6) railHit = Math.max(railHit, P.hitWall); else if (ph !== 'rail') { wall++; wallAt = wallAt || `${ph} t ${Q.k >= 0 ? Q.st.toFixed(0) : '-'}`; } }
    }
    const knocked = r.props.filter((b, k) => Math.hypot(b.x - cones[k][0], b.z - cones[k][1]) > 0.3).length;
    Math.random = orig;
    return { ok: outOk && !wall && maxDy < 0.1 && dS < 1e-6 && railHit > 1 && knocked > 0, txt: `${Math.round(St.s0 - T.startS)} m ${St.side > 0 ? 'R' : 'L'} ${St.ang}°: ${outOk ? 'out' : 'NOT out'}, walls ${wall}${wallAt ? ' (' + wallAt + ')' : ''}, max step ${maxDy.toFixed(3)} m, progress ±${dS.toFixed(3)} m, rail ${railHit.toFixed(1)} m/s, cones ${knocked}/${cones.length}` };
  });
  check('side roads: driven into each: no wall until the rail at its end, the height smooth, the progress pinned at the junction deep in it, the cones knocked over; turned round, out onto the road again',
    res.length === 3 && res.every(x => x.ok), res.map(x => x.txt).join(' | '));
}

// 5. the scenery data (as vrPrep reads it): the terrain rows (one per row of the grid, within it), the land cover's run-length code (exactly its
// cells, classes 0-6: mostly bare cinder), the observatories (plain shapes: no names in the data), the car parks beside the road, the far view
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), res = Buffer.from(D.res, 'base64').length === D.rows.reduce((s, r) => s + r[1], 0);
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('scenery: the terrain rows and residuals, the land cover cell for cell (mostly bare cinder and lava, some built-up round the domes)', rows && res && cells === L.nx * L.nz && maxC <= 6 && cnt[0] > 0.9 * cells && cnt[3] > 0,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: bare ${cnt[0]}, grass ${cnt[1]}, built-up ${cnt[3]}, water ${cnt[5]})`);
  const O = def.obs || [], domes = O.filter(o => o[2] === 0), fin = [T.px[T.finishIdx], T.pz[T.finishIdx]];
  check('scenery: the observatories as plain shapes (domes, buildings, radio dishes, numbers only: no names), most of the domes on the summit ridge round the finish',
    O.length > 25 && O.every(o => o.every(v => typeof v === 'number')) && domes.length >= 7 && domes.filter(o => Math.hypot(o[0] - fin[0], o[1] - fin[1]) < 400).length >= 4 && O.some(o => o[2] === 2 && o[3] > 20),
    `${O.length} shapes: ${domes.length} domes (${domes.filter(o => Math.hypot(o[0] - fin[0], o[1] - fin[1]) < 400).length} by the finish), ${O.filter(o => o[2] === 1).length} buildings, ${O.filter(o => o[2] === 2).length} dishes`);
  const parks = (def.parks || []).filter(([x, z]) => { const q = T.query(x, z, T.nearestIdx(x, z), {}); return Math.abs(q.d) < 40; });
  check('scenery: the car parks beside the road (above the start, at the Lake Waiau trailhead, below the summit), the far view (the flanks, the horizon)', parks.length >= 3 && def.farDem && def.far && def.far.r.length >= 10,
    `${parks.length} car parks by the road`);
  // only place names: no observatory, firm, brand or event anywhere in the track's file; nothing religious
  const src = fs.readFileSync(path.join(ROOT, 'js', 'tracks', 'maunakea.js'), 'utf8');
  check('names: only geographic names in the track\'s file (no observatory, agency, firm, brand or event; nothing religious)', !/keck|subaru|gemini|ukirt|canada|nasa|caltech|university|telescope|smithsonian|maxwell|onizuka|shrine|temple|ahu\b|heiau|protest/i.test(src), '');
}

// 6. the open road's traffic: 4x4s and vans, minibuses and the observatories' pickups, few motorbikes; both ways on their own halves of the road
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const kinds = [0, 1, 2, 3].map(k => tf.veh.filter(v => v.kind === k).length), trucks = tf.veh.filter(v => v.p === 5).length;
  check('traffic: cars and vans both ways, minibuses and pickups too, few motorbikes', tf.veh.length > 10 && kinds[0] > 0 && kinds[1] > 0 && kinds[3] <= kinds[0] && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${kinds[0]} cars, ${kinds[1]} vans, ${kinds[2]} buses, ${kinds[3]} motorbikes, ${trucks} trucks, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
}

// 7. the ways to drive it (and an online race: always the race)
{
  Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line (on the asphalt); online always the race',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5 && -backs[0] > def.paved[0][0] && !net.timeTrial && net.cars.length === 2,
    'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  Math.random = orig;
}

// 8. a whole race up to the summit on autopilot, dry and in the rain: every car finishes, then pulls up in its own slot past the line; the rain slower
{
  const runRace = (rain) => {
    Math.random = seeded(3);
    const r = new C.Race(T, opts({ rain })), P = r.player; r.start();
    let t = 0, k = 0, resc = 0;
    while (t < 600 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }
    Math.random = orig;
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
    const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
    return { fin, slots, resc, win: fin[0] ? fin[0].finishTime : 0, P };
  };
  const dry = runRace(0), wet = runRace(1);
  for (const [nm, R] of [['dry', dry], ['in the rain', wet]]) {
    check(`race ${nm}: all 13 cars reach the summit ridge, then each stops in its own slot past the line (70 m on, 9 m apart, both sides in turn)`,
      R.fin.length === 13 && R.slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
      `${R.fin.length}/13, winner ${R.win.toFixed(1)} s, player ${R.P.finishPos}. (rescues ${R.resc}); ` + R.slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m`).join(' '));
  }
  check('race: slower in the rain than in the dry', wet.win > dry.win * 1.005 && wet.win < dry.win * 1.3, `dry ${dry.win.toFixed(1)} s, wet ${wet.win.toFixed(1)} s`);
}

// 9. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody on foot knocked down, the traffic keeps moving
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
  check('duel: both reach the summit through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
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
    while (t < 600 && !P.finished) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
      if (!Number.isFinite(P.x + P.z)) nan = true;
    }
    Math.random = orig;
    return { seed, st, nan, t, escaped: pol.escaped && !pol.busted && P.finished, busted: pol.busted, at: P.q.s - T.startS };
  });
  check('police: the chase from the start, the escape over the finish on the summit ridge; on autopilot at the easy level it gets away at least once in three; the patrol cars read POLICE',
    def.police.label === 'POLICE' && runs.every(r => r.st.stage === 'chase' && !r.st.chk && !r.st.goal && r.st.chase && !r.nan && (r.escaped || r.busted)) && runs.some(r => r.escaped),
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m`).join('; '));
}

// 11. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
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
