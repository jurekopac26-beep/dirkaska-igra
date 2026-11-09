// Sindia, Senegal: the circuit in the savanna at Sindia south-east of Dakar (4.7 km, clockwise; docs/proge/sindia.md, plan
// docs/dirkalisca-celine.md). The layout at its real length, clockwise; its corners by plain descriptions in their order round the lap,
// each turning its way, the fast esses right then left, the triple bend right, left, right; the heights (two shallow valleys: the right
// at the bottom the lowest); the pits on the left of the main straight; the run-offs (wider than 3 m past the asphalt along most of the
// lap); the scenery data (terrain, land cover, the grandstands, the old baobabs); a whole AI race to the finish in the dry and in the rain.
//   node tests/sindia.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'sindia'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z) }; };

// 1. the track: its name (a place and its country), a closed circuit of 3 laps, 4.7 km within 3 % (realKm 4.7), clockwise, not a test
// track and not pending; at least 250 degrees of turning a kilometre (the game's smoothed line: about 310)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Sindia, Senegal" (English "Sindia, Senegal"), a closed circuit, 3 laps, 4.7 km within 3 % (realKm 4.7), clockwise, not a test track, at least 250 °/km of turning',
    def.name === 'Sindia, Senegal' && def.en.name === 'Sindia, Senegal' && !T.open && def.laps === 3 && Math.abs(T.len / 4700 - 1) < 0.03 && def.realKm === 4.7 && area < 0 && !def.test && !def.pending && perKm > 250,
    `${T.len.toFixed(1)} m (${((T.len / 4700 - 1) * 100).toFixed(1)} %), area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km`);
}
// 2. the corners by plain descriptions (the real ones are numbered; no names of people, firms or the circuit), in their order round the lap
// from the start line, each turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the tightest radius on
// the centre line (the hairpin's), the nearest legs of the lap apart
{
  const want = { 'Levi na koncu ravnine': [1, 50], 'Levi na vrhu': [1, 45], 'Levi v dolino': [1, 30], 'Ostri desni': [-1, 70], 'Dolgi desni': [-1, 60], 'Ovinek pri baobabu': [-1, 40],
    'Hitri desni': [-1, 20], 'Dolgi levi': [1, 35], 'Desni na dnu': [-1, 70], 'Lasnica': [1, 90], 'Zadnji ovinek': [-1, 60] };
  const order = ['Levi na koncu ravnine', 'Levi na vrhu', 'Levi v dolino', 'Hitra esa', 'Ostri desni', 'Dolgi desni', 'Ovinek pri baobabu', 'Trojni ovinek', 'Hitri desni', 'Dolgi levi',
    'Desni na dnu', 'Lasnica', 'Zadnji ovinek', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 14 named places in their order round the lap (the left at the end of the straight ... the main straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: left at the end of the straight, over the top, into the valley, the long left and the hairpin; right at the sharp right, the long right, the baobab corner, the fast right, at the bottom and the last corner',
    cs.length === 11 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  const rl = (nm, a, b) => { const c = at.find(q => q.nm === nm); let r = 0, l = 0; for (let d = a; d <= b; d += T.ds) { const k = T.k[T.idx(c.d + T.startS + d)] * T.ds; if (k > 0) r += k; else l -= k; } return [r * 180 / Math.PI, l * 180 / Math.PI]; };
  const [eR] = rl('Hitra esa', -80, 0), [, eL] = rl('Hitra esa', 0, 80), [t1] = rl('Trojni ovinek', -110, -30), [, t2] = rl('Trojni ovinek', -35, 35), [t3] = rl('Trojni ovinek', 40, 140);
  check('corners: the fast esses right, then left (20 degrees and more each within 80 m); the triple bend right, left, right (30 degrees and more each)', eR >= 20 && eL >= 20 && t1 >= 30 && t2 >= 30 && t3 >= 30,
    `esses right ${Math.round(eR)}°, left ${Math.round(eL)}°; triple bend right ${Math.round(t1)}°, left ${Math.round(t2)}°, right ${Math.round(t3)}°`);
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 12 m radius (the hairpin the tightest); the legs of the lap at least 40 m apart (room for the run-offs between them)', 1 / kmax >= 12 && legs >= 40, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 16 corners\' apexes (def.turns: the boards and the marshals by them) each on the road, in their order round the lap',
    def.turns.length === 16 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: 10-20 m from the highest (the climb to the triple bend, 2.2-2.8 km) to the lowest (the right at the bottom, 3.7-4.1 km);
// the steepest grade under 6 %
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const dLo = dS(iLo * T.ds), dHi = dS(iHi * T.ds);
  check('heights: 10-20 m from the highest (on the climb to the triple bend, 2.2-2.8 km) to the lowest (the right at the bottom, 3.7-4.1 km), the steepest grade under 6 %',
    hi - lo > 10 && hi - lo < 20 && dHi > 2200 && dHi < 2800 && dLo > 3700 && dLo < 4100 && g < 0.06, `${(hi - lo).toFixed(1)} m, highest at ${Math.round(dHi)} m, lowest at ${Math.round(dLo)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 4. the pits: the lane on the left of the main straight from before the start line to after it, the straight no tighter than a 250 m
// radius along the boxes, the 13 crews' boxes in the lane, the pit wall along it; the main straight's sign before the start line. The
// run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap (both sides; the pit wall is the nearest, 2.5 m)
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const fs = def.names.find(c => c[0] === 'Ciljna ravnina'), dfs = near(fs[1], fs[2]).d, nBox = Math.round((def.pitRow[1] - def.pitRow[0]) / 10) + 1;
  check('pits: the lane on the left of the main straight past the start line, the straight no tighter than a 250 m radius along the boxes, 13 boxes in the lane (the player\'s among them), the pit wall along it',
    !!p0 && p0.t > 0.99 && P[0] < 0 && P[1] < -100 && P[2] > 100 && 1 / kmax > 250 && dfs > T.len - 200 && nBox === 13 && def.pitRow[0] > P[1] + 60 && def.pitRow[1] < P[2] - 30
      && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] + 10 && def.walls.some(w => w[0] <= P[1] && w[1] >= P[2] && w[2] === -1),
    `lane ${P[1]} .. ${P[2]} m, ${-P[0]} m to the left, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m, ${nBox} boxes, the straight's sign ${Math.round(dfs - T.len)} m`);
  let all = 0, wide = 0, min = 1e9; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { const e = b - T.w; all++; if (e > 3) wide++; min = Math.min(min, e); }
  check('run-offs: the barriers more than 3 m past the asphalt along more than 85 % of the lap, nowhere nearer than the pit wall (2.5 m)', wide / all > 0.85 && min >= 2.4, `${(wide / all * 100).toFixed(0)} % past 3 m, nearest ${min.toFixed(1)} m`);
}
// 5. the scenery data (tools/sindia/build.py): terrain and land cover round the track, mostly the savanna's grass, with scrub, fields and
// built-up land; the two grandstands (named after the village and the region: the covered one facing the pits), the old baobabs clear of
// the road
{
  const sk = def.sk, inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const A64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', cnt = [0, 0, 0, 0], rle = def.lc.rle;
  for (let k = 0; k < rle.length;) { const v = A64.indexOf(rle[k++]), cl = v >> 4; let run = (v & 15) + 1; if (run === 16) { let r; do { r = A64.indexOf(rle[k++]); run += r; } while (r === 63); } cnt[cl] += run; }
  const tot = cnt.reduce((a, b) => a + b, 0), main = def.stands[0], bb = [];
  for (let k = 0; k + 2 < sk.bb.length; k += 3) bb.push({ off: near(sk.bb[k], sk.bb[k + 1]).off, h: sk.bb[k + 2] });
  check('scenery: terrain and land cover 300 m and more round the whole track (the savanna 60 % or more, scrub 1 %, fields 2 %, built-up land 0.5 % or more); 2 grandstands (SINDIA covered, facing the pits; THIÈS); 5 old baobabs 35 m and more from the road',
    inGrid(def.dem) && inGrid(def.lc) && tot === def.lc.nx * def.lc.nz && cnt[0] / tot > 0.6 && cnt[1] / tot > 0.01 && cnt[2] / tot > 0.02 && cnt[3] / tot > 0.005 && def.stands.length === 2
      && def.stands.map(s => s[7]).join() === 'SINDIA,THIÈS' && main[2] === 1 && main[4] === 1 && main[0] < def.pitRow[0] && main[1] > def.pitRow[1] && bb.length === 5 && bb.every(b => b.off >= 35 && b.h >= 12),
    `land cover ${cnt.map(v => Math.round(v / tot * 100) + ' %').join(' / ')}, baobabs ${bb.map(b => Math.round(b.off) + ' m').join(', ')}`);
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
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 3-6.5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 180 && d.win < 390, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 3-15 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
