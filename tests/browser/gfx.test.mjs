// The common graphics of every track (Posodobi grafiko): the sun's glint on the cars' paint and glass (one shader patch on every paint
// material; Pikes Peak keeps its own dust-and-glint layer), the water (the sky mirrored in it, waves, and along the real waterline a
// shore band with the foam and the shallows), the worn tarmac (patches, sealed cracks, the rubber on a circuit's racing line; none on a
// gravel road nor on Pikes Peak, whose road has its own). On every track all of it is built and drawn without an error; the water
// mirrors the race's sky (dark at night), the foam shows at the shore, the wear darkens with the rain.
//   node tests/browser/gfx.test.mjs
import { serve, launch, openGame, startTrack, trackIds, checker } from './lib.mjs';

const T = checker('graphics: car glint, water, worn tarmac');
const WATER = ['jezero', 'riviera', 'ljubljana', 'monaco', 'gozd', 'toskana', 'suzuka', 'ouninpohja'];   // (with a shore band; Pikes Peak: its reservoir only)
const NO_WEAR = ['gora', 'ouninpohja', 'pikes', 'pikesg'];   // (pikesg: Pikes Peak on its historic gravel road)
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 1, camera: 'chase', weather: 'dry' }, { width: 640, height: 360 });
  const frames = (n) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const look = () => page.evaluate(() => {
    const key = (m) => (m && m.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? m.customProgramCacheKey() : '');
    const cars = { body: {}, paint: {} }, water = [], bands = [], wear = { meshes: 0, verts: 0, alpha: 0 };
    Render.scene.traverse(o => {
      if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
      const m = o.material, k = key(m);
      if (m.userData && m.userData.dirt) cars.body[k] = (cars.body[k] || 0) + 1;   // (a car's body)
      else if (m.isMeshPhongMaterial && m.envMap && !m.vertexColors && m.reflectivity === 0.2) cars.paint[k] = (cars.paint[k] || 0) + 1;   // (its painted panels)
      if (k.startsWith('water|')) { const a = o.geometry.attributes.shore; if (a) { let mn = 1e9, mx = -1e9; for (let i = 0; i < a.count; i++) { mn = Math.min(mn, a.getX(i)); mx = Math.max(mx, a.getX(i)); } bands.push([mn, mx, a.count]); } else water.push(o.geometry.attributes.position.count); }
      if (o.name === 'roadwear') { wear.meshes++; const c = o.geometry.attributes.color; wear.verts += c.count; for (let i = 3; i < c.array.length; i += 4) wear.alpha = Math.max(wear.alpha, c.array[i]); }
    });
    return { cars, water, bands, wear };
  });

  // 1. every track: built and drawn, the glint on every car, the water and its shore, the wear
  const ids = await trackIds(page), bad = [];
  for (const id of ids) {
    await startTrack(page, id);
    await frames(3);
    const L = await look(), pk = id === 'pikes' || id === 'pikesg', why = [];
    const bodies = Object.keys(L.cars.body), paints = Object.keys(L.cars.paint);
    if (!bodies.length || bodies.some(k => k !== (pk ? 'pkCarB' : 'dirtyCarCg'))) why.push('bodies ' + JSON.stringify(L.cars.body));
    if (paints.some(k => k !== (pk ? 'pkCarP' : 'carCg'))) why.push('paint ' + JSON.stringify(L.cars.paint));
    const wet = WATER.includes(id);
    if (wet !== !!L.bands.length || (wet && L.bands.some(b => b[0] > -1.99 || b[1] < 9.99 || b[2] < 50))) why.push('shore bands ' + JSON.stringify(L.bands));
    if ((wet || pk) !== !!L.water.length) why.push('water ' + JSON.stringify(L.water));
    const worn = !NO_WEAR.includes(id);
    if (worn !== L.wear.meshes > 0 || (worn && (L.wear.verts < 500 || L.wear.alpha < 0.5))) why.push('wear ' + JSON.stringify(L.wear));
    if (why.length) bad.push(id + ': ' + why.join('; '));
    console.log(`  ${id.padEnd(11)} cars ${JSON.stringify(L.cars.body)} water ${L.water.length} bands ${L.bands.map(b => b[2]).join('+') || 0} wear ${L.wear.meshes}/${L.wear.verts}`);
  }
  T.check('every track: the glint on every car (Pikes Peak its own), the water with its shore band where there is water, the worn tarmac where it is tarmac', !bad.length && ids.length >= 14, bad.join(' | '));
  T.check('no shader or page errors on any track', errors.length === 0, errors.slice(0, 5).join(' | '));

  // 2. the foam at the shore: the Riviera's beach seen from above (the shore band drawn, then hidden: the band adds the white of the foam and the surf)
  await startTrack(page, 'riviera');
  await page.evaluate(() => window.__game.pause());
  const white = (band) => page.evaluate((band) => {
    let B = null; Render.world.root.traverse(o => { if (o.isMesh && o.geometry.attributes.shore) B = o; });
    const a = B.geometry.attributes.shore, p = B.geometry.attributes.position, P = window.__game.race.player; let best = null;
    for (let i = 0; i < a.count; i++) if (Math.abs(a.getX(i)) < 2.5) { const d = Math.hypot(p.getX(i) - P.x, p.getZ(i) - P.z); if (!best || d < best.d) best = { d, x: p.getX(i), y: p.getY(i), z: p.getZ(i) }; }
    B.visible = band;
    Render.setShot({ px: best.x, py: best.y + 16, pz: best.z - 5, tx: best.x, ty: best.y, tz: best.z + 4, fov: 50, fogD: 60, near: 0.5 });
    const cv = Render.snapshot(P, 'chase', 640), g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data;
    let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 205 && d[i + 1] > 205 && d[i + 2] > 205) n++;
    Render.setShot(null); B.visible = true;
    return +(n / (d.length / 4)).toFixed(4);
  }, band);
  const w1 = await white(true), w0 = await white(false);
  T.check('the Riviera: the foam and the surf white at the beach (the shore band drawn vs hidden)', w1 > w0 + 0.01, JSON.stringify({ with: w1, without: w0 }));

  // 3. the water mirrors the race's sky: at night a dark one
  const sky = () => page.evaluate(() => { const c = World.waterSky.top.value; return +((c.r + c.g + c.b) / 3).toFixed(3); });
  const day = await sky();
  await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'night' })); await frames(3);
  const night = await sky();
  await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'day' })); await frames(3);
  T.check('the sky in the water: the day\'s blue, a dark night', day > 0.4 && night < 0.1, JSON.stringify({ day, night }));

  // 4. the wear darkens with the road in the rain
  const wearCol = () => page.evaluate(() => { let c = null; Render.world.root.traverse(o => { if (o.name === 'roadwear' && !c) c = o.material.color.r; }); return c; });
  const dry = await wearCol();
  await page.evaluate(() => window.__game.race.setRain(1)); await frames(4);
  const wetC = await wearCol();
  T.check('the patches and cracks darken with the wet road', dry > 0 && wetC < dry * 0.75, JSON.stringify({ dry, wet: wetC }));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
