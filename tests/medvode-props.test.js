// Medvode, Slovenija: the knockable roadside things (physics level: Core only; the scenery's own placement is tested in browser/medvode-props.test.mjs).
//  1. Yellow triangular bollards in front of EVERY side road's mouth ("this is not the way"): Track.stubBollards(k): the side roads are closed by the fence at
//     the road's edge (def.sideClosed), the row stands along the road 0.4 m inside it over the whole mouth, at most ~2.5 m apart, none on the asphalt, a
//     sidewalk, an oncoming lane (def.altDn) or a ring.
//  2. Everything small beside the road is a physics prop (the bollards, the street lamps, the zebra crossings' and the bus stops' signs, the street names'
//     plates, the closure boards, the villages' boards, the flag poles, the bench): a car driven into one at ~15 m/s knocks it over (it moves, tips, comes
//     to rest by itself) and loses next to no speed; a car steered into a side road knocks some of the bollards over and is stopped by the fence.
//   node tests/medvode-props.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'medvode'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tt: true, damage: 0 }, o);
const orig = Math.random;

// 1. the bollards in front of every side road's mouth (def.sideClosed: the fence across the mouth at the road's edge, the row along the road just inside it)
{
  const S = T.stubs, rows = [], wrong = [];
  let total = 0, widest = 0, openRows = 0, dup = 0, noMouth = 0;
  const seen = new Set();
  // the buildings the scenery builds (def.bld, without those the data puts on the road or on a side road: as medvode.test.js): no bollard inside one
  const Qb = {}, built = [];
  for (const b of def.bld) { const [x, z, L, W, ang] = b; if (L < 2.2 || W < 2.2) continue;
    const c = Math.cos(ang), s = Math.sin(ang), poly = b[8] ? b[8].reduce((a, v, k) => (k % 2 ? a[a.length - 1].push(v) : a.push([v]), a), []) : null;
    const pts = poly || [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]].map(([p, q]) => [x + c * p - s * q, z + s * p + c * q]);
    if (pts.concat([[x, z]]).some(([px, pz]) => { const q = T.query(px, pz, T.nearestIdx(px, pz), Qb); return (q.k < 0 && !q.over && Math.abs(q.d) < T.wAt(q.a)) || (q.k >= 0 && q.st <= T.stubs[q.k].Lend && Math.abs(q.u) <= (q.st < T.stubs[q.k].te ? T.stubHw(T.stubs[q.k], q.st) : T.stubs[q.k].hw) + 0.3); })) continue;
    built.push({ x, z, r: L + W, c, s, L, W, pts: poly ? pts : null }); }
  const inBuilding = (px, pz) => built.some(b => {
    if ((px - b.x) ** 2 + (pz - b.z) ** 2 > b.r * b.r) return false;
    if (b.pts) { let w = false; const P = b.pts; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > pz) !== (P[j][1] > pz) && px < (P[j][0] - P[i][0]) * (pz - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) w = !w; return w; }
    const dx = px - b.x, dz = pz - b.z; return Math.abs(dx * b.c + dz * b.s) < b.L / 2 + 0.1 && Math.abs(-dx * b.s + dz * b.c) < b.W / 2 + 0.1; });
  const WALK = T.walk;
  const cut = (x, z) => { if (T.onAlt(x, z) || T.rings.some(R => R.zr > 0 && Math.hypot(x - R.x, z - R.z) < R.zr + 0.5)) return true;   // (an oncoming lane, a ring; a house pulling the barrier in to the sidewalk)
    const qm = T._qMain(x, z, T.nearestIdx(x, z), {}), i = qm.a, sd = qm.d > 0 ? 1 : -1; return (sd > 0 ? T.br[i] : T.bl[i]) - T.wAt(i) - (WALK ? WALK[sd > 0 ? 1 : 0][i] : 0) < 0.5; };
  for (const St of S) {
    const b = T.stubBollards(St.k, true), bd = T.stubBollards(St.k); total += bd.length;   // (b: the row of this mouth; bd: without the places an earlier side road sharing the mouth has)
    if (St.m0 < 0) { noMouth++; if (b.length) wrong.push(`#${St.k}: ${b.length} bollards, no mouth on the road`); continue; }   // (it meets a ring or a lane, not the road's edge)
    const why = [], ss = [];
    const im = Math.round((St.m0 + St.m1) / 2), Bm = St.side > 0 ? T.br[im] : T.bl[im], xm = T.px[im] + T.nx[im] * St.side * (Bm - 0.4), zm = T.pz[im] + T.nz[im] * St.side * (Bm - 0.4);
    if (b.length < 3 && !cut(xm, zm)) why.push(`only ${b.length}`);
    for (const p of b) {
      if (p.kind !== 'bollard') why.push('kind ' + p.kind);
      const qm = T._qMain(p.x, p.z, T.nearestIdx(p.x, p.z), {}), sd = qm.d > 0 ? 1 : -1, f = Math.min(T.N - 1.001, Math.max(0, qm.s / T.ds)), i = Math.floor(f), u = f - i, Bs = sd > 0 ? T.br : T.bl, Wk = WALK ? WALK[sd > 0 ? 1 : 0] : null;
      const bar = Bs[i] + (Bs[i + 1] - Bs[i]) * u, e = Math.abs(qm.d) - (T.wAt(i) + (Wk ? Wk[i] : 0)) * (1 - u) - (T.wAt(i + 1) + (Wk ? Wk[i + 1] : 0)) * u;   // (both interpolated at the bollard)
      ss.push(p.i * T.ds);
      if (sd !== St.side) why.push('on the other side of the road');
      if (bar - Math.abs(qm.d) < 0.1 || bar - Math.abs(qm.d) > 0.6) why.push(`not 0.1-0.6 m inside the barrier (${(bar - Math.abs(qm.d)).toFixed(2)} m)`);   // (0.4 m; less by a house, more on the inside of a hairpin)
      if (e < 0.12) why.push(`on the asphalt or the sidewalk (${e.toFixed(2)} m past its edge)`);
      if (p.i < St.m0 - 1 || p.i > St.m1 + 1) why.push(`beside the mouth, not in front of it (${p.i} of ${St.m0}-${St.m1})`);
      if (T.onAlt(p.x, p.z)) why.push('on an oncoming lane');
      for (const R of T.rings) if (R.zr > 0 && Math.hypot(p.x - R.x, p.z - R.z) < R.zr) why.push('in a ring\'s zone');
      if (inBuilding(p.x, p.z)) why.push('inside a building');
    }
    for (const p of bd) { const key = Math.round(p.x * 5) + ',' + Math.round(p.z * 5); if (seen.has(key)) dup++; seen.add(key); }
    let gap = 0; for (let k = 1; k < b.length; k++) { const g = Math.hypot(b[k].x - b[k - 1].x, b[k].z - b[k - 1].z); if (g > 2.5 && cut((b[k].x + b[k - 1].x) / 2, (b[k].z + b[k - 1].z) / 2)) continue; gap = Math.max(gap, g); }   // (in the row's order, along the road; not across a lane, a ring or a house's wall)
    for (const ie of [St.m0, St.m1]) { const Be = St.side > 0 ? T.br[ie] : T.bl[ie], xe = T.px[ie] + T.nx[ie] * St.side * (Be - 0.4), ze = T.pz[ie] + T.nz[ie] * St.side * (Be - 0.4);   // (the row reaches both ends of the mouth)
      if (b.length && !cut(xe, ze) && Math.min(...b.map(p => Math.hypot(p.x - xe, p.z - ze))) > 2.5) why.push(`the mouth's end at ${ie} without a bollard`); }
    if (gap > 2.5) openRows++; widest = Math.max(widest, gap);
    rows.push({ k: St.k, n: b.length, gap });
    if (why.length) wrong.push(`#${St.k} (${Math.round(St.s - T.startS)} m): ${[...new Set(why)].join(', ')}`);
  }
  check('bollards: every side road closed at the road\'s edge has a row of yellow triangular bollards along the road in front of the fence across its mouth (0.4 m inside it, less where a house pulls it in; the whole mouth\'s length), none on the asphalt or a sidewalk, an oncoming lane, a ring or in a building',
    S.length >= 90 && rows.length >= 85 && !wrong.length && !dup, wrong.length ? wrong.slice(0, 6).join(' | ') : `${rows.length} mouths (${noMouth} side roads meet a ring or a lane), ${total} bollards (${Math.min(...rows.map(r => r.n))}-${Math.max(...rows.map(r => r.n))} a row)`);
  check('bollards: ~2.3 m apart along the mouth (at most 2.5 m), except where a lane, a ring or a house\'s wall cuts the row',
    openRows === 0, `${rows.filter(r => r.gap <= 2.5).length} of ${rows.length} rows without a gap over 2.5 m (widest gap ${widest.toFixed(1)} m)`);
}

// 2. everything small beside the road is knockable: a car at ~15 m/s into one of each kind
{
  const KINDS = ['bollard', 'lamp', 'sign', 'bsign', 'nsign', 'zaprta', 'vboard', 'flagp', 'cflag', 'bench'], d0 = 3000, V0 = 15;
  let lat0 = 0;   // (where the car's middle passes the prop's place, from the run without a prop: the road bends a little there)
  const run = (kind, off) => {
    Math.random = seeded(5);
    const r = new C.Race(T, opts({})), P = r.player; r.start(); P.locked = false;
    const i = T.idx(T.startS + d0), j = T.idx(T.startS + d0 + 28), x = T.px[j] + T.nx[j] * (lat0 + (off || 0)), z = T.pz[j] + T.nz[j] * (lat0 + (off || 0));   // (28 m ahead of the car, in its path)
    r.setProps(kind ? [{ kind, x, z, yaw: T.hd[j] + Math.PI / 2, col: 0, i: j }] : [], null);
    P.place(T.px[i], T.pz[i], T.hd[i]); P.y = P.py = T.hy[i]; P.roadY = P.y; P.vx = Math.cos(P.h) * V0; P.vz = Math.sin(P.h) * V0;
    const b = r.props[0] || null, x0 = b && b.x, z0 = b && b.z; let woke = -1, minUp = 1, far = 0, slept = -1, v1 = 0, finite = true, maxY = 0, lat = null;
    for (let k = 0; k < 120 * 12; k++) {
      Math.random = seeded(900 + k); P.inThr = P.speed < V0 ? 1 : 0.2; P.inBrk = 0; P.inSteer = 0;   // (the driver holds his speed)
      r.step(DT);
      if (b) { minUp = Math.min(minUp, 1 - 2 * (b.qx * b.qx + b.qz * b.qz)); far = Math.max(far, Math.hypot(b.x - x0, b.z - z0)); maxY = Math.max(maxY, b.y);
        if (woke < 0 && !b.sleep) woke = k * DT; if (woke >= 0 && slept < 0 && b.sleep) slept = k * DT; if (!Number.isFinite(b.x + b.y + b.z + b.qw)) finite = false; }
      if (k === 192) v1 = P.speed;
      if (lat === null && (P.x - T.px[j]) * T.tx[j] + (P.z - T.pz[j]) * T.tz[j] > 0) lat = (P.x - T.px[j]) * T.nx[j] + (P.z - T.pz[j]) * T.nz[j];
    }
    Math.random = orig;
    return { woke, minUp, far, slept, v1, finite, lat, b, hitUp: b ? 1 - 2 * (b.qx * b.qx + b.qz * b.qz) : 1, rest: b ? Math.hypot(b.x - x0, b.z - z0) : 0, maxY };
  };
  const ctl = run(null), base = ctl.v1, res = {}; lat0 = ctl.lat; for (const k of KINDS) res[k] = run(k);
  const cone = run('cone'), post = run('post'), loss = (r) => 100 * (1 - r.v1 / base), fmt = (k) => `${k} ${loss(res[k]).toFixed(1)} %`;
  check('knock: a car at 15 m/s into a bollard, a lamp, a sign, a flag pole ... knocks each over: it wakes, flies or tips, and moves',
    KINDS.every(k => res[k].woke > 0 && res[k].woke < 2.5 && res[k].far > 1 && res[k].minUp < 0.6), KINDS.map(k => `${k} woke at ${res[k].woke.toFixed(2)} s, moved ${res[k].far.toFixed(1)} m, tipped to ${res[k].minUp.toFixed(2)}`).join('; '));
  check('knock: the car is slowed only slightly (a bollard as much as a cone, every other kind under 10 % in the 0.15 s after the blow, as against a roadside post\'s 5 %)',
    loss(res.bollard) < loss(cone) + 1.5 && KINDS.every(k => loss(res[k]) < 10), KINDS.map(fmt).join(', ') + ` (a cone ${loss(cone).toFixed(1)} %, a post ${loss(post).toFixed(1)} %)`);
  check('knock: each comes to rest on its own within a few seconds (asleep again), nothing flies off to infinity, no NaN',
    KINDS.every(k => res[k].slept > 0 && res[k].slept < 9 && res[k].finite && res[k].rest < 45 && res[k].maxY < T.hy[T.idx(T.startS + d0)] + 8), KINDS.map(k => `${k} asleep at ${res[k].slept.toFixed(1)} s ${res[k].rest.toFixed(0)} m away`).join(', '));
  check('knock: a street lamp (8 m) ends up lying on the ground, not standing or hanging', Math.abs(res.lamp.hitUp) < 0.35 && res.lamp.b.y < T.hy[T.idx(T.startS + d0 + 28)] + 1.2, `its up-axis ${res.lamp.hitUp.toFixed(2)} (1 = standing), height ${res.lamp.b.y.toFixed(2)} m over the road`);
  // not dead centre: a glancing blow 0.6 m to the side still knocks a lamp and a bollard
  const gl = ['lamp', 'bollard', 'bench'].flatMap(k => [[k, run(k, 0.6)], [k, run(k, -0.6)]]);
  check('knock: a glancing blow (0.6 m off the middle of the car, either side) knocks them over too', gl.every(([k, r]) => r.woke > 0 && r.minUp < 0.7), gl.map(([k, r]) => `${k}: woke ${r.woke.toFixed(2)} s, tipped to ${r.minUp.toFixed(2)}`).join(', '));
  // every kind the scenery builder uses exists: set into a race, each gets its own slot (a kind Core does not know is left out)
  const r = new C.Race(T, opts({})); r.setProps(KINDS.map(k => ({ kind: k, x: T.px[100], z: T.pz[100], yaw: 0, col: 0, i: 100 })), null);
  check('props: Core knows every kind the scenery uses (propCap for each), the old kinds unchanged', KINDS.every(k => r.propCap[k] === 1) && ['cone', 'pylon', 'tyre', 'bale', 'crate', 'post'].every(k => { const q = new C.Race(T, opts({})); q.setProps([{ kind: k, x: T.px[100], z: T.pz[100], yaw: 0, col: 0, i: 100 }], null); return q.propCap[k] === 1; }), JSON.stringify(r.propCap));
}

// 3. into a mouth: a car steered straight into a side road from the middle of the road knocks some of the bollards over and is stopped by the fence across
// the mouth (never past the barrier)
{
  const picks = [T.stubs.find(s => s.s > T.startS + 800 && s.m0 >= 0 && s.ang > 80 && s.ang < 100 && s.hw > 3), T.stubs.find(s => s.s > T.startS + 800 && s.m0 >= 0 && s.ang > 80 && s.ang < 100 && s.hw < 2.6 && s.kind === 1)].filter(Boolean);
  const out = picks.map(St => {
    Math.random = seeded(6);
    const r = new C.Race(T, opts({})), P = r.player; r.start(); P.locked = false;
    const rowB = T.stubBollards(St.k); r.setProps(rowB, null); const x0 = r.props.map(b => [b.x, b.z]);
    const p = T.stubPt(St.k, 0, {}), i = T.nearestIdx(p.x, p.z); P.place(p.x, p.z, p.h); P.y = P.py = T.hy[i]; P.roadY = P.y; P.vx = Math.cos(P.h) * 11; P.vz = Math.sin(P.h) * 11;
    const bar = St.side > 0 ? T.br[i] : T.bl[i]; let out = -1e9, wall = 0;
    for (let k = 0; k < 120 * 4; k++) {
      Math.random = seeded(2000 + k); P.inThr = 0.6; P.inBrk = 0; P.inSteer = 0;
      r.step(DT); if (P.hitWall > 0.3) wall++;
      out = Math.max(out, Math.abs((P.x - T.px[i]) * T.nx[i] + (P.z - T.pz[i]) * T.nz[i]) - bar);
    }
    Math.random = orig;
    const knocked = r.props.filter((b, k) => Math.hypot(b.x - x0[k][0], b.z - x0[k][1]) > 0.3).length;
    return { St, knocked, n: rowB.length, out, wall };
  });
  check('mouth: steered straight into a side road (at 11 m/s) the car knocks some of the bollards over and the fence across the mouth stops it (its middle never past the barrier)',
    picks.length === 2 && out.every(o => o.knocked >= 1 && o.out < 0 && o.wall > 0), out.map(o => `#${o.St.k} ${Math.round(o.St.s - T.startS)} m: ${o.knocked} of ${o.n} knocked over, its middle ${(-o.out).toFixed(1)} m short of the barrier at most, against the wall ${o.wall} steps`).join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
