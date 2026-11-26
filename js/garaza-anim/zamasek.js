/* Garaža · ZAMAŠEK (#1084, del I4; docs/garaza-animacije.md): the fuel cap by both arms, each hand on the ring ("noben del brez roke").
   Roka 1's reach grips the old cap by its ring, turns it off in three clicks (the wrist turning with it) and draws it out of the filler
   neck (the neck dark and open meanwhile); the regal's half turn as regalTwoShow (js/garage3d.js); roka 2 sets the new one on the neck and
   turns it on in three clicks, a last one as it seats. Each step in the bar of steps (hud 'fit': FIT.log grip, unscrew, ..., seat, screw).
   Called from the one hook line in js/garage3d.js (before regalTwoShow) with C (the show's own) and X (the garage's fixtures and tasks);
   loaded by garaza.html after js/garage3d.js. The shared helpers (hop, toss, ARM, RGL) are not changed here. */
(function () {
  'use strict';
  const GA = window.GarazaAnim = window.GarazaAnim || {};
  const tr = (s) => (window.Lang && Lang.tr ? Lang.tr(s) : s);
  // (the bar's line for a step of its own: garage.js knows only its keys (barSay keeps the line for one it does not know), so it is set here)
  const LAB = { grip: () => tr('Roka 1 prime stari zamašek za obroč'), unscrew: () => tr('Roka 1 odvije stari zamašek'),
    seat: () => tr('Roka 2 nastavi nov zamašek na grlo'), screw: () => tr('Roka 2 privije nov zamašek · klik') };
  const say = (X, k, x) => { X.fitLog(k, x); const l = document.querySelector('#g-steps .l'); if (l && LAB[k]) l.textContent = LAB[k](); };

  GA.zamasek = function* (C, X) {
    const { THREE, V3, RB, ARM, BRG, FIT, RGL, EZ, SFX, spawn, par, wait, waitFor, tween } = X;
    const { cv, nw, el, o, pc, grab, tool, hs, V1, R } = C, { gp, pp, PL, S, up } = R, cpS = (q) => Object.assign({}, q), TAU = Math.PI * 2;
    const pk = (j) => ({ s: Object.assign({ y: ARM.Y0, yaw: 0, pitch: Math.PI / 2 }, ARM.park[j]), ext: 0 });
    // the cap's place: as the car draws it (Render.deliMesh: its middle in the body's frame) when it is on this side near the planned spot,
    // the arm's state moved by as much (else partSpot's guess)
    const out = S.out.clone().normalize(), cap = S.p.clone(), nOpt = Math.round(+((nw.spec && nw.spec.deli && nw.spec.deli.zamasek) || 0)), B = cv.v && cv.v.bodyG;
    let rr = 0.045;   // (the ring's radius)
    let g = null; try { g = nOpt && window.Render && Render.deliMesh ? Render.deliMesh(cv.M, 'zamasek', nOpt, cv.spec.color) : null; } catch (_) { g = null; }
    if (g && B) { const b = new THREE.Box3(); g.traverse((q) => { if (q.isMesh) { q.geometry.computeBoundingBox(); b.union(q.geometry.boundingBox); } });
      B.updateMatrixWorld(true); const q = B.localToWorld(b.getCenter(new V3())), d = q.clone().sub(S.p);
      const bs = b.getSize(new V3());
      rr = Math.max(0.03, Math.min(0.08, Math.max(bs.x, bs.y) / 2.5));
      const dn = d.dot(out); d.addScaledVector(out, -dn);
      if (d.length() < 0.35 && Math.abs(dn) < 0.15) { cap.copy(q).addScaledVector(out, -dn); PL.s.x += d.x; PL.s.y += d.y; PL.s.z += d.z; } }
    // (the caps by the car: drawn here, a ring of knurled metal under a body with its grip bar, the axis along out (the regal's piece is a
    // boxed one, only in a hand between regal and car); ch: the middle off the skin)
    const CH = 0.022, ch = CH / 2 + 0.002, qO = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), out), one = new V3(1, 1, 1);
    const capAt = (d) => cap.clone().addScaledVector(out, d), capW = (d) => new THREE.Matrix4().compose(capAt(d), qO, one);
    const mkCap = (col, ring) => { const g = new THREE.Group(), m = (geo, c, y) => { const q = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: c, shininess: 70 })); q.material.userData.own = true; q.position.y = y; q.castShadow = true; g.add(q); };
      m(new THREE.CylinderGeometry(rr * 1.08, rr * 1.08, 0.008, 24), ring, -CH / 2 + 0.004); m(new THREE.CylinderGeometry(rr * 0.9, rr, CH - 0.008, 24), col, 0.004);
      m(new THREE.BoxGeometry(rr * 1.5, 0.01, 0.014), col, CH / 2 + 0.003); g.matrixAutoUpdate = false; X.scene.add(g); return g; };
    // (the new one's colour: the regal piece's boldest)
    let ncol = 0xc4161c; { let best = 0.25; const tc = X.rglCopy(pc); tc.traverse((q) => { const c = q.isMesh && q.geometry.attributes.color; if (!c) return; const A = c.array, n = c.itemSize, col = new THREE.Color();
      for (let v = 0; v < A.length; v += n) { const sat = Math.max(A[v], A[v + 1], A[v + 2]) - Math.min(A[v], A[v + 1], A[v + 2]); if (sat > best) { best = sat; ncol = col.setRGB(A[v], A[v + 1], A[v + 2]).getHex(); } } }); X.disposeTree(tc); }
    const oc = mkCap(o.from ? 0x9aa2ae : 0x5c6066, 0x8a9099); oc.matrix.copy(capW(ch)); oc.matrixWorldNeedsUpdate = true;
    // (an arm's state with its tool's tip at P: the tip moves with the state's x, y, z as they are)
    const tipTo = (i, s0, P) => { const q = cpS(s0), t = new V3().setFromMatrixPosition(X.tipM(q, X.tipLen(RB[i]))); q.x += P.x - t.x; q.y += P.y - t.y; q.z += P.z - t.z; return q; };
    const hr = Math.min(0.3, Math.max(hs.y, hs.z) + 0.04), V2 = X.spotView(S);
    const VC = Object.assign({}, V2, { dist: Math.max(1.5, V2.dist * 0.5), tx: cap.x, ty: cap.y, tz: cap.z });   // (close to the cap as it turns)
    const VW = X.view({ at: [(pp.s.x + gp.s.x) / 2, 1.5, (pp.s.z + gp.s.z) / 2], yaw: -0.75, pitch: 0.32, dist: 6.4, fov: 42 });
    BRG.free = true; X.poseBridge(); BRG.p.copy(BRG.c); FIT.pass = [];
    const ps = (j) => RB[j].tool === tool ? cpS(RB[j].s) : Object.assign(cpS(RB[j].s), { y: ARM.Y0, pitch: 0 }), e0 = (j) => RB[j].tool === tool ? RB[j].ext : 0;
    const P0 = X.passMk([ps(0), ps(1)], [e0(0), e0(1)], [pp, gp], [0, 0]);
    const PS = X.passMk([cpS(pp.s), cpS(gp.s)], [pp.ext, gp.ext], [gp, pp], [hr, hr]);
    const PK = X.passMk([cpS(gp.s), cpS(pp.s)], [gp.ext, pp.ext], [pk(0), pk(1)], [0, 0]);
    let fin = false, raised = !up; spawn((function* () { for (const P of [P0, PS, PK]) while (!P.r && !P.sync && !fin) { P.g.next(); yield; } })());
    const puff = (n) => { for (let k = 0; k < (n || 6); k++) X.puffs.emit(cap.x, cap.y, cap.z, out.x * X.rnd(0.1, 0.4) + X.rnd(-0.15, 0.15), X.rnd(0.05, 0.3), out.z * X.rnd(0.1, 0.4) + X.rnd(-0.15, 0.15), 0.4, 0.06, 0.3, [0.78, 0.78, 0.8], 0.25, -0.2, 1.6, 0.015); };
    const old = () => { const g = X.rglCopy(pc); if (!o.from) g.traverse((q) => { const c = q.isMesh && q.geometry.attributes.color; if (!c) return; const A = c.array, n = c.itemSize;
      for (let v = 0; v < A.length; v += n) { const l = 0.25 + (A[v] * 0.3 + A[v + 1] * 0.59 + A[v + 2] * 0.11) * 0.45; A[v] = l; A[v + 1] = l * 1.01; A[v + 2] = l * 1.04; } c.needsUpdate = true; }); return g; };
    // (the open filler neck as the cap is off: a dark disc over the body's baked cap, its throat darker)
    const neck = new THREE.Group(), mk = (r, col, dz) => { const g = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: col })); g.material.userData.own = true; g.position.z = dz; neck.add(g); };
    mk(rr * (g ? 1.7 : 1.3), 0x2a2c30, 0); mk(rr * 0.95, 0x7b8088, 0.0002); mk(rr * 0.7, 0x0c0c0e, 0.0005);
    neck.position.copy(cap).addScaledVector(out, 0.003); neck.quaternion.setFromUnitVectors(new V3(0, 0, 1), out); neck.visible = false; X.scene.add(neck);
    // (a held cap turned about the neck's axis (out, through the cap's middle) by a radians (+ to the left as one looks at it) and drawn
    // out d along it, in the world: its place in the jaws set each frame from that (the arm stands still as it turns))
    const turner = (i) => { const A = RB[i], H = A.held, F0 = X.tipM(A.s, X.tipLen(A)), W0 = F0.clone().multiply(H.b && H.k >= 1 ? H.b : H.a), Fi = F0.clone().invert(), W = new THREE.Matrix4(), M = new THREE.Matrix4();
      return (a, d) => { if (!A.held) return; W.makeTranslation(cap.x + out.x * d, cap.y + out.y * d, cap.z + out.z * d).multiply(M.makeRotationAxis(out, a))
        .multiply(M.makeTranslation(-cap.x, -cap.y, -cap.z)).multiply(W0); H.b = null; H.k = 0; H.a.copy(Fi).multiply(W); A.dirty = true; }; };
    const turns = function* (i, dir, d0, d1, clicks) { const f = turner(i), n = clicks.length;
      for (let k = 0; k < n; k++) { yield* tween(0.3, (u) => f(dir * (k + u) * TAU / n, d0 + (d1 - d0) * (k + u) / n), EZ.io); SFX.click(); if (clicks[k]) X.glint(cap, 0.12, 0xffffff); yield* wait(0.08); }
      f(0, d1); };
    // 1: both arms awake, the bridge round (the car up if it must), roka 1 by the cap, roka 2 over the regal
    if (up) spawn((function* () { yield* X.liftUp(cv, up, false, 0.35); raised = true; })());
    yield* par(X.armTool(0, tool, 4), X.armTool(1, tool, 4));
    yield* par(X.tyrePass(pp, gp, 0.8, null, P0), X.camTo(V2, 0.8));
    yield* waitFor(() => raised, 8);
    // 2: roka 1 in close to the cap, its jaws on the ring
    const s1 = tipTo(0, PL.s, capAt(ch)), pre = tipTo(0, PL.s, capAt(ch + 0.06));
    yield* par(X.armExt(0, pre, PL.ext, 0.35, EZ.sine), X.camTo(VC, 0.5)); yield* X.armExt(0, s1, PL.ext, 0.25, EZ.sine); X.poseArm(0);
    X.hold(0, oc, capW(ch)); SFX.click(); say(X, 'grip');
    // 3: the old cap off: three clicks to the left, out of its thread, the neck open
    say(X, 'unscrew'); yield* turns(0, 1, 0, 0.012, [0, 0, 1]); neck.visible = true; puff(5); X.fitLog('off');
    // 4: roka 1 out with it as roka 2 lifts the new one off the regal, the camera to the regal
    yield* par(X.armExt(0, pp.s, pp.ext, 0.3), X.camTo(V1, 0.5), X.armExt(1, grab.s, grab.ext, 0.4));
    { X.disposeTree(X.letGo(0)); const so = old(), M = X.tipM(RB[0].s, X.tipLen(RB[0])).multiply(PL.off); so.matrix.copy(M); so.matrixWorldNeedsUpdate = true; X.hold(0, so, M); }   // (as the regal's piece)
    { const cp = X.rglCopy(pc); X.rglHide(pc, true); pc.take = FIT.n; X.hold(1, cp, pc.M); } SFX.clunk(0.3); X.fitLog('grab', { rgl: +RGL.P.k.toFixed(2) });
    yield* X.armExt(1, gp.s, gp.ext, 0.3);
    // 5: the bridge half round, each cap turned in its hand as it is to go
    X.fitLog('pass'); yield* par(X.camTo(VW, 0.5), X.tyrePass(gp, pp, 0.9, [[0, grab.off, hr], [1, PL.off, hr]], PS));
    // 6: roka 1 stands the old one in the empty place
    yield* par(X.camTo(V1, 0.45), X.armExt(0, grab.s, grab.ext, 0.4)); X.poseArm(0); RGL.ret.push(X.letGo(0)); SFX.clunk(0.3); X.fitLog('put', { where: 'regal' });
    // 7: roka 2's piece out of its box as the camera is at the regal (the drawn cap in its jaws, held as it will be on the neck); roka 1 back
    // as roka 2 brings it to the neck, set on it out of the thread
    const pre2 = tipTo(1, PL.s, capAt(ch + 0.012)), nc = mkCap(ncol, 0xb8bec8);
    { const off = X.tipM(pre2, X.tipLen(RB[1])).invert().multiply(capW(ch + 0.012)); X.disposeTree(X.letGo(1)); X.hold(1, nc, X.tipM(RB[1].s, X.tipLen(RB[1])).multiply(off)); }
    yield* par(X.camTo(VC, 0.5), X.armExt(0, gp.s, gp.ext, 0.3), X.armExt(1, pre2, PL.ext, 0.45, EZ.sine)); X.poseArm(1);
    say(X, 'seat'); yield* wait(0.15);
    // 8: on it goes: three clicks to the right, drawn in onto its seat (the arm's tip in with it), the last click and its glint
    say(X, 'screw'); yield* turns(1, -1, 0, -0.012, [0, 0, 1]);
    const kept = X.letGo(1); X.fitSwap(cv, nw, true); neck.visible = false; if (!up) spawn(X.settle(X.cur, 0.01));
    { const Bn = X.cur.v && X.cur.v.bodyG; if (!g && Bn) { kept.matrixAutoUpdate = true; kept.matrix.decompose(kept.position, kept.quaternion, kept.scale); Bn.attach(kept); } else X.disposeTree(kept); }   // (a car with no cap of its own keeps the drawn one)
    X.fitLog('swap', { deli: X.deliKey(X.cur.spec), car: X.cur === nw, old: 'regal' });
    // 9: roka 2 out, the car down (the lift stowed after), the arms home with the bridge, KONČANO
    yield* wait(0.15); yield* par(X.armExt(1, pp.s, pp.ext, 0.3, EZ.sine), X.camTo(V2, 0.5));
    let stowed = !up, off = false;
    if (up) spawn((function* () { yield* X.lowerCar(X.cur, false, 0.5); yield* X.armsTo(0, 1.1); yield* X.carriageTo(X.LIFT.c0, 0.25); stowed = true; })());
    spawn((function* () { yield* X.tyrePass(PK.Q[0], PK.Q[1], 1.0, null, PK); X.bridgeRest(); yield* par(X.armRest(0, 2.0), X.armRest(1, 2.0)); off = true; })());
    if (up) { yield* waitFor(() => X.lift < 1e-3, 3); X.fitLog('down'); }
    X.scene.remove(neck); X.disposeTree(neck);
    SFX.ping(1760); X.hud('done', { kind: el });
    yield* waitFor(() => off && stowed, 6); fin = true; yield* par(X.home(1.4), X.rglUnstay(1.4));
  };
})();
