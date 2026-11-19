// London: a city race through the centre (docs/proge/london.md), one lap clockwise, 1.81 km: the start on Whitehall (northbound), right at
// Trafalgar Square, down the avenue to the Thames, south along the embankment, right at Westminster Bridge past the clock tower and right
// at Parliament Square back onto Whitehall. The track: a circuit of the Circuits group (laps), its name as the rules want it ("Kraj, Država"),
// the lap against the real one, the real lie of the streets (the embankment and the square ~4-5 m above the sea, Whitehall rising to
// ~12.5 m at Charing Cross), the four right-handers in order and the lap turning once clockwise, the seven places on the HUD, the streets'
// widths and the barriers of a street race close to the asphalt. The world's data (js/data/london.js, OpenStreetMap): the Thames on the left
// of the embankment and never on the lap, Westminster Bridge's line from the corner over the river, the buildings, and the landmarks under
// plain descriptive labels only (no names of buildings, people, companies; the rules for Google Play). The grid on the straight behind the
// line; whole races on autopilot, dry and in the rain: every car finishes.
//   node tests/london.test.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { loadCore } = require('./lib/core.js');
const { DT, seeded, makeRace, stepRace } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'london'), T = new C.Track(def);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const turnAt = (i, m) => { const K = Math.round(m / 2 / T.ds); let s = 0; for (let k = -K; k < K; k++) s += wrap(T.hd[(i + k + 1 + T.N) % T.N] - T.hd[(i + k + T.N) % T.N]); return s * 180 / Math.PI; };

// 1. the track: a closed circuit (laps, in the big championship), its name, the length, the lie of the streets
check('track: a circuit (laps, not an open road nor a time trial), "London, Anglija" / "London, England", 6 laps, in the big championship',
  !def.open && !def.timeTrial && def.name === 'London, Anglija' && def.en.name === 'London, England' && def.laps === 6 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('london'));
check('track: the lap 1.81 km (the rule for the new tracks: 1-5 km; the big cities in the lower part of it), within 2 % of the real line', T.len > 1700 && T.len < 2000 && Math.abs(T.len / 1000 - def.realKm) / def.realKm < 0.02,
  `${(T.len / 1000).toFixed(3)} km vs ${def.realKm} km`);
{
  let gmax = 0, lo = 1e9, hi = -1e9, loS = 0, hiS = 0;
  for (let i = 0; i < T.N; i++) { gmax = Math.max(gmax, Math.abs(T.grade[i])); if (T.hy[i] < lo) { lo = T.hy[i]; loS = i * T.ds; } if (T.hy[i] > hi) { hi = T.hy[i]; hiS = i * T.ds; } }
  check('track: the real lie of the streets (the start ~6 m above the sea, the embankment and Parliament Square 4-5.5 m, the top at Charing Cross ~12.5 m), no grade over 3.5 %',
    Math.abs(T.hy[0] - 6) < 0.6 && lo > 3.8 && lo < 5.5 && loS > 800 && loS < 1810 && hi > 11.5 && hi < 13.5 && hiS > 380 && hiS < 500 && gmax < 0.035,
    `start ${T.hy[0].toFixed(1)} m, lowest ${lo.toFixed(1)} m at ${Math.round(loS)} m, highest ${hi.toFixed(1)} m at ${Math.round(hiS)} m, steepest ${(gmax * 100).toFixed(1)} %`);
}

// 2. the corners: four right-handers in order round the lap (Trafalgar Square, onto the embankment, at Westminster Bridge, Parliament Square),
// each 60 degrees and more over the 60 m round it; no left-hander worth the name; the lap turning once, clockwise
{
  const at = (n) => { const q = def.names.find(a => a[0] === n); return T.nearestIdx(q[1], q[2]); };
  const R = ['Trafalgarski trg', 'Nabrežje Temze', 'Westminstrski most', 'Parlamentarni trg'].map(n => ({ n, i: at(n) })), deg = R.map(r => turnAt(r.i, 60));
  let tot = 0, left = 0; for (let i = 0; i < T.N; i++) { tot += wrap(T.hd[(i + 1) % T.N] - T.hd[i]); left = Math.min(left, turnAt(i, 60)); }
  check('corners: four right-handers in order round the lap, each 60 degrees and more over 60 m (Trafalgar Square, the embankment, the bridge, Parliament Square)',
    R.every((r, k) => !k || r.i > R[k - 1].i) && deg.every(a => a > 60), R.map((r, k) => `${r.n} ${Math.round(r.i * T.ds)} m R${Math.round(deg[k])}`).join(', '));
  check('corners: the lap turns once clockwise (+360 degrees), no left-hander over 25 degrees in 60 m', Math.abs(tot * 180 / Math.PI - 360) < 1 && left > -25,
    `total ${(tot * 180 / Math.PI).toFixed(1)} degrees, sharpest left ${left.toFixed(0)} degrees`);
  const N7 = ['Whitehall', 'Trafalgarski trg', 'Proti reki', 'Nabrežje Temze', 'Westminstrski most', 'Urni stolp', 'Parlamentarni trg'];
  check('places: the HUD and the commentator know the seven, in order round the lap, each with its English lines', T.names.map(q => q.n).join('|') === N7.join('|') && T.names.every((q, k) => q.hud && q.say && (!k || q.d > T.names[k - 1].d)) && def.names.every(a => a[3] && a[3].length === 2),
    T.names.map(q => `${q.n} ${Math.round(q.d)} m`).join(', '));
}

// 3. the streets and the barriers of a street race: Whitehall and Parliament Street 14 m, the avenue and the embankment 13.2 m; the barriers
// all round the lap 1.5-7 m past the asphalt's edge (the junctions' mouths the widest)
{
  const wAt = (s) => T.wa[T.idx(T.startS + s)];
  let near = 1e9, far = 0; for (let i = 0; i < T.N; i++) { const w = T.wa[i]; near = Math.min(near, T.bl[i] - w, T.br[i] - w); far = Math.max(far, T.bl[i] - w, T.br[i] - w); }
  check('streets: Whitehall 14 m wide, the avenue and the embankment 13.2 m', Math.abs(wAt(200) - 7) < 0.05 && Math.abs(wAt(1650) - 7) < 0.05 && Math.abs(wAt(620) - 6.6) < 0.05 && Math.abs(wAt(1100) - 6.6) < 0.05,
    `${(2 * wAt(200)).toFixed(1)} / ${(2 * wAt(620)).toFixed(1)} / ${(2 * wAt(1100)).toFixed(1)} / ${(2 * wAt(1650)).toFixed(1)} m`);
  check('barriers: all round the lap, 1.5-7 m past the edge of the asphalt (a street race: no run-off areas)', near >= 1.5 && far <= 7.05, `${near.toFixed(2)} .. ${far.toFixed(2)} m`);
}

// 4. the world's data (js/data/london.js: OpenStreetMap): the Thames, the bridge, the buildings, the landmarks under descriptive labels
{
  const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'data', 'london.js'), 'utf8'), ctx);
  const D = ctx.LN_DATA, ring = (D.water[0] || [])[1] || [], P = [];
  for (let k = 0; k + 1 < ring.length; k += 2) P.push([ring[k], ring[k + 1]]);
  const inside = (x, z) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const edge = (x, z) => { let b = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [ax, az] = P[j], dx = P[i][0] - ax, dz = P[i][1] - az, L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); b = Math.min(b, Math.hypot(ax + dx * t - x, az + dz * t - z)); } return b; };
  let wet = 0, left = 0, emb = 0, dmax = 0;
  for (let i = 0; i < T.N; i++) {
    if (inside(T.px[i], T.pz[i])) wet++;
    const s = i * T.ds; if (s > 830 && s < 1360) { emb++; dmax = Math.max(dmax, edge(T.px[i], T.pz[i])); if (inside(T.px[i] - T.nx[i] * 40, T.pz[i] - T.nz[i] * 40)) left++; }
  }
  check('data: the Thames (one water outline) on the left of the embankment (40 m to the left of nine points in ten: the piers at its north end), its edge within 40 m of the line all along it, never on the lap',
    D.water.length === 1 && D.water[0][0] === 'Temza' && P.length > 100 && !wet && left >= 0.9 * emb && dmax < 40, `${P.length} points, the edge at most ${dmax.toFixed(1)} m from the line, ${left}/${emb} points with the river 40 m to the left`);
  const wb = D.wb, wA = [wb[0], wb[1]], wZ = [wb[wb.length - 2], wb[wb.length - 1]], qB = def.names.find(a => a[0] === 'Westminstrski most');
  check('data: Westminster Bridge\'s line from the corner (its west end on the river wall, within 50 m of it) east over the river (its middle on the water, its east end past it)',
    Math.hypot(wA[0] - qB[1], wA[1] - qB[2]) < 50 && edge(wA[0], wA[1]) < 3 && inside((wA[0] + wZ[0]) / 2, (wA[1] + wZ[1]) / 2) && !inside(wZ[0], wZ[1]) && wZ[0] - wA[0] > 200,
    `west end ${Math.hypot(wA[0] - qB[1], wA[1] - qB[2]).toFixed(1)} m from the corner, ${Math.round(Math.hypot(wZ[0] - wA[0], wZ[1] - wA[1]))} m long`);
  check('data: the buildings (OSM outlines as boxes: 150 and more; height 0 = not mapped, the world gives one), the trees, the street lamps and the walls', D.bld.length >= 150 && D.bld.every(b => b.length === 9 && b[5] >= 0) && D.trees.length > 100 && D.lamps.length > 10 && D.walls.length > 20,
    `${D.bld.length} buildings (${D.bld.filter(b => !b[5]).length} without a height), ${D.trees.length} trees, ${D.lamps.length} lamps, ${D.walls.length} walls`);
  // the landmarks: generic shapes under plain descriptive labels (the rules: only geographic names; no names of buildings, people,
  // companies or brands). The list is fixed here: a new one is added on purpose, its label checked by a person.
  const LAB = ['Urni stolp', 'Palača ob reki', 'Južni stolp palače', 'Opatija', 'Cerkev ob opatiji', 'Kupolasta dvorana', 'Steber na trgu', 'Galerija ob trgu', 'Cerkev ob trgu',
    'Stražarnica', 'Dvorana na Whitehallu', 'Obok na trgu', 'Kolo onkraj reke', 'Palača onkraj reke', 'Železniški most'];
  const labs = D.marks.map(m => m[0]), names = /nelson|ben\b|elizabeth|victoria|westminster abbey|margaret|admiralty|horse guards|banqueting|charing|portcullis|county hall|london eye|national gallery|martin|charles|wellington|churchill|lincoln|whitehall court/i;
  check('data: the landmarks under plain descriptive labels only, the fifteen of the list (no names of buildings, people or companies)', labs.length === LAB.length && labs.every(l => LAB.includes(l)) && !labs.some(l => names.test(l)),
    labs.join(', '));
  const said = def.names.flatMap(a => a[3] || []).concat([def.desc, def.en.desc]);
  check('data: the commentator\'s lines and the descriptions with no names of people or buildings', !said.some(l => names.test(l)), `${said.length} lines`);
}

// 5. the grid: 12 cars (11 rivals and the player) on the straight behind the line (Parliament Street), on the asphalt, short of Parliament Square
{
  const race = makeRace(C, 'london', () => ({ numAI: 11, playerGrid: 12, laps: 6, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }));
  const backs = race.cars.map(c => -c.dist).sort((a, b) => a - b), lat = race.cars.map(c => Math.abs(T.query(c.x, c.z, c.q.i, {}).d));
  check('grid: 12 cars behind the line on the straight, on the asphalt, the last short of Parliament Square (~250 m behind the line)', race.cars.length === 12 && backs[0] > 0 && backs[11] < 200 && lat.every(d => d < T.w - 0.8),
    `${backs.map(b => b.toFixed(0)).join(' ')} m behind, furthest out ${Math.max(...lat).toFixed(1)} m`);
}

// 6. whole races on autopilot, dry and in the rain: every car finishes
for (const rain of [0, 1]) {
  const orig = Math.random; Math.random = seeded(5 + rain);
  const race = makeRace(C, 'london', () => ({ numAI: 11, playerGrid: 12, laps: 6, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs', rain }));
  let k = 0; while (!race.cars.every(c => c.finished) && k < 120 * 900) { k++; stepRace(C, race, k); }
  Math.random = orig;
  const fin = race.cars.filter(c => c.finished).length, best = Math.min(...race.cars.map(c => Math.min(...c.lapTimes)));
  check(`race ${rain ? 'in the rain' : 'dry'}: 12 cars, 6 laps, every car finishes`, fin === 12, `${fin}/12 in ${(k * DT).toFixed(0)} s, best lap ${best.toFixed(1)} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
