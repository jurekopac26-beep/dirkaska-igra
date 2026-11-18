// Silkeborg, Danska: the circuit on the heath at Skellerup by Silkeborg (its long layout, 2.3 km, anticlockwise; docs/proge/silkeborg.md).
// The layout at its real length, anticlockwise, twisty (hardly a straight); its corners by plain descriptions in their order round the lap,
// each turning its way; the heights (nearly flat, the south loop lowest); the pits on the right of the finish straight past the start line;
// the scenery data (terrain, land cover, the sand, the burial mounds, the buildings and the fences); a whole AI race to the finish in the
// dry and in the rain.
//   node tests/silkeborg.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'silkeborg'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z) }; };

// 1. the track: its name (a place and its country), a closed circuit of 6 laps, 2.3 km within 3 % (realKm 2.3), anticlockwise, not a
// test track; twisty: at least 550 degrees of turning a kilometre (the game's smoothed line: about 606; the plan's 789 is of the OSM points 5 m apart)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: positive = anticlockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Silkeborg, Danska" (English "Silkeborg, Denmark"), a closed circuit, 6 laps, 2.3 km within 3 % (realKm 2.3), anticlockwise, not a test track, at least 550 °/km of turning',
    def.name === 'Silkeborg, Danska' && def.en.name === 'Silkeborg, Denmark' && !T.open && def.laps === 6 && Math.abs(T.len / 2300 - 1) < 0.03 && def.realKm === 2.3 && area > 0 && !def.test && !def.pending && perKm > 550,
    `${T.len.toFixed(1)} m (${((T.len / 2300 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the tightest radius on the centre line, the
// nearest legs of the lap apart
{
  const want = { 'Dvojni levi': [1, 60], 'Hitri desni': [-1, 20], 'Ovinek pri tribunah': [1, 90], 'Dvojni desni': [-1, 60], 'S-zavoji': [1, 60], 'Gozdni ovinek': [1, 90],
    'Dolgi levi': [1, 50], 'Ovinek pri gomili': [1, 90], 'Ovinek ob resavi': [-1, 50], 'Zadnji ovinek': [1, 60] };
  const order = ['Dvojni levi', 'Hitri desni', 'Ovinek pri tribunah', 'Dvojni desni', 'S-zavoji', 'Gozdni ovinek', 'Dolgi levi', 'Ovinek pri gomili', 'Ovinek ob resavi', 'Zadnji ovinek', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 11 named places in their order round the lap (the double left ... the finish straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: left at the double left, the grandstand corner, the esses, the forest corner, the long left, barrow corner and the last corner; right at the fast right, the double right and the heath corner',
    cs.length === 10 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 12 m radius; the legs of the lap at least 40 m apart (room for the run-offs between them)', 1 / kmax >= 12 && legs >= 40, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 14 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 14 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: nearly flat, 3-4.5 m from the highest (by the start, on the straight or the run to the double left) to the lowest (the
// south loop: between the long left and the heath corner); the steepest grade under 4 %
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const dLo = dS(iLo * T.ds), dHi = dS(iHi * T.ds);
  check('heights: 3-4.5 m from the highest (within 300 m of the start line) to the lowest (the south loop, 1.4-1.9 km), the steepest grade under 4 %',
    hi - lo > 3 && hi - lo < 4.5 && (dHi < 300 || dHi > T.len - 300) && dLo > 1400 && dLo < 1900 && g < 0.04, `${(hi - lo).toFixed(1)} m, highest at ${Math.round(dHi)} m, lowest at ${Math.round(dLo)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 4. the pits: the lane on the right of the finish straight from before the start line to after it, the straight no tighter than a 250 m
// radius along the boxes, the 13 crews' boxes in the lane, the pit wall along it; the start line on the finish straight's sign side
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the right of the finish straight past the start line, the straight no tighter than a 250 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall along it',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 250 && dfs > T.len - 200 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
}
// 5. the scenery data (tools/silkeborg/build.py): terrain and land cover round the track, the grandstands (named after the villages they
// face), the sand round the circuit (OSM), the three burial mounds (one by barrow corner, within 60 m of the road), the buildings and the fences
{
  const sk = def.sk, gomila = def.names.find(c => c[0] === 'Ovinek pri gomili'), dG = near(gomila[1], gomila[2]).d;
  const mounds = sk.mounds.map(([x, z, r, h]) => ({ ...near(x, z), r, h })), byCorner = mounds.find(m => m.off < 60 && Math.abs(m.d - dG) < 80);
  const inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  check('scenery: terrain and land cover 300 m and more round the whole track; 2 grandstands (SKELLERUP, HÅRUP); the sand (5 or more outlines), 3 burial mounds 2-3 m high (one by barrow corner, within 60 m of the road), buildings and fences',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.length === 2 && def.stands.map(s => s[7]).join() === 'SKELLERUP,HÅRUP' && sk.sand.length >= 5 && sk.sand.every(p => p.length >= 8)
      && sk.mounds.length === 3 && mounds.every(m => m.h >= 2 && m.h <= 3) && !!byCorner && sk.bld.length / 6 >= 8 && sk.fence.length >= 8,
    `${sk.sand.length} sand outlines, mounds ${mounds.map(m => Math.round(m.off) + ' m off at ' + Math.round(m.d) + ' m').join(', ')}, ${sk.bld.length / 6} buildings, ${sk.fence.length} fences`);
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
