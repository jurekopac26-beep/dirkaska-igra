// The garage's parts, sklop 3 (js/deli/barve.js, js/deli/skriti.js; docs/deli.md) in a real race: Bathurst's quick entry in the KOLIBRI,
// the player's car given parts (Core.applyDeli) and drawn again (Render.attachRace), on autopilot for a few seconds:
//  - the car's own material compiles with the finish and the tint (no shader errors), its geometry with the sheen's attribute (aDl)
//  - the underglow: its mesh under the car, lit (its colours change with the running rainbow), one draw of its own
//  - the body lowered on the springs (vzmeti 16: 5 cm), the wheels where they were
//  - the tyre smoke's colour (dim_gum 6: red) for the drift's smoke
//  - nothing NaN, no errors on the page
//   node tests/browser/deli-barve.test.mjs
import { serve, launch, openGame, checker, simulate } from './lib.mjs';

const T = checker('deli-barve');
const srv = await serve();
const browser = await launch();
try {
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&avto=kolibri&t=4', {}, { width: 640, height: 360 });
  await page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
  const deli = { barva: 14, zatemnitev: 3, crte: 8, zamasek: 16, nalepke: 9, soncni_pas: 13, celjusti: 13, gume: 13, luc_pod_avtom: 11, vzmeti: 16, dim_gum: 6, turbo: 16 };
  const A = await page.evaluate((deli) => {
    const g = window.__game, P = g.race.player; Core.applyDeli(P, deli); Render.attachRace(g.race);
    let glow = null; Render.scene.traverse(m => { if (m.name === 'deli:luc_pod_avtom') glow = m; });
    const grp = glow && glow.parent, bodyG = grp && grp.children[0], body = bodyG && bodyG.children[0];
    const c0 = glow ? Array.from(glow.geometry.attributes.color.array.slice(0, 30)) : null;
    return { deli: P.deli, low: P.dLower, tint: P.dTint, ty: P.dTy, glow: !!glow, c0, bodyY: bodyG ? bodyG.position.y : null, aDl: !!(body && body.geometry.attributes.aDl), kw: P.m.kw, kw0: P.m === Core.MODELS.find(m => m.id === 'kolibri') };
  }, deli);
  T.check('the parts on the player\'s car: the effects (the springs 5 cm lower, the tint, the tyres\' grip by surface, the turbo\'s power)', A.low === 0.05 && A.tint > 0 && A.ty && A.ty.dry > 1 && A.ty.wet < 1 && !A.kw0, JSON.stringify({ low: A.low, tint: A.tint, ty: A.ty, deli: A.deli }));
  T.check('drawn: the underglow\'s mesh under the car, the sheen\'s attribute on the body', A.glow && A.aDl, JSON.stringify({ glow: A.glow, aDl: A.aDl }));
  const nan = await simulate(page, 4);
  const B = await page.evaluate(() => {
    let glow = null; Render.scene.traverse(m => { if (m.name === 'deli:luc_pod_avtom') glow = m; });
    const bodyG = glow.parent.children[0], col = Array.from(glow.geometry.attributes.color.array.slice(0, 30));
    const S = DELI.dim(6).at(2, 0);     return { bodyY: bodyG.position.y, lit: col.some(v => v > 0.05), col, smoke: S };
  });
  T.check('a race with them: the body lower on its springs every frame (5 cm), the underglow lit and running round the car', B.bodyY < -0.03 && B.lit && JSON.stringify(B.col) !== JSON.stringify(A.c0), `body y ${B.bodyY.toFixed(3)}, glow ${B.col.slice(3, 9).map(v => v.toFixed(2)).join(' ')}`);
  T.check('the tyre smoke red (dim_gum 6)', B.smoke[0] > 0.8 && B.smoke[1] < 0.4, JSON.stringify(B.smoke));
  T.check('nothing NaN, no errors on the page (the shaders compiled)', !nan && !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
  T.done();
}
