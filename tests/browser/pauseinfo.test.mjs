// The pause's race box (game.js pauseInfo) on Bathurst, a long race (4 laps, the rivals' strategies) in a changing weather (Menljivo):
// 1. The weather to the finish (91, C4-2 with C42-1): a tall sky band over the whole race, the change where the forecast puts it (± its
//    range: ± pol kroga), big icons (the sun, the rain), the laps under it with the player (TI) where he is and P at the end of the lap the
//    change comes in, its words under it; the header as the forecast has it. Animated in CSS: the sun's rays turn, its glow breathes, light
//    clouds drift, the rain falls: transform and opacity only, every loop a divisor of 6 s (seamless), no text moving; none at all with
//    prefers-reduced-motion. In English too.
// 2. Every driver's stops (78) on the other tab: the order as it stands, the player's row lit, each car's stops and the sets it ran (a
//    chip each in its compound's colour), as the race has them (the player's stop and the rivals' strategy stops on lap 1).
// 3. It fits: upright 390 × 844 and 360 × 640, on its side 844 × 390 and 640 × 360: the panel on the screen, the box and every button in
//    it (40 px tall at least), nothing cut off or wider than the box, on both tabs.
// 4. A steady weather: only the stops (no tabs to switch).
//   node tests/browser/pauseinfo.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the pause\'s race box: the weather and the stops (bathurst)');
const srv = await serve();
const browser = await launch();
// in the page: the race on (the computer driving) to the given lap's share; the player stops once on lap 1; the weather's one change put
// where the test wants it (wx: from the rain now to the other side, at s seconds of race time ahead)
const ON = ([lap, pit]) => { const g = window.__game, P = g.race.player, Tk = g.race.track; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
  for (let k = 0; k < 400 && g.phase !== 'racing'; k++) g.sim(0.1, true);
  for (let k = 0; k < 60000 && P.dist / Tk.len < lap; k++) { if (pit && !P.repairN && P.lap >= 1 && !P.inPit && !Tk.pitAt(P.q.s)) P.pitWant = true; if (P.repairN && !P.inPit) P.pitWant = false; g.sim(0.05, true); }
  return { lap: P.dist / Tk.len, rep: P.repairN || 0 }; };
const PAUSE = () => { const g = window.__game; g.resume(); g.pause(); return true; };
const STATE = () => { const g = window.__game, el = document.getElementById('pause-info'), P = g.race.player, f = g.race.forecast(P), tabs = [...el.querySelectorAll('.pi-tab')];
  return { info: g.pauseInfo, cls: el.className, f, laps: g.race.laps, prog: Math.max(0, P.dist) / g.race.track.len, tabs: tabs.map(t => ({ v: t.dataset.v, txt: t.textContent, on: t.classList.contains('on'), shown: getComputedStyle(t).display !== 'none' })),
    big: el.querySelector('.pi-big').textContent, tip: (el.querySelector('.pf-tip span') || {}).textContent || '', svgN: el.querySelectorAll('.pi-fc svg').length, pN: [...el.querySelectorAll('.pi-fc svg text')].filter(t => t.textContent === 'P').length,
    tiN: [...el.querySelectorAll('.pi-fc svg text')].filter(t => /^(TI|YOU)$/.test(t.textContent)).length, wet: P.ty && P.ty.k, rain: g.race.rain }; };
// every animation in the box: the element's class, its keyframes' properties, its duration; any text under an animated group
const ANIMS = () => { const el = document.getElementById('pause-info'), A = el.getAnimations({ subtree: true });
  return { n: A.length, list: A.map(a => ({ cls: a.effect.target.getAttribute('class'), props: [...new Set(a.effect.getKeyframes().flatMap(k => Object.keys(k)))].filter(p => !['offset', 'computedOffset', 'easing', 'composite'].includes(p)), dur: a.effect.getTiming().duration, it: a.effect.getTiming().iterations, play: a.playState })),
    textMoves: [...el.querySelectorAll('text, .pi-big, .pf-tip')].filter(t => t.closest('.pf-rot, .pf-glow, .pf-drift, .pf-fall')).length }; };
// the layout: the panel on the screen, the box in it, every shown button in it and tall enough, nothing wider than the box
const FIT = () => { const r = (e) => e.getBoundingClientRect(), pn = document.querySelector('#s-pause .panel'), P = r(pn), box = document.getElementById('pause-info'), B = r(box), W = innerWidth, H = innerHeight;
  const btns = [...pn.querySelectorAll('.btns .btn')].filter(b => getComputedStyle(b).display !== 'none'), bad = [];
  if (P.left < -0.5 || P.top < -0.5 || P.right > W + 0.5 || P.bottom > H + 0.5) bad.push('panel off the screen ' + JSON.stringify([P.left, P.top, P.right, P.bottom].map(Math.round)));
  if (B.left < P.left - 0.5 || B.right > P.right + 0.5 || B.bottom > P.bottom - 2 || B.top < P.top) bad.push('box out of the panel ' + JSON.stringify([B.top, B.bottom, P.bottom].map(Math.round)));
  for (const b of btns) { const R = r(b); if (R.height < 39.5 || R.bottom > P.bottom + 0.5 || R.right > P.right + 0.5 || b.scrollWidth > b.clientWidth + 1) bad.push(b.textContent.trim() + ' ' + JSON.stringify([Math.round(R.height), Math.round(R.bottom), b.scrollWidth, b.clientWidth])); }
  for (const id of ['pause-strat', 'pit-row']) { const e = document.getElementById(id); if (e && getComputedStyle(e).display !== 'none' && !e.classList.contains('off')) { const R = r(e); if (R.bottom > P.bottom + 0.5 || R.right > P.right + 0.5) bad.push(id + ' cut off ' + Math.round(R.bottom) + '/' + Math.round(P.bottom)); } }
  for (const e of box.querySelectorAll('.pi-hd, .pi-fc, .pi-st, .ps-l, .pf-tip')) if (getComputedStyle(e).display !== 'none' && e.scrollWidth > e.clientWidth + 1) bad.push(e.className + ' wider than the box');
  for (const li of box.querySelectorAll('.ps-l li')) if (getComputedStyle(li.parentElement.parentElement).display !== 'none') { const R = r(li); if (R.bottom > B.bottom + 0.5 || R.right > B.right + 0.5 || li.scrollWidth > li.clientWidth + 1) { bad.push('row ' + li.textContent + ' cut off'); break; } }
  return { bad, panel: [Math.round(P.top), Math.round(P.bottom)], box: [Math.round(B.top), Math.round(B.bottom)], h: H }; };
const sizes = [[390, 844], [360, 640], [844, 390], [640, 360]];
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', weather: 'change', length: 'long', fuel: 1 }, { width: 390, height: 844 });
  await startTrack(page, 'bathurst');
  const on1 = await page.evaluate(ON, [1.45, true]);
  // the change: the rain on its way in ~1 lap (from the side it is on now to the other)
  await page.evaluate(() => { const r = window.__game.race, X = r.wst && r.wst.wx; if (!X) return; const lt = r._lapT(r.player); X.r0 = r.rain; X.r1 = r.rain > 0.5 ? 0 : 0.9; X.at = r.time + lt * 0.9 - (X.r1 > X.r0 ? 0 : X.dur); });
  await page.evaluate(PAUSE);
  const s1 = await page.evaluate(STATE);
  T.check('a long race (4 laps) in a changing weather, paused in lap 2 after the player\'s stop', s1.laps === 4 && on1.lap > 1.4 && on1.lap < 2 && on1.rep === 1 && !!s1.f && (s1.f.k === 'rain' || s1.f.k === 'stop'), JSON.stringify({ on1, laps: s1.laps, f: s1.f }));
  const fc = s1.info && s1.info.fc, f = s1.f, N = s1.laps, LP = (307 - 9) / N, xl = (k) => 9 + LP * Math.min(N, Math.max(0, k)), mid = s1.prog + (f.lo + f.hi) / 2;
  const B = Math.max(Math.ceil(s1.prog + 1e-6), Math.round(mid)), needP = (f.k === 'rain' ? s1.wet !== 'wet' : s1.wet !== 'dry') && B < N;
  const bigRe = f.k === 'rain' ? /^Dež (v manj kot krogu|čez ~\d+(,5)? krog(a|e|ov)?)$/ : /^Suho (v manj kot krogu|čez ~\d+(,5)? krog(a|e|ov)?)$/;
  T.check('91: the weather\'s tab first (both tabs: the weather and the stops), the header as the forecast has it', s1.cls === 'pause-info fc two' && s1.tabs.every(t => t.shown) && s1.tabs[0].on && bigRe.test(s1.big) && fc && fc.big === s1.big, JSON.stringify({ cls: s1.cls, big: s1.big, tabs: s1.tabs }));
  T.check('91: the band: the change where the forecast puts it (the middle of its range), TI where the player is, P at the end of the lap the change comes in (a stop for the other tyres), its words',
    s1.svgN === 1 && s1.tiN === 1 && Math.abs(fc.XM - xl(s1.prog)) < 0.6 && Math.abs(fc.XR - xl(mid)) < 0.6 && (needP ? fc.B === B && Math.abs(fc.XP - xl(B)) < 0.6 && s1.pN === 1 && s1.tip === (f.k === 'rain' ? 'Gume za dež' : 'Gume za suho') + `: v boks na koncu ${B}. kroga.` : fc.B == null && s1.pN === 0 && !s1.tip),
    JSON.stringify({ XM: fc.XM, XR: fc.XR, XP: fc.XP, B: fc.B, want: { XM: xl(s1.prog), XR: xl(mid), B, needP }, tip: s1.tip }));
  const an = await page.evaluate(ANIMS), cls = (c) => an.list.filter(a => a.cls && a.cls.split(' ').includes(c));
  T.check('91: animated (C42-1): the sun\'s rays turn, its glow breathes, the clouds drift, the rain falls; transform and opacity only, endless, every loop a divisor of 6 s, no text under them',
    ['pf-rot', 'pf-glow', 'pf-drift', 'pf-fall'].every(c => cls(c).length >= 1) && an.list.every(a => a.props.length && a.props.every(p => p === 'transform' || p === 'opacity') && a.it === Infinity && 6000 % a.dur === 0 && a.play === 'running') && an.textMoves === 0,
    JSON.stringify({ n: an.n, list: an.list.slice(0, 6), textMoves: an.textMoves }));
  // the layouts, both tabs
  for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(150);
    const a = await page.evaluate(FIT);
    await page.evaluate(() => document.querySelector('#pause-info .pi-tab[data-v="st"]').click()); await page.waitForTimeout(80);
    const b = await page.evaluate(FIT);
    await page.evaluate(() => document.querySelector('#pause-info .pi-tab[data-v="fc"]').click()); await page.waitForTimeout(50);
    T.check(`it fits ${w} × ${h}: the panel on the screen, the box and every button in it (40 px tall at least), nothing cut off or wider than the box; the weather and the stops`, !a.bad.length && !b.bad.length, JSON.stringify({ fc: a, st: b }));
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(150);
  // 78: the stops
  await page.evaluate(() => document.querySelector('#pause-info .pi-tab[data-v="st"]').click());
  const st = await page.evaluate(() => { const g = window.__game, r = g.race, el = document.getElementById('pause-info'), li = [...el.querySelectorAll('.ps-l li')], log = g.stopsLog, by = new Map(r.cars.map((c, i) => [c.name, log[i]]));
    const order = (r.order && r.order.length ? r.order : r.cars);
    return { cls: el.className, big: el.querySelector('.pi-big').textContent, n: li.length, cars: r.cars.length,
      rows: li.map((l, i) => { const c = order[i], L = by.get(c.name); return { place: l.children[0].textContent, code: l.children[2].textContent, stops: l.querySelector('em').textContent, sets: [...l.querySelectorAll('.tset')].map(b => b.textContent), me: l.classList.contains('me'), want: { me: c === r.player, stops: L.n, sets: L.sets.slice(-4) } }; }) }; });
  const rowOk = st.rows.every((r, i) => r.place === String(i + 1) && r.me === r.want.me && +r.stops === r.want.stops && r.sets.join() === r.want.sets.join()), me = st.rows.find(r => r.me), rv = st.rows.filter(r => !r.me && +r.stops >= 1 && r.sets.length >= 2);
  T.check('78: the stops tab: every driver in the order as it stands (the player\'s row lit), each car\'s stops and the sets it ran, as the race has them', st.cls === 'pause-info st two' && st.n === st.cars && rowOk && !!me && +me.stops === 1 && me.sets.length === 2 && rv.length >= 1,
    JSON.stringify({ cls: st.cls, n: st.n, me, rivals: rv.length, bad: st.rows.find(r => !(r.me === r.want.me && +r.stops === r.want.stops && r.sets.join() === r.want.sets.join())), first: st.rows.slice(0, 2) }));
  // in English (the tab remembered: the weather picked back)
  await page.evaluate(() => document.querySelector('#pause-info .pi-tab[data-v="fc"]').click());
  await page.evaluate((l) => { const g = window.__game; g.onAction('to-settings'); document.querySelector(`[data-set="lang"] button[data-v="${l}"]`).click(); g.onAction('settings-done'); }, 'en');
  await page.evaluate(PAUSE);
  const en = await page.evaluate(STATE);
  const bigEn = f.k === 'rain' ? /^Rain (within a lap|in ~\d+(\.5)? laps?)$/ : /^Dry (within a lap|in ~\d+(\.5)? laps?)$/;
  T.check('in English: Weather to the finish, Stops; the header and the stop in English', en.tabs[0].txt === 'Weather to the finish' && en.tabs[1].txt === 'Stops' && bigEn.test(en.big) && (needP ? en.tip === (f.k === 'rain' ? 'Rain tyres' : 'Dry tyres') + `: pit at the end of lap ${B}.` : !en.tip) && en.tiN === 1,
    JSON.stringify({ tabs: en.tabs.map(t => t.txt), big: en.big, tip: en.tip }));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));

  // reduced motion: the still picture
  { const { page: p2, errors: e2 } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', weather: 'change', length: 'long' }, { width: 390, height: 844 }, { context: { reducedMotion: 'reduce' } });
    await startTrack(p2, 'bathurst'); await p2.evaluate(ON, [1.2, false]);
    await p2.evaluate(() => { const r = window.__game.race, X = r.wst && r.wst.wx; if (!X) return; const lt = r._lapT(r.player); X.r0 = r.rain; X.r1 = r.rain > 0.5 ? 0 : 0.9; X.at = r.time + lt * 0.9 - (X.r1 > X.r0 ? 0 : X.dur); });
    await p2.evaluate(PAUSE);
    const s2 = await p2.evaluate(STATE), a2 = await p2.evaluate(ANIMS);
    T.check('prefers-reduced-motion: the band without motion (no animation in the box)', s2.svgN === 1 && a2.n === 0, JSON.stringify({ svg: s2.svgN, n: a2.n }));
    T.check('no page errors (reduced motion)', !e2.length, e2.slice(0, 5).join(' | ')); await p2.context().close(); }

  // a steady weather: only the stops
  { const { page: p3, errors: e3 } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', weather: 'dry', length: 'long' }, { width: 390, height: 844 });
    await startTrack(p3, 'bathurst'); await p3.evaluate(ON, [0.6, false]); await p3.evaluate(PAUSE);
    const s3 = await p3.evaluate(STATE), f3 = await p3.evaluate(FIT);
    T.check('a steady weather: only the stops (no weather tab, nothing to switch), it fits', !s3.f && s3.cls === 'pause-info st' && !s3.tabs[0].shown && s3.tabs[1].shown && s3.svgN === 0 && !f3.bad.length, JSON.stringify({ cls: s3.cls, tabs: s3.tabs, fit: f3 }));
    T.check('no page errors (steady weather)', !e3.length, e3.slice(0, 5).join(' | ')); await p3.context().close(); }
} finally {
  await browser.close(); await srv.close();
}
T.done();
