// The pit stop's repair bit by bit (Render's repairStep, Core.REPAIR): a car wrecked on Bakreni gozd (gozd: Core.wreckCar), then the
// crew's repair stepped through by hand (c.pitState 'repair', pitT over pitDur, one frame at each step). The car's view goes back to the
// car as new: the bodywork's points down to none off, the lost panels back one by one (some still off half-way), the panes' cracks off
// early, the soot off with the bodywork, the lamps, a kit car's wheels with the crew's tyre men; the same view all through (nothing built
// afresh), no more meshes drawn than the wreck or the car as new have; then Race.repairCar builds it afresh, whole. RAKETA (a kit vehicle)
// and KAZE RS (one of the 11); the damage on the HUD goes down with it (Core.repairU 0 outside a repair).
//   node tests/browser/repair.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('repair');
const srv = await serve();
const browser = await launch();
const US = [0, 0.1, 0.3, 0.5, 0.65, 0.8, 0.95];
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2, damage: 2 }, undefined, { seed: 777 });
  const ru = await page.evaluate(() => [Core.repairU({ pitState: 'stop', pitT: 1, pitDur: 2 }), Core.repairU({ pitState: 'repair', pitT: 1, pitDur: 2 }), Core.repairU({ pitState: 'repair', pitT: 3, pitDur: 2 }), Core.repairU({ pitState: 'done', pitT: 2, pitDur: 2 })]);
  T.check('Core.repairU: 0 outside a repair, pitT / pitDur (at most 1) in it', ru[0] === 0 && ru[1] === 0.5 && ru[2] === 1 && ru[3] === 0, JSON.stringify(ru));
  for (const id of ['raketa', 'kaze']) {
    const S0 = await page.evaluate((id) => { const g = window.__game, s = g.S.car; g.S.car = Core.MODELS.findIndex(m => m.id === id); return s; }, id);
    await startTrack(page, 'gozd');
    const r = await page.evaluate((US) => {
      const g = window.__game, P = g.race.player; g.pause();
      const fr = () => Render.frame(1 / 60, 1, P, g.S.camera, {});
      g.sim(1, true); Core.wreckCar(P); g.sim(0.5, true); for (let i = 0; i < 3; i++) fr();
      const v0 = Render.viewOf(P), kit = !!v0.kit;
      const meshes = (v) => { let n = 0; v.grp.traverseVisible(o => { if (o.isMesh) n++; }); return n; };
      const off = (v) => kit ? Object.keys(v.kit.dead).length : Object.keys(v.parts).filter(n => !v.parts[n].visible).length;
      const st = (u) => {
        const v = Render.viewOf(P), R = v.rep, a = v.body.geometry.attributes.position.array; let d = -1;
        if (R && R.P) { d = 0; for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - R.P.p[i]); }
        return { u, same: v === v0, rep: !!R, idx: R && R.idx ? R.idx.length : 0, d: +d.toFixed(4), off: off(v), cracks: v.crack.filter(Boolean).length, lamps: v.lightBroken.reduce((s, q) => s + q, 0), lampsOut: !!v.lampsOut,
          char: v.charU ? +v.charU.value.w.toFixed(3) : 0, scr: v.scrU ? +v.scrU.value.toFixed(3) : 0, wheelsOff: v.wheelOff.reduce((s, q) => s + q, 0), wheelsShown: v.wf.concat(v.wr).every(w => w.visible),
          hubs: v.hubs.filter(h => h && h.visible).length, sag: !!v.sagQ, meshes: meshes(v) };
      };
      const wreck = { off: off(v0), cracks: v0.crack.filter(Boolean).length, lamps: v0.lightBroken.reduce((s, q) => s + q, 0), wheelsOff: v0.wheelOff.reduce((s, q) => s + q, 0), char: v0.charU ? v0.charU.value.w : 0, meshes: meshes(v0), dmg: P.dmg };
      P.pitState = 'repair'; P.pitDur = 4;
      const steps = [];
      for (const u of US) { P.pitT = u * P.pitDur; fr(); steps.push(st(u)); }
      g.race.repairCar(P); P.pitState = 'done'; fr();
      const v1 = Render.viewOf(P); P.pitState = null; fr();
      const after = { fresh: v1 !== v0, rep: !!v1.rep, off: off(v1), cracks: v1.crack.filter(Boolean).length, lamps: v1.lightBroken.reduce((s, q) => s + q, 0), wheelsOff: v1.wheelOff.reduce((s, q) => s + q, 0), meshes: meshes(v1),
        ownGone: !v0.grp.parent };
      g.resume();
      return { kit, wreck, steps, after };
    }, US);
    await page.evaluate((s) => { window.__game.S.car = s; }, S0);
    const S = r.steps, at = (u) => S.find(q => q.u === u), name = id === 'raketa' ? 'RAKETA' : 'KAZE RS';
    console.log(`${name}: wreck ${JSON.stringify(r.wreck)}`);
    for (const q of S) console.log(`  u ${q.u}: ${JSON.stringify(q)}`);
    console.log(`  after: ${JSON.stringify(r.after)}`);
    T.check(`${name}: the wreck is a wreck (parts off, the bodywork bent, sooted)`, r.wreck.off >= 2 && S[0].idx > 0 && S[0].d > 0 && r.wreck.char > 0 && (!r.kit || r.wreck.wheelsOff > 0), JSON.stringify(r.wreck) + ` idx ${S[0].idx}`);
    T.check(`${name}: the same view all through the repair, repairing`, S.every(q => q.same && q.rep), S.map(q => +q.same + '' + +q.rep).join(' '));
    T.check(`${name}: the bodywork goes back step by step (never further off), as new at the end`, S.every((q, i) => !i || q.d <= S[i - 1].d + 1e-6) && at(0.3).d < S[0].d && at(0.5).d < at(0.3).d && at(0.95).d === 0, S.map(q => q.d).join(' > '));
    T.check(`${name}: the lost panels come back one by one (some still off half-way), all of them`, S.every((q, i) => !i || q.off <= S[i - 1].off) && at(0.65).off > 0 && at(0.65).off < r.wreck.off && at(0.95).off === 0, S.map(q => q.off).join(' > '));
    T.check(`${name}: the panes' cracks off early`, (!r.wreck.cracks || S[0].cracks > 0) && S.filter(q => q.u >= 0.1).every(q => q.cracks === 0), S.map(q => q.cracks).join(' > '));
    T.check(`${name}: the soot and the scratches gone with the bodywork`, S[0].char > 0 && S.every((q, i) => !i || q.char <= S[i - 1].char) && at(0.65).char === 0 && at(0.65).scr === 0, S.map(q => q.char + '/' + q.scr).join(' > '));
    T.check(`${name}: the lamps lit again (all of them once every panel is back)`, at(0.95).lamps === 0 && !at(0.95).lampsOut && (r.kit || at(0.65).lamps === 0), S.map(q => q.lamps + (q.lampsOut ? '*' : '')).join(' > '));
    if (r.kit) T.check(`${name}: the wheels back on with the crew's tyre men (u ${0.46}), the hubs hidden, no sag`, at(0.3).wheelsOff > 0 && S.filter(q => q.u >= 0.5).every(q => !q.wheelsOff && q.wheelsShown && !q.hubs && !q.sag), S.map(q => q.wheelsOff + (q.wheelsShown ? '' : 'h') + (q.sag ? 's' : '')).join(' > '));
    T.check(`${name}: no more meshes drawn than the wreck or the car as new`, S.every(q => q.meshes <= Math.max(r.wreck.meshes, r.after.meshes)), `wreck ${r.wreck.meshes}, new ${r.after.meshes}: ` + S.map(q => q.meshes).join(' '));
    T.check(`${name}: Race.repairCar builds it afresh, whole (the old view freed)`, r.after.fresh && !r.after.rep && r.after.off === 0 && r.after.cracks === 0 && r.after.lamps === 0 && r.after.wheelsOff === 0 && r.after.ownGone, JSON.stringify(r.after));
  }
  // the HUD: the damage zones' colours go down with the repair (game.js updateDamageHUD, drawn by the running game: the player's pit
  // step held off meanwhile, so the repair stays where the test puts it)
  const hud = await page.evaluate(async () => {
    const g = window.__game, R = g.race, P = R.player, raf = () => new Promise(r => requestAnimationFrame(r)), fill = () => document.getElementById('dz0').getAttribute('fill');
    R.pitStep = function (c, dt, pre) { if (c !== P) return Object.getPrototypeOf(this).pitStep.call(this, c, dt, pre); };
    Core.wreckCar(P); const out = [];
    P.pitState = 'repair'; P.pitDur = 4;
    for (const u of [0, 0.3, 0.7]) { P.pitT = u * 4; for (let i = 0; i < 4; i++) await raf(); out.push(fill()); }
    R.repairCar(P); P.pitState = null; delete R.pitStep; for (let i = 0; i < 3; i++) await raf();
    return { out, after: fill() };
  });
  T.check('the HUD: the damage goes down as the crew works (red at the start, green once the bodywork is done)', /hsl\(0,/.test(hud.out[0]) && !/hsl\((0|120),/.test(hud.out[1]) && /hsl\(120,/.test(hud.out[2]) && /hsl\(120,/.test(hud.after), hud.out.join(' > ') + ' > ' + hud.after);
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));

  // Razbijanje · nov način (xBody, xGlass on): the player's denser body and the damage table's broken glass (KOLIBRI) repaired the same
  // way: towards its own body as built (never the model's coarser one: no NaN at any step), the table's glass back in the body with the
  // panes (its overlay hidden, the cut triangles drawn again)
  {
    const { page: pg, errors: er, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2, damage: 2, xBody: 1, xGlass: 1, xPaint: 1, carDet: 'normal' }, undefined, { seed: 777 });
    await pg.evaluate(() => { const g = window.__game; g.S.car = Core.MODELS.findIndex(m => m.id === 'kolibri'); });
    await startTrack(pg, 'gozd');
    const x = await pg.evaluate((US) => {
      const g = window.__game, P = g.race.player; g.pause();
      const fr = () => Render.frame(1 / 60, 1, P, g.S.camera, {});
      g.sim(1, true); for (const h of [[0.3, 1, 0], [0.15, 0.45, -1], [0.3, -1, 0], [0.15, 0, 1]]) { Core.applyDamage(P, h[0], h[1] * P.m.len / 2, h[2] * P.m.wid / 2); fr(); }
      for (let i = 0; i < 3; i++) fr();
      const v0 = Render.viewOf(P), I = Render.crashInfo().cars.find(q => q.player);
      const nan = () => { const a = Render.viewOf(P).body.geometry.attributes; let n = 0; for (const k of ['position', 'normal']) for (const q of a[k].array) if (!Number.isFinite(q)) n++; return n; };
      const pre = { id: P.m.id, xOn: !!I.xOn, xd: I.xd, xt: !!I.xt, cut: !!v0.xtCut, overlay: !!(v0.xtO && v0.xtO.mesh.visible), nan: nan() };
      P.pitState = 'repair'; P.pitDur = 4; const steps = [];
      for (const u of US) { P.pitT = u * P.pitDur; fr(); const v = Render.viewOf(P); steps.push({ u, same: v === v0, rep: !!v.rep, P: !!(v.rep && v.rep.P), nan: nan(), cut: !!v.xtCut, overlay: !!(v.xtO && v.xtO.mesh.visible) }); }
      g.race.repairCar(P); P.pitState = 'done'; fr(); P.pitState = null; fr();
      g.resume();
      return { pre, steps, after: nan() };
    }, US);
    await ctx.close();
    console.log(`KOLIBRI (nov način): ${JSON.stringify(x.pre)}`); for (const q of x.steps) console.log(`  u ${q.u}: ${JSON.stringify(q)}`);
    T.check('KOLIBRI in the new crash mode: its dense body and broken table glass before the repair', x.pre.id === 'kolibri' && x.pre.xOn && x.pre.xd > 0 && x.pre.xt && x.pre.cut && x.pre.overlay && x.pre.nan === 0, JSON.stringify(x.pre));
    T.check('KOLIBRI in the new crash mode: repaired towards its own body (the same view, a target), no NaN at any step, none after', x.steps.every(q => q.same && q.rep && q.P && q.nan === 0) && x.after === 0, x.steps.map(q => `${q.u}:${q.P ? 'P' : '-'}${q.nan}`).join(' '));
    T.check('KOLIBRI in the new crash mode: the table\'s broken glass back with the panes (its overlay hidden, the cut triangles drawn again from u 0.1)', x.steps.filter(q => q.u >= 0.1).every(q => !q.cut && !q.overlay), x.steps.map(q => `${q.u}:${+q.cut}${+q.overlay}`).join(' '));
    T.check('KOLIBRI in the new crash mode: no page errors', !er.length, er.slice(0, 5).join(' | '));
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
