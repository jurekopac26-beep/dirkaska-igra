// The garage models (js/garage.js, js/garage/<id>.js): the car screen's turntable shows a vehicle that has one by it, a race never.
// - the car screen with the LEV S on a phone (844x390, Detajli avtov Normalni): its garage model, light enough for a phone (at most 45
//   draws, 200 000 triangles, pictures at most 2048 wide), its roof rack on it; no page error
// - the colours: each one the model's paint (the picture: mostly that colour), the model built once (another colour, another car and
//   back: none built again)
// - on the turntable over a whole turn: on the screen and off the car panel, landscape and portrait (the rack too)
// - Visoki (a computer's): built again finer (at most 450 000 triangles, the shell's picture 4096 wide)
// - the check sheets' pictures (Render.carShot without garage): the kit's own look, not the garage model
// - a race: the garage model freed (none kept), the player's LEV S the kit's look; the car screen after it: built again, no page error
//   node tests/browser/garage.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the garage models (the car screen\'s detailed LEV S)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', carDet: 'normal' }, { width: 844, height: 390 }, { seed: 5 });
  const toLevs = () => page.evaluate(async () => { const g = window.__game; g.S.car = Core.MODELS.findIndex(m => m.id === 'levs'); g.S.color = 0; g.onAction('to-car'); await new Promise(r => setTimeout(r, 600)); return Garage.info(); });
  const I1 = await toLevs();
  T.check('the car screen, the LEV S on a phone: its garage model, at most 45 draws and 200 000 triangles, pictures at most 2048 wide',
    I1.key === 'levs' && I1.draws > 10 && I1.draws <= 45 && I1.tris > 50000 && I1.tris <= 200000 && I1.pics.every(p => +p.split('x')[0] <= 2048) && I1.color === 0xd81f2a, JSON.stringify(I1));

  // the colours: the paint of each (the side view on magenta: of the car's clearly coloured pixels, most in the chosen colour's hue)
  const C = await page.evaluate(async () => {
    const out = [];
    for (const [i, hex] of [[2, 0x1c5fd6], [3, 0xf2c230], [5, 0x2fa84f]]) {
      document.querySelectorAll('#car-colors button')[i].click(); await new Promise(r => setTimeout(r, 200));
      const info = Garage.info(), c = Render.carShot({ id: 'levs', garage: true, color: hex, view: 'side', bg: 0xff00ff, floor: false, blob: false, grid: false, w: 480, h: 270 });
      const d = c.getContext('2d').getImageData(0, 0, 480, 270).data, hue = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn; if (!c) return 0;
        const h = mx === r ? ((g - b) / c) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4; return (h * 60 + 360) % 360; }, ht = hue((hex >> 16) & 255, (hex >> 8) & 255, hex & 255);
      let col = 0, near = 0; for (let k = 0; k < d.length; k += 4) { const r = d[k], g = d[k + 1], b = d[k + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        if (r > 200 && g < 60 && b > 200) continue; if (mx < 50 || (mx - mn) / mx < 0.35) continue; col++; const dh = Math.abs(hue(r, g, b) - ht); if (Math.min(dh, 360 - dh) < 25) near++; }
      out.push({ hex: hex.toString(16), color: info.color.toString(16), builds: info.builds, share: +(near / col).toFixed(2) });
    }
    window.__game.onAction('car-next'); await new Promise(r => setTimeout(r, 300)); window.__game.onAction('car-prev'); await new Promise(r => setTimeout(r, 300));
    return { out, after: Garage.info() };
  });
  T.check('the colours: the model\'s paint each one picked (most of the car\'s coloured pixels in its hue), built once (another colour, another car and back: none built again)',
    C.out.every(q => q.color === q.hex && q.share > 0.6) && C.out.every(q => q.builds === I1.builds) && C.after.builds === I1.builds && C.after.key === 'levs', JSON.stringify(C));

  // over a whole turn on the screen and off the panel (landscape and portrait)
  for (const [w, h] of [[844, 390], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h });
    const B = await page.evaluate(async () => { await new Promise(r => setTimeout(r, 300)); const pr = document.querySelector('#s-car .car-panel').getBoundingClientRect(), b = Render.showBox(), land = b.w > b.h;
      return { ok: b.x0 >= -2 && b.y0 >= -2 && (land ? b.x1 <= pr.left + 2 && b.y1 <= b.h + 2 : b.x1 <= b.w + 2 && b.y1 <= pr.top + 2), b: [b.x0, b.x1, b.y0, b.y1].map(Math.round), panel: [pr.left, pr.top].map(Math.round), garage: Garage.info().key }; });
    T.check(`on the turntable at ${w}x${h}: over a whole turn on the screen and off the car panel (the roof rack too)`, B.ok && B.garage === 'levs', JSON.stringify(B));
  }
  await page.setViewportSize({ width: 844, height: 390 });

  // Visoki: built again finer
  const V = await page.evaluate(async () => { const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
    g.onAction('to-settings'); await wait(200); document.querySelector('[data-set="carDet"] button[data-v="high"]').click(); g.onAction('settings-done'); await wait(200);
    g.onAction('to-car'); await wait(600); return Garage.info(); });
  T.check('Visoki (a computer\'s): built again finer, at most 450 000 triangles, the shell\'s picture 4096 wide', V.key === 'levs|H' && V.tris > I1.tris && V.tris <= 450000 && V.pics.includes('4096x2048'), JSON.stringify(V));

  // the check sheets' pictures: the kit's own look (the car screen's model not drawn: its pixels differ from the garage model's)
  const K = await page.evaluate(() => { const px = (o) => { const c = Render.carShot(Object.assign({ id: 'levs', color: 0x1c5fd6, view: 'side', bg: 0xff00ff, floor: false, blob: false, grid: false, w: 320, h: 180 }, o)), d = c.getContext('2d').getImageData(0, 0, 320, 180).data;
    let n = 0, top = 1e9; for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) { const k = (y * 320 + x) * 4; if (!(d[k] > 200 && d[k + 1] < 60 && d[k + 2] > 200)) { n++; if (y < top) top = y; } } return { n, top }; };
    return { kit: px({}), garage: px({ garage: true }) }; });
  T.check('the check sheets\' pictures (no garage option): the kit\'s own look (lower: no roof rack), the garage model only when asked', K.kit.n > 1000 && K.garage.n > 1000 && K.kit.top > K.garage.top + 5, JSON.stringify(K));

  // a race: the garage model freed, the player's LEV S the kit's look; the car screen again after it
  await startTrack(page, 'jezero');
  const R = await page.evaluate(() => { const g = window.__game, P = g.race.player, v = Render.viewOf(P); g.pause(); g.sim(1, true); Render.frame(1 / 60, 1, P, 'chase', {});
    return { info: Garage.info(), car: P.m.id, look: v && v.kit ? v.kit.E.M.id : null }; });
  T.check('a race: the garage model freed (none kept), the player\'s LEV S drawn by the kit\'s look', R.info.key === null && R.car === 'levs' && R.look === 'levs', JSON.stringify(R));
  const A = await page.evaluate(async () => { const g = window.__game; g.onAction('to-title'); await new Promise(r => setTimeout(r, 300)); g.onAction('to-car'); await new Promise(r => setTimeout(r, 600)); return Garage.info(); });
  T.check('the car screen after the race: the garage model built again', A.key && A.key.startsWith('levs') && A.builds > V.builds, JSON.stringify(A));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  T.done();
  await browser.close();
  await srv.close();
}
