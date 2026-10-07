// The slipstream (Race opts.slip) and DRS at Suzuka (Core only, no browser). In the wake of a car ahead (3-40 m behind it along the road,
// within 2.4 m of its line, both at speed, not in the pit lane) a car has less air drag (c.tow 0..1, up to a quarter less), so it is quicker
// down a straight than one alone. The AI holds the wake on a straight and pulls out of it in time for the braking: with the slipstream
// the rivals pass each other more often (the Red Bull Ring, its long climbs). Off (the default), in a time trial: no tow on any car, the
// race as before (the golden references). Suzuka: one DRS zone, down the start / finish straight (its corners by their names).
//   node tests/slip.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : String(x));

// 1. off by default, none in a time trial; on: every car with it
{
  const T = track('rbring');
  const off = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 2, phys: 'cs', seed: 3 });
  const on = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 2, phys: 'cs', seed: 3, slip: true });
  const tt = new C.Race(track('pikes'), { numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', seed: 3, slip: true });
  check('off (the default) and in a time trial: no tow on any car; on: every car with it (none on the grid)',
    !off.slip && off.cars.every(c => !('tow' in c)) && !tt.slip && tt.cars.every(c => !('tow' in c)) && !!on.slip && on.cars.length === 4 && on.cars.every(c => c.tow === 0), '');
}

// 2. the wake: 12 m behind a car on a straight, in its line, both at 150 km/h: a strong tow; 3 m to the side, 60 m behind, slow, in the pit
// lane: none; the car ahead itself: none
{
  const T = track('rbring');
  Math.random = seeded(3);
  const r = new C.Race(T, { numAI: 1, playerGrid: 2, laps: 2, phys: 'cs', seed: 3, slip: true });
  r.start();
  while (r.state !== 'racing') r.step(DT);
  const P = r.player, A = r.cars.find(c => !c.isPlayer), s0 = T.startS + 400;
  const put = (c, s, d, v) => { const i = T.idx(s); c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i]); c.vx = Math.cos(T.hd[i]) * v; c.vz = Math.sin(T.hd[i]) * v; c.q = T.query(c.x, c.z, i, c.q); };
  const tow = (sP, dP, vP, pit) => { put(A, s0, 0, 42); put(P, sP, dP, vP); P.inPit = !!pit; r._tow(); const t = { me: P.tow, ahead: A.tow }; P.inPit = false; return t; };
  const near = tow(s0 - 12, 0, 42), side = tow(s0 - 12, 3, 42), far = tow(s0 - 60, 0, 42), slow = tow(s0 - 12, 0, 12), pit = tow(s0 - 12, 0, 42, true);
  check('the wake: 12 m behind in its line a strong tow, the car ahead none; 3 m aside, 60 m back, slow or in the pit lane: none',
    near.me > 0.6 && near.ahead === 0 && side.me === 0 && far.me === 0 && slow.me === 0 && pit.me === 0,
    `12 m behind ${f2(near.me)} (ahead ${f2(near.ahead)}), aside ${f2(side.me)}, 60 m ${f2(far.me)}, slow ${f2(slow.me)}, pit lane ${f2(pit.me)}`);
}

// 3. down a straight (a flat plane, flat out from 150 km/h for 12 s): in a full tow the car is quicker, by the air drag it saves
{
  const surf = 0, plane = { hasElev: false, def: {}, open: false,
    query(x, z, h, o) { o = o || {}; Object.assign(o, { i: 0, a: 0, s: x, d: z, tx: 1, tz: 0, nx: 0, nz: 1, x, z, bl: 1e9, br: 1e9 }); return o; },
    surface() { return surf; } };
  const run = (tow) => {
    const M = C.MODELS[0], c = new C.Car(M, { isPlayer: true, phys: 'cs', assist: 2 });
    c.place(0, 0, 0); c.locked = false; c.q = { i: 0, s: 0, d: 0, tx: 1, tz: 0, nx: 0, nz: 1 }; c.vx = 42; c.gear = M.gears.length - 1;
    for (let t = 0; t < 12; t += DT) { c.inThr = 1; c.inBrk = 0; c.inSteer = 0; c.tow = tow; c.step(DT, plane); }
    return c.speed * 3.6;
  };
  const alone = run(0), towed = run(1);
  check('down a straight: in a full tow faster than alone (a quarter less air drag: some 10 % more top speed)', towed > alone + 8 && towed < alone * 1.15,
    `after 12 s flat out ${f2(alone)} km/h alone, ${f2(towed)} km/h in the tow`);
}

// 4. the AI: with the slipstream the rivals pass each other at least twice as often (8 of them, 3 laps of the Red Bull Ring, two races), all
// to the line, the winner no slower
{
  const T = track('rbring'), stat = (slip) => {
    let passes = 0, fin = 0, all = 0; const win = [];
    for (let sd = 1; sd <= 2; sd++) {
      Math.random = seeded(sd * 31);
      const r = new C.Race(T, { numAI: 8, noPlayer: true, laps: 3, assist: 2, phys: 'cs', seed: sd, difficulty: 1, slip });
      r.start();
      let t = 0, prev = null;
      while (t < 400 && !r.cars.every(c => c.finished)) {
        r.step(DT); t += DT;
        if (r.state !== 'racing' || t < 20 || Math.floor(t * 4) === Math.floor((t - DT) * 4)) continue;
        const o = r.cars.map(c => c.dist);
        if (prev) for (let i = 0; i < o.length; i++) for (let j = 0; j < o.length; j++) if (i !== j && prev[i] < prev[j] && o[i] > o[j] && !r.cars[i].inPit && !r.cars[j].inPit && !r.cars[i].finished && !r.cars[j].finished) passes++;
        prev = o;
      }
      for (const c of r.cars) { all++; if (c.finished) fin++; }
      win.push(Math.min(...r.cars.filter(c => c.finished).map(c => c.finishTime)));
    }
    return { passes, fin, all, win };
  };
  const off = stat(false), on = stat(true);
  check('the AI: with the slipstream the rivals pass each other at least twice as often, all to the line, the winner no slower',
    on.passes >= 2 * off.passes && off.passes > 0 && on.fin === on.all && on.win.every((w, i) => w <= off.win[i] + 0.5),
    `passes ${off.passes} without, ${on.passes} with; finished ${on.fin}/${on.all}; winners ${off.win.map(f2).join(' ')} s vs ${on.win.map(f2).join(' ')} s`);
}

// 5. Suzuka: one DRS zone down the start / finish straight (detection before the Casio Triangle, open from after the Final Curve to the braking
// for the First Curve); in a race the flap opens there for a car within a second of another (from the second lap on)
{
  const d = C.TRACKS.find(x => x.id === 'suzuka'), T = new C.Track(d), L = T.len;
  const at = (name) => { const e = d.names.find(x => x[0] === name); return ((T.nearestIdx(e[1], e[2]) * T.ds - T.startS) % L + L) % L; };
  const Z = T.drs && T.drs[0];
  check('Suzuka: one DRS zone, detected before the Casio Triangle, open after the Final Curve, closed before the First Curve',
    !!Z && T.drs.length === 1 && Z.det < at('Casio Triangle') && Z.det > at('130R') && Z.act > at('Zadnji ovinek') && Z.end < at('Prvi ovinek') && Z.end > 200,
    Z ? `detection ${f2(Z.det)} m, open ${f2(Z.act)} m, closed ${f2(Z.end)} m (Casio Triangle ${f2(at('Casio Triangle'))}, Final Curve ${f2(at('Zadnji ovinek'))}, First Curve ${f2(at('Prvi ovinek'))}; the lap ${f2(L)} m)` : 'none');
  Math.random = seeded(7);
  const r = new C.Race(T, { numAI: 12, playerGrid: 7, laps: 2, playerModel: C.MODELS[0], assist: 2, phys: 'cs', seed: 7, difficulty: 1, slip: true });
  r.start();
  const P = r.player, opened = new Set(); let t = 0;
  while (t < 400 && !r.cars.every(c => c.finished)) { C.aiControl(P, r, DT); r.step(DT); t += DT; P.hitCar = P.hitWall = 0; for (const c of r.cars) if (c.drs) opened.add(c.name); }
  check('a race at Suzuka: the flap opens down the straight for cars close behind another', opened.size >= 2, `${opened.size} cars opened it: ${[...opened].join(', ')}`);
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
