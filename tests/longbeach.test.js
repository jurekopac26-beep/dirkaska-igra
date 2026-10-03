// Long Beach: the street circuit in the city centre by the harbour, in its real layout (2000-) and scale (3.167 km, 11 turns, clockwise). The track:
// its name (a place, the country), the length within 6 % of the real one, the eleven turns in their order round the lap and each turning the
// right way (Turn 1 left onto Aquarium Way, 2-3 round the fountain, 4-5 right round the car park, 6 left up Pine Avenue, 7 its kink, 8 right onto
// Seaside Way, 9 right, 10 left, 11 the hairpin right), the start line on the front straight on Shoreline Drive with the pit lane on its right
// (the north carriageway) round it; the walls stand back where the streets come in (the junctions' furniture inside them). Whole races with
// 12 AI cars and the player on autopilot, dry and wet, everyone to the finish; a pit stop on autopilot. The street furniture of the junctions
// (traffic lights on posts and on mast arms, lamps, signs, bollards, hydrants, bins, newspaper boxes, cabinets): the car knocks it all over and
// drives on (a little slower, no damage). Only geographic names.
//   node tests/longbeach.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const def = C.TRACKS.find(d => d.id === 'longbeach'), T = new C.Track(def);
const opts = (o) => Object.assign({ numAI: 12, playerGrid: 12, laps: def.laps, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1 }, o);
const orig = Math.random;
const dS = (s) => ((s - T.startS) % T.len + T.len) % T.len;

// 1. the track: a closed circuit of five laps, Long Beach, ZDA (USA in English), in the big championship; its length in the real scale
check('track: Long Beach, ZDA (Long Beach, USA), a closed street circuit of 5 laps, in the big championship',
  def.name === 'Long Beach, ZDA' && def.en.name === 'Long Beach, USA' && !def.open && def.laps === 5 && !def.test && C.CHAMPS.find(s => s.id === 'veliko').tracks.includes('longbeach'), def.name);
check('length: ~3.0 km, within 6 % of the real 3.167 km (the street corners rounded)', Math.abs(T.len / 1000 - def.realKm) / def.realKm < 0.06 && T.len > 2900,
  `${(T.len / 1000).toFixed(3)} km, real ${def.realKm} km (${((T.len / 1000 / def.realKm - 1) * 100).toFixed(1)} %)`);

// 2. the eleven turns: in their order round the lap, each the right way (curvature k > 0: a right turn), the hairpin the tightest
{
  const DIR = [-1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1], at = def.turns.map(([x, z]) => T.nearestIdx(x, z)), d = at.map(i => dS(i * T.ds));
  const turn = at.map(i => { let s = 0; for (let k = -12; k <= 12; k++) s += T.k[(i + k + T.N) % T.N]; return s; });
  const ok = d.every((v, k) => !k || v > d[k - 1]) && turn.every((v, k) => Math.sign(v) === DIR[k]) && def.turns.length === 11;
  check('turns: 11 in order round the lap (1 left onto Aquarium Way ... 11 the hairpin right), each turning the right way', ok,
    d.map((v, k) => `T${k + 1}@${Math.round(v)}${turn[k] > 0 ? 'R' : 'L'}`).join(' '));
  let rmin = 1e9, imin = 0; for (let i = 0; i < T.N; i++) { const r = 1 / Math.max(1e-6, Math.abs(T.k[i])); if (r < rmin) { rmin = r; imin = i; } }
  check('the hairpin (Turn 11): the tightest corner of the lap (radius ~8-12 m), just before the front straight', Math.abs(dS(imin * T.ds) - d[10]) < 40 && rmin > 6 && rmin < 14,
    `tightest ${rmin.toFixed(1)} m at ${Math.round(dS(imin * T.ds))} m`);
  const nm = T.names.filter(q => q.hud !== false).map(q => q.n);
  check('names: the HUD has the turns by their numbers only, the commentator the streets (place names only, no event, sponsor or business)',
    nm.join() === Array.from({ length: 11 }, (_, k) => 'Zavoj ' + (k + 1)).join() && !/grand prix|indy|acura|toyota|queen mary|aquarium of|hyatt|pike outlet/i.test(JSON.stringify([def.names, def.desc, def.en])), nm.join(', '));
}

// 3. the start and the pits: the start line on the front straight, the pit lane on its right (the north carriageway) from 150 m before the line
// to 145 m after it; the walls stand back where a street comes in (def.wide), never into another leg of the circuit
{
  const p0 = T.pitAt(T.startS), pBefore = T.pitAt(T.startS - 140), pAfter = T.pitAt(T.startS + 135), none = T.pitAt(T.startS + 300);
  check('pits: the lane on the right of the front straight round the start line, the boxes either side of it', !!p0 && p0.o > 14 && !!pBefore && !!pAfter && !none && def.pitRow[0] < 0 && def.pitRow[1] > 0,
    `lane ${p0 ? p0.o.toFixed(1) : '-'} m right of the centre line`);
  let clash = 0; for (const [a, b, sd] of def.wide) for (let dd = a; dd <= b; dd += 2) { const i = T.idx(T.startS + dd), bar = sd > 0 ? T.br[i] : T.bl[i], x = T.px[i] + T.nx[i] * sd * (bar + 0.5), z = T.pz[i] + T.nz[i] * sd * (bar + 0.5), q = T.query(x, z, -1, {});
    if (Math.abs(((q.i - i) % T.N + T.N) % T.N) > 30 && Math.abs(((i - q.i) % T.N + T.N) % T.N) > 30) clash++; }
  check('junctions: the walls stand back at the streets\' mouths (a pocket at each), never over another leg of the circuit', def.wide.length >= 12 && !clash, `${def.wide.length} pockets, ${clash} clashes`);
}

// 4. whole races on autopilot, dry and wet: all 13 cars finish, the rain slower
const race = (rain) => {
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ rain })), P = r.player; r.start();
  let t = 0, k = 0, resc = 0, nan = false;
  while (t < 1500 && r.cars.some(c => !c.finished)) {
    Math.random = seeded(5000 + (++k));
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; }
    if (!Number.isFinite(P.x + P.z)) nan = true;
  }
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishPos - b.finishPos);
  return { fin, win: fin[0] ? fin[0].finishTime : 0, resc, nan, best: Math.min(...r.cars.map(c => c.bestLap || 1e9)) };
};
const dry = race(0), wet = race(1);
check('race (dry): all 13 cars finish the 5 laps', dry.fin.length === 13 && !dry.nan, `${dry.fin.length}/13, winner ${dry.win.toFixed(1)} s, player rescues ${dry.resc}`);
check('race (wet): all 13 cars finish, slower than in the dry', wet.fin.length === 13 && !wet.nan && wet.win > dry.win * 1.005 && wet.win < dry.win * 1.3, `${wet.fin.length}/13, winner ${wet.win.toFixed(1)} s (${((wet.win / dry.win - 1) * 100).toFixed(1)} % slower)`);

// 5. a pit stop on autopilot: into the lane, stop at the box, back out and on round the lap
{
  Math.random = seeded(3);
  const r = new C.Race(T, opts({ laps: 3, damage: 2 })), P = r.player; r.start();
  let t = 0, k = 0, stopped = false, inLane = false, wanted = false;
  while (t < 600 && !P.finished) {
    Math.random = seeded(9000 + (++k));
    if (!wanted && P.lap >= 1 && dS(P.q.s) > 1000 && dS(P.q.s) < 1200) { P.pitWant = true; wanted = true; }
    C.aiControl(P, r, DT); r.step(DT); t += DT;
    if (P.inPit) inLane = true; if (P.pitState === 'stop' || P.pitState === 'repair' || P.pitState === 'service') stopped = true;
    if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
  }
  Math.random = orig;
  check('pits: on autopilot into the pit lane, a stop at the box, back out and to the finish', inLane && stopped && P.finished, `in lane ${inLane}, stopped ${stopped}, finished ${P.finished} in ${t.toFixed(0)} s`);
}

// 6. the junctions' street furniture (knockable): traffic lights on a post and on a mast arm, a lamp, a sign, a bollard, a hydrant, a bin, a newspaper
// box, the lights' cabinet, set on the racing line of the back straight; the car on autopilot knocks every one over and drives on: a little slower,
// no damage, no rescue
{
  const kinds = ['signal', 'mast', 'lamp', 'sign', 'bollard', 'hydrant', 'bin', 'newsbox', 'cabinet'];
  const lap = (withProps) => {
    Math.random = seeded(3);
    const r = new C.Race(T, opts({ numAI: 0, playerGrid: 1, laps: 2, damage: 2 })), P = r.player;
    const list = []; if (withProps) kinds.forEach((kind, k) => { const s = T.startS + 1700 + k * 30, i = T.idx(s), o = T.rl[i]; list.push({ kind, x: T.px[i] + T.nx[i] * o, z: T.pz[i] + T.nz[i] * o, yaw: T.hd[i] + 1.2, col: k, i }); });
    r.setProps(list); const start = r.props.map(b => [b.x, b.y, b.z]);
    r.start();
    let t = 0, k = 0, resc = 0;
    while (t < 400 && !P.finished) { Math.random = seeded(7000 + (++k)); C.aiControl(P, r, DT); r.step(DT); t += DT; if (P.stuckT > 3 || P.wrongT > 3) { r.rescue(P); resc++; } }
    Math.random = orig;
    const moved = r.props.map((b, q) => Math.hypot(b.x - start[q][0], b.z - start[q][2]) > 0.5 || Math.abs(b.y - start[q][1]) > 0.3);
    return { t: P.finishTime || t, dmg: P.dmg || 0, resc, fin: P.finished, moved, props: r.props };
  };
  const clean = lap(false), hit = lap(true), all = hit.moved.every(Boolean);
  check('street furniture: every kind is in Core (PROPK) and the car knocks each one over', hit.props.length === kinds.length && all,
    kinds.map((kd, k) => kd + (hit.moved[k] ? '✓' : '✗')).join(' '));
  check('street furniture: the car drives on (a little slower, no damage, no rescue)', hit.fin && hit.resc === 0 && hit.dmg < 0.05 && hit.t >= clean.t - 0.5 && hit.t < clean.t + 8,
    `2 laps ${clean.t.toFixed(2)} s clean, ${hit.t.toFixed(2)} s through the furniture, damage ${hit.dmg.toFixed(3)}`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
