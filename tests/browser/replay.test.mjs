// The replay after a race (Jezero Ring, the player on autopilot): the results screen's "Posnetek" plays the race back (the HUD and the
// on-screen controls hidden, the replay's own controls shown); the cars where the recording has them; the camera the player drove with
// (the isometric one over the car); pause, speed, the camera button (the player's own first, then TV: on a post away from the car, behind
// the car, the cockpit, the own one again), the car followed; "Končaj" back to the results. "Najboljši trenutki" (the results, or the
// replay's Trenutki): the start, the best moments of the race and the finish in the order they happened, each on the player's camera with
// the car of the moment followed and a caption (the camera button: TV for the rest of them); then back to the results. A race driven with
// the camera behind the car, the phone upright: its replay behind the car, the camera behind the next car (▶), at the start at once (⏮),
// Foto from it and back.
//   node tests/browser/replay.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('replay');
const srv = await serve();
const browser = await launch();
try {
  // a page with the game, its replay's frames counted (a software-rendered frame of a long telephoto view can take long: count the frames,
  // not the seconds); a race on autopilot to the results
  const open = async (camera, viewport) => {
    const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera, track: 'jezero' }, viewport);
    await page.evaluate(() => { window.__rf = 0; const o = Render.frame; Render.frame = function () { window.__rf++; return o.apply(this, arguments); }; });
    await startTrack(page, 'jezero');
    await page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 300 && g.phase !== 'done'; k++) g.sim(2, true); });
    await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 120000 });
    return { page, errors, act: (a) => page.evaluate((a) => window.__game.onAction(a), a),
      frames: (n) => page.evaluate((n) => new Promise(res => { const f0 = window.__rf, chk = () => window.__rf - f0 >= n ? res(window.__rf - f0) : setTimeout(chk, 20); chk(); }), n),
      // the replay as it is drawn now; the camera against the followed car: along its heading (behind: below 0), across it, above it, how
      // far (on the ground), its offset east and south (+x, +z: the isometric camera looks north)
      st: () => page.evaluate(() => { const g = window.__game, cam = Render.camera, P = g.replay, c = P ? g.race.cars[P.k] : g.race.player, el = (id) => document.getElementById(id);
        const info = el('rp-info').textContent, m = /(\d+):(\d+\.\d+)$/.exec(info), dx = cam.position.x - c.x, dz = cam.position.z - c.z, r1 = (v) => +v.toFixed(1);
        return { screen: g.screen, ui: !el('replay-ui').classList.contains('off'), hud: !el('hud').classList.contains('off'), touch: !el('touch').classList.contains('off'), info, t: m ? +m[1] * 60 + +m[2] : NaN,
          cam: el('rp-cam').textContent, mode: P ? P.cam : null, k: P ? P.k : -1, speed: el('rp-speed').textContent, play: el('rp-play').textContent, fov: cam.fov,
          along: r1(dx * Math.cos(c.h) + dz * Math.sin(c.h)), side: r1(-dx * Math.sin(c.h) + dz * Math.cos(c.h)), up: r1(cam.position.y - (c.y || 0)), camD: r1(Math.hypot(dx, dz)), dx: r1(dx), dz: r1(dz) }; }) };
  };
  const isoView = (v) => v.mode === 'iso' && v.cam === 'Od zgoraj' && v.fov === 30 && v.up > 35 && Math.abs(v.dx) < 25 && v.dz > 25 && v.dz < 80;   // (high over the car, north up)
  const chaseView = (v) => v.mode === 'chase' && v.cam === 'Za avtom' && v.fov === 58 && v.up > 30 && v.along < -8 && Math.abs(v.side) < -0.35 * v.along;   // (the phone upright: high behind the car; in a bend a little to its side)
  const tvView = (v) => v.mode === 'tv' && v.cam === 'TV' && v.camD > 12 && v.up < 20;   // (on a post beside the track, 9 m up)

  const { page, errors, act, frames, st } = await open('iso', { width: 844, height: 390 });
  const btn = await page.evaluate(() => !document.getElementById('res-replay').classList.contains('off'));
  await act('replay'); await frames(6);
  const a = await st();
  T.check('"Posnetek": the replay plays (its controls, no HUD, no touch controls), from the start, the player\'s car followed', btn && a.screen === 'none' && a.ui && !a.hud && !a.touch && a.t > 0.05 && a.t < 4 && /^Ti · /.test(a.info), JSON.stringify(a));
  T.check('the camera the player drove with: the isometric one, over the car', isoView(a), JSON.stringify(a));
  // the cars where the recording has them
  const pose = await page.evaluate(() => { const P = window.__game.race.player; return { x: P.x, z: P.z }; });
  T.check('the player\'s car posed from the recording (on the track, near the start)', Number.isFinite(pose.x) && Number.isFinite(pose.z), JSON.stringify(pose));
  // pause, speed
  await act('rp-play'); await frames(1); const p0 = await st(); await frames(4); const p1 = await st();
  T.check('pause: the time stands', p1.t === p0.t && p1.play === '▶', JSON.stringify({ p0: p0.t, p1: p1.t, play: p1.play }));
  // 1× and 2×: the replay's time against the game's clock over the same frames (each frame's time is the real one, at most 0.1 s: a slow
  // software-drawn frame counts 0.1 s)
  const rate = async () => { const a0 = await page.evaluate(() => window.__game.replay); await frames(8); const a1 = await page.evaluate(() => window.__game.replay); return (a1.t - a0.t) / Math.max(1e-6, a1.clk - a0.clk); };
  await act('rp-play'); await frames(1); const r1 = await rate();
  await act('rp-speed'); await frames(1); const r2 = await rate(), q1 = await st();
  T.check('1×: the recording\'s time with the game\'s clock; 2×: twice as fast', q1.speed === '2×' && r1 > 0.95 && r1 < 1.05 && r2 > 1.9 && r2 < 2.1, JSON.stringify({ r1: +r1.toFixed(3), r2: +r2.toFixed(3), speed: q1.speed }));
  // the camera, the car followed
  await act('rp-cam'); await frames(1); const c1 = await st();
  T.check('the camera button: TV next (on a post away from the car)', tvView(c1), JSON.stringify(c1));
  await act('rp-cam'); await frames(1); const c2 = await st();
  await act('rp-cam'); await frames(1); const c3 = await st();
  await act('rp-cam'); await frames(1); const c4 = await st();
  T.check('then behind the car → the cockpit → from above again (the player\'s own)', c2.cam === 'Za avtom' && c2.mode === 'chase' && c3.cam === 'Kokpit' && c3.mode === 'cockpit' && isoView(c4),
    [c1.cam, c2.cam, c3.cam, c4.cam].join(' → ') + ' ' + JSON.stringify(c4));
  await act('rp-next'); await frames(2); const n1 = await st();
  T.check('another car followed, the isometric camera over it', !/^Ti · /.test(n1.info) && /·/.test(n1.info) && n1.k !== a.k && isoView(n1), JSON.stringify(n1));
  // the end: back to the results
  await act('rp-exit'); await page.waitForTimeout(300); const e = await st();
  T.check('"Končaj": back to the results', e.screen === 'results' && !e.ui, JSON.stringify(e));

  // the highlights: from the results
  const hl = () => page.evaluate(() => { const g = window.__game, P = g.replay, el = (id) => document.getElementById(id), H = P && P.hl;
    return { screen: g.screen, on: !!H, i: H ? H.i : -1, n: H ? H.clips.length : 0, lbl: H ? H.clips[H.i].lbl : '', k: P ? P.k : -1, want: H ? H.clips[H.i].k : -2, t: P ? P.t : NaN, t0: H ? H.clips[H.i].t0 : NaN,
      cam: el('rp-cam').textContent, cap: el('rp-hl-cap').classList.contains('off') ? '' : el('rp-hl-cap').textContent, lit: el('rp-hl').classList.contains('on'), ui: !el('replay-ui').classList.contains('off') }; });
  const hb = await page.evaluate(() => !document.getElementById('res-hl').classList.contains('off'));
  await act('replay-hl'); await frames(3); const h0 = await hl();
  T.check('"Najboljši trenutki": the start first, on the player\'s camera (from above), the car on pole followed, a caption, the button lit', hb && h0.on && h0.i === 0 && h0.n >= 2 && h0.lbl === 'ŠTART' && h0.cam === 'Od zgoraj' && h0.k === h0.want && /ŠTART/.test(h0.cap) && h0.lit && h0.ui && h0.screen === 'none' && h0.t - h0.t0 < 3,
    JSON.stringify(h0));
  await act('rp-speed'); await act('rp-speed');   // (4x: the programme sooner through)
  // each moment on the player's camera; in the second one, the camera button: TV, the programme goes on with it
  const seen = [h0.lbl]; let last = h0, done = null, want = 'Od zgoraj', sw = null;
  for (let k = 0; k < 400 && !done; k++) {
    await frames(4); const h = await hl();
    if (!h.on) { done = h; break; }
    if (h.i !== last.i) { seen.push(h.lbl + (h.k === h.want && h.cam === want && h.cap.length > 3 ? '' : '!')); }
    if (h.i === 1 && !sw) { await act('rp-cam'); await frames(1); sw = await hl(); want = 'TV'; }
    last = h;
  }
  T.check('the camera button in the moments: TV, the programme goes on (the same moment, its caption)', !!sw && sw.on && sw.i === 1 && sw.cam === 'TV' && sw.cap.length > 3 && sw.lit, JSON.stringify(sw));
  T.check('then the moments in turn (overtakes, crashes), the finish last, each with its car followed on the camera on and a caption; then the results again',
    !!done && done.screen === 'results' && !done.ui && seen[seen.length - 1] === 'CILJ' && seen.length === last.n && seen.every(x => !x.endsWith('!')) && seen.slice(1, -1).every(x => x === 'PREHITEVANJE' || x === 'NESREČA'),
    seen.join(' > '));
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await page.context().close();

  // a race driven with the camera behind the car, the phone upright
  const B = await open('chase', { width: 390, height: 844 });
  await B.act('replay'); await B.frames(6); const b0 = await B.st();
  T.check('the phone upright, the camera behind the car: the replay behind the player\'s car', b0.screen === 'none' && b0.ui && /^Ti · /.test(b0.info) && chaseView(b0), JSON.stringify(b0));
  await B.frames(20); const b1 = await B.st();
  T.check('the camera goes with the car (still behind it, the car on)', b1.t > b0.t + 0.2 && chaseView(b1), JSON.stringify(b1));
  const ring = [];
  for (let k = 0; k < 4; k++) { await B.act('rp-cam'); await B.frames(1); ring.push((await B.st()).cam); }
  const b2 = await B.st();
  T.check('the camera button: behind the car → TV → from above → the cockpit → behind the car again', ring.join(',') === 'TV,Od zgoraj,Kokpit,Za avtom' && chaseView(b2), ring.join(' → ') + ' ' + JSON.stringify(b2));
  await B.frames(8); await B.act('rp-next'); await B.frames(1); const b3 = await B.st();
  T.check('▶: the next car, the camera behind it at once', b3.k !== b2.k && !/^Ti · /.test(b3.info) && chaseView(b3), JSON.stringify(b3));
  await B.act('rp-restart'); await B.frames(1); const b4 = await B.st();
  T.check('⏮: from the start, the camera behind the car there at once (no glide from where it was)', b4.t < 1 && chaseView(b4), JSON.stringify(b4));
  await B.frames(4); await B.act('rp-photo'); await B.frames(2);
  const ph = await B.page.evaluate(() => { const g = window.__game, P = g.replay, c = g.race.cars[P.k], p = new THREE.Vector3(c.x, (c.y || 0) + 0.7, c.z).project(Render.camera);
    return { screen: g.screen, ui: !document.getElementById('replay-ui').classList.contains('off'), shot: !!Render.cam.shot, x: +p.x.toFixed(3), y: +p.y.toFixed(3), play: P.play }; });
  T.check('Foto: the replay stands, its controls hidden, the camera round the followed car (in the middle)', ph.screen === 'photo' && !ph.ui && ph.shot && !ph.play && Math.abs(ph.x) < 0.03 && Math.abs(ph.y) < 0.03, JSON.stringify(ph));
  await B.act('ph-exit'); await B.frames(2); const b5 = await B.st(), shot5 = await B.page.evaluate(() => !!Render.cam.shot);
  T.check('Nazaj: the replay again, behind the car', b5.screen === 'none' && b5.ui && !shot5 && chaseView(b5), JSON.stringify(b5));
  await B.act('rp-exit'); await B.page.waitForTimeout(300);
  T.check('no page errors (upright)', B.errors.length === 0, B.errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
