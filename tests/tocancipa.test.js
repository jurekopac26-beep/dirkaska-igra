// Tocancipá, Kolumbija: the circuit on the Bogotá savanna by Tocancipá, 2,600 m above the sea (2.7 km, clockwise; docs/proge/tocancipa.md,
// plan docs/dirkalisca-celine.md, »Novih pet«). The layout at its real length, clockwise; its corners by plain descriptions in their order
// round the lap, each turning its way, the two loops round the ponds, the middle esses both ways; the heights (the savanna is flat: the lap
// within 3 m, the grades held to 3 %); the pits on the right of the main straight, the player's box at the start line in the middle of the
// pit building; the run-offs; the scenery data (terrain, land cover, the grandstand across the straight, the pit building's outline, the
// buildings, the villages' houses, the flower farms' greenhouses, the roads, the circuit's links and its dirt track, the karting, the two
// ponds, the landmarks farther out: the power station's stacks, buildings and coal yards, the pylons; the horizon; the animals); the world
// builder of its own (js/world-tocancipa.js); a whole AI race to the finish in the dry and in the rain.
//   node tests/tocancipa.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'tocancipa'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z) }; };
const named = (nm) => { const c = def.names.find(q => q[0] === nm); return c ? near(c[1], c[2]).d : NaN; };
const rl = (nm, a, b) => { const d0 = named(nm); let r = 0, l = 0; for (let d = a; d <= b; d += T.ds) { const k = T.k[T.idx(d0 + T.startS + d)] * T.ds; if (k > 0) r += k; else l -= k; } return [Math.round(r * 180 / Math.PI), Math.round(l * 180 / Math.PI)]; };   // (degrees right, left)

// 1. the track: its name (a place and its country), a closed circuit of 5 laps, 2.725 km within 3 % (realKm 2.725), clockwise, not a test
// track and not pending; at least 400 degrees of turning a kilometre (the game's smoothed line: about 420)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Tocancipá, Kolumbija" (English "Tocancipá, Colombia"), a closed circuit, 5 laps, 2.725 km within 3 % (realKm 2.725), clockwise, not a test track, at least 400 °/km of turning',
    def.name === 'Tocancipá, Kolumbija' && def.en.name === 'Tocancipá, Colombia' && !T.open && def.laps === 5 && Math.abs(T.len / 2725 - 1) < 0.03 && def.realKm === 2.725 && area < 0 && !def.test && !def.pending && perKm > 400,
    `${T.len.toFixed(1)} m (${((T.len / 2725 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms, the circuit or the power station), in their order round the lap from the
// start line, each turning its way by at least the given angle within the given distance of its place (the loops round the ponds over
// 100 m); the middle esses both ways; the tightest radius on the centre line, the nearest legs of the lap apart
{
  const want = { 'Prvi desni': [-1, 70, 50], 'Zahodna zanka': [-1, 100, 50], 'Levi za zanko': [1, 50, 50], 'Dolgi levi': [1, 60, 100], 'Vzhodna zanka': [-1, 100, 100],
    'Levi pred lasnico': [1, 25, 50], 'Južna lasnica': [-1, 100, 50], 'Levi za lasnico': [1, 80, 50], 'Zadnji ovinek': [-1, 60, 50] };
  const order = ['Prvi desni', 'Zahodna zanka', 'Levi za zanko', 'Srednji esi', 'Dolgi levi', 'Vzhodna ravnina', 'Vzhodna zanka', 'Povratna ravnina', 'Levi pred lasnico',
    'Južna lasnica', 'Levi za lasnico', 'Zadnji ovinek', 'Ciljna ravnina'];
  const turn = (s, h) => { let a = 0; for (let d = -h; d <= h; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds, want[nm] ? want[nm][2] : 50) }; });
  check('corners: the 13 named places in their order round the lap (the first right ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right at the first right, round the west loop and the east loop, at the south hairpin and the last corner; left after the west loop, the long left, before and after the hairpin',
    cs.length === 9 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  const es = rl('Srednji esi', -60, 120), wl = rl('Zahodna zanka', -120, 120), el = rl('Vzhodna zanka', -150, 150);
  check('corners: the middle esses both ways (30 degrees and more right and left); the loops round the ponds more than 150 degrees right, the east one only right',
    es[0] >= 30 && es[1] >= 30 && wl[0] >= 150 && el[0] >= 150 && el[1] < 10, `the esses right ${es[0]}° left ${es[1]}°, the west loop ${wl[0]}° / ${wl[1]}°, the east loop ${el[0]}° / ${el[1]}°`);
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 25 m radius (the hairpin the tightest); the legs of the lap at least 35 m apart (room for the run-offs between them)', 1 / kmax >= 25 && legs >= 35, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 13 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 13 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: the savanna is flat, the whole lap within 1-3.5 m (Copernicus less the canopy and the buildings, smoothed), the steepest
// grade held to 3 %; the start line 2563.1 m above the sea (the comment of the track file, the menu's graph)
{
  let lo = 1e9, hi = -1e9, g = 0; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i])); }
  const src = fs.readFileSync(path.join(ROOT, 'js', 'tracks', 'tocancipa.js'), 'utf8'), m = src.match(/\((\d+(?:\.\d+)?) m a\.s\.l\.\)/);
  check('heights: the whole lap within 1-3.5 m, the steepest grade no more than 3 %, the start line 2563.1 m above the sea', hi - lo > 1 && hi - lo < 3.5 && g < 0.0305 && m && +m[1] === 2563.1,
    `${(hi - lo).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %, the start line ${m && m[1]} m a.s.l.`);
}
// 4. the pits: the lane on the right of the main straight from before the start line to after it, the straight no tighter than a 250 m
// radius along the boxes, the 13 crews' boxes in the lane round the start line (the player's at it: the middle of the pit building), the
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
// 5. the scenery data (tools/tocancipa/build.py): terrain and land cover round the track (the circuit's lawns and the pastures, the
// plantations, the fields, the built-up land of the villages, the farms and the industrial park); the grandstand (TOCANCIPÁ, covered,
// across the straight from the pits, before the start line) and its outline, the pit building's outline round the start line on the right;
// the buildings (OSM), the houses, the flower farms' greenhouses, the roads, the circuit's links and its dirt track, the karting; the two
// ponds; the landmarks farther out (OSM): the power station's stacks, its buildings and coal yards, a factory's stack, the power lines'
// pylons; the horizon; the animals
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', cnt = [0, 0, 0, 0], rle = def.lc.rle;
  for (let k = 0; k < rle.length;) { const v = A64.indexOf(rle[k++]), cl = v >> 4; let run = (v & 15) + 1; if (run === 16) { let r; do { r = A64.indexOf(rle[k++]); run += r; } while (r === 63); } cnt[cl] += run; }
  const tot = cnt.reduce((a, b) => a + b, 0), main = def.stands[0];
  check('scenery: terrain and land cover 300 m and more round the whole track (the lawns and pastures 50 % or more, woods 5 %, fields 1 %, built-up land 10 % or more); 1 grandstand (TOCANCIPÁ, covered, across the straight from the pits, before the start line)',
    inGrid(def.dem) && inGrid(def.lc) && tot === def.lc.nx * def.lc.nz && cnt[0] / tot > 0.5 && cnt[1] / tot > 0.05 && cnt[2] / tot > 0.01 && cnt[3] / tot > 0.1 && def.stands.length === 1
      && main[7] === 'TOCANCIPÁ' && main[2] === -1 && main[4] === 1 && main[0] < -50 && main[1] <= 0 && main[1] > main[0] + 50,
    `land cover ${cnt.map(v => Math.round(v / tot * 100) + ' %').join(' / ')}, the grandstand ${main[0]} .. ${main[1]} m`);
  const out = (o) => o.filter(r => r[2] > r[1] && r[1] > 0);   // (the outlines [[d, near, far]] measured out from the centre line; 0 0 beyond their ends)
  const rb = out(sk.rb), gs = out(sk.gs);
  check('scenery: the pit building\'s outline round the start line (from before -60 m to past 60 m) and the grandstand\'s along it (OSM), each 10 places and more',
    rb.length >= 10 && gs.length >= 10 && Math.min(...rb.map(r => r[0])) < -60 && Math.max(...rb.map(r => r[0])) > 60 && Math.abs(Math.min(...gs.map(r => r[0])) - main[0]) < 15 && Math.abs(Math.max(...gs.map(r => r[0])) - main[1]) < 15,
    `the pit building ${rb.length} places ${Math.min(...rb.map(r => r[0]))} .. ${Math.max(...rb.map(r => r[0]))} m, the grandstand ${gs.length} places`);
  let ghn = 0; for (let k = 2; k < sk.gh.r.length; k += 3) ghn += sk.gh.r[k];
  const kartPts = sk.kart.reduce((a, k) => a + (k.length - 1) / 2, 0);
  check('scenery: the buildings within 900 m (OSM, 30 and more), the houses (60 and more), the greenhouses (500 and more 10 m cells), the roads (20 and more), the circuit\'s links (3 and more) and its dirt track, the karting (50 points and more)',
    sk.bld.length % 7 === 0 && sk.bld.length / 7 >= 30 && sk.hs.length / 2 >= 60 && ghn >= 500 && sk.road.length >= 20 && sk.lk.length >= 3 && sk.dt.length >= 1 && kartPts >= 50,
    `${sk.bld.length / 7} buildings, ${sk.hs.length / 2} houses, ${ghn} greenhouse cells, ${sk.road.length} roads, ${sk.lk.length} links, ${sk.dt.length} dirt track, ${sk.kart.length} karting ways with ${kartPts} points`);
  const S = sk.sea, bin = Buffer.from(S.rle, 'base64'), q = new Uint8Array(S.nx * S.nz); let k = 0;
  for (let i = 0; i < bin.length && k < q.length;) { const b = bin[i]; if (b === 255) { q.fill(bin[i + 1], k, k + bin[i + 2]); k += bin[i + 2]; i += 3; } else { q[k++] = b; i++; } }
  let wet = 0; for (let j = 0; j < q.length; j++) if (q[j] / 4 - 30 > 0) wet++;
  check('scenery: the two ponds in the loops (sk.sea: the whole grid, 2,000 m² and more of water, its level by the road\'s)', k === q.length && wet * S.cell * S.cell >= 2000 && Math.abs(S.lv) < 3,
    `${wet * S.cell * S.cell} m² of water, level ${S.lv} m`);
  const L = sk.lm, st = L.st.map(([x, z, , H]) => ({ H, off: near(x, z).off })), pyl = L.pw.reduce((a, p) => a + (p.length - 1) / 3, 0), kinds = new Set(L.pl.map(p => p[0]));
  check('scenery: the landmarks farther out (OSM): the power station\'s 5 stacks of 70 m (700 m and more from the road), its boilers, turbine hall and cooling towers, 2 coal yards, a factory\'s stack, 3 power lines and more (30 pylons and more); the horizon',
    st.filter(s => s.H === 70 && s.off > 700).length === 5 && st.length === 6 && ['boiler', 'hall', 'cool'].every(c => kinds.has(c)) && L.coal.length === 2 && L.pw.length >= 3 && pyl >= 30 && !!def.far && def.far.base === 2563.1,
    `stacks ${st.map(s => s.H + ' m at ' + Math.round(s.off) + ' m').join(', ')}, ${L.pl.length} plant buildings (${[...kinds].join(', ')}), ${L.coal.length} coal yards, ${L.pw.length} lines with ${pyl} pylons`);
  const Z = def.zivali || {};
  check('scenery: the animals of the savanna\'s pastures, on the open land too (egrets, cows; a water trough)',
    ['egret', 'cow'].every(a => (Z.a || []).includes(a)) && (Z.t || []).includes('trough') && !!Z.open, JSON.stringify(Z));
}
// 6. the world: a builder of its own (js/world-tocancipa.js: World.ext.tocancipa, loaded after the shared water and flags of
// js/world-rbring.js), not a look on js/world-rbring.js's circuit builder; the track's file before it in index.html
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), w = fs.readFileSync(path.join(ROOT, 'js', 'world-tocancipa.js'), 'utf8'), rb = fs.readFileSync(path.join(ROOT, 'js', 'world-rbring.js'), 'utf8');
  const iT = html.indexOf('js/tracks/tocancipa.js'), iR = html.indexOf('js/world-rbring.js'), iW = html.indexOf('js/world-tocancipa.js');
  check('world: its own builder (js/world-tocancipa.js, World.ext.tocancipa), after js/world-rbring.js in index.html, not one of its looks; the track file loaded before it',
    def.theme === 'tocancipa' && iT > 0 && iR > 0 && iW > iR && iT < iW && /World\.ext\.tocancipa\s*=/.test(w) && !/\btocancipa\b/.test(rb), `theme ${def.theme}`);
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
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 1.5-4 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 90 && d.win < 240, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 3-15 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
