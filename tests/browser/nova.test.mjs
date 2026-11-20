// The driving physics in the settings (Nastavitve → Fizika vožnje: Klasična / Nova; js/game.js S.phys, Core's Car.stepNova):
// - the row is in the settings with both choices, Klasična marked on a fresh profile; in English "Driving physics: Classic / New"
// - Nova chosen: kept in the settings (localStorage), a race on Bathurst runs with the new physics for every car (the player's and the
//   rivals'), 20 s on the autopilot: nothing NaN, the cars moving, no errors on the page
// - switched back to Klasična during that race: the race keeps its physics, a toast says it applies from the next race; the next race classic
// - the row Slog nove fizike (Običajen marked on a fresh profile; in English "New physics style: Normal / Sliding"): Drseč chosen with Nova,
//   the next race's player car has the sliding style (Car.nvSl), the rivals not; with Klasična no car has it
// - Trki (the user's buttons of 10. 11. 2026; one row before Poškodbe avtov: Realistično, Kot zdaj; js/game.js S.crV 5 and 0; the older
//   versions Arkadna, Mehka, Kaskaderska, Stara, crV 1 to 4, are a row of Preizkus, Starejše različice; Core.setTest cv = crV + 1, 1-6):
//   the tests' own settings have Kot zdaj (lib.mjs, crV 0: the version Simulacija, which the tests were written for), so Kot zdaj marked,
//   Core.TX.cv 1 and the other keys null; each version sets its cv at once and writes its sentence under the row Trki (an older one named
//   before it: Izbrana je starejša različica iz Preizkusa); Stara (the old knock) dims the knock rows of Preizkus (they keep their choice,
//   its note says they do not apply), the other versions dim Razbijanje: odboji in vrtenje ob trku (only the old knock has it; with Stara it
//   applies: Core.XR.bump); with Nova fizika the rows Zdrs po trku and Ujem gum dimmed too (the classic physics' only), the note says so;
//   kept in the settings; in English (Knocks: Realistic / As now; Older versions: Arcade / Soft / Stunt / Old); back in Slovenian on a narrow
//   phone (320×640) the rows of choices fitted again for the longer words, none cut off (Trki's two on one line, the older four on one line
//   or two and two); on an upright phone (360×640) too
// - Preizkus: tekmeci in trki (Nastavitve: its own folded category after the profile row, with 5 rows Tekmeci, then Trki med avti: the row
//   Starejše različice and 7 rows over the chosen version's numbers; Core.setTest): the category folded and the 13 rows inside it, the 12
//   with levels on Privzeto; every level of every knock row sets its number in Core.TX (cPm, cE, cMu, cYaw, cGl, cSl, cFx), Privzeto none
//   (the version's own); the rivals' rows theirs; kept in the settings (localStorage); in English; a race with the rivals' spread narrower
//   deals out narrower paces, back on Privzeto the old ones and nothing set; the spread's toast says from the next race
// - the pause in that race: the row Trki under the buttons (Realistično, Kot zdaj; neither marked while an older version is chosen), in
//   sight and within the panel (the tyres' row too) on a phone on its side (640×360), upright (360×640), on a computer (1280×720: the
//   narrow panel, the choices under their label) and on a narrow phone (320×640), its two on one line; the pause scrolls to its last row
//   (the tyres'); Realistično picked there: Core.TX.cv 6 at once, then Kot zdaj: Core.TX.cv 1 at once, marked in the pause and in the
//   settings, kept; the next pause starts from the top; the race runs on without NaN
// - stored values out of range or from the rows before the versions (crNB, tCrStyle, tCrE ...): Realistično (the game's default),
//   Privzeto, Odpadli deli Vklop and Odpadlo kolo Konec dirke, nothing else set; saved again without the old keys; a stored Realistično
//   (crV 5) is taken as it is: marked, Core.TX.cv 6; with it the pause before the start (the buttons one to a row) on an upright phone
//   (360×640): the row's two on one line, all of the pause in sight without scrolling
// - Odpadli deli (Izklop, Vklop; S.debris: Izklop is Core.TX.deb 0, at once) and Odpadlo kolo (Konec dirke, Dirka teče naprej;
//   S.wheelOver: the race's wheel rule, Race opts.wheelRule, from the next race; picked in a race a toast says so): the two rows after
//   Poškodbe avtov, Vklop and Konec dirke marked; kept in the settings; in English (Debris: Off / On; Lost wheel: Race over / Race goes on)
// - a new player (nothing stored): Trki Realistično (Core.TX.cv 6), Poškodbe avtov Samo videz, Odpadli deli Vklop, Odpadlo kolo Konec
//   dirke; an existing player (settings from before the buttons, Mehka; no tdgp-defaults-v6): moved once to Realistično, Vklop and Konec
//   dirke, Poškodbe avtov as chosen; a choice after that kept over a reload
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
    const dimmed = () => page.evaluate(() => [...document.querySelectorAll('#s-settings .row.nbx [data-set]')].map(e => e.dataset.set).filter(k => k === 'crGl' || k === 'crSl').sort().join());
    const dimNova = await dimmed();   // (Zdrs po trku, Ujem gum: by the physics of the race that runs, the new one, though the setting says Klasična)
    await startTrack(page, 'spa');
    const nx = await page.evaluate(() => ({ phys: window.__game.race.opts.phys, cars: [...new Set(window.__game.race.cars.map(c => c.phys))] }));
    await settings(page); const dimCs = await dimmed();
    T.check('the next race (Spa): the classic physics; Zdrs po trku and Ujem gum dimmed by the physics of the race that runs (the Nova race after the switch: dimmed; the classic one: not)', nx.phys === 'cs' && nx.cars.join() === 'cs' && await saved(page) === 'cs' && dimNova === 'crGl,crSl' && dimCs === '', JSON.stringify({ nx, dimNova, dimCs }));
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
    const LV = { crPm: ['cPm', [1, 1.5, 2]], crE: ['cE', [0, 0.5, 1.6]], crMu: ['cMu', [0, 0.15, 0.35, 0.6]], crYaw: ['cYaw', [0.4, 0.7, 1, 2]], crGl: ['cGl', [0, 0.5, 1.6]], crSl: ['cSl', [0.6, 1, 1.6]], crFx: ['cFx', [1, 0]] };
    const rows = () => page.evaluate((K) => K.map(k => { const g = document.querySelector(`#s-settings [data-set="${k}"]`), r = g && g.closest('.row');
      return g ? { k, label: r.querySelector('.rlbl').textContent, btns: [...g.querySelectorAll('button')].map(b => b.textContent).join(), sel: [...g.querySelectorAll('button')].filter(b => b.classList.contains('sel')).map(b => b.dataset.v + ':' + b.textContent).join() } : { k, missing: true }; }), KEYS);
    const tx = () => page.evaluate(() => Object.assign({}, Core.TX));
    const none = (t) => t.cv === 1 && Object.keys(t).filter(k => k !== 'cv').every(k => t[k] === null);   // (nothing set: Kot zdaj, the version Simulacija: the tests' own choice, lib.mjs, and the core's own)
    const pick = async (k, v) => { await page.click(`#s-settings [data-set="${k}"] [data-v="${v}"]`); await page.waitForTimeout(150); };
    const pickH = async (k, v) => { await page.evaluate(([k, v]) => document.querySelector(`#s-settings [data-set="${k}"] [data-v="${v}"]`).click(), [k, v]); await page.waitForTimeout(150); };   // (a row Nastavitve keep hidden: Razbijanje, paket P1)
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-settings') || '{}'));
    // the version row in the list (Trki: Realistično, Kot zdaj) and the older versions' row of Preizkus (old; all: what is marked in the two rows
    // together, one button), the row's note, the note of Preizkus' knock rows, the rows dimmed
    const ver = () => page.evaluate(() => { const gs = [...document.querySelectorAll('#s-settings [data-set="crV"]')], g = gs[0], r = g && g.closest('.row'), o = gs[1], ro = o && o.closest('.row');
      const bt = (x) => [...x.querySelectorAll('button')].map(b => b.textContent).join(), vl = (x) => [...x.querySelectorAll('button')].map(b => b.dataset.v).join(), sl = (x) => [...x.querySelectorAll('button')].filter(b => b.classList.contains('sel')).map(b => b.dataset.v).join();
      return g ? { label: r.querySelector('.rlbl').textContent, btns: bt(g), vals: vl(g), sel: sl(g), n: gs.length, all: gs.map(sl).filter(Boolean).join(),
        old: o ? { label: ro.querySelector('.rlbl').textContent, btns: bt(o), vals: vl(o), sel: sl(o), inTest: !!o.closest('#set-test'), note: !!ro.nextElementSibling && ro.nextElementSibling.id === 'cr-note' } : null,
        before: r.nextElementSibling.id === 'crv-note' && !!r.nextElementSibling.nextElementSibling.querySelector('[data-set="damage"]'), note: document.getElementById('crv-note').textContent, cr: document.getElementById('cr-note').textContent,
        dim: [...document.querySelectorAll('#s-settings .row.nbx [data-set]')].map(e => e.dataset.set).sort().join() } : null; });
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    const cat = () => page.evaluate(() => { const d = document.getElementById('set-test'); return d ? { open: d.open, cat: d.querySelector('summary').textContent, subs: [...d.querySelectorAll('.set-sub')].map(e => e.textContent), inside: d.querySelectorAll('[data-set^="tAi"], [data-set^="cr"]').length, after: !!d.previousElementSibling.querySelector('[data-act="prof-export"]') } : null; });
    const c0 = await cat(), r0 = await rows(), t0 = await tx(), v0 = await ver();
    T.check('Preizkus: its own category in the settings (after the profile row), folded, with the two groups Tekmeci and Trki med avti and the 13 rows inside (the older versions\' row among them)',
      c0 && !c0.open && c0.cat === 'Preizkus: tekmeci in trki' && c0.subs.join() === 'Tekmeci,Trki med avti' && c0.inside === 13 && c0.after, JSON.stringify(c0));
    await page.click('#set-test > summary'); await page.waitForTimeout(150);
    T.check('Preizkus: a tap on its title opens it, the rows can be pressed', (await cat()).open && await page.isVisible('#s-settings [data-set="crE"] [data-v="1"]'));
    T.check('Trki: one row before Poškodbe avtov (Realistično, Kot zdaj), Kot zdaj marked (the tests\' own settings) with its sentence under it; the older versions a row of Preizkus before the note of its knock rows (Starejše različice: Arkadna, Mehka, Kaskaderska, Stara, none marked); Preizkus: 12 rows with levels, each on Privzeto, its knock rows over Kot zdaj; Core.TX: cv 1, nothing else set; Razbijanje: odboji in vrtenje ob trku dimmed (only Stara has it)',
      v0 && v0.label === 'Trki' && v0.btns === 'Realistično,Kot zdaj' && v0.vals === '5,0' && v0.sel === '0' && v0.all === '0' && v0.n === 2 && v0.before && /^Trki kot do zdaj \(različica Simulacija\)/.test(v0.note) && /\(Kot zdaj\)/.test(v0.cr) && v0.dim === 'xBump'
      && !!v0.old && v0.old.label === 'Starejše različice' && v0.old.btns === 'Arkadna,Mehka,Kaskaderska,Stara' && v0.old.vals === '1,2,3,4' && v0.old.sel === '' && v0.old.inTest && v0.old.note
      && r0.every(r => !r.missing && r.sel === '0:Privzeto') && r0.slice(0, 5).map(r => r.label).join() === 'Razpon hitrosti,Razmik za avtom,Pritisk na avto pred sabo,Prostor ob boku,Vožnja čez robnike'
      && r0.slice(5).map(r => r.label + ': ' + r.btns).join(' | ') === 'Teža tvojega avta: Privzeto,Enaka,1,5×,2× | Odboj: Privzeto,Brez,Pol,Večji | Drgnjenje ob stiku: Privzeto,Brez,Malo,Srednje,Močno | Vrtenje ob trku: Privzeto,Malo,Srednje,Polno,Več | Zdrs po trku: Privzeto,Brez,Manj,Več | Ujem gum: Privzeto,Hiter,Realen,Počasen | Iskre ob trku: Privzeto,Vklop,Izklop'
      && none(t0), JSON.stringify({ v0, rows: r0.map(r => r.label + ': ' + r.btns + ' ' + r.sel), tx: t0 }));
    // every level of every knock row: its number in Core.TX at once; Privzeto again: none (the version's own)
    const bad = [];
    for (const k of CR) { const [key, lv] = LV[k];
      for (let i = 0; i < lv.length; i++) { await pick(k, i + 1); const t = await tx(); if (t[key] !== lv[i]) bad.push(`${k} ${i + 1}: ${key} ${t[key]}, not ${lv[i]}`); }
      await pick(k, 0); const t = await tx(); if (t[key] !== null) bad.push(`${k} Privzeto: ${key} ${t[key]}`); }
    T.check('Preizkus: every level of the 7 knock rows sets its number at once (weight 1, 1.5, 2; bounce 0, 0.5, 1.6; rub 0, 0.15, 0.35, 0.6; turn 0.4, 0.7, 1, 2; slide 0, 0.5, 1.6; tyre catch 0.6, 1, 1.6; sparks 1, 0), Privzeto none', !bad.length, bad.join(' | '));
    // the six versions (by crV: Kot zdaj 0 and Realistično 5 in the row Trki, the older four, 1 to 4, in their row of Preizkus, which is open):
    // Core.TX.cv 1-6, one button marked in the two rows together and the sentence under the row Trki (an older version named before it); all but
    // Stara: Razbijanje dimmed, the note of Preizkus names the version; Stara: the 7 knock rows of Preizkus dimmed, their note says they do not apply
    const OLDER = (name, rx) => new RegExp('^Izbrana je starejša različica iz Preizkusa \\(' + name + '\\)\\. ' + rx);
    const vs = [], NOTE = [/^Trki kot do zdaj/, OLDER('Arkadna', 'Kot v arkadnih igrah'), OLDER('Mehka', 'Mehak stik'), OLDER('Kaskaderska', 'Močni trki'), OLDER('Stara', 'Trki kot prej'), /^Kot pravi trk/], VN = ['Kot zdaj', 'Arkadna', 'Mehka', 'Kaskaderska', null, 'Realistično'];
    for (let v = 0; v < 6; v++) { await pick('crV', v); vs.push(Object.assign(await ver(), { cv: (await tx()).cv, st: (await stored()).crV })); }
    T.check('Trki: each version sets Core.TX.cv 1-6 at once (Kot zdaj: cv 1, Realistično: cv 6, the older four from their row of Preizkus: cv 2 to 5), one button marked in the two rows, its sentence under the row Trki (an older version named before it), kept in the settings; all but Stara dim Razbijanje: odboji in vrtenje ob trku and the note in Preizkus names them; Stara dims the 7 knock rows of Preizkus instead (they do not apply)',
      vs.every((x, v) => x.cv === v + 1 && x.all === String(v) && x.sel === (v === 0 || v === 5 ? String(v) : '') && x.old.sel === (v >= 1 && v <= 4 ? String(v) : '') && x.st === v && NOTE[v].test(x.note)) && vs.every((x, v) => v === 4 ? x.dim === CRD && /ne veljajo/.test(x.cr) : x.dim === 'xBump' && x.cr.includes('(' + VN[v] + ')')),
      JSON.stringify(vs.map(x => ({ sel: x.sel, old: x.old.sel, cv: x.cv, st: x.st, dim: x.dim, note: x.note.slice(0, 72), cr: x.cr.slice(0, 50) }))));
    // Nova fizika: Zdrs po trku and Ujem gum (the classic physics' grip lost to a knock and its tyres catching the push) dimmed too, the note says so; back on Klasična not
    await pick('crV', 0); await pick('phys', 'nova'); const vn = await ver(); await pick('phys', 'cs'); const vc = await ver();
    T.check('Trki med avti with Nova fizika: Zdrs po trku and Ujem gum dimmed too (the classic physics\' only), the note of Preizkus says so; with Klasična not',
      vn.dim === 'crGl,crSl,xBump' && /klasični fiziki/.test(vn.cr) && vc.dim === 'xBump' && !/klasični fiziki/.test(vc.cr), JSON.stringify({ vn: { dim: vn.dim, cr: vn.cr }, vc: { dim: vc.dim, cr: vc.cr } }));
    await pick('crV', 3); await pick('tAiSpr', 3); await pick('tAiFol', 2); await pick('tAiKerb', 3); await pick('tAiPush', 1); await pick('tAiSide', 3);
    await pick('crPm', 3); await pick('crE', 2); await pick('crMu', 2); await pick('crYaw', 4); await pick('crGl', 1); await pick('crSl', 3); await pick('crFx', 2);
    const t3 = await tx(), s3 = await stored();
    T.check('Trki and Preizkus together: Kaskaderska (cv 4, from the older versions\' row) with the weight 2x, half the bounce, the rub 0.15, the turn 2 (above its own 1.5), no grip lost, the tyres slow, no sparks; the rivals (spread 0.3, gap 0.5 m, kerbs 2.2 m, push none, room 0.15 m); kept in the settings',
      t3.cv === 4 && t3.cPm === 2 && t3.cE === 0.5 && t3.cMu === 0.15 && t3.cYaw === 2 && t3.cGl === 0 && t3.cSl === 1.6 && t3.cFx === 0 && t3.aiSpr === 0.3 && t3.aiFol === 0.5 && t3.aiKerb === 2.2 && t3.aiPush === 0 && t3.aiSide === 0.15
      && s3.crV === 3 && s3.crPm === 3 && s3.crE === 2 && s3.crMu === 2 && s3.crYaw === 4 && s3.crGl === 1 && s3.crSl === 3 && s3.crFx === 2 && s3.tAiSpr === 3 && s3.tAiKerb === 3, JSON.stringify({ t3, s3: ['crV'].concat(KEYS).map(k => k + ':' + s3[k]).join(' ') }));
    await page.click('#s-settings [data-set="lang"] [data-v="en"]'); await page.waitForTimeout(300);
    const en = await rows(), enc = await cat(), ev = await ver();
    T.check('in English: Knocks (Realistic / As now, neither marked: Stunt, an older version, is chosen and named in the sentence under the row); Test: rivals and knocks (Rivals, Car knocks): Older versions (Arcade / Soft / Stunt / Old, Stunt marked), Pace spread ... Your car’s weight (2× marked), Bounce, Rub on contact, Turn in a knock, Slide after a knock, Tyre catch, Sparks in a knock (Off marked)',
      ev.label === 'Knocks' && ev.btns === 'Realistic,As now' && ev.sel === '' && ev.all === '3' && ev.old.label === 'Older versions' && ev.old.btns === 'Arcade,Soft,Stunt,Old' && ev.old.sel === '3' && /^An older version from Test is chosen \(Stunt\)\. Hard knocks/.test(ev.note) && /\(Stunt\)/.test(ev.cr)
      && enc.cat === 'Test: rivals and knocks' && enc.subs.join() === 'Rivals,Car knocks' && en[0].label === 'Pace spread'
      && en.slice(5).map(r => r.label).join() === 'Your car’s weight,Bounce,Rub on contact,Turn in a knock,Slide after a knock,Tyre catch,Sparks in a knock'
      && en[5].btns === 'Default,Equal,1.5×,2×' && en[5].sel === '3:2×' && en[6].btns === 'Default,None,Half,More' && en[10].btns === 'Default,Quick,Real,Slow' && en[11].sel === '2:Off', JSON.stringify({ ev, enc, en: en.map(r => r.label + ': ' + r.btns + ' ' + r.sel) }));
    // back in Slovenian on a narrow phone (the rows fitted for the English words, then the Slovenian ones, wider: Arkadna … Stara for Arcade …
    // Old: the language's switch fits them again, before it the last choices were cut off until the settings were opened again)
    await page.setViewportSize({ width: 320, height: 640 }); await page.waitForTimeout(300);
    await page.click('#s-settings [data-set="lang"] [data-v="sl"]'); await page.waitForTimeout(200);
    // (the row Trki and the older versions' row of Preizkus, which is open: the buttons of each by lines, from the top)
    const segs = () => page.evaluate(() => { const sg = [...document.querySelectorAll('#s-settings .seg')].filter(g => g.offsetParent), [v, o] = document.querySelectorAll('#s-settings [data-set="crV"]');
      const lines = (g) => Object.values([...g.children].map(b => Math.round(b.getBoundingClientRect().top)).reduce((m, t) => (m[t] = (m[t] || 0) + 1, m), {})).join(), btns = (g) => [...g.children].map(b => b.textContent).join();
      return { n: sg.length, cut: sg.filter(g => g.scrollWidth > g.clientWidth + 1).map(g => (g.dataset.set || '?') + ':' + g.className + ' ' + g.scrollWidth + '/' + g.clientWidth), crV: v.className, btns: btns(v), lines: lines(v),
        old: o.className, oldBtns: btns(o), oldShown: !!o.offsetParent, oldLines: lines(o) }; });
    const nar = await segs();
    await page.setViewportSize({ width: 360, height: 640 }); await page.waitForTimeout(300);   // (an upright phone)
    const upr = await segs();
    await page.setViewportSize({ width: 640, height: 360 }); await page.waitForTimeout(300);
    const lnd = await segs();
    T.check('back in Slovenian on a narrow phone (320×640, the settings fitted for the English words): every row of choices in the settings fitted again, none cut off; Trki\'s two on one line (or one to a line, where the row had to wrap), the older versions\' four in Preizkus on one line or on two (two and two); upright (360×640) and on its side (640×360) the same',
      [nar, upr, lnd].every(x => x.n > 30 && x.cut.length === 0 && x.btns === 'Realistično,Kot zdaj' && x.lines === (/\bwrap\b/.test(x.crV) ? '1,1' : '2')
      && x.oldShown && x.oldBtns === 'Arkadna,Mehka,Kaskaderska,Stara' && x.oldLines === (/\bwrap\b/.test(x.old) ? '2,2' : '4')), JSON.stringify({ nar, upr, lnd }));
    // a race with the rivals' spread narrow, the classic physics, Kaskaderska with the rows over it: the paces dealt out narrower, the knocks kept
    // through the race; then back on Privzeto
    const spread = () => page.evaluate(() => { const k = window.__game.race.cars.filter(c => !c.isPlayer && !c.sc).map(c => c.skill); return { w: Math.max(...k) - Math.min(...k), phys: window.__game.race.opts.phys, n: k.length }; });
    await startTrack(page, 'bathurst');
    const a = await spread(), nanA = await simulate(page, 8), txA = await tx();
    // the pause (a race with tyres: the strategy and the tyres' row under it too): the row Trki under the buttons (Realistično, Kot zdaj), in
    // sight, its choices within the panel; on its side and upright
    const prow = () => page.evaluate(async () => { const raf = () => new Promise(q => requestAnimationFrame(q)); await raf(); await raf();
      const row = document.getElementById('crv-prow'), body = document.getElementById('pause-body'), seg = row.querySelector('.seg'), b = body.getBoundingClientRect(), r = row.getBoundingClientRect();
      const inside = (q) => q.left >= b.left - 1 && q.right <= b.right + 1 && q.top >= b.top - 1 && q.bottom <= b.bottom + 1;
      const ps = document.querySelector('#pit-row .seg'), pr = ps.getBoundingClientRect(), pin = (q) => q.left >= pr.left - 1 && q.right <= pr.right + 1 && q.left >= b.left - 1 && q.right <= b.right + 1;   // (the tyres' row: its four choices within it, the panel's width)
      return { screen: window.__game.screen, shown: getComputedStyle(row).display !== 'none' && r.height > 0, label: row.querySelector('.rlbl').textContent, btns: [...seg.querySelectorAll('button')].map(x => x.textContent + (x.classList.contains('sel') ? '*' : '')).join(),
        fit: seg.scrollWidth <= seg.clientWidth + 1 && [...seg.querySelectorAll('button')].every(x => inside(x.getBoundingClientRect())), inView: inside(r), top: body.scrollTop, pit: !document.getElementById('pit-row').classList.contains('off'),
        pitFit: ps.scrollWidth <= ps.clientWidth + 1 && [...ps.querySelectorAll('button')].every(x => pin(x.getBoundingClientRect())),
        wrap: seg.classList.contains('wrap'), lines: [...seg.querySelectorAll('button')].map(x => Math.round(x.getBoundingClientRect().top)).reduce((m, t) => (m[t] = (m[t] || 0) + 1, m), {}) }; });
    await page.evaluate(() => window.__game.pause());
    const p1 = await prow();
    await page.setViewportSize({ width: 360, height: 640 }); await page.waitForTimeout(300);
    const p2 = await prow();
    await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(300);   // (a computer's window on its side, taller than a phone: the narrow panel, the choices wrap under their label)
    const p3 = await prow();
    await page.setViewportSize({ width: 320, height: 640 }); await page.waitForTimeout(300);   // (a narrow phone: the row's two are short enough for one line there too)
    const p4 = await prow();
    await page.setViewportSize({ width: 640, height: 360 }); await page.waitForTimeout(300);
    const one = (p) => Object.values(p.lines).join() === '1,1';
    T.check('the pause: the row Trki under its buttons (Realistično, Kot zdaj; neither marked: Kaskaderska, an older version of Preizkus, is chosen), in sight and its two choices within the panel, the tyres\' four too, on a phone on its side (640×360), upright (360×640), on a computer (1280×720) and on a narrow phone (320×640); the two on one line (or one to a line, where the row had to wrap)',
      [p1, p2, p3, p4].every(p => p.screen === 'pause' && p.shown && p.label === 'Trki' && p.btns === 'Realistično,Kot zdaj' && p.fit && p.inView && p.top === 0 && p.pitFit
      && (p.wrap ? one(p) : Object.keys(p.lines).length === 1)), JSON.stringify({ p1, p2, p3, p4 }));
    const picked = () => page.evaluate(() => ({ cv: Core.TX.cv, cPm: Core.TX.cPm, aiSpr: Core.TX.aiSpr, pause: [...document.querySelectorAll('#s-pause [data-set="crV"] .sel')].map(b => b.textContent).join(), list: [...document.querySelectorAll('#s-settings [data-set="crV"] .sel')].map(b => b.textContent).join(),
      screen: window.__game.screen, stored: JSON.parse(localStorage.getItem('tdgp-settings')).crV }));
    await page.click('#s-pause [data-set="crV"] [data-v="5"]'); await page.waitForTimeout(150);   // (Realistično: crV 5, the row's first button)
    const pr = await picked();
    T.check('the pause: Realistično picked there applies at once (Core.TX.cv 6, the rows of Preizkus kept), marked in the pause and in the settings, kept',
      pr.cv === 6 && pr.cPm === 2 && pr.aiSpr === 0.3 && pr.pause === 'Realistično' && pr.list === 'Realistično' && pr.screen === 'pause' && pr.stored === 5, JSON.stringify(pr));
    await page.click('#s-pause [data-set="crV"] [data-v="0"]'); await page.waitForTimeout(150);   // (Kot zdaj: crV 0)
    const pa = await picked();
    // its last row in reach (the panel scrolls), the next pause from the top again
    const sc = await page.evaluate(async () => { const raf = () => new Promise(q => requestAnimationFrame(q)), g = window.__game, body = document.getElementById('pause-body'), pit = document.getElementById('pit-row');
      const fits = body.scrollHeight <= body.clientHeight + 1;   // (all of it in sight: the pause's box and the weather's row beside the buttons on its side, the boxes' layout, nothing to scroll)
      body.scrollTop = body.scrollHeight; await raf(); const b = body.getBoundingClientRect(), r = pit.getBoundingClientRect(), end = r.top >= b.top - 1 && r.bottom <= b.bottom + 1, scrolled = body.scrollTop;
      g.resume(); await raf(); g.pause(); await raf(); return { end, scrolled, fits, top: body.scrollTop, screen: g.screen }; });
    T.check('the pause: Kot zdaj picked there applies at once (Core.TX.cv 1, the rows of Preizkus kept), marked in the pause and in the settings, kept; its last row (the tyres\') in reach (by scrolling, or in sight without it); the next pause from the top',
      pa.cv === 1 && pa.cPm === 2 && pa.aiSpr === 0.3 && pa.pause === 'Kot zdaj' && pa.list === 'Kot zdaj' && pa.screen === 'pause' && pa.stored === 0 && p1.pit && sc.end && (sc.scrolled > 0 || sc.fits) && sc.top === 0 && sc.screen === 'pause', JSON.stringify({ pa, sc }));
    await page.evaluate(() => window.__game.resume());
    const nanP = await simulate(page, 4), cvP = (await tx()).cv;
    T.check('the race runs on with Kot zdaj: 4 s on the autopilot without NaN, Core.TX.cv still 1', !nanP && cvP === 1, JSON.stringify({ nanP, cvP }));
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    await pick('tAiSpr', 0);
    const toast = await page.evaluate(() => document.getElementById('toast').textContent);
    for (const k of KEYS) await pick(k, 0);
    await pick('crV', 0);
    const tz = await tx();
    await startTrack(page, 'spa');
    const b = await spread();
    T.check('Preizkus: a race with the spread 0.3 and Kaskaderska with the rows over it: narrow paces (a third or less of the usual), nothing NaN, Core.TX kept through the race; back on Privzeto and Kot zdaj in the next race the usual spread, nothing set',
      a.phys === 'cs' && a.n > 10 && a.w < 0.05 && !nanA && txA.aiSpr === 0.3 && txA.cv === 4 && txA.cPm === 2 && txA.cSl === 1.6 && b.w > 0.07 && none(tz), JSON.stringify({ a, b, txA, tz, nanA }));   // (the usual spread on Spa 0.079-0.098 with the dealing's noise: 0.08 failed one race in 40)
    T.check('Preizkus: the spread row says in a race it applies from the next race', /naslednje dirke/.test(toast), toast);
    // Stara: the old knock (Core.TX.cv 5): the knock rows of Preizkus keep their choice (Core leaves them out), dimmed; Razbijanje: odboji in
    // vrtenje ob trku applies (Core.XR.bump as chosen); in English; Kot zdaj again: nothing set
    await page.evaluate(() => { window.__game.onAction('to-settings'); document.getElementById('set-test').open = true; }); await page.waitForTimeout(300);
    await pick('crE', 3); await pickH('xBump', 1); await pick('crV', 4);
    const o1 = await ver(), x1 = await tx(), xr1 = await page.evaluate(() => Core.XR.bump), r1 = await rows();
    T.check('Stara (the older versions\' row of Preizkus): Core.TX.cv 5, marked there and named under the row Trki, the 7 knock rows of Preizkus dimmed and keeping their choice (Odboj: Večji, cE 1.6), their note says they do not apply; Razbijanje: odboji in vrtenje ob trku not dimmed and on (Core.XR.bump 1)',
      x1.cv === 5 && x1.cE === 1.6 && o1.all === '4' && o1.old.sel === '4' && o1.sel === '' && o1.dim === CRD && /ne veljajo/.test(o1.cr) && OLDER('Stara', 'Trki kot prej').test(o1.note) && xr1 === 1 && r1[6].sel === '3:Večji', JSON.stringify({ o1, x1, xr1 }));
    await page.click('#s-settings [data-set="lang"] [data-v="en"]'); await page.waitForTimeout(300);
    const oe = await ver();
    await page.click('#s-settings [data-set="lang"] [data-v="sl"]'); await page.waitForTimeout(200);
    await pick('crV', 0); await pick('crE', 0); await pickH('xBump', 0);
    const o2 = await ver(), x2 = await tx();
    T.check('Stara in English (Old marked in Older versions, "An older version from Test is chosen (Old). The knocks as before", the rows "do not apply"); Kot zdaj again: only Razbijanje dimmed, nothing set',
      oe.all === '4' && oe.old.sel === '4' && /^An older version from Test is chosen \(Old\)\. The knocks as before/.test(oe.note) && /do not apply/.test(oe.cr) && o2.sel === '0' && o2.all === '0' && o2.dim === 'xBump' && none(x2), JSON.stringify({ oe, o2, x2 }));
    T.check('Preizkus: no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  {
    // stored values out of range or from the rows before the versions (Trki med avti brez odboja, Slog trkov, Odboj med avti, Občutek teže):
    // Realistično (the game's default), Privzeto, Odpadli deli Vklop and Odpadlo kolo Konec dirke, nothing else set; saved again without the old keys
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { crV: 9, crPm: 7, crMu: 'x', crYaw: -1, crSl: 1.5, crNB: 1, tCrStyle: 1, tCrE: 4, tCrMass: 5, debris: 7, wheelOver: 'x' }, { width: 640, height: 360 });
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    const j = await page.evaluate(() => ({ tx: Object.assign({}, Core.TX), sel: ['crV', 'crPm', 'crMu', 'crYaw', 'crSl', 'debris', 'wheelOver'].map(k => [...document.querySelectorAll(`#s-settings [data-set="${k}"] .sel`)].map(b => b.dataset.v).join('+')).join() }));
    await page.click('#s-settings [data-set="crV"] [data-v="0"]'); await page.waitForTimeout(150);
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-settings') || '{}'));
    T.check('stored values out of range or from the old rows (crV 9, crPm 7, crMu x, crYaw -1, crSl 1.5, debris 7, wheelOver x, crNB, tCrStyle, tCrE, tCrMass): Realistično (the game\'s default), Privzeto, Odpadli deli Vklop and Odpadlo kolo Konec dirke marked, Core.TX.cv 6 and nothing else set; saved again (Kot zdaj picked) without the old keys',
      j.sel === '5,0,0,0,0,1,1' && j.tx.cv === 6 && Object.keys(j.tx).filter(k => k !== 'cv').every(k => j.tx[k] === null) && s.crV === 0 && s.crPm === 0 && s.crMu === 0 && s.crYaw === 0 && s.crSl === 0 && s.debris === 1 && s.wheelOver === 1
      && !['crNB', 'tCrStyle', 'tCrE', 'tCrMass'].some(k => k in s), JSON.stringify({ j, s: ['crV', 'crPm', 'crMu', 'crYaw', 'crSl', 'debris', 'wheelOver', 'crNB', 'tCrStyle', 'tCrE', 'tCrMass'].map(k => k + ':' + s[k]).join(' ') }));
    T.check('stored values: no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  {
    // a stored Realistično (crV 5, the version Realistična: the game's default, here stored): taken as it is when the game opens
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { crV: 5 }, { width: 360, height: 640 });
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    const j = await page.evaluate(() => { const g = document.querySelector('#s-settings [data-set="crV"]'); return { cv: Core.TX.cv, sel: [...document.querySelectorAll('#s-settings [data-set="crV"] .sel')].map(b => b.dataset.v + ':' + b.textContent).join(), note: document.getElementById('crv-note').textContent,
      cut: g.scrollWidth > g.clientWidth + 1, stored: JSON.parse(localStorage.getItem('tdgp-settings') || '{}').crV }; });
    T.check('a stored Realistično (crV 5): marked when the game opens, none of the older versions (upright, 360×640: its row not cut off), its sentence under the row, Core.TX.cv 6',
      j.cv === 6 && j.sel === '5:Realistično' && /^Kot pravi trk/.test(j.note) && !j.cut && j.stored === 5, JSON.stringify(j));
    // the pause before the start on that phone (no box of the race yet: the buttons one to a row, the tyres' row last): the row Trki's two on
    // one line there, and the pause is all in sight (phFit closes the gaps between the buttons where it has to: #s-pause.fit1 in style.css)
    await startTrack(page, 'bathurst'); await page.evaluate(() => window.__game.pause()); await page.waitForTimeout(300);
    const q = await page.evaluate(async () => { const raf = () => new Promise(r => requestAnimationFrame(r)); await raf(); await raf();
      const s = document.getElementById('s-pause'), body = document.getElementById('pause-body'), seg = document.querySelector('#crv-prow .seg'), pit = document.getElementById('pit-row'), b = body.getBoundingClientRect(), r = pit.getBoundingClientRect();
      return { screen: window.__game.screen, phase: window.__game.phase, cls: s.className, seg: seg.className, sel: [...seg.querySelectorAll('.sel')].map(x => x.textContent).join(),
        lines: Object.values([...seg.children].map(x => Math.round(x.getBoundingClientRect().top)).reduce((m, t) => (m[t] = (m[t] || 0) + 1, m), {})).join(), cut: seg.scrollWidth > seg.clientWidth + 1,
        sh: body.scrollHeight, ch: body.clientHeight, pit: !pit.classList.contains('off') && r.height > 0 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1 }; });
    T.check('the pause before the start on the upright phone (360×640, the buttons one to a row): the row Trki\'s two on one line (or one to a line, where the row had to wrap), Realistično marked, none cut off; all of the pause in sight without scrolling, the tyres\' row too; no errors on the page',
      q.screen === 'pause' && q.phase !== 'racing' && !/\bpi\b/.test(q.cls) && q.lines === (/\bwrap\b/.test(q.seg) ? '1,1' : '2') && !q.cut && q.sel === 'Realistično' && q.sh <= q.ch + 1 && q.pit && !errors.length, JSON.stringify(q) + ' ' + errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  {
    // Odpadli deli and Odpadlo kolo (the user's buttons of 10. 11. 2026), with a stored Realistično: the two rows after Poškodbe avtov. Odpadli
    // deli: Izklop is Core.TX.deb 0, at once (the parts fly the same, no car touches them: tests/odpadli-deli.test.js); Odpadlo kolo: the race's
    // wheel rule (Race opts.wheelRule: the vehicles it is for; tests/wheels.test.js), the race's own from its start, so from the next race
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { crV: 5 }, { width: 640, height: 360 });
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    const seg = (k) => page.evaluate((k) => { const g = document.querySelector(`#s-settings [data-set="${k}"]`), r = g.closest('.row'), p = r.previousElementSibling, q = p && p.querySelector('[data-set]');
      return { label: r.querySelector('.rlbl').textContent, btns: [...g.querySelectorAll('button')].map(b => b.dataset.v + ':' + b.textContent + (b.classList.contains('sel') ? '*' : '')).join(), prev: q ? q.dataset.set : p ? p.id : '' }; }, k);
    const st = () => page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tdgp-settings') || '{}'); return { deb: Core.TX.deb, cv: Core.TX.cv, debris: s.debris, wheelOver: s.wheelOver }; });
    const pick = async (k, v) => { await page.click(`#s-settings [data-set="${k}"] [data-v="${v}"]`); await page.waitForTimeout(150); };
    const d0 = await seg('debris'), w0 = await seg('wheelOver'), dm = await seg('damage'), s0 = await st();
    T.check('Odpadli deli and Odpadlo kolo: the two rows after Poškodbe avtov (Izklop, Vklop: Vklop marked; Konec dirke, Dirka teče naprej: Konec dirke marked); Poškodbe avtov as before (Izklop, Samo videz, Vklop: Vklop the tests\' own); Core.TX.deb not set (Vklop), cv 6 (the stored Realistično)',
      d0.label === 'Odpadli deli' && d0.btns === '0:Izklop,1:Vklop*' && d0.prev === 'damage' && w0.label === 'Odpadlo kolo' && w0.btns === '1:Konec dirke*,0:Dirka teče naprej' && w0.prev === 'debris'
      && dm.label === 'Poškodbe avtov' && dm.btns === '0:Izklop,1:Samo videz,2:Vklop*' && s0.deb === null && s0.cv === 6, JSON.stringify({ d0, w0, dm, s0 }));
    await pick('debris', 0);
    const s1 = await st(), d1 = await seg('debris');
    await page.click('#s-settings [data-set="lang"] [data-v="en"]'); await page.waitForTimeout(300);
    const de = await seg('debris'), we = await seg('wheelOver');
    await page.click('#s-settings [data-set="lang"] [data-v="sl"]'); await page.waitForTimeout(200);
    T.check('Odpadli deli: Izklop applies at once (Core.TX.deb 0; the version as it was, cv 6), marked, kept in the settings; in English (Debris: Off / On; Lost wheel: Race over / Race goes on)',
      s1.deb === 0 && s1.cv === 6 && s1.debris === 0 && s1.wheelOver === 1 && d1.btns === '0:Izklop*,1:Vklop' && de.label === 'Debris' && de.btns === '0:Off*,1:On' && we.label === 'Lost wheel' && we.btns === '1:Race over*,0:Race goes on', JSON.stringify({ s1, d1, de, we }));
    // a race (Spa) with Realistično and Odpadli deli: Izklop; the wheel rule of that race, of the next one (Bathurst) with Dirka teče naprej
    // picked in the first, and of the one after it (Spa) with Konec dirke again (a race on another track each time: startTrack waits for it)
    const ruleOf = () => page.evaluate(() => { const w = window.__game.race.opts.wheelRule; return { rule: Array.isArray(w) ? w.length : w === undefined ? 'none' : String(w), models: Core.MODELS.length, track: window.__game.race.track.def.id }; });
    await startTrack(page, 'spa');
    const ra = await ruleOf(), nanA = await simulate(page, 6), sa = await st();
    await settings(page);
    await pick('wheelOver', 0);
    const toast = await page.evaluate(() => document.getElementById('toast').textContent), rk = await ruleOf(), sk = await st(), wk = await seg('wheelOver');
    await startTrack(page, 'bathurst');
    const rb = await ruleOf();
    await settings(page);
    await pick('wheelOver', 1); await pick('debris', 1);
    const s2 = await st();
    await startTrack(page, 'spa');
    const rc = await ruleOf();
    T.check('a race with Realistično and Odpadli deli: Izklop (Spa): 6 s on the autopilot without NaN, Core.TX.cv 6 and deb 0 through it; Odpadlo kolo: Konec dirke: the race has the wheel rule for every vehicle',
      !nanA && sa.cv === 6 && sa.deb === 0 && ra.track === 'spa' && ra.models > 10 && ra.rule === ra.models, JSON.stringify({ ra, nanA, sa }));
    T.check('Odpadlo kolo: Dirka teče naprej picked in a race: a toast says it applies from the next race, the running race keeps its rule, marked and kept in the settings; the next race (Bathurst) has no wheel rule; Konec dirke again (and Odpadli deli: Vklop, Core.TX.deb not set): the race after it (Spa) has the rule',
      /^Odpadlo kolo: izbira velja od naslednje dirke/.test(toast) && rk.rule === rk.models && rk.track === 'spa' && sk.wheelOver === 0 && wk.btns === '1:Konec dirke,0:Dirka teče naprej*' && rb.track === 'bathurst' && rb.rule === 'none'
      && s2.wheelOver === 1 && s2.debris === 1 && s2.deb === null && rc.track === 'spa' && rc.rule === rc.models, JSON.stringify({ toast, rk, sk, wk, rb, s2, rc }));
    T.check('Odpadli deli and Odpadlo kolo: no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  {
    // a new player (nothing stored: the game's own defaults, js/game.js DEF): Trki Realistično, Poškodbe avtov Samo videz, Odpadli deli Vklop,
    // Odpadlo kolo Konec dirke
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', null, { width: 640, height: 360 });
    await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300);
    const a = await page.evaluate(() => { const S = window.__game.S, sel = (k) => [...document.querySelectorAll(`#s-settings [data-set="${k}"] .sel`)].map(b => b.dataset.v + ':' + b.textContent).join('+');
      return { cv: Core.TX.cv, deb: Core.TX.deb, sel: ['crV', 'damage', 'debris', 'wheelOver'].map(sel).join(), S: [S.crV, S.damage, S.debris, S.wheelOver].join(), note: document.getElementById('crv-note').textContent.slice(0, 40) }; });
    T.check('a new player (nothing stored): Trki Realistično (Core.TX.cv 6, its sentence under the row), Poškodbe avtov Samo videz, Odpadli deli Vklop (Core.TX.deb not set), Odpadlo kolo Konec dirke; no errors on the page',
      a.cv === 6 && a.deb === null && a.sel === '5:Realistično,1:Samo videz,1:Vklop,1:Konec dirke' && a.S === '5,1,1,1' && /^Kot pravi trk/.test(a.note) && !errors.length, JSON.stringify(a) + ' ' + errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  {
    // an existing player (settings from before the buttons: Mehka and Poškodbe avtov Vklop; the earlier one-time moves done, no tdgp-defaults-v6):
    // moved once to Realistično, Odpadli deli Vklop and Odpadlo kolo Konec dirke, Poškodbe avtov as chosen; a choice after that is kept over a
    // reload (the page's own set-up, once: the library's writes its settings at every load)
    const ctx = await browser.newContext({ viewport: { width: 640, height: 360 } }), page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    await page.addInitScript(() => { if (!sessionStorage.getItem('t')) { sessionStorage.setItem('t', '1'); for (const k of ['tdgp-defaults-v2', 'tdgp-defaults-v3', 'tdgp-defaults-v4', 'tdgp-defaults-v5', 'tdgp-nu1', 'tdgp-noadapt']) localStorage.setItem(k, '1'); localStorage.setItem('tdgp-menu', 'old');
      localStorage.setItem('tdgp-settings', JSON.stringify({ crV: 2, damage: 2, sound: 0, track: 'jezero' })); } });
    const load = async (again) => { if (again) await page.reload({ timeout: 180000 }); else await page.goto(srv.base + '/index.html', { timeout: 180000 }); await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
      await page.evaluate(() => window.__game.onAction('to-settings')); await page.waitForTimeout(300); };
    const now = () => page.evaluate(() => { const S = window.__game.S, s = JSON.parse(localStorage.getItem('tdgp-settings') || '{}'), f = (o) => [o.crV, o.debris, o.wheelOver, o.damage].join();
      return { S: f(S), stored: f(s), cv: Core.TX.cv, deb: Core.TX.deb, v6: localStorage.getItem('tdgp-defaults-v6'), sel: ['crV', 'debris', 'wheelOver', 'damage'].map(k => [...document.querySelectorAll(`#s-settings [data-set="${k}"] .sel`)].map(b => b.dataset.v).join('+')).join() }; });
    await load(false);
    const m0 = await now();
    for (const k of ['crV', 'debris', 'wheelOver']) { await page.click(`#s-settings [data-set="${k}"] [data-v="0"]`); await page.waitForTimeout(150); }
    const m1 = await now();
    await load(true);
    const m2 = await now();
    T.check('an existing player (a stored Mehka and Poškodbe avtov Vklop from before the buttons): moved once to Realistično (Core.TX.cv 6), Odpadli deli Vklop and Odpadlo kolo Konec dirke, Poškodbe avtov as chosen (tdgp-defaults-v6); Kot zdaj, Izklop and Dirka teče naprej picked after that: kept over a reload (Core.TX.cv 1, deb 0); no errors on the page',
      m0.S === '5,1,1,2' && m0.stored === '5,1,1,2' && m0.cv === 6 && m0.deb === null && m0.v6 === '1' && m0.sel === '5,1,1,2' && m1.S === '0,0,0,2' && m1.stored === '0,0,0,2' && m1.cv === 1 && m1.deb === 0 && m1.sel === '0,0,0,2'
      && m2.S === '0,0,0,2' && m2.stored === '0,0,0,2' && m2.cv === 1 && m2.deb === 0 && m2.sel === '0,0,0,2' && m2.v6 === '1' && !errors.length, JSON.stringify({ m0, m1, m2 }) + ' ' + errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
