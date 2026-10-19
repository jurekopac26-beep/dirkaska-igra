// The phone's vibration in the pits (Core only, no browser; the patterns played in a real stop: tests/browser/haptics.test.mjs).
// Core.HAPTIC, the pattern table: every moment of a pit stop its own pattern (each different), as navigator.vibrate takes it (on, off,
// on … ms; every pulse long enough for a cheap phone's motor to feel, the pauses too, each pattern short); its priority and level (the
// basic ones: the stop, the release, the hand-back; the hand-back the strongest of all). Core.CREW_U: the crew's moments as render.js
// crewLogic draws them. Core.Haptic, the queue on the race's clock: one pattern at a time, one that matters more cuts in, one that matters
// as much or less waits (the more important first), not too long, pri 1 never waits, off empties it. Then stops of 1.2 s (repairs only),
// 2.6 s (tyres), 6 and 10.6 s (fuel) with the moments where crewLogic puts them: every moment's pattern played, in order, one at a time,
// none more than HAP_LATE late, the rattle only on the long stops; on the short one no jacks or wheels (min).
//   node tests/haptics.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCore, ROOT } = require('./lib/core.js');

const C = loadCore();
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const H = C.HAPTIC, sum = (p) => p.reduce((a, b) => a + b, 0), pulses = (p) => p.filter((v, i) => i % 2 === 0), gaps = (p) => p.filter((v, i) => i % 2 === 1);

// 1. the table
const NAMES = ['pitLine', 'pitAP', 'pitLimit', 'pitBox', 'pitStop', 'jackF', 'jackR', 'gunOff', 'wheelsOn', 'gunOn', 'rattle', 'dropR', 'dropF',
  'go', 'goFuel', 'goCharge', 'tick', 'handBack', 'rejoin', 'rivalPass', 'lostPlace', 'choice'];
{
  const ks = Object.keys(H), miss = NAMES.filter(k => !H[k]), extra = ks.filter(k => !NAMES.includes(k));
  check('every moment of a pit stop has its pattern (the line, the autopilot, the limiter, the box, the stop, each jack, the guns off and on, the wheels, the rattle, each end let down, the releases, the countdown, the hand-back, the rejoin, a rival passing, a lost place, the repair choice)',
    !miss.length && !extra.length, `${ks.length} patterns${miss.length ? ', missing ' + miss.join(' ') : ''}${extra.length ? ', not checked ' + extra.join(' ') : ''}`);
  const shape = ks.filter(k => { const p = H[k].p; return !Array.isArray(p) || !p.length || p.length % 2 !== 1 || p.length > 99 || !p.every(v => Number.isInteger(v) && v > 0 && v <= 10000); });
  check('each a navigator.vibrate pattern: whole ms, on and off by turns, ending on a pulse (at most 99 entries, 10 s each)', !shape.length, shape.join(' '));
  const weak = ks.filter(k => Math.min(...pulses(H[k].p)) < 20 || (gaps(H[k].p).length && Math.min(...gaps(H[k].p)) < 25));
  check('every pulse 20 ms or more (a cheap phone\'s motor feels it), every pause 25 ms or more (the pulses felt apart)', !weak.length, weak.map(k => k + ' ' + JSON.stringify(H[k].p)).join(', '));
  const long = ks.filter(k => sum(H[k].p) > 400);
  check('each short (at most 0.4 s: the next moment of the stop is not covered)', !long.length, ks.map(k => k + ' ' + sum(H[k].p)).join(', '));
  const seen = new Map(), same = []; for (const k of ks) { const j = JSON.stringify(H[k].p); if (seen.has(j)) same.push(seen.get(j) + '=' + k); seen.set(j, k); }
  check('each moment feels different (no two patterns alike)', !same.length, same.join(' '));
  const pl = ks.filter(k => !(Number.isInteger(H[k].pri) && H[k].pri >= 1 && H[k].pri <= 5 && (H[k].lv === 1 || H[k].lv === 2)));
  check('each with a priority 1-5 and a level (1 basic, 2 the rest)', !pl.length, pl.join(' '));
  const basic = ks.filter(k => H[k].lv === 1).sort().join(' ');
  check('the basic ones (a setting of the basic ones alone would keep these): the stop, the releases, the hand-back, the repair choice', basic === 'choice go goCharge goFuel handBack pitStop', basic);
  const top = ks.filter(k => H[k].pri === 5), maxP = Math.max(...ks.map(k => Math.max(...pulses(H[k].p))));
  check('VOZIŠ TI! the strongest: the only priority 5, the longest pulse of all', top.join() === 'handBack' && H.handBack.p[0] === maxP && ks.filter(k => k !== 'handBack').every(k => Math.max(...pulses(H[k].p)) < maxP), JSON.stringify(H.handBack));
  check('the stop, the car let down and the releases above the crew\'s work (4), the crew\'s work above the way in and out (3 > 2); pri 1 only the rattle, the countdown and a rival passing',
    ['pitStop', 'dropR', 'dropF', 'go', 'goFuel', 'goCharge'].every(k => H[k].pri === 4) && ['jackF', 'jackR', 'gunOff', 'wheelsOn', 'gunOn'].every(k => H[k].pri === 3) &&
      ['pitLine', 'pitAP', 'pitLimit', 'pitBox', 'rejoin', 'lostPlace'].every(k => H[k].pri === 2) && ks.filter(k => H[k].pri === 1).sort().join(' ') === 'rattle rivalPass tick', ks.map(k => k + ' ' + H[k].pri).join(', '));
  const four = (p) => pulses(p).slice(0, 4).every(v => v === p[0]) && gaps(p).slice(0, 3).every(v => v === p[1]);
  check('the guns: four equal bursts undoing the nuts; doing them up, four bursts and then the last torque (a longer pulse)',
    pulses(H.gunOff.p).length === 4 && four(H.gunOff.p) && pulses(H.gunOn.p).length === 5 && four(H.gunOn.p) && H.gunOn.p[H.gunOn.p.length - 1] > H.gunOn.p[0], JSON.stringify({ off: H.gunOff.p, on: H.gunOn.p }));
  const rise = (p) => pulses(p).every((v, i, a) => !i || v > a[i - 1]);
  check('the releases: with a full tank a pulse more than the plain one, with a charged battery rising; braking into the box rising',
    pulses(H.goFuel.p).length === pulses(H.go.p).length + 1 && H.goFuel.p[H.goFuel.p.length - 1] === H.go.p[H.go.p.length - 1] && rise(H.goCharge.p) && rise(H.pitBox.p.filter((v, i) => i !== 4)) && sum(H.goCharge.p) > sum(H.go.p) - 60,
    JSON.stringify({ go: H.go.p, fuel: H.goFuel.p, charge: H.goCharge.p, box: H.pitBox.p }));
  check('the jacks and the new wheels only on a stop of 2 s or more (on a shorter one the moments come too close together)', ['jackF', 'jackR', 'wheelsOn'].every(k => H[k].min === 2) && NAMES.filter(k => H[k].min).length === 3, NAMES.filter(k => H[k].min).join(' '));
}

// 2. the crew's moments (Core.CREW_U) as render.js crewLogic draws them
{
  const src = fs.readFileSync(path.join(ROOT, 'js', 'render.js'), 'utf8'), a = src.indexOf('function crewLogic('), b = src.indexOf('\n  function ', a + 10), body = src.slice(a, b), U = C.CREW_U;
  const nut = `(u > ${U.nut[0][0]} && u < ${U.nut[0][1]}) || (u > ${U.nut[1][0]} && u < ${U.nut[1][1]})`;
  check('Core.CREW_U as crewLogic draws the crew: the guns on the nuts (off, on), the rear end let down, then the front',
    a > 0 && body.includes(nut) && body.includes(`u < ${U.drop[0]} ? CR_B1`) && body.includes(`u < ${U.drop[1]} ? CR_B1`) && U.drop[1] < U.drop[0] && U.nut[1][0] > C.REPAIR.wheel && U.nut[0][1] < C.REPAIR.wheel,
    JSON.stringify(U));
}

// 3. the queue (Core.Haptic) on the race's clock
const STEP = 1 / 120, LATE = 0.35, GAP = 0.04, len = (k) => sum(H[k].p) / 1000;
{
  const Q = C.Haptic(), log = [], go = (e) => { if (e) log.push([e.k, +Q.t.toFixed(3)]); }, buzz = (k) => go(Q.buzz(k, H[k].p, H[k].pri)), run = (s) => { for (let t = 0; t < s - 1e-9; t += STEP) go(Q.step(STEP)); };
  buzz('pitStop'); const a = log.length; buzz('jackF'); const b = log.length, w = Q.waiting.slice();
  run(0.2); const c = log.slice();
  check('idle: a pattern starts at once; one as important or less waits for it and starts once it has ended (and a short pause)',
    a === 1 && b === 1 && w.join() === 'jackF' && c.length === 2 && c[1][0] === 'jackF' && c[1][1] >= len('pitStop') + GAP - 1e-9 && c[1][1] < len('pitStop') + GAP + STEP + 1e-9, JSON.stringify(c));
  log.length = 0; buzz('handBack'); const d = log.slice(); buzz('rivalPass'); run(0.4); const e = log.slice();
  check('one that matters more cuts in at once (VOZIŠ TI! over a jack); one of pri 1 is dropped while another plays, never waits', d.length === 1 && d[0][0] === 'handBack' && e.length === 1, JSON.stringify(e));
  buzz('rivalPass'); check('pri 1 plays when nothing else does', log.length === 2 && log[1][0] === 'rivalPass');
  run(0.3); log.length = 0; buzz('dropR'); buzz('rejoin'); buzz('jackR'); buzz('dropF'); run(1);
  check('those waiting: the more important first, the same in the order they came; each starts once the one before has ended (and a short pause)',
    log.map(e => e[0]).join() === 'dropR,dropF,jackR' && log.every((e, i) => !i || (e[1] >= log[i - 1][1] + len(log[i - 1][0]) + GAP - 1e-9 && e[1] < log[i - 1][1] + len(log[i - 1][0]) + GAP + STEP + 1e-9)), JSON.stringify(log));
  // (the jack waited 0.32 s, behind both ends let down; the rejoin would have waited longer than HAP_LATE)
  check('one that would wait longer than HAP_LATE is dropped (its moment gone)', !log.some(e => e[0] === 'rejoin') && Q.n.drop === 2 && !Q.waiting.length, JSON.stringify({ log, n: Q.n }));
  run(1); log.length = 0; buzz('go'); buzz('jackF'); const busy = Q.busy, off = Q.off(), off2 = Q.off(); run(1);
  check('off (the pause, the page hidden, the setting off, the race\'s end, the replay): the one playing and those waiting gone; true only while one played or waited', busy && off && !off2 && !Q.busy && log.length === 1, JSON.stringify({ log, off, off2 }));
}

// 4. stops as the game sees them: the moments where crewLogic puts them (the front jack as the car stops, the rear one's man dashes in),
// the way in before, the hand-back and the rejoin after; the queue stepped as the race is
const U = C.CREW_U;
function stop(D, fuel) {
  const ev = [['pitAP', -9], ['pitLimit', -9], ['pitBox', -3], ['pitStop', 0]];
  if (D >= 2) ev.push(['jackF', 0.05], ['jackR', Math.max(0.45, U.jack[1] * D)], ['wheelsOn', C.REPAIR.wheel * D]);
  for (let w = 0; w < 2; w++) { const [a, b] = U.nut[w]; ev.push([w ? 'gunOn' : 'gunOff', a * D + 0.01]); for (let t = a * D + 0.46; t < b * D; t += 0.35) ev.push(['rattle', t]); }
  ev.push(['dropR', U.drop[1] * D + 0.03], ['dropF', U.drop[0] * D + 0.03], [fuel ? 'goFuel' : 'go', D], ['handBack', D + 8], ['rejoin', D + 9]);
  ev.sort((a, b) => a[1] - b[1]);
  const Q = C.Haptic(), log = [], t0 = -10; let i = 0;
  for (let t = t0; t < D + 10; t += STEP) {
    const e0 = Q.step(STEP); if (e0) log.push([e0.k, Q.t + t0, e0.pri]);
    while (i < ev.length && ev[i][1] <= Q.t + t0 + 1e-9) { const [k] = ev[i++]; if (H[k].min > D) continue; const e = Q.buzz(k, H[k].p, H[k].pri); if (e) log.push([e.k, Q.t + t0, e.pri]); }
  }
  const want = ev.filter(e => !(H[e[0]].min > D)), main = want.filter(e => e[0] !== 'rattle'), got = log.filter(e => e[0] !== 'rattle');
  const late = Math.max(...got.map(g => g[1] - (main.find(e => e[0] === g[0]) || [0, g[1]])[1]));
  const one = log.every((e, j) => !j || e[2] > log[j - 1][2] || e[1] >= log[j - 1][1] + len(log[j - 1][0]) + GAP - 1e-9);
  const motor = log.filter(e => e[1] >= -1e-9 && e[1] <= D + 0.5).reduce((a, e) => a + pulses(H[e[0]].p).reduce((x, y) => x + y, 0), 0);
  return { D, ok: got.map(e => e[0]).join() === main.map(e => e[0]).join(), late, one, rattle: log.filter(e => e[0] === 'rattle').length, jacks: log.filter(e => /^jack|^wheels/.test(e[0])).length, motor, seq: got.map(e => e[0] + '@' + e[1].toFixed(2)) };
}
{
  const S = [stop(1.2), stop(2.6), stop(6, true), stop(10.6, true)], f2 = (x) => x.toFixed(2);
  check('a stop of 1.2, 2.6, 6 or 10.6 s: every moment\'s pattern played, in order', S.every(s => s.ok), S.filter(s => !s.ok).map(s => s.D + ' s: ' + s.seq.join(' ')).join(' | ') || S.map(s => s.D + ' s ' + s.seq.length).join(', '));
  check('one at a time (each after the one before has ended, or cutting in with a higher priority), none more than HAP_LATE late', S.every(s => s.one && s.late <= LATE + STEP), S.map(s => `${s.D} s: at most ${f2(s.late)} s late`).join(', '));
  check('the 1.2 s stop (repairs only): no jacks or new wheels felt; the longer ones: both jacks and the wheels', S[0].jacks === 0 && S.slice(1).every(s => s.jacks === 3), S.map(s => s.D + ' s ' + s.jacks).join(', '));
  check('the guns\' rattle only on the long stops (the guns on the nuts longer than their bursts)', S[0].rattle === 0 && S[1].rattle === 0 && S[2].rattle > 0 && S[3].rattle > S[2].rattle, S.map(s => s.D + ' s ' + s.rattle).join(', '));
  check('the motor on for at most ~1.5 s of a stop (pulses only)', S.every(s => s.motor <= 1500), S.map(s => `${s.D} s ${s.motor} ms`).join(', '));
}

console.log(`\n${n - bad}/${n} checks passed`);
process.exit(bad ? 1 : 0);
