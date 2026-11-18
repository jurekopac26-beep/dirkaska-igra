// Drag dirka (I20, docs/drag-dirka.md) in the game:
//   1. the menu (on its side, a phone's touch screen): Single race · Drag race lists only the tracks with a strip (Montréal), one rival,
//      the Rival option (Truck); the race from the menu: the truck ahead by its head start, the panel and the PRESTAVA button; a run with
//      perfect shifts (paused, stepped): the results (Zmaga! or Poraz, the splits, the head start, the record with this vehicle, the shifts'
//      words), Proti avtu: the duel again against the same car; the layout at the lights and after the start; a shift by the E key
//   2. the quick entry upright (?proga=montreal&nacin=drag): the gas before the lights go out is a red light; a shift by the Space key
//      and by the PRESTAVA button (both early: PREZGODAJ); the layout; the results of a red light
//   3. an electric car (one gear): no PRESTAVA button, E in the panel, no shift light
//   node tests/browser/drag.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('drag');
const srv = await serve();
const browser = await launch();
const there = (page) => page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
const frames = (page) => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const SH = 'const root = document.getElementById("menu-host").shadowRoot;';
const ev = (page, body) => page.evaluate(new Function(SH + body));
const click = (page, act) => page.click(`[data-act="${act}"]`);
// the boxes on show in the HUD and the touch layer; the drag's own (the panel, the PRESTAVA button, the start lights) against all the others:
// overlaps (one inside another, as a row in its block, not counted) and out of the screen
const LAYOUT = () => {
  const box = {};
  for (const e of document.querySelectorAll('#hud [id], #touch [id], #btn-pause')) {
    const b = e.getBoundingClientRect(); if (b.width < 1 || b.height < 1) continue;
    let p = e, hid = false; while (p && p !== document.body) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity < 0.05) { hid = true; break; } p = p.parentElement; }
    if (!hid) box[e.id] = [b.left, b.top, b.right, b.bottom].map(Math.round);
  }
  const inside = (a, b) => a[0] >= b[0] && a[1] >= b[1] && a[2] <= b[2] && a[3] <= b[3], ov = [];
  for (const m of ['zb-drag', 'zb-shift', 'h-lights']) {
    const a = box[m]; if (!a) continue;
    for (const k in box) { if (k === m) continue; const b = box[k]; if (inside(a, b) || inside(b, a)) continue; const x = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), y = Math.min(a[3], b[3]) - Math.max(a[1], b[1]); if (x > 0 && y > 0) ov.push(m + ' x ' + k); }
  }
  const out = ['zb-drag', 'zb-shift', 'h-lights'].filter(k => box[k] && (box[k][0] < 0 || box[k][1] < 0 || box[k][2] > innerWidth || box[k][3] > innerHeight));
  return { ov: [...new Set(ov)], out, has: { panel: !!box['zb-drag'], shift: !!box['zb-shift'], lights: !!box['h-lights'], gas: !!box['c-gas'] } };
};
// the race paused, stepped to the lights going out (o.early: the gas on through the lights), then the player's run to the line (the gas
// on; o.shift: each shift at 0.95 of the redline, as the panel's green light asks); then on to the results (the autopilot past the line)
const RUN = (o) => {
  const g = window.__game, r = g.race, f = Zabava.list.find(x => x.id === 'drag'), P = r.player;
  g.pause();
  for (let i = 0; i < 600 && g.phase !== 'racing'; i++) g.sim(0.05, false, 0, o.early && g.phase === 'lights' ? 1 : 0);
  const red = !!f.st.red, msg = document.getElementById('h-msg').textContent;
  for (let i = 0; i < 40 * 120 && g.phase === 'racing'; i++) { g.sim(1 / 120, false, 0, 1); if (o.shift && P.man && !(P.man.up > 0) && Core.manRev(P, P.m, P.speed) >= 0.95) P.man.up = 1; }
  const words = f.st.words.slice(), runs = [P, f.st.o].map(c => { const q = f.st.runs.get(c); return { re: q.re, fin: q.fin, lat: q.lat }; });
  g.resume();
  return { red, msg, words, runs, phase: g.phase };
};
const toResults = (page) => page.evaluate(async () => { const g = window.__game; for (let i = 0; i < 12 && g.screen !== 'results'; i++) { g.sim(1, true); await new Promise(r => requestAnimationFrame(r)); } return g.screen; });
const RESULTS = () => ({ title: document.getElementById('res-title').textContent, sub: document.getElementById('res-sub').textContent,
  head: [...document.querySelectorAll('#res-table thead th')].map(e => e.textContent), rows: [...document.querySelectorAll('#res-table tbody tr')].map(tr => [...tr.children].map(td => td.textContent)),
  zb: (document.getElementById('res-zb') || {}).textContent || '', swap: (document.getElementById('zb-drag-swap') || {}).textContent || '', again: document.getElementById('res-restart').textContent });
const row = (s, name) => (s.rows.find(r => r[0] === name) || []);

try {
  // 1. the menu, on its side
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { intro: 2, quali: 0, track: 'montreal', lastTrack: 'montreal' }, { width: 892, height: 412 }, { menu: true, touch: true });
    await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
    await click(page, 'single'); await click(page, 'mode:drag');
    const m = await page.evaluate(() => Menu.debug().list);
    const opp = await ev(page, 'return (root.querySelector(".trow .opp") || {}).textContent || "";');
    T.check('Single race · Drag race: only the tracks with a strip (Montréal), one rival', JSON.stringify(m) === '["montreal"]' && /(^|\D)1$/.test(opp), JSON.stringify(m) + ' ' + opp);
    await click(page, 'more-options');
    const opt = await ev(page, 'return [...root.querySelectorAll("[data-act^=\\"opt:zbDrag:\\"]")].map(e => e.dataset.act + "=" + e.textContent.trim());');
    T.check('the options: Rival, Same car or Truck', opt.length === 2 && /opt:zbDrag:0=Same car/.test(opt.join()) && /opt:zbDrag:1=Truck/.test(opt.join()), JSON.stringify(opt));
    await click(page, 'opt:zbDrag:1'); await page.click('.sheet .go[data-act="close-sheet"]');
    await click(page, 'race-single');
    await page.waitForFunction(() => { const g = window.__game, f = window.Zabava && Zabava.list.find(x => x.id === 'drag'); return g.race && g.race.track.def.id === 'montreal' && g.race.zbMode === 'drag' && f.st && g.phase === 'intro'; }, null, { timeout: 180000 });
    const s0 = await page.evaluate(() => { const g = window.__game, f = Zabava.list.find(x => x.id === 'drag'), r = g.race, P = r.player, o = f.st.o;
      return { S: g.S.zbDrag, n: r.cars.length, pm: P.m.id, om: o.m.id, truck: /titan|kamen/.test(o.m.id), hs: f.st.hs, aO: Math.round(f.along(f.st.G, o) * 10) / 10, aP: Math.round(f.along(f.st.G, P) * 10) / 10,
        lanes: [f.across(f.st.G, P), f.across(f.st.G, o)].map(v => Math.round(v * 100) / 100), hud: document.getElementById('hud').classList.contains('zb-drag'), man: !!P.man && !!o.man };
    });
    T.check('the race from the menu against a truck: two cars, the truck in the left lane ahead by its head start (100-250 m), the player on the line', s0.S === 1 && s0.n === 2 && s0.truck && s0.hs < -100 && s0.hs > -250 && Math.abs(s0.aO + s0.hs) < 0.2 && Math.abs(s0.aP) < 0.2 && s0.lanes[0] > 2 && s0.lanes[1] < -2 && s0.hud && s0.man, JSON.stringify(s0));
    // the layout at the lights (paused: the touch layer away, the panel and the lights) and after the start (running: the PRESTAVA button too)
    await page.evaluate(() => { const g = window.__game; g.pause(); for (let i = 0; i < 400 && g.phase !== 'lights'; i++) g.sim(0.05, false, 0, 0); g.sim(3.2, false, 0, 0); });
    await frames(page); await page.waitForTimeout(400);   // (the lights fade in, 0.25 s)
    const L1 = await page.evaluate(LAYOUT);
    T.check('892x412, the lights: the panel and the lights on show, apart from the rest of the HUD, on the screen', L1.has.panel && L1.has.lights && !L1.ov.length && !L1.out.length, JSON.stringify(L1));
    // the run: perfect shifts
    const R1 = await page.evaluate(RUN, { shift: true });
    T.check('the run with perfect shifts: no red light, every shift POPOLNO, the player over the line, both cars in their lanes (within 0.5 m)', !R1.red && R1.words.length >= 3 && R1.words.every(w => w === 'perfect') && R1.runs[0].fin > 0 && R1.runs.every(q => q.lat < 0.5) && R1.phase === 'finish', JSON.stringify(R1));
    T.check('the results screen', (await toResults(page)) === 'results');
    const s1 = await page.evaluate(RESULTS);
    const et = row(s1, 'Do cilja')[1], rec = row(s1, 'Rekord')[1];
    T.check('the results: Zmaga! or Poraz with the gap, Drag dirka · Ti · Tekmec, the reaction, 18 m, 201 m, the time to the line and from the lights, the speed at the line',
      /^(Zmaga!|Poraz)$/.test(s1.title) && /s (pred tekmecem|pred tabo)/.test(s1.sub) && s1.head.join() === 'Drag dirka,Ti,Tekmec' && ['Reakcija', '18 m', '201 m', 'Do cilja', 'Čas od luči', 'Hitrost na cilju'].every(k => /\d,\d{3} s|\d+ km\/h/.test(row(s1, k)[1] || '')), JSON.stringify(s1));
    T.check('the head start (the rival\'s, in metres), the vehicles, a new record with this vehicle (its time to the line)', /^–$/.test(row(s1, 'Prednost')[1] || '') && /\d+,\d m$/.test(row(s1, 'Prednost')[2] || '') && /TITAN|KAMEN/i.test(row(s1, 'Vozilo')[2] || '') && / Nov rekord\.$/.test(s1.sub) && rec === et, JSON.stringify([row(s1, 'Prednost'), row(s1, 'Vozilo'), rec, et, s1.sub]));
    T.check('the shifts\' words under the results, Proti avtu, Ponovi dvoboj', /^Menjave: \d+ · popolno \d+, dobro 0, prezgodaj 0, prepozno 0/.test(s1.zb) && s1.swap === 'Proti avtu' && s1.again === 'Ponovi dvoboj', JSON.stringify([s1.zb, s1.swap, s1.again]));
    // Proti avtu: the duel again, against the same car
    await page.click('#zb-drag-swap');
    await page.waitForFunction(() => { const g = window.__game, f = Zabava.list.find(x => x.id === 'drag'); return g.screen !== 'results' && g.race && g.race.zbMode === 'drag' && f.st && f.st.o.m.id === g.race.player.m.id; }, null, { timeout: 120000 });
    const s2 = await page.evaluate(() => { const g = window.__game, f = Zabava.list.find(x => x.id === 'drag'); return { S: g.S.zbDrag, hs: f.st.hs, om: f.st.o.m.id, pm: g.race.player.m.id }; });
    T.check('Proti avtu: the setting back to Same car, the rival the player\'s own car, no head start', s2.S === 0 && s2.hs === 0 && s2.om === s2.pm, JSON.stringify(s2));
    // after the start, running: the PRESTAVA button on show; the E key shifts
    await page.evaluate(() => { const g = window.__game; for (let i = 0; i < 600 && g.phase !== 'racing'; i++) g.sim(0.05, false, 0, 0); g.sim(0.6, false, 0, 1); });
    await frames(page);
    const L2 = await page.evaluate(LAYOUT);
    T.check('892x412, after the start: the panel and the PRESTAVA button on show, apart from the rest of the HUD and the touch controls, on the screen', L2.has.panel && L2.has.shift && L2.has.gas && !L2.ov.length && !L2.out.length, JSON.stringify(L2));
    const g0 = await page.evaluate(() => window.__game.race.player.gear);
    await page.keyboard.press('KeyE'); await frames(page); await page.waitForTimeout(250); await frames(page);
    const g1 = await page.evaluate(() => window.__game.race.player.gear);
    T.check('the E key: one gear up', g0 === 1 && g1 === 2, g0 + ' -> ' + g1);
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 2. the quick entry upright: a red light, the Space key and the PRESTAVA button, the layout, the results of a red light
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=montreal&nacin=drag', {}, { width: 412, height: 892 }, { menu: true, touch: true });
    await there(page);
    const s0 = await page.evaluate(() => { const g = window.__game, f = Zabava.list.find(x => x.id === 'drag'); return { mode: g.race.zbMode, n: g.race.cars.length, same: f.st.o.m.id === g.race.player.m.id, hs: f.st.hs, S: g.S.zbDrag }; });
    T.check('?proga=montreal&nacin=drag: the drag race, two cars, the rival the same car (Rival: Same car), no head start', s0.mode === 'drag' && s0.n === 2 && s0.same && s0.hs === 0 && !s0.S, JSON.stringify(s0));
    // the gas before the lights go out
    const r0 = await page.evaluate(() => { const g = window.__game, f = Zabava.list.find(x => x.id === 'drag'); g.pause(); for (let i = 0; i < 400 && g.phase !== 'lights'; i++) g.sim(0.05, false, 0, 0); g.sim(0.6, false, 0, 1); return { red: f.st.red, msg: document.getElementById('h-msg').textContent, phase: g.phase }; });
    T.check('the gas on while the lights are on: RDEČA LUČ!', r0.red && /RDEČA LUČ!/.test(r0.msg) && r0.phase === 'lights', JSON.stringify(r0));
    await page.evaluate(() => { const g = window.__game; for (let i = 0; i < 400 && g.phase !== 'racing'; i++) g.sim(0.05, false, 0, 0); g.resume(); });
    await frames(page);
    const L = await page.evaluate(LAYOUT);
    T.check('412x892, after the start: the panel and the PRESTAVA button on show, apart from the rest of the HUD and the touch controls, on the screen', L.has.panel && L.has.shift && L.has.gas && !L.ov.length && !L.out.length, JSON.stringify(L));
    await page.keyboard.press('Space'); await frames(page); await page.waitForTimeout(250); await frames(page);
    const k1 = await page.evaluate(() => { const P = window.__game.race.player, f = Zabava.list.find(x => x.id === 'drag'); return { gear: P.gear, words: f.st.words.slice(), shown: document.querySelector('#zb-drag .zd-w').textContent }; });
    T.check('the Space key at a standstill: a gear up, PREZGODAJ', k1.gear === 2 && k1.words.join() === 'early' && k1.shown === 'PREZGODAJ', JSON.stringify(k1));
    await page.tap('#zb-shift'); await frames(page); await page.waitForTimeout(250); await frames(page);
    const k2 = await page.evaluate(() => { const P = window.__game.race.player, f = Zabava.list.find(x => x.id === 'drag'); return { gear: P.gear, words: f.st.words.slice() }; });
    T.check('the PRESTAVA button: another gear up', k2.gear === 3 && k2.words.join() === 'early,early', JSON.stringify(k2));
    const R = await page.evaluate(RUN, { shift: true });
    T.check('the run after the red light goes on to the line', R.red && R.runs[0].fin > 0, JSON.stringify(R));
    T.check('the results screen', (await toResults(page)) === 'results');
    const s1 = await page.evaluate(RESULTS);
    T.check('the results of a red light: Rdeča luč, why, the reaction a red light, no record', s1.title === 'Rdeča luč' && /^Plin si pritisnil, preden so ugasnile luči\.$/.test(s1.sub) && row(s1, 'Reakcija')[1] === 'rdeča luč' && row(s1, 'Rekord')[1] === '–' && s1.swap === 'Proti tovornjaku', JSON.stringify(s1));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 3. an electric car: one gear, nothing to shift
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=montreal&nacin=drag&avto=ev', {}, { width: 640, height: 360 }, { menu: true, touch: true });
    await there(page);
    await page.evaluate(() => { const g = window.__game; for (let i = 0; i < 400 && g.phase !== 'racing'; i++) g.sim(0.05, false, 0, 0); g.sim(1, false, 0, 1); });
    await frames(page);
    const s = await page.evaluate(() => { const P = window.__game.race.player, el = document.getElementById('zb-drag'); return { id: P.m.id, gears: P.m.gears.length, man: !!P.man, btn: !!document.getElementById('zb-shift'), g: el.querySelector('.zd-g').textContent, lt: el.querySelector('.zd-lt').className }; });
    T.check('an electric car: no manual gearbox, no PRESTAVA button, E in the panel, the shift light off', s.gears === 1 && !s.man && !s.btn && s.g === 'E' && s.lt === 'zd-lt', JSON.stringify(s));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} catch (e) {
  T.check('the test ran to its end', false, String(e && e.stack || e).slice(0, 600));
} finally {
  await browser.close(); await srv.close();
}
T.done();
