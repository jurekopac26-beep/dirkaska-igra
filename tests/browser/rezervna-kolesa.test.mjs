// The spare wheels in the browser (Core.SPARE, docs/deli.md »Rezervno kolo«; the user's decision of 9. 11. 2026): under half the car's
// damage they keep still; from 50 % they rock on their carriers (a kit car's: their points on its body turned, the rest of the body as it
// was; the TITAN CISTERNA's four on its trailer's rack: one mesh of its own, the trailer drawn without them), harder near 80 %; at 80 % the
// core throws them off: each lies on the road as a piece of its own (a mesh), the trailer drawn without them, its shadow too. KAMEN (two
// behind its cab), MEDVED (one on its tailgate), the TITAN CISTERNA. On a real track (Bathurst).
//   node tests/browser/rezervna-kolesa.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('The spare wheels: they rock from 50 % damage, at 80 % they come off');
const srv = await serve(), browser = await launch();
const ready = (page) => page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
try {
  for (const car of ['kamen', 'medved', 'cisterna']) {
    const { page, errors } = await openGame(browser, srv.base + `/index.html?proga=bathurst&nacin=dirka&avto=${car}&t=2`, { quality: 'high' }, { width: 640, height: 360 });
    await ready(page);
    const r = await page.evaluate(() => {
      const g = window.__game, P = g.race.player, v = Render.viewOf(P), PT = Core.partsOf(P.m), SP = Object.keys(PT).filter(k => PT[k].spare), tl = SP.some(k => PT[k].tl);
      g.resume(); g.onAction('pause');
      const frame = () => Render.frame(1 / 30, 1, P, 'chase', { noFx: true });
      const geo = v.body.geometry, U = geo.userData, pos = geo.attributes.position.array, R = tl ? [] : SP.map(k => U.ranges[k]).filter(Boolean);
      const inSp = (i) => R.some(q => (i >= q.o[0] && i < q.o[1]) || (i >= q.i[0] && i < q.i[1]));
      // over n frames: how far the spares' points went from where they were (m; the trailer's: the stack's angle, rad), how far the rest did
      const rock = (dmg, n) => {
        P.dmg = dmg; const a0 = Float32Array.from(pos); let s = 0, o = 0, ang = 0, mesh = false, cut = false;
        for (let f = 0; f < n; f++) {
          frame();
          if (tl) { if (v.tlSpM) { mesh = true; ang = Math.max(ang, Math.abs(v.tlSpM.rotation.x) + Math.abs(v.tlSpM.rotation.z)); } cut = cut || v.tlB.geometry !== v.tlR.geo; continue; }
          for (let i = 0; i < pos.length / 3; i++) { const d = Math.hypot(pos[i * 3] - a0[i * 3], pos[i * 3 + 1] - a0[i * 3 + 1], pos[i * 3 + 2] - a0[i * 3 + 2]); if (inSp(i)) s = Math.max(s, d); else o = Math.max(o, d); }
        }
        return { s: +s.toFixed(4), o: +o.toFixed(5), ang: +(ang * 180 / Math.PI).toFixed(2), mesh, cut };
      };
      const out = { spares: SP, tl, ranges: R.length };
      out.still = rock(0.3, 20); out.wob = rock(0.62, 60); out.hard = rock(0.78, 60);
      // 80 %: thrown off (spread damage, as a hard landing's), the pieces made on the next frames
      Core.applyDamage(P, (0.81 - P.dmg) / ((P.dmgK || 1) * (P.m.dmgK || 1)));
      for (let k = 0; k < 6; k++) { g.sim(1 / 30, false); frame(); }
      const D = g.race.debris.filter(d => d.car === P.id && SP.indexOf(d.part) >= 0);
      out.lost = SP.filter(k => P.lost[k]).length; out.pieces = D.length; out.meshes = D.filter(d => d.mesh && d.mesh.isObject3D).length;
      out.dmg = +P.dmg.toFixed(3);
      // each piece the spare itself: its size about the wheel's (its largest measure the part's diameter, 2 r); the trailer's from its look,
      // not the tractor's kit (no aIn); the vehicle drawn with its own look (a part the kit cannot build drops it to the generic hatch)
      out.status = Render.kitStatus(P.m.id);
      out.pcs = D.map(d => { let m = null; if (d.mesh && d.mesh.isObject3D) d.mesh.traverse(o => { if (o.isMesh && !m) m = o; }); if (!m) return null;
        const G = m.geometry; G.computeBoundingBox(); const b = G.boundingBox, s = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z].sort((x, y) => y - x);
        return { d: +(s[0] / (2 * PT[d.part].r)).toFixed(2), t: +(s[2] / s[0]).toFixed(2), kit: !!G.attributes.aIn }; });
      if (tl) { out.gone = !!v.tlGone; out.noMesh = !v.tlSpM; out.cutLook = v.tlB.geometry === (v.tlR.cut && v.tlR.cut[0] && v.tlR.cut[0].no); out.cutShadow = !!(v.tlSh && v.tlR.cut && v.tlR.cut[2] && v.tlSh.geometry === v.tlR.cut[2].no); }
      else out.dead = SP.filter(k => v.kit.dead[k]).length;
      return out;
    });
    const name = { kamen: 'KAMEN', medved: 'MEDVED', cisterna: 'the TITAN CISTERNA' }[car], J = JSON.stringify;
    T.check(`${name}: its spare wheels (${r.spares.join(', ')})`, r.spares.length === { kamen: 2, medved: 1, cisterna: 4 }[car] && (r.tl ? r.spares.length === 4 : r.ranges === r.spares.length), J(r));
    if (r.tl) {
      T.check(`${name}: at 30 % the tyres keep still in the trailer's look`, !r.still.mesh && !r.still.cut, J(r.still));
      T.check(`${name}: at 62 % the stack rocks on its rack (a mesh of its own, up to ${r.wob.ang}°), the trailer without it`, r.wob.mesh && r.wob.cut && r.wob.ang > 0.3 && r.wob.ang < 12, J(r.wob));
      T.check(`${name}: at 78 % it rocks harder (${r.hard.ang}° against ${r.wob.ang}°)`, r.hard.mesh && r.hard.ang > r.wob.ang * 1.3 && r.hard.ang <= 12.5, J(r.hard));
      T.check(`${name}: at ${Math.round(r.dmg * 100)} % all four are off, four pieces on the road, the trailer and its shadow without them`, r.lost === 4 && r.pieces === 4 && r.meshes === 4 && r.gone && r.noMesh && r.cutLook && r.cutShadow, J(r));
    } else {
      T.check(`${name}: at 30 % they keep still`, r.still.s === 0 && r.still.o === 0, J(r.still));
      T.check(`${name}: at 62 % they rock (their points up to ${(r.wob.s * 100).toFixed(1)} cm), the rest of the body as it was`, r.wob.s > 0.005 && r.wob.s < 0.2 && r.wob.o === 0, J(r.wob));
      T.check(`${name}: at 78 % they rock harder (${(r.hard.s * 100).toFixed(1)} cm against ${(r.wob.s * 100).toFixed(1)} cm)`, r.hard.s > r.wob.s * 1.3 && r.hard.o === 0, J(r.hard));
      T.check(`${name}: at ${Math.round(r.dmg * 100)} % they are off, each a piece on the road`, r.lost === r.spares.length && r.dead === r.spares.length && r.pieces === r.spares.length && r.meshes === r.spares.length, J(r));
    }
    const okP = r.pcs.length === r.spares.length && r.pcs.every(q => q && q.d > 0.8 && q.d < 1.35 && q.t < 0.75 && q.kit === !r.tl);
    T.check(`${name}: drawn with its own look, each piece on the road a wheel (its size against the wheel's: ${r.pcs.map(q => q && q.d).join(', ')})`, r.status === 'ok' && okP, r.status + ' ' + J(r.pcs));
    T.check(`${name}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await page.context().close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
