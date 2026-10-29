// Failures (Race opts.faults, Car.flt; Core only, no browser): a hard knock (a wall or a car, 40 km/h and more across) may cut a tyre on
// the corner that took it (up to one in four); the tyre goes down in 10 s, then it grips less (four fifths) and pulls the car to its side;
// the pit stop puts on a new one. The brakes heat up with the work they do and cool in the air: over 550 °C they fade (at 750 °C to a
// little over half their force). The engine heats up when it toils slowly at full throttle and cools at speed: over 112 °C it loses power
// (30 % at 130 °C). The AI drives easier on a cut tyre and comes in for a new one where there are pits. Off (the default) and in a time
// trial: no failures on any car, the race as before (the golden references).
//   node tests/faults.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : String(x)), f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : String(x));

// a flat plane without walls, and a car on it heading along +x (its right: +z) at v m/s
const plane = { hasElev: false, def: {}, open: false,
  query(x, z, h, o) { o = o || {}; Object.assign(o, { i: 0, a: 0, s: x, d: z, tx: 1, tz: 0, nx: 0, nz: 1, x, z, bl: 1e9, br: 1e9 }); return o; },
  surface() { return 0; } };
const onPlane = (flt, v) => {
  const M = C.MODELS[0], c = new C.Car(M, { isPlayer: true, phys: 'cs', assist: 2 });
  c.place(0, 0, 0); c.locked = false; c.q = { i: 0, s: 0, d: 0, tx: 1, tz: 0, nx: 0, nz: 1 }; c.vx = v;
  c.flt = Object.assign({ pw: -1, pk: 0, brT: 20, enT: 85, brH: false, enH: false, ev: '' }, flt);
  return c;
};
const drive = (c, sec, thr, brk, hold) => { for (let t = 0; t < sec; t += DT) { c.inThr = thr; c.inBrk = brk; c.inSteer = 0; if (hold) hold(c); c.step(DT, plane); } };

// 1. off by default, none in a time trial; on: every car with its brakes and engine cool, its tyres whole
{
  const T = track('rbring');
  const off = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 2, phys: 'cs', seed: 3 });
  const on = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 2, phys: 'cs', seed: 3, faults: true });
  const tt = new C.Race(track('pikes'), { numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', seed: 3, faults: true });
  check('off (the default) and in a time trial: no failures on any car; on: every car with them (tyres whole, brakes and engine cool)',
    off.cars.every(c => !c.flt) && tt.cars.every(c => !c.flt) && on.cars.length === 4 && on.cars.every(c => c.flt && c.flt.pw === -1 && c.flt.brT < 30 && c.flt.enT < 95), '');
}

// 2. knocks into the wall (the Red Bull Ring): 40 hard ones (some 65 km/h across) cut a tyre now and then, always the front one on the side
// that hit; 30 gentle ones (some 20 km/h across) never
{
  const T = track('rbring');
  Math.random = seeded(5);
  const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 3, phys: 'cs', seed: 5, faults: true, damage: 2 });
  r.start();
  while (r.state !== 'racing') r.step(DT);
  const P = r.player, s0 = T.startS + 300;
  const knock = (ang, v, s) => {   // (from 1.6 m inside the right-hand edge, ang into it)
    r.repairCar(P); P.flt.ev = '';
    const i = T.idx(s), br = T.query(T.px[i], T.pz[i], i, {}).br, d = br - 1.6, nx = T.nx[i], nz = T.nz[i];
    const h1 = T.hd[i] + ang, h = Math.cos(h1) * nx + Math.sin(h1) * nz > 0 ? h1 : T.hd[i] - ang;
    P.place(T.px[i] + nx * d, T.pz[i] + nz * d, h); P.vx = Math.cos(h) * v; P.vz = Math.sin(h) * v; P.w = 0; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s;
    let hit = 0;
    for (let t = 0; t < 0.6; t += DT) { P.inThr = 0; P.inBrk = 0; P.inSteer = 0; r.step(DT); hit = Math.max(hit, P.hitWall); P.hitWall = 0; }
    return { hit, pw: P.flt.pw, ev: P.flt.ev, right: -nx * Math.sin(h) + nz * Math.cos(h) > 0 };
  };
  const hard = [], soft = [];
  for (let k = 0; k < 40; k++) hard.push(knock(0.6, 32, s0 + k * 7));
  for (let k = 0; k < 30; k++) soft.push(knock(0.2, 28, s0 + k * 7));
  const cut = hard.filter(x => x.pw >= 0), firm = hard.filter(x => x.hit > 14);
  check('hard knocks into the wall: now and then a cut tyre (the front one on the side that hit), told the moment it happens',
    firm.length >= 30 && cut.length >= 4 && cut.length <= 20 && cut.every(x => x.pw === (x.right ? 1 : 0) && x.ev === 'puncture'),
    `${cut.length} cut of ${hard.length} (${firm.length} at over 50 km/h across): wheels ${cut.map(x => x.pw).join(',')}`);
  check('gentle knocks: no cut tyre', soft.every(x => x.pw < 0) && Math.max(...soft.map(x => x.hit)) < 9, `the hardest ${f1(Math.max(...soft.map(x => x.hit)))} m/s across`);
}

// 3. the cut tyre: down in 10 s; then down a straight (from 108 km/h at half throttle, no steering, 4 s) it pulls the car to its side, a
// front one more than a rear one; it holds the car back a little; the pit stop (the repair) puts on a new one
{
  const c = onPlane({ pw: 1, pk: 0 }, 30); const pk = [];
  for (let k = 0; k < 3; k++) { drive(c, 4, 0.5, 0); pk.push(c.flt.pk); c.vx = 30; c.vz = 0; c.h = 0; c.w = 0; c.z = 0; }
  check('the cut tyre goes down in 10 s', Math.abs(pk[0] - 0.4) < 0.03 && Math.abs(pk[1] - 0.8) < 0.03 && pk[2] === 1, `down by ${pk.map(f2).join(', ')} after 4, 8, 12 s`);
  const run = (flt) => { const c = onPlane(flt, 30); drive(c, 4, 0.5, 0); return { z: c.z, v: c.speed * 3.6 }; };
  const ok = run({}), fr = run({ pw: 1, pk: 1 }), fl = run({ pw: 0, pk: 1 }), rr = run({ pw: 3, pk: 1 });
  check('down a straight: the car pulls to the side of the cut tyre (a front one more), a little slower; a whole set runs straight',
    Math.abs(ok.z) < 0.05 && fr.z > 2 && fl.z < -2 && Math.abs(fr.z + fl.z) < 0.05 && rr.z > 1 && rr.z < fr.z && fr.v < ok.v - 3,
    `aside after 4 s: whole ${f2(ok.z)} m, front right ${f2(fr.z)} m, front left ${f2(fl.z)} m, rear right ${f2(rr.z)} m; ${f1(ok.v)} vs ${f1(fr.v)} km/h`);
  const T = track('rbring'), r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 2, phys: 'cs', seed: 2, faults: true });
  r.player.flt.pw = 2; r.player.flt.pk = 1; r.repairCar(r.player);
  check('the pit stop (the repair): a new tyre', r.player.flt.pw === -1 && r.player.flt.pk === 0, JSON.stringify(r.player.flt));
}

// 4. the AI on a cut tyre: easier, in for a new one where there are pits (the Red Bull Ring: at once, out with a new one, on to the line);
// where there are none (Jezero) on to the line on it, slower
{
  const run = (id) => {
    const T = track(id);
    Math.random = seeded(9);
    const r = new C.Race(T, { numAI: 6, noPlayer: true, laps: 3, assist: 2, phys: 'cs', seed: 9, difficulty: 1, faults: true, damage: 2 });
    r.start();
    let t = 0, X = null, want = null, inP = null, out = null, pwOut = null, lap0 = 0;
    while (t < 600 && !r.cars.every(c => c.finished)) {
      r.step(DT); t += DT;
      if (!X && r.state === 'racing' && t > 40) { X = r.order[2]; X.flt.pw = 2; X.flt.pk = 0; lap0 = X.lapTimes.length; }
      if (X) { if (X.pitWant && want == null) want = t; if (X.inPit && inP == null) inP = t; if (inP != null && !X.inPit && out == null) { out = t; pwOut = X.flt.pw; } }
    }
    const lapsOn = X.lapTimes.slice(lap0 + 1), others = r.cars.filter(c => c !== X).map(c => Math.min(...c.lapTimes));
    return { want, inP, out, pwOut, fin: X.finished, all: r.cars.every(c => c.finished), slow: lapsOn.length ? Math.min(...lapsOn) / Math.min(...others) : NaN };
  };
  const pit = run('rbring'), np = run('jezero');
  check('the AI on a cut tyre: in for a new one at once (the Red Bull Ring), out with it, everyone to the line',
    pit.want != null && pit.want < 41 && pit.inP != null && pit.pwOut === -1 && pit.fin && pit.all, `wants in at ${f1(pit.want)} s, in the pit lane at ${f1(pit.inP)} s, out at ${f1(pit.out)} s with ${pit.pwOut === -1 ? 'a new tyre' : 'the cut one'}`);
  check('... no pits (Jezero): on to the line on it, slower', np.want == null && np.fin && np.all && np.slow > 1.05 && np.slow < 1.4, `its laps on it ${f2(np.slow)} times the best of the others'`);
}

// 5. the brakes: hard stops from 200 to 80 km/h one after another heat them past 550 °C (told), then they stop the car later (from 108 km/h:
// a quarter longer at 650 °C, half again at 760 °C); 20 s at speed cool them
{
  const c = onPlane({}, 0), temps = [];
  for (let k = 0; k < 6; k++) { c.vx = 200 / 3.6; c.vz = 0; c.h = 0; c.w = 0; c.gear = 4; for (let t = 0; t < 10 && c.speed > 80 / 3.6; t += DT) { c.inThr = 0; c.inBrk = 1; c.inSteer = 0; c.step(DT, plane); } temps.push(c.flt.brT); }
  const told = c.flt.ev === 'brakes' && c.flt.brH;
  c.vx = 50; drive(c, 20, 0.6, 0);
  check('hard stops one after another: the brakes past 550 °C (told), 20 s at speed cool them', temps[5] > 550 && temps[0] < 200 && told && c.flt.brT < 430 && !c.flt.brH,
    `${temps.map(x => x.toFixed(0)).join(', ')} °C after each stop; ${c.flt.brT.toFixed(0)} °C after 20 s at speed`);
  const stop = (brT) => { const c = onPlane({ brT }, 30); let t = 0; for (; t < 10 && c.speed > 0.5; t += DT) { c.inThr = 0; c.inBrk = 1; c.inSteer = 0; c.flt.brT = brT; c.step(DT, plane); } return c.x; };
  const d200 = stop(200), d560 = stop(560), d650 = stop(650), d760 = stop(760);
  check('hot brakes stop the car later (from 108 km/h)', Math.abs(d560 - d200) < 0.5 && d650 > d200 * 1.15 && d760 > d200 * 1.5,
    `${f1(d200)} m at 200 °C, ${f1(d560)} m at 560 °C, ${f1(d650)} m at 650 °C, ${f1(d760)} m at 760 °C`);
}

// 6. the engine: held slowly at full throttle at the redline (as when the wheels spin in the gravel) it is hot within 15 s (told), at most
// 140 °C; at speed it cools; hot it has less power (100 to 200 km/h: much slower at 121 °C; at 130 °C, 30 % less power, it does not get there)
{
  const c = onPlane({}, 6), M = c.m; let told = null;
  for (let t = 0; t < 60; t += DT) { c.rpm = M.redline; c._heat(DT, 0, 6, 1, M.mass); if (c.flt.ev === 'engine' && told == null) told = t; }
  const top = c.flt.enT;
  for (let t = 0; t < 30; t += DT) { c.rpm = M.redline * 0.7; c._heat(DT, 0, 45, 0.6, M.mass); }
  check('the engine toiling slowly at full throttle: hot within 15 s (told), at most 140 °C; at speed it cools', told != null && told < 15 && top <= 140 && top > 130 && c.flt.enT < 97 && !c.flt.enH,
    `hot after ${f1(told)} s, ${top.toFixed(0)} °C after a minute; ${c.flt.enT.toFixed(0)} °C after 30 s at 160 km/h`);
  const pull = (enT) => { const c = onPlane({ enT }, 100 / 3.6); let t = 0; for (; t < 30 && c.speed < 200 / 3.6; t += DT) { c.inThr = 1; c.inBrk = 0; c.inSteer = 0; c.flt.enT = enT; c.step(DT, plane); } return t; };
  const t85 = pull(85), t112 = pull(112), t121 = pull(121), t130 = pull(130);
  check('a hot engine: less power (100 to 200 km/h)', Math.abs(t112 - t85) < 0.1 && t121 > t85 * 1.25 && t130 >= 30,
    `${f2(t85)} s at 85 °C, ${f2(t112)} s at 112 °C, ${f2(t121)} s at 121 °C, ${t130 >= 30 ? 'not there in 30 s' : f2(t130) + ' s'} at 130 °C`);
}

// 7. races with failures (12 cars, 3 laps of the Red Bull Ring, two races): everyone to the line; a cut tyre now and then, the brakes and
// the engines of the AI in their working range (no fading, no lost power)
{
  const T = track('rbring');
  let fin = 0, all = 0, cuts = 0, hot = 0, maxB = 0, maxE = 0;
  for (let sd = 1; sd <= 2; sd++) {
    Math.random = seeded(sd * 31);
    const r = new C.Race(T, { numAI: 12, noPlayer: true, laps: 3, assist: 2, phys: 'cs', seed: sd, difficulty: 1, faults: true, damage: 2 });
    r.start();
    let t = 0;
    while (t < 600 && !r.cars.every(c => c.finished)) {
      r.step(DT); t += DT;
      for (const c of r.cars) { const F = c.flt; if (F.ev === 'puncture') cuts++; else if (F.ev) hot++; F.ev = ''; maxB = Math.max(maxB, F.brT); maxE = Math.max(maxE, F.enT); }
    }
    for (const c of r.cars) { all++; if (c.finished) fin++; }
  }
  check('races with failures: everyone to the line, a cut tyre now and then, the brakes and engines of the AI in their working range',
    fin === all && cuts <= 4 && hot === 0 && maxB > 150 && maxB < 450 && maxE < 105, `finished ${fin}/${all}; ${cuts} cut tyres; the hottest brakes ${maxB.toFixed(0)} °C, engine ${maxE.toFixed(0)} °C`);
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
