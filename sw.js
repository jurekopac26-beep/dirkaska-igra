// Service worker: once the game has been opened, it also starts without internet (the installed app too), and whenever
// there is internet it is the newest version.
// - The page (index.html) comes from the network first; the saved copy only when the network does not answer.
// - The scripts and styles it links carry a content stamp (?v=…, tools/stamp.js), so a saved copy of those is never out
//   of date: they come from the saved copies first.
// - A new index.html is saved only together with everything it links, so the saved game is always complete; files it no
//   longer links are then removed.
// To switch it off for every player: replace this file with one that calls self.registration.unregister() when installed.
'use strict';
const CACHE = 'apex-racing';
const EXTRA = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
const abs = (u) => new URL(u, self.registration.scope).href;
const PAGE = () => abs('./');   // (the key of the saved index.html, whichever address opened it)
const STAMPED = /[?&]v=[0-9a-f]{8}(&|$)/;

// the local files a page links (scripts, styles, icons, manifest) and the app's icons, as full addresses
function linked(html) {
  const out = new Set(EXTRA.map(abs));
  for (const m of html.matchAll(/<(?:script|link)\b[^>]*?\s(?:src|href)\s*=\s*["']?([^"'\s>]+)/gi))
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

// the game's page: the newest from the network (and saved for later), or the saved one when offline
async function page(e) {
  try {
    const res = await fetch(e.request.url, { cache: 'no-cache' });
    if (!res.ok) return res;
    const html = await res.text();
    e.waitUntil(save(html));
    return new Response(html, { status: res.status, statusText: res.statusText, headers: { 'Content-Type': res.headers.get('Content-Type') || 'text/html; charset=utf-8' } });
  } catch (_) {
    return (await caches.match(PAGE(), { ignoreVary: true })) || Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.registration.scope)) return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    if (url.pathname === new URL(PAGE()).pathname || url.pathname.endsWith('/index.html')) e.respondWith(page(e));
    return;
  }
  if (STAMPED.test(url.search)) { e.respondWith(caches.match(req, { ignoreVary: true }).then(hit => hit || fetch(req))); return; }
  // anything else (manifest, icons): the network (keeping the saved copy fresh), else the saved copy
  e.respondWith(fetch(req).then((res) => {
    if (res.ok && EXTRA.some(u => abs(u) === url.origin + url.pathname)) { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(url.origin + url.pathname, copy))); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(hit => hit || Response.error())));
});
