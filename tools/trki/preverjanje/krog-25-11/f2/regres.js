const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { loadCore, ROOT } = require((process.env.TRKI_F2 || '') + '/tests/lib/core.js');
const { seeded, stateLine, raceState } = require((process.env.TRKI_F2 || '') + '/tests/lib/sim.js');

const C = loadCore();
const HC = require((process.env.TRKI_F2 || '') + '/tests/lib/handling.js')(C, 'cs'), HN = require((process.env.TRKI_F2 || '') + '/tests/lib/handling.js')(C, 'nova');
const { DT } = HC, D = 180 / Math.PI;
const checks = [];
const ok = (name, cond, detail) => checks.push({ name, ok: !!cond, detail });
const f = (v, d = 2) => Number.isFinite(v) ? v.toFixed(d) : String(v);
const test = (tx, fn) => { C.setTest(tx || null); try { return fn(); } finally { C.setTest(null); } };
const SIM = { cv: 1 }, ARC = { cv: 2 }, SOFT = { cv: 3 }, STUNT = { cv: 4 }, OLD = { cv: 5 }, REAL = { cv: 6 };
const car = (H, v, pl) => { const c = H.mkCar('rally', { v }); c.isPlayer = pl; c.noReverse = true; return c; };
const lane = (c, z0) => Math.max(-1, Math.min(1, -(0.35 * (c.z - z0) + 2.0 * c.h + 0.25 * c.vz / Math.max(5, c.speed))));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Realistična and a car standing across the road (aiHazard; the decision »omili« of Trki: ozke proge): a rival alone on the road, 9 s into the
// race another car is stood across its racing line 160 m ahead (or lengthways, facing back) and held there. The cars' own rules see 22 m ahead: in
// cv 1 and 5 the rival is at racing speed 25 m before it and drives into it; in cv 6 it sees it from over 60 m, is far slower 25 m before it and
// goes round it without a touch. Before the car stands there no rival sees a hazard in any variant, and in cv 1 and 5 never (the rule is not theirs);
// a full field through Tianmen's hairpins (cars turned 45° to the centre line, their noses where they go) sees none either
{
  const tracks = {}, trk = (id) => tracks[id] || (tracks[id] = new C.Track(C.TRACKS.find(x => x.id === id)));
  const run = (tx, tid, yawDeg) => test(tx, () => { const orig = Math.random; Math.random = seeded(64); try {
    const T = trk(tid), r = new C.Race(T, { numAI: 1, playerGrid: 2, laps: 3, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); r.start();
    const P = r.player, c = r.cars.find(x => x !== P); let on = false, hit = 0, v25 = null, hz0 = 0, hzAt = null, pd = 0, X = 0, Z = 0, Hd = 0, past = false;
    for (let k = 1; k <= 60 / DT && !past; k++) {
      Math.random = seeded(1000 + k);
      if (!on && r.time > 9) { on = true; const i = T.idx(c.q.s + 160), d = T.rl[i]; X = T.px[i] + T.nx[i] * d; Z = T.pz[i] + T.nz[i] * d; Hd = T.hd[i] + yawDeg / D; pd = c.dist + 160; P.place(X, Z, Hd); T.query(X, Z, -1, P.q); }
      if (on) { if (!(hit > 0)) { P.x = X; P.z = Z; P.h = Hd; P.vx = P.vz = P.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; P.dist = pd; }
      else { C.aiControl(P, r, DT); if (c.aiHz || P.aiHz) hz0++; }
      c.hitCar = 0; r.step(DT);
      if (on) { P.dist = pd; const gap = pd - c.dist; if (c.aiHz && hzAt == null) hzAt = gap;
        if (gap > 0) { if (c.hitCar > hit) hit = c.hitCar; if (v25 == null && gap <= 25) v25 = c.speed; } else past = true; }
    }
    return { v25, hit, hz0, hzAt, past, dmg: c.dmg || 0 };
  } finally { Math.random = orig; } });
  for (const [tid, yaw] of [['spa', 90], ['cusco', 90], ['spa', 180], ['cusco', 0]]) {   // (0: lengthways, a hazard only as a car stuck: it has driven 9 s and stands for over HZ.st s)
    const a = run(SIM, tid, yaw), b = run(OLD, tid, yaw), q = run(REAL, tid, yaw);
    ok(`Realistična, a car standing ${yaw === 90 ? 'across' : yaw ? 'facing back on' : 'lengthways (stuck, after 9 s of driving) on'} the racing line 160 m ahead (${tid}): the rival sees it from over 60 m, is under 0.75 of cv 5's speed 25 m before it and passes it without a touch; cv 1 and 5 see nothing (the old rule: at racing speed into it); no hazard seen before it stands there`,
      q.past && q.hzAt > 60 && q.hz0 === 0 && q.hit === 0 && q.dmg === 0 && q.v25 < 0.75 * b.v25 && q.v25 > 5
      && a.hzAt == null && b.hzAt == null && a.hz0 === 0 && b.hz0 === 0 && a.hit > 15 && b.hit > 15 && a.v25 > 35 && b.v25 > 35,
      `25 m before it cv 1 ${f(a.v25, 1)}, cv 5 ${f(b.v25, 1)}, cv 6 ${f(q.v25, 1)} m/s; the touch ${f(a.hit, 1)} / ${f(b.hit, 1)} / ${f(q.hit, 1)} m/s; seen from ${f(q.hzAt, 0)} m`);
  }
  { const n = test(REAL, () => { const orig = Math.random; Math.random = seeded(71); try {
      const r = new C.Race(trk('tianmen'), { numAI: 12, playerGrid: 7, laps: 2, playerModel: C.MODELS[4], assist: 2, seed: 3, difficulty: 1, damage: 2, phys: 'cs' }); r.start(); let hz = 0;
      for (let k = 1; k <= 45 / DT; k++) { Math.random = seeded(1000 + k); C.aiControl(r.player, r, DT); r.step(DT); for (const c of r.cars) if (c.aiHz) hz++; }
      return hz;
    } finally { Math.random = orig; } });
    ok('Realistična, 13 cars 45 s up Tianmen\'s hairpins with none of them standing: no rival sees a hazard (a car driving a hairpin is not one)', n === 0, `hazard ticks ${n}`); }
  // the same race to the bit: a Core with the one call of aiHazard cut out (tools/trki/pocez.js enakost does this for whole races, many tracks)
  { const src = require((process.env.TRKI_F2 || '') + '/tests/lib/core.js').coreSource(), CALL = '? aiHazard(c, race, v, Lw) : null;', n1 = src.split(CALL).length - 1;
    const B = n1 === 1 ? new Function('module', 'exports', 'require', src.replace(CALL, '? null : null;') + '\n;return Core;')({ exports: {} }, {}, require) : null;
    const rows = []; let okAll = !!B;
    if (B) for (const tid of ['jezero', 'cusco', 'toskana']) { const orig = Math.random; C.setTest(REAL); B.setTest(REAL); try {
      const mk = (K) => { Math.random = seeded(71); const r = new K.Race(new K.Track(K.TRACKS.find(x => x.id === tid)), { numAI: 12, playerGrid: 7, laps: 2, playerModel: K.MODELS[4], assist: 2, seed: 3, difficulty: 1, damage: 2, phys: 'cs' }); r.start(); return r; };
      const ra = mk(B), rb = mk(C); let part = null, hz = null;
      for (let k = 1; k <= 20 / DT && part == null; k++) { for (const [K, r] of [[B, ra], [C, rb]]) { Math.random = seeded(1000 + k); K.aiControl(r.player, r, DT); r.step(DT); }
        if (hz == null && rb.cars.some(c => c.aiHz)) hz = k; if (raceState(ra) !== raceState(rb)) part = k; }
      if (part != null || hz != null) okAll = false; rows.push(`${tid}: parted ${part == null ? 'never' : f(part * DT, 2) + ' s'}, a hazard ${hz == null ? 'never' : f(hz * DT, 2) + ' s'}`);
    } finally { Math.random = orig; C.setTest(null); B.setTest(null); } }
    ok('Realistična without a car across the road: 13 cars 20 s on Jezero, Cusco and Toskana, the whole state of every car after every step the same to the bit as a Core without aiHazard', okAll, B ? rows.join('; ') : `the call found ${n1}×`);
    // the start (fizika-2, the independent check of 25. 11. 2026): a car still pulling away from the grid is under HZ.vs for over HZ.st s and was taken
    // for a car stuck in the road, so the rivals behind it steered and braked for it before anything had touched anything (5 of 60 tracks, Rastro
    // 1.2 m off main by the first touch). 13 cars from the grid as the recorded races start them (tests/lib/sim.js raceOpts: the player last), up
    // to the first touch of any car: no rival sees a hazard and the whole state of every car is the same to the bit as without aiHazard
    if (B) { const rows3 = []; let ok3 = true;
      for (const tid of ['rastro', 'vaoala', 'kotor']) { const orig = Math.random; C.setTest(REAL); B.setTest(REAL); try {
        const mk = (K) => { Math.random = seeded(7); const r = new K.Race(new K.Track(K.TRACKS.find(x => x.id === tid)), { numAI: 12, playerGrid: 12, laps: 2, playerModel: K.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs' }); r.start(); return r; };
        const ra = mk(B), rb = mk(C); let part = null, hz = null, k = 0;
        for (; k < 6 / DT && !rb.cars.some(c => c.hitCar > 0 || c.hitWall > 0); k++) { for (const [K, r] of [[B, ra], [C, rb]]) { Math.random = seeded(1000 + k); K.aiControl(r.player, r, DT); r.step(DT); }
          if (hz == null && rb.cars.some(c => c.aiHz)) hz = k; if (part == null && raceState(ra) !== raceState(rb)) part = k; }
        if (part != null || hz != null || !(k * DT > 2)) ok3 = false; rows3.push(`${tid}: the first touch ${f(k * DT, 2)} s, a hazard ${hz == null ? 'never' : f(hz * DT, 2) + ' s'}, parted ${part == null ? 'never' : f(part * DT, 2) + ' s'}`);
      } finally { Math.random = orig; C.setTest(null); B.setTest(null); } }
      ok('Realistična, the start: 13 cars from the grid (Rastro, Vaoala, Kotor) up to the first touch, a car still pulling away is no car stuck in the road: no rival sees a hazard, the whole state of every car the same to the bit as a Core without aiHazard', ok3, rows3.join('; ')); }
    // the whole field behind it: 10 s into the race a car is stood across the road 400 m before the leader and held (tools/trki/pocez.js skoda):
    // with aiHazard the rivals take no more damage between them than without it, and every one gets past (none left stuck in the queue behind it)
    if (B) { const rows2 = []; let ok2 = true;
      for (const [tid, sd] of [['hiva', 72], ['tianmen', 72]]) { const orig = Math.random; C.setTest(REAL); B.setTest(REAL); try {
        const go = (K) => { Math.random = seeded(sd); const r = new K.Race(new K.Track(K.TRACKS.find(x => x.id === tid)), { numAI: 12, playerGrid: 7, laps: 2, playerModel: K.MODELS[4], assist: 2, seed: sd - 68, difficulty: 1, damage: 2, phys: 'cs' }); r.start();
          const T = r.track, P = r.player; let on = false, X = 0, Z = 0, Hd = 0, pd = 0, d0 = null;
          for (let k = 1; k <= 55 / DT; k++) { Math.random = seeded(1000 + k);
            if (!on && r.time > 10) { on = true; const lead = r.cars.filter(c => c !== P).reduce((a, c) => c.dist > a.dist ? c : a), i = T.idx(lead.q.s + 400), d = T.rl[i];
              X = T.px[i] + T.nx[i] * d; Z = T.pz[i] + T.nz[i] * d; Hd = T.hd[i] + Math.PI / 2; pd = lead.dist + 400; P.place(X, Z, Hd); T.query(X, Z, -1, P.q); d0 = r.cars.map(c => c.dmg || 0); }
            if (on) { if (!(P.dmg > 0.3)) { P.x = X; P.z = Z; P.h = Hd; P.vx = P.vz = P.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; P.dist = pd; r.step(DT); P.dist = pd; }
            else { K.aiControl(P, r, DT); r.step(DT); } }
          const riv = r.cars.filter(c => c !== P);
          return { dmg: riv.reduce((s, c) => s + ((c.dmg || 0) - d0[r.cars.indexOf(c)]) * 100, 0), past: riv.filter(c => c.dist > pd + 10).length, n: riv.length, left: riv.filter(c => !(c.dist > pd + 10)).map(c => `${f(pd - c.dist, 0)} m, ${f(c.speed, 1)} m/s`).join(', ') }; };
        const a = go(B), b = go(C);
        if (!(b.dmg <= a.dmg && b.past === b.n)) ok2 = false; rows2.push(`${tid}: the rivals' damage ${f(a.dmg, 0)} % without, ${f(b.dmg, 0)} % with aiHazard; past it ${a.past} / ${b.past} of ${b.n}${b.left ? ' (' + b.left + ')' : ''}`);
      } finally { Math.random = orig; C.setTest(null); B.setTest(null); } }
      ok('Realistična, a car held across the road before a full field (Hiva, Tianmen): the rivals take no more damage than without aiHazard and every one gets past it', ok2, rows2.join('; ')); }
  }
}

let bad = 0;
console.log('== trki med avti (različice)');
for (const c of checks) { if (!c.ok) bad++; console.log(`${c.ok ? 'OK  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`); }
console.log(bad ? `FAIL: ${bad} of ${checks.length} checks` : `OK: all ${checks.length} checks`);
process.exitCode = bad ? 1 : 0;
