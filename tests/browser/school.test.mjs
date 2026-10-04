// The driving school (Šola vožnje) and the racing line helper: the school's screen (four lessons, each with its medals and the best);
// the start: the throttle before the lights go out is a jump start, after them the time to 100 m against its medals; braking to a mark
// on the Red Bull Ring's straight (the STOP line and its boards): over the line, too slow past the 100 m board, and a stop half a metre
// short of it (gold); the racing line: a lap on the autopilot on the line the helper draws (gold, the achievement), the result kept on the
// school's screen; drift: 40 s on the autopilot, as many points as its reference run (silver). The helper in a race (the setting): the
// ribbon ahead of the car, green, yellow, red with the braking points; off again: none.
//   node tests/browser/school.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('school');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: 'chase', track: 'jezero', line: 0, autoGas: 0 }, { width: 390, height: 844 });
  const act = (a) => page.evaluate((a) => window.__game.onAction(a), a);
  const go = async (id) => { await page.evaluate((id) => window.__game.onAction('school-go', document.querySelector(`[data-act="school-go"][data-lesson="${id}"]`)), id);
    await page.waitForFunction((id) => { const g = window.__game; return g.school && g.school.id === id && g.race && g.phase === 'intro'; }, id, { timeout: 60000 }); };
  const res = () => page.evaluate(() => ({ screen: window.__game.screen, title: document.getElementById('res-title').textContent, pos: document.getElementById('res-pos').textContent, sub: document.getElementById('res-sub').textContent,
    rows: [...document.querySelectorAll('#res-table tbody tr')].map(r => r.innerText.replace(/\s+/g, ' ').trim()), school: !document.getElementById('res-school').classList.contains('off'), replay: !document.getElementById('res-replay').classList.contains('off'),
    again: document.getElementById('res-restart').textContent }));
  const toRacing = () => page.waitForFunction(() => window.__game.phase === 'racing', null, { timeout: 60000 });
  // the helper's line over a run: the most of each colour seen in a frame, the braking points (a second at a time, a frame after each)
  const lineRun = (sec) => page.evaluate(async (sec) => { const g = window.__game, o = { green: 0, yellow: 0, red: 0, brakes: 0, frames: 0 };
    g.pause();   // (paused, the frames still draw the line; the race runs only in the simulated seconds, on the autopilot)
    for (let k = 0; k < sec && g.phase !== 'done'; k++) { g.sim(1, true); if (g.phase === 'done') break; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const L = Render.show.line;
      if (L) { o.frames++; for (const c of ['green', 'yellow', 'red', 'brakes']) o[c] = Math.max(o[c], L[c]); } }
    return o; }, sec);
  const num = (re, s) => { const m = re.exec(s || ''); return m ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) : NaN; };

  // 1. the school's screen
  await act('to-school'); await page.waitForTimeout(300);
  const s1 = await page.evaluate(() => [...document.querySelectorAll('.sch')].map(e => ({ name: e.querySelector('.sch-h b').textContent, t: e.querySelector('.sch-t').textContent, b: e.querySelector('.sch-b').textContent, go: !!e.querySelector('[data-act="school-go"]') })));
  T.check('the school: four lessons (Štart, Zaviranje do oznake, Idealna linija, Drift), each its three medals and the best so far', s1.length === 4 && s1.map(x => x.name).join() === 'Štart,Zaviranje do oznake,Idealna linija,Drift' &&
    s1.every(x => x.go && /🥇.*🥈.*🥉/.test(x.t) && x.b === 'Tvoj najboljši: –'), JSON.stringify(s1));

  // 2. the start: a jump start, then a proper one
  await go('start');
  await page.waitForFunction(() => window.__game.phase === 'lights', null, { timeout: 30000 });
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(700); await page.keyboard.up('ArrowUp');
  await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 30000 });
  const j = await res();
  T.check('the start: the throttle before the lights go out is a jump start (Neuspešno), the school\'s own buttons', j.title === 'Neuspešno' && /Prehiter štart/.test(j.sub) && j.school && !j.replay && j.again === 'Ponovi vajo', JSON.stringify(j));
  await act('restart'); await toRacing();
  await page.evaluate(() => window.__game.sim(8, true));
  await page.waitForFunction(() => window.__game.screen === 'results', null, { timeout: 30000 });
  const st = await res(), sm = await page.evaluate(() => window.__game.schoolMedals('start'));
  const t100 = num(/100 m v ([\d,]+) s/, st.sub);
  const want = t100 <= sm.m[0] ? 'Zlata medalja!' : t100 <= sm.m[1] ? 'Srebrna medalja!' : t100 <= sm.m[2] ? 'Bronasta medalja!' : 'Brez medalje';
  T.check('the start: the time to 100 m after the lights (a little over the autopilot\'s own), its medal', t100 >= sm.ref - 0.02 && t100 < sm.ref + 1.5 && st.title === want && Math.abs(sm.rec.best - t100) < 0.01 && st.rows.length === 5 && /^🥇 Zlato ≤ \d,\d\d s$/.test(st.rows[0]), JSON.stringify({ t100, ref: sm.ref, m: sm.m, title: st.title, rows: st.rows }));

  // 3. braking to a mark: over the line; too slow; stopped half a metre short
  await act('to-school'); await go('brake');
  const mk = await page.evaluate(() => Render.show.marks);
  await toRacing();
  await page.evaluate(() => window.__game.drive(60, () => ({ thr: 1 })));
  const over = await res();
  await act('restart'); await toRacing();
  await page.evaluate(() => window.__game.drive(60, () => ({ thr: 0.15 })));
  const slow = await res();
  await act('restart'); await toRacing();
  // (braking at 90 m to go: where it stops; then again braking that much later, to stop half a metre short)
  await page.evaluate(() => window.__game.drive(60, (P, live) => (live != null && live <= 90 ? { brk: 1 } : { thr: 1 })));
  const b1 = await res(), d1 = num(/ustavil ([\d,]+) m/, b1.sub);
  // (braking later means braking from a higher speed: the stop moves by more than the braking point; a few tries, the secant between them)
  let at0 = 90, dd0 = d1, at = 90 - (d1 - 0.5) / 1.3, b2 = null, d2 = NaN;
  for (let k = 0; k < 4; k++) {
    await act('restart'); await toRacing();
    await page.evaluate((at) => window.__game.drive(60, (P, live) => (live != null && live <= at ? { brk: 1 } : { thr: 1 })), at);
    b2 = await res(); d2 = num(/ustavil ([\d,]+) m/, b2.sub); const dd = Number.isFinite(d2) ? d2 : -1.5;
    if (dd >= 0.15 && dd <= 0.95) break;
    const nx = at - (dd - 0.5) * (at - at0) / (dd - dd0 || 1); at0 = at; dd0 = dd; at = nx;
  }
  T.check('braking: the STOP line and its boards (150, 100, 50) on the straight; over the line, too slow past the 100 m board: no medal', mk === 9 && over.title === 'Neuspešno' && /Čez črto STOP/.test(over.sub) && slow.title === 'Neuspešno' && /Prepočasi/.test(slow.sub), JSON.stringify({ mk, over: over.sub, slow: slow.sub }));
  T.check('braking: the stop measured (braking at 90 m to go: some metres short), braking that much later: half a metre short, gold', d1 > 1 && d1 < 60 && d2 >= 0.15 && d2 <= 0.95 && b2.title === 'Zlata medalja!' && b2.pos === '🥇', JSON.stringify({ d1, d2, b1: b1.sub, b2: b2.sub }));

  // 4. the racing line: a lap on the autopilot on the helper's line
  await act('to-school'); await go('line');
  await toRacing();
  const ln = await lineRun(200);   // (the whole lap, a second at a time)
  const li = await res(), ach = await page.evaluate(() => Object.keys(window.__game.stats.ach));
  T.check('the racing line: the helper\'s line drawn in the lesson (green, yellow, red, braking points)', ln.frames > 30 && ln.green > 5 && ln.yellow > 5 && ln.red > 5 && ln.brakes >= 1, JSON.stringify(ln));
  T.check('the racing line: the autopilot\'s lap nearly all on the line, in the time: gold, the achievement Učenec', li.title === 'Zlata medalja!' && /Na idealni liniji (9\d|100) % kroga/.test(li.sub) && ach.includes('school'), JSON.stringify({ li: li.sub, ach }));
  await act('to-school'); await page.waitForTimeout(200);
  const s4 = await page.evaluate(() => [...document.querySelectorAll('.sch')].map(e => ({ gold: e.classList.contains('gold'), b: e.querySelector('.sch-b').textContent, m: e.querySelector('.sch-m').textContent })));
  T.check('back on the school\'s screen: the bests and the medals kept (the braking and the line gold)', s4[1].gold && s4[2].gold && /Tvoj najboljši: 0,\d\d m/.test(s4[1].b) && /Tvoj najboljši: (9\d|100) %/.test(s4[2].b) && s4[2].m === '🥇', JSON.stringify(s4));

  // 5. drift: 40 s on the autopilot
  await go('drift'); await toRacing();
  await page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 30 && g.phase !== 'done'; k++) g.sim(2, true); });
  const dr = await res(), dm = await page.evaluate(() => window.__game.schoolMedals('drift'));
  const pts = num(/^Drift: ([\d.]+) točk/, dr.sub);
  T.check('drift: 40 s on the autopilot, about as many points as its reference run: silver', Math.abs(pts / dm.ref - 1) < 0.15 && dr.title === 'Srebrna medalja!' && pts >= dm.m[1] && pts < dm.m[0], JSON.stringify({ pts, ref: dm.ref, m: dm.m, title: dr.title }));

  // 6. the helper in a race: on with the setting, off without
  await act('to-title');
  await page.evaluate(() => { window.__game.onAction('to-settings'); document.querySelector('[data-set="line"] button[data-v="1"]').click(); window.__game.onAction('settings-done'); });
  await startTrack(page, 'jezero');
  const r1 = await lineRun(25);
  await page.evaluate(() => { window.__game.onAction('to-title'); window.__game.onAction('to-settings'); document.querySelector('[data-set="line"] button[data-v="0"]').click(); window.__game.onAction('settings-done'); });
  await startTrack(page, 'jezero');
  const r0 = await page.evaluate(async () => { const g = window.__game; g.pause(); g.sim(4, true); g.resume(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return Render.show.line; });
  T.check('the helper in a race (Nastavitve · Idealna linija): the line ahead of the car (green, yellow, red, braking points); switched off: none', r1.frames > 10 && r1.green > 5 && r1.red > 5 && r1.brakes >= 1 && r0 === null, JSON.stringify({ r1, r0 }));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
