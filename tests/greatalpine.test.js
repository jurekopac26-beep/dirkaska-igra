// Great Alpine Road: an open road with four ways to drive it on one card, as Vršič (def.modes: the race, the time trial, the duel in the traffic
// and the run from the police). The road: its twistiest stretch, from beside the Tambo River up the creeks' valleys to the top of the climb on the
// ridge (8 km at most, in the real scale), the climb from ~123 m to ~337 m with grades of at most ~8 %, the bends in the real order and turning the
// real way (each of the 29 bends of the OpenStreetMap line, found on it independently of the game: bends of under 110 m radius turning 20 deg or
// more), the places for the HUD and the commentator in order up the road. Australia drives on the left (def.leftHand): the traffic keeps to the
// left half both ways, Vršič's still keeps right; its own mix (cars, utes, log and stock trucks, many motorbikes). No helicopter in the run from
// the police (def.noHeli). A whole race to the top (12 AI + the player on autopilot), dry and in the rain: every car finishes and pulls up in its
// own slot past the line; a whole duel in the traffic on autopilot; the run from the police; the medal times. Only geographic names.
//   node tests/greatalpine.test.js
'use strict';
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore(), Lang = require(path.join(ROOT, 'js', 'lang.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'greatalpine'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const orig = Math.random;
const left = (v) => v.d * v.dir < -0.5;   // (a vehicle on its own half when they keep left: + across the road is the right looking up the road)

// 1. the track: an open road, four ways to drive it, driven on the left, no helicopter and no birds; the real scale (8 km at most); not in the big championship
check('track: an open road with four ways to drive it, 4 checkpoints, the road 12 m wide, the traffic on the left, no helicopter, no birds',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 6 && def.leftHand === true && def.noHeli === true && def.noBirds === true,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from the Tambo River (~123 m) up to the top of the climb (~337 m), 7.9-8 km in the real scale (no more than 8 km)',
  Math.abs(def.alt[0] - 123) < 6 && Math.abs(def.alt[1] - 337) < 8 && T.raceLen > 7900 && T.raceLen <= 8000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm * 1000 - T.raceLen) < 60,
  `${Math.round(T.raceLen)} m (realKm ${def.realKm}), ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('greatalpine'));

// 2. the bends: every bend of the OpenStreetMap line (its own analysis: [metres after the start line, D right / L left, the tightest radius m])
// is a bend of the game's road at the same place (within 40 m), turning the same way, about as tight; in the same order; none tighter than ~18 m
{
  const OSM = [[976, 'L', 49], [1162, 'D', 34], [1588, 'D', 58], [1722, 'L', 38], [1844, 'D', 60], [2162, 'D', 38], [2252, 'L', 35], [2280, 'L', 32], [2528, 'D', 43], [2606, 'D', 43],
    [2650, 'D', 41], [2746, 'L', 44], [2790, 'L', 44], [2820, 'L', 26], [3076, 'D', 44], [3166, 'L', 39], [3334, 'D', 21], [3496, 'L', 28], [3910, 'D', 37], [4166, 'D', 40],
    [4204, 'D', 30], [4264, 'L', 29], [4408, 'D', 41], [4524, 'L', 25], [7162, 'D', 44], [7382, 'D', 28], [7452, 'L', 26], [7572, 'D', 36], [7772, 'D', 41]];
  const G = T.corners.filter(c => c.i0 * T.ds > T.startS && c.i1 * T.ds < T.finishS).map(c => ({ s: c.i0 * T.ds - T.startS, dir: c.dir > 0 ? 'D' : 'L', r: c.minR, sev: c.sev }));
  let last = -1; const miss = [];
  for (const [s, dir, r] of OSM) { const k = G.findIndex((g, j) => j > last && Math.abs(g.s - s) < 40 && g.dir === dir && g.r > r * 0.7 && g.r < r * 1.4); if (k < 0) miss.push(`${s}${dir}`); else last = k; }
  const tight = G.filter(g => g.sev >= 2).length, tighter = G.filter(g => g.sev >= 3).length;
  let rmin = 1e9; for (let i = T.startIdx; i < T.finishIdx; i++) if (Math.abs(T.k[i]) > 1e-4) rmin = Math.min(rmin, 1 / Math.abs(T.k[i]));
  check('bends: all 29 bends of the OpenStreetMap line, in order, in the same places, turning the same way, about as tight', !miss.length && G.length >= 29,
    `${G.length} bends on the game's road${miss.length ? '; not found: ' + miss.join(', ') : ''}`);
  check('bends: a twisting road (25 tight bends and more, some very tight), the tightest of a ~20 m radius (the line smoothed, nothing cut)', tight >= 25 && tighter >= 5 && rmin > 17 && rmin < 26,
    `${tight} tight, ${tighter} very tight, the tightest ${rmin.toFixed(1)} m; ${G.map(g => `${Math.round(g.s)}${g.dir}${Math.round(g.r)}`).join(' ')}`);
}

// 3. the climb: grades of at most ~8 % (a short dip of ~5 %), from the river up the valleys to the ridge
{
  let gmax = 0, gmin = 0; for (let i = T.startIdx; i <= T.finishIdx; i++) { gmax = Math.max(gmax, T.grade[i]); gmin = Math.min(gmin, T.grade[i]); }
  const mid = T.altAt(T.hy[T.idx(T.startS + 4000)]);
  check('grades: nowhere steeper than ~8.5 %, a climb of ~214 m (at 4 km ~220-250 m)', gmax < 0.085 && gmin > -0.065 && T.hFinish - T.hStart > 200 && mid > 215 && mid < 255,
    `steepest ${(gmax * 100).toFixed(1)} % up, ${(gmin * 100).toFixed(1)} % down, climb ${(T.hFinish - T.hStart).toFixed(0)} m, at 4 km ${mid.toFixed(0)} m`);
}

// 4. the places: in order up the road, the commentator's lines for each, the top of the climb at the finish; only geographic names (no businesses,
// no events, no brands); the Slovene labels in English on the HUD
{
  const N = T.names, ok = N.every((q, k) => !k || q.d > N[k - 1].d) && N.every(q => q.say && q.say.length);
  check('places: in order up the road (the Tambo River, Saint Patricks Creek, Mount Elizabeth ... the top of the climb at the finish), each with the commentator\'s lines',
    ok && N.length === 8 && N[0].n === 'Reka Tambo' && /^Vrh vzpona · \d{3} m$/.test(N[N.length - 1].n) && N[N.length - 1].d > T.raceLen - 30 && N.some(q => q.n === 'Mullocky Creek'),
    N.map(q => `${q.n}@${Math.round(q.d)}`).join(', '));
  const all = JSON.stringify([def.name, def.en.name, def.escTo, N.map(q => [q.n, q.say]), def.comm, def.police, (def.sideRoads || []).map(r => r[9])]);
  check('names: the track is Great Alpine Road, Avstralija (Australia in English); no business, event or brand anywhere in the names, lines and side roads',
    def.name === 'Great Alpine Road, Avstralija' && def.en.name === 'Great Alpine Road, Australia' && !/winery|hotel|pub\b|inn\b|cafe|store|shell|bp\b|caltex|ford|holden|toyota|harley|ducati|honda|yamaha|rally|festival/i.test(all),
    def.name);
  Lang.set('en'); const en = N.map(q => Lang.place(q.n)); Lang.set('sl');
  check('names: the river and the top of the climb in English on the HUD (Tambo River, Top of the Climb · 337 m)', en[0] === 'Tambo River' && /^Top of the Climb · \d{3} m$/.test(en[en.length - 1]), en.join(' | '));
}

// 5. the scenery data (as the builder reads them): the terrain's rows, the land cover's run-length code (exactly its cells: mostly forest), the
// rivers (the Tambo wide, the creeks narrow, their levels never uphill), the side roads (in order along the road, both sides), the far view
{
  const D = def.dem, rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), res = atob(D.res).length === D.rows.reduce((s, r) => s + r[1], 0);
  const L = def.lc, A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', cnt = new Array(8).fill(0); let cells = 0;
  for (let p = 0; p < L.rle.length;) { const s = A.indexOf(L.rle[p++]); let m = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A.indexOf(L.rle[p++]); m += e; } while (e === 63 && p < L.rle.length); } cnt[s >> 3] += m; cells += m; }
  check('scenery: the terrain rows and residuals, the land cover cell for cell (mostly the eucalypt forest, the river)', rows && res && cells === L.nx * L.nz && cnt[1] > cells * 0.9 && cnt[5] > 0,
    `${D.nx}x${D.nz} terrain, ${L.nx}x${L.nz} land cover: ${cnt.join('/')}`);
  const R = def.rivers.map(a => { const n = a.length / 4; let hw = 0, up = 0; for (let k = 0; k < n; k++) { hw = Math.max(hw, a[4 * k + 3]); if (k && a[4 * k + 2] > a[4 * k - 2] + 1e-6) up++; } return { n, hw, up }; });
  check('scenery: the Tambo (wide, 8 m and more from its middle to its banks) and the creeks (narrow), their water never running uphill', R[0].hw >= 8 && R.slice(1).every(r => r.hw < 2) && R.every(r => !r.up) && R.length >= 6,
    R.map(r => `${r.n} pts / ${r.hw} m`).join(', '));
  const S = def.sideRoads, F = def.far;
  check('scenery: the side roads in order along the road (the tracks and Ash Range Road, both sides), the side roads of the game; the far view round the corridor',
    S.length === 4 && S.every((r, k) => !k || r[0] > S[k - 1][0]) && S.some(r => r[1] > 0) && S.some(r => r[1] < 0) && (T.stubs || []).length === 4 && F && atob(F.b64).length === 2 * F.nx * F.nz,
    S.map(r => `${r[0]}${r[1] > 0 ? 'R' : 'L'} ${r[9] || '-'}`).join(', '));
}

// 6. the traffic keeps left on the Great Alpine Road (up the road on the left half, down on the right half as the race sees it) and right on Vršič;
// its mix: cars, utes and vans, many motorbikes, log and stock trucks
{
  Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  const V = new C.Track(C.TRACKS.find(x => x.id === 'vrsic')), dv = new C.Race(V, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 }));
  Math.random = orig;
  const own = tf.veh.filter(left), bikes = tf.veh.filter(v => v.kind === 3), trucks = tf.veh.filter(v => v.p === 5), cyc = tf.veh.filter(v => v.kind === 4);
  check('traffic: keeps left (uphill on the left half, downhill on the right as the race sees it), cyclists at the left edge; motorbikes and trucks among it',
    tf.sd === -1 && own.length === tf.veh.length && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0) && cyc.every(v => v.d * v.dir < -(T.w - 1)) && bikes.length >= 3 && trucks.length >= 1,
    `${tf.veh.length} vehicles (${tf.veh.filter(v => v.dir > 0).length} up, ${tf.veh.filter(v => v.dir < 0).length} down), on the left ${own.length}, motorbikes ${bikes.length}, trucks ${trucks.length}, cyclists ${cyc.length}`);
  check('traffic: Vršič keeps right as before', dv.tf.sd === 1 && dv.tf.veh.every(v => v.d * v.dir > 0.5), `${dv.tf.veh.length} vehicles`);
  const a = tf.veh.find(v => v.dir > 0 && v.kind === 0), b = tf.veh.find(v => v.dir < 0 && v.kind === 0);
  check('traffic: its edge (pulling over for the police) is the left one both ways', tf._edge(a) < -T.w + 1.5 && tf._edge(b) > T.w - 1.5, `uphill ${tf._edge(a).toFixed(2)} m, downhill ${tf._edge(b).toFixed(2)} m`);
}

// 7. the ways to drive it; the run from the police starts on the left half and never calls the helicopter (def.noHeli), Vršič's does
{
  Math.random = seeded(3);
  const tt = new C.Race(T, opts({ tt: true })), race = new C.Race(T, opts({})), net = new C.Race(T, opts({ numAI: 0, playerGrid: 1, tt: true, remote: { model: C.MODELS[0], color: 0, num: 2, name: 'B', grid: 2 } }));
  tt.start(); race.start();
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b);
  check('mode: opts.tt is the time trial (the player alone on the line); without it the race, 13 cars on the grid behind the line; online always the race',
    tt.timeTrial && tt.cars.length === 1 && Math.abs(tt.player.dist) < 0.5 && !race.timeTrial && race.cars.length === 13 && backs[12] < T.startS - 5 && !net.timeTrial && net.cars.length === 2,
    'grid ' + backs.map(b => b.toFixed(0)).join(' '));
  const heli = (track) => { const r = new C.Race(track, opts({ numAI: 0, playerGrid: 1, police: true, damage: 2, difficulty: 3 })), P = r.player; r.start(); let k = 0, seen = false;
    for (let t = 0; t < 70; t += DT) { Math.random = seeded(6000 + (++k)); r.pol.heat = 5; C.aiControl(P, r, DT); r.step(DT); if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); if (r.pol.heli) seen = true; } return { seen, d: r.player.q.d }; };
  const pol = new C.Race(T, opts({ numAI: 0, playerGrid: 1, police: true, damage: 2 })); pol.start();
  const h1 = heli(T), h2 = heli(new C.Track(C.TRACKS.find(x => x.id === 'vrsic')));
  Math.random = orig;
  check('mode: the run from the police starts on the left half of the road, the traffic and the police on it', !!pol.pol && !!pol.tf && pol.player.q.d < -1, `the player at ${pol.player.q.d.toFixed(2)} m across the road`);
  check('police: no helicopter on the Great Alpine Road at the highest heat (def.noHeli); Vršič\'s comes', !h1.seen && h2.seen, `here ${h1.seen ? 'a helicopter' : 'none'}, on Vršič ${h2.seen ? 'it comes' : 'none'}`);
}

// 8. a whole race up to the top on autopilot, dry and in the rain: every car finishes, then pulls up in its own slot past the line and stays there
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
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos), w = rain ? 'in the rain' : 'dry';
  check(`race ${w}: all 13 cars reach the top`, fin.length === 13 && r.rain === rain, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, player ${P.finishPos}. (${P.finishTime ? P.finishTime.toFixed(1) : '-'} s), player rescues ${resc}`);
  const slots = r.cars.map(c => { const q = T.query(c.x, c.z, c.q.i, {}); return { pos: c.finishPos, s: q.s - T.finishS, d: q.d, v: c.speed, parked: !!c.parked }; }).sort((a, b) => a.pos - b.pos);
  check(`race ${w}: past the line every car stops in its own slot (70 m on, 9 m apart)`, slots.every((p, k) => p.parked && p.v < 0.3 && Math.abs(p.s - (70 + 9 * k)) < 4),
    slots.map(p => `P${p.pos}@${p.s.toFixed(0)}m/${p.d.toFixed(1)}`).join(' '));
}

// 9. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody knocked down, the traffic keeps moving and keeps left
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, standMax = 0, nL = 0, nAll = 0; const stand = new Map();
  while (t < 700 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(7000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    if (k % 60 === 0) for (const v of r.tf.veh) { const w = v.v < 0.3 && v.st === 0 ? (stand.get(v) || 0) + 0.5 : 0; stand.set(v, w); standMax = Math.max(standMax, w); if (!v.off && v.st === 0 && !v.yl && !v.pass && v.v > 2) { nAll++; if (left(v)) nL++; } }
  }
  Math.random = orig;
  const hits = r.cars.reduce((a, c) => a + (c.hitPeople || 0), 0);
  check('duel: both reach the top through the traffic, no one knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
  check('duel: the moving traffic keeps left all the way (98 % and more of the samples)', nAll > 200 && nL / nAll >= 0.98, `${nL}/${nAll} on the left`);
}

// 10. the run from the police: no checkpoint, no building (the chase from the start, the escape over the finish); the patrol cars read POLICE (a
// generic band); whole runs on autopilot at the easy level end in an escape or an arrest, the autopilot gets away at least once in three
{
  const popts = (o) => Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 0, damage: 2, police: true }, o);
  const runs = [11, 12, 13].map(seed => {
    Math.random = seeded(3);
    const r = new C.Race(T, popts({ seed })), P = r.player, pol = r.pol, pc = pol.cars[0];
    const st = { stage: pol.stage, chk: pol.chk, goal: pol.goal, chase: pc && pc.pol.mode === 'chase' };
    r.start();
    let t = 0, k = 0, nan = false;
    while (t < 700 && !P.finished) {
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

// 11. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 700) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
