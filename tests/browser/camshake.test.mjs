// Tresenje kamere ob trku (Nastavitve): Vklop (the default) shakes the camera when the player hits a barrier, another car or debris
// hard (as before); Izklop leaves the camera still at the same knocks. The choice is saved. On a real track (Spa, Belgija).
//   node tests/browser/camshake.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Tresenje kamere ob trku: Vklop shakes the camera at a hard knock, Izklop does not');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { weather: 'dry', track: 'spa' }, { width: 390, height: 844 });

  // Nastavitve: the row, Vklop by default
  const row = await page.evaluate(() => { const g = window.__game, seg = document.querySelector('[data-set="camShake"]');
    g.onAction('to-settings'); const on = seg && seg.querySelector('button.sel');
    return { seg: !!seg, opts: seg ? [...seg.querySelectorAll('button')].map(b => b.dataset.v) : [], def: g.S.camShake, on: on ? on.dataset.v : null }; });
  T.check('Nastavitve: a "Tresenje kamere ob trku" row with Izklop and Vklop, Vklop by default', row.seg && row.opts.join() === '0,1' && row.def === 1 && row.on === '1', JSON.stringify(row));

  // full throttle, steering hard right off the grid until the player has hit something hard (Sfx.crash with a knock over 3): how many
  // times the game shook the camera at those knocks
  const knocks = (v) => page.evaluate(async (v) => { const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms));
    g.onAction('to-settings'); document.querySelector(`[data-set="camShake"] button[data-v="${v}"]`).click(); g.onAction('settings-done');
    const saved = JSON.parse(localStorage.getItem('tdgp-settings') || 'null');
    const crash = Sfx.crash, shake = Render.shake; let hard = 0, shook = 0;
    Sfx.crash = (i) => { if (i > 3) hard++; return crash(i); }; Render.shake = (a) => { shook++; return shake(a); };
    try { g.sim(8, true); for (let k = 0; k < 400 && !hard; k++) { g.sim(0.05, false, 1, 1, 0); if (k % 40 === 39) await wait(0); } } finally { Sfx.crash = crash; Render.shake = shake; }
    return { set: g.S.camShake, saved: saved && saved.camShake, hard, shook }; }, v);

  await startTrack(page, 'spa');
  const on = await knocks(1);
  T.check('Vklop: a hard knock shakes the camera', on.set === 1 && on.hard > 0 && on.shook > 0, JSON.stringify(on));
  await startTrack(page, 'spa');
  const off = await knocks(0);
  T.check('Izklop: the camera stays still at the same hard knocks; the choice is saved', off.set === 0 && off.saved === 0 && off.hard > 0 && off.shook === 0, JSON.stringify(off));

  T.check('no page errors', errors.length === 0, errors.join('\n'));
} finally {
  await browser.close();
  srv.close();
}
T.done();
