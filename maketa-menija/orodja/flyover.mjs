// Mockup only: the flyover videos of the open roads and the rally stages (routemap_page.js flyInit / flyFrame in the game's page)
// -> raw/maps/fly-<track>.webm (VP9, the size the menu uses) + fly-<track>.json (where the start, the finish, the point and the places are
// in each frame).
// Usage: node flyover.mjs [flyovers.json] [vrsic,pikes]   (the jobs: [[track, {options}], …]; only these tracks). The game comes from ../game_vrsic
// (env GAME: another copy), ffmpeg from imageio-ffmpeg (env FFMPEG: another one). Several browsers draw the frames of a track at once
// (env PARALLEL, default 4), each into raw/maps/fly-<track>/ (a JPEG and its data per frame; a stopped run goes on from there), then the
// frames are joined into the video at the quality env CRF (default 44), in two passes at most at the track's `kbps` if it has one.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), GAME = process.env.GAME || path.join(HERE, '..', 'game_vrsic'), OUT = path.join(HERE, 'raw', 'maps');
const FF0 = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2', FF = process.env.FFMPEG || (fs.existsSync(FF0) ? FF0 : 'ffmpeg');
fs.mkdirSync(OUT, { recursive: true });
const arg = process.argv[2] || 'flyovers.json', JOBS = (fs.existsSync(arg) ? JSON.parse(fs.readFileSync(arg, 'utf8')) : JSON.parse(arg)).filter(j => !process.argv[3] || process.argv[3].split(',').includes(j[0]));
const num = (k) => String(k).padStart(5, '0');

if (process.env.FLY_PART) {
  // a worker: draws the frames k with k % P == w of the one track it is given
  const { chromium } = require('/opt/node22/lib/node_modules/playwright');
  const [w, P] = process.env.FLY_PART.split('/').map(Number), [track, opt] = JOBS[0], dir = path.join(OUT, 'fly-' + track);
  fs.mkdirSync(dir, { recursive: true });
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = p.startsWith('/__proto/') ? path.join(HERE, p.slice(9)) : path.join(GAME, p.endsWith('/') ? p + 'index.html' : p);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('pageerror:', e.message));
  const raw = JSON.stringify({ sound: 0, comm: 0, camera: 'chase', zoom: 1.2, quality: 'high', shadows: 1, carV: 2, name: 'Player', track: 'jezero', car: 0, color: 0 });
  await page.addInitScript((raw) => { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-pikes-w7', '1'); localStorage.setItem('tdgp-settings', raw); }, raw);
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 400 && !(await page.evaluate(() => !!window.__game)); i++) await new Promise(r => setTimeout(r, 500));
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });   // stop the game loop
  await page.addScriptTag({ url: '/__proto/routemap_page.js' });
  const info = await page.evaluate(([t, o]) => window.RM.flyInit(t, o), [track, opt]);
  if (w === 0) fs.writeFileSync(path.join(dir, 'info.json'), JSON.stringify(info));
  const t0 = Date.now(); let done = 0;
  for (let k = w; k < info.frames; k += P) {
    if (fs.existsSync(path.join(dir, num(k) + '.json'))) continue;   // drawn by an earlier run
    const r = await page.evaluate((k) => window.RM.flyFrame(k), k);
    fs.writeFileSync(path.join(dir, num(k) + '.jpg'), Buffer.from(r.jpg.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(dir, num(k) + '.json'), JSON.stringify([r.d, r.s, r.f, r.p, r.q]));
    if (++done % 50 === 0) console.log(track, 'part', w, 'frame', k, 'of', info.frames, ((Date.now() - t0) / 1000 / done).toFixed(2) + ' s/frame');
  }
  await browser.close(); server.close();
} else {
  // the main run: the workers of each track, then the video and the frames' data
  const P = +(process.env.PARALLEL || 4);
  for (const [track, opt] of JOBS) {
    const dir = path.join(OUT, 'fly-' + track), t0 = Date.now(), inf0 = path.join(dir, 'info.json');
    const drawn = fs.existsSync(inf0) && Array.from({ length: JSON.parse(fs.readFileSync(inf0, 'utf8')).frames }, (_, k) => fs.existsSync(path.join(dir, num(k) + '.json'))).every(Boolean);
    if (!drawn) await Promise.all(Array.from({ length: P }, (_, w) => new Promise((res) => {
      const c = spawn(process.execPath, [new URL(import.meta.url).pathname, JSON.stringify([[track, opt]])], { env: Object.assign({}, process.env, { FLY_PART: w + '/' + P }), stdio: 'inherit' });
      c.on('close', res);
    })));
    const info = JSON.parse(fs.readFileSync(path.join(dir, 'info.json'), 'utf8')), frames = [];
    for (let k = 0; k < info.frames; k++) {
      const f = path.join(dir, num(k) + '.json');
      if (!fs.existsSync(f)) { console.log(track, 'frame', k, 'is missing: run again'); process.exit(1); }
      frames.push(JSON.parse(fs.readFileSync(f, 'utf8')));
    }
    const name = path.join(OUT, 'fly-' + track + '.webm'), ff = (args) => new Promise((res) => spawn(FF, args, { stdio: 'inherit' }).on('close', res));
    const src = ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(info.fps), '-i', path.join(dir, '%05d.jpg')];
    const vp9 = ['-c:v', 'libvpx-vp9', '-row-mt', '1', '-threads', '4', '-deadline', 'good', '-cpu-used', '2', '-g', String(info.fps * 4), '-pix_fmt', 'yuv420p', '-an'];
    let code;
    const crf = ['-crf', process.env.CRF || '44'];
    if (opt.kbps) {   // two passes, the quality kept but at most about this many kbit/s over the whole video (the bits where the picture needs them)
      const log = path.join(dir, 'pass'), q = [...crf, '-b:v', opt.kbps + 'k'];
      code = await ff([...src, ...vp9, ...q, '-pass', '1', '-passlogfile', log, '-f', 'null', '/dev/null']) || await ff([...src, ...vp9, ...q, '-pass', '2', '-passlogfile', log, name]);
    } else code = await ff([...src, ...vp9, ...crf, '-b:v', '0', name]);
    fs.copyFileSync(path.join(dir, num(0) + '.jpg'), path.join(OUT, 'fly-' + track + '-poster.jpg'));
    fs.writeFileSync(path.join(OUT, 'fly-' + track + '.json'), JSON.stringify({ fps: info.fps, W: info.W, H: info.H, raceLen: info.raceLen, places: (opt.places || []).map(q => q.n), frames }));
    console.log(track, 'done', info.frames, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + ' s', 'ffmpeg', code, fs.existsSync(name) ? (fs.statSync(name).size / 1024).toFixed(0) + ' KB' : '');
  }
}
