// The race's marks on the road and what the marshals do about them (Core only, no browser): the marbles off the racing line in the
// corners (less grip there as the rubber builds up), the standing water of heavy rain (surface 7: aquaplaning at speed; the AI goes round
// it or through it slowly), the oil a badly hit car leaks (very slippery; covered with cement 35 s on; the oil flag), the sausage kerbs
// at the chicanes (they throw a car cutting across them into the air), blue flags (a car about to be lapped lets the faster one by) and
// a car retiring after a heavy crash (the recovery crane takes it away; did not finish, behind everyone in the results).
//   node tests/road.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const race = (T, extra) => new C.Race(T, Object.assign({ numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, flags: true }, extra));
const step = (r, k) => { Math.random = seeded(5000 + k); C.aiControl(r.player, r, DT); if (r.player.stuckT > 3) r.rescue(r.player); r.step(DT); };
const q = (T, i, d) => T.query(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, i, {});

// 1. where they are: marbles on the asphalt circuits, standing water on every asphalt road, sausage kerbs at six tracks' chicanes
{
  const ids = C.TRACKS.map(d => d.id), mb = [], pools = [], saus = [];
  for (const id of ids) { const T = track(id); if (T.mbI && T.mbI.some(v => Math.abs(v) > 0.5)) mb.push(id); if (T.pools && T.pools.length >= 3) pools.push(id); if (T.saus) saus.push(id + ':' + T.saus.length); }
  check('marbles on every asphalt circuit (not the gravel, the mixed rallycross track or the hill climb)', mb.length === 11 && !mb.includes('gora') && !mb.includes('holjes') && !mb.includes('pikes') && !mb.includes('ouninpohja'), mb.join(' '));
  check('standing water on every asphalt road (3 pools or more), none on the gravel', pools.length === 12 && !pools.includes('gora') && !pools.includes('ouninpohja') && !pools.includes('holjes'), pools.join(' '));
  check('sausage kerbs on both bends of each chicane (Monaco, Spa, Suzuka, the Nordschleife\'s two, Toskana, Grom)', saus.join(' ') === 'monaco:2 toskana:2 grom:2 nring:4 spa:2 suzuka:2', saus.join(' '));
  const T = track('spa'), Z = T.saus[0], i = Z.ap;
  check('a sausage kerb lies on the inside of its bend, right behind the kerb', Math.sign(T.k[i]) === Z.side && Z.d0 >= T.w + T.curbW && Z.d1 < (Z.side > 0 ? T.br : T.bl)[i], `side ${Z.side}, ${Z.d0.toFixed(2)}-${Z.d1.toFixed(2)} m out`);
}

// 2. the marbles: none at the start, they build up from half a lap on; off the line on the outside of a bend the grip is less, on the line not
{
  const T = track('rbring'), r = race(T, { numAI: 3, playerGrid: 4 }); r.start();
  const mb0 = r.road.mb; let k = 0; while (r.road.mb < 0.5 && k < 120 * 400) step(r, ++k);
  let i = 0, best = 0; for (let j = 0; j < T.N; j++) if (Math.abs(T.mbI[j]) > best) { best = Math.abs(T.mbI[j]); i = j; }
  const sd = Math.sign(T.mbI[i]), qa = q(T, i, T.rl[i] + sd * 3.2), qb = q(T, i, T.rl[i]);
  const ga = C.roadGrip(T, qa, T.surface(qa)), gb = C.roadGrip(T, qb, T.surface(qb));
  check('the rubber builds up during the race (none at the start)', mb0 === 0 && r.road.mb >= 0.5, `mb ${mb0} → ${r.road.mb.toFixed(2)} after ${(k * DT).toFixed(0)} s`);
  check('in the marbles less grip, on the racing line the full grip', ga < 0.93 && ga > 0.75 && gb === 1, `grip ${ga.toFixed(3)} off the line, ${gb} on it`);
  r.setRain(1); step(r, ++k);
  check('the rain washes over the marbles (no marble effect on a wet road)', r.road.mb === 0, `mb ${r.road.mb}`);
}

// 3. standing water in heavy rain: surface 7 at a pool, it grows with the water; aquaplaning at speed; the AI races through without spinning
{
  const T = track('spa'), r = race(T, { rain: 1, laps: 1 }); r.start(); step(r, 1);
  const p = T.pools.find(u => !u[4]), i = T.idx(p[0]), qc = q(T, i, p[1]);
  check('heavy rain: the pools are full (poolK 1) and their middle is standing water (surface 7)', T.poolK === 1 && T.surface(qc) === 7, `poolK ${T.poolK}, surface ${T.surface(qc)}`);
  const a50 = C.aqua(14, 1), a110 = C.aqua(30.5, 1);
  check('aquaplaning: little effect at 50 km/h, most of the grip gone at 110 km/h', a50 > 0.99 && a110 < 0.45, `grip x${a50.toFixed(2)} at 50 km/h, x${a110.toFixed(2)} at 110 km/h`);
  const r2 = race(T, { rain: 0.3, laps: 1 }); r2.start(); step(r2, 1);
  check('in light rain no standing water', T.poolK === 0 && T.surface(qc) === 0, `poolK ${T.poolK}`);
  // a whole wet race: every car finishes, the AI mostly round the pools (few wheels in them)
  const r3 = race(T, { rain: 1, laps: 1, flags: false }); r3.start(); let k = 0, inW = 0, all = 0, spins = 0; const sp = new Map();
  while (k < 120 * 400 && r3.cars.some(c => !c.finished)) { step(r3, ++k); for (const c of r3.cars) { if (c.finished) continue; all += 4; for (let w = 0; w < 4; w++) if (c.ws[w] === 7) inW++; const b = Math.abs(c.beta || 0); if (b > 1.05 && !sp.get(c)) { sp.set(c, true); spins++; } if (b < 0.5) sp.set(c, false); } }
  check('a wet race on Spa with its standing water: every car finishes, the wheels rarely in the water, few spins', r3.cars.every(c => c.finished) && inW / all < 0.01 && spins <= 6, `${r3.cars.filter(c => c.finished).length}/13, ${(inW / all * 100).toFixed(2)} % of wheel steps in water, ${spins} spins`);
}

// 4. oil: a badly hit car leaks (a pool, drops along its way), the oil flag, very slippery; covered with cement 35 s on
{
  const T = track('rbring'); let r = null, k = 0, c = null;
  for (let tr = 0; tr < 8 && !(r && r.road.oil.length); tr++) {   // (a car leaks every other time it is badly hit)
    r = race(T, { numAI: 5, playerGrid: 6 }); r.start(); k = 0; while (k < 120 * 30) step(r, ++k);
    c = r.cars.find(o => !o.isPlayer && o.lap >= 1); Math.random = seeded(77 + tr); c.dmg = 0.5; r.road.dm.set(c, 0.1); r._oil(DT);
  }
  const L = r.road.oil, o = L[0], qo = T.query(o.x, o.z, T.idx(o.s), {});
  check('a badly hit car leaks oil: a pool where it happened, the oil flag', L.length >= 1 && r.fl.oil.length === 1 && o.r > 1.5, `${L.length} spot(s), r ${o.r.toFixed(2)} m, flags ${r.fl.oil.length}`);
  check('the oil is very slippery (half the grip)', C.roadGrip(T, qo, T.surface(qo)) === 0.5, `grip ${C.roadGrip(T, qo, T.surface(qo))}`);
  for (let j = 0; j < 120 * 6; j++) step(r, ++k);
  const nD = r.road.oil.length;
  for (let j = 0; j < 120 * 32; j++) step(r, ++k);
  check('drops along its way while it leaks', nD > L.length - (r.road.oil.length - nD) || nD >= 2, `${nD} spots 6 s on`);
  check('35 s on the marshals have covered it with cement (a little less grip than the road), the oil flag is gone', r.road.oil.every(x => x.t < 35 || x.cem) && o.cem && C.roadGrip(T, qo, T.surface(qo)) === 0.9 && r.fl.oil.length === 0, `cement ${o.cem}, grip ${C.roadGrip(T, qo, T.surface(qo))}, flags ${r.fl.oil.length}`);
  const r2 = race(T, { numAI: 3, playerGrid: 4 }); r2.start(); step(r2, 1);
  check('a new race starts with a clean road', r2.road.oil.length === 0 && r2.road.mb === 0, '');
}

// 5. a sausage kerb: a car cutting across it at speed is thrown into the air (a flat track too) and lands again
{
  const T = track('grom'), r = race(T, { numAI: 1, playerGrid: 2 }); r.start();
  const c = r.cars.find(o => !o.isPlayer), Z = T.saus[0], i = Z.ap, d = Z.side * (Z.d0 + Z.d1) / 2;
  for (let j = 0; j < 120; j++) step(r, j + 1);
  c.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i]); c.vx = Math.cos(T.hd[i]) * 20; c.vz = Math.sin(T.hd[i]) * 20; c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s;
  let up = false, maxY = 0, land = false;
  for (let j = 0; j < 120; j++) { step(r, 200 + j); if (c.air) up = true; maxY = Math.max(maxY, c.y || 0); if (up && !c.air) land = true; }
  check('a sausage kerb throws a car into the air (a flat track) and it lands again', !T.hasElev && up && maxY > 0.08 && land, `up ${up}, ${maxY.toFixed(2)} m high, landed ${land}`);
}

// 6. blue flags: in a long race the leaders lap the back markers; each gets the blue flag and lets the faster car by
{
  Math.random = seeded(3);
  const T = track('grom'), r = race(T, { laps: 14, difficulty: 0, seed: 11 }); r.start();
  let k = 0, blue = 0; const L = new Map(); let pb = r.fl.pev, pk = [];
  while (k < 120 * 1000 && r.cars.some(c => !c.finished && !c.out)) {
    step(r, ++k); if (r.fl.blue.length) blue++;
    if (r.fl.pev !== pb) { pb = r.fl.pev; pk.push(r.fl.pevK); }
    for (const c of r.cars) if (c.fl && c.fl.blue) { const key = c.name + '<' + c.fl.blue.name; if (!L.has(key)) L.set(key, { c, o: c.fl.blue, t0: k * DT, t1: 0 }); }
    for (const e of L.values()) if (!e.t1 && e.o.dist - e.c.dist > T.len + 2) e.t1 = k * DT;
  }
  const E = [...L.values()], passed = E.filter(e => e.t1), slow = E.filter(e => e.t1 && e.t1 - e.t0 > 35);
  check('blue flags: the back markers about to be lapped get them, the marshals wave them (Race.fl.blue)', E.length >= 6 && blue > 0, `${E.length} cars shown the blue flag`);
  check('... and each lets the faster car by', passed.length === E.length && slow.length === 0, `${passed.length}/${E.length} passed, the longest after ${Math.max(...passed.map(e => e.t1 - e.t0)).toFixed(1)} s`);
  check('every car finishes', r.cars.every(c => c.finished || c.out), `${r.cars.filter(c => c.finished).length}/13`);
}

// 7. a car retiring after a heavy crash (flags): stuck and badly damaged, it stays under a yellow flag, the recovery takes it away (gone 21 s
// on), it did not finish: behind every other car in the order and the results. Without flags (or lightly damaged) it is rescued as before
{
  const T = track('jezero'), r = race(T, { numAI: 5, playerGrid: 6, laps: 4 }); r.start();
  let k = 0; while (k < 120 * 50) step(r, ++k);
  const c = r.order.find(o => !o.isPlayer && o.lap >= 1), ev = [];
  c.dmg = 0.8; c.stuckT = 4; let e0 = r.fl.ev; step(r, ++k); if (r.fl.ev !== e0) { ev.push(r.fl.evK); e0 = r.fl.ev; }
  const at = { x: c.x, z: c.z };
  check('stuck after a heavy crash: retired (not rescued), stays where it stopped', !!c.out && r.fl.outCar === c && c.locked && ev.includes('out'), `out ${!!c.out}, events ${ev.join(',')}`);
  let yel = false; for (let j = 0; j < 120 * 5; j++) { step(r, ++k); if (r.fl.yel.some(y => y.car === c)) yel = true; }
  check('a yellow flag over it while it is recovered', yel && Math.hypot(c.x - at.x, c.z - at.z) < 0.5, '');
  for (let j = 0; j < 120 * 22; j++) step(r, ++k);
  check('21 s on it is gone (lifted away by the crane), 5 s later no yellow flag any more', c.out.gone && !r.fl.yel.some(y => y.car === c), `t ${c.out.t.toFixed(1)} s`);
  while (k < 120 * 600 && r.cars.some(o => !o.finished && !o.out)) step(r, ++k);
  const res = r.estimateResults(), last = res[res.length - 1];
  check('it did not finish: last in the order and in the results', r.order[r.order.length - 1] === c && last.car === c && last.dnf && res.filter(e => e.dnf).length === 1, `results: ${res.map(e => (e.dnf ? 'DNF ' : '') + e.car.name).join(', ')}`);
  const r2 = race(T, { numAI: 5, playerGrid: 6, laps: 4, flags: false }); r2.start(); k = 0; while (k < 120 * 50) step(r2, ++k);
  const c2 = r2.order.find(o => !o.isPlayer && o.lap >= 1); c2.dmg = 0.8; c2.stuckT = 4; step(r2, ++k);
  const r3 = race(T, { numAI: 5, playerGrid: 6, laps: 4 }); r3.start(); k = 0; while (k < 120 * 50) step(r3, ++k);
  const c3 = r3.order.find(o => !o.isPlayer && o.lap >= 1); c3.dmg = 0.3; c3.stuckT = 4; step(r3, ++k);
  check('without flags, or lightly damaged: rescued and racing on as before', !c2.out && !c3.out && c2.rescued > 0 && c3.rescued > 0, `no flags: out ${!!c2.out}; light damage: out ${!!c3.out}`);
}

console.log(`\n${n - bad}/${n} passed`);
process.exit(bad ? 1 : 0);
