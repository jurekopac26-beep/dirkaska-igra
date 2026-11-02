// The driving physics in the settings (Nastavitve → Fizika vožnje: Klasična / Nova; js/game.js S.phys, Core's Car.stepNova):
// - the row is in the settings with both choices, Klasična marked on a fresh profile; in English "Driving physics: Classic / New"
// - Nova chosen: kept in the settings (localStorage), a race on Bathurst runs with the new physics for every car (the player's and the
//   rivals'), 20 s on the autopilot: nothing NaN, the cars moving, no errors on the page
// - switched back to Klasična during that race: the race keeps its physics, a toast says it applies from the next race; the next race classic
// - the row Slog nove fizike (Običajen marked on a fresh profile; in English "New physics style: Normal / Sliding"): Drseč chosen with Nova,
//   the next race's player car has the sliding style (Car.nvSl), the rivals not; with Klasična no car has it
// - Trki med avti (one row before Poškodbe avtov: Simulacija, Arkadna, Mehka, Kaskaderska, Stara; js/game.js S.crV, Core.setTest cv 1-5):
//   Simulacija marked on a fresh profile, Core.TX.cv 1 and the other keys null; each version sets its cv at once and writes its sentence under
//   the row; Stara (the old knock) dims the knock rows of Preizkus (they keep their choice, its note says they do not apply), the other
//   versions dim Razbijanje: odboji in vrtenje ob trku (only the old knock has it; with Stara it applies: Core.XR.bump); kept in the settings;
//   in English (Car knocks: Simulation / Arcade / Soft / Stunt / Old)
// - Preizkus: tekmeci in trki (Nastavitve: its own folded category after the profile row, with 5 rows Tekmeci and 7 rows Trki med avti over
//   the chosen version's numbers; Core.setTest): the category folded and the 12 rows inside it, all on Privzeto on a fresh profile; every level
//   of every knock row sets its number in Core.TX (cPm, cE, cMu, cYaw, cGl, cSl, cFx), Privzeto none (the version's own); the rivals' rows
//   theirs; kept in the settings (localStorage); in English; a race with the rivals' spread narrower deals out narrower paces, back on
//   Privzeto the old ones and nothing set; the spread's toast says from the next race
// - the pause in that race: the row Trki med avti under the buttons, in sight and within the panel on a phone on its side (640×360) and
//   upright (360×640), smaller letters if need be; the pause scrolls to its last row (the tyres'); Arkadna picked there: Core.TX.cv 2 at once,
//   marked in the pause and in the settings, kept; the next pause starts from the top; the race runs on without NaN
// - stored values out of range or from the rows before the versions (crNB, tCrStyle, tCrE ...): Simulacija and Privzeto, nothing set; saved
//   again without the old keys
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
    const AI = ['tAiSpr', 'tAiFol', 'tAiPush', 'tAiSide', 'tAiKerb'], CR = ['crPm', 'crE', 'crMu', 'crYaw', 'crGl', 'crSl', 'crFx'], KEYS = AI.concat(CR), CRD = CR.slice().sort().join();
    // each knock row of Preizkus: its key in Core.TX and the numbers of its levels 1, 2 ... (0 Privzeto: null, the version's own)
    const LV = { crPm: ['cPm', [1, 1.5, 2]], crE: ['cE', [0, 0.5, 1.6]], crMu: ['cMu', [0, 0.15, 0.35, 0.6]], crYaw: ['cYaw', [0.4, 0.7, 1, 1.4]], crGl: ['cGl', [0, 0.5, 1.6]], crSl: ['cSl', [0.6, 1, 1.6]], crFx: ['cFx', [1, 0]] };
    const rows = () => page.evaluate((K) => K.map(k => { const g = document.querySelector(`#s-settings [data-set="${k}"]`), r = g && g.closest('.row');
      return g ? { k, label: r.querySelector('.rlbl').textContent, btns: [...g.querySelectorAll('button')].map(b => b.textContent).join(), sel: [...g.querySelectorAll('button')].filter(b => b.classList.contains('sel')).map(b => b.dataset.v + ':' + b.textContent).join() } : { k, missing: true }; }), KEYS);
    const tx = () => page.evaluate(() => Object.assign({}, Core.TX));
    const none = (t) => t.cv === 1 && Object.keys(t).filter(k => k !== 'cv').every(k => t[k] === null);   // (nothing set: the default version, Simulacija)
    const pick = async (k, v) => { await page.click(`#s-settings [data-set="${k}"] [data-v="${v}"]`); await page.waitForTimeout(150); };
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-settings') || '{}'));
    // the version row in the list (Trki med avti), its note, the note of Preizkus' knock rows, the rows dimmed
    const ver = () => page.evaluate(() => { const g = document.querySelector('#s-settings [data-set="crV"]'), r = g && g.closest('.row');
      return g ? { label: r.querySelector('.rlbl').textContent, btns: [...g.querySelectorAll('button')].map(b => b.textContent).join(), sel: [...g.querySelectorAll('button')].filter(b => b.classList.contains('sel')).map(b => b.dataset.v).join(),
        before: r.nextElementSibling.id === 'crv-note' && !!r.nextElementSibling.nextElementSibling.querySelector('[data-set="damage"]'), note: document.getElementById('crv-note').textContent, cr: document.getElementById('cr-note').textContent,
        dim: [...document.querySelectorAll('#s-settings .row.nbx [data-set]')].map(e => e.dataset.set).sort().join() } : null; });
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    const cat = () => page.evaluate(() => { const d = document.getElementById('set-test'); return d ? { open: d.open, cat: d.querySelector('summary').textContent, subs: [...d.querySelectorAll('.set-sub')].map(e => e.textContent), inside: d.querySelectorAll('[data-set^="tAi"], [data-set^="cr"]').length, after: !!d.previousElementSibling.querySelector('[data-act="prof-export"]') } : null; });
    const c0 = await cat(), r0 = await rows(), t0 = await tx(), v0 = await ver();
    T.check('Preizkus: its own category in the settings (after the profile row), folded, with the two groups Tekmeci and Trki med avti and the 12 rows inside',
      c0 && !c0.open && c0.cat === 'Preizkus: tekmeci in trki' && c0.subs.join() === 'Tekmeci,Trki med avti' && c0.inside === 12 && c0.after, JSON.stringify(c0));
    await page.click('#set-test > summary'); await page.waitForTimeout(150);
    T.check('Preizkus: a tap on its title opens it, the rows can be pressed', (await cat()).open && await page.isVisible('#s-settings [data-set="crE"] [data-v="1"]'));
    T.check('Trki med avti: one row before Poškodbe avtov (Simulacija, Arkadna, Mehka, Kaskaderska, Stara), Simulacija marked on a fresh profile with its sentence under it; Preizkus: 12 rows, each on Privzeto, its knock rows over Simulacija; Core.TX: cv 1, nothing else set; Razbijanje: odboji in vrtenje ob trku dimmed (only Stara has it)',
      v0 && v0.label === 'Trki med avti' && v0.btns === 'Simulacija,Arkadna,Mehka,Kaskaderska,Stara' && v0.sel === '0' && v0.before && /^Kot v simulacijah/.test(v0.note) && /\(Simulacija\)/.test(v0.cr) && v0.dim === 'xBump'
      && r0.every(r => !r.missing && r.sel === '0:Privzeto') && r0.slice(0, 5).map(r => r.label).join() === 'Razpon hitrosti,Razmik za avtom,Pritisk na avto pred sabo,Prostor ob boku,Vožnja čez robnike'
      && r0.slice(5).map(r => r.label + ': ' + r.btns).join(' | ') === 'Teža tvojega avta: Privzeto,Enaka,1,5×,2× | Odboj: Privzeto,Brez,Pol,Večji | Drgnjenje ob stiku: Privzeto,Brez,Malo,Srednje,Močno | Vrtenje ob trku: Privzeto,Malo,Srednje,Polno,Več | Zdrs po trku: Privzeto,Brez,Manj,Več | Ujem gum: Privzeto,Hiter,Realen,Počasen | Iskre ob trku: Privzeto,Vklop,Izklop'
      && none(t0), JSON.stringify({ v0, rows: r0.map(r => r.label + ': ' + r.btns + ' ' + r.sel), tx: t0 }));
    // every level of every knock row: its number in Core.TX at once; Privzeto again: none (the version's own)
    const bad = [];
    for (const k of CR) { const [key, lv] = LV[k];
      for (let i = 0; i < lv.length; i++) { await pick(k, i + 1); const t = await tx(); if (t[key] !== lv[i]) bad.push(`${k} ${i + 1}: ${key} ${t[key]}, not ${lv[i]}`); }
      await pick(k, 0); const t = await tx(); if (t[key] !== null) bad.push(`${k} Privzeto: ${key} ${t[key]}`); }
    T.check('Preizkus: every level of the 7 knock rows sets its number at once (weight 1, 1.5, 2; bounce 0, 0.5, 1.6; rub 0, 0.15, 0.35, 0.6; turn 0.4, 0.7, 1, 1.4; slide 0, 0.5, 1.6; tyre catch 0.6, 1, 1.6; sparks 1, 0), Privzeto none', !bad.length, bad.join(' | '));
    // the five versions: Core.TX.cv 1-5 and the sentence under the row; Simulacija to Kaskaderska: Razbijanje dimmed, the note of Preizkus names
    // the version; Stara: the 7 knock rows of Preizkus dimmed, their note says they do not apply
    const vs = [], NOTE = [/^Kot v simulacijah/, /^Kot v arkadnih igrah/, /^Mehak stik/, /^Močni trki/, /^Trki kot prej/];
    for (let v = 0; v < 5; v++) { await pick('crV', v); vs.push(Object.assign(await ver(), { cv: (await tx()).cv, st: (await stored()).crV })); }
    T.check('Trki med avti: each version sets Core.TX.cv 1-5 at once, its sentence under the row, kept in the settings; Simulacija to Kaskaderska dim Razbijanje: odboji in vrtenje ob trku and the note in Preizkus names them; Stara dims the 7 knock rows of Preizkus instead (they do not apply)',
      vs.every((x, v) => x.cv === v + 1 && x.sel === String(v) && x.st === v && NOTE[v].test(x.note)) && vs.slice(0, 4).every((x, v) => x.dim === 'xBump' && x.cr.includes('(' + ['Simulacija', 'Arkadna', 'Mehka', 'Kaskaderska'][v] + ')'))
      && vs[4].dim === CRD && /ne veljajo/.test(vs[4].cr), JSON.stringify(vs.map(x => ({ sel: x.sel, cv: x.cv, st: x.st, dim: x.dim, note: x.note.slice(0, 24), cr: x.cr.slice(0, 50) }))));
    await pick('crV', 3); await pick('tAiSpr', 3); await pick('tAiFol', 2); await pick('tAiKerb', 3); await pick('tAiPush', 1); await pick('tAiSide', 3);
    await pick('crPm', 3); await pick('crE', 2); await pick('crMu', 2); await pick('crYaw', 4); await pick('crGl', 1); await pick('crSl', 3); await pick('crFx', 2);
    const t3 = await tx(), s3 = await stored();
    T.check('Trki med avti and Preizkus together: Kaskaderska (cv 4) with the weight 2x, half the bounce, the rub 0.15, the turn 1.4, no grip lost, the tyres slow, no sparks; the rivals (spread 0.3, gap 0.5 m, kerbs 2.2 m, push none, room 0.15 m); kept in the settings',
      t3.cv === 4 && t3.cPm === 2 && t3.cE === 0.5 && t3.cMu === 0.15 && t3.cYaw === 1.4 && t3.cGl === 0 && t3.cSl === 1.6 && t3.cFx === 0 && t3.aiSpr === 0.3 && t3.aiFol === 0.5 && t3.aiKerb === 2.2 && t3.aiPush === 0 && t3.aiSide === 0.15
      && s3.crV === 3 && s3.crPm === 3 && s3.crE === 2 && s3.crMu === 2 && s3.crYaw === 4 && s3.crGl === 1 && s3.crSl === 3 && s3.crFx === 2 && s3.tAiSpr === 3 && s3.tAiKerb === 3, JSON.stringify({ t3, s3: ['crV'].concat(KEYS).map(k => k + ':' + s3[k]).join(' ') }));
    await page.click('#s-settings [data-set="lang"] [data-v="en"]'); await page.waitForTimeout(300);
    const en = await rows(), enc = await cat(), ev = await ver();
    T.check('in English: Car knocks (Simulation / Arcade / Soft / Stunt / Old, Stunt marked, its sentence); Test: rivals and knocks (Rivals, Car knocks): Pace spread ... Your car’s weight (2× marked), Bounce, Rub on contact, Turn in a knock, Slide after a knock, Tyre catch, Sparks in a knock (Off marked)',
      ev.label === 'Car knocks' && ev.btns === 'Simulation,Arcade,Soft,Stunt,Old' && ev.sel === '3' && /^Hard knocks/.test(ev.note) && /\(Stunt\)/.test(ev.cr)
      && enc.cat === 'Test: rivals and knocks' && enc.subs.join() === 'Rivals,Car knocks' && en[0].label === 'Pace spread'
      && en.slice(5).map(r => r.label).join() === 'Your car’s weight,Bounce,Rub on contact,Turn in a knock,Slide after a knock,Tyre catch,Sparks in a knock'
      && en[5].btns === 'Default,Equal,1.5×,2×' && en[5].sel === '3:2×' && en[6].btns === 'Default,None,Half,More' && en[10].btns === 'Default,Quick,Real,Slow' && en[11].sel === '2:Off', JSON.stringify({ ev, enc, en: en.map(r => r.label + ': ' + r.btns + ' ' + r.sel) }));
    await page.click('#s-settings [data-set="lang"] [data-v="sl"]'); await page.waitForTimeout(200);
    // a race with the rivals' spread narrow, the classic physics, Kaskaderska with the rows over it: the paces dealt out narrower, the knocks kept
    // through the race; then back on Privzeto
    const spread = () => page.evaluate(() => { const k = window.__game.race.cars.filter(c => !c.isPlayer && !c.sc).map(c => c.skill); return { w: Math.max(...k) - Math.min(...k), phys: window.__game.race.opts.phys, n: k.length }; });
    await startTrack(page, 'bathurst');
    const a = await spread(), nanA = await simulate(page, 8), txA = await tx();
    // the pause (a race with tyres: the strategy and the tyres' row under it too): the row Trki med avti under the buttons, in sight, its choices
    // within the panel; on its side and upright
    const prow = () => page.evaluate(async () => { const raf = () => new Promise(q => requestAnimationFrame(q)); await raf(); await raf();
      const row = document.getElementById('crv-prow'), body = document.getElementById('pause-body'), seg = row.querySelector('.seg'), b = body.getBoundingClientRect(), r = row.getBoundingClientRect();
      const inside = (q) => q.left >= b.left - 1 && q.right <= b.right + 1 && q.top >= b.top - 1 && q.bottom <= b.bottom + 1;
      return { screen: window.__game.screen, shown: getComputedStyle(row).display !== 'none' && r.height > 0, label: row.querySelector('.rlbl').textContent, btns: [...seg.querySelectorAll('button')].map(x => x.textContent + (x.classList.contains('sel') ? '*' : '')).join(),
        fit: seg.scrollWidth <= seg.clientWidth + 1 && [...seg.querySelectorAll('button')].every(x => inside(x.getBoundingClientRect())), inView: inside(r), top: body.scrollTop, pit: !document.getElementById('pit-row').classList.contains('off') }; });
    await page.evaluate(() => window.__game.pause());
    const p1 = await prow();
    await page.setViewportSize({ width: 360, height: 640 }); await page.waitForTimeout(300);
    const p2 = await prow();
    await page.setViewportSize({ width: 640, height: 360 }); await page.waitForTimeout(300);
    T.check('the pause: the row Trki med avti under its buttons (Kaskaderska marked), in sight and its five choices within the panel on a phone on its side (640×360) and upright (360×640)',
      [p1, p2].every(p => p.screen === 'pause' && p.shown && p.label === 'Trki med avti' && p.btns === 'Simulacija,Arkadna,Mehka,Kaskaderska*,Stara' && p.fit && p.inView && p.top === 0), JSON.stringify({ p1, p2 }));
    await page.click('#s-pause [data-set="crV"] [data-v="1"]'); await page.waitForTimeout(150);
    const pa = await page.evaluate(() => ({ cv: Core.TX.cv, cPm: Core.TX.cPm, aiSpr: Core.TX.aiSpr, pause: [...document.querySelectorAll('#s-pause [data-set="crV"] .sel')].map(b => b.textContent).join(), list: [...document.querySelectorAll('#s-settings [data-set="crV"] .sel')].map(b => b.textContent).join(),
      screen: window.__game.screen, stored: JSON.parse(localStorage.getItem('tdgp-settings')).crV }));
    // its last row in reach (the panel scrolls), the next pause from the top again
    const sc = await page.evaluate(async () => { const raf = () => new Promise(q => requestAnimationFrame(q)), g = window.__game, body = document.getElementById('pause-body'), pit = document.getElementById('pit-row');
      body.scrollTop = body.scrollHeight; await raf(); const b = body.getBoundingClientRect(), r = pit.getBoundingClientRect(), end = r.top >= b.top - 1 && r.bottom <= b.bottom + 1, scrolled = body.scrollTop;
      g.resume(); await raf(); g.pause(); await raf(); return { end, scrolled, top: body.scrollTop, screen: g.screen }; });
    T.check('the pause: Arkadna picked there applies at once (Core.TX.cv 2, the rows of Preizkus kept), marked in the pause and in the settings, kept; its last row (the tyres\') in reach by scrolling; the next pause from the top',
      pa.cv === 2 && pa.cPm === 2 && pa.aiSpr === 0.3 && pa.pause === 'Arkadna' && pa.list === 'Arkadna' && pa.screen === 'pause' && pa.stored === 1 && p1.pit && sc.end && sc.scrolled > 0 && sc.top === 0 && sc.screen === 'pause', JSON.stringify({ pa, sc }));
    await page.evaluate(() => window.__game.resume());
    const nanP = await simulate(page, 4), cvP = (await tx()).cv;
    T.check('the race runs on with Arkadna: 4 s on the autopilot without NaN, Core.TX.cv still 2', !nanP && cvP === 2, JSON.stringify({ nanP, cvP }));
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    await pick('tAiSpr', 0);
    const toast = await page.evaluate(() => document.getElementById('toast').textContent);
    for (const k of KEYS) await pick(k, 0);
    await pick('crV', 0);
    const tz = await tx();
    await startTrack(page, 'spa');
    const b = await spread();
    T.check('Preizkus: a race with the spread 0.3 and Kaskaderska with the rows over it: narrow paces (a third or less of the usual), nothing NaN, Core.TX kept through the race; back on Privzeto and Simulacija in the next race the usual spread, nothing set',
      a.phys === 'cs' && a.n > 10 && a.w < 0.05 && !nanA && txA.aiSpr === 0.3 && txA.cv === 4 && txA.cPm === 2 && txA.cSl === 1.6 && b.w > 0.08 && none(tz), JSON.stringify({ a, b, txA, tz, nanA }));
    T.check('Preizkus: the spread row says in a race it applies from the next race', /naslednje dirke/.test(toast), toast);
    // Stara: the old knock (Core.TX.cv 5): the knock rows of Preizkus keep their choice (Core leaves them out), dimmed; Razbijanje: odboji in
    // vrtenje ob trku applies (Core.XR.bump as chosen); in English; Simulacija again: nothing set
    await page.evaluate(() => { window.__game.onAction('to-settings'); document.getElementById('set-test').open = true; }); await page.waitForTimeout(300);
    await pick('crE', 3); await pick('xBump', 1); await pick('crV', 4);
    const o1 = await ver(), x1 = await tx(), xr1 = await page.evaluate(() => Core.XR.bump), r1 = await rows();
    T.check('Stara: Core.TX.cv 5, the 7 knock rows of Preizkus dimmed and keeping their choice (Odboj: Večji, cE 1.6), their note says they do not apply; Razbijanje: odboji in vrtenje ob trku not dimmed and on (Core.XR.bump 1)',
      x1.cv === 5 && x1.cE === 1.6 && o1.sel === '4' && o1.dim === CRD && /ne veljajo/.test(o1.cr) && /^Trki kot prej/.test(o1.note) && xr1 === 1 && r1[6].sel === '3:Večji', JSON.stringify({ o1, x1, xr1 }));
    await page.click('#s-settings [data-set="lang"] [data-v="en"]'); await page.waitForTimeout(300);
    const oe = await ver();
    await page.click('#s-settings [data-set="lang"] [data-v="sl"]'); await page.waitForTimeout(200);
    await pick('crV', 0); await pick('crE', 0); await pick('xBump', 0);
    const o2 = await ver(), x2 = await tx();
    T.check('Stara in English (Old marked, "The knocks as before", the rows "do not apply"); Simulacija again: only Razbijanje dimmed, nothing set',
      oe.sel === '4' && /^The knocks as before/.test(oe.note) && /do not apply/.test(oe.cr) && o2.sel === '0' && o2.dim === 'xBump' && none(x2), JSON.stringify({ oe, o2, x2 }));
    T.check('Preizkus: no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  {
    // stored values out of range or from the rows before the versions (Trki med avti brez odboja, Slog trkov, Odboj med avti, Občutek teže):
    // Simulacija and Privzeto, nothing set; saved again without the old keys
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { crV: 9, crPm: 7, crMu: 'x', crYaw: -1, crSl: 1.5, crNB: 1, tCrStyle: 1, tCrE: 4, tCrMass: 5 }, { width: 640, height: 360 });
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    const j = await page.evaluate(() => ({ tx: Object.assign({}, Core.TX), sel: ['crV', 'crPm', 'crMu', 'crYaw', 'crSl'].map(k => document.querySelector(`#s-settings [data-set="${k}"] .sel`).dataset.v).join() }));
    await page.click('#s-settings [data-set="crV"] [data-v="0"]'); await page.waitForTimeout(150);
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-settings') || '{}'));
    T.check('stored values out of range or from the old rows (crV 9, crPm 7, crMu x, crYaw -1, crSl 1.5, crNB, tCrStyle, tCrE, tCrMass): Simulacija and Privzeto marked, nothing set; saved again without the old keys',
      j.sel === '0,0,0,0,0' && j.tx.cv === 1 && Object.keys(j.tx).filter(k => k !== 'cv').every(k => j.tx[k] === null) && s.crV === 0 && s.crPm === 0 && s.crMu === 0 && s.crYaw === 0 && s.crSl === 0
      && !['crNB', 'tCrStyle', 'tCrE', 'tCrMass'].some(k => k in s), JSON.stringify({ j, s: ['crV', 'crPm', 'crMu', 'crYaw', 'crSl', 'crNB', 'tCrStyle', 'tCrE', 'tCrMass'].map(k => k + ':' + s[k]).join(' ') }));
    T.check('stored values: no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
