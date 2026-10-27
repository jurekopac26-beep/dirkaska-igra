// The weather forecast (Race.forecast; Core only, no browser): in a changing weather (Race opts weather, the game's "Menljivo") the
// engineer's forecast for a car in its laps: the rain on its way ('rain') or going ('stop') with a range of whole laps that always holds the
// estimate (n: the seconds to the change over the car's lap time: its best lap, before the first the AI's profile a tenth slower), wider the
// further off, placed by the race's seed and the car's lap (so roughly, not to the second), within a lap as 0..1; the chance told (50 to 95
// %, in fives, lower the further off); once the change is behind, or when it comes after the car's finish, 'dry' / 'wet' to the finish.
// None in a steady weather, on the open road, for a car out of the race. The same every time for the same race (no Math.random), and only
// read: a race asked for it every step steps exactly as one never asked (the golden references stay as they are). The engineer's voice
// lines for it.
//   node tests/forecast.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');
const { DT, seeded, raceState } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : String(x));
const T = track('rbring');
const mk = (o) => new C.Race(T, Object.assign({ numAI: 3, playerGrid: 4, laps: 6, playerModel: C.MODELS[4], phys: 'cs', seed: 3, tyres: true, compounds: true, radio: true }, o));
const fine = (f) => !!f && Number.isInteger(f.lo) && Number.isInteger(f.hi) && f.lo < f.hi && f.lo <= f.n + 1e-9 && f.n <= f.hi + 1e-9 && (f.n < 1 ? f.lo === 0 && f.hi === 1 : f.lo >= 1) && f.p >= 50 && f.p <= 95 && f.p % 5 === 0;
const show = (f) => f && (f.k + (f.n != null ? ` n ${f2(f.n)} ${f.lo}-${f.hi} ${f.p} %` : ''));

// 1. none in a steady weather, on the open road; for a car out of the race none either
{
  const dry = mk({}), wet = mk({ rain: 1 }), road = new C.Race(track('vrsic'), { numAI: 1, playerGrid: 2, laps: 1, phys: 'cs', seed: 3, weather: { at: 30, dur: 20, to: 1 } });
  const r = mk({ weather: { at: 400, dur: 30, to: 1 } }), P = r.player; P.finished = true; const fin = r.forecast(P); P.finished = false;
  check('none in a steady weather (dry or wet), on the open road, for a car that has finished', dry.forecast(dry.player) === null && wet.forecast(wet.player) === null && road.forecast(road.player) === null && fin === null && !!r.forecast(P), '');
}

// 2. the rain on its way: before the start the laps at the AI's pace a tenth slower; the range holds the estimate, the chance in fives;
//    the same for the same race, again and in a race built the same way
{
  const at = 400, r = mk({ weather: { at, dur: 30, to: 1 } }), P = r.player, f = r.forecast(P), lt = r._lapT(P);
  let prof = 0; for (let i = 0; i < T.N; i++) prof += T.ds / Math.max(5, r.vprof[i]);
  const g = r.forecast(P), h = mk({ weather: { at, dur: 30, to: 1 } }).forecast(mk({ weather: { at, dur: 30, to: 1 } }).player);
  check('the rain on its way (at the start): k rain, n = the seconds to it over the lap time (the profile\'s lap a tenth slower), the range holds n, the chance in fives',
    f.k === 'rain' && Math.abs(lt - prof * 1.1) < 1e-9 && Math.abs(f.n - at / lt) < 1e-9 && fine(f), `${show(f)}, lap ${f2(lt)} s`);
  check('the same forecast asked again and in a race built the same way (the seed, not Math.random)', JSON.stringify(f) === JSON.stringify(g) && JSON.stringify(f) === JSON.stringify(h), `${show(g)} / ${show(h)}`);
}

// 3. roughly: over many races (seeds) the range always holds the estimate but is placed round it differently (the estimate in its lower and
//    in its upper half), wider the further off; the chance lower the further off
{
  const rows = [];
  for (let s = 1; s <= 50; s++) for (const at of [60, 150, 250, 500, 900]) { const r = mk({ seed: s, laps: 12, weather: { at, dur: 30, to: 1 } }), f = r.forecast(r.player); rows.push({ s, at, f }); }
  const all = rows.every(x => fine(x.f) && x.f.k === 'rain'), mid = (f) => (f.n - f.lo) / (f.hi - f.lo);
  const far = rows.filter(x => x.f.n > 3), low = far.filter(x => mid(x.f) < 0.45).length, high = far.filter(x => mid(x.f) > 0.55).length;
  const wide = (k) => { const a = rows.filter(x => k ? x.f.n > 5 : x.f.n >= 1 && x.f.n < 2.5).map(x => x.f.hi - x.f.lo); return a.reduce((s, v) => s + v, 0) / Math.max(1, a.length); };
  const pNear = rows.filter(x => x.f.n < 1).map(x => x.f.p), pFar = rows.filter(x => x.f.n > 5).map(x => x.f.p);
  check('over 250 races (12 laps) the range always holds the estimate (within a lap: 0..1)', all && rows.some(x => x.f.n < 1) && rows.some(x => x.f.n > 5), rows.filter(x => !fine(x.f)).slice(0, 3).map(x => x.s + '/' + x.at + ': ' + show(x.f)).join(' | '));
  check('roughly: the estimate sometimes in the lower half of the range, sometimes in the upper (placed by the seed)', low >= 5 && high >= 5, `${low} low, ${high} high of ${far.length}`);
  check('wider the further off: over 5 laps wider on average than 1 to 2.5 laps', wide(1) > wide(0) + 0.3, `${f2(wide(0))} vs ${f2(wide(1))} laps`);
  check('the chance lower the further off: within a lap 75 % or more, over 5 laps 60 % or less', pNear.length > 5 && pFar.length > 5 && Math.min(...pNear) >= 75 && Math.max(...pFar) <= 60, `near ${Math.min(...pNear)}-${Math.max(...pNear)}, far ${Math.min(...pFar)}-${Math.max(...pFar)}`);
}

// 4. a race on: the laps count down with the race and the car's own pace (its best lap once it has one), a new estimate each lap, then
//    "rain to the finish" once it rains; read only: the same race asked every step steps exactly as one never asked
{
  Math.random = seeded(11);
  const W = { at: 330, dur: 30, to: 1 }, a = mk({ weather: W, laps: 5 }), b = mk({ weather: W, laps: 5 });
  a.start(); b.start(); const P = a.player, Q = b.player, seen = [];
  let same = true, t = 0, lt1 = null;
  while (t < 420) {
    Math.random = seeded(1000 + Math.round(t / DT)); C.aiControl(P, a, DT); a.step(DT);
    Math.random = seeded(1000 + Math.round(t / DT)); C.aiControl(Q, b, DT); b.step(DT);
    const f = b.forecast(Q); t += DT;
    if (Math.round(t / DT) % 120 === 0) { seen.push({ t, lap: Q.lap, f }); if (raceState(a) !== raceState(b)) same = false; }
    if (lt1 == null && Q.lapTimes.length) lt1 = { f, lt: b._lapT(Q), best: Math.min(...Q.lapTimes), dt: W.at - b.time };
  }
  const before = seen.filter(x => x.t < W.at - 1), after = seen.filter(x => x.t > W.at + 1), laps = new Set(before.map(x => x.lap));
  check('the race on: until the rain "rain" with the range holding the estimate (the laps down with the race), after it "wet" to the finish',
    before.length > 100 && before.every(x => x.f.k === 'rain' && fine(x.f)) && before.every((x, i) => !i || x.f.n < before[i - 1].f.n + (x.lap !== before[i - 1].lap ? 2 : 1e-9)) && before[before.length - 1].f.n < 0.2 && after.length > 20 && after.every(x => x.f.k === 'wet' && x.f.lo === null),
    `${show(before[0].f)} .. ${show(before[before.length - 1].f)}, after ${show(after[0] && after[0].f)}; laps ${[...laps].join(',')}`);
  check('after the first lap: the car\'s own best lap is the lap time', !!lt1 && lt1.lt === lt1.best && Math.abs(lt1.f.n - lt1.dt / lt1.best) < 0.02, lt1 && `lap ${f2(lt1.lt)} s, n ${f2(lt1.f.n)}`);
  check('read only: a race asked every step steps exactly as one never asked (the whole state every second)', same, '');
}

// 5. a wet start: the rain stopping ('stop', to the end of its fade), then dry to the finish; a change after the car's finish: the weather
//    as it is to the finish
{
  const r = mk({ rain: 1, weather: { at: 100, dur: 25, to: 0 } }), P = r.player, f0 = r.forecast(P);
  r.time = 115; const f1 = r.forecast(P); r.time = 126; const f2b = r.forecast(P);
  const late = mk({ weather: { at: 5000, dur: 30, to: 1 } }), lw = mk({ rain: 1, weather: { at: 5000, dur: 30, to: 0 } });
  check('a wet start: "stop" with its range before the rain is gone (to the end of its fade: at + dur), then "dry" to the finish', f0.k === 'stop' && fine(f0) && f1.k === 'stop' && f1.n < f0.n && f2b.k === 'dry', `${show(f0)} / ${show(f1)} / ${show(f2b)}`);
  check('a change after the car\'s finish: the weather as it is to the finish ("dry", "wet")', late.forecast(late.player).k === 'dry' && lw.forecast(lw.player).k === 'wet', '');
}

// 6. the engineer's voice for each kind (js/comm.js LINES, said in English; game.js fcRadio fills {when}: "within a lap", "in 2 to 3 laps", and {p})
{
  const src = fs.readFileSync(path.join(ROOT, 'js', 'comm.js'), 'utf8'), line = (k) => (new RegExp('\\b' + k + ': \\[([^\\n]*)\\],').exec(src) || [])[1] || '';
  const L = ['radioFcRain', 'radioFcStop', 'radioFcDry', 'radioFcWet'].map(k => [k, line(k)]);
  check('the engineer\'s voice: a line for each kind (the rain coming and stopping with {when} and {p})', L.every(([, v]) => v.length > 10) && L.slice(0, 2).every(([, v]) => v.split("', '").every(x => /\{when\}/.test(x) && /\{p\}/.test(x))), L.map(([k, v]) => k + (v ? '' : ' missing')).join(', '));
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
