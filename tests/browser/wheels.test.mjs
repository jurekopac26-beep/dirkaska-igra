// The wheel rule in the game (core.js wheelRule; game.js WHEEL_RULE: the player's SOKOL, offline, a test with one car first): a hit at
// 79 % takes a wheel off (no words, no Namesti kolo; no fire yet: in the last 20 % of the 3 s a small one where the wheel was, with the
// second wheel the whole car), the second follows 3 s on, the car stops and the game is over: KONEC IGRE with a
// big PONOVI IGRO (no results first; the HUD and the controls off). PONOVI IGRO: the same race again, the car whole; Rezultati: the
// results, the player retired. Another car (KAZE RS): no rule. The damage picture on the HUD (the car, its parts' %, the whole %) on
// screen, clear of the team radio and the map. Upright (360 x 640) and on its side (640 x 360), in English too.
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
      // (the damage picture, with damage, and a team radio message: clear of each other and of the screen's edges)
      g.sim(9, true); Core.applyDamage(P, 0.2, P.m.len * 0.45, -P.m.wid * 0.4); g.resume(); await frames(4); g.pause();
      const tr0 = document.getElementById('h-teamradio'); tr0.lastElementChild.textContent = 'Avto je močno poškodovan. Pazi na kolesa, boksi v tem krogu!'; tr0.classList.add('on'); g.resume(); await frames(3); g.pause();   // (the column under the map laid out while it runs: upright the damage picture first, the radio under it)
      const rr = (id) => document.getElementById(id).getBoundingClientRect(), hit = (A, B) => A.left < B.right - 1 && B.left < A.right - 1 && A.top < B.bottom - 1 && B.top < A.bottom - 1;
      const dR = rr('h-dmg'), lay = { clear: !hit(dR, rr('h-teamradio')) && !hit(dR, rr('h-map')), inView: dR.left >= 0 && dR.right <= innerWidth && dR.bottom <= innerHeight, w: Math.round(dR.width), tot: document.getElementById('dmg-tot').textContent };
      tr0.classList.remove('on'); P.dmg = 0; P.dz = [0, 0, 0, 0]; P.cd = [0, 0, 0, 0];
      const rule = !!W.rule, others = g.race.cars.filter(c => !c.isPlayer).every(c => !(c.wreck && c.wreck.rule));
      const fire0 = Render.burning(P);   // (79 %, no wheel off yet: no fire)
      P.dmg = 0.79; Core.applyDamage(P, 0.03, P.m.len * 0.5, 0); const n1 = W.nL;
      g.resume(); await frames(4); g.pause();
      const msg = document.getElementById('h-msg').classList.contains('show') ? document.getElementById('h-msg').textContent : '', fix = !document.getElementById('btn-rescue').classList.contains('off'), fire = Render.burning(P);
      while (W.rule.due > 0.45) g.sim(0.05, true);   // (the last 20 % of the 3 s: the hub where the wheel was on fire)
      await frames(2); const F1 = Render.viewOf(P).fire, hub = { on: Render.burning(P), lvl: F1 && F1.lvl, k: F1 && F1.hk, wk: [0, 1, 2, 3].find(j => W.wl & (1 << j)), n: W.nL };
      g.sim(5, true); await frames(6);   // (KONEC IGRE came up in the step: no resume, that would close it)
      hub.whole = Render.viewOf(P).fire && Render.viewOf(P).fire.lvl;
      const sc = document.getElementById('s-over'), b = document.getElementById('over-again').getBoundingClientRect(), p = sc.querySelector('.panel').getBoundingClientRect();
      const over = { screen: g.screen, shown: sc.classList.contains('show'), n: W.nL, out: g.race.isOut(P), v: P.speed, phase: g.phase, title: sc.querySelector('h2').textContent, btn: document.getElementById('over-again').textContent,
        bh: Math.round(b.height), bw: Math.round(b.width), pw: Math.round(p.width), oneLine: document.getElementById('over-again').scrollWidth <= document.getElementById('over-again').clientWidth + 1, inView: p.top >= 0 && p.left >= 0 && p.bottom <= innerHeight + 0.5 && p.right <= innerWidth + 0.5, hud: document.getElementById('hud').classList.contains('off'), touch: document.getElementById('touch').classList.contains('off'),
        res: document.getElementById('s-results').classList.contains('show') };
      document.getElementById('over-again').click();
      for (let k = 0; k < 50 && !(g.race && g.race.player !== P); k++) await wait(100);
      const P2 = g.race.player, again = { fresh: P2 !== P, rule: !!(P2.wreck && P2.wreck.rule), nL: P2.wreck.nL, dmg: P2.dmg, gone: !sc.classList.contains('show'), phase: g.phase, track: g.race.track.def.id };
      // ZAMENJAJ KOLO (the spare on the roof): a hit at 79 % in the new race: over the whole screen, the words, the bar running out, no fire
      // yet, then (the bar under 20 %) the hub where the wheel was on fire; a tap anywhere: the spare on at once (four wheels, drawn), the car
      // driving on, the screen gone, no spare left; the hub's fire put out
      g.pause(); g.sim(9, true); P2.dmg = 0.79; Core.applyDamage(P2, 0.03, P2.m.len * 0.5, 0);
      g.resume(); await frames(4); g.pause();
      const ws = document.getElementById('wheel-swap'), wsr = ws.getBoundingClientRect(), sx = () => parseFloat((document.getElementById('ws-bar').style.transform.match(/[\d.]+/) || ['1'])[0]);
      const sw0 = { on: ws.classList.contains('on'), full: wsr.width >= innerWidth - 1 && wsr.height >= innerHeight - 1, txt: document.getElementById('ws-t').textContent, nL: P2.wreck.nL, fire: Render.burning(P2), bar: sx() };
      g.resume(); await frames(4); await wait(300); g.pause(); sw0.bar2 = sx();
      while (P2.wreck.rule.due > 0.45) g.sim(0.05, true);   // (the bar under 20 %: the hub's fire)
      await frames(2); sw0.hub = Render.burning(P2) && Render.viewOf(P2).fire ? Render.viewOf(P2).fire.lvl : 0; const v0 = P2.speed;
      ws.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      const sw1 = { nL: P2.wreck.nL, spare: P2.wreck.rule.spare, ask: P2.wreck.rule.ask, dv: +(P2.speed - v0).toFixed(2) };
      g.resume(); await frames(3); g.pause(); sw1.on = ws.classList.contains('on'); sw1.shown = Render.viewOf(P2).wheelOff.filter(w => !w).length;
      P2.dmg = Math.min(P2.dmg, 0.6); P2.dz = P2.dz.map(d => Math.min(d, 0.6));   // (a knock on the autopilot's way meanwhile takes no wheel: under 70 %)
      for (let k = 0; k < 50; k++) { g.sim(0.1, true); Render.frame(0.1, 1, P2, 'chase', {}); }   // (5 s of the race on, drawn)
      const sw2 = { fire: Render.burning(P2), nL: P2.wreck.nL, v: +P2.speed.toFixed(1) };
      // once more to KONEC IGRE, then Rezultati: the results, the player out (Odstop)
      g.pause(); g.sim(9, true); P2.dmg = 0.85; Core.applyDamage(P2, 0.2, P2.m.len * 0.5, 0); await frames(2); const big = { lvl: Render.viewOf(P2).fire && Render.viewOf(P2).fire.lvl };
      g.sim(4, true); await frames(4); Object.assign(big, { n: P2.wreck.nL, shown: sc.classList.contains('show') });
      document.getElementById('over-res').click(); await frames(3);
      const res = { shown: document.getElementById('s-results').classList.contains('show'), gone: !sc.classList.contains('show') };
      return { rule, others, lay, n1, msg, fix, fire, fire0, hub, over, again, sw0, sw1, sw2, big, res };
    });
    console.log(tag, JSON.stringify(a));
    const O = a.over;
    T.check(`${tag}: the rule on the player's SOKOL only (not the AI)`, a.rule && a.others);
    T.check(`${tag}: the damage picture (the car, its parts' %, the whole %) on screen, clear of the team radio and the map`, a.lay.clear && a.lay.inView && /^\d+ %$/.test(a.lay.tot) && a.lay.tot !== '0 %', JSON.stringify(a.lay));
    T.check(`${tag}: a hit at 79 %: a wheel off, no words (KOLO JE ODPADLO no more), no Namesti kolo, no fire (none before either)`, a.n1 === 1 && !/KOLO JE ODPADLO|WHEEL OFF/.test(a.msg) && !a.fix && !a.fire && !a.fire0, `${a.n1} off, "${a.msg}", fix ${a.fix}, fire ${a.fire0} -> ${a.fire}`);
    T.check(`${tag}: the last 20 % of the 3 s: a small fire where the wheel was (the hub's); the second wheel: the whole car`, a.hub.on && a.hub.lvl === 1 && a.hub.k === a.hub.wk && a.hub.n === 1 && a.hub.whole === 2, JSON.stringify(a.hub));
    T.check(`${tag}: the second one off, the car stopped, out: KONEC IGRE (no results first), the HUD and the controls off`, O.shown && O.screen === 'over' && O.n >= 2 && O.out && O.v < 0.6 && O.phase === 'done' && !O.res && O.hud && O.touch, JSON.stringify(O));
    T.check(`${tag}: ${en ? 'GAME OVER, PLAY AGAIN' : 'KONEC IGRE, PONOVI IGRO'}: big (>= 64 px high, most of the panel's width, one line), the panel all on screen`,
      O.title === (en ? 'GAME OVER' : 'KONEC IGRE') && O.btn === (en ? 'PLAY AGAIN' : 'PONOVI IGRO') && O.bh >= 64 && O.bw >= 0.8 * O.pw && O.inView && O.oneLine, `"${O.title}", "${O.btn}" ${O.bw} x ${O.bh}`);
    T.check(`${tag}: PONOVI IGRO: the same race again, the car whole, under the rule`, a.again.fresh && a.again.gone && a.again.rule && a.again.nL === 0 && a.again.dmg === 0 && a.again.track === 'jezero' && a.again.phase !== 'done', JSON.stringify(a.again));
    T.check(`${tag}: ZAMENJAJ KOLO: a wheel off with the spare on the roof: over the whole screen, "${en ? 'CHANGE THE WHEEL' : 'ZAMENJAJ KOLO'}", the bar running out, no fire yet; at 20 % of the bar the hub where the wheel was on fire`,
      a.sw0.on && a.sw0.full && a.sw0.txt === (en ? 'CHANGE THE WHEEL' : 'ZAMENJAJ KOLO') && a.sw0.nL === 1 && !a.sw0.fire && a.sw0.bar <= 1 && a.sw0.bar2 < a.sw0.bar && a.sw0.hub === 1, JSON.stringify(a.sw0));
    T.check(`${tag}: a tap: the spare on at once (four wheels, drawn), the car not slowed, the screen gone, no spare left; the hub's fire out within 5 s, the car driving on`,
      a.sw1.nL === 0 && a.sw1.spare === 0 && !a.sw1.ask && a.sw1.dv === 0 && !a.sw1.on && a.sw1.shown === 4 && !a.sw2.fire && a.sw2.nL === 0, JSON.stringify([a.sw1, a.sw2]));
    T.check(`${tag}: a hard hit at 85 %: two off at once, the whole car on fire at once, KONEC IGRE; Rezultati: the results`, a.big.n >= 2 && a.big.lvl === 2 && a.big.shown && a.res.shown && a.res.gone, JSON.stringify(a.big) + ' ' + JSON.stringify(a.res));
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
