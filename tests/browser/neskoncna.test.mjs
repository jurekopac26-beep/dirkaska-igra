// Neskončna vožnja v prometu (docs/neskoncna-voznja.md, »Predelava na krožne proge«) in the game, on Bathurst: the start as on a phone
// (upright, in real time, from the quick entry and from the menu: after the intro the drive starts), the quick entry
// ?proga=bathurst&nacin=neskoncno, the HUD (the clock, the score, the line with the traffic, the lap and the km; the race's clock, place and
// lap hidden), a close pass's points and the seconds it adds, the clock's warning, the end when it is empty and its results (the top 10, the
// record kept by the level: another level's apart), the end at a touch; in English too; the mode on Bathurst only; the phone's load at the
// densest traffic (x4) within the budget of CLAUDE.md.
// The vehicles' contacts off while the autopilot drives (its driving through the traffic is not what is tested).
//   node tests/browser/neskoncna.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('neskoncna');
const srv = await serve();
const browser = await launch();
const there = (page) => page.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000 });
const go = (page) => page.evaluate(async () => { const g = window.__game; for (let i = 0; i < 20 && g.phase !== 'racing'; i++) { g.sim(1, true); await new Promise(r => requestAnimationFrame(r)); } });
// the phone's load (part 3): perf.test.mjs's settings, its camera's shake and the old knocks among them (SHAKE there)
const PERF = { quality: 'normal', detail: 'low', shadows: 1, camera: 'chase', zoom: 1.2, camShake: 1, camLand: 1, camKerb: 1, camMis: 1, crV: 4 };
const drive = (page, secs) => page.evaluate(async (secs) => { const g = window.__game; for (let i = 0; i < secs && g.screen !== 'results'; i++) { if (g.race && g.race.tf) for (const v of g.race.tf.veh) v.nc = 1e9; g.sim(1, true); await new Promise(r => requestAnimationFrame(r)); } }, secs);
const results = (page, lv) => page.evaluate((lv) => {
  const $ = (id) => document.getElementById(id), recs = JSON.parse(localStorage.getItem('tdgp-records') || '{}').tracks || {}, key = (l) => Object.keys(recs).find(x => new RegExp('^bathurst-endless-' + l + '@').test(x));
  const k = key(lv), E = window.__game.race.en;
  return { title: $('res-title').textContent, sub: $('res-sub').textContent, pos: $('res-pos').textContent, rows: document.querySelectorAll('#res-table tbody tr').length, btn: $('res-restart').textContent,
    head: (document.querySelector('.en-board b') || {}).textContent, board: document.querySelectorAll('.en-board tbody tr').length, me: document.querySelectorAll('.en-board tbody tr.me').length,
    key: k, best: k ? recs[k].bestScore : 0, kept: k ? (recs[k].enBoard || []).length : 0, keys: Object.keys(recs).filter(x => /^bathurst-endless/.test(x)).sort(), score: Math.floor(E.score), why: E.over && E.over.why, lv: E.lv };
}, lv);

try {
  // 0. the start as on a phone (upright 360 x 800, a touch screen, the camera before the start on, as the game has it), from the quick
  // entry and from the menu (Single race > Endless traffic > RACE), the game left to run in real time (no stepping): after the intro the
  // drive starts, the HUD on show and the game's camera following the car. (Bathurst's world films three jets over the grid before a
  // standing start, the HUD hidden, and only the lights end that shot; the endless drive's flying start goes from the intro straight to the
  // race, so the camera stood on the grid while the car drove off: the user's report of 10. 11. 2026, »the intro stays, the game never starts«)
  for (const how of ['quick', 'menu']) {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html' + (how === 'quick' ? '?proga=bathurst&nacin=neskoncno' : ''), { difficulty: 1 }, { width: 360, height: 800 }, { menu: true, touch: true, startCam: true });
    if (how === 'menu') for (const act of ['single', 'mode:endless', 'race-single']) { await page.click(`[data-act="${act}"] >> visible=true`, { timeout: 60000 }); await page.waitForTimeout(400); }
    // (the time driven counts from the line on: the flying start's run up to it first)
    const at = (sec) => page.waitForFunction((sec) => { const r = window.__game.race; return !!(r && r.en && (r.en.time > sec || r.en.over)); }, sec, { timeout: 240000 });
    const look = () => page.evaluate(() => {
      const g = window.__game, r = g.race, P = r.player, c = Render.camera.position, vis = (id) => getComputedStyle(document.getElementById(id)).visibility;
      return { trk: r.track.def.id, mode: r.zbMode, phase: g.phase, shot: document.getElementById('hud').classList.contains('shot'), ck: vis('h-en-ck'), spd: vis('h-spd'), c: [c.x, c.z], p: [P.x, P.z], over: r.en.over && r.en.over.why };
    });
    await at(1); const a = await look(); await at(2.5); const s = await look();
    const d = (u, v) => Math.round(Math.hypot(u[0] - v[0], u[1] - v[1])); Object.assign(s, { cam: d(s.c, s.p), camMove: d(s.c, a.c), carMove: d(s.p, a.p) }); delete s.c; delete s.p;
    T.check(`${how === 'quick' ? '?proga=bathurst&nacin=neskoncno' : 'the menu (Single race > Endless traffic > RACE)'} upright as on a phone, in real time: after the intro the drive starts (no TV shot, the HUD's clock and speed on show, the camera following the car)`,
      (how === 'quick' ? s.trk === 'bathurst' : ['bathurst', 'chapman', 'caracoles', 'balea'].indexOf(s.trk) >= 0) && s.mode === 'endless' && s.phase === 'racing' && !s.shot && s.ck === 'visible' && s.spd === 'visible' && s.carMove > 10 && s.camMove > s.carMove / 2 && s.cam < 80 && !s.over, JSON.stringify(s));
    T.check('no errors on the page (' + how + ', upright)', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // 1. Bathurst in Slovenian, the medium level: the drive, its HUD, two close passes, the warning, the clock empty, the results and the
  // record; then the hard level (a record of its own) ended by a touch; the mode's tracks
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&nacin=neskoncno', { difficulty: 1 }, { width: 412, height: 892 }, { menu: true });
    await there(page); await go(page); await drive(page, 8);
    const s0 = await page.evaluate(() => {
      const r = window.__game.race, h = document.getElementById('hud'), d = (q) => getComputedStyle(document.querySelector(q)).display, tx = (id) => { const e = document.getElementById(id); return e ? e.textContent : null; };
      return { mode: r.zbMode, en: !!r.en, lv: r.en.lv, n: r.cars.length, tf: r.tf.veh.filter(v => !v.off).length, on: h.classList.contains('en-on'), duel: h.classList.contains('duel'), ck: tx('h-en-ck'), clock: r.en.clock, sc: tx('h-en-sc'), ln: [...document.querySelectorAll('#h-en-ln span')].map(e => e.textContent).join(' · '),
        time: d('#h-time'), pos: d('#hud .h-rankrow'), lap: d('#h-lap'), spd: d('#h-spd'), ckd: d('#h-en-ckw'), score: r.en.score, over: !!r.en.over };
    });
    T.check('?nacin=neskoncno on Bathurst: the endless drive, alone in the traffic; the clock running (12 s at the start, medium), the score and the line (PROMET ×1,5 · KROG 1 · … km); the race\'s clock, place and lap hidden, the speed shown',
      s0.mode === 'endless' && s0.en && s0.lv === 1 && s0.n === 1 && s0.tf >= 10 && s0.on && !s0.duel && /^\d+,\d$/.test(s0.ck) && s0.clock > 5 && s0.clock < 12 && Math.abs(parseFloat(s0.ck.replace(',', '.')) - s0.clock) < 0.11 && s0.ckd !== 'none' &&
      /^\d/.test(s0.sc) && s0.score > 0 && /^PROMET ×1,5 · KROG 1 · \d+,\d km$/.test(s0.ln) && s0.time === 'none' && s0.pos === 'none' && s0.lap === 'none' && s0.spd !== 'none' && !s0.over, JSON.stringify(s0));
    const s1 = await page.evaluate(async () => {
      const g = window.__game, E = g.race.en, c0 = E.clock, t0 = E.time; E.time = 0; E._pass(true, { v: 100 / 3.6, min: 0.3 }); E._pass(true, { v: 100 / 3.6, min: 0.7 }); E.time = t0; g.sim(0.05, true); await new Promise(r => requestAnimationFrame(r));
      const pop = document.getElementById('h-en-pop'), cb = document.getElementById('h-en-cb'), add = document.getElementById('h-en-add');
      const big = document.getElementById('h-en-big');
      return { pop: pop.textContent, cls: pop.className, cb: cb.className, cbt: cb.querySelector('b').textContent, bonus: E.bonus, add: add.textContent, addCls: add.className, big: big.textContent, bigCls: big.className, plus: Math.round((E.clock - c0) * 100) / 100, added: Math.round(E.add * 10) / 10 };
    });
    T.check('two close overtakings at 100 km/h: +400 TESNO! (the second, x2), NIZ ×2, +3 s and +2,7 s by the clock (1 s each and the closeness, x1,25 with the combo; at the start of the drive, before the bonus fades), the last big in the middle',
      s1.pop === '+400 TESNO!' && /show/.test(s1.cls) && !/off/.test(s1.cb) && s1.cbt === 'NIZ ×2' && s1.bonus === 900 && s1.add === '+2,7 s' && s1.addCls === 'show' && s1.big === '+2,7 s' && /show/.test(s1.bigCls) &&
      s1.plus > 5.6 && s1.plus <= 5.7 && s1.added === 5.7, JSON.stringify(s1));
    const s2 = await page.evaluate(async () => {
      const g = window.__game, E = g.race.en; E.clock = 4.6; g.sim(0.05, true); await new Promise(r => requestAnimationFrame(r));
      return { low: document.getElementById('h-en-ckw').classList.contains('low'), msg: document.getElementById('h-msg').textContent, ck: document.getElementById('h-en-ck').textContent };
    });
    T.check('under 5 s: the clock red, ČAS SE IZTEKA!', s2.low && s2.msg === 'ČAS SE IZTEKA!' && /^4,\d$/.test(s2.ck), JSON.stringify(s2));
    const m = await page.evaluate(async () => { const g = window.__game, E = g.race.en; E.clock = 0.05; g.sim(0.1, true); await new Promise(r => requestAnimationFrame(r)); return { msg: document.getElementById('h-msg').textContent, why: E.over && E.over.why }; });
    await drive(page, 8);
    await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 30000 });
    const s3 = await results(page, 1);
    T.check('the clock empty: ČAS JE POTEKEL!, the end; the results Nov rekord! (the first run), the score, km and the time driven, why (Čas je potekel.), 14 rows, Vozi znova',
      m.why === 'time' && m.msg === 'ČAS JE POTEKEL!' && s3.why === 'time' && s3.title === 'Nov rekord!' && /^\d[\d ]* točk · \d+,\d km · \d+:\d\d\. Čas je potekel\.$/.test(s3.sub) && s3.pos === '1' && s3.rows === 14 && s3.btn === 'Vozi znova', JSON.stringify(Object.assign({ m }, s3)));
    T.check('the top 10 under the results (Najboljših 10 · Bathurst, Avstralija · Srednja, this run marked), the record kept by the level (bathurst-endless-1@…: bestScore, enBoard)',
      s3.head === 'Najboljših 10 · Bathurst, Avstralija · Srednja' && s3.board === 1 && s3.me === 1 && !!s3.key && s3.best === s3.score && s3.kept === 1, JSON.stringify(s3));
    // the hard level: its clock, a record of its own; a knock of a vehicle at speed takes two lives (the car still drives), the next one ends it
    await page.evaluate(() => { const g = window.__game; g.S.difficulty = 2; g.onAction('restart'); });
    await go(page); await drive(page, 3);
    const h0 = await page.evaluate(async () => { const g = window.__game, r = g.race; const o = { lv: r.en.lv, clock: r.en.clock, start: Core.EN.clock[2], dens: r.tf.win.dens }; r.tf.win.hit++; r.tf.win.imp = 13; g.sim(0.1, true); await new Promise(q => requestAnimationFrame(q)); o.msg = document.getElementById('h-msg').textContent; o.lives = r.en.lives; o.why1 = r.en.over && r.en.over.why;
      g.sim(1.2, true); r.tf.win.hit++; r.tf.win.imp = 5; g.sim(0.1, true); o.why = r.en.over && r.en.over.why; return o; });
    await drive(page, 8);
    await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 30000 });
    const s4 = await page.evaluate(() => { const recs = JSON.parse(localStorage.getItem('tdgp-records') || '{}').tracks || {}, ks = Object.keys(recs).filter(x => /^bathurst-endless/.test(x)).sort();
      return { keys: ks, n: ks.map(k => (recs[k].enBoard || []).length), sub: document.getElementById('res-sub').textContent, title: document.getElementById('res-title').textContent, head: (document.querySelector('.en-board b') || {}).textContent }; });
    T.check('Težka: 10 s at the start, the traffic x2; a hard knock of a vehicle: two lives off, AVTO JE POŠKODOVAN, still on; one more: Preveč trkov.', h0.lv === 2 && h0.start === 10 && h0.clock <= 10 && h0.clock > 5 && h0.dens === 2 && h0.lives === 1 && !h0.why1 && h0.msg === 'AVTO JE POŠKODOVAN' && h0.why === 'hits', JSON.stringify(h0));
    T.check('its own record (bathurst-endless-2@…, Nov rekord!, Preveč trkov.), the medium one\'s kept apart', s4.keys.length === 2 && /^bathurst-endless-1@/.test(s4.keys[0]) && /^bathurst-endless-2@/.test(s4.keys[1]) && s4.n.join() === '1,1' &&
      s4.title === 'Nov rekord!' && / Preveč trkov\.$/.test(s4.sub) && s4.head === 'Najboljših 10 · Bathurst, Avstralija · Težka', JSON.stringify(s4));
    const md = await page.evaluate(() => { const m = (id) => { const d = Core.TRACKS.find(x => x.id === id); return Zabava.modes(d, d.modes || ['race']).indexOf('endless') >= 0; };
      return { all: Core.TRACKS.filter(d => m(d.id)).map(d => d.id), q: Core.quickArgs('?proga=vrsic&nacin=neskoncno').mode }; });
    T.check('the mode on its four tracks (Bathurst and three open roads with everyday traffic; not on the test tracks); ?proga=vrsic&nacin=neskoncno: none', md.all.slice().sort().join() === 'balea,bathurst,caracoles,chapman' && md.q === null, JSON.stringify(md));
    T.check('no errors on the page', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 2. in English, landscape: the HUD's words and the results
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&nacin=endless', { lang: 'en', difficulty: 1 }, { width: 640, height: 360 }, { menu: true });
    await there(page); await go(page); await drive(page, 4);
    const s0 = await page.evaluate(() => ({ mode: window.__game.race.zbMode, ln: [...document.querySelectorAll('#h-en-ln span')].map(e => e.textContent).join(' · '), pts: document.querySelector('#h-en-map .en-sc small').textContent, ck: document.getElementById('h-en-ck').textContent,
      under: (() => { const m = document.getElementById('h-map').getBoundingClientRect(), b = document.getElementById('h-en-map').getBoundingClientRect(); return b.top >= m.bottom - 1 && b.left >= m.left - 1 && b.right <= m.right + 1; })() }));
    T.check('?nacin=endless on Bathurst in English: TRAFFIC ×1.5 · LAP 1 · … km, POINTS, the clock with a point; the points and the traffic under the minimap (the user, 12. 11. 2026)', s0.mode === 'endless' && /^TRAFFIC ×1\.5 · LAP 1 · \d+\.\d km$/.test(s0.ln) && s0.pts === 'POINTS' && /^\d+\.\d$/.test(s0.ck) && s0.under, JSON.stringify(s0));
    await page.evaluate(() => { const r = window.__game.race; r.en.lives = 1; r.player.hitWall = 9; });
    await drive(page, 8);
    await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 30000 });
    const s1 = await page.evaluate(() => ({ title: document.getElementById('res-title').textContent, sub: document.getElementById('res-sub').textContent, btn: document.getElementById('res-restart').textContent, head: document.querySelector('.en-board b').textContent }));
    T.check('the results in English: New record!, Too many crashes., Drive again, Top 10 · Bathurst, Australia · Medium', s1.title === 'New record!' && / Too many crashes\.$/.test(s1.sub) && s1.btn === 'Drive again' && s1.head === 'Top 10 · Bathurst, Australia · Medium', JSON.stringify(s1));
    T.check('no errors on the page (English)', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
  // 3. the phone's load at the densest traffic (x4): perf.test.mjs's settings (844x390, normal quality, NIZKA detail, shadows, the camera's
  // shake on), six places 15 s apart on autopilot (the run kept alive: no knocks, the clock kept up), every WebGL draw counted (all passes);
  // within the budget of CLAUDE.md (300 draw calls, 900k vertices, on average and at the busiest place)
  {
    const { ctx, page, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&nacin=neskoncno', PERF, { width: 844, height: 390 }, { menu: true, seed: 12345 });
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
      const st = E.step.bind(E); E.step = (dt) => { P.hitWall = 0; E.clock = 60; for (const v of tf.veh) v.nc = 1e9; return st(dt); };
      E.time = 600; g.sim(0.5, true);
      const s = [], near = [], miss = [];
      for (let k = 0; k < 6; k++) {
        for (let i = 0; i < 15 && !E.over; i++) g.sim(1, true);
        Render.resetCam(); for (let i = 0; i < 10; i++) Render.frame(1 / 60, 1, P, g.S.camera, {});   // (the camera settles)
        const c0 = __gl.calls, v0 = __gl.verts; Render.frame(1 / 60, 1, P, g.S.camera, {}); s.push([__gl.calls - c0, __gl.verts - v0]);
        near.push(tf.veh.filter(v => !v.off && !tf._dead(v) && Math.hypot(v.x - P.x, v.z - P.z) < 250).length);
        const cx = Render.cam.vcx, cz = Render.cam.vcz;   // (every vehicle within 250 m of the view's centre drawn, as updateRoad picks them: none over its mesh's places)
        miss.push(tf.veh.filter(v => !v.off && !v.hid && (v.x - cx) ** 2 + (v.z - cz) ** 2 <= 250 * 250).length - Render.roadInfo().veh);
      }
      // (and the whole pool at once, all of it within 90 m of the view's centre and then all 110-240 m off, the far stand-ins: every vehicle
      // drawn, as many places in each mesh as the pool has vehicles for it)
      const cx = Render.cam.vcx, cz = Render.cam.vcz, all = [];
      for (const [r0, r1] of [[10, 80], [110, 240]]) {
        tf.veh.forEach((u, k) => { const a = k * 2.4, d = r0 + (r1 - r0) * ((k * 0.618) % 1); u.off = false; u.hid = false; u.x = cx + Math.cos(a) * d; u.z = cz + Math.sin(a) * d; });
        Render.frame(1 / 60, 1, P, g.S.camera, {}); all.push(tf.veh.length - Render.roadInfo().veh);
      }
      const c = s.map(x => x[0]), v = s.map(x => x[1]);
      return { pool: tf.veh.length, all, mode: race.zbMode, dens: tf.win.dens, over: E.over && E.over.why, lap: E.lap, km: Math.round(E.dist / 100) / 10, calls: Math.round(c.reduce((a, b) => a + b) / 6), maxCalls: Math.max(...c), kverts: Math.round(v.reduce((a, b) => a + b) / 6 / 1000), maxKverts: Math.round(Math.max(...v) / 1000), near: Math.max(...near), miss: Math.max(...miss) };
    });
    T.check('bathurst: x4 traffic (vehicles within 250 m) within the phone budget (300 draw calls, 900k vertices; on average and at the busiest)',
      r.mode === 'endless' && r.dens === 4 && !r.over && r.near >= 6 && r.calls <= 300 && r.maxCalls <= 300 && r.kverts <= 900 && r.maxKverts <= 900, JSON.stringify(r));
    T.check('bathurst: x4, every vehicle within 250 m drawn (the meshes\' places from the window\'s pool)', r.miss === 0, 'not drawn: ' + r.miss);
    T.check(`bathurst: the whole pool (${r.pool}) drawn at once, near and far (none over its mesh's places)`, r.all.every(n => n === 0), 'not drawn near, far: ' + r.all.join(', '));
    T.check('no errors on the page (bathurst, x4)', !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} catch (e) {
  T.check('the test ran to its end', false, String(e && e.stack || e).slice(0, 600));
} finally {
  await browser.close(); await srv.close();
}
T.done();
