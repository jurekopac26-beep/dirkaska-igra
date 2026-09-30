// Tyre wear on the circuits with a pit lane (Core Race._wear, _tyreStop): the wear and the grip left, a short race and a long one, the
// AI's own tyre stops, new tyres at a stop, none of it on a circuit without a pit lane.
//   node tests/tyres.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const t0 = Date.now();
const race = (id, o) => { const d = C.TRACKS.find(t => t.id === id); const r = new C.Race(new C.Track(d), Object.assign({ numAI: 12, playerGrid: 12, laps: d.laps || 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o || {})); r.start(); return r; };
// a whole race: the autopilot drives the player (it never stops for tyres by itself); the tyre stops of the AI as they are called
const run = (r, drive) => {
  const stops = [], was = new Map(), T = r.track; let t = 0, k = 0;
  while (t < r.laps * T.len / 12 + 300 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(2000 + (++k)); if (drive) drive(r); C.aiControl(r.player, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) { c.hitCar = 0; c.hitWall = 0; if (c.pitWant && !was.get(c) && c.pitWhy === 'tyres') stops.push({ c, lap: c.lap, w: c.tyre }); was.set(c, c.pitWant); }
  }
  return stops;
};

// 1. the wear: more in a corner than on a straight, most in a slide; the grip: new 1, worn (1.0) about -9 %, then the cliff, never under 0.58
{ const r = race('gozd'), c = r.cars.find(x => !x.isPlayer), rate = (spd, wP, beta) => { c.tyre = 0.3; const sv = [c.vx, c.vz, c.wPath, c.beta]; c.vx = spd; c.vz = 0; c.wPath = wP; c.beta = beta; r._wear(c, 10); const d = c.tyre - 0.3; [c.vx, c.vz, c.wPath, c.beta] = sv; return d; };
  const st = rate(60, 0, 0), co = rate(30, 0.6, 0.06), sl = rate(30, 0.6, 0.45);
  check('wear: a straight < a corner < a slide', st > 0 && st < co && co < sl, `per 10 m: ${st.toExponential(2)}, ${co.toExponential(2)}, ${sl.toExponential(2)}`);
  const g = (w) => { c.tyre = w; r._wear(c, 0); return c.tg; }, G = [0, 0.5, 0.9, 1.0, 1.2, 1.5, 3].map(g);
  check('grip: 1 new, down 6 % when worn, then the cliff, never under 0.58', G[0] === 1 && G.every((v, k) => k === 0 || v <= G[k - 1]) && Math.abs(G[2] - 0.946) < 1e-9 && G[3] > 0.9 && G[4] < 0.8 && G[6] >= 0.58,
    G.map(v => v.toFixed(3)).join(' '));
}

// 2. a race of the usual length: the tyres last it (nobody stops for them), a fair part of them used; everybody at the flag
{ const out = [], bads = [];
  for (const [id, phys] of [['gozd', 'cs'], ['spa', 'arcade']]) {
    Math.random = seeded(11); const r = race(id, { phys }), stops = run(r), ai = r.cars.filter(c => !c.isPlayer), w = ai.map(c => c.tyre);
    const ok = !stops.length && r.cars.every(c => c.finished) && Math.min(...w) > 0.3 && Math.max(...w) < 1.0; if (!ok) bads.push(id);
    out.push(`${id}/${phys}: tyre stops ${stops.length}, AI wear at the flag ${Math.min(...w).toFixed(2)}-${Math.max(...w).toFixed(2)}`); }
  check('a race of the usual length: the tyres last it, nobody stops for them', !bads.length, out.join('; '));
}

// 3. a race three times as long (gozd, 9 laps): most of the AI stop once for tyres when they are about worn (not early, not in the last
//    lap), leave on new ones, everybody at the flag
{ Math.random = seeded(11); const r = race('gozd', { laps: 9 }), stops = run(r), ai = r.cars.filter(c => !c.isPlayer), by = new Set(stops.map(s => s.c));
  const ws = stops.map(s => s.w), inLast = stops.filter(s => s.lap >= r.laps).length, fin = r.cars.every(c => c.finished);
  check('a long race: most of the AI stop for tyres, once, when they are about worn', by.size >= ai.length * 0.6 && stops.length <= ai.length + 3 && Math.min(...ws) > 0.6 && Math.max(...ws) < 1.1 && !inLast,
    `${by.size} of ${ai.length} stopped (${stops.length} stops) at wear ${Math.min(...ws).toFixed(2)}-${Math.max(...ws).toFixed(2)}, ${inLast} in the last lap`);
  const fresh = [...by].every(c => (c.repairN || 0) >= 1);
  check('a long race: new tyres at the stop, everybody at the flag', fresh && fin, `${[...by].filter(c => (c.repairN || 0) >= 1).length}/${by.size} served, ${r.cars.filter(c => c.finished).length}/${r.cars.length} finished`);
}

// 4. the player in the pits (the autopilot, sent in on lap 2): new tyres at the stop, at least the tyre change's time standing
{ Math.random = seeded(5); const r = race('gozd'), P = r.player; let wIn = null, wOut = null, tIn = null, tOut = null;
  run(r, (r) => { if (P.lap === 2 && !P.repairN && !P.inPit) P.pitWant = true; if (P.repairN && !P.inPit) P.pitWant = false;
    if (P.pitState === 'repair' && wIn == null) { wIn = P.tyre; tIn = r.time; } if (P.pitState === 'done' && wOut == null) { wOut = P.tyre; tOut = r.time; } });
  check('the player in the pits: new tyres, at least 2.6 s for the change', wIn > 0.15 && wOut === 0 && tOut - tIn >= 2.6 - 1e-6, `wear ${wIn == null ? '-' : wIn.toFixed(2)} in, ${wOut == null ? '-' : wOut} out, ${tIn == null ? '-' : (tOut - tIn).toFixed(2)} s standing`);
}

// 5. a circuit without a pit lane: no wear, the grip stays
{ Math.random = seeded(3); const r = race('jezero'); for (let k = 0; k < 30 / DT; k++) { Math.random = seeded(3000 + k); C.aiControl(r.player, r, DT); r.step(DT); }
  check('no pit lane: no tyre wear', !r.tyres && r.cars.every(c => c.tyre === undefined && c.tg === 1), `tyres ${r.tyres}, grip ${[...new Set(r.cars.map(c => c.tg))].join(',')}`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks (${Math.round((Date.now() - t0) / 1000)} s)`);
process.exit(bad ? 1 : 0);
