// The top left of the HUD (design 5, »rahla senca«) in a race on Spa, Belgija (a real track with pits and compounds): no speedometer dial
// or gear, no damage picture, no tyre button A; row 1: the place, the total (small), the speed, KM/H; row 2: the tyres at the left (four
// dots, all in the colour of what the set has left, and the compound's word in its colour, no wear %; Slovenian and English), the lap at
// the right, 4 px from the dots to the word and 10 px from the word to the lap at 390 px (the approved mock); no tyres: the lap alone, at
// the left; the wrong tyres: the word on a red chip. DRS (dim, white armed, green open) and ZAVETRJE (white, not the cold tyres' blue) in
// small tags under the rows. The start's set never cold; after a real pit stop (the autopilot through the lane, as
// tests/browser/pits.test.mjs drives it) the word and the dots light blue (#7fd3ff) at the fitting and at the way out, about half way to
// their own colours half a lap on, their own a lap on. The fastest lap's time under the clock: upright the time and a star, lying the
// word. The budgets, with the worst texts forced and the HUD's face (ApexMenu) loaded, measured on the letters' boxes, the corner sign
// where the game puts it (window.__game.noteAt): upright (360x640, 390x844, 412x915) row 1 left of the clock, the line under the clock
// under row 2 (never on its line: SEKTOR 2  1:05.123, the fastest lap with its star, the longest place names of the real tracks in two
// lines at most, in English too), clear of the map, the corner sign, the clock and the column under the rows, the duel's gap line and the
// police's panel under it; lying (640x360, 844x390, 915x412) both rows left of the corner sign (the police's further left too); the whole
// left column (fuel, three faults, a flag, DRS and ZAVETRJE) left of ZAMENJAJ KOLO lying, over none of the map, the pause button, the
// corner sign, the clock or the controls, in every steering mode (buttons, wheel, tilt) either way the phone is held.
//   node tests/browser/hud.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the top left of the HUD (place, speed, tyres, lap)');
const srv = await serve();
const browser = await launch();
const COLD = 'rgb(127, 211, 255)', OWN = { S: 'rgb(232, 53, 43)', M: 'rgb(242, 198, 22)', H: 'rgb(244, 244, 240)', wet: 'rgb(79, 168, 255)' }, CHALK = 'rgb(246, 246, 241)';
const SIZES = [[360, 640], [390, 844], [412, 915], [640, 360], [844, 390], [915, 412]];
const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const near = (a, b, d = 1) => { const x = rgb(a), y = rgb(b); return x.length === 3 && x.every((v, i) => Math.abs(v - y[i]) <= d); };
// the game's language through the settings (as a player switches it: the HUD's texts written again)
const setLang = (page, l) => page.evaluate((l) => { const g = window.__game; g.pause(); g.onAction('to-settings'); document.querySelector(`[data-set="lang"] button[data-v="${l}"]`).click(); g.onAction('settings-done'); }, l);
// in the page: the tyre group as it stands after a HUD frame (g.hud), with the colour the dots should have for the set's wear
const TYRES = () => { const g = window.__game, P = g.race.player, t = document.getElementById('h-tyre'); g.hud();
  const left = (1 - P.ty.wear) * 100, h = Math.round(Math.max(0, Math.min(1, (left - 40) / 55)) * 120), a = 0.78 * Math.min(0.52, 0.48), f = (n) => { const k = (n + h / 30) % 12; return 0.52 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return { cls: t.className, txt: t.textContent, word: getComputedStyle(t.lastElementChild).color, chip: getComputedStyle(t.lastElementChild).backgroundColor, dots: [...t.querySelectorAll('.dts i')].map(i => getComputedStyle(i).backgroundColor),
    want: 'rgb(' + [f(0), f(8), f(4)].map(v => Math.round(v * 255)).join(', ') + ')', k: P.ty.k, c: P.ty.c, wear: +P.ty.wear.toFixed(3), dist: +P.dist.toFixed(1), shown: getComputedStyle(t).display !== 'none' }; };

try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', track: 'spa', cmp: 'M', length: 'long', tower: 1, radio: 0, fuel: 0, damage: 0, notes: 1 }, { width: 390, height: 844 }, { touch: true, context: { reducedMotion: 'reduce' } });
  await startTrack(page, 'spa');
  const fonts = await page.evaluate(async () => { await Promise.all(['italic 800 32px ApexMenu', 'italic 700 12px ApexMenu', '700 9px ApexMenu'].map(f => document.fonts.load(f, 'AZaz09ČŠŽ/–')));
    return document.fonts.check('italic 800 32px ApexMenu') && document.fonts.check('700 9px ApexMenu'); });
  T.check('the HUD\'s face (ApexMenu, the menu\'s Roboto) loaded before anything is measured', fonts);
  await page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 800 && g.phase !== 'racing'; k++) g.sim(0.05, false, 0, 0); g.sim(3, true); g.hud(); });

  // 1. the old pieces gone
  const gone = await page.evaluate(() => ['h-gear', 'h-dmg', 'btn-tyre', 'speedo', 'speedo-c', 'h-dmgrow', 'dmg-ns'].filter(id => document.getElementById(id)));
  T.check('no speedometer dial (#speedo, its canvas), no gear (#h-gear), no damage picture (#h-dmg, »brez rezerve«), no tyre button (#btn-tyre)', !gone.length, gone.join(', '));

  // 2. the two rows: the place, the total, the speed, KM/H; the tyres left of the lap
  const rows = await page.evaluate(() => { const R = (id) => { const r = document.getElementById(id).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, cy: (r.top + r.bottom) / 2 }; };
    const r1 = document.getElementById('h-row1'), r2 = document.getElementById('h-row2'), q = (e) => [...e.querySelectorAll('[id]')].map(x => x.id);
    return { order1: q(r1).join(), order2: [...r2.children].map(x => x.id).join(), pos: R('h-pos'), tot: R('h-tot'), spd: R('h-speed'), kmh: R('h-kmh'), tyre: R('h-tyre'), lap: R('h-lap'), row1: R('h-row1'), row2: R('h-row2'),
      kmhTxt: document.getElementById('h-kmh').textContent, totTxt: document.getElementById('h-tot').textContent, totC: getComputedStyle(document.getElementById('h-tot')).color, lap1: document.getElementById('h-lap').textContent,
      fam: getComputedStyle(document.getElementById('h-pos')).fontFamily, shadow: getComputedStyle(document.getElementById('h-main')).backgroundImage.slice(0, 20), plate: getComputedStyle(document.getElementById('h-main')).backgroundColor,
      rankFx: ['filter', 'transform', 'contain', 'containerType', 'backdropFilter', 'willChange'].map(k => getComputedStyle(document.getElementById('h-rank'))[k] || '').concat(['filter', 'transform', 'contain', 'containerType'].map(k => getComputedStyle(document.getElementById('h-main'))[k] || '')) }; });
  const inRow = (a, row) => a.cy > row.t && a.cy < row.b;
  T.check('row 1: the place, the total (small, yellow: /13), the speed, KM/H, left to right on one row; row 2 under it: the tyres left of the lap (KROG 1/4)',
    rows.order1 === 'h-pos,h-tot,h-spd,h-speed,h-kmh' && rows.order2 === 'h-tyre,h-lap' && rows.pos.r <= rows.tot.l + 1 && rows.tot.r <= rows.spd.l + 1 && rows.spd.r <= rows.kmh.l + 1 && [rows.pos, rows.tot, rows.spd, rows.kmh].every(a => inRow(a, rows.row1))
      && rows.row2.t >= rows.row1.b - 1 && rows.tyre.r < rows.lap.l && rows.kmhTxt === 'KM/H' && rows.totTxt === '/13' && rows.totC === 'rgb(255, 210, 63)' && /^KROG [1-4]\/4$/.test(rows.lap1) && /ApexMenu/.test(rows.fam),
    JSON.stringify(rows));
  T.check('the soft shadow: a radial gradient behind the two rows, no plate; nothing on #h-rank or round the rows that would move the fixed timing tower (filter, transform, contain ...)',
    /radial-gradient/.test(rows.shadow) && rows.plate === 'rgba(0, 0, 0, 0)' && rows.rankFx.every(v => !v || v === 'none' || v === 'normal' || v === 'auto'), JSON.stringify({ shadow: rows.shadow, plate: rows.plate, fx: rows.rankFx }));
  // the gaps of row 2 as the approved mock has them at 390 px (the big number 32 px): the dots to the word 4 px, the word to the lap 10 px;
  // no tyres (a track without pits, a time trial ...): the lap alone, at the left
  const gaps = await page.evaluate(() => { const $ = (id) => document.getElementById(id), r = (e) => e.getBoundingClientRect(), t = $('h-tyre'), c0 = t.className;
    const out = { dw: +(r(t.lastElementChild).left - r(t.firstElementChild).right).toFixed(2), wl: +(r($('h-lap')).left - r(t).right).toFixed(2), big: parseFloat(getComputedStyle($('h-pos')).fontSize) };
    t.className = ''; out.alone = +(r($('h-lap')).left - r($('h-row2')).left).toFixed(2); out.lapL = +r($('h-lap')).left.toFixed(1); out.posL = +r($('h-pos')).left.toFixed(1); t.className = c0; return out; });
  T.check('row 2\'s gaps at 390 px as in the approved mock: the dots to the word 4 px, the word to the lap 10 px (the big number 32 px); without tyres the lap alone at the left',
    Math.abs(gaps.dw - 4) <= 0.5 && Math.abs(gaps.wl - 10) <= 0.5 && Math.abs(gaps.big - 32) <= 0.5 && Math.abs(gaps.alone) <= 0.5 && Math.abs(gaps.lapL - gaps.posL) <= 2, JSON.stringify(gaps));
  // DRS and ZAVETRJE in the tags under the rows: DRS dim, white armed, green open (its colours on the old speedometer); ZAVETRJE white
  const tags = await page.evaluate(() => { const $ = (id) => document.getElementById(id), hud = $('hud'), d = $('h-drs'), w = $('h-tow'), c = (e) => getComputedStyle(e), out = {};
    const d0 = hud.classList.contains('drs'), dc = d.className, w0 = w.classList.contains('on'); d.style.transition = 'none';   // (read at once, not half way through its fade)
    hud.classList.remove('drs'); w.classList.remove('on'); out.none = c($('h-tags')).display; hud.classList.add('drs');
    for (const k of ['', 'arm', 'open']) { d.className = k; out[k || 'dim'] = [c(d).color, c(d).borderTopColor, c(d).backgroundColor].join(' / '); }
    hud.classList.remove('drs'); d.className = ''; w.classList.add('on'); out.tow = c(w).color; out.towShown = c(w).display; out.tagsTow = c($('h-tags')).display;
    const r2 = $('h-row2').getBoundingClientRect(), tg = $('h-tags').getBoundingClientRect(); out.under = tg.top >= r2.bottom - 1;
    hud.classList.toggle('drs', d0); d.className = dc; w.classList.toggle('on', w0); d.style.transition = ''; return out; });
  T.check('DRS and ZAVETRJE: a small row under row 2 only when needed; DRS dim, white when armed, green when open; ZAVETRJE white (not the cold tyres\' light blue)',
    tags.none === 'none' && tags.tagsTow === 'flex' && tags.under && tags.towShown === 'block' && tags.tow === CHALK && /^rgba\(255, 255, 255, 0\.38\) \/ rgba\(255, 255, 255, 0\.3\)/.test(tags.dim) && tags.arm.startsWith(CHALK + ' / ' + CHALK) && tags.open.startsWith('rgb(12, 26, 8) / rgb(98, 224, 76) / rgb(98, 224, 76)'),
    JSON.stringify(tags));

  // 3. the tyres: the compound's word only (no digit, no %), in its colour; in English; the dots by the wear (8 % and 60 % worn); the wrong ones on a red chip
  const sl = await page.evaluate(TYRES);
  await setLang(page, 'en'); const en = await page.evaluate(TYRES); await setLang(page, 'sl');
  const wears = await page.evaluate((src) => { const P = window.__game.race.player, w0 = P.ty.wear, f = (0, eval)(src), out = [];
    for (const w of [0.08, 0.6]) { P.ty.wear = w; out.push(f()); } P.ty.wear = w0; f(); return out; }, TYRES.toString());
  const bad = await page.evaluate((src) => { const g = window.__game, W = g.race.wst, l0 = W.line, f = (0, eval)(src); W.line = 0.9; const o = f(); W.line = l0; f(); return o; }, TYRES.toString());
  T.check('the tyres: the compound\'s word only (SREDNJE; in English MEDIUM), no wear %, in its colour (medium yellow), class "on dry cM"; the four dots in the colour of the wear; not cold at the start',
    sl.shown && sl.cls === 'on dry cM' && sl.txt === 'SREDNJE' && en.txt === 'MEDIUM' && !/\d|%/.test(sl.txt + en.txt) && sl.word === OWN.M && en.word === OWN.M && sl.dots.length === 4 && sl.dots.every(c => near(c, sl.want)) && !/cold/.test(sl.cls),
    JSON.stringify({ sl, en }));
  T.check('the dots by what the set has left: 92 % green, 40 % red (all four the same), the word unchanged', wears.length === 2 && wears.every(o => o.dots.length === 4 && o.dots.every(c => near(c, o.want)) && o.txt === 'SREDNJE') && near(wears[0].want, 'rgb(48, 228, 37)', 12) && near(wears[1].want, 'rgb(228, 37, 37)', 2),
    JSON.stringify(wears.map(o => ({ wear: o.wear, dots: o.dots[0], want: o.want, txt: o.txt }))));
  T.check('the wrong tyres for the road (slicks on a wet line): the word white on a red chip, class "bad"', / bad/.test(bad.cls) && bad.chip === 'rgba(190, 30, 30, 0.78)' && bad.word === 'rgb(255, 255, 255)' && bad.txt === 'SREDNJE', JSON.stringify(bad));

  // 4. a real pit stop at the end of the first lap (the stop's tyres: Srednje, as the T key or the pause menu would set them): cold at the
  // fitting and at the way out, about half way half a lap on, their own colours a lap on
  const cold = await page.evaluate((src) => {
    const g = window.__game, P = g.race.player, L = g.race.track.len, f = (0, eval)(src), out = {}; P.pitCmp = 'M';
    for (let k = 0; k < 6000 && !P.pitDone; k++) { if (P.lap >= 1 && !P.repairN) P.pitWant = true; if (P.inPit || g.pitAuto.st) g.sim(1 / 60, false, 0, 0); else g.sim(0.1, true); }
    out.done = f(); out.done.pit = P.pitState;
    for (let k = 0; k < 6000 && P.pitDone; k++) g.sim(1 / 60, false, 0, 0);
    out.exit = f(); out.exit.inPit = P.inPit; const x0 = P.dist;
    for (let k = 0; k < 9000 && P.dist < x0 + 0.5 * L; k++) g.sim(0.05, true);
    out.half = f(); out.half.k = +((P.dist - x0) / L).toFixed(3);
    for (let k = 0; k < 9000 && P.dist < x0 + L; k++) g.sim(0.05, true);
    out.lap = f(); out.lap.k = +((P.dist - x0) / L).toFixed(3); out.laps = g.race.laps; out.phase = g.phase;
    return out; }, TYRES.toString());
  const isCold = (o) => !!o && / cold/.test(o.cls) && o.word === COLD && o.dots.length === 4 && o.dots.every(c => c === COLD);
  const t = (c, own) => { const x = rgb(c), y = rgb(COLD), z = rgb(own), j = [0, 1, 2].reduce((m, i) => Math.abs(z[i] - y[i]) > Math.abs(z[m] - y[m]) ? i : m, 0); return (x[j] - y[j]) / (z[j] - y[j]); };   // (how far from the cold blue to its own colour)
  const own = OWN[cold.lap && cold.lap.c] || OWN.M;
  T.check('the race\'s start: the tyres not cold (their own colours)', !/cold/.test(sl.cls) && sl.word === OWN.M, sl.cls);
  T.check('right after the pit stop\'s new set (done, still in the box\'s lane): the word and the four dots light blue (#7fd3ff), class "cold"', isCold(cold.done) && cold.done.c === 'M', JSON.stringify(cold.done));
  T.check('at the way out of the pit lane: still light blue', isCold(cold.exit) && !cold.exit.inPit, JSON.stringify(cold.exit));
  T.check('half a lap from the way out: about half way to their own colours (the word and the dots)', !!cold.half && Math.abs(t(cold.half.word, own) - 0.5) <= 0.08 && Math.abs(t(cold.half.dots[0], cold.half.want) - 0.5) <= 0.08 && / cold/.test(cold.half.cls),
    JSON.stringify({ half: cold.half, tw: cold.half && +t(cold.half.word, own).toFixed(2) }));
  T.check('a lap from the way out: their own colours (SREDNJE yellow, the dots by the wear), no longer cold', !!cold.lap && !/cold/.test(cold.lap.cls) && cold.lap.word === own && cold.lap.dots.every(c => near(c, cold.lap.want)) && cold.phase === 'racing',
    JSON.stringify(cold.lap));

  // 4b. the fastest lap's time under the clock, as the game writes it at the line (a lap faster than all before it): upright the time and a
  // star (the line under row 2, clear of the map), lying the word
  const FAST = () => { const g = window.__game, P = g.race.player; P.lapTimes.push(Math.min(...P.lapTimes) - 0.5); g.hud(); return document.getElementById('h-split').textContent; };
  const fastUp = await page.evaluate(FAST);
  await page.setViewportSize({ width: 844, height: 390 }); const fastLying = await page.evaluate(FAST); await page.setViewportSize({ width: 390, height: 844 });
  T.check('the fastest lap under the clock: upright »KROG n: time ★« (a star for the word), lying »KROG n: time  NAJHITREJŠI«',
    /^KROG \d+: \d+:\d\d\.\d{3}\s+★$/.test(fastUp) && !/NAJHITREJŠI/.test(fastUp) && /^KROG \d+: \d+:\d\d\.\d{3}\s+NAJHITREJŠI$/.test(fastLying), JSON.stringify({ fastUp, fastLying }));

  // 5. the budgets: the worst texts forced (the race paused, its screen hidden; the controls and the pause button shown; the corner sign as
  // at a real corner, where the game puts it), at each size; every steering mode
  const s0 = await page.evaluate(() => { const g = window.__game; for (const s of document.querySelectorAll('.screen.show')) s.style.display = 'none'; document.getElementById('touch').classList.remove('off'); document.getElementById('btn-pause').classList.remove('off'); Render.scene.visible = false;
    document.getElementById('h-split').className = ''; for (let s = 0; s < g.race.track.len; s += 5) if (g.noteAt(s, 30).key) return s; return null; });
  // the longest names of places shown under the clock (the real tracks), Slovenian and English, upper case as the game writes them
  const LONG = await page.evaluate(() => { const S = document.getElementById('h-split'), L = [], w = (t) => { S.textContent = t; const r = document.createRange(); r.selectNodeContents(S); return r.getBoundingClientRect().width; };
    S.style.maxWidth = 'none'; S.style.whiteSpace = 'nowrap'; S.className = 'show even';
    for (const d of TRACK_DEFS) { if (d.test) continue; for (const e of d.names || []) { if (!Array.isArray(e) && e.hud === false) continue; const n = Array.isArray(e) ? e[0] : e.n; Lang.set('en'); const en = Lang.place(n).toUpperCase(); Lang.set('sl'); L.push({ sl: String(n).toUpperCase(), en }); } }
    const sl = L.map(q => [w(q.sl), q.sl]).sort((a, b) => b[0] - a[0])[0], en = L.map(q => [w(q.en), q.en]).sort((a, b) => b[0] - a[0])[0];
    S.style.maxWidth = S.style.whiteSpace = ''; S.className = ''; S.textContent = ''; return { sl: sl[1], en: en[1], wsl: Math.round(sl[0]), wen: Math.round(en[0]), n: L.length }; });
  const PUT = (st) => { const g = window.__game, $ = (id) => document.getElementById(id), hud = $('hud');
    hud.classList.remove('pol', 'duel', 'up', 'tt', 'ttd', 'ttn'); for (const c of st.cls || []) hud.classList.add(c);
    const T = $('h-tyre'); if (st.ty) { T.className = 'on dry cM'; T.lastElementChild.textContent = st.en ? 'MEDIUM' : 'SREDNJE'; } else T.className = '';
    $('h-pos').textContent = st.pos; $('h-tot').textContent = st.tot; $('h-speed').textContent = '299'; $('h-lap').innerHTML = g.lapHTML(st.lap);
    hud.classList.toggle('pol', !!st.pol); $('h-rlbl').textContent = st.pol ? (st.en ? 'POLICE' : 'POLICIJA') : (st.en ? 'POS' : 'MESTO'); hud.classList.toggle('tw', !st.pol && !st.tt);
    hud.classList.toggle('drs', !!st.col); $('h-drs').className = st.col ? 'open' : ''; $('h-tow').classList.toggle('on', !!st.col);
    $('h-fuel').className = st.col ? 'on' : ''; $('h-fuel').innerHTML = st.col ? 'GORIVO 100%<i style="width:100%"></i><b style="left:62%"></b>' : '';
    $('h-flt').className = st.col || st.flt ? 'on' : ''; $('h-flt').innerHTML = st.col || st.flt ? '<span class="pk">PREDRTA GUMA</span><span class="br">VROČE ZAVORE</span><span class="en">VROČ MOTOR</span>' : '';
    $('h-flag').className = st.col ? 'on yel' : ''; $('h-flag').textContent = st.col ? 'RUMENA ZASTAVA' : '';
    $('h-alt').textContent = st.alt || ''; $('h-turn').textContent = st.turn || ''; $('h-gap').textContent = st.gap || '';
    if (st.pol) { $('h-heat').textContent = '★★★☆☆'; $('h-pol').className = 'warn hid'; $('h-hidel').textContent = st.en ? 'HELICOPTER ABOVE YOU' : 'HELIKOPTER NAD TABO'; $('h-flat').textContent = st.en ? 'FLAT TYRES: 2' : 'PREBITE GUME: 2'; $('h-chk').className = 'on'; $('h-chk').innerHTML = '<b>SKRIVALIŠČE · 400 m</b><span>Garaža desno ob cesti: zapelji noter</span>'; }
    else { $('h-pol').className = ''; $('h-chk').className = ''; }
    const S = $('h-split'); S.style.transition = 'none'; S.textContent = st.split || ''; S.className = st.split ? 'show sg' : '';
    $('h-note').style.transition = 'none'; g.noteAt(window.__hudS0, 30);   // (the sign as the game places it: under the line when it is in two lines)
    const W = $('wheel-swap'); W.classList.toggle('on', !!st.col && innerWidth > innerHeight); if (st.col) $('ws-btn').style.top = Math.round($('h-times').getBoundingClientRect().bottom + 6) + 'px';   // (as game.js swapTop puts it)
  };
  const MEASURE = () => { const $ = (id) => document.getElementById(id);
    const vis = (e) => { for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden') return false; } return true; };
    const box = (r, id) => ({ id, l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) });
    const glyphs = (e, id) => { const out = []; if (!e || !vis(e)) return out; const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.nodeValue.trim() || !vis(n.parentElement)) continue; const g = document.createRange(); g.selectNodeContents(n); for (const r of g.getClientRects()) if (r.width > 0) out.push(box(r, id || n.parentElement.id)); } return out; };
    const els = (ids) => ids.map(id => $(id)).filter(e => e && vis(e) && e.getBoundingClientRect().width > 0).map(e => box(e.getBoundingClientRect(), e.id));
    const ext = (rs) => rs.length ? { l: Math.min(...rs.map(r => r.l)), t: Math.min(...rs.map(r => r.t)), r: Math.max(...rs.map(r => r.r)), b: Math.max(...rs.map(r => r.b)) } : null;
    const dots = [...document.querySelectorAll('#h-tyre .dts i')].filter(vis).map(e => box(e.getBoundingClientRect(), 'dot'));
    const r1 = glyphs($('h-row1')), r2 = glyphs($('h-row2')).concat(dots);
    const under = glyphs($('h-rlbl')).concat(els(['h-drs', 'h-tow', 'h-fuel', 'h-flag']), glyphs($('h-alt')), glyphs($('h-turn')), [...$('h-flt').children].filter(vis).map(e => box(e.getBoundingClientRect(), 'flt')));
    return { w: innerWidth, h: innerHeight, r1: ext(r1), r2: ext(r2), r2g: r2, col: r1.concat(r2, under), under, colExt: ext(r1.concat(r2, under)), clock: glyphs($('h-time'), 'time').concat(glyphs($('h-best'), 'best')),
      split: glyphs($('h-split'), 'split'), gap: glyphs($('h-gap'), 'gap'), pol: glyphs($('h-pol'), 'pol').concat(els(['h-bust', 'h-hide', 'h-chk'])), note: els(['h-note'])[0] || null,
      map: els(['h-map'])[0], pause: els(['btn-pause'])[0] || null, ws: $('wheel-swap').classList.contains('on') ? box($('ws-btn').getBoundingClientRect()) : null,
      ctl: els(['c-left', 'c-right', 'c-wheel', 'c-brake', 'c-gas', 'tilt-ind']), mode: (/m-(\w+)/.exec($('touch').className) || [])[1] };
  };
  const hit = (a, b) => !!a && !!b && Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;
  const yOver = (a, b) => Math.min(a.b, b.b) - Math.max(a.t, b.t) > 0;
  const ext = (rs) => rs.length ? { l: Math.min(...rs.map(r => r.l)), t: Math.min(...rs.map(r => r.t)), r: Math.max(...rs.map(r => r.r)), b: Math.max(...rs.map(r => r.b)) } : null;
  // what is wrong with a state at a size (the room each budget leaves, for the record)
  function wrong(o) {
    const bad = [], land = o.w > o.h, room = {};
    if (!o.r1 || !o.r2 || o.r1.l < 0 || o.r2.l < 0 || o.colExt.b > o.h) bad.push('the rows off the screen');
    for (const g of o.r2g) if (o.clock.some(k => hit(k, g))) bad.push('row 2 over the clock or the NAJ line');
    if (!land) {   // upright: row 1 left of the clock; the line under the clock under row 2, clear of the map, the sign, the clock and the column
      const ck = o.clock.filter(c => yOver(c, o.r1)); room.clock = ck.length ? +(Math.min(...ck.map(c => c.l)) - o.r1.r).toFixed(1) : null;
      if (room.clock != null && room.clock < 3) bad.push(`row 1 ${room.clock} px from the clock`);
      const sp = ext(o.split);
      if (sp) {
        room.under = +(sp.t - o.r2.b).toFixed(1); if (room.under < 1) bad.push(`the line under the clock ${room.under} px under row 2`);
        const lines = new Set(o.split.map(c => Math.round(c.t))).size; room.lines = lines; if (lines > 2) bad.push(`the line under the clock in ${lines} lines`);
        if (o.map && yOver(sp, o.map)) { room.map = +(o.map.l - sp.r).toFixed(1); if (room.map < 3) bad.push(`the line under the clock ${room.map} px from the map`); }
        if (o.note) room.sign = +(o.note.t - sp.b).toFixed(1);
        const side = o.under.filter(u => yOver(u, sp)); if (side.length) room.col = +(sp.l - Math.max(...side.map(u => u.r))).toFixed(1);
        for (const c of o.split) for (const [n, x] of [['the corner sign', o.note], ['the pause button', o.pause], ...o.clock.map(k => ['the clock', k]), ...o.under.map(u => ['the column', u])]) if (hit(c, x)) bad.push('the line under the clock over ' + n);
      }
      for (const g of o.gap) { if (sp && g.t < sp.b - 1) bad.push('the duel\'s gap over the line under the clock'); if (hit(g, o.note)) bad.push('the duel\'s gap over the corner sign'); }
      if (o.gap.length && o.note) room.gapSign = +(o.note.t - ext(o.gap).b).toFixed(1);
      for (const p of o.pol) { if (sp && p.t < sp.b - 1) bad.push('the police\'s panel over the line under the clock'); if (hit(p, o.note)) bad.push('the police\'s panel over the corner sign'); for (const u of o.under) if (hit(p, u)) bad.push('the police\'s panel over the column'); }
      if (o.pol.length && o.note) room.polSign = +(o.note.t - ext(o.pol).b).toFixed(1);
    } else {   // lying: both rows left of the corner sign
      room.note = o.note ? +(o.note.l - Math.max(o.r1.r, o.r2.r)).toFixed(1) : null;
      if (room.note == null || room.note < 3) bad.push(`the rows ${room.note} px from the corner sign`);
      if (o.ws) { room.ws = +(o.ws.l - o.colExt.r).toFixed(1); if (o.col.some(c => hit(c, o.ws))) bad.push('the column under ZAMENJAJ KOLO'); }
    }
    for (const c of o.col) {
      for (const k of o.ctl) if (hit(c, k)) bad.push('over #' + k.id);
      for (const [n, x] of [['the map', o.map], ['the pause button', o.pause], ['the corner sign', o.note]]) if (hit(c, x)) bad.push('over ' + n);
      if (o.clock.some(k => hit(k, c))) bad.push('over the clock');
    }
    const under = o.ctl.filter(k => k.l < o.colExt.r && k.r > o.colExt.l); room.ctl = under.length ? +(Math.min(...under.map(k => k.t)) - o.colExt.b).toFixed(1) : null;
    return { bad: [...new Set(bad)], room };
  }
  const RACE = { pos: '22', tot: '/22', lap: 'KROG 12/36', ty: true }, RACE_EN = { pos: '22', tot: '/22', lap: 'LAP 12/36', ty: true, en: true };
  const STATES = { port: [
    ['race, SEKTOR', Object.assign({ split: 'SEKTOR 2  1:05.123' }, RACE)], ['race, the fastest lap', Object.assign({ split: 'KROG 11: 02:13.456  ★' }, RACE)],
    ['race (en), SECTOR', Object.assign({ split: 'SECTOR 2  1:05.123' }, RACE_EN)], ['race (en), the fastest lap', Object.assign({ split: 'LAP 11: 02:13.456  ★' }, RACE_EN)],
    ['race, a long place\'s name', Object.assign({ split: LONG.sl, col: true }, RACE)], ['race (en), a long place\'s name', Object.assign({ split: LONG.en, col: true }, RACE_EN)],
    ['flying lap, SEKTOR', { pos: '–', tot: '', lap: 'LETEČI KROG', ty: true, split: 'SEKTOR 2  1:05.123' }], ['qualifying, REKORD', { pos: '–', tot: '', lap: 'KVALIFIKACIJE', ty: true, split: 'REKORD 01:23.456  -0.523' }], ['qualifying (en), RECORD', { pos: '–', tot: '', lap: 'QUALIFYING', ty: true, en: true, split: 'RECORD 01:23.456  -0.523' }],
    ['Nürburg', { pos: '22', tot: '/22', lap: 'KROG 1/1 · 12,3/20,7 KM', split: 'KROG 1: 06:13.456', flt: true }],
    ['time trial', { pos: '', tot: '', lap: 'CP 2/4', cls: ['tt', 'ttd', 'ttn'], tt: true, alt: '2.345 m', turn: 'OVINEK 123/156', split: LONG.sl }],
    ['the duel', { pos: '2', tot: '/2', lap: '2,4/12,3 KM', cls: ['up', 'duel'], gap: 'TEKMEC 12,4 s PRED TABO', split: LONG.sl }],
    ['the police', { pos: '3', tot: '', lap: '12,3/12,3 KM', cls: ['up'], pol: true, flt: true, alt: '1.611 m', split: LONG.sl }],
    ['the whole column', Object.assign({ col: true }, RACE)]],
  land: [
    ['race', Object.assign({ split: 'KROG 11: 02:13.456  NAJHITREJŠI' }, RACE)], ['race (en)', Object.assign({ split: 'LAP 11: 02:13.456  FASTEST' }, RACE_EN)],
    ['qualifying', { pos: '–', tot: '', lap: 'KVALIFIKACIJE', ty: true }], ['qualifying (en)', { pos: '–', tot: '', lap: 'QUALIFYING', ty: true, en: true }], ['flying lap', { pos: '–', tot: '', lap: 'LETEČI KROG', ty: true, split: 'SEKTOR 2  1:05.123' }],
    ['Nürburg', { pos: '22', tot: '/22', lap: 'KROG 1/1 · 12,3/20,7 KM' }], ['Nürburg (en)', { pos: '22', tot: '/22', lap: 'LAP 1/1 · 12.3/20.7 KM', en: true }],
    ['the police', { pos: '3', tot: '', lap: '12,3/12,3 KM', pol: true }], ['the whole column, ZAMENJAJ KOLO', Object.assign({ col: true }, RACE)]] };
  const all = [];
  await page.evaluate((s) => { window.__hudS0 = s; }, s0);
  for (const [w, h] of SIZES) {
    await page.setViewportSize({ width: w, height: h }); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const land = w > h;
    for (const m of ['buttons', 'wheel', 'tilt']) {
      await page.evaluate((m) => { Input.setMode(m); Input.layout(); }, m);
      for (const [name, st] of STATES[land ? 'land' : 'port']) {
        if (m !== 'buttons' && !/column|^race(, SEKTOR)?$|^race \(en\)$/.test(name)) continue;   // (the other steering modes: the rows and the whole column; the controls are below)
        const o = await page.evaluate(([put, meas, st]) => { (0, eval)(put)(st); return (0, eval)(meas)(); }, [PUT.toString(), MEASURE.toString(), st]);
        const r = wrong(o); all.push({ size: w + 'x' + h, m, name, bad: r.bad, room: r.room, mode: o.mode });
      }
    }
    await page.evaluate(() => Input.setMode('buttons'));
  }
  await page.evaluate(() => window.__game.noteAt(null));
  const port = all.filter(a => +a.size.split('x')[0] < +a.size.split('x')[1]), land = all.filter(a => !port.includes(a));
  const sum = (L) => L.filter(a => a.m === 'buttons').map(a => `${a.size} ${a.name}: ${Object.entries(a.room).filter(([, v]) => v != null).map(([k, v]) => k + ' ' + v).join(', ')}`).join(' | ');
  T.check(`upright (360x640, 390x844, 412x915), the worst texts in both languages: row 1 at least 3 px left of the clock's letters; the line under the clock under row 2 (a sector, the fastest lap with its star, the longest place names »${LONG.sl}« and »${LONG.en}« in two lines at most), at least 3 px from the map, over none of the corner sign, the clock or the column; the duel's gap and the police's panel under it, clear of the sign`,
    port.length > 0 && !!s0 && LONG.n > 100 && port.filter(a => a.m === 'buttons' && a.name !== 'the whole column').every(a => !a.bad.length) && port.filter(a => a.room.under != null).length >= 30,
    JSON.stringify(port.filter(a => a.bad.length)) + ' ' + sum(port));
  T.check('lying (640x360, 844x390, 915x412), the worst texts (qualifying with the tyres, Nürburg\'s long lap, a two-digit lap; the police: the sign further left): both rows at least 3 px left of the corner sign',
    land.filter(a => a.m === 'buttons' && !/column/.test(a.name)).every(a => !a.bad.length), JSON.stringify(land.filter(a => a.bad.length)) + ' ' + sum(land));
  T.check('the whole left column (the rows, DRS and ZAVETRJE, fuel, three faults, a flag) on screen, over none of the controls, the map, the pause button, the corner sign or the clock, with buttons, the wheel and tilting, upright and lying; lying left of ZAMENJAJ KOLO',
    all.filter(a => /column/.test(a.name)).length === 18 && all.filter(a => /column/.test(a.name)).every(a => !a.bad.length) && all.every(a => !a.bad.length),
    JSON.stringify(all.filter(a => a.bad.length)) + ' ' + all.filter(a => /column/.test(a.name)).map(a => `${a.size} ${a.m}: below ${a.room.ctl}${a.room.ws != null ? ', ZAMENJAJ KOLO ' + a.room.ws : ''}`).join(' | '));
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
