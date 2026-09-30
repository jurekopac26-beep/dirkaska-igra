// The race's extras in the browser: the timing tower, the live TV camera on every track, the simplified distant cars (LOD) and the
// podium ceremony after the finish.
//   node tests/browser/extras.test.mjs
//   ONLY=tower|tv|lod|podium node tests/browser/extras.test.mjs   (one part)
import { serve, launch, openGame, startTrack, trackIds, checker } from './lib.mjs';

const T = checker('race extras');
const srv = await serve();
const browser = await launch();
const only = process.env.ONLY, part = (k) => !only || only === k;
const hold = () => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; };
try {
  // ---- the timing tower: every car in a race with rivals, the player's row marked, BOKSI for a car in the pit lane, DRS while open;
  //      none with the setting off
  if (part('tower')) {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'iso' }, { width: 960, height: 900 });
    await startTrack(page, 'suzuka');
    const r = await page.evaluate(async () => {
      // the race in real time on autopilot (the tower times every car at its loops as it goes); from 10 s one rival held in the pit lane
      // and one with its DRS flap open (set again after every step: the race would clear them)
      const g = window.__game, R = g.race, ai = R.cars.filter(c => !c.isPlayer), step = R.step.bind(R);
      g.autoDrive = true; R.step = (dt) => { step(dt); if (R.time > 10) { ai[2].inPit = true; ai[5].drs = 1; } };
      for (let k = 0; k < 900 && !(g.phase === 'racing' && R.time > 13); k++) await new Promise(r => setTimeout(r, 100));
      g.pause(); R.step = step;
      const el = document.getElementById('h-tower'), rows = [...el.querySelectorAll('.tr:not(.sep)')];
      const out = { on: el.className, rows: rows.length, me: rows.filter(x => x.classList.contains('me')).map(x => x.textContent), pit: el.textContent.includes('BOKSI'), drs: !!el.querySelector('.drs'),
        lead: rows[0] && rows[0].textContent, gaps: rows.slice(1).filter(x => !x.classList.contains('pit')).slice(0, 3).map(x => x.querySelector('.tg').textContent) };
      ai[2].inPit = false; ai[5].drs = 0;
      document.querySelector('[data-set="tower"] [data-v="0"]').click(); await new Promise(r => setTimeout(r, 50));
      out.off = el.className;
      document.querySelector('[data-set="tower"] [data-v="1"]').click();
      return out;
    });
    T.check('timing tower: all 13 cars, the player marked, BOKSI in the pit lane, DRS open, the leader and the gaps behind him',
      r.on === 'on' && r.rows === 13 && r.me.length === 1 && /TI/.test(r.me[0]) && r.pit && r.drs && /VODI/.test(r.lead) && r.gaps.every(x => /^\+\d/.test(x)), JSON.stringify(r));
    T.check('timing tower: hidden with the setting off', r.off === '', `class "${r.off}"`);
    T.check('no page errors (tower)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ---- the live TV camera (Kamera TV: Render's 'tvlive'), every track: cameras along the road, cuts between them (none straight back to the camera before), the car in the
  //      picture. 20 s of the race stepped with the camera's work in every frame, the scene drawn only in the last few (the check is where
  //      the camera looks, not the pixels; drawing every frame on 14 tracks takes minutes with software WebGL)
  if (part('tv')) {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'tv' }, { width: 640, height: 360 });
    const bad = [], info = [];
    for (const id of await trackIds(page)) {
      await startTrack(page, id);
      await page.evaluate(hold);
      const r = await page.evaluate(() => {
        const g = window.__game, R = g.race, P = R.player, v = new THREE.Vector3(); let on = 0, n = 0, cuts = 0, back = 0, prev = -1, tPrev = -99; const used = new Set();
        while (R.time < 3 && g.phase !== 'racing') g.sim(0.25, true);
        Render.scene.visible = false;
        for (let k = 0; k < 600; k++) { if (k === 595) Render.scene.visible = true;
          const was = Render.tv ? Render.tv.cur : -1; g.sim(1 / 30, true); Render.frame(1 / 30, 1, P, 'tvlive', {}); const cur = Render.tv.cur;
          if (was >= 0 && cur !== was) { cuts++; if (cur === prev && R.time - tPrev < 1.5) back++; prev = was; tPrev = R.time; }   // (back: a cut straight back)
          if (k < 30) continue; v.set(P.x, (P.y || 0) + 0.6, P.z).project(Render.camera); n++; if (Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1) on++; used.add(cur); }
        Render.scene.visible = true;
        return { cams: Render.tv.n, used: used.size, cuts, back, on: on / n };
      });
      info.push(`${id} ${r.cams}/${r.cuts}/${Math.round(r.on * 100)}%` + (r.back ? ` (${r.back} back)` : ''));
      if (!(r.cams >= 3 && r.used >= 2 && r.cuts <= 12 && r.back === 0 && r.on > 0.9)) bad.push(id);
    }
    T.check('TV camera on every track: cameras along the road, cuts (not straight back), the car in the picture (cameras/cuts in 20 s/in view)', bad.length === 0, info.join(', ') + (bad.length ? ' — BAD: ' + bad.join(',') : ''));
    T.check('no page errors (TV)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ---- distant cars simplified in the chase view (LOD), all in full with the LOD off
  if (part('lod')) {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', control: 'keys' }, { width: 640, height: 360 });
    await startTrack(page, 'gozd');
    await page.evaluate(hold);
    const r = await page.evaluate(() => {
      const g = window.__game, R = g.race, P = R.player;
      while (R.time < 9) g.sim(0.5, true);
      for (let k = 0; k < 10; k++) Render.frame(1 / 60, 1, P, 'chase', {});
      const out = { lod: Render.lod.filter(Boolean).length }; Render.setDebug({ noLod: true }); Render.frame(1 / 60, 1, P, 'chase', {}); out.lodOff = Render.lod.filter(Boolean).length; Render.setDebug({ noLod: false });
      return out;
    });
    T.check('LOD: the distant cars simplified in the chase view, none with it off', r.lod >= 3 && r.lodOff === 0, `${r.lod} simplified, ${r.lodOff} with the LOD off`);
    T.check('no page errors (LOD)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ---- the podium after the finish on a circuit with a pit building: the one over the pit lane (Suzuka) and the Red Bull Ring's own on its
  //      pit building's roof: the first three named under it, a tap for the results; a circuit without one: the results at once
  if (part('podium')) {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'iso' }, { width: 800, height: 450 });
    const finish = () => page.evaluate(() => { const g = window.__game, R = g.race, P = R.player; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
      while (R.time < 5) g.sim(0.5, true); P.dist = R.laps * R.track.len - 15; for (let k = 0; k < 40 && !P.finished; k++) g.sim(0.1, true);
      for (let k = 0; k < 80 && g.phase === 'finish'; k++) g.sim(0.1, true);
      return { phase: g.phase, own: !!(Render.podium && Render.podium.on), world: !!(Render.world.podium), shot: !!Render.cam.shot, el: document.getElementById('podium-cap').className,
        names: [...document.querySelectorAll('#podium-cap span')].map(x => x.textContent), hud: document.getElementById('hud').classList.contains('shot') }; });
    // a tap while the game runs (a paused game ignores it), then the game's own frames until the podium is over: at once (race time since the
    // tap, dt: under 3 s; the ceremony alone lasts 8 s)
    const skip = async () => { const t0 = await page.evaluate(() => { window.__game.resume(); return window.__game.race.time; }); await page.mouse.click(400, 225);
      await page.waitForFunction(() => window.__game.phase !== 'podium', null, { timeout: 20000 }).catch(() => {});
      return page.evaluate((t0) => { const g = window.__game;
        return { phase: g.phase, dt: +(g.race.time - t0).toFixed(1), el: document.getElementById('podium-cap').className, own: !!(Render.podium && Render.podium.on), shot: !!Render.cam.shot, res: document.querySelector('#s-results').classList.contains('show') }; }, t0); };
    await startTrack(page, 'suzuka');
    const a = await finish();
    T.check('podium (Suzuka): after the finish the ceremony over the pit lane, the first three named, no HUD', a.phase === 'podium' && a.own && !a.world && a.el === 'show' && a.names.length === 3 && a.names[0].startsWith('1.') && a.hud, JSON.stringify(a));
    const b = await skip();
    T.check('podium (Suzuka): a tap skips to the results', b.phase === 'done' && b.dt < 3 && b.el === '' && !b.own && b.res, JSON.stringify(b));
    await startTrack(page, 'rbring');
    const a2 = await finish();
    T.check("podium (Red Bull Ring): its own on the pit building's roof (its TV shot), the three named", a2.phase === 'podium' && !a2.own && a2.world && a2.shot && a2.el === 'show' && a2.names.length === 3, JSON.stringify(a2));
    const b2 = await skip();
    T.check('podium (Red Bull Ring): a tap skips to the results', b2.phase === 'done' && b2.dt < 3 && b2.el === '' && !b2.shot && b2.res, JSON.stringify(b2));
    await startTrack(page, 'jezero');
    const c = await finish();
    T.check('no podium on a circuit without a pit building: the results at once', !c.own && c.el === '' && c.phase === 'done', JSON.stringify(c));
    T.check('no page errors (podium)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

} finally {
  await browser.close(); await srv.close();
}
T.done();
