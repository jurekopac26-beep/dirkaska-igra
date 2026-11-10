// Cromwell, Nova Zelandija: the circuit on the river terrace south of Cromwell in Central Otago, 216 m above the sea (4.1 km, a figure of
// eight over its own bridge; docs/proge/cromwell.md, plan docs/dirkalisca-celine.md, »Novih pet«). The layout at its real length, the
// east part clockwise and the west part anticlockwise (a lap's turning adds up to nothing); the bridge (Core: Track.cross: the straight
// over the bridge 7 m above the run under it, the OSM bridge's place); its corners by plain descriptions in their order round the lap,
// each turning its way, the chicane and the esses both ways; the heights (the terrace is flat, the bridge's embankment and the cutting
// under it, the grades held to 6 %); the pits on the left of the main straight, the player's box at the start line in the middle of the
// pit building; the run-offs; the scenery data (terrain, land cover, the covered grandstand across the straight, the buildings, the houses,
// the roads, the circuit's links, the speedway's oval, the karting, the pond below the cutting's floor, the power lines; the horizon; the
// animals); the world builder of its own (js/world-cromwell.js); a whole AI race to the finish in the dry and in the rain.
//   node tests/cromwell.test.js
'use strict';
const fs = require('fs'), path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'cromwell'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z) }; };
const named = (nm) => { const c = def.names.find(q => q[0] === nm); return c ? near(c[1], c[2]).d : NaN; };
const rl = (nm, a, b) => { const d0 = named(nm); let r = 0, l = 0; for (let d = a; d <= b; d += T.ds) { const k = T.k[T.idx(d0 + T.startS + d)] * T.ds; if (k > 0) r += k; else l -= k; } return [Math.round(r * 180 / Math.PI), Math.round(l * 180 / Math.PI)]; };   // (degrees right, left)

// 1. the track: its name (a place and its country), a closed circuit of 4 laps, 4.1 km within 3 % (realKm 4.1), not a test track and not
// pending; a figure of eight: the lap's turning adds up to nothing, the part from the run under the bridge to the bridge (the west part)
// anticlockwise, the rest (the east part, the start line in it) clockwise; at least 400 degrees of turning a kilometre (about 500)
{
  const X = T.cross && T.cross[0], lobe = (i0, i1) => { let a = 0; for (let i = i0; i !== i1; i = (i + 1) % T.N) { const j = (i + 1) % T.N; a += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; } return a / 2; };   // (shoelace with north up: + anticlockwise)
  let turn = 0, sum = 0; for (let i = 0; i < T.N; i++) { turn += Math.abs(T.k[i]) * T.ds; sum += T.k[i] * T.ds; }
  const perKm = turn * 180 / Math.PI / (T.len / 1000), w = X ? lobe(Math.round(X.lo) % T.N, Math.round(X.up) % T.N) : 0, e = X ? lobe(Math.round(X.up) % T.N, Math.round(X.lo) % T.N) : 0;
  check('track: "Cromwell, Nova Zelandija" (English "Cromwell, New Zealand"), a closed circuit, 4 laps, 4.1 km within 3 % (realKm 4.1), not a test track, a figure of eight (the west part anticlockwise, the east part clockwise), at least 400 °/km of turning',
    def.name === 'Cromwell, Nova Zelandija' && def.en.name === 'Cromwell, New Zealand' && !T.open && def.laps === 4 && Math.abs(T.len / 4100 - 1) < 0.03 && def.realKm === 4.1 && !def.test && !def.pending
      && Math.abs(sum * 180 / Math.PI) < 5 && w > 50000 && e < -50000 && perKm > 400,
    `${T.len.toFixed(1)} m (${((T.len / 4100 - 1) * 100).toFixed(1)} %), turning ${(sum * 180 / Math.PI).toFixed(1)}° a lap, the west part ${Math.round(w)} m², the east part ${Math.round(e)} m², ${Math.round(perKm)} °/km`);
}
// 2. the bridge: one crossing (Core: Track.cross), the straight over the bridge (from the bends before it to the long left) 6.5 m and more
// above the run under it (the deck's slab and the cars' room under it), at the OSM bridge's place on the upper leg, the legs at more than
// 60 degrees; the places by it named: the run under the bridge, the bridge
{
  const X = (T.cross || [])[0], up = X ? dS(X.up * T.ds) : NaN, lo = X ? dS(X.lo * T.ds) : NaN, br = def.sk.br;
  check('bridge: one crossing, the upper leg 6.5 m and more above the lower one, on the OSM bridge (sk.br), the legs crossing at more than 60°, "Pod mostom" and "Most" by the two legs',
    T.cross.length === 1 && X.dy >= 6.5 && X.sin > 0.87 && up >= br[0] - 5 && up <= br[1] + 5 && Math.abs(named('Pod mostom') - lo) < 20 && Math.abs(named('Most') - up) < 20,
    `upper ${Math.round(up)} m, lower ${Math.round(lo)} m, ${X && X.dy.toFixed(2)} m apart, sin ${X && X.sin.toFixed(2)}, OSM bridge ${br.join(' .. ')} m`);
}
// 3. the corners by plain descriptions (no names of people, firms, the circuit or its events), in their order round the lap from the start
// line, each turning its way by at least the given angle within the given distance of its place; the chicane and the esses both ways; the
// tightest radius on the centre line, the nearest legs of the lap apart (away from the bridge, where they cross)
{
  const want = { 'Jugovzhodna zanka': [-1, 80, 100], 'Levi proti mostu': [1, 90, 50], 'Zanka ob kartingu': [1, 150, 50], 'Desni ob gozdu': [-1, 40, 50], 'Zahodna lasnica': [1, 130, 50],
    'Desni pred lasnico': [-1, 50, 50], 'Južna lasnica': [1, 120, 50], 'Severni levi': [1, 90, 50], 'Ob ribniku': [1, 40, 100], 'Severna lasnica': [-1, 130, 50], 'Dolgi desni': [-1, 60, 50] };
  const order = ['Šikana', 'Jugovzhodna zanka', 'Povratna ravnina', 'Esi', 'Levi proti mostu', 'Pod mostom', 'Zanka ob kartingu', 'Dolga ravnina', 'Desni ob gozdu', 'Zahodna lasnica',
    'Desni pred lasnico', 'Južna lasnica', 'Ovinki proti mostu', 'Levi-desni pred mostom', 'Most', 'Severni levi', 'Ob ribniku', 'Severna lasnica', 'Dolgi desni', 'Ciljna ravnina'];
  const turn = (s, h) => { let a = 0; for (let d = -h; d <= h; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds, want[nm] ? want[nm][2] : 50) }; });
  check('corners: the 20 named places in their order round the lap (the chicane ... the finish straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right round the south-east loop, by the woods, before the hairpin, at the north hairpin and the long right; left onto the run under the bridge, round the karting loop, at the west and the south hairpins, the north left and by the pond',
    cs.length === 11 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  const ch = rl('Šikana', -40, 40), es = rl('Esi', -50, 50), lr = rl('Levi-desni pred mostom', -60, 60);
  check('corners: the chicane, the esses and the left-right before the bridge both ways (20 degrees and more right and left)',
    ch[0] >= 20 && ch[1] >= 20 && es[0] >= 20 && es[1] >= 20 && lr[0] >= 20 && lr[1] >= 20, `the chicane right ${ch[0]}° left ${ch[1]}°, the esses ${es[0]}° / ${es[1]}°, before the bridge ${lr[0]}° / ${lr[1]}°`);
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  const X = T.cross[0], byX = (i) => Math.hypot(T.px[i] - X.x, T.pz[i] - X.z) < 60;
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80 || (byX(i) && byX(j))) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 12 m radius (the north hairpin the tightest); away from the bridge the legs of the lap at least 35 m apart (room for the run-offs between them)', 1 / kmax >= 12 && legs >= 35, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 22 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 22 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 4. the heights: the terrace is flat, the bridge's ramps the lap's only climbs: the whole lap within 6.5-8 m (the straight over the bridge
// the highest, the run under it the lowest), the steepest grade held to 6 %; the start line 216.2 m above the sea (the comment of the track
// file, the menu's graph, the horizon's base)
{
  let lo = 1e9, hi = -1e9, ilo = 0, ihi = 0, g = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; ilo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; ihi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const X = T.cross[0], cd = (i, c) => { const a = Math.abs(i - c) * T.ds; return Math.min(a, T.len - a); };
  const src = fs.readFileSync(path.join(ROOT, 'js', 'tracks', 'cromwell.js'), 'utf8'), m = src.match(/\((\d+(?:\.\d+)?) m a\.s\.l\.\)/);
  check('heights: the whole lap within 6.5-8 m, the highest on the bridge\'s ramp and the lowest in its cutting (each within 100 m of the crossing), the steepest grade no more than 6 %, the start line 216.2 m above the sea',
    hi - lo > 6.5 && hi - lo < 8 && cd(ihi, X.up) < 100 && cd(ilo, X.lo) < 100 && g < 0.0605 && m && +m[1] === 216.2 && def.far.base === 216.2,
    `${(hi - lo).toFixed(1)} m (${lo.toFixed(1)} at ${Math.round(dS(ilo * T.ds))} m, ${hi.toFixed(1)} at ${Math.round(dS(ihi * T.ds))} m), steepest ${(g * 100).toFixed(1)} %, the start line ${m && m[1]} m a.s.l.`);
}
// 5. the pits: the lane on the left of the main straight from before the start line to after it, the straight no tighter than a 250 m
// radius along the boxes, the 13 crews' boxes in the lane round the start line (the player's at it: the middle of the pit building), the
// pit wall along it; the finish straight's sign before the start line. The run-offs: the barriers more than 3 m past the asphalt along more
// than 85 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = def.pitRow[0] - 10; d <= def.pitRow[1] + 20; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const dfs = named('Ciljna ravnina'), nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the left of the main straight past the start line, the straight no tighter than a 250 m radius along the boxes, 13 boxes in the lane (the player\'s at the start line), the pit wall along it',
    !!p0 && p0.t > 0.99 && p0.sd === -1 && P[0] < 0 && P[1] < -100 && P[2] > 60 && 1 / kmax > 250 && dfs > T.len - 200 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] === 0 && def.pitRow[0] < 0 && def.pitRow[1] > 0 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === -1),
    `lane ${P[1]} .. ${P[2]} m, ${-P[0]} m to the left, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.85 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 6. the scenery data (tools/cromwell/build.py): terrain and land cover round the track (the terrace's grass, the plantations and the shelter
// belts, the orchards and vineyards, the built-up land); the grandstand (CROMWELL, covered, across the straight from the pits, round the
// start line); the buildings (OSM), the houses, the roads, the circuit's links, the speedway's oval, the karting; the pond in the west part
// below the cutting's floor by it; the power lines' pylons; the horizon; the animals
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', cnt = [0, 0, 0, 0], rle = def.lc.rle;
  for (let k = 0; k < rle.length;) { const v = A64.indexOf(rle[k++]), cl = v >> 4; let run = (v & 15) + 1; if (run === 16) { let r; do { r = A64.indexOf(rle[k++]); run += r; } while (r === 63); } cnt[cl] += run; }
  const tot = cnt.reduce((a, b) => a + b, 0), main = def.stands[0];
  check('scenery: terrain and land cover 300 m and more round the whole track (the grass 50 % or more, woods 10 %, farmland 3 %, built-up land 1 % or more); 1 grandstand (CROMWELL, covered, across the straight from the pits, round the start line)',
    inGrid(def.dem) && inGrid(def.lc) && tot === def.lc.nx * def.lc.nz && cnt[0] / tot > 0.5 && cnt[1] / tot > 0.1 && cnt[2] / tot > 0.03 && cnt[3] / tot > 0.01 && def.stands.length === 1
      && main[7] === 'CROMWELL' && main[2] === 1 && main[4] === 1 && main[0] < -50 && main[1] >= 0 && main[1] > main[0] + 50,
    `land cover ${cnt.map(v => Math.round(v / tot * 100) + ' %').join(' / ')}, the grandstand ${main[0]} .. ${main[1]} m`);
  const kartPts = sk.kart.reduce((a, k) => a + (k.length - 1) / 2, 0), dtPts = sk.dt.reduce((a, k) => a + k.length / 2, 0);
  check('scenery: the buildings within 900 m (OSM, 100 and more), the houses (30 and more), the roads (20 and more), the circuit\'s links (5 and more), the speedway\'s oval, the karting (50 points and more)',
    sk.bld.length % 7 === 0 && sk.bld.length / 7 >= 100 && sk.hs.length / 2 >= 30 && sk.road.length >= 20 && sk.lk.length >= 5 && sk.dt.length === 1 && dtPts >= 10 && kartPts >= 50,
    `${sk.bld.length / 7} buildings, ${sk.hs.length / 2} houses, ${sk.road.length} roads, ${sk.lk.length} links, the oval ${dtPts} points, ${sk.kart.length} karting ways with ${kartPts} points`);
  const S = sk.sea, bin = Buffer.from(S.rle, 'base64'), q = new Uint8Array(S.nx * S.nz); let k = 0;
  for (let i = 0; i < bin.length && k < q.length;) { const b = bin[i]; if (b === 255) { q.fill(bin[i + 1], k, k + bin[i + 2]); k += bin[i + 2]; i += 3; } else { q[k++] = b; i++; } }
  const wet = []; for (let j = 0; j < S.nz; j++) for (let i = 0; i < S.nx; i++) if (q[j * S.nx + i] / 4 - 30 > 0) wet.push([S.x0 + i * S.cell, S.z0 + j * S.cell]);
  let rmin = 1e9; for (let i = 0; i < T.N; i++) { let dm = 1e9; for (const [x, z] of wet) dm = Math.min(dm, Math.hypot(T.px[i] - x, T.pz[i] - z)); if (dm < 60) rmin = Math.min(rmin, T.hy[i]); }
  const cx = wet.reduce((a, p) => a + p[0], 0) / wet.length, cz = wet.reduce((a, p) => a + p[1], 0) / wet.length, X = T.cross[0], xw = (cx - X.x) * T.tx[Math.round(X.lo) % T.N] + (cz - X.z) * T.tz[Math.round(X.lo) % T.N];
  check('scenery: the pond in the west part beside the run out of the cutting (sk.sea: the whole grid, 3,000 m² and more of water), its level 0.4 m and more under the lowest road within 60 m of it (the ground by that road above the water)',
    k === q.length && wet.length * S.cell * S.cell >= 3000 && xw > 0 && S.lv <= rmin - 0.4,
    `${wet.length * S.cell * S.cell} m² of water ${Math.round(xw)} m along the run past the crossing, level ${S.lv} m, the lowest road within 60 m ${rmin.toFixed(2)} m`);
  const pyl = sk.lm.pw.reduce((a, p) => a + (p.length - 1) / 3, 0);
  check('scenery: the power lines farther out (OSM, 3 and more, 20 pylons and more); the horizon round the basin',
    sk.lm.pw.length >= 3 && pyl >= 20 && !!def.far && def.far.r.length >= 10, `${sk.lm.pw.length} lines with ${pyl} pylons, the horizon's ${def.far.r.length} rings`);
  const Z = def.zivali || {};
  check('scenery: the animals of the terrace\'s farmland, on the open land too (sheep, hares, geese; troughs and water tanks)',
    ['sheep', 'hare', 'goose'].every(a => (Z.a || []).includes(a)) && ['trough', 'waterTank'].every(t => (Z.t || []).includes(t)) && !!Z.open, JSON.stringify(Z));
}
// 7. the world: a builder of its own (js/world-cromwell.js: World.ext.cromwell, loaded after the shared water and flags of
// js/world-rbring.js), not a look on js/world-rbring.js's circuit builder; the track's file before it in index.html
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), w = fs.readFileSync(path.join(ROOT, 'js', 'world-cromwell.js'), 'utf8'), rb = fs.readFileSync(path.join(ROOT, 'js', 'world-rbring.js'), 'utf8');
  const iT = html.indexOf('js/tracks/cromwell.js'), iR = html.indexOf('js/world-rbring.js'), iW = html.indexOf('js/world-cromwell.js');
  check('world: its own builder (js/world-cromwell.js, World.ext.cromwell), after js/world-rbring.js in index.html, not one of its looks; the track file loaded before it',
    def.theme === 'cromwell' && iT > 0 && iR > 0 && iW > iR && iT < iW && /World\.ext\.cromwell\s*=/.test(w) && !/\bcromwell\b/.test(rb), `theme ${def.theme}`);
}
// 8. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue (over the bridge and under it
// each lap); in the rain 3-15 % slower
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
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 2.5-6 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 150 && d.win < 360, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 3-15 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
