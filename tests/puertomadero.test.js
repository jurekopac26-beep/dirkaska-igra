// Puerto Madero, Buenos Aires: the street circuit of the electric races of 2015-2017 in the docklands, in its layout of 2016-2017 (2.48 km),
// laid on the streets of OpenStreetMap. The track (a closed circuit at full scale, anticlockwise, the length within 1 % of the record books',
// flat, 6 laps), its twelve turns in order and each its way (the Turn 1 hairpin at the end of the 505 m straight by the lagoon, the fast
// Turn 3, the hairpin through the boulevard's median (5), the chicane across the avenue (8, 9), the wide left onto the waterfront (10) and
// its right-left (11, 12)), the places along the lap, the pits where they were (on the left, the service road on the inside of Turn 10:
// scenery), the junctions (the wall standing back into each side street) and their street furniture knocked down by a car that drives on,
// and a whole race of 12 AI cars and the player on the autopilot, in the dry and in the rain, every car to the finish.
//   node tests/puertomadero.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'puertomadero'), T = new C.Track(def);
const dS = (s) => { const L = T.len; return ((s - T.startS) % L + L) % L; };   // metres from the start line along the lap (0 .. L)
const at = (d) => T.idx(T.startS + d);
const hd = (d) => Math.atan2(T.tz[at(d)], T.tx[at(d)]), dA = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

// 1. the track: a closed circuit of 6 laps, 2.48 km within 1 %, anticlockwise, flat, in the big championship
{
  let turn = 0; for (let i = 0; i < T.N; i++) turn += T.k[i] * T.ds;
  check('track: Puerto Madero, Argentina (the same in English), a closed circuit of 6 laps, not a test track, in the big championship',
    def.name === 'Puerto Madero, Argentina' && def.en && def.en.name === 'Puerto Madero, Argentina' && !def.open && !def.timeTrial && !def.test && def.laps === 6 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('puertomadero'),
    `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
  check('track: 2.480 km (the layout of 2016-2017) within 1 %, the menu\'s real length 2.48 km, anticlockwise (one full turn to the left)',
    Math.abs(T.len / 2480 - 1) < 0.01 && def.realKm === 2.48 && Math.abs(turn + 2 * Math.PI) < 0.05,
    `${T.len.toFixed(1)} m (${((T.len / 2480 - 1) * 100).toFixed(2)} %), total turn ${(turn * 180 / Math.PI).toFixed(1)} deg`);
  check('track: flat (the docklands: no heights), no crossover, a street circuit (no racing kerbs, pavement off the road)',
    !T.hasElev && !(T.cross && T.cross.length) && def.noCurbs && !T.curb.some(v => v) && def.offSurface === 'paving', '');
  let lo = 0, hi = 0; for (let d = 0; d > -400; d -= 2) { if (Math.abs(dA(hd(d), hd(60))) > 0.05) break; lo = d; } for (let d = 0; d < 600; d += 2) { if (Math.abs(dA(hd(d), hd(60))) > 0.05) break; hi = d; }
  check('track: the start line on the long straight by the lagoon, the straight 505 m (480-530 m within 3 degrees), Turn 1 at its end',
    hi - lo > 480 && hi - lo < 530 && lo < -100 && hi > 300, `straight from ${lo} to ${hi} m: ${hi - lo} m`);
}
// 2. the twelve turns in order and each its way: the number boards (def.turns) in order along the lap, the road turning their way round each
// (degrees: + right, - left) within its stretch
{
  const turnDeg = (a, b) => { let t = 0; for (let d = a; d < b; d += T.ds) t += T.k[at(d)] * T.ds; return t * 180 / Math.PI; };
  const REAL = [   // [the stretch of the lap (m from the start line), the direction (+1 right, -1 left), degrees min, max]
    [320, 430, -1, 160, 195],   // Turn 1: the hairpin round the island at the end of the long straight, left
    [430, 520, 1, 40, 75],      // Turn 2: right, from the parallel avenue into the street through the park
    [560, 800, -1, 40, 70],     // Turn 3: the fast left sweep through the park
    [1060, 1130, -1, 75, 100],  // Turn 4: left onto the boulevard
    [1200, 1290, 1, 150, 185],  // Turn 5: the hairpin through the boulevard's median, right
    [1350, 1430, -1, 65, 95],   // Turn 6: left, back into the street
    [1660, 1760, -1, 120, 150], // Turn 7: hard left onto the avenue
    [1870, 1905, 1, 10, 30],    // Turn 8: the chicane across the avenue, right
    [1905, 1960, -1, 6, 25],    // Turn 9: and left
    [2080, 2160, -1, 55, 85],   // Turn 10: the wide left onto the waterfront
    [2200, 2275, 1, 40, 65],    // Turn 11: right
    [2275, 2330, -1, 25, 45],   // Turn 12: left onto the long straight
  ];
  const ds = def.turns.map(([x, z]) => dS(T.nearestIdx(x, z) * T.ds));
  const res = REAL.map(([a, b, dir, lo, hi], k) => { const deg = turnDeg(a, b); return { k: k + 1, deg, ok: Math.sign(deg) === dir && Math.abs(deg) >= lo && Math.abs(deg) <= hi && ds[k] >= a && ds[k] <= b }; });
  check('turns: twelve number boards in order along the lap, each on its stretch',
    def.turns.length === 12 && ds.every((d, k) => k === 0 || d > ds[k - 1]) && res.every(r => r.ok), ds.map((d, k) => `${k + 1}@${Math.round(d)}`).join(' '));
  check('turns: 1 L hairpin, 2 R, 3 L (fast), 4 L, 5 R hairpin, 6 L, 7 L, the chicane 8 R 9 L, 10 L, 11 R, 12 L',
    res.every(r => r.ok), res.map(r => `T${r.k} ${r.deg > 0 ? 'R' : 'L'} ${Math.abs(r.deg).toFixed(0)}°`).join(', '));
  let near = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 40; j < T.N - 40 + i && j < T.N; j += 2) near = Math.min(near, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]));
  check('turns: the legs of the hairpins apart (at least the road\'s width and a wall: 13 m)', near >= 13, `nearest legs ${near.toFixed(1)} m apart`);
}
// 3. the places: the hairpins, Turn 7, the chicane, the waterfront, the long straight; the commentator's lines for each; no names of people
{
  const L = T.names;
  check('places: Turns 1, 3, 5, 7, the chicane, the waterfront, the straight by the lagoon in order, three lines each',
    L.map(p => p.n).join() === 'Zavoj 1,Zavoj 3,Zavoj 5,Zavoj 7,Šikana,Costanera,Ravnina ob laguni' && L.every((p, k) => k === 0 || p.d > L[k - 1].d) && L.every(p => p.say && p.say.length === 3),
    L.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
}
// 4. the pits of the races: on the left, the service road on the inside of Turn 10 (it leaves the avenue before the corner and meets the
// waterfront after it), scenery only (the game's pit stops are on the right: no def.pit); the grandstands along the straight by the lagoon
{
  const [a, b, o] = def.pitLane, t10 = dS(T.nearestIdx(...def.turns[9]) * T.ds);
  check('pits: on the left, on the inside of Turn 10 (from before it to after it, up to 25 m off the line); scenery only',
    o < -15 && a < t10 && b > t10 && b - a > 80 && b - a < 140 && !def.pit && def.pm.pit && def.pm.pit.length >= 8, `lane ${a} .. ${b} m, ${o} m to the side, Turn 10 at ${Math.round(t10)} m`);
  check('stands: the main one on the right of the straight by the lagoon, across the start line', def.stands.some(([sa, sb, sd]) => sd === 1 && sa < 0 && sb > 100), JSON.stringify(def.stands));
}
// 5. the junctions: in each the wall stands back into the side street (a pocket for its corners and things), elsewhere close to the road
{
  const W = def.wide, deep = W.every(([a, b, sd, m]) => { const i = at((a + b) / 2), bar = sd > 0 ? T.br[i] : T.bl[i]; return bar >= T.w + m; });
  let tight = 0, cnt = 0; for (let d = 0; d < T.len; d += 10) { if (W.some(([a, b]) => d > a - 10 && d < b + 10)) continue; cnt++; const i = at(d); if (Math.min(T.br[i], T.bl[i]) < T.w + 4) tight++; }
  check('junctions: at least 15 pockets, the wall stands back at least their depth from the road in each (both sides of the avenues)',
    W.length >= 15 && deep && W.some(w => w[2] < 0) && W.some(w => w[2] > 0), `${W.length} pockets, ${W.filter(w => w[3] >= 8).length} of the main streets`);
  check('junctions: away from them the walls stand close to the road (a street circuit), on most of the lap within 4 m of its edge', tight / cnt > 0.6, `${tight} of ${cnt} places`);
}
// 6. the street furniture in a junction (as the world puts it: on the pocket's corners): a car drives into the traffic lights, the lamp, a
// sign, the bollards, a bin, a hydrant, the cabinet and the bus shelter; each is knocked over or flies off, the car drives on (a little slower, no
// wall), as it does through the cones
{
  const o2 = Math.random; Math.random = seeded(91);
  const pick = def.wide.find(([a, b, sd, m]) => m >= 8 && b - a > 50), [a, b, sd] = pick, w = T.w;   // (the junction at Turn 10)
  const put = (kind, d, lat, yaw) => { const i = at(d); return { kind, x: T.px[i] + T.nx[i] * lat, z: T.pz[i] + T.nz[i] * lat, yaw: T.hd[i] + (yaw || 0), col: 0, i }; };
  const list = [put('signal', a + 3.2, sd * (w + 0.9)), put('bollard', a + 4.4, sd * (w + 0.6)), put('sign', a + 1.8, sd * (w + 2.4)), put('bin', a + 4.8, sd * (w + 3.6)), put('hydrant', a + 5.2, sd * (w + 1.2)), put('shelter', a + 3, sd * (w + 5.2)),
    put('lamp', b - 1.6, sd * (w + 1.4)), put('cabinet', b - 4.2, sd * (w + 2.8)), put('bollard', b - 2.2, sd * (w + 0.6))];
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 6, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain: 0 }), P = r.player; r.start();
  r.setProps(list, null); P.locked = false;
  const starts = r.props.filter(p => !p.dead).map(p => ({ p, x: p.x, z: p.z }));
  // aim at each thing in turn from 22 m back along the road, near its edge, at 15 m/s and more
  const res = [];
  for (const tgt of starts) {
    const d0 = dS(T.nearestIdx(tgt.x, tgt.z) * T.ds) - 22, i0 = at(d0);
    P.place(T.px[i0] + T.nx[i0] * sd * (w - 1.2), T.pz[i0] + T.nz[i0] * sd * (w - 1.2), T.hd[i0]); P.vx = Math.cos(P.h) * 15; P.vz = Math.sin(P.h) * 15;
    let hit = false, vHit = 0, t = 0, wall = 0;
    for (; t < 4 && !hit; t += DT) { const want = Math.atan2(tgt.p.z - P.z, tgt.p.x - P.x), e = dA(want, P.h); P.inSteer = Math.max(-1, Math.min(1, e * 2.5)); P.inThr = 0.7; P.inBrk = 0; P.inHand = 0;
      P.hitWall = 0; r.step(DT); if (P.hitWall > 0.5) wall++; if (Math.hypot(tgt.p.x - tgt.x, tgt.p.z - tgt.z) > 0.3 || tgt.p.dead !== false) { hit = true; vHit = P.speed; } }
    let v1 = 0, tilt = 1; for (let k = 0; k < 120; k++) { P.inSteer = 0; P.inThr = k < 60 ? 0.7 : 0; P.inBrk = k < 60 ? 0 : 0.5; r.step(DT); if (k === 59) v1 = P.speed; tilt = Math.min(tilt, 1 - 2 * (tgt.p.qx * tgt.p.qx + tgt.p.qz * tgt.p.qz)); }   // (tilt: the cosine of its lean, the most it leant)
    const moved = Math.hypot(tgt.p.x - tgt.x, tgt.p.z - tgt.z);
    res.push({ kind: tgt.p.kind, ok: hit && moved > 0.5 && v1 > 8 && !wall, txt: `${tgt.p.kind}: ${hit ? 'hit' : 'missed'} at ${vHit.toFixed(1)} m/s, moved ${moved.toFixed(1)} m, ${tilt < 0.7 ? 'down' : 'upright'}, the car on at ${v1.toFixed(1)} m/s${wall ? ', a wall' : ''}` });
  }
  Math.random = o2;
  check('junction: the traffic lights, a bollard, the sign, the bin, the hydrant, the bus shelter, the lamp and the cabinet on its corners all knocked away by the car, which drives on (over 8 m/s, no wall)',
    res.length === 9 && res.every(x => x.ok) && ['signal', 'lamp', 'sign', 'bollard', 'bin', 'hydrant', 'cabinet', 'shelter'].every(k => res.some(x => x.kind === k)), res.map(x => x.txt).join(' | '));
  const tall = res.filter(x => x.kind === 'signal' || x.kind === 'lamp' || x.kind === 'sign');
  check('junction: the poles (lights, lamp, sign) knocked down, not just pushed', tall.every(x => /down/.test(x.txt)), tall.map(x => x.txt).join(' | '));
}
// 7. a whole race: 12 AI cars and the player on the autopilot, 6 laps, every car to the finish without a rescue; in the rain slower (2-20 %)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 6, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0, nan = false;
    while (t < 1500 && r.cars.some(c => !c.finished)) {
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
  check('race in the dry: all 13 cars to the finish, the player without a rescue; the winner\'s 6 laps 6-11 minutes',
    d.n === 13 && d.of === 13 && !d.resc && !d.nan && d.win > 360 && d.win < 660, `${d.n}/${d.of} finished, winner ${d.win && d.win.toFixed(1)} s, last ${d.last && d.last.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 cars to the finish, the player without a rescue, the winner 2-20 % slower than in the dry',
    w.n === 13 && w.of === 13 && !w.resc && !w.nan && w.win / d.win > 1.02 && w.win / d.win < 1.2, `${w.n}/${w.of} finished, winner ${w.win && w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
