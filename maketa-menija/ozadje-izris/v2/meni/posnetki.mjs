// Makete menija z ozadji v2: naslovni zaslon igre (nov meni, js/menu.js) z ozadjem v2 namesto prizora igre, ki je danes
// za prosojnim naslovom (#s-title). Igra ostane nespremenjena: slog se doda samo v brskalniku za posnetek.
// Zagon: GAME_ROOT=<mapa igre z node_modules> node maketa-menija/ozadje-izris/v2/meni/posnetki.mjs <mapa za png>
//   GAME_ROOT: kopija igre (npr. izvoz main), ki ima tests/browser/lib.mjs in node_modules s playwright; privzeto ta repozitorij.
// Posnetki (telefon 412 × 915 pokonci in 915 × 412 ležeče, deviceScaleFactor 2):
//   meni-zdaj-<pogled>.png      današnji meni (prizor igre za naslovom)
//   kot-je-<v>-<pogled>.png     slika v2 kot je, čez cel zaslon (cover): plošča menija pokrije avto in tablo
//   meni-<v>-<pogled>.png       postavljeno za meni: pokonci slika v2 čez vso širino zgoraj, kolesa avta tik nad ploščo;
//                               ležeče izris z lastnim kadrom (prizor medvode-<v>-meni: avto in tabla levo od plošče)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '..');
const LIB = process.env.GAME_ROOT ? path.join(path.resolve(process.env.GAME_ROOT), 'tests/browser/lib.mjs') : path.resolve(HERE, '../../../../tests/browser/lib.mjs');
const { serve, launch, openGame } = await import(url.pathToFileURL(LIB).href);
const OUT = path.resolve(process.argv[2] || HERE);
fs.mkdirSync(OUT, { recursive: true });

const VARIANTS = ['1-alpe', '2-hribi', '3-vecer'];
const VIEWS = [['pokonci', { width: 412, height: 915 }], ['lezece', { width: 915, height: 412 }]];
const CAR_BOTTOM = 0.71;   // pokonci: kolesa avta na tem deležu višine slike v2 (1080 × 1350)
const dataUrl = (f) => 'data:image/webp;base64,' + fs.readFileSync(f).toString('base64');

// the background of #s-title: 'cover' over the whole screen, or 'top' (full width at the top, the car's wheels 12 px above the menu's panel,
// under it the colour of the picture's bottom edge, hidden by the panel)
async function background(page, src, mode) {
  await page.evaluate(async ([src, mode, carBottom]) => {
    const img = new Image(); img.src = src; await img.decode();
    const root = document.getElementById('menu-host').shadowRoot, t = root.querySelector('#s-title');
    let css = `#s-title { background: #0b1018 url("${src}") 50% 50% / cover no-repeat !important; }`;
    if (mode === 'top') {
      const tr = t.getBoundingClientRect(), pn = t.querySelector('.title-panel').getBoundingClientRect();
      const h = tr.width * img.naturalHeight / img.naturalWidth, y = Math.min(0, Math.round(pn.top - tr.top - 12 - carBottom * h));
      const c = document.createElement('canvas'); c.width = 16; c.height = 4; const g = c.getContext('2d');
      g.drawImage(img, 0, img.naturalHeight * 0.94, img.naturalWidth, img.naturalHeight * 0.06, 0, 0, 16, 4);
      const d = g.getImageData(0, 0, 16, 4).data, m = [0, 0, 0];
      for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) m[k] += d[i + k] / 64;
      css = `#s-title { background: url("${src}") 50% ${y}px / 100% auto no-repeat, rgb(${m.map(Math.round).join(',')}) !important; }`;
    }
    let st = root.getElementById('maketa-ozadje');
    if (!st) { st = document.createElement('style'); st.id = 'maketa-ozadje'; root.appendChild(st); }
    st.textContent = css;
  }, [src, mode, CAR_BOTTOM]);
  await page.waitForTimeout(500);
}

const srv = await serve();
const browser = await launch();
try {
  for (const [view, vp] of VIEWS) {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { intro: 2, quali: 0 }, vp, { menu: true, touch: true, context: { deviceScaleFactor: 2 } });
    await page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 90000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(2500);   // (the title drawn, its words in their own fonts)
    const shot = async (name) => { await page.screenshot({ path: path.join(OUT, name + '.png') }); console.log('posnetek', name); };
    await shot(`meni-zdaj-${view}`);
    for (const v of VARIANTS) {
      await background(page, dataUrl(path.join(V2, `medvode-${v}-${view}.webp`)), 'cover');
      await shot(`kot-je-${v}-${view}`);
      if (view === 'pokonci') await background(page, dataUrl(path.join(V2, `medvode-${v}-pokonci.webp`)), 'top');
      else await background(page, dataUrl(path.join(HERE, `medvode-${v}-meni-lezece.webp`)), 'cover');
      await shot(`meni-${v}-${view}`);
    }
    if (errors && errors.length) console.log('napake strani:', errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.close();
}
