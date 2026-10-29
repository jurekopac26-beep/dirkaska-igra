// Mockup only: the helicopter's flight over each track, the menu's intro before the race (drone_page.js 'heli', in the game's page, drawn
// by the game itself in virtual time): from high above the start (the menu's globe hands over to the first frame) down to a TV
// helicopter's height, then the whole run to the finish in one shot of 30 s, the land round the game's strip planted with the game's own
// trees and houses, the helicopter's shadow running ahead -> raw/heli/<track>/f_<frame>.jpg, then raw/maps/heli-<track>.webm, its
// poster and heli-<track>.json (the camera every frame and the point it looks at along the run: the globe's hand-over, the pins over the
// places and the height profile's dot follow it).
// Usage: node heli.mjs [vrsic,spa]   env PREVIEW=1 (a few frames only: prev/heli_<track>_<s>.jpg), REDO=1 (draw again), ENC=0 (no video),
// FRAMES=0,30,60 (only those frames, for a look). The races and their settings come from drones.json, the flight's from heli.json.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname), GAME = process.env.GAME || path.join(HERE, '..', 'game_vrsic'), RAW = path.join(HERE, 'raw');
const FF0 = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2', FF = process.env.FFMPEG || (fs.existsSync(FF0) ? FF0 : 'ffmpeg');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = p.startsWith('/__proto/') ? path.join(HERE, p.slice(9)) : path.join(GAME, p.endsWith('/') ? p + 'index.html' : p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const ONLY = process.argv[2] ? process.argv[2].split(',') : null, PREVIEW = !!process.env.PREVIEW, REDO = !!process.env.REDO;
const RACES = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(HERE, 'drones.json'), 'utf8')));
const HELI = fs.existsSync(path.join(HERE, 'heli.json')) ? JSON.parse(fs.readFileSync(path.join(HERE, 'heli.json'), 'utf8')) : {};
const ids = (ONLY || Object.keys(RACES).filter(t => !(HELI[t] && HELI[t].flight === false))).filter(t => RACES[t]);   // (heli.json "flight": false: a track without a flight, unless named)
const num = (k) => String(k).padStart(4, '0'), ff = (args) => new Promise((res) => spawn(FF, args, { stdio: 'inherit' }).on('close', res));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const track of ids) {
  const J = RACES[track], Hc = Object.assign({}, HELI.default || {}, HELI[track] || {}), W = Hc.W || 960, H = Hc.H || 640, fps = Hc.fps || 30, t0 = Date.now();
  const dir = path.join(RAW, 'heli', track); fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(path.join(RAW, 'maps'), { recursive: true });
  const go = Hc.go == null ? 1.2 : Hc.go, fly = Hc.fly || 30, hold = Hc.hold == null ? 1.5 : Hc.hold, dur = go + fly + hold, n = Math.round(dur * fps);
  const only = process.env.FRAMES ? process.env.FRAMES.split(',').map(Number) : null;
  const todo = PREVIEW ? [] : [...Array(n).keys()].filter(k => (!only || only.includes(k)) && (REDO || !fs.existsSync(path.join(dir, 'f_' + num(k) + '.jpg'))));
  const jsonF = path.join(RAW, 'maps', 'heli-' + track + '.json');
  if (PREVIEW || todo.length || !fs.existsSync(jsonF)) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('pageerror:', e.message));
    page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 200)); });
    const raw = JSON.stringify({ sound: 0, comm: 0, codrv: 0, camera: 'chase', zoom: 1.2, quality: 'high', shadows: process.env.SHADOWS === '0' ? 0 : 1, carV: 2, name: 'Player', track, car: J.car || 0, color: J.color || 0,
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
    await page.evaluate(() => clearInterval(window.__pump));
    // the game's own invented sponsors: the VOLTEX board (a real brand name) shows PIXEL GAS instead
    await page.evaluate(() => { try { const t = Tex.all().sponsors, c = t.image, x = c.getContext('2d'); x.drawImage(c, 0, 192, 256, 64, 0, 128, 256, 64); t.needsUpdate = true; } catch (e) { console.log('sponsor patch', e.message); } });
    if (J.mode === 'traffic') await page.evaluate(() => window.__game.onAction('start'));
    await page.addScriptTag({ url: '/__proto/drone_page.js' });
    if (process.env.CFG) await page.evaluate((c) => { window.DR_CFG = c; }, JSON.parse(process.env.CFG));
    const farP = path.join(RAW, 'geo', track + '-far.json'), far = Object.assign(fs.existsSync(farP) ? JSON.parse(fs.readFileSync(farP, 'utf8')) : { synth: true }, J.snow ? { snow: J.snow } : {});
    if (Hc.sea) far.sea = true;
    const lcF0 = 'raw/geo/' + track + '-far-lc.png';
    const info = await page.evaluate((o) => window.DR.setup(Object.assign(o, { theme: o.theme || (window.__game && (window.__game.race || window.__game.demo).track.def.theme) })), { mode: J.mode, fps, extra: J.extra || 0, far, lc: fs.existsSync(path.join(HERE, lcF0)) ? lcF0 : null, edgeTint: Hc.edgeTint ? Object.assign({ margin: 300 }, Hc.edgeTint === true ? {} : Hc.edgeTint) : null, feather: Hc.feather || 0 });
    // the flight: higher the faster it has to go (the whole run in `fly` s), behind the point it looks at by about as much as it is high
    const len = info.open ? info.raceLen : info.len, v = len / (fly - 3), Hh = Hc.Hh || Math.round(Math.min(950, Math.max(250, 1.6 * v + 150))), B = Hc.B || Math.round(1.05 * Hh);
    const S = Object.assign({ kind: 'heli', len, dur, go, fly, H: Hh, B, fov: 50, adur: 4.5, el0: 55 }, Hc.S || {});
    const hi = await page.evaluate((S) => window.DR.heliInfo(S), S);
    console.log(track, 'ready', JSON.stringify(info), 'heli', JSON.stringify({ len, v: +v.toFixed(1), H: Hh, B }), JSON.stringify(hi), ((Date.now() - t0) / 1000).toFixed(0) + ' s');
    const lcF = 'raw/geo/' + track + '-far-lc.png';
    if (Hc.plant !== false && fs.existsSync(path.join(HERE, lcF))) {
      const t1 = Date.now();
      const tiles = await page.evaluate(([S, R]) => window.DR.heliTiles(S, R, 1.5), [S, Hc.plantR || 3400]);
      const pi = await page.evaluate((o) => window.DR.plantLand(o), Object.assign({ lc: lcF, far: Object.assign({}, far, { h: undefined, lc: undefined }), tiles, houses: true }, Hc.plantO || {}));
      console.log(track, 'planted', JSON.stringify(pi), ((Date.now() - t1) / 1000).toFixed(0) + ' s');
    }
    if (process.env.EXPORT) { const K = await page.evaluate((w) => window.DR.exportKinds(w), process.env.EXPORT === '1' ? null : process.env.EXPORT.split(',').map(Number)); fs.writeFileSync(path.join(RAW, 'geo', 'kinds-' + track + '.json'), JSON.stringify(K)); console.log(track, 'kinds', Object.values(K).map(k => k.v + ':' + k.n + ' ' + JSON.stringify(k.sam.slice(0, 3))).join(' | ')); await ctx.close(); continue; }
    if (process.env.GH) { const [x0, z0, x1, z1, n] = process.env.GH.split(',').map(Number);
      console.log('GH', JSON.stringify(await page.evaluate(([x0, z0, x1, z1, n]) => { const W = Render.world, out = []; for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; out.push([Math.round(x), Math.round(z), +W.groundH(x, z).toFixed(1)]); }
        const wl = []; W.root.traverse(o => { if (o.isMesh && o.material && o.material.map && W.dyn && o.material.map === W.dyn.water) { const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld); wl.push([g.attributes.position.count, [bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z].map(v => Math.round(v * 10) / 10)]); } });
        return { line: out, water: wl }; }, [x0, z0, x1, z1, n])));
      await ctx.close(); continue; }
    if (process.env.COVERDBG) { const pts = process.env.PTS ? JSON.parse(process.env.PTS) : await page.evaluate(([S]) => { const out = []; for (const dd of [11400, 11800, 12100]) { const r = window.DR.road(dd); for (const off of [0, 150, 300, 600, 1000]) out.push([Math.round(r.x - r.hz * off), Math.round(r.z + r.hx * off)]); } return out; }, [S]);
      for (const e of await page.evaluate((p) => window.DR.coverDbg(p), pts)) console.log('cover', JSON.stringify(e)); }
    if (J.warm) await page.evaluate((s) => window.DR.run(s), J.warm);
    if (PREVIEW) {   // a look at a few moments of the flight
      const at = (process.env.AT ? process.env.AT.split(',').map(Number) : [0, 2.5, 5, 9, 14, 19, 24, 29, dur - 0.05]);
      for (const s of at) {
        const k = Math.min(n - 1, Math.round(s * fps)), t1 = Date.now();
        const url = await page.evaluate(([S, k, n]) => window.DR.frame(S, k, n), [S, k, n]);
        fs.writeFileSync(path.join(HERE, 'prev', 'heli_' + track + '_' + String(s).replace('.', '_') + (process.env.SUF || '') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
        console.log(track, 'preview', s, 's', ((Date.now() - t1) / 1000).toFixed(2) + ' s/frame');
        if (process.env.MASKDBG) console.log('mask', JSON.stringify(await page.evaluate(() => window.DR.maskDbg())));
        if (process.env.RAYS) for (const e of await page.evaluate((p) => window.DR.rayDbg(p), JSON.parse(process.env.RAYS))) console.log('ray', JSON.stringify(e));
        if (process.env.RAYALL) for (const e of await page.evaluate((p) => window.DR.rayAll(p), JSON.parse(process.env.RAYALL))) console.log('rayall', JSON.stringify(e));
        if (process.env.WHO) for (const e of await page.evaluate((p) => window.DR.coverWho(p), JSON.parse(process.env.WHO))) console.log('who', JSON.stringify(e));
        if (process.env.FEDBG) { const L = await page.evaluate(() => window.__feDbg || []); L.forEach((u, i) => fs.writeFileSync(path.join(HERE, 'prev', 'fedbg_' + track + '_' + i + (u.startsWith('data:image/png') ? '.png' : '.jpg')), Buffer.from(u.split(',')[1], 'base64'))); console.log('fedbg', L.length); }
        if (process.env.DEBUG) console.log('mip', JSON.stringify(await page.evaluate(() => window.__mipInfo)));
        if (process.env.DEBUG) console.log('dbg', JSON.stringify(await page.evaluate(() => window.DR.dbg && window.DR.dbg())));
      }
    } else {
      if (todo.length) {
        if (todo[0] > 0) await page.evaluate((s) => window.DR.run(s), todo[0] / fps);   // (going on from where it stopped: the race as far on)
        const t1 = Date.now(); let prevK = todo[0] - 1;
        for (const k of todo) {
          if (k - prevK > 1) await page.evaluate((s) => window.DR.run(s), (k - prevK - 1) / fps); prevK = k;
          const url = await page.evaluate(([S, k, n]) => window.DR.frame(S, k, n), [S, k, n]);
          fs.writeFileSync(path.join(dir, 'f_' + num(k) + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
          if (k % 30 === 0) console.log(track, 'frame', k, 'of', n, ((Date.now() - t1) / 1000 / (todo.indexOf(k) + 1)).toFixed(2) + ' s/frame');
        }
      }
      const P = await page.evaluate(([S, n]) => window.DR.heliPath(S, n), [S, n]);
      const na = Math.round(S.adur * fps);
      fs.writeFileSync(jsonF, JSON.stringify({ fps, W, H, dur: +dur.toFixed(2), n, go, fly, hold, fov: P.fov, Hh, B, vmax: P.vmax, len, open: info.open, cam: P.cam, d: P.d,
        arrive: { dur: S.adur, fps, fov: P.fov, cam: P.cam.slice(0, na).map(c => c.slice(0, 6)) } }));
    }
    await ctx.close();
  }
  if (PREVIEW || only || process.env.ENC === '0') continue;
  const name = path.join(RAW, 'maps', 'heli-' + track + '.webm'), log = path.join(dir, 'pass');
  const vp9 = ['-c:v', 'libvpx-vp9', '-row-mt', '1', '-threads', '4', '-deadline', 'good', '-cpu-used', '2', '-g', String(fps * 4), '-crf', process.env.CRF || Hc.crf || '40', '-b:v', (Hc.kbps || 1100) + 'k', '-pix_fmt', 'yuv420p', '-an'];
  const ins = ['-framerate', String(fps), '-i', path.join(dir, 'f_%04d.jpg')];
  const code = await ff(['-hide_banner', '-loglevel', 'error', '-y', ...ins, ...vp9, '-pass', '1', '-passlogfile', log, '-f', 'null', '/dev/null']) || await ff(['-hide_banner', '-loglevel', 'error', '-y', ...ins, ...vp9, '-pass', '2', '-passlogfile', log, name]);
  fs.copyFileSync(path.join(dir, 'f_0000.jpg'), path.join(RAW, 'maps', 'heli-' + track + '-poster.jpg'));
  console.log(track, 'done', ((Date.now() - t0) / 1000).toFixed(0) + ' s', 'ffmpeg', code, fs.existsSync(name) ? (fs.statSync(name).size / 1024).toFixed(0) + ' KB' : '');
}
await browser.close(); server.close();
