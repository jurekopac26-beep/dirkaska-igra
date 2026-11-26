// Garaža: menjava VZMETI z obema rokama (del I1 k #1084, po regalTwoShow v js/garage3d.js).
// Noben del brez roke: roka 1 stisne staro vzmet (stiskalnica na prijemalu), jo sname in jo z mostom odnese k regalu, kjer jo pred
// odložitvijo spet sprosti; roka 2 vzame novo z regala, jo med polobratom mosta stisne, jo posadi v ležišče in sprosti (vzmet se raztegne
// in malo zaniha), nato privije zgornje vijake; šele potem jo spusti. Koraki v vrstici (hud 'fit'): plan, off, grab, pass, put, swap,
// snap, screws, down (stavki iz SAY.def v js/garage.js).
// Klic iz fitPart (ena vrstica v js/garage3d.js): GarazaAnim.vzmeti(K, C); K: notranjosti Garage3D (cur, lift: getterja), C kot pri
// regalTwoShow (brez te datoteke ostane regalTwoShow).
(function (g) {
  const A = g.GarazaAnim = g.GarazaAnim || {};
  const SQ = 0.62;   // (stisnjena vzmet: delež dolžine)
  // (vzmet v roki: njene mreže stisnjene po osi y (v okvirju dela je y pokonci) na k dolžine, malo širše)
  const squash = (o, k) => { if (o) o.children.forEach((m) => { m.scale.set(1 + (1 - k) * 0.12, k, 1 + (1 - k) * 0.12); }); };
  A.vzmeti = function* (K, C) {
    const { THREE, EZ, ARM, BRG, RB, RGL, FIT, LIFT, SFX, puffs, rnd, poseBridge, passMk, spawn, par, wait, tween, waitFor, armTool, tyrePass,
      camTo, armExt, poseArm, tipM, tipLen, rglCopy, rglHide, hold, letGo, disposeTree, fitSwap, settle, deliKey, lowerCar, armsTo, carriageTo,
      bridgeRest, armRest, hud, home, rglUnstay, liftUp, spotView, view, fitLog } = K;
    const { cv, nw, el, o, pc, grab, tool, hs, V1, R } = C, { gp, pp, PL, S, up } = R, cpS = (q) => Object.assign({}, q);
    const pk = (j) => ({ s: Object.assign({ y: ARM.Y0, yaw: 0, pitch: Math.PI / 2 }, ARM.park[j]), ext: 0 });
    const hr = Math.min(0.3, Math.max(hs.y, hs.z) + 0.04), V2 = spotView(S);
    const VW = view({ at: [(pp.s.x + gp.s.x) / 2, 1.5, (pp.s.z + gp.s.z) / 2], yaw: -0.75, pitch: 0.32, dist: 6.4, fov: 42 });
    BRG.free = true; poseBridge(); BRG.p.copy(BRG.c); FIT.pass = [];
    const ps = (j) => RB[j].tool === tool ? cpS(RB[j].s) : Object.assign(cpS(RB[j].s), { y: ARM.Y0, pitch: 0 }), e0 = (j) => RB[j].tool === tool ? RB[j].ext : 0;
    const P0 = passMk([ps(0), ps(1)], [e0(0), e0(1)], [pp, gp], [0, 0]);
    const PS = passMk([cpS(pp.s), cpS(gp.s)], [pp.ext, gp.ext], [gp, pp], [hr, hr]);
    const PK = passMk([cpS(gp.s), cpS(pp.s)], [gp.ext, pp.ext], [pk(0), pk(1)], [0, 0]);
    let fin = false, raised = !up; spawn((function* () { for (const P of [P0, PS, PK]) while (!P.r && !P.sync && !fin) { P.g.next(); yield; } })());
    const puff = (n) => { for (let k = 0; k < (n || 8); k++) puffs.emit(S.p.x, S.p.y, S.p.z, S.out.x * rnd(0.2, 0.8) + rnd(-0.3, 0.3), rnd(0.1, 0.6), S.out.z * rnd(0.2, 0.8) + rnd(-0.3, 0.3), 0.55, 0.1, 0.45, [0.78, 0.78, 0.8], 0.35, -0.2, 2.2, 0.02); };
    // (stara vzmet v roki 1: kos iz regala, tovarniška posivljena kot obrabljena)
    const old = () => { const q = rglCopy(pc); if (!o.from) q.traverse((m) => { const c = m.isMesh && m.geometry.attributes.color; if (!c) return; const B = c.array, n = c.itemSize;
      for (let v = 0; v < B.length; v += n) { const l = 0.25 + (B[v] * 0.3 + B[v + 1] * 0.59 + B[v + 2] * 0.11) * 0.45; B[v] = l; B[v + 1] = l * 1.01; B[v + 2] = l * 1.04; } c.needsUpdate = true; }); return q; };
    // (stiskalnica: vzmet v roki gre od a do b dolžine, vijačnik vrti; sprostitev z nihajem)
    const press = function* (q, a, b, s) { SFX.wrench(); yield* tween(s, (k) => squash(q, a + (b - a) * k), EZ.sine); };
    const spring = function* (q, a) { SFX.servo(0.3); yield* tween(0.42, (k) => squash(q, 1 + (a - 1) * Math.exp(-5 * k) * Math.cos(k * 3.3 * Math.PI)), (k) => k); squash(q, 1); };
    // 1: avto gor za kolo, roki se zbudita, most se zavrti: roka 1 k vzmeti, roka 2 nad regal
    if (up) spawn((function* () { yield* liftUp(cv, up, false, 0.35); raised = true; })());
    yield* par(armTool(0, tool, 4), armTool(1, tool, 4));
    yield* par(tyrePass(pp, gp, 0.8, null, P0), camTo(V2, 0.8));
    yield* waitFor(() => raised, 8);
    // 2: roka 1 prime staro vzmet, jo stisne in sname
    yield* armExt(0, PL.s, PL.ext, 0.3, EZ.sine); poseArm(0);
    const Mh = tipM(RB[0].s, tipLen(RB[0])).multiply(PL.off), so = old(); so.matrix.copy(Mh); so.matrixWorldNeedsUpdate = true;
    hold(0, so, Mh); yield* press(so, 1, SQ, 0.55); puff(10); SFX.clunk(0.4); fitLog('off', { i: 0 });
    // 3: roka 1 ven z njo, roka 2 vzame novo z regala
    yield* par(armExt(0, pp.s, pp.ext, 0.3), camTo(V1, 0.5), armExt(1, grab.s, grab.ext, 0.4));
    const sn = rglCopy(pc); rglHide(pc, true); pc.take = FIT.n; hold(1, sn, pc.M); SFX.clunk(0.3); fitLog('grab', { i: 1, rgl: +RGL.P.k.toFixed(2) });
    yield* armExt(1, gp.s, gp.ext, 0.3);
    // 4: most za pol kroga; med obratom roka 2 stisne novo vzmet
    fitLog('pass'); yield* par(camTo(VW, 0.5), tyrePass(gp, pp, 0.9, [[0, grab.off, hr], [1, PL.off, hr]], PS), (function* () { yield* wait(0.2); yield* press(sn, 1, SQ, 0.55); })());
    // 5: roka 1 sprosti staro vzmet nad regalom in jo postavi na prazno mesto
    yield* par(camTo(V1, 0.45), armExt(0, grab.s, grab.ext, 0.4), press(so, SQ, 1, 0.4)); squash(so, 1); poseArm(0);
    RGL.ret.push(letGo(0)); SFX.clunk(0.3); fitLog('put', { i: 0, where: 'regal' });
    // 6: roka 1 nazaj, roka 2 posadi stisnjeno novo vzmet v ležišče (avto je od tu nov)
    yield* par(camTo(V2, 0.45), armExt(0, gp.s, gp.ext, 0.3), armExt(1, PL.s, PL.ext, 0.45, EZ.sine));
    SFX.clunk(0.5); fitSwap(cv, nw, true); const car = K.cur; if (!up) spawn(settle(car, 0.01));
    fitLog('swap', { i: 1, deli: deliKey(car.spec), car: car === nw, old: 'regal' });
    // 7: roka 2 sprosti vzmet: raztegne se v ležišču in zaniha; zgornji vijaki
    yield* wait(0.12); yield* spring(sn, SQ); puff(6); fitLog('snap', { i: 1 });
    for (let k = 0; k < 2; k++) { SFX.wrench(); yield* wait(0.22); } fitLog('screws');
    // 8: roka 2 spusti vzmet (na avtu je skrita) in gre ven, avto dol, roki domov z mostom, KONČANO
    disposeTree(letGo(1)); yield* armExt(1, pp.s, pp.ext, 0.3, EZ.sine);
    let stowed = !up, off = false;
    if (up) spawn((function* () { yield* lowerCar(K.cur, false, 0.5); yield* armsTo(0, 1.1); yield* carriageTo(LIFT.c0, 0.25); stowed = true; })());
    spawn((function* () { yield* tyrePass(PK.Q[0], PK.Q[1], 1.0, null, PK); bridgeRest(); yield* par(armRest(0, 2.0), armRest(1, 2.0)); off = true; })());
    if (up) { yield* waitFor(() => K.lift < 1e-3, 3); fitLog('down'); }
    SFX.ping(1760); hud('done', { kind: el });
    yield* waitFor(() => off && stowed, 6); fin = true; yield* par(home(1.4), rglUnstay(1.4));
  };
})(typeof self !== 'undefined' ? self : this);
