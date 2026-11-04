// Medvode, Slovenija: the knockable roadside things (physics level: Core only; the scenery's own placement is tested in browser/medvode-props.test.mjs).
// The road is a race circuit now (def.barrier: a steel barrier along the whole road, the asphalt run-off out to it): the side roads are closed by that barrier
// itself, straight across their mouths (def.sideClosed), so there are no yellow bollards in front of them any more and no closures down them (the browser test
// checks that the world has none). The knockable things: the tyre stacks (where a rail ends at a house's corner, at a run's open ends, in two rows along each
// ring's wall), the street lamps, the zebra crossings' and the bus stops' signs, the street names' plates, the villages' boards, the flag poles, the bench; (r9)
// the straw-bale stacks on the outside of the castle road's hairpins and the sharp corners (def.bales) and the islands' signs, each on a stack of three heavy
// rubber bases ('isign': knocked down, the three bases and the board on its post burst apart and, heavy, do not go far).
//  1. The mouths: every side road is closed by the barrier across its whole width (a car's point driven down it from the road, at five places across its width,
//     is stopped before it leaves the free ground), out in the run-off (0.5 m past the asphalt or the sidewalk at least) or at a ring's zone circle.
//  2. A car driven into one of each knockable kind at ~15 m/s knocks it over (it moves, tips or, a tyre stack, bursts into its tyres, comes to rest by itself)
//     and loses little speed.
//  3. A car steered straight into each side road's mouth from the middle of the road is stopped by the barrier across it (its middle never past the edge of the
//     free ground); a car driven along a ring's road into the wall across it knocks over the tyre stacks in front of the wall (standing on the ring's own surface,
//     as the scenery puts them) and is stopped by the wall (never through it).
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
const WALK = T.walk, wE = (si, i) => T.wAt(i) + (WALK ? WALK[si][i] : 0);
const mkCar = (x, z, h, fx, fz) => ({ x, z, px: fx, pz: fz, h: 0, vx: 0, vz: 0, w: 0, m: { mass: 1000 }, I: 1000, corners: [[0, 0], [-0.6, 0], [-0.8, 0], [-1.0, 0]], q: { i: h }, hitWall: 0, fxWall: 0, isPlayer: false, pitWant: false, inPit: false });

// how far (x, z) lies past the edge of the cars' free ground (the route's barrier as the nearest sample has it, a ring's zone circle; <= 0 inside)
const pastFree = (x, z) => { const q = T._qMain(x, z, T.nearestIdx(x, z), {}); let best = q.over ? 0 : Math.abs(q.d) - (q.d > 0 ? q.br : q.bl);
  for (const R of T.rings) if (R.zr > 0) best = Math.min(best, Math.hypot(x - R.x, z - R.z) - R.zr); return best; };

// 1. the mouths: the barrier straight across each (def.sideClosed: no gap), no bollards needed: a car's point driven down each side road from the road, at five
// places across its width (the middle, halfway and 0.2 of its half width from either edge; its hint following its last query, as in the game), is stopped
// (pushed back) before it leaves the free ground (a hole: 0.3 m past its edge and not stopped), out in the run-off (0.5 m past the asphalt or the sidewalk at
// least) or at a ring's zone circle; or it stays in the free ground all its way (a side road that runs on in the run-off or into a ring's zone)
{
  const S = T.stubs, wrong = [], runoff = [], ringZone = (x, z) => T.rings.some(R => Math.abs(Math.hypot(x - R.x, z - R.z) - R.zr) < 1.5);
  let lanes = 0, atRing = 0, inside = 0;
  for (const St of S) {
    const why = [];
    for (const f of [-0.8, -0.4, 0, 0.4, 0.8]) {
      const p0 = T.stubPt(St.k, 0, {}); let hint = T.nearestIdx(p0.x, p0.z), q = {}, stop = null, hole = null; lanes++;
      for (let t = 0; t < Math.max(St.L, St.Lend || 0) - 1; t += 0.5) {
        const p = T.stubPt(St.k, t, {}), u = f * T.stubHw(St, t), x = p.x - p.tz * u, z = p.z + p.tx * u; q = T.query(x, z, hint, q); hint = q.i;
        const c = mkCar(x, z, hint, x - p.tx * 1.5, z - p.tz * 1.5); c.h = p.h; C.wallCollide(c, T, false); if (Math.hypot(c.x - x, c.z - z) > 0.05) { stop = { t, x, z }; break; }
        const e = pastFree(x, z); if (e > 0.3) { hole = { t, e }; break; }
      }
      if (hole) { why.push(`a hole at ${f} of its half width (${hole.t} m down it, ${hole.e.toFixed(1)} m past the barrier and not stopped)`); continue; }
      if (!stop) { inside++; continue; }
      if (ringZone(stop.x, stop.z)) { atRing++; continue; }
      const qm = T._qMain(stop.x, stop.z, T.nearestIdx(stop.x, stop.z), {}), si = qm.d > 0 ? 1 : 0, j = Math.min(T.N - 1, qm.a + 1), e = Math.abs(qm.d) - (wE(si, qm.a) * (1 - qm.t) + wE(si, j) * qm.t);
      runoff.push(e); if (e < 0.5) why.push(`stopped ${e.toFixed(2)} m past the road's edge at ${f} of its half width`);
    }
    if (why.length) wrong.push(`#${St.k} ${St.name || ''} (d ${St.s}): ${[...new Set(why)].slice(0, 3).join(', ')}`);
  }
  runoff.sort((a, b) => a - b);
  check('mouths: every side road is closed by the barrier straight across its mouth, across its whole width (no bollards, no closures down it: a car\'s point driven down it anywhere across its width is stopped before it leaves the free ground), out in the run-off (0.5 m past the asphalt or the sidewalk at least) or at a ring\'s zone circle',
    S.length >= 90 && def.sideClosed && !T.gap[0].some(v => v) && !T.gap[1].some(v => v) && !wrong.length && runoff.length > 0.8 * lanes,
    (wrong.length ? wrong.slice(0, 6).join(' | ') + ' || ' : '') + `${S.length} side roads, ${lanes} lines down them: ${runoff.length} stopped in the run-off ${runoff[0].toFixed(2)}-${runoff[runoff.length - 1].toFixed(2)} m past the road's edge (median ${runoff[runoff.length >> 1].toFixed(1)} m), ${atRing} at a ring's zone circle, ${inside} in the free ground all their way (the run-off, a ring's zone)`);
}

// 2. everything small beside the road is knockable: a car at ~15 m/s into one of each kind (a tyre stack bursts into its three tyres)
const KINDS = ['tstack', 'mlamp', 'msign', 'bsign', 'nsign', 'vboard', 'flagp', 'cflag', 'bench', 'bstack', 'isign'], STACK = { tstack: 'its three tyres', bstack: 'its three bales', isign: 'its three bases and the board' };   // (STACK: the kinds that burst into their parts)
{
  const d0 = 3000, V0 = 15;
  let lat0 = 0;   // (where the car's middle passes the prop's place, from the run without a prop: the road bends a little there)
  const run = (kind, off) => {
    Math.random = seeded(5);
    const r = new C.Race(T, opts({})), P = r.player; r.start(); P.locked = false;
    const i = T.idx(T.startS + d0), j = T.idx(T.startS + d0 + 28), x = T.px[j] + T.nx[j] * (lat0 + (off || 0)), z = T.pz[j] + T.nz[j] * (lat0 + (off || 0));   // (28 m ahead of the car, in its path)
    r.setProps(kind ? [{ kind, x, z, yaw: T.hd[j] + Math.PI / 2, col: 0, i: j }] : [], null);
    P.place(T.px[i], T.pz[i], T.hd[i]); P.y = P.py = T.hy[i]; P.roadY = P.y; P.vx = Math.cos(P.h) * V0; P.vz = Math.sin(P.h) * V0;
    const b = r.props[0] || null, x0 = b && b.x, z0 = b && b.z, parts = b && b.parts ? b.parts : null, bodies = parts || (b ? [b] : []);   // (a stack: its tyres are what moves once it bursts)
    let woke = -1, minUp = 1, far = 0, slept = -1, v1 = 0, finite = true, maxY = 0, lat = null;
    for (let k = 0; k < 120 * 12; k++) {
      Math.random = seeded(900 + k); P.inThr = P.speed < V0 ? 1 : 0.2; P.inBrk = 0; P.inSteer = 0;   // (the driver holds his speed)
      r.step(DT);
      if (b) {
        const hit = parts ? b.dead : !b.sleep;
        for (const p of bodies) { if (parts && p.hidden) continue; minUp = Math.min(minUp, 1 - 2 * (p.qx * p.qx + p.qz * p.qz)); far = Math.max(far, Math.hypot(p.x - x0, p.z - z0)); maxY = Math.max(maxY, p.y); if (!Number.isFinite(p.x + p.y + p.z + p.qw)) finite = false; }
        if (woke < 0 && hit) woke = k * DT; if (woke >= 0 && slept < 0 && bodies.every(p => p.sleep)) slept = k * DT;
      }
      if (k === 192) v1 = P.speed;
      if (lat === null && (P.x - T.px[j]) * T.tx[j] + (P.z - T.pz[j]) * T.tz[j] > 0) lat = (P.x - T.px[j]) * T.nx[j] + (P.z - T.pz[j]) * T.nz[j];
    }
    Math.random = orig;
    return { woke, minUp, far, slept, v1, finite, lat, b, burst: !!(parts && b.dead && parts.every(p => !p.hidden)), hitUp: b ? 1 - 2 * (b.qx * b.qx + b.qz * b.qz) : 1, rest: bodies.length ? Math.max(...bodies.map(p => Math.hypot(p.x - x0, p.z - z0))) : 0, maxY };
  };
  const ctl = run(null), base = ctl.v1, res = {}; lat0 = ctl.lat; for (const k of KINDS) res[k] = run(k);
  const cone = run('cone'), post = run('post'), loss = (r) => 100 * (1 - r.v1 / base), fmt = (k) => `${k} ${loss(res[k]).toFixed(1)} %`, y0 = T.hy[T.idx(T.startS + d0 + 28)];
  check('knock: a car at 15 m/s into a tyre stack, a lamp, a sign, a board, a flag pole, a bench knocks each over: it wakes and moves, the tall ones tip, a tyre stack bursts into its three tyres that fly',
    KINDS.every(k => res[k].woke > 0 && res[k].woke < 2.5 && res[k].far > 1 && (STACK[k] ? res[k].burst : res[k].minUp < 0.6)),
    KINDS.map(k => STACK[k] ? `${k} burst at ${res[k].woke.toFixed(2)} s (${res[k].burst ? STACK[k] + ' out' : 'parts missing'}), they went ${res[k].far.toFixed(1)} m` : `${k} woke at ${res[k].woke.toFixed(2)} s, moved ${res[k].far.toFixed(1)} m, tipped to ${res[k].minUp.toFixed(2)}`).join('; '));
  check('knock: the car is slowed only a little in the 0.15 s after the blow: every kind under 10 % (as against a roadside post\'s 5 %), a tyre stack (27 kg, its tyres in the car\'s way again) more than a cone, under 15 %; an island\'s sign on its bases (126 kg) under 15 %, a stack of bales (78 kg, as on every circuit) under 30 %',
    loss(res.tstack) > loss(cone) && loss(res.tstack) < 15 && loss(res.isign) < 15 && loss(res.bstack) < 30 && KINDS.every(k => STACK[k] || loss(res[k]) < 10), KINDS.map(fmt).join(', ') + ` (a cone ${loss(cone).toFixed(1)} %, a post ${loss(post).toFixed(1)} %)`);
  check('knock: each comes to rest on its own within a few seconds (asleep again; a stack: all three tyres), nothing flies off to infinity, no NaN',
    KINDS.every(k => res[k].slept > 0 && res[k].slept < 9 && res[k].finite && res[k].rest < 45 && res[k].maxY < y0 + 8), KINDS.map(k => `${k} asleep at ${res[k].slept.toFixed(1)} s ${res[k].rest.toFixed(0)} m away`).join(', '));
  check('knock: a street lamp (8 m) ends up lying on the ground, not standing or hanging', Math.abs(res.mlamp.hitUp) < 0.35 && res.mlamp.b.y < y0 + 1.2, `its up-axis ${res.mlamp.hitUp.toFixed(2)} (1 = standing), its middle ${(res.mlamp.b.y - y0).toFixed(2)} m over the road`);
  // not dead centre: a glancing blow 0.6 m to the side still knocks a lamp, a tyre stack and a bench
  const gl = ['mlamp', 'tstack', 'bench', 'isign'].flatMap(k => [[k, run(k, 0.6)], [k, run(k, -0.6)]]);
  // the island's sign: the three bases and the board burst apart, heavy: the bases come to rest within 10 m of where it stood (under half as far as a tyre
  // stack's tyres go), the board on its post a little farther
  { const isg = res.isign, at = (r) => { const P = r.b.parts || []; return P.map(p => Math.hypot(p.x - r.b.x, p.z - r.b.z)); }, d15 = at(isg);
    const tyres = res.tstack.rest;
    check('knock: an island\'s sign (isign) bursts into its three heavy bases and its board on the post; the bases do not go far (within 10 m of the sign\'s spot at 15 m/s, under half as far as a tyre stack\'s tyres go), the board on its post a little farther (under 20 m)',
      isg.burst && d15.length === 4 && d15.slice(0, 3).every(d => d < 10) && Math.max(...d15.slice(0, 3)) < tyres / 2 && d15[3] < 20,
      `the bases ${d15.slice(0, 3).map(d => d.toFixed(1)).join(', ')} m, the board ${d15[3] ? d15[3].toFixed(1) : '-'} m from the sign's spot (a tyre stack's tyres ${tyres.toFixed(1)} m)`); }
  check('knock: a glancing blow (0.6 m off the middle of the car, either side) knocks them over too (a stack bursts)', gl.every(([k, r]) => r.woke > 0 && (STACK[k] ? r.burst : r.minUp < 0.7)),
    gl.map(([k, r]) => `${k}: ${STACK[k] ? 'burst' : 'woke'} ${r.woke.toFixed(2)} s${STACK[k] ? '' : `, tipped to ${r.minUp.toFixed(2)}`}`).join(', '));
  // every kind the scenery builder uses exists: set into a race, each gets its own slot (a kind Core does not know is left out); a stack its three tyres too
  const r = new C.Race(T, opts({})); r.setProps(KINDS.map(k => ({ kind: k, x: T.px[100], z: T.pz[100], yaw: 0, col: 0, i: 100 })), null);
  check('props: Core knows every kind the scenery uses (propCap for each, a tyre stack\'s three tyres, a bale stack\'s three bales, an island sign\'s three bases and its board ready), the old kinds unchanged', KINDS.every(k => r.propCap[k] === 1) && r.propCap.tyre === 3 && r.propCap.bale === 3 && r.propCap.iblock === 3 && r.propCap.iboard === 1 && ['cone', 'pylon', 'tyre', 'bale', 'crate', 'post'].every(k => { const q = new C.Race(T, opts({})); q.setProps([{ kind: k, x: T.px[100], z: T.pz[100], yaw: 0, col: 0, i: 100 }], null); return q.propCap[k] === 1; }), JSON.stringify(r.propCap));
}

// 3. into a mouth: a car steered straight into each side road from the middle of the road is stopped by the barrier across the mouth (its middle never past the
// barrier line); into a ring's wall along the ring's road: the tyres in front of it knocked over, the car stopped by the wall
{
  const out = [];
  for (const St of T.stubs) { if (St.m0 < 0) continue;
    Math.random = seeded(6);
    const r = new C.Race(T, opts({})), P = r.player; r.start(); P.locked = false;
    const p = T.stubPt(St.k, 0, {}), i = T.nearestIdx(p.x, p.z); P.place(p.x, p.z, p.h); P.q = T.query(P.x, P.z, i, P.q); P.y = P.py = T.yAt(P.q); P.roadY = P.y; P.vx = Math.cos(P.h) * 11; P.vz = Math.sin(P.h) * 11;
    let past = -1e9, wall = 0, jump = 0;
    for (let k = 0; k < 120 * 6 && wall < 120; k++) {   // (till it has been against the wall for a second: a side road that leaves at a shallow angle crosses the run-off slowly)
      Math.random = seeded(2000 + k); P.inThr = 0.6; P.inBrk = 0; P.inSteer = 0; const ax = P.x, az = P.z, vx = P.vx, vz = P.vz;
      r.step(DT); if (P.hitWall > 0.3) wall++; jump = Math.max(jump, Math.hypot(P.x - ax - vx * DT, P.z - az - vz * DT));
      past = Math.max(past, pastFree(P.x, P.z));
    }
    Math.random = orig;
    out.push({ St, past, wall, jump });
  }
  const through = out.filter(o => o.past >= 0 || !o.wall), short = out.map(o => -o.past).sort((a, b) => a - b), jumps = out.filter(o => o.jump > 0.5);
  check('mouth: steered straight into each side road from the middle of the road (at 11 m/s), the car is stopped by the barrier across the mouth (its middle never past the edge of the free ground, against the wall)',
    out.length >= 90 && !through.length,
    `${out.length} mouths: its middle ${short[0].toFixed(1)}-${short[short.length - 1].toFixed(1)} m inside the barrier at the nearest (median ${short[short.length >> 1].toFixed(1)} m)${through.length ? '; through or not stopped: ' + through.slice(0, 8).map(o => `#${o.St.k} ${o.St.name || ''} (d ${o.St.s}) ${o.past.toFixed(1)} m past, ${o.wall} steps against the wall, a jump of ${o.jump.toFixed(1)} m in one step`).join(', ') : ''}${jumps.length ? `; (${jumps.length} cars thrown over 0.5 m in one step by the wall: ` + jumps.map(o => `#${o.St.k} ${o.jump.toFixed(1)} m`).join(', ') + ', medvode-fence.test.js)' : ''}`);
  // the walls across the rings (rings[].shut) with the tyre stacks in front of them as the scenery puts them (two rows 0.62 m off the wall's line, 1.15 m apart)
  const FR = T.fenceRuns(), walls = FR.runs.filter(w => w.shut), res = [];
  for (const w of walls) {
    const R = T.rings[w.ref], P0 = w.pts, m = P0.length / 2, ax = P0[0], az = P0[1], L = Math.hypot(P0[2 * m - 2] - ax, P0[2 * m - 1] - az), ux = (P0[2 * m - 2] - ax) / L, uz = (P0[2 * m - 1] - az) / L, vx = -uz, vz = ux;
    const stacks = []; for (let t = 0.9; t < L - 0.6; t += 1.15) for (const sd of [-1, 1]) { const x = ax + ux * t + vx * sd * 0.62, z = az + uz * t + vz * sd * 0.62; stacks.push({ kind: 'tstack', x, z, yaw: 0, col: stacks.length % 2, i: T.nearestIdx(x, z) }); }
    const t0 = R.r - Math.hypot(ax - R.x, az - R.z), wx = ax + ux * t0, wz = az + uz * t0;   // (where the wall crosses the middle of the ring's road)
    for (const sd of [-1, 1]) {
      Math.random = seeded(7);
      const r = new C.Race(T, opts({})), P = r.player; r.start(); P.locked = false; r.setProps(stacks, null);
      const sx = wx + vx * sd * 8, sz = wz + vz * sd * 8, h = Math.atan2(-vz * sd, -vx * sd), i = T.nearestIdx(sx, sz);   // (8 m before it on the ring's road, along the road towards it)
      P.place(sx, sz, h); P.q = T.query(P.x, P.z, i, P.q); P.y = P.py = T.yAt(P.q); P.roadY = P.y; P.vx = Math.cos(h) * 10; P.vz = Math.sin(h) * 10;
      let near = 1e9, wall = 0;
      for (let k = 0; k < 120 * 3; k++) { Math.random = seeded(3000 + k); P.inThr = 0.5; P.inBrk = 0; P.inSteer = 0; r.step(DT); if (P.hitWall > 0.3) wall++; near = Math.min(near, ((P.x - wx) * vx + (P.z - wz) * vz) * sd); }
      Math.random = orig;
      const st = r.props.filter(b => b.kind === 'tstack'), mine = st.filter((b, k) => k % 2 === (sd < 0 ? 0 : 1)), burst = mine.filter(b => b.dead).length;   // (its own side's row: the stacks alternate -, +)
      const lift = mine.map(b => { const q = T.query(b.x, b.z, b.qi, {}); return b.dead ? 0 : (b.y - b.K.h0) - T.yAt(q); }), off = Math.max(...lift.map(Math.abs));   // (a stack's ground as Core put it, against the cars' ground there)
      res.push({ ring: w.ref, sd, near, wall, burst, n: mine.length, off, carBk: Math.floor(P.q.i / 6), stBk: [...new Set(mine.map(b => Math.floor(b.qi / 6)))] });
    }
  }
  check('ring walls: a car driven along a ring\'s road into the wall across it (from either side, at 10 m/s) knocks over the tyre stacks in front of the wall, standing on the ring\'s own surface (to 15 cm), and is stopped by the wall (its middle never across the wall\'s line)',
    res.length === 6 && res.every(o => o.burst >= 1 && o.wall > 0 && o.near > 0.5 && o.off < 0.15),
    res.map(o => `ring at d ${Math.round(def.rings[o.ring].d)} from the ${o.sd > 0 ? '+' : '-'} side: ${o.burst} of its ${o.n} stacks burst${o.burst ? '' : ` (the car's props bucket ${o.carBk}, theirs ${o.stBk.join(', ')}: Race.stepProps looks at the car's bucket and the two beside it)`}, the unhit ones ${o.off.toFixed(2)} m off the cars' ground at most, its middle ${o.near.toFixed(1)} m from the line at the nearest, ${o.wall} steps against the wall`).join(' | '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
