// The compound's band on the tyres (render.js tyreBand), in a race with compounds: Bathurst (tyres and compounds on, as on every track
// with pits), the slicks for the start Mehke (Gume), for the stop Trde (Gume v boksih). Red soft, yellow medium, white hard
// (Core.TYRE_CMP), blue the rain tyres. Damage off (no knock moves or scrapes a band's vertices on the way).
//  - KAZE RS (one of the 11: its front wheels are meshes of their own, the rear ones are in the body) against the four road cars: every
//    car's band in its own compound's colour, a ring of 12 segments on the outer wall of each rear wheel (144 vertices in the body, out
//    beside it) and on both walls of each front wheel's mesh (144 vertices), nothing else of the car in that colour there; no mesh more
//    than without it (no draw call more)
//  - the pit crew: the new set's band in the compound asked for (white), the old set's in the car's own (red); a wet line: the new set
//    blue (rain tyres), dry again: white
//  - one stop: once the crew has pushed the new set home the front wheels show it (white) while the rear ones (in the body) still show
//    the soft (seen once the bodywork is done too); out of the box the car runs on the hards, all four wheels white (its body built afresh), the crew's old set still red
//  - a car without tyres (as in a race without compounds): no band, 144 vertices fewer in its body and in each front wheel, the same meshes
//  - kit cars racing their own field: LEV S and one with round tyres (KOLIBRI, seg 32): a ring of 16 segments on the player's wheels' outer wall (the round
//    tyre: its outer shoulder in the band's colour, no triangle more), 10 on a rival's, the left wheels mirrored with it outside; the
//    wheels within their budgets (400 / 160 triangles)
// SHOTS=<folder>: pictures from the camera behind the car (in the box it looks at the car and its crew): the start, in the box before the
// wheels come off, the new set on, out of the box; KOLIBRI's field; and a close look at the player's left rear wheel (a fixed camera
// behind its quarter) at the start, out of the box and in KOLIBRI
//   node tests/browser/tyrebands.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('tyre bands (bathurst)');
const SHOTS = process.env.SHOTS || '';
const srv = await serve();
const browser = await launch();
const shot = async (page, name) => {   // (the picture the photo mode takes: the 3D view alone, 1280 px wide)
  if (!SHOTS) return;
  const url = await page.evaluate(() => { const g = window.__game, P = g.race.player; Render.scene.visible = true; for (let i = 0; i < 2; i++) Render.frame(1 / 60, 1, P, 'chase', { noFx: true }); return Render.snapshot(P, 'chase', 1280).toDataURL('image/png'); });
  fs.writeFileSync(path.join(SHOTS, `tyrebands-${name}.png`), Buffer.from(url.split(',')[1], 'base64'));
};
const side = async (page, name) => {   // (and a close look at the player's left rear wheel from behind its quarter: a fixed camera, setShot)
  if (!SHOTS) return;
  const url = await page.evaluate(() => { const g = window.__game, P = g.race.player, y = P.y || 0, f = [Math.cos(P.h), Math.sin(P.h)], r = [-f[1], f[0]], at = (u, w) => [P.x + f[0] * u + r[0] * w, P.z + f[1] * u + r[1] * w];
    const [px, pz] = at(-4.2, -2.4), [tx, tz] = at(-1.2, -0.6); Render.scene.visible = true; Render.setShot({ px, py: y + 1.1, pz, tx, ty: y + 0.3, tz, near: 0.3, fov: 38 });
    for (let i = 0; i < 2; i++) Render.frame(1 / 60, 1, P, 'chase', { noFx: true });
    const u = Render.snapshot(P, 'chase', 1280).toDataURL('image/png'); Render.setShot(null); Render.frame(0, 1, P, 'chase', { noFx: true }); return u; });
  fs.writeFileSync(path.join(SHOTS, `tyrebands-${name}.png`), Buffer.from(url.split(',')[1], 'base64'));
};
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'chase', zoom: 1.1, cmp: 'S', pitCmp: 'H', radio: 0, damage: 0 }, { width: 640, height: 360 });
  await page.evaluate(() => { window.__game.S.car = Core.MODELS.findIndex(m => m.id === 'kaze'); });
  await startTrack(page, 'bathurst');
  await page.evaluate(() => {
    const g = window.__game; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
    // (in the page: a geometry's vertices in a band's colour: its colour times one shade for all three channels (the body's shading,
    // carAO), at a place f(x, y, z) says; the crew's tyre colours; a car's band and its wheels / body)
    const rgb = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
    window.__tb = {
      rgb,
      count(geo, col, f) { const C = geo.attributes.color.array, P = geo.attributes.position.array, B = rgb(col); let n = 0;
        for (let i = 0; i < C.length; i += 3) { const k = C[i] / B[0]; if (!(k > 0.7 && k < 1.01) || Math.abs(C[i + 1] - k * B[1]) > 2e-3 || Math.abs(C[i + 2] - k * B[2]) > 2e-3) continue;
          if (f && !f(P[i], P[i + 1], P[i + 2])) continue; n++; }
        return n; },
      crew(k) { const a = Render.crew.M.tyre.instanceColor.array; return [a[k * 3], a[k * 3 + 1], a[k * 3 + 2]]; },
      is(c, col) { const B = rgb(col); return Math.hypot(c[0] - B[0], c[1] - B[1], c[2] - B[2]) < 1e-3; },
      meshes(v) { let n = 0; v.grp.traverse(o => { if (o.isMesh) n++; }); return n; },
      // one of the 11: the band verts in its body (out beside it, below the hubs' height x 2) and in each front wheel's mesh
      stock(c, col) { const v = Render.viewOf(c), M = c.m, out = (x, y, z) => Math.abs(z) > M.wid / 2 + 0.018 && y < 2 * M.rw + 0.05;
        return { band: v.band, body: this.count(v.body.geometry, col, out), wheels: v.wf.map(w => this.count(w.geometry, col)), n: v.body.geometry.attributes.position.count, nw: v.wf.map(w => w.geometry.attributes.position.count), meshes: this.meshes(v) }; },
    };
  });
  const H = await page.evaluate(() => Core.TYRE_CMP.H.col), S = await page.evaluate(() => Core.TYRE_CMP.S.col);
  // ---- the start: every car's band in its compound's colour ----
  const a = await page.evaluate(() => {
    const g = window.__game, R = g.race, P = R.player, tb = window.__tb; Render.frame(0, 1, P, 'chase', { noFx: true });
    const cars = R.cars.map(c => { const col = Core.TYRE_CMP[c.ty && c.ty.c] ? Core.TYRE_CMP[c.ty.c].col : null, s = col != null ? tb.stock(c, col) : null;
      return { id: c.m.id, body: c.m.body, me: c.isPlayer, k: c.ty && c.ty.k, c: c.ty && c.ty.c, ok: !!s && s.band === col && s.body === 144 && s.wheels.length === 2 && s.wheels.every(n => n === 144), s }; });
    return { cars, cmp: [...new Set(R.cars.map(c => c.ty && c.ty.c))], wst: !!R.wst, pitCmp: P.pitCmp };
  });
  const bad = a.cars.filter(c => !c.ok);
  T.check('a race with compounds: every car on slicks of one (the player on Mehke), the slicks for the stop Trde', a.wst && a.cars.every(c => c.k === 'dry' && ['S', 'M', 'H'].includes(c.c)) && a.cars.find(c => c.me).c === 'S' && a.pitCmp === 'H', JSON.stringify({ cmp: a.cmp, pitCmp: a.pitCmp, me: a.cars.find(c => c.me) && a.cars.find(c => c.me).c }));
  T.check('KAZE RS against the road cars: every car\'s band in its compound\'s colour, 12 segments on each rear wheel\'s outer wall (in the body) and on both walls of each front wheel', !bad.length && a.cars.every(c => ['coupe', 'sedan', 'hatch', 'wedge'].includes(c.body)),
    `${a.cars.length} cars, compounds ${a.cmp.join('')}` + (bad.length ? ' — ' + JSON.stringify(bad.slice(0, 3)) : ''));
  // ---- the crew: the new set white (Trde for the stop), the old one red; a wet line: the new set blue ----
  const cr = await page.evaluate(([H, S]) => {
    const g = window.__game, R = g.race, P = R.player, tb = window.__tb, W = R.wst, l0 = W.line; Render.frame(0, 1, P, 'chase', { noFx: true });
    const dry = { nw: [0, 1, 2, 3].every(k => tb.is(tb.crew(k), H)), old: [4, 5, 6, 7].every(k => tb.is(tb.crew(k), S)) };
    W.line = 0.9; Render.frame(0, 1, P, 'chase', { noFx: true }); const c = tb.crew(0), wet = { blue: c[2] > 0.8 && c[2] > c[0] * 3 && c[2] > c[1] * 1.4, old: tb.is(tb.crew(4), S) };
    W.line = l0; Render.frame(0, 1, P, 'chase', { noFx: true }); const back = tb.is(tb.crew(0), H);
    return { dry, wet, back, c: c.map(v => +v.toFixed(3)) };
  }, [H, S]);
  T.check('the pit crew\'s tyres: the new set in the compound asked for (white), the old one in the car\'s (red); a wet line: the new set blue, dry again: white', cr.dry.nw && cr.dry.old && cr.wet.blue && cr.wet.old && cr.back, JSON.stringify(cr));
  // ---- the race on, a picture behind the car; then one stop ----
  await page.evaluate(() => { const g = window.__game, P = g.race.player; Render.scene.visible = false; for (let i = 0; i < 16; i++) { g.sim(0.5, true); Render.frame(0.5, 1, P, 'chase', { noFx: true }); } Render.scene.visible = true; });
  await shot(page, '1-race'); await side(page, '1-side');
  let r = null, work = null, shots = { box: false, on: false, out: false };
  for (let k = 0; k < 900 && !(r && r.rep && !r.inPit && r.outT > 2); k++) {
    r = await page.evaluate(([H, S]) => {
      const g = window.__game, P = g.race.player, Tk = g.race.track, tb = window.__tb, o = { rep: 0, inPit: false, outT: window.__outT || 0, work: null, stop: null }; Render.scene.visible = false;
      const near = P.inPit || Tk.pitAt(P.q.s) || P.repairN, n = near ? 20 : 4, dt = near ? 0.05 : 0.5;
      for (let i = 0; i < n; i++) {
        g.sim(dt, true); Render.frame(dt, 1, P, 'chase', { noFx: true });
        if (P.lap >= 1 && !P.repairN && !P.inPit && !Tk.pitAt(P.q.s)) P.pitWant = true;
        if (P.repairN && !P.inPit) { P.pitWant = false; window.__outT = (window.__outT || 0) + dt; }
        const u = Core.repairU(P), c = Render.crew;
        if (P.pitState === 'repair' && c.mode === 'work' && u > 0.1 && u < 0.2 && !window.__sb) { window.__sb = 1; o.stop = 'box'; break; }   // (in the box, the old wheels still on: a picture)
        if (P.pitState === 'repair' && c.mode === 'work' && u > Math.max(Core.REPAIR.wheel, Core.REPAIR.body[1]) + 0.04 && !o.work && !window.__wk) { window.__wk = 1; const v = Render.viewOf(P), M = P.m, out = (x, y, z) => Math.abs(z) > M.wid / 2 + 0.018 && y < 2 * M.rw + 0.05;
          o.work = { u: +u.toFixed(2), front: v.wf.map(w => tb.count(w.geometry, H)), rearS: tb.count(v.body.geometry, S, out), rearH: tb.count(v.body.geometry, H, out), nw: [0, 1, 2, 3].every(k => tb.is(tb.crew(k), H)), old: [4, 5, 6, 7].every(k => tb.is(tb.crew(k), S)), ty: P.ty.c };
          o.stop = 'on'; break; }
        if (P.repairN && !P.inPit && !window.__so) { window.__so = 1; o.stop = 'out'; break; }
      }
      Render.scene.visible = true; o.rep = P.repairN || 0; o.inPit = !!P.inPit; o.outT = window.__outT || 0;
      return o;
    }, [H, S]);
    if (r.work) work = r.work;
    if (r.stop && !shots[r.stop]) { shots[r.stop] = true; await shot(page, { box: '2-box-old', on: '3-box-new', out: '4-out' }[r.stop]); if (r.stop === 'out') await side(page, '4-side'); }
  }
  T.check('the crew at work, the new set pushed home: the front wheels (meshes) in the hard\'s band, the rear ones (in the body) still in the soft\'s till the car is out; the crew\'s new set white, the old red',
    !!work && work.ty === 'S' && work.front.length === 2 && work.front.every(n => n === 144) && work.rearS === 144 && work.rearH === 0 && work.nw && work.old, JSON.stringify(work));
  const b = await page.evaluate(([H, S]) => {
    const g = window.__game, P = g.race.player, tb = window.__tb; Render.frame(0, 1, P, 'chase', { noFx: true });
    const s = tb.stock(P, H), v = Render.viewOf(P), M = P.m, out = (x, y, z) => Math.abs(z) > M.wid / 2 + 0.018 && y < 2 * M.rw + 0.05;
    return { rep: P.repairN, c: P.ty.c, k: P.ty.k, s, soft: tb.count(v.body.geometry, S, out), softW: v.wf.map(w => tb.count(w.geometry, S)), old: [4, 5, 6, 7].every(k => tb.is(tb.crew(k), S)), nw: tb.is(tb.crew(0), H) };
  }, [H, S]);
  T.check('out of the box after one stop: the car on the hards, all four wheels in their white band (its body built afresh), none in the soft\'s; the crew\'s old set still red',
    b.rep === 1 && b.k === 'dry' && b.c === 'H' && b.s.band === H && b.s.body === 144 && b.s.wheels.every(n => n === 144) && b.soft === 0 && b.softW.every(n => n === 0) && b.old && b.nw, JSON.stringify(b));
  T.check('the stop seen from the camera behind the car (in the box, the new set on, out of the box)', shots.box && shots.on && shots.out, JSON.stringify(shots));
  // ---- a car without tyres (no compounds): no band, the ring's 144 vertices fewer in its body and in each front wheel, the same meshes ----
  const n = await page.evaluate(() => {
    const g = window.__game, R = g.race, tb = window.__tb, A = R.cars.find(c => !c.isPlayer && !c.inPit), col = Core.TYRE_CMP[A.ty.c].col, s0 = tb.stock(A, col);
    A.ty = null; A.repairN = (A.repairN || 0) + 1; Render.frame(0, 1, R.player, 'chase', { noFx: true });
    const s1 = tb.stock(A, col), v = Render.viewOf(A);
    return { s0, s1, none: v.band === null, n: s0.n - s1.n, nw: s0.nw.map((q, i) => q - s1.nw[i]) };
  });
  T.check('a car without tyres (a race without compounds): no band, 144 vertices fewer in its body and in each front wheel, the same meshes (no draw call more with it)',
    n.none && n.n === 144 && n.nw.every(q => q === 144) && n.s1.body === 0 && n.s1.wheels.every(q => q === 0) && n.s0.meshes === n.s1.meshes, JSON.stringify({ n: n.n, nw: n.nw, body: n.s1.body, wheels: n.s1.wheels, meshes: [n.s0.meshes, n.s1.meshes] }));
  // ---- kit cars in their own fields: LEV S (a ring of 16 / 10 segments), KOLIBRI (round tyres: the shoulder) ----
  for (const id of ['levs', 'kolibri']) {
    const kc = await page.evaluate((id) => {
      const g = window.__game, tb = window.__tb; g.S.car = Core.MODELS.findIndex(m => m.id === id); g.onAction('restart'); g.pause();
      const R = g.race, P = R.player; Render.frame(0, 1, P, 'chase', { noFx: true });
      const E = Render.kitInfo(id), wheel = (c, hi) => { const v = Render.viewOf(c), col = Core.TYRE_CMP[c.ty.c].col;
        return { band: v.band === col, ws: [...v.wf, ...v.wr].map((w, j) => { const geo = w.geometry, n = geo.attributes.position.count, base = (hi ? E.wheels.hi : E.wheels.lo)[j < 2 ? 0 : 1] * 3;
          return { band: tb.count(geo, col), outer: tb.count(geo, col, (x, y, z) => z > 0), extra: n - base, tris: n / 3, mir: (w.position.z < 0) === (w.scale.z < 0) }; }), meshes: tb.meshes(v) }; };
      const A = R.cars.find(c => !c.isPlayer && c.m.id === P.m.id);   // (a rival in the same vehicle: its own field)
      return { me: P.m.id, c: P.ty.c, p: wheel(P, true), a: A ? wheel(A, false) : { band: false, ws: [] }, seg: (P.m.def.look.wheels.seg || 16), field: [...new Set(R.cars.map(c => c.m.id))] };
    }, id);
    if (id === 'kolibri') { await page.evaluate(() => { const g = window.__game, P = g.race.player; Render.scene.visible = false; for (let i = 0; i < 20; i++) { g.sim(0.5, true); Render.frame(0.5, 1, P, 'chase', { noFx: true }); } Render.scene.visible = true; }); await shot(page, '5-kolibri'); await side(page, '5-side'); }
    const round = kc.seg > 16, pOk = kc.p.band && kc.p.ws.length === 4 && kc.p.ws.every(w => w.mir && w.tris <= 400 && w.band === w.outer && (round ? w.extra === 0 && w.band === kc.seg * 6 : w.extra === 96 && w.band === 96));
    const aOk = kc.a.band && kc.a.ws.length === 4 && kc.a.ws.every(w => w.mir && w.tris <= 160 && w.extra === 60 && w.band === 60 && w.outer === 60);
    T.check(`${id}: the player's four wheels with the band on the outer wall (${round ? 'round tyres: the shoulder, no triangle more' : 'a ring of 16 segments'}), a rival's a ring of 10, within 400 / 160 triangles`, kc.me === id && pOk && aOk,
      JSON.stringify({ c: kc.c, seg: kc.seg, field: kc.field, p: kc.p.ws.map(w => `${w.band}/${w.outer}+${w.extra} ${w.tris}`), a: kc.a.ws.map(w => `${w.band}/${w.outer}+${w.extra} ${w.tris}`) }));
  }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
