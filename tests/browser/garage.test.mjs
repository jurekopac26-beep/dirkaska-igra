// The garage (garaza.html): the page opens with the workshop and the car, the camera (left and right only, always as far; what is
// between it and the car steps aside), the demo profiles, buying a car and the credits, a new car
// driving in, every upgrade with its parts on the car, the service (dirt and scratches gone, the engine), a new colour, the English page,
// every car of the game's fleet (the car screen's list and order) on the turntable with all its parts, the car panel's categories and the
// pictures of the cars; the wide vehicles' way in and out (round the lift's column and the stands, or the stand stepping aside); the
// garage opened from the game's car screen (a tap on its car: that car in its colour, the profile kept) and its back button; the single-post
// lift behind the car (the tyres and the service's engine up on it, the turntable never rising nor turning); the permanent fixtures
// (two industrial robots on floor rails, the tool stand ORODJA with its seven tools, the near robot's stand with six; the nano chamber,
// the drying column, the paint drums, the tyre towers, the parts shelf, the rim stand, the kit stand) parked at rest, bolted down, out of
// the cars' lane, their moves through the shows' queue (a tool taken and put back, the chamber down and up, the column up and down), the
// robots' reach round every car, the plates in English; the service by the two robots (its plans on every car; each item and the full
// service on the PICO, the FORMULA and the TRUCK, the full one on the KOLIBRI too, the electric car's engine,
// every frame audited: nothing through anything, everything parked after, a car asked for meanwhile waits). The animations run on a
// clock the test steps itself (software WebGL is slow).
// Zero page errors allowed.
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

  // 1. the page: a fresh profile (the full game: 11.500 coins, the PICO TURBO), the car on the table, the room drawn in a sensible number of draws
  {
    const u = await ui(), calls = await page.evaluate(() => { __garage.advance(0.1); return Garage3D.renderer.info.render.calls; });
    T.check('opens: 11.500 coins, PICO TURBO on the turntable, the go button "Izberi"', u.money === '11.500' && u.name === 'PICO TURBO' && u.info.car === 'pico' && u.go === 'Izberi' && u.title === 'GARAŽA', JSON.stringify({ money: u.money, name: u.name, car: u.info.car, go: u.go }));
    T.check('the worn car shows its wear: dirt and scratches on the paint', u.info.dirt > 0.2 && u.info.scr > 0.2, JSON.stringify(u.info));
    T.check('draw calls of the garage stay modest (< 260)', calls > 20 && calls < 260, calls + ' calls');
    const kept = await page.evaluate(() => Garage3D._dbg.pieces.filter(p => p.g || p.sm).length);
    T.check('the room built, its builders\' arrays let go (the phone\'s memory)', kept === 0, kept + ' pieces still hold them');
    const L = await page.evaluate(() => Garage3D._dbg.lift);
    // (raw: the column's piece's nearest vertex to the car: nothing of it in front of the car)
    T.check('one lift column, behind the car (far side), its arms stowed out of the cars\' lane (|z| >= 1.38), the turntable flush', L.posts === 1 && L.z < -1.3 && L.raw < -1.3 && L.box[1][2] < -1.3 && L.arms === 0 && L.lane >= 1.38 && L.table === 0 && !L.on, JSON.stringify(L));
    // the permanent fixtures at rest: both robots parked on their rails (each carriage on its rail's bed, the arm folded up over it: its
    // lowest point over 0.8 m, its changer over 1.2 m, nothing of it nearer the cars' lane than 1.9 m), beacons green; the stand ORODJA with its 7 tools in their
    // nests and the near stand with its 6 (all lit green); nothing of them in the cars' lane (|z| < 1.3, under 2 m), none of them
    // stepped aside in the home view
    const F = await page.evaluate(() => Garage3D._dbg.fx);
    T.check('the fixtures at rest: two robots parked on their rails (folded over their carriages, out of the lane), ORODJA\'s 7 tools and the near stand\'s 6 in their nests (all green); none in the cars\' lane, none stepped aside in the home view (' + calls + ' draw calls)',
      F.robots.length === 2 && F.robots.every(r => r.rest && r.tool === 'none' && r.onRail && r.bed > 0.09 && r.bed < 0.13 && r.low > 0.8 && r.tip[1] > 1.2 && r.lane > 1.9 && r.miss === 0 && r.gone === 0 && r.cast && !r.held)
      && Object.keys(F.rack.nests).length === 7 && Object.values(F.rack.nests).every(s => s === 'in') && Object.values(F.rack.leds).every(c => c === 'green') && F.rack.plate === 'ORODJA'
      && Object.keys(F.stand.nests).length === 6 && Object.values(F.stand.nests).every(s => s === 'in') && Object.values(F.stand.leds).every(c => c === 'green')
      && F.lane >= 1.3 && F.gone === 0 && F.parked, JSON.stringify(F));
    // the stands at rest: the chamber stored (its glass over 3.4 m, under its header; only its outer band drawn, its lights off: no line
    // of bands one on another), the drying column down (hidden, its hatch's lid flush: nothing over the floor in the lane), the drums
    // (five, dark), the tyre towers, the shelf, the rim and the kit stand each on a base plate on the floor with its bolts, out of the
    // cars' lane, none stepped aside in the home view
    const S = await page.evaluate(() => { const D = Garage3D._dbg; return { ch: D.chamber, dr: D.dryer, drums: D.drums, st: D.stands }; });
    T.check('the stands at rest: the chamber stored (glass over 3.4 m, one band drawn, its lights off), the drying column down (its lid flush with the floor), five paint drums, the tyre towers, the parts shelf, the rim and the kit stand bolted to the floor (their plates on it), out of the lane, none stepped aside (' + calls + ' draw calls)',
      S.ch.k === 0 && S.ch.low > 3.4 && S.ch.bands.every(y => y > 3.4) && S.ch.glassDrawn === S.ch.band0[0] && S.ch.frameDrawn === S.ch.band0[1] && S.ch.led.every(q => q === 0) && !S.ch.tucked.some(Boolean) && S.dr.k === 0 && !S.dr.drawn && !S.dr.cast && S.dr.lid <= 0.015 && S.drums.length === 5 && S.drums.every(d => d.glow === 0 && d.z < -1.7)
      && Object.values(S.st).every(x => x.low >= -1e-4 && x.low < 0.003 && x.bolts >= 4 && x.lane >= 1.3 && x.gone === 0), JSON.stringify(S));
  }

  // 1c. the fixtures' moves through the shows' queue, stepped finely (0.03 s, nothing drawn): the far robot rides from behind the lift's
  // column to ORODJA, takes the wrench (its nest amber), puts it back (green again) and rides back; the near robot takes its brush from
  // its stand past its rail's left end and puts it back; robots at work: the PICO's near front wheel with the wrench; the FORMULA's near
  // front wheel and front corner by the tyre towers, its far rear corner, its bonnet with the car up 1 m (its open wheels round it), the far
  // robot riding with the brush past the column and the drums and back; the far side by the column: the VORTEX's sill (the camera, at a
  // slant), the PICO's door, the RALLY's roof (up 1 m) and the LM's bonnet (up 1 m); the KAZE's boot under its GT wing (the gripper). On
  // every way every vertex of the arms and of the held tools, and points along each link and each joint's drum (the long bars' middles
  // too), never in the lift's column, the tyre towers, the drums nor a stand's plate (the tools out through their forks); the arms never
  // in the car (its body, its parts, its wheels: rays down and up at all its meshes every 5 cm), the tools only at their working end; the
  // arms clear of the stands, the column and the body by the robots' own measure; every way planned clear (none taken for want of a
  // clear one); no flip of the turret, no whip (the wrist under 2 m/s), the flange never spun round, the wrist's drum never jumping;
  // never out of reach; parked after
  {
    // (the car as it is for the checks: its top and its underside on a 5 cm grid in its own frame, rays down and up at all its meshes)
    const truth = () => page.evaluate(() => { const cv = Garage3D.cur, K = cv.kit, V = THREE.Vector3, ms = []; cv.root.traverse(o => { if (o.isMesh && o.visible && o.material && !o.material.transparent && o.geometry.attributes.position.count > 30) ms.push(o); });
      cv.root.updateMatrixWorld(true); const rc = new THREE.Raycaster(); rc.layers.enableAll(); const sides = ms.map(m => m.material.side); ms.forEach(m => { m.material.side = THREE.DoubleSide; });
      const ST = 0.05, x0 = K.rear - 0.25, z0 = -K.hw - 0.25, nx = Math.ceil((K.front - K.rear + 0.5) / ST) + 1, nz = Math.ceil((2 * K.hw + 0.5) / ST) + 1, top = new Float32Array(nx * nz), bot = new Float32Array(nx * nz), ly = cv.v.grp.position.y, cx = cv.root.position.x;
      for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const x = cx + x0 + a * ST, z = z0 + b * ST; rc.set(new V(x, 9, z), new V(0, -1, 0)); rc.far = 12; let h = rc.intersectObjects(ms, false); top[a * nz + b] = h.length ? h[0].point.y - ly : -9;
        rc.set(new V(x, -2, z), new V(0, 1, 0)); h = rc.intersectObjects(ms, false); bot[a * nz + b] = h.length ? h[0].point.y - ly : 9; }
      ms.forEach((m, i) => { m.material.side = sides[i]; }); window._T = { top, bot, nx, nz, x0, z0, ST }; return nx * nz; });
    const fine = (i, k, kind, o) => page.evaluate(async ([i, k, kind, o]) => {
      const D = Garage3D._dbg, { RB, STN, RK, NS } = D, A = RB[i], v = new THREE.Vector3(), q = new THREE.Vector3(), cv = Garage3D.cur, T = window._T, f0 = RB.map(R => R.fails || 0), zc = (NS.e[0] + NS.e[1]) / 2;
      const r = { t: 0, clear: 9, plate: 0, tower: 0, column: 0, drum: 0, armCar: 0, toolCar: 0, held: false, v: 0, hd: 0, roll: 0, a5: 0, miss: 0, notOk: 0, legs: [] };
      const inRack = (x, y, z) => { if (y < RK.S - 0.045 || y > RK.S + 0.002) return false; const rr = Math.hypot(x - RK.cx, z - RK.cz) - RK.r, a = Math.atan2(z - RK.cz, x - RK.cx);
        if (rr < -0.18 || rr > 0.18 || a > RK.e0 || a < RK.e1) return false; if (rr < 0.08) for (const aj of RK.a) if (Math.abs(a - aj) < RK.SW) return false; return true; };
      const inStand = (x, y, z) => { if (y < NS.S - 0.045 || y > NS.S + 0.002) return false; const dx = x - NS.x; if (dx < -0.18 || dx > 0.18 || z < NS.e[0] || z > NS.e[1]) return false;
        if (dx > -0.08) for (const zj of NS.z) if (Math.abs(z - zj) < 0.08) return false; return true; };   // (its forks open to +x, to the robot)
      const COL = [[-0.175, 0.02, -1.83, 0.175, 2.97, -1.61], [-0.2, 2.985, -1.885, 0.2, 3.08, -1.555], [-0.14, 0.63, -1.99, 0.08, 1.34, -1.84], [0.185, 0.99, -1.82, 0.26, 1.21, -1.69]];
      const bd = (b, x, y, z) => Math.hypot(Math.max(0, b[0] - x, x - b[3]), Math.max(0, b[1] - y, y - b[4]), Math.max(0, b[2] - z, z - b[5])) || -Math.min(x - b[0], b[3] - x, y - b[1], b[4] - y, z - b[2], b[5] - z);
      // (a point of the arm or of the tool, a surface's (rr 0) or an axis's with its radius: into the column, the towers, the drums, the car)
      const wt = o && o.tip ? new THREE.Vector3(...o.tip) : null, test = (p, rr, tool) => { const x = p.x, y = p.y, z = p.z;
        if (!rr && (i ? inRack : inStand)(x, y, z)) r.plate++;
        if (COL.some(b => bd(b, x, y, z) < rr - 0.005)) r.column++;
        if (D.TWR.some(([tx, tz]) => { const d = Math.hypot(x - tx, z - tz); return (y < 1.0 + rr && d < 0.33 + rr - 0.005) || (y < 1.1 && d < 0.045 + rr); })) r.tower++;
        if (D.drums.some(d => Math.hypot(x - d.x, z - d.z) < d.r + rr - 0.005 && y > 0.11 - rr && y < 0.92 + rr)) r.drum++;
        if (T && !(tool && wt && p.distanceTo(wt) < 0.15)) { const a = Math.round((x - cv.root.position.x - T.x0) / T.ST), b = Math.round((z - T.z0) / T.ST); if (a >= 0 && a < T.nx && b >= 0 && b < T.nz) { const tp = T.top[a * T.nz + b], bt = T.bot[a * T.nz + b], yy = y - cv.v.grp.position.y;
          if (tp > -8) { const d = Math.min(tp - (yy - rr), yy + rr - bt); if (d > 0) { if (tool) r.toolCar = Math.max(r.toolCar, d); else r.armCar = Math.max(r.armCar, d); } } } } };
      D.robotDemo(kind, Object.assign({ robot: i, tool: k }, o)); let pW = null, phd = null, pac = null, pa5 = null, s = 0, lp = A.lastPath;
      do { Garage3D.frame(0.03, true); r.t += 0.03; s++; const J = A.J; r.clear = Math.min(r.clear, D.robotClear(i, { skip: [STN[i].key] })); r.miss = Math.max(r.miss, J.miss);
        if (A.lastPath && A.lastPath !== lp) { lp = A.lastPath; r.legs.push(lp.mode + ':' + lp.pen); if (!lp.ok) r.notOk++; }
        if (pW) { r.v = Math.max(r.v, pW.distanceTo(J.Wc) / 0.03); r.hd = Math.max(r.hd, Math.acos(Math.min(1, phd.dot(J.hd))) / 0.03); r.roll = Math.max(r.roll, Math.acos(Math.min(1, pac.dot(J.ac)))); r.a5 = Math.max(r.a5, Math.acos(Math.min(1, Math.abs(pa5.dot(J.a5))))); }
        pW = J.Wc.clone(); phd = J.hd.clone(); pac = J.ac.clone(); pa5 = J.a5.clone();
        const a = A.R.mesh.geometry.attributes.position.array; for (const [v0, v1, pk] of A.R.runs) if (pk >= 1 && pk <= 7) for (let j = v0; j < v1; j += 2) test(v.set(a[j * 3], a[j * 3 + 1], a[j * 3 + 2]), 0, false);
        const L = D.linksOf(A, 'whole', []); L.forEach(([p0, p1, rr], j) => { const n = Math.max(1, Math.ceil(p0.distanceTo(p1) / 0.03)), kd = L.k[j], tl = kd === 'tool';   // (along each link and drum, its radius as built: the bars' middles too)
          if (kd === 'arm' || tl) for (let m = 0; m <= n; m++) test(q.copy(p0).lerp(p1, m / n), rr * (tl ? 0.6 : 0.8), tl); });
        if (A.tool !== 'none') { r.held = r.held || A.tool === k; const m = STN[i].tools[A.tool].mesh, p = m.geometry.attributes.position.array; for (let j = 0; j < p.length; j += 6) test(v.set(p[j], p[j + 1], p[j + 2]).applyMatrix4(m.matrix), 0, true); }
        if (s % 20 === 0) await new Promise(res => setTimeout(res, 0)); } while (Garage3D.busy && r.t < 150);
      for (const q2 of ['t', 'clear', 'v', 'hd', 'roll', 'a5', 'miss', 'armCar', 'toolCar']) r[q2] = +r[q2].toFixed(3); r.fails = RB.map((R, j) => (R.fails || 0) - f0[j]); r.log = D.fxLog; r.fx = D.fx; return r; }, [i, k, kind, o || {}]);
    // (a car on the table with all its parts at the top level, up h on the lift; its work points (the robots' view of it: its parts and
    // wheels with it): a wheel's hub, the corners, the far side's sill, door and roof, the bonnet's and the boot's tops)
    const car = (id, h) => page.evaluate(([id, h]) => { Garage3D.show({ M: Core.MODELS.find(m => m.id === id), color: 0xd81f2a, stripe: true, upg: { motor: 3, gume: 3, zavore: 3, aero: 3 }, cond: { clean: 1, body: 1, engine: 1 } }); __garage.advance(0.1);
      const D = Garage3D._dbg; if (h) { D.raise(h); __garage.advance(0.1); } const cv = Garage3D.cur, K = cv.kit, ly = cv.v.grp.position.y, FP = D.carProbe(cv), w = (sd, f) => cv.wheels.find(q => q.sd === sd && q.front === f), xm = (K.wfx + K.wrx) / 2, hw = K.hw;
      const top = (x, z) => { let m = -9; for (const dx of [-0.12, 0, 0.12]) for (const dz of [-0.12, 0, 0.12]) { const y = FP.top(x + dx, z + dz); if (y != null) m = Math.max(m, y); } return m; }, bz = K.open ? K.sideZ * 0.5 : hw * 0.35;
      const sl = (x) => Math.abs(x) > 0.75 ? [0, 0, 1] : [x > 0 ? -0.6 : 0.6, 0, 0.8], xs = Math.max(xm, 0.45);   // (the far side's middle off the lift's column: from its right)
      return { wheel: { tip: [w(1, true).x, w(1, true).y + ly, w(1, true).outer + 0.02], dir: [0, 0, -1] }, corner: { tip: [K.front + 0.03, K.frontLow + 0.2 + ly, K.hw - 0.12], dir: [-0.7, 0, -0.7] }, rear: { tip: [K.rear - 0.03, K.bottom + 0.25 + ly, -(K.hw - 0.12)], dir: [0.7, 0, 0.7] },
        sill: { tip: [xs, K.bottom + 0.12 + ly, -(K.sideZ + 0.04)], dir: sl(xs) }, door: { tip: [xs + 0.2, (K.bottom + K.top) / 2 + ly, -(hw + 0.03)], dir: sl(xs + 0.2) }, roof: { tip: [xs, K.top + ly + 0.02, -hw * 0.3], dir: [0, -0.75, 0.66] },
        bonF: { tip: [K.hoodX, top(K.hoodX, -bz) + 0.03, -bz], dir: [0, -1, 0], dirs: [[0, -0.7, 0.7]] }, bonN: { tip: [K.hoodX, top(K.hoodX, bz) + 0.03, bz], dir: [0, -1, 0], dirs: [[0, -0.7, -0.7]] }, boot: { tip: [K.deckX + 0.1, top(K.deckX + 0.1, bz) + 0.03, bz], dir: [0, -1, 0], dirs: [[0, -0.7, -0.7]] } }; }, [id, h || 0]);
    await page.evaluate(() => { window._spec0 = Garage3D.cur.spec; });   // (the profile's PICO: shown again after)
    const res = {}, run = async (nm, id, h, jobs) => { const P = await car(id, h); await truth(); for (const [jn, i, k, kind, pt] of jobs) res[nm + '.' + jn] = await fine(i, k, kind, pt ? P[pt] : null); };
    await run('pico', 'pico', 0, [['far', 1, 'wrench', 'tool'], ['near', 0, 'brush', 'tool'], ['work', 0, 'wrench', 'work', 'wheel'], ['door', 1, 'gripper', 'work', 'door']]);
    await run('formula', 'formula', 0, [['fwheel', 0, 'wrench', 'work', 'wheel'], ['fcorner', 0, 'scanner', 'work', 'corner'], ['frear', 1, 'scanner', 'work', 'rear'], ['ride', 1, 'brush', 'ride']]);
    await run('formulaUp', 'formula', 1.0, [['bonnet', 0, 'gripper', 'work', 'bonN']]);
    await run('vortex', 'vortex', 0, [['sill', 1, 'camera', 'work', 'sill']]);
    await run('rallyUp', 'rally', 1.0, [['roof', 1, 'scanner', 'work', 'roof']]);
    await run('lmUp', 'lm', 1.0, [['bonnet', 1, 'gripper', 'work', 'bonF']]);
    await run('kaze', 'kaze', 0, [['boot', 0, 'gripper', 'work', 'boot']]);
    await page.evaluate(() => { Garage3D.show(window._spec0); __garage.advance(0.1); window._T = null; });
    const f = res['pico.far'], n = res['pico.near'], nest = (x, i) => i ? x.fx.rack : x.fx.stand, all = Object.values(res), works = Object.entries(res).filter(([q, x]) => x.log.length === 1 && x.log[0].plan);
    T.check('the robots through the queue: the far one rides from behind the column to ORODJA, takes the wrench (its nest amber), puts it back (green), rides back; the near one takes its brush from its stand by its rail\'s left end and puts it back; both parked after',
      [[f, 1, 'wrench'], [n, 0, 'brush']].every(([x, i, k]) => x.log.length === 2 && x.log[0].held === k && x.log[0].nest === 'out' && x.log[1].held === 'none' && x.log[1].nest === 'in' && x.log[1].miss === 0 && nest(x, i).leds[k] === 'green' && x.fx.parked && x.held),
      JSON.stringify({ f: f.log, n: n.log, parked: [f.fx.parked, n.fx.parked] }));
    T.check(`robots at work (${works.length}: the PICO, the FORMULA by the tyre towers and up on the lift amid its wheels, the far side by the column on the VORTEX, the PICO, the RALLY and the LM up 1 m, the KAZE's boot under its wing) and riding with the brush: every way planned clear, in reach, back at rest; the arms and the tools never in the lift's column, the tyre towers, the drums nor a stand's plate, the arms never in the car (the tools only at their working end), clear of the stands, the column and the body; the turret under 150 deg/s, the wrist under 2 m/s, no spin of the flange, the wrist's drum never jumping`,
      works.length === 10 && works.every(([q, x]) => x.log[0].miss === 0 && x.log[0].clear >= 0) && res['formula.ride'].log.length === 1 && res['formula.ride'].log[0].miss === 0
      && all.every(x => x.fx.parked && x.miss < 0.005 && x.clear >= 0 && x.plate + x.tower + x.column + x.drum === 0 && x.armCar <= 0.01 && x.toolCar <= 0.03 && x.notOk === 0 && x.fails.every(q => q === 0) && x.hd < 2.62 && x.v < 2.0 && x.roll < 0.25 && x.a5 < 0.35),
      JSON.stringify(Object.fromEntries(Object.entries(res).map(([q, x]) => [q, { t: x.t, clear: x.clear, plate: x.plate, tower: x.tower, column: x.column, drum: x.drum, armCar: x.armCar, toolCar: x.toolCar, notOk: x.notOk, fails: x.fails, v: x.v, hd: x.hd, roll: x.roll, a5: x.a5, miss: x.miss, log: x.log.map(l => ({ miss: l.miss, clear: l.clear })) }]))));
    // a parked robot steps aside when it hides the car (seen from round the near side); one at work in the same view stays, and close up
    // at its wheel (the camera right beside its forearm, looking at the wheel: 8 to 35 cm off its links, not in them) it stays too
    const dis = await page.evaluate(() => { const D = Garage3D._dbg, u = D.user, rg = D.rig, keep = Object.assign({}, rg); D.robotsPose({ robots: ['rest', 'rest'] }); let yaw = null;
      for (let y = -1.6; y <= 0.4 && yaw == null; y += 0.1) { u.yaw = y; __garage.advance(0.6); if (D.robots[0].gone > 0.5) yaw = +y.toFixed(2); }
      const cv = Garage3D.cur, w = cv.wheels.find(q => q.sd > 0 && !q.front), q = D.robotPlan(0, [w.x, w.y, w.outer + 0.02], [0, 0, -1], { tool: 'wrench' });
      D.robotsPose({ robots: [Object.assign({ tool: 'wrench' }, q), 'rest'] }); __garage.advance(0.6); const work = D.robots[0].gone;
      const wf = cv.wheels.find(q => q.sd > 0 && q.front), qf = D.robotPlan(0, [wf.x, wf.y, wf.outer + 0.02], [0, 0, -1], { tool: 'wrench' }); D.robotsPose({ robots: [Object.assign({ tool: 'wrench' }, qf), 'rest'] });
      const A = D.RB[0], J = A.J, V = THREE.Vector3, L = D.linksOf(A, 'whole', []), sg = new THREE.Line3(), cp = new V(), armd = (c) => Math.min(...L.map(([a, b, r]) => sg.set(a, b).closestPointToPoint(c, true, cp).distanceTo(c) - r));
      const mid = J.E.clone().lerp(J.Wc, 0.5), side = new V().crossVectors(J.f, new V(0, 1, 0)).normalize(), C = [1, -1].map(s => mid.clone().addScaledVector(side, s * 0.35)).reduce((a, b) => armd(b) > armd(a) ? b : a);
      const T = new V(wf.x, wf.y, wf.outer), d = C.clone().sub(T), dist = d.length();   // (the rig set so that the camera is at C looking at the wheel; its fit for the page's shape taken out)
      u.yaw = 0; Object.assign(rg, { tx: T.x, ty: T.y, tz: T.z, yaw: Math.atan2(d.x, d.z), pitch: Math.asin(d.y / dist), dist, fov: 45 }); __garage.advance(0.1); rg.dist *= dist / Garage3D.camera.position.distanceTo(T); __garage.advance(0.6);
      const c = Garage3D.camera.position, close = { gone: D.robots[0].gone, arm: +armd(c).toFixed(3), cam: c.toArray().map(v => +v.toFixed(2)) };
      Object.assign(rg, keep); D.robotsPose({ robots: ['rest', 'rest'] }); u.yaw = 0; __garage.advance(1.0); return { yaw, work, close, home: D.robots[0].gone }; });
    T.check('a parked robot steps aside when it comes between the camera and the car, one at work in the same view stays (and its tool with it); close up at its wheel, the camera beside its arm, it stays too', dis.yaw != null && dis.work === 0 && dis.close.gone === 0 && dis.close.arm > 0.08 && dis.close.arm < 0.35 && dis.home === 0, JSON.stringify(dis));
    // a part held: carried in the room's frame; let go where it came from, back on the car as it was there (also when everything parks: a
    // show cut short); a tool its stand does not hold refused at once, by name
    const hold = await page.evaluate(async () => { const D = Garage3D._dbg, cv = Garage3D.cur, out = [];
      for (const park of [false, true]) { D.robotDemo('hold', { robot: 0, tip: [0.6, 0.25, 1.75], parent: cv.root, park }); let t = 0; do { __garage.advance(0.5); t += 0.5; await new Promise(r => setTimeout(r, 0)); } while (Garage3D.busy && t < 150);
        const m = D.RB[0].demoPart, at = m.getWorldPosition(new THREE.Vector3()); out.push({ log: D.fxLog, parent: m.parent === cv.root ? 'car' : m.parent === Garage3D.scene ? 'room' : 'other', parked: D.fx.parked, moved: +at.distanceTo(new THREE.Vector3(...D.fxLog[0].at0)).toFixed(4) }); m.parent.remove(m); }
      let err = ''; try { D.robotsPose({ robots: [Object.assign({ tool: 'camera' }, D.restPose(0)), 'keep'] }); } catch (e) { err = e.message; } D.robotsPose({ robots: ['rest', 'rest'] });
      return { out, err }; });
    T.check('a part held by a robot: carried in the room\'s frame, let go back into what it came from (the car), where it was (also when the fixtures park); a tool its stand does not hold refused at once',
      hold.out.length === 2 && hold.out.every(h => h.log[0].held === 1 && h.log[0].parent === 'room' && h.log[1].held === 0 && h.log[1].parent === 'back' && h.parent === 'car' && h.parked && h.moved < 0.005) && /robot 0 has no camera/.test(hold.err), JSON.stringify(hold));
    // two tools changed on the same stand at once: both nests' vertices waiting to be sent (one range over both)
    const nr = await page.evaluate(() => { const D = Garage3D._dbg; D.robotsPose({ robots: ['rest', Object.assign({ tool: 'wrench' }, D.restPose(1))] }); D.robotsPose({ robots: ['rest', Object.assign({ tool: 'camera' }, D.restPose(1))] });
      const r = D.nestRange(1); D.robotsPose({ robots: ['rest', 'rest'] }); __garage.advance(0.1); return r; });
    T.check('two tools swapped on ORODJA at once: the one put back and the one taken both sent again (one range over both nests)', nr.offset <= Math.min(nr.nests.wrench[0], nr.nests.camera[0]) && nr.offset + nr.count >= Math.max(nr.nests.wrench[1], nr.nests.camera[1]), JSON.stringify(nr));
    // the car's body as the robots see it: in its own frame (the same measured with the car up 1 m on the lift), with its parts (the GT
    // wing over the KAZE's boot) and its wheels (the FORMULA's open ones)
    const bg = await page.evaluate(() => { const D = Garage3D._dbg, mx = (g) => Math.max(...g.h); let cv = Garage3D.cur; delete cv.hgrid; const down = mx(D.bodyGrid(cv)); delete cv.hgrid; D.raise(1.0); __garage.advance(0.1);
      const up = mx(D.bodyGrid(cv)); Garage3D.show(cv.spec); __garage.advance(0.1);
      const at = (id, f) => { Garage3D.show({ M: Core.MODELS.find(m => m.id === id), color: 0xd81f2a, stripe: true, upg: { motor: 3, gume: 3, zavore: 3, aero: 3 }, cond: { clean: 1, body: 1, engine: 1 } }); __garage.advance(0.1); const c = Garage3D.cur, G = D.bodyGrid(c); return f(c, G); };
      const cell = (G, x, z) => G.h[Math.round((x - G.ox) / G.st) * G.nz + Math.round((z - G.oz) / G.st)];
      const wing = at('kaze', (c, G) => { const b = new THREE.Box3().setFromObject(c.parts.aero); return { wing: +b.max.y.toFixed(3), grid: +G.top.toFixed(3) }; });
      const wheel = at('formula', (c, G) => { const w = c.wheels.find(q => q.front); return { top: +(w.y + w.r).toFixed(3), grid: +cell(G, w.x, w.z).toFixed(3) }; });
      Garage3D.show(window._spec0); __garage.advance(0.1); return { down: +down.toFixed(3), up: +up.toFixed(3), wing, wheel }; });
    T.check('the car\'s body for the robots\' plans: measured in its own frame (the same with the car up 1 m), with its parts (the GT wing\'s top) and its open wheels', Math.abs(bg.down - bg.up) < 0.01 && bg.down > 1 && Math.abs(bg.wing.grid - bg.wing.wing) < 0.03 && Math.abs(bg.wheel.grid - bg.wheel.top) < 0.04, JSON.stringify(bg));
    // the chamber down round the car (the robots put their tools back and fold their arms along their rails first: the glass at least 2 cm
    // from them, the drums, the lift and the stands; the outer band in the header, each band over the next one, the inner one on the floor: a
    // closed wall) and up again (stored, the robots back at rest); the drying column up out of its hatch, hot (the coils glowing, the fans
    // turning), cooled and down again (hidden)
    const demo = async (kind) => { await page.evaluate((k) => { Garage3D._dbg.fxDemo(k); }, kind); const t = await page.evaluate(async () => { let t = 0; do { __garage.advance(0.25); t += 0.25; await new Promise(r => setTimeout(r, 0)); } while (Garage3D.busy && t < 90); return t; });
      return page.evaluate((t) => ({ t, log: Garage3D._dbg.fxLog, ch: Garage3D._dbg.chamber, dr: Garage3D._dbg.dryer, parked: Garage3D._dbg.fx.parked }), t); };
    await page.evaluate(() => { const D = Garage3D._dbg; D.robotsPose({ robots: ['rest', Object.assign({ tool: 'brush' }, D.restPose(1))] }); });   // (the far robot holding the brush when the chamber is asked for)
    const c = await demo('chamber'), d = await demo('dryer'), b = c.log[0] && c.log[0].bands, BH = c.ch.BH;
    T.check('the chamber through the queue: the robots\' tools back in their nests first, both tucked along their rails, down round the car (the glass clear of everything round it; the outer band in the header, each band over the next, the inner one on the floor), up again (stored over 3.4 m, only its outer band drawn, its lights off), the robots parked after; the chamber\'s glass and frame not in the floor\'s mirror',
      c.log.length === 2 && c.log[0].k === 1 && c.log[0].low < 0.001 && c.log[0].tucked.every(Boolean) && c.log[0].tools.every(q => q === 'none') && c.log[0].nests.every(Boolean) && c.log[0].clear >= 0.02
      && b[0] + BH >= c.ch.header[0] && b.every((y, j) => j === 0 || b[j] + BH >= b[j - 1] + 0.03) && c.log[1].k === 0 && c.log[1].low > 3.4 && c.ch.k === 0 && c.ch.glassDrawn === c.ch.band0[0] && c.ch.frameDrawn === c.ch.band0[1] && c.ch.led.every(q => q === 0) && c.parked && !c.ch.mirror, JSON.stringify(c));
    T.check('the drying column through the queue: up out of its hatch and hot (drawn), cooled first and then down again (hidden, its lid flush), everything parked after',
      d.log.length === 2 && d.log[0].k === 1 && d.log[0].heat > 0.9 && d.log[0].drawn && d.log[1].k === 0 && d.log[1].heat <= 0.05 && !d.dr.drawn && d.dr.lid <= 0.015 && d.parked, JSON.stringify(d));
    // the column up and hot with no show: a frame sends only its fans' vertices again (not its colours), the shadow map not drawn again for them
    const dp = await page.evaluate(() => { const D = Garage3D._dbg; D.fxPose({ dryer: 1, heat: 1 }); for (let i = 0; i < 4; i++) __garage.advance(0.1); const a = D.dryerAttrs; Garage3D.frame(1 / 30, true); const b = D.dryerAttrs;   // (its rise's shadow drawn by then)
      __garage.advance(0.2); const sh = D.stats.shadow; D.fxPose({ dryer: 0, heat: 0 }); __garage.advance(0.3); return { a, b, sh }; });
    T.check('the drying column up and hot (no show): its fans turn, only their vertices sent again (a small range), not its colours; no shadow map drawn for them', dp.b.position.count > 0 && dp.b.position.count < dp.b.position.n / 8 && dp.b.color.v === dp.a.color.v && dp.sh === 0, JSON.stringify(dp));
    // a drum lit (the tap on it, later): its arc brighter than the others' (only its colours sent again); the chamber's lights in a paint's colour
    const gl = await page.evaluate(() => { const D = Garage3D._dbg; D.fxPose({ glow: [1, 0, 0, 0, 0], col: 0x2fa84f }); __garage.advance(0.1); D.drumGlow(2, 0.5); const range = D.drumRange; D.drumGlow(2, 0); const r = { drums: D.drums, ch: D.chamber, range };
      D.fxPose({ glow: 0, col: null }); __garage.advance(0.1); return r; });
    T.check('a drum lit up (for the tap on it): its arc brighter than the others\' (its colours alone sent again); the chamber\'s lights in the paint\'s colour (green)', gl.drums[0].glow === 1 && gl.drums.slice(1).every(q => q.glow === 0 && gl.drums[0].arc > 1.8 * q.arc) && gl.ch.ring[1] > 1.5 * gl.ch.ring[0] && gl.ch.ring[1] > 1.5 * gl.ch.ring[2] && gl.ch.col[1] > 1.5 * gl.ch.col[0] && gl.range.count > 0 && gl.range.count < gl.range.n / 2, JSON.stringify(gl));
  }

  // 1d. the service by the two floor robots (the near one: the nozzle's four passes along the near side, the scanner beside it, the
  // wrench at the drain plug under the car up on the lift; the far one: the brush and the polisher on the bonnet, the lamp under the car),
  // stepped at a high time scale on the PICO, the FORMULA and the TRUCK (worn first): each item alone and the full service (and once with
  // the phone held the other way). Every frame the audit (1c's checks): every other vertex of the arms and of the held tools, and points
  // along each link and drum with its radius, never in the car (a tool only at its working end), the lift's column, a stand (its own
  // stand's plate: the tools out through their forks), the tyre towers, the drums, the lift's arms and carriage nor the floor; the robots
  // at least 0.3 m apart; never out of reach, every way planned clear; the wrist under 3.6 m/s, the turret under 4.7 rad/s (the rides twice
  // their joints' own speed), no spin of the flange, the wrist's drum never jumping; each robot with its item's tools only (its nest
  // amber while out); a working robot hides at most 12 % of the car, its tool's tip and the whole car in the picture, the column never
  // stepped aside
  {
    await page.evaluate(() => {
      window.SvcAud = function () {   // (the audit: a.frame(dts) after each frame, a.res() at the end)
        const D = Garage3D._dbg, V = THREE.Vector3, cv = Garage3D.cur, K = cv.kit, RB = D.RB, { RK, NS } = D, ST = 0.04, ms = [];
        cv.root.traverse(q => { if (q.isMesh && q.visible && q.material && !q.material.transparent && q.geometry.attributes.position.count > 30) ms.push(q); });
        cv.root.updateMatrixWorld(true); const rc = new THREE.Raycaster(); rc.layers.enableAll(); const sides = ms.map(m => m.material.side); ms.forEach(m => { m.material.side = THREE.DoubleSide; });
        const x0 = K.rear - 0.25, z0 = -K.hw - 0.25, nx = Math.ceil((K.front - K.rear + 0.5) / ST) + 1, nz = Math.ceil((2 * K.hw + 0.5) / ST) + 1, top = new Float32Array(nx * nz), bot = new Float32Array(nx * nz), ly0 = cv.v.grp.position.y, cx = cv.root.position.x;
        for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const x = cx + x0 + a * ST, z = z0 + b * ST; rc.set(new V(x, 9, z), new V(0, -1, 0)); rc.far = 12; let h = rc.intersectObjects(ms, false); top[a * nz + b] = h.length ? h[0].point.y - ly0 : -9;
          rc.set(new V(x, -2, z), new V(0, 1, 0)); h = rc.intersectObjects(ms, false); bot[a * nz + b] = h.length ? h[0].point.y - ly0 : 9; }
        ms.forEach((m, i) => { m.material.side = sides[i]; });
        const COL = [[-0.175, 0.02, -1.83, 0.175, 2.97, -1.61], [-0.2, 2.985, -1.885, 0.2, 3.08, -1.555], [-0.14, 0.63, -1.99, 0.08, 1.34, -1.84], [0.185, 0.99, -1.82, 0.26, 1.21, -1.69]];
        const bd = (b, x, y, z) => Math.hypot(Math.max(0, b[0] - x, x - b[3]), Math.max(0, b[1] - y, y - b[4]), Math.max(0, b[2] - z, z - b[5])) || -Math.min(x - b[0], b[3] - x, y - b[1], b[4] - y, z - b[2], b[5] - z);
        const BXS = [0, 1].map(i => D.roomBoxes(null).filter(([b, k]) => !['lift', 'chamber', 'floor', 'liftc', D.STN[i].key].includes(k) && k.split('.')[0] !== D.STN[i].key).map(([b, k]) => [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z, k]));
        // (its own stand's plate (as 1c: the tools in and out through their forks): the far robot's ORODJA, the near one's stand)
        const inRack = (x, y, z) => { if (y < RK.S - 0.045 || y > RK.S + 0.002) return false; const rr = Math.hypot(x - RK.cx, z - RK.cz) - RK.r, a = Math.atan2(z - RK.cz, x - RK.cx);
          if (rr < -0.18 || rr > 0.18 || a > RK.e0 || a < RK.e1) return false; if (rr < 0.08) for (const aj of RK.a) if (Math.abs(a - aj) < RK.SW) return false; return true; };
        const inStand = (x, y, z) => { if (y < NS.S - 0.045 || y > NS.S + 0.002) return false; const dx = x - NS.x; if (dx < -0.18 || dx > 0.18 || z < NS.e[0] || z > NS.e[1]) return false;
          if (dx > -0.08) for (const zj of NS.z) if (Math.abs(z - zj) < 0.08) return false; return true; };
        const sd2 = (p, a, b) => { const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z, L = abx * abx + aby * aby + abz * abz, t = L > 1e-9 ? Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / L)) : 0; return Math.hypot(a.x + abx * t - p.x, a.y + aby * t - p.y, a.z + abz * t - p.z); };
        const segSeg = (p1, q1, p2, q2) => { let m = 9; for (let k = 0; k <= 16; k++) { const t = k / 16; m = Math.min(m, sd2({ x: p1.x + (q1.x - p1.x) * t, y: p1.y + (q1.y - p1.y) * t, z: p1.z + (q1.z - p1.z) * t }, p2, q2)); } return m; };
        const R = { frames: 0, car: [0, 0], tool: [0, 0], col: [0, 0], lift: [0, 0], stand: [0, 0], plate: [0, 0], tower: [0, 0], drum: [0, 0], floor: [0, 0], apart: 9, v: [0, 0], hd: [0, 0], roll: [0, 0], a5: [0, 0], miss: [0, 0], notOk: [0, 0],
          hid: [0, 0], off: [0, 0], carOff: 0, seenN: [0, 0], used: [[], []], led: [0, 0], gone: 0, colGone: 0, pan: 0, nan: 0, who: {} };
        const keep = (k, i, d, why) => { if (d > R[k][i]) { R[k][i] = +d.toFixed(3); R.who[k + i] = [why, D.svc.step, D.svc.t]; } };
        const v = new V(), pw = [null, null], ph = [null, null], pc = [null, null], p5 = [null, null], lp = RB.map(A => A.lastPath), vc = new Map(), PB = D.carProbe(cv), vp = [];
        for (let i = 0; i <= 10; i++) { const x = K.rear + 0.1 + (K.front - K.rear - 0.2) * i / 10;   // (the car's points: along its top and both sides)
          for (let j = 0; j <= 4; j++) { const z = (j / 4 - 0.5) * K.hw * 1.6, y = PB.top(x, z); if (y != null) vp.push([x, y - ly0 + 0.01, z]); }
          for (let j = 0; j <= 3; j++) { const y = K.bottom + 0.05 + (K.top - K.bottom - 0.1) * j / 3; for (const s of [-1, 1]) { const z = PB.side(x, y + ly0, s); if (z != null) vp.push([x, y, s * (z + 0.01)]); } } }
        const seen = (cam) => { const key = cam.toArray().map(q => q.toFixed(1)).join(); if (vc.has(key)) return vc.get(key); const ly = cv.v.grp.position.y, P = [], r2 = new THREE.Raycaster(), mm = D.carProbe(cv).meshes;   // (those seen from the camera there)
          for (const [x, y, z] of vp) { const p = new V(cx + x, y + ly, z); r2.set(cam, p.clone().sub(cam).normalize()); r2.far = cam.distanceTo(p) - 0.03; if (!r2.intersectObjects(mm, false).length) P.push(p); } vc.set(key, P); return P; };
        // (a robot at work on the car: from its first beat on the car to its last (the near one's passes, its scan and check, the plug; the far
        // one's strokes, the pad, the lamp): its tool's tip in the picture)
        const WORK = [[['n.rinse0.go', 'n.air'], ['n.scan.go', 'n.verified'], ['n.atPlug', 'n.plugIn']], [['f.brush.on', 'f.scrubbed'], ['f.pad.on', 'f.polished'], ['f.lamp', 'f.out']]];
        const led = (S, k) => { const c = S.live.geometry.attributes.color.array, j = S.nests[k].led[0] * 3; return c[j] > c[j + 1] * 1.5 ? 'amber' : c[j + 1] > c[j] * 1.5 ? 'green' : '?'; };
        return { frame(dt) { R.frames++; const LC = D.liftCaps(), Ls = RB.map(A => D.linksOf(A, 'whole', []).map(([a, b, r], j, L) => [a.clone(), b.clone(), r, L.k[j]])), ly = cv.v.grp.position.y, S = D.svc, cam = Garage3D.camera;
            if (S.fx.pan.visible && ly < 1.3) R.pan++;
            for (const i of [0, 1]) { const A = RB[i], J = A.J; if (['Wc', 'tipA', 'E', 'hd'].some(k => !Number.isFinite(J[k].x + J[k].y + J[k].z))) R.nan++;
              if (A.lastPath !== lp[i]) { lp[i] = A.lastPath; if (lp[i] && !lp[i].ok) R.notOk[i]++; }
              if (A.tool !== 'none') { if (!R.used[i].includes(A.tool)) R.used[i].push(A.tool); const S2 = D.STN[i]; if (S2.nests[A.tool].st !== 'out' || led(S2, A.tool) !== 'amber') R.led[i]++; }
              if (A.rest) { pw[i] = null; continue; } if (A.P.k > 0.5) R.gone++; R.miss[i] = Math.max(R.miss[i], +J.miss.toFixed(3));
              if (pw[i] && dt > 0) { R.v[i] = Math.max(R.v[i], +(pw[i].distanceTo(J.Wc) / dt).toFixed(2)); R.hd[i] = Math.max(R.hd[i], +(Math.acos(Math.min(1, ph[i].dot(J.hd))) / dt).toFixed(2));
                R.roll[i] = Math.max(R.roll[i], +(Math.acos(Math.min(1, pc[i].dot(J.ac))) / dt).toFixed(2)); R.a5[i] = Math.max(R.a5[i], +(Math.acos(Math.min(1, Math.abs(p5[i].dot(J.a5)))) / dt).toFixed(2)); }
              pw[i] = J.Wc.clone(); ph[i] = J.hd.clone(); pc[i] = J.ac.clone(); p5[i] = J.a5.clone();
              const tip = J.tipA, test = (p, r, tl) => { const x = p.x, y = p.y, z = p.z;
                for (const b of COL) keep('col', i, r - bd(b, x, y, z) - 0.005, 'col');
                for (const b of BXS[i]) { const d = r - bd(b, x, y, z) - 0.005; if (d > 0) keep('stand', i, d, b[6]); }
                if (!r && (i ? inRack : inStand)(x, y, z)) keep('plate', i, 1, tl ? 'tool' : 'arm');
                for (const d of D.drums) if (y > 0.11 - r && y < 0.92 + r) keep('drum', i, d.r + r - Math.hypot(x - d.x, z - d.z) - 0.005, 'drum');
                for (const [tx, tz] of D.TWR) if (y < 1.0 + r) keep('tower', i, 0.33 + r - Math.hypot(x - tx, z - tz) - 0.005, 'tower');
                keep('floor', i, r - y - 0.005, 'floor');
                if (LC) { for (const [a, b, rr] of LC.caps) keep('lift', i, r + rr - sd2(p, { x: a[0], y: a[1], z: a[2] }, { x: b[0], y: b[1], z: b[2] }) - 0.005, 'liftarm'); for (const [mn, mx] of LC.boxes) keep('lift', i, r - bd([mn[0], mn[1], mn[2], mx[0], mx[1], mx[2]], x, y, z) - 0.005, 'liftbox'); }
                if (!(tl && p.distanceTo(tip) < 0.15)) { const a = Math.round((x - cx - x0) / ST), b = Math.round((z - z0) / ST); if (a >= 0 && a < nx && b >= 0 && b < nz) { const tp = top[a * nz + b], bt = bot[a * nz + b], yy = y - ly;
                  if (tp > -8) { const d = Math.min(tp - (yy - r), yy + r - bt); if (d > 0) keep(tl ? 'tool' : 'car', i, d, 'car'); } } } };
              // (as 1c: every other vertex of the arm (its links 1 to 7) and of the held tool, points along each link and drum with its radius)
              const am = A.R.mesh.geometry.attributes.position.array; for (const [v0, v1, pk] of A.R.runs) if (pk >= 1 && pk <= 7) for (let j = v0; j < v1; j += 2) test(v.set(am[j * 3], am[j * 3 + 1], am[j * 3 + 2]), 0, false);
              for (const [a, b, r, k] of Ls[i]) { if (k !== 'arm' && k !== 'tool') continue; const n = Math.max(1, Math.ceil(a.distanceTo(b) / 0.04)); for (let m = 0; m <= n; m++) test(v.copy(a).lerp(b, m / n), r * (k === 'tool' ? 0.6 : 0.8), k === 'tool'); }
              if (A.tool !== 'none') { const m = D.STN[i].tools[A.tool].mesh, p = m.geometry.attributes.position.array; for (let j = 0; j < p.length; j += 6) test(v.set(p[j], p[j + 1], p[j + 2]).applyMatrix4(m.matrix), 0, true); }
              if (S.on && WORK[i].some(([a, b]) => S.cue[a] != null && S.cue[b] == null)) { cam.updateMatrixWorld(); const q = v.copy(J.tipA).project(cam), o = Math.max(Math.abs(q.x), Math.abs(q.y)); R.seenN[i]++;
                if (o > R.off[i]) { R.off[i] = +o.toFixed(2); R.who['off' + i] = [S.step, S.t]; }
                for (const cx2 of [K.rear, K.front]) for (const cy of [K.bottom, K.top]) for (const cz of [-K.hw, K.hw]) { const c = v.set(cx + cx2, cy + ly, cz).project(cam), oc = Math.max(Math.abs(c.x), Math.abs(c.y)); if (oc > R.carOff) { R.carOff = +oc.toFixed(2); R.who.carOff = [S.step, S.t]; } } } }
            if (!RB[0].rest && !RB[1].rest) { let m = 9; for (const [a, b, r, k] of Ls[0]) if (k === 'arm' || k === 'tool') for (const [c, d, r2, k2] of Ls[1]) if (k2 === 'arm' || k2 === 'tool') m = Math.min(m, segSeg(a, b, c, d) - r - r2); R.apart = Math.min(R.apart, +m.toFixed(3)); }
            if (D.LIFT.piece.k > 0.5) R.colGone++;
            if (S.on && R.frames % 3 === 0 && S.cue['m.home'] == null) { const cp = cam.position.clone(), P = seen(cp);
              if (P.length) for (const i of [0, 1]) { if (RB[i].rest) continue; const L = Ls[i].filter(q => q[3] === 'arm'); let n = 0; for (const p of P) if (L.some(([a, b, r]) => segSeg(cp, p, a, b) < r)) n++; const h = n / P.length; if (h > R.hid[i]) { R.hid[i] = +h.toFixed(2); R.who['hid' + i] = [S.step, S.t]; } } } },
          res() { return R; } }; };
      // (a service on a car shown worn: stepped at fast k (frame 1/30 s), audited every frame; what it did and how everything is after it)
      window.SvcRun = async function (id, items, k, o) { o = o || {}; const D = Garage3D._dbg, G = Garage3D;
        G.show({ M: Core.MODELS.find(m => m.id === id), color: 0x1f6fd6, stripe: true, upg: {}, cond: { clean: 1, body: 1, engine: 1 } }); __garage.advance(1.5); G.frame(1 / 30); const rest = D.stats.main;
        const au = SvcAud(), f0 = D.RB.map(A => A.fails || 0); G.fast = k; D.svcRun(items); let t = 0, n = 0, tapAt = null;
        while (G.busy && t < 150) { G.frame(1 / 30, true); t += 1 / 30; n++; au.frame(k / 30 * (tapAt != null ? 3 : 1)); if (o.tap != null && tapAt == null && D.svc.on && D.svc.t >= o.tap) { D.tap(); tapAt = n; } if (n % 20 === 0) await new Promise(r => setTimeout(r, 0)); }
        const doneN = n; G.fast = 1; __garage.advance(3.0); G.frame(1 / 30);   // (its last smoke gone)
        const S = D.svc, L = D.lift, cv = G.cur, h = D.rig, H = D.views().HOME, fx = D.fx;
        return { id, items, frames: doneN, tapAt, done: S.done, cue: S.cue, notes: S.log.filter(q => /^(fail|late|gate|skip)/.test(q[1])).map(q => q.join(' ')), fails: D.RB.map((A, i) => (A.fails || 0) - f0[i]), aud: au.res(),
          cond: Object.assign({}, cv.spec.cond), dirt: G.info.dirt, scr: G.info.scr, patched: S.patched, parked: fx.parked, leds: [fx.stand.leds, fx.rack.leds], nests: [fx.stand.nests, fx.rack.nests],
          lift: { h: G.info.lift, s: L.arms, on: L.on, c: L.carriage }, fx: S.fx, loops: S.loops, on: S.on, home: ['yaw', 'pitch', 'dist', 'tx', 'ty', 'tz', 'fov'].every(q => Math.abs(h[q] - H[q]) < 1e-3) && Math.abs(D.user.yaw) < 1e-3, rest, after: D.stats.main, plans: S.plans }; };
    });
    const runSvc = (id, items, k, o) => page.evaluate(([id, items, k, o]) => SvcRun(id, items, k, o), [id, items, k, o || {}]);
    // (the end state every run must reach: each item done once, in order, within its time; the car's condition 100 %; no step skipped,
    // late, failed or forced; the robots parked with their tools in their nests (all green), the lift down and stowed, the pan and the
    // beams hidden, no mark, the paint's layer off, the floor dry, no loop, no tool turning, the camera home, the draws as before; the
    // audit clean)
    const TOOL = [{ clean: 'nozzle', body: 'scanner', engine: 'wrench' }, { clean: 'brush', body: 'polisher', engine: 'camera' }];   // (each robot's tool for each item)
    const CEIL = { clean: 10.8, body: 9.6, engine: 11.8 }, ORDER = { clean: ['n.rinse0.go', 'n.rinse0', 'n.foam.go', 'f.stroke1', 'n.rinse', 'n.air'], body: ['n.scan.go', 'n.scanned', 'f.pad.on', 'n.verify.go', 'f.polished', 'n.verified'],
      engine: ['lift.go', 'lift.up', 'm.rough', 'n.atPlug', 'n.plugOut', 'm.oil', 'n.plugIn', 'n.out', 'car.lower', 'car.down'] };   // (the electric car: no oil, its 'm.oil' at once)
    const ends = (r) => { const A = r.aud, bad = [];
      if (r.done.map(d => d.kind).join() !== r.items.join()) bad.push('done ' + JSON.stringify(r.done));
      if (r.items.length === 1 && r.done[0] && r.done[0].t > CEIL[r.items[0]]) bad.push('slow ' + r.done[0].t);
      for (const it of r.items) { const c = ORDER[it].filter(q => !(r.id === 'ev' && q === 'm.oil')).map(q => r.cue[q]); if (it === 'clean' && !(r.cue['n.foam'] <= r.cue['n.rinse.go'])) bad.push('foam'); if (c.some(q => q == null) || c.some((q, j) => j && q < c[j - 1])) bad.push('order ' + it + ' ' + JSON.stringify(c)); if (r.cond[it] !== 1) bad.push('cond ' + it); }
      if (r.items.includes('clean') && r.dirt !== 0) bad.push('dirt'); if (r.items.includes('body') && r.scr !== 0) bad.push('scr');
      if (r.notes.length || r.fails.some(q => q)) bad.push('notes ' + r.notes.join(', ') + ' fails ' + r.fails);
      if (!r.parked || !r.leds.every(L => Object.values(L).every(c => c === 'green')) || !r.nests.every(N => Object.values(N).every(s => s === 'in'))) bad.push('not parked');
      if (r.lift.h !== 0 || r.lift.s !== 0 || r.lift.on || r.lift.c !== 0.04) bad.push('lift ' + JSON.stringify(r.lift));
      if (r.on || r.fx.pan.visible || r.fx.pan.y !== -0.095 || r.fx.beams.some(Boolean) || r.fx.oil || r.fx.marks || r.fx.layer || r.fx.wet || r.fx.spin.some(Boolean) || r.loops.length) bad.push('fx ' + JSON.stringify(r.fx) + ' loops ' + r.loops);
      if (!r.home) bad.push('camera not home'); if (r.patched !== 2) bad.push('patched ' + r.patched); if (r.after !== r.rest) bad.push('draws ' + r.rest + ' -> ' + r.after);
      for (const k of ['car', 'tool', 'col', 'lift', 'stand', 'plate', 'tower', 'drum', 'floor']) if (A[k].some(q => q > 0.01)) bad.push(k + ' ' + A[k] + ' ' + JSON.stringify([A.who[k + 0], A.who[k + 1]]));
      if ([0, 1].some(i => A.used[i].join() !== r.items.map(it => TOOL[i][it]).join()) || A.led.some(Boolean)) bad.push('tools ' + JSON.stringify({ used: A.used, led: A.led }));
      if (A.miss.some(q => q >= 0.005) || A.notOk.some(Boolean) || A.roll.some(q => q >= 8) || A.a5.some(q => q >= 11)) bad.push('moves ' + JSON.stringify({ miss: A.miss, notOk: A.notOk, roll: A.roll, a5: A.a5 }));
      if (A.seenN.some(q => !q) || A.off.some(q => q > 0.95) || A.carOff > 1) bad.push('view ' + JSON.stringify({ off: A.off, car: A.carOff, n: A.seenN, who: [A.who.off0, A.who.off1, A.who.carOff] }));
      if (A.apart < 0.3 || A.v.some(q => q >= 3.6) || A.hd.some(q => q >= 4.7) || A.hid.some(q => q > 0.12) || A.gone || A.colGone || A.pan || A.nan) bad.push('audit ' + JSON.stringify({ apart: A.apart, v: A.v, hd: A.hd, hid: A.hid, who: [A.who.hid0, A.who.hid1], gone: A.gone, col: A.colGone, pan: A.pan, nan: A.nan }));
      return bad; };
    // (its plans on every car of the fleet (the garage's list: the game's cars, the retired ones not), no show: every pose in reach and
    // clear; the brush's and the pad's lanes found (on the bonnet, else along the top: the roof, the deck, a side pod; at the last held
    // just over a kart); the lance's carriage behind its tip, the lamp's by ORODJA, the wrench staged outside the car's footprint; the
    // electric cars' bolts)
    const fleet = await page.evaluate(() => __garage.ORDER.slice());
    const plans = await page.evaluate(() => __garage.ORDER.map(id => { const M = Core.MODELS.find(m => m.id === id); Garage3D.show({ M, color: 0x1f6fd6, stripe: true, upg: {}, cond: { clean: 1, body: 1, engine: 1 } }); __garage.advance(0.1); const P = Garage3D._dbg.svcPlans(['clean', 'body', 'engine']); return Object.assign({ id: M.id, ev: !!M.ev }, P); }));
    const okq = (q) => q && q.miss === 0 && q.clear >= 0, badPlans = plans.filter(p => !(okq(p.lance) && p.lance.x <= p.lance.T0x - 1.2 && okq(p.brush) && okq(p.scan) && okq(p.pol) && okq(p.wrench) && p.staged && p.staged.out && p.staged.clear >= 0 && okq(p.lamp) && p.lamp.x >= 1.15 && p.lamp.out && (!p.ev || p.bolts >= 1)));
    T.check(`the service's plans on all ${fleet.length} cars of the fleet (no show): the lance from the near side (its carriage 1.2 m behind its tip), the brush's and the pad's lanes (the bonnet, else along the top), the scanner's station, the wrench at the drain plug (staged outside the car's footprint), the lamp by ORODJA; every pose in reach and clear; the electric cars' bolts`,
      plans.length === fleet.length && fleet.length >= 43 && !fleet.includes('p206') && !badPlans.length, JSON.stringify(badPlans.length ? badPlans.map(p => ({ id: p.id, lance: p.lance, brush: p.brush && p.brush.rung, pol: p.pol && p.pol.rung, scan: p.scan, wrench: p.wrench, staged: p.staged, lamp: p.lamp, bolts: p.bolts, brushTry: p.brushTry, polTry: p.polTry })) : plans.map(p => [p.id, p.brush.rung, p.pol.rung, p.lance.x, p.lamp.x])));
    const res = [];
    for (const id of ['pico', 'formula', 'truck']) for (const it of ['clean', 'body', 'engine']) res.push(await runSvc(id, [it], 3));   // (the KOLIBRI: its full service below)
    const bad1 = res.map(r => [r.id + '.' + r.items[0], ends(r)]).filter(q => q[1].length);
    T.check(`each item alone on the PICO, the FORMULA and the TRUCK (fast 3): done in order within its time (wash <= ${CEIL.clean} s, body <= ${CEIL.body} s, engine <= ${CEIL.engine} s), its beats in order, the condition 100 %, nothing skipped; after it the robots parked (tools in their nests, green), the lift down, every effect off, the camera home, the draws as before; the robots (every other vertex of their arms and tools) never in the car, the column, the stands (through their own stand's forks), the lift, the floor, apart, in reach, every way clear, within their speeds, each with its item's tool (its nest amber meanwhile), hiding at most 12 % of the car, the working tool's tip and the whole car in the picture`,
      !bad1.length, JSON.stringify(bad1.length ? bad1 : res.map(r => [r.id, r.items[0], r.done[0].t, r.aud.hid, r.aud.apart, r.aud.v, r.aud.hd, r.aud.roll, r.aud.a5, r.aud.off, r.aud.carOff])));
    const full = [await runSvc('pico', ['clean', 'body', 'engine'], 1), await runSvc('kolibri', ['clean', 'body', 'engine'], 2), await runSvc('formula', ['clean', 'body', 'engine'], 2), await runSvc('truck', ['clean', 'body', 'engine'], 2)];
    const bad2 = full.map(r => [r.id, ends(r).concat(r.done.length === 3 && r.done[2].t <= 36.5 ? [] : ['slow ' + JSON.stringify(r.done)], Object.keys(r.cue).filter(q => q === 'n.rest' || q === 'f.rest').length === 2 && ['n.rest', 'f.rest'].every(q => r.cue[q] > r.done[2].t) ? [] : ['parked between the items'])]).filter(q => q[1].length);
    T.check('the full service on the PICO (fast 1), the KOLIBRI, the FORMULA and the TRUCK (fast 2): wash, body, engine in a row (the last done <= 36.5 s), the tools swapped at the stands between the items (no parking till the end), the lift\'s arms swung in under the car during the body; the same end state and audit',
      !bad2.length, JSON.stringify(bad2.length ? bad2 : full.map(r => [r.id, r.done.map(d => d.t), r.aud.hid, r.aud.apart, r.aud.off, r.aud.carOff])));
    // the phone held the other way (915 x 412; the service's views fitted to it): the full service on the TRUCK (the tallest, up on the lift)
    await page.setViewportSize({ width: 915, height: 412 }); await page.evaluate(() => __garage.advance(0.2));
    const land = await runSvc('truck', ['clean', 'body', 'engine'], 2), bad3 = ends(land);
    await page.setViewportSize({ width: 412, height: 915 }); await page.evaluate(() => __garage.advance(0.2));
    T.check('the full service on the TRUCK with the phone held the other way (landscape): the same end state and audit (the working tool\'s tip and the whole car in the picture, the robots hiding at most 12 % of it)',
      !bad3.length && land.done.length === 3, JSON.stringify(bad3.length ? bad3 : { done: land.done.map(d => d.t), hid: land.aud.hid, off: land.aud.off, car: land.aud.carOff, draws: land.rest }));
    // a tap on the picture hurries the show (the robots and the lift with it); the electric car: the battery's bolts, no oil, no pan
    const plain = await runSvc('pico', ['clean'], 2), tap = await runSvc('pico', ['clean'], 2, { tap: 2 }), ev = await runSvc('ev', ['engine'], 3), sm = await page.evaluate(() => Garage3D._dbg.svc.log.map(q => q[1]));
    const tr = (tap.frames - tap.tapAt) / Math.max(1, plain.frames - tap.tapAt);
    T.check('a tap during the wash: the show (the robots, the passes) runs about three times as fast to its end, everything as after any wash', tr <= 0.45 && !ends(tap).length, JSON.stringify({ plain: plain.frames, tap: tap.frames, at: tap.tapAt, tr: +tr.toFixed(2), bad: ends(tap) }));
    T.check('the electric car\'s engine: the wrench at the battery tray\'s bolts, no oil, no pan up; the same end state', !ends(ev).length && ev.cue['n.bolt0'] != null && ev.cue['n.plugIn'] != null && ev.cue['m.oil'] != null && sm.includes('n.bolt0') && ev.aud.pan === 0, JSON.stringify({ bad: ends(ev), cue: ev.cue }));
    // draws while it runs (a full service on the PICO, drawn every half second of its time): at most 16 more than at rest
    const dc = await page.evaluate(async () => { const D = Garage3D._dbg, G = Garage3D; G.show({ M: Core.MODELS.find(m => m.id === 'pico'), color: 0x1f6fd6, stripe: true, upg: {}, cond: { clean: 1, body: 1, engine: 1 } }); __garage.advance(1.5); G.frame(1 / 30); const rest = D.stats.main;
      D.svcRun(['clean', 'body', 'engine']); G.fast = 3; let t = 0, k = 0, mx = 0, at = ''; while (G.busy && t < 60) { G.frame(1 / 30, true); t += 1 / 30; if (++k % 5 === 0) { G.frame(1 / 30); if (D.stats.main > mx) { mx = D.stats.main; at = D.svc.step; } } if (k % 20 === 0) await new Promise(r => setTimeout(r, 0)); }
      G.fast = 1; __garage.advance(3.0); G.frame(1 / 30); return { rest, max: mx, at, after: D.stats.main }; });
    T.check('the draws while the full service runs: at most 16 more than at rest (its beams, marks, pan and the tools only while they show); at rest after it as before', dc.max <= dc.rest + 16 && dc.after === dc.rest, JSON.stringify(dc));
    // a car asked for during the service (the FORMULA while the PICO's body is scanned): it waits till the service has ended and
    // everything is parked (the lift down, the pan hidden, no loop), then drives in
    const sw = await page.evaluate(async () => { const D = Garage3D._dbg, G = Garage3D; G.show({ M: Core.MODELS.find(m => m.id === 'pico'), color: 0x1f6fd6, stripe: true, upg: {}, cond: { clean: 0.2, body: 0.2, engine: 0.2 } }); __garage.advance(0.3);
      const old = G.cur, au = SvcAud(); D.svcRun(['clean', 'body', 'engine']); G.fast = 3; let t = 0, k = 0, asked = false, at = null;
      while ((G.busy || !asked) && t < 120) { G.frame(1 / 30, true); t += 1 / 30; const S = D.svc; if (S.on) au.frame(3 / 30);
        if (!asked && S.cue['n.scan.go'] != null) { asked = true; __garage.pickCar('formula'); }
        if (asked && !at && old.root.position.x > 0.05) at = { done: S.done.map(d => d.kind), parked: D.fx.parked, lift: G.info.lift, arms: D.lift.arms, pan: S.fx.pan.visible, loops: S.loops, on: S.on };
        if (++k % 20 === 0) await new Promise(r => setTimeout(r, 0)); }
      G.fast = 1; __garage.advance(0.5); const A = au.res(); return { at, car: G.info.car, x: G.cur.root.position.x, cond: Object.assign({}, old.spec.cond), pen: ['car', 'tool', 'col', 'lift', 'stand', 'plate', 'tower', 'drum', 'floor'].filter(q => A[q].some(v => v > 0.01)), nan: A.nan }; });
    T.check('a car asked for during the service: the service ends first (wash, body, engine done, the old car at 100 %, the robots never in anything meanwhile), everything parked (the lift down, the pan hidden, no loop), then the old car drives out and the new one in',
      sw.at && sw.at.done.join() === 'clean,body,engine' && sw.at.parked && sw.at.lift === 0 && sw.at.arms === 0 && !sw.at.pan && !sw.at.loops.length && !sw.at.on && sw.car === 'formula' && sw.x === 0
      && ['clean', 'body', 'engine'].every(q => sw.cond[q] === 1) && !sw.pen.length && !sw.nan, JSON.stringify(sw));
    await page.evaluate(() => { Garage3D.show(window._spec0); __garage.advance(0.3); });
    T.check('the service ran with no page error (no gate of the lift timed out, the paint\'s layer found in the car\'s shader)', !errors.length, errors.slice(0, 5).join(' | '));
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
    // (a robot at work at the car with a tool when another car is asked for: watched till the old car moves)
    const first = await page.evaluate(async () => { const D = Garage3D._dbg, old = Garage3D.cur, w = old.wheels.find(w => w.sd > 0 && w.front), q = D.robotPlan(0, [w.x, w.y, w.outer + 0.02], [0, 0, -1], { tool: 'wrench' });
      D.robotsPose({ robots: [Object.assign({ tool: 'wrench' }, q), 'keep'] }); D.fxPose({ dryer: 1, heat: 1 }); __garage.pickCar('kaze'); let t = 0;
      while (old.root.position.x <= 0.01 && t < 40) { __garage.advance(0.1); t += 0.1; await new Promise(r => setTimeout(r, 0)); } const f = D.fx; return { t: +t.toFixed(1), parked: f.parked, lane: f.lane, tool: f.robots[0].tool, nest: f.stand.nests.wrench, dryer: D.dryer.k, drawn: D.dryer.drawn, chamber: D.chamber.k }; });
    await run();
    const u = await ui(), fx = await page.evaluate(() => Garage3D._dbg.fx);
    T.check('another car: the PICO drives out, the KAZE RS drives in and stops on the table', u.info.car === 'kaze' && u.name === 'KAZE RS' && Math.abs(u.info.ang) < 0.01 && /Kupi · 30\.000\u00a0🪙/.test(u.go), JSON.stringify({ car: u.info.car, go: u.go }));
    T.check('a car asked for while a robot works at the wheel with the wrench and the drying column stands up hot in the lane: the column goes down and the robot puts the wrench back and parks first (when the old car starts off: everything parked, nothing in the lane), then the swap',
      first.parked && first.tool === 'none' && first.nest === 'in' && first.lane >= 1.3 && first.dryer === 0 && !first.drawn && first.chamber === 0 && fx.parked && fx.lane >= 1.3, JSON.stringify({ first, parked: fx.parked, lane: fx.lane }));
    await page.evaluate(() => __garage.buy());
    const u2 = await ui(), toast = await page.evaluate(() => document.getElementById('g-toast').textContent);
    T.check('too few coins for it: refused, the coins unchanged', u2.money === '11.500' && !u2.S.cars.kaze.own && /Premalo kovančkov/.test(toast), toast);
  }

  // 3. the veteran's profile: many credits, cars; buying one
  {
    await page.evaluate(() => document.querySelector('#g-modes [data-mode="vet"]').click()); await run();
    const u = await ui();
    T.check('the veteran: 248.500 coins, the KAZE RS (owned) on the table', u.money === '248.500' && u.S.car === 'kaze' && u.info.car === 'kaze' && u.S.cars.kaze.own, JSON.stringify({ money: u.money, car: u.info.car }));
    await page.evaluate(() => __garage.pickCar('formula')); await run();
    await page.evaluate(() => __garage.buy());
    const u2 = await ui();
    T.check('bought: the FORMULA ORKAN for 90.000 coins (248.500 -> 158.500), the go button now chooses it', u2.S.cars.formula.own && u2.S.money === 158500 && u2.go === 'Izberi' && u2.info.car === 'formula', JSON.stringify({ money: u2.S.money, go: u2.go }));
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
    T.check('upgrades: paid ' + want + ' coins', paid === want, 'paid ' + paid);
    // (the home view's pieces before: swung round to 0.95 and back, and after the engine's show (its views at the front): each as it was)
    const ks = () => page.evaluate(() => Garage3D._dbg.pieces.map(p => +p.k.toFixed(2)));
    const k0 = await ks(); await page.evaluate(() => { const u = Garage3D._dbg.user; u.yaw = 0.4; __garage.advance(1.5); u.yaw = 0; __garage.advance(1.5); }); const k1 = await ks();
    await page.evaluate(() => __garage.fitUpg('motor', 3)); await run(); await page.evaluate(() => __garage.advance(1.0)); const k2 = await ks();
    const odd = k0.map((k, j) => k !== k1[j] || k !== k2[j] ? [j, k, k1[j], k2[j]] : null).filter(Boolean);
    T.check('the home view keeps its pieces: after a swing round to yaw 0.95 and back, and after the engine\'s show, each piece as it was (none left stepped aside)', !odd.length, JSON.stringify(odd));
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
    const u = await ui(), L = await page.evaluate(() => Garage3D._dbg.lift), sv = await page.evaluate(() => { const D = Garage3D._dbg, S = D.svc; return { done: S.done.map(d => d.kind).join(), notes: S.log.filter(q => /^(fail|late|gate|skip)/.test(q[1])).length, parked: D.fx.parked }; });
    T.check('a full service (the page\'s Popoln servis): the robots\' wash, body and engine in a row, nothing skipped, parked after; clean, no scratches, condition 100 %, paid', u0.info.dirt > 0.3 && u.info.dirt === 0 && u.info.scr === 0 && u.S.cars.rally.cond.engine === 1 && u.S.money < u0.S.money && u.info.lift === 0
      && sv.done === 'clean,body,engine' && !sv.notes && sv.parked, JSON.stringify({ before: u0.info, after: u.info, sv }));
    T.check('the service: the lift raises the car for the engine (>= 1 m) and lowers it, its arms stowed; the table never rises nor turns', r.lift >= 1.0 && r.table === 0 && r.ang === 0 && u.info.lift === 0 && L.arms === 0 && !L.on, JSON.stringify({ r, arms: L.arms }));
    await page.evaluate(() => __garage.doPaint(5, false)); await run();
    const u2 = await ui();
    T.check('a new colour (green, no stripes): the car painted, 2.000 coins taken', u2.info.color === 0x2fa84f && u2.info.stripe === false && u.S.money - u2.S.money === 2000 && u2.info.car === 'rally', JSON.stringify(u2.info));
    const sh = await page.evaluate(() => (__garage.advance(0.1), Garage3D._dbg.shelf)), gr = [0x2f / 255, 0xa8 / 255, 0x4f / 255];
    T.check('the parts shelf\'s parts in the car\'s colour follow the car on the table (green now)', sh.col === 0x2fa84f && sh.c.every((q, j) => Math.abs(q - gr[j]) < 0.01), JSON.stringify(sh));
  }

  // 6. English
  {
    await page.evaluate(() => __garage.onAct('lang'));
    const t = await page.evaluate(() => ({ h: document.querySelector('.g-title h1').textContent, go: document.getElementById('g-go').textContent, tile: document.querySelector('.g-tile small').textContent, html: document.documentElement.lang, plate: (__garage.advance(0.1), Garage3D._dbg.fx.rack.plate), plates: Garage3D._dbg.plates }));
    T.check('English: GARAGE, Choose (the game\'s word), the tiles in English, the plates TOOLS, PARTS, RIMS, AERO KITS', t.h === 'GARAGE' && t.go === 'Choose' && t.tile === 'Car' && t.html === 'en' && t.plate === 'TOOLS' && t.plates.join() === 'TOOLS,PARTS,RIMS,AERO KITS', JSON.stringify(t));
    await page.evaluate(() => __garage.onAct('lang'));
    const pl = await page.evaluate(() => (__garage.advance(0.1), Garage3D._dbg.fx.rack.plate));
    T.check('back in Slovenian: the plate ORODJA again', pl === 'ORODJA', pl);
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
    // the robots' reach on every car (down on the table and up 1 m on the lift): each from its side (the near one the near side, the far
    // one the far side; its rear wheel, before the paint drums, with the car up) puts its tool on the wheels' hubs (the wrench), the sill
    // and the door (the far side's off the lift's column, 45 cm right of it at the least, the tool in from that side; the sill there at a
    // slant: the camera, a bar cannot lie along it; an open car's sill its side pod from over it, the near side's only), the mirror (from
    // the side, else at a slant or from over it), its half of the bonnet and of the boot (the gripper from over them, else at a slant:
    // their tops as the robots see the car, its wing over a boot with it), the front and the rear corner, the roof from the side (off the
    // column too); the planned pose in reach and its arm clear (0 or more) of the column, the stands and the body, backed off its way in too.
    // Every car of the fleet, the points in the robots' working room: none higher than 2.9 m (a lorry's or a monster truck's roof and
    // bonnet, up on the lift: beyond their arms), none past 2.75 m along the car (a long one's ends stand at ORODJA, the tyre towers and the
    // drums), the far mirror not by the column, no sill where the body stands high on a frame (its side measured on a chassis rail), no
    // corner nor bed of a body standing 0.75 m and more over the floor (a monster truck's: among its huge tyres, up in its bed); a hub,
    // a sill, a corner too low or too high for the arm level with it: at a slant from over it too (a kart's, a monster truck's)
    const reach = await page.evaluate(() => { const D = Garage3D._dbg, bad = []; let n = 0, out = 0;
      for (const M of __garage.ORDER.map(id => Core.MODELS.find(m => m.id === id))) { Garage3D.show({ M, color: 0xd81f2a, stripe: true, upg: { motor: 3, gume: 3, zavore: 3, aero: 3 }, cond: { clean: 1, body: 1, engine: 1 } });
        for (const h of [0, 1.0]) { if (h) D.raise(h); const cv = Garage3D.cur, K = cv.kit, ly = cv.v.grp.position.y, FP = D.carProbe(cv); const xm = (K.wfx + K.wrx) / 2, hoodEnd = 2 * (K.hoodX + 0.04) - K.front, hw = K.hw, bz = K.open ? K.sideZ * 0.5 : hw * 0.35;
          const top = (x, z, d) => { let m = -9; for (const dx of [-0.12, 0, 0.12]) for (const dz of [-0.12, 0, 0.12]) { const y = FP.top(x + dx, z + dz); if (y != null) m = Math.max(m, y - ly); } return m > -9 ? m : d; };   // (the panel's highest round the point: the gripper's width; with the car's parts)
          for (const sd of [1, -1]) { const i = sd > 0 ? 0 : 1, xs = sd > 0 ? xm : Math.max(xm, 0.45), sl = (x) => sd > 0 || Math.abs(x) > 0.75 ? [0, 0, -sd] : [x > 0 ? -0.6 : 0.6, 0, 0.8], P = [];
            const ov = [[0, -0.6, -sd * 0.8]];   // (from over it at a slant)
            for (const w of cv.wheels) if (w.sd === sd && (sd > 0 || w.front || h)) P.push(['wheel', [w.x, w.y + ly, w.outer + sd * 0.02], [0, 0, -sd], 'wrench', ov]);   // (the far rear wheel stands before the paint drums: worked with the car up)
            if (K.open) { if (sd > 0) { const z = sd * (hw - 0.15); P.push(['sill', [xm, top(xm, z, K.bottom + 0.2) + ly + 0.03, z], [0, -1, 0], 'scanner']); } }   // (an open car's: its side pod, from over it)
            else if (K.sideZ >= 0.5 * hw) P.push(['sill', [xs, K.bottom + 0.12 + ly, sd * (K.sideZ + 0.04)], sl(xs), sd < 0 && Math.abs(xs) <= 0.75 ? 'camera' : 'scanner', ov]);
            P.push(['door', [xs + 0.2, (K.bottom + K.top) / 2 + ly, sd * (hw + 0.03)], sl(xs + 0.2), 'gripper']);
            if (sd > 0 || hoodEnd - 0.1 >= 0.45) P.push(['mirror', [hoodEnd - 0.1, K.hoodY + 0.25 + ly, sd * (hw + 0.08)], [0, -0.3, -sd * 0.95], 'gripper', [[-0.55, -0.35, -sd * 0.76], [0.55, -0.35, -sd * 0.76], [0, -0.8, -sd * 0.6]]]);
            P.push(['bonnet', [K.hoodX, top(K.hoodX, sd * bz, K.hoodY) + ly + 0.03, sd * bz], [0, -1, 0], 'gripper', [[0, -0.7, -sd * 0.7]]], ['boot', [K.deckX + 0.1, top(K.deckX + 0.1, sd * bz, K.deckY) + ly + 0.03, sd * bz], [0, -1, 0], 'gripper', [[0, -0.7, -sd * 0.7], [0.6, -0.7, -sd * 0.4]]],
              ['front', [K.front + 0.03, K.frontLow + 0.2 + ly, sd * (hw - 0.12)], [-0.7, 0, -sd * 0.7], 'scanner', [[-0.5, -0.6, -sd * 0.6], [-1, 0, 0]]], ['rear', [K.rear - 0.03, K.bottom + 0.25 + ly, sd * (hw - 0.12)], [0.7, 0, -sd * 0.7], 'scanner', [[0.5, -0.6, -sd * 0.6]]],
              ['roof', [xs, K.top + ly + 0.02, sd * hw * 0.3], [0, -0.75, -sd * 0.66], 'scanner']);
            for (const [nm, tip, dir, tool, dirs] of P) { if (tip[1] > 2.9 || Math.abs(tip[0]) > 2.75 || (K.bottom > 0.75 && /^(boot|front|rear)$/.test(nm))) { out++; continue; }
              const q = D.robotPlan(i, tip, dir, { tool, dirs }); n++; if (q.miss > 0.005 || q.clear < 0) bad.push({ car: M.id, h, i, nm, x: +q.x.toFixed(2), miss: q.miss, clear: q.clear, tip: tip.map(v => +v.toFixed(2)) }); } } } }
      Garage3D.show(Garage3D.cur.spec); return { n, out, bad }; });
    T.check(`the robots reach round every car of the fleet, down and up 1 m on the lift (${reach.n} work points: wheels, sills, doors, mirrors, bonnet, boot, corners, roof; ${reach.out} out of their room), their arms clear of the lift's column, the stands and the body`, reach.n > 1200 && !reach.bad.length, JSON.stringify(reach.bad.slice(0, 12)));
  }

  // 8. the car panel: the game's categories as chips (the shown car's chosen), the cars of the chosen one in the strip in the game's order
  // (its car screen's: by category, the cheapest first), a picture of each; every category in turn: every car of the fleet, its picture
  {
    await page.evaluate(() => { __garage.panel = 'car'; });
    const cats = await page.evaluate(() => [...document.querySelectorAll('#g-cats .g-cat')].map(b => [b.dataset.cat, b.classList.contains('sel')]));
    const seen = [], pics = {};
    for (const [cat] of cats) {
      await page.evaluate((c) => document.querySelector('#g-cats [data-cat="' + c + '"]').click(), cat);
      let ids = [];
      for (let i = 0; i < 60; i++) { await page.evaluate(() => __garage.advance(0.05)); await page.waitForTimeout(150);
        ids = await page.evaluate(() => [...document.querySelectorAll('#g-cars .g-car')].map(b => [b.dataset.car, /^data:image\/png/.test((b.querySelector('.th img') || {}).src || '')]));
        if (ids.length && ids.every(q => q[1])) break; }
      for (const [id, ok] of ids) { seen.push(id); pics[id] = ok; } }
    const want = await page.evaluate(() => __garage.ORDER.slice()), n = Object.values(pics).filter(Boolean).length;
    T.check(`the car panel: the ${cats.length} categories as chips (the shown car's chosen), each one's cars in the game's order; every car of the fleet (${want.length}) with its picture`,
      cats.length >= 9 && cats.filter(c => c[1]).length === 1 && seen.join() === want.join() && n === want.length, JSON.stringify({ cats, n, missing: want.filter(id => !pics[id]), order: seen.join() === want.join() }));
    await page.evaluate(() => { __garage.panel = 'home'; });
  }

  // 8b. the wide vehicles' way out and in (the monster truck, the lorries; the PICO and the RALLY as before): each car swapped in, the
  // clock stepped a frame at a time (nothing drawn), every vertex of every car on the turntable (in its own frame, moved as it is)
  // clear of the boxes the robots keep clear of (the stands', the lift's column) unless that stand has stepped aside; the monster truck
  // crabs round the column and ORODJA (straight it would go into ORODJA), the tyre towers step aside on its way out and the near
  // robot's stand on its way in; the lorries' way out straight, the towers stepping aside (they pass them by a hand's breadth); the
  // narrow cars straight (no way of their own); every car on the table's middle after, everything back
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
        out.ways[id] = { inWay: sum(w1), prevOut: sum(w0), z: +Garage3D.cur.root.position.z.toFixed(3), car: Garage3D.cur.M.id, standBack: D.stands.stand.gone === 0 };
      }
      return out;
    }, ['goljat', 'kamen', 'titan', 'pico', 'rally']);
    const W = R.ways, g = W.goljat, ok = !Object.keys(R.hits).length && (R.straight['goljat:rack'] || 0) > 0.03 &&
      g.inWay && g.inWay.max > 0.2 && g.inWay.max < 0.35 && g.inWay.fade === 'stand' && W.kamen.prevOut && W.kamen.prevOut.max > 0.2 && W.kamen.prevOut.fade === 'towers' &&
      W.titan.prevOut && W.titan.prevOut.max === 0 && W.titan.prevOut.fade === 'towers' && W.pico.prevOut && W.pico.prevOut.max === 0 && W.pico.prevOut.fade === 'towers' &&
      !W.kamen.inWay && !W.titan.inWay && !W.pico.inWay && !W.rally.inWay && !W.rally.prevOut && Object.values(W).every(q => q.z === 0 && q.standBack);
    T.check(`the wide vehicles' way in and out (${R.frames} frames): no car through a stand or the lift's column (straight the monster truck would go ${R.straight['goljat:rack']} m into ORODJA); the monster truck crabs round them, the tyre towers step aside on its way out, the near stand on its way in; the lorries straight out, the towers aside; the narrow cars straight`,
      ok, JSON.stringify(R));
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
    const g = await page.evaluate(() => ({ car: __garage.S.car, shown: Garage3D.info.car, color: Garage3D.info.color, money: __garage.S.money, demo: !document.getElementById('g-demo').classList.contains('off') }));
    T.check('from the game\'s car screen: the car (over its place, clear of the panel, "Tapni avto za garažo") tapped opens the garage with it, the TITAN in green; the profile kept (the same credits), the MOCKUP bar there',
      tap.on && tap.over && tap.clear && tap.hint === 'Tapni avto za garažo' && tap.car === 'titan' && tap.color === 5 && /garaza\.html\?car=titan&color=2fa84f$/.test(url1) && g.car === 'titan' && g.shown === 'titan' && g.color === 0x2fa84f && g.money === before.money && g.demo,
      JSON.stringify({ tap, url1, g, before }));
    await Promise.all([page.waitForURL(/index\.html/, { timeout: 60000 }), page.click('.g-head .g-back')]);
    await page.waitForFunction(() => window.__game && __game.screen === 'car', null, { timeout: 180000 });
    await page.waitForTimeout(300);
    const b = await page.evaluate(() => ({ screen: __game.screen, car: Core.MODELS[__game.S.car].id, name: document.getElementById('car-name').textContent, url: location.search, on: document.getElementById('car-garage').classList.contains('on') }));
    T.check('the garage\'s back button: the game\'s car screen again, on the TITAN (the address plain again)', b.screen === 'car' && b.car === 'titan' && b.name === 'TITAN' && b.url === '' && b.on, JSON.stringify(b));
  }
  T.check('no page errors in the game and back', !errors.length, errors.slice(0, 5).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
}
T.done();
