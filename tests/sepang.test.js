// Sepang, Malezija: the circuit among the oil palm estates south of Kuala Lumpur (5.53 km, clockwise; docs/proge/sepang.md).
// The layout at its real length, clockwise; its corners by plain descriptions in their order round the lap, each turning its way (ten
// rights and five lefts, the three hairpins of Turns 2, 9 and 15); the heights (Turn 3 in the valley the lowest, Turn 11 on the hill the
// highest, about 21 m apart; the drop from Turn 2 the steepest; both long straights level); the pits on the right of the main straight; the
// big grandstand between the straights (a stand on the left of each, a wall in front of each); the wide run-offs; the scenery data
// (terrain, land cover, the seven grandstands named after the places round it, the buildings, the service roads, the lone trees; no names
// of the circuit); a whole AI race in the dry and in the rain.
//   node tests/sepang.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'sepang'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };
const gradeMax = (a, b) => { let g = 0; for (let d = a; d <= b; d += T.ds) g = Math.max(g, Math.abs(T.grade[T.idx(T.startS + d)])); return g; };

// 1. the track: its name (a place and its country), a closed circuit of 2 laps, 5.543 km within 3 % (realKm 5.543), clockwise, not a
// test track nor one waiting for a choice; at least 250 degrees of turning a kilometre (the game's smoothed line: about 317)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: positive = anticlockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Sepang, Malezija" (English "Sepang, Malaysia"), a closed circuit, 2 laps, 5.54 km within 3 % (realKm 5.543), clockwise, not a test track, at least 250 °/km of turning',
    def.name === 'Sepang, Malezija' && def.en.name === 'Sepang, Malaysia' && !T.open && def.laps === 2 && Math.abs(T.len / 5543 - 1) < 0.03 && def.realKm === 5.543 && area < 0 && !def.test && !def.pending && perKm > 250,
    `${T.len.toFixed(1)} m (${((T.len / 5543 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the tightest radius on the centre line (the
// hairpin of Turn 9), the nearest legs of the lap apart (its two legs); the 15 turns' apexes in their order
{
  const want = { 'Zapirajoči se desni': [-1, 110], 'Leva lasnica': [1, 120], 'Hitri desni v dolini': [-1, 25], 'Ostri desni na vrhu': [-1, 85], 'Hitri levi': [1, 35], 'Hitri desni': [-1, 40],
    'Dvojni desni': [-1, 45], 'Lasnica na dnu': [1, 120], 'Desni v klanec': [-1, 40], 'Desni na vrhu hriba': [-1, 75], 'Levi navzdol': [1, 50], 'Dolgi desni': [-1, 25],
    'Desni na zadnjo ravnino': [-1, 85], 'Zadnja lasnica': [1, 120] };
  const order = ['Zapirajoči se desni', 'Leva lasnica', 'Hitri desni v dolini', 'Vzpon iz doline', 'Ostri desni na vrhu', 'Hitri levi', 'Hitri desni', 'Dvojni desni', 'Spust proti lasnici',
    'Lasnica na dnu', 'Desni v klanec', 'Desni na vrhu hriba', 'Levi navzdol', 'Dolgi desni', 'Desni na zadnjo ravnino', 'Zadnja ravnina', 'Zadnja lasnica', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 18 named places in their order round the lap (the tightening right ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right into Turn 1, in the valley, at the top, the fast right, the double right, up the hill, on the crest, the long right and onto the back straight; left at the three hairpins, the fast left and down the hill',
    cs.length === 14 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0, iK = 0; for (let i = 0; i < T.N; i++) if (Math.abs(T.k[i]) > kmax) { kmax = Math.abs(T.k[i]); iK = i; }
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 14 m radius, the tightest the hairpin of Turn 9 (3.1-3.25 km); the legs of the lap at least 40 m apart', 1 / kmax >= 14 && dS(iK * T.ds) > 3100 && dS(iK * T.ds) < 3250 && legs >= 40,
    `tightest radius ${(1 / kmax).toFixed(1)} m at ${Math.round(dS(iK * T.ds))} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 15 turns\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 15 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: 18-25 m from the lowest (Turn 3 in the valley, 1.0-1.3 km after the start line) to the highest (Turn 11 on the hill,
// 3.35-3.6 km); the steepest grade 4.5-7 % down from Turn 2 (0.8-1.05 km); both long straights level (the pits and the big grandstand
// between them: the main straight under 0.5 % from 200 m before the line to 500 m after it, the back straight under 1 % to its brakes)
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0, iG = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } if (Math.abs(T.grade[i]) > g) { g = Math.abs(T.grade[i]); iG = i; } }
  const dLo = dS(iLo * T.ds), dHi = dS(iHi * T.ds), dG = dS(iG * T.ds), gm = gradeMax(-200, 500), gb = gradeMax(4300, 5080);
  check('heights: 18-25 m from the lowest (Turn 3, 1.0-1.3 km after the start line) to the highest (Turn 11, 3.35-3.6 km), the steepest grade 4.5-7 % down from Turn 2 (0.8-1.05 km), the main straight under 0.5 %, the back straight under 1 %',
    hi - lo > 18 && hi - lo < 25 && dLo > 1000 && dLo < 1300 && dHi > 3350 && dHi < 3600 && g > 0.045 && g < 0.07 && T.grade[iG] < 0 && dG > 800 && dG < 1050 && gm < 0.005 && gb < 0.01,
    `${(hi - lo).toFixed(1)} m, lowest at ${Math.round(dLo)} m, highest at ${Math.round(dHi)} m, steepest ${(g * 100).toFixed(1)} % at ${Math.round(dG)} m, the main straight ${(gm * 100).toFixed(2)} %, the back straight ${(gb * 100).toFixed(2)} %`);
}
// 4. the pits: the lane on the right of the main straight from before the start line to after it, the straight no tighter than a 300 m
// radius along it, the 13 crews' boxes in the lane, the pit wall on the right along it; the start line on the main straight's sign side;
// the big grandstand between the straights: a roofed stand on the left of each (SEPANG and SELANGOR, its two faces), a wall in front of each;
// the run-offs: the barriers more than 3 m past the asphalt along more than 80 % of the lap (both sides; the walls the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the right of the main straight past the start line, the straight no tighter than a 300 m radius along it, 13 boxes in the lane (the player\'s among them), the pit wall on the right along it',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 300 && dfs > T.len - 400 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along it ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  const st = (nm) => def.stands.find(s => s[7] === nm), main = st('SEPANG'), back = st('SELANGOR'), wallBy = (s) => def.walls.some(w => w[2] === -1 && w[0] <= s[0] && w[1] >= s[1]);
  check('the big grandstand between the straights: SEPANG roofed on the left of the main straight (over 400 m), SELANGOR roofed on the left of the back straight (over 400 m), a wall in front of each',
    !!main && !!back && main[2] === -1 && back[2] === -1 && main[4] && back[4] && main[0] < 0 && main[1] > 200 && main[1] - main[0] > 400 && back[0] > 4300 && back[1] < 5100 && back[1] - back[0] > 400 && wallBy(main) && wallBy(back),
    `SEPANG ${main && main[0]} .. ${main && main[1]} m, SELANGOR ${back && back[0]} .. ${back && back[1]} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 80 % of the lap, nowhere nearer than the walls (2.5 m)', wide / all > 0.8 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/sepang/build.py): terrain and land cover round the track, the seven grandstands (named after the places round
// it: the big one's two faces, the one at Turns 1 and 2 and the one before the double right roofed), the buildings, the service roads (OSM)
// outside the barriers, the lone trees (OSM); only place names
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const roofed = def.stands.filter(s => s[4]).map(s => s[7]).join();
  check('scenery: terrain and land cover 300 m and more round the whole track; 7 grandstands (SEPANG, PUTRAJAYA, BANTING, NILAI, DENGKIL, SALAK TINGGI, SELANGOR), SEPANG, PUTRAJAYA, NILAI and SELANGOR roofed; 3 or more buildings; 20 or more lone trees',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.map(s => s[7]).join() === 'SEPANG,PUTRAJAYA,BANTING,NILAI,DENGKIL,SALAK TINGGI,SELANGOR' && roofed === 'SEPANG,PUTRAJAYA,NILAI,SELANGOR'
      && sk.bld.length / 6 >= 3 && sk.tr.length / 3 >= 20,
    `${sk.bld.length / 6} buildings, ${sk.tr.length / 3} lone trees, roofed ${roofed}`);
  let nr = 0, np = 0, inb = 0, short = 0; for (let k = 0; k < sk.svc.length;) { const m = sk.svc[k]; nr++; if (m < 2) short++;
    for (let q = 0; q < m; q++) { const qq = near(sk.svc[k + 1 + q * 2], sk.svc[k + 2 + q * 2]); np++; if (Math.abs(qq.lat) < (qq.lat > 0 ? T.br[qq.i] : T.bl[qq.i])) inb++; } k += 1 + m * 2; }
  check('scenery: 10 or more service roads (OSM), each of 2 points or more, their points outside the barriers (at most 8 % where they meet the run-offs: the marshals\' lanes into the wide gravel traps and onto the track, which the world leaves out up to 4 m past the barriers)', nr >= 10 && !short && inb / np <= 0.08, `${nr} roads, ${np} points, ${inb} inside the barriers`);
  const words = JSON.stringify([def.name, def.desc, def.en, def.names, def.stands.map(s => s[7])]);
  check('names: only places and plain descriptions (no name of the circuit, its races, sponsors or the firms its corners and stands are named after)',
    !/park|formula|grand prix|\bgp\b|international|\bsic\b|genting|klia|berjaya|tioman|sunway|pangkor|langkawi|kenyir|penang|petronas|\bk1\b|hillstand/i.test(words));
}
// 6. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 10-25 % slower (a third less grip in the wet: docs/dez-sneg.md)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 900 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] && fin[0].finishTime, resc };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 3.5-5.5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 210 && d.win < 330, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 10-25 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.1 && w.win / d.win < 1.25, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
