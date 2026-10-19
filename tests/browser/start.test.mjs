// The start's reaction on the HUD (Core LAUNCH, js/game.js reactHUD): once the player sets off, under the map, as wide as it, for a few
// seconds: REAKCIJA and the seconds from the lights going out to the throttle (green up to 0,25 s, gold up to 0,45 s, red later); the gas
// held through the lights: PREZGODAJ NA PLINU, 0,60 s in red; in English REACTION 0.12 s; its left edge (4 px) in the same colour, the
// column's see-through background. Lying (640 x 360) and upright (360 x 640), the camera behind the car: one of the column
// under the map (hudCol): right under it (upright under the damage picture and the timing tower), above the big message (START!), inside the
// screen, over none of the other HUD items or the controls; lying, the timing tower (the column's last) stays under it (fewer rows where the
// room runs out: hudCol), never hidden for it; upright the tower over it, all its rows back once it is gone.
//   node tests/browser/start.test.mjs
import { serve, launch, openGame, startTrack, checker } from './lib.mjs';

const T = checker('the start\'s reaction under the map');
const srv = await serve();
const browser = await launch();
// in the page: the race paused (the frames do not move it), driven through the intro and the lights a step at a time with the throttle
// as asked (held: down all the time; else pressed `press` s after the lights went out) until a second after the press; then on again,
// a few frames for the HUD; where the reaction shows and what it says
const START = async (opts) => {
  const { press, held, en } = opts;
  const g = window.__game, frames = (n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  if (en) Lang.set('en');
  g.pause();
  const f = (P, live, ph) => ({ thr: held || (ph === 'racing' && g.race.time >= press - 1e-9) ? 1 : 0 });
  for (let k = 0; k < 400 && !(g.phase === 'racing' && g.race.time > (held ? 0 : press) + 1); k++) g.drive(0.05, f);
  g.resume();
  const el = document.getElementById('h-react');
  for (let k = 0; k < 100 && !el.classList.contains('show'); k++) await frames(1);
  el.style.transition = 'none'; el.style.animation = 'none';   // (as it stands once its fade in is over: on a busy machine the frames that run the fade come seconds apart)
  const box = (e) => { let r = e.getBoundingClientRect();   // (the big message's block is the screen's width: its text's own box)
    if (e.id === 'h-msg' && e.firstChild) { const R = document.createRange(); R.selectNodeContents(e); r = R.getBoundingClientRect(); }
    return { l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) }; };
  const shown = (e) => { if (!e) return false; for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity < 0.05) return false; } const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const others = ['h-lights', 'h-msg', 'h-rank', 'h-times', 'h-tower', 'h-note', 'h-teamradio', 'btn-pause', 'btn-tyre', 'btn-rescue', 'c-left', 'c-right', 'c-wheel', 'c-brake', 'c-gas', 'c-drift', 'tilt-ind']
    .map(id => document.getElementById(id)).filter(shown).map(e => Object.assign({ id: e.id }, box(e)));
  const tw = document.getElementById('h-tower'), towerOn = document.getElementById('hud').classList.contains('tw'), rows = () => tw.querySelectorAll('.tw-r').length;
  const M = document.getElementById('h-msg'), cs = getComputedStyle(el);
  const L = g.race.player.lch, out = { towerOn, towerShown: shown(tw), rows: rows(), tw: box(tw), cls: el.className, txt: el.textContent.replace(/\s+/g, ' ').trim(), op: +getComputedStyle(el).opacity, me: box(el), map: box(document.getElementById('h-map')),
    msg: shown(M) ? Object.assign({ txt: M.textContent }, box(M)) : null, head: Math.max(...['h-dmg', 'h-tower'].map(id => document.getElementById(id)).filter(e => shown(e) && innerHeight > innerWidth && e.getBoundingClientRect().bottom <= el.getBoundingClientRect().top + 0.5).map(e => e.getBoundingClientRect().bottom), box(document.getElementById('h-map')).b), edge: { w: parseFloat(cs.borderLeftWidth), c: cs.borderLeftColor }, bg: cs.backgroundColor,
    vw: innerWidth, vh: innerHeight, others, re: L && L.re, held: L && L.held, value: getComputedStyle(el.lastElementChild).color };
  el.style.transition = el.style.animation = '';
  if (opts.after) {   // (its time over: gone, the timing tower back)
    for (let k = 0; k < 600 && el.classList.contains('show'); k++) await frames(1);
    for (let k = 0; k < 10; k++) await frames(1);   // (the column laid out again without it)
    el.style.transition = 'none'; out.after = { shown: shown(el), tower: shown(tw), rows: rows() }; el.style.transition = '';
  }
  if (en) Lang.set('sl');
  return out;
};
const hit = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;
function placed(o) {   // under the map, as wide as it, on the screen, over nothing else; the big message under it; its edge in its number's colour
  const bad = [];
  if (o.msg && o.msg.t < o.me.b - 0.5) bad.push(`the big message (${o.msg.txt}) at ${o.msg.t}, above its bottom ${o.me.b}`);
  if (Math.abs(o.edge.w - 4) > 0.1 || o.edge.c !== o.value) bad.push(`its left edge ${o.edge.w} px ${o.edge.c}, the number ${o.value}`);
  if (o.bg !== 'rgba(10, 14, 20, 0.45)') bad.push('its background ' + o.bg);
  if (!(o.me.t >= o.head - 0.5 && o.me.t - o.head <= 12)) bad.push(`top ${o.me.t}, the column's head ${o.head} (the map's bottom ${o.map.b}; upright the damage picture and the tower under it)`);
  if (Math.abs(o.me.l - o.map.l) > 1 || Math.abs(o.me.r - o.map.r) > 1) bad.push(`${o.me.l}-${o.me.r} against the map's ${o.map.l}-${o.map.r}`);
  if (o.me.l < 0 || o.me.t < 0 || o.me.r > o.vw || o.me.b > o.vh) bad.push('off the screen');
  for (const x of o.others) if (hit(o.me, x)) bad.push('over #' + x.id);
  return bad;
}
try {
  for (const [w, h, cam, way] of [[640, 360, 'chase', 'lying (640 x 360)'], [360, 640, 'chase', 'upright (360 x 640)']]) {
    const { page, errors, ctx } = await openGame(browser, srv.base + '/index.html', { quality: 'normal', shadows: 0, camera: cam, track: 'jezero', autoGas: 0 }, { width: w, height: h });
    await startTrack(page, 'jezero');
    const a = await page.evaluate(START, { press: 0.12, after: true }), pa = placed(a);
    T.check(`${way}: a press 0.12 s after the lights: REAKCIJA 0,12 s in green, shown`, /^REAKCIJA 0,1[23] s$/.test(a.txt) && /\bshow\b/.test(a.cls) && /\bgood\b/.test(a.cls) && a.op > 0.9 && Math.abs(a.re - 0.12) < 0.02,
      JSON.stringify({ txt: a.txt, cls: a.cls, op: a.op, re: a.re, color: a.value }));
    T.check(`${way}: under the map, as wide as it, on the screen, over nothing else`, !pa.length, pa.join('; ') + ' ' + JSON.stringify({ me: a.me, map: a.map }));
    T.check(`${way}: the timing tower: ` + (w > h ? 'lying, the column\'s last, it stays under the reaction while it shows (fewer rows where the room runs out), no fewer once it is gone' : 'upright, under the damage picture and over the reaction (fewer rows where the room runs out), shown once it is gone'),
      a.towerOn && (w > h ? a.towerShown && a.rows >= 1 && a.tw.t >= a.me.b && a.after.tower && a.after.rows >= a.rows : (!a.towerShown || a.tw.b <= a.me.t + 0.5) && a.after.tower && a.after.rows >= 1) && !a.after.shown,   // (upright the rows by the order round the player, room enough: shown again after it)
      JSON.stringify({ tower: a.towerShown, rows: a.rows, top: a.tw.t, me: a.me.b, after: a.after }));
    await page.evaluate(() => window.__game.onAction('restart')); await page.waitForFunction(() => window.__game.phase === 'intro', null, { timeout: 60000 });
    const b = await page.evaluate(START, { held: true }), pb = placed(b);
    T.check(`${way}: the gas held through the lights: PREZGODAJ NA PLINU 0,60 s in red, under the map`, b.txt === 'PREZGODAJ NA PLINU 0,60 s' && /\bbad\b/.test(b.cls) && /\bheld\b/.test(b.cls) && b.held === true && b.op > 0.9 && !pb.length,
      JSON.stringify({ txt: b.txt, cls: b.cls, op: b.op, re: b.re, color: b.value }) + (pb.length ? ' ' + pb.join('; ') : ''));
    if (cam === 'chase') {
      await page.evaluate(() => window.__game.onAction('restart')); await page.waitForFunction(() => window.__game.phase === 'intro', null, { timeout: 60000 });
      const c = await page.evaluate(START, { press: 0.55, en: true }), pc = placed(c);
      T.check(`${way}: a late press (0.55 s), in English: REACTION 0.55 s in red, under the map`, /^REACTION 0\.5[56] s$/.test(c.txt) && /\bbad\b/.test(c.cls) && !/\bheld\b/.test(c.cls) && !pc.length,
        JSON.stringify({ txt: c.txt, cls: c.cls, re: c.re }) + (pc.length ? ' ' + pc.join('; ') : ''));
    }
    T.check(`${way}: no errors on the page`, !errors.length, errors.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally { await browser.close(); await srv.close(); }
T.done();
