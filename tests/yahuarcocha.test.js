// Yahuarcocha, Ekvador: the circuit by the lake Yahuarcocha in the Andes north-east of Ibarra (3.6 km, clockwise; docs/proge/yahuarcocha.md,
// plan docs/dirkalisca-celine.md). The layout at its real length, clockwise; its corners by plain descriptions in their order round the
// lap, each turning its way, the esses by the lake left then right; the heights (the long right at the top the highest, the straight by the
// lake the lowest); the pits on the right of the main straight; the run-offs (wider than 3 m past the asphalt along most of the lap); the
// scenery data (terrain, land cover, the grandstands, the lake by the straight, the volcanoes on the horizon); a whole AI race to the
// finish in the dry and in the rain.
//   node tests/yahuarcocha.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'yahuarcocha'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z) }; };

// 1. the track: its name (a place and its country), a closed circuit of 4 laps, 3.6 km within 3 % (realKm 3.6), clockwise, not a test
// track and not pending; at least 300 degrees of turning a kilometre (the game's smoothed line: about 370)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Yahuarcocha, Ekvador" (English "Yahuarcocha, Ecuador"), a closed circuit, 4 laps, 3.6 km within 3 % (realKm 3.6), clockwise, not a test track, at least 300 °/km of turning',
    def.name === 'Yahuarcocha, Ekvador' && def.en.name === 'Yahuarcocha, Ecuador' && !T.open && def.laps === 4 && Math.abs(T.len / 3600 - 1) < 0.03 && def.realKm === 3.6 && area < 0 && !def.test && !def.pending && perKm > 300,
    `${T.len.toFixed(1)} m (${((T.len / 3600 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (no names of people, firms or the circuit), in their order round the lap from the start line, each
// turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the tightest radius on the centre line (the
// hairpin by the lake's), the nearest legs of the lap apart
{
  const want = { 'Rahli desni': [-1, 20], 'Dolgi desni': [-1, 35], 'Desni ob poljih': [-1, 45], 'Ostri desni': [-1, 60], 'Levi v klanec': [1, 45], 'Leva lasnica': [1, 80],
    'Desni navzdol': [-1, 30], 'Desni ob gozdu': [-1, 35], 'Dolgi levi': [1, 40], 'Lasnica ob jezeru': [-1, 100] };
  const order = ['Rahli desni', 'Dolgi desni', 'Desni ob poljih', 'Ostri desni', 'Levi v klanec', 'Leva lasnica', 'Desni navzdol', 'Desni ob gozdu', 'Dolgi levi', 'Ravnina ob jezeru',
    'Esa ob jezeru', 'Lasnica ob jezeru', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 13 named places in their order round the lap (the gentle right ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right at the gentle right, the long right, by the fields, the sharp right, downhill, by the wood and the hairpin by the lake; left up the hill, the left hairpin and the long left',
    cs.length === 10 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  const rl = (nm, a, b) => { const c = at.find(q => q.nm === nm); let r = 0, l = 0; for (let d = a; d <= b; d += T.ds) { const k = T.k[T.idx(c.d + T.startS + d)] * T.ds; if (k > 0) r += k; else l -= k; } return [r * 180 / Math.PI, l * 180 / Math.PI]; };
  const [, eL] = rl('Esa ob jezeru', -60, 0), [eR] = rl('Esa ob jezeru', 0, 60);
  check('corners: the esses by the lake left, then right (15 degrees and more each within 60 m)', eL >= 15 && eR >= 15, `left ${Math.round(eL)}°, right ${Math.round(eR)}°`);
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 12 m radius (the hairpins the tightest); the legs of the lap at least 35 m apart (room for the run-offs between them)', 1 / kmax >= 12 && legs >= 35, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 13 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 13 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: 15-26 m from the highest (the long right at the top, 0.7-1.2 km) to the lowest (the straight by the lake, 2.7-3.2 km);
// the steepest grade under 7 %
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const dLo = dS(iLo * T.ds), dHi = dS(iHi * T.ds);
  check('heights: 15-26 m from the highest (the long right at the top, 0.7-1.2 km) to the lowest (the straight by the lake, 2.7-3.2 km), the steepest grade under 7 %',
    hi - lo > 15 && hi - lo < 26 && dHi > 700 && dHi < 1200 && dLo > 2700 && dLo < 3200 && g < 0.07, `${(hi - lo).toFixed(1)} m, highest at ${Math.round(dHi)} m, lowest at ${Math.round(dLo)} m, steepest ${(g * 100).toFixed(1)} %`);
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
// 5. the scenery data (tools/yahuarcocha/build.py): terrain and land cover round the track, mostly the valley's grass, with woods, fields and
// built-up land; the two grandstands (named after the lake and the town: the covered one facing the pits); the lake (OSM's shore) below the
// track, 20-70 m from the road by the straight along it; the horizon's rings with the volcanoes over 4,300 m
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', cnt = [0, 0, 0, 0], rle = def.lc.rle;
  for (let k = 0; k < rle.length;) { const v = A64.indexOf(rle[k++]), cl = v >> 4; let run = (v & 15) + 1; if (run === 16) { let r; do { r = A64.indexOf(rle[k++]); run += r; } while (r === 63); } cnt[cl] += run; }
  const tot = cnt.reduce((a, b) => a + b, 0), main = def.stands[0];
  check('scenery: terrain and land cover 300 m and more round the whole track (the grass 60 % or more, woods 1 %, fields 1 %, built-up land 1 % or more); 2 grandstands (YAHUARCOCHA covered, facing the pits; IBARRA)',
    inGrid(def.dem) && inGrid(def.lc) && tot === def.lc.nx * def.lc.nz && cnt[0] / tot > 0.6 && cnt[1] / tot > 0.01 && cnt[2] / tot > 0.01 && cnt[3] / tot > 0.01 && def.stands.length === 2
      && def.stands.map(s => s[7]).join() === 'YAHUARCOCHA,IBARRA' && main[2] === -1 && main[4] === 1 && main[0] < def.pitRow[0] && main[1] > def.pitRow[1],
    `land cover ${cnt.map(v => Math.round(v / tot * 100) + ' %').join(' / ')}`);
  const S = sk.sea, bin = Buffer.from(S.rle, 'base64'), q = new Uint8Array(S.nx * S.nz); let k = 0;
  for (let i = 0; i < bin.length && k < q.length;) { if (bin[i] === 255) { q.fill(bin[i + 1], k, k + bin[i + 2]); k += bin[i + 2]; i += 3; } else { q[k++] = bin[i++]; } }
  const lake = (s) => { let m = 1e9; for (let j = 0; j < S.nz; j++) for (let i = 0; i < S.nx; i++) if (q[j * S.nx + i] / 4 - 30 > 0) { const x = S.x0 + i * S.cell, z = S.z0 + j * S.cell, nr = near(x, z); if (Math.abs(nr.d - s) < 60) m = Math.min(m, nr.off); } return m; };
  const lw = lake(2950), lo = Math.min(...Array.from(T.hy));
  const F = def.far, fb = Buffer.from(F.b64, 'base64'); let top = 0; for (const b of fb) top = Math.max(top, F.lo + b * F.step);
  check('scenery: the lake below the track (its level under the lowest point of the road), 20-70 m from the road by the straight along it; the horizon\'s rings out to 27.5 km with the volcanoes over 4,300 m',
    k === q.length && S.lv < lo && S.lv > lo - 8 && lw > 20 && lw < 70 && F.r[F.r.length - 1] >= 27500 && top > 4300,
    `lake ${S.lv} m (the road's lowest ${lo.toFixed(1)} m), ${Math.round(lw)} m from the road by the straight, the highest on the horizon ${top} m`);
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
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 2-5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 120 && d.win < 300, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 3-15 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
