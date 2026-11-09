// Shared helpers for the browser tests (Playwright + headless Chromium with software WebGL).
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { createRequire } from 'node:module';

// the game folder under test: the repo itself, or another copy given in GAME_ROOT (e.g. an older version)
export const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
export const ROOT = process.env.GAME_ROOT ? path.resolve(process.env.GAME_ROOT) : REPO;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

// a tiny static web server for the repo folder (like GitHub Pages: a folder address serves its index.html). setOffline(true)
// makes every request fail, as if the phone had no internet. setFail(fn) spoils only the requests fn(req) picks: fn returns
// true (the connection drops), an HTTP status such as 503 (the server has a problem) or 'hang' (no answer ever comes)
export function serve(root = ROOT) {
  return new Promise((resolve) => {
    let offline = false, fail = null;
    const hung = new Set();   // (requests left without an answer; they fail as soon as the setting changes)
    const settle = () => { for (const s of hung) s.destroy(); hung.clear(); };
    const server = http.createServer((req, res) => {
      const f = offline || (fail && fail(req));
      if (f === 'hang') { hung.add(req.socket); return; }
      if (typeof f === 'number') { res.writeHead(f); res.end('server problem'); return; }
      if (f) { req.socket.destroy(); return; }
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(root, p.endsWith('/') ? p + 'index.html' : p);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      // (a video is asked for by ranges: without them the browser cannot seek in it, nor know its length)
      const size = fs.statSync(file).size, type = TYPES[path.extname(file)] || 'application/octet-stream', m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (req.method === 'HEAD') { res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size }); res.end(); return; }   // (a HEAD only needs the headers: a cheap existence check, no body)
      if (m && (m[1] || m[2])) {
        const a = m[1] ? +m[1] : Math.max(0, size - +m[2]), b = m[1] && m[2] ? Math.min(size - 1, +m[2]) : size - 1;
        if (a > b || a >= size) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }); res.end(); return; }
        res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': b - a + 1 });
        fs.createReadStream(file, { start: a, end: b }).pipe(res);
        return;
      }
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(r => { server.close(r); server.closeAllConnections(); }), setOffline: (v) => { settle(); offline = !!v; }, setFail: (fn) => { settle(); fail = fn || null; } }));
  });
}

// the Playwright (and so the Chromium) the references were made with: package.json's. Another one (e.g. a global install linked into
// node_modules) builds the worlds a little differently: V8's Math.sin, cos, atan2, exp, pow ... differ in the last bit between Chromium
// versions, and world.test.mjs then finds props and meshes changed though nothing did
export function pwNote() {
  try {
    const want = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).devDependencies.playwright;
    const have = JSON.parse(fs.readFileSync(createRequire(import.meta.url).resolve('playwright/package.json'), 'utf8')).version;
    return have === want ? '' : `Playwright ${have} is not the repo's ${want} (package.json; npm ci installs it): the references were made with its Chromium, whose Math differs in the last bit`;
  } catch (_) { return ''; }
}
let noted = false;
export function launch(extraArgs = []) {
  if (!noted && (noted = true) && pwNote()) console.log('NOTE ' + pwNote());
  return chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...extraArgs] });
}

// open the game; settings: an object (merged over sound/commentary off and no qualifying: Start goes straight to the race), a raw JSON
// string, or null (a fresh profile)
// NEW VERSION · TEST 1 from the new menu's title (opts.menu): behind NEUPORABNO since 9. 11. 2026, the first bar of its sheet
export async function tapNewVersion(page) {
  const q = '#menu-host', nv = '.izb-nu [data-act="newver"]';
  await page.evaluate((q) => document.querySelector(q).shadowRoot.querySelector('[data-act="nu"]').click(), q);
  await page.waitForFunction(([q, nv]) => !!document.querySelector(q).shadowRoot.querySelector(nv), [q, nv], { timeout: 30000 });
  await page.evaluate(([q, nv]) => document.querySelector(q).shadowRoot.querySelector(nv).click(), [q, nv]);
}

export async function openGame(browser, address, settings = {}, viewport = { width: 480, height: 270 }, opts = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport, hasTouch: !!opts.touch }, opts.context));   // (opts.touch: a phone's touch screen, the pointer coarse as on a phone; opts.context: more of the context's options)
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  // (a known miss, no failure of the game: Vršič, a test track frozen since 6. 11. 2026, has no menu picture, assets/tracks/vrsic.webp; the
  // quick list and NEUPORABNO's list show its flyover instead and the browser logs the 404)
  page.on('console', m => { if (m.type() === 'error' && !(/^Failed to load resource/.test(m.text()) && /\/assets\/tracks\/vrsic\.webp$/.test((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  // (net::ERR_ABORTED is the browser's own cancel, no failure of the game or the server: a page reloaded while a script was still on its
  // way, a video read in pieces; a missing file is a 404 answer, not a failed request)
  page.on('requestfailed', r => { const why = (r.failure() || {}).errorText || ''; if (why !== 'net::ERR_ABORTED') errors.push('request failed: ' + r.url() + (why ? ' (' + why + ')' : '')); });
  // (the failures off unless a test asks for them: a cut tyre after a knock would change what the other tests see; the best moment's video
  // after a race too: it would play before the results)
  // (carDet normal: the cars as a phone draws them, whatever the test browser's pointer: Nastavitve · Detajli avtov picks Visoki on a computer;
  // damage Vklop and the old timing tower under the map, as the tests were written for: the game's defaults are Samo videz and the tower at the top;
  // the track Jezero, the game's default the tests were written for: since 9. 11. 2026 the game's default is the first real track, Jezero a test track)
  const raw = settings === null ? null : typeof settings === 'string' ? settings : JSON.stringify(Object.assign({ sound: 0, comm: 0, quali: 0, faults: 0, hlv: 0, carDet: 'normal', damage: 2, tower: 2, track: 'jezero' }, settings));
  // (tdgp-noadapt: software WebGL is slow, so without it the game would lower the resolution and switch shadows off by itself; tdgp-tips:
  // the hints of the first pit stops all seen, so a test's stop shows only the stop's own toast, as on a phone that has stopped before;
  // opts.tips: none seen, as on a new phone (tests/browser/pits.test.mjs). A new hint's id goes in here too)
  // (tdgp-nostartcam: no camera before the start, the race's chase view and its 1.3 s intro as the tests were written for; opts.startCam: on)
  // (tdgp-nu1: the new menu's one-time move of a hidden track to the first real one done, so a test's Jezero stays the game's track)
  await page.addInitScript(([raw, adapt, sc, tips]) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-defaults-v3', '1'); localStorage.setItem('tdgp-defaults-v4', '1'); localStorage.setItem('tdgp-defaults-v5', '1'); localStorage.setItem('tdgp-nu1', '1'); if (!adapt) localStorage.setItem('tdgp-noadapt', '1'); if (!sc) localStorage.setItem('tdgp-nostartcam', '1'); if (raw !== null) localStorage.setItem('tdgp-settings', raw);
    if (!tips) localStorage.setItem('tdgp-tips', JSON.stringify({ in: 1, box: 1, out: 1 })); }, [raw, !!opts.adaptive, !!opts.startCam, !!opts.tips]);
  // opts.seed: Math.random becomes a seeded generator. (The game still runs in real time, so this alone does not make a
  // run repeatable: a test that needs the same result every time also pauses the game and steps it itself.)
  if (opts.seed) await page.addInitScript((seed) => { let s = seed; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }, opts.seed);
  // (the old title and track screens, which most tests click through: the new menu, js/menu.js, has its own test, menu.test.mjs: opts.menu)
  if (!opts.menu) await page.addInitScript(() => { try { localStorage.setItem('tdgp-menu', 'old'); } catch (_) { /* no storage */ } });
  if (opts.init) await page.addInitScript(opts.init);   // (a test's own set-up, run before the game's scripts)
  await page.goto(address, { timeout: 180000 });   // (as long as the wait for the game below: Playwright's own 30 s are too short on a slow machine)
  await page.waitForFunction(() => window.__game, null, { timeout: 180000 });
  return { ctx, page, errors };
}

// start a race on a track through the menus (like a player would); resolves once the race runs on that track. mode: a way to drive
// it, tapped on the card's switch (a track with def.modes: 'race', 'tt', 'traffic', 'police'), else the one the settings have
export function startTrack(page, id, mode) {
  return page.evaluate(async ([id, mode]) => {
    const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
    g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(250);
    const card = document.querySelector(`[data-track="${id}"]`); if (!card) throw new Error('no track card ' + id);
    card.click(); await wait(150);
    if (mode) { const b = document.querySelector(`[data-track="${id}"] [data-set="mode"] [data-v="${mode}"]`); if (!b) throw new Error('no way ' + mode + ' on ' + id); b.click(); await wait(150); }
    g.onAction('start');
    for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === id); k++) await wait(100);
    if (!(g.race && g.race.track.def.id === id)) throw new Error('race did not start on ' + id);
    await wait(300);
    return true;
  }, [id, mode]);
}

// PROGE=seoul,spa: only these of the real tracks (GitHub's short round of a pull request that changes only tracks; tests/lib/sim.js)
export const { izbrane, najmanj } = createRequire(import.meta.url)('../lib/sim.js');
// the list of tracks shown in the track menu, without the test tracks (test: true: frozen until they are deleted before Google Play,
// nothing is checked on them: CLAUDE.md »Testne proge«), only those of PROGE when it is given; all: every card of the menu, the test tracks too
export async function trackIds(page, all = false) {
  const ids = await page.evaluate(async (all) => {
    const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
    g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(350);
    const test = new Set(Core.TRACKS.filter(d => d.test).map(d => d.id));
    return [...new Set([...document.querySelectorAll('[data-track]')].map(e => e.dataset.track))].filter(id => all || !test.has(id));
  }, all);
  return all ? ids : izbrane(ids);
}

// run the race for `sec` seconds of game time on autopilot, rendering a frame after every simulated second
export function simulate(page, sec) {
  return page.evaluate(async (sec) => {
    const g = window.__game; let nan = false;
    for (let i = 0; i < sec; i++) {
      g.sim(1, true); await new Promise(r => requestAnimationFrame(r));
      for (const c of g.race.cars) if (!Number.isFinite(c.x) || !Number.isFinite(c.z) || !Number.isFinite(c.speed)) nan = true;
    }
    return nan;
  }, sec);
}

// drive the race to the line on autopilot and wait for the results screen. The game paused and stepped here, at most max × 2 s of game
// time; the player's car stuck or the wrong way round for over 3 s is put back on the road after each 2 s, like a player tapping Na progo
// (never in the pit lane, where it would undo the stop): the autopilot has no reverse gear and the race rescues only the rivals, so a knock
// (Trki med avti, Simulacija) can leave the player's car against the barrier for good (in CI: hlvid, lang, pits, shramba). Not over by
// then: the game runs on for the rest of the wait. No results: the error says where the car is
export async function driveToResults(page, { max = 300, timeout = 180000 } = {}) {
  const ph = await page.evaluate((max) => {
    const g = window.__game; g.pause();
    for (let k = 0; k < max && g.phase !== 'done'; k++) { g.sim(2, true); const P = g.race && g.race.player; if (P && !P.inPit && !P.finished && (P.stuckT > 3 || P.wrongT > 3)) g.race.rescue(P); }
    if (g.phase === 'done') return 'done';   // (the results screen is up: a resume would close it)
    g.resume(); const P = g.race && g.race.player;
    return g.phase + (P ? ' ' + JSON.stringify({ t: +g.race.time.toFixed(1), lap: P.lap, s: Math.round(P.q.s), v: +P.speed.toFixed(1), stuck: +(P.stuckT || 0).toFixed(1), wrong: +(P.wrongT || 0).toFixed(1), dmg: +(P.dmg || 0).toFixed(2), inPit: !!P.inPit }) : '');
  }, max);
  try { await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout }); } catch (e) { throw new Error(`no results after the race on autopilot (${ph}): ${e.message}`); }
}

// a small check list that prints OK/FAIL lines and sets the exit code
// (on GitHub a failed check also as an annotation, ::error: the check run's annotations name it, readable where the job's log is not)
const ghErr = (title, msg) => { if (process.env.GITHUB_ACTIONS) console.log(`::error title=${String(title).replace(/[\r\n:,%]/g, ' ')}::${String(msg).slice(0, 900).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')}`); };
export function checker(title) {
  let bad = 0, n = 0;
  console.log('== ' + title);
  return {
    check(name, ok, detail = '') { n++; if (!ok) { bad++; ghErr(title, `FAIL ${name}${detail ? ' — ' + detail : ''}`); } console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); return ok; },
    done() { console.log(bad ? `FAIL: ${bad} of ${n} checks` : `OK: all ${n} checks`); process.exitCode = bad ? 1 : 0; return bad; },
  };
}
