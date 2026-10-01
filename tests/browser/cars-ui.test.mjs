// The fleet in the menus and in a race (42 vehicles in 10 categories, Core.CATS):
// - the car screen at 844×390 and at 390×844: the categories (chips) and the strip of the chosen category's cars over the showroom, in
//   their places (nothing off the screen, clear of the panel and the arrows), the panel as it was (and the category under the name);
//   the chosen chips in view; no chip is an arrow (LB / RB, data-act ...car-next / car-prev); switching by touch (a category: its car, the
//   one last looked at there) and by gamepad (X / Y the categories, LB / RB the cars; Start still on "Naprej")
// - one display order everywhere (CATS, then the career price, then the id): the arrows (every car in turn), the strip, the career's
//   garage (by category), the championship's and the online picker
// - the saved car: carId and carV 3; an index from a newer build or an unknown id: the rally car; a new car saved as an index older builds
//   know (car <= 10)
// - the career: the upgrade prices by the car's class; the title demo: one category's field
// - a championship started with the TITAN: its rivals TITANs in the race, in the standings, in the qualifying and the race of the next
//   round after "Izberi avto" took the player to the PICO TURBO and back
// - a destroyed car: VOZILO UNIČENO with Odstopi (two taps), the results with Odstop (no record), Ogled vozila; the lost wheels on the
//   damage picture
// - the commentator's destruction lines: the player's lost part (its own name), wheel, three wheels, the wreck, fire; a rival's wheel,
//   fire and retirement nearby; the counts afresh after a repair
//   node tests/browser/cars-ui.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the fleet in the menus (categories, order, saves, championship, retiring, commentator)');
const srv = await serve();
const browser = await launch();
const wait = (ms) => new Promise(r => setTimeout(r, ms));
// a gamepad stood in for by a script (as in pad.test.mjs): a press lasts one frame of the game
const padInit = () => {
  window.__pad = { id: 'Test pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [window.__pad, null, null, null] });
  const KEY = { 0: 'a', 1: 'b', 2: 'x', 3: 'y', 4: 'lb', 5: 'rb', 9: 'start', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
  window.__press = (i) => new Promise((res) => { const b = window.__pad.buttons[i], k = KEY[i]; b.pressed = true; b.value = 1; let n = 0;
    const check = () => { n++; if (typeof Input !== 'undefined' && Input.pad.prev[k]) { b.pressed = false; b.value = 0; requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => res(true), 30))); }
      else if (n > 600) { b.pressed = false; b.value = 0; res(false); } else requestAnimationFrame(check); };
    requestAnimationFrame(check); });
};
// the display order as the rule gives it (from Core alone)
const expectOrder = () => { const C = Core.CATS.map(c => c.id), p = (m) => Core.CAREER.car[m.id] || 0;
  return Core.MODELS.filter(m => !m.retired).sort((a, b) => C.indexOf(a.cat) - C.indexOf(b.cat) || p(a) - p(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map(m => m.id); };
// the car screen's layout: the rows, the chips, the panel, the arrows (rectangles in CSS pixels)
const layout = () => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height) }; };
  const cats = document.getElementById('car-cats'), strip = document.getElementById('car-strip'), panel = document.querySelector('#s-car .car-panel');
  const arrows = [...document.querySelectorAll('#s-car .arrow')].map(r), csel = cats.querySelector('.sel'), ssel = strip.querySelector('.sel');
  const inRow = (row, el) => { if (!el) return false; const a = row.getBoundingClientRect(), b = el.getBoundingClientRect(); return b.left >= a.left - 1 && b.right <= a.right + 1; };
  const ids = ['car-name', 'car-drive', 'car-cat', 'car-price', 'car-desc', 'car-credit', 'car-stats', 'btn-upg', 'car-colors', 'ctrl-help', 'car-back', 'car-next'];
  return { vw: innerWidth, vh: innerHeight, cats: r(cats), strip: r(strip), panel: r(panel), arrows, nCats: cats.children.length, nStrip: strip.children.length,
    catSel: csel && csel.dataset.cat, carSel: ssel && +ssel.dataset.car, catIn: inRow(cats, csel), carIn: inRow(strip, ssel), back: r(document.getElementById('car-back')), next: r(document.getElementById('car-next')),
    panelIds: ids.every(id => panel.contains(document.getElementById(id))) && !!panel.querySelector('[data-set="control"]'), overflow: document.documentElement.scrollWidth > innerWidth || document.getElementById('app').scrollLeft !== 0,
    acts: [...document.querySelectorAll('#s-car [data-act]')].map(e => e.dataset.act), chipActs: [...document.querySelectorAll('#car-cats button, #car-strip button')].filter(e => e.dataset.act).length,
    stripIds: [...strip.children].map(e => Core.MODELS[+e.dataset.car].id), cat: document.getElementById('car-cat').textContent, name: document.getElementById('car-name').textContent };
};
const overlap = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
try {
  // 1. the car screen at 844×390 (a phone on its side): the rows over the showroom, left of the panel
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'iso', carV: 3, carId: 'kaze' }, { width: 844, height: 390 }, { init: padInit });
    const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
    await act('to-car'); await wait(400);
    const L = await page.evaluate(layout);
    T.check('844×390: the categories across the top (12 px from the left, 8 px down, 34 px tall), the strip along the bottom (8 px up, 44 px tall), both ending 12 px before the panel',
      Math.abs(L.cats.l - 12) <= 1 && Math.abs(L.cats.t - 8) <= 1 && L.cats.h === 34 && Math.abs(L.strip.b - (L.vh - 8)) <= 1 && L.strip.h === 44 && Math.abs(L.cats.r - (L.panel.l - 12)) <= 1 && Math.abs(L.strip.r - (L.panel.l - 12)) <= 1,
      JSON.stringify({ cats: L.cats, strip: L.strip, panel: L.panel }));
    T.check('844×390: nothing off the screen, the rows clear of the panel and the arrows; the panel as it was (its parts all in it, Nazaj / Naprej on the screen), the category under the name',
      !L.overflow && !overlap(L.cats, L.panel) && !overlap(L.strip, L.panel) && L.arrows.every(a => !overlap(a, L.cats) && !overlap(a, L.strip)) && L.panelIds && L.next.b <= L.vh && L.next.r <= L.vw && L.back.l >= L.panel.l && /^Športni · 2\/6$/.test(L.cat),
      JSON.stringify({ overflow: L.overflow, arrows: L.arrows, next: L.next, cat: L.cat }));
    T.check('844×390: 10 category chips, the car\'s chosen and in view; its category\'s cars in the strip (cheapest first), the chosen one in view; no chip with an arrow\'s data-act',
      L.nCats === 10 && L.catSel === 'sportni' && L.catIn && L.stripIds.join() === 'lisica,kaze,sokol,panter,vortex,jelen' && L.carIn && L.chipActs === 0 && L.acts.filter(a => /car-(next|prev)$/.test(a)).sort().join() === 'car-next,car-prev',
      JSON.stringify({ nCats: L.nCats, catSel: L.catSel, catIn: L.catIn, strip: L.stripIds, carIn: L.carIn, acts: L.acts }));

    // 2. switching by touch: a category (its first car, later the one last looked at there), a car of the strip
    const tap = (sel) => page.evaluate((sel) => { document.querySelector(sel).click(); }, sel);
    const now = () => page.evaluate(() => ({ id: Core.MODELS[window.__game.S.car].id, name: document.getElementById('car-name').textContent, strip: [...document.querySelectorAll('#car-strip .car-chip')].map(e => Core.MODELS[+e.dataset.car].id).join(), sel: (document.querySelector('#car-cats .sel') || {}).dataset.cat, carSel: (document.querySelector('#car-strip .sel') || { dataset: {} }).dataset.car, cat: document.getElementById('car-cat').textContent }));
    await tap('#car-cats [data-cat="tovornjaki"]'); await wait(150); const t1 = await now();
    await tap('#car-strip [data-car="' + await page.evaluate(() => Core.MODELS.findIndex(m => m.id === 'kamen')) + '"]'); await wait(150); const t2 = await now();
    await tap('#car-cats [data-cat="mali"]'); await wait(150); const t3 = await now();
    await tap('#car-cats [data-cat="tovornjaki"]'); await wait(150); const t4 = await now();
    T.check('touch: Tovornjaki gives the TITAN (the strip: TITAN, KAMEN), a tap on KAMEN PUŠČAVA picks it, Mali avti the PICO TURBO, Tovornjaki again the KAMEN (the one last looked at)',
      t1.id === 'titan' && t1.strip === 'titan,kamen' && t1.sel === 'tovornjaki' && /^Tovornjaki · 1\/2$/.test(t1.cat) && t2.id === 'kamen' && t2.name === 'KAMEN PUŠČAVA' && t3.id === 'pico' && t3.sel === 'mali' && t4.id === 'kamen',
      JSON.stringify({ t1, t2, t3, t4 }));

    // 3. the gamepad: Start on "Naprej" (as ever), X / Y the categories, LB / RB the cars in the display order
    const press = (i) => page.evaluate((i) => window.__press(i), i);
    await act('to-title'); await wait(200);
    await press(9); await wait(150);   // (Start on the title: the car screen)
    const f0 = await page.evaluate(() => { const f = document.querySelector('.pad-focus'); return { screen: window.__game.screen, focus: f && f.dataset.act }; });
    await press(3); const y1 = await now(); await press(3); const y2 = await now(); await press(2); const x1 = await now();
    await press(5); const rb = await now(); await press(4); const lb = await now();
    await press(12); const up = await page.evaluate(() => { const f = document.querySelector('.pad-focus'); return f ? f.dataset.act || f.dataset.v || f.dataset.col || f.textContent.trim() : ''; });
    T.check('gamepad: Start shows the car screen with the highlight on "Naprej"; Y the next category (Tovornjaki → Električni → Posebni), X the one before; RB the next car, LB back; up leaves "Naprej"',
      f0.screen === 'car' && f0.focus === 'to-track' && y1.sel === 'elektricni' && y1.id === 'jezek' && y2.sel === 'posebni' && x1.sel === 'elektricni' && rb.id === 'ev' && lb.id === 'jezek' && up && up !== 'to-track',
      JSON.stringify({ f0, y1: y1.id, y2: y2.id, x1: x1.id, rb: rb.id, lb: lb.id, up }));

    // 4. one order everywhere: the rule's, every car in turn on the arrows (forwards and back), the strip a slice of it
    const ord = await page.evaluate(async (src) => {
      const g = window.__game, want = (0, eval)('(' + src + ')')(), seen = [], back = [];
      g.onAction('to-car'); await new Promise(r => setTimeout(r, 100));
      g.S.car = Core.MODELS.findIndex(m => m.id === want[0]); g.onAction('car-prev'); g.onAction('car-next');
      for (let k = 0; k < want.length; k++) { seen.push(Core.MODELS[g.S.car].id); g.onAction('car-next'); }
      const wrap = Core.MODELS[g.S.car].id;
      for (let k = 0; k < want.length; k++) { g.onAction('car-prev'); back.push(Core.MODELS[g.S.car].id); }
      return { want, game: g.carOrder, seen, wrap, back };
    }, expectOrder.toString());
    T.check('the display order: by category (Core.CATS), the cheapest first, then by id; the arrows visit all 42 cars in it and come round again, the other way back',
      ord.want.length === 42 && ord.game.join() === ord.want.join() && ord.seen.join() === ord.want.join() && ord.wrap === ord.want[0] && ord.back.join() === ord.want.slice().reverse().join(),
      JSON.stringify({ n: ord.want.length, game: ord.game.slice(0, 8), seen: ord.seen.slice(0, 8), wrap: ord.wrap }));

    // 5. the online picker in the same order (a room made without the network: Net stood in for)
    const net = await page.evaluate(() => {
      const g = window.__game, keep = { available: Net.available, host: Net.host, send: Net.send, close: Net.close }, sent = [];
      Net.available = () => true; Net.host = () => { }; Net.send = (m) => sent.push(m); Net.close = () => { };
      try {
        g.onAction('to-online'); g.onAction('net-host');
        g.S.car = Core.MODELS.findIndex(m => m.id === 'pico'); const ids = [];
        for (let k = 0; k < 6; k++) { g.onAction('net-car-next'); ids.push(Core.MODELS[g.S.car].id); }
        g.onAction('net-car-prev'); const prev = Core.MODELS[g.S.car].id;
        const shown = document.getElementById('on-mycar').textContent;
        g.onAction('net-leave');
        return { ids, prev, shown, sent: sent.filter(m => m.t === 'me').map(m => m.car) };
      } finally { Object.assign(Net, keep); }
    });
    T.check('the online picker: the same order (PICO TURBO → MIŠKA → KOLIBRI → RAKETA 16V → PEUGEOT 206 → LISICA), the friend told each time',
      net.ids.join() === 'miska,kolibri,raketa,p206,lisica,kaze' && net.prev === 'lisica' && net.sent.join() === net.ids.concat(['lisica']).join() && net.shown === 'LISICA', JSON.stringify(net));
    // 5b. the championship's picker in the same order too (the arrows; Y on a pad: the next category's car)
    const chp = await page.evaluate(async () => { const g = window.__game, id = () => Core.MODELS[g.S.car].id, ids = [];
      g.onAction('to-champ'); await new Promise(r => setTimeout(r, 150)); g.S.car = Core.MODELS.findIndex(m => m.id === 'pico');
      for (let k = 0; k < 3; k++) { g.onAction('champ-car-next'); ids.push(id()); } g.onAction('champ-car-prev'); ids.push(id());
      return { ids, shown: document.getElementById('ch-mycar').textContent }; });
    await press(3); const chY = await page.evaluate(() => ({ id: Core.MODELS[window.__game.S.car].id, shown: document.getElementById('ch-mycar').textContent }));
    T.check('the championship\'s picker: the same order (MIŠKA → KOLIBRI → RAKETA 16V, back to KOLIBRI); Y on the pad: the next category\'s car (LISICA)',
      chp.ids.join() === 'miska,kolibri,raketa,kolibri' && chp.shown === 'KOLIBRI' && chY.id === 'lisica' && chY.shown === 'LISICA', JSON.stringify({ chp, chY }));
    T.check('no page errors (844×390)', !errors.length, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }

  // 6. the car screen at 390×844 (upright): the categories at y 8-42, the strip at 48-92, full width, above the car and the panel
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', carV: 3, carId: 'tiger' }, { width: 390, height: 844 });
    await page.evaluate(() => window.__game.onAction('to-car')); await wait(400);
    const L = await page.evaluate(layout);
    T.check('390×844: the categories at y 8-42 and the strip at 48-92, the full width (10 px from each side)',
      L.cats.t === 8 && L.cats.b === 42 && L.strip.t === 48 && L.strip.b === 92 && L.cats.l === 10 && L.cats.r === L.vw - 10 && L.strip.l === 10 && L.strip.r === L.vw - 10, JSON.stringify({ cats: L.cats, strip: L.strip }));
    T.check('390×844: nothing off the screen, the rows clear of the panel and the arrows, the panel as it was, the chosen chips in view (Dirkalni, TIGER GT)',
      !L.overflow && !overlap(L.cats, L.panel) && !overlap(L.strip, L.panel) && L.arrows.every(a => a.t >= L.strip.b && !overlap(a, L.cats)) && L.panelIds && L.next.b <= L.vh && L.catSel === 'dirkalni' && L.catIn && L.carIn &&
      L.stripIds.join() === 'mravlja,kozorog,tornado,strelica,tiger,bizon,formula,lm' && /^Dirkalni · 5\/8$/.test(L.cat),
      JSON.stringify({ panel: L.panel, arrows: L.arrows, catSel: L.catSel, catIn: L.catIn, carIn: L.carIn, strip: L.stripIds, cat: L.cat }));
    // a short phone (360×640): the same rows, the arrows still below the strip, Naprej on the screen
    await page.setViewportSize({ width: 360, height: 640 }); await wait(400);
    const S6 = await page.evaluate(layout);
    T.check('360×640: the rows across the top, the arrows below the strip, the rows clear of the panel, nothing off the screen',
      S6.cats.t === 8 && S6.strip.b === 92 && S6.cats.r === S6.vw - 10 && S6.arrows.every(a => a.t >= S6.strip.b) && !overlap(S6.strip, S6.panel) && !S6.overflow && S6.next.b <= S6.vh && S6.catIn && S6.carIn,
      JSON.stringify({ cats: S6.cats, strip: S6.strip, arrows: S6.arrows, panel: S6.panel, next: S6.next }));
    await page.setViewportSize({ width: 390, height: 844 }); await wait(300);
    // the career: ✓ for the cars in the garage, the price for the others; the garage by category in the display order; upgrade prices by class
    const car = await page.evaluate(async () => {
      const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
      g.onAction('to-career'); g.onAction('career-toggle'); await wait(150);
      const kids = [...document.getElementById('career-garage').children].map(e => e.tagName === 'H4' ? '#' + e.textContent : e.dataset.g + ':' + e.querySelector('b').textContent);
      g.onAction('to-title'); g.onAction('to-car'); await wait(200); document.querySelector('#car-cats [data-cat="dirkalni"]').click(); await wait(100);   // (the career gave the PICO TURBO: back to the TIGER GT)
      const chips = [...document.querySelectorAll('#car-strip .car-chip')].map(e => e.textContent);
      const price = (id) => { g.S.car = Core.MODELS.findIndex(m => m.id === id); g.career.cars.push(id); g.career.upg[id] = { motor: 0, gume: 0, zavore: 0, aero: 0 }; g.onAction('to-upg');
        const t = [...document.querySelectorAll('[data-upg="motor"] button')].map(b => b.textContent); g.onAction('upg-done'); return t; };
      return { kids, chips, pico: price('pico'), titan: price('titan'), mravlja: price('mravlja'), skorpijon: price('skorpijon') };
    });
    const wantKids = await page.evaluate((src) => { const want = (0, eval)('(' + src + ')')(), out = [];
      for (const c of Core.CATS) { const L = want.filter(id => Core.MODELS.find(m => m.id === id).cat === c.id); if (!L.length) continue; out.push('#' + c.name); for (const id of L) out.push(c.id + ':' + Core.MODELS.find(m => m.id === id).name); }
      return out; }, expectOrder.toString());
    const heads = car.kids.filter(k => k[0] === '#');
    T.check('the career\'s garage: every car under its category\'s heading (Mali avti … Posebni), in the display order',
      car.kids.join('|') === wantKids.join('|') && car.kids.length === 52 && heads.length === 10 && heads[0] === '#Mali avti' && heads[9] === '#Posebni', JSON.stringify(car.kids.slice(0, 8)));
    T.check('the career\'s strip: a price on the cars to buy (TIGER GT 85.000 €), a tick on the one in the garage',
      car.chips.some(t => /^TIGER GTFR85\.000/.test(t)) && car.chips.every(t => /€|✓/.test(t)), JSON.stringify(car.chips));
    T.check('the career\'s upgrade prices by class: the PICO TURBO as before (4.000 €), the TITAN ×1.2 (4.800 €), the MRAVLJA ×0.3 (1.200 €), ŠKORPIJON H ×2 (8.000 €; all three levels 46.000 €)',
      /4\.000/.test(car.pico[1]) && /23\.000/.test(car.pico[3]) && /4\.800/.test(car.titan[1]) && /1\.200/.test(car.mravlja[1]) && /8\.000/.test(car.skorpijon[1]) && /46\.000/.test(car.skorpijon[3]),
      JSON.stringify({ pico: car.pico, titan: car.titan, mravlja: car.mravlja, skorpijon: car.skorpijon }));
    T.check('no page errors (390×844)', !errors.length, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }

  // 7. the saved car: carId and carV 3 (the rally car for what this build does not know); a new car saved as an index older builds know
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', null, { width: 480, height: 270 });
    const load = async (raw) => { await page.evaluate((raw) => localStorage.setItem('tdgp-settings', raw), raw); await page.reload(); await page.waitForFunction(() => window.__game, null, { timeout: 60000 });
      return page.evaluate(() => ({ car: Core.MODELS[window.__game.S.car].id, stored: JSON.parse(localStorage.getItem('tdgp-settings') || 'null') })); };
    const m1 = await load(JSON.stringify({ carV: 2, car: 35, sound: 0, comm: 0 }));
    const m2 = await load(JSON.stringify({ carV: 3, carId: 'xx', car: 12, sound: 0, comm: 0 }));
    const m3 = await load(JSON.stringify({ carV: 3, carId: 'titan', car: 4, sound: 0, comm: 0 }));
    const m4 = await load(JSON.stringify({ carV: 2, car: 7, sound: 0, comm: 0 }));
    T.check('loading: {carV 2, car 35} (a newer build\'s index) → the rally car; {carV 3, carId "xx", car 12} → the rally car; carId "titan" → the TITAN; {carV 2, car 7} → index 7 kept (TAIFUN LM), saved as carV 3 with its id',
      m1.car === 'rally' && m2.car === 'rally' && m3.car === 'titan' && m4.car === 'lm' && m4.stored.carV === 3 && m4.stored.carId === 'lm' && m4.stored.car === 7, JSON.stringify({ m1: m1.car, m2: m2.car, m3: m3.car, m4 }));
    const sv = await page.evaluate(async () => { const g = window.__game; g.onAction('to-car'); await new Promise(r => setTimeout(r, 150)); document.querySelector('#car-cats [data-cat="posebni"]').click(); await new Promise(r => setTimeout(r, 100));
      return { car: Core.MODELS[g.S.car].id, stored: JSON.parse(localStorage.getItem('tdgp-settings')), rally: Core.MODELS.findIndex(m => m.id === 'rally') }; });
    await page.reload(); await page.waitForFunction(() => window.__game, null, { timeout: 60000 });
    const m5 = await page.evaluate(() => Core.MODELS[window.__game.S.car].id);
    T.check('saving a new car (PREDSEDNIK, index 40): carId "predsednik", car ≤ 10 (the rally car\'s index), carV 3; read back as the PREDSEDNIK',
      sv.car === 'predsednik' && sv.stored.carId === 'predsednik' && sv.stored.car <= 10 && sv.stored.car === sv.rally && sv.stored.carV === 3 && m5 === 'predsednik', JSON.stringify({ sv, m5 }));
    const demo = await page.evaluate(() => { const g = window.__game, M = Core.MODELS.find(m => m.id === g.demoModel), F = M && M.field ? M.field : null;
      return { id: g.demoModel, cat: M && M.cat, field: F, cars: g.demo.cars.map(c => c.m.id), ok: !!M && g.demo.cars.every(c => (M.oneMake ? [M.id] : F || ['kaze', 'vortex', 'pico', 'strega']).includes(c.m.id)) }; });
    T.check('the title demo: one category\'s vehicle picked, the AI in its field', demo.ok && !!demo.cat, JSON.stringify(demo));
    T.check('no page errors (saves)', !errors.length, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }

  // 8. a championship started with the TITAN: its rivals TITANs; after "Izberi avto" to the PICO TURBO, still TITANs in the next round's
  //    qualifying and race; the standings show them
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', name: 'Ana', carV: 3, carId: 'titan', quali: 0, damage: 1 }, { width: 480, height: 270 });
    const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
    const rivals = () => page.evaluate(() => { const r = window.__game.race; return { n: r.cars.length, cars: [...new Set(r.cars.filter(c => !c.isPlayer).map(c => c.m.id))].join(), me: r.player.m.id, champ: !!r.champ }; });
    await act('to-champ'); await wait(250);
    const pick0 = await page.evaluate(() => document.getElementById('ch-diff').textContent);
    await page.evaluate(() => document.querySelector('[data-champ="domaci"]').click()); await act('champ-go');
    await page.waitForFunction(() => { const g = window.__game; return !!(g.race && g.race.champ && g.race.track.def.id === 'jezero'); }, null, { timeout: 90000 });
    const r1 = await rivals();
    await page.evaluate(async () => { const g = window.__game; g.pause(); for (let i = 0; i < 400 && g.phase !== 'done'; i++) { g.sim(1, true); if (i % 20 === 0) await new Promise(r => setTimeout(r, 0)); } });
    await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 60000 });
    await page.evaluate(() => document.getElementById('res-restart').click()); await wait(300);
    const st = () => page.evaluate(() => ({ rows: [...document.querySelectorAll('#ch-body tbody tr')].map(r => r.children[2].textContent), mycar: document.getElementById('ch-mycar').textContent, diff: document.getElementById('ch-diff').textContent, saved: JSON.parse(localStorage.getItem('tdgp-champ') || 'null') }));
    const s1 = await st();
    T.check('a championship with the TITAN: round 1 against nine TITANs; the standings: 10 drivers, every rival in a TITAN; the car kept with the championship',
      /tekmeci: 9× TITAN/.test(pick0) && r1.champ && r1.n === 10 && r1.cars === 'titan' && s1.rows.length === 10 && s1.rows.filter(c => c === 'TITAN').length === 10 && s1.saved.car === 'titan' && s1.saved.rounds[0].order.length + (s1.saved.rounds[0].dnf || []).length === 10,
      JSON.stringify({ pick0, r1, s1 }));
    // Izberi avto: the car screen (its button "Izberi", Nazaj back to the championship), the PICO TURBO picked, back
    await act('champ-car'); await wait(200);
    const cs = await page.evaluate(() => ({ screen: window.__game.screen, next: document.getElementById('car-next').dataset.act + ':' + document.getElementById('car-next').textContent, back: document.getElementById('car-back').dataset.act }));
    await page.evaluate(() => { document.querySelector('#car-cats [data-cat="mali"]').click(); }); await wait(100);
    await page.evaluate(() => document.getElementById('car-next').click()); await wait(300);
    const s2 = await st();
    T.check('"Izberi avto": the car screen with "Izberi" (Nazaj back too), then the championship again with the PICO TURBO; its rivals still TITANs (the standings, "tekmeci: 9× TITAN")',
      cs.screen === 'car' && cs.next === 'car-champ:Izberi' && cs.back === 'car-champ' && s2.mycar === 'PICO TURBO' && s2.rows.filter(c => c === 'TITAN').length === 9 && s2.rows.includes('PICO TURBO') && /tekmeci: 9× TITAN/.test(s2.diff) && await page.evaluate(() => window.__game.screen) === 'champ',
      JSON.stringify({ cs, s2: { rows: s2.rows, mycar: s2.mycar, diff: s2.diff } }));
    // round 2 with qualifying: sized and driven by the championship's TITAN field, the race too
    await page.evaluate(() => { window.__game.S.quali = 1; });
    await act('champ-go');
    await page.waitForFunction(() => { const g = window.__game; return !!(g.race && g.race.champ && g.race.track.def.id === 'ljubljana' && g.race.quali); }, null, { timeout: 90000 });
    const q0 = await page.evaluate(() => window.__game.qual.n);
    // a destroyed car on the qualifying lap: the banner offers the lap again ("Ponovi krog"), which drives it again (the rivals' laps kept)
    const qb = await page.evaluate(async () => { const g = window.__game, raf = () => new Promise(q => requestAnimationFrame(q)); g.pause(); g.sim(3, true); g.race.player.dmg = 0.99; g.resume(); for (let i = 0; i < 6; i++) await raf();
      const el = document.getElementById('h-wreck'), b = document.getElementById('btn-retire'), o = { show: el.classList.contains('show'), title: document.getElementById('h-wreck-t').textContent, btn: !b.classList.contains('off') && b.textContent };
      b.click(); await raf(); return Object.assign(o, { quali: g.race.quali, dmg: g.race.player.dmg, back: Math.round(-g.race.player.dist), banner: el.classList.contains('show') }); });
    T.check('qualifying: a destroyed car gets "VOZILO UNIČENO" with "Ponovi krog", which drives the lap again (a new car on the run-up)',
      qb.show && qb.title === 'VOZILO UNIČENO' && qb.btn === 'Ponovi krog' && qb.quali && qb.dmg === 0 && qb.back > 300 && !qb.banner, JSON.stringify(qb));
    await page.evaluate(() => { const g = window.__game; g.pause(); for (let i = 0; i < 300 && g.phase !== 'done'; i++) g.sim(1, true); g.resume(); });
    await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 120000 });
    const qr = await page.evaluate(() => [...document.querySelectorAll('#res-table tbody tr')].map(r => r.children[2].textContent));
    await act('quali-go'); await wait(300);
    const r2 = await rivals();
    T.check('round 2 in the PICO TURBO: qualifying with the nine TITANs (sized and driven by the championship\'s car), the race after it the same nine',
      q0 === 9 && qr.length === 10 && qr.filter(c => c === 'TITAN').length === 9 && qr.includes('PICO TURBO') && r2.n === 10 && r2.cars === 'titan' && r2.me === 'pico', JSON.stringify({ q0, qr, r2 }));
    T.check('no page errors (championship)', !errors.length, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }

  // 9. a destroyed car: VOZILO UNIČENO with Odstopi (the second tap retires), the wheels on the damage picture, the results with Odstop,
  //    no record; Ogled vozila there; the commentator's destruction lines (the game's calls recorded)
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'iso', carV: 3, carId: 'kozorog', damage: 2, track: 'jezero' }, { width: 844, height: 390 });
    await page.evaluate(() => { window.__said = []; const o = Comm.say; Comm.say = (k, v, p, q) => { window.__said.push({ k, v: v ? JSON.parse(JSON.stringify(v)) : null, t: window.__game.race ? +window.__game.race.time.toFixed(2) : 0 }); return o(k, v, p, q); }; });
    await startTrack(page, 'jezero');
    const said = () => page.evaluate(() => window.__said.map(s => s.k + (s.v && (s.v.part || s.v.wheel || s.v.a) ? ':' + (s.v.part || s.v.wheel || s.v.a) : '')));
    // the commentator: run, then the player's door, a wheel (on three for a while), the rivals' troubles near the player
    const c1 = await page.evaluate(() => {
      const g = window.__game, r = g.race, P = r.player; g.pause(); g.sim(9, true);
      window.__said.length = 0;
      Core.detachPart(P, 'doorL'); g.sim(0.5, true);
      Core.detachPart(P, 'wheelRL'); g.sim(8, true);
      const near = r.cars.filter(c => c !== P).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z));
      Core.detachPart(near[0], 'wheelFR'); g.sim(0.5, true);
      near[1].dmg = 0.95; g.sim(0.5, true);
      r.retire(near[2]); g.sim(0.5, true);
      return { names: near.slice(0, 3).map(c => c.name), d: near.slice(0, 3).map(c => Math.round(Math.hypot(c.x - P.x, c.z - P.z))) };
    });
    const k1 = await said();
    T.check('the commentator: the player\'s part by its name ("left door"), the wheel ("rear left wheel"), on three wheels; near rivals: a lost wheel, a fire, a retirement (their names)',
      k1.includes('partLost:left door') && k1.includes('wheelLost:rear left wheel') && k1.includes('threeWheels') && k1.includes('rivalWheel:' + c1.names[0]) && k1.includes('fire:' + c1.names[1]) && k1.includes('rivalWreck:' + c1.names[2]),
      JSON.stringify({ k1, c1 }));
    // a repair (or the marshals' refit) starts the counts afresh: the same part again is said again
    const k2 = await page.evaluate(() => { const g = window.__game, r = g.race, P = r.player; window.__said.length = 0; r.repairCar(P); g.sim(7, true); Core.detachPart(P, 'doorL'); g.sim(0.5, true); return window.__said.map(s => s.k + ':' + ((s.v && s.v.part) || '')); });
    T.check('after a repair the same lost part is told again', k2.includes('partLost:left door'), JSON.stringify(k2));
    // destroyed: VOZILO UNIČENO (wheels on the picture, the lost ones marked), the wreck and the fire said; Odstopi asks, then retires
    const w = await page.evaluate(async () => {
      const g = window.__game, r = g.race, P = r.player; window.__said.length = 0;
      Core.wreckCar(P); g.sim(1, true); g.resume(); for (let i = 0; i < 6; i++) await new Promise(q => requestAnimationFrame(q));
      const el = document.getElementById('h-wreck'), b = document.getElementById('btn-retire');
      return { show: el.classList.contains('show') && getComputedStyle(el).display !== 'none', title: document.getElementById('h-wreck-t').textContent, btn: !b.classList.contains('off') && b.textContent,
        whl: document.getElementById('h-dmg').classList.contains('whl'), lost: [0, 1, 2, 3].filter(k => document.getElementById('wh' + k).classList.contains('lost')).length, nL: P.wreck.nL, said: window.__said.map(s => s.k) };
    });
    T.check('destroyed: "VOZILO UNIČENO" under the minimap with "Odstopi"; the damage picture with the wheels, the lost ones marked; the wreck and the fire said',
      w.show && w.title === 'VOZILO UNIČENO' && w.btn === 'Odstopi' && w.whl && w.lost === w.nL && w.nL > 0 && w.said.includes('wreck') && w.said.includes('fireMe'), JSON.stringify(w));
    const p0 = await page.evaluate(() => { window.__game.pause(); const b = document.getElementById('pause-retire'); const v = !b.classList.contains('off'); window.__game.resume(); return v; });
    const tap1 = await page.evaluate(() => { document.getElementById('btn-retire').click(); return { btn: document.getElementById('btn-retire').textContent, screen: window.__game.screen }; });
    const tap2 = await page.evaluate(async () => { document.getElementById('btn-retire').click(); await new Promise(r => setTimeout(r, 300)); const g = window.__game, r = g.race;
      const me = document.querySelector('#res-table tr.me'); return { screen: g.screen, phase: g.phase, title: document.getElementById('res-title').textContent, pos: document.getElementById('res-pos').textContent, sub: document.getElementById('res-sub').textContent,
        row: me && [...me.children].map(td => td.textContent), dnfRow: !!(me && me.classList.contains('dnf')), out: r.isOut(r.player), rec: JSON.parse(localStorage.getItem('tdgp-records') || '{}'), said: window.__said.map(s => s.k),
        last: (() => { const rows = [...document.querySelectorAll('#res-table tbody tr')], i = rows.findIndex(x => x.classList.contains('dnf')); return i >= 0 && rows.slice(i).every(x => x.classList.contains('dnf')); })() }; });
    const rec = tap2.rec.tracks && tap2.rec.tracks['jezero@cs'];
    T.check('Odstopi: the first tap asks ("Res odstopiš?"), the race goes on; the pause offers it too',
      tap1.btn === 'Res odstopiš?' && tap1.screen === 'none' && p0, JSON.stringify({ tap1, p0 }));
    T.check('the second tap: retired, the results ("Odstop", no place), the player among the retired at the end with "Odstop" instead of a time; no race time or place in the records; the commentator says so',
      tap2.screen === 'results' && tap2.title === 'Odstop' && tap2.pos === '✕' && /^Odstop v 1\. krogu/.test(tap2.sub) && tap2.row && tap2.row[0] === '–' && tap2.row[3] === 'Odstop' && tap2.dnfRow && tap2.last && tap2.out && !(rec && (rec.bestRace || rec.bestPos)) && tap2.said.includes('retired'),
      JSON.stringify({ tap2: Object.assign({}, tap2, { rec }) }));
    // Ogled vozila: the photo mode on the player's car, up close; back to the results
    const v = await page.evaluate(async () => { const g = window.__game; document.getElementById('res-view').click(); await new Promise(r => setTimeout(r, 200));
      const s = Render.cam.shot, P = g.race.player, d = s ? Math.hypot(s.px - P.x, s.pz - P.z) : -1; const scr = g.screen;
      g.onAction('ph-exit'); await new Promise(r => setTimeout(r, 150)); return { scr, d, back: g.screen }; });
    T.check('"Ogled vozila" on the results: the photo mode on the player\'s car (up close), back to the results', v.scr === 'photo' && v.d > 4 && v.d < 18 && v.back === 'results', JSON.stringify(v));
    // every new pool of the commentator has its lines, the names filled in
    const pools = await page.evaluate(() => { Comm.setEnabled(true); Comm.setSpeech(true); const out = {};
      for (const k of ['wheelLost', 'threeWheels', 'wreck', 'fireMe', 'retired', 'rivalWheel', 'rivalWreck', 'fire']) { const it = Comm.say(k, { a: 'M. Kovač', wheel: 'front left wheel' }, 9); out[k] = it ? it.text : null; }
      Comm.stop(); Comm.setEnabled(false); return { avail: Comm.available(), out }; });
    T.check('the commentator\'s new pools (wheelLost, threeWheels, wreck, fireMe, retired, rivalWheel, rivalWreck, fire): lines with the names filled in',
      pools.avail && Object.values(pools.out).every(t => typeof t === 'string' && t.length > 12 && !/[{}]/.test(t)) && /front left wheel/.test(pools.out.wheelLost) && /M\. Kovač/.test(pools.out.rivalWreck), JSON.stringify(pools));
    T.check('no page errors (retiring)', !errors.length, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
