// The garage (garaza.html): the page opens with the workshop and the car, the camera (left and right only, always as far; what is
// between it and the car steps aside), the demo profiles, buying a car and the credits, a new car
// driving in, every upgrade with its parts on the car, the service (dirt and scratches gone, the engine), a new colour, the English page,
// every car of the game on the turntable with all its parts, the pictures of the cars, the profile kept after a reload. The animations
// run on a clock the test steps itself (software WebGL is slow). Zero page errors allowed.
//   node tests/browser/garage.test.mjs
import { serve, launch, checker } from './lib.mjs';

const T = checker('garage');
const srv = await serve();
const browser = await launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => errors.push('request failed: ' + r.url()));
  await page.goto(srv.base + '/garaza.html');
  await page.waitForFunction(() => window.__garage && Garage3D.ready, null, { timeout: 180000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => { __garage.hold = true; });
  // the animations to their end (the clock stepped a second at a time while a show plays or waits); returns the seconds it took
  // (a short pause between the steps: the next show in the queue starts on a promise)
  const run = () => page.evaluate(async () => { let t = 0; do { __garage.advance(0.5); t += 0.5; await new Promise(r => setTimeout(r, 0)); } while (Garage3D.busy && t < 200); return t; });
  const ui = () => page.evaluate(() => ({ money: document.getElementById('g-money').textContent, name: document.getElementById('g-name').textContent, go: document.getElementById('g-go').textContent.trim(),
    title: document.querySelector('.g-title h1').textContent, info: Garage3D.info, S: JSON.parse(JSON.stringify(__garage.S)) }));

  // 1. the page: a fresh profile (the full game: 11.500 CR, the PICO TURBO), the car on the table, the room drawn in a sensible number of draws
  {
    const u = await ui(), calls = await page.evaluate(() => { __garage.advance(0.1); return Garage3D.renderer.info.render.calls; });
    T.check('opens: 11.500 CR, PICO TURBO on the turntable, the go button "Izberi"', u.money === '11.500' && u.name === 'PICO TURBO' && u.info.car === 'pico' && u.go === 'Izberi' && u.title === 'GARAŽA', JSON.stringify({ money: u.money, name: u.name, car: u.info.car, go: u.go }));
    T.check('the worn car shows its wear: dirt and scratches on the paint', u.info.dirt > 0.2 && u.info.scr > 0.2, JSON.stringify(u.info));
    T.check('draw calls of the garage stay modest (< 260)', calls > 20 && calls < 260, calls + ' calls');
    const kept = await page.evaluate(() => Garage3D._dbg.pieces.filter(p => p.g || p.sm).length);
    T.check('the room built, its builders\' arrays let go (the phone\'s memory)', kept === 0, kept + ' pieces still hold them');
  }

  // 1b. the camera: dragged left or right it goes round the car; up and down, the wheel, a pinch: nothing (no zoom, the height stays)
  {
    const box = await page.evaluate(() => { const r = document.getElementById('g-gl').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    const cam = () => page.evaluate(() => { __garage.advance(1); const p = Garage3D.camera.position; return { x: p.x, y: p.y, z: p.z, d: Math.hypot(p.x + 0.2, p.z) }; });
    // (held still at the end: no swing after it; small turns: the camera stays clear of the walls)
    const drag = async (dx, dy) => { await page.mouse.move(box.x, box.y); await page.mouse.down(); for (let i = 1; i <= 7; i++) await page.mouse.move(box.x + dx * Math.min(1, i / 6), box.y + dy * Math.min(1, i / 6)); await page.mouse.up(); };
    const c0 = await cam();
    await drag(0, 120); await page.mouse.move(box.x, box.y); await page.mouse.wheel(0, 600);
    const c1 = await cam(), same = Math.hypot(c1.x - c0.x, c1.z - c0.z) < 0.02 && Math.abs(c1.y - c0.y) < 0.03;
    await drag(-30, 20); await page.mouse.move(box.x, box.y); await page.mouse.wheel(50, 0);
    const c2 = await cam(), round = Math.hypot(c2.x - c0.x, c2.z - c0.z) > 1 && Math.abs(c2.y - c0.y) < 0.03 && Math.abs(c2.d - c0.d) < 0.03;
    T.check('the camera: up and down and the wheel do nothing; left and right (a drag, a sideways scroll) it goes round, its height and distance kept', same && round, JSON.stringify({ c0, c1, c2 }));
    // round to behind the car: out beyond the back wall, as far as ever (it never comes closer); the back wall's things stepped aside
    await drag(-180, 0); await drag(-180, 0);
    const c3 = await cam(), back = await page.evaluate(() => ({ hidden: !Garage3D._dbg.WALLS.back.root.visible, front: Garage3D._dbg.WALLS.front.root.visible }));
    T.check('behind the car: the camera out beyond the back wall at the same distance, the back wall\'s things gone from between it and the car', c3.z < -5 && Math.abs(c3.d - c0.d) < 0.03 && Math.abs(c3.y - c0.y) < 0.03 && back.hidden && back.front, JSON.stringify({ c3, back }));
    // a drag held still before the finger lets go: the camera stays where it was dragged (no swing on)
    await page.mouse.move(box.x, box.y); await page.mouse.down(); for (let i = 1; i <= 6; i++) await page.mouse.move(box.x - 25 * i, box.y);
    await page.waitForTimeout(200); await page.mouse.up();
    const yh = await page.evaluate(() => [Garage3D._dbg.user.yaw, (__garage.advance(1), Garage3D._dbg.user.yaw)]);
    T.check('a drag held still, then let go: the camera does not swing on', Math.abs(yh[1] - yh[0]) < 0.01, JSON.stringify(yh));
    await page.evaluate(() => { Garage3D.view(0); __garage.advance(1.5); });
  }

  // 2. a car not bought: it drives in, the go button buys it; too few credits: refused, nothing taken
  {
    await page.evaluate(() => __garage.pickCar('kaze')); await run();
    const u = await ui();
    T.check('another car: the PICO drives out, the KAZE RS drives in and stops on the table', u.info.car === 'kaze' && u.name === 'KAZE RS' && Math.abs(u.info.ang) < 0.01 && /Kupi · 30\.000 CR/.test(u.go), JSON.stringify({ car: u.info.car, go: u.go }));
    await page.evaluate(() => __garage.buy());
    const u2 = await ui(), toast = await page.evaluate(() => document.getElementById('g-toast').textContent);
    T.check('too few credits for it: refused, the credits unchanged', u2.money === '11.500' && !u2.S.cars.kaze.own && /Premalo kreditov/.test(toast), toast);
  }

  // 3. the veteran's profile: many credits, cars; buying one
  {
    await page.evaluate(() => document.querySelector('#g-modes [data-mode="vet"]').click()); await run();
    const u = await ui();
    T.check('the veteran: 248.500 CR, the KAZE RS (owned) on the table', u.money === '248.500' && u.S.car === 'kaze' && u.info.car === 'kaze' && u.S.cars.kaze.own, JSON.stringify({ money: u.money, car: u.info.car }));
    await page.evaluate(() => __garage.pickCar('formula')); await run();
    await page.evaluate(() => __garage.buy());
    const u2 = await ui();
    T.check('bought: the FORMULA ORKAN for 90.000 CR (248.500 -> 158.500), the go button now chooses it', u2.S.cars.formula.own && u2.S.money === 158500 && u2.go === 'Izberi' && u2.info.car === 'formula', JSON.stringify({ money: u2.S.money, go: u2.go }));
  }

  // 4. the upgrades on the muscle car: each fitted with its show, the parts on the car, the price taken (a level bought once is free again)
  {
    await page.evaluate(() => __garage.pickCar('muscle')); await run();
    const m0 = (await ui()).S.money;
    await page.evaluate(() => { __garage.fitUpg('aero', 3); __garage.fitUpg('zavore', 3); __garage.fitUpg('gume', 2); __garage.fitUpg('motor', 0); }); await run();
    const u = await ui(), p = u.info.parts;
    const paid = m0 - u.S.money, want = 23000 + 23000 + 7000;   // (aero 0 -> 3, brakes 0 -> 3, tyres 1 -> 2; the engine down to stock: free)
    T.check('upgrades: wing kit, brakes, tyres fitted, the engine back to stock; their parts on the car', u.info.upg.aero === 3 && u.info.upg.zavore === 3 && u.info.upg.gume === 2 && u.info.upg.motor === 0 && p.aero >= 8 && p.zavore === 8 && p.gume === 4 && p.motor === 0, JSON.stringify(u.info));
    T.check('upgrades: paid ' + want + ' CR', paid === want, 'paid ' + paid);
    await page.evaluate(() => __garage.fitUpg('motor', 3)); await run();
    const u2 = await ui();
    T.check('the engine bought back to the level owned (3): free, its exhausts and bonnet scoop on the car', u2.S.money === u.S.money && u2.info.upg.motor === 3 && u2.info.parts.motor >= 6, JSON.stringify({ money: u2.S.money, parts: u2.info.parts }));
    T.check('after the shows the turntable is home, the lift down', Math.abs(u2.info.ang) < 0.01 && u2.info.lift === 0, JSON.stringify(u2.info));
  }

  // 5. the service (the rally car: dirty, scratched, its engine worn) and the paint
  {
    await page.evaluate(() => __garage.pickCar('rally')); await run();
    const u0 = await ui();
    await page.evaluate(() => __garage.doService('all')); await run();
    const u = await ui();
    T.check('a full service: clean, no scratches, condition 100 %, paid', u0.info.dirt > 0.3 && u.info.dirt === 0 && u.info.scr === 0 && u.S.cars.rally.cond.engine === 1 && u.S.money < u0.S.money && u.info.lift === 0, JSON.stringify({ before: u0.info, after: u.info }));
    await page.evaluate(() => __garage.doPaint(5, false)); await run();
    const u2 = await ui();
    T.check('a new colour (green, no stripes): the car painted, 2.000 CR taken', u2.info.color === 0x2fa84f && u2.info.stripe === false && u.S.money - u2.S.money === 2000 && u2.info.car === 'rally', JSON.stringify(u2.info));
  }

  // 6. English
  {
    await page.evaluate(() => __garage.onAct('lang'));
    const t = await page.evaluate(() => ({ h: document.querySelector('.g-title h1').textContent, go: document.getElementById('g-go').textContent, tile: document.querySelector('.g-tile small').textContent, html: document.documentElement.lang }));
    T.check('English: GARAGE, Select, the tiles in English', t.h === 'GARAGE' && t.go === 'Select' && t.tile === 'Car' && t.html === 'en', JSON.stringify(t));
    await page.evaluate(() => __garage.onAct('lang'));
  }

  // 7. every car of the game on the turntable, all its upgrades at the top level: built, the parts measured onto it
  {
    const r = await page.evaluate(() => Core.MODELS.map(M => { Garage3D.show({ M, color: 0xd81f2a, stripe: true, upg: { motor: 3, gume: 3, zavore: 3, aero: 3 }, cond: { clean: 1, body: 1, engine: 1 } }); __garage.advance(0.1);
      const i = Garage3D.info; return { id: M.id, ok: i.car === M.id && i.parts.gume >= 4 && i.parts.aero >= 2 && (M.ev || i.parts.motor >= 4) }; }));
    const bad = r.filter(x => !x.ok);
    T.check(`all ${r.length} cars with every part at level 3`, !bad.length, JSON.stringify(bad));
  }

  // 8. the pictures of the cars in the car panel
  {
    await page.evaluate(() => { __garage.panel = 'car'; });
    for (let i = 0; i < 30; i++) { await page.evaluate(() => __garage.advance(0.05)); await page.waitForTimeout(250); if (await page.evaluate(() => document.querySelectorAll('.g-car .th img').length) >= 11) break; }
    const n = await page.evaluate(() => [...document.querySelectorAll('.g-car .th img')].filter(i => /^data:image\/png/.test(i.src)).length);
    T.check('the car panel: a picture of each of the 11 cars', n === 11, n + ' pictures');
  }

  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));

  // 9. the profile is kept: after a reload the same credits and car
  {
    const before = await page.evaluate(() => ({ money: __garage.S.money, car: __garage.S.car }));
    await page.reload(); await page.waitForFunction(() => window.__garage && Garage3D.ready, null, { timeout: 180000 });
    const after = await page.evaluate(() => ({ money: __garage.S.money, car: __garage.S.car, shown: Garage3D.info.car }));
    T.check('after a reload: the same credits and car', after.money === before.money && after.car === before.car && after.shown === before.car, JSON.stringify({ before, after }));
  }
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
