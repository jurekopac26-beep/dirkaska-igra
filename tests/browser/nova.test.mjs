// The driving physics in the settings (Nastavitve → Fizika vožnje: Klasična / Nova; js/game.js S.phys, Core's Car.stepNova):
// - the row is in the settings with both choices, Klasična marked on a fresh profile; in English "Driving physics: Classic / New"
// - Nova chosen: kept in the settings (localStorage), a race on Bathurst runs with the new physics for every car (the player's and the
//   rivals'), 20 s on the autopilot: nothing NaN, the cars moving, no errors on the page
// - switched back to Klasična during that race: the race keeps its physics, a toast says it applies from the next race; the next race classic
// - the row Slog nove fizike (Običajen marked on a fresh profile; in English "New physics style: Normal / Sliding"): Drseč chosen with Nova,
//   the next race's player car has the sliding style (Car.nvSl), the rivals not; with Klasična no car has it
// - Preizkus: tekmeci in trki (Nastavitve: its own folded category after the profile row, with 5 rows Tekmeci and 8 rows Trki med avti;
//   Core.setTest): the category folded and the 13 rows inside it, all on Privzeto on a fresh profile, Core.TX all null; Trki: slog Realističen, težak
//   sets the bounce, the rub, the turn, the weight, the sparks, the flat bumpers and the tyres' hold (Core.TX), a row under it overrides it, every
//   other row sets its number; kept in the
//   settings (localStorage); in English; a race with the rivals' spread narrower deals out narrower paces, back on Privzeto the old ones and
//   nothing set; the spread's toast says from the next race
// - Trki med avti brez odboja (one row before Poškodbe avtov, Izklop on a fresh profile): Vklop sets Core.TX.nb and its own knock settings over
//   the rows, dims the 9 rows it stands for and writes a note; Razbijanje stays as chosen; in English; Izklop: nothing set
//   node tests/browser/nova.test.mjs
import { serve, launch, openGame, startTrack, simulate, checker } from './lib.mjs';

const T = checker('nova');
const srv = await serve();
const browser = await launch();
const row = (page) => page.evaluate(() => { const s = document.querySelector('#s-settings [data-set="phys"]'), r = s && s.closest('.row');
  return s ? { label: r.querySelector('.rlbl').textContent, btns: [...s.querySelectorAll('button')].map(b => b.dataset.v + ':' + b.textContent + (b.classList.contains('sel') ? '*' : '')) } : null; });
const rowS = (page) => page.evaluate(() => { const s = document.querySelector('#s-settings [data-set="slide"]'), r = s && s.closest('.row');
  return s ? { label: r.querySelector('.rlbl').textContent, btns: [...s.querySelectorAll('button')].map(b => b.dataset.v + ':' + b.textContent + (b.classList.contains('sel') ? '*' : '')) } : null; });
// the settings, opened again until they show (a race just started may still be on its loading screen and miss the first ask)
const settings = async (page) => { for (let k = 0; k < 20; k++) { await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
  if (await page.isVisible('#s-settings [data-set="phys"] [data-v="nova"]')) return; } };
const saved = (page) => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('tdgp-settings') || '{}').phys; } catch (_) { return null; } });
try {
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', {}, { width: 640, height: 360 });
    await settings(page);
    const r = await row(page);
    T.check('settings: the row Fizika vožnje with Klasična (marked) and Nova', r && r.label === 'Fizika vožnje' && r.btns.join(',') === 'cs:Klasična*,nova:Nova', JSON.stringify(r));
    const r2 = await rowS(page);
    T.check('settings: the row Slog nove fizike with Običajen (marked) and Drseč', r2 && r2.label === 'Slog nove fizike' && r2.btns.join(',') === '0:Običajen*,1:Drseč', JSON.stringify(r2));
    await page.click('#s-settings [data-set="lang"] [data-v="en"]'); await page.waitForTimeout(300);
    const e = await row(page);
    T.check('settings in English: Driving physics, Classic / New', e && e.label === 'Driving physics' && e.btns.join(',') === 'cs:Classic*,nova:New', JSON.stringify(e));
    const e2 = await rowS(page);
    T.check('settings in English: New physics style, Normal / Sliding', e2 && e2.label === 'New physics style' && e2.btns.join(',') === '0:Normal*,1:Sliding', JSON.stringify(e2));
    await page.click('#s-settings [data-set="lang"] [data-v="sl"]'); await page.waitForTimeout(200);
    await page.click('#s-settings [data-set="phys"] [data-v="nova"]'); await page.waitForTimeout(200);
    T.check('Nova chosen: marked and kept in the settings', (await row(page)).btns.join(',') === 'cs:Klasična,nova:Nova*' && await saved(page) === 'nova');
    await startTrack(page, 'bathurst');
    const nan = await simulate(page, 20);
    const st = await page.evaluate(() => { const r = window.__game.race; return { phys: r.opts.phys, cars: r.cars.map(c => c.phys), moving: r.cars.filter(c => c.speed > 5).length, n: r.cars.length, t: r.time }; });
    T.check('a race on Bathurst with Nova: every car (the player and the rivals) drives the new physics', st.phys === 'nova' && st.cars.length > 10 && st.cars.every(p => p === 'nova'), JSON.stringify({ phys: st.phys, cars: [...new Set(st.cars)] }));
    T.check('20 s on the autopilot: nothing NaN, the cars moving', !nan && st.moving >= st.n - 1, `${st.moving} of ${st.n} moving at ${st.t.toFixed(1)} s`);
    // back to Klasična during the race: the race keeps its physics, a toast; the next race classic
    await settings(page);
    await page.click('#s-settings [data-set="phys"] [data-v="cs"]'); await page.waitForTimeout(200);
    const tt = await page.evaluate(() => ({ toast: document.getElementById('toast').textContent, phys: window.__game.race.opts.phys, cars: [...new Set(window.__game.race.cars.map(c => c.phys))] }));
    T.check('Klasična during the race: the race keeps the new physics, a toast says it applies from the next race', tt.phys === 'nova' && tt.cars.join() === 'nova' && /naslednje dirke/.test(tt.toast), JSON.stringify(tt));
    await startTrack(page, 'spa');
    const nx = await page.evaluate(() => ({ phys: window.__game.race.opts.phys, cars: [...new Set(window.__game.race.cars.map(c => c.phys))] }));
    T.check('the next race (Spa): the classic physics', nx.phys === 'cs' && nx.cars.join() === 'cs' && await saved(page) === 'cs', JSON.stringify(nx));
    // the sliding style: Drseč with Klasična, no car has it; with Nova the player's car only
    await settings(page);
    await page.click('#s-settings [data-set="slide"] [data-v="1"]'); await page.waitForTimeout(200);
    await startTrack(page, 'spa');
    const sc = await page.evaluate(() => window.__game.race.cars.filter(c => c.nvSl).length);
    await settings(page);
    await page.click('#s-settings [data-set="phys"] [data-v="nova"]'); await page.waitForTimeout(200);
    await startTrack(page, 'bathurst');
    const sn = await page.evaluate(() => { const r = window.__game.race; return { player: !!r.player.nvSl, rivals: r.cars.filter(c => !c.isPlayer && c.nvSl).length, phys: r.opts.phys }; });
    const nan2 = await simulate(page, 8);
    T.check('Slog nove fizike: Drseč: with Nova the player\'s car slides (Car.nvSl), the rivals not; with Klasična no car; 8 s on the autopilot without NaN',
      sc === 0 && sn.player && sn.rivals === 0 && sn.phys === 'nova' && !nan2, JSON.stringify({ classic: sc, nova: sn, nan: nan2 }));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', {}, { width: 640, height: 360 });
    const KEYS = ['tAiSpr', 'tAiFol', 'tAiPush', 'tAiSide', 'tAiKerb', 'tCrStyle', 'tCrMass', 'tCrE', 'tCrMu', 'tCrYaw', 'tCrBox', 'tCrScrub', 'tCrFx'];
    const rows = () => page.evaluate((K) => K.map(k => { const g = document.querySelector(`#s-settings [data-set="${k}"]`), r = g && g.closest('.row');
      return g ? { k, label: r.querySelector('.rlbl').textContent, n: g.querySelectorAll('button').length, sel: [...g.querySelectorAll('button')].filter(b => b.classList.contains('sel')).map(b => b.dataset.v + ':' + b.textContent).join() } : { k, missing: true }; }), KEYS);
    const tx = () => page.evaluate(() => Object.assign({}, Core.TX));
    const pick = async (k, v) => { await page.click(`#s-settings [data-set="${k}"] [data-v="${v}"]`); await page.waitForTimeout(150); };
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    const cat = () => page.evaluate(() => { const d = document.getElementById('set-test'); return d ? { open: d.open, cat: d.querySelector('summary').textContent, subs: [...d.querySelectorAll('.set-sub')].map(e => e.textContent), inside: d.querySelectorAll('[data-set^="tAi"], [data-set^="tCr"]').length, after: !!d.previousElementSibling.querySelector('[data-act="prof-export"]') } : null; });
    const c0 = await cat(), r0 = await rows(), t0 = await tx();
    T.check('Preizkus: its own category in the settings (after the profile row), folded, with the two groups Tekmeci and Trki med avti and the 13 rows inside',
      c0 && !c0.open && c0.cat === 'Preizkus: tekmeci in trki' && c0.subs.join() === 'Tekmeci,Trki med avti' && c0.inside === 13 && c0.after, JSON.stringify(c0));
    await page.click('#set-test > summary'); await page.waitForTimeout(150);
    T.check('Preizkus: a tap on its title opens it, the rows can be pressed', (await cat()).open && await page.isVisible('#s-settings [data-set="tCrE"] [data-v="1"]'));
    T.check('Preizkus: 13 rows, each on Privzeto on a fresh profile, Core.TX all null',
      r0.every(r => !r.missing && r.sel === '0:Privzeto') && r0.slice(0, 5).map(r => r.label).join() === 'Razpon hitrosti,Razmik za avtom,Pritisk na avto pred sabo,Prostor ob boku,Vožnja čez robnike' && r0.slice(5).map(r => r.label).join() === 'Slog trkov,Občutek teže,Odboj med avti,Drgnjenje ob stiku,Vrtenje ob trku,Oblika ob stiku,Potisk vstran,Iskre in blisk' && Object.values(t0).every(v => v === null), JSON.stringify({ rows: r0.map(r => r.label + ' ' + r.n + ' ' + r.sel), tx: t0 }));
    await pick('tCrStyle', 1);
    const t1 = await tx(), note1 = await page.evaluate(() => document.getElementById('cr-note').textContent); await pick('tCrE', 4); const t2 = await tx(); await pick('tAiSpr', 3); await pick('tAiFol', 2); await pick('tAiKerb', 3); await pick('tAiPush', 1); await pick('tAiSide', 3); await pick('tCrMu', 1); await pick('tCrYaw', 4);
    await pick('tCrMass', 5); await pick('tCrBox', 1); await pick('tCrScrub', 1); await pick('tCrFx', 1);
    const t3 = await tx(); await pick('tCrMass', 1); const t4 = await tx();
    T.check('Preizkus: Realističen, težak sets the bounce 0, the rub 0.5, the turn 1, the other car 8 times heavier, no sparks, flat bumpers, the tyres hold a push (the note under it says so); Velik bounce under it overrides (0.4)',
      t1.cE === 0 && t1.cMu === 0.5 && t1.cYaw === 1 && t1.cMass === 8 && t1.cFx === 0 && t1.cBox === 1 && t1.cScrub === 1 && /8-krat težji/.test(note1) && t2.cMass === 8 && t2.cE === 0.4 && t2.cMu === 0.5 && t2.cBox === 1, JSON.stringify([t1, t2, note1]));
    T.check('Preizkus: each row sets its number (spread 0.3, gap 0.5 m, kerbs 2.2 m, push none, room 0.15 m, rub none, turn 1.6, weight 16x and Enak 1, round shape, the car turns, sparks on), kept in the settings',
      t3.aiSpr === 0.3 && t3.aiFol === 0.5 && t3.aiKerb === 2.2 && t3.aiPush === 0 && t3.aiSide === 0.15 && t3.cMu === 0 && t3.cYaw === 1.6 && t3.cMass === 16 && t3.cBox === 0 && t3.cScrub === 0 && t3.cFx === 1 && t4.cMass === 1
      && await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tdgp-settings') || '{}'); return s.tAiSpr === 3 && s.tCrStyle === 1 && s.tCrE === 4 && s.tCrYaw === 4 && s.tCrMass === 1 && s.tCrBox === 1 && s.tCrScrub === 1 && s.tCrFx === 1; }), JSON.stringify([t3, t4]));
    await pick('tCrBox', 0); await pick('tCrScrub', 0);   // (the race below: the style's flat bumpers and the tyres' hold)
    await page.click('#s-settings [data-set="lang"] [data-v="en"]'); await page.waitForTimeout(300);
    const en = await rows();
    const enc = await cat();
    T.check('Preizkus in English: Test: rivals and knocks (Rivals, Knocks between cars), Pace spread / Knock style, Realistic, heavy marked / Weight feel ... Sparks and flash',
      enc.cat === 'Test: rivals and knocks' && enc.subs.join() === 'Rivals,Knocks between cars' && en[0].label === 'Pace spread' && en[5].label === 'Knock style' && en[5].sel === '1:Realistic, heavy' && en[6].label === 'Weight feel' && en[6].sel === '1:Equal' && en[9].label === 'Turn in a knock' && en[10].label === 'Shape in a knock' && en[11].label === 'Push sideways' && en[12].label === 'Sparks and flash', JSON.stringify([enc, en.map(r => r.label + ' ' + r.sel)]));
    await page.click('#s-settings [data-set="lang"] [data-v="sl"]'); await page.waitForTimeout(200);
    // a race with the rivals' spread narrow, the classic physics, the realistic knocks (flat bumpers, the tyres' hold): the paces dealt out narrower, then back on Privzeto
    const spread = () => page.evaluate(() => { const k = window.__game.race.cars.filter(c => !c.isPlayer && !c.sc).map(c => c.skill); return { w: Math.max(...k) - Math.min(...k), phys: window.__game.race.opts.phys, n: k.length }; });
    await startTrack(page, 'bathurst');
    const a = await spread(), nanA = await simulate(page, 8), txA = await tx();
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    await pick('tAiSpr', 0);
    const toast = await page.evaluate(() => document.getElementById('toast').textContent);
    for (const k of KEYS) await pick(k, 0);
    const tz = await tx();
    await startTrack(page, 'spa');
    const b = await spread();
    T.check('Preizkus: a race with the spread 0.3 and the realistic knocks: narrow paces (a third or less of the usual), nothing NaN, Core.TX kept through the race; back on Privzeto in the next race the usual spread, nothing set',
      a.phys === 'cs' && a.n > 10 && a.w < 0.05 && !nanA && txA.aiSpr === 0.3 && txA.cBox === 1 && txA.cScrub === 1 && b.w > 0.08 && Object.values(tz).every(v => v === null), JSON.stringify({ a, b, txA, tz, nanA }));
    T.check('Preizkus: the spread row says in a race it applies from the next race', /naslednje dirke/.test(toast), toast);
    // Trki med avti brez odboja: one switch in the list (before Poškodbe avtov), Izklop on a fresh profile; on: Core.TX.nb and its own knock settings
    // over the rows (a row set to something else changes nothing), the rows it stands for dimmed, a note under it; Razbijanje stays as chosen
    // (Core leaves it out of the knocks between cars); in English; off again: nothing set
    const nbs = () => page.evaluate(() => { const g = document.querySelector('#s-settings [data-set="crNB"]'), r = g && g.closest('.row');
      return g ? { label: r.querySelector('.rlbl').textContent, btns: [...g.querySelectorAll('button')].map(b => b.textContent).join(), sel: [...g.querySelectorAll('button')].filter(b => b.classList.contains('sel')).map(b => b.dataset.v).join(), before: !!r.nextElementSibling.nextElementSibling.querySelector('[data-set="damage"]'),
        dim: [...document.querySelectorAll('#s-settings .row.nbx [data-set]')].map(e => e.dataset.set).sort().join(), note: document.getElementById('nb-note').classList.contains('off') ? '' : document.getElementById('nb-note').textContent, cr: document.getElementById('cr-note').textContent } : null; });
    await page.evaluate(() => { window.__game.onAction('to-settings'); document.getElementById('set-test').open = true; }); await page.waitForTimeout(300);
    const n0 = await nbs(), x0 = await tx();
    await pick('tCrE', 5); await pick('xBump', 1); await pick('crNB', 1);
    const n1 = await nbs(), x1 = await tx(), xr1 = await page.evaluate(() => Core.XR.bump);
    T.check('Trki med avti brez odboja: one row before Poškodbe avtov (Izklop, Vklop), Izklop on a fresh profile and nothing set; Vklop: Core.TX.nb 1 with no bounce, no turn, 8x, flat bumpers, the tyres\' hold, sparks on, over the row Odboj med avti set to Zelo velik; the 9 rows it stands for dimmed, a note under it and in Preizkus; Razbijanje: odboji in vrtenje kept as chosen',
      n0 && n0.label === 'Trki med avti brez odboja' && n0.btns === 'Izklop,Vklop' && n0.sel === '0' && n0.before && !n0.dim && !n0.note && x0.nb === null
      && n1.sel === '1' && x1.nb === 1 && x1.cE === 0 && x1.cYaw === 0 && x1.cMass === 8 && x1.cBox === 1 && x1.cScrub === 1 && x1.cFx === 1 && n1.dim === 'tCrBox,tCrE,tCrFx,tCrMass,tCrMu,tCrScrub,tCrStyle,tCrYaw,xBump' && /ne veljajo/.test(n1.note) && /vklopljen/.test(n1.cr) && xr1 === 1
      && await page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-settings') || '{}').crNB === 1), JSON.stringify({ n0, n1, x1 }));
    await page.click('#s-settings [data-set="lang"] [data-v="en"]'); await page.waitForTimeout(300);
    const ne = await nbs();
    await page.click('#s-settings [data-set="lang"] [data-v="sl"]'); await page.waitForTimeout(200);
    await pick('crNB', 0); await pick('tCrE', 0); await pick('xBump', 0);
    const n2 = await nbs(), x2 = await tx();
    T.check('Trki med avti brez odboja in English (Car knocks without bounce: Off / On, the note), off again: nothing set, no row dimmed',
      ne.label === 'Car knocks without bounce' && ne.btns === 'Off,On' && /do not apply/.test(ne.note) && n2.sel === '0' && !n2.dim && !n2.note && Object.values(x2).every(v => v === null), JSON.stringify({ ne, n2, x2 }));
    T.check('Preizkus: no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
