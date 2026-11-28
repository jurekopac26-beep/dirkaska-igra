// The new menu's test, part 2 of 3 (the overview: menu.test.mjs; what the parts share: menu-lib.mjs): sections 4c (the quick list),
// 4d (the Earth), 4e (a weak phone), 4f (the road sign and the yard's car), 4g (the weather), 5 (a time trial and the short intro),
// 5a (Circuit race's weekend calendar), 5a2 (the row's mode and difficulty) and 5b (the gamepad).
//   node tests/browser/menu-2.test.mjs
import { openGame } from './lib.mjs';
import { menuTest } from './menu-lib.mjs';

await menuTest('menu 2/3', async ({ T, srv, browser, PAGE, open, ready, SH, ev, click, done, shown, nuPick, real, raceOn, pageState, KF, zem, EARTH, hit, clean, wrap }) => {
  // 4c. the quick list (js/menu-izbor.js; docs/meni-izbira-proge.md, sklop 8): the flag in the row opens it over the track step: the
  //     countries by continent A to Z (the shown track's gold), no test tracks; a country's tracks, a track's card (its shape from above,
  //     its facts, the player's best, its heights), Select and Race!; the search (no accents needed) and the filters; the player's marks
  //     (a race's first three places a medal, a track driven a tick, one not driven NEW: in the row too); Back (the phone's: the history;
  //     Esc; the pad's B) a layer down, the cross closes it. NEUPORABNO's sheet (the title's button): the hidden tracks, a test track's
  //     card, Race!
  {
    const recs = { 'spa@cs': { bestLap: 140.21, bestPos: 1 }, 'hakone@cs': { bestLap: 122.4, bestPos: 2 }, 'nring@cs': { bestLap: 431.5, bestPos: 5 } };
    const { ctx, page, errors } = await open({ track: 'spa', lastTrack: 'spa' }, null, { init: 'localStorage.setItem("tdgp-records", ' + JSON.stringify(JSON.stringify({ tracks: recs })) + ');' });
    const miss = []; page.on('response', (r) => { if (r.status() === 404) miss.push(new URL(r.url()).pathname); });
    await ready(page);
    // (Irohazaka is a test track since 12. 11. 2026 (behind NEUPORABNO); here a real track of Japan beside Hakone, the list's one country of
    // two tracks: one track per country (CLAUDE.md) leaves none else. The menu reads the flag as it makes a list)
    await page.evaluate(() => { Core.TRACKS.find(d => d.id === 'iroha').test = false; });
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
    T.check('the marks on the flags: the shown track\'s country gold (Belgium), its best a gold 1; Japan (Hakone 2nd) silver; Germany (Nürburg 5th) a tick; a country not driven NEW',
      tile('Belgium')[3] === 1 && g.tiles.filter(t => t[3]).length === 1 && tile('Belgium')[2] === 'gold:1' && tile('Japan')[2] === 'silver:2' && tile('Germany')[2] === 'done:' && tile('Canada')[2] === 'new:NEW', JSON.stringify(g.tiles));
    // a country: its tracks (Japan: Iroha, Hakone), each with its mark, facts and best; then Hakone's card
    await page.click('.izb-c[data-c="Japan"]'); await IZ(2);
    const jp = await view(), suz = jp.rows.find(r => r[0] === 'hakone') || [], iro = jp.rows.find(r => r[0] === 'iroha') || [];
    T.check('a country (Japan): its tracks in the list\'s order, each its mark (Hakone a silver 2 and its best: 02:02.400, 2nd; Iroha NEW) and facts; two steps in the history',
      jp.title === 'Japan' && jp.sub === jp.rows.length + ' tracks' && jp.rows.length >= 2 && jp.depth === 2 && jp.hist === 2 && suz[1] === 'silver:2' && suz[2] === '02:02.4002nd' && /^\d+\.\d\d km · \d+ corners · Circuit$/.test(suz[3]) && iro[1] === 'new:NEW' && iro[2] === '' && /^\d+\.\d\d km · .+ · Open road$/.test(iro[3]),
      JSON.stringify(jp.rows));
    await page.click('.izb-t[data-t="hakone"]'); await IZ(3);
    const cd = await view(), km = await page.evaluate(() => (MENU.lens.hakone / 1000).toFixed(2) + ' km'), nc = await page.evaluate(() => String(MENU.ncorners.hakone));
    T.check('the track\'s card (Hakone): the shape from above (a closed line), Length, Corners and Type, the player\'s best (Best lap 02:02.400, 2nd place, silver), the heights, Select and Race!',
      cd.title === 'Hakone' && cd.sub === 'Japan' && cd.depth === 3 && cd.hist === 3 && !!cd.card && /^M[\d ]+(L[\d ]+){6,}Z$/.test(cd.card.shape) && JSON.stringify(cd.card.facts) === JSON.stringify(['Length:' + km, 'Corners:' + nc, 'Type:Circuit']) &&
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
    await page.evaluate(() => { Core.TRACKS.find(d => d.id === 'iroha').test = true; });   // (a test track again, as in the game)
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

  {
    const recs = { 'spa@cs': { bestLap: 140.21, bestPos: 1 }, 'hakone@cs': { bestLap: 122.4, bestPos: 2 }, 'nring@cs': { bestLap: 431.5, bestPos: 5 } };
    const { ctx, page, errors } = await open({ track: 'spa', lastTrack: 'spa' }, null, { init: 'localStorage.setItem("tdgp-records", ' + JSON.stringify(JSON.stringify({ tracks: recs })) + ');' });
    await ready(page);
    await page.evaluate(() => { Core.TRACKS.find(d => d.id === 'iroha').test = false; });   // (as in the quick list above: Irohazaka a real track of Japan here, beside Hakone)
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
    T.check('the pins in the colours of the player\'s progress (Spa won: gold, the track shown; Hakone 2nd: silver; Nürburg 5th: a tick\'s green; the rest NEW); from afar the countries named (Belgium the shown one\'s), none over another or a button, none over the shown one\'s pin',
      e1.pins.includes('spa:gold cur') && e1.pins.includes('hakone:silver') && e1.pins.includes('nring:done') && e1.pins.filter(p => /:new$/.test(p)).length >= 5 && e1.names.length >= 2 && e1.names.every(n => n.c && !n.t) && e1.names.some(n => n.c === 'Belgium' && n.cur) && clean(e1),
      JSON.stringify({ pins: e1.pins, names: e1.names.map(n => n.c + (n.cur ? '*' : '')) }));
    const n0 = e1.R.n; await page.waitForTimeout(600); const n1 = await page.evaluate(() => MenuZemlja._R().n);
    const sun = await page.evaluate(() => { const s = MenuZemlja.sun(), v = MenuZemlja._R().sun, p = (s[1] + 180) * Math.PI / 180, t = (90 - s[0]) * Math.PI / 180;
      return [MenuZemlja.sun(new Date(Date.UTC(2026, 5, 21, 12))), MenuZemlja.sun(new Date(Date.UTC(2026, 11, 21, 18))), Math.hypot(v[0] + Math.cos(p) * Math.sin(t), v[1] - Math.cos(t), v[2] - Math.sin(p) * Math.sin(t))]; });
    T.check('nothing moving: no frames drawn; the Sun overhead at the tropic of Cancer at noon UTC on 21 June (near 0°), at the tropic of Capricorn at 18 h UTC on 21 December (near 90° W); the Earth\'s night side from where it is now',
      n1 === n0 && !e1.R.moving && Math.abs(sun[0][0] - 23.44) < 0.5 && Math.abs(sun[0][1]) < 1.5 && Math.abs(sun[1][0] + 23.44) < 0.5 && Math.abs(sun[1][1] + 90) < 1.5 && sun[2] < 0.01, JSON.stringify({ n0, n1, sun }));
    // a country's name pressed (a key, the pad): its card with its tracks, the Earth turned to it, closer; close in, the tracks named
    await ev(page, 'root.querySelector(".zl.c[data-c=\\"Japan\\"]").click();'); await zem(page, 2);
    const e2 = await earth();
    T.check('a country (Japan): its card (its tracks in the list\'s order, each its mark: Hakone a silver 2, Iroha NEW), the Earth turned to it and closer, the tracks named there (not over the card); two steps in the history',
      e2.R.sel === 'Japan' && e2.card && e2.card.title === 'Japan' && e2.card.sub === e2.card.rows.length + ' tracks' && e2.card.rows.includes('hakone:silver:2') && e2.card.rows.includes('iroha:new:NEW') && e2.depth === 2 && e2.hist === 2 &&
      e2.R.lat > 30 && e2.R.lat < 40 && e2.R.lon > 130 && e2.R.lon < 142 && e2.R.d < 2.75 && e2.names.length >= 1 && e2.names.every(n => n.t) && clean(e2), JSON.stringify({ R: e2.R, card: e2.card, names: e2.names.map(n => n.t) }));
    await page.click('.zem-card .izb-t[data-t="hakone"]'); await zem(page, 3);
    const e3 = await earth();
    T.check('a track\'s row: its card (Hakone: its picture, the best, silver, Select and Race!); three steps in the history; still the pad\'s part of the screen',
      e3.R.tc === 'hakone' && e3.card && e3.card.title === 'Hakone' && e3.card.sub === 'Japan' && /^assets\/tracks\/hakone\.webp\|true:[1-9]/.test(e3.card.photo) && e3.card.best === 'silver:2|02:02.4002nd place' && JSON.stringify(e3.card.btns.map(b => b[0])) === '["Select","Race!"]' && e3.depth === 3 && e3.hist === 3 && e3.pad, JSON.stringify(e3.card));
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
    // (a pin on top at its own place, Bâlea's if it is: from afar a country's name can lie over a pin and take the tap, as Albania's over Bâlea's since the new tracks, 11. 11. 2026;
    // its country's one track: two steps, else three)
    const pin = await ev(page, 'const on = (e) => { const r = e.getBoundingClientRect(), t = root.elementsFromPoint(r.left, r.top)[0]; return !!t && e.contains(t); }, ps = [...root.querySelectorAll(".zp")].filter(e => +e.style.opacity > 0.5 && on(e)), p = ps.find(e => e.dataset.t === "balea") || ps[0], r = p.getBoundingClientRect(), cty = (d) => { const f = (d.en || {}).name || d.name; return f.slice(f.lastIndexOf(", ") + 2); }, k = cty(Core.TRACKS.find(d => d.id === p.dataset.t)), one = Core.TRACKS.filter(d => !d.test && !d.variantOf && cty(d) === k).length === 1; return [r.left, r.top, p.dataset.t, one ? 2 : 3];');
    await page.mouse.click(pin[0], pin[1]); await zem(page, pin[3]);
    const p1 = await earth();
    await page.click('.zem-card [data-x]'); await zem(page, 1);
    const p2 = await earth();
    T.check(`a pin tapped (${pin[2]}): its track's card at once (its country chosen; its one track: two steps, else three); the card's cross: the Earth alone again`, p1.R.tc === pin[2] && !!p1.R.sel && (pin[2] !== 'balea' || p1.R.sel === 'Romania') && p1.card && p1.card.sub === p1.R.sel && p1.depth === pin[3] && !p2.card && !p2.R.sel && p2.depth === 1,
      JSON.stringify({ p1: [p1.R.tc, p1.R.sel, p1.card && p1.card.title, p1.card && p1.card.sub, p1.depth], p2: [p2.R.sel, p2.depth, !!p2.card] }));
    // a country with one track (Belgium: Spa): its track's card at once, with its picture (the user, 12. 11. 2026: »ni potrebe da kliknes
    // bathurst ce imamo vedno samo 1 progo na 1 drzavo«); the card's Back: the Earth alone (no country list between)
    await ev(page, 'root.querySelector(".zl.c[data-c=\\"Belgium\\"]").click();'); await zem(page, 2);
    const o1 = await earth();
    await page.click('.zem-card [data-back]'); await zem(page, 1);
    const o2 = await earth();
    T.check('a country with one track (Belgium): its track\'s card at once (Spa, its picture beside its shape, Select and Race! in sight), two steps in the history; its Back: the Earth alone',
      o1.R.sel === 'Belgium' && o1.R.tc === 'spa' && o1.card && o1.card.title === 'Spa' && o1.card.sub === 'Belgium' && /^assets\/tracks\/spa\.webp\|true:[1-9]/.test(o1.card.photo) && o1.card.btns.length === 2 && o1.card.btns.every(b => b[4] <= o1.H + 0.5) &&
      o1.depth === 2 && o1.hist === 2 && !o2.card && !o2.R.sel && o2.depth === 1 && o2.hist === 1, JSON.stringify({ o1: [o1.R.sel, o1.R.tc, o1.card, o1.depth, o1.hist], o2: [o2.R.sel, o2.depth, o2.hist] }));
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
    T.check('+ closer (the tracks named), − back; a drag west turns it east (and on a little after the finger); → turns it 20° east; the target: back to Spa, its card (Belgium\'s one track); the track step not changed by the keys',
      Math.abs(z1.R.d - Math.max(1.5, o2.R.d / 1.45)) < 0.02 && z1.names.length && z1.names.every(n => n.t) && Math.abs(z2.R.d - z1.R.d * 1.45) < 0.02 && dlon > 5 && Math.abs(wrap(k1.R.lon - dr.R.lon) - 20) < 0.5 &&
      h1.R.sel === 'Belgium' && h1.card && h1.card.title === 'Spa' && h1.card.sub === 'Belgium' && Math.abs(h1.R.lat - spa[0]) < 0.3 && Math.abs(wrap(h1.R.lon - spa[1])) < 0.3 && (await page.evaluate(() => { const d = Menu.debug(); return d.list[d.trackIdx]; })) === 'spa',
      JSON.stringify({ d0: o2.R.d, z1: z1.R.d, z1n: z1.names.map(n => n.t), z2: z2.R.d, dlon, k: wrap(k1.R.lon - dr.R.lon), h1: [h1.R.sel, h1.R.lat, h1.R.lon] }));
    // Select on a track's card (Japan, Hakone): the track step goes to it under the Earth going back into the globe, which turns to Japan
    await ev(page, 'root.querySelector(".zl.c[data-c=\\"Japan\\"]").click();'); await zem(page, 2);
    await page.click('.zem-card .izb-t[data-t="hakone"]'); await zem(page, 3);
    await page.click('.zem-card .izb-sel');
    const turned = await page.waitForFunction(() => Menu.debug().globe.turning, null, { timeout: 5000, polling: 'raf' }).then(() => true).catch(() => false);
    await zem(page, 0);
    await page.waitForFunction(() => !Menu.debug().globe.turning, null, { timeout: 10000 }).catch(() => null);
    const sel = await ev(page, 'const d = Menu.debug(), c = root.querySelector(".thead .globe canvas"); return { id: d.list[d.trackIdx], track: __game.S.track, head: root.querySelector(".where .w2").textContent, hist: history.state && history.state.nazaj, g: d.globe, country: c && c.dataset.country, S: c && c.width };');
    const suz = await place('hakone');
    T.check('Select on the Earth (Hakone): the track step goes to it, the Earth gone with its steps in the history; the head\'s globe turned to Japan (from Belgium, along the way)',
      sel.id === 'hakone' && sel.track === 'hakone' && sel.head === 'Hakone' && !sel.hist && turned && !sel.g.turning && Math.abs(sel.g.at[0] - suz[0]) < 0.05 && Math.abs(wrap(sel.g.at[1] - suz[1])) < 0.05 && sel.country === 'Japan' && sel.S >= 104, JSON.stringify({ sel, turned, suz }));
    // the head's globe in daylight (the Sun set over the next track's antipode: no night on it); the moon switched on the Earth (the night
    // there, remembered): the same globe darker at once; then the next track's at night, the one after it by day (their globes not drawn yet)
    await page.evaluate(() => { const s0 = MenuZemlja.sun; MenuZemlja.sun = (t) => { if (t || !window.__sun) return s0(t); const d = Menu.debug(), id = d.list[d.trackIdx], g = GEO.tracks[id], p = (MENU.globe.places || {})[id] || (g ? [g.lat0, g.lon0] : [0, 0]); return window.__sun === 'day' ? p : [-p[0], p[1] > 0 ? p[1] - 180 : p[1] + 180]; }; });
    const DISK = 'const c = root.querySelector(".thead .globe canvas"), S = c.width, d = c.getContext("2d").getImageData(0, 0, S, S).data; let n = 0, r = 0, g = 0, b = 0;' +
      'for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = x + 0.5 - S / 2, dy = y + 0.5 - S / 2; if (dx * dx + dy * dy > (S * 0.42) ** 2) continue; const i = (y * S + x) * 4; if (d[i] > 150 && d[i] - d[i + 2] > 60) continue; n++; r += d[i]; g += d[i + 1]; b += d[i + 2]; }' +
      'return { S, n, rgb: [r / n, g / n, b / n].map(Math.round), country: c.dataset.country };';
    const steady = () => page.waitForFunction(() => !Menu.debug().globe.turning && document.getElementById('menu-host').shadowRoot.querySelector('.thead .globe canvas').width >= 104, null, { timeout: 10000 }).catch(() => null);
    const lit = async (when, step = 1) => { await page.evaluate((w) => { window.__sun = w; }, when); await click(page, 'track:' + step); await steady(); return ev(page, DISK); };
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
    // (back from the track after Hakone, the last real track: Hakone at night, the one before it, Nürburg, by day; the tracks after Hakone are
    // the shortest, new ones among them over the sea, a day globe of Costa Rica mostly dark ocean: zbirna Proge 2)
    const nt = await lit('night', -1), dy = await lit('day', -1);
    await page.evaluate(() => { window.__sun = null; });
    T.check('the head\'s globe with the moon on: its night side darker and bluer (the Sun over the other side of the Earth) than by day (the Sun over the track)', nt.n > 500 && dy.n > 500 && sum(nt) < 0.5 * sum(dy) && nt.rgb[2] / Math.max(1, nt.rgb[0]) > dy.rgb[2] / Math.max(1, dy.rgb[0]), JSON.stringify({ nt, dy }));
    // Race! on the Earth's card: the race on that track at once, the Earth gone with its steps in the history
    await page.click('.thead .globe'); await zem(page, 1);
    await ev(page, 'root.querySelector(".zl.c[data-c=\\"Belgium\\"]").click();'); await zem(page, 2);
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
    // its sign with its posts goes out to the side the track went (250 of 412 px in 260 ms); the new sign comes in from the other side (the
    // whole width, 540 ms after 140 ms); the car, its name and its shadow stay where they stand, nothing of them moving (the user,
    // 11. 11. 2026: only the sign that changes moves); then one screen
    const go = (b) => ev(page, `const kf = ${KF}, one = (e) => (kf(e) || [])[0] || '';
      root.querySelector('.nb.' + arg).click();
      const S = [...root.querySelectorAll('#mn > #s-track')], now = S[0], old = S[1], ny = now.querySelector('.yard'), oy = old && old.querySelector('.yard'), W = ny.getBoundingClientRect().width, d = Menu.debug();
      const box = (y, s) => { const e = y && y.querySelector(':scope > ' + s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(v => +v.toFixed(1)); };
      return { id: d.list[d.trackIdx], n: S.length, arrive: d.arrive, W, gone: !!old && old.classList.contains('tgone') && old.inert && old.getAttribute('aria-hidden') === 'true', snap: !!(oy && oy.querySelector(':scope > canvas.c3d.snap')),
        out: oy ? [...oy.querySelectorAll(':scope > .sign, :scope > .post')].map(one) : null, fade: old ? kf(old) : null,
        in: ['.sign', '.post'].map(c => one(ny.querySelector(':scope > ' + c))),
        still: [...(oy ? oy.querySelectorAll(':scope > .car, :scope > canvas.c3d, :scope > canvas.wxcar') : []), ...ny.querySelectorAll(':scope > .car, :scope > canvas.c3d, :scope > canvas.wxcar')].map(e => e.getAnimations().length),
        at: [['.car', '.car'], ['canvas.c3d.snap', 'canvas.c3d:not(.snap)']].map(([o, n]) => [box(oy, o), box(ny, n)]), sh: MenuCar.info().shadow };`, b);
    const end = () => page.waitForFunction(() => { const i = MenuCar.info(); return document.getElementById('menu-host').shadowRoot.querySelectorAll('#mn > #s-track').length === 1 && !Menu.debug().arrive && i.drawn && i.shadow && i.shadow.opacity === 1; }, null, { timeout: 20000 }).then(() => true).catch(() => false);
    const slid = (a, d) => {
      const tx = (v) => 'translateX(' + v.toFixed(0) + 'px)', o = tx(-d * a.W * 250 / 412) + ' 0 260', i = tx(d * a.W);
      return a.n === 2 && a.gone && a.snap && a.arrive > 0 && a.out && a.out.length === 3 && a.out.every(x => x === 'none ' + o) && JSON.stringify(a.fade) === '["1 0 90 340"]' &&
        JSON.stringify(a.in) === JSON.stringify([i + ' none 140 540', i + ' none 140 540']) && a.still.length >= 4 && a.still.every(k => k === 0) &&
        a.at.every(([p, q]) => p && q && p.every((v, k) => Math.abs(v - q[k]) <= 0.5)) && a.sh && a.sh.opacity === 1;
    };
    await page.waitForTimeout(300);
    const al = await go('l'), alEnd = await end(), it = await sign();
    T.check('upright ‹ (Livorno): the old screen fades over the new one while its sign and posts go out to the right and the new sign comes in from the left; the car (a picture of it in the old screen), its name and its shadow stand still at the same place; then one screen, Italy\'s sign',
      al.id === 'livorno' && slid(al, -1) && alEnd && it.key === 'Italy' && /^polygon\(/.test(it.clip) && it.fits, JSON.stringify({ al, alEnd, it }));
    const ar = await go('r'), arEnd = await end(), de2 = await sign();
    T.check('upright › (Nürburg again): the same from the right; then Germany\'s sign', ar.id === 'nring' && slid(ar, 1) && arEnd && de2.key === 'Germany', JSON.stringify({ ar, arEnd, de2 }));
    // the quick list opened as the sign comes in: it stands at once, the old screen gone; the car with its shadow when the list is closed
    const qk = await ev(page, `root.querySelector('.nb.l').click(); const a0 = Menu.debug().arrive, n0 = root.querySelectorAll('#mn > #s-track').length;
      root.querySelector('.trow [data-act="izbor"]').click();
      const y = root.querySelector('#s-track .yard'), d = Menu.debug();
      return { a0, n0, arrive: d.arrive, n: root.querySelectorAll('#mn > #s-track').length, run: [...y.children].reduce((a, e) => a + e.getAnimations().filter(x => x.playState === 'running').length, 0), id: d.list[d.trackIdx] };`);
    const qOpen = await page.waitForFunction(() => MenuIzbor.isOpen(), null, { timeout: 10000 }).then(() => true).catch(() => false);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !MenuIzbor.isOpen(), null, { timeout: 10000 }).catch(() => null);
    const qEnd = await end();
    T.check('the quick list opened as the sign comes in: it stands at once, the old screen gone; the list closed, the car with its shadow',
      qk.a0 > 0 && qk.n0 === 2 && qk.arrive === 0 && qk.n === 1 && qk.run === 0 && qk.id === 'livorno' && qOpen && qEnd, JSON.stringify({ qk, qOpen, qEnd }));
    // a device that asks for less motion: the next track at once
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const cm = await ev(page, `root.querySelector('.nb.r').click(); const y = root.querySelector('#s-track .yard'), d = Menu.debug();
      return { id: d.list[d.trackIdx], n: root.querySelectorAll('#mn > #s-track').length, arrive: d.arrive, run: [...y.children].reduce((a, e) => a + e.getAnimations().length, 0), sh: MenuCar.info().shadow };`);
    T.check('a device that asks for less motion: the next track\'s sign at once (no old screen fading, nothing sliding), the car with its shadow',
      cm.id === 'nring' && cm.n === 1 && cm.arrive === 0 && cm.run === 0 && cm.sh && cm.sh.opacity === 1, JSON.stringify(cm));
    T.check('the signs, the shadow and the sign coming in: no page errors', !real(errors).length, real(errors).join(' | '));
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
    T.check('Dry: the warm sun (the picture bright; no sun rays over it: the user, 12. 11. 2026), nothing on the buttons, nothing in the air, the model or map dry',
      dry.ink.st === 0 && dry.ink.ui === 0 && dry.ink.air === 0 && dry.wet === 0 && /^brightness\(1\.06/.test(dry.f), JSON.stringify(dry));
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
    // a neighbour: the new track's sign comes in with its own (the snow on the sign's top), the car's snow stays with the car, still; the
    // weather goes on
    await click(page, 'weather:snow'); await page.evaluate(() => MenuVreme.settle());
    const nb = await ev(page, `root.querySelector('.nb.r').click(); const y = root.querySelector('#s-track .yard'), n = (s) => { const e = y.querySelector(s); return e ? e.getAnimations().length : -1; };
      return { car: n(':scope > canvas.wxcar'), sc: n(':scope > canvas.wxsc'), n: root.querySelectorAll('#mn > #s-track').length, i: MenuVreme.info() };`);
    T.check('a neighbour tapped: the sign\'s top comes in with it, the car\'s snow stays still with the car, the weather goes on (Snow)', nb.car === 0 && nb.sc > 0 && nb.n === 2 && nb.i.on && nb.i.look === 'snow', JSON.stringify(nb));
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


  // 5a2. the row's mode and difficulty (the user, 16. 11. 2026): a tap the next one, no window (Chapman's Peak: Classic race, Street race,
  //      Police chase, round again; Endless traffic, which it has not, skipped; Spa, a circuit: Classic race alone, a tap leaves it so); Easy,
  //      Medium, Hard, Super hard, round again. Police chase, Race!: the side first, in the race weekend's frame: the getaway chosen, the
  //      police's page grey; a tap on it chooses it, Back to the tracks, Race! again: the police remembered, Race! the pursuit (the player's
  //      patrol car, js/zabava/lov.js); on its side the pad's LB and RB the sides, Start the getaway's race in the police mode
  {
    const row = (page) => ev(page, 'const q = (s) => root.querySelector(".trow " + s); return { md: q(".md").textContent, dif: q(".dif").textContent, sheet: !!root.querySelector(".sheet, .intro"), mode: Menu.debug().mode, at: Menu.debug().list[Menu.debug().trackIdx], diff: __game.S.difficulty, popup: [...root.querySelectorAll(".trow :is(.md, .dif) button")].some(b => b.hasAttribute("aria-haspopup")) };');
    const side = (page) => ev(page, `const w = root.querySelector('.intro.wk.sd'); if (!w) return null; const r = w.querySelector('.wk-go').getBoundingClientRect(), cal = w.querySelector('.wk-cal').getBoundingClientRect();
      const on = (k) => w.querySelector('.sd-' + k).classList.contains('wk-r') && !w.querySelector('.sd-' + k).classList.contains('wk-q') && w.querySelector('.sd-' + k).getAttribute('aria-pressed') === 'true';
      return { pages: [...w.querySelectorAll('.wk-hd')].map(e => e.textContent), side: on('cop') && !on('run') ? 'cop' : on('run') && !on('cop') ? 'run' : '?', off: !w.querySelector('[aria-disabled], .wk-stamp'),
        what: w.querySelector('.wk-what b').textContent, go: w.querySelector('.wk-go').textContent, title: w.querySelector('.wk-ttl h1').textContent, head: w.querySelector('.ix-name h2').firstChild.textContent,
        inView: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5 && cal.left >= 0 && cal.right <= innerWidth + 0.5 && cal.bottom <= r.top, race: !!window.__game.race };`);
    const { ctx, page, errors } = await open({ intro: 0, track: 'chapman', mode: 'race', lastTrack: 'chapman', difficulty: 1 }, { width: 360, height: 640 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    const seen = [await row(page)];
    for (let k = 0; k < 3; k++) { await click(page, 'rmode-next'); seen.push(await row(page)); }
    T.check('the row\'s mode, a tap: the next one the track has, no window (Chapman\'s Peak: Classic race, Street race, Police chase, Classic race again; Endless traffic skipped)',
      JSON.stringify(seen.map(r => r.md)) === '["Classicrace","Streetrace","Policechase","Classicrace"]' && JSON.stringify(seen.map(r => r.mode)) === '["race","duel","chase","race"]' &&
      seen.every(r => !r.sheet && !r.popup && r.at === 'chapman'), JSON.stringify(seen));
    const ds = [];
    for (let k = 0; k < 4; k++) { await click(page, 'diff-next'); ds.push(await row(page)); }
    T.check('the row\'s difficulty, a tap: the next one, no window (Medium, Hard, Super hard, Easy, Medium), the game\'s setting with it',
      JSON.stringify(ds.map(r => r.dif)) === '["Hard","Superhard","Easy","Medium"]' && JSON.stringify(ds.map(r => r.diff)) === '[2,3,0,1]' && ds.every(r => !r.sheet), JSON.stringify(ds));
    await click(page, 'rmode-next'); await click(page, 'rmode-next');
    await click(page, 'race-single');
    await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.intro.wk.sd'), null, { timeout: 120000 }); await page.waitForTimeout(300);
    let sd = await side(page);
    T.check('Police chase, Race!: the side first (Pick your side: Police, Getaway; the getaway chosen, the police\'s page grey but to be chosen; Race! on the page), no race yet',
      sd && JSON.stringify(sd.pages) === '["POLICE","GETAWAY"]' && sd.side === 'run' && sd.off && sd.what === 'Getaway' && /^Race!Don't get caught/i.test(sd.go) && sd.title === 'Pick your side' && sd.head === "Chapman's Peak" && sd.inView && !sd.race, JSON.stringify(sd));
    await page.click('.intro.wk.sd .sd-cop', { force: true }); await page.waitForTimeout(250);
    const cop = await side(page);
    T.check('the police\'s page tapped: the police chosen (its page upright and framed, the getaway\'s grey), the side stays open, no race', cop && cop.side === 'cop' && cop.what === 'Police' && /^Race!Catch them/i.test(cop.go) && cop.inView && !cop.race, JSON.stringify(cop));
    await page.click('.intro.wk.sd [data-wk="back"]');
    const back = await ev(page, 'return { intro: !!root.querySelector(".intro"), screen: Menu.debug().screen, mode: Menu.debug().mode, game: __game.S.mode };');
    T.check('Back: to the tracks, still Police chase (the game\'s mode the police chase)', !back.intro && back.screen === 'track' && back.mode === 'chase' && back.game === 'police', JSON.stringify(back));
    await click(page, 'race-single');
    await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.intro.wk.sd'), null, { timeout: 120000 }); await page.waitForTimeout(200);
    const again = await side(page);
    T.check('Race! again: the police remembered', again && again.side === 'cop', JSON.stringify(again));
    await page.click('.intro.wk.sd [data-wk="go"]');
    await raceOn(page, 'chapman').catch(() => null);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({ id: __game.race && __game.race.track.def.id, mode: __game.S.mode, zb: __game.race && __game.race.zbMode, police: !!(__game.race && __game.race.opts && __game.race.opts.police), intro: !!document.getElementById('menu-host').shadowRoot.querySelector('.intro') }));
    T.check('Police, Race!: the pursuit on Chapman\'s Peak (the game\'s lov: the player\'s patrol car chases the getaway car)', r.id === 'chapman' && r.mode === 'lov' && r.zb === 'lov' && !r.intro, JSON.stringify(r));
    T.check('no page errors in the row and the police chase\'s side', !real(errors).length, real(errors).join(' | '));
    await ctx.close();
  }
  {   // (Spa, a circuit: Classic race alone, the tap leaves it; the police chase's side on its side, 640 x 360: Race! and the pages in view)
    const { ctx, page, errors } = await open({ intro: 0, track: 'spa', mode: 'race', lastTrack: 'spa' }, { width: 640, height: 360 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:race');
    const m0 = await ev(page, 'return [root.querySelector(".trow .md").textContent, Menu.debug().mode, Menu.debug().list[Menu.debug().trackIdx]];');
    await click(page, 'rmode-next');
    const m1 = await ev(page, 'return [root.querySelector(".trow .md").textContent, Menu.debug().mode, !!root.querySelector(".sheet")];');
    T.check('Spa (a circuit, Classic race alone): a tap on the mode leaves it, no window', m0[2] === 'spa' && m0[0] === 'Classicrace' && m1[0] === 'Classicrace' && m1[1] === 'race' && !m1[2], JSON.stringify({ m0, m1 }));
    await ctx.close();
    T.check('no page errors on Spa\'s row', !real(errors).length, real(errors).join(' | '));
  }
  {
    const { ctx, page, errors } = await open({ intro: 0, track: 'chapman', mode: 'police', lastTrack: 'chapman' }, { width: 640, height: 360 });
    await ready(page);
    await click(page, 'single'); await click(page, 'mode:chase');
    await click(page, 'race-single');
    await page.waitForFunction(() => document.getElementById('menu-host').shadowRoot.querySelector('.intro.wk.sd'), null, { timeout: 120000 }); await page.waitForTimeout(300);
    const sd = await ev(page, `const w = root.querySelector('.intro.wk.sd'), r = w.querySelector('.wk-go').getBoundingClientRect(), P = [...w.querySelectorAll('.wk-pg')].map(e => e.getBoundingClientRect());
      return { go: [Math.round(r.right), Math.round(r.bottom), innerWidth, innerHeight], pages: P.every(p => p.top >= 0 && p.bottom <= r.top && p.right <= innerWidth + 0.5 && p.left >= innerWidth * 0.4) };`);
    T.check('the police chase\'s side on its side (640 x 360): the pages at the right, Race! at the very bottom right', sd.pages && sd.go[2] - sd.go[0] <= 24 && sd.go[3] - sd.go[1] <= 24, JSON.stringify(sd));
    const pick = (k) => page.evaluate((k) => { const r = Menu.padKey(k), w = document.getElementById('menu-host').shadowRoot.querySelector('.intro.wk.sd'); return [r, w && w.querySelector('.wk-r').classList.contains('sd-cop') ? 'cop' : 'run']; }, k);
    const lb = await pick('lb'), rb = await pick('rb');
    T.check('the pad on the side: LB the police, RB the getaway', lb[0] && lb[1] === 'cop' && rb[0] && rb[1] === 'run', JSON.stringify({ lb, rb }));
    const ps = await page.evaluate(() => Menu.padKey('start'));
    await raceOn(page, 'chapman').catch(() => null);
    const r = await page.evaluate(() => ({ id: __game.race && __game.race.track.def.id, mode: __game.S.mode }));
    T.check('the pad\'s Start on the side: the getaway, the race', ps && r.id === 'chapman' && r.mode === 'police', JSON.stringify({ ps, r }));
    T.check('no page errors on the police chase\'s side on its side', !real(errors).length, real(errors).join(' | '));
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
});
