// The crowd's sound and a tunnel's ring (Monaco, the player on autopilot, the sound on): every circuit's world knows where its crowds are
// (World.build: crowdPts, from the spectators and the grandstands); the crowd louder near them; in the tunnel under the hotel the engine
// rings off its walls (a short reverb), outside it not. The engines: each car its own type (the rally car a turbo four with anti-lag: pops
// and the blow-off off the throttle, a clack at each gear), the rivals' engines on the nearest cars with the Doppler shift, the formula a V10.
// The police radio (Vršič, the run from the police): static under its lines only.
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
  }
  // 3. the engines (the race at Monaco on autopilot, the rally car BURJA R7): its own type (a turbo four with anti-lag), the gears changed with
  // a clack, pops on the overrun and the blow-off; the nearest rivals' engines by their cars, with the Doppler shift as they pass
  if (ready) {
    const eng = [];
    for (let k = 0; k < 16; k++) eng.push(await page.evaluate(() => new Promise(res => { const g = window.__game; g.resume(); g.sim(1, true);   // (the sound on while the second is simulated: its gear changes heard)
 requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); res(Sfx.engines()); })); })));
    const last = eng[eng.length - 1], kinds = new Set(eng.flatMap(e => e.ai.filter(a => a.car).map(a => a.kind))), dops = eng.flatMap(e => e.ai.filter(a => a.car).map(a => a.dop));
    // the blow-off: the engine held high on the throttle for a second of sound (the boost builds), then the throttle shut (the race paused: only the sound runs)
    const bo = await page.evaluate(async () => { const g = window.__game, P = g.race.player; g.pause(); Sfx.resume(); const b0 = Sfx.engines().player.bov;
      P.rpm = P.m.redline * 0.85; P.inThr = 1; for (let k = 0; k < 25; k++) { Sfx.update(g.race, P, null, 1); await new Promise(r => setTimeout(r, 40)); }
      P.inThr = 0; for (let k = 0; k < 3; k++) { Sfx.update(g.race, P, null, 0); await new Promise(r => setTimeout(r, 40)); }
      return { b0, b1: Sfx.engines().player.bov }; });
    last.player.bov = bo.b1 - bo.b0;
    T.check('the player\'s engine: the rally car\'s turbo four with anti-lag (its pitch with the revs), gear changes, pops and a blow-off off the throttle',
      last.player.kind === 'al4' && eng.some(e => e.player.f > 30) && last.shifts > 0 && last.player.pops > 0 && last.player.bov > 0, JSON.stringify(last.player) + ' shifts ' + last.shifts);
    T.check('the rivals\' engines: on the nearest cars, each its own type (i6t, b4t, i4t, v6 by the model), the Doppler shift as they pass', eng.some(e => e.ai.filter(a => a.car).length >= 2) && [...kinds].every(k => ['i6t', 'b4t', 'i4t', 'v6', 'i4', 'al4', 'v10'].includes(k)) &&
      dops.some(d => d < 0.99) && dops.some(d => d > 1.01), JSON.stringify({ kinds: [...kinds], dop: [Math.min(...dops), Math.max(...dops)] }));
    // the formula: a V10 screaming several times higher at the same share of its revs
    await page.evaluate(() => { const g = window.__game; g.resume(); g.onAction('to-title'); g.S.car = Core.MODELS.findIndex(m => m.id === 'formula'); });
    await startTrack(page, 'jezero');
    const f = await page.evaluate(() => new Promise(res => { const g = window.__game; g.sim(4, true); requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); const P = g.race.player; res({ e: Sfx.engines().player, r: P.rpm / P.m.redline }); })); }));
    T.check('the formula: a V10 (ten firings a cycle: several hundred Hz)', f.e.kind === 'v10' && f.e.f * 10 > 300, JSON.stringify(f));
    // 4. the run from the police (Vršič, last: the race it starts is the police's, no rivals): the police radio's static under each line it says (the squelch opens, a bed of static, the roger
    //    beep), quiet between the lines
    await page.evaluate(() => { window.__game.S.mode = 'police'; });
    await startTrack(page, 'vrsic');
    const rad = await page.evaluate(async () => {
      const g = window.__game, out = { on: [], off: [], caps: [] };
      for (let k = 0; k < 150 && (out.on.length < 3 || out.off.length < 3); k++) {   // (real time: the radio speaks at its own pace)
        await new Promise(r => setTimeout(r, 100)); const c = g.radio.cur, lv = Sfx.levels().radio;
        if (c && /^(OKC|Enota)/.test(c)) { out.on.push(+lv.toFixed(3)); out.caps.push(c); } else if (!c && !g.radio.cap) out.off.push(+lv.toFixed(3));
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
