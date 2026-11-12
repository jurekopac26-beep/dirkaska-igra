// The site's previews without a second copy of main's pictures and data (tools/predogled.mjs; tests/predogled.test.js).
// A preview's assets/ (the menu's pictures, the tracks' maps, the cars, the flags …) are mostly the same files as main's in the site's root. A file
// that is byte for byte main's is left out of the preview, and the preview's own service worker answers its address with main's file from the
// root: its sw.js gets a small handler in front (SW_HEAD) that reads the list (LIST, in the preview's folder) and fetches a listed file from the
// root. A file the pull request adds or changes stays in its preview and is served from there. The media (the videos, the music) are never left
// out this way: a browser asks them in pieces (Range), which a service worker passes on badly (the menu's videos are shared in another way:
// tools/predogled-posnetki.js). Nothing a page links (stamped by tools/stamp.js) is in assets/, nor what the stylesheets name (the offline save
// of sw.js fetches those itself), so those always stay.
// The root's service worker (main's) covers the previews' addresses too, until a preview's own is installed: the preview's pages (index.html,
// garaza.html) get a short script first in <head> (PAGE_HEAD) that, when the page is not yet run by the preview's own service worker, stops the
// page, installs it and opens the page again. A browser without service workers (e.g. some private windows) opens the preview without the
// shared files (a warning in the console). The game on main is not changed: only the preview's copies of sw.js and the pages are.
'use strict';
const fs = require('fs'), path = require('path');

const LIST = 'predogled-deljene.json';   // (in the preview's folder, next to its sw.js)
const MEDIA = /\.(?:webm|mp4|ogg|ogv|mp3|m4a|wav|aac|flac)$/i;
const PAGES = ['index.html', 'garaza.html'];
const MARK = 'predogled-deljene';   // (in what is added to sw.js and the pages: added once only)

// in front of the preview's sw.js: the listed files from the site's root (before sw.js's own handlers: a listed file never reaches them)
const SW_HEAD = `// ${MARK} (tools/predogled-deljene.js, added by the preview's build): the files the same as main's come from the site's root
'use strict';
{
  let shared = null, known = null;   // (the list being read, and the list read)
  const scope = new URL(self.registration.scope), list = new URL(${JSON.stringify(LIST)}, scope).href;
  const load = () => (known = null, shared = fetch(list, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null))
    .then(d => (known = d && Array.isArray(d.files) ? { root: new URL(d.root, scope).href, files: new Set(d.files) } : { files: new Set() }))
    .catch(() => { shared = null; return { files: new Set() }; }));
  const from = (s, rel, url) => fetch(new URL(rel, s.root).href + url.search);
  self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET' || !req.url.startsWith(scope.href)) return;
    if (req.mode === 'navigate') { load(); return; }   // (a page opened: the list of its build)
    const url = new URL(req.url);
    let rel;
    try { rel = decodeURIComponent(url.pathname.slice(scope.pathname.length)); } catch (_) { return; }
    if (!rel.startsWith('assets/')) return;
    if (known && !known.files.has(rel)) return;   // (the preview's own file: sw.js as always)
    e.stopImmediatePropagation();
    e.respondWith(known ? from(known, rel, url) : (shared || load()).then(s => (s.files.has(rel) ? from(s, rel, url) : fetch(req))));
  });
}
`;

// first in each page's <head>: the preview's own service worker runs the page, or it is installed and the page opened again
const PAGE_HEAD = `<script>/* ${MARK} (tools/predogled-deljene.js) */(function () {
  var sw = navigator.serviceWorker, c = sw && sw.controller, mine = new URL('sw.js', location.href).href, k = 'predogled-sw', t = 0;
  if (!sw) { console.warn('predogled: no service worker, the pictures the same as main are missing'); return; }
  if (c && c.scriptURL.split('?')[0] === mine) return;
  try { t = +sessionStorage.getItem(k) || 0; if (Date.now() - t < 15000) { console.warn('predogled: the service worker does not run the page'); return; } sessionStorage.setItem(k, String(Date.now())); } catch (_) { }
  window.stop();
  document.documentElement.innerHTML = '<body style="font:16px system-ui;padding:24px">Predogled se pripravlja …</body>';
  sw.register('sw.js').then(function (r) {
    var w = r.active || r.waiting || r.installing, go = function () { location.reload(); };
    if (!w || w.state === 'activated') return go();
    w.addEventListener('statechange', function () { if (w.state === 'activated') go(); });
  }).catch(function () { location.reload(); });
})();</script>
`;

// root: the site's folder with main in it; dir: a preview's folder under it. Leaves out of dir's assets/ what is main's, and readies its
// sw.js and pages for it. Returns the files left out and their bytes.
function shareAssets(root, dir) {
  const none = { files: [], bytes: 0 };
  const own = (p, kind) => { try { return fs.lstatSync(p)[kind]() && fs.realpathSync(p) === path.join(fs.realpathSync(dir), path.relative(dir, p)); } catch (e) { return false; } };
  const sw = path.join(dir, 'sw.js'), assets = path.join(dir, 'assets');
  if (!own(sw, 'isFile') || !own(assets, 'isDirectory')) return none;
  const swText = fs.readFileSync(sw, 'utf8');
  if (swText.includes(MARK) || fs.existsSync(path.join(dir, LIST))) return none;   // (shared already)
  const up = path.relative(dir, root).split(path.sep).join('/');
  if (!up || !/^(?:\.\.\/)*\.\.$/.test(up)) return none;   // (only a folder under the root: the way up from it)
  const pages = PAGES.filter(p => own(path.join(dir, p), 'isFile'));
  if (!pages.includes('index.html')) return none;
  // what the pages and the stylesheets name stays (sw.js saves those itself, past its own handlers)
  const named = new Set();
  const cssDir = path.join(dir, 'css');
  const texts = pages.map(p => fs.readFileSync(path.join(dir, p), 'utf8'))
    .concat(own(cssDir, 'isDirectory') ? fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join(cssDir, f), 'utf8')) : []);
  for (const t of texts) for (const m of t.matchAll(/assets\/[^"'()\s?#>]+/g)) named.add(m[0].replace(/^(?:\.\.\/)+/, ''));
  const same = [];
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = rel + '/' + e.name, b = path.join(dir, r);
      if (e.isDirectory()) { if (own(b, 'isDirectory')) walk(r); continue; }
      if (!e.isFile() || MEDIA.test(e.name) || named.has(r)) continue;
      const a = path.join(root, r);
      let sa, sb;
      try { sa = fs.lstatSync(a); sb = fs.lstatSync(b); } catch (err) { continue; }   // (main has no such file: the pull request's own)
      if (!sa.isFile() || !sb.isFile() || sa.size !== sb.size || (sa.dev === sb.dev && sa.ino === sb.ino)) continue;
      if (fs.readFileSync(a).equals(fs.readFileSync(b))) same.push(r);
    }
  };
  walk('assets');
  if (!same.length) return none;
  // the list, the service worker and the pages first, then the files: a preview is never left with the files gone and nothing to fetch them
  fs.writeFileSync(path.join(dir, LIST), JSON.stringify({ root: up + '/', files: same }) + '\n');
  fs.writeFileSync(sw, SW_HEAD + swText);
  for (const p of pages) {
    const f = path.join(dir, p), html = fs.readFileSync(f, 'utf8');
    // (after the charset, which stays in the first bytes; else after <head>, else after the doctype: never before it)
    const at = /<meta\s+charset\b[^>]*>/i.exec(html) || /<head\b[^>]*>/i.exec(html) || /^\s*<!doctype\b[^>]*>/i.exec(html);
    fs.writeFileSync(f, at ? html.slice(0, at.index + at[0].length) + '\n' + PAGE_HEAD + html.slice(at.index + at[0].length) : PAGE_HEAD + html);
  }
  let bytes = 0;
  for (const r of same) { const b = path.join(dir, r); bytes += fs.statSync(b).size; fs.rmSync(b); }
  return { files: same, bytes };
}

module.exports = { shareAssets, LIST, MEDIA, MARK, SW_HEAD, PAGE_HEAD };
