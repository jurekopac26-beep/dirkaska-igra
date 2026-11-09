// The co-driver on the real open roads (docs/sovoznik.md): Rio do Rastro's run on the autopilot, on a phone lying (the game in Slovenian; 640×360,
// then 915×412) and upright (in English): the calls of the road (Track.paceNotes), each one's caption (#h-codrv) in the game's language as
// Core.codrvCap writes it, shown ahead of the bend (game.js cdLead: 55-170 m) and gone after it, over nothing of the HUD (the clock's
// block, the map, the corner sign, the buttons, the controls) and inside the screen, the corner sign where it was without the caption, with
// the bend's grade (1-6) on it; the longest caption a call has (every note: upright in two or three lines) the same; the voice on a road
// too (Glas in napis, the default): lying, with the sound on, every call said from the recorded sheet (js/data/sovoznik-en.js, Comm.note;
// not by the browser's speechSynthesis), ahead of the bend by the call's length (game.js cdLead: 60-260 m), Ouninpohja's the same. The switch in the settings (Sovoznik: Izklop, Napis, Glas in napis): off, no calls
// and no numbers on the sign; switched on during the race, the calls from there on; the captions only, a rally stage without the voice; the
// voice on a rally stage as before. The calls themselves (and none on a circuit): tests/sovoznik.test.js.
//   node tests/browser/sovoznik.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('sovoznik');
const srv = await serve();
const browser = await launch(['--autoplay-policy=no-user-gesture-required']);   // (the game's audio running without a tap: the recorded voice)
const OTHERS = ['h-time', 'h-best', 'h-sec', 'h-split', 'h-gap', 'h-map', 'h-prof', 'h-note', 'h-wreck', 'h-tower', 'h-teamradio', 'h-pit', 'h-react', 'h-msg', 'h-ttsp', 'toast',
  'btn-pause', 'btn-rescue', 'h-main', 'h-pos', 'h-tot', 'h-speed', 'h-lap', 'h-tyre', 'h-tags', 'h-alt', 'h-turn', 'h-fuel', 'h-flt', 'h-flag', 'c-left', 'c-right', 'c-wheel', 'c-brake', 'c-gas'];

// the run on the autopilot for `sec` seconds of game time, a frame drawn after every 0.2 s (a caption stays 1.5 s at least): what the
// co-driver showed, frame by frame (o.long: the words of the next two calls for this run, Track.paceNotes' own, as the game reads them;
// o.stop: done once no caption is on after so many shown, so many grades on the sign, a caption so long)
const LONG = ['caution', 'hairpin', 'L', 'and', 'hairpin', 'R', 'and', 'hairpin', 'L', 'd150'];   // ('CAUTION · HAIRPIN L › HAIRPIN R › HAIRPIN L')
const drive = (page, sec, opt = {}) => page.evaluate(async ([OTHERS, sec, long, st]) => {
  const g = window.__game, $ = (id) => document.getElementById(id), fr = () => new Promise(r => requestAnimationFrame(() => r()));
  const box = (e) => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e); return cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity <= 0.05 || !b.width || !b.height ? null : b; };
  const ov = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
  await document.fonts.load('italic 700 16px ApexMenu', 'AZ09ČŠŽ›·');
  for (let i = 0; i < 200 && g.phase !== 'racing'; i++) { g.sim(0.2, true); await fr(); }
  const N = g.race.track.paceNotes(), lang = g.S.lang, el = $('h-codrv'), note = $('h-note'), num = $('h-note-num');
  const o = { calls: g.codrv.calls, voice: g.codrv.voice, shown: [], wrong: [], hits: new Set(), out: [], gone: 0, nums: new Set(), pos: { cap: new Set(), free: new Set() }, lines: 0 };
  const keep = long ? N.slice(g.codrv.k, g.codrv.k + 2).map(c => [c, c.toks]) : [];
  for (const [c] of keep) c.toks = long.slice();
  let was = '';
  for (let i = 0; i < sec * 5 && g.phase === 'racing'; i++) {
    g.sim(0.2, true); await fr();
    const cap = g.codrv.cap, b = box(el);
    if (cap) {
      const L = g.codrv.log, last = L[L.length - 1], want = Core.codrvCap(N[last.k].toks, lang);
      if (cap !== was) { o.shown.push(cap); if (cap !== want || last.cap !== cap || el.textContent !== cap || !/\bshow\b/.test(el.className)) o.wrong.push(`"${cap}" not "${want}"`); }
      if (b) {
        o.lines = Math.max(o.lines, Math.round((b.height - 3) / parseFloat(getComputedStyle(el).lineHeight)));
        for (const id of OTHERS) { const e = $(id), x = e && box(e); if (x && ov(b, x)) o.hits.add(id); }
        if (b.left < 0 || b.right > innerWidth || b.top < 0) o.out.push(cap);
      }
    } else if (was) o.gone++;
    if (/\bshow\b/.test(note.className)) { if (num.textContent) o.nums.add(num.textContent); o.pos[cap ? 'cap' : 'free'].add(note.offsetLeft + ',' + note.offsetTop); }
    was = cap;
    if (st && !cap && o.shown.length >= (st.shown || 0) && o.nums.size >= (st.nums || 0) && (!st.long || o.shown.some(x => x.length >= st.long))) break;
  }
  for (const [c, t] of keep) c.toks = t;
  // (rec: each call said from the sheet; spk: the lines the browser's voice was given, its unlock's blank one aside)
  return Object.assign(o, { hits: [...o.hits], nums: [...o.nums], pos: { cap: [...o.pos.cap], free: [...o.pos.free] }, d: g.codrv.log.map(x => x.d), rec: g.codrv.log.map(x => !!x.rec),
    spk: (window.__spk || []).filter(t => t && t.trim()), s: Math.round(g.race.player.q.s - g.race.track.startS) });
}, [OTHERS, sec, opt.long || null, opt.stop || null]);

const seg = (page, v) => page.evaluate((v) => { document.querySelector(`[data-set="codrv"] [data-v="${v}"]`).click(); return window.__game.S.codrv; }, v);
const now = (page) => page.evaluate(async () => { const g = window.__game; for (let i = 0; i < 200 && g.phase !== 'racing'; i++) { g.sim(0.2, true); await new Promise(r => requestAnimationFrame(r)); } return { calls: g.codrv.calls, voice: g.codrv.voice }; });

try {
  for (const [w, h, lang] of [[640, 360, 'sl'], [360, 640, 'en']]) {
    // (lying, in Slovenian: the sound on, the voice heard; the browser's speechSynthesis watched)
    const spy = () => { window.__spk = []; const s = window.speechSynthesis; if (s) { const o = s.speak.bind(s); s.speak = (u) => { window.__spk.push(u.text); return o(u); }; } };
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { lang, damage: 0, sound: lang === 'sl' ? 1 : 0 }, { width: w, height: h }, { touch: true, init: spy });
    const tag = `${w}×${h} (${lang})`, t0 = Date.now();
    if (lang === 'sl') {
      const row = await page.evaluate(() => [...document.querySelectorAll('[data-set="codrv"] button')].map(b => b.dataset.v + ':' + b.textContent).join(' | '));
      T.check('the switch in the settings: Sovoznik off, the captions, the voice and the captions', row === '0:Izklop | 2:Napis | 1:Glas in napis', row);
    }
    await startTrack(page, 'rastro', 'tt');
    const r = await drive(page, lang === 'sl' ? 40 : 30, { stop: { shown: 4, nums: 2 } });
    // (ahead of the bend: heard, by the call's length, 60-260 m, later only when the call before is still being said; the captions alone,
    // 2.4 s at the speed and 30 m, 55-170 m)
    const heard = lang === 'sl', lead = r.d.slice(1).every(d => heard ? d >= 20 && d <= 262 : d >= 40 && d <= 175), keep = r.pos.cap.every(p => r.pos.free.includes(p));
    T.check(`${tag} Rio do Rastro: the road's calls, captions in the game's language ahead of the bends and gone after them, the voice on`,
      r.calls > 10 && r.voice && r.shown.length >= 3 && !r.wrong.length && r.gone >= 2 && lead,
      `${r.calls} calls, voice ${r.voice}, ${r.shown.length} shown to ${r.s} m (${r.shown.slice(0, 4).map(x => '"' + x + '"').join(' ')}), ${r.gone} gone, ahead ${r.d.join(' ')} m${r.wrong.length ? ', wrong: ' + r.wrong.join(', ') : ''}`);
    if (heard) T.check(`${tag} Rio do Rastro: every call said in the recorded voice (the sheet, js/data/sovoznik-en.js), none by the browser's voice`,
      r.rec.length >= 3 && r.rec.every(Boolean) && !r.spk.length, `${r.rec.filter(Boolean).length} of ${r.rec.length} from the sheet${r.spk.length ? ', the browser\'s voice: ' + r.spk.slice(0, 3).map(x => '"' + x + '"').join(' ') : ''}`);
    T.check(`${tag} Rio do Rastro: the caption over nothing of the HUD, inside the screen; the corner sign where it was, with the bend's grade on it`,
      !r.hits.length && !r.out.length && keep && r.pos.free.length > 0 && r.nums.length > 0 && r.nums.every(x => /^[1-6]$/.test(x)),
      `over ${r.hits.join(' ') || 'nothing'}${r.out.length ? ', outside: ' + r.out.join(', ') : ''}; the sign at ${r.pos.free.join(' ')}, with a caption ${r.pos.cap.join(' ') || '-'}; numbers ${r.nums.join(' ')}`);
    // the longest caption a call has (every note of it; Core.codrvCap, tests/sovoznik.test.js: CD_MAX2): the next two calls with its words
    const rl = await drive(page, 30, { long: LONG, stop: { long: 40 } }), big = rl.shown.filter(x => x.length >= 40);
    T.check(`${tag} Rio do Rastro: the longest caption (every note of the call; upright in more lines) over nothing of the HUD, inside the screen`,
      big.length > 0 && !rl.wrong.length && !rl.hits.length && !rl.out.length,
      `${big.map(x => '"' + x + '"').join(' ') || 'none of ' + rl.shown.length + ' shown'} in ${rl.lines} line(s), over ${rl.hits.join(' ') || 'nothing'}${rl.out.length ? ', outside: ' + rl.out.join(', ') : ''}${rl.wrong.length ? ', wrong: ' + rl.wrong.join(', ') : ''}`);
    if (lang === 'sl') {
      // a wider phone lying (915×412), the same run on: the caption again over nothing (under the clock's block; a wide one under the sign too)
      await page.setViewportSize({ width: 915, height: 412 });
      const r2 = await drive(page, 24, { stop: { shown: 2 } });
      T.check('915×412 (sl) Rio do Rastro: the caption over nothing of the HUD, inside the screen',
        r2.shown.length >= 2 && !r2.wrong.length && !r2.hits.length && !r2.out.length,
        `${r2.shown.length} shown (${r2.shown.map(x => '"' + x + '"').join(' ')}), over ${r2.hits.join(' ') || 'nothing'}${r2.out.length ? ', outside: ' + r2.out.join(', ') : ''}${r2.wrong.length ? ', wrong: ' + r2.wrong.join(', ') : ''}`);
      // a rally stage: the same voice, the same sheet
      await startTrack(page, 'ouninpohja');
      const ro = await drive(page, 30, { stop: { shown: 2 } });
      T.check('915×412 (sl) Ouninpohja: the calls said in the recorded voice, none by the browser\'s voice',
        ro.voice && ro.rec.length >= 2 && ro.rec.every(Boolean) && !ro.spk.length && !ro.wrong.length,
        `${ro.rec.filter(Boolean).length} of ${ro.rec.length} from the sheet, ahead ${ro.d.join(' ')} m${ro.spk.length ? ', the browser\'s voice: ' + ro.spk.slice(0, 3).map(x => '"' + x + '"').join(' ') : ''}${ro.wrong.length ? ', wrong: ' + ro.wrong.join(', ') : ''}`);
    }
    if (errors.length) T.check(`${tag}: no errors on the page`, false, errors.slice(0, 3).join(' | '));
    if (lang === 'en') {
      // the switch: off on a road (no calls, no numbers on the sign), the captions alone on a rally stage, the voice there as before (the
      // stage again: Ponovi; a circuit has no co-driver: Core.codrvRoad, tests/sovoznik.test.js)
      const v0 = await seg(page, '0'); await startTrack(page, 'rastro', 'tt');
      const off = await drive(page, 12);
      T.check('Sovoznik off: no calls on a road, no caption, no number on the corner sign',
        v0 === 0 && off.calls === 0 && !off.shown.length && !off.nums.length && off.pos.free.length > 0, `S.codrv ${v0}, ${off.calls} calls, ${off.shown.length} captions, numbers "${off.nums.join(' ')}", the sign shown ${off.pos.free.length}×`);
      const vm = await seg(page, '2'), mid = await drive(page, 30, { stop: { shown: 1, nums: 1 } });   // (switched on during the race: the settings in the pause)
      T.check('Sovoznik switched on during the race (Napis): the calls from there on, their captions and the grades on the sign',
        vm === 2 && mid.calls > 10 && !mid.voice && mid.shown.length >= 1 && !mid.wrong.length && mid.nums.length > 0,
        `S.codrv ${vm}, ${mid.calls} calls, voice ${mid.voice}, ${mid.shown.length} shown (${mid.shown.map(x => '"' + x + '"').join(' ')}), numbers ${mid.nums.join(' ') || '-'}${mid.wrong.length ? ', wrong: ' + mid.wrong.join(', ') : ''}`);
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
