// Sestavi 12 slik predlogov (ena slika na predlog, pokončna za telefon): naslov, 4 sličice (od blizu; zaslišijo avto; tečejo; ko pelješ mimo)
// z lupo (povečava skupine iz iste kamere za avtom) in puščicami poti, spodaj kratek opis. node sestavi.mjs [ime,…]
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { chromium } from 'playwright';

const DIR = path.dirname(url.fileURLToPath(import.meta.url)), REPO = path.resolve(DIR, '..', '..'), OUT = path.join(REPO, 'test-results', 'ljudje', 'izris'), FIN = path.join(REPO, 'test-results', 'ljudje');
fs.mkdirSync(FIN, { recursive: true });
const P = JSON.parse(fs.readFileSync(DIR + '/besedila.json', 'utf8'));
const only = process.argv[2] ? process.argv[2].split(',') : Object.keys(P);
const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function panel(name, ph, label, n) {
  const W = 1080, H = 608, main = `${OUT}/${name}-${ph}.png`, js = `${OUT}/${name}-${ph}.json`;
  const meta = fs.existsSync(js) ? JSON.parse(fs.readFileSync(js, 'utf8')) : { pts: [] };
  let svg = '', inset = '', chipSide = 'left';
  if (ph !== 'blizu' && meta.zoom && fs.existsSync(`${OUT}/${name}-${ph}-zoom.png`)) {
    const pts = meta.pts || [], f = pts[pts.length - 1] || [0.5, 0.5], fx = f[0] * W, fy = f[1] * H;
    const k = Math.tan(meta.zoom.fov * Math.PI / 360) / Math.tan(meta.zoom.fovMain * Math.PI / 360), rw = W * k, rh = H * k;
    // the magnifier in the corner farthest from the group
    const iw = 470, ih = Math.round(iw * H / W), corners = [[14, 14], [W - iw - 14, 14], [14, H - ih - 14], [W - iw - 14, H - ih - 14]];
    let best = corners[0], bd = -1; for (const c of corners) { const d = Math.hypot(c[0] + iw / 2 - fx, c[1] + ih / 2 - fy); if (d > bd) { bd = d; best = c; } }
    const [ix, iy] = best; chipSide = ix < W / 2 && iy < H / 2 ? 'right' : 'left';
    const cx = Math.max(rw / 2, Math.min(W - rw / 2, fx)), cy = Math.max(rh / 2, Math.min(H - rh / 2, fy));
    svg += `<rect x="${cx - rw / 2}" y="${cy - rh / 2}" width="${rw}" height="${rh}" rx="6" fill="none" stroke="#ffd23a" stroke-width="4"/>`;
    const ex = ix + (ix < cx ? iw : 0), ey = iy + (iy < cy ? ih : 0), sx = cx + (ix < cx ? -rw / 2 : rw / 2), sy = cy + (iy < cy ? -rh / 2 : rh / 2);
    svg += `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#ffd23a" stroke-width="3" stroke-dasharray="8 6"/>`;
    // the paths to the fence: white dashed arrows in the magnifier (its own projection; start, end pairs; the last point is the group's centre)
    let asvg = ''; const zp = meta.zoom.pts || [];
    if ((ph === 'zacetek' || ph === 'bliza') && zp.length > 2) for (let i = 0; i + 1 < zp.length - 1; i += 2) {
      const [x0, y0] = [zp[i][0] * iw, zp[i][1] * ih], [x1, y1] = [zp[i + 1][0] * iw, zp[i + 1][1] * ih], a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0); if (L < 10) continue;
      const hx = x1 - Math.cos(a) * 3, hy = y1 - Math.sin(a) * 3, h1 = [hx - Math.cos(a - 0.5) * 13, hy - Math.sin(a - 0.5) * 13], h2 = [hx - Math.cos(a + 0.5) * 13, hy - Math.sin(a + 0.5) * 13];
      asvg += `<line x1="${x0}" y1="${y0}" x2="${hx}" y2="${hy}" stroke="#111" stroke-width="6" stroke-linecap="round"/><line x1="${x0}" y1="${y0}" x2="${hx}" y2="${hy}" stroke="#fff" stroke-width="3" stroke-dasharray="7 5" stroke-linecap="round"/>`;
      asvg += `<polygon points="${x1},${y1} ${h1[0]},${h1[1]} ${h2[0]},${h2[1]}" fill="#fff" stroke="#111" stroke-width="2"/>`;
    }
    inset = `<div class="inset" style="left:${ix}px;top:${iy}px;width:${iw}px;height:${ih}px"><img src="${b64(`${OUT}/${name}-${ph}-zoom.png`)}"><svg width="${iw}" height="${ih}" style="position:absolute;left:0;top:0">${asvg}</svg><span>lupa</span></div>`;
  }
  return `<div class="panel"><img class="main" src="${b64(main)}"><svg width="${W}" height="${H}">${svg}</svg>${inset}<div class="chip ${chipSide}"><b>${n}</b> ${esc(label)}</div></div>`;
}

const css = `body{margin:0;background:#0e1319;font-family:'DejaVu Sans',Arial,sans-serif;color:#eef2f6;width:1080px}
.head{padding:26px 28px 18px;background:linear-gradient(90deg,#173a5e,#0e1319)}
.num{display:inline-block;background:#ffd23a;color:#111;font-weight:800;font-size:44px;border-radius:12px;padding:2px 18px;margin-right:16px;vertical-align:middle}
.title{display:inline;font-size:46px;font-weight:800;vertical-align:middle}
.sub{margin-top:10px;font-size:27px;color:#b9c8d8}
.panel{position:relative;width:1080px;height:608px;margin-top:10px;overflow:hidden}
.panel .main{position:absolute;left:0;top:0;width:1080px;height:608px}
.panel svg{position:absolute;left:0;top:0}
.inset{position:absolute;border:4px solid #ffd23a;border-radius:10px;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.6)}
.inset img{width:100%;height:100%;display:block}
.inset span{position:absolute;left:8px;top:6px;background:#ffd23a;color:#111;font-size:19px;font-weight:700;padding:1px 8px;border-radius:6px}
.chip{position:absolute;top:14px;background:rgba(10,14,20,.82);color:#fff;font-size:27px;padding:7px 14px;border-radius:10px;max-width:560px;line-height:1.25}
.chip.left{left:14px}.chip.right{right:14px}
.chip b{background:#ffd23a;color:#111;border-radius:6px;padding:0 9px;margin-right:6px}
.txt{padding:18px 28px 26px;font-size:26px;line-height:1.38}
.txt p{margin:0 0 10px}
.txt .k{color:#ffd23a;font-weight:700}
.foot{padding:12px 28px 22px;font-size:21px;color:#8fa3b8;border-top:1px solid #243140}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1200 }, deviceScaleFactor: 1 });
for (const name of only) {
  const p = P[name]; if (!p) continue;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="head"><span class="num">${p.n}</span><span class="title">${esc(p.title)}</span><div class="sub">${esc(p.sub)}</div></div>
${panel(name, 'blizu', p.f[0], 1)}${panel(name, 'zacetek', p.f[1], 2)}${panel(name, 'bliza', p.f[2], 3)}${panel(name, 'mimo', p.f[3], 4)}
<div class="txt">${p.t.map(([k, v]) => `<p><span class="k">${esc(k)}:</span> ${esc(v)}</p>`).join('')}</div>
<div class="foot">${esc(p.foot)}</div></body></html>`;
  await page.setContent(html, { waitUntil: 'load' });
  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 1080, height: h });
  await page.screenshot({ path: `${FIN}/predlog-${String(p.n).padStart(2, '0')}-${name}.jpg`, type: 'jpeg', quality: 86, fullPage: true });
  console.log('ok', name, h);
}
await browser.close();
