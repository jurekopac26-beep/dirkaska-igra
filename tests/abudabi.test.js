// Abu Dabi, ZAE: the circuit on Yas Island in Abu Dhabi (its layout since 2021, 5.28 km, anticlockwise; docs/proge/abudabi.md, plan
// docs/dirkalisca-celine.md). The layout at its real length, anticlockwise; its corners by plain descriptions in their order round the lap,
// each turning its way, the chicane left then right; the heights (a flat island: the rise to the long right the highest); the pits on the
// right of the main straight; the run-offs (wider than 3 m past the asphalt along most of the lap); the scenery data (terrain, land cover,
// the grandstands, the buildings, the fences and the palms, the hotel with its bridge over the track, the marina's water); a whole AI race to
// the finish in the dry and in the rain.
//   node tests/abudabi.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'abudabi'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z) }; };

// 1. the track: its name (a place and its country), a closed circuit of 3 laps, 5.281 km within 3 % (realKm 5.281), anticlockwise, not a
// test track and not pending; at least 220 degrees of turning a kilometre (the game's smoothed line: about 280)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: positive = anticlockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Abu Dabi, ZAE" (English "Abu Dhabi, UAE"), a closed circuit, 3 laps, 5.281 km within 3 % (realKm 5.281), anticlockwise, not a test track, at least 220 °/km of turning',
    def.name === 'Abu Dabi, ZAE' && def.en.name === 'Abu Dhabi, UAE' && !T.open && def.laps === 3 && Math.abs(T.len / 5281 - 1) < 0.03 && def.realKm === 5.281 && area > 0 && !def.test && !def.pending && perKm > 220,
    `${T.len.toFixed(1)} m (${((T.len / 5281 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms, the circuit or the hotel), in their order round the lap from the start
// line, each turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the tightest radius on the centre line
// (the chicane's), the nearest legs of the lap apart
{
  const want = { 'Levi na koncu ravnine': [1, 60], 'Hitri levi': [1, 35], 'Dolgi desni': [-1, 30], 'Lasnica': [1, 110], 'Dolgi levi': [1, 45], 'Desni ob marini': [-1, 25],
    'Ostri desni': [-1, 70], 'Levi pred hotelom': [1, 55], 'Levi za hotelom': [1, 55], 'Desni pred zadnjim': [-1, 35], 'Zadnji ovinek': [-1, 70] };
  const order = ['Levi na koncu ravnine', 'Hitri levi', 'Dolgi desni', 'Lasnica', 'Šikana', 'Dolgi levi', 'Desni ob marini', 'Ostri desni', 'Levi pred hotelom', 'Levi za hotelom',
    'Desni pred zadnjim', 'Zadnji ovinek', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 13 named places in their order round the lap (the left at the end of the straight ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: left at the end of the straight, the fast left, the hairpin, the long left and both lefts by the hotel; right at the long right, by the marina, the sharp right, before the last and the last corner',
    cs.length === 11 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  const ch = at.find(c => c.nm === 'Šikana'), chT = (a, b) => { let r = 0, l = 0; for (let d = a; d <= b; d += T.ds) { const k = T.k[T.idx(ch.d + T.startS + d)] * T.ds; if (k > 0) r += k; else l -= k; } return [r * 180 / Math.PI, l * 180 / Math.PI]; };
  const [, chL0] = chT(-50, 0), [chR1] = chT(0, 50);
  check('corners: the chicane left, then right (each at least 30 degrees within 50 m)', chL0 >= 30 && chR1 >= 30, `left ${Math.round(chL0)}°, right ${Math.round(chR1)}°`);
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under an 11 m radius (the chicane the tightest); the legs of the lap at least 40 m apart (room for the run-offs between them)', 1 / kmax >= 11 && legs >= 40, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 14 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 14 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: a flat island, under 14 m from the highest to the lowest; the highest on the rise to the long right (0.45-1.0 km); the
// steepest grade under 5 %
{
  let lo = 1e9, hi = -1e9, iHi = 0, g = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) lo = T.hy[i]; if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const dHi = dS(iHi * T.ds);
  check('heights: a flat island, 4-14 m from the highest (on the rise to the long right, 0.45-1.0 km) to the lowest, the steepest grade under 5 %',
    hi - lo > 4 && hi - lo < 14 && dHi > 450 && dHi < 1000 && g < 0.05, `${(hi - lo).toFixed(1)} m, highest at ${Math.round(dHi)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 4. the pits: the lane on the right of the main straight from before the start line to after it, the straight no tighter than a 250 m
// radius along the boxes, the 13 crews' boxes in the lane, the pit wall along it; the main straight's sign before the start line. The
// run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the right of the main straight past the start line, the straight no tighter than a 250 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall along it',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 250 && dfs > T.len - 200 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === 1),
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.85 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/abudabi/build.py): terrain and land cover round the track, with sand, palms, lawns and paved ground; the five
// grandstands (the covered one facing the pits), the buildings, the fences and OSM's palms; the hotel (its wings clear of the road, the
// bridge between them over the road, its underside 6 m and more above it); the marina's water (none within 20 m of the centre line, some
// within 60 m of it)
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', cnt = [0, 0, 0, 0], rle = def.lc.rle;
  for (let k = 0; k < rle.length;) { const v = A64.indexOf(rle[k++]), cl = v >> 4; let run = (v & 15) + 1; if (run === 16) { let r; do { r = A64.indexOf(rle[k++]); run += r; } while (r === 63); } cnt[cl] += run; }
  const tot = cnt.reduce((a, b) => a + b, 0), main = def.stands[0];
  check('scenery: terrain and land cover 300 m and more round the whole track (sand 15 % or more, palms 1 %, lawns 2 %, paved 10 % or more); 5 grandstands (YAS covered, facing the pits; NORTH, WEST, SOUTH, MARINA); buildings, fences and 50 palms or more',
    inGrid(def.dem) && inGrid(def.lc) && tot === def.lc.nx * def.lc.nz && cnt[0] / tot > 0.15 && cnt[1] / tot > 0.01 && cnt[2] / tot > 0.02 && cnt[3] / tot > 0.1 && def.stands.length === 5
      && def.stands.map(s => s[7]).join() === 'YAS,NORTH,WEST,SOUTH,MARINA' && main[2] === -1 && main[4] === 1 && main[0] < def.pitRow[0] && main[1] > def.pitRow[1] && sk.bld.length / 6 >= 4 && sk.fence.length >= 2 && sk.palm.length / 2 >= 50,
    `land cover ${cnt.map(v => Math.round(v / tot * 100) + ' %').join(' / ')}, ${sk.bld.length / 6} buildings, ${sk.fence.length} fences, ${sk.palm.length / 2} palms`);
  const corners = (x, z, L, W, deg) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [x + (u * L * c - v * W * s) / 2, z + (u * L * s + v * W * c) / 2]); };
  const inBox = (q, x, z) => { for (let k = 0; k < 4; k++) { const [ax, az] = q[k], [bx, bz] = q[(k + 1) % 4]; if ((bx - ax) * (z - az) - (bz - az) * (x - ax) < 0) return false; } return true; };
  let clear = 1e9; for (const [x, z, L, W, deg] of sk.ht) { const q = corners(x, z, L, W, deg); for (let i = 0; i < T.N; i++) { if (inBox(q, T.px[i], T.pz[i])) clear = 0; for (const [cx, cz] of q) clear = Math.min(clear, Math.hypot(T.px[i] - cx, T.pz[i] - cz)); } }
  const [bx, bz, bL, bW, bdeg, bup] = sk.hb, bq = corners(bx, bz, bL, bW, bdeg); let under = 0; for (let i = 0; i < T.N; i++) if (inBox(bq, T.px[i], T.pz[i])) under++;
  const hotel = def.names.find(c => c[0] === 'Levi pred hotelom'), dh = near(hotel[1], hotel[2]).d, db = near(bx, bz).d;
  check('scenery: the hotel\'s 3 blocks clear of the road (their corners 12 m and more from the centre line), the bridge between them over the road after the left before the hotel, its underside 6 m and more above it',
    sk.ht.length === 3 && clear >= 12 && under >= 4 && db > dh && db < dh + 120 && bup >= 6, `blocks ${clear.toFixed(1)} m from the line, ${under} road samples under the bridge at ${Math.round(db)} m, its underside ${bup} m up`);
  const S = sk.sea, bin = Buffer.from(S.rle, 'base64'), q = []; for (let i = 0; i < bin.length;) { if (bin[i] === 255) { for (let k = 0; k < bin[i + 2]; k++) q.push(bin[i + 1]); i += 3; } else q.push(bin[i++]); }
  let wMin = 1e9; for (let j = 0; j < S.nz; j++) for (let i = 0; i < S.nx; i++) if (q[j * S.nx + i] / 4 - 30 > 0) { const x = S.x0 + i * S.cell, z = S.z0 + j * S.cell, k = T.nearestIdx(x, z); wMin = Math.min(wMin, Math.hypot(T.px[k] - x, T.pz[k] - z)); }
  check('scenery: the marina\'s water on its grid (every cell decoded), none within 20 m of the centre line, some within 60 m of it; its level below the road',
    q.length === S.nx * S.nz && wMin >= 20 && wMin < 60 && S.lv < -2, `${q.length} cells, the nearest water ${wMin.toFixed(1)} m from the line, the level ${S.lv} m`);
}
// 6. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 3-15 % slower
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
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 3-7 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 180 && d.win < 420, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 3-15 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
