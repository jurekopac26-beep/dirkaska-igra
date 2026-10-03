// Singapur: the street circuit round Marina Bay in its 2023 layout (4.94 km by the organisers' figures, 19 corners, anticlockwise), a
// circuit of the big championship. The track: its length against the official one, the 19 turns in order and each the way it really goes
// (the hairpins of turns 3 and 13, the kinks of 4, 6 and 15), the start line on the pit straight with the pit wall and the pit building
// on its left, the barriers close to the road (a street circuit) and standing back across every side street (the junctions' pockets).
// Whole AI races to the flag (3 laps) in the dry and in the rain: every car finishes. The junctions' street furniture (Core's generic
// kinds: traffic signals, signals on mast arms, signs, bollards, bins, hydrants, cabinets, lamp posts) is knockable: a row of each across
// the racing line in a junction, the player on autopilot drives through them, they fly and topple, the car drives on, a little slower after each.
//   node tests/singapur.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'singapur'), T = new C.Track(def), N = T.N, ds = T.ds;
const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const sAt = (d) => ((T.startS + d) % T.len + T.len) % T.len;
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);

// 1. the track: a closed circuit of 3 laps in the big championship, its name, its length against the official 4.940 km
check('track: a circuit (not an open road), 3 laps, in the big championship; named after the place (Singapur, Singapur / Singapore, Singapore)',
  !def.open && !def.timeTrial && def.laps === 3 && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('singapur') && def.name === 'Singapur, Singapur' && def.en.name === 'Singapore, Singapore');
check('length: within 1 % of the official 4.940 km (the real scale)', Math.abs(T.len - 4940) / 4940 < 0.01 && def.realKm === 4.94, `${T.len.toFixed(0)} m (${((T.len / 4940 - 1) * 100).toFixed(2)} %)`);
{ let tot = 0; for (let i = 0; i < N; i++) tot += wrap(T.hd[(i + 1) % N] - T.hd[i]);
  check('direction: anticlockwise (the lap turns once round to the left)', Math.abs(tot + 2 * Math.PI) < 0.05, (tot / Math.PI * 180).toFixed(0) + ' degrees'); }

// 2. the 19 turns: in order round the lap, each a bend the way it really goes (L / R), the hairpins (3, 13) more than 125 degrees
{
  const DIR = [-1, 1, -1, -1, 1, 1, -1, 1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, -1];   // T1 L, T2 R, T3 L ... T16 R, T17-T19 L
  const tn = T.names.filter(q => /^Zavoj \d+$/.test(q.n)), turn = tn.map(q => { const a = T.idx(sAt(q.d - 30)); let s = 0; for (let k = 0; k < 30; k++) s += wrap(T.hd[(a + k + 1) % N] - T.hd[(a + k) % N]); return s; });
  const order = tn.every((q, k) => q.n === 'Zavoj ' + (k + 1) && (!k || q.d > tn[k - 1].d)), dirs = turn.every((a, k) => Math.sign(a) === DIR[k] && Math.abs(a) > 0.17);
  check('turns: Zavoj 1 .. 19 in order round the lap, each the way it really goes (left / right)', tn.length === 19 && order && dirs, turn.map((a, k) => (k + 1) + (a > 0 ? 'R' : 'L') + Math.round(Math.abs(a) * 57.3)).join(' '));
  const wide = (k) => { const a = T.idx(sAt(tn[k].d - 60)); let s = 0; for (let m = 0; m < 60; m++) { const e = wrap(T.hd[(a + m + 1) % N] - T.hd[(a + m) % N]); if (Math.sign(e) === DIR[k]) s += e; } return Math.abs(s); };   // (its own way over 120 m round it)
  check('turns: the hairpins of turns 3 and 13 more than 125 degrees, the kinks of 4, 6 and 15 under 40', wide(2) > 2.18 && wide(12) > 2.18 && [3, 5, 14].every(k => Math.abs(turn[k]) < 0.7),
    `T3 ${Math.round(wide(2) * 57.3)}, T13 ${Math.round(wide(12) * 57.3)} degrees`);
  check('names: the turns by their numbers only (no names of people, events, sponsors): HUD Zavoj N, the rest only for the commentator', T.names.every(q => /^Zavoj \d+$/.test(q.n) || q.hud === false));
}

// 3. the start line on the pit straight (straight 150 m either way), the pit wall close on its left, the pit building on the left
{
  let kmax = 0; for (let d = -150; d <= 150; d += 2) kmax = Math.max(kmax, Math.abs(T.k[T.idx(sAt(d))]));
  const i0 = T.idx(sAt(0)), pit = def.scen.pit, wall = T.bl[i0] - T.w;
  check('start: on the straight (nothing tighter than a 250 m radius within 150 m of the line)', kmax < 1 / 250, 'tightest radius ' + (1 / kmax).toFixed(0) + ' m');
  check('pits: the pit wall on the left of the pit straight (1 m past the edge), the pit building beyond the lane on the left, from 205 m before the line to 125 m after it',
    Math.abs(wall - 1) < 0.3 && pit.length > 90 && pit[0][0] < -190 && pit[pit.length - 1][0] > 110 && pit.every(([d, f]) => f > T.bl[T.idx(sAt(d))] + 10),
    `pit wall ${wall.toFixed(2)} m, building ${pit[0][0]} .. ${pit[pit.length - 1][0]} m`);
}

// 4. the barriers: close to the road on the straights (a street circuit), back across every side street (the junction's pocket)
{
  const mouths = def.scen.mouths, pocket = mouths.filter(([d, side, , , , depth]) => { const i = T.idx(sAt(d)); return (side > 0 ? T.br[i] : T.bl[i]) - T.w > depth - 1.5; });
  let close = 0, cnt = 0; for (let i = 0; i < N; i += 5) { if (Math.abs(T.k[i]) > 1 / 300) continue; cnt++; if (Math.min(T.bl[i], T.br[i]) - T.w < 3) close++; }
  check('barriers: on the straights close to the road (within 3 m of the edge on at least one side, 80 % of them)', close / cnt > 0.8, `${close}/${cnt}`);
  check('junctions: 25+ side streets, the barrier back across each one (its pocket)', mouths.length >= 25 && pocket.length === mouths.length, `${pocket.length}/${mouths.length} pockets`);
}

// 5. whole races (3 laps, 12 AI + the player on autopilot) in the dry and in the rain: every car finishes
for (const rain of [0, 1]) {
  const orig = Math.random; Math.random = seeded(3);
  const r = new C.Race(T, opts({ rain })); r.start(); const P = r.player; let t = 0, k = 0, resc = 0;
  while (t < 1500 && r.cars.some(c => !c.finished)) { Math.random = seeded(7000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime);
  check(`race ${rain ? 'in the rain' : 'in the dry'}: all 13 cars finish 3 laps`, fin.length === 13, `${fin.length}/13, winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s, ${resc} rescues`);
}

// 6. the junctions' street furniture is knockable: a row of every kind across the racing line in the pocket of a junction on the
// boulevard; the player on autopilot drives through them at speed: each one is hit and moved, the car drives on (barely slowed)
{
  const KINDS = ['tlight', 'tmast', 'sign', 'bollard', 'bin', 'hydrant', 'cabinet', 'lamp'];
  const orig = Math.random; Math.random = seeded(5);
  const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, laps: 1 })), P = r.player;
  const d0 = 1150, list = [];   // (on the boulevard, 300 m after turn 5: the car is flat out there)
  KINDS.forEach((kind, k) => { const s = sAt(d0 + k * 14), i = T.idx(s), o = T.rl[i] + (k % 2 ? 0.4 : -0.4); list.push({ kind, x: T.px[i] + T.nx[i] * o, z: T.pz[i] + T.nz[i] * o, yaw: T.hd[i], col: 0, i }); });
  r.setProps(list); r.start();
  const p0 = r.props.filter(b => !b.dead).map(b => [b.x, b.z]);
  let t = 0, k = 0, vIn = 0, vOut = 0;
  while (t < 200 && !P.finished) { Math.random = seeded(9000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; const d = ((P.q.s - T.startS) % T.len + T.len) % T.len;
    if (!vIn && d > d0 - 40 && d < d0 - 20) vIn = P.speed; if (!vOut && d > d0 + KINDS.length * 14 + 20 && d < d0 + KINDS.length * 14 + 40) vOut = P.speed; }
  Math.random = orig;
  const live = r.props.filter(b => !b.dead), moved = live.filter((b, j) => Math.hypot(b.x - p0[j][0], b.z - p0[j][1]) > 0.5);
  const kinds = new Set(r.props.map(b => b.kind));
  check('street furniture: every kind is a prop the race knows (Core)', KINDS.every(k => kinds.has(k)), [...kinds].join(' '));
  check('street furniture: the car knocks them all over and away (each moved more than 0.5 m), none ends up past the barriers or broken (NaN)', moved.length === KINDS.length &&
    live.every(b => Number.isFinite(b.x + b.y + b.z) && (() => { const q = T.query(b.x, b.z, b.qi, {}); return Math.abs(q.d) < (q.d > 0 ? q.br : q.bl) + 0.2; })()), `${moved.length}/${KINDS.length} moved`);
  check('street furniture: the car drives on through all eight (at least 60 % of its speed after them, ~5 % a hit; finishes the lap)', P.finished && vIn > 30 && vOut > vIn * 0.6, `${(vIn * 3.6).toFixed(0)} -> ${(vOut * 3.6).toFixed(0)} km/h`);
}

console.log(`\n${n - bad}/${n} OK`);
process.exit(bad ? 1 : 0);
