// Slike novih avtov za drift (docs/novi-avti-2.md) za vprašanja na strani Odločitve: za vsak avto kamera za avtom na pravi progi (hiter
// vstop, avtopilot, t sekund dirke, avto povečan v kotu) in stranski pogled iz salona; na koncu zbirni sliki vseh (vsi.jpg, vsi-zadaj.jpg).
//   node tools/novi-avti-2/slike.mjs [--proga bathurst] [--t 9] [--out <mapa>] [ris vidra …]
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame } from '../../tests/browser/lib.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2), flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const TRACK = flag('--proga', 'bathurst'), T = +flag('--t', '9'), OUT = path.resolve(flag('--out', path.join(ROOT, 'test-results', 'novi-avti-2')));
// id, the paint (PLAYER_COLORS index in the race, the same colour in the showroom), the name on the picture
const PAL = [0xd81f2a, 0xf5f5f0, 0x1c5fd6, 0xf2c230, 0x1a1a1f, 0x2fa84f, 0xff7a1a, 0x8e3bd6];
const ALL = [['ris', 6], ['vidra', 1], ['kuna', 3], ['merjasec', 0], ['tur', 5], ['vran', 4]];
const pick = args.filter(a => !a.startsWith('--')), CARS = pick.length ? ALL.filter(c => pick.includes(c[0])) : ALL;
fs.mkdirSync(OUT, { recursive: true });

const png = (file, dataUrl) => fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));

const srv = await serve(ROOT);
const browser = await launch();
const tiles = [];
try {
  for (const [id, ci] of CARS) {
    const q = new URLSearchParams({ proga: TRACK, avto: id, tekmeci: '0', t: String(T) });
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?' + q, { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer', color: ci, carV: 3, zoom: 1.2 }, { width: 960, height: 540 });
    const warns = []; page.on('console', m => { if (m.type() === 'warning') warns.push(m.text()); });
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    const r = await page.evaluate(async ([id, col]) => {
      const g = window.__game, R = g.race, P = R.player, raf = () => new Promise(r => requestAnimationFrame(r));
      g.pause(); Render.resize(); Render.resetCam();
      for (let k = 0; k < 8; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }
      // the chase camera's whole frame as a phone sees it, the car magnified x2.6 in the top right corner (as tools/carshots.mjs)
      // (no start number disc and no spare wheel of the race's wheel rule, Render spareRoof, on the roof: the car as the showroom has it)
      const vw = Render.viewOf(P); if (vw && vw.dec) vw.dec.visible = false; if (vw && vw.spareM && vw.spareM.parent) vw.spareM.parent.remove(vw.spareM);
      const c = Render.snapshot(P, 'chase', 1920), p = new THREE.Vector3(P.x, (P.y || 0) + 0.7, P.z).project(Render.camera), cx = (p.x * 0.5 + 0.5) * c.width, cy = (0.5 - p.y * 0.5) * c.height, w = c.width * 0.13, h = w * 9 / 16;
      const k1 = document.createElement('canvas'); k1.width = 960; k1.height = 540; const x = k1.getContext('2d'); x.drawImage(c, 0, 0, 960, 540);
      const s = 960 / c.width, W = 400, H = 225;
      x.drawImage(c, cx - w / 2, cy - h / 2, w, h, 960 - W - 6, 6, W, H); x.strokeStyle = '#ffd640'; x.lineWidth = 2; x.strokeRect(960 - W - 6, 6, W, H); x.strokeRect((cx - w / 2) * s, (cy - h / 2) * s, w * s, h * s);
      const st = Render.kitStatus ? Render.kitStatus(id) : '', info = Render.kitInfo ? Render.kitInfo(id) : null;
      g.onAction('to-title'); await new Promise(r => setTimeout(r, 250)); g.onAction('to-car'); await new Promise(r => setTimeout(r, 400));
      const side = Render.carShot({ id, color: col, view: 'side', w: 960, h: 380, grid: false });
      const r34 = Render.carShot({ id, color: col, view: '34r', w: 960, h: 540 });
      return { chase: k1.toDataURL('image/png'), side: side.toDataURL('image/png'), r34: r34.toDataURL('image/png'), name: P.m.name, st, tris: info && info.tris, car: P.m.id, s: Math.round(P.q.s) };
    }, [id, PAL[ci]]);
    png(path.join(OUT, id + '-chase.png'), r.chase); png(path.join(OUT, id + '-side.png'), r.side); png(path.join(OUT, id + '-34r.png'), r.r34);
    tiles.push({ id, name: r.name, chase: r.chase, side: r.side, r34: r.r34 });
    console.log(`${id} (${r.name}): car ${r.car}, kit ${r.st}, tris ${JSON.stringify(r.tris)}, s ${r.s} m` + (errors.length ? ', errors: ' + errors.join(' | ') : '') + (warns.length ? ', warnings: ' + warns.slice(0, 3).join(' | ') : ''));
    await ctx.close();
  }
  // the sheet: each car a column pair (the chase camera over its side view), two cars a row; one JPEG for the question
  if (tiles.length > 1) {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 600 } }), page = await ctx.newPage();
    await page.goto(srv.base + '/maketa-menija/README.md').catch(() => {});
    const sheet = await page.evaluate(async (tiles) => {
      const cols = 2, tw = 640, ch = 360, sh = 254, lab = 30, rows = Math.ceil(tiles.length / cols), c = document.createElement('canvas');
      c.width = cols * tw + (cols - 1) * 8; c.height = rows * (lab + ch + sh + 10); const x = c.getContext('2d'); x.fillStyle = '#0d1117'; x.fillRect(0, 0, c.width, c.height);
      const img = (src) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i], cx = (i % cols) * (tw + 8), cy = Math.floor(i / cols) * (lab + ch + sh + 10);
        x.fillStyle = '#ffd640'; x.font = 'bold 22px sans-serif'; x.fillText((i + 1) + ' · ' + t.name, cx + 8, cy + 23);
        x.drawImage(await img(t.chase), cx, cy + lab, tw, ch); x.drawImage(await img(t.side), cx, cy + lab + ch, tw, sh);
      }
      return c.toDataURL('image/jpeg', 0.82);
    }, tiles);
    png(path.join(OUT, 'vsi.jpg'), sheet);
    const sheet2 = await page.evaluate(async (tiles) => {
      const cols = 3, tw = 480, th = 270, lab = 28, rows = Math.ceil(tiles.length / cols), c = document.createElement('canvas');
      c.width = cols * tw; c.height = rows * (lab + th); const x = c.getContext('2d'); x.fillStyle = '#0d1117'; x.fillRect(0, 0, c.width, c.height);
      const img = (src) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
      for (let i = 0; i < tiles.length; i++) { const t = tiles[i], cx = (i % cols) * tw, cy = Math.floor(i / cols) * (lab + th);
        x.fillStyle = '#ffd640'; x.font = 'bold 20px sans-serif'; x.fillText((i + 1) + ' · ' + t.name, cx + 8, cy + 21); x.drawImage(await img(t.r34), cx, cy + lab, tw, th); }
      return c.toDataURL('image/jpeg', 0.85);
    }, tiles);
    png(path.join(OUT, 'vsi-zadaj.jpg'), sheet2);
    await ctx.close();
  }
  console.log('wrote ' + path.relative(ROOT, OUT));
} finally {
  await browser.close(); srv.close();
}
