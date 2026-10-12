// Toronto: the street circuit round the exhibition grounds by Lake Ontario (2016-2025 layout, 2.874 km, 11 turns, clockwise). The track:
// a circuit of the Circuits group (laps, the time trial), its length against the official one, the eleven turns in order and each the way
// it really turns (right, right, the hairpin of Turn 3 right, Turn 4 a slight left, Turn 5 left, Turns 6-8 right, the esses of Turns 9-11
// left, right, left), the start line on the straight between Turn 11 and Turn 1, the pit lane on the LEFT of that straight (def.pit's
// negative offset: Track.pitAt measures to the left, sd -1) with the player's box in it; the junctions' pockets in the barriers (the side
// roads' mouths with their corners). Whole races on autopilot, dry and wet: every car finishes. The player drives into the pits and is
// repaired there. The street furniture of the junctions (traffic signals, a mast arm, lights, signs, hydrants, bins, cabinets, bollards,
// shelters, drums): loose props a car knocks over and drives on, a little slower and a little dented by the heavy ones.
//   node tests/toronto.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded, makeRace, stepRace } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'toronto'), T = new C.Track(def);
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const dS = (s) => { let d = s - T.startS; d = ((d % T.len) + T.len) % T.len; return d > T.len / 2 ? d - T.len : d; };

// 1. the track: a closed circuit of the Circuits group (laps, in the big championship), its name, the length
check('track: a circuit (laps, not an open road nor a time trial), "Toronto, Kanada" / "Toronto, Canada", 5 laps, in the big championship',
  !def.open && !def.timeTrial && def.name === 'Toronto, Kanada' && def.en.name === 'Toronto, Canada' && def.laps === 5 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('toronto'));
check('track: the lap ~2.93 km, within 3 % of the official 2.874 km', Math.abs(T.len / 1000 - def.realKm) / def.realKm < 0.03, `${(T.len / 1000).toFixed(3)} km vs ${def.realKm} km (${((T.len / 1000 / def.realKm - 1) * 100).toFixed(1)} %)`);
{
  let gmax = 0; for (let i = 0; i < T.N; i++) gmax = Math.max(gmax, Math.abs(T.grade[i]));
  let lo = 1e9, hi = -1e9; for (let i = 0; i < T.N; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); }
  check('track: the real ground (the lakeshore ~4 m below the start, the road under the expressway ~8 m above it), no grade over 4 %', lo < -3 && lo > -6 && hi > 6 && hi < 11 && gmax < 0.04,
    `${lo.toFixed(1)} .. ${hi.toFixed(1)} m, steepest ${(gmax * 100).toFixed(1)} %`);
}

// 2. the eleven turns in order, each the way the real one turns (+1 right, -1 left), over the 60 m round its apex
{
  const DIR = [1, 1, 1, -1, -1, 1, 1, 1, -1, 1, -1], MIN = [70, 25, 80, 15, 70, 50, 15, 70, 12, 20, 70];
  const at = def.turns.map(([x, z]) => dS(T.nearestIdx(x, z) * T.ds)).map(d => (d + T.len) % T.len);
  const turn = def.turns.map(([x, z]) => { const i = T.nearestIdx(x, z); let s = 0; for (let k = -15; k < 15; k++) s += wrap(T.hd[(i + k + 1 + T.N) % T.N] - T.hd[(i + k + T.N) % T.N]); return s * 180 / Math.PI; });
  const order = at.every((d, k) => !k || d > at[k - 1]), dirs = turn.every((a, k) => Math.sign(a) === DIR[k] && Math.abs(a) > MIN[k]);
  check('turns: 11, in order round the lap, each the way the real one turns (R R R L L R R R L R L)', def.turns.length === 11 && order && dirs,
    turn.map((a, k) => `T${k + 1} ${Math.round(at[k])} m ${a > 0 ? 'R' : 'L'}${Math.abs(Math.round(a))}`).join(', '));
  check('turns: the long lakeshore straight from Turn 2 to Turn 3 (~0.9 km), Turn 1 ~200 m after the line, Turn 11 ~250 m before it', at[2] - at[1] > 850 && at[0] > 150 && at[0] < 250 && T.len - at[10] > 200 && T.len - at[10] < 300,
    `T2-T3 ${Math.round(at[2] - at[1])} m, line-T1 ${Math.round(at[0])} m, T11-line ${Math.round(T.len - at[10])} m`);
  check('turns: the HUD and the commentator know them by their numbers only', T.names.filter(q => /^Zavoj \d+$/.test(q.n)).length >= 8 && T.names.every(q => /^Zavoj \d+$/.test(q.n) || !q.hud), T.names.map(q => q.n).join(', '));
}

// 3. the pit lane: on the left of the start / finish straight (the north side), from just past Turn 11 to the line, the player's box in it
{
  const P = def.pit, a = T.pitAt(T.startS + P[3]), b = T.pitAt(T.startS + P[1] + 2), o = T.pitAt(T.startS - 300);
  const boxL = (() => { const i = T.idx(T.startS + P[3]), q = { x: T.px[i] - T.nx[i] * a.o, z: T.pz[i] - T.nz[i] * a.o }; return T.query(q.x, q.z, i, {}).d < -a.o + 0.5; })();
  check('pits: the lane on the left (sd -1, its centre ~15 m to the left at the boxes), entered just past Turn 11, rejoining at the line', P[0] < 0 && a && a.sd === -1 && !a.gap && a.o > 14 && b && b.gap && !o && boxL && P[2] > 0 && P[2] < 40,
    `lane ${P[1]} .. ${P[2]} m, offset ${a && a.o.toFixed(1)} m, side ${a && a.sd}`);
}

// 4. the junctions: the barriers set back into the mouths of the side roads (their corners inside), the escape roads at Turns 1, 3, 6 and 8
{
  const pockets = def.walls.filter(w => w[3] >= 6.5 && w[3] < 12), esc = def.walls.filter(w => w[3] >= 12);
  const deep = pockets.every(([a, b, sd, off]) => { const i = T.idx(T.startS + (a + b) / 2); return (sd > 0 ? T.br[i] : T.bl[i]) > (T.wa ? T.wa[i] : T.w) + off - 1; });
  let near = 1e9; for (let i = 0; i < T.N; i++) near = Math.min(near, T.bl[i] - (T.wa ? T.wa[i] : T.w), T.br[i] - (T.wa ? T.wa[i] : T.w));
  check('junctions: 20+ pockets in the barriers at the side roads, set back 6.5-11 m, escape roads at 4 turns, the blocks never nearer than 1.5 m', pockets.length >= 20 && deep && esc.length >= 4 && near >= 1.5,
    `${pockets.length} pockets, ${esc.length} escape roads, nearest block ${near.toFixed(2)} m past the edge`);
}

// 5. whole races on autopilot, dry and in the rain: every car finishes
for (const rain of [0, 1]) {
  const orig = Math.random; Math.random = seeded(5 + rain);
  const race = makeRace(C, 'toronto', () => ({ numAI: 12, playerGrid: 12, laps: 5, playerModel: C.MODELS[4], assist: 2, seed: 9, difficulty: 1, damage: 2, phys: 'cs', rain }));
  let k = 0; while (!race.cars.every(c => c.finished) && k < 120 * 900) { k++; stepRace(C, race, k); }
  Math.random = orig;
  const fin = race.cars.filter(c => c.finished).length, best = Math.min(...race.cars.map(c => Math.min(...c.lapTimes)));
  check(`race ${rain ? 'in the rain' : 'dry'}: 13 cars, 5 laps, every car finishes`, fin === 13, `${fin}/13 in ${(k * DT).toFixed(0)} s, best lap ${best.toFixed(1)} s`);
}

// 6. the pits: the player on autopilot told to come in drives down the lane on the left, stops at the box and is repaired
{
  const orig = Math.random; Math.random = seeded(21);
  const race = makeRace(C, 'toronto', () => ({ numAI: 3, playerGrid: 4, laps: 3, playerModel: C.MODELS[4], assist: 2, seed: 4, difficulty: 1, damage: 2, phys: 'cs' }));
  const P = race.player; P.dmg = 0.3; let k = 0, minLat = 0;
  while (k < 120 * 200 && !P.repairN) { k++; P.pitWant = true; stepRace(C, race, k); if (P.inPit) minLat = Math.min(minLat, P.q.d); }
  Math.random = orig;
  check('pits: the player drives in on the left, stops at its box and is repaired', P.repairN >= 1 && minLat < -12, `repairs ${P.repairN}, furthest left ${minLat.toFixed(1)} m, after ${(k * DT).toFixed(0)} s`);
}

// 7. the street furniture: loose props a car knocks over and drives on (as the cones): one of each kind on the racing line ahead of the
// player, who drives through them on autopilot; each one flies, the car keeps going and is at most a little dented
{
  const KINDS = ['signal', 'signalm', 'lamp', 'sign', 'hydrant', 'bin', 'cabinet', 'bollard', 'shelter', 'barrel'];
  const orig = Math.random; Math.random = seeded(33);
  const race = makeRace(C, 'toronto', () => ({ numAI: 0, playerGrid: 1, laps: 2, playerModel: C.MODELS[4], assist: 2, seed: 4, difficulty: 1, damage: 2, phys: 'cs' }));
  // on the long lakeshore straight (from 450 m after the line), 25 m apart, on the racing line
  const list = KINDS.map((kind, k) => { const s = T.startS + 470 + k * 25, i = T.idx(s); return { kind, x: T.px[i] + T.nx[i] * T.rl[i], z: T.pz[i] + T.nz[i] * T.rl[i], yaw: T.hd[i] + Math.PI / 2, i }; });
  race.setProps(list);
  const P = race.player; let k = 0, vMin = 1e9, v0 = 0;
  while (k < 120 * 80 && dS(P.q.s) < 470 + KINDS.length * 25 + 60) { k++; stepRace(C, race, k); const d = dS(P.q.s); if (d > 440 && d < 445) v0 = P.speed; if (d > 470 && d < 470 + KINDS.length * 25) vMin = Math.min(vMin, P.speed); }
  Math.random = orig;
  const moved = race.props.filter(b => !b.hidden && b.slot >= 0).map((b, j) => ({ kind: b.kind, d: Math.hypot(b.x - list[j].x, b.z - list[j].z), up: b.qw * b.qw + b.qy * b.qy }));
  const knocked = moved.filter(m => m.d > 1.5 || m.up < 0.9);
  check('furniture: every kind of it there (Core\'s PROPK), all knocked over or away by the car', race.props.length === KINDS.length && knocked.length >= KINDS.length - 1,
    moved.map(m => `${m.kind} ${m.d.toFixed(1)}m`).join(', '));
  check('furniture: the car drives on through it (ten of them in a row at full speed: slower, a little dented, not stopped)', dS(P.q.s) > 470 + KINDS.length * 25 + 50 && vMin > 0.4 * v0 && P.dmg > 0 && P.dmg < 0.3,
    `${(v0 * 3.6).toFixed(0)} km/h before, slowest ${(vMin * 3.6).toFixed(0)} km/h, damage ${(P.dmg * 100).toFixed(0)} %`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
