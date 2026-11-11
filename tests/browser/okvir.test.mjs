/* The frame against forced darkening (js/okvir.js): where a browser repaints the page whatever it declares (Samsung Internet's
   dark mode; here Chromium with forceDarkModeEnabled), the page loads itself once more inside a frame whose color-scheme is dark,
   and its colours stay as they are.

   1  the script alone, on a small page the test serves (nothing of the game to load):
      - nothing forced: no frame, no attribute, nothing kept; ?okvir=1 makes the frame anywhere
      - forced: the frame by itself, the page runs once (inside), white stays white (and is repainted with ?okvir=0)
      - the tab's address, title and bar colour follow the page in the frame (another page too: the garage's way); a reload
        opens the same page
      - what only the top page gets is handed on: keys, a typed #link, the install prompt, the screen's safe areas
      - an outer page from another release loads anew, once
      - the way out: a page in the frame that does not answer (1 day) or is not told the dark scheme (7 days) leaves a record
        and the page comes back without the frame; a valid record keeps it so in every tab, an expired one or one of another
        browser version tries again; ?okvir=0 holds for the tab, ?okvir=1 clears it and the record
      - a preferred scheme set by hand (the other tests' way): no frame, no record
   2  the game itself (few loads: the pictures are slow here)
      - a plain browser: the game as it is, no frame; the kerb strip of its title (red and chalk) is the reference
      - forced: the game runs once, in the frame; the strip is painted as in a plain browser, the notice about dark colours
        does not come; a touch reaches the game (full screen, the sound unlocked); the garage and its Back stay in the frame,
        the tab's address, title and bar colour following; with ?okvir=0 no frame, the notice, the strip's chalk repainted
      - forced, a race on Spa in the frame: a finger on the brake and on the gas, the keys, the safe areas at the game's
        buttons, Escape and the pause screen's chalk, the game's store is the tab's own, a turned screen turns the game
      (the load is not measured here: the software renderer's frame times say nothing about a phone)

   Samsung Internet itself is not at hand: what its painter does with the frame only the phone shows (temni-nacin.html). */
import { serve, launch, startTrack, simulate, checker } from './lib.mjs';

const T = checker('okvir');
const srv = await serve();
const plain = await launch(), forced = await launch(['--blink-settings=forceDarkModeEnabled=true']);
const errs = [];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);

// ---- helpers ----
// the small page: the game's own declaration of a dark scheme, a white square, and what the checks read
const small = (n, how) => '<!doctype html><html><head><meta charset="utf-8"><meta name="theme-color" content="#12345' + n + '"><title>Proba ' + n + '</title>'
  + '<script src="js/okvir.js"' + (how || '') + '></script>'
  + '<style>:root { color-scheme: dark; color-scheme: only dark; } body { margin: 0; background: #000; } #w { width: 120px; height: 120px; background: #fff; }</style>'
  + '<script>window.__proba = ' + n + '; window.__keys = 0; addEventListener("keydown", function () { window.__keys++; });'
  + ' addEventListener("beforeinstallprompt", function (e) { window.__bip = e; }); addEventListener("appinstalled", function () { window.__inst = 1; });</script>'
  + '</head><body><div id="w"></div></body></html>';
async function ctxOf(browser, scheme, init) {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 300 }, colorScheme: scheme });
  await ctx.route(/\/proba(1|2|-p)\.html(\?|#|$)/, (r) => {
    const m = /\/proba(1|2|-p)\.html/.exec(r.request().url())[1];
    return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: m === '-p' ? small(3, ' data-poroca') : small(+m) });
  });
  if (init) await ctx.addInitScript(init);
  return ctx;
}
async function tabOf(ctx) {
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('pageerror ' + e.message));
  return page;
}
const go = (page, path) => page.goto(srv.base + path, { waitUntil: 'commit', timeout: 60000 });
// (a page that is leaving throws at evaluate: asked again until it answers)
async function until(target, fn, arg, ms = 20000) {
  for (const end = Date.now() + ms; ;) {
    const v = await target.evaluate(fn, arg).catch(() => null);
    if (v || Date.now() > end) return v;
    await sleep(50);
  }
}
// the page as it is, without a frame
const own = (page, n = 1) => until(page, (n) => window.__proba === n && document.readyState === 'complete' && !document.getElementById('okvir'), n);
// the small page n loaded in the frame, and the top page done with its load (the keys are in the frame)
async function ready(page, n = 1, ms = 20000) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(50)) {
    for (const f of page.frames()) {
      if (f === page.mainFrame()) continue;
      if (!(await f.evaluate((n) => window.__proba === n && !window.__old && document.readyState === 'complete', n).catch(() => false))) continue;
      await until(page, () => { const o = window.__okvir, e = document.getElementById('okvir'); return !!(o && e && o.dok === e.contentDocument && document.activeElement === e); }, null, 5000);
      return f;
    }
  }
  return null;
}
const leave = (f, fn, arg) => f.evaluate(fn, arg).catch(() => { });   // (an evaluate that sends its page away)
const outer = (page) => page.evaluate(() => {
  const f = document.getElementById('okvir'), o = window.__okvir, tc = document.querySelector('meta[name="theme-color"]');
  return { frame: !!f, own: window.__proba || 0, v: o ? o.v : null, asked: o ? o.zahtevan : null, dark: o ? o.temno : null, there: !!(o && f && o.dok && o.dok === f.contentDocument),
    ls: localStorage.getItem('rr-okvir'), ss: sessionStorage.getItem('rr-okvir'), url: location.pathname.replace(/^.*\//, '') + location.search + location.hash,
    title: document.title, tc: tc ? tc.content : '', active: document.activeElement ? document.activeElement.id : '', n: window.frames.length,
    theme: document.documentElement.getAttribute('data-theme') };
});
const inner = (f) => f.evaluate(() => ({ n: window.__proba, theme: document.documentElement.getAttribute('data-theme'), frame: !!document.getElementById('okvir'), o: !!window.__okvir,
  dark: matchMedia('(prefers-color-scheme: dark)').matches, url: location.pathname.replace(/^.*\//, '') + location.search + location.hash, keys: window.__keys,
  edges: ['t', 'r', 'b', 'l'].map(k => document.documentElement.style.getPropertyValue('--okvir-' + k)) }));
const record = (o) => { try { return JSON.parse(o.ls) || {}; } catch (_) { return {}; } };

try {
  // a screenshot's pixels, read in a page (no PNG reader in Node here)
  const reader = await (await plain.newContext()).newPage();
  const pixels = (png, pts) => reader.evaluate(async ([b64, pts]) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    return pts.map(p => Array.from(x.getImageData(Math.round(p[0]), Math.round(p[1]), 1, 1).data.slice(0, 3)));
  }, [png.toString('base64'), pts]);
  const square = async (page) => (await pixels(await page.screenshot({ clip: { x: 0, y: 0, width: 120, height: 120 } }), [[60, 60]]))[0];
  const white = (p) => p[0] >= 225 && p[1] >= 225 && p[2] >= 225;
  let o, i, f, d, r;

  // ================= 1  the script alone =================
  // ---- nothing forced ----
  {
    const ctx = await ctxOf(plain, null), page = await tabOf(ctx);
    await go(page, '/proba1.html'); await own(page);
    o = await outer(page);
    T.check('plain: no frame, the page as it is, nothing kept', !o.frame && o.own === 1 && o.v === null && o.n === 0 && o.theme === null && o.ls === null && o.ss === null && page.frames().length === 1, J(o));
    await go(page, '/proba1.html?okvir=1'); f = await ready(page);
    o = await outer(page); i = f ? await inner(f) : {};
    T.check('plain, ?okvir=1: the frame, its page told dark and kept in its light colours', o.frame && !o.own && o.asked === true && o.dark === true && o.there && i.theme === 'light' && i.dark === true && !i.frame && !i.o, J([o, i]));
    T.check('plain, ?okvir=1: white is white', white(await square(page)));
    await ctx.close();
  }
  {
    const ctx = await ctxOf(plain, 'dark'), page = await tabOf(ctx);
    await go(page, '/proba1.html'); await own(page);
    o = await outer(page);
    T.check('plain, the player prefers dark: no frame', !o.frame && o.own === 1 && o.v === null, J(o));
    await go(page, '/proba1.html?okvir=1'); f = await ready(page);
    i = f ? await inner(f) : {};
    T.check('... and ?okvir=1 leaves the dark colours', !!f && i.theme === null && i.dark === true, J(i));
    await ctx.close();
  }

  // ---- forced: the frame by itself ----
  {
    const ctx = await ctxOf(forced, null), page = await tabOf(ctx);
    await go(page, '/proba1.html'); f = await ready(page);
    o = await outer(page); i = f ? await inner(f) : {};
    T.check('forced: the frame by itself, the page runs once (inside), nothing kept', o.frame && !o.own && o.v === 1 && o.asked === false && o.dark === true && o.there && o.n === 1 && page.frames().length === 2 && o.ls === null && o.ss === null && o.url === 'proba1.html', J(o));
    T.check('forced: the page in the frame is told dark, keeps its light colours, makes no frame of its own', i.theme === 'light' && i.dark === true && !i.frame && !i.o && i.url === 'proba1.html', J(i));
    d = await square(page);
    T.check('forced, in the frame: white stays white', white(d), J(d));

    await page.keyboard.press('a');
    T.check('keys go to the page in the frame', o.active === 'okvir' && !!(await until(f, () => window.__keys === 1, null, 5000)), J(o.active));

    await f.evaluate(() => history.replaceState(null, '', '?x=2#b'));
    o = await outer(page);
    T.check('the tab\'s address follows the page (replaceState)', o.url === 'proba1.html?x=2#b', o.url);
    await f.evaluate(() => history.pushState({ a: 1 }, '', '?x=3'));
    o = await outer(page);
    T.check('... and pushState', o.url === 'proba1.html?x=3', o.url);
    await page.evaluate(() => { location.hash = '#a'; });
    d = await until(f, () => location.hash === '#a' && location.search, null, 5000);
    T.check('a #link typed in the tab reaches the page in the frame', d === '?x=3' && (await outer(page)).url === 'proba1.html?x=3#a', J(d));
    await page.evaluate(() => { location.hash = ''; });
    T.check('... and its removal too', !!(await until(f, () => location.hash === '' && location.search === '?x=3', null, 5000)));

    await page.evaluate(() => { document.getElementById('okvir-robovi').style.padding = '31px 0px 17px 9px'; dispatchEvent(new Event('resize')); });
    i = await inner(f);
    T.check('the screen\'s safe areas are handed on (none where they are zero)', J(i.edges) === J(['31px', '', '17px', '9px']), J(i.edges));

    await page.evaluate(() => {
      const e = new Event('beforeinstallprompt', { cancelable: true });
      e.platforms = ['web']; e.userChoice = Promise.resolve({ outcome: 'accepted' }); e.prompt = () => { window.__asked = (window.__asked || 0) + 1; return Promise.resolve(); };
      dispatchEvent(e); window.__prevented = e.defaultPrevented;
    });
    d = await f.evaluate(async () => {
      const e = window.__bip; if (!e) return null;
      const v = { own: e instanceof Event, cancel: e.cancelable, pl: e.platforms && e.platforms[0], ch: (await e.userChoice).outcome };
      await e.prompt(); return v;
    });
    r = await page.evaluate(() => [window.__asked, window.__prevented]);
    T.check('the install prompt reaches the page in the frame; its prompt() asks the tab\'s own', !!d && d.own && d.cancel && d.pl === 'web' && d.ch === 'accepted' && r[0] === 1 && r[1] === true, J([d, r]));

    // another page in the frame (the garage's way), a prompt saved meanwhile
    await page.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => Promise.resolve(); dispatchEvent(e); });
    await leave(f, () => { window.__old = 1; location.href = 'proba2.html?y=1'; });
    f = await ready(page, 2);
    o = await outer(page); i = f ? await inner(f) : {};
    T.check('another page in the frame: the address, the title and the bar colour follow', o.frame && o.there && o.url === 'proba2.html?y=1' && o.title === 'Proba 2' && o.tc === '#123452' && i.theme === 'light' && i.dark === true, J([o, i]));
    await page.keyboard.press('a');
    d = f ? await until(f, () => window.__keys === 1 && !!window.__bip, null, 5000) : null;
    T.check('... it gets the keys, the safe areas and the saved install prompt', !!d && J(i.edges) === J(['31px', '', '17px', '9px']), J([d, i.edges]));
    await page.evaluate(() => dispatchEvent(new Event('appinstalled')));
    T.check('... and hears that the game was installed', !!f && (await f.evaluate(() => window.__inst === 1)));

    await page.reload({ waitUntil: 'commit' }); f = await ready(page, 2);
    o = await outer(page);
    T.check('a reload opens the same page, in the frame', !!f && o.frame && o.there && o.url === 'proba2.html?y=1' && o.title === 'Proba 2', J(o));

    // the outer page is of another release than the one the frame loads
    await page.evaluate(() => { window.__okvir.v = 0; window.__mark = 1; });
    await leave(f, () => { window.__old = 1; location.reload(); });
    await until(page, () => !window.__mark && !!window.__okvir && window.__okvir.v === 1);
    f = await ready(page, 2);
    d = await page.evaluate(() => [window.__mark || 0, sessionStorage.getItem('rr-okvir-v')]);
    T.check('an outer page of another release: both load anew', !!f && d[0] === 0 && d[1] === '1', J(d));
    await page.evaluate(() => { window.__okvir.v = 0; window.__mark = 1; });
    await leave(f, () => { window.__old = 1; location.reload(); });
    f = await ready(page, 2);
    o = await outer(page);
    T.check('... once only', !!f && o.there && (await page.evaluate(() => window.__mark === 1)), J(o));
    await ctx.close();
  }

  // ---- the way out: the page in the frame does not answer ----
  {
    const ctx = await ctxOf(forced, null), page = await tabOf(ctx);
    let dead = true;
    await ctx.route('**/js/okvir.js', (q) => dead && q.request().frame().parentFrame() ? q.fulfill({ status: 200, contentType: 'text/javascript', body: '' }) : q.continue());
    const t0 = Date.now();
    await go(page, '/proba1.html?a=1#h'); await own(page);
    o = await outer(page); r = record(o);
    T.check('no answer from the frame: the page comes back as it was, ?okvir=0 added', !o.frame && o.own === 1 && o.url === 'proba1.html?a=1&okvir=0#h' && o.ss === '0', J(o));
    T.check('... and a record keeps the frame away for a day', r.zakaj === 'stran v okvirju se ni javila' && r.ua === (await page.evaluate(() => navigator.userAgent)) && Math.abs(r.do - t0 - 864e5) < 120000, o.ls);
    dead = false;
    const p2 = await tabOf(ctx);   // (another tab: ?okvir=0 is not kept there, the record alone decides)
    await go(p2, '/proba1.html'); await own(p2);
    o = await outer(p2);
    T.check('a valid record: no frame in another tab either', !o.frame && o.own === 1 && o.ss === null, J(o));
    await go(p2, '/proba-p.html'); d = await until(p2, () => window.__okvirPoroca);
    T.check('... and the decision says why (temni-nacin.html reads it)', !!d && d.okvir === false && d.zakaj === 'zapis rr-okvir: stran v okvirju se ni javila' && d.vsiljeno === true && d.poskus === true, J(d));
    await p2.evaluate(() => { const r = JSON.parse(localStorage.getItem('rr-okvir')); r.do = Date.now() - 1000; localStorage.setItem('rr-okvir', JSON.stringify(r)); });
    await go(p2, '/proba1.html'); f = await ready(p2);
    T.check('an expired record: the frame again', !!f && (await outer(p2)).there);
    await p2.evaluate(() => localStorage.setItem('rr-okvir', JSON.stringify({ do: Date.now() + 864e5, ua: 'another version', zakaj: 'x' })));
    await go(p2, '/proba1.html'); f = await ready(p2);
    T.check('a record of another browser version: the frame again', !!f && (await outer(p2)).there);
    // asked for by hand: the frame stays whatever its page does, and nothing is written
    dead = true;
    await p2.evaluate(() => localStorage.removeItem('rr-okvir'));
    await go(p2, '/proba1.html?okvir=1');
    await until(p2, () => { const e = document.getElementById('okvir'); return !!e && !!e.contentWindow.__proba && e.contentDocument.readyState === 'complete'; });
    await sleep(400);
    o = await outer(p2);
    T.check('?okvir=1 with a page that does not answer: the frame stays, no record', o.frame && !o.there && o.url === 'proba1.html?okvir=1' && o.ls === null && o.ss === null, J(o));
    await ctx.close();
  }

  // ---- the way out: the page in the frame is not told the dark scheme ----
  {
    const ctx = await ctxOf(forced, null, () => {
      try {
        if (!window.frameElement || window.frameElement.id !== 'okvir') return;
        const mm = window.matchMedia.bind(window);
        window.matchMedia = (q) => /prefers-color-scheme:\s*dark/.test(q) ? { matches: false, media: q } : mm(q);
      } catch (_) { }
    });
    const page = await tabOf(ctx), t0 = Date.now();
    await go(page, '/proba1.html'); await own(page);
    o = await outer(page); r = record(o);
    T.check('a frame whose page is not told dark: the page comes back as it was', !o.frame && o.own === 1 && o.url === 'proba1.html?okvir=0' && o.ss === '0', J(o));
    T.check('... and a record keeps the frame away for a week', r.zakaj === 'stran v okvirju ne dobi temne sheme' && Math.abs(r.do - t0 - 7 * 864e5) < 120000, o.ls);
    await ctx.close();
  }

  // ---- the switches ----
  {
    const ctx = await ctxOf(forced, null), page = await tabOf(ctx);
    await go(page, '/proba1.html?okvir=0'); await own(page);
    o = await outer(page); d = await square(page);
    T.check('forced, ?okvir=0: no frame, no record', !o.frame && o.own === 1 && o.ss === '0' && o.ls === null, J(o));
    T.check('... and white is repainted (what the frame is for)', !white(d) && d[0] + d[1] + d[2] < 300, J(d));
    await go(page, '/proba1.html'); await own(page);
    o = await outer(page);
    T.check('?okvir=0 holds for the tab', !o.frame && o.own === 1, J(o));
    await go(page, '/proba-p.html'); d = await until(page, () => window.__okvirPoroca);
    T.check('... and the decision says so', !!d && d.okvir === false && d.zakaj === 'izklopljen v tem zavihku (?okvir=0)' && d.vsiljeno === true, J(d));
    await page.evaluate(() => localStorage.setItem('rr-okvir', JSON.stringify({ do: Date.now() + 864e5, ua: navigator.userAgent, zakaj: 'x' })));
    await go(page, '/proba1.html?okvir=1'); f = await ready(page);
    d = await until(page, () => localStorage.getItem('rr-okvir') === null && sessionStorage.getItem('rr-okvir') === null, null, 5000);
    o = await outer(page);
    T.check('?okvir=1: the frame, the tab\'s switch and the record cleared', !!f && o.there && o.asked === true && !!d, J(o));
    await f.evaluate(() => history.replaceState(null, '', 'proba1.html?x=5'));
    o = await outer(page);
    T.check('... and the tab\'s address keeps ?okvir=1', o.url === 'proba1.html?x=5&okvir=1', o.url);
    await go(page, '/proba1.html'); f = await ready(page);
    o = await outer(page);
    T.check('... after it the frame comes by itself again', !!f && o.there && o.asked === false, J(o));
    await ctx.close();
  }

  // ---- a preferred scheme set by hand ----
  {
    const ctx = await ctxOf(forced, 'light'), page = await tabOf(ctx);
    await go(page, '/proba1.html'); await own(page);
    o = await outer(page);
    await go(page, '/proba-p.html'); d = await until(page, () => window.__okvirPoroca);
    T.check('forced, light set by hand: the trial frame is not told dark, so no frame and no record (the title\'s notice stays)', !o.frame && o.own === 1 && o.ls === null && o.ss === null && !!d && d.zakaj === 'okvir ne pove temne sheme' && d.poskus === false && d.vsiljeno === true, J([o, d]));
    await ctx.close();
    const c2 = await ctxOf(forced, 'dark'), p2 = await tabOf(c2);
    await go(p2, '/proba1.html'); await own(p2);
    o = await outer(p2); r = await square(p2);
    await go(p2, '/proba-p.html'); d = await until(p2, () => window.__okvirPoroca);
    T.check('forced, the player prefers dark: nothing is repainted (white is white), so no frame', !o.frame && o.own === 1 && white(r) && !!d && d.zakaj === 'ni vsiljenega temnenja' && d.vsiljeno === false, J([o, r, d]));
    await c2.close();
  }

  // ================= 2  the game itself =================
  const PAGE = srv.base + '/index.html';
  // a tab for the game, set up as openGame does (lib.mjs: that one waits for the game in the top page, and here it is in the frame)
  async function gameTab(browser, vp, opt = {}) {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: null, hasTouch: !!opt.touch });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !(/^Failed to load resource/.test(m.text()) && /\/assets\/tracks\/vrsic\.webp$/.test((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
    page.on('requestfailed', q => { const why = (q.failure() || {}).errorText || ''; if (why !== 'net::ERR_ABORTED') errors.push('request failed: ' + q.url() + (why ? ' (' + why + ')' : '')); });
    await page.addInitScript(([old, raw]) => {
      try {
        for (const k of ['tdgp-defaults-v2', 'tdgp-defaults-v3', 'tdgp-defaults-v4', 'tdgp-defaults-v5', 'tdgp-nu1', 'tdgp-noadapt', 'tdgp-nostartcam']) localStorage.setItem(k, '1');
        localStorage.setItem('tdgp-tips', JSON.stringify({ in: 1, box: 1, out: 1 }));
        if (old) localStorage.setItem('tdgp-menu', 'old');
        localStorage.setItem('tdgp-settings', raw);
      } catch (_) { }
    }, [!!opt.old, JSON.stringify({ sound: opt.sound ? 1 : 0, comm: 0, quali: 0, faults: 0, hlv: 0, carDet: 'normal', damage: 2, tower: 2, track: 'spa', intro: 2 })]);
    return { ctx, page, errors };
  }
  // the frame (or the top page) whose page answers fn
  async function frameWith(page, fn, ms = 180000) {
    for (const end = Date.now() + ms; Date.now() < end; await sleep(100)) {
      for (const fr of page.frames()) if (await fr.evaluate(fn).catch(() => false)) return fr;
    }
    return null;
  }
  const menuUp = () => !!(window.__game && window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'));
  const top = (page) => page.evaluate(() => {
    const e = document.getElementById('okvir'), o = window.__okvir, tc = document.querySelector('meta[name="theme-color"]');
    return { frame: !!e, game: !!window.__game, there: !!(o && e && o.dok === e.contentDocument), url: location.pathname.replace(/^.*\//, '') + location.search, title: document.title, tc: tc ? tc.content : '',
      ls: localStorage.getItem('rr-okvir'), ss: sessionStorage.getItem('rr-okvir'), fs: document.fullscreenElement ? document.fullscreenElement.id : '', theme: document.documentElement.getAttribute('data-theme') };
  });
  // the kerb strip at the title panel's left edge (css/menu.css: 14 px of red, 14 px of chalk, again and again): how many of its samples are
  // chalk and how many red
  async function strip(page, fr) {
    let q = null;
    for (let k = 0, last = ''; k < 60; k++) {   // (the title slides in: measured once it stands still)
      q = await fr.evaluate(() => { const e = document.getElementById('menu-host').shadowRoot.querySelector('.title-panel'); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.floor(b.bottom - b.top), innerWidth, innerHeight]; }).catch(() => null);
      if (q && J(q) === last) break;
      last = J(q); await sleep(300);
    }
    if (!q || q[0] < 0 || q[1] < 0 || q[1] + q[2] > q[4] || q[2] < 120) return { n: 0, white: 0, red: 0, q };
    const pts = []; for (let y = 16; y < q[2] - 16; y += 2) pts.push([4, y]);
    const px = await pixels(await page.screenshot({ clip: { x: q[0], y: q[1], width: 8, height: q[2] }, timeout: 150000 }), pts);
    return { n: px.length, white: px.filter(white).length, red: px.filter(p => p[0] > 170 && p[1] < 120 && p[2] < 120).length, q, px: px.slice(0, 12) };
  }
  let ref = null;

  // ---- a plain browser: the game as it is ----
  {
    const { ctx, page, errors } = await gameTab(plain, { width: 412, height: 915 });
    await page.goto(PAGE, { timeout: 180000 });
    f = await frameWith(page, menuUp);
    o = await top(page);
    T.check('the game, plain: no frame, nothing changed, nothing kept', f === page.mainFrame() && page.frames().length === 1 && !o.frame && o.game && o.theme === null && o.ls === null && o.ss === null, J([o, page.frames().length]));
    ref = await strip(page, f);
    T.check('... the kerb strip of its title is half chalk, half red', ref.n > 20 && ref.white > ref.n * 0.35 && ref.red > ref.n * 0.35, J(ref));
    T.check('... no errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ---- forced: the game in the frame ----
  {
    const { ctx, page, errors } = await gameTab(forced, { width: 412, height: 915 }, { touch: true, sound: true });
    await page.goto(PAGE, { waitUntil: 'commit', timeout: 180000 });
    f = await frameWith(page, menuUp);
    o = await top(page);
    T.check('the game, forced: it runs once, in the frame; the tab keeps its address, title and bar colour; nothing kept', !!f && f !== page.mainFrame() && page.frames().length === 2 && o.frame && !o.game && o.there && o.url === 'index.html'
      && o.title === 'Real Roads Atlas · Racing Game' && o.tc === '#161b23' && o.ls === null && o.ss === null, J([o, page.frames().length]));
    r = await strip(page, f);
    T.check('... the kerb strip of its title is painted as in a plain browser', !!ref && r.n === ref.n && Math.abs(r.white - ref.white) <= 2 && Math.abs(r.red - ref.red) <= 2, J([r, ref]));
    d = await f.evaluate(() => { const r = document.getElementById('menu-host').shadowRoot; return { tip: !!r.querySelector('.sheet.dtip'), link: !!r.querySelector('[data-act="dark-tip"]'), theme: document.documentElement.getAttribute('data-theme'), dark: matchMedia('(prefers-color-scheme: dark)').matches, sound: Sfx.ready }; });
    T.check('... told dark, in its light colours, without the notice about dark colours', d.dark && d.theme === 'light' && !d.tip && !d.link, J(d));

    const fsb = await f.evaluate(() => { const e = document.getElementById('menu-host').shadowRoot.querySelector('[data-act="game:fullscreen"]'); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
    if (fsb) await page.touchscreen.tap(fsb[0], fsb[1]);
    r = fsb ? await until(f, () => !!document.fullscreenElement && Sfx.ready, null, 10000) : null;
    o = await top(page);
    T.check('a touch in the frame: full screen (the tab\'s frame fills it), the sound unlocked', !!r && o.fs === 'okvir' && d.sound === false, J([fsb, o.fs, d.sound, await f.evaluate(() => [!!document.fullscreenElement, Sfx.ready])]));
    await page.evaluate(() => document.exitFullscreen()).catch(() => { });
    await until(f, () => !document.fullscreenElement, null, 10000);

    await leave(f, () => { location.href = 'garaza.html'; });
    f = await frameWith(page, () => !!window.__garage && Garage3D.ready);
    o = await top(page);
    T.check('the garage opens in the frame: the tab shows its address, title and bar colour', !!f && f !== page.mainFrame() && o.frame && o.there && o.url === 'garaza.html' && o.title === 'APEX RACING · Garaža' && o.tc === '#0e1626', J(o));
    if (f) await leave(f, () => { document.querySelector('[data-act="back"]').click(); });
    f = await frameWith(page, () => !!(window.__game && window.Menu && Menu.ready && !/zaslon/.test(location.search)));
    o = await top(page);
    T.check('... its Back returns to the game, in the frame, the tab following', !!f && f !== page.mainFrame() && o.frame && !o.game && o.there && o.url === 'index.html' && o.title === 'Real Roads Atlas · Racing Game' && o.tc === '#161b23' && o.ls === null && o.ss === null, J(o));
    T.check('... no errors', errors.length === 0, errors.slice(0, 3).join(' | '));

    // without the frame, in the same browser
    await page.goto(PAGE + '?okvir=0', { timeout: 180000 });
    f = await frameWith(page, menuUp);
    d = await until(f, () => { const s = document.getElementById('menu-host').shadowRoot.querySelector('.sheet.dtip'); return !!s && s.getAnimations().length === 0; }, null, 20000);
    await f.evaluate(() => { const r = document.getElementById('menu-host').shadowRoot, s = r.querySelector('.sheet.dtip'); if (s) (s.querySelector('[data-act="close-sheet"]') || r.querySelector('.sheet-bg')).click(); });
    await until(f, () => !document.getElementById('menu-host').shadowRoot.querySelector('.sheet.dtip'), null, 10000);
    await sleep(600);
    r = await strip(page, f);
    T.check('the game, forced, ?okvir=0: no frame, the notice about dark colours, the strip\'s chalk repainted (what the frame is for)', f === page.mainFrame() && page.frames().length === 1 && !!d && !!ref && r.n === ref.n && r.white <= 2, J([d, r]));
    await ctx.close();
  }

  // ---- forced: a race in the frame ----
  {
    const { ctx, page, errors } = await gameTab(forced, { width: 760, height: 360 }, { touch: true, old: true });
    await page.goto(PAGE, { waitUntil: 'commit', timeout: 180000 });
    f = await frameWith(page, () => !!window.__game);
    await startTrack(f, 'spa'); await simulate(f, 7);
    const cdp = await ctx.newCDPSession(page);
    const speed = () => f.evaluate(() => +document.getElementById('h-speed').textContent);
    const on = (id, v) => until(f, ([id, v]) => document.getElementById(id).classList.contains('on') === v, [id, v], 20000);
    const finger = async (id, done) => {
      const p = await f.evaluate((id) => { const e = document.getElementById(id), b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, b.width > 0 && getComputedStyle(e).display !== 'none']; }, id);
      if (!p[2]) return { seen: false, v: null, p };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p[0], y: p[1], id: 1 }] });
      const seen = !!(await on(id, true)); let v = null;
      for (const end = Date.now() + 45000; Date.now() < end; await sleep(250)) { v = await speed(); if (done(v)) break; }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      return { seen, v, off: !!(await on(id, false)) };
    };
    const v0 = await speed();
    const br = await finger('c-brake', v => v <= 12);
    const ga = await finger('c-gas', v => v >= br.v + 8);
    T.check('a finger on the brake, then on the gas: the touch drives the car in the frame', br.seen && br.v <= 12 && br.v < v0 && ga.seen && ga.v >= br.v + 8, J([v0, br, ga]));
    await page.keyboard.down('ArrowLeft'); d = !!(await on('c-left', true));
    await page.keyboard.up('ArrowLeft'); r = !!(await on('c-left', false));
    T.check('... and the keys steer it', d && r, J([d, r]));

    const pos = () => f.evaluate(() => { const c = getComputedStyle(document.getElementById('btn-pause')); return [parseFloat(c.top), parseFloat(c.right)]; });
    const p0 = await pos();
    await page.evaluate(() => { const e = document.getElementById('okvir-robovi'); window.__pad = e.style.padding; e.style.padding = '30px 5px 20px 10px'; dispatchEvent(new Event('resize')); });
    const p1 = await pos();
    await page.evaluate(() => { document.getElementById('okvir-robovi').style.padding = window.__pad; dispatchEvent(new Event('resize')); });
    const p2 = await pos();
    T.check('the screen\'s safe areas move the game\'s buttons in the frame', p1[0] === p0[0] + 30 && J(p2) === J(p0), J([p0, p1, p2]));

    await page.keyboard.press('Escape');
    d = await until(f, () => window.__game.screen === 'pause', null, 20000);
    const seg = await f.evaluate(() => { const e = document.querySelector('#crv-prow .seg button.sel'); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.floor(b.width), Math.floor(b.height), innerWidth, innerHeight]; });
    let row = [];
    if (seg && seg[0] >= 0 && seg[1] >= 0 && seg[0] + seg[2] <= seg[4] && seg[1] + seg[3] <= seg[5] && seg[2] > 24) {
      const pts = []; for (let x = 8; x < seg[2] - 8; x += 3) pts.push([x, 3]);
      row = await pixels(await page.screenshot({ clip: { x: seg[0], y: seg[1], width: seg[2], height: 8 }, timeout: 150000 }), pts);
    }
    T.check('Escape pauses the race; the chalk of the pause screen stays chalk', !!d && row.length > 4 && row.filter(white).length >= row.length - 1, J([seg, row.slice(0, 6)]));

    await f.evaluate(() => localStorage.setItem('rr-proba', '1'));
    d = await page.evaluate(() => { const v = localStorage.getItem('rr-proba'); localStorage.removeItem('rr-proba'); return [v, localStorage.getItem('rr-okvir'), sessionStorage.getItem('rr-okvir')]; });
    await page.setViewportSize({ width: 360, height: 760 });
    r = await until(f, () => innerWidth === 360 && innerHeight === 760 && matchMedia('(orientation: portrait)').matches, null, 10000);
    T.check('what the game keeps is in the tab\'s own store; a turned screen turns the game', d[0] === '1' && d[1] === null && d[2] === null && !!r, J([d, r]));
    T.check('... no errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  T.check('no page errors', errs.length === 0, errs.slice(0, 4).join(' | '));
} finally {
  await plain.close(); await forced.close(); await srv.close();
}
T.done();
