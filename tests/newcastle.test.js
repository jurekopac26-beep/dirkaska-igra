// Newcastle, New South Wales: the street circuit in the East End in its layout of 2019 (2.641 km, 14 turns, anticlockwise), on the streets of
// OpenStreetMap. The track (a closed circuit at full scale, the length within 1 % of the official, 5 laps, in the big championship), the
// heights (the harbour front, Watt Street up at 1 in 22 to Turn 2, down along the esplanade, up to Nobbys Road, down to the hairpin), the 14
// turns in order and each its way, the pits on the harbour side of the pit straight, the pockets in the walls at the street junctions, the
// street furniture of the junctions (traffic signals, signs, lamps, bins, bollards, cabinets) knocked over by a car that drives on, and a whole
// race of 12 AI cars and the player on the autopilot, in the dry and in the rain, every car to the finish.
//   node tests/newcastle.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'newcastle'), T = new C.Track(def);
const dS = (s) => { const L = T.len; return ((s - T.startS) % L + L) % L; };   // metres from the start line along the lap (0 .. L)
const at = (d) => T.idx(T.startS + d);

// 1. the track: a closed circuit of 5 laps, 2.641 km within 1 %, anticlockwise, in the big championship; a place name only
{
  let turn = 0; for (let i = 0; i < T.N; i++) turn += T.k[i] * T.ds;
  check('track: Newcastle, Avstralija (Newcastle, Australia), a closed circuit of 5 laps, not a test track, in the big championship',
    def.name === 'Newcastle, Avstralija' && def.en && def.en.name === 'Newcastle, Australia' && !def.open && !def.timeTrial && !def.test && def.laps === 5 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('newcastle'),
    `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
  check('track: 2.641 km within 1 %, the menu\'s real length 2.641 km, anticlockwise (one full turn to the left)',
    Math.abs(T.len / 2641 - 1) < 0.01 && def.realKm === 2.641 && Math.abs(turn + 2 * Math.PI) < 0.05,
    `${T.len.toFixed(1)} m (${((T.len / 2641 - 1) * 100).toFixed(2)} %), total turn ${(turn * 180 / Math.PI).toFixed(1)} deg`);
  check('track: a street circuit (footpaths past the kerbs, no gravel), no crossover, a world without birds, the Australian signals',
    def.offSurface === 'paving' && def.noGravel && !(T.cross && T.cross.length) && def.noBirds && def.propRegion === 'au', '');
}
// 2. the heights: the harbour front low (2-4 m), Watt Street up at about 1 in 22 to Turn 2 (24-27 m, the top of the lap), down along the
// esplanade to the beach's roundabout (Turn 7, 9-13 m), up to Nobbys Road (15-19 m), the fast run down past the fort to the hairpin (1.5-3.5 m);
// no grade over 7 %
{
  const h = (d) => T.hy[at(d)]; let g = 0; for (let i = 0; i < T.N; i++) g = Math.max(g, Math.abs(T.grade[i]));
  let iMax = 0; for (let i = 0; i < T.N; i++) if (T.hy[i] > T.hy[iMax]) iMax = i; const dMax = dS(iMax * T.ds), watt = (h(740) - h(270)) / 470;
  check('heights: the pit straight 2-4 m, Watt Street up at 1 in 22 (4-5.5 %), the top at Turn 2 (24-27 m), the roundabout at Turn 7 9-13 m, Nobbys Road 15-19 m, the hairpin 1.5-3.5 m',
    h(0) > 2 && h(0) < 4 && watt > 0.04 && watt < 0.055 && T.maxElev > 24 && T.maxElev < 27 && dMax > 700 && dMax < 830 && h(1204) > 9 && h(1204) < 13 && h(1560) > 15 && h(1560) < 19 && h(2115) > 1.5 && h(2115) < 3.5,
    `start ${h(0).toFixed(1)} m, Watt Street ${(watt * 100).toFixed(1)} %, top ${T.maxElev.toFixed(1)} m at ${Math.round(dMax)} m, T7 ${h(1204).toFixed(1)}, Nobbys Road ${h(1560).toFixed(1)}, hairpin ${h(2115).toFixed(1)} m`);
  check('heights: no grade over 7 %', g < 0.07, `steepest ${(g * 100).toFixed(1)} %`);
}
// 3. the 14 turns in order and each its way (degrees: + right, - left), each number board on its turn
{
  const turnDeg = (a, b) => { let t = 0; for (let d = a; d < b; d += T.ds) t += T.k[at(((d % T.len) + T.len) % T.len)] * T.ds; return t * 180 / Math.PI; };
  const REAL = [   // [the stretch of the lap (m from the start line), the direction (+1 right, -1 left), degrees min, max]
    [200, 300, -1, 35, 65],      // Turn 1: left off the harbour front into Watt Street (over the light rail)
    [720, 790, -1, 80, 110],     // Turn 2: the tight left at the top of Watt Street onto the esplanade
    [790, 870, -1, 30, 60],      // Turn 3: left, the view down to the beach
    [870, 940, 1, 15, 45],       // Turn 4: right
    [940, 1020, -1, 15, 50],     // Turn 5: left
    [1040, 1150, 1, 40, 70],     // Turn 6: right (the staircase: 6, 7, 8)
    [1160, 1250, -1, 60, 90],    // Turn 7: left at the roundabout in front of Newcastle Beach
    [1280, 1370, 1, 75, 100],    // Turn 8: right into Scott Street
    [1380, 1470, -1, 65, 100],   // Turn 9: left into Parnell Place
    [1520, 1600, -1, 8, 30],     // Turn 10: the fast kink onto Nobbys Road
    [2060, 2150, -1, 80, 150],   // Turn 11: the hairpin in the car park (with Turn 12: the 180 degrees)
    [2150, 2220, -1, 20, 80],    // Turn 12: left out of the hairpin
    [2270, 2320, 1, 12, 40],     // Turn 13: right on the beach road
    [2320, 2400, 1, 60, 95],     // Turn 14: right onto Wharf Road, the pit straight
  ];
  const ds = def.turns.map(([x, z]) => dS(T.nearestIdx(x, z) * T.ds));
  const res = REAL.map(([a, b, dir, lo, hi], k) => { const deg = turnDeg(a, b); return { k: k + 1, deg, ok: Math.sign(deg) === dir && Math.abs(deg) >= lo && Math.abs(deg) <= hi && ds[k] >= a && ds[k] <= b }; });
  check('turns: fourteen number boards in order along the lap, each on its stretch',
    def.turns.length === 14 && ds.every((d, k) => k === 0 || d > ds[k - 1]), ds.map((d, k) => `${k + 1}@${Math.round(d)}`).join(' '));
  check('turns: 1 L, 2 L, 3 L, 4 R, 5 L, 6 R, 7 L, 8 R, 9 L, 10 L, 11 L (the hairpin), 12 L, 13 R, 14 R',
    res.every(r => r.ok), res.map(r => `T${r.k} ${r.deg > 0 ? 'R' : 'L'} ${Math.abs(r.deg).toFixed(0)}°${r.ok ? '' : '!'}`).join(', '));
  const hp = turnDeg(2060, 2220);
  check('turns: the hairpin (Turns 11-12) turns the car round (150-200 degrees left)', hp < -150 && hp > -200, `${hp.toFixed(0)}°`);
  let near = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 60; j < T.N - 60 + i && j < T.N; j += 2) near = Math.min(near, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]));
  check('turns: the legs of the hairpin and the streets apart (at least 25 m between any two parts of the lap)', near >= 25, `nearest legs ${near.toFixed(1)} m apart`);
}
// 4. the places: the turns by their numbers and Newcastle Beach in order, with the commentator's lines; place names only
{
  const L = T.names, hud = L.filter(p => p.hud);
  check('places: Turns 1, 2, Newcastle Beach, Turns 7, 8, 9, 10, 11 and 14 on the screen in order along the lap, the commentator\'s lines for every place',
    hud.map(p => p.n).join() === 'Zavoj 1,Zavoj 2,Plaža Newcastle,Zavoj 7,Zavoj 8,Zavoj 9,Zavoj 10,Zavoj 11,Zavoj 14' && L.every((p, k) => k === 0 || p.d > L[k - 1].d) && L.every(p => p.say && p.say.length >= 2),
    L.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
}
// 5. the pits: on the right of the pit straight (the harbour side), from after Turn 14 to before Turn 1, the boxes either side of the start line
{
  const p = def.pit, pz = T.pitAt(T.startS);
  check('pits: the lane on the right of Wharf Road (the harbour side), from after Turn 14 to before Turn 1, the 13 boxes either side of the start line',
    p[0] > 12 && p[0] < 22 && p[1] < -200 && p[1] > 2370 - T.len && p[2] > 100 && p[2] < 210 && pz && pz.o > 12 && def.pitRow[0] < 0 && def.pitRow[1] > 0,
    `lane ${p[1]} .. ${p[2]} m, ${p[0]} m to the right, boxes ${def.pitRow.join(' .. ')} m`);
}
// 6. the junctions: the walls stand back at the mouths of the streets that meet the circuit (Scott, Hunter and King Streets across Watt Street
// on both sides, the esplanade at Turn 7, Scott Street at Turns 8 and 9): their corners (the signals, the signs, the bollards) within reach
{
  const P = (def.wide || []).filter(w => w[3] === 4.5), has = (d, side) => P.some(([a, b, sd]) => sd === side && d >= a - 2 && d <= b + 2);
  const want = [[390, -1], [390, 1], [484, -1], [484, 1], [596, -1], [596, 1], [1207, 1], [1319, -1], [1427, 1]];
  check('junctions: pockets in the walls at the side streets (Watt Street at Scott, Hunter and King Streets both sides, the roundabout, Scott Street at Turns 8 and 9)',
    P.length >= 12 && want.every(([d, sd]) => has(d, sd)) && want.every(([d, sd]) => { const i = at(d); return (sd > 0 ? T.br[i] : T.bl[i]) > T.w + 5.5; }),
    `${P.length} pockets; ` + want.map(([d, sd]) => `${d}${sd > 0 ? 'R' : 'L'} ${((sd > 0 ? T.br[at(d)] : T.bl[at(d)]) - T.w).toFixed(1)} m`).join(', '));
}
// 7. the street furniture can be knocked over: the generic kinds (traffic signals on a post and on a mast arm, lamps, signs, bins, cabinets,
// bollards, bus shelters, drums) standing in the junction on Watt Street at Hunter Street; a car driven through them on the autopilot knocks
// them flying, slows a little, takes a little damage and drives on
{
  const KINDS = ['signal', 'signalm', 'lamp', 'sign', 'hydrant', 'bin', 'cabinet', 'bollard', 'shelter', 'barrel'];
  const orig = Math.random; Math.random = seeded(7);
  try {
    const r = new C.Race(T, { numAI: 0, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 3, difficulty: 1 });
    r.start(); const P = r.player;
    // the props across the racing line ahead of the car on Watt Street (the climb from Turn 1 to the Hunter Street junction)
    const list = [];
    KINDS.forEach((kind, k) => { const d = 400 + k * 9, i = at(d), o = T.rl[i] + (k % 2 ? 0.8 : -0.8); list.push({ kind, x: T.px[i] + T.nx[i] * o, z: T.pz[i] + T.nz[i] * o, yaw: T.hd[i] + Math.PI / 2, i }); });
    r.setProps(list, null);
    const props = r.props.slice(), p0 = props.map(b => [b.x, b.z]);
    let t = 0, k = 0, vMin = 1e9, vAt = 0;
    const dd = () => dS(P.q ? P.q.s : 0);
    while (t < 120 && !(dd() > 600 && dd() < 1200)) {
      Math.random = seeded(9000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT;
      const d = dS(P.q ? P.q.s : 0); if (d > 380 && d < 520) { vMin = Math.min(vMin, P.speed); vAt = Math.max(vAt, P.speed); }
    }
    const moved = props.filter((b, j) => Math.hypot(b.x - p0[j][0], b.z - p0[j][1]) > 1.0).map(b => b.kind);
    check('street furniture: every generic kind is a knockable prop (Core: signal, signalm, lamp, sign, hydrant, bin, cabinet, bollard, shelter, barrel)',
      props.length === KINDS.length && KINDS.every(kd => props.some(b => b.kind === kd)), props.map(b => b.kind).join(', '));
    check('street furniture: a car driven through them on Watt Street knocks most of them flying and drives on to Turn 2 (not stopped, a little damage)',
      moved.length >= 6 && dd() >= 600 && dd() < 1200 && vMin > 8 && P.dmg < 0.5 && !(P.stuckT > 1),
      `${moved.length} of ${props.length} knocked (${moved.join(', ')}), slowest ${(vMin * 3.6).toFixed(0)} km/h, damage ${P.dmg.toFixed(2)}, at ${Math.round(dd())} m after ${t.toFixed(1)} s`);
  } finally { Math.random = orig; }
}
// 8. a whole race: 12 AI cars and the player on the autopilot, 5 laps, every car to the finish without a rescue; in the rain slower (2-20 %)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
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
  check('race in the dry: all 13 cars to the finish, the player without a rescue; the winner\'s 5 laps 4-9 minutes',
    d.n === 13 && d.of === 13 && !d.resc && !d.nan && d.win > 240 && d.win < 540, `${d.n}/${d.of} finished, winner ${d.win && d.win.toFixed(1)} s, last ${d.last && d.last.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 cars to the finish, the player without a rescue, the winner 2-20 % slower than in the dry',
    w.n === 13 && w.of === 13 && !w.resc && !w.nan && w.win / d.win > 1.02 && w.win / d.win < 1.2, `${w.n}/${w.of} finished, winner ${w.win && w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
