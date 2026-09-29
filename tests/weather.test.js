// Sector times, the car's set-up for a track, tyres and a changing weather (Core only, no browser): the three sectors of a lap (their sum
// is the lap time, the car's best and the fastest of anyone); the set-up (Race opts playerSetup: wing and gears) on the car's drag, gearing
// and grip; the tyres (Race opts tyres: slicks and rain tyres, their grip on a dry and a wet road, their wear); a changing weather (Race
// opts weather: the rain starts or stops during the race, the water on the road follows it, the racing line dries first and grips
// better); the AI's pit stops for the right tyres (no more than three cars on their way in at a time, none stuck in the pit lane); a race
// without these options as before (the golden references hold the rest).
//   node tests/weather.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f3 = (x) => (Number.isFinite(x) ? x.toFixed(3) : String(x));

// 1. sector times: a race on the Red Bull Ring on autopilot
{
  Math.random = seeded(41);
  const T = track('rbring'), r = new C.Race(T, { numAI: 3, playerGrid: 4, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 3, difficulty: 1, damage: 0 });
  r.start(); const P = r.player; let t = 0, evs = 0, last = 0;
  while (!P.finished && t < 400) { C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.sec && P.sec.ev !== last) { last = P.sec.ev; evs++; } }
  const S = P.sec, lap2 = P.lapTimes[1], sum2 = S.prev[0] + S.prev[1] + S.prev[2];
  check('sector times: three a lap, S1 + S2 + S3 = the lap time', P.finished && evs === 6 && Math.abs(sum2 - lap2) < 1e-6 && S.prev.every(x => x > 10), `S ${S.prev.map(f3).join(' / ')} = ${f3(sum2)}, lap ${f3(lap2)}, ${evs} sectors`);
  check('sector times: the car\'s best of each, the race\'s fastest of anyone', S.best.every((b, k) => b <= S.prev[k]) && r.sec.best.every((b, k) => b <= S.best[k] && r.cars.some(c => c.sec && c.sec.best[k] === b)),
    `best ${S.best.map(f3).join(' / ')}, fastest ${r.sec.best.map(f3).join(' / ')}`);
  const O = track('pikes'), tt = new C.Race(O, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], phys: 'cs', seed: 3 });
  tt.start(); for (let k = 0; k < 600; k++) { C.aiControl(tt.player, tt, DT); tt.step(DT); }
  check('sector times: none on an open road (a time trial has its checkpoints)', !tt.player.sec, '');
}

// 2. the set-up: wing and gears
{
  const T = track('spa'), mk = (setup) => new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], phys: 'cs', seed: 3, playerSetup: setup }).player;
  const std = mk(undefined), mid = mk({ wing: 1, gear: 1 }), lo = mk({ wing: 0, gear: 2 }), hi = mk({ wing: 2, gear: 0 }), bad = mk({ wing: 7, gear: 'x' });
  check('set-up: the standard one is the stock car', mid.m.cDrag === std.m.cDrag && mid.m.final === std.m.final && mid.aeroK === std.aeroK && mid.setup.wing === 1 && mid.setup.gear === 1, '');
  check('set-up: little wing = less drag and less downforce, long gears = a lower final drive', lo.m.cDrag < std.m.cDrag && lo.aeroK < std.aeroK && lo.m.final < std.m.final,
    `drag ${f3(lo.m.cDrag)} vs ${f3(std.m.cDrag)}, final ${f3(lo.m.final)} vs ${f3(std.m.final)}`);
  check('set-up: much wing = more drag and more downforce, short gears = a higher final drive', hi.m.cDrag > std.m.cDrag && hi.aeroK > std.aeroK && hi.m.final > std.m.final, '');
  check('set-up: out-of-range values are clamped', bad.setup.wing === 2 && bad.setup.gear === 0, JSON.stringify(bad.setup));
  // a flying start down the Kemmel straight: the top speed with little wing and long gears is higher
  const vmax = (setup) => { Math.random = seeded(7); const r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 1, playerModel: C.MODELS[4], phys: 'cs', seed: 3, playerSetup: setup }); r.start(); const P = r.player; let v = 0;
    for (let k = 0; k < 120 * 70; k++) { C.aiControl(P, r, DT); r.step(DT); v = Math.max(v, P.speed); } return v; };
  const vLo = vmax({ wing: 0, gear: 2 }), vHi = vmax({ wing: 2, gear: 0 });
  check('set-up: the Spa set-up (little wing, long gears) is faster on the straights than much wing and short gears', vLo > vHi + 2, `${(vLo * 3.6).toFixed(0)} vs ${(vHi * 3.6).toFixed(0)} km/h`);
}

// 3. tyres: the grip of slicks and rain tyres on a dry and a wet road, the wear
{
  const G = C.TYRE_GRIP;
  check('tyres: slicks grip fully on a dry road, lose most of it in the wet; rain tyres grip less on a dry road and like before in the rain',
    G.dry(0) === 1 && G.dry(1) < 0.7 && G.wet(0) < 1 && G.wet(0) > 0.85 && Math.abs(G.wet(1) - 0.8) < 1e-9 && C.tyreFor(0) === 'dry' && C.tyreFor(1) === 'wet',
    `slicks ${f3(G.dry(0))} / ${f3(G.dry(1))}, rain tyres ${f3(G.wet(0))} / ${f3(G.wet(1))}`);
  Math.random = seeded(9);
  const T = track('rbring'), r = new C.Race(T, { numAI: 2, playerGrid: 3, laps: 1, playerModel: C.MODELS[4], phys: 'cs', seed: 3, tyres: true, rain: 1 });
  check('tyres: in the rain every car starts on rain tyres (the player may choose)', r.cars.every(c => c.ty && c.ty.k === 'wet' && c.ty.wear === 0), r.cars.map(c => c.ty.k).join(','));
  const r2 = new C.Race(T, { numAI: 2, playerGrid: 3, laps: 1, playerModel: C.MODELS[4], phys: 'cs', seed: 3, tyres: true, rain: 1, playerTyre: 'dry' });
  r.start(); r2.start(); let t = 0; const P = r.player, P2 = r2.player;
  while (!P.finished && t < 200) { C.aiControl(P, r, DT); r.step(DT); C.aiControl(P2, r2, DT); r2.step(DT); t += DT; }
  check('tyres: slicks in the rain grip far less (a slower lap), the tyres wear', P.finished && P2.ty.k === 'dry' && P.wet > P2.wet + 0.1 && (!P2.finished || P2.lapTimes[0] > P.lapTimes[0] + 3) && P.ty.wear > 0.005 && P.ty.wear < 0.2,
    `grip ${f3(P.wet)} vs ${f3(P2.wet)}, lap ${f3(P.lapTimes[0])} vs ${f3(P2.lapTimes[0])}, wear ${f3(P.ty.wear)}`);
}

// 4. a changing weather: the rain starts at 30 s (from none to full in 20 s); later it stops and the road dries, the racing line first
{
  Math.random = seeded(12);
  const T = track('grom'), r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 30, playerModel: C.MODELS[4], phys: 'cs', seed: 3, tyres: true, weather: { at: 30, dur: 20, to: 1 } });
  r.start(); const P = r.player, W = r.wst, log = {}; let t = 0, evs = [];
  const at = (s) => { while (t < s) { C.aiControl(P, r, DT); r.step(DT); t += DT; if (W.ev !== evs.length) evs.push(W.evK); } return { rain: r.rain, water: r.water, line: r.lineWater }; };
  log.a = at(29); log.b = at(45); log.c = at(120);
  check('changing weather: dry until the rain starts, then wet in about a minute ("rain" event)', log.a.rain === 0 && log.a.water === 0 && log.b.rain > 0.5 && log.b.water > 0.1 && log.b.water < 0.9 && log.c.water === 1 && evs.join() === 'rain',
    JSON.stringify(log) + ' ' + evs.join());
  Math.random = seeded(13);
  const r2 = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 30, playerModel: C.MODELS[4], phys: 'cs', seed: 3, rain: 1, weather: { at: 10, dur: 10, to: 0 } });
  r2.start(); const P2 = r2.player, W2 = r2.wst; let t2 = 0, ev2 = '', gOn = 0, gOff = 0; const s2 = {};
  const at2 = (s) => { while (t2 < s) { C.aiControl(P2, r2, DT); r2.step(DT); t2 += DT; if (W2.ev) ev2 = W2.evK; } return { rain: r2.rain, water: +r2.water.toFixed(3), line: +r2.lineWater.toFixed(3) }; };
  s2.a = at2(21); s2.b = at2(90);
  // the grip on the line and off it (a car moved across the road)
  { const q = P2.q, d0 = q.d, i = q.i; P2.q.d = T.rl[i]; r2._weather(0); gOn = P2.wet; P2.q.d = T.rl[i] + 5; r2._weather(0); gOff = P2.wet; P2.q.d = d0; }
  s2.c = at2(300);
  check('changing weather: the rain stops ("dry" event), the racing line dries first, then the whole road', s2.a.rain === 0 && ev2 === 'dry' && s2.b.line < s2.b.water && s2.b.water < 1 && s2.c.water === 0 && s2.c.line === 0,
    JSON.stringify(s2));
  check('changing weather: on the drier racing line the grip is better than off it', gOn > gOff + 0.03, `on the line ${f3(gOn)}, off it ${f3(gOff)}`);
}

// 5. the AI's pit stops for tyres: the rain starts on the second lap of the Red Bull Ring (pits beside the start straight)
{
  Math.random = seeded(3);
  const T = track('rbring'), est = T.len * 3 / 38;
  const r = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, tyres: true, weather: { at: est * 0.3, dur: 25, to: 1 } });
  r.start(); const P = r.player; let t = 0, k = 0, maxIn = 0, rescues = 0; const stops = new Set();
  const oR = r.rescue.bind(r); r.rescue = (c) => { if (c.inPit || c.pitWant) rescues++; return oR(c); };
  while (t < est * 2 + 120 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    let nIn = 0; for (const c of r.cars) { if (!c.isPlayer && (c.pitWant || c.inPit)) nIn++; if (c.pitState === 'repair') stops.add(c); }
    maxIn = Math.max(maxIn, nIn);
  }
  const wets = r.cars.filter(c => !c.isPlayer && c.ty.k === 'wet').length;
  check('AI pit stops: rivals come in for rain tyres, no more than three on their way in at a time, none stuck in the pit lane', stops.size >= 4 && wets === stops.size && maxIn <= 3 && rescues === 0,
    `${stops.size} stops, ${wets} on rain tyres, at most ${maxIn} in at once, ${rescues} rescued`);
  check('AI pit stops: every car finishes', r.cars.every(c => c.finished || c.isPlayer), `${r.cars.filter(c => c.finished).length}/13 in ${t.toFixed(0)} s`);
}

// 6. without the new options: no tyres, no weather changes, the grip of the old rain
{
  const T = track('rbring'), r = new C.Race(T, { numAI: 2, playerGrid: 3, laps: 1, playerModel: C.MODELS[4], phys: 'cs', seed: 3, rain: 1 });
  check('without tyres and a changing weather: as before (no tyres on the cars, the rain\'s grip for all)', !r.wst.on && r.cars.every(c => !c.ty && Math.abs(c.wet - 0.8) < 1e-9) && r.water === 1, '');
}

console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
