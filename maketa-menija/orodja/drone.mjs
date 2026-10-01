// Mockup only: the drone shots of the tracks (drone_page.js in the game's page, drawn by the game itself in virtual time)
// -> raw/drone/<track>/s<shot>_<frame>.jpg, then raw/maps/drone-<track>.webm (the shots one after another, crossfading) and
// drone-<track>.json (when each shot starts, its place and where it is along the road).
// Usage: node drone.mjs [drones.json] [vrsic,spa] [shot numbers: 0,2]   (the jobs: [[track, {mode, shots: [...]}], …]). The game comes from
// ../game_vrsic (env GAME: another copy), ffmpeg from imageio-ffmpeg (env FFMPEG). A shot drawn before is not drawn again (delete its frames).
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), GAME = process.env.GAME || path.join(HERE, '..', 'game_vrsic'), RAW = path.join(HERE, 'raw');
const FF0 = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2', FF = process.env.FFMPEG || (fs.existsSync(FF0) ? FF0 : 'ffmpeg');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.glb': 'model/gltf-binary' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = p.startsWith('/__proto/') ? path.join(HERE, p.slice(9)) : path.join(GAME, p.endsWith('/') ? p + 'index.html' : p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const arg = process.argv[2] || 'drones.json', ONLY = process.argv[3] ? process.argv[3].split(',') : null, SHOTS = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
const JOBS = (fs.existsSync(arg) ? JSON.parse(fs.readFileSync(arg, 'utf8')) : JSON.parse(arg)).filter(j => !ONLY || ONLY.includes(j[0]));
const num = (k) => String(k).padStart(4, '0'), ff = (args) => new Promise((res) => spawn(FF, args, { stdio: 'inherit' }).on('close', res));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [track, J] of JOBS) {
  const W = J.W || 704, H = J.H || 432, fps = J.fps || 30, dir = path.join(RAW, 'drone', track), t0 = Date.now();
  fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(path.join(RAW, 'maps'), { recursive: true });
  const todo = J.shots.map((S, i) => i).filter(i => (!SHOTS || SHOTS.includes(i)) && (process.env.PREVIEW || !fs.existsSync(path.join(dir, 's' + i + '_' + num(Math.round(J.shots[i].dur * fps) - 1) + '.jpg'))));
  if (todo.length) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('pageerror:', e.message));
    const raw = JSON.stringify({ sound: 0, comm: 0, codrv: 0, camera: 'chase', zoom: 1.2, quality: 'high', shadows: 1, carV: 2, name: 'Player', track, car: J.car || 0, color: J.color || 0,
      weather: 'dry', tod: 'day', season: J.season || 'summer', mode: J.mode === 'traffic' ? 'traffic' : 'race', quali: 0, damage: 0 });
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
    await page.evaluate(() => clearInterval(window.__pump));   // from here on nothing moves but what the shots move
    // the game's own invented sponsors: the VOLTEX board (a real brand name) shows PIXEL GAS instead
    await page.evaluate(() => { try { const t = Tex.all().sponsors, c = t.image, x = c.getContext('2d'); x.drawImage(c, 0, 192, 256, 64, 0, 128, 256, 64); t.needsUpdate = true; } catch (e) { console.log('sponsor patch', e.message); } });
    if (J.mode === 'traffic') await page.evaluate(() => window.__game.onAction('start'));
    await page.addScriptTag({ url: '/__proto/drone_page.js' });
    const info = await page.evaluate((o) => window.DR.setup(o), { mode: J.mode, fps, extra: J.extra || 0 });
    console.log(track, 'ready', JSON.stringify(info), ((Date.now() - t0) / 1000).toFixed(0) + ' s');
    if (J.warm) await page.evaluate((s) => window.DR.run(s), J.warm);
    for (const i of J.shots.map((S, i) => i)) {
      const S = J.shots[i], n = Math.round(S.dur * fps);
      if (S.skip) await page.evaluate((s) => window.DR.run(s), S.skip);
      if (S.wait) console.log(track, 'shot', i, 'waited', await page.evaluate((w) => window.DR.waitCar(w[0], w[1], w[2]), S.wait), 's for a car');
      if (process.env.PREVIEW) {   // a quick look: the start, the middle and the end of each shot
        for (const j of [0, 1, 2]) { const url = await page.evaluate(([S, j, n]) => window.DR.frame(S, j, 3), [S, j, n]); fs.writeFileSync(path.join(dir, 'p' + i + '_' + j + '.jpg'), Buffer.from(url.split(',')[1], 'base64')); if (j < 2) await page.evaluate((s) => window.DR.run(s), S.dur / 2); }
        console.log(track, 'preview', i, S.name, 'cars', JSON.stringify(await page.evaluate(() => window.DR.cars().slice(0, 3))), 'jerk', JSON.stringify(await page.evaluate(([S, n]) => window.DR.jerk(S, n), [S, n]))); continue;
      }
      if (!todo.includes(i)) { await page.evaluate((s) => window.DR.run(s), S.dur); continue; }   // (drawn before: the race still goes on as long)
      const t1 = Date.now();
      for (let k = 0; k < n; k++) {
        const url = await page.evaluate(([S, k, n]) => window.DR.frame(S, k, n), [S, k, n]);
        fs.writeFileSync(path.join(dir, 's' + i + '_' + num(k) + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
        if (k % 30 === 0) console.log(track, 'shot', i, S.name, 'frame', k, 'of', n, k ? ((Date.now() - t1) / 1000 / k).toFixed(2) + ' s/frame' : '', 'cars', JSON.stringify(await page.evaluate(() => window.DR.cars().slice(0, 3))));
      }
    }
    await ctx.close();
  }
  if (SHOTS || process.env.PREVIEW) continue;   // (only some shots drawn again, or a preview: no video yet)
  // the video: the shots one after another, each fading into the next over `xfade` seconds
  const X = J.xfade == null ? 0.6 : J.xfade, ins = [], marks = []; let fc = '', last = '0:v', at = 0;
  J.shots.forEach((S, i) => { ins.push('-framerate', String(fps), '-i', path.join(dir, 's' + i + '_%04d.jpg')); marks.push([+(i ? at - X : 0).toFixed(2), S.name, S.d != null ? S.d : S.d0]); at += S.dur - (i ? X : 0); });
  at = J.shots[0].dur;
  for (let i = 1; i < J.shots.length; i++) { const o = +(at - X).toFixed(3); fc += `[${last}][${i}:v]xfade=transition=fade:duration=${X}:offset=${o}[v${i}];`; last = 'v' + i; at = o + J.shots[i].dur; }
  fc += `[${last}]format=yuv420p[out]`;
  const name = path.join(RAW, 'maps', 'drone-' + track + '.webm'), log = path.join(dir, 'pass');
  const vp9 = ['-map', '[out]', '-c:v', 'libvpx-vp9', '-row-mt', '1', '-threads', '4', '-deadline', 'good', '-cpu-used', '2', '-g', String(fps * 4), '-crf', process.env.CRF || '44', '-b:v', (J.kbps || 900) + 'k', '-an'];
  const code = await ff(['-hide_banner', '-loglevel', 'error', '-y', ...ins, '-filter_complex', fc, ...vp9, '-pass', '1', '-passlogfile', log, '-f', 'null', '/dev/null']) || await ff(['-hide_banner', '-loglevel', 'error', '-y', ...ins, '-filter_complex', fc, ...vp9, '-pass', '2', '-passlogfile', log, name]);
  fs.copyFileSync(path.join(dir, 's0_' + num(0) + '.jpg'), path.join(RAW, 'maps', 'drone-' + track + '-poster.jpg'));
  fs.writeFileSync(path.join(RAW, 'maps', 'drone-' + track + '.json'), JSON.stringify({ fps, W, H, dur: +at.toFixed(2), shots: marks }));
  console.log(track, 'done', ((Date.now() - t0) / 1000).toFixed(0) + ' s', 'ffmpeg', code, fs.existsSync(name) ? (fs.statSync(name).size / 1024).toFixed(0) + ' KB' : '');
}
await browser.close(); server.close();
