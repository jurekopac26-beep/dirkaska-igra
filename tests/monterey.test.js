// Monterey, California: the circuit in the hills of the county park above Monterey, in its layout of 1988 (2.238 miles = 3.602 km, 11 turns,
// anticlockwise), from OpenStreetMap. The track (a closed circuit at full scale, the length within 1 % of the record books', anticlockwise), its
// heights (USGS 3DEP: the blind crest of Turn 1, the flat infield, the climb, the plunge through the spiral of Turn 8, 55 m in all), its eleven
// turns in order and each its way, the places along the lap, the pits where they are (the long lane on the left, from between Turns 10 and 11
// to the exit of Turn 2: scenery, the cars do not stop there), a whole race of 12 AI cars and the player on the autopilot in the dry and in the
// rain, every car to the finish, and the junctions' street furniture (Core PROPK: stop and other signs, lamps, hydrants, bins, bollards,
// cabinets): a car knocks it over and drives on.
//   node tests/monterey.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'monterey'), T = new C.Track(def);
const dS = (s) => { const L = T.len; return ((s - T.startS) % L + L) % L; };   // metres from the start line along the lap (0 .. L)
const at = (d) => T.idx(T.startS + d);

// 1. the track: a closed circuit of 4 laps, 3.602 km within 1 %, anticlockwise (one full turn to the left), in the big championship
{
  let turn = 0; for (let i = 0; i < T.N; i++) turn += T.k[i] * T.ds;
  check('track: Monterey, ZDA (Monterey, USA), a closed circuit of 4 laps, not a test track, in the big championship',
    def.name === 'Monterey, ZDA' && def.en && def.en.name === 'Monterey, USA' && !def.open && !def.timeTrial && !def.test && def.laps === 4 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('monterey'),
    `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
  check('track: 3.602 km (2.238 miles) within 1 %, the menu\'s real length 3.602 km, anticlockwise (one full turn to the left)',
    Math.abs(T.len / 3602 - 1) < 0.01 && def.realKm === 3.602 && Math.abs(turn + 2 * Math.PI) < 0.05,
    `${T.len.toFixed(1)} m (${((T.len / 3602 - 1) * 100).toFixed(2)} %), total turn ${(turn * 180 / Math.PI).toFixed(1)} deg`);
  check('track: the start line at the origin (the OSM node of the start / finish line), no crossover, kerbs in the bends',
    def.start[0] === 0 && def.start[1] === 0 && Math.hypot(T.px[T.startIdx], T.pz[T.startIdx]) < 3 && !(T.cross && T.cross.length) && T.curb.some(v => v), '');
}
// 2. the heights: the start line the zero; the blind crest of Turn 1 (+6..+10 m), the flat infield the lowest (-6..-3 m), the top at Turn 7
// (+48..+52 m), the spiral of Turn 8 dropping at 14-19 %, 52-58 m between the lowest and the highest (the record books: 180 ft = 55 m)
{
  const h = (d) => T.hy[at(d)], hmax = Math.max(...T.hy), hmin = Math.min(...T.hy); let iMax = 0; for (let i = 0; i < T.N; i++) if (T.hy[i] > T.hy[iMax]) iMax = i;
  let crest = -1e9; for (let d = 120; d < 300; d += 2) crest = Math.max(crest, h(d));
  let down = 0; for (let d = 2420; d < 2580; d += 2) down = Math.min(down, T.grade[at(d)]);
  let g = 0; for (let i = 0; i < T.N; i++) g = Math.max(g, Math.abs(T.grade[i]));
  check('heights: the blind crest of Turn 1 (+6..+10 m), the infield the lowest (-6..-3 m), the top by Turn 7 (+48..+52 m)',
    Math.abs(h(0)) < 0.3 && crest > 6 && crest < 10 && hmin > -6 && hmin < -3 && h(900) < -3 && hmax > 48 && hmax < 52 && dS(iMax * T.ds) > 2250 && dS(iMax * T.ds) < 2450,
    `start ${h(0).toFixed(1)} m, crest ${crest.toFixed(1)} m, infield ${h(900).toFixed(1)} m, lowest ${hmin.toFixed(1)} m, top ${hmax.toFixed(1)} m at ${Math.round(dS(iMax * T.ds))} m`);
  check('heights: the spiral of Turn 8 drops at 14-19 %, 52-58 m between the lowest and the highest, no grade over 19 %',
    down < -0.14 && down > -0.19 && hmax - hmin > 52 && hmax - hmin < 58 && g < 0.19, `steepest down in the spiral ${(down * 100).toFixed(1)} %, ${(hmax - hmin).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 3. the eleven turns in order and each its way (degrees: + right, - left): seven lefts and four rights, Turn 8 the left-right spiral
{
  const turnDeg = (a, b) => { let t = 0; for (let d = a; d < b; d += T.ds) t += T.k[at(d)] * T.ds; return t * 180 / Math.PI; };
  const REAL = [   // [the stretch of the lap (m from the start line), the direction (+1 right, -1 left), degrees min, max]
    [160, 280, -1, 8, 35],      // Turn 1: the left kink over the crest
    [400, 620, -1, 160, 215],   // Turn 2: the long hairpin, left
    [720, 900, 1, 70, 110],     // Turn 3: right
    [980, 1150, 1, 50, 90],     // Turn 4: right
    [1450, 1680, -1, 90, 130],  // Turn 5: left
    [1880, 2060, -1, 40, 80],   // Turn 6: left, up the hill
    [2330, 2420, 1, 8, 30],     // Turn 7: the kink at the top, right
    [2420, 2496, -1, 60, 110],  // Turn 8: the spiral, left ...
    [2496, 2570, 1, 45, 90],    // ... and right (8A)
    [2600, 2840, -1, 80, 130],  // Turn 9: the long left down the hill
    [2930, 3080, 1, 55, 95],    // Turn 10: right
    [3220, 3360, -1, 95, 135],  // Turn 11: the last hairpin, left, onto the front straight
  ];
  const ds = def.turns.map(([x, z]) => dS(T.nearestIdx(x, z) * T.ds));
  const res = REAL.map(([a, b, dir, lo, hi], k) => { const deg = turnDeg(a, b); return { k, deg, ok: Math.sign(deg) === dir && Math.abs(deg) >= lo && Math.abs(deg) <= hi }; });
  const tk = [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11];   // (the boards: Turn 8's on the spiral's left)
  check('turns: eleven number boards in order along the lap, each on its stretch',
    def.turns.length === 11 && ds.every((d, k) => k === 0 || d > ds[k - 1]) && ds.every((d, k) => d >= REAL[tk[k]][0] - 30 && d <= REAL[tk[k]][1] + 30), ds.map((d, k) => `${k + 1}@${Math.round(d)}`).join(' '));
  check('turns: 1 L, 2 L (hairpin), 3 R, 4 R, 5 L, 6 L, 7 R, 8 L-R (the spiral), 9 L, 10 R, 11 L (hairpin): seven lefts, four rights',
    res.every(r => r.ok), res.map((r, k) => `${['1', '2', '3', '4', '5', '6', '7', '8', '8A', '9', '10', '11'][k]} ${r.deg > 0 ? 'R' : 'L'} ${Math.abs(r.deg).toFixed(0)}°`).join(', '));
}
// 4. the places: Turns 1-11 in order, each with the commentator's lines; numbers only (no names of people or sponsors)
{
  const L = T.names;
  check('places: Turns 1-11 in order along the lap, the commentator\'s lines for each',
    L.map(p => p.n).join() === Array.from({ length: 11 }, (_, k) => 'Zavoj ' + (k + 1)).join() && L.every((p, k) => k === 0 || p.d > L[k - 1].d) && L.every(p => p.say && p.say.length === 3),
    L.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
  const txt = JSON.stringify([def.names, def.desc, def.en]);
  check('places: no names of people, sponsors or the circuit\'s sponsor in the track\'s texts', !/Andretti|Rahal|Rainey|Corkscrew|WeatherTech|Laguna Seca|Mazda/i.test(txt), '');
}
// 5. the pits: the lane (OSM) on the left, from between Turns 10 and 11 to the exit of Turn 2, 10-15 m off the centre line along the front
// straight, the circuit's left limit at its pit wall; scenery (the game's pit stops are on the right): no def.pit
{
  const PL = def.mt.pl, [a, b] = def.mt.pit, lat0 = PL.find(p => p[0] >= 0)[1];
  const lefts = PL.every(p => p[1] < 0);
  check('pits: the lane on the left, from between Turns 10 and 11 (-560..-450 m) to the exit of Turn 2 (+540..+620 m), 10-15 m out at the start line; scenery only',
    lefts && a > -560 && a < -450 && b > 540 && b < 620 && lat0 < -10 && lat0 > -15 && !def.pit, `lane ${a} .. ${b} m, ${lat0} m to the side at the line, def.pit ${def.pit ? 'set' : 'none'}`);
  const i = at(0);
  check('pits: the circuit\'s left limit by the pit wall at the start line (within 4 m of the road edge), the grandstands across on the right',
    T.bl[i] - T.w < 4 && def.mt.bld.filter(r => r[1] === 2).length >= 4, `left limit ${(T.bl[i] - T.w).toFixed(1)} m past the edge, ${def.mt.bld.filter(r => r[1] === 2).length} grandstands`);
}
// 6. a whole race: 12 AI cars and the player on the autopilot, 4 laps, every car to the finish without a rescue; in the rain slower (2-20 %)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: def.laps, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
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
  check('race in the dry: all 13 cars to the finish, the player without a rescue; the winner\'s 4 laps 4-9 minutes',
    d.n === 13 && d.of === 13 && !d.resc && !d.nan && d.win > 240 && d.win < 540, `${d.n}/${d.of} finished, winner ${d.win && d.win.toFixed(1)} s, last ${d.last && d.last.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 cars to the finish, the player without a rescue, the winner 2-20 % slower than in the dry',
    w.n === 13 && w.of === 13 && !w.resc && !w.nan && w.win / d.win > 1.02 && w.win / d.win < 1.2, `${w.n}/${w.of} finished, winner ${w.win && w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}
// 7. the junctions' street furniture: one of each kind stood on the player's line down the front straight; the player on the autopilot
// knocks every one of them over (it is thrown off its foot and lies tilted, metres from where it stood) and drives on (on to Turn 2, not slowed
// to a crawl, a little damage at the most)
{
  const KINDS = ['stop', 'sign', 'warn', 'lamp', 'hydrant', 'bin', 'bollard', 'cabinet'];
  const run = (withProps) => {
    const orig = Math.random; Math.random = seeded(7);
    try {
      const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 5, difficulty: 1, damage: 2 });
      r.start(); const P = r.player;
      const put = KINDS.map((kind, k) => { const d = 70 + k * 14, i = at(d); return { kind, x: T.px[i] + T.nx[i] * T.rl[i], z: T.pz[i] + T.nz[i] * T.rl[i], yaw: T.hd[i], i }; });
      if (withProps) r.setProps(put);
      const S = (r.props || []).map(b => ({ b, x: b.x, z: b.z }));
      let t = 0, k = 0, t300 = null, reach = false;
      while (t < 60 && !reach) { Math.random = seeded(9000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT;
        const d = dS(P.q.s); if (t300 == null && d > 300 && d < 1000) t300 = t; if (d > 420 && d < 1000) reach = true; }
      const res = S.map(({ b, x, z }) => { const moved = Math.hypot(b.x - x, b.z - z), up = 1 - 2 * (b.qx * b.qx + b.qz * b.qz); return { kind: b.kind, moved, tilt: Math.acos(Math.max(-1, Math.min(1, up))) * 180 / Math.PI }; });
      return { res, n: S.length, t300, reach, dmg: P.dmg };
    } finally { Math.random = orig; }
  };
  const a0 = run(false), a1 = run(true), res = a1.res;
  check('street furniture: each kind (stop, sign, warn, lamp, hydrant, bin, bollard, cabinet) is a knockable prop (Core PROPK)', a1.n === KINDS.length && res.map(o => o.kind).join() === KINDS.join(), `${a1.n} props`);
  check('street furniture: the car knocks every one over (moved 1 m or more, or tipped 30 degrees or more)', res.every(o => o.moved >= 1 || o.tilt >= 30), res.map(o => `${o.kind} ${o.moved.toFixed(1)} m ${o.tilt.toFixed(0)}°`).join(', '));
  check('street furniture: the car drives on through them to Turn 2, at most half a second lost per piece knocked (eight in a row), little damage', a1.reach && (a1.t300 - a0.t300) / KINDS.length < 0.5 && (a1.dmg == null || a1.dmg < 0.5),
    `reached Turn 2: ${a1.reach}, 300 m in ${a1.t300 && a1.t300.toFixed(2)} s (none: ${a0.t300 && a0.t300.toFixed(2)} s), damage ${a1.dmg == null ? '-' : a1.dmg.toFixed(2)}`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
