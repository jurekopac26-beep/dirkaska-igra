// Envalira, Andora: the ice circuit under the Port d'Envalira (0.73 km, ~2,370 m; docs/proge/envalira.md, data tools/envalira/).
// The layout at its real length (the user's exception from 1-5 km), on ice (def.ice: the Ice category in the menu, the grip of ice in every
// season and weather, docs/dez-sneg.md); its corners by plain descriptions in their order round the lap; nearly flat; the buildings by it;
// a whole AI race to the finish on the ice, much slower than the same lap on dry tarmac, and the rain not counting on it.
//   node tests/envalira.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'envalira'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z) }; };

// 1. the track: its name (a place and its country), a closed circuit of 8 laps, 0.73 km within 3 % (realKm 0.73), on ice, not a test track
check('track: "Envalira, Andora" (English "Envalira, Andorra"), a closed circuit, 8 laps, 0.73 km within 3 % (realKm 0.73), on ice (def.ice), not a test track',
  def.name === 'Envalira, Andora' && def.en.name === 'Envalira, Andorra' && !T.open && def.laps === 8 && Math.abs(T.len / 730 - 1) < 0.03 && def.realKm === 0.73 && def.ice === true && !def.test && !def.pending,
  `${T.len.toFixed(1)} m (${((T.len / 730 - 1) * 100).toFixed(1)} %)`);
// 2. the corners by plain descriptions (no names of the centre, its people or races), in their order round the lap, each on the road
{
  const order = ['Prva lasnica', 'Levi lok', 'S-zavoji', 'Druga lasnica', 'Ciljna ravnina'];
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off }; });
  check('corners: the 5 named places in their order round the lap (the first hairpin ... the finish straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  check('track: the corners\' apexes (def.turns) each on the road, in their order round the lap',
    def.turns.length >= 4 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)), `${def.turns.length} apexes`);
}
// 3. the heights: nearly flat (under 15 m from the lowest to the highest, at about 2,370 m), the steepest grade under 8 %
{
  let lo = 1e9, hi = -1e9, g = 0; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i])); }
  check('heights: under 15 m from the lowest to the highest, the steepest grade under 8 %', hi - lo < 15 && g < 0.08, `${(hi - lo).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 4. the scenery data: terrain and land cover round the track, the buildings by it (OSM); no pits, no grandstands
check('scenery: terrain and land cover round the track, 4 or more buildings (OSM), no pits and no grandstands',
  !!def.dem && !!def.lc && (def.sk.bld || []).length / 6 >= 4 && !def.pit && !(def.stands || []).length, `${(def.sk.bld || []).length / 6} buildings`);

// 5. a whole race: 8 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue
const race = (rain, ice) => {
  const orig = Math.random; Math.random = seeded(3);
  const d = ice ? def : Object.assign({}, def, { ice: false }), TT = ice ? T : new C.Track(d);
  try {
    const r = new C.Race(TT, { numAI: 8, playerGrid: 8, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 420 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] && fin[0].finishTime, resc, gk: r.cold.gk };
  } finally { Math.random = orig; }
};
{
  const ice = race(0, true), dry = race(0, false), wet = race(1, true);
  check('grip on ice: x0.2 of dry tarmac (within the 11-23 % of docs/dez-sneg.md) in every weather; on the same layout without ice none', ice.gk === 0.2 && ice.gk >= 0.11 && ice.gk <= 0.23 && wet.gk === 0.2 && dry.gk === 1, `ice ${ice.gk}, rain on ice ${wet.gk}, dry tarmac ${dry.gk}`);
  check('race on ice: 9 cars, 2 laps, all to the finish, no rescue', ice.fin === 9 && ice.cars === 9 && !ice.resc, `${ice.fin}/${ice.cars}, winner ${ice.win && ice.win.toFixed(2)} s, ${ice.resc} rescues`);
  check('race on ice: the winner at least 30 % slower than on the same layout in the dry', ice.win / dry.win > 1.3, `ice ${ice.win && ice.win.toFixed(2)} s, dry tarmac ${dry.win && dry.win.toFixed(2)} s (${((ice.win / dry.win - 1) * 100).toFixed(0)} % slower)`);
  check('race on ice in the rain: all to the finish, no rescue, within 5 % of the dry ice (the rain does not count on ice)', wet.fin === 9 && !wet.resc && Math.abs(wet.win / ice.win - 1) < 0.05, `${wet.win && wet.win.toFixed(2)} s (${((wet.win / ice.win - 1) * 100).toFixed(1)} %)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
