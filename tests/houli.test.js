// Houli, Tajvan: the circuit at Yuemei on the Houli terrace north of Taichung (3.5 km, clockwise; docs/proge/houli.md, plan
// docs/dirkalisca-celine.md, »Novih pet«). The layout at its real length, clockwise; its corners by plain descriptions in their order round
// the lap, each turning its way, the chicane and the esses both ways; the heights (the terrace's slope: some 25 m round the lap, the grades
// held to 8.5 %); the pits on the right of the main straight, the player's box at the start line in the middle of the race building; the
// run-offs; the scenery data (terrain, land cover, the grandstand across the straight, the race building's outline, the hotels by the
// chicane, the temples, the villages, the karting by the corner named after it, the landmarks farther out: the big wheels, the rides, the
// railway's viaduct, the pylons; the horizon; the animals); the world builder of its own (js/world-houli.js); a whole AI race to the finish
// in the dry and in the rain.
//   node tests/houli.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'houli'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z) }; };
const named = (nm) => { const c = def.names.find(q => q[0] === nm); return c ? near(c[1], c[2]).d : NaN; };

// 1. the track: its name (a place and its country), a closed circuit of 4 laps, 3.5 km within 3 % (realKm 3.5), clockwise, not a test
// track and not pending; at least 400 degrees of turning a kilometre (the game's smoothed line: about 570)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Houli, Tajvan" (English "Houli, Taiwan"), a closed circuit, 4 laps, 3.5 km within 3 % (realKm 3.5), clockwise, not a test track, at least 400 °/km of turning',
    def.name === 'Houli, Tajvan' && def.en.name === 'Houli, Taiwan' && !T.open && def.laps === 4 && Math.abs(T.len / 3500 - 1) < 0.03 && def.realKm === 3.5 && area < 0 && !def.test && !def.pending && perKm > 400,
    `${T.len.toFixed(1)} m (${((T.len / 3500 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms, the circuit or the hotels), in their order round the lap from the start
// line, each turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the chicane and the two esses both
// ways; the double right one way only; the tightest radius on the centre line (the hairpins'), the nearest legs of the lap apart
{
  const want = { 'Prvi desni': [-1, 70], 'Levi pred lasnico': [1, 60], 'Jugozahodna lasnica': [-1, 100], 'Hitri desni': [-1, 45], 'Levi ob kartingu': [1, 80],
    'Vzhodni levi': [1, 60], 'Vzhodna lasnica': [-1, 120], 'Dvojni desni': [-1, 80], 'Levi v notranjosti': [1, 70], 'Zadnji ovinek': [1, 100] };
  const order = ['Prvi desni', 'Zahodna ravnina', 'Levi pred lasnico', 'Jugozahodna lasnica', 'Hitri desni', 'Levi ob kartingu', 'Severni esi', 'Severna ravnina',
    'Šikana pri hotelih', 'Vzhodni levi', 'Vzhodna lasnica', 'Južna ravnina', 'Dvojni desni', 'Levi v notranjosti', 'Notranji esi', 'Zadnji ovinek', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 17 named places in their order round the lap (the first right ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right at the first right, the south-west hairpin, the fast right, the east hairpin and the double right; left before the hairpin, by the karting, at the east left, in the infield and at the last corner',
    cs.length === 10 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  const rl = (nm, a, b) => { const d0 = named(nm); let r = 0, l = 0; for (let d = a; d <= b; d += T.ds) { const k = T.k[T.idx(d0 + T.startS + d)] * T.ds; if (k > 0) r += k; else l -= k; } return [Math.round(r * 180 / Math.PI), Math.round(l * 180 / Math.PI)]; };
  const sk = rl('Šikana pri hotelih', -50, 50), ne = rl('Severni esi', -80, 80), ie = rl('Notranji esi', -50, 50), dr = rl('Dvojni desni', -60, 60);
  check('corners: the chicane and the infield esses both ways (20 degrees and more right and left within 50 m), the north esses within 80 m; the double right only right (100 degrees and more)',
    [sk, ne, ie].every(([r, l]) => r >= 20 && l >= 20) && dr[0] >= 100 && dr[1] < 10,
    `the chicane right ${sk[0]}° left ${sk[1]}°, the north esses ${ne[0]}° / ${ne[1]}°, the infield esses ${ie[0]}° / ${ie[1]}°, the double right ${dr[0]}° / ${dr[1]}°`);
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 15 m radius (the hairpins the tightest); the legs of the lap at least 35 m apart (room for the run-offs between them)', 1 / kmax >= 15 && legs >= 35, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 20 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 20 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: the terrace's slope, the whole lap within 15-35 m (Copernicus less the canopy and the buildings: about 25 m), the steepest
// grade held to 8.5 %; the start line 236.7 m above the sea (the comment of the track file, the menu's graph)
{
  let lo = 1e9, hi = -1e9, g = 0; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i])); }
  const src = fs.readFileSync(path.join(ROOT, 'js', 'tracks', 'houli.js'), 'utf8'), m = src.match(/\((\d+(?:\.\d+)?) m a\.s\.l\.\)/);
  check('heights: the whole lap within 15-35 m, the steepest grade no more than 8.5 %, the start line 236.7 m above the sea', hi - lo > 15 && hi - lo < 35 && g < 0.0855 && m && +m[1] === 236.7,
    `${(hi - lo).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %, the start line ${m && m[1]} m a.s.l.`);
}
// 4. the pits: the lane on the right of the main straight from before the start line to after it, the straight no tighter than a 250 m
// radius along the boxes, the 13 crews' boxes in the lane round the start line (the player's at it: the middle of the race building), the
// pit wall along it; the main straight's sign before the start line. The run-offs: the barriers more than 3 m past the asphalt along more
// than 85 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = def.pitRow[0] - 10; d <= def.pitRow[1] + 20; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const dfs = named('Ciljna ravnina'), nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the right of the main straight past the start line, the straight no tighter than a 250 m radius along the boxes, 13 boxes in the lane (the player\'s at the start line), the pit wall along it',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 250 && dfs > T.len - 200 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] === 0 && def.pitRow[0] < 0 && def.pitRow[1] > 0 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.85 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/houli/build.py): terrain and land cover round the track (the circuit's lawns, the woods of the slopes, the
// fields and orchards, the built-up land of the villages); the grandstand (HOULI, covered, across the straight from the pits) and its
// outline, the race building's outline round the start line on the right; the buildings (OSM): the hotels by the chicane named after them,
// the temples; the villages' houses, the roads, the karting by the corner named after it; the landmarks farther out (OSM): the two big
// wheels (the tall one 126 m), the rides, the high-speed railway on its viaduct, the power lines' pylons; the horizon; the animals
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', cnt = [0, 0, 0, 0], rle = def.lc.rle;
  for (let k = 0; k < rle.length;) { const v = A64.indexOf(rle[k++]), cl = v >> 4; let run = (v & 15) + 1; if (run === 16) { let r; do { r = A64.indexOf(rle[k++]); run += r; } while (r === 63); } cnt[cl] += run; }
  const tot = cnt.reduce((a, b) => a + b, 0), main = def.stands[0];
  check('scenery: terrain and land cover 300 m and more round the whole track (the lawns 35 % or more, woods 15 %, fields 3 %, built-up land 10 % or more); 1 grandstand (HOULI, covered, across the straight from the pits, past the start line)',
    inGrid(def.dem) && inGrid(def.lc) && tot === def.lc.nx * def.lc.nz && cnt[0] / tot > 0.35 && cnt[1] / tot > 0.15 && cnt[2] / tot > 0.03 && cnt[3] / tot > 0.1 && def.stands.length === 1
      && main[7] === 'HOULI' && main[2] === -1 && main[4] === 1 && main[0] > 0 && main[1] > main[0] + 150,
    `land cover ${cnt.map(v => Math.round(v / tot * 100) + ' %').join(' / ')}, the grandstand ${main[0]} .. ${main[1]} m`);
  const out = (o) => o.filter(r => r[2] > r[1] && r[1] > 0);   // (the outlines [[d, near, far]] measured out from the centre line; 0 0 beyond their ends)
  const rb = out(sk.rb), gs = out(sk.gs);
  check('scenery: the race building\'s outline round the start line (from before -100 m to past 100 m) and the grandstand\'s along it (OSM), each 10 places and more',
    rb.length >= 10 && gs.length >= 10 && Math.min(...rb.map(r => r[0])) < -100 && Math.max(...rb.map(r => r[0])) > 100 && Math.abs(Math.min(...gs.map(r => r[0])) - main[0]) < 15 && Math.abs(Math.max(...gs.map(r => r[0])) - main[1]) < 15,
    `the race building ${rb.length} places ${Math.min(...rb.map(r => r[0]))} .. ${Math.max(...rb.map(r => r[0]))} m, the grandstand ${gs.length} places`);
  const B = sk.bld, dch = named('Šikana pri hotelih'); const hot = [], tem = [];
  for (let k = 0; k < B.length; k += 7) { const q = near(B[k], B[k + 1]); if (B[k + 6] === 5 && B[k + 5] >= 12) hot.push(q); if (B[k + 6] === 1) tem.push(q); }
  const byCh = hot.filter(q => q.off < 250 && q.d > dch - 60 && q.d < dch + 200);
  check('scenery: the buildings within 900 m (OSM, 50 and more): the hotels by the chicane (3 of 12 m and more within 250 m of the road there), the temples (2 and more); the villages\' houses (500 and more), the roads (20 and more)',
    B.length % 7 === 0 && B.length / 7 >= 50 && byCh.length >= 3 && tem.length >= 2 && sk.hs.length / 2 >= 500 && sk.road.length >= 20,
    `${B.length / 7} buildings, hotels by the chicane ${byCh.map(q => Math.round(q.d) + ' m / ' + Math.round(q.off) + ' m').join(', ')}, ${tem.length} temples, ${sk.hs.length / 2} houses, ${sk.road.length} roads`);
  const K = sk.kart.find(k => k[0] === 1) || [], cK = def.names.find(c => c[0] === 'Levi ob kartingu'); let kc = 1e9, kr = 1e9;
  for (let k = 1; k < K.length; k += 2) { kc = Math.min(kc, Math.hypot(K[k] - cK[1], K[k + 1] - cK[2])); kr = Math.min(kr, near(K[k], K[k + 1]).off); }
  check('scenery: the karting (OSM: its closed track, 50 points and more) within 100 m of the left named after it, nowhere nearer the road than 25 m', K.length >= 101 && kc < 100 && kr > 25,
    `${(K.length - 1) / 2} points, ${Math.round(kc)} m from the corner, nearest to the road ${kr.toFixed(1)} m`);
  const L = sk.lm, wh = L.wh.map(([x, z, , H]) => ({ H, off: near(x, z).off })), viad = L.rail.filter(r => r[0] === 1).length, pyl = L.pw.reduce((a, p) => a + (p.length - 1) / 3, 0);
  check('scenery: the landmarks farther out (OSM): 2 big wheels beyond the circuit (300 m and more from the road, the tall one 126 m), 4 rides and more, the railway\'s viaduct, 3 power lines and more (40 pylons and more); the horizon',
    wh.length === 2 && wh.every(w => w.off > 300) && Math.max(...wh.map(w => w.H)) === 126 && L.ride.length >= 4 && viad >= 3 && L.pw.length >= 3 && pyl >= 40 && !!def.far && def.far.base === 236.7,
    `wheels ${wh.map(w => w.H + ' m at ' + Math.round(w.off) + ' m').join(', ')}, ${L.ride.length} rides, ${viad} of ${L.rail.length} rail ways on the viaduct, ${L.pw.length} lines with ${pyl} pylons`);
  const Z = def.zivali || {};
  check('scenery: the animals of the glades by the road, not of the circuit\'s lawns (egrets, water buffaloes; a water tank, a vending machine)',
    ['egret', 'buffalo'].every(a => (Z.a || []).includes(a)) && ['waterTank', 'vending'].every(a => (Z.t || []).includes(a)) && !Z.open, JSON.stringify(Z));
}
// 6. the world: a builder of its own (js/world-houli.js: World.ext.houli, loaded after the shared flags of js/world-rbring.js), not a look
// on js/world-rbring.js's circuit builder; the track's file before it in index.html
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), w = fs.readFileSync(path.join(ROOT, 'js', 'world-houli.js'), 'utf8'), rb = fs.readFileSync(path.join(ROOT, 'js', 'world-rbring.js'), 'utf8');
  const iT = html.indexOf('js/tracks/houli.js'), iR = html.indexOf('js/world-rbring.js'), iW = html.indexOf('js/world-houli.js');
  check('world: its own builder (js/world-houli.js, World.ext.houli), after js/world-rbring.js in index.html, not one of its looks; the track file loaded before it',
    def.theme === 'houli' && iT > 0 && iR > 0 && iW > iR && iT < iW && /World\.ext\.houli\s*=/.test(w) && !/\bhouli\b/.test(rb), `theme ${def.theme}`);
}
// 7. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 3-15 % slower
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 600 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] && fin[0].finishTime, resc };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 2-5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 120 && d.win < 300, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 3-15 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
