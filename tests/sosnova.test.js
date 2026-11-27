// Sosnová, Češka: the circuit on the meadows by the village of Sosnová near Česká Lípa (1.7 km, clockwise; docs/proge/sosnova.md).
// The layout at its real length, clockwise, twisty (four hairpins and a chicane); its corners by plain descriptions in their order round
// the lap, each turning its way; almost flat; the pits (a short lane left of the finish straight, 7 boxes, the pit wall, the paddock moved
// back: brez vira (izjema, odločitev Mateja 27. 11.)); the run-offs, the
// barriers nowhere folding back on themselves (def.walls on the inside of the tight bends between bends the other way); the scenery data
// (terrain, land cover, the streams under the circuit, the power lines over it, the buildings); the most rivals its flying start takes;
// a whole AI race in the dry and in the rain.
//   node tests/sosnova.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'sosnova'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };
const turnIn = (s0, s1) => { let a = 0; for (let d = s0; d <= s1; d += T.ds) a += T.k[T.idx(T.startS + d)] * T.ds; return -a * 180 / Math.PI; };   // degrees turned from s0 to s1 m after the line (Track.k > 0: a right-hander; here + left)

// 1. the track: its name (a place and its country), a closed circuit of 7 laps, 1.7 km within 3 % (realKm 1.7), clockwise, not a test
// track nor one waiting for a choice; twisty: at least 800 degrees of turning a kilometre (the game's smoothed line: about 960); the
// most rivals 60 (its flying start's column: tests/rivals-n.test.js)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Sosnová, Češka" (English "Sosnová, Czechia"), a closed circuit, 7 laps, 1.7 km within 3 % (realKm 1.7), clockwise, not a test track, at least 800 °/km of turning, at most 60 rivals',
    def.name === 'Sosnová, Češka' && def.en.name === 'Sosnová, Czechia' && !T.open && def.laps === 7 && Math.abs(T.len / 1700 - 1) < 0.03 && def.realKm === 1.7 && area < 0 && !def.test && !def.pending
      && perKm > 800 && def.maxRivals === 60,
    `${T.len.toFixed(1)} m (${((T.len / 1700 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 35 m of its place; the chicane and the esses a left and a right
// (the turning in the 35 m before their place and after it); the tightest radius on the centre line (the chicane, eased from OSM's 6 m),
// the nearest legs of the lap apart
{
  const want = { 'Levi za ciljem': [1, 25], 'Spodnja lasnica': [-1, 150], 'Dolgi levi': [1, 90], 'Zahodna lasnica': [-1, 90], 'Desni čez potok': [-1, 25], 'Hitri desni': [-1, 45],
    'Vzhodna lasnica': [-1, 130], 'Dvojni levi': [1, 80], 'Zadnja lasnica': [-1, 120] };
  const order = ['Levi za ciljem', 'Spodnja lasnica', 'Šikana', 'Dolgi levi', 'Zahodna ravnina', 'Zahodna lasnica', 'Desni čez potok', 'Severna ravnina', 'Hitri desni', 'Esovka',
    'Vzhodna lasnica', 'Dvojni levi', 'Zadnja lasnica', 'Ciljna ravnina'];
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turnIn(q.d - 35, q.d + 35), a: turnIn(q.d - 35, q.d), b: turnIn(q.d, q.d + 35) }; });
  check('corners: the 14 named places in their order round the lap (the left past the line ... the finish straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: left past the line, at the long left and the double left; right at the lower, the west, the east and the last hairpin, the right over the brook and the fast right',
    cs.length === 9 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  const ch = at.find(c => c.nm === 'Šikana'), es = at.find(c => c.nm === 'Esovka');
  check('the chicane: a left, then a right (at least 25° each); the esses: a left, then a right (at least 20° each)', ch.a > 25 && ch.b < -25 && es.a > 20 && es.b < -20,
    `chicane ${Math.round(ch.a)}° / ${Math.round(ch.b)}°, esses ${Math.round(es.a)}° / ${Math.round(es.b)}°`);
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 12 m radius (the chicane, eased); the legs of the lap at least 20 m apart', 1 / kmax >= 12 && legs >= 20, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 14 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 14 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: almost flat, 2-5 m from the lowest (by the west hairpin, 500-650 m after the start line) to the highest (by the last
// hairpin, 1.45-1.65 km); the steepest grade under 4 %
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const dLo = dS(iLo * T.ds), dHi = dS(iHi * T.ds);
  check('heights: 2-5 m from the lowest (by the west hairpin, 500-650 m after the start line) to the highest (by the last hairpin, 1.45-1.65 km), the steepest grade under 4 %',
    hi - lo > 2 && hi - lo < 5 && dLo > 500 && dLo < 650 && dHi > 1450 && dHi < 1650 && g < 0.04, `${(hi - lo).toFixed(1)} m, lowest at ${Math.round(dLo)} m, highest at ${Math.round(dHi)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 4. the pits (brez vira (izjema, odločitev Mateja 27. 11.): OSM has no pit lane here): a short lane on the left of the finish straight
// (def.pit; full width 60 m and more, 7 boxes 10 m apart along it, the player's one of them: def.pitRow; the AI crews share them) behind
// the pit wall 1 m past the road's edge, from before the lane's full width to past its end; in front of the paddock's garages (OSM, moved
// 5.6 m back: their fronts by the lane's apron, 17-19 m from the centre line); the start line on the finish straight, the left past the line
// 60-110 m after it; the run-offs: the barriers more than 3 m past the asphalt all round but for the pit wall, the paddock's side held 4 m
// past it before and after it; nowhere the barrier folds back on itself (a fence or a tyre wall going back along the road: the run-off of
// the bend before or after reaching round the inside of a tight bend)
{
  const P = def.pit, B = T.crewBoxes(), pw = def.walls.find(w => w[2] === -1 && w[3] === 1);
  let wallOk = !!pw; if (pw) for (let d = pw[0] + 2; d <= pw[1] - 2; d += T.ds) if (Math.abs(T.bl[T.idx(T.startS + d)] - T.w - 1) > 0.05) wallOk = false;
  let full = 0; for (let d = -150; d <= 50; d += 1) { const p = T.pitAt(T.startS + d); if (p && p.t > 0.999) full++; }
  const gar = []; for (let k = 0; k < def.sk.bld.length; k += 7) if (def.sk.bld[k + 6] === 4) { const q = near(def.sk.bld[k], def.sk.bld[k + 1]); gar.push(-q.lat - def.sk.bld[k + 3] / 2); }
  check('pits: a short lane on the left (def.pit) behind the pit wall 1 m past the road\'s edge, 60 m and more at full width, 7 boxes 10 m apart along it, the player\'s one of them; the garages\' fronts 17-19 m from the centre line',
    !!P && P[0] < 0 && !!def.pitRow && full >= 60 && B.length === 7 && B.every((b, i) => !i || b - B[i - 1] === 10) && B.includes(P[3]) && !!pw && wallOk
      && pw[0] <= -80 && pw[1] >= -10 && gar.length >= 2 && gar.every(f => f > 17 && f < 19),
    (P ? `pit ${P.join(' ')}, ${full} m full width, ${B.length} boxes; ` : 'no def.pit; ') + (pw ? `wall ${pw[0]} .. ${pw[1]} m; ` : 'no pit wall; ') + `garages' fronts ${gar.map(f => f.toFixed(1)).join(', ')} m`);
  const lp = def.names.find(c => c[0] === 'Levi za ciljem'), dlp = near(lp[1], lp[2]).d;
  let kmax = 0; for (let d = -20; d <= 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  check('the start line on the finish straight (no bend under a 300 m radius 20 m before it to 30 m after it), the left past the line 60-110 m after it',
    1 / kmax > 300 && dlp > 60 && dlp < 110, `the left ${Math.round(dlp)} m after the line, tightest radius by the line ${(1 / kmax).toFixed(0)} m`);
  const inWall = (i) => { let d = dS(i * T.ds); if (d > T.len / 2) d -= T.len; return d > pw[0] - 8 && d < pw[1] + 8; };
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const [b, w] of [[T.bl[i], inWall(i)], [T.br[i], false]]) { if (w) continue; const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  let pad = 1e9; for (const d of [-110, -100, -95, 10, 15, 20]) pad = Math.min(pad, Math.abs(T.bl[T.idx(T.startS + d)] - T.w - 4));
  const folds = [];
  for (const [nm, s, Bb] of [['left', -1, T.bl], ['right', 1, T.br]]) for (let i = 0; i < T.N; i++) {
    const j = (i + 1) % T.N, bx = T.px[j] + T.nx[j] * s * Bb[j] - T.px[i] - T.nx[i] * s * Bb[i], bz = T.pz[j] + T.nz[j] * s * Bb[j] - T.pz[i] - T.nz[i] * s * Bb[i];
    if (bx * (T.px[j] - T.px[i]) + bz * (T.pz[j] - T.pz[i]) < 0) folds.push(`${nm} ${Math.round(dS(i * T.ds))} m`); }
  check('run-offs: the barriers more than 3 m past the asphalt all round but for the pit wall, the paddock\'s side of the straight 4 m past it before and after it; no barrier folding back on itself (one stretch at most, 2-6 m)',
    wide === all && min >= 3.4 && pad < 0.1 && folds.length <= 2, `nearest ${min.toFixed(1)} m, the paddock's side ${(4 + pad).toFixed(1)} m; folds: ${folds.join(', ') || 'none'}`);
}
// 5. the scenery data (tools/sosnova/build.py): terrain and land cover round the track, the grandstand (named after the village); the
// streams (OSM): the open one under the circuit once (in a culvert by the esses), the piped one under the long right; the power lines
// (OSM): three of them over the circuit, ten times or more (the 400 kV one twice), their poles in the run-offs only in the wide one on the left
// before the east hairpin (js/world-sosnova.js leaves them out and carries the wires across); the buildings
{
  const sk = def.sk;
  const crossings = (pts) => { const q = pts.map(([x, z]) => near(x, z)), cross = []; for (let k = 1; k < q.length; k++) if (q[k].off < 40 && q[k - 1].off < 40 && Math.sign(q[k].lat) !== Math.sign(q[k - 1].lat)) cross.push(q[k].d); return cross; };
  const dense = (rv, step) => { const pts = []; for (let k = 0; k + 3 < rv.length; k += 2) { const m = Math.max(1, Math.ceil(Math.hypot(rv[k + 2] - rv[k], rv[k + 3] - rv[k + 1]) / step)); for (let q = 0; q < m; q++) pts.push([rv[k] + (rv[k + 2] - rv[k]) * q / m, rv[k + 1] + (rv[k + 3] - rv[k + 1]) * q / m]); } pts.push([rv[rv.length - 2], rv[rv.length - 1]]); return pts; };
  const open = [], piped = [];
  for (const [p, rv] of sk.brooks) (p ? piped : open).push(...crossings(dense(rv, 2)));
  const es = def.names.find(c => c[0] === 'Esovka'), dr = def.names.find(c => c[0] === 'Desni čez potok'), des = near(es[1], es[2]).d, ddr = near(dr[1], dr[2]).d;
  const inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  check('scenery: terrain and land cover 300 m and more round the whole track; 1 grandstand (SOSNOVÁ); 8 or more buildings (the paddock\'s garages, its office)',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.length === 1 && def.stands[0][7] === 'SOSNOVÁ' && sk.bld.length / 7 >= 8 && sk.bld.some((v, k) => k % 7 === 6 && v === 4), `${sk.bld.length / 7} buildings`);
  check('the streams: the open one under the circuit once (by the esses, within 60 m), the piped one under it once (by the right over the brook, within 40 m)',
    open.length === 1 && Math.abs(open[0] - des) < 60 && piped.length === 1 && Math.abs(piped[0] - ddr) < 40, `the open one at ${open.map(Math.round).join(', ')} m, the piped one at ${piped.map(Math.round).join(', ')} m`);
  let over = 0, times = 0, kv400 = 0, pylons = 0; const inside = [];
  for (const [kv, p] of sk.power) {
    const pts = []; for (let k = 0; k + 2 < p.length; k += 3) pts.push([p[k], p[k + 1]]);
    const c = crossings(dense(pts.flat(), 2)); if (c.length) over++; times += c.length; if (kv === 400) kv400 += c.length;
    for (const [x, z] of pts) { const q = near(x, z); pylons++; if (Math.abs(q.lat) < (q.lat > 0 ? T.br[q.i] : T.bl[q.i]) + 1) inside.push(q); }
  }
  const eh = near(...def.names.find(c => c[0] === 'Vzhodna lasnica').slice(1, 3)).d;
  check('the power lines: three over the circuit, ten times or more, the 400 kV one twice; their poles inside the barriers only in the wide run-off on the left before the east hairpin (within 100 m before it)',
    over === 3 && times >= 10 && kv400 === 2 && inside.every(q => q.lat < 0 && q.d < eh && q.d > eh - 100),
    `${over} lines over it ${times} times, the 400 kV line ${kv400} times; ${inside.length} of ${pylons} poles inside the barriers (at ${inside.map(q => Math.round(q.d)).join(', ')} m; the east hairpin at ${Math.round(eh)} m)`);
}
// 6. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 10-25 % slower (a third less grip in the wet: docs/dez-sneg.md)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 420 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] && fin[0].finishTime, resc };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 1.5-3 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 90 && d.win < 180, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 10-25 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.1 && w.win / d.win < 1.25, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
