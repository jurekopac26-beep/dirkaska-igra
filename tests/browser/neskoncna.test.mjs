// Neskončna vožnja v prometu (docs/neskoncna-voznja.md) in the game: the quick entry ?proga=vrsic&nacin=neskoncno, the HUD (the score,
// the line with the traffic, the stage and the km; the clock and the place hidden), a close pass's points and the combo, on again from
// the road's start (ETAPA 2), the crash and its results (the top 10, the record kept), in English too; a circuit has no endless drive;
// the phone's load at the densest traffic (x4) within the budget of CLAUDE.md.
// The vehicles' contacts off while the autopilot drives (its driving through the traffic is not what is tested).
//   node tests/browser/neskoncna.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('neskoncna');
const srv = await serve();
const browser = await launch();
const there = (page) => page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
const frame = () => new Promise(r => requestAnimationFrame(r));
const go = (page) => page.evaluate(async () => { const g = window.__game; for (let i = 0; i < 20 && g.phase !== 'racing'; i++) { g.sim(1, true); await new Promise(r => requestAnimationFrame(r)); } });
// the phone's load (part 4): perf.test.mjs's settings, its camera's shake and the old knocks among them (SHAKE there)
const PERF = { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, camShake: 1, camLand: 1, camKerb: 1, camMis: 1, crV: 4 };
const PERF_HEAVY = ['tianmen'], PERF_ROADS = ['vrsic', 'greatalpine', ...PERF_HEAVY];
const drive = (page, secs) => page.evaluate(async (secs) => { const g = window.__game; for (let i = 0; i < secs && g.screen !== 'results'; i++) { if (g.race && g.race.tf) for (const v of g.race.tf.veh) v.nc = 1e9; g.sim(1, true); await new Promise(r => requestAnimationFrame(r)); } }, secs);

try {
  // 1. Vršič in Slovenian: the drive, its HUD, a close pass, the road's start again, the crash, the results and the record
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=vrsic&nacin=neskoncno', {}, { width: 412, height: 892 }, { menu: true });
    await there(page); await go(page); await drive(page, 8);
    const s0 = await page.evaluate(() => {
      const r = window.__game.race, h = document.getElementById('hud'), d = (q) => getComputedStyle(document.querySelector(q)).display, tx = (id) => { const e = document.getElementById(id); return e ? e.textContent : null; };
      return { mode: r.zbMode, en: !!r.en, n: r.cars.length, on: h.classList.contains('en-on'), duel: h.classList.contains('duel'), sc: tx('h-en-sc'), ln: tx('h-en-ln'), time: d('#h-time'), pos: d('#hud .h-rankrow'), lap: d('#h-lap'), spd: d('#h-spd'), score: r.en.score, over: !!r.en.over };
    });
    T.check('?nacin=neskoncno on Vršič: the endless drive, alone in the traffic; the score and the line (PROMET ×… · ETAPA 1 · … km); the clock, the place and the lap hidden, the speed shown',
      s0.mode === 'endless' && s0.en && s0.n === 1 && s0.on && !s0.duel && /^\d/.test(s0.sc) && s0.score > 0 && /^PROMET ×1,\d · ETAPA 1 · \d+,\d km$/.test(s0.ln) && s0.time === 'none' && s0.pos === 'none' && s0.lap === 'none' && s0.spd !== 'none' && !s0.over, JSON.stringify(s0));
    const s1 = await page.evaluate(async () => {
      const g = window.__game, E = g.race.en; E._near('vnear', { v: 100 / 3.6, min: 0.3 }); E._near('near', { v: 100 / 3.6, min: 0.7 }); g.sim(0.05, true); await new Promise(r => requestAnimationFrame(r));
      const pop = document.getElementById('h-en-pop'), cb = document.getElementById('h-en-cb');
      return { pop: pop.textContent, cls: pop.className, cb: cb.className, cbt: cb.querySelector('b').textContent, bonus: E.bonus };
    });
    T.check('two close passes: +400 TESNO! over the score (the second, x2), NIZ ×2 with its time', s1.pop === '+400 TESNO!' && /show/.test(s1.cls) && !/off/.test(s1.cb) && s1.cbt === 'NIZ ×2' && s1.bonus === 900, JSON.stringify(s1));
    const s2 = await page.evaluate(async () => {
      const g = window.__game, r = g.race, sc = r.en.score; r.en._wrap(); g.sim(0.1, true); await new Promise(q => requestAnimationFrame(q));
      return { stage: r.en.stage, ln: document.getElementById('h-en-ln').textContent, msg: document.getElementById('h-msg').textContent, fade: !!document.getElementById('en-fade'), s: Math.round(r.player.q.s - r.track.startS), kept: r.en.score >= sc, combo: r.en.combo };
    });
    T.check('on again from the start of the road: ETAPA 2 on the screen and in the line, the car at the start line, the score and the combo kept', s2.stage === 2 && s2.msg === 'ETAPA 2' && / · ETAPA 2 · /.test(s2.ln) && s2.fade && s2.s >= -2 && s2.s < 15 && s2.kept && s2.combo === 2, JSON.stringify(s2));
    await page.evaluate(() => { window.__game.race.player.hitWall = 9; });
    await drive(page, 8);
    await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 30000 });
    const s3 = await page.evaluate(() => {
      const $ = (id) => document.getElementById(id), recs = JSON.parse(localStorage.getItem('tdgp-records') || '{}').tracks || {}, k = Object.keys(recs).find(x => /^vrsic-endless@/.test(x));
      return { title: $('res-title').textContent, sub: $('res-sub').textContent, pos: $('res-pos').textContent, rows: document.querySelectorAll('#res-table tbody tr').length, btn: $('res-restart').textContent,
        board: document.querySelectorAll('.en-board tbody tr').length, me: document.querySelectorAll('.en-board tbody tr.me').length, key: k, best: k ? recs[k].bestScore : 0, kept: k ? (recs[k].enBoard || []).length : 0, score: Math.floor(window.__game.race.en.score), why: window.__game.race.en.over && window.__game.race.en.over.why };
    });
    T.check('the wall at 9 m/s: the end; the results Nov rekord! (the first run), the score, km and the stage, why (Trk v ograjo.), nine rows, Vozi znova',
      s3.why === 'wall' && s3.title === 'Nov rekord!' && /^\d[\d ]* točk · \d+,\d km · etapa 2\. Trk v ograjo\.$/.test(s3.sub) && s3.pos === '1' && s3.rows === 9 && s3.btn === 'Vozi znova', JSON.stringify(s3));
    T.check('the top 10 under the results (this run marked), the record kept (records: vrsic-endless@…: bestScore, enBoard)', s3.board === 1 && s3.me === 1 && !!s3.key && s3.best === s3.score && s3.kept === 1, JSON.stringify(s3));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 2. in English: the HUD's words and the results
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=chapman&nacin=endless', { lang: 'en' }, { width: 640, height: 360 }, { menu: true });
    await there(page); await go(page); await drive(page, 4);
    const s0 = await page.evaluate(() => ({ mode: window.__game.race.zbMode, ln: document.getElementById('h-en-ln').textContent, pts: document.querySelector('#h-en .en-sc small').textContent }));
    T.check('?nacin=endless on Chapman\'s Peak in English: TRAFFIC ×… · STAGE 1 · … km, POINTS', s0.mode === 'endless' && /^TRAFFIC ×1\.\d · STAGE 1 · \d+\.\d km$/.test(s0.ln) && s0.pts === 'POINTS', JSON.stringify(s0));
    await page.evaluate(() => { window.__game.race.player.hitWall = 9; });
    await drive(page, 8);
    await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 30000 });
    const s1 = await page.evaluate(() => ({ title: document.getElementById('res-title').textContent, btn: document.getElementById('res-restart').textContent, head: document.querySelector('.en-board b').textContent }));
    T.check('the results in English: New record!, Drive again, Top 10 · Chapman\'s Peak, South Africa', s1.title === 'New record!' && s1.btn === 'Drive again' && /^Top 10 · Chapman's Peak, South Africa$/.test(s1.head), JSON.stringify(s1));
    T.check('no errors on the page (English)', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 3. a circuit: no endless drive (the quick entry refuses it, the game's modes do not have it)
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&nacin=neskoncno', {}, { width: 412, height: 892 }, { menu: true });
    await there(page);
    const s0 = await page.evaluate(() => { const m = (id) => { const d = Core.TRACKS.find(x => x.id === id); return Zabava.modes(d, d.modes || ['race']); }; return { here: m('bathurst'), vrsic: m('vrsic'), jezero: m('jezero'), q: Core.quickArgs('?proga=bathurst&nacin=neskoncno').mode, en: !!(window.__game.race && window.__game.race.en) }; });
    T.check('Bathurst: no endless drive (not among its modes, the quick entry refuses it, no race.en); Vršič has it', !s0.en && s0.q === null && s0.here.indexOf('endless') < 0 && s0.vrsic.indexOf('endless') >= 0, JSON.stringify(s0));
    T.check('no errors on the page (Bathurst)', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 4. the phone's load at the densest traffic (x4: 15 km on): perf.test.mjs's settings (844x390, normal quality, NIZKA detail, shadows, the
  // camera's shake on), six places 15 s apart on autopilot (the run kept alive: no knocks), every WebGL draw counted (all passes); within the
  // budget of CLAUDE.md (300 draw calls, 900k vertices, on average and at the busiest place). The roads: Vršič and Great Alpine Road (the
  // plan) and PERF_HEAVY (the heaviest of the eleven at x4, measured 5. 11. 2026, docs/neskoncna-voznja.md, Izvedba)
  for (const id of PERF_ROADS) {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=' + id + '&nacin=neskoncno', PERF, { width: 844, height: 390 }, { menu: true, seed: 12345 });
    await there(page);
    const r = await page.evaluate(() => {
      window.__gl = { calls: 0, verts: 0 };
      const gl = document.querySelector('canvas').getContext('webgl2') || document.querySelector('canvas').getContext('webgl');
      const GP = Object.getPrototypeOf(gl), wrap = (name, count) => { const f = GP[name]; if (!f) return; GP[name] = function (...a) { window.__gl.calls++; window.__gl.verts += count(a); return f.apply(this, a); }; };
      wrap('drawElements', a => a[1]); wrap('drawArrays', a => a[2]); wrap('drawElementsInstanced', a => a[1] * a[4]); wrap('drawArraysInstanced', a => a[2] * a[3]);
      // (as perf.test.mjs: a fresh run with Math.random seeded, paused at once, stepped and drawn only here: the same counts on every machine)
      const g = window.__game; let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      g.onAction('restart'); g.pause(); for (let i = 0; i < 20 && g.phase !== 'racing'; i++) g.sim(1, true);
      const race = g.race, E = race.en, tf = race.tf, P = race.player;
      const st = E.step.bind(E); E.step = (dt) => { P.hitWall = 0; for (const v of tf.veh) v.nc = 1e9; return st(dt); };
      E.dist = 15000; g.sim(0.1, true);
      const s = [], near = [];
      for (let k = 0; k < 6; k++) {
        for (let i = 0; i < 15 && !E.over; i++) g.sim(1, true);
        Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});   // (the camera settles)
        const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, g.S.camera, {}); s.push([__gl.calls - c0, __gl.verts - v0]);
        near.push(tf.veh.filter(v => !v.off && !tf._dead(v) && Math.hypot(v.x - P.x, v.z - P.z) < 250).length);
      }
      const c = s.map(x => x[0]), v = s.map(x => x[1]);
      return { mode: race.zbMode, dens: tf.win.dens, over: E.over && E.over.why, calls: Math.round(c.reduce((a, b) => a + b) / 6), maxCalls: Math.max(...c), kverts: Math.round(v.reduce((a, b) => a + b) / 6 / 1000), maxKverts: Math.round(Math.max(...v) / 1000), near: Math.max(...near) };
    });
    T.check(`${id}: x4 traffic (vehicles within 250 m) within the phone budget (300 draw calls, 900k vertices; on average and at the busiest)`,
      r.mode === 'endless' && r.dens === 4 && !r.over && r.near >= 10 && r.calls <= 300 && r.maxCalls <= 300 && r.kverts <= 900 && r.maxKverts <= 900, JSON.stringify(r));
    T.check(`no errors on the page (${id}, x4)`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} catch (e) {
  T.check('the test ran to its end', false, String(e && e.stack || e).slice(0, 600));
} finally {
  await browser.close(); await srv.close();
}
T.done();
