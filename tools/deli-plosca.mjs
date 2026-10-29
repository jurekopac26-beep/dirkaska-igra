// The garage's parts (docs/deli.md): the plate the user confirms, from the real game (Render.carShot with car.deli). Per element: the stock
// part and three wider views (the race camera behind the car, the whole car), then its 16 options (4 pages x 4) with their names, prices
// and what they give (js/data/deli.js). Into test-results/deli/<car>-<elements>.jpg, 1600 px wide (one picture per sklop's step).
//   node tools/deli-plosca.mjs krilo,platisca,zarometi [--car kolibri] [--ns 1,6,11,16] [--title "…"] [--color 0x2f6fd6]
// The cameras (VIEWS, car frame in metres: x forward, y up, z right) are KOLIBRI's; on another car they are scaled by its length, height
// and width. A new element gets its close-up in VIEWS (else the whole car from the front or the rear three quarters, by REAR) and which
// options the top row shows in TOP. --ns 1,6,11,16: only those options (a row of 4 each: a smaller plate, e.g. a category of cars).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame } from '../tests/browser/lib.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const car = flag('--car') || 'kolibri', title = flag('--title'), color = parseInt(flag('--color') || '0x2f6fd6'), NS = (flag('--ns') || '').split(',').filter(Boolean).map(Number);
const els = (args[0] || '').split(',').filter(Boolean);
if (!els.length || NS.some(n => !(n >= 1 && n <= 16))) { console.log('usage: node tools/deli-plosca.mjs <element[,element …]> [--car kolibri] [--ns 1,6,11,16] [--title "…"] [--color 0xRRGGBB]'); process.exit(2); }

const VIEWS = {
  krilo: { p: [-4.35, 2.3, 2.45], t: [-0.95, 1.1, 0.08], fov: 32 },
  platisca: { p: [2.3, 0.5, 3.05], t: [1.15, 0.31, 0.62], fov: 17.5 },
  zarometi: { p: [3.55, 1.08, 1.75], t: [1.66, 0.67, 0.06], fov: 17 },
  aero: { p: [4.0, 0.75, 3.4], t: [0.45, 0.33, 0.3], fov: 31 },
  aeroR: { p: [-4.3, 0.85, 3.5], t: [-0.55, 0.34, 0.1], fov: 30 },   // (the rear's foot: the diffuser, the rear's lips)   // (the front's foot and the side's: the lip, the skirt, the flares)
  hauba: { p: [4.1, 2.75, 2.1], t: [1.2, 0.86, 0], fov: 27 },
  maska: { p: [3.8, 0.9, 0.75], t: [1.68, 0.68, 0], fov: 21 },
  zmigavci: { p: [3.5, 0.85, 1.75], t: [1.4, 0.56, 0.5], fov: 24 },   // (the front's indicator and the fender's repeater)
  relijske_luci: { p: [4.4, 1.8, 2.6], t: [0.95, 0.85, 0], fov: 27 },   // (the bumper, the nose, the roof's front edge)
  chase: { p: [-6.0, 2.15, 0], t: [0.4, 1.02, 0], fov: 29 },   // (as the game's camera behind the car sees it)
  car34f: { p: [5.2, 2.2, 4.3], t: [0.05, 0.68, 0], fov: 21 },   // (the whole car, front three quarters)
  car34r: { p: [-5.2, 2.3, 4.3], t: [-0.05, 0.72, 0], fov: 21 },   // (the whole car, rear three quarters)
};
const REAR = ['krilo', 'zadnje_luci', 'auspuh', 'prtljaznik', 'vlecne_kljuke', 'lovilci_blata', 'zaluzije'];
const TOP = { krilo: { view: 'chase', ns: [5, 10, 16] }, aero: { view: 'aeroR', ns: [4, 10, 16] } };   // (else the whole car, options 4, 9, 16)
const TW = 400, TH = 236;

const srv = await serve(ROOT), browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, carDet: 'high' }, { width: 960, height: 540 }, { seed: 11 });
  await page.evaluate(async () => { window.__game.onAction('to-car'); await new Promise(r => setTimeout(r, 400)); });   // (the showroom exists)
  const M = await page.evaluate((id) => { const m = Core.MODELS.find(m => m.id === id); return m && { len: m.len, wid: m.wid, ht: Render.kitInfo(id) ? Render.kitInfo(id).bbox.max[1] : 1.4, mounts: Object.keys((m.def && m.def.mounts) || {}) }; }, car);
  if (!M) throw new Error('no such vehicle: ' + car);
  const K = { len: 3.7, wid: 1.65, ht: 1.36 }, sc = (v) => [v[0] * M.len / K.len, v[1] * M.ht / K.ht, v[2] * M.wid / K.wid];   // (KOLIBRI's size: its cameras on another car)
  const cam = (el) => { const v = VIEWS[el] || VIEWS[REAR.includes(el) ? 'car34r' : 'car34f']; return { p: sc(v.p), t: sc(v.t), fov: v.fov }; };
  const shot = (view, deli) => page.evaluate(({ car, color, c, deli }) => {
    const s = Render.carShot({ id: car, deli, color, cam: c, w: 800, h: 472, grid: false });
    const o = document.createElement('canvas'); o.width = 400; o.height = 236; const x = o.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(s, 0, 0, 400, 236);
    return o.toDataURL('image/jpeg', 0.9);
  }, { car, color, c: cam(view), deli });
  const DATA = await page.evaluate(() => DELI.DATA.elementi), sections = [];
  for (const el of els) {
    const E = DATA.find(e => e.id === el); if (!E) throw new Error('no such element: ' + el);
    if (!M.mounts.includes(el)) { console.log(car + ' has no mount for ' + el + ' (mounts: ' + M.mounts.join(', ') + ')'); continue; }
    const all = E.kategorije.flatMap(k => k.moznosti), T = TOP[el] || { view: REAR.includes(el) ? 'car34r' : 'car34f', ns: [4, 9, 16] }, wide = T.view === 'chase' ? 'kamera za avtom' : 'cel avto';
    const top = [{ src: await shot(el, null), name: 'SERIJSKO' + (car === 'kolibri' && E.serijsko && E.serijsko.ime ? ' · ' + E.serijsko.ime : '') }];   // (the list's stock name is KOLIBRI's)
    for (const n of T.ns) top.push({ src: await shot(T.view, { [el]: n }), name: n + '. ' + all[n - 1].ime + ' · ' + wide });
    const opts = [];
    for (const n of NS.length ? NS : all.map((m, i) => i + 1)) {
      const built = await page.evaluate(({ car, el, n }) => Render.kitInfo(car, { [el]: n }).deli, { car, el, n });
      if (built !== el + n) console.log(el + ' ' + n + ': not built (' + built + ')');
      const m = all[n - 1]; opts.push({ src: await shot(el, { [el]: n }), name: n + '. ' + m.ime, price: m.cena_eur.toLocaleString('de-DE') + ' €', stat: m.kaj_nudi });
    }
    sections.push({ title: E.element.toUpperCase(), id: el, top, opts, cats: NS.length ? null : E.kategorije.map(k => k.ime), pages: Math.ceil(opts.length / 4) });
    console.log(el + ': done');
  }
  if (!sections.length) throw new Error('nothing to draw');
  const head = title || car.toUpperCase() + ' · ' + sections.map(s => s.title.toLowerCase()).join(', ');
  const data = await page.evaluate(async ({ sections, TW, TH, head }) => {
    const W = 4 * TW, HEAD = 78, ST = 46, RH = 30, GAP = 8, secH = (S) => ST + TH + GAP + S.pages * (RH + TH + 4) + 18, H = HEAD + sections.reduce((a, S) => a + secH(S), 0);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#0d1117'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < W; i += 40) { x.fillStyle = (i / 40) % 2 ? '#e8e8e4' : '#d23a2f'; x.fillRect(i, 0, 40, 8); }
    x.fillStyle = '#ffd34d'; x.font = 'bold 30px sans-serif'; x.fillText(head, 16, 44);
    x.fillStyle = '#9fb3c8'; x.font = '16px sans-serif'; x.fillText('Iz prave igre (js/deli.js, car.deli) · Visoki detajli · ' + (sections[0].cats ? '16 možnosti: 4 strani × 4, od najcenejše do najdražje' : 'izbor možnosti (od najcenejše do najdražje)'), 16, 68);
    const img = (src) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
    const tile = async (t, cx, cy) => {
      x.drawImage(await img(t.src), cx + 2, cy, TW - 4, TH);
      const g = x.createLinearGradient(0, cy, 0, cy + 58); g.addColorStop(0, 'rgba(8,12,18,0.9)'); g.addColorStop(0.62, 'rgba(8,12,18,0.72)'); g.addColorStop(1, 'rgba(8,12,18,0)');
      x.fillStyle = g; x.fillRect(cx + 2, cy, TW - 4, 58);
      x.fillStyle = '#ffffff'; x.font = 'bold 16px sans-serif'; x.fillText(t.name, cx + 10, cy + 19);
      if (t.price) { x.fillStyle = '#ffd34d'; x.textAlign = 'right'; x.fillText(t.price, cx + TW - 10, cy + 19); x.textAlign = 'left'; }
      if (t.stat) { x.fillStyle = '#e8f1fa'; x.font = '14px sans-serif'; x.fillText(t.stat, cx + 10, cy + 38); }
    };
    let y = HEAD;
    for (let si = 0; si < sections.length; si++) {
      const S = sections[si];
      x.fillStyle = '#1b2533'; x.fillRect(0, y, W, ST - 8);
      x.fillStyle = '#ffd34d'; x.font = 'bold 24px sans-serif'; x.fillText((si + 1) + ' · ' + S.title, 14, y + 28);
      x.fillStyle = '#9fb3c8'; x.font = '15px sans-serif'; x.textAlign = 'right'; x.fillText('element »' + S.id + '«', W - 14, y + 26); x.textAlign = 'left';
      let yy = y + ST;
      for (let i = 0; i < 4; i++) await tile(S.top[i], i * TW, yy);
      x.strokeStyle = '#ffd34d'; x.lineWidth = 3; x.strokeRect(3, yy + 1, TW - 6, TH - 2);   // (the stock part framed)
      yy += TH + GAP;
      for (let r = 0; r < S.pages; r++) {
        x.fillStyle = '#7fb2ff'; x.font = 'bold 18px sans-serif'; x.fillText(S.cats ? (r + 1) + '. stran · ' + S.cats[r] : 'izbor možnosti', 12, yy + 22);
        yy += RH;
        for (let k = 0; k < 4 && S.opts[r * 4 + k]; k++) await tile(S.opts[r * 4 + k], k * TW, yy);
        yy += TH + 4;
      }
      y += secH(S);
    }
    return c.toDataURL('image/jpeg', 0.88);
  }, { sections, TW, TH, head });
  const out = path.join(ROOT, 'test-results', 'deli', car + '-' + sections.map(s => s.id).join('-') + '.jpg');
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  console.log('wrote ' + path.relative(ROOT, out));
  if (errors.length) { console.log('page errors:'); for (const e of errors.slice(0, 10)) console.log('  ' + e); process.exitCode = 1; }
} finally {
  await browser.close(); await srv.close();
}
