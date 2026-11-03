// The rivals' draw cost (js/render.js: remerge, carCull), on Spa (a real track with pits) at the phone budget's settings (844x390, NIZKA):
//  - a rival of the 11 draws its panels, their under-parts, the head lamps' lenses and the smashed tail lamps' covers as one mesh with the
//    body's own material (v.partsM; its group v.det never drawn); the player's car its panels one by one
//  - wrecked (Core.wreckCar): the mesh built again with what shows now (the panels lost, the parts under them, the covers); repaired in
//    the pits (pitState 'repair', bit by bit): as new again, the covers freed
//  - a formula rival: its parts one mesh too, the rear wing with its DRS flap a mesh of its own; on NIZKA none of its parts casts a shadow
//  - the one mesh looks as the pieces it stands for (the same still drawn both ways, close up from the front three-quarter, by day): the
//    lit panels, the matte trim and under-parts, the unlit head lamp lenses (MeshBasic: their own cream, not shaded), intact and wrecked
//  - a car out of the view (past the fog) leaves the scene and its damage is still followed; a shot (the photo mode) puts every car back;
//    back in the view, back in the scene. The player's car never leaves it
//   node tests/browser/carcull.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the rivals\' draw cost: panels as one mesh, cars out of the view out of the scene');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, damage: 2, weather: 'dry', tod: 'day' }, { width: 844, height: 390 }, { seed: 4242 });
  await page.evaluate(() => { window.__game.S.car = Core.MODELS.findIndex(m => m.id === 'rally'); });
  await startTrack(page, 'spa');
  const r = await page.evaluate(() => {
    const g = window.__game, R = g.race, P = R.player; g.pause(); g.sim(3, true);
    const fr = (n) => { for (let i = 0; i < (n || 1); i++) Render.frame(1 / 60, 1, P, 'chase', {}); };
    Render.resetCam(); fr(4);
    const shown = (o, top) => { for (let p = o; p && p !== top; p = p.parent) if (!p.visible) return false; return true; };
    const meshes = (v) => { let n = 0; v.grp.traverse(o => { if (o.isMesh && shown(o, v.grp.parent)) n++; }); return n; };
    // what the merged mesh should hold: every mesh shown under det, as triangles
    const want = (v) => { let n = 0; v.det.traverse(o => { if (o.isMesh && shown(o, v.det)) n += o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; }); return n; };
    // the same still with the one mesh, then with det's pieces themselves (their own materials): pixels off by more than 24, the largest
    const grab = () => { const cv = document.querySelector('canvas'), c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; const x = c2.getContext('2d'); x.drawImage(cv, 0, 0); return x.getImageData(0, 0, cv.width, cv.height).data; };
    const look = (q, P) => { const fr0 = (n) => { for (let i = 0; i < n; i++) Render.frame(0, 1, P, 'chase', { noFx: true }); }, v = Render.viewOf(q), h = q.h, fx = Math.cos(h), fz = Math.sin(h), y = q.y || 0;
      Render.setShot({ px: q.x + fx * 4.2 - fz * 1.6, py: y + 1.2, pz: q.z + fz * 4.2 + fx * 1.6, tx: q.x, ty: y + 0.45, tz: q.z, fov: 40, near: 0.3 }); Render.clearSparks(); fr0(3); const A = grab();
      v.partsM.visible = false; v.det.visible = true; delete v.det.updateMatrixWorld; fr0(3); const B = grab();
      v.det.updateMatrixWorld = () => {}; v.det.visible = false; v.partsM.visible = true; Render.setShot(null);
      let n = 0, m = 0; for (let i = 0; i < A.length; i += 4) { const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])); if (d > 24) n++; if (d > m) m = d; }
      return { n, m, unlit: Array.from(v.partsM.geometry.attributes.aIn.array).filter(a => Math.abs(a - 64 / 255) < 0.01).length }; };
    window.__look = look;
    const st = (v) => ({ merged: !!v.partsM && v.partsM.visible && !!v.partsM.parent, detHidden: !!v.det && !v.det.visible, bodyMat: !!v.partsM && v.partsM.material === v.body.material,
      verts: v.partsM ? v.partsM.geometry.attributes.position.count : 0, want: v.det ? want(v) : -1, meshes: meshes(v), covers: (v.tailCov || []).length, lost: Object.keys(v.parts).filter(n => !v.parts[n].visible).length });
    const pv = Render.viewOf(P), AI = R.cars.filter(c => !c.isPlayer), c = AI.find(q => !Render.viewOf(q).kit && !Render.viewOf(q).fp), v0 = Render.viewOf(c);
    const out = { player: { partsM: !!pv.partsM, panels: Object.values(pv.parts).filter(m => m.parent && m.visible && m.isMesh).length, inScene: !!pv.grp.parent }, intact: st(v0), lookI: look(c, P) };
    // wrecked: the mesh built again
    Core.wreckCar(c); fr(2); out.wreck = st(v0);
    // damaged, no fire (a wreck burns: then its char and scratches go on the one mesh too, by design): panels off, a head and a tail lamp smashed
    const e = AI.find(q => q !== c && !Render.viewOf(q).kit && !Render.viewOf(q).fp && Render.viewOf(q).lens.length);
    for (const n of ['hood', 'trunk', 'fenderL', 'fenderR', 'bumperF']) e.lost[n] = true; e.lightOut[0] = true; e.lightOut[3] = true; fr(); out.lookD = look(e, P);
    // repaired in the pits, bit by bit (Core.REPAIR's phases), then built afresh
    c.pitState = 'repair'; c.pitDur = 4; out.rep = [];
    for (const u of [0.3, 0.6, 0.85, 1]) { c.pitT = u * c.pitDur; fr(); out.rep.push(Object.assign({ u, same: Render.viewOf(c) === v0 }, st(v0))); }
    R.repairCar(c); c.pitState = 'done'; fr(); c.pitState = null; fr(); const v1 = Render.viewOf(c); out.fresh = Object.assign({ new: v1 !== v0 }, st(v1));
    // out of the view: past the fog (5 km on), out of the scene; its damage followed meanwhile; a shot: every car in; back: back in
    const d = AI.find(q => q !== c && !Render.viewOf(q).kit && !Render.viewOf(q).cull && Render.viewOf(q).grp.parent), vd = Render.viewOf(d), x0 = d.x, z0 = d.z;
    d.x += 5000; d.px += 5000; fr(2); const far = { cull: !!vd.cull, inScene: !!vd.grp.parent };
    d.lost.hood = true; d.lightOut[0] = true; fr(); far.hoodGone = !vd.parts.hood.visible; far.rebuilt = vd.partsM.geometry.attributes.position.count === want(vd); far.dirty = !!vd.detDirty;
    const cp = Render.camera.position, tg = new THREE.Vector3(); Render.camera.getWorldDirection(tg);
    Render.setShot({ px: cp.x, py: cp.y, pz: cp.z, tx: cp.x + tg.x * 10, ty: cp.y + tg.y * 10, tz: cp.z + tg.z * 10, fov: 50, near: 0.3 }); fr();
    const shot = { inScene: !!vd.grp.parent, all: AI.every(q => !!Render.viewOf(q).grp.parent) };
    Render.setShot(null); fr(); const after = { cull: !!vd.cull };
    d.x = x0; d.px = x0; d.z = z0; d.pz = z0; fr(2); after.backCull = !!vd.cull; after.back = !!vd.grp.parent;
    out.cull = { far, shot, after, player: !!pv.grp.parent, culledNow: AI.filter(q => Render.viewOf(q).cull).length, n: AI.length };
    g.resume(); return out;
  });
  console.log(JSON.stringify(r));
  const I = r.intact;
  T.check('a rival of the 11: its panels, lenses and covers one mesh with the body\'s material (det never drawn); the player\'s car its panels one by one', I.merged && I.detHidden && I.bodyMat && I.verts === I.want && I.verts > 0 && !r.player.partsM && r.player.panels >= 6,
    JSON.stringify({ intact: I, player: r.player }));
  T.check('a rival of the 11 draws at most 9 meshes (body, tail lamps, number, front wheels, blob, the merged panels; a rally body\'s two side numbers)', I.meshes <= 9, 'meshes ' + I.meshes);
  const W = r.wreck;
  T.check('wrecked: the mesh built again with what shows now (panels lost, the parts under them, the smashed tail lamps\' covers)', W.merged && W.lost > 0 && W.verts === W.want && W.verts !== I.verts && W.covers > 0, JSON.stringify(W));
  const E = r.rep[r.rep.length - 1];
  T.check('repaired in the pits bit by bit: the mesh follows each step, as new at the end (no panel off, the covers freed), then the car built afresh', r.rep.every(q => q.same && q.merged && q.verts === q.want) && E.lost === 0 && E.covers === 0 && E.verts === I.verts && r.fresh.new && r.fresh.merged && r.fresh.verts === I.verts,
    JSON.stringify({ rep: r.rep.map(q => [q.u, q.lost, q.covers, q.verts, q.want]), fresh: r.fresh }));
  const C = r.cull;
  T.check('a car past the fog: out of the scene, its damage followed (a panel off, the mesh built again); the player\'s car always in', C.far.cull && !C.far.inScene && C.far.hoodGone && C.far.rebuilt && !C.far.dirty && C.player, JSON.stringify(C));
  T.check('a shot (the photo mode): every car in the scene; back in the view: back in the scene', C.shot.inScene && C.shot.all && C.after.cull && !C.after.backCull && C.after.back, JSON.stringify(C));

  // a formula field: its rivals' parts one mesh, the rear wing (its DRS flap) a mesh of its own, no part's shadow on NIZKA
  await page.evaluate(() => { window.__game.S.car = Core.MODELS.findIndex(m => m.id === 'formula'); });
  await startTrack(page, 'spa');
  const f = await page.evaluate(() => {
    const g = window.__game, R = g.race, P = R.player; g.pause(); Render.frame(1 / 60, 1, P, 'chase', {});
    const c = R.cars.find(q => !q.isPlayer), v = Render.viewOf(c), pv = Render.viewOf(P), P2 = v.parts, look = window.__look(c, P);
    const r = { fp: !!v.fp, merged: !!v.partsM && v.partsM.visible, detHidden: !v.det.visible, wing: P2.bumperR.parent === v.bodyG && !!v.drsFlap, inDet: Object.keys(P2).filter(n => n !== 'bumperR').every(n => P2[n].parent === v.det),
      shadows: Object.keys(P2).filter(n => P2[n].castShadow).length + (v.partsM.castShadow ? 1 : 0), player: !!pv.partsM, playerWing: pv.parts.bumperR.castShadow, look };
    g.resume(); return r;
  });
  T.check('a formula rival: its parts one mesh, the rear wing with its DRS flap its own; on NIZKA no part casts a shadow (the player\'s car as before)', f.fp && f.merged && f.detHidden && f.wing && f.inDet && f.shadows === 0 && !f.player && f.playerWing, JSON.stringify(f));
  await page.evaluate(() => { window.__game.S.car = Core.MODELS.findIndex(m => m.id === 'rally'); });
  T.check('the one mesh looks as the pieces it stands for (the same still drawn both ways, by day): a rival of the 11 intact and damaged (its lenses unlit: MeshBasic\'s cream), a formula',
    r.lookI.n <= 20 && r.lookI.unlit > 0 && r.lookD.n <= 20 && r.lookD.unlit > 0 && r.lookD.unlit < r.lookI.unlit && f.look.n <= 20, JSON.stringify({ intact: r.lookI, damaged: r.lookD, formula: f.look }));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
