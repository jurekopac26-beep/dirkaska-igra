// The flying start of a race up an open road (Race opts.flying, Race._flyColumn, game.js flyStep): no start lights; the moment the race
// begins it is already under way: the cars in one line up the road, ~10 s from the player's car at the back to the leader, the player's car
// 3 s of its pace below the start line on the autopilot, three amber lights in the middle (#h-fly), one going out at each whole second, under
// them LETEČI START ČEZ 3 SEKUNDE…, 2 SEKUNDI…, 1 SEKUNDO… (the commentator only counts: Three! Two! One!), and the moment it is over the line the lights gone, VOZIŠ TI! (The race has started!) and the
// player's own car (the touch controls' autopilot mark off). No one passes until then. Vršič's race and Pikes Peak's (22 cars; its short road below the line: slower)
// and the one circuit with a flying start, the Nordschleife's Circuit race (def.flyStart: 100 cars, the column closer together, ~30 s long);
// the time trial on the same road keeps its standing start, a circuit's race its lights, and so does a championship round on the Nordschleife.
//   node tests/browser/flystart.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('flying start (open roads)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 844, height: 390 });
  // the race's first moments, stepped by hand from its start (restarted paused): the lights lit (each change), any message, the autopilot's
  // mark, the order, the player's car at the start line as it takes over
  const look = () => page.evaluate(async () => {
    const g = window.__game, $ = (id) => document.getElementById(id), out = [];
    g.onAction('restart'); g.pause(); g.sim(1 / 60, true);
    const r = g.race, P = r.player;
    const order = () => r.cars.slice().sort((a, b) => b.dist - a.dist).map(c => c.id).join();
    const o0 = order(), line = r.cars.slice().sort((a, b) => a.grid - b.grid), lead = line.slice(1).reduce((a, c, k) => a + (line[k].dist - c.dist) / Math.max(5, c.speed), 0);   // (each gap at the pace of the car behind)
    const F = $('h-fly'), lit = () => F.classList.contains('show') ? F.querySelectorAll('i.on').length : 0;
    let n = -1, kept = true, at = null, d0 = P.dist, msg0 = '', t0 = r.time;
    while (r.time < 6 && at == null) {
      const was = r.flyOn; if (was && $('h-msg').className.includes('show')) msg0 = $('h-msg').textContent;
      g.sim(1 / 60, true); if (order() !== o0) kept = false;
      const k = lit(); if (k !== n) { n = k; out.push({ t: +r.time.toFixed(2), lit: k, txt: k ? F.lastElementChild.textContent : '', ap: $('touch').classList.contains('ap'), d: +P.dist.toFixed(1) }); }
      if (was && !r.flyOn) at = { t: +r.time.toFixed(2), d: +P.dist.toFixed(2), ap: $('touch').classList.contains('ap'), lit: k, msg: $('h-msg').textContent };
    }
    g.resume();
    return { out, at, kept, msg0, t0, lead: +lead.toFixed(1), d0: +d0.toFixed(0), fly: r.opts.flying, lch: !!r.lch, tt: r.timeTrial, cars: r.cars.length, lights: $('h-lights').classList.contains('show') };
  });
  for (const id of ['vrsic', 'pikes', 'nring']) {
    await startTrack(page, id, id === 'nring' ? null : 'race');
    const r = await look(), lits = r.out.map(o => o.lit).join(''), N = id === 'nring' ? 100 : 22, E = Math.min(10 / 12 * (N - 1), 30);   // (E: the column's length, s)
    T.check(`${id}: the race begins at once, no lights, the ${N} cars in one line (the player's car at the back, ~${Math.round(E)} s behind the leader, below the start line)`,
      r.fly > 0 && !r.lch && !r.tt && r.cars === N && !r.lights && r.d0 < 0 && r.lead > 0.75 * E && r.lead < 1.35 * E, `${r.lead} s behind the leader, ${-r.d0} m below the line`);
    T.check(`${id}: the countdown on the autopilot, three lights then two then one, the words under them (no other message), then the lights gone and VOZIŠ TI! the moment the player's car is over the start line (~3 s), no one passing until then`,
      r.t0 < 0.1 && lits === '3210' && r.out.slice(0, 3).map(o => o.txt).join('|') === 'LETEČI START ČEZ 3 SEKUNDE…|LETEČI START ČEZ 2 SEKUNDI…|LETEČI START ČEZ 1 SEKUNDO…' && r.out.slice(0, 3).every(o => o.ap) && !r.msg0 && r.at && r.at.lit === 0 && r.at.msg === 'VOZIŠ TI!' && !r.at.ap && r.at.d >= 0 && r.at.d < 2 && r.at.t > 2.9 && r.at.t < 3.8 && r.kept && r.out[1].t > 0.95 && r.out[1].t < 1.1 && r.out[2].t > 1.95 && r.out[2].t < 2.1,
      JSON.stringify(r.out) + ' ' + JSON.stringify(r.at));
  }
  // the same road's time trial and a circuit's race: the standing start with the lights, as ever
  for (const [id, mode] of [['vrsic', 'tt'], ['jezero', null]]) {
    await startTrack(page, id, mode);
    const r = await page.evaluate(() => { const g = window.__game; return { fly: g.race.opts.flying || 0, phase: g.phase, lights: document.getElementById('h-lights').classList.contains('show') }; });
    T.check(`${id}${mode ? ' (' + mode + ')' : ''}: no flying start, the lights`, !r.fly && (r.phase === 'intro' || r.phase === 'lights'), JSON.stringify(r));
  }
  // the commentator's lines that say how many ({cars}, {rivals}: the field's own in words; the open roads' goPass: their start with the lights,
  // online) and the flying start's (only the countdown: flyThree, flyTwo, flyOne, flyGo; no lights in them): every line of the pools, the game's
  // own and every road's, with a field of 22 and of 100: filled in, no gaps, a capital after a full stop
  const lines = await page.evaluate(() => {
    Comm.setEnabled(true); Comm.setSpeech(true); const out = [], flyOut = [], r0 = Math.random, own = ['introPass', 'goPass'];
    for (const d of Core.TRACKS) if (d.comm) for (const k of own) if (d.comm[k]) Comm.addLines(k + '@' + d.id, d.comm[k]);
    const fly = ['flyThree', 'flyTwo', 'flyOne', 'flyGo'], keys = ['intro', 'introOne', 'introPass', 'goPass'].concat(fly, Core.TRACKS.filter(d => d.comm).flatMap(d => own.filter(k => d.comm[k]).map(k => k + '@' + d.id)));
    for (const n of [22, 100]) for (const key of keys) {
      const len = (key.includes('@') ? Core.TRACKS.find(d => d.id === key.split('@')[1]).comm[key.split('@')[0]] : null), L = len ? len.length : 8;
      for (let i = 0; i < L; i++) { Math.random = () => (i + 0.5) / L; const it = Comm.say(key, { track: 'Vršič', laps: 2, grid: Comm.ordinal(n), cars: Comm.words(n), rivals: Comm.words(n - 1) }, 9); if (it) out.push(it.text), fly.includes(key) && flyOut.push(it.text); }
    }
    Math.random = r0; Comm.stop(); Comm.setEnabled(false);
    return { avail: Comm.available(), n: out.length, bad: [...new Set(out)].filter(t => /[{}]|\s[,.!?]|\s\s|^\s|[.!?] [a-z]|[Tt]hirteen cars|[Tt]welve rivals/.test(t)), fly: [...new Set(flyOut)], flyBad: flyOut.filter(t => /[Ll]ights|[Gg]reen/.test(t)),
      some: out.filter(t => /Twenty-two|twenty-two|A hundred|a hundred|Ninety-nine/.test(t)).slice(0, 3), ord: [21, 22, 23, 31, 99, 100].map(Comm.ordinal).join(' ') };
  });
  T.check('commentary: every line that says how many cars or rivals, and the flying start\'s, filled in with the field (22, 100), no gaps, no lights at a flying start',
    !lines.avail || (lines.n > 100 && !lines.bad.length && lines.fly.join('|') === 'Three!|Two!|One!|The race has started!' && !lines.flyBad.length && lines.some.length > 0 && lines.ord === 'twenty-first 22nd 23rd 31st 99th 100th'), JSON.stringify(lines).slice(0, 900));
  // a championship round on the Nordschleife (Legende, its last round; the rounds before it driven): its own 19 rivals and the lights
  await page.evaluate(() => window.__game.onAction('to-title')); await page.waitForTimeout(500);   // (the 100-car race off first: the page reloads quicker)
  await page.evaluate(() => { const K = Core.champKeys(19), d = Core.CHAMPS.find(c => c.id === 'legende'), i = d.tracks.indexOf('nring');
    localStorage.setItem('tdgp-champ', JSON.stringify({ v: 1, id: 'legende', diff: 1, n: 19, rounds: d.tracks.slice(0, i).map(t => ({ track: t, order: K.slice() })) })); });
  await page.reload({ timeout: 120000 }); await page.waitForFunction(() => !!(window.__game && window.__game.screen === 'title'), null, { timeout: 120000 });
  await page.evaluate(async () => { const g = window.__game; await new Promise(r => setTimeout(r, 500)); g.onAction('to-champ'); await new Promise(r => setTimeout(r, 300)); g.onAction('champ-go'); });
  await page.waitForFunction(() => { const g = window.__game; return !!(g.race && g.race.champ && g.race.track.def.id === 'nring'); }, null, { timeout: 120000 });
  { const r = await page.evaluate(() => { const g = window.__game; return { fly: g.race.opts.flying || 0, cars: g.race.cars.length, lch: !!g.race.lch, phase: g.phase }; });
    T.check('nring, a championship round (Legende): its 20 cars, no flying start, the lights', !r.fly && r.cars === 20 && r.lch && (r.phase === 'intro' || r.phase === 'lights'), JSON.stringify(r)); }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
