// Evening races (Grafika 05, js/render-vecer.js): on a real track the lights along the track come on at sunset. At Večer (Bathurst, Visoka)
// the floodlights on their poles and the stands' lamps (a row under a roof's front edge, masts on an open stand's back), each with a pool of
// light on the road and a glow round the lamp, fainter than at night; the dusk's light later than the golden hour (the sun and the sky's
// light dimmer, the sky bluer). On NIZKA in the evening only the pools on the road (no poles, lamps nor glows); at night the floodlights
// whole on every tier, as before; in the rain the wet road mirrors the lamps as strongly as they shine (none on NIZKA's evening). An endurance race's evening (setTodK): no lights by day, on from sunset, the night's full strength at
// night. Jutro stays as it was (no lights). A test track (Jezero) as before: no floodlights at Večer, its dusk's light as it was.
//   node tests/browser/vecer.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('evening races');
const srv = await serve();
const browser = await launch();
const base = { quality: 'high', shadows: 0, camera: 'chase', weather: 'dry', season: 'summer' };
// a race on a track at once (the quick entry), the floodlights as they are drawn
async function race(page, id) {
  await page.goto(srv.base + '/index.html?proga=' + id + '&t=0.5', { timeout: 180000 });
  await page.waitForFunction(() => window.__game && window.__game.quick && window.__game.quick.done, null, { timeout: 300000 });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}
const lights = (page) => page.evaluate(() => {
  const S = Render.scene, get = (n) => S.getObjectByName(n), P = get('floodPools'), poles = get('floodPoles'), heads = get('floodHeads'), G = get('floodGlows');
  const W = Render.world, Tk = window.__game.race.track, st = Render.ext.vecer.stands(W, Tk);
  const ga = G ? Array.from(G.geometry.attributes.pcolor.array).filter((_, j) => j % 4 === 3) : [];
  return { flood: Render.show.flood, todK: Render.show.todK, pools: P ? P.count : 0, opacity: P ? +P.material.opacity.toFixed(3) : 0,
    poles: poles && poles.visible ? poles.count : 0, heads: heads && heads.visible ? heads.count : 0, glows: G && G.visible ? ga.length : 0,
    glowA: ga.length ? +Math.max(...ga).toFixed(3) : 0, standLamps: (W.standLamps || []).length / 6, st: { glow: st.glow.length, mast: st.mast.length, pool: st.pool.length }, len: Tk.len };
});
// in the rain: the wet road's reflections of the lamps (Render's streaks in the floodlights' colour): how many, the strongest
const wetLamps = (page) => page.evaluate(() => {
  const g = window.__game, R = g.race; R.setRain(1);   // (the rain and the water on the road at once)
  for (let i = 0; i < 3; i++) Render.frame(1 / 60, 1, R.player, g.S.camera, {});
  const m = Render.scene.children.find(o => o.geometry && o.geometry.attributes && o.geometry.attributes.iCol), C = m.geometry.attributes.iCol.array, n = m.geometry.instanceCount;
  let c = 0, a = 0; for (let i = 0; i < n; i++) if (Math.abs(C[i * 4] - 1) < 1e-3 && Math.abs(C[i * 4 + 1] - 0.8) < 1e-3 && Math.abs(C[i * 4 + 2] - 0.52) < 1e-3) { c++; a = Math.max(a, C[i * 4 + 3]); }
  R.setRain(0); for (let i = 0; i < 2; i++) Render.frame(1 / 60, 1, R.player, g.S.camera, {});
  return { n: c, a: +a.toFixed(3) };
});
try {
  // 1. Bathurst at Večer, Visoka: the floodlights and the stands' lamps on, fainter than at night
  {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', Object.assign({ detail: 'high', tod: 'dusk' }, base), { width: 640, height: 360 });
    await race(page, 'bathurst');
    const d = await lights(page);
    const K = await page.evaluate(() => Render.ext.vecer.lampK(0.5, window.__game.race.track.def));
    T.check('Večer on a real track (Bathurst, Visoka): the floodlights on along the track, fainter than at night', d.flood && d.pools > 50 && d.poles > 30 && d.heads === d.poles && d.glows > 30 && K > 0.5 && K < 1 && Math.abs(d.opacity - 0.56 * K) < 0.002,
      JSON.stringify({ flood: d.flood, pools: d.pools, poles: d.poles, glows: d.glows, opacity: d.opacity, K }));
    T.check('the stands\' lamps: glows under the roofs and on the masts of the open stands, pools of light on the road in front of them', d.standLamps > 10 && d.st.glow > 10 && d.st.mast > 5 && d.st.pool > 5 && d.poles >= d.st.mast,
      JSON.stringify({ standLamps: d.standLamps, st: d.st }));
    // no pole of the track's own in front of a stand: fewer poles than every 30 m round the track
    T.check('no pole of the track\'s own between a stand and the road', d.poles - d.st.mast < Math.floor(d.len / 30), JSON.stringify({ poles: d.poles - d.st.mast, every30: Math.floor(d.len / 30) }));
    // the dusk's light: a real track's later than the golden hour (js/render-vecer.js dusk), a test track's as it was
    const dk = await page.evaluate(() => {
      const V = Render.ext.vecer, mk = () => ({ sunI: 1, hemiI: 1, off: [10, 30, 10], sunC: new THREE.Color(0xff8a40), fog: new THREE.Color(0xeea070), sky: new THREE.Color(0xc49ab8), gnd: new THREE.Color(0x6a4430), bloom: 0.5 });
      const a = mk(), b = mk(), c = mk(); V.dusk(a, { id: 'x' }, 0); V.dusk(b, { id: 'y', test: true }, 0); V.dusk(c, { id: 'x' }, 1);
      return { D: V.DUSK, real: { sunI: a.sunI, hemiI: a.hemiI, sky: a.sky.getHex(), blue: a.sky.b - a.sky.r }, test: { sunI: b.sunI, hemiI: b.hemiI, sky: b.sky.getHex(), bloom: b.bloom }, rain: c.sunI };
    });
    // (DUSK: how much later a real track's evening is, the user's choice grafika-05-mrak; 0: the light as it was)
    const D = dk.D, near = (x, y) => Math.abs(x - y) < 1e-6;
    T.check('the dusk\'s light on a real track: the sun and the sky\'s light dimmer, the sky bluer (by DUSK); a test track\'s as it was; in the rain less', near(dk.real.sunI, 1 - 0.6 * D) && near(dk.real.hemiI, 1 - 0.45 * D) && (D === 0 || (dk.real.blue > 0 && dk.rain > dk.real.sunI && dk.rain < 1)) && dk.test.sunI === 1 && dk.test.hemiI === 1 && dk.test.sky === 0xc49ab8 && dk.test.bloom === 0.5,
      JSON.stringify(dk));
    const wd = await wetLamps(page);
    // night, as before: the floodlights at their full strength
    await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'night' }));
    const n = await lights(page), wn = await wetLamps(page);
    T.check('in the rain the wet road mirrors the lamps: at Večer as strong as they shine, at night in full', wd.n > 0 && wn.n > 0 && Math.abs(wd.a - 0.38 * K) < 0.01 && Math.abs(wn.a - 0.38) < 0.01, JSON.stringify({ vecer: wd, noc: wn, K }));
    T.check('Noč: the floodlights and the stands\' lamps at their full strength', n.flood && Math.abs(n.opacity - 0.56) < 0.002 && n.poles === d.poles && n.glows === d.glows && n.glowA > d.glowA,
      JSON.stringify({ opacity: n.opacity, poles: n.poles, glows: n.glows, glowA: [d.glowA, n.glowA] }));
    // an endurance race's evening (setTodK): dark by day, on from sunset, the night's at night
    const e = [];
    for (const k of [0.1, 0.3, 0.5, 0.8, 1]) { await page.evaluate((k) => Render.setTodK(k), k); const l = await lights(page); e.push({ k, flood: l.flood, opacity: l.opacity }); }
    T.check('an endurance race\'s evening: no lights by day, on as the sun goes down, the night\'s full strength at night', !e[0].flood && e[1].flood && e[1].opacity < e[2].opacity && e[2].opacity <= e[3].opacity && e[3].opacity <= e[4].opacity && Math.abs(e[4].opacity - 0.56) < 0.002,
      JSON.stringify(e));
    // Jutro as it was: no lights
    await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'dawn' }));
    const j = await lights(page);
    T.check('Jutro as it was: no floodlights', !j.flood && j.pools === 0, JSON.stringify({ flood: j.flood, pools: j.pools }));
    T.check('no page errors (Visoka)', errors.length === 0, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }
  // 2. Bathurst at Večer, NIZKA: only the pools on the road; at night the whole floodlights, as before
  {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', Object.assign({ detail: 'low', tod: 'dusk' }, base), { width: 640, height: 360 });
    await race(page, 'bathurst');
    const d = await lights(page), wd = await wetLamps(page);
    T.check('Večer on NIZKA: the pools of light on the road, no poles, lamps nor glows (in the rain no reflections of them)', d.flood && d.pools > 50 && d.opacity > 0.3 && d.poles === 0 && d.heads === 0 && d.glows === 0 && wd.n === 0,
      JSON.stringify({ flood: d.flood, pools: d.pools, opacity: d.opacity, poles: d.poles, glows: d.glows, wet: wd }));
    await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'night' }));
    const n = await lights(page), wn = await wetLamps(page);
    T.check('Noč on NIZKA: the floodlights whole, as before (in the rain their reflections in full)', n.flood && n.pools > 50 && n.poles > 30 && n.heads === n.poles && n.glows > 30 && wn.n > 0 && Math.abs(wn.a - 0.38) < 0.01, JSON.stringify({ pools: n.pools, poles: n.poles, glows: n.glows, wet: wn }));
    T.check('no page errors (NIZKA)', errors.length === 0, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }
  // 3. a test track (Jezero, frozen until it is deleted: CLAUDE.md) at Večer: as before, no floodlights
  {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', Object.assign({ detail: 'high', tod: 'dusk' }, base), { width: 640, height: 360 });
    await race(page, 'jezero');
    const d = await lights(page);
    const k = await page.evaluate(() => { const V = Render.ext.vecer, def = window.__game.race.track.def; return { test: !!def.test, dusk: V.lampK(0.5, def), night: V.lampK(1, def), look: V.look(0.5, def, 0), stands: V.stands(Render.world, window.__game.race.track).glow.length }; });
    await page.evaluate(() => Render.setAtmos({ season: 'summer', tod: 'night' }));
    const wn = await wetLamps(page);
    T.check('a test track (Jezero) at Večer as before: no floodlights, no stands\' lamps; at night the floodlights and their reflections in the rain as before', k.test && !d.flood && d.pools === 0 && k.dusk === 0 && k.night === 1 && k.look.glow === 1 && k.look.refl === 1 && !k.look.bare && k.stands === 0 && wn.n > 0 && Math.abs(wn.a - 0.38) < 0.01,
      JSON.stringify({ flood: d.flood, k, wet: wn }));
    T.check('no page errors (Jezero)', errors.length === 0, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
