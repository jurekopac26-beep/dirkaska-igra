// Medvode, Slovenija: the knockable roadside things (physics level: Core only; the scenery's own placement is tested in browser/medvode-props.test.mjs).
//  1. Yellow triangular bollards across the mouth of EVERY side road ("this is not the way"): Track.stubBollards(k): at least 3 in a row inside the mouth's
//     corridor, at most ~2.5 m apart where nothing is in the way, none on the route's asphalt, an oncoming lane (def.altDn) or a ring's road and island.
//  2. Everything small beside the road is a physics prop (the bollards, the street lamps, the zebra crossings' and the bus stops' signs, the street names'
//     plates, the closure boards, the villages' boards, the flag poles, the bench): a car driven into one at ~15 m/s knocks it over (it moves, tips, comes
//     to rest by itself) and loses next to no speed; a car that goes into a side road through the row of bollards knocks some over.
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

// 1. the bollards across every side road's mouth
{
  const S = T.stubs, sp = { S: null }, rows = [], wrong = [];
  let total = 0, widest = 0, openRows = 0, dup = 0;
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
  for (const St of S) {
    const b = T.stubBollards(St.k); total += b.length;
    const why = [];
    if (b.length < 3) why.push(`only ${b.length}`);
    const us = [], ts = [];
    for (const p of b) {
      if (p.kind !== 'bollard') why.push('kind ' + p.kind);
      sp.S = null; const ok = T._stubProj(St, p.x, p.z, sp), t = sp.t, u = sp.u; us.push(u); ts.push(t);
      if (!ok || t < 0 || t > St.L || Math.abs(u) > T.stubHw(St, t) + 0.05) why.push(`outside the mouth (t ${t.toFixed(1)}, u ${u.toFixed(1)})`);
      // the route's asphalt: the nearest of ALL the route's samples (not the track's own lookup)
      let bi = 0, bd = 1e18; for (let i = 0; i < T.N; i++) { const d = (T.px[i] - p.x) ** 2 + (T.pz[i] - p.z) ** 2; if (d < bd) { bd = d; bi = i; } }
      const lat = (p.x - T.px[bi]) * T.nx[bi] + (p.z - T.pz[bi]) * T.nz[bi];
      if (Math.abs(lat) < T.wAt(bi) + 0.5) why.push(`on the route's asphalt (${Math.abs(lat).toFixed(1)} m from its middle, edge ${T.wAt(bi).toFixed(1)})`);
      // an oncoming lane: its own polyline (x, z pairs) and half width
      for (const L of T.altC) for (let k = 0; k + 3 < L.pts.length; k += 2) { const ax = L.pts[k], az = L.pts[k + 1], dx = L.pts[k + 2] - ax, dz = L.pts[k + 3] - az, l2 = dx * dx + dz * dz || 1e-9, tt = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.z - az) * dz) / l2));
        if (Math.hypot(p.x - ax - dx * tt, p.z - az - dz * tt) < L.hw) { why.push('on an oncoming lane'); break; } }
      if (T.onAlt(p.x, p.z)) why.push('on an oncoming lane (Track.onAlt)');
      for (const R of def.rings) if (Math.hypot(p.x - R.c[0], p.z - R.c[1]) < R.r + (R.hw || 3) + 0.5) why.push('on a ring\'s road or island');
      if (inBuilding(p.x, p.z)) why.push('inside a building');
      const key = Math.round(p.x * 5) + ',' + Math.round(p.z * 5); if (seen.has(key)) dup++; seen.add(key);
    }
    // in a row (one place along the side road), spaced ~2.3 m across it where nothing was in the way
    const o = us.map((u, k) => [u, ts[k]]).sort((a, c) => a[0] - c[0]);
    if (o.length && o[o.length - 1][1] - o[0][1] > 1.3 && Math.max(...ts) - Math.min(...ts) > 1.3) why.push(`not in a row (${(Math.max(...ts) - Math.min(...ts)).toFixed(1)} m along it)`);
    let gap = 0; for (let k = 1; k < o.length; k++) gap = Math.max(gap, o[k][0] - o[k - 1][0]);
    if (gap > 2.5) openRows++; widest = Math.max(widest, gap);
    rows.push({ k: St.k, n: b.length, gap });
    if (why.length) wrong.push(`#${St.k} (${Math.round(St.s - T.startS)} m): ${[...new Set(why)].join(', ')}`);
  }
  check('bollards: every side road has a row of at least 3 yellow triangular bollards inside its mouth, none on the route\'s asphalt, an oncoming lane, a ring or in a building',
    S.length >= 90 && !wrong.length && !dup, wrong.length ? wrong.slice(0, 6).join(' | ') : `${S.length} side roads, ${total} bollards (${Math.min(...rows.map(r => r.n))}-${Math.max(...rows.map(r => r.n))} a row)`);
  check('bollards: ~2.3 m apart across the whole mouth (at most 2.5 m), except where the row is cut short by the road or a lane beside it',
    openRows <= 8 && rows.filter(r => r.gap <= 2.5).length >= S.length - 8, `${rows.filter(r => r.gap <= 2.5).length} of ${S.length} rows without a gap over 2.5 m (${openRows} cut short by the route or a lane, widest gap ${widest.toFixed(1)} m)`);
  // a mouth at 90 degrees: the row spans its width (the flare included) from edge to edge
  const St = S.find(s => s.ang > 85 && s.ang < 95 && s.hw > 3 && s.tb < 16), b = T.stubBollards(St.k), us = b.map(p => { sp.S = null; T._stubProj(St, p.x, p.z, sp); return sp.u; });
  const hwT = T.stubHw(St, b[0].t);
  check('bollards: across the whole width of the mouth, edge to edge (a street meeting the road at a right angle)', Math.min(...us) < -hwT + 0.6 && Math.max(...us) > hwT - 0.6, `row at ${b[0].t.toFixed(1)} m, ${b.length} bollards from u ${Math.min(...us).toFixed(1)} to ${Math.max(...us).toFixed(1)} m, the mouth ${hwT.toFixed(1)} m each side`);
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

// 3. through a mouth: a car that drives into a side road through its row of bollards knocks some over, loses next to no speed, and is not stopped
{
  const picks = [T.stubs.find(s => s.s > T.startS + 800 && s.L > 40 && s.ang > 85 && s.ang < 95 && s.hw > 3 && s.tb < 16), T.stubs.find(s => s.s > T.startS + 800 && s.L > 40 && s.ang > 85 && s.ang < 95 && s.hw < 2.6 && s.tb < 16 && s.kind === 1)].filter(Boolean);
  const out = picks.map(St => {
    Math.random = seeded(6);
    const r = new C.Race(T, opts({})), P = r.player; r.start(); P.locked = false;
    const rowB = T.stubBollards(St.k); r.setProps(rowB, null); const x0 = r.props.map(b => [b.x, b.z]);
    C.stubPlace(P, T, St.k, Math.max(0, St.te - 4), 1); P.vx = Math.cos(P.h) * 11; P.vz = Math.sin(P.h) * 11;
    const tRow = rowB[0].t; let vMin = 1e9, tEnd = 0, wall = 0;
    for (let k = 0; k < 120 * 12; k++) {
      Math.random = seeded(2000 + k); C.stubDrive(P, r, St.k, 1); P.inThr = P.speed < 11 ? 1 : 0.3; P.inBrk = 0; P.hitWall = 0;
      r.step(DT); if (P.hitWall > 0.3) wall++;
      if (P.q.k === St.k && P.q.st > tRow - 3) vMin = Math.min(vMin, P.speed); tEnd = P.q.k === St.k ? P.q.st : tEnd; if (tEnd > tRow + 8) break;
    }
    Math.random = orig;
    const knocked = r.props.filter((b, k) => Math.hypot(b.x - x0[k][0], b.z - x0[k][1]) > 0.3).length;
    return { St, knocked, n: rowB.length, vMin, tEnd, tRow, wall };
  });
  check('mouth: driven into a side road through its row of bollards (at 11 m/s) the car knocks some over, drives on through (past the row, no wall), and keeps its speed',
    picks.length === 2 && out.every(o => o.knocked >= 1 && o.tEnd > o.tRow + 6 && o.vMin > 8.5 && !o.wall), out.map(o => `#${o.St.k} ${Math.round(o.St.s - T.startS)} m: ${o.knocked} of ${o.n} knocked over, through at ${o.tEnd.toFixed(0)}/${o.tRow.toFixed(0)} m, slowest ${o.vMin.toFixed(1)} m/s, walls ${o.wall}`).join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
