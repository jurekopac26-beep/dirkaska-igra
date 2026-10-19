// The weather forecast in the game (Menljivo vreme; the Red Bull Ring, an endurance race of 6 laps, the player on autopilot, the rain from 420 s):
// the HUD's cloud under the tyres with the laps to the rain (Race.forecast's range, "3–5 KR.") while it is on its way, gone once it rains;
// at the way in to a stop the engineer's forecast on the radio ("Napoved: Dež čez 2–3 kroge, verjetnost 70 %.", with the radio on; the
// engineer's voice line) and in the custom stop's panel, a line above the tyres, the same words; the panel with it laid out upright (the
// sheet at the bottom) and on its side (at the right): on the screen, over nothing else of the HUD, the line one line and not cut, every
// button 44 px tall and reached by a tap; the default tyres by the water on the line at the stop; in English ("Forecast: Rain in ...",
// "LAPS"); with the radio off the panel's line only. The forecast does not touch the race (Core only reads it: tests/forecast.test.js).
//   node tests/browser/forecast.test.mjs            (SHOTS=<folder>: a picture of the panel and of the HUD's cloud each way)
import path from 'node:path';
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the weather forecast (rbring)');
const SHOTS = process.env.SHOTS || '';
const RAIN_AT = 420;   // (after the second stop, before the race's last two laps: the third stop comes after it, whichever lap the first one is)
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', track: 'rbring', weather: 'change', radio: 1, damage: 0, length: 'endurance' }, { width: 360, height: 640 }, { context: { reducedMotion: 'reduce' } });
  const shot = (f) => page.screenshot({ path: f, timeout: 180000 });   // (SHOTS: software WebGL on a busy machine is slow to give a picture)
  const hide = () => page.evaluate(() => { const e = document.querySelector('.screen.show'); if (e) e.style.display = 'none'; });
  const lang = (l) => page.evaluate((l) => { const g = window.__game; g.pause(); g.onAction('to-settings'); document.querySelector(`[data-set="lang"] button[data-v="${l}"]`).click(); g.onAction('settings-done'); g.pause(); }, l);   // (as tests/browser/radio.test.mjs switches it; paused again)
  await page.evaluate((at) => { window.__game.wxNext = { rain: 0, wx: { at, dur: 30, to: 1 } };
    window.__fcV = []; const o = window.__game.comm.teamRadio; window.__game.comm.teamRadio = function (k, v) { window.__fcV.push({ k, v }); return o.apply(this, arguments); }; }, RAIN_AT);   // (the engineer's voice lines asked for)
  await startTrack(page, 'rbring');
  await page.evaluate(() => window.__game.pause()); await hide();
  // in the page: the HUD's cloud (shown, its text and label, its box), what Race.forecast says now, the HUD elements beside it
  const cloud = () => page.evaluate(() => {
    const g = window.__game, P = g.race.player, el = document.getElementById('h-fc'), f = g.race.forecast(P), r = el.getBoundingClientRect(), shown = (e) => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 1;
    const ids = ['speedo', 'h-dmg', 'btn-tyre', 'h-tyre', 'h-fuel', 'h-flt', 'h-flag', 'h-lap', 'h-pos', 'h-map', 'h-time', 'btn-pause', 'c-left', 'c-right', 'c-gas', 'c-brake', 'h-tower'];
    const box = (e) => { const q = e.getBoundingClientRect(); return { id: e.id, l: q.left, t: q.top, r: q.right, b: q.bottom }; };
    return { t: +g.race.time.toFixed(1), on: shown(el), text: el.textContent, label: el.getAttribute('aria-label'), f, box: box(el), w: innerWidth, h: innerHeight, others: ids.map(id => document.getElementById(id)).filter(shown).map(box), rain: g.race.rain };
  });
  const over = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;
  const cloudBad = (c) => { const b = []; if (c.box.l < -0.5 || c.box.t < -0.5 || c.box.r > c.w + 0.5 || c.box.b > c.h + 0.5) b.push('off the screen'); for (const o of c.others) if (over(c.box, o)) b.push('over ' + o.id); return b; };
  // in the page: on to the panel at the next way in (the autopilot asked for at the end of a lap), the race stepped; the panel's texts
  const toPanel = () => page.evaluate(() => {
    const g = window.__game, P = g.race.player, Tk = g.race.track; Render.scene.visible = false;
    for (let k = 0; k < 40000 && !g.pitStop.on; k++) {
      if (P.lap >= 1 && !P.inPit && !Tk.pitAt(P.q.s) && !P.pitWant && !g.pitAuto.st) P.pitWant = true;
      if (P.inPit || g.pitAuto.st) g.sim(1 / 60, false, 0, 0); else g.sim(0.1, true);
    }
    g.hud(0.05); Render.scene.visible = true;
    const el = document.getElementById('h-stop'), fc = el.querySelector('.sp-fc'), f = g.race.forecast(P);
    return { on: g.pitStop.on, t: +g.race.time.toFixed(1), lap: P.lap, fc: fc && fc.textContent, k: fc && fc.dataset.k, first: el.firstElementChild.nextElementSibling === fc && fc.nextElementSibling.dataset.r === 'ty',
      f, def: g.pitStop.def, line: g.race.lineWater, wet: Core.tyreFor(g.race.lineWater) === 'wet', radio: g.teamRadio.log.slice(), voice: window.__fcV.slice() };
  });
  // in the page: the panel laid out (as tests/browser/hudcol.test.mjs measures it): its box, the HUD beside it, the forecast line and the rows, each button
  const layout = () => page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = document.getElementById('h-stop'), fc = el.querySelector('.sp-fc'), sp = fc.querySelector('span'), row = el.querySelector('.sp-row'), R = (e) => { const r = e.getBoundingClientRect(); return { id: e.id, l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) }; };
    const shown = (e) => { if (!e || getComputedStyle(e).visibility !== 'visible') return false; for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || +c.opacity === 0) return false; } const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
    const ids = ['h-time', 'h-best', 'h-sec', 'h-split', 'btn-pause', 'btn-tyre', 'btn-rescue', 'speedo', 'h-pos', 'h-lap', 'h-tyre', 'h-fc', 'h-fuel', 'h-flt', 'h-flag', 'h-map', 'h-dmg', 'h-tower', 'h-note', 'h-lights'];
    const btns = [...el.querySelectorAll('button')].map(b => { const r = b.getBoundingClientRect(), at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { v: b.dataset.v || 'ok', h: +r.height.toFixed(1), top: !!at && (at === b || b.contains(at)) }; });
    res({ w: innerWidth, h: innerHeight, p: R(el), fc: R(fc), row: R(row), lh: parseFloat(getComputedStyle(fc).lineHeight) || 14, cut: sp.scrollWidth - sp.clientWidth, others: ids.map(id => document.getElementById(id)).filter(shown).map(R), btns });
  }))));
  const panelBad = (x, k) => {
    const b = [], p = x.p;
    if (p.l < -0.5 || p.t < -0.5 || p.r > x.w + 0.5 || p.b > x.h + 0.5) b.push('the panel off the screen');
    if (k === 'land' ? p.l < x.w * 0.5 : p.t < x.h * 0.45) b.push('the panel over the middle');
    for (const o of x.others) if (over(p, o)) b.push('the panel over ' + o.id);
    if (x.fc.b - x.fc.t > x.lh * 1.6 + 2) b.push('the forecast line in two'); if (x.cut > 1) b.push('the forecast line cut'); if (x.fc.b > x.row.t + 0.5) b.push('the forecast line not above the tyres');
    for (const q of x.btns) { if (q.h < 44) b.push(q.v + ' under 44 px'); if (!q.top) b.push(q.v + ' under something'); }
    return b;
  };
  // the panel measured (and pictured) as the running game lays the HUD out (hudCol: not on the pause screen), the race held meanwhile (as
  // tests/browser/hudcol.test.mjs holds it)
  const held = async (fn) => { await page.evaluate(() => { const g = window.__game, r = g.race; r.__step = r.step; r.step = function () { }; g.resume(); }); await page.waitForTimeout(400);
    try { return await fn(); } finally { await page.evaluate(() => { const g = window.__game, r = g.race; r.step = r.__step; delete r.__step; g.pause(); }); await hide(); } };
  const turn = async (w, h) => { await page.setViewportSize({ width: w, height: h }); await page.evaluate(() => { window.__game.S.camera = 'chase'; window.__game.hud(0.05); }); await page.waitForTimeout(150); };
  // a stop at the box: on to the hand-back (the defaults at the box), paused
  const toOut = () => page.evaluate(() => { const g = window.__game, P = g.race.player; Render.scene.visible = false; for (let k = 0; k < 30000 && g.pitAuto.st; k++) g.sim(1 / 60, false, 0, 0); g.hud(0.05); Render.scene.visible = true; return { st: g.pitAuto.st, lap: P.lap, t: g.race.time }; });
  const RAIN_SL = /^Dež (čez (\d+)–(\d+) (kroga|kroge|krogov)|v manj kot krogu), verjetnost (\d+) %\.$/;
  const want = (f) => f.hi <= 1 ? 'v manj kot krogu' : `čez ${f.lo}–${f.hi} ${f.hi % 100 === 2 ? 'kroga' : f.hi % 100 === 3 || f.hi % 100 === 4 ? 'kroge' : 'krogov'}`;

  // 1. the start: the cloud under the tyres with the laps to the rain (the forecast's range), over nothing else of the HUD
  await page.evaluate(() => { const g = window.__game; for (let k = 0; k < 800 && g.phase !== 'racing'; k++) g.sim(0.05, true); g.sim(4, true); g.hud(0.05); });
  const c0 = await cloud();
  T.check('the start: the HUD\'s cloud under the tyres with the laps to the rain ("3–5 KR.": the forecast\'s range), its label the forecast\'s words; over nothing else of the HUD',
    c0.on && c0.f && c0.f.k === 'rain' && c0.f.lo >= 1 && c0.text === `${c0.f.lo}–${c0.f.hi} KR.` && c0.label === `Dež ${want(c0.f)}, verjetnost ${c0.f.p} %.` && !cloudBad(c0).length, JSON.stringify({ c0, bad: cloudBad(c0) }));
  if (SHOTS) await held(() => shot(path.join(SHOTS, 'fc-hud-port.png')));
  await turn(640, 360); const c0l = await cloud();
  T.check('on its side: the cloud shown, over nothing else of the HUD', c0l.on && !cloudBad(c0l).length, JSON.stringify({ box: c0l.box, bad: cloudBad(c0l) }));
  if (SHOTS) await held(() => shot(path.join(SHOTS, 'fc-hud-land.png')));
  await turn(360, 640);

  // 2. the first stop: the forecast in the panel above the tyres and on the radio, the same words; the panel laid out both ways
  const s1 = await toPanel();
  const m1 = RAIN_SL.exec(s1.fc || ''), r1 = s1.radio.filter(x => /^Napoved: /.test(x));
  T.check('the first way in: the panel\'s line above the tyres, "Dež čez 2–3 kroge, verjetnost 70 %." (the forecast\'s range and chance)',
    s1.on && s1.k === 'rain' && s1.first && !!m1 && s1.f.k === 'rain' && s1.fc === `Dež ${want(s1.f)}, verjetnost ${s1.f.p} %.` && s1.f.lo <= s1.f.n && s1.f.n <= s1.f.hi, JSON.stringify(s1));
  T.check('... and on the radio, the same words ("Napoved: ..."), once; the engineer\'s voice line with the laps in English', r1.length === 1 && r1[0] === 'Napoved: ' + s1.fc && s1.voice.filter(v => v.k === 'radioFcRain').length === 1
    && /^(within a lap|in \d+ to \d+ laps)$/.test(s1.voice.find(v => v.k === 'radioFcRain').v.when) && s1.voice.find(v => v.k === 'radioFcRain').v.p === s1.f.p, JSON.stringify({ r1, voice: s1.voice }));
  T.check('the default tyres by the water on the racing line at the stop (dry: soft slicks)', s1.def.ty === (s1.wet ? 'W' : 'S') && !s1.wet, JSON.stringify({ def: s1.def, line: s1.line }));
  const L = {};
  for (const [k, w, h] of [['port', 360, 640], ['land', 640, 360]]) { await turn(w, h); L[k] = await held(async () => { const x = await layout(); if (SHOTS) await shot(path.join(SHOTS, `fc-panel-sl-${k}.png`)); return x; }); }
  T.check('the panel with the forecast upright (the sheet at the bottom) and on its side (at the right): on the screen, over nothing else of the HUD, the line one line above the tyres and not cut, every button 44 px tall and reached by a tap',
    ['port', 'land'].every(k => !panelBad(L[k], k).length), JSON.stringify({ port: panelBad(L.port, 'port'), land: panelBad(L.land, 'land'), pp: L.port.p, pl: L.land.p, fc: L.land.fc, cut: [L.port.cut, L.land.cut] }));
  await turn(360, 640);
  await toOut();

  // 3. in English: the cloud's laps, the second stop's line and the radio (still before the rain)
  await lang('en'); await hide();
  await page.evaluate(() => { const g = window.__game; g.sim(1, true); g.hud(0.05); });
  const c1 = await cloud();
  T.check('in English: the cloud\'s laps ("1–2 LAPS", "< 1 LAP")', c1.on && c1.f.k === 'rain' && c1.text === (c1.f.hi <= 1 ? '< 1 LAP' : `${c1.f.lo}–${c1.f.hi} LAPS`), JSON.stringify(c1));
  const s2 = await toPanel(), r2 = s2.radio.filter(x => /^Forecast: /.test(x));
  const en = (f) => f.hi <= 1 ? `Rain within a lap, ${f.p} % chance.` : `Rain in ${f.lo}–${f.hi} laps, ${f.p} % chance.`;
  T.check('in English, the second way in: "Rain in 1–2 laps, 85 % chance." above the tyres and on the radio ("Forecast: ...")', s2.on && s2.f.k === 'rain' && s2.fc === en(s2.f) && r2.length === 1 && r2[0] === 'Forecast: ' + s2.fc, JSON.stringify({ s2, r2 }));
  if (SHOTS) { await turn(640, 360); await held(() => shot(path.join(SHOTS, 'fc-panel-en-land.png'))); await turn(360, 640); }
  await toOut();

  // 4. the radio off; on until it rains: the cloud gone; the next stop: "Rain to the finish." in the panel only, the default tyres by the line
  await page.evaluate(() => { window.__game.S.radio = 0; });
  await page.evaluate((at) => { const g = window.__game; for (let k = 0; k < 400 && g.race.time < at + 2; k++) g.sim(0.5, true); g.hud(0.05); }, RAIN_AT);
  const c2 = await cloud();
  T.check('it rains: the cloud gone (the forecast: rain to the finish)', !c2.on && c2.rain > 0 && c2.f.k === 'wet', JSON.stringify(c2));
  const n2 = (await page.evaluate(() => window.__game.teamRadio.log.length)), s3 = await toPanel();
  T.check('the radio off, the next way in: "Rain to the finish." above the tyres, nothing on the radio; the default tyres by the water on the line (rain tyres on a wet one)',
    s3.on && s3.k === 'wet' && s3.fc === 'Rain to the finish.' && s3.radio.length === n2 && !s3.radio.some(x => /^Forecast: Rain to/.test(x)) && s3.def.ty === (s3.wet ? 'W' : 'S'), JSON.stringify({ s3, n2 }));
  await toOut();
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
