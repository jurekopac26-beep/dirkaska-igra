// Garaža, animacija STABILIZATORJI (I3 k #1084, docs/garaza-animacije.md): the anti-roll bars' own show on the regal's two-arm plan
// (regalTwoPlan in js/garage3d.js). The car up on the lift (0,55 m), both arms on the ring: roka 1 reaches the old bar by the wheel and
// undoes its drop link and its bush clamp (two nuts, the wrench's sound and sparks), takes the bar off; roka 2 lifts the new one off the
// regal; the bridge's half turn; roka 1 stands the old one in the empty place; roka 2 puts the new one on and does the link and the clamp
// up; the car down, the arms home, KONČANO. No part without a hand: the old one in roka 1's from its off to the regal, the new one in
// roka 2's from the regal to the car.
// Called from fitPart (js/garage3d.js, one line before regalTwoShow) with the show's C (as regalTwoShow's) and H: the garage's own helpers
// (passed, not changed). The steps (FIT.log, hud 'fit'): plan, links, off, grab, pass, put, swap, bolts, down; their sentences in the bar
// of steps by this file (sayBar: js/garage.js's SAY has no anti-roll bar's; its stages STG.def), English in js/lang.js.
(function () {
  'use strict';
  const tr = (s, ...a) => (typeof Lang !== 'undefined' && Lang.tr ? Lang.tr(s, ...a) : s);
  const STAGES = ['Izberi', 'Snemanje', 'Menjava', 'Montaža'];   // (STG.def of js/garage.js, then Končano)
  // (the step's sentence and its stage in the page's bar, after garage.js drew its own for the same step: the anti-roll bar's words)
  const SAY = {
    plan: () => [1, tr('Kupljeno · avto gre na dvigalko, roki se zbudita')],
    links: () => [1, tr('Roka 1 odvije spojko in objemko stabilizatorja')],
    off: () => [1, tr('Roka 1 sname stari stabilizator')],
    grab: () => [2, tr('Roka 2 vzame nov stabilizator z regala')],
    pass: () => [2, tr('Most se zavrti za pol kroga: stari stabilizator k regalu, nov k avtu')],
    put: () => [3, tr('Roka 1 postavi stari stabilizator na prazno mesto v regalu')],
    swap: () => [3, tr('Roka 2 namesti nov stabilizator ob kolesu')],
    bolts: () => [3, tr('Roka 2 privije spojko in objemko · stabilizator je pritrjen')],
    down: () => [3, tr('Avto dol · roki gresta počivat')] };
  function sayBar(step) {
    if (typeof document === 'undefined' || !SAY[step]) return;
    const el = document.getElementById('g-steps'); if (!el || !el.classList.contains('on')) return;
    const [st, text] = SAY[step](), d = el.querySelector('.d'), l = el.querySelector('.l');
    if (l) l.textContent = text;
    if (d) { const N = STAGES.length, cur = d.querySelectorAll('i'); let at = -1; cur.forEach((x, i) => { if (x.classList.contains('on')) at = i; });
      if (at >= 0 && at < st && st < N) d.innerHTML = STAGES.concat(['Končano']).map((s, i) => i < st ? '<i class="ok">✓</i>' : i === st ? '<i class="on">' + (i + 1) + ' ' + tr(s) + '</i>' : '<i>' + (i + 1) + '</i>').join(''); }
  }

  function* stabilizatorji(C, H) {
    const { cv, nw, el, o, pc, grab, tool, hs, V1, R } = C, { gp, pp, PL, S, up } = R, { V3, EZ, SFX, FIT, RGL, RB, ARM, BRG } = H;
    const log = (step, x) => { H.fitLog(step, x); sayBar(step); };
    const cpS = (q) => Object.assign({}, q), pk = (j) => ({ s: Object.assign({ y: ARM.Y0, yaw: 0, pitch: Math.PI / 2 }, ARM.park[j]), ext: 0 });
    const hr = Math.min(0.3, Math.max(hs.y, hs.z) + 0.04), V2 = H.spotView(S);
    const VW = H.view({ at: [(pp.s.x + gp.s.x) / 2, 1.5, (pp.s.z + gp.s.z) / 2], yaw: -0.75, pitch: 0.32, dist: 6.4, fov: 42 });
    BRG.free = true; H.poseBridge(); BRG.p.copy(BRG.c); FIT.pass = [];
    const ps = (j) => RB[j].tool === tool ? cpS(RB[j].s) : Object.assign(cpS(RB[j].s), { y: ARM.Y0, pitch: 0 }), e0 = (j) => RB[j].tool === tool ? RB[j].ext : 0;
    const P0 = H.passMk([ps(0), ps(1)], [e0(0), e0(1)], [pp, gp], [0, 0]);
    const PS = H.passMk([cpS(pp.s), cpS(gp.s)], [pp.ext, gp.ext], [gp, pp], [hr, hr]);
    const PK = H.passMk([cpS(gp.s), cpS(pp.s)], [gp.ext, pp.ext], [pk(0), pk(1)], [0, 0]);
    let fin = false, raised = !up; H.spawn((function* () { for (const P of [P0, PS, PK]) while (!P.r && !P.sync && !fin) { P.g.next(); yield; } })());
    const puff = () => { for (let k = 0; k < 10; k++) H.puffs.emit(S.p.x, S.p.y, S.p.z, S.out.x * H.rnd(0.2, 0.8) + H.rnd(-0.3, 0.3), H.rnd(0.1, 0.6), S.out.z * H.rnd(0.2, 0.8) + H.rnd(-0.3, 0.3), 0.55, 0.1, 0.45, [0.78, 0.78, 0.8], 0.35, -0.2, 2.2, 0.02); };
    // (the bar's two fixings by the wheel: its drop link at the part's place, its bush clamp a little inboard along the car's width; a nut
    // turned: the wrench's sound, a few sparks off the tool's tip)
    const inb = new V3(-S.out.x, 0, -S.out.z); if (inb.lengthSq() < 1e-6) inb.set(0, 0, -Math.sign(S.p.z || 1)); inb.normalize();
    const nuts = [S.p.clone(), S.p.clone().addScaledVector(inb, Math.min(0.18, hs.x + 0.06)).add(new V3(0, 0.04, 0))];
    const nut = function* (i) { const A = RB[i], tip = new V3().setFromMatrixPosition(H.tipM(A.s, H.tipLen(A)));
      for (const q of nuts) { const p = q.clone().lerp(tip, 0.5); SFX.wrench();
        for (let k = 0; k < 5; k++) H.sparks.emit(p.x, p.y, p.z, H.rnd(-0.6, 0.6), H.rnd(0.2, 1.0), H.rnd(-0.6, 0.6), H.rnd(0.15, 0.3), 0.035, 0.01, H.SPK, 1, 8, 0.5, 0.02);
        yield* H.wait(0.24); } };
    // (the old bar in roka 1's hand: the regal's piece, a stock one greyed as a worn one)
    const old = () => { const g = H.rglCopy(pc); if (!o.from) g.traverse((m) => { const c = m.isMesh && m.geometry.attributes.color; if (!c) return; const A = c.array, n = c.itemSize;
      for (let v = 0; v < A.length; v += n) { const l = 0.25 + (A[v] * 0.3 + A[v + 1] * 0.59 + A[v + 2] * 0.11) * 0.45; A[v] = l; A[v + 1] = l * 1.01; A[v + 2] = l * 1.04; } c.needsUpdate = true; }); return g; };
    sayBar('plan');
    // 1: the car up by its wheel, both arms awake, the bridge round: roka 1 to the bar's place, roka 2 over the regal
    if (up) H.spawn((function* () { yield* H.liftUp(cv, up, false, 0.35); raised = true; })());
    yield* H.par(H.armTool(0, tool, 4), H.armTool(1, tool, 4));
    yield* H.par(H.tyrePass(pp, gp, 0.8, null, P0), H.camTo(V2, 0.8));
    yield* H.waitFor(() => raised, 8);
    // 2: roka 1's reach onto the old bar: its drop link and its clamp undone, off with it
    yield* H.armExt(0, PL.s, PL.ext, 0.3, EZ.sine); H.poseArm(0);
    log('links', { n: nuts.length }); yield* nut(0);
    SFX.wrench(); const Mh = H.tipM(RB[0].s, H.tipLen(RB[0])).multiply(PL.off), so = old(); so.matrix.copy(Mh); so.matrixWorldNeedsUpdate = true;
    puff(); H.hold(0, so, Mh); log('off');
    // 3: roka 1 out with it as roka 2 lifts the new one off the regal, the camera to the regal
    yield* H.par(H.armExt(0, pp.s, pp.ext, 0.3), H.camTo(V1, 0.5), H.armExt(1, grab.s, grab.ext, 0.4));
    { const cp = H.rglCopy(pc); H.rglHide(pc, true); pc.take = FIT.n; H.hold(1, cp, pc.M); } SFX.clunk(0.3); log('grab', { rgl: +RGL.P.k.toFixed(2) });
    yield* H.armExt(1, gp.s, gp.ext, 0.3);
    // 4: the bridge half round, each bar turned in its hand as it is to go
    log('pass'); yield* H.par(H.camTo(VW, 0.5), H.tyrePass(gp, pp, 0.9, [[0, grab.off, hr], [1, PL.off, hr]], PS));
    // 5: roka 1 stands the old one in the empty place
    yield* H.par(H.camTo(V1, 0.45), H.armExt(0, grab.s, grab.ext, 0.4)); H.poseArm(0); RGL.ret.push(H.letGo(0)); SFX.clunk(0.3); log('put', { where: 'regal' });
    // 6: roka 1 back as roka 2 puts the new one on (the car the new one's from here), then its link and its clamp done up
    yield* H.par(H.camTo(V2, 0.45), H.armExt(0, gp.s, gp.ext, 0.3), H.armExt(1, PL.s, PL.ext, 0.45, EZ.sine));
    puff(); SFX.clunk(0.5); H.disposeTree(H.letGo(1)); H.fitSwap(cv, nw, true); if (!up) H.spawn(H.settle(H.cur, 0.01));
    log('swap', { deli: H.deliKey ? H.deliKey(H.cur.spec) : null, car: H.cur === nw, old: 'regal' });
    log('bolts', { n: nuts.length }); yield* nut(1);
    // 7: roka 2 out, the car down onto its wheels (the lift stowed after), the arms home with the bridge, KONČANO
    yield* H.wait(0.1); yield* H.armExt(1, pp.s, pp.ext, 0.3, EZ.sine);
    let stowed = !up, off = false;
    if (up) H.spawn((function* () { yield* H.lowerCar(H.cur, false, 0.5); yield* H.armsTo(0, 1.1); yield* H.carriageTo(H.LIFT.c0, 0.25); stowed = true; })());
    H.spawn((function* () { yield* H.tyrePass(PK.Q[0], PK.Q[1], 1.0, null, PK); H.bridgeRest(); yield* H.par(H.armRest(0, 2.0), H.armRest(1, 2.0)); off = true; })());
    if (up) { yield* H.waitFor(() => H.lift < 1e-3, 3); log('down'); }
    SFX.ping(1760); H.hud('done', { kind: el });
    yield* H.waitFor(() => off && stowed, 6); fin = true; yield* H.par(H.home(1.4), H.rglUnstay(1.4));
  }

  const NS = (typeof window !== 'undefined' ? window : globalThis).GarazaAnim = (typeof window !== 'undefined' ? window : globalThis).GarazaAnim || {};
  NS.stabilizatorji = stabilizatorji;
})();
