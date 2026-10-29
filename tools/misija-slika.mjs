// Pictures of a special mission (docs/misije.md), as the player sees it: the quick entry ?misija=<id> opens it, the player's car is driven
// on the autopilot to the places asked, and the screen (the chase camera with the mission's panel, as on the phone) is saved, upright
// (390 x 844) and/or on its side (844 x 390). For a session to check its mission with one picture, without writing a script each time.
// In test-results/misije/ (or --out): <id>-<where>-<pokonci|lezece>.png, and a line per picture with the mission's state (time, end, gauges).
//   node tools/misija-slika.mjs 06                         the start (the intro card), upright
//   node tools/misija-slika.mjs 06 --t 20,60 --lezece      20 s and 60 s after the start, on its side
//   node tools/misija-slika.mjs 06 --pred 60 --pokonci --lezece   60 m before the finish, both ways
//   node tools/misija-slika.mjs 06 --konec                 driven to the end of the mission: the result
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame } from '../tests/browser/lib.mjs';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2), opt = { id: null, t: [], pred: [], end: false, up: false, side: false, out: path.join(REPO, 'test-results', 'misije') };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i], nums = () => String(argv[++i] || '').split(',').map(Number).filter(v => v >= 0);
  if (a === '--t') opt.t.push(...nums()); else if (a === '--pred') opt.pred.push(...nums()); else if (a === '--konec') opt.end = true;
  else if (a === '--pokonci') opt.up = true; else if (a === '--lezece') opt.side = true; else if (a === '--out') opt.out = path.resolve(argv[++i]);
  else if (!opt.id) opt.id = a; else { console.error('unexpected argument: ' + a); process.exit(2); }
}
if (!opt.id) { console.error('usage: node tools/misija-slika.mjs <id> [--t s,…] [--pred m,…] [--konec] [--pokonci] [--lezece] [--out folder]'); process.exit(2); }
if (!opt.up && !opt.side) opt.up = true;
fs.mkdirSync(opt.out, { recursive: true });

// the places, in the order they are driven to: [name, done(state) for the autopilot to stop at]
const places = [['start', null]].filter(() => !opt.t.length && !opt.pred.length && !opt.end)
  .concat(opt.t.sort((a, b) => a - b).map(t => [t + 's', { t }]), opt.pred.sort((a, b) => b - a).map(m => ['pred' + m + 'm', { pred: m }]), opt.end ? [['konec', { end: true }]] : []);
const srv = await serve(), browser = await launch();
try {
  for (const [way, vp] of [['pokonci', { width: 390, height: 844 }], ['lezece', { width: 844, height: 390 }]]) {
    if (way === 'pokonci' ? !opt.up : !opt.side) continue;
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?misija=' + encodeURIComponent(opt.id), {}, vp, { touch: true });
    await page.waitForFunction(() => window.__game.race && typeof Missions !== 'undefined' && Missions.run && window.__game.phase !== 'none', null, { timeout: 240000 });
    await page.waitForTimeout(800);
    for (const [name, P] of places) {
      if (P) await page.evaluate((P) => { const g = window.__game, r = Missions.run, T = g.race.track;
        for (let k = 0; k < 4000 && !r.end; k++) { if (P.t != null && r.t >= P.t) break; if (P.pred != null && (T.raceLen || T.len) - g.race.player.dist <= P.pred) break; g.sim(0.25, true); } }, P);
      if (P && P.end) await page.waitForFunction(() => document.getElementById('mis-res'), null, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(500);
      const file = path.join(opt.out, `${opt.id}-${name}-${way}.png`);
      await page.screenshot({ path: file });
      const s = await page.evaluate(() => { const r = Missions.run; return { t: +r.t.toFixed(1), end: r.end, why: r.why, rows: Object.fromEntries(Object.entries(r.vals).map(([k, v]) => [k, v.text])) }; });
      console.log(path.relative(REPO, file) + '  ' + JSON.stringify(s));
    }
    if (errors.length) console.log('errors on the page: ' + errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
