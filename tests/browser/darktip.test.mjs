// A browser that darkens the page by force (Samsung Internet's dark mode: js/menu.js forcedDark, darkSheet), and the page that shows what
// such a browser does to each way of painting (temni-nacin.html). Chromium's own force dark with prefers-color-scheme light is that mode:
// every element darkened whatever its color-scheme says, the probe (the system colour Canvas in a light element) dark.
// - a plain browser, and force dark that respects the game's color-scheme (prefers dark, Chrome's auto-dark): no notice, no link
// - forced: the title opens "Colours too dark?" once a visit (Samsung Internet: its settings; on Android: Open in Chrome, with the address
//   the game was opened with; elsewhere: the browser's settings), OK closes it, a reload in the same tab does not bring it back, a notice
//   the game hid at once comes back with the title, the link under the title opens it again, "Don't show this again" is kept over a
//   reload (the link stays); the notice fits upright and on its side
// - temni-nacin.html: its verdict and its ten rows of fields, in a plain and in a forced browser
//   node tests/browser/darktip.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('darktip');
const srv = await serve();
const plain = await launch(), forced = await launch(['--blink-settings=forceDarkModeEnabled=true']);
const PAGE = srv.base + '/index.html';
const SAMSUNG = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36';
const SH = 'const root = document.getElementById("menu-host").shadowRoot;';
const ev = (page, body) => page.evaluate(new Function(SH + body));
const ready = (page) => page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
const state = (page) => ev(page, 'const s = root.querySelector(".sheet.dtip"); return { sheet: !!s, link: !!root.querySelector("[data-act=\\"dark-tip\\"]"), text: s ? s.textContent : "", chrome: !!root.querySelector(".sheet.dtip [data-act=\\"chrome\\"]") };');
const open = (browser, scheme, vp, ua, rest) => openGame(browser, PAGE + (rest || ''), { intro: 2 }, vp || { width: 412, height: 915 }, { menu: true, context: Object.assign({ colorScheme: scheme }, ua ? { userAgent: ua } : {}) });
const reload = async (page) => { await page.reload(); await page.waitForFunction(() => window.__game, null, { timeout: 180000 }); await ready(page); await page.waitForTimeout(300); };
try {
  // 1. no notice where the browser leaves the game's colours alone
  for (const [name, browser, scheme] of [['a plain browser', plain, 'light'], ['a plain browser, dark', plain, 'dark'], ['force dark with prefers dark (respects color-scheme: dark)', forced, 'dark']]) {
    const { ctx, page, errors } = await open(browser, scheme);
    await ready(page); await page.waitForTimeout(300);
    const s = await state(page);
    T.check(`${name}: no notice, no link under the title`, !s.sheet && !s.link && !errors.length, JSON.stringify({ s, errors }));
    await ctx.close();
  }

  // 2. forced, as Samsung Internet on a phone: the notice once a visit, Open in Chrome, OK, a reload, hidden at once, the link, Don't show
  // this again over a reload
  {
    const { ctx, page, errors } = await open(forced, 'light', null, SAMSUNG, '?x=1#y=2');
    await ready(page); await page.waitForTimeout(300);
    const s = await state(page);
    T.check('forced (Samsung Internet, Android): the title opens "Colours too dark?" with Samsung Internet\'s settings and Open in Chrome',
      s.sheet && s.link && /Force Dark mode for web content/.test(s.text) && /Use website dark theme/.test(s.text) && s.chrome, JSON.stringify(s));
    await page.waitForTimeout(600);   // (the sheet slides up first)
    const fit = await ev(page, 'const r = root.querySelector(".sheet.dtip").getBoundingClientRect(), b = root.querySelector(".sheet.dtip .go").getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 1 && b.bottom <= innerHeight + 1;');
    T.check('the notice fits the phone upright (412 × 915), its OK on the screen', fit);
    const intent = await page.evaluate(() => Menu.debug().chrome), u = srv.base + '/index.html?x=1#y=2';
    T.check('Open in Chrome: an intent for Chrome with the address the game was opened with and its scheme; without Chrome the same address',
      intent === 'intent://' + u.replace(/^https?:\/\//, '') + '#Intent;scheme=' + new URL(u).protocol.slice(0, -1) + ';package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(u) + ';end', intent);
    await page.click('.sheet.dtip .go[data-act="close-sheet"]'); await page.waitForTimeout(250);
    await page.evaluate(() => { Menu.show('title'); }); await page.waitForTimeout(250);
    const s2 = await state(page);
    T.check('OK closes it; the title again in the same visit: no notice, the link still there', !s2.sheet && s2.link, JSON.stringify(s2));
    await reload(page);
    const s4 = await state(page);
    T.check('a reload in the same tab (the garage\'s way back, the game\'s update) is the same visit: no notice by itself, the link there', !s4.sheet && s4.link, JSON.stringify(s4));
    await page.click('[data-act="dark-tip"]'); await page.waitForTimeout(250);
    await page.evaluate(() => { Menu.hide(); Menu.show('title'); }); await page.waitForTimeout(250);
    T.check('a notice the game hid at once (a friend\'s challenge over the title): the title opens it again', (await state(page)).sheet);
    await page.click('.sheet.dtip .go[data-act="close-sheet"]'); await page.waitForTimeout(250);
    await page.click('[data-act="dark-tip"]'); await page.waitForTimeout(250);
    T.check('the link "Colours too dark?" opens it again', (await state(page)).sheet);
    await page.click('[data-act="dark-never"]'); await page.waitForTimeout(250);
    const off = await page.evaluate(() => localStorage.getItem('tdgp-darktip'));
    T.check('"Don\'t show this again" closes it and is kept', off === 'off' && !(await state(page)).sheet, String(off));
    await page.evaluate(() => sessionStorage.clear()); await reload(page);
    const s3 = await state(page);
    T.check('after a reload, even in a new visit: no notice by itself, the link still there; no errors', !s3.sheet && s3.link && !errors.length, JSON.stringify({ s3, errors }));
    await ctx.close();
  }

  // 3. forced, another browser on a computer, on its side: the browser's own settings, no Open in Chrome; it fits
  for (const vp of [{ width: 640, height: 360 }, { width: 360, height: 640 }]) {
    const { ctx, page, errors } = await open(forced, 'light', vp);
    await ready(page); await page.waitForTimeout(300);
    const s = await state(page);
    const fit = await ev(page, 'const sh = root.querySelector(".sheet.dtip"); if (!sh) return false; const b = sh.querySelector(".go").getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight + 1 || sh.scrollHeight > sh.clientHeight;');
    T.check(`forced, not Samsung Internet (${vp.width} × ${vp.height}): the browser's settings, no Samsung steps, no Open in Chrome; its OK reachable`,
      s.sheet && /browser's settings/.test(s.text) && !/Samsung/.test(s.text) && !s.chrome && fit && !errors.length, JSON.stringify({ s, fit, errors }));
    await ctx.close();
  }

  // 4. temni-nacin.html: the verdict, the ten rows, no errors
  for (const [name, browser, yes] of [['a plain browser', plain, false], ['forced', forced, true]]) {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, colorScheme: 'light' }), page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.goto(srv.base + '/temni-nacin.html');
    await page.waitForFunction(() => document.querySelectorAll('#big img').length === 1, null, { timeout: 30000 });
    const r = await page.evaluate(() => ({ verdict: document.getElementById('verdict').className, rows: document.querySelectorAll('.grid .lb').length, cells: document.querySelectorAll('.grid .c').length, refs: document.querySelectorAll('.c.ref canvas').length, small: document.querySelectorAll('.c.small img').length }));
    T.check(`temni-nacin.html, ${name}: "${yes ? 'DA' : 'NE'}", ten rows (nine of four fields and the big picture), the canvas and picture fields drawn`,
      r.verdict === 'verdict ' + (yes ? 'yes' : 'no') && r.rows === 10 && r.cells === 36 && r.refs === 4 && r.small === 4 && !errors.length, JSON.stringify({ r, errors }));
    await ctx.close();
  }
} finally {
  await plain.close(); await forced.close(); await srv.close();
}
T.done();
