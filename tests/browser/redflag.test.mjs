// The red flag in the game (Bathurst, Avstralija: the race stopped by hand after 50 s, the player on the red flag's autopilot; the queue
// in the pit lane): the message (RDEČA ZASTAVA, red), the first time a toast, the team radio and the commentator ('red'); the flag on the
// HUD, the autopilot's bar (AVTOPILOT · RDEČA ZASTAVA: the km to the pits, the place in the queue once standing in it, the count to the
// restart, behind the safety car; its line only ever filling within each part) and the autopilot's sign on the touch controls; slowly in
// (RED.v), into the pit lane and standing in the queue, the crew staying in the garage (no stop), the pit exit's light red; meanwhile no
// duels, places, gaps, other cars' pit stops nor the places' racing lines told, and the lap on the autopilot no clean lap (an achievement).
// Posnetek do sem in the queue: the replay has the red flag where it was out and none before it, and the race goes on with the red flag
// as it was (and the race's own pit state for the crew, not the replay's). The hold (PONOVNI ŠTART ČEZ 7 s), the restart
// (PONOVNI ŠTART, the radio, the commentator 'redGo', the safety car's board, the exit's light green), the hand-back once out of the lane
// (VOZIŠ TI!: the bar and the sign gone), the safety car in and green at the line; no page errors.
//   node tests/browser/redflag.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the red flag (bathurst)');
const srv = await serve();
const browser = await launch();
try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', track: 'bathurst', weather: 'dry', length: 'long', radio: 1 }, { width: 640, height: 360 }, { seed: 7 });
  await startTrack(page, 'bathurst');
  // the race's state and the HUD's
  const st = () => page.evaluate(() => { const g = window.__game, r = g.race, P = r.player, F = r.fl, R = F && F.red, el = (id) => document.getElementById(id), H = el('h-pit'), C = Render.crew;
    return { t: +r.time.toFixed(1), red: R ? R.st : '-', sc: F && F.sc ? F.sc.state + (F.sc.red ? 'R' : '') : '-', rq: !!(P.fl && P.fl.rq), inPit: !!P.inPit, v: +P.speed.toFixed(1),
      flag: el('h-flag').className + ':' + el('h-flag').textContent, pit: H.className, title: H.children[0].textContent, label: H.children[1].textContent, bar: parseFloat(H.lastElementChild.firstElementChild.style.width) || 0,
      msg: el('h-msg').className + ':' + el('h-msg').textContent, ap: el('touch').classList.contains('ap'), crew: C ? C.mode : '-', exit: C && C.exit ? C.exit.key || '' : '-', phase: g.phase }; });
  // step the race (paused, the player on the game's autopilot as given: the red flag's own drives it), then two drawn frames
  const sim = (t) => page.evaluate((t) => new Promise(res => { const g = window.__game; g.pause(); g.sim(t, true); g.resume();
    requestAnimationFrame(() => requestAnimationFrame(() => { g.pause(); res(); })); }), t);
  await sim(50);
  // what the game tells from here on: the commentator's keys, the HUD's messages, the toasts and the team radio as they come
  await page.evaluate(() => { const C = window.__game.comm, o = C.say; window.__said = []; C.say = function (k) { window.__said.push(k); return o.apply(this, arguments); };
    window.__told = []; const last = {};   // (each one once as it comes: a toast held over the pause comes back as the race goes on)
    for (const id of ['h-msg', 'toast', 'h-teamradio']) new MutationObserver(() => { const e = document.getElementById(id), t = id === 'h-teamradio' ? e.lastElementChild.textContent : e.textContent; if (t && last[id] !== t) { last[id] = t; window.__told.push(id + ': ' + t); } })
      .observe(document.getElementById(id), { childList: true, subtree: true, characterData: true }); });
  const told = () => page.evaluate(() => window.__told.splice(0));
  const said = () => page.evaluate(() => window.__said.splice(0));

  // 1. the red flag out (for the leader's lap)
  const red0 = await page.evaluate(() => { const r = window.__game.race; r._redOut([r.order[0]]); window.__R0 = r.fl.red; return { t: r.time, pit: r.fl.red.pit }; });
  await sim(0.5);
  const s1 = await st(), t1 = await told(), k1 = await said();
  T.check('the red flag out: RDEČA ZASTAVA (red), the flag on the HUD, the autopilot\'s bar (AVTOPILOT · RDEČA ZASTAVA, the km to the pits) and sign, the toast, the team radio, the commentator',
    red0.pit && s1.rq && s1.msg === 'show warn:RDEČA ZASTAVA' && s1.flag === 'on red:RDEČA ZASTAVA' && /\bred\b/.test(s1.pit) && /\bon\b/.test(s1.pit) && s1.title === 'AVTOPILOT · RDEČA ZASTAVA' && /^Do boksov: \d+,\d km$/.test(s1.label) && s1.ap &&
    t1.some(x => /^toast: Rdeča zastava: dirka je prekinjena\. Avtopilot te počasi pripelje v bokse/.test(x)) && t1.includes('h-teamradio: Rdeča zastava! Počasi v bokse, za avtom pred tabo.') && k1.includes('red'),
    JSON.stringify({ s1, t1, k1 }));

  // 2. the way in: slowly, into the pit lane, standing in the queue; the bar; the crew; the exit's light; nothing else told
  const BAD = ['pressure', 'duel', 'gapBehind', 'gapAhead', 'gain', 'lose', 'chat'];
  let s = s1, vMax = 0, mono = true, prev = null, rp = null, queued = null, kinds = [], crews = new Set(), keys = [], noise = [], toldIn = [];
  for (let k = 0; k < 330 && s.red === 'in'; k++) {
    await sim(1); s = await st();
    if (!s.inPit && s.t > red0.t + 6) vMax = Math.max(vMax, s.v);
    const kind = s.label.replace(/[:\d].*$/, '').trim();
    if (kinds[kinds.length - 1] !== kind) kinds.push(kind); else if (prev && s.bar < prev.bar - 0.01) mono = false;
    prev = s; crews.add(s.crew); keys.push(s.exit);
    const k2 = await said(); noise.push(...k2.filter(x => BAD.includes(x) || /^place:/.test(x)));
    toldIn.push(...await told());
    // standing in the queue: Posnetek do sem there (the replay of the race so far), then back into the race
    if (!rp && kind === 'V vrsti' && s.red === 'in') {
      queued = s;
      rp = await page.evaluate(async (t0) => {
        const g = window.__game, r = g.race, fr = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
        g.onAction('rp-here'); await fr();
        const o = { on: !!g.replay };
        g.rpSeek(t0 + 20); await fr(); o.during = r.fl.red ? r.fl.red.st : null; o.own = r.fl.red !== window.__R0;
        g.rpSeek(t0 - 5); await fr(); o.before = r.fl.red ? r.fl.red.st : null;
        g.onAction('rp-race'); await fr(); o.back = r.fl.red === window.__R0 ? r.fl.red.st : null; o.left = !g.replay; o.pitPosed = !!g.rpPit.cur;
        return o;
      }, red0.t);
    }
  }
  T.check(`... slowly in (at most RED.v, 36 m/s, from 6 s on), into the pit lane, standing in the queue: the bar's place in it (V vrsti: m/n)`,
    vMax > 30 && vMax < 38 && !!queued && queued.inPit && queued.v < 0.6 && /^V vrsti: (\d+)\/(\d+)$/.test(queued.label) && +queued.label.match(/(\d+)\/(\d+)/)[1] <= +queued.label.match(/(\d+)\/(\d+)/)[2],
    JSON.stringify({ vMax, queued }));
  T.check('... the bar: the km to the pits, the place in the queue, the count to the restart; its line only ever filling within each part', mono && kinds.join() === 'Do boksov,V vrsti,Ponovni štart čez', kinds.join(' > '));
  T.check('... the crew stays in the garage all through (a drive through the lane in the queue: no stop), the pit exit\'s light red while the field is held', crews.size === 1 && crews.has('home') && keys.slice(-3).every(x => x[0] === 'r'),
    `crew ${[...crews].join()}, the light ${keys.slice(-3).join()}`);
  T.check('... meanwhile no duels, places, gaps nor the places\' racing lines told, nor other cars\' pit stops on the HUD; the lap on the autopilot no clean lap of the player\'s', !noise.length && !toldIn.some(x => /V BOKSIH|DVOBOJ|Čist krog/.test(x)), JSON.stringify({ noise, told: toldIn }));
  T.check('Posnetek do sem in the queue: the replay\'s own red flag where it was out, none before it; back in the race with its red flag as it was (and the race\'s own pit state for the crew)', !!rp && rp.on && rp.during === 'in' && rp.own && rp.before === null && rp.back === 'in' && rp.left && !rp.pitPosed,
    JSON.stringify(rp));

  // 3. the hold: all in, the track cleared
  const s3 = s, t3 = toldIn.slice(-6).concat(await told());
  T.check('the hold: PONOVNI ŠTART ČEZ 7 s, the bar counts down to the restart; standing in the lane', s3.red === 'hold' && t3.includes('h-msg: PONOVNI ŠTART ČEZ 7 s') && /^Ponovni štart čez [1-7] s$/.test(s3.label) && s3.inPit && s3.v < 0.6 && s3.flag === 'on red:RDEČA ZASTAVA',
    JSON.stringify({ s3, t3 }));

  // 4. the restart behind the safety car; the hand-back once out of the lane
  let go = null, back = null, toldGo = [], saidGo = [];
  for (let k = 0; k < 80 && !back; k++) {
    await sim(0.5); s = await st(); toldGo.push(...await told()); saidGo.push(...await said());
    if (s.red === 'go' && !go) { await sim(1); go = await st(); }
    if (go && !s.rq) back = s;
  }
  T.check('the restart: PONOVNI ŠTART, the team radio, the commentator; the safety car\'s board on the HUD, the bar behind it, the exit\'s light green', !!go && toldGo.includes('h-msg: PONOVNI ŠTART') && toldGo.includes('h-teamradio: Ponovni štart za varnostnim avtom. Ogrej gume.') && saidGo.includes('redGo') &&
    go.flag === 'on sc:VARNOSTNI AVTO' && go.label === 'Za varnostnim avtom' && go.exit[0] === 'g', JSON.stringify({ go, toldGo, saidGo }));
  T.check('... the hand-back out of the lane: VOZIŠ TI!, the bar and the autopilot\'s sign gone', !!back && !back.inPit && toldGo.includes('h-msg: VOZIŠ TI!') && !/\bon\b/.test(back.pit) && !back.ap, JSON.stringify(back));

  // 5. on: the game's autopilot drives (the steps' own inputs are digital); the safety car in, green at the line
  await page.evaluate(() => { window.__game.autoDrive = true; });
  let s5 = s, toldEnd = [];
  for (let k = 0; k < 120 && (s5.red !== '-' || s5.sc !== '-') && s5.phase === 'racing'; k++) { await sim(2); s5 = await st(); toldEnd.push(...await told()); }
  T.check('... the safety car in, green at the line: the red flag over', s5.red === '-' && s5.sc === '-' && (toldEnd.includes('h-msg: ZELENA ZASTAVA!') || s5.phase !== 'racing'), JSON.stringify({ s5, told: toldEnd }));

  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
