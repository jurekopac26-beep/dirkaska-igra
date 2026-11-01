// Zabava (docs/zabava.md), no browser: the system (js/zabava.js: the novelties on or off, the hooks) and each novelty's own rules
// (js/zabava/*.js) that need no game: the team's goals (which fit a race, reached or not, the pay).
//   node tests/zabava.test.js
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
global.window = { };   // (the novelties look for a test's switch in window.__zabava)
const Z = require(path.join(ROOT, 'js', 'zabava.js'));
global.Zabava = Z;
const cilji = require(path.join(ROOT, 'js', 'zabava', 'cilji.js'));

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };

// 1. the system: on by the settings for a player; off in the tests unless a test switches them on
{
  const S = { zbIzz: 1, zbCesta: 0 }; let rep = false;
  Z.init({ S, repro: () => rep });
  check('a player: a novelty on by its setting (1), off by it (0), on without a setting', Z.on('izzivi', 'zbIzz') && !Z.on('cesta', 'zbCesta') && Z.on('x'));
  rep = true;
  check('the test mode (the quick entry): off, whatever the setting', !Z.on('izzivi', 'zbIzz') && !Z.on('x'));
  window.__zabava = { izzivi: 1 };
  check('a test switches one on (window.__zabava = { izzivi: 1 }): that one only', Z.on('izzivi', 'zbIzz') && !Z.on('cesta', 'zbCesta'));
  window.__zabava = true;
  check('window.__zabava = true: all on, even one its setting has off', Z.on('izzivi', 'zbIzz') && Z.on('cesta', 'zbCesta'));
  delete window.__zabava; rep = false;
  check('the novelties are registered (cilji)', Z.list.some(f => f.id === 'cilji'));
  check('no race: the hooks do nothing (over null, hold false, cls empty, resPay empty)', Z.over() === null && Z.hold() === false && Z.cls({}) === '' && Z.resPay({}) === '');
}

// 2. the team's goals
{
  const G = cilji.GOALS, by = (k) => G.find(g => g.k === k);
  const x22 = { grid: 22, n: 22, laps: 3, open: false, duel: false }, xUp = { grid: 22, n: 22, laps: 1, open: true, duel: false }, xDuel = { grid: 2, n: 2, laps: 1, open: true, duel: true };
  const ks = (x) => G.filter(g => g.ok(x)).map(g => g.k).sort().join(',');
  check('a circuit race from last of 22: places, barrier, scratch, podium, win, from last, fastest lap fit', ks(x22) === 'krog,mesta,ograja,praska,stopnicke,zadnji,zmaga', ks(x22));
  check('a race up an open road: no fastest lap (one run)', ks(xUp).indexOf('krog') < 0 && ks(xUp).indexOf('mesta') >= 0, ks(xUp));
  check('the duel in the traffic (2 cars): the win by 10 s fits, places and podium do not', ks(xDuel).indexOf('prednost') >= 0 && ks(xDuel).indexOf('mesta') < 0 && ks(xDuel).indexOf('stopnicke') < 0, ks(xDuel));
  let r = 0; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const L = cilji.pick(x22, rnd);
  check('three goals to choose, all different, easiest first', L.length === 3 && new Set(L.map(g => g.k)).size === 3 && L[0].bonus <= L[1].bonus && L[1].bonus <= L[2].bonus, L.map(g => g.k + ' ' + g.bonus).join(', '));
  const m = by('mesta');
  check('places: the number by the grid (22nd: 9, 6th: 3), its text says it', m.need(x22) === 9 && m.need({ grid: 6 }) === 3 && /9/.test(m.text(x22)), m.text(x22));
  const s0 = { wall: false, car: false }, sW = { wall: true, car: false }, sC = { wall: false, car: true };
  check('places: 22nd to 13th reaches 9, to 14th does not; a retirement never', m.done({ pos: 13, grid: 22, out: false }, x22) && !m.done({ pos: 14, grid: 22, out: false }, x22) && !m.done({ pos: 1, grid: 22, out: true }, x22));
  check('the barrier: clean reaches it, one touch misses it (dead at once), a car touch does not matter', by('ograja').done({ out: false }, x22, s0) && !by('ograja').done({ out: false }, x22, sW) && by('ograja').dead(sW) && by('ograja').done({ out: false }, x22, sC));
  check('no scratch: the barrier or a car both miss it', by('praska').done({ out: false }, x22, s0) && !by('praska').done({ out: false }, x22, sC) && by('praska').dead(sC) && by('praska').dead(sW));
  check('podium, win, from last: by the place', by('stopnicke').done({ pos: 3 }) && !by('stopnicke').done({ pos: 4 }) && by('zmaga').done({ pos: 1 }) && !by('zmaga').done({ pos: 2 }) && by('zadnji').done({ pos: 1 }));
  check('the fastest lap: the race\'s (fl)', by('krog').done({ out: false, fl: true }) && !by('krog').done({ out: false, fl: false }));
  check('the win by 10 s: 10.5 s ahead yes, 9 s no, second no', by('prednost').done({ pos: 1, res: [{ time: 100 }, { time: 110.5 }] }) && !by('prednost').done({ pos: 1, res: [{ time: 100 }, { time: 109 }] }) && !by('prednost').done({ pos: 2, res: [{ time: 100 }, { time: 120 }] }));
  // the pay at the finish: the goal's share of the place's prize (rounded to 100 EUR) through the career's pay; missed: one line, no money
  let paid = 0; const Gm = { stRun: () => s0, careerPay: (sum, what) => { paid += sum; return ' ' + what + ': +' + sum; }, phase: () => 'racing', showMsg() {}, toast() {} };
  Z.init(Object.assign({ S: {}, repro: () => false }, Gm));
  cilji.goal = by('zmaga'); cilji.x = x22;
  const t1 = cilji.resPay(null, { pos: 1, n: 22, out: false, prize: 6000, fl: false, grid: 22, res: [] });
  check('reached (a win, 6000 EUR prize, +50 %): 3000 EUR more through careerPay', paid === 3000 && /Cilj ekipe: \+3000/.test(t1), t1);
  const t2 = cilji.resPay(null, { pos: 2, n: 22, out: false, prize: 4500, fl: false, grid: 22, res: [] });
  check('missed (second): no money, the line says it was missed', paid === 3000 && /Cilj ekipe ni uspel/.test(t2), t2);
  cilji.goal = null;
  check('no goal chosen: nothing in the results', cilji.resPay(null, { pos: 1, prize: 6000 }) === '');
  // which races get the card
  const race = (o) => Object.assign({ cars: new Array(22), player: { grid: 22 }, laps: 3, track: { open: false }, timeTrial: false, quali: false, pol: null, chal: null, tf: null }, o);
  const ctx = (o) => Object.assign({ career: true, on: false, tt: false, quali: false, chal: false, school: false, nv: false, mis: false }, o);
  check('the card: a career race against rivals yes; outside the career, online, a time trial, qualifying, a mission, the driving school, the run from the police, the pursuit no',
    cilji.fits(race(), ctx()) && !cilji.fits(race(), ctx({ career: false })) && !cilji.fits(race(), ctx({ on: true })) && !cilji.fits(race({ timeTrial: true }), ctx({ tt: true })) && !cilji.fits(race({ quali: true }), ctx({ quali: true })) &&
    !cilji.fits(race(), ctx({ mis: true })) && !cilji.fits(race(), ctx({ school: true })) && !cilji.fits(race({ pol: {} }), ctx()) && !cilji.fits(race({ zbLov: true }), ctx()));
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
