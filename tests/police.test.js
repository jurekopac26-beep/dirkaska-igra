// The run from the police (Vršič, Race opts.police: race.pol): only in that mode; the player alone up the open road (the traffic a little
// thinner), nobody after them at the start but a traffic checkpoint in Kranjska Gora (stopping there: the documents, parked at the roadside,
// arrested; driving off or through: the chase), more patrol cars joining as the heat rises; spike strips and roadblocks planned on the
// straight stretches past the village; how hard by the game's difficulty (four levels). Whole runs on autopilot: through the checkpoint, the
// patrol cars join, knock the player's car, lay strips and block the road, some are wrecked; the autopilot mostly gets through to the
// building at the top (the mission). Stopped with a patrol car close by: busted. A tyre over a strip goes flat (the wheels over it, not the
// ones in the gap); flat tyres: less grip, more drag. The contacts as in GTA V (no bounce, the PIT spins a car). Down a side road: the police
// come in after the player and pin them at its dead end. A road without a checkpoint or a building (Los Caracoles): the chase from the start,
// the escape over the finish.
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
  const pc = r.pol && r.pol.cars[0], K = r.pol && r.pol.chk;
  check('only in the run from the police (race.pol): the player alone on the right lane, nobody after them (the stage "free"), the checkpoint\'s patrol car parked ahead in Kranjska Gora, the traffic too',
    r.pol && r.tf && r.cars.length === 1 && r.pol.cars.length === 1 && pc.police && pc.pol.mode === 'park' && pc.pol.chk && pc.q.s > r.player.q.s + 500 && r.pol.stage === 'free' && K.st === 'wait' && r.player.q.d > 2 && !duel.pol && !race.pol && !tt.pol && !demo.pol,
    `${r.cars.length} car, ${r.pol ? r.pol.cars.length : 0} patrol car ${pc ? (pc.q.s - r.player.q.s).toFixed(0) + ' m ahead, ' + pc.pol.mode : ''}, stage ${r.pol && r.pol.stage}, the player ${r.player.q.d.toFixed(1)} m right of the middle`);
  check('the traffic a little thinner than in the duel', r.tf.veh.length < duel.tf.veh.length && r.tf.veh.length > duel.tf.veh.length * 0.7, `${r.tf.veh.length} vehicles (the duel ${duel.tf.veh.length})`);
  // 2. the plan: spike strips and roadblocks on straight stretches past the village (up among the hairpins a gentle bend will do), 1.4 km apart at
  //    least, none in the last 600 m; two strips first, then a roadblock and a strip in turn
  const P = r.pol.plan, straight = (s, rad, w) => { for (let d = -w; d <= w; d += 4) if (Math.abs(T.k[T.idx(s + d)]) > 1 / rad) return false; return true; };
  const kinds = P.map(e => e.kind).join(','), apart = P.every((e, k) => !k || e.s - P[k - 1].s > 1400);
  check('the plan: strips and roadblocks on straights past the village (gentle bends up among the hairpins), 1.4 km apart at least (two strips first, then a roadblock and a strip in turn)',
    P.length >= 5 && P[0].s - T.startS > 3300 && apart && P.every(e => straight(e.s, 200, 60) || (e.s - T.startS > 8500 && straight(e.s, 110, 40))) && P.every(e => e.s < T.finishS - 600) && /^spike,spike,block,spike,block/.test(kinds),
    P.map(e => e.kind + '@' + Math.round(e.s - T.startS)).join(' '));
  // 3. the game's difficulty: how many go for the player at once, how many at most, how long stopped by one to be busted
  const D = [0, 1, 2, 3].map(k => new C.Race(T, opts({ difficulty: k })).pol.D), up = (f) => D.every((d, k) => !k || f(D[k - 1], d));
  check('by the difficulty (lahka, srednja, težka, super težka): more patrol cars going for the player at once, more of them, busted sooner, pushing longer',
    D[0].atk < D[3].atk && up((a, b) => a.max <= b.max && a.bust > b.bust && a.cool > b.cool && a.pit < b.pit && a.join > b.join) && D[0].max < D[3].max,
    D.map(d => `${d.atk} at once, ${d.max} at most, busted in ${d.bust} s, PIT ${d.pit} s`).join(' | '));
  check('by the difficulty: harder to hide, the helicopter, the motorcyclists, the unmarked car and the heavy roadblock sooner (at a lower heat), more ambushes, strips and roadblocks closer together',
    up((a, b) => a.hide < b.hide && a.heli > b.heli && a.moto > b.moto && a.uc > b.uc && a.heavy > b.heavy && a.amb < b.amb && a.gap >= b.gap) && D[0].gap > D[3].gap,
    D.map(d => `hide ${d.hide} s, heli ${d.heli}, moto ${d.moto}, unmarked ${d.uc}, heavy ${d.heavy}, ambushes ${d.amb}, plan every ${d.gap} m`).join(' | '));
  const old = [{ atk: 2, bust: 3, hide: 14 }, { atk: 2, bust: 2.5, hide: 18 }];   // (the old normal and hard)
  check('the old normal is the new easy, the old hard the new medium; a race (not the police) takes super težka as težka',
    D[0].bust === old[0].bust && D[0].hide === old[0].hide && D[1].bust === old[1].bust && D[1].hide === old[1].hide && new C.Race(T, opts({ police: false, numAI: 3, difficulty: 3 })).diff === new C.Race(T, opts({ police: false, numAI: 3, difficulty: 2 })).diff,
    `easy: busted in ${D[0].bust} s, lost after ${D[0].hide} s; medium: ${D[1].bust} s, ${D[1].hide} s`);
  Math.random = orig;
}

// 4. whole runs on autopilot at the easy level (three races, three seeds; the medium one is the old hard: the autopilot, which does not dodge,
//    rarely makes it there): through the checkpoint (the chase begins), they join, knock the player's car, lay strips, block the road, some are
//    wrecked; the autopilot mostly goes through the gaps and into the building at the top (the police do catch it now and then: pinned, boxed in)
{
  const runs = [11, 12, 13].map(seed => {
    Math.random = seeded(3);
    const r = new C.Race(T, opts({ seed, difficulty: 0 })), P = r.player, pol = r.pol; r.start();
    let t = 0, k = 0, ev = 0, resc = 0, nan = false; const evs = {};
    while (t < 900 && !P.finished) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
      if (pol.ev !== ev) { for (const e of pol.log) if (e.n > ev) evs[e.k] = (evs[e.k] || 0) + 1; ev = pol.ev; }
      if (k % 60 === 0 && !finite(r)) nan = true;
    }
    Math.random = orig;
    return { seed, evs, nan, heat: pol.heatMax, rams: pol.rams, wrecked: pol.wrecked, escaped: pol.escaped && !pol.busted && P.finished && evs.hideout === 1 && evs.fled === 1, busted: pol.busted, flat: P.flat || 0, t, at: P.q.s - T.startS, resc };
  });
  const all = {}; for (const r of runs) for (const k in r.evs) all[k] = (all[k] || 0) + r.evs[k];
  const rams = runs.reduce((a, r) => a + r.rams, 0), wrecked = runs.reduce((a, r) => a + r.wrecked, 0);
  check('whole runs on autopilot: the checkpoint\'s car and more patrol cars after it, knocking the car (pushes and PITs, as in GTA V: no rams at full speed), laying spike strips, blocking the road, some wrecked; the heat up to 3 stars or more',
    runs.every(r => (r.evs.join || 0) >= 1 && r.rams >= 2 && (r.evs.spikes || 0) >= 1 && !r.nan) && rams >= 10 && (all.block || 0) >= 2 && wrecked >= 3 && runs.every(r => r.heat >= 3),
    `knocks ${runs.map(r => r.rams).join(' + ')}, wrecked ${runs.map(r => r.wrecked).join(' + ')}, ` + JSON.stringify(all) + ', heat ' + runs.map(r => r.heat.toFixed(1)).join(' / '));
  check('the autopilot drives through the checkpoint (the chase begins), mostly goes through the gaps (no flat tyre) and into the building at the top (two of three runs at least)', runs.filter(r => r.escaped).length >= 2 && runs.filter(r => !r.flat).length >= 2,
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m, flats ${r.flat}, rescues ${r.resc}`).join('; '));
}

// 5. stopped with a patrol car close by: busted (the meter fills in the difficulty's seconds)
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player, pol = r.pol; r.start();
  let t = 0, k = 0, tStop = 0, ev = 0, evK = '', tF = -1;
  while (t < 120 && !P.finished) {
    Math.random = seeded(5000 + (++k));
    if (tF < 0 && pol.stage === 'chase') tF = t;
    if (tF >= 0 && t > tF + 4) { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; P.noReverse = true; if (!tStop && P.speed < 0.5) tStop = t; } else C.aiControl(P, r, DT);   // (holding the car stopped: the brake, no reverse)
    r.step(DT); t += DT;
    if (pol.ev !== ev) { ev = pol.ev; evK = pol.evK; }
  }
  Math.random = orig;
  check('stopped with a patrol car close by: busted within seconds (the meter), the run over', pol.busted && P.finished && P.busted && evK === 'busted' && t - tStop < 20 && t - tStop > 1,
    `stopped at ${tStop.toFixed(1)} s, busted at ${t.toFixed(1)} s`);
}

// 6. a spike strip: the tyres that roll over it go flat, the ones in its gap do not; flat tyres: less grip and more drag
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
  const run = (flat) => {
    Math.random = seeded(3);
    const r = new C.Race(T, opts({ police: false })), P = r.player; r.start();
    const i = T.idx(T.startS + 3480); P.place(T.px[i], T.pz[i], T.hd[i]); P.y = P.py = P.roadY = T.hy[i]; P.vx = T.tx[i] * 15; P.vz = T.tz[i] * 15; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.flat = flat;
    for (let k = 0; k < 120 * 6; k++) { const j = T.idx(P.q.s + 12), tx = T.px[j], tz = T.pz[j], ch = Math.cos(P.h), sh = Math.sin(P.h), lx = (tx - P.x) * ch + (tz - P.z) * sh, ly = -(tx - P.x) * sh + (tz - P.z) * ch;
      P.inSteer = Math.max(-1, Math.min(1, 18 * ly / (lx * lx + ly * ly))); P.inThr = 1; P.inBrk = 0; r.step(DT); }
    Math.random = orig;
    return { v: P.speed, s: P.q.s - T.startS - 3480 };
  };
  const ok = run(0), fl = run(15);
  check('flat tyres: the car is slower', fl.s < ok.s * 0.85, `${ok.s.toFixed(0)} m in 6 s, with flat tyres ${fl.s.toFixed(0)} m`);
}

// the new elements, each on its own: a race with the police at the normal difficulty, the seeded random numbers, the autopilot driving the player
// unless the part steers it itself
const mk = (free) => { Math.random = seeded(3); const r = new C.Race(T, opts({})); r.start(); if (!free) r.pol._flee('skip'); Math.random = orig; return r; };   // (free: still before the checkpoint; else the chase on, as if the player had driven through it)
const put = (c, s, d, v) => { const i = T.idx(s); c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i]); c.y = c.py = c.roadY = T.hy[i]; c.vx = T.tx[i] * v; c.vz = T.tz[i] * v; c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s; c.dist = c.q.s - T.startS; };
const aim = (c, dd) => { const j = T.idx(c.q.s + 12), tx = T.px[j] + T.nx[j] * dd, tz = T.pz[j] + T.nz[j] * dd, ch = Math.cos(c.h), sh = Math.sin(c.h), lx = (tx - c.x) * ch + (tz - c.z) * sh, ly = -(tx - c.x) * sh + (tz - c.z) * ch;
  c.inSteer = Math.max(-1, Math.min(1, 18 * ly / (lx * lx + ly * ly))); };   // (along the road at dd across it)
let rk = 0;
const drive = (r, maxT, until, own) => { let t = 0; while (t < maxT && !(until && until())) { Math.random = seeded(7000 + (++rk)); if (own) own(); else if (!r.player.finished) { C.aiControl(r.player, r, DT); if (r.player.stuckT > 3 || r.player.wrongT > 3) r.rescue(r.player); } r.step(DT); t += DT; } Math.random = orig; return t; };
const since = (r, n0, k) => r.pol.log.filter(e => e.n > n0 && e.k === k);

// 7. out of their sight: every patrol car in the chase 500 m behind, the hiding meter fills; after POL_DIFF.hide s they lose the player: those
//    cars search (no siren), the heat a star lower, nobody joins; one close behind again: found, the chase is on again
{
  const r = mk(), P = r.player, pol = r.pol, D = pol.D; drive(r, 40);
  pol.cars = pol.cars.filter(c => c.pol.mode === 'chase'); pol.uc = null; pol.ucN = 9; pol.amb.forEach(a => { a.done = true; }); pol.heli = null; pol.heliCool = 1e9;   // (only the chase: no unmarked car, ambush or helicopter to see them)
  for (const c of pol.cars) put(c, P.q.s - 500, 2.3, 0);
  const D0 = pol.D; pol.D = Object.assign({}, D0, { join: 1e9 });   // (nobody joins meanwhile: this is about hiding from the ones there)
  let h0 = pol.heat; const n0 = pol.ev, tl = drive(r, 30, () => { if (pol.lost) return true; h0 = pol.heat; return false; }), hl = pol.heat, modes = pol.cars.map(c => c.pol.mode).join(',');   // (h0: the heat the step before)
  pol.D = D0; pol.joinT = D0.join + 1; const nL = pol.ev; drive(r, 8); const joined = since(r, nL, 'join').length, still = pol.lost;
  const c = pol.cars.find(q => q.pol.mode === 'search') || pol.cars[0]; put(c, P.q.s - 40, P.q.d, P.speed); const n1 = pol.ev; drive(r, 2, () => !pol.lost);
  check('out of sight (the patrol cars far behind): the hiding meter fills, after POL_DIFF.hide s they lose the player (searching, the heat a star lower, nobody joins); one close behind again: found',
    since(r, n0, 'lost').length === 1 && tl > D.hide - 0.5 && tl < D.hide + 4 && /^(search,?)+$/.test(modes) && hl < h0 - 0.8 && still && !joined && !pol.lost && since(r, n1, 'spotted').length === 1 && c.pol.mode === 'chase',
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
    pol.amb.map(q => q.name).join() === 'Mihov dom,Erjavčeva koča,Koča na Gozdu,Ruski križ' && waiting && dWake > 0 && dWake < 115 && since(r, n0, 'ambush').length === 1 && w.pol.mode === 'chase',
    `${pol.amb.map(q => q.name + '@' + Math.round(q.s - T.startS)).join(' ')}; waiting ${waiting} (${w ? w.q.d.toFixed(1) : '-'} m across), after them from ${dWake.toFixed(0)} m`);
}

// 10. a police motorcyclist: on the player's tail, never ramming them; knocked off by them it goes down: the rider thrown onto the road (one of
//     the traffic's people, in the police's colours), an offence: the heat up
{
  const r = mk(), P = r.player, pol = r.pol; drive(r, 3); put(P, T.startS + 4400, 1.5, 24);
  for (const v of r.tf.veh) v.off = true; pol.cars.length = 0; pol.D = Object.assign({}, pol.D, { join: 1e9, uc: 9 }); pol.heliCool = 1e9; drive(r, 3);   // (past the village, the traffic and the other patrol cars taken off: this is about the motorcyclist)
  const m = pol._car(P.q.s - 50, 2.3, 0, 'chase', 0, 'moto'), v0 = Math.min(28, P.speed); m.locked = false; m.vx = Math.cos(m.h) * v0; m.vz = Math.sin(m.h) * v0;
  let gMax = -1e9, gMin = 1e9; const t0 = r.time, n0 = pol.ev;
  drive(r, 20, () => { if (r.time - t0 > 6) { const g = P.q.s - m.q.s; gMax = Math.max(gMax, g); gMin = Math.min(gMin, g); } return m.pol.mode !== 'chase'; });
  const rams = since(r, n0, 'ram').filter(e => e.u === m.pol.unit).length, tail = m.pol.mode === 'chase' && gMax < 60 && gMin > -25;
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
  pol.cars = pol.cars.filter(c => c === u); pol.D = Object.assign({}, pol.D, { join: 1e9 }); pol.heli = null; pol.heliCool = 1e9; pol.amb.forEach(a => { a.done = true; });   // (only the unmarked car: this is about it)
  let gWake = null; drive(r, 90, () => { if (!u) return true; if (u.pol.mode === 'civil') { vs.push(u.speed); dl.push(u.q.d); } else if (gWake == null) gWake = u.q.s - P.q.s; return gWake != null; });
  const v = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0, right = dl.length ? dl.filter(d => d > 0.5).length / dl.length : 0;
  check('the unmarked car: ahead of the player on the uphill half at the traffic\'s pace, no lights; once they come up behind it, lights and siren, after them',
    !!u && u.pol.kind === 'uc' && ahead > 300 && ahead < 540 && v > 8 && v < 20 && right > 0.9 && gWake != null && gWake < 45 && gWake > -8 && since(r, n0, 'undercover').length === 1 && u.pol.mode === 'chase',
    `${ahead.toFixed(0)} m ahead, ${(v * 3.6).toFixed(0)} km/h, on the right half ${(right * 100).toFixed(0)} %, woken with the player ${gWake == null ? '- (' + (u ? (u.q.s - P.q.s).toFixed(0) + ' m, ' + u.pol.mode + ', the player ' + (P.speed * 3.6).toFixed(0) + ' km/h' : 'gone') + ')' : gWake.toFixed(0) + ' m'} behind it`);
}

// 12. a heavy roadblock (from the heat POL_DIFF.heavy on): the van across the road from one edge, patrol cars beside it, a spike strip from them
//     (no hole between) over half of the gap left at the other edge; the autopilot squeezes through the rest of the gap (the asphalt at the
//     edge, the verge) without a flat
{
  const r = mk(), P = r.player, pol = r.pol; drive(r, 5); pol.cool = -3;
  const e = pol.plan.find(q => q.kind === 'block'); put(P, e.s - 520, 1.5, 22); const n0 = pol.ev; drive(r, 2, () => e.done);
  const van = pol.cars.find(c => c.pol.kind === 'van'), car = pol.cars.find(c => c.pol.block && c.pol.kind === 'car'), sp = pol.spikes.find(q => q.heavy), ev = since(r, n0, 'block')[0];
  const across = (c) => { const rel = c.h - Math.atan2(T.tz[c.q.i], T.tx[c.q.i]), W = c.m.len * Math.abs(Math.sin(rel)) + c.m.wid * Math.abs(Math.cos(rel)); return [c.q.d - W / 2, c.q.d + W / 2]; };
  let u0 = 0, u1 = 0, clean = 0, inGap = false;
  if (van && car && sp) { const ab = pol.cars.filter(c => c.pol.block).map(across); u0 = Math.min(...ab.map(a => a[0])); u1 = Math.max(...ab.map(a => a[1]));   // (no hole between the block and the strip: the strip from the cars' edge (or under it) on)
    inGap = sp.side < 0 ? sp.d0 <= u1 + 0.3 && sp.d1 > u1 + 0.5 && sp.d1 < T.w : sp.d1 >= u0 - 0.3 && sp.d0 < u0 - 0.5 && sp.d0 > -T.w; clean = sp.side < 0 ? T.w - sp.d1 : sp.d0 + T.w; }
  const t = drive(r, 60, () => P.q.s > e.s + 30 || pol.busted);
  check('a heavy roadblock: the van across the road, patrol cars beside it, a strip from them (no hole) over half of the gap at the edge; the autopilot gets through the rest of it without a flat',
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

// 15. the traffic checkpoint (def.polCheck, Kranjska Gora): the player stops by the officer: he walks round to the driver's window, asks for the
//     documents (there are none), tells them to park at the roadside; parked in the box: the driver gets out, arrested (the run over); the
//     brakes held meanwhile (no reversing away from him)
const lane = (P, vT, dT) => { const i = T.idx(P.q.s + Math.max(8, P.speed * 0.9)), tx = T.px[i] + T.nx[i] * dT, tz = T.pz[i] + T.nz[i] * dT, hA = P.speed > 3 ? Math.atan2(P.vz, P.vx) : P.h, ch = Math.cos(hA), sh = Math.sin(hA),
  lx = (tx - P.x) * ch + (tz - P.z) * sh, ly = -(tx - P.x) * sh + (tz - P.z) * ch; P.inSteer = Math.max(-1, Math.min(1, 12 * ly / (lx * lx + ly * ly))); P.inThr = P.speed < vT - 0.5 ? 0.7 : 0; P.inBrk = P.speed > vT + 0.8 ? Math.min(1, Math.max(0.2, (P.speed - vT) / 4)) : 0; P.inHand = 0; };
const toCheck = (r) => { const P = r.player, K = r.pol.chk; drive(r, 120, () => K.st === 'stopped', () => { const g = K.s - P.q.s; lane(P, g > 40 ? 13 : g > 10 ? 4 : 0, T.w * 0.42); }); };
{
  const r = mk(true), P = r.player, pol = r.pol, K = pol.chk, n0 = pol.ev, d0 = K.cop.x;
  for (const v of r.tf.veh) if (v.dir > 0 && Math.abs(v.s - K.s) < 260) v.off = true;
  toCheck(r); const stopped = K.st === 'stopped', g = K.s - P.q.s, st0 = pol.stage;
  const s0 = P.q.s; drive(r, 25, () => K.st === 'park', () => { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; });
  const atWin = Math.hypot(K.cop.x - P.x, K.cop.z - P.z), moved = Math.abs(P.q.s - s0), evs = since(r, n0, 'chkDocs').length && since(r, n0, 'chkNoDocs').length && since(r, n0, 'chkPark').length;
  drive(r, 40, () => K.st !== 'park', () => { const gb = K.box.s - P.q.s; lane(P, gb > 4 ? 3.5 : gb > 0.3 ? 1.2 : 0, gb < 13 ? K.box.d : T.w * 0.42); });
  const parked = K.st === 'parked' && pol.hold && !!K.drv; drive(r, 10, () => K.st === 'done', () => { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; });
  check('the checkpoint: nobody after the player before it; stopped by the officer, he comes to the driver\'s window, asks for the documents (none), sends them to park; parked at the roadside: the driver gets out, arrested',
    st0 === 'check' && stopped && g > 2 && g < 19 && atWin < 2.2 && moved < 0.5 && evs && parked && K.st === 'done' && pol.busted && pol.arrestK === 'chk' && P.finished && P.busted && pol.stage === 'over' && since(r, n0, 'arrested').length === 1 && !since(r, n0, 'join').length,
    `stopped ${g.toFixed(1)} m before him, he came to ${atWin.toFixed(1)} m from the car (it moved ${moved.toFixed(2)} m), parked ${parked}, ${K.st}, ${pol.arrestK}; events ${pol.log.filter(e => e.n > n0).map(e => e.k).join(',')}`);
}
// 16. ... driving off while he asks for the documents: fled, the chase on (the checkpoint's car after them); driving past without stopping:
//     fled too; knocking him down: fled, an offence (the heat up)
{
  const r = mk(true), P = r.player, pol = r.pol, K = pol.chk, n0 = pol.ev;
  for (const v of r.tf.veh) if (v.dir > 0 && Math.abs(v.s - K.s) < 260) v.off = true;
  toCheck(r); drive(r, 25, () => K.st === 'docs', () => { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; });
  drive(r, 10, () => K.st === 'fled', () => lane(P, 20, 0)); const e1 = since(r, n0, 'fled')[0];
  drive(r, 10, null, () => lane(P, 20, 0)); const c = K.car, chasing = c.pol.mode === 'chase' && !c.locked && c.q.s < P.q.s;
  const r2 = mk(true), K2 = r2.pol.chk; drive(r2, 120, () => K2.st === 'fled'); const e2 = since(r2, 0, 'fled')[0];
  const r3 = mk(true), P3 = r3.player, K3 = r3.pol.chk, h3 = r3.pol.heat; drive(r3, 120, () => K3.st === 'fled', () => lane(P3, 14, r3.pol._copD())); const e3 = since(r3, 0, 'fled')[0]; drive(r3, 1);
  check('... driving off at the documents: fled, the chase on (the checkpoint\'s car after them); past him without stopping: fled; knocking him down: fled, an offence',
    e1 && e1.why === 'drive' && pol.stage === 'chase' && chasing && e2 && e2.why === 'skip' && r2.pol.stage === 'chase' && e3 && e3.why === 'hit' && K3.cop.act === 'down' && r3.pol.hitPeople === 1 && r3.pol.heat > h3 + 0.5,
    `drove off: ${e1 ? e1.why : '-'}, the car ${c.pol.mode} ${(P.q.s - c.q.s).toFixed(0)} m behind; past him: ${e2 ? e2.why : '-'}; at him: ${e3 ? e3.why : '-'} (officer ${K3.cop.act}), heat ${h3.toFixed(2)} -> ${r3.pol.heat.toFixed(2)}`);
}
// 17. the building at the top (def.hideout): its side wall stops a car, its back wall too; driving in through the door: the mission done (hideout),
//     the run over, the brakes held, the patrol cars pull up outside
{
  const r = mk(), P = r.player, pol = r.pol, G = pol.goal, ch = Math.cos(G.h), sh = Math.sin(G.h);
  for (const v of r.tf.veh) v.off = true; pol.cars.length = 0;
  const at = (lx, lz, h, v) => { P.place(G.x + ch * lx - sh * lz, G.z + sh * lx + ch * lz, h); P.y = P.py = P.roadY = G.y; P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v; P.q = T.query(P.x, P.z, T.idx(G.s), P.q); P.sPrev = P.q.s; };
  at(0, -G.wid / 2 - 4, G.h + Math.PI / 2, 8); drive(r, 2, null, () => { P.inThr = 0.5; P.inBrk = 0; P.inSteer = 0; });
  const lz = -(P.x - G.x) * sh + (P.z - G.z) * ch, side = lz < -G.wid / 2 - 0.5 && !pol.escaped;
  at(-G.len / 2 - 12, 0, G.h, 7); const c = pol._car(G.s - 40, G.d, 0, 'chase', 0); c.locked = false; const n0 = pol.ev;
  drive(r, 8, () => pol.escaped, () => { P.inThr = 0.4; P.inBrk = 0; P.inSteer = 0; }); const tIn = r.time;
  drive(r, 3, null, () => { P.inThr = 1; P.inBrk = 0; });
  const lx = (P.x - G.x) * ch + (P.z - G.z) * sh;
  check('the building at the top: its walls stop a car; driving in through the door: the mission done, the run over, the brakes held, the patrol cars stop outside',
    side && pol.escaped && !pol.busted && P.finished && pol.stage === 'over' && pol.hold && since(r, n0, 'hideout').length === 1 && lx < G.len / 2 && c.pol.mode === 'park',
    `the side wall: stopped ${side}; in: ${pol.escaped}, ${since(r, n0, 'hideout').length} hideout event, ${lx.toFixed(1)} m along it (the back wall at ${(G.len / 2).toFixed(1)}), the patrol car ${c.pol.mode}`);
}
// 18. the contacts as in GTA V (the police run only; the races keep theirs): no bounce (a push from behind: the two go on together); a nudge on
//     the rear quarter (the PIT) spins the car round; an offset head-on stops both; the struck lighter car loses its grip for a moment
{
  const V = C.MODELS.find(m => m.id === 'vortex'), M = C.MODELS[4], s0 = T.startS + 7980;
  const car = (Md, s, d, rot, v, pl) => { const c = new C.Car(Md, { id: pl ? 1 : 2, isPlayer: pl, assist: pl ? 2 : C.CSK.aiAssist, phys: 'cs' }), i = T.idx(s), h = T.hd[i] + rot;
    c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, h); c.y = c.py = c.roadY = T.hy[i]; c.vx = Math.cos(h) * v; c.vz = Math.sin(h) * v; c.locked = false; c.q = T.query(c.x, c.z, i, c.q); c.dmgMode = 2; c.rubber = 1; c.ck = { m: pl ? Md.mass + 90 : 1750, gl: 0, glT: 1 }; return c; };
  const go = (a, b, ia, ib, secs) => { let sepMin = 1e9, cont = 0; const h0 = b.h; for (let k = 0; k < 120 * secs; k++) { Object.assign(a, ia); Object.assign(b, ib); a.steer = a.inSteer; b.steer = b.inSteer; a.step(DT, T); b.step(DT, T); const imp = C.crashCollide(a, b); if (imp > 0) cont++; } return { yaw: Math.abs(C.wrapPi(b.h - h0)) * 57.3, cont }; };
  const thr = { inThr: 0.6, inBrk: 0, inSteer: 0, inHand: 0 };
  const a1 = car(V, s0, 1, 0, 30), b1 = car(M, s0 + 8, 1, 0, 20, true); let sep = null;
  for (let k = 0; k < 120 && sep == null; k++) { a1.step(DT, T); b1.step(DT, T); if (C.crashCollide(a1, b1) > 0) { const nx = b1.x - a1.x, nz = b1.z - a1.z, l = Math.hypot(nx, nz); a1.step(DT, T); b1.step(DT, T); sep = ((b1.vx - a1.vx) * nx + (b1.vz - a1.vz) * nz) / l; } }
  const a2 = car(V, s0, -1.05, 0.08, 23), b2 = car(M, s0 + 3.3, 0.95, 0, 22, true), pit = go(a2, b2, { inThr: 0.8, inBrk: 0, inSteer: 0.6, inHand: 0 }, thr, 1.5);
  const a3 = car(V, s0, 0.4, 0, 20), b3 = car(M, s0 + 6, -0.4, Math.PI, 20, true); go(a3, b3, thr, thr, 0.6);
  const rc = new C.Race(T, opts({ police: false, numAI: 1, playerGrid: 2 }));
  check('the contacts as in GTA V: a push from behind does not bounce, a nudge on the rear quarter (the PIT) spins the car round, an offset head-on stops both; only in the run from the police',
    sep != null && Math.abs(sep) < 1 && pit.yaw > 90 && a3.speed < 9 && b3.speed < 9 && !rc.cars.some(c => c.ck),
    `separating at ${sep == null ? '-' : sep.toFixed(2)} m/s after the push; the PIT turned the car ${pit.yaw.toFixed(0)} deg in 1.5 s; head-on: ${a3.speed.toFixed(1)} and ${b3.speed.toFixed(1)} m/s after 0.6 s`);
}

// 19. the player down a side road with the police after them (Track.stubs; here a forest road past Šumica): the radio hears of it (stubIn);
//     the patrol cars in the chase come in after them (one that went past its junction backs up to it), one stops in its mouth at its side;
//     at its dead end (stubEnd) they pin the player: busted
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({})), P = r.player, pol = r.pol; r.start(); pol._flee('skip'); Math.random = orig;
  const K = T.stubs.findIndex(S => S.s0 - T.startS > 3400 && S.L > 120), S = T.stubs[K];
  pol.D = Object.assign({}, pol.D, { side: 0 }); pol.plan = pol.plan.filter(e => Math.abs(e.s - S.s0) > 900);   // (nobody out of the side roads ahead, no strip at its junction)
  let k = 0, tEnd = -1, back = false, inMax = 0, blk = null; const n0 = pol.ev;
  for (; P.q.s < S.s0 - 30 && !P.finished; ) { Math.random = seeded(9000 + (++k)); C.aiControl(P, r, DT); r.step(DT); }
  for (let t = 0; t < 90 && !P.finished; t += DT) {
    Math.random = seeded(9000 + (++k));
    if (C.stubDrive(P, r, K, 1) && tEnd < 0) tEnd = r.time;
    r.step(DT);
    for (const c of pol.cars) { const st = c.pol.stub; if (st && st.k === K && st.back) back = true; if (st && st.k === K && st.block) blk = c; }
    inMax = Math.max(inMax, pol.cars.filter(c => c.q.k === K && c.pol.mode === 'chase' && !(c.pol.stub && c.pol.stub.block)).length);
  }
  Math.random = orig;
  const ins = since(r, n0, 'stubIn'), mouth = blk && blk.q.k === K && blk.q.st > S.tb && blk.q.st < S.tb + 12 && blk.speed < 0.5 && Math.abs(blk.q.u) > 1.5;
  check('a side road: the player down it, the police after them: they hear of it (stubIn), come in after them (one that went past the junction backs up to it), one stops in its mouth at its side; at its dead end they pin the player: busted',
    ins.length === 1 && ins[0].stub === S.name && since(r, n0, 'stubEnd').length === 1 && inMax >= 2 && back && mouth && pol.busted && tEnd > 0 && r.time - tEnd < 40,
    `${S.name || 'a forest road'} at ${(S.s0 - T.startS).toFixed(0)} m (${S.L.toFixed(0)} m to its rail): ${ins.length} stubIn, ${inMax} after them in it, backed up to it: ${back}; in its mouth: ${blk ? `${(blk.q.st - S.tb).toFixed(1)} m in, ${blk.q.u.toFixed(1)} m to the side, ${blk.speed.toFixed(1)} m/s` : '-'}; at the end at ${tEnd.toFixed(1)} s, busted ${pol.busted} at ${r.time.toFixed(1)} s`);
}

// 20. a road without a checkpoint or a building (Los Caracoles: no def.polCheck, no def.hideout): the chase from the start (a patrol car on the
//     grid behind the player, off after 2 s), over the finish at Portillo is the escape; whole runs on autopilot at the easy level: the patrol
//     cars after it up the ladder of hairpins through the trucks, the autopilot gets away now and then (one of three runs at least)
{
  const CT = new C.Track(C.TRACKS.find(d => d.id === 'caracoles'));
  const runs = [11, 12, 13].map(seed => {
    Math.random = seeded(3);
    const r = new C.Race(CT, opts({ seed, difficulty: 0 })), P = r.player, pol = r.pol, pc = pol.cars[0];
    const st = { stage: pol.stage, chk: pol.chk, goal: pol.goal, n: pol.cars.length, chase: pc && pc.pol.mode === 'chase', back: pc ? P.q.s - pc.q.s : 0, locked: pc && pc.locked };
    r.start();
    let t = 0, k = 0, ev = 0, nan = false, off2 = null; const evs = {};
    while (t < 900 && !P.finished) {
      Math.random = seeded(5000 + (++k));
      C.aiControl(P, r, DT); r.step(DT); t += DT;
      if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
      if (off2 == null && pc && !pc.locked) off2 = t;
      if (pol.ev !== ev) { for (const e of pol.log) if (e.n > ev) evs[e.k] = (evs[e.k] || 0) + 1; ev = pol.ev; }
      if (k % 60 === 0 && !finite(r)) nan = true;
    }
    Math.random = orig;
    return { seed, st, off2, evs, nan, t, escaped: pol.escaped && !pol.busted && P.finished && evs.escaped === 1 && !evs.hideout, busted: pol.busted && pol.arrestK === 'chase', at: P.q.s - CT.startS };
  });
  check('a road without a checkpoint (Los Caracoles): the chase from the start (a patrol car on the grid behind the player, off after 2 s), the escape over the finish (no building); on autopilot at the easy level it gets away now and then',
    runs.every(r => r.st.stage === 'chase' && !r.st.chk && !r.st.goal && r.st.n === 1 && r.st.chase && r.st.back > 10 && r.st.back < 45 && r.st.locked && r.off2 > 1.9 && r.off2 < 2.2 && !r.nan && (r.evs.join || 0) >= 1 && (r.escaped || r.busted)) && runs.some(r => r.escaped),
    runs.map(r => `seed ${r.seed}: ${r.escaped ? 'escaped' : r.busted ? 'busted' : '-'} in ${r.t.toFixed(0)} s at ${r.at.toFixed(0)} m (a patrol car ${r.st.back.toFixed(0)} m behind at the start, off at ${r.off2 != null ? r.off2.toFixed(1) : '-'} s)`).join('; '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
