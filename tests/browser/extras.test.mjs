// The race's extras in the browser: the timing tower, the TV camera on every track, the yellow flag on the HUD, the tyres, the podium
// ceremony after the finish, the simplified distant cars (LOD) and the fans the sound hears (their numbers round the track).
//   node tests/browser/extras.test.mjs
import { serve, launch, openGame, startTrack, trackIds, checker } from './lib.mjs';

const T = checker('race extras');
const srv = await serve();
const browser = await launch();
const hold = () => { window.__game.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; };
try {
  // ---- the timing tower: every car in a race with rivals, the player's row marked, BOKSI for a car in the pit lane, DRS while open;
  //      none with the setting off
  {
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

  // ---- the TV camera, every track: cameras along the road, cuts between them, the car in the picture (stepped with frames drawn)
  {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'tv' }, { width: 640, height: 360 });
    const bad = [], info = [];
    for (const id of await trackIds(page)) {
      await startTrack(page, id);
      await page.evaluate(hold);
      const r = await page.evaluate(() => {
        const g = window.__game, R = g.race, P = R.player, v = new THREE.Vector3(); let on = 0, n = 0; const used = new Set();
        while (R.time < 3 && g.phase !== 'racing') g.sim(0.25, true);
        for (let k = 0; k < 360; k++) { g.sim(1 / 30, true); Render.frame(1 / 30, 1, P, 'tv', {});
          if (k < 30) continue; v.set(P.x, (P.y || 0) + 0.6, P.z).project(Render.camera); n++; if (Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1) on++; used.add(Render.tv.cur); }
        return { cams: Render.tv.n, used: used.size, on: on / n };
      });
      info.push(`${id} ${r.cams}/${r.used}/${Math.round(r.on * 100)}%`);
      if (!(r.cams >= 3 && r.used >= 2 && r.on > 0.9)) bad.push(id);
    }
    T.check('TV camera on every track: cameras along the road, cuts, the car in the picture (cameras/used/in view)', bad.length === 0, info.join(', ') + (bad.length ? ' — BAD: ' + bad.join(',') : ''));
    T.check('no page errors (TV)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ---- a stopped rival ahead: the yellow flag on the HUD and the message; the tyres' ring on a circuit with a pit lane (not elsewhere);
  //      distant cars simplified in the chase view, all in full with the LOD off
  {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', control: 'keys' }, { width: 640, height: 360 });
    await startTrack(page, 'gozd');
    await page.evaluate(hold);
    const r = await page.evaluate(async () => {
      const g = window.__game, R = g.race, T = R.track, P = R.player, X = R.cars.find(c => !c.isPlayer && c.grid > 6);
      while (R.time < 9) g.sim(0.5, true);
      const s0 = P.q.s + 120, hold = () => { const i = T.idx(s0); X.place(T.px[i] + T.nx[i] * 3, T.pz[i] + T.nz[i] * 3, T.hd[i]); X.q = T.query(X.x, X.z, i, {}); X.sPrev = X.q.s; X.vx = X.vz = 0; X.stuckT = 0; };
      for (let k = 0; k < 60; k++) { hold(); g.sim(1 / 30, true); }
      g.resume(); await new Promise(r => setTimeout(r, 400)); g.pause();
      const out = { zone: R.yellow.length, flag: document.getElementById('h-flag').className, msg: document.getElementById('h-msg').textContent, tyre: document.getElementById('h-tyre').className, tyreTxt: document.getElementById('h-tyre-v').textContent };
      for (let k = 0; k < 10; k++) Render.frame(1 / 60, 1, P, 'chase', {});
      out.lod = Render.lod.filter(Boolean).length; Render.setDebug({ noLod: true }); Render.frame(1 / 60, 1, P, 'chase', {}); out.lodOff = Render.lod.filter(Boolean).length; Render.setDebug({ noLod: false });
      return out;
    });
    T.check('yellow flag: a stopped rival ahead, RUMENA on the HUD and the message', r.zone >= 1 && r.flag === 'on' && /RUMENA/.test(r.msg), JSON.stringify({ zone: r.zone, flag: r.flag, msg: r.msg }));
    T.check('tyres: the ring and the life left on a circuit with a pit lane', /on/.test(r.tyre) && /GUME \d+ %/.test(r.tyreTxt), `${r.tyre} "${r.tyreTxt}"`);
    T.check('LOD: the distant cars simplified in the chase view, none with it off', r.lod >= 3 && r.lodOff === 0, `${r.lod} simplified, ${r.lodOff} with the LOD off`);
    await startTrack(page, 'jezero');
    const noTyre = await page.evaluate(() => document.getElementById('h-tyre').className);
    T.check('tyres: no ring on a circuit without a pit lane', noTyre === '', `class "${noTyre}"`);
    T.check('no page errors (flag, tyres, LOD)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ---- the podium after the finish on a circuit with a pit building: the first three on it with their names, a tap for the results;
  //      a circuit without one: the results at once
  {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'iso', control: 'keys' }, { width: 800, height: 450 });
    const finish = () => page.evaluate(() => { const g = window.__game, R = g.race, P = R.player; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
      while (R.time < 5) g.sim(0.5, true); P.dist = R.laps * R.track.len - 15; for (let k = 0; k < 40 && !P.finished; k++) g.sim(0.1, true);
      for (let k = 0; k < 60 && g.phase === 'finish' && !(Render.podium && Render.podium.on); k++) g.sim(0.1, true);
      return { phase: g.phase, pod: !!(Render.podium && Render.podium.on), el: document.getElementById('podium').className, names: [...document.querySelectorAll('#podium li')].map(x => x.textContent) }; });
    await startTrack(page, 'suzuka');
    const a = await finish();
    T.check('podium: after the finish the ceremony on the podium, the first three named', a.phase === 'finish' && a.pod && a.el === 'show' && a.names.length === 3 && a.names[0].startsWith('1.'), JSON.stringify(a));
    await page.dispatchEvent('#podium', 'pointerdown');
    const b = await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 5 && g.phase !== 'done'; k++) g.sim(0.1, true); return { phase: g.phase, el: document.getElementById('podium').className, pod: !!(Render.podium && Render.podium.on), res: document.querySelector('#s-results').classList.contains('show') }; });
    T.check('podium: a tap skips to the results', b.phase === 'done' && b.el === '' && !b.pod && b.res, JSON.stringify(b));
    await startTrack(page, 'jezero');
    const c = await finish();
    T.check('no podium on a circuit without a pit building: the results at once', !c.pod && c.el === '' && (c.phase === 'done' || c.phase === 'finish'), JSON.stringify(c));
    T.check('no page errors (podium)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ---- the fans the sound hears: stands and crowds counted round every track (World's crowdCells, the stands' painted fans too)
  {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'iso' }, { width: 480, height: 270 });
    const bad = [], info = [];
    for (const id of ['jezero', 'gozd', 'monaco', 'spa', 'rbring', 'suzuka']) {
      await startTrack(page, id);
      const r = await page.evaluate(() => { const T = window.__game.race.track, C = Render.world.crowdCells; let loud = 0, n = 0;
        for (let d = 0; d < T.len; d += 25) { const i = T.idx(T.startS + d), cx = Math.floor(T.px[i] / 24), cz = Math.floor(T.pz[i] / 24); let f = 0;
          for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) f += C.get((cx + a) + ',' + (cz + b)) || 0; n++; if (f > 120) loud++; }
        const i0 = T.idx(T.startS), c0 = Math.floor(T.px[i0] / 24), z0 = Math.floor(T.pz[i0] / 24); let st = 0; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) st += C.get((c0 + a) + ',' + (z0 + b)) || 0;
        return { share: loud / n, start: Math.round(st) }; });
      info.push(`${id} ${Math.round(r.share * 100)}% loud, ${r.start} by the start`);
      if (!(r.share > 0.05 && r.start > 120)) bad.push(id);
    }
    T.check('fans round the track (the stands too): loud places and a full start line', bad.length === 0, info.join(', ') + (bad.length ? ' — BAD: ' + bad.join(',') : ''));
    T.check('no page errors (fans)', errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
