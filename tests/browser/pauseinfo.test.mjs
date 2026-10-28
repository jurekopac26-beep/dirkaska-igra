// The pause on Bathurst (game.js pauseInfo, pwFit; toastHold / toastBack), a long race (4 laps, the rivals' strategies) in a changing
// weather (Menljivo):
// 1. 4B, the weather lap by lap above the buttons (no box round it): one icon for every lap after the one under way, »Krog N« under each,
//    from the forecast (Race.forecast): the laps clear of the change's range dry (the sun) or wet (rain, heavy rain), the ones in it the
//    in-between icons (a sun with a cloud on the dry side, the cloud on the lap of the range's middle, light rain on the wet side); P on the
//    lap at whose end the stop for the other tyres is and that stop in words under the row (not once on the tyres for what comes). Animated
//    as C42-1: the sun's rays turn, its glow breathes, the light clouds drift, the rain falls: transform and opacity only, endless, every loop
//    a divisor of 6 s, no text moving; none with prefers-reduced-motion.
// 2. More laps than fit across (a 20-lap race): the row swipes sideways, the next icon cut at the edge, »Povleci za vseh N krogov →« under
//    it, every lap there to the last (nothing hidden), each label in its cell. On the last lap no row.
// 3. Under the buttons the race box with only the stops (78; no tabs, no »Vreme do cilja«): every driver in the order as it stands (the
//    player's row lit), each car's stops and the sets it ran, as the race has them.
// 4. It fits 390 × 844, 360 × 640, 412 × 915, 640 × 360 and 844 × 390, with a few laps left and with many: the panel on the screen, the row,
//    the box and every button in it (40 px tall at least), nothing cut off or wider than it; on its side the row in the left column over the
//    buttons, the box right.
// 5. In English: Lap N, Swipe for all N laps →, the stop in English, Stops.
// 6. P1A: a race's toast (a new achievement) is not shown while paused; it is held (still not there after its own time in the pause) and
//    shown when the race goes on, for 1.5 s at least.
// 7. A steady weather: no row, only the stops.
//   node tests/browser/pauseinfo.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the pause: the weather lap by lap and the stops (bathurst)');
const srv = await serve();
const browser = await launch();
// in the page: the race on (the computer driving) to the given lap's share; the player stops once on lap 1
const ON = ([lap, pit]) => { const g = window.__game, P = g.race.player, Tk = g.race.track; g.pause(); const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none';
  for (let k = 0; k < 400 && g.phase !== 'racing'; k++) g.sim(0.1, true);
  for (let k = 0; k < 60000 && P.dist / Tk.len < lap; k++) { if (pit && !P.repairN && P.lap >= 1 && !P.inPit && !Tk.pitAt(P.q.s)) P.pitWant = true; if (P.repairN && !P.inPit) P.pitWant = false; g.sim(0.05, true); }
  return { lap: P.dist / Tk.len, rep: P.repairN || 0 }; };
// the weather's one change put where the test wants it: from the rain now to the other side, `ahead` laps from here
const CHANGE = (ahead) => { const r = window.__game.race, P = r.player, X = r.wst && r.wst.wx; if (!X) return false; const lt = r._lapT(P); X.r0 = r.rain; X.r1 = r.rain > 0.5 ? 0 : 0.9; X.at = r.time + lt * ahead - (X.r1 > X.r0 ? 0 : X.dur);
  if (P.ty) P.ty.k = X.r1 > X.r0 ? 'dry' : 'wet'; return true; };
const PAUSE = () => { const g = window.__game; g.resume(); g.pause(); document.getElementById('s-pause').style.display = ''; return true; };   // (the pause screen shown again: hidden while the race was stepped)
const STATE = () => { const g = window.__game, wx = document.getElementById('pause-wx'), box = document.getElementById('pause-info'), P = g.race.player, row = wx.querySelector('.pw-row');
  return { info: g.pauseInfo, f: g.race.forecast(P), laps: g.race.laps, prog: Math.max(0, P.dist) / g.race.track.len, wet: P.ty && P.ty.k, rain: g.race.rain, r1: g.race.wst && g.race.wst.wx && g.race.wst.wx.r1,
    shown: !wx.classList.contains('off') && getComputedStyle(wx).display !== 'none', long: wx.classList.contains('long'), aria: wx.getAttribute('aria-label'),
    cells: [...row.children].map(c => ({ lbl: c.querySelector('b').textContent, svg: !!c.querySelector('svg'), p: !!c.querySelector('i'), k: c.dataset.k })),
    more: getComputedStyle(wx.querySelector('.pw-more')).display !== 'none' ? wx.querySelector('.pw-more').textContent : '', tip: (wx.querySelector('.pf-tip span') || {}).textContent || '',
    box: { shown: !box.classList.contains('off'), hd: box.querySelector('.pi-hd').textContent, tabs: box.querySelectorAll('button, [role="tab"]').length, rows: box.querySelectorAll('.ps-l li').length },
    words: document.getElementById('s-pause').textContent.includes('Vreme do cilja') || document.getElementById('s-pause').textContent.includes('Weather to the finish') }; };
// the icons as the forecast has them (the rule pauseInfo follows): the laps after the one under way
const want = (s) => { const f = s.f, N = s.laps, cur = Math.min(N - 1, Math.floor(s.prog)) + 1, ch = f.k === 'rain' || f.k === 'stop', A = s.prog + (f.lo || 0), Z = s.prog + (f.hi || 0), M = (A + Z) / 2, out = [];
  const wetK = (r) => r >= 0.6 ? 'heavy' : 'rain';
  for (let L = cur + 1; L <= N; L++) out.push([L, !ch ? (f.k === 'wet' ? wetK(s.rain) : 'sun') : L <= A || L - 1 >= Z ? ((f.k === 'rain') === (L - 1 >= Z) ? wetK(f.k === 'rain' ? s.r1 : s.rain) : 'sun') : L - 1 <= M && M < L ? 'cloud' : (f.k === 'rain') === (L - 0.5 > M) ? 'rain' : 'part']);
  return { cur, laps: out }; };
// every animation in the row: the element's class, its keyframes' properties, its duration; any text under an animated group
const ANIMS = () => { const el = document.getElementById('pause-wx'), A = el.getAnimations({ subtree: true });
  return { n: A.length, list: A.map(a => ({ cls: a.effect.target.getAttribute('class'), props: [...new Set(a.effect.getKeyframes().flatMap(k => Object.keys(k)))].filter(p => !['offset', 'computedOffset', 'easing', 'composite'].includes(p)), dur: a.effect.getTiming().duration, it: a.effect.getTiming().iterations, play: a.playState })),
    textMoves: [...el.querySelectorAll('b, p, i, text')].filter(t => t.closest('.pf-rot, .pf-glow, .pf-drift, .pf-fall')).length }; };
// the layout: the panel on the screen, the row and the box in it, every shown button in it and tall enough, nothing wider than its place;
// the row's cells: each label in its cell; a long row: the next cell cut at the edge, the last one there when swiped to the end
const FIT = () => { const r = (e) => e.getBoundingClientRect(), pn = document.querySelector('#s-pause .panel'), P = r(pn), wx = document.getElementById('pause-wx'), box = document.getElementById('pause-info'), W = innerWidth, H = innerHeight, bad = [];
  const btns = [...pn.querySelectorAll('.btns .btn')].filter(b => getComputedStyle(b).display !== 'none'), row = wx.querySelector('.pw-row'), R0 = r(row), cells = [...row.children];
  if (P.left < -0.5 || P.top < -0.5 || P.right > W + 0.5 || P.bottom > H + 0.5) bad.push('panel off the screen ' + JSON.stringify([P.left, P.top, P.right, P.bottom].map(Math.round)));
  for (const [n, e] of [['row', wx], ['box', box]]) if (getComputedStyle(e).display !== 'none') { const B = r(e); if (B.left < P.left - 0.5 || B.right > P.right + 0.5 || B.bottom > P.bottom - 2 || B.top < P.top) bad.push(n + ' out of the panel ' + JSON.stringify([B.top, B.bottom, P.bottom].map(Math.round))); }
  for (const b of btns) { const R = r(b); if (R.height < 39.5 || R.bottom > P.bottom + 0.5 || R.right > P.right + 0.5 || b.scrollWidth > b.clientWidth + 1) bad.push(b.textContent.trim() + ' ' + JSON.stringify([Math.round(R.height), Math.round(R.bottom), b.scrollWidth, b.clientWidth])); }
  for (const id of ['pause-strat', 'pit-row']) { const e = document.getElementById(id); if (e && getComputedStyle(e).display !== 'none' && !e.classList.contains('off')) { const R = r(e); if (R.bottom > P.bottom + 0.5 || R.right > P.right + 0.5) bad.push(id + ' cut off ' + Math.round(R.bottom) + '/' + Math.round(P.bottom)); } }
  for (const e of box.querySelectorAll('.pi-hd, .pi-st, .ps-l')) if (getComputedStyle(e).display !== 'none' && e.scrollWidth > e.clientWidth + 1) bad.push(e.className + ' wider than the box');
  for (const e of wx.querySelectorAll('.pw-more, .pf-tip')) if (getComputedStyle(e).display !== 'none' && (e.scrollWidth > e.clientWidth + 1 || r(e).right > R0.right + 0.5)) bad.push(e.className + ' wider than the row');
  for (const li of box.querySelectorAll('.ps-l li')) { const R = r(li); if (R.bottom > r(box).bottom + 0.5 || R.right > r(box).right + 0.5 || li.scrollWidth > li.clientWidth + 1) { bad.push('row ' + li.textContent + ' cut off'); break; } }
  for (const c of cells) { const b = c.querySelector('b'), C = r(c), L = r(b), S = r(c.querySelector('svg')); if (L.left < C.left - 2 || L.right > C.right + 2 || S.left < C.left - 3 || S.right > C.right + 3) { bad.push('cell ' + b.textContent + ' wider than its place ' + JSON.stringify([C.left, C.right, L.left, L.right].map(Math.round))); break; } }
  const vis = cells.filter(c => r(c).right <= R0.right + 0.5 && r(c).left >= R0.left - 0.5).length, cut = cells.find(c => r(c).left < R0.right - 4 && r(c).right > R0.right + 4);
  const B = r(box), b0 = btns.length ? r(btns[0]) : null, side = W > H, lay = { rowAbove: !b0 || R0.bottom <= b0.top + 0.5, left: side ? Math.abs(R0.left - b0.left) < 24 && B.left > R0.right : true };
  if (getComputedStyle(wx).display !== 'none' && !(lay.rowAbove && lay.left)) bad.push('the row not over the buttons (on its side: left, the box right) ' + JSON.stringify(lay));
  row.scrollLeft = row.scrollWidth; const last = cells[cells.length - 1], seen = last ? r(last).right <= r(row).right + 0.5 : true; row.scrollLeft = 0;
  return { bad, panel: [Math.round(P.top), Math.round(P.bottom)], h: H, n: cells.length, vis, cut: !!cut, seen, sw: row.scrollWidth, cw: row.clientWidth, long: wx.classList.contains('long'), cellW: cells.length ? Math.round(r(cells[0]).width) : 0 }; };
const sizes = [[390, 844], [360, 640], [412, 915], [640, 360], [844, 390]];
// a new size, and the page's own answer to it (the resize event and the layout's observers run with the next frames)
const resize = async (page, w, h) => { await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(150); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); };
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', weather: 'change', length: 'long', fuel: 1 }, { width: 390, height: 844 });
  await startTrack(page, 'bathurst');
  const on1 = await page.evaluate(ON, [1.45, true]);
  // the change: from the side the weather is on now to the other in ~1 lap (the player on the tyres for now, the other ones due: a stop for them, P)
  await page.evaluate(CHANGE, 0.9); await page.evaluate(PAUSE);
  const s1 = await page.evaluate(STATE), w1 = want(s1);
  T.check('a long race (4 laps) in a changing weather, paused in lap 2 after the player\'s stop', s1.laps === 4 && on1.lap > 1.4 && on1.lap < 2 && on1.rep === 1 && !!s1.f && (s1.f.k === 'rain' || s1.f.k === 'stop'), JSON.stringify({ on1, laps: s1.laps, f: s1.f }));
  const f = s1.f, mid = s1.prog + (f.lo + f.hi) / 2, B = Math.max(Math.ceil(s1.prog + 1e-6), Math.round(mid)), needP = (f.k === 'rain' ? s1.wet !== 'wet' : s1.wet !== 'dry') && B < s1.laps;
  const bigRe = f.k === 'rain' ? /^Dež (v manj kot krogu|čez ~\d+(,5)? krog(a|e|ov)?)$/ : /^Suho (v manj kot krogu|čez ~\d+(,5)? krog(a|e|ov)?)$/;
  T.check('4B: above the buttons one icon for every lap after the one under way (lap 2 of 4: Krog 3, Krog 4), as the forecast has them (in its range the in-between icons), no box round it',
    s1.shown && s1.cells.length === w1.laps.length && s1.cells.length === 2 && s1.cells.every((c, i) => c.svg && c.lbl === `Krog ${w1.laps[i][0]}` && c.k === w1.laps[i][1]) && !s1.long && !s1.more && bigRe.test(s1.aria) && s1.info.wx && s1.info.wx.laps.map(e => e.join(':')).join() === w1.laps.map(e => e.join(':')).join(),
    JSON.stringify({ cells: s1.cells, want: w1, f, prog: s1.prog, aria: s1.aria }));
  T.check('4B: P on the lap at whose end the stop for the other tyres is, and the stop in words under the row', needP && s1.info.wx.B === B && s1.cells.filter(c => c.p).map(c => c.lbl).join() === (B > w1.cur ? `Krog ${B}` : '') && s1.tip === (f.k === 'rain' ? 'Gume za dež' : 'Gume za suho') + `: v boks na koncu ${B}. kroga.`,
    JSON.stringify({ B, info: s1.info.wx.B, p: s1.cells.filter(c => c.p).map(c => c.lbl), tip: s1.tip }));
  T.check('78: the box under the buttons with only the stops (no tabs, no »Vreme do cilja«): every driver', s1.box.shown && /^Postanki$/i.test(s1.box.hd.trim()) && s1.box.tabs === 0 && !s1.words && s1.box.rows === 22, JSON.stringify(s1.box));
  { // (on the tyres for what comes already: no P, no words)
    const s0 = await page.evaluate(() => { const r = window.__game.race, P = r.player, f = r.forecast(P), k0 = P.ty.k; P.ty.k = f.k === 'rain' ? 'wet' : 'dry'; window.__game.resume(); window.__game.pause(); document.getElementById('s-pause').style.display = '';
      const wx = document.getElementById('pause-wx'), o = { p: wx.querySelectorAll('.pw-c > i').length, tip: !!wx.querySelector('.pf-tip'), B: window.__game.pauseInfo.wx.B }; P.ty.k = k0; window.__game.resume(); window.__game.pause(); document.getElementById('s-pause').style.display = ''; return o; });
    T.check('4B: already on the tyres for what comes: no P, no stop in words', s0.p === 0 && !s0.tip && s0.B == null, JSON.stringify(s0)); }
  // P1A: a race's toast while paused
  { const t0 = await page.evaluate(() => { const g = window.__game; g.resume(); g.toast('Nov dosežek: Čist krog', 3000); const el = document.getElementById('toast'), a = el.classList.contains('show'); g.pause(); document.getElementById('s-pause').style.display = '';
      return { before: a, paused: el.classList.contains('show'), op: getComputedStyle(el).opacity, txt: el.textContent }; });
    await page.waitForTimeout(3600);
    const t1 = await page.evaluate(() => { const el = document.getElementById('toast'); return { show: el.classList.contains('show') }; });
    const t2 = await page.evaluate(() => { const g = window.__game, el = document.getElementById('toast'); g.resume(); const o = { show: el.classList.contains('show'), txt: el.textContent }; return o; });
    await page.waitForTimeout(1200);
    const t3 = await page.evaluate(() => { const g = window.__game, el = document.getElementById('toast'), o = { show: el.classList.contains('show') }; g.pause(); document.getElementById('s-pause').style.display = ''; return o; });
    T.check('P1A: a race\'s toast (a new achievement) hidden while paused, held (still not there after its own 3 s), shown as the race goes on (still there 1.2 s later)',
      t0.before && !t0.paused && !t1.show && t2.show && t2.txt === 'Nov dosežek: Čist krog' && t3.show, JSON.stringify({ t0, t1, t2, t3 }));
    await page.evaluate(() => { const g = window.__game; g.resume(); document.getElementById('toast').classList.remove('show'); g.pause(); document.getElementById('s-pause').style.display = ''; }); }
  // the layouts with a few laps left
  for (const [w, h] of sizes) {
    await resize(page, w, h);
    const a = await page.evaluate(FIT);
    T.check(`it fits ${w} × ${h} (2 laps left): the panel on the screen, the row, the box and every button in it (40 px tall at least), nothing cut off or wider than its place${w > h ? '; the row left over the buttons, the box right' : ''}`, !a.bad.length && a.n === 2 && !a.long, JSON.stringify(a));
  }
  await resize(page, 390, 844);
  // the stops
  const st = await page.evaluate(() => { const g = window.__game, r = g.race, el = document.getElementById('pause-info'), li = [...el.querySelectorAll('.ps-l li')], log = g.stopsLog, by = new Map(r.cars.map((c, i) => [c.name, log[i]]));
    const order = (r.order && r.order.length ? r.order : r.cars);
    return { n: li.length, cars: r.cars.length,
      rows: li.map((l, i) => { const c = order[i], L = by.get(c.name); return { place: l.children[0].textContent, code: l.children[2].textContent, stops: l.querySelector('em').textContent, sets: [...l.querySelectorAll('.tset')].map(b => b.textContent), me: l.classList.contains('me'), want: { me: c === r.player, stops: L.n, sets: L.sets.slice(-4) } }; }) }; });
  const rowOk = st.rows.every((r, i) => r.place === String(i + 1) && r.me === r.want.me && +r.stops === r.want.stops && r.sets.join() === r.want.sets.join()), me = st.rows.find(r => r.me), rv = st.rows.filter(r => !r.me && +r.stops >= 1 && r.sets.length >= 2);
  T.check('78: the stops: every driver in the order as it stands (the player\'s row lit), each car\'s stops and the sets it ran, as the race has them', st.n === st.cars && rowOk && !!me && +me.stops === 1 && me.sets.length === 2 && rv.length >= 1,
    JSON.stringify({ n: st.n, me, rivals: rv.length, bad: st.rows.find(r => !(r.me === r.want.me && +r.stops === r.want.stops && r.sets.join() === r.want.sets.join())), first: st.rows.slice(0, 2) }));
  // a long race: 20 laps, the change in the middle of what is left (every kind of icon)
  await page.evaluate(() => { window.__game.race.laps = 20; }); await page.evaluate(CHANGE, 5.4); await page.evaluate(PAUSE); await page.waitForTimeout(100);
  const s2 = await page.evaluate(STATE), w2 = want(s2), kinds = new Set(s2.cells.map(c => c.k));
  T.check('4B, a 20-lap race: an icon for every lap to the finish (Krog 3 … Krog 20) as the forecast has them, the sun, the in-between ones and the rain', s2.cells.length === 18 && s2.cells.every((c, i) => c.lbl === `Krog ${w2.laps[i][0]}` && c.k === w2.laps[i][1]) && kinds.has('sun') && (kinds.has('rain') || kinds.has('heavy')) && (kinds.has('cloud') || kinds.has('part')),
    JSON.stringify({ cells: s2.cells.map(c => c.lbl + ':' + c.k).join(' '), want: w2.laps.map(e => e.join(':')).join(' '), f: s2.f }));
  const an = await page.evaluate(ANIMS), cls = (c) => an.list.filter(a => a.cls && a.cls.split(' ').includes(c));
  T.check('4B: animated (C42-1): the sun\'s rays turn, its glow breathes, the clouds drift, the rain falls; transform and opacity only, endless, every loop a divisor of 6 s, no text under them',
    ['pf-rot', 'pf-glow', 'pf-drift', 'pf-fall'].every(c => cls(c).length >= 1) && an.list.every(a => a.props.length && a.props.every(p => p === 'transform' || p === 'opacity') && a.it === Infinity && 6000 % a.dur === 0 && a.play === 'running') && an.textMoves === 0,
    JSON.stringify({ n: an.n, list: an.list.slice(0, 6), textMoves: an.textMoves }));
  for (const [w, h] of sizes) {
    await resize(page, w, h);
    const a = await page.evaluate(FIT), more = await page.evaluate(() => { const m = document.querySelector('#pause-wx .pw-more'); return getComputedStyle(m).display !== 'none' ? m.textContent : ''; });
    T.check(`it fits ${w} × ${h} (18 laps left): it swipes sideways (about ${w > h ? 8 : 6} across, the next one cut at the edge), »Povleci za vseh 18 krogov →« under it, every lap there to the last, nothing cut off or wider than its place`,
      !a.bad.length && a.n === 18 && a.long && a.sw > a.cw + 20 && a.cut && a.seen && a.vis >= (w > h ? 5 : 5) && a.vis <= (w > h ? 9 : 7) && a.cellW >= 48 && more === 'Povleci za vseh 18 krogov →', JSON.stringify(Object.assign(a, { more })));
  }
  await resize(page, 390, 844);
  // in English
  await page.evaluate((l) => { const g = window.__game; g.onAction('to-settings'); document.querySelector(`[data-set="lang"] button[data-v="${l}"]`).click(); g.onAction('settings-done'); }, 'en');
  await page.evaluate(PAUSE);
  const en = await page.evaluate(STATE), enB = en.info.wx.B;
  T.check('in English: Lap N under the icons, Swipe for all 18 laps →, the stop in English, the box\'s Stops', en.cells.length === 18 && en.cells.every((c, i) => c.lbl === `Lap ${w2.laps[i][0]}`) && en.more === 'Swipe for all 18 laps →' && /^stops$/i.test(en.box.hd.trim())
    && (enB != null ? en.tip === (en.f.k === 'rain' ? 'Rain tyres' : 'Dry tyres') + `: pit at the end of lap ${enB}.` : !en.tip) && /^(Rain|Dry) (within a lap|in ~\d+(\.5)? laps?)$/.test(en.aria) && !en.words,
    JSON.stringify({ cells: en.cells.slice(0, 3).map(c => c.lbl), more: en.more, tip: en.tip, hd: en.box.hd, aria: en.aria }));
  await page.evaluate((l) => { const g = window.__game; g.onAction('to-settings'); document.querySelector(`[data-set="lang"] button[data-v="${l}"]`).click(); g.onAction('settings-done'); }, 'sl');
  // the last lap: nothing after it, no row
  const sL = await page.evaluate(() => { const g = window.__game, r = g.race, P = r.player; r.laps = Math.floor(Math.max(0, P.dist) / r.track.len) + 1; g.resume(); g.pause(); document.getElementById('s-pause').style.display = ''; const wx = document.getElementById('pause-wx');
    return { laps: r.laps, prog: P.dist / r.track.len, off: wx.classList.contains('off'), disp: getComputedStyle(wx).display, cells: wx.querySelectorAll('.pw-c').length, box: !document.getElementById('pause-info').classList.contains('off') }; });
  T.check('4B: on the last lap (nothing after it) no row; the stops still there', sL.off && sL.disp === 'none' && sL.cells === 0 && sL.box, JSON.stringify(sL));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));

  // reduced motion: the still picture
  { const { page: p2, errors: e2 } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', weather: 'change', length: 'long' }, { width: 390, height: 844 }, { context: { reducedMotion: 'reduce' } });
    await startTrack(p2, 'bathurst'); await p2.evaluate(ON, [1.2, false]);
    await p2.evaluate(CHANGE, 0.9); await p2.evaluate(PAUSE);
    const s3 = await p2.evaluate(STATE), a2 = await p2.evaluate(ANIMS);
    T.check('prefers-reduced-motion: the icons without motion (no animation in the row)', s3.shown && s3.cells.length >= 1 && a2.n === 0, JSON.stringify({ cells: s3.cells.length, n: a2.n }));
    T.check('no page errors (reduced motion)', !e2.length, e2.slice(0, 5).join(' | ')); await p2.context().close(); }

  // a steady weather: only the stops
  { const { page: p3, errors: e3 } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', weather: 'dry', length: 'long' }, { width: 390, height: 844 });
    await startTrack(p3, 'bathurst'); await p3.evaluate(ON, [0.6, false]); await p3.evaluate(PAUSE);
    const s4 = await p3.evaluate(STATE), f4 = await p3.evaluate(FIT);
    T.check('a steady weather: no row, only the stops, it fits', !s4.f && !s4.shown && s4.cells.length === 0 && s4.box.shown && !f4.bad.length, JSON.stringify({ shown: s4.shown, box: s4.box, fit: f4 }));
    T.check('no page errors (steady weather)', !e3.length, e3.slice(0, 5).join(' | ')); await p3.context().close(); }
} finally {
  await browser.close(); await srv.close();
}
T.done();
