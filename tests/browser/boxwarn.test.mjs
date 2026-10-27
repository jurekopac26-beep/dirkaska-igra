// BOKSI TA KROG on the HUD (game.js boxHUD, Core's Race.plan): a long race with fuel on a track with pits, the team radio switched off
// (the warning whatever its setting), the player on autopilot. The Red Bull Ring (the pit lane on the right): nothing on the first lap; at
// the line of the lap the stop is due (the plan there: the fuel would not reach the next way in) BOKSI TA KROG, the last 400 m before the way
// in an arrow to the right after the words and the metres to it in steps of 50, down to the way in; the player comes in: gone in the lane,
// nothing on the next lap (a full tank). Trois-Rivières in English (the lane on the left; a stop due at the second lap's line): BOX THIS LAP,
// the arrow on the left before the words; the stop not made: gone once past the way in (not back where the way out joins the circuit, before
// the line there), at the next line again. Its place: upright (360x640) at the left under the stack (the tyres, the fuel, the failures, the
// flags), on its side (640x360) under the clock, with buttons, the wheel and tilting, with the tyres, the fuel, the failures, a yellow flag,
// the corner sign, a split, a big message and a toast up: over nothing of the HUD or the controls, not over the car, in the screen, its
// letters at least 9 px; the stack's pills as wide with it as without it.
//   node tests/browser/boxwarn.test.mjs            (SHOTS=<folder>: a picture of each place)
import path from 'node:path';
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('BOKSI TA KROG');
const SHOTS = process.env.SHOTS || '';
const srv = await serve();
const browser = await launch();
const OR = { port: { width: 360, height: 640 }, land: { width: 640, height: 360 } };
// on to the race (the intro and the lights stepped, no gas)
const toRacing = (page) => page.evaluate(() => { const g = window.__game; g.pause(); for (let k = 0; k < 800 && g.phase !== 'racing'; k++) g.sim(0.05, false, 0, 0); return g.phase; });
const frames = (page, n = 2) => page.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
// the race on (paused, a quarter of a second at a time on autopilot, the HUD after each) until fn(g, P, dE, opt) (dE: the metres to this lap's
// way in along the race); what the warning shows each time it changes ({ lap, dE, st: classes|words|metres, pit: in the lane or on the pit
// road }) and the plan at each line (opt.pit: the player comes in at the next way in)
const run = (page, fn, max, opt = {}) => page.evaluate(async ([src, max, opt]) => {
  const g = window.__game, P = g.race.player, Tk = g.race.track, D = Tk.def.pit, f = new Function('g', 'P', 'dE', 'o', 'return (' + src + ')(g, P, dE, o)'), B = document.getElementById('h-box');
  const dEOf = () => Math.max(1, P.lap) * Tk.len + D[1] - P.dist, st = () => B.className + '|' + B.firstElementChild.textContent + '|' + B.lastElementChild.textContent;
  const out = { ch: [], lines: [] }; let last = null, lap = P.lap;
  g.pause();
  for (let k = 0; k < max; k++) {
    if (opt.pit) P.pitWant = !P.repairN;   // (the player comes in: at the next way in)
    g.sim(0.25, true); g.hud(0.25);
    if (P.lap !== lap) { lap = P.lap; const pl = g.race.plan(P); out.lines.push({ lap, box: !!pl && pl.box, need: pl ? pl.need.join() : '', mk: !!g.race.mk }); }
    const s = st(), dE = dEOf();
    if (s !== last) { last = s; out.ch.push({ lap: P.lap, dE: Math.round(dE), st: s, pit: !!(P.inPit || P.pitG) }); }
    if (f(g, P, dE, opt)) { out.ok = true; break; }
  }
  out.lap = P.lap; out.L = Tk.len; out.st = st(); out.fuel = +P.fuel.toFixed(3);
  return out;
}, [fn.toString(), max, opt]);
// the race held where it is (paused, the pause menu out of the way: the HUD and the controls as in the race; the camera caught up behind
// the car, as carlow.test.mjs settles it: a paused frame does not move it); the other texts up for the worst case: the failures, a yellow
// flag, the corner sign, a split, a big message and a toast
const hold = (page) => page.evaluate(() => {
  const g = window.__game, $ = (id) => document.getElementById(id), P = g.race.player; g.pause();
  Render.resetCam(); for (let i = 0; i < 60; i++) Render.frame(1 / 60, 1, P, 'chase', {});
  for (const s of document.querySelectorAll('.screen.show')) s.classList.remove('show');
  for (const id of ['hud', 'touch', 'btn-pause']) $(id).classList.remove('off');
  $('h-flt').className = 'on'; $('h-flt').innerHTML = '<span class="pk">PREDRTA GUMA</span><span class="br">VROČE ZAVORE</span>';
  $('h-flag').className = 'on yel'; $('h-flag').textContent = 'RUMENA ZASTAVA';
  $('h-note').style.transition = 'none'; $('h-note').className = 'show sev3';
  $('h-split').textContent = 'SEKTOR 2  35.996'; $('h-split').className = 'show sp';
  g.msg('ZADNJI KROG!', 'gold', 600); g.toast('Sedaj lahko spustiš plin, vse bo naredil sam.', 600000);
});
// in the page: the warning (its box, the words, the arrow, the metres), every other part of the HUD and the controls shown, the clock's
// column, the fuel and the stack's bottom, the stack's width with the warning and without it, and the car on the screen (a box of 5.2 m round
// it, 1.6 m high, through the camera)
const PLACE = () => {
  const $ = (id) => document.getElementById(id);
  const shown = (e) => { if (!e || getComputedStyle(e).visibility === 'hidden') return false; for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || +c.opacity === 0) return false; } const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const R = (e) => { const r = e.getBoundingClientRect(); return { id: e.id || e.tagName, l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) }; };
  const B = $('h-box'), ar = B.querySelector('i'), P = window.__game.race.player, C = Render.camera, pts = [];
  for (const dx of [-2.6, 2.6]) for (const dz of [-2.6, 2.6]) for (const dy of [0, 1.6]) { const p = new THREE.Vector3(P.x + dx, (P.y || 0) + dy, P.z + dz).project(C); pts.push([(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]); }
  const car = { id: 'car', l: Math.min(...pts.map(p => p[0])), r: Math.max(...pts.map(p => p[0])), t: Math.min(...pts.map(p => p[1])), b: Math.max(...pts.map(p => p[1])) };
  const ids = ['h-main', 'h-pos', 'h-tot', 'h-speed', 'h-lap', 'h-tyre', 'h-tags', 'h-fc', 'h-fuel', 'h-flt', 'h-flag', 'h-tower', 'h-time', 'h-best', 'h-sec', 'h-split', 'h-map', 'h-pit', 'h-react', 'h-msg', 'h-teamradio', 'toast', 'h-note', 'h-lights',
    'btn-pause', 'btn-rescue', 'c-left', 'c-right', 'c-wheel', 'c-brake', 'c-gas', 'tilt-ind'];
  const stack = Math.max(...['h-main', 'h-tags', 'h-fc', 'h-fuel', 'h-flt', 'h-flag'].map($).filter(shown).map(e => e.getBoundingClientRect().bottom)), wide = () => +$('h-rank').getBoundingClientRect().width.toFixed(1);
  const rw = [wide()]; B.style.display = 'none'; rw.push(wide()); B.style.display = '';
  return { w: innerWidth, h: innerHeight, on: shown(B), cls: B.className, words: B.firstElementChild.textContent, m: B.lastElementChild.textContent, fs: parseFloat(getComputedStyle(B).fontSize),
    b: R(B), word: R(B.firstElementChild), ar: shown(ar) ? R(ar) : null, times: R($('h-times')), fuel: shown($('h-fuel')) ? R($('h-fuel')) : null, stack, rw, car, others: ids.map($).filter(shown).map(R) };
};
// what is wrong with the place: not shown, out of the screen, over another part of the HUD or a control, over the car, too small; the
// arrow not on the lane's side of the words; upright not under the stack at the left, on its side not centred under the clock; the stack
// wider with it
function wrongPlace(x, side, k) {
  const bad = [], hit = (a, c) => Math.min(a.r, c.r) - Math.max(a.l, c.l) > 1 && Math.min(a.b, c.b) - Math.max(a.t, c.t) > 1, { b } = x;
  if (!x.on) return ['not shown'];
  if (b.l < 0 || b.t < 0 || b.r > x.w || b.b > x.h) bad.push('out of the screen');
  for (const o of x.others) if (hit(b, o)) bad.push('over ' + o.id);
  if (hit(b, x.car)) bad.push('over the car ' + JSON.stringify(x.car));
  if (x.fs < 9) bad.push('letters ' + x.fs + ' px');
  if (!x.ar) bad.push('no arrow'); else if (side > 0 ? x.ar.l < x.word.r : x.ar.r > x.word.l) bad.push('the arrow not on the ' + (side > 0 ? 'right' : 'left'));
  if (!/^\d+0 m$/.test(x.m) && x.m !== '') bad.push('the metres ' + x.m);
  if (k === 'port' && (!x.fuel || b.t < x.stack || b.t - x.stack > 6 || Math.abs(b.l - x.fuel.l) > 1)) bad.push('not under the stack');
  if (x.rw[0] !== x.rw[1]) bad.push('the stack ' + x.rw.join(' px wide with it, ') + ' px without');
  if (k === 'land' && (b.t < x.times.b || Math.abs((b.l + b.r) / 2 - x.w / 2) > 1.5)) bad.push('not centred under the clock');
  return bad;
}
// its place in both ways of holding the phone and every way of steering (a picture of each with SHOTS)
async function places(page, name, side) {
  const out = [];
  for (const k of ['land', 'port']) {
    await page.setViewportSize(OR[k]);
    for (const m of ['buttons', 'wheel', 'tilt']) {
      await page.evaluate((m) => Input.setMode(m), m); await frames(page, 3); await page.evaluate(() => Input.layout()); await frames(page, 2);
      const x = await page.evaluate(PLACE), bad = wrongPlace(x, side, k);
      if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `boxwarn-${name}-${m}-${k}.png`), timeout: 180000 });
      out.push({ k, m, ok: !bad.length, bad, b: x.b, words: x.words, mm: x.m, fs: x.fs });
    }
  }
  await page.evaluate(() => Input.setMode('buttons'));
  return out;
}
const unhold = (page) => page.evaluate(() => { const $ = (id) => document.getElementById(id); $('h-flt').className = ''; $('h-flag').className = ''; $('h-note').className = ''; $('h-split').className = ''; $('h-msg').className = ''; $('toast').classList.remove('show'); });

try {
  const { page, errors } = await openGame(browser, srv.base + '/index.html', { quality: 'low', shadows: 0, camera: 'chase', track: 'rbring', fuel: 1, length: 'long', radio: 0, damage: 0, weather: 'dry', tod: 'day', tower: 1 }, OR.land, { touch: true, context: { reducedMotion: 'reduce' }, seed: 11 });

  // 1. the Red Bull Ring: to the lap the stop is due, on to 300 m before its way in
  await startTrack(page, 'rbring');
  await toRacing(page);
  const a = await run(page, (g, P, dE) => P.lap >= 2 && /near/.test(document.getElementById('h-box').className) && dE < 300, 3000);
  const on = a.ch.filter(c => c.st.startsWith('on')), first = on[0], near = on.filter(c => /near r/.test(c.st)), due = a.lines.find(l => l.box);
  T.check('no team radio, nothing on the first lap; at the line of the lap the stop is due (the plan there: box, the fuel; no race clock) BOKSI TA KROG, no arrow yet',
    !!a.ok && a.ch.filter(c => c.lap === 1).every(c => c.st === '||') && !!due && due.need === 'fuel' && !due.mk && due.lap >= 2 && !!first && first.lap === due.lap && first.dE > a.L / 2 && first.st === 'on|BOKSI TA KROG|',
    JSON.stringify({ lines: a.lines, ch: a.ch.slice(0, 4) }));
  T.check('... the last 400 m before the way in: the arrow to the right (the lane\'s side) and the metres to it in steps of 50, fewer and fewer',
    near.length >= 2 && near[0].dE <= 400 && near[0].dE > 340 && near.every((c, i) => /^on near r\|BOKSI TA KROG\|\d+0 m$/.test(c.st) && +c.st.split('|')[2].slice(0, -2) % 50 === 0 && (!i || +c.st.split('|')[2].slice(0, -2) < +near[i - 1].st.split('|')[2].slice(0, -2))),
    JSON.stringify(near));
  await hold(page);
  const pr = await places(page, 'rbring', 1);
  T.check('its place (BOKSI TA KROG ▶ 300 m): upright under the stack at the left (its pills as wide as without it), on its side under the clock; with buttons, the wheel and tilting over nothing of the HUD or the controls, not over the car, in the screen, at least 9 px',
    pr.length === 6 && pr.every(o => o.ok), JSON.stringify(pr.filter(o => !o.ok).concat(pr.slice(0, 2))));
  await unhold(page);
  // the player comes in: gone in the lane; out of it with a full tank, nothing on the next lap
  const b = await run(page, (g, P, dE, o) => P.repairN > 0 && !P.inPit && !P.pitG && !g.pitAuto.st && P.lap > o.lap && dE < g.race.track.len * 0.7, 3000, { pit: true, lap: a.lap });
  const inLane = b.ch.filter(c => c.pit), atIn = inLane[0], after = b.ch.filter(c => c.lap > a.lap);
  T.check('the player comes in: the arrow down to the way in, gone in the lane (no warning there); out of it with a full tank, nothing on the next lap',
    !!b.ok && !!atIn && atIn.st === '||' && b.ch.filter(c => c.pit).every(c => c.st === '||') && b.ch.filter(c => !c.pit && c.lap === a.lap && c.st !== '||').every(c => /^on near r\|BOKSI TA KROG\|(\d+0 m)?$/.test(c.st)) && after.every(c => c.st === '||') && b.st === '||' && b.fuel > 0.9,
    JSON.stringify({ ch: b.ch, st: b.st, fuel: b.fuel, lap: b.lap }));

  // 2. Trois-Rivières in English (the lane on the left): a stop due at the second lap's line (half a tank left at the end of the first, the
  // burn measured: it would not reach the third lap's way in), not made
  await page.evaluate(() => { const g = window.__game; g.resume(); g.onAction('to-title'); g.onAction('to-settings'); document.querySelector('[data-set="lang"] button[data-v="en"]').click(); g.onAction('settings-done'); });
  await startTrack(page, 'troisrivieres');
  await toRacing(page);
  await run(page, (g, P) => P.lap === 1 && P.dist > g.race.track.len - 40, 3000);
  await page.evaluate(() => { window.__game.race.player.fuel = 0.5; });
  const c = await run(page, (g, P, dE) => P.lap === 2 && /near/.test(document.getElementById('h-box').className) && dE < 300, 2000);
  const cf = c.ch.find(x => x.st.startsWith('on')), cn = c.ch.filter(x => /near/.test(x.st));
  T.check('Trois-Rivières in English: at the second lap\'s line BOX THIS LAP; the last 400 m the arrow to the left (the lane\'s side) and the metres',
    !!c.ok && !!cf && cf.lap === 2 && cf.dE > c.L / 2 && cf.st === 'on|BOX THIS LAP|' && cn.length >= 1 && cn.every(x => /^on near l\|BOX THIS LAP\|\d+0 m$/.test(x.st)), JSON.stringify(c.ch));
  await hold(page);
  const pl = await places(page, 'troisrivieres-en', -1);
  T.check('its place (◀ BOX THIS LAP 300 m): the arrow before the words; upright under the stack, on its side under the clock, over nothing of the HUD or the controls, not over the car',
    pl.length === 6 && pl.every(o => o.ok && o.words === 'BOX THIS LAP'), JSON.stringify(pl.filter(o => !o.ok).concat(pl.slice(0, 2))));
  await unhold(page);
  // the stop not made: gone once the way in is passed (the lane walled off beside the car), at the next line again
  const d = await run(page, (g, P, dE) => P.lap === 3 && dE < g.race.track.len / 2, 3000);
  const gone = d.ch.find(x => x.lap === 2 && x.st === '||'), back = d.ch.find(x => x.lap === 3 && x.st.startsWith('on'));
  T.check('... the stop not made: gone once past the way in (not in the lane), not back at the way out (it joins the circuit before the line here), at the third lap\'s line again',
    !!d.ok && !!gone && !gone.pit && gone.dE < 0 && gone.dE > -120 && !!back && d.ch[d.ch.indexOf(gone) + 1] === back && back.dE > d.L / 2 && back.st === 'on|BOX THIS LAP|' && d.lines.some(l => l.lap === 3 && l.box), JSON.stringify(d.ch));
  T.check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
} catch (e) {
  T.check('the test ran through', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
} finally {
  await browser.close(); await srv.close();
}
T.done();
