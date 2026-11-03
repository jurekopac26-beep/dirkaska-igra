// Braking boards (Track.brakeBoards; World draws them, js/world.js brakeBoards): on every circuit (a closed track that is not a test track
// nor a rally) the boards counting down to its heavy braking zones, 300, 200 and 100 m before the corner (Monaco's own 150, 100, 50; a
// circuit without a straight that long 150, 100, 50), on the outside of the approach, beside the road and clear of its barriers (or over
// them where the verge is too narrow), not in the mouth of the pit lane or a side road, not at the start line; none on the open roads, the
// rally stages and the test tracks.
// 3. a board on the verge falls over when a car hits it (physics level: Core only; World puts them in its props, browser/boards.test.mjs):
// Spa's 200 m board before La Source as World makes it (Core 'bboard', every board on the verge of the circuit set into the race), a car
// driven into it over the grass from 180 km/h (~160 at the blow): the board wakes, tips over and comes to rest lying in the grass a few metres on, off the asphalt;
// the car loses a little speed (not most of it) and takes a small dent; every other board stands as it stood; the same run twice gives
// the same result bit for bit
//   node tests/boards.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const K = C.CSK, circuit = (d) => !d.open && !d.test && !d.rally && !d.descent;
const kmh = (v) => Math.round(v * 3.6);

// 1. no boards where there is no circuit
{
  const has = C.TRACKS.filter(d => !circuit(d)).map(d => [d.id, new C.Track(d).brakeBoards().length]).filter(e => e[1]);
  check('none on the open roads, the rally stages and the test tracks', !has.length, has.map(e => e.join(': ')).join(', ') || C.TRACKS.filter(d => !circuit(d)).length + ' tracks without');
}

// 2. every circuit
const sum = [];
for (const def of C.TRACKS.filter(circuit)) {
  const T = new C.Track(def), Z = T.brakeBoards(), L = T.len, id = def.id, B = Z.flatMap(z => z.boards.map(b => Object.assign({ zn: z }, b)));
  const v = T.speedProfile(K.aiLatA, K.aiBrakeA, 85, K.aiWmax, 0, 0.9), dOf = (s) => ((s - T.startS) % L + L) % L, back = (a, b) => ((a - b) % L + L) % L;
  const own = def.brakeBoards, D = own ? own.d : Z.length && Z[0].boards[0].d === 150 ? [150, 100, 50] : [300, 200, 100];
  sum.push(`${id} ${Z.length}/${B.length}`);
  check(`${id}: boards before ${Z.length} braking zone(s), three each, ${D.join(' / ')} m`, Z.length >= 1 && Z.length <= 8 && Z.every(z => z.boards.map(b => b.d).join() === D.join()),
    Z.map(z => `${Math.round(z.d0)} m (${z.dir > 0 ? 'R' : 'L'}, ${kmh(z.v0)} > ${kmh(z.v1)} km/h)`).join(', '));
  if (!own) {
    check(`${id}: 300 / 200 / 100 m wherever a straight allows it (150 / 100 / 50 only on a circuit with none)`, D[0] === 300 || id === 'toskana', D.join(' / '));
    // a heavy braking zone of the AI's profile: from the straight (60 m/s or more) down by 25 m/s or more to under 60 % within 150 m past the entry
    const heavy = Z.filter(z => { const b0 = z.boards[0]; let hi = 0, lo = 1e9; for (let d = 0; d <= z.boards[0].d - 10; d += T.ds) hi = Math.max(hi, v[T.idx(b0.s + d)]); for (let d = 0; d <= 150; d += T.ds) lo = Math.min(lo, v[T.idx(z.s + d)]);
      return hi >= 60 && hi - lo >= 25 && lo <= 0.6 * hi; });
    check(`${id}: each a heavy braking zone of the AI (60 m/s or more down by 25 m/s or more, to under 60 %, by 150 m past the corner's entry)`, heavy.length === Z.length, `${heavy.length} of ${Z.length}`);
  }
  // each board its number of metres before the corner's entry (+-10 m), on a straight
  const far = B.filter(b => Math.abs(back(b.zn.s, b.s) - b.d) > 10), bent = B.filter(b => Math.abs(T.k[b.i]) > 1 / 160);
  check(`${id}: each board its number of metres before the corner (within 10 m), where the road is straight (no bend under a 160 m radius)`, !far.length && (own || !bent.length),
    far.map(b => `${b.d}: ${Math.round(back(b.zn.s, b.s))} m`).concat(own ? [] : bent.map(b => `${b.d} at ${Math.round(dOf(b.s))} m: R ${Math.round(1 / Math.abs(T.k[b.i]))} m`)).join(', ') || `${B.length} boards`);
  // beside the road: on the verge off the asphalt (and the kerb) by 0.5 m or more and clear of the barrier by 0.2 m; or over the barrier (its
  // legs in the barrier's line or behind it, the plate above the cars by the wall and the spectators behind it, not over the asphalt)
  const pos = B.filter(b => { const a = Math.abs(b.lat), bar = b.side > 0 ? T.br[b.i] : T.bl[b.i], e = T.wAt(b.i) + (T.curb[b.i] ? T.curbW : 0);
    if (Math.sign(b.lat) !== b.side) return true;
    return b.kind === 0 ? a - b.pw / 2 < e + 0.5 || a + b.pw / 2 > bar - 0.2 || b.py < 0.3 : a < bar + 0.3 || a - b.pw / 2 < e + 0.25 || b.py < 1.8; });
  check(`${id}: beside the road, off the asphalt and the kerb, clear of the barrier (or over it)`, !pos.length,
    pos.map(b => `${b.d} at ${Math.round(dOf(b.s))} m: lat ${b.lat.toFixed(2)}, edge ${T.w}, barrier ${(b.side > 0 ? T.br[b.i] : T.bl[b.i]).toFixed(2)}, kind ${b.kind}`).join('; ') ||
    `${B.filter(b => !b.kind).length} on the verge, ${B.filter(b => b.kind).length} over the barrier`);
  // where it may stand: not in the pit lane's way in or out, a side road's mouth, by the start line or on a bridge
  const blocked = B.filter(b => { const p = def.pit ? T.pitAt(b.s) : null, d = dOf(b.s);
    return (p && p.sd === b.side && p.gap) || (T.gap && T.gap[b.side > 0 ? 1 : 0][b.i]) || d < 14 || d > L - 14 || (T.cross || []).some(c => [c.lo, c.up].some(f => Math.min(Math.abs(b.i - f), T.N - Math.abs(b.i - f)) * T.ds < 30)); });
  check(`${id}: none in the pit lane's way in or out, a side road's mouth, by the start line or on a bridge`, !blocked.length, blocked.map(b => `${b.d} at ${Math.round(dOf(b.s))} m`).join(', '));
  // on the outside of the approach (the side away from the corner's apex), the other side only where the outside has no room for it
  const ins = B.filter(b => b.side !== -b.zn.dir);
  check(`${id}: on the outside of the approach (away from the apex)`, ins.length <= Math.floor(B.length / 6), ins.length ? `${ins.length} of ${B.length} on the inside` : `all ${B.length}`);
  // the plate: readable from the cameras above (2 x 1.5 m), facing the cars coming (its heading the road's there)
  check(`${id}: the plates 2 x 1.5 m, facing the cars coming`, B.every(b => b.pw === 2 && b.ph === 1.5 && Math.abs(b.hd - T.hd[b.i]) < 1e-6));
}
console.log('zones / boards: ' + sum.join(', '));

// 3. knocked over: Spa, the 200 m board before La Source (zone 0, on the verge), a car on its line from 30 m before it at 50 m/s (180 km/h)
{
  const def = C.TRACKS.find(d => d.id === 'spa'), T = new C.Track(def), B = T.brakeBoards()[0].boards[1], V0 = 50, h0 = 1;
  const list = T.brakeBoards().flatMap(z => z.boards).filter(b => !b.kind).map(b => ({ kind: 'bboard', x: b.x, z: b.z, yaw: b.hd, col: 0, i: b.i }));   // (as World's brakeBoards: the boards on the verge; without a world they stand on the road's height there, World gives each its drawn foot, it.y)
  const k = list.findIndex(p => p.x === B.x && p.z === B.z), orig = Math.random;
  const run = (props) => {
    Math.random = seeded(5);
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tt: true, damage: 1 }), P = r.player;
    r.start(); P.locked = false; r.setProps(props ? list : [], null);
    const i = T.idx(B.s - 30); P.place(T.px[i] + T.nx[i] * B.lat, T.pz[i] + T.nz[i] * B.lat, T.hd[i]); P.y = P.py = T.hy[i]; P.roadY = P.y; P.q = T.query(P.x, P.z, i, P.q); P.vx = Math.cos(P.h) * V0; P.vz = Math.sin(P.h) * V0;
    const b = props ? r.props[k] : null, d0 = P.dmg, spd = [];
    let hit = -1, minUp = 1, slept = -1;
    for (let s = 0; s < 120 * 8; s++) {
      Math.random = seeded(900 + s); P.inThr = 0.4; P.inBrk = 0; P.inSteer = 0;
      r.step(DT); spd.push(P.speed);
      if (b) { minUp = Math.min(minUp, 1 - 2 * (b.qx * b.qx + b.qz * b.qz)); if (hit < 0 && !b.sleep) hit = s; if (hit >= 0 && slept < 0 && b.sleep) slept = s; }
      if (hit >= 0 && s === hit + 18) { const j = T.idx(B.s + 60); P.place(T.px[j], T.pz[j], T.hd[j]); P.y = P.py = T.hy[j]; P.roadY = P.y; P.q = T.query(P.x, P.z, j, P.q); P.vx = Math.cos(P.h) * 40; P.vz = Math.sin(P.h) * 40; }   // (then on along the road's middle, clear of the boards)
      if (hit >= 0 && s === hit + 12) P.dmgHit = P.dmg - d0;
    }
    Math.random = orig;
    return { r, P, b, hit, minUp, spd, slept };
  };
  const ctl = run(false), a = run(true), a2 = run(true), b = a.b, P = a.P;
  const q = T.query(b.x, b.z, b.qi, {}), up = 1 - 2 * (b.qx * b.qx + b.qz * b.qz), lat = Math.abs(q.d), edge = T.wAt(q.i) + (T.curb[q.i] ? T.curbW : 0), above = b.y - T.elevAt(q.s).y;
  const rest = Math.hypot(b.x - list[k].x, b.z - list[k].z), hs = a.hit + 12, loss = 100 * (1 - a.spd[hs] / ctl.spd[hs]);
  check('Spa, the 200 m board before La Source hit by a car driven over the grass from 180 km/h: knocked over (awake, tipped well over), at rest again within 6 s',
    a.hit > 0 && a.minUp < 0.2 && up < 0.6 && a.slept > a.hit && (a.slept - a.hit) * DT < 6, `hit after ${(a.hit * DT).toFixed(2)} s, its up axis ${up.toFixed(2)} (1: standing; the most ${a.minUp.toFixed(2)}), ${a.slept > 0 ? 'at rest ' + ((a.slept - a.hit) * DT).toFixed(1) + ' s after the blow' : 'still moving'}`);
  check('... and lies in the grass beside the road (off the asphalt and the kerb, low on the ground), a few metres on from where it stood',
    lat > edge + 0.3 && above < h0 - 0.3 && rest > 1 && rest < 15, `${(lat - edge).toFixed(2)} m past the kerb, its middle ${above.toFixed(2)} m above the road (standing ${h0} m), ${rest.toFixed(1)} m from its place`);
  check('the car: a little slower (1-5 % against the same run without the boards, 0.1 s after the blow), a small dent (0.5-8 %)',
    loss > 1 && loss < 5 && P.dmgHit > 0.005 && P.dmgHit < 0.08, `${loss.toFixed(2)} % slower (${(ctl.spd[hs] * 3.6).toFixed(0)} > ${(a.spd[hs] * 3.6).toFixed(0)} km/h), damage +${(100 * P.dmgHit).toFixed(1)} %`);
  const moved = a.r.props.filter((o, j) => j !== k && (!o.sleep || o.x !== list[j].x || o.z !== list[j].z || o.qw !== Math.cos(-list[j].yaw / 2)));
  check('every other board stands as it stood (asleep, not moved)', !moved.length, moved.length ? `${moved.length} moved` : `${list.length - 1} boards`);
  const st = (x) => JSON.stringify(x.r.props.map(o => [o.x, o.y, o.z, o.qx, o.qy, o.qz, o.qw, o.sleep])) + JSON.stringify([x.P.x, x.P.z, x.P.vx, x.P.vz, x.P.dmg]);
  check('deterministic: the same run twice, the same boards and car bit for bit', st(a) === st(a2));
}
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
