// The game as an app, and the screen orientation:
// - manifest.webmanifest: name, start address, full screen, icons of the stated size (the files exist)
// - "Namesti igro" shows only when the browser offers to install the game, and asks for it
// - the screen turns the camera's way (portrait for the chase camera, landscape for iso and kino): in full screen and in
//   the installed app, not in a plain browser tab
// - offline: once opened, the game starts without internet; with internet, a new version replaces the saved one, and the
//   saved game never mixes old and new files
//   node tests/browser/app.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO, ROOT, serve, launch, openGame, checker } from './lib.mjs';

const T = checker('app');
const srv = await serve();
const browser = await launch();
const wait = (ms) => new Promise(r => setTimeout(r, ms));
// (run in the page before the game) every screen.orientation.lock() is recorded: headless Chromium has no screen to turn
const recordLocks = () => { window.__locks = []; Object.defineProperty(screen.orientation, 'lock', { configurable: true, value: (o) => { window.__locks.push(o); return Promise.resolve(); } }); };
// (run in the page before the game) the page is the installed app: display-mode full screen
const installed = () => { const mm = window.matchMedia.bind(window); window.matchMedia = (q) => /display-mode/.test(q) ? { matches: true, media: q, onchange: null, addEventListener() { }, removeEventListener() { }, addListener() { }, removeListener() { }, dispatchEvent() { return false; } } : mm(q); };
const locks = (page) => page.evaluate(() => window.__locks.slice());
const camera = (page, v) => page.evaluate((v) => { document.querySelector(`[data-set="camera"] button[data-v="${v}"]`).click(); }, v);
let tmp = null;
try {
  // 1. manifest and icons
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html');
    const m = await page.evaluate(async () => {
      const href = document.querySelector('link[rel="manifest"]').href, man = await (await fetch(href)).json();
      const size = async (u) => { const r = await fetch(u); if (!r.ok) return 'missing'; const b = await createImageBitmap(await r.blob()); return b.width + 'x' + b.height; };
      const icons = []; for (const ic of man.icons) icons.push({ sizes: ic.sizes, purpose: ic.purpose || 'any', real: await size(new URL(ic.src, href)) });
      return { man, icons, apple: await size(document.querySelector('link[rel="apple-touch-icon"]').href), tab: await size(document.querySelector('link[rel="icon"]').href) };
    });
    const { man, icons } = m;
    T.check('manifest: name, start address and scope, full screen, colours', man.name === 'APEX RACING' && man.short_name.length <= 12 && man.start_url === './' && man.scope === './' && man.display === 'fullscreen' && !!man.theme_color && !!man.background_color,
      `${man.name} / ${man.short_name}, start ${man.start_url}, display ${man.display}`);
    T.check('icons: 192 and 512 px and a maskable one for Android, each file the stated size', icons.every(i => i.real === i.sizes) && ['192x192', '512x512'].every(s => icons.some(i => i.sizes === s && i.purpose === 'any')) && icons.some(i => i.purpose === 'maskable'),
      icons.map(i => `${i.sizes} ${i.purpose}: ${i.real}`).join(', '));
    T.check('home screen icon for the iPhone (180 px) and the browser tab icon', m.apple === '180x180' && m.tab === '192x192', `apple ${m.apple}, tab ${m.tab}`);

    // 2. "Namesti igro": hidden until the browser offers the installation; a tap asks for it; after it a message
    const inst = await page.evaluate(async () => {
      const b = document.getElementById('btn-install'), hidden = b.classList.contains('off');
      let asked = 0; const ev = new Event('beforeinstallprompt', { cancelable: true }); ev.prompt = () => { asked++; return Promise.resolve({ outcome: 'accepted' }); };
      window.dispatchEvent(ev);
      const shown = !b.classList.contains('off');
      b.click(); await new Promise(r => setTimeout(r, 100));
      const gone = b.classList.contains('off');
      window.dispatchEvent(new Event('appinstalled')); await new Promise(r => setTimeout(r, 100));
      return { hidden, shown, own: ev.defaultPrevented, asked, gone, toast: document.getElementById('toast').textContent };
    });
    T.check('"Namesti igro": hidden, shown when the browser offers it, a tap asks once, then a message', inst.hidden && inst.shown && inst.own && inst.asked === 1 && inst.gone && /nameščena/.test(inst.toast), JSON.stringify(inst));
    T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }

  // 3. orientation in a browser tab: locked only in full screen (browsers allow it only there)
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { camera: 'chase' }, { width: 390, height: 844 }, { init: recordLocks });
    await camera(page, 'iso'); await camera(page, 'chase');
    const tab = await locks(page);
    // (the browser reports full screen with the next frame: wait for the game's fullscreenchange handler to have run)
    const fsEvent = () => page.evaluate(() => new Promise(r => { document.addEventListener('fullscreenchange', () => setTimeout(r, 50), { once: true }); setTimeout(r, 15000); }));
    let ev = fsEvent(); await page.click('#btn-fs'); await ev;
    const full = await page.evaluate(() => !!document.fullscreenElement), inFs = await locks(page);
    await camera(page, 'iso'); await camera(page, 'kino'); await camera(page, 'chase'); await wait(100);
    const turned = await locks(page);
    ev = fsEvent(); await page.evaluate(() => document.exitFullscreen()); await ev;
    await camera(page, 'iso'); await wait(100);
    const after = await locks(page);
    T.check('browser tab: no orientation lock while not in full screen', tab.length === 0, JSON.stringify(tab));
    T.check('full screen: portrait for the chase camera', full && inPortrait(inFs), `full screen ${full}, locks ${JSON.stringify(inFs)}`);
    T.check('full screen: the camera setting turns it (iso and kino landscape, chase portrait)', turned.slice(1).join() === 'landscape,landscape,portrait', JSON.stringify(turned));
    T.check('full screen over: no more locks', after.length === turned.length, JSON.stringify(after));
    T.check('no page errors (browser tab)', !errors.length, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }

  // 4. the installed app (display-mode full screen): locked from the start, no full-screen or install buttons
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { camera: 'iso' }, { width: 844, height: 390 }, { init: { content: `(${recordLocks})(); (${installed})();` } });
    await wait(300);
    const start = await locks(page);
    const ui = await page.evaluate(() => {
      const ev = new Event('beforeinstallprompt', { cancelable: true }); ev.prompt = () => Promise.resolve(); window.dispatchEvent(ev);
      return { fullscreenHidden: [...document.querySelectorAll('[data-act="fullscreen"]')].map(b => b.classList.contains('off')), installHidden: document.getElementById('btn-install').classList.contains('off') };
    });
    await camera(page, 'chase'); await wait(100);
    const after = await locks(page);
    T.check('installed app: locked from the start (landscape for iso)', start.join() === 'landscape', JSON.stringify(start));
    T.check('installed app: no full-screen buttons, no install button', ui.fullscreenHidden.length >= 2 && ui.fullscreenHidden.every(Boolean) && ui.installHidden, JSON.stringify(ui));
    T.check('installed app: the camera setting turns it (chase: portrait)', after.join() === 'landscape,portrait', JSON.stringify(after));
    T.check('no page errors (installed app)', !errors.length, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }

  // 5. offline and updates, on a copy of the game (so that the test can publish a new version)
  {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'apex-app-'));
    for (const f of ['index.html', 'manifest.webmanifest', 'sw.js']) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
    for (const d of ['css', 'js', 'icons']) fs.cpSync(path.join(ROOT, d), path.join(tmp, d), { recursive: true });
    const s2 = await serve(tmp);
    try {
      const { ctx, page, errors } = await openGame(browser, s2.base + '/index.html');
      // what is saved: the page (its title) and whether every file it links is saved too
      const saved = () => page.evaluate(async () => {
        const c = await caches.open('apex-racing'), keys = (await c.keys()).map(r => r.url);
        const want = [...document.querySelectorAll('script[src], link[href]')].map(e => e.src || e.href).filter(u => u.startsWith(location.origin));
        const pg = await c.match(new URL('./', location.href).href);
        return { keys, missing: want.filter(u => !keys.includes(u)), page: pg ? ((await pg.text()).match(/<title>([^<]*)/) || [])[1] : null };
      });
      const until = async (ok) => { let s = null; for (let i = 0; i < 150; i++) { s = await saved(); if (ok(s)) break; await wait(200); } return s; };
      await page.evaluate(() => navigator.serviceWorker.ready);
      let st = await until(s => s.page && !s.missing.length);
      T.check('first visit: the page and every file it needs are saved', !!st.page && !st.missing.length, `${st.keys.length} files saved, missing: ${st.missing.join(', ') || 'none'}`);

      s2.setOffline(true);   // no internet: the game still starts
      await page.reload(); await page.waitForFunction(() => window.__game, null, { timeout: 60000 });
      const off1 = await page.evaluate(() => ({ title: document.title, screen: window.__game.screen }));
      T.check('offline: the game starts from the saved copy', off1.title === 'APEX RACING' && off1.screen === 'title', JSON.stringify(off1));

      // a new version (a changed script, a changed title), published while the game is open
      s2.setOffline(false);
      const oldSfx = await page.evaluate(() => document.querySelector('script[src*="js/sfx.js"]').src);
      fs.appendFileSync(path.join(tmp, 'js', 'sfx.js'), '\n// a new version\n');
      fs.writeFileSync(path.join(tmp, 'index.html'), fs.readFileSync(path.join(tmp, 'index.html'), 'utf8').replace('<title>APEX RACING</title>', '<title>APEX RACING 2</title>'));
      const stamped = spawnSync(process.execPath, [path.join(REPO, 'tools', 'stamp.js')], { env: { ...process.env, GAME_ROOT: tmp } }).status === 0;
      await page.reload(); await page.waitForFunction(() => window.__game, null, { timeout: 60000 });
      const on2 = await page.evaluate(() => ({ title: document.title, sfx: document.querySelector('script[src*="js/sfx.js"]').src }));
      T.check('online: the new version is used at once', stamped && on2.title === 'APEX RACING 2' && on2.sfx !== oldSfx, `title ${on2.title}, ${on2.sfx.split('/').pop()} (was ${oldSfx.split('/').pop()})`);
      st = await until(s => s.page === 'APEX RACING 2' && !s.missing.length && !s.keys.includes(oldSfx));
      T.check('the new version is saved complete and the old file is gone', st.page === 'APEX RACING 2' && !st.missing.length && !st.keys.includes(oldSfx), `saved "${st.page}", ${st.keys.length} files, missing ${st.missing.length}, old sfx still saved: ${st.keys.includes(oldSfx)}`);

      s2.setOffline(true);   // offline again: the new version starts
      await page.reload(); await page.waitForFunction(() => window.__game, null, { timeout: 60000 });
      const off2 = await page.evaluate(() => ({ title: document.title, screen: window.__game.screen }));
      T.check('offline again: the new version starts', off2.title === 'APEX RACING 2' && off2.screen === 'title', JSON.stringify(off2));
      T.check('no page errors (offline and update)', !errors.length, errors.slice(0, 5).join(' | '));
      await ctx.close();
    } finally { await s2.close(); }
  }
} finally {
  await browser.close(); await srv.close();
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
}
T.done();

function inPortrait(l) { return l.length === 1 && l[0] === 'portrait'; }
