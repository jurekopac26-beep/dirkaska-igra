// What the parts of the new menu's test share (tests/browser/menu.test.mjs, menu-2.test.mjs, menu-3.test.mjs; split on 27. 11. 2026 so that
// each part runs under 15 min on GitHub, together the same checks as the one test before): the game's server and browser, the menu's page,
// its waits and its helpers in the page's shadow root, the Earth's. menuTest(title, body): body gets them, the checker's summary at the end.
import { serve, launch, openGame, checker } from './lib.mjs';

export async function menuTest(title, body) {
const T = checker(title);
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
  // (the Earth at rest: loaded, drawn, nothing moving; with the motion reduced two frames may be all)
  const zem = (page, n) => page.waitForFunction((n) => window.MenuZemlja && (n ? MenuZemlja.isOpen() && MenuZemlja.depth() === n && MenuZemlja._R() && MenuZemlja._R().n > 0 && !MenuZemlja._R().moving && !document.getElementById('menu-host').shadowRoot.querySelector('.zem-load')
    : !MenuZemlja.isOpen() && !document.getElementById('menu-host').shadowRoot.querySelector('.zem')), n, { timeout: 20000 });
  const EARTH = `const z = root.querySelector(".zem"), R = MenuZemlja._R(), tx = (e) => e ? e.textContent.replace(/\\s+/g, " ").trim() : null, rc = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
    const k = z && z.querySelector(".zem-card.on"), pr = (e) => { const m = e && e.querySelector(".pr"); return m ? m.className.replace("pr ", "") + ":" + m.textContent : ""; };
    return { R, depth: MenuZemlja.depth(), hist: history.state && history.state.nazaj, pad: !!z && Menu.padRoot() === z, dlg: z && z.getAttribute("role") + "/" + z.getAttribute("aria-modal"), title: z && tx(z.querySelector(".zem-title b")) + "|" + tx(z.querySelector(".zem-title small")),
      names: z ? [...z.querySelectorAll(".zl:not(.off)")].filter(e => +e.style.opacity > 0.5).map(e => ({ c: e.dataset.c || "", t: e.dataset.t || "", cur: e.classList.contains("cur"), r: rc(e) })) : [],
      pins: z ? [...z.querySelectorAll(".zp")].map(e => e.dataset.t + ":" + e.className.replace(/^zp ?/, "")) : [], pn: z ? [...z.querySelectorAll(".zp")].filter(e => +e.style.opacity > 0.3).map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, e.classList.contains("cur")]; }) : [], ui: z ? [...z.querySelectorAll(".zem-sq")].map(rc) : [], W: innerWidth, H: innerHeight,
      card: k ? { r: rc(k), title: tx(k.querySelector(".izb-head .t b")), sub: tx(k.querySelector(".izb-head .t small")), rows: [...k.querySelectorAll(".izb-t")].map(e => e.dataset.t + ":" + pr(e.querySelector(".izb-im"))),
        best: k.querySelector(".izb-best") ? pr(k.querySelector(".izb-best")) + "|" + tx(k.querySelector(".izb-best b")) : "", body: k.querySelector(".izb-body") ? rc(k.querySelector(".izb-body")) : null, photo: k.querySelector(".izb-photo img") ? k.querySelector(".izb-photo img").getAttribute("src") + "|" + k.querySelector(".izb-photo img").complete + ":" + k.querySelector(".izb-photo img").naturalWidth : "", scroll: k.querySelector(".izb-body") ? k.querySelector(".izb-body").scrollHeight - k.querySelector(".izb-body").clientHeight : 0, btns: [...k.querySelectorAll(".izb-btns button")].map(e => [tx(e)].concat(rc(e))) } : null,
      moon: z && z.querySelector(".zem-night") ? z.querySelector(".zem-night").getAttribute("aria-pressed") : null, rested: !!root.querySelector("#s-track.rested"), car: window.MenuCar ? MenuCar.info().on : null };`;
  // (no name over another, a button or the card; close in no track's name over a pin (the track shown's own aside), from afar no country's
  // over the track shown's pin; all inside the screen)
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const clean = (v) => v.names.every((a, i) => v.names.every((b, j) => i === j || !hit(a.r, b.r)) && v.ui.every(u => !hit(a.r, u)) && !(v.card && hit(a.r, v.card.r)) && a.r[0] >= 0 && a.r[2] <= v.W && a.r[1] >= 0 && a.r[3] <= v.H &&
    v.pn.every(p => a.cur || (a.c && !p[2]) || !hit(a.r, [p[0] - 7, p[1] - 7, p[0] + 7, p[1] + 7])));
  const wrap = (a) => ((a + 180) % 360 + 360) % 360 - 180;
  await body({ T, srv, browser, PAGE, open, ready, SH, ev, click, done, shown, nuPick, real, raceOn, pageState, KF, zem, EARTH, hit, clean, wrap });
} finally {
  await browser.close(); await srv.close();
}
T.done();
}
