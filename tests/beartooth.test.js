// Beartooth: an open road with four ways to drive it on one card, as Vršič and Los Caracoles (def.modes: the race, the time trial, the duel in
// the traffic and the run from the police). The road: the real line of US 212 up the switchbacks above the Rock Creek valley (Montana), at full
// scale and no longer than 5 km: from ~2630 m up five hairpins (def.curves, the game's numbering from the bottom; the fourth at the Rock Creek
// Vista, ~2800 m) to the top of the switchbacks (~2850 m), the hairpins flatter than the legs between them. Its scenery data as the world
// builder reads it (the terrain's rows, the land cover's run-length code, the viewpoint and the pull-outs). The open road's traffic is its own
// mix (def.traffic): a summer tourist road, many motorbikes, hardly any trucks. A whole race up to the top (12 AI + the player on autopilot):
// every car finishes and pulls up in its own slot past the line; a whole duel in the traffic on autopilot: both reach the top and the traffic
// keeps moving. The medal times of the time trial: the stock rally car on the autopilot.
//   node tests/beartooth.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'beartooth'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

// 1. the track: an open road, four ways to drive it, its checkpoints and climb; at full scale, at most 5 km; not a round of the big championship
check('track: an open road with four ways to drive it (def.modes: race, time trial, traffic, police), 4 checkpoints, the road 12 m wide',
  def.open && !def.timeTrial && (def.modes || []).join(',') === 'race,tt,traffic,police' && T.cpS.length === 4 && T.w === 6,
  `race ${Math.round(T.raceLen)} m, ${T.cpS.length} checkpoints, climb ${def.alt.join('-')} m, modes ${(def.modes || []).join(',')}`);
check('track: from ~2630 m up to the top of the switchbacks (~2850 m), 4.8-5 km', Math.abs(def.alt[0] - 2631) < 15 && Math.abs(def.alt[1] - 2849) < 15 && T.raceLen > 4800 && T.raceLen <= 5000 && Math.abs(T.altAt(T.hFinish) - def.alt[1]) < 1 && Math.abs(def.realKm - T.raceLen / 1000) < 0.1,
  `${Math.round(T.raceLen)} m, ${def.alt[0]} -> ${def.alt[1]} m`);
check('track: not in the big championship (an open road is no circuit)', !C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('beartooth'));

// 2. the five hairpins: in order up the road, each a real bend of the line the way its sign says (over 120 m round it: three of them 150 degrees
// and more, the second and the third ~100 degrees), the fourth at the Rock Creek Vista (~2800 m); their altitudes as the road's own
{
  const cv = def.curves || [], turn = cv.map(([d]) => { const a = T.idx(T.startS + d - 60), b = T.idx(T.startS + d + 60); let s = 0; for (let i = a; i < b; i++) s += wrap(T.hd[i + 1] - T.hd[i]); return s; });
  const alt = cv.map(([d]) => T.altAt(T.hy[T.idx(T.startS + d)]));
  const order = cv.every((c, k) => !k || c[0] > cv[k - 1][0] + 50), bends = turn.every((a, k) => Math.abs(a) > 1.5 && Math.sign(a) === cv[k][2]);
  const hair = turn.filter(a => Math.abs(a) > 2.55).length, own = cv.every((c, k) => Math.abs(c[1] - alt[k]) < 3);
  check('hairpins: 5, in order up the road, each a bend the way its sign says (3 of them 150 degrees and more)', cv.length === 5 && order && bends && hair === 3,
    `${cv.length} hairpins, turns ${turn.map(a => Math.round(a * 57.3)).join(' ')}`);
  check('hairpins: the first at ~2640 m, the fourth (Rock Creek Vista) at ~2800 m, each sign\'s altitude the road\'s', Math.abs(alt[0] - 2641) < 10 && Math.abs(alt[3] - 2801) < 10 && own,
    `hairpin 1 ${Math.round(alt[0])} m, hairpin 4 ${Math.round(alt[3])} m, hairpin 5 ${Math.round(alt[4])} m`);
  check('hairpins: the HUD and the commentator know them (Serpentina 1 .. 5, the Rock Creek Vista at 4, the top of the switchbacks at the finish)',
    T.names.filter(q => /^Serpentina \d+/.test(q.n)).length === 5 && T.names.some(q => q.n === 'Serpentina 4 · Rock Creek Vista' && q.say) && /^Vrh serpentin/.test(T.names[T.names.length - 1].n),
    T.names.map(q => q.n).join(' | '));
  // the climb is on the legs: the grade through the three sharp hairpins' apexes (+-12 m) lower than on the legs between them; nowhere steeper than ~9 %
  let gin = 0, nin = 0, gout = 0, nout = 0, gmax = 0;
  const sharp = cv.filter((c, k) => Math.abs(turn[k]) > 2.55), near = (s) => sharp.some(([d]) => Math.abs(s - T.startS - d) < 12), far = (s) => cv.every(([d]) => Math.abs(s - T.startS - d) > 45);
  for (let i = T.startIdx; i < T.finishIdx; i++) { const s = i * T.ds, g = T.grade[i]; gmax = Math.max(gmax, g); if (near(s)) { gin += g; nin++; } else if (far(s)) { gout += g; nout++; } }
  check('grades: the hairpins flatter than the legs, the road climbing all the way, nowhere steeper than ~9 %', gin / nin < 0.75 * gout / nout && gmax < 0.09 && T.hFinish > T.hStart + 200,
    `through the hairpins ${(gin / nin * 100).toFixed(1)} %, on the legs ${(gout / nout * 100).toFixed(1)} %, steepest ${(gmax * 100).toFixed(1)} %, climb ${Math.round(T.hFinish - T.hStart)} m`);
}

// 3. the scenery data (as vrPrep reads it): the terrain rows (one per row of the grid, within it), the land cover's run-length code (exactly its
// cells, classes 0-6), the Rock Creek Vista beside its hairpin, the pull-outs by the road
{
  const D = def.dem, L = def.lc, A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const rows = D.rows.length === D.nz && D.rows.every(([a, k]) => a >= 0 && a + k <= D.nx), res = Buffer.from(D.res, 'base64').length === D.rows.reduce((s, r) => s + r[1], 0);
  let cells = 0, maxC = 0; const cnt = new Array(8).fill(0);
  for (let p = 0; p < L.rle.length;) { const s = A64.indexOf(L.rle[p++]); let k = (s & 7) + 1; if ((s & 7) === 7) { let e; do { e = A64.indexOf(L.rle[p++]); k += e; } while (e === 63 && p < L.rle.length); } cells += k; maxC = Math.max(maxC, s >> 3); cnt[s >> 3] += k; }
  check('scenery: the terrain rows and residuals, the land cover (forest, tundra, rock) cell for cell', rows && res && cells === L.nx * L.nz && maxC <= 6 && cnt[1] > cnt[4] && cnt[0] > 0,
    `dem ${D.nx}x${D.nz}, lc ${L.nx}x${L.nz} (${cells} cells: tundra ${cnt[0]}, forest ${cnt[1]}, rock ${cnt[4]})`);
  const vh = def.curves[3][0], vi = T.idx(T.startS + vh), dv = Math.hypot(def.vista[0] - T.px[vi], def.vista[1] - T.pz[vi]);
  const pulls = (def.pulls || []).filter(([x, z]) => { const q = T.query(x, z, T.nearestIdx(x, z), {}); return Math.abs(q.d) < 40; });
  check('scenery: the Rock Creek Vista ~250 m out from its hairpin, pull-outs beside the road', dv > 150 && dv < 400 && pulls.length >= 6, `vista ${Math.round(dv)} m from hairpin 4, ${pulls.length} pull-outs`);
}

// 4. the open road's traffic: a summer tourist road, many motorbikes, hardly any trucks; vehicles on their own halves of the road both ways
{
  const orig = Math.random; Math.random = seeded(3);
  const d = new C.Race(T, opts({ numAI: 1, playerGrid: 2, traffic: true, damage: 2 })), tf = d.tf;
  Math.random = orig;
  const trucks = tf.veh.filter(v => v.p === 5), bikes = tf.veh.filter(v => v.kind === 3), cars = tf.veh.filter(v => v.kind === 0);
  check('traffic: cars, campers and many motorbikes both ways, hardly any trucks', tf.veh.length > 10 && bikes.length >= 2 && cars.length > trucks.length * 3 && tf.veh.some(v => v.dir > 0) && tf.veh.some(v => v.dir < 0),
    `${tf.veh.length} vehicles: ${cars.length} cars, ${tf.veh.filter(v => v.kind === 1).length} vans, ${bikes.length} motorbikes, ${trucks.length} trucks, ${tf.veh.filter(v => v.kind === 4).length} cyclists`);
}

// 5. the ways to drive it (and an online race: always the race)
{
  const orig = Math.random; Math.random = seeded(3);
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
  const orig = Math.random; Math.random = seeded(3);
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

// 7. a whole duel in the traffic on autopilot (both cars): both reach the top, nobody on foot knocked down, the traffic keeps moving
{
  const orig = Math.random; Math.random = seeded(3);
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
  check('duel: both reach the top through the traffic, no one on foot knocked down, no vehicle standing for long', r.cars.every(c => c.finished) && !hits && standMax < 30,
    `${r.cars.filter(c => c.finished).length}/2 in ${t.toFixed(0)} s, people hit ${hits}, longest stand ${standMax.toFixed(1)} s, ${r.tf.veh.length} vehicles`);
}

// 8. the medal times of the time trial (dry and wet): gold < silver < bronze, the rain slower; gold is the stock rally car on the autopilot x 1.01
{
  const M = def.medals, asc = (a) => Array.isArray(a) && a.length === 3 && a[0] < a[1] && a[1] < a[2];
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ tt: true, numAI: 0, playerGrid: 1 })), P = r.player; r.start();
  let t = 0, k = 0; while (!P.finished && t < 600) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P); }
  Math.random = orig;
  check('medals: gold < silver < bronze, dry and wet, the rain slower; gold = the stock rally car on the autopilot x 1.01', asc(M.cs) && asc(M.wet.cs) && M.wet.cs[0] > M.cs[0] && P.finished && Math.abs(P.finishTime * 1.01 - M.cs[0]) < 1.5,
    `dry ${M.cs.join('/')} s, wet ${M.wet.cs.join('/')} s, autopilot ${P.finishTime ? P.finishTime.toFixed(1) : '-'} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
