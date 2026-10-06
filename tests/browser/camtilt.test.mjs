// Nagib kamere (Nastavitve): the chase camera (za avtom) looks further ahead along the road. Its tilt below the horizon is 10 % (the
// default), 20 % or 30 % smaller than the camera's own; its distance from the point it looks at stays the same, and the
// isometric camera does not change.
//   node tests/browser/camtilt.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Nagib kamere: the chase camera looks further ahead, from the same distance (the iso camera unchanged)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { camera: 'chase', weather: 'dry', track: 'jezero' }, { width: 390, height: 844 });
  const pick = (v) => page.evaluate((v) => document.querySelector(`[data-set="camTilt"] button[data-v="${v}"]`).click(), v);
  // the camera once it has settled, drawn in the given camera: its tilt below the horizon (degrees), its distance from the point it
  // looks at, its position
  const view = (mode) => page.evaluate((mode) => { const g = window.__game, P = g.race.player, C = Render.camera;
    g.pause(); Render.resetCam(); for (let i = 0; i < 60; i++) Render.frame(1 / 60, 1, P, mode, {});
    const d = new THREE.Vector3(); C.getWorldDirection(d);
    return { tilt: +(Math.asin(-d.y) * 180 / Math.PI).toFixed(3), dist: +Render.cam.vd.toFixed(3), pos: [C.position.x, C.position.y, C.position.z].map(v => +v.toFixed(3)) }; }, mode);
  const wiring = () => page.evaluate(() => ({ set: window.__game.S.camTilt, tilt: Render.cam.userTilt }));

  await startTrack(page, 'jezero');
  const w = await wiring();
  T.check('the default: 10 %', w.set === 0 && w.tilt === 0.1, JSON.stringify(w));

  // the setting is wired through (saved, and mapped to 10 / 20 / 30 %)
  await pick('0'); const c0 = await view('chase'); const w0 = await wiring();
  await pick('1'); const c1 = await view('chase'); const w1 = await wiring();
  await pick('2'); const c2 = await view('chase'); const w2 = await wiring();
  T.check('the choice is saved and maps to 10, 20 and 30 %', w0.set === 0 && w0.tilt === 0.1 && w1.set === 1 && w1.tilt === 0.2 && w2.set === 2 && w2.tilt === 0.3, JSON.stringify([w0, w1, w2]));

  // chase (phone upright): the camera tilts less the more it is set (by 0.8 / 0.9 and 0.7 / 0.9 of the default's tilt), from the same distance
  const r1 = c1.tilt / c0.tilt, r2 = c2.tilt / c0.tilt;
  T.check('chase: the camera tilts less the more it is set (20 % and 30 % against 10 %)', c2.tilt < c1.tilt && c1.tilt < c0.tilt && Math.abs(r1 - 0.8 / 0.9) < 0.005 && Math.abs(r2 - 0.7 / 0.9) < 0.005,
    JSON.stringify({ tilt: [c0.tilt, c1.tilt, c2.tilt], r1: +r1.toFixed(4), r2: +r2.toFixed(4) }));
  T.check('chase: the camera stays as far from the point it looks at', c0.dist > 10 && Math.abs(c1.dist - c0.dist) < 0.01 && Math.abs(c2.dist - c0.dist) < 0.01, JSON.stringify([c0.dist, c1.dist, c2.dist]));

  // iso (phone lying): the setting moves nothing
  await page.evaluate(() => document.querySelector('[data-set="camera"] button[data-v="iso"]').click());
  await pick('0'); const i0 = await view('iso');
  await pick('2'); const i2 = await view('iso');
  T.check('iso: the camera does not move', JSON.stringify(i0) === JSON.stringify(i2), JSON.stringify([i0, i2]));

  T.check('no page errors', errors.length === 0, errors.join('\n'));
} finally {
  await browser.close();
  srv.close();
}
T.done();
