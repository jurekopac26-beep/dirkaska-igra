// Položaj avta (Nastavitve): the car can sit further back / lower in the frame. Option 1 as now, option 2 is 2 m, option 3 is 5 m.
// It applies to the two final cameras — za avtom (chase) and izometrična (iso); the default (option 1) changes nothing.
//   node tests/browser/carlow.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Položaj avta: the car sits lower / further back in the frame (chase and iso)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { camera: 'chase', weather: 'dry', track: 'jezero' }, { width: 390, height: 844 });
  const pick = (set, v) => page.evaluate(([set, v]) => document.querySelector(`[data-set="${set}"] button[data-v="${v}"]`).click(), [set, v]);
  // the player's car projected to the screen (NDC y: +1 top, -1 bottom) once the camera has settled, drawn in the given camera
  const carY = (mode) => page.evaluate((mode) => { const g = window.__game, P = g.race.player, C = Render.camera;
    g.pause(); Render.resetCam(); for (let i = 0; i < 60; i++) Render.frame(1 / 60, 1, P, mode, {});
    const p = new THREE.Vector3(P.x, (P.y || 0) + 0.6, P.z).project(C); return { x: +p.x.toFixed(4), y: +p.y.toFixed(4) }; }, mode);
  const wiring = () => page.evaluate(() => ({ set: window.__game.S.carLow, back: Render.cam.userBack }));

  await startTrack(page, 'jezero');

  // the setting is wired through (saved, and mapped to 0 / 2 / 5 metres)
  await pick('carLow', '0'); const c0 = await carY('chase'); const w0 = await wiring();
  await pick('carLow', '1'); const c1 = await carY('chase'); const w1 = await wiring();
  await pick('carLow', '2'); const c2 = await carY('chase'); const w2 = await wiring();
  T.check('the choice is saved and maps to metres (0, 2, 5)', w0.set === 0 && w0.back === 0 && w1.set === 1 && w1.back === 2 && w2.set === 2 && w2.back === 5, JSON.stringify([w0, w1, w2]));

  // chase (phone upright): the more it is set back, the lower the car sits (NDC y decreases)
  T.check('chase: the car sits lower the more it is set back', c2.y < c1.y && c1.y < c0.y, JSON.stringify([c0, c1, c2]));

  // iso (phone lying): the car shifts further from its default spot the more it is set; the default moves nothing
  await pick('camera', 'iso');
  await pick('carLow', '0'); const i0 = await carY('iso');
  await pick('carLow', '1'); const i1 = await carY('iso');
  await pick('carLow', '2'); const i2 = await carY('iso');
  const d1 = Math.hypot(i1.x - i0.x, i1.y - i0.y), d2 = Math.hypot(i2.x - i0.x, i2.y - i0.y);
  T.check('iso: the car moves further back the more it is set', d2 > d1 && d1 > 0.001, JSON.stringify([i0, i1, i2, +d1.toFixed(4), +d2.toFixed(4)]));

  T.check('no page errors', errors.length === 0, errors.join('\n'));
} finally {
  await browser.close();
  srv.close();
}
T.done();
