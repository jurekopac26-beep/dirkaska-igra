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
const elim = require(path.join(ROOT, 'js', 'zabava', 'elim.js'));
const spomin = require(path.join(ROOT, 'js', 'zabava', 'spomin.js'));
const { loadCore } = require('./lib/core.js');
const { DT, seeded } = require('./lib/sim.js');
const C = loadCore();

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

// 3. the elimination race: the rule, then a real race (Bathurst, 22 cars, the player on the autopilot) through two cuts, then the
// remaining cuts one after another to the end
{
  check('the cut: a twelfth of the field (22: 2, 100: 9, 12: 1, 6: 1), never the last one left', elim.cutN(22, 22) === 2 && elim.cutN(100, 100) === 9 && elim.cutN(12, 12) === 1 && elim.cutN(6, 6) === 1 && elim.cutN(22, 2) === 1 && elim.cutN(22, 1) === 0);
  check('22 cars: 11 cuts, the last at 345 s (about 6 min); 100 cars: 11 cuts of 9', elim.cutsOf(22) === 11 && elim.lastCut(22) === 345 && elim.cutsOf(100) === 11, elim.cutsOf(22) + ' ' + elim.lastCut(22) + ' ' + elim.cutsOf(100));
  check('the laps of a circuit: enough for the cuts (Bathurst 6.2 km: 4 laps at 40 m/s, a 2 km track more), never under 3', elim.lapsFor(6213, 22) === 3 || elim.lapsFor(6213, 22) === 4 ? elim.lapsFor(2000, 22) > elim.lapsFor(6213, 22) && elim.lapsFor(50000, 22) === 3 : false, elim.lapsFor(6213, 22) + ' ' + elim.lapsFor(2000, 22));
  check('the mode: wherever a race is (a circuit, Vršič), not on a time trial only (Harju)', elim.modes({}, ['race']).join() === 'elim' && elim.modes({}, ['race', 'tt', 'traffic']).join() === 'elim' && elim.modes({}, ['tt']).length === 0);
  const ctxE = { md: 'elim', on: false, cr: -1, mis: false, school: false, chal: false, nv: false, tt: false, nAI: 21 };
  check('its options: the player in the middle of the grid, no fuel, no radio; not online, not a championship round, not a mission', elim.opts(Object.assign({ track: { open: false, len: 6213 } }, ctxE)).playerGrid === 11 && elim.opts(Object.assign({ track: { open: false, len: 6213 } }, ctxE)).fuel === false &&
    elim.opts(Object.assign({ track: { open: true } }, ctxE)).laps === undefined && !elim.opts(Object.assign({ track: {} }, ctxE, { on: true })) && !elim.opts(Object.assign({ track: {} }, ctxE, { cr: 0 })) && !elim.opts(Object.assign({ track: {} }, ctxE, { mis: true })));
  const orig = Math.random; Math.random = seeded(7);
  const T = new C.Track(C.TRACKS.find(d => d.id === 'bathurst')), o = elim.opts(Object.assign({ track: T.def.open ? { open: true } : { open: false, len: T.len } }, ctxE));
  const r = new C.Race(T, Object.assign({ numAI: 21, laps: 3, phys: 'cs', seed: 5, playerModel: C.MODELS[4], assist: 2, difficulty: 1, damage: 2, chars: true }, o)), P = r.player;
  let msgs = []; Z.init({ S: {}, repro: () => false, phase: () => 'racing', setText() {}, showMsg: (t) => msgs.push(t), fmt: (t) => t.toFixed(1) });
  elim.made(r, ctxE); elim.begin(r);
  check('the race: 22 cars, the player 11th on the grid, the mode elim, the results by the elimination', r.cars.length === 22 && P.grid === 11 && r.zbMode === 'elim' && r.estimateResults !== C.Race.prototype.estimateResults);
  for (let t = 0; t < 1; t += DT) r.step(DT);
  r.start();
  const snaps = [];
  for (let k = 0; k < 80 * 120; k++) {
    C.aiControl(P, r, DT); r.step(DT);
    const before = elim.st.cuts; elim.step(r, DT);
    if (elim.st.cuts > before) snaps.push({ t: r.time, out: r.cars.filter(c => c.zbOut).length, retired: r.cars.filter(c => c.zbOut && c !== P).every(c => r.isOut(c)) });
    if (k === 60 * 120) snaps.danger = [...elim.st.danger];
  }
  Math.random = orig;
  check('the first cut at 45 s: 2 cars out, the second at 75 s: 4 out; the AI cars out pull off (retired)', snaps.length === 2 && Math.abs(snaps[0].t - 45) < 0.05 && snaps[0].out === 2 && Math.abs(snaps[1].t - 75) < 0.05 && snaps[1].out === 4 && snaps.every(x => x.retired) || snaps.some(x => x.out && P.zbOut), JSON.stringify(snaps));
  const A = elim.alive(r), dz = snaps.danger || [];
  check('between the cuts: the last 2 cars still in are the ones in danger (their rows red)', dz.length === 2 && dz.every(c => elim.cls(c) === ' zb-out' || c.zbOut), dz.map(c => c.name).join(', '));
  // the rest of the cuts, one after another (no driving): to the player out or the last one left
  let guard = 0; while (!elim.st.end && guard++ < 30) elim.cut(r, elim.alive(r));
  const end = elim.over(r), res = r.estimateResults(), pi = res.findIndex(x => x.car === P);
  check('the end: the player out (IZPADEL SI with the place) or the last one left (ZMAGA)', !!end && (P.zbOut ? /IZPADEL SI! \d+\. MESTO/.test(end.msg) : /ZMAGA/.test(end.msg)), end && end.msg);
  check('the results: every car once, those still in first, then those out with the last to go first; the player at the place said', res.length === 22 && new Set(res.map(x => x.car)).size === 22 &&
    res.every((x, i) => i === 0 || !(res[i - 1].car.zbOut && !x.car.zbOut)) && res.filter(x => x.car.zbOut).every((x, i, L) => i === 0 || L[i - 1].car.zbT >= x.car.zbT) && (!P.zbOut || new RegExp('! ' + (pi + 1) + '\\. MESTO').test(end.msg)), 'player ' + (pi + 1) + ' ' + (end && end.msg));
  check('the timing tower: a car out says IZPADEL', res.filter(x => x.car.zbOut).every(x => elim.outWord(x.car) === 'IZPADEL'));
  check('over() only once', elim.over(r) === null);
  elim.stop();
}

// 4. the elimination race online: the host decides the cuts and sends them, each phone applies them (no network: two phones faked)
{
  const mk = (role, me) => {
    const sent = [], fin = [], P = { isPlayer: true, dist: 300, zbOut: false, finished: false, name: 'Ti' };
    const cars = [P, { id: 'a', dist: 200 }, { id: 'b', dist: 100 }, { id: 'h', dist: 250 }].filter(c => c === P || c.id !== me).map(c => c === P ? c : Object.assign({ netOf: { id: c.id }, name: c.id, finished: false }, c));
    const race = { cars, remotes: cars.filter(c => !c.isPlayer), player: P, time: 0, track: { open: false, len: 3000 }, laps: 2, isOut: (c) => !!c.finished, zbMode: null };
    const mp = { role, me, race: { no: 7, mine: null }, setup: null };
    const G = { S: {}, repro: () => false, phase: () => 'racing', setText() {}, showMsg() {}, fmt: (t) => String(t), mp: () => mp, finishOf: (id, t) => { fin.push([id, t]); const c = cars.find(x => x.netOf && x.netOf.id === id); if (c) c.finished = true; }, netClock: () => 123.4 };
    return { sent, fin, P, race, mp, G };
  };
  const H = mk('host', 'h'), sentAll = [];
  global.Net = { ids: ['a', 'b'], sendTo: (id, m) => sentAll.push([id, m]) };
  Z.init(H.G); elim.net.on = true;
  elim.made(H.race, { on: true }); elim.begin(H.race);
  check('online with the room\'s switch: the elimination race (zbNet), the laps by the track and the grid (3 km, 3 cars: more than 2)', H.race.zbMode === 'elim' && H.race.zbNet === true && H.race.laps === elim.lapsFor(3000, 3) && elim.st.host === true, H.race.laps + ' ' + JSON.stringify({ host: elim.st.host }));
  H.race.time = 45.01; elim.step(H.race);
  const m1 = sentAll.length && sentAll[0][1];
  check('the host at 45 s: the last car out, sent to both friends ({ t: zb, k: cut, ids: [b] }), its finish 100000 s less 45 s', sentAll.length === 2 && m1.k === 'cut' && m1.ids.join() === 'b' && m1.no === 7 && H.fin.length === 1 && H.fin[0][0] === 'b' && Math.abs(H.fin[0][1] - 99954.99) < 0.01, JSON.stringify(sentAll.map(x => x[1])) + ' ' + JSON.stringify(H.fin));
  H.race.time = 75.01; elim.step(H.race);
  const end = elim.over(H.race);
  check('the second cut (a): the host is the last one left, the win, its time on the shared clock', H.fin.length === 2 && H.fin[1][0] === 'a' && H.mp.race.mine === 123.4 && end && /ZMAGA/.test(end.msg), JSON.stringify({ fin: H.fin, mine: H.mp.race.mine, end }));
  elim.stop();
  // a friend's phone (b): the host's cut with b in it ends its race, its own finish 100000 s less the time it went out
  const B = mk('guest', 'b');
  Z.init(B.G); elim.net.on = false;
  elim.net({ t: 'zb', k: 'el', on: 1 }, 'h', false, null);
  check('a friend: the host\'s switch arrives (on)', elim.net.on === true);
  elim.made(B.race, { on: true }); elim.begin(B.race);
  B.race.time = 46;
  elim.net({ t: 'zb', k: 'cut', no: 7, ids: ['b'], at: 45.01, left: 2 }, 'h', false, B.race);
  const e2 = elim.over(B.race);
  check('a friend out: its race over (IZPADEL SI! 3. MESTO), its finish 99954.99 for the results, the countdown to the next cut at 75 s', B.P.zbOut && Math.abs(B.mp.race.mine - 99954.99) < 0.01 && e2 && /IZPADEL SI! 3\. MESTO/.test(e2.msg) && Math.abs(elim.st.next - 75.01) < 0.01, JSON.stringify({ mine: B.mp.race.mine, e2 }));
  elim.net({ t: 'zb', k: 'cut', no: 6, ids: ['a'], at: 75 }, 'h', false, B.race);
  check('a cut of another race (no) is not applied; a friend\'s own messages never decide (host flag)', !B.race.cars.find(c => c.netOf && c.netOf.id === 'a').zbOut);
  elim.stop(); elim.net.on = false; delete global.Net;
}

// 5. the rivals who remember: who caused a knock (Core: carCollide → grudgeHit), the game's side (the mark, the championship's memory)
{
  const T = new C.Track(C.TRACKS.find(d => d.id === 'rbring'));
  const mkRace = () => { const r = new C.Race(T, { numAI: 1, playerGrid: 2, laps: 2, phys: 'cs', seed: 3, playerModel: C.MODELS[4], chars: true, assist: 2 }); r.start(); return r; };
  // two cars on the start straight, one right behind the other (their bodies just touching), the one behind 6 m/s quicker; or the one
  // behind beside the other's rear wheel, turned into its side
  const stage = (r, back, front, side) => {
    const i = 40, h = Math.atan2(T.pz[i + 1] - T.pz[i], T.px[i + 1] - T.px[i]), fx = Math.cos(h), fz = Math.sin(h), nx = -fz, nz = fx;
    const put = (c, along, lat, v, vlat) => { c.place(T.px[i] + fx * along + nx * lat, T.pz[i] + fz * along + nz * lat, h); c.vx = fx * v + nx * (vlat || 0); c.vz = fz * v + nz * (vlat || 0); c.w = 0; };
    if (side) { put(front, 0, 0, 14); back.place(T.px[i] - fx * 2 + nx * 1.6, T.pz[i] - fz * 2 + nz * 1.6, h - 0.5); back.vx = Math.cos(h - 0.5) * 18; back.vz = Math.sin(h - 0.5) * 18; back.w = 0; }
    else { put(front, (back.m.len + front.m.len) * 0.5 - 0.25, 0, 14); put(back, 0, 0, 20); }
    return C.carCollide(back, front);
  };
  let r = mkRace(), P = r.player, o = r.cars.find(c => !c.isPlayer);
  stage(r, P, o);
  check('without the game switching it on (chr.zbG): a knock into its tail leaves no grudge (the tests\' races as before)', !(o.chr.zbMad > 0) && o.hitCar > 0, 'hit ' + o.hitCar.toFixed(2));
  r = mkRace(); P = r.player; o = r.cars.find(c => !c.isPlayer); o.chr.zbG = true;
  stage(r, P, o);
  check('the player into an AI car\'s tail: it is angry (zbMad 0.3 or more), its respect back to 0', o.chr.zbMad >= 0.3 && o.chr.zbR === 0, 'mad ' + o.chr.zbMad + ' hit ' + o.hitCar.toFixed(2));
  r = mkRace(); P = r.player; o = r.cars.find(c => !c.isPlayer); o.chr.zbG = true;
  stage(r, o, P);
  check('the AI car into the player\'s tail: no grudge (its own fault)', !(o.chr.zbMad > 0) && P.hitCar > 0, 'hit ' + P.hitCar.toFixed(2));
  r = mkRace(); P = r.player; o = r.cars.find(c => !c.isPlayer); o.chr.zbG = true;
  stage(r, P, o, true);
  check('the player\'s nose into its side: angry', o.chr.zbMad >= 0.3, 'mad ' + o.chr.zbMad + ' hit ' + o.hitCar.toFixed(2));
  // the game's side
  const told = [];
  Z.init({ S: {}, repro: () => false, phase: () => 'racing', say: (k, v) => told.push(k + ':' + v.name), champ: () => null });
  window.__zabava = { spomin: 1 };
  r = mkRace(); P = r.player; o = r.cars.find(c => !c.isPlayer);
  spomin.begin(r, { on: false });
  check('the game switches it on for every AI car of a race with characters (not online, not a time trial)', spomin.on && o.chr.zbG === true && !spomin.fits(r, { on: true }));
  o.chr.zbMad = 0.5; spomin.step(r, 0.1); spomin.step(r, 0.1);
  check('angry: the commentator says it once, its row marked (zb-mad)', told.filter(t => t.startsWith('zbMad:')).length === 1 && spomin.cls(o) === ' zb-mad', told.join(' | '));
  o.chr.zbMad = 0; o.chr.zbR = 0; spomin.told = new Map(); o.dist = P.dist + 8;
  for (let k = 0; k < 205; k++) spomin.step(r, 0.1);
  check('20 s close behind it with no knock: respect (zbR 20), said once; no mark', o.chr.zbR >= 20 && told.filter(t => t.startsWith('zbRespect:')).length === 1 && spomin.cls(o) === '', 'zbR ' + o.chr.zbR.toFixed(1));
  // a championship: the grudges of a round kept for the next one, a new championship clean
  let chObj = { id: 'legende' }; Z.init({ S: {}, repro: () => false, phase: () => 'racing', say() {}, champ: () => chObj });
  r = mkRace(); P = r.player; o = r.cars.find(c => !c.isPlayer); r.champ = { round: 0, n: 5 };
  spomin.begin(r, { on: false }); o.chr.zbMad = 0.6; spomin.resEnd(r, 'race');
  const r2 = mkRace(), o2 = r2.cars.find(c => !c.isPlayer); r2.champ = { round: 1, n: 5 };
  spomin.begin(r2, { on: false });
  check('a championship: the driver angry in round 1 is still angry in round 2 (same name)', o2.name === o.name && o2.chr.zbMad === 0.6, o2.name + ' ' + o2.chr.zbMad);
  const r3 = mkRace(), o3 = r3.cars.find(c => !c.isPlayer); r3.champ = { round: 0, n: 5 };
  spomin.begin(r3, { on: false });
  check('a championship started again (round 1): no grudge from the last one', !(o3.chr.zbMad > 0));
  spomin.stop(); delete window.__zabava;
}

console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`);
process.exitCode = bad ? 1 : 0;
