// Pictures of how a vehicle's parts open: the whole, undamaged car in the showroom with every door, the bonnet and the boot wide open
// (Render.carShot's o.open), from six sides on one sheet: front left, rear right, the left side, the top, front right, rear left.
// --zaprto: the same views with everything shut (a »before« beside it); --deli hood=60,doorL=70: only those parts, by those angles.
//   node tools/odprto.mjs gams orel [--color 0x2f6fd6] [--zaprto] [--out dir]      -> test-results/odprto/<id>.png
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame } from '../tests/browser/lib.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const color = parseInt(flag('--color') || '0x2f6fd6'), OUT = path.resolve(flag('--out') || path.join(ROOT, 'test-results', 'odprto')), deli = flag('--deli'), tag = flag('--tag') || '', en = flag('--en');   // (--en px,py,pz,tx,ty,tz: one large picture from that camera, car frame)
const shut = args.includes('--zaprto'), ids = args.filter(a => !a.startsWith('--'));
if (!ids.length) { console.log('usage: node tools/odprto.mjs <id …> [--color 0xRRGGBB] [--zaprto] [--deli hood=60,…] [--out dir] [--tag ime]'); process.exit(2); }
const open = shut ? null : deli ? Object.fromEntries(deli.split(',').map(s => { const [k, v] = s.split('='); return [k, +v]; })) : true;

const srv = await serve(ROOT), browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1 }, { width: 960, height: 540 }, { seed: 11 });
  await page.evaluate(async () => { window.__game.onAction('to-car'); await new Promise(r => setTimeout(r, 400)); });
  fs.mkdirSync(OUT, { recursive: true });
  for (const id of ids) {
    if (en) { const q = en.split(',').map(Number), d1 = await page.evaluate(({ id, color, open, q }) => { const o = { id, color, w: 1280, h: 800, grid: false, cam: { p: q.slice(0, 3), t: q.slice(3, 6), fov: 30 } }; if (open) o.open = open; const s = Render.carShot(o); return s ? s.toDataURL('image/jpeg', 0.9) : null; }, { id, color, open, q });
      if (d1) { const f = path.join(OUT, id + '-en' + (tag ? '-' + tag : '') + '.jpg'); fs.writeFileSync(f, Buffer.from(d1.split(',')[1], 'base64')); console.log(f); } continue; }
    const data = await page.evaluate(async ({ id, color, open }) => {
      const M = Core.MODELS.find(m => m.id === id); if (!M) return null;
      const L = M.len, d = Math.max(L, 3.4) * 1.5, h = 0.55, tw = 640, th = 400;
      const cam = (sx, sz, up) => ({ p: [sx * d * 0.86, d * (up || 0.5), sz * d * 0.8], t: [0, h, 0], fov: 30 });
      const V = [['spredaj levo', { cam: cam(1, -1) }], ['zadaj desno', { cam: cam(-1, 1) }], ['leva stran', { cam: { p: [0, 1.0, -d * 1.25], t: [0, h, 0], fov: 30 } }],
        ['od zgoraj', { cam: { p: [0.01, d * 1.35, 0], t: [0, 0, 0], fov: 30 } }], ['spredaj desno', { cam: cam(1, 1) }], ['zadaj levo', { cam: cam(-1, -1) }]];
      const c = document.createElement('canvas'); c.width = tw * 3; c.height = (th + 20) * 2 + 28; const x = c.getContext('2d');
      x.fillStyle = '#0d1117'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#e8eef4'; x.font = 'bold 17px sans-serif';
      x.fillText((M.name || id) + (open ? ' · odprto: vsa vrata, hauba, prtljažnik (avto cel)' : ' · zaprto'), 8, 20);
      let parts = null;
      for (let i = 0; i < V.length; i++) {
        const o = Object.assign({ id, color, w: tw, h: th, grid: false }, V[i][1]); if (open) o.open = open;
        const s = Render.carShot(o); if (!s) return null;
        const cx = (i % 3) * tw, cy = 28 + Math.floor(i / 3) * (th + 20);
        x.drawImage(s, cx, cy + 20); x.fillStyle = '#9fb3c8'; x.font = '13px sans-serif'; x.fillText(V[i][0], cx + 6, cy + 14);
      }
      return c.toDataURL('image/jpeg', 0.88);
    }, { id, color, open });
    if (!data) { console.log('ni vozila: ' + id); continue; }
    const f = path.join(OUT, id + (shut ? '-zaprto' : '') + (tag ? '-' + tag : '') + '.jpg'); fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64')); console.log(f);
  }
  if (errors.length) console.log('napake:', errors.slice(0, 5));
} finally { await browser.close(); srv.close(); }
