// Položaj avta (Nastavitve): the car can sit further back / lower in the frame. Option 1 as now, then 2, 5, 7, 10, 15 and 20 m.
// It applies to the game's one camera, za avtom (chase); the default (option 1) changes nothing.
//   node tests/browser/carlow.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Položaj avta: the car sits lower / further back in the frame');
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
  await pick('carLow', '3'); const c3 = await carY('chase'); const w3 = await wiring();
  await pick('carLow', '4'); const c4 = await carY('chase'); const w4 = await wiring();
  await pick('carLow', '5'); const c5 = await carY('chase'); const w5 = await wiring();
  await pick('carLow', '6'); const c6 = await carY('chase'); const w6 = await wiring();
  T.check('the choice is saved and maps to metres (0, 2, 5, 7, 10, 15, 20)', [w0, w1, w2, w3, w4, w5, w6].every((w, i) => w.set === i && w.back === [0, 2, 5, 7, 10, 15, 20][i]), JSON.stringify([w0, w1, w2, w3, w4, w5, w6]));

  // chase (phone upright): the more it is set back, the lower the car sits (NDC y decreases)
  T.check('chase: the car sits lower the more it is set back', c6.y < c5.y && c5.y < c4.y && c4.y < c3.y && c3.y < c2.y && c2.y < c1.y && c1.y < c0.y, JSON.stringify([c0, c1, c2, c3, c4, c5, c6]));

  T.check('no page errors', errors.length === 0, errors.join('\n'));
} finally {
  await browser.close();
  srv.close();
}
T.done();
