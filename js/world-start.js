/* THE START OF AN OPEN ROAD: a hill climb's start as it looks at a real one. The user, 14. 11. 2026 at 16.33 (A2): a start gantry with no text (a grey
   truss over the road, a dark box of five lights over its middle at the chequered line), no toll canopy; a timekeepers' hut (white, a red roof) and a
   small booth before the line; a marshal with a flag; along the grid the teams' vans, trailers and cars with people; flag poles on both sides. The same
   day: the grass trampled round them (one layer, soft edges). About 23.20: mechanics, timekeepers, a photographer, a few fans behind a tape; a team
   tent, tyres, a tool cart, a car on a jack, cones, chairs, a cooler, a generator.
   Two scenes of the people kit on each real open road (CFG; never on a test or pending one): 'start' (the gantry, whose five lamps are the world's
   dyn.lights, recoloured in the scene's unlit mesh; the hut, the booth, the timekeepers, the marshal, the photographer, cones, poles, a tape and the
   fans) and 'startPark' (the teams: before the line, or after it where the verge before it is narrow). A thing is placed only where it fits (beyond
   the barrier, on even ground, clear of side roads and of the others); what does not fit is left out (o.startStats). Tianmen: the reduced start, with
   no paddock. Chapman: the hut and the teams on one side before the line (a side road just past it, a rock wall across), no fans.
   Harju: the reduced start on the right (houses about 2.5 m beyond the barrier; on the left the same stage's other carriageway), kept out of the
   buildings and with no trampled grass on the tarmac (o.startAvoid, o.startPaved).
   The trampled grass: one mesh (startWorn, one draw call), slush in winter. All generic: no text, logos, brands or numbers; the exception from
   fewFans is for the start only.
   The worlds ask World.startOwn(def) whether to leave out their own start and World.startGround(T) for the circles their posts keep out of.
   Uses no THREE, World.api or document at load (the scene test loads the kit in a bare context). */
(function () {
  'use strict';
  const KIT = typeof World !== 'undefined' && World.peopleKit; if (!KIT) return;
  const { S, L, SITES, pick, box, cyl, grp, bar } = KIT, { SHIRT, PANTS } = KIT.pal;   // (L: the kit's builders; C.L: a scene's sink)
  const DARK = 0x15171c, STEEL = 0x9aa0a8, LAMP_OFF = 0x2a0606, WHITE = 0xf2f2ee, ROOF = 0xb3322a, GREY = 0x8d939b, GLASS = 0x2a3440, TYRE = 0x16171a;
  const TENT = [0xf2f2f2, 0x1f4aa8, 0xd8262a, 0x2f9a48, 0x2a2c31], CARS = [0xd8262a, 0x1f4aa8, 0xf2f2f2, 0x15171c, 0xe0a21a, 0x2f9a48], CHAIR = [0x1f4aa8, 0x15171c, 0xd8262a, 0x2f9a48];
  const TEAMS = [[0xd8262a, 0x15171c], [0x1f4aa8, 0xf2f2f2], [0x2f9a48, 0x15171c], [0xe0a21a, 0x2a2c31], [0x15171c, 0xd8262a]];
  const MAR = { shirt: 0x262a33, pants: 0x2f3f63, vest: 0xf07a1c, stripes: 0xd9dde2, long: true }, TIME = { shirt: 0xf2f2f2, pants: 0x1d1f25, hat: 'cap', hatCol: 0x1f2c48 },
    PHOTO = { hat: 'cap', hatCol: 0x15171c, shirt: 0x2a2c31, pants: 0x3a4a3a, vest: 0xd9c35a, stripes: 0x8a7a3a, long: true };
  const team = (c) => ({ shirt: c, pants: c, long: true, belt: 0xf2f2f2, hat: 'cap', hatCol: 0x15171c, gloves: 0x15171c }), eng = (c) => ({ shirt: 0xf2f2f2, pants: 0x1f2c48, long: true, hat: 'cap', hatCol: c });
  const LS = 0.34, LG = 0.46, vert = (a) => { a.vert = true; return a; };
  const site = (id, list) => { (SITES[id] || (SITES[id] = [])).push(...list); };
  let TM = null, SLUSH = null, plan = null;
  const tm = () => TM || (TM = { M: new THREE.Matrix4(), P: new THREE.Vector3(), Q: new THREE.Quaternion(), E: new THREE.Euler(), S1: new THREE.Vector3(1, 1, 1) });
  const lamC = new Map(), lamOf = (c) => { let m = lamC.get(c); if (!m) lamC.set(c, m = new THREE.MeshLambertMaterial({ color: c })); return m; };
  const lamb = (o) => { o.traverse(m => { if (m.material && m.material.isMeshBasicMaterial) m.material = lamOf(m.material.color.getHex()); }); return o; };   // (no unlit mesh, no draw call more)
  const fresh = (o) => ({ used: [], worn: [], gH: o && o.groundH, avoid: (o && o.startAvoid) || null, paved: (o && o.startPaved) || null, lamps: null, placed: 0, skipped: 0 });   // (avoid, paved: a world's
  //  buildings and its paved ground (o.startAvoid, o.startPaved), where it has them: nothing stands in a building, no trampled grass on tarmac)

  // ---- where (d: metres from the line along the road, + ahead; sd: the side, + right; bb: metres beyond the barrier)
  function at(T, d, sd, bb) { const s = Math.max(0, Math.min(T.len - T.ds, T.startS + d)), i = T.idx(s), e = s - i * T.ds, bar = sd > 0 ? T.br[i] : T.bl[i], nx = T.nx[i] * sd, nz = T.nz[i] * sd;
    return { x: T.px[i] + T.tx[i] * e + nx * (bar + bb), z: T.pz[i] + T.tz[i] * e + nz * (bar + bb), tx: T.tx[i], tz: T.tz[i], nx, nz, bar, i, s, ok: T.startS + d >= 2 && T.startS + d <= T.len - 2 }; }
  function ctr(T, d) { const s = Math.max(0, Math.min(T.len - T.ds, T.startS + d)), i = T.idx(s), e = s - i * T.ds;
    return { x: T.px[i] + T.tx[i] * e, z: T.pz[i] + T.tz[i] * e, y: T.hy ? T.hy[i] : 0, tx: T.tx[i], tz: T.tz[i], nx: T.nx[i], nz: T.nz[i], i }; }
  const toF = (F, x, z) => { const dx = x - F.px, dz = z - F.pz; return [dx * F.tx + dz * F.tz, dx * F.nx + dz * F.nz - F.bar]; };
  const dirF = (F, wx, wz) => [wx * F.tx + wz * F.tz, wx * F.nx + wz * F.nz];
  const putZ = (C, F, obj, x, z, wx, wz, sink) => { const [a, b] = toF(F, x, z); return C.prop(obj, a, b, dirF(F, wx, wz), null, sink); };   // (its local +z toward (wx, wz))
  function worldGroup(C, F, x0, z0, fill) { const { M, P, Q, E, S1 } = tm(), [a0, b0] = toF(F, x0, z0), [x, z] = F.w(a0, b0), inner = new THREE.Group(), g = new THREE.Group(); g.add(inner);
    M.compose(P.set(x, F.y(a0, b0), z), Q.setFromEuler(E.set(0, C.yawOf(null), 0)), S1); inner.matrixAutoUpdate = false; inner.matrix.copy(M).invert();
    fill(inner); C.prop(g, a0, b0, null); return g; }   // (the children of inner are in world coordinates)
  const inRect = (r, px, pz) => { const dx = px - r.x, dz = pz - r.z; return Math.abs(dx * r.ux + dz * r.uz) < r.hl && Math.abs(-dx * r.uz + dz * r.ux) < r.hw; };
  const segDist = (px, pz, ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / L2)); return Math.hypot(px - ax - vx * t, pz - az - vz * t); };
  const worn = (pl, p, len, hw, cell, ux, uz) => pl.worn.push({ x: p.x, z: p.z, ux: ux != null ? ux : p.tx, uz: uz != null ? uz : p.tz, len, hw, cell });
  function onStub(T, px, pz) { for (const st of T.stubs || []) { const b = st.bb, m = (st.hw || 3) + 2; if (b && (px < b[0] - m || px > b[2] + m || pz < b[1] - m || pz > b[3] + m)) continue;
      for (let k = 0; k + 1 < st.n; k++) if (segDist(px, pz, st.x[k], st.z[k], st.x[k + 1], st.z[k + 1]) - (st.hw || 3) < 2) return true; } return false; }   // (within 2 m of a side road)
  function fits(pl, T, x, z, ux, uz, hl, hw, spread) { const A = World.api, vx = -uz, vz = ux;
    const pts = [[x, z], [x + ux * hl + vx * hw, z + uz * hl + vz * hw], [x + ux * hl - vx * hw, z + uz * hl - vz * hw], [x - ux * hl + vx * hw, z - uz * hl + vz * hw], [x - ux * hl - vx * hw, z - uz * hl - vz * hw]]; let lo = Infinity, hi = -Infinity;
    for (const [px, pz] of pts) { if (!(A.clearance(px, pz) >= 0.4) || (pl.avoid && pl.avoid(px, pz))) return false; const h = pl.gH(px, pz); if (!Number.isFinite(h)) return false; lo = Math.min(lo, h); hi = Math.max(hi, h);
      if (onStub(T, px, pz)) return false; for (const r of pl.used) if (inRect(r, px, pz)) return false; }
    const me = { x, z, ux, uz, hl, hw }; for (const r of pl.used) if (inRect(me, r.x, r.z)) return false;
    if (hi - lo > spread) return false; const nr = A.nearest(x, z); if (nr.i >= 0 && T.hy && Math.abs(pl.gH(x, z) - T.hy[nr.i]) > 1.5) return false;
    pl.used.push(me); return true; }
  function place(C, F, pl, obj, p, zdir, hx, hz, spread, sink) {   // (hx, hz: its half sizes along its local x and z)
    if (!p.ok || !fits(pl, World.api.T, p.x, p.z, zdir[0], zdir[1], hz, hx, spread)) { pl.skipped++; return null; }
    pl.placed++; return putZ(C, F, lamb(obj), p.x, p.z, zdir[0], zdir[1], sink); }
  function who(C, F, pl, look, p, face, act, opt) { opt = opt || {};
    if (!p.ok || !(World.api.clearance(p.x, p.z) >= 0.4) || onStub(World.api.T, p.x, p.z) || (pl.avoid && pl.avoid(p.x, p.z))) { pl.skipped++; return null; }
    const [a, b] = toF(F, p.x, p.z); if (b < -1.5 || Math.abs(a) > 23 || (!opt.inside && pl.used.some(r => inRect(r, p.x, p.z)))) { pl.skipped++; return null; }
    const A = Object.assign({ a, b, face: dirF(F, face[0], face[1]) }, act); let st;
    if (opt.fan) { const [fa, fb] = toF(F, opt.fan.x, opt.fan.z); st = { act: A, fence: { a: fa, b: fb, pose: 'cheer', t: 0.8 }, run: { f: 0.55 } }; }
    else st = { act: A, bliza: Object.assign({}, opt.bliza, { look: 'car' }), run: false, fence: Object.assign({}, A, opt.fence || opt.bliza, { look: 'car' }) };
    pl.placed++; return C.man(look, st); }

  // ---- things
  const wheel = (r, w, x, y, z) => grp(cyl(r, r, w, 9, TYRE, x, y, z, { rx: Math.PI / 2 }), cyl(r * 0.55, r * 0.55, w + 0.02, 6, 0xb9bec6, x, y, z, { rx: Math.PI / 2 }));
  function tape(Ln) { const g = new THREE.Group(), n = Math.max(2, Math.round(Ln / 3));
    for (let k = 0; k <= n; k++) g.add(cyl(0.025, 0.025, 1.0, 4, 0xdedede, -Ln / 2 + k * Ln / n, 0.5, 0));
    for (let k = 0; k < Math.round(Ln); k++) g.add(box(1.0, 0.06, 0.01, k % 2 ? 0xf2f2f2 : 0xd8262a, -Ln / 2 + 0.5 + k, 0.92, 0)); return g; }
  const WHEELS = [[1.35, 0.8], [-1.3, 0.8], [1.35, -0.8], [-1.3, -0.8]];
  function raceCar(col, skip) {   // a hill-climb car along x (its front +x): no numbers, no names
    const g = grp(box(3.9, 0.45, 1.75, col, 0, 0.5, 0), box(0.9, 0.22, 1.6, col, 2.25, 0.4, 0, { rz: -0.25 }), box(1.6, 0.5, 1.4, GLASS, -0.2, 0.95, 0), box(1.5, 0.06, 1.42, col, -0.25, 1.22, 0),
      box(0.06, 0.4, 0.06, DARK, -1.75, 0.95, 0.5), box(0.06, 0.4, 0.06, DARK, -1.75, 0.95, -0.5), box(0.5, 0.05, 1.8, DARK, -1.8, 1.17, 0));
    WHEELS.forEach(([x, z], k) => { if (k !== skip) g.add(wheel(0.33, 0.26, x, 0.33, z)); }); return g; }
  function carOnJack(col, sx, sz) {   // the wheel at (sx, sz) off and lying beside it; that side lifted on a jack
    const k = WHEELS.findIndex(([x, z]) => Math.sign(x) === sx && Math.sign(z) === sz), [wx, wz] = WHEELS[k], car = raceCar(col, k);
    car.position.y = 0.06; car.rotation.x = -0.12 * sz;
    return grp(car, box(0.5, 0.18, 0.25, 0xd8262a, wx * 0.8, 0.09, wz * 0.9), box(0.12, 0.25, 0.12, 0xb9bec6, wx * 0.8, 0.3, wz * 0.9),
      cyl(0.33, 0.33, 0.26, 9, TYRE, wx + 0.95 * sx, 0.13, wz), cyl(0.18, 0.18, 0.28, 6, 0xb9bec6, wx + 0.95 * sx, 0.13, wz)); }
  function flatbed(col) { const g = grp(box(4.5, 0.15, 2.0, 0x5a5f66, 0, 0.55, 0), wheel(0.3, 0.2, -0.3, 0.3, 0.9), wheel(0.3, 0.2, -0.3, 0.3, -0.9),
      bar([2.25, 0.5, 0.5], [3.2, 0.45, 0], 0.06, DARK), bar([2.25, 0.5, -0.5], [3.2, 0.45, 0], 0.06, DARK)); const rc = raceCar(col); rc.position.y = 0.63; g.add(rc); return g; }
  function gantry(g, T, pl) {   // in world coordinates: two truss legs beyond the barriers, a truss beam, the dark box and its five lamps (unlit: the scene's U)
    const c0 = ctr(T, 0), Lp = at(T, 0, -1, 0.4), Rp = at(T, 0, 1, 0.4), beamY = c0.y + 6.4, h = 0.2, tx = c0.tx, tz = c0.tz, nx = c0.nx, nz = c0.nz;
    const gy = (x, z) => { const v = pl.gH(x, z); return Number.isFinite(v) ? v : c0.y; };
    for (const p of [Lp, Rp]) { const y0 = gy(p.x, p.z) - 0.3, y1 = beamY + h, C4 = (u, v, y) => [p.x + tx * h * u + nx * h * v, y, p.z + tz * h * u + nz * h * v];
      for (const [u, v] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) g.add(bar(C4(u, v, y0), C4(u, v, y1), 0.05, STEEL));
      const nb = Math.max(2, Math.round((y1 - y0 - 0.3) / 1.2)), dy = (y1 - y0 - 0.3) / nb;
      for (const u of [1, -1]) for (let k = 0; k < nb; k++) { const v = k % 2 ? 1 : -1; g.add(bar(C4(u, v, y0 + 0.3 + k * dy), C4(u, -v, y0 + 0.3 + (k + 1) * dy), 0.035, STEEL)); }
      g.add(box(0.7, 0.05, 0.7, GREY, p.x, y0 + 0.32, p.z, { ry: Math.atan2(-tz, tx) })); }
    const span = Math.hypot(Rp.x - Lp.x, Rp.z - Lp.z), nb = Math.max(4, Math.round(span / 1.6)), B = (f, u, v) => [Lp.x + (Rp.x - Lp.x) * f + tx * h * u, beamY + h * v, Lp.z + (Rp.z - Lp.z) * f + tz * h * u];
    for (const u of [1, -1]) for (const v of [1, -1]) g.add(bar(B(0, u, v), B(1, u, v), 0.05, STEEL));
    for (const u of [1, -1]) for (let k = 0; k < nb; k++) { const v = k % 2 ? 1 : -1; g.add(bar(B(k / nb, u, v), B((k + 1) / nb, u, -v), 0.035, STEEL)); }
    const yb = beamY - 0.96; g.add(box(5 * LG + 0.3, 0.62, 0.3, DARK, c0.x, yb, c0.z, { ry: Math.atan2(-nz, nx) }));
    for (const s of [-0.9, 0.9]) g.add(bar([c0.x + nx * s, beamY - h, c0.z + nz * s], [c0.x + nx * s, yb + 0.31, c0.z + nz * s], 0.05, STEEL));
    const ryL = Math.atan2(-tx, -tz);   // (facing the car that comes up to the line; index 0 at its left)
    for (let k = 0; k < 5; k++) { const o = (k - 2) * LG; g.add(box(LS, LS, 0.05, LAMP_OFF, c0.x + nx * o - tx * 0.18, yb, c0.z + nz * o - tz * 0.18, { basic: true, ry: ryL })); } }

  // ---- the scenes
  S.start = { seed: 211, r: 32, build(C, F, O) {
    const T = World.api.T, c = O.cfg || {}, t = F.side, pl = plan || fresh(null), road = (q) => [-q.nx, -q.nz];
    if (!pl.gH) pl.gH = (x, z) => { const [a, b] = toF(F, x, z); return F.y(a, b); };
    C.cb = -F.bar; C.clear = []; const clr = (x, z, r) => { const [a, b] = toF(F, x, z); C.clear.push([a, b, r]); };
    const c0 = ctr(T, 0), u0 = C.U.P.length / 3; worldGroup(C, F, c0.x, c0.z, (g) => gantry(g, T, pl));
    const per = (C.U.P.length / 3 - u0) / 5; pl.lamps = per >= 1 && per % 1 === 0 ? { u0, per } : null;
    for (const sd of [-1, 1]) { const p = at(T, 0, sd, 0.4); pl.used.push({ x: p.x, z: p.z, ux: p.tx, uz: p.tz, hl: 0.6, hw: 0.6 }); clr(p.x, p.z, 3); }
    let p = at(T, -8.5, t, 3.3);
    const hut = place(C, F, pl, grp(box(3.2, 2.4, 2.6, WHITE, 0, 1.2, 0), box(1.9, 0.7, 0.04, GLASS, -0.55, 1.55, 1.31), box(0.9, 1.9, 0.04, GREY, 1.0, 0.95, 1.31),
      box(3.5, 0.1, 1.6, ROOF, 0, 2.55, 0.72, { rx: 0.18 }), box(3.5, 0.1, 1.6, ROOF, 0, 2.55, -0.72, { rx: -0.18 })), p, road(p), 1.75, 1.4, 0.7);
    if (hut) { clr(p.x, p.z, 6); worn(pl, at(T, -8.5, t, 1.3), 5, 2, 0); }
    p = at(T, -4.5, t, 1.4);
    const booth = place(C, F, pl, grp(box(1.4, 2.2, 1.4, GREY, 0, 1.1, 0), box(1.42, 0.5, 1.42, GLASS, 0, 1.55, 0), box(1.6, 0.08, 1.6, WHITE, 0, 2.24, 0)), p, road(p), 0.75, 0.75, 0.7);
    if (booth) clr(p.x, p.z, 4);
    if (hut || booth) { const clip = [['clip', 0]], tk = (d, bb, act, bliza, fence) => { const q = at(T, d, t, bb); return who(C, F, pl, TIME, q, road(q), act, { bliza, fence }); };
      tk(-8, 0.9, { pose: 'sodniki_write', hold: clip }, { pose: 'stand' }, { pose: 'sodniki_write', hold: clip });
      tk(-5.8, 0.5, { pose: 'sodniki_time', hold: [['sodniki_watch', 1], ['clip', 0]] }, { pose: 'sodniki_time', hold: [['sodniki_watch', 1], ['clip', 0]] });
      tk(-10.5, 1.0, { pose: 'arms' }, { pose: 'sodniki_bino', head: [['sodniki_bino']] });
      tk(-3, 0.8, { pose: 'talk', hold: [['radio', 1]] }, { pose: 'radio' }, { pose: 'radio', hold: [['radio', 1], ['clip', 0]] }); }
    const flag = [['mflag', 1, { c: 0x2f9a48 }]];
    p = at(T, 1.5, t, 0.5); if (who(C, F, pl, MAR, p, road(p), { pose: 'flagHold', hold: flag }, { bliza: { pose: 'flagWave', hold: flag } })) worn(pl, at(T, 1.5, t, 0.9), 3, 1.5, 0);
    p = at(T, 7, t, 0.5); who(C, F, pl, PHOTO, p, [-p.tx - 0.5 * p.nx, -p.tz - 0.5 * p.nz], { pose: 'crouchCam', head: [['camera']] }, { bliza: { pose: 'crouchCam', head: [['camera']] } });
    for (const [d, sd] of [[-3, t], [3, t], [-2, -t], [2, -t]]) { const q = at(T, d, sd, 0.7); place(C, F, pl, L.cone(), q, road(q), 0.2, 0.2, 1.0); }
    if (c.poles !== false) for (const sd of [-1, 1]) { const q = at(T, 4, sd, 1.0); place(C, F, pl, L.flagPole(O.flag, 6), q, [-q.nz, q.nx], 0.15, 0.15, 1.0); }
    if (c.fans) { const fd = c.after && c.p === c.t ? -18 : 15; p = at(T, fd, t, 1.0);
      if (place(C, F, pl, tape(10), p, [-p.tz, p.tx], 5, 0.3, 1.5)) { const POSE = [{ pose: 'stand' }, { pose: 'phoneUp', hold: [['phone', 1]] }, { pose: 'arms' }, { pose: 'wave' }];
        [-3, -1, 1, 3].forEach((dd, k) => { const q = at(T, fd + dd, t, 2.5 + 1.5 * KIT.rnd());
          who(C, F, pl, { shirt: pick(SHIRT), pants: pick(PANTS), hat: pick(['beanie', 'cap']), hatCol: pick(SHIRT) }, q, road(q), POSE[k], { fan: at(T, fd + dd, t, 1.5) }); });
        const q = at(T, fd, t, 3.0); worn(pl, q, 10, 1.5, 1); clr(q.x, q.z, 8); } }
  } };
  S.startPark = { seed: 223, r: 30, build(C, F, O) {
    const T = World.api.T, c = O.cfg || {}, sd = F.side, pl = plan || fresh(null);
    if (!pl.gH) pl.gH = (x, z) => { const [a, b] = toF(F, x, z); return F.y(a, b); };
    C.cb = 6; C.clear = []; const clr = (x, z, r) => { const [a, b] = toF(F, x, z); C.clear.push([a, b, r]); };
    const D = (d) => c.after ? 4 - d : d + (c.off || 0), P = (d, bb) => at(T, D(d), sd, bb), veh = (q) => [-q.tz, q.tx], road = (q) => [-q.nx, -q.nz], out = (q) => [q.nx, q.nz];
    const tc = pick(TEAMS), crew = team(tc[0]);
    let p = P(-4.5, 2.8), seat = null;
    if (place(C, F, pl, L.gazebo(pick(TENT)), p, road(p), 1.6, 1.6, 0.7)) { let q = P(-4.5, 3.6); putZ(C, F, lamb(L.table(1.2, 0.7)), q.x, q.z, ...road(q));
      for (const d of [-5.2, -3.8]) { q = P(d, 2.6); putZ(C, F, lamb(L.chair(pick(CHAIR))), q.x, q.z, ...road(q)); seat = seat || q; }
      q = P(-3.4, 3.7); putZ(C, F, lamb(L.cooler(pick(CHAIR))), q.x, q.z, ...road(q)); }
    p = P(-12, 2.4); const sz = (-p.tz) * (-p.nx) + p.tx * (-p.nz) > 0 ? 1 : -1, sx = Math.sign(D(-13.4) - D(-12)) || -1;
    const jack = place(C, F, pl, carOnJack(tc[0], sx, sz), p, veh(p), 2.4, 1.0, 0.7);
    p = P(-9, 4.2); const tyres = place(C, F, pl, L.tyreStack(3), p, road(p), 0.45, 0.45, 1.0);
    p = P(-15.5, 3.2); place(C, F, pl, L.toolChest(tc[0]), p, road(p), 0.5, 0.35, 1.0);
    p = P(-15.5, 1.6); place(C, F, pl, L.trolley(), p, veh(p), 0.6, 0.35, 1.0);
    p = P(-21.5, 3.0); if (place(C, F, pl, L.van(tc[0], tc[1]), p, veh(p), 2.3, 1.0, 0.7)) { const q = P(-21.5, 0); worn(pl, q, 4.5, 1.2, 2, q.nx, q.nz); }
    p = P(-27.5, 3.0); if (place(C, F, pl, flatbed(pick(CARS)), p, veh(p), 2.8, 1.05, 0.7)) { const q = P(-27.5, 0); worn(pl, q, 4.5, 1.2, 3, q.nx, q.nz); }
    p = P(-34, 3.0); place(C, F, pl, L.car(pick(CARS)), p, veh(p), 2.2, 1.0, 0.7);
    p = P(-31, 1.3); place(C, F, pl, L.generator(), p, road(p), 0.5, 0.4, 1.0);
    if (jack) { let q = P(-13.4, 0.9); if (who(C, F, pl, crew, q, out(q), { pose: 'kneel', hold: [['wrench', 1]] }, { bliza: { pose: 'kneel', hold: [['wrench', 1]] } })) worn(pl, q, 3, 1.5, 0);
      q = P(-8.9, 2.4); const s = Math.sign(D(-12) - D(-8.9)); who(C, F, pl, crew, q, [s * q.tx, s * q.tz], { pose: 'fixHood' }, { bliza: { pose: 'stand' } }); }
    p = P(-17.5, 1.0); who(C, F, pl, eng(tc[0]), p, road(p), { pose: 'talk', hold: [['radio', 1]] }, { bliza: { pose: 'radio' } });
    if (tyres) { const q = P(-9, 3.4); who(C, F, pl, crew, q, out(q), { pose: 'squat' }, { bliza: { pose: 'stand' } }); }
    if (seat) who(C, F, pl, team(tc[1]), seat, road(seat), { pose: 'sit' }, { bliza: { pose: 'sit' }, inside: true });
    [-36, -28, -20, -12, -5].forEach((d, k) => worn(pl, P(d, 2.8), 8, 2.5, k % 2));
    for (let d = -40; d <= 0; d += 8) { const q = P(d, 3); clr(q.x, q.z, 8); }
  } };

  // ---- where it stands: t the side of the hut, p of the teams (0: none), after: the teams past the line (the verge before it is narrow);
  //      m: the start scene's place (metres from the line), off: the teams moved down the road (behind the hut, on its side)
  const CFG = { pikes: { t: -1, p: 1, fans: true }, pikesg: { t: -1, p: 1, fans: true }, chapman: { t: 1, p: 1, m: -5, off: -9, fans: false },
    balea: { t: -1, p: -1, after: true, fans: true, opt: { flag: vert([0x002b7f, 0xfcd116, 0xce1126]) } }, rastro: { t: -1, p: -1, after: true, fans: true },
    tianmen: { t: 1, p: 0, fans: false, reduced: true }, caracoles: { t: -1, p: 1, fans: true }, katu: { t: -1, p: 1, fans: true }, harju: { t: 1, p: 0, fans: false, reduced: true } };
  for (const id in CFG) { const c = CFG[id], opt = Object.assign({ cfg: c }, c.opt); site(id, [['start', c.m || 0, c.t, opt]].concat(c.p ? [['startPark', c.after ? 21 : -20 + (c.off || 0), c.p, opt]] : [])); }
  KIT.START_SCENES = new Set(['start', 'startPark']);
  World.startOwn = (def) => !!(def && !def.test && !def.pending && CFG[def.id]);
  World.startGround = function (T) { const def = T && T.def, c = def && World.startOwn(def) ? CFG[def.id] : null; if (!c) return [];
    const out = [], push = (d, sd, bb, r) => { const p = at(T, d, sd, bb); if (p.ok) out.push([p.x, p.z, r]); };
    for (let d = -14; d <= 22; d += 8) push(d, c.t, 6, 8); for (let d = -4; d <= 6; d += 5) push(d, -c.t, 2, 5);
    const o = c.after ? 0 : c.off || 0; if (c.p) for (let d = c.after ? 2 : -42 + o; d <= (c.after ? 44 : -2 + o); d += 8) push(d, c.p, 6, 8);
    if (c.after && c.p === c.t) for (let d = -26; d <= -12; d += 6) push(d, c.t, 4, 6); return out; };

  // ---- the trampled grass and the lamps
  function slushOf(wt) { if (SLUSH || typeof document === 'undefined' || !wt || !wt.image) return SLUSH;
    const img = wt.image, c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
    for (let i = 0; i < a.length; i += 4) { const l = (0.3 * a[i] + 0.5 * a[i + 1] + 0.2 * a[i + 2]) / 255, k = Math.min(0.86, Math.max(0.55, 0.35 + 1.2 * l)); a[i] = 255 * k * 0.97; a[i + 1] = 255 * k * 0.99; a[i + 2] = 255 * k; a[i + 3] *= 0.7; }
    g.putImageData(d, 0, 0); SLUSH = new THREE.CanvasTexture(c); SLUSH.anisotropy = wt.anisotropy; SLUSH.wrapS = wt.wrapS; SLUSH.wrapT = wt.wrapT; return SLUSH; }
  function wornLayer(o, pl, A, T) {
    if (!pl.worn.length || typeof document === 'undefined' || !A.wornTex || !o.groundH) return null;
    const tex = A.wornTex(), gH = o.groundH, P = [], UV = [], CO = [], I = [];
    let h = 2166136261; for (const ch of String(T.def.id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    let s = h >>> 0; const R = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    function tri(a, b, e) { const A3 = a * 3, B3 = b * 3, E3 = e * 3; if ((P[B3] - P[A3]) * (P[E3 + 2] - P[A3 + 2]) - (P[B3 + 2] - P[A3 + 2]) * (P[E3] - P[A3]) > 0) I.push(a, e, b); else I.push(a, b, e); }
    for (const w of pl.worn) { const nr = Math.max(2, Math.round(w.len / 1.2)), nc = Math.max(2, Math.round(2 * w.hw / 1.2)), vx = -w.uz, vz = w.ux;
      const u0 = (w.cell % 2) * 0.5 + 0.01, v0 = 1 - Math.floor(w.cell / 2) * 0.5 - 0.01, V = []; let lo = Infinity, hi = -Infinity, ok = true;
      for (let k = 0; k <= nr && ok; k++) for (let e = 0; e <= nc; e++) { const fa = w.len * (k / nr - 0.5), fb = 2 * w.hw * (e / nc - 0.5), x = w.x + w.ux * fa + vx * fb, z = w.z + w.uz * fa + vz * fb, y = gH(x, z);
        if (!Number.isFinite(y) || (pl.avoid && pl.avoid(x, z)) || (pl.paved && pl.paved(x, z))) { ok = false; break; } const n = A.nearest(x, z); if (n.i >= 0 && Math.abs(n.lat) < (T.wAt ? T.wAt(n.i) : T.w) + 0.3) { ok = false; break; }
        lo = Math.min(lo, y); hi = Math.max(hi, y); V.push(x, y + 0.04, z, u0 + 0.48 * e / nc, v0 - 0.48 * k / nr); }
      if (!ok || hi - lo > 1.6) continue; const b0 = P.length / 3;
      for (let q = 0; q < V.length; q += 5) { P.push(V[q], V[q + 1], V[q + 2]); UV.push(V[q + 3], V[q + 4]); CO.push(1, 1, 1, 0.75 + 0.25 * R()); }
      for (let k = 0; k < nr; k++) for (let e = 0; e < nc; e++) { const p = b0 + k * (nc + 1) + e; tri(p, p + 1, p + nc + 2); tri(p, p + nc + 2, p + nc + 1); } }
    if (!I.length) return null;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    const ca = new THREE.Float32BufferAttribute(CO, 4); ca.noSeason = true; geo.setAttribute('color', ca); geo.setIndex(I); geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ map: tex, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3 });
    const sl = slushOf(tex); mat.userData.c0 = new THREE.Color(1, 1, 1); mat.userData.map0 = tex; if (sl) mat.userData.snowMap = sl;
    const m = new THREE.Mesh(geo, mat); m.name = 'startWorn'; m.userData.lj = true; m.receiveShadow = true; m.renderOrder = 1; m.matrixAutoUpdate = false; o.root.add(m);
    const prev = o.dyn.people; o.dyn.people = function (tw, car, cam, rp) { const want = o.seasonKey === 'winter' && sl ? sl : tex; if (mat.map !== want) { mat.map = want; mat.needsUpdate = true; } return prev ? prev.apply(this, arguments) : undefined; };
    return m; }
  function startArea(o, pl) { const A = World.api, T = A && A.T; if (!pl || !T || !World.startOwn(T.def) || !o || !o.root) return;
    o.startStats = { placed: pl.placed, skipped: pl.skipped };
    const sc = (o.peopleW && o.peopleW.scenes) || [], list = Array.isArray(sc) ? sc : Object.values(sc), Sc = list.find(s => s && s.grp && s.grp.userData.scene === 'start'), lm = Sc && Sc.grp.getObjectByName('sceneLamps');
    if (lm && pl.lamps && o.dyn) { const col = lm.geometry.attributes.color, { u0, per } = pl.lamps, lights = [];
      for (let k = 0; k < 5; k++) { const cc = new THREE.Color(); let last = -1;
        lights.push({ material: { color: { setHex(v) { if (v === last) return; last = v; cc.setHex(v); for (let j = u0 + k * per; j < u0 + (k + 1) * per; j++) col.setXYZ(j, cc.r, cc.g, cc.b); col.needsUpdate = true; } } } }); }
      for (const m of lights) m.material.color.setHex(LAMP_OFF); o.dyn.lights = lights; }
    wornLayer(o, pl, A, T); }
  const P0 = World.people;
  if (P0) World.people = function (o) { const pl = plan = fresh(o); let r; try { r = P0.apply(this, arguments); } finally { plan = null; }
    try { startArea(o, pl); } catch (e) { console.warn('start', e); } return r; };
})();
