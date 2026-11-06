// The sounds by the road (js/sfx-okolje.js, docs/zvoki-okolja.md): every real track's zones from its world (the woods, the water, the
// villages, the wind, the churches; tools/zvoki-pasovi.mjs prints them), the test tracks none; a race at Medvode with the sound on (the
// Sava heard, a church's bells as the car passes it, quieter with the speed, at most 25 nodes and 1.5 MB of buffers); the beds and the calls
// under the engine (rendered offline: SfxOkolje.probe against Sfx.probe); the setting (Tiho by default, Glasneje twice Tiho, Izklop nothing).
//   node tests/browser/okolje.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('ambient sounds by the road');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'medvode', sound: 1 }, { width: 480, height: 270 });
  // 1. the zones: each real track's world built as in the game (one at a time; Medvode's last, the race's world then), its table (from-to
  // m, the sound, the side)
  const ids = await page.evaluate(() => Core.TRACKS.filter(d => SfxOkolje.eligible(d)).map(d => d.id).sort((a, b) => (a === 'medvode') - (b === 'medvode')));
  const Z = {};
  for (const id of ids) Z[id] = await page.evaluate((id) => {
    const def = Core.TRACKS.find(d => d.id === id), Tr = new Core.Track(def), W = Render.buildWorld(Tr, 1, 2), Zn = SfxOkolje.zones(W, Tr);
    const len = Zn.open ? Zn.s1 - Zn.s0 : Zn.len, hw = [];   // (the wind by the road's height: the highest and the lowest quarter)
    for (let k = 0; k < Zn.n; k++) { const s = (k + 0.5) * 20; if (Zn.open && (s < Zn.s0 || s > Zn.s1)) continue; hw.push([Tr.hy[Tr.idx(s)], Zn.wind[k]]); }
    hw.sort((a, b) => a[0] - b[0]); const q = Math.max(1, hw.length >> 2), avg = (a) => a.reduce((x, p) => x + p[1], 0) / a.length;
    return { len, rows: SfxOkolje.table(Zn), windLo: +avg(hw.slice(0, q)).toFixed(2), windHi: +avg(hw.slice(-q)).toFixed(2) };
  }, id);
  const has = (id, z) => Z[id] && Z[id].rows.some(r => r[2] === z), cover = (id, z) => Z[id] ? Z[id].rows.filter(r => r[2] === z).reduce((a, r) => a + r[1] - r[0], 0) / Z[id].len : 0;
  T.check('every real track has a sound by the road', ids.length >= 20 && ids.every(id => Z[id].rows.length > 0), ids.filter(id => !Z[id].rows.length).join(', ') || ids.length + ' tracks');
  const frozen = await page.evaluate(() => Core.TRACKS.filter(d => d.test || SfxOkolje.NO.includes(d.id)).map(d => [d.id, SfxOkolje.eligible(d) || SfxOkolje.zones({}, { def: d }) !== null]));
  T.check('the test tracks (and the roads counted with them): no zones', frozen.length >= 12 && frozen.every(f => !f[1]), frozen.filter(f => f[1]).map(f => f[0]).join(', ') || frozen.length + ' tracks');
  T.check('Medvode: its villages, the Sava and the lake, its churches', has('medvode', 'vas') && has('medvode', 'reka') && has('medvode', 'jezero') && Z.medvode.rows.filter(r => r[2] === 'zvon').length >= 3, JSON.stringify(Z.medvode.rows.slice(0, 12)));
  T.check('Ouninpohja: the forest most of the way, and its villages', cover('ouninpohja', 'gozd') > 0.5 && has('ouninpohja', 'vas'), 'forest ' + cover('ouninpohja', 'gozd').toFixed(2));
  T.check('Katu-Jaryk: the wind stronger at the top than at the bottom', Z.katu.windHi > Z.katu.windLo + 0.1, JSON.stringify([Z.katu.windLo, Z.katu.windHi]));
  T.check("Chapman's Peak: the sea", cover('chapman', 'morje') > 0.2, 'sea ' + cover('chapman', 'morje').toFixed(2));
  T.check('Marrakesh (in the town): little forest, no village of its own', cover('marrakesh', 'gozd') < 0.2 && !has('marrakesh', 'vas'), 'forest ' + cover('marrakesh', 'gozd').toFixed(2));

  // 2. a race at Medvode with the sound on (the autopilot, the church's bell certain: SfxOkolje.opts)
  await page.evaluate(() => Sfx.resume());
  await startTrack(page, 'medvode');
  await page.evaluate(() => { window.__game.autoDrive = true; SfxOkolje.opts.bellP = 1; SfxOkolje.opts.bellGap = 20; });
  const ready = await page.evaluate(() => Sfx.ready);
  if (!ready) T.check('sound running in this browser (skipped: no audio here)', true, 'AudioContext not running');
  else {
    // (a step: t s simulated, two frames drawn (the sound's own: Sfx.update, SfxOkolje.step), then paused where the car is)
    const frame = (t) => page.evaluate((t) => new Promise(res => { const g = window.__game; g.pause(); if (t) g.sim(t, true); g.resume();
      requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); setTimeout(() => { const P = g.race.player; res({ s: Math.round(P.q.s), kmh: Math.round(P.speed * 3.6), L: SfxOkolje.levels() }); }, 150); })); }), t);
    const f0 = await frame(0), prep = await page.evaluate(() => [SfxOkolje.prep(), SfxOkolje.levels(), window.__game.S.amb]);
    T.check('the voices made ahead for Medvode (the river, the bells, the birds; at most 1.5 MB), Tiho by default', prep[0] && prep[1].ready && !prep[1].err && prep[1].voices.includes('river') && prep[1].voices.includes('bells') && prep[1].songs >= 3 && prep[1].bytes > 0 && prep[1].bytes <= 1.5e6 && prep[2] === 1,
      JSON.stringify({ voices: prep[1].voices, songs: prep[1].songs, KB: Math.round(prep[1].bytes / 1024), err: prep[1].err, amb: prep[2], prep: prep[1].prep, s: f0.s }));
    const S = [];
    for (let k = 0; k < 4; k++) S.push(await frame(0.6));   // (by the Sava after the start)
    await page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 80 && g.race.player.q.s < 1250; k++) g.sim(0.5, true); });   // (on, unheard, to the church)
    for (let k = 0; k < 40 && !(S.length > 4 && S[S.length - 1].s > 1750); k++) S.push(await frame(0.5));
    const river = S.slice(0, 4).map(x => x.L.beds.river || 0), fast = S.filter(x => x.L.kmh >= 160), full = S[0].L.full;   // (L.kmh: the speed the mixer last saw)
    T.check('the Sava heard by the road after the start', river.some(v => v > 0.01), JSON.stringify(S.slice(0, 4).map(x => [x.s, x.L.beds])));
    T.check('the church\'s bells as the car passes it', S.some(x => x.L.peal) && S[S.length - 1].L.n.bells >= 1, JSON.stringify(S.slice(4).map(x => [x.s, x.L.peal ? 1 : 0])));
    T.check('quieter with the speed: at 160 km/h and more at most half of a car that stands', fast.length > 0 && fast.every(x => x.L.master <= 0.5 * full + 1e-4), JSON.stringify(S.map(x => [x.L.kmh, x.L.master])) + ' full ' + full);
    T.check('at most 25 nodes and 1.5 MB at any time', S.every(x => x.L.nodes <= 25 && x.L.bytes <= 1.5e6), 'nodes up to ' + Math.max(...S.map(x => x.L.nodes)));

    // 3. under the engine (offline, Tiho): the beds at a full zone ~24 dB under a car's engine at mid revs, the calls at their nearest ~18
    const lo = await page.evaluate(async () => {
      const rms = (d, a = 0) => { let s = 0; for (let i = a; i < d.length; i++) s += d[i] * d[i]; return Math.sqrt(s / (d.length - a)); }, db = (x) => 20 * Math.log10(Math.max(x, 1e-9));
      const pk = (d) => { let m = 0; for (let a = 0; a + 4410 <= d.length; a += 2205) { let q = 0; for (let i = a; i < a + 4410; i++) q += d[i] * d[i]; m = Math.max(m, Math.sqrt(q / 4410)); } return m; };
      const eng = db(rms(await Sfx.probe({ kind: 'i4', rpm: 3850, load: 0.5, redline: 7000, idle: 900, speed: 30, dur: 1, settle: true }), 11025)), out = { eng: +eng.toFixed(1), beds: {}, calls: {} };
      for (const bed of ['rustle', 'brook', 'river', 'fall', 'lake', 'sea', 'wind', 'crickets', 'cicadas']) { const d = await SfxOkolje.probe({ bed, dur: 4 }); if (d) out.beds[bed] = +(db(rms(d, 22050)) - eng).toFixed(1); }
      for (const [n, o] of [['bird0', { spot: 'bird', k: 0 }], ['bird1', { spot: 'bird', k: 1 }], ['bird2', { spot: 'bird', k: 2 }], ['gull', { spot: 'gull' }], ['bell', { spot: 'bell', d: 15, dur: 5 }]]) {
        const d = await SfxOkolje.probe(Object.assign({ dur: 3 }, o)); if (d) out.calls[n] = +(db(pk(d)) - eng).toFixed(1); }
      return out;
    });
    const bv = Object.values(lo.beds), cv = Object.values(lo.calls);
    T.check('the beds at a full zone 20 to 30 dB under the engine at mid revs (Tiho)', bv.length >= 6 && bv.every(v => v <= -20 && v >= -30), JSON.stringify(lo));
    T.check('the calls (a bird, a gull, a bell) at their nearest at least 15 dB under it', cv.length === 5 && cv.every(v => v <= -15 && v >= -32), JSON.stringify(lo.calls));

    // 4. the setting (Nastavitve, Zvoki okolja): Glasneje twice Tiho, Izklop nothing at all (no node, no buffer), back on again
    const st = await page.evaluate(() => { const pick = (v) => document.querySelector('.seg[data-set="amb"] button[data-v="' + v + '"]').click();   // (the buttons in Nastavitve)
      const t = SfxOkolje.levels().full; pick(2); const l = SfxOkolje.levels().full; pick(0); const off = SfxOkolje.levels(); pick(1); return { t, l, off }; });
    const back = await frame(0.3);
    T.check('Glasneje twice Tiho, Izklop: nothing at all, Tiho again: on', Math.abs(st.l - 2 * st.t) < 1e-9 && st.t > 0 && !st.off.on && st.off.nodes === 0 && st.off.bytes === 0 && back.L.on,
      JSON.stringify({ tiho: st.t, glasneje: st.l, izklop: [st.off.on, st.off.nodes, st.off.bytes], back: back.L.on }));
  }
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
