// The sharpening (AMD CAS in the post pass, js/render.js casK; docs/igra.md »Ostrenje slike«): only on Grafika · Visoko and only while the
// picture is drawn below the screen's own pixels (the adaptive resolution, the battery saver, a screen denser than Visoka's 2x), half its
// weight just below them, growing to all of it at 0.55; off at the screen's pixels, on Normalno, in a still (the photo mode). It has no pass
// of its own (the same draw calls), switching it builds no shader again, the sharpened picture comes closer to the picture at the full
// resolution than the unsharpened one, and it puts no halo round the edges (hardly more pixels beyond the full picture's own local range
// than without it: without its limiter some 3 % more on Spa's fences and banners, with it under 0.1 %).
//   node tests/browser/ostrenje.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('sharpening (CAS): Visoka and a picture below the screen\'s pixels only');
const srv = await serve();
const browser = await launch();
const SET = { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer' };
// the game on a track, the car on the road at m metres, the camera behind it settled; from here on no time passes
const race = async (id, m, ctx) => {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', SET, { width: 360, height: 640 }, Object.assign({ seed: 11 }, ctx));
  await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5');
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
  await page.evaluate(async (m) => {
    const g = window.__game, R = g.race, Tr = R.track, P = R.player, raf = () => new Promise(r => requestAnimationFrame(r)); g.pause();
    const i = Tr.idx((Tr.startS + m) % Tr.len); P.place(Tr.px[i] + Tr.nx[i] * Tr.rl[i], Tr.pz[i] + Tr.nz[i] * Tr.rl[i], Tr.hd[i]); P.q = Tr.query(P.x, P.z, i, P.q);
    Render.resetCam(); for (let k = 0; k < 8; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }
  }, m);
  return { page, errors };
};
// the weight at r (the drawn pixels against the screen's): half of it just below 1, all of it at `full` (0.55) and below
const want = (c, r) => r < 0.99 ? c.base * (0.5 + 0.5 * Math.min(1, Math.max(0, (1 - r) / (1 - c.full)))) : 0;
const near = (a, b) => Math.abs(a - b) < 1e-3;
try {
  // A. a 1x screen (Bathurst, 1284 m)
  const { page, errors } = await race('bathurst', 1284, {});
  // the state at a scale d (null: as it is): the weight now, the weight the frame was drawn with, the draw calls and the shader programs
  const at = (d) => page.evaluate((d) => {
    const P = window.__game.race.player, I = Render.info();
    if (d != null) Render.setDynScale(d);
    Render.frame(0, 1, P, 'chase', {});
    I.autoReset = false; I.reset(); Render.frame(0, 1, P, 'chase', {}); const calls = I.render.calls; I.autoReset = true;
    const c = Render.casInfo();
    return { k: +c.k.toFixed(4), drawn: +c.drawn.toFixed(4), r: c.r, base: c.base, full: c.full, calls, progs: I.programs.length, pr: +Render.pixelRatio.toFixed(3) };
  }, d);

  // 1. Visoka: off at the full resolution, half its weight just below it, growing to all of it at 0.55; no shader built again, no pass of
  // its own
  const s1 = await at(1), s09 = await at(0.9), s07 = await at(0.7), s055 = await at(0.55), back = await at(1);
  T.check('Visoka at the full resolution: no sharpening', s1.k === 0 && s1.drawn === 0 && back.drawn === 0 && s1.r === 1, JSON.stringify({ s1, back }));
  T.check('Visoka at 0.9 and 0.7 of it: part of the weight (half of it and more); at 0.55: all of it (0.1 to 0.2)',
    near(s09.drawn, want(s09, 0.9)) && near(s07.drawn, want(s07, 0.7)) && s09.drawn > s09.base / 2 && s07.drawn > s09.drawn && s07.drawn < s07.base && s055.drawn === s055.base && s055.base >= 0.1 && s055.base <= 0.2,
    JSON.stringify({ s09, s07, s055 }));
  T.check('switching it on and off builds no shader again and adds no draw call', s1.progs === s09.progs && s09.progs === s055.progs && s055.progs === back.progs && s055.calls === s1.calls && s09.calls === s1.calls, JSON.stringify([s1, s09, s055, back].map(s => [s.calls, s.progs])));

  // 2. the battery saver (0.7 of the resolution) on Visoka: its part of the weight; Normalno (no post pass) at 0.55: none
  const sv = await page.evaluate(() => { Render.setDynScale(1); Render.setSaver(true); Render.frame(0, 1, window.__game.race.player, 'chase', {}); const c = Render.casInfo(); Render.setSaver(false); return { drawn: c.drawn, r: c.r, base: c.base, full: c.full }; });
  T.check('the battery saver on Visoka (0.7 of the resolution): its part of the weight', near(sv.r, 0.7) && near(sv.drawn, want(sv, 0.7)) && sv.drawn > 0, JSON.stringify(sv));
  const nm = await page.evaluate(() => { Render.applySettings({ quality: 'normal' }); Render.setDynScale(0.55); Render.frame(0, 1, window.__game.race.player, 'chase', {}); const c = Render.casInfo(); Render.applySettings({ quality: 'high' }); return c; });
  T.check('Normalno at 0.55: no sharpening (no post pass)', nm.k === 0 && nm.drawn === 0 && !nm.post, JSON.stringify(nm));

  // 3. a still (the photo mode) at 0.55: drawn without it, at its own resolution; the race's frames after it with it again
  const st = await page.evaluate(() => { const P = window.__game.race.player; Render.setDynScale(0.55); Render.frame(0, 1, P, 'chase', {}); const before = Render.casInfo().drawn; const c = Render.snapshot(P, 'chase', 1280); const still = Render.casInfo().drawn; Render.frame(0, 1, P, 'chase', {}); const after = Render.casInfo().drawn; Render.setDynScale(1); return { before, still, after, w: c.width }; });
  T.check('a still at 0.55: no sharpening in it; the race after it: sharpened again', st.before > 0 && st.still === 0 && st.after === st.before && st.w >= 640, JSON.stringify(st));
  T.check('no page errors (1x screen)', errors.length === 0, errors.slice(0, 5).join(' | '));
  await page.context().close();

  // B. a 3x screen (most phones are 2.6x to 3.5x; Spa, 600 m: its fences, banners and stands)
  const g3 = await race('spa', 600, { context: { deviceScaleFactor: 3 } });
  // 4. Visoka draws at most 2x, the browser stretches it 1.5x: at the full resolution its part of the weight already (r 2/3), all of it
  // at 0.55
  const t1 = await g3.page.evaluate(() => { const P = window.__game.race.player; Render.setDynScale(1); Render.frame(0, 1, P, 'chase', {}); const c = Render.casInfo(); Render.setDynScale(0.55); Render.frame(0, 1, P, 'chase', {}); const d = Render.casInfo(); Render.setDynScale(1); return { r: c.r, drawn: c.drawn, base: c.base, full: c.full, pr: +Render.pixelRatio.toFixed(3), r055: d.r, drawn055: d.drawn }; });
  T.check('a 3x screen on Visoka at the full resolution (2x drawn): sharpened, its part of the weight; at 0.55: all of it', near(t1.pr, 2) && near(t1.r, 2 / 3) && near(t1.drawn, want(t1, t1.r)) && t1.drawn > t1.base / 2 && t1.drawn055 === t1.base, JSON.stringify(t1));

  // 5. the picture at 0.55 stretched (bilinear, as the browser does) over the picture at the full resolution (2x, no sharpening): with it
  // sharper (more gradient) and closer to it (PSNR); and no halo: beyond the full picture's own 5x5 range by more than 3/255 hardly more
  // pixels than without it
  const px = await g3.page.evaluate(() => {
    const P = window.__game.race.player, cv = document.querySelector('canvas'), base = Render.casInfo().base;
    const grab = (d, k, W, H) => { Render.setDynScale(d); Render.casInfo({ k }); Render.frame(0, 1, P, 'chase', {}); W = W || cv.width; H = H || cv.height;
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'low'; x.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, W, H);
      const d4 = x.getImageData(0, 0, W, H).data, l = new Float32Array(W * H); for (let i = 0; i < W * H; i++) l[i] = 0.299 * d4[i * 4] + 0.587 * d4[i * 4 + 1] + 0.114 * d4[i * 4 + 2]; return { l, W, H, cw: cv.width }; };
    const ref = grab(1, 0), W = ref.W, H = ref.H, a = grab(0.55, 0, W, H), b = grab(0.55, base, W, H); Render.casInfo({ k: base }); Render.setDynScale(1);
    const grad = (l) => { let g = 0; for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) { const i = y * W + x; g += Math.abs(l[i + 1] - l[i]) + Math.abs(l[i + W] - l[i]); } return g; };
    const psnr = (l) => { let e = 0; for (let i = 0; i < W * H; i++) { const q = l[i] - ref.l[i]; e += q * q; } return 10 * Math.log10(255 * 255 * W * H / Math.max(e, 1e-9)); };
    let oa = 0, ob = 0, n = 0;
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      let mn = 255, mx = 0; for (let v = -2; v <= 2; v++) for (let u = -2; u <= 2; u++) { const q = ref.l[(y + v) * W + x + u]; if (q < mn) mn = q; if (q > mx) mx = q; }
      const i = y * W + x; if (Math.max(a.l[i] - mx, mn - a.l[i]) > 3) oa++; if (Math.max(b.l[i] - mx, mn - b.l[i]) > 3) ob++; n++;
    }
    return { gain: +((grad(b.l) / grad(a.l) - 1) * 100).toFixed(2), psnrNone: +psnr(a.l).toFixed(3), psnrSharp: +psnr(b.l).toFixed(3), haloNone: +(oa / n * 100).toFixed(3), haloSharp: +(ob / n * 100).toFixed(3), size: [W, H, a.cw] };
  });
  T.check('at 0.55 the picture is sharper with it (a little: 1-40 % more gradient) and closer to the picture at the full resolution (PSNR)', px.gain > 1 && px.gain < 40 && px.psnrSharp > px.psnrNone, JSON.stringify(px));
  T.check('no halo: beyond the full picture\'s own 5x5 range by more than 3/255, under 0.5 % of the pixels more than without it', px.haloSharp - px.haloNone < 0.5, JSON.stringify(px));
  T.check('no page errors (3x screen)', g3.errors.length === 0, g3.errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
