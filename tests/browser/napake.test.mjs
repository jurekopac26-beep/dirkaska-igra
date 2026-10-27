// Orodje za napake · Označi (sklop 5 of docs/orodje-za-napake.md; js/napake.js): Bathurst at 25 s by the quick entry, Posnetek do sem.
// Označi stands the replay; the drawing over the picture, the palette down the left edge (on its side) or a row above the timeline
// (upright); a closed loop opens a bubble of its colour beside it and the keyboard writes in it (an I typed there is a letter, not Nazaj v
// dirko); an open line opens none; a second loop of a colour goes to the same bubble; undo and the eraser (and undo of the eraser); a
// bubble moved by its top; Zapri with marks asks first; Dodaj k zbirki keeps the moment (its time, lap, metres from the start, the
// picture, the notes) and puts a flag on the timeline; the flag's tap: the replay there; the collection kept through Nazaj v dirko.
//   node tests/browser/napake.test.mjs
import { serve, launch, openGame, checker } from './lib.mjs';

const T = checker('napake');
const srv = await serve();
const browser = await launch();
try {
  const { page: Q, errors } = await openGame(browser, srv.base + '/index.html?proga=bathurst&t=25', { quality: 'normal', shadows: 0, camera: 'chase' }, { width: 640, height: 360 });
  await Q.waitForFunction(() => window.__game.quick && window.__game.quick.done, null, { timeout: 240000, polling: 250 });
  await Q.evaluate(() => { window.__rf = 0; const o = Render.frame; Render.frame = function () { window.__rf++; return o.apply(this, arguments); }; });
  const qf = (n) => Q.evaluate((n) => new Promise(res => { const f0 = window.__rf, chk = () => window.__rf - f0 >= n ? res() : setTimeout(chk, 20); chk(); }), n);
  const nk = () => Q.evaluate(() => Napake.stanje);
  const rp = () => Q.evaluate(() => { const P = window.__game.replay; return P && { t: P.t, t0: P.t0, t1: P.t1, play: P.play, here: !!P.here }; });
  // a loop drawn with the mouse (an ellipse round cx, cy), a line, a tool or a colour tapped
  const loop = async (cx, cy, r) => { await Q.mouse.move(cx + r, cy); await Q.mouse.down(); for (let a = 0.2; a <= 2 * Math.PI + 0.25; a += 0.2) await Q.mouse.move(cx + r * Math.cos(a), cy + 0.7 * r * Math.sin(a)); await Q.mouse.up(); };
  const line = async (x0, y0, x1, y1) => { await Q.mouse.move(x0, y0); await Q.mouse.down(); await Q.mouse.move(x1, y1, { steps: 12 }); await Q.mouse.up(); };
  const tap = (sel) => Q.click(sel);
  const r = (sel) => Q.evaluate((sel) => { const e = document.querySelector(sel); if (!e || e.offsetParent === null && getComputedStyle(e).position !== 'fixed') return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; }, sel);
  const vis = (sel) => Q.evaluate((sel) => { const e = document.querySelector(sel); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; }, sel);

  await Q.click('#pause-rp'); await qf(4);
  const on0 = await r('#nk-on');
  T.check('Posnetek do sem: "Označi" in the replay\'s bar (the pencil)', !!on0 && on0.w >= 30 && (await Q.evaluate(() => document.getElementById('nk-on').getAttribute('aria-label'))) === 'Označi', JSON.stringify(on0));

  // Označi on its side: the replay stands, the palette down the left edge, Dodaj k zbirki and Zapri for the bar, the timeline beside the palette
  await tap('#nk-on'); await qf(2);
  const a0 = await rp(); await qf(6); const a1 = await rp(), s0 = await nk();
  const L = await Q.evaluate(() => { const b = (e) => e.getBoundingClientRect(), pal = [...document.querySelectorAll('#nk-pal button')].map(b), ln = b(document.getElementById('rp-line')), W = innerWidth, H = innerHeight;
    const show = (sel) => { const e = document.querySelector(sel); return !!e && getComputedStyle(e).display !== 'none'; };
    return { n: pal.length, col: new Set(pal.map(p => Math.round(p.left))).size === 1, inside: pal.every(p => p.left >= 0 && p.top >= 0 && p.bottom <= H && p.right < 70 && p.width >= 30), lineRight: ln.left > Math.max(...pal.map(p => p.right)),
      bar: show('#nk-bar'), rpBar: show('#replay-ui .rp-bar'), top: show('#replay-ui .rp-top'), cv: show('#nk-cv'), cvFull: b(document.getElementById('nk-cv')).width === W, W, H }; });
  T.check('"Označi": the replay stands (its time the same over 6 frames), the marking on with the pencil in red', s0.on && !a0.play && a1.t === a0.t && s0.tool === 'pen' && s0.col === 0, JSON.stringify({ a0, a1, on: s0.on, tool: s0.tool }));
  T.check('on its side (640 × 360): the palette (pencil, 6 colours, undo, eraser) down the left edge inside the screen, the timeline beside it; Dodaj k zbirki and Zapri for the replay\'s buttons; the drawing over the whole picture',
    L.n === 9 && L.col && L.inside && L.lineRight && L.bar && !L.rpBar && !L.top && L.cv && L.cvFull, JSON.stringify(L));

  // a red loop: its bubble beside it, the keyboard writing in it (I is a letter here)
  await loop(250, 150, 50); await qf(1);
  const s1 = await nk(), foc = await Q.evaluate(() => { const a = document.activeElement; return a && a.tagName === 'TEXTAREA' ? +a.closest('.nk-bub').dataset.c : -1; });
  const b1 = s1.bubbles[0], room = await Q.evaluate(() => ({ bot: document.querySelector('#replay-ui .rp-bot').getBoundingClientRect().top, pal: document.getElementById('nk-pal').getBoundingClientRect().right }));
  T.check('a closed red loop: a red bubble beside it (clear of the loop, the palette and the timeline, inside the screen), the cursor in it',
    s1.strokes.length === 1 && s1.strokes[0].loop && s1.bubbles.length === 1 && b1.c === 0 && (b1.x >= 300 || b1.x + b1.w <= 200) && b1.x >= room.pal && b1.y + b1.h <= room.bot && b1.x + b1.w <= 640 && b1.y >= 0 && foc === 0,
    JSON.stringify({ strokes: s1.strokes, bubbles: s1.bubbles, room, foc }));
  await Q.keyboard.type('Sledi gum sredi ravnine, Inženirji'); await qf(1);
  const s2 = await nk(), r2 = await rp();
  T.check('typed into the bubble: the red note (its I a letter: the replay stays, no Nazaj v dirko)', s2.on && s2.notes[0] === 'Sledi gum sredi ravnine, Inženirji' && s2.bubbles[0].text === s2.notes[0] && !!r2 && r2.here, JSON.stringify({ notes: s2.notes, rp: r2 }));

  // an open orange line: no bubble; a blue loop: its own bubble; a second red loop: the red bubble still the one
  await tap('#nk-pal [data-c="1"]'); await line(380, 70, 470, 110);
  const s3 = await nk();
  T.check('an orange line (open): drawn, no bubble for it', s3.col === 1 && s3.strokes.length === 2 && !s3.strokes[1].loop && s3.strokes[1].c === 1 && s3.bubbles.length === 1, JSON.stringify(s3.strokes));
  await tap('#nk-pal [data-c="3"]'); await loop(140, 225, 30); await Q.keyboard.type('Tekmeci v koloni');
  await tap('#nk-pal [data-c="0"]'); await loop(560, 60, 25); await qf(1);
  const s4 = await nk();
  T.check('a blue loop: a blue bubble with its note; a second red loop: no second red bubble (one colour, one note)',
    s4.strokes.length === 4 && s4.strokes.every((s, k) => s.loop === (k !== 1)) && s4.bubbles.length === 2 && s4.bubbles.filter(b => b.c === 0).length === 1 && s4.notes[3] === 'Tekmeci v koloni' && s4.notes[0] === s2.notes[0],
    JSON.stringify({ strokes: s4.strokes, bubbles: s4.bubbles.map(b => [b.c, b.text]) }));

  // undo: the second red loop, then the blue one (its bubble gone, its note kept for an undo of the eraser ...)
  await tap('#nk-pal [data-nk="undo"]'); const u1 = await nk();
  await tap('#nk-pal [data-nk="undo"]'); const u2 = await nk();
  T.check('undo: the last red loop goes (the red bubble stays: the first loop is there); again: the blue loop and its bubble go',
    u1.strokes.length === 3 && u1.bubbles.length === 2 && u2.strokes.length === 2 && u2.bubbles.length === 1 && u2.bubbles[0].c === 0, JSON.stringify({ u1: u1.strokes, u2: u2.strokes, b: u2.bubbles.map(b => b.c) }));
  // the eraser: across the orange line, it goes; undo brings it back
  await tap('#nk-pal [data-nk="erase"]'); await line(425, 60, 425, 120);
  const e1 = await nk();
  await tap('#nk-pal [data-nk="undo"]'); const e2 = await nk();
  T.check('the eraser across the orange line: it goes, the red loop stays; undo: the line back', e1.tool === 'erase' && e1.strokes.length === 1 && e1.strokes[0].c === 0 && e2.strokes.length === 2 && e2.strokes[1].c === 1, JSON.stringify({ e1: e1.strokes, e2: e2.strokes }));

  // the red bubble moved by its top
  const g = await r('.nk-bub[data-c="0"] .nk-grip'), bb0 = (await nk()).bubbles[0];
  await Q.mouse.move(g.x + 20, g.y + g.h / 2); await Q.mouse.down(); await Q.mouse.move(g.x - 40, g.y + g.h / 2 + 30, { steps: 6 }); await Q.mouse.up();
  const bb1 = (await nk()).bubbles[0], s5 = await nk();
  T.check('the bubble moved by its top (60 px left, 30 down), its note and the marks as they were', Math.abs(bb1.x - (bb0.x - 60)) < 2 && Math.abs(bb1.y - (bb0.y + 30)) < 2 && bb1.text === bb0.text && s5.strokes.length === 2,
    JSON.stringify({ from: [bb0.x, bb0.y], to: [bb1.x, bb1.y] }));

  // Zapri with marks: it asks first (a second tap would throw them away)
  await tap('#nk-bar .nk-close'); const z1 = await nk(), zt = await Q.evaluate(() => document.querySelector('#nk-bar .nk-close').textContent);
  T.check('"Zapri" with marks on the picture: it asks first ("Zavrzi oznake?"), the marks stay', z1.on && z1.strokes.length === 2 && zt === 'Zavrzi oznake?', zt);

  // Dodaj k zbirki: the moment kept, a flag on the timeline
  await tap('#nk-bar .nk-add'); await qf(2);
  const k1 = await nk(), r3 = await rp(), fl = await Q.evaluate(() => [...document.querySelectorAll('#rp-line .nk-flag')].map(f => ({ left: parseFloat(f.style.left), n: f.textContent })));
  const it = k1.zbirka[0], want = r3 ? 100 * (it.t - r3.t0) / (r3.t1 - r3.t0) : NaN;
  T.check('"Dodaj k zbirki": the marking off, the replay\'s buttons back; the moment kept (its time, lap 1, metres from the start, the picture 1280 px, the marks, the notes by colour)',
    !k1.on && (await vis('#replay-ui .rp-bar')) && !(await vis('#nk-bar')) && k1.zbirka.length === 1 && Math.abs(it.t - a0.t) < 1e-6 && it.lap === 1 && it.s > 0 && it.s < 6300 && !!it.img && Math.max(...it.img) === 1280 &&
    it.strokes === 2 && it.zapisi.length === 1 && it.zapisi[0] === 'rdeča: ' + s2.notes[0], JSON.stringify(it));
  T.check('a flag "1" on the timeline where the moment is', fl.length === 1 && fl[0].n === '1' && Math.abs(fl[0].left - want) < 0.2, JSON.stringify({ fl, want }));

  // upright (360 × 640): the palette a row above the timeline, the bar below it
  await Q.setViewportSize({ width: 360, height: 640 }); await Q.evaluate(() => window.__game.onAction('rp-restart')); await qf(3);
  await tap('#nk-on'); await qf(2);
  const P = await Q.evaluate(() => { const b = (e) => e.getBoundingClientRect(), pal = [...document.querySelectorAll('#nk-pal button')].map(b), ln = b(document.getElementById('rp-line')), bar = b(document.getElementById('nk-bar')), W = innerWidth;
    return { n: pal.length, row: new Set(pal.map(p => Math.round(p.top))).size === 1, inside: pal.every(p => p.left >= 0 && p.right <= W && p.width >= 30), above: Math.max(...pal.map(p => p.bottom)) < ln.top - 10, below: bar.top > ln.bottom, barIn: bar.left >= 0 && bar.right <= W }; });
  T.check('upright (360 × 640): the palette in one row above the timeline (clear of ZDAJ), inside the screen; Dodaj k zbirki and Zapri below the timeline', P.n === 9 && P.row && P.inside && P.above && P.below && P.barIn, JSON.stringify(P));
  await loop(120, 250, 45); await qf(1);
  const p1 = await nk(), pb = p1.bubbles[0], palTop = (await r('#nk-pal')).y;
  T.check('upright: a loop\'s bubble inside the screen, above the palette', p1.bubbles.length === 1 && pb.x >= 0 && pb.x + pb.w <= 360 && pb.y + pb.h <= palTop && pb.w <= 0.5 * 360, JSON.stringify({ pb, palTop }));
  await tap('#nk-bar .nk-close'); await tap('#nk-bar .nk-close'); await qf(1);
  const p2 = await nk();
  T.check('"Zapri" twice: the marks thrown away, the collection as it was (one moment)', !p2.on && p2.strokes.length === 0 && p2.bubbles.length === 0 && p2.zbirka.length === 1, JSON.stringify({ on: p2.on, zb: p2.zbirka.length }));

  // the flag's tap: the replay at the moment, standing
  await Q.evaluate(() => { const P = window.__game.replay; if (!P.play) window.__game.onAction('rp-play'); }); await qf(2);
  const f = await r('#rp-line .nk-flag'); await Q.mouse.click(f.x + f.w / 2, f.y + 4); await qf(2);
  const r4 = await rp();
  T.check('a tap on the flag: the replay at the moment kept, standing', Math.abs(r4.t - it.t) < 1e-6 && !r4.play, JSON.stringify({ t: r4.t, want: it.t, play: r4.play }));

  // Nazaj v dirko, then Posnetek do sem again: the collection and its flag still there (the same race)
  await Q.setViewportSize({ width: 640, height: 360 });
  await Q.evaluate(() => window.__game.onAction('rp-race'));
  await Q.waitForFunction(() => !window.__game.paused && window.__game.rpCount === 0, null, { timeout: 90000, polling: 100 }); await qf(4);
  await Q.keyboard.press('KeyI'); await qf(3);
  const k2 = await nk(), fl2 = await Q.evaluate(() => document.querySelectorAll('#rp-line .nk-flag').length), r5 = await rp();
  T.check('Nazaj v dirko, then Posnetek do sem again: the moment still in the collection, its flag on the (longer) timeline', !!r5 && r5.here && k2.zbirka.length === 1 && fl2 === 1, JSON.stringify({ zb: k2.zbirka.length, fl2 }));
  // Označi, then I (Nazaj v dirko's key) while marking: nothing (the marks are not lost by a key)
  await tap('#nk-on'); await qf(1); await Q.keyboard.press('KeyI'); await qf(2);
  const k3 = await nk(), r6 = await rp();
  T.check('the key I while marking: the marking and the replay stay', k3.on && !!r6 && r6.here, JSON.stringify({ on: k3.on, rp: !!r6 }));
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await Q.context().close();
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
