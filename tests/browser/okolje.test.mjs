// The sounds by the road (js/sfx-okolje.js, docs/zvoki-okolja.md): every real track's zones from its world (the woods, the water, the
// villages, the wind, the churches, the herds, the towns, the circuits' announcer; tools/zvoki-pasovi.mjs prints them), the test tracks
// none; a race at Medvode with the sound on (the Sava heard, a church's bells as the car passes it, quieter with the speed, at most 25 nodes
// and 1.5 MB of buffers); the beds and the calls under the engine (rendered offline: SfxOkolje.probe against Sfx.probe); the setting (Normalno
// by default, Tiho half of it, Glasno twice, Izklop nothing; kept between launches); the night, the rain and the winter (no birds, no insects); the load (a frame's share,
// an offline render); Rio do Rastro's birds and forest (Ouninpohja, a test track since 8. 11. 2026, stood here before); Pikes Peak without our wind; on a second page with the browser's speech stubbed, Spa's
// announcer and shouts (never over the commentator, cut off by him), its cows' bells, Marrakesh's traffic and pigeons.
//   node tests/browser/okolje.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';
import fs from 'node:fs';

const T = checker('ambient sounds by the road');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// the sound's own thread: Chromium renders a page's Web Audio on its renderer's AudioOutputDevice thread; its CPU time (utime + stime, in
// clock ticks) from /proc, among this test's own processes (Linux; elsewhere null: the check is skipped)
function audioThread() {
  if (!fs.existsSync('/proc/self/task')) return null;
  const kids = new Map();
  for (const p of fs.readdirSync('/proc').filter(x => /^\d+$/.test(x))) { try { const st = fs.readFileSync(`/proc/${p}/stat`, 'utf8'), pp = +st.slice(st.lastIndexOf(')') + 2).split(' ')[1]; if (!kids.has(pp)) kids.set(pp, []); kids.get(pp).push(+p); } catch (_) { } }
  const mine = [], q = [process.pid]; while (q.length) { const p = q.shift(); for (const k of kids.get(p) || []) { mine.push(k); q.push(k); } }
  const found = [];
  for (const p of mine) { let ts = []; try { ts = fs.readdirSync(`/proc/${p}/task`); } catch (_) { continue; }
    for (const t of ts) { try { if (/^AudioOutputDevi/.test(fs.readFileSync(`/proc/${p}/task/${t}/comm`, 'utf8'))) found.push(`/proc/${p}/task/${t}/stat`); } catch (_) { } } }
  return found.length === 1 ? found[0] : null;   // (one page with sound open: one such thread)
}
const cpu = (f) => { const st = fs.readFileSync(f, 'utf8'), x = st.slice(st.lastIndexOf(')') + 2).split(' '); return +x[11] + +x[12]; };

// the browser's speech, stubbed (before the game's scripts): a line lasts 60 ms a letter (at its rate), one at a time, each logged
// (window.__speech: its text, start, end, cut off, voice, volume); four voices, three of them English
const stub = () => {
  const log = [], Q = [], V = [['Test Daniel', 'en-GB'], ['Test Karen', 'en-AU'], ['Test Alex', 'en-US'], ['Test Ana', 'sl-SI']].map(([name, lang]) => ({ name, lang, default: false, localService: true, voiceURI: name }));
  let cur = null, tm = 0;
  const next = () => { if (cur || !Q.length) return; const u = cur = Q.shift(), e = { text: u.text, t0: performance.now(), t1: 0, cut: false, voice: u.voice ? u.voice.name : '', vol: u.volume }; u.__e = e; log.push(e);
    tm = setTimeout(() => { e.t1 = performance.now(); cur = null; if (u.onend) u.onend({ utterance: u }); next(); }, Math.max(30, 60 * u.text.length / (u.rate || 1))); };
  const S = { speak(u) { Q.push(u); next(); }, getVoices: () => V, pause() { }, resume() { }, addEventListener() { }, removeEventListener() { }, onvoiceschanged: null,
    cancel() { const q = Q.splice(0); if (cur) { clearTimeout(tm); const u = cur; cur = null; u.__e.t1 = performance.now(); u.__e.cut = true; if (u.onerror) u.onerror({ error: 'interrupted' }); } for (const u of q) if (u.onerror) u.onerror({ error: 'canceled' }); },
    get speaking() { return !!cur; }, get pending() { return Q.length > 0; }, get paused() { return false; } };
  class U { constructor(t) { this.text = t; this.volume = 1; this.rate = 1; this.pitch = 1; this.lang = ''; this.voice = null; this.onend = this.onerror = this.onstart = null; } }
  Object.defineProperty(window, 'speechSynthesis', { value: S, configurable: true, writable: true }); window.SpeechSynthesisUtterance = U; window.__speech = log;
};

// 9. a second page, the commentator on and the speech stubbed: Spa's announcer and shouts by the stands (the player's car held on the
// grid; the test's gaps and chances: SfxOkolje.opts) only once the commentator has been quiet 3 s, never over him, his line cutting
// ours off at once; Spa's cows' bells as the car passes a herd; Marrakesh's traffic and its pigeons; the new calls under the engine
async function speech() {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'spa', sound: 1, comm: 1, rivals: 0 }, { width: 480, height: 270 }, { init: stub });
  await page.evaluate(() => Sfx.resume());
  await startTrack(page, 'spa');
  // (the car to the stands with the most people (Render.world.crowdPts), on the autopilot, then braked to a stop there and held: the
  // autopilot's steering, its brake on)
  const at = await page.evaluate(() => {
    const ai = Core.aiControl; Core.aiControl = function (P, race) { const r = ai.apply(this, arguments); if (window.__hold && race && P === race.player) { P.inThr = 0; const mv = Math.abs(P.speed) > 1; P.inBrk = mv ? 1 : 0; P.inHand = mv ? 0 : 1; } return r; };
    const g = window.__game, T = g.race.track, P = g.race.player, C = Render.world.crowdPts, N = T.px.length; let w = 0, bx = 0, bz = 0, bi = 0, bd = 1e18;
    for (let k = 0; k < C.length; k += 3) if (C[k + 2] > w) { w = C[k + 2]; bx = C[k]; bz = C[k + 1]; }
    for (let i = 0; i < N; i++) { const d = (T.px[i] - bx) ** 2 + (T.pz[i] - bz) ** 2; if (d < bd) { bd = d; bi = i; } }
    const s = bi * T.len / N, rest = () => ((s - P.q.s) % T.len + T.len) % T.len;
    g.pause(); g.autoDrive = true;
    for (let k = 0; k < 600 && rest() > 500; k++) g.sim(0.25, true);
    // (the last 500 m by the test's own throttle and brake: drive() takes them only without the autopilot; the brake only while it moves, no
    // reverse; then the autopilot back, its control held by the wrapper above)
    g.autoDrive = false;
    for (let k = 0; k < 400 && rest() > 3 && rest() < T.len - 200; k++) { const v = Math.abs(P.speed), stop = v * v / 14 + 15; if (v < 1 && rest() < 20) break;
      g.drive(0.1, () => rest() > stop ? { thr: 1 } : v > 1 ? { brk: 1 } : {}); }
    g.drive(3, (Q) => Math.abs(Q.speed) > 1 ? { brk: 1 } : {}); g.autoDrive = true; window.__hold = true; g.resume();
    return { s: Math.round(s), off: Math.round(Math.sqrt(bd)), w: +w.toFixed(2), at: Math.round(P.q.s), kmh: Math.round(P.speed * 3.6) };
  });
  const sp = await page.evaluate(async () => {
    const wait = (ms) => new Promise(r => setTimeout(r, ms)), Lx = SfxOkolje.lines, ours = (t) => Lx.pa.includes(t) || Lx.end.includes(t) || Lx.shouts.includes(t);
    Object.assign(SfxOkolje.opts, { paGap: 8, paP: 5, shoutGap: 4, shoutP: 5 });
    const t0 = performance.now(); let L = SfxOkolje.levels(), stands = 0;
    while (performance.now() - t0 < 90000 && !(L.speech.pa >= 1 && L.speech.shouts >= 1)) { await wait(250); L = SfxOkolje.levels(); stands = Math.max(stands, Sfx.levels ? (Sfx.levels().stands || 0) : 0); }
    let cut = null;   // (the commentator's line while the announcer speaks)
    for (let k = 0; k < 600 && !cut; k++) { const q = SfxOkolje.levels().speech;
      if (q.on && q.kind === 'pa') { const n0 = window.__speech.length; Comm.addLines('okoljeTest', ['A test line from the commentator.']); Comm.say('okoljeTest', null, 9); await wait(40);
        const lg = window.__speech; cut = { after: SfxOkolje.levels().speech, ours: lg[n0 - 1] && [ours(lg[n0 - 1].text), lg[n0 - 1].cut, Math.round(lg[n0 - 1].t1)], his: lg[n0] && [lg[n0].text, Math.round(lg[n0].t0)] }; }
      else await wait(100); }
    const vi = Comm.voiceInfo();
    return { pa: L.speech.pa, shouts: L.speech.shouts, stands: +stands.toFixed(2), state: window.__game.race.state, cut, vi: [vi.name, vi.codrv],
      log: window.__speech.filter(e => e.text.trim()).map(e => ({ ours: ours(e.text), text: e.text.slice(0, 40), t0: Math.round(e.t0), t1: Math.round(e.t1), cut: e.cut, voice: e.voice, vol: +e.vol.toFixed(2) })) };
  });
  const mine = sp.log.filter(e => e.ours), his = sp.log.filter(e => !e.ours), clash = [];
  for (const e of mine) for (const c of his) if (c.t0 <= e.t0 && (e.t0 < c.t1 || !c.t1 || e.t0 - c.t1 < 3000)) clash.push([e.text, c.text, e.t0 - c.t0, c.t1 ? e.t0 - c.t1 : null]);
  T.check('Spa: the announcer and the shouts by the stands (quiet, not in the commentator\'s voice)', sp.pa >= 1 && sp.shouts >= 1 && mine.every(e => e.vol <= 0.31 && e.voice && e.voice !== sp.vi[0]),
    JSON.stringify({ pa: sp.pa, shouts: sp.shouts, stands: sp.stands, at, state: sp.state, voices: sp.vi, ours: mine.slice(0, 6) }));
  T.check('never over the commentator: ours only 3 s after his last line', mine.length > 0 && !clash.length, JSON.stringify(clash.slice(0, 4)) + ' · ' + JSON.stringify(sp.log.slice(0, 14)));
  T.check('the commentator\'s line cuts the announcer off at once', !!sp.cut && sp.cut.ours && sp.cut.ours[0] && sp.cut.ours[1] && sp.cut.his && sp.cut.his[0].startsWith('A test line') && Math.abs(sp.cut.his[1] - sp.cut.ours[2]) < 50 && !sp.cut.after.on && sp.cut.after.cut >= 1, JSON.stringify(sp.cut));

  // (a step: t s simulated, two frames drawn, then paused where the car is)
  const frame = (t) => page.evaluate((t) => new Promise(res => { const g = window.__game; g.pause(); if (t) g.sim(t, true); g.resume();
    requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); setTimeout(() => { const P = g.race.player; res({ s: Math.round(P.q.s), L: SfxOkolje.levels() }); }, 150); })); }), t);
  // the cows: on, unheard, to 150 m before Spa's first herd past the car, then as the car passes it
  const h0 = await page.evaluate(() => { const g = window.__game; g.pause(); g.autoDrive = true; window.__hold = false; const P = g.race.player, Z = SfxOkolje.zones(Render.world, g.race.track), len = Z.len;
    const ahead = Z.herds.map(h => [h, ((h[0] - P.q.s) % len + len) % len]).filter(x => x[1] > 200).sort((a, b) => a[1] - b[1])[0]; if (!ahead) return null;
    const to = P.q.s + ahead[1] - 150; let k = 0; for (; k < 160 && P.q.s + (P.q.s < to - len / 2 ? len : 0) < to; k++) g.sim(0.5, true);
    return { herd: ahead[0], from: Math.round(P.q.s), steps: k, n0: SfxOkolje.levels().n }; });
  const H = []; if (h0) for (let k = 0; k < 14; k++) H.push(await frame(0.4));
  const hl = H.length ? H[H.length - 1].L.n : {};
  T.check('Spa: the cows\' bells as the car passes a herd', !!h0 && H.some(x => x.L.herd) && hl.herds > h0.n0.herds && hl.strikes > h0.n0.strikes, JSON.stringify({ h0, at: H.map(x => [x.s, x.L.herd ? 1 : 0]), n: hl }));

  // Marrakesh: its traffic, its pigeons (now and then: the test's chance)
  await startTrack(page, 'marrakesh');
  await page.evaluate(() => { window.__game.autoDrive = true; SfxOkolje.opts.cooP = 5; });
  await frame(0); const m0 = await page.evaluate(() => [SfxOkolje.prep(), SfxOkolje.levels()]), M = [];
  for (let k = 0; k < 10; k++) M.push(await frame(0.5));
  T.check('Marrakesh: the town\'s traffic and its pigeons', m0[0] && m0[1].voices.includes('coos') && M.some(x => (x.L.beds.traffic || 0) > 0.01) && M[M.length - 1].L.n.coos > m0[1].n.coos,
    JSON.stringify({ voices: m0[1].voices, traffic: M.map(x => x.L.beds.traffic || 0), coos: M[M.length - 1].L.n.coos - m0[1].n.coos }));
  await page.evaluate(() => { SfxOkolje.opts.cooP = 0.12; });

  // the new calls under the engine (offline, Normalno; every voice made: SfxOkolje.opts.all, the setting off and on): a cow's bell, a moo, a
  // sheep's bleat, a pigeon at their nearest 15 to 32 dB under a car's engine at mid revs, the town's traffic 20 to 30
  await page.evaluate(() => { SfxOkolje.opts.all = true; const pick = (v) => document.querySelector('.seg[data-set="amb"] button[data-v="' + v + '"]').click(); pick(0); pick(1); });
  await frame(0.2);
  const lo = await page.evaluate(async () => {
    SfxOkolje.prep(); SfxOkolje.opts.all = false;
    const rms = (d, a = 0) => { let s = 0; for (let i = a; i < d.length; i++) s += d[i] * d[i]; return Math.sqrt(s / (d.length - a)); }, db = (x) => 20 * Math.log10(Math.max(x, 1e-9));
    const pk = (d) => { let m = 0; for (let a = 0; a + 4410 <= d.length; a += 2205) { let q = 0; for (let i = a; i < a + 4410; i++) q += d[i] * d[i]; m = Math.max(m, Math.sqrt(q / 4410)); } return m; };
    const eng = db(rms(await Sfx.probe({ kind: 'i4', rpm: 3850, load: 0.5, redline: 7000, idle: 900, speed: 30, dur: 1, settle: true }), 11025)), out = { eng: +eng.toFixed(1), calls: {} };
    for (const n of ['cow', 'moo', 'baa', 'coo']) { const d = await SfxOkolje.probe({ spot: n, dur: 3 }); if (d) out.calls[n] = +(db(pk(d)) - eng).toFixed(1); }
    const d = await SfxOkolje.probe({ bed: 'traffic', dur: 6 }); if (d) out.traffic = +(db(rms(d, 22050)) - eng).toFixed(1);
    return out;
  });
  const cv = Object.values(lo.calls);
  T.check('nabor 3 under the engine: the calls 15 to 32 dB, the traffic 20 to 30 dB under it (Normalno)', cv.length === 4 && cv.every(v => v <= -15 && v >= -32) && lo.traffic <= -20 && lo.traffic >= -30, JSON.stringify(lo));
  T.check('no page errors (the second page)', errors.length === 0, errors.slice(0, 5).join(' | '));
  await page.close();
}
const srv = await serve();
const browser = await launch();
let ready = false;
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
  T.check('Nürburg: the forest most of the way, and its villages', cover('nring', 'gozd') > 0.5 && has('nring', 'vas'), 'forest ' + cover('nring', 'gozd').toFixed(2));
  T.check('Katu-Jaryk: the wind stronger at the top than at the bottom', Z.katu.windHi > Z.katu.windLo + 0.1, JSON.stringify([Z.katu.windLo, Z.katu.windHi]));
  T.check("Chapman's Peak: the sea", cover('chapman', 'morje') > 0.2, 'sea ' + cover('chapman', 'morje').toFixed(2));
  T.check('Marrakesh (in the town): little forest, no village of its own', cover('marrakesh', 'gozd') < 0.2 && !has('marrakesh', 'vas'), 'forest ' + cover('marrakesh', 'gozd').toFixed(2));
  // (nabor 3: the herds where World.life put cows or sheep by the road, a town's traffic and pigeons, a circuit's announcer by its stands)
  const cnt = (id, z) => Z[id] ? Z[id].rows.filter(r => r[2] === z).length : 0, list = (z) => ids.filter(id => has(id, z));
  const sets = JSON.stringify({ krave: list('krave'), ovce: list('ovce'), mesto: list('mesto'), razglas: list('razglas') });
  T.check('Spa: its herds of cows by the road, the announcer by the stands; Red Bull Ring: cows', cnt('spa', 'krave') >= 3 && has('spa', 'razglas') && has('rbring', 'krave'), sets);
  T.check('Marrakesh: the town (its traffic, its pigeons) and the announcer; Bathurst: the announcer, no town', has('marrakesh', 'mesto') && has('marrakesh', 'razglas') && has('bathurst', 'razglas') && !has('bathurst', 'mesto'), sets);
  T.check('no announcer on an open road (Rio do Rastro), no herd at Medvode, no wind of ours at Pikes Peak (its own: js/sfx.js)', Z.rastro && !has('rastro', 'razglas') && !has('medvode', 'krave') && Z.pikes && !has('pikes', 'veter'), sets);

  // 2. a race at Medvode with the sound on (the autopilot, the church's bell certain: SfxOkolje.opts)
  await page.evaluate(() => Sfx.resume());
  await startTrack(page, 'medvode');
  await page.evaluate(() => { window.__game.autoDrive = true; SfxOkolje.opts.bellP = 1; SfxOkolje.opts.bellGap = 20; });
  ready = await page.evaluate(() => Sfx.ready);
  if (!ready) T.check('sound running in this browser (skipped: no audio here)', true, 'AudioContext not running');
  else {
    // (a step: t s simulated, two frames drawn (the sound's own: Sfx.update, SfxOkolje.step), then paused where the car is)
    const frame = (t) => page.evaluate((t) => new Promise(res => { const g = window.__game; g.pause(); if (t) g.sim(t, true); g.resume();
      requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); setTimeout(() => { const P = g.race.player; res({ s: Math.round(P.q.s), kmh: Math.round(P.speed * 3.6), L: SfxOkolje.levels() }); }, 150); })); }), t);
    const f0 = await frame(0), prep = await page.evaluate(() => [SfxOkolje.prep(), SfxOkolje.levels(), window.__game.S.amb]);
    T.check('the voices made ahead for Medvode (the river, the bells, the birds; at most 1.5 MB), Normalno by default', prep[0] && prep[1].ready && !prep[1].err && prep[1].voices.includes('river') && prep[1].voices.includes('bells') && prep[1].songs >= 3 && prep[1].bytes > 0 && prep[1].bytes <= 1.5e6 && prep[2] === 1,
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

    // 3. under the engine (offline, Normalno): the beds at a full zone ~24 dB under a car's engine at mid revs, the calls at their nearest ~18
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
    T.check('the beds at a full zone 20 to 30 dB under the engine at mid revs (Normalno)', bv.length >= 6 && bv.every(v => v <= -20 && v >= -30), JSON.stringify(lo));
    T.check('the calls (a bird, a gull, a bell) at their nearest at least 15 dB under it', cv.length === 5 && cv.every(v => v <= -15 && v >= -32), JSON.stringify(lo.calls));

    // 4. the setting (Nastavitve, Zvoki okolja; its value × the loudness): Tiho half of Normalno, Glasno twice it, Izklop nothing at all
    // (no node, no buffer), Normalno again: on; each choice kept with the other settings (tdgp-settings), its button marked
    const st = await page.evaluate(() => { const seg = document.querySelector('.seg[data-set="amb"]'), out = { def: SfxOkolje.levels().full };
      for (const v of ['0.5', '2', '0', '1']) { seg.querySelector('button[data-v="' + v + '"]').click();   // (the buttons in Nastavitve)
        let saved = null; try { saved = JSON.parse(localStorage.getItem('tdgp-settings')).amb; } catch (_) { /* no storage */ }
        const L = SfxOkolje.levels(), b = seg.querySelector('button.sel'); out[v] = { full: L.full, on: L.on, nodes: L.nodes, bytes: L.bytes, saved, sel: b && b.dataset.v }; }
      return out; });
    const back = await frame(0.3);
    const nor = st['1'].full, near = (a, b) => Math.abs(a - b) < 1e-9;
    T.check('Zvoki okolja in four steps: Tiho half of Normalno (the default), Glasno twice, Izklop: nothing at all, Normalno again: on; each kept with the settings, its button marked',
      nor > 0 && near(st.def, nor) && near(st['0.5'].full, 0.5 * nor) && near(st['2'].full, 2 * nor) && !st['0'].on && st['0'].nodes === 0 && st['0'].bytes === 0 && back.L.on &&
      ['0.5', '2', '0', '1'].every(v => String(st[v].saved) === v && st[v].sel === v), JSON.stringify(st) + ' back: ' + back.L.on);

    // 5. the time of day, the weather, the season (Medvode, Normalno; the birds ten times as often, SfxOkolje.opts.birdP, so that none is no
    // chance): at night no bird, the crickets; at dusk in the rain both made, neither heard; in winter no insect at all
    const atm = async (a, rain, n) => {
      await page.evaluate(([a, rain]) => { Render.setAtmos(a); window.__game.race.setRain(rain); SfxOkolje.opts.birdP = 10; }, [a, rain]);
      await frame(0.2);   // (a frame sees the new season and time of day: the voices made again)
      const p = await page.evaluate(() => [SfxOkolje.prep(), SfxOkolje.levels()]), F = [];
      for (let k = 0; k < n; k++) F.push(await frame(0.5));
      return { ok: p[0], voices: p[1].voices, songs: p[1].songs, birds: F[F.length - 1].L.n.birds - p[1].n.birds, cr: F.map(x => x.L.tg.crickets || 0), ci: F.map(x => x.L.tg.cicadas || 0), bed: F.map(x => x.L.beds.crickets || 0), s: [F[0].s, F[F.length - 1].s] };
    };
    const night = await atm({ season: 'summer', tod: 'night' }, 0, 12);
    T.check('at night: no bird, the crickets heard', night.ok && night.songs === 0 && night.birds === 0 && night.voices.includes('crickets') && night.cr.every(v => v > 0) && night.bed.some(v => v > 0.01), JSON.stringify(night));
    const wet = await atm({ season: 'summer', tod: 'dusk' }, 1, 8);
    T.check('at dusk in the rain: the birds and the crickets made, neither heard', wet.ok && wet.songs >= 3 && wet.voices.includes('crickets') && wet.birds === 0 && wet.cr.every(v => v === 0) && wet.ci.every(v => v === 0), JSON.stringify(wet));
    const win = await atm({ season: 'winter', tod: 'day' }, 0, 6);
    T.check('in winter: no insect', win.ok && !win.voices.includes('crickets') && !win.voices.includes('cicadas') && win.cr.every(v => v === 0) && win.ci.every(v => v === 0), JSON.stringify(win));
    await page.evaluate(() => { Render.setAtmos({ season: 'summer', tod: 'day' }); window.__game.race.setRain(0); SfxOkolje.opts.birdP = 1; });

    // 6. the load (Medvode, summer, the voices made): SfxOkolje.step (all it adds to Sfx.update) over up to 600 frames of the race, as a
    // phone's 60 frames a second would share it (it mixes ten times a second); the sound's own thread with the sounds by the road and without
    await frame(0.2);
    const ld = await page.evaluate(async () => {
      const g = window.__game, api = SfxOkolje, st = api.step; api.prep(); let ms = 0, n = 0, max = 0, nodes = 0;
      api.step = function () { const t0 = performance.now(); try { return st.apply(this, arguments); } finally { const t = performance.now() - t0; ms += t; n++; if (t > max) max = t; nodes = Math.max(nodes, api.levels().nodes); } };
      g.resume(); const t0 = performance.now(); let frames = 0;
      try { await new Promise(res => { const f = () => { if (++frames >= 600 || performance.now() - t0 > 30000) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }); }
      finally { api.step = st; g.pause(); }
      const sec = (performance.now() - t0) / 1000;
      return { frames, calls: n, sec: +sec.toFixed(1), avg: +(ms / Math.max(1, n)).toFixed(4), per60: +(ms / sec / 60).toFixed(4), max: +max.toFixed(2), nodes };
    });
    T.check('the load: at most 0.05 ms a frame at 60 frames a second (SfxOkolje.step, up to 600 frames of the race), at most 25 nodes', ld.calls >= 100 && ld.per60 <= 0.05 && ld.nodes <= 25, JSON.stringify(ld));
    // (the sound's own thread: a new race at Medvode, the car left on the grid, its engine idling, the rivals gone after 12 s; the sounds by
    // the road off and on in turn, 4 s each, four times, the birds ten times as often (the most it plays); a CPU tick is 10 ms)
    await startTrack(page, 'medvode');
    await page.evaluate(() => { window.__game.autoDrive = false; SfxOkolje.opts.birdP = 10; });
    await wait(12000);
    const th = audioThread();
    if (!th) T.check('the load on the sound\'s own thread (skipped: no /proc or no such thread here)', true, '');
    else {
      const amb = (v) => page.evaluate((v) => document.querySelector('.seg[data-set="amb"] button[data-v="' + v + '"]').click(), v);
      const span = async (on) => {
        await amb(on ? 1 : 0); if (on) { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await page.evaluate(() => SfxOkolje.prep()); }
        await wait(1500); const a = cpu(th); await wait(4000); const t = cpu(th) - a, L = await page.evaluate(() => SfxOkolje.levels());
        return [t, L.nodes, Object.keys(L.beds).length];
      };
      const on = [], off = []; for (let k = 0; k < 4; k++) { off.push(await span(false)); on.push(await span(true)); }
      const sum = (x) => x.reduce((p, q) => p + q[0], 0), more = sum(on) / Math.max(1, sum(off)) - 1;
      T.check('the load on the sound\'s own thread: the sounds by the road at most 15 % more (off and on in turn, birds, beds)', more <= 0.15 && on.every(x => x[1] > 3), JSON.stringify({ more: +more.toFixed(3), on, off }));
    }

    // 7. Rio do Rastro: the birds (ten times as often) and the forest's rustle along the road; 8. Pikes Peak: no wind of ours (the mountain's
    // own, js/sfx.js), the birds below the treeline
    const run = async (id, n) => {
      await startTrack(page, id);
      await page.evaluate(() => { window.__game.autoDrive = true; SfxOkolje.opts.birdP = 10; });
      await frame(0);
      const p = await page.evaluate(() => [SfxOkolje.prep(), SfxOkolje.levels()]), F = [];
      for (let k = 0; k < n; k++) F.push(await frame(0.5));
      return { ok: p[0], songs: p[1].songs, birds: F[F.length - 1].L.n.birds - p[1].n.birds, rustle: F.map(x => x.L.beds.rustle || 0), wind: F.map(x => x.L.tg.wind || 0), s: [F[0].s, F[F.length - 1].s] };
    };
    const rr = await run('rastro', 12);
    T.check('Rio do Rastro: the birds and the forest', rr.ok && rr.birds >= 1 && rr.rustle.some(v => v > 0.01), JSON.stringify(rr));
    const pk = await run('pikes', 8);
    T.check('Pikes Peak: no wind of ours, its birds', pk.ok && pk.wind.every(v => v === 0) && pk.songs >= 3, JSON.stringify(pk));
    await page.evaluate(() => { SfxOkolje.opts.birdP = 1; });
  }
  // the setting kept between launches: a game opened with Tiho saved starts on Tiho (not reset by the start-up's check), its button marked
  { const g2 = await openGame(browser, srv.base + '/index.html', { amb: 0.5 });
    const k = await g2.page.evaluate(() => { const b = document.querySelector('.seg[data-set="amb"] button.sel'); return [window.__game.S.amb, b && b.dataset.v]; });
    T.check('Zvoki okolja kept between launches (Tiho saved: Tiho at the start, its button marked)', k[0] === 0.5 && k[1] === '0.5' && g2.errors.length === 0, JSON.stringify(k) + ' ' + g2.errors.slice(0, 3).join(' | '));
    await g2.ctx.close(); }
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  if (ready) await speech();
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
