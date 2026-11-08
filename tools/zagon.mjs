// How long the game takes to start on a phone, and where the time goes (I17 Hitro nalaganje, docs/hitro-nalaganje.md): from opening
// the page to the menu, and to driving (the quick entry ?proga=<id>: straight on a race on that track). The game is served as GitHub
// Pages serves it (HTTP/2 over TLS, gzip, max-age=600, a stamped copy: tools/stamp.js, so the service worker keeps it as on the
// published game), in Chromium (Playwright) with a phone's slower CPU (CDP Emulation.setCPUThrottlingRate) and network
// (Network.emulateNetworkConditions: Lighthouse's slow 4G, request-level: 562.5 ms, 1.47 Mbit/s down). Nothing of the game is changed:
// an init script only wraps a few calls (Render.init, buildWorld, precompile; World.build; Core.Race step; Menu.init) to time them.
//   node tools/zagon.mjs [--cpu 4] [--net slow4g|fast4g|none] [--proga bathurst] [--runs 1] [--warm] [--h1] [--tracks [--fresh] [--samo a,b]]
//                        [--menu-only] [--profil id] [--platno-cpu] [--from file.json] [--out file.json]
//     --cpu        CPU slowdown (1 = this machine; 4–6 a mid-range phone, see the benchmark index printed)
//     --net        slow4g (default), fast4g (9 Mbit/s, 170 ms) or none
//     --proga      the track of the drive (default bathurst); --menu-only: only the menu
//     --runs       cold runs of each (a fresh browser profile each: nothing cached)
//     --warm       also the next visit in the same profile (HTTP cache, the service worker's saved game, V8's code cache)
//     --h1         HTTP/1.1 instead of HTTP/2 (6 connections per host: as a server without HTTP/2)
//     --tracks     also each real track's build from the menu (World build + shaders, Render.buildWorld + precompile), warm;
//                  --fresh: each track in a fresh page (no shader programs of the tracks before it); --samo a,b: only these tracks
//     --profil id  a CPU profile of one track's build from the menu (warm): the functions that take the time (self and with callees)
//     --platno-cpu 2D canvases drawn on the CPU (--disable-accelerated-2d-canvas): without it they are drawn in the GPU process by
//                  SwiftShader (not slowed by --cpu), and a world's getImageData waits there; shows how much of a build is that wait
//     --from f     the summary again from a saved --out file (nothing measured)
//     --out        the raw results (JSON); the summary goes to stdout
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import os from 'node:os';
import http2 from 'node:http2';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const GAME = ['index.html', 'garaza.html', 'temni-nacin.html', 'sw.js', 'manifest.webmanifest', 'js', 'css', 'fonts', 'icons'];   // (as tools/predogled.mjs publishes; assets linked, not copied)

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const CPU = +opt('--cpu', 4), NET = opt('--net', 'slow4g'), PROGA = opt('--proga', 'bathurst'), RUNS = +opt('--runs', 1), OUT = opt('--out', null);
const NETS = {
  slow4g: { offline: false, latency: 562.5, downloadThroughput: 1474.56 * 1024 / 8, uploadThroughput: 675 * 1024 / 8 },   // (Lighthouse mobileSlow4G, devtools throttling)
  fast4g: { offline: false, latency: 170, downloadThroughput: 9000 * 1024 / 8, uploadThroughput: 1500 * 1024 / 8 },
  none: null,
};
if (!(NET in NETS)) { console.log('--net: slow4g, fast4g or none'); process.exit(2); }

// the published game's tree: a copy of what the site serves, stamped from its own files (never the repo itself)
function stampedCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zagon-'));
  for (const n of GAME) if (fs.existsSync(path.join(REPO, n))) fs.cpSync(path.join(REPO, n), path.join(dir, n), { recursive: true });
  fs.symlinkSync(path.join(REPO, 'assets'), path.join(dir, 'assets'));
  execFileSync(process.execPath, [path.join(REPO, 'tools', 'stamp.js')], { env: Object.assign({}, process.env, { GAME_ROOT: dir }), stdio: 'ignore' });
  return dir;
}

// the site: HTTP/2 over TLS (a certificate of its own), gzip for text as GitHub Pages sends it, ETag and max-age=600
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.webm': 'video/webm', '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.glb': 'model/gltf-binary' };
const TEXT = /^(text\/|application\/(javascript|json|manifest)|image\/svg)/;
function serve(root, h1) {
  const tls = fs.mkdtempSync(path.join(os.tmpdir(), 'zagon-tls-'));
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', path.join(tls, 'k.pem'), '-out', path.join(tls, 'c.pem'), '-days', '2', '-subj', '/CN=localhost'], { stdio: 'ignore' });
  const files = new Map(), log = [];
  const get = (file) => {
    let f = files.get(file); if (f) return f;
    const raw = fs.readFileSync(file), type = TYPES[path.extname(file)] || 'application/octet-stream';
    f = { raw, type, gz: TEXT.test(type) ? zlib.gzipSync(raw, { level: 6 }) : null, etag: '"' + crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16) + '"' };
    files.set(file, f); return f;
  };
  const handler = (req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'https://x').pathname);
    const file = path.join(root, p.endsWith('/') ? p + 'index.html' : p);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    const f = get(file), h = { 'content-type': f.type, 'cache-control': 'max-age=600', etag: f.etag, vary: 'Accept-Encoding' };
    if (req.headers['if-none-match'] === f.etag) { res.writeHead(304, h); res.end(); log.push({ p, s: 304, b: 0 }); return; }
    const gz = f.gz && /\bgzip\b/.test(req.headers['accept-encoding'] || ''), body = gz ? f.gz : f.raw;
    if (gz) h['content-encoding'] = 'gzip';
    h['content-length'] = body.length;
    res.writeHead(200, h); res.end(req.method === 'HEAD' ? undefined : body); log.push({ p, s: 200, b: body.length, v: req.httpVersion });
  };
  const server = h1 ? require('node:https').createServer({ key: fs.readFileSync(path.join(tls, 'k.pem')), cert: fs.readFileSync(path.join(tls, 'c.pem')) }, handler)
    : http2.createSecureServer({ key: fs.readFileSync(path.join(tls, 'k.pem')), cert: fs.readFileSync(path.join(tls, 'c.pem')), allowHTTP1: true }, handler);
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ base: 'https://localhost:' + server.address().port, log, close: () => new Promise(r => server.close(r)) })));
}

// this machine's speed as Lighthouse measures it (its benchmark index: the same loops), without throttling
async function benchmark(page) {
  return page.evaluate(() => {
    const gc = () => { const s0 = Date.now(); let it = 0; while (Date.now() - s0 < 500) { let s = ''; for (let j = 0; j < 10000; j++) s += 'a'; it++; } return Math.round(it / 10 / ((Date.now() - s0) / 1000)); };
    const nogc = () => { const a = [], b = []; for (let i = 0; i < 100000; i++) a[i] = b[i] = i; const s0 = Date.now(); let it = 0; while (it % 10 !== 0 || Date.now() - s0 < 500) { const s = it % 2 ? b : a, t = it % 2 ? a : b; for (let j = 0; j < s.length; j++) t[j] = s[j]; it++; } return Math.round(it / 10 / ((Date.now() - s0) / 1000)); };
    return Math.round((gc() + nogc()) / 2);
  });
}

// the timing hooks: put on as each script of the game has run (its load event), nothing changed in what the calls do
const HOOKS = () => {
  const Z = window.__zt = { marks: [], calls: [], scripts: [], long: [] }, now = () => performance.now();
  const mark = (n) => Z.marks.push([n, Math.round(now())]);
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) Z.long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (_) { }   // (the main thread's tasks over 50 ms)
  const wrap = (obj, label, names) => { if (!obj) return; for (const n of names) { const f = obj[n]; if (typeof f !== 'function' || f.__zt) continue;
    const w = function () { const t0 = now(); try { return f.apply(this, arguments); } finally { const t1 = now(); const c = Z.calls[Z.calls.length - 1]; if (label === 'Race' && n === 'step' && c && c.n === 'Race.step' && t0 - c.t1 < 5) { c.t1 = t1; c.k++; c.ms += t1 - t0; } else Z.calls.push({ n: label + '.' + n, t0, t1, ms: t1 - t0, k: 1 }); } };
    w.__zt = true; try { obj[n] = w; } catch (_) { } } };
  document.addEventListener('load', (e) => {
    const s = e.target; if (!(s instanceof HTMLScriptElement) || !s.src) return;
    const src = s.src.replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*$/, ''); Z.scripts.push([src, Math.round(now())]);
    try {
      if (src === 'js/render.js') wrap(eval('Render'), 'Render', ['init', 'buildWorld', 'precompile']);
      if (src === 'js/world.js') wrap(eval('World'), 'World', ['build']);
      if (src === 'js/core.js') wrap(eval('Core').Race.prototype, 'Race', ['step']);
      if (src === 'js/menu.js') wrap(window.Menu, 'Menu', ['init', 'show']);
    } catch (_) { }
  }, true);
  document.addEventListener('DOMContentLoaded', () => mark('dcl'));
  addEventListener('load', () => mark('load'));
  let ld = null, menu = false, game = false, race = null;
  const poll = () => {
    const el = document.getElementById('loading');
    if (el) { const off = el.classList.contains('off'); if (off !== ld) { mark(off ? 'loadingOff' : 'loadingOn'); ld = off; } }
    if (!game && window.__game) { game = true; mark('game'); }
    if (!menu && window.Menu && window.Menu.ready) { menu = true; mark('menuReady'); }
    try { const r = window.__game && window.__game.race; if (r && r !== race) { race = r; mark('race:' + r.track.def.id); } } catch (_) { }
    requestAnimationFrame(poll);
  };
  requestAnimationFrame(poll); setTimeout(poll, 0);
};

// the groups of the scripts (as in docs/hitro-nalaganje.md)
let TEST = new Set();
const SHARED_WORLD = new Set(['world.js', 'world-zastave.js', 'world-zivali.js', 'world-ljudje.js', 'world-ljudje2.js', 'world-ljudje3.js', 'world-gore.js', 'world-prelaz.js', 'world-zaslon.js']);
function groupOf(f) {
  const b = path.basename(f), id = b.replace(/\.js$/, '');
  if (f.startsWith('js/vendor/three')) return 'three.js';
  if (f.startsWith('js/vendor/peer')) return 'peerjs';
  if (f.startsWith('js/tracks/')) return TEST.has(id) ? 'proge testne' : 'proge prave';
  if (f.startsWith('js/cars/')) return 'avti';
  if (f.startsWith('js/deli') || f === 'js/data/deli.js') return 'deli avtov';
  if (/^js\/(world|data\/(montreal|livorno))/.test(f)) return SHARED_WORLD.has(b) ? 'svet skupno' : (TEST.has(id.replace(/^world-/, '')) ? 'svet testne' : 'svet prave');
  if (f === 'js/core.js' || f === 'js/tex.js') return 'jedro';
  if (f.startsWith('js/render')) return 'izris';
  if (f === 'js/sfx.js' || f === 'js/comm.js') return 'zvok';
  if (/^js\/(menu|routes|geo|journey|intro-data)/.test(f)) return 'meni';
  if (f.startsWith('js/missions')) return 'misije';
  if (f.startsWith('js/zabava')) return 'zabava';
  if (f.startsWith('js/nv') || f === 'js/newmap.js') return 'nova mapa';
  if (f === 'js/game.js') return 'igra';
  if (f.endsWith('.js')) return 'drugo js';
  if (f.endsWith('.css')) return 'css';
  if (f.startsWith('assets/')) return 'slike in podatki menija';
  if (f.startsWith('fonts/')) return 'pisave';
  return 'drugo';
}

// the test tracks (test: true) and the themes of their worlds (js/world-<theme>.js)
function testTracks() {
  for (const f of fs.readdirSync(path.join(REPO, 'js/tracks'))) {
    const src = fs.readFileSync(path.join(REPO, 'js/tracks', f), 'utf8'), t = /\btheme:\s*'([a-z0-9]+)'/.exec(src);
    if (/\btest:\s*true/.test(src)) { TEST.add(f.replace(/\.js$/, '')); if (t) TEST.add(t[1]); }
  }
}

async function run(browser, base, kind, cdpOpts, ctx) {
  const own = !ctx;
  if (!ctx) ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, hasTouch: true, isMobile: false, ignoreHTTPSErrors: true });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(HOOKS);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  if (NETS[NET]) await cdp.send('Network.emulateNetworkConditions', NETS[NET]);
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const addr = base + '/' + (kind === 'proga' ? '?proga=' + PROGA : '');
  const t0 = Date.now();
  await page.goto(addr, { waitUntil: 'commit', timeout: 600000 });
  const done = kind === 'proga'
    ? () => !!(window.__game && window.__game.race && window.__game.race.track.def.id === new URLSearchParams(location.search).get('proga') && document.getElementById('loading').classList.contains('off'))
    : () => !!(window.Menu && window.Menu.ready && window.__game && document.getElementById('loading').classList.contains('off'));
  await page.waitForFunction(done, null, { timeout: 600000, polling: 100 });
  await page.waitForTimeout(1500);   // (a few frames on: the first drawn frame of the menu or the race, the menu's first pictures)
  const wall = Date.now() - t0;
  const res = await page.evaluate(() => ({
    nav: (() => { const n = performance.getEntriesByType('navigation')[0]; return n && { responseStart: Math.round(n.responseStart), responseEnd: Math.round(n.responseEnd), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), proto: n.nextHopProtocol }; })(),
    res: performance.getEntriesByType('resource').map(r => ({ u: r.name.replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*$/, ''), t: r.initiatorType, s: Math.round(r.startTime), e: Math.round(r.responseEnd), tb: r.transferSize, eb: r.encodedBodySize, db: r.decodedBodySize, p: r.nextHopProtocol })),
    paint: Object.fromEntries(performance.getEntriesByType('paint').map(p => [p.name, Math.round(p.startTime)])),
    zt: window.__zt, loadMs: window.__game ? window.__game.loadMs : null, sw: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
    mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
  }));
  res.wall = wall; res.errors = errors; res.kind = kind;
  await cdp.detach().catch(() => { });
  await page.close();
  if (own) await ctx.close();
  return res;
}

// one run in words, and its numbers by phase
function sum(r) {
  const M = Object.fromEntries(r.zt.marks.map(([n, t]) => [n, t])), C = r.zt.calls;
  const scripts = r.res.filter(x => x.t === 'script' || /\.js$/.test(x.u));
  const by = {};
  for (const x of r.res) { const g = groupOf(x.u), o = by[g] || (by[g] = { n: 0, tb: 0, eb: 0, db: 0, end: 0 }); o.n++; o.tb += x.tb; o.eb += x.eb; o.db += x.db; o.end = Math.max(o.end, x.e); }
  // a script's own run: from the later of its arrival and the previous script's end, to its load event (classic scripts run in order)
  const arrive = Object.fromEntries(scripts.map(x => [x.u, x.e]));
  let prev = r.nav ? r.nav.responseEnd : 0; const exec = {};
  for (const [u, t] of r.zt.scripts) { const st = Math.max(prev, arrive[u] || 0); const g = groupOf(u); exec[g] = (exec[g] || 0) + Math.max(0, t - st); prev = t; }
  const callMs = (n, from = 0, to = Infinity) => Math.round(C.filter(c => c.n === n && c.t0 >= from && c.t0 < to).reduce((a, c) => a + c.ms, 0));
  const bootFrom = M.load || 0, offs = r.zt.marks.filter(([n, t]) => n === 'loadingOff' && t >= bootFrom).map(([, t]) => t);
  // (the worlds built after the scripts, in order: the title's at the boot, then the quick entry's track; the shaders compiled for it)
  const worlds = C.filter(c => c.n === 'Render.buildWorld' && c.t0 >= bootFrom), shaders = C.filter(c => c.n === 'Render.precompile' && c.t0 >= bootFrom);
  const titleEnd = worlds.length ? worlds[0].t1 : 0, demo = C.filter(c => c.n === 'Race.step' && c.t0 >= titleEnd && c.t0 < titleEnd + 20000)[0];
  const bootTo = r.kind === 'proga' ? Math.round(demo ? demo.t1 : titleEnd) : (offs[0] || 0);
  const out = {
    kind: r.kind, wall: r.wall, sw: r.sw, mem: r.mem, errors: r.errors.length,
    html: r.nav && r.nav.responseEnd, dcl: M.dcl, load: M.load, lastScript: Math.max(0, ...scripts.map(x => x.e)),
    bytes: { all: r.res.reduce((a, x) => a + x.tb, 0), scripts: scripts.reduce((a, x) => a + x.tb, 0), n: scripts.length },
    paint: r.paint && r.paint['first-contentful-paint'],
    boot: { from: bootFrom, to: bootTo, renderInit: callMs('Render.init', bootFrom, bootTo + 1), buildWorld: worlds.length ? Math.round(worlds[0].ms) : 0, demo: demo ? Math.round(demo.ms) : 0 },
    menuInit: (C.find(c => c.n === 'Menu.init') || {}).t0, menuShow: Math.round(C.filter(c => c.n === 'Menu.show').reduce((a, c) => a + c.ms, 0)),
    menuReady: M.menuReady, raceAt: (r.zt.marks.find(([n]) => n.startsWith('race:')) || [])[1],
    // (between Menu.init and the menu ready: the main thread's long tasks, which hold back the menu's styles arriving)
    menuLong: (() => { const a = (C.find(c => c.n === 'Menu.init') || {}).t0, b = M.menuReady; if (a == null || b == null || !r.zt.long) return null;
      const L = r.zt.long.filter(([t, d]) => t + d > a && t < b); return { n: L.length, ms: L.reduce((x, [t, d]) => x + Math.min(t + d, b) - Math.max(t, a), 0), max: Math.max(0, ...L.map(([t, d]) => Math.min(t + d, b) - Math.max(t, a))) }; })(),   // (max: the longest one's part inside the wait)
    groups: by, exec,
  };
  if (r.kind === 'proga') {
    const bw = worlds.length > 1 ? worlds[worlds.length - 1] : null, pc = shaders[shaders.length - 1];
    out.track = { buildWorld: bw ? Math.round(bw.ms) : 0, precompile: pc ? Math.round(pc.ms) : 0, loadMs: r.loadMs && Math.round(r.loadMs), worlds: worlds.length };
    out.drive = Math.max(...offs);
  }
  return out;
}
const s = (ms) => ms == null ? '–' : (ms / 1000).toFixed(1) + ' s';
const mb = (b) => (b / 1048576).toFixed(2) + ' MB';
function print(o, label) {
  console.log(`${label}: HTML ${s(o.html)} · prvi izris ${s(o.paint)} · zadnja skripta prispela ${s(o.lastScript)} (${o.bytes.n} skript, ${mb(o.bytes.scripts)} prenosa, vse ${mb(o.bytes.all)}) · skripte izvedene (load) ${s(o.load)}`);
  console.log(`   zagon ${s(o.boot.from)}–${s(o.boot.to)}: Render.init ${s(o.boot.renderInit)}, svet za naslovnico ${s(o.boot.buildWorld)}, predstavitvena dirka ${s(o.boot.demo)} · Menu.init ${s(o.menuInit)}, izris menija ${s(o.menuShow)} · meni pripravljen ${s(o.menuReady)}${o.menuLong ? ` (vmes ${o.menuLong.n} dolgih opravil, ${s(o.menuLong.ms)}, najdaljše ${s(o.menuLong.max)})` : ''}${o.sw ? ' · service worker' : ''}${o.errors ? ' · NAPAKE ' + o.errors : ''}`);
  if (o.track) console.log(`   proga ${PROGA}: svet ${s(o.track.buildWorld)}, senčilniki ${s(o.track.precompile)} · do vožnje ${s(o.drive)}`);
  const ex = Object.entries(o.exec).sort((a, b) => b[1] - a[1]).map(([g, ms]) => g + ' ' + s(ms)).join(', ');
  console.log(`   izvajanje skript po skupinah: ${ex}`);
}

const main = async () => {
  testTracks();
  if (opt('--from', null)) {   // (the summary again from a saved run: --from file.json)
    const o = JSON.parse(fs.readFileSync(opt('--from'), 'utf8'));
    console.log(`CPU ${o.cpu}× (indeks ${o.benchmark}), omrežje ${o.net}${o.h1 ? ', HTTP/1.1' : ', HTTP/2'}, ${o.chromium}, ${o.when}`);
    const firstWarm = o.runs.findIndex(r => r.warm === false && o.runs.indexOf(r) > 0 && o.runs[o.runs.indexOf(r) + 1] && o.runs[o.runs.indexOf(r) + 1].warm);
    o.runs.forEach((r, i) => print(sum(r.raw), (r.warm ? 'toplo ' : i === firstWarm ? 'prvi obisk ' : 'hladno ') + r.raw.kind));
    for (const t of o.tracks || []) console.log(`   ${t.id.padEnd(14)} start→dirka ${s(t.total)} · svet ${s(t.buildWorld)} (World.build ${s(t.worldBuild)}) · senčilniki ${s(t.precompile)}` + (t.progs != null ? ` (${t.progs} novih programov, vseh ${t.progsAll}) · ${t.geoms} geometrij, ${t.texs} tekstur, ${t.heapMB} MB JS` : ''));
    return;
  }
  const root = stampedCopy(), srv = await serve(root, has('--h1'));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors',
    ...(has('--platno-cpu') ? ['--disable-accelerated-2d-canvas'] : [])] });
  const out = { when: new Date().toISOString(), cpu: CPU, net: NET, proga: PROGA, h1: has('--h1'), platnoCpu: has('--platno-cpu'), node: process.version, chromium: browser.version(), cores: os.cpus().length, runs: [] };
  { const ctx = await browser.newContext({ ignoreHTTPSErrors: true }), p = await ctx.newPage(); await p.goto('about:blank'); out.benchmark = await benchmark(p); await ctx.close(); }
  console.log(`CPU ${CPU}× (indeks tega stroja ${out.benchmark}, s CPU ${CPU}× ~${Math.round(out.benchmark / CPU)}), omrežje ${NET}${has('--h1') ? ', HTTP/1.1' : ', HTTP/2'}, ${out.chromium}`);
  if (opt('--profil', null)) { out.profile = await profileBuild(browser, srv.base, opt('--profil')); await browser.close(); await srv.close(); if (OUT) fs.writeFileSync(OUT, JSON.stringify(out)); fs.rmSync(root, { recursive: true, force: true }); return; }
  const kinds = has('--menu-only') ? ['menu'] : ['menu', 'proga'];
  for (let k = 0; k < RUNS; k++) for (const kind of kinds) {
    const r = await run(browser, srv.base, kind); const o = sum(r); out.runs.push({ raw: r, sum: o }); print(o, `hladno ${kind} #${k + 1}`);
  }
  if (has('--warm') || has('--tracks')) {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, hasTouch: true, ignoreHTTPSErrors: true });
    const seq = ['menu', ...kinds, ...kinds];   // (the first visit installs the service worker and saves the game; the next ones are the warm ones)
    for (let i = 0; i < seq.length; i++) {
      const r = await run(browser, srv.base, seq[i], null, ctx); const o = sum(r); out.runs.push({ raw: r, sum: o, warm: i > 0 }); print(o, (i ? 'toplo ' : 'prvi obisk ') + seq[i]);
      if (i === 0) await new Promise(r => setTimeout(r, 4000));   // (the service worker's saving of the whole game, in the background after the first visit)
    }
    if (has('--tracks')) out.tracks = await trackBuilds(ctx, srv.base);
    await ctx.close();
  }
  await browser.close(); await srv.close();
  if (OUT) { fs.writeFileSync(OUT, JSON.stringify(out)); console.log('zapisano: ' + OUT); }
  fs.rmSync(root, { recursive: true, force: true });
};

// each real track's world from the menu, built as ensureTrack builds it (warm: the scripts are in), throttled as the runs
// (--fresh: each track in a page of its own, as a player who opens the game and drives one track: no shaders or textures of the tracks
// before it; without it one page for all, quicker, but a track after others finds their shader programs compiled)
async function trackBuilds(ctx, base) {
  let page = null, cdp = null;
  const open = async () => {
    if (page) await page.close();
    page = await ctx.newPage(); cdp = await ctx.newCDPSession(page);
    await page.addInitScript(HOOKS);
    await page.addInitScript(() => { try { localStorage.setItem('tdgp-menu', 'old'); } catch (_) { } });
    await page.goto(base + '/', { timeout: 600000 });
    await page.waitForFunction(() => window.__game && document.getElementById('loading').classList.contains('off'), null, { timeout: 600000 });
    if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  };
  await open();
  const only = opt('--samo', null), ids = only ? only.split(',') : await page.evaluate(() => Core.TRACKS.filter(d => !d.test).map(d => d.id));
  const rows = [];
  for (const [k, id] of ids.entries()) {
    if (has('--fresh') && k > 0) await open();
    const r = await page.evaluate(async (id) => {
      const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)), Z = window.__zt, n0 = Z.calls.length;
      g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(250);
      const card = document.querySelector(`[data-track="${id}"]`); if (!card) return { id, err: 'no card' };
      card.click(); await wait(150); const inf = () => { const i = Render.info(); return i ? i.programs.length : 0; }, p0 = inf(), t0 = performance.now(); g.onAction('start');
      for (let k = 0; k < 6000 && !(g.race && g.race.track.def.id === id && document.getElementById('loading').classList.contains('off')); k++) await wait(50);
      const t1 = performance.now(), C = Z.calls.slice(n0);
      const ms = (n) => Math.round(C.filter(c => c.n === n).reduce((a, c) => a + c.ms, 0));
      const i = Render.info(), mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0;
      return { id, total: Math.round(t1 - t0), buildWorld: ms('Render.buildWorld'), worldBuild: ms('World.build'), precompile: ms('Render.precompile'), loadMs: Math.round(g.loadMs),
        progs: inf() - p0, progsAll: inf(), geoms: i ? i.memory.geometries : 0, texs: i ? i.memory.textures : 0, heapMB: mem };
    }, id);
    rows.push(r); console.log(`   ${id.padEnd(14)} start→dirka ${s(r.total)} · svet ${s(r.buildWorld)} (World.build ${s(r.worldBuild)}) · senčilniki ${s(r.precompile)} (${r.progs} novih programov, vseh ${r.progsAll}) · ${r.geoms} geometrij, ${r.texs} tekstur, ${r.heapMB} MB JS`);
  }
  await page.close();
  return rows;
}

// one track's build from the menu under the CPU profiler (sampling every 0.5 ms), warm: the time by function, self and with its callees
async function profileBuild(browser, base, id) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, hasTouch: true, ignoreHTTPSErrors: true });
  const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
  await page.addInitScript(() => { try { localStorage.setItem('tdgp-menu', 'old'); } catch (_) { } });
  for (let k = 0; k < 2; k++) { await page.goto(base + '/', { timeout: 600000 }); await page.waitForFunction(() => window.__game && document.getElementById('loading').classList.contains('off'), null, { timeout: 600000 }); }
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
  await page.evaluate(async () => { const g = window.__game, w = (ms) => new Promise(r => setTimeout(r, ms)); g.onAction('to-title'); await w(250); g.onAction('to-track'); await w(250); });
  await page.evaluate((id) => { document.querySelector(`[data-track="${id}"]`).click(); }, id);
  await page.waitForTimeout(200);
  await cdp.send('Profiler.start');
  const t0 = Date.now();
  await page.evaluate(() => window.__game.onAction('start'));
  await page.waitForFunction((id) => window.__game.race && window.__game.race.track.def.id === id && document.getElementById('loading').classList.contains('off'), id, { timeout: 600000, polling: 100 });
  const wall = Date.now() - t0, { profile } = await cdp.send('Profiler.stop');
  await ctx.close();
  // self time of each node, then by function (name + file + line); with callees: each sample counts once for every function on its stack
  const byId = new Map(profile.nodes.map(n => [n.id, n])), parent = new Map();
  for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const selfMs = new Map(); profile.samples.forEach((sid, i) => selfMs.set(sid, (selfMs.get(sid) || 0) + (profile.timeDeltas[i] || 0) / 1000));
  const key = (n) => { const f = n.callFrame; return (f.functionName || '(anonym)') + ' ' + (f.url ? f.url.replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*$/, '') + ':' + (f.lineNumber + 1) : ''); };
  const self = new Map(), total = new Map();
  for (const [sid, ms] of selfMs) {
    const n = byId.get(sid); self.set(key(n), (self.get(key(n)) || 0) + ms);
    const seen = new Set(); for (let x = sid; x != null; x = parent.get(x)) { const k = key(byId.get(x)); if (!seen.has(k)) { seen.add(k); total.set(k, (total.get(k) || 0) + ms); } }
  }
  const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, ms]) => [k, Math.round(ms)]);
  const res = { id, wall, self: top(self, 40), total: top(total, 60) };
  console.log(`profil ${id} (CPU ${CPU}×): start→dirka ${s(wall)}`);
  console.log('   največ s klici:'); for (const [k, ms] of res.total.slice(0, 30)) console.log('     ' + s(ms).padStart(7) + '  ' + k);
  console.log('   največ samo zase:'); for (const [k, ms] of res.self.slice(0, 20)) console.log('     ' + s(ms).padStart(7) + '  ' + k);
  return res;
}

main().catch((e) => { console.error(e); process.exit(1); });
