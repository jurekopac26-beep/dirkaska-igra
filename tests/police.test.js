// The run from the police (Vršič, Race opts.police: race.pol): only in that mode; the player alone up the open road (the traffic a little
// thinner), one patrol car behind them at the start, more joining as the heat rises; spike strips and roadblocks planned on the straight
// stretches past the village; how hard by the game's difficulty. Whole runs on autopilot: the patrol cars join, knock the player's car,
// lay strips and block the road, some are wrecked; the autopilot mostly goes through the gaps and escapes over the pass. Stopped with a patrol
// car close by: busted. A tyre over a strip goes flat (the wheels over it, not the ones in the gap); flat tyres: less grip, more drag.
//   node tests/police.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'vrsic'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, damage: 2, police: true }, o);
const orig = Math.random;
const finite = (r) => r.pol.cars.every(c => Number.isFinite(c.x + c.z + c.vx + c.vz)) && Number.isFinite(r.player.x + r.player.z);

// 1. only in the run from the police; the player alone, one patrol car behind them, the traffic a little thinner than in the duel
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})), duel = new C.Race(T, opts({ police: false, traffic: true, numAI: 1, playerGrid: 2 })), race = new C.Race(T, opts({ police: false, numAI: 12, playerGrid: 12 })), tt = new C.Race(T, opts({ tt: true })), demo = new C.Race(T, opts({ noPlayer: true, numAI: 4 }));
  const pc = r.pol && r.pol.cars[0];
  check('only in the run from the police (race.pol): the player alone, one patrol car behind them (waiting for the start), the traffic too',
    r.pol && r.tf && r.cars.length === 1 && r.pol.cars.length === 1 && pc.police && pc.pol.mode === 'chase' && pc.locked && pc.q.s < r.player.q.s - 20 && !duel.pol && !race.pol && !tt.pol && !demo.pol,
    `${r.cars.length} car, ${r.pol ? r.pol.cars.length : 0} patrol car ${pc ? (r.player.q.s - pc.q.s).toFixed(0) + ' m behind' : ''}`);
  check('the traffic a little thinner than in the duel', r.tf.veh.length < duel.tf.veh.length && r.tf.veh.length > duel.tf.veh.length * 0.7, `${r.tf.veh.length} vehicles (the duel ${duel.tf.veh.length})`);
  // 2. the plan: spike strips and roadblocks on straight stretches past the village, 1.4 km apart at least; two strips first, then a roadblock and a strip in turn
  const P = r.pol.plan, straight = (s) => { for (let d = -60; d <= 60; d += 4) if (Math.abs(T.k[T.idx(s + d)]) > 1 / 200) return false; return true; };
  const kinds = P.map(e => e.kind).join(','), apart = P.every((e, k) => !k || e.s - P[k - 1].s > 1400);
  check('the plan: strips and roadblocks on straights past the village, 1.4 km apart at least (two strips first, then a roadblock and a strip in turn)',
    P.length >= 3 && P[0].s - T.startS > 3300 && apart && P.every(e => straight(e.s)) && /^spike,spike,block(,spike)?(,block)?/.test(kinds),
    P.map(e => e.kind + '@' + Math.round(e.s - T.startS)).join(' '));
  // 3. the game's difficulty: how many go for the player at once, how many at most, how long stopped by one to be busted
  const D = [0, 1, 2].map(k => new C.Race(T, opts({ difficulty: k })).pol.D);
  check('by the difficulty: more patrol cars going for the player at once, more of them, busted sooner', D[0].atk < D[2].atk && D[0].max < D[2].max && D[0].bust > D[1].bust && D[1].bust > D[2].bust && D[0].cool > D[2].cool,
    D.map(d => `${d.atk} at once, ${d.max} at most, busted in ${d.bust} s`).join(' | '));
  Math.random = orig;
}

// 4. whole runs on autopilot (three races, three seeds): they join, knock the player's car, lay strips, block the road, some are wrecked;
//    the autopilot mostly goes through the gaps and escapes over the pass (the police do catch it now and then: a knock onto a strip, boxed in)
{
  const runs = [11, 12, 13].map(seed => {
    Math.random = seeded(3);
    const r = new C.Race(T, opts({ seed })), P = r.player, pol = r.pol; r.start();
    let t = 0, k = 0, ev = 0, resc = 0, nan = false; const evs = {};
    while (t < 900 && !P.finished) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
      if (pol.ev !== ev) { ev = pol.ev; evs[pol.evK] = (evs[pol.evK] || 0) + 1; }
      if (k % 60 === 0 && !finite(r)) nan = true;
    }
    Math.random = orig;
    return { seed, evs, nan, heat: pol.heatMax, escaped: pol.escaped && !pol.busted && P.finished && evs.escaped === 1, busted: pol.busted, flat: P.flat || 0, t, at: P.q.s - T.startS, resc };
  });
  const all = {}; for (const r of runs) for (const k in r.evs) all[k] = (all[k] || 0) + r.evs[k];
  check('whole runs on autopilot: patrol cars join, knock the car, lay spike strips, block the road, some wrecked; the heat up to 3 stars or more',
    runs.every(r => (r.evs.join || 0) >= 2 && (r.evs.ram || 0) >= 3 && (r.evs.spikes || 0) >= 1 && !r.nan) && (all.block || 0) >= 2 && (all.wreck || 0) >= 3 && runs.every(r => r.heat >= 3), JSON.stringify(all) + ', heat ' + runs.map(r => r.heat.toFixed(1)).join(' / '));
  check('the autopilot mostly goes through the gaps (no flat tyre) and escapes over the pass (two of three runs at least)', runs.filter(r => r.escaped).length >= 2 && runs.filter(r => !r.flat).length >= 2,
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m, flats ${r.flat}, rescues ${r.resc}`).join('; '));
}

// 5. stopped with a patrol car close by: busted (the meter fills in the difficulty's seconds)
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player, pol = r.pol; r.start();
  let t = 0, k = 0, tStop = 0, ev = 0, evK = '';
  while (t < 120 && !P.finished) {
    Math.random = seeded(5000 + (++k));
    if (t > 20) { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; P.noReverse = true; if (!tStop && P.speed < 0.5) tStop = t; } else C.aiControl(P, r, DT);   // (holding the car stopped: the brake, no reverse)
    r.step(DT); t += DT;
    if (pol.ev !== ev) { ev = pol.ev; evK = pol.evK; }
  }
  Math.random = orig;
  check('stopped with a patrol car close by: busted within seconds (the meter), the run over', pol.busted && P.finished && P.busted && evK === 'busted' && t - tStop < 20 && t - tStop > 1,
    `stopped at ${tStop.toFixed(1)} s, busted at ${t.toFixed(1)} s`);
}

// 6. a spike strip: the tyres that roll over it go flat, the ones in its gap do not; flat tyres: less grip and more drag (both physics)
{
  const over = (d, phys) => {
    Math.random = seeded(3);
    const r = new C.Race(T, opts({ phys })), P = r.player, pol = r.pol; r.start();
    const s0 = pol.plan[0].s - 60, i = T.idx(s0); P.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i]); P.y = P.py = P.roadY = T.hy[i]; P.vx = T.tx[i] * 16; P.vz = T.tz[i] * 16; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s;
    pol.cars.length = 0; for (const v of r.tf.veh) if (Math.abs(v.s - s0) < 300) v.off = true;
    pol.plan[0].done = true; pol._spike(pol.plan[0].s); const sp = pol.spikes[0];
    const dd = d === 'gap' ? (sp.side > 0 ? sp.d0 - 1.5 : sp.d1 + 1.5) : 0.5 * (sp.d0 + sp.d1);
    if (d === 'gap' || d !== dd) { P.place(T.px[i] + T.nx[i] * dd, T.pz[i] + T.nz[i] * dd, T.hd[i]); P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; }
    for (let k = 0; k < 120 * 6; k++) { const j = T.idx(P.q.s + 12), tx = T.px[j] + T.nx[j] * dd, tz = T.pz[j] + T.nz[j] * dd, ch = Math.cos(P.h), sh = Math.sin(P.h), lx = (tx - P.x) * ch + (tz - P.z) * sh, ly = -(tx - P.x) * sh + (tz - P.z) * ch;
      P.inSteer = Math.max(-1, Math.min(1, 18 * ly / (lx * lx + ly * ly))); P.inThr = P.speed < 16 ? 0.6 : 0; P.inBrk = 0; r.step(DT); }
    Math.random = orig;
    return { flat: P.flat || 0, on: sp.on, past: P.q.s - sp.s };
  };
  const a = over('mid', 'cs'), b = over('gap', 'cs');
  check('a spike strip: all four tyres over it go flat; through its gap none', a.flat === 15 && b.flat === 0 && a.past > 6 && b.past > 6, `over it: flat bits ${a.flat}, through the gap: ${b.flat} (${a.past.toFixed(0)} / ${b.past.toFixed(0)} m past it)`);
  // flat tyres: up the road from the straight after the first strip, full throttle (steered along the middle) for 6 s from 15 m/s: slower with them
  const run = (phys, flat) => {
    Math.random = seeded(3);
    const r = new C.Race(T, opts({ phys, police: false })), P = r.player; r.start();
    const i = T.idx(T.startS + 3480); P.place(T.px[i], T.pz[i], T.hd[i]); P.y = P.py = P.roadY = T.hy[i]; P.vx = T.tx[i] * 15; P.vz = T.tz[i] * 15; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.flat = flat;
    for (let k = 0; k < 120 * 6; k++) { const j = T.idx(P.q.s + 12), tx = T.px[j], tz = T.pz[j], ch = Math.cos(P.h), sh = Math.sin(P.h), lx = (tx - P.x) * ch + (tz - P.z) * sh, ly = -(tx - P.x) * sh + (tz - P.z) * ch;
      P.inSteer = Math.max(-1, Math.min(1, 18 * ly / (lx * lx + ly * ly))); P.inThr = 1; P.inBrk = 0; r.step(DT); }
    Math.random = orig;
    return { v: P.speed, s: P.q.s - T.startS - 3480 };
  };
  const res = ['cs', 'arcade'].map(ph => ({ ph, ok: run(ph, 0), fl: run(ph, 15) }));
  check('flat tyres: the car is slower (both physics)', res.every(x => x.fl.s < x.ok.s * 0.85), res.map(x => `${x.ph}: ${x.ok.s.toFixed(0)} m in 6 s, with flat tyres ${x.fl.s.toFixed(0)} m`).join(', '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
