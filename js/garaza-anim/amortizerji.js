// Garaža: montaža amortizerjev z obema rokama (#1084, del I2). Klic iz fitPart (js/garage3d.js, ena vrstica pred regalTwoShow):
// GarazaAnim.amortizerji(C, H) — C kot pri regalTwoShow, H notranja orodja garaže (cur, lift, puffs, hud kot getterji).
// Po predlogi regalTwoShow: avto gor, roka 1 odvije zgornjo matico in sname starega, roka 2 vzame novega z regala in ga dvakrat
// stisne (preizkus), most pol kroga, roka 1 postavi starega v regal, roka 2 namesti novega in privije matico, avto dol, preizkus nihanja.
// Noben del se ne premakne brez roke. Stavki za vrstico korakov: lastni koraki (stisk, nihaj) brez vnosa v SAY (garage.js) se
// napišejo neposredno v #g-steps .l; matica gre prek obstoječega koraka 'screws'.
(function () {
  'use strict';
  const say = (s) => { if (typeof document === 'undefined') return; const l = document.querySelector('#g-steps.on .l'); if (l) l.textContent = typeof Lang !== 'undefined' ? Lang.tr(s) : s; };
  function* amortizerji(C, H) {
    const { THREE, EZ, ARM, BRG, RB, RGL, FIT, LIFT, SFX, spawn, par, wait, waitFor, view, camTo, home, spotView, poseBridge, passMk, tyrePass,
      armTool, armExt, poseArm, tipM, tipLen, hold, holdTo, letGo, rglCopy, rglHide, rglUnstay, disposeTree, fitSwap, fitLog, deliKey,
      liftUp, lowerCar, armsTo, carriageTo, bridgeRest, armRest, settle, tween, rnd } = H;
    const { cv, nw, el, o, pc, grab, tool, hs, V1, R } = C, { gp, pp, PL, S, up } = R, cpS = (q) => Object.assign({}, q), pk = (j) => ({ s: Object.assign({ y: ARM.Y0, yaw: 0, pitch: Math.PI / 2 }, ARM.park[j]), ext: 0 });
    const hr = Math.min(0.3, Math.max(hs.y, hs.z) + 0.04), V2 = spotView(S);
    const VW = view({ at: [(pp.s.x + gp.s.x) / 2, 1.5, (pp.s.z + gp.s.z) / 2], yaw: -0.75, pitch: 0.32, dist: 6.4, fov: 42 });
    BRG.free = true; poseBridge(); BRG.p.copy(BRG.c); FIT.pass = [];
    const ps = (j) => RB[j].tool === tool ? cpS(RB[j].s) : Object.assign(cpS(RB[j].s), { y: ARM.Y0, pitch: 0 }), e0 = (j) => RB[j].tool === tool ? RB[j].ext : 0;
    const P0 = passMk([ps(0), ps(1)], [e0(0), e0(1)], [pp, gp], [0, 0]);
    const PS = passMk([cpS(pp.s), cpS(gp.s)], [pp.ext, gp.ext], [gp, pp], [hr, hr]);
    const PK = passMk([cpS(gp.s), cpS(pp.s)], [gp.ext, pp.ext], [pk(0), pk(1)], [0, 0]);
    let fin = false, raised = !up; spawn((function* () { for (const P of [P0, PS, PK]) while (!P.r && !P.sync && !fin) { P.g.next(); yield; } })());
    const puff = () => { const F = H.puffs; if (!F) return; for (let k = 0; k < 10; k++) F.emit(S.p.x, S.p.y, S.p.z, S.out.x * rnd(0.2, 0.8) + rnd(-0.3, 0.3), rnd(0.1, 0.6), S.out.z * rnd(0.2, 0.8) + rnd(-0.3, 0.3), 0.55, 0.1, 0.45, [0.78, 0.78, 0.8], 0.35, -0.2, 2.2, 0.02); };
    // (stari amortizer v roki 1: kos z regala, tovarniški posivljen kot obrabljen)
    const old = () => { const g = rglCopy(pc); if (!o.from) g.traverse((m) => { const c = m.isMesh && m.geometry.attributes.color; if (!c) return; const A = c.array, n = c.itemSize;
      for (let v = 0; v < A.length; v += n) { const l = 0.25 + (A[v] * 0.3 + A[v + 1] * 0.59 + A[v + 2] * 0.11) * 0.45; A[v] = l; A[v + 1] = l * 1.01; A[v + 2] = l * 1.04; } c.needsUpdate = true; }); return g; };
    // (ključ v roki: zapestje sem in tja ob vsakem zvoku, z matico vred)
    const turn = function* (i, q, n) { const y0 = q.yaw || 0; for (let k = 0; k < n; k++) { SFX.wrench(); yield* armExt(i, { yaw: y0 + 0.22 }, null, 0.16, EZ.sine); yield* armExt(i, { yaw: y0 }, null, 0.14, EZ.sine); } };
    // 1: avto gor, obe roki budni, most okrog: roka 1 k amortizerju, roka 2 nad regal
    if (up) spawn((function* () { yield* liftUp(cv, up, false, 0.35); raised = true; })());
    yield* par(armTool(0, tool, 4), armTool(1, tool, 4));
    yield* par(tyrePass(pp, gp, 0.8, null, P0), camTo(V2, 0.8));
    yield* waitFor(() => raised, 8);
    // 2: roka 1 odvije zgornjo matico in sname starega
    yield* armExt(0, PL.s, PL.ext, 0.3, EZ.sine); poseArm(0); yield* turn(0, PL.s, 2);
    const Mh = tipM(RB[0].s, tipLen(RB[0])).multiply(PL.off), so = old(); so.matrix.copy(Mh); so.matrixWorldNeedsUpdate = true;
    puff(); hold(0, so, Mh); fitLog('off');
    // 3: roka 1 ven z njim, roka 2 vzame novega z regala
    yield* par(armExt(0, pp.s, pp.ext, 0.3), camTo(V1, 0.5), armExt(1, grab.s, grab.ext, 0.4));
    { const cp = rglCopy(pc); rglHide(pc, true); pc.take = FIT.n; hold(1, cp, pc.M); } SFX.clunk(0.3); fitLog('grab', { rgl: +RGL.P.k.toFixed(2) });
    yield* armExt(1, gp.s, gp.ext, 0.3);
    // 4: preizkus novega: roka 2 ga dvakrat stisne po dolgi osi (bat noter, ven)
    { const Hd = RB[1].held, a0 = Hd.a.clone(), ax = hs.x >= hs.y && hs.x >= hs.z ? 0 : hs.y >= hs.z ? 1 : 2, sc = [1, 1, 1];
      sc[ax] = 0.78; const Sq = a0.clone().multiply(new THREE.Matrix4().makeScale(sc[0], sc[1], sc[2]));
      fitLog('stisk'); say('Roka 2 dvakrat stisne nov amortizer · preizkus');
      for (let k = 0; k < 2; k++) { yield* holdTo(1, Sq, 0.22); SFX.click(); yield* holdTo(1, a0.clone(), 0.3); } }
    // 5: most pol kroga, vsak del obrnjen, kot bo šel
    fitLog('pass'); yield* par(camTo(VW, 0.5), tyrePass(gp, pp, 0.9, [[0, grab.off, hr], [1, PL.off, hr]], PS));
    // 6: roka 1 postavi starega na prazno mesto v regalu
    yield* par(camTo(V1, 0.45), armExt(0, grab.s, grab.ext, 0.4)); poseArm(0); RGL.ret.push(letGo(0)); SFX.clunk(0.3); fitLog('put', { where: 'regal' });
    // 7: roka 1 nazaj, roka 2 namesti novega (avto ima od tu novega) in privije matico
    yield* par(camTo(V2, 0.45), armExt(0, gp.s, gp.ext, 0.3), armExt(1, PL.s, PL.ext, 0.45, EZ.sine));
    puff(); SFX.clunk(0.5); disposeTree(letGo(1)); fitSwap(cv, nw, true); if (!up) spawn(settle(H.cur, 0.01));
    fitLog('swap', { deli: deliKey(H.cur.spec), car: H.cur === nw, old: 'regal' });
    yield* wait(0.15); yield* turn(1, PL.s, 3); fitLog('screws');
    yield* armExt(1, pp.s, pp.ext, 0.3, EZ.sine);
    // 8: avto dol, roki domov z mostom; preizkus: karoserija pritisnjena in spuščena, nov amortizer jo umiri
    let stowed = !up, off = false;
    if (up) spawn((function* () { yield* lowerCar(H.cur, false, 0.5); yield* armsTo(0, 1.1); yield* carriageTo(LIFT.c0, 0.25); stowed = true; })());
    spawn((function* () { yield* tyrePass(PK.Q[0], PK.Q[1], 1.0, null, PK); bridgeRest(); yield* par(armRest(0, 2.0), armRest(1, 2.0)); off = true; })());
    if (up) { yield* waitFor(() => H.lift < 1e-3, 3); fitLog('down'); }
    { const c = H.cur; fitLog('nihaj'); say('Preizkus: avto se zaniha, nov amortizer ga umiri');
      yield* tween(0.3, (k) => { c.bounce = -0.035 * k; }, EZ.io); SFX.clunk(0.4); yield* settle(c, 0.035, 1.3); }
    SFX.ping(1760); H.hud('done', { kind: el });
    yield* waitFor(() => off && stowed, 6); fin = true; yield* par(home(1.4), rglUnstay(1.4));
  }
  const G = (typeof window !== 'undefined' ? window : globalThis);
  G.GarazaAnim = G.GarazaAnim || {}; G.GarazaAnim.amortizerji = amortizerji;
})();
