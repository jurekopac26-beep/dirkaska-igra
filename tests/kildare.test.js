// Kildare, Ireland: the rallycross lap of the circuit in County Kildare north-west of Naas, tarmac and gravel (1.14 km, clockwise;
// docs/proge/kildare.md). The layout clockwise, almost flat; its corners by plain descriptions in their order round the lap, each turning
// its way; the heights; the gravel (def.surf): its two runs where OSM has them, no kerbs on them and less grip; no pits (a rallycross race
// has no stops), the pit wall along the finish straight and the barriers nowhere folding back on themselves (def.walls on the insides of
// the tight bends); the run-offs grass (def.noGravel); the scenery data (terrain, land cover, the grandstand, the footbridge over the lap,
// the pit garages and the tower by the line, the circuit's other raceways, the power lines, the hills on the horizon); a whole AI race in
// the dry and in the rain.
//   node tests/kildare.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'kildare'), T = new C.Track(def);
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };   // metres after the start line
const near = (x, z) => { const i = T.nearestIdx(x, z); return { i, d: dS(i * T.ds), off: Math.hypot(T.px[i] - x, T.pz[i] - z), lat: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };

// 1. the track: its name (a place and its country), a closed circuit of 8 laps, 1.1-1.2 km (the real lap 1.2 km, realKm 1.2; our line's
// corners filleted), clockwise, not a test track nor one waiting for a choice; at least 600 degrees of turning a kilometre (about 730);
// the most rivals the menu gives a race here (def.maxRivals: the flying start's column on the short lap)
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * -T.pz[j] - T.px[j] * -T.pz[i]; }   // (shoelace with north up: negative = clockwise)
  let turn = 0; for (let i = 0; i < T.N; i++) turn += Math.abs(T.k[i]) * T.ds;
  const perKm = turn * 180 / Math.PI / (T.len / 1000);
  check('track: "Kildare, Irska" ("Kildare, Ireland"), a closed circuit, 8 laps, 1.1-1.2 km (realKm 1.2), clockwise, not a test track, at least 600 °/km of turning, 25 rivals at most',
    def.name === 'Kildare, Irska' && def.en.name === 'Kildare, Ireland' && !T.open && def.laps === 8 && T.len > 1100 && T.len < 1200 && def.realKm === 1.2 && area < 0 && !def.test && !def.pending
      && perKm > 600 && def.maxRivals === 25,
    `${T.len.toFixed(1)} m, area ${Math.round(area / 2)} m², ${Math.round(perKm)} °/km, maxRivals ${def.maxRivals}`);
}
// 2. the corners by plain descriptions (no names of people, firms, sponsors or the circuit), in their order round the lap from the start
// line, each turning its way (+1 left, -1 right) by at least the given angle within 50 m of its place; the tightest radius on the centre
// line (the west hairpin), the nearest legs of the lap apart; the corners' apexes (def.turns) in their order
{
  const want = { 'Desni na makadamu': [-1, 100], 'Hitri levi': [1, 25], 'Zahodna lasnica': [-1, 100], 'Ostri desni': [-1, 60], 'Levi na makadam': [1, 45], 'Severna lasnica': [-1, 100] };
  const order = ['Desni na makadamu', 'Hitri levi', 'Južna ravnina', 'Zahodna lasnica', 'Ostri desni', 'Levi na makadam', 'Makadamska ravnina', 'Severna lasnica', 'Ciljna ravnina'];
  const turn = (s) => { let a = 0; for (let d = -50; d <= 50; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return -a * 180 / Math.PI; };   // (Track.k > 0: a right-hander; here + left)
  const at = def.names.map(([nm, x, z]) => { const q = near(x, z); return { nm, d: q.d, off: q.off, deg: turn(q.i * T.ds) }; });
  check('corners: the 9 named places in their order round the lap (the double right on the gravel ... the finish straight), each on the road, the commentator\'s lines for each',
    at.map(c => c.nm).join('|') === order.join('|') && at.every((c, k) => c.off < 6 && (k === 0 || c.d > at[k - 1].d)) && def.names.every(c => Array.isArray(c[3]) && c[3].length >= 2),
    at.map(c => `${c.nm} ${Math.round(c.d)} m`).join(', '));
  const cs = at.filter(c => want[c.nm]);
  check('corners: each turns its way: right on the gravel after the start, at the west hairpin, the sharp right and the north hairpin; left at the fast left and the left onto the gravel',
    cs.length === 6 && cs.every(c => Math.sign(c.deg) === want[c.nm][0] && Math.abs(c.deg) >= want[c.nm][1]), cs.map(c => `${c.nm} ${c.deg > 0 ? 'L' : 'R'} ${Math.abs(Math.round(c.deg))}°`).join(', '));
  let kmax = 0; for (let i = 0; i < T.N; i++) kmax = Math.max(kmax, Math.abs(T.k[i]));
  let legs = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N; j += 2) { const a = Math.abs(i - j) * T.ds; if (Math.min(a, T.len - a) < 80) continue; legs = Math.min(legs, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j])); }
  check('track: no bend under a 9 m radius (the west hairpin the tightest); the legs of the lap at least 40 m apart', 1 / kmax >= 9 && legs >= 40, `tightest radius ${(1 / kmax).toFixed(1)} m, nearest legs ${legs.toFixed(1)} m`);
  check('track: the 8 corners\' apexes (def.turns: the TV towers, the photographers and the recovery by them) each on the road, in their order round the lap',
    def.turns.length === 8 && def.turns.map(([x, z]) => near(x, z)).every((q, k, a) => q.off < 6 && (k === 0 || q.d > a[k - 1].d)));
}
// 3. the heights: the plain of Kildare, almost flat: within 5 m all round, the steepest grade under 4 %
{
  let lo = 1e9, hi = -1e9, g = 0; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); g = Math.max(g, Math.abs(T.grade[i])); }
  check('heights: within 5 m all round, the steepest grade under 4 %', hi - lo < 5 && g < 0.04, `${(hi - lo).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 4. the gravel (def.surf, OSM's surface=gravel): the double right after the start (from about 58 m to 130 m) and from the left onto the
// gravel up the west side to the north hairpin (about 582-817 m), the rest tarmac; no kerbs on it, less grip than on the tarmac
{
  const runs = []; let cur = null, kerb = 0;
  for (let d = 0; d < T.len; d += T.ds) { const i = T.idx(T.startS + d), on = !!T.sf && T.sf[i] === 5; if (on && T.curb[i]) kerb++; if (on && !cur) cur = [d, d]; if (on) cur[1] = d; if (!on && cur) { runs.push(cur); cur = null; } }
  if (cur) runs.push(cur);
  const g = T.gk ? T.gk[T.idx(T.startS + 100)] : 1, a = T.gk ? T.gk[T.idx(T.startS + 300)] : 1;
  check('gravel: two runs, about 58-130 m (the double right) and 582-817 m (the left onto the gravel ... the north hairpin), no kerbs on them, less grip than the tarmac',
    runs.length === 2 && Math.abs(runs[0][0] - 58) < 6 && Math.abs(runs[0][1] - 130) < 6 && Math.abs(runs[1][0] - 582) < 6 && Math.abs(runs[1][1] - 817) < 6 && kerb === 0 && g < a && g > 0.7,
    runs.map(r => `${Math.round(r[0])}-${Math.round(r[1])} m`).join(', ') + `, ${kerb} kerb samples, grip ${g} (tarmac ${a})`);
}
// 5. no pits (a rallycross race has no stops): the pit wall on the right of the finish straight 1.2 m past the road's edge, from before the
// start line to past it; the run-offs grass (def.noGravel), the barriers more than 3 m past the asphalt along more than 80 % of the lap
// (both sides); nowhere the barrier folds back on itself (def.walls on the insides of the five tight bends)
{
  const pw = def.walls.find(w => w[2] === 1 && w[3] === 1.2);
  let wallOk = !!pw; if (pw) for (let d = pw[0] + 2; d <= pw[1] - 2; d += T.ds) if (Math.abs(T.br[T.idx(T.startS + d)] - T.w - 1.2) > 0.05) wallOk = false;
  check('pits: none (no def.pit, a rallycross race has no stops); the pit wall on the right of the finish straight 1.2 m past the road\'s edge, from 200 m and more before the line to past it',
    !def.pit && !!pw && pw[0] <= -200 && pw[1] > 0 && wallOk, pw ? `${pw[0]} .. ${pw[1]} m` : 'no pit wall');
  let all = 0, wide = 0; for (let i = 0; i < T.N; i++) for (const b of [T.bl[i], T.br[i]]) { all++; if (b - T.w > 3) wide++; }
  const folds = [];
  for (const [nm, s, B] of [['left', -1, T.bl], ['right', 1, T.br]]) for (let i = 0; i < T.N; i++) {
    const j = (i + 1) % T.N, bx = T.px[j] + T.nx[j] * s * B[j] - T.px[i] - T.nx[i] * s * B[i], bz = T.pz[j] + T.nz[j] * s * B[j] - T.pz[i] - T.nz[i] * s * B[i];
    if (bx * (T.px[j] - T.px[i]) + bz * (T.pz[j] - T.pz[i]) < 0) folds.push(`${nm} ${Math.round(dS(i * T.ds))} m`); }
  check('run-offs: grass (no gravel traps), the barriers more than 3 m past the asphalt along more than 80 % of the lap; no barrier folding back on itself',
    def.noGravel === true && wide / all > 0.8 && folds.length === 0, `${(wide / all * 100).toFixed(0)} % past 3 m; folds: ${folds.join(', ') || 'none'}`);
}
// 6. the scenery data (tools/kildare/build.py, OSM): terrain and land cover round the track; the grandstand by the double right after the
// start (KILDARE), from 45 m on (the footbridge's steps come down just before it); the footbridge over the lap 40-50 m after the line; the
// pit garages right of the finish straight (kind 4) and the tower by the line (kind 6); the circuit's other raceways (20 and more), the
// gravel one crossing the south straight; the power lines, one of them within 100 m; the horizon (def.far: rings of the highest ground
// round the circuit, the hill to the west-south-west 200 m and higher 8-10 km away)
{
  const sk = def.sk, b7 = sk.bld, F = def.far, bin = Buffer.from(F.b64, 'base64'), H = (k, a) => F.lo + bin[k * F.na + a] * F.step;
  const inGrid = (g) => { const x1 = g.x0 + g.nx * g.cell, z1 = g.z0 + g.nz * g.cell; for (let i = 0; i < T.N; i++) if (T.px[i] < g.x0 + 300 || T.px[i] > x1 - 300 || T.pz[i] < g.z0 + 300 || T.pz[i] > z1 - 300) return false; return true; };
  const kind = (k) => { const out = []; for (let j = 0; j < b7.length; j += 7) if (b7[j + 6] === k) out.push(near(b7[j], b7[j + 1])); return out; };
  const gar = kind(4), tow = kind(6), st = def.stands[0];
  check('scenery: terrain and land cover 300 m and more round the whole track; 1 grandstand (KILDARE) on the left from 45 m on; the pit garages right of the finish straight, the tower right by the line',
    inGrid(def.dem) && inGrid(def.lc) && def.stands.length === 1 && st[7] === 'KILDARE' && st[2] === -1 && st[0] >= 45 && b7.length % 7 === 0
      && gar.length === 1 && gar[0].lat > 15 && gar[0].d > 900 && tow.length === 1 && tow[0].lat > 15 && (tow[0].d > T.len - 40 || tow[0].d < 20),
    `${b7.length / 7} buildings, the grandstand from ${st[0]} m, the garages at ${gar.map(q => Math.round(q.d)).join()} m, the tower at ${tow.map(q => Math.round(q.d)).join()} m`);
  const [x0, z0, x1, z1] = sk.foot[0]; let fb = { off: 1e9 }; for (let t = 0; t <= 1; t += 0.01) { const q = near(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t); if (q.off < fb.off) fb = q; }
  let grav = null; for (const [sf, p] of sk.race) if (sf === 5) for (let k = 0; k < p.length; k += 2) { const q = near(p[k], p[k + 1]); if (!grav || q.off < grav.off) grav = q; }
  let pole = 1e9; for (const [, p] of sk.power) for (let k = 0; k < p.length; k += 3) pole = Math.min(pole, near(p[k], p[k + 1]).off);
  check('scenery: the footbridge over the lap 40-50 m after the line; 20 or more of the circuit\'s other raceways, the gravel one crossing the south straight (300-330 m); 3 or more power lines, one within 100 m',
    sk.foot.length === 1 && fb.off < 3 && fb.d > 40 && fb.d < 50 && sk.race.length >= 20 && !!grav && grav.off < 3 && grav.d > 300 && grav.d < 330 && sk.power.length >= 3 && pole < 100,
    `the footbridge at ${fb.d.toFixed(1)} m, ${sk.race.length} raceways, the gravel one at ${grav && Math.round(grav.d)} m, ${sk.power.length} power lines, the nearest ${Math.round(pole)} m`);
  let wsw = 0; for (let k = 0; k < F.r.length; k++) if (F.r[k] >= 8000 && F.r[k] <= 10000) for (let a = 0; a < F.na; a++) { const az = a / F.na * 360; if (az >= 225 && az <= 270) wsw = Math.max(wsw, H(k, a)); }
  check('horizon: 10 rings of 180 directions out to 11.5 km, the hill to the west-south-west 200 m and higher 8-10 km away',
    F.na === 180 && F.r.length === 10 && bin.length === F.na * F.r.length && F.r[F.r.length - 1] === 11500 && wsw >= 200, `the west-south-west ${wsw} m`);
}
// 7. a whole race: 12 AI and the player on the autopilot, 2 laps, everyone to the finish without a rescue; in the rain 10-25 % slower (a third less grip in the wet: docs/dez-sneg.md)
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
  check('race: 13 cars, 2 laps, all to the finish, no rescue; the winner in 1-2 min', d.fin === 13 && d.cars === 13 && !d.resc && d.win > 60 && d.win < 120, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(2)} s, ${d.resc} rescues`);
  check('race in the rain: all to the finish, no rescue, the winner 10-25 % slower', w.fin === 13 && !w.resc && w.win / d.win > 1.1 && w.win / d.win < 1.25, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(2)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower)`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
