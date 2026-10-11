// Avtomatska kamera (Nastavitve): Izklop (the default: the camera as before), Avtomatski zoom (the chase and iso cameras further out the
// faster the car goes against its own top speed: stopped 0.75 of the distance, half its top speed 1, flat out 1.3; the car stays where it
// is in the picture) and Avtomatski zoom in nagib (the same, and the chase camera tilts from 50 % stopped to 30 % flat out instead of
// Nagib kamere; the iso camera does not tilt). The change is eased, so a sudden change of speed does not jolt the view.
//   node tests/browser/autocam.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Avtomatska kamera: the camera further out the faster the car goes (and the chase camera tilting with it)');
const srv = await serve();
const browser = await launch();
const near = (a, b, e = 0.05) => Math.abs(a - b) < e;
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { camera: 'chase', weather: 'dry', track: 'jezero' }, { width: 390, height: 844 });
  const pick = (set, v) => page.evaluate(([set, v]) => document.querySelector(`[data-set="${set}"] button[data-v="${v}"]`).click(), [set, v]);
  // the camera once it has settled with the player's car at `frac` of its top speed (or `kmh`), drawn in the given camera: its distance
  // from the point it looks at, its tilt below the horizon (degrees), the car on the screen (NDC); `model`: another car's model for the shot
  const view = (mode, frac, o = {}) => page.evaluate(([mode, frac, o]) => {
    const g = window.__game, P = g.race.player, C = Render.camera, m0 = P.m, s0 = [P.speed, P.vx, P.vz];
    if (o.model) P.m = Core.MODELS.find(m => m.id === o.model);
    const v = o.kmh != null ? o.kmh / 3.6 : frac * Render.topSpeedOf(P.m);
    g.pause(); P.speed = v; P.vx = Math.cos(P.h) * v; P.vz = Math.sin(P.h) * v;
    Render.resetCam(); for (let i = 0; i < 12; i++) Render.frame(0.5, 1, P, mode, { noFx: true });   // (6 s: the camera's own easing settles)
    const d = new THREE.Vector3(); C.getWorldDirection(d); const p = new THREE.Vector3(P.x, (P.y || 0) + 0.6, P.z).project(C);
    const r = { dist: +Render.cam.vd.toFixed(3), tilt: +(Math.asin(-d.y) * 180 / Math.PI).toFixed(3), x: +p.x.toFixed(4), y: +p.y.toFixed(4) };
    P.m = m0; [P.speed, P.vx, P.vz] = s0; return r;
  }, [mode, frac, o]);
  const wiring = () => page.evaluate(() => ({ set: window.__game.S.autoCam, auto: Render.cam.auto, dim: document.querySelector('[data-set="camTilt"]').closest('.row').classList.contains('dim') }));

  await startTrack(page, 'jezero');
  const car = await page.evaluate(() => { const M = window.__game.race.player.m; return M.id + ' ' + Math.round(Render.topSpeedOf(M) * 3.6) + ' km/h'; });

  // the default: off, the camera as before (chase 46 m × Oddaljenost Srednje 1.4, 25 % further out from 55 m/s; iso 57 m × 1.4, 10 % from 60 m/s)
  const w0 = await wiring();
  const c0 = await view('chase', 0), cF = await view('chase', 0, { kmh: 230 }), i0 = await view('iso', 0), iF = await view('iso', 0, { kmh: 230 });
  T.check('the default: off', w0.set === 0 && w0.auto === 0 && !w0.dim, JSON.stringify(w0));
  T.check('off: the cameras as before (chase 64.4 → 80.5 m, iso 79.8 → 87.8 m)', near(c0.dist, 64.4) && near(cF.dist, 80.5) && near(i0.dist, 79.8) && near(iF.dist, 87.78) && near(c0.tilt, 0.98 * 0.9 * 180 / Math.PI, 0.01),
    JSON.stringify({ c0, cF, i0, iF }));

  // the setting is wired through (saved, and passed to the camera); Nagib kamere dims under the zoom and tilt
  await pick('autoCam', '1'); const w1 = await wiring();
  await pick('autoCam', '2'); const w2 = await wiring();
  await pick('autoCam', '0'); const w3 = await wiring();
  T.check('the choice is saved and passed to the camera; Nagib kamere dims only under the zoom and tilt', w1.set === 1 && w1.auto === 1 && !w1.dim && w2.set === 2 && w2.auto === 2 && w2.dim && w3.set === 0 && w3.auto === 0 && !w3.dim,
    JSON.stringify([w1, w2, w3]));

  // Avtomatski zoom, chase: 0.75 / 1 / 1.3 of 64.4 m, the tilt that of Nagib kamere (10 %), the car where it was in the picture
  await pick('autoCam', '1');
  const z0 = await view('chase', 0), zH = await view('chase', 0.5), zF = await view('chase', 1), zQ = await view('chase', 0.25);
  T.check(`auto zoom, chase: close stopped, medium at half the top speed, far flat out (${car})`, near(z0.dist, 48.3) && near(zH.dist, 64.4) && near(zF.dist, 83.72) && zQ.dist > z0.dist && zQ.dist < zH.dist,
    JSON.stringify([z0.dist, zQ.dist, zH.dist, zF.dist]));
  T.check('auto zoom, chase: the tilt of Nagib kamere (10 %) at every speed', [z0, zH, zF].every(v => near(v.tilt, c0.tilt, 0.01)), JSON.stringify([z0.tilt, zH.tilt, zF.tilt]));
  T.check('auto zoom, chase: the car stays where it is in the picture', Math.abs(zF.y - z0.y) < 0.01 && Math.abs(zH.y - z0.y) < 0.01 && Math.abs(zF.x - z0.x) < 0.01, JSON.stringify([z0, zH, zF]));

  // a slow car is far out at its own top speed (Mravlja, ~134 km/h)
  const mF = await view('chase', 0, { model: 'mravlja', kmh: 134 }), mH = await view('chase', 0, { model: 'mravlja', kmh: 67 });
  T.check('auto zoom: against the car\'s own top speed (Mravlja far out at ~134 km/h, medium at 67 km/h)', near(mF.dist, 83.72, 0.3) && near(mH.dist, 64.4, 0.3), JSON.stringify([mH.dist, mF.dist]));

  // eased: from standing to flat out, a quarter of a second later the camera is only a little further out
  const ease = await page.evaluate(() => { const g = window.__game, P = g.race.player, v = Render.topSpeedOf(P.m), s0 = [P.speed, P.vx, P.vz];
    g.pause(); P.speed = 0; P.vx = 0; P.vz = 0; Render.resetCam(); for (let i = 0; i < 30; i++) Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
    const a = Render.cam.vd; P.speed = v; P.vx = Math.cos(P.h) * v; P.vz = Math.sin(P.h) * v; for (let i = 0; i < 15; i++) Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
    const b = Render.cam.vd; [P.speed, P.vx, P.vz] = s0; return { a: +a.toFixed(3), b: +b.toFixed(3) }; });
  T.check('auto zoom: eased (0.25 s after a jump to full speed only a little further out)', near(ease.a, 48.3) && ease.b > ease.a + 2 && ease.b < ease.a + 12, JSON.stringify(ease));

  // Avtomatski zoom, iso: 0.75 / 1 / 1.3 of 79.8 m, no tilt; at speed the car where it was (the look-ahead grows with the distance)
  await pick('camera', 'iso');
  const j0 = await view('iso', 0), jH = await view('iso', 0.5), jF = await view('iso', 1);
  T.check('auto zoom, iso: close stopped, medium at half the top speed, far flat out', near(j0.dist, 59.85) && near(jH.dist, 79.8) && near(jF.dist, 103.74), JSON.stringify([j0.dist, jH.dist, jF.dist]));
  T.check('auto zoom, iso: the car stays where it is in the picture at speed', Math.hypot(jF.x - jH.x, jF.y - jH.y) < 0.02, JSON.stringify([jH, jF]));

  // Avtomatski zoom in nagib: the same distances; the chase camera tilts 50 % stopped, 40 % at half, 30 % flat out (Nagib kamere does
  // not count); the iso camera does not tilt
  await pick('autoCam', '2');
  const n0 = await view('iso', 0), nF = await view('iso', 1);
  T.check('zoom and tilt, iso: the distances of the auto zoom, no tilt', near(n0.dist, 59.85) && near(nF.dist, 103.74) && near(n0.tilt, j0.tilt, 0.01) && near(nF.tilt, j0.tilt, 0.01), JSON.stringify([n0, nF]));
  await pick('camera', 'chase'); await pick('camTilt', '2');
  const t0 = await view('chase', 0), tH = await view('chase', 0.5), tF = await view('chase', 1), deg = (k) => 0.98 * (1 - k) * 180 / Math.PI;
  T.check('zoom and tilt, chase: the distances of the auto zoom', near(t0.dist, 48.3) && near(tH.dist, 64.4) && near(tF.dist, 83.72), JSON.stringify([t0.dist, tH.dist, tF.dist]));
  T.check('zoom and tilt, chase: tilt 50 % stopped, 40 % at half, 30 % flat out (Nagib kamere 30 % does not count)', near(t0.tilt, deg(0.5), 0.01) && near(tH.tilt, deg(0.4), 0.01) && near(tF.tilt, deg(0.3), 0.01),
    JSON.stringify({ tilt: [t0.tilt, tH.tilt, tF.tilt], want: [deg(0.5), deg(0.4), deg(0.3)].map(v => +v.toFixed(3)) }));

  // off again: the camera exactly as before
  await pick('camTilt', '0'); await pick('autoCam', '0');
  const o0 = await view('chase', 0), oF = await view('chase', 0, { kmh: 230 });
  T.check('off again: the camera as before', JSON.stringify(o0) === JSON.stringify(c0) && JSON.stringify(oF) === JSON.stringify(cF), JSON.stringify([o0, c0, oF, cF]));

  T.check('no page errors', errors.length === 0, errors.join('\n'));
} finally {
  await browser.close();
  srv.close();
}
T.done();
