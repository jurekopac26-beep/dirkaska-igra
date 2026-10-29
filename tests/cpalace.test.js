// Crystal Palace, London: the park circuit of 1937-1939 (2 miles = 3.219 km, clockwise). The layout at its real length, run clockwise, its
// corners in their order round the lap and turning the right way, the same line cut short by the post-war New Link at the post-war length,
// the heights, the pits beside the start line on the Stadium Straight, the park's scenery data, and a whole AI race to the finish in the dry
// and in the rain.
//   node tests/cpalace.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'cpalace'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line

// 1. the track: its name (a place and its country), a closed circuit of 2 laps, 3.219 km within 0.5 %, clockwise
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  check('track: "Crystal Palace, Anglija" (English "Crystal Palace, England"), a closed circuit, 2 laps, 3.219 km within 0.5 % (realKm), clockwise, not a test track',
    def.name === 'Crystal Palace, Anglija' && def.en.name === 'Crystal Palace, England' && !T.open && def.laps === 2 && Math.abs(T.len / 3219 - 1) < 0.005 && def.realKm === 3.219 && area < 0 && !def.test,
    `${T.len.toFixed(1)} m (${((T.len / 3219 - 1) * 100).toFixed(2)} %), area ${Math.round(area / 2)} m²`);
}
// 2. the corners by their historical names, in their order round the lap from the start line, each turning its way (+1 left, -1 right) by at
// least the given angle within 50 m of its place; the tightest radius of a corner on the centre line
{
  const want = { 'Ramp Bend': [-1, 25], 'South Tower Corner': [-1, 60], 'North Tower Crescent': [-1, 60], "Fisherman's Bend": [-1, 60], 'Pond Hairpin': [-1, 90], 'Big Tree Bend': [1, 100], 'Stadium Dip': [1, 70], 'Stadium Curve': [-1, 60] };
  const order = ['Ramp Bend', 'The Ramp', 'South Tower Corner', 'Terrace Straight', 'North Tower Crescent', 'The Glades', "Fisherman's Bend", 'Pond Hairpin', 'Big Tree Bend', 'New Zealand Hill', 'Stadium Dip', 'Stadium Curve', 'Stadium Straight'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const i = T.nearestIdx(x, z); return { nm, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), deg: turn(i * T.ds) }; });
  check('corners: the 13 named places in their historical order round the lap (Ramp Bend ... the Stadium Straight), each on the road',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)), at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right at Ramp Bend, South Tower Corner, North Tower Crescent, Fisherman\'s Bend, the Pond Hairpin and the Stadium Curve, left at Big Tree Bend (the hard left) and the Stadium Dip',
    cs.length === 8 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let near = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; near = Math.min(near, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 10 m radius; the legs of the upper park (by the round pond) at least 20 m apart', 1 / kmax >= 10 && near >= 20, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${near.toFixed(1)} m`);
}
// 3. the same line cut short by the New Link of 1953 (from the exit of Fisherman's Bend straight down to the top of the Stadium Straight):
// the post-war circuit's 1.39 miles (2.237 km) within 1.5 %
{
  const fb = def.names.find(c => c[0] === "Fisherman's Bend"), ss = def.names.find(c => c[0] === 'Stadium Straight');
  const a = dS(T.nearestIdx(fb[1], fb[2]) * T.ds) + 45, b = dS(T.nearestIdx(ss[1], ss[2]) * T.ds) - 30;   // (the link: from 45 m past the bend's apex to 30 m before the straight's sign)
  const A = T.idx(T.startS + a), B = T.idx(T.startS + b), link = Math.hypot(T.px[A] - T.px[B], T.pz[A] - T.pz[B]), post = T.len - (b - a) + link;
  check('layout: cut short by the New Link (straight from the exit of Fisherman\'s Bend to the Stadium Straight) the line is 2.237 km within 1.5 % (1953-1972)',
    Math.abs(post / 2237 - 1) < 0.015 && link > 120 && link < 260, `${post.toFixed(0)} m, the link ${link.toFixed(0)} m`);
}
// 4. the heights: 25-27 m between the Stadium Straight (the lowest) and North Tower Crescent (the highest), the steepest grade under 17 %
{
  let lo = 1e9, hi = -1e9, iLo = 0, iHi = 0, g = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; iLo = i; } if (T.hy[i] > hi) { hi = T.hy[i]; iHi = i; } g = Math.max(g, Math.abs(T.grade[i])); }
  const nt = def.names.find(c => c[0] === 'North Tower Crescent'), dHi = Math.abs(dS(iHi * T.ds) - dS(T.nearestIdx(nt[1], nt[2]) * T.ds)), dLo = dS(iLo * T.ds);
  check('heights: 25-27 m from the lowest (the Stadium Straight, by the start) to the highest (within 150 m of North Tower Crescent), the steepest grade 10-17 %',
    hi - lo > 25 && hi - lo < 27 && (dLo < 300 || dLo > T.len - 200) && dHi < 150 && g > 0.1 && g < 0.17, `${(hi - lo).toFixed(1)} m, lowest at ${Math.round(dLo)} m, highest ${Math.round(dHi)} m from North Tower Crescent, steepest ${(g * 100).toFixed(1)} %`);
}
// 5. the pits: on the right of the Stadium Straight, the lane alongside the start line, a straight there; the start line on the straight
{
  const P = def.pit, p0 = T.pitAt(T.startS); let kmax = 0; for (let d = P[1] + 60; d <= P[2] - 30; d += T.ds) kmax = Math.max(kmax, Math.abs(T.k[T.idx(T.startS + d)]));
  const ss = def.names.find(c => c[0] === 'Stadium Straight'), dss = dS(T.nearestIdx(ss[1], ss[2]) * T.ds), rb = def.names.find(c => c[0] === 'Ramp Bend'), drb = dS(T.nearestIdx(rb[1], rb[2]) * T.ds);
  check('pits: the lane on the right of the Stadium Straight past the start line (from before it to after it), the straight no tighter than a 250 m radius along the boxes, the start line between the Stadium Straight\'s sign and Ramp Bend',
    !!p0 && p0.t > 0.99 && P[0] > 0 && P[1] < -80 && P[2] > 80 && 1 / kmax > 250 && (dss > T.len - 200) && drb > 200 && drb < 400 && def.pitRow[0] > P[1] && def.pitRow[1] < P[2],
    `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, tightest radius along the boxes ${(1 / kmax).toFixed(0)} m; the straight's sign ${Math.round(dss - T.len)} m, Ramp Bend +${Math.round(drb)} m`);
}
// 6. the park's scenery data: the lakes (one with the sculptures' islands), the 1854 sculptures, the six sphinxes, the two terrace walls, the mast,
// the houses round the park; the period look (no kerbs, no gravel traps)
{
  const cp = def.cp, isl = cp.lakes.filter(l => l.length > 2).length;
  check('scenery: lakes (one with islands), 28 sculptures by the lake, 6 sphinxes, 2 terrace walls, the mast, houses; no kerbs and no gravel traps (the 1930s)',
    cp.lakes.length >= 3 && isl >= 1 && cp.dinos.length === 28 && cp.sphinx.length === 6 && cp.terr.length === 2 && cp.tower.length === 2 && cp.houses.length / 6 > 300 && def.noCurbs && def.noGravel && T.curb.every(v => !v),
    `${cp.lakes.length} lakes (${isl} with islands), ${cp.dinos.length} sculptures, ${cp.sphinx.length} sphinxes, ${cp.terr.length} walls, ${cp.houses.length / 6} houses`);
}
// 7. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 3-15 % slower
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 420 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] && fin[0].finishTime, resc };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 2.5-3.5 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 150 && d.win < 210, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 3-15 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.03 && w.win / d.win < 1.15, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
