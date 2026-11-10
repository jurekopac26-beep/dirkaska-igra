// p11: riding the outside barrier of a REAL track's bend on purpose against the game's own driver (aiControl), Race.step, damage 'Samo videz' (1).
// The bend: the longest run of bend (R < 250 m) with a hard surface right up to its outside barrier. Timed from 250 m before it to 250 m after it.
'use strict';
const L = require('./lib.js'), { C, DT, D, wrap } = L;
function bendOf(T, nth) { const N = T.N, ds = T.len / N, runs = []; let run = 0, turn = 0, side0 = 0;
  for (let i = 0; i < N; i++) { const j = (i + 1) % N, dh = wrap(T.hd[j] - T.hd[i]), R = Math.abs(dh) > 1e-6 ? ds / Math.abs(dh) : 1e9, side = dh > 0 ? -1 : 1, B = side > 0 ? T.br[i] : T.bl[i];
    const q = T.query(T.px[i] + T.nx[i] * side * (B - 0.4), T.pz[i] + T.nz[i] * side * (B - 0.4), i, {}), sf = T.surface(q), ok = R <= 250 && (sf === 0 || sf === 1 || sf === 4 || sf === 7) && (!run || side === side0);
    if (ok) { if (!run) side0 = side; run++; turn += Math.abs(dh); } else { if (run * ds > 60) runs.push({ i0: i - run, i1: i, len: run * ds, turn: turn * D, side: side0 }); run = 0; turn = 0; } }
  runs.sort((a, b) => b.turn - a.turn); return runs[nth || 0]; }
function lap(T, Bd, kaj, phys, id) {
  const N = T.N, ds = T.len / N, race = L.mkRace(T, id || 'rally', phys, { damage: 1 }), c = race.player, pre = 600, iS = ((Bd.i0 - Math.round(pre / ds)) % N + N) % N;
  if (T.def.pit && (T.pitAt(iS * ds) )) { /* (a start in the pit zone is fine: the car is on the road) */ }
  L.put(c, T, T.px[iS], T.pz[iS], T.hd[iS], 140 / 3.6); c.digitalSteer = false;
  const d0 = c.dist, dA = d0 + pre, dB = dA + Bd.len, m0 = dA - 250, m1 = dB + 250; let t0 = null, t1 = null, t = 0, hitMax = 0, ud = 0, tch = 0, vMin = 1e9, vA = 0, vB = 0, fell = false, wallEnd = 0;
  for (let k = 0; k < 90 * 120; k++) {
    const d = c.dist;
    if (kaj === 'avtopilot' || d < m0 || d >= dB) C.aiControl(c, race, DT);
    else { const SIDE = Bd.side, rm = L.room(c, T, SIDE), lean = (rm > 0.4 ? 5 : 1.2) / D, hErr = wrap(T.hd[c.q.i] + SIDE * lean - c.h); c.inThr = 1; c.inBrk = 0; c.inHand = 0; c.inSteer = C.clamp(4 * hErr, -1, 1); }
    c.wallX = NaN; race.step(DT); t += DT; const hit = c.hitWall; c.hitWall = 0; c.hitCar = 0; const sp = Math.hypot(c.vx, c.vz) * 3.6;
    if (c.fall) { fell = true; break; }
    if (t0 == null && c.dist >= m0) t0 = t;
    if (t0 != null && t1 == null) { hitMax = Math.max(hitMax, hit); if (hit > 2.5) ud++; if (hit > 6) wallEnd++; if (!Number.isNaN(c.wallX)) tch++; if (c.dist >= dA && c.dist < dB) vMin = Math.min(vMin, sp); }
    if (!vA && c.dist >= dA) vA = sp; if (!vB && c.dist >= dB) vB = sp;
    if (t1 == null && c.dist >= m1) { t1 = t; break; }
  }
  const f = (x, d = 0) => x == null || !Number.isFinite(x) ? '-' : x.toFixed(d);
  return { kaj, fiz: phys, 'cas s': f(t1 - t0, 2), 'v na zacetku ovinka': f(vA), vMin: f(vMin), 'v na koncu ovinka': f(vB), 'stik s': f(tch * DT, 2), hit: f(hitMax, 1), 'udarci > 2.5': ud, 'udarci > 6 m/s': wallEnd, sk: f(c.dmg * 100), padel: fell, t1 };
}
const tids = process.argv[2] ? process.argv[2].split(',') : ['marrakesh', 'bathurst', 'rbring', 'spa'], nth = +(process.argv[3] || 0);
const rows = [];
for (const tid of tids) { const T = L.track(tid), Bd = bendOf(T, nth); if (!Bd) { console.log(tid, 'brez takega ovinka'); continue; }
  const N = T.N, ds = T.len / N, im = Math.round((Bd.i0 + Bd.i1) / 2) % N, B = Bd.side > 0 ? T.br[im] : T.bl[im], Rm = Bd.len / (Bd.turn / D);
  for (const phys of ['cs', 'nova']) { const a = lap(T, Bd, 'avtopilot', phys), b = lap(T, Bd, 'po ograji', phys);
    for (const r of [a, b]) { delete r.t1; rows.push(Object.assign({ proga: tid, ovinek: `${Bd.len.toFixed(0)} m, ${Bd.turn.toFixed(0)} deg, R~${Rm.toFixed(0)} m, ${(Bd.i0 * ds - T.startS).toFixed(0)} m po startu, ograja ${(B - (T.wAt ? T.wAt(im) : T.w)).toFixed(1)} m od roba` }, r)); } } }
console.table(rows);
