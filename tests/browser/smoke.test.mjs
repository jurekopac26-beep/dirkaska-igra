// Browser smoke test: the page loads (over http like GitHub Pages, and from a local file), every track can be
// raced for 20 s on autopilot, settings migrate, the physics can be switched mid-race, the title demo runs,
// a Pikes Peak run finishes and its record is saved per physics. Zero page errors allowed.
//   node tests/browser/smoke.test.mjs
import path from 'node:path';
import url from 'node:url';
import { ROOT, serve, launch, openGame, startTrack, trackIds, simulate, checker } from './lib.mjs';

const T = checker('smoke');
const srv = await serve();
const browser = await launch();
try {
  // 1. settings: the physics row and the migration of old saves ('rally' was removed)
  for (const [seed, want] of [[null, 'cs'], ['{"phys":"rally"}', 'cs'], ['{"phys":"arcade"}', 'arcade'], ['{"sound":0}', 'cs']]) {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', seed);
    const got = await page.evaluate(() => window.__game.S.phys);
    T.check(`saved settings ${seed || '(none)'} -> physics '${want}'`, got === want && !errors.length, `got '${got}'${errors.length ? ', errors: ' + errors.join(' | ') : ''}`);
    if (seed === null) {
      const row = await page.evaluate(() => [...document.querySelectorAll('[data-set="phys"] button')].map(b => b.textContent + (b.classList.contains('sel') ? '*' : '')).join(' | '));
      T.check('settings row: Circuit Superstars (selected) | Arkadna', row === 'Circuit Superstars* | Arkadna', row);
    }
    await ctx.close();
  }

  // 1b. rain chosen before: the title demo behind the menu rains from the start
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { weather: 'rain' });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ demo: window.__game.demo && window.__game.demo.rain, drawn: Render.raining, sub: document.getElementById('title-sub').textContent }));
    T.check('saved weather: rain -> the title demo rains', r.demo === 1 && r.drawn && / · dež$/.test(r.sub) && !errors.length, JSON.stringify(r) + (errors.length ? ' errors: ' + errors.join(' | ') : ''));
    await ctx.close();
  }

  // 2. the page also works when opened straight from the disk (file://)
  {
    const { ctx, page, errors } = await openGame(browser, url.pathToFileURL(path.join(ROOT, 'index.html')).href);
    T.check('opens from a local file (file://)', !errors.length, errors.join(' | '));
    await ctx.close();
  }

  // 3. every track: race 20 s on autopilot with full graphics
  const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase', zoom: 1.2 });
  const ids = await trackIds(page), all = await page.evaluate(() => Core.TRACKS.map(d => d.id));
  T.check('track menu lists every track of the game', ids.join(',') === all.join(',') && ids.length >= 8, ids.join(','));
  for (const id of ids) {
    const e0 = errors.length;
    await startTrack(page, id);
    const nan = await simulate(page, 20);
    const r = await page.evaluate(() => { const g = window.__game, P = g.race.player; return { phase: g.phase, dist: Math.round(P.dist), phys: P.phys, crew: Render.crew ? Render.crew.men.length : 0, id: g.race.track.def.id, pit: !!g.race.track.def.pit }; });
    const crewOk = r.pit ? r.crew > 0 : r.crew === 0;   // (pit crews on the circuits with a pit lane: Bakreni gozd, Toskana, Gromski rt)
    T.check(`${id}: 20 s race on autopilot`, r.phase === 'racing' && r.dist > 150 && r.phys === 'cs' && !nan && crewOk && errors.length === e0,
      `dist ${r.dist} m, phys ${r.phys}, pit crew ${r.crew}${nan ? ', NaN!' : ''}${errors.length > e0 ? ', errors: ' + errors.slice(e0).join(' | ') : ''}`);
  }

  // 4. switch the physics in the middle of a race: cs -> arcade -> cs
  {
    await startTrack(page, 'monaco');
    await simulate(page, 5);
    const click = (v) => page.evaluate((v) => document.querySelector(`[data-set="phys"] button[data-v="${v}"]`).click(), v);
    await click('arcade'); const n1 = await simulate(page, 10);
    const a = await page.evaluate(() => window.__game.race.cars.every(c => c.phys === 'arcade'));
    await click('cs'); const n2 = await simulate(page, 10);
    const b = await page.evaluate(() => ({ all: window.__game.race.cars.every(c => c.phys === 'cs'), dist: window.__game.race.player.dist }));
    T.check('physics switch mid-race (cs -> arcade -> cs)', a && b.all && !n1 && !n2 && b.dist > 300, `dist ${Math.round(b.dist)} m`);
  }

  // 5. the title-screen demo drives behind the menu (two screenshots 1.5 s apart must differ)
  {
    await page.evaluate(() => window.__game.onAction('to-title'));
    await page.waitForTimeout(1500);
    const s1 = await page.screenshot(), scr = await page.evaluate(() => window.__game.screen);
    await page.waitForTimeout(1500);
    const s2 = await page.screenshot();
    let diff = 0; const n = Math.min(s1.length, s2.length); for (let i = 0; i < n; i++) if (s1[i] !== s2[i]) diff++;
    T.check('title screen with the demo race moving behind it', scr === 'title' && diff > n * 0.05, `screen ${scr}, ${(100 * diff / n).toFixed(0)} % of the image bytes changed`);
  }

  // 6b. rain: the weather row on the track screen; a race at Spa in the rain (every car on the wet grip, the streaks drawn, spray behind
  //     the cars), the title demo follows the setting; back to dry, the next race is dry again
  {
    const row = await page.evaluate(() => [...document.querySelectorAll('[data-set="weather"] button')].map(b => b.textContent + (b.classList.contains('sel') ? '*' : '')).join(' | '));
    T.check('weather row: Suho (selected) | Dež | Naključno', row === 'Suho* | Dež | Naključno', row);
    const e0 = errors.length;
    await page.evaluate(() => document.querySelector('[data-set="weather"] button[data-v="rain"]').click());
    await startTrack(page, 'spa');
    const nan = await simulate(page, 20);
    await page.waitForTimeout(1500);   // (a second and a half of real frames: the spray)
    const r = await page.evaluate(() => { const g = window.__game, R = g.race; return { rain: R.rain, wet: R.cars.every(c => c.wet === 0.8), drawn: Render.raining, spray: Render.fxStats().alive, dist: Math.round(R.player.dist), saved: JSON.parse(localStorage.getItem('tdgp-settings')).weather,
      birds: Render.birds.mesh.visible, clouds: Render.world.dyn.clouds.K.value }; });
    T.check('Spa in the rain: wet grip for every car, rain drawn, spray, the setting saved; no birds, no cloud shadows', r.rain === 1 && r.wet && r.drawn && r.spray > 10 && r.dist > 200 && r.saved === 'rain' && !r.birds && r.clouds === 0 && !nan && errors.length === e0, JSON.stringify(r) + (errors.length > e0 ? ' errors: ' + errors.slice(e0).join(' | ') : ''));
    await page.evaluate(() => window.__game.onAction('to-title')); await page.waitForTimeout(600);
    const d = await page.evaluate(() => ({ demo: window.__game.demo ? window.__game.demo.rain : null, drawn: Render.raining }));
    await page.evaluate(() => document.querySelector('[data-set="weather"] button[data-v="dry"]').click()); await page.waitForTimeout(600);
    const d2 = await page.evaluate(() => ({ demo: window.__game.demo ? window.__game.demo.rain : null, drawn: Render.raining }));
    await startTrack(page, 'spa'); await simulate(page, 3);
    const r2 = await page.evaluate(() => { let marks = (Render.world.stats && Render.world.stats.decals) || 0; Render.world.root.traverse(o => { if (o.name === 'tyremarks') marks++; });   // (Spa: the tyre marks among the builder's decals)
      return { rain: window.__game.race.rain, wet: window.__game.race.cars.every(c => c.wet === 1), drawn: Render.raining, birds: Render.birds.mesh.visible, clouds: Render.world.dyn.clouds.K.value, marks }; });
    T.check('title demo in the rain with the setting, dry again without it; the next race dry (birds, cloud shadows, tyre marks)', d.demo === 1 && d.drawn && d2.demo === 0 && !d2.drawn && r2.rain === 0 && r2.wet && !r2.drawn && r2.birds && r2.clouds > 0.1 && r2.marks > 5 && errors.length === e0, JSON.stringify({ d, d2, r2 }));
  }

  // 6. a Pikes Peak time trial to the finish: the record is stored under 'pikes@cs'
  {
    await startTrack(page, 'pikes');
    const r = await page.evaluate(async () => {
      const g = window.__game;
      for (let i = 0; i < 300 && g.phase !== 'done'; i++) { g.sim(1, true); if (i % 10 === 0) await new Promise(r => setTimeout(r, 0)); }
      await new Promise(r => setTimeout(r, 800));
      const rec = JSON.parse(localStorage.getItem('tdgp-records') || '{}');
      return { phase: g.phase, t: g.race.player.finishTime, pikes: rec.tracks && rec.tracks['pikes@cs'] };
    });
    T.check('Pikes Peak run finishes, record saved for cs', r.phase === 'done' && r.pikes && r.pikes.bestTime > 0, `time ${r.t && r.t.toFixed(2)} s, record ${r.pikes && r.pikes.bestTime}`);
  }
  T.check('no page errors during the whole run', !errors.length, errors.slice(0, 5).join(' | '));
  await ctx.close();

  // 7. a device too slow even at the lowest resolution (software WebGL is slow enough; the page runs in real time here):
  //    the resolution goes down first; then the game decides to drop the shadows, but only at the next pause (not mid-race),
  //    for this visit only (the saved setting stays), every material is rebuilt without shadows, and the player's own
  //    choice in Nastavitve brings them back for good
  {
    const { ctx: c2, page: p2, errors: e2 } = await openGame(browser, srv.base + '/index.html', { quality: 'high', shadows: 1, camera: 'chase' }, { width: 640, height: 360 }, { adaptive: true });
    await startTrack(p2, 'gozd');
    const r = await p2.evaluate(async () => {
      const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)); let t = 0;
      while (t < 300 && !g.adapt.pending) { await wait(1000); t++; }
      const decided = Object.assign({ t, toast: document.getElementById('toast').textContent }, g.adapt);
      const mats = []; Render.scene.traverse(o => { if (o.material && !Array.isArray(o.material) && mats.length < 60) mats.push([o.material, o.material.version]); });
      g.pause(); await wait(300);
      const paused = Object.assign({ rebuilt: mats.every(([m, v]) => m.version > v), saved: JSON.parse(localStorage.getItem('tdgp-settings') || '{}').shadows,
        seg: [...document.querySelectorAll('[data-set="shadows"] button')].map(b => b.dataset.v + (b.classList.contains('sel') ? '*' : '')).join(' ') }, g.adapt);
      document.querySelector('[data-set="shadows"] button[data-v="1"]').click(); await wait(300);   // the player turns them back on
      return { decided, paused, back: g.adapt };
    });
    const { decided: d, paused: p, back: b } = r;
    T.check('slow device: resolution down first, then shadows off decided (not yet switched mid-race)', d.pending && d.dyn <= 0.6 && d.shadowsOn && /brez senc/.test(d.toast),
      `after ${d.t} s: resolution x${d.dyn.toFixed(2)}, pending ${d.pending}, shadows still on ${d.shadowsOn}, message "${d.toast}"`);
    T.check('at the pause: shadows off for this visit, materials rebuilt, saved setting kept, Nastavitve shows it', !p.shadowsOn && p.auto && !p.pending && p.rebuilt && p.saved === 1 && p.seg === '0* 1',
      `shadows on ${p.shadowsOn}, auto ${p.auto}, materials rebuilt ${p.rebuilt}, saved ${p.saved}, buttons "${p.seg}"`);
    T.check("the player's choice brings them back and they stay", b.shadowsOn && !b.auto && b.keep && !e2.length, `shadows on ${b.shadowsOn}, keep ${b.keep}${e2.length ? ', errors: ' + e2.join(' | ') : ''}`);
    await c2.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
