// Mount Baldy: an open road with four ways to drive it on one card, as Vršič (def.modes: the race, the time trial, the duel in the traffic and
// the run from the police). The road: the real line of Mount Baldy Road from the village of Mount Baldy up the San Antonio Canyon, past
// Icehouse Canyon and up the six switchbacks to Manker Flat and the chairlift (~7.2 km, no more than 8 km), the climb from ~1,282 m to
// ~1,917 m with grades of at most ~14 %, the six hairpins in their order up the road and each turning the way the real road does (left,
// right, left, right, left, right), the places for the HUD and the commentator in order up the road, the scenery data (terrain, land cover).
// The side roads (def.sideRoads, as Vršič's): the streets of the village, Glendora Ridge Road, the forest roads and Falls Road where they meet
// the road, the barrier open across their mouths; driven into one and out again. The open road's traffic is its own mix (def.traffic): many
// motorbikes and cyclists, no buses. A whole race to the top (12 AI + the player on autopilot), dry and in the rain: every car finishes and
// pulls up in its own slot past the line; a whole duel in the traffic on autopilot; the run from the police. The medal times of the time
// trial: the stock rally car on the autopilot. Only geographic names.
//   node tests/baldy.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore(), Lang = require(path.join(ROOT, 'js', 'lang.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'baldy'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const orig = Math.random;

// 1. the track: an open road, four ways to drive it, its checkpoints and climb, the real scale (8 km at most); not in the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 12 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 6,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from the village of Mount Baldy (~1,282 m) up to the chairlift (~1,917 m), ~7.2 km in the real scale (no more than 8 km)',
  Math.abs(def.alt[0] - 1282) < 10 && Math.abs(def.alt[1] - 1917) < 10 && T.raceLen > 7000 && T.raceLen <= 8000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm * 1000 - T.raceLen) < 60,
  `${Math.round(T.raceLen)} m (realKm ${def.realKm}), ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('baldy'));

// 2. the shape and the climb: the six hairpins (def.curves) in order up the road, each a turn of 140 degrees and more the way its sign says
// (left, right, left, right, left, right, as the real road), none tighter than ~11 m; the grades (at most ~14.5 %), ~640 m of climb
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 30), b = T.idx(T.startS + d + 30); let t = 0; for (let i = a; i < b; i++) t += T.k[i] * T.ds; return t; });
  check('hairpins: six, in order up the road, each a turn of 140° and more, the way its sign shows: left, right, left, right, left, right',
    cv.length === 6 && cv.every((c, k) => !k || c[0] > cv[k - 1][0]) && cv.map(c => c[2]).join(',') === '-1,1,-1,1,-1,1' && cv.every((c, k) => Math.abs(turn[k]) > 2.44 && Math.sign(turn[k]) === c[2]),
    cv.map((c, k) => `${c[0]} m ${c[2] > 0 ? 'R' : 'L'} ${Math.round(turn[k] * 180 / Math.PI)}° at ${c[1]} m`).join(', '));
  let rmin = 1e9; for (let i = T.startIdx; i < T.finishIdx; i++) if (Math.abs(T.k[i]) > 1e-4) rmin = Math.min(rmin, 1 / Math.abs(T.k[i]));
  const tight = T.corners.filter(c => c.sev >= 2 && c.i0 * T.ds > T.startS && c.i1 * T.ds < T.finishS).length;
  check('bends: twenty tight bends and more, the tightest (the hairpins, opened a little) of a ~11-14 m radius', tight >= 20 && rmin > 10.5 && rmin < 15, `${tight} tight bends, the tightest ${rmin.toFixed(1)} m`);
  let gmax = 0, gmin = 0; for (let i = T.startIdx; i <= T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  const mid = T.altAt(T.hy[T.idx(T.startS + 4300)]);
  check('grades: nowhere steeper than ~14.5 %, a climb of ~640 m (at 4.3 km, among the switchbacks, ~1,640-1,680 m)', gmax < 0.145 && gmin > -0.11 && T.hFinish - T.hStart > 600 && mid > 1630 && mid < 1690,
    `steepest ${(gmax * 100).toFixed(1)} % up, ${(gmin * 100).toFixed(1)} % down, climb ${(T.hFinish - T.hStart).toFixed(0)} m, at 4.3 km ${mid.toFixed(0)} m`);
}

// 3. the places: in order up the road, the commentator's lines for each, the chairlift at the finish; only geographic names (no lodge, resort,
// restaurant or brand), the Slovene labels in English on the HUD
{
  const N = T.names, ok = N.every((q, k) => !k || q.d > N[k - 1].d) && N.every(q => q.say && q.say.length);
  check('places: in order up the road (San Antonio Creek, Icehouse Creek, Icehouse Canyon, the switchbacks, Manker Flat, San Antonio Falls, the chairlift at the finish), each with the commentator\'s lines',
    ok && N.length === 7 && N[0].n === 'San Antonio Creek' && N[2].n === 'Icehouse Canyon' && /^Žičnica · 1\.9\d\d m$/.test(N[N.length - 1].n) && N[N.length - 1].d > T.raceLen - 30 && N[3].d < def.curves[0][0],
    N.map(q => `${q.n}@${Math.round(q.d)}`).join(', '));
  const all = JSON.stringify([def.name, def.en, def.desc, def.escTo, N.map(q => [q.n, q.say]), def.comm, def.police, (def.sideRoads || []).map(r => r[9])]);
  check('names: the track is Mount Baldy, ZDA (USA in English), no lodge, resort, restaurant, ski area or brand anywhere in the names and lines', def.name === 'Mount Baldy, ZDA' && def.en.name === 'Mount Baldy, USA' && !/resort|lodge|notch grill|top of the notch|harley|ducati|honda|yamaha|ranch|cafe|café|inn\b/i.test(all),
    def.name);
  Lang.set('en'); const en = N.map(q => Lang.place(q.n)); Lang.set('sl');
  check('names: the switchbacks and the chairlift in English on the HUD (Switchbacks, Chairlift · 1,917 m)', en[3] === 'Switchbacks' && /^Chairlift · 1,9\d\d m$/.test(en[6]), en.join(' | '));
}

// 4. the scenery data (as vrPrep reads it): the terrain rows (one per row of the grid, within it), the land cover's run-length code (exactly its
// cells, classes 0-5: the chaparral and the woods most of it), the view past the corridor (farDem) round the road
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), res = Buffer.from(D.res, 'base64').length === D.rows.reduce((s, r) => s + r[1], 0);
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  const F = def.farDem, fIn = T.px.every((x, i) => x > F.x0 + 2000 && x < F.x0 + F.cell * (F.nx - 1) - 2000 && T.pz[i] > F.z0 + 2000 && T.pz[i] < F.z0 + F.cell * (F.nz - 1) - 2000);
  check('scenery: the terrain rows and residuals, the land cover (chaparral, woods, rock) cell for cell, the far view round the road', rows && res && cells === L.nx * L.nz && maxC <= 5 && cnt[1] + cnt[2] > 0.8 * cells && cnt[4] > 0 && fIn && Buffer.from(F.b64, 'base64').length === F.nx * F.nz * 2,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: chaparral ${cnt[1]}, woods ${cnt[2]}, rock ${cnt[4]}, built ${cnt[3]}), far ${F.nx}x${F.nz} of ${F.cell} m`);
}

// 5. the side roads (def.sideRoads, Track.stubs): the streets, service roads and forest roads that meet the road; the barriers open across
// their mouths only; driven into one (Core.stubDrive: in to the end, turned round, out): no wall until the rail or the gate, the height smooth,
// the progress pinned at the junction deep in it, no wrong way; out onto the road again
{
  const SR = def.sideRoads, S = T.stubs, named = new Set(S.map(s => s.name).filter(Boolean));
  check('side roads: some 25 of them, in order along the road, both sides, streets, service roads and forest roads (Glendora Ridge Road on the left behind the start, Ice House Canyon Road, Iron Gate Road, Falls Road)',
    S.length >= 25 && SR.every((r, k) => !k || r[0] >= SR[k - 1][0]) && S.every(s => Math.abs(s.side) === 1 && s.Lend >= s.L && s.end >= 0 && s.end <= 2) && S.some(s => s.side < 0) && S.some(s => s.side > 0) &&
    [0, 1, 2].every(k => S.some(s => s.kind === k)) && ['Glendora Ridge Road', 'Ice House Canyon Road', 'Iron Gate Road', 'Falls Road'].every(nm => named.has(nm)) && S.find(s => s.name === 'Glendora Ridge Road').side < 0 && S.find(s => s.name === 'Glendora Ridge Road').s < 0,
    `${S.length} side roads (${S.filter(s => s.side < 0).length} left, ${S.filter(s => s.side > 0).length} right; ${['streets', 'service roads', 'forest roads'].map((w, k) => S.filter(s => s.kind === k).length + ' ' + w).join(', ')}), ${S.filter(s => s.grav).length} gravel`);
  const near = (s) => S.some(x => Math.abs(x.s0 - s) < 90 || Math.abs(x.sF - s) < 90);
  let gaps = 0, stray = 0; for (const G of T.gap) for (let i = 0; i < T.N; i++) if (G[i]) { gaps++; if (!near(i * T.ds)) stray++; }
  check('side roads: the barrier open only across their mouths', gaps > S.length * 3 && !stray, `${gaps} samples of open barrier, ${stray} away from a junction`);
  const pick = [S.find(s => s.name === 'Ice House Canyon Road'), S.find(s => s.name === 'Iron Gate Road' && s.end === 1), S.find(s => s.name === 'Falls Road')];
  const res = pick.map(St => {
    const o2 = Math.random; Math.random = seeded(77);
    const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true })), P = r.player; r.start(); P.locked = false;
    const back = St.ang > 100, i = T.idx(St.s0 + (back ? 16 : -45)), d = St.side * 2.5;
    P.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i] + (back ? Math.PI : 0)); P.y = P.py = T.hy[i]; P.roadY = P.y; const v0 = back ? 5 : 12; P.vx = Math.cos(P.h) * v0; P.vz = Math.sin(P.h) * v0;
    let ph = back ? 'in' : 'road', tP = 0, wall = 0, maxDy = 0, py = null, dS = 0, sDeep = null, wrong = 0, outOk = false, deepest = 0;
    for (let k = 0; k < 120 * 150 && ph !== 'done'; k++) {
      if (ph === 'road') { C.aiControl(P, r, DT); if (P.speed > 9) { P.inThr = 0; P.inBrk = 0.4; } if (Math.abs(P.q.s - St.s0) < 14) ph = 'in'; }
      else if (ph === 'in') { if (C.stubDrive(P, r, St.k, 1)) { ph = 'stop'; tP = 0; } }
      else if (ph === 'stop') { P.inThr = 0; P.inBrk = 0; P.inHand = 1; P.inSteer = 0; tP += DT; if (tP > 1) ph = 'out'; }
      else if (ph === 'out') { if (C.stubDrive(P, r, St.k, -1)) { ph = 'back'; tP = 0; } }
      else if (ph === 'back') { if (C.stubDrive(P, r, St.k, -1)) C.aiControl(P, r, DT); tP += DT; if (P.q.k < 0 && Math.abs(P.q.d) < T.w) { outOk = true; ph = 'done'; } if (tP > 10) ph = 'done'; }
      P.hitWall = 0; const wt0 = P.wrongT; r.step(DT); const Q = P.q;
      if (Q.k === St.k) { deepest = Math.max(deepest, Q.st); if (py !== null && !P.air) maxDy = Math.max(maxDy, Math.abs(P.y - py)); if (P.wrongT > wt0) wrong++; }
      py = Q.k === St.k ? P.y : null;
      if (Q.deep) { if (sDeep === null) sDeep = Q.s; dS = Math.max(dS, Math.abs(Q.s - sDeep)); } else sDeep = null;
      if (P.hitWall > 0.3 && ph !== 'stop') wall++;
    }
    Math.random = o2;
    return { ok: outOk && !wall && maxDy < 0.1 && dS < 1e-6 && !wrong && deepest > St.L - 12, txt: `${St.name} ${Math.round(St.s)} m ${St.side > 0 ? 'R' : 'L'} ${St.ang}°: ${outOk ? 'out' : 'NOT out'}, in to ${deepest.toFixed(0)}/${St.L.toFixed(0)} m, walls ${wall}, max step ${maxDy.toFixed(3)} m, progress ±${dS.toFixed(3)} m, wrong way ${wrong}` };
  });
  check('side roads: driven into one (Ice House Canyon Road, Iron Gate Road, Falls Road) to its end and out again: no wall, the height smooth, the progress pinned at the junction, no wrong way',
    pick.every(Boolean) && res.every(x => x.ok), res.map(x => x.txt).join(' | '));
}

// 6. the traffic of the open road: many motorbikes and cyclists (a favourite climb of both), no buses, both ways on their own half of the road
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0), buses = tf.veh.filter(v => v.kind === 2 && v.p !== 5), trucks = tf.veh.filter(v => v.p === 5), cyc = tf.veh.filter(v => v.kind === 4);
  const sides = tf.veh.filter(v => v.kind !== 4).every(v => v.d * v.dir > 0.3 && Math.abs(v.d) < T.w);
  check('traffic: cars and many motorbikes both ways on their own half of the road, cyclists on the climb, no buses, few trucks',
    bikes.length >= 4 && bikes.length > tf.veh.length * 0.15 && cars.length > bikes.length && !buses.length && trucks.length <= 5 && cyc.length >= 6 && bikes.some(v => v.dir > 0) && bikes.some(v => v.dir < 0) && sides,
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${buses.length} buses, ${trucks.length} trucks, ${bikes.length} motorbikes, ${cyc.length} cyclists`);
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

// 8. a whole race up to the chairlift on autopilot, dry and in the rain: every car finishes, then pulls up in its own slot past the line and
// stays there; the rain slower
{
  const times = [];
  for (const rain of [0, 1]) {
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
    times.push(fin[0] ? fin[0].finishTime : 0);
    check(`race (${w}): all 13 cars reach the chairlift, the player without a rescue`, fin.length === 13 && !resc, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
    const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
    check(`race (${w}): past the line every car stops in its own slot (70 m on, 9 m apart, both sides in turn)`, slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4 && Math.sign(p.d) === (k % 2 ? -1 : 1)),
      slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
  }
  check('race: in the rain the winner slower than in the dry', times[1] > times[0] + 5, times.map(t => t.toFixed(1)).join(' / ') + ' s');
}

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
  check('police: the chase from the start, the escape over the finish at the chairlift; on autopilot at the easy level it gets away at least once in three; the patrol cars read POLICE',
    def.police.label === 'POLICE' && runs.every(r => r.st.stage === 'chase' && !r.st.chk && !r.st.goal && r.st.chase && !r.nan && (r.escaped || r.busted)) && runs.some(r => r.escaped),
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m`).join('; '));
}

// 11. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const tt = (rain) => { Math.random = seeded(3);
    const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1, rain })), P = r.player; r.start();
    let t = 0, k = 0; while (!P.finished && t < 900) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig; return P.finished ? P.finishTime : 0; };
  const dry = tt(0), wet = tt(1);
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01 (in the rain too)', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && Math.abs(dry * 1.01 - M.cs[0]) < 1.5 && Math.abs(wet * 1.01 - M.wet.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${dry.toFixed(1)} / ${wet.toFixed(1)} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
