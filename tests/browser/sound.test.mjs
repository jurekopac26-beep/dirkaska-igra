// The crowd's sound and a tunnel's ring (Monaco, the player on autopilot, the sound on): every circuit's world knows where its crowds are
// (World.build: crowdPts, from the spectators and the grandstands); the crowd louder near them; in the tunnel under the hotel the engine
// rings off its walls (a short reverb), outside it not. The fleet's sounds: every vehicle's engine preset (Core.SND_KINDS, Sfx.probe
// rendered offline: plausible and every two apart) and what breaks (a rival wrecked: clang, glass, a wheel, the crunch, the fire).
//   node tests/browser/sound.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('crowd, tunnel and vehicle sounds');
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

    // 3. every vehicle's engine (the player's car given each model in turn for a few sound frames): its preset (a registered vehicle's
    //    def.snd.kind; the 11 others keep their old voice: ice / v8 / ev), every frequency finite at idle and near the redline on the
    //    throttle; a frame of nonsense (no number for the revs, the speed, the throttle) throws nothing
    const E = await page.evaluate(() => {
      const g = window.__game, P = g.race.player, m0 = P.m, rpm0 = P.rpm, thr0 = P.inThr, out = []; g.pause();
      for (const M of Core.MODELS) {
        P.m = M; let fin = true;
        for (const [rpm, thr] of [[M.idle, 0], [M.redline * 0.95, 1]]) { P.rpm = rpm; P.inThr = thr; Sfx.update(g.race, P, null, thr); const L = Sfx.levels().engine; if (![L.f, L.gain, ...L.fs].every(Number.isFinite)) fin = false; }
        out.push({ id: M.id, preset: Sfx.levels().engine.preset, want: M.sndP ? M.sndP.kind : M.ev ? 'ev' : M.snd === 'v8' ? 'v8' : 'ice', fin });
      }
      let threw = '';
      try { P.m = Core.MODELS.find(m => m.sndP && m.sndP.turbo); P.rpm = NaN; P.inThr = NaN; Sfx.update(g.race, P, null, NaN); Sfx.crash(NaN); Sfx.knock('cone', NaN); } catch (e) { threw = e.message; }
      P.m = m0; P.rpm = rpm0; P.inThr = thr0; Sfx.update(g.race, P, null, 0);
      return { out, threw, kinds: Sfx.KINDS, need: Core.SND_KINDS };
    });
    const badE = E.out.filter(x => x.preset !== x.want || !x.fin);
    T.check('every kind of Core.SND_KINDS has a voice (and no other)', E.need.every(k => E.kinds.includes(k)) && E.kinds.every(k => E.need.includes(k)), E.kinds.join(' '));
    T.check(`every vehicle's engine: its preset, every frequency finite (${E.out.length} models)`, E.out.length >= 42 && !badE.length, badE.map(x => `${x.id} ${x.preset}/${x.want} finite ${x.fin}`).join(', ') || E.out.map(x => x.id + ':' + x.preset).join(' '));
    T.check('a frame with no numbers (NaN revs, throttle, impact) throws nothing', !E.threw, E.threw);

    // 4. every preset rendered offline (Sfx.probe: the same voice in an OfflineAudioContext, settled): finite, not clipping, heard; its
    //    firing line where the engine fires (cylinders/2 x rpm/60 on a four-stroke, once a turn on the kart's two-stroke, 2 x rpm/60 on the
    //    two-rotor) within 3 %; and every two presets apart at the same revs and throttle: >= 3 dB RMS over the 1/3-octave bands
    const O = await page.evaluate(async () => {
      const SR = 44100, N = 16384, bin = SR / N;
      function mag(d, from) { const re = new Float64Array(N), im = new Float64Array(N); for (let i = 0; i < N; i++) re[i] = (d[from + i] || 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));
        for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { const t = re[i]; re[i] = re[j]; re[j] = t; } }
        for (let len = 2; len <= N; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a), h = len >> 1; for (let i = 0; i < N; i += len) for (let k = 0, cr = 1, ci = 0; k < h; k++) { const p = i + k, q = p + h, vr = re[q] * cr - im[q] * ci, vi = re[q] * ci + im[q] * cr; re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
        const m = new Float64Array(N / 2); for (let i = 0; i < N / 2; i++) m[i] = Math.hypot(re[i], im[i]); return m; }
      const at = (m, f) => { const i = Math.round(f / bin); let v = 0; for (let j = i - 1; j <= i + 1; j++) if (j > 0 && j < m.length) v = Math.max(v, m[j]); return v; };
      const rows = [], bands = {};
      for (const kind of Core.SND_KINDS) for (const [rpm, load] of [[5000, 1], [2200, 0]]) {
        const d = await Sfx.probe({ kind, rpm, load, redline: 8000, idle: 900, speed: 40, dur: 0.6, sr: SR }), tg = d.tg, m = mag(d, Math.round(0.15 * SR));
        let pk = 0, ss = 0, fin = true; for (let i = 0; i < d.length; i++) { if (!Number.isFinite(d[i])) fin = false; pk = Math.max(pk, Math.abs(d[i])); ss += d[i] * d[i]; }
        let f0 = 0;
        if (kind !== 'ev') { let bs = 0; for (let f = tg.ff * 0.6; f <= tg.ff * 1.45; f += bin / 4) { let s = 0; for (let h = 1; h <= 6; h++) s += at(m, f * h) / h; if (s > bs) { bs = s; f0 = f; } } }
        rows.push({ kind, rpm, load, ff: tg.ff, f0, pk, rms: Math.sqrt(ss / d.length), fin });
        if (load) { const B = []; for (let f = 40; f < 10000; f *= Math.pow(2, 1 / 3)) { let s = 0; for (let i = Math.round(f / bin); i < Math.round(f * Math.pow(2, 1 / 3) / bin); i++) s += m[i] * m[i]; B.push(10 * Math.log10(s + 1e-12)); } const mx = Math.max(...B); bands[kind] = B.map(v => Math.max(-60, v - mx)); }
      }
      let near = null;
      for (let i = 0; i < Core.SND_KINDS.length; i++) for (let j = i + 1; j < Core.SND_KINDS.length; j++) {
        const a = bands[Core.SND_KINDS[i]], b = bands[Core.SND_KINDS[j]]; let s = 0; for (let k = 0; k < a.length; k++) s += (a[k] - b[k]) ** 2;
        const dB = Math.sqrt(s / a.length); if (!near || dB < near[2]) near = [Core.SND_KINDS[i], Core.SND_KINDS[j], dB];
      }
      return { rows, near };
    });
    const badO = O.rows.filter(r => !r.fin || r.pk >= 1 || r.rms < 0.02 || (r.kind !== 'ev' && Math.abs(r.f0 / r.ff - 1) > 0.03));
    T.check(`every preset offline: finite, not clipping, heard, its firing frequency within 3 % (${O.rows.length} renders)`, O.rows.length === 2 * E.need.length && !badO.length,
      (badO.length ? 'BAD ' : '') + (badO.length ? badO : O.rows).map(r => `${r.kind}@${r.rpm}/${r.load} ff ${r.ff.toFixed(1)} f0 ${r.f0.toFixed(1)} pk ${r.pk.toFixed(2)} rms ${r.rms.toFixed(3)}`).join(', '));
    T.check('every two presets sound apart (>= 3 dB RMS across 1/3-octave bands, 5000 rpm full throttle)', O.near && O.near[2] >= 3, O.near && `closest: ${O.near[0]}-${O.near[1]} ${O.near[2].toFixed(2)} dB`);

    // 5. a race in a registered vehicle (ZMAJ 85, a one-make field: i5, turbo 1): its preset and its rivals'; the nearest rival wrecked on
    //    the grid (Core.wreckCar with damage on: every part, the glass, its wheels): the clang of its panels, the glass, a wheel off and the
    //    crunch heard, then its fire crackling
    await page.evaluate(() => { const g = window.__game; g.pause(); g.S.car = Core.MODELS.findIndex(m => m.id === 'zmaj'); });
    await startTrack(page, 'jezero');
    const R1 = await page.evaluate(() => new Promise(res => { const g = window.__game; g.resume(); setTimeout(() => { const L = Sfx.levels(); res({ id: g.race.player.m.id, eng: L.engine.preset, ai: L.ai }); }, 1500); }));
    T.check('a race in ZMAJ 85: its i5 voice, its rivals\' too', R1.id === 'zmaj' && R1.eng === 'i5' && R1.ai.filter(Boolean).length === 2 && R1.ai.every(a => a && a.preset === 'i5'), JSON.stringify(R1));
    const R2 = await page.evaluate(() => new Promise(res => {
      const g = window.__game, P = g.race.player; g.pause();
      const c = g.race.cars.filter(c => c !== P).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0], d0 = Sfx.levels().dest;
      c.dmgMode = 2; Core.wreckCar(c); g.resume();
      let n = 0; const tick = () => { if (++n < 4) { requestAnimationFrame(tick); return; } g.pause(); res({ dist: Math.hypot(c.x - P.x, c.z - P.z), parts: Object.keys(c.lost).length, wl: c.wreck ? c.wreck.wl : -1, d0, d1: Sfx.levels().dest }); };
      requestAnimationFrame(tick);
    }));
    const dd = (k) => R2.d1[k] - R2.d0[k];
    T.check('the nearest rival wrecked: its panels\' clang, the glass, a wheel off and the crunch heard, its fire crackling', dd('clang') >= 1 && dd('glass') >= 1 && dd('wheel') >= 1 && dd('crunch') >= 1 && R2.d1.fire >= 1,
      `at ${R2.dist.toFixed(1)} m, ${R2.parts} parts off, wheels ${R2.wl}: ` + JSON.stringify(R2.d1));
  }
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
