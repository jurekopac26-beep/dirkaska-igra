// A challenge with a link (Izziv): Ana's flying lap at Jezero Ring (qualifying, in her own car, at dusk, in the rain) sent from the
// results as a link (#izziv=..., deflated); a second phone (Bor, a fresh profile, another car and settings) opens it: the challenge on its
// own screen (the time to beat, the track, the way, the car, the weather, the time of day) and on the title; taken, the same lap alone in
// Ana's car with her colour, in the rain at dusk, her ghost on the track; at the line the two times side by side (Bor's own records and
// ghost untouched) and Bor's run sent back: Ana opens the reply with Bor's time and the same car and conditions. In English; a broken link.
//   node tests/browser/chal.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('challenge link');
const srv = await serve();
const browser = await launch();
try {
  const A = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', name: 'Ana', car: 2, color: 3, quali: 1, weather: 'rain', tod: 'dusk', season: 'autumn' }, { width: 390, height: 844 }, { seed: 5 });
  const pa = A.page;
  // 1. Ana's qualifying lap; from its results the challenge as a link
  await startTrack(pa, 'jezero');
  await pa.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 200 && g.screen !== 'results'; k++) { g.sim(1, true); if (g.race.player.finished) break; } g.resume(); });
  await pa.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 180000 });
  const a1 = await pa.evaluate(async () => { const g = window.__game, b = document.getElementById('res-chal'), vis = getComputedStyle(b).display !== 'none'; g.onAction('chal-send');
    for (let k = 0; k < 50 && !g.chalLink; k++) await new Promise(r => setTimeout(r, 100));
    const o = JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /^tdgp-ghost-jezero/.test(k)) || 'null'));
    return { vis, link: g.chalLink, lap: g.race.player.lapTimes[0], car: g.race.player.m.id, name: g.race.player.m.name, ghost: o && { t: o.t, car: o.car, lap: o.lap, cond: o.cond } }; });
  T.check('Ana\'s flying lap: "Izzovi prijatelja" on its results makes a link (#izziv=...); the lap\'s ghost knows how it was driven (car, rain, dusk, autumn)',
    a1.vis && /#izziv=[\w-]+$/.test(a1.link || '') && a1.link.length < 16100 && a1.ghost && a1.ghost.lap === 1 && a1.ghost.car === a1.car && a1.car !== 'kaze' && a1.ghost.cond.rain === 1 && a1.ghost.cond.tod === 'dusk' && a1.ghost.cond.season === 'autumn' && Math.abs(a1.ghost.t - a1.lap) < 0.001,
    JSON.stringify({ vis: a1.vis, len: (a1.link || '').length, ghost: a1.ghost, lap: a1.lap }));

  // 2. Bor opens it: the challenge's screen, on the title too; the address cleaned
  const B = await openGame(browser, srv.base + '/index.html' + a1.link.slice(a1.link.indexOf('#')), { quality: 'normal', shadows: 0, camera: 'chase', track: 'riviera', name: 'Bor', car: 0, color: 0, weather: 'dry', tod: 'day', season: 'summer' }, { width: 390, height: 844 }, { seed: 9 });
  const pb = B.page;
  await pb.waitForFunction(() => window.__game.screen === 'chal', null, { timeout: 30000 });
  const b1 = await pb.evaluate(() => ({ who: document.getElementById('chal-who').textContent, card: document.getElementById('chal-card').innerText.replace(/\s+/g, ' '), hash: location.hash, chal: window.__game.chal,
    title: (() => { const b = document.getElementById('btn-chal'); return { off: b.classList.contains('off'), t: b.textContent }; })() }));
  T.check('Bor opens the link: "Ana te izziva: premagaj čas na progi Jezero Ring.", the time, Leteči krog, Ana\'s car, Dež, Večer, Jesen; on the title "Izziv: Ana · ..."; the address cleaned',
    b1.who === 'Ana te izziva: premagaj čas na progi Jezero Ring.' && b1.card.includes(b1.title.t.split(' · ')[1]) && /Leteči krog/.test(b1.card) && b1.card.includes(a1.name) && /Dež/.test(b1.card) && /Večer/.test(b1.card) && /Jesen/.test(b1.card)
    && !b1.title.off && /^Izziv: Ana · \d\d:\d\d\.\d{3}$/.test(b1.title.t) && b1.hash === '' && b1.chal && b1.chal.track === 'jezero', JSON.stringify(b1));

  // 3. in English: the challenge's screen
  const en = await pb.evaluate(() => { const g = window.__game; g.onAction('to-settings'); document.querySelector('[data-set="lang"] button[data-v="en"]').click(); g.onAction('settings-done'); g.onAction('to-chal');
    const r = { who: document.getElementById('chal-who').textContent, card: document.getElementById('chal-card').innerText.replace(/\s+/g, ' '), go: document.querySelector('[data-act="chal-go"]').textContent };
    g.onAction('to-settings'); document.querySelector('[data-set="lang"] button[data-v="sl"]').click(); g.onAction('settings-done'); g.onAction('to-chal'); return r; });
  T.check('in English: "Ana challenges you: beat the time on Jezero Ring.", Flying lap, Rain, Evening, Autumn, "Accept the challenge"', en.who === 'Ana challenges you: beat the time on Jezero Ring.' && /Flying lap/.test(en.card) && /Rain/.test(en.card) && /Evening/.test(en.card) && /Autumn/.test(en.card) && en.go === 'Accept the challenge', JSON.stringify(en));

  // 4. taken: the same lap alone, in Ana's car and colour, in the rain at dusk in the autumn, Ana's ghost on the track
  await pb.evaluate(() => window.__game.onAction('chal-go'));
  await pb.waitForFunction(() => window.__game.race && window.__game.race.chal && window.__game.screen === 'none', null, { timeout: 60000 });
  const b2 = await pb.evaluate(async () => { const g = window.__game, R = g.race, P = R.player, out = { cars: R.cars.length, car: P.m.id, color: P.color, rain: R.rain, quali: !!R.quali, atmos: Render.atmos ? Object.assign({}, Render.atmos) : null, laps: R.laps };
    let seen = 0, tag = ''; g.pause();
    for (let k = 0; k < 120 && !P.finished; k++) { g.sim(1, true); g.resume(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); g.pause(); const f = Render.ghostF; if (f && f.visible) { seen++; tag = f.tag || tag; } }
    g.resume(); out.seen = seen; out.tag = tag; return out; });
  T.check('taken: Bor alone on Jezero Ring in Ana\'s car with her colour, in the rain at dusk in the autumn, one lap from the line; Ana\'s ghost on the track',
    b2.cars === 1 && b2.car === a1.car && b2.rain === 1 && b2.quali && b2.laps === 1 && b2.seen > 5 && /^Ana \d:\d\d\.\d{3}$/.test(b2.tag) && b2.atmos && b2.atmos.tod === 'dusk' && b2.atmos.season === 'autumn', JSON.stringify(b2));

  // 5. at the line: the two times side by side; Bor's own records and ghost untouched; his run sent back
  await pb.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 120000 });
  const b3 = await pb.evaluate(async () => { const g = window.__game, rows = [...document.querySelectorAll('#res-table tbody tr')].map(r => r.innerText.replace(/\s+/g, ' ').trim());
    const r = { title: document.getElementById('res-title').textContent, sub: document.getElementById('res-sub').textContent, rows, again: document.getElementById('res-restart').textContent,
      reply: getComputedStyle(document.getElementById('res-reply')).display !== 'none', own: Object.keys(localStorage).filter(k => /^tdgp-ghost-/.test(k)), rec: JSON.parse(localStorage.getItem('tdgp-records') || '{}') };
    g.onAction('chal-reply'); g.chalLink = null; for (let k = 0; k < 50 && !g.chalLink; k++) await new Promise(res => setTimeout(res, 100)); r.link = g.chalLink; return r; });
  T.check('at the line: "Izziv premagan!" or "Izziv ni premagan", Ana\'s time and Bor\'s side by side (two rows), "Poskusi znova", "Pošlji odgovor"; Bor\'s own records and ghost untouched',
    /^Izziv (premagan!|ni premagan)$/.test(b3.title) && /^Ana: \d\d:\d\d\.\d{3} · ti: \d\d:\d\d\.\d{3} \([−+±]/.test(b3.sub) && b3.rows.length === 2 && b3.rows.some(t => /Ana/.test(t)) && b3.rows.some(t => /Ti/.test(t)) && b3.again === 'Poskusi znova' && b3.reply
    && !b3.own.length && !Object.keys(b3.rec).some(k => /jezero/.test(k) && b3.rec[k].bestLap), JSON.stringify(b3).slice(0, 900));

  // 6. Ana opens the reply: Bor's time, the same car and conditions (the first two phones put away: software WebGL is slow with many)
  const bt = await pb.evaluate(() => window.__game.race.player.lapTimes[0]);
  const errs = [...A.errors, ...B.errors];
  await A.ctx.close(); await B.ctx.close();
  const C = await openGame(browser, srv.base + '/index.html' + b3.link.slice(b3.link.indexOf('#')), { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', name: 'Ana' }, { width: 390, height: 844 });
  await C.page.waitForFunction(() => window.__game.screen === 'chal', null, { timeout: 90000 });
  const c1 = await C.page.evaluate(() => ({ who: document.getElementById('chal-who').textContent, chal: window.__game.chal }));
  errs.push(...C.errors); await C.ctx.close();
  T.check('Ana opens the reply: "Bor te izziva ...", Bor\'s time, Ana\'s car, the rain, dusk, autumn', c1.who === 'Bor te izziva: premagaj čas na progi Jezero Ring.' && Math.abs(c1.chal.time - bt) < 0.001 && c1.chal.car === a1.car && c1.chal.cond.rain === 1 && c1.chal.cond.tod === 'dusk' && c1.chal.cond.season === 'autumn' && c1.chal.lap,
    JSON.stringify({ c1, bt }));

  // 7. a time trial's challenge without its ghost (a long run: it does not fit in a link): the time, the way, no ghost
  const E = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0 }, { width: 390, height: 844 });
  const p = await E.page.evaluate(() => window.__game.chalPack({ app: 'apex-racing', kind: 'challenge', v: 1, track: 'pikes', name: 'Cvet', time: 612.25, lap: 0, car: 'rally', color: 3381759, cond: { rain: 0, tod: 'night', season: 'winter' } }));
  await E.ctx.close();
  const F = await openGame(browser, srv.base + '/index.html#izziv=' + p, { quality: 'normal', shadows: 0 }, { width: 390, height: 844 });
  await F.page.waitForFunction(() => window.__game.screen === 'chal', null, { timeout: 90000 });
  const f1 = await F.page.evaluate(() => ({ card: document.getElementById('chal-card').innerText.replace(/\s+/g, ' '), chal: window.__game.chal, fg: !!localStorage.getItem('tdgp-fghost-pikes') }));
  errs.push(...E.errors, ...F.errors); await F.ctx.close();
  T.check('a time trial\'s challenge without its ghost (Pikes Peak): Kronometer, the time, Noč, Zima, "Duh ni priložen"; no ghost kept', /^10:12\.250 /.test(f1.card) && /Kronometer/.test(f1.card) && /Noč/.test(f1.card) && /Zima/.test(f1.card) && /ni priložen/.test(f1.card) && f1.chal && !f1.chal.ghost && !f1.chal.lap && !f1.fg, JSON.stringify(f1));

  // 8. a broken link: told, nothing kept
  const D = await openGame(browser, srv.base + '/index.html#izziv=AAAAbroken', { quality: 'normal', shadows: 0 }, { width: 390, height: 844 });
  await D.page.waitForFunction(() => /Povezava do izziva ni veljavna/.test(document.getElementById('toast').textContent), null, { timeout: 90000 });
  const d1 = await D.page.evaluate(() => ({ chal: window.__game.chal, screen: window.__game.screen }));
  T.check('a broken link: "Povezava do izziva ni veljavna.", no challenge kept', !d1.chal && d1.screen !== 'chal', JSON.stringify(d1));
  errs.push(...D.errors);
  T.check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.message || e).split('\n')[0]);
} finally {
  await browser.close(); await srv.close();
}
T.done();
