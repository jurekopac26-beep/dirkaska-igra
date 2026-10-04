// The crowd's sound and a tunnel's ring (Monaco, the player on autopilot, the sound on): every circuit's world knows where its crowds are
// (World.build: crowdPts, from the spectators and the grandstands); the crowd louder near them; in the tunnel under the hotel the engine
// rings off its walls (a short reverb), outside it not. The engines: each car its own type (the rally car a turbo four with anti-lag: pops
// and the blow-off off the throttle, a clack at each gear), the rivals' engines on the nearest cars with the Doppler shift, the formula a V10.
// The police radio (Vršič, the run from the police): static under its lines only.
// The fleet's sounds: every vehicle's engine preset (Core.SND_KINDS, Sfx.probe rendered offline: plausible and every two apart), what
// breaks (a rival wrecked: clang, glass, a wheel, the crunch, the fire; a pile-up), a turbo's blow-off and anti-lag (only when the throttle
// shuts), and what is made ahead in slices (prep).
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
    // 4. every vehicle's engine (the player's car given each model in turn for a few sound frames): its preset (a registered vehicle's
    //    def.snd.kind; the 11 others keep their own engine type, Sfx's CAR_ENG), every frequency finite at idle and near the redline on
    //    the throttle; a frame of nonsense (no number for the revs, the speed, the throttle) throws nothing
    const E = await page.evaluate(() => {
      const g = window.__game, P = g.race.player, m0 = P.m, rpm0 = P.rpm, thr0 = P.inThr, out = []; g.pause();
      const OLD = { p206: 'i4', pico: 'i4t', vortex: 'b4t', kaze: 'i6t', strega: 'v6', rally: 'al4', formula: 'v10', muscle: 'v8', truck: 'v8t', lm: 'v8r', ev: 'ev' };
      for (const M of Core.MODELS) {
        P.m = M; let fin = true;
        for (const [rpm, thr] of [[M.idle, 0], [M.redline * 0.95, 1]]) { P.rpm = rpm; P.inThr = thr; Sfx.update(g.race, P, null, thr); const L = Sfx.levels().engine; if (![L.f, L.gain, ...L.fs].every(Number.isFinite)) fin = false; }
        out.push({ id: M.id, preset: Sfx.levels().engine.preset, want: M.sndP ? M.sndP.kind : OLD[M.id], fin });
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

    // 5. every preset rendered offline (Sfx.probe: the same voice in an OfflineAudioContext, settled): finite, not clipping, heard; its
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

    // 6. a race in a registered vehicle (ZMAJ 85, a one-make field: i5, turbo 1): its preset and its rivals'; the nearest rival wrecked on
    //    the grid (Core.wreckCar with damage on: every part, the glass, its wheels): the clang of its panels, the glass, a wheel off and the
    //    crunch heard, then its fire crackling
    await page.evaluate(() => { const g = window.__game; g.pause(); g.S.car = Core.MODELS.findIndex(m => m.id === 'zmaj'); });
    await startTrack(page, 'jezero');
    // (1.5 s from the race's first frame: on the track already loaded (the formula's, above) no loading screen compiles the new race's
    // materials ahead, so its first frame does it, which can take seconds in software WebGL)
    const R1 = await page.evaluate(() => new Promise(res => { const g = window.__game, f0 = g.fr.drawn, t0 = performance.now(); g.resume();
      const first = () => { if (g.fr.drawn === f0 && performance.now() - t0 < 60000) { setTimeout(first, 50); return; }
        setTimeout(() => { const L = Sfx.levels(); res({ id: g.race.player.m.id, eng: L.engine.preset, ai: L.ai }); }, 1500); };
      first(); }));
    T.check('a race in ZMAJ 85: its i5 voice, its rivals\' too (the three nearest)', R1.id === 'zmaj' && R1.eng === 'i5' && R1.ai.length === 3 && R1.ai.every(a => a && a.preset === 'i5'), JSON.stringify(R1));
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

    // 7. (paused, the sound's own frames on the audio clock) ZMAJ's turbo (1: anti-lag): easing off to hold a speed (1 -> 0.45, as the AI
    //    does) blows nothing off and bangs nothing; the throttle shut: one blow-off and the anti-lag's bangs, which stop when it opens
    //    again; a gear change: its chuff and its bang, a lift right after it no second blow-off. A pile-up (six rivals wrecked in one
    //    frame): a sound at most twice in that frame, every kind heard (not eight crunches), at most 8 playing. What is made ahead (prep):
    //    all of it made, in slices
    const R3 = await page.evaluate(async () => {
      const g = window.__game, P = g.race.player, M = P.m, keep = { rpm: P.rpm, inThr: P.inThr, shiftT: P.shiftT, locked: P.locked };   // (P.speed: a getter)
      Sfx.setRunning(true);
      const sh = () => Object.assign({}, Sfx.levels().engine.shots);
      const hold = async (thr, secs) => { const t0 = performance.now(); do { Object.assign(P, { inThr: thr, rpm: M.redline * 0.8, shiftT: 0, locked: false }); Sfx.update(g.race, P, null, thr); await new Promise(r => setTimeout(r, 16)); } while (performance.now() - t0 < secs * 1000); return sh(); };
      const r = { a: await hold(1, 1.5) }; r.half = await hold(0.45, 0.6); r.b = await hold(1, 1.2); r.shut = await hold(0, 0.6); r.open0 = await hold(1, 0.06); r.open = await hold(1, 0.5);
      r.c = await hold(1, 1.5); Sfx.shiftPop(); r.shift = sh(); r.after = await hold(0, 0.15);
      Object.assign(P, keep);
      // the pile-up: once what was playing has ended
      for (let i = 0; i < 80 && Sfx.levels().dest.live > 0; i++) await new Promise(res => setTimeout(res, 50));
      const near = g.race.cars.filter(c => c !== P && !(c.dmg >= 0.98)).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z)).slice(0, 6);
      const d0 = Sfx.levels().dest; for (const c of near) { c.dmgMode = 2; Core.wreckCar(c); }
      Sfx.update(g.race, P, null, 0); const d1 = Sfx.levels().dest;
      Sfx.setRunning(false);
      for (let i = 0; i < 200 && Sfx.levels().prep.left !== 0; i++) await new Promise(res => setTimeout(res, 50));   // (paused: the idle time's slices)
      return { r, d0, d1, dist: near.map(c => Math.round(Math.hypot(c.x - P.x, c.z - P.z))), prep: Sfx.levels().prep };
    });
    const z = R3.r, dz = (a, b, k) => z[b][k] - z[a][k];
    T.check('ZMAJ\'s turbo: easing off to 0.45 no blow-off, no bang; shut: one blow-off and bangs, which stop once it opens; a gear change: chuff and bang, then no second blow-off',
      dz('a', 'half', 'bov') === 0 && dz('a', 'half', 'pop') === 0 && dz('b', 'shut', 'bov') === 1 && dz('b', 'shut', 'pop') >= 1 && dz('open0', 'open', 'pop') === 0 && dz('open0', 'open', 'bov') === 0 &&
      dz('c', 'shift', 'bov') === 1 && dz('c', 'shift', 'pop') === 1 && dz('shift', 'after', 'bov') === 0, JSON.stringify(z));
    const F = R3.d1.frame || { plays: {} }, most = Math.max(0, ...Object.values(F.plays)), heard = (k) => R3.d1[k] > R3.d0[k];
    T.check('a pile-up (six rivals wrecked at once): a sound at most twice in that frame, panels, glass, wheels and crunch all heard, at most 8 playing',
      most <= 2 && ['clang', 'glass', 'wheel', 'crunch'].every(heard) && R3.d1.live <= 8, `at ${R3.dist.join(', ')} m: ` + JSON.stringify(F) + ` live ${R3.d1.live}, merged +${R3.d1.merged - R3.d0.merged}, dropped +${R3.d1.dropped - R3.d0.dropped}`);
    T.check('the sounds made ahead (prep): all of it, in slices', R3.prep.left === 0 && R3.prep.slices >= 10, JSON.stringify(R3.prep));
    // 8. the run from the police (Vršič, last: the race it starts is the police's, no rivals): the police radio's static under each line it says (the squelch opens, a bed of static, the roger
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
