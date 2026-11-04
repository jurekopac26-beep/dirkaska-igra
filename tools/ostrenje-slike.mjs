// Pictures of the sharpening (AMD CAS on Visoka while the picture is drawn below the screen's pixels: js/render.js casK, docs/igra.md »Ostrenje slike«), as a
// phone shows them: the race's picture drawn at --dyn of the resolution (as the adaptive resolution lowers it), then stretched over the
// screen as the browser does (bilinear, at the phone's pixels, --dpr), with no HUD. Through the quick entry (index.html?proga=<id>) the
// player's car is put on the ideal line at --m metres after the start, the other cars hidden, the camera behind the car. For each weight
// in --k (0: no sharpening; without --k: the game's own) one picture, and the full resolution as the reference (»polna«), cropped to the
// road ahead and the car (--crop: the share of the height from the top and to the bottom). In test-results/ostrenje/ (or --out):
//   <id>-<m>m-<pokonci|lezece>-<polna|k…>.webp, and one strip of them side by side, …-primerjava.webp
//   node tools/ostrenje-slike.mjs bathurst --m 1284
//   node tools/ostrenje-slike.mjs spa --m 600 --dyn 0.55 --k 0,0.06,0.1,0.16 --lezece
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { serve, launch, openGame } from '../tests/browser/lib.mjs';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const SIZE = { pokonci: { width: 360, height: 640 }, lezece: { width: 640, height: 360 } };   // (a phone's screen in CSS pixels, as tools/shot.mjs)
const args = process.argv.slice(2), flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; }, has = (k) => { const i = args.indexOf(k); if (i >= 0) args.splice(i, 1); return i >= 0; };
const m = Number(flag('--m') || 1284), dyn = Number(flag('--dyn') || 0.55), dpr = Number(flag('--dpr') || 2), kArg = flag('--k'), crop = (flag('--crop') || '0.3,0.85').split(',').map(Number);
const out = path.resolve(flag('--out') || path.join(REPO, 'test-results', 'ostrenje'));
let orient = ['pokonci', 'lezece'].filter(o => has('--' + o)); if (!orient.length) orient = ['pokonci'];
const ids = args.filter(a => !a.startsWith('--')), bad = args.filter(a => a.startsWith('--'));
const ks = kArg ? kArg.split(',').map(Number) : [0, null];   // (null: the game's own weight, CAS.k)
if (!ids.length || bad.length || !(dyn > 0.5 && dyn <= 1) || ks.some(k => k != null && !(k >= 0 && k <= 0.2)) || !(crop[0] >= 0 && crop[1] <= 1 && crop[0] < crop[1])) {
  console.log('usage: node tools/ostrenje-slike.mjs <id …> [--m 1284] [--dyn 0.55] [--k 0,0.1] [--dpr 2] [--pokonci] [--lezece] [--crop 0.3,0.85] [--out <folder>]' + (bad.length ? '\nunknown: ' + bad.join(' ') : ''));
  process.exit(2);
}
fs.mkdirSync(out, { recursive: true });
const save = (name, dataUrl) => { const f = path.join(out, name); fs.writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64')); return f; };

const srv = await serve(), browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer' }, SIZE[orient[0]], { seed: 11, context: { deviceScaleFactor: dpr } });
  for (const id of ids) {
    await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5');
    await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
    for (const o of orient) {
      await page.setViewportSize(SIZE[o]);
      const r = await page.evaluate(async ([m, dyn, ks, crop]) => {
        const g = window.__game, R = g.race, T = R.track, P = R.player, raf = () => new Promise(r => requestAnimationFrame(r));
        g.pause(); Render.resize();
        const s = T.open ? Math.min(T.startS + m, T.finishS - 1) : T.startS + m, i = T.idx(((s % T.len) + T.len) % T.len), off = T.rl ? T.rl[i] : 0;
        P.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) P.y = P.py = T.hy[i];
        P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s; P.vx = P.vz = 0;
        for (let k = 0; k < 60; k++) { for (const c of R.cars) { c.vx = 0; c.vz = 0; c.w = 0; } P.inThr = 0; P.inBrk = 1; P.inSteer = 0; R.step(1 / 120); }   // (settled on its wheels)
        const hid = R.cars.filter(c => c !== P).map(c => Render.viewOf(c)).filter(v => v && v.grp.visible); for (const v of hid) v.grp.visible = false;
        const cv = document.querySelector('canvas'), W = Math.round(innerWidth * devicePixelRatio), H = Math.round(innerHeight * devicePixelRatio);
        const y0 = Math.round(H * crop[0]), y1 = Math.round(H * crop[1]), base = Render.casInfo().base, pics = [];
        // one picture: drawn at the scale d with the weight k, stretched to the screen's pixels as the browser stretches the canvas (bilinear)
        // (the camera settled behind the car once; then no time passes between the pictures: the trees' shadows, the flags stand still)
        Render.resetCam(); for (let n = 0; n < 8; n++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }
        const pic = async (d, k, tag) => {
          Render.setDynScale(d); Render.casInfo({ k: k == null ? base : k });
          Render.frame(0, 1, P, 'chase', {}); await raf(); Render.frame(0, 1, P, 'chase', {});
          const info = Render.casInfo(), c = document.createElement('canvas'); c.width = W; c.height = y1 - y0;
          const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'low';
          x.drawImage(cv, 0, 0, cv.width, cv.height, 0, -y0, W, H);
          pics.push({ tag, src: c.toDataURL('image/webp', 0.92), canvas: [cv.width, cv.height], k: info.drawn, w: c.width, h: c.height, c });
        };
        await pic(1, 0, 'polna');
        for (const k of ks) await pic(dyn, k, 'k' + (k == null ? base : k));
        Render.setDynScale(1); Render.casInfo({ k: base }); for (const v of hid) v.grp.visible = true;
        // the strip: every picture side by side, each named
        const gap = 6, top = 20, S = document.createElement('canvas'); S.width = pics.length * pics[0].w + (pics.length - 1) * gap; S.height = pics[0].h + top;
        const x = S.getContext('2d'); x.fillStyle = '#0d1117'; x.fillRect(0, 0, S.width, S.height); x.fillStyle = '#e8eef4'; x.font = 'bold 14px sans-serif';
        pics.forEach((p, n) => { x.drawImage(p.c, n * (p.w + gap), top); x.fillText(p.tag === 'polna' ? 'polna ločljivost' : `${Math.round(dyn * 100)} %, ${p.k > 0 ? 'ostrenje ' + p.k.toFixed(3) : 'brez ostrenja'}`, n * (p.w + gap) + 4, 15); });
        return { pics: pics.map(p => ({ tag: p.tag, src: p.src, canvas: p.canvas, k: p.k })), strip: S.toDataURL('image/webp', 0.9), at: Math.round((((P.q.s - T.startS) % T.len) + T.len) % T.len), name: T.def.name };
      }, [m, dyn, ks, crop]);
      const key = `${id}-${m}m-${o}`;
      for (const p of r.pics) console.log(save(`${key}-${p.tag}.webp`, p.src) + `  (canvas ${p.canvas.join('×')}, weight ${p.k})`);
      console.log(save(`${key}-primerjava.webp`, r.strip) + `  (${r.name}, ${r.at} m)`);
    }
  }
  if (errors.length) { console.log('page errors:\n  ' + errors.slice(0, 5).join('\n  ')); process.exitCode = 1; }
} finally { await browser.close(); await srv.close(); }
