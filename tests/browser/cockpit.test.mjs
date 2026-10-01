// The cockpit view and the photo mode (the Jezero Ring, the player on autopilot). The cockpit is no longer a race camera: the settings
// have four (isometric, behind the car, kino, TV; an old save with the cockpit gets kino) and so has the camera's change in the race (C,
// the button on the HUD, the pause; kept as the setting). The pause's Foto: the race stands, the HUD and the controls hidden, the camera
// round the car (a drag turns it round, the car stays in the middle), the lens and the filter on the picture, the picture saved (a PNG
// sharper than the screen, with the filter), Nazaj: the pause and the race's camera again. The replay keeps the cockpit among its
// cameras: the camera at the followed car's driver's eyes (in the car, about a metre over the road, looking along it), the cockpit
// drawn (the steering wheel turning with the front wheels), the sky over the world; the formula's own cockpit (the camera in the
// helmet), the prototype's (the formula's wheel under a roof), the electric car's D; the replay's Foto.
//   node tests/browser/cockpit.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('cockpit view and photo mode');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'iso', track: 'jezero', car: 0 }, { width: 844, height: 390 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  // step the race (paused, on autopilot), two frames drawn, paused again
  const step = (t) => page.evaluate((t) => new Promise(res => { const g = window.__game; g.pause(); g.sim(t, true); g.resume();
    requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); res(); })); }), t);
  const frames = (n) => page.evaluate((n) => new Promise(res => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  // the camera and the cockpit as drawn, against the car it follows (in the replay: the followed one, posed from the recording)
  const view = () => page.evaluate(() => { const g = window.__game, R = g.replay, P = R ? g.race.cars[R.k] : g.race.player, C = Render.camera, ck = Render.cockpit, f = new THREE.Vector3(0, 0, -1).applyQuaternion(C.quaternion);
    return { d: Math.hypot(C.position.x - P.x, C.position.z - P.z), up: C.position.y - (P.roadY != null ? P.roadY : P.y || 0), ang: Math.abs(Core.wrapPi(Math.atan2(f.z, f.x) - P.h)),
      ck: ck && { formula: ck.formula, open: ck.open, gear: ck.gear, wheel: +ck.wheel.toFixed(3), sky: ck.sky, near: ck.near, followed: ck.car === P }, delta: +(P.delta || 0).toFixed(4), cam: g.S.camera }; });
  // where the car is on the picture (-1..1 both ways) and how far the camera is from it
  const onPic = () => page.evaluate(() => { const g = window.__game, P = g.race.player, C = Render.camera, p = new THREE.Vector3(P.x, (P.y || 0) + 0.7, P.z).project(C);
    return { x: +p.x.toFixed(3), y: +p.y.toFixed(3), camD: +Math.hypot(C.position.x - P.x, C.position.y - (P.y || 0), C.position.z - P.z).toFixed(2), cx: C.position.x, cz: C.position.z, fov: C.fov }; });
  // a whole race on autopilot to the results, then its replay with the cockpit camera (TV → behind the car → from above → the cockpit)
  const replayCockpit = async (model) => {
    await page.evaluate((model) => { const g = window.__game; g.pause(); g.S.car = Core.MODELS.findIndex(m => m.id === model); }, model);
    await startTrack(page, 'jezero');
    await page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 300 && g.phase !== 'done'; k++) g.sim(2, true); });
    await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 120000 });
    await act('replay'); await frames(3);
    const cams = [];
    for (let k = 0; k < 3; k++) { await act('rp-cam'); await frames(2); cams.push(await page.evaluate(() => document.getElementById('rp-cam').textContent)); }
    await act('rp-speed'); await act('rp-speed'); await frames(12);   // (4×: into the race, away from the grid)
    return cams;
  };

  // 1. the settings: four cameras, no cockpit; an old save with the cockpit gets kino
  await act('to-settings'); await page.waitForTimeout(200);
  const row = await page.evaluate(() => [...document.querySelectorAll('[data-set="camera"] button')].map(b => b.dataset.v).join(','));
  T.check('Nastavitve: four cameras (isometric, behind the car, kino, TV), no cockpit', row === 'iso,chase,kino,tv', row);
  {
    const old = await openGame(browser, srv.base + '/index.html', { camera: 'cockpit' }, { width: 844, height: 390 });
    const s = await old.page.evaluate(() => ({ cam: window.__game.S.camera }));
    T.check('an old save with the cockpit camera: kino (also with the phone lying)', s.cam === 'kino', JSON.stringify(s));
    await old.ctx.close();
  }
  await page.evaluate(() => document.querySelector('[data-set="camera"] button[data-v="kino"]').click());
  await act('settings-done');

  // 2. the camera changed in the race: C, the HUD's button, the pause; kept (a computer: all four in turn, never the cockpit)
  await startTrack(page, 'jezero');
  await step(8);
  await page.evaluate(() => window.__game.resume()); await frames(2);
  await page.keyboard.press('KeyC'); await page.waitForTimeout(250);
  const c1 = await page.evaluate(() => ({ cam: window.__game.S.camera, saved: JSON.parse(localStorage.getItem('tdgp-settings')).camera, toast: document.getElementById('toast').textContent, ck: !!Render.cockpit }));
  T.check('C in the race: the next camera (after kino the TV one), kept, a note', c1.cam === 'tv' && c1.saved === 'tv' && /Kamera: TV/.test(c1.toast) && !c1.ck, JSON.stringify(c1));
  const btn = await page.evaluate(() => { const b = document.getElementById('btn-cam'); return !b.classList.contains('off') && getComputedStyle(b).display !== 'none'; });
  await page.evaluate(() => document.getElementById('btn-cam').click()); await frames(2);
  const c2a = await page.evaluate(() => window.__game.S.camera);
  await page.evaluate(() => document.getElementById('btn-cam').click()); await frames(2);
  const c2 = await page.evaluate(() => ({ cam: window.__game.S.camera, fov: Render.camera.fov }));
  T.check('the camera button on the HUD: the next ones (after TV the isometric one, then behind the car)', btn && c2a === 'iso' && c2.cam === 'chase', JSON.stringify({ btn, c2a, c2 }));
  await page.evaluate(() => window.__game.pause());
  const pc = await page.evaluate(() => document.getElementById('pause-cam').textContent);
  const seen = [];
  for (let k = 0; k < 4; k++) { await act('cam-next'); seen.push(await page.evaluate(() => window.__game.S.camera)); }
  const pc2 = await page.evaluate(() => ({ label: document.getElementById('pause-cam').textContent, cam: window.__game.S.camera }));
  T.check('in the pause: "Kamera: …" shows it and changes it, round all four and never to the cockpit', pc === 'Kamera: za avtom' && seen.join() === 'kino,tv,iso,chase' && pc2.label === 'Kamera: za avtom' && pc2.cam === 'chase',
    JSON.stringify({ pc, seen, pc2 }));

  // 3. the photo mode: the pause's Foto
  const t0 = await page.evaluate(() => window.__game.race.time);
  await act('photo'); await frames(2);
  const ph = await page.evaluate(() => { const g = window.__game, vis = (id) => { const e = document.getElementById(id); return !!e && !e.classList.contains('off') && getComputedStyle(e).display !== 'none'; };
    return { screen: g.screen, hud: vis('hud'), touch: vis('touch'), pauseBtn: vis('btn-pause'), ui: vis('s-photo'), sky: Render.skyOn, t: g.race.time }; });
  const p1 = await onPic();
  T.check('Foto: the race stands, the HUD and the controls hidden, the camera round the car (the car in the middle), the sky',
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
  T.check('Shrani sliko: a PNG file, sharper than the screen (1920 pixels across), black and white', !!shot && shot.w === 1920 && shot.h >= 800 && shot.bytes > 50000 && shot.filter === 'črno-belo' && /^dirka-jezero-\d{8}-\d{6}\.png$/.test(fname) && fname === shot.name,
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
  const p3 = await onPic(), cam3 = await page.evaluate(() => ({ cam: window.__game.S.camera, shot: !!Render.cam.shot, ck: !!Render.cockpit }));
  T.check('Nazaj: the pause again, the picture without the filter; Nadaljuj: the race\'s camera again (behind the car)', back.screen === 'pause' && back.css === '' && !back.shot && cam3.cam === 'chase' && !cam3.shot && !cam3.ck && p3.camD > 3,
    JSON.stringify({ back, cam3, p3 }));
  // (the electric car on the HUD: D, one gear)
  await page.evaluate(() => { const g = window.__game; g.pause(); g.S.car = Core.MODELS.findIndex(m => m.id === 'ev'); });
  await startTrack(page, 'jezero');
  await step(8);
  const hg = await page.evaluate(() => document.getElementById('h-gear').textContent);
  T.check('the electric car: D on the HUD (one gear)', hg === 'D', hg);

  // 4. the replay: the cockpit among its cameras, at the followed car's driver's eyes, the wheel turning with the front wheels; its own Foto
  const cams = await replayCockpit('pico');
  const v1 = await view();
  T.check('the replay: TV → behind the car → from above → the cockpit; the camera at the driver\'s eyes (in the car, about a metre over the road), looking along the car; the cockpit drawn, the sky',
    cams.join(',') === 'Za avtom,Od zgoraj,Kokpit' && v1.d < 1.2 && v1.up > 0.7 && v1.up < 1.6 && v1.ang < 0.35 && !!v1.ck && v1.ck.followed && !v1.ck.formula && v1.ck.sky && v1.ck.near < 1, JSON.stringify({ cams, v1 }));
  let turned = null;   // (a bend: the recording's front wheels turned)
  for (let k = 0; k < 60 && !turned; k++) { await frames(2); const v = await view(); if (Math.abs(v.delta) > 0.03) turned = v; }
  T.check('the steering wheel turns with the front wheels (clockwise for a right turn, as the driver sees it)', !!turned && Math.sign(turned.ck.wheel) === -Math.sign(turned.delta) && Math.abs(turned.ck.wheel) > 0.2, JSON.stringify(turned));
  await act('rp-photo'); await frames(2);
  const rp = await page.evaluate(() => ({ screen: window.__game.screen, ui: document.getElementById('replay-ui').classList.contains('off'), shot: !!Render.cam.shot }));
  await act('ph-exit'); await frames(2);
  const rp2 = await page.evaluate(() => ({ ui: !document.getElementById('replay-ui').classList.contains('off'), shot: !!Render.cam.shot }));
  T.check('the replay\'s Foto, and back to the replay', rp.screen === 'photo' && rp.ui && rp.shot && rp2.ui && !rp2.shot, JSON.stringify({ rp, rp2 }));
  await act('rp-exit');

  // 5. the formula in the replay's cockpit: the camera in the helmet, its own cockpit
  await replayCockpit('formula');
  const v3 = await view();
  T.check('the formula: the camera inside the helmet (lower, the halo right in front: a nearer near plane), its own cockpit', !!v3.ck && v3.ck.formula && v3.d < 1 && v3.up > 0.5 && v3.up < 1.1 && v3.ck.near <= 0.12 && v3.ang < 0.35, JSON.stringify(v3));
  await act('rp-exit');

  // 6. the prototype: the formula's wheel (its display with the gear) in a closed canopy, the camera low in the car; the electric car: D on its
  // gear display
  await replayCockpit('lm');
  const v5 = await view();
  T.check('the prototype: the formula\'s wheel (a display with the gear) in its closed canopy, the camera low in the car',
    !!v5.ck && v5.ck.formula && !v5.ck.open && /^[1-7]$/.test(v5.ck.gear) && v5.d < 1 && v5.up > 0.6 && v5.up < 1.1 && v5.ck.near <= 0.16 && v5.ang < 0.35, JSON.stringify(v5));
  await act('rp-exit');
  await replayCockpit('ev');
  const v6 = await view();
  T.check('the electric car: D on its gear display', !!v6.ck && !v6.ck.formula && v6.ck.gear === 'D', JSON.stringify(v6));
  await act('rp-exit');

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
