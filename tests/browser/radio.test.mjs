// The team radio and the strategy in the game (Nastavitve · Radio ekipe, on by default; Toskana, the player on autopilot): at the line the
// engineer's message in the box at the top of the HUD with the radio's click: the gaps to the cars ahead and behind, on the last lap
// "Zadnji krog!"; in a race with fuel (6 laps) the window for the stop, on the lap it must be made BOKSI V TEM KROGU with the place the stop
// gives, after the stop the place; the pause menu's strategy (fuel, what a stop costs, the place after it); the tyres for the next stop
// chosen while driving (the button, the T key: Samodejno, Mehke, Srednje, Trde in turn); in English; switched off: no radio.
//   node tests/browser/radio.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('team radio and strategy');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'toskana', weather: 'dry', radio: 1, damage: 0 }, { width: 390, height: 844 }, { seed: 13 });
  const setUp = () => page.evaluate(() => { window.__clicks = 0; if (!Sfx.radio.__t) { const o = Sfx.radio; Sfx.radio = function () { window.__clicks++; return o.apply(this, arguments); }; Sfx.radio.__t = 1; }
    window.__msgs = []; if (!window.__mo) { window.__mo = new MutationObserver((recs) => { for (const r of recs) for (const n of r.addedNodes) { const t = n.textContent; if (t) window.__msgs.push(t); } }); window.__mo.observe(document.getElementById('h-msg'), { childList: true, subtree: true }); } });
  // on, two seconds at a time (paused, on autopilot), two drawn frames after each (the radio speaks from the HUD's frames), until fn (it may
  // also steer the test: the player's way into the pits)
  const until = (fn, max) => page.evaluate(async ([src, max]) => { const g = window.__game, f = new Function('g', 'return (' + src + ')(g)');
    for (let k = 0; k < max; k++) { if (f(g)) return true; g.pause(); g.sim(2, true); g.resume(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
    return !!f(g); }, [fn.toString(), max || 200]);
  const radio = () => page.evaluate(() => { const g = window.__game, el = document.getElementById('h-radio'); return { log: g.radio.log, on: el.classList.contains('on'), text: el.lastElementChild.textContent, clicks: window.__clicks, lap: g.race.player.lap, laps: g.race.laps }; });
  const lang = (l) => page.evaluate((l) => { const g = window.__game; g.pause(); g.onAction('to-settings'); document.querySelector(`[data-set="lang"] button[data-v="${l}"]`).click(); g.onAction('settings-done'); g.resume(); }, l);

  // 1. three laps: at the second lap's line the gaps (the box at the top, its click)
  await startTrack(page, 'toskana');
  await setUp();
  await until((g) => g.race.player.lap >= 2 && g.radio.log.length > 0, 60);
  const r1 = await radio(), gapRe = /^(.+ je \d+,\d s pred tabo(, .+ \d+,\d s za tabo)?\.|Vodiš(, .+ je \d+,\d s za tabo)?\.)$/;
  T.check('at the line: the engineer on the radio (the box at the top, its click), the gaps to the cars ahead and behind ("... je 1,2 s pred tabo, ... 0,8 s za tabo.")',
    r1.laps === 3 && r1.on && r1.log.length === 1 && gapRe.test(r1.log[0]) && r1.text === r1.log[0] && r1.clicks === 1, JSON.stringify(r1));

  // 2. the pause menu: the strategy as it stands (no fuel: the tyres, what a stop now costs, the place after it)
  const ps = await page.evaluate(() => { const g = window.__game; g.pause(); const el = document.getElementById('pause-strat'), t = el.textContent, on = !el.classList.contains('off'); g.resume(); return { t, on }; });
  T.check('the pause menu: the strategy (the tyres, what a stop now costs and the place after it)', ps.on && /^Gume: \d+ %\. Postanek zdaj stane okoli \d+ s, po njem bi bil \d+\.$/.test(ps.t), JSON.stringify(ps));

  // 3. the tyres for the next stop while driving: the button (A, S, M, H in turn), the T key; the setting kept, the player's car told
  const ty = await page.evaluate(() => { const g = window.__game, b = document.getElementById('btn-tyre'), out = [];
    const st = () => ({ vis: getComputedStyle(b).display !== 'none', c: b.dataset.c, t: b.textContent, car: g.race.player.pitCmp, toast: document.getElementById('toast').textContent });
    out.push(st()); for (let k = 0; k < 3; k++) { b.click(); out.push(st()); }
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyT' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyT' })); out.push(st());
    return { out, stored: JSON.parse(localStorage.getItem('tdgp-settings')).pitCmp }; });
  T.check('the tyres for the next stop while driving: the button A, S, M, H in turn, then the T key back to A (the car and the setting follow)',
    ty.out.map(x => x.t).join() === 'A,S,M,H,A' && ty.out.every(x => x.vis) && ty.out[1].car === 'S' && ty.out[3].car === 'H' && ty.out[4].car === 'auto' && ty.out[3].toast === 'Gume za postanek: Trde' && ty.stored === 'auto', JSON.stringify(ty));

  // 4. in English, at the last lap's line: "Last lap! ... is 1.2 s ahead of you"
  await lang('en');
  await until((g) => g.race.player.lap >= 3 && g.radio.log.length > 1, 60);
  const en = (await radio()).log.slice(1);
  await lang('sl');
  T.check('in English, the last lap: "Last lap! ... is 1.2 s ahead of you, ... 0.8 s behind you." (or "You are leading")',
    en.length === 1 && /^Last lap! (.+ is \d+\.\d s ahead of you(, .+ \d+\.\d s behind you)?\.|You are leading(, .+ is \d+\.\d s behind you)?\.)$/.test(en[0]), JSON.stringify(en));

  // 5. six laps with fuel: the window for the stop at the second lap's line; on the lap it must be made BOKSI V TEM KROGU with the place it
  // gives; the stop made as told: after it the place
  await page.evaluate(() => { const g = window.__game; g.onAction('to-title'); g.onAction('to-settings'); document.querySelector('[data-set="fuel"] button[data-v="1"]').click(); document.querySelector('[data-set="length"] button[data-v="long"]').click(); g.onAction('settings-done'); });
  await startTrack(page, 'toskana');
  await setUp();
  await until((g) => g.race.player.lap >= 2 && g.radio.log.length > 0, 80);
  const w = await radio();
  T.check('a race with fuel (6 laps): at the line the window for the stop the fuel needs', w.laps === 6 && /^Gorivo ne bo zdržalo do cilja\. (Okno za postanek: od \d\. do \d\. kroga\.|Postanek bo v \d\. krogu\.)$/.test(w.log[0]), JSON.stringify(w));
  await until((g) => { const P = g.race.player; if (g.radio.log.some(t => /Boksi v tem krogu!/.test(t)) && !P.repairN && !P.inPit) P.pitWant = true; if (P.repairN && !P.inPit) P.pitWant = false;
    return g.radio.log.some(t => /^Dober postanek/.test(t)) || P.lap >= 6; }, 200);
  const r5 = await radio(), msgs = await page.evaluate(() => window.__msgs.splice(0)), box = r5.log.find(t => /Boksi v tem krogu!/.test(t)), good = r5.log.find(t => /^Dober postanek/.test(t));
  T.check('... on the lap it must be made: BOKSI V TEM KROGU, "Boksi v tem krogu!" with the place the stop gives (and the tyres it gets)',
    !!box && /^Gorivo ne bo zdržalo do cilja\. Boksi v tem krogu! Po postanku boš (\d+\., .+ bo \d+,\d s pred tabo|še vedno prvi)\. Dobiš (mehke|srednje|trde) gume\.$/.test(box) && msgs.includes('BOKSI V TEM KROGU'), JSON.stringify({ box, msgs }));
  T.check('... the stop made as told: "Dober postanek." with the place', !!good && /^Dober postanek\. (Si \d+\.(, .+ je \d+,\d s pred tabo)?\.?|Vodiš\.)$/.test(good), JSON.stringify(r5.log));

  // 6. switched off: no clock, no radio
  await page.evaluate(() => { const g = window.__game; g.onAction('to-title'); g.onAction('to-settings'); document.querySelector('[data-set="radio"] button[data-v="0"]').click(); g.onAction('settings-done'); });
  await startTrack(page, 'toskana');
  await until((g) => g.race.player.lap >= 3, 120);
  const off = await page.evaluate(() => ({ mk: !!window.__game.race.mk, log: window.__game.radio.log, on: document.getElementById('h-radio').classList.contains('on'), pause: (() => { const g = window.__game; g.pause(); const v = !document.getElementById('pause-strat').classList.contains('off'); g.resume(); return v; })(), stored: JSON.parse(localStorage.getItem('tdgp-settings')).radio }));
  T.check('switched off in the settings: no radio, no strategy in the pause menu (kept)', !off.mk && !off.log.length && !off.on && !off.pause && off.stored === 0, JSON.stringify(off));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
