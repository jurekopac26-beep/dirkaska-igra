// The game as an app, and the screen orientation:
// - manifest.webmanifest: name, start address, full screen, icons of the stated size (the files exist)
// - "Namesti igro" shows only when the browser offers to install the game, and asks for it; an offer during full screen
//   does not take the full-screen buttons away
// - the screen turns the camera's way (portrait for the chase camera, landscape for iso and kino): in full screen and in
//   the installed app, not in a plain browser tab; a phone held the other way in a race: the notice to turn it says why, and
//   its button plays on the way it is held (upright: the camera behind the car)
// - offline, on a copy of the game in a folder as on GitHub Pages: once opened, the game starts without internet; a new
//   version is used at once and saved complete; a save that breaks off leaves the previous version complete (never a mix);
//   a server error or a network that does not answer brings the saved game (within seconds); a game left open loads a
//   new version by itself when it is back on the title screen
//   node tests/browser/app.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO, ROOT, serve, launch, openGame, startTrack, checker } from './lib.mjs';

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
    await page.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => Promise.resolve(); window.dispatchEvent(e); });   // (Chrome's offer, during full screen)
    await camera(page, 'iso'); await camera(page, 'kino'); await camera(page, 'chase'); await wait(100);
    const turned = await locks(page);
    ev = fsEvent(); await page.evaluate(() => document.exitFullscreen()); await ev;
    await camera(page, 'iso'); await wait(100);
    const after = await locks(page);
    const btns = await page.evaluate(() => ({ fullscreen: [...document.querySelectorAll('[data-act="fullscreen"]')].map(b => !b.classList.contains('off')), install: !document.getElementById('btn-install').classList.contains('off') }));
    T.check('browser tab: no orientation lock while not in full screen', tab.length === 0, JSON.stringify(tab));
    T.check('full screen: portrait for the chase camera', full && inPortrait(inFs), `full screen ${full}, locks ${JSON.stringify(inFs)}`);
    T.check('full screen: the camera setting turns it (iso and kino landscape, chase portrait)', turned.slice(1).join() === 'landscape,landscape,portrait', JSON.stringify(turned));
    T.check('full screen over: no more locks', after.length === turned.length, JSON.stringify(after));
    T.check('an install offer during full screen: afterwards the full-screen buttons and "Namesti igro" are there', btns.fullscreen.length >= 2 && btns.fullscreen.every(Boolean) && btns.install, JSON.stringify(btns));
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

  // 4b. a phone held upright in a race while the camera chosen is a landscape one (iso): the notice to turn the phone says why, and its
  //     button plays on upright instead (the camera behind the car, kept as the setting)
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }), page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    await page.addInitScript((raw) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-settings', raw); }, JSON.stringify({ sound: 0, comm: 0, quali: 0, camera: 'iso' }));
    await page.goto(srv.base + '/index.html'); await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
    await startTrack(page, 'jezero'); await wait(800);
    const st = () => page.evaluate(() => ({ show: document.getElementById('rotate').classList.contains('show'), txt: document.getElementById('rotate-txt').textContent, why: document.getElementById('rotate-why').textContent, btn: document.getElementById('rotate-cam').textContent, cam: window.__game.S.camera }));
    const before = await st(); await page.tap('#rotate-cam'); await wait(500); const after = await st();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-settings')).camera);
    T.check('a phone held upright in a race, the camera a landscape one: the notice says why, its button plays on upright (the camera behind the car, kept)',
      before.show && /ležeči/.test(before.txt) && /izometrična/.test(before.why) && before.btn === 'Igraj pokončno' && !after.show && after.cam === 'chase' && saved === 'chase', JSON.stringify({ before, after, saved }));
    T.check('no page errors (a phone held upright)', !errors.length, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }

  // 5. offline and updates, on a copy of the game in a folder (as on GitHub Pages: …/dirkaska-igra/), so that the test can
  //    publish new versions
  {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'apex-app-'));
    const dir = path.join(tmp, 'dirkaska-igra');
    fs.mkdirSync(dir);
    for (const f of ['index.html', 'manifest.webmanifest', 'sw.js']) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
    for (const d of ['css', 'js', 'icons']) fs.cpSync(path.join(ROOT, d), path.join(dir, d), { recursive: true });
    const s2 = await serve(tmp), home = s2.base + '/dirkaska-igra/';
    const isPage = (req) => req.url === '/dirkaska-igra/' || req.url === '/dirkaska-igra/index.html';
    // publish version n: a changed script and title, stamped like a real change; returns the script's new address
    const publish = (n) => {
      fs.appendFileSync(path.join(dir, 'js', 'sfx.js'), `\n// version ${n}\n`);
      fs.writeFileSync(path.join(dir, 'index.html'), fs.readFileSync(path.join(dir, 'index.html'), 'utf8').replace(/<title>[^<]*<\/title>/, `<title>APEX RACING ${n}</title>`));
      const ok = spawnSync(process.execPath, [path.join(REPO, 'tools', 'stamp.js')], { env: { ...process.env, GAME_ROOT: dir } }).status === 0;
      return ok && fs.readFileSync(path.join(dir, 'index.html'), 'utf8').match(/js\/sfx\.js\?v=[0-9a-f]{8}/)[0];
    };
    try {
      const { ctx, page, errors } = await openGame(browser, home);
      // the saved game: the saved page's title, whether every file it links is saved too, and the saved files
      const saved = () => page.evaluate(async () => {
        const name = (await caches.keys()).find(k => k.startsWith('apex-racing')); if (!name) return { page: null, complete: false, keys: [] };
        const c = await caches.open(name), keys = (await c.keys()).map(r => r.url), base = new URL('./', location.href), pg = await c.match(base.href);
        if (!pg) return { page: null, complete: false, keys };
        const html = await pg.text(), want = [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(?:script|link)\b[^>]*?\s(?:src|href)="([^"]+)"/g)].map(m => new URL(m[1], base).href);
        return { page: (html.match(/<title>([^<]*)/) || [])[1], complete: want.every(u => keys.includes(u)), keys };
      });
      const until = async (ok) => { let st = null; for (let i = 0; i < 150; i++) { st = await saved(); if (ok(st)) break; await wait(200); } return st; };
      const reload = async () => {   // (a game that does not start is reported, not thrown: the checks below say what failed)
        try { await page.reload({ timeout: 30000 }); await page.waitForFunction(() => window.__game, null, { timeout: 30000 }); } catch (e) { return { title: null, screen: null, sfx: '', error: e.message.split('\n')[0] }; }
        return page.evaluate(() => ({ title: document.title, screen: window.__game.screen, sfx: document.querySelector('script[src*="js/sfx.js"]').src }));
      };

      await page.evaluate(() => navigator.serviceWorker.ready);
      let st = await until(x => x.page && x.complete);
      T.check('first visit (in a folder, as on GitHub Pages): the page and every file it needs are saved', st.page === 'APEX RACING' && st.complete, `saved "${st.page}", ${st.keys.length} files, complete ${st.complete}`);
      s2.setOffline(true);
      let g = await reload();
      T.check('offline: the game starts from the saved copy', g.title === 'APEX RACING' && g.screen === 'title', JSON.stringify(g));

      // version 2, but the connection breaks while it is being saved (only the service worker's own download of the new
      // script fails; the page itself gets it): the saved game stays version 1, complete
      s2.setOffline(false);
      const sfx1 = g.sfx, sfx2 = publish(2);
      s2.setFail((req) => !!sfx2 && req.url.endsWith(sfx2) && req.headers['sec-fetch-mode'] === 'cors');
      g = await reload();
      T.check('online: version 2 is used at once', !!sfx2 && g.title === 'APEX RACING 2' && g.sfx.endsWith(sfx2), `${g.title}, ${g.sfx.split('/').pop()} (was ${sfx1.split('/').pop()})`);
      await wait(1500); st = await saved();
      T.check('a save that breaks off leaves the saved game as it was (version 1, complete)', st.page === 'APEX RACING' && st.complete, `saved "${st.page}", complete ${st.complete}`);
      s2.setOffline(true); g = await reload();
      T.check('offline: version 1 starts, not a mix of both', g.title === 'APEX RACING' && g.sfx === sfx1, JSON.stringify(g));

      // back online: version 2 saved complete, the old file removed
      s2.setOffline(false); s2.setFail(null); g = await reload();
      st = await until(x => x.page === 'APEX RACING 2' && x.complete && !x.keys.includes(sfx1));
      T.check('online again: version 2 saved complete, the old file removed', g.title === 'APEX RACING 2' && st.page === 'APEX RACING 2' && st.complete && !st.keys.includes(sfx1), `saved "${st.page}", complete ${st.complete}, old file kept ${st.keys.includes(sfx1)}`);
      s2.setOffline(true); g = await reload();
      T.check('offline: version 2 starts', g.title === 'APEX RACING 2' && g.screen === 'title', JSON.stringify(g));

      // a server problem, and a network that does not answer (one bar of signal): the saved game, within seconds
      s2.setOffline(false); s2.setFail((req) => isPage(req) && 503); g = await reload();
      T.check('server error (503): the saved game starts', g.title === 'APEX RACING 2' && g.screen === 'title', JSON.stringify(g));
      s2.setFail((req) => isPage(req) && 'hang');
      const t0 = Date.now(); g = await reload(); const secs = (Date.now() - t0) / 1000;
      T.check('no answer from the network: the saved game starts within seconds', g.title === 'APEX RACING 2' && secs < 20, `${g.title} after ${secs.toFixed(1)} s`);
      s2.setFail(null); g = await reload(); await wait(1500);   // (online again, a clean start; whatever the step above left has settled)

      // the game left open (an installed app in the background): version 3 comes when it is back on the title screen
      await page.evaluate(() => { window.__before = 1; }).catch(() => { });
      const sfx3 = publish(3); await wait(1500);
      const steady = await page.evaluate(() => window.__before === 1).catch(() => false);   // (nothing reloaded it before it was back)
      const back = () => page.evaluate(() => { window.__before = 1; document.dispatchEvent(new Event('visibilitychange')); }).catch(() => { });
      await back();
      let t3 = null; for (let i = 0; i < 100 && t3 !== 'APEX RACING 3'; i++) { await wait(300); try { t3 = await page.evaluate(() => (window.__game ? document.title : null)); } catch (_) { } }
      const fresh = await page.waitForFunction(() => window.__game, null, { timeout: 30000 }).then(() => page.evaluate(() => !window.__before)).catch(() => false);
      T.check('back in the open game: a new version loads by itself', !!sfx3 && steady && t3 === 'APEX RACING 3' && fresh, `title ${t3}, reloaded ${fresh}, untouched before ${steady}`);
      await back(); await wait(2500);
      const stayed = await page.evaluate(() => window.__before === 1).catch(() => false);
      T.check('back in the open game, nothing new: no reload', stayed, `stayed ${stayed}`);
      T.check('no page errors (offline and updates)', !errors.length, errors.slice(0, 5).join(' | '));
      await ctx.close();
    } finally { await s2.close(); }
  }
} finally {
  await browser.close(); await srv.close();
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
}
T.done();

function inPortrait(l) { return l.length === 1 && l[0] === 'portrait'; }
