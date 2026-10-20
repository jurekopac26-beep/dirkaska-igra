// Izdela slike »zdaj« in »nova grafika« za vse prizore v prizori/*.json (brez sprememb igre: slog.js se vbrizga v tekočo igro ob posnetku).
//   node maketa-grafike/orodja/narediti-slike.mjs [izhodna mapa] [id …]      (privzeto: maketa-grafike/slike, vsi prizori)
// Vsak prizor odpre svojo stran (igra se naloži, dirka steče spec.sim sekund na avtopilotu, nato se ustavi), posname »zdaj«, vbrizga slog in posname »novo«.
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openScene, posnemi, shrani, MAPA } from './scena.mjs';

const args = process.argv.slice(2), OUT = path.resolve(args[0] && !/^\d\d-/.test(args[0]) ? args.shift() : path.join(MAPA, 'slike')), ids = args;
const files = fs.readdirSync(path.join(MAPA, 'orodja', 'prizori')).filter(f => /^\d\d-.*\.json$/.test(f) && (!ids.length || ids.some(i => f.startsWith(i)))).sort();
const code = ['slog.js', 'rekviziti.js'].map(f => fs.readFileSync(path.join(MAPA, 'orodja', f), 'utf8')).join('\n;\n');
const srv = await serve(), browser = await launch();
try {
  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(path.join(MAPA, 'orodja', 'prizori', f), 'utf8')), t0 = Date.now();
    const { page, errors } = await openScene(browser, srv.base, d.spec, { width: 960, height: 540 });
    shrani(path.join(OUT, d.id + '-zdaj.png'), await posnemi(page, d.spec, 1920));
    await page.evaluate(async ([code, opts]) => { (0, eval)(code); return window.__slog.apply(opts); }, [code, d.stil]);
    await page.evaluate(() => window.__slog.enable(true));
    shrani(path.join(OUT, d.id + '-novo.png'), await posnemi(page, d.spec, 1920));
    await page.context().close();
    console.log(d.id, d.kraj, Math.round((Date.now() - t0) / 1000) + ' s', errors.length ? errors.join(' | ') : '');
  }
} finally { await browser.close(); await srv.close(); }
