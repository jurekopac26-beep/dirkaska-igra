// Marrakesh, Maroko: the street circuit by the Agdal gardens in its layout of 2016-2022 (2.971 km), from the deleted OSM way, Sentinel-2 and the
// track guides' corner notes. The track (a closed circuit at full scale, anticlockwise, the length within 0.5 % of the official, nearly flat),
// its twelve turns in order and each its way (Turn 1 the left hairpin by the roundabout, the chicane 4-5 left-right, the left hairpin 10 onto the
// boulevard, Turn 12 the right at the junction), the places along the lap, the pits on the left of the start straight (scenery, as on Riverside),
// the street furniture of the junctions (traffic lights, lamps, signs, bollards, bins, hydrants, cabinets, bus shelters): each kind knocked over
// by a car that drives on, a little slower and lightly dented; and a whole race of 12 AI cars and the player on the autopilot, in the dry and
// in the rain, every car to the finish.
//   node tests/marrakesh.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'marrakesh'), T = new C.Track(def);
const dS = (s) => { const L = T.len; return ((s - T.startS) % L + L) % L; };   // metres from the start line along the lap (0 .. L)
const at = (d) => T.idx(T.startS + d);

// 1. the track: a closed circuit of 5 laps, 2.971 km within 0.5 %, anticlockwise, in the big championship; nearly flat (the town's plain)
{
  let turn = 0; for (let i = 0; i < T.N; i++) turn += T.k[i] * T.ds;
  let g = 0; for (let i = 0; i < T.N; i++) g = Math.max(g, Math.abs(T.grade[i]));
  check('track: Marrakesh, Maroko (Marrakesh, Morocco), a closed circuit of 5 laps, not a test track, in the big championship',
    def.name === 'Marrakesh, Maroko' && def.en && def.en.name === 'Marrakesh, Morocco' && !def.open && !def.timeTrial && !def.test && def.laps === 5 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('marrakesh'),
    `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
  check('track: 2.971 km within 0.5 %, the menu\'s real length 2.971 km, anticlockwise (one full turn to the left), no crossover',
    Math.abs(T.len / 2971 - 1) < 0.005 && def.realKm === 2.971 && Math.abs(turn + 2 * Math.PI) < 0.05 && !(T.cross && T.cross.length),
    `${T.len.toFixed(1)} m (${((T.len / 2971 - 1) * 100).toFixed(2)} %), total turn ${(turn * 180 / Math.PI).toFixed(1)} deg`);
  check('track: flat as the plain (heights within 12 m, no grade over 3 %)', Math.max(...T.hy) - Math.min(...T.hy) < 12 && g < 0.03,
    `${Math.min(...T.hy).toFixed(1)} .. ${Math.max(...T.hy).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 2. the twelve turns in order and each its way: the number boards (def.turns) in order along the lap, the road turning their way round each
// (degrees: + right, - left) within its stretch of the lap
{
  const turnDeg = (a, b) => { let t = 0; for (let d = a; d < b; d += T.ds) t += T.k[at(d)] * T.ds; return t * 180 / Math.PI; };
  const REAL = [   // [the stretch of the lap (m from the start line), the direction (+1 right, -1 left), degrees min, max]
    [156, 456, -1, 140, 185],   // Turn 1: the left hairpin by the roundabout (the pit exit on its inside)
    [456, 751, 1, 40, 80],      // Turn 2: the right sweep
    [751, 991, -1, 60, 185],    // Turn 3: left, down to the chicane
    [991, 1176, -1, 50, 95],    // Turn 4: the chicane, left
    [1176, 1236, 1, 80, 130],   // Turn 5: and right
    [1236, 1516, 1, 30, 70],    // Turn 6: the right kink onto Route de l'Ourika, the back straight
    [1516, 1801, -1, 50, 90],   // Turn 7: left at its end
    [1801, 1906, -1, 40, 95],   // Turn 8: left, 90 degrees
    [1906, 2026, 1, 30, 70],    // Turn 9: the long right round the hotel gardens
    [2026, 2336, -1, 100, 150], // Turn 10: the left hairpin onto Boulevard Mohammed VI
    [2336, 2666, -1, 55, 95],   // Turn 11: left
    [2666, 2826, 1, 70, 105],   // Turn 12: right at the junction (the pit entry on its outside), onto the start straight
  ];
  const ds = def.turns.map(([x, z]) => dS(T.nearestIdx(x, z) * T.ds));
  const res = REAL.map(([a, b, dir, lo, hi], k) => { const deg = turnDeg(a, b); return { k: k + 1, deg, ok: Math.sign(deg) === dir && Math.abs(deg) >= lo && Math.abs(deg) <= hi && ds[k] >= a && ds[k] <= b }; });
  check('turns: twelve number boards in order along the lap, each on its stretch',
    def.turns.length === 12 && ds.every((d, k) => k === 0 || d > ds[k - 1]) && res.every(r => r.ok), ds.map((d, k) => `${k + 1}@${Math.round(d)}`).join(' '));
  check('turns: 1 L (hairpin), 2 R, 3 L, the chicane 4-5 L-R, 6 R, 7 L, 8 L, 9 R, 10 L (hairpin), 11 L, 12 R',
    res.every(r => r.ok), res.map(r => `T${r.k} ${r.deg > 0 ? 'R' : 'L'} ${Math.abs(r.deg).toFixed(0)}°`).join(', '));
  let near = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 60; j < T.N - 60 + i && j < T.N; j += 2) near = Math.min(near, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]));
  check('turns: the legs of the hairpins apart (at least 14 m between the centre lines)', near >= 14, `nearest legs ${near.toFixed(1)} m apart`);
}
// 3. the places along the lap in order, each with the commentator's lines; only geographic names and numbers
{
  const L = T.names;
  check('places: in order along the lap, the commentator\'s lines for each',
    L.length >= 8 && L.every((p, k) => k === 0 || p.d > L[k - 1].d) && L.every(p => p.say && p.say.length === 3), L.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
}
// 4. the pits: the lane on the left of the start straight (the inside of the circuit), across the start line, from
// Turn 12 to Turn 1; scenery (the game's pit stops are on the right: no def.pit); the grandstands
{
  const [a, b, o] = def.pitLane;
  check('pits: on the left of the start straight (12-25 m out), across the start line, from Turn 12 (the entry on its outside) to the exit inside Turn 1; scenery only',
    o < -12 && o > -25 && a < 0 && b > 0 && a > 2666 - T.len && b < 260 && !def.pit, `lane ${a} .. ${b} m, ${o} m to the side, def.pit ${def.pit ? 'set' : 'none'}`);
  check('pits: the main grandstand across from them, on the right of the start straight at the start line',
    def.stands.some(s => s[2] === 1 && s[0] < 0 && s[1] > 0), JSON.stringify(def.stands));
}
// 5. the junctions' street furniture: each kind in the car's path along the start straight and on to Turn 2; every one knocked aside, the car
// drives on (a little slower than without them, lightly dented: no more than 0.06 a knock)
{
  const KINDS = ['signal', 'lamp', 'sign', 'bollard', 'bin', 'hydrant', 'cabinet', 'shelter'];
  const drive = (list) => {
    const orig = Math.random; Math.random = seeded(3);
    try {
      const r = new C.Race(T, { numAI: 0, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 });
      r.start(); r.setProps(list, null); const P = r.player, path = []; let t = 0, k = 0, resc = 0;
      while (t < 30) {
        Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; path.push([P.x, P.z, dS(P.q.s)]);
        if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
      }
      return { r, P, d: dS(P.q.s), path, resc };
    } finally { Math.random = orig; }
  };
  const free = drive([]), on = (d) => free.path.find(p => p[2] > d && p[2] < d + 50);
  const list = KINDS.map((kind, j) => { const p = on(200 + j * 40); return { kind, x: p[0], z: p[1], yaw: 0 }; });
  const hit = drive(list), moved = hit.r.props.map(b => { const p = list.find(q => q.kind === b.kind); return Math.hypot(b.x - p.x, b.z - p.z); });
  check('junction props: all eight kinds (traffic light, lamp, sign, bollard, bin, hydrant, cabinet, bus shelter) known to the race',
    hit.r.props.length === KINDS.length && KINDS.every(k => hit.r.props.some(b => b.kind === k)), hit.r.props.map(b => b.kind).join(', '));
  check('junction props: each knocked aside (moved over 2 m) by the car in its path',
    moved.every(m => m > 2), hit.r.props.map((b, k) => `${b.kind} ${moved[k].toFixed(1)} m`).join(', '));
  check('junction props: the car drives on (no rescue, at least 70 % of the distance without them in 30 s, slower than without), lightly dented (at most 0.06 a knock)',
    !hit.resc && hit.d > free.d * 0.7 && hit.d < free.d && hit.P.dmg > 0 && hit.P.dmg <= 0.06 * KINDS.length + 0.02 && free.P.dmg === 0,
    `${hit.d.toFixed(0)} m against ${free.d.toFixed(0)} m, damage ${hit.P.dmg.toFixed(3)}`);
}
// 6. a whole race: 12 AI cars and the player on the autopilot, 5 laps, every car to the finish without a rescue; in the rain slower (2-20 %)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: def.laps, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0, nan = false;
    while (t < 900 && r.cars.some(c => !c.finished)) {
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
  check('race in the dry: all 13 cars to the finish, the player without a rescue; the winner\'s 5 laps 5-10 minutes',
    d.n === 13 && d.of === 13 && !d.resc && !d.nan && d.win > 300 && d.win < 600, `${d.n}/${d.of} finished, winner ${d.win && d.win.toFixed(1)} s, last ${d.last && d.last.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 cars to the finish, the player without a rescue, the winner 2-20 % slower than in the dry',
    w.n === 13 && w.of === 13 && !w.resc && !w.nan && w.win / d.win > 1.02 && w.win / d.win < 1.2, `${w.n}/${w.of} finished, winner ${w.win && w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
