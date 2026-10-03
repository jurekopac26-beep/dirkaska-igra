// Mount Rose: an open road with four ways to drive it on one card, as Vršič (def.modes: the race, the time trial, the duel in the traffic and
// the run from the police). The road: the real line of Nevada State Route 431 (the Mount Rose Highway) from the top of Incline Village round
// the big hairpin at the Lake Tahoe overlook, across Tahoe Meadows to Mount Rose Summit, at full scale and no longer than 8 km (~2277 m up to
// ~2714 m, the summit sign 2716 m); its bends in the real order and turning the real way (def.bends), the overlook on the outside of the
// hairpin, the places on the HUD in order up the road; its scenery data as the world builder reads it (the terrain's rows, the land cover's
// run-length code, the car parks, the side roads of OpenStreetMap and their gates); no helicopter (def.noHeli). The open road's traffic is its
// own mix (def.traffic: trucks too, many cyclists). A whole race up to the summit (12 AI + the player on autopilot) in the dry and in the rain:
// every car finishes; a whole duel in the traffic: both reach the top; the run from the police; the medal times of the time trial.
//   node tests/mountrose.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'mountrose'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const turn = (a, b) => { let s = 0; for (let i = T.idx(T.startS + a); i < T.idx(T.startS + b); i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; };
const orig = Math.random;

// 1. the track: its name (the place, the country), an open road, four ways to drive it, its checkpoints and climb; at full scale, at most 8 km
check('track: "Mount Rose, ZDA" (English "Mount Rose, USA"), an open road with four ways to drive it, 4 checkpoints, the road 12 m wide',
  def.name === 'Mount Rose, ZDA' && def.en.name === 'Mount Rose, USA' && def.open && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 6,
  `${def.name} / ${def.en.name}, ${T.cpS.length} checkpoints, modes ${(def.modes || []).join(',')}`);
check('track: from the top of Incline Village (~2277 m) to Mount Rose Summit (~2714 m), 7.9-8 km at full scale', Math.abs(def.alt[0] - 2277) < 10 && Math.abs(def.alt[1] - 2714) < 10 && T.raceLen > 7900 && T.raceLen <= 8000 &&
  Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(T.altAt(T.hStart) - def.alt[0]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('mountrose'));

// 2. the bends: in order up the road, each turning the way the list says, by 25 degrees or more; the big hairpin first (left, ~210 degrees,
// radius 70-110 m) round the Lake Tahoe overlook; the biggest of the long bends (~65 degrees right at ~3.2 km, ~55 left at ~4 km); the summit's
// bend to the left up to the finish
{
  const B = def.bends, tr = B.map(([a, b]) => turn(a, b)), rad = (a, b) => { let m = 0; for (let i = T.idx(T.startS + a); i < T.idx(T.startS + b); i++) m = Math.max(m, Math.abs(T.k[i])); return 1 / m; };
  check('bends: 9, in order up the road, each turning the way the list says by 25 degrees or more', B.length === 9 && B.every((b, k) => b[1] > b[0] && (!k || b[0] >= B[k - 1][1])) && tr.every((t, k) => Math.sign(t) === B[k][2] && Math.abs(t) > 0.43),
    tr.map((t, k) => `${B[k][0]}-${B[k][1]} m ${Math.round(t * 57.3)}°`).join(', '));
  check('bends: the big hairpin first, to the left, ~210 degrees, radius 70-110 m; ~65 degrees right at 3.0-3.5 km, ~55 left at 3.8-4.2 km; the summit\'s bend to the left',
    B[0][2] === -1 && Math.abs(tr[0]) > 3.4 && Math.abs(tr[0]) < 3.9 && rad(B[0][0], B[0][1]) > 70 && rad(B[0][0], B[0][1]) < 110 && B[3][2] === 1 && Math.abs(tr[3]) > 1.0 && B[4][2] === -1 && Math.abs(tr[4]) > 0.85 && B[8][2] === -1 && B[8][1] >= T.raceLen - 5,
    `hairpin ${Math.round(tr[0] * 57.3)}° radius ${Math.round(rad(B[0][0], B[0][1]))} m, then ${Math.round(tr[3] * 57.3)}° and ${Math.round(tr[4] * 57.3)}°, the summit ${Math.round(tr[8] * 57.3)}°`);
  // the rest of the road: long straights and sweeping bends (nowhere else tighter than ~150 m)
  let tight = 1e9; for (let i = T.startIdx; i < T.finishIdx; i++) { const d = i * T.ds - T.startS; if (d > B[0][0] - 20 && d < B[0][1] + 20) continue; if (d > B[8][0] - 20) continue; tight = Math.min(tight, 1 / Math.max(1e-6, Math.abs(T.k[i]))); }
  check('bends: past the hairpin long sweeping bends, none tighter than ~150 m below the summit', tight > 150, `tightest ${Math.round(tight)} m`);
}

// 3. the places on the HUD, in order up the road: the overlook (on the outside of the hairpin, beside the road), the Carson Range, Ophir Creek,
// Tahoe Meadows, Mount Rose, the summit at the finish; their heights the road's own
{
  const ns = T.names.map(q => q.n), want = [/^Razgledišče Tahoe · /, /^Carson Range$/, /^Ophir Creek$/, /^Tahoe Meadows · /, /^Mount Rose · 3\.285 m$/, /^Prelaz Mount Rose · /];
  const own = T.names.filter(q => / · \d\.\d{3} m$/.test(q.n) && !/^Mount Rose/.test(q.n)).every(q => Math.abs(+q.n.match(/(\d)\.(\d{3}) m$/).slice(1).join('') - T.altAt(T.hy[T.idx(T.startS + q.d)])) < 2);
  check('places: the overlook, the Carson Range, Ophir Creek, Tahoe Meadows, Mount Rose, the summit at the finish; in order, every one with lines, the heights the road\'s',
    ns.length === want.length && want.every((r, k) => r.test(ns[k])) && T.names.every(q => q.say) && Math.abs(T.names[5].d - T.raceLen) < 1 && own, ns.join(' | '));
  const v = def.vista, vi = T.nearestIdx(v[0], v[1]), q = T.query(v[0], v[1], vi, {}), dv = q.s - T.startS;
  check('the overlook: beside the road (<40 m) on the outside of the hairpin (its right going up), at the place of its name', Math.abs(q.d) < 40 && q.d > 0 && dv > def.bends[0][0] && dv < def.bends[0][1] && Math.abs(dv - T.names[0].d) < 30,
    `${Math.round(dv)} m after the start, ${q.d.toFixed(1)} m across`);
}

// 4. the grades: the real road's (~6-7 % on the long climb), nowhere steeper than 9 %; the one dip down into Tahoe Meadows; ~437 m of climb
{
  let gmax = 0, gmin = 0, down = 0;
  for (let i = T.startIdx; i < T.finishIdx; i++) { const g = T.grade[i]; gmax = Math.max(gmax, g); gmin = Math.min(gmin, g); if (g < -0.005) down += T.ds; }
  let gs = 0, ng = 0; for (let i = T.idx(T.startS + 1500); i < T.idx(T.startS + 4500); i++) { gs += T.grade[i]; ng++; }
  check('grades: ~6.5 % on the long climb, nowhere steeper than 9 %, a short dip into Tahoe Meadows (the only stretch downhill, < 400 m, ~2-4 %), ~437 m of climb',
    gmax <= 0.091 && gs / ng > 0.055 && gs / ng < 0.075 && gmin > -0.045 && down > 50 && down < 400 && Math.abs(T.hFinish - T.hStart - 437) < 12,
    `steepest ${(gmax * 100).toFixed(1)} %, mean 1.5-4.5 km ${(gs / ng * 100).toFixed(1)} %, down ${Math.round(down)} m (steepest ${(-gmin * 100).toFixed(1)} %), climb ${Math.round(T.hFinish - T.hStart)} m`);
}

// 5. the scenery data (as vrPrep reads it): the terrain rows, the land cover's run-length code (exactly its cells: forest the most, then the
// meadows), the car parks beside the road, the side roads (OpenStreetMap: Fairview Boulevard at the start, the tracks and service roads up the
// road, gated), the view beyond (Lake Tahoe ~500 km² of the far grid's nodes)
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), res = Buffer.from(D.res, 'base64').length === D.rows.reduce((s, r) => s + r[1], 0);
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('scenery: the terrain rows and residuals, the land cover cell for cell (forest the most, then the meadows and grass)', rows && res && cells === L.nx * L.nz && maxC <= 6 && cnt[1] > cnt[0] && cnt[0] > cnt[2] && cnt[0] > cnt[4],
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: grass ${cnt[0]}, forest ${cnt[1]}, shrubs ${cnt[2]}, rock ${cnt[4]})`);
  const pulls = (def.pulls || []).filter(([x, z]) => Math.abs(T.query(x, z, T.nearestIdx(x, z), {}).d) < 70);
  const S = T.stubs || [], fair = S.find(s => s.name === 'Fairview Boulevard'), gated = S.filter(s => s.end === 1 && s.grav).length;
  check('scenery: the car parks beside the road; the side roads of OpenStreetMap (Fairview Boulevard below the start on the right, gated tracks up the road)',
    pulls.length >= 6 && S.length === def.sideRoads.length && S.length >= 8 && fair && fair.side === 1 && fair.s < 0 && gated >= 5 && S.every(s => s.L > 10),
    `${pulls.length} car parks, ${S.length} side roads (${gated} gated tracks), Fairview at ${fair ? Math.round(fair.s) : '-'} m`);
  const F = def.farDem; let wet = 0; for (let k = 0, v = 0; k < F.lake.length; k++, v ^= 1) if (v) wet += F.lake[k];
  check('the view: Lake Tahoe in the far grid (~495 km² as the OpenStreetMap shore), the surface ~1897 m', Math.abs(wet * F.cell * F.cell / 1e6 - 495) < 40 && def.far.lake[2] === 1897 && Buffer.from(F.b64, 'base64').length === 2 * F.nx * F.nz,
    `${F.nx}x${F.nz} nodes, lake ${Math.round(wet * F.cell * F.cell / 1e6)} km²`);
}

// 6. the open road's traffic: commuters and tourists, trucks, motorbikes, many cyclists; both ways
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0), cyc = tf.veh.filter(v => v.kind === 4);
  check('traffic: cars, vans, trucks, motorbikes and cyclists both ways', tf.veh.length > 14 && trucks.length >= 1 && bikes.length >= 2 && cyc.length >= 4 && cars.length > trucks.length * 2 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${bikes.length} motorbikes, ${trucks.length} trucks, ${cyc.length} cyclists`);
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

// 8. whole races up to the summit on autopilot, in the dry and in the rain: every car finishes, then pulls up in its own slot past the line
for (const rain of [0, 1]) {
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ rain })), P = r.player; r.start();
  let t = 0, k = 0, resc = 0;
  while (t < 700 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
  }
  for (let s = 0; s < 120 * 30; s++) { Math.random = seeded(90000 + s); C.aiControl(P, r, DT); r.step(DT); }   // (30 s more: the last ones pull up)
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  check(`race${rain ? ' in the rain' : ''}: all 13 cars reach the summit, each parked past the line`, fin.length === 13 && r.cars.every(c => c.parked && c.speed < 0.3),
    `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, last ${fin.length ? fin[fin.length - 1].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), rescues ${resc}`);
}

// 9. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody knocked down, the traffic keeps moving
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
  check('duel: both reach the summit through the traffic, no one knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

// 10. the run from the police: the chase from the start, the escape over the summit; no helicopter on this road (def.noHeli): not even with its
// heat threshold at 0 (where on any other road it comes at once: the same run on a copy of the road without the flag); the patrol cars read POLICE
{
  const popts = (o) => Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 0, damage: 2, police: true }, o);
  const run = (TT, seed) => {
    Math.random = seeded(3);
    const r = new C.Race(TT, popts({ seed })), P = r.player, pol = r.pol, pc = pol.cars[0];
    pol.D = Object.assign({}, pol.D, { heli: 0 });   // (the helicopter's heat: none needed)
    const st = { stage: pol.stage, chk: pol.chk, goal: pol.goal, chase: pc && pc.pol.mode === 'chase' };
    r.start();
    let t = 0, k = 0, nan = false, heli = 0;
    while (t < 700 && !P.finished && !pol.busted) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      if (pol.heli) heli++;
      if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
      if (!Number.isFinite(P.x + P.z)) nan = true;
    }
    Math.random = orig;
    return { seed, st, nan, t, heli, escaped: pol.escaped && !pol.busted && P.finished, busted: pol.busted, at: P.q.s - T.startS };
  };
  const runs = [11, 12, 13, 14, 15].map(seed => run(T, seed)), ctl = run(new C.Track(Object.assign({}, def, { noHeli: false })), 11);
  check('police: the chase from the start, the escape over the summit (on autopilot at the easy level at least once in five); never a helicopter (with the flag off it comes); the patrol cars read POLICE',
    def.noHeli && def.police.label === 'POLICE' && runs.every(r => r.st.stage === 'chase' && !r.st.chk && !r.st.goal && r.st.chase && !r.nan && (r.escaped || r.busted) && r.heli === 0) && runs.some(r => r.escaped) && ctl.heli > 0,
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m, helicopter ${r.heli}`).join('; ') + `; without the flag: helicopter ${ctl.heli} steps`);
}

// 11. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const tt = (rain) => { Math.random = seeded(3); const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1, rain })), P = r.player; r.start();
    let t = 0, k = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
    Math.random = orig; return P.finished ? P.finishTime : NaN; };
  const d = tt(0), w = tt(1);
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && Math.abs(d * 1.01 - M.cs[0]) < 1.5 && Math.abs(w * 1.01 - M.wet.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${d.toFixed(1)} / ${w.toFixed(1)} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
