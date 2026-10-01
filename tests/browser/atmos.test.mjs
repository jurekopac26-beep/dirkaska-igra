// The season and the time of day (Izberi progo: Letni čas, Čas dneva): the settings (at once on the title demo, kept); autumn (the
// world's greens turn to straw and autumn colours), winter (snow on the ground: the grass pictures swapped for snow, the rain falls as
// snow, less grip in the race), dusk (a low, orange sun) and night (a dark sky, floodlights along the track, the cars' headlights on the
// road), dawn (the morning mist in the low ground, the dew); a thunderstorm (lightning and its thunder, the gale, the drops on the TV
// camera's lens); back to summer by day: the world's own colours again.
//   node tests/browser/atmos.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('season and time of day');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'iso', track: 'rbring', weather: 'dry' }, { width: 844, height: 390 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const pick = (set, v) => page.evaluate(([set, v]) => document.querySelector(`[data-set="${set}"] button[data-v="${v}"]`).click(), [set, v]);
  // the world's colours: how green its plants are on average (vertex colours of the ground and the leaves), the grass pictures, the lights
  const look = () => page.evaluate(() => {
    let g = 0, lum = 0, n = 0, snowMaps = 0, pools = 0, beams = 0, beamOn = 0;
    const W = Render.world; W.root.traverse(o => {
      const a = o.geometry && o.geometry.attributes && o.geometry.attributes.color; if (a && n < 400000 && o.name !== 'jet smoke') { /* (not the Red Bull Ring jets' smoke: coloured when they fly over the grid) */ const d = a.array, is = a.itemSize; for (let i = 0; i < d.length && n < 400000; i += is * 7) { g += d[i + 1] - Math.max(d[i], d[i + 2]); lum += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; } }
      for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) if (m.userData && m.map && m.map === m.userData.snowMap) snowMaps++; });
    Render.scene.traverse(o => { if (o.name === 'floodPools') pools = o.userData.n; if (o.isMesh && o.material && o.material.map && o.material.blending === THREE.AdditiveBlending && !o.isInstancedMesh && o.parent && o.parent.type === 'Group') { beams++; if (o.visible) beamOn++; } });
    return { green: +(g / Math.max(1, n)).toFixed(4), lum: +(lum / Math.max(1, n)).toFixed(4), snowMaps, pools, beams, beamOn, fog: Render.scene.fog.color.getHexString(), atmos: Render.atmos, emissive: Render.scene && (() => { let e = 0; Render.scene.traverse(o => { if (o.isMesh && o.material && o.material.emissive && o.material.vertexColors && o.material.envMap) e = Math.max(e, o.material.emissive.r); }); return e; })() };
  });

  // 1. the settings on the track screen, at once on the title demo
  await act('to-track'); await page.waitForTimeout(300);
  const rows = await page.evaluate(() => ['season', 'tod'].map(k => [...document.querySelectorAll(`[data-set="${k}"] button`)].map(b => b.textContent + (b.classList.contains('sel') ? '*' : '')).join(',')));
  const s0 = await look();
  await pick('season', 'autumn'); await page.waitForTimeout(300);
  const s1 = await look();
  T.check('the rows: Letni čas (Poletje, Jesen, Zima) and Čas dneva (Jutro, Dan, Večer, Noč); autumn at once: the plants less green', rows[0] === 'Poletje*,Jesen,Zima' && rows[1] === 'Jutro,Dan*,Večer,Noč' && s1.atmos.season === 'autumn' && s1.green < s0.green - 0.01,
    JSON.stringify({ rows, green: [s0.green, s1.green] }));
  await pick('season', 'winter'); await page.waitForTimeout(300);
  const s2 = await look();
  T.check('winter: snow on the ground (grass pictures swapped for snow), the plants white', s2.atmos.season === 'winter' && s2.snowMaps >= 1 && s2.lum > s0.lum + 0.05, JSON.stringify({ snowMaps: s2.snowMaps, lum: [s0.lum, s2.lum] }));
  await pick('tod', 'night'); await page.waitForTimeout(300);
  const s3 = await look();
  T.check('night: a dark sky, floodlights along the track, the cars lit', s3.atmos.tod === 'night' && parseInt(s3.fog, 16) < 0x202020 && s3.pools > 50 && s3.emissive > 0.1, JSON.stringify({ fog: s3.fog, pools: s3.pools, emissive: s3.emissive }));
  const saved = await page.evaluate(() => { const j = JSON.parse(localStorage.getItem('tdgp-settings')); return j.season + '/' + j.tod; });
  T.check('the choice kept in the settings', saved === 'winter/night', saved);

  // 2. a race on a winter night: less grip, headlights on the road, snow instead of rain
  await pick('weather', 'rain');
  await startTrack(page, 'rbring');
  const r = await page.evaluate(() => { const R = window.__game.race; return { gk: R.cold.gk, wet: R.player.wet }; });
  await page.evaluate(() => { const g = window.__game; g.pause(); g.sim(4, true); g.resume(); });
  await page.waitForTimeout(600);
  const s4 = await look(), fall = await page.evaluate(() => ({ rain: Render.raining, snow: (() => { let v = false; Render.scene.traverse(o => { if (o.isPoints && o.material && o.material.uniforms && o.material.uniforms.uBox && o.visible) v = true; }); return v; })() }));
  T.check('a winter night race: grip x0.94 (x0.8 more in the snow), the headlights\' beams on the road, snow falling instead of rain', Math.abs(r.gk - 0.94) < 1e-9 && Math.abs(r.wet - 0.8 * 0.94) < 0.01 && s4.beamOn >= 10 && fall.snow && !fall.rain,
    JSON.stringify({ r, beams: s4.beamOn, fall }));
  await act('to-title'); await page.waitForTimeout(300);

  // 3. a thunderstorm in summer: the rain's grip, lightning (a strike now: the flash, the bolt, its thunder after it), the gale; the drops on
  //    the lens of the TV cameras, none behind the car
  await act('to-track'); await page.waitForTimeout(200);
  await pick('season', 'summer'); await pick('tod', 'day'); await pick('weather', 'storm');
  await startTrack(page, 'rbring');
  await page.evaluate(() => { window.__th = []; Render.onThunder = (d, k, p) => window.__th.push([d, k, p]); });
  await page.waitForFunction(() => Render.storm.wind > 1.6, null, { timeout: 30000 }).catch(() => {});   // (the gale rising: stronger than the rain's breeze)
  const st = await page.evaluate(async () => { const g = window.__game, R = g.race, a = Render.storm; g.pause(); Render.strike(true); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));   // (paused: the flash held at its peak)
    const o = { storm: R.sky.storm, rain: R.rain, wet: +R.player.wet.toFixed(3), on: a.on, wind: +a.wind.toFixed(2), b: Render.storm, th: window.__th.slice(-1)[0] || null }; g.resume(); return o; });
  T.check('a thunderstorm: the rain\'s grip, a strike lights the world (the bolt drawn), its thunder after it (3 s a km), the gale blowing', st.storm && st.rain === 1 && st.wet > 0.7 && st.wet <= 0.81 && st.on && st.wind > 1.6 && st.b.n >= 1 && st.b.f > 0.2 && st.b.bolt && st.th && st.th[0] > 1.9 && st.th[0] < 22 && st.th[1] > 0,
    JSON.stringify(st));
  await page.waitForFunction(() => !Render.cam.shot, null, { timeout: 60000 }).catch(() => {});   // (after the intro: its shot of the jets is a TV camera's, drops on its lens too)
  await page.evaluate(() => { window.__game.S.camera = 'tv'; }); await page.waitForFunction(() => Render.airFx.lens > 0.1, null, { timeout: 30000 }).catch(() => {});
  const ln = await page.evaluate(() => Render.airFx.lens);
  await page.evaluate(() => { window.__game.S.camera = 'iso'; }); await page.waitForFunction(() => Render.airFx.lens === 0, null, { timeout: 10000 }).catch(() => {});
  const ln2 = await page.evaluate(() => Render.airFx.lens);
  T.check('the drops on the TV camera\'s lens in the rain, none from the game\'s own camera', ln > 0.1 && ln2 === 0, JSON.stringify({ tv: ln, iso: ln2 }));
  await page.evaluate(() => { Render.onThunder = (d, k, p) => Sfx.thunder(d, k, p); });
  await act('to-title'); await page.waitForTimeout(300);

  // 4. dawn: the morning mist lying low, the dew in the grass; then dusk, then back to summer by day: the world's own colours again, no
  //    floodlights, no beams
  await act('to-track'); await page.waitForTimeout(200);
  await pick('weather', 'dry'); await pick('tod', 'dawn'); await page.waitForFunction(() => Render.airFx.mist > 0.15, null, { timeout: 15000 }).catch(() => {});   // (once the demo's rain has stopped)
  const sd = await look(), dm = await page.evaluate(() => Render.airFx.mist);
  T.check('dawn: the morning mist, a warm pale sky, no floodlights', sd.atmos.tod === 'dawn' && dm > 0.15 && sd.pools === 0 && parseInt(sd.fog.slice(0, 2), 16) > parseInt(sd.fog.slice(4, 6), 16), JSON.stringify({ tod: sd.atmos.tod, mist: dm, fog: sd.fog }));
  await pick('tod', 'dusk'); await page.waitForTimeout(200);
  const s5 = await look();
  await pick('season', 'summer'); await pick('tod', 'day'); await page.waitForTimeout(300);
  const s6 = await look();
  T.check('dusk: the headlights on, no floodlights; summer by day: the colours as built, no lights', s5.atmos.tod === 'dusk' && s5.pools === 0 && s6.atmos.season === 'summer' && s6.atmos.tod === 'day' && Math.abs(s6.green - s0.green) < 1e-4 && s6.snowMaps === 0 && s6.pools === 0 && s6.emissive === 0,
    JSON.stringify({ s5: { tod: s5.atmos.tod, pools: s5.pools }, s6, s0: { green: s0.green } }));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
