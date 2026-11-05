// The co-driver on the real open roads (docs/sovoznik.md): Vršič's run on the autopilot, on a phone lying (the game in Slovenian; 640×360,
// then 915×412) and upright (in English): the calls of the road (Track.paceNotes), each one's caption (#h-codrv) in the game's language as
// Core.codrvCap writes it, shown ahead of the bend (game.js cdLead: 55-170 m) and gone after it, over nothing of the HUD (the clock's
// block, the map, the corner sign, the buttons, the controls) and inside the screen, the corner sign where it was without the caption, with
// the bend's grade (1-6) on it; no voice on a road (the voice: after the user's answer, sovoznik-glas). The switch in the settings
// (Sovoznik: Izklop, Napis, Glas in napis): off, no calls and no numbers on the sign; the captions only, a rally stage without the voice;
// the voice on a rally stage as before. The calls themselves (and none on a circuit): tests/sovoznik.test.js.
//   node tests/browser/sovoznik.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('sovoznik');
const srv = await serve();
const browser = await launch();
const OTHERS = ['h-time', 'h-best', 'h-sec', 'h-split', 'h-gap', 'h-map', 'h-prof', 'h-note', 'h-wreck', 'h-tower', 'h-teamradio', 'h-pit', 'h-react', 'h-msg', 'h-ttsp', 'toast',
  'btn-pause', 'btn-rescue', 'h-main', 'h-pos', 'h-tot', 'h-speed', 'h-lap', 'h-tyre', 'h-tags', 'h-alt', 'h-turn', 'h-fuel', 'h-flt', 'h-flag', 'c-left', 'c-right', 'c-wheel', 'c-brake', 'c-gas'];

// the run on the autopilot for `sec` seconds of game time, a frame drawn after every 0.2 s (a caption stays 1.5 s at least): what the
// co-driver showed, frame by frame
const drive = (page, sec) => page.evaluate(async ([OTHERS, sec]) => {
  const g = window.__game, $ = (id) => document.getElementById(id), fr = () => new Promise(r => requestAnimationFrame(() => r()));
  const box = (e) => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); return cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity <= 0.05 || !b.width || !b.height ? null : b; };
  const ov = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
  await document.fonts.load('italic 700 16px ApexMenu', 'AZ09ČŠŽ›·');
  for (let i = 0; i < 200 && g.phase !== 'racing'; i++) { g.sim(0.2, true); await fr(); }
  const N = g.race.track.paceNotes(), lang = g.S.lang, el = $('h-codrv'), note = $('h-note'), num = $('h-note-num');
  const o = { calls: g.codrv.calls, voice: g.codrv.voice, shown: [], wrong: [], hits: new Set(), out: [], gone: 0, nums: new Set(), pos: { cap: new Set(), free: new Set() } };
  let was = '';
  for (let i = 0; i < sec * 5 && g.phase === 'racing'; i++) {
    g.sim(0.2, true); await fr();
    const cap = g.codrv.cap, b = box(el);
    if (cap) {
      const L = g.codrv.log, last = L[L.length - 1], want = Core.codrvCap(N[last.k].toks, lang);
      if (cap !== was) { o.shown.push(cap); if (cap !== want || last.cap !== cap || el.textContent !== cap || !/\bshow\b/.test(el.className)) o.wrong.push(`"${cap}" not "${want}"`); }
      if (b) {
        for (const id of OTHERS) { const e = $(id), x = e && box(e); if (x && ov(b, x)) o.hits.add(id); }
        if (b.left < 0 || b.right > innerWidth || b.top < 0) o.out.push(cap);
      }
    } else if (was) o.gone++;
    if (/\bshow\b/.test(note.className)) { if (num.textContent) o.nums.add(num.textContent); o.pos[cap ? 'cap' : 'free'].add(note.offsetLeft + ',' + note.offsetTop); }
    was = cap;
  }
  return Object.assign(o, { hits: [...o.hits], nums: [...o.nums], pos: { cap: [...o.pos.cap], free: [...o.pos.free] }, d: g.codrv.log.map(x => x.d), s: Math.round(g.race.player.q.s - g.race.track.startS) });
}, [OTHERS, sec]);

const seg = (page, v) => page.evaluate((v) => { document.querySelector(`[data-set="codrv"] [data-v="${v}"]`).click(); return window.__game.S.codrv; }, v);
const now = (page) => page.evaluate(async () => { const g = window.__game; for (let i = 0; i < 200 && g.phase !== 'racing'; i++) { g.sim(0.2, true); await new Promise(r => requestAnimationFrame(r)); } return { calls: g.codrv.calls, voice: g.codrv.voice }; });

try {
  for (const [w, h, lang] of [[640, 360, 'sl'], [360, 640, 'en']]) {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { lang, damage: 0 }, { width: w, height: h }, { touch: true });
    const tag = `${w}×${h} (${lang})`, t0 = Date.now();
    if (lang === 'sl') {
      const row = await page.evaluate(() => [...document.querySelectorAll('[data-set="codrv"] button')].map(b => b.dataset.v + ':' + b.textContent).join(' | '));
      T.check('the switch in the settings: Sovoznik off, the captions, the voice and the captions', row === '0:Izklop | 2:Napis | 1:Glas in napis', row);
    }
    await startTrack(page, 'vrsic', 'tt');
    const r = await drive(page, lang === 'sl' ? 40 : 30);
    const lead = r.d.slice(1).every(d => d >= 40 && d <= 175), keep = r.pos.cap.every(p => r.pos.free.includes(p));
    T.check(`${tag} Vršič: the road's calls, captions in the game's language ahead of the bends and gone after them, no voice yet`,
      r.calls > 20 && !r.voice && r.shown.length >= 3 && !r.wrong.length && r.gone >= 2 && lead,
      `${r.calls} calls, voice ${r.voice}, ${r.shown.length} shown to ${r.s} m (${r.shown.slice(0, 4).map(x => '"' + x + '"').join(' ')}), ${r.gone} gone, ahead ${r.d.join(' ')} m${r.wrong.length ? ', wrong: ' + r.wrong.join(', ') : ''}`);
    T.check(`${tag} Vršič: the caption over nothing of the HUD, inside the screen; the corner sign where it was, with the bend's grade on it`,
      !r.hits.length && !r.out.length && keep && r.pos.free.length > 0 && r.nums.length > 0 && r.nums.every(x => /^[1-6]$/.test(x)),
      `over ${r.hits.join(' ') || 'nothing'}${r.out.length ? ', outside: ' + r.out.join(', ') : ''}; the sign at ${r.pos.free.join(' ')}, with a caption ${r.pos.cap.join(' ') || '-'}; numbers ${r.nums.join(' ')}`);
    if (lang === 'sl') {
      // a wider phone lying (915×412), the same run on: the caption again over nothing (under the clock's block; a wide one under the sign too)
      await page.setViewportSize({ width: 915, height: 412 });
      const r2 = await drive(page, 24);
      T.check('915×412 (sl) Vršič: the caption over nothing of the HUD, inside the screen',
        r2.shown.length >= 2 && !r2.wrong.length && !r2.hits.length && !r2.out.length,
        `${r2.shown.length} shown (${r2.shown.map(x => '"' + x + '"').join(' ')}), over ${r2.hits.join(' ') || 'nothing'}${r2.out.length ? ', outside: ' + r2.out.join(', ') : ''}${r2.wrong.length ? ', wrong: ' + r2.wrong.join(', ') : ''}`);
    }
    if (errors.length) T.check(`${tag}: no errors on the page`, false, errors.slice(0, 3).join(' | '));
    if (lang === 'en') {
      // the switch: off on a road (no calls, no numbers on the sign), the captions alone on a rally stage, the voice there as before (the
      // stage again: Ponovi; a circuit has no co-driver: Core.codrvRoad, tests/sovoznik.test.js)
      const v0 = await seg(page, '0'); await startTrack(page, 'vrsic', 'tt');
      const off = await drive(page, 12);
      T.check('Sovoznik off: no calls on a road, no caption, no number on the corner sign',
        v0 === 0 && off.calls === 0 && !off.shown.length && !off.nums.length && off.pos.free.length > 0, `S.codrv ${v0}, ${off.calls} calls, ${off.shown.length} captions, numbers "${off.nums.join(' ')}", the sign shown ${off.pos.free.length}×`);
      const v2 = await seg(page, '2'); await startTrack(page, 'ouninpohja'); const cap = await now(page);
      const v1 = await seg(page, '1'), r0 = await page.evaluate(() => { const g = window.__game, r = g.race; g.onAction('restart'); return r !== g.race; }), voice = await now(page);
      T.check('Sovoznik Napis: a rally stage\'s calls without the voice; Glas in napis: with it, as before',
        v2 === 2 && cap.calls > 20 && !cap.voice && v1 === 1 && r0 && voice.calls > 20 && voice.voice,
        `Napis: ${cap.calls} calls, voice ${cap.voice}; Glas in napis (the stage again: ${r0}): ${voice.calls} calls, voice ${voice.voice}`);
      if (errors.length) T.check(`${tag}: no errors on the page after the switch`, false, errors.slice(0, 3).join(' | '));
    }
    await ctx.close();
    console.log(`     ${tag}: ${Math.round((Date.now() - t0) / 1000)} s`);
  }
} catch (e) {
  T.check('the test ran', false, e && e.stack || String(e));
} finally {
  await browser.close(); await srv.close();
}
T.done();
