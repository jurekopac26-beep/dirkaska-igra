// The new menu (js/menu.js, css/menu.css, in a shadow root over the game): the title (Single race, Multiplayer, Career, Settings,
// Leaderboard, Credits), the eight modes (Elimination, Pursuit and Drag race: Zabava; Endless traffic), the tracks of every mode in one list that goes round (the real ones from the shortest to the
// longest, then the test tracks; each with its pictures in the stage's three cameras: 1 the map from above, 2 the flyover with the height
// graph, 3 the corner's video, else the model of the land), the track step's head, row of numbers, road sign and neighbours
// (docs/meni-izbira-proge.md), the quick list (the flag: countries by continent, a country's tracks, a track's card, the search and the
// filters, the player's marks, Back), the weather and the race options, the car in 3D with the wind round it
// (js/menu-car.js: in the player's colour, the wind drawn and moving, its picture without WebGL; its name over it; tapped: the garage, whose
// back and Izberi progo lead straight to the track step), a race from the menu (the intro
// off, the short intro with its video and Skip; in Circuit race the race weekend's calendar: qualifying off by default and remembered
// when switched on, the race from the back of the grid without it, Back, the pad) and the way back to the title, the game's own screens the menu links to, the
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
  const click = (page, act) => page.click(`[data-act="${act}"] >> visible=true`);   // (the one on show: the carousel's cards and arrows, on its side only, come before the neighbours' buttons, upright only)
  const done = (page) => page.click('.sheet .go[data-act="close-sheet"]');   // (a sheet's Done button)
  const shown = (page) => page.evaluate(() => [...document.querySelectorAll('.screen.show')].map(e => e.id));
  // behind NEUPORABNO (the title's button, CLAUDE.md »Pred izidom: NEUPORABNO«): its sheet, a hidden track's card, Select: the track step of
  // the hidden tracks, on it (in the menu's mode when the track is driven in it)
  const nuPick = async (page, id) => {
    await page.click('[data-act="nu"] >> visible=true');
    await page.click(`.izb-sheet.nu [data-t="${id}"]`); await page.click(`.izb-sheet.nu [data-sel="${id}"]`);
    await page.waitForFunction((id) => { const d = Menu.debug(); return d.nu && d.screen === 'track' && d.list[d.trackIdx] === id && !document.getElementById('menu-host').shadowRoot.querySelector('.izb-sheet'); }, id, { timeout: 15000 });
  };
  // (a picture still on its way when the next track is stepped to is cancelled by the browser: not an error of the page)
  const real = (errs) => errs.filter(e => !/^request failed: \S+\/assets\//.test(e));
  const raceOn = (page, id) => page.waitForFunction((id) => window.__game.race && window.__game.race.track.def.id === id, id, { timeout: 120000 });
  // (a wait that ran out: what the page shows, for the log: its address and load state, on show or not and whether it still draws frames
  // (raf: ms to the next frame), the game's screen, the menu, the loading screen's message (a start that failed shows it there), the
  // service worker; a page that does not answer in 10 s (busy) is said so)
  const pageState = (page) => Promise.race([
    page.evaluate(() => new Promise((res) => {
      const ld = document.getElementById('loading'), nav = performance.getEntriesByType('navigation')[0];
      const st = { url: location.pathname + location.search, rs: document.readyState, vis: document.visibilityState, game: !!window.__game, screen: window.__game ? __game.screen : null,
        menu: !!window.Menu, ready: !!(window.Menu && Menu.ready), loading: ld && !ld.classList.contains('off') ? document.getElementById('ld-msg').textContent : '',
        shown: [...document.querySelectorAll('.screen.show')].map(e => e.id).join(), sw: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
        nav: nav ? nav.type + ', answer ' + Math.round(nav.responseStart) + ' ms, load ' + Math.round(nav.loadEventEnd) + ' ms' : '', t: Math.round(performance.now()), raf: null };
      requestAnimationFrame(() => { st.raf = Math.round(performance.now() - st.t); }); setTimeout(() => res(st), 1000);
    })),
    new Promise((res) => setTimeout(() => res({ answer: 'none in 10 s (the page busy)' }), 10000))]).catch((e) => ({ err: String(e).slice(0, 200) }));

  // (the slides the menu's script gives an element, not its style's: each "from to delay duration" of its transform, else of its opacity;
  // put into a page's code as `const kf = ${KF};`)
  const KF = '(e) => e ? e.getAnimations().filter(a => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)).map(a => { const k = a.effect.getKeyframes(), t = a.effect.getTiming(), p = "transform" in k[0] ? "transform" : "opacity"; return [k[0][p], k[k.length - 1][p], t.delay, t.duration].join(" "); }) : null';
  // 1. the title: the menu is the screen on show; a new player's track is a real one, not the test track the game starts on
  {
    const { ctx, page, errors } = await open();
    await ready(page);
    const t = await ev(page, 'return { tiles: [...root.querySelectorAll(".tile b")].map(e => e.textContent), small: [...root.querySelectorAll(".tsmall span")].map(e => e.textContent), sub: root.querySelector(".t-single small").textContent, logo: root.querySelector(".logo").textContent };');
    T.check('the title: Single race, Multiplayer, Career; Settings and Leaderboard; the logo', JSON.stringify(t.tiles) === '["SINGLE RACE","MULTIPLAYER","CAREER"]' && t.small.includes('Settings') && t.small.includes('Leaderboard') && /REAL ROADS ATLAS\s*RACING GAME/i.test(t.logo), JSON.stringify(t));
    // (the game's track here Jezero, hidden behind NEUPORABNO: the title shows the first real one of Circuit race, the default mode, instead)
    const first = 'const id = Menu.debug().list[0], d = Core.TRACKS.find(x => x.id === id) || {}, full = (d.en || {}).name || d.name || "", k = full.lastIndexOf(", "); return { id, name: k > 0 ? full.slice(0, k) : full, real: !d.test && !d.pending, race: (d.modes || [d.timeTrial ? "tt" : "race"]).includes("race"), game: __game.S.track };';
    const f = await ev(page, first);
    T.check('the menu is the screen on show; a new player starts on a real track, not the test one (Jezero): the first real one of Circuit race, the default mode (now Bâlea; a rally stage, a time trial only, is not in it)', (await shown(page)).join() === 's-menu' && !/Jezero/.test(t.sub) && f.real && f.race && t.sub === f.name + ' · Circuit race', t.sub + ' ' + JSON.stringify(f));
    {   // (a fresh player, no track saved: the game's own default track is that one, firstTrackId in js/game.js)
      const o = await openGame(browser, PAGE, '{"sound":0,"intro":2,"quali":0}', { width: 412, height: 915 }, { menu: true });   // (the settings as a string: lib.mjs adds no track)
      await ready(o.page);
      const g = await ev(o.page, first);
      T.check('a fresh player (no track saved): the game\'s own track is the first real one of Circuit race, the one on the title', g.real && g.race && g.game === g.id, JSON.stringify(g));
      await o.ctx.close();
    }

    // 2. the modes
    await click(page, 'single');
    const m = await ev(page, 'return [...root.querySelectorAll(".t-sub .mode b")].map(e => e.textContent);');
    T.check('Single race: the eight modes (Elimination, Pursuit and Drag race: Zabava, docs/zabava.md; Endless traffic: docs/neskoncna-voznja.md; Drag race: docs/drag-dirka.md)', JSON.stringify(m) === '["Circuit race","Police chase","Time trial","Traffic duel","Elimination","Pursuit","Endless traffic","Drag race"]', JSON.stringify(m));
    // Endless traffic: Bathurst its only track (Core.EN.tracks), the clock at the start (the game's level, Srednja: 30 s) in the row's last cell (the new menu's row: flag, best, length, climb, then this)
    await click(page, 'mode:endless');
    const en = await page.evaluate(() => { const root = document.getElementById('menu-host').shadowRoot, c = root.querySelector('.trow > div:last-child'); return { list: Menu.debug().list, cell: c ? [c.querySelector('small').textContent, c.querySelector('b').textContent] : null }; });
    T.check('Endless traffic: Bathurst only; the last cell Clock 30 s', JSON.stringify(en.list) === '["bathurst"]' && JSON.stringify(en.cell) === '["Clock","30 s"]', JSON.stringify(en));
    await page.click('.thead [data-act="back"]');   // (back to the modes: the head's arrow)

    // 3. the tracks of every mode: one list, no groups (the real tracks from the shortest to the longest; equal lengths by id), every track
    //    with its picture in camera 2 (the flyover, else its model, and the height graph), the list going round (after the last track the
    //    first again); the first time a track is met, its pictures in cameras 1 (the map, else the model) and 3 (the corner's video and its
    //    poster, else the model) too. The hidden tracks (pending, test) only behind NEUPORABNO, the same way (CLAUDE.md, »Pred izidom: NEUPORABNO«)
    const MODES = [['race', 'race'], ['chase', 'police'], ['trial', 'tt'], ['duel', 'traffic']], roads = {}, heads = {}, cams = {}, lists = {};   // (heads: every track's globe and height graph, of every mode; cams: every track's pictures in cameras 1 and 3)
    // the stage's picture as it is now: its kind and its files (a video's poster and the video)
    const PIC = `const st = root.querySelector('#track-stage'), map = st.querySelector('.dio.topmap'), v = st.querySelector('.dio.fly video, .dio.corner video');
      if (v) return { kind: v.closest('.corner') ? 'corner' : 'flyover', files: [v.getAttribute('poster'), v.getAttribute('src')], loop: v.loop && v.muted };
      return { kind: map ? 'map' : st.querySelector('.dio img') ? 'model' : 'none', files: [...st.querySelectorAll('.dio img, .dio image')].map(e => e.getAttribute('src') || e.getAttribute('href')) };`;
    // a mode's tracks in the menu's order: the real ones; behind NEUPORABNO (nu) the hidden ones, those awaiting the user's choice first, then the test tracks
    const expList = ([gm, nu]) => {
      const L = window.MENU.lens, ds = Core.TRACKS.filter(d => !d.variantOf && (d.modes || (d.timeTrial ? ['tt'] : ['race'])).includes(gm) && !!(d.test || d.pending) === nu);
      const rk = (d) => d.test ? 2 : d.pending ? 1 : 0;   // (the real ones, the ones awaiting the user's choice, the test tracks)
      ds.sort((a, b) => (rk(a) - rk(b)) || (L[a.id] - L[b.id]) || (a.id < b.id ? -1 : 1));
      return { ids: ds.map(d => d.id), roads: ds.filter(d => d.open && !d.test && !d.rally && !d.descent).length, lens: ds.every(d => L[d.id] > 0) };
    };
    // every track of the list on the stage in turn (camera 2), round to the first again: its picture, its head (key: the list, lists[key])
    const walk = async (key, mode, exp) => {
      const first = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; });
      let seen = 0; const bad = [], urls = new Set();
      for (let k = 0; k < exp.ids.length; k++) {
        // the picture on the stage: the map from above (an svg image), or the model of the land (an img): loaded
        const r = await page.waitForFunction(() => {
          const root = document.getElementById('menu-host').shadowRoot, st = root.querySelector('#track-stage'), name = root.querySelector('.where .w2').textContent;
          const imgs = [...st.querySelectorAll('.dio img')], map = st.querySelector('.dio.topmap'), fly = st.querySelector('.dio.fly video'), files = [...st.querySelectorAll('.dio img, .dio image')].map(e => e.getAttribute('src') || e.getAttribute('href'));
          // the head's globe (drawn once the Earth has come: every track with a country; the country from the place's name for the readers),
          // the height graph under the back arrow, the counter at the picture's bottom left
          const lab = root.querySelector('.where').getAttribute('aria-label') || '', kc = lab.lastIndexOf(', '), ctry = kc > 0 ? lab.slice(kc + 2) : '', gl = root.querySelector('.thead .globe canvas'), gr = st.querySelector('.hgraph svg');
          if (ctry && !gl) return null;
          const head = { id: Menu.debug().list[Menu.debug().trackIdx], ctry, sign: (root.querySelector('.yard .sign') || {}).textContent || '', globe: gl ? gl.dataset.country : '', graph: gr ? [...gr.querySelectorAll('text.lo, text.hi')].map(e => e.textContent) : null, count: (st.querySelector('.tcount') || {}).textContent || '' };
          if (fly) return { name, kind: 'flyover', files: [fly.getAttribute('poster'), fly.getAttribute('src')].filter(Boolean), head };   // (camera 2 on a track with a flyover: its video, with its poster)
          if (map) return { name, kind: 'map', files, head };
          if (imgs.length && imgs.every(i => i.complete && i.naturalWidth > 0)) return { name, kind: 'model', files, head };
          return null;
        }, null, { timeout: 20000 }).then(h => h.jsonValue()).catch(() => ({ name: '?', kind: 'none' }));
        seen++; if (r.kind === 'none' || r.kind === 'map') bad.push(k); for (const f of r.files || []) urls.add(f);
        if (r.head) heads[key + ':' + r.head.id] = Object.assign(r.head, { mode, key });
        if (r.head && !cams[r.head.id]) {   // (cameras 1 and 3, the first time the track is met)
          await click(page, 'cam:1'); const c1 = await ev(page, PIC); await click(page, 'cam:3'); const c3 = await ev(page, PIC); await click(page, 'cam:2');
          cams[r.head.id] = { c1, c3 }; for (const f of c1.files.concat(c3.files)) urls.add(f);
        }
        await click(page, 'track:1');
      }
      const again = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; });
      const gone = await page.evaluate(async (list) => { const out = []; for (const u of list) { try { if (!(await fetch(u, { method: 'HEAD' })).ok) out.push(u); } catch (_) { out.push(u); } } return out; }, [...urls]);
      lists[key] = exp.ids;
      return { seen, bad, gone, first, again, n: urls.size };
    };
    for (const [mode, gm] of MODES) {
      await click(page, 'mode:' + mode); await click(page, 'cam:2');
      const exp = await page.evaluate(expList, [gm, false]);
      const list = await page.evaluate(() => Menu.debug().list), groups = await ev(page, 'return !!root.querySelector(".groups");');
      T.check(`${mode}: one list of the game's real tracks (${exp.ids.length}) from the shortest to the longest, no hidden one (pending, test: NEUPORABNO); no groups`, exp.lens && !groups && JSON.stringify(list) === JSON.stringify(exp.ids), JSON.stringify({ list, exp: exp.ids }));
      roads[mode] = exp.roads;
      if (mode === 'trial') T.check(`every open road in Circuit race as in Time trial (${roads.race} and ${roads.trial}: Pikes Peak too; the open roads that became test tracks on 4., 5., 6. and 9. 11. 2026 are left out: the USA's but Pikes Peak, Vršič, Mount Buller, Sani Pass, Great Alpine Road; Irohazaka awaits the choice)`, roads.race === roads.trial && roads.race >= 7, JSON.stringify(roads));
      const w = await walk(mode, mode, exp);
      T.check(`${mode}: every track shows its picture (${w.seen} tracks, ${w.n} picture files, none missing); after the last the first again`, !w.bad.length && !w.gone.length && w.seen === exp.ids.length && w.again === w.first, JSON.stringify(w));
      await page.click('.thead [data-act="back"]');   // (back to the modes: the head's arrow)
    }
    // behind NEUPORABNO: every mode's hidden tracks the same way (the mode chosen, back to the title, NEUPORABNO's sheet, the first one's
    // card, Select: the track step of the mode's hidden tracks); its back arrow: the title
    for (const [mode, gm] of MODES) {
      const exp = await page.evaluate(expList, [gm, true]); if (!exp.ids.length) continue;
      await click(page, 'mode:' + mode); await page.click('.thead [data-act="back"]'); await click(page, 'tsub:');
      await nuPick(page, exp.ids[0]); await click(page, 'cam:2');
      const d = await page.evaluate(() => Menu.debug());
      T.check(`${mode} behind NEUPORABNO: the mode's hidden tracks (${exp.ids.length}), the ones awaiting the choice (pending) first, then the test tracks, each from the shortest to the longest`, d.nu && d.screen === 'track' && exp.lens && JSON.stringify(d.list) === JSON.stringify(exp.ids), JSON.stringify({ nu: d.nu, list: d.list, exp: exp.ids }));
      const w = await walk(mode + '+nu', mode, exp);
      T.check(`${mode} behind NEUPORABNO: every track shows its picture (${w.seen} tracks, ${w.n} picture files, none missing); after the last the first again`, !w.bad.length && !w.gone.length && w.seen === exp.ids.length && w.again === w.first, JSON.stringify(w));
      await page.click('.thead [data-act="back"]');   // (behind NEUPORABNO: back to the title, the hidden tracks hidden again)
      const t0 = await page.evaluate(() => { const d = Menu.debug(); return { screen: d.screen, sub: d.titleSub, nu: d.nu }; });
      T.check(`${mode} behind NEUPORABNO: the back arrow leads to the title, the hidden tracks hidden again`, t0.screen === 'title' && !t0.sub && !t0.nu, JSON.stringify(t0));
      await click(page, 'single');
    }
    // every track's pictures in cameras 1 and 3: the map from above where the track has a route (routes.js), else its model; the corner's
    // video in a loop, muted, where MENU.corners has it (every real track, and Vršič: a test track since 6. 11. 2026 without a model), else (a
    // test track) its model
    const cx = await page.evaluate(() => ({ routes: Object.keys(window.ROUTES || {}), corners: window.MENU.corners || [], tests: Core.TRACKS.filter(d => d.test).map(d => d.id) }));
    const cbad = Object.entries(cams).filter(([id, c]) => c.c1.kind !== (cx.routes.includes(id) ? 'map' : 'model') || c.c3.kind !== (cx.corners.includes(id) ? 'corner' : 'model') || (c.c3.kind === 'corner' && !(c.c3.loop && c.c3.files[0] === 'assets/maps/corner-' + id + '.webp' && c.c3.files[1] === 'assets/maps/corner-' + id + '.webm'))).map(([id, c]) => id + ':' + c.c1.kind + '/' + c.c3.kind);
    const real0 = Object.keys(cams).filter(id => !cx.tests.includes(id)), nocorner = real0.filter(id => !cx.corners.includes(id));
    T.check(`every track (${Object.keys(cams).length}): camera 1 its map (else its model), camera 3 its corner's video in a loop with its poster (else its model); every real track (${real0.length}) has its corner's video`, Object.keys(cams).length >= 47 && !cbad.length && !nocorner.length && cx.corners.every(id => !cx.tests.includes(id) || id === 'vrsic'), JSON.stringify({ cbad, nocorner }));
    // every track of every mode: its height graph under the back arrow in camera 2 (the flyover, or the model where a track has none), a
    // real track's with its lowest and highest heights; its country gold on the head's globe
    const tests = await page.evaluate(() => Core.TRACKS.filter(d => d.test).map(d => d.id)), H = Object.values(heads);
    const nograph = H.filter(x => !x.graph || (!tests.includes(x.id) && (x.graph.length !== 2 || !x.graph.every(t => /^-?\d[\d,]* m$/.test(t))))).map(x => x.id + ':' + JSON.stringify(x.graph));
    T.check(`every track of every mode (${H.length}) has its height graph; a real one's with its lowest and highest heights`, H.length >= 90 && !nograph.length, nograph.join(', '));
    // the counter at the picture's bottom left: the track's place among the real tracks of its mode's list (1 / 26 ...), a test track TEST
    const badCount = H.filter(x => { const real = lists[x.key].filter(id => !tests.includes(id)); return x.count !== (tests.includes(x.id) ? 'TEST' : (real.indexOf(x.id) + 1) + '\u2009/\u2009' + real.length); }).map(x => x.mode + ':' + x.id + ':' + x.count);
    T.check(`the counter: every real track its place among the real tracks of the list (1 / ${lists.race.filter(id => !tests.includes(id)).length} in Circuit race), every test track TEST`, H.length >= 90 && !badCount.length, badCount.join(', '));
    const withC = H.filter(x => x.ctry), noglobe = withC.filter(x => x.globe !== x.ctry).map(x => x.id + ':' + x.ctry + '/' + x.globe);
    T.check(`every track with a country (${withC.length} of ${H.length}: the test tracks Copper Forest and Thunder Cape have none) has its globe in the head, that country gold on it`, withC.length >= 90 && withC.length >= H.length - 4 && !noglobe.length, noglobe.join(', '));
    // the yard's road sign: TEST on a test track, PENDING on one awaiting the user's choice (pending: none since the user chose Bathurst on
    // 9. 11. 2026, Australia's other one a test track; the sign stays for a next choice), neither on a real one
    const pend = await page.evaluate(() => Core.TRACKS.filter(d => d.pending).map(d => d.id));
    const badSign = H.filter(x => pend.includes(x.id) ? !/PENDING$/.test(x.sign) : tests.includes(x.id) ? !/TEST$/.test(x.sign) : /(PENDING|TEST)$/.test(x.sign)).map(x => x.id + ':' + x.sign);
    T.check(`the yard's sign: TEST on every test track, PENDING on every track awaiting the choice (${pend.length}), neither on a real one`, (!pend.length || H.some(x => pend.includes(x.id))) && !badSign.length, JSON.stringify(badSign));
    // the wide maps: for every track in MENU.wideMaps the painted land (dry, rain) is the map and a margin all round it (the margin in the map's
    // pixels; the file at 0.8 of the map's scale with the island's detail, wide_detail.py: a test track's as wide_map.py left it, half as
    // many pixels, or at 0.8 where it was a real track when it moved to the test tracks and the freeze keeps its files), and the isle (dry,
    // rain) the map's own size
    const dims = await page.evaluate(async () => {
      const load = (u) => new Promise((res) => { const i = new Image(); i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.onerror = () => res(null); i.src = u; });
      const out = [];
      for (const [id, E] of Object.entries(window.MENU.wideMaps || {})) {
        const T = window.ROUTES[id].top, A = 'assets/maps/';
        out.push({ id, E, test: !!(Core.TRACKS.find(d => d.id === id) || {}).test, W: T.W, H: T.H, w: await load(A + 'wide-' + id + '.webp'), r: await load(A + 'wide-' + id + '-rain.webp'), a: await load(A + 'isle-' + id + '.webp'), b: await load(A + 'isle-' + id + '-rain.webp') });
      }
      return out;
    });
    const wbad = dims.filter(d => !(d.w && d.r && d.a && d.b && d.a[0] === d.W && d.a[1] === d.H && d.b[0] === d.W && d.b[1] === d.H && d.r[0] === d.w[0] && d.r[1] === d.w[1] &&
      (d.test ? [0.5, 0.8] : [0.8]).some(k => Math.abs(d.w[0] - (d.W + 2 * d.E) * k) <= 2 && Math.abs(d.w[1] - (d.H + 2 * d.E) * k) <= 2))).map(d => d.id);
    T.check(`the wide maps (${dims.length} tracks): the painted land and the isle, dry and in rain, all there and the size of the map plus its margin (the land at 0.8 of the map's scale, a test track's at half or at 0.8)`, dims.length >= 3 && !wbad.length, JSON.stringify({ wbad, dims }));
    T.check('no page errors in the title, the modes and the track list', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 4. the track step (Nürburg): the head, the row of numbers, the road sign, the neighbours, the back arrow; the weather and the race
  //    options, the car and its way back, the credits; then a race from the menu
  {
    const { ctx, page, errors } = await open({ track: 'nring', lastTrack: 'nring' });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    await page.waitForFunction(() => [...document.getElementById('menu-host').shadowRoot.querySelectorAll('.nb')].every(b => /^url\("?data:image\/png/.test(b.style.backgroundImage)), null, { timeout: 15000 }).catch(() => null);
    const scr = await ev(page, `const q = (s) => root.querySelector(s), d = Menu.debug(), n = d.list.length, i = d.trackIdx;
      const hb = q('.thead .hback'), hr = hb && hb.getBoundingClientRect();
      return { head: q('.where').textContent.replace(/\\s+/g, ' ').trim(), label: q('.where').getAttribute('aria-label'), fs: parseFloat(getComputedStyle(q('.where .w2')).fontSize), back: hb ? hb.dataset.act + ':' + Math.round(hr.width) + 'x' + Math.round(hr.height) : '', home: !!q('[data-act="home"]'), globe: !!q('.thead .globe'),
        foot: [...root.querySelectorAll('#s-track .foot button')].map(b => b.dataset.act), old: !!(q('.topbar') || q('.groups') || q('.card') || q('.arrow') || q('.pcount')),
        row: [...root.querySelectorAll('.trow > div')].map(e => e.className + ':' + e.textContent), grid: !!q('.trow .opp svg.grid'), flag: q('.trow .flag img') && q('.trow .flag img').getAttribute('src'), sign: q('.yard .sign').textContent, car: !!q('.yard .car[data-act="garage"]'),
        nb: [...root.querySelectorAll('.nb')].map(b => [b.dataset.act, b.getAttribute('aria-label'), b.dataset.flag || '', /^url\\("?data:image\\/png/.test(b.style.backgroundImage)]), prev: d.list[(i - 1 + n) % n], next: d.list[(i + 1) % n], id: d.list[i],
        wx: [...root.querySelectorAll('.wxv [data-act^="weather:"]')].map(b => b.dataset.act.slice(8) + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')), more: !!q('.wxv [data-act="more-options"]') };`);
    const riv = await page.evaluate(() => { const d = Core.TRACKS.find(x => x.id === 'nring'); const M = Core.MODELS[__game.S.car]; return Core.fieldSize(M.oneMake ? null : M, d.raceRivals || d.rivals || 21); });
    T.check('the track step\'s head: the back arrow (78 × 52), the place alone, "NÜRBURG" 44 px (the country for the readers), the globe; no house, no height; Race! alone at the foot; no title bar, groups, card or arrows',
      scr.id === 'nring' && scr.head === 'Nürburg' && scr.label === 'Nürburg, Germany' && scr.fs === 44 && scr.back === 'back:78x52' && !scr.home && scr.globe && JSON.stringify(scr.foot) === '["race-single"]' && !scr.old, JSON.stringify(scr));
    T.check(`the row: the flag of Germany (a button: the quick list), Best lap NEW (not driven yet), Length 20.69 km, Corners, ${riv} opponents by the start's grid`, JSON.stringify(scr.row.slice(0, 3)) === JSON.stringify(['flag:', 'best:Best lapNEW', ':Length20.69 km']) && /^:Corners\d+$/.test(scr.row[3]) && scr.row[4] === 'opp:Opponents' + riv && scr.grid && scr.flag === 'assets/flags/germany.svg', JSON.stringify(scr.row));
    T.check('the yard: the road sign with the country (GERMANY), the player\'s car before it opens the garage', /^germany$/i.test(scr.sign) && scr.car, JSON.stringify({ sign: scr.sign }));
    // the car in 3D (js/menu-car.js): the race's model in the player's colour, on a canvas over the whole yard, in the car's button's box
    // (left, in front of the sign), no picture; the wind round it: its lines across the yard right of the car too, soft blue, the waves
    // going (the lines elsewhere a second later); about 30 frames a second at most
    await page.waitForFunction(() => window.MenuCar && MenuCar.info().drawn, null, { timeout: 60000 }).catch(() => null);
    const c3 = await ev(page, `const y = root.querySelector('.yard'), cv = y.querySelector('canvas.c3d'), b = y.querySelector('.car'), i = MenuCar.info();
      const yr = y.getBoundingClientRect(), cr = cv ? cv.getBoundingClientRect() : null, br = b.getBoundingClientRect();
      const nb = [(br.left - yr.left) / yr.width * 2 - 1, 1 - (br.bottom - yr.top) / yr.height * 2, (br.right - yr.left) / yr.width * 2 - 1, 1 - (br.top - yr.top) / yr.height * 2];
      return { i, on: y.classList.contains('c3d-on'), cover: cr && Math.abs(cr.left - yr.left) < 1 && Math.abs(cr.right - yr.right) < 1 && Math.abs(cr.top - yr.top) < 1 && Math.abs(cr.bottom - yr.bottom) < 1, img: !!b.querySelector('img'), nb,
        car: Core.MODELS[__game.S.car].id, label: b.getAttribute('aria-label') };`);
    const inBtn = c3.i.box && c3.i.box[0] >= c3.nb[0] - 0.02 && c3.i.box[1] >= c3.nb[1] - 0.02 && c3.i.box[2] <= c3.nb[2] + 0.02 && c3.i.box[3] <= c3.nb[3] + 0.02;
    T.check('the yard\'s car in 3D: the player\'s car drawn on a canvas over the whole yard, inside its button\'s box, no picture; the button names the car and the garage',
      c3.i.drawn && c3.on && c3.cover && !c3.img && c3.i.car === c3.car && inBtn && c3.i.lines >= 10 && /^Your car: .+\. Open the garage$/.test(c3.label), JSON.stringify(c3));
    const w0 = await page.evaluate(() => MenuCar.sample(0)), w1 = await page.evaluate(() => MenuCar.sample(1.3));
    T.check('the wind: its lines drawn across the yard right of the car, soft blue, the car drawn; 1.3 s later the waves have moved them',
      w0 && w0.right > 0.01 && w0.car > 0.15 && w0.col && w0.col[2] >= w0.col[0] && w0.col[2] > 0.6 && w1 && Math.abs(w1.rows - w0.rows) > w0.rows * 0.002, JSON.stringify({ w0, w1 }));
    const f0 = await page.evaluate(() => MenuCar.info().frames); await page.waitForTimeout(2000); const f1 = await page.evaluate(() => MenuCar.info());
    T.check('the wind moves on its own, at most about 30 frames a second, the car\'s drawing cheap (draw calls, triangles)', f1.frames > f0 && f1.frames - f0 <= 64 && f1.calls <= 40 && f1.tris <= 60000, JSON.stringify({ f0, f1 }));
    // a weather tap draws the screen again: the same canvas moved into the new yard, still drawn, the wind not built again
    const b0 = await page.evaluate(() => MenuCar.info().builds); await click(page, 'weather:rain'); await click(page, 'weather:dry');
    const rd = await ev(page, 'const y = root.querySelector(".yard"); return { on: y.classList.contains("c3d-on"), cv: !!y.querySelector("canvas.c3d"), i: MenuCar.info() };');
    T.check('the screen drawn again (the weather): the car\'s canvas in the new yard at once, the wind kept', rd.on && rd.cv && rd.i.on && rd.i.builds === b0, JSON.stringify({ b0, rd }));
    T.check('the neighbours: the previous and the next track of the list (Livorno before Nürburg: the list from the shortest to the longest), each its flag with its last column stretched',
      scr.prev === 'livorno' && scr.nb[0][0] === 'track:-1' && /^Previous track: Livorno, Italy$/.test(scr.nb[0][1]) && scr.nb[0][2] === 'assets/flags/italy.svg' && scr.nb[0][3] && scr.nb[1][0] === 'track:1' && /^Next track: /.test(scr.nb[1][1]), JSON.stringify(scr.nb));
    T.check('the weather down the stage: Dry, Rain, Changing, Storm, Snow (Dry chosen), and more options under it', JSON.stringify(scr.wx) === '["dry*","rain","change","storm","snow"]' && scr.more, JSON.stringify(scr.wx));
    await page.click('.nb.r'); const nx = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; });
    await page.click('.nb.l'); const pv = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; });
    T.check('the neighbours tapped: the next track, then back to Nürburg', nx === scr.next && pv === 'nring' && (await page.evaluate(() => __game.S.track)) === 'nring', JSON.stringify({ nx, pv }));
    // the four cameras at the picture's bottom right, 10 px from its edge and over the room (icons only: 1 the map, 2 the flyover, 3 the
    // corner, 4 the friends' times), the map (1) lit when the step opens, 40 px wide, the others 30; the counter at the bottom left as high;
    // the height graph in its frame under the back arrow (as wide, 0.6 of it high, 22 px under it) on the map too; no mode ribbon on the stage
    const stageUI = await ev(page, `const m = root.querySelector("#track-stage .cams"), pr = m && m.querySelector("button[aria-pressed=\\"true\\"]"), st = root.querySelector("#track-stage"), r = m && m.getBoundingClientRect(), sr = st.getBoundingClientRect(), room = root.querySelector("#s-track .room").getBoundingClientRect();
      const c = root.querySelector("#track-stage .tcount").getBoundingClientRect(), g = root.querySelector("#track-stage .hgraph"), gr = g && g.getBoundingClientRect(), hb = root.querySelector(".thead .hback").getBoundingClientRect();
      return { btns: m ? [...m.querySelectorAll("button")].map(b => b.dataset.act + ":" + b.getAttribute("aria-label") + ":" + !!b.querySelector("svg")) : null, text: m ? m.textContent.trim() : "?", pressed: pr ? pr.dataset.act : "", at: r ? [sr.right - r.right, room.top - r.bottom].map(Math.round) : null,
        size: m ? [...m.querySelectorAll("button")].map(b => Math.round(b.getBoundingClientRect().width) + "x" + Math.round(b.getBoundingClientRect().height)) : null, count: [c.left - sr.left, room.top - c.bottom, c.height, r ? r.height : 0].map(Math.round),
        graph: gr ? [gr.left - hb.left, gr.top - hb.bottom, gr.width, gr.height].map(Math.round) : null, map: !!st.querySelector(".dio.topmap"), ribbon: !!st.querySelector(".ribbon"), room: [room.top - sr.top, sr.bottom - room.top].map(Math.round), radius: getComputedStyle(root.querySelector("#s-track .room")).borderTopLeftRadius };`);
    T.check('the track stage: four camera buttons at its bottom right over the room, icons only (Map, Flyover, Corner camera, Friends), the map (1) lit when the step opens; the counter at the bottom left; the height graph under the back arrow on the map too; the room over the picture\'s foot, its corners rounded 13 px; no mode ribbon',
      JSON.stringify(stageUI.btns) === '["cam:1:Map:true","cam:2:Flyover:true","cam:3:Corner camera:true","cam:4:Friends:true"]' && stageUI.text === '' && stageUI.pressed === 'cam:1' && JSON.stringify(stageUI.at) === '[10,10]' &&
      JSON.stringify(stageUI.size) === '["40x30","30x30","30x30","30x30"]' && JSON.stringify(stageUI.count) === '[10,10,38,38]' && JSON.stringify(stageUI.graph) === '[0,22,78,47]' && stageUI.map && !stageUI.ribbon && stageUI.room[1] === 16 && stageUI.radius === '13px', JSON.stringify(stageUI));
    // camera 2, the flyover: its video, only the start and the finish named over it (no places, no box with the place reached)
    await click(page, 'cam:2');
    const fl = await page.waitForFunction(() => { const root = document.getElementById('menu-host').shadowRoot, st = root.querySelector('#track-stage'), v = st.querySelector('.dio.fly video'), lab = st.querySelector('.flab');
      return v && lab && lab.children.length ? { src: v.getAttribute('src'), tags: [...lab.children].map(e => e.className), hud: !!st.querySelector('.hud'), cam: __game.S.menuCam } : null; }, null, { timeout: 20000 }).then(h => h.jsonValue()).catch(() => null);
    T.check('camera 2: the flyover, only the start and the finish named over it (no places, no box with the place and its height); the camera kept in the settings', fl && fl.src === 'assets/maps/fly-nring.webm' && JSON.stringify(fl.tags) === '["fl-s start","fl-s finish"]' && !fl.hud && fl.cam === 2, JSON.stringify(fl));
    // the globe in the head: the Earth turned to Nürburg, Germany gold in its middle; the height graph: Nürburg's lowest and highest
    // heights, the part flown over coloured as the flyover goes on (121 colours of the climb), in cameras 1 to 3
    await page.waitForFunction(() => { const c = document.getElementById('menu-host').shadowRoot.querySelector('.thead .globe canvas'); return c && c.width >= 104 && !Menu.debug().globe.turning; }, null, { timeout: 20000 }).catch(() => null);   // (turned from the last track's place: at rest)
    const gb = await ev(page, 'const c = root.querySelector(".thead .globe canvas"); if (!c) return null; const S = c.width, px = c.getContext("2d").getImageData(S / 2 - 2, S / 2 - 2, 4, 4).data; let r = 0, g = 0, b = 0; for (let i = 0; i < 16; i++) { r += px[i * 4]; g += px[i * 4 + 1]; b += px[i * 4 + 2]; } return { S, country: c.dataset.country, ring: c.dataset.ring, rgb: [r / 16, g / 16, b / 16].map(Math.round), w: c.getBoundingClientRect().width };');
    T.check('the head\'s globe: the Earth turned to the track, Germany gold in its middle, the ring round Nürburg', gb && gb.country === 'Germany' && gb.ring === '1' && gb.S >= 104 && gb.w === 52 && gb.rgb[0] > 150 && gb.rgb[0] - gb.rgb[2] > 60 && gb.rgb[1] > gb.rgb[2], JSON.stringify(gb));
    const gr0 = await ev(page, 'const g = root.querySelector("#track-stage .hgraph svg"); if (!g) return null; return { lo: g.querySelector("text.lo").textContent, hi: g.querySelector("text.hi").textContent, stops: g.querySelectorAll("#hgc stop").length, clip: +g.querySelector("#hgk rect").getAttribute("width"), x0: +g.querySelector("#hgk rect").getAttribute("width") };');
    const moved = await page.waitForFunction((x0) => { const r = document.getElementById('menu-host').shadowRoot.querySelector('#hgk rect'); return r && +r.getAttribute('width') > x0 + 8; }, gr0 && gr0.x0, { timeout: 40000 }).then(() => true).catch(() => false);
    T.check('the height graph: Nürburg\'s lowest and highest heights, the climb\'s colours, the part flown over growing with the flyover', gr0 && /^\d{3} m$/.test(gr0.lo) && /^\d{3} m$/.test(gr0.hi) && parseInt(gr0.hi) > parseInt(gr0.lo) + 100 && gr0.stops === 121 && moved, JSON.stringify({ gr0, moved }));
    await click(page, 'cam:1'); const g1 = await ev(page, 'return !!root.querySelector("#track-stage .hgraph svg");');
    await click(page, 'cam:3'); const g3 = await ev(page, 'return !!root.querySelector("#track-stage .hgraph svg");');
    await click(page, 'cam:4'); const g4 = await ev(page, 'return !!root.querySelector("#track-stage .hgraph");');
    await click(page, 'cam:2'); const g2 = await ev(page, 'return !!root.querySelector("#track-stage .hgraph svg");');
    T.check('the height graph on the map (1), in the flyover (2) and at the corner (3); not with the friends\' times (4)', g1 && g2 && g3 && !g4, JSON.stringify({ g1, g2, g3, g4 }));
    // camera 3, the corner: its video (poster first), muted, in a loop, playing (its clock goes on); the step opened again shows the map
    await click(page, 'cam:3');
    const cv0 = await page.waitForFunction(() => { const v = document.getElementById('menu-host').shadowRoot.querySelector('#track-stage .dio.corner video'); return v && v.readyState >= 2 && !v.paused && v.currentTime > 0.2 ? { t: v.currentTime, poster: v.getAttribute('poster'), src: v.getAttribute('src'), loop: v.loop, muted: v.muted, d: v.duration, w: v.videoWidth } : null; }, null, { timeout: 30000 }).then(h => h.jsonValue()).catch(() => null);
    await page.waitForTimeout(800);
    const cv1 = await ev(page, 'const v = root.querySelector("#track-stage .dio.corner video"); return v ? v.currentTime : -1;');
    T.check('camera 3: the corner\'s video (Nürburg\'s, its poster first), muted, in a loop of 6 to 8 s, playing', cv0 && cv0.poster === 'assets/maps/corner-nring.webp' && cv0.src === 'assets/maps/corner-nring.webm' && cv0.loop && cv0.muted && cv0.d >= 5.9 && cv0.d <= 8.1 && cv0.w >= 640 && cv1 !== cv0.t, JSON.stringify({ cv0, cv1 }));
    await page.click('.thead [data-act="back"]'); await click(page, 'mode:race');
    const reopen = await ev(page, 'const p = root.querySelector("#track-stage .cams [aria-pressed=\\"true\\"]"); return { cam: p && p.dataset.act, map: !!root.querySelector("#track-stage .dio.topmap"), set: __game.S.menuCam };');
    T.check('the track step opened again: the map (camera 1), whichever camera was chosen before', reopen.cam === 'cam:1' && reopen.map && reopen.set === 3, JSON.stringify(reopen));
    await click(page, 'weather:rain');
    let s = await page.evaluate(() => ({ w: window.__game.S.weather, rainy: document.getElementById('menu-host').shadowRoot.querySelector('#track-stage').classList.contains('rainy'), on: document.getElementById('menu-host').shadowRoot.querySelector('.wxv [aria-pressed="true"]').dataset.act }));
    T.check('the weather: Rain sets the game\'s weather, the model/map goes wet, Rain is the one lit', s.w === 'rain' && s.rainy && s.on === 'weather:rain', JSON.stringify(s));
    // the rain covers the whole picture (a canvas is not stretched by top and bottom: it once stopped half way)
    const rc = await ev(page, 'const cv = root.querySelector("#track-stage canvas.wxst"), pic = root.querySelector("#track-stage .dio"); const r = cv.getBoundingClientRect(), p = pic.getBoundingClientRect(); return { cv: [r.top, r.bottom, r.width], pic: [p.top, p.bottom, p.width] };');
    T.check('the rain covers the whole picture', Math.abs(rc.cv[0] - rc.pic[0]) < 1.5 && Math.abs(rc.cv[1] - rc.pic[1]) < 1.5 && Math.abs(rc.cv[2] - rc.pic[2]) < 1.5, JSON.stringify(rc));
    await click(page, 'weather:storm');
    s = await page.evaluate(() => ({ w: window.__game.S.weather, rainy: document.getElementById('menu-host').shadowRoot.querySelector('#track-stage').classList.contains('rainy') }));
    T.check('Storm: the game\'s weather, still wet', s.w === 'storm' && s.rainy, JSON.stringify(s));
    // Snow: the winter and the rain (falling as snow in the race: js/render.js snowy), Snow the one lit, snow falling over the picture; a
    // weather after it: the season it had before
    const wxNow = () => page.evaluate(() => { const st = document.getElementById('menu-host').shadowRoot.querySelector('#track-stage'); return { w: __game.S.weather, season: __game.S.season, snowy: st.classList.contains('snowy'), rainy: st.classList.contains('rainy'), on: st.querySelector('.wxv [aria-pressed="true"]').dataset.act }; });
    await click(page, 'weather:snow'); s = await wxNow();
    T.check('Snow: the season winter and the rain (snow in the race), Snow the one lit, the picture under snow (not rain)', s.w === 'rain' && s.season === 'winter' && s.snowy && !s.rainy && s.on === 'weather:snow', JSON.stringify(s));
    await click(page, 'weather:storm'); s = await wxNow();
    T.check('Storm after Snow: the season as it was before (summer), the storm, wet again', s.w === 'storm' && s.season === 'summer' && s.rainy && !s.snowy && s.on === 'weather:storm', JSON.stringify(s));
    await click(page, 'more-options'); await click(page, 'opt:season:autumn'); await click(page, 'opt:tod:dusk'); await click(page, 'opt:length:short');
    s = await page.evaluate(() => ({ season: __game.S.season, tod: __game.S.tod, length: __game.S.length }));
    T.check('the race options sheet: Autumn, Dusk and a Short race are the game\'s settings', s.season === 'autumn' && s.tod === 'dusk' && s.length === 'short', JSON.stringify(s));
    await done(page);
    await click(page, 'weather:dry'); await click(page, 'more-options'); await click(page, 'opt:season:summer'); await click(page, 'opt:tod:day'); await click(page, 'opt:length:normal'); await done(page);
    // the back arrow: one step back, to the modes (as Escape and the gamepad's B)
    await page.click('.thead [data-act="back"]'); const hm = await ev(page, 'return { scr: Menu.debug().screen, sub: Menu.debug().titleSub, modes: !!root.querySelector("[data-act=\\"mode:race\\"]") };');
    T.check('the back arrow: back to the modes', hm.scr === 'title' && hm.sub === 'single' && hm.modes, JSON.stringify(hm));

    // the credits on the title
    await page.click('.t-subhead [data-act="tsub:"]');
    await click(page, 'credits');
    let c = await ev(page, 'const s = root.querySelector(".sheet.credits"); return s ? s.textContent : "";');
    T.check('Credits: the sheet names the data the pictures of the Earth are made from, and closes', /WorldCover/.test(c) && /Natural Earth/.test(c));
    T.check('Credits: OpenStreetMap (the roads of the tracks; the ODbL asks for it)', /© OpenStreetMap contributors/.test(c) && /Open Database License/.test(c), c.slice(0, 200));
    await done(page);
    T.check('the credits sheet is closed again', !(await ev(page, 'return !!root.querySelector(".sheet");')));

    // a race from the menu (the intro off): the game starts on the chosen track, in the chosen mode, with the chosen laps; then back to the title
    await click(page, 'single'); await click(page, 'mode:race');
    const name = await ev(page, 'return root.querySelector(".where .w2").textContent;');
    await click(page, 'race-single');
    await raceOn(page, 'nring').catch(() => null);
    const r = await page.evaluate(() => ({ id: __game.race && __game.race.track.def.id, laps: __game.race && __game.race.laps, tt: __game.race && !!__game.race.timeTrial, last: __game.S.lastTrack, shown: [...document.querySelectorAll('.screen.show')].map(e => e.id) }));
    T.check(`Race! (${name}, the intro off): the race runs on that track, 1 lap, the menu gone, the track remembered`, r.id === 'nring' && r.laps === 1 && !r.tt && r.last === 'nring' && r.shown.length === 0, JSON.stringify(r));
    await page.evaluate(() => __game.onAction('to-title')); await page.waitForTimeout(500);
    const t = await ev(page, 'return { scr: Menu.debug().screen, sub: Menu.debug().titleSub, shown: [...document.querySelectorAll(".screen.show")].map(e => e.id), race: !!window.__game.race, tile: !!root.querySelector(".t-single") };');
    T.check('after the race: back on the new title', t.scr === 'title' && !t.sub && t.shown.join() === 's-menu' && !t.race && t.tile, JSON.stringify(t));
    const rs = await page.evaluate(() => MenuCar.info());
    T.check('in the race and after it on the title: the car\'s canvas rests (not drawn, its buffers freed)', !rs.on && rs.size[0] === 0, JSON.stringify(rs));
    await click(page, 'single'); await click(page, 'mode:race');
    const ag = await page.waitForFunction(() => MenuCar.info().drawn && MenuCar.info().size[0] > 0, null, { timeout: 60000 }).then(() => page.evaluate(() => MenuCar.info())).catch(() => page.evaluate(() => MenuCar.info()));
    T.check('the track step again: the car drawn again', ag.on && ag.drawn && ag.size[0] > 0, JSON.stringify(ag));
    await page.click('.thead [data-act="back"]'); await click(page, 'tsub:');

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
    T.check('no page errors on the track step, in the weather, the options, the car, the race and the links', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 4b. the row's Opponents (docs/meni-izbira-proge.md, sklop 5): a tap on the number opens the sheet (the number big, the quick picks 0 Trial
  //     .. 100, the slider up to what the track takes, Done); a pick is the game's setting at once and the row's number behind the sheet, the
  //     slider moves it as it goes (the keys too); Pikes Peak takes 28 (its summit's parking: def.maxRivals), its picks past that off; the
  //     choice is the same on the next track (its own most there); a race from the menu with it (the Nordschleife: 12 rivals, 13 cars, its
  //     own 20 not added); the career keeps its own field (no choice); under the track step on a phone the game's demo is not drawn (one
  //     frame a second: Menu.covers), under the title (see-through: the game's scene its background) and on a tablet held upright (the
  //     menu a column) it is
  {
    const { ctx, page, errors } = await open({ track: 'pikes', lastTrack: 'pikes', mode: 'race' });
    await ready(page);
    const demoN = (ms) => page.evaluate(async (ms) => { const a = __game.fr.demo, t0 = performance.now(); await new Promise(r => setTimeout(r, ms)); return { n: __game.fr.demo - a, s: (performance.now() - t0) / 1000, covers: Menu.covers() }; }, ms);
    const dt = await demoN(2600);
    T.check('a phone, the title: the game\'s scene its background, drawn on', !dt.covers && dt.n >= 2 * Math.ceil(dt.s) + 2, JSON.stringify(dt));
    await click(page, 'single'); await click(page, 'mode:race');
    const dm = await demoN(2600);
    T.check('a phone, the track step: the game\'s demo race under it not drawn, one frame a second at most (Menu.covers)', dm.covers && dm.n <= Math.ceil(dm.s) + 1, JSON.stringify(dm));
    const row0 = await ev(page, 'const d = Menu.debug(), o = root.querySelector(".trow .opp"); return { id: d.list[d.trackIdx], txt: o.textContent, btn: !!o.querySelector("button[data-act=\\"riv\\"]"), set: __game.S.rivals };');
    T.check('Pikes Peak in Circuit race: the row\'s Opponents a button (21, the track\'s own: no choice yet)', row0.id === 'pikes' && row0.txt === 'Opponents21' && row0.btn && row0.set === -1, JSON.stringify(row0));
    await click(page, 'riv'); await page.waitForTimeout(300);
    const sh = (extra) => ev(page, 'const s = root.querySelector(".sheet.riv"); if (!s) return null; const r = s.querySelector(".rslide"); return { num: s.querySelector(".rnum b").textContent, sub: s.querySelector(".rnum span").textContent, picks: [...s.querySelectorAll(".rquick button")].map(b => b.textContent + (b.disabled ? "-" : "") + (b.getAttribute("aria-pressed") === "true" ? "*" : "")), max: +r.max, val: +r.value, ends: s.querySelector(".rends").textContent, row: root.querySelector(".trow .opp").textContent, set: __game.S.rivals, done: !!s.querySelector(".go[data-act=\\"close-sheet\\"]") };');
    let o = await sh();
    T.check('the sheet: 21 big, the quick picks 0 Trial, 1, 5, 12, 25 (50 and 100 off: Pikes Peak takes 28), the slider 0..28 at 21, Done',
      o && o.num === '21' && /^21 rivals · 22 cars$/.test(o.sub) && o.picks.join() === '0Trial,1,5,12,25,50-,100-' && o.max === 28 && o.val === 21 && /^028 at most on this road$/.test(o.ends) && o.done, JSON.stringify(o));
    await click(page, 'riv-n:5'); o = await sh();
    T.check('a quick pick (5): the game\'s setting at once, the number, the pick lit, the slider, the row behind the sheet', o.set === 5 && o.num === '5' && o.picks[2] === '5*' && o.val === 5 && o.row === 'Opponents5', JSON.stringify(o));
    await click(page, 'riv-n:0'); o = await sh();
    T.check('0: Trial, alone against the clock', o.set === 0 && o.num === '0' && /^Trial/.test(o.sub) && o.picks[0] === '0Trial*', JSON.stringify(o));
    await page.focus('.sheet .rslide'); await page.keyboard.press('End'); o = await sh();
    T.check('the slider (End): to the most the track takes, 28, the setting with it', o.val === 28 && o.num === '28' && o.set === 28 && o.row === 'Opponents28' && !o.picks.some(p => p.endsWith('*')), JSON.stringify(o));
    await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); o = await sh();
    T.check('the slider (two steps back): 26', o.val === 26 && o.num === '26' && o.set === 26 && o.row === 'Opponents26', JSON.stringify(o));
    await click(page, 'riv-n:12'); await done(page);
    const row1 = await ev(page, 'return { sheet: !!root.querySelector(".sheet"), txt: root.querySelector(".trow .opp").textContent, set: __game.S.rivals };');
    T.check('Done: the sheet gone, the row 12', !row1.sheet && row1.txt === 'Opponents12' && row1.set === 12, JSON.stringify(row1));
    // the next tracks: the same choice (12; the Nordschleife too, whose own field is 99)
    let n = 0, at = '';
    for (; n < 60; n++) { at = await ev(page, 'const d = Menu.debug(); return d.list[d.trackIdx];'); if (at === 'nring') break; await click(page, 'track:1'); }
    const row2 = await ev(page, 'return root.querySelector(".trow .opp").textContent;');
    T.check('the choice on another track too: the Nordschleife (its own 99) with 12', at === 'nring' && row2 === 'Opponents12', JSON.stringify({ at, row2, n }));
    await click(page, 'race-single');
    await raceOn(page, 'nring').catch(() => null);
    const rc = await page.evaluate(() => ({ id: __game.race && __game.race.track.def.id, cars: __game.race && __game.race.cars.length }));
    T.check('a race from the menu with 12 rivals: 13 cars (the Nordschleife\'s own 20 not added)', rc.id === 'nring' && rc.cars === 13, JSON.stringify(rc));
    await page.evaluate(() => __game.onAction('to-title')); await page.waitForTimeout(500);
    // the career: its races keep their own field, the row no choice
    await page.evaluate(() => __game.onAction('career-toggle'));
    await page.evaluate(() => __game.onAction('to-title')); await page.waitForTimeout(400);
    await click(page, 'single'); await click(page, 'mode:race');
    const car = await ev(page, 'const o = root.querySelector(".trow .opp"); return { txt: o.textContent, btn: !!o.querySelector("button"), riv: __game.S.rivals };');
    T.check('the career: the row\'s Opponents the track\'s own field, no choice (no button)', /^Opponents\d+$/.test(car.txt) && car.txt !== 'Opponents12' && !car.btn && car.riv === 12, JSON.stringify(car));
    T.check('no page errors with the opponents\' sheet', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {   // 0 opponents (Trial): the race alone (Montréal: 3 laps), to the finish on the autopilot: Cilj (a tick, no place), no win in the
    //   statistics, no page error (a real circuit: the test tracks, Trois-Rivières before 9. 11. 2026, are behind NEUPORABNO)
    const { ctx, page, errors } = await open({ track: 'montreal', lastTrack: 'montreal', rivals: 0, length: 'normal' });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    const row = await ev(page, 'return root.querySelector(".trow .opp").textContent;');
    await click(page, 'race-single');
    await raceOn(page, 'montreal').catch(() => null);
    const st0 = await page.evaluate(() => ({ cars: __game.race && __game.race.cars.length, laps: __game.race && __game.race.laps, wins: __game.stats.wins || 0, races: __game.stats.races || 0 }));
    const fin = await page.evaluate(async () => { const g = window.__game; for (let k = 0; k < 90 && g.phase !== 'done'; k++) { g.sim(10, true); await new Promise(r => setTimeout(r, 0)); }
      return { phase: g.phase, title: document.getElementById('res-title').textContent, pos: document.getElementById('res-pos').textContent, shown: [...document.querySelectorAll('.screen.show')].map(e => e.id).join(), wins: g.stats.wins || 0, races: g.stats.races || 0 }; });
    T.check('0 opponents: the row 0, the race alone (1 car, 3 laps), home on the autopilot: Cilj with a tick (no place), a race counted, no win',
      row === 'Opponents0' && st0.cars === 1 && st0.laps === 3 && fin.phase === 'done' && fin.title === 'Cilj' && fin.pos === '\u2713' && fin.shown === 's-results' && fin.races === st0.races + 1 && fin.wins === st0.wins, JSON.stringify({ row, st0, fin }));
    T.check('no page errors in a race alone', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {   // a field bigger than the game's own (40 opponents on Montréal): the race starts flying (the column, as the Nordschleife's 100:
    //   a big field's standing start piled up in its first corners with the knocks between cars, game.js newRace flyGo), the player's car
    //   over the line hands it over, the field rolling on 15 s more: no rival standing 3 s on end; no page error
    const { ctx, page, errors } = await open({ track: 'montreal', lastTrack: 'montreal', rivals: 40, length: 'short' });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    const row = await ev(page, 'return root.querySelector(".trow .opp").textContent;');
    await click(page, 'race-single');
    await raceOn(page, 'montreal').catch(() => null);
    const fl = await page.evaluate(async () => { const g = window.__game, r = g.race, st = new Map(), yld = () => new Promise(q => setTimeout(q, 0)); let worst = 0, t = 0, k = 0;
      const o = { cars: r.cars.length, flying: r.opts.flying || 0 };
      for (; t < 40 && (g.phase !== 'racing' || r.flyOn); t += 0.25) { g.sim(0.25, true); if (++k % 8 === 0) await yld(); }
      o.took = +t.toFixed(2); o.flyOn = !!r.flyOn; o.phase = g.phase;
      for (let j = 0; j < 60; j++) { g.sim(0.25, true); for (const c of r.cars) if (!c.isPlayer) { const v = Math.hypot(c.vx, c.vz) < 3 ? (st.get(c) || 0) + 0.25 : 0; st.set(c, v); worst = Math.max(worst, v); } if (j % 8 === 0) await yld(); }
      o.worst = worst; o.dist = Math.round(r.player.dist); return o; });
    T.check('40 opponents on Montréal (more than the game\'s own 21): the row 40, 41 cars from a flying start, the player\'s over the line, then 15 s on: no rival standing 3 s on end',
      row === 'Opponents40' && fl.cars === 41 && fl.flying > 0 && fl.phase === 'racing' && !fl.flyOn && fl.worst < 3 && fl.dist > 0, JSON.stringify({ row, fl }));
    T.check('no page errors in a big field\'s flying start', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {   // a tablet held upright: the menu a column, the game's demo seen at its sides and drawn, on the track step too
    const { ctx, page, errors } = await open({}, { width: 820, height: 1180 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    const dm = await page.evaluate(async () => { const a = __game.fr.demo, t0 = performance.now(); await new Promise(r => setTimeout(r, 2600)); return { n: __game.fr.demo - a, s: (performance.now() - t0) / 1000, covers: Menu.covers() }; });
    T.check('a tablet held upright: the menu a column, the demo at its sides drawn on', !dm.covers && dm.n >= 2 * Math.ceil(dm.s) + 2, JSON.stringify(dm));
    T.check('no page errors on the tablet', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 4c. the quick list (js/menu-izbor.js; docs/meni-izbira-proge.md, sklop 8): the flag in the row opens it over the track step: the
  //     countries by continent A to Z (the shown track's gold), no test tracks; a country's tracks, a track's card (its shape from above,
  //     its facts, the player's best, its heights), Select and Race!; the search (no accents needed) and the filters; the player's marks
  //     (a race's first three places a medal, a track driven a tick, one not driven NEW: in the row too); Back (the phone's: the history;
  //     Esc; the pad's B) a layer down, the cross closes it. NEUPORABNO's sheet (the title's button): the hidden tracks, a test track's
  //     card, Race!
  {
    const recs = { 'spa@cs': { bestLap: 140.21, bestPos: 1 }, 'suzuka@cs': { bestLap: 122.4, bestPos: 2 }, 'nring@cs': { bestLap: 431.5, bestPos: 5 } };
    const { ctx, page, errors } = await open({ track: 'spa', lastTrack: 'spa' }, null, { init: 'localStorage.setItem("tdgp-records", ' + JSON.stringify(JSON.stringify({ tracks: recs })) + ');' });
    const miss = []; page.on('response', (r) => { if (r.status() === 404) miss.push(new URL(r.url()).pathname); });
    await ready(page);
    // (Irohazaka awaits the user's choice (pending: behind NEUPORABNO); here a real track of Japan, the list's one country of two tracks: one
    // track per country (CLAUDE.md) leaves none else. The menu reads the flag as it makes a list, its place stays the hidden tracks' first)
    await page.evaluate(() => { Core.TRACKS.find(d => d.id === 'iroha').pending = false; });
    await click(page, 'single'); await click(page, 'mode:race');
    const IZ = (n) => page.waitForFunction((n) => window.MenuIzbor && (n ? MenuIzbor.isOpen() && MenuIzbor.depth() === n : !MenuIzbor.isOpen() && !document.getElementById('menu-host').shadowRoot.querySelector('.izb')), n, { timeout: 10000 });
    const VIEW = `const q = (s) => root.querySelector(".izb " + s), all = (s) => [...root.querySelectorAll(".izb " + s)], tx = (e) => e ? e.textContent.replace(/\\s+/g, " ").trim() : null;
      const pr = (e) => { const m = e && e.querySelector(".pr"); return m ? m.className.replace("pr ", "") + ":" + m.textContent : ""; };
      return { title: tx(q(".izb-head .t b")), sub: tx(q(".izb-head .t small")), depth: MenuIzbor.depth(), hist: history.state && history.state.nazaj, pad: Menu.padRoot() === q(".izb-sheet"),
        dlg: q(".izb-sheet") && q(".izb-sheet").getAttribute("role") + "/" + q(".izb-sheet").getAttribute("aria-modal"),
        cts: all(".izb-ct").map(e => e.firstChild.textContent), secs: all(".izb-ct").map(e => [...e.nextElementSibling.querySelectorAll(".izb-c")].map(c => c.dataset.c != null ? c.dataset.c : "TEST")), tiles: all(".izb-c").map(e => [e.dataset.c != null ? e.dataset.c : "TEST", +(tx(e.querySelector(".n")) || 1), pr(e.querySelector(".izb-pm")), e.classList.contains("on") ? 1 : 0]),
        rows: all(".izb-t").map(e => [e.dataset.t, pr(e.querySelector(".izb-im")), tx(e.querySelector(".bt")) || "", tx(e.querySelector(".tx small")), !!e.querySelector(".izb-mf"), tx(e.querySelector(".tx em")) || ""]),
        found: tx(q(".izb-sub")), none: tx(q(".izb-none")), chips: all(".izb-chips button[aria-pressed=true]").map(e => e.dataset.f),
        card: q(".izb-tc") ? { shape: q(".izb-shape svg path.r") ? q(".izb-shape svg path.r").getAttribute("d") : q(".izb-shape.pic img") ? "pic" : "", facts: all(".izb-facts > div").map(e => tx(e.querySelector("small")) + ":" + tx(e.querySelector("b"))),
          best: pr(q(".izb-best")) + "|" + tx(q(".izb-best small")) + "|" + tx(q(".izb-best b")), graph: !!q(".izb-hg svg path.l"), btns: all(".izb-btns button").map(tx) } : null };`;
    const view = () => ev(page, VIEW);
    // the row: Spa won (a gold 1 before Best lap, the time), the flag a button
    const r0 = await ev(page, 'const b = root.querySelector(".trow .best"), f = root.querySelector(".trow .flag button"); return { mark: b.querySelector("small .pr") ? b.querySelector("small .pr").className + ":" + b.querySelector("small .pr").textContent : "", best: b.querySelector("b").textContent, flag: f ? f.getAttribute("aria-label") + "|" + f.getAttribute("aria-haspopup") : "", sign: root.querySelector(".yard .sign").dataset.act };');
    T.check('the quick list: the row shows the player\'s best with its mark (Spa won: a gold 1 before Best lap, 02:20.210); the flag and the road sign open the list',
      r0.mark === 'pr gold:1' && r0.best === '02:20.210' && r0.flag === 'Flag of Belgium. Choose a track by country|dialog' && r0.sign === 'izbor', JSON.stringify(r0));
    await page.click('.trow .flag button'); await IZ(1);
    const g = await view();
    const exp = await page.evaluate(() => { const L = Menu.debug().list.map(id => Core.TRACKS.find(d => d.id === id)); return { real: L.filter(d => !d.test).length, test: L.filter(d => d.test).length }; });
    const sub = /^(\d+) countries · (\d+) tracks$/.exec(g.sub || ''), countryTiles = g.tiles.filter(t => t[0] !== 'TEST'), tile = (c) => g.tiles.find(t => t[0] === c) || [];
    T.check('the quick list opened (a dialog; the pad\'s part of the screen; one step in the history): "Choose a country", its countries and the mode\'s real tracks counted',
      g.title === 'Choose a country' && g.dlg === 'dialog/true' && g.pad && g.depth === 1 && g.hist === 1 && !!sub && +sub[1] === countryTiles.length && +sub[2] === exp.real && countryTiles.reduce((a, t) => a + t[1], 0) === exp.real, JSON.stringify({ g: { title: g.title, sub: g.sub, dlg: g.dlg, pad: g.pad, depth: g.depth, hist: g.hist }, exp }));
    const conts = ['Europe', 'North America', 'South America', 'Africa', 'Asia', 'Oceania'];
    const az = g.cts.every((c, i, a) => conts.includes(c) && (!i || conts.indexOf(a[i - 1]) < conts.indexOf(c))) && g.secs.every(n => n.every((c, i) => !i || n[i - 1].localeCompare(c, 'en') < 0));
    T.check('the countries by continent (Europe first, as the mockup), A to Z in each; no test tracks (no For testing tile: they are behind NEUPORABNO)',
      az && g.cts[0] === 'Europe' && !g.cts.includes('For testing') && !g.tiles.some(t => t[0] === 'TEST') && exp.test === 0 && tile('Belgium')[1] === 1 && tile('Japan')[1] >= 2, JSON.stringify({ cts: g.cts, secs: g.secs, tiles: g.tiles.map(t => t[0] + ':' + t[1]) }));
    T.check('the marks on the flags: the shown track\'s country gold (Belgium), its best a gold 1; Japan (Suzuka 2nd) silver; Germany (Nürburg 5th) a tick; a country not driven NEW',
      tile('Belgium')[3] === 1 && g.tiles.filter(t => t[3]).length === 1 && tile('Belgium')[2] === 'gold:1' && tile('Japan')[2] === 'silver:2' && tile('Germany')[2] === 'done:' && tile('Canada')[2] === 'new:NEW', JSON.stringify(g.tiles));
    // a country: its tracks (Japan: Iroha, Suzuka), each with its mark, facts and best; then Suzuka's card
    await page.click('.izb-c[data-c="Japan"]'); await IZ(2);
    const jp = await view(), suz = jp.rows.find(r => r[0] === 'suzuka') || [], iro = jp.rows.find(r => r[0] === 'iroha') || [];
    T.check('a country (Japan): its tracks in the list\'s order, each its mark (Suzuka a silver 2 and its best: 02:02.400, 2nd; Iroha NEW) and facts; two steps in the history',
      jp.title === 'Japan' && jp.sub === jp.rows.length + ' tracks' && jp.rows.length >= 2 && jp.depth === 2 && jp.hist === 2 && suz[1] === 'silver:2' && suz[2] === '02:02.4002nd' && /^\d+\.\d\d km · \d+ corners · Circuit$/.test(suz[3]) && iro[1] === 'new:NEW' && iro[2] === '' && /^\d+\.\d\d km · .+ · Open road$/.test(iro[3]),
      JSON.stringify(jp.rows));
    await page.click('.izb-t[data-t="suzuka"]'); await IZ(3);
    const cd = await view(), km = await page.evaluate(() => (MENU.lens.suzuka / 1000).toFixed(2) + ' km'), nc = await page.evaluate(() => String(MENU.ncorners.suzuka));
    T.check('the track\'s card (Suzuka): the shape from above (a closed line), Length, Corners and Type, the player\'s best (Best lap 02:02.400, 2nd place, silver), the heights, Select and Race!',
      cd.title === 'Suzuka' && cd.sub === 'Japan' && cd.depth === 3 && cd.hist === 3 && !!cd.card && /^M[\d ]+(L[\d ]+){6,}Z$/.test(cd.card.shape) && JSON.stringify(cd.card.facts) === JSON.stringify(['Length:' + km, 'Corners:' + nc, 'Type:Circuit']) &&
      cd.card.best === 'silver:2|Best lap|02:02.4002nd place' && cd.card.graph && JSON.stringify(cd.card.btns) === '["Select","Race!"]', JSON.stringify(cd));
    // Back: the phone's (the history), the pad's B, Esc: a layer down each, the last closes it; the screen behind as it was
    await page.evaluate(() => history.back()); await IZ(2);
    const b1 = await view();
    await page.evaluate(() => Menu.padKey('b')); await IZ(1);
    const b2 = await view();
    await page.keyboard.press('Escape'); await IZ(0);
    const b3 = await page.evaluate(() => ({ hist: history.state && history.state.nazaj, d: Menu.debug(), track: __game.S.track }));
    T.check('Back (the phone\'s) from the card: the country\'s list; the pad\'s B: the countries; Esc: closed, no step of it left in the history; the track step as it was (Spa)',
      b1.title === 'Japan' && b1.rows.length === jp.rows.length && b2.title === 'Choose a country' && b2.tiles.length === g.tiles.length && !b3.hist && b3.d.screen === 'track' && b3.d.list[b3.d.trackIdx] === 'spa' && b3.track === 'spa',
      JSON.stringify({ b1: b1.title, b2: b2.title, b3 }));
    // the search: a place without its accents, a country, two words; its keys stay its own (← does not step the track); the cross clears it
    const at = await ev(page, `const s = root.querySelector(".yard .sign"), r = s.getBoundingClientRect();   // (the sign's part not behind the car)
      for (let y = r.top + 4; y < r.bottom; y += 4) for (let x = r.left + 4; x < r.right; x += 4) { const e = root.elementFromPoint(x, y); if (e && s.contains(e)) return [x, y]; } return null;`);
    if (at) await page.mouse.click(at[0], at[1]); else await page.click('.trow .flag button');
    await IZ(1);
    await page.fill('.izb-q input', 'nurburg'); const s1 = await view();
    await page.press('.izb-q input', 'ArrowLeft'); await page.press('.izb-q input', 'ArrowRight');
    const s1k = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx] + ':' + MenuIzbor.isOpen(); });
    await page.fill('.izb-q input', 'japan'); const s2 = await view();
    await page.fill('.izb-q input', 'spa belg'); const s3 = await view();
    await page.fill('.izb-q input', 'atlantis'); const s4 = await view();
    await page.click('.izb-qx'); const s5 = await view();
    const s5q = await ev(page, 'return root.querySelector(".izb-q input").value;');
    T.check('the search: "nurburg" finds Nürburg (its flag before it), "japan" its tracks, "spa belg" Spa, "atlantis" nothing (No track found); the arrow keys stay the search\'s; the cross clears it, the countries back',
      JSON.stringify(s1.rows.map(r => r[0])) === '["nring"]' && s1.found === '1 track' && s1.rows[0][4] && s1.rows[0][1] === 'done:' && s1k === 'spa:true' && JSON.stringify(s2.rows.map(r => r[0])) === JSON.stringify(jp.rows.map(r => r[0])) &&
      JSON.stringify(s3.rows.map(r => r[0])) === '["spa"]' && !s4.rows.length && /^No track found/.test(s4.none || '') && s5.tiles.length === g.tiles.length && s5q === '', JSON.stringify({ s1: s1.rows, s1k, s2: s2.rows.map(r => r[0]), s3: s3.rows.map(r => r[0]), s4: s4.none, s5: s5.tiles.length }));
    // the filters: only the four categories (Circuit, Open road, Rally, Ice, no length), each a button with its icon; one on (Circuit: the
    // circuits, no test track), two on (either), Rally, Ice (no ice track in the game yet: it says so); all off: the countries again
    const cats = await ev(page, 'return [...root.querySelectorAll(".izb-chips button")].map(e => e.dataset.f + ":" + e.textContent.trim() + ":" + (e.querySelector("svg") ? "icon" : "-"));');
    const want = (types) => page.evaluate((types) => Menu.debug().list.filter(id => {
      const d = Core.TRACKS.find(x => x.id === id), gr = d.ice ? 'ice' : d.test ? 'test' : (d.rally || d.descent && d.timeTrial) ? 'rally' : d.open ? 'road' : 'circuit';   // (as js/menu.js gr: a descent against the clock alone, Katu-Jaryk, is a rally; one with a race and traffic, Sa Calobra, or with rivals, Ngorongoro, an open road)
      return !types.length || types.includes(gr);
    }), types);
    const tap = async (...ks) => { for (const k of ks) await page.click(`.izb-chips [data-f="${k}"]`); return view(); };
    const f1 = await tap('circuit'), w1 = await want(['circuit']);
    const f2 = await tap('road'), w2 = await want(['circuit', 'road']);
    const f3 = await tap('circuit', 'road', 'rally'), w3 = await want(['rally']);
    const f4 = await tap('rally', 'ice'), w4 = await want(['ice']);
    const f6 = await tap('rally'), w6 = await want(['rally', 'ice']);
    const f5 = await tap('rally', 'ice');
    const ids = (v) => JSON.stringify(v.rows.map(r => r[0]));
    // a category with no track in the list says "No <it> tracks here." ("yet" would be false: a mode's list can lack rally tracks the game has)
    T.check('the filters: four buttons Circuit, Open road, Rally, Ice, each with an icon (no length filter); Circuit the circuits (no test track), Circuit and Open road either, Rally, Ice says "No ice tracks here." (no ice track in the game), Rally and Ice either, all off the countries again',
      JSON.stringify(cats) === '["circuit:Circuit:icon","road:Open road:icon","rally:Rally:icon","ice:Ice:icon"]' && JSON.stringify(f1.chips) === '["circuit"]' && ids(f1) === JSON.stringify(w1) && w1.length >= 3 && f1.rows.every(r => r[5] !== 'TEST') &&
      ids(f2) === JSON.stringify(w2) && w2.length > w1.length && JSON.stringify(f3.chips) === '["rally"]' && (w3.length ? ids(f3) === JSON.stringify(w3) : !f3.rows.length && f3.none === 'No rally tracks here.') &&
      JSON.stringify(f4.chips) === '["ice"]' && !w4.length && !f4.rows.length && f4.none === 'No ice tracks here.' &&
      JSON.stringify(f6.chips) === '["rally","ice"]' && (w6.length ? ids(f6) === JSON.stringify(w6) : !f6.rows.length && f6.none === 'No rally or ice tracks here.') && !f5.chips.length && f5.tiles.length === g.tiles.length,
      JSON.stringify({ cats, f1: f1.rows.map(r => r[0]), f2: f2.rows.length, f3: f3.rows.map(r => r[0]), f3n: f3.none, f4n: f4.none, f6: f6.rows.map(r => r[0]), f6n: f6.none, f5: f5.tiles.length }));
    // an ice track (def.ice; none in the game yet, so Nürburg's flag is set here and the list opened again): Ice finds it alone, its type is
    // "Ice", Circuit does not, a search finds it without a filter as before; the flag off again, the list as the next steps expect it
    await page.evaluate(() => { Core.TRACKS.find(x => x.id === 'nring').ice = true; MenuIzbor.close(true); });
    await page.waitForFunction(() => !(history.state && history.state.nazaj), null, { timeout: 5000 }).catch(() => null);
    await page.click('.trow .flag button'); await IZ(1);
    const i1 = await tap('ice'), i2 = await tap('ice', 'circuit');
    await tap('circuit'); await page.fill('.izb-q input', 'nurburg'); const i3 = await view(); await page.click('.izb-qx');
    await page.evaluate(() => { delete Core.TRACKS.find(x => x.id === 'nring').ice; });
    T.check('an ice track (Nürburg flagged): Ice finds it alone (its type "Ice"), Circuit does not, the search "nurburg" finds it without a filter',
      JSON.stringify(i1.rows.map(r => r[0])) === '["nring"]' && / · Ice$/.test(i1.rows[0][3]) && !i1.none && !i2.rows.some(r => r[0] === 'nring') && i2.rows.length >= 3 && JSON.stringify(i3.rows.map(r => r[0])) === '["nring"]',
      JSON.stringify({ i1: i1.rows.map(r => r.slice(0, 4)), i2: i2.rows.length, i3: i3.rows.map(r => r[0]) }));
    // Select: a country of several tracks (Japan, Irohazaka shown as real above), a track's card, Select: the screen goes to it, the list
    // closed and its steps gone
    const several = (countryTiles.find(t => t[1] >= 2) || [])[0];
    await page.click(`.izb-c[data-c="${several}"]`); await IZ(2);
    const ca = await view(), pickId = ca.rows.map(r => r[0]).find(id => id !== 'spa');
    await page.click(`.izb-t[data-t="${pickId}"]`); await IZ(3);
    const pc = await view();
    await page.click('.izb-sel'); await IZ(0);
    await page.waitForFunction(() => !(history.state && history.state.nazaj), null, { timeout: 5000 }).catch(() => null);
    const sel = await ev(page, 'const d = Menu.debug(); return { id: d.list[d.trackIdx], track: __game.S.track, head: root.querySelector(".where .w2").textContent, hist: history.state && history.state.nazaj };');
    T.check(`Select (${several}, ${pickId}): the track step goes to it (its name in the head, the game's track), the list closed, no step of it left in the history`,
      ca.title === several && ca.rows.length >= 2 && pc.title === sel.head && sel.id === pickId && sel.track === pickId && !sel.hist, JSON.stringify({ ca: ca.rows.map(r => r[0]), pc: pc.title, sel }));
    // a country of one track (Belgium) opens its card at once; Back: the countries
    await page.click('.trow .flag button'); await IZ(1);
    await page.click('.izb-c[data-c="Belgium"]'); await IZ(2);
    const be = await view();
    await page.click('.izb-head [data-back]'); await IZ(1);
    const be2 = await view();
    T.check('a country of one track (Belgium): its card at once (Spa: a gold 1, Best lap 02:20.210, 1st place); the head\'s back arrow: the countries',
      be.title === 'Spa' && be.sub === 'Belgium' && !!be.card && be.card.best === 'gold:1|Best lap|02:20.2101st place' && be2.title === 'Choose a country', JSON.stringify({ be: be.title, best: be.card && be.card.best, be2: be2.title }));
    // NEUPORABNO (the title's button): its sheet (no countries): NEW VERSION · TEST 1, MISSIONS and CUPS on top, then the tracks awaiting the
    // user's choice (PENDING) and the test tracks (TEST), each its row; a test track's card (its picture, no shape); Race! starts its race at once
    await page.evaluate(() => { Core.TRACKS.find(d => d.id === 'iroha').pending = true; });   // (awaiting the choice again, as in the game)
    await page.keyboard.press('Escape'); await IZ(0);
    await page.click('.thead [data-act="back"]'); await click(page, 'tsub:');
    await page.click('[data-act="nu"] >> visible=true'); await IZ(1);
    const tl = await view(), nx = await ev(page, 'const s = root.querySelector(".izb-sheet"); return { nu: !!s && s.classList.contains("nu"), label: s && s.getAttribute("aria-label"), top: [...root.querySelectorAll(".izb-nu [data-act]")].map(e => e.dataset.act), cts: [...root.querySelectorAll(".izb .izb-ct")].map(e => e.firstChild.textContent), cups: (root.querySelector(".nu-bar.cup small") || {}).textContent || "" };');
    const ne = await page.evaluate(() => { const ds = Menu.debug().tracks.map(id => Core.TRACKS.find(d => d.id === id)); return { p: ds.filter(d => d.pending && !d.test).map(d => d.id), t: ds.filter(d => d.test).map(d => d.id) }; });
    T.check(`NEUPORABNO's sheet: NEW VERSION · TEST 1, MISSIONS, CUPS (Home Cup · Short tracks) on top; then the tracks awaiting the choice (${ne.p.length}, PENDING) and the test tracks (${ne.t.length}, TEST), no countries`,
      tl.title === 'NEUPORABNO' && tl.sub === [ne.p.length ? ne.p.length + ' pending' : '', ne.t.length + ' test', 'not in version 1.0'].filter(Boolean).join(' · ') && nx.nu && /NEUPORABNO/.test(nx.label) && tl.depth === 1 &&
      JSON.stringify(nx.top) === '["newver","game:to-missions","game:to-champ-nu"]' && nx.cups === 'Home Cup · Short tracks' && JSON.stringify(nx.cts) === JSON.stringify((ne.p.length ? ['Pending · one per country stays'] : []).concat(['Test · to be removed'])) &&
      JSON.stringify(tl.rows.map(r => r[0])) === JSON.stringify(ne.p.concat(ne.t)) && tl.rows.every(r => r[5] === (ne.t.includes(r[0]) ? 'TEST' : 'PENDING')) && !tl.tiles.length && ne.t.includes('jezero'),
      JSON.stringify({ title: tl.title, sub: tl.sub, nx, rows: tl.rows.map(r => r[0] + ':' + r[5]) }));
    await page.click('.izb-t[data-t="jezero"]'); await IZ(2);
    const jz = await view();
    T.check('a test track\'s card behind NEUPORABNO (Jezero: its picture, no shape; TEST in the head; Select and Race!)', / · TEST$/.test(jz.sub) && jz.card && jz.card.shape === 'pic' && JSON.stringify(jz.card.btns) === '["Select","Race!"]',
      JSON.stringify({ jz: jz.sub, card: jz.card }));
    await page.click('.izb-race');
    let raced = true; await raceOn(page, 'jezero').catch(async () => { raced = false; console.log('  (the page:', JSON.stringify(await pageState(page)) + ')'); });
    const rc = await page.evaluate(() => ({ open: MenuIzbor.isOpen(), covers: Menu.covers(), hist: history.state && history.state.nazaj }));
    T.check('Race! on the card: the race on that track (Jezero) at once, the quick list gone with its steps in the history', raced && !rc.open && !rc.hist, JSON.stringify(rc));
    // (Vršič, a test track frozen since 6. 11. 2026, has no model picture: its row shows its flyover's instead; the browser logs the miss)
    const errs = real(errors).filter(e => !/Failed to load resource: the server responded with a status of 404/.test(e)), n404 = real(errors).length - errs.length;
    T.check('the quick list: no page errors (the only picture missing Vršič\'s, a frozen test track: its flyover shown)', !errs.length && miss.every(p => p === '/assets/tracks/vrsic.webp') && n404 <= miss.length, errs.concat(miss).join(' | '));
    await ctx.close();
  }

  // 4d. the Earth (js/menu-zemlja.js; docs/meni-izbira-proge.md, sklop 9): the globe in the head opens it over the track step: turned to
  //     the track shown, a pin per track in the colour of the player's progress, from afar the countries named, close in the tracks (none
  //     over another, over a pin, the buttons or the card); a country's card (its tracks), a track's card (Select, Race!), also from a pin;
  //     Back (the phone's: the history; the pad's B; Esc) a layer down; drag, zoom, the arrows and the target; it draws only while something
  //     moves, the screen under it rests; all of it in daylight, the moon shows the night where it is now (the Sun overhead there; the
  //     head's globe too, which turns to the next track's country)
  // (the Earth at rest: loaded, drawn, nothing moving; with the motion reduced two frames may be all)
  const zem = (page, n) => page.waitForFunction((n) => window.MenuZemlja && (n ? MenuZemlja.isOpen() && MenuZemlja.depth() === n && MenuZemlja._R() && MenuZemlja._R().n > 0 && !MenuZemlja._R().moving && !document.getElementById('menu-host').shadowRoot.querySelector('.zem-load')
    : !MenuZemlja.isOpen() && !document.getElementById('menu-host').shadowRoot.querySelector('.zem')), n, { timeout: 20000 });
  const EARTH = `const z = root.querySelector(".zem"), R = MenuZemlja._R(), tx = (e) => e ? e.textContent.replace(/\\s+/g, " ").trim() : null, rc = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
    const k = z && z.querySelector(".zem-card.on"), pr = (e) => { const m = e && e.querySelector(".pr"); return m ? m.className.replace("pr ", "") + ":" + m.textContent : ""; };
    return { R, depth: MenuZemlja.depth(), hist: history.state && history.state.nazaj, pad: !!z && Menu.padRoot() === z, dlg: z && z.getAttribute("role") + "/" + z.getAttribute("aria-modal"), title: z && tx(z.querySelector(".zem-title b")) + "|" + tx(z.querySelector(".zem-title small")),
      names: z ? [...z.querySelectorAll(".zl:not(.off)")].filter(e => +e.style.opacity > 0.5).map(e => ({ c: e.dataset.c || "", t: e.dataset.t || "", cur: e.classList.contains("cur"), r: rc(e) })) : [],
      pins: z ? [...z.querySelectorAll(".zp")].map(e => e.dataset.t + ":" + e.className.replace(/^zp ?/, "")) : [], pn: z ? [...z.querySelectorAll(".zp")].filter(e => +e.style.opacity > 0.3).map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, e.classList.contains("cur")]; }) : [], ui: z ? [...z.querySelectorAll(".zem-sq")].map(rc) : [], W: innerWidth, H: innerHeight,
      card: k ? { r: rc(k), title: tx(k.querySelector(".izb-head .t b")), sub: tx(k.querySelector(".izb-head .t small")), rows: [...k.querySelectorAll(".izb-t")].map(e => e.dataset.t + ":" + pr(e.querySelector(".izb-im"))),
        best: k.querySelector(".izb-best") ? pr(k.querySelector(".izb-best")) + "|" + tx(k.querySelector(".izb-best b")) : "", body: k.querySelector(".izb-body") ? rc(k.querySelector(".izb-body")) : null, btns: [...k.querySelectorAll(".izb-btns button")].map(e => [tx(e)].concat(rc(e))) } : null,
      moon: z && z.querySelector(".zem-night") ? z.querySelector(".zem-night").getAttribute("aria-pressed") : null, rested: !!root.querySelector("#s-track.rested"), car: window.MenuCar ? MenuCar.info().on : null };`;
  // (no name over another, a button or the card; close in no track's name over a pin (the track shown's own aside), from afar no country's
  // over the track shown's pin; all inside the screen)
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const clean = (v) => v.names.every((a, i) => v.names.every((b, j) => i === j || !hit(a.r, b.r)) && v.ui.every(u => !hit(a.r, u)) && !(v.card && hit(a.r, v.card.r)) && a.r[0] >= 0 && a.r[2] <= v.W && a.r[1] >= 0 && a.r[3] <= v.H &&
    v.pn.every(p => a.cur || (a.c && !p[2]) || !hit(a.r, [p[0] - 7, p[1] - 7, p[0] + 7, p[1] + 7])));
  const wrap = (a) => ((a + 180) % 360 + 360) % 360 - 180;
  {
    const recs = { 'spa@cs': { bestLap: 140.21, bestPos: 1 }, 'suzuka@cs': { bestLap: 122.4, bestPos: 2 }, 'nring@cs': { bestLap: 431.5, bestPos: 5 } };
    const { ctx, page, errors } = await open({ track: 'spa', lastTrack: 'spa' }, null, { init: 'localStorage.setItem("tdgp-records", ' + JSON.stringify(JSON.stringify({ tracks: recs })) + ');' });
    await ready(page);
    await page.evaluate(() => { Core.TRACKS.find(d => d.id === 'iroha').pending = false; });   // (as in the quick list above: Irohazaka a real track of Japan here)
    await click(page, 'single'); await click(page, 'mode:race');
    const earth = () => ev(page, EARTH);
    const place = (id) => page.evaluate((id) => { const p = (MENU.globe.places || {})[id], g = GEO.tracks[id]; return p || (g ? [g.lat0, g.lon0] : null); }, id);
    const gl = await ev(page, 'const b = root.querySelector(".thead .globe"); return b && { tag: b.tagName, act: b.dataset.act, pop: b.getAttribute("aria-haspopup"), label: b.getAttribute("aria-label") };');
    T.check('the globe in the head is a button: the Earth (a dialog)', gl && gl.tag === 'BUTTON' && gl.act === 'zemlja' && gl.pop === 'dialog' && gl.label === 'The world: choose a track on the Earth', JSON.stringify(gl));
    await page.click('.thead .globe'); await zem(page, 1);
    await page.waitForTimeout(800);   // (grown over the screen: the screen under it rests)
    const e1 = await earth(), spa = await place('spa');
    const nReal = await page.evaluate(() => Menu.debug().list.filter(id => !Core.TRACKS.find(d => d.id === id).test).length);
    T.check(`the Earth opened (a dialog; the pad's part of the screen; one step in the history): WORLD, the mode's ${nReal} real tracks in their countries, turned to the track shown (Spa) from afar; the whole Earth's picture (4096 × 2048); all of it in daylight (the moon off); the screen under it resting (not drawn, the car still)`,
      e1.dlg === 'dialog/true' && e1.R.night === false && e1.R.nt === 0 && e1.moon === 'false' && e1.pad && e1.depth === 1 && e1.hist === 1 && e1.title === `WORLD|${nReal} tracks · ${e1.R.countries.length} countries` && e1.R.pins === nReal && ['Belgium', 'Germany', 'Japan'].every(c => e1.R.countries.includes(c)) &&
      Math.abs(e1.R.lat - spa[0]) < 0.3 && Math.abs(wrap(e1.R.lon - spa[1])) < 0.3 && Math.abs(e1.R.d - 3.7) < 0.01 && e1.R.tex === 'assets/geo/earth.webp' && e1.R.size.join() === '4096,2048' && !e1.R.weak && e1.rested && e1.car === false,
      JSON.stringify(Object.assign({}, e1, { names: e1.names.length, pins: e1.pins.length })));
    T.check('the pins in the colours of the player\'s progress (Spa won: gold, the track shown; Suzuka 2nd: silver; Nürburg 5th: a tick\'s green; the rest NEW); from afar the countries named (Belgium the shown one\'s), none over another or a button, none over the shown one\'s pin',
      e1.pins.includes('spa:gold cur') && e1.pins.includes('suzuka:silver') && e1.pins.includes('nring:done') && e1.pins.filter(p => /:new$/.test(p)).length >= 5 && e1.names.length >= 2 && e1.names.every(n => n.c && !n.t) && e1.names.some(n => n.c === 'Belgium' && n.cur) && clean(e1),
      JSON.stringify({ pins: e1.pins, names: e1.names.map(n => n.c + (n.cur ? '*' : '')) }));
    const n0 = e1.R.n; await page.waitForTimeout(600); const n1 = await page.evaluate(() => MenuZemlja._R().n);
    const sun = await page.evaluate(() => { const s = MenuZemlja.sun(), v = MenuZemlja._R().sun, p = (s[1] + 180) * Math.PI / 180, t = (90 - s[0]) * Math.PI / 180;
      return [MenuZemlja.sun(new Date(Date.UTC(2026, 5, 21, 12))), MenuZemlja.sun(new Date(Date.UTC(2026, 11, 21, 18))), Math.hypot(v[0] + Math.cos(p) * Math.sin(t), v[1] - Math.cos(t), v[2] - Math.sin(p) * Math.sin(t))]; });
    T.check('nothing moving: no frames drawn; the Sun overhead at the tropic of Cancer at noon UTC on 21 June (near 0°), at the tropic of Capricorn at 18 h UTC on 21 December (near 90° W); the Earth\'s night side from where it is now',
      n1 === n0 && !e1.R.moving && Math.abs(sun[0][0] - 23.44) < 0.5 && Math.abs(sun[0][1]) < 1.5 && Math.abs(sun[1][0] + 23.44) < 0.5 && Math.abs(sun[1][1] + 90) < 1.5 && sun[2] < 0.01, JSON.stringify({ n0, n1, sun }));
    // a country's name pressed (a key, the pad): its card with its tracks, the Earth turned to it, closer; close in, the tracks named
    await ev(page, 'root.querySelector(".zl.c[data-c=\\"Japan\\"]").click();'); await zem(page, 2);
    const e2 = await earth();
    T.check('a country (Japan): its card (its tracks in the list\'s order, each its mark: Suzuka a silver 2, Iroha NEW), the Earth turned to it and closer, the tracks named there (not over the card); two steps in the history',
      e2.R.sel === 'Japan' && e2.card && e2.card.title === 'Japan' && e2.card.sub === e2.card.rows.length + ' tracks' && e2.card.rows.includes('suzuka:silver:2') && e2.card.rows.includes('iroha:new:NEW') && e2.depth === 2 && e2.hist === 2 &&
      e2.R.lat > 30 && e2.R.lat < 40 && e2.R.lon > 130 && e2.R.lon < 142 && e2.R.d < 2.75 && e2.names.length >= 1 && e2.names.every(n => n.t) && clean(e2), JSON.stringify({ R: e2.R, card: e2.card, names: e2.names.map(n => n.t) }));
    await page.click('.zem-card .izb-t[data-t="suzuka"]'); await zem(page, 3);
    const e3 = await earth();
    T.check('a track\'s row: its card (Suzuka: the best, silver, Select and Race!); three steps in the history; still the pad\'s part of the screen',
      e3.R.tc === 'suzuka' && e3.card && e3.card.title === 'Suzuka' && e3.card.sub === 'Japan' && e3.card.best === 'silver:2|02:02.4002nd place' && JSON.stringify(e3.card.btns.map(b => b[0])) === '["Select","Race!"]' && e3.depth === 3 && e3.hist === 3 && e3.pad, JSON.stringify(e3.card));
    // Back: the phone's (the history), the pad's B, Esc: a layer down each, the last closes it; the screen moves again
    await page.evaluate(() => history.back()); await zem(page, 2);
    const b1 = await earth();
    await page.evaluate(() => Menu.padKey('b')); await zem(page, 1);
    const b2 = await earth();
    await page.keyboard.press('Escape'); await zem(page, 0);
    await page.waitForFunction(() => window.MenuCar && MenuCar.info().on, null, { timeout: 10000 }).catch(() => null);
    const b3 = await ev(page, 'const d = Menu.debug(); return { hist: history.state && history.state.nazaj, id: d.list[d.trackIdx], rested: !!root.querySelector("#s-track.rested"), car: MenuCar.info().on };');
    T.check('Back (the phone\'s) from the track\'s card: the country\'s; the pad\'s B: the Earth alone (no country chosen); Esc: closed, no step of it left in the history; the screen under it moving again (the car), still on Spa',
      b1.card && b1.card.title === 'Japan' && !b1.R.tc && b2.R && !b2.card && !b2.R.sel && !b3.hist && b3.id === 'spa' && !b3.rested && b3.car, JSON.stringify({ b1: b1.card && b1.card.title, b2: b2.R && b2.R.sel, b3 }));
    // a pin tapped (Bâlea): its track's card at once; the card's cross: the Earth alone. (Marrakesh until 9. 11. 2026: awaiting the user's
    // choice (pending), behind NEUPORABNO, not on this Earth)
    await page.click('.thead .globe'); await zem(page, 1);
    // (a pin on top at its own place, Bâlea's if it is: from afar a country's name can lie over a pin and take the tap, as Albania's over Bâlea's since the new tracks, 11. 11. 2026)
    const pin = await ev(page, 'const on = (e) => { const r = e.getBoundingClientRect(), t = root.elementsFromPoint(r.left, r.top)[0]; return !!t && e.contains(t); }, ps = [...root.querySelectorAll(".zp")].filter(e => +e.style.opacity > 0.5 && on(e)), p = ps.find(e => e.dataset.t === "balea") || ps[0], r = p.getBoundingClientRect(); return [r.left, r.top, p.dataset.t];');
    await page.mouse.click(pin[0], pin[1]); await zem(page, 3);
    const p1 = await earth();
    await page.click('.zem-card [data-x]'); await zem(page, 1);
    const p2 = await earth();
    T.check(`a pin tapped (${pin[2]}): its track's card at once (its country chosen, three steps); the card's cross: the Earth alone again`, p1.R.tc === pin[2] && !!p1.R.sel && (pin[2] !== 'balea' || p1.R.sel === 'Romania') && p1.card && p1.card.sub === p1.R.sel && !p2.card && !p2.R.sel && p2.depth === 1,
      JSON.stringify({ p1: [p1.R.tc, p1.R.sel, p1.card && p1.card.title, p1.card && p1.card.sub], p2: [p2.R.sel, p2.depth, !!p2.card] }));
    // + and − come closer (the tracks named) and go back; a drag turns it (east under a finger moving west) and it glides a little after;
    // the arrows turn it; the target: back to the track shown, its country's card
    await page.click('.zem-in'); await zem(page, 1); const z1 = await earth();
    await page.click('.zem-out'); await zem(page, 1); const z2 = await earth();
    const c = await ev(page, 'const r = root.querySelector(".zem").getBoundingClientRect(), R = MenuZemlja._R(); return [r.left + r.width / 2, r.top + (R.TOP + r.height) / 2, R.lon];');
    await page.mouse.move(c[0] + 60, c[1]); await page.mouse.down();
    for (let k = 1; k <= 8; k++) { await page.mouse.move(c[0] + 60 - k * 15, c[1]); await page.waitForTimeout(16); }
    await page.mouse.up(); await zem(page, 1);
    const dr = await earth();
    await page.keyboard.press('ArrowRight'); await zem(page, 1); const k1 = await earth();
    await page.click('.zem-home'); await zem(page, 2); const h1 = await earth();
    const dlon = wrap(dr.R.lon - c[2]);
    T.check('+ closer (the tracks named), − back; a drag west turns it east (and on a little after the finger); → turns it 20° east; the target: back to Spa, Belgium\'s card; the track step not changed by the keys',
      Math.abs(z1.R.d - Math.max(1.5, p2.R.d / 1.45)) < 0.02 && z1.names.length && z1.names.every(n => n.t) && Math.abs(z2.R.d - z1.R.d * 1.45) < 0.02 && dlon > 5 && Math.abs(wrap(k1.R.lon - dr.R.lon) - 20) < 0.5 &&
      h1.R.sel === 'Belgium' && h1.card && h1.card.title === 'Belgium' && Math.abs(h1.R.lat - spa[0]) < 0.3 && Math.abs(wrap(h1.R.lon - spa[1])) < 0.3 && (await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; })) === 'spa',
      JSON.stringify({ d0: p2.R.d, z1: z1.R.d, z1n: z1.names.map(n => n.t), z2: z2.R.d, dlon, k: wrap(k1.R.lon - dr.R.lon), h1: [h1.R.sel, h1.R.lat, h1.R.lon] }));
    // Select on a track's card (Japan, Suzuka): the track step goes to it under the Earth going back into the globe, which turns to Japan
    await ev(page, 'root.querySelector(".zl.c[data-c=\\"Japan\\"]").click();'); await zem(page, 2);
    await page.click('.zem-card .izb-t[data-t="suzuka"]'); await zem(page, 3);
    await page.click('.zem-card .izb-sel');
    const turned = await page.waitForFunction(() => Menu.debug().globe.turning, null, { timeout: 5000, polling: 'raf' }).then(() => true).catch(() => false);
    await zem(page, 0);
    await page.waitForFunction(() => !Menu.debug().globe.turning, null, { timeout: 10000 }).catch(() => null);
    const sel = await ev(page, 'const d = Menu.debug(), c = root.querySelector(".thead .globe canvas"); return { id: d.list[d.trackIdx], track: __game.S.track, head: root.querySelector(".where .w2").textContent, hist: history.state && history.state.nazaj, g: d.globe, country: c && c.dataset.country, S: c && c.width };');
    const suz = await place('suzuka');
    T.check('Select on the Earth (Suzuka): the track step goes to it, the Earth gone with its steps in the history; the head\'s globe turned to Japan (from Belgium, along the way)',
      sel.id === 'suzuka' && sel.track === 'suzuka' && sel.head === 'Suzuka' && !sel.hist && turned && !sel.g.turning && Math.abs(sel.g.at[0] - suz[0]) < 0.05 && Math.abs(wrap(sel.g.at[1] - suz[1])) < 0.05 && sel.country === 'Japan' && sel.S >= 104, JSON.stringify({ sel, turned, suz }));
    // the head's globe in daylight (the Sun set over the next track's antipode: no night on it); the moon switched on the Earth (the night
    // there, remembered): the same globe darker at once; then the next track's at night, the one after it by day (their globes not drawn yet)
    await page.evaluate(() => { const s0 = MenuZemlja.sun; MenuZemlja.sun = (t) => { if (t || !window.__sun) return s0(t); const d = Menu.debug(), id = d.list[d.trackIdx], g = GEO.tracks[id], p = (MENU.globe.places || {})[id] || (g ? [g.lat0, g.lon0] : [0, 0]); return window.__sun === 'day' ? p : [-p[0], p[1] > 0 ? p[1] - 180 : p[1] + 180]; }; });
    const DISK = 'const c = root.querySelector(".thead .globe canvas"), S = c.width, d = c.getContext("2d").getImageData(0, 0, S, S).data; let n = 0, r = 0, g = 0, b = 0;' +
      'for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = x + 0.5 - S / 2, dy = y + 0.5 - S / 2; if (dx * dx + dy * dy > (S * 0.42) ** 2) continue; const i = (y * S + x) * 4; if (d[i] > 150 && d[i] - d[i + 2] > 60) continue; n++; r += d[i]; g += d[i + 1]; b += d[i + 2]; }' +
      'return { S, n, rgb: [r / n, g / n, b / n].map(Math.round), country: c.dataset.country };';
    const steady = () => page.waitForFunction(() => !Menu.debug().globe.turning && document.getElementById('menu-host').shadowRoot.querySelector('.thead .globe canvas').width >= 104, null, { timeout: 10000 }).catch(() => null);
    const lit = async (when) => { await page.evaluate((w) => { window.__sun = w; }, when); await click(page, 'track:1'); await steady(); return ev(page, DISK); };
    const sum = (v) => v.rgb[0] + v.rgb[1] + v.rgb[2];
    const d0 = await lit('night');
    await page.click('.thead .globe'); await zem(page, 1);
    await page.click('.zem-night');
    await page.waitForFunction(() => MenuZemlja._R().nt === 1 && !MenuZemlja._R().moving, null, { timeout: 10000 }).catch(() => null);
    const mo = await ev(page, 'const R = MenuZemlja._R(); return { night: R.night, nt: R.nt, pressed: root.querySelector(".zem-night").getAttribute("aria-pressed"), kept: localStorage.getItem("tdgp-zemlja-noc") };');
    await page.keyboard.press('Escape'); await zem(page, 0); await steady();
    const d1 = await ev(page, DISK);
    T.check('all in daylight until the moon is on: the head\'s globe as bright with the Sun over the other side of the Earth; the moon pressed on the Earth: the night there (remembered), the head\'s globe darker as the Earth closes',
      d0.n > 500 && d1.n > 500 && d1.country === d0.country && sum(d1) < 0.5 * sum(d0) && mo.night === true && mo.nt === 1 && mo.pressed === 'true' && mo.kept === 'on', JSON.stringify({ d0, mo, d1 }));
    const nt = await lit('night'), dy = await lit('day');
    await page.evaluate(() => { window.__sun = null; });
    T.check('the head\'s globe with the moon on: its night side darker and bluer (the Sun over the other side of the Earth) than by day (the Sun over the track)', nt.n > 500 && dy.n > 500 && sum(nt) < 0.5 * sum(dy) && nt.rgb[2] / Math.max(1, nt.rgb[0]) > dy.rgb[2] / Math.max(1, dy.rgb[0]), JSON.stringify({ nt, dy }));
    // Race! on the Earth's card: the race on that track at once, the Earth gone with its steps in the history
    await page.click('.thead .globe'); await zem(page, 1);
    await ev(page, 'root.querySelector(".zl.c[data-c=\\"Belgium\\"]").click();'); await zem(page, 2);
    await page.click('.zem-card .izb-t[data-t="spa"]'); await zem(page, 3);
    await page.click('.zem-card .izb-race');
    let raced = true; await raceOn(page, 'spa').catch(async () => { raced = false; console.log('  (the page:', JSON.stringify(await pageState(page)) + ')'); });
    const rc = await page.evaluate(() => ({ open: MenuZemlja.isOpen(), covers: Menu.covers(), hist: history.state && history.state.nazaj }));
    T.check('Race! on the Earth\'s card: the race on that track (Spa) at once, the Earth gone with its steps in the history', raced && !rc.open && !rc.hist, JSON.stringify(rc));
    T.check('the Earth: no page errors', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 4e. a weak phone (navigator.deviceMemory 4 GB or less): the Earth's half-size picture (2048 × 1024); no WebGL for the Earth: the
  //     quick list instead
  {
    const { ctx, page, errors } = await open({ track: 'spa', lastTrack: 'spa' }, null, { init: 'Object.defineProperty(Navigator.prototype, "deviceMemory", { get: () => 2, configurable: true });' });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    await page.click('.thead .globe'); await zem(page, 1);
    const w1 = await page.evaluate(() => MenuZemlja._R());
    await page.keyboard.press('Escape'); await zem(page, 0);
    T.check('a weak phone: the Earth\'s half-size picture (assets/geo/earth2k.webp, 2048 × 1024)', w1.weak && w1.tex === 'assets/geo/earth2k.webp' && w1.size.join() === '2048,1024', JSON.stringify(w1));
    await page.evaluate(() => { const g0 = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, a) { return this.parentNode && this.parentNode.classList && this.parentNode.classList.contains('zem') && /webgl/.test(t) ? null : g0.call(this, t, a); }; });
    await page.click('.thead .globe');
    await page.waitForFunction(() => window.MenuIzbor && MenuIzbor.isOpen() && MenuIzbor.depth() === 1 && history.state && history.state.nazaj === 1, null, { timeout: 10000 }).catch(() => null);
    const f = await ev(page, 'return { iz: MenuIzbor.isOpen(), ze: MenuZemlja.isOpen(), zem: !!root.querySelector(".zem"), depth: MenuIzbor.depth() + MenuZemlja.depth(), hist: history.state && history.state.nazaj, title: root.querySelector(".izb-head .t b").textContent };');
    T.check('no WebGL for the Earth: the quick list instead (Choose a country), one step in the history', f.iz && !f.ze && !f.zem && f.depth === 1 && f.hist === 1 && f.title === 'Choose a country', JSON.stringify(f));
    T.check('the weak phone\'s Earth, no WebGL for it: no page errors', !real(errors).filter(e => !/WebGL/.test(e)).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 4f. the road sign and the car in the yard (js/menu-tabla.js, js/menu-car.js; docs/meni-izbira-proge.md, sklop 11): each country's
  //     sign in its own style (Germany the yellow town sign with its black frame, the name in its middle, worn; Japan two lines, 日本 over
  //     Japan; Italy the blue pointed blade; a country without one of its own the menu's plain blue sign); a truck over the sign's left part:
  //     the name right of it; the car's shadow on the floor (its four tyres, left of the car in the sun, under it in the rain, bluish on
  //     snow); upright a neighbour tapped: the old screen fades while its sign and car go out to one side, the new ones come in from the
  //     other (the car 60 ms after the sign, its shadow when it stands); the quick list opened ends it at once; nothing of it for a device
  //     that asks for less motion
  {
    const { ctx, page, errors } = await open({ track: 'nring', lastTrack: 'nring' });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    await page.waitForFunction(() => window.MenuCar && MenuCar.info().drawn && MenuCar.info().shadow, null, { timeout: 60000 }).catch(() => null);
    const sign = () => ev(page, 'const s = root.querySelector("#s-track .yard .sign"), d = Menu.debug(); return Object.assign(MenuTabla.info(s), { country: s.dataset.country, clip: s.style.clipPath, id: d.list[d.trackIdx] });');
    const de = await sign();
    T.check('the road sign in its country\'s style (Germany: the yellow town sign with its black frame), GERMANY about in its middle, clear of the car before it, on the sign, worn',
      de.id === 'nring' && de.key === 'Germany' && de.country === 'Germany' && de.bg === 'rgb(240, 202, 0)' && de.fg === 'rgb(30, 30, 30)' && JSON.stringify(de.lines) === '["GERMANY"]' && Math.abs(de.mid) <= 6 && de.nameLeft >= de.cover + 5 && de.fits && de.wear && !de.clip, JSON.stringify(de));
    // (other countries' signs drawn on a copy of it: Japan, Italy, a country without a sign of its own)
    const oth = await ev(page, `const s = root.querySelector('#s-track .yard .sign'), out = {};
      for (const c of ['Japan', 'Italy', 'Atlantis']) { const k = s.cloneNode(true); s.after(k); MenuTabla.look(k, c, c); out[c] = Object.assign(MenuTabla.info(k), { clip: k.style.clipPath }); k.remove(); }
      return out;`);
    const J = oth.Japan, I = oth.Italy, P = oth.Atlantis;
    T.check('Japan\'s sign blue in two lines (日本 over Japan), Italy\'s the blue pointed blade, a country without a sign of its own the menu\'s plain blue one; each its name on it, worn',
      J.key === 'Japan' && JSON.stringify(J.lines) === '["日本","Japan"]' && J.bg === 'rgb(0, 88, 152)' && J.fits && J.wear && I.key === 'Italy' && JSON.stringify(I.lines) === '["ITALY"]' && I.bg === 'rgb(14, 81, 141)' && /^polygon\(/.test(I.clip) && I.fits && I.wear &&
      P.key === 'plain' && JSON.stringify(P.lines) === '["ATLANTIS"]' && P.bg === 'rgb(30, 74, 142)' && P.fits && P.wear && !P.clip, JSON.stringify(oth));
    // the shadow: on the floor under the car, its four tyres found; in the sun (dry) left of the car, in the rain under it; on snow bluish
    const shade = (wx) => page.waitForFunction((wx) => { const i = MenuCar.info(); return i.drawn && i.shadow && i.shadow.wx === wx && i.shadow.opacity === 1; }, wx, { timeout: 15000 })
      .then(() => page.evaluate(() => ({ i: MenuCar.info().shadow, s: MenuCar.sample().shade }))).catch(() => null);
    const sh0 = await shade('dry'); await click(page, 'weather:rain'); const sh1 = await shade('rain'); await click(page, 'weather:snow'); const sh2 = await shade('snow');
    T.check('the car\'s shadow on the floor (its four tyres): black, in the sun left of the car, in the rain under it; on snow bluish',
      sh0 && sh1 && sh2 && sh0.i.tyres === 4 && sh0.i.visible && sh0.s.px > 0.01 && sh0.s.col && sh0.s.col.every(v => v < 0.06) && sh1.s.px > 0.01 && sh0.s.x < sh1.s.x - 0.01 &&
      sh2.s.col && sh2.s.col[2] > sh2.s.col[0] + 0.15 && sh2.s.col[2] > sh2.s.col[1], JSON.stringify({ sh0, sh1, sh2 }));
    // a truck (the Titan): its cab over the sign's left part, the name right of it (smaller to fit), still on the sign
    const car0 = await page.evaluate(() => __game.S.car);
    await page.evaluate(() => { __game.S.car = Core.MODELS.findIndex(m => m.id === 'titan'); });
    await click(page, 'weather:dry');
    await page.waitForFunction(() => { const s = document.getElementById('menu-host').shadowRoot.querySelector('#s-track .yard .sign'), i = MenuCar.info(); return i.car === 'titan' && i.drawn && i.cover > 0 && +s.dataset.cover === i.cover; }, null, { timeout: 30000 }).catch(() => null);
    const tk = Object.assign(await sign(), await page.evaluate(() => ({ car: MenuCar.info().car, hid: MenuCar.cover() })));
    T.check('a truck (the Titan) in front of the sign: the part of it the truck hides measured, the name right of it, still on the sign',
      tk.car === 'titan' && tk.hid > 10 && tk.cover === tk.hid && tk.nameLeft >= tk.hid + 5 && tk.fits && tk.fs <= de.fs && JSON.stringify(tk.lines) === '["GERMANY"]', JSON.stringify({ tk, fs: de.fs }));
    await page.evaluate((c) => { __game.S.car = c; }, car0); await click(page, 'weather:dry');
    await page.waitForFunction(() => { const i = MenuCar.info(); return i.car !== 'titan' && i.drawn && i.shadow && i.shadow.opacity === 1; }, null, { timeout: 30000 }).catch(() => null);
    const nb = await sign();
    T.check('the race car again: the sign\'s name back where it was, as big', nb.cover === de.cover && nb.nameLeft === de.nameLeft && nb.fs === de.fs && nb.fits, JSON.stringify(nb));
    // upright a neighbour tapped (‹ Livorno, then › Nürburg again): the old screen (its car a picture of it) fades over the new one while
    // its sign with its posts, its car and its name go out to the side the track went (250 of 412 px in 260 ms); the new sign comes in
    // from the other side (the whole width, 540 ms after 140 ms), its car 60 ms after it, the shadow when it stands; then one screen
    const go = (b) => ev(page, `const kf = ${KF}, one = (e) => (kf(e) || [])[0] || '';
      root.querySelector('.nb.' + arg).click();
      const S = [...root.querySelectorAll('#mn > #s-track')], now = S[0], old = S[1], ny = now.querySelector('.yard'), oy = old && old.querySelector('.yard'), W = ny.getBoundingClientRect().width, d = Menu.debug();
      return { id: d.list[d.trackIdx], n: S.length, arrive: d.arrive, W, gone: !!old && old.classList.contains('tgone') && old.inert && old.getAttribute('aria-hidden') === 'true', snap: !!(oy && oy.querySelector(':scope > canvas.c3d.snap')),
        out: oy ? [...oy.querySelectorAll(':scope > .sign, :scope > .post, :scope > .car, :scope > .cname, :scope > canvas.c3d')].map(one) : null, fade: old ? kf(old) : null,
        in: ['.sign', '.post', '.car', '.cname', 'canvas.c3d'].map(c => one(ny.querySelector(':scope > ' + c))), sh: MenuCar.info().shadow };`, b);
    const end = () => page.waitForFunction(() => { const i = MenuCar.info(); return document.getElementById('menu-host').shadowRoot.querySelectorAll('#mn > #s-track').length === 1 && !Menu.debug().arrive && i.drawn && i.shadow && i.shadow.opacity === 1; }, null, { timeout: 20000 }).then(() => true).catch(() => false);
    const slid = (a, d) => {
      const tx = (v) => 'translateX(' + v.toFixed(0) + 'px)', o = tx(-d * a.W * 250 / 412) + ' 0 260', i = tx(d * a.W);
      return a.n === 2 && a.gone && a.snap && a.arrive > 0 && a.out && a.out.length === 6 && a.out.every(x => x === 'none ' + o) && JSON.stringify(a.fade) === '["1 0 90 340"]' &&
        JSON.stringify(a.in) === JSON.stringify([i + ' none 140 540', i + ' none 140 540', i + ' none 200 540', i + ' none 200 540', i + ' none 200 540']) && a.sh && a.sh.opacity === 0;
    };
    await page.waitForTimeout(300);
    const al = await go('l'), alEnd = await end(), it = await sign();
    T.check('upright ‹ (Livorno): the old screen fades over the new one while its sign, posts, car (a picture of it) and name go out to the right; the new sign comes in from the left, the car 60 ms after it, its shadow when it stands; then one screen, Italy\'s sign',
      al.id === 'livorno' && slid(al, -1) && alEnd && it.key === 'Italy' && /^polygon\(/.test(it.clip) && it.fits, JSON.stringify({ al, alEnd, it }));
    const ar = await go('r'), arEnd = await end(), de2 = await sign();
    T.check('upright › (Nürburg again): the same from the right; then Germany\'s sign', ar.id === 'nring' && slid(ar, 1) && arEnd && de2.key === 'Germany', JSON.stringify({ ar, arEnd, de2 }));
    // the quick list opened as they come in: they stand at once, the old screen gone; its shadow there when the list is closed
    const qk = await ev(page, `root.querySelector('.nb.l').click(); const a0 = Menu.debug().arrive, n0 = root.querySelectorAll('#mn > #s-track').length;
      root.querySelector('.trow [data-act="izbor"]').click();
      const y = root.querySelector('#s-track .yard'), d = Menu.debug();
      return { a0, n0, arrive: d.arrive, n: root.querySelectorAll('#mn > #s-track').length, run: [...y.children].reduce((a, e) => a + e.getAnimations().filter(x => x.playState === 'running').length, 0), id: d.list[d.trackIdx] };`);
    const qOpen = await page.waitForFunction(() => MenuIzbor.isOpen(), null, { timeout: 10000 }).then(() => true).catch(() => false);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !MenuIzbor.isOpen(), null, { timeout: 10000 }).catch(() => null);
    const qEnd = await end();
    T.check('the quick list opened as the sign and the car come in: they stand at once, the old screen gone; the list closed, the car with its shadow',
      qk.a0 > 0 && qk.n0 === 2 && qk.arrive === 0 && qk.n === 1 && qk.run === 0 && qk.id === 'livorno' && qOpen && qEnd, JSON.stringify({ qk, qOpen, qEnd }));
    // a device that asks for less motion: the next track at once
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const cm = await ev(page, `root.querySelector('.nb.r').click(); const y = root.querySelector('#s-track .yard'), d = Menu.debug();
      return { id: d.list[d.trackIdx], n: root.querySelectorAll('#mn > #s-track').length, arrive: d.arrive, run: [...y.children].reduce((a, e) => a + e.getAnimations().length, 0), sh: MenuCar.info().shadow };`);
    T.check('a device that asks for less motion: the next track\'s sign and car at once (no old screen fading, nothing sliding), the shadow with the car',
      cm.id === 'nring' && cm.n === 1 && cm.arrive === 0 && cm.run === 0 && cm.sh && cm.sh.opacity === 1, JSON.stringify(cm));
    T.check('the signs, the shadow and the sign and car coming in: no page errors', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 4g. the weather over the whole track screen (js/menu-vreme.js; docs/meni-izbira-proge.md, sklop 12; the user's choice of 8. 11. 2026,
  //     meni-vreme-cel-meni: the rain and the snow over the whole menu): each of the five weathers (its button) changes the picture (its
  //     light, its wet or snowy copy), the air over the screen (the rain, the blizzard), the floor (wet with the car's reflection, or snow),
  //     the sign, the car and the buttons (drops, snow on their tops); a tap fades the old weather into the new one (a ring on the icon;
  //     the light ~1 s, the water and the snow ~2.5 s), the storm's lightning comes after it; under the Earth it rests, after the screen
  //     nothing of it is left; a new track's car and sign take theirs with them; a device that asks for less motion: one still picture;
  //     on its side the cards beside the picture and the blurred picture behind them too
  {
    const { ctx, page, errors } = await open({ track: 'spa', lastTrack: 'spa', weather: 'dry', season: 'summer' }, { width: 412, height: 892 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    await page.waitForFunction(() => window.MenuCar && MenuCar.info().drawn, null, { timeout: 60000 }).catch(() => null);
    // (how much of each of its canvases is drawn on: a share of its pixels, -1 none such)
    const INK = `const ink = (c) => { if (!c || !c.width || !c.isConnected) return -1; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, m = 0; for (let i = 3; i < d.length; i += 28) { m++; if (d[i] > 8) n++; } return +(n / m).toFixed(4); };
      const q = (s) => root.querySelector(s), st = q('#track-stage');`;
    const look = () => ev(page, INK + `const i = MenuVreme.settle(), w = q('#track-stage .dio .wet'), sn = q('#track-stage .dio .snw');
      return { i, f: st.style.getPropertyValue('--wxf'), car: q('.yard').style.getPropertyValue('--wxcar'), wet: w ? +getComputedStyle(w).opacity : -1, snw: sn ? [+getComputedStyle(sn).opacity, (sn.getAttribute('href') || sn.getAttribute('src') || '').slice(0, 5)] : null,
        ink: { st: ink(q('#track-stage > canvas.wxst')), fl: ink(q('.yard > canvas.wxfl')), rm: ink(q('.room > canvas.wxrm')), car: ink(q('.yard > canvas.wxcar')), sc: ink(q('.yard > canvas.wxsc')), face: ink(q('.sign > canvas.wxface')), ui: ink(q('#mn > canvas.wxui')), air: ink(q('#mn > canvas.wxair')) } };`);
    const e0 = await ev(page, 'return MenuVreme.info();');
    T.check('the weather over the track step: on, Dry, its layers (the picture, the floor in the yard and under the neighbours, the car, the sign and its top, the buttons, the air)',
      e0.on && e0.look === 'dry' && e0.layers && Object.entries(e0.layers).every(([k, v]) => v || k === 'rbg'), JSON.stringify(e0));
    const dry = await look();
    T.check('Dry: the warm sun (its rays over the picture, the picture bright), nothing on the buttons, nothing in the air, the model or map dry',
      dry.ink.st > 0.01 && dry.ink.ui === 0 && dry.ink.air === 0 && dry.wet === 0 && /^brightness\(1\.06/.test(dry.f), JSON.stringify(dry));
    await click(page, 'weather:rain');
    const tap = await ev(page, 'return MenuVreme.info();');
    T.check('a weather tapped: it fades in (not there at once), a ring on its icon', tap.look === 'rain' && !tap.settled && tap.taps === 1 && tap.moving, JSON.stringify(tap));
    const rain = await look();
    T.check('Rain: the picture darker and wet, the rain over the whole screen, drops on the lens, the buttons and the sign, the floor wet (the car\'s reflection, ripples), the car darker',
      rain.i.look === 'rain' && rain.wet === 1 && rain.ink.air > 0.002 && rain.ink.st > 0.002 && rain.ink.ui > 0.002 && rain.ink.face > 0.01 && rain.ink.fl > 0.05 && rain.ink.rm > 0.05 && /^brightness\(0\.74/.test(rain.f) && /^brightness\(0\.84/.test(rain.car) && rain.i.car && rain.i.car.src === '3d|', JSON.stringify(rain));
    await click(page, 'weather:change');
    const chg = await look();
    T.check('Changing: the sun out in a light rain (a rainbow, the model or map a little wet), drops on the buttons', chg.i.look === 'change' && chg.wet === 0.6 && chg.ink.st > 0.01 && chg.ink.air > 0 && chg.ink.ui > 0, JSON.stringify(chg));
    await click(page, 'weather:storm');
    const fl = await page.waitForFunction(() => MenuVreme.info().flash > 0, null, { timeout: 8000 }).then(() => true).catch(() => false);
    const stm = await look();
    T.check('Storm: very dark, heavy rain, the lightning (it flashes after it came)', fl && stm.i.look === 'storm' && /^brightness\(0\.500\)/.test(stm.f) && stm.ink.air > rain.ink.air, JSON.stringify({ fl, stm }));
    await click(page, 'weather:snow');
    const ready2 = await page.waitForFunction(() => { const s = MenuVreme.info().snow; return s.length > 0 && s.every(x => x === 'ready+'); }, null, { timeout: 30000 }).then(() => true).catch(() => false);
    const snow = await look();
    T.check('Snow: the picture in the snow (its snowy copy made, in a worker, and shown), the blizzard, snow on the buttons, the sign\'s top, the car (and frost) and the floor',
      ready2 && snow.i.look === 'snow' && snow.i.enc === 'worker' && snow.wet === 0 && snow.snw && snow.snw[0] === 1 && snow.snw[1] === 'blob:' && snow.ink.air > 0.01 && snow.ink.ui > 0.002 && snow.ink.sc > 0.01 && snow.ink.car > 0.005 && snow.ink.fl > 0.2 && snow.i.car && snow.i.car.runs > 0, JSON.stringify({ ready2, snow }));
    // back to Dry: the light in ~1 s, the snow gone in ~2.5 s, then nothing moves
    await click(page, 'weather:dry');
    const t0 = await ev(page, 'const i = MenuVreme.info(); return [i.settled, i.ws.snow];');
    await page.waitForTimeout(3000);
    const t1 = await ev(page, INK + 'const i = MenuVreme.info(); return { settled: i.settled, moving: i.moving, snow: i.ws.snow, air: ink(q("#mn > canvas.wxair")), ui: ink(q("#mn > canvas.wxui")) };');
    T.check('Snow to Dry: a fade (the snow still there at first), in 3 s gone and nothing moving', !t0[0] && t0[1] > 0.5 && t1.settled && !t1.moving && t1.snow === 0 && t1.air === 0 && t1.ui === 0, JSON.stringify({ t0, t1 }));
    // under the Earth it rests; closed: it moves again
    await click(page, 'weather:rain'); await page.evaluate(() => MenuVreme.settle());
    await page.click('.thead .globe'); await zem(page, 1);
    const z1 = await ev(page, 'return MenuVreme.info();');
    await page.keyboard.press('Escape'); await zem(page, 0); await page.waitForTimeout(200);
    const z2 = await ev(page, 'return MenuVreme.info();');
    T.check('the Earth over the screen: the weather rests (nothing drawn), closed it moves again', z1.resting && !z1.moving && z1.on && !z2.resting && z2.moving, JSON.stringify({ z1, z2 }));
    // a neighbour: the new track's sign and car come in with their own (the snow on the sign's top, on the car), the weather goes on
    await click(page, 'weather:snow'); await page.evaluate(() => MenuVreme.settle());
    const nb = await ev(page, `root.querySelector('.nb.r').click(); const y = root.querySelector('#s-track .yard'), n = (s) => { const e = y.querySelector(s); return e ? e.getAnimations().length : -1; };
      return { car: n(':scope > canvas.wxcar'), sc: n(':scope > canvas.wxsc'), n: root.querySelectorAll('#mn > #s-track').length, i: MenuVreme.info() };`);
    T.check('a neighbour tapped: the new car\'s snow and the sign\'s top come in with them, the weather goes on (Snow)', nb.car > 0 && nb.sc > 0 && nb.n === 2 && nb.i.on && nb.i.look === 'snow', JSON.stringify(nb));
    await page.waitForTimeout(900);
    // (the car where it stands, not where it was as it came in: js/menu-car.js measures the yard as laid out; its snow with it)
    const nb2 = await ev(page, 'return { box: MenuCar.info().box, car: MenuVreme.info().car };');
    T.check('the new track\'s car stands in its place, drawn (not left beyond the screen where it came in from), its snow on it',
      nb2.box && nb2.box[0] > -1 && nb2.box[2] < 0.5 && nb2.car && !nb2.car.none && nb2.car.runs > 0 && nb2.car.box[0] < 40, JSON.stringify(nb2));
    await page.click('.thead [data-act="back"]');
    const gone = await ev(page, 'return { n: root.querySelectorAll("#mn > canvas.wxl").length, i: MenuVreme.info() };');
    T.check('back from the track step: nothing of the weather left', gone.n === 0 && !gone.i.on && !gone.i.moving, JSON.stringify(gone));
    // a device that asks for less motion: one still picture, at once
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await click(page, 'mode:race'); await page.waitForTimeout(400);
    const cm = await ev(page, INK + 'return { i: MenuVreme.info(), air: ink(q("#mn > canvas.wxair")), ui: ink(q("#mn > canvas.wxui")) };');
    await page.waitForTimeout(700);
    const cm2 = await ev(page, 'return MenuVreme.info();');
    T.check('a device that asks for less motion: the blizzard and the snow on the buttons as a still picture at once (no fade, no ring), nothing moving',
      cm.i.look === 'snow' && cm.i.settled && cm.i.taps === 0 && cm.i.uiA === 1 && cm.air > 0.01 && cm.ui > 0.002 && !cm2.moving, JSON.stringify({ cm, cm2 }));
    T.check('the weather over the track step: no page errors', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {   // (on its side: the cards beside the picture in the weather too, the blurred picture behind them darker in the rain, paler in the snow)
    const { ctx, page, errors } = await open({ track: 'spa', lastTrack: 'spa', weather: 'dry', season: 'summer' }, { width: 892, height: 412 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    await page.waitForFunction(() => window.MenuCar && MenuCar.info().drawn, null, { timeout: 60000 }).catch(() => null);
    const side = () => ev(page, `const i = MenuVreme.settle(), q = (s) => root.querySelector(s), op = (s) => { const e = q(s); return e ? +getComputedStyle(e).opacity : -1; };
      return { i, k: q('#s-track').style.getPropertyValue('--wxk'), card: getComputedStyle(q('#s-track .rcard[data-k="1"]')).filter, dim: op('#s-track .rbg > .wxdim'), white: op('#s-track .rbg > .wxsnow') };`);
    await click(page, 'weather:rain'); const r = await side();
    await click(page, 'weather:snow'); const s = await side();
    T.check('on its side: the picture, the car\'s floor, the buttons and the air in the weather (no sign, no room), the cards beside it darker in the rain, the picture behind them darker in the rain and paler in the snow',
      r.i.land && r.i.layers.stage && r.i.layers.floor && !r.i.layers.room && !r.i.layers.face && r.i.layers.ui && r.i.layers.air && r.dim > 0.2 && r.k === 'brightness(0.844) saturate(0.832)' && r.card.includes('saturate(0.832)') && s.white > 0.1 && s.dim === 0 && /saturate\(0\.4/.test(s.k), JSON.stringify({ r, s }));
    T.check('the weather on its side: no page errors', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 5. a time trial on a new track (Harju: the model of its land, no map or flight yet), and the short intro with its video and Skip
  {
    const { ctx, page, errors } = await open();
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:trial');
    const n0 = await page.evaluate(() => Menu.debug().list.length);
    for (let k = 0; k < n0; k++) { const n = await ev(page, 'return root.querySelector(".where .w2").textContent;'); if (n === 'Harju') break; await click(page, 'track:1'); }
    const info = await ev(page, 'return { name: root.querySelector(".where .w2").textContent, gold: /^Gold time\\d+:\\d\\d\\.\\d\\d$/.test(root.querySelector(".trow .gt").textContent), opp: !!root.querySelector(".trow .opp") };');
    T.check('Time trial: Harju, its Gold time first in the row (no opponents)', info.name === 'Harju' && info.gold && !info.opp, JSON.stringify(info));
    await click(page, 'race-single');
    await raceOn(page, 'harju').catch(() => null);
    const r = await page.evaluate(() => ({ id: __game.race && __game.race.track.def.id, tt: __game.race && !!__game.race.timeTrial }));
    T.check('Race! in Time trial: Harju as a time trial', r.id === 'harju' && r.tt, JSON.stringify(r));
    await page.evaluate(() => __game.onAction('to-title')); await page.waitForTimeout(400);
    T.check('no page errors in the time trial', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {   // (the short intro: an open road, Pikes Peak's time trial; in Circuit race on a circuit the race weekend is the intro: 5a)
    const { ctx, page, errors } = await open({ intro: 1, track: 'pikes', mode: 'tt', lastTrack: 'pikes' });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:trial');
    await click(page, 'race-single');
    await page.waitForFunction(() => { const v = document.getElementById('menu-host').shadowRoot.querySelector('.intro video'); return v && v.currentTime > 1.2 && !v.paused; }, null, { timeout: 90000 }).catch(() => null);
    const iv = await ev(page, 'const v = root.querySelector(".intro video"), f = root.querySelector(".ix-name .ix-flag"); return v ? { t: v.currentTime, paused: v.paused, dur: v.duration, head: root.querySelector(".ix-name h2") && root.querySelector(".ix-name h2").firstChild.textContent, race: !!window.__game.race, flag: f ? [f.tagName, f.getAttribute("src"), f.naturalWidth > 0, Math.round(f.getBoundingClientRect().width / f.getBoundingClientRect().height * 100) / 100] : null } : null;');
    T.check('the short intro: the helicopter\'s video plays over the track, the race waits', iv && iv.t > 1.2 && !iv.paused && iv.dur > 20 && iv.head === 'Pikes Peak' && !iv.race, JSON.stringify(iv));
    T.check('the intro\'s flag: the USA\'s from assets/flags, in its own proportions (19:10)', iv && iv.flag && iv.flag[0] === 'IMG' && iv.flag[1] === 'assets/flags/usa.svg' && iv.flag[2] && Math.abs(iv.flag[3] - 1.9) < 0.08, JSON.stringify(iv && iv.flag));
    await page.click('.intro [data-ix="skip"]');
    await raceOn(page, 'pikes').catch(() => null);
    const a = await ev(page, 'return { intro: !!root.querySelector(".intro"), race: __game.race && __game.race.track.def.id };');
    T.check('Skip: the intro is gone, the race starts', !a.intro && a.race === 'pikes', JSON.stringify(a));
    T.check('no page errors in the intro', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {   // (Pikes Peak on gravel: the title's Single race tile shows its own model; on Asphalt (the Road option) the road's own again)
    const { ctx, page, errors } = await open({ track: 'pikesg', pkRoad: 'pikesg', mode: 'tt', lastTrack: 'pikes' });
    await ready(page);
    const tile = 'return root.querySelector(".t-single .im img").getAttribute("src");';
    const gImg = await ev(page, tile);
    await click(page, 'single'); await click(page, 'mode:trial');
    await click(page, 'more-options'); await click(page, 'opt:pkRoad:pikes'); await done(page); await page.waitForTimeout(300);
    await page.evaluate(() => __game.onAction('to-title')); await page.waitForTimeout(400);
    const aImg = await ev(page, tile);
    T.check('Pikes Peak: on Gravel the Single race tile shows its own model (pikesg.webp), on Asphalt the road\'s own (pikes.webp)',
      /\/pikesg\.webp$/.test(gImg) && /\/pikes\.webp$/.test(aImg), JSON.stringify({ gImg, aImg }));
    T.check('no page errors on Pikes Peak\'s Road option', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 5a. Circuit race on a circuit: the race weekend's calendar is the intro (Spa: its helicopter's first frame behind it).
  //     Qualifying is off: Saturday skipped, Sunday's grid the back of it, Race! "Start from last place"; Back to the tracks; switched
  //     on it is remembered (the setting, kept), Saturday first; Race! without it starts the race from the back of the grid (22nd of 22),
  //     with it the qualifying lap; the pad's B and Start; on its side Race! at the very bottom right
  {
    const wk = (page) => ev(page, `const w = root.querySelector('.intro.wk'); if (!w) return null; const vis = (q) => [...w.querySelectorAll(q)].filter(e => e.offsetParent).map(e => e.textContent.replace(/\\s+/g, ' ').trim());
      const g = [...w.querySelectorAll('.wk-go')].find(e => e.offsetParent), r = g && g.getBoundingClientRect();
      return { on: w.classList.contains('on'), head: w.querySelector('.ix-name h2').firstChild.textContent, days: vis('.wk-hd'), ses: vis('.wk-sname'), sky: vis('.wk-wd em'), pos: vis('.wk-pos'), stamp: vis('.wk-stamp'), go: g && g.textContent, pic: w.querySelector('.wk-pic img').getAttribute('src'),
        sw: w.querySelector('.wk-sw').getAttribute('aria-checked'), btn: r && [Math.round(r.right), Math.round(r.bottom), innerWidth, innerHeight], race: !!window.__game.race, wx: w.querySelector('.wk-wx').textContent.replace(/\\s+/g, ' ').trim() };`);
    const toWeekend = async (page) => { await click(page, 'race-single'); await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.intro.wk'), null, { timeout: 120000 }); await page.waitForTimeout(300); };
    const { ctx, page, errors } = await open({ intro: 0, track: 'spa', mode: 'race', lastTrack: 'spa' });   // (a real circuit: Monte Carlo before 9. 11. 2026, a test track behind NEUPORABNO)
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    await toWeekend(page);
    const w0 = await wk(page);
    T.check('Race! in Circuit race: the race weekend (Saturday qualifying skipped, Sunday the race from P22 of 22), the track from afar behind it, the race waits',
      w0 && !w0.on && w0.head === 'Spa' && JSON.stringify(w0.days) === '["SATURDAY","SUNDAY"]' && JSON.stringify(w0.ses) === '["Qualifying","Race"]' && w0.sky.length === 2 && w0.sky.every(k => /sunny|clear/i.test(k)) &&
      JSON.stringify(w0.pos) === '["P22/22"]' && JSON.stringify(w0.stamp) === '["SKIPPED"]' && /^Race!\s*START FROM LAST PLACE$/.test(w0.go) && w0.pic === 'assets/maps/heli-spa.webp' && w0.sw === 'false' && !w0.race, JSON.stringify(w0));
    await page.click('.intro.wk [data-wk="back"]'); await page.waitForTimeout(300);
    const b = await ev(page, 'return { wk: !!root.querySelector(".intro"), name: root.querySelector("#s-track .where .w2").textContent, race: !!window.__game.race };');
    T.check('Back: the weekend gone, the track screen again, no race', !b.wk && b.name === 'Spa' && !b.race, JSON.stringify(b));
    await page.evaluate(() => { window.__game.S.weather = 'change'; });   // (Changing: the weekend's Sunday changeable, Saturday as the race starts)
    await toWeekend(page);
    await page.click('.intro.wk [data-wk="q"]'); await page.waitForTimeout(200);
    const w1 = await wk(page), kept = await page.evaluate(() => [window.__game.S.quali, JSON.parse(localStorage.getItem('tdgp-settings')).quali]);
    T.check('Saturday switched on: Start qualifying (Saturday first), the grid P1–22, the choice kept in the settings', w1.on && w1.sw === 'true' && /^Start qualifying\s*SATURDAY FIRST$/.test(w1.go) && JSON.stringify(w1.pos) === '["P1–22"]' && !w1.stamp.length && JSON.stringify(kept) === '[1,1]', JSON.stringify({ w1, kept }));
    T.check('Changing weather: Sunday changeable ("CHANGEABLE · may change"), Saturday dry or rain as the race will start', w1.sky.length === 2 && w1.sky[1] === 'Changeable' && /^(Sunny|Mostly sunny|Clear|Rain)$/.test(w1.sky[0]) && /^CHANGEABLE ?· may change$/.test(w1.wx), JSON.stringify({ sky: w1.sky, wx: w1.wx }));
    await page.click('.intro.wk [data-wk="q"]'); await page.waitForTimeout(200);
    await page.click('.intro.wk [data-wk="go"]');
    await raceOn(page, 'spa').catch(() => null);
    const r0 = await page.evaluate(() => { const r = __game.race; return r && { quali: !!r.quali, cars: r.cars.length, grid: r.player.grid, intro: !!document.getElementById('menu-host').shadowRoot.querySelector('.intro'), rain: r.rain, wx: r.wst && r.wst.wx && Object.assign({}, r.wst.wx) }; });
    T.check('Race! with qualifying off: the race, from the back of the grid (22nd of 22)', r0 && !r0.quali && r0.cars === 22 && r0.grid === 22 && !r0.intro, JSON.stringify(r0));
    T.check('Changing weather: the race starts as Saturday showed (rain or dry), the change to come (to the other)', r0 && !!r0.wx && r0.rain === (w1.sky[0] === 'Rain' ? 1 : 0) && r0.wx.r1 === 1 - r0.rain && r0.wx.at > 0, JSON.stringify({ sat: w1.sky[0], rain: r0 && r0.rain, wx: r0 && r0.wx }));
    T.check('no page errors on the race weekend', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {   // (qualifying on, as left from the last time; on its side; the pad)
    const { ctx, page, errors } = await open({ intro: 0, quali: 1, track: 'spa', mode: 'race', lastTrack: 'spa' }, { width: 915, height: 412 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    await click(page, 'race-single'); await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.intro.wk'), null, { timeout: 120000 }); await page.waitForTimeout(300);
    const wl = await ev(page, `const w = root.querySelector('.intro.wk'), g = [...w.querySelectorAll('.wk-go')].find(e => e.offsetParent), r = g.getBoundingClientRect(); return { on: w.classList.contains('on'), go: g.textContent, btn: [Math.round(r.right), Math.round(r.bottom), innerWidth, innerHeight] };`);
    T.check('on its side, qualifying remembered on: Start qualifying at the very bottom right', wl.on && /^Start qualifying/.test(wl.go) && wl.btn[2] - wl.btn[0] <= 24 && wl.btn[3] - wl.btn[1] <= 24, JSON.stringify(wl));
    const pb = await page.evaluate(() => Menu.padKey('b'));
    const gone = await ev(page, 'return !root.querySelector(".intro");');
    await click(page, 'race-single'); await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.intro.wk'), null, { timeout: 120000 });
    const ps = await page.evaluate(() => Menu.padKey('start'));
    await raceOn(page, 'spa').catch(() => null);
    const r1 = await page.evaluate(() => { const r = __game.race; return r && { quali: !!r.quali, cars: r.cars.length }; });
    T.check('the pad: B back to the tracks, Start the choice (with qualifying on: the qualifying lap, alone)', pb && gone && ps && r1 && r1.quali && r1.cars === 1, JSON.stringify({ pb, gone, ps, r1 }));
    T.check('no page errors on the race weekend on its side', !real(errors).length, real(errors).join(' | '));
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
      const s = await ev(page, 'const f = root.querySelector(".pad-focus"), h = root.querySelector(".where .w2"), D = Menu.debug(); return { screen: D.screen, sub: D.titleSub, focus: f ? (f.dataset.act || "") : "", name: h ? h.textContent : "", id: (D.list || [])[D.trackIdx] || "" };');
      s.seen = seen; return s;
    };
    // (the first real track of Circuit race's list, the shortest: from the game, not named here, so a new shorter track does not break it)
    const first = await page.evaluate(() => { const L = window.MENU.lens, ds = Core.TRACKS.filter(d => !d.variantOf && !d.test && !d.pending && (d.modes || (d.timeTrial ? ['tt'] : ['race'])).includes('race'));
      ds.sort((a, b) => (L[a.id] - L[b.id]) || (a.id < b.id ? -1 : 1)); return ds[0].id; });
    let g = await press(9);
    T.check('pad, Start on the title: Single race opens, the highlight on the chosen mode', g.seen && g.screen === 'title' && g.sub === 'single' && g.focus === 'mode:race', JSON.stringify(g));
    g = await press(13);
    T.check('pad, down: the highlight moves to the next mode', g.focus === 'mode:chase', JSON.stringify(g));
    g = await press(12);
    g = await press(0);
    T.check(`pad, A: the highlighted mode is chosen (the track step on the first real track of the list, the shortest: ${first}; the highlight on Race!)`, g.screen === 'track' && g.focus === 'race-single' && g.id === first && g.name !== '', JSON.stringify(g));
    g = await press(5);
    const next = g.id;
    g = await press(4);
    T.check('pad, RB and LB: the next track and back', next !== first && next !== '' && g.id === first, JSON.stringify({ next, g }));
    g = await press(12);
    T.check('pad, up: the highlight leaves Race! for another button', g.focus !== 'race-single' && g.focus !== '', JSON.stringify(g));
    g = await press(1);
    T.check('pad, B: back to the modes', g.screen === 'title' && g.sub === 'single', JSON.stringify(g));
    await press(9); await press(9);
    await raceOn(page, first).catch(() => null);
    const r = await page.evaluate(() => ({ id: __game.race && __game.race.track.def.id }));
    T.check('pad, Start, Start: the mode, then the race on that track', r.id === first, JSON.stringify(r));
    T.check('no page errors with the pad', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 6. the layouts: upright (360 x 640 and 412 x 915), on its side (915 x 412 and 640 x 360): the menu, the track step, the quick list, the Earth
  for (const [w, h] of [[360, 640], [412, 915], [915, 412], [640, 360]]) {
    const { ctx, page, errors } = await open({ track: 'nring', lastTrack: 'nring' }, { width: w, height: h });   // (the title's tile: Nürburg's model; Vršič, a test track since 6. 11. 2026, has none)
    await page.emulateMedia({ reducedMotion: 'reduce' });   // (the slide-in of a screen is off: it would still be on its way, and the screen 8 px low, when measured)
    await ready(page);
    await page.evaluate(() => { Core.TRACKS.find(d => d.id === 'iroha').pending = false; });   // (as in the quick list above: Japan's list two tracks, Suzuka and Irohazaka)
    const title = await ev(page, 'const p = root.querySelector(".title-panel").getBoundingClientRect(); const b = [...root.querySelectorAll(".title-panel button")].map(e => e.getBoundingClientRect()); return { top: p.top, bottom: p.bottom, w: innerWidth, h: innerHeight, over: b.filter(r => r.bottom > p.bottom + 1 || r.top < p.top - 1).length };');
    T.check(`${w}x${h}: the main menu fits the screen, every button inside its panel`, title.top >= -0.5 && title.bottom <= title.h + 0.5 && title.over === 0, JSON.stringify(title));
    await click(page, 'single');
    const modes = await ev(page, 'const p = root.querySelector(".title-panel").getBoundingClientRect(); const c = [...root.querySelectorAll(".t-sub .mode")].map(e => e.getBoundingClientRect()); return { top: p.top, bottom: p.bottom, h: innerHeight, cut: c.filter(r => r.bottom > p.bottom + 1 || r.top < p.top - 1).length, n: c.length };');
    T.check(`${w}x${h}: the eight modes fit their panel`, modes.top >= -0.5 && modes.bottom <= modes.h + 0.5 && modes.cut === 0 && modes.n === 8, JSON.stringify(modes));
    await click(page, 'mode:race'); await page.click('.thead [data-act="back"]'); await click(page, 'tsub:');
    await nuPick(page, 'vrsic');   // (Vršič, a test track since 6. 11. 2026: behind NEUPORABNO, the longest hidden track, its list's last)
    await click(page, 'cam:2');   // (the flyover)
    await page.waitForTimeout(500);
    // the track step: upright the picture from the top of the screen (the head over it) to the row, then the row, the yard, the neighbours
    // and Race! one under the other; on its side the carousel (sklop 10): the chosen track's card in the middle under the head, the row
    // under it as wide as it and Race! at its right, the car at the bottom left under the left neighbour's card, the neighbours' cards
    // (smaller, within its height) and the arrows ‹ › at the card's sides (at the height of its middle); nothing cut, nothing over another
    const g = await ev(page, `
      const rc = (s) => { const e = root.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
      const out = { head: rc(".thead"), hb: rc(".thead .hback"), globe: rc(".thead .globe"), st: rc("#track-stage"), row: rc(".trow"), yard: rc(".yard"), car: rc(".yard .car"), sign: rc(".yard .sign"), nbrs: rc(".nbrs"), foot: rc(".foot"), go: rc(".go"), where: rc(".where .w2"), W: innerWidth, H: innerHeight };
      out.cl = rc(".rcard[data-k='-1']"); out.cr = rc(".rcard[data-k='1']"); out.al = rc(".rarw.l"); out.ar = rc(".rarw.r"); out.k = Menu.debug().ring.k;
      out.cells = [...root.querySelectorAll(".trow > div")].map(e => e.scrollWidth - e.clientWidth); out.nb = [...root.querySelectorAll(".nb")].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.width]; });
      out.wx = rc(".wxv"); out.cams = rc("#track-stage .cams"); out.cnt = rc("#track-stage .tcount"); out.gr = rc("#track-stage .hgraph"); const sv = root.querySelector("#track-stage .hgraph svg"); out.grw = sv ? sv.getBoundingClientRect().width : 0; return out;`);
    const inside = (r) => r && r.l >= -0.5 && r.r <= g.W + 0.5 && r.t >= -0.5 && r.b <= g.H + 0.5;
    const side = g.W > g.H, parts = side ? ['head', 'row', 'yard', 'car', 'foot', 'cl', 'cr', 'al', 'ar'] : ['row', 'yard', 'nbrs', 'foot'];
    const order = side || parts.every((k, i) => !i || g[parts[i - 1]].b <= g[k].t + 1), mx = (r) => (r.l + r.r) / 2, my = (r) => (r.t + r.b) / 2;
    const lay = side ? Math.abs(mx(g.st) - g.W / 2) < 1 && g.head.b <= g.st.t + 1 && g.row.t >= g.st.b - 1 && Math.abs(g.row.l - g.st.l) < 1 && Math.abs(g.row.r - g.st.r) < 1 &&
        g.go.l >= g.row.r && g.go.t < g.row.b && g.go.b > g.row.t && g.yard.r <= g.row.l + 1 && g.car.r <= g.row.l + 1 && g.car.t >= g.cl.b - 1 &&
        g.cl.r <= g.st.l && g.cr.l >= g.st.r && [g.cl, g.cr].every(r => r.t >= g.st.t && r.b <= g.st.b) && [g.al, g.ar].every(r => Math.abs(my(r) - my(g.st)) < 1) && mx(g.al) < g.st.l && mx(g.ar) > g.st.r && g.al.w >= 35.5 && g.ar.w >= 35.5 && g.hb.h >= 43.5 && g.globe.w >= 43.5 && g.globe.h >= 43.5
      : g.st.t <= 0.5 && g.head.t <= 0.5 && g.head.b <= g.st.t + 90 && g.row.t >= g.st.b - 20 && g.row.t <= g.st.b + 1 && g.st.h >= g.H * 0.5 && order;   // (the row in the room, which lies a little over the picture's foot: --ov)
    T.check(`${w}x${h}: the track step${side ? ' on its side (the carousel): the card in the middle under the head, the row and Race! under it, the car at the bottom left, the neighbours\' cards and the arrows at its sides' : ' (the picture from the top, the head over it): the row, the yard, the neighbours and Race!, in order'}, all inside the screen`,
      lay && parts.every(k => inside(g[k])) && inside(g.head) && inside(g.go) && inside(g.st) && g.yard.h >= 50, JSON.stringify(g));
    T.check(`${w}x${h}: the row's numbers are not cut; ${side ? 'the neighbours\' cards apart from the card' : 'the two neighbours side by side'}; the weather inside the stage, over the cameras; the counter and the cameras at the stage's foot, apart${side ? '' : '; the sign in the yard'}`,
      g.cells.every(x => x <= 1) && (side ? g.cl.r <= g.st.l - 8 && g.cr.l >= g.st.r + 8 : g.nb.length === 2 && g.nb[0][1] <= g.nb[1][0] && g.nb[0][2] >= 100) && g.wx.l >= g.st.l && g.wx.r <= g.st.r + 0.5 && g.wx.t >= g.st.t && g.wx.b <= g.cams.t - 4 && (side || g.wx.t >= g.globe.b + 4) &&
      g.cnt.l >= g.st.l + 6 && g.cnt.r <= g.cams.l - 8 && g.cams.r <= g.st.r - 6 && Math.abs(g.cnt.b - g.cams.b) < 0.5 && g.cams.b <= (side ? g.st.b : g.row.t) - 6 && (side || (g.sign.t >= g.yard.t - 0.5 && g.sign.r <= g.yard.r + 0.5)),
      JSON.stringify({ cells: g.cells, nb: side ? [g.cl, g.cr] : g.nb, wx: g.wx, cams: g.cams, cnt: g.cnt, sign: g.sign }));
    const e8 = Math.max(6, 8 * g.k);   // (on its side the things in the card 8 of the drawing's px in from its edges, no less than 6 px)
    T.check(`${w}x${h}: the height graph in its frame ${side ? 'at the stage\'s top left' : 'under the back arrow, as wide as it'} (0.6 of it high), left of the weather and over the counter`,
      g.gr && Math.abs(g.grw - g.gr.w) < 1 && g.gr.h >= g.gr.w * 0.55 && g.gr.h <= g.gr.w * 0.66 && g.gr.r < g.wx.l - 8 && g.gr.b < g.cnt.t - 8 &&
      (side ? Math.abs(g.gr.l - g.st.l - e8) < 0.6 && Math.abs(g.gr.t - g.st.t - e8) < 0.6 : Math.abs(g.gr.l - g.hb.l) < 0.5 && Math.abs(g.gr.w - g.hb.w) < 0.5 && g.gr.t >= g.hb.b + 8), JSON.stringify({ gr: g.gr, st: g.st, hb: g.hb, grw: g.grw, wx: g.wx }));

    // the whole route and the names of its flags inside the picture; the neighbours (on its side their cards) at the same place on the next track. (An open road's map
    // turned to run up the frame: on Pikes Peak, below. Vršič, a test track since 6. 11. 2026 (behind NEUPORABNO), is drawn as the test tracks are, not turned)
    const MEASURE = `
      const c = (e) => { const r = e.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
      const st = root.querySelector("#track-stage"), pic = st.querySelector(".dio"), svg = st.querySelector(".topmap svg");
      const out = { name: root.querySelector(".where .w2").textContent, head: root.querySelector(".where").textContent.replace(/\\s+/g, " ").trim(), pic: c(pic), nb: [...root.querySelectorAll(innerWidth > innerHeight ? ".rcard[data-k='-1'], .rcard[data-k='1']" : ".nb")].map(c), scr: [innerWidth, innerHeight] };
      if (svg) { out.rot = svg.querySelector("g.rot").getAttribute("transform") || ""; out.s = c(svg.querySelector(".mk.s circle")); const f = svg.querySelector(".mk.f circle"); out.f = f ? c(f) : null; out.line = c(svg.querySelector("path.rt-o")); out.names = [...st.querySelectorAll(".mlab .fl-s")].map(c); out.boxes = [...st.querySelectorAll(".mlab .fl-s")].map(e => { const b = e.querySelector("b").getBoundingClientRect(), m = e.querySelector("small"), r = m && m.getBoundingClientRect(); return [e.className, getComputedStyle(e.querySelector("b")).backgroundColor, r ? +(r.top >= b.bottom - 1 && Math.abs(r.right - b.right) < 12) : -1]; }); const ld = svg.querySelector("image.land"); out.land = ld ? c(ld) : null; out.keep = [...st.querySelectorAll(":scope > .cams, :scope > .wxv, :scope > .hgraph, :scope > .tcount")].concat([...root.querySelector(".thead").children]).map(c); }
      return out;`;
    await click(page, 'cam:1'); await page.waitForTimeout(500);
    const v1 = await ev(page, MEASURE);
    await click(page, 'track:1'); await page.waitForTimeout(500);
    const v2 = await ev(page, MEASURE);
    const same = (a, b) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1;
    T.check(`${w}x${h}: the neighbours' ${side ? 'cards' : 'buttons'} at the same place on Vršič and on the next track`, v1.name === 'Vršič' && v2.name !== 'Vršič' && v1.nb.length === 2 && v2.nb.length === 2 && same(v1.nb[0], v2.nb[0]) && same(v1.nb[1], v2.nb[1]), JSON.stringify({ v1: v1.nb, v2: v2.nb }));
    if (w === 412) T.check('Vršič\'s head: the place alone, "VRŠIČ" (no height)', v1.head === 'Vršič', v1.head);
    const inPic = (r, p, e) => r.l >= p.l - e && r.r <= p.r + e && r.t >= p.t - e && r.b <= p.b + e;
    T.check(`${w}x${h}: the whole route (start to finish) and the names of its flags are inside the picture, the names upright`, inPic(v1.line, v1.pic, 6) && v1.names.length >= 2 && v1.names.every(n => inPic(n, v1.pic, 1) && n.w > n.h), JSON.stringify({ line: v1.line, pic: v1.pic, names: v1.names }));
    T.check(`${w}x${h}: the flags' names in boxes as the flyover's (the start's white, the finish's dark), the height in a small box under the name at its right`,
      v1.boxes.length === 2 && v1.boxes[0][0] === 'fl-s start' && v1.boxes[1][0] === 'fl-s finish' && v1.boxes[0][1] === 'rgb(255, 255, 255)' && v1.boxes[1][1] !== v1.boxes[0][1] && v1.boxes.every(b => b[2] === 1), JSON.stringify(v1.boxes));
    // the real land painted round the map (wide-<id>.webp, wide_map.py) covers the whole picture: no blurred or empty edge, in the frame turned or not
    const covers = (l, p) => !!l && l.l <= p.l + 1 && l.r >= p.r - 1 && l.t <= p.t + 1 && l.b >= p.b - 1;
    T.check(`${w}x${h}: the open road's map has the real land painted over the whole picture (the wide map reaches every edge of the frame)`, covers(v1.land, v1.pic), JSON.stringify({ land: v1.land, pic: v1.pic }));
    // every real track with a map (the real list again: back to the title, Single race, Circuit race): the route and its names inside the
    // picture, the painted land over all of it
    await page.click('.thead [data-act="back"]'); await click(page, 'single'); await click(page, 'mode:race'); await click(page, 'cam:1'); await page.waitForTimeout(500);
    const ids = await page.evaluate(() => Menu.debug().list), cut = [], bare = [], under = [], close = []; let maps = 0, pk = null;
    const over = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
    const share = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t)) / Math.min(a.w * a.h, b.w * b.h);   // (how much of the smaller name the other covers)
    for (let k = 0; k < ids.length; k++) {
      const id = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; });
      if (await page.evaluate((id) => !!(window.ROUTES || {})[id] && !Core.TRACKS.find(d => d.id === id).test, id)) {   // (the test tracks aside)
        await page.waitForTimeout(300);
        const m = await ev(page, MEASURE);
        if (id === 'pikes') pk = m;
        if (m.names) { maps++; if (!inPic(m.line, m.pic, 6) || !m.names.every(n => inPic(n, m.pic, 1))) cut.push(m.name); if (m.land && !covers(m.land, m.pic)) bare.push(m.name); if (m.names.some(n => m.keep.some(k => over(n, k)))) under.push(m.name); if (m.names.length === 2 && share(...m.names) > (w === 640 ? 0.15 : 0)) close.push(m.name + ' ' + share(...m.names).toFixed(2)); }
      }
      await click(page, 'track:1');
    }
    T.check(`${w}x${h}: on every real track's map (${maps}) the route and the names of its flags are inside the picture`, maps >= 5 && !cut.length, JSON.stringify(cut));
    // an open road's map is turned to run up the frame (start below, finish above) in a frame not much wider than tall, else it lies
    const tall = !!pk && pk.pic.w / pk.pic.h < 1.3, turned = !!pk && /^rotate\(-90 /.test(pk.rot || '');
    const upright = !!pk && !!pk.f && (tall ? pk.s.y > pk.f.y + pk.pic.h * 0.4 && Math.abs(pk.s.x - pk.f.x) < pk.pic.w * 0.35 : pk.f.x > pk.s.x + pk.pic.w * 0.4);
    T.check(`${w}x${h}: the open road's map ${tall ? 'runs up the frame (Pikes Peak: Crystal Reservoir, the start, below; the Summit, the finish, above)' : 'lies along the frame (it is wide and short): the start left, the finish right'}`, !!pk && turned === tall && upright, JSON.stringify(pk && { name: pk.name, rot: pk.rot, pic: pk.pic, s: pk.s, f: pk.f }));
    T.check(`${w}x${h}: on every map the painted land covers the whole picture`, !bare.length, JSON.stringify(bare));
    T.check(`${w}x${h}: on every map the names of the flags are not under the head, the graph, the weather, the counter or the cameras' buttons`, maps >= 5 && !under.length, JSON.stringify(under));
    // (on the smallest screen on its side, the card 276 × 169, two long names over flags close together can't both be clear: there they cover each other least)
    T.check(`${w}x${h}: on every map the names of the two flags apart${w === 640 ? ' (here at most a corner of one over the other)' : ''}`, maps >= 5 && !close.length, JSON.stringify(close));
    // the quick list (sklop 8): upright a sheet from the bottom the screen's width, on its side a panel at the right the screen's height;
    // its buttons big enough for a finger, the flags and the countries' names not cut; a country's tracks and a track's card in it, the
    // card's Select and Race! in sight without scrolling
    await page.click('.trow .flag button');
    await page.waitForFunction(() => window.MenuIzbor && MenuIzbor.isOpen() && MenuIzbor.depth() === 1 && document.getElementById('menu-host').shadowRoot.querySelector('.izb.on'), null, { timeout: 10000 });   // (on: slid in)
    const QL = `const rc = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; }, q = (s) => root.querySelector(".izb " + s), qa = (s) => [...root.querySelectorAll(".izb " + s)];
      return { W: innerWidth, H: innerHeight, sh: rc(q(".izb-sheet")), body: rc(q(".izb-body")), x: rc(q(".izb-head [data-x]")), bk: rc(q(".izb-head [data-back]")), q: rc(q(".izb-q")),
        cut: qa(".izb-c b, .izb-t .tx b, .izb-chips button").filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent), tiles: qa(".izb-c").map(rc), chips: qa(".izb-chips button").map(rc), icons: qa(".izb-chips button svg").map(rc), rows: qa(".izb-t").map(rc), btns: qa(".izb-btns button").map(rc) };`;
    const q1 = await ev(page, QL);
    const portrait = q1.W < q1.H, within = (r, b) => r.l >= b.l - 0.5 && r.r <= b.r + 0.5;
    const placed = (s) => portrait ? Math.abs(s.l) < 1 && Math.abs(s.r - q1.W) < 1 && Math.abs(s.b - q1.H) < 1 && s.t >= 39   // (as high as its view needs: the countries most of the screen)
      : Math.abs(s.r - q1.W) < 1 && Math.abs(s.t) < 1 && Math.abs(s.b - q1.H) < 1 && Math.abs(s.w - Math.min(412, q1.W * 0.64)) < 2;
    T.check(`${w}x${h}: the quick list ${portrait ? 'a sheet from the bottom, the screen\'s width (the track step seen over it)' : 'a panel at the right, the screen\'s height'}; the cross 44 px or more; the search, the four category buttons (each with its icon) and the flags inside it; no country\'s name or button label cut`,
      placed(q1.sh) && (!portrait || q1.sh.t <= q1.H * 0.2) && q1.x.w >= 44 && q1.x.h >= 44 && within(q1.x, q1.sh) && within(q1.q, q1.sh) && q1.chips.length === 4 && q1.icons.length === 4 && q1.icons.every(i => i.w >= 14 && i.h >= 14) && q1.chips.every(c => within(c, q1.sh) && c.h >= 26) && q1.tiles.length >= 10 && q1.tiles.every(t => within(t, q1.sh)) && !q1.cut.length,
      JSON.stringify({ sh: q1.sh, x: q1.x, q: q1.q, chips: q1.chips.map(c => [Math.round(c.l), Math.round(c.r)]), icons: q1.icons.map(i => [Math.round(i.w), Math.round(i.h)]), cut: q1.cut }));
    await page.click('.izb-c[data-c="Japan"]'); await page.waitForFunction(() => MenuIzbor.depth() === 2, null, { timeout: 10000 });
    const q2 = await ev(page, QL);
    await page.click('.izb-t[data-t="suzuka"]'); await page.waitForFunction(() => MenuIzbor.depth() === 3, null, { timeout: 10000 });
    const q3 = await ev(page, QL);
    T.check(`${w}x${h}: in the quick list a country's tracks (Japan) inside it, their names not cut; a track's card (Suzuka): Select and Race! in sight without scrolling, 44 px or more; the back arrow and the cross 44 px or more`,
      placed(q2.sh) && q2.rows.length >= 2 && q2.rows.every(r => within(r, q2.sh)) && !q2.cut.length && placed(q3.sh) && q3.btns.length === 2 && q3.btns.every(b => within(b, q3.sh) && b.t >= q3.body.t - 0.5 && b.b <= q3.body.b + 0.5 && b.h >= 44) &&
      q3.bk && q3.bk.w >= 44 && q3.bk.h >= 44 && q3.x.w >= 44, JSON.stringify({ rows: q2.rows.length, cut: q2.cut, sh: q3.sh, body: q3.body, btns: q3.btns, bk: q3.bk }));
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    await page.waitForFunction(() => !MenuIzbor.isOpen() && !document.getElementById('menu-host').shadowRoot.querySelector('.izb'), null, { timeout: 10000 });
    // the Earth (sklop 9): the back arrow and the column under it (closer, farther, the track shown, the moon) 44 px or more, inside the
    // screen, none over another or the title, the column upright at the right, lying at the left; a country's card (Japan) upright from the
    // bottom the screen's width, lying at the right the screen's height (the title left of it); a track's card (Suzuka): Select and Race!
    // in sight without scrolling; the names over no button, no card and no other
    await page.click('.thead .globe');
    const zOpen = await zem(page, 1).then(() => null).catch(async () => page.evaluate(() => { const R = MenuZemlja._R(); return { open: MenuZemlja.isOpen(), depth: MenuZemlja.depth(), quick: MenuIzbor.isOpen(), hist: history.state && history.state.nazaj, R: R && { n: R.n, moving: R.moving, d: R.d, off: R.off, offT: R.offT, nt: R.nt } }; }));
    if (zOpen) T.check(`${w}x${h}: the Earth opens from the head's globe and comes to rest`, false, JSON.stringify(zOpen) + ' ' + real(errors).join(' | '));   // (what was there, not a hang of the whole test)
    else {
      const ZB = `const z = root.querySelector(".zem"), rc = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }, q = (s) => rc(z.querySelector(s));
        const k = z.querySelector(".zem-card.on"), body = k && k.querySelector(".izb-body");
        return { side: z.classList.contains("side"), back: q(".zem-back"), col: [...z.querySelectorAll(".zem-zoom")].map(rc), tb: q(".zem-title b"), ts: q(".zem-title small"), cv: q("canvas"),
          x: k && rc(k.querySelector(".izb-head [data-x]")), bk: k && rc(k.querySelector(".izb-head [data-back]")), btns: k ? [...k.querySelectorAll(".izb-btns button")].map(rc) : [], body: body && rc(body), W: innerWidth, H: innerHeight };`;
      const y1 = await ev(page, EARTH), u1 = await ev(page, ZB);
      const big = (r) => !!r && r[2] - r[0] >= 43.5 && r[3] - r[1] >= 43.5, scr = (r) => !!r && r[0] >= -0.5 && r[1] >= -0.5 && r[2] <= u1.W + 0.5 && r[3] <= u1.H + 0.5, sqs = [u1.back].concat(u1.col);
      T.check(`${w}x${h}: the Earth over the whole screen; the back arrow and the column under it (closer, farther, the track shown, the moon) 44 px or more, inside the screen, none over another or the title, the column at the ${side ? 'left' : 'right'}; the title inside the screen; the names over no button and no other`,
        u1.side === side && u1.cv[0] <= 0.5 && u1.cv[1] <= 0.5 && u1.cv[2] >= u1.W - 0.5 && u1.cv[3] >= u1.H - 0.5 && u1.col.length === 4 && sqs.every(r => big(r) && scr(r)) && sqs.every((a, i) => sqs.every((b, j) => i === j || !hit(a, b))) &&
        u1.col.every(r => r[1] >= u1.back[3] && (side ? r[2] < u1.W / 2 : r[0] > u1.W / 2)) && scr(u1.tb) && scr(u1.ts) && sqs.every(r => !hit(r, u1.tb) && !hit(r, u1.ts)) && y1.names.length >= 1 && clean(y1),
        JSON.stringify({ u1, names: y1.names.map(n => n.c) }));
      await ev(page, 'root.querySelector(".zl.c[data-c=\\"Japan\\"]").click();'); await zem(page, 2);
      const y2 = await ev(page, EARTH), u2 = await ev(page, ZB);
      const cardAt = (c) => side ? Math.abs(c[2] - u2.W) < 1 && Math.abs(c[1]) < 1 && Math.abs(c[3] - u2.H) < 1 && Math.abs(c[2] - c[0] - Math.min(412, u2.W * 0.6)) < 2
        : Math.abs(c[0]) < 1 && Math.abs(c[2] - u2.W) < 1 && Math.abs(c[3] - u2.H) < 1 && c[1] >= Math.max(u2.H - 460, u2.H <= 700 ? 120 : 150) - 0.5;
      await page.click('.zem-card .izb-t[data-t="suzuka"]'); await zem(page, 3);
      const y3 = await ev(page, EARTH), u3 = await ev(page, ZB);
      T.check(`${w}x${h}: on the Earth a country's card (Japan) ${side ? 'at the right, the screen\'s height, the title left of it' : 'from the bottom, the screen\'s width'}, its cross 44 px or more, no name over it; a track's card (Suzuka): Select and Race! in sight without scrolling, 44 px or more; its back arrow and cross 44 px or more`,
        !!y2.card && cardAt(y2.card.r) && big(u2.x) && clean(y2) && (!side || (u2.tb[2] <= y2.card.r[0] && u2.ts[2] <= y2.card.r[0])) && !!y3.card && cardAt(y3.card.r) && u3.btns.length === 2 &&
        u3.btns.every(b => b[1] >= u3.body[1] - 0.5 && b[3] <= u3.body[3] + 0.5 && b[3] <= u3.H + 0.5 && b[3] - b[1] >= 43.5) && big(u3.bk) && big(u3.x) && clean(y3),
        JSON.stringify({ c2: y2.card && y2.card.r, x2: u2.x, tb: u2.tb, ts: u2.ts, c3: y3.card && y3.card.r, body: u3.body, btns: u3.btns, bk: u3.bk, x3: u3.x }));
      await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await zem(page, 0);
    }
    T.check(`${w}x${h}: no page errors`, !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 6b. on its side the carousel (docs/meni-izbira-proge.md point 9, sklop 10) and upright the picture's swipe: an arrow (›) turns the cards
  //     one track on in ~300 ms (on the way the old track still chosen and the card's things fading; then the next track, its screen under
  //     the old one, which fades and goes; the arrow keeps the focus), a tap on a neighbour's card turns to it, a swipe across the card far
  //     enough turns on from where it was let go (also begun on a weather button: no weather chosen), a short one or one up the screen goes
  //     back; the weather chosen slides to the first place of its row; the Earth opened in a turn ends it at once; a track picked in the quick
  //     list turns in from its side; upright the picture follows the finger, a swipe far enough goes to the next track, a short one slides back
  {
    const { ctx, page, errors } = await open({ track: 'spa', lastTrack: 'spa' }, { width: 892, height: 412 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race'); await page.waitForTimeout(600);
    // (every frame until the carousel is at rest again after it moved, at most ms: the track, the carousel's state, the chosen card's --ui
    // (its things' opacity), the track screens (2: the old one fading). A track's first screen may hold the page a few seconds here (software
    // WebGL: the GPU's work waited for), upright as on its side: the time of the turn itself is not measured to the ms)
    const watch = (ms) => page.evaluate((ms) => new Promise((res) => {
      const root = document.getElementById('menu-host').shadowRoot, t0 = performance.now(), out = []; let moved = false;
      const step = () => {
        const d = Menu.debug(), st = root.querySelector('#track-stage'), u = st ? st.style.getPropertyValue('--ui') : '';
        const s = Object.assign({ t: Math.round(performance.now() - t0), id: d.list[d.trackIdx], ui: u === '' ? 1 : +u, scr: root.querySelectorAll('#s-track').length }, d.ring), busy = s.turning || s.held || s.fading || s.scr > 1;
        out.push(s); moved = moved || busy;
        if (performance.now() - t0 < ms && !(moved && !busy)) requestAnimationFrame(step); else res(out);
      };
      requestAnimationFrame(step);
    }), ms);
    const now = () => page.evaluate(() => { const d = Menu.debug(); return { id: d.list[d.trackIdx], i: d.trackIdx, list: d.list, ring: d.ring }; });
    const idle = (s) => !s.turning && !s.held && !s.fading, last = (w) => w[w.length - 1];
    const a0 = await now(), n = a0.list.length, next = a0.list[(a0.i + 1) % n];
    await page.click('.rarw.r'); const w1 = await watch(10000);
    const l1 = w1.findIndex(s => s.id !== 'spa'), foc = await ev(page, 'const a = root.activeElement; return !!a && a.classList.contains("rarw") && a.classList.contains("r");');
    T.check('on its side an arrow (›) turns the cards one track on in ~300 ms: on the way the old track still chosen and the card\'s things fading, then the next track, the old screen fading over it and gone; the arrow keeps the focus',
      a0.ring.on && a0.id === 'spa' && w1.some(s => s.turning && s.id === 'spa' && s.p > 0.05 && s.p < 0.95 && s.ui < 0.9) && l1 > 0 && w1[l1].t >= 100 && w1[l1].t <= 2000 && w1[l1].id === next &&
      w1.some(s => s.fading && s.scr === 2) && idle(last(w1)) && last(w1).scr === 1 && foc, JSON.stringify({ a0: a0.id, l1: w1[l1], w1: w1.map(s => [s.t, s.id, s.p, +s.turning, +s.fading, s.ui, s.scr]), foc }));
    await page.click('.rcard[data-k="-1"]'); const w2 = await watch(10000);
    T.check('a tap on the left neighbour\'s card turns the cards back to it (Spa)', w2.some(s => s.turning) && last(w2).id === 'spa' && idle(last(w2)), JSON.stringify(w2.map(s => [s.t, s.id, s.p])));
    // the finger (the mouse) across the card: far enough to the left, then from a weather button to the right, then a short way, then up
    const c = await ev(page, 'const r = root.querySelector("#track-stage").getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];');
    const drag = async (x, y, dx, dy, k) => { await page.mouse.move(x, y); await page.mouse.down(); for (let i = 1; i <= k; i++) { await page.mouse.move(x + dx * i, y + dy * i); await page.waitForTimeout(16); } const h = await now(); await page.mouse.up(); return h; };
    const h1 = await drag(c[0], c[1], -22, 0.5, 6), w3 = await watch(10000);
    T.check('a swipe across the card to the left: the cards follow the finger, let go far enough they turn on from there to the next track',
      h1.ring.held && h1.ring.p > 0.3 && h1.ring.p < 0.6 && h1.id === 'spa' && last(w3).id === next && idle(last(w3)), JSON.stringify({ h1: h1.ring, end: last(w3) }));
    const wb = await ev(page, 'const b = root.querySelector("#track-stage .wxv > button[aria-pressed=\\"false\\"]"), r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, b.dataset.act];');
    const wxOn = () => ev(page, 'return root.querySelector("#track-stage .wxv > [aria-pressed=\\"true\\"]").dataset.act;'), wx0 = await wxOn();
    await drag(wb[0], wb[1], 22, 0, 6); const w4 = await watch(10000), wx1 = await wxOn();
    T.check('a swipe to the right begun on a weather button: the cards turn back (Spa), no weather chosen', last(w4).id === 'spa' && idle(last(w4)) && wx1 === wx0, JSON.stringify({ end: last(w4), wb, wx0, wx1 }));
    const h2 = await drag(c[0], c[1], 10, 0, 3), w5 = await watch(10000), h3 = await drag(c[0], c[1], 0.75, 10, 4); await page.waitForTimeout(300); const a5 = await now();
    T.check('a short swipe: the cards follow it, let go they go back (the same track); a move up the screen is no swipe',
      h2.ring.held && h2.ring.p < 0 && last(w5).id === 'spa' && idle(last(w5)) && last(w5).p === 0 && !h3.ring.held && a5.id === 'spa' && idle(a5.ring), JSON.stringify({ h2: h2.ring, end: last(w5), h3: h3.ring, a5: a5.ring }));
    // the weather's row on the card: the choice slides to its first place, the others after it in their order
    await page.waitForTimeout(450);   // (the tap a swipe ends with: not a tap for 400 ms)
    // (that it slid is told by the slides' own event, transitionrun of a button's transform, counted from before the tap, not by the transform
    // read in flight after it: on a machine without a graphics chip Snow's first frames are long, the game's world toned for winter, and
    // two of them can take all of the slide's 300 ms, so that the first read finds it over, none, though it was)
    await ev(page, 'window.__wxRun = 0; window.__wxL = (e) => { if (e.propertyName === "transform" && e.target.matches(".wxv > [data-act^=\\"weather:\\"]")) window.__wxRun++; }; root.addEventListener("transitionrun", window.__wxL);');
    await page.click('#track-stage .wxv .w-snow');
    // (the slide's 300 ms, from the frame after the tap: until it is over, 5 s at most)
    await page.waitForFunction(() => window.__wxRun > 0 && [...document.getElementById('menu-host').shadowRoot.querySelectorAll('#track-stage .wxv > [data-act^="weather:"]')].every(b => getComputedStyle(b).transform === 'none'), null, { timeout: 5000 }).catch(() => null);
    const slid = await ev(page, 'root.removeEventListener("transitionrun", window.__wxL); return window.__wxRun;');
    const wr = await ev(page, 'return [...root.querySelectorAll("#track-stage .wxv > [data-act^=\\"weather:\\"]")].map(b => [b.dataset.act, b.getAttribute("aria-pressed"), b.getBoundingClientRect().left, getComputedStyle(b).transform]);');
    T.check('the weather chosen (Snow) slides to the first place of its row, the others after it in their order (Dry, Rain, Changing, Storm); then nothing moving',
      slid > 0 && [...wr].sort((a, b) => a[2] - b[2]).map(b => b[0]).join() === 'weather:snow,weather:dry,weather:rain,weather:change,weather:storm' && wr.find(b => b[0] === 'weather:snow')[1] === 'true' && wr.every(b => b[3] === 'none'), JSON.stringify({ slid, wr }));
    // the Earth opened in a turn: the turn done at once (the next track), no old screen left over it; the screen rests under the Earth. (Opened
    // as the turn begins, before its frames: a machine without a graphics chip, as the tests', can take longer than the turn's 300 ms for a
    // few of them, a flag's edge read the first time, flagFill, a second or more, and the turn would be over before the Earth came)
    const e1 = await page.evaluate(() => {
      const root = document.getElementById('menu-host').shadowRoot, d0 = Menu.debug();
      root.querySelector('.rarw.r').click();
      const m = Menu.debug(); root.querySelector('.thead .globe').click(); const d = Menu.debug();
      return { from: d0.list[d0.trackIdx], mid: Object.assign({ id: m.list[m.trackIdx] }, m.ring), id: d.list[d.trackIdx], ring: d.ring, scr: root.querySelectorAll('#s-track').length };
    });
    const zOk = await zem(page, 1).then(() => true).catch(() => false), zr = zOk && await ev(page, 'return !!root.querySelector("#s-track.rested") && MenuZemlja.isOpen();');
    T.check('the Earth opened in a turn: the turn done at once (the next track), no old screen left; the screen rests under the Earth',
      e1.from === 'spa' && e1.mid.turning && e1.mid.id === 'spa' && e1.id === next && idle(e1.ring) && e1.scr === 1 && zr, JSON.stringify({ e1, zOk, zr }));
    await page.keyboard.press('Escape'); await zem(page, 0).catch(() => null); await page.waitForTimeout(300);
    // a track picked in the quick list (Japan, Suzuka, Select): its card turns in from its side
    await page.evaluate(() => { Core.TRACKS.find(d => d.id === 'iroha').pending = false; });   // (as in 6: Japan's list two tracks, Suzuka and Irohazaka; Irohazaka after the real ones, Spa's place in the list kept)
    await page.click('.trow .flag button');
    await page.waitForFunction(() => window.MenuIzbor && MenuIzbor.isOpen() && MenuIzbor.depth() === 1 && document.getElementById('menu-host').shadowRoot.querySelector('.izb.on'), null, { timeout: 10000 });
    await page.click('.izb-c[data-c="Japan"]'); await page.waitForFunction(() => MenuIzbor.depth() === 2, null, { timeout: 10000 });
    await page.click('.izb-t[data-t="suzuka"]'); await page.waitForFunction(() => MenuIzbor.depth() === 3, null, { timeout: 10000 });
    await page.click('.izb-sel'); const w6 = await watch(10000);
    const izOff = await page.waitForFunction(() => !MenuIzbor.isOpen(), null, { timeout: 10000 }).then(() => true).catch(() => false);
    T.check('a track picked in the quick list (Suzuka): its card turns in from its side, then rests; the list closed',
      w6.some(s => s.turning && s.id === 'suzuka' && Math.abs(s.p) > 0.05) && last(w6).id === 'suzuka' && idle(last(w6)) && izOff, JSON.stringify({ w6: w6.map(s => [s.t, s.id, s.p, +s.turning, +s.fading, s.scr]), izOff }));
    // the car with the cards (sklop 11): the old one out to the side they go (half its place in 260 ms), a picture of it; the new one in from
    // the other side (460 ms after 160 ms), its shadow when it stands; then nothing moving
    const ca = await page.evaluate((src) => new Promise((res) => {
      const root = document.getElementById('menu-host').shadowRoot, kf = (0, eval)(src), one = (e) => (kf(e) || [])[0] || '', t0 = performance.now();
      root.querySelector('.rarw.r').click();
      const step = () => {
        const d = Menu.debug(), S = [...root.querySelectorAll('#mn > #s-track')];
        if (d.ring.fading && S.length === 2) {
          const ny = S[0].querySelector('.yard'), oy = S[1].querySelector('.yard'), c = ny.querySelector(':scope > .car');
          res({ id: d.list[d.trackIdx], in: ['.car', '.cname', 'canvas.c3d'].map(k => one(ny.querySelector(':scope > ' + k))), sign: one(ny.querySelector(':scope > .sign')), out: [...oy.querySelectorAll(':scope > .car, :scope > .cname, :scope > canvas.c3d')].map(one),
            snap: !!oy.querySelector(':scope > canvas.c3d.snap'), step: c.getBoundingClientRect().width / 2, sh: MenuCar.info().shadow });
        } else if (performance.now() - t0 < 10000) requestAnimationFrame(step); else res(null);
      };
      requestAnimationFrame(step);
    }), KF);
    const caEnd = await page.waitForFunction(() => { const i = MenuCar.info(), d = Menu.debug(); return !d.arrive && !d.ring.fading && !d.ring.turning && i.shadow && i.shadow.opacity === 1; }, null, { timeout: 20000 }).then(() => true).catch(() => false);
    const cx = (v) => 'translateX(' + v.toFixed(0) + 'px)';
    T.check('on its side the car with the cards: the old one (a picture of it) out to the left, half its place in 260 ms; the new one in from the right in 460 ms after 160 ms, its shadow when it stands (no sign lying); then nothing moving',
      ca && ca.snap && ca.out.length === 3 && ca.out.every(x => x === 'none ' + cx(-ca.step) + ' 0 260') && ca.in.every(x => x === cx(ca.step) + ' none 160 460') && !ca.sign && ca.sh && ca.sh.opacity === 0 && caEnd, JSON.stringify({ ca, caEnd }));
    T.check('no page errors in the carousel', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page, errors } = await open({ track: 'spa', lastTrack: 'spa' }, { width: 412, height: 892 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race'); await page.waitForTimeout(600);
    const at = () => page.evaluate(() => { const d = Menu.debug(); return { id: d.list[d.trackIdx], next: d.list[(d.trackIdx + 1) % d.list.length], ring: d.ring }; });
    const tf = () => ev(page, 'return root.querySelector("#track-stage .dio").style.transform;'), px = (t) => { const m = /^translateX\((-?[\d.]+)px\)$/.exec(t); return m ? +m[1] : NaN; };
    const c = await ev(page, 'const r = root.querySelector("#track-stage .dio").getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];');
    const drag = async (dx, k) => { await page.mouse.move(c[0], c[1]); await page.mouse.down(); for (let i = 1; i <= k; i++) { await page.mouse.move(c[0] + dx * i, c[1]); await page.waitForTimeout(16); } const t = await tf(); await page.mouse.up(); return t; };
    const p0 = await at(), t1 = await drag(-20, 5); await page.waitForTimeout(500); const p1 = await at();
    const t2 = await drag(10, 3); await page.waitForTimeout(450); const t3 = await tf(), p2 = await at();
    T.check('upright: no carousel; the picture follows the finger (0.35 of the way), a swipe far enough to the left goes to the next track, a short one slides back (the same track)',
      !p0.ring.on && Math.abs(px(t1) + 35) < 0.1 && p1.id === p0.next && Math.abs(px(t2) - 10.5) < 0.1 && t3 === '' && p2.id === p0.next, JSON.stringify({ p0, t1, p1: p1.id, t2, t3, p2: p2.id }));
    T.check('upright: no page errors with the swipe', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 8. the pictures already seen stay without internet (sw.js keeps them as they are looked at)
  {
    const { ctx, page, errors } = await open({ track: 'nring', lastTrack: 'nring' });   // (a track with a map from above)
    await ready(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); await ready(page);   // (the service worker in charge of the page: the pictures it asks for are kept)
    await click(page, 'single'); await click(page, 'mode:race'); await click(page, 'cam:1'); await page.waitForTimeout(400);   // (the map from above, camera 1, the one the step opens with: its webp images are kept by sw.js; the videos are not kept)
    const files = await ev(page, 'return [...root.querySelectorAll("#track-stage image, #track-stage img")].map(e => e.getAttribute("href") || e.getAttribute("src"));');
    await page.waitForFunction(async (n) => { const k = (await caches.keys()).find(x => /pictures/.test(x)); return !!k && (await (await caches.open(k)).keys()).length >= n; }, files.length, { timeout: 30000 }).catch(() => null);
    srv.setOffline(true);
    await page.reload().catch(() => null); await ready(page).catch(() => null);
    await click(page, 'single'); await click(page, 'mode:race'); await click(page, 'cam:1').catch(() => null); await page.waitForTimeout(400);   // (the map again: its images come from the cache)
    const off = await page.waitForFunction(() => { const root = document.getElementById('menu-host').shadowRoot, i = root.querySelector('#track-stage'); return !!i && root.querySelector('.where .w2') ? true : false; }, null, { timeout: 20000 }).then(() => true).catch(() => false);
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

  // 10. the car in the yard tapped (or its name over it): the garage with it, in its colour (here a stand-in page that goes back as the
  // garage's buttons do: its back index.html?zaslon=avto&avto=<id>, its Izberi progo with &naprej=proga), then straight the track step
  // again, the same track (stran Odločitve m8, 2: not the game's car screen), on the garage's car (here another one for Izberi progo)
  {
    // (the game's track a real one, Spa: the page's settings are set again on each load (lib.mjs), and with Jezero, the tests' own track, hidden
    // behind NEUPORABNO, the game would come back from the garage on Jezero, rightly on NEUPORABNO's list, not on the track the step showed)
    const { ctx, page, errors } = await open({ track: 'spa' });
    await ready(page);
    let gar = null, way = 'back', other = '';
    await page.route('**/garaza.html*', (r) => { gar = r.request().url(); r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><script>location.replace("index.html?zaslon=avto&avto=" + ' +
      (way === 'back' ? 'new URLSearchParams(location.search).get("car")' : JSON.stringify(other) + ' + "&naprej=proga"') + ')</script>' }); });
    const car0 = await page.evaluate(() => ({ id: Core.MODELS[__game.S.car].id, hex: [0xd81f2a, 0xf5f5f0, 0x1c5fd6, 0xf2c230, 0x1a1a1f, 0x2fa84f, 0xff7a1a, 0x8e3bd6][__game.S.color].toString(16).padStart(6, '0') }));
    other = await page.evaluate((id) => Core.MODELS.find(m => !m.retired && m.id !== id).id, car0.id);   // (the garage's other car: Izberi progo on it)
    for (const w of ['back', 'next']) {
      way = w;
      await click(page, 'single'); await click(page, 'mode:race'); await page.waitForTimeout(300);
      const was = await ev(page, 'return root.querySelector(".where .w2").textContent;');
      const dz = await page.evaluate(() => { const d = Core.TRACKS.find(d => d.id === __game.S.track); return d && /, /.test(d.name) ? d.name.split(', ').pop() : ''; });   // (the track chosen when the garage opens: its country, the flag on the garage's IZBERI PROGO)
      const car1 = await page.evaluate(() => Core.MODELS[__game.S.car].id);
      gar = null;
      // (the name: a real click at its middle, after a look that it is a button on top there: a plain span, its listener far up, is no
      // target to a phone's touch adjustment and its tap went elsewhere)
      const nm = w === 'back' ? null : await ev(page, 'const e = root.querySelector(".yard .cname"), b = e.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2; return { tag: e.tagName, top: root.elementFromPoint(x, y) === e, x, y };');
      if (nm) T.check('the car\'s name over it: a button of its own, on top at its middle', nm.tag === 'BUTTON' && nm.top, JSON.stringify(nm));
      await Promise.all([page.waitForURL(/index\.html\?zaslon=avto/, { timeout: 60000 }), nm ? page.mouse.click(nm.x, nm.y) : page.evaluate(() => document.getElementById('menu-host').shadowRoot.querySelector('.yard .car').click())]);
      const there = await page.waitForFunction(() => window.__game && __game.screen === 'track' && window.Menu && Menu.ready && Menu.debug().screen === 'track' && document.getElementById('menu-host').shadowRoot.querySelector('#s-track .where'), null, { timeout: 120000 }).then(() => true, () => false);
      if (!there) {   // (seen on GitHub now and then, never locally: the page's state and its errors in the log, not a test stopped without them)
        T.check(`back from the garage [${w}]: the track step within 120 s`, false, JSON.stringify(await pageState(page)) + ' — ' + errors.slice(-10).join(' | '));
        break;
      }
      await page.waitForTimeout(400);
      const g = await page.evaluate(() => ({ car: Core.MODELS[__game.S.car].id, url: location.search, shown: [...document.querySelectorAll('.screen.show')].map(e => e.id).join() }));
      const back = await ev(page, 'return { h1: root.querySelector(".where .w2") && root.querySelector(".where .w2").textContent, name: root.querySelector(".yard .cname") && root.querySelector(".yard .cname").textContent };');
      const want = w === 'back' ? car0.id : other, wname = await page.evaluate((id) => Core.MODELS.find(m => m.id === id).name, want);
      T.check(`the yard's ${w === 'back' ? 'car' : 'car\'s name'} tapped: the garage with it (garaza.html?car=<id>&color=<its colour>&drzava=<the track's country>), its ${w === 'back' ? 'back' : 'Izberi progo'}: the track step again, the same track, on the garage's car, its name over it (the address plain again)`,
        gar && gar.endsWith('/garaza.html?car=' + car1 + '&color=' + car0.hex + (dz ? '&drzava=' + encodeURIComponent(dz) : '')) && g.car === want && g.url === '' && g.shown === 's-menu' && back.h1 === was && back.name === wname,
        JSON.stringify({ gar, car0, car1, dz, g, was, back, want, wname }));
      await page.click('.thead [data-act="back"]'); await click(page, 'tsub:');   // (the main menu: the modes, then their back)
    }
    T.check('the garage and back: no page errors', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 11. no WebGL for the yard's car (the device has none to spare, or it is lost): the car's picture instead, and still the garage
  {
    const { ctx, page, errors } = await open();
    await ready(page);
    await page.evaluate(() => { const g0 = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, a) { return this.classList.contains('c3d') && /webgl/.test(t) ? null : g0.call(this, t, a); }; });
    await click(page, 'single'); await click(page, 'mode:race');
    await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.yard .car img'), null, { timeout: 30000 }).catch(() => null);
    const f = await ev(page, 'const y = root.querySelector(".yard"); return { img: !!y.querySelector(".car img"), cv: !!y.querySelector("canvas.c3d"), act: y.querySelector(".car").dataset.act, i: MenuCar.info() };');
    T.check('no WebGL for the yard\'s car: its picture, no canvas, the tap still the garage', f.img && !f.cv && f.act === 'garage' && f.i.failed && !f.i.on, JSON.stringify(f));
    T.check('no WebGL for the yard\'s car: no page errors', !real(errors).filter(e => !/WebGL/.test(e)).length, real(errors).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close(); await srv.close();
}
T.done();
