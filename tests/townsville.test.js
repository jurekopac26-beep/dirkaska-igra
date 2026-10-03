// Townsville, Queensland: the street circuit through Reid Park and the streets beside it (the layout raced since 2009: 2.86 km, 13 turns,
// clockwise), from OpenStreetMap. The track (its name, a closed circuit of 5 laps in the big championship, the length within 1 % of the
// official 2.860 km, clockwise, flat: the town is ~3 m above the sea), its 13 turns in order and each its way (Turn 1 the fast right kink,
// Turn 2 the tight right through the junction, the chicane of Turns 7 and 8 left-right, the hairpin of Turn 11 after the back straight,
// Turn 13 left onto Boundary Street), the start straight (~650 m from Turn 13 to Turn 1), the pits on the right of it where the garages
// are, the bridge over Ross Creek, the junctions (the barriers set back into the side roads' mouths), a whole race of 12 AI cars and the
// player on the autopilot in the dry and in the rain (every car to the finish), and the street furniture in a junction: the car knocks
// the signals, the signs, the bollards, the bin, the cabinet and the street light over and drives on.
//   node tests/townsville.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'townsville'), T = new C.Track(def);
const dOf = (i) => { const L = T.len; return ((i * T.ds - T.startS) % L + L) % L; };   // metres from the start line along the lap (0 .. L)
const at = (d) => T.idx(T.startS + d), sAt = (d) => T.startS + d;
const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// 1. the track: Townsville, Australia, a closed circuit of 5 laps in the big championship, 2.860 km within 1 %, clockwise, flat
{
  let turn = 0; for (let i = 0; i < T.N; i++) turn += T.k[i] * T.ds;
  check('track: Townsville, Avstralija (Townsville, Australia), a closed circuit of 5 laps, not a test track, in the big championship, no birds, tropical',
    def.name === 'Townsville, Avstralija' && def.en && def.en.name === 'Townsville, Australia' && !def.open && !def.timeTrial && !def.test && def.laps === 5 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('townsville') && def.noBirds && def.tropical,
    `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
  check('track: 2.860 km within 1 %, the menu\'s real length 2.86 km, clockwise (one full turn to the right)',
    Math.abs(T.len / 2860 - 1) < 0.01 && def.realKm === 2.86 && Math.abs(turn - 2 * Math.PI) < 0.05,
    `${T.len.toFixed(1)} m (${((T.len / 2860 - 1) * 100).toFixed(2)} %), total turn ${(turn * 180 / Math.PI).toFixed(1)} deg`);
  let g = 0; for (let i = 0; i < T.N; i++) g = Math.max(g, Math.abs(T.grade[i]));
  check('track: flat (within 2.6 m of the start line\'s height, the bridge over Ross Creek a little higher), no grade over 4.5 % (the bridge\'s ramps), no crossover',
    Math.max(...T.hy) < 3.5 && Math.min(...T.hy) > -2.6 && g < 0.045 && !(T.cross && T.cross.length), `heights ${Math.min(...T.hy).toFixed(1)} .. ${Math.max(...T.hy).toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 2. the 13 turns in order and each its way: the turn numbers' boards (def.turns) in order along the lap, the road turning their way round
// each (degrees: + right, - left) within its stretch of the lap
{
  const turnDeg = (a, b) => { let t = 0; for (let d = a; d < b; d += T.ds) t += T.k[at(d)] * T.ds; return t * 180 / Math.PI; };
  const REAL = [   // [the stretch of the lap (m from the start line), the direction (+1 right, -1 left), degrees min, max]
    [300, 390, 1, 8, 30],       // Turn 1: the fast kink on Boundary Street (over the arm of Ross Creek)
    [600, 680, 1, 100, 140],    // Turn 2: the tight right through the junction onto Charters Towers Road
    [940, 1000, 1, 70, 105],    // Turn 3: right off the road into the park, by the railway station
    [1090, 1135, 1, 8, 30],     // Turn 4: a slight right
    [1240, 1320, -1, 35, 65],   // Turn 5: left
    [1370, 1430, 1, 35, 65],    // Turn 6: right
    [1640, 1695, -1, 50, 80],   // Turn 7: the chicane, left
    [1695, 1745, 1, 60, 95],    // Turn 8: the chicane, right
    [1765, 1810, 1, 25, 55],    // Turn 9: right
    [1850, 1960, 1, 25, 60],    // Turn 10: right, across Boundary Street
    [2200, 2265, 1, 110, 145],  // Turn 11: the hairpin after the back straight
    [2300, 2375, 1, 45, 75],    // Turn 12: right
    [2500, 2580, -1, 100, 145], // Turn 13: the sharp left onto Boundary Street
  ];
  const ds = def.turns.map(([x, z]) => dOf(T.nearestIdx(x, z)));
  const res = REAL.map(([a, b, dir, lo, hi], k) => { const deg = turnDeg(a, b); return { k: k + 1, deg, ok: Math.sign(deg) === dir && Math.abs(deg) >= lo && Math.abs(deg) <= hi && ds[k] >= a && ds[k] <= b }; });
  check('turns: thirteen number boards in order along the lap, each on its stretch',
    def.turns.length === 13 && ds.every((d, k) => k === 0 || d > ds[k - 1]) && res.every(r => r.ok), ds.map((d, k) => `${k + 1}@${Math.round(d)}`).join(' '));
  check('turns: 1 right (kink), 2 right (tight), 3 right, 4 right, 5 left, 6 right, 7-8 the chicane left-right, 9 and 10 right, 11 the hairpin right, 12 right, 13 the sharp left',
    res.every(r => r.ok), res.map(r => `T${r.k} ${r.deg > 0 ? 'R' : 'L'} ${Math.abs(r.deg).toFixed(0)}°`).join(', '));
  let tight = 1e9; for (let i = 0; i < T.N; i++) tight = Math.min(tight, 1 / Math.max(1e-6, Math.abs(T.k[i])));
  check('turns: no corner tighter than 10 m (the junction of Turn 2 and the hairpin rounded as driven)', tight >= 10, `tightest radius ${tight.toFixed(1)} m`);
  const hd = (d) => Math.atan2(T.tz[at(d)], T.tx[at(d)]); let dev = 0; for (let d = -250; d < 300; d += 10) dev = Math.max(dev, Math.abs(wrapPi(hd(d) - hd(-250))));
  check('the start straight: from Turn 13 to the kink of Turn 1 some 650 m (the record books: 672 m), straight within 5 degrees', ds[0] + (T.len - ds[12]) > 580 && ds[0] + (T.len - ds[12]) < 720 && dev * 180 / Math.PI < 5,
    `${(ds[0] + T.len - ds[12]).toFixed(0)} m from Turn 13 to Turn 1, heading within ${(dev * 180 / Math.PI).toFixed(1)} deg`);
}
// 3. the places: Turns 1, 2, 3, Ross Creek (the bridge), 5, 7, 10, 11 and 13 in order, the commentator's lines for each; numbers and places only
{
  const L = T.names;
  check('places: Turns 1, 2, 3, Ross Creek, Turns 5, 7, 10, 11, 13 in order along the lap, three commentator\'s lines each',
    L.map(p => p.n).join() === 'Zavoj 1,Zavoj 2,Zavoj 3,Ross Creek,Zavoj 5,Zavoj 7,Zavoj 10,Zavoj 11,Zavoj 13' && L.every((p, k) => k === 0 || p.d > L[k - 1].d) && L.every(p => p.say && p.say.length === 3),
    L.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
  const rc = L.find(p => p.n === 'Ross Creek'), db = rc.d + 18, i = at(db);
  check('places: the bridge over Ross Creek after Turn 3, a metre or so above the road on either side of it', rc.d > 1050 && rc.d < 1250 && T.hy[i] > T.hy[at(db - 120)] + 0.8 && T.hy[i] > T.hy[at(db + 120)] + 0.8,
    `@${Math.round(rc.d)} m, the deck ${T.hy[i].toFixed(1)} m (${T.hy[at(db - 120)].toFixed(1)} / ${T.hy[at(db + 120)].toFixed(1)} m 120 m either side)`);
}
// 4. the pits: the lane on the right of the start straight (between the track and the garages of the park), across the start line's
// approach; the garages; the player's box among them
{
  const P = def.pit, p = T.pitAt(sAt(P[3]));
  check('pits: the lane on the right of the start straight (the garages north of Boundary Street), from after Turn 13 to past the start line, the player\'s box in the row of garages',
    P[0] > 12 && P[1] < -250 && P[1] > -300 && P[2] > 0 && P[2] < 120 && P[3] > def.pitRow[0] && P[3] < def.pitRow[1] && p && p.o > 12 && !p.gap, JSON.stringify(P));
}
// 5. the junctions: the barriers set back into the side roads' mouths at least 5 m past the road's edge (the street furniture on their
// corners), at least 15 of them, among them the big junction of Turn 2 (its far legs) and Boundary Street's both legs at Turn 10
{
  const J = def.walls.filter(w => w[3] >= 6), deep = J.filter(([a, b, sd]) => { const i = at((a + b) / 2); return (sd > 0 ? T.br[i] : T.bl[i]) > T.wa[i] + 5; });
  const t2 = J.find(([a, b, sd, off]) => a < 640 && b > 640 && sd < 0 && off >= 20), t10 = J.filter(([a, b]) => a < 1910 && b > 1910);
  check('junctions: at least 15 side roads\' mouths inside the barriers (5 m and more past the road\'s edge), the big junction of Turn 2 (20 m and more) and both legs of Boundary Street at Turn 10',
    J.length >= 15 && deep.length === J.length && !!t2 && t10.length === 2, `${deep.length}/${J.length}, Turn 2 ${t2 ? t2[3] + ' m' : 'none'}, Turn 10 ${t10.length} legs`);
}
// 6. a whole race: 12 AI cars and the player on the autopilot, 5 laps, every car to the finish without a rescue; in the rain slower (2-25 %)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
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
  check('race in the dry: all 13 cars to the finish, the player without a rescue; the winner\'s 5 laps 5-9 minutes',
    d.n === 13 && d.of === 13 && !d.resc && !d.nan && d.win > 300 && d.win < 540, `${d.n}/${d.of} finished, winner ${d.win && d.win.toFixed(1)} s (${(d.win / 5).toFixed(1)} s a lap), last ${d.last && d.last.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 cars to the finish, the player without a rescue, the winner 2-25 % slower than in the dry',
    w.n === 13 && w.of === 13 && !w.resc && !w.nan && w.win / d.win > 1.02 && w.win / d.win < 1.25, `${w.n}/${w.of} finished, winner ${w.win && w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}
// 7. the street furniture in a junction: the corner of the side street before Turn 2 (inside its pocket) holds a signal post, a mast-arm
// signal, a give way sign, bollards, a bin, the signals' cabinet and a street light (loose props, as the world puts them there); the car
// steered through the corner knocks them over (they fly off their feet and fall), loses a little speed and a little damage and drives on
{
  const [a0, b0, sd] = def.walls.find(w => w[0] === 527), dm = (a0 + b0) / 2, i0 = at(dm), wi = T.wa[i0];
  const pt = (al, lat) => { const i = at(dm + al); return [T.px[i] + T.nx[i] * sd * lat, T.pz[i] + T.nz[i] * sd * lat, i]; };
  const KINDS = [['tlight', -6, 2.6], ['sign', -3.5, 3.4], ['bollard', -1.5, 2.4], ['signal', 0.5, 3.2], ['bin', 2.5, 2.8], ['cabinet', 4.5, 3.6], ['lamp', 6.5, 2.6]];
  const orig = Math.random; Math.random = seeded(7);
  try {
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 4, difficulty: 1, rain: 0 });
    r.setProps(KINDS.map(([kind, al, lat]) => { const [x, z, i] = pt(al, wi + lat); return { kind, x, z, yaw: 0, i }; }));
    const P0 = r.props.map(b => [b.kind, b.x, b.y, b.z]);
    check('junction: all seven kinds of the street furniture are loose props (Core\'s PROPK), standing inside the barriers off the asphalt', r.props.length === KINDS.length && r.props.every(b => { const q = T.query(b.x, b.z, b.qi, {}); return Math.abs(q.d) > wi + 1 && Math.abs(q.d) < (sd > 0 ? q.br : q.bl); }), r.props.map(b => b.kind).join(', '));
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0, mode = 'drive', vBefore = 0, vAfter = 0, dmg0 = 0, t1 = 0, hit = false;
    const [tx, tz] = pt(8, wi + 3);
    while (t < 300 && P.lap < 2) {
      Math.random = seeded(9000 + (++k));
      const dq = dOf(P.q.i);
      if (mode === 'drive' && P.lap === 1 && dq > dm - 140 && dq < dm - 20) mode = 'aim';
      if (mode === 'aim') {   // slow to ~60 km/h and drive along the corner through the furniture
        const [gx, gz] = pt(Math.max(-14, dq - dm) + 7, wi + 3), a = wrapPi(Math.atan2(gz - P.z, gx - P.x) - P.h);
        P.inSteer = Math.max(-1, Math.min(1, a * 2.5)); P.inThr = P.speed < 16 ? 0.7 : 0; P.inBrk = P.speed > 19 ? 1 : 0; P.inHand = 0;
        if (!hit && r.props.some((b, q) => Math.hypot(b.x - P0[q][1], b.z - P0[q][3]) > 0.3)) { hit = true; vBefore = P.speed; dmg0 = P.dmg || 0; t1 = t; }
        if (dq > dm + 9) { mode = 'drive'; vAfter = P.speed; }
      } else C.aiControl(P, r, DT);
      r.step(DT); t += DT;
      if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    }
    const down = r.props.filter((b, q) => Math.hypot(b.x - P0[q][1], b.z - P0[q][3]) > 0.8 && (b.y < P0[q][2] - 0.1 || Math.abs(b.qx) + Math.abs(b.qz) > 0.3));
    check('junction: the car knocks the street furniture over (at least five of the seven fly off their feet and fall)', hit && down.length >= 5, `${down.length} of ${r.props.length} down: ${down.map(b => b.kind).join(', ')}`);
    check('junction: the car loses a little speed (under 30 %) and a little damage, and drives on: the lap finished without a rescue',
      hit && vAfter > vBefore * 0.7 && (P.dmg || 0) - dmg0 < 0.3 && P.lap >= 2 && !resc, `${(vBefore * 3.6).toFixed(0)} -> ${(vAfter * 3.6).toFixed(0)} km/h, damage +${(((P.dmg || 0) - dmg0) * 100).toFixed(1)} %, lap ${P.lap}, ${resc} rescues`);
  } finally { Math.random = orig; }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
