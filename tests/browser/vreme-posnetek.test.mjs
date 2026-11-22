// A changing day's weather (docs/vreme-med-dirko.md) in the game: the plan wxPlanOf draws (wet at the start ~15 %, rain to the finish
// ~25 %, else showers: at most one in a race of the usual length, two in a long one, three in an endurance one (each in 10 min of the
// race at least; a drizzle, the shower, its easing and the end, in time order, none overlapping); a race with a shower (Red Bull Ring):
// the replay so far (Posnetek do sem) shows the weather at its own time (rpWx: dry before the shower, wet in it) and gives the race its
// own back when it ends (rpWxBack).
//   node tests/browser/vreme-posnetek.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('a changing day: the plan and the replay');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'rbring', weather: 'change', damage: 0 }, { width: 640, height: 360 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  await act('to-track'); await page.waitForTimeout(300);

  // 1. the plan: 600 draws a length, from a seeded stream (Math.random: grand() outside the test mode)
  const P = await page.evaluate(() => {
    let s = 12345; const o = Math.random; Math.random = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
    const out = {};
    try {
      for (const L of ['normal', 'long', 'endurance']) {
        const R = { wet: 0, fin: 0, sh: 0, n: new Set(), bad: [] };
        for (let k = 0; k < 600; k++) {
          const p = window.__game.wxPlanOf(L), X = p.wx;
          if (p.rain === 1) { R.wet++; if (Array.isArray(X) || X.to !== 0) R.bad.push('wet'); continue; }
          if (!Array.isArray(X)) { R.fin++; if (X.to !== 1) R.bad.push('fin'); continue; }
          R.sh++; R.n.add(X.length);
          let last = 0; for (let i = 0; i < X.length; i++) { const q = X[i];
            if (i % 4 === 3) { if (q.at !== 0 || q.to !== 0) R.bad.push('end'); continue; }
            if (!(q.at > last) || !(q.to > 0)) R.bad.push('order'); last = q.at; }
        }
        out[L] = { wet: R.wet / 600, fin: R.fin / 600, sh: R.sh / 600, n: [...R.n], bad: R.bad.slice(0, 5) };
      }
    } finally { Math.random = o; }
    return out; });
  // (a race shorter than 8 min: one change, no shower; a shower in at least 10 min of the race's own: the Red Bull Ring's usual race none,
  // its endurance one at least one; the showers in time order, the next 30 s at least after the last one's end)
  const MAX = { normal: 1, long: 2, endurance: 3 };
  T.check('the plan: wet at the start ~15 %, showers ~60 % where the race is long enough (at most 1, 2, 3 by its length), in time order, none overlapping',
    ['normal', 'long', 'endurance'].every(L => P[L].wet > 0.1 && P[L].wet < 0.2 && P[L].bad.length === 0 && P[L].n.every(x => x % 4 === 0 && x <= 4 * MAX[L]) && (P[L].sh === 0 || (P[L].sh > 0.5 && P[L].sh < 0.7)))
    && P.endurance.sh > 0.5, JSON.stringify(P));

  // 2. a race with a shower from 5 s: the replay so far at 2 s dry, at 30 s wet; its end gives the race its weather back
  await page.evaluate(() => { window.__game.wxNext = { rain: 0, wx: [{ at: 5, dur: 10, to: 0.6 }, { at: 40, dur: 10, to: 0 }] }; });
  await startTrack(page, 'rbring');
  const sim = (t) => page.evaluate((t) => { const g = window.__game; g.pause(); g.sim(t, true); }, t);
  for (let k = 0; k < 40; k++) { const r = await page.evaluate(() => { const R = window.__game.race; return R.state === 'racing' ? R.time : -1; }); if (r >= 35) break; await sim(3); }
  const wx = () => page.evaluate(() => { const r = window.__game.race; return { t: r.time, rain: r.rain, water: r.wst.water, line: r.wst.line, rp: !!window.__game.replay }; });
  const w0 = await wx();
  await act('rp-here'); await page.waitForTimeout(300);
  const at = async (t) => { await page.evaluate((t) => window.__game.rpSeek(t), t); await page.waitForTimeout(250); return wx(); };
  const a = await at(2), b = await at(30);
  await act('rp-exit'); await page.waitForTimeout(300);
  const w1 = await wx();
  T.check('the replay so far: dry before the shower, wet in it (rpWx)', a.rp && a.rain === 0 && a.water === 0 && b.rain > 0.5 && b.water > 0.1, JSON.stringify({ w0, a, b }));
  T.check('the replay\'s end: the race\'s own weather back (rpWxBack)', !w1.rp && w1.rain === w0.rain && w1.water === w0.water && w1.line === w0.line, JSON.stringify({ w0, w1 }));
  T.check('no errors on the page', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close(); srv.close();
}
T.done();
