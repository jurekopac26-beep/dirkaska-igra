// The garage's parts (docs/deli.md): the plate the user confirms, from the real game (Render.carShot with car.deli). Per element: the stock
// part and three wider views (the race camera behind the car, the whole car), then its 16 options (4 pages x 4) with their names, prices
// and what they give (js/data/deli.js). Into test-results/deli/<car>-<elements>.jpg, 1600 px wide (one picture per sklop's step).
//   node tools/deli-plosca.mjs krilo,platisca,zarometi [--car kolibri] [--ns 1,6,11,16] [--title "…"] [--color 0x2f6fd6] [--compact] [--ask "…|…"]
// --compact: every element in two rows of nine small pictures (a whole sklop on one plate), --ask: questions for the user at its end
// The cameras (VIEWS, car frame in metres: x forward, y up, z right) are KOLIBRI's; on another car they are scaled by its length, height
// and width. A new element gets its close-up in VIEWS (else the whole car from the front or the rear three quarters, by REAR) and which
// options the top row shows in TOP. --ns 1,6,11,16: only those options (a row of 4 each: a smaller plate, e.g. a category of cars).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame } from '../tests/browser/lib.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const compact = args.includes('--compact') ? (args.splice(args.indexOf('--compact'), 1), true) : false, ask = (flag('--ask') || '').split('|').filter(Boolean);
const car = flag('--car') || 'kolibri', title = flag('--title'), color = parseInt(flag('--color') || '0x2f6fd6'), NS = (flag('--ns') || '').split(',').filter(Boolean).map(Number);
const els = (args[0] || '').split(',').filter(Boolean);
if (!els.length || NS.some(n => !(n >= 1 && n <= 16))) { console.log('usage: node tools/deli-plosca.mjs <element[,element …]> [--car kolibri] [--ns 1,6,11,16] [--title "…"] [--color 0xRRGGBB]'); process.exit(2); }

const VIEWS = {
  krilo: { p: [-4.35, 2.3, 2.45], t: [-0.95, 1.1, 0.08], fov: 32 },
  platisca: { p: [2.3, 0.5, 3.05], t: [1.15, 0.31, 0.62], fov: 17.5 },
  zarometi: { p: [3.55, 1.08, 1.75], t: [1.66, 0.67, 0.06], fov: 17 },
  chase: { p: [-6.0, 2.15, 0], t: [0.4, 1.02, 0], fov: 29 },   // (as the game's camera behind the car sees it)
  car34f: { p: [5.2, 2.2, 4.3], t: [0.05, 0.68, 0], fov: 21 },   // (the whole car, front three quarters)
  car34r: { p: [-5.2, 2.3, 4.3], t: [-0.05, 0.72, 0], fov: 21 },   // (the whole car, rear three quarters)
  // (sklop 3: barve, js/deli/barve.js; the hidden parts, js/deli/skriti.js, on the car drawn see-through: GHOST)
  crte: { p: [-3.7, 3.2, 3.7], t: [0.15, 0.75, 0], fov: 32 },
  stevilke: { p: [-4.0, 3.3, 3.8], t: [-0.25, 0.8, 0], fov: 30 },
  nalepke: { p: [3.9, 2.7, 4.3], t: [0.2, 0.7, 0], fov: 30 },
  soncni_pas: { p: [4.3, 2.0, 1.3], t: [0.25, 1.15, 0], fov: 18 },
  celjusti: { p: [1.8, 0.42, 2.25], t: [1.15, 0.31, 0.64], fov: 15 },
  gume: { p: [2.3, 0.55, 3.05], t: [1.15, 0.3, 0.62], fov: 20 },
  luc_pod_avtom: { p: [3.4, 1.0, 4.4], t: [0, 0.2, 0], fov: 36 },
  zatemnitev: { p: [-4.6, 1.9, 3.4], t: [-0.3, 0.95, 0], fov: 26 },
  bay: { p: [3.3, 2.5, 2.3], t: [1.12, 0.48, 0], fov: 26 },
  arches: { p: [2.4, 2.2, 3.6], t: [0, 0.42, 0], fov: 36 },
  hupa: { p: [3.4, 1.1, 1.7], t: [1.55, 0.33, 0.12], fov: 22 },
  dim_gum: { p: [-2.4, 1.2, 3.0], t: [-1.18, 0.3, 0.45], fov: 22 },
};
const GHOST = { filter_zraka: 'bay', cip: 'bay', turbo: 'bay', akumulator: 'bay', vzmeti: 'arches', amortizerji: 'arches', stabilizatorji: 'arches', hupa: 'hupa', dim_gum: 'dim_gum' };
const REAR = ['krilo', 'zadnje_luci', 'auspuh', 'prtljaznik', 'vlecne_kljuke', 'lovilci_blata', 'zaluzije'];
const TOP = { krilo: { view: 'chase', ns: [5, 10, 16] }, crte: { view: 'chase', ns: [3, 11, 14] }, stevilke: { view: 'chase', ns: [4, 9, 16] }, nalepke: { view: 'car34f', ns: [9, 13, 14] },
  luc_pod_avtom: { view: 'chase', ns: [5, 11, 16] }, barva: { view: 'car34f', ns: [5, 10, 14] } };   // (else the whole car, options 4, 9, 16)
const TW = 400, TH = 236;

const srv = await serve(ROOT), browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, carDet: 'high' }, { width: 960, height: 540 }, { seed: 11 });
  await page.evaluate(async () => { window.__game.onAction('to-car'); await new Promise(r => setTimeout(r, 400)); });   // (the showroom exists)
  const M = await page.evaluate((id) => { const m = Core.MODELS.find(m => m.id === id); return m && { len: m.len, wid: m.wid, ht: Render.kitInfo(id) ? Render.kitInfo(id).bbox.max[1] : 1.4, mounts: Object.keys((m.def && m.def.mounts) || {}) }; }, car);
  if (!M) throw new Error('no such vehicle: ' + car);
  const K = { len: 3.7, wid: 1.65, ht: 1.36 }, sc = (v) => [v[0] * M.len / K.len, v[1] * M.ht / K.ht, v[2] * M.wid / K.wid];   // (KOLIBRI's size: its cameras on another car)
  const cam = (el) => { const v = VIEWS[GHOST[el] || el] || VIEWS[REAR.includes(el) ? 'car34r' : 'car34f']; return { p: sc(v.p), t: sc(v.t), fov: v.fov }; };
  const shot = (view, deli) => page.evaluate(({ car, color, c, deli, ghost }) => {
    const s = Render.carShot({ id: car, deli, color, cam: c, w: 800, h: 472, grid: false, ghost });
    const o = document.createElement('canvas'); o.width = 400; o.height = 236; const x = o.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(s, 0, 0, 400, 236);
    return o.toDataURL('image/jpeg', 0.9);
  }, { car, color, c: cam(view), deli, ghost: GHOST[view] ? [view, deli ? deli[view] || 0 : 0] : null });
  const DATA = await page.evaluate(() => DELI.DATA.elementi), sections = [];
  for (const el of els) {
    const E = DATA.find(e => e.id === el); if (!E) throw new Error('no such element: ' + el);
    if (!M.mounts.includes(el)) { console.log(car + ' has no mount for ' + el + ' (mounts: ' + M.mounts.join(', ') + ')'); continue; }
    const all = E.kategorije.flatMap(k => k.moznosti), T = TOP[el] || (GHOST[el] ? { view: el, ns: [4, 9, 16] } : { view: REAR.includes(el) ? 'car34r' : 'car34f', ns: [4, 9, 16] }), wide = T.view === 'chase' ? 'kamera za avtom' : GHOST[T.view] ? 'skozi karoserijo' : 'cel avto';
    const top = [{ src: await shot(el, null), name: 'SERIJSKO' + (car === 'kolibri' && E.serijsko && E.serijsko.ime ? ' · ' + E.serijsko.ime : '') }];   // (the list's stock name is KOLIBRI's)
    if (!compact) for (const n of T.ns) top.push({ src: await shot(T.view, { [el]: n }), name: n + '. ' + all[n - 1].ime + ' · ' + wide });
    else if (T.view !== el) top.push({ src: await shot(T.view, { [el]: T.ns[2] }), name: T.ns[2] + '. ' + wide });   // (--compact: one wider view)
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
  // --compact: every element in two rows of nine small pictures (the stock part and a wider view framed, then its 16 options), the
  // questions (--ask "…|…") at the end: one plate for a whole sklop
  const data = compact ? await page.evaluate(async ({ sections, head, ask }) => {
    const N = 9, W = 1600, tw = Math.floor(W / N), th = Math.round(tw * 0.59), HEAD = 70, ST = 34, secH = ST + 2 * (th + 4) + 10, QH = ask.length ? 46 + ask.length * 30 : 0;
    const c = document.createElement('canvas'); c.width = W; c.height = HEAD + sections.length * secH + QH; const x = c.getContext('2d');
    x.fillStyle = '#0d1117'; x.fillRect(0, 0, W, c.height);
    for (let i = 0; i < W; i += 40) { x.fillStyle = (i / 40) % 2 ? '#e8e8e4' : '#d23a2f'; x.fillRect(i, 0, 40, 8); }
    x.fillStyle = '#ffd34d'; x.font = 'bold 28px sans-serif'; x.fillText(head, 14, 42);
    x.fillStyle = '#9fb3c8'; x.font = '15px sans-serif'; x.fillText('Iz prave igre (car.deli) · Visoki detajli · rumen okvir: serijsko, moder: širši pogled · 1–16 od najcenejše do najdražje', 14, 62);
    const img = (src) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
    let y = HEAD;
    for (let si = 0; si < sections.length; si++) { const S = sections[si], tiles = S.top.concat(S.opts);
      x.fillStyle = '#1b2533'; x.fillRect(0, y, W, ST - 6); x.fillStyle = '#ffd34d'; x.font = 'bold 19px sans-serif'; x.fillText((si + 1) + ' · ' + S.title, 10, y + 21);
      x.fillStyle = '#9fb3c8'; x.font = '13px sans-serif'; x.textAlign = 'right'; x.fillText(S.id, W - 10, y + 20); x.textAlign = 'left';
      for (let k = 0; k < tiles.length && k < 2 * N; k++) { const t = tiles[k], cx = (k % N) * tw, cy = y + ST + Math.floor(k / N) * (th + 4);
        x.drawImage(await img(t.src), cx + 1, cy, tw - 2, th);
        const g = x.createLinearGradient(0, cy, 0, cy + 30); g.addColorStop(0, 'rgba(8,12,18,0.92)'); g.addColorStop(1, 'rgba(8,12,18,0)'); x.fillStyle = g; x.fillRect(cx + 1, cy, tw - 2, 30);
        x.fillStyle = '#fff'; x.font = 'bold 12px sans-serif'; x.fillText(t.name.length > 26 ? t.name.slice(0, 25) + '…' : t.name, cx + 5, cy + 14);
        if (k < S.top.length) { x.strokeStyle = k ? '#7fb2ff' : '#ffd34d'; x.lineWidth = 2; x.strokeRect(cx + 2, cy + 1, tw - 4, th - 2); } }
      y += secH; }
    if (ask.length) { x.fillStyle = '#2a2140'; x.fillRect(0, y, W, QH); x.fillStyle = '#ffd34d'; x.font = 'bold 22px sans-serif'; x.fillText('VPRAŠANJA', 12, y + 30);
      x.fillStyle = '#fff'; x.font = '17px sans-serif'; ask.forEach((q, i) => x.fillText(q, 14, y + 58 + i * 30)); }
    return c.toDataURL('image/jpeg', 0.88);
  }, { sections, head: title || car.toUpperCase() + ' · ' + sections.length + ' elementov', ask }) : await page.evaluate(async ({ sections, TW, TH, head }) => {
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
  const out = path.join(ROOT, 'test-results', 'deli', car + '-' + (compact ? 'plosca-' + sections.length : sections.map(s => s.id).join('-')) + '.jpg');
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  console.log('wrote ' + path.relative(ROOT, out));
  if (errors.length) { console.log('page errors:'); for (const e of errors.slice(0, 10)) console.log('  ' + e); process.exitCode = 1; }
} finally {
  await browser.close(); await srv.close();
}
