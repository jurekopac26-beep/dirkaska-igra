// Tresenje kamere (Nastavitve): four rows, each Izklop / Vklop, all Izklop by default: ob trku (a hard knock on a barrier, another car or
// debris), ob pristanku (landing after a jump), na robnikih (a wheel on a kerb's ridges), v misijah (the bridge of Narasla reka: m48).
// Izklop leaves the camera still, Vklop shakes it; the choice is saved. On a real track (Spa, Belgija).
//   node tests/browser/camshake.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('Tresenje kamere: ob trku, ob pristanku, na robnikih, v misijah; all off by default, each on and off in Nastavitve');
const srv = await serve();
const browser = await launch();
const KEYS = ['camShake', 'camLand', 'camKerb', 'camMis'];
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { weather: 'dry', track: 'spa' }, { width: 390, height: 844 });

  // Nastavitve: the four rows, Izklop by default
  const rows = await page.evaluate((KEYS) => { const g = window.__game; g.onAction('to-settings');
    return KEYS.map(k => { const seg = document.querySelector(`[data-set="${k}"]`), on = seg && seg.querySelector('button.sel');
      return { k, seg: !!seg, opts: seg ? [...seg.querySelectorAll('button')].map(b => b.dataset.v).join() : '', def: g.S[k], on: on ? on.dataset.v : null }; }); }, KEYS);
  T.check('Nastavitve: four "Tresenje kamere" rows with Izklop and Vklop, all Izklop by default', rows.every(r => r.seg && r.opts === '0,1' && r.def === 0 && r.on === '0'), JSON.stringify(rows));

  // with every row set to v: how far the camera shook (Render.cam.shake) at a hard knock (full throttle, steering hard right off the grid
  // until Sfx.crash gets a knock over 3: the player's hitWall, hitCar or debris, as stepRace takes it), at a landing after a jump and with a wheel on a kerb (the car's state set, frames drawn), and at
  // the mission's call (m48's bridge)
  const shakes = (v) => page.evaluate(([v, KEYS]) => { const g = window.__game;
    g.onAction('to-settings'); for (const k of KEYS) document.querySelector(`[data-set="${k}"] button[data-v="${v}"]`).click(); g.onAction('settings-done');
    const saved = JSON.parse(localStorage.getItem('tdgp-settings') || 'null'), P = g.race.player, C = Render.cam, out = { saved: saved && KEYS.map(k => saved[k]).join() };
    const crash = Sfx.crash; let hard = 0;
    Sfx.crash = (i) => { if (i > 3 && i === Math.max(P.hitWall, P.hitCar, (P.hitDebris || 0) * 0.6)) hard++; return crash(i); };   // (a knock, not a hard landing: that calls Sfx.crash too)
    try { g.sim(8, true); C.shake = 0; for (let k = 0; k < 400 && !hard; k++) g.sim(0.05, false, 1, 1, 0); } finally { Sfx.crash = crash; }
    out.hard = hard; out.hit = +C.shake.toFixed(3);
    g.pause(); const keep = { air: P.air, impactVY: P.impactVY, ws: P.ws, vx: P.vx, vz: P.vz }, F = () => Render.frame(1 / 60, 1, P, 'chase', {});
    const go = (v) => { P.vx = v * Math.cos(P.heading || 0); P.vz = v * Math.sin(P.heading || 0); };   // (speed: a getter of vx, vz)
    P.ws = [0, 0, 0, 0]; go(20); P.air = true; F(); C.shake = 0; P.air = false; P.impactVY = -6; F(); out.land = +C.shake.toFixed(3);
    F(); F(); C.shake = 0; P.ws = [1, 0, 0, 0]; go(25); F(); out.kerb = +C.shake.toFixed(3);
    C.shake = 0; Render.shake(0.3, 'mis'); out.mis = +C.shake.toFixed(3);
    Object.assign(P, keep); C.shake = 0;
    return out; }, [v, KEYS]);

  await startTrack(page, 'spa');
  const off = await shakes(0);
  T.check('Izklop: a hard knock, a landing, a kerb and the mission leave the camera still; saved', off.saved === '0,0,0,0' && off.hard > 0 && off.hit === 0 && off.land === 0 && off.kerb === 0 && off.mis === 0, JSON.stringify(off));
  await startTrack(page, 'spa');
  const on = await shakes(1);
  T.check('Vklop: a hard knock, a landing, a kerb and the mission shake the camera; saved', on.saved === '1,1,1,1' && on.hard > 0 && on.hit > 0 && on.land > 0 && on.kerb > 0 && on.mis > 0, JSON.stringify(on));

  T.check('no page errors', errors.length === 0, errors.join('\n'));
} finally {
  await browser.close();
  srv.close();
}
T.done();
