// The garage (garaza.html): the workshop over the whole screen (the page's buttons over it: Izberi progo and the coins at the top, the
// car's name, the cars before and after it, back and Izberi at the bottom), the guide on the first visit; the regal behind the car (the
// names on its prisms in British English, its cost), the cabinet before it (the three cars' maquettes, the signs, the SERVICE
// button), the colour circles, the lift's plate; ring 9 over the car with its two hanging arms (no robot nor stand on the floor), the
// chamber's glass; the camera (left and right only); a tap on a part: its menu (four tabs with their prices, four tiles, the chosen one
// blue and the others orange in the picture too, the new part seen through on the car, at the bottom when at the top it would cover
// the part), buying (euros, the tyres on offer, the stock part back), the four upgrades from the parts; the service by the arms (its
// price by the wear and the car's worth; the PICO, the FORMULA, the KAMEN lorry), the paint in the glass chamber; the English page;
// every car of the game's fleet with all its parts (the lift's pads); the wide vehicles' way in and out; the garage opened from the
// game's car screen and its back and Izberi progo buttons. The animations run on a clock the test steps itself (software WebGL is
// slow). Zero page errors allowed.
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
  // the guide on the first visit (a fresh profile): five steps, each a ring round what to tap and a bubble; done, it is not shown again
  {
    const g = await page.evaluate(async () => { const el = document.getElementById('g-guide'), out = { on: el.classList.contains('on'), steps: [] };
      for (let i = 0; i < 8 && el.classList.contains('on'); i++) { out.steps.push({ ring: el.querySelectorAll('.ring').length, t: el.querySelector('.bub b').textContent }); el.querySelector('[data-guide]').click(); }
      out.after = el.classList.contains('on'); out.saved = JSON.parse(localStorage.getItem('apex-garage')).guide; return out; });
    T.check('the guide on the first visit: 5 steps (the regal, the cars on the cabinet, the service, the paint, the other cars), each with its ring (the last two: the buttons for the cars before and after); then gone, remembered', g.on && g.steps.length === 5 && g.steps.every((s, i) => s.ring === (i === 4 ? 2 : 1)) && g.steps[0].t === 'Deli na regalu' && !g.after && g.saved === 1, JSON.stringify(g));
  }
  await page.evaluate(() => { __garage.hold = true; });
  // the animations to their end (the clock stepped half a second at a time while a show plays or waits); returns the seconds it took
  // and what the lift and the turntable did meanwhile (the car's highest on the lift, the table's height and angle at their most)
  // (a short pause between the steps: the next show in the queue starts on a promise)
  // (moved: how far a car up on the lift (or with its arms out) went from the table's middle: none drives off it)
  // (arms: the lowest any arm's wrist came, the furthest it went out along x and z: in the ring)
  const run = () => page.evaluate(async () => { let t = 0, lift = 0, table = 0, ang = 0, moved = 0, low = 9, ax = 0, az = 0;
    do { __garage.advance(0.5); t += 0.5; const i = Garage3D.info, L = Garage3D._dbg.lift; lift = Math.max(lift, i.lift); table = Math.max(table, Math.abs(L.table)); ang = Math.max(ang, Math.abs(i.ang));
      for (const A of Garage3D._dbg.RB) { low = Math.min(low, A.s.y); ax = Math.max(ax, Math.abs(A.s.x)); az = Math.max(az, Math.abs(A.s.z)); }
      if (i.lift > 0.01 || L.arms > 0) moved = Math.max(moved, Math.abs(Garage3D.cur.root.position.x)); await new Promise(r => setTimeout(r, 0)); } while (Garage3D.busy && t < 200);
    return { t, lift, table, ang, moved, low: +low.toFixed(3), ax: +ax.toFixed(3), az: +az.toFixed(3) }; });
  const ui = () => page.evaluate(() => ({ money: document.getElementById('g-money').textContent, name: document.getElementById('g-name').textContent, go: document.getElementById('g-go').textContent.replace(/\u00a0/g, ' ').trim(),
    track: document.getElementById('g-track').getAttribute('aria-label'), flag: !!document.querySelector('#g-track svg.fl'), info: Garage3D.info, S: JSON.parse(JSON.stringify(__garage.S)) }));
  // (a tap on a thing of the picture (its box's middle on the screen): the menu it opened)
  // (the menu shown on the next frame: waited for)
  const tap = (key) => page.evaluate(async (key) => { const b = Garage3D.box(key); __garage.onTap(b.x + b.w / 2, b.y + b.h / 2); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return __garage.menu && JSON.parse(JSON.stringify(__garage.menu)); }, key);
  const menuDom = () => page.evaluate(() => { const m = document.getElementById('g-menu'); return { on: m.classList.contains('on'), bot: m.classList.contains('bot'), tabs: [...m.querySelectorAll('.g-mt button')].map(b => [b.querySelector('b').textContent, b.querySelector('small').textContent.replace(/\u00a0/g, ' '), b.classList.contains('sel')]),
    tiles: [...m.querySelectorAll('.g-tl')].map(b => ({ n: b.querySelector('b').textContent, p: b.querySelector('i').textContent.replace(/\u00a0/g, ' '), sel: b.classList.contains('sel'), fit: b.classList.contains('fit'), old: !!b.querySelector('s') })),
    buy: m.querySelector('.buy') && m.querySelector('.buy').textContent.replace(/\u00a0/g, ' '), can: m.querySelector('.buy') && !m.querySelector('.buy').disabled, stock: !!m.querySelector('[data-mact="stock"]'), rect: m.getBoundingClientRect().toJSON() }; });

  // 1. the page: a fresh profile (the full game: 11.500, the PICO TURBO), the car on the table, the page's buttons over the workshop
  // (the whole screen), the room drawn in a sensible number of draws
  {
    const u = await ui(), calls = await page.evaluate(() => { __garage.advance(0.1); return Garage3D.renderer.info.render.calls; });
    T.check('opens: 11.500 by the gold coin, PICO TURBO on the turntable, the go button "Izberi", Izberi progo at the top (a flag, no words: no track known yet, a chequered one)', u.money === '11.500' && u.name === 'PICO TURBO' && u.info.car === 'pico' && u.go === 'Izberi' && u.track === 'Izberi progo' && u.flag, JSON.stringify({ money: u.money, name: u.name, car: u.info.car, go: u.go }));
    const L0 = await page.evaluate(() => { const r = (id) => document.getElementById(id).getBoundingClientRect(), st = r('g-stage'), app = document.getElementById('g-app').getBoundingClientRect(), cr = r('g-cr'), hd = document.querySelector('.g-head').getBoundingClientRect();
      const pv = r('g-prev'), nx = r('g-next'), go = r('g-go'), nm = r('g-name');
      return { full: Math.abs(st.top - app.top) < 1 && Math.abs(st.bottom - app.bottom) < 1 && Math.abs(st.width - app.width) < 1, coin: +(cr.width / (hd.width - 28)).toFixed(2), cars: pv.bottom <= go.top && nx.bottom <= go.top && nm.bottom <= pv.top && Math.abs(pv.top - nx.top) < 1 && pv.right < nx.left,
        imgs: [...document.querySelectorAll('.g-cb .th img')].length, shift: Garage3D.camera.view ? Garage3D.camera.view.offsetY : 0 }; });
    T.check('the workshop over the whole page, raised (its picture shifted up), the coins\' button a third of the top, the name over the two cars\' buttons over back and Izberi', L0.full && L0.shift > 30 && L0.coin > 0.3 && L0.coin < 0.37 && L0.cars, JSON.stringify(L0));
    T.check('the worn car shows its wear: dirt and scratches on the paint', u.info.dirt > 0.2 && u.info.scr > 0.2, JSON.stringify(u.info));
    T.check('draw calls of the garage stay modest (< 260)', calls > 20 && calls < 260, calls + ' calls');
    const kept = await page.evaluate(() => Garage3D._dbg.pieces.filter(p => p.g || p.sm).length);
    T.check('the room built, its builders\' arrays let go (the phone\'s memory)', kept === 0, kept + ' pieces still hold them');
    const L = await page.evaluate(() => Garage3D._dbg.lift);
    T.check('one lift column, behind the car (far side), its arms stowed out of the cars\' lane (|z| >= 1.38), the turntable flush', L.posts === 1 && L.z < -1.3 && L.raw < -1.3 && L.box[1][2] < -1.3 && L.arms === 0 && L.lane >= 1.38 && L.table === 0 && !L.on, JSON.stringify(L));
    // ring 9 and its arms at rest: nothing of them under 2.8 m (the cars pass under them), both parked at the ring's left end out past the
    // cars' sides, no tool in hand; the chamber stored (its glass over 3.4 m, one band drawn, its lights off); nothing on the floor
    // of the old fixtures (no robot, rail, stand, drum, tyre tower)
    const F = await page.evaluate(() => { const D = Garage3D._dbg; return { fx: D.fx, ch: D.chamber, old: ['rack', 'stand', 'drums', 'towers', 'shelf', 'rims', 'kits'].filter(k => D.FREE[k]) }; });
    T.check('ring 9\'s two arms parked at its left end (over 2.8 m, out past the cars\' sides: |z| >= 2), no tool; the chamber stored (glass over 3.4 m, one band drawn, its lights off); no robot, rail, stand, drum nor tyre tower on the floor',
      F.fx.parked && F.fx.tools === 0 && F.fx.arms.every(a => a.rest && a.tool === 'none' && a.low > 2.8 && Math.abs(a.s.z) >= 2 && a.s.x < -2 && a.cast) && F.ch.k === 0 && F.ch.low > 3.4 && F.ch.glassDrawn === F.ch.band0[0] && F.ch.led.every(q => q === 0) && !F.old.length,
      JSON.stringify(F));
    // the regal behind the car (sklop 3, the user's concept): five bays round the car's back; on them the elements' names on navy prisms,
    // in British English; in the home view (its bays on the stage, not stepped aside), the wings in the car's colour; its cost
    const RG = await page.evaluate(() => { const D = Garage3D._dbg, R = D.RGL, cam = Garage3D.camera, cv = Garage3D.renderer.domElement.getBoundingClientRect(), st = document.getElementById('g-stage').getBoundingClientRect();
      const onStage = R.bays.map(b => { const p = new THREE.Vector3(b.x, 1.3, b.z).project(cam), x = cv.left + (p.x + 1) / 2 * cv.width, y = cv.top + (1 - p.y) / 2 * cv.height; return p.z < 1 && x >= st.left && x <= st.right && y >= st.top && y <= st.bottom; });
      const ms = []; R.P.root.traverse(o => { if (o.isMesh) ms.push(o); });
      return { bays: R.bays.length, onStage, gone: R.P.k, visible: R.P.root.visible, names: R.names.map(n => n.nm), items: R.items.length, meshes: ms.length, verts: ms.reduce((q, m) => q + m.geometry.attributes.position.count, 0),
        wall: R.wall.visible && R.wall.geometry.attributes.position.count, col: R.col === Garage3D.cur.spec.color, main: D.stats.main, tris: D.stats.tris }; });
    const NAMES = ['SNOW', 'TRACK SLICK', 'MOUNTAIN', 'SPORT', 'RACE', 'TITANIUM', 'CARBON', 'TWIN', 'STRAIGHT', 'CHROME 3-SPOKE', 'GOLD 5-SPOKE', 'ORANGE 10-SPOKE', 'BLACK MESH', 'AIR FILTER', 'ECU CHIP', 'TURBO',
      'LIGHT BATTERY', 'SPRINGS', 'DAMPERS', 'ANTI-ROLL BARS', 'SPORT PADS', 'HORN', 'TYRE SMOKE', 'DUCKTAIL', 'SHORT WING', 'LOW WING', 'GT WING', 'DOUBLE WING'];
    T.check('the regal behind the car: five bays, at least four of them on the stage in the home view, not stepped aside, the wings in the car\'s colour', RG.bays === 5 && RG.onStage.filter(Boolean).length >= 4 && RG.gone === 0 && RG.visible && RG.col, JSON.stringify(RG));
    T.check('the regal\'s labels: a prism before each of its 28 elements (each a thing to tap), the names in British English (TRACK SLICK, TYRE SMOKE, no Slovenian letters), each once',
      RG.names.length === NAMES.length && RG.items === NAMES.length && NAMES.every(n => RG.names.includes(n)) && RG.names.every(n => /^[A-Z0-9 -]+$/.test(n)), JSON.stringify(RG.names));
    T.check('the regal\'s cost: 3 meshes (the frame and parts, the atlas, the shadows) under 60k vertices, the old wall one more; the first view\'s main pass under 90 draws and 150k triangles (' + RG.main + ', ' + RG.tris + ')',
      RG.meshes === 3 && RG.verts < 60000 && RG.wall > 0 && RG.wall < 2000 && RG.main < 90 && RG.tris < 150000, JSON.stringify({ meshes: RG.meshes, verts: RG.verts, wall: RG.wall, main: RG.main, tris: RG.tris }));
    // the cabinet before the car and the colour circles: every thing to tap on the screen in the first view, clear of the page's buttons,
    // at least 40 x 40 px to a tap (the small ones' places grown round their middles: pick)
    const FR = await page.evaluate(() => { const G = Garage3D, st = document.getElementById('g-stage').getBoundingClientRect(), low = document.getElementById('g-low').getBoundingClientRect(), head = document.querySelector('.g-head').getBoundingClientRect();
      const keys = ['mq0', 'mq1', 'mq2', 'service', 'lift', ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => 'col' + i), 'rgl:TURBO', 'rgl:SNOW', 'rgl:GT WING'], out = {};
      for (const k of keys) { const b = G.box(k), cx = b.x + b.w / 2, cy = b.y + b.h / 2, h = G.pick(cx, cy); out[k] = { on: cx > 0 && cx < st.width && cy > head.bottom - st.top && cy < low.top - st.top, hit: h && h.key === k, w: Math.round(b.w), h: Math.round(b.h) }; }
      return out; });
    const bad = Object.entries(FR).filter(([k, q]) => !q.on || !q.hit);
    T.check('the first view: the 3 maquettes, the SERVICE button, the lift\'s plate, the 8 colour circles and the regal\'s parts on the screen between the page\'s buttons, each tapped at its middle picked', !bad.length, JSON.stringify(bad.length ? bad : FR));
  }

  // 1c. the ring's moves through the shows' queue: the chamber down round the car and up (the glass's foot on the floor, clear of the
  // arms and the lift where a band is), an arm takes a tool in its carriage and puts it away, an arm to a point over the car and back
  {
    await page.evaluate(() => { Garage3D._dbg.fxDemo('chamber'); }); await run();
    const ch = await page.evaluate(() => { const D = Garage3D._dbg; return { log: D.fxLog, after: D.chamber }; });
    T.check('the chamber: down (its inner band\'s foot on the floor, the arms keep their tools) and up again (stored, its lights off)', ch.log[0].k === 1 && ch.log[0].low < 0.01 && ch.log[1].k === 0 && ch.after.low > 3.4 && ch.after.led.every(q => q === 0), JSON.stringify(ch));
    const clr = await page.evaluate(() => { const D = Garage3D._dbg; D.setChamber(1); __garage.advance(0.1); const c = D.chamberClear(); D.setChamber(0); __garage.advance(0.1); return c; });
    T.check('the chamber down: its glass clear of the arms and the lift (' + clr + ' m)', clr >= 0.03, clr);
    await page.evaluate(() => { Garage3D._dbg.fxDemo('tool', { arm: 1, tool: 'brush' }); }); await run();
    const tl = await page.evaluate(() => ({ log: Garage3D._dbg.fxLog, parked: Garage3D._dbg.fx.parked }));
    T.check('an arm takes a tool in its carriage (the brush, the only tool drawn) and puts it away, parked after', tl.log[0].tool === 'brush' && tl.log[0].visible === 1 && tl.log[1].tool === 'none' && tl.parked, JSON.stringify(tl));
    await page.evaluate(() => { Garage3D._dbg.fxDemo('go', { arm: 1, tool: 'polisher', tip: [1.4, 1.2, -0.3], dir: [0, -1, 0] }); }); const r = await run();
    const go = await page.evaluate(() => ({ log: Garage3D._dbg.fxLog, parked: Garage3D._dbg.fx.parked }));
    const d = Math.hypot(go.log[0].tip[0] - 1.4, go.log[0].tip[1] - 1.2, go.log[0].tip[2] + 0.3);
    T.check('an arm to a point over the bonnet (its pad there, ' + d.toFixed(3) + ' m off), back to its rest; never out of the ring (|x| <= 2.7, |z| <= 2.1)', d < 0.01 && go.parked && r.ax <= 2.701 && r.az <= 2.081, JSON.stringify({ go, r }));
  }
  // 1b. the camera: dragged left or right it goes round the car; up and down, the wheel, a pinch: nothing (no zoom, the height stays)
  {
    const box = await page.evaluate(() => { const r = document.getElementById('g-gl').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    const cam = () => page.evaluate(() => { __garage.advance(1); const p = Garage3D.camera.position, R = Garage3D._dbg.rig; return { x: p.x, y: p.y, z: p.z, d: Math.hypot(p.x - R.tx, p.z - R.tz) }; });   // (its distance from the point it goes round)
    // (held still at the end: no swing after it; small turns: the camera stays clear of the walls)
    const drag = async (dx, dy) => { await page.mouse.move(box.x, box.y); await page.mouse.down(); for (let i = 1; i <= 7; i++) await page.mouse.move(box.x + dx * Math.min(1, i / 6), box.y + dy * Math.min(1, i / 6)); await page.mouse.up(); };
    const c0 = await cam();
    await drag(0, 120);
    const c1 = await cam(), same = Math.hypot(c1.x - c0.x, c1.z - c0.z) < 0.02 && Math.abs(c1.y - c0.y) < 0.03;
    await page.mouse.move(box.x, box.y); await page.mouse.wheel(0, 600); const cw = await cam(), further = cw.d > c0.d + 0.5;   // (the wheel: further (the zoom, 8d))
    await page.evaluate(() => { Garage3D._dbg.zoom = 1; });
    await drag(-30, 20); await page.mouse.move(box.x, box.y); await page.mouse.wheel(50, 0);
    const c2 = await cam(), round = Math.hypot(c2.x - c0.x, c2.z - c0.z) > 1 && Math.abs(c2.y - c0.y) < 0.03 && Math.abs(c2.d - c0.d) < 0.03;
    T.check('the camera: a drag up and down does nothing, the wheel takes it further; left and right (a drag, a sideways scroll) it goes round, its height and distance kept', same && further && round, JSON.stringify({ c0, c1, cw, c2 }));
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

  // 1d. the service by the arms (the near one: the lance's four passes along the near side, the scanner from beside the car, the
  // wrench under the car up on the lift; the far one: the brush and the pad over the bonnet, the lamp under the car), on the PICO, the
  // FORMULA (low, open) and the KAMEN lorry (tall, wide): every item done, in its order, its cues met (none late), clean, no scratches,
  // the engine mended; the arms in the ring all along, parked after; the lift down, the table never turning
  for (const id of ['pico', 'formula', 'kamen']) {
    if (id !== 'pico') { await page.evaluate((id) => Garage3D.show(Object.assign({}, Garage3D.cur.spec, { M: Core.MODELS.find(m => m.id === id) })), id); await page.evaluate(() => __garage.advance(0.5)); }
    await page.evaluate(() => { Garage3D._dbg.svcRun(['clean', 'body', 'engine']); }); const r = await run();
    const sv = await page.evaluate(() => { const D = Garage3D._dbg, S = D.svc; return { done: S.done.map(d => d.kind).join(), late: S.log.filter(q => /^late/.test(q[1])).map(q => q[1]), parked: D.fx.parked, info: Garage3D.info, cue: Object.keys(S.cue).length, plans: S.plans, beams: S.fx.beams, oil: S.fx.oil }; });
    T.check(`the service on the ${id.toUpperCase()} by the arms: wash, body, engine in a row (${r.t} s), no cue late; clean, no scratches; the lift up (${r.lift.toFixed(2)} m) and down; the arms in the ring (lowest ${r.low} m), parked after`,
      sv.done === 'clean,body,engine' && !sv.late.length && sv.parked && sv.info.dirt === 0 && sv.info.scr === 0 && sv.info.lift === 0 && r.lift >= 1.3 && r.table === 0 && r.ang === 0 && r.ax <= 2.701 && r.az <= 2.081 && r.low >= 0.3 && r.t < 60 && !sv.beams.some(Boolean) && !sv.oil,
      JSON.stringify({ r, sv }));
  }
  // (the chamber down round every car of the fleet (the longest: the KAMEN lorry, the PREDSEDNIK; the widest): its glass clear of each)
  {
    const clr = await page.evaluate(() => { const D = Garage3D._dbg, out = [];
      for (const M of Core.MODELS) { Garage3D.show(Object.assign({}, Garage3D.cur.spec, { M })); __garage.advance(0.1); D.setChamber(1); __garage.advance(0.1); out.push([M.id, D.chamberClear(true)]); D.setChamber(0); __garage.advance(0.1); }
      return out.sort((a, b) => a[1] - b[1]); });
    T.check(`the chamber down round every car of the fleet (${clr.length}): its glass clear of each (the closest ${clr[0][0]}, ${clr[0][1]} m)`, clr.length > 20 && clr[0][1] >= 0.05, JSON.stringify(clr.slice(0, 5)));
  }
  await page.evaluate(() => { const S = __garage.S; Garage3D.show(Object.assign({}, Garage3D.cur.spec, { M: Core.MODELS.find(m => m.id === S.car), cond: S.cars[S.car].cond })); __garage.advance(0.5); });

  // 2. a car not bought: it drives in (the button of the next car), the go button buys it; too little money: refused, nothing taken
  {
    await page.evaluate(() => { __garage.pickCar('kaze'); }); await run();
    const u = await ui();
    T.check('another car: the PICO drives out, the KAZE RS drives in and stops on the table, its price in euros under its name and on the go button', u.info.car === 'kaze' && u.name === 'KAZE RS' && Math.abs(u.info.ang) < 0.01 && /Kupi · 30\.000 €/.test(u.go), JSON.stringify({ car: u.info.car, go: u.go }));
    await page.evaluate(() => __garage.buy());
    const u2 = await ui(), toast = await page.evaluate(() => document.getElementById('g-toast').textContent);
    T.check('too little money for it: refused, the money unchanged', u2.money === '11.500' && !u2.S.cars.kaze.own && /Premalo denarja/.test(toast), toast);
    const m = await tap('rgl:TURBO');
    T.check('a part of a car not bought tapped: no menu, a word to buy the car first', !m && /Najprej kupi avto/.test(await page.evaluate(() => document.getElementById('g-toast').textContent)), JSON.stringify(m));
  }

  // 3. the veteran's profile: much money, cars with parts (their levels from them); buying one
  {
    await page.evaluate(() => document.querySelector('#g-modes [data-mode="vet"]').click()); await run();
    const u = await ui();
    T.check('the veteran: 248.500, the KAZE RS (owned) on the table, its parts\' levels (engine 3, tyres 3, brakes 2, aero 3)', u.money === '248.500' && u.S.car === 'kaze' && u.info.car === 'kaze' && u.S.cars.kaze.own && u.info.upg.motor === 3 && u.info.upg.gume === 3 && u.info.upg.zavore === 2 && u.info.upg.aero === 3, JSON.stringify({ money: u.money, car: u.info.car, upg: u.info.upg }));
    await page.evaluate(() => __garage.pickCar('formula')); await run();
    await page.evaluate(() => __garage.buy());
    const u2 = await ui();
    T.check('bought: the FORMULA ORKAN for 90.000 € (248.500 -> 158.500), the go button now chooses it', u2.S.cars.formula.own && u2.S.money === 158500 && u2.go === 'Izberi' && u2.info.car === 'formula', JSON.stringify({ money: u2.S.money, go: u2.go }));
  }

  // 4. the menus on the muscle car: a part of the regal tapped (the turbo): its menu with four tabs (the categories, their prices), four
  // tiles (its option chosen: blue), at the bottom (the turbo is high on the regal: at the top the menu would cover it); in the picture
  // the turbo blue, the new parts seen through on the car (the engine's level would change); another tab, a dearer turbo bought: paid,
  // the engine's level up, its show; ↺ SERIJSKO back to the stock one (free); the tyres on offer; the aero kits' menu (RACE locked till
  // SPORT is fitted); a tap on nothing closes the menu (its marks gone); the cabinet's three cars (a maquette tapped: its car in)
  {
    await page.evaluate(() => __garage.pickCar('muscle')); await run();
    // (the stock tyres (Touring) are one of the options: fitted (✓), not for sale again, no ↺ SERIJSKO)
    {
      const st = await page.evaluate(() => { const c = __garage.S.cars[__garage.S.car], g0 = c.parts.gume; delete c.parts.gume; __garage.openMenu({ el: 'gume', key: 'car:wheel' }); const m = __garage.menu, el = document.getElementById('g-menu');
        const out = { sel: m.sel, fit: [...el.querySelectorAll('.g-tl')].map(b => b.classList.contains('fit')), buy: el.querySelector('.buy').textContent, can: !el.querySelector('.buy').disabled, stock: !!el.querySelector('[data-mact="stock"]') };
        __garage.closeMenu(); if (g0) c.parts.gume = g0; return out; });
      T.check('the stock tyres (Touring): the tyres\' menu opens on them, fitted (✓), not to be bought again, no ↺ SERIJSKO', st.sel.join() === '0,2' && st.fit.join() === 'false,false,true,false' && st.buy === 'NAMEŠČENO ✓' && !st.can && !st.stock, JSON.stringify(st));
    }
    const m = await tap('rgl:TURBO'), d = await menuDom(), mk = await page.evaluate(() => ({ marks: Garage3D._dbg.marks, ghost: Garage3D.ghosted }));
    T.check('the turbo tapped: its menu (4 tabs: name and prices, its own tab chosen; 4 tiles, Turbo · 2.500 € blue), at the bottom; the turbo marked blue in the picture, the engine\'s new parts seen through on the car',
      m && m.el === 'turbo' && d.on && d.bot && d.tabs.length === 4 && d.tabs[1][2] && d.tabs[0][1] === '500–1.600 €' && d.tiles.length === 4 && d.tiles.filter(t => t.sel).length === 1 && d.tiles[1].sel && d.tiles[1].n === 'Turbo' && d.tiles[1].p === '2.500 €'
      && /KUPI IN NAMESTI · 2\.500 €/.test(d.buy) && d.can && !d.stock && mk.marks >= 3 && mk.ghost === 'motor', JSON.stringify({ m, d, mk }));
    const m0 = (await ui()).S.money;
    await page.evaluate(() => { document.querySelector('#g-menu [data-tab="3"]').click(); document.querySelector('#g-menu [data-tile="3,3"]').click(); });
    const d2 = await menuDom();
    T.check('another tab (DVOJNI TURBO): its four tiles, the last one chosen (12.000 €)', d2.tabs[3][2] && d2.tiles[3].sel && /12\.000 €/.test(d2.buy), JSON.stringify(d2));
    await page.evaluate(() => document.querySelector('#g-menu [data-mact="buy"]').click()); const r = await run();
    const u = await ui(), mk2 = await page.evaluate(() => ({ marks: Garage3D._dbg.marks, ghost: Garage3D.ghosted, menu: !!__garage.menu }));
    T.check('bought and fitted: 12.000 € paid, the menu closed (no marks, nothing seen through), the engine\'s level 3 (twin turbo +25 %, the dual exhaust +1,5 %), its show played (its parts on the car), the table still',
      m0 - u.S.money === 12000 && !mk2.menu && mk2.marks === 0 && !mk2.ghost && u.info.upg.motor === 3 && u.info.parts.motor >= 6 && r.table === 0 && r.ang === 0 && JSON.stringify(u.S.cars.muscle.parts.turbo) === '[3,3]', JSON.stringify({ paid: m0 - u.S.money, upg: u.info.upg, parts: u.info.parts, mk2 }));
    await tap('rgl:TURBO'); await page.evaluate(() => { document.querySelector('#g-menu [data-tab="3"]').click(); document.querySelector('#g-menu [data-tile="3,3"]').click(); }); const d3 = await menuDom();
    T.check('the turbo again (the regal\'s turbo chosen; on the twin turbo\'s tab): the fitted option ticked, chosen: FITTED, nothing to buy; ↺ SERIJSKO offered', d3.tiles[3].fit && d3.tiles[3].sel && !d3.can && /NAMEŠČENO/.test(d3.buy) && d3.stock, JSON.stringify(d3));
    await page.evaluate(() => document.querySelector('#g-menu [data-mact="stock"]').click()); await run();
    const u2 = await ui();
    T.check('↺ SERIJSKO: the stock turbo back, free; the engine\'s level 0 again (the exhaust alone +1,5 %)', u2.S.money === u.S.money && !u2.S.cars.muscle.parts.turbo && u2.info.upg.motor === 0, JSON.stringify({ money: u2.S.money, upg: u2.info.upg }));
    // the tyres on the regal: on offer (the old price struck out), the PREMIUM tab's prices with the offer; bought: the car up on the lift
    await tap('rgl:SNOW'); const d4 = await menuDom();
    T.check('the tyres: the regal\'s on offer (Gorske 640 € -> 510 €, Snežne 800 € -> 640 €, struck out), the PREMIUM tab 400–640 €', d4.tabs[1][2] && d4.tabs[1][1] === '400–640 €' && d4.tiles[2].old && /510 €/.test(d4.tiles[2].p) && d4.tiles[3].old && /640 €/.test(d4.tiles[3].p) && d4.tiles[3].sel && /640 €/.test(d4.buy), JSON.stringify(d4));
    await tap('rgl:TRACK SLICK'); const d5 = await menuDom();
    await page.evaluate(() => document.querySelector('#g-menu [data-mact="buy"]').click()); const r2 = await run();
    const u3 = await ui();
    T.check('the track slicks (on offer: 1.600 € -> 1.300 €) bought: the tyres\' level 3 (DIRKALNE, from PREMIUM), the car up on the lift (>= 0.4 m) and down, the table still', d5.tabs[3][2] && d5.tabs[3][1] === '1.300–6.000 €' && d5.tiles[0].old && u2.S.money - u3.S.money === 1300 && u3.info.upg.gume === 3 && r2.lift >= 0.4 && u3.info.lift === 0 && r2.table === 0, JSON.stringify({ paid: u2.S.money - u3.S.money, upg: u3.info.upg, r2, d5 }));
    // the aero kits' menu (a tap on the car's body): RACE locked; SPORT bought, then RACE open
    const mb = await page.evaluate(async () => { const b = Garage3D.box('car'); __garage.onTap(b.x + b.w / 2, b.y + b.h * 0.35); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const m = __garage.menu && __garage.menu.el; __garage.closeMenu(); return m; });
    T.check('a tap on the car\'s body: the aero kits\' menu', mb === 'aero', mb);
    await page.evaluate(() => __garage.openMenu({ el: 'aero', key: null, sel: __garage.findOpt('aero', 'Race') })); const dR = await menuDom();
    T.check('the aero kits\' menu on its RACING tab: its tiles locked (nothing to buy)', dR.tabs[2][2] && !dR.can && /ZAKLENJENO/.test(dR.buy), JSON.stringify(dR));
    await page.evaluate(() => { __garage.closeMenu(); __garage.openMenu({ el: 'aero', key: null, sel: __garage.findOpt('aero', 'Sport') }); document.querySelector('#g-menu [data-mact="buy"]').click(); }); await run();
    const u4 = await ui();
    T.check('the SPORT kit bought (2.600 €): the aero level from it', u3.S.money - u4.S.money === 2600 && u4.info.upg.aero === 2, JSON.stringify({ paid: u3.S.money - u4.S.money, upg: u4.info.upg }));
    await page.evaluate(() => __garage.openMenu({ el: 'aero', key: null, sel: __garage.findOpt('aero', 'Race') })); await page.waitForTimeout(100); const dR2 = await menuDom();
    await page.evaluate(() => { const b = Garage3D.box('mq0'); __garage.onTap(5, b.y - 120); });
    const shut = await page.evaluate(() => ({ menu: !!__garage.menu, marks: Garage3D._dbg.marks, on: document.getElementById('g-menu').classList.contains('on'), low: !document.getElementById('g-low').classList.contains('hide') }));
    T.check('RACE open now (its tile can be bought); a tap on the floor closes the menu (no marks, the bottom buttons back)', dR2.can && !shut.menu && shut.marks === 0 && !shut.on && shut.low, JSON.stringify({ dR2, shut }));
    // the cabinet's three cars: YOUR CAR the muscle car (the lamps over it), FOR SALE and RENT A CAR the next two cars not owned (FOR SALE
    // locked, its price on its tag; the rent on RENT A CAR's), their names under them, all three drawn; a tap on FOR SALE's maquette:
    // that car drives onto the table (the lamps over FOR SALE); on YOUR CAR's: the muscle car back
    const cab = await page.evaluate(() => { const S = __garage.S, O = __garage.ORDER, i0 = O.indexOf('muscle'), free = []; for (let k = 1; k < O.length && free.length < 2; k++) { const id = O[(i0 + k) % O.length]; if (!S.cars[id].own) free.push(id); }
      __garage.advance(0.5); return { free, names: [S.car, ...free].map(id => Core.MODELS.find(m => m.id === id).name), fr: Garage3D._dbg.front }; });
    T.check('the cabinet: YOUR CAR the muscle car (the lamps over it), RENT A CAR and FOR SALE the next two not owned (their names under them, FOR SALE locked with its price, the rent 450 €), all three drawn',
      cab.free.length === 2 && cab.fr.names.join() === [cab.names[0], cab.names[2], cab.names[1]].join() && cab.fr.lit === 0 && cab.fr.lock[2] && /450/.test(cab.fr.price[0]) && /€/.test(cab.fr.price[1]) && cab.fr.shown.every(Boolean), JSON.stringify(cab));
    await tap('mq2'); await run(); const c2 = await page.evaluate(() => ({ car: __garage.S.car, shown: Garage3D.info.car, fr: Garage3D._dbg.front }));
    await tap('mq0'); await run(); const c3 = await page.evaluate(() => ({ car: __garage.S.car, shown: Garage3D.info.car, fr: Garage3D._dbg.front }));
    T.check('FOR SALE\'s maquette tapped: that car drives onto the table (the lamps over FOR SALE, YOUR CAR still the muscle car); YOUR CAR\'s: the muscle car back', c2.car === cab.free[0] && c2.shown === cab.free[0] && c2.fr.lit === 2 && c2.fr.names[0] === cab.names[0] && c3.car === 'muscle' && c3.shown === 'muscle' && c3.fr.lit === 0, JSON.stringify({ c2, c3 }));
  }

  // 5. the service by the SERVICE button (the rally car: dirty, scratched, its engine worn): its prices by the wear and the car's worth,
  // the full service 15 % off; done by the arms; the paint: a colour circle tapped, its four kinds of work, a wrap bought: in the glass
  // chamber (down while it paints), the car green
  {
    await page.evaluate(() => __garage.pickCar('rally')); await run();
    const m = await tap('service'), d = await menuDom(), want = await page.evaluate(() => { const c = __garage.S.cars.rally.cond, f = (e) => Math.pow(Math.max(20000, Core.CAREER.car.rally || 48000) / 68000, e), r = (v) => v < 1000 ? Math.round(v / 10) * 10 : Math.round(v / 50) * 50;
      const p = [r((20 + 280 * (1 - c.clean)) * f(0.3)), r((150 + 15000 * Math.pow(1 - c.body, 1.6)) * f(0.8)), r((180 + 9000 * Math.pow(1 - c.engine, 1.8)) * f(0.8))]; return p.concat([r((p[0] + p[1] + p[2]) * 0.85)]); });
    const shown = d.tiles.map(t => +t.p.replace(/[^0-9]/g, ''));
    T.check('the SERVICE button: its four (wash, body, engine and oil, full service) priced by the wear and the car\'s worth, the full service 15 % off and chosen', m && m.el === 'servis' && d.tiles.length === 4 && !d.tabs.length && shown.join() === want.join() && d.tiles[3].sel, JSON.stringify({ d, want }));
    const m0 = (await ui()).S.money;
    await page.evaluate(() => document.querySelector('#g-menu [data-mact="buy"]').click()); const r = await run();
    const u = await ui(), sv = await page.evaluate(() => Garage3D._dbg.svc.done.map(q => q.kind).join());
    T.check('the full service paid (' + want[3] + ' €) and done by the arms: clean, no scratches, condition 100 %', m0 - u.S.money === want[3] && sv === 'clean,body,engine' && u.info.dirt === 0 && u.info.scr === 0 && Object.values(u.S.cars.rally.cond).every(v => v === 1) && r.lift >= 1.3, JSON.stringify({ paid: m0 - u.S.money, sv }));
    const mp = await tap('col5'), dp = await menuDom();
    T.check('a colour circle (green) tapped: the paint\'s menu (VARČNO, FOLIJA, LAKIRANJE, VRHUNSKO) with the colour named', mp && mp.el === 'barva' && mp.color === 5 && dp.tabs.map(t => t[0]).join() === 'VARČNO,FOLIJA,LAKIRANJE,VRHUNSKO' && dp.tiles.length === 4, JSON.stringify({ mp, dp }));
    // (too little money for the paint chosen: the menu stays (its note says so), a toast, nothing taken)
    const lo = await page.evaluate(() => { const S = __garage.S, m0 = S.money; S.money = 100; __garage.tile(1, 0); __garage.buyMenu();
      const out = { menu: !!__garage.menu, toast: document.getElementById('g-toast').className, note: !!document.querySelector('#g-menu .buy small'), money: S.money }; S.money = m0; __garage.render(); return out; });
    T.check('too little money for the paint chosen: the menu stays open, its note and a toast say so, nothing taken', lo.menu && /bad/.test(lo.toast) && lo.note && lo.money === 100, JSON.stringify(lo));
    await page.evaluate(() => { document.querySelector('#g-menu [data-tab="1"]').click(); document.querySelector('#g-menu [data-tile="1,0"]').click(); document.querySelector('#g-menu [data-mact="buy"]').click(); });
    const pr = await page.evaluate(async () => { let t = 0, ch = 0, tools = 0; do { __garage.advance(0.25); t += 0.25; const D = Garage3D._dbg; ch = Math.max(ch, D.chamber.k); tools = Math.max(tools, D.fx.tools); await new Promise(r => setTimeout(r, 0)); } while (Garage3D.busy && t < 60); return { t, ch, tools, after: Garage3D._dbg.chamber.k, parked: Garage3D._dbg.fx.parked }; });
    const u2 = await ui();
    T.check('painted green in the glass chamber (down while it paints, both arms with their nozzles; up after, the arms parked): the matt wrap, 2.400 €', u2.info.color === 0x2fa84f && u.S.money - u2.S.money === 2400 && JSON.stringify(u2.S.cars.rally.parts.barva) === '[1,0]' && pr.ch === 1 && pr.tools === 2 && pr.after === 0 && pr.parked, JSON.stringify({ pr, info: u2.info }));
    const sh = await page.evaluate(() => (__garage.advance(0.1), Garage3D._dbg.RGL.col));
    T.check('the regal\'s wings follow the car\'s colour (green now)', sh === 0x2fa84f, sh);
  }

  // 6. English: the page's buttons, a menu (its tabs, its tiles, its buy), the regal's names stay English
  {
    await page.evaluate(() => __garage.onAct('lang'));
    await tap('rgl:TURBO'); const d = await menuDom();
    const t = await page.evaluate(() => ({ go: document.getElementById('g-go').textContent, track: document.getElementById('g-track').getAttribute('aria-label'), html: document.documentElement.lang }));
    T.check('English: Choose, Choose a track; the turbo\'s menu: REPLACEMENT, HYBRID, KITS, TWIN TURBO; Turbo · power +14 %; BUY AND FIT · €2,500 (the euros as the game writes them)', t.go === 'Choose' && t.track === 'Choose a track' && t.html === 'en' && d.tabs.map(q => q[0]).join() === 'REPLACEMENT,HYBRID,KITS,TWIN TURBO' && d.tiles[1].n === 'Turbo' && /BUY AND FIT · €2,500/.test(d.buy) && d.tabs[0][1] === '€500–€1,600', JSON.stringify({ t, d }));
    await page.evaluate(() => { __garage.closeMenu(); __garage.onAct('lang'); });
    const sl = await page.evaluate(() => document.getElementById('g-go').textContent);
    T.check('back in Slovenian', sl === 'Izberi', sl);
  }

  // 7. every car of the game on the turntable, all its upgrades at the top level: built, the parts measured onto it
  {
    const r = await page.evaluate(() => __garage.ORDER.map(id => Core.MODELS.find(m => m.id === id)).map(M => { Garage3D.show({ M, color: 0xd81f2a, stripe: true, upg: { motor: 3, gume: 3, zavore: 3, aero: 3 }, cond: { clean: 1, body: 1, engine: 1 } }); __garage.advance(0.1);
      const i = Garage3D.info; return { id: M.id, ok: i.car === M.id && i.parts.gume >= 4 && i.parts.aero >= 2 && (M.ev || i.parts.motor >= 4) }; }));
    const bad = r.filter(x => !x.ok);
    T.check(`all ${r.length} cars with every part at level 3`, !bad.length, JSON.stringify(bad));
    // the lift's pads planned on each of them (its parts too: the skirts, the light strips), the electric car up on it: its light's pool
    // and its shadow stay on the floor
    // (each pad: clear of its axle's tyres (15 cm), within its arm's reach, its top on the underside over it: the body's lowest over the
    // rubber, a ray up at its middle (the cars' bodies are mostly open below: rays both ways) or else the sill's lower edge (the lowest
    // height the side covers the rubber, rays from the side); 3 cm either way; a low racer under its floor: up to 5 cm into it, or as
    // low as the lift goes (the carriage at its lowest, the screw in); a car the lift was not made for (a lorry, a monster truck, a narrow
    // racer: its pads out of the arms' reach) lifted where the arms reach, its pads on what is over them)
    const pl = await page.evaluate(() => __garage.ORDER.map(id => Core.MODELS.find(m => m.id === id)).map(M => { Garage3D.show({ M, color: 0xd81f2a, stripe: true, upg: { motor: 3, gume: 3, zavore: 3, aero: 3 }, cond: { clean: 1, body: 1, engine: 1 } });
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
        const g = top - u, low = cv.kit.bottom < 0.12 || u < 0.12, least = p.cc <= D.PAD.cmin + 1e-4 && p.post[i] <= D.PAD.min + 1e-4;
        if (g < -0.03 || (g > (low ? 0.05 : 0.03) && !(low && least))) bad.push(i + ': pad top ' + top.toFixed(3) + ' underside ' + u.toFixed(3)); });
      ms.forEach((m, i) => { m.material.side = sides[i]; });
      return { id: M.id, bad }; })).then(a => a.filter(x => x.bad.length));
    const ev = await page.evaluate(() => { const M = Core.MODELS.find(m => m.id === 'ev'); Garage3D.show({ M, color: 0xd81f2a, stripe: true, upg: { motor: 3, gume: 3, zavore: 3, aero: 3 }, cond: { clean: 1, body: 1, engine: 1 } });
      Garage3D._dbg.raise(0.55); __garage.advance(0.1); const cv = Garage3D.cur, w = new THREE.Vector3(), b = new THREE.Vector3(); cv.parts.motor.userData.pool.getWorldPosition(w); cv.v.blob.getWorldPosition(b);
      const o = { lift: Garage3D.info.lift, pool: +w.y.toFixed(3), blob: +b.y.toFixed(3) }; Garage3D.show(cv.spec); __garage.advance(0.1); return o; });
    T.check('the lift\'s pads planned on every car with all its parts (clear of the tyres, in the arms\' reach, on the underside); the electric car up on the lift: its light\'s pool and shadow on the floor', !pl.length && ev.lift >= 0.5 && ev.pool < 0.02 && ev.blob < 0.02, JSON.stringify({ pl, ev }));
  }

  // 8. the buttons of the cars before and after the one shown: their pictures (in their colours, half a metre further back), their
  // names to the ear; tapped: that car drives in
  {
    const b = await page.evaluate(async () => { for (let i = 0; i < 40 && document.querySelectorAll('.g-cb .th img').length < 2; i++) { __garage.advance(0.05); await new Promise(r => setTimeout(r, 120)); }
      const O = __garage.ORDER, i = O.indexOf(__garage.S.car); return { imgs: [...document.querySelectorAll('.g-cb .th img')].map(m => /^data:image\/png/.test(m.src)), prev: document.getElementById('g-prev').getAttribute('aria-label'), next: document.getElementById('g-next').getAttribute('aria-label'),
        want: [Core.MODELS.find(m => m.id === O[(i - 1 + O.length) % O.length]).name, Core.MODELS.find(m => m.id === O[(i + 1) % O.length]).name, O[(i + 1) % O.length]] }; });
    T.check('the cars\' buttons: each with its car\'s picture, the names of the cars before and after', b.imgs.length === 2 && b.imgs.every(Boolean) && b.prev.endsWith(b.want[0]) && b.next.endsWith(b.want[1]), JSON.stringify(b));
    await page.evaluate(() => document.getElementById('g-next').click()); await run();
    const u = await ui();
    T.check('the next car\'s button: that car on the table', u.info.car === b.want[2] && u.S.car === b.want[2], JSON.stringify({ car: u.info.car, want: b.want[2] }));
  }

  // 8b. the wide vehicles' way out and in (the monster truck, the lorries; the PICO and the RALLY as before): each car swapped in, the
  // clock stepped a frame at a time (nothing drawn), every vertex of every car on the turntable (in its own frame, moved as it is)
  // clear of the regal's boxes (nothing else stands on the floor round the lane now: no stand steps aside); every car on the table's
  // middle after
  {
    const R = await page.evaluate(async (ids) => {
      const V = THREE.Vector3, rest = new WeakMap(), out = { hits: {}, straight: {}, frames: 0, ways: {} }, D = Garage3D._dbg;
      const restOf = (root) => { let r = rest.get(root); if (r) return r; root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), M = new THREE.Matrix4(), v = new V(), P = [], bb = new THREE.Box3();
        root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; for (let q = o; q && q !== root; q = q.parent) if (!q.visible) return; M.multiplyMatrices(inv, o.matrixWorld); const A = o.geometry.attributes.position;
          for (let i = 0; i < A.count; i++) { v.fromBufferAttribute(A, i).applyMatrix4(M); if (v.y < 0.03) continue; P.push(v.x, v.y, v.z); bb.expandByPoint(v); } });   // (not its shadow on the floor)
        rest.set(root, r = { P: new Float32Array(P), bb, id: root.userData.cv.M.id }); return r; };
      const audit = (straight) => { const B = D.obstBoxes, tt = Garage3D.cur.root.parent;
        for (const root of tt.children) { if (!root.userData.cv || !root.visible) continue; const r = restOf(root), p = root.position, z = straight ? 0 : p.z;
          for (const b of B) { if (b.gone > 0.999) continue;
            if (r.bb.max.x + p.x < b.min[0] || r.bb.min.x + p.x > b.max[0] || r.bb.max.y + p.y < b.min[1] || r.bb.min.y + p.y > b.max[1] || r.bb.max.z + z < b.min[2] || r.bb.min.z + z > b.max[2]) continue;
            const P = r.P; let d = 0;
            for (let i = 0; i < P.length; i += 3) { const x = P[i] + p.x, y = P[i + 1] + p.y, w = P[i + 2] + z; if (x > b.min[0] && x < b.max[0] && y > b.min[1] && y < b.max[1] && w > b.min[2] && w < b.max[2]) d = Math.max(d, Math.min(x - b.min[0], b.max[0] - x, y - b.min[1], b.max[1] - y, w - b.min[2], b.max[2] - w)); }
            if (d > 0.005) { const H = straight ? out.straight : out.hits, key = r.id + ':' + b.k; H[key] = Math.max(H[key] || 0, +d.toFixed(3)); } } } };
      for (const id of ids) {
        const w0 = D.laneWay(1).way; __garage.pickCar(id); await new Promise(r => setTimeout(r, 0));   // (the way out of the car that goes)
        for (let f = 0; f < 600; f++) { Garage3D.frame(1 / 30, true); audit(false); audit(true); out.frames++; if (!Garage3D.busy && f > 10) break; if (f % 20 === 0) await new Promise(r => setTimeout(r, 0)); }
        for (let f = 0; f < 15; f++) Garage3D.frame(1 / 30, true);   // (what stepped aside back)
        const sum = (w) => w && { max: w.max, fade: w.fade.join() }, w1 = D.laneWay(-1).way;   // (the way in of the car that came: as its swap made it)
        out.ways[id] = { inWay: sum(w1), prevOut: sum(w0), z: +Garage3D.cur.root.position.z.toFixed(3), car: Garage3D.cur.M.id };
      }
      return out;
    }, ['goljat', 'kamen', 'titan', 'pico', 'rally']);
    const W = R.ways, ok = !Object.keys(R.hits).length && Object.values(W).every(q => q.z === 0 && (!q.inWay || !q.inWay.fade) && (!q.prevOut || !q.prevOut.fade));
    T.check(`the wide vehicles' way in and out (${R.frames} frames): no car through the regal; nothing steps aside; every car on the table's middle after`,
      ok, JSON.stringify(R));
  }

  // 8c. lying down (640 × 360, 915 × 412): the picture's view taller by how little is free between the page's buttons: the car whole
  // under the buttons at the top, the maquettes, the SERVICE button and the colour circles in the picture over the car's name
  {
    const R = [];
    for (const [w, h] of [[640, 360], [915, 412]]) {
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(600);
      R.push(await page.evaluate(() => { const r = (id) => document.getElementById(id).getBoundingClientRect(), app = document.getElementById('g-app').getBoundingClientRect(), top = r('g-track').bottom - app.top, name = r('g-name').top - app.top;
        const car = Garage3D.box('car'), b = ['mq0', 'mq1', 'mq2', 'service', 'col0', 'col7'].map(k => Garage3D.box(k));
        return { car: __garage.S.car, top: Math.round(top), name: Math.round(name), carY: car && [Math.round(car.y), Math.round(car.y + car.h)], b: b.map(x => x && [Math.round(x.y), Math.round(x.y + x.h)]),
          ok: !!car && car.y >= top - 2 && car.y + car.h <= name && b.every(x => x && x.y >= top && x.y + 20 <= name) }; }));
      // (the guide's last step: a ring round each of the buttons for the other cars, its bubble beside them, clear of them)
      R.push(await page.evaluate(() => { __garage.guide(4); const el = document.getElementById('g-guide'), rings = [...el.querySelectorAll('.ring')].map(e => e.getBoundingClientRect()), bub = el.querySelector('.bub').getBoundingClientRect(); __garage.guide(5);
        return { rings: rings.map(r => [Math.round(r.left), Math.round(r.top), Math.round(r.width)]), bub: [Math.round(bub.left), Math.round(bub.top), Math.round(bub.width), Math.round(bub.bottom)], ok: rings.length === 2 && rings.every(r => r.width > 60 && bub.bottom <= r.top) }; }));
    }
    // (a menu at the bottom lying down: where it opens, not left low and small)
    R.push(await page.evaluate(async () => { __garage.openMenu({ el: 'turbo', key: 'rgl:TURBO' }); const el = document.getElementById('g-menu'); el.classList.add('bot'); await new Promise(r => setTimeout(r, 450));
      const t = new DOMMatrix(getComputedStyle(el).transform), b = el.getBoundingClientRect(); __garage.closeMenu(); return { menu: [t.a, t.f, Math.round(b.bottom), innerHeight], ok: t.a === 1 && t.f === 0 && b.bottom <= innerHeight - 9 }; }));
    await page.setViewportSize({ width: 412, height: 915 }); await page.waitForTimeout(600);
    T.check('lying down (640 × 360, 915 × 412): the car whole between the buttons at the top and its name; the maquettes, SERVICE and the colour circles in the picture over the name; the guide\'s rings round the buttons for the other cars, its bubble beside them; a menu at the bottom where it opens', R.every(x => x.ok), JSON.stringify(R));
  }

  // 8d. the zoom (the user's wish, 30. 10.): the mouse's wheel nearer and further, within its bounds (the cabinet still seen, the room's
  // walls stepping aside); two fingers apart: nearer, no tap
  {
    const z = await page.evaluate(() => { const c = document.getElementById('g-gl'), D = Garage3D._dbg, w = (dy) => c.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, bubbles: true, cancelable: true }));
      for (let i = 0; i < 20; i++) w(-300); const near = D.zoom; for (let i = 0; i < 40; i++) w(300); const far = D.zoom;
      const pe = (t, id, x) => c.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: x, clientY: 400, bubbles: true, isPrimary: id === 11 }));
      D.zoom = 1; pe('pointerdown', 11, 150); pe('pointerdown', 12, 250); pe('pointermove', 12, 330); pe('pointerup', 12, 330); pe('pointerup', 11, 150);
      const pinch = D.zoom, menu = !!__garage.menu; D.zoom = 1; return { near, far, pinch, menu, Z: D.ZOOM }; });
    T.check('the zoom: the wheel nearer and further within its bounds (' + z.Z.join('–') + '); two fingers apart nearer, no tap', z.near === z.Z[0] && z.far === z.Z[1] && z.pinch < 1 && !z.menu, JSON.stringify(z));
  }

  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));

  // 9. from the game (index.html): its car screen, the TITAN in green chosen, a tap on the car: the garage opens with that car in that
  // colour (the profile kept: the same credits; its own MOCKUP bar); its back button: the game's car screen again on the same car (the
  // address plain again)
  {
    const before = await page.evaluate(() => ({ money: __garage.S.money }));
    await page.goto(srv.base + '/index.html');
    await page.waitForFunction(() => window.__game && __game.screen === 'title', null, { timeout: 180000 });
    await page.evaluate(() => __game.onAction('to-car')); await page.waitForTimeout(400);
    await page.click('#car-cats [data-cat="tovornjaki"]'); await page.waitForTimeout(200);
    await page.click('#car-strip [data-car="' + await page.evaluate(() => Core.MODELS.findIndex(m => m.id === 'titan')) + '"]'); await page.waitForTimeout(200);
    await page.click('#car-colors [data-col="5"]'); await page.waitForTimeout(300);
    const tap = await page.evaluate(() => { const b = document.getElementById('car-garage'), r = b.getBoundingClientRect(), s = Render.showRect(), pn = document.querySelector('#s-car .car-panel').getBoundingClientRect();
      return { on: b.classList.contains('on'), hint: b.textContent.trim(), car: Core.MODELS[__game.S.car].id, color: __game.S.color, x: r.left + r.width / 2, y: r.top + r.height * 0.4, clear: r.bottom <= pn.top + 1, over: r.left <= (s.x0 + s.x1) / 2 && r.right >= (s.x0 + s.x1) / 2 && r.top <= (s.y0 + s.y1) / 2 && r.bottom >= (s.y0 + s.y1) / 2 }; });
    await Promise.all([page.waitForURL(/garaza\.html/, { timeout: 60000 }), page.mouse.click(tap.x, tap.y)]);
    const url1 = page.url();
    await page.waitForFunction(() => window.__garage && Garage3D.ready, null, { timeout: 180000 });
    const g = await page.evaluate(() => ({ flag: document.getElementById('g-track').dataset.flag, car: __garage.S.car, shown: Garage3D.info.car, color: Garage3D.info.color, money: __garage.S.money, demo: !document.getElementById('g-demo').classList.contains('off') }));
    T.check('from the game\'s car screen: the car (over its place, clear of the panel, "Tapni avto za garažo") tapped opens the garage with it, the TITAN in green; the profile kept (the same credits), the MOCKUP bar there',
      tap.on && tap.over && tap.clear && tap.hint === 'Tapni avto za garažo' && tap.car === 'titan' && tap.color === 5 && /garaza\.html\?car=titan&color=2fa84f(&drzava=[^&]+)?$/.test(url1) && (!/drzava=/.test(url1) || g.flag === decodeURIComponent(url1.split('drzava=')[1])) && g.car === 'titan' && g.shown === 'titan' && g.color === 0x2fa84f && g.money === before.money && g.demo,
      JSON.stringify({ tap, url1, g, before }));
    await Promise.all([page.waitForURL(/index\.html/, { timeout: 60000 }), page.click('.g-foot .g-btn-back')]);
    await page.waitForFunction(() => window.__game && __game.screen === 'car', null, { timeout: 180000 });
    await page.waitForTimeout(300);
    const b = await page.evaluate(() => ({ screen: __game.screen, car: Core.MODELS[__game.S.car].id, name: document.getElementById('car-name').textContent, url: location.search, on: document.getElementById('car-garage').classList.contains('on') }));
    T.check('the garage\'s back button: the game\'s car screen again, on the TITAN (the address plain again)', b.screen === 'car' && b.car === 'titan' && b.name === 'TITAN' && b.url === '' && b.on, JSON.stringify(b));
  }
  // the garage's Izberi progo: the game again, on its track screen with that car (the player's)
  {
    await Promise.all([page.waitForURL(/garaza\.html/, { timeout: 60000 }), page.evaluate(() => { __game.onAction('car-garage'); }).catch(() => {})]);
    await page.waitForFunction(() => window.__garage && Garage3D.ready, null, { timeout: 180000 });
    await Promise.all([page.waitForURL(/index\.html/, { timeout: 60000 }), page.click('#g-track')]);
    await page.waitForFunction(() => window.__game && __game.screen === 'track', null, { timeout: 180000 });
    const t = await page.evaluate(() => ({ screen: __game.screen, car: Core.MODELS[__game.S.car].id, url: location.search }));
    T.check('the garage\'s Izberi progo: the game\'s track screen with the TITAN (the address plain again)', t.screen === 'track' && t.car === 'titan' && t.url === '', JSON.stringify(t));
  }
  T.check('no page errors in the game and back', !errors.length, errors.slice(0, 5).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
