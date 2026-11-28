// Slike osnutkov novih tovornjakov (tools/tovornjaki/osnutki.js) za vprašanja na strani Odločitve: za vsak osnutek kamera za avtom na pravi
// progi (avto povečan v kotu) in pogled iz salona zadaj desno; na koncu zbirna slika. Osnutki niso v igri: orodje naredi začasno kopijo
// index.html z dodano vrstico in jo na koncu izbriše.
//   node tools/tovornjaki/slike.mjs [--proga spa] [--t 9] [--out <mapa>] [tb1a tb1b …]
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame } from '../../tests/browser/lib.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2), flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const TRACK = flag('--proga', 'spa'), T = +flag('--t', '9'), OUT = path.resolve(flag('--out', path.join(ROOT, 'test-results', 'tovornjaki')));
// id, barva (indeks PLAYER_COLORS v dirki, ista barva v salonu)
const PAL = [0xd81f2a, 0xf5f5f0, 0x1c5fd6, 0xf2c230, 0x1a1a1f, 0x2fa84f, 0xff7a1a, 0x8e3bd6];
const ALL = [['tb1a', 2, '1 · BIVOL, dolgi nos'], ['tb1b', 6, '2 · BIVOL, kabina nad motorjem'], ['tb1c', 3, '3 · BIVOL, kamnolomski'], ['tbg', 0, 'Posebno vozilo · FENIKS, gasilsko'],
  ['tb2', 5, 'Mešalec betona · VRTINEC'], ['tb3', 7, 'Dolgonosi dirkalni vlačilec · VIHAR'], ['tb4', 1, 'Avtovleka · ŽERJAV']];
const pick = args.filter(a => !a.startsWith('--')), CARS = pick.length ? ALL.filter(c => pick.includes(c[0])) : ALL;
fs.mkdirSync(OUT, { recursive: true });
const png = (file, dataUrl) => fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));

const TMP = path.join(ROOT, 'index-osnutki.html');
fs.writeFileSync(TMP, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace('<script src="js/cars/titan.js"></script>', '<script src="js/cars/titan.js"></script>\n<script src="tools/tovornjaki/osnutki.js"></script>'));
const srv = await serve(ROOT);
const browser = await launch();
const tiles = [];
try {
  for (const [id, ci, label] of CARS) {
    const q = new URLSearchParams({ proga: TRACK, avto: id, tekmeci: '0', t: String(T) });
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index-osnutki.html?' + q, { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', color: ci, carV: 3, zoom: 1.2 }, { width: 960, height: 540 });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    const r = await page.evaluate(async ([id, col]) => {
      if (!Core.MODELS.find(m => m.id === id)) throw new Error(id + ': ' + JSON.stringify(Core.DEFS_SKIPPED));
      const g = window.__game, R = g.race, P = R.player, raf = () => new Promise(r => requestAnimationFrame(r));
      g.pause(); Render.resize(); Render.resetCam();
      for (let k = 0; k < 8; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }
      const c = Render.snapshot(P, 'chase', 1920), p = new THREE.Vector3(P.x, (P.y || 0) + 1.4, P.z).project(Render.camera), cx = (p.x * 0.5 + 0.5) * c.width, cy = (0.5 - p.y * 0.5) * c.height, w = c.width * 0.2, h = w * 9 / 16;
      const k1 = document.createElement('canvas'); k1.width = 960; k1.height = 540; const x = k1.getContext('2d'); x.drawImage(c, 0, 0, 960, 540);
      const s = 960 / c.width, W = 400, H = 225;
      x.drawImage(c, cx - w / 2, cy - h / 2, w, h, 960 - W - 6, 6, W, H); x.strokeStyle = '#ffd640'; x.lineWidth = 2; x.strokeRect(960 - W - 6, 6, W, H); x.strokeRect((cx - w / 2) * s, (cy - h / 2) * s, w * s, h * s);
      const st = Render.kitStatus ? Render.kitStatus(id) : '', info = Render.kitInfo ? Render.kitInfo(id) : null;
      g.onAction('to-title'); await new Promise(r => setTimeout(r, 250)); g.onAction('to-car'); await new Promise(r => setTimeout(r, 400));
      const r34 = Render.carShot({ id, color: col, view: '34r', w: 960, h: 540 }), f34 = Render.carShot({ id, color: col, view: '34f', w: 960, h: 540 });
      return { chase: k1.toDataURL('image/png'), r34: r34.toDataURL('image/png'), f34: f34.toDataURL('image/png'), name: P.m.name, st, tris: info && info.tris, car: P.m.id };
    }, [id, PAL[ci]]);
    tiles.push({ id, name: label, a: r.chase, b: r.r34, c: r.f34 });
    console.log(`${id} (${r.name}): car ${r.car}, kit ${r.st}, tris ${JSON.stringify(r.tris)}` + (errors.length ? ', errors: ' + errors.join(' | ') : ''));
    await ctx.close();
  }
  // za vsak osnutek ena slika: kamera za avtom, pod njo salon zadaj in spredaj
  const ctx = await browser.newContext({ viewport: { width: 800, height: 600 } }), page = await ctx.newPage();
  await page.goto(srv.base + '/maketa-menija/README.md').catch(() => {});
  for (const t of tiles) {
    const jpg = await page.evaluate(async (t) => {
      const c = document.createElement('canvas'); c.width = 960; c.height = 36 + 540 + 270; const x = c.getContext('2d'); x.fillStyle = '#0d1117'; x.fillRect(0, 0, c.width, c.height);
      const img = (src) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
      x.fillStyle = '#ffd640'; x.font = 'bold 24px sans-serif'; x.fillText(t.name, 10, 26);
      x.drawImage(await img(t.a), 0, 36, 960, 540); x.drawImage(await img(t.b), 0, 576, 480, 270); x.drawImage(await img(t.c), 480, 576, 480, 270);
      return c.toDataURL('image/jpeg', 0.84);
    }, t);
    png(path.join(OUT, t.id + '.jpg'), jpg);
  }
  await ctx.close();
} finally { await browser.close(); await srv.close(); fs.rmSync(TMP, { force: true }); }
console.log('slike: ' + OUT);
