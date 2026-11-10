// The rubbered-in racing line (84, Core only, no browser): in a race with tyres on a real circuit the rubber laid darkens the racing line
// over the race (Race mb.rb), more slowly than the marbles beside it build up (mb.lv); a car on the line grips a little more (RUB.g on the
// darkest, Track.rubberAt: all of it within RUB.in m of the line, none from RUB.out m, where the marbles' band begins: nothing counted
// twice); the rain washes it away with the marbles; the same race twice is the same to the last bit; none without tyres, on an open road
// or on a circuit kept for testing only.
//   node tests/rubber.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f3 = (x) => (Number.isFinite(x) ? x.toFixed(3) : String(x));
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 4, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tyres: true, compounds: true }, o);

// 1. the line's share under a car: all of it near the line, none from RUB.out m, never inside the marbles' band (on every real circuit with pits)
{
  const R = C.RUB, T = track('bathurst'), i = 500, rl = T.rl[i];
  check('under a car: all of it within RUB.in m of the line, less to RUB.out m, none from there', T.rubberAt(i, rl) === 1 && T.rubberAt(i, rl + R.in * 0.98) === 1 && T.rubberAt(i, rl - R.in * 0.98) === 1 &&
    T.rubberAt(i, rl + (R.in + R.out) / 2) > 0 && T.rubberAt(i, rl + (R.in + R.out) / 2) < 1 && T.rubberAt(i, rl + R.out) === 0 && T.rubberAt(i, rl - 3) === 0 && T.rubberAt(-1, 0) === 0, `RUB ${JSON.stringify(R)}`);
  const over = [];
  for (const d of C.TRACKS.filter(d => d.pit && !d.open && !d.test)) {
    const Tk = track(d.id), M = Tk.marbles(); let k = 0;
    for (let j = 0; j < Tk.N; j++) if (M.k[j] > 0.05 && Tk.rubberAt(j, M.c[j] - Math.sign(M.c[j] - Tk.rl[j]) * M.h[j]) > 0) k++;   // (the band's edge nearest the line)
    if (k) over.push(d.id + ' ' + k);
  }
  check('the line\'s grip never reaches the marbles\' band (on every real circuit with pits): nothing counted twice', !over.length, over.join(', '));
}

// a race on Bathurst (13 cars on autopilot): mb.lv and mb.rb at the end of each of the player's laps; the player's grip on the line and
// 2.5 m beside it (on the inside of the bend: no marbles) at tGrip s; the rain from tRain s on
function race(o, tEnd, tGrip, tRain) {
  Math.random = seeded(3);
  const T = track('bathurst'), r = new C.Race(T, opts(Object.assign(o || {}, tRain ? { weather: { at: tRain, dur: 10, to: 1 } } : {})));
  r.start(); const P = r.player, laps = [], out = { r, T, laps, grip: null }; let t = 0, k = 0, lap = P.lap;
  while (t < tEnd) {
    Math.random = seeded(5000 + (++k));
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.lap !== lap) { lap = P.lap; laps.push(r.mb ? [r.mb.lv, r.mb.rb] : null); }
    if (tGrip && !out.grip && t >= tGrip) {
      const M = T.marbles(); let bi = 0; for (let i = 0; i < T.N; i++) if (M.k[i] > M.k[bi]) bi = i;
      const q = P.q, i0 = q.i, d0 = q.d, sd = Math.sign(M.c[bi] - T.rl[bi]), at = (d) => { q.i = bi; q.d = d; r._weather(0); return P.wet; };
      out.grip = { rb: r.mb.rb, line: at(T.rl[bi]), inside: at(T.rl[bi] - sd * 2.5) };
      q.i = i0; q.d = d0; r._weather(0);
    }
  }
  out.t = t; out.rb = r.mb ? r.mb.rb : null;
  return out;
}

// 2. it darkens over the race, more slowly than the marbles; on the line a car grips RUB.g * rb more
const A = race({}, 560, 520, 0);
{
  const L = A.laps.slice(1);
  check('the line darkens lap by lap, more slowly than the marbles: faint after the first lap, darker by the third', L.length >= 3 && L[0][1] > 0.1 && L[0][1] < 0.45 && L[1][1] > L[0][1] && L[2][1] > L[1][1] && L[2][1] > 0.45 && L.every(x => x[1] < x[0]),
    L.map(x => `lv ${f3(x[0])} rb ${f3(x[1])}`).join(' · '));
  const g = A.grip, up = g.line / g.inside - 1;
  check('on the line a car grips a little more (RUB.g of it times how dark the line is), beside it as ever', g.rb > 0.4 && Math.abs(up - C.RUB.g * g.rb) < 1e-6 && up > 0.005 && up < 0.021,
    `+${(up * 100).toFixed(2)} % (rb ${f3(g.rb)}; grip ${f3(g.line)} / ${f3(g.inside)})`);
}

// 3. the rain washes it away (the rain from 120 s on, full at 130 s)
{
  const B = race({}, 300, 0, 120);
  check('the rain washes it away', B.rb < 0.05 && B.r.water > 0.9, `rb ${f3(B.rb)} at ${B.t.toFixed(0)} s (water ${f3(B.r.water)})`);
}

// 4. the same race twice: the same to the last bit
{
  const run = () => { const o = race({}, 60, 0, 0); return { rb: o.r.mb.rb, cars: o.r.cars.map(c => [c.x, c.z, c.wet, c.dist].join(',')).join(';') }; };
  const a = run(), b = run();
  check('the same race twice: the same line and every car in the same place', a.rb === b.rb && a.cars === b.cars && a.rb > 0, f3(a.rb));
}

// 5. none without tyres, on an open road, on a circuit kept for testing only
{
  const r = new C.Race(track('bathurst'), opts({ tyres: false, compounds: false }));
  const O = new C.Race(track('vrsic'), opts({ numAI: 0, playerGrid: 1, laps: 1 }));
  const tst = C.TRACKS.filter(d => d.pit && d.test).map(d => d.id), X = tst.filter(id => new C.Race(track(id), opts({ numAI: 0, playerGrid: 1, laps: 1 })).mb !== null);
  check('none without tyres, on an open road or on a circuit kept for testing only', r.mb === null && O.mb === null && tst.length >= 3 && !X.length, X.join(', '));
}

console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
