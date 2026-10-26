// The replay after a race (Jezero Ring, the player on autopilot): the results screen's "Posnetek" plays the race back (the HUD and the
// on-screen controls hidden, the replay's own controls shown); the cars where the recording has them; the camera the player drove with
// (behind the car, the phone on its side); pause, speed, the camera button (the player's own first, then TV: on a post away from the car,
// then behind the car again), the car followed; "Končaj" back to the results. "Najboljši trenutki" (the results, or the
// replay's Trenutki): the start, the best moments of the race and the finish in the order they happened, each on the player's camera with
// the car of the moment followed and a caption (the camera button: TV for the rest of them); then back to the results. A race driven with
// the camera behind the car, the phone upright: its replay behind the car, the camera behind the next car (▶), at the start at once (⏮),
// Foto from it and back.
// Posnetek do sem (sklop 4 of docs/orodje-za-napake.md; Bathurst at 25 s by the quick entry, the pause): the pause's button, the race so
// far (its plate, the timeline ending at ZDAJ, Nazaj v dirko for Končaj), the race standing; the timeline (a tap, a drag), 5 s back and on, a
// frame back and on, the times; the buttons in one row on a phone on its side, in two upright; the key I back: every car exactly as the race
// left it, 3 · 2 · 1, then the race goes on; I in the race: the replay at once; the pause in the count: the pause screen.
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
      // far (on the ground), its offset east and south (+x, +z)
      st: () => page.evaluate(() => { const g = window.__game, cam = Render.camera, P = g.replay, c = P ? g.race.cars[P.k] : g.race.player, el = (id) => document.getElementById(id);
        const info = el('rp-info').textContent, m = /(\d+):(\d+\.\d+)$/.exec(info), dx = cam.position.x - c.x, dz = cam.position.z - c.z, r1 = (v) => +v.toFixed(1);
        return { screen: g.screen, ui: !el('replay-ui').classList.contains('off'), hud: !el('hud').classList.contains('off'), touch: !el('touch').classList.contains('off'), info, t: m ? +m[1] * 60 + +m[2] : NaN,
          cam: el('rp-cam').textContent, mode: P ? P.cam : null, k: P ? P.k : -1, speed: el('rp-speed').textContent, play: el('rp-play').textContent, fov: cam.fov,
          along: r1(dx * Math.cos(c.h) + dz * Math.sin(c.h)), side: r1(-dx * Math.sin(c.h) + dz * Math.cos(c.h)), up: r1(cam.position.y - (c.y || 0)), camD: r1(Math.hypot(dx, dz)), dx: r1(dx), dz: r1(dz) }; }) };
  };
  const chaseView = (v) => v.mode === 'chase' && v.cam === 'Za avtom' && v.fov === 58 && v.up > 30 && v.along < -8 && Math.abs(v.side) < -0.35 * v.along;   // (the phone upright: high behind the car; in a bend a little to its side)
  const chaseLand = (v) => v.mode === 'chase' && v.cam === 'Za avtom' && v.fov === 46 && v.up > 15 && v.along < -5 && Math.abs(v.side) < -0.35 * v.along;   // (on its side: lower and closer behind the car, a longer lens)
  const tvView = (v) => v.mode === 'tv' && v.cam === 'TV' && v.camD > 12 && v.up < 20;   // (on a post beside the track, 9 m up)

  const { page, errors, act, frames, st } = await open('chase', { width: 844, height: 390 });
  const btn = await page.evaluate(() => !document.getElementById('res-replay').classList.contains('off'));
  await act('replay'); await frames(6);
  const a = await st();
  T.check('"Posnetek": the replay plays (its controls, no HUD, no touch controls), from the start, the player\'s car followed', btn && a.screen === 'none' && a.ui && !a.hud && !a.touch && a.t > 0.05 && a.t < 4 && /^Ti · /.test(a.info), JSON.stringify(a));
  T.check('the camera the player drove with: behind the car', chaseLand(a), JSON.stringify(a));
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
  T.check('then behind the car again (the player\'s own)', chaseLand(c2), [c1.cam, c2.cam].join(' → ') + ' ' + JSON.stringify(c2));
  await act('rp-next'); await frames(2); const n1 = await st();
  T.check('another car followed, the camera behind it', !/^Ti · /.test(n1.info) && /·/.test(n1.info) && n1.k !== a.k && chaseLand(n1), JSON.stringify(n1));
  // the end: back to the results
  await act('rp-exit'); await page.waitForTimeout(300); const e = await st();
  T.check('"Končaj": back to the results', e.screen === 'results' && !e.ui, JSON.stringify(e));

  // the highlights: from the results
  const hl = () => page.evaluate(() => { const g = window.__game, P = g.replay, el = (id) => document.getElementById(id), H = P && P.hl;
    return { screen: g.screen, on: !!H, i: H ? H.i : -1, n: H ? H.clips.length : 0, lbl: H ? H.clips[H.i].lbl : '', k: P ? P.k : -1, want: H ? H.clips[H.i].k : -2, t: P ? P.t : NaN, t0: H ? H.clips[H.i].t0 : NaN,
      cam: el('rp-cam').textContent, cap: el('rp-hl-cap').classList.contains('off') ? '' : el('rp-hl-cap').textContent, lit: el('rp-hl').classList.contains('on'), ui: !el('replay-ui').classList.contains('off') }; });
  const hb = await page.evaluate(() => !document.getElementById('res-hl').classList.contains('off'));
  await act('replay-hl'); await frames(3); const h0 = await hl();
  T.check('"Najboljši trenutki": the start first, on the player\'s camera (behind the car), the car on pole followed, a caption, the button lit', hb && h0.on && h0.i === 0 && h0.n >= 2 && h0.lbl === 'ŠTART' && h0.cam === 'Za avtom' && h0.k === h0.want && /ŠTART/.test(h0.cap) && h0.lit && h0.ui && h0.screen === 'none' && h0.t - h0.t0 < 3,
    JSON.stringify(h0));
  await act('rp-speed'); await act('rp-speed');   // (4x: the programme sooner through)
  // each moment on the player's camera; in the second one, the camera button: TV, the programme goes on with it
  const seen = [h0.lbl]; let last = h0, done = null, want = 'Za avtom', sw = null;
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
  for (let k = 0; k < 2; k++) { await B.act('rp-cam'); await B.frames(1); ring.push((await B.st()).cam); }
  const b2 = await B.st();
  T.check('the camera button: behind the car → TV → behind the car again', ring.join(',') === 'TV,Za avtom' && chaseView(b2), ring.join(' → ') + ' ' + JSON.stringify(b2));
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
  await B.page.context().close();

  // Posnetek do sem: Bathurst (a real track) at 25 s, paused there by the quick entry
  {
    const { page: Q, errors: QE } = await openGame(browser, srv.base + '/index.html?proga=bathurst&t=25', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 });
    await Q.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000, polling: 250 });
    await Q.evaluate(() => { window.__rf = 0; const o = Render.frame; Render.frame = function () { window.__rf++; return o.apply(this, arguments); }; });
    const qf = (n) => Q.evaluate((n) => new Promise(res => { const f0 = window.__rf, chk = () => window.__rf - f0 >= n ? res() : setTimeout(chk, 20); chk(); }), n);
    const qa = (a) => Q.evaluate((a) => window.__game.onAction(a), a);
    // every car as the race has it (its own fields and where it is on the track), the race's clock, the safety car
    const cars = () => Q.evaluate(() => { const g = window.__game, r = g.race;
      return { time: r.time, sc: !!(r.fl && r.fl.sc), cars: r.cars.map(c => [c.x, c.y, c.z, c.h, c.px, c.pz, c.ph, c.vl, c.vx, c.vz, c.delta, c.w, c.beta, c.gear, c.rpm, c.inBrk, c.lap, c.dist, c.q && c.q.i, c.q && c.q.s, c.q && c.q.d, !!c.rl].join()) }; });
    const rs = () => Q.evaluate(() => { const g = window.__game, el = (id) => document.getElementById(id), ui = el('replay-ui'), vis = (e) => !!e && e.offsetParent !== null;
      return { screen: g.screen, paused: g.paused, rp: g.replay, ui: !ui.classList.contains('off'), here: ui.classList.contains('here'), rec: el('rp-rec').textContent, wait: vis(el('rp-wait')) ? el('rp-wait').textContent : '',
        zdaj: vis(document.querySelector('.rp-zdaj')), go: vis(document.querySelector('[data-act="rp-race"]')), exit: vis(document.querySelector('[data-act="rp-exit"]')), now: el('rp-now').textContent, len: el('rp-len').textContent,
        flags: el('rp-flags').textContent, flagsOff: el('rp-flags').disabled, all: el('rp-all').classList.contains('sel'), hud: !el('hud').classList.contains('off'), count: el('rp-count').classList.contains('off') ? '' : el('rp-count').textContent, time: g.race.time }; });
    const p0 = await Q.evaluate(() => ({ screen: window.__game.screen, btn: !document.getElementById('pause-rp').classList.contains('off'), txt: document.getElementById('pause-rp').textContent }));
    T.check('Bathurst at 25 s, paused: the pause has "Posnetek do sem"', p0.screen === 'pause' && p0.btn && p0.txt === 'Posnetek do sem', JSON.stringify(p0));
    const before = await cars();
    await Q.click('#pause-rp'); await qf(4);
    const h0 = await rs();
    T.check('"Posnetek do sem": the race so far (its title, the plate "Dirka čaka na pavzi · krog 1/n", ZDAJ at the timeline\'s end, "Nazaj v dirko" for "Končaj"); from 10 s before now, playing; the race stands',
      h0.screen === 'none' && h0.paused && h0.ui && h0.here && h0.rp.here && h0.rec === '● POSNETEK DO SEM' && /^Dirka čaka na pavzi · krog 1\/\d+$/.test(h0.wait) && h0.zdaj && h0.go && !h0.exit && !h0.hud &&
      Math.abs(h0.rp.t1 - before.time) < 0.1 && h0.rp.t > h0.rp.t1 - 10.1 && h0.rp.t < h0.rp.t1 - 5 && h0.rp.play && h0.time === before.time, JSON.stringify(h0));
    T.check('the times beside the timeline (00:15.3 / 00:25.0); "Cel posnetek" on, "Zastavice (0)" grey (no flags yet)',
      /^00:1\d\.\d$/.test(h0.now) && /^00:2[45]\.\d$/.test(h0.len) && h0.all && h0.flags === 'Zastavice (0)' && h0.flagsOff, JSON.stringify({ now: h0.now, len: h0.len, flags: h0.flags }));
    // the layout: on its side every button in one row inside the screen, the timeline above them, the plate clear of the top row
    const lay = () => Q.evaluate(() => { const r = (e) => e.getBoundingClientRect(), bs = [...document.querySelectorAll('#replay-ui .rp-bar button')].filter(b => b.offsetParent !== null).map(r), line = r(document.getElementById('rp-line')),
      W = innerWidth, H = innerHeight, tops = [...new Set(bs.map(b => Math.round(b.top)))], top = [...document.querySelectorAll('#replay-ui .rp-row > *')].map(r), wait = r(document.getElementById('rp-wait'));
      return { n: bs.length, rows: tops.length, inside: bs.every(b => b.left >= 0 && b.right <= W && b.bottom <= H), lineAbove: line.bottom < Math.min(...bs.map(b => b.top)), lineW: Math.round(line.width), W,
        topClear: top.every(t => t.bottom <= wait.top + 1), topAbove: Math.max(...top.map(t => t.bottom), wait.bottom) < line.top - 20 }; });
    const l0 = await lay();
    T.check('on its side (640 × 360): the 11 buttons in one row inside the screen, the timeline above them, the top clear of the plate and the timeline', l0.n === 11 && l0.rows === 1 && l0.inside && l0.lineAbove && l0.lineW > 0.6 * l0.W && l0.topClear && l0.topAbove, JSON.stringify(l0));
    // the timeline: a tap a quarter along it, then a drag from a fifth to 60 %
    const line = await Q.evaluate(() => { const b = document.getElementById('rp-line').getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
    const at = (u) => h0.rp.t0 + u * (h0.rp.t1 - h0.rp.t0);   // (the timeline: the recording's first frame to now)
    await Q.mouse.click(line.x + 0.25 * line.w, line.y); await qf(2);
    const tap = await rs();
    T.check('a tap on the timeline: the replay there (a quarter of the race so far), playing on', Math.abs(tap.rp.t - at(0.25)) < 0.03 * h0.rp.t1 + 1.2 && tap.rp.play, JSON.stringify({ t: tap.rp.t, want: at(0.25) }));
    await Q.mouse.move(line.x + 0.2 * line.w, line.y); await Q.mouse.down(); await qf(1);
    const dg = await rs();
    await Q.mouse.move(line.x + 0.45 * line.w, line.y, { steps: 4 }); await Q.mouse.move(line.x + 0.6 * line.w, line.y, { steps: 4 }); await qf(1);
    const dm = await rs();
    await Q.mouse.up(); await qf(2);
    const du = await rs();
    T.check('a drag along it: the replay stands while it is dragged and follows the finger (60 %), then plays on', !dg.rp.play && !dm.rp.play && Math.abs(dm.rp.t - at(0.6)) < 0.03 * h0.rp.t1 && du.rp.play && du.rp.t >= dm.rp.t,
      JSON.stringify({ down: dg.rp.t, move: dm.rp.t, want: at(0.6), up: du.rp.t, play: [dg.rp.play, dm.rp.play, du.rp.play] }));
    // 5 s back and on, a frame back and on (the replay standing)
    await qa('rp-play'); await qf(1); const s0 = (await rs()).rp;
    await qa('rp-b5'); await qf(1); const s1 = (await rs()).rp;
    await qa('rp-f5'); await qa('rp-f5'); await qf(1); const s2 = (await rs()).rp;
    T.check('5 s back, then 5 s on twice: 5 s earlier, then 5 s later than it was; the replay stands', !s0.play && Math.abs(s1.t - (s0.t - 5)) < 1e-6 && Math.abs(s2.t - (s0.t + 5)) < 1e-6 && !s2.play, JSON.stringify({ s0: s0.t, s1: s1.t, s2: s2.t }));
    await qa('rp-play'); await qf(3); await qa('rp-fnext'); await qf(1); const f1 = (await rs()).rp;
    await qa('rp-fnext'); await qf(1); const f2 = (await rs()).rp;
    await qa('rp-fback'); await qa('rp-fback'); await qa('rp-fback'); await qf(1); const f3 = (await rs()).rp;
    T.check('a frame on (the replay stops), on again: the next recorded frame each (about 1/20 s); three back: two before the first', !f1.play && !f2.play && f2.i === f1.i + 1 && f2.t - f1.t > 0.04 && f2.t - f1.t < 0.075 && f3.i === f1.i - 2 && f1.t - f3.t > 0.08 && f1.t - f3.t < 0.15,
      JSON.stringify({ f1: [f1.i, f1.t], f2: [f2.i, f2.t], f3: [f3.i, f3.t] }));
    await qa('rp-f5'); await qa('rp-f5'); await qa('rp-f5'); await qf(1); const end = await rs();
    T.check('5 s on past now: the replay ends at ZDAJ', Math.abs(end.rp.t - end.rp.t1) < 1e-6 && end.now === end.len, JSON.stringify({ t: end.rp.t, t1: end.rp.t1, now: end.now, len: end.len }));
    const moved = await cars();
    T.check('meanwhile the replay poses the race\'s own cars (they are not where the race left them)', moved.cars.some((c, k) => c !== before.cars[k]) && moved.time === before.time);
    // upright: the buttons in two rows
    await Q.setViewportSize({ width: 360, height: 640 }); await qa('rp-b5'); await qf(3);
    const l1 = await lay();
    T.check('upright (360 × 640): the buttons in two rows inside the screen, the timeline above them, the top clear of it', l1.n === 11 && l1.rows === 2 && l1.inside && l1.lineAbove && l1.topClear && l1.topAbove, JSON.stringify(l1));
    await Q.setViewportSize({ width: 640, height: 360 }); await qf(2);
    // Nazaj v dirko by the key I: every car back, 3 · 2 · 1, then the race on
    await Q.evaluate(() => { const el = document.getElementById('rp-count'); window.__cnt = []; new MutationObserver(() => { if (!el.classList.contains('off')) { const t = el.textContent; if (window.__cnt[window.__cnt.length - 1] !== t) window.__cnt.push(t); } }).observe(el, { childList: true, characterData: true, subtree: true, attributes: true }); });
    await Q.keyboard.press('KeyI'); await qf(1);
    const b0 = await rs(), back = await cars();
    const same = back.cars.filter((c, k) => c === before.cars[k]).length;
    T.check('I in the replay: "Nazaj v dirko": every car exactly as the race left it (where, how fast, its lap, where on the track), the race\'s clock as it was; the HUD back, the count on, the race still waiting',
      same === before.cars.length && back.time === before.time && back.sc === before.sc && !b0.rp && !b0.ui && b0.hud && b0.screen === 'none' && b0.paused && /^[123]$/.test(b0.count),
      JSON.stringify({ same, of: before.cars.length, time: [before.time, back.time], b0: { screen: b0.screen, paused: b0.paused, count: b0.count, hud: b0.hud } }));
    await Q.waitForFunction(() => !window.__game.paused && window.__game.rpCount === 0, null, { timeout: 90000, polling: 100 });
    const cnt = await Q.evaluate(() => window.__cnt.join(' · ')), t1 = await rs(); await qf(6); const t2 = await rs();
    T.check('3 · 2 · 1, then the race goes on (its clock running, the count gone)', cnt === '3 · 2 · 1' && t1.count === '' && t1.screen === 'none' && !t1.paused && t2.time > before.time, JSON.stringify({ cnt, time: [before.time, t1.time, t2.time] }));
    // I while racing: the replay at once (no menu); back, then the pause in the count: the pause screen
    await Q.keyboard.press('KeyI'); await qf(2); const i1 = await rs();
    T.check('I while racing: Posnetek do sem at once, the race waiting', i1.rp && i1.rp.here && i1.ui && i1.paused && i1.screen === 'none', JSON.stringify({ rp: i1.rp, paused: i1.paused, screen: i1.screen }));
    await qa('rp-race'); await qf(1); const c1 = await rs();
    await Q.keyboard.press('Escape'); await qf(2); const c2 = await rs();
    T.check('"Nazaj v dirko", then the pause key in the count: the count stops, the pause screen (the race waiting)', /^[123]$/.test(c1.count) && c2.count === '' && c2.screen === 'pause' && c2.paused, JSON.stringify({ c1: c1.count, c2: { count: c2.count, screen: c2.screen, paused: c2.paused } }));
    await qa('resume'); await qf(4);
    T.check('no page errors (Posnetek do sem)', QE.length === 0, QE.slice(0, 5).join(' | '));
    await Q.context().close();
  }
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
