// A perfect exit out of the pits (game.js pitExitStep; Core PIT_LAUNCH, Race.pitLaunch): the Red Bull Ring (a long race), the player on
// autopilot told to come in on the first lap and again on the second. At the first hand-back (VOZIŠ TI!, still in the lane) the gas
// pressed 0.15 s after it: POPOLN IZHOD! (green, the green light's icon) in place of VOZIŠ TI! at once, the clean launch (no wheelspin
// through the rest of the lane); at the second a press 0.5 s after it: a normal exit (no message, no clean launch). Then on the circuit, the
// reaction's clock started as at a hand-back (pitExitOpen): a press at 0.34 s perfect, at 0.37 s late, the gas held through the hand-back
// too early, Samodejni plin on none of it, nothing shown; in English PERFECT EXIT!. The message in both languages, upright and on its side:
// in the column under the map, three lines at most, the green light's icon.
//   node tests/browser/pitexit.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('POPOLN IZHOD');
const srv = await serve();
const browser = await launch();
const frames = (page, n = 2) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const toRacing = (page) => page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 800 && g.phase !== 'racing'; k++) g.sim(0.05, false, 0, 0); return g.phase; });
// in the page (window.__px): the big message now (text, class, icon); the race driven on from the reaction's clock (hb: its start on the race
// clock) for sec s, the autopilot's steering (along the lane while in it), the gas from `press` s after it (held: all along, from before it):
// the big messages as they change, the clean launch (when it came, its share), the most wheelspin in the lane once on the gas (while the
// clean launch's share is half or more, if it has one), when the car left the lane; the log's newest entry
const helpers = (page) => page.evaluate(() => {
  const g = window.__game, H = window.__px = {}, M = document.getElementById('h-msg');
  const R = () => g.race, P = () => g.race.player;
  H.msg = () => { g.hud(1 / 60); return { txt: M.className.includes('show') ? M.textContent : '', cls: M.className.replace('show', '').trim(), ic: M.dataset.ic }; };
  H.go = (hb, press, sec, held) => {
    const o = { msgs: [], plxT: null, plxK: null, spin: 0, lane: 0, out: null, pressT: null };
    let last = H.msg().txt; if (last) o.msgs.push({ t: 0, txt: last });
    g.drive(sec, (p) => {
      const t = R().time - hb, on = held || t >= press - 1e-9;
      if (p.plx && o.plxT == null) { o.plxT = +t.toFixed(4); o.plxK = p.plx.k; }
      if (on && o.pressT == null) o.pressT = +t.toFixed(4);
      if (p.inPit && o.pressT != null && t > o.pressT + 0.02 && (!p.plx || p.plx.k >= 0.5)) { o.spin = Math.max(o.spin, p.spin); o.lane++; }
      if (o.out == null && !p.inPit) o.out = +t.toFixed(2);
      const m = M.className.includes('show') ? M.textContent : '';
      if (m !== last) { last = m; const x = H.msg(); o.msgs.push({ t: +t.toFixed(4), txt: m, cls: x.cls, ic: x.ic }); }
      p.pitWant = p.inPit;   // (the autopilot's steering along the lane until it leaves it)
      return { thr: on ? 1 : 0 };
    });
    P().pitWant = false;
    const L = g.pitExit.log; o.log = L[L.length - 1] || null; o.n = L.length; o.plxEnd = P().plx;
    return o;
  };
  // on to the n-th stop's hand-back: told to come in from 0.4 of a lap after the last one (or the start), a quarter of a second at a time
  // on autopilot; out of the box (the crew's work done) step by step with no gas until the autopilot hands the car back (that step's start
  // on the race clock: the reaction's clock)
  H.toHand = async (n) => {
    const p = P(), L = R().track.len; H.from = H.from || 0;
    for (let k = 0; k < 6000; k++) {
      if ((p.repairN || 0) < n && !p.inPit && p.dist > H.from + L * 0.4) p.pitWant = true;
      if (p.pitDone && g.pitAuto.st) { const t0 = R().time; g.sim(1 / 120, false, 0, 0); if (!g.pitAuto.st) { H.from = p.dist; return { hb: t0, at: g.pitExit.hb, inPit: p.inPit, v: +(p.speed * 3.6).toFixed(1), stop: p.repairN }; } }
      else g.sim(0.25, true);
      if (k % 40 === 0) await null;
    }
    return null;
  };
  // the reaction's clock started on the circuit (as at a hand-back), on a straight part of the lap, the message before it gone
  H.open = () => { for (let k = 0; k < 120 && P().speed < 30; k++) g.sim(0.25, true); g.hud(3); g.pitExitOpen(); return R().time; };
});

try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', track: 'rbring', damage: 0, radio: 0, fuel: 0, length: 'long', weather: 'dry', tod: 'day', autoGas: 0 }, { width: 640, height: 360 }, { touch: true, seed: 7 });
  await startTrack(page, 'rbring');
  await toRacing(page);
  await helpers(page);

  // 1. the first stop: the gas 0.15 s after the hand-back
  const hb1 = await page.evaluate(() => window.__px.toHand(1));
  const a = hb1 && await page.evaluate(([hb]) => window.__px.go(hb, 0.15, 3), [hb1.hb]);
  T.check('the first stop: handed back in the lane after the stop, the reaction\'s clock started at that step', !!hb1 && hb1.inPit && hb1.stop === 1 && Math.abs(hb1.at - hb1.hb) < 1e-6, JSON.stringify(hb1));
  T.check('... the gas 0.15 s after it: a perfect exit (the reaction measured, 0.15 s), the clean launch from that press (its share 1)',
    !!a && a.n === 1 && a.log.k === 'perfect' && Math.abs(a.log.re - 0.15) < 0.01 && a.log.hb === hb1.hb && a.plxT != null && a.plxT - a.pressT <= 0.01 && a.plxK === 1, JSON.stringify(a && { log: a.log, plxT: a.plxT, pressT: a.pressT, k: a.plxK }));
  const pm = a && a.msgs.find(m => m.txt === 'POPOLN IZHOD!');
  T.check('... POPOLN IZHOD! (green, the green light\'s icon) in place of VOZIŠ TI! at once',
    !!pm && a.msgs[0].txt === 'VOZIŠ TI!' && a.msgs[1] === pm && pm.t - a.pressT <= 0.02 && pm.cls === 'fast' && pm.ic === 'go', JSON.stringify(a && a.msgs));
  T.check('... no wheelspin through the rest of the lane (out of it ~1 s after the hand-back), the clean launch gone after it', !!a && a.lane > 40 && a.spin === 0 && a.out > 0.4 && a.out < 2.5 && a.plxEnd === null,
    JSON.stringify(a && { lane: a.lane, spin: a.spin, out: a.out, end: a.plxEnd }));

  // 2. the second stop: the gas 0.5 s after the hand-back: a normal exit
  const hb2 = await page.evaluate(() => window.__px.toHand(2));
  const b = hb2 && await page.evaluate(([hb]) => window.__px.go(hb, 0.5, 3), [hb2.hb]);
  T.check('the second stop: the gas 0.5 s after the hand-back: a normal exit (late), no clean launch, no message after VOZIŠ TI!; the wheels spin in the lane as before',
    !!b && hb2.inPit && b.n === 2 && b.log.k === 'late' && b.log.re === null && b.log.hb === hb2.hb && b.plxT == null && !b.plxEnd && b.msgs.every(m => m.txt !== 'POPOLN IZHOD!') && b.msgs[0].txt === 'VOZIŠ TI!' && b.spin > 0.2,
    JSON.stringify(b && { log: b.log, plx: b.plxT, msgs: b.msgs, spin: b.spin, lane: b.lane }));

  // 3. on the circuit, the reaction's clock started as at a hand-back: 0.34 s perfect, 0.37 s late, held too early, Samodejni plin none
  const run = (press, sec, held) => page.evaluate(([press, sec, held]) => { const H = window.__px, hb = H.open(); return Object.assign(H.go(hb, press, sec, held), { hb }); }, [press, sec, held]);
  const c34 = await run(0.34, 3), c37 = await run(0.37, 3), held = await run(0, 3, true);
  await page.evaluate(() => { window.__game.S.autoGas = 1; });
  const auto = await run(0.1, 3);
  await page.evaluate(() => { window.__game.S.autoGas = 0; });
  const none = (o) => o.plxT == null && !o.msgs.some(m => /POPOLN|PERFECT/.test(m.txt));
  T.check('a press 0.34 s after it: perfect (the clean launch, POPOLN IZHOD!)', c34.log.k === 'perfect' && Math.abs(c34.log.re - 0.34) < 0.01 && c34.plxT != null && c34.msgs.some(m => m.txt === 'POPOLN IZHOD!' && m.cls === 'fast'), JSON.stringify(c34));
  T.check('a press 0.37 s after it: late (a normal exit, nothing shown)', c37.log.k === 'late' && c37.log.re === null && none(c37), JSON.stringify(c37));
  T.check('the gas held through the hand-back: too early (a normal exit, nothing shown), decided at that step', held.log.k === 'early' && held.log.re === null && held.log.hb === held.hb && none(held), JSON.stringify(held));
  T.check('Samodejni plin on: none of it (no clean launch, nothing shown) whenever the gas', auto.log.k === 'auto' && none(auto), JSON.stringify(auto));

  // 4. in English: PERFECT EXIT!
  await page.evaluate(() => Lang.set('en'));
  const en = await run(0.1, 2);
  T.check('in English: PERFECT EXIT! (green, the green light\'s icon)', en.log.k === 'perfect' && en.msgs.some(m => m.txt === 'PERFECT EXIT!' && m.cls === 'fast' && m.ic === 'go'), JSON.stringify(en.msgs));
  await page.evaluate(() => Lang.set('sl'));

  // 5. the message in both languages, upright and on its side: in the column under the map, three lines at most, the green light's icon
  const fit = [];
  await page.evaluate(() => window.__game.resume());
  for (const vp of [{ width: 360, height: 640 }, { width: 640, height: 360 }]) {
    await page.setViewportSize(vp); await frames(page, 3);
    for (const lang of ['sl', 'en']) {
      await page.evaluate((lang) => { Lang.set(lang); window.__game.msg(Lang.tr('POPOLN IZHOD!'), 'fast', 600); }, lang);
      await frames(page, 3);
      fit.push(await page.evaluate((lang) => {
        const M = document.getElementById('h-msg'), fs = parseFloat(getComputedStyle(M).fontSize), map = document.getElementById('h-map').getBoundingClientRect(), r = M.getBoundingClientRect();
        const o = { lang, w: innerWidth, txt: M.textContent, ic: M.dataset.ic, fs, ok: M.className.includes('show') && M.scrollWidth <= M.clientWidth + 2 && M.clientHeight <= fs * 1.05 * 3 + 9 && fs >= 10 && r.left >= map.left - 1 && r.right <= map.right + 1 && r.top >= map.bottom };
        M.className = ''; Lang.set('sl'); return o;
      }, lang));
    }
  }
  T.check('POPOLN IZHOD! and PERFECT EXIT!, upright and on its side: in the column under the map, three lines at most, the green light\'s icon',
    fit.length === 4 && fit.every(o => o.ok && o.ic === 'go') && fit.map(o => o.txt).join() === 'POPOLN IZHOD!,PERFECT EXIT!,POPOLN IZHOD!,PERFECT EXIT!', JSON.stringify(fit));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
