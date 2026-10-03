// Browser smoke test: the page loads (over http like GitHub Pages, and from a local file), every track can be
// raced for 20 s on autopilot, settings migrate (one driving physics: Circuit Superstars; four difficulty levels), the
// title demo runs, a Pikes Peak run, an Ouninpohja run, a Harju run and a Katu-Jaryk descent finish and their records are
// saved (Ouninpohja also in the rain, apart), Vršič's four ways to drive it (the run from the police: the checkpoint, the
// chase, the police radio, the arrows, the mission in the building at the top). Zero page errors allowed.
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

  // 1c. four difficulty levels (Lahka, Srednja, Težka, Super težka: the police all four, a race and a championship take the last as težka);
  //     a saved value out of range is brought into it
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', '{"difficulty":7,"sound":0,"comm":0}');
    const r = await page.evaluate(async () => {
      const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)), seg = () => [...document.querySelectorAll('[data-set="difficulty"] button')].map(b => b.textContent + (b.classList.contains('sel') ? '*' : '')).join('|');
      const out = { saved: g.S.difficulty }; g.onAction('to-settings'); await wait(200); out.row = seg();
      g.onAction('settings-done'); await wait(150); g.onAction('to-champ'); await wait(300); out.champ = document.getElementById('ch-diff').textContent;
      g.onAction('to-title'); await wait(150); g.onAction('to-settings'); await wait(150); document.querySelector('[data-set="difficulty"] button[data-v="0"]').click(); await wait(150);
      out.row2 = seg(); out.stored = JSON.parse(localStorage.getItem('tdgp-settings')).difficulty;
      return out;
    });
    T.check('settings: four difficulty levels (Lahka, Srednja, Težka, Super težka), a saved 7 becomes super težka, a championship is raced as težka',
      r.saved === 3 && r.row === 'Lahka|Srednja|Težka|Super težka*' && /^Težavnost: težka \(super težka je samo za beg pred policijo/.test(r.champ) && r.row2 === 'Lahka*|Srednja|Težka|Super težka' && r.stored === 0 && !errors.length,
      JSON.stringify(r) + (errors.length ? ' errors: ' + errors.join(' | ') : ''));
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
  T.check('track menu lists every track of the game', [...ids].sort().join(',') === [...all].sort().join(',') && ids.length >= 8, ids.join(','));   // (in the menu's order: a road variant, def.variantOf, is a choice on its track's card)
  for (const id of ids) {
    const e0 = errors.length;
    await startTrack(page, id);
    const nan = await simulate(page, 20);
    const r = await page.evaluate(() => { const g = window.__game, P = g.race.player; return { phase: g.phase, dist: Math.round(P.dist), phys: P.phys, crew: Render.crew ? Render.crew.men.length : 0, id: g.race.track.def.id, pit: !!g.race.track.def.pit }; });
    // (more than 100 m in 20 s with the 3 s of the countdown: a car that does not move stays near 0 m; Tianmen's 45 hairpins, with the player on the last row of the grid in the pack, give 127-176 m from run to run)
    const crewOk = r.pit ? r.crew > 0 : r.crew === 0;   // (pit crews on the circuits with a pit lane: Bakreni gozd, Toskana, Gromski rt)
    T.check(`${id}: 20 s race on autopilot`, r.phase === 'racing' && r.dist > 100 && r.phys === 'cs' && !nan && crewOk && errors.length === e0,
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
    T.check('title demo in the rain with the setting, dry again without it; the next race dry (slicks with their dry grip, no birds in the air, cloud shadows, tyre marks)', d.demo === 1 && d.drawn && d2.demo === 0 && !d2.drawn && r2.rain === 0 && r2.wet && !r2.drawn && !r2.birds && r2.clouds > 0.1 && r2.marks > 5 && errors.length === e0, JSON.stringify({ d, d2, r2 }));
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
  //     the HUD with the rival's gap; Policija: a calm start (no start lights, nobody after the player, no stars, the commentator silent and
  //     the police radio on the air, the checkpoint ahead on the HUD), the autopilot drives through the checkpoint in Kranjska Gora (the
  //     officer shouts, the unit there calls it in): the chase, the patrol cars drawn with their lights flashing, the HUD with the patrol cars
  //     after the player and the heat (stars), arrows at the bottom for the patrol cars behind (how many metres back); the heat up to five
  //     stars: the helicopter drawn over the player, the radio hears of it (Bober); the radio names the real places (the streets of Kranjska
  //     Gora, Jasna, the hairpins by number, the huts, the pass); placed below the building at the top, the autopilot drives into it: the
  //     mission done, the rap sheet with the checkpoint
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
      const txt = (id) => document.getElementById(id).textContent;
      for (const md of ['traffic', 'police']) {   // the open road: the duel in the traffic (30 s), the run from the police (through the checkpoint, then 30 s of the chase)
        g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(300);
        document.querySelector('[data-track="vrsic"] .tc-mode button[data-v="' + md + '"]').click(); await wait(200);
        g.onAction('start'); for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === 'vrsic' && (md === 'police' ? g.race.pol : g.race.tf && !g.race.pol)); k++) await wait(100);
        if (md === 'police') {   // the start: the free drive to the checkpoint, through it on autopilot (the officer waves it down: it does not stop)
          const pol = g.race.pol, pre = { pc: pol.cars.length, mode: pol.cars[0] && pol.cars[0].pol.mode, chkCar: !!(pol.cars[0] && pol.cars[0].pol.chk), lights: false, phases: [], pos: [], heat: [], chk: [], caps: [], radioMode: g.radio && g.radio.mode };
          for (let i = 0; i < 70 && pol.stage !== 'chase'; i++) {
            g.sim(1, true); await frame();
            pre.lights = pre.lights || document.getElementById('h-lights').classList.contains('show'); pre.phases.push(g.phase);
            if (pol.stage !== 'chase') { pre.pos.push(txt('h-pos')); pre.heat.push(txt('h-heat')); pre.chk.push(pol.chk.st + ':' + txt('h-chk')); }
            if (g.radio.cap) pre.caps.push(g.radio.cap);
          }
          Object.assign(pre, { stage: pol.stage, why: (pol.log.find(e => e.k === 'fled') || {}).why, seen: pol.log.some(e => e.k === 'chkSeen') });
          out.pre = pre;
          pol.D = Object.assign({}, pol.D, { bust: 1e9 });   // (this run is about what is drawn and said: the autopilot is not to be caught before the mission at the top)
        }
        let peds = 0, tail = [], rot = [], caps = [];
        for (let i = 0; i < 30; i++) { g.sim(1, true); await frame(); peds = Math.max(peds, (Render.roadInfo() || {}).ped || 0);   // (people drawn on the way: between the villages there may be nobody about)
          if (md === 'police') { for (const el of document.querySelectorAll('#h-tail i.on')) { tail.push(el.className.replace('on ', '') + ' ' + el.lastElementChild.textContent); rot.push(parseFloat((/rotate\(([-\d.]+)deg\)/.exec(el.firstElementChild.style.transform) || [])[1])); }
            if (g.radio.cap) caps.push(g.radio.cap); } }
        let lamp = false; for (let i = 0; i < 16; i++) { await frame(); if ((Render.roadInfo() || {}).lampOn) lamp = true; }   // (the lights flash: on in some of the frames)
        const hud = document.getElementById('hud'), road = Object.assign({}, Render.roadInfo(), { lampOn: lamp, ped: Math.max(peds, (Render.roadInfo() || {}).ped || 0) });
        out[md] = { mode: g.S.mode, cars: g.race.cars.length, tf: !!g.race.tf, pol: g.race.pol ? g.race.pol.cars.length : 0, duel: hud.classList.contains('duel'), polHud: hud.classList.contains('pol'), gap: txt('h-gap'),
          lbl: document.querySelector('#h-rank .h-lbl').textContent, pos: txt('h-pos'), heat: txt('h-heat'), road, dist: g.race.player.dist, phase: g.phase, radioMode: g.radio && g.radio.mode, tail: [...new Set(tail)].slice(0, 12), rot, caps: [...new Set(caps)] };
        if (md === 'police') {   // the heat up (as if the player had wrecked half the police's cars): the helicopter comes, the radio says so
          let heli = false;
          g.race.pol.cool = -3; for (let i = 0; i < 40 && !heli; i++) { g.sim(1, true); await frame(); heli = !!(Render.roadInfo() || {}).heli; }
          g.autoDrive = true; for (let i = 0; i < 300 && !g.radio.log.some(e => e.who === 'BOBER'); i++) await wait(100);   // (the radio's lines take their time (real time): the car drives on meanwhile)
          g.autoDrive = false;
          Object.assign(out.police, { heli, heli2: g.race.pol.heli ? g.race.pol.heli.st : '', bober: (g.radio.log.find(e => e.who === 'BOBER') || {}).txt, log: g.radio.log.map(e => e.who + ': ' + e.txt) });
          // the places on the radio: [as written, in English, as the voice reads it]
          out.places = [1813, 6533, 7038, 7300, 12297, 860].map(d => g.radioPlace(d));
          // the mission: placed below the building at the top on the right lane, going up; the autopilot drives into it
          const R = g.race, T = R.track, P = R.player, G = R.pol.goal, i = T.idx(G.s - 140), d = T.w * 0.42, msgs = [];
          P.place(T.px[i] + T.nx[i] * d, T.pz[i] + T.nz[i] * d, T.hd[i]); P.y = P.py = P.roadY = T.hy[i]; P.vx = Math.cos(P.h) * 15; P.vz = Math.sin(P.h) * 15; P.q = T.query(P.x, P.z, i, P.q); P.sPrev = P.q.s;
          let goal = '';
          for (let k = 0; k < 80 && g.screen !== 'results'; k++) { g.sim(0.5, true); await frame(); const m = document.getElementById('h-msg'); if (m.className.includes('show')) msgs.push(m.textContent); if (!goal && /SKRIVALIŠČE/.test(txt('h-chk'))) goal = txt('h-chk'); }
          await wait(300);
          out.mission = { escaped: R.pol.escaped, busted: R.pol.busted, goal, msgs: [...new Set(msgs)], screen: g.screen, title: txt('res-title'), sub: txt('res-sub'), rows: [...document.querySelectorAll('#res-table tbody tr')].map(r => r.firstElementChild.textContent + ': ' + r.lastElementChild.textContent) };
        }
      }
      g.onAction('to-title'); await wait(250); out.radioOff = !g.radio.mode;
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
    const D = r.traffic, P = r.police, Q = r.pre, M = r.mission;
    T.check('Vršič Promet: the duel with one rival in the traffic, vehicles and people drawn, the HUD with the rival\'s gap (the commentator on, no police radio)',
      D.mode === 'traffic' && D.cars === 2 && D.tf && !D.pol && D.duel && !D.polHud && /^TEKMEC \d+,\d s (PRED|ZA) TABO$/.test(D.gap) && D.road && D.road.veh > 0 && D.road.ped > 0 && D.dist > 300 && D.phase === 'racing' && !D.radioMode && !D.tail.length,
      `${D.cars} cars, gap "${D.gap}", drawn ${JSON.stringify(D.road)}, ${Math.round(D.dist)} m, radio mode ${D.radioMode}`);
    T.check('Vršič Policija, the start: no start lights, nobody after the player (the checkpoint\'s patrol car parked ahead), no stars, the commentator silent, the police radio on the air (the checkpoint set up on Vršiška cesta), the checkpoint ahead on the HUD',
      Q.pc === 1 && Q.mode === 'park' && Q.chkCar && !Q.lights && !Q.phases.includes('lights') && Q.phases.includes('racing') && Q.pos.every(p => p === '0') && Q.heat.every(h => h === '') && Q.radioMode &&
      Q.caps.some(c => /^OKC KRANJ .*kontrola prometa/.test(c)) && Q.chk.some(c => /^wait:KONTROLA PROMETA · \d+ m$/.test(c)) && Q.chk.some(c => /^approach:POLICIJSKA KONTROLA · \d+ mUstavi pri policistu \(ali pobegni\)$/.test(c)),
      `lights ${Q.lights}, phases ${[...new Set(Q.phases)]}, patrol cars ${Q.pc} (${Q.mode}), HUD ${[...new Set(Q.pos)]} "${[...new Set(Q.heat)]}", radio ${JSON.stringify([...new Set(Q.caps)].slice(0, 3))}, prompts ${JSON.stringify([...new Set(Q.chk)].filter((c, i, a) => i < 2 || i === a.length - 1))}`);
    T.check('Vršič Policija: the autopilot drives through the checkpoint (it does not stop): the chase; the officer shouts, the unit there calls it in (the car\'s colour and model)',
      Q.stage === 'chase' && Q.why === 'skip' && Q.seen && P.log.some(l => /^POLICIST: (Stojte|Hej|Stoj)/.test(l)) && P.log.some(l => /^KG-1: .*kontrol.*Gre za [a-zčšž]+ [A-Z]/.test(l)),
      `${Q.stage} (${Q.why}), radio: ${JSON.stringify(P.log.slice(0, 7))}`);
    T.check('Vršič Policija: the chase: patrol cars drawn with their lights flashing, the HUD with the patrol cars after the player and the heat',
      P.mode === 'police' && P.cars === 1 && P.tf && P.pol >= 1 && P.polHud && !P.duel && P.lbl === 'POLICIJA' && +P.pos >= 1 && /^\u2605+\u2606*$/.test(P.heat) && P.heat.length === 5 && P.road && P.road.pol >= 1 && P.road.lampOn && P.dist > 300,
      `${P.pol} patrol cars, HUD "${P.lbl} ${P.pos}" "${P.heat}", drawn ${JSON.stringify(P.road)}, ${Math.round(P.dist)} m, ${P.phase}`);
    T.check('Vršič Policija: arrows at the bottom for the patrol cars behind (blue and red in the chase), how many metres back, pointing back',
      P.tail.length >= 1 && P.tail.every(t => /^[brs]( n)? (\d+ m|ob tebi)$/.test(t)) && P.rot.filter(a => a > 95 && a < 265).length >= P.rot.length * 0.6,
      `${JSON.stringify(P.tail)}, angles ${P.rot.slice(0, 8).join(' ')}`);
    T.check('Vršič Policija: the police radio talks in the chase (the speakers\' call signs, the real places)',
      P.caps.some(c => /^(KG-\d+|OKC KRANJ|MOTORIST \d+|CIVILNA \d+|BOBER|PP BOVEC|POLICIST) .{12,}/.test(c)) && P.log.some(l => /(pri|na|v|pod|pred) (Jasni|Jasno|Kranjski Gori|Vršiški cesti|Eriškem|Eriškim|razglednem|Šumici|\d+\. serpentin)/.test(l)),
      JSON.stringify(P.caps.slice(0, 4)));
    T.check('Vršič Policija, the heat up: the helicopter drawn over the player, the radio hears of it (Bober)',
      P.heli && !!P.bober, `helicopter ${P.heli} (${P.heli2}), Bober: "${P.bober}"`);
    const pl = r.places;
    T.check('the police radio names the real places: Jasna, Mihov dom, the hairpins by number (said in words), the pass, the streets of Kranjska Gora',
      pl[0][0] === 'pri Jasni' && pl[1][0] === 'pri Mihovem domu' && pl[2][0] === 'pri 8. serpentini, Ruska kapelica' && pl[2][2] === 'pri osmi serpentini, Ruska kapelica' && pl[3][0] === 'med 8. in 9. serpentino' && pl[3][2] === 'med osmo in deveto serpentino' &&
      pl[4][0] === 'na Vršiču' && /^na Vršiški cesti/.test(pl[5][0]) && pl.every(p => p[1] && !/[čšž]/.test(p[1])),
      JSON.stringify(pl.map(p => p[0])));
    T.check('Vršič Policija, the mission: below the building at the top (the way to it on the HUD), the autopilot drives into it: MISIJA OPRAVLJENA!, the results, the rap sheet with the checkpoint, the commentator back after the run',
      M.escaped && !M.busted && /^SKRIVALIŠČE · \d+ m/.test(M.goal) && M.msgs.includes('MISIJA OPRAVLJENA!') && M.screen === 'results' && M.title === 'Misija opravljena!' && /garažo/.test(M.sub) &&
      M.rows.includes('Kontrola prometa: nisi ustavil, pobegnil') && M.rows.some(r => /^Prevožena pot: 12,3 \/ 12,3 km$/.test(r)) && r.radioOff,
      `${M.title} "${M.sub}", HUD "${M.goal}", messages ${JSON.stringify(M.msgs)}, rows ${JSON.stringify(M.rows.slice(0, 4))}`);
  }

  // 6e. Harju, the city stage in Jyväskylä: first its evening sky from the cockpit (the sky dome drawn: the theme's own zenith and its warm glow
  //     towards the sun by day, no glow at dusk); then to the flying finish: the record under 'harju@cs', the distance to go on the HUD, the
  //     stage's words and the medal on the results, the co-driver's calls ready (the changes of surface among them: onto the gravel, the cobbles, the tarmac)
  {
    await startTrack(page, 'harju');
    const s = await page.evaluate(async () => {
      const g = window.__game, fr = async (n) => { for (let k = 0; k < n; k++) await new Promise(r => requestAnimationFrame(r)); };
      g.S.camera = 'cockpit'; await fr(4); const day = Render.show;
      Render.setAtmos({ season: 'summer', tod: 'dusk' }); await fr(3); const dusk = Render.show;
      Render.setAtmos({ season: 'summer', tod: 'day' }); g.S.camera = 'chase'; await fr(2);
      return { day: { sky: day.sky, warm: day.warm, todK: day.todK }, dusk: { sky: dusk.sky, warm: dusk.warm, todK: dusk.todK } };
    });
    T.check('Harju from the cockpit: the evening sky drawn with its warm glow towards the sun by day, none at dusk',
      s.day.sky && s.day.todK === 0 && s.day.warm > 0.5 && s.dusk.sky && s.dusk.todK === 0.5 && s.dusk.warm === 0, JSON.stringify(s));
    const r = await page.evaluate(async () => {
      const g = window.__game;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const left = document.getElementById('h-alt').textContent, calls = g.codrv.calls, notes = g.race.track.paceNotes().map(n => n.text);
      for (let i = 0; i < 200 && g.phase !== 'done'; i++) { g.sim(1, true); if (i % 10 === 0) await new Promise(r => setTimeout(r, 0)); }
      await new Promise(r => setTimeout(r, 800));
      const rec = JSON.parse(localStorage.getItem('tdgp-records') || '{}');
      return { phase: g.phase, t: g.race.player.finishTime, left, calls, notes, again: document.getElementById('res-restart').textContent, sub: document.getElementById('res-sub').textContent, rec: rec.tracks && rec.tracks['harju@cs'] };
    });
    const surf = ['onto gravel', 'onto cobbles', 'onto tarmac'].filter(w => r.notes.some(n => n.includes(w)));
    T.check('Harju stage finishes, record saved for cs, the distance to go on the HUD, a medal on the results, the co-driver\'s calls of the surfaces',
      r.phase === 'done' && r.rec && r.rec.bestTime > 0 && r.left === 'še 2,5 km' && r.again === 'Ponovi preizkušnjo' && /Harju/.test(r.sub) && /medalja/.test(r.sub) && r.calls >= 8 && surf.length === 3,
      `time ${r.t && r.t.toFixed(2)} s, record ${r.rec && r.rec.bestTime}, HUD "${r.left}", button "${r.again}", "${r.sub}", ${r.calls} co-driver calls, surfaces: ${surf.join(', ')}`);
  }
  // 6e. Katu-Jaryk, the descent: the card shows the drop; first the course flyover (def.fly: the captions in order, the camera down into the valley,
  //     a key skips it); the run down to the flying finish on the autopilot: the altitude falling on the HUD (from 1.242 m) with the height profile,
  //     the co-driver's calls ready, the record under 'katu@cs', the descent's words on the results (Ponovi spust, the splits with the altitudes), a medal line
  {
    const r = await page.evaluate(async () => {
      const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)), frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(300);
      const meta = document.querySelector('[data-track="katu"] .tmeta').textContent;
      document.querySelector('[data-track="katu"]').click(); await wait(150); g.onAction('start');
      for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === 'katu'); k++) await wait(100);
      await frame();
      const F = Render.pkFly, el = document.getElementById('pk-fly'), fly = { on: !!g.pkFly, show: el.className, cap: [el.children[1].textContent, el.children[2].textContent], names: [] };
      for (let t = 0, k = -1; t <= F.DUR; t += 0.05) { const o = F.at(t); if (o && o.k >= 0 && o.k !== k) { k = o.k; fly.names.push(F.caps[k].n); } }
      fly.y0 = F.at(0).shot.py; fly.y1 = F.at(F.DUR - 0.05).shot.py;   // (the camera: over the start, over the finish)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' })); await frame(); fly.after = { on: !!g.pkFly, show: el.className };
      const alt0 = document.getElementById('h-alt').textContent, prof = document.getElementById('hud').classList.contains('ttp'), calls = g.codrv.calls;
      g.sim(60, true); await frame(); const alt1 = document.getElementById('h-alt').textContent;
      for (let i = 0; i < 300 && g.phase !== 'done'; i++) { g.sim(1, true); if (i % 10 === 0) await wait(0); }
      await wait(800);
      const rec = JSON.parse(localStorage.getItem('tdgp-records') || '{}').tracks || {}, head = [...document.querySelectorAll('#res-tt th')].map(e => e.textContent);
      return { meta, fly, alt0, alt1, prof, calls, phase: g.phase, t: g.race.player.finishTime, again: document.getElementById('res-restart').textContent, head: head.join('|'), sub: document.getElementById('res-sub').textContent, rec: rec['katu@cs'] };
    });
    const a1 = +r.alt1.replace(/\D/g, ''), f = r.fly;
    T.check('Katu-Jaryk: the course flyover first (START at 1.242 m, the captions in order down to the finish, the camera ~500 m lower over the finish), a key skips it',
      f.on && f.show === 'show' && f.cap[0] === 'START' && f.cap[1] === '1.242 m' && f.names.join('|') === 'START|Prelaz Katu-Jaryk|Sedem serpentin|Prečka nad Čulišmanom|CILJ' &&
      f.y0 - f.y1 > 400 && !f.after.on && f.after.show === '',
      `${f.on ? 'on' : 'off'} "${f.cap.join(' ')}", captions ${f.names.join(' > ')}, camera ${Math.round(f.y0)} -> ${Math.round(f.y1)} m, after a key: ${JSON.stringify(f.after)}`);
    T.check('Katu-Jaryk: the card shows the drop, the altitude falling on the HUD with the profile, the co-driver\'s calls ready',
      /spust 559 m/.test(r.meta) && / kronometer/.test(r.meta) && r.alt0 === '1.242 m' && a1 > 683 && a1 < 1150 && r.prof && r.calls > 10,
      `card "${r.meta}", HUD "${r.alt0}" -> "${r.alt1}" after 60 s, profile ${r.prof}, ${r.calls} co-driver calls`);
    T.check('Katu-Jaryk: down to the flying finish, the record under katu@cs, Ponovi spust, the splits with the altitudes, a medal line',
      r.phase === 'done' && r.rec && r.rec.bestTime > 0 && r.again === 'Ponovi spust' && r.head.startsWith('Točka|Višina|') && /medalj/.test(r.sub),
      `time ${r.t && r.t.toFixed(2)} s, record ${r.rec && r.rec.bestTime}, button "${r.again}", splits "${r.head}", "${r.sub}"`);
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
