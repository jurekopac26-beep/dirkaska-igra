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
  // 2. the plan: spike strips and roadblocks on straight stretches past the village (up among the hairpins a gentle bend will do), 1.4 km apart at
  //    least, none in the last 600 m; two strips first, then a roadblock and a strip in turn
  const P = r.pol.plan, straight = (s, rad, w) => { for (let d = -w; d <= w; d += 4) if (Math.abs(T.k[T.idx(s + d)]) > 1 / rad) return false; return true; };
  const kinds = P.map(e => e.kind).join(','), apart = P.every((e, k) => !k || e.s - P[k - 1].s > 1400);
  check('the plan: strips and roadblocks on straights past the village (gentle bends up among the hairpins), 1.4 km apart at least (two strips first, then a roadblock and a strip in turn)',
    P.length >= 5 && P[0].s - T.startS > 3300 && apart && P.every(e => straight(e.s, 200, 60) || (e.s - T.startS > 8500 && straight(e.s, 110, 40))) && P.every(e => e.s < T.finishS - 600) && /^spike,spike,block,spike,block/.test(kinds),
    P.map(e => e.kind + '@' + Math.round(e.s - T.startS)).join(' '));
  // 3. the game's difficulty: how many go for the player at once, how many at most, how long stopped by one to be busted
  const D = [0, 1, 2].map(k => new C.Race(T, opts({ difficulty: k })).pol.D);
  check('by the difficulty: more patrol cars going for the player at once, more of them, busted sooner', D[0].atk < D[2].atk && D[0].max < D[2].max && D[0].bust > D[1].bust && D[1].bust > D[2].bust && D[0].cool > D[2].cool,
    D.map(d => `${d.atk} at once, ${d.max} at most, busted in ${d.bust} s`).join(' | '));
  check('by the difficulty: harder to hide, the helicopter, the motorcyclists, the unmarked car and the heavy roadblock sooner (at a lower heat), more ambushes',
    D[0].hide < D[1].hide && D[1].hide < D[2].hide && D[0].heli > D[1].heli && D[1].heli > D[2].heli && D[0].moto > D[2].moto && D[0].uc > D[2].uc && D[0].heavy > D[1].heavy && D[1].heavy > D[2].heavy && D[0].amb < D[1].amb && D[1].amb < D[2].amb,
    D.map(d => `hide ${d.hide} s, heli ${d.heli}, moto ${d.moto}, unmarked ${d.uc}, heavy ${d.heavy}, ambushes ${d.amb}`).join(' | '));
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

// the new elements, each on its own: a race with the police at the normal difficulty, the seeded random numbers, the autopilot driving the player
// unless the part steers it itself
const mk = () => { Math.random = seeded(3); const r = new C.Race(T, opts({})); r.start(); Math.random = orig; return r; };
const put = (c, s, d, v) => { const i = T.idx(s); c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i]); c.y = c.py = c.roadY = T.hy[i]; c.vx = T.tx[i] * v; c.vz = T.tz[i] * v; c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s; c.dist = c.q.s - T.startS; };
const aim = (c, dd) => { const j = T.idx(c.q.s + 12), tx = T.px[j] + T.nx[j] * dd, tz = T.pz[j] + T.nz[j] * dd, ch = Math.cos(c.h), sh = Math.sin(c.h), lx = (tx - c.x) * ch + (tz - c.z) * sh, ly = -(tx - c.x) * sh + (tz - c.z) * ch;
  c.inSteer = Math.max(-1, Math.min(1, 18 * ly / (lx * lx + ly * ly))); };   // (along the road at dd across it)
let rk = 0;
const drive = (r, maxT, until, own) => { let t = 0; while (t < maxT && !(until && until())) { Math.random = seeded(7000 + (++rk)); if (own) own(); else if (!r.player.finished) C.aiControl(r.player, r, DT); r.step(DT); t += DT; } Math.random = orig; return t; };
const since = (r, n0, k) => r.pol.log.filter(e => e.n > n0 && e.k === k);

// 7. out of their sight: every patrol car in the chase 500 m behind, the hiding meter fills; after POL_DIFF.hide s they lose the player: those
//    cars search (no siren), the heat a star lower, nobody joins; one close behind again: found, the chase is on again
{
  const r = mk(), P = r.player, pol = r.pol, D = pol.D; drive(r, 40);
  for (const c of pol.cars) if (c.pol.mode === 'chase') put(c, P.q.s - 500, 2.3, 0);
  const n0 = pol.ev, h0 = pol.heat, tl = drive(r, 30, () => pol.lost), hl = pol.heat, modes = pol.cars.map(c => c.pol.mode).join(',');
  drive(r, 8); const joined = since(r, n0, 'join').length, still = pol.lost;
  const c = pol.cars.find(q => q.pol.mode === 'search'); put(c, P.q.s - 40, P.q.d, P.speed); const n1 = pol.ev; drive(r, 2, () => !pol.lost);
  check('out of sight (the patrol cars far behind): the hiding meter fills, after POL_DIFF.hide s they lose the player (searching, the heat a star lower, nobody joins); one close behind again: found',
    since(r, n0, 'lost').length === 1 && tl > D.hide - 0.5 && tl < D.hide + 4 && /^(search,?)+$/.test(modes) && hl < h0 - 0.6 && still && !joined && !pol.lost && since(r, n1, 'spotted').length === 1 && c.pol.mode === 'chase',
    `lost after ${tl.toFixed(1)} s out of sight (hide ${D.hide} s), heat ${h0.toFixed(2)} -> ${hl.toFixed(2)}, the cars ${modes}, ${joined} joined meanwhile; found again: ${!pol.lost}`);
}

// 8. the helicopter: from the heat POL_DIFF.heli on it flies in and then stays over the player while they drive (~30 m behind, some 30-60 m up);
//    nobody hides from it (the patrol cars far behind: no hiding); out of fuel it flies off (heliOut) and is gone, not back for a while
{
  const r = mk(), P = r.player, pol = r.pol; drive(r, 15); pol.cool = -3;
  const n0 = pol.ev, tIn = drive(r, 40, () => pol.heli && pol.heli.st === 'track'), H = pol.heli;
  for (const c of pol.cars) if (c.pol.mode === 'chase') put(c, P.q.s - 600, 2.3, 0);
  let dMax = 0, hMin = 1e9, hMax = 0, t0 = r.time;
  drive(r, 12, () => { if (r.time - t0 > 4 && H.st === 'track') { dMax = Math.max(dMax, Math.hypot(H.x - P.x, H.z - P.z)); const up = H.y - P.roadY; hMin = Math.min(hMin, up); hMax = Math.max(hMax, up); } return false; });
  const hid = pol.hide, lost = pol.lost; H.fuel = 0.05; const n1 = pol.ev; drive(r, 1); const out = H.st === 'out' && since(r, n1, 'heliOut').length === 1; drive(r, 27);
  check('the helicopter: from the heat POL_DIFF.heli on it flies in, stays over the player (~30 m behind, 30-60 m up) while they drive; nobody hides from it; out of fuel off and gone for a while',
    since(r, n0, 'heli').length === 1 && tIn < 30 && dMax < 70 && hMin > 25 && hMax < 75 && hid < 0.05 && !lost && out && !pol.heli && pol.heliCool > 0,
    `over the player after ${tIn.toFixed(1)} s, then within ${dMax.toFixed(0)} m, ${hMin.toFixed(0)}-${hMax.toFixed(0)} m up; the hiding meter ${hid.toFixed(2)}; out of fuel: ${out}, gone ${!pol.heli}`);
}

// 9. the ambushes by the huts (POL_DIFF.amb of them: Mihov dom, Erjavčeva koča, Koča na Gozdu, Ruski križ in that order): a patrol car waiting
//    off the asphalt with its lights off from 600 m before; after the player once they come within 110 m (ambush)
{
  const r = mk(), P = r.player, pol = r.pol, a = pol.amb[0]; drive(r, 3); put(P, a.s - 750, 1.5, 22);
  drive(r, 12, () => a.done); const w = a.car, waiting = !!w && w.pol.mode === 'wait' && Math.abs(w.q.d) > T.w;
  const n0 = pol.ev; let dWake = -1; drive(r, 40, () => { if (w.pol.mode !== 'wait' && dWake < 0) dWake = Math.hypot(P.x - w.x, P.z - w.z); return dWake >= 0; });
  check('the ambushes by the huts: a patrol car waiting off the road with its lights off, after the player once they come within 110 m',
    pol.amb.map(q => q.name).join() === 'Mihov dom,Erjavčeva koča,Koča na Gozdu' && waiting && dWake > 0 && dWake < 115 && since(r, n0, 'ambush').length === 1 && w.pol.mode === 'chase',
    `${pol.amb.map(q => q.name + '@' + Math.round(q.s - T.startS)).join(' ')}; waiting ${waiting} (${w ? w.q.d.toFixed(1) : '-'} m across), after them from ${dWake.toFixed(0)} m`);
}

// 10. a police motorcyclist: on the player's tail, never ramming them; knocked off by them it goes down: the rider thrown onto the road (one of
//     the traffic's people, in the police's colours), an offence: the heat up
{
  const r = mk(), P = r.player, pol = r.pol; drive(r, 3); put(P, T.startS + 4400, 1.5, 24);
  for (const v of r.tf.veh) v.off = true; drive(r, 3);   // (past the village, the traffic taken off: this is about the motorcyclist)
  const m = pol._car(P.q.s - 50, 2.3, 0, 'chase', 0, 'moto'), v0 = Math.min(28, P.speed); m.locked = false; m.vx = Math.cos(m.h) * v0; m.vz = Math.sin(m.h) * v0;
  let gMax = -1e9, gMin = 1e9; const t0 = r.time, n0 = pol.ev;
  drive(r, 20, () => { if (r.time - t0 > 6) { const g = P.q.s - m.q.s; gMax = Math.max(gMax, g); gMin = Math.min(gMin, g); } return m.pol.mode !== 'chase'; });
  const rams = since(r, n0, 'ram').filter(e => e.u === m.pol.unit).length, tail = m.pol.mode === 'chase' && gMax < 45 && gMin > -25;
  put(m, P.q.s + 30, P.q.d, 14); put(P, P.q.s + 20, P.q.d, 24); const h0 = pol.heat, n1 = pol.ev;
  drive(r, 2.5, () => m.pol.mode === 'down', () => { P.inThr = 1; P.inBrk = 0; aim(P, m.q.d); });
  const e = since(r, n1, 'motoDown')[0], rider = m.pol.rider;
  check('a police motorcyclist rides on the player\'s tail and never rams them; knocked off by them: down, the rider thrown, an offence (the heat up)',
    m.pol.kind === 'moto' && tail && !rams && m.pol.mode === 'down' && e && e.byP && !!rider && rider.pol === 1 && (rider.st === 'fly' || rider.st === 'down') && pol.off.moto === 1 && pol.heat > h0 + 0.25,
    `${(gMin === 1e9 ? '-' : gMin.toFixed(0))}-${gMax.toFixed(0)} m behind them, ${rams} rams; knocked: ${m.pol.mode} (${e ? e.why + (e.byP ? ', by the player' : '') : 'no event'}), rider ${rider ? rider.st : '-'}, heat ${h0.toFixed(2)} -> ${pol.heat.toFixed(2)}`);
}

// 11. the unmarked car (from the heat POL_DIFF.uc on): a dark saloon ~420 m ahead, on the uphill half of the road at the traffic's pace, no lights;
//     once the player comes up behind it: its hidden lights and siren on (undercover), after them
{
  const r = mk(), P = r.player, pol = r.pol; drive(r, 12); pol.cool = -2;
  drive(r, 8, () => pol.uc); const u = pol.uc, ahead = u ? u.q.s - P.q.s : 0, vs = [], dl = [], n0 = pol.ev;
  let gWake = null; drive(r, 90, () => { if (!u) return true; if (u.pol.mode === 'civil') { vs.push(u.speed); dl.push(u.q.d); } else if (gWake == null) gWake = u.q.s - P.q.s; return gWake != null; });
  const v = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0, right = dl.length ? dl.filter(d => d > 0.5).length / dl.length : 0;
  check('the unmarked car: ahead of the player on the uphill half at the traffic\'s pace, no lights; once they come up behind it, lights and siren, after them',
    !!u && u.pol.kind === 'uc' && ahead > 300 && ahead < 540 && v > 8 && v < 20 && right > 0.9 && gWake != null && gWake < 45 && gWake > -8 && since(r, n0, 'undercover').length === 1 && u.pol.mode === 'chase',
    `${ahead.toFixed(0)} m ahead, ${(v * 3.6).toFixed(0)} km/h, on the right half ${(right * 100).toFixed(0)} %, woken with the player ${gWake == null ? '-' : gWake.toFixed(0) + ' m'} behind it`);
}

// 12. a heavy roadblock (from the heat POL_DIFF.heavy on): the van across the road from one edge, a patrol car beside it, a spike strip over half of the
//     gap left at the other edge; the autopilot squeezes through the rest of the gap (the asphalt at the edge, the verge) without a flat
{
  const r = mk(), P = r.player, pol = r.pol; drive(r, 5); pol.cool = -3;
  const e = pol.plan.find(q => q.kind === 'block'); put(P, e.s - 520, 1.5, 22); const n0 = pol.ev; drive(r, 2, () => e.done);
  const van = pol.cars.find(c => c.pol.kind === 'van'), car = pol.cars.find(c => c.pol.block && c.pol.kind === 'car'), sp = pol.spikes.find(q => q.heavy), ev = since(r, n0, 'block')[0];
  const across = (c) => { const rel = c.h - Math.atan2(T.tz[c.q.i], T.tx[c.q.i]), W = c.m.len * Math.abs(Math.sin(rel)) + c.m.wid * Math.abs(Math.cos(rel)); return [c.q.d - W / 2, c.q.d + W / 2]; };
  let u0 = 0, u1 = 0, clean = 0, inGap = false;
  if (van && car && sp) { const a = across(van), b = across(car); u0 = Math.min(a[0], b[0]); u1 = Math.max(a[1], b[1]);
    inGap = sp.side < 0 ? sp.d0 >= u1 - 0.3 && sp.d1 < T.w : sp.d1 <= u0 + 0.3 && sp.d0 > -T.w; clean = sp.side < 0 ? T.w - sp.d1 : sp.d0 + T.w; }
  const t = drive(r, 60, () => P.q.s > e.s + 30 || pol.busted);
  check('a heavy roadblock: the van across the road, a patrol car beside it, a strip over half of the gap at the edge; the autopilot gets through the rest of it without a flat',
    !!ev && ev.heavy && !!van && !!car && !!sp && van.m.len > 5 && inGap && clean > 1.4 && clean < 2.4 && u1 - u0 > 8 && P.q.s > e.s + 30 && !P.flat,
    `the block ${u0.toFixed(1)}..${u1.toFixed(1)} m across, the strip ${sp ? sp.d0.toFixed(1) + '..' + sp.d1.toFixed(1) : '-'}, ${clean.toFixed(1)} m of asphalt left; through in ${t.toFixed(1)} s, flats ${P.flat || 0}`);
}

// 13. the offences: over 80 km/h where the village has sidewalks, a wheel on a sidewalk while moving, a crash into the traffic: counted (the rap sheet)
//     and the heat up
{
  const r = mk(), P = r.player, pol = r.pol, h0 = pol.heat;
  put(P, T.startS + 250, 1.5, 26); drive(r, 3, null, () => { P.inThr = 1; P.inBrk = 0; aim(P, 1.5); });
  const sp = pol.off.speed;
  put(P, T.startS + 700, T.w + 1.1, 9); drive(r, 2, null, () => { P.inThr = 0.3; P.inBrk = 0; aim(P, T.w + 1.1); });
  const wk = pol.off.walk;
  put(P, T.startS + 950, 1.8, 15); const v = r.tf._veh(1, 1, P.q.s + 18); v.d = v.dT = 1.8; v.v = 0; v.v0 = 0.2; r.tf._pose(v, 0);
  drive(r, 3, () => pol.off.crash > 0, () => { P.inThr = 0.6; P.inBrk = 0; aim(P, 1.8); });
  check('the offences: speeding through the village, driving on its sidewalk, a crash into the traffic: counted, and the heat up',
    sp > 2 && wk > 1 && pol.off.crash === 1 && pol.heat > h0 + 0.15,
    `speeding ${sp.toFixed(1)} s, on the sidewalk ${wk.toFixed(1)} s, crashes ${pol.off.crash}; heat ${h0.toFixed(2)} -> ${pol.heat.toFixed(2)}`);
}

// 14. the log piles (def.logs): the player knocking over the stake at the road's edge lets the logs go: they roll down the bank and across the road,
//     turning, and stop there; a patrol car that runs into them right after (it does not see them in time) is jolted, damaged, its tyres burst
{
  const r = mk(), P = r.player, pol = r.pol, L = pol.traps[1], ds = L.side * (T.w + 0.9), n0 = pol.ev;
  put(P, L.s - 25, ds, 12); drive(r, 4, () => L.st === 1, () => { P.inThr = 0.4; P.inBrk = 0; aim(P, ds); });
  drive(r, 4, null, () => { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; });
  const still = L.logs.every(g => g.v === 0), onRoad = L.logs.filter(g => Math.abs(g.d) < T.w - 0.3), turned = L.logs.filter(g => Math.abs(g.a) > 0.3).length;
  // a patrol car 28 m before them at the place across the road where the log nearest the middle lies, 22 m/s, going for the player (stopped 20 m past them there)
  const g = onRoad.slice().sort((a, b) => Math.abs(a.d) - Math.abs(b.d))[0] || L.logs[0];
  put(P, L.s + 20, g.d, 0); const c = pol._car(L.s - 28, g.d, 0, 'chase', 0); c.locked = false; c.vx = Math.cos(c.h) * 22; c.vz = Math.sin(c.h) * 22;
  const n1 = pol.ev; L.t = 0; drive(r, 3, () => c.q.s > L.s + 12, () => { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; });
  const hits = since(r, n1, 'logHit').filter(e => e.u === c.pol.unit).length;
  check('the log piles: knocking the stake over lets the logs go, they roll across the road and stop; a patrol car running into them right after: jolted, damaged, tyres burst',
    pol.traps.length === 4 && L.st === 1 && since(r, n0, 'logs').length === 1 && L.logs.length === 6 && still && onRoad.length >= 3 && turned >= 3 && hits >= 1 && c.dmg > 0.1 && c.speed < 20,
    `${onRoad.length} of 6 logs on the road (${turned} turned), all still ${still}; the patrol car: ${hits} knocks, damage ${c.dmg.toFixed(2)}, tyres ${c.flat || 0}, ${(c.speed * 3.6).toFixed(0)} km/h`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
