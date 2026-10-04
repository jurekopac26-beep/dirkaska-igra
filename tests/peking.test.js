// Peking (Beijing), China: the street circuit round the Olympic Green's big stadium, in its first layout (2014: 20 turns, anticlockwise,
// officially 3.44 km), reconstructed on the OpenStreetMap roads of the park. The track (a closed circuit at full scale, anticlockwise, the
// length within 3 % of the official 3.44 km, flat), its turns in order and each its way (the square lefts of Turns 1, 2 and 6, Turn 9 left
// towards the lake, the long left round the stadium (14), Turn 15 left onto the plaza, the last corner (20) a right; the four chicanes
// 3-5, 7-8, 10-13 and 16-19 flicking both ways), the places along the lap, the pits on the right of the start straight with grandstand 1
// across from them, the junctions where the park's roads meet the circuit and their street furniture (all of it of the generic knockable
// kinds, every piece inside the barriers and off the asphalt), a car driven into a junction's furniture (it knocks it over and drives on,
// a little slower, a little damaged), and a whole race of 12 AI cars and the player on the autopilot, in the dry and in the rain, every
// car to the finish.
//   node tests/peking.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'peking'), T = new C.Track(def);
const dS = (s) => { const L = T.len; return ((s - T.startS) % L + L) % L; };   // metres from the start line along the lap (0 .. L)
const at = (d) => T.idx(T.startS + d);
const turnDeg = (a, b) => { let t = 0; for (let d = a; d < b; d += T.ds) t += T.k[at(d)] * T.ds; return t * 180 / Math.PI; };

// 1. the track: Peking, Kitajska (Beijing, China), a closed circuit of 4 laps, not a test track, in the big championship; the length within
// 3 % of the official 3.44 km (the reconstruction on the park's roads), anticlockwise (one full turn to the left), flat
{
  let turn = 0; for (let i = 0; i < T.N; i++) turn += T.k[i] * T.ds;
  check('track: Peking, Kitajska (Beijing, China), a closed circuit of 4 laps, not a test track, in the big championship',
    def.name === 'Peking, Kitajska' && def.en && def.en.name === 'Beijing, China' && !def.open && !def.timeTrial && !def.test && def.laps === 4 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('peking'),
    `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
  check('track: 3.44 km within 3 % (the menu\'s real length 3.44 km), anticlockwise (one full turn to the left), no crossover, flat',
    Math.abs(T.len / 3440 - 1) < 0.03 && def.realKm === 3.44 && Math.abs(turn + 2 * Math.PI) < 0.05 && !(T.cross && T.cross.length) && !T.hasElev,
    `${T.len.toFixed(1)} m (${((T.len / 3440 - 1) * 100).toFixed(2)} %), total turn ${(turn * 180 / Math.PI).toFixed(1)} deg`);
}
// 2. the turns in order and each its way: the twenty number boards (def.turns) in order along the lap, the road turning their way round the
// corners (degrees: + right, - left) within each stretch of the lap; the chicanes flick both ways (both signs of curvature, tight)
{
  const REAL = [   // [the stretch (m from the start line), the direction (+1 right, -1 left), degrees min, max, what]
    [100, 215, -1, 75, 105, 'Turn 1: the square left onto the road along the arena'],
    [330, 440, -1, 75, 105, 'Turn 2: left onto the long west boulevard'],
    [1250, 1360, -1, 75, 105, 'Turn 6: left onto the road south of the venues'],
    [1945, 2040, -1, 55, 90, 'Turn 9: left towards the lake'],
    [2250, 2560, -1, 20, 75, 'Turn 14: the long left round the stadium'],
    [2560, 2660, -1, 40, 85, 'Turn 15: left onto the plaza north of the stadium'],
    [3075, 3185, 1, 80, 115, 'Turn 20: the last corner, right onto the start straight'],
  ];
  const res = REAL.map(([a, b, dir, lo, hi, what]) => { const deg = turnDeg(a, b); return { what, deg, ok: Math.sign(deg) === dir && Math.abs(deg) >= lo && Math.abs(deg) <= hi }; });
  const ds = def.turns.map(([x, z]) => dS(T.nearestIdx(x, z) * T.ds));
  const inside = [[1, 100, 215], [2, 330, 440], [6, 1250, 1360], [9, 1945, 2040], [14, 2250, 2560], [15, 2560, 2660], [20, 3075, 3185]].every(([k, a, b]) => ds[k - 1] >= a && ds[k - 1] <= b);
  check('turns: twenty number boards in order along the lap, Turns 1, 2, 6, 9, 14, 15 and 20 on their stretches',
    def.turns.length === 20 && ds.every((d, k) => k === 0 || d > ds[k - 1]) && inside, ds.map((d, k) => `${k + 1}@${Math.round(d)}`).join(' '));
  check('turns: 1, 2 and 6 square lefts, 9 left, 14 the long left, 15 left, 20 right', res.every(r => r.ok), res.map(r => `${r.what.split(':')[0]} ${r.deg > 0 ? 'R' : 'L'} ${Math.abs(r.deg).toFixed(0)}°`).join(', '));
  const CHI = [[3, 5, 'chicane 3-5 (2014)'], [7, 8, 'chicane 7-8'], [10, 13, 'chicane 10-13'], [16, 19, 'chicane 16-19']].map(([a, b, what]) => {
    const d0 = ds[a - 1] - 25, d1 = ds[b - 1] + 25; let kp = 0, km = 0; for (let d = d0; d < d1; d += T.ds) { const k = T.k[at(d)]; kp = Math.max(kp, k); km = Math.min(km, k); }
    const net = Math.abs(turnDeg(d0, d1));
    return { what, ok: kp > 1 / 45 && km < -1 / 45 && net < 25, txt: `${what}: tightest R ${(1 / kp).toFixed(0)} m, L ${(-1 / km).toFixed(0)} m, net ${net.toFixed(0)}°` };
  });
  check('turns: the four chicanes flick both ways (each way tighter than a 45 m radius) and leave the road as it was (within 25°)', CHI.every(c => c.ok), CHI.map(c => c.txt).join(' | '));
}
// 3. the places: the HUD's turns in order with the commentator's lines; the stadium, the swimming hall and the lake for the commentator only;
// no names of venues on the HUD
{
  const L = T.names, hud = L.filter(p => p.hud !== false);
  check('places: Turns 1, 2, 3, 6, 7, 9, 10, 14, 15, 16 and 20 on the HUD in order along the lap, three lines each; the venues for the commentator only',
    hud.map(p => p.n).join() === 'Zavoj 1,Zavoj 2,Zavoj 3,Zavoj 6,Zavoj 7,Zavoj 9,Zavoj 10,Zavoj 14,Zavoj 15,Zavoj 16,Zavoj 20' && hud.every((p, k) => k === 0 || p.d > hud[k - 1].d) && L.every(p => p.say && p.say.length === 3) && L.length - hud.length === 3,
    hud.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
}
// 4. the pits: the lane on the right of the start straight (where grandstand 1 faced them), from after the last corner to before Turn 1, the
// player's box on it; grandstand 1 on the left of the straight across from them
{
  const P = def.pit, mid = T.pitAt(T.startS), entry = T.pitAt(T.startS + P[1] + 2), box = T.pitAt(T.startS + P[3]), t20 = 3130 - T.len, t1 = 154;
  check('pits: the lane on the right of the start straight, from after Turn 20 to before Turn 1, the player\'s box on it',
    P[0] > 0 && P[1] > t20 && P[2] < t1 && mid && !mid.gap && mid.o > T.w + 5 && entry && box && !box.gap, `lane ${P[1]} .. ${P[2]} m (Turn 20 at ${Math.round(t20)}, Turn 1 at ${t1}), ${mid && mid.o.toFixed(1)} m to the right`);
  const g1 = def.stands[0];
  check('pits: grandstand 1 on the left of the start straight across from them, with a roof', g1[2] === -1 && g1[0] < 0 && g1[1] > 0 && g1[4] === 1, JSON.stringify(g1));
}
// 5. the junctions and their furniture: the side roads (the arms straight on at the corners too) open the barrier into their mouths; the
// furniture of the generic knockable kinds (signals on poles with arms over the road, signs, bollards, bins, hydrants, cabinets, lamps,
// bus shelters, guard railings), every piece inside the barriers and off the asphalt; signals at the bigger junctions
const props = def.furniture.map(([d, sd, kind, l, face, col, j]) => { const s = T.startS + d, i = T.idx(s); return { kind, x: T.px[i] + T.nx[i] * sd * l, z: T.pz[i] + T.nz[i] * sd * l, yaw: T.hd[i], col, i, j }; });
{
  const kinds = new Set(props.map(p => p.kind)), need = ['signal', 'sign', 'bollard', 'bin', 'hydrant', 'cabinet', 'lamp', 'shelter', 'railing'];
  const q = {}; let out = 0, onRoad = 0;
  for (const p of props) { T.query(p.x, p.z, p.i, q); const bar = q.d > 0 ? q.br : q.bl; if (Math.abs(q.d) > bar - 0.4) out++; if (Math.abs(q.d) < T.w + 0.5) onRoad++; }
  const sig = def.junctions.filter(j => j[4] === 'sig').length, mouths = def.junctions.every(([d, sd]) => { const i = at(d); return (sd > 0 ? T.br[i] : T.bl[i]) > T.w + 8; });
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], phys: 'cs', seed: 3 }); r.setProps(props, null);
  check('junctions: 20 or more, the barrier open into every mouth, traffic signals at 12 or more of them',
    def.junctions.length >= 20 && mouths && sig >= 12, `${def.junctions.length} junctions, ${sig} with signals, mouths ${mouths ? 'open' : 'NOT open'}`);
  check('junctions: their furniture of all the generic knockable kinds (signal, sign, bollard, bin, hydrant, cabinet, lamp, shelter, railing), Core takes every piece',
    need.every(k => kinds.has(k)) && r.props.length === props.length && props.length >= 150, `${props.length} pieces (${[...kinds].join(', ')}), Core ${r.props.length}`);
  check('junctions: every piece inside the barriers and off the asphalt', !out && !onRoad, `${out} outside the barriers, ${onRoad} on the asphalt`);
}
// 6. driven into a junction's furniture: a car at ~60 km/h steered into the signal pole and the lamp on a corner of the avenue's mouth: they
// break off and fly, the car drives on (a little slower, a little damage, nowhere near a wall's)
{
  const o2 = Math.random; Math.random = seeded(31);
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], phys: 'cs', seed: 3, damage: 2, assist: 0 }), P = r.player; r.start(); P.locked = false;
  const J = def.junctions.findIndex(j => j[0] === 758 && j[1] === 1), pieces = props.filter(p => p.j === J);
  r.setProps(pieces, null);
  const tgt = r.props.find(b => b.kind === 'signal'), tgt0 = [tgt.x, tgt.z], i0 = at(700), aim = () => Math.atan2(tgt0[1] - P.z, tgt0[0] - P.x);
  P.place(T.px[i0] + T.nx[i0] * 3, T.pz[i0] + T.nz[i0] * 3, T.hd[i0]); P.vx = Math.cos(P.h) * 19.5; P.vz = Math.sin(P.h) * 19.5;
  let v0 = 0, vMin = 1e9, hit = false, t = 0, wall = 0;
  for (; t < 6; t += DT) {
    const dist = Math.hypot(tgt0[0] - P.x, tgt0[1] - P.z);
    if (!hit) { let e = aim() - P.h; e = Math.atan2(Math.sin(e), Math.cos(e)); P.inSteer = Math.max(-1, Math.min(1, e * 2.5)); P.inThr = P.speed < 19.5 ? 1 : 0; P.inBrk = 0; v0 = P.speed; if (dist < 1.6) hit = true; }
    else { P.inSteer = 0; P.inThr = 0.3; P.inBrk = 0; vMin = Math.min(vMin, P.speed); if (t > 4) break; }
    P.hitWall = 0; r.step(DT); if (P.hitWall > 3) wall++;
  }
  const moved = Math.hypot(tgt.x - tgt0[0], tgt.z - tgt0[1]), knocked = r.props.filter(b => !b.sleep || Math.hypot(b.vx, b.vz) > 0.1).length + r.props.filter(b => Math.abs(b.qw) < 0.95).length;
  Math.random = o2;
  check('furniture: a car at ~60 km/h into the signal pole on the corner of a junction knocks it over and drives on (above 40 km/h), a little damage (under 15 %)',
    hit && (moved > 1 || Math.abs(tgt.qw) < 0.9) && vMin > 11 && P.dmg < 0.15 && P.dmg > 0 && !wall,
    `hit ${hit}, the pole moved ${moved.toFixed(1)} m (tilt qw ${tgt.qw.toFixed(2)}), ${knocked} pieces disturbed, speed ${(v0 * 3.6).toFixed(0)} -> min ${(vMin * 3.6).toFixed(0)} km/h, damage ${(P.dmg * 100).toFixed(1)} %, wall hits ${wall}`);
}
// 7. a whole race: 12 AI cars and the player on the autopilot, 4 laps, every car to the finish without a rescue; in the rain slower (2-20 %)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 4, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
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
  check('race in the dry: all 13 cars to the finish, the player without a rescue; the winner\'s 4 laps 5-12 minutes',
    d.n === 13 && d.of === 13 && !d.resc && !d.nan && d.win > 300 && d.win < 720, `${d.n}/${d.of} finished, winner ${d.win && d.win.toFixed(1)} s, last ${d.last && d.last.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 cars to the finish, the player without a rescue, the winner 2-20 % slower than in the dry',
    w.n === 13 && w.of === 13 && !w.resc && !w.nan && w.win / d.win > 1.02 && w.win / d.win < 1.2, `${w.n}/${w.of} finished, winner ${w.win && w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
