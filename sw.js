// Service worker: once the game has been opened, it also starts without internet (the installed app too), and whenever
// there is internet it is the newest version.
// - The page (index.html) comes from the network first. The saved copy is used when the network does not answer, answers
//   with a server error, or is slower than 4 s (one bar of signal); the network's page is then still saved for next time.
// - The scripts and styles it links carry a content stamp (?v=…, tools/stamp.js), so a saved copy of those is never out
//   of date: they come from the saved copies first.
// - A new index.html is saved only together with everything it links, so the saved game is always complete; files it no
//   longer links are then removed. Each copy of the game (its own folder) keeps its own saved files.
// To switch it off for every player: replace this file with one that, when installed, calls self.skipWaiting(), and when
// activated deletes its caches (caches.keys() starting with 'apex-racing') and calls self.registration.unregister();
// and remove the navigator.serviceWorker.register() call from js/game.js.
'use strict';
const CACHE = 'apex-racing ' + self.registration.scope;
const EXTRA = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
const abs = (u) => new URL(u, self.registration.scope).href;
const PAGE = () => abs('./');   // (the key of the saved index.html, whichever address opened it)
const STAMPED = /[?&]v=[0-9a-f]{8}(&|$)/;
const SLOW = 4000;

// the local files a page links (scripts, styles, icons, manifest; not in comments) and the app's icons, as full addresses
function linked(html) {
  const out = new Set(EXTRA.map(abs));
  for (const m of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(?:script|link)\b[^>]*?\s(?:src|href)\s*=\s*["']?([^"'\s>]+)/gi))
    if (!/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(m[1])) out.add(abs(m[1]));
  return out;
}

// save a page with everything it links (what is saved already is not fetched again), then drop what it no longer needs.
// One save at a time, so two versions of the page can never mix their files.
let queue = Promise.resolve();
function save(html) {
  queue = queue.then(async () => {
    const c = await caches.open(CACHE), want = linked(html);
    await Promise.all([...want].map(async (u) => {
      if (await c.match(u, { ignoreVary: true })) return;
      const r = await fetch(u);
      if (!r.ok) throw new Error('not saved: ' + u);
      await c.put(u, r);
    }));
    await c.put(PAGE(), new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    for (const req of await c.keys()) if (req.url !== PAGE() && !want.has(req.url)) await c.delete(req);
  }).catch(() => { });   // (not complete, e.g. the connection dropped: the previous saved game stays as it was)
  return queue;
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(fetch(PAGE(), { cache: 'no-cache' }).then(r => (r.ok ? r.text().then(save) : null)).catch(() => { }));
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// the game's page: the newest from the network (saved for next time), else the saved one
async function page(e) {
  const net = fetch(e.request.url, { cache: 'no-cache' }).then(async (res) => ({ res, html: res.ok ? await res.text() : null }));
  e.waitUntil(net.then(n => (n.html != null ? save(n.html) : null)).catch(() => { }));
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
  if (req.mode === 'navigate') {
    if (url.pathname === home || url.pathname === home + 'index.html') e.respondWith(page(e));
    return;
  }
  if (STAMPED.test(url.search)) { e.respondWith(caches.match(req, { ignoreVary: true }).then(hit => hit || fetch(req))); return; }
  // anything else (manifest, icons): the network (keeping the saved copy fresh), else the saved copy
  e.respondWith(fetch(req).then((res) => {
    if (res.ok && EXTRA.some(u => abs(u) === url.origin + url.pathname)) { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(url.origin + url.pathname, copy))); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(hit => hit || Response.error())));
});
