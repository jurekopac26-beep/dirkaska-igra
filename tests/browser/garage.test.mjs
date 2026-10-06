// The garage (garaza.html): the page opens with the workshop and the car, the camera (left and right only, always as far; what is
// between it and the car steps aside), the demo profiles, buying a car and the credits, a new car
// driving in, every upgrade with its parts on the car, the service (dirt and scratches gone, the engine), a new colour, the English page,
// every car of the game on the turntable with all its parts, the pictures of the cars, the profile kept after a reload; the single-post
// lift behind the car (the tyres and the service's engine up on it, the turntable never rising nor turning); the permanent fixtures
// (two industrial robots on floor rails, the tool stand ORODJA with its seven tools, the near robot's stand with six; the nano chamber,
// the drying column, the paint drums, the tyre towers, the parts shelf, the rim stand, the kit stand) parked at rest, bolted down, out of
// the cars' lane, their moves through the shows' queue (a tool taken and put back, the chamber down and up, the column up and down), the
// robots' reach round every car, the plates in English. The animations run on a clock the test steps itself (software WebGL is slow).
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
    T.check('another car: the PICO drives out, the KAZE RS drives in and stops on the table', u.info.car === 'kaze' && u.name === 'KAZE RS' && Math.abs(u.info.ang) < 0.01 && /Kupi · 30\.000 CR/.test(u.go), JSON.stringify({ car: u.info.car, go: u.go }));
    T.check('a car asked for while a robot works at the wheel with the wrench and the drying column stands up hot in the lane: the column goes down and the robot puts the wrench back and parks first (when the old car starts off: everything parked, nothing in the lane), then the swap',
      first.parked && first.tool === 'none' && first.nest === 'in' && first.lane >= 1.3 && first.dryer === 0 && !first.drawn && first.chamber === 0 && fx.parked && fx.lane >= 1.3, JSON.stringify({ first, parked: fx.parked, lane: fx.lane }));
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
    const u = await ui(), L = await page.evaluate(() => Garage3D._dbg.lift);
    T.check('a full service: clean, no scratches, condition 100 %, paid', u0.info.dirt > 0.3 && u.info.dirt === 0 && u.info.scr === 0 && u.S.cars.rally.cond.engine === 1 && u.S.money < u0.S.money && u.info.lift === 0, JSON.stringify({ before: u0.info, after: u.info }));
    T.check('the service: the lift raises the car for the engine (>= 1 m) and lowers it, its arms stowed; the table never rises nor turns', r.lift >= 1.0 && r.table === 0 && r.ang === 0 && u.info.lift === 0 && L.arms === 0 && !L.on, JSON.stringify({ r, arms: L.arms }));
    await page.evaluate(() => __garage.doPaint(5, false)); await run();
    const u2 = await ui();
    T.check('a new colour (green, no stripes): the car painted, 2.000 CR taken', u2.info.color === 0x2fa84f && u2.info.stripe === false && u.S.money - u2.S.money === 2000 && u2.info.car === 'rally', JSON.stringify(u2.info));
    const sh = await page.evaluate(() => (__garage.advance(0.1), Garage3D._dbg.shelf)), gr = [0x2f / 255, 0xa8 / 255, 0x4f / 255];
    T.check('the parts shelf\'s parts in the car\'s colour follow the car on the table (green now)', sh.col === 0x2fa84f && sh.c.every((q, j) => Math.abs(q - gr[j]) < 0.01), JSON.stringify(sh));
  }

  // 6. English
  {
    await page.evaluate(() => __garage.onAct('lang'));
    const t = await page.evaluate(() => ({ h: document.querySelector('.g-title h1').textContent, go: document.getElementById('g-go').textContent, tile: document.querySelector('.g-tile small').textContent, html: document.documentElement.lang, plate: (__garage.advance(0.1), Garage3D._dbg.fx.rack.plate), plates: Garage3D._dbg.plates }));
    T.check('English: GARAGE, Select, the tiles in English, the plates TOOLS, PARTS, RIMS, AERO KITS', t.h === 'GARAGE' && t.go === 'Select' && t.tile === 'Car' && t.html === 'en' && t.plate === 'TOOLS' && t.plates.join() === 'TOOLS,PARTS,RIMS,AERO KITS', JSON.stringify(t));
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
    // the robots' reach on every car (down on the table and up 1 m on the lift): each from its side (the near one the near side, the far
    // one the far side; its rear wheel, before the paint drums, with the car up) puts its tool on the wheels' hubs (the wrench), the sill
    // and the door (the far side's off the lift's column, 45 cm right of it at the least, the tool in from that side; the sill there at a
    // slant: the camera, a bar cannot lie along it; an open car's sill its side pod from over it, the near side's only), the mirror (from
    // the side, else at a slant or from over it), its half of the bonnet and of the boot (the gripper from over them, else at a slant:
    // their tops as the robots see the car, its wing over a boot with it), the front and the rear corner, the roof from the side (off the
    // column too); the planned pose in reach and its arm clear (0 or more) of the column, the stands and the body, backed off its way in too
    const reach = await page.evaluate(() => { const D = Garage3D._dbg, bad = []; let n = 0;
      for (const M of Core.MODELS) { Garage3D.show({ M, color: 0xd81f2a, stripe: true, upg: { motor: 3, gume: 3, zavore: 3, aero: 3 }, cond: { clean: 1, body: 1, engine: 1 } });
        for (const h of [0, 1.0]) { if (h) D.raise(h); const cv = Garage3D.cur, K = cv.kit, ly = cv.v.grp.position.y, FP = D.carProbe(cv); const xm = (K.wfx + K.wrx) / 2, hoodEnd = 2 * (K.hoodX + 0.04) - K.front, hw = K.hw, bz = K.open ? K.sideZ * 0.5 : hw * 0.35;
          const top = (x, z, d) => { let m = -9; for (const dx of [-0.12, 0, 0.12]) for (const dz of [-0.12, 0, 0.12]) { const y = FP.top(x + dx, z + dz); if (y != null) m = Math.max(m, y - ly); } return m > -9 ? m : d; };   // (the panel's highest round the point: the gripper's width; with the car's parts)
          for (const sd of [1, -1]) { const i = sd > 0 ? 0 : 1, xs = sd > 0 ? xm : Math.max(xm, 0.45), sl = (x) => sd > 0 || Math.abs(x) > 0.75 ? [0, 0, -sd] : [x > 0 ? -0.6 : 0.6, 0, 0.8], P = [];
            for (const w of cv.wheels) if (w.sd === sd && (sd > 0 || w.front || h)) P.push(['wheel', [w.x, w.y + ly, w.outer + sd * 0.02], [0, 0, -sd], 'wrench']);   // (the far rear wheel stands before the paint drums: worked with the car up)
            if (K.open) { if (sd > 0) { const z = sd * (hw - 0.15); P.push(['sill', [xm, top(xm, z, K.bottom + 0.2) + ly + 0.03, z], [0, -1, 0], 'scanner']); } }   // (an open car's: its side pod, from over it)
            else P.push(['sill', [xs, K.bottom + 0.12 + ly, sd * (K.sideZ + 0.04)], sl(xs), sd < 0 && Math.abs(xs) <= 0.75 ? 'camera' : 'scanner']);
            P.push(['door', [xs + 0.2, (K.bottom + K.top) / 2 + ly, sd * (hw + 0.03)], sl(xs + 0.2), 'gripper'], ['mirror', [hoodEnd - 0.1, K.hoodY + 0.25 + ly, sd * (hw + 0.08)], [0, -0.3, -sd * 0.95], 'gripper', [[-0.55, -0.35, -sd * 0.76], [0.55, -0.35, -sd * 0.76], [0, -0.8, -sd * 0.6]]],
              ['bonnet', [K.hoodX, top(K.hoodX, sd * bz, K.hoodY) + ly + 0.03, sd * bz], [0, -1, 0], 'gripper', [[0, -0.7, -sd * 0.7]]], ['boot', [K.deckX + 0.1, top(K.deckX + 0.1, sd * bz, K.deckY) + ly + 0.03, sd * bz], [0, -1, 0], 'gripper', [[0, -0.7, -sd * 0.7]]],
              ['front', [K.front + 0.03, K.frontLow + 0.2 + ly, sd * (hw - 0.12)], [-0.7, 0, -sd * 0.7], 'scanner'], ['rear', [K.rear - 0.03, K.bottom + 0.25 + ly, sd * (hw - 0.12)], [0.7, 0, -sd * 0.7], 'scanner'],
              ['roof', [xs, K.top + ly + 0.02, sd * hw * 0.3], [0, -0.75, -sd * 0.66], 'scanner']);
            for (const [nm, tip, dir, tool, dirs] of P) { const q = D.robotPlan(i, tip, dir, { tool, dirs }); n++; if (q.miss > 0.005 || q.clear < 0) bad.push({ car: M.id, h, i, nm, x: +q.x.toFixed(2), miss: q.miss, clear: q.clear }); } } } }
      Garage3D.show(Garage3D.cur.spec); return { n, bad }; });
    T.check(`the robots reach round every car, down and up 1 m on the lift (${reach.n} work points: wheels, sills, doors, mirrors, bonnet, boot, corners, roof), their arms clear of the lift's column, the stands and the body`, reach.n > 300 && !reach.bad.length, JSON.stringify(reach.bad.slice(0, 8)));
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
