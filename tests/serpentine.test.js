// Serpentines: the two legs of a hairpin (and of a ladder of them) each have a run-off of their own. A barrier never reaches past the
// middle towards the other leg, even where the legs are less than 70 m apart along the road (Track._buildEdges, limitNear: the other
// leg is a sample the road takes 1.4 times the straight line or more to reach). Before, the run-offs of such legs overlapped: on
// Tianmen at the bends 55 and 56 (s = 186-200 m) the lower leg's run-off ran up to 4.4 m past the middle, on under the upper leg's
// verge, 2-3.5 m above it; a car run wide there drove on under it, out of sight, and over into the upper leg's road. Core only:
// - on every real track no barrier past the middle between two legs (where the legs are not too close for any run-off at all, and
//   where the track does not set the barrier itself: def.wide, def.walls; nor in a roundabout's zone, def.rings zr: no barrier of the route's there);
// - on Tianmen at 190 m the run-off is still there, ~1 m short of the middle;
// - on Tianmen a car run wide at 190 m to the outside of bend 55 is stopped by the barrier on its own leg: it stays at its own road's
//   height, short of the middle, and never jumps to the upper leg (before: 2.5 m past the middle, its road 2 m up on the upper leg's).
//   node tests/serpentine.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, trackIds } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

// how far the barrier of sample i on the side of sample j stands past the middle between them along i's normal (d * d / 2 / lateral,
// the centre of the circle through j that touches the road at i), for every j on another leg (70 m or less along the road, the road 1.4
// times the straight line or more; not at a crossing on two levels); [the most, at s, side, the other leg's s, the middle] or null
function pastMiddle(T, i) {
  const N = T.N, ds = T.ds, X = T.cross || [], cd = (a, f) => { const d = Math.abs(a - f); return (T.open ? d : Math.min(d, N - d)) * ds; };
  let worst = null;
  for (let j = 0; j < N; j++) {
    const L = cd(i, j); if (L >= 70 || !L) continue;
    const dx = T.px[j] - T.px[i], dz = T.pz[j] - T.pz[i], d = Math.hypot(dx, dz); if (L < 1.4 * d) continue;
    if (X.some(c => (cd(i, c.lo) < 90 && cd(j, c.up) < 90) || (cd(i, c.up) < 90 && cd(j, c.lo) < 90))) continue;
    const lat = dx * T.nx[i] + dz * T.nz[i], mid = d * d / (2 * Math.max(1e-3, Math.abs(lat))), sd = lat > 0 ? 1 : -1, bar = sd > 0 ? T.br[i] : T.bl[i];
    const wi = T.wAt ? T.wAt(i) : T.w, min = Math.max(wi + Math.min(3.5, T.def.side || 3.5), T.w + 0.8) + 0.05;   // (_buildEdges' least run-off: two legs closer than that have no room for any)
    if (bar <= min) continue;
    if (!worst || bar - mid > worst[0]) worst = [bar - mid, i, sd, j, mid];
  }
  return worst;
}
const sOf = (T, i) => Math.round(i * T.ds - (T.startS || 0));
// where the track sets the barrier on that side itself (def.wide: more run-off on a circuit, Bangsaen's hairpin; def.walls: a street's
// houses and walls, Harju), eased in and out: the track's own choice, not _buildEdges'; or where that barrier stands in a roundabout's
// zone (def.rings with zr, Medvode: wallCollide holds no barrier of the route's there, a car goes round the island as it likes; the
// legs of the ring, its way in and out, meet in it)
function own(T, i, sd) {
  const s0 = i * T.ds - (T.startS || 0), ss = T.open ? [s0] : [s0, s0 - T.len, s0 + T.len];
  const hit = (L, e) => (L || []).some(([a, b, side, , e0]) => side === sd && ss.some(s => s > a - (e0 || e) && s < b + (e0 || e)));
  const bar = sd > 0 ? T.br[i] : T.bl[i], zone = T.inZone && T.inZone(T.px[i] + T.nx[i] * sd * bar, T.pz[i] + T.nz[i] * sd * bar);
  return hit(T.def.wide, 30) || hit(T.def.walls, 20) || zone;
}

// 1. every real track: no barrier past the middle between the legs of a hairpin
{
  const over = [], nT = [];
  for (const id of trackIds(C)) {   // (the real tracks only: the test tracks are for deletion before Google Play, CLAUDE.md »Testne proge«)
    const def = C.TRACKS.find(d => d.id === id), T = new C.Track(def); nT.push(def.id); let w = null;
    for (let i = 0; i < T.N; i++) { const p = pastMiddle(T, i); if (p && !own(T, i, p[2]) && (!w || p[0] > w[0])) w = p; }
    if (w && w[0] > 0.05) over.push(`${def.id} ${w[0].toFixed(2)} m at s ${sOf(T, w[1])} ${w[2] > 0 ? 'R' : 'L'} (the other leg at s ${sOf(T, w[3])}, middle ${w[4].toFixed(1)} m)`);
  }
  check('every real track: no barrier past the middle between two legs of a hairpin (their run-offs never overlap)', !over.length,
    over.length ? over.join('; ') : `${nT.length} tracks`);
}

// 2. Tianmen at 190 m (bends 55 and 56): the lower leg's run-off on the right ends ~1 m short of the middle towards the upper leg
const def = C.TRACKS.find(d => d.id === 'tianmen'), T = new C.Track(def), S0 = T.startS, i190 = T.idx(S0 + 190);
const p190 = pastMiddle(T, i190);
check('Tianmen at 190 m: the run-off on the right ends 0.5-2 m short of the middle towards the upper leg (still a run-off)',
  p190 && p190[2] > 0 && p190[0] < -0.5 && p190[0] > -2 && T.br[i190] > T.w + 4,
  p190 ? `barrier ${T.br[i190].toFixed(2)} m, the middle ${p190[4].toFixed(2)} m (the upper leg at s ${sOf(T, p190[3])}, ${(T.hy[p190[3]] - T.hy[i190]).toFixed(1)} m higher)` : 'no other leg');

// 3. Tianmen: a car run wide at 190 m, straight on at 15 m/s towards the outside of bend 55 (from 178 m, 2 m right of the centre line,
// 0.2 rad to the right of the road, half throttle, no steering), is stopped by its own leg's barrier: it stays on the lower leg at its
// road's height, short of the middle, and never jumps to the upper leg (before: 2.5 m past the middle, its road 2 m up on the upper leg's)
{
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', playerModel: C.MODELS[0], seed: 5 });
  const P = r.player, i0 = T.idx(S0 + 178), h0 = T.hd[i0] + 0.2;   // (11 degrees to the right of the road)
  P.place(T.px[i0] + T.nx[i0] * 2, T.pz[i0] + T.nz[i0] * 2, h0); P.y = P.py = T.hy[i0]; P.q = T.query(P.x, P.z, i0, {}); P.sPrev = P.q.s; P.dist = P.q.s - S0;
  P.vx = Math.cos(h0) * 15; P.vz = Math.sin(h0) * 15; r.start();
  let hit = 0, jumps = 0, maxJ = 0, sLo = 1e9, sHi = -1e9, dMax = -1e9, past = -1e9, dy = 0, y0 = null;
  for (let k = 0; k < 2.5 / DT; k++) {
    P.inThr = 0.5; P.inBrk = 0; P.inSteer = 0; P.digitalSteer = true; r.step(DT);
    hit = Math.max(hit, P.hitWall || 0);
    if (y0 != null && Math.abs(P.roadY - y0) > 0.8) { jumps++; maxJ = Math.max(maxJ, Math.abs(P.roadY - y0)); } y0 = P.roadY;   // (from the first step on: before it roadY is not yet set)
    const s = P.q.s - S0; sLo = Math.min(sLo, s); sHi = Math.max(sHi, s); dMax = Math.max(dMax, P.q.d); dy = Math.max(dy, Math.abs(P.y - T.elevAt(P.q.s).y));
    const pm = pastMiddle(T, P.q.i); if (pm && pm[2] > 0) past = Math.max(past, P.q.d + P.m.wid * 0.5 - pm[4]);
  }
  check('Tianmen: a car run wide at 190 m hits its own barrier and stays on its leg, at its height, short of the middle (no jump to the upper leg)',
    hit > 2 && !jumps && sLo > 150 && sHi < 215 && past < 0 && dy < 0.3,
    `impact ${hit.toFixed(1)} m/s, s ${sLo.toFixed(0)}-${sHi.toFixed(0)} m, out to ${dMax.toFixed(2)} m (its side ${past > -1e8 ? (past >= 0 ? past.toFixed(2) + ' m past' : (-past).toFixed(2) + ' m short of') : 'nowhere near'} the middle), ${jumps} height jumps (largest ${maxJ.toFixed(2)} m), off its road's height ${dy.toFixed(2)} m`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
