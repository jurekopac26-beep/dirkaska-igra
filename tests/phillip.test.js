// Phillip Island: the circuit on the island's south coast, high over Bass Strait (OpenStreetMap's line, the layout since 1988). The track (its length
// against the official 4.448 km, anticlockwise, the start line in the middle of the main straight), its twelve turns in order and each its way, the
// pit lane on the inside (left) of the straight behind the pit wall, from after Turn 11 to past the start line (scenery: no stops), the gravel
// traps, a whole race with the AI in the dry and in the rain (everyone to the flag), and the street furniture (Core PROPK: traffic signal, signs,
// bin, mailbox, lamp, guide post) knocked over by a car that drives on.
//   node tests/phillip.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'phillip'), T = new C.Track(def);

// 1. the track: a closed circuit at full scale, 3 laps, anticlockwise, the start line at points[0]
{
  let area = 0; for (let i = 0; i < T.N; i++) { const j = (i + 1) % T.N; area += T.px[i] * T.pz[j] - T.px[j] * T.pz[i]; }   // (x east, z south: a negative sum is clockwise on the screen, anticlockwise on the map)
  check('track: Phillip Island, Australia (a place name only), 3 laps, 4.448 km within 0.2 % (the official length), anticlockwise, the start line at points[0]',
    def.name === 'Phillip Island, Avstralija' && def.en.name === 'Phillip Island, Australia' && !def.open && def.laps === 3 && Math.abs(T.len / 4448 - 1) < 0.002 && def.realKm === 4.448 && area < 0 && T.startS === 0,
    `${T.len.toFixed(1)} m (${((T.len / 4448 - 1) * 100).toFixed(2)} %), ${def.laps} laps = ${(T.len * def.laps / 1000).toFixed(1)} km, signed area ${Math.round(area / 2)} m²`);
  let lo = 1e9, hi = -1e9, loS = 0, hiS = 0; for (let i = 0; i < T.N; i++) { if (T.hy[i] < lo) { lo = T.hy[i]; loS = i * T.ds; } if (T.hy[i] > hi) { hi = T.hy[i]; hiS = i * T.ds; } }
  let up = 0; for (let s = 0; s < 500; s += 10) up = Math.max(up, T.hy[T.idx(s + 10)] - T.hy[T.idx(s)]); const down = T.hy[T.idx(500)] < T.hy[0] - 3 && up < 0.15;
  check('heights: the main straight runs downhill to Turn 1, the lowest at the foot of the hill before the Turn 4 hairpin, the highest the crest at Turn 9; 20-35 m in all',
    down && loS > 1200 && loS < 1900 && hiS > 2950 && hiS < 3300 && hi - lo > 20 && hi - lo < 35, `the straight ${T.hy[0].toFixed(1)} -> ${T.hy[T.idx(500)].toFixed(1)} m, lowest ${lo.toFixed(1)} m at ${Math.round(loS)} m, highest ${hi.toFixed(1)} m at ${Math.round(hiS)} m (above the start line)`);
}

// 2. the turns: twelve number boards at the apexes, in order along the lap, each its way (5 right, 7 left: 1 R, 2 L, 3 L, 4 R hairpin, 5 R, 6 L, 7 R,
// 8 L, 9 L, 10 R hairpin, 11 L, 12 L); the HUD's names the numbers only
{
  const WAY = [1, -1, -1, 1, 1, -1, 1, -1, -1, 1, -1, -1];
  const ap = def.turns.map(([x, z]) => { const i = T.nearestIdx(x, z); let a = 0; for (let d = -40; d <= 40; d += T.ds) a += T.k[T.idx(i * T.ds + d)] * T.ds; return { s: i * T.ds, deg: a * 180 / Math.PI }; });
  const hp = [3, 9].map(k => { let km = 0; const i = T.nearestIdx(...def.turns[k]); for (let d = -6; d <= 6; d += T.ds) km = Math.max(km, Math.abs(T.k[T.idx(i * T.ds + d)])); return 1 / km; });
  check('turns: twelve, in order along the lap, each its way (5 right, 7 left); the hairpins (4, 10) tighter than a 30 m radius',
    ap.length === 12 && ap.every((a, k) => k === 0 || a.s > ap[k - 1].s) && ap.every((a, k) => Math.sign(a.deg) === WAY[k] && Math.abs(a.deg) > 4) && hp.every(r => r < 30),
    ap.map((a, k) => `${k + 1}: ${Math.round(a.s)} m ${a.deg > 0 ? 'R' : 'L'} ${Math.round(Math.abs(a.deg))}°`).join(', ') + `; hairpins ${hp.map(r => r.toFixed(0) + ' m').join(', ')}`);
  check('names: "Zavoj N" only (no names of people or sponsors), in order along the lap, each with the commentator\'s lines',
    T.names.length >= 9 && T.names.every(p => /^Zavoj \d+$/.test(p.n) && p.say && p.say.length) && T.names.every((p, k) => k === 0 || p.d > T.names[k - 1].d), T.names.map(p => p.n).join(', '));
}

// 3. the pits: on the inside (left) of the straight behind the pit wall, the way in after Turn 11, out past the start line (scenery: no def.pit)
{
  const P = def.phil.pit, lat = (x, z) => { const i = T.nearestIdx(x, z); return { s: i * T.ds, d: (x - T.px[i]) * T.nx[i] + (z - T.pz[i]) * T.nz[i] }; };
  const lane = P.lane.map(([x, z]) => lat(x, z)), e0 = lat(...P.entry[0]), x1 = lat(...P.exit[P.exit.length - 1]), t11 = T.nearestIdx(...def.turns[10]) * T.ds, t12 = T.nearestIdx(...def.turns[11]) * T.ds, t1 = T.nearestIdx(...def.turns[0]) * T.ds;
  let wall = 0; for (let d = -700; d <= 140; d += 10) wall = Math.max(wall, T.bl[T.idx(d)] - T.w);
  check('pits: the lane on the left of the straight (10-40 m in), the way in after Turn 11 (before 12), out past the start line before Turn 1; the pit wall 1.4 m from the road; no pit stops (def.pit)',
    lane.every(p => p.d < -8 && p.d > -40) && e0.s > t11 && e0.s < t12 && x1.s > 0 && x1.s < t1 && wall < 2 && !def.pit,
    `lane ${lane.map(p => Math.round(-p.d)).join('/')} m left, in at ${Math.round(e0.s)} m (Turn 11 ${Math.round(t11)}, 12 ${Math.round(t12)}), out at ${Math.round(x1.s)} m (Turn 1 ${Math.round(t1)}), wall at most ${wall.toFixed(2)} m out`);
  let gv = 0; for (const [a, b, sd] of def.gravel) for (let d = a; d <= b; d += 10) if ((sd > 0 ? T.gravR : T.gravL)[T.idx(d)]) gv++;
  let other = 0; for (let i = 0; i < T.N; i++) { const s = i * T.ds; if ((T.gravL[i] || T.gravR[i]) && !def.gravel.some(([a, b]) => s >= a - 2 && s <= b + 2)) other++; }
  check('gravel: the traps at Turns 2, 4, 6 and 10 (def.gravel), grass elsewhere', gv > 40 && !other, `${gv} spots of gravel in the traps, ${other} elsewhere`);
}

// 4. a race with the AI (12 cars, 3 laps): everyone to the flag, no rescue; in the rain too, slower
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 11, playerGrid: 6, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); let t = 0, k = 0, resc = 0;
    while (t < 900 && !r.cars.every(c => c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT); t += DT; for (const c of r.cars) if (c.stuckT > 3 || c.wrongT > 3) { r.rescue(c); resc++; } }
    return { r, t, resc, all: r.cars.every(c => c.finished), win: Math.min(...r.cars.map(c => c.finishTime || 1e9)) };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race: 12 cars, 3 laps in the dry, everyone to the flag, no rescue, the winner in 4.5-6 minutes', d.all && !d.resc && d.win > 270 && d.win < 360, `winner ${d.win.toFixed(1)} s, ${d.resc} rescues`);
  check('race in the rain: everyone to the flag, no rescue, slower than in the dry', w.all && !w.resc && w.win > d.win, `winner ${w.win.toFixed(1)} s (${((w.win / d.win - 1) * 100).toFixed(1)} % slower), ${w.resc} rescues`);
}

// 5. the street furniture (the junctions' kinds, Core PROPK): one of each across the straight, the car on the autopilot drives through them; each
// knocked over (moved or tipped), the car drives on, a little slower
{
  const orig = Math.random; Math.random = seeded(21);
  const kinds = ['signal', 'sign', 'giveway', 'warn', 'bin', 'mailbox', 'lamp', 'post', 'cone'];
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 5, tt: true }), P = r.player; r.start();
  const list = kinds.map((kind, k) => { const i = T.idx(140 + k * 22), o = T.rl[i]; return { kind, x: T.px[i] + T.nx[i] * o, z: T.pz[i] + T.nz[i] * o, yaw: T.hd[i] + Math.PI, col: 0, i }; });
  r.setProps(list, null); const at = r.props.map(b => [b.x, b.z]);
  let t = 0, k = 0, vMin = 1e9, dist0 = P.dist;
  while (t < 40 && P.dist - dist0 < 600) { Math.random = seeded(900 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.dist - dist0 > 150 && P.dist - dist0 < 360) vMin = Math.min(vMin, P.speed); }
  const tip = (b) => 1 - 2 * (b.qx * b.qx + b.qz * b.qz);   // (the body's up axis: 1 upright, less when tipped)
  const hit = r.props.map((b, q) => ({ kind: b.kind, moved: Math.hypot(b.x - at[q][0], b.z - at[q][1]), up: tip(b) }));
  Math.random = orig;
  check('street furniture: a traffic signal, the signs (round, give way, warning), a wheelie bin, a mailbox, a street lamp, a guide post, a cone, each knocked over by the car',
    hit.every(h => h.moved > 0.3 || h.up < 0.8), hit.map(h => `${h.kind} ${h.moved.toFixed(1)} m ${h.up.toFixed(2)}`).join(', '));
  check('street furniture: the car drives on through them (still over 40 km/h among them, 600 m on within 40 s), not stopped by them',
    P.dist - dist0 >= 600 && vMin > 40 / 3.6, `${Math.round(P.dist - dist0)} m in ${t.toFixed(1)} s, slowest ${(vMin * 3.6).toFixed(0)} km/h`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
