// The service worker and the lazy scripts (sw.js; I17 korak 8, docs/hitro-nalaganje.md), on copies of the game in a folder as on
// GitHub Pages, stamped as the publish step stamps them (tools/stamp.js):
// - a phone on its data (navigator.connection.type 'cellular', set in the copy's sw.js): the first visit saves the page and what it
//   links but the lazy scripts (<link rel="x-lazy-script">), only those the game asks for itself; once a race begins (a lazy track
//   asked for later than the page's start, as js/game.js does when a race is started on it) the others follow in the background
// - offline: the game starts, and lazy tracks never raced load from the saved copies
// - an update (a lazy track and sw.js changed): the new version of the track saved, the old one removed, every lazy file still saved
//   (an update never takes a track away offline), a stray saved file the page does not link removed
// - on Wi-Fi (or where the browser does not say, as a computer's): the lazy scripts are saved at once, after the first race's files
//   node tests/browser/sw.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO, ROOT, serve, launch, openGame, checker } from './lib.mjs';

const T = checker('sw');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const browser = await launch();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'apex-sw-'));

// a copy of the game in tmp/<name>/dirkaska-igra, stamped; phone: its sw.js sees a phone's data connection
function copy(name, phone) {
  const dir = path.join(tmp, name, 'dirkaska-igra');
  fs.mkdirSync(dir, { recursive: true });
  for (const f of ['index.html', 'manifest.webmanifest', 'sw.js']) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  for (const d of ['css', 'js', 'icons', 'fonts']) fs.cpSync(path.join(ROOT, d), path.join(dir, d), { recursive: true });
  if (phone) fs.writeFileSync(path.join(dir, 'sw.js'), "Object.defineProperty(self.navigator, 'connection', { value: { type: 'cellular', saveData: false } });\n" + fs.readFileSync(path.join(dir, 'sw.js'), 'utf8'));
  const ok = spawnSync(process.execPath, [path.join(REPO, 'tools', 'stamp.js')], { env: { ...process.env, GAME_ROOT: dir } }).status === 0;
  return { dir, root: path.join(tmp, name), stamp: () => spawnSync(process.execPath, [path.join(REPO, 'tools', 'stamp.js')], { env: { ...process.env, GAME_ROOT: dir } }).status === 0, ok };
}

// what is saved: the saved page's title, its links split into the lazy ones and the others, and which of them are saved
const saved = (page) => page.evaluate(async () => {
  const name = (await caches.keys()).find(k => k.startsWith('apex-racing ')); if (!name) return { page: null, keys: [], core: [], lazy: [] };
  const c = await caches.open(name), keys = (await c.keys()).map(r => r.url), base = new URL('./', location.href), pg = await c.match(base.href);
  if (!pg) return { page: null, keys, core: [], lazy: [] };
  const html = (await pg.text()).replace(/<!--[\s\S]*?-->/g, ''), core = [], lazy = [];
  for (const m of html.matchAll(/<(script|link)\b[^>]*?\s(?:src|href)="([^"]+)"[^>]*/g)) {
    if (/^([a-z]+:|\/\/|#)/i.test(m[2])) continue;
    (m[1] === 'link' && /rel="x-lazy-script"/.test(m[0]) ? lazy : core).push(new URL(m[2], base).href);
  }
  return { page: (html.match(/<title>([^<]*)/) || [])[1], keys, core, lazy };
});
const coreOk = (s) => !!s.page && s.core.every(u => s.keys.includes(u));
const lazyIn = (s) => s.lazy.filter(u => s.keys.includes(u));
const until = async (page, ok, n = 150) => { let s = null; for (let i = 0; i < n; i++) { s = await saved(page); if (ok(s)) break; await wait(200); } return s; };
const short = (u) => u.replace(/^.*\/dirkaska-igra\//, '');

try {
  // 1. a phone on its data
  {
    const A = copy('phone', true);
    T.check('the phone copy stamped (tools/stamp.js with GAME_ROOT)', A.ok && /js\/tracks\/spa\.js\?v=[0-9a-f]{8}/.test(fs.readFileSync(path.join(A.dir, 'index.html'), 'utf8')));
    const srv = await serve(A.root), home = srv.base + '/dirkaska-igra/';
    const asked = new Set();   // (the lazy scripts the page itself asked for)
    try {
      const { ctx, page, errors } = await openGame(browser, home);
      page.on('request', (r) => { if (/\/js\/.*\.js\?v=/.test(r.url()) && r.resourceType() === 'script') asked.add(r.url()); });
      await page.evaluate(() => navigator.serviceWorker.ready);
      let s = await until(page, coreOk);
      T.check('first visit on a phone\'s data: the page and everything it links but the lazy scripts saved', coreOk(s) && s.lazy.length >= 10, `saved "${s.page}", ${s.core.length} files, ${s.lazy.length} lazy links`);
      await wait(11000); s = await saved(page);   // (a race is begun from the menus, later than the title demo's track: sw.js BOOT)
      const early = lazyIn(s).filter(u => !asked.has(u));
      T.check('… the lazy scripts not saved before a race (only those the game asked for itself)', early.length === 0 && lazyIn(s).length < s.lazy.length, `${lazyIn(s).length} of ${s.lazy.length} saved, not asked: ${early.map(short).join(' ')}`);

      // a race begins on a lazy track (js/game.js asks for its file: Core.loadTrack), well after the page's start
      const spa = s.lazy.find(u => /\/js\/tracks\/spa\.js/.test(u));
      const loaded = await page.evaluate(() => Core.loadTrack('spa').then(() => true, () => false));
      s = await until(page, x => x.keys.includes(spa), 50);
      T.check('a race on a lazy track: its file saved as it comes', loaded && s.keys.includes(spa), short(spa || 'no spa link'));
      s = await until(page, x => lazyIn(x).length === x.lazy.length, 150);
      T.check('… and the other lazy scripts after it, in the background', lazyIn(s).length === s.lazy.length, `${lazyIn(s).length} of ${s.lazy.length}`);

      // offline: the game starts, lazy tracks never raced load from the saved copies
      srv.setOffline(true);
      await page.reload({ timeout: 30000 }); await page.waitForFunction(() => window.__game, null, { timeout: 60000 });
      const off = await page.evaluate(() => Promise.all(['bathurst', 'montreal'].map(id => Core.loadTrack(id).then(() => Core.trackLoaded(id), () => false))).then(r => ({ r, title: document.title, screen: window.__game.screen })));
      T.check('offline: the game starts, lazy tracks never raced load from the saved copies', off.screen === 'title' && off.r.every(Boolean), JSON.stringify(off));
      srv.setOffline(false);

      // an update: a lazy track and sw.js changed (a new worker, which has seen no race); a stray saved file
      const stray = home + 'js/tracks/stale.js?v=deadbeef';
      await page.evaluate(async (u) => { const name = (await caches.keys()).find(k => k.startsWith('apex-racing ')); await (await caches.open(name)).put(u, new Response('//')); }, stray);
      fs.appendFileSync(path.join(A.dir, 'js', 'tracks', 'spa.js'), '\n// version 2\n');
      fs.appendFileSync(path.join(A.dir, 'sw.js'), '\n// version 2\n');
      fs.writeFileSync(path.join(A.dir, 'index.html'), fs.readFileSync(path.join(A.dir, 'index.html'), 'utf8').replace(/<title>[^<]*<\/title>/, '<title>Real Roads Atlas 2</title>'));
      const spa2 = A.stamp() && (fs.readFileSync(path.join(A.dir, 'index.html'), 'utf8').match(/js\/tracks\/spa\.js\?v=[0-9a-f]{8}/) || [''])[0];
      T.check('version 2 stamped: a new address for the changed lazy track', !!spa2 && !spa.endsWith(spa2), spa2);
      await page.reload({ timeout: 30000 }); await page.waitForFunction(() => window.__game, null, { timeout: 60000 });
      s = await until(page, x => x.page === 'Real Roads Atlas 2' && x.keys.includes(home + spa2) && !x.keys.includes(spa) && !x.keys.includes(stray), 150);
      T.check('update: the new version of the lazy track saved, the old one and a stray file removed', s.page === 'Real Roads Atlas 2' && s.keys.includes(home + spa2) && !s.keys.includes(spa) && !s.keys.includes(stray), `saved "${s.page}", new ${s.keys.includes(home + spa2)}, old ${s.keys.includes(spa)}, stray ${s.keys.includes(stray)}`);
      T.check('… every lazy script still saved (an update never takes a track away offline)', coreOk(s) && lazyIn(s).length === s.lazy.length, `${lazyIn(s).length} of ${s.lazy.length}`);
      srv.setOffline(true);
      await page.reload({ timeout: 30000 }); await page.waitForFunction(() => window.__game, null, { timeout: 60000 });
      const off2 = await page.evaluate(() => Core.loadTrack('spa').then(() => ({ ok: Core.trackLoaded('spa'), v2: [...document.scripts].some(s => /tracks\/spa\.js\?v=/.test(s.src)), title: document.title }), () => ({ ok: false })));
      T.check('offline: version 2 starts and its lazy track loads', off2.ok && off2.title === 'Real Roads Atlas 2', JSON.stringify(off2));
      srv.setOffline(false);
      T.check('no page errors (a phone)', !errors.length, errors.slice(0, 5).join(' | '));
      await ctx.close();
    } finally { await srv.close(); }
  }

  // 2. on Wi-Fi (a computer's browser does not say): everything at once, the lazy scripts after the first race's files
  {
    const B = copy('wifi', false);
    const srv = await serve(B.root), home = srv.base + '/dirkaska-igra/', log = [];
    srv.setFail((req) => { if (req.headers['sec-fetch-mode'] === 'cors' && /\.js(\?|$)/.test(req.url)) log.push(req.url); return false; });   // (the worker's own downloads)
    try {
      const { ctx, page, errors } = await openGame(browser, home);
      await page.evaluate(() => navigator.serviceWorker.ready);
      const s = await until(page, x => coreOk(x) && lazyIn(x).length === x.lazy.length, 150);
      T.check('first visit on Wi-Fi: the page, what it links and every lazy script saved without a race', coreOk(s) && s.lazy.length >= 10 && lazyIn(s).length === s.lazy.length, `${lazyIn(s).length} of ${s.lazy.length} lazy`);
      const isLazy = (u) => s.lazy.some(l => l.endsWith(u));
      const firstLazy = log.findIndex(isLazy), lastCore = log.map(u => !isLazy(u)).lastIndexOf(true);
      T.check('… the lazy scripts after the first race\'s files (no competing with them)', firstLazy > lastCore && lastCore >= 0, `the worker's downloads: last other script #${lastCore}, first lazy #${firstLazy} of ${log.length}`);
      T.check('no page errors (Wi-Fi)', !errors.length, errors.slice(0, 5).join(' | '));
      await ctx.close();
    } finally { await srv.close(); }
  }
} finally {
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
T.done();
