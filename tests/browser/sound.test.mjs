// The crowd's sound and a tunnel's ring (Monaco, the player on autopilot, the sound on): every circuit's world knows where its crowds are
// (World.build: crowdPts, from the spectators and the grandstands); the crowd louder near them; in the tunnel under the hotel the engine
// rings off its walls (a short reverb), outside it not. The police radio (Vršič, the run from the police): static under its lines only.
//   node tests/browser/sound.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('crowd and tunnel sound');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'iso', track: 'monaco', sound: 1 }, { width: 844, height: 390 });
  // 1. the crowds of every circuit's world (not an open road: its fans have their own sound)
  const pts = await page.evaluate(() => ['jezero', 'gozd', 'spa', 'rbring', 'suzuka', 'pikes', 'monaco'].map(id => { const W = Render.buildWorld(new Core.Track(Core.TRACKS.find(d => d.id === id)), 1); return [id, W.crowdPts ? W.crowdPts.length / 3 : 0]; }));   // (Monaco's last: the race below is there)
  T.check('every circuit\'s world: where its crowds are (dozens of places), none on an open road', pts.every(([id, n]) => id === 'pikes' ? n === 0 : n >= 30), pts.map(p => p.join(' ')).join(', '));

  // 2. a race at Monaco with the sound on: the crowd's level, the tunnel's ring inside the tunnel only
  await page.evaluate(() => Sfx.resume());
  await startTrack(page, 'monaco');
  const ready = await page.evaluate(() => Sfx.ready);
  if (!ready) T.check('sound running in this browser (skipped: no audio here)', true, 'AudioContext not running');
  else {
    // a few seconds on (the sound's own frames: two drawn, then paused where the car is, and the sound given a moment to settle); finer
    // steps near the tunnel, on until past it (a slow software-drawn frame can take a good part of a second)
    const step = (t) => page.evaluate((t) => new Promise(res => { const g = window.__game; g.pause(); g.sim(t, true); g.resume();
      requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); setTimeout(() => { const P = g.race.player, tn = Render.world.dyn.tunnel;
        res({ s: P.q.s, s0: tn.s0, s1: tn.s1, inT: P.q.s > tn.s0 && P.q.s < tn.s1, lv: Sfx.levels() }); }, 300); })); }), t);
    const samples = [];
    for (let k = 0, x = null; k < 45 && !(x && x.s > x.s1 + 120); k++) samples.push(x = await step(x && x.s > x.s0 - 400 ? 1.5 : 3));
    const inside = samples.filter(x => x.inT), outside = samples.filter(x => x.s < x.s0 - 10 || x.s > x.s1 + 10);   // (its mouths: a few metres either way)
    T.check('the tunnel rings while the car is in it, and only then', inside.length >= 2 && inside.every(x => x.lv.tunnel > 0.5) && outside.every(x => x.lv.tunnel < 0.2), JSON.stringify(samples.map(x => [Math.round(x.s), +x.lv.tunnel.toFixed(2)])));
    T.check('the crowd heard near the spectators', samples.some(x => x.lv.stands > 0.2 && x.lv.standsGain > 0.02), JSON.stringify(samples.map(x => +x.lv.stands.toFixed(2))));
    // 3. the run from the police (Vršič): the police radio's static under each line it says (the squelch opens, a bed of static, the roger
    //    beep), quiet between the lines
    await page.evaluate(() => { window.__game.S.mode = 'police'; });
    await startTrack(page, 'vrsic');
    const rad = await page.evaluate(async () => {
      const g = window.__game, out = { on: [], off: [], caps: [] };
      for (let k = 0; k < 150 && (out.on.length < 3 || out.off.length < 3); k++) {   // (real time: the radio speaks at its own pace)
        await new Promise(r => setTimeout(r, 100)); const c = g.radio.cur, lv = Sfx.levels().radio;
        if (c && /^(OKC|KG)/.test(c)) { out.on.push(+lv.toFixed(3)); out.caps.push(c); } else if (!c && !g.radio.cap) out.off.push(+lv.toFixed(3));
      }
      return out;
    });
    T.check('the police radio: static under a line it says, none between the lines', rad.on.length >= 3 && rad.on.filter(v => v > 0.012).length >= 2 && rad.off.length >= 1 && rad.off.some(v => v < 0.004),
      JSON.stringify({ on: rad.on.slice(0, 8), off: rad.off.slice(0, 8), said: [...new Set(rad.caps)].slice(0, 2) }));
  }
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
