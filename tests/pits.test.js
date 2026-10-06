// The pit lane (Core only, no browser), on every circuit with pits: the 13 crews' boxes (Track.crewBoxes: along def.pitRow every 10 m, where
// the lane runs full width), the player's (def.pit[3]) one of them, every AI car its own other one; the autopilot drives the lane in its middle,
// turns in to the box on the apron in front of the garage (the car stops there nose in, towards the garage; Core's wall lets it in there and
// nowhere else along the lane) and out again. On the pit road (from leaving the circuit's asphalt into the way in until back on it past the
// way out) a car is a ghost to every other one (no contact) and takes no damage; once back on the circuit it is solid again (at the latest
// 6 s on). A long race with fuel and tyres: the whole field through the lane, every car stops in its own box on the apron, nobody touches
// anybody there, nobody is damaged there, the ghosts keep out of each other (they drop back behind the car ahead), all to the line.
//   node tests/pits.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const PITS = C.TRACKS.filter(d => d.pit && !d.open);
const deg = (a) => a * 180 / Math.PI;

// 1. the boxes: 13 crews' boxes 10 m apart where the lane runs full width; the player's one of them, the 12 AI cars each in another one
{
  const res = PITS.map(d => { const T = new C.Track(d), P = d.pit, B = T.crewBoxes(), r = new C.Race(T, { numAI: 12, playerGrid: 7, laps: 2, playerModel: C.MODELS[4], phys: 'cs', seed: 5 });
    const ai = r.cars.filter(c => !c.isPlayer).map(c => r._aiBox(c)), k = B.indexOf(P[3]);
    return { id: d.id, ok: !!d.pitRow && B.length === 13 && B.every((b, i) => !i || b - B[i - 1] === 10) && B.every(b => T.pitAt(T.startS + b).t > 0.999) && k >= 0 && new Set(ai).size === 12 && ai.every(b => B.includes(b) && b !== P[3]), k }; });
  check('the boxes: 13 crews\' boxes 10 m apart (pitRow) where the lane runs full width; the player\'s one of them, each AI car in another of its own', res.every(x => x.ok), res.map(x => `${x.id} ${x.ok ? 'player in box ' + (x.k + 1) : 'NO'}`).join(', '));
}

// 2. a stop on every circuit with pits: the autopilot in the lane, the box on the apron, nose in
{
  const out = [];
  for (const d of PITS) {
    const T = new C.Track(d), P = d.pit, orig = Math.random; Math.random = seeded(7);
    try {
      const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 4, difficulty: 1, damage: 2 });
      r.start(); const pl = r.player; let t = 0, k = 0, asked = false, pose = null, dev = 0, wall = 0, rep = false, lane0 = null, laneT = 0, ghost = 0, outT = null;
      while (t < 600 && !(rep && !pl.inPit && !pl.pitG)) {
        Math.random = seeded(9000 + (++k));
        if (!asked && pl.lap >= 1 && !T.pitAt(pl.q.s)) { asked = true; pl.pitWant = true; pl.dmg = 0.3; }   // (damaged on the first lap: in at its end)
        C.aiControl(pl, r, DT); r.step(DT); t += DT;
        if (pl.inPit) { if (lane0 == null) lane0 = t; laneT = t - lane0; if (pl.pitG) ghost++; if (pl.hitWall > 0.5) wall++; }
        pl.hitWall = 0; pl.hitCar = 0;
        const p = T.pitAt(pl.q.s); if (pl.inPit && p && !p.gap && T.boxX(pl.q.s, P[3]) < -25 && !pl.pitDone) dev = Math.max(dev, Math.abs(pl.q.d - p.o));   // (before the turn in)
        if (pl.pitState === 'repair' && !pose) { let a = pl.h - Math.atan2(pl.q.tz, pl.q.tx); a = Math.atan2(Math.sin(a), Math.cos(a)); pose = { x: T.boxX(pl.q.s, P[3]), out: pl.q.d - p.lout, yaw: deg(a) }; }
        if (pl.pitDone) rep = true;
        if (rep && !pl.inPit && outT == null) outT = t;
      }
      out.push({ id: d.id, pose, dev, wall, rep, dmg: pl.dmg, laneT, ghost, solid: !pl.pitG, back: outT != null && t - outT <= 6.05 });
    } finally { Math.random = orig; }
  }
  const f1 = (x) => x.toFixed(1);
  check('a stop on every circuit with pits: in the middle of the lane on the autopilot, into the box, repaired, out again', out.every(x => x.rep && x.dmg < 0.05 && x.dev < 0.8),
    out.map(x => `${x.id} ${x.rep ? 'repaired' : 'NO STOP'} (${f1(x.dev)} m off the middle, ${f1(x.laneT)} s in the lane)`).join(', '));
  check('the box on the apron in front of the garage: the car stops 2.5-5.5 m past the lane\'s outer edge, within 4 m of the box, nose in 12-35° towards the garage',
    out.every(x => x.pose && x.pose.out > 2.5 && x.pose.out < 5.5 && Math.abs(x.pose.x) < 4 && x.pose.yaw > 12 && x.pose.yaw < 35),
    out.map(x => x.pose ? `${x.id} ${f1(x.pose.out)} m out, ${f1(x.pose.x)} m along, ${f1(x.pose.yaw)}°` : `${x.id} -`).join(', '));
  check('in and out of the box without touching a wall', out.every(x => x.wall === 0), out.filter(x => x.wall).map(x => `${x.id} ${x.wall} steps`).join(', ') || 'none');
  check('a ghost all the way through the lane, solid again within 6 s of leaving it', out.every(x => x.ghost > 0 && x.solid && x.back), out.map(x => `${x.id} ${x.solid && x.back ? 'ok' : 'STILL A GHOST'}`).join(', '));
}

// 3. a long race with fuel and tyres (Toskana and Rio, damage on): the whole field through the pit lane, every car in for fuel, each stops in its
// own box on the apron nose in; on the pit road nobody touches anybody and nobody is damaged, the ghosts keep out of each other; everybody to
// the line, no ghost left
const ov = (a, b) => { const dx = b.x - a.x, dz = b.z - a.z, ch = Math.cos(a.h), sh = Math.sin(a.h), lx = dx * ch + dz * sh, lz = -dx * sh + dz * ch; return Math.abs(lx) < (a.m.len + b.m.len) * 0.5 - 0.3 && Math.abs(lz) < (a.m.wid + b.m.wid) * 0.5 - 0.2; };   // (two cars in each other)
for (const [tid, laps] of [['toskana', 6], ['rio', 5]]) {
  const T = new C.Track(C.TRACKS.find(d => d.id === tid)), orig = Math.random; Math.random = seeded(7);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 13, laps, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 5, difficulty: 1, damage: 2, tyres: true, fuel: true }); r.start();
    const P = r.player; let t = 0, k = 0, hits = 0, dmg = 0, stops = 0, ghost = 0, wasHit = 0, inBay = 0, ovT = 0, ovMax = 0;
    const was = new Map(), dm = new Map(), run = new Map();
    while (t < 1500 && !r.cars.every(c => c.finished)) {
      Math.random = seeded(5000 + (++k));
      if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      for (const c of r.cars) {
        if (c.pitG) { ghost++; if (c.hitCar > 0) hits++; if (dm.has(c) && c.dmg > dm.get(c) + 1e-9) dmg += c.dmg - dm.get(c); }
        if (c.hitCar > 0 && c.inPit) wasHit++;
        dm.set(c, c.dmg);
        if (c.pitState === 'repair' && was.get(c) !== 'repair') { stops++; const p = T.pitAt(c.q.s); let a = c.h - Math.atan2(c.q.tz, c.q.tx); a = Math.atan2(Math.sin(a), Math.cos(a)); if (p && c.q.d - p.lout > 2 && a > 0.2 && Math.abs(T.boxX(c.q.s, r._boxD(c))) < 4) inBay++; }   // (on the apron: 2 m and more past the lane's edge (the first box, where the lane has only just come to its full width: a little less far in), nose in)
        was.set(c, c.pitState); c.hitCar = 0; c.hitWall = 0;
      }
      const cs = r.cars;
      for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const a = cs[i], b = cs[j], key = i * 100 + j;
        if ((a.pitG || b.pitG) && ov(a, b)) { ovT += DT; const v = (run.get(key) || 0) + DT; run.set(key, v); ovMax = Math.max(ovMax, v); } else run.delete(key); }
    }
    check(`a long race with fuel (${tid}): every car in, each stops in its own box on the apron nose in; on the pit road no contact and no damage, all to the line, no ghost left`,
      stops >= 12 && inBay === stops && ghost > 0 && hits === 0 && wasHit === 0 && dmg === 0 && r.cars.every(c => c.finished) && r.cars.every(c => !c.pitG),
      `${stops} stops (${inBay} in the box on the apron), ${(ghost * DT).toFixed(0)} car-seconds as ghosts, ${hits + wasHit} contacts and ${dmg.toFixed(3)} damage on the pit road, ${r.cars.filter(c => c.finished).length}/${r.cars.length} at the line in ${t.toFixed(0)} s`);
    check(`... (${tid}) the ghosts keep out of each other: hardly ever two in each other (a moment where two come in side by side)`, ovT < 5 && ovMax < 2, `${ovT.toFixed(1)} car-pair-seconds in each other, at most ${ovMax.toFixed(1)} s at a time`);
  } finally { Math.random = orig; }
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
