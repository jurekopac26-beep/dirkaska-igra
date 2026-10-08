// Montréal, Kanada: the circuit on Île Notre-Dame (def 'montreal'). The track at full scale (its length against the official 4.361 km),
// the fourteen turns in order and each its own way, the pit lane on the LEFT of the straight (a stop there: in, repaired, out), whole races
// on the autopilot dry and in the rain (every car to the flag), and the junctions: their street furniture (traffic signals, signs, stop
// signs, lamps, hydrants, bins, cabinets, bollards) in the mouths of the side roads inside the barriers, knocked over by a car that drives on.
//   node tests/montreal.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'montreal'), T = new C.Track(def);
const sOf = (d) => ((T.startS + d) % T.len + T.len) % T.len;

// 1. the track: a closed circuit (races and time trials), the place's name, its real length
check('track: a closed circuit named after the place (Montréal, Kanada / Montréal, Canada), 3 laps, its own world',
  def && !def.open && !def.timeTrial && def.name === 'Montréal, Kanada' && def.en.name === 'Montréal, Canada' && def.laps === 3 && def.theme === 'montreal',
  `${def.name} / ${def.en.name}, ${def.laps} laps`);
check('track: the lap 4.361 km within 0.3 % (the centre line from OSM, placed on the island\'s roads)', Math.abs(T.len / 4361 - 1) < 0.003, `${T.len.toFixed(1)} m (${((T.len / 4361 - 1) * 100).toFixed(2)} %)`);

// 2. the fourteen turns: in order along the lap, each turning its real way (L, R, R, L, R, L, R, R, L, R, L, R, R, L); the hairpins (2, 10) more than 130 deg
{
  const want = 'LRRLRLRRLRLRRL', turn = (s, r) => { let a = 0; for (let d = -r; d <= r; d += T.ds) a += T.k[T.idx(s + d)] * T.ds; return a * 180 / Math.PI; };
  const S = def.turns.map(([x, z]) => T.nearestIdx(x, z) * T.ds), D = S.map(s => ((s - T.startS) % T.len + T.len) % T.len);
  const deg = S.map((s, k) => turn(s, k === 1 || k === 9 ? 45 : 18)), got = deg.map(a => (a > 0 ? 'R' : 'L')).join('');
  check('turns: fourteen, in order along the lap', S.length === 14 && D.every((d, k) => k === 0 || d > D[k - 1]), D.map(d => Math.round(d)).join(', '));
  check('turns: each its real way', got === want, `${got} (want ${want}): ` + deg.map(a => Math.round(a) + '°').join(' '));
  check('turns: Turn 2 and the hairpin (Turn 10) turn more than 130 deg, the kinks (5, 11, 12) less than 45', Math.abs(deg[1]) > 130 && Math.abs(deg[9]) > 130 && [4, 10, 11].every(k => Math.abs(deg[k]) < 45),
    `T2 ${Math.round(deg[1])}°, T10 ${Math.round(deg[9])}°, T5 ${Math.round(deg[4])}°, T11 ${Math.round(deg[10])}°, T12 ${Math.round(deg[11])}°`);
  const casino = D[12] - D[11];
  check('the long straight from Turn 12 to Turn 13: ~690 m (the official 691 m)', casino > 650 && casino < 730, `${Math.round(casino)} m`);
  check('the HUD: Zavoj 1 .. Zavoj 14, numbers only', T.names.filter(p => /^Zavoj \d+$/.test(p.n)).length === 14, T.names.map(p => p.n).join(', '));
}

// 3. the pit lane: on the left of the straight (the paddock building beside the rowing basin), 15 m from the centre line, the pit wall 7.3 m
{
  const p0 = T.pitAt(sOf(0)), pE = T.pitAt(sOf(-190)), pX = T.pitAt(sOf(285));
  check('pits: the lane on the LEFT of the straight (def.pit[0] < 0), 15 m from the centre line, the way in after the last chicane and the way out before Turn 1',
    def.pit[0] < 0 && p0 && p0.o === 15 && p0.sd === -1 && !p0.gap && pE && pE.gap && pX && pX.gap && !T.pitAt(sOf(400)), `o ${p0 && p0.o}, wall ${p0 && p0.wall.toFixed(1)} m`);
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, damage: 2 });
  r.start(); const P = r.player; P.dmg = 0.5; let t = 0, k = 0; const ev = []; let minD = 0, maxD = 0;
  while (t < 260) { Math.random = seeded(5000 + (++k)); P.pitWant = P.dist > 1500 && !ev.includes('exit') && (!P.pitDone || P.inPit); C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.pitEv) { ev.push(P.pitEv); P.pitEv = null; } if (P.inPit) { minD = Math.min(minD, P.q.d); maxD = Math.max(maxD, P.q.d); } if (P.pitDone && !P.inPit) break; }
  Math.random = orig;
  check('pits: a stop on the autopilot: into the lane on the left, stopped at the box, repaired, back out onto the straight',
    ev.join() === 'enter,box,repair,done,exit' && minD < -13 && maxD < 1 && P.dmg < 0.05 && !P.inPit, `${ev.join(' > ')}; in the lane ${minD.toFixed(1)} .. ${maxD.toFixed(1)} m, damage ${P.dmg.toFixed(2)}`);
}

// 4. whole races on the autopilot, 13 cars, 3 laps, dry and wet: everyone to the flag, nobody rescued
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
    while (t < 900 && !r.cars.every(c => c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; for (const c of r.cars) if (c.stuckT > 3 || c.wrongT > 3) { r.rescue(c); resc++; } }
    return { r, t, resc, fin: r.cars.filter(c => c.finished).length, best: Math.min(...r.cars.map(c => c.finishTime || 1e9)) };
  } finally { Math.random = orig; }
};
const dry = race(0), wet = race(1);
check('race in the dry: 13 cars, 3 laps, all to the flag, no rescue', dry.fin === 13 && !dry.resc, `${dry.fin}/13 in ${dry.t.toFixed(0)} s, winner ${dry.best.toFixed(1)} s, ${dry.resc} rescues`);
check('race in the rain: all to the flag, no rescue, slower than in the dry', wet.fin === 13 && !wet.resc && wet.best > dry.best * 1.01, `${wet.fin}/13 in ${wet.t.toFixed(0)} s, winner ${wet.best.toFixed(1)} s, ${wet.resc} rescues`);

// 5. the junctions: the barrier opens into each side road's mouth; the street furniture there (as the world places it: World's builder
//    js/world-montreal.js) stands inside the barriers off the asphalt; a car driven into it knocks it over and drives on
const J = def.junctions, JOFF = def.junctionOff;
check('junctions: eight side roads (signals, stop signs), each mouth open to its fence 11.5 m past the edge', J.length === 8 && J.filter(j => j[4] === 'sig').length === 3 && J.filter(j => j[4] === 'stop').length === 4 &&
  J.every(([d, sd]) => { const i = T.idx(sOf(d)); return (sd > 0 ? T.br[i] : T.bl[i]) > T.w + JOFF - 0.6; }), J.map(([d, sd]) => { const i = T.idx(sOf(d)); return Math.round(d) + (sd > 0 ? 'R ' : 'L ') + ((sd > 0 ? T.br[i] : T.bl[i]) - T.w).toFixed(1); }).join(', '));
const furniture = () => def.furniture.map(([d, sd, kind, l, face, col, j]) => {   // (def.furniture: as the world places it)
  const s = sOf(d), i = T.idx(s); return { kind, x: T.px[i] + T.nx[i] * sd * l, z: T.pz[i] + T.nz[i] * sd * l, yaw: 0, col, d: J[j][0] }; });
{
  const F = furniture(), q = {}, inside = F.filter(b => { T.query(b.x, b.z, -1, q); return Math.abs(q.d) > T.w + 0.7 && Math.abs(q.d) < (q.d > 0 ? q.br : q.bl) - 0.7; });
  const per = J.map(j => inside.filter(b => b.d === j[0]).length), sig = J.filter(j => j[4] === 'sig').map(j => inside.filter(b => b.d === j[0] && b.kind === 'signalm').length);
  check('junctions: their furniture inside the barriers, off the asphalt (7 kinds of the shared street furniture; the world leaves out what would not fit), 7 pieces or more at each, two signals at each signal junction',
    inside.length === F.length && per.every(k => k >= 7) && sig.every(k => k === 2) && new Set(inside.map(b => b.kind)).size === 7, `${inside.length} of ${F.length}; per junction ${per.join(', ')}; signals ${sig.join(', ')}`);
}
// a car driven straight at each piece of furniture of a kind (alone on the track, full throttle, steering at it from 70 m back)
const ram = (kind) => {
  const F = furniture(), qq = {}, tgt = F.filter(b => b.kind === kind).sort((a, b) => Math.abs(T.query(a.x, a.z, -1, qq).d) - Math.abs(T.query(b.x, b.z, -1, qq).d))[0];   // (the one nearest the circuit)
  const orig = Math.random; Math.random = seeded(7);
  try {
    const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 3, difficulty: 1, damage: 2, tt: true });
    r.start(); r.setProps(F);
    const q0 = T.query(tgt.x, tgt.z, -1, {}), s0 = q0.s - 40, i0 = T.idx(s0), lat = Math.sign(q0.d) * (T.w - 1.2), P = r.player;   // (40 m before it on the near lane, at 60 km/h)
    P.x = T.px[i0] + T.nx[i0] * lat; P.z = T.pz[i0] + T.nz[i0] * lat; P.h = Math.atan2(T.tz[i0], T.tx[i0]); P.vx = Math.cos(P.h) * 16.7; P.vz = Math.sin(P.h) * 16.7; P.q = T.query(P.x, P.z, i0, P.q);
    const b = r.props.find(p => p.kind === kind && Math.abs(p.x - tgt.x) < 0.01 && Math.abs(p.z - tgt.z) < 0.01), x0 = b.x, z0 = b.z, y0 = b.y;
    let t = 0, k = 0, hitV = 0, after = null, knocked = false;
    while (t < 12) {
      Math.random = seeded(900 + (++k));
      const dx = b.x - P.x, dz = b.z - P.z, want = Math.atan2(dz, dx), err = Math.atan2(Math.sin(want - P.h), Math.cos(want - P.h));
      if (!knocked) { P.inThr = P.speed < 16 ? 0.7 : 0; P.inBrk = 0; P.inSteer = Math.max(-1, Math.min(1, err * 3)); P.digitalSteer = false; } else C.aiControl(P, r, DT);
      const v0 = P.speed; r.step(DT); t += DT;
      if (!knocked && (!b.sleep || Math.hypot(b.x - x0, b.z - z0) > 0.3)) { knocked = true; hitV = v0; after = t; }
      if (knocked && t - after > 3) break;
    }
    const moved = Math.hypot(b.x - x0, b.z - z0), up = b.qw * b.qw - b.qx * b.qx - b.qy * b.qy + b.qz * b.qz;   // (up: the cosine of its tilt from upright)
    return { knocked, hitV, v: P.speed, moved, tilt: Math.acos(Math.max(-1, Math.min(1, up))) * 180 / Math.PI, dmg: P.dmg, fell: b.y < y0 - 0.2 };
  } finally { Math.random = orig; }
};
for (const kind of ['signalm', 'sign', 'lamp', 'hydrant', 'bin', 'cabinet', 'bollard']) {
  const o = ram(kind);
  check(`junctions: a car knocks the ${kind} over (it flies or falls) and drives on`, o.knocked && (o.moved > 1.5 || o.tilt > 40) && o.hitV > 8 && o.v > 5 && o.dmg < 0.25,
    `hit at ${(o.hitV * 3.6).toFixed(0)} km/h, ${(o.v * 3.6).toFixed(0)} km/h 3 s later; it moved ${o.moved.toFixed(1)} m, tilted ${o.tilt.toFixed(0)}°, damage ${o.dmg.toFixed(2)}`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
