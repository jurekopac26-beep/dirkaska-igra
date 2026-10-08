// The wheel rule in the game (core.js wheelRule; game.js WHEEL_RULE: the player's SOKOL, offline, a test with one car first): a hit at
// 79 % takes a wheel off (KOLO JE ODPADLO!, no Namesti kolo), the second follows, the car stops and the game is over: KONEC IGRE with a
// big PONOVI IGRO (no results first; the HUD and the controls off). PONOVI IGRO: the same race again, the car whole; Rezultati: the
// results, the player retired. Another car (KAZE RS): no rule. Upright (360 x 640) and on its side (640 x 360), in English too.
//   node tests/browser/wheels.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('wheels');
const srv = await serve();
const browser = await launch();
try {
  for (const [vw, en] of [[{ width: 640, height: 360 }, false], [{ width: 360, height: 640 }, true]]) {
    const tag = `${vw.width} x ${vw.height}${en ? ', English' : ''}`;
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: vw.width > vw.height ? 'iso' : 'chase', damage: 2, lang: en ? 'en' : 'sl', radio: 0 }, vw, { seed: 4242 });
    await page.evaluate(() => { const g = window.__game; g.S.car = Core.MODELS.findIndex(m => m.id === 'sokol'); });
    await startTrack(page, 'jezero');
    const a = await page.evaluate(async () => {
      const g = window.__game, P = g.race.player, W = P.wreck, wait = (ms) => new Promise(r => setTimeout(r, ms)), frames = async (n) => { for (let i = 0; i < n; i++) await new Promise(r => requestAnimationFrame(r)); };
      g.sim(9, true); const rule = !!W.rule, others = g.race.cars.filter(c => !c.isPlayer).every(c => !(c.wreck && c.wreck.rule));
      P.dmg = 0.79; Core.applyDamage(P, 0.03, P.m.len * 0.5, 0); const n1 = W.nL;
      g.resume(); await frames(4); g.pause();
      const msg = document.getElementById('h-msg').textContent, fix = !document.getElementById('btn-rescue').classList.contains('off');
      g.sim(5, true); await frames(6);   // (KONEC IGRE came up in the step: no resume, that would close it)
      const sc = document.getElementById('s-over'), b = document.getElementById('over-again').getBoundingClientRect(), p = sc.querySelector('.panel').getBoundingClientRect();
      const over = { screen: g.screen, shown: sc.classList.contains('show'), n: W.nL, out: g.race.isOut(P), v: P.speed, phase: g.phase, title: sc.querySelector('h2').textContent, btn: document.getElementById('over-again').textContent,
        bh: Math.round(b.height), bw: Math.round(b.width), pw: Math.round(p.width), oneLine: document.getElementById('over-again').scrollWidth <= document.getElementById('over-again').clientWidth + 1, inView: p.top >= 0 && p.left >= 0 && p.bottom <= innerHeight + 0.5 && p.right <= innerWidth + 0.5, hud: document.getElementById('hud').classList.contains('off'), touch: document.getElementById('touch').classList.contains('off'),
        res: document.getElementById('s-results').classList.contains('show') };
      document.getElementById('over-again').click();
      for (let k = 0; k < 50 && !(g.race && g.race.player !== P); k++) await wait(100);
      const P2 = g.race.player, again = { fresh: P2 !== P, rule: !!(P2.wreck && P2.wreck.rule), nL: P2.wreck.nL, dmg: P2.dmg, gone: !sc.classList.contains('show'), phase: g.phase, track: g.race.track.def.id };
      // once more to KONEC IGRE, then Rezultati: the results, the player out (Odstop)
      g.pause(); g.sim(9, true); P2.dmg = 0.85; Core.applyDamage(P2, 0.2, P2.m.len * 0.5, 0); g.sim(4, true); await frames(4);
      const big = { n: P2.wreck.nL, shown: sc.classList.contains('show') };
      document.getElementById('over-res').click(); await frames(3);
      const res = { shown: document.getElementById('s-results').classList.contains('show'), gone: !sc.classList.contains('show') };
      return { rule, others, n1, msg, fix, over, again, big, res };
    });
    console.log(tag, JSON.stringify(a));
    const O = a.over;
    T.check(`${tag}: the rule on the player's SOKOL only (not the AI)`, a.rule && a.others);
    T.check(`${tag}: a hit at 79 %: a wheel off, the word on the HUD, no Namesti kolo`, a.n1 === 1 && /KOLO JE ODPADLO|WHEEL OFF/.test(a.msg) && !a.fix, `${a.n1} off, "${a.msg}", fix ${a.fix}`);
    T.check(`${tag}: the second one off, the car stopped, out: KONEC IGRE (no results first), the HUD and the controls off`, O.shown && O.screen === 'over' && O.n >= 2 && O.out && O.v < 0.6 && O.phase === 'done' && !O.res && O.hud && O.touch, JSON.stringify(O));
    T.check(`${tag}: ${en ? 'GAME OVER, PLAY AGAIN' : 'KONEC IGRE, PONOVI IGRO'}: big (>= 64 px high, most of the panel's width, one line), the panel all on screen`,
      O.title === (en ? 'GAME OVER' : 'KONEC IGRE') && O.btn === (en ? 'PLAY AGAIN' : 'PONOVI IGRO') && O.bh >= 64 && O.bw >= 0.8 * O.pw && O.inView && O.oneLine, `"${O.title}", "${O.btn}" ${O.bw} x ${O.bh}`);
    T.check(`${tag}: PONOVI IGRO: the same race again, the car whole, under the rule`, a.again.fresh && a.again.gone && a.again.rule && a.again.nL === 0 && a.again.dmg === 0 && a.again.track === 'jezero' && a.again.phase !== 'done', JSON.stringify(a.again));
    T.check(`${tag}: a hard hit at 85 %: two off at once, KONEC IGRE; Rezultati: the results`, a.big.n >= 2 && a.big.shown && a.res.shown && a.res.gone, JSON.stringify(a.big) + ' ' + JSON.stringify(a.res));
    T.check(`${tag}: no errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // another car: no rule
  {
    const { ctx, page } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, damage: 2 }, undefined, { seed: 77 });
    await page.evaluate(() => { window.__game.S.car = 0; });
    await startTrack(page, 'jezero');
    const r = await page.evaluate(() => { const P = window.__game.race.player; return { id: P.m.id, rule: !!(P.wreck && P.wreck.rule) }; });
    T.check('another car (KAZE RS): no rule', r.id === 'kaze' && !r.rule, JSON.stringify(r));
    await ctx.close();
  }
} finally {
  await browser.close(); srv.close();
}
T.done();
