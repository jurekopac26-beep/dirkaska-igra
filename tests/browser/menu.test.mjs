// The new menu (js/menu.js, css/menu.css, in a shadow root over the game): the title (Single race, Multiplayer, Career, Settings,
// Leaderboard, Credits), the six modes (Elimination and Pursuit: Zabava), the tracks of every mode in one list that goes round (the real ones from the shortest to the
// longest, then the test tracks; each with its pictures in the stage's three cameras: 1 the map from above, 2 the flyover with the height
// graph, 3 the corner's video, else the model of the land), the track step's head, row of numbers, road sign and neighbours
// (docs/meni-izbira-proge.md), the weather and the race options, the car in 3D with the wind round it
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
  const click = (page, act) => page.click(`[data-act="${act}"]`);
  const done = (page) => page.click('.sheet .go[data-act="close-sheet"]');   // (a sheet's Done button)
  const shown = (page) => page.evaluate(() => [...document.querySelectorAll('.screen.show')].map(e => e.id));
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

  // 1. the title: the menu is the screen on show; a new player's track is a real one, not the test track the game starts on
  {
    const { ctx, page, errors } = await open();
    await ready(page);
    const t = await ev(page, 'return { tiles: [...root.querySelectorAll(".tile b")].map(e => e.textContent), small: [...root.querySelectorAll(".tsmall span")].map(e => e.textContent), sub: root.querySelector(".t-single small").textContent, logo: root.querySelector(".logo").textContent };');
    T.check('the title: Single race, Multiplayer, Career; Settings and Leaderboard; the logo', JSON.stringify(t.tiles) === '["SINGLE RACE","MULTIPLAYER","CAREER"]' && t.small.includes('Settings') && t.small.includes('Leaderboard') && /REAL ROADS ATLAS\s*RACING GAME/i.test(t.logo), JSON.stringify(t));
    T.check('the menu is the screen on show; a new player starts on a real track, not the test one (Jezero)', (await shown(page)).join() === 's-menu' && !/Jezero/.test(t.sub) && /Circuit race/.test(t.sub), t.sub);

    // 2. the modes
    await click(page, 'single');
    const m = await ev(page, 'return [...root.querySelectorAll(".t-sub .mode b")].map(e => e.textContent);');
    T.check('Single race: the six modes (Elimination and Pursuit: Zabava, docs/zabava.md)', JSON.stringify(m) === '["Circuit race","Police chase","Time trial","Traffic duel","Elimination","Pursuit"]', JSON.stringify(m));

    // 3. the tracks of every mode: one list, no groups (the real tracks from the shortest to the longest, then the test tracks; equal
    //    lengths by id), every track with its picture in camera 2 (the flyover, else its model, and the height graph), the list going
    //    round (after the last track the first again); the first time a track is met, its pictures in cameras 1 (the map, else the model)
    //    and 3 (the corner's video and its poster, else the model) too
    const MODES = [['race', 'race'], ['chase', 'police'], ['trial', 'tt'], ['duel', 'traffic']], roads = {}, heads = {}, cams = {};   // (heads: every track's globe and height graph, of every mode; cams: every track's pictures in cameras 1 and 3)
    // the stage's picture as it is now: its kind and its files (a video's poster and the video)
    const PIC = `const st = root.querySelector('#track-stage'), map = st.querySelector('.dio.topmap'), v = st.querySelector('.dio.fly video, .dio.corner video');
      if (v) return { kind: v.closest('.corner') ? 'corner' : 'flyover', files: [v.getAttribute('poster'), v.getAttribute('src')], loop: v.loop && v.muted };
      return { kind: map ? 'map' : st.querySelector('.dio img') ? 'model' : 'none', files: [...st.querySelectorAll('.dio img, .dio image')].map(e => e.getAttribute('src') || e.getAttribute('href')) };`;
    for (const [mode, gm] of MODES) {
      await click(page, 'mode:' + mode); await click(page, 'cam:2');
      const exp = await page.evaluate((gm) => {
        const L = window.MENU.lens, ds = Core.TRACKS.filter(d => !d.variantOf && (d.modes || (d.timeTrial ? ['tt'] : ['race'])).includes(gm));
        const rk = (d) => d.test ? 2 : d.pending ? 1 : 0;   // (the real ones, the ones awaiting the user's choice, the test tracks)
        ds.sort((a, b) => (rk(a) - rk(b)) || (L[a.id] - L[b.id]) || (a.id < b.id ? -1 : 1));
        return { ids: ds.map(d => d.id), roads: ds.filter(d => d.open && !d.test && !d.rally && !d.descent).length, lens: ds.every(d => L[d.id] > 0) };
      }, gm);
      const list = await page.evaluate(() => Menu.debug().list), groups = await ev(page, 'return !!root.querySelector(".groups");');
      T.check(`${mode}: one list of the game's tracks (${exp.ids.length}), the real ones from the shortest to the longest, then the ones awaiting the choice (pending), then the test tracks; no groups`, exp.lens && !groups && JSON.stringify(list) === JSON.stringify(exp.ids), JSON.stringify({ list, exp: exp.ids }));
      roads[mode] = exp.roads;
      if (mode === 'trial') T.check(`every open road in Circuit race as in Time trial (${roads.race} and ${roads.trial}: Pikes Peak too; the open roads that became test tracks on 4., 5. and 6. 11. 2026 are left out: the USA's but Pikes Peak, Vršič, Mount Buller, Sani Pass)`, roads.race === roads.trial && roads.race >= 9, JSON.stringify(roads));
      const first = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; });
      let seen = 0; const bad = [], urls = new Set();
      for (let k = 0; k < exp.ids.length; k++) {
        // the picture on the stage: the map from above (an svg image), or the model of the land (an img): loaded
        const r = await page.waitForFunction(() => {
          const root = document.getElementById('menu-host').shadowRoot, st = root.querySelector('#track-stage'), name = root.querySelector('.where .w2').textContent;
          const imgs = [...st.querySelectorAll('.dio img')], map = st.querySelector('.dio.topmap'), fly = st.querySelector('.dio.fly video'), files = [...st.querySelectorAll('.dio img, .dio image')].map(e => e.getAttribute('src') || e.getAttribute('href'));
          // the head's globe (drawn once the Earth has come: every track with a country) and the height graph at the stage's foot
          const w1 = root.querySelector('.where .w1').firstChild, ctry = w1 && w1.nodeType === 3 ? w1.textContent.replace(/,\s*$/, '') : '', gl = root.querySelector('.thead .globe canvas'), gr = st.querySelector('.hgraph svg');
          if (ctry && !gl) return null;
          const head = { id: Menu.debug().list[Menu.debug().trackIdx], ctry, sign: (root.querySelector('.yard .sign') || {}).textContent || '', globe: gl ? gl.dataset.country : '', graph: gr ? [...gr.querySelectorAll('text.lo, text.hi')].map(e => e.textContent) : null, km: gr ? [...gr.querySelectorAll('text.km')].map(e => e.textContent).pop() : '' };
          if (fly) return { name, kind: 'flyover', files: [fly.getAttribute('poster'), fly.getAttribute('src')].filter(Boolean), head };   // (camera 2 on a track with a flyover: its video, with its poster)
          if (map) return { name, kind: 'map', files, head };
          if (imgs.length && imgs.every(i => i.complete && i.naturalWidth > 0)) return { name, kind: 'model', files, head };
          return null;
        }, null, { timeout: 20000 }).then(h => h.jsonValue()).catch(() => ({ name: '?', kind: 'none' }));
        seen++; if (r.kind === 'none' || r.kind === 'map') bad.push(k); for (const f of r.files || []) urls.add(f);
        if (r.head) heads[mode + ':' + r.head.id] = r.head;
        if (r.head && !cams[r.head.id]) {   // (cameras 1 and 3, the first time the track is met)
          await click(page, 'cam:1'); const c1 = await ev(page, PIC); await click(page, 'cam:3'); const c3 = await ev(page, PIC); await click(page, 'cam:2');
          cams[r.head.id] = { c1, c3 }; for (const f of c1.files.concat(c3.files)) urls.add(f);
        }
        await click(page, 'track:1');
      }
      const again = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; });
      const gone = await page.evaluate(async (list) => { const out = []; for (const u of list) { try { if (!(await fetch(u, { method: 'HEAD' })).ok) out.push(u); } catch (_) { out.push(u); } } return out; }, [...urls]);
      T.check(`${mode}: every track shows its picture (${seen} tracks, ${urls.size} picture files, none missing); after the last the first again`, !bad.length && !gone.length && seen === exp.ids.length && again === first, JSON.stringify({ bad, gone, first, again }));
      await page.click('.foot [data-act="back"]');   // (back to the modes)
    }
    // every track's pictures in cameras 1 and 3: the map from above where the track has a route (routes.js), else its model; the corner's
    // video in a loop, muted, where MENU.corners has it (every real track, and Vršič: a test track since 6. 11. 2026 without a model), else (a
    // test track) its model
    const cx = await page.evaluate(() => ({ routes: Object.keys(window.ROUTES || {}), corners: window.MENU.corners || [], tests: Core.TRACKS.filter(d => d.test).map(d => d.id) }));
    const cbad = Object.entries(cams).filter(([id, c]) => c.c1.kind !== (cx.routes.includes(id) ? 'map' : 'model') || c.c3.kind !== (cx.corners.includes(id) ? 'corner' : 'model') || (c.c3.kind === 'corner' && !(c.c3.loop && c.c3.files[0] === 'assets/maps/corner-' + id + '.webp' && c.c3.files[1] === 'assets/maps/corner-' + id + '.webm'))).map(([id, c]) => id + ':' + c.c1.kind + '/' + c.c3.kind);
    const real0 = Object.keys(cams).filter(id => !cx.tests.includes(id)), nocorner = real0.filter(id => !cx.corners.includes(id));
    T.check(`every track (${Object.keys(cams).length}): camera 1 its map (else its model), camera 3 its corner's video in a loop with its poster (else its model); every real track (${real0.length}) has its corner's video`, Object.keys(cams).length >= 47 && !cbad.length && !nocorner.length && cx.corners.every(id => !cx.tests.includes(id) || id === 'vrsic'), JSON.stringify({ cbad, nocorner }));
    // every track of every mode: its height graph across the stage's foot in camera 2 (the flyover, or the model where a track has none), a
    // real track's with its lowest and highest heights and the kilometres under it; its country gold on the head's globe
    const tests = await page.evaluate(() => Core.TRACKS.filter(d => d.test).map(d => d.id)), H = Object.values(heads);
    const nograph = H.filter(x => !x.graph || (!tests.includes(x.id) && (x.graph.length !== 2 || !x.graph.every(t => /^-?\d[\d,]* m$/.test(t)) || !/ km$/.test(x.km)))).map(x => x.id + ':' + JSON.stringify(x.graph));
    T.check(`every track of every mode (${H.length}) has its height graph; a real one's with its lowest and highest heights and the kilometres`, H.length >= 90 && !nograph.length, nograph.join(', '));
    const withC = H.filter(x => x.ctry), noglobe = withC.filter(x => x.globe !== x.ctry).map(x => x.id + ':' + x.ctry + '/' + x.globe);
    T.check(`every track with a country (${withC.length} of ${H.length}: the test tracks Copper Forest and Thunder Cape have none) has its globe in the head, that country gold on it`, withC.length >= 90 && withC.length >= H.length - 4 && !noglobe.length, noglobe.join(', '));
    // the yard's road sign: TEST on a test track, PENDING on one awaiting the user's choice (pending: Australia's, one of them stays), neither
    // on a real one
    const pend = await page.evaluate(() => Core.TRACKS.filter(d => d.pending).map(d => d.id));
    const badSign = H.filter(x => pend.includes(x.id) ? !/PENDING$/.test(x.sign) : tests.includes(x.id) ? !/TEST$/.test(x.sign) : /(PENDING|TEST)$/.test(x.sign)).map(x => x.id + ':' + x.sign);
    T.check(`the yard's sign: TEST on every test track, PENDING on every track awaiting the choice (${pend.length}), neither on a real one`, pend.length >= 1 && H.some(x => pend.includes(x.id)) && !badSign.length, JSON.stringify(badSign));
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

  // 4. the track step (Nürburg): the head, the row of numbers, the road sign, the neighbours, the house; the weather and the race
  //    options, the car and its way back, the credits; then a race from the menu
  {
    const { ctx, page, errors } = await open({ track: 'nring', lastTrack: 'nring' });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    await page.waitForFunction(() => [...document.getElementById('menu-host').shadowRoot.querySelectorAll('.nb')].every(b => /^url\("?data:image\/png/.test(b.style.backgroundImage)), null, { timeout: 15000 }).catch(() => null);
    const scr = await ev(page, `const q = (s) => root.querySelector(s), d = Menu.debug(), n = d.list.length, i = d.trackIdx;
      return { head: q('.where').textContent.replace(/\\s+/g, ' ').trim(), home: !!q('.thead [data-act="home"]'), globe: !!q('.thead .globe'), old: !!(q('.topbar') || q('.groups') || q('.card') || q('.arrow') || q('.pcount')),
        row: [...root.querySelectorAll('.trow > div')].map(e => e.className + ':' + e.textContent), flag: q('.trow .flag img') && q('.trow .flag img').getAttribute('src'), sign: q('.yard .sign').textContent, car: !!q('.yard .car[data-act="garage"]'),
        nb: [...root.querySelectorAll('.nb')].map(b => [b.dataset.act, b.getAttribute('aria-label'), b.dataset.flag || '', /^url\\("?data:image\\/png/.test(b.style.backgroundImage)]), prev: d.list[(i - 1 + n) % n], next: d.list[(i + 1) % n], id: d.list[i],
        wx: [...root.querySelectorAll('.wxv [data-act^="weather:"]')].map(b => b.dataset.act.slice(8) + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')), more: !!q('.wxv [data-act="more-options"]') };`);
    const riv = await page.evaluate(() => { const d = Core.TRACKS.find(x => x.id === 'nring'); const M = Core.MODELS[__game.S.car]; return Core.fieldSize(M.oneMake ? null : M, d.raceRivals || d.rivals || 21); });
    T.check('the track step\'s head: the house, "GERMANY, NÜRBURG" and the height, the globe; no title bar, groups, card or arrows', scr.id === 'nring' && /^Germany, Nürburg \d[\d,]* m$/.test(scr.head) && scr.home && scr.globe && !scr.old, JSON.stringify(scr));
    T.check(`the row: Opponents ${riv}, Best lap, Length 20.69 km, Corners, the flag of Germany`, JSON.stringify(scr.row.slice(0, 3)) === JSON.stringify(['opp:Opponents' + riv, 'best:Best lap—', ':Length20.69 km']) && /^:Corners\d+$/.test(scr.row[3]) && scr.flag === 'assets/flags/germany.svg', JSON.stringify(scr.row));
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
    T.check('the weather down the stage: Dry, Rain, Changing, Storm (Dry chosen), and more options under it', JSON.stringify(scr.wx) === '["dry*","rain","change","storm"]' && scr.more, JSON.stringify(scr.wx));
    await page.click('.nb.r'); const nx = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; });
    await page.click('.nb.l'); const pv = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; });
    T.check('the neighbours tapped: the next track, then back to Nürburg', nx === scr.next && pv === 'nring' && (await page.evaluate(() => __game.S.track)) === 'nring', JSON.stringify({ nx, pv }));
    // the four cameras at the stage's top left: icons only (1 the map, 2 the flyover, 3 the corner, 4 the friends' times), the map (1) lit when the step opens,
    // its picture the map from above with no height graph; no mode ribbon on the stage
    const stageUI = await ev(page, 'const m = root.querySelector("#track-stage .cams"), pr = m && m.querySelector("button[aria-pressed=\\"true\\"]"), st = root.querySelector("#track-stage"), r = m && m.getBoundingClientRect(), sr = st.getBoundingClientRect(); return { btns: m ? [...m.querySelectorAll("button")].map(b => b.dataset.act + ":" + b.getAttribute("aria-label") + ":" + !!b.querySelector("svg")) : null, text: m ? m.textContent.trim() : "?", pressed: pr ? pr.dataset.act : "", at: r ? [r.left - sr.left, r.top - sr.top] : null, size: m ? [...m.querySelectorAll("button")].map(b => Math.round(b.getBoundingClientRect().width)) : null, map: !!st.querySelector(".dio.topmap"), graph: !!st.querySelector(".hgraph"), ribbon: !!st.querySelector(".ribbon") };');
    T.check('the track stage: four camera buttons at its top left, icons only (Map, Flyover, Corner camera, Friends), the map (1) lit when the step opens and shown without the height graph, no mode ribbon',
      JSON.stringify(stageUI.btns) === '["cam:1:Map:true","cam:2:Flyover:true","cam:3:Corner camera:true","cam:4:Friends:true"]' && stageUI.text === '' && stageUI.pressed === 'cam:1' && stageUI.at[0] < 20 && stageUI.at[1] < 20 && stageUI.size.every(x => x === 22) && stageUI.map && !stageUI.graph && !stageUI.ribbon, JSON.stringify(stageUI));
    // camera 2, the flyover: its video, only the start and the finish named over it (no places, no box with the place reached)
    await click(page, 'cam:2');
    const fl = await page.waitForFunction(() => { const root = document.getElementById('menu-host').shadowRoot, st = root.querySelector('#track-stage'), v = st.querySelector('.dio.fly video'), lab = st.querySelector('.flab');
      return v && lab && lab.children.length ? { src: v.getAttribute('src'), tags: [...lab.children].map(e => e.className), hud: !!st.querySelector('.hud'), cam: __game.S.menuCam } : null; }, null, { timeout: 20000 }).then(h => h.jsonValue()).catch(() => null);
    T.check('camera 2: the flyover, only the start and the finish named over it (no places, no box with the place and its height); the camera kept in the settings', fl && fl.src === 'assets/maps/fly-nring.webm' && JSON.stringify(fl.tags) === '["fl-s start","fl-s finish"]' && !fl.hud && fl.cam === 2, JSON.stringify(fl));
    // the globe in the head: the Earth turned to Nürburg, Germany gold in its middle; the height graph: Nürburg's lowest and highest
    // heights, the kilometres to 20, the part flown over coloured as the flyover goes on (121 colours of the climb), only in the flyover
    await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.thead .globe canvas'), null, { timeout: 20000 }).catch(() => null);
    const gb = await ev(page, 'const c = root.querySelector(".thead .globe canvas"); if (!c) return null; const S = c.width, px = c.getContext("2d").getImageData(S / 2 - 2, S / 2 - 2, 4, 4).data; let r = 0, g = 0, b = 0; for (let i = 0; i < 16; i++) { r += px[i * 4]; g += px[i * 4 + 1]; b += px[i * 4 + 2]; } return { S, country: c.dataset.country, ring: c.dataset.ring, rgb: [r / 16, g / 16, b / 16].map(Math.round), w: c.getBoundingClientRect().width };');
    T.check('the head\'s globe: the Earth turned to the track, Germany gold in its middle, the ring round Nürburg', gb && gb.country === 'Germany' && gb.ring === '1' && gb.S >= 88 && gb.w >= 34 && gb.rgb[0] > 150 && gb.rgb[0] - gb.rgb[2] > 60 && gb.rgb[1] > gb.rgb[2], JSON.stringify(gb));
    const gr0 = await ev(page, 'const g = root.querySelector("#track-stage .hgraph svg"); if (!g) return null; return { lo: g.querySelector("text.lo").textContent, hi: g.querySelector("text.hi").textContent, km: [...g.querySelectorAll("text.km")].map(e => e.textContent), stops: g.querySelectorAll("#hgc stop").length, clip: +g.querySelector("#hgk rect").getAttribute("width"), x0: +g.querySelector("#hgk rect").getAttribute("width") };');
    const moved = await page.waitForFunction((x0) => { const r = document.getElementById('menu-host').shadowRoot.querySelector('#hgk rect'); return r && +r.getAttribute('width') > x0 + 8; }, gr0 && gr0.x0, { timeout: 40000 }).then(() => true).catch(() => false);
    T.check('the height graph: Nürburg\'s lowest and highest heights, 0 to 20 km, the climb\'s colours, the part flown over growing with the flyover', gr0 && /^\d{3} m$/.test(gr0.lo) && /^\d{3} m$/.test(gr0.hi) && parseInt(gr0.hi) > parseInt(gr0.lo) + 100 && gr0.km[0] === '0' && gr0.km[gr0.km.length - 1] === '20 km' && gr0.stops === 121 && moved, JSON.stringify({ gr0, moved }));
    await click(page, 'cam:1'); const g1 = await ev(page, 'return !!root.querySelector("#track-stage .hgraph");');
    await click(page, 'cam:3'); const g3 = await ev(page, 'return !!root.querySelector("#track-stage .hgraph");');
    await click(page, 'cam:2'); const g2 = await ev(page, 'return !!root.querySelector("#track-stage .hgraph svg");');
    T.check('the height graph only in the flyover (2), not on the map (1) nor at the corner (3)', !g1 && !g3 && g2, JSON.stringify({ g1, g2, g3 }));
    // camera 3, the corner: its video (poster first), muted, in a loop, playing (its clock goes on); the step opened again shows the map
    await click(page, 'cam:3');
    const cv0 = await page.waitForFunction(() => { const v = document.getElementById('menu-host').shadowRoot.querySelector('#track-stage .dio.corner video'); return v && v.readyState >= 2 && !v.paused && v.currentTime > 0.2 ? { t: v.currentTime, poster: v.getAttribute('poster'), src: v.getAttribute('src'), loop: v.loop, muted: v.muted, d: v.duration, w: v.videoWidth } : null; }, null, { timeout: 30000 }).then(h => h.jsonValue()).catch(() => null);
    await page.waitForTimeout(800);
    const cv1 = await ev(page, 'const v = root.querySelector("#track-stage .dio.corner video"); return v ? v.currentTime : -1;');
    T.check('camera 3: the corner\'s video (Nürburg\'s, its poster first), muted, in a loop of 6 to 8 s, playing', cv0 && cv0.poster === 'assets/maps/corner-nring.webp' && cv0.src === 'assets/maps/corner-nring.webm' && cv0.loop && cv0.muted && cv0.d >= 5.9 && cv0.d <= 8.1 && cv0.w >= 640 && cv1 !== cv0.t, JSON.stringify({ cv0, cv1 }));
    await page.click('.foot [data-act="back"]'); await click(page, 'mode:race');
    const reopen = await ev(page, 'const p = root.querySelector("#track-stage .cams [aria-pressed=\\"true\\"]"); return { cam: p && p.dataset.act, map: !!root.querySelector("#track-stage .dio.topmap"), set: __game.S.menuCam };');
    T.check('the track step opened again: the map (camera 1), whichever camera was chosen before', reopen.cam === 'cam:1' && reopen.map && reopen.set === 3, JSON.stringify(reopen));
    await click(page, 'weather:rain');
    let s = await page.evaluate(() => ({ w: window.__game.S.weather, rainy: document.getElementById('menu-host').shadowRoot.querySelector('#track-stage').classList.contains('rainy'), on: document.getElementById('menu-host').shadowRoot.querySelector('.wxv [aria-pressed="true"]').dataset.act }));
    T.check('the weather: Rain sets the game\'s weather, the model/map goes wet, Rain is the one lit', s.w === 'rain' && s.rainy && s.on === 'weather:rain', JSON.stringify(s));
    // the rain covers the whole picture (a canvas is not stretched by top and bottom: it once stopped half way)
    const rc = await ev(page, 'const cv = root.querySelector("#track-stage canvas.rainfx"), pic = root.querySelector("#track-stage .dio"); const r = cv.getBoundingClientRect(), p = pic.getBoundingClientRect(); return { cv: [r.top, r.bottom, r.width], pic: [p.top, p.bottom, p.width] };');
    T.check('the rain covers the whole picture', Math.abs(rc.cv[0] - rc.pic[0]) < 1.5 && Math.abs(rc.cv[1] - rc.pic[1]) < 1.5 && Math.abs(rc.cv[2] - rc.pic[2]) < 1.5, JSON.stringify(rc));
    await click(page, 'weather:storm');
    s = await page.evaluate(() => ({ w: window.__game.S.weather, rainy: document.getElementById('menu-host').shadowRoot.querySelector('#track-stage').classList.contains('rainy') }));
    T.check('Storm: the game\'s weather, still wet', s.w === 'storm' && s.rainy, JSON.stringify(s));
    await click(page, 'more-options'); await click(page, 'opt:season:autumn'); await click(page, 'opt:tod:dusk'); await click(page, 'opt:length:short');
    s = await page.evaluate(() => ({ season: __game.S.season, tod: __game.S.tod, length: __game.S.length }));
    T.check('the race options sheet: Autumn, Dusk and a Short race are the game\'s settings', s.season === 'autumn' && s.tod === 'dusk' && s.length === 'short', JSON.stringify(s));
    await done(page);
    await click(page, 'weather:dry'); await click(page, 'more-options'); await click(page, 'opt:season:summer'); await click(page, 'opt:tod:day'); await click(page, 'opt:length:normal'); await done(page);
    // the house: the main menu
    await click(page, 'home'); const hm = await ev(page, 'return { scr: Menu.debug().screen, sub: Menu.debug().titleSub, tile: !!root.querySelector(".t-single") };');
    T.check('the house: the main menu', hm.scr === 'title' && !hm.sub && hm.tile, JSON.stringify(hm));
    await click(page, 'single'); await click(page, 'mode:race');

    // the credits on the title
    await page.click('.foot [data-act="back"]'); await page.click('.t-subhead [data-act="tsub:"]');
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
    await click(page, 'home');

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
  {   // 0 opponents (Trial): the race alone (a short one: 3 laps), to the finish on the autopilot: Cilj (a tick, no place), no win in the
    //   statistics, no page error
    const { ctx, page, errors } = await open({ track: 'troisrivieres', lastTrack: 'troisrivieres', rivals: 0, length: 'short' });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    const row = await ev(page, 'return root.querySelector(".trow .opp").textContent;');
    await click(page, 'race-single');
    await raceOn(page, 'troisrivieres').catch(() => null);
    const st0 = await page.evaluate(() => ({ cars: __game.race && __game.race.cars.length, laps: __game.race && __game.race.laps, wins: __game.stats.wins || 0, races: __game.stats.races || 0 }));
    const fin = await page.evaluate(async () => { const g = window.__game; for (let k = 0; k < 90 && g.phase !== 'done'; k++) { g.sim(10, true); await new Promise(r => setTimeout(r, 0)); }
      return { phase: g.phase, title: document.getElementById('res-title').textContent, pos: document.getElementById('res-pos').textContent, shown: [...document.querySelectorAll('.screen.show')].map(e => e.id).join(), wins: g.stats.wins || 0, races: g.stats.races || 0 }; });
    T.check('0 opponents: the row 0, the race alone (1 car, 3 laps), home on the autopilot: Cilj with a tick (no place), a race counted, no win',
      row === 'Opponents0' && st0.cars === 1 && st0.laps === 3 && fin.phase === 'done' && fin.title === 'Cilj' && fin.pos === '\u2713' && fin.shown === 's-results' && fin.races === st0.races + 1 && fin.wins === st0.wins, JSON.stringify({ row, st0, fin }));
    T.check('no page errors in a race alone', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {   // a field bigger than the game's own (40 opponents on Trois-Rivières): the race starts flying (the column, as the Nordschleife's 100:
    //   a big field's standing start piled up in its first corners with the knocks between cars, game.js newRace flyGo), the player's car
    //   over the line hands it over, the field rolling on 15 s more: no rival standing 3 s on end; no page error
    const { ctx, page, errors } = await open({ track: 'troisrivieres', lastTrack: 'troisrivieres', rivals: 40, length: 'short' });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    const row = await ev(page, 'return root.querySelector(".trow .opp").textContent;');
    await click(page, 'race-single');
    await raceOn(page, 'troisrivieres').catch(() => null);
    const fl = await page.evaluate(async () => { const g = window.__game, r = g.race, st = new Map(), yld = () => new Promise(q => setTimeout(q, 0)); let worst = 0, t = 0, k = 0;
      const o = { cars: r.cars.length, flying: r.opts.flying || 0 };
      for (; t < 40 && (g.phase !== 'racing' || r.flyOn); t += 0.25) { g.sim(0.25, true); if (++k % 8 === 0) await yld(); }
      o.took = +t.toFixed(2); o.flyOn = !!r.flyOn; o.phase = g.phase;
      for (let j = 0; j < 60; j++) { g.sim(0.25, true); for (const c of r.cars) if (!c.isPlayer) { const v = Math.hypot(c.vx, c.vz) < 3 ? (st.get(c) || 0) + 0.25 : 0; st.set(c, v); worst = Math.max(worst, v); } if (j % 8 === 0) await yld(); }
      o.worst = worst; o.dist = Math.round(r.player.dist); return o; });
    T.check('40 opponents on Trois-Rivières (more than the game\'s own 21): the row 40, 41 cars from a flying start, the player\'s over the line, then 15 s on: no rival standing 3 s on end',
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

  // 5a. Circuit race on a circuit: the race weekend's calendar is the intro (Monte Carlo: its helicopter's first frame behind it).
  //     Qualifying is off: Saturday skipped, Sunday's grid the back of it, Race! "Start from last place"; Back to the tracks; switched
  //     on it is remembered (the setting, kept), Saturday first; Race! without it starts the race from the back of the grid (22nd of 22),
  //     with it the qualifying lap; the pad's B and Start; on its side Race! at the very bottom right
  {
    const wk = (page) => ev(page, `const w = root.querySelector('.intro.wk'); if (!w) return null; const vis = (q) => [...w.querySelectorAll(q)].filter(e => e.offsetParent).map(e => e.textContent.replace(/\\s+/g, ' ').trim());
      const g = [...w.querySelectorAll('.wk-go')].find(e => e.offsetParent), r = g && g.getBoundingClientRect();
      return { on: w.classList.contains('on'), head: w.querySelector('.ix-name h2').firstChild.textContent, days: vis('.wk-hd'), ses: vis('.wk-sname'), sky: vis('.wk-wd em'), pos: vis('.wk-pos'), stamp: vis('.wk-stamp'), go: g && g.textContent, pic: w.querySelector('.wk-pic img').getAttribute('src'),
        sw: w.querySelector('.wk-sw').getAttribute('aria-checked'), btn: r && [Math.round(r.right), Math.round(r.bottom), innerWidth, innerHeight], race: !!window.__game.race, wx: w.querySelector('.wk-wx').textContent.replace(/\\s+/g, ' ').trim() };`);
    const toWeekend = async (page) => { await click(page, 'race-single'); await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.intro.wk'), null, { timeout: 120000 }); await page.waitForTimeout(300); };
    const { ctx, page, errors } = await open({ intro: 0, track: 'monaco', mode: 'race', lastTrack: 'monaco' });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    await toWeekend(page);
    const w0 = await wk(page);
    T.check('Race! in Circuit race: the race weekend (Saturday qualifying skipped, Sunday the race from P22 of 22), the track from afar behind it, the race waits',
      w0 && !w0.on && w0.head === 'Monte Carlo' && JSON.stringify(w0.days) === '["SATURDAY","SUNDAY"]' && JSON.stringify(w0.ses) === '["Qualifying","Race"]' && w0.sky.length === 2 && w0.sky.every(k => /sunny|clear/i.test(k)) &&
      JSON.stringify(w0.pos) === '["P22/22"]' && JSON.stringify(w0.stamp) === '["SKIPPED"]' && /^Race!\s*START FROM LAST PLACE$/.test(w0.go) && w0.pic === 'assets/maps/heli-monaco.webp' && w0.sw === 'false' && !w0.race, JSON.stringify(w0));
    await page.click('.intro.wk [data-wk="back"]'); await page.waitForTimeout(300);
    const b = await ev(page, 'return { wk: !!root.querySelector(".intro"), name: root.querySelector("#s-track .where .w2").textContent, race: !!window.__game.race };');
    T.check('Back: the weekend gone, the track screen again, no race', !b.wk && b.name === 'Monte Carlo' && !b.race, JSON.stringify(b));
    await page.evaluate(() => { window.__game.S.weather = 'change'; });   // (Changing: the weekend's Sunday changeable, Saturday as the race starts)
    await toWeekend(page);
    await page.click('.intro.wk [data-wk="q"]'); await page.waitForTimeout(200);
    const w1 = await wk(page), kept = await page.evaluate(() => [window.__game.S.quali, JSON.parse(localStorage.getItem('tdgp-settings')).quali]);
    T.check('Saturday switched on: Start qualifying (Saturday first), the grid P1–22, the choice kept in the settings', w1.on && w1.sw === 'true' && /^Start qualifying\s*SATURDAY FIRST$/.test(w1.go) && JSON.stringify(w1.pos) === '["P1–22"]' && !w1.stamp.length && JSON.stringify(kept) === '[1,1]', JSON.stringify({ w1, kept }));
    T.check('Changing weather: Sunday changeable ("CHANGEABLE · may change"), Saturday dry or rain as the race will start', w1.sky.length === 2 && w1.sky[1] === 'Changeable' && /^(Sunny|Mostly sunny|Clear|Rain)$/.test(w1.sky[0]) && /^CHANGEABLE ?· may change$/.test(w1.wx), JSON.stringify({ sky: w1.sky, wx: w1.wx }));
    await page.click('.intro.wk [data-wk="q"]'); await page.waitForTimeout(200);
    await page.click('.intro.wk [data-wk="go"]');
    await raceOn(page, 'monaco').catch(() => null);
    const r0 = await page.evaluate(() => { const r = __game.race; return r && { quali: !!r.quali, cars: r.cars.length, grid: r.player.grid, intro: !!document.getElementById('menu-host').shadowRoot.querySelector('.intro'), rain: r.rain, wx: r.wst && r.wst.wx && Object.assign({}, r.wst.wx) }; });
    T.check('Race! with qualifying off: the race, from the back of the grid (22nd of 22)', r0 && !r0.quali && r0.cars === 22 && r0.grid === 22 && !r0.intro, JSON.stringify(r0));
    T.check('Changing weather: the race starts as Saturday showed (rain or dry), the change to come (to the other)', r0 && !!r0.wx && r0.rain === (w1.sky[0] === 'Rain' ? 1 : 0) && r0.wx.r1 === 1 - r0.rain && r0.wx.at > 0, JSON.stringify({ sat: w1.sky[0], rain: r0 && r0.rain, wx: r0 && r0.wx }));
    T.check('no page errors on the race weekend', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {   // (qualifying on, as left from the last time; on its side; the pad)
    const { ctx, page, errors } = await open({ intro: 0, quali: 1, track: 'monaco', mode: 'race', lastTrack: 'monaco' }, { width: 915, height: 412 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    await click(page, 'race-single'); await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.intro.wk'), null, { timeout: 120000 }); await page.waitForTimeout(300);
    const wl = await ev(page, `const w = root.querySelector('.intro.wk'), g = [...w.querySelectorAll('.wk-go')].find(e => e.offsetParent), r = g.getBoundingClientRect(); return { on: w.classList.contains('on'), go: g.textContent, btn: [Math.round(r.right), Math.round(r.bottom), innerWidth, innerHeight] };`);
    T.check('on its side, qualifying remembered on: Start qualifying at the very bottom right', wl.on && /^Start qualifying/.test(wl.go) && wl.btn[2] - wl.btn[0] <= 24 && wl.btn[3] - wl.btn[1] <= 24, JSON.stringify(wl));
    const pb = await page.evaluate(() => Menu.padKey('b'));
    const gone = await ev(page, 'return !root.querySelector(".intro");');
    await click(page, 'race-single'); await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.intro.wk'), null, { timeout: 120000 });
    const ps = await page.evaluate(() => Menu.padKey('start'));
    await raceOn(page, 'monaco').catch(() => null);
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
      const s = await ev(page, 'const f = root.querySelector(".pad-focus"), h = root.querySelector(".where .w2"); return { screen: Menu.debug().screen, sub: Menu.debug().titleSub, focus: f ? (f.dataset.act || "") : "", name: h ? h.textContent : "" };');
      s.seen = seen; return s;
    };
    let g = await press(9);
    T.check('pad, Start on the title: Single race opens, the highlight on the chosen mode', g.seen && g.screen === 'title' && g.sub === 'single' && g.focus === 'mode:race', JSON.stringify(g));
    g = await press(13);
    T.check('pad, down: the highlight moves to the next mode', g.focus === 'mode:chase', JSON.stringify(g));
    g = await press(12);
    g = await press(0);
    // (the first real track of the list, the shortest: its id and its place's name from the menu's own list, which changes whenever a track becomes a
    // test track or awaits the choice)
    const first = await page.evaluate(() => { const id = Menu.debug().list[0], d = Core.TRACKS.find(t => t.id === id); return { id, test: !!d.test, name: ((d.en && d.en.name) || d.name).split(',')[0].trim() }; });
    T.check('pad, A: the highlighted mode is chosen (the track step on the first real track of the list, the shortest; the highlight on Race!)', g.screen === 'track' && g.focus === 'race-single' && !first.test && g.name === first.name, JSON.stringify({ g, first }));
    g = await press(5);
    const next = g.name;
    g = await press(4);
    T.check('pad, RB and LB: the next track and back', next !== first.name && next !== '' && g.name === first.name, JSON.stringify({ next, g, first }));
    g = await press(12);
    T.check('pad, up: the highlight leaves Race! for another button', g.focus !== 'race-single' && g.focus !== '', JSON.stringify(g));
    g = await press(1);
    T.check('pad, B: back to the modes', g.screen === 'title' && g.sub === 'single', JSON.stringify(g));
    await press(9); await press(9);
    await raceOn(page, first.id).catch(() => null);
    const r = await page.evaluate(() => ({ id: __game.race && __game.race.track.def.id }));
    T.check('pad, Start, Start: the mode, then the race on that track', r.id === first.id, JSON.stringify({ r, first }));
    T.check('no page errors with the pad', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }

  // 6. the layouts: upright (360 x 640 and 412 x 915), on its side (915 x 412 and 640 x 360)
  for (const [w, h] of [[360, 640], [412, 915], [915, 412], [640, 360]]) {
    const { ctx, page, errors } = await open({ track: 'nring', lastTrack: 'nring' }, { width: w, height: h });   // (Vršič, the last track of the list (a test track since 6. 11. 2026), has no model for the title's tile)
    await page.emulateMedia({ reducedMotion: 'reduce' });   // (the slide-in of a screen is off: it would still be on its way, and the screen 8 px low, when measured)
    await ready(page);
    const title = await ev(page, 'const p = root.querySelector(".title-panel").getBoundingClientRect(); const b = [...root.querySelectorAll(".title-panel button")].map(e => e.getBoundingClientRect()); return { top: p.top, bottom: p.bottom, w: innerWidth, h: innerHeight, over: b.filter(r => r.bottom > p.bottom + 1 || r.top < p.top - 1).length };');
    T.check(`${w}x${h}: the main menu fits the screen, every button inside its panel`, title.top >= -0.5 && title.bottom <= title.h + 0.5 && title.over === 0, JSON.stringify(title));
    await click(page, 'single');
    const modes = await ev(page, 'const p = root.querySelector(".title-panel").getBoundingClientRect(); const c = [...root.querySelectorAll(".t-sub .mode")].map(e => e.getBoundingClientRect()); return { top: p.top, bottom: p.bottom, h: innerHeight, cut: c.filter(r => r.bottom > p.bottom + 1 || r.top < p.top - 1).length, n: c.length };');
    T.check(`${w}x${h}: the six modes fit their panel`, modes.top >= -0.5 && modes.bottom <= modes.h + 0.5 && modes.cut === 0 && modes.n === 6, JSON.stringify(modes));
    await click(page, 'mode:race');
    const way = await page.evaluate(() => { const d = Menu.debug(), n = d.list.length, f = (d.list.indexOf('vrsic') - d.trackIdx + n) % n; return f <= n - f ? 'track:1' : 'track:-1'; });
    for (let k = 0; k < 60 && (await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; })) !== 'vrsic'; k++) await click(page, way);   // (to Vršič, a test track since 6. 11. 2026 and the longest of them, the list's last: past the tracks awaiting the choice and the test tracks after Nürburg, the last real one)
    await click(page, 'cam:2');   // (the flyover: the height graph at the stage's foot)
    await page.waitForTimeout(500);
    // the track step: upright the head, the stage (about half the screen), the row, the yard, the neighbours and the foot one under the
    // other; on its side the stage the whole height at the left (half the width), the rest at the right; nothing cut, nothing over another
    const g = await ev(page, `
      const rc = (s) => { const e = root.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
      const out = { head: rc(".thead"), st: rc("#track-stage"), row: rc(".trow"), yard: rc(".yard"), sign: rc(".yard .sign"), nbrs: rc(".nbrs"), foot: rc(".foot"), go: rc(".go"), back: rc(".foot .back"), where: rc(".where .w1"), W: innerWidth, H: innerHeight };
      out.cells = [...root.querySelectorAll(".trow > div")].map(e => e.scrollWidth - e.clientWidth); out.nb = [...root.querySelectorAll(".nb")].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.width]; });
      out.wx = rc(".wxv"); out.gr = rc("#track-stage .hgraph"); const sv = root.querySelector("#track-stage .hgraph svg"); out.grw = sv ? sv.getBoundingClientRect().width : 0; return out;`);
    const inside = (r) => r && r.l >= -0.5 && r.r <= g.W + 0.5 && r.t >= -0.5 && r.b <= g.H + 0.5;
    const side = g.W > g.H, parts = ['head', 'row', 'yard', 'nbrs', 'foot'];
    const order = parts.every((k, i) => !i || g[parts[i - 1]].b <= g[k].t + 1);
    const lay = side ? g.st.l <= 0.5 && g.st.h >= g.H - 2 && Math.abs(g.st.w - g.W / 2) < g.W * 0.08 && parts.every(k => g[k].l >= g.st.r - 1) && order
      : g.st.t >= g.head.b - 1 && g.st.b <= g.row.t + 1 && g.st.h >= g.H * 0.3 && order;
    T.check(`${w}x${h}: the track step${side ? ' (on its side: the stage left, the rest right)' : ''}: the head, the stage, the row, the yard, the neighbours and Back and Race!, in order, all inside the screen`,
      lay && parts.every(k => inside(g[k])) && inside(g.go) && inside(g.back) && inside(g.st) && g.yard.h >= 50, JSON.stringify(g));
    T.check(`${w}x${h}: the row's numbers are not cut; the two neighbours side by side; the weather inside the stage; the sign in the yard`,
      g.cells.every(x => x <= 1) && g.nb.length === 2 && g.nb[0][1] <= g.nb[1][0] && g.nb[0][2] >= 100 && g.wx.r <= g.st.r + 0.5 && g.wx.b <= g.st.b + 0.5 && g.sign.t >= g.yard.t - 0.5 && g.sign.r <= g.yard.r + 0.5, JSON.stringify({ cells: g.cells, nb: g.nb, wx: g.wx, sign: g.sign }));
    T.check(`${w}x${h}: the height graph across the stage's whole width at its foot, 72 px tall, under the weather`,
      g.gr && Math.abs(g.gr.l - g.st.l) < 0.5 && Math.abs(g.gr.r - g.st.r) < 0.5 && Math.abs(g.gr.b - g.st.b) < 0.5 && Math.abs(g.gr.h - 72) < 0.5 && Math.abs(g.grw - g.st.w) < 1 && g.wx.b <= g.gr.t + 1, JSON.stringify({ gr: g.gr, st: g.st, grw: g.grw, wx: g.wx }));

    // the whole route and the names of its flags inside the picture; the neighbours at the same place on the next track. (An open road's map
    // turned to run up the frame: on Pikes Peak, below. Vršič, a test track since 6. 11. 2026, is drawn as the test tracks are, not turned)
    const MEASURE = `
      const c = (e) => { const r = e.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
      const st = root.querySelector("#track-stage"), pic = st.querySelector(".dio"), svg = st.querySelector(".topmap svg");
      const out = { name: root.querySelector(".where .w2").textContent, head: root.querySelector(".where").textContent.replace(/\\s+/g, " ").trim(), pic: c(pic), nb: [...root.querySelectorAll(".nb")].map(c), scr: [innerWidth, innerHeight] };
      if (svg) { out.rot = svg.querySelector("g.rot").getAttribute("transform") || ""; out.s = c(svg.querySelector(".mk.s circle")); const f = svg.querySelector(".mk.f circle"); out.f = f ? c(f) : null; out.line = c(svg.querySelector("path.rt-o")); out.names = [...st.querySelectorAll(".mlab .fl-s")].map(c); out.boxes = [...st.querySelectorAll(".mlab .fl-s")].map(e => { const b = e.querySelector("b").getBoundingClientRect(), m = e.querySelector("small"), r = m && m.getBoundingClientRect(); return [e.className, getComputedStyle(e.querySelector("b")).backgroundColor, r ? +(r.top >= b.bottom - 1 && Math.abs(r.right - b.right) < 12) : -1]; }); const ld = svg.querySelector("image.land"); out.land = ld ? c(ld) : null; out.keep = [...st.querySelectorAll(":scope > .cams, :scope > .wxv")].map(c); }
      return out;`;
    await click(page, 'cam:1'); await page.waitForTimeout(500);
    const v1 = await ev(page, MEASURE);
    await click(page, 'track:1'); await page.waitForTimeout(500);
    const v2 = await ev(page, MEASURE);
    const same = (a, b) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1;
    T.check(`${w}x${h}: the neighbours' buttons at the same place on Vršič and on the next track`, v1.name === 'Vršič' && v2.name !== 'Vršič' && v1.nb.length === 2 && v2.nb.length === 2 && same(v1.nb[0], v2.nb[0]) && same(v1.nb[1], v2.nb[1]), JSON.stringify({ v1: v1.nb, v2: v2.nb }));
    if (w === 412) T.check('Vršič\'s head: "Slovenia, Vršič 1,388 m" (the height chosen for it: MENU.heads)', v1.head === 'Slovenia, Vršič 1,388 m', v1.head);
    const inPic = (r, p, e) => r.l >= p.l - e && r.r <= p.r + e && r.t >= p.t - e && r.b <= p.b + e;
    T.check(`${w}x${h}: the whole route (start to finish) and the names of its flags are inside the picture, the names upright`, inPic(v1.line, v1.pic, 6) && v1.names.length >= 2 && v1.names.every(n => inPic(n, v1.pic, 1) && n.w > n.h), JSON.stringify({ line: v1.line, pic: v1.pic, names: v1.names }));
    T.check(`${w}x${h}: the flags' names in boxes as the flyover's (the start's white, the finish's dark), the height in a small box under the name at its right`,
      v1.boxes.length === 2 && v1.boxes[0][0] === 'fl-s start' && v1.boxes[1][0] === 'fl-s finish' && v1.boxes[0][1] === 'rgb(255, 255, 255)' && v1.boxes[1][1] !== v1.boxes[0][1] && v1.boxes.every(b => b[2] === 1), JSON.stringify(v1.boxes));
    // the real land painted round the map (wide-<id>.webp, wide_map.py) covers the whole picture: no blurred or empty edge, in the frame turned or not
    const covers = (l, p) => !!l && l.l <= p.l + 1 && l.r >= p.r - 1 && l.t <= p.t + 1 && l.b >= p.b - 1;
    T.check(`${w}x${h}: the open road's map has the real land painted over the whole picture (the wide map reaches every edge of the frame)`, covers(v1.land, v1.pic), JSON.stringify({ land: v1.land, pic: v1.pic }));
    // every other real track with a map: the route and its names inside the picture, the painted land over all of it
    const ids = await page.evaluate(() => Menu.debug().list), cut = [], bare = [], under = []; let maps = 0, pk = null;
    const over = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
    for (let k = 0; k < ids.length; k++) {
      const id = await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; });
      if (await page.evaluate((id) => !!(window.ROUTES || {})[id] && !Core.TRACKS.find(d => d.id === id).test, id)) {   // (the test tracks aside)
        await page.waitForTimeout(300);
        const m = await ev(page, MEASURE);
        if (id === 'pikes') pk = m;
        if (m.names) { maps++; if (!inPic(m.line, m.pic, 6) || !m.names.every(n => inPic(n, m.pic, 1))) cut.push(m.name); if (m.land && !covers(m.land, m.pic)) bare.push(m.name); if (m.names.some(n => m.keep.some(k => over(n, k)))) under.push(m.name); }
      }
      await click(page, 'track:1');
    }
    T.check(`${w}x${h}: on every real track's map (${maps}) the route and the names of its flags are inside the picture`, maps >= 5 && !cut.length, JSON.stringify(cut));
    // an open road's map is turned to run up the frame (start below, finish above) in a frame not much wider than tall, else it lies
    const tall = !!pk && pk.pic.w / pk.pic.h < 1.3, turned = !!pk && /^rotate\(-90 /.test(pk.rot || '');
    const upright = !!pk && !!pk.f && (tall ? pk.s.y > pk.f.y + pk.pic.h * 0.4 && Math.abs(pk.s.x - pk.f.x) < pk.pic.w * 0.35 : pk.f.x > pk.s.x + pk.pic.w * 0.4);
    T.check(`${w}x${h}: the open road's map ${tall ? 'runs up the frame (Pikes Peak: Crystal Reservoir, the start, below; the Summit, the finish, above)' : 'lies along the frame (it is wide and short): the start left, the finish right'}`, !!pk && turned === tall && upright, JSON.stringify(pk && { name: pk.name, rot: pk.rot, pic: pk.pic, s: pk.s, f: pk.f }));
    T.check(`${w}x${h}: on every map the painted land covers the whole picture`, !bare.length, JSON.stringify(bare));
    T.check(`${w}x${h}: on every map the names of the flags are not under the cameras' buttons or the weather`, maps >= 5 && !under.length, JSON.stringify(under));
    T.check(`${w}x${h}: no page errors`, !real(errors).length, real(errors).join(' | '));
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
    const { ctx, page, errors } = await open();
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
      await click(page, 'home');
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
