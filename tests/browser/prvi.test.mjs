// Prvič na cesti (the first start, js/game.js prviShow): a fresh browser on a plain start (the new menu, a phone upright 390 × 844)
// opens on #s-prvi: the three ways to drive, Tipke marked; the panel inside the screen upright and on its side (844 × 390). Volan
// chosen (the setting). Poskusna vožnja: alone on Štajerska (Avstrija) in the player's car, the racing line on, POSKUSNA VOŽNJA · še
// N s at the top, after 45 s how it went (km, top speed, Volan). Drugo upravljanje: the choice again. Prva dirka: Štajerska, 6 cars,
// 2 laps, Lahka, the player 4th on the grid, the line on, the first start noted; at the line the results show what comes next (Šola
// vožnje, Proge, Kariera) and not the offer to save the profile; Šola vožnje opens it. Not again after a reload; Nastavitve → Prvič na
// cesti → Pokaži znova shows it, Preskoči goes to the title. Not shown with the settings kept, with the garage's profile, nor on a
// quick entry's address.
//   node tests/browser/prvi.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('prvi');
const srv = await serve();
const browser = await launch();
try {
  const A = await openGame(browser, srv.base + '/index.html', null, { width: 390, height: 844 }, { touch: true, menu: true });
  const pa = A.page, ev = (f, a) => pa.evaluate(f, a);
  await pa.waitForTimeout(800);
  const fit = () => ev(() => { const r = document.querySelector('#s-prvi .prvi-panel').getBoundingClientRect(); return r.width > 200 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; });

  // 1. the first start: the controls
  const a1 = await ev(() => ({ screen: window.__game.screen, show: !!document.querySelector('#s-prvi.show'), a: !document.getElementById('prvi-a').classList.contains('off'), b: !document.getElementById('prvi-b').classList.contains('off'),
    cards: [...document.querySelectorAll('#prvi-a .prvi-c')].map(c => c.dataset.v + (c.classList.contains('sel') ? '*' : '')), prvi: window.__game.prvi }));
  const up = await fit();
  await pa.setViewportSize({ width: 844, height: 390 }); await pa.waitForTimeout(300);
  const side = await fit();
  await pa.setViewportSize({ width: 390, height: 844 }); await pa.waitForTimeout(200);
  T.check('a fresh browser, a plain start: Prvič na cesti (the three ways to drive, Tipke marked), the panel inside the screen upright and on its side',
    a1.screen === 'prvi' && a1.show && a1.a && !a1.b && a1.cards.join() === 'buttons*,wheel,tilt' && a1.prvi.fresh && a1.prvi.can && !a1.prvi.seen && up && side, JSON.stringify({ a1, up, side }));
  await pa.reload(); await pa.waitForFunction(() => window.__game, null, { timeout: 180000 }); await pa.waitForTimeout(800);
  const a0 = await ev(() => ({ screen: window.__game.screen, state: window.__game.prvi.state }));
  T.check('the game closed on it (the settings saved meanwhile): shown again at the next start (tdgp-prvi 0)', a0.screen === 'prvi' && a0.state === '0', JSON.stringify(a0));
  await ev(() => document.querySelector('#prvi-a [data-v="wheel"]').click());
  const a2 = await ev(() => ({ control: window.__game.S.control, sel: [...document.querySelectorAll('#prvi-a .prvi-c.sel')].map(c => c.dataset.v) }));
  T.check('Volan chosen: the setting, the card marked', a2.control === 'wheel' && a2.sel.join() === 'wheel', JSON.stringify(a2));

  // 2. the test drive: alone on Štajerska, the line, the time left at the top; after 45 s how it went
  await ev(() => document.querySelector('#prvi-a [data-act="prvi-test"]').click());
  await pa.waitForFunction(() => window.__game.race && window.__game.race.track.def.id === 'rbring' && window.__game.school, null, { timeout: 120000 });
  await ev(() => { const g = window.__game; g.pause(); g.sim(6, true); g.resume(); });
  await pa.waitForTimeout(300);
  const d1 = await ev(() => ({ school: window.__game.school, cars: window.__game.race.cars.length, hud: document.getElementById('h-school').textContent, on: document.getElementById('hud').classList.contains('school'), car: window.__game.race.player.m.id, mine: Core.MODELS[window.__game.S.car].id }));
  T.check('Poskusna vožnja: alone on Štajerska in the player\'s own car, POSKUSNA VOŽNJA · še N s at the top', d1.school && d1.school.id === 'prvi' && d1.cars === 1 && d1.on && /^POSKUSNA VOŽNJA · še \d+ s$/.test(d1.hud) && d1.car === d1.mine, JSON.stringify(d1));
  await ev(() => { const g = window.__game; g.pause(); for (let k = 0; k < 40 && g.screen !== 'prvi'; k++) g.sim(2, true); });
  await pa.waitForTimeout(300);
  const d2 = await ev(() => ({ screen: window.__game.screen, b: !document.getElementById('prvi-b').classList.contains('off'), t: document.getElementById('prvi-b-t').textContent, done: window.__game.school && window.__game.school.done }));
  T.check('after 45 s: how it went (km, top speed, Volan) with Drugo upravljanje, Še enkrat, Prva dirka', d2.screen === 'prvi' && d2.b && d2.done && /^Prevoženo \d+,\d km, najvišja hitrost \d+ km\/h, upravljanje: Volan\.$/.test(d2.t) && await fit(), JSON.stringify(d2));
  await ev(() => document.querySelector('#prvi-b [data-act="prvi-again"]').click());
  const d3 = await ev(() => ({ a: !document.getElementById('prvi-a').classList.contains('off'), sel: [...document.querySelectorAll('#prvi-a .prvi-c.sel')].map(c => c.dataset.v) }));
  T.check('Drugo upravljanje: the choice again (Volan marked)', d3.a && d3.sel.join() === 'wheel', JSON.stringify(d3));
  await ev(() => document.querySelector('#prvi-a [data-v="buttons"]').click());

  // 3. the first race: Štajerska, 6 cars, 2 laps, Lahka, 4th on the grid, the line; the first start noted
  await ev(() => { window.__game.S.hlv = 0; window.__game.onAction('prvi-race'); });   // (no best moment's video before the results)
  await pa.waitForFunction(() => window.__game.race && window.__game.race.track.def.id === 'rbring' && !window.__game.school && window.__game.race.cars.length > 1, null, { timeout: 120000 });
  const r1 = await ev(() => { const r = window.__game.race; return { cars: r.cars.length, laps: r.opts.laps, diff: r.opts.difficulty, grid: r.opts.playerGrid, rain: r.rain, prvi: window.__game.prvi, track: window.__game.S.track }; });
  T.check('Prva dirka: Štajerska, 6 cars, 2 laps, Lahka, the player 4th on the grid, dry; the first start noted seen (tdgp-prvi 1)', r1.cars === 6 && r1.laps === 2 && r1.diff === 0 && r1.grid === 4 && !r1.rain && r1.prvi.race && r1.prvi.seen && r1.prvi.state === '1' && r1.track === 'rbring', JSON.stringify(r1));
  await ev(() => { const g = window.__game; g.pause(); for (let k = 0; k < 300 && g.phase !== 'done'; k++) g.sim(2, true); if (g.phase !== 'done') g.resume(); });
  await pa.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  await pa.waitForTimeout(300);
  const r2 = await ev(() => ({ next: !document.getElementById('res-prvi').classList.contains('off'), txt: document.getElementById('res-prvi').innerText.replace(/\s+/g, ' '), save: !document.getElementById('res-save').classList.contains('off'), races: window.__game.stats.races }));
  T.check('the first race\'s results: what comes next (Šola vožnje, Proge, Kariera), no offer to save the profile yet', r2.next && /Prva dirka je za tabo\. Kaj zdaj\?/.test(r2.txt) && /Šola vožnje/.test(r2.txt) && /Proge/.test(r2.txt) && /Kariera/.test(r2.txt) && !r2.save && r2.races === 1, JSON.stringify(r2));
  await ev(() => window.__game.onAction('prvi-school'));
  await pa.waitForTimeout(300);
  T.check('Šola vožnje: its screen, the race left', await ev(() => window.__game.screen === 'school' && !window.__game.race));

  // 4. not again on its own; Nastavitve → Pokaži znova; Preskoči
  await pa.reload(); await pa.waitForFunction(() => window.__game, null, { timeout: 180000 }); await pa.waitForTimeout(800);
  const s1 = await ev(() => ({ screen: window.__game.screen, prvi: window.__game.prvi }));
  T.check('after a reload: not again (the title)', s1.screen === 'title' && !s1.prvi.fresh && s1.prvi.seen, JSON.stringify(s1));
  await ev(() => { window.__game.onAction('to-settings'); document.querySelector('#s-settings [data-act="prvi-show"]').click(); });
  const s2 = await ev(() => window.__game.screen);
  await ev(() => document.querySelector('#prvi-a [data-act="prvi-skip"]').click());
  const s3 = await ev(() => window.__game.screen);
  T.check('Nastavitve → Prvič na cesti → Pokaži znova: shown again; Preskoči: the title', s2 === 'prvi' && s3 === 'title', JSON.stringify({ s2, s3 }));
  T.check('no page errors', A.errors.length === 0, A.errors.slice(0, 5).join(' | '));
  await A.ctx.close();

  // 5. not shown: the settings kept, the garage's profile, a quick entry
  const B = await openGame(browser, srv.base + '/index.html', {}, { width: 390, height: 844 });
  const C = await openGame(browser, srv.base + '/index.html', null, { width: 390, height: 844 }, { init: () => { localStorage.setItem('apex-garage', '{"v":1}'); } });
  const D = await openGame(browser, srv.base + '/index.html?proga=troisrivieres', null, { width: 390, height: 844 });
  await Promise.all([B.page, C.page, D.page].map(p => p.waitForTimeout(800)));
  const n = await Promise.all([B.page, C.page, D.page].map(p => p.evaluate(() => ({ screen: window.__game.screen, can: window.__game.prvi.can }))));
  T.check('not shown with the settings kept, with the garage\'s profile, on a quick entry (?proga=)', n.every(x => x.screen !== 'prvi' && !x.can), JSON.stringify(n));
  T.check('no page errors (B, C, D)', [B, C, D].every(x => !x.errors.length), [B, C, D].map(x => x.errors.slice(0, 2).join(' | ')).join(' || '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
