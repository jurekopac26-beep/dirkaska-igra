// Fuel and the race's length (Core only, no browser): Race opts fuel on a circuit with pits: every car starts with a full tank (its weight on
// the car: a heavier car picks up speed more slowly), burns it with the throttle (more flat out, a little at idle), a full tank lasts a
// normal race (nobody stops for fuel) but not a long one (twice the laps): the rivals come in once for it when what is left will not reach
// the line, on the last lap they can still make it round to the pit lane (the stop longer the emptier the tank, refilled to the brim); a car
// that does not stop runs dry: the last drops take it on at a crawl (40 km/h at most) to the pits, where the player is filled up too. Off
// (the default), on an open road and on a circuit without pits: no fuel at all (the golden references hold the rest of a race without it;
// the game asks for none in a time trial or in qualifying).
//   node tests/fuel.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : String(x));
const T = track('toskana');
const mk = (o) => { Math.random = seeded(7); const r = new C.Race(T, Object.assign({ numAI: 6, playerGrid: 7, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 5, difficulty: 1, damage: 0 }, o)); r.start(); return r; };   // (with fuel: the tyres too, as in the game)
// a race to the end (or until `sec`): the player on autopilot (drive: its own driving before the autopilot); each car's stops and its fuel then
function run(r, sec, drive) {
  const P = r.player, stops = new Map(), dur = new Map(), fuelIn = new Map(), low = new Map(), was = new Map(); let t = 0, dryAt = null, vDry = 0, dryM = 0, nDry = 0, okDry = 0;
  while (t < sec && !r.cars.every(c => c.finished)) {
    if (drive) drive(r, t);
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    const hit = P.hitCar > 0 || P.hitWall > 0; P.hitCar = 0; P.hitWall = 0;   // (as the game does after each step: a knock is read once)
    for (const c of r.cars) {
      if (c.fuel != null) low.set(c, Math.min(low.has(c) ? low.get(c) : 1, c.fuel));
      if (c.pitState === 'repair' && was.get(c) !== 'repair') { stops.set(c, (stops.get(c) || 0) + 1); dur.set(c, c.pitDur); fuelIn.set(c, c.fuel); }
      was.set(c, c.pitState);
    }
    if (P.fuel === 0 && !P.inPit) { if (dryAt == null) dryAt = t; else { nDry++; if (P.speed < 11.2 || P.inThr === 0 || hit) okDry++; vDry = Math.max(vDry, P.speed); dryM += P.speed * DT; } }   // (dry: the engine drives it only under 40 km/h; a knock from another car in that step may take it over)
  }
  return { t, stops, dur, fuelIn, low, dryAt, vDry, dryM, crawl: nDry ? okDry / nDry : 0 };
}

// 1. off: no fuel; asked for on an open road or on a circuit without pits: none either
{
  const r = mk({});
  const O = track('pikes'), up = new C.Race(O, { numAI: 5, playerGrid: 6, laps: 1, playerModel: C.MODELS[4], phys: 'cs', seed: 5, fuel: true });
  const J = track('jezero'), nop = new C.Race(J, { numAI: 5, playerGrid: 6, laps: 3, playerModel: C.MODELS[4], phys: 'cs', seed: 5, fuel: true });
  check('off (the default): no fuel on any car, the race as before', !r.fuelRate && r.cars.every(c => c.fuel == null && !c.fuelKg), '');
  check('none on an open road or on a circuit without pits (nowhere to fill up)', !up.fuelRate && !nop.fuelRate && [up, nop].every(x => x.cars.every(c => c.fuel == null)), '');
}

// 2. a full tank: its weight by the car, a heavier car slower off the line
{
  const r = mk({ tyres: true, fuel: true }), one = (id) => new C.Race(T, { numAI: 0, playerGrid: 1, laps: 3, playerModel: C.MODELS.find(m => m.id === id), phys: 'cs', seed: 5, fuel: true }).player;
  const V = one('vortex'), R = one('rally'), F = one('formula'), L = one('lm'), K = one('truck'), E = one('ev');
  const tank = (M) => M.ev ? 0 : M.body === 'formula' ? 105 : M.body === 'lm' ? 75 : M.body === 'truck' ? 90 : M.id === 'rally' ? 60 : 45;
  check('fuel on: every car starts full (a sedan 45 kg of fuel, the rally car 60, the prototype 75, the truck 90, the formula 105; the electric car\'s battery weighs the same full or empty)',
    r.cars.every(c => c.fuel === 1 && c.fuelKg === c.tankKg && c.tankKg === tank(c.m)) && V.tankKg === 45 && R.tankKg === 60 && L.tankKg === 75 && K.tankKg === 90 && F.tankKg === 105 && E.fuel === 1 && E.tankKg === 0 && E.fuelKg === 0,
    `sedan ${V.tankKg} kg, rally ${R.tankKg}, prototype ${L.tankKg}, truck ${K.tankKg}, formula ${F.tankKg}, electric ${E.tankKg}`);
  const d10 = (fuel) => { const x = mk({ numAI: 0, playerGrid: 1, fuel }); let t = 0; while (x.state !== 'racing') { x.step(DT); } while (t < 10) { C.aiControl(x.player, x, DT); x.step(DT); t += DT; } return x.player.dist; };
  const light = d10(false), heavy = d10(true);
  check('a full tank weighs: 10 s from the start the car with it is behind the one without', heavy < light - 0.3, `${f2(heavy)} m vs ${f2(light)} m`);
}

// 3. the burn: flat out more, at idle a little
{
  const r = mk({ numAI: 0, playerGrid: 1, fuel: true }), P = r.player;
  while (r.state !== 'racing') r.step(DT);
  const burn = (thr) => { const f0 = P.fuel; for (let k = 0; k < 120; k++) { P.inThr = thr; P.inBrk = thr ? 0 : 1; P.inSteer = 0; r.step(DT); } return f0 - P.fuel; };
  const idle = burn(0), full = burn(1);
  check('the throttle burns it: flat out four times what the engine takes at idle', idle > 0 && Math.abs(full / idle - 4) < 0.05, `idle ${(idle * 1e4).toFixed(2)}, flat out ${(full * 1e4).toFixed(2)} (1/10000 of the tank a second)`);
}

// 4. a normal race: one tank is enough (nobody stops for fuel), some left at the line
{
  const r = mk({ tyres: true, fuel: true }), o = run(r, 400);
  const left = r.cars.map(c => c.fuel);
  check('a normal race: everybody to the line on one tank, nobody in for fuel', r.cars.every(c => c.finished) && r.cars.every(c => !o.stops.get(c)) && left.every(f => f > 0.08 && f < 0.5), `left ${left.map(f2).join(' ')}`);
}

// 5. a long race (twice the laps): the rivals in once each for fuel (on the lap it would not last another); the player without a stop runs
// dry: on at a crawl
{
  const r = mk({ tyres: true, fuel: true, laps: 6 }), o = run(r, 900), AI = r.cars.filter(c => !c.isPlayer), P = r.player, perLap = T.len / 38 * r.fuelRate;
  const st = AI.map(c => o.stops.get(c) || 0), durs = AI.map(c => o.dur.get(c)), fin = AI.map(c => o.fuelIn.get(c));
  check('a long race: every rival in once for fuel, on the lap the tank would not last another, the stop longer the emptier it was; none runs dry, all to the line', st.every(k => k === 1) && fin.every(f => f > 0.01 && f < perLap * 1.5) && AI.every((c, i) => durs[i] >= 1.6 + (1 - fin[i]) * 9 - 0.01) && AI.every(c => o.low.get(c) > 0) && AI.every(c => c.finished),
    `stops ${st.join(' ')}, fuel in ${fin.map(f2).join(' ')} (a lap takes ${f2(perLap)}), stop ${durs.map(f2).join(' ')} s, lowest ${AI.map(c => f2(o.low.get(c))).join(' ')}`);
  check('the player without a stop: the tank runs dry before the end; the last drops drive it on at a crawl (the engine only under 40 km/h)', o.dryAt != null && o.dryAt < o.t && o.crawl === 1 && o.dryM > 500,
    `dry at ${f2(o.dryAt)} s (the race ${f2(o.t)} s), then on ${f2(o.dryM)} m (at most ${f2(o.vDry * 3.6)} km/h rolling downhill or knocked on)`);
}

// 6. the player in the pits: filled up, on to the line
{
  const r = mk({ tyres: true, fuel: true, laps: 6 }), P = r.player, me = { done: false };
  const o = run(r, 900, () => { if (P.fuel < 0.4 && !me.done && !P.pitWant && !T.pitAt(P.q.s)) P.pitWant = true; if (P.pitEv === 'done') { me.done = true; P.pitWant = false; } });
  check('the player in for fuel: the car filled up at the stop, on to the line', o.stops.get(P) === 1 && P.finished && o.low.get(P) > 0 && P.fuel > 0.2 && o.dur.get(P) >= 1.6 + (1 - o.fuelIn.get(P)) * 9 - 0.01,
    `in with ${f2(o.fuelIn.get(P))}, the stop ${f2(o.dur.get(P))} s, left at the line ${f2(P.fuel)}`);
}

// 7. an endurance race (three times the laps): two stops each, nobody dry, all to the line
{
  const r = mk({ tyres: true, fuel: true, laps: 9 }), P = r.player;
  const o = run(r, 1400, () => { if (P.fuel < 0.4 && !P.pitWant && !T.pitAt(P.q.s)) P.pitWant = true; if (P.pitEv === 'done' || (P.pitWant && !P.inPit && P.fuel > 0.9)) P.pitWant = false; });   // (in when a little is left, asked before the pit lane's way in)
  const AI = r.cars.filter(c => !c.isPlayer), st = AI.map(c => o.stops.get(c) || 0);
  check('an endurance race: every rival in twice for fuel, none dry, all to the line (the player too, filled up twice)', st.every(k => k === 2) && AI.every(c => o.low.get(c) > 0 && c.finished) && o.stops.get(P) === 2 && P.finished,
    `stops ${st.join(' ')}, the player ${o.stops.get(P)}, lowest ${AI.map(c => f2(o.low.get(c))).join(' ')}, the race ${f2(o.t)} s`);
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
