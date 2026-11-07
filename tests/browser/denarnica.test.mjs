// The shared wallet (js/garage.js fromCareer, toCareer; the user's choices denarnica-205 and denarnica-mockup): the garage's real
// profile is the career's (tdgp-career). A career of the game's with 92.000 coins and the PICO TURBO opens the garage on Kariera (marked
// in the MOCKUP row) with 92.000 and the PICO; a turbo bought on it (2.500): the career has 89.500, the PICO's engine at level 1 and its
// part kept for the garage, its races and wins as they were; the KAZE RS bought (62.000): the career has it (27.500 left). The mockup's
// Veteran: its own test money (248.500), the career untouched; Kariera again: 27.500, the KAZE there, the turbo still on the PICO. The
// game (index.html): the career's 27.500 and both cars, the PICO's engine at level 1 on its upgrade screen; the KAZE's aero level 2
// bought there (its price taken). In the garage again: the career's coins, the KAZE with the parts of that level (the SPORT kit). An
// owned car the garage has not saved yet: the game's colour (tdgp-settings) in the garage and in the career.
//   node tests/browser/denarnica.test.mjs
import { serve, launch, checker } from './lib.mjs';

const T = checker('denarnica');
const srv = await serve();
const browser = await launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const career = () => page.evaluate(() => JSON.parse(localStorage.getItem('tdgp-career') || 'null'));
  // (the garage opened, its clock stepped by the test (software WebGL is slow), its guide put away)
  const garage = async () => {
    await page.goto(srv.base + '/garaza.html');
    await page.waitForFunction(() => window.__garage && Garage3D.ready, null, { timeout: 180000 });
    await page.evaluate(() => { __garage.hold = true; if (document.getElementById('g-guide').classList.contains('on')) __garage.guide(99); });
  };
  const run = () => page.evaluate(async () => { let t = 0; do { __garage.advance(0.5); t += 0.5; await new Promise(r => setTimeout(r, 0)); } while (Garage3D.busy && t < 200); return t; });
  const S = () => page.evaluate(() => { const S = __garage.S; return { mode: S.mode, money: S.money, car: S.car, own: Object.keys(S.cars).filter(id => S.cars[id].own), parts: JSON.parse(JSON.stringify(S.cars[S.car].parts)),
    coins: document.getElementById('g-money').textContent, sel: [...document.querySelectorAll('#g-modes button.sel')].map(b => b.dataset.mode) }; });

  // a career of the game's: 92.000 coins, the PICO TURBO, 3 races, 1 win
  await page.goto(srv.base + '/manifest.webmanifest');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('tdgp-career', JSON.stringify({ v: 1, on: true, money: 92000, cars: ['pico'], upg: { pico: { motor: 0, gume: 0, zavore: 0, aero: 0 } }, earned: 5000, races: 3, wins: 1 })); });

  // 1. the garage on the career: Kariera marked, its 92.000, the PICO
  await garage();
  const a = await S();
  T.check('the garage opens on the real profile, the career\'s: Kariera marked in MOCKUP, 92.000 coins, the PICO TURBO its car', a.mode === 'game' && a.money === 92000 && a.coins === '92.000' && a.car === 'pico' && a.own.join() === 'pico' && a.sel.join() === 'game', JSON.stringify(a));

  // 2. a turbo bought on the PICO (2.500): the career pays it, the engine at level 1, the part kept
  await page.evaluate(() => { const v = __garage.findOpt('turbo', 'Turbo'); __garage.openMenu({ el: 'turbo', key: 'rgl:TURBO', sel: v, tab: v[0] }); __garage.buyMenu(); }); await run();
  const b = await S(), c1 = await career();
  T.check('a turbo bought in the garage (2.500): the career has 89.500 and the PICO\'s engine at level 1, the part kept (turbo 6), its races, wins and the career on as they were',
    b.money === 89500 && c1.money === 89500 && c1.upg.pico.motor === 1 && c1.upg.pico.aero === 0 && c1.garage.cars.pico.deli.turbo === 6 && c1.races === 3 && c1.wins === 1 && c1.earned === 5000 && c1.on === true, JSON.stringify({ money: b.money, c1 }));

  // 3. the KAZE RS bought (62.000): the career has it
  await page.evaluate(() => __garage.pickCar('kaze')); await run();
  await page.evaluate(() => __garage.buy()); await run();
  const c2 = await career();
  T.check('the KAZE RS bought in the garage (62.000): the career has both cars, 27.500 left, the KAZE stock', c2.money === 27500 && c2.cars.join() === 'pico,kaze' && JSON.stringify(c2.upg.kaze) === '{"motor":0,"gume":0,"zavore":0,"aero":0}', JSON.stringify(c2));

  // 4. the mockup's Veteran: its own test money, the career untouched; Kariera again: the career's
  await page.evaluate(() => document.querySelector('#g-modes [data-mode="vet"]').click()); await run();
  const v = await S(), c3 = await career();
  await page.evaluate(() => document.querySelector('#g-modes [data-mode="game"]').click()); await run();
  const g = await page.evaluate(() => ({ money: __garage.S.money, kaze: __garage.S.cars.kaze.own, turbo: __garage.S.cars.pico.parts.turbo, want: __garage.findOpt('turbo', 'Turbo'), sel: [...document.querySelectorAll('#g-modes button.sel')].map(b => b.dataset.mode) }));
  T.check('MOCKUP Veteran: its own test money (248.500), the career untouched (27.500); Kariera again: 27.500, the KAZE there, the turbo still on the PICO',
    v.mode === 'vet' && v.money === 248500 && c3.money === 27500 && c3.cars.join() === 'pico,kaze' && g.money === 27500 && g.kaze && JSON.stringify(g.turbo) === JSON.stringify(g.want) && g.sel.join() === 'game', JSON.stringify({ v, c3, g }));
  T.check('no page errors in the garage', !errors.length, errors.slice(0, 5).join(' | '));

  // 5. the game: the career's coins and cars; the PICO's engine at level 1; the KAZE's aero level 2 bought there
  await page.goto(srv.base + '/index.html');
  await page.waitForFunction(() => window.__game && __game.screen === 'title', null, { timeout: 180000 });
  await page.waitForTimeout(500);
  const lv = (id, part) => page.evaluate(([id, part]) => { const g = __game; g.S.car = Core.MODELS.findIndex(m => m.id === id); g.onAction('to-upg'); const b = document.querySelector('#upg-list .upg-seg[data-upg="' + part + '"] button.sel'); return b ? +b.dataset.lv : -1; }, [id, part]);
  const m0 = await page.evaluate(() => ({ career: __game.S && document.getElementById('btn-career').textContent.replace(/\s+/g, ' ') }));
  const pm = await lv('pico', 'motor');
  await lv('kaze', 'aero');
  await page.evaluate(() => document.querySelector('#upg-list .upg-seg[data-upg="aero"] button[data-lv="2"]').click());
  const c4 = await career();
  T.check('the game: the career\'s 27.500 (Kariera · 27.500), the PICO\'s engine at level 1 on its upgrade screen; the KAZE\'s aero level 2 bought there (its price taken)',
    /27\.500/.test(m0.career) && pm === 1 && c4.upg.kaze.aero === 2 && c4.money < 27500 && c4.money > 0 && c4.cars.join() === 'pico,kaze', JSON.stringify({ m0, pm, c4 }));

  // 6. the garage again: the career's coins, the KAZE with the parts of aero level 2 (the SPORT kit)
  await garage();
  await page.evaluate(() => __garage.pickCar('kaze')); await run();
  const k = await page.evaluate(() => { const c = __garage.S.cars.kaze; return { money: __garage.S.money, aero: c.parts.aero, want: __garage.findOpt('aero', 'Sport'), lv: __garage.levels(c.parts), info: Garage3D.info.upg }; });
  T.check('the garage again: the career\'s coins, the KAZE with the parts of the level the game bought (aero 2: the SPORT kit), drawn so', k.money === c4.money && JSON.stringify(k.aero) === JSON.stringify(k.want) && k.lv.aero === 2 && k.lv.motor === 0 && k.info.aero === 2, JSON.stringify(k));

  // 7. an owned car the garage has not saved yet (the LEV S, no garage entry): in the game's colour (tdgp-settings, green 5) in the
  // garage and so kept in the career, not the garage's first colour for it; the KAZE's as it was (the review of 4. 11. 2026)
  await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('tdgp-career')); c.cars.push('levs'); if (c.garage && c.garage.cars) delete c.garage.cars.levs; localStorage.setItem('tdgp-career', JSON.stringify(c));
    const s = JSON.parse(localStorage.getItem('tdgp-settings') || '{}'); s.color = 5; localStorage.setItem('tdgp-settings', JSON.stringify(s)); });
  const c4b = await career();
  await garage();
  await page.evaluate(() => __garage.pickCar('levs')); await run();
  const c5 = await career(), lc = await page.evaluate(() => __garage.S.cars.levs.color);
  T.check('an owned car the garage had not saved (the LEV S): the game\'s colour (5) in the garage and so in the career; the KAZE\'s kept',
    lc === 5 && !!c5.garage && !!c5.garage.cars.levs && c5.garage.cars.levs.color === 5 && c4b.garage.cars.kaze.color === c5.garage.cars.kaze.color, JSON.stringify({ lc, levs: c5.garage && c5.garage.cars.levs, kaze: [c4b.garage.cars.kaze.color, c5.garage.cars.kaze.color] }));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
  await ctx.close();
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
