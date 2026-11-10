// Serres, Grčija: the circuit on the plain south-west of Serres in Greek Macedonia, 23 m above the sea (3.2 km, clockwise; docs/proge/serres.md,
// plan docs/dirkalisca-celine.md, »Novih pet«). The layout at its real length (realKm 3.186), clockwise; its corners by plain descriptions in
// their order round the lap, each turning its way, the esses both ways; the heights (the plain falls gently to the south, the grades held to
// 3 %); the pits on the right of the main straight, the 13 crews' boxes in the lane before the start line (the player's in the middle), the
// pit building's 18 garages from 170 m before the start line to 10 m after it; the run-offs; the scenery data (terrain, land cover, the open
// bleachers across the straight, the buildings, the houses, the roads, the circuit's stubs, the karting, the paddock, the media centre, the
// camp site, the brook along the back straight, the power lines, the railway, the solar parks, the pitches; the horizon; the animals); the
// world builder of its own (js/world-serres.js); a whole AI race to the finish in the dry and in the rain.
//   node tests/serres.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'serres'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z) }; };
const named = (nm) => { const c = def.names.find(q => q[0] === nm); return c ? near(c[1], c[2]).d : NaN; };
const rl = (nm, a, b) => { const d0 = named(nm); let r = 0, l = 0; for (let d = a; d <= b; d += T.ds) { const k = T.k[T.idx(d0 + T.startS + d)] * T.ds; if (k > 0) r += k; else l -= k; } return [Math.round(r * 180 / Math.PI), Math.round(l * 180 / Math.PI)]; };   // (degrees right, left)

// 1. the track: its name (a place and its country), a closed circuit of 5 laps, 3.186 km within 3 % (realKm 3.186), not a test track and
// not pending; clockwise (the lap's turning 360 degrees to the right, its area with north up negative), no crossing; at least 380 degrees
// of turning a kilometre (about 415)
{
  let turn = 0, sum = 0, area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; turn += Math.abs(T.k[i]) * T.ds; sum += T.k[i] * T.ds; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Serres, Grčija" (English "Serres, Greece"), a closed circuit, 5 laps, 3.186 km within 3 % (realKm 3.186), not a test track, clockwise, no crossing, at least 380 °/km of turning',
    def.name === 'Serres, Grčija' && def.en.name === 'Serres, Greece' && !T.open && def.laps === 5 && Math.abs(T.len / 3186 - 1) < 0.03 && def.realKm === 3.186 && !def.test && !def.pending
      && Math.abs(sum * 180 / Math.PI - 360) < 5 && area / 2 < -100000 && !(T.cross || []).length && perKm > 380,
    `${T.len.toFixed(1)} m (${((T.len / 3186 - 1) * 100).toFixed(1)} %), turning ${(sum * 180 / Math.PI).toFixed(1)}° a lap, area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms, the circuit or its events), in their order round the lap from the start
// line, each turning its way by at least the given angle within the given distance of its place; the esses both ways; the tightest radius
// on the centre line, the nearest legs of the lap apart
{
  const want = { 'Lasnica na koncu ravnine': [-1, 100, 100], 'Dvojni levi': [1, 70, 100], 'Južna lasnica': [-1, 150, 100], 'Kratki levi': [1, 35, 50], 'Levi v notranjosti': [1, 110, 100],
    'Jugozahodna lasnica': [-1, 150, 100], 'Dolgi desni': [-1, 90, 100], 'Severni levi': [1, 30, 30], 'Severni desni': [-1, 50, 30], 'Zadnji ovinek': [-1, 30, 50] };
  const order = ['Lasnica na koncu ravnine', 'Dvojni levi', 'Južna lasnica', 'Esi', 'Kratki levi', 'Levi v notranjosti', 'Notranja ravnina', 'Jugozahodna lasnica', 'Ob potoku',
    'Dolgi desni', 'Severni levi', 'Severni desni', 'Zadnji ovinek', 'Ciljna ravnina'];
  const turn = (s, h) => { let a = 0; for (let d = -h; d <= h; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds, want[nm] ? want[nm][2] : 50) }; });
  check('corners: the 14 named places in their order round the lap (the hairpin at the end of the straight ... the finish straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right at the hairpins (the end of the straight, the south, the south-west), the long right, the north right and the last corner; left through the double left, the short left, into the infield and at the north left',
    cs.length === 10 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  const es = rl('Esi', -80, 80);
  check('corners: the esses both ways (20 degrees and more right and left)', es[0] >= 20 && es[1] >= 20, `the esses right ${es[0]}° left ${es[1]}°`);
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 25 m radius (the hairpin at the end of the straight the tightest); the legs of the lap at least 40 m apart (room for the run-offs between them)', 1 / kmax >= 25 && legs >= 40, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 16 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 16 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: the plain falls gently to the south: the whole lap within 4-6.5 m, the lowest by the south hairpin and the highest on the
// way to the last corner (each within 150 m of it), the steepest grade held to 3 %; the start line 23.2 m above the sea (the comment of the
// track file, the menu's graph, the horizon's base)
{
  let lo = 1e9, hi = -1e9, ilo = 0, ihi = 0, g = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; ilo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; ihi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const src = fs.readFileSync(path.join(ROOT, 'js', 'tracks', 'serres.js'), 'utf8'), m = src.match(/\((\d+(?:\.\d+)?) m a\.s\.l\.\)/);
  check('heights: the whole lap within 4-6.5 m, the lowest by the south hairpin and the highest before the last corner (each within 150 m), the steepest grade no more than 3 %, the start line 23.2 m above the sea',
    hi - lo > 4 && hi - lo < 6.5 && Math.abs(dS(ilo * T.ds) - named('Južna lasnica')) < 150 && Math.abs(dS(ihi * T.ds) - named('Zadnji ovinek')) < 150 && g < 0.0305 && m && +m[1] === 23.2 && def.far.base === 23.2,
    `${(hi - lo).toFixed(1)} m (${lo.toFixed(1)} at ${Math.round(dS(ilo * T.ds))} m, ${hi.toFixed(1)} at ${Math.round(dS(ihi * T.ds))} m), steepest ${(g * 100).toFixed(1)} %, the start line ${m && m[1]} m a.s.l.`);
}
// 4. the pits: the lane on the right of the main straight from before the start line to after it, the straight no tighter than a 250 m
// radius along the boxes, the 13 crews' boxes in the lane before the start line (the player's the middle one), the pit wall along it, the
// pit building's 18 garages from 170 m before the start line to 10 m after it (the crews' the last 13); the finish straight's sign before
// the start line. The run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap (both sides; the pit wall is the
// nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS), cb = T.crewBoxes(), G = def.sk.gar; let kmax = 0; for (let d = def.pitRow[0] - 10; d <= def.pitRow[1] + 20; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const dfs = named('Ciljna ravnina');
  check('pits: the lane on the right of the main straight past the start line, the straight no tighter than a 250 m radius along the boxes, 13 boxes in the lane (the player\'s the middle one), the pit wall along it',
    !!p0 && p0.t > 0.99 && p0.sd === 1 && P[0] > 0 && P[1] < -150 && P[2] > 100 && 1 / kmax > 250 && dfs > T.len - 200 && cb.length === 13 && cb[6] === P[3]
      && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, boxes ${cb[0]} .. ${cb[cb.length - 1]} m, the player's ${P[3]} m, the straight's sign ${Math.round(dfs - T.len)} m`);
  check('pits: the pit building\'s 18 garages (sk.gar) from before the first crew\'s box to after the last (pitRow[0] .. pitRow[1] + 10), in the lane',
    G.length === 2 && (G[1] - G[0]) / 10 === 18 && G[0] <= def.pitRow[0] && G[1] >= def.pitRow[1] + 10 && G[0] > P[1] && G[1] < P[2], `garages ${G[0]} .. ${G[1]} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.85 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/serres/build.py): terrain and land cover round the track (the plain's farmland, its grass, the trees, the
// built-up land); the bleachers (SERRES, open, across the straight from the pits, before the start line); the buildings (OSM), the houses,
// the roads, the circuit's stubs, the karting, the paddock, the media centre, the camp site; the brook along the back straight, never on the
// track; the power lines' pylons, the railway, the solar parks, the pitches; the horizon; the animals
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', cnt = [0, 0, 0, 0], rle = def.lc.rle;
  for (let k = 0; k < rle.length;) { const v = A64.indexOf(rle[k++]), cl = v >> 4; let run = (v & 15) + 1; if (run === 16) { let r; do { r = A64.indexOf(rle[k++]); run += r; } while (r === 63); } cnt[cl] += run; }
  const tot = cnt.reduce((a, b) => a + b, 0), main = def.stands[0];
  check('scenery: terrain and land cover 300 m and more round the whole track (farmland 40 % or more, grass 20 %, trees 4 %, built-up land 2 % or more); 1 stand of bleachers (SERRES, open, across the straight from the pits, before the start line)',
    inGrid(def.dem) && inGrid(def.lc) && tot === def.lc.nx * def.lc.nz && cnt[2] / tot > 0.4 && cnt[0] / tot > 0.2 && cnt[1] / tot > 0.04 && cnt[3] / tot > 0.02 && def.stands.length === 1
      && main[7] === 'SERRES' && main[2] === -1 && main[4] === 0 && main[0] < -40 && main[1] <= 0 && main[1] > main[0] + 40,
    `land cover ${cnt.map(v => Math.round(v / tot * 100) + ' %').join(' / ')}, the bleachers ${main[0]} .. ${main[1]} m`);
  const kartPts = sk.kart.reduce((a, k) => a + (k.length - 1) / 2, 0);
  check('scenery: the buildings within 900 m (OSM, 100 and more), the houses (100 and more), the roads (50 and more), the circuit\'s 2 stubs, the karting\'s closed loop (50 points and more), the outlines of the paddock, the camp site and the karting\'s grounds, the media centre',
    sk.bld.length % 7 === 0 && sk.bld.length / 7 >= 100 && sk.hs.length / 2 >= 100 && sk.road.length >= 50 && sk.lk.length === 2 && sk.kart.length === 1 && sk.kart[0][0] === 1 && kartPts >= 50
      && sk.pad.length >= 6 && sk.camp.length >= 6 && sk.kyard.length >= 6 && sk.mc.length === 6,
    `${sk.bld.length / 7} buildings, ${sk.hs.length / 2} houses, ${sk.road.length} roads, ${sk.lk.length} stubs, the karting ${kartPts} points`);
  const rv = (sk.river || [])[0] || [], pts = []; let len = 0;
  for (let k = 0; k + 3 < rv.length; k += 2) { const ax = rv[k], az = rv[k + 1], bx = rv[k + 2], bz = rv[k + 3], l = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(l / 3)); len += l; for (let q = 0; q < m; q++) pts.push([ax + (bx - ax) * q / m, az + (bz - az) * q / m]); }
  const dmin = pts.reduce((a, [x, z]) => Math.min(a, near(x, z).off), 1e9), ob = def.names.find(c => c[0] === 'Ob potoku'), dOb = pts.reduce((a, [x, z]) => Math.min(a, Math.hypot(x - ob[1], z - ob[2])), 1e9);
  check('scenery: the brook (sk.river: one course of 600 m and more) along the back straight (the straight by the brook within 60 m of it), nowhere nearer the centre line than 25 m',
    sk.river.length === 1 && len >= 600 && dOb < 60 && dmin >= 25, `${Math.round(len)} m, the straight by it ${dOb.toFixed(0)} m off, nearest the track ${dmin.toFixed(1)} m`);
  const L = sk.lm, pyl = L.pw.reduce((a, p) => a + (p.length - 1) / 3, 0);
  check('scenery: farther out (OSM) the power lines (20 pylons and more), the railway (10 pieces and more), the solar parks (2 and more), the sports grounds\' pitches (8 and more: football, tennis, basketball); the horizon round the plain',
    L.pw.length >= 1 && pyl >= 20 && L.rail.length >= 10 && L.solar.length >= 2 && L.pitch.length >= 8 && ['soccer', 'tennis', 'basketball'].every(s => L.pitch.some(p => p[0] === s)) && !!def.far && def.far.r.length >= 10,
    `${L.pw.length} lines with ${pyl} pylons, ${L.rail.length} pieces of railway, ${L.solar.length} solar parks, ${L.pitch.length} pitches, the horizon's ${def.far.r.length} rings`);
  const Z = def.zivali || {};
  check('scenery: the animals of the plain\'s farmland, on the open land too (storks, sheep, hares, donkeys; storks\' nests, beehives, troughs)',
    ['stork', 'sheep', 'hare', 'donkey'].every(a => (Z.a || []).includes(a)) && ['storkNest', 'beehive', 'trough'].every(t => (Z.t || []).includes(t)) && !!Z.open, JSON.stringify(Z));
}
// 6. the world: a builder of its own (js/world-serres.js: World.ext.serres, loaded after the shared water and flags of js/world-rbring.js),
// not a look on js/world-rbring.js's circuit builder; the track's file before it in index.html
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), w = fs.readFileSync(path.join(ROOT, 'js', 'world-serres.js'), 'utf8'), rb = fs.readFileSync(path.join(ROOT, 'js', 'world-rbring.js'), 'utf8');
  const iT = html.indexOf('js/tracks/serres.js'), iR = html.indexOf('js/world-rbring.js'), iW = html.indexOf('js/world-serres.js');
  check('world: its own builder (js/world-serres.js, World.ext.serres), after js/world-rbring.js in index.html, not one of its looks; the track file loaded before it',
    def.theme === 'serres' && iT > 0 && iR > 0 && iW > iR && iT < iW && /World\.ext\.serres\s*=/.test(w) && !/\bserres\b/.test(rb), `theme ${def.theme}`);
}
// 7. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 3-15 % slower
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
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 2-5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 120 && d.win < 300, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 3-15 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
