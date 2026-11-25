// Zandvoort, Nizozemska: the circuit in the dunes by the North Sea north of Zandvoort (4.26 km, clockwise; docs/proge/zandvoort.md).
// The layout at its real length, clockwise; its corners by plain descriptions in their order round the lap, each turning its way; its two
// banked corners (the banked left after the pits, the banked last corner onto the straight), the road tilted up to the outside of each;
// the heights (the dunes: the highest after the crest, the lowest by the chicane); the pits on the right of the main straight past the start
// line; the run-offs (wider than 3 m past the asphalt along most of the lap); the scenery data (terrain, land cover, the ponds in the dune
// valleys off the road, the sand, the buildings); a whole AI race in the dry and in the rain.
//   node tests/zandvoort.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'zandvoort'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };

// 1. the track: its name (a place and its country), a closed circuit of 3 laps, 4.26 km within 3 % (realKm 4.259), clockwise, not a test
// track nor one waiting for a choice; twisty: at least 330 degrees of turning a kilometre (the game's smoothed line: about 378)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Zandvoort, Nizozemska" (English "Zandvoort, Netherlands"), a closed circuit, 3 laps, 4.26 km within 3 % (realKm 4.259), clockwise, not a test track, at least 330 °/km of turning',
    def.name === 'Zandvoort, Nizozemska' && def.en.name === 'Zandvoort, Netherlands' && !T.open && def.laps === 3 && Math.abs(T.len / 4259 - 1) < 0.03 && def.realKm === 4.259 && area < 0 && !def.test && !def.pending && perKm > 330,
    `${T.len.toFixed(1)} m (${((T.len / 4259 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms, the circuit or its races), in their order round the lap from the start
// line, each turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place (the crest, the esses and the chicane
// turn both ways); the tightest radius on the centre line, the nearest legs of the lap apart
{
  const want = { 'Lasnica na koncu ravnine': [-1, 120], 'Desni za boksi': [-1, 50], 'Nagnjeni levi': [1, 120], 'Desni v dolino': [-1, 45], 'Ostri desni': [-1, 50], 'Desni ob ribniku': [-1, 90],
    'Levi okoli sipine': [1, 100], 'Desni pred zadnjim': [-1, 75], 'Nagnjeni zadnji ovinek': [-1, 35] };
  const order = ['Lasnica na koncu ravnine', 'Desni za boksi', 'Nagnjeni levi', 'Greben sipine', 'Hitra esa', 'Desni v dolino', 'Ostri desni', 'Desni ob ribniku', 'Levi okoli sipine', 'Šikana',
    'Desni pred zadnjim', 'Nagnjeni zadnji ovinek', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 13 named places in their order round the lap (the hairpin at the end of the straight ... the finish straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right at the hairpin, behind the pits, into the valley, the sharp right, by the ponds, before the last and the banked last corner; left at the banked left and round the dune',
    cs.length === 9 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 15 m radius; the legs of the lap at least 30 m apart', 1 / kmax >= 15 && legs >= 30, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 13 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 13 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the two banked corners (def.bank, Track.bankAt): the banked left (by its name, 800-900 m) and the banked last corner (3.65-3.86 km),
// each tilted 15-20 degrees across, the road's outside edge up (the left's on the right, the last corner's on the left), nowhere else
{
  const bk = {}, tilt = (d) => { const i = T.idx(T.startS + d), s = i * T.ds; T.bankAt(s, T.w, bk); const r = bk.dy; T.bankAt(s, -T.w, bk); return { r, l: bk.dy, k: T.k[i] }; };
  const L = def.names.find(c => c[0] === 'Nagnjeni levi'), Z = def.names.find(c => c[0] === 'Nagnjeni zadnji ovinek'), dL = near(L[1], L[2]).d, dZ = near(Z[1], Z[2]).d;
  const a = tilt((def.bank[0][0] + def.bank[0][1]) / 2), b = tilt((def.bank[1][0] + def.bank[1][1]) / 2), deg = (t) => Math.atan((Math.abs(t.r - t.l)) / (2 * T.w)) * 180 / Math.PI;
  let flat = true; for (let d = 0; d < T.len; d += 10) if (!def.bank.some(([p, q]) => d > p - 30 && d < q + 30)) { const t = tilt(d); if (t.r !== 0 || t.l !== 0) flat = false; }
  check('banking: the banked left and the banked last corner, each 15-20° across, the outside edge up (the left\'s on the right, the last corner\'s on the left); the rest of the lap level across',
    def.bank.length === 2 && dL > def.bank[0][0] && dL < def.bank[0][1] && dZ > def.bank[1][0] - 20 && dZ < def.bank[1][1] && a.k < 0 && a.r > a.l && b.k > 0 && b.l > b.r
      && deg(a) > 15 && deg(a) < 20 && deg(b) > 15 && deg(b) < 20 && flat,
    `${def.bank.map(([p, q]) => p + '-' + q + ' m').join(', ')}: ${deg(a).toFixed(1)}° and ${deg(b).toFixed(1)}°`);
}
// 4. the heights: 6-11 m from the lowest (by the chicane, 2.9-3.4 km) to the highest (in the dunes past the crest, 1.3-1.8 km); the
// steepest grade under 6 %
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const dLo = dS(iLo * T.ds), dHi = dS(iHi * T.ds);
  check('heights: 6-11 m from the lowest (by the chicane, 2.9-3.4 km) to the highest (in the dunes past the crest, 1.3-1.8 km), the steepest grade under 6 %',
    hi - lo > 6 && hi - lo < 11 && dLo > 2900 && dLo < 3400 && dHi > 1300 && dHi < 1800 && g < 0.06, `${(hi - lo).toFixed(1)} m, lowest at ${Math.round(dLo)} m, highest at ${Math.round(dHi)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 5. the pits: the lane on the right of the main straight from before the start line to after it, the straight no tighter than a 500 m
// radius along the boxes, the 18 crews' boxes in the lane, the pit wall along it; the start line on the finish straight's sign side; the
// run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the right of the main straight past the start line, the straight no tighter than a 500 m radius along the boxes, 18 boxes in the lane (the player\'s among them), the pit wall along it',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -200 && P[2] > 200 && 1 / kmax > 500 && dfs > T.len - 200 && nBox === 18 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.85 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 6. the scenery data (tools/zandvoort/build.py): terrain and land cover round the track, the grandstands (named after the town, the
// province, the region and the country), the sand (OSM), the buildings; the ponds in the dune valleys (OSM natural=water, the mask on 5 m
// cells: def.sk.pond, decoded as js/world-zandvoort.js does): 8 or more, each off the road (at least 3 m past its barriers)
{
  const sk = def.sk, P = sk.pond, A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', M = new Uint8Array(P.nx * P.nz);
  let k = 0; for (let p = 0; p < P.rle.length;) { const v = A.indexOf(P.rle[p++]); let r = (v & 31) + 1; if ((v & 31) === 31) { let e; do { e = A.indexOf(P.rle[p++]); r += e; } while (e === 63); } M.fill(v >> 5, k, k + r); k += r; }
  const lab = new Int32Array(M.length).fill(-1); let ponds = 0, clear = 1e9;
  for (let s = 0; s < M.length; s++) { if (!M[s] || lab[s] >= 0) continue; const st = [s]; lab[s] = ponds++;
    while (st.length) { const c = st.pop(), i = c % P.nx, j = (c - i) / P.nx;
      const q = near(P.x0 + (i + 0.5) * P.cell, P.z0 + (j + 0.5) * P.cell); clear = Math.min(clear, Math.abs(q.lat) - (q.lat > 0 ? T.br[q.i] : T.bl[q.i]));
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const I = i + a, J = j + b; if (I < 0 || J < 0 || I >= P.nx || J >= P.nz) continue; const m = J * P.nx + I; if (M[m] && lab[m] < 0) { lab[m] = lab[s]; st.push(m); } } } }
  const inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  check('scenery: terrain and land cover 300 m and more round the whole track; 4 grandstands (ZANDVOORT, NOORD-HOLLAND, KENNEMERLAND, NEDERLAND); the sand in 5 or more outlines; 4 or more buildings',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.map(s => s[7]).join() === 'ZANDVOORT,NOORD-HOLLAND,KENNEMERLAND,NEDERLAND' && sk.sand.length >= 5 && sk.bld.length / 6 >= 4,
    `${sk.sand.length} sand outlines, ${sk.bld.length / 6} buildings`);
  check('the ponds: the mask whole (its runs fill its cells), 8 or more ponds, each at least 3 m past the barriers', k === M.length && ponds >= 8 && clear >= 3, `${ponds} ponds, nearest ${clear.toFixed(1)} m past the barriers`);
}
// 7. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 10-25 % slower (a third less grip in the wet: docs/dez-sneg.md) (seed
// 13: with seed 11 a car spun in the rain in the melee off the grid, came to rest against the pit wall facing back and held the player
// behind it 3 s, a start's chance, not the track's: the seeds 12-16 have no rescue, dry or wet)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 13, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 600 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] && fin[0].finishTime, resc };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 3-5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 180 && d.win < 300, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 10-25 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.1 && w.win / d.win < 1.25, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
