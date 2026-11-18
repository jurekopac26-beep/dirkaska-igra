// Service worker: once the game has been opened, it also starts without internet (the installed app too), and whenever
// there is internet it is the newest version.
// - The page (index.html) comes from the network first. The saved copy is used when the network does not answer, answers
//   with a server error, or is slower than 4 s (one bar of signal); the network's page is then still saved for next time.
// - On the published game the scripts and styles it links carry a content stamp (?v=…: the publish step puts it on the page's links,
//   tools/stamp.js), so a saved copy of those is never out of date: they come from the saved copies first. Without stamps (the
//   repository's page, e.g. on a local server) they come from the network first, and the saved copies only without internet.
// - A new index.html is saved only together with everything it links (and the fonts its stylesheets name), so the saved game is
//   always complete; files it no longer links are then removed. Each copy of the game (its own folder) keeps its own saved files.
// - The lazy scripts (<link rel="x-lazy-script">, js/leno.js: the tracks' full files proga-<id>, the world builders svet-<name>, the
//   new map's) are not needed for the first race (I17 korak 8, docs/hitro-nalaganje.md), so they do not compete with its download:
//   the page is saved with the rest of what it links, plus the lazy files already saved in an earlier version (an update never takes
//   a track away offline). The other lazy files are saved afterwards, a few at a time, in the background: at once on Wi-Fi, a cable or
//   wherever the browser does not say (navigator.connection: not 'cellular' or 'bluetooth', no data saver), else once the first race
//   begins (a lazy track asked for after the page's own start, or the page's message 'leno-vse'). A lazy file the game asks for itself
//   is kept as it comes from the network. Offline, a lazy file not saved yet fails as without the worker (Leno.load rejects; the game
//   keeps its track or falls back to Jezero, js/game.js boot).
// - The menu's pictures (assets/: the models of the tracks, the maps, the cars, the landmarks' models; not the videos and the music) are kept as they are looked at, in
//   a cache of their own: the kept copy at once, the newest from the network for next time. Without internet the menu shows the pictures
//   already seen.
// - When a new worker takes over (activate), the saved files the saved page does not link (lazy ones of an old version, a save that
//   broke off) are removed, and the background save goes on.
// To switch it off for every player: replace this file with one that, when installed, calls self.skipWaiting(), and when
// activated deletes its caches (caches.keys() starting with 'apex-racing') and calls self.registration.unregister();
// and remove the navigator.serviceWorker.register() call from js/game.js.
'use strict';
const CACHE = 'apex-racing ' + self.registration.scope;   // (the game's first name, kept: a new name would leave the saved copies behind)
const EXTRA = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
const abs = (u) => new URL(u, self.registration.scope).href;
const PAGE = () => abs('./');   // (the key of the saved index.html, whichever address opened it)
const STAMPED = /[?&]v=[0-9a-f]{8}(&|$)/;
const PICTURES = 'apex-racing pictures ' + self.registration.scope;
const PICTURE = /\/assets\/[^?#]*\.(?:webp|png|json|glb)$/;
const SLOW = 4000;

const LAZY = /\srel\s*=\s*["']?x-lazy-script\b/i;
const FEW = 2;               // (lazy files saved at a time in the background)
const PAUSE = 3000;          // (after the first race's files, before the background save starts: the page is still starting)
const RACE = 8000;           // (after a race begins, before the background save starts: the track is being built)
const BOOT = 10000;          // (a lazy track the page asks for within this of its start is its title demo's, not a race)

// the local files a page links (scripts, styles, icons, manifest; not in comments) and the app's icons, as full addresses: all of
// them (all), and the lazy scripts among them (lazy)
function linked(html) {
  const all = new Set(EXTRA.map(abs)), lazy = new Set();
  for (const m of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(?:script|link)\b[^>]*?\s(?:src|href)\s*=\s*["']?([^"'\s>]+)[^>]*/gi)) {
    if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(m[1])) continue;
    all.add(abs(m[1]));
    if (/^<link\b/i.test(m[0]) && LAZY.test(m[0])) lazy.add(abs(m[1]));
  }
  return { all, lazy };
}
const path = (u) => { const x = new URL(u); return x.origin + x.pathname; };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// the lazy files of the saved page (read once per saved version)
let lazyNow = null;
function savedLazy() {
  return lazyNow || (lazyNow = caches.open(CACHE).then(c => c.match(PAGE(), { ignoreVary: true })).then(r => (r ? r.text() : ''))
    .then(html => linked(html).lazy).catch(() => new Set()));
}

// may the lazy files be saved now: on Wi-Fi or a cable, or where the browser does not say; on a phone's data once a race has begun
let raced = false;
function unmetered() {
  const c = self.navigator && self.navigator.connection;
  if (!c) return true;
  if (c.saveData) return false;
  return !/^(cellular|bluetooth)$/.test(c.type || '');
}

// save a page with everything it links (what is saved already is not fetched again), then drop what it no longer needs.
// One save at a time, so two versions of the page can never mix their files.
let queue = Promise.resolve();
function save(html) {
  queue = queue.then(async () => {
    const c = await caches.open(CACHE), { all: want, lazy } = linked(html);
    const had = new Set((await c.keys()).map(r => path(r.url)));   // (what an earlier version saved, by path: its lazy files stay saved)
    const get = async (u) => {
      if (await c.match(u, { ignoreVary: true })) return;
      const r = await fetch(u);
      if (!r.ok) throw new Error('not saved: ' + u);
      await c.put(u, r);
    };
    await Promise.all([...want].filter(u => !lazy.has(u) || had.has(path(u))).map(get));
    // (and what the stylesheets name, the fonts: they are fetched only when text needs them, which may be without internet)
    for (const css of [...want].filter(u => /\.css(\?|$)/.test(u))) {
      const r = await c.match(css, { ignoreVary: true }); if (!r) continue;
      for (const m of (await r.text()).matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
        if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(m[1])) continue;
        const u = new URL(m[1], css).href; want.add(u); await get(u);
      }
    }
    await c.put(PAGE(), new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    lazyNow = null; restDone = false;
    for (const req of await c.keys()) if (req.url !== PAGE() && !want.has(req.url)) await c.delete(req);
  }).catch(() => { });   // (not complete, e.g. the connection dropped: the previous saved game stays as it was)
  return queue;
}

// the saved files the saved page does not link, removed (a new worker taking over: lazy files of an old version, a broken-off save)
function prune() {
  queue = queue.then(async () => {
    const c = await caches.open(CACHE), pg = await c.match(PAGE(), { ignoreVary: true }); if (!pg) return;
    const html = await pg.text(), want = linked(html).all;
    for (const css of [...want].filter(u => /\.css(\?|$)/.test(u))) {   // (the fonts the saved stylesheets name stay)
      const r = await c.match(css, { ignoreVary: true }); if (!r) continue;
      for (const m of (await r.text()).matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g))
        if (!/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(m[1])) want.add(new URL(m[1], css).href);
    }
    for (const req of await c.keys()) if (req.url !== PAGE() && !want.has(req.url)) await c.delete(req);
  }).catch(() => { });
  return queue;
}

// the background save: the saved page's lazy files not saved yet, FEW at a time, in the save queue (never mixed with another
// version's save); one at a time, and again later if it broke off
let rest = null, restDone = false;
function saveRest() {
  if (rest || restDone || !(raced || unmetered())) return rest || Promise.resolve();
  return (rest = (queue = queue.then(async () => {
    const c = await caches.open(CACHE), todo = [];
    for (const u of await savedLazy()) if (!(await c.match(u, { ignoreVary: true }))) todo.push(u);
    let ok = true;
    const one = async () => {
      for (let u; (u = todo.shift());) {
        try { const r = await fetch(u, { priority: 'low' }); if (r.ok) await c.put(u, r); else ok = false; } catch (_) { ok = false; }
      }
    };
    await Promise.all(Array.from({ length: FEW }, one));
    restDone = ok;
  }).catch(() => { })).then(() => { rest = null; }));
}
// the background save after a pause, kept alive while it runs
function soon(ms) { return sleep(ms).then(saveRest); }

// a picture of the menu: the kept copy at once (and the network's newest kept for next time), the first time from the network
async function picture(e) {
  const c = await caches.open(PICTURES), hit = await c.match(e.request, { ignoreVary: true });
  const net = fetch(e.request).then((res) => { if (res.ok && res.status === 200) c.put(e.request, res.clone()).catch(() => { }); return res; });
  if (hit) { e.waitUntil(net.catch(() => { })); return hit; }
  return net;
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(fetch(PAGE(), { cache: 'no-cache' }).then(r => (r.ok ? r.text().then(save) : null)).catch(() => { }));
});
let activated = 0;   // (when this worker took over; 0: a worker started again later, the pages it serves long open)
self.addEventListener('activate', (e) => {
  activated = Date.now();
  e.waitUntil(self.clients.claim().then(prune));
  queue.then(() => soon(PAUSE));   // (not in waitUntil: the game's requests would wait for it; any request later keeps it alive)
});
// the page's word that a race begins (a later step of js/game.js may send it): the lazy files now, whatever the connection
self.addEventListener('message', (e) => {
  if (e.data === 'leno-vse' || (e.data && e.data.type === 'leno-vse')) { raced = true; e.waitUntil(soon(0)); }
});

// a lazy file the game asks for: the saved copy when its version is saved, else the network's (kept, when the saved page links it).
// A lazy track asked for later than the page's start is a race beginning: the other lazy files follow in the background
const started = new Map();   // (client → when it was opened, as its page's request came; one opened before this worker took over: then)
async function lazyFile(e, stamped) {
  const req = e.request, c = await caches.open(CACHE);
  if (stamped) { const hit = await c.match(req, { ignoreVary: true }); if (hit) return hit; }
  let res;
  try { res = await fetch(req); } catch (err) {
    const hit = await c.match(req, { ignoreVary: true }); if (hit) return hit;
    throw err;
  }
  if (res.ok && res.status === 200) {
    const copy = res.clone();
    e.waitUntil(queue = queue.then(async () => { if ((await savedLazy()).has(req.url)) await c.put(req.url, copy); }).catch(() => { }));
  }
  return res;
}

// the game's page: the newest from the network (saved for next time), else the saved one
async function page(e) {
  const net = fetch(e.request.url, { cache: 'no-cache' }).then(async (res) => ({ res, html: res.ok ? await res.text() : null }));
  e.waitUntil(net.then(n => (n.html != null ? save(n.html).then(() => soon(PAUSE)) : null)).catch(() => { }));
  const saved = await caches.match(PAGE(), { ignoreVary: true });
  let n;
  try {
    n = await (saved ? Promise.race([net, new Promise((_, slow) => setTimeout(slow, SLOW))]) : net);
  } catch (_) { return saved || Response.error(); }   // (no network, or too slow while a saved copy exists)
  const type = { 'Content-Type': n.res.headers.get('Content-Type') || 'text/html; charset=utf-8' };
  if (n.html != null) return new Response(n.html, { status: n.res.status, statusText: n.res.statusText, headers: type });
  if (saved && n.res.status >= 500) return saved;   // (the server has a problem: the saved game)
  // (any other answer as it is; a fresh response, so a redirect on the way does not break the navigation)
  return new Response(n.res.body, { status: n.res.status, statusText: n.res.statusText, headers: type });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.registration.scope)) return;
  const url = new URL(req.url), home = new URL(PAGE()).pathname;
  if (rest) e.waitUntil(rest);   // (the background save kept alive while the game asks for files)
  if (req.mode === 'navigate') {
    if (url.pathname === home || url.pathname === home + 'index.html') { if (e.resultingClientId) started.set(e.resultingClientId, Date.now()); e.respondWith(page(e)); }
    return;
  }
  if (PICTURE.test(url.pathname)) { e.respondWith(picture(e)); return; }
  if (/\.js$/.test(url.pathname)) {
    const now = Date.now(), t0 = started.has(e.clientId) ? started.get(e.clientId) : activated;
    e.respondWith(savedLazy().then((lz) => {
      if (!lz.has(req.url)) return null;
      if (now - t0 > BOOT && /\/js\/tracks\//.test(url.pathname) && !raced) { raced = true; e.waitUntil(soon(RACE)); }
      return lazyFile(e, STAMPED.test(url.search));
    }).then(res => res || (STAMPED.test(url.search) ? caches.match(req, { ignoreVary: true }).then(hit => hit || fetch(req)) : other(e))));
    return;
  }
  if (STAMPED.test(url.search)) { e.respondWith(caches.match(req, { ignoreVary: true }).then(hit => hit || fetch(req))); return; }
  e.respondWith(other(e));
});
// anything else (manifest, icons; without stamps the scripts and styles): the network (keeping the saved copy fresh), else the saved copy
function other(e) {
  const req = e.request, url = new URL(req.url);
  return fetch(req).then((res) => {
    if (res.ok && EXTRA.some(u => abs(u) === url.origin + url.pathname)) { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(url.origin + url.pathname, copy))); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(hit => hit || Response.error()));
}
