// The cockpit camera and the photo mode (the Jezero Ring and the Red Bull Ring, the player on autopilot): the settings' fourth camera
// (Kokpit); a race from the driver's seat: the camera at the driver's eyes (in the car, about a metre over the road, looking along it),
// the cockpit drawn (the steering wheel turning with the front wheels), the sky over the world; the camera changed in the race (C, the
// button on the HUD, kept as the setting); the formula's own cockpit (the camera in the helmet); the pause's Foto: the race stands, the
// HUD and the controls hidden, the camera round the car (a drag turns it round, the car stays in the middle), the lens and the filter
// on the picture, the picture saved (a PNG sharper than the screen, with the filter), Nazaj: the pause and the race's camera again;
// the prototype's cockpit (the formula's wheel under a roof), the electric car's D; the replay of a race driven from the cockpit: from the cockpit, and its Foto.
//   node tests/browser/cockpit.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('cockpit camera and photo mode');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'iso', track: 'jezero', car: 0 }, { width: 844, height: 390 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  // step the race (paused, on autopilot), two frames drawn, paused again
  const step = (t) => page.evaluate((t) => new Promise(res => { const g = window.__game; g.pause(); g.sim(t, true); g.resume();
    requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); res(); })); }), t);
  const frames = (n) => page.evaluate((n) => new Promise(res => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const view = () => page.evaluate(() => { const g = window.__game, P = g.race.player, C = Render.camera, ck = Render.cockpit, f = new THREE.Vector3(0, 0, -1).applyQuaternion(C.quaternion);
    return { d: Math.hypot(C.position.x - P.x, C.position.z - P.z), up: C.position.y - (P.roadY != null ? P.roadY : P.y || 0), ang: Math.abs(Core.wrapPi(Math.atan2(f.z, f.x) - P.h)),
      ck: ck && { formula: ck.formula, open: ck.open, gear: ck.gear, wheel: +ck.wheel.toFixed(3), sky: ck.sky, near: ck.near }, delta: +(P.delta || 0).toFixed(4), cam: g.S.camera }; });
  // where the car is on the picture (-1..1 both ways) and how far the camera is from it
  const onPic = () => page.evaluate(() => { const g = window.__game, P = g.race.player, C = Render.camera, p = new THREE.Vector3(P.x, (P.y || 0) + 0.7, P.z).project(C);
    return { x: +p.x.toFixed(3), y: +p.y.toFixed(3), camD: +Math.hypot(C.position.x - P.x, C.position.y - (P.y || 0), C.position.z - P.z).toFixed(2), cx: C.position.x, cz: C.position.z, fov: C.fov }; });

  // 1. the settings: the fourth camera
  await act('to-settings'); await page.waitForTimeout(200);
  const row = await page.evaluate(() => [...document.querySelectorAll('[data-set="camera"] button')].map(b => b.textContent).join(','));
  await page.evaluate(() => document.querySelector('[data-set="camera"] button[data-v="cockpit"]').click());
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-settings')).camera);
  T.check('Nastavitve: Kokpit, the fourth camera, chosen and kept', /Kokpit · ležeče/.test(row) && row.split(',').length === 4 && saved === 'cockpit', row + ' / ' + saved);
  await act('settings-done');

  // 2. a race from the driver's seat
  await startTrack(page, 'jezero');
  await step(8);
  const v1 = await view();
  T.check('the cockpit: the camera at the driver\'s eyes (in the car, about a metre over the road), looking along the car; the cockpit drawn, the sky over the world',
    v1.d < 1.2 && v1.up > 0.7 && v1.up < 1.6 && v1.ang < 0.35 && !!v1.ck && !v1.ck.formula && v1.ck.sky && v1.ck.near < 1, JSON.stringify(v1));
  let turned = null;   // (a bend: the autopilot turns the front wheels)
  for (let k = 0; k < 16 && !turned; k++) { await step(0.6); const v = await view(); if (Math.abs(v.delta) > 0.03) turned = v; }
  T.check('the steering wheel turns with the front wheels (clockwise for a right turn, as the driver sees it)', !!turned && Math.sign(turned.ck.wheel) === -Math.sign(turned.delta) && Math.abs(turned.ck.wheel) > 0.2, JSON.stringify(turned));

  // 3. the camera changed in the race: C, the HUD's button; kept (a computer: all four in turn)
  await page.evaluate(() => window.__game.resume()); await frames(2);
  await page.keyboard.press('KeyC'); await page.waitForTimeout(250);
  const c1 = await page.evaluate(() => ({ cam: window.__game.S.camera, saved: JSON.parse(localStorage.getItem('tdgp-settings')).camera, toast: document.getElementById('toast').textContent }));
  T.check('C in the race: the next camera (after the cockpit the isometric one), kept, a note', c1.cam === 'iso' && c1.saved === 'iso' && /Kamera: izometrična/.test(c1.toast), JSON.stringify(c1));
  const btn = await page.evaluate(() => { const b = document.getElementById('btn-cam'); return !b.classList.contains('off') && getComputedStyle(b).display !== 'none'; });
  await page.evaluate(() => document.getElementById('btn-cam').click()); await frames(2);
  const c2 = await page.evaluate(() => ({ cam: window.__game.S.camera, fov: Render.camera.fov }));
  T.check('the camera button on the HUD: the next one (behind the car)', btn && c2.cam === 'chase', JSON.stringify({ btn, c2 }));
  await page.evaluate(() => window.__game.pause());
  const pc = await page.evaluate(() => document.getElementById('pause-cam').textContent);
  await act('cam-next'); await act('cam-next');
  const pc2 = await page.evaluate(() => ({ label: document.getElementById('pause-cam').textContent, cam: window.__game.S.camera }));
  T.check('in the pause: "Kamera: …" shows it and changes it', pc === 'Kamera: za avtom' && pc2.label === 'Kamera: kokpit' && pc2.cam === 'cockpit', JSON.stringify({ pc, pc2 }));

  // 4. the formula: the camera in the helmet, its own cockpit
  await page.evaluate(() => { window.__game.S.car = 6; });
  await startTrack(page, 'rbring');
  for (let k = 0; k < 12; k++) { const t = await page.evaluate(() => { const R = window.__game.race; return R.state === 'racing' ? R.time : -1; }); if (t > 4) break; await step(3); }
  const v3 = await view();
  T.check('the formula: the camera inside the helmet (lower, the halo right in front: a nearer near plane), its own cockpit', !!v3.ck && v3.ck.formula && v3.d < 1 && v3.up > 0.5 && v3.up < 1.1 && v3.ck.near <= 0.12 && v3.ang < 0.35, JSON.stringify(v3));

  // 5. the photo mode: the pause's Foto
  await page.evaluate(() => window.__game.pause());
  const t0 = await page.evaluate(() => window.__game.race.time);
  await act('photo'); await frames(2);
  const ph = await page.evaluate(() => { const g = window.__game, vis = (id) => { const e = document.getElementById(id); return !!e && !e.classList.contains('off') && getComputedStyle(e).display !== 'none'; };
    return { screen: g.screen, hud: vis('hud'), touch: vis('touch'), pauseBtn: vis('btn-pause'), ui: vis('s-photo'), sky: Render.skyOn, t: g.race.time }; });
  const p1 = await onPic();
  T.check('Foto: the race stands, the HUD and the controls hidden, the camera out of the car and round it (the car in the middle), the sky',
    ph.screen === 'photo' && !ph.hud && !ph.touch && !ph.pauseBtn && ph.ui && ph.sky && ph.t === t0 && p1.camD > 3 && Math.abs(p1.x) < 0.03 && Math.abs(p1.y) < 0.03, JSON.stringify({ ph, p1 }));
  await page.mouse.move(420, 160); await page.mouse.down(); await page.mouse.move(560, 175, { steps: 6 }); await page.mouse.up(); await frames(2);
  const p2 = await onPic();
  T.check('a drag turns the camera round the car (the car stays in the middle, as far away)', Math.hypot(p2.cx - p1.cx, p2.cz - p1.cz) > 2 && Math.abs(p2.x) < 0.03 && Math.abs(p2.y) < 0.03 && Math.abs(p2.camD - p1.camD) < 0.5, JSON.stringify({ p1, p2 }));
  await act('ph-lens'); await act('ph-filter'); await act('ph-filter'); await frames(2);
  const f = await page.evaluate(() => ({ fov: Render.camera.fov, lens: document.getElementById('ph-lens').textContent, filt: document.getElementById('ph-filter').textContent, css: document.getElementById('gl').style.filter }));
  T.check('Objektiv 50 mm (a narrower view), Filter: črno-belo on the picture', /50 mm/.test(f.lens) && Math.abs(f.fov - 38) < 0.5 && /črno-belo/.test(f.filt) && /grayscale/.test(f.css), JSON.stringify(f));
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), act('ph-save')]);
  const shot = await page.evaluate(() => window.__game.lastPhoto);
  const fname = dl.suggestedFilename();
  T.check('Shrani sliko: a PNG file, sharper than the screen (1920 pixels across), black and white', !!shot && shot.w === 1920 && shot.h >= 800 && shot.bytes > 50000 && shot.filter === 'črno-belo' && /^dirka-rbring-\d{8}-\d{6}\.png$/.test(fname) && fname === shot.name,
    JSON.stringify({ shot, fname }));
  const gray = await page.evaluate(() => new Promise(res => {   // (the saved picture's own pixels: grey)
    const cv = Render.snapshot(window.__game.race.player, 'iso', 400), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let colour = 0; for (let i = 0; i < d.length; i += 4 * 97) colour += Math.abs(d[i] - d[i + 1]) + Math.abs(d[i + 1] - d[i + 2]);
    res({ w: cv.width, colour: colour > 0 }); }));
  T.check('a still drawn on its own (Render.snapshot) has its colours (the filter goes on the saved one only)', gray.colour && gray.w >= 844, JSON.stringify(gray));
  await act('ph-hide'); await frames(1);
  const hid = await page.evaluate(() => getComputedStyle(document.querySelector('#s-photo .ph-bar')).display);
  await page.mouse.click(420, 200); await frames(1);
  const shown = await page.evaluate(() => getComputedStyle(document.querySelector('#s-photo .ph-bar')).display);
  T.check('Skrij gumbe: only the picture; a tap brings the buttons back', hid === 'none' && shown !== 'none', hid + ' → ' + shown);
  await act('ph-exit'); await frames(2);
  const back = await page.evaluate(() => ({ screen: window.__game.screen, css: document.getElementById('gl').style.filter, shot: !!Render.cam.shot }));
  await page.evaluate(() => window.__game.resume()); await frames(3);
  const v4 = await view();
  T.check('Nazaj: the pause again, the picture without the filter; Nadaljuj: the cockpit again', back.screen === 'pause' && back.css === '' && !back.shot && !!v4.ck && v4.d < 1, JSON.stringify({ back, v4 }));

  // 5b. the prototype: the formula's wheel (its display with the gear) in a closed canopy, the camera low in the car; the electric car:
  // D on its gear display and on the HUD (one gear)
  await page.evaluate(() => { const g = window.__game; g.pause(); g.S.car = Core.MODELS.findIndex(m => m.id === 'lm'); });
  await startTrack(page, 'rbring');
  for (let k = 0; k < 12; k++) { const t = await page.evaluate(() => { const R = window.__game.race; return R.state === 'racing' ? R.time : -1; }); if (t > 4) break; await step(3); }
  const v5 = await view();
  T.check('the prototype: the formula\'s wheel (a display with the gear) in its closed canopy, the camera low in the car',
    !!v5.ck && v5.ck.formula && !v5.ck.open && /^[1-7]$/.test(v5.ck.gear) && v5.d < 1 && v5.up > 0.6 && v5.up < 1.1 && v5.ck.near <= 0.16 && v5.ang < 0.35, JSON.stringify(v5));
  await page.evaluate(() => { const g = window.__game; g.pause(); g.S.car = Core.MODELS.findIndex(m => m.id === 'ev'); });
  await startTrack(page, 'jezero');
  await step(8);
  const v6 = await view(), hg = await page.evaluate(() => document.getElementById('h-gear').textContent);
  T.check('the electric car: D on its gear display and on the HUD (one gear)', !!v6.ck && !v6.ck.formula && v6.ck.gear === 'D' && hg === 'D', JSON.stringify({ v6, hg }));

  // 6. the replay of a race driven from the cockpit: from the cockpit (the camera the player drove with), the others in turn, its own Foto
  await page.evaluate(() => { const g = window.__game; g.pause(); g.S.car = 0; });
  await startTrack(page, 'jezero');
  await page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 300 && g.phase !== 'done'; k++) g.sim(2, true); });
  await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 120000 });
  await act('replay'); await frames(3);
  const rv = await page.evaluate(() => { const R = Render.cockpit; return { cam: document.getElementById('rp-cam').textContent, ck: R && { formula: R.formula, car: R.car && R.car.isPlayer } }; });
  const cams = [];
  for (let k = 0; k < 4; k++) { await act('rp-cam'); await frames(2); cams.push(await page.evaluate(() => document.getElementById('rp-cam').textContent)); }
  await act('rp-photo'); await frames(2);
  const rp = await page.evaluate(() => ({ screen: window.__game.screen, ui: document.getElementById('replay-ui').classList.contains('off'), shot: !!Render.cam.shot }));
  await act('ph-exit'); await frames(2);
  const rp2 = await page.evaluate(() => ({ ui: !document.getElementById('replay-ui').classList.contains('off'), shot: !!Render.cam.shot }));
  T.check('the replay: from the cockpit (the followed car\'s) → TV → behind the car → from above → the cockpit; Foto there, and back to the replay', rv.cam === 'Kokpit' && !!rv.ck && rv.ck.car && cams.join(',') === 'TV,Za avtom,Od zgoraj,Kokpit' && rp.screen === 'photo' && rp.ui && rp.shot && rp2.ui && !rp2.shot,
    JSON.stringify({ rv, cams, rp, rp2 }));
  await act('rp-exit');

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
