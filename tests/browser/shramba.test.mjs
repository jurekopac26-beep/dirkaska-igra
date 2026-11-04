// The saved game kept safe, in the game (js/shramba.js; its logic without a browser in tests/shramba.test.js). On Trois-Rivières (a real
// track), four races already driven and a mission's record: the day's copy made a few seconds after the start (the progress without the
// ghosts, the missions' records beside; not a second one the same day). A race to the line: the browser asked once to keep the storage;
// the fifth race: the offer on the results to save the profile as a file (Ne zdaj: hidden for a week; Shrani profil: the file with the
// missions' records, noted, the offer gone). Nastavitve: the storage kept, the last file, how full; the copies listed (Samodejne kopije
// napredka). A storage full to the last character: a setting still saved (Nevihta), one ghost dropped for it, the player told. A copy put
// back (asked; the saved game before it copied too): the progress of the morning, the race's ghost kept. A profile imported: a copy of
// the saved game made before it, the file's progress and missions' records in.
//   node tests/browser/shramba.test.mjs
import fs from 'node:fs';
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('shramba');
const srv = await serve();
const browser = await launch();
try {
  // (every load: the browser's answers counted, persist says yes; the first load only: four races and a mission's record)
  const init = () => {
    window.__persist = { asked: 0 };
    try { Object.defineProperty(navigator, 'storage', { configurable: true, value: { persisted: async () => window.__persist.asked > 0, persist: async () => { window.__persist.asked++; return true; } } }); } catch (_) { /* (kept as it is) */ }
    if (!localStorage.getItem('tdgp-stats')) { localStorage.setItem('tdgp-stats', JSON.stringify({ v: 1, races: 4, km: 31, time: 1200, tracks: {}, goldT: {}, ach: {} })); localStorage.setItem('rra-misije', '{"06":{"stars":3,"t":95.2}}'); }
  };
  const A = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, track: 'troisrivieres', name: 'Ana', length: 'short', weather: 'dry' }, { width: 390, height: 844 }, { init });
  const pa = A.page;
  pa.on('dialog', (d) => d.accept());

  // 1. the day's copy, a few seconds after the start
  // (polled inside the page: waitForFunction takes a promise for a yes)
  const made = await pa.evaluate(async () => { for (let i = 0; i < 120; i++) { if ((await Shramba.list()).length) return true; await new Promise(r => setTimeout(r, 500)); } return false; });
  if (!made) throw new Error('no day\'s copy within a minute');
  const c1 = await pa.evaluate(async () => { const a = await Shramba.list(), r = await Shramba.get(a[0].id), again = await Shramba.daily(), b = await Shramba.list();
    return { n: a.length, why: r.why, sum: r.sum, keys: Object.keys(r.data), extra: r.extra, again, n2: b.length }; });
  T.check('the day\'s copy: made after the start (ob zagonu), the progress (4 races, settings) without ghosts, the missions\' records beside; not a second one the same day',
    c1.n === 1 && c1.why === 'dan' && c1.sum.races === 4 && c1.keys.includes('tdgp-stats') && c1.keys.includes('tdgp-settings') && !c1.keys.some(k => /^tdgp-(ghost|fghost|pklegend)-|^tdgp-noadapt$|^tdgp-shramba$/.test(k)) && typeof c1.extra['rra-misije'] === 'string' && c1.extra['rra-misije'].includes('95.2') && c1.again === null && c1.n2 === 1,
    JSON.stringify(c1));

  // 2. a race to the line: the browser asked to keep the storage, the offer on the results
  await startTrack(pa, 'troisrivieres');
  await pa.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 400 && g.phase !== 'done'; k++) g.sim(2, true); if (g.phase !== 'done') g.resume(); });
  await pa.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  await pa.waitForTimeout(300);
  const r1 = await pa.evaluate(() => ({ asked: window.__persist.asked, kept: Shramba.state.persisted, races: window.__game.stats.races, off: document.getElementById('res-save').classList.contains('off'), txt: document.getElementById('res-save').innerText.replace(/\s+/g, ' '),
    ghost: Object.keys(localStorage).filter(k => k.startsWith('tdgp-ghost-troisrivieres')) }));
  T.check('the results of the fifth race: the browser asked once to keep the storage (kept), the offer to save the profile as a file shown with its two buttons',
    r1.asked === 1 && r1.kept === true && r1.races === 5 && !r1.off && /Napredek je shranjen samo v tem telefonu/.test(r1.txt) && /Ne zdaj/.test(r1.txt) && /Shrani profil/.test(r1.txt), JSON.stringify(r1));
  const box = await pa.evaluate(() => { const b = document.getElementById('res-save').getBoundingClientRect(), p = document.querySelector('#s-results .res-panel').getBoundingClientRect(), btn = [...document.querySelectorAll('#s-results .btns.horiz .btn:not(.off)')].map(e => e.getBoundingClientRect());
    return { inPanel: b.left >= p.left - 1 && b.right <= p.right + 1 && b.top >= p.top - 1 && b.bottom <= p.bottom + 1, overlap: btn.some(r => r.top < b.bottom - 1 && r.bottom > b.top + 1), h: Math.round(b.height) }; });
  T.check('the offer on a phone held upright (390 × 844): inside the results panel, above the buttons, not over them', box.inPanel && !box.overlap && box.h < 140, JSON.stringify(box));
  await pa.evaluate(() => window.__game.onAction('save-later'));
  const r2 = await pa.evaluate(() => ({ off: document.getElementById('res-save').classList.contains('off'), o: JSON.parse(localStorage.getItem('tdgp-shramba') || '{}'), now: Date.now() }));
  T.check('Ne zdaj: the offer hidden, not again for a week', r2.off && r2.o.odlog > r2.now + 6.9 * 864e5 && r2.o.odlog < r2.now + 7.1 * 864e5, JSON.stringify(r2));
  await pa.evaluate(() => localStorage.setItem('tdgp-shramba', '{}'));
  const [dl] = await Promise.all([pa.waitForEvent('download'), pa.evaluate(() => window.__game.onAction('save-export'))]);
  const fpath = await dl.path(), file = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  await pa.waitForTimeout(300);
  const r3 = await pa.evaluate(() => ({ off: document.getElementById('res-save').classList.contains('off'), o: JSON.parse(localStorage.getItem('tdgp-shramba') || '{}'), now: Date.now() }));
  T.check('Shrani profil: the profile file (its progress and, as extra, the missions\' records), noted (izvoz), the offer gone',
    /^real-roads-atlas-profil-\d{8}\.json$/.test(dl.suggestedFilename()) && file.kind === 'profile' && typeof file.data['tdgp-stats'] === 'string' && file.extra && typeof file.extra['rra-misije'] === 'string' && file.extra['rra-misije'].includes('95.2') && r3.off && Math.abs(r3.o.izvoz - r3.now) < 60000,
    JSON.stringify({ name: dl.suggestedFilename(), extra: file.extra, r3 }));

  // 3. Nastavitve: the note under Profil, the copies
  await pa.evaluate(() => window.__game.onAction('to-settings'));
  await pa.waitForTimeout(400);
  const s1 = await pa.evaluate(() => document.getElementById('prof-note').textContent);
  T.check('Nastavitve, under Profil: the storage kept, the last file (today), how full', /Shramba je trajna/.test(s1) && new RegExp('Zadnji izvoz v datoteko: ' + new Date().toLocaleDateString('sl-SI').replace(/\./g, '\\.')).test(s1) && /Zasedeno je \d+ % prostora/.test(s1), s1);
  await pa.evaluate(() => { document.getElementById('set-kopije').open = true; });
  await pa.waitForFunction(() => document.querySelectorAll('#kopije-list .kop-row').length > 0, null, { timeout: 15000 });
  const s2 = await pa.evaluate(() => [...document.querySelectorAll('#kopije-list .kop-row')].map(r => r.innerText.replace(/\s+/g, ' ')));
  T.check('Samodejne kopije napredka: the day\'s copy listed (when, ob zagonu, 4 races) with Obnovi', s2.length === 1 && /ob zagonu · dirke: 4/.test(s2[0]) && /Obnovi/.test(s2[0]), JSON.stringify(s2));

  // 4. a storage full to the last character: a setting still saved, one ghost dropped for it, the player told
  const f1 = await pa.evaluate(() => {
    const big = 'G'.repeat(400000); let i = 0;
    try { for (;;) { localStorage.setItem('tdgp-ghost-fake' + i + '@cs', big); i++; } } catch (_) { /* full */ }
    let lo = 0, hi = 420000;   // (the rest to the last character: the longest value that still fits)
    while (lo < hi) { const m = (lo + hi + 1) >> 1; try { localStorage.setItem('zz-top', 'z'.repeat(m)); lo = m; } catch (_) { hi = m - 1; } }
    localStorage.setItem('zz-top', 'z'.repeat(lo));
    let one = true; try { localStorage.setItem('zz-one', 'z'); } catch (_) { one = false; }
    return { ghosts: i, top: lo, room: one, weather: JSON.parse(localStorage.getItem('tdgp-settings')).weather };
  });
  await pa.evaluate(() => document.querySelector('[data-set="weather"] [data-v="storm"]').click());
  await pa.waitForTimeout(300);
  const f2 = await pa.evaluate(() => ({ weather: JSON.parse(localStorage.getItem('tdgp-settings')).weather, ghosts: Object.keys(localStorage).filter(k => /^tdgp-ghost-fake/.test(k)).length, toast: document.getElementById('toast').textContent, freed: Shramba.state.freed }));
  T.check('a storage full to the last character (fake ghosts): Nevihta still saved, one ghost dropped for it, the player told (je bil izbrisan 1 duh)',
    f1.ghosts > 5 && !f1.room && f1.weather === 'dry' && f2.weather === 'storm' && f2.ghosts === f1.ghosts - 1 && f2.freed === 1 && /je bil izbrisan 1 duh/.test(f2.toast), JSON.stringify({ f1, f2 }));
  await pa.evaluate(() => { for (const k of Object.keys(localStorage)) if (/^tdgp-ghost-fake|^zz-/.test(k)) localStorage.removeItem(k); });

  // 5. a copy put back: asked, the saved game before it copied, the morning's progress, the race's ghost kept
  await pa.evaluate(() => window.__game.onAction('to-settings'));
  await pa.waitForTimeout(300);
  await pa.waitForFunction(() => document.querySelectorAll('#kopije-list [data-act="kop-back"]').length > 0, null, { timeout: 15000 });
  await Promise.all([pa.waitForNavigation({ timeout: 60000 }), pa.evaluate(() => document.querySelector('#kopije-list [data-act="kop-back"]').click())]);
  await pa.waitForFunction(() => window.__game && typeof Shramba !== 'undefined', null, { timeout: 180000 });   // (Shramba: a const of the page, not a property of window)
  const b1 = await pa.evaluate(async () => ({ races: window.__game.stats.races, ghost: Object.keys(localStorage).filter(k => k.startsWith('tdgp-ghost-troisrivieres')), list: (await Shramba.list()).map(r => r.why + ':' + r.sum.races), mis: localStorage.getItem('rra-misije') }));
  T.check('the copy put back (after the restart): the morning\'s 4 races, the race\'s ghost kept, the saved game before it copied too (pred obnovo, 5 races)',
    b1.races === 4 && b1.ghost.length === r1.ghost.length && b1.list.join() === 'obnova:5,dan:4' && b1.mis.includes('95.2'), JSON.stringify({ b1, ghostBefore: r1.ghost }));

  // 6. a profile imported: a copy of the saved game first, then the file's progress and missions' records
  await pa.evaluate(() => localStorage.setItem('rra-misije', '{}'));
  const [fc] = await Promise.all([pa.waitForEvent('filechooser'), pa.evaluate(() => window.__game.onAction('prof-import'))]);
  await Promise.all([pa.waitForNavigation({ timeout: 60000 }), fc.setFiles(fpath)]);
  await pa.waitForFunction(() => window.__game && typeof Shramba !== 'undefined', null, { timeout: 180000 });   // (Shramba: a const of the page, not a property of window)
  const i1 = await pa.evaluate(async () => ({ races: window.__game.stats.races, list: (await Shramba.list()).map(r => r.why + ':' + r.sum.races), mis: localStorage.getItem('rra-misije') }));
  T.check('a profile imported: a copy made before it (pred uvozom profila, 4 races), the file\'s 5 races and missions\' records in', i1.races === 5 && i1.list[0] === 'uvoz:4' && i1.list.length === 3 && i1.mis.includes('95.2'), JSON.stringify(i1));

  T.check('no page errors', A.errors.length === 0, A.errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
