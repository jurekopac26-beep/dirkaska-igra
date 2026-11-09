// Pärnu, Estonija: the circuit on the coastal meadows at Papsaare north-west of Pärnu (3.2 km, anticlockwise; docs/proge/parnu.md, plan
// docs/dirkalisca-celine.md, »Novih pet«). The layout at its real length, anticlockwise; its corners by plain descriptions in their order
// round the lap, each turning its way, the chicane and the esses both ways; the heights (the coastal plain: the whole lap within a few
// metres); the pits on the right of the main straight, the player's box at the start line in the middle of the pit building; the run-offs;
// the scenery data (terrain, land cover, the grandstand facing the pits, the pit building, the pavilion, the ditches and the fences, the
// pond in the infield, the animals); the world builder of its own (js/world-parnu.js); a whole AI race to the finish in the dry and in the rain.
//   node tests/parnu.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'parnu'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z) }; };

// 1. the track: its name (a place and its country), a closed circuit of 4 laps, 3.172 km within 3 % (realKm 3.172), anticlockwise, not a
// test track and not pending; at least 400 degrees of turning a kilometre (the game's smoothed line: about 540)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: positive = anticlockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Pärnu, Estonija" (English "Pärnu, Estonia"), a closed circuit, 4 laps, 3.172 km within 3 % (realKm 3.172), anticlockwise, not a test track, at least 400 °/km of turning',
    def.name === 'Pärnu, Estonija' && def.en.name === 'Pärnu, Estonia' && !T.open && def.laps === 4 && Math.abs(T.len / 3172 - 1) < 0.03 && def.realKm === 3.172 && area > 0 && !def.test && !def.pending && perKm > 400,
    `${T.len.toFixed(1)} m (${((T.len / 3172 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the chicane, the esses and the twists both
// ways; the tightest radius on the centre line (the hairpins'), the nearest legs of the lap apart
{
  const want = { 'Leva lasnica': [1, 100], 'Južna zanka': [1, 40], 'Desni ob ribniku': [-1, 60], 'Severna lasnica': [1, 70], 'Dolgi levi': [1, 50], 'Desni okljuk': [-1, 80], 'Zadnji ovinek': [-1, 60] };
  const order = ['Leva lasnica', 'Zahodna ravnina', 'Šikana', 'Esi', 'Južna zanka', 'Vzhodna ravnina', 'Vijuge', 'Desni ob ribniku', 'Severna lasnica', 'Dolgi levi', 'Desni okljuk',
    'Zadnji ovinek', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 13 named places in their order round the lap (the left hairpin ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: left at the left hairpin, the south loop, the north hairpin and the long left; right by the pond, at the right-hand loop and the last corner',
    cs.length === 7 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  const rl = (nm, a, b) => { const c = at.find(q => q.nm === nm); let r = 0, l = 0; for (let d = a; d <= b; d += T.ds) { const k = T.k[T.idx(c.d + T.startS + d)] * T.ds; if (k > 0) r += k; else l -= k; } return [Math.round(r * 180 / Math.PI), Math.round(l * 180 / Math.PI)]; };
  const sk = rl('Šikana', -50, 50), es = rl('Esi', -50, 50), vi = rl('Vijuge', -60, 60);
  check('corners: the chicane, the esses and the twists each both ways (20 degrees and more right and left within 50-60 m)', [sk, es, vi].every(([r, l]) => r >= 20 && l >= 20),
    `the chicane right ${sk[0]}° left ${sk[1]}°, the esses ${es[0]}° / ${es[1]}°, the twists ${vi[0]}° / ${vi[1]}°`);
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 12 m radius (the hairpins the tightest); the legs of the lap at least 35 m apart (room for the run-offs between them)', 1 / kmax >= 12 && legs >= 35, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 15 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 15 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: the coastal plain, the whole lap within 4 m (Copernicus: about 2 m), the steepest grade under 3 %; the start line 3.3 m
// above the sea (the comment of the track file, the menu's graph)
{
  let lo = 1e9, hi = -1e9, g = 0; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i])); }
  const src = fs.readFileSync(path.join(ROOT, 'js', 'tracks', 'parnu.js'), 'utf8'), m = src.match(/\((\d+(?:\.\d+)?) m a\.s\.l\.\)/);
  check('heights: the whole lap within 4 m, the steepest grade under 3 %, the start line 3.3 m above the sea', hi - lo > 0.5 && hi - lo < 4 && g < 0.03 && m && +m[1] === 3.3,
    `${(hi - lo).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %, the start line ${m && m[1]} m a.s.l.`);
}
// 4. the pits: the lane on the right of the main straight from before the start line to after it, the straight no tighter than a 250 m
// radius along the boxes, the 13 crews' boxes in the lane round the start line (the player's at it: the middle of the pit building), the
// pit wall along it; the main straight's sign before the start line. The run-offs: the barriers more than 3 m past the asphalt along more
// than 85 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = def.pitRow[0] - 10; d <= def.pitRow[1] + 20; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs2 = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs2[1], fs2[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the right of the main straight past the start line, the straight no tighter than a 250 m radius along the boxes, 13 boxes in the lane (the player\'s at the start line), the pit wall along it',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 250 && dfs > T.len - 200 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] === 0 && def.pitRow[0] < 0 && def.pitRow[1] > 0 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.85 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/parnu/build.py): terrain and land cover round the track, mostly the coastal meadows, with pine woods, fields and
// built-up land; the grandstand (PÄRNU, covered, facing the pits along the boxes); the buildings by the pit lane (OSM) and the glass
// pavilion; the ditches, the service roads and the fences (OSM); the pond (OSM's shore) in the infield by the right-hander named after it,
// 10-40 m from the road there, its water well below the road; the animals of the meadows and the woods
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', cnt = [0, 0, 0, 0], rle = def.lc.rle;
  for (let k = 0; k < rle.length;) { const v = A64.indexOf(rle[k++]), cl = v >> 4; let run = (v & 15) + 1; if (run === 16) { let r; do { r = A64.indexOf(rle[k++]); run += r; } while (r === 63); } cnt[cl] += run; }
  const tot = cnt.reduce((a, b) => a + b, 0), main = def.stands[0];
  check('scenery: terrain and land cover 300 m and more round the whole track (the meadows 60 % or more, woods 3 %, fields 2 %, built-up land 5 % or more); 1 grandstand (PÄRNU, covered, facing the pits along the boxes)',
    inGrid(def.dem) && inGrid(def.lc) && tot === def.lc.nx * def.lc.nz && cnt[0] / tot > 0.6 && cnt[1] / tot > 0.03 && cnt[2] / tot > 0.02 && cnt[3] / tot > 0.05 && def.stands.length === 1
      && main[7] === 'PÄRNU' && main[2] === -1 && main[4] === 1 && main[0] <= -40 && main[1] >= 40,
    `land cover ${cnt.map(v => Math.round(v / tot * 100) + ' %').join(' / ')}`);
  const bld = sk.bld || [], pav = sk.pav || [];
  check('scenery: 2 buildings by the pit lane (OSM: on the right, past the pits and by the pit entry), the glass pavilion (50-60 m long, right of the main straight); 10 ditches and more, 5 service roads and more, 3 fences and more',
    bld.length === 12 && pav.length === 5 && pav[2] > 50 && pav[2] < 60 && [[bld[0], bld[1]], [bld[6], bld[7]], [pav[0], pav[1]]].every(([x, z]) => { const q = near(x, z), i = q.i; return (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] > 15; })
      && sk.ditch.length >= 10 && sk.road.length >= 5 && sk.fence.length >= 3, `${bld.length / 6} buildings, the pavilion ${pav[2]} m, ${sk.ditch.length} ditches, ${sk.road.length} roads, ${sk.fence.length} fences`);
  const S = sk.sea, bin = Buffer.from(S.rle, 'base64'), q = new Uint8Array(S.nx * S.nz); let k = 0;
  for (let i = 0; i < bin.length && k < q.length;) { if (bin[i] === 255) { q.fill(bin[i + 1], k, k + bin[i + 2]); k += bin[i + 2]; i += 3; } else { q[k++] = bin[i++]; } }
  let wet = 0, cx = 0, cz = 0, mind = 1e9, md = 0;
  for (let j = 0; j < S.nz; j++) for (let i = 0; i < S.nx; i++) if (q[j * S.nx + i] / 4 - 30 > 0) { const x = S.x0 + i * S.cell, z = S.z0 + j * S.cell, nr = near(x, z); wet++; cx += x; cz += z; if (nr.off < mind) { mind = nr.off; md = nr.d; } }
  cx /= wet; cz /= wet; let wn = 0;   // (the pond's middle inside the lap: the lap winds round it once)
  for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; let d = Math.atan2(T.pz[j] - cz, T.px[j] - cx) - Math.atan2(T.pz[i] - cz, T.px[i] - cx); d -= 2 * Math.PI * Math.round(d / (2 * Math.PI)); wn += d; }
  const pd = def.names.find(c => c[0] === 'Desni ob ribniku'), dp = near(pd[1], pd[2]).d; let road = 1e9; for (let d = dp - 100; d <= dp + 100; d += T.ds) road = Math.min(road, T.hy[T.idx(T.startS + d)]);
  check('scenery: the pond in the infield (8,000-20,000 m²), nearest to the road by the right-hander named after it (10-40 m), its level more than 0.5 m under the road there',
    k === q.length && Math.abs(Math.abs(wn / (2 * Math.PI)) - 1) < 0.01 && wet * S.cell * S.cell > 8000 && wet * S.cell * S.cell < 20000 && mind > 10 && mind < 40 && Math.abs(md - dp) < 60 && road - S.lv > 0.5,
    `${wet * S.cell * S.cell} m², ${mind.toFixed(1)} m from the road at ${Math.round(md)} m (the corner at ${Math.round(dp)} m), the water ${(road - S.lv).toFixed(1)} m under the road`);
  const Z = def.zivali || {};
  check('scenery: the animals of the meadows and the woods (roe deer, hares, foxes, storks, geese; a stork\'s nest, a hunting stand, log piles)',
    ['roe', 'hare', 'fox', 'stork', 'goose'].every(a => (Z.a || []).includes(a)) && ['storkNest', 'huntStand', 'logPile'].every(a => (Z.t || []).includes(a)), JSON.stringify(Z.a));
}
// 6. the world: a builder of its own (js/world-parnu.js: World.ext.parnu, loaded after the shared water and flags of js/world-rbring.js),
// not a look on js/world-rbring.js's circuit builder; the track's file before it in index.html
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), w = fs.readFileSync(path.join(ROOT, 'js', 'world-parnu.js'), 'utf8'), rb = fs.readFileSync(path.join(ROOT, 'js', 'world-rbring.js'), 'utf8');
  const iT = html.indexOf('js/tracks/parnu.js'), iR = html.indexOf('js/world-rbring.js'), iW = html.indexOf('js/world-parnu.js');
  check('world: its own builder (js/world-parnu.js, World.ext.parnu), after js/world-rbring.js in index.html, not one of its looks; the track file loaded before it',
    def.theme === 'parnu' && iT > 0 && iR > 0 && iW > iR && iT < iW && /World\.ext\.parnu\s*=/.test(w) && !/\bparnu\b/.test(rb), `theme ${def.theme}`);
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
