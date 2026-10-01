// The rivals' characters (Race opts.chars; Core only, no browser): every AI driver has its own (aggressive or careful, cool or nervous),
// the same in every race; the player's standing rival (opts.rival) a touch quicker. In whole races on autopilot: a careful driver waits
// behind for room to pass (hardly ever alongside in a corner), an aggressive one goes for it there too; an aggressive one with a car close
// behind covers the inside before a braking zone, a careful one never; the pressure of a car close behind makes a driver get a braking
// zone wrong now and then (the nervous ones more), only under pressure; a duel with the player (within 25 m for 15 s) and its end; all
// to the line, the race as quick as without the characters. Off (the default): none of it (the golden references hold the rest).
//   node tests/rivals.test.js
'use strict';
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const track = (id) => new C.Track(C.TRACKS.find(d => d.id === id));
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : String(x));
const mk = (T, o) => { Math.random = seeded(o.rs || 11); const r = new C.Race(T, Object.assign({ numAI: 12, playerGrid: 7, laps: 3, playerModel: C.MODELS[4], assist: 2, phys: 'cs', seed: 5, difficulty: 1, damage: 1 }, o)); r.start(); return r; };
// a race to the end, the player on autopilot: per car the time alongside another in a corner, the defences, the mistakes (with the pressure
// then), the duel events
function run(r, sec) {
  const T = r.track, st = new Map(), ev = []; let t = 0;
  for (const c of r.cars) st.set(c, { cornerPass: 0, corner: 0, def: 0, mist: 0, pressAt: [] });
  while (t < sec && !r.cars.every(c => c.finished)) {
    C.aiControl(r.player, r, DT); r.step(DT); t += DT;
    for (const c of r.cars) {
      const s = st.get(c), ch = c.chr; if (!ch || r.state !== 'racing' || c.finished) continue;
      const vp = r.vprof, corner = vp[T.idx(c.q.s + 40)] < c.vl - 3;
      if (corner) { s.corner += DT; if (c.passing) s.cornerPass += DT; }
      if (ch.defT > 2.3 && !s.inDef) s.def++; s.inDef = ch.defT > 2.3;
    }
    if (r.chr) for (const e of r.chr.q.splice(0)) { ev.push({ k: e.k, c: e.c, t }); if (e.k === 'mistake') st.get(e.c).mist++; }   // (as the game takes them)
  }
  return { t, st, ev };
}

// 1. off: nothing; on: each driver its own character, the same in every race; the standing rival
{
  const T = track('jezero'), off = mk(T, {}), a = mk(T, { chars: true }), b = mk(T, { chars: true, playerGrid: 13, aiOrder: [5, 2, 9, 0, 11, 1, 7, 3, 10, 4, 8, 6], rival: 2 });
  check('off (the default): no characters, no events', !off.chr && off.cars.every(c => !c.chr), '');
  const byName = (r) => Object.fromEntries(r.cars.filter(c => c.chr).map(c => [c.name, c.chr.agg + '/' + c.chr.err]));
  const A = byName(a), B = byName(b), names = Object.keys(A);
  check('on: every rival its own character (aggressive or careful, cool or nervous), the same driver the same in another race; the player none', names.length === 12 && names.every(k => A[k] === B[k]) && !a.player.chr && new Set(Object.values(A)).size >= 10 && a.cars.some(c => c.chr && c.chr.agg >= 0.8) && a.cars.some(c => c.chr && c.chr.agg <= 0.3),
    names.slice(0, 6).map(k => k + ' ' + A[k]).join(', '));
  const rv = b.cars.find(c => c.chr && c.chr.rival), same = a.cars.find(c => c.name === (rv && rv.name));
  check('the standing rival (opts.rival): that driver marked, a touch quicker than in a race without it', rv && rv.name === C.DRIVER_NAMES[2] && b.cars.filter(c => c.chr && c.chr.rival).length === 1 && Math.abs(rv.skill - same.skill - 0.012) < 1e-9, rv && rv.name);
}

// 2. whole races: passing, defending, mistakes, duels
{
  const T = track('jezero'), R = [];
  for (const rs of [11, 23, 37]) { const r = mk(T, { chars: true, rs, difficulty: 2 }); R.push({ r, o: run(r, 500) }); }
  const cars = R.flatMap(x => x.r.cars.filter(c => c.chr).map(c => ({ c, s: x.o.st.get(c) })));
  const share = (f) => { const L = cars.filter(f); const a = L.reduce((q, x) => q + x.s.cornerPass, 0), b = L.reduce((q, x) => q + x.s.corner, 0); return b ? a / b : 0; };
  const careful = share(x => x.c.chr.agg < 0.4), aggr = share(x => x.c.chr.agg >= 0.7);
  check('passing: the careful drivers seldom go alongside into a corner (only when much quicker), the aggressive ones three times as often', aggr > careful * 3 && careful < 0.08, `alongside in the corners: careful ${f2(careful * 100)} %, aggressive ${f2(aggr * 100)} % of the time`);
  const defA = cars.filter(x => x.c.chr.agg >= 0.5).reduce((q, x) => q + x.s.def, 0), defC = cars.filter(x => x.c.chr.agg < 0.5).reduce((q, x) => q + x.s.def, 0);
  check('defending: with a car close behind before a braking zone the aggressive ones cover the inside, the careful ones hardly ever (in a duel with the player)', defA >= 5 && defC * 10 <= defA, `covered the inside ${defA} times (aggressive), ${defC} (careful)`);
  const mis = R.flatMap(x => x.o.ev.filter(e => e.k === 'mistake')), nerv = mis.filter(e => e.c.chr.err >= 0.5).length, cool = mis.filter(e => e.c.chr.err < 0.25).length;
  check('mistakes under pressure: now and then (a few a race) a driver with someone right behind gets a braking zone wrong, the nervous ones more than the cool ones', mis.length >= 3 && mis.length <= 24 && nerv > cool, `${mis.length} mistakes: ${nerv} by the nervous, ${cool} by the cool (${mis.map(e => e.c.name).join(', ')})`);
  const du = R.flatMap(x => x.o.ev.filter(e => e.k === 'duel')), de = R.flatMap(x => x.o.ev.filter(e => e.k === 'duelEnd'));
  check('a duel with the player (within 25 m for 15 s, not in the start\'s crowd) and its end, each duel ended once', du.length >= 1 && de.length === du.length && du.every(e => e.t > 40), `${du.length} duels (${du.map(e => e.c.name + ' at ' + f2(e.t) + ' s').join(', ')}), ${de.length} ended`);
  check('all to the line in every race', R.every(x => x.r.cars.every(c => c.finished)), R.map(x => f2(x.o.t) + ' s').join(', '));
  // the pace: the same as without the characters (the winner within 2 %)
  const r0 = mk(T, { rs: 11, difficulty: 2 }), o0 = run(r0, 500), w = (r) => Math.min(...r.cars.map(c => c.finishTime || Infinity));
  check('the race as quick as without the characters (the winner within 2 %)', Math.abs(w(R[0].r) / w(r0) - 1) < 0.02, `${f2(w(R[0].r))} s vs ${f2(w(r0))} s`);
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
