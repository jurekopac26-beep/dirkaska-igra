// The new menu (js/menu.js, css/menu.css, in a shadow root over the game): the title (Single race, Multiplayer, Career, Settings,
// Leaderboard, Credits), the four modes, the tracks of every mode in their groups (each with its picture: the map from above, or the
// model of the land), the weather and the race options, the car (the game's own screen and back), a race from the menu (the intro
// off, the short intro with its video and Skip) and the way back to the title, the game's own screens the menu links to, the
// layouts (upright, on its side, a small phone), and the old menu that stays for ?menu=old.
//   node tests/browser/menu.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('menu');
const srv = await serve();
const browser = await launch();
const PAGE = srv.base + '/index.html';
try {
  // (the menu's page of the game: the intro and the qualifying off, the sound off, the menu on)
  const open = (settings, vp, opts) => openGame(browser, PAGE, Object.assign({ intro: 2, quali: 0 }, settings), vp || { width: 412, height: 915 }, Object.assign({ menu: true }, opts));
  const ready = (page) => page.waitForFunction(() => window.Menu && Menu.ready && document.getElementById('menu-host').shadowRoot.querySelector('#s-title'), null, { timeout: 60000 });
  // (the menu lives in a shadow root: `root` in the code run in the page)
  const SH = 'const root = document.getElementById("menu-host").shadowRoot;';
  const ev = (page, body, arg) => page.evaluate(new Function('arg', SH + body), arg);
  const click = (page, act) => page.click(`[data-act="${act}"]`);
  const done = (page) => page.click('.sheet .go[data-act="close-sheet"]');   // (a sheet's Done button)
  const shown = (page) => page.evaluate(() => [...document.querySelectorAll('.screen.show')].map(e => e.id));
  // (a picture still on its way when the next track is stepped to is cancelled by the browser: not an error of the page)
  const real = (errs) => errs.filter(e => !/^request failed: \S+\/assets\//.test(e));
  const raceOn = (page, id) => page.waitForFunction((id) => window.__game.race && window.__game.race.track.def.id === id, id, { timeout: 120000 });

  // 1. the title: the menu is the screen on show; a new player's track is a real one, not the test track the game starts on
  {
    const { ctx, page, errors } = await open();
    await ready(page);
    const t = await ev(page, 'return { tiles: [...root.querySelectorAll(".tile b")].map(e => e.textContent), small: [...root.querySelectorAll(".tsmall span")].map(e => e.textContent), sub: root.querySelector(".t-single small").textContent, logo: root.querySelector(".logo").textContent };');
    T.check('the title: Single race, Multiplayer, Career; Settings and Leaderboard; the logo', JSON.stringify(t.tiles) === '["SINGLE RACE","MULTIPLAYER","CAREER"]' && t.small.includes('Settings') && t.small.includes('Leaderboard') && /APEX\s*RACING/i.test(t.logo), JSON.stringify(t));
    T.check('the menu is the screen on show; a new player starts on a real track, not the test one (Jezero)', (await shown(page)).join() === 's-menu' && !/Jezero/.test(t.sub) && /Circuit race/.test(t.sub), t.sub);

    // 2. the modes
    await click(page, 'single');
    const m = await ev(page, 'return [...root.querySelectorAll(".t-sub .mode b")].map(e => e.textContent);');
    T.check('Single race: the four modes', JSON.stringify(m) === '["Circuit race","Police chase","Time trial","Traffic duel"]', JSON.stringify(m));

    // 3. the tracks of every mode: the groups and their counts as the game's tracks say, every track with its picture
    const MODES = [['race', 'race'], ['chase', 'police'], ['trial', 'tt'], ['duel', 'traffic']];
    for (const [mode, gm] of MODES) {
      await click(page, 'mode:' + mode);
      const exp = await page.evaluate((gm) => {
        const grp = (d) => d.test ? 'test' : (d.rally || d.descent) ? 'rally' : d.open ? 'road' : 'circuit', out = {};
        for (const d of Core.TRACKS) { if (d.variantOf) continue; const modes = d.modes || (d.timeTrial ? ['tt'] : ['race']); if (modes.includes(gm)) out[grp(d)] = (out[grp(d)] || 0) + 1; }
        return out;
      }, gm);
      const tabs = await ev(page, 'return Object.fromEntries([...root.querySelectorAll(".groups button")].map(b => [b.dataset.act.split(":")[1], +b.querySelector("i").textContent]));');
      const same = ['circuit', 'road', 'rally', 'test'].every(g => (tabs[g] === undefined ? 0 : tabs[g]) === (exp[g] || 0) || (g === 'test' && tabs[g] === undefined && !exp[g]));
      T.check(`${mode}: the groups of tracks and their counts are the game's (${JSON.stringify(exp)})`, same, JSON.stringify({ tabs, exp }));
      let seen = 0; const bad = [], urls = new Set();
      for (const g of ['circuit', 'road', 'rally', 'test']) {
        if (!exp[g]) continue;
        await click(page, 'group:' + g);
        for (let k = 0; k < exp[g]; k++) {
          // the picture on the stage: the map from above (an svg image), or the model of the land (an img): loaded
          const r = await page.waitForFunction(() => {
            const root = document.getElementById('menu-host').shadowRoot, st = root.querySelector('#track-stage'), name = root.querySelector('.card h1').firstChild.textContent;
            const imgs = [...st.querySelectorAll('.dio img')], map = st.querySelector('.dio.topmap'), fly = st.querySelector('.dio.fly video'), files = [...st.querySelectorAll('.dio img, .dio image')].map(e => e.getAttribute('src') || e.getAttribute('href'));
            if (fly) return { name, kind: 'flyover', files: [fly.getAttribute('poster'), fly.getAttribute('src')].filter(Boolean) };   // (a route track's default: the flyover video, with its poster)
            if (map) return { name, kind: 'map', files };
            if (imgs.length && imgs.every(i => i.complete && i.naturalWidth > 0)) return { name, kind: 'model', files };
            return null;
          }, null, { timeout: 20000 }).then(h => h.jsonValue()).catch(() => ({ name: '?', kind: 'none' }));
          seen++; if (r.kind === 'none') bad.push(g + '#' + k); for (const f of r.files || []) urls.add(f);
          await click(page, 'track:1');
        }
      }
      const gone = await page.evaluate(async (list) => { const out = []; for (const u of list) { try { if (!(await fetch(u, { method: 'HEAD' })).ok) out.push(u); } catch (_) { out.push(u); } } return out; }, [...urls]);
      T.check(`${mode}: every track of every group shows its picture (${seen} tracks, ${urls.size} picture files, none missing)`, !bad.length && !gone.length && seen === Object.values(exp).reduce((a, b) => a + b, 0), JSON.stringify({ bad, gone }));
      await page.click('.topbar [data-act="back"]');   // (back to the modes)
    }
    T.check('no page errors in the title, the modes and the track lists', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 4. the weather and the race options, the car and its way back, the credits; then a race from the menu
  {
    const { ctx, page, errors } = await open();
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    // the map switch over a route track (Riviera): only the numbers 1 and 2 (no MAP/Flyover words), number 1 (the flyover) lit by default, and no mode ribbon on the stage
    const stageUI = await ev(page, 'const m = root.querySelector(".mapv"), pr = m && m.querySelector("button[aria-pressed=\\"true\\"]"); return { btns: m ? [...m.querySelectorAll("button")].map(b => b.textContent) : null, text: m ? m.textContent.replace(/\\s+/g, "") : "", pressed: pr ? pr.textContent : "", ribbon: !!root.querySelector("#track-stage .ribbon") };');
    T.check('the track stage: the map switch is only "1" and "2" (no MAP/Flyover words), the flyover (1) is lit by default, no mode ribbon', JSON.stringify(stageUI.btns) === '["1","2"]' && stageUI.text === '12' && stageUI.pressed === '1' && !stageUI.ribbon, JSON.stringify(stageUI));
    await click(page, 'pick-weather');
    await click(page, 'weather:1');
    let s = await page.evaluate(() => ({ w: window.__game.S.weather, rainy: document.getElementById('menu-host').shadowRoot.querySelector('#track-stage').classList.contains('rainy') }));
    T.check('the weather sheet: Rain sets the game\'s weather, the model/map goes wet', s.w === 'rain' && s.rainy, JSON.stringify(s));
    // the rain covers the whole picture (a canvas is not stretched by top and bottom: it once stopped half way) and stops above the bar with the arrows
    const rc = await ev(page, 'const cv = root.querySelector("#track-stage canvas.rainfx"), pic = root.querySelector("#track-stage .dio"), ar = root.querySelector("#track-stage .arrow"); const r = cv.getBoundingClientRect(), p = pic.getBoundingClientRect(); return { cv: [r.top, r.bottom, r.width], pic: [p.top, p.bottom, p.width], arrow: ar.getBoundingClientRect().top };');
    T.check('the rain covers the whole picture and stops above the bar with the arrows', Math.abs(rc.cv[0] - rc.pic[0]) < 1.5 && Math.abs(rc.cv[1] - rc.pic[1]) < 1.5 && Math.abs(rc.cv[2] - rc.pic[2]) < 1.5 && rc.cv[1] <= rc.arrow + 1, JSON.stringify(rc));
    await click(page, 'more-options'); await click(page, 'opt:season:autumn'); await click(page, 'opt:tod:dusk'); await click(page, 'opt:length:short');
    s = await page.evaluate(() => ({ season: __game.S.season, tod: __game.S.tod, length: __game.S.length }));
    T.check('the race options sheet: Autumn, Dusk and a Short race are the game\'s settings', s.season === 'autumn' && s.tod === 'dusk' && s.length === 'short', JSON.stringify(s));
    await done(page);
    await click(page, 'pick-weather'); await click(page, 'weather:0'); await click(page, 'more-options'); await click(page, 'opt:season:summer'); await click(page, 'opt:tod:day'); await click(page, 'opt:length:normal'); await done(page);

    // the car: the game's own screen, and Back and Next both come back to the track step
    const was = await ev(page, 'return root.querySelector(".card h1").firstChild.textContent;');
    await click(page, 'pick-car');
    T.check('Your car opens the game\'s car screen', (await shown(page)).join() === 's-car');
    await page.click('#s-car [data-act="to-title"]'); await page.waitForTimeout(300);
    let back = await ev(page, 'return { h1: root.querySelector(".card h1") && root.querySelector(".card h1").firstChild.textContent, scr: Menu.debug().screen };');
    T.check('Back from the car screen: the track step, the same track', back.scr === 'track' && back.h1 === was, JSON.stringify({ was, back }));
    await click(page, 'pick-car'); await page.click('#car-next'); await page.waitForTimeout(300);
    back = await ev(page, 'return { h1: root.querySelector(".card h1") && root.querySelector(".card h1").firstChild.textContent, scr: Menu.debug().screen };');
    T.check('Next from the car screen: the track step, the same track', back.scr === 'track' && back.h1 === was, JSON.stringify({ was, back }));

    // the credits on the title
    await page.click('.topbar [data-act="back"]'); await page.click('.t-subhead [data-act="tsub:"]');
    await click(page, 'credits');
    let c = await ev(page, 'const s = root.querySelector(".sheet.credits"); return s ? s.textContent : "";');
    T.check('Credits: the sheet names the data the pictures of the Earth are made from, and closes', /WorldCover/.test(c) && /Natural Earth/.test(c));
    await done(page);
    T.check('the credits sheet is closed again', !(await ev(page, 'return !!root.querySelector(".sheet");')));

    // a race from the menu (the intro off): the game starts on the chosen track, in the chosen mode, with the chosen laps; then back to the title
    await click(page, 'single'); await click(page, 'mode:race');
    const name = await ev(page, 'return root.querySelector(".card h1").firstChild.textContent;');
    await click(page, 'race-single');
    await raceOn(page, 'riviera').catch(() => null);
    const r = await page.evaluate(() => ({ id: __game.race && __game.race.track.def.id, laps: __game.race && __game.race.laps, tt: __game.race && !!__game.race.timeTrial, last: __game.S.lastTrack, shown: [...document.querySelectorAll('.screen.show')].map(e => e.id) }));
    T.check(`Race! (${name}, the intro off): the race runs on that track, 4 laps, the menu gone, the track remembered`, r.id === 'riviera' && r.laps === 4 && !r.tt && r.last === 'riviera' && r.shown.length === 0, JSON.stringify(r));
    await page.evaluate(() => __game.onAction('to-title')); await page.waitForTimeout(500);
    const t = await ev(page, 'return { scr: Menu.debug().screen, sub: Menu.debug().titleSub, shown: [...document.querySelectorAll(".screen.show")].map(e => e.id), race: !!window.__game.race, tile: !!root.querySelector(".t-single") };');
    T.check('after the race: back on the new title', t.scr === 'title' && !t.sub && t.shown.join() === 's-menu' && !t.race && t.tile, JSON.stringify(t));

    // the game's own screens the title links to, and the way back to it
    for (const [act, id] of [['game:to-settings', 's-settings'], ['game:to-board', 's-board'], ['game:to-online', 's-online'], ['career', null]]) {
      await click(page, act);
      let on;
      if (act === 'career') { await click(page, 'game:to-career'); on = (await shown(page)).join(); T.check('Career: the four ways; Career opens the game\'s own career screen', on === 's-career', on); }
      else { on = (await shown(page)).join(); T.check(`${act} opens the game's screen ${id}`, on === id, on); }
      await page.evaluate(() => __game.onAction('to-title')); await page.waitForTimeout(400);
      const sc = await ev(page, 'return Menu.debug().screen + ":" + Menu.debug().titleSub;');
      T.check(`from there, back to the menu's title`, sc.startsWith('title:'), sc);
    }
    T.check('no page errors in the weather, the options, the car, the race and the links', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 5. a time trial on a new track (Harju: the model of its land, no map or flight yet), and the short intro with its video and Skip
  {
    const { ctx, page, errors } = await open();
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:trial'); await click(page, 'group:rally');
    for (let k = 0; k < 5; k++) { const n = await ev(page, 'return root.querySelector(".card h1").firstChild.textContent;'); if (n === 'Harju') break; await click(page, 'track:1'); }
    const info = await ev(page, 'return { name: root.querySelector(".card h1").firstChild.textContent, sub: root.querySelector(".topbar h2 small").textContent, gold: /Gold time/.test(root.querySelector(".info").textContent) };');
    T.check('Time trial, Rally: Harju with its Gold time', info.name === 'Harju' && /Time trial/i.test(info.sub) && info.gold, JSON.stringify(info));
    await click(page, 'race-single');
    await raceOn(page, 'harju').catch(() => null);
    const r = await page.evaluate(() => ({ id: __game.race && __game.race.track.def.id, tt: __game.race && !!__game.race.timeTrial }));
    T.check('Race! in Time trial: Harju as a time trial', r.id === 'harju' && r.tt, JSON.stringify(r));
    await page.evaluate(() => __game.onAction('to-title')); await page.waitForTimeout(400);
    T.check('no page errors in the time trial', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page, errors } = await open({ intro: 1 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    await click(page, 'race-single');
    await page.waitForFunction(() => { const v = document.getElementById('menu-host').shadowRoot.querySelector('.intro video'); return v && v.currentTime > 1.2 && !v.paused; }, null, { timeout: 90000 }).catch(() => null);
    const iv = await ev(page, 'const v = root.querySelector(".intro video"); return v ? { t: v.currentTime, paused: v.paused, dur: v.duration, head: root.querySelector(".ix-name h2") && root.querySelector(".ix-name h2").firstChild.textContent, race: !!window.__game.race } : null;');
    T.check('the short intro: the helicopter\'s video plays over the track, the race waits', iv && iv.t > 1.2 && !iv.paused && iv.dur > 20 && iv.head === 'Riviera' && !iv.race, JSON.stringify(iv));
    await page.click('.intro [data-ix="skip"]');
    await raceOn(page, 'riviera').catch(() => null);
    const a = await ev(page, 'return { intro: !!root.querySelector(".intro"), race: __game.race && __game.race.track.def.id };');
    T.check('Skip: the intro is gone, the race starts', !a.intro && a.race === 'riviera', JSON.stringify(a));
    T.check('no page errors in the intro', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }


  // 5b. the gamepad (a pad in the standard layout stood in for by a script, as in pad.test.mjs): Start goes on, the d-pad moves the highlight,
  //     A presses it, B goes back, RB and LB the track, Start starts the race
  {
    const init = () => {
      window.__pad = { id: 'Test pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
      Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [window.__pad, null, null, null] });
      const KEY = { 0: 'a', 1: 'b', 2: 'x', 3: 'y', 4: 'lb', 5: 'rb', 9: 'start', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
      window.__press = (i) => new Promise((res) => { const b = window.__pad.buttons[i], k = KEY[i]; b.pressed = true; b.value = 1; let n = 0;
        const check = () => { n++; if (typeof Input !== 'undefined' && Input.pad.prev[k]) { b.pressed = false; b.value = 0; requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => res(true), 50))); }
          else if (n > 600) { b.pressed = false; b.value = 0; res(false); } else requestAnimationFrame(check); };
        requestAnimationFrame(check); });
    };
    const { ctx, page, errors } = await open({}, { width: 412, height: 915 }, { init });
    await ready(page);
    const press = async (i) => {
      const seen = await page.evaluate((i) => window.__press(i), i); await page.waitForTimeout(700);
      const s = await ev(page, 'const f = root.querySelector(".pad-focus"), h = root.querySelector(".card h1"); return { screen: Menu.debug().screen, sub: Menu.debug().titleSub, focus: f ? (f.dataset.act || "") : "", name: h ? h.firstChild.textContent : "" };');
      s.seen = seen; return s;
    };
    let g = await press(9);
    T.check('pad, Start on the title: Single race opens, the highlight on the chosen mode', g.seen && g.screen === 'title' && g.sub === 'single' && g.focus === 'mode:race', JSON.stringify(g));
    g = await press(13);
    T.check('pad, down: the highlight moves to the next mode', g.focus === 'mode:chase', JSON.stringify(g));
    g = await press(12);
    g = await press(0);
    T.check('pad, A: the highlighted mode is chosen (the track step, the highlight on Race!)', g.screen === 'track' && g.focus === 'race-single' && g.name === 'Riviera', JSON.stringify(g));
    g = await press(5);
    const next = g.name;
    g = await press(4);
    T.check('pad, RB and LB: the next track and back', next !== 'Riviera' && next !== '' && g.name === 'Riviera', JSON.stringify({ next, g }));
    g = await press(12);
    T.check('pad, up: the highlight leaves Race! for another button', g.focus !== 'race-single' && g.focus !== '', JSON.stringify(g));
    g = await press(1);
    T.check('pad, B: back to the modes', g.screen === 'title' && g.sub === 'single', JSON.stringify(g));
    await press(9); await press(9);
    await raceOn(page, 'riviera').catch(() => null);
    const r = await page.evaluate(() => ({ id: __game.race && __game.race.track.def.id }));
    T.check('pad, Start, Start: the mode, then the race on that track', r.id === 'riviera', JSON.stringify(r));
    T.check('no page errors with the pad', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 6. the layouts: upright (360 x 640 and 412 x 915), on its side (915 x 412 and 640 x 360)
  for (const [w, h] of [[360, 640], [412, 915], [915, 412], [640, 360]]) {
    const { ctx, page, errors } = await open({}, { width: w, height: h });
    await page.emulateMedia({ reducedMotion: 'reduce' });   // (the slide-in of a screen is off: it would still be on its way, and the screen 8 px low, when measured)
    await ready(page);
    const title = await ev(page, 'const p = root.querySelector(".title-panel").getBoundingClientRect(); const b = [...root.querySelectorAll(".title-panel button")].map(e => e.getBoundingClientRect()); return { top: p.top, bottom: p.bottom, w: innerWidth, h: innerHeight, over: b.filter(r => r.bottom > p.bottom + 1 || r.top < p.top - 1).length };');
    T.check(`${w}x${h}: the main menu fits the screen, every button inside its panel`, title.top >= -0.5 && title.bottom <= title.h + 0.5 && title.over === 0, JSON.stringify(title));
    await click(page, 'single');
    const modes = await ev(page, 'const p = root.querySelector(".title-panel").getBoundingClientRect(); const c = [...root.querySelectorAll(".t-sub .mode")].map(e => e.getBoundingClientRect()); return { top: p.top, bottom: p.bottom, h: innerHeight, cut: c.filter(r => r.bottom > p.bottom + 1 || r.top < p.top - 1).length, n: c.length };');
    T.check(`${w}x${h}: the four modes fit their panel`, modes.top >= -0.5 && modes.bottom <= modes.h + 0.5 && modes.cut === 0 && modes.n === 4, JSON.stringify(modes));
    await click(page, 'mode:race');
    await page.waitForTimeout(500);
    const g = await ev(page, `
      const rc = (s) => { const e = root.querySelector(s); return e && e.getBoundingClientRect(); };
      const st = rc("#track-stage"), card = rc(".card"), foot = rc(".foot"), go = rc(".go"), top = rc(".topbar"), groups = rc(".groups");
      const drows = [...root.querySelectorAll(".drow")].map(e => e.getBoundingClientRect());
      return { st, card, foot, go, top, groups, drows, W: innerWidth, H: innerHeight, cardScroll: root.querySelector(".card").scrollHeight - root.querySelector(".card").clientHeight };`);
    const inside = (r) => r && r.left >= -0.5 && r.right <= g.W + 0.5 && r.top >= -0.5 && r.bottom <= g.H + 0.5;
    const side = g.W > g.H;
    T.check(`${w}x${h}: the track step${side ? ' (on its side: the stage left, the card right)' : ''}: Race! and Back inside the screen, the card above them, the stage next to it`,
      inside(g.go) && inside(g.foot) && g.card.bottom <= g.foot.top + 1 && g.card.top >= g.groups.bottom - 1 && g.drows.every(inside) && (side ? g.st.right <= g.card.left + 1 && g.st.height >= g.H - 2 : g.st.bottom <= g.card.top + 40), JSON.stringify({ st: g.st, card: g.card, go: g.go }));
    T.check(`${w}x${h}: the card shows its car and weather boxes without scrolling`, g.cardScroll <= 2, 'scroll ' + g.cardScroll);

    // the bar under the picture (the arrows and the track's number, 3/14, no dots) is in the same place on a map (Vršič) and on a model (the
    // next track); an open road's map is turned to run up the frame (start below, finish above) in a frame not much wider than tall, else it
    // lies; the whole route and the names of its flags inside the picture
    const MEASURE = `
      const c = (e) => { const r = e.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
      const st = root.querySelector("#track-stage"), pic = st.querySelector(".dio"), svg = st.querySelector(".topmap svg"), pc = root.querySelector(".pcount");
      const out = { name: root.querySelector(".card h1").firstChild.textContent, count: pc ? pc.textContent : "", total: +root.querySelector(".groups [aria-selected=true] i").textContent, dots: !!st.querySelector(".dots"), pic: c(pic), arr: [...st.querySelectorAll(".arrow")].map(c), cnt: pc ? c(pc) : null, scr: [innerWidth, innerHeight] };
      if (svg) { out.rot = svg.querySelector("g.rot").getAttribute("transform") || ""; out.s = c(svg.querySelector(".mk.s circle")); const f = svg.querySelector(".mk.f circle"); out.f = f ? c(f) : null; out.line = c(svg.querySelector("path.rt-o")); out.names = [...svg.querySelectorAll(".mk text")].map(c); }
      return out;`;
    await click(page, 'group:road'); await click(page, 'mapv:2'); await page.waitForTimeout(500);
    const v1 = await ev(page, MEASURE);
    await click(page, 'track:1'); await page.waitForTimeout(500);
    const v2 = await ev(page, MEASURE);
    const same = (a, b) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1;
    const barOk = (v) => !v.dots && v.arr.length === 2 && v.arr.every(a => a.t >= v.pic.b - 1 && a.b <= v.scr[1] + 0.5) && v.cnt && v.cnt.x > v.arr[0].x && v.cnt.x < v.arr[1].x;
    T.check(`${w}x${h}: under the picture a bar with the arrows and the track's number (1/${v1.total}, then 2/${v1.total}), no dots; the arrows at the same place on a map and on a model`,
      !!v1.line && !v2.line && v1.count === '1/' + v1.total && v2.count === '2/' + v2.total && barOk(v1) && barOk(v2) && same(v1.arr[0], v2.arr[0]) && same(v1.arr[1], v2.arr[1]), JSON.stringify({ v1: { count: v1.count, arr: v1.arr, pic: v1.pic }, v2: { count: v2.count, arr: v2.arr } }));
    const tall = v1.pic.w / v1.pic.h < 1.3, turned = /^rotate\(-90 /.test(v1.rot);
    const upright = tall ? v1.f && v1.s.y > v1.f.y + v1.pic.h * 0.4 && Math.abs(v1.s.x - v1.f.x) < v1.pic.w * 0.35 : v1.f && v1.f.x > v1.s.x + v1.pic.w * 0.4;
    T.check(`${w}x${h}: the open road's map ${tall ? 'runs up the frame: Kranjska Gora (the start) below, Vršič (the finish) above' : 'lies along the frame (it is wide and short): the start left, the finish right'}`, turned === tall && !!upright, JSON.stringify({ rot: v1.rot, pic: v1.pic, s: v1.s, f: v1.f }));
    const inPic = (r, p, e) => r.l >= p.l - e && r.r <= p.r + e && r.t >= p.t - e && r.b <= p.b + e;
    T.check(`${w}x${h}: the whole route (start to finish) and the names of its flags are inside the picture, the names upright`, inPic(v1.line, v1.pic, 6) && v1.names.length >= 2 && v1.names.every(n => inPic(n, v1.pic, 1) && n.w > n.h), JSON.stringify({ line: v1.line, pic: v1.pic, names: v1.names }));
    await click(page, 'group:circuit'); await page.waitForTimeout(400);
    const nCirc = +(await ev(page, 'return root.querySelector("[data-act=\\"group:circuit\\"] i").textContent;'));
    const cut = []; let maps = 0;
    for (let k = 0; k < nCirc; k++) {
      await page.waitForTimeout(300);
      const m = await ev(page, MEASURE);
      if (m.names) { maps++; if (!inPic(m.line, m.pic, 6) || !m.names.every(n => inPic(n, m.pic, 1))) cut.push(m.name); }
      await click(page, 'track:1');
    }
    T.check(`${w}x${h}: on every circuit's map (${maps}) the route and the names of its flags are inside the picture`, maps >= 5 && !cut.length, JSON.stringify(cut));
    T.check(`${w}x${h}: no page errors`, !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 8. the pictures already seen stay without internet (sw.js keeps them as they are looked at)
  {
    const { ctx, page, errors } = await open();
    await ready(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); await ready(page);   // (the service worker in charge of the page: the pictures it asks for are kept)
    await click(page, 'single'); await click(page, 'mode:race'); await click(page, 'mapv:2'); await page.waitForTimeout(400);   // (the map from above: its webp images are kept by sw.js; the flyover is a video, not kept)
    const files = await ev(page, 'return [...root.querySelectorAll("#track-stage image, #track-stage img")].map(e => e.getAttribute("href") || e.getAttribute("src"));');
    await page.waitForFunction(async (n) => { const k = (await caches.keys()).find(x => /pictures/.test(x)); return !!k && (await (await caches.open(k)).keys()).length >= n; }, files.length, { timeout: 30000 }).catch(() => null);
    srv.setOffline(true);
    await page.reload().catch(() => null); await ready(page).catch(() => null);
    await click(page, 'single'); await click(page, 'mode:race'); await click(page, 'mapv:2').catch(() => null); await page.waitForTimeout(400);   // (MAP 2 was kept in the settings, so the map shows; its images come from the cache)
    const off = await page.waitForFunction(() => { const root = document.getElementById('menu-host').shadowRoot, i = root.querySelector('#track-stage'); return !!i && root.querySelector('.card h1') ? true : false; }, null, { timeout: 20000 }).then(() => true).catch(() => false);
    const loaded = await page.evaluate(async (files) => { const out = []; for (const f of files) { try { const r = await fetch(f); out.push(r.ok); } catch (_) { out.push(false); } } return out; }, files);
    const fonts = await page.evaluate(() => Promise.all([document.fonts.load('italic 900 20px ApexMenu', 'Vršič'), document.fonts.load('400 16px ApexMenu', 'Vršič')]).then(r => r.map(x => x.length)).catch(() => [0, 0]));
    srv.setOffline(false);
    T.check(`offline: the game starts from the saved copy, the track step's pictures (${files.length}) come from the kept copies, the menu's fonts (also for č and š) from the saved game`, off && files.length >= 2 && loaded.every(Boolean) && fonts.every(n => n > 0), JSON.stringify({ off, files, loaded, fonts }));
    await ctx.close();
  }

  // 9. the menu's style does not load (no connection, the file gone): the game's old menu takes over, not a blank screen
  {
    srv.setFail((req) => /\/css\/menu\.css/.test(req.url));
    const { ctx, page, errors } = await open();
    await page.waitForFunction(() => { const s = document.querySelector('.screen.show'); return s && s.id === 's-title'; }, null, { timeout: 30000 }).catch(() => null);
    srv.setFail(null);
    const sc = await page.evaluate(() => ({ shown: [...document.querySelectorAll('.screen.show')].map(e => e.id), title: !!document.getElementById('btn-champ') }));
    T.check('the menu\'s style does not load: the old title is on show, the failure in the console', sc.shown.join() === 's-title' && errors.some(e => /the new menu failed/.test(e)), JSON.stringify({ sc, errors: errors.slice(0, 3) }));
    await page.evaluate(() => __game.onAction('to-track')); await page.waitForTimeout(300);
    const n = await page.evaluate(() => ({ cards: document.querySelectorAll('[data-track]').length, shown: [...document.querySelectorAll('.screen.show')].map(e => e.id) }));
    T.check('and the old track screen works', n.cards > 20 && n.shown.join() === 's-track', JSON.stringify(n));
    await ctx.close();
  }

  // 7. the old menu stays for ?menu=old (and for the tests that click through it)
  {
    const { ctx, page, errors } = await openGame(browser, PAGE, { sound: 0, comm: 0 }, { width: 412, height: 915 }, {});   // (no opts.menu: tdgp-menu=old)
    await page.waitForTimeout(800);
    const o = await page.evaluate(() => ({ shown: [...document.querySelectorAll('.screen.show')].map(e => e.id), shadow: !!(document.getElementById('menu-host').shadowRoot && document.getElementById('menu-host').shadowRoot.querySelector('#s-title')) }));
    T.check('?menu=old (tdgp-menu=old): the old title is the screen on show, the new menu not built', o.shown.join() === 's-title' && !o.shadow, JSON.stringify(o));
    await page.evaluate(() => __game.onAction('to-track')); await page.waitForTimeout(300);
    await page.setViewportSize({ width: 600, height: 400 }); await page.waitForTimeout(300);   // (a window that changes its size, the new menu not built)
    await page.setViewportSize({ width: 412, height: 915 }); await page.waitForTimeout(300);
    T.check('the old track screen lists the tracks; the window changing its size is no error', (await page.evaluate(() => document.querySelectorAll('[data-track]').length)) > 20 && !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
