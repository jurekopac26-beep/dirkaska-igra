// The menu's corner camera (camera 3 of the track step, docs/meni-izbira-proge.md, sklop 4): a short video of a still camera at the track's
// most interesting corner, the game's AI cars racing through it, played in a loop on the stage. Drawn by the game itself in the browser
// without a screen (virtual time: tools/menu-corner-page.js), then a seamless loop (the last half second laid over the first, at a moment
// with no car in sight) encoded as VP9 (assets/maps/corner-<id>.webm, 6-8 s, about 0.6-1.2 MB) and its first frame as the poster
// (corner-<id>.webp). The corners: tools/menu-corners.json ({ <id>: { s: metres along the track (its own s, T.idx), cam: [px, py, pz,
// tx, ty, tz, fov] } }); a track without cam gets one found by the camera search (rays into the world round the corner), written back.
// MENU.corners in js/menu-data.js lists the tracks that have a video (the menu shows their model without one).
//   node tools/menu-corner.mjs vrsic,spa            the videos of these tracks (every real track: no ids)
//   node tools/menu-corner.mjs vrsic --preview      only stills: the three best cameras of the search (test-results/corners/<id>-<k>.jpg)
//   node tools/menu-corner.mjs vrsic --search       find the camera again (the one in menu-corners.json is replaced)
//   env: KBPS (the bitrate's cap; 1600), CRF (30). In menu-corners.json a track may have pick (the search's k-th camera), sec ([6, 8]: the
//   loop's shortest and longest), watch (s of the race looked at for the loop: 80), seed (11), numAI (21)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { spawnSync } from 'node:child_process';
import { serve, launch } from '../tests/browser/lib.mjs';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const CFG_F = path.join(REPO, 'tools', 'menu-corners.json'), OUT = path.join(REPO, 'test-results', 'corners'), MAPS = path.join(REPO, 'assets', 'maps');
const args = process.argv.slice(2), has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const PREVIEW = has('--preview'), SEARCH = has('--search'), KEEP = has('--keep');
const CFG = JSON.parse(fs.readFileSync(CFG_F, 'utf8'));
const ids = args[0] ? args[0].split(',') : Object.keys(CFG);
const SIZE = 720, FPS = 30, SEC = +(process.env.SEC || 7), XF = 0.5, KBPS = +(process.env.KBPS || 1600), CRF = process.env.CRF || '30';
fs.mkdirSync(OUT, { recursive: true });
const t00 = Date.now(), log = (...a) => console.log(((Date.now() - t00) / 1000).toFixed(0).padStart(5) + ' s', ...a);
const jpg = (data) => Buffer.from(data.split(',')[1], 'base64');
const ff = (a) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' }); if (r.status) throw new Error('ffmpeg ' + a.join(' ')); };
const py = (code, ...a) => { const r = spawnSync('python3', ['-I', '-c', code, ...a], { stdio: 'inherit' }); if (r.status) throw new Error('python failed'); };

const srv = await serve(), browser = await launch();
async function open(id) {
  const ctx = cur = await browser.newContext({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => log('pageerror:', e.message));
  page.on('console', m => { if (m.type() === 'error') log('console:', m.text().slice(0, 200)); });
  const raw = JSON.stringify({ track: id, sound: 0, comm: 0, codrv: 0, quali: 0, faults: 0, hlv: 0, damage: 0, quality: 'high', detail: 'high', carDet: 'high', shadows: 1, weather: 'dry', tod: 'day', season: 'summer', intro: 2, music: 0 });
  await page.addInitScript((raw) => {
    for (const k of ['tdgp-defaults-v2', 'tdgp-defaults-v3', 'tdgp-defaults-v4', 'tdgp-defaults-v5', 'tdgp-noadapt']) localStorage.setItem(k, '1');
    localStorage.setItem('tdgp-settings', raw); localStorage.setItem('tdgp-menu', 'old');
    // the game's clock and frames are the tool's: they go on while it loads, then only when the tool draws
    let vt = 0, q = [];
    performance.now = () => vt;
    window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.cancelAnimationFrame = () => {};
    window.__step = (ms) => { vt += ms; const cbs = q; q = []; for (const cb of cbs) { try { cb(vt); } catch (e) { console.error(e); } } };
    window.__pump = setInterval(() => window.__step(1000 / 60), 16);
  }, raw);
  await page.goto(srv.base + '/index.html', { timeout: 180000 });
  await page.waitForFunction((id) => window.__game && window.__game.demo && window.__game.demo.track.def.id === id && typeof Render !== 'undefined' && Render.world, id, { timeout: 300000 });
  await new Promise(r => setTimeout(r, 2500));   // (the world's pictures)
  await page.evaluate(() => clearInterval(window.__pump));
  await page.addScriptTag({ url: '/tools/menu-corner-page.js' });
  return { ctx, page };
}
const camOf = (c) => ({ px: c[0], py: c[1], pz: c[2], tx: c[3], ty: c[4], tz: c[5], fov: c[6] });
const camArr = (c) => [c.px, c.py, c.pz, c.tx, c.ty, c.tz].map(v => Math.round(v * 10) / 10).concat([c.fov]);

const failed = []; let cur = null;   // (the page of the track being drawn: closed if it fails)
for (const id of ids) {
  const C = CFG[id]; if (!C) { log(id, 'not in tools/menu-corners.json'); continue; }
  try { await one(id, C); } catch (e) { failed.push(id); log(id, 'FAILED', e.message.split('\n')[0]); if (cur) await cur.close().catch(() => {}); }
  cur = null;
}
if (failed.length) log('failed:', failed.join(','));
async function one(id, C) {
  const t0 = Date.now(), { ctx, page } = await open(id), seed = C.seed || 11;
  const info = await page.evaluate((o) => MC.setup(o), { seed, numAI: C.numAI || 21, fps: FPS });
  log(id, 'ready', JSON.stringify(info));
  let cam = C.cam && !SEARCH && !PREVIEW ? camOf(C.cam) : null;
  if (!cam) {
    // the world as it is seen from round the corner (its far trees drawn there), then the search
    await page.evaluate((s0) => { const r = MC.race.track, i = r.idx(s0), y = r.hy ? r.hy[i] : 0; MC.still({ px: r.px[i] + 1, py: y + 60, pz: r.pz[i] + 1, tx: r.px[i], ty: y, tz: r.pz[i], fov: 60 }); }, C.s);
    const S = await page.evaluate(([s0, o]) => MC.search(s0, o), [C.s, C.search || {}]);
    log(id, 'search', JSON.stringify({ span: S.span, tested: S.tested, rays: S.rays, n: S.n }), JSON.stringify(S.best.slice(0, 3)));
    if (!S.best.length) { await ctx.close(); throw new Error('no camera found'); }
    // the three best cameras as stills, the cars at the corner (test-results/corners/<id>-<k>.jpg): to look at, and to pick another (pick: k)
    await page.evaluate((s0) => MC.until(s0, 40, 900), C.s);
    for (let k = 0; k < Math.min(3, S.best.length); k++) fs.writeFileSync(path.join(OUT, id + '-' + (k + 1) + '.jpg'), jpg(await page.evaluate((c) => MC.still(c), S.best[k])));
    if (PREVIEW) { log(id, 'preview', path.relative(REPO, OUT)); await ctx.close(); return; }
    cam = S.best[Math.min(S.best.length, C.pick || 1) - 1]; C.cam = camArr(cam);
    await page.evaluate((o) => MC.setup(o), { seed, numAI: C.numAI || 21, fps: FPS });   // (the race from its start again)
    fs.writeFileSync(CFG_F, JSON.stringify(CFG, null, 1) + '\n');
  }
  // 1: the race to the corner, and where the cars the camera sees are in its frame at every frame for a while (nothing drawn)
  const ta = await page.evaluate((s0) => MC.until(s0, 260, 1200), C.s);
  const TL = await page.evaluate(([c, s0, sec]) => MC.timeline(c, s0, sec), [cam, C.s, C.watch || 80]), P = TL.frames, cnt = P.map(f => f.length);
  // the loop: 6 to 8 s with the most cars in sight and a seam (its last half second laid over its first) where the cars of the two ends
  // stand where each other's are (else a car shows twice, faintly, for a moment): each car without one of the other end near it is a ghost
  const X = Math.round(XF * FPS), sum = [0]; for (const n of cnt) sum.push(sum[sum.length - 1] + n);
  const ghost = (A, B) => { let g = 0; for (const a of A) { let m = 9; for (const b of B) m = Math.min(m, Math.hypot(a[0] - b[0], a[1] - b[1])); g += Math.min(1, m / 0.15); } return g; };
  const seamOf = (k, L) => { let g = 0; for (const e of [0, X >> 1, X - 1]) g += (ghost(P[k + e], P[k + L + e]) + ghost(P[k + L + e], P[k + e])) / 2; return g / 3; };
  let best = -1e9, k1 = 0, L = SEC * FPS, gh = 0;
  for (let LL = (C.sec || [6, 8])[0] * FPS; LL <= (C.sec || [6, 8])[1] * FPS; LL += 6) for (let k = 0; k + LL + X <= P.length; k++) {
    const avg = (sum[k + LL] - sum[k]) / LL; if (avg < 0.5) continue;
    const g = seamOf(k, LL), v = Math.min(avg, 8) - 0.6 * g;   // (the cars first: a busy loop with a car or two at its seam beats an empty one)
    if (v > best) { best = v; k1 = k; L = LL; gh = g; }
  }
  log(id, 'race to the corner', ta.toFixed(1) + ' s; the camera sees', TL.seen, 'm of road; loop from', (k1 / FPS).toFixed(2), 's,', (L / FPS).toFixed(1), 's, cars in sight', ((sum[k1 + L] - sum[k1]) / L).toFixed(1), 'a frame, ghosts at its seam', gh.toFixed(2));
  // 2: the same race again (the same seed) to the loop's start, then drawn
  await page.evaluate((o) => MC.setup(o), { seed, numAI: C.numAI || 21, fps: FPS });
  const tb = await page.evaluate((s0) => MC.until(s0, 260, 1200), C.s);
  if (Math.abs(tb - ta) > 1e-6) log(id, 'WARNING: the race again is not the same', ta, tb);
  const W = Math.min(6, Math.floor(k1 / FPS));   // (the warm-up: the race drawn for up to 6 s before the loop, 10 frames a second)
  await page.evaluate((s) => MC.run(s), k1 / FPS - W);
  await page.evaluate(([c, w]) => MC.warm(c, w, 10), [cam, W]);
  const dir = path.join(OUT, '_' + id); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let k = 0; k < L + X; k++) fs.writeFileSync(path.join(dir, 'f_' + String(k).padStart(4, '0') + '.jpg'), jpg(await page.evaluate((c) => MC.frame(c), cam)));
  await ctx.close();
  // 3: the seamless loop (frames L..L+X laid over 0..X, fading in), the poster (its first frame), the video
  py(`
import sys, os
from PIL import Image
import numpy as np
d, L, X = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
f = lambda k: np.asarray(Image.open(os.path.join(d, 'f_%04d.jpg' % k)).convert('RGB'), dtype=np.float32)
os.makedirs(os.path.join(d, 'o'), exist_ok=True)
for k in range(L):
    o = os.path.join(d, 'o', 'o_%04d.jpg' % k)
    if k >= X:
        os.symlink(os.path.join(d, 'f_%04d.jpg' % k), o)
        continue
    w = (k + 0.5) / X
    w = w * w * (3 - 2 * w)
    a = f(k) * w + f(L + k) * (1 - w)
    Image.fromarray(np.clip(a + 0.5, 0, 255).astype(np.uint8)).save(o, quality=97)
`, dir, String(L), String(X));
  const webm = path.join(MAPS, 'corner-' + id + '.webm'), webp = path.join(MAPS, 'corner-' + id + '.webp'), plog = path.join(dir, 'pass');
  const vp9 = ['-c:v', 'libvpx-vp9', '-row-mt', '1', '-threads', '4', '-deadline', 'good', '-cpu-used', '2', '-g', String(L), '-auto-alt-ref', '1', '-lag-in-frames', '25', '-crf', CRF, '-b:v', KBPS + 'k', '-pix_fmt', 'yuv420p', '-an'];
  const src = ['-framerate', String(FPS), '-i', path.join(dir, 'o', 'o_%04d.jpg')];
  ff([...src, ...vp9, '-pass', '1', '-passlogfile', plog, '-f', 'null', '/dev/null']);
  ff([...src, ...vp9, '-pass', '2', '-passlogfile', plog, webm]);
  py(`
import sys
from PIL import Image
Image.open(sys.argv[1]).save(sys.argv[2], 'WEBP', quality=78, method=6)
`, path.join(dir, 'o', 'o_0000.jpg'), webp);
  if (!KEEP) fs.rmSync(dir, { recursive: true, force: true });
  log(id, 'video', path.relative(REPO, webm), (fs.statSync(webm).size / 1e6).toFixed(2) + ' MB, poster', (fs.statSync(webp).size / 1e3).toFixed(0) + ' kB,', ((Date.now() - t0) / 60000).toFixed(1), 'min');
}
// the menu's list of the tracks with a video (js/menu-data.js: MENU.corners)
if (!PREVIEW) {
  const have = Object.keys(CFG).filter(id => fs.existsSync(path.join(MAPS, 'corner-' + id + '.webm'))).sort();
  const F = path.join(REPO, 'js', 'menu-data.js'); let src = fs.readFileSync(F, 'utf8');
  const re = /^window\.MENU\.corners = .*;$/m, line = 'window.MENU.corners = ' + JSON.stringify(have) + ';';
  src = re.test(src) ? src.replace(re, line) : src.replace(/\s*$/, '\n') + '// the tracks with a video of their corner, camera 3 of the track step (tools/menu-corner.mjs)\n' + line + '\n';
  fs.writeFileSync(F, src); log('MENU.corners:', have.length, 'tracks');
}
await browser.close(); await srv.close();
