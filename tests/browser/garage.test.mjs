// The garage (garaza.html): the page opens with the workshop and the car, the camera (left and right only, always as far; what is
// between it and the car steps aside), the demo profiles, buying a car and the credits, a new car
// driving in, every upgrade with its parts on the car, the service (dirt and scratches gone, the engine), a new colour, the English page,
// every car of the game on the turntable with all its parts, the pictures of the cars, the profile kept after a reload; the single-post
// lift behind the car (the tyres and the service's engine up on it, the turntable never rising nor turning); the permanent fixtures
// (the ceiling gantry with its two arms, the tool stand ORODJA with its seven tools, the curtains, the IR lamps) parked at rest, out of
// the cars' lane, their moves through the shows' queue, the stand's plate in English. The animations run on a clock the test steps
// itself (software WebGL is slow). Zero page errors allowed.
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
  // the animations to their end (the clock stepped half a second at a time while a show plays or waits); returns the seconds it took
  // and what the lift and the turntable did meanwhile (the car's highest on the lift, the table's height and angle at their most)
  // (a short pause between the steps: the next show in the queue starts on a promise)
  // (moved: how far a car up on the lift (or with its arms out) went from the table's middle: none drives off it)
  const run = () => page.evaluate(async () => { let t = 0, lift = 0, table = 0, ang = 0, moved = 0;
    do { __garage.advance(0.5); t += 0.5; const i = Garage3D.info, L = Garage3D._dbg.lift; lift = Math.max(lift, i.lift); table = Math.max(table, Math.abs(L.table)); ang = Math.max(ang, Math.abs(i.ang));
      if (i.lift > 0.01 || L.arms > 0) moved = Math.max(moved, Math.abs(Garage3D.cur.root.position.x)); await new Promise(r => setTimeout(r, 0)); } while (Garage3D.busy && t < 200);
    return { t, lift, table, ang, moved }; });
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
    const L = await page.evaluate(() => Garage3D._dbg.lift);
    // (raw: the column's piece's nearest vertex to the car: nothing of it in front of the car)
    T.check('one lift column, behind the car (far side), its arms stowed out of the cars\' lane (|z| >= 1.38), the turntable flush', L.posts === 1 && L.z < -1.3 && L.raw < -1.3 && L.box[1][2] < -1.3 && L.arms === 0 && L.lane >= 1.38 && L.table === 0 && !L.on, JSON.stringify(L));
    // the permanent fixtures at rest: the gantry's beam at x 2.4, both arms folded under it above 3.3 m (out of the home view, no shadow),
    // the stand ORODJA with its 7 tools in their nests (all lit green), the curtains bunched in the rear corners (0), the IR lamps in
    // their row (0) and dark; nothing of them in the cars' lane (|z| < 1.3, under 2 m), none of them stepped aside in the home view
    const F = await page.evaluate(() => Garage3D._dbg.fx);
    T.check('the fixtures at rest: the beam at x 2.4, both arms folded above 3.3 m, 7 tools in their nests (all green), the curtains bunched, the IR lamps parked and dark; none in the cars\' lane, none stepped aside in the home view',
      F.beam === 2.4 && F.arms.length === 2 && F.arms.every(a => a.parked && a.tool === 'none' && a.low >= 3.3 && !a.cast && !a.refl) && Object.keys(F.rack.nests).length === 7 && Object.values(F.rack.nests).every(s => s === 'in')
      && Object.values(F.rack.leds).every(c => c === 'green') && F.rack.plate === 'ORODJA' && F.curtains === 0 && F.lamps === 0 && F.glow === 0 && F.lane >= 1.3 && F.gone === 0 && F.parked, JSON.stringify(F));
  }

  // 1c. the fixtures' moves through the shows' queue: arm 0 takes the camera from its nest (the nest amber) and puts it back (green
  // again), the arms parked, stepped finely meanwhile: the arms' own parts never in the curtains' track (its channel round the loop at
  // 3.72 m) nor in the lift's column, the carriages never closer than their gap, the held tool never in the stand's plate (out of its
  // fork's slot), never out of reach; the curtains drawn round the car and bunched again; the lamps rolled in to dry, lit, dark and
  // back in their row, and on their way (every 2 %) no leg, castor, pole or panel edge of theirs through anything in the garage
  {
    const fine = () => page.evaluate(async () => { const D = Garage3D._dbg, { ARM, loop, RK, FX } = D, r = { t: 0, track: 0, col: 0, gap: 9, plate: 0 }, v = new THREE.Vector3();
      const ld = (x, z) => { const qx = Math.abs(x) - (loop.LX - loop.LR), qz = Math.abs(z) - (loop.LZ - loop.LR); return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - loop.LR; };
      const inPlate = (x, y, z) => { if (y < RK.S - 0.045 || y > RK.S + 0.002) return false; const rr = Math.hypot(x - RK.cx, z - RK.cz) - RK.r, a = Math.atan2(z - RK.cz, x - RK.cx);
        if (rr < -0.18 || rr > 0.18 || a > RK.e0 || a < RK.e1) return false; if (rr < 0.08) for (const aj of RK.a) if (Math.abs(a - aj) < RK.SW) return false; return true; };
      do { __garage.advance(0.1); r.t += 0.1;
        for (const A of ARM) { const a = A.R.mesh.geometry.attributes.position.array; for (const [v0, v1, k] of A.R.runs) if (k < 10) for (let i = v0; i < v1; i++) { const x = a[i * 3], y = a[i * 3 + 1], z = a[i * 3 + 2];
            if (Math.abs(y - loop.LY) < 0.06 && Math.abs(ld(x, z)) < 0.065) r.track++; if (Math.abs(x) < 0.21 && z > -1.89 && z < -1.55 && y < 3.09) r.col++; }
          if (A.tool !== 'none') { const m = FX.tools[A.tool].mesh, p = m.geometry.attributes.position.array; for (let i = 0; i < p.length; i += 3) { v.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(m.matrix); if (inPlate(v.x, v.y, v.z)) r.plate++; } } }
        r.gap = Math.min(r.gap, ARM[0].J.cz - ARM[1].J.cz); await new Promise(res => setTimeout(res, 0)); } while (Garage3D.busy && r.t < 60);
      r.gap = +r.gap.toFixed(3); return r; });
    const res = {};
    for (const k of ['tool', 'curtains', 'lamps']) { await page.evaluate((k) => { Garage3D._dbg.fxDemo(k); }, k); const r = k === 'tool' ? await fine() : await run(); res[k] = await page.evaluate(() => ({ log: Garage3D._dbg.fxLog, fx: Garage3D._dbg.fx })); res[k].r = r; }
    const { tool: t, curtains: c, lamps: l } = res;
    T.check('the fixtures through the queue: arm 0 takes the camera (its nest amber) and puts it back (green), the curtains drawn and bunched, the lamps in, lit, back in their row; all parked after, the table still',
      t.log.length === 2 && t.log[0].held === 'camera' && t.log[0].nest === 'out' && t.log[1].miss === 0 && t.log[1].held === 'none' && t.log[1].nest === 'in' && t.fx.rack.leds.camera === 'green'
      && c.log[0].k === 1 && c.fx.curtains === 0 && l.log[0].t === 1 && l.log[0].glow === 1 && l.fx.lamps === 0 && l.fx.glow === 0 && [c, l].every(x => x.r.table === 0 && x.r.ang === 0) && [t, c, l].every(x => x.fx.parked),
      JSON.stringify({ t: t.log, c: c.log, l: l.log, parked: [t, c, l].map(x => x.fx.parked) }));
    T.check('the arms on their way to the stand and back: never in the curtains\' track nor in the lift\'s column, the carriages apart, the tool out through its fork (not through the plate)',
      t.r.track === 0 && t.r.col === 0 && t.r.gap >= 0.45 && t.r.plate === 0, JSON.stringify(t.r));
    const hits = await page.evaluate(() => { const D = Garage3D._dbg, { LMP } = D, sc = Garage3D.scene, own = new Set(), rc = new THREE.Raycaster(), hit = [], V = (a) => new THREE.Vector3(...a);
      LMP.L.forEach(L => L.piece.root.traverse(o => own.add(o))); const objs = []; sc.updateMatrixWorld(true);
      const lane = new THREE.Box3(new THREE.Vector3(-5.4, 0, -3.6), new THREE.Vector3(2.9, 2.7, -1.0)), bb = new THREE.Box3();   // (where the lamps go)
      sc.traverse(o => { if (o.isMesh && !own.has(o) && o.geometry.attributes.position && bb.setFromObject(o).intersectsBox(lane)) objs.push(o); });
      for (let t = 0; t <= 1.0001; t += 0.02) { D.fxPose({ lamps: t }); sc.updateMatrixWorld(true);
        LMP.L.forEach((L, i) => { const e = L.R.M[0].elements, x = e[12], z = e[14], segs = [[[x, 0.005, z], [x, 1.3, z]]], P = L.R.M[10];
          for (const [lx, lz] of [[0.5, 0.866], [-0.5, 0.866], [0.5, -0.866], [-0.5, -0.866]]) { const wx = x + (lx * e[0] + lz * e[8]) * 0.33, wz = z + (lx * e[2] + lz * e[10]) * 0.33; for (const y of [0.05, 0.12]) segs.push([[x, y, z], [wx, y, wz]]); }
          for (const [a, b] of [[[-0.4, -0.55, 0], [0.4, -0.55, 0]], [[-0.4, 0, 0], [0.4, 0, 0]], [[-0.4, -0.55, 0], [-0.4, 0, 0]], [[0.4, -0.55, 0], [0.4, 0, 0]], [[-0.4, -0.55, -0.13], [0.4, -0.55, -0.13]]]) segs.push([V(a).applyMatrix4(P).toArray(), V(b).applyMatrix4(P).toArray()]);
          for (const [a, b] of segs) { const o = V(a), d = V(b).sub(o), len = d.length(); rc.set(o, d.normalize()); rc.far = len;
            for (const m of objs) if (m.visible && rc.intersectObject(m, false).length && hit.length < 6) hit.push({ lamp: i, t: +t.toFixed(2), at: [x, z].map(q => +q.toFixed(2)) }); } }); }
      D.fxPose({ lamps: 0 }); return hit; });
    T.check('the IR lamps\' way from their row to the car and back: clear of everything (the drivetrain\'s things by the back wall, the curtains\' stack, the lift, the car)', hits.length === 0, JSON.stringify(hits));
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
    // (the lamps drying and the curtains half drawn when the car is asked for: watched till the old car moves)
    const first = await page.evaluate(async () => { const D = Garage3D._dbg, old = Garage3D.cur; D.fxPose({ lamps: 1, glow: 1, curtains: 0.6 }); __garage.pickCar('kaze'); let t = 0;
      while (old.root.position.x <= 0.01 && t < 30) { __garage.advance(0.1); t += 0.1; await new Promise(r => setTimeout(r, 0)); } const f = D.fx; return { t: +t.toFixed(1), lamps: f.lamps, curtains: f.curtains, glow: f.glow, parked: f.parked, lane: f.lane }; });
    await run();
    const u = await ui(), fx = await page.evaluate(() => Garage3D._dbg.fx);
    T.check('another car: the PICO drives out, the KAZE RS drives in and stops on the table', u.info.car === 'kaze' && u.name === 'KAZE RS' && Math.abs(u.info.ang) < 0.01 && /Kupi · 30\.000 CR/.test(u.go), JSON.stringify({ car: u.info.car, go: u.go }));
    T.check('a car asked for while the lamps dry and the curtains are half drawn: they go back first (when the old car starts off: the lamps in their row and dark, the curtains bunched, out of the lane), then the swap',
      first.parked && first.lamps === 0 && first.curtains === 0 && first.glow === 0 && first.lane >= 1.3 && fx.parked && fx.lane >= 1.3, JSON.stringify({ first, parked: fx.parked, lane: fx.lane }));
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
    await page.evaluate(() => { __garage.fitUpg('aero', 3); __garage.fitUpg('zavore', 3); __garage.fitUpg('gume', 2); __garage.fitUpg('motor', 0); }); const r = await run();
    const u = await ui(), p = u.info.parts;
    T.check('the upgrades: the turntable never rises nor turns (the camera goes round the car)', r.table === 0 && r.ang === 0, JSON.stringify(r));
    const paid = m0 - u.S.money, want = 23000 + 23000 + 7000;   // (aero 0 -> 3, brakes 0 -> 3, tyres 1 -> 2; the engine down to stock: free)
    T.check('upgrades: wing kit, brakes, tyres fitted, the engine back to stock; their parts on the car', u.info.upg.aero === 3 && u.info.upg.zavore === 3 && u.info.upg.gume === 2 && u.info.upg.motor === 0 && p.aero >= 8 && p.zavore === 8 && p.gume === 4 && p.motor === 0, JSON.stringify(u.info));
    T.check('upgrades: paid ' + want + ' CR', paid === want, 'paid ' + paid);
    await page.evaluate(() => __garage.fitUpg('motor', 3)); await run();
    const u2 = await ui();
    T.check('the engine bought back to the level owned (3): free, its exhausts and bonnet scoop on the car', u2.S.money === u.S.money && u2.info.upg.motor === 3 && u2.info.parts.motor >= 6, JSON.stringify({ money: u2.S.money, parts: u2.info.parts }));
    T.check('after the shows the turntable is home, the lift down', Math.abs(u2.info.ang) < 0.01 && u2.info.lift === 0, JSON.stringify(u2.info));
    // the tyres (back to a level owned: free): the car up on the lift, then down, the arms stowed
    await page.evaluate(() => __garage.fitUpg('gume', 1)); const r2 = await run();
    const L = await page.evaluate(() => ({ info: Garage3D.info, lift: Garage3D._dbg.lift }));
    T.check('the tyres: the car up on the lift (>= 0.4 m), the table still; then down, the arms stowed out of the lane', r2.lift >= 0.4 && r2.table === 0 && r2.ang === 0 && L.info.lift === 0 && L.info.upg.gume === 1 && L.lift.arms === 0 && !L.lift.on && L.lift.carriage === 0.04 && L.lift.lane >= 1.38, JSON.stringify({ r2, L: { lift: L.info.lift, arms: L.lift.arms, on: L.lift.on, carriage: L.lift.carriage, lane: L.lift.lane } }));
  }

  // 5. the service (the rally car: dirty, scratched, its engine worn) and the paint; the rally car asked for while the muscle car is
  // left up on the lift (as a show cut short would leave it: the swap brings it down, stows the arms, then it drives out)
  {
    await page.evaluate(() => { Garage3D._dbg.raise(0.6); __garage.pickCar('rally'); }); const rs = await run();
    const u0 = await ui(), L0 = await page.evaluate(() => Garage3D._dbg.lift);
    T.check('a car asked for while the other is up on the lift: it comes down first, then the swap (the arms stowed)', rs.lift > 0 && rs.moved === 0 && u0.info.car === 'rally' && u0.info.lift === 0 && L0.arms === 0 && !L0.on && L0.carriage === 0.04, JSON.stringify({ rs, car: u0.info.car, arms: L0.arms }));
    await page.evaluate(() => __garage.doService('all')); const r = await run();
    const u = await ui(), L = await page.evaluate(() => Garage3D._dbg.lift);
    T.check('a full service: clean, no scratches, condition 100 %, paid', u0.info.dirt > 0.3 && u.info.dirt === 0 && u.info.scr === 0 && u.S.cars.rally.cond.engine === 1 && u.S.money < u0.S.money && u.info.lift === 0, JSON.stringify({ before: u0.info, after: u.info }));
    T.check('the service: the lift raises the car for the engine (>= 1 m) and lowers it, its arms stowed; the table never rises nor turns', r.lift >= 1.0 && r.table === 0 && r.ang === 0 && u.info.lift === 0 && L.arms === 0 && !L.on, JSON.stringify({ r, arms: L.arms }));
    await page.evaluate(() => __garage.doPaint(5, false)); await run();
    const u2 = await ui();
    T.check('a new colour (green, no stripes): the car painted, 2.000 CR taken', u2.info.color === 0x2fa84f && u2.info.stripe === false && u.S.money - u2.S.money === 2000 && u2.info.car === 'rally', JSON.stringify(u2.info));
  }

  // 6. English
  {
    await page.evaluate(() => __garage.onAct('lang'));
    const t = await page.evaluate(() => ({ h: document.querySelector('.g-title h1').textContent, go: document.getElementById('g-go').textContent, tile: document.querySelector('.g-tile small').textContent, html: document.documentElement.lang, plate: (__garage.advance(0.1), Garage3D._dbg.fx.rack.plate) }));
    T.check('English: GARAGE, Select, the tiles in English, the tool stand\'s plate TOOLS', t.h === 'GARAGE' && t.go === 'Select' && t.tile === 'Car' && t.html === 'en' && t.plate === 'TOOLS', JSON.stringify(t));
    await page.evaluate(() => __garage.onAct('lang'));
    const pl = await page.evaluate(() => (__garage.advance(0.1), Garage3D._dbg.fx.rack.plate));
    T.check('back in Slovenian: the plate ORODJA again', pl === 'ORODJA', pl);
  }

  // 7. every car of the game on the turntable, all its upgrades at the top level: built, the parts measured onto it
  {
    const r = await page.evaluate(() => Core.MODELS.map(M => { Garage3D.show({ M, color: 0xd81f2a, stripe: true, upg: { motor: 3, gume: 3, zavore: 3, aero: 3 }, cond: { clean: 1, body: 1, engine: 1 } }); __garage.advance(0.1);
      const i = Garage3D.info; return { id: M.id, ok: i.car === M.id && i.parts.gume >= 4 && i.parts.aero >= 2 && (M.ev || i.parts.motor >= 4) }; }));
    const bad = r.filter(x => !x.ok);
    T.check(`all ${r.length} cars with every part at level 3`, !bad.length, JSON.stringify(bad));
    // the lift's pads planned on each of them (its parts too: the skirts, the light strips), the electric car up on it: its light's pool
    // and its shadow stay on the floor
    // (each pad: clear of its axle's tyres (15 cm), within its arm's reach, its top on the underside over it: the body's lowest over the
    // rubber, a ray up at its middle (the cars' bodies are mostly open below: rays both ways) or else the sill's lower edge (the lowest
    // height the side covers the rubber, rays from the side); 3 cm either way; a low racer under its floor: up to 5 cm into it, or as
    // low as the lift goes (the carriage at its lowest, the screw in))
    const pl = await page.evaluate(() => Core.MODELS.map(M => { Garage3D.show({ M, color: 0xd81f2a, stripe: true, upg: { motor: 3, gume: 3, zavore: 3, aero: 3 }, cond: { clean: 1, body: 1, engine: 1 } });
      const D = Garage3D._dbg, cv = Garage3D.cur, p = D.liftPlan(cv), A = D.LIFT.arms, ms = [...cv.probe.meshes], rc = new THREE.Raycaster(), V = THREE.Vector3, bad = [];
      for (const k of ['aero', 'motor']) { const g = cv.parts[k]; if (g) g.traverse(o => { if (o.isMesh && o.visible && o !== g.userData.pool) ms.push(o); }); }
      if (p.pads.length !== 4 || !p.pads.every(q => q.every(Number.isFinite))) return { id: M.id, bad: ['pads ' + JSON.stringify(p.pads)] };
      rc.layers.enableAll(); cv.v.grp.updateMatrixWorld(true); const sides = ms.map(m => m.material.side); ms.forEach(m => { m.material.side = THREE.DoubleSide; });
      const hit = (o, d) => { rc.set(o, d); rc.far = 20; const h = rc.intersectObjects(ms, false); return h.length ? h[0].point : null; };
      const side = (x, y, sd) => { const q = hit(new V(x, y, sd * 5), new V(0, 0, -sd)); return q ? Math.abs(q.z) : 0; };
      const covers = (x, y, z) => Math.min(side(x - 0.06, y, Math.sign(z)), side(x, y, Math.sign(z)), side(x + 0.06, y, Math.sign(z))) >= Math.abs(z) + 0.05;
      p.pads.forEach(([x, z], i) => { const a = A[i], top = p.cc + a.lv * D.LIFT.du + D.PAD.h + p.post[i], d = Math.hypot(x - a.p[0], z - a.p[1]);
        for (const w of cv.wheels) if (w.front === (a.end > 0) && Math.abs(w.x - x) < w.r + 0.15) bad.push(i + ': on the tyre ' + (Math.abs(w.x - x) - w.r).toFixed(3));
        if (d < a.lc + 0.02 || d > 3 * a.lc - 0.5) bad.push(i + ': out of reach ' + d.toFixed(3));
        let u = 9; for (let y = 0; y < 1.3; y += 0.02) if (covers(x, y, z)) { u = y; for (let y2 = y - 0.02; y2 < y; y2 += 0.004) if (covers(x, y2, z)) { u = y2; break; } break; }
        const b = hit(new V(x, -1, z), new V(0, 1, 0)); if (b) u = Math.min(u, b.y);
        const g = top - u, low = cv.kit.bottom < 0.12, least = p.cc <= D.PAD.cmin + 1e-4 && p.post[i] <= D.PAD.min + 1e-4;
        if (g < -0.03 || (g > (low ? 0.05 : 0.03) && !(low && least))) bad.push(i + ': pad top ' + top.toFixed(3) + ' underside ' + u.toFixed(3)); });
      ms.forEach((m, i) => { m.material.side = sides[i]; });
      return { id: M.id, bad }; })).then(a => a.filter(x => x.bad.length));
    const ev = await page.evaluate(() => { const M = Core.MODELS.find(m => m.ev); Garage3D.show({ M, color: 0xd81f2a, stripe: true, upg: { motor: 3, gume: 3, zavore: 3, aero: 3 }, cond: { clean: 1, body: 1, engine: 1 } });
      Garage3D._dbg.raise(0.55); __garage.advance(0.1); const cv = Garage3D.cur, w = new THREE.Vector3(), b = new THREE.Vector3(); cv.parts.motor.userData.pool.getWorldPosition(w); cv.v.blob.getWorldPosition(b);
      const o = { lift: Garage3D.info.lift, pool: +w.y.toFixed(3), blob: +b.y.toFixed(3) }; Garage3D.show(cv.spec); __garage.advance(0.1); return o; });
    T.check('the lift\'s pads planned on every car with all its parts (clear of the tyres, in the arms\' reach, on the underside); the electric car up on the lift: its light\'s pool and shadow on the floor', !pl.length && ev.lift >= 0.5 && ev.pool < 0.02 && ev.blob < 0.02, JSON.stringify({ pl, ev }));
  }

  // 8. the pictures of the cars in the car panel
  {
    await page.evaluate(() => { __garage.panel = 'car'; });
    for (let i = 0; i < 30; i++) { await page.evaluate(() => __garage.advance(0.05)); await page.waitForTimeout(250); if (await page.evaluate(() => document.querySelectorAll('.g-car .th img').length) >= 10) break; }
    const n = await page.evaluate(() => [...document.querySelectorAll('.g-car .th img')].filter(i => /^data:image\/png/.test(i.src)).length);
    T.check('the car panel: a picture of each of the 10 cars', n === 10, n + ' pictures');
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
