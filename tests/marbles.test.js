// The marbles (Core only, no browser): in a race with tyres on a circuit the bits of rubber the tyres shed collect just off the racing line,
// on the outside of the corners (Track.marbles: the band beside the line, on the road, none on the straights, on every real track with
// pits); the band builds up lap by lap (Race mb.lv), faster with more cars; a car on it grips a few % less (on the racing line and on the
// inside of the bend nothing changes); the rain washes it away; the same race twice is the same to the last bit (no random draws); none
// without tyres, on an open road or on a circuit kept for testing only (the golden references, without tyres, hold the rest).
//   node tests/marbles.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f3 = (x) => (Number.isFinite(x) ? x.toFixed(3) : String(x));
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tyres: true, compounds: true }, o);

// 1. the band on every real circuit with pits: beside the racing line on the outside of the bends (the line's curvature over ±16 m), at
// least 1.3 m off it, on the asphalt, none on the straights; some of every lap
{
  const out = [];
  for (const d of C.TRACKS.filter(d => d.pit && !d.open && !d.test)) {
    const T = track(d.id), M = T.marbles(), N = T.N; let on = 0, wrong = 0, offRoad = 0, nearLine = 0, straight = 0;
    for (let i = 0; i < N; i++) {
      let s = 0; for (let o = -8; o <= 8; o++) s += T.rk[(i + o + N) % N]; s /= 17;
      const w = T.wa ? T.wa[i] : T.w;
      if (Math.abs(s) < 1 / 400 && M.k[i] > 0) straight++;
      if (M.k[i] < 0.05) continue;
      on++;
      if (Math.sign(M.c[i] - T.rl[i]) !== -Math.sign(s)) wrong++;   // (+n to the right: a right bend's outside is to the left)
      if (Math.abs(M.c[i]) + M.h[i] > w - 0.29) offRoad++;
      if (Math.abs(M.c[i] - T.rl[i]) - M.h[i] < 1.29) nearLine++;
    }
    out.push({ id: d.id, share: on / N, wrong, offRoad, nearLine, straight });
  }
  const badT = out.filter(o => o.share < 0.05 || o.share > 0.5 || o.wrong || o.offRoad || o.nearLine || o.straight);
  check('the band on every real circuit with pits: on the outside of the bends, 1.3 m or more off the racing line, on the asphalt, none on the straights, 5-50 % of the lap',
    out.length >= 13 && !badT.length, (badT.length ? JSON.stringify(badT) + ' · ' : '') + out.map(o => `${o.id} ${(o.share * 100).toFixed(0)} %`).join(', '));
  const T = track('cpalace'), a = T.marbles(), b = new C.Track(T.def).marbles();
  check('the band: the same every time it is found', a.k.every((v, i) => v === b.k[i] && a.c[i] === b.c[i] && a.h[i] === b.h[i]), '');
}

// a race on Crystal Palace (13 cars on autopilot, tyres and compounds); the rain from tRain s on (or none): the band's thickness at the end of
// each lap of the player and every 10 s, the player's grip on and beside the band at tGrip s, the band at the end (tEnd s)
function race(o, tEnd, tGrip, tRain) {
  Math.random = seeded(3);
  const T = track('cpalace'), r = new C.Race(T, opts(Object.assign(o || {}, tRain ? { weather: { at: tRain, dur: 10, to: 1 } } : {})));
  r.start(); const P = r.player, laps = [], out = { r, T, laps, grip: null, lvT: [] }; let t = 0, k = 0, lap = P.lap;
  while (t < tEnd) {
    Math.random = seeded(5000 + (++k));
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.lap !== lap) { lap = P.lap; laps.push(r.mb ? r.mb.lv : null); }
    if (k % 1200 === 0) out.lvT.push(r.mb ? r.mb.lv : null);
    if (tGrip && !out.grip && t >= tGrip) {
      // the player's car moved across the road at the thickest of the band (its query only): on the racing line, on the band, on the inside
      const M = T.marbles(); let bi = 0; for (let i = 0; i < T.N; i++) if (M.k[i] > M.k[bi]) bi = i;
      const q = P.q, i0 = q.i, d0 = q.d, sd = Math.sign(M.c[bi] - T.rl[bi]), at = (d) => { q.i = bi; q.d = d; r._weather(0); return P.wet; };
      out.grip = { lv: r.mb.lv, k: M.k[bi], line: at(T.rl[bi]), band: at(M.c[bi]), edge: at(M.c[bi] - sd * (M.h[bi] + 0.2)), inside: at(T.rl[bi] - sd * 2.5) };
      q.i = i0; q.d = d0; r._weather(0);
    }
  }
  out.t = t; out.lv = r.mb ? r.mb.lv : null;
  return out;
}

// 2. the band builds up lap by lap; the more cars, the faster (the race: the grip looked at after 280 s, the rain from 290 s, full at 300 s)
const A = race({ laps: 6 }, 420, 280, 290);
{
  const L = A.laps.slice(1);   // (the first: crossing the line from the grid)
  const dry = A.lvT.slice(0, 29);   // (every 10 s up to the rain)
  check('the band builds up lap by lap: some after the first lap, most after three', L.length >= 3 && L[0] > 0.3 && L[0] < 0.8 && L[1] > L[0] + 0.1 && L[2] > L[1] && L[2] > 0.8 && dry.every((v, i) => !i || v >= dry[i - 1]),
    `at the end of laps 1-${L.length}: ${L.map(f3).join(', ')}`);
  const B = race({ numAI: 2, playerGrid: 3 }, 100, 0, 0);
  const a100 = A.lvT[Math.round(100 * 120 / 1200) - 1];
  check('the more cars, the faster: 3 cars lay far less in the same 100 s than 13', B.lv > 0.02 && B.lv < 0.5 * a100, `3 cars ${f3(B.lv)}, 13 cars ${f3(a100)}`);
}

// 3. a car on the band grips a few % less; on the racing line and on the inside of the bend nothing changes
{
  const g = A.grip, loss = 1 - g.band / g.line;
  check('on the band (the thickest of it, after three laps) the grip is a few % lower, at its edge a little', g.lv > 0.85 && loss > 0.03 && loss < 0.07 && g.edge < g.line && g.edge > g.band,
    `band ${(loss * 100).toFixed(1)} %, edge ${((1 - g.edge / g.line) * 100).toFixed(1)} % (lv ${f3(g.lv)}, k ${f3(g.k)}; grip ${f3(g.line)} / ${f3(g.band)} / ${f3(g.edge)})`);
  check('on the racing line and on the inside of the bend: the tyres\' own grip, nothing less', g.inside === g.line, `${f3(g.line)} / ${f3(g.inside)}`);
}

// 4. the rain washes the band away (from 290 s on, full at 300 s)
{
  const pre = A.lvT[28];   // (at 290 s)
  check('the rain washes the band away: thick before the rain, almost none two minutes into it', pre > 0.85 && A.lv < 0.1 && A.r.water > 0.9, `before ${f3(pre)}, at ${A.t.toFixed(0)} s ${f3(A.lv)} (water ${f3(A.r.water)})`);
}

// 5. the same race twice: the same to the last bit
{
  const run = () => { const o = race({}, 60, 0, 0); return { d: o.r.mb.d, cars: o.r.cars.map(c => [c.x, c.z, c.wet, c.dist].join(',')).join(';') }; };
  const a = run(), b = run();
  check('the same race twice: the same marbles and every car in the same place', a.d === b.d && a.cars === b.cars && a.d > 0, `${a.d.toFixed(3)} car-metres`);
}

// 6. none without tyres (the golden references' races), none on an open road, none on the circuits kept for testing only
{
  Math.random = seeded(7);
  const T = track('cpalace'), r = new C.Race(T, opts({ tyres: false, compounds: false }));
  r.start(); for (let k = 0; k < 120 * 40; k++) { Math.random = seeded(900 + k); C.aiControl(r.player, r, DT); r.step(DT); }
  check('a race without tyres: no marbles, the grip as ever', r.mb === null && !r.wst.on && r.cars.every(c => c.wet === 1), '');
  const O = new C.Race(track('vrsic'), opts({ numAI: 0, playerGrid: 1, laps: 1 }));
  check('an open road, even with tyres: no marbles', O.mb === null, '');
  const tst = C.TRACKS.filter(d => d.pit && d.test).map(d => d.id), X = tst.filter(id => new C.Race(track(id), opts({ numAI: 0, playerGrid: 1, laps: 1 })).mb !== null);
  check('a circuit kept for testing only (test: true), even with tyres: no marbles (CLAUDE.md: no new graphics there)', tst.length >= 3 && !X.length, tst.join(', ') + (X.length ? ' — WITH: ' + X.join(', ') : ''));
}

console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
