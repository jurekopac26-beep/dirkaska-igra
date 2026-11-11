// Ikona 2 · Svet brez avta: zaobljena (icon-512) in prilagojena za okrogle ikone (maskable, vsebina v varnem krogu).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { icon2 } = require('./ikone3.cjs');
const DIR = __dirname;
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 512, height: 512 } });
  for (const [f, svg] of [['2-brez.png', icon2('b', { car: false })], ['2-brez-maska.png', icon2('b', { car: false, fit: 0.76 })]]) {
    await pg.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await pg.screenshot({ path: path.join(DIR, f), clip: { x: 0, y: 0, width: 512, height: 512 } });
  }
  const img = (f) => `data:image/png;base64,${fs.readFileSync(path.join(DIR, f)).toString('base64')}`;
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;width:1080px;background:linear-gradient(#777c9e,#5d6283);font-family:'DejaVu Sans',Arial,sans-serif;color:#fff}
    h1{font-size:40px;margin:30px 36px 6px}p{margin:0 36px 16px;font-size:25px;opacity:.85}
    .g{display:flex;justify-content:space-around;padding:10px 20px 10px}.c{text-align:center}.t{font-size:26px;font-weight:700;margin-bottom:12px}
    .c img{width:340px;height:340px;display:block;margin:0 auto;box-shadow:0 6px 16px rgba(0,0,0,.28)}.l{font-size:28px;margin-top:12px}
    .s{display:flex;justify-content:center;gap:48px;align-items:flex-end;padding:24px 26px 34px;margin-top:14px;border-top:2px solid rgba(255,255,255,.25)}
    .s div{text-align:center;font-size:22px}.s img{display:block;margin:0 auto 6px}</style>
    <h1>2 · Svet brez avta</h1><p>Levo ikona z zaobljenimi robovi, desno telefon z okroglimi ikonami.</p>
    <div class="g"><div class="c"><div class="t">Zaobljena</div><img src="${img('2-brez.png')}" style="border-radius:27%"><div class="l">Roads Atlas</div></div>
    <div class="c"><div class="t">Okrogla</div><img src="${img('2-brez-maska.png')}" style="border-radius:50%"><div class="l">Roads Atlas</div></div></div>
    <div class="s">${[96, 64, 48].map((s) => `<div><img src="${img('2-brez.png')}" style="width:${s}px;height:${s}px;border-radius:27%">${s} px</div><div><img src="${img('2-brez-maska.png')}" style="width:${s}px;height:${s}px;border-radius:50%">${s} px</div>`).join('')}</div>`;
  const p = await b.newPage({ viewport: { width: 1080, height: 800 } }); await p.setContent(html);
  await p.screenshot({ path: path.join(DIR, 'pregled-svet-brez.jpg'), fullPage: true, type: 'jpeg', quality: 86 });
  await b.close(); console.log('ok', fs.statSync(path.join(DIR, 'pregled-svet-brez.jpg')).size);
})();
