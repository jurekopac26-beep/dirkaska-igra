// São Paulo, Brazil: the permanent circuit in Interlagos (4.309 km, 15 turns, anticlockwise), its centre line from OpenStreetMap.
// The track (a closed circuit of 4 laps at full scale, the length within 0.5 % of the record books', anticlockwise), its fifteen turns in
// order and each its way (Turn 1 left, 2 right, 3 the long left of Curva do Sol, 4 and 5 left by the lake, 6, 7 and 8 right, 9 left,
// the hairpin 10 right, 11-15 left), the heights (the start line high, the lake corners the lowest), the places along the lap (no names of
// people), the pits where they are (the lane on the left of the main straight, in after Turn 14, out onto the back straight: scenery) and
// the grandstands across from them, the knockable street furniture (every generic kind is knocked over by a car that drives on; the pit
// lane's mouths, where the circuit's own furniture stands, lie inside the barriers), the city round it (OSM: houses, streets, traffic
// lights, crossings, bus stops), and a whole race of 12 AI cars and the player on the autopilot, in the dry and in the rain.
//   node tests/saopaulo.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'saopaulo'), T = new C.Track(def);
const dS = (s) => { const L = T.len; return ((s - T.startS) % L + L) % L; };   // metres from the start line along the lap (0 .. L)
const at = (d) => T.idx(T.startS + d);

// 1. the track: a closed circuit of 4 laps, 4.309 km within 0.5 %, anticlockwise, in the big championship; the name a place's
{
  let turn = 0; for (let i = 0; i < T.N; i++) turn += T.k[i] * T.ds;
  check('track: São Paulo, Brazilija (São Paulo, Brazil), a closed circuit of 4 laps, not a test track, in the big championship',
    def.name === 'São Paulo, Brazilija' && def.en && def.en.name === 'São Paulo, Brazil' && !def.open && !def.timeTrial && !def.test && def.laps === 4 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('saopaulo'),
    `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
  check('track: 4.309 km within 0.5 %, the menu\'s real length 4.309 km, anticlockwise (one full turn to the left), no crossover',
    Math.abs(T.len / 4309 - 1) < 0.005 && def.realKm === 4.309 && Math.abs(turn + 2 * Math.PI) < 0.05 && !(T.cross && T.cross.length),
    `${T.len.toFixed(1)} m (${((T.len / 4309 - 1) * 100).toFixed(2)} %), total turn ${(turn * 180 / Math.PI).toFixed(1)} deg`);
}
// 2. the heights (Copernicus DEM): the start line the zero, down through the esses and along the back straight to the lake corners
// (the lowest, 33-42 m below), up through Ferradura, down the Mergulho to Junção, the long climb past the pits; no grade over 13 %
{
  const h = (d) => T.hy[at(d)]; let lo = 0, dLo = 0, g = 0;
  for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; dLo = dS(i * T.ds); } g = Math.max(g, Math.abs(T.grade[i])); }
  check('heights: the lowest point by the lake (Turns 4-5, 33-42 m below the start line), the back straight falling, Ferradura higher than the lake, the climb from Junção to the line',
    Math.abs(h(0)) < 0.5 && lo < -33 && lo > -42 && dLo > 1300 && dLo < 1750 && h(700) > h(1200) && h(2100) > h(1500) + 8 && h(3700) > h(3260) + 15 && Math.max(...T.hy) < 8,
    `start ${h(0).toFixed(1)} m, lowest ${lo.toFixed(1)} m at ${Math.round(dLo)} m, back straight ${h(700).toFixed(1)} > ${h(1200).toFixed(1)}, Ferradura ${h(2100).toFixed(1)}, Junção ${h(3260).toFixed(1)}, pits ${h(3700).toFixed(1)}`);
  check('heights: no grade over 13 %', g < 0.13, `steepest ${(g * 100).toFixed(1)} %`);
}
// 3. the fifteen turns in order and each its way: the number boards (def.turns) in order along the lap, the road turning their way round
// each (degrees: + right, - left) within its stretch
{
  const turnDeg = (a, b) => { let t = 0; for (let d = a; d < b; d += T.ds) t += T.k[at(d)] * T.ds; return t * 180 / Math.PI; };
  const REAL = [   // [the stretch of the lap (m from the start line), the direction (+1 right, -1 left), degrees min, max]
    [290, 410, -1, 70, 140],    // Turn 1: left, down the hill (the first of the esses)
    [410, 480, 1, 50, 110],     // Turn 2: right
    [480, 800, -1, 60, 130],    // Turn 3: Curva do Sol, the long left onto the back straight
    [1368, 1520, -1, 70, 120],  // Turn 4: Descida do Lago, left
    [1520, 1620, -1, 20, 60],   // Turn 5: left, by the lake
    [1980, 2094, 1, 45, 95],    // Turn 6: Ferradura, right
    [2094, 2226, 1, 45, 95],    // Turn 7: Laranjinha, right
    [2286, 2412, 1, 100, 150],  // Turn 8: right
    [2412, 2579, -1, 140, 190], // Turn 9: Pinheirinho, left
    [2579, 2879, 1, 160, 205],  // Turn 10: Bico de Pato, the hairpin, right
    [2879, 3101, -1, 85, 125],  // Turn 11: Mergulho, left
    [3137, 3300, -1, 75, 115],  // Turn 12: Junção, left
    [3359, 3437, -1, 15, 45],   // Turn 13: left
    [3593, 3785, -1, 30, 65],   // Turn 14: left, up past the pits
    [3899, 4157, -1, 15, 45],   // Turn 15: left, onto the main straight
  ];
  const ds = def.turns.map(([x, z]) => dS(T.nearestIdx(x, z) * T.ds));
  const res = REAL.map(([a, b, dir, lo, hi], k) => { const deg = turnDeg(a, b); return { k: k + 1, deg, ok: Math.sign(deg) === dir && Math.abs(deg) >= lo && Math.abs(deg) <= hi && ds[k] >= a && ds[k] <= b }; });
  check('turns: fifteen number boards in order along the lap, each on its stretch',
    def.turns.length === 15 && ds.every((d, k) => k === 0 || d > ds[k - 1]) && res.every(r => r.ok), ds.map((d, k) => `${k + 1}@${Math.round(d)}`).join(' '));
  check('turns: 1 left, 2 right, 3-5 left, 6-8 right, 9 left, 10 right (the hairpin), 11-15 left',
    res.every(r => r.ok), res.map(r => `T${r.k} ${r.deg > 0 ? 'R' : 'L'} ${Math.abs(r.deg).toFixed(0)}°`).join(', '));
  const hd = (d) => Math.atan2(T.tz[at(d)], T.tx[at(d)]), dev = (() => { let m = 0; for (let d = 820; d < 1340; d += 10) m = Math.max(m, Math.abs(Math.atan2(Math.sin(hd(d) - hd(820)), Math.cos(hd(d) - hd(820))))); return m * 180 / Math.PI; })();
  check('turns: the back straight (Reta Oposta) straight for half a kilometre (within 4 degrees)', dev < 4, `heading within ${dev.toFixed(1)} deg from 820 to 1340 m`);
}
// 4. the places along the lap: Turn 1 by its number (the esses carry a person's name), then the corners' place names in order, each with the
// commentator's lines
{
  const L = T.names;
  check('places: Zavoj 1, Curva do Sol, Reta Oposta, Descida do Lago, Ferradura, Laranjinha, Pinheirinho, Bico de Pato, Mergulho, Junção, Subida dos Boxes in order, with the commentator\'s lines; no names of people',
    L.map(p => p.n).join() === 'Zavoj 1,Curva do Sol,Reta Oposta,Descida do Lago,Ferradura,Laranjinha,Pinheirinho,Bico de Pato,Mergulho,Junção,Subida dos Boxes' &&
    L.every((p, k) => k === 0 || p.d > L[k - 1].d) && L.every(p => p.say && p.say.length === 3) && !L.some(p => /senna|pace|piquet/i.test(p.n + p.say.join())),
    L.map(p => `${p.n} @${Math.round(p.d)}`).join(' | '));
}
// 5. the pits where they are: the lane (OSM) on the left of the main straight, leaving after Turn 14, past the start line 15-20 m to the left,
// joining the back straight after Curva do Sol (scenery: the game's pit stops are on the right, so no def.pit); the grandstands across
// from it on the right of the main straight; concrete walls along it
{
  const P = def.pitPath, side = (x, z) => { const i = T.nearestIdx(x, z), d = (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i]; return { d: dS(i * T.ds), o: d }; };
  const a = side(...P[0]), b = side(...P[P.length - 1]), mid = P.map(p => side(...p)).filter(q => q.d > T.len - 100 || q.d < 100);
  check('pits: the lane on the left of the main straight (15-20 m out at the start line), in after Turn 14, out onto the back straight after Turn 3; scenery only',
    a.d > 3700 && a.d < 3950 && b.d > 800 && b.d < 1100 && mid.length > 0 && mid.every(q => q.o < -15 && q.o > -20) && !def.pit,
    `in at ${Math.round(a.d)} m, out at ${Math.round(b.d)} m, at the line ${mid.map(q => q.o.toFixed(1)).join(', ')} m, def.pit ${def.pit ? 'set' : 'none'}`);
  check('pits: the grandstands across from them, on the right of the main straight and on to Turn 1; walls along the straight on both sides',
    def.stands.length >= 4 && def.stands.every(s => s[2] === 1) && def.stands.some(s => s[0] < 0 && s[1] > 0) && def.walls.some(w => w[2] < 0) && def.walls.some(w => w[2] > 0),
    def.stands.map(s => `${s[7]} ${s[0]}..${s[1]}`).join(', '));
  // the circuit's own street furniture at the lane's mouths (the world builder's bollards, sign and exit light): inside the barriers,
  // between the track's edge and the lane, where a car can reach it
  const PD = []; for (let k = 0; k + 1 < P.length; k++) { const [ax, az] = P[k], [bx, bz] = P[k + 1], l = Math.hypot(bx - ax, bz - az); for (let t = 0; t < l; t += 1) PD.push([ax + (bx - ax) * t / l, az + (bz - az) * t / l]); }   // (the lane every metre)
  const lane = (d) => { const i = at(d); let best = 1e9; for (const [x, z] of PD) { const dx = x - T.px[i], dz = z - T.pz[i]; if (Math.abs(dx * T.tx[i] + dz * T.tz[i]) > 1) continue; const lat = -(dx * T.nx[i] + dz * T.nz[i]); if (lat > 0) best = Math.min(best, lat); } return best; };
  const mouths = [-325, -305, 766, 790, 814].map(d => { const lo = lane(d), o = T.w + (lo - 3.6 - T.w) / 2; return { d, o, ok: lo < 200 && lo - 3.6 - T.w > 1.2 && o < T.bl[at(d)] - 0.6 }; });
  check('pits: the lane\'s mouths (entry after Turn 14, exit on the back straight) between the track\'s edge and the lane inside the left barrier: the knockable bollards there can be reached',
    mouths.every(m => m.ok), mouths.map(m => `${m.d} m: ${m.o.toFixed(1)} m left (barrier ${T.bl[at(m.d)].toFixed(1)})`).join(', '));
}
// 6. the city round the circuit (def.city, OpenStreetMap): houses with their heights, streets with lanes, traffic lights, crossings, bus stops,
// junctions; all outside the circuit's barriers
{
  const Cc = def.city, nodes = { 0: 0, 1: 0, 2: 0 }; for (let k = 0; k < Cc.node.length; k += 3) if (Cc.node[k] in nodes) nodes[Cc.node[k]]++;
  const nb = atob(Cc.bld.k).length, nr = Cc.road.a.length / 3, cls = new Set(); for (let k = 0; k < Cc.road.a.length; k += 3) cls.add(Cc.road.a[k]);
  check('city: over 3000 houses with heights, over 400 streets of every class (avenues, streets, service roads), over 400 junctions, 20+ traffic lights, 100+ crossings, 30+ bus stops',
    nb > 3000 && atob(Cc.bld.h).length === nb && nr > 400 && [1, 2, 3, 4, 5].every(c => cls.has(c)) && Cc.jn.length / 3 > 400 && nodes[0] >= 20 && nodes[1] >= 100 && nodes[2] >= 30,
    `${nb} houses, ${nr} streets, ${Cc.jn.length / 3} junctions, ${nodes[0]} traffic lights, ${nodes[1]} crossings, ${nodes[2]} bus stops`);
  let inside = 0; const q = {}; for (let k = 0; k < Cc.node.length; k += 3) { if (Cc.node[k] !== 0) continue; T.query(Cc.node[k + 1], Cc.node[k + 2], -1, q); if (Math.abs(q.d) < (q.d > 0 ? q.br : q.bl)) inside++; }
  check('city: the traffic lights stand in the streets outside the circuit\'s barriers', inside === 0, `${inside} inside`);
}
// 7. the street furniture (Core's generic kinds: a traffic light, a street lamp, a sign, a bollard, a litter bin, a hydrant, an electrical
// cabinet) on the racing line of the back straight: the player's car on the autopilot knocks every one of them over and drives on (a little
// slower for a moment, a small dent at most)
{
  const KINDS = ['signal', 'lamp', 'sign', 'bollard', 'bin', 'hydrant', 'cabinet'];
  const o = Math.random; Math.random = seeded(19);
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 4, playerModel: C.MODELS[4], assist: 2, seed: 3, difficulty: 1, damage: 2, phys: 'cs' }), P = r.player;
  r.start();
  const list = KINDS.map((kind, k) => { const i = at(900 + k * 45); return { kind, x: T.px[i] + T.nx[i] * T.rl[i], z: T.pz[i] + T.nz[i] * T.rl[i], yaw: T.hd[i], col: 0, i }; });
  r.setProps(list, null); const p0 = r.props.map(b => [b.x, b.y, b.z]);
  let t = 0, vMin = 1e9, vAt = 0, d0 = P.dmg; const hit = new Set();
  for (let k = 1; t < 140 && dS(P.q.s) < 1300 || t < 20; k++) { Math.random = seeded(900 + k); C.aiControl(P, r, DT); r.step(DT); t += DT;
    const d = dS(P.q.s); if (d > 880 && d < 1220) { vMin = Math.min(vMin, P.speed); vAt = Math.max(vAt, P.speed); }
    r.props.forEach((b, k2) => { if (Math.hypot(b.x - p0[k2][0], b.z - p0[k2][2]) > 0.5 || Math.abs(b.qx) + Math.abs(b.qz) > 0.2) hit.add(k2); }); }
  Math.random = o;
  const knocked = [...hit].map(k => r.props[k].kind);
  check('street furniture: a traffic light, a lamp, a sign, a bollard, a bin, a hydrant and a cabinet on the racing line all knocked over by the car on the autopilot',
    KINDS.every(k => knocked.includes(k)), `knocked: ${knocked.join(', ') || 'none'}`);
  check('street furniture: the car drives on past them (over 25 m/s through the stretch at its slowest, on along the back straight), a small dent at most',
    dS(P.q.s) > 1250 && vMin > 25 && P.dmg - d0 < 0.12 && !P.stuckT, `slowest ${vMin.toFixed(1)} m/s, fastest ${vAt.toFixed(1)} m/s, damage +${(P.dmg - d0).toFixed(3)}, at ${Math.round(dS(P.q.s))} m`);
}
// 8. a whole race: 12 AI cars and the player on the autopilot, 4 laps, every car to the finish without a rescue; in the rain slower (2-20 %)
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
  check('race in the dry: all 13 cars to the finish, the player without a rescue; the winner\'s 4 laps 5-11 minutes',
    d.n === 13 && d.of === 13 && !d.resc && !d.nan && d.win > 300 && d.win < 660, `${d.n}/${d.of} finished, winner ${d.win && d.win.toFixed(1)} s, last ${d.last && d.last.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: all 13 cars to the finish, the player without a rescue, the winner 2-20 % slower than in the dry',
    w.n === 13 && w.of === 13 && !w.resc && !w.nan && w.win / d.win > 1.02 && w.win / d.win < 1.2, `${w.n}/${w.of} finished, winner ${w.win && w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
