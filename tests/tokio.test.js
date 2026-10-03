// Tokio, Japonska: the street circuit round the exhibition halls of Ariake on Tokyo Bay, in its 2025/2026 layout (2.575 km, 18 turns,
// anticlockwise). The track: a circuit of the big championship, its length against the official one, the 18 turns in their order each
// turning the right way, the start line on the waterfront straight with the pits on its bay side (on the right), the junctions' mouths
// open to the knockable street furniture. Whole races of 13 cars on the autopilot, dry and in the rain: everyone finishes. The street
// furniture of the junctions (traffic lights, signs, bollards, railings, bins, hydrants, cabinets, vending machines, lamps, bus stops):
// a car drives through it, knocks it all over and drives on.
//   node tests/tokio.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'tokio'), T = new C.Track(def), L = T.len;
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const dAt = (x, z) => { const s = T.nearestIdx(x, z) * T.ds - T.startS; return ((s % L) + L) % L; };

// 1. the track
check('track: Tokio, Japonska (Tokyo, Japan), a circuit of 5 laps in the big championship, its own theme',
  def.name === 'Tokio, Japonska' && def.en && def.en.name === 'Tokyo, Japan' && !T.open && !def.timeTrial && def.laps === 5 && def.theme === 'tokio' && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('tokio'),
  `${def.name} / ${def.en && def.en.name}, ${def.laps} laps`);
check('track: the lap within 1.5 % of the official 2.575 km (2025 layout)', def.realKm === 2.575 && Math.abs(L / 1000 - def.realKm) / def.realKm < 0.015,
  `${(L / 1000).toFixed(3)} km, ${((L / 1000 / def.realKm - 1) * 100).toFixed(1)} %`);
check('track: only geographic names (no venue, series or sponsor)', !/sight|formula|e-prix|eprix|ビッグサイト/i.test(JSON.stringify([def.name, def.desc, def.en, def.names])),
  T.names.map(q => q.n).join(', '));

// 2. the 18 turns in lap order, each turning the way it does: left, right, right, a 180-degree left loop, a left kink, a right hairpin, two
// lefts onto the public road, the gentle right, the left-right chicane, the left onto the road between the halls, its right-left S, the left
// at the gate, the fast left down the ramp, the right and the left onto the straight (the turn total within 15 m either side of each apex,
// 30-40 m round the long gentle bends of Turns 9, 13 and 14)
{
  const DIR = [-1, 1, 1, -1, -1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1, -1, 1, -1];
  const ds = def.turns.map(([x, z]) => dAt(x, z)), W = [15, 15, 15, 15, 15, 15, 15, 15, 30, 15, 15, 15, 40, 40, 15, 15, 15, 15], ang = ds.map((d, k) => { let s = 0; const a = T.idx(T.startS + d - W[k]), b = T.idx(T.startS + d + W[k]); for (let i = a; i !== b; i = (i + 1) % T.N) s += wrap(T.hd[(i + 1) % T.N] - T.hd[i]); return s; });
  const order = ds.every((d, k) => !k || d > ds[k - 1]), dirs = ang.every((a, k) => Math.sign(a) === DIR[k] && Math.abs(a) > 0.1);
  check('turns: 18, in lap order, each the right way (left -1, right +1)', def.turns.length === 18 && order && dirs, ds.map((d, k) => `T${k + 1} ${Math.round(d)} m ${Math.round(ang[k] * 57.3)}°`).join(', '));
  const t4 = (() => { let s = 0; for (let d = ds[3] - 45; d < ds[4] - 20; d += T.ds) s += wrap(T.hd[T.idx(T.startS + d + T.ds)] - T.hd[T.idx(T.startS + d)]); return s; })();
  check('turns: Turn 4 a loop of ~180 degrees to the left, Turn 6 a right hairpin over 100 degrees', t4 < -2.7 && ang[5] > 1.5, `T4 ${Math.round(t4 * 57.3)}°, T6 ${Math.round(ang[5] * 57.3)}°`);
  let mk = 0; for (let i = 0; i < T.N; i++) mk = Math.max(mk, Math.abs(T.k[i]));
  check('turns: none tighter than the street circuit\'s ~9 m radius', 1 / mk > 9, `tightest ${(1 / mk).toFixed(1)} m`);
}

// 3. the start line on the waterfront straight (heading north), the pit lane on its bay side (on the right: east) along the start line, entered
// after the last corner and left before Turn 1
{
  const i = T.startIdx, north = T.tz[i] < -0.95, east = T.nx[i] > 0.95, P = def.pit;
  check('start and pits: the straight runs north, the pit lane on its right (the bay side), round the start line, between Turn 18 and Turn 1',
    north && east && P && P[0] > 0 && !!T.pitAt(T.startS) && !!T.pitAt(T.startS + P[1] + 5) && !!T.pitAt(T.startS + P[2] - 5) && L + P[1] > dAt(...def.turns[17]) && P[2] < dAt(...def.turns[0]),
    `heading (${T.tx[i].toFixed(2)}, ${T.tz[i].toFixed(2)}), pit [${P}]`);
  const flat = Math.max(...Array.from(T.hy)) - Math.min(...Array.from(T.hy));
  check('heights: the reclaimed island\'s few metres (the car parks low, the public roads ~2.5 m higher, the ramp at Turn 16)', flat > 1.5 && flat < 5,
    `${flat.toFixed(1)} m between the lowest and the highest point`);
}

// 4. the junctions: where a side street's mouth opens (depth > 0) the wall on that side stands back (the furniture there can be reached)
{
  const J = def.junctions || [], open = J.filter(j => j[2] > 0), ok = open.every(([d, side, dep]) => { const i = T.idx(T.startS + d); return (side > 0 ? T.br[i] : T.bl[i]) >= T.w + dep - 0.5; });
  check('junctions: at least 6 mouths open, the wall stepped back into each', open.length >= 6 && ok, open.map(([d, side, dep]) => { const i = T.idx(T.startS + d); return `${d} m ${side > 0 ? 'R' : 'L'} ${((side > 0 ? T.br[i] : T.bl[i]) - T.w).toFixed(1)} m`; }).join(', '));
}

// 5. whole races on the autopilot (13 cars, 5 laps), dry and in the rain: everyone finishes, the rain slower
const race = (rain) => {
  const r = new C.Race(new C.Track(def), { numAI: 12, playerGrid: 12, laps: def.laps, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 7, difficulty: 1, rain: rain ? 1 : 0 });
  r.start(); let k = 0;
  for (; k < 120 * 900; k++) { Math.random = seeded(1000 + k); C.aiControl(r.player, r, DT); r.step(DT); if (r.cars.every(c => c.finished)) break; }
  return { t: k * DT, fin: r.cars.filter(c => c.finished).length, n: r.cars.length };
};
const dry = race(false), wet = race(true);
check('race: 13 cars on the autopilot, 5 laps, dry: everyone finishes', dry.fin === dry.n && dry.n === 13, `${dry.fin}/${dry.n} in ${dry.t.toFixed(1)} s`);
check('race: the same in the rain, everyone finishes, slower than dry', wet.fin === wet.n && wet.t > dry.t, `${wet.fin}/${wet.n} in ${wet.t.toFixed(1)} s`);

// 6. the knockable street furniture of the junctions: a row of each kind across the racing line on the long straight after Turn 9; the car on
// the autopilot drives through, knocks every piece over and drives on (it loses a little speed, no more)
{
  const KINDS = ['signal', 'sign', 'busstop', 'bollard', 'bin', 'hydrant', 'cabinet', 'vending', 'lamp', 'railing', 'cone'];
  const r = new C.Race(new C.Track(def), { numAI: 0, playerGrid: 1, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 3, difficulty: 1 });
  const TT = r.track, d0 = 1150, list = KINDS.map((kind, k) => { const s = TT.startS + d0 + k * 14, i = TT.idx(s), o = TT.rl[i]; return { kind, x: TT.px[i] + TT.nx[i] * o, z: TT.pz[i] + TT.nz[i] * o, yaw: TT.hd[i], col: 0, i }; });
  r.setProps(list, null); r.start();
  const P = r.player, pos0 = r.props.filter(b => !b.dead).map(b => [b.kind, b.x, b.z]);
  let k = 0, vIn = 0, vOut = 0, minV = 1e9; const dp = () => (((P.q.s - TT.startS) % TT.len) + TT.len) % TT.len;
  let seen = false;
  for (; k < 120 * 200; k++) { Math.random = seeded(500 + k); C.aiControl(P, r, DT); r.step(DT); const d = dp(), v = Math.hypot(P.vx, P.vz); if (d > d0 - 60 && d < d0 - 40) { vIn = v; seen = true; } if (seen && d > d0 && d < d0 + 160) minV = Math.min(minV, v); if (seen && d > d0 + 200 && d < d0 + 260) { vOut = v; break; } }
  const moved = pos0.filter(([kind, x, z]) => { const b = r.props.find(q => q.kind === kind && !q.dead); return b && Math.hypot(b.x - x, b.z - z) > 0.8; }).map(p => p[0]);
  check('street furniture: the car knocks over every kind (traffic light, sign, bus stop, bollard, bin, hydrant, cabinet, vending machine, lamp, railing, cone)', moved.length === KINDS.length, `moved: ${moved.join(', ')}`);
  check('street furniture: the car drives on through it, a little slower, never stopped, never stuck', vOut > 20 && minV > 8 && !(P.stuckT > 1), `${(vIn * 3.6).toFixed(0)} km/h in, slowest ${(minV * 3.6).toFixed(0)} km/h, ${(vOut * 3.6).toFixed(0)} km/h out`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
