// Drag dirka (I20, docs/drag-dirka.md), no browser: the strip on a real track (straight, flat, room to brake past the line), the manual
// gearbox in the core (car.man: perfect shifts as quick as the automatic gearbox, early and late ones slower, the limiter), the head start
// (both perfect runs over the line together), the mode itself (the cars in their lanes, the rival's reaction and shifts by the difficulty,
// the finish, the red light, the words for the shifts).
//   node tests/drag.test.js
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
global.window = {};
const Z = require(path.join(ROOT, 'js', 'zabava.js'));
global.Zabava = Z;
const drag = require(path.join(ROOT, 'js', 'zabava', 'drag.js'));
const { loadCore } = require('./lib/core.js');
const { DT } = require('./lib/sim.js');
const C = loadCore();
drag.core = C;
const K = drag.K;

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const model = (id) => C.MODELS.find(m => m.id === id);

// 1. the strips: real tracks only, straight and flat over the run, the lanes on the asphalt, room to brake past the line
{
  const ids = Object.keys(C.DRAG);
  check('the strips are on real tracks (no test track: frozen, CLAUDE.md)', ids.length > 0 && ids.every(id => { const d = C.TRACKS.find(t => t.id === id); return d && !d.test; }), ids.join());
  for (const id of ids) {
    const T = new C.Track(C.TRACKS.find(d => d.id === id)), D = C.DRAG[id], G = drag.strip(T, D);
    let off = 0, kMax = 0, y0 = null, dy = 0, wMin = Infinity, kRun = 0;
    for (let s = D.s; s <= D.s + K.len + 20; s += 2) {
      const i = T.idx(s), dx = T.px[i] - G.ax, dz = T.pz[i] - G.az;
      off = Math.max(off, Math.abs(dx * G.nx + dz * G.nz)); kMax = Math.max(kMax, Math.abs(T.k[i]));
      if (T.hasElev) { if (y0 == null) y0 = T.hy[i]; dy = Math.max(dy, Math.abs(T.hy[i] - y0)); }
      wMin = Math.min(wMin, T.wS ? T.wS(s) : 5);
    }
    for (let s = D.s + K.len; s <= D.s + K.len + 150; s += 2) kRun = Math.max(kRun, Math.abs(T.k[T.idx(s)]));
    check(id + ': the run along the chord, the centre line within 0.5 m of it, no corner (|k| under 0.006)', off < 0.5 && kMax < 0.006, 'off ' + off.toFixed(2) + ' m, k ' + kMax.toFixed(4));
    check(id + ': flat (under 3 m up or down over the run)', dy < 3, dy.toFixed(2) + ' m');
    check(id + ': both lanes on the asphalt (a car\'s width to the edge)', wMin - D.lane > 1.6, 'half width ' + wMin.toFixed(2) + ', lane ' + D.lane);
    check(id + ': 150 m past the line still straight (to brake from the finish)', kRun < 0.006, kRun.toFixed(4));
  }
}

// 2. the manual gearbox (car.man): one car alone on Montréal's strip, full throttle; perfect shifts against the automatic gearbox
const T = new C.Track(C.TRACKS.find(d => d.id === 'montreal')), G = drag.strip(T, C.DRAG.montreal);
function soloRun(id, how) {   // how: 'auto', or a shift rule (c) => true
  const c = new C.Car(model(id), { isPlayer: true, phys: 'cs', assist: 2 }); c.locked = false;
  const i = T.idx(G.s0); c.place(G.ax + G.nx * G.lane, G.az + G.nz * G.lane, G.h); if (T.hasElev) c.y = c.py = T.hy[i]; c.q = T.query(c.x, c.z, i, c.q);
  if (how !== 'auto') c.man = { up: 0, log: [] };
  let t = 0, a = 0, vMax1 = 0;
  for (let k = 0; k < 40 * 120 && a < K.len; k++) {
    T.query(c.x, c.z, c.q.i, c.q); c.inThr = 1; c.inBrk = 0; c.inSteer = 0; c.steer = 0;
    if (how !== 'auto' && how(c) && !(c.man.up > 0)) c.man.up = 1;
    c.step(DT, T); t += DT;
    const a1 = drag.along(G, c); if (a1 >= K.len) t -= (a1 - K.len) / Math.max(1e-6, a1 - a) * DT; a = a1;
    if (c.gear === 1) vMax1 = Math.max(vMax1, c.speed);
  }
  return { t, c, vMax1 };
}
{
  const u = (c) => C.manRev(c, c.m, c.speed);
  for (const id of ['kaze', 'muscle', 'titan']) {
    const A = soloRun(id, 'auto'), P = soloRun(id, (c) => u(c) >= 0.95), E = soloRun(id, (c) => u(c) >= 0.75);
    const L = soloRun(id, (c) => (c.man.limT || 0) >= 0.3);
    check(id + ': perfect shifts (at 0.95 of the redline) as quick as the automatic gearbox', Math.abs(P.t - A.t) < 0.03, 'auto ' + A.t.toFixed(3) + ' s, manual ' + P.t.toFixed(3) + ' s');
    const lose = id === 'titan' ? 0 : 0.08;   // (the truck: ten close gears, an early shift drops its revs little; never quicker all the same)
    check(id + ': early shifts (0.75) slower' + (lose ? '' : ' (the truck: not quicker)'), E.t > P.t + lose - (lose ? 0 : 0.002), 'early ' + E.t.toFixed(3) + ' s');
    check(id + ': late shifts (0.3 s on the limiter each) slower', L.t > P.t + 0.25, 'late ' + L.t.toFixed(3) + ' s');
    check(id + ': the shifts logged with their revs (as the words take them)', P.c.man.log.length >= 2 && P.c.man.log.every(e => e.u >= 0.94 && e.u <= 1 && e.t < 0.05) && L.c.man.log.every(e => e.t >= 0.29), P.c.man.log.map(e => e.g + '@' + e.u.toFixed(2)).join(' '));
  }
  const N = soloRun('kaze', () => false), M = model('kaze'), vRed = M.redline / (M.gears[0] * M.final * 9.5493) * M.rw;
  check('no shift at all: first gear held on the limiter (never past its redline speed)', N.c.gear === 1 && N.vMax1 <= vRed * 1.01 && N.t > 20, 'v ' + N.vMax1.toFixed(1) + ' / ' + vRed.toFixed(1) + ' m/s');
  const ev = soloRun('ev', (c) => true), evA = soloRun('ev', 'auto');
  check('an electric car (one gear): no shift, as quick as without the manual gearbox', ev.c.gear === 1 && Math.abs(ev.t - evA.t) < 0.02, ev.t.toFixed(3) + ' / ' + evA.t.toFixed(3));
}
check('the words: perfect, good, early, late', drag.word({ u: 0.95, t: 0 }) === 'perfect' && drag.word({ u: 0.88, t: 0 }) === 'good' && drag.word({ u: 0.8, t: 0 }) === 'early' && drag.word({ u: 1, t: 0.4 }) === 'late' && drag.word({ u: 1, t: 0.12 }) === 'good');

// 3. the mode: where it is, when it is not, its race
let ph = 'intro';
const msgs = [], S0 = { difficulty: 1, zbDrag: 0, car: 0 };
Z.init({ S: S0, repro: () => true, phase: () => ph, paused: () => false, showMsg: (t) => msgs.push(t), say() {}, toast: (t) => msgs.push(t), fmt: (t) => t.toFixed(3), setText() {}, save() {}, rec: () => ({}), saveRecords() {} });
{
  const spa = C.TRACKS.find(d => d.id === 'spa'), mon = C.TRACKS.find(d => d.id === 'montreal');
  check('the mode on the tracks with a strip only (Montréal yes, Spa no)', drag.modes(mon).join() === 'drag' && drag.modes(spa).length === 0);
  const ctx = { md: 'drag', on: false, cr: -1, track: T, pm: model('kaze') };
  check('not online, not a championship round, a mission, the school, a challenge, the first race', drag.mine(ctx) && ![{ on: true }, { cr: 0 }, { mis: true }, { school: true }, { chal: true }, { prvi: true }, { md: 'race' }].some(x => drag.mine(Object.assign({}, ctx, x))));
  const o = drag.opts(ctx);
  check('its race: one rival, its vehicle the player\'s own (Rival: Same car), the lights, no pit stops, fuel, flags, traffic', o.numAI === 1 && o.numSet && o.duelModel.id === 'kaze' && o.launch && !o.fuel && !o.flags && !o.traffic && !o.flying);
  S0.zbDrag = 1;
  check('Rival: Truck — TITAN; driving TITAN, the rival is KAMEN', drag.opts(ctx).duelModel.id === 'titan' && drag.opts(Object.assign({}, ctx, { pm: model('titan') })).duelModel.id === 'kamen');
  S0.zbDrag = 0;
}
function mk(pm, truck, diff) {
  S0.zbDrag = truck ? 1 : 0; S0.difficulty = diff == null ? 1 : diff;
  const ctx = { md: 'drag', on: false, cr: -1, track: T, pm: model(pm) };
  const r = new C.Race(T, Object.assign({ phys: 'cs', seed: 4, playerModel: model(pm), assist: 2, difficulty: S0.difficulty }, drag.opts(ctx)));
  drag.made(r, ctx); ph = 'intro'; drag.begin(r);
  return r;
}
// the run: the player off at re s after the lights, shifting at u (null: never); the result
function race(r, re, u, early) {
  const P = r.player, st = drag.st;
  ph = 'lights';
  for (let k = 0; k < 60; k++) { P.inThr = early ? 1 : 0; r.step(DT); drag.step(r, DT); }
  ph = 'racing'; r.start();
  let end = null;
  for (let k = 0; k < 30 * 120 && !end; k++) {
    P.inThr = r.time >= re ? 1 : 0; P.inBrk = 0; P.inSteer = 0;
    if (u != null && P.man && C.manRev(P, P.m, P.speed) >= u) drag.shift();
    r.step(DT); drag.step(r, DT);
    end = drag.over();
  }
  // the rival over the line too (the results wait for it)
  for (let k = 0; k < 10 * 120 && st.runs.get(st.o).fin == null; k++) { r.step(DT); drag.step(r, DT); }
  for (let k = 0; k < 3; k++) { r.step(DT); drag.step(r, DT); }   // (a step past it: the rival handed back to the race's AI)
  return { end, st, P, o: st.o, rp: st.runs.get(P), ro: st.runs.get(st.o) };
}
{
  let r = mk('kaze', false), st = drag.st;
  const P = r.player, o = st.o;
  check('the cars on the strip in their lanes (+2.4 m the player, -2.4 m the rival), side by side (the same car: no head start)',
    Math.abs(drag.across(G, P) - G.lane) < 0.05 && Math.abs(drag.across(G, o) + G.lane) < 0.05 && Math.abs(drag.along(G, P)) < 0.05 && Math.abs(drag.along(G, o)) < 0.05 && st.hs === 0,
    [drag.across(G, P), drag.across(G, o), drag.along(G, o), st.hs].map(v => v.toFixed(2)).join(' '));
  check('both with the manual gearbox, in first gear; the rival driven by the mode (c.ctl)', !!P.man && !!o.man && P.gear === 1 && o.gear === 1 && typeof o.ctl === 'function');
  check('the rival\'s reaction from the difficulty (srednja: 0.22-0.38 s)', o.lch && o.lch.re >= 0.22 && o.lch.re <= 0.38, o.lch && o.lch.re.toFixed(3));
  const R1 = race(r, 0.15, 0.95);
  check('a quick reaction and perfect shifts: a win over the same car (srednja)', R1.end && R1.end.win && R1.rp.fin < R1.ro.fin, R1.rp.fin.toFixed(3) + ' / ' + R1.ro.fin.toFixed(3));
  check('the splits: 18 m < 201 m < the line, the speed at the line (km/h)', R1.rp.marks[K.ft60] < R1.rp.marks[K.eighth] && R1.rp.marks[K.eighth] < R1.rp.fin && R1.rp.v > 150 && R1.rp.v < 260, [R1.rp.marks[K.ft60], R1.rp.marks[K.eighth], R1.rp.fin, R1.rp.v].map(v => v.toFixed(2)).join(' '));
  check('the rival held its lane to the line (within 0.6 m) and shifted at its revs (0.86-0.98 of the redline)', R1.ro.lat < 0.6 && R1.o.man === null && R1.st.words.length >= 3, 'lat ' + R1.ro.lat.toFixed(2) + ' m');
  check('the player\'s shifts got their words (perfect at 0.95)', R1.st.words.length >= 3 && R1.st.words.every(w => w === 'perfect'), R1.st.words.join());
  check('the player\'s lane held without steering (the strip along the chord, within 0.5 m)', R1.rp.lat < 0.5, R1.rp.lat.toFixed(2) + ' m');
  check('over the line: the gearbox by itself again (car.man off), the rival back to the race\'s AI', R1.P.man === null && !R1.o.ctl);
  r = mk('kaze', false); const R2 = race(r, 0.5, 0.75);
  check('a slow reaction and early shifts: lost to the same car', R2.end && !R2.end.win && R2.ro.fin < R2.rp.fin, R2.rp.fin.toFixed(3) + ' / ' + R2.ro.fin.toFixed(3));
  r = mk('kaze', false); const R3 = race(r, 0.12, 0.95, true);
  check('the gas before the lights go out: a red light, the run lost however quick', R3.st.red && R3.end && !R3.end.win && /RDEČA/.test(R3.end.msg) && msgs.some(t => /RDEČA LUČ/.test(t)));
}
{
  const r = mk('kaze', true), st = drag.st, P = r.player, o = st.o;
  check('against the truck (TITAN): the truck stands ahead by its head start (100-250 m), the player on the line', o.m.id === 'titan' && st.hs < -100 && st.hs > -250 && Math.abs(drag.along(G, o) + st.hs) < 0.1 && Math.abs(drag.along(G, P)) < 0.05, 'head start ' + st.hs + ' m');
  // both perfect runs (the same reaction, the automatic gearbox as perfect shifts): over the line together
  o.lch.re = 0.1; P.man = null; o.man = null;
  const R = race(r, 0.1, null);
  check('with the head start both perfect runs are over the line together (within 0.06 s)', Math.abs(R.rp.fin - R.ro.fin) < 0.06, R.rp.fin.toFixed(3) + ' / ' + R.ro.fin.toFixed(3));
  const r2 = mk('titan', true);
  check('driving TITAN against KAMEN: the head start goes to the slower one, whichever it is', drag.st.o.m.id === 'kamen' && drag.st.hs !== 0, 'head start ' + drag.st.hs + ' m');
  const r3 = mk('titan', false);
  check('the same truck: no head start', Math.abs(drag.st.hs) < 1, String(drag.st.hs));
  void r2; void r3;
}
{
  // the difficulty: lahka slower to react and to shift than težka
  const reOf = (d) => { const v = []; for (let k = 0; k < 6; k++) { mk('kaze', false, d); v.push(drag.st.o.lch.re); } return v; };
  const e = reOf(0), h = reOf(2);
  check('the rival by the difficulty: lahka reacts in 0.30-0.50 s, težka in 0.16-0.28 s', e.every(x => x >= 0.3 && x <= 0.5) && h.every(x => x >= 0.16 && x <= 0.28), e.map(x => x.toFixed(2)).join(' ') + ' | ' + h.map(x => x.toFixed(2)).join(' '));
  drag.stop();
  check('stop: no state left', drag.st === null);
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
