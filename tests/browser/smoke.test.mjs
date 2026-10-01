// Browser smoke test: the page loads (over http like GitHub Pages, and from a local file), every track can be
// raced for 20 s on autopilot, settings migrate (one driving physics: Circuit Superstars), the title demo runs,
// a Pikes Peak run and an Ouninpohja run finish and their records are saved (Ouninpohja also in the rain, apart).
// Zero page errors allowed.
//   node tests/browser/smoke.test.mjs
import path from 'node:path';
import url from 'node:url';
import { ROOT, serve, launch, openGame, startTrack, trackIds, simulate, checker } from './lib.mjs';

const T = checker('smoke');
const srv = await serve();
const browser = await launch();
try {
  // 1. settings: one driving physics (no row for it) and the migration of old saves (the 'rally' and 'arcade' physics were removed)
  for (const [seed, want] of [[null, 'cs'], ['{"phys":"rally"}', 'cs'], ['{"phys":"arcade"}', 'cs'], ['{"sound":0}', 'cs']]) {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', seed);
    const got = await page.evaluate(() => window.__game.S.phys);
    T.check(`saved settings ${seed || '(none)'} -> physics '${want}'`, got === want && !errors.length, `got '${got}'${errors.length ? ', errors: ' + errors.join(' | ') : ''}`);
    if (seed === null) {
      const row = await page.evaluate(() => document.querySelectorAll('[data-set="phys"]').length);
      T.check('settings: no driving-physics row (Circuit Superstars only)', row === 0, row + ' rows');
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

  // 6b. rain: the weather row on the track screen; a race at Spa in the rain (every car on rain tyres: the wet grip, a little less as they wear; the streaks drawn, spray behind
  //     the cars), the title demo follows the setting; back to dry, the next race is dry again
  {
    const row = await page.evaluate(() => [...document.querySelectorAll('[data-set="weather"] button')].map(b => b.textContent + (b.classList.contains('sel') ? '*' : '')).join(' | '));
    T.check('weather row: Suho (selected) | Dež | Naključno | Menljivo | Nevihta', row === 'Suho* | Dež | Naključno | Menljivo | Nevihta', row);
    const e0 = errors.length;
    await page.evaluate(() => document.querySelector('[data-set="weather"] button[data-v="rain"]').click());
    await startTrack(page, 'spa');
    const nan = await simulate(page, 20);
    await page.waitForTimeout(1500);   // (a second and a half of real frames: the spray)
    const r = await page.evaluate(() => { const g = window.__game, R = g.race; return { rain: R.rain, wet: R.cars.every(c => c.wet <= 0.8 && c.wet > 0.79 && c.ty && c.ty.k === 'wet'), drawn: Render.raining, spray: Render.fxStats().alive, dist: Math.round(R.player.dist), saved: JSON.parse(localStorage.getItem('tdgp-settings')).weather,
      birds: Render.birds.mesh.visible, clouds: Render.world.dyn.clouds.K.value }; });
    T.check('Spa in the rain: wet grip for every car, rain drawn, spray, the setting saved; no birds, no cloud shadows', r.rain === 1 && r.wet && r.drawn && r.spray > 10 && r.dist > 200 && r.saved === 'rain' && !r.birds && r.clouds === 0 && !nan && errors.length === e0, JSON.stringify(r) + (errors.length > e0 ? ' errors: ' + errors.slice(e0).join(' | ') : ''));
    await page.evaluate(() => window.__game.onAction('to-title')); await page.waitForTimeout(600);
    const d = await page.evaluate(() => ({ demo: window.__game.demo ? window.__game.demo.rain : null, drawn: Render.raining }));
    await page.evaluate(() => document.querySelector('[data-set="weather"] button[data-v="dry"]').click()); await page.waitForTimeout(600);
    const d2 = await page.evaluate(() => ({ demo: window.__game.demo ? window.__game.demo.rain : null, drawn: Render.raining }));
    await startTrack(page, 'spa'); await simulate(page, 3);
    const r2 = await page.evaluate(() => { let marks = 0; Render.world.root.traverse(o => { if (o.name === 'tyremarks') marks++; });
      // (every car on slicks with the dry grip of its compound, Core.TYRE_CMP: the soft's a little more than 1, the medium's 1, the hard's less)
      const dryGrip = (c) => { const K = c.ty && c.ty.k === 'dry' ? Core.TYRE_CMP[c.ty.c] : null; return !!K && Math.abs(c.wet - K.g * (1 - K.loss * c.ty.wear)) < 1e-9; };
      return { rain: window.__game.race.rain, wet: window.__game.race.cars.every(dryGrip), drawn: Render.raining, birds: Render.birds.mesh.visible, clouds: Render.world.dyn.clouds.K.value, marks }; });
    T.check('title demo in the rain with the setting, dry again without it; the next race dry (slicks with their dry grip, birds, cloud shadows, tyre marks)', d.demo === 1 && d.drawn && d2.demo === 0 && !d2.drawn && r2.rain === 0 && r2.wet && !r2.drawn && r2.birds && r2.clouds > 0.1 && r2.marks > 5 && errors.length === e0, JSON.stringify({ d, d2, r2 }));
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
  //     'ouninpohja2@cs' (def.recId: the 9.7 km stage), the stage's own words on the results screen, the split table with the
  //     distances, the medal and the longest jump (the Yellow House kept with the record), the co-driver's calls ready
  {
    await startTrack(page, 'ouninpohja');
    const r = await page.evaluate(async () => {
      const g = window.__game;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));   // (a frame of the new race has drawn the HUD: the first one can take a while, its shaders compile)
      const left = document.getElementById('h-alt').textContent, calls = g.codrv.calls;
      for (let i = 0; i < 300 && g.phase !== 'done'; i++) { g.sim(1, true); if (i % 10 === 0) await new Promise(r => setTimeout(r, 0)); }
      await new Promise(r => setTimeout(r, 800));
      const rec = JSON.parse(localStorage.getItem('tdgp-records') || '{}'), head = [...document.querySelectorAll('#res-tt th')].map(e => e.textContent);
      return { phase: g.phase, t: g.race.player.finishTime, left, calls, again: document.getElementById('res-restart').textContent, head: head.join('|'), sub: document.getElementById('res-sub').textContent, rec: rec.tracks && rec.tracks['ouninpohja2@cs'] };
    });
    T.check('Ouninpohja stage finishes, record saved for cs, the distance to go on the HUD, the stage\'s words on the results',
      r.phase === 'done' && r.rec && r.rec.bestTime > 0 && /^še \d+,\d km$/.test(r.left) && r.again === 'Ponovi preizkušnjo' && r.head.startsWith('Točka|Razdalja|'),
      `time ${r.t && r.t.toFixed(2)} s, record ${r.rec && r.rec.bestTime}, HUD "${r.left}", button "${r.again}", splits "${r.head}"`);
    T.check('Ouninpohja: a medal line and the longest jump on the results, the Yellow House jump kept with the record, the co-driver\'s calls',
      /medalja/.test(r.sub) && /Najdaljši skok \d+ m · Rumena hiša \d+ m/.test(r.sub) && r.rec && r.rec.jumpRec > 30 && r.calls > 20,
      `"${r.sub}", Yellow House record ${r.rec && r.rec.jumpRec} m, ${r.calls} co-driver calls`);
  }

  // 6c. Ouninpohja in the rain (Dež on the track menu): the stage's puddles drawn and on the road (Track.inRain) while the race runs,
  //     to the finish; a time trial keeps its records in the rain apart ('ouninpohja2-wet@cs'); then back to dry, the puddles gone
  {
    const r = await page.evaluate(async () => {
      const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)), frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(250);
      document.querySelector('[data-track="ouninpohja"]').click(); await wait(150);
      document.querySelector('[data-set="weather"] button[data-v="rain"]').click(); await wait(150);
      g.onAction('start');
      for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === 'ouninpohja'); k++) await wait(100);
      await frame();
      const W = Render.world.dyn.wet, drawn = !!(g.race.rain && Render.raining && W && W.puddles.visible);
      g.sim(2, true); const onRoad = g.race.track.inRain === true;
      for (let i = 0; i < 300 && g.phase !== 'done'; i++) { g.sim(1, true); if (i % 10 === 0) await wait(0); }
      await wait(800);
      const rec = JSON.parse(localStorage.getItem('tdgp-records') || '{}'), out = { drawn, onRoad, phase: g.phase, t: g.race.player.finishTime, rec: rec.tracks && rec.tracks['ouninpohja2-wet@cs'], sub: document.getElementById('res-sub').textContent };
      g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(250); document.querySelector('[data-set="weather"] button[data-v="dry"]').click(); await wait(600); await frame();
      out.dry = g.S.weather === 'dry' && !Render.raining && !W.puddles.visible;
      return out;
    });
    T.check('Ouninpohja in the rain: puddles drawn and on the road, finishes, its own record in the rain, back to dry',
      r.drawn && r.onRoad && r.phase === 'done' && r.rec && r.rec.bestTime > 0 && / v dežju/.test(r.sub) && r.dry,
      `puddles drawn ${r.drawn}, on the road ${r.onRoad}, time ${r.t && r.t.toFixed(2)} s, record ${r.rec && r.rec.bestTime}, "${r.sub}", dry again ${r.dry}`);
  }
  // 6d. Vršič: one card, four ways to drive it (the switch Dirka / Kronometer / Promet / Policija on the card). Kronometer: the time trial alone
  //     to the pass, its record and board under 'vrsic-tt@cs' (the race's records stay apart), a medal; Dirka: 12 rivals on the grid, the HUD
  //     shows the place, the km climbed and the altitude; Promet: the duel with one rival up the open road, the traffic and the people drawn,
  //     the HUD with the rival's gap; Policija: alone with the police after the player, the patrol cars drawn with their lights flashing, the
  //     HUD with the patrol cars after the player and the heat (stars)
  {
    const r = await page.evaluate(async () => {
      const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)), frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(300);
      const card = document.querySelector('[data-track="vrsic"]'), btns = [...card.querySelectorAll('.tc-mode button')].map(b => b.textContent);
      card.querySelector('.tc-mode button[data-v="tt"]').click(); await wait(200);
      const out = { btns: btns.join('|'), picked: g.S.track + '/' + g.S.mode, meta: document.querySelector('[data-track="vrsic"] .tmeta').textContent };
      g.onAction('start'); for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === 'vrsic'); k++) await wait(100);
      await frame();
      out.tt = g.race.timeTrial && g.race.cars.length === 1 && document.getElementById('hud').classList.contains('tt');
      for (let i = 0; i < 600 && g.phase !== 'done'; i++) { g.sim(1, true); if (i % 10 === 0) await wait(0); }
      await wait(800);
      const rec = JSON.parse(localStorage.getItem('tdgp-records') || '{}').tracks || {};
      Object.assign(out, { phase: g.phase, t: g.race.player.finishTime, rec: rec['vrsic-tt@cs'], race: rec['vrsic@cs'], sub: document.getElementById('res-sub').textContent });
      g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(300);
      document.querySelector('[data-track="vrsic"] .tc-mode button[data-v="race"]').click(); await wait(200);
      out.back = g.S.mode;
      g.onAction('start'); for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === 'vrsic' && !g.race.timeTrial); k++) await wait(100);
      g.sim(30, true); await frame(); await frame();
      Object.assign(out, { cars: g.race.cars.length, up: document.getElementById('hud').classList.contains('up'), lap: document.getElementById('h-lap').textContent, alt: document.getElementById('h-alt').textContent, pos: document.getElementById('h-pos').textContent, racing: g.phase });
      for (const md of ['traffic', 'police']) {   // the open road: the duel in the traffic, the run from the police (30 s of each)
        g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(300);
        document.querySelector('[data-track="vrsic"] .tc-mode button[data-v="' + md + '"]').click(); await wait(200);
        g.onAction('start'); for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === 'vrsic' && (md === 'police' ? g.race.pol : g.race.tf && !g.race.pol)); k++) await wait(100);
        for (let i = 0; i < 30; i++) { g.sim(1, true); await frame(); }
        let lamp = false; for (let i = 0; i < 16; i++) { await frame(); if ((Render.roadInfo() || {}).lampOn) lamp = true; }   // (the lights flash: on in some of the frames)
        const hud = document.getElementById('hud'), road = Object.assign({}, Render.roadInfo(), { lampOn: lamp });
        out[md] = { mode: g.S.mode, cars: g.race.cars.length, tf: !!g.race.tf, pol: g.race.pol ? g.race.pol.cars.length : 0, duel: hud.classList.contains('duel'), polHud: hud.classList.contains('pol'), gap: document.getElementById('h-gap').textContent,
          lbl: document.querySelector('#h-rank .h-lbl').textContent, pos: document.getElementById('h-pos').textContent, heat: document.getElementById('h-heat').textContent, road, dist: g.race.player.dist, phase: g.phase };
      }
      return out;
    });
    T.check('Vršič: one card with the switch Dirka / Kronometer / Promet / Policija, a tap on Kronometer picks the track and the time trial',
      r.btns === 'Dirka|Kronometer|Promet|Policija' && r.picked === 'vrsic/tt' && / kronometer/.test(r.meta), `buttons "${r.btns}", picked ${r.picked}, "${r.meta}"`);
    T.check('Vršič time trial: alone, to the pass, its own record and board (vrsic-tt@cs), a medal line',
      r.tt && r.phase === 'done' && r.rec && r.rec.bestTime > 0 && r.rec.board && r.rec.board.length === 1 && !(r.race && r.race.bestTime) && /medalj/.test(r.sub),
      `time ${r.t && r.t.toFixed(2)} s, record ${r.rec && r.rec.bestTime}, "${r.sub}"`);
    T.check('Vršič race: 13 cars, the HUD with the place, the km climbed and the altitude',
      r.back === 'race' && r.cars === 13 && r.up && /^\d+,\d\/12,3 KM$/.test(r.lap) && /^\d+(\.\d{3})? m$/.test(r.alt) && +r.pos >= 1 && r.racing === 'racing',
      `${r.cars} cars, HUD "${r.lap}" "${r.alt}", place ${r.pos}, ${r.racing}`);
    const D = r.traffic, P = r.police;
    T.check('Vršič Promet: the duel with one rival in the traffic, vehicles and people drawn, the HUD with the rival\'s gap',
      D.mode === 'traffic' && D.cars === 2 && D.tf && !D.pol && D.duel && !D.polHud && /^TEKMEC \d+,\d s (PRED|ZA) TABO$/.test(D.gap) && D.road && D.road.veh > 0 && D.road.ped > 0 && D.dist > 300 && D.phase === 'racing',
      `${D.cars} cars, gap "${D.gap}", drawn ${JSON.stringify(D.road)}, ${Math.round(D.dist)} m`);
    T.check('Vršič Policija: alone with the police after the player, patrol cars drawn with their lights flashing, the HUD with the patrol cars and the heat',
      P.mode === 'police' && P.cars === 1 && P.tf && P.pol >= 1 && P.polHud && !P.duel && P.lbl === 'POLICIJA' && +P.pos >= 1 && /^\u2605+\u2606*$/.test(P.heat) && P.heat.length === 5 && P.road && P.road.pol >= 1 && P.road.lampOn && P.dist > 300,
      `${P.pol} patrol cars, HUD "${P.lbl} ${P.pos}" "${P.heat}", drawn ${JSON.stringify(P.road)}, ${Math.round(P.dist)} m, ${P.phase}`);
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
