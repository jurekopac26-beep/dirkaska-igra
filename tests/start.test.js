// The start's reaction (Core LAUNCH, Race opts.launch; no browser). A car sets off at its first press of the throttle after the lights go
// out; the later the press, the more its driven wheels spin in the first metres (less grip for 1-1.5 s), so the quickest press right after
// the lights gives the quickest start. The player's throttle held through the lights going out is a poor start (on the gas too early);
// let go after the lights and pressed again, the new press counts. The AI: each car's reaction from the race's seed (0.15-0.45 s, the
// quicker drivers quicker on the whole), the same every time with the same seed; its car waits on the grid until then. On in a race from
// the grid; off in a time trial, on a flying lap, in the run from the police and in the title demo (the game also turns it off in the
// new map's free drive and in the school's lessons other than the start). The flying start of a race up an open road (opts.flying, s): no
// reaction, every car already rolling up the road from its slot on the grid in the gear for that speed; the whole race to the finish.
//   node tests/start.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : String(x));
const f3 = (x) => (Number.isFinite(x) ? x.toFixed(3) : String(x));

// the player alone on the Red Bull Ring's grid (the autopilot steers): a second on the grid, the lights out, then the throttle as `how`
// says: a number (pressed that many seconds after the lights), 'held' (down all through the lights), 'again' (down through the lights,
// let go at once, pressed again 0.2 s after them). The race clock when the car is 50 m and 100 m from where it stood; its speed 1 s after
// the press; the most wheelspin and grip lost in the second after the press
function run(how, opts = {}) {
  const orig = Math.random;
  try {
    Math.random = seeded(3);
    const T = track('rbring'), r = new C.Race(T, Object.assign({ numAI: 0, playerGrid: 1, laps: 2, phys: 'cs', seed: 3, playerModel: C.MODELS[0], assist: 2 }, opts)), P = r.player;
    const early = how === 'held' || how === 'again', at = how === 'again' ? 0.2 : typeof how === 'number' ? how : 0;
    for (let t = 0; t < 1; t += DT) { P.inThr = early ? 1 : 0; P.inBrk = 0; r.step(DT); }
    r.start();
    const s0 = P.dist, out = { t50: NaN, t100: NaN, v1: NaN, spin: 0, kMin: 1, re: NaN, held: false }; let pressT = NaN, pressN = 0;
    for (let k = 0; k < 2400 && !(out.t100 >= 0); k++) {
      C.aiControl(P, r, DT);
      const t = r.time + DT, on = how === 'held' ? true : how === 'again' ? (t < 0.03 || t >= at - 1e-9) : t >= at - 1e-9;
      P.inThr = on ? 1 : 0; P.inBrk = 0;
      r.step(DT);
      const L = P.lch; if (L && L.t >= 0 && L.n !== pressN) { pressN = L.n; pressT = r.time; }   // (the step of the press counted; held, let go and pressed again: the new one)
      const since = r.time - pressT;
      if (since >= 0 && since <= 1) { out.spin = Math.max(out.spin, P.spin); out.kMin = Math.min(out.kMin, L.k); }
      if (since >= 1 && !(out.v1 >= 0)) out.v1 = P.speed;
      const d = P.dist - s0;
      if (!(out.t50 >= 0) && d >= 50) out.t50 = r.time;
      if (!(out.t100 >= 0) && d >= 100) out.t100 = r.time;
    }
    if (P.lch) { out.re = P.lch.re; out.held = P.lch.held; }
    return out;
  } finally { Math.random = orig; }
}

// 1. the player: the quicker the press, the quicker the start; held through the lights slower than a press 0.1 s after them
{
  const off = run(0, { launch: false }), r0 = run(0), r10 = run(0.1), r15 = run(0.15), r25 = run(0.25), r50 = run(0.5), held = run('held'), again = run('again');
  check('a press as the lights go out: the start as before (no reaction to speak of, no grip lost)', Math.abs(r0.t100 - off.t100) < 0.02 && r0.kMin === 1,
    `100 m in ${f3(r0.t100)} s (without the reaction: ${f3(off.t100)} s), grip share at least ${f2(r0.kMin)}`);
  check('the reaction is measured from the lights going out to the press', Math.abs(r10.re - 0.1) < 0.01 && Math.abs(r50.re - 0.5) < 0.01 && !r10.held, `0.1 s press: ${f3(r10.re)} s, 0.5 s press: ${f3(r50.re)} s`);
  check('the quicker the press, the quicker the first 50 m and 100 m (0, 0.1, 0.15, 0.25, 0.5 s)', [r0, r10, r15, r25, r50].every((x, i, a) => i === 0 || (x.t50 > a[i - 1].t50 && x.t100 > a[i - 1].t100)),
    [r0, r10, r15, r25, r50].map(x => f2(x.t100)).join(' < ') + ' s to 100 m');
  check('a 0.15 s reaction: an almost clean start (under 0.1 s lost beyond the reaction itself)', r15.t100 - r0.t100 - 0.15 < 0.1, `${f3(r15.t100 - r0.t100 - 0.15)} s more`);
  check('a 0.5 s reaction: slower than 0.15 s over the first 100 m by clearly more than the 0.35 s between the presses (the wheels spin)', r50.t100 - r15.t100 > 0.35 + 0.3 && r50.t50 - r15.t50 > 0.35 + 0.3,
    `50 m: ${f2(r15.t50)} / ${f2(r50.t50)} s, 100 m: ${f2(r15.t100)} / ${f2(r50.t100)} s`);
  check('the throttle held through the lights: on the gas too early, counted as LAUNCH.held s', held.held && held.re === C.LAUNCH.held, `held ${held.held}, ${f2(held.re)} s`);
  check('held through the lights: slower to 100 m than a press 0.1 s after them (by 0.25 s or more), but no disaster (under 1 s behind the press as the lights go out)',
    held.t100 - r10.t100 > 0.25 && held.t100 - r0.t100 < 1, `100 m in ${f2(held.t100)} s held, ${f2(r10.t100)} s at 0.1 s, ${f2(r0.t100)} s at once`);
  check('held through the lights, let go and pressed again 0.2 s after them: the new press counts (0.2 s, not held)', !again.held && Math.abs(again.re - 0.2) < 0.01 && again.t100 < held.t100,
    `${f2(again.re)} s, 100 m in ${f2(again.t100)} s (held: ${f2(held.t100)} s)`);
  // 2. the wheelspin: after a late press the driven wheels lose grip (to under half) and spin harder; a second after the press the car is slower
  check('a late press (0.5 s): the driven wheels spin (grip share under 0.5, more wheelspin than a quick press, slower a second after the press)',
    r50.kMin < 0.5 && r10.kMin > 0.95 && r50.spin > r10.spin * 1.5 && r50.v1 < r10.v1 - 1,
    `grip share ${f2(r50.kMin)} (0.1 s: ${f2(r10.kMin)}), wheelspin ${f2(r50.spin)} (0.1 s: ${f2(r10.spin)}), speed 1 s after the press ${f2(r50.v1 * 3.6)} km/h (0.1 s: ${f2(r10.v1 * 3.6)} km/h)`);
}

// 3. the AI: each reaction in 0.15-0.45 s, not all the same, the faster half of the field quicker on the whole; a car waits on the grid until
// its reaction, then sets off; the same seed the same reactions and the same race, another seed other reactions
function aiRace(seed, sec) {
  const orig = Math.random;
  try {
    Math.random = seeded(7);
    const r = new C.Race(track('jezero'), { numAI: 12, playerGrid: 12, laps: 2, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed, difficulty: 1 });
    r.start();
    const AI = r.cars.filter(c => !c.isPlayer), re = AI.map(c => c.lch.re), moved = new Map();
    for (let k = 0; k < sec / DT; k++) {
      Math.random = seeded(100 + k); C.aiControl(r.player, r, DT); r.step(DT);
      for (const c of AI) if (!moved.has(c) && c.speed > 0.3) moved.set(c, r.time);
    }
    return { r, AI, re, moved, state: r.cars.map(c => [c.x, c.z, c.speed, c.dist].map(v => v.toFixed(6)).join(',')).join(';') };
  } finally { Math.random = orig; }
}
{
  const a = aiRace(11, 12), b = aiRace(11, 12), c = aiRace(12, 0);
  const lo = Math.min(...a.re), hi = Math.max(...a.re), uniq = new Set(a.re.map(x => x.toFixed(3))).size;
  check('the AI: every reaction within 0.15-0.45 s, and they differ', a.re.every(x => x >= 0.15 && x <= 0.45) && uniq >= 8 && hi - lo > 0.1, `${a.re.map(f2).join(' ')} s (${uniq} different)`);
  const half = a.AI.length >> 1, by = a.AI.slice().sort((x, y) => x.skill - y.skill).reverse(), mean = (L) => L.reduce((s, c) => s + c.lch.re, 0) / L.length;
  check('the AI: the quicker half of the field reacts quicker on the whole', mean(by.slice(0, half)) < mean(by.slice(half)), `${f3(mean(by.slice(0, half)))} s against ${f3(mean(by.slice(half)))} s`);
  const late = a.AI.filter(c => !(a.moved.get(c) >= c.lch.re - 1e-6 && a.moved.get(c) < c.lch.re + 0.6));
  check('the AI: each car stands on the grid until its reaction, then sets off (within 0.6 s of it)', !late.length, late.map(c => `${c.name}: ${f2(c.lch.re)} s, moved at ${f2(a.moved.get(c))} s`).join(' | '));
  check('the AI: every car off the line, with its wheelspin over, after 12 s', a.AI.every(c => c.lch.t >= 0 && c.lch.done), '');
  check('the same seed: the same reactions and the same race (bit for bit); another seed: other reactions', a.state === b.state && a.re.join() === b.re.join() && c.re.join() !== a.re.join(), '');
}

// 4. where it is on and off: a race from the grid (also an online race: the player's own car on its phone, the friends' cars none); off in a
// time trial, a flying lap (qualifying, a challenge's lap), the run from the police, the title demo and when the game turns it off
{
  const has = (r) => r.cars.some(c => c.lch) || !!r.lch;
  const race = new C.Race(track('jezero'), { numAI: 3, playerGrid: 4, laps: 2, phys: 'cs', seed: 3 });
  const online = new C.Race(track('jezero'), { numAI: 0, playerGrid: 1, laps: 2, phys: 'cs', seed: 3, remote: { id: 'h', model: C.MODELS[1], grid: 2, name: 'Prijatelj' } });
  const tt = new C.Race(track('pikes'), { numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', seed: 3 });
  const quali = new C.Race(track('jezero'), { numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', seed: 3, qualiBack: 120 });
  const demo = new C.Race(track('jezero'), { numAI: 5, noPlayer: true, laps: 9, phys: 'cs', seed: 3 });
  const off = new C.Race(track('jezero'), { numAI: 3, playerGrid: 4, laps: 2, phys: 'cs', seed: 3, launch: false });
  const vrsic = C.TRACKS.find(d => d.id === 'vrsic'), pol = vrsic ? new C.Race(track('vrsic'), { numAI: 0, playerGrid: 1, laps: 1, phys: 'cs', seed: 3, police: true }) : null;
  check('on in a race from the grid (every car), online (the player\'s car only: the friend\'s sets off on its own phone)', has(race) && race.cars.every(c => c.lch) && has(online) && online.player.lch && !online.remotes[0].lch, '');
  check('off in a time trial, on a flying lap, in the title demo, in the run from the police and when turned off (no car with it)', !has(tt) && !has(quali) && !has(demo) && !has(off) && !(pol && has(pol)), '');
}

// the flying start (opts.flying: the game's race up an open road, the countdown's seconds): the race already under way, the cars in one line
// on the road in the order of the grid, the player's car at the back (here asked for the middle of the grid), ~10 s from it to the first (each
// ~0.8 s of its pace ahead of the next), every one rolling up the road at its pace, in a gear for it, no reaction to the lights (no LAUNCH);
// the player's car below the start line, over it as the countdown ends (Race.flyOn off: the game hands it over then); no one passes until
// then and no two come close; the race on autopilot to the finish, every car there
{
  const orig = Math.random; Math.random = seeded(3);
  const T = track('bigsur'), r = new C.Race(T, { numAI: 12, playerGrid: 7, laps: 1, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 11, difficulty: 1, flying: 3 });
  r.start();
  const along = r.cars.map(c => { const i = c.q.i >= 0 ? c.q.i : T.idx(c.q.s); return (c.vx * Math.cos(T.hd[i]) + c.vz * Math.sin(T.hd[i])) / c.speed; });
  const rev = r.cars.map(c => c.speed / c.m.rw * c.m.gears[c.gear - 1] * c.m.final * 9.5493 / c.m.redline);
  const line = r.cars.filter(c => c !== r.player).sort((a, b) => a.grid - b.grid).concat([r.player]), gaps = line.slice(1).map((c, k) => (line[k].dist - c.dist) / c.speed), span = gaps.reduce((a, b) => a + b, 0);
  check('flying start: the column in the order of the grid, the player at the back below the start line, ~10 s from it to the first car, each rolling up the road at its pace (over 80 km/h), in a gear for it, no LAUNCH',
    !r.lch && !r.timeTrial && r.cars.length === 13 && r.player.dist < -50 && r.flyOn && gaps.every(g => g > 0.5 && g < 1.3) && span > 8 && span < 12 && r.cars.every(c => c.speed * 3.6 > 80 && c.speed * 3.6 < 260) && along.every(a => a > 0.97) && rev.every(x => x < 0.95),
    `gaps ${gaps.map(g => g.toFixed(2)).join(' ')} s (${span.toFixed(1)} s), ${r.cars.map(c => Math.round(c.speed * 3.6)).join(',')} km/h, at most ${Math.round(Math.max(...rev) * 100)} % of the redline, along ${Math.min(...along).toFixed(3)}`);
  const order = () => r.cars.slice().sort((a, b) => b.dist - a.dist).map(c => c.id).join();
  const o0 = order(); let t = 0, k = 0, near = 1e9, kept = true;
  while (r.flyOn && t < 6) {
    Math.random = seeded(5000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT); t += DT; if (order() !== o0) kept = false;
    for (const a of r.cars) for (const b of r.cars) if (a !== b) near = Math.min(near, Math.hypot(a.x - b.x, a.z - b.z));
  }
  check('flying start: the player\'s car over the start line as the countdown ends (~3 s), no one passing until then and no two cars close', !r.flyOn && t > 2.9 && t < 3.6 && r.player.dist >= 0 && kept && near > 9, `over the line at ${t.toFixed(2)} s, the nearest two ${near.toFixed(1)} m apart`);
  while (t < 300 && r.cars.some(c => !c.finished)) { Math.random = seeded(5000 + (++k)); C.aiControl(r.player, r, DT); r.step(DT); t += DT; if (r.player.stuckT > 3 || r.player.wrongT > 3) r.rescue(r.player); }
  Math.random = orig;
  const fin = r.cars.filter(c => c.finished).sort((a, b) => a.finishTime - b.finishTime), still = new C.Race(T, { numAI: 12, playerGrid: 12, laps: 1, playerModel: C.MODELS[4], phys: 'cs', seed: 11 });
  check('flying start: the race on autopilot, all 13 cars at the finish; without opts.flying the standing start with its reaction', fin.length === 13 && !!still.lch && still.cars.every(c => c.speed === 0),
    `winner ${fin[0] ? fin[0].finishTime.toFixed(1) : '-'} s`);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exit(bad ? 1 : 0);
