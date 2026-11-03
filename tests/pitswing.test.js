// The places a pit stop gained or lost (Core only, no browser; Race._pitSwing, game.js pitSwingHUD shows them: +2 MESTI, −1 MESTO,
// BREZ SPREMEMBE): the player's place 150 m before the way in on the lap of a stop (before braking for the lane) against the one once the
// order has settled after it: 2 s out of the lane (~3 s after the autopilot hands the car back), and every rival that was in the lane with
// the player out of it again, 10 s at most. Counted by the cars racing at both moments: a rival that retired meanwhile neither a place
// gained nor lost. The Red Bull Ring, 3 laps, the player on the autopilot from the middle of the grid, in at the end of each lap: the first
// stop with the car right behind it in on the same lap (the result once every rival in the lane with the player is out again; a place lost
// to each that came out ahead of it), the second with the two cars right ahead of it held in their boxes (passed in the lane: a place
// gained on each still ahead before the way in; the result after 10 s, one of them still in) and a car ahead retiring meanwhile (not
// counted), the third on the last lap (over the line in the lane: none). None in a race without the player, in a time trial, on a track
// without pits; the race's plain fields (the golden references' digest) unchanged.
//   node tests/pitswing.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : String(x));

// 1. the Red Bull Ring, 3 laps, a stop at the end of each. On each lap, half way round, the player told to come in (and the rival the lap
// asks for); 150 m before the way in (the test's own reckoning, as Core's) the place and the cars ahead; the lane in and out (the player's
// and the rivals'); each result as it comes (the race's psw.n)
{
  const T = track('rbring'), L = T.len, D = T.def.pit, orig = Math.random;
  const dE = (c) => (((D[1] - c.dist) % L) + L) % L;
  Math.random = seeded(7);
  const r = new C.Race(T, { numAI: 7, playerGrid: 4, laps: 3, playerModel: C.MODELS[0], assist: 2, phys: 'cs', seed: 21, difficulty: 1, tyres: true, compounds: true });
  r.start();
  const P = r.player, stops = [], res = []; let t = 0, k = 0, cur = null, lastE = Infinity, n0 = 0, laneIn = false;
  const lane = new Map();   // (each car's way in and out of the lane: [{ t0, t1 }])
  try {
    while (t < 900 && !P.finished) {
      Math.random = seeded(5000 + (++k));
      const O = r.order || [];
      if (r.state === 'racing' && !cur && !P.inPit && P.lap >= 1 && P.dist > (P.lap - 1) * L + L * 0.4 && dE(P) > 600) {   // (half way round: in at the end of this lap)
        const pi = O.indexOf(P); cur = { lap: P.lap, pre: null, t0: null, t1: null, A: [], B: null, Cx: null, mates: new Set() };
        P.pitWant = true;
        if (P.lap === 1 && O[pi + 1]) { cur.B = O[pi + 1]; cur.B.pitWant = true; }   // (the first stop: the car right behind in too)
        if (P.lap === 2) { cur.A = O.slice(Math.max(0, pi - 2), pi); for (const c of cur.A) c.pitWant = true; }   // (the second: the two cars right ahead in too, held in their boxes)
        stops.push(cur);
      }
      if (cur) for (const c of cur.A) if (c.pitState === 'repair' && c.pitDur < 30) c.pitDur = 40;   // (a long repair)
      if (cur && cur.lap === 2 && !cur.Cx && P.pitState === 'repair') {   // (the second stop: a car ahead of the player before the way in retires meanwhile)
        const x = cur.pre && O.find(o => !cur.A.includes(o) && cur.pre.ahead.includes(o) && !o.inPit && !r.isOut(o));
        if (x) { cur.Cx = x; r.retire(x); }
      }
      C.aiControl(P, r, DT); r.step(DT); t += DT; P.hitCar = P.hitWall = 0;
      const e = dE(P);
      if (cur && !cur.pre && !P.inPit && e <= 150 && lastE > 150) cur.pre = { pos: P.pos, ahead: r.order.filter(o => o.pos < P.pos), t };
      lastE = e;
      for (const c of r.cars) { const a = lane.get(c) || []; lane.set(c, a); const o = a[a.length - 1]; if (c.inPit && (!o || o.t1 != null)) a.push({ t0: t, t1: null }); else if (!c.inPit && o && o.t1 == null) o.t1 = t; }
      if (cur && P.inPit) { if (!laneIn) cur.t0 = t; for (const o of r.cars) if (o !== P && o.inPit) cur.mates.add(o); }
      if (cur && laneIn && !P.inPit) { cur.t1 = t; P.pitWant = false; }
      laneIn = P.inPit;
      if (r.psw && r.psw.n !== n0) { n0 = r.psw.n; const x = r.psw.res; res.push({ lap: cur ? cur.lap : 0, t, d: x.d, pos0: x.pos0, pos1: x.pos1, gain: x.gain.slice(), lose: x.lose.slice(), dnf: r.cars.filter(c => !c.finished && r.isOut(c)) }); }
      if (cur && cur.t1 != null && (res.some(x => x.lap === cur.lap) || t - cur.t1 > 15)) cur = null;   // (the next lap's stop once this one's result is in)
    }
  } finally { Math.random = orig; }
  const [s1, s2, s3] = stops, r1 = res.find(x => x.lap === 1), r2 = res.find(x => x.lap === 2), out = (c, t0) => { const a = (lane.get(c) || []).find(x => x.t0 >= t0 - 30); return a ? a.t1 : null; };
  const nm = (a) => a.map(c => c.name).join(', ') || '-', fmt = (x) => x ? `${x.d > 0 ? '+' : ''}${x.d} (${x.pos0} → ${x.pos1}) at ${f1(x.t)} s, gained ${nm(x.gain)}, lost ${nm(x.lose)}` : 'none';

  check('the first stop: one result, the place 150 m before the way in (the cars ahead then) against the one after; the places as the numbers say (nobody retired), lost to the cars that passed meanwhile',
    !!s1 && !!s1.pre && !!r1 && r1.pos0 === s1.pre.pos && r1.d === r1.pos0 - r1.pos1 && r1.d === r1.gain.length - r1.lose.length && r1.d < 0 && r1.lose.every(c => !s1.pre.ahead.includes(c)),
    `before the way in P${s1 && s1.pre && s1.pre.pos}; ${fmt(r1)}`);
  // (each rival in the lane with the player: out of it ahead of the player, so a place lost to it unless it was ahead before the way in,
  // or behind it, so a place gained on it if it was ahead then)
  const byLane = (s, x) => [...s.mates].filter(c => !x.dnf.includes(c)).map(c => { const o = out(c, s.t0), first = o != null && o < s.t1, was = s.pre.ahead.includes(c);
    return { c, o, ok: x.lose.includes(c) === (first && !was) && x.gain.includes(c) === (!first && was) }; });
  const m1 = s1 && s1.pre && r1 ? byLane(s1, r1) : [], last1 = Math.max(s1 ? s1.t1 + 2 : 0, ...m1.map(m => m.o == null ? Infinity : m.o));
  check('... with rivals in the lane at the same time (the car right behind told to come in too): the result once all of them are out again (2 s or more out of the lane, within 10 s); a place lost to each that came out ahead of the player, none to the others',
    !!s1 && !!r1 && !!s1.B && s1.mates.has(s1.B) && last1 < s1.t1 + 10 && r1.t >= last1 - 1e-6 && r1.t - last1 < DT * 1.5 && m1.every(m => m.ok),
    `out of the lane at ${f1(s1 && s1.t1)} s; in it with the player: ${m1.map(m => `${m.c.name} out at ${f1(m.o)} s`).join(', ')}; the result at ${f1(r1 && r1.t)} s`);
  const A = s2 ? s2.A : [], Cx = s2 && s2.Cx, m2 = s2 && s2.pre && r2 ? byLane(s2, r2) : [];
  check('the second stop: the two cars right ahead in too, held in their boxes (a long repair), passed in the lane: a place gained on each still ahead before the way in (none on one the player passed before it); the result 10 s out of the lane (one of them still in it)',
    A.length === 2 && !!r2 && A.every(c => s2.mates.has(c)) && A.some(c => r2.gain.includes(c)) && A.some(c => out(c, s2.t0) == null || out(c, s2.t0) > r2.t) && m2.every(m => m.ok) && Math.abs(r2.t - (s2.t1 + 10)) < DT * 1.5,
    `${A.map(c => `${c.name} (${s2.pre.ahead.includes(c) ? 'ahead' : 'behind'} before the way in) out at ${f1(out(c, s2.t0))} s`).join(', ')}; out of the lane at ${f1(s2 && s2.t1)} s; ${fmt(r2)}`);
  check('... a car ahead retiring meanwhile: neither a place gained nor lost (the place one better than the stop alone gives)',
    !!Cx && !!r2 && r.isOut(Cx) && !r2.gain.includes(Cx) && !r2.lose.includes(Cx) && r2.d === r2.gain.length - r2.lose.length && r2.pos0 - r2.pos1 === r2.d + 1,
    `${Cx ? Cx.name : '-'} retired; ${fmt(r2)}`);
  check('the third stop, on the last lap: over the line in the lane, no result; two results in the race, one a stop',
    !!s3 && s3.lap === 3 && P.finished && res.length === 2 && res.every(x => x.lap === 1 || x.lap === 2) && r.psw.n === 2,
    `${stops.length} stops (laps ${stops.map(s => s.lap).join(', ')}), ${res.length} results, finished ${P.finished} at ${f1(t)} s`);
}

// 2. none in a race without the player (the title demo), in a time trial, on a track without pits; the race's plain fields (the golden
// references' digest: tests/lib/sim.js stateLine) without it
{
  const run = (id, o, sec) => { const orig = Math.random; Math.random = seeded(3); try { const r = new C.Race(track(id), Object.assign({ phys: 'cs', seed: 3, assist: 2 }, o)); r.start(); for (let t = 0; t < sec; t += DT) { if (r.player) C.aiControl(r.player, r, DT); r.step(DT); } return r; } finally { Math.random = orig; } };
  const demo = run('rbring', { numAI: 3, noPlayer: true, laps: 2 }, 20), tt = run('pikes', { numAI: 0, playerGrid: 1, laps: 1 }, 5), road = run('vrsic', { numAI: 2, playerGrid: 3, laps: 1 }, 10), on = run('rbring', { numAI: 3, playerGrid: 2, laps: 2 }, 20);
  check('none without the player, in a time trial, on a track without pits; in a race on one with pits kept out of the race\'s plain fields',
    !demo.psw && !tt.psw && !road.psw && !!on.psw && !Object.keys(on).includes('psw') && on.psw.n === 0, JSON.stringify({ demo: !!demo.psw, tt: !!tt.psw, road: !!road.psw, on: !!on.psw, keys: Object.keys(on).includes('psw') }));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
