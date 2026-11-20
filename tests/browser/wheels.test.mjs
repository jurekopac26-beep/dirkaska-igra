// The wheel rule in the game (core.js wheelRule; game.js WHEEL_RULE: every vehicle since 1. 11. 2026, each with its own tyres, Car.kt: the
// KOLIBRI's rule, tests/browser/kolibri-hud.test.mjs; here on the player's SOKOL, offline, without its own tyres: the rule it had before,
// its screens the same): a hit at 79 % takes a wheel off (no words, no Namesti kolo) and the game is over (the user, 9. 11. 2026: »Ko ti
// enkrat odpade kolo, je igre konec«): the whole car on fire at once from the corner that lost the wheel, the car stops: KONEC IGRE with a
// big PONOVI IGRO (no results first; the HUD and the controls off; under the title: a wheel came off). PONOVI IGRO: the question of Zadnji
// posnetki (Ne), the same race again, the car whole; no ZAMENJAJ KOLO (no button, no spare on the roof); a hard hit: two off, the whole car
// on fire from its middle, KONEC IGRE; Rezultati: the results, the player retired. One of the ten cars without parts that come off (KAZE
// RS): its own tyres and the rule too (paket-p K): a front wheel off, KONEC IGRE. On its side the left column (the place, the speed, the tyres) stays above the steering arrows.
// Upright (360 x 640) and on its side (640 x 360), in English too.
//   node tests/browser/wheels.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('wheels');
const srv = await serve();
const browser = await launch();
try {
  for (const [vw, en] of [[{ width: 640, height: 360 }, false], [{ width: 360, height: 640 }, true]]) {
    const tag = `${vw.width} x ${vw.height}${en ? ', English' : ''}`;
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', damage: 2, lang: en ? 'en' : 'sl', radio: 0 }, vw, { seed: 4242 });
    await page.evaluate(() => { const g = window.__game; g.S.car = Core.MODELS.findIndex(m => m.id === 'sokol'); });
    await startTrack(page, 'spa');
    await page.evaluate(() => Promise.all(['italic 800 32px ApexMenu', '700 9px ApexMenu'].map(f => document.fonts.load(f, 'AZaz09ČŠŽ'))));   // (the top left's face: the left column measured as a phone draws it)
    const a = await page.evaluate(async () => {
      const g = window.__game, P = g.race.player, W = P.wreck, wait = (ms) => new Promise(r => setTimeout(r, ms)), frames = async (n) => { for (let i = 0; i < n; i++) await new Promise(r => requestAnimationFrame(r)); };
      g.sim(9, true); P.dmg = 0; P.dz = [0, 0, 0, 0]; P.cd = [0, 0, 0, 0];
      const own = !!P.kt && !!(W.rule && W.rule.kt); P.kt = null; W.rule.kt = false;   // (its own tyres and the KOLIBRI's rule with them; taken off: the rule without them)
      const rule = !!W.rule, others = g.race.cars.filter(c => !c.isPlayer).every(c => !(c.wreck && c.wreck.rule));
      const fire0 = Render.burning(P);   // (79 %, no wheel off yet: no fire)
      P.dmg = 0.79; Core.applyDamage(P, 0.03, P.m.len * 0.5, 0); const n1 = W.nL, wk = [0, 1, 2, 3].find(j => W.wl & (1 << j));
      P.dmg = Math.min(P.dmg, 0.6); P.dz = P.dz.map(d => Math.min(d, 0.6));   // (the wheel off: a knock on the autopilot's way meanwhile takes no more)
      g.resume(); await frames(4); g.pause();
      const msg = document.getElementById('h-msg').classList.contains('show') ? document.getElementById('h-msg').textContent : '', fix = !document.getElementById('btn-rescue').classList.contains('off'), fire = Render.burning(P);
      const F1 = Render.viewOf(P).fire, whole = { lvl: F1 && F1.lvl, k: F1 && F1.hk, wk, n: W.nL };
      g.sim(5, true); await frames(6);   // (KONEC IGRE came up in the step: no resume, that would close it)
      const sc = document.getElementById('s-over'), b = document.getElementById('over-again').getBoundingClientRect(), p = sc.querySelector('.panel').getBoundingClientRect();
      const over = { screen: g.screen, shown: sc.classList.contains('show'), n: W.nL, out: g.race.isOut(P), v: P.speed, phase: g.phase, title: sc.querySelector('h2').textContent, btn: document.getElementById('over-again').textContent, sub: document.getElementById('over-sub').textContent,
        bh: Math.round(b.height), bw: Math.round(b.width), pw: Math.round(p.width), oneLine: document.getElementById('over-again').scrollWidth <= document.getElementById('over-again').clientWidth + 1, inView: p.top >= 0 && p.left >= 0 && p.bottom <= innerHeight + 0.5 && p.right <= innerWidth + 0.5, hud: document.getElementById('hud').classList.contains('off'), touch: document.getElementById('touch').classList.contains('off'),
        res: document.getElementById('s-results').classList.contains('show') };
      document.getElementById('over-again').click();
      const ask = document.querySelector('#nk-vpr h3'), askTxt = ask && ask.textContent, no = document.querySelector('#nk-vpr [data-v="ne"]'); if (no) no.click();   // (Orodje za napake · Zadnji posnetki: a game left before its finish asks first whether to keep it: Ne)
      for (let k = 0; k < 50 && !(g.race && g.race.player !== P); k++) await wait(100);
      const P2 = g.race.player, again = { fresh: P2 !== P, rule: !!(P2.wreck && P2.wreck.rule), nL: P2.wreck.nL, dmg: P2.dmg, gone: !sc.classList.contains('show'), phase: g.phase, track: g.race.track.def.id, ask: askTxt };
      const own2 = !!P2.kt && !!(P2.wreck.rule && P2.wreck.rule.kt); P2.kt = null; P2.wreck.rule.kt = false;   // (the new race's car the same)
      // no ZAMENJAJ KOLO (the user's, 9. 11. 2026): no button on the page, no spare drawn on the roof; on its side the left column (the
      // place, the speed, the tyres) above the steering arrows
      g.pause(); g.sim(9, true); g.resume(); await frames(4);
      const arrowsTop = ['c-left', 'c-right'].map(id => document.getElementById(id)).filter(e => e && e.getClientRects().length).map(e => e.getBoundingClientRect().top);   // (the steering arrows' tops, while it runs)
      g.pause(); const kr = document.getElementById('h-rank').getBoundingClientRect();
      const none = { btn: !document.getElementById('wheel-swap') && !document.getElementById('ws-btn'), roof: !Render.viewOf(P2).spareM, chg: typeof g.race.changeWheel === 'undefined',
        col: innerWidth < innerHeight || (arrowsTop.length > 0 && kr.bottom <= Math.min(...arrowsTop)), colB: Math.round(kr.bottom), arrows: arrowsTop.map(Math.round) };
      // once more to KONEC IGRE, by a hard hit, then Rezultati: the results, the player out (Odstop)
      g.sim(9, true); P2.dmg = 0.85; Core.applyDamage(P2, 0.2, P2.m.len * 0.5, 0); await frames(2); const F2 = Render.viewOf(P2).fire, big = { lvl: F2 && F2.lvl, k: F2 && F2.hk };
      g.sim(4, true); await frames(4); Object.assign(big, { n: P2.wreck.nL, shown: sc.classList.contains('show'), sub: document.getElementById('over-sub').textContent });
      document.getElementById('over-res').click(); await frames(3);
      const res = { shown: document.getElementById('s-results').classList.contains('show'), gone: !sc.classList.contains('show') };
      return { own, own2, rule, others, n1, msg, fix, fire, fire0, whole, over, again, none, big, res };
    });
    console.log(tag, JSON.stringify(a));
    const O = a.over;
    T.check(`${tag}: the rule on the player's SOKOL only (not the AI)`, a.rule && a.others);
    T.check(`${tag}: the player's SOKOL with its own tyres and the KOLIBRI's wheel rule with them (Car.kt, rule.kt; every vehicle since 1. 11. 2026), in the new race too; the checks below without them (the rule SOKOL had before)`, a.own && a.own2, JSON.stringify({ own: a.own, own2: a.own2 }));
    T.check(`${tag}: a hit at 79 %: a wheel off, no words (KOLO JE ODPADLO no more), no Namesti kolo; the whole car on fire at once (none before), from the corner that lost the wheel`, a.n1 === 1 && !/KOLO JE ODPADLO|WHEEL OFF/.test(a.msg) && !a.fix && a.fire && !a.fire0 && a.whole.lvl === 2 && a.whole.k === a.whole.wk && a.whole.n === 1, `${a.n1} off, "${a.msg}", fix ${a.fix}, fire ${a.fire0} -> ${a.fire}, ${JSON.stringify(a.whole)}`);
    T.check(`${tag}: one wheel off: the car stopped, out: KONEC IGRE (no results first), the HUD and the controls off; under the title "${en ? 'A wheel came off: the car can go no further.' : 'Odpadlo je kolo: avto ne more naprej.'}"`, O.shown && O.screen === 'over' && O.n === 1 && O.out && O.v < 0.6 && O.phase === 'done' && !O.res && O.hud && O.touch && O.sub === (en ? 'A wheel came off: the car can go no further.' : 'Odpadlo je kolo: avto ne more naprej.'), JSON.stringify(O));
    T.check(`${tag}: ${en ? 'GAME OVER, PLAY AGAIN' : 'KONEC IGRE, PONOVI IGRO'}: big (>= 64 px high, most of the panel's width, one line), the panel all on screen`,
      O.title === (en ? 'GAME OVER' : 'KONEC IGRE') && O.btn === (en ? 'PLAY AGAIN' : 'PONOVI IGRO') && O.bh >= 64 && O.bw >= 0.8 * O.pw && O.inView && O.oneLine, `"${O.title}", "${O.btn}" ${O.bw} x ${O.bh}`);
    T.check(`${tag}: PONOVI IGRO: first the question whether to keep the game (Orodje za napake, Ne), then the same race again, the car whole, under the rule`, a.again.ask === 'Želiš shraniti to igro za kasnejšo analizo?' && a.again.fresh && a.again.gone && a.again.rule && a.again.nL === 0 && a.again.dmg === 0 && a.again.track === 'spa' && a.again.phase !== 'done', JSON.stringify(a.again));
    T.check(`${tag}: no ZAMENJAJ KOLO: no button on the page, no spare drawn on the roof, no Race.changeWheel${vw.width > vw.height ? '; the left column (the place, the speed, the tyres) above the steering arrows' : ''}`, a.none.btn && a.none.roof && a.none.chg && a.none.col, JSON.stringify(a.none));
    T.check(`${tag}: a hard hit at 85 %: two off at once, the whole car on fire at once (from its middle), KONEC IGRE; Rezultati: the results`, a.big.n >= 2 && a.big.lvl === 2 && a.big.k === -1 && a.big.shown && a.res.shown && a.res.gone, JSON.stringify(a.big) + ' ' + JSON.stringify(a.res));
    T.check(`${tag}: no errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // one of the ten cars without parts that come off (KAZE RS, paket-p K): its own tyres and the wheel rule as every car's; a hit at 79 %
  // takes a front wheel (its mesh hidden, a bare hub in its place, the wheel a piece on the road), the car stops: KONEC IGRE; upright and on its side
  for (const vw of [{ width: 640, height: 360 }, { width: 360, height: 640 }]) {
    const tag = `KAZE ${vw.width} x ${vw.height}`;
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', damage: 2, radio: 0 }, vw, { seed: 77 });
    await page.evaluate(() => { window.__game.S.car = 0; });
    await startTrack(page, 'spa');
    const r = await page.evaluate(async () => {
      const g = window.__game, P = g.race.player, W = P.wreck, frames = async (n) => { for (let i = 0; i < n; i++) await new Promise(r => requestAnimationFrame(r)); };
      const id = P.m.id, rule = !!(W && W.rule), kt = !!P.kt; if (!rule) return { id, rule, kt };
      g.sim(9, true); P.dmg = 0; P.dz = [0, 0, 0, 0]; P.cd = [0, 0, 0, 0]; P.kt = null; W.rule.kt = false;   // (the rule without its tyres: at 80 %)
      P.dmg = 0.79; Core.applyDamage(P, 0.03, P.m.len * 0.5, 0); const wk = [0, 1, 2, 3].find(j => W.wl & (1 << j));
      g.resume(); await frames(4); g.pause();
      const v = Render.viewOf(P), sd = wk % 2 ? 1 : -1, w = v.wf.find(q => Math.sign(q.position.z) === sd);
      const drawn = { off: !!v.wheelOff[wk], hidden: !!w && !w.visible, hub: !!(v.hubs[wk] && v.hubs[wk].visible) };
      g.sim(5, true); await frames(6);
      const sc = document.getElementById('s-over');
      return { id, rule, kt, wk, n: W.nL, drawn, over: sc.classList.contains('show'), title: sc.querySelector('h2').textContent, out: g.race.isOut(P), v: P.speed };
    });
    console.log(tag, JSON.stringify(r));
    T.check(`${tag}: its own tyres (Car.kt) and the wheel rule (paket-p K)`, r.id === 'kaze' && r.rule && r.kt, JSON.stringify({ id: r.id, rule: r.rule, kt: r.kt }));
    T.check(`${tag}: a hit at 79 %: a front wheel off, drawn so (the wheel hidden, a bare hub there)`, r.n === 1 && (r.wk === 0 || r.wk === 1) && r.drawn && r.drawn.off && r.drawn.hidden && r.drawn.hub, JSON.stringify(r.drawn));
    T.check(`${tag}: the car stopped, out: KONEC IGRE`, r.over && r.title === 'KONEC IGRE' && r.out && r.v < 0.6, `${r.title}, ${r.v}`);
    T.check(`${tag}: no errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close(); srv.close();
}
T.done();
