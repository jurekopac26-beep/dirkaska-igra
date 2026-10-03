// Cape Town, South Africa: the street circuit of Green Point by the Atlantic in its layout of 2023 (2.921 km, 12 turns, anticlockwise).
// The track (a closed circuit at full scale, its length within 2 % of the published 2.921 km, anticlockwise, 5 laps, the name a place and
// a country), its twelve turns in order and each its way (Turn 1 left off Vlei Road, Turns 2 and 3 left round the big traffic circle, the
// chicane round the small one left-right-left, Turn 7 left in the roundabout onto Beach Road, the kink of Turn 8 and the fast left of Turn
// 9 by the sea, the sharp left of Turn 10, the left of Turn 11, the right of Turn 12 back onto Vlei Road), the heights, the places along
// the lap, the pit lane where it was (on the left of Vlei Road across the start line, scenery: the cars do not stop there) and the
// grandstand across from it, the junctions (side streets closed at their mouths, the barrier opened into each up to its fence, the street
// furniture on their corners: traffic lights, signs, lamps, bins, bollards, all of it knockable: a car knocks a traffic light, a sign and
// a lamp over and drives on, a little slower, the furniture lies where it fell), no birds; and a whole race of 12 AI cars and the player on
// the autopilot, in the dry and in the rain, every car to the finish.
//   node tests/capetown.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'capetown'), T = new C.Track(def);
const dS = (s) => { const L = T.len; return ((s - T.startS) % L + L) % L; };   // metres from the start line along the lap (0 .. L)
const at = (d) => T.idx(((T.startS + d) % T.len + T.len) % T.len);

// 1. the track: a closed circuit of 5 laps, 2.921 km within 2 % (the centre line rounds the junctions' corners), anticlockwise, in the big championship
{
  let turn = 0; for (let i = 0; i < T.N; i++) turn += T.k[i] * T.ds;
  check('track: Cape Town, Južna Afrika (Cape Town, South Africa), a closed circuit of 5 laps, not a test track, in the big championship, no birds',
    def.name === 'Cape Town, Južna Afrika' && def.en && def.en.name === 'Cape Town, South Africa' && !def.open && !def.timeTrial && !def.test && def.laps === 5 && def.noBirds === true && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('capetown'),
    `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
  check('track: 2.921 km within 2 % (the menu\'s real length 2.921 km), anticlockwise (one full turn to the left)',
    Math.abs(T.len / 2921 - 1) < 0.02 && def.realKm === 2.921 && Math.abs(turn + 2 * Math.PI) < 0.05,
    `${T.len.toFixed(1)} m (${((T.len / 2921 - 1) * 100).toFixed(2)} %), total turn ${(turn * 180 / Math.PI).toFixed(1)} deg`);
  check('track: no crossover; a street circuit: the barriers close to the road on the straights (at most 4 m past its edge)',
    !(T.cross && T.cross.length) && (() => { let ok = 0, all = 0; for (let i = 0; i < T.N; i++) if (Math.abs(T.k[i]) < 1 / 300) { all++; if (T.bl[i] - T.w < 4.01 || T.br[i] - T.w < 4.01) ok++; } return ok / all > 0.9; })(), '');
}
// 2. the heights (Copernicus DEM along the road): flat by the sea, the coast road at Mouille Point the lowest (3-7 m under the start line), the
// boulevards the highest (2-6 m over it), no grade over 6 %
{
  const h = (d) => T.hy[at(d)]; let g = 0, hmax = -1e9, hmin = 1e9; for (let i = 0; i < T.N; i++) { g = Math.max(g, Math.abs(T.grade[i])); hmax = Math.max(hmax, T.hy[i]); hmin = Math.min(hmin, T.hy[i]); }
  check('heights: the start line the zero, the boulevards 2-6 m above it, the coast road at Mouille Point 3-7 m below, no grade over 6 %',
    Math.abs(h(0)) < 0.3 && h(800) > 2 && hmax < 6 && h(2050) < -3 && hmin > -7 && g < 0.06, `start ${h(0).toFixed(1)}, boulevard ${h(800).toFixed(1)}, coast ${h(2050).toFixed(1)}, ${hmin.toFixed(1)} .. ${hmax.toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 3. the twelve turns in order and each its way (degrees: + right, - left), within its stretch of the lap, the number boards in order
{
  const turnDeg = (a, b) => { let t = 0; for (let d = a; d < b; d += T.ds) t += T.k[at(d)] * T.ds; return t * 180 / Math.PI; };
  const REAL = [   // [the stretch of the lap (m from the start line), the direction (+1 right, -1 left), degrees min, max]
    [150, 300, -1, 70, 150],   // Turn 1: the sharp left off Vlei Road onto the boulevard
    [560, 650, -1, 15, 50],    // Turn 2: left, into the big traffic circle
    [650, 720, -1, 15, 50],    // Turn 3: left out of it onto the boulevard to the Waterfront
    [1025, 1055, -1, 10, 40],  // Turn 4: the chicane round the small traffic circle: left
    [1055, 1080, 1, 20, 55],   // Turn 5: right round its island
    [1080, 1110, -1, 8, 35],   // Turn 6: left out of it
    [1250, 1340, -1, 80, 120], // Turn 7: left in the roundabout onto Beach Road
    [1850, 1910, -1, 12, 40],  // Turn 8: the kink
    [1910, 2000, -1, 30, 65],  // Turn 9: the fast left by the sea at Granger Bay
    [2150, 2250, -1, 75, 100], // Turn 10: the sharp left off Beach Road
    [2480, 2560, -1, 25, 50],  // Turn 11: left
    [2640, 2730, 1, 70, 100],  // Turn 12: right, back onto Vlei Road
  ];
  const ds = def.turns.map(([x, z]) => dS(T.nearestIdx(x, z) * T.ds));
  const res = REAL.map(([a, b, dir, lo, hi], k) => { const deg = turnDeg(a, b); return { k: k + 1, deg, ok: Math.sign(deg) === dir && Math.abs(deg) >= lo && Math.abs(deg) <= hi && ds[k] >= a && ds[k] <= b }; });
  check('turns: twelve number boards in order along the lap, each on its stretch', def.turns.length === 12 && ds.every((d, k) => k === 0 || d > ds[k - 1]) && res.every(r => r.ok), ds.map((d, k) => `${k + 1}@${Math.round(d)}`).join(' '));
  check('turns: 1 left, 2 and 3 left round the circle, the chicane 4-6 left-right-left, 7 left, 8 and 9 left by the sea, 10 and 11 left, 12 right',
    res.every(r => r.ok), res.map(r => `T${r.k} ${r.deg > 0 ? 'R' : 'L'} ${Math.abs(r.deg).toFixed(0)}°`).join(', '));
  let near = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 60; j < T.N - 60 + i && j < T.N; j += 2) near = Math.min(near, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]));
  let rmin = 1e9; for (let i = 0; i < T.N; i++) if (T.k[i]) rmin = Math.min(rmin, 1 / Math.abs(T.k[i]));
  check('turns: no corner tighter than 12 m (the junctions\' corners), the legs of the lap far apart (at least 60 m)', rmin > 12 && near > 60, `tightest ${rmin.toFixed(1)} m, nearest legs ${near.toFixed(1)} m apart`);
}
// 4. the places: the turns by their numbers, the coast and the stadium for the commentator only (no names of people, events or sponsors)
{
  const Lp = T.names.filter(p => p.hud !== false);
  check('places: Turns 1, 3, 5, 7, 9, 10, 12 on the HUD in order along the lap, the commentator\'s lines for each place',
    Lp.map(p => p.n).join() === 'Zavoj 1,Zavoj 3,Zavoj 5,Zavoj 7,Zavoj 9,Zavoj 10,Zavoj 12' && Lp.every((p, k) => k === 0 || p.d > Lp[k - 1].d) && T.names.every(p => p.say && p.say.length === 3),
    T.names.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
  const txt = JSON.stringify([def.name, def.desc, def.en, T.names.map(p => [p.n, p.say])]);
  check('places: only place names (no event, series, stadium, sponsor or person: not Helen Suzman, not Fritz Sonnenberg)', !/E-?Prix|Formula|DHL|Suzman|Sonnenberg|Radisson|stadium of/i.test(txt), '');
}
// 5. the pits: the lane on the left of Vlei Road across the start line (scenery: the game's pit stops are on the right, no def.pit), the
// grandstand with its roof across from it on the right
{
  const [a, b, o] = def.pitLane;
  check('pits: the lane on the left of Vlei Road (12-20 m out), across the start line, on the straight between Turn 12 and Turn 1; scenery only',
    o < -12 && o > -20 && a < 0 && b > 0 && a > -190 && b < 150 && !def.pit, `lane ${a} .. ${b} m, ${o} m to the side, def.pit ${def.pit ? 'set' : 'none'}`);
  check('pits: the main grandstand across from them, on the right of Vlei Road at the start line, roofed',
    def.stands[0][2] === 1 && def.stands[0][0] < 0 && def.stands[0][1] > 0 && def.stands[0][4] === 1, JSON.stringify(def.stands[0]));
}
// 6. the junctions: the side streets, each mouth opened up to its fence 11.5 m past the road's edge (the barrier there), the signalised ones
// with their traffic lights, all the furniture inside the barriers (knockable) and off the road
const furn = def.furniture.map(([d, sd, kind, l, face], k) => { const i = at(d); return { kind, x: T.px[i] + T.nx[i] * sd * l, z: T.pz[i] + T.nz[i] * sd * l, yaw: T.hd[i], i, d, sd, l, k }; });
{
  const J = def.junctions, sig = J.filter(j => j[4] === 'sig');
  const open = J.every(([d, sd]) => { const i = at(d); return (sd > 0 ? T.br[i] : T.bl[i]) > T.w + 10; });
  check('junctions: 20+ side streets closed at their mouths, the barrier opened into each up to its fence (over 10 m past the road\'s edge)', J.length >= 20 && open, `${J.length} junctions, ${sig.length} with traffic lights`);
  const kinds = {}; for (const f of furn) kinds[f.kind] = (kinds[f.kind] || 0) + 1;
  check('junctions: the traffic lights at the 3 signalised junctions (Turn 1, the boulevard, Turn 10), signs, lamps, bins, bollards and cabinets',
    sig.length >= 5 && kinds.tlight >= 3 * sig.length && kinds.sign >= 20 && kinds.lamp >= 10 && kinds.bin >= 20 && kinds.bollard >= 10 && kinds.cabinet >= sig.length, JSON.stringify(kinds));
  const inside = furn.filter(f => { const q = T.query(f.x, f.z, f.i, {}); return Math.abs(q.d) > T.w + 0.5 && (q.d > 0 ? q.d < q.br : -q.d < q.bl); });
  check('junctions: every piece of furniture inside the barriers (reachable, knockable) and off the road', inside.length === furn.length, `${inside.length} of ${furn.length}`);
}
// 7. knocked over: a car driven at 60 km/h into a traffic light, a sign and a lamp at the junctions knocks each over (it flies or topples, the
// next second it is still down), and drives on: a little slower, not stopped, not turned round
const knock = (kind) => {
  const orig = Math.random; Math.random = seeded(7);
  try {
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 5, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 3, difficulty: 1 });
    r.start(); for (let k = 0; k < 1200 && r.state !== 'racing'; k++) r.step(DT);
    r.setProps(furn.map(f => ({ kind: f.kind, x: f.x, z: f.z, yaw: f.yaw, i: f.i })), null);
    const f = furn.find(q => q.kind === kind && def.junctions[q.k >= 0 ? def.furniture[q.k][6] : 0][4] === 'sig') || furn.find(q => q.kind === kind);
    const b = r.props.find(p => Math.hypot(p.x - f.x, p.z - f.z) < 0.01 && p.kind === kind), P = r.player;
    // the car 22 m before it on the circuit, aimed at it, at 60 km/h
    const i0 = at(f.d - 22), x0 = T.px[i0] + T.nx[i0] * f.sd * 2, z0 = T.pz[i0] + T.nz[i0] * f.sd * 2, h = Math.atan2(f.z - z0, f.x - x0), v0 = 16.7;
    P.x = x0; P.z = z0; P.h = h; P.vx = Math.cos(h) * v0; P.vz = Math.sin(h) * v0; P.w = 0; P.q.i = i0;
    const b0 = { x: b.x, y: b.y, z: b.z }; let hit = false, vHit = 0, t = 0, tHit = 0, vMin = 1e9;
    for (let k = 0; k < 360; k++) {
      const ang = Math.atan2(Math.sin(Math.atan2(b0.z - P.z, b0.x - P.x) - P.h), Math.cos(Math.atan2(b0.z - P.z, b0.x - P.x) - P.h));
      if (hit) { P.digitalSteer = false; C.aiControl(P, r, DT); }   // (after the hit: back onto the circuit and on)
      else { P.inSteer = clamp(ang * 3, -1, 1); P.inThr = Math.hypot(P.vx, P.vz) < v0 ? 0.4 : 0; P.inBrk = 0; P.inHand = 0; P.digitalSteer = true; }
      Math.random = seeded(100 + k); r.step(DT); t += DT;
      const sp = Math.hypot(P.vx, P.vz); if (!hit && !b.sleep) { hit = true; vHit = sp; tHit = t; } if (hit && t < tHit + 0.5) vMin = Math.min(vMin, sp);
    }
    const moved = Math.hypot(b.x - b0.x, b.z - b0.z), down = b.y < b0.y - b.K.h0 * 0.4 || Math.abs(1 - 2 * (b.qx * b.qx + b.qz * b.qz)) < 0.7, sp = Math.hypot(P.vx, P.vz);
    return { kind, hit, moved, down, vHit, vMin, sp };
  } finally { Math.random = orig; }
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
for (const kind of ['tlight', 'sign', 'lamp', 'bin']) {
  const k = knock(kind);
  check(`knocked over: a car at 60 km/h knocks the junction's ${kind} over (it flies off, it lies down) and drives on, a little slower`,
    k.hit && k.moved > 1 && k.down && k.vMin > k.vHit * 0.75 && k.sp > 8, `moved ${k.moved.toFixed(1)} m, down ${k.down}, speed at the hit ${(k.vHit * 3.6).toFixed(0)} km/h, lowest in the next 0.5 s ${(k.vMin * 3.6).toFixed(0)}, 3 s on ${(k.sp * 3.6).toFixed(0)} km/h`);
}
// 8. a whole race: 12 AI cars and the player on the autopilot, 5 laps, every car to the finish without a rescue; in the rain slower (2-20 %)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.setProps(furn.map(f => ({ kind: f.kind, x: f.x, z: f.z, yaw: f.yaw, i: f.i })), null);
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
  check('race in the dry: all 13 cars to the finish of 5 laps, the player without a rescue; the winner\'s 5 laps 5-11 minutes',
    d.n === 13 && d.of === 13 && !d.resc && !d.nan && d.win > 300 && d.win < 660, `${d.n}/${d.of} finished, winner ${d.win && d.win.toFixed(1)} s, last ${d.last && d.last.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 cars to the finish, the player without a rescue, the winner 2-20 % slower than in the dry',
    w.n === 13 && w.of === 13 && !w.resc && !w.nan && w.win / d.win > 1.02 && w.win / d.win < 1.2, `${w.n}/${w.of} finished, winner ${w.win && w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
