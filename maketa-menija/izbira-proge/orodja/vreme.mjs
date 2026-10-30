// stills of the track screen in each weather, settled (index.html?static + wxfx.js). Usage: node vreme.mjs <config.json> dry rain change storm snow
// (SNOW=powder|blizzard|sunny the kind of snow, NAME=<file> one picture's name, OUT=<folder> where the PNGs go, default the temp folder)
import { serve, launch } from '../../../tests/browser/lib.mjs';
import fs from 'node:fs';
import os from 'node:os';
const OUT = (process.env.OUT || os.tmpdir() + '/maketa-izbira-proge') + '/', cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), keys = process.argv.slice(3), STYLE = process.env.SNOW || '';
const MJS = fs.readFileSync(new URL('../../../js/menu.js', import.meta.url), 'utf8'), fi = MJS.indexOf('const FLAGS = {'), FLAGS = (0, eval)('(' + MJS.slice(fi + 14, MJS.indexOf('\n  };', fi) + 4) + ')');
Object.assign(FLAGS, { Chile: '<rect width="30" height="20" fill="#fff"/><rect y="10" width="30" height="10" fill="#d52b1e"/><rect width="10" height="10" fill="#0039a6"/><path d="M5 2.2l1.1 3.3h3.4l-2.8 2 1.1 3.3-2.8-2-2.8 2 1.1-3.3-2.8-2h3.4z" fill="#fff"/>' });
fs.mkdirSync(OUT, { recursive: true });
const srv = await serve(), browser = await launch();
const page = await (await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 2 })).newPage();
page.on('pageerror', e => console.log('pageerror', e.message)); page.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
const v = cfg.variants[0], T = Object.assign({}, cfg.track, { flag: FLAGS[cfg.track.countryKey], prev: FLAGS[cfg.track.prevKey], next: FLAGS[cfg.track.nextKey], graph: Object.assign({}, cfg.track.graph, v.graph), bg: v.bg, mg: v.mg }, v.set);
for (const k of keys) {
  await page.goto(srv.base + '/maketa-menija/izbira-proge/index.html?static'); await page.waitForFunction(() => window.MOCK && window.ROUTES);
  await page.evaluate((T) => window.MOCK(T), T);
  await page.evaluate(([k, hz, cf, st]) => { WXFX.setTimeline([{ t: -30, k }]); WXFX.frame(1.37, { flash: k === 'storm' ? 0.7 : 0, hz, carFloor: cf, snowStyle: st }); }, [k, T.hz, T.carFloor, STYLE]);
  await page.waitForTimeout(150);
  await page.screenshot({ path: OUT + (process.env.NAME ? process.env.NAME + '.png' : 'wx_' + k + (STYLE ? '_' + STYLE : '') + '.png') }); console.log(k);
}
await browser.close(); await srv.close();
