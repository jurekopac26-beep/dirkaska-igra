// Santiago, Chile: the street circuit in the park south of the city centre in its layout of January 2020 (2.287 km, 11 turns, anticlockwise),
// its centre line from OpenStreetMap's way of that race. The track (a closed circuit at full scale, 6 laps, the length within 1.5 % of the
// official, anticlockwise, in the big championship), its eleven turns in order and each its way (8 left, 3 right: Turn 1 a near-90-degree
// left, Turn 2 the long right, Turns 3-5 left, the left-right of Turns 6 and 7, Turn 8 the long left round the arena, Turn 9 left, the
// hairpins of Turns 10 right and 11 left), the long straight up the parade ground, the pit lane on its inside (left; scenery), a whole race
// of 12 AI cars and the player on the autopilot in the dry and in the rain (every car to the flag), and the junctions: their street furniture
// (traffic signals, signs, stop signs, lamps, hydrants, bins, cabinets, bollards) inside the barriers, and a car driven into a piece of it
// knocks it over and drives on.
//   node tests/santiago.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'santiago'), T = new C.Track(def);
const dS = (s) => { const L = T.len; return ((s - T.startS) % L + L) % L; };   // metres from the start line along the lap (0 .. L)
const at = (d) => T.idx(T.startS + d), sOf = (d) => ((T.startS + d) % T.len + T.len) % T.len;

// 1. the track: a closed circuit of 6 laps, 2.287 km within 1.5 %, anticlockwise (one full turn to the left), in the big championship
{
  let turn = 0; for (let i = 0; i < T.N; i++) turn += T.k[i] * T.ds;
  check('track: Santiago, Čile (Santiago, Chile), a closed circuit of 6 laps, not a test track, in the big championship',
    def.name === 'Santiago, Čile' && def.en && def.en.name === 'Santiago, Chile' && !def.open && !def.timeTrial && !def.test && def.laps === 6 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('santiago'),
    `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
  check('track: 2.287 km within 1.5 %, the menu\'s real length 2.287 km, anticlockwise (one full turn to the left)',
    Math.abs(T.len / 2287 - 1) < 0.015 && def.realKm === 2.287 && Math.abs(turn + 2 * Math.PI) < 0.05,
    `${T.len.toFixed(1)} m (${((T.len / 2287 - 1) * 100).toFixed(2)} %), total turn ${(turn * 180 / Math.PI).toFixed(1)} deg`);
  check('track: no crossover', !(T.cross && T.cross.length), '');
}
// 2. the heights: the park's gentle slope, within 8 m over the lap, no grade over 4 %
{
  let g = 0; for (let i = 0; i < T.N; i++) g = Math.max(g, Math.abs(T.grade[i]));
  const hmax = Math.max(...T.hy), hmin = Math.min(...T.hy);
  check('heights: the start line the zero, the lap within 8 m, the north loop the highest, no grade over 4 %',
    Math.abs(T.hy[at(0)]) < 0.3 && hmax - hmin < 8 && T.hy[at(480)] > T.hy[at(1740)] + 3 && g < 0.04, `range ${hmin.toFixed(1)} .. ${hmax.toFixed(1)} m, Turn 4 ${T.hy[at(480)].toFixed(1)} m, Turn 10 ${T.hy[at(1740)].toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 3. the eleven turns in order and each its way: the turn boards (def.turns) in order along the lap, the road turning their way round each
// (degrees: + right, - left) within its stretch of the lap
{
  const turnDeg = (a, b) => { let t = 0; for (let d = a; d < b; d += T.ds) t += T.k[at(d)] * T.ds; return t * 180 / Math.PI; };
  const REAL = [   // [the stretch of the lap (m from the start line), the direction (+1 right, -1 left), degrees min, max]
    [150, 205, -1, 60, 100],     // Turn 1: the near-90-degree left at the end of the straight
    [205, 285, 1, 150, 190],     // Turn 2: the long right, back east
    [350, 415, -1, 80, 120],     // Turn 3: left, up into the park
    [450, 530, -1, 55, 95],      // Turn 4: left, below the avenue
    [600, 690, -1, 55, 95],      // Turn 5: left, down the west side of the block
    [715, 757, -1, 35, 75],      // Turn 6: left ...
    [757, 795, 1, 75, 120],      // Turn 7: ... and right, between the walls
    [800, 1500, -1, 100, 150],   // Turn 8: the long constant-radius left round the arena
    [1500, 1560, -1, 90, 130],   // Turn 9: left onto the parade ground
    [1700, 1775, 1, 165, 210],   // Turn 10: the right-hand hairpin
    [1890, 1965, -1, 160, 200],  // Turn 11: the left-hand hairpin onto the straight
  ];
  const ds = def.turns.map(([x, z]) => dS(T.nearestIdx(x, z) * T.ds));
  const res = REAL.map(([a, b, dir, lo, hi], k) => { const deg = turnDeg(a, b); return { k: k + 1, deg, ok: Math.sign(deg) === dir && Math.abs(deg) >= lo && Math.abs(deg) <= hi && ds[k] >= a && ds[k] <= b }; });
  check('turns: eleven number boards in order along the lap, each on its stretch',
    def.turns.length === 11 && ds.every((d, k) => k === 0 || d > ds[k - 1]) && res.every(r => r.ok), ds.map((d, k) => `${k + 1}@${Math.round(d)}`).join(' '));
  check('turns: 8 left and 3 right: 1 L, 2 R, 3-6 L, 7 R, 8 L (round the arena), 9 L, 10 R and 11 L (the hairpins)',
    res.every(r => r.ok) && res.filter(r => r.deg < 0).length === 8 && res.filter(r => r.deg > 0).length === 3, res.map(r => `T${r.k} ${r.deg > 0 ? 'R' : 'L'} ${Math.abs(r.deg).toFixed(0)}°`).join(', '));
  const hd = (d) => Math.atan2(T.tz[at(d)], T.tx[at(d)]); let dev = 0; for (let d = -280; d < 140; d += 10) dev = Math.max(dev, Math.abs(Math.atan2(Math.sin(hd(d) - hd(0)), Math.cos(hd(d) - hd(0)))));
  check('turns: the straight up the parade ground runs north (within 5 degrees) for 420 m through the start line',
    dev * 180 / Math.PI < 5 && Math.abs(Math.atan2(Math.sin(hd(0) + Math.PI / 2), Math.cos(hd(0) + Math.PI / 2))) < 0.1, `heading within ${(dev * 180 / Math.PI).toFixed(1)} deg`);
  let mr = 1e9; for (let i = 0; i < T.N; i++) mr = Math.min(mr, 1 / Math.abs(T.k[i]));
  check('turns: the tightest bend (the hairpins, Turn 9) no tighter than 9 m', mr >= 9, `${mr.toFixed(1)} m`);
}
// 4. the places: the turns by their numbers in order along the lap, each with the commentator's lines; numbers only (no names)
{
  const L = T.names.filter(p => p.hud !== false);
  check('places: Turns 1-11 in order along the lap, three commentator\'s lines each',
    L.map(p => p.n).join() === Array.from({ length: 11 }, (_, k) => 'Zavoj ' + (k + 1)).join() && L.every((p, k) => k === 0 || p.d > L[k - 1].d) && T.names.every(p => p.say && p.say.length === 3),
    L.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
}
// 5. the pits: the lane on the inside (left) of the straight, across the start line, after the hairpins and before Turn 1 (scenery only); the
// main grandstand across from it
{
  const [a, b, o] = def.pitLane;
  check('pits: the lane on the left of the straight (15-20 m out), across the start line, between Turn 11 and Turn 1; scenery only',
    o < -15 && o > -20 && a < 0 && b > 0 && a > 1965 - T.len && b < 150 && !def.pit, `lane ${a} .. ${b} m, ${o} m to the side`);
  check('pits: the main grandstand across from it, on the right at the start line', def.stands[0][2] === 1 && def.stands[0][0] < 0 && def.stands[0][1] > 0, JSON.stringify(def.stands[0]));
}
// 6. a whole race: 12 AI cars and the player on the autopilot, 6 laps, every car to the flag without a rescue; in the rain slower (2-20 %)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: def.laps, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0, nan = false;
    while (t < 1200 && r.cars.some(c => !c.finished)) {
      Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT;
      for (const c of r.cars) if (!Number.isFinite(c.x) || !Number.isFinite(c.speed)) nan = true;
      if (!P.finished && (P.stuckT > 3 || P.wrongT > 3)) { r.rescue(P); resc++; }
    }
    const fin = r.cars.filter(c => c.finished).sort((x, y) => x.finishTime - y.finishTime);
    return { n: fin.length, of: r.cars.length, win: fin[0] ? fin[0].finishTime : null, last: fin.length ? fin[fin.length - 1].finishTime : null, resc, nan };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race in the dry: all 13 cars to the flag, the player without a rescue; the winner\'s 6 laps 5-10 minutes',
    d.n === 13 && d.of === 13 && !d.resc && !d.nan && d.win > 300 && d.win < 600, `${d.n}/${d.of} finished, winner ${d.win && d.win.toFixed(1)} s, last ${d.last && d.last.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 cars to the flag, the player without a rescue, the winner 2-20 % slower than in the dry',
    w.n === 13 && w.of === 13 && !w.resc && !w.nan && w.win / d.win > 1.02 && w.win / d.win < 1.2, `${w.n}/${w.of} finished, winner ${w.win && w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

// 7. the junctions: the barrier opens into each side road's mouth; the street furniture there (as the world places it: js/world-santiago.js)
//    stands inside the barriers off the asphalt; a car driven into it knocks it over and drives on
const J = def.junctions, JOFF = def.junctionOff;
check('junctions: eight side roads (three with traffic signals, five with stop signs), each mouth open to its fence 11.5 m past the edge',
  J.length === 8 && J.filter(j => j[4] === 'sig').length === 3 && J.filter(j => j[4] === 'stop').length === 5 &&
  J.every(([d, sd]) => { const i = T.idx(sOf(d)); return (sd > 0 ? T.br[i] : T.bl[i]) > T.w + JOFF - 0.6; }), J.map(([d, sd]) => { const i = T.idx(sOf(d)); return Math.round(d) + (sd > 0 ? 'R ' : 'L ') + ((sd > 0 ? T.br[i] : T.bl[i]) - T.w).toFixed(1); }).join(', '));
const furniture = () => def.furniture.map(([d, sd, kind, l, face, col, j]) => {   // (def.furniture: as the world places it)
  const s = sOf(d), i = T.idx(s); return { kind, x: T.px[i] + T.nx[i] * sd * l, z: T.pz[i] + T.nz[i] * sd * l, yaw: 0, col, d: J[j][0] }; });
{
  const F = furniture(), q = {}, inside = F.filter(b => { T.query(b.x, b.z, -1, q); return Math.abs(q.d) > T.w + 0.7 && Math.abs(q.d) < (q.d > 0 ? q.br : q.bl) - 0.7; });
  const per = J.map(j => inside.filter(b => b.d === j[0]).length), sig = J.filter(j => j[4] === 'sig').map(j => inside.filter(b => b.d === j[0] && b.kind === 'signal').length);
  check('junctions: their furniture inside the barriers, off the asphalt (8 kinds), 8 pieces or more at each, two signals at each signal junction',
    inside.length === F.length && per.every(k => k >= 8) && sig.every(k => k === 2) && new Set(inside.map(b => b.kind)).size === 8, `${inside.length} of ${F.length}; per junction ${per.join(', ')}; signals ${sig.join(', ')}`);
}
// a car driven straight at a piece of furniture of each kind (alone on the track, at 60 km/h, steering at it from 40 m back)
const ram = (kind) => {
  const F = furniture(), qq = {}, bend = (b) => { const q = T.query(b.x, b.z, -1, qq); let t = 0; for (let d = -45; d <= 5; d += T.ds) t += Math.abs(T.k[T.idx(q.s + d)]) * T.ds; return t + Math.abs(q.d) * 0.01; };
  const tgt = F.filter(b => b.kind === kind).sort((a, b) => bend(a) - bend(b))[0];   // (the one with the straightest run-up, nearest the circuit)
  const orig = Math.random; Math.random = seeded(7);
  try {
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 3, difficulty: 1, damage: 2, tt: true });
    r.start(); r.setProps(F);
    const q0 = T.query(tgt.x, tgt.z, -1, {}), s0 = q0.s - 40, i0 = T.idx(s0), lat = Math.sign(q0.d) * (T.w - 1.2), P = r.player;
    P.x = T.px[i0] + T.nx[i0] * lat; P.z = T.pz[i0] + T.nz[i0] * lat; P.h = Math.atan2(T.tz[i0], T.tx[i0]); P.vx = Math.cos(P.h) * 16.7; P.vz = Math.sin(P.h) * 16.7; P.q = T.query(P.x, P.z, i0, P.q);
    const b = r.props.find(p => p.kind === kind && Math.abs(p.x - tgt.x) < 0.01 && Math.abs(p.z - tgt.z) < 0.01), x0 = b.x, z0 = b.z, y0 = b.y;
    let t = 0, k = 0, hitV = 0, after = null, knocked = false;
    while (t < 12) {
      Math.random = seeded(900 + (++k));
      const dx = b.x - P.x, dz = b.z - P.z, want = Math.atan2(dz, dx), err = Math.atan2(Math.sin(want - P.h), Math.cos(want - P.h));
      if (!knocked) { P.inThr = P.speed < 16 ? 0.7 : 0; P.inBrk = 0; P.inSteer = Math.max(-1, Math.min(1, err * 3)); P.digitalSteer = false; } else C.aiControl(P, r, DT);
      const v0 = P.speed; r.step(DT); t += DT;
      if (!knocked && (!b.sleep || Math.hypot(b.x - x0, b.z - z0) > 0.3)) { knocked = true; hitV = v0; after = t; }
      if (knocked && t - after > 3) break;
    }
    const moved = Math.hypot(b.x - x0, b.z - z0), up = b.qw * b.qw - b.qx * b.qx - b.qy * b.qy + b.qz * b.qz;   // (up: the cosine of its tilt from upright)
    return { knocked, hitV, v: P.speed, moved, tilt: Math.acos(Math.max(-1, Math.min(1, up))) * 180 / Math.PI, dmg: P.dmg, fell: b.y < y0 - 0.2 };
  } finally { Math.random = orig; }
};
for (const kind of ['signal', 'stop', 'sign', 'lamp', 'hydrant', 'bin', 'cabinet', 'bollard']) {
  const o = ram(kind);
  check(`junctions: a car knocks the ${kind} over (it flies or falls) and drives on`, o.knocked && (o.moved > 1.5 || o.tilt > 40) && o.hitV > 8 && o.v > 5 && o.dmg < 0.25,
    `hit at ${(o.hitV * 3.6).toFixed(0)} km/h, ${(o.v * 3.6).toFixed(0)} km/h 3 s later; it moved ${o.moved.toFixed(1)} m, tilted ${o.tilt.toFixed(0)}°, damage ${o.dmg.toFixed(2)}`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
