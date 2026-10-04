// Diriyah, Saudi Arabia: the street circuit by At-Turaif (layout of 2021-2024, 2.495 km in the record books, 21 turns, clockwise), laid on the
// streets of OpenStreetMap (an approximation: 2.30 km). The track (a closed circuit of 6 laps, the name a place and its country, its length
// against the record books', clockwise), the turns the descriptions place, in order and each its way (Turn 1 left, 14 right at 90 degrees, 15 a
// kink, 17 right, 18 right, 19 left, 21 right), the start line on the straight before Turn 18 with the pit lane on its right, the junctions
// (the walls set back into the side streets' mouths), the street furniture there knocked over by a car that drives on (a little slower, a
// little damage), and a whole race of 12 AI cars and the player on the autopilot in the dry and in the rain, every car to the finish.
//   node tests/diriyah.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'diriyah'), T = new C.Track(def);
const at = (d) => T.idx(T.startS + d);
const turnDeg = (a, b) => { let t = 0; for (let d = a; d < b; d += T.ds) t += T.k[at(d)] * T.ds; return t * 180 / Math.PI; };

// 1. the track: a closed street circuit, 6 laps, a place name; its length against the record books' 2.495 km; clockwise
{
  let turn = 0; for (let i = 0; i < T.N; i++) turn += T.k[i] * T.ds;
  check('track: Diriyah, Saudova Arabija (Diriyah, Saudi Arabia), a closed circuit of 6 laps, not a test track, in the big championship',
    def.name === 'Diriyah, Saudova Arabija' && def.en && def.en.name === 'Diriyah, Saudi Arabia' && !def.open && !def.test && def.laps === 6 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('diriyah'),
    `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
  check('track: the lap on the streets 2.25-2.35 km (the record books\' 2.495 km: an approximation, 6-10 % short), the menu\'s real length 2.495 km, clockwise',
    T.len > 2250 && T.len < 2350 && def.realKm === 2.495 && Math.abs(turn - 2 * Math.PI) < 0.05, `${T.len.toFixed(1)} m (${((T.len / 2495 - 1) * 100).toFixed(1)} %), total turn ${(turn * 180 / Math.PI).toFixed(1)} deg`);
  const hmax = Math.max(...T.hy), hmin = Math.min(...T.hy); let g = 0; for (let i = 0; i < T.N; i++) g = Math.max(g, Math.abs(T.grade[i]));
  check('heights: the start line the zero, the wadi\'s side 10-16 m lower (the bobsleigh run), no grade over 9 %', Math.abs(T.hy[T.startIdx]) < 0.3 && hmin < -10 && hmin > -16 && hmax < 6 && g < 0.09,
    `lowest ${hmin.toFixed(1)} m, highest ${hmax.toFixed(1)} m, steepest ${(g * 100).toFixed(1)} %`);
}
// 2. the turns the descriptions place: in order along the lap (from Turn 1), each its way, within its stretch (degrees: + right, - left)
{
  const REAL = { 1: [390, 460, -1, 30, 80], 14: [1290, 1350, 1, 50, 100], 15: [1355, 1400, 1, 12, 50], 17: [2150, 2215, 1, 70, 115], 18: [110, 170, 1, 30, 80], 19: [170, 215, -1, 30, 80], 21: [320, 385, 1, 40, 95] };
  const res = def.turnsD.map(([num, d, dir]) => { const [a, b, rd, lo, hi] = REAL[num], deg = turnDeg(a, b); return { num, d, deg, ok: dir === rd && Math.sign(deg) === rd && Math.abs(deg) >= lo && Math.abs(deg) <= hi && d >= a && d <= b }; });
  const lap = (d) => (d - 424 + T.len) % T.len, ord = def.turnsD.map(t => [t[0], lap(t[1])]).sort((a, b) => a[1] - b[1]).map(t => t[0]);
  check('turns: 1 left, 14 right (~90), 15 a right kink, 17 right, 18 right, 19 left, 21 right, each on its stretch', res.every(r => r.ok), res.map(r => `T${r.num} ${r.deg > 0 ? 'R' : 'L'} ${Math.abs(r.deg).toFixed(0)}°`).join(', '));
  check('turns: in their order round the lap from Turn 1 (1, 14, 15, 17, 18, 19, 21)', ord.join() === '1,14,15,17,18,19,21', ord.join(' '));
  let rights = 0, lefts = 0; for (const c of T.corners) (c.dir > 0 ? rights++ : lefts++);
  check('turns: more rights than lefts (the record books: 12 right, 9 left)', rights > lefts && rights + lefts >= 14, `${rights} right, ${lefts} left of ${T.corners.length} found`);
  const L = T.names.filter(p => p.hud);
  check('places: Turns 18, 21, 1, 14, 17 on the HUD in lap order, the commentator\'s lines for every place (numbers only)', L.map(p => p.n).join() === 'Zavoj 18,Zavoj 21,Zavoj 1,Zavoj 14,Zavoj 17' && T.names.every(p => p.say && p.say.length === 3),
    T.names.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
}
// 3. the start line on the straight between Turns 17 and 18, the pit lane on its right across the line (the garages' side)
{
  const P = def.pit, mid = T.pitAt(T.startS + P[3]);
  check('pits: the lane on the right of the start straight, across the start line, between Turn 17 and Turn 18; the player\'s box in it',
    P[0] > 10 && P[1] < 0 && P[2] > 0 && P[1] > 2182 - T.len && P[2] < 144 && mid && !mid.gap && mid.o > T.w + 4, `lane ${P[1]} .. ${P[2]} m, ${P[0]} m to the right, box at ${P[3]} m`);
  const st = Math.abs(turnDeg(-60, 60));
  check('start: the line on a straight (less than 6 degrees within 60 m)', st < 6, `${st.toFixed(1)} deg`);
}
// 4. the junctions: the walls set back into the side streets' mouths (escape roads) on the side of the street; elsewhere close to the road
{
  const J = def.junc, deep = J.map(([d, sd]) => { const i = at(d); return (sd > 0 ? T.br[i] : T.bl[i]) - T.w; });
  let near = 0, tot = 0; for (let i = 0; i < T.N; i += 3) { tot++; if (Math.min(T.bl[i], T.br[i]) - T.w < 4.5) near++; }
  check('junctions: at least 8 on the lap, the walls 9-14 m back in each mouth (an escape road into the street)', J.length >= 8 && deep.every(d => d > 8.5 && d < 14.5), deep.map(d => d.toFixed(1)).join(' '));
  check('walls: close to the road elsewhere (a street circuit: within 4.5 m of the asphalt on one side at most samples)', near / tot > 0.7, `${(near / tot * 100).toFixed(0)} % of samples`);
}
// 5. the street furniture of a junction: every kind knocked over by a car at 70 km/h; the car drives on (a little slower, a little damage)
{
  const KINDS = ['signal', 'lamp', 'sign', 'bollard', 'bin', 'hydrant', 'cabinet', 'shelter', 'cone'], out = [];
  const J = def.junc.filter(([d]) => { let m = 0; for (let e = -60; e <= 90; e += 2) m = Math.max(m, Math.abs(T.k[at(d + e)])); return m < 1 / 110; });   // (the junctions on the straights)
  for (const kind of KINDS) {
    const o2 = Math.random; Math.random = seeded(91);
    const [dj, sd] = J[KINDS.indexOf(kind) % J.length], i = at(dj), w = T.w;
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 5, difficulty: 1, damage: 2 }), P = r.player; r.start(); P.locked = false;
    const lat = sd * (w + 0.35), px = T.px[i] + T.nx[i] * lat, pz = T.pz[i] + T.nz[i] * lat;   // at the corner of the mouth, just past the asphalt's edge
    r.setProps([{ kind, x: px, z: pz, yaw: T.hd[i], i }], null);
    const b = r.props[0], x0 = b.x, z0 = b.z;
    const j = at(dj - 30), sx = T.px[j] + T.nx[j] * sd * (w - 0.8), sz = T.pz[j] + T.nz[j] * sd * (w - 0.8), h = Math.atan2(pz - sz, px - sx);   // along the lap by its edge, straight at it
    P.place(sx, sz, h); P.y = P.py = T.hy[j]; P.roadY = P.y; P.vx = Math.cos(h) * 19.5; P.vz = Math.sin(h) * 19.5; P.dmg = 0;
    let hitT = -1, vHit = 0, vAfter = 0, wall = 0;
    for (let k = 0; k < 120 * 3; k++) { const t = k * DT; if (hitT < 0) { P.inThr = P.speed < 19.5 ? 0.5 : 0; P.inBrk = 0; P.inSteer = 0; P.inHand = 0; } else C.aiControl(P, r, DT); P.hitWall = 0; r.step(DT);
      if (P.hitWall > 0.3) wall++;
      if (hitT < 0 && Math.hypot(b.x - x0, b.z - z0) > 0.2) { hitT = t; vHit = P.speed; }
      if (hitT >= 0 && t - hitT < 0.3) vAfter = Math.min(vAfter || 1e9, P.speed); if (hitT >= 0 && t - hitT > 1.5) break; }
    const moved = Math.hypot(b.x - x0, b.z - z0);
    Math.random = o2;
    out.push({ kind, ok: hitT >= 0 && moved > 0.8 && vAfter > vHit * 0.8 && P.dmg < 0.05 && !wall, txt: `${kind}: ${hitT >= 0 ? 'hit' : 'missed'}, moved ${moved.toFixed(1)} m, ${(vHit * 3.6).toFixed(0)} -> ${(vAfter * 3.6).toFixed(0)} km/h, damage ${(P.dmg * 100).toFixed(1)} %${wall ? ', wall' : ''}` });
  }
  check('junction furniture: traffic lights, lamps, signs, bollards, bins, hydrants, cabinets, bus shelters and cones knocked over at 70 km/h, the car on its way (at least 80 % of its speed, under 5 % damage, back on the road without touching a wall)',
    out.every(o => o.ok), out.map(o => o.txt).join(' | '));
}
// 6. a whole race: 12 AI cars and the player on the autopilot, 6 laps, every car to the finish without a rescue; in the rain slower (2-20 %)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 6, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
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
  check('race in the dry: all 13 cars to the finish, the player without a rescue; the winner\'s 6 laps 5-8 minutes',
    d.n === 13 && d.of === 13 && !d.resc && !d.nan && d.win > 300 && d.win < 480, `${d.n}/${d.of} finished, winner ${d.win && d.win.toFixed(1)} s, last ${d.last && d.last.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 cars to the finish, the player without a rescue, the winner 2-20 % slower than in the dry',
    w.n === 13 && w.of === 13 && !w.resc && !w.nan && w.win / d.win > 1.02 && w.win / d.win < 1.2, `${w.n}/${w.of} finished, winner ${w.win && w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
