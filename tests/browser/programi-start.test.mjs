// Zatikanje na startu (docs/zatikanje-start.md): od zelene luči do cilja se število programov senčilnikov (renderer.info.programs) ne spremeni:
// nov senčilnik sredi dirke = prevajanje = zatikanje. Jezero, Toskana in Spa; povprečje: igra v pavzi, korak za korakom, vsaka sličica narisana.
//   node tests/browser/programi-start.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('programi senčilnikov med dirko');
const srv = await serve();
const browser = await launch();
try {
  for (const id of ['jezero', 'toskana', 'spa']) {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', rivals: 8, track: id }, { width: 480, height: 270 }, { seed: 12345 });
    try {
      await startTrack(page, id);
      const r = await page.evaluate(async () => {
        const g = window.__game, n = () => Render.info().programs.length, wait = (ms) => new Promise(q => setTimeout(q, ms));
        g.autoDrive = true; g.onAction('restart'); g.pause();
        for (let k = 0; k < 3600 && g.race.state !== 'racing'; k++) { g.sim(1 / 60, true); if (k % 6 === 0) { Render.frame(1 / 60, 1, g.race.player, g.S.camera, {}); await wait(0); } }
        const out = { green: g.race.state === 'racing', p0: n(), min: n(), max: n(), nov: [], frames: 0, t: 0, done: false };
        for (let k = 0; k < 4000; k++) {
          g.sim(0.25, true); Render.frame(0.25, 1, g.race.player, g.S.camera, {}); out.frames++;
          const p = n(); out.min = Math.min(out.min, p); out.max = Math.max(out.max, p); if (p !== out.p0 && out.nov.length < 5) out.nov.push([+g.race.time.toFixed(1), p]);
          if (g.phase === 'done' || g.race.player.finished) { out.done = true; break; }
          if (k % 8 === 0) await wait(0);
        }
        out.t = +g.race.time.toFixed(0); return out;
      });
      T.check(`${id}: od zelene luči do cilja ${r.p0} programov, nič novih (${r.frames} sličic, ${r.t} s)`, r.green && r.p0 > 0 && r.done && r.min === r.p0 && r.max === r.p0, JSON.stringify({ p0: r.p0, min: r.min, max: r.max, nov: r.nov, done: r.done }));
      T.check(`${id}: brez napak v konzoli`, errors.length === 0, errors.slice(0, 2).join(' | '));
    } finally { await ctx.close(); }
  }
} finally { await browser.close(); srv.close(); }
T.done();
