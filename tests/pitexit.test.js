// A perfect exit out of the pits (Core only, no browser; Core PIT_LAUNCH, Race.pitLaunch; game.js pitExitStep starts it at a press of the
// gas within 0.35 s of the hand-back, VOZIŠ TI!, and shows POPOLN IZHOD!): a clean launch, the start's LAUNCH the other way round. The
// player alone on the Red Bull Ring, on the autopilot, in at the end of the first lap; handed back ~1 s before the way out joins the
// circuit (as game.js pitNear), then the autopilot's steering (in the lane until it leaves it) with full throttle from 0.15 s after the
// hand-back, with the clean launch and without it (a press as quick, but not counted: today's exit), and from 0.6 s (a late press, a
// normal exit); out of the lane, from where the autopilot first brakes for the corner ahead, its gas and brake (a driver would brake there:
// on the paved pit road the car is quick enough to reach the first corner within the 6 s, and full throttle into it would only compare
// who runs off harder). The pit lane's speed limit ends at the hand-back (Race.pitStep: the driver's gas from there). With it, each of
// the 10 cars: no wheelspin through the rest of the lane and onto the circuit's asphalt (while half of it or more is left), less over its
// whole time; quicker, but only a little (more speed 1.5 s after the hand-back, a few metres more 3 and 6 s after it); its share 1 at
// first, never up, gone after PIT_LAUNCH.win s. Without it the exit as before: the wheels spin in the lane; the late press further behind
// still. Bathurst too (its lane on the left; Hell Corner right after the way out: quicker where the first of the two brakes for it).
// Not a plain field (the golden references' digest): a car never given one has none.
//   node tests/pitexit.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : String(x));
const X = C.PIT_LAUNCH;

// game.js pitNear: a run of max(12 m, 1.3 s) ahead is past the lane's end, or in the way out where its middle has come over the pit wall's line
const near = (r, P) => { const s1 = P.q.s + Math.max(12, P.speed * 1.3), p1 = r.track.pitAt(s1); return !p1 || (p1.gap && p1.o <= p1.wall + 1); };

// the player (model mi) alone on track tid, told to come in from a third of the way round the first lap; at the hand-back the throttle
// from `press` s after it (clean: Race.pitLaunch at that press). For 6 s after the hand-back: the wheelspin (the most while the clean
// launch's share is half or more, and over its whole time), when the car leaves the lane and the pit road (back on the circuit's
// asphalt), its speed 1.5 s after the hand-back, the distance 3 and 6 s after it, the share each step
function run(tid, mi, press, clean) {
  const orig = Math.random; let k = 0;
  try {
    Math.random = seeded(7);
    const T = track(tid), r = new C.Race(T, { numAI: 0, playerGrid: 1, laps: 3, phys: 'cs', seed: 5, playerModel: C.MODELS[mi], assist: 2 }), P = r.player;
    r.start();
    let hb = -1;
    while (r.time < 400) {
      Math.random = seeded(1000 + (++k));
      if (P.dist > T.len * 0.3 && !P.repairN && !P.inPit) P.pitWant = true;
      C.aiControl(P, r, DT);
      if (P.pitDone && P.inPit && near(r, P)) { hb = r.time; break; }
      r.step(DT);
    }
    const o = { hb, v0: P.speed, spinHalf: 0, spinWin: 0, spinLane: 0, out: null, asph: null, v15: NaN, d3: NaN, d6: NaN, ks: [], plx0: P.plx, plxEnd: undefined, kind: '', ds: [], vs: [], brk: null };
    if (hb < 0) return o;
    const d0 = P.dist; let pressed = false, brk = false;
    for (let j = 0; j < 6 / DT; j++) {
      Math.random = seeded(5000 + (++k));
      P.pitWant = P.inPit; C.aiControl(P, r, DT);   // (the autopilot's steering: along the lane until it leaves it)
      if (!P.inPit && P.inBrk > 0 && !brk) { brk = true; o.brk = j; }   // (out of the lane, from where the autopilot first brakes for the corner ahead: its gas and brake, as a driver would)
      const on = r.time - hb >= press - 1e-9; if (!brk) { P.inThr = on ? 1 : 0; P.inBrk = 0; }
      if (on && !pressed) { pressed = true; if (clean) { r.pitLaunch(P); o.kind = typeof P.plx; } }
      const kNow = P.plx ? P.plx.k : 0;
      r.step(DT);
      const t = r.time - hb;
      if (P.plx || (pressed && clean && t - press < X.win + 0.1)) o.ks.push(P.plx ? P.plx.k : null);
      if (kNow >= 0.5) o.spinHalf = Math.max(o.spinHalf, P.spin);
      if (t <= X.win) o.spinWin = Math.max(o.spinWin, P.spin);
      if (P.inPit && t >= press) o.spinLane = Math.max(o.spinLane, P.spin);
      if (o.out == null && !P.inPit) o.out = t;
      if (o.asph == null && !P.inPit && !P.pitG) o.asph = t;
      if (Math.abs(t - 1.5) < DT / 2) o.v15 = P.speed;
      if (Math.abs(t - 3) < DT / 2) o.d3 = P.dist - d0;
      o.ds.push(P.dist - d0); o.vs.push(P.speed);
    }
    o.d6 = P.dist - d0; o.plxEnd = P.plx;
    return o;
  } finally { Math.random = orig; }
}

// 1. the 10 cars on the Red Bull Ring: the clean launch against the same quick press without it, and a late press
const CARS = C.MODELS.map((m, i) => i).filter(i => !C.MODELS[i].retired && !C.MODELS[i].kit);
const rows = CARS.map(mi => ({ id: C.MODELS[mi].id, mi, a: run('rbring', mi, 0.15, true), b: run('rbring', mi, 0.15, false), late: run('rbring', mi, 0.6, false) }));
{
  const none = rows.filter(x => !(x.a.hb > 0 && x.b.hb > 0 && x.late.hb > 0));
  check('each of the 10 cars handed back in the lane after its stop, ~1 s before the way out (out of the lane within 2.5 s)', rows.length === 10 && !none.length && rows.every(x => x.a.out > 0.4 && x.a.out < 2.5 && x.b.out > 0.4 && x.b.out < 2.5),
    rows.map(x => `${x.id} ${f2(x.a.hb)} s, out after ${f2(x.a.out)} s`).join(', '));
  check('handed back at the lane\'s pace (50-60 km/h), none of them with a clean launch before it (no field)', rows.every(x => x.a.v0 * 3.6 > 50 && x.a.v0 * 3.6 < 62 && x.a.plx0 === undefined),
    rows.map(x => `${x.id} ${f2(x.a.v0 * 3.6)}`).join(', ') + ' km/h');
  check('without it (today\'s exit): the driven wheels spin in the lane with full throttle (each car)', rows.every(x => x.b.spinLane > 0.3), rows.map(x => `${x.id} ${f2(x.b.spinLane)}`).join(', '));
  check('with it: no wheelspin through the rest of the lane and onto the circuit\'s asphalt (while half of it or more is left)', rows.every(x => x.a.spinHalf === 0 && x.a.spinLane === 0 && x.a.asph != null),
    rows.map(x => `${x.id} ${f2(x.a.spinHalf)} (lane ${f2(x.a.spinLane)}, on the asphalt after ${f2(x.a.asph)} s)`).join(', '));
  check('... and less wheelspin over its whole time than without it (each car)', rows.every(x => x.a.spinWin < x.b.spinWin * 0.75),
    rows.map(x => `${x.id} ${f2(x.a.spinWin)}/${f2(x.b.spinWin)}`).join(', '));
  check('with it quicker: more speed 1.5 s after the hand-back, more distance 3 and 6 s after it (each car)', rows.every(x => x.a.v15 > x.b.v15 + 0.3 && x.a.d3 > x.b.d3 + 0.5 && x.a.d6 > x.b.d6 + 0.5),
    rows.map(x => `${x.id} +${f2((x.a.v15 - x.b.v15) * 3.6)} km/h, +${f2(x.a.d3 - x.b.d3)} m, +${f2(x.a.d6 - x.b.d6)} m`).join(', '));
  check('... but only a little: under 12 m more after 6 s (about a tenth or two of a second), never more than 10 km/h', rows.every(x => x.a.d6 - x.b.d6 < 12 && (x.a.v15 - x.b.v15) * 3.6 < 10),
    rows.map(x => `${x.id} +${f2(x.a.d6 - x.b.d6)} m`).join(', '));
  check('a late press (0.6 s): a normal exit, further behind still (6 s after the hand-back over 5 m behind the clean launch, behind the quick press without it)',
    rows.every(x => x.late.d6 < x.a.d6 - 5 && x.late.d6 < x.b.d6 && !x.late.plxEnd), rows.map(x => `${x.id} −${f2(x.a.d6 - x.late.d6)} m`).join(', '));
  const kOk = (o) => o.kind === 'object' && o.ks.length > 10 && o.ks[0] === 1 && o.ks.every((v, i) => i === 0 || v === null || v <= o.ks[i - 1]) && o.ks[o.ks.length - 1] === null && o.plxEnd === null
    && Math.abs(o.ks.indexOf(null) * DT - X.win) < 2 * DT && o.ks.slice(0, Math.floor(0.35 * X.win / DT) - 1).every(v => v === 1);
  check(`its share: 1 at first (for 0.35 x ${X.win} s), never up, then gone after ${X.win} s (the field cleared); an object (not in the golden references' digest)`, rows.every(x => kOk(x.a)),
    JSON.stringify(rows.filter(x => !kOk(x.a)).map(x => ({ id: x.id, kind: x.a.kind, n: x.a.ks.length, first: x.a.ks.slice(0, 2), gone: x.a.ks.indexOf(null) * DT }))));
  check('a car never given one has none (the quick and the late press without it)', rows.every(x => x.b.plxEnd === undefined && x.late.plxEnd === undefined), '');
}

// 2. Bathurst (its lane on the left): the same for the rally car and the muscle car
{
  // (quicker where the first of the two brakes for Hell Corner, both on full throttle until then: more speed, more distance; past it the
  // corner's line, not the launch, sets who is ahead)
  const B = [4, 8].map(mi => { const a = run('bathurst', mi, 0.15, true), b = run('bathurst', mi, 0.15, false), j = Math.min(a.brk == null ? 1e9 : a.brk, b.brk == null ? 1e9 : b.brk);
    return { id: C.MODELS[mi].id, a, b, j: j < 1e9 ? j : -1, dv: j < 1e9 ? a.vs[j] - b.vs[j] : NaN, dd: j < 1e9 ? a.ds[j] - b.ds[j] : NaN }; });
  check('Bathurst (the lane on the left): handed back in the lane, with it no wheelspin while half of it or more is left; quicker by a little (where the first of the two brakes for Hell Corner); without it the wheels spin',
    B.every(x => x.a.hb > 0 && x.a.out > 0.4 && x.a.spinHalf === 0 && x.a.spinLane === 0 && x.b.spinLane > 0.3 && x.j > 0 && x.dv > 0.3 && x.dd > 0.5 && x.dd < 12 && x.a.plxEnd === null),
    B.map(x => `${x.id}: out after ${f2(x.a.out)} s, spin ${f2(x.a.spinHalf)}/${f2(x.b.spinLane)}, braking ${f2((x.j + 1) * DT)} s after the hand-back: +${f2(x.dv * 3.6)} km/h, +${f2(x.dd)} m`).join(', '));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
