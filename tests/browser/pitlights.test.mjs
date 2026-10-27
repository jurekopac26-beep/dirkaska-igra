// The pits lit at dusk and at night (Render: pitLights, PIT_LOOK): on every circuit with pits, at night, one mesh of additive quads over the
// crews' boxes (13; Townsville's 10 garages, 12 m apart) ('pitLights': the garages' insides, the light out of the doors onto the apron, a light bar over each door, the lamps' pools
// on the apron and the lane), two lamps a box on the garages' side (Crystal Palace's stalls and Longford's shed: three warm bulbs), nothing
// past the lane towards the circuit; its bounding sphere round the pits only (out of view: not drawn). Dimmer at dusk, dimmer still in the
// morning, none by day (nothing built) and none on a track without pits; an endurance race's clock turns them on and off; the old mesh freed
// with a new world. Then Bathurst (the lane on the left, the pit building's roof over the apron) and Spa in a race at night, the camera behind
// the car in its box: the pits' lights cost at most 2 draw calls (their mesh, the lamps' sheen on the dry floor), the picture brighter; by day
// none of them drawn.
//   node tests/browser/pitlights.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('pit lights (dusk, night)');
const srv = await serve();
const browser = await launch();
const PITS = ['spa', 'rbring', 'bathurst', 'cpalace', 'longford', 'rio', 'montreal', 'newcastle', 'toronto', 'detroit', 'bangsaen', 'townsville', 'troisrivieres'];
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', tod: 'night', weather: 'dry' }, { width: 844, height: 390 });
  // 1. every track with pits, its world built at night: the lights where the garages are
  const res = [];
  for (const id of PITS) {
    res.push(await page.evaluate((id) => {
      Render.setAtmos({ season: 'summer', tod: 'night' });
      const def = Core.TRACKS.find(d => d.id === id), Tr = new Core.Track(def), W = Render.buildWorld(Tr, 1), B = W.pitBoxes || [], sh = Render.show.pits, m = Render.scene.getObjectByName('pitLights');
      if (!sh || !m) return { id, none: true };
      // each point's place in the frame of its nearest box: a (along the lane from the box's middle), w (out from the centre line, to the
      // garages, from the lane's outer edge), its height over the floor there (the box's, along the lane's slope)
      const hy = (s) => (Tr.hasElev && Tr.hy ? Tr.hy[Tr.idx(s)] : 0);
      const fr = (x, y, z) => { let best = null; for (const b of B) { const dx = x - b.ox, dz = z - b.oz, a = dx * b.tx + dz * b.tz; if (!best || Math.abs(a) < Math.abs(best.a)) best = { a, w: dx * b.nx + dz * b.nz - b.base, h: y - (b.y || 0) - hy(b.s + a) + hy(b.s) }; } return best; };
      const P = m.geometry.attributes.position.array; let wMin = 99, wMax = -99, hMin = 99, hMax = -99;
      for (let i = 0; i < P.length; i += 3) { const f = fr(P[i], P[i + 1], P[i + 2]); wMin = Math.min(wMin, f.w); wMax = Math.max(wMax, f.w); hMin = Math.min(hMin, f.h); hMax = Math.max(hMax, f.h); }
      const bs = m.geometry.boundingSphere, mid = B.reduce((s, b) => [s[0] + b.ox / B.length, s[1] + b.oz / B.length], [0, 0]);
      return { id, boxes: sh.boxes, nB: B.length, quads: sh.quads, lamps: sh.lamps, kind: sh.kind, k: sh.k, wMin: +wMin.toFixed(2), wMax: +wMax.toFixed(2), hMin: +hMin.toFixed(2), hMax: +hMax.toFixed(2),
        r: Math.round(bs.radius), off: Math.round(Math.hypot(bs.center.x - mid[0], bs.center.z - mid[1])), add: m.material.blending === THREE.AdditiveBlending, cast: m.castShadow, n: Render.scene.children.filter(o => o.name === 'pitLights').length };
    }, id));
  }
  const bad = res.filter(r => r.none || r.boxes !== r.nB || r.nB < (r.id === 'townsville' ? 10 : 13) || r.n !== 1 || !r.add || r.cast || r.k !== 1 || r.lamps !== r.nB * (r.kind === 'bulb' ? 3 : 2) || r.quads < 2 * r.nB);
  T.check('at night on all 13 tracks with pits: one additive mesh of the pits\' lights over the crews\' boxes (no shadow), two lamps a box (three bulbs in the 1930s stalls and the 1950s shed)', !bad.length,
    (bad.length ? 'bad: ' + JSON.stringify(bad) + ' ' : '') + res.map(r => `${r.id} ${r.kind} ${r.quads}q ${r.lamps}l`).join(', '));
  const side = res.filter(r => !r.none && (r.wMin < -7 || r.wMax > 23 || r.hMin < -0.3 || r.hMax > 6));
  T.check('the lights on the garages\' side of the lane only (nothing past the lane towards the circuit), on the floor and the garages (up to 6 m)', !side.length,
    (side.length ? 'bad: ' + JSON.stringify(side) + ' ' : '') + res.map(r => `${r.id} w ${r.wMin}..${r.wMax} h ${r.hMin}..${r.hMax}`).join(', '));
  const sph = res.filter(r => !r.none && (r.r > 130 || r.off > 60));
  T.check('the mesh\'s bounding sphere round the pits only (out of view: not drawn)', !sph.length, res.map(r => `${r.id} r ${r.r} m`).join(', '));

  // 2. the time of day (on the last world, Trois-Rivières): dusk dimmer, the morning dimmer still, none by day; an endurance race's clock
  const tod = await page.evaluate(() => {
    const k = () => (Render.show.pits ? Render.show.pits.k : 0), n = () => Render.scene.children.filter(o => o.name === 'pitLights').length, o = {};
    let freed = 0; const m0 = Render.scene.getObjectByName('pitLights'); m0.geometry.addEventListener('dispose', () => freed++);
    Render.setAtmos({ season: 'summer', tod: 'dusk' }); o.dusk = k();
    Render.setAtmos({ season: 'summer', tod: 'dawn' }); o.dawn = k();
    Render.setAtmos({ season: 'summer', tod: 'day' }); o.day = k(); o.dayN = n(); o.dayShow = Render.show.pits;
    Render.setAtmos({ season: 'summer', tod: 'night' }); o.night = k(); o.freed = freed;
    Render.setTodK(0.1); o.e1 = k(); Render.setTodK(0.35); o.e2 = k(); Render.setTodK(0.8); o.e3 = k(); Render.setTodK(1); o.e4 = k(); o.n = n();
    // a track without pits at night: none; the old mesh freed
    const m1 = Render.scene.getObjectByName('pitLights'); let f1 = 0; m1.geometry.addEventListener('dispose', () => f1++);
    Render.buildWorld(new Core.Track(Core.TRACKS.find(d => d.id === 'monaco')), 1); o.monaco = Render.show.pits; o.monacoN = n(); o.f1 = f1;
    return o;
  });
  T.check('dusk dimmer than night, the morning dimmer still; by day none built (nothing drawn)', tod.night === 1 && tod.dusk > 0.5 && tod.dusk < 0.75 && tod.dawn > 0.3 && tod.dawn < tod.dusk && tod.day === 0 && tod.dayN === 0 && tod.dayShow === null,
    JSON.stringify({ night: tod.night, dusk: tod.dusk, dawn: tod.dawn, day: tod.day, dayN: tod.dayN }));
  T.check('an endurance race\'s clock: off in the day (todK 0.1), coming on at dusk, full at night; one mesh, the old one freed', tod.e1 === 0 && tod.e2 > 0 && tod.e2 < tod.e3 && tod.e3 < tod.e4 && tod.e4 === 1 && tod.n === 1 && tod.freed >= 1,
    JSON.stringify({ e: [tod.e1, tod.e2, tod.e3, tod.e4], n: tod.n, freed: tod.freed }));
  T.check('a track without pits (Monaco) at night: none; the last world\'s mesh freed', tod.monaco === null && tod.monacoN === 0 && tod.f1 === 1, JSON.stringify({ monaco: tod.monaco, n: tod.monacoN, freed: tod.f1 }));

  // 3. in a race at night, the camera behind the car in its box: the draw calls of the pits' lights, the picture brighter with them; by day none
  await page.evaluate(() => {   // count every WebGL draw
    window.__gl = { calls: 0 };
    const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl'), P = Object.getPrototypeOf(gl);
    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) { const f = P[name]; if (f) P[name] = function (...a) { window.__gl.calls++; return f.apply(this, a); }; }
  });
  for (const id of ['bathurst', 'spa']) {
    await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'night' }));
    await startTrack(page, id);
    const r = await page.evaluate(() => {
      const g = window.__game; g.pause(); for (let k = 0; k < 60 && g.phase !== 'racing'; k++) g.sim(0.25, true); Render.setShot(null);
      const P = g.race.player, Tr = g.race.track, pb = Render.world.pitBox, s = pb.s - 7, p = Tr.pitAt(s), o = p.sd * (p.lout + Tr.bayDim().o), i = Tr.idx(s);
      P.place(Tr.px[i] + Tr.nx[i] * o, Tr.pz[i] + Tr.nz[i] * o, Math.atan2(Tr.tz[i], Tr.tx[i])); const hy = Tr.hasElev && Tr.hy ? Tr.hy[i] : 0; P.y = P.py = hy; P.roadY = hy;
      const own = { pit: 0, sheen: 0 }, m = Render.scene.getObjectByName('pitLights'); let st = null; Render.scene.traverse(q => { if (q.material && q.material.uniforms && q.material.uniforms.uRip) st = q; });
      if (m) m.onAfterRender = () => { own.pit++; }; st.onAfterRender = () => { own.sheen++; };
      const cv = document.querySelector('canvas'), c2 = document.createElement('canvas'); c2.width = 211; c2.height = 98; const x2 = c2.getContext('2d');
      const shot = () => { const c0 = __gl.calls, o0 = { ...own }; Render.frame(1 / 60, 1, P, 'chase', {}); const n = __gl.calls - c0; x2.drawImage(cv, 0, 0, 211, 98); const d = x2.getImageData(0, 0, 211, 98).data; let l = 0; for (let k = 0; k < d.length; k += 4) l += d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11;
        return { calls: n, pit: own.pit - o0.pit, sheen: own.sheen - o0.sheen, lum: +(l / (d.length / 4)).toFixed(2) }; };
      Render.resetCam(); for (let k = 0; k < 30; k++) Render.frame(1 / 60, 1, P, 'chase', {});
      const on = shot(), lamps = Render.show.pits && Render.show.pits.lamps;
      m.visible = false; const off = shot(); m.visible = true;
      Render.setAtmos({ season: 'summer', tod: 'day' }); for (let k = 0; k < 3; k++) Render.frame(1 / 60, 1, P, 'chase', {});
      const day = shot(); day.mesh = !!Render.scene.getObjectByName('pitLights');
      Render.setAtmos({ season: 'summer', tod: 'night' });
      return { on, off, day, lamps };
    });
    T.check(`${id} at night, the camera behind the car in its box: the pits' lights drawn (their mesh once, the lamps' sheen once: at most 2 draw calls), the picture brighter with them`,
      r.on.pit === 1 && r.on.sheen === 1 && r.on.lum > r.off.lum + 0.5, JSON.stringify(r));
    T.check(`${id} by day: none of the pits' lights drawn`, !r.day.mesh && r.day.pit === 0 && r.day.sheen === 0, JSON.stringify(r.day));
  }
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
