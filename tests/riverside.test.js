// Riverside, California: the road circuit of 1957-1989 in its long layout of 1960 (3.275 miles = 5.271 km), traced from the USGS map of 1967.
// The track (a closed circuit at full scale, clockwise, the length within 0.5 % of the record books', the heights of the 1967 map's contours),
// its nine turns in order and each its way (Turn 1 a fast right, the esses right-left-right-left, the hairpins 6 right, 7 left and 8 right,
// the 180 degree Turn 9 after the long back straight), the places along the lap, the pits of 1966 where they were (the lane on the left of
// the main straight across the start line, behind its earth bank: scenery, the cars do not stop there) and the grandstand across from them,
// and a whole race of 12 AI cars and the player on the autopilot, in the dry and in the rain, every car to the finish.
//   node tests/riverside.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'riverside'), T = new C.Track(def);
const dS = (s) => { const L = T.len; let d = ((s - T.startS) % L + L) % L; return d; };   // metres from the start line along the lap (0 .. L)
const at = (d) => T.idx(T.startS + d);

// 1. the track: a closed circuit, 2 laps, its length the record books' 5.271 km within 0.5 %, clockwise, in the big championship
{
  let turn = 0; for (let i = 0; i < T.N; i++) turn += T.k[i] * T.ds;
  check('track: Riverside, ZDA (Riverside, USA), a closed circuit of 2 laps, not a test track, in the big championship',
    def.name === 'Riverside, ZDA' && def.en && def.en.name === 'Riverside, USA' && !def.open && !def.timeTrial && !def.test && def.laps === 2 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('riverside'),
    `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
  check('track: 5.271 km (3.275 miles) within 0.5 %, the menu\'s real length 5.271 km, clockwise (one full turn to the right)',
    Math.abs(T.len / 5271 - 1) < 0.005 && def.realKm === 5.271 && Math.abs(turn - 2 * Math.PI) < 0.05,
    `${T.len.toFixed(1)} m (${((T.len / 5271 - 1) * 100).toFixed(2)} %), total turn ${(turn * 180 / Math.PI).toFixed(1)} deg`);
  check('track: no crossover, no kerbs (none on the circuit of 1960), sand and dust past the edges (offSurface gravel)',
    !(T.cross && T.cross.length) && def.noCurbs && !T.curb.some(v => v) && def.offSurface === 'gravel', '');
}
// 2. the heights of the 1967 map: the start line the zero (1553 ft); up through the esses to the top at Turn 6 (34-36 m: 1666 ft), Turn 7 down
// in the dip (11-16 m: 1592 ft), Turn 8 up again (26-31 m: 1648 ft),
// the long back straight down the hill, Turn 9 and the main straight the lowest part; no grade steeper than 8 %
{
  const h = (d) => T.hy[at(d)], hmax = Math.max(...T.hy), hmin = Math.min(...T.hy); let iMax = 0; for (let i = 0; i < T.N; i++) if (T.hy[i] > T.hy[iMax]) iMax = i;
  let g = 0; for (let i = 0; i < T.N; i++) g = Math.max(g, Math.abs(T.grade[i]));
  const dMax = dS(iMax * T.ds);
  check('heights: the top at Turn 6 (34-36 m over the start line), Turn 7 down in the dip at 11-16 m, Turn 8 up at 26-31 m, the back straight falling, Turn 9 within 3 m of the start line',
    Math.abs(h(0)) < 0.3 && hmax > 34 && hmax < 36.5 && dMax > 1350 && dMax < 1700 && h(2150) > 11 && h(2150) < 16 && h(2900) > 26 && h(2900) < 31 && h(3400) > h(3800) && h(3800) > h(4300) && Math.abs(h(4800)) < 3 && hmin > -3,
    `start ${h(0).toFixed(1)} m, top ${hmax.toFixed(1)} m at ${Math.round(dMax)} m, T7 ${h(2150).toFixed(1)}, T8 ${h(2900).toFixed(1)}, back straight ${h(3400).toFixed(1)} > ${h(3800).toFixed(1)} > ${h(4300).toFixed(1)}, T9 ${h(4800).toFixed(1)} m, lowest ${hmin.toFixed(1)} m`);
  check('heights: no grade over 8 %', g < 0.08, `steepest ${(g * 100).toFixed(1)} %`);
}
// 3. the nine turns in order and each its way: the turn numbers' boards (def.turns) in order along the lap, the road turning their way round
// each (degrees: + right, - left), within its stretch of the lap
{
  const turnDeg = (a, b) => { let t = 0; for (let d = a; d < b; d += T.ds) t += T.k[at(d)] * T.ds; return t * 180 / Math.PI; };
  const REAL = [   // [the stretch of the lap (m from the start line), the direction (+1 right, -1 left), degrees min, max]
    [560, 770, 1, 35, 70],      // Turn 1: the fast right at the bend of the main straight, uphill
    [880, 1045, 1, 15, 40],     // Turn 2: the esses, right
    [1045, 1150, -1, 8, 30],    // Turn 3: left
    [1150, 1290, 1, 8, 30],     // Turn 4: right
    [1290, 1410, -1, 25, 50],   // Turn 5: left
    [1410, 1680, 1, 165, 200],  // Turn 6: the hairpin at the top, right
    [2040, 2300, -1, 160, 200], // Turn 7: the hairpin in the dip, the bottom of the V, left
    [2700, 3010, 1, 190, 230],  // Turn 8: the last hairpin, right (into the dogleg onto the back straight)
    [4660, 4990, 1, 165, 200],  // Turn 9: the 180 degrees after the long back straight, right, onto the main straight
  ];
  const ds = def.turns.map(([x, z]) => dS(T.nearestIdx(x, z) * T.ds));
  const res = REAL.map(([a, b, dir, lo, hi], k) => { const deg = turnDeg(a, b); return { k: k + 1, deg, ok: Math.sign(deg) === dir && Math.abs(deg) >= lo && Math.abs(deg) <= hi && ds[k] >= a && ds[k] <= b }; });
  check('turns: nine number boards in order along the lap, each on its stretch',
    def.turns.length === 9 && ds.every((d, k) => k === 0 || d > ds[k - 1]) && res.every(r => r.ok), ds.map((d, k) => `${k + 1}@${Math.round(d)}`).join(' '));
  check('turns: 1 right, the esses 2-5 right-left-right-left, the hairpins 6 right, 7 left, 8 right, 9 right (180 degrees)',
    res.every(r => r.ok), res.map(r => `T${r.k} ${r.deg > 0 ? 'R' : 'L'} ${Math.abs(r.deg).toFixed(0)}°`).join(', '));
  let near = 1e9; for (let i = 0; i < T.N; i += 2) for (let j = i + 60; j < T.N - 60 + i && j < T.N; j += 2) near = Math.min(near, Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]));
  const hd = (d) => Math.atan2(T.tz[at(d)], T.tx[at(d)]), dev = (() => { let m = 0; for (let d = 3150; d < 4640; d += 10) m = Math.max(m, Math.abs(Math.atan2(Math.sin(hd(d) - hd(3150)), Math.cos(hd(d) - hd(3150))))); return m * 180 / Math.PI; })();
  check('turns: the back straight straight for 1.49 km (from the dogleg after Turn 8 to Turn 9: within 3 degrees), the legs of the hairpins apart (at least 20 m)',
    dev < 3 && near >= 20, `the back straight's heading within ${dev.toFixed(1)} deg, nearest legs ${near.toFixed(1)} m apart`);
}
// 4. the places: Turns 1, 2, 6, 7, 8, the back straight, Turn 9 in order, each with the commentator's lines; numbers only (no names)
{
  const L = T.names;
  check('places: Turns 1, 2, 6, 7, 8, the back straight, Turn 9 in order along the lap, the commentator\'s lines for each',
    L.map(p => p.n).join() === 'Zavoj 1,Zavoj 2,Zavoj 6,Zavoj 7,Zavoj 8,Zadnja ravnina,Zavoj 9' && L.every((p, k) => k === 0 || p.d > L[k - 1].d) && L.every(p => p.say && p.say.length === 3),
    L.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
}
// 5. the pits of 1966: the lane on the left of the main straight, across the start line, from the exit of Turn 9 to before Turn 1, behind its
// earth bank (scenery: the game's pit stops are on the right, so no def.pit: the cars do not stop here); the grandstand across from them
{
  const [a, b, o] = def.pitLane, t9 = 4990 - T.len;
  check('pits: the lane of 1966 on the left of the main straight (20 m out), across the start line, from after Turn 9 to before the bend of Turn 1; scenery only',
    o < -15 && o > -25 && a < 0 && b > 0 && a > t9 && b < 560 && b - a > 200 && b - a < 320 && !def.pit, `lane ${a} .. ${b} m, ${o} m to the side, def.pit ${def.pit ? 'set' : 'none'}`);
  check('pits: the grandstand across from them, on the right of the main straight at the start line',
    def.stands.length === 1 && def.stands[0][2] === 1 && def.stands[0][0] < 0 && def.stands[0][1] > 0, JSON.stringify(def.stands));
}
// 6. a whole race: 12 AI cars and the player on the autopilot, 2 laps, every car to the finish without a rescue; in the rain slower (2-20 %)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
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
  check('race in the dry: all 13 cars to the finish, the player without a rescue; the winner\'s 2 laps 3-7 minutes',
    d.n === 13 && d.of === 13 && !d.resc && !d.nan && d.win > 180 && d.win < 420, `${d.n}/${d.of} finished, winner ${d.win && d.win.toFixed(1)} s, last ${d.last && d.last.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 cars to the finish, the player without a rescue, the winner 2-20 % slower than in the dry',
    w.n === 13 && w.of === 13 && !w.resc && !w.nan && w.win / d.win > 1.02 && w.win / d.win < 1.2, `${w.n}/${w.of} finished, winner ${w.win && w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
