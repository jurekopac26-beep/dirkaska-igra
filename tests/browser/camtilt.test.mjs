// Nagib kamere: always 30 %, no setting. The chase camera (za avtom) looks further ahead along the road: its tilt below the horizon is
// 30 % smaller than the camera's own (7/9 of the tilt a camera at the old default of 10 % had), from the same distance to the point it looks at.
// Nastavitve have no row for it any more, and a visit to them or a new race leaves the tilt as it is.
//   node tests/browser/camtilt.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Nagib kamere: always 30 %, the chase camera looks further ahead, from the same distance');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { camera: 'chase', weather: 'dry', track: 'jezero', camTilt: 0 }, { width: 390, height: 844 });
  // the camera once it has settled, drawn in the chase camera at the given tilt: its tilt below the horizon (degrees), its distance from
  // the point it looks at
  const view = (ut) => page.evaluate((ut) => { const g = window.__game, P = g.race.player, C = Render.camera, keep = Render.cam.userTilt;
    g.pause(); if (ut != null) Render.cam.userTilt = ut; Render.resetCam(); for (let i = 0; i < 60; i++) Render.frame(1 / 60, 1, P, 'chase', {});
    const d = new THREE.Vector3(); C.getWorldDirection(d); Render.cam.userTilt = keep;
    return { tilt: +(Math.asin(-d.y) * 180 / Math.PI).toFixed(3), dist: +Render.cam.vd.toFixed(3) }; }, ut);
  const tilt = () => page.evaluate(() => Render.cam.userTilt);

  // Nastavitve: no row for it (an old saved camTilt is let be)
  const row = await page.evaluate(() => ({ seg: !!document.querySelector('[data-set="camTilt"]'), label: [...document.querySelectorAll('.rlbl')].some(e => /Nagib kamere/.test(e.textContent)) }));
  T.check('Nastavitve: no "Nagib kamere" row, none of its choices', !row.seg && !row.label, JSON.stringify(row));

  await startTrack(page, 'jezero');
  const t0 = await tilt();
  await page.evaluate(() => { const g = window.__game; g.onAction('to-settings'); g.onAction('settings-done'); });
  await startTrack(page, 'jezero');
  const t1 = await tilt();
  T.check('always 30 % (an old saved setting of 10 % too), after Nastavitve and a new race as well', t0 === 0.3 && t1 === 0.3, JSON.stringify([t0, t1]));

  // the chase camera (phone upright): 7/9 of the tilt of a camera at 10 %, from the same distance
  const c10 = await view(0.1), c30 = await view(null), r = c30.tilt / c10.tilt;
  T.check('chase: the camera tilts 30 % less than its own pitch: 7/9 of the tilt at the old 10 %', c30.tilt < c10.tilt && Math.abs(r - 0.7 / 0.9) < 0.005, JSON.stringify({ tilt: [c10.tilt, c30.tilt], r: +r.toFixed(4) }));
  T.check('chase: the camera stays as far from the point it looks at', c10.dist > 10 && Math.abs(c30.dist - c10.dist) < 0.01, JSON.stringify([c10.dist, c30.dist]));

  T.check('no page errors', errors.length === 0, errors.join('\n'));
} finally {
  await browser.close();
  srv.close();
}
T.done();
