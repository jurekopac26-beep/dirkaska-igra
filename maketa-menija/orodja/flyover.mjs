// Mockup only: the flyover videos of the tracks (the menu's track picture 1), drawn by the game itself in its own page (drone_page.js flyInit /
// flyFrame): the game's world of the track, and round its strip the real land (geo_far.py: its real heights, painted from the real land
// cover; geo_lc.py: the land cover, after which the land is planted with the game's own trees, bushes and houses, as for the helicopter's
// flight), so no bare land shows past the strip -> raw/maps/fly-<track>.webm (VP9, the size the menu uses) + fly-<track>.json (where the
// start, the finish, the point and the places are in each frame).
// Usage: node flyover.mjs [flyovers.json] [vrsic,pikes]   (the jobs: [[track, {options}], …]; only these tracks). The game comes from ../game_vrsic
// (env GAME: another copy), ffmpeg from imageio-ffmpeg (env FFMPEG: another one). The real land comes from raw/geo/<track>-far.json and
// -far-lc.png (without them: the drawn hills round the strip, unplanted); the race's settings from drones.json (the season, the snow line),
// the planting's from heli.json (plantO). Several browsers draw the frames of a track at once (env PARALLEL, default 4), each into
// raw/maps/fly-<track>/ (a JPEG and its data per frame; a stopped run goes on from there), then the frames are joined into the video at
// the quality env CRF (default 44), in two passes at most at the track's `kbps` if it has one. PREVIEW=1 AT=0,300 (frames): only those
// frames, into prev/fly_<track>_<frame>.jpg, for a look.
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
// the camera of every flyover: as high over the point (up), as far behind it (back) and aiming as far ahead of it (ahead), on every track, so
// every flyover shows its land at the same scale. The average of the cameras of the first flyovers of the real tracks (Vršič 330 m, Pikes
// Peak 230, Ouninpohja 270, Štajerska 165, Suzuka 190, Spa 205, Nürburg 450: 263 m). The haze as the game draws it for a camera fogD m from
// what it looks at (from 1.35 fogD to 5.5 fogD: about 0.9 to 3.9 km), the planted land drawn to plantR m round the camera. A row of
// flyovers.json can still set its own. The point's speed stays the track's own (`speed`, about its length / 28 m/s).
const CAMERA = { up: 263, back: 411, ahead: 206, fogD: 700, plantR: 3400, cull: 3400 };

if (process.env.FLY_PART || process.env.PREVIEW) {
  // a worker: draws the frames k with k % P == w of the one track it is given (PREVIEW: only the frames AT)
  const { chromium } = require('/opt/node22/lib/node_modules/playwright');
  const [w, P] = (process.env.FLY_PART || '0/1').split('/').map(Number), [track, opt0] = JOBS[0], opt = Object.assign({}, CAMERA, opt0), dir = path.join(OUT, 'fly-' + track);
  const RACES = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(HERE, 'drones.json'), 'utf8'))), J = RACES[track] || {};
  const HELI = fs.existsSync(path.join(HERE, 'heli.json')) ? JSON.parse(fs.readFileSync(path.join(HERE, 'heli.json'), 'utf8')) : {}, Hc = Object.assign({}, HELI.default || {}, HELI[track] || {});
  fs.mkdirSync(dir, { recursive: true });
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = p.startsWith('/__proto/') ? path.join(HERE, p.slice(9)) : path.join(GAME, p.endsWith('/') ? p + 'index.html' : p);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const W = opt.W || 704, H = opt.H || 432, fps = opt.fps || 30, t0 = Date.now();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('pageerror:', e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) console.log('console:', m.text().slice(0, 200)); });
  page.on('response', r => { if (r.status() >= 400) console.log(track, 'part', w, 'missing:', r.status(), r.url().replace(base, '')); });
  // the game in virtual time (as heli.mjs): its title screen's race on the track, then held still
  const raw = JSON.stringify({ sound: 0, comm: 0, codrv: 0, camera: 'chase', zoom: 1.2, quality: 'high', shadows: 1, carV: 2, name: 'Player', track, car: 0, color: 0,
    weather: 'dry', tod: 'day', season: opt.season || J.season || 'summer', mode: 'race', quali: 0, damage: 0 });   // (opt.season: Vršič in its October colours, as the menu's map shows it)
  await page.addInitScript((raw) => {
    localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-noadapt', '1'); localStorage.setItem('tdgp-pikes-w7', '1'); localStorage.setItem('tdgp-settings', raw);
    let vt = 0, q = [];
    performance.now = () => vt;
    window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.cancelAnimationFrame = () => {};
    window.__step = (ms) => { vt += ms; const cbs = q; q = []; for (const cb of cbs) { try { cb(vt); } catch (e) { console.error(e); } } };
    window.__pump = setInterval(() => window.__step(1000 / 60), 16);
  }, raw);
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 300 && !(await page.evaluate(() => !!(window.__game && window.__game.demo))); i++) await new Promise(r => setTimeout(r, 500));
  await new Promise(r => setTimeout(r, 2500));
  await page.evaluate(() => clearInterval(window.__pump));
  // the game's own invented sponsors: the VOLTEX board (a real brand name) shows PIXEL GAS instead (as heli.mjs)
  await page.evaluate(() => { try { const t = Tex.all().sponsors, c = t.image, x = c.getContext('2d'); x.drawImage(c, 0, 192, 256, 64, 0, 128, 256, 64); t.needsUpdate = true; } catch (e) { console.log('sponsor patch', e.message); } });
  await page.addScriptTag({ url: '/__proto/drone_page.js' });
  // the real land round the strip (its heights and painted picture, geo_far.py), its land cover (geo_lc.py), the snow line (drones.json)
  const farP = path.join(HERE, 'raw', 'geo', track + '-far.json'), far = Object.assign(fs.existsSync(farP) ? JSON.parse(fs.readFileSync(farP, 'utf8')) : { synth: true }, J.snow ? { snow: J.snow } : {});
  if (Hc.sea) far.sea = true;
  const lcF = 'raw/geo/' + track + '-far-lc.png', lc = fs.existsSync(path.join(HERE, lcF)) ? lcF : null;
  const land = await page.evaluate((o) => window.DR.setup(Object.assign(o, { theme: window.__game.demo.track.def.theme })), { mode: 'demo', fps, extra: 0, far, lc,
    edgeTint: Hc.edgeTint ? Object.assign({ margin: 300 }, Hc.edgeTint === true ? {} : Hc.edgeTint) : null, feather: Hc.feather || 0 });
  const info = await page.evaluate((o) => window.DR.flyInit(o), Object.assign({ W, H, fps }, opt));
  let planted = null;
  if (lc && Hc.plant !== false) {
    const tiles = await page.evaluate((r) => window.DR.flyTiles(r), opt.plantR);
    planted = await page.evaluate((o) => window.DR.plantLand(o), Object.assign({ lc, far: Object.assign({}, far, { h: undefined, lc: undefined }), tiles, houses: true }, Hc.plantO || {}));
  }
  console.log(track, 'part', w, 'ready', JSON.stringify({ land: land.land, info, planted: planted && { tiles: planted.tiles, trees: planted.trees, bushes: planted.bushes, houses: planted.houses, keep: planted.keep } }), ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  if (info.cw !== W || info.ch !== H) console.log(track, 'the game draws', info.cw, 'x', info.ch, 'not', W, 'x', H);
  if (process.env.PREVIEW) {   // a look at a few frames
    fs.mkdirSync(path.join(HERE, 'prev'), { recursive: true });
    for (const k of (process.env.AT || '0').split(',').map(Number)) {
      const t1 = Date.now(), r = await page.evaluate((k) => window.DR.flyFrame(k), Math.min(info.frames - 1, k));
      fs.writeFileSync(path.join(HERE, 'prev', 'fly_' + track + '_' + k + (process.env.SUF || '') + '.jpg'), Buffer.from(r.jpg.split(',')[1], 'base64'));
      console.log(track, 'preview frame', k, ((Date.now() - t1) / 1000).toFixed(2) + ' s', JSON.stringify([r.d, r.s, r.f, r.p]));
    }
    await browser.close(); server.close(); process.exit(0);
  }
  if (w === 0) fs.writeFileSync(path.join(dir, 'info.json'), JSON.stringify({ frames: info.frames, n: info.n, fps: info.fps, W: info.W, H: info.H, raceLen: info.raceLen }));
  const t2 = Date.now(); let done = 0;
  for (let k = w; k < info.frames; k += P) {
    if (fs.existsSync(path.join(dir, num(k) + '.json'))) continue;   // drawn by an earlier run
    const r = await page.evaluate((k) => window.DR.flyFrame(k), k);
    fs.writeFileSync(path.join(dir, num(k) + '.jpg'), Buffer.from(r.jpg.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(dir, num(k) + '.json'), JSON.stringify([r.d, r.s, r.f, r.p, r.q]));
    if (++done % 50 === 0) console.log(track, 'part', w, 'frame', k, 'of', info.frames, ((Date.now() - t2) / 1000 / done).toFixed(2) + ' s/frame');
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
