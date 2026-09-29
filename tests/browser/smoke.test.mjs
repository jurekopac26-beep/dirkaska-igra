// Browser smoke test: the page loads (over http like GitHub Pages, and from a local file), every track can be
// raced for 20 s on autopilot, settings migrate, the physics can be switched mid-race, the title demo runs,
// a Pikes Peak run and an Ouninpohja run finish and their records are saved per physics. Zero page errors allowed.
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

  // 6b. the Ouninpohja rally stage to the flying finish: the distance to go under the clock (no altitude), the record under
  //     'ouninpohja@cs', the stage's own words on the results screen, the split table with the distances
  {
    await startTrack(page, 'ouninpohja');
    const r = await page.evaluate(async () => {
      const g = window.__game;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));   // (a frame of the new race has drawn the HUD: the first one can take a while, its shaders compile)
      const left = document.getElementById('h-alt').textContent;
      for (let i = 0; i < 300 && g.phase !== 'done'; i++) { g.sim(1, true); if (i % 10 === 0) await new Promise(r => setTimeout(r, 0)); }
      await new Promise(r => setTimeout(r, 800));
      const rec = JSON.parse(localStorage.getItem('tdgp-records') || '{}'), head = [...document.querySelectorAll('#res-tt th')].map(e => e.textContent);
      return { phase: g.phase, t: g.race.player.finishTime, left, again: document.getElementById('res-restart').textContent, head: head.join('|'), rec: rec.tracks && rec.tracks['ouninpohja@cs'] };
    });
    T.check('Ouninpohja stage finishes, record saved for cs, the distance to go on the HUD, the stage\'s words on the results',
      r.phase === 'done' && r.rec && r.rec.bestTime > 0 && /^še \d+,\d km$/.test(r.left) && r.again === 'Ponovi preizkušnjo' && r.head.startsWith('Točka|Razdalja|'),
      `time ${r.t && r.t.toFixed(2)} s, record ${r.rec && r.rec.bestTime}, HUD "${r.left}", button "${r.again}", splits "${r.head}"`);
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
