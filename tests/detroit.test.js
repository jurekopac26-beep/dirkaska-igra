// Detroit: the street circuit in the centre of the city by the river (the 2023 layout, 2.647 km, nine turns, anticlockwise). The lap's
// length against the official one, the nine turns in their order and their directions (the hairpin), the start straight and the pit lane
// on its right, the widths of the streets; a whole race of 5 laps with 12 AI cars, every car to the finish, in the dry and in the rain;
// the street furniture in the crossings' mouths (inside the barriers) knocked over by a car that drives on and finishes its lap.
//   node tests/detroit.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'detroit'), T = new C.Track(def);
const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a)), sAt = (d) => (((T.startS + d) % T.len) + T.len) % T.len, dOf = (i) => { let d = i * T.ds - T.startS; d = ((d % T.len) + T.len) % T.len; return d; };

// 1. the track: a closed street circuit, 5 laps, its length within 0.5 % of the official 2.647 km
check('track: a closed circuit (laps and time trials), 5 laps, "Detroit, ZDA" / "Detroit, USA", pits, not a test track',
  !def.open && !def.timeTrial && def.laps === 5 && def.name === 'Detroit, ZDA' && def.en.name === 'Detroit, USA' && !!def.pit && !def.test && def.realKm === 2.647,
  `${def.name}, ${def.laps} laps`);
check('track: the lap 2.647 km (within 0.5 % of the official length; the hairpin placed so)', Math.abs(T.len / 2647 - 1) < 0.005, `${T.len.toFixed(1)} m (${((T.len / 2647 - 1) * 100).toFixed(2)} %)`);

// 2. the nine turns in order and in their directions: Turns 1-3 left (3 the hairpin), 4 right, 5 left, the S of 6 (right) and 7 (left), 8 left, 9 right
{ const turn = (x, z, r) => { const i = T.nearestIdx(x, z); let a = 0; for (let s = -r; s <= r; s += T.ds) a += T.k[T.idx(i * T.ds + s)] * T.ds; return { d: dOf(i), deg: a * 180 / Math.PI }; };
  const R = [30, 30, 45, 25, 25, 18, 25, 25, 25], want = [-1, -1, -1, 1, -1, 1, -1, -1, 1], tu = def.turns.map(([x, z], k) => turn(x, z, R[k]));
  const order = tu.every((t, k) => k === 0 || t.d > tu[k - 1].d), dirs = tu.every((t, k) => Math.sign(t.deg) === want[k]);
  check('turns: nine, in order round the lap, their directions L L L R L R L L R, the hairpin (3) 150-200 deg, the others 40-110 deg',
    tu.length === 9 && order && dirs && Math.abs(tu[2].deg) > 150 && Math.abs(tu[2].deg) < 200 && tu.every((t, k) => k === 2 || (Math.abs(t.deg) > 40 && Math.abs(t.deg) < 110)),
    tu.map((t, k) => `T${k + 1} ${Math.round(t.d)} m ${Math.round(t.deg)}°`).join(', '));
  check('turns: the game finds the same nine corners', T.corners.length === 9, `${T.corners.length} corners`);
  const names = T.names.filter(q => q.hud).map(q => q.n);
  check('places: the turns by their numbers only on the HUD (no names of streets after people, of firms or sponsors)', names.every(s => /^Zavoj \d$/.test(s)) && names.length >= 8, names.join(', '));
}

// 3. the start straight and the pit lane on its right, in the car park: from after Turn 9 to before Turn 1, the player's box beside the grid
{ const lane = []; for (let d = -200; d <= 200; d += 2) { const p = T.pitAt(sAt(d)); if (p) lane.push(d); }
  const p0 = T.pitAt(sAt(def.pit[3])), t1 = dOf(T.nearestIdx(...def.turns[0])), t9 = dOf(T.nearestIdx(...def.turns[8])) - T.len;
  check('pits: the lane on the right of the start straight, from after Turn 9 to before Turn 1, the player\'s box ~16 m to the right',
    lane.length > 100 && lane[0] > t9 + 20 && lane[lane.length - 1] < t1 - 30 && p0 && p0.o > 14 && !p0.gap, `lane ${lane[0]}..${lane[lane.length - 1]} m (Turn 9 at ${Math.round(t9)}, Turn 1 at ${Math.round(t1)}), box at ${p0 && p0.o.toFixed(1)} m`);
  let wmin = 1e9, wmax = 0; for (let i = 0; i < T.N; i++) { wmin = Math.min(wmin, T.wa[i]); wmax = Math.max(wmax, T.wa[i]); }
  check('streets: the narrow climb of Turn 1 (10.6 m), 14 m on the avenue, 16 m round the hairpin', Math.abs(wmin - 5.3) < 0.05 && Math.abs(wmax - 8) < 0.05, `half widths ${wmin.toFixed(2)}..${wmax.toFixed(2)} m`);
  let hmin = 1e9, hmax = -1e9; for (let i = 0; i < T.N; i++) { hmin = Math.min(hmin, T.hy[i]); hmax = Math.max(hmax, T.hy[i]); }
  check('heights: the avenue ~7 m above the start straight, the riverfront ~1 m below it', hmax > 6 && hmax < 8.5 && hmin < -0.5 && hmin > -2.5, `${hmin.toFixed(1)} .. ${hmax.toFixed(1)} m`);
}

// 4. a race of 5 laps, 12 AI cars and the player on the autopilot: every car to the finish, in the dry and in the rain (slower)
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 900 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] && fin[0].finishTime, resc };
  } finally { Math.random = orig; }
};
{ const d = race(0), w = race(1);
  check('race: 5 laps, all 13 cars to the finish in the dry, the player without a rescue', d.fin === 13 && d.cars === 13 && !d.resc, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(1)} s (${(d.win / 5).toFixed(1)} s a lap)`);
  check('race in the rain: all 13 to the finish, slower than in the dry', w.fin === 13 && w.win > d.win && w.win / d.win < 1.3, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(1)} s (+${((w.win / d.win - 1) * 100).toFixed(1)} %)`);
}

// 5. the crossings: the barriers open into the cross streets' mouths (the street furniture stands there, inside them); a car steered into
// a mouth knocks the mast-arm signal over (it flies, the car loses a little speed and takes a little damage) and drives on
{ const X = def.scen.xs, deep = X.filter(([d, sd]) => { const i = T.idx(sAt(d)); return (sd > 0 ? T.br[i] : T.bl[i]) > T.wa[i] + 8; });
  check('crossings: every cross street\'s mouth inside the barriers (8 m or more past the road\'s edge), 17 of them', X.length === 17 && deep.length === X.length, `${deep.length}/${X.length}`);
  const [d0, sd] = X.find(x => x[0] > 700 && x[0] < 760) || X[0], s0 = sAt(d0), i0 = T.idx(s0), wi = T.wa[i0];
  const at = (al, lat) => { const i = T.idx(s0 + al); return [T.px[i] + T.nx[i] * sd * lat, T.pz[i] + T.nz[i] * sd * lat, i]; };
  const [sx, sz, si] = at(6.4, wi + 2.0), [bx, bz, bi] = at(4.6, wi + 3.4);
  const orig = Math.random; Math.random = seeded(7);
  try {
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 4, difficulty: 1, rain: 0 });
    r.setProps([{ kind: 'signal', x: sx, z: sz, yaw: 0, i: si }, { kind: 'bollard', x: bx, z: bz, yaw: 0, i: bi }, { kind: 'hydrant', x: at(4, wi + 6)[0], z: at(4, wi + 6)[1], yaw: 0 }]);
    const sig = r.props.find(b => b.kind === 'signal'), y0 = sig.y, x0 = sig.x, z0 = sig.z;
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0, hit = false, vBefore = 0, vAfter = 0, dmg0 = 0, mode = 'drive', t1 = 0;
    while (t < 300 && P.lap < 2) {
      Math.random = seeded(9000 + (++k));
      const dq = dOf(P.q.i);
      if (mode === 'drive' && P.lap === 1 && dq > d0 - 170 && dq < d0) mode = 'aim';
      if (mode === 'aim') {   // brake to ~65 km/h, steer for the signal's foot
        const a = wrapPi(Math.atan2(sz - P.z, sx - P.x) - P.h); P.inSteer = Math.max(-1, Math.min(1, a * 2.5)); P.inThr = P.speed < 17 ? 0.7 : 0; P.inBrk = P.speed > 20 ? 1 : 0; P.inHand = 0;
        if (!hit && Math.hypot(sig.x - x0, sig.z - z0) > 0.3) { hit = true; vBefore = P.speed; dmg0 = P.dmg || 0; mode = 'after'; t1 = t; }
        if (dq > d0 + 20) mode = 'drive';
      } else C.aiControl(P, r, DT);
      r.step(DT); t += DT;
      if (mode === 'after' && t - t1 > 0.25 && !vAfter) vAfter = P.speed;
      if (mode === 'after' && t - t1 > 1.0) mode = 'drive';
      if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    }
    const moved = Math.hypot(sig.x - x0, sig.z - z0), fell = sig.y < y0 - 0.8 || Math.abs(sig.qx) + Math.abs(sig.qz) > 0.3;
    check('crossings: the car steered into the mouth knocks the mast-arm signal over (it flies off its foot and falls)', hit && moved > 1 && fell, `moved ${moved.toFixed(1)} m, its centre ${sig.y.toFixed(2)} m (was ${y0.toFixed(2)}), tilt ${(Math.abs(sig.qx) + Math.abs(sig.qz)).toFixed(2)}`);
    check('crossings: the car loses a little speed (under 15 %) and a little damage, and drives on: the lap finished without a rescue',
      hit && vAfter > vBefore * 0.85 && (P.dmg || 0) - dmg0 < 0.25 && P.lap >= 2 && !resc, `${(vBefore * 3.6).toFixed(0)} -> ${(vAfter * 3.6).toFixed(0)} km/h, damage +${(((P.dmg || 0) - dmg0) * 100).toFixed(1)} %, lap ${P.lap}, ${resc} rescues`);
  } finally { Math.random = orig; }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
