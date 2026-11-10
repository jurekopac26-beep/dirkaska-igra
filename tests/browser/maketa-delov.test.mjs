// The parts' viewing page (maketa-delov/index.html; docs/deli.md, sklop 4): KOLIBRI on the turntable, an element and its option picked:
//  - it loads (every script there, no errors), the list: the 38 elements KOLIBRI has a mount for, each with stock and its 16 options
//  - from the address (?el=krilo&n=12): that part on the car; picking another element and option in the panel (the others off unless
//    kept), several kept at once, the address following them
//  - a hidden part (turbo): its picture under the see-through body (Render.carShot ghost) beside the options
//  - the car on the turntable framed in the free part of the screen (Render.setShowView): left of the panel lying down, above it upright
//   node tests/browser/maketa-delov.test.mjs
import { serve, launch, checker } from './lib.mjs';

const T = checker('maketa-delov');
const srv = await serve();
const browser = await launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 560 } });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  await page.goto(srv.base + '/maketa-delov/index.html?el=krilo&n=12');
  await page.waitForFunction(() => window.__maketa && window.__maketa.ready, null, { timeout: 120000 });
  const A = await page.evaluate(() => {
    const MO = Core.MODELS.find(m => m.id === 'kolibri').def.mounts, els = [...document.querySelectorAll('#el option')].map(o => o.value);
    return { els, mounts: Object.keys(MO).filter(id => DELI_DATA.elementi.some(e => e.id === id)).length, btns: document.querySelectorAll('#opts button:not(.cat)').length,
      on: (document.querySelector('#opts button.on') || {}).textContent, deli: window.__maketa.deli, url: location.search };
  });
  T.check('loads: every script, no errors; the list the 38 elements KOLIBRI has a mount for, stock and 16 options each', !errors.length && A.els.length === 38 && A.els.length === A.mounts && A.btns === 17,
    errors.slice(0, 3).join(' | ') || `${A.els.length} elements, ${A.btns} buttons`);
  T.check('from the address: krilo 12 on the car, its button on', A.deli.krilo === 12 && Object.keys(A.deli).length === 1 && A.on === '12' && /deli=krilo%3A12/.test(A.url), JSON.stringify(A));
  // the panel: another element, its option (the wing off: not kept), then kept: the wing back on beside the brakes
  await page.selectOption('#el', 'zavore');
  await page.locator('#opts button:not(.cat)', { hasText: /^14$/ }).click();
  const B = await page.evaluate(() => ({ deli: window.__maketa.deli, url: location.search }));
  await page.check('#keep');
  await page.selectOption('#el', 'krilo');
  await page.locator('#opts button:not(.cat)', { hasText: /^5$/ }).click();
  const C = await page.evaluate(() => ({ deli: window.__maketa.deli, chips: document.querySelectorAll('#fitted span').length }));
  T.check('the panel: zavore 14 picked (the wing off), then kept: krilo 5 beside it, the address following', JSON.stringify(B.deli) === '{"zavore":14}' && /el=zavore/.test(B.url) &&
    C.deli.zavore === 14 && C.deli.krilo === 5 && C.chips === 2, JSON.stringify({ B, C }));
  // a hidden part: its picture under the see-through body
  await page.evaluate(() => window.__maketa.set({ turbo: 16 }, 'turbo'));
  const G = await page.evaluate(() => { const g = document.getElementById('ghost'); return { shown: g.style.display === 'block', w: g.naturalWidth, len: g.src.length }; });
  T.check('a hidden part (turbo 16): its picture under the see-through body', G.shown && G.w === 640 && G.len > 10000, JSON.stringify(G));
  // framed: the turntable's car (Render.showRect, with the page's view) inside the free part of the screen
  const box = () => page.evaluate(() => { const r = Render.showRect(), p = document.getElementById('panel').getBoundingClientRect(); return { r, p: { left: p.left, top: p.top } }; });
  const L1 = await box();
  T.check('lying down: the car left of the panel, whole', L1.r.x0 >= 0 && L1.r.x1 <= L1.p.left && L1.r.y0 >= 0 && L1.r.y1 <= 560, JSON.stringify(L1));
  await page.setViewportSize({ width: 400, height: 760 }); await page.waitForTimeout(300);
  const L2 = await box();
  T.check('upright: the car above the panel, whole', L2.r.x0 >= 0 && L2.r.x1 <= 400 && L2.r.y0 >= 0 && L2.r.y1 <= L2.p.top, JSON.stringify(L2));
  T.check('no errors on the page throughout', !errors.length, errors.slice(0, 3).join(' | '));
  await ctx.close();
} finally {
  await browser.close(); await srv.close();
  T.done();
}
