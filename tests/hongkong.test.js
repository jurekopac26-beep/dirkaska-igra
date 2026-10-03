// Hong Kong: the street circuit on the Central Harbourfront (the layout of 2016-2019, clockwise). The track (a closed circuit, 1.86 km
// at full scale, six laps, traffic keeps left, the name), the ten turns in order and their directions (two hairpins), the pit lane on the
// left of the start straight (the entry on the outside of Turn 9; a car in for a stop drives in, stops at its box, is repaired and drives
// out), whole races of the AI in the dry and in the rain (every car to the flag), and the street furniture at the junctions (traffic
// lights, signs, bollards, bins, hydrants, cabinets, guard rails: Core's props): a car knocks it over and drives on.
//   node tests/hongkong.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'hongkong'), T = new C.Track(def);
const dS = (s) => { const L = T.len; let d = s - T.startS; d = ((d % L) + L) % L; return d; };

// 1. the track
check('track: Hong Kong, Kitajska (Hong Kong, China), a closed circuit (race and time trial), six laps, traffic on the left, no birds',
  def.name === 'Hong Kong, Kitajska' && def.en.name === 'Hong Kong, China' && !def.open && !def.test && def.laps === 6 && def.leftHand && def.noBirds && def.realKm === 1.86);
check('track: 1.86 km long in its real scale (within 1 % of the official 1.860 km)', Math.abs(T.len / 1860 - 1) < 0.01, `${T.len.toFixed(1)} m (${((T.len / 1860 - 1) * 100).toFixed(2)} %)`);
{ // the ten turns: in lap order, each the right way (R R L R R R L L R L), two hairpins (Turns 1 and 6)
  const DIR = [1, 1, -1, 1, 1, 1, -1, -1, 1, -1], cs = T.corners.slice().sort((a, b) => dS(a.s0) - dS(b.s0));
  const turns = def.turns.map(([x, z], k) => ({ k: k + 1, d: Math.round(dS(T.nearestIdx(x, z) * T.ds)) }));
  const own = turns.map(t => cs.find(c => { const a = dS(c.s0), b = a + (((c.i1 - c.i0 + T.N) % T.N) + 1) * T.ds; return t.d >= a - 4 && t.d <= b + 4; }));
  check('turns: ten corners, one at each numbered turn, in lap order, each turning the right way',
    cs.length === 10 && own.every(c => c) && new Set(own).size === 10 && turns.every((t, k) => k === 0 || t.d > turns[k - 1].d) && own.every((c, k) => c.dir === DIR[k]),
    turns.map((t, k) => `T${t.k}@${t.d} ${own[k] ? (own[k].dir > 0 ? 'R' : 'L') + Math.round(own[k].angle * 57.3) + '°' : '?'}`).join(', '));
  check('turns: Turns 1 and 6 hairpins (more than 160°), Turn 2 a 90° right, the start 250 m before Turn 1, the main straight 555 m',
    own[0].angle * 57.3 > 160 && own[5].angle * 57.3 > 160 && Math.abs(own[1].angle * 57.3 - 90) < 15 && Math.abs(turns[0].d - 250) < 15 && Math.abs(turns[1].d - turns[0].d - 600) < 60,
    `T1 ${Math.round(own[0].angle * 57.3)}°, T6 ${Math.round(own[5].angle * 57.3)}°, T2 ${Math.round(own[1].angle * 57.3)}°, T1 at ${turns[0].d} m, T1-T2 ${turns[1].d - turns[0].d} m`);
  check('HUD: the turns by their numbers only (Zavoj 1-10), no names of people, events or companies',
    T.names.filter(q => q.hud).map(q => q.n).join() === turns.map(t => 'Zavoj ' + t.k).join());
}

// 2. the pit lane: on the left of the start straight, from just past Turn 9 to past the start line
{
  const P = def.pit, a = T.pitAt(T.startS - 100), b = T.pitAt(T.startS), t9 = dS(T.nearestIdx(def.turns[8][0], def.turns[8][1]) * T.ds) - T.len;
  check('pits: a lane on the left (def.pit[0] < 0), from Turn 9 (its outside) over the start line, a box for the player before the line',
    P[0] < 0 && a && b && a.sg === -1 && !a.gap && Math.abs(P[1] - t9) < 60 && P[2] > 0 && P[3] < 0 && P[3] > P[1], `lane ${P[1]}..${P[2]} m, Turn 9 at ${Math.round(t9)} m, offset ${a && a.o.toFixed(1)} m`);
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 });
    r.start(); const P0 = r.player, ev = new Map(); let t = 0, k = 0;
    while (t < 260 && r.cars.some(c => !c.finished)) {
      Math.random = seeded(5000 + (++k));
      if (Math.abs(t - 40) < DT / 2) { P0.pitWant = true; r.cars.find(c => !c.isPlayer).pitWant = true; }
      C.aiControl(P0, r, DT); r.step(DT); t += DT;
      for (const c of r.cars) { if (c.pitEv) { if (!ev.has(c)) ev.set(c, []); ev.get(c).push(c.pitEv); c.pitEv = null; } if (c.isPlayer && (c.stuckT > 3 || c.wrongT > 3)) r.rescue(c); }
    }
    const seq = (c) => (ev.get(c) || []).join(' '), ok = (c) => /^enter box repair done exit/.test(seq(c)), ai = r.cars.find(c => !c.isPlayer && ev.has(c));
    check('pits: the player and an AI car in for a stop: into the lane, to the box, repaired, out again; all to the flag',
      ok(P0) && ai && ok(ai) && r.cars.every(c => c.finished), `player: ${seq(P0)}; AI: ${ai ? seq(ai) : '-'}`);
  } finally { Math.random = orig; }
}

// 3. whole races of the AI (12 AI cars and the player on the autopilot, six laps): every car to the flag, in the dry and in the rain
const race = (rain) => {
  const orig = Math.random; Math.random = seeded(3);
  try {
    const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: def.laps, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, rain });
    r.start(); const P = r.player; let t = 0, k = 0, resc = 0, nan = false;
    while (t < T.len * def.laps / 12 + 150 && r.cars.some(c => !c.finished)) {
      Math.random = seeded(5000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT;
      for (const c of r.cars) { if (!Number.isFinite(c.x + c.z + c.speed)) nan = true; if (c.isPlayer && (c.stuckT > 3 || c.wrongT > 3)) { r.rescue(c); resc++; } }
    }
    const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
    return { fin: fin.length, cars: r.cars.length, win: fin[0] ? fin[0].finishTime : null, resc, nan };
  } finally { Math.random = orig; }
};
{
  const d = race(0), w = race(1);
  check('race: six laps in the dry, every car to the flag, ~1 minute a lap', d.fin === d.cars && !d.nan && d.win > 6 * 45 && d.win < 6 * 75, `${d.fin}/${d.cars}, winner ${d.win && d.win.toFixed(1)} s, rescues ${d.resc}`);
  check('race: six laps in the rain, every car to the flag, slower than in the dry', w.fin === w.cars && !w.nan && w.win > d.win * 1.005 && w.win < d.win * 1.3, `${w.fin}/${w.cars}, winner ${w.win && w.win.toFixed(1)} s (dry ${d.win && d.win.toFixed(1)} s)`);
}

// 4. the street furniture at the junctions: the kinds exist, a car knocks them over and drives on (a little slower, a little damage at most)
{
  const kinds = ['tlight', 'sign', 'bollard', 'bin', 'hydrant', 'cabinet', 'rail'];
  check('junctions: the side streets the course crosses or turns at are listed (def.hk.jn), the blocks set back in some of them (def.wide)',
    def.hk.jn.length >= 8 && def.wide.length >= 6 && def.wide.every(([a, b, s, m]) => b > a && m > 0 && m <= 8));
  // on the main straight: the car on the autopilot, a piece of each kind standing on its racing line (one kind a lap)
  const res = [];
  for (const kind of kinds) {
    const orig = Math.random; Math.random = seeded(7);
    try {
      const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, damage: 2 });
      const d0 = 450, i = T.idx(T.startS + d0); r.setProps([{ kind, x: T.px[i] + T.nx[i] * T.rl[i], z: T.pz[i] + T.nz[i] * T.rl[i], yaw: T.hd[i], col: 0, i }]);
      r.start(); const P = r.player, b = r.props[0], x0 = b.x, z0 = b.z; let t = 0, k = 0, vIn = 0, vOut = 0;
      while (t < 90) { Math.random = seeded(9000 + (++k)); C.aiControl(P, r, DT); r.step(DT); r.stepProps(DT); t += DT; const d = dS(P.q.s);
        if (P.lap >= 1 && d > d0 - 12 && d < d0 - 8) vIn = P.speed; if (P.lap >= 1 && d > d0 + 15 && d < d0 + 19) { vOut = P.speed; break; } }
      res.push({ kind, moved: Math.hypot(b.x - x0, b.z - z0), vIn, vOut, dmg: P.dmg });
    } finally { Math.random = orig; }
  }
  check('props: a car at full speed knocks each piece over (it flies off), keeps going (no more than a quarter slower) with a little damage at most (under 10 %)',
    res.every(q => q.moved > 2 && q.vIn > 40 && q.vOut > 0.75 * q.vIn && q.dmg < 0.1),
    res.map(q => `${q.kind} ${q.moved.toFixed(0)} m, ${(q.vIn * 3.6).toFixed(0)}->${(q.vOut * 3.6).toFixed(0)} km/h, ${(q.dmg * 100).toFixed(0)} %`).join('; '));
}
console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
