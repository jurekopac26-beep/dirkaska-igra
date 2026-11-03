// The sharpening (AMD CAS in the post pass, js/render.js casK; docs/igra.md »Ostrenje slike«): only on Grafika · Visoko and only while the
// picture is drawn below Visoka's own resolution (the adaptive resolution, the battery saver), half its weight just below the full
// resolution, all of it from 0.7 down; off at the full resolution, on Normalno, in a still (the photo mode). It has no pass of its own (the
// same draw calls), switching it builds no shader again, and the sharpened picture keeps within what its pixels' neighbours have (no halo).
//   node tests/browser/ostrenje.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('sharpening (CAS): Visoka and a lowered resolution only');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', weather: 'dry', tod: 'day', season: 'summer' }, { width: 360, height: 640 }, { seed: 11 });
  await page.goto(srv.base + '/index.html?proga=bathurst&t=0.5');
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
  await page.evaluate(async () => {   // (the car on the road at 1284 m, the camera behind it settled; from here on no time passes)
    const g = window.__game, R = g.race, Tr = R.track, P = R.player, raf = () => new Promise(r => requestAnimationFrame(r)); g.pause();
    const i = Tr.idx((Tr.startS + 1284) % Tr.len); P.place(Tr.px[i] + Tr.nx[i] * Tr.rl[i], Tr.pz[i] + Tr.nz[i] * Tr.rl[i], Tr.hd[i]); P.q = Tr.query(P.x, P.z, i, P.q);
    Render.resetCam(); for (let k = 0; k < 8; k++) { Render.frame(1 / 60, 1, P, 'chase', {}); await raf(); }
  });
  // the state at a scale d (null: as it is): CAS's weight now, the weight the frame was drawn with, the draw calls and the shader programs
  const at = (d) => page.evaluate((d) => {
    const P = window.__game.race.player, I = Render.info();
    if (d != null) Render.setDynScale(d);
    Render.frame(0, 1, P, 'chase', {});
    I.autoReset = false; I.reset(); Render.frame(0, 1, P, 'chase', {}); const calls = I.render.calls; I.autoReset = true;
    const c = Render.casInfo();
    return { k: +c.k.toFixed(4), drawn: +c.drawn.toFixed(4), r: c.r, base: c.base, calls, progs: I.programs.length, pr: +Render.pixelRatio.toFixed(3) };
  }, d);

  // 1. Visoka: off at the full resolution, half its weight just below it, all of it from 0.7 down; no shader built again, no pass of its own
  const s1 = await at(1), s09 = await at(0.9), s07 = await at(0.7), s055 = await at(0.55), back = await at(1);
  const half = s09.base * (0.5 + 0.5 * (0.1 / 0.3));
  T.check('Visoka at the full resolution: no sharpening', s1.k === 0 && s1.drawn === 0 && back.drawn === 0, JSON.stringify({ s1, back }));
  T.check('Visoka at 0.9 of it: two thirds of the weight; at 0.7 and 0.55: all of it (0.1 to 0.2)', Math.abs(s09.drawn - half) < 1e-3 && s07.drawn === s07.base && s055.drawn === s055.base && s055.base >= 0.1 && s055.base <= 0.2, JSON.stringify({ s09, s07, s055 }));
  T.check('switching it on and off builds no shader again and adds no draw call', s1.progs === s09.progs && s09.progs === s055.progs && s055.progs === back.progs && s055.calls === s1.calls && s09.calls === s1.calls, JSON.stringify([s1, s09, s055, back].map(s => [s.calls, s.progs])));

  // 2. the picture at 0.55: sharper with it than without (more gradient), and no halo: every pixel within the min and max of its cross in
  // the picture without it (a little room for the grade after it: the saturation mixes the colours)
  const px = await page.evaluate(() => {
    const P = window.__game.race.player, cv = document.querySelector('canvas'), base = Render.casInfo().base;
    Render.setDynScale(0.55);
    const grab = (k) => { Render.casInfo({ k }); Render.frame(0, 1, P, 'chase', {}); const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const x = c.getContext('2d'); x.drawImage(cv, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
    const a = grab(0), b = grab(base), W = cv.width, H = cv.height; Render.casInfo({ k: base });
    const L = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let ga = 0, gb = 0, n = 0, out = 0, worst = 0, changed = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4, l = L(a, i), lb = L(b, i), nb = [i - 4, i + 4, i - W * 4, i + W * 4].map(j => L(a, j));
      ga += Math.abs(L(a, i + 4) - l) + Math.abs(L(a, i + W * 4) - l); gb += Math.abs(L(b, i + 4) - lb) + Math.abs(L(b, i + W * 4) - lb); n++;
      const mn = Math.min(l, ...nb), mx = Math.max(l, ...nb), o = Math.max(lb - mx, mn - lb, 0); if (o > 3) out++; worst = Math.max(worst, o);
      if (Math.abs(lb - l) > 2) changed++;
    }
    return { gain: +((gb / ga - 1) * 100).toFixed(2), changed: +(changed / n * 100).toFixed(1), out: +(out / n * 100).toFixed(3), worst: +worst.toFixed(1), size: [W, H] };
  });
  T.check('at 0.55 the picture is sharper with it (a little: 1-40 % more gradient), some of its pixels changed', px.gain > 1 && px.gain < 40 && px.changed > 1, JSON.stringify(px));
  T.check('no halo: under 0.5 % of the pixels go beyond their cross in the picture without it by more than 3/255', px.out < 0.5, JSON.stringify(px));

  // 3. the battery saver (0.7 of the resolution) on Visoka: all of it; Normalno (no post pass) at 0.55: none
  const sv = await page.evaluate(() => { Render.setDynScale(1); Render.setSaver(true); Render.frame(0, 1, window.__game.race.player, 'chase', {}); const c = Render.casInfo(); Render.setSaver(false); return { drawn: c.drawn, r: c.r, base: c.base }; });
  T.check('the battery saver on Visoka (0.7 of the resolution): all of the weight', Math.abs(sv.r - 0.7) < 1e-3 && sv.drawn === sv.base, JSON.stringify(sv));
  const nm = await page.evaluate(() => { Render.applySettings({ quality: 'normal' }); Render.setDynScale(0.55); Render.frame(0, 1, window.__game.race.player, 'chase', {}); const c = Render.casInfo(); Render.applySettings({ quality: 'high' }); return c; });
  T.check('Normalno at 0.55: no sharpening (no post pass)', nm.k === 0 && nm.drawn === 0 && !nm.post, JSON.stringify(nm));

  // 4. a still (the photo mode) at 0.55: drawn without it, at its own resolution; the race's frames after it with it again
  const st = await page.evaluate(() => { const P = window.__game.race.player; Render.setDynScale(0.55); Render.frame(0, 1, P, 'chase', {}); const before = Render.casInfo().drawn; const c = Render.snapshot(P, 'chase', 1280); const still = Render.casInfo().drawn; Render.frame(0, 1, P, 'chase', {}); const after = Render.casInfo().drawn; Render.setDynScale(1); return { before, still, after, w: c.width }; });
  T.check('a still at 0.55: no sharpening in it; the race after it: sharpened again', st.before > 0 && st.still === 0 && st.after === st.before && st.w >= 640, JSON.stringify(st));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
