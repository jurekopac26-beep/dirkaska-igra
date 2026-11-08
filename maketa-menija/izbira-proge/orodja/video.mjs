// the weather video: a tap on each weather icon in turn, every layer drawn frame by frame (30 fps), then ffmpeg. Usage: node video.mjs <config.json>
// (SNOW=blizzard the kind of snow, OUT=<folder>)
import { serve, launch } from '../../../tests/browser/lib.mjs';
import fs from 'node:fs';
import os from 'node:os';
import { execSync } from 'node:child_process';
const OUT = (process.env.OUT || os.tmpdir() + '/maketa-izbira-proge') + '/', cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), STYLE = process.env.SNOW || 'powder', FPS = 30;
const TL = [{ t: -30, k: 'dry' }, { t: 2.4, k: 'rain' }, { t: 6.2, k: 'change' }, { t: 10, k: 'storm' }, { t: 14.2, k: 'snow' }], END = 19.5;
const MJS = fs.readFileSync(new URL('../../../js/menu.js', import.meta.url), 'utf8'), fi = MJS.indexOf('const FLAGS = {'), FLAGS = (0, eval)('(' + MJS.slice(fi + 14, MJS.indexOf('\n  };', fi) + 4) + ')');
Object.assign(FLAGS, { Chile: '<rect width="30" height="20" fill="#fff"/><rect y="10" width="30" height="10" fill="#d52b1e"/><rect width="10" height="10" fill="#0039a6"/><path d="M5 2.2l1.1 3.3h3.4l-2.8 2 1.1 3.3-2.8-2-2.8 2 1.1-3.3-2.8-2h3.4z" fill="#fff"/>' });
fs.mkdirSync(OUT, { recursive: true });
const srv = await serve(), browser = await launch();
const page = await (await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 2 })).newPage();
page.on('pageerror', e => console.log('pageerror', e.message));
const v = cfg.variants[0], T = Object.assign({}, cfg.track, { flag: FLAGS[cfg.track.countryKey], prev: FLAGS[cfg.track.prevKey], next: FLAGS[cfg.track.nextKey], graph: Object.assign({}, cfg.track.graph, v.graph), bg: v.bg, mg: v.mg }, v.set);
await page.goto(srv.base + '/maketa-menija/izbira-proge/index.html?static'); await page.waitForFunction(() => window.MOCK && window.ROUTES);
await page.evaluate((T) => window.MOCK(T), T);
await page.evaluate(([tl, hz, cf, st]) => { WXFX.setTimeline(tl); WXFX.frame(0, { flash: null, hz, carFloor: cf, snowStyle: st }); }, [TL, T.hz, T.carFloor, STYLE]);
const dir = OUT + 'frames/'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
const n = Math.round(END * FPS);
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => WXFX.frame(t), i / FPS);
  await page.screenshot({ path: dir + 'f' + String(i).padStart(4, '0') + '.jpg', type: 'jpeg', quality: 92 });
  if (i % 60 === 0) console.log('frame', i, '/', n);
}
await browser.close(); await srv.close();
const mp4 = OUT + 'vreme_' + STYLE + '.mp4';
execSync('ffmpeg -y -loglevel error -framerate ' + FPS + ' -i ' + dir + 'f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 25 -preset medium -movflags +faststart ' + mp4);
console.log(mp4, (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
