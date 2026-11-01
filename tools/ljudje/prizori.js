/* 12 prizorov za predloge »Ljudje ob progi« (samo slike). PR.build(ime), PR.phase(ime, 'blizu' | 'pred' | 'bliza' | 'mimo'), PR.clear(ime).
   Koordinate prizora: a vzdolž proge (+ v smeri vožnje), b od ograje stran (0 = ograja, + stran od ceste).
   Vsak prizor je skupina 2–10 ljudi (želja uporabnika), okoli njih elementi. */
window.PR = (function () {
  const L = LJ, live = {}, S = {};
  const TR = () => window.__game.race.track;
  function roomSide(s) { const T = TR(); let l = 0, r = 0; for (let d = -30; d <= 30; d += 6) { const i = T.idx((((s + d) % T.len) + T.len) % T.len); l += T.bl[i]; r += T.br[i]; } return r > l ? 1 : -1; }

  /* ---------- the scene's context: props and people in its frame ---------- */
  function ctxOf(name, F, root) {
    const C = { name, F, root, people: [], groups: {} };
    C.prop = (o, a, b, dir, key, sink) => { const yaw = dir == null ? F.yaw(0, -1) : typeof dir === 'number' ? F.yaw(0, -1) + dir : F.yaw(dir[0], dir[1]); L.place(root, F, o, a, b, yaw, sink); if (key) C.groups[key] = o; return o; };
    C.man = (look, st) => { const P = L.person(look); P.st = st; P.items = []; C.people.push(P); return P; };
    return C;
  }
  // a person in a state: { a, b, pose, t, face ('road' | 'car' | [da, db]), hold: [[kind, hand, opts]], head: [[kind]], y (over the ground), on (a prop's key:
  // a, b, y in its own frame, yaw), look ('car' | radians), rx (lying: tilt back), hide }
  function apply(C, P, s, carL) {
    const F = C.F;
    for (const it of P.items) it.parent && it.parent.remove(it); P.items = [];
    if (P.root.parent) P.root.parent.remove(P.root);
    if (s.hide) return;
    if (s.on) { L.put(C.groups[s.on], P, s.a, s.y || 0, s.b, s.yaw || 0); }
    else {
      const f = s.face === 'car' ? [carL[0] - s.a, carL[1] - s.b] : s.face === 'road' || s.face == null ? [0, -1] : s.face;
      L.placeP(C.root, F, P, s.a, s.b, F.yaw(f[0], f[1]), s.y || 0);
    }
    P.root.rotation.order = 'YXZ'; P.root.rotation.x = s.rx || 0;
    L.pose(P, s.pose || 'stand', s.t || 0);
    if (s.look === 'car') {   // the head (and a little of the body) turned to the car
      const w = new THREE.Vector3(); P.root.getWorldPosition(w); const [cx, cz] = F.w(carL[0], carL[1]);
      const pw = new THREE.Quaternion(); P.root.getWorldQuaternion(pw); const fw = new THREE.Vector3(0, 0, 1).applyQuaternion(pw);
      let d = Math.atan2(cx - w.x, cz - w.z) - Math.atan2(fw.x, fw.z); d = Math.atan2(Math.sin(d), Math.cos(d));
      P.torso.rotation.y += Math.max(-0.5, Math.min(0.5, d * 0.35)); P.head.rotation.y = Math.max(-1.1, Math.min(1.1, d - P.torso.rotation.y));
    } else if (typeof s.look === 'number') P.head.rotation.y = s.look;
    for (const h of s.hold || []) P.items.push(L.hold(P, h[1] == null ? 1 : h[1], h[0], h[2]));
    for (const h of s.head || []) P.items.push(L.headItem(P, h[0], h[1]));
  }
  const lerp = (a, b, f) => a + (b - a) * f;

  /* ---------- build, phases ---------- */
  function build(name) {
    const d = S[name], T = TR(), s = T.startS + d.at, side = d.side === 'room' ? roomSide(s) : d.side;
    const F = L.frame(s, side), root = new THREE.Group(); root.userData.lj = true; Render.scene.add(root);
    L.hideCrowd(true); L.seed(d.seed || 5);
    const C = live[name] = ctxOf(name, F, root);
    const cl0 = (d.clear || [[0, 7, 13]]).slice(); if (d.cam && d.cam.b > 2) { const k = d.cam; cl0.push([k.a, k.b, 6], [(k.a + k.ta) / 2, (k.b + k.tb) / 2, 5]); }   // (a close-up from the land side: no trees in front of its lens)
    const circles = cl0.map(([a, b, r]) => { const [x, z] = F.w(a, b); return [x, z, r]; });
    const nt = L.clearAround(circles), np = d.keepProps ? 0 : L.clearProps(circles, F, d.bMin == null ? 1.6 : d.bMin);
    d.build(C, F);
    if (d.life) {   // the forest and fields around: elements and animals by the country, in small clearings (also across the road and deeper in)
      const F2 = L.frame(s, -side), cl = [];
      for (const [kind, a, b, other, dir, sc, r] of d.life) {
        const Fx = other ? F2 : F, obj = L.SPECIES[kind] ? L.animal(kind) : L[kind](); if (sc) obj.scale.setScalar(sc);
        L.place(root, Fx, obj, a, b, dir == null ? Fx.yaw(0, -1) : Fx.yaw(dir[0], dir[1])); const [x, z] = Fx.w(a, b); cl.push([x, z, r || (L.SPECIES[kind] ? 2.2 : 4.5)]);
      }
      L.clearAround(cl); if (!d.keepProps) L.clearProps(cl.filter((c, k) => !L.SPECIES[d.life[k][0]]), F, -50);
    }
    root.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
    return { side, s: Math.round(s), bar: +F.bar.toFixed(2), people: C.people.length + (C.extraPeople || 0), trees: nt, tris: np };
  }
  function focusOf(C) {   // the group's centre and spread (world), from the people now placed
    const v = new THREE.Vector3(), P = []; for (const p of C.people.concat(C.focusExtra || [])) { if (!p.root.parent) continue; p.root.getWorldPosition(v); P.push(v.clone()); }
    const c = new THREE.Vector3(); for (const p of P) c.add(p); c.multiplyScalar(1 / Math.max(1, P.length)); let r = 0; for (const p of P) r = Math.max(r, Math.hypot(p.x - c.x, p.z - c.z)); c.y += 1.0; return { c, r };
  }
  function phase(name, ph) {
    const d = S[name], C = live[name], F = C.F, T = TR();
    const dist = Object.assign({ pred: 80, zacetek: 46, bliza: 28, mimo: 12 }, d.dist || {});
    const carL = ph === 'blizu' || ph === 'pred' ? [-dist.pred, -F.bar - 2] : [-dist[ph], -F.bar - 2];
    const arrows = [];
    for (const P of C.people) {
      const st = P.st;
      if (ph === 'blizu' || ph === 'pred') apply(C, P, st.act, carL);
      else if (ph === 'mimo') apply(C, P, Object.assign({ face: 'car' }, st.fence || st.act), carL);
      else if (st.run === false || !st.fence) apply(C, P, Object.assign({}, st.act, (ph === 'zacetek' ? st.zac : null) || st.bliza || {}), carL);
      else if (st.run && st.run.a != null) apply(C, P, ph === 'zacetek' && st.zac ? st.zac : st.run, carL);
      else if (ph === 'zacetek' && st.zac) apply(C, P, st.zac, carL);
      else {   // on the way from the activity to the fence (run.f of the way; just off at the start)
        const A = st.act, B = st.fence, f = ph === 'zacetek' ? Math.min(0.22, ((st.run && st.run.f) || 0.55) * 0.35) : Math.min(0.92, ((st.run && st.run.f) || 0.55) * 1.25), a = lerp(A.a, B.a, f), b = lerp(A.b, B.b, f);
        const pose = (st.run && st.run.pose) || 'run', t = (st.run && st.run.t != null) ? st.run.t : (C.people.indexOf(P) * 1.9) % 6.28;
        apply(C, P, { a, b, pose, t, face: [B.a - A.a, B.b - A.b], hold: st.run && st.run.hold != null ? st.run.hold : (B.hold || []) }, carL);
        if (!A.on && !(st.run && st.run.noArrow)) { const [x0, z0] = F.w(A.a, A.b), [x1, z1] = F.w(B.a, B.b); arrows.push([[x0, F.y(A.a, A.b) + 0.1, z0], [x1, F.y(B.a, B.b) + 0.1, z1]]); }
      }
    }
    if (d.phase) d.phase(C, ph, carL);
    let r;
    if (ph === 'blizu') {
      const k = Object.assign({ a: -11, b: -4.5, h: 5.5, ta: 0.5, tb: 4.5, th: 1.0, fov: 44 }, d.cam || {});
      const [px, pz] = F.w(k.a, k.b), [tx, tz] = F.w(k.ta, k.tb), py = F.y(k.ta, k.tb) + k.h, ty = F.y(k.ta, k.tb) + k.th;
      SH.carAt(T.startS + d.at - (d.camCar || 60)); SH.track = [];
      r = SH.shot({ px, py, pz, tx, ty, tz, fov: k.fov, fogD: Math.hypot(px - tx, pz - tz) });
    } else {
      SH.carAt(T.startS + d.at - dist[ph], d.lane);
      const fo = focusOf(C);
      SH.track = [].concat(...arrows, [[fo.c.x, fo.c.y, fo.c.z]]);
      r = SH.shot(null);
      const cp = Render.camera.position.clone(), D = cp.distanceTo(fo.c), fovMain = Render.camera.fov;
      const half = Math.max(3.0, (fo.r + (d.zoomPad || 3.2) * 0.45) / 1.55), fov = Math.max(4, Math.min(26, 2 * Math.atan(half / D) * 180 / Math.PI));   // (vertical: the picture is 16:9)
      const z = SH.shot({ px: cp.x, py: cp.y, pz: cp.z, tx: fo.c.x, ty: fo.c.y, tz: fo.c.z, fov, fogD: D });
      r.zoom = { src: z.src, fov, fovMain, pts: z.pts };
    }
    Render.setShot(null);
    r.info = { arrows: arrows.length };
    return r;
  }
  function clear(name) { const C = live[name]; if (C) { C.root.parent && C.root.parent.remove(C.root); delete live[name]; } }

  /* ================= 1 · Žar pred avtodomom (Nürburg, ravnina pred Schwedenkreuzom) ================= */
  S.zar = { at: 3300, side: -1, seed: 11, clear: [[0, 6.5, 12], [-15, 6, 7]],
    life: [['huntStand', 10, 7, 1, [0, -1]], ['roeF', -8, 4.5, 1, [1, 0.3]], ['roe', -6.6, 5.4, 1, [-0.4, -1]], ['logPile', -14, 15, 0, [1, 0]], ['fallenTree', 12, 16, 0, [1, 0.2]], ['hare', 3, 12, 1, [1, 0]]],
    build(C, F) {
      C.prop(L.motorhome(0x2f63c9), 0, 8.4, [0, -1]);
      C.prop(L.stringLights(4.0, 2.3), -0.8, 4.75, [0, -1]);
      C.prop(L.table(1.3, 0.75), -0.7, 5.7, [1, 0]);
      C.prop(L.chair(0xd8262a), -1.65, 5.7, [1, 0]); C.prop(L.chair(0x2f9a48), 0.25, 5.7, [-1, 0]); C.prop(L.chair(0xf0c22e), -0.7, 6.55, [0, -1]);
      C.prop(L.grillKettle(), 3.4, 4.6); C.prop(L.gasBottle(), 4.1, 5.2); C.prop(L.cooler(0xd8262a), 1.6, 6.9); C.prop(L.crates(3), -3.3, 7.0, [0, -1]);
      C.prop(L.flagPole([0x15171c, 0xd8262a, 0xf2c21a], 6), -5.4, 4.2); C.prop(L.bike(0x22848f), 4.4, 7.5, [1, 0]); C.prop(L.trashBag(), -4.3, 8.5);
      C.prop(L.kidPool(), 6.6, 3.8); C.prop(L.grp(L.sph(0.11, 6, 4, 0xf4f4f0, 0, 0.11, 0)), 5.2, 3.0);
      C.man({ shirt: 0xd23a2c, pants: 0x2f3f63, vest: 0xf2f2ee, stripes: 0xf2f2ee, hat: 'cap', hatCol: 0xf2f2ee }, { act: { a: 3.4, b: 5.35, pose: 'grill', hold: [['tongs', 1]] }, fence: { a: 2.4, b: 0.9, pose: 'wave', t: 1.2, hold: [['tongs', 1]] }, run: { f: 0.45 } });
      C.man({ shirt: 0x2f63c9, pants: 0x47494f }, { act: { a: -1.65, b: 5.7, pose: 'sitDrink', face: [1, 0], hold: [['can', 1]] }, fence: { a: 0.7, b: 0.9, pose: 'cheer', t: 0.6, hold: [['can', 1]] }, run: { f: 0.58 } });
      C.man({ shirt: 0xf0c22e, pants: 0x1d1f25, hair: 'pony' }, { act: { a: 0.25, b: 5.7, pose: 'sitLean', face: [-1, 0] }, fence: { a: -0.8, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.5 } });
      C.man({ shirt: 0x8a3b8c, pants: 0x2f3f63, hair: 'long' }, { act: { a: -0.7, b: 6.55, pose: 'sit', face: [0, -1] }, fence: { a: -2.3, b: 1.0, pose: 'wave2', t: 0.4 }, run: { f: 0.45 } });
      C.man({ kid: true, shirt: 0xf07a1c, pants: 0x2f63c9, shorts: true }, { act: { a: 6.6, b: 3.8, y: 0.06, pose: 'sitGround', face: [-1, -0.3] }, fence: { a: 1.5, b: 0.85, pose: 'jump' }, run: { f: 0.85, t: 2.5 } });
    } };

  /* ================= 2 · Ogenj na travi (Nürburg, gozd pred Adenauer Forstom) ================= */
  S.ogenj = { at: 5640, side: -1, seed: 21, clear: [[0, 7, 13], [-15, 6, 7]],
    life: [['stag', -10, 6, 1, [0.4, -1]], ['hind', -12.4, 7.5, 1, [1, 0.2]], ['hind', -8.2, 8.6, 1, [1, -0.3]], ['feedRack', -9, 12, 1, [0, -1]], ['mushroomRing', 7, 12, 0], ['stump', 10, 9, 0], ['stump', 11.4, 10.5, 0], ['signPost', 12, 3, 1]],
    build(C, F) {
      C.prop(L.campfire(), 0, 6.2);
      C.prop(L.logBench(1.8), 0, 7.9, [0, -1]); C.prop(L.logBench(1.6), -1.75, 6.3, [1, 0]); C.prop(L.logBench(1.6), 1.8, 6.1, [1, 0]);
      C.prop(L.tentDome(0xf07a1c), -5.6, 10.6, [0.4, -1]); C.prop(L.tentDome(0x2f9a48, 1.2), 5.2, 10.8, [-0.3, -1]); C.prop(L.tentRidge(0x2f63c9), 8.0, 6.6, [-1, 0]);
      C.prop(L.hammock(3.2), -6.2, 4.6, [0, -1], 'ham');
      const wood = L.woodpile(1.4); wood.scale.set(1, 0.6, 0.8); C.prop(wood, -3.8, 8.6, [0, -1]); C.prop(L.chopBlock(), -3.2, 4.6);
      C.prop(L.cooler(0x2f9a48), -2.4, 9.4); C.prop(L.crates(2, [0xc8201c, 0xc8201c]), 3.4, 9.2); C.prop(L.bike(0xd8262a), 2.8, 10.6, [1, 0]); C.prop(L.flagPole([0xd8262a, 0xf2f2f2, 0x1f4aa8], 5.5), 4.4, 3.4);
      C.man({ shirt: 0x2f9a48, pants: 0x47494f, hat: 'beanie', hatCol: 0xd23a2c, long: true }, { act: { a: -0.55, b: 7.9, pose: 'sitStick', face: [0, -1], hold: [['stick', 1]] }, fence: { a: -0.6, b: 0.9, pose: 'wave', t: 0.5, hold: [['stick', 1]] } });
      C.man({ shirt: 0xd23a2c, pants: 0x2f3f63, long: true }, { act: { a: 0.6, b: 7.9, pose: 'sitStick', face: [-0.2, -1], hold: [['stick', 1]] }, fence: { a: 0.6, b: 0.9, pose: 'cheer', t: 1.7, hold: [['stick', 1]] }, run: { f: 0.6 } });
      C.man({ shirt: 0x31406e, pants: 0x5b5040, hair: 'long', long: true }, { act: { a: -1.75, b: 6.4, pose: 'sitStick', face: [1, 0], hold: [['stick', 1]] }, fence: { a: -1.8, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.5 } });
      C.man({ shirt: 0x7c4a2e, pants: 0x1d1f25, hat: 'cap', hatCol: 0x262a33, long: true }, { act: { a: 3.0, b: 8.0, pose: 'carry', face: [-1, -0.3], hold: [['wood', 1]] }, fence: { a: 1.9, b: 0.9, pose: 'wave2', t: 1.0 }, run: { f: 0.45, hold: [] } });
      C.man({ shirt: 0xf0c22e, pants: 0x2f3f63, hair: 'pony' }, { act: { a: 1.8, b: 6.1, pose: 'sitDrink', face: [-1, 0.1], hold: [['bottle', 1]] }, fence: { a: 3.0, b: 0.95, pose: 'jump', hold: [['bottle', 1]] }, run: { f: 0.62 } });
      C.man({ shirt: 0x5b5040, pants: 0x262a33, hair: 'short' }, { act: { a: -5.3, b: 4.6, y: 1.0, pose: 'lie', rx: -1.5, face: [1, 0] }, run: false, fence: { a: -5.3, b: 4.6, y: 1.0, pose: 'lie', rx: -1.5, face: [1, 0] } });
    } };

  /* ================= 3 · Telovadba ob prikolici (Nürburg, Döttinger Höhe) ================= */
  S.telo = { at: 18450, side: -1, seed: 31, clear: [[0, 7, 13], [-15, 6, 7]],
    life: [['hare', -10, 12, 1, [1, 0]], ['hare', -8.6, 13.2, 1, [-0.5, 1]], ['fox', 6, 9, 1, [-1, 0.3]], ['roeF', 14, 16, 0, [1, 0]], ['roe', 15.4, 17.2, 0, [0, -1]], ['huntStand', -16, 18, 0, [0, -1]]],
    build(C, F) {
      const cv = L.caravan(0xd8262a); C.prop(cv, -1.5, 10.4, [0, -1]); const car = L.car(0x7c8a99); car.position.set(6.4, 0, 0); cv.add(car);
      for (const [a, col] of [[-3.2, 0x8a3b8c], [-0.6, 0x22848f], [2.0, 0xf07a1c]]) C.prop(L.mat(col), a, 5.0, [1, 0]);
      for (const [a, b] of [[-2.4, 6.2], [-2.1, 6.3], [1.2, 6.1]]) C.prop(L.dumbbell(), a, b, [1, 0]);
      C.prop(L.pullBar(), 5.6, 6.6, [0, -1]); C.prop(L.boombox(), 3.8, 7.4, [-0.5, -1]); C.prop(L.cooler(0x2f63c9), -5.6, 7.6); C.prop(L.chair(0x2f63c9), -6.4, 6.4, [0.5, -1]); C.prop(L.parasol(0x2f9a48), -6.2, 6.8);
      C.prop(L.flagPole([0xf2f2f2, 0x2f63c9, 0xd8262a], 5.5), 8.0, 4.0);
      C.man({ shirt: 0xd23a2c, pants: 0x1d1f25, shorts: true, hair: 'short' }, { act: { a: -3.2, b: 5.0, pose: 'jack0' }, fence: { a: -2.2, b: 0.9, pose: 'jump' }, run: { f: 0.6 } });
      C.man({ shirt: 0x22848f, pants: 0x262a33, hair: 'pony' }, { act: { a: -0.6, b: 5.0, pose: 'squat' }, fence: { a: -0.6, b: 0.9, pose: 'cheer', t: 0.2 }, run: { f: 0.55 } });
      C.man({ shirt: 0xf0c22e, pants: 0x31406e, shorts: true }, { act: { a: 2.0, b: 5.0, pose: 'stretch' }, fence: { a: 0.9, b: 0.9, pose: 'jack0' }, run: { f: 0.5 } });
      C.man({ shirt: 0x262a33, pants: 0x47494f, shorts: true, hair: 'bald' }, { act: { a: 5.6, b: 6.6, y: 0.42, pose: 'hang', face: [0, -1] }, fence: { a: 2.4, b: 0.95, pose: 'wave', t: 0.9 }, run: { f: 0.45 } });
      C.man({ shirt: 0xefefea, pants: 0x2f3f63, hat: 'cap', hatCol: 0x2f63c9 }, { act: { a: -6.4, b: 6.4, pose: 'sitDrink', face: [0.5, -1], hold: [['bottle', 1, { c: 0x8acbe8 }]] }, fence: { a: -3.6, b: 1.0, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.55 } });
    } };

  /* ================= 4 · TV pod šotorom (Nürburg, ravnina pred Schwalbenschwanzom) ================= */
  S.tv = { at: 16350, side: -1, seed: 41, clear: [[0, 7, 13], [-15, 6, 7]],
    life: [['boar', -6, 4.5, 1, [1, 0.2]], ['piglet', -4.7, 5.0, 1, [1, 0.4]], ['piglet', -4.9, 4.2, 1, [1, -0.1]], ['piglet', -4.2, 4.7, 1, [1, 0.1]], ['piglet', -5.3, 5.6, 1, [0.7, 0.5]], ['logPile', -12, 12, 0, [1, 0]], ['fallenTree', 10, 14, 0, [1, -0.3]], ['huntStand', 9, 9, 1, [0, -1]]],
    build(C, F) {
      C.prop(L.gazebo(0x2f63c9, 3.6), 0, 5.8); C.prop(L.stringLights(3.6, 2.05), 0, 4.0, [0, -1]);
      C.prop(L.tvSet(), 0, 4.3, [0, 1]); C.prop(L.sofa(0x7c4a2e), 0, 7.1, [0, -1]); C.prop(L.chair(0xd8262a), 1.95, 6.2, [-0.5, -1]); C.prop(L.beanBag(0xf0c22e), -1.95, 6.2);
      C.prop(L.fridge(), 2.9, 7.6, [0, -1]); C.prop(L.generator(), 4.4, 8.4, [0, -1]); C.prop(L.satDish(), -3.0, 7.8, [0.2, -1]); C.prop(L.crates(3, [0xe0b020, 0xe0b020, 0xc8201c]), -3.4, 5.2);
      C.prop(L.tentDome(0xd8262a), -6.4, 10.4, [0.3, -1]); C.prop(L.van(0x2f9a48, 0xf2f2ee), 6.8, 10.8, [0, -1]); C.prop(L.portaloo(0x2f9a48), -8.5, 7.0); C.prop(L.flagPole([0x2f9a48, 0xf2f2f2, 0xd8262a], 6), 4.6, 3.6);
      C.man({ shirt: 0xd23a2c, pants: 0x2f3f63, hat: 'cap', hatCol: 0xd23a2c }, { act: { a: -0.62, b: 7.05, pose: 'sofa' }, fence: { a: -0.9, b: 0.9, pose: 'cheer', t: 1.2 }, run: { f: 0.52 } });
      C.man({ shirt: 0x262a33, pants: 0x47494f, hair: 'bald' }, { act: { a: 0.05, b: 7.05, pose: 'sofa', hold: [['can', 1]] }, bliza: { look: -0.9 }, run: false, fence: null });
      C.man({ shirt: 0x2f9a48, pants: 0x1d1f25, hair: 'long' }, { act: { a: 0.7, b: 7.05, pose: 'sofa' }, fence: { a: 0.6, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.46 } });
      C.man({ shirt: 0xf0c22e, pants: 0x2f3f63 }, { act: { a: 1.95, b: 6.2, pose: 'sitDrink', face: [-0.5, -1], hold: [['can', 1]] }, fence: { a: 1.9, b: 0.9, pose: 'wave', t: 0.3, hold: [['can', 1]] }, run: { f: 0.6 } });
      C.man({ shirt: 0x8a3b8c, pants: 0x5b5040, hat: 'beanie', hatCol: 0x2f63c9 }, { act: { a: -1.95, b: 6.25, y: -0.08, pose: 'sitGround', face: [0.4, -1] }, fence: { a: -2.4, b: 0.95, pose: 'jump' }, run: { f: 0.62 } });
      C.man({ shirt: 0x22848f, pants: 0x262a33, hair: 'pony' }, { act: { a: 2.9, b: 7.1, pose: 'bend', face: [0, 1] }, fence: { a: 3.3, b: 0.95, pose: 'wave2', t: 0.7 }, run: { f: 0.5 } });
    },
    phase(C, ph) { const lazy = C.people[1]; if (ph === 'mimo') { lazy.head.rotation.y = -1.0; lazy.torso.rotation.y = -0.2; } } };

  /* ================= 5 · Hiša ob cesti (Ouninpohja, rumena hiša) =================
     The Yellow House stands 16 m from the centre line, 12 m along the road and 8 m deep: in this frame a ∈ [-6, 6], b ∈ [16 - bar - 4, 16 - bar + 4];
     the family's yard is beside it (a > 7: the trampoline and the washing; a < -7: the wood), the garden fence along the road in front */
  S.hisa = { at: 2240, side: -1, seed: 51, keepProps: true, clear: [[12, 5, 7], [-11, 4, 6], [0, -1, 6]], dist: { zacetek: 44, bliza: 27, mimo: 11 }, cam: { a: 18, b: -4.5, h: 6.5, ta: 3, tb: 2, th: 1.2, fov: 54 },
    life: [['moose', -10, 7, 1, [1, -0.4], 1, 3.5], ['moose', -7.4, 8.4, 1, [1, 0], 0.6, 2.5], ['hare', 8, 4, 1, [-1, 0]], ['logPile', 14, 9, 1, [1, 0]], ['huntStand', -16, 14, 1, [0, -1]]],
    build(C, F) {
      const front = 16 - F.bar - 4, fb = front - 3.1;   // (the house's front wall; the garden fence along the road, a few metres in front of it)
      C.prop(L.picketFence(33, 0xf2f0ea), 1.5, fb, [0, -1]); C.prop(L.mailbox(), -15.8, fb - 0.6);
      C.prop(L.flowerBed(3), 3.6, front - 0.45, [0, -1]); C.prop(L.bench(0x7c5a3a), -2.2, front - 0.75, [0, -1]); C.prop(L.bike(0xd8262a), 6.6, front - 0.5, [1, 0]);
      C.prop(L.clothesline(4.6), 13.0, front + 0.6, [0, -1]); C.prop(L.trampoline(), 11.6, front + 4.6);
      C.prop(L.woodpile(2.4), -10.6, front + 2.6, [1, 0]); C.prop(L.chopBlock(), -9.2, front - 0.4); C.prop(L.wheelbarrow(0x2f9a48), -8.0, front + 1.6, [1, 0]);
      C.prop(L.tractor(0xd8262a), -14.6, front + 3.2, [1, 0]);
      const dog = L.dog(0x5c3a22); C.prop(dog, 1.8, front - 1.2, [1, -0.3], 'dog'); C.fb = fb;
      C.man({ shirt: 0x7c4a2e, pants: 0x31406e, long: true, hat: 'cap', hatCol: 0x262a33 }, { act: { a: -9.2, b: front + 0.2, pose: 'chopUp', face: [0, -1], hold: [['axe', 1]] }, fence: { a: -3.4, b: fb + 0.5, pose: 'wave', t: 0.6 }, run: { f: 0.45, pose: 'walk', t: 1.4, hold: [] } });
      C.man({ shirt: 0xb8bcc4, pants: 0x6a6f78, long: true, hat: 'beanie', hatCol: 0x8a3b8c, scale: 0.92 }, { act: { a: -2.2, b: front - 0.7, pose: 'sit', face: [0, -1] }, fence: { a: -1.8, b: fb + 0.5, pose: 'wave2', t: 0.2 }, run: { f: 0.4, pose: 'walk', t: 0.6 } });
      C.man({ shirt: 0x2f63c9, pants: 0x2f3f63, hair: 'pony' }, { act: { a: 13.0, b: front + 1.2, pose: 'cheer', t: 0, face: [0, -1] }, fence: { a: 2.8, b: fb + 0.5, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.5, pose: 'walk', t: 2.0 } });
      C.man({ kid: true, shirt: 0xd23a2c, pants: 0x2f63c9, shorts: true }, { act: { a: 11.6, b: front + 4.6, y: 1.25, pose: 'jump', face: [0, -1] }, fence: { a: 4.2, b: fb + 0.45, pose: 'jump' }, run: { f: 0.8, t: 2.3 } });
      C.man({ kid: true, shirt: 0xf0c22e, pants: 0x31406e, shorts: true, hair: 'pony', scale: 1.15 }, { act: { a: 10.0, b: front + 2.6, pose: 'cheer', t: 0.4, face: [0.6, 1] }, fence: { a: 5.4, b: fb + 0.45, pose: 'wave', t: 1.3 }, run: { f: 0.7, t: 1.2 } });
    },
    phase(C, ph) { const dog = C.groups.dog, F = C.F, fb = C.fb, front = fb + 3.1; if (!dog) return;
      const at = ph === 'mimo' ? [6.6, fb + 0.6, [1, -0.2]] : ph === 'bliza' ? [5.0, fb + 1.4, [0.4, -1]] : [1.8, front - 1.2, [1, -0.3]];
      const [x, z] = F.w(at[0], at[1]); dog.position.set(x, F.y(at[0], at[1]), z); dog.rotation.y = F.yaw(at[2][0], at[2][1]); } };

  /* ================= 6 · Oder iz gradbenih odrov (Nürburg, Quiddelbacher Höhe) ================= */
  S.oder = { at: 1950, side: 1, seed: 61, clear: [[0, 6.5, 12], [-15, 6, 9], [-26, 8, 7]],
    life: [['huntStand', 8, 7, 1, [0, -1]], ['fox', -6, 3, 1, [1, -0.2]], ['feedRack', -14, 14, 0, [0, -1]], ['roe', 12, 14, 0, [-1, -0.5]], ['roeF', 13.4, 15, 0, [1, 0]]], cam: { a: -12, b: -4.5, h: 6.5, ta: 0.5, tb: 4.5, th: 2.6, fov: 46 }, zoomPad: 3.8,
    build(C, F) {
      C.prop(L.scaffold({ banner: [0x15171c, 0xd8262a, 0xf2c21a] }), 0, 4.6, [0, -1], 'sc');
      C.prop(L.beerSet(2.2), 4.6, 5.6, [1, 0]); C.prop(L.portaloo(0x2f63c9), -6.0, 8.6); C.prop(L.bin(), -4.7, 8.8);
      C.prop(L.flagPole([0xd8262a, 0xf2f2f2, 0xd8262a], 6.5), -3.6, 2.6); C.prop(L.flagPole([0x15171c, 0xd8262a, 0xf2c21a], 6.5), 3.6, 2.4);
      const ban = L.fanBanner([0xf2c21a, 0x15171c, 0xf2c21a], 4.5); ban.add(L.box(0.06, 2.0, 0.06, 0x9aa0a8, -2.25, 1.0, 0)); ban.add(L.box(0.06, 2.0, 0.06, 0x9aa0a8, 2.25, 1.0, 0)); C.prop(ban, 0, 0.55, [0, -1]);
      C.prop(L.tentDome(0xf0c22e), -6.2, 11.5, [0.3, -1]); C.prop(L.car(0xb8bcc4), 6.5, 11.2, [0, -1]);
      const H = 4.48;
      C.man({ shirt: 0x15171c, pants: 0x2f3f63, hat: 'cap', hatCol: 0xd8262a }, { act: { on: 'sc', a: -0.4, b: -0.3, y: H, pose: 'sofa' }, run: { on: 'sc', a: -0.4, b: 0.3, y: H, pose: 'cheer', t: 0 }, fence: { on: 'sc', a: -0.45, b: 0.5, y: H, pose: 'jump' } });
      C.man({ shirt: 0xd8262a, pants: 0x1d1f25 }, { act: { on: 'sc', a: 0.2, b: -0.3, y: H, pose: 'sofa', hold: [['can', 1]] }, run: { on: 'sc', a: 0.3, b: 0.4, y: H, pose: 'stand', hold: [['can', 1]] }, fence: { on: 'sc', a: 0.35, b: 0.55, y: H, pose: 'wave', t: 1.0, hold: [['horn', 1]] } });
      C.man({ shirt: 0xf0c22e, pants: 0x2f3f63, hair: 'long' }, { act: { on: 'sc', a: 0.8, b: -0.3, y: H, pose: 'sofa' }, run: { on: 'sc', a: 1.05, b: 0.35, y: H, pose: 'phone', hold: [['phone', 1]] }, fence: { on: 'sc', a: 1.15, b: 0.5, y: H, pose: 'cheer', t: 0.8 } });
      C.man({ shirt: 0xefefea, pants: 0x47494f, hat: 'cap', hatCol: 0x15171c }, { act: { on: 'sc', a: -1.15, b: 0.7, y: H, pose: 'flagHold', hold: [['flag', 1]] }, run: { on: 'sc', a: -1.15, b: 0.7, y: H, pose: 'flagWave', t: 0.5, hold: [['flag', 1]] }, fence: { on: 'sc', a: -1.15, b: 0.7, y: H, pose: 'flagWave', t: 2.2, hold: [['flag', 1]] } });
      C.man({ shirt: 0x2f9a48, pants: 0x1d1f25 }, { act: { a: 4.6, b: 5.0, pose: 'sitDrink', face: [0, 1], hold: [['can', 1]] }, fence: { a: 2.6, b: 0.9, pose: 'cheer', t: 0.3 }, run: { f: 0.55 } });
      C.man({ shirt: 0x31406e, pants: 0x5b5040, hair: 'pony' }, { act: { a: 4.6, b: 6.2, pose: 'sit', face: [0, -1] }, fence: { a: 3.7, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] }, run: { f: 0.48 } });
      C.man({ shirt: 0xf07a1c, pants: 0x2f3f63, hat: 'cap', hatCol: 0x2f63c9 }, { act: { a: -2.6, b: 7.6, pose: 'carryWalk', t: 0.8, face: [0.3, -1], hold: [['crate', 1, { c: 0xe0b020 }]] }, fence: { a: -2.0, b: 0.9, pose: 'wave2', t: 1.6 }, run: { f: 0.5, hold: [] } });
    } };

  /* ================= 7 · Tribuna z valom (Bathurst, ravnina pred zadnjim zavojem) ================= */
  S.tribuna = { at: 5790, side: 1, seed: 71, clear: [[0, 6, 16]],
    life: [['kangaroo', -9, 7, 1, [1, 0.3]], ['kangaroo', -7, 8.4, 1, [0.6, -1]], ['joey', -7.8, 7.4, 1, [1, 0]], ['kangaroo', -5.2, 6.6, 1, [1, -0.2]], ['kangaroo', -10.6, 9.2, 1, [0.4, 1]], ['emu', 9, 8, 1, [1, 0]], ['emu', 10.6, 9.2, 1, [0.8, 0.4]],
      ['cockatoo', 4, 2.6, 1, [1, 0]], ['cockatoo', 4.5, 3.0, 1, [0.4, 1]], ['cockatoo', 3.6, 3.3, 1, [-1, 0]], ['galah', 5.0, 2.4, 1, [1, 0.5]], ['galah', 3.2, 2.5, 1, [0, 1]], ['windpump', 18, 16, 1, [0, -1]], ['waterTank', 22, 13, 1]], dist: { pred: 80, bliza: 40, mimo: 10 }, cam: { a: -19, b: -4, h: 5, ta: 0, tb: 5, th: 2.5, fov: 50 }, zoomPad: 4,
    build(C, F) {
      const Ls = 24, n = 8; C.prop(L.stand(Ls, n, { seat: 0x1f63d8 }), 0, 3.2, [0, -1], 'st');
      C.prop(L.bigScreen(), 16.8, 2.4, [-0.5, -1]); C.prop(L.portaloo(0x2f63c9), 15.0, 10.5); C.prop(L.portaloo(0x2f63c9), 16.3, 10.5); C.prop(L.bin(), 13.7, 10.8);
      for (const a of [-11, -5.5, 0, 5.5, 11]) C.prop(L.flagPole([[0xd8262a, 0xf2f2f2, 0x1f63d8][Math.abs(a / 5.5) % 3], 0xf2f2f2], 4), a, 3.2 + 8 * 0.85 + 0.6);
      // the seats: friends in groups of 2-10 with empty seats between the groups
      const R = L.rnd, cols = L.SHIRT, st = C.groups.st; C.seats = []; let gid = 0;
      // which way the stand's local +x runs along the track (+a)
      const v0 = new THREE.Vector3(0, 0, 0).applyMatrix4(st.matrixWorld), v1 = new THREE.Vector3(1, 0, 0); st.updateMatrixWorld(); v0.set(0, 0, 0).applyMatrix4(st.matrixWorld); v1.applyMatrix4(st.matrixWorld);
      C.sgn = Math.sign((v1.x - v0.x) * F.tx + (v1.z - v0.z) * F.tz) || 1;
      for (let r = 0; r < n; r++) { let x = -Ls / 2 + 1.4 + R() * 1.2;
        while (x <= Ls / 2 - 1.4) { const g = 2 + Math.floor(Math.pow(R(), 1.6) * 9), team = cols[Math.floor(R() * cols.length)]; gid++;
          for (let k = 0; k < g && x <= Ls / 2 - 1.4; k++, x += 0.6) { const P = L.person({ shirt: R() < 0.5 ? team : cols[Math.floor(R() * cols.length)], hat: R() < 0.3 ? 'cap' : null, scale: 0.93 + R() * 0.08 }); P.items = [];
            P.seat = { x, r, y: 0.6 + r * 0.42 + 0.22 - 0.5 + 0.02, z: -r * 0.85 - 0.1, k: R(), g: gid }; C.seats.push(P); }
          x += 0.6 * (1 + Math.floor(R() * 4)); } }
      C.walkers = []; for (const [x, r] of [[-Ls / 2 + 0.6, 2], [Ls / 2 - 0.6, 5]]) { const P = L.person({ shirt: cols[Math.floor(R() * cols.length)] }); P.items = []; P.w = { x, r }; C.walkers.push(P); }
      C.extraPeople = C.seats.length + C.walkers.length; C.focusExtra = C.seats;
    },
    phase(C, ph, carL) {   // the wave: up where the car is (it moves along with it), sitting again behind it
      const g = C.groups.st, carA = carL[0];
      for (const P of C.seats) {
        for (const it of P.items) it.parent && it.parent.remove(it); P.items = [];
        const ax = P.seat.x * C.sgn, dA = ax - carA, up = ph === 'mimo' ? (dA > -3 && dA < 9) : ph === 'bliza' ? (ax > -12.5 && ax < -5) : false;
        L.put(g, P, P.seat.x, up ? P.seat.y + 0.42 : P.seat.y, P.seat.z + (up ? 0.05 : 0), 0);
        if (up) { L.pose(P, P.seat.k < 0.55 ? 'cheer' : P.seat.k < 0.75 ? 'jump' : P.seat.k < 0.9 ? 'wave' : 'phoneUp', P.seat.k * 6); if (P.seat.k >= 0.9) P.items.push(L.hold(P, 1, 'phone')); }
        else { L.pose(P, P.seat.k < 0.6 ? 'sit' : P.seat.k < 0.8 ? 'sitDrink' : 'sitLean'); if (P.seat.k >= 0.6 && P.seat.k < 0.8) P.items.push(L.hold(P, 1, 'cup', { c: 0xd8262a })); }
        if (!up && (ph === 'zacetek' || ph === 'bliza' || ph === 'mimo')) P.head.rotation.y = -0.6 * C.sgn;
      }
      C.walkers.forEach((P, k) => { for (const it of P.items) it.parent && it.parent.remove(it); P.items = [];
        const y = 0.6 + P.w.r * 0.42 - 0.2 + 0.02; L.put(g, P, P.w.x, y, -P.w.r * 0.85, k ? Math.PI : 0); L.pose(P, 'carryWalk', 1 + k); P.items.push(L.hold(P, 1, 'cup', { c: 0xf0c22e })); });
    } };

  /* ================= 8 · Fotografi in TV kamera (Spa, pred Eau Rouge) ================= */
  S.foto = { at: 870, side: -1, seed: 81, clear: [[0, 6, 12]],
    life: [['cowB', -8, 10, 1, [1, 0.3]], ['cow', -4, 12, 1, [0.4, 1]], ['cowB', -1, 9, 1, [-1, 0.2]], ['roe', 12, 12, 0, [0, -1]], ['huntStand', 14, 10, 1, [0, -1]]], cam: { a: -8, b: 15, h: 7.5, ta: 0.5, tb: 3.2, th: 1.2, fov: 50 },
    build(C, F) {
      C.prop(L.camTower(0xf2f2f2), 2.6, 3.6, [0, -1], 'tw');
      C.prop(L.mediaVan(), -6.5, 8.6, [0, -1]); C.prop(L.gazebo(0x262a33, 2.6), -1.6, 6.8); C.prop(L.table(1.0, 0.6, { things: false }), -1.6, 6.8, [0, -1]);
      C.prop(L.box(0.34, 0.03, 0.24, 0x2a2c31, 0, 0.75, 0), -1.75, 6.8); C.prop(L.box(0.34, 0.22, 0.02, 0x4a7fb8, 0, 0.87, -0.1, { basic: true, rx: -0.3 }), -1.75, 6.8);
      C.prop(L.bag(0x23262c), -3.2, 3.9); C.prop(L.bag(0x5b5040), -2.6, 4.3, 0.5); C.prop(L.stool(), -4.4, 4.4); C.prop(L.cone(), -0.3, 0.8); C.prop(L.cone(), 5.2, 0.8);
      const vest = { shirt: 0x2a2c31, pants: 0x3a4a3a, vest: 0xd9c35a, stripes: 0x8a7a3a, long: true };
      C.man(Object.assign({ hat: 'cap', hatCol: 0x15171c }, vest), { act: { a: -4.4, b: 4.4, pose: 'sit', face: [0.5, -1], head: [['camera']] }, run: { f: 0.62, pose: 'walk', t: 1.2 }, fence: { a: -2.4, b: 0.85, pose: 'crouchCam', head: [['camera']], look: 'car' } });
      C.man(Object.assign({}, vest, { hair: 'pony' }), { act: { a: -2.4, b: 5.4, pose: 'drink', face: [0.7, -1], hold: [['cup', 1]] }, run: { f: 0.6, pose: 'walk', t: 2.6 }, fence: { a: -0.6, b: 0.85, pose: 'kneel', head: [['camera']], look: 'car' } });
      C.man(Object.assign({}, vest, { hat: 'beanie', hatCol: 0x31406e }), { act: { a: -1.1, b: 7.3, pose: 'talk', face: [-1, 0] }, run: { f: 0.55, pose: 'run', t: 0.7 }, fence: { a: 5.6, b: 0.9, pose: 'cam', head: [['camera']], look: 'car' } });
      C.man({ shirt: 0x15171c, pants: 0x1d1f25, hat: 'cap', hatCol: 0x15171c, long: true }, { act: { on: 'tw', a: 0.0, b: -0.55, y: 3.04, pose: 'relax' }, run: { on: 'tw', a: 0.0, b: -0.5, y: 3.04, pose: 'cam' }, fence: { on: 'tw', a: 0.0, b: -0.5, y: 3.04, pose: 'cam' } });
      C.man({ shirt: 0xf2f2ee, pants: 0x262a33, long: true, hat: 'cap', hatCol: 0x1f63d8 }, { act: { a: -4.6, b: 6.6, pose: 'talk', face: [1, 0.2] }, run: false, fence: { a: -4.6, b: 6.6, pose: 'arms', look: 'car' } });
    },
    phase(C, ph, carL) {   // the TV camera on the tower and its cameraman: to the car
      const g = C.groups.tw, head = g.userData.camHead, F = C.F; if (!head) return;
      const hw = new THREE.Vector3(); head.getWorldPosition(hw); const [cx, cz] = F.w(carL[0], carL[1]); let d = Math.atan2(cx - hw.x, cz - hw.z) - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
      head.rotation.y = ph === 'blizu' || ph === 'pred' ? 0.6 : d; head.rotation.x = ph === 'pred' || ph === 'blizu' ? 0 : 0.15;
      const man = C.people[3]; man.root.rotation.y = head.rotation.y;
    } };

  /* ================= 9 · Maršali na postaji (Spa, Kemmel) ================= */
  S.marsali = { at: 1360, side: 1, seed: 91, clear: [[0, 4.5, 10]],
    life: [['boar', -6, 5, 1, [1, 0.3]], ['piglet', -4.6, 5.4, 1, [1, 0.2]], ['piglet', -4.8, 4.6, 1, [1, 0]], ['piglet', -5.2, 5.9, 1, [0.6, 0.6]], ['huntStand', 10, 10, 1, [0, -1]], ['logPile', -16, 12, 0, [1, 0]]], bMin: 1.2, cam: { a: -7, b: 13, h: 6.5, ta: 0.6, tb: 2.4, th: 1.0, fov: 50 },
    build(C, F) {
      C.prop(L.marshalPost({ num: '14' }), 0, 3.4, [0, -1], 'mp');
      C.prop(L.quad(0xf07a1c), 4.6, 4.8, [1, -0.2]); C.prop(L.box(1.2, 0.5, 0.9, 0x6a6f78, 0, 0.45, 0), 6.4, 5.0, [1, -0.2]); C.prop(L.parasol(0xf07a1c, 0xf2f2ee), -2.8, 3.4);
      C.prop(L.bin(0x2f63c9), -4.2, 4.6); for (const [a, b] of [[7.4, 3.4], [7.8, 3.6], [8.2, 3.3]]) C.prop(L.cone(), a, b); C.prop(L.tyreStack(3, 0x15171c), -5.2, 2.6);
      const ORA = { shirt: 0xf07a1c, pants: 0xf07a1c, long: true, belt: 0xd9dde2, hat: 'cap', hatCol: 0xf07a1c };
      C.man(Object.assign({}, ORA), { act: { a: 1.0, b: 1.6, pose: 'sitDrink', face: [-0.3, -1], hold: [['radio', 1]] }, bliza: { pose: 'radio' }, run: false, fence: { a: 1.0, b: 1.2, pose: 'radio', hold: [['radio', 1]], look: 'car' } });
      C.man(Object.assign({}, ORA, { hat: null, hair: 'short' }), { act: { a: 6.5, b: 0.8, pose: 'sweep', face: [1, -0.2], hold: [['broom', 1]] }, run: { a: 4.4, b: 1.6, pose: 'walk', t: 1.0, face: [-1, 0.6], hold: [['broom', 1]] }, fence: { a: 3.5, b: 1.5, pose: 'stand', hold: [['ext', 1]], look: 'car' } });
      C.man(Object.assign({}, ORA, { hat: null, hair: 'pony' }), { act: { a: -2.8, b: 3.4, pose: 'sit', face: [0.6, -1], hold: [['clip', 1]] }, run: { a: -1.1, b: 0.9, pose: 'flagHold', face: [0, -1], hold: [['mflag', 1, { c: 0xf5d21a }]] }, fence: { a: -1.1, b: 0.85, pose: 'flagWave', t: 1.0, hold: [['mflag', 1, { c: 0xf5d21a }]], look: 'car' } });
      C.man(Object.assign({}, ORA, { hatCol: 0xf2f2f2 }), { act: { a: 4.4, b: 4.2, pose: 'arms', face: [-1, -0.3] }, run: { a: 4.0, b: 2.6, pose: 'walk', t: 2.0, face: [-0.6, -1] }, fence: { a: -3.4, b: 1.3, pose: 'flagHold', hold: [['mflag', 1, { c: 0x1f63d8 }]], look: 'car' } });
    },
    phase(C, ph) { const s = C.groups.mp; } };

  /* ================= 10 · Gasilci in reševalci (Spa, pred Blanchimontom) ================= */
  S.gasilci = { at: 5560, side: 1, seed: 101, clear: [[0, 6, 13], [-11, 6, 6]],
    life: [['fox', -4, 3, 1, [1, -0.3]], ['hare', 8, 4, 1, [-1, 0.2]], ['logPile', -20, 14, 0, [1, 0]], ['stag', 12, 9, 1, [0.3, -1]]], cam: { a: -15, b: -4, h: 6, ta: -2.5, tb: 5.5, th: 1.2, fov: 50 }, zoomPad: 4,
    build(C, F) {
      const strip = L.box(30, 0.03, 4.4, 0x6f6a62, 0, 0.015, 0, { noCast: true }); C.prop(L.grp(strip), -3.5, 6.6, [0, -1]);
      C.prop(L.fireTruck(), 1.0, 6.6, [0, -1]); C.prop(L.car(0xf2f2f2, { bar: 0x2f6bff, stripe: 0xd8262a, L: 4.8 }), -8.4, 6.6, [0, -1]);
      C.prop(L.hoseLine(5), -3.0, 3.6, [0, -1]); C.prop(L.item('ext'), 4.6, 4.2); C.prop(L.item('ext'), 4.9, 4.4); for (const a of [-1.5, 6.8, 7.4]) C.prop(L.cone(), a, 1.2);
      C.prop(L.gazebo(0xf2f2f2, 3.0), -14.5, 5.6); C.prop(L.box(1.9, 0.5, 0.6, 0xd8262a, 0, 0.55, 0), -14.5, 5.6, [1, 0]); C.prop(L.chair(0x2f63c9), -13.4, 4.4, [0, -1]);
      const FF = { shirt: 0x2c2f38, pants: 0x2c2f38, long: true, hat: 'fire', hatCol: 0xd8262a, vest: 0x2c2f38, stripes: 0xe8d84a };
      C.man(Object.assign({}, FF), { act: { a: 2.6, b: 4.85, pose: 'sitDrink', face: [0, -1], hold: [['cup', 1]] }, run: { a: 2.6, b: 4.2, pose: 'stand', hold: [['cup', 1]], look: 'car' }, fence: { a: 2.4, b: 2.8, pose: 'thumbs', look: 'car' } });
      C.man(Object.assign({}, FF, { hatCol: 0xf2f2f2 }), { act: { a: -2.6, b: 4.9, pose: 'bend', face: [0, 1] }, run: { a: -2.6, b: 4.4, pose: 'arms', face: [0, -1] }, fence: { a: -1.6, b: 2.2, pose: 'arms', look: 'car' } });
      C.man(Object.assign({}, FF), { act: { a: -5.6, b: 4.1, pose: 'talk', face: [1, 0] }, run: { a: -5.4, b: 3.7, pose: 'talk', face: [0, -1] }, fence: { a: -4.4, b: 2.0, pose: 'wave', t: 0.8, look: 'car' } });
      C.man({ shirt: 0xf2f2f2, pants: 0x1f2c48, vest: 0x2a9a3a, stripes: 0xf2f2f2 }, { act: { a: -4.5, b: 4.1, pose: 'stand', face: [-1, 0], hold: [['clip', 1]] }, run: { a: -4.4, b: 3.5, pose: 'stand', face: [0, -1], hold: [['clip', 1]] }, fence: { a: -3.4, b: 2.2, pose: 'stand', hold: [['clip', 1]], look: 'car' } });
      C.man({ shirt: 0xf2f2f2, pants: 0x1f2c48, vest: 0x2a9a3a, stripes: 0xf2f2f2, hair: 'pony' }, { act: { a: -13.4, b: 4.4, pose: 'sit', face: [0, -1] }, run: { a: -13.0, b: 3.4, pose: 'walk', t: 1.0, face: [0.4, -1] }, fence: { a: -11.6, b: 2.0, pose: 'wave2', t: 0.5, look: 'car' } });
    } };

  /* ================= 11 · Vhod: varnostniki, policija, stojnica (Spa, ciljna ravnina pred La Source) ================= */
  S.vhod = { at: 170, side: -1, seed: 111, clear: [[0, 8, 15]], dist: { pred: 80, bliza: 40, mimo: 14 }, cam: { a: -6, b: 22, h: 9, ta: -1.5, tb: 6, th: 1.0, fov: 54 }, zoomPad: 4,
    build(C, F) {
      C.prop(L.gate({ sign: 'ENTRANCE · GATE 3' }), 1.0, 10.0, [0, -1]);
      for (const a of [-1.6, 3.6]) C.prop(L.flagPole([0xd8262a, 0xf2f2f2, 0xd8262a], 5.5), a, 9.4);
      C.prop(L.car(0xf2f2f2, { bar: 0x2f6bff, stripe: 0x1f4aa8 }), 8.0, 12.6, [0, -1]); C.prop(L.policeBike(), 6.2, 8.6, [1, -0.3]); for (const a of [4.6, 5.4]) C.prop(L.cone(), a, 7.4);
      C.prop(L.foodTruck(0xf0c22e), -8.2, 6.6, [0, -1]); C.prop(L.highTable(), -3.4, 4.2); C.prop(L.highTable(0xd8262a), -1.2, 5.4); C.prop(L.parasol(0xd8262a), -3.4, 4.2);
      C.prop(L.portaloo(0x2f63c9), -14.2, 9.6); C.prop(L.portaloo(0x2f63c9), -15.5, 9.6); C.prop(L.bin(), -5.3, 5.3); C.prop(L.bin(0xd8262a), -12.0, 4.6);
      const SEC = { shirt: 0x15171c, pants: 0x15171c, vest: 0xf5e21a, stripes: 0xc9ccd2 }, POL = { shirt: 0x1f2c48, pants: 0x1f2c48, long: true, hat: 'police', hatCol: 0x1f2c48, vest: 0xd9f02a };
      C.man(Object.assign({ hair: 'bald' }, SEC), { act: { a: -0.4, b: 9.7, pose: 'hips', face: [0, 1] }, run: false, fence: { a: -0.4, b: 9.5, pose: 'arms', look: 'car' } });
      C.man({ shirt: 0xd23a2c, pants: 0x2f3f63, hat: 'cap', hatCol: 0xd23a2c }, { act: { a: -0.4, b: 10.6, pose: 'carry', face: [0, -1], hold: [['bag', 1, { c: 0x2a3d6b }]] }, run: { a: -0.3, b: 9.0, pose: 'walk', t: 1.0, face: [0, -1], hold: [['bag', 1, { c: 0x2a3d6b }]] }, fence: { a: 0.6, b: 0.9, pose: 'cheer', t: 0.5 } });
      C.man(Object.assign({}, POL), { act: { a: 3.6, b: 8.0, pose: 'direct', face: [-1, -0.2], hold: [['baton', 1]] }, run: false, fence: { a: 3.6, b: 8.0, pose: 'wave', t: 0.4, look: 'car' } });
      C.man(Object.assign({}, POL, { hat: null, hair: 'short' }), { act: { a: 6.3, b: 11.2, pose: 'arms', face: [0, -1] }, run: false, fence: { a: 6.3, b: 11.2, pose: 'arms', look: 'car' } });
      C.man({ shirt: 0xf2f2ee, pants: 0x262a33, vest: 0xd8262a, stripes: 0xd8262a, hat: 'cap', hatCol: 0xf2f2ee }, { act: { a: -8.8, b: 7.0, y: 0.25, pose: 'grill', face: [0, -1], hold: [['tongs', 1]] }, run: false, fence: { a: -8.8, b: 7.0, y: 0.25, pose: 'wave', t: 0.5, look: 'car' } });
      C.man({ shirt: 0x2f9a48, pants: 0x47494f }, { act: { a: -8.8, b: 4.9, pose: 'stand', face: [0, 1] }, run: { f: 0.5 }, fence: { a: -5.0, b: 0.9, pose: 'cheer', t: 1.0 } });
      C.man({ shirt: 0x8a3b8c, pants: 0x2f3f63, hair: 'long' }, { act: { a: -8.6, b: 4.1, pose: 'phone', face: [0, 1], hold: [['phone', 1]] }, run: { f: 0.42, pose: 'walk', t: 0.6 }, fence: { a: -3.6, b: 0.95, pose: 'phoneUp', hold: [['phone', 1]] } });
      C.man({ shirt: 0xf0c22e, pants: 0x1d1f25, hat: 'cap', hatCol: 0x2f63c9 }, { act: { a: -3.4, b: 3.7, pose: 'drink', face: [0, 1], hold: [['cup', 1, { c: 0xd8262a }]] }, fence: { a: -2.2, b: 0.9, pose: 'wave', t: 1.4, hold: [['cup', 1, { c: 0xd8262a }]] }, run: { f: 0.6 } });
      C.man({ shirt: 0x22848f, pants: 0x5b5040 }, { act: { a: -1.2, b: 4.8, pose: 'talk', face: [-1, -0.4], hold: [['cup', 1]] }, fence: { a: -1.0, b: 0.9, pose: 'cheer', t: 2.0, hold: [['cup', 1]] }, run: { f: 0.55 } });
    } };

  /* ================= 12 · Mehaniki v boksih (Bathurst, zid boksov na ciljni ravnini) ================= */
  S.boksi = { at: 70, side: -1, seed: 121, keepProps: true, clear: [],
    life: [['galah', 6, 2.0, 1, [1, 0]], ['galah', 6.5, 2.4, 1, [0, 1]], ['galah', 5.6, 2.6, 1, [-1, 0.3]], ['magpie', 9, 1.6, 1, [1, 0]]], dist: { zacetek: 44, bliza: 27, mimo: 11 }, cam: { a: -11, b: 9, h: 4.2, ta: 0.5, tb: 1.6, th: 1.3, fov: 54 },
    build(C, F) {
      const TEAM = { shirt: 0x1f63d8, pants: 0x1f63d8, long: true, belt: 0xf2f2f2, hat: 'cap', hatCol: 0x15171c, gloves: 0x15171c };
      C.prop(L.pitStand(0x1f63d8, 4.5), -6.0, 1.2, [0, -1], 'ps');
      C.prop(L.tyreStack(4, 0xd8262a), -0.8, 3.0); C.prop(L.tyreStack(3, 0xd8262a), -0.1, 3.2); C.prop(L.warmers(0x1f63d8), 2.4, 3.6, [1, 0]); C.prop(L.toolChest(0x1f63d8), 5.2, 2.6, [0, -1]);
      C.prop(L.trolley(), 1.4, 5.6, [1, 0]); C.prop(L.scooter(0x1f63d8), 7.2, 3.4, [1, -0.3]);
      C.man(Object.assign({}, TEAM), { act: { a: 0.6, b: 1.5, pose: 'talk', face: [0, -1], hold: [['radio', 1]] }, bliza: { pose: 'stand', look: 'car' }, run: false, fence: { a: 0.6, b: 0.8, pose: 'boardOut', look: 'car' } });
      C.man(Object.assign({}, TEAM), { act: { a: 0.3, b: 6.0, pose: 'push', face: [1, 0] }, fence: { a: 2.0, b: 0.85, pose: 'fenceWave', t: 0.6 }, run: { f: 0.55 } });
      C.man(Object.assign({}, TEAM, { hat: null }), { act: { a: -2.4, b: 4.6, pose: 'carryWalk', t: 0.5, face: [1, -0.3], hold: [['tire', 1]] }, fence: { a: -1.0, b: 0.85, pose: 'cheer', t: 1.0 }, run: { f: 0.6, hold: [] } });
      C.man(Object.assign({}, TEAM), { act: { a: 2.4, b: 4.55, pose: 'kneel', face: [0, -1] }, fence: { a: 3.4, b: 0.85, pose: 'fence' }, run: { f: 0.5 } });
      const ENG = { shirt: 0xf2f2f2, pants: 0x1f2c48, long: true, hat: 'cap', hatCol: 0x1f63d8 };
      for (const [x, k] of [[-1.6, 0], [-0.05, 1], [1.5, 2]]) C.man(Object.assign({}, ENG), { act: { on: 'ps', a: x, b: -0.25, y: 1.25, pose: 'sitLean' }, run: false, fence: { on: 'ps', a: x, b: -0.25, y: 1.25, pose: k === 1 ? 'thumbs' : 'sitLean' } });
      C.board = L.item('board', { lines: ['P3', 'L 4', '+1.2'] });
    },
    phase(C, ph, carL) {   // the pit board: out over the wall as you pass, its face to the oncoming car; the engineers' heads to the car
      const P = C.people[0], b = C.board, F = C.F; if (b.parent) b.parent.remove(b);
      if (ph === 'mimo' || ph === 'bliza') { const [x, z] = F.w(0.6, ph === 'mimo' ? -0.3 : 0.4), y = F.y(0.6, 0.8) + (ph === 'mimo' ? 1.75 : 1.2);
        b.position.set(x, y, z); b.scale.setScalar(1.6); C.root.add(b); const [cx, cz] = F.w(carL[0], carL[1]); b.lookAt(cx, y + 0.3, cz); b.rotateY(Math.PI / 2); }
      if (ph === 'bliza' || ph === 'mimo') for (const E of C.people.slice(4)) E.head.rotation.y = 0.9 * (C.F.side > 0 ? 1 : -1);
    } };

  return { build, phase, clear, S, roomSide };
})();
