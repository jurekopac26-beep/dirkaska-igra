// The texts of a race under the minimap (game.js hudCol, the column): the pit stop's progress bar, the big message (START!, ZADNJI KROG!,
// BOKSI · AVTOPILOT ...), the team radio and the toast, each the map's width, stacked right under it and under each other (no gap, no
// overlap), the big message in at most three lines; nothing of them over the middle of the track, none over anything else of the HUD (the
// clock, the sectors, the place, the timing tower, the speedometer, the pause and camera buttons, the pedals and the steering, the police's
// radio and arrows ...). A phone's touch screen upright (360x640, the camera behind the car) and on its side (640x360, the isometric camera),
// in every HUD: a race on a circuit (the start, a pit stop on the autopilot, the last lap), a time trial (its height profile first under
// the map), Pikes Peak, the run from the police, the duel in the traffic, the driving school, a race with a friend over the internet. On its
// side the tower is the column's last (fewer rows, or none, with texts above it), and what does not fit above the pedals waits (the toast,
// then the radio: hidden, its time stopped); upright everything fits at once. No handbrake button (ROČNA) on the screen in any steering mode.
//   node tests/browser/hudcol.test.mjs            (SHOTS=<folder>: a picture of each)
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const require = createRequire(import.meta.url);
const T = checker('the texts under the map (hudCol)');
const SHOTS = process.env.SHOTS || '';
const srv = await serve();
const browser = await launch(['--disable-features=WebRtcHideLocalIpsWithMdns']);
const OR = { port: { width: 360, height: 640, camera: 'chase' }, land: { width: 640, height: 360, camera: 'iso' } };
const CTX = { touch: true, context: { reducedMotion: 'reduce' } };   // (a phone; no fade-in moving the boxes while they are measured)
const TOAST = 'Sedaj lahko spustiš plin, vse bo naredil sam.', RADIO = 'Dober postanek. Si 5., G. Moretti je 12,3 s pred tabo.';

// in the page: the column (its items shown, top to bottom) and every other HUD element shown
const MEASURE = () => {
  const shown = (e) => { if (!e || getComputedStyle(e).visibility !== 'visible') return false; for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || +c.opacity === 0) return false; } const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const R = (id) => { const r = document.getElementById(id).getBoundingClientRect(); return { id, l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) }; };
  const land = innerWidth > innerHeight, M = document.getElementById('h-msg'), cs = getComputedStyle(M);
  const colIds = ['h-prof', 'h-wreck', 'h-pit', 'h-msg', 'h-teamradio', 'toast'].concat(land ? ['h-tower'] : []);
  const otherIds = ['h-time', 'h-best', 'h-sec', 'h-split', 'h-pol', 'h-gap', 'h-chk', 'h-school', 'pk-note', 'btn-pause', 'btn-cam', 'btn-tyre', 'btn-rescue', 'speedo', 'h-pos', 'h-lap', 'h-alt', 'h-turn', 'h-pkcls',
    'h-dmg', 'h-tyre', 'h-fuel', 'h-flt', 'h-flag', 'h-radio', 'h-tail', 'h-lights', 'h-note', 'c-left', 'c-right', 'c-wheel', 'c-brake', 'c-gas', 'tilt-ind'].concat(land ? [] : ['h-tower']);
  return { w: innerWidth, h: innerHeight, block: document.getElementById('rotate').classList.contains('show'), screen: window.__game.screen, m: R('h-map'),
    col: colIds.filter(id => shown(document.getElementById(id))).map(R).sort((a, b) => a.t - b.t), other: otherIds.filter(id => shown(document.getElementById(id))).map(R),
    wait: ['toast', 'h-teamradio'].filter(id => document.getElementById(id).classList.contains('wait')), msg: M.textContent, lines: shown(M) ? Math.round((M.clientHeight - 7) / parseFloat(cs.lineHeight)) : 0, fs: parseFloat(cs.fontSize),
    rows: document.getElementById('h-tower').querySelectorAll('.tw-r').length };
};
// what is wrong with a layout: the column not the map's width, a gap or an overlap in it, one of it over another HUD element, the rotate notice
function wrong(o) {
  const bad = [], near = (a, b) => Math.abs(a - b) <= 1, hit = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;
  if (o.block || o.screen !== 'none') bad.push('screen ' + o.screen + (o.block ? ' (turn the phone)' : ''));
  let prev = { id: 'h-map', b: o.m.b };
  for (const c of o.col) { if (!near(c.l, o.m.l) || !near(c.r, o.m.r)) bad.push(c.id + ' not the map\'s width'); const g = c.t - prev.b; if (g < 1 || g > 7) bad.push(c.id + ' ' + g.toFixed(1) + ' px under ' + prev.id); prev = c; }
  for (const c of o.col) for (const x of o.other) if (hit(c, x)) bad.push(c.id + ' over ' + x.id);
  for (const c of o.col) if (c.l < o.w * 0.6) bad.push(c.id + ' in the middle');
  if (o.lines > 3) bad.push('the big message in ' + o.lines + ' lines');
  return bad;
}
// on to the race (the intro and the lights stepped, no gas: a software-drawn frame is slow)
const toRacing = (page) => page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 800 && g.phase !== 'racing'; k++) g.sim(0.05, false, 0, 0); g.resume(); return g.phase; });
const frames = (page, n = 2) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
// the phone turned: the camera for that way first (no "turn the phone" notice), then the size
async function turn(page, o) { await page.evaluate((c) => { window.__game.S.camera = c; }, o.camera); await page.setViewportSize({ width: o.width, height: o.height }); await frames(page, 3); }
// the texts on: a big message, a toast and the radio (each for long enough), measured two drawn frames later
async function texts(page, msg, opt = {}) {
  await page.evaluate(([msg, toast, radio]) => { const g = window.__game; if (msg) g.msg(msg, 'gold', 60); if (toast) g.toast(toast, 60000);
    const r = document.getElementById('h-teamradio'); if (radio) { r.lastElementChild.textContent = radio; r.classList.add('on'); } }, [msg, opt.toast === undefined ? TOAST : opt.toast, opt.radio === undefined ? RADIO : opt.radio]);
  await frames(page, 3);
  return page.evaluate(MEASURE);
}
async function clear(page) { await page.evaluate(() => { document.getElementById('h-msg').className = ''; document.getElementById('toast').classList.remove('show'); document.getElementById('h-teamradio').classList.remove('on', 'wait'); }); await frames(page, 2); }
// a state in both ways of holding the phone: on its side first, then upright; each measured and checked (want: the ids that must show)
async function both(page, name, msg, want, opt = {}) {
  const out = {};
  for (const k of ['land', 'port']) {
    await turn(page, OR[k]); if (opt.before) await opt.before(page, k);
    const o = await texts(page, msg, opt), ids = o.col.map(c => c.id), bad = wrong(o), all = k === 'port' ? want.concat(opt.radio === null ? [] : ['h-teamradio'], opt.toast === null ? [] : ['toast']) : want, need = all.filter(id => !ids.includes(id));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}-${k}.png`) });
    T.check(`${name}, ${k === 'land' ? 'on its side' : 'upright'}: ${all.join(', ')} under the map, its width, stacked; nothing over the middle or over the HUD`, !bad.length && !need.length,
      JSON.stringify({ bad, need, col: ids, wait: o.wait, msg: o.msg, lines: o.lines, fs: o.fs, rows: o.rows }));
    out[k] = o; await clear(page);
  }
  return out;
}

try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'iso', track: 'gozd', tower: 1, radio: 1, damage: 1, line: 0 }, { width: 640, height: 360 }, CTX);

  // 1. a race on a circuit (Bakreni gozd): the start (START!), a pit stop on the autopilot (the progress bar first under the map), the last lap
  await startTrack(page, 'gozd');
  await toRacing(page);
  await both(page, 'race-start', 'START!', ['h-msg']);
  // no handbrake button on the screen (ROČNA, HANDBRAKE) in any steering mode, either way the phone is held: the brake and the gas side by side,
  // as tall as each other, apart; a touch where ROČNA was (above the brake) brakes, no handbrake
  const pedals = [];
  for (const k of ['land', 'port']) {
    await turn(page, OR[k]);
    for (const m of ['buttons', 'wheel', 'tilt']) {
      pedals.push(await page.evaluate(async (m) => { Input.setMode(m); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); Input.layout();
        const T = document.getElementById('touch'), vis = [...T.querySelectorAll('.tb, #c-wheel, #tilt-ind')].filter(e => e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden');
        const g = document.getElementById('c-gas').getBoundingClientRect(), b = document.getElementById('c-brake').getBoundingClientRect();
        const o = { m, w: innerWidth, ids: vis.map(e => e.id).join(), words: T.innerText.replace(/\s+/g, ' ').trim(), drift: !!document.getElementById('c-drift'), apart: b.right <= g.left || g.right <= b.left, tall: m === 'tilt' || (Math.abs(b.height - g.height) < 1 && Math.abs(b.bottom - g.bottom) < 1) };
        if (m === 'buttons') { const x = b.left + b.width / 2, y = b.top - 20;
          T.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, clientX: x, clientY: y, bubbles: true })); const s = Input.update(0.016); o.above = { brk: s.brk, hand: s.hand };
          T.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, clientX: x, clientY: y, bubbles: true })); Input.update(0.016); }
        return o; }, m));
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `pedals-${m}-${k}.png`) });
    }
    await page.evaluate(() => Input.setMode('buttons'));
  }
  const PED = { buttons: 'c-left,c-right,c-brake,c-gas', wheel: 'c-wheel,c-brake,c-gas', tilt: 'c-brake,c-gas,tilt-ind' };
  T.check('no ROČNA (handbrake) button on the screen in any steering mode, on its side and upright: ZAVORA and PLIN side by side, as tall as each other (tilting: apart, the brake on the left); a touch where ROČNA was brakes',
    pedals.length === 6 && pedals.every(o => !o.drift && o.ids === PED[o.m] && !/ROČNA|HANDBRAKE/.test(o.words) && o.apart && o.tall) && pedals.filter(o => o.above).every(o => o.above.brk === 1 && o.above.hand === 0), JSON.stringify(pedals));
  await page.evaluate(() => { const g = window.__game, P = g.race.player; g.pause(); P.dmg = 0.5;
    for (let k = 0; k < 6000 && !(P.pitState === 'repair' && P.pitT > 0.5); k++) { if (P.lap >= 1 && !P.repairN) P.pitWant = true; if (P.inPit || g.pitAuto.st) g.sim(1 / 60, false, 0, 0); else g.sim(0.1, true); }
    P.pitDur = Math.max(P.pitDur, P.pitT + 120); g.resume(); });   // (the crew's work long enough for both pictures)
  const pit = await both(page, 'race-pits', 'BOKSI · AVTOPILOT', ['h-pit', 'h-msg']);
  T.check('the pit stop: the progress bar right under the map, the big message under it', ['land', 'port'].every(k => pit[k].col[0] && pit[k].col[0].id === 'h-pit' && pit[k].col[1].id === 'h-msg'), JSON.stringify(['land', 'port'].map(k => pit[k].col.map(c => c.id))));
  await page.evaluate(() => { const g = window.__game, P = g.race.player; g.pause(); P.pitDur = P.pitT + 0.1; for (let k = 0; k < 4000 && (P.inPit || g.pitAuto.st || P.lap < g.race.laps); k++) { P.pitWant = false; if (P.inPit || g.pitAuto.st) g.sim(1 / 60, false, 0, 0); else g.sim(0.25, true); } g.resume(); });
  const last = await both(page, 'race-lastlap', 'ZADNJI KROG!', ['h-msg']);
  await turn(page, OR.land);
  await page.waitForFunction(() => document.getElementById('h-tower').querySelectorAll('.tw-r').length >= 5, null, { timeout: 60000 }).catch(() => { });   // (drawn again four times a second of the race)
  const alone = await page.evaluate(MEASURE), atw = alone.col.find(c => c.id === 'h-tower');
  T.check('on its side, a race: the timing tower the column\'s last, fewer rows (or none) under the texts; alone under the map with all its rows',
    !!atw && alone.col.length === 1 && atw.t - alone.m.b <= 7 && alone.rows >= 5 && last.land.rows <= alone.rows && !wrong(alone).length, JSON.stringify({ last: last.land.col.map(c => c.id), rows: last.land.rows, alone: alone.col.map(c => c.id), aloneRows: alone.rows, bad: wrong(alone) }));
  T.check('upright everything at once (nothing waits); on its side what does not fit above the pedals waits (the toast first)', ['race-start', 'race-pits', 'race-lastlap'].length && [pit, last].every(s => !s.port.wait.length) && [pit, last].every(s => !s.land.wait.length || s.land.wait[0] === 'toast'),
    JSON.stringify([pit, last].map(s => ({ land: s.land.wait, port: s.port.wait }))));

  // 2. a time trial (Vršič): the height profile first under the map, the checkpoint's message under it
  const mode = async (id, md) => { await page.evaluate(async ([id, md]) => { const g = window.__game, wait = (ms) => new Promise(r => setTimeout(r, ms)); g.onAction('to-title'); await wait(250); g.onAction('to-track'); await wait(250);
    document.querySelector(`[data-track="${id}"]`).click(); await wait(150); const b = document.querySelector(`[data-track="${id}"] .tc-mode button[data-v="${md}"]`); if (b) { b.click(); await wait(150); } g.onAction('start');
    for (let k = 0; k < 1200 && !(g.race && g.race.track.def.id === id && g.S.mode === md); k++) await wait(100); }, [id, md]); await toRacing(page); };
  await turn(page, OR.land);
  await mode('vrsic', 'tt');
  await page.evaluate(() => window.__game.sim(4, true));
  const tt = await both(page, 'timetrial', 'CP1 -0.42', ['h-msg'], { radio: null });
  T.check('a time trial: the height profile right under the map, the message under it', ['land', 'port'].every(k => tt[k].col[0].id === 'h-prof' && tt[k].col[1].id === 'h-msg'), JSON.stringify(['land', 'port'].map(k => tt[k].col.map(c => c.id))));
  // 3. the run from the police (Vršič): the checkpoint's panel at the top, the police's radio at the bottom
  await mode('vrsic', 'police');
  await page.evaluate(() => window.__game.sim(3, true));
  await both(page, 'police', 'POLICIJA TE LOVI!', ['h-msg'], { radio: null, toast: 'Misija: pripelji avto do garaže na vrhu Vršiča (desno ob cesti, takoj za prelazom).' });
  // 4. the duel in the traffic (Vršič)
  await mode('vrsic', 'traffic');
  await page.evaluate(() => window.__game.sim(3, true));
  await both(page, 'duel', 'DVOBOJ V PROMETU!', ['h-msg'], { radio: null });
  // 5. Pikes Peak (a time trial of its own: the class, the splits, the corner warnings)
  await turn(page, OR.land);
  await startTrack(page, 'pikes');
  await toRacing(page);   // (past the flyover)
  await page.evaluate(() => window.__game.sim(6, true));
  await both(page, 'pikes', 'VZPON NA VRH!', ['h-msg'], { radio: null });
  // 6. the driving school (the start)
  await turn(page, OR.land);
  await page.evaluate(async () => { const g = window.__game; g.onAction('to-title'); await new Promise(r => setTimeout(r, 250)); g.onAction('to-school'); await new Promise(r => setTimeout(r, 300));
    g.onAction('school-go', document.querySelector('[data-act="school-go"][data-lesson="start"]')); });
  await page.waitForFunction(() => { const g = window.__game; return g.school && g.school.id === 'start' && g.race; }, null, { timeout: 90000 }); await toRacing(page);
  await both(page, 'school', 'ZLATO!', ['h-msg'], { radio: null });
  T.check('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
  await page.context().close();

  // 7. a race with a friend over the internet (a PeerJS server of the test's own): one phone upright, the other on its side
  const { PeerServer } = require('peer');
  const port = await new Promise((resolve) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
  const peerHttp = await new Promise((resolve) => PeerServer({ port, host: '127.0.0.1', path: '/' }, resolve));
  try {
    const init = { content: `window.__peerOpts = ${JSON.stringify({ host: '127.0.0.1', port, path: '/', secure: false, config: { iceServers: [] } })};` };
    const open = (name, car, o) => openGame(browser, srv.base + '/index.html', { name, car, quality: 'low', shadows: 0, camera: o.camera }, { width: o.width, height: o.height }, Object.assign({ init }, CTX));
    const A = await open('Ana', 0, OR.port), B = await open('Bor', 2, OR.land);
    const until = (p, fn, ms = 60000) => p.waitForFunction(fn, null, { timeout: ms, polling: 200 }).then(h => h.jsonValue());
    await A.page.evaluate(() => { window.__game.onAction('to-online'); window.__game.onAction('net-host'); });
    const code = await until(A.page, () => { const n = window.__game.net; return n && n.code && n.code.length === 4 ? n.code : null; });
    await B.page.evaluate((code) => { window.__game.onAction('to-online'); document.getElementById('on-code').value = code; window.__game.onAction('net-join'); }, code);
    await until(B.page, () => { const n = window.__game.net; return !!(n && n.open && n.peer && n.synced); });
    await A.page.evaluate(() => { const t = document.getElementById('on-track'); t.value = 'jezero'; t.dispatchEvent(new Event('change')); });
    await until(B.page, () => window.__game.net.track === 'jezero');
    await A.page.evaluate(() => window.__game.onAction('net-go'));
    for (const x of [A, B]) await until(x.page, () => { const n = window.__game.net; return !!(n && n.race && n.race.startT != null); }, 90000);
    for (const [x, k] of [[A, 'port'], [B, 'land']]) {
      await x.page.waitForFunction(() => !document.getElementById('h-lights').classList.contains('show'), null, { timeout: 60000 }).catch(() => { });   // (the start lights gone: the column stops above them while they show)
      const o = await texts(x.page, 'START!', { radio: null }), bad = wrong(o), ids = o.col.map(c => c.id);
      if (SHOTS) await x.page.screenshot({ path: path.join(SHOTS, `online-${k}.png`) });
      T.check(`a race with a friend, ${k === 'land' ? 'on its side' : 'upright'}: the message and the toast under the map, its width, stacked; nothing over the middle or over the HUD`, !bad.length && ids.includes('h-msg') && (k === 'land' || ids.includes('toast')), JSON.stringify({ bad, col: ids, wait: o.wait }));
    }
    T.check('no page errors (online)', !A.errors.length && !B.errors.length, A.errors.concat(B.errors).slice(0, 4).join(' | '));
  } finally { peerHttp.closeAllConnections(); peerHttp.close(); }
} catch (e) {
  T.check('the test ran through', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
process.exit(process.exitCode || 0);   // (the PeerJS server library keeps a timer running)
