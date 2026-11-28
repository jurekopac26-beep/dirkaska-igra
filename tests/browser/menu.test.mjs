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
// layouts (upright, on its side, a small phone), the old menu that stays for ?menu=old, and the career's path of 1.0 (its strip in the
// Career panel, its hub: stages, cups, class cups; a locked cup refused, an open one started).
// Part 1 of 3 (split on 27. 11. 2026 so each part runs under 15 min on GitHub; what they share: menu-lib.mjs): sections 1 (the title,
// the modes, the tracks of every mode), 4 (the track step) and 4b (the row's Opponents). Part 2: menu-2.test.mjs; part 3: menu-3.test.mjs.
//   node tests/browser/menu.test.mjs
import { openGame } from './lib.mjs';
import { menuTest } from './menu-lib.mjs';

await menuTest('menu 1/3', async ({ T, srv, browser, PAGE, open, ready, SH, ev, click, done, shown, nuPick, real, raceOn, pageState, KF, zem, EARTH, hit, clean, wrap }) => {
  // 1. the title: the menu is the screen on show; a new player's track is a real one, not the test track the game starts on
  {
    const { ctx, page, errors } = await open();
    await ready(page);
    const t = await ev(page, 'return { tiles: [...root.querySelectorAll(".tile b")].map(e => e.textContent), small: [...root.querySelectorAll(".tsmall span")].map(e => e.textContent), sub: root.querySelector(".t-single small").textContent, logo: root.querySelector(".logo").textContent };');
    T.check('the title: Single race, Multiplayer, Career; Settings and Leaderboard; the logo', JSON.stringify(t.tiles) === '["SINGLE RACE","MULTIPLAYER","CAREER"]' && t.small.includes('Settings') && t.small.includes('Leaderboard') && /REAL ROADS ATLAS\s*RACING GAME/i.test(t.logo), JSON.stringify(t));
    // (the game's track here Jezero, hidden behind NEUPORABNO: the title shows the first real one of Circuit race, the default mode, instead)
    const first = 'const id = Menu.debug().list[0], d = Core.TRACKS.find(x => x.id === id) || {}, full = (d.en || {}).name || d.name || "", k = full.lastIndexOf(", "); return { id, name: k > 0 ? full.slice(0, k) : full, real: !d.test && !d.pending, race: (d.modes || [d.timeTrial ? "tt" : "race"]).includes("race"), game: __game.S.track };';
    const f = await ev(page, first);
    T.check('the menu is the screen on show; a new player starts on a real track, not the test one (Jezero): the first real one of Circuit race, the default mode (now Aguascalientes, the shortest; Hai Van, Batangas and Sogeri are pending; a rally stage, a time trial only, is not in it)', (await shown(page)).join() === 's-menu' && !/Jezero/.test(t.sub) && f.real && f.race && t.sub === f.name + ' · Circuit race', t.sub + ' ' + JSON.stringify(f));
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
    // (the view on top, the newest: the view shown before it stays under it for a moment while the new one fades in, stageViews)
    const PIC = `const st = root.querySelector('#track-stage'), all = [...st.querySelectorAll('.dio')], top = all[all.length - 1], map = top && top.classList.contains('topmap') ? top : null, v = top && top.querySelector('video');
      if (v) return { kind: top.classList.contains('corner') ? 'corner' : 'flyover', files: [v.getAttribute('poster'), v.getAttribute('src')], loop: v.loop && v.muted };
      return { kind: map ? 'map' : top && top.querySelector('img') ? 'model' : 'none', files: top ? [...top.querySelectorAll('img, image')].map(e => e.getAttribute('src') || e.getAttribute('href')) : [] };`;
    // a mode's tracks in the menu's order: the real ones; behind NEUPORABNO (nu) the hidden ones, those awaiting the user's choice first, then the test tracks
    const expList = ([gm, nu]) => {
      const L = window.MENU.lens, ds = Core.TRACKS.filter(d => !d.variantOf && (d.modes || (d.timeTrial ? ['tt'] : ['race'])).includes(gm) && !!(d.test || d.pending) === nu);
      const rk = (d) => d.test ? 2 : d.pending ? 1 : 0;   // (the real ones, the ones awaiting the user's choice, the test tracks)
      ds.sort((a, b) => (rk(a) - rk(b)) || (L[a.id] - L[b.id]) || (a.id < b.id ? -1 : 1));
      return { ids: ds.map(d => d.id), roads: ds.filter(d => d.open && !d.test && !d.rally && !d.descent && !d.vehicle).length, lens: ds.every(d => L[d.id] > 0) };
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
      if (mode === 'trial') T.check(`every open road in Circuit race as in Time trial (${roads.race} and ${roads.trial}: Pikes Peak too; the open roads that became test tracks on 4., 5., 6. and 9. 11. 2026 are left out: the USA's but Pikes Peak, Vršič, Mount Buller, Sani Pass, Great Alpine Road; Irohazaka awaits the choice; so are the tanker's roads, in Time trial only)`, roads.race === roads.trial && roads.race >= 7, JSON.stringify(roads));
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
    const cx = await page.evaluate(() => ({ routes: Object.keys(window.ROUTES || {}), corners: window.MENU.corners || [], tests: Core.TRACKS.filter(d => d.test).map(d => d.id), tanker: Core.TRACKS.filter(d => d.vehicle).map(d => d.id) }));
    const cbad = Object.entries(cams).filter(([id, c]) => c.c1.kind !== (cx.routes.includes(id) ? 'map' : 'model') || c.c3.kind !== (cx.corners.includes(id) ? 'corner' : 'model') || (c.c3.kind === 'corner' && !(c.c3.loop && c.c3.files[0] === 'assets/maps/corner-' + id + '.webp' && c.c3.files[1] === 'assets/maps/corner-' + id + '.webm'))).map(([id, c]) => id + ':' + c.c1.kind + '/' + c.c3.kind);
    const real0 = Object.keys(cams).filter(id => !cx.tests.includes(id) && !cx.tanker.includes(id)), nocorner = real0.filter(id => !cx.corners.includes(id));
    T.check(`every track (${Object.keys(cams).length}): camera 1 its map (else its model), camera 3 its corner's video in a loop with its poster (else its model); every real track (${real0.length}) has its corner's video, but the tanker's roads`, Object.keys(cams).length >= 47 && !cbad.length && !nocorner.length && cx.corners.every(id => !cx.tests.includes(id) || id === 'vrsic'), JSON.stringify({ cbad, nocorner }));
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
      return { head: q('.where').textContent.replace(/\\s+/g, ' ').trim(), label: q('.where').getAttribute('aria-label'), fs: parseFloat(getComputedStyle(q('.where .w2')).fontSize), back: hb ? [hb.dataset.act, Math.round(hr.width), Math.round(hr.height), hb.textContent.trim()] : [], home: !!q('[data-act="home"]'), globe: !!q('.thead .globe'),
        foot: [...root.querySelectorAll('#s-track .foot button')].map(b => b.dataset.act), old: !!(q('.topbar') || q('.groups') || q('.card') || q('.arrow') || q('.pcount')),
        row: [...root.querySelectorAll('.trow > div')].map(e => e.className + ':' + e.textContent), grid: !!q('.trow .opp svg.grid'), flag: q('.trow .flag img') && q('.trow .flag img').getAttribute('src'), sign: q('.yard .sign').textContent, car: !!q('.yard .car[data-act="garage"]'),
        nb: [...root.querySelectorAll('.nb')].map(b => [b.dataset.act, b.getAttribute('aria-label'), b.dataset.flag || '', /^url\\("?data:image\\/png/.test(b.style.backgroundImage)]), prev: d.list[(i - 1 + n) % n], next: d.list[(i + 1) % n], id: d.list[i],
        wx: [...root.querySelectorAll('.wxv [data-act^="weather:"]')].map(b => b.dataset.act.slice(8) + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')), more: !!q('.wxv [data-act="more-options"]') };`);
    const riv = await page.evaluate(() => { const d = Core.TRACKS.find(x => x.id === 'nring'); const M = Core.MODELS[__game.S.car]; return Core.fieldSize(M.oneMake ? null : M, d.raceRivals || d.rivals || 21); });
    T.check('the track step\'s head: the back button 52 high, the arrow and Back on it (the user, 11. 11. 2026), the place alone, "NÜRBURG" 44 px (the country for the readers), the globe; no house, no height; Race! alone at the foot; no title bar, groups, card or arrows',
      scr.id === 'nring' && scr.head === 'Nürburg' && scr.label === 'Nürburg, Germany' && scr.fs === 44 && scr.back[0] === 'back' && scr.back[1] >= 90 && scr.back[1] <= 120 && scr.back[2] === 52 && scr.back[3] === 'Back' && !scr.home && scr.globe && JSON.stringify(scr.foot) === '["race-single"]' && !scr.old, JSON.stringify(scr));
    T.check(`the row (the user, 12. 11. 2026): the flag of Germany (a button: the quick list), Best lap NEW (not driven yet), Rating, the mode, the difficulty (the user, 12. 11. 2026 ~23.25), ${riv} opponents by the start's grid`, JSON.stringify(scr.row.slice(0, 5)) === JSON.stringify(['flag:', 'best:Best lapNEW', 'rate:Rating—', 'md:Classicrace', 'dif:Medium']) && scr.row[5] === 'opp:Opponents' + riv && scr.grid && scr.flag === 'assets/flags/germany.svg', JSON.stringify(scr.row));
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
    T.check('the sheet: 21 big, the quick picks 0 Trial, 1, 5, 12, 21, 50, 100 (50 and 100 off: Pikes Peak takes 28), the slider 0..28 at 21, Close',
      o && o.num === '21' && /^21 rivals · 22 cars$/.test(o.sub) && o.picks.join() === '0Trial,1,5,12,21*,50-,100-' && o.max === 28 && o.val === 21 && /^028 at most on this road$/.test(o.ends) && o.done, JSON.stringify(o));
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
    // drawn on = the demo drawn in every frame the page draws (not once a second, as under a covering menu); counted against the
    // page's own frames, not a fixed rate: software WebGL at 820×1180 (a cloud session, a CI machine) draws only ~2 frames a second
    const dm = await page.evaluate(async () => { const a = __game.fr.demo, r0 = __game.fr.raf, t0 = performance.now(); await new Promise(r => setTimeout(r, 2600)); return { raf: __game.fr.raf - r0, n: __game.fr.demo - a, s: (performance.now() - t0) / 1000, covers: Menu.covers() }; });
    T.check('a tablet held upright: the menu a column, the demo at its sides drawn on', !dm.covers && dm.raf >= 3 && dm.n >= dm.raf - 1 && dm.n > Math.ceil(dm.s) + 1, JSON.stringify(dm));
    T.check('no page errors on the tablet', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
});
