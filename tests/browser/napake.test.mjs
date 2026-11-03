// Orodje za napake · Označi (sklop 5 of docs/orodje-za-napake.md; js/napake.js): Bathurst at 25 s by the quick entry, Posnetek do sem.
// Označi stands the replay; the drawing over the picture, the palette down the left edge (on its side) or a row above the timeline
// (upright); a closed loop opens a bubble of its colour beside it and the keyboard writes in it (an I typed there is a letter, not Nazaj v
// dirko); an open line opens none; a second loop of a colour goes to the same bubble; undo and the eraser (and undo of the eraser); a
// bubble moved by its top; Zapri with marks asks first; Dodaj k zbirki keeps the moment (its time, lap, metres from the start, the
// picture, the notes) and puts a flag on the timeline; the flag's tap: the replay there; the collection kept through Nazaj v dirko.
// Zgodovina napak (sklop 18): from the marking's bar and the choice; kept after Deli (the small picture and the text without Obdrži tudi
// slike v igri); its state Neposlano → Poslano → Popravljeno → Zaprto (by hand), shared again; on its side and upright; the last 100, 20 with pictures.
// Poslano by hand in a record and Označi vse kot poslane (a second tap within 3 s) for collections sent some other way.
// Beležka (the notebook): always open bottom right over the picture, the keyboard in it with no click (a computer), back in it after
// drawing and a tool, a letter typed anywhere goes in it, Escape takes the cursor out; its note with the moment, first in the text.
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
  // the notebook: open bottom right, bigger than a bubble, the keyboard in it at once (its O and I letters: not Prikaz za razvijalca, not Nazaj v dirko)
  const B0 = (await nk()).belezka, bt0 = await Q.evaluate(() => Math.min(...[...document.querySelectorAll('#replay-ui .rp-bot, #replay-ui .rp-zdaj')].map(e => e.getBoundingClientRect()).filter(r => r.height).map(r => r.top)));
  T.check('the notebook (Beležka) open bottom right over the picture (clear of the timeline and ZDAJ, inside the screen), bigger than a bubble, the cursor in it',
    B0.vis && B0.focus && B0.text === '' && B0.x > L.W / 2 && B0.x + B0.w <= L.W && B0.y >= 0 && B0.y + B0.h <= bt0 && B0.w > 220 && B0.h > 84 && B0.fs >= 14, JSON.stringify({ B0, bt0 }));
  await Q.keyboard.type('Nebo utripa. Ovinek I'); await qf(1);
  const B1 = await nk(), rB = await rp(), dv = await Q.evaluate(() => Napake.nast.dev);
  T.check('typed with no click: in the notebook (its O and I letters: no Prikaz za razvijalca, the replay stays)', B1.on && B1.belezka.text === 'Nebo utripa. Ovinek I' && dv === 0 && !!rB && rB.here, JSON.stringify({ text: B1.belezka.text, dv, rp: rB }));

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
  T.check('a colour tapped and a line drawn: the keyboard back in the notebook', s3.belezka.focus, JSON.stringify(s3.belezka));
  await tap('#nk-pal [data-c="3"]'); await loop(140, 225, 30); await Q.keyboard.type('Tekmeci v koloni');
  await tap('#nk-pal [data-c="0"]'); await loop(560, 60, 25); await qf(1);
  const s4 = await nk();
  T.check('a blue loop: a blue bubble with its note; a second red loop: no second red bubble (one colour, one note)',
    s4.strokes.length === 4 && s4.strokes.every((s, k) => s.loop === (k !== 1)) && s4.bubbles.length === 2 && s4.bubbles.filter(b => b.c === 0).length === 1 && s4.notes[3] === 'Tekmeci v koloni' && s4.notes[0] === s2.notes[0],
    JSON.stringify({ strokes: s4.strokes, bubbles: s4.bubbles.map(b => [b.c, b.text]) }));
  // Escape: the cursor out of the notebook (the marking stays); a letter typed then goes into it again
  await Q.keyboard.press('Escape'); const B2 = await nk();
  await Q.keyboard.type(' Predlog: manj megle?'); const B3 = await nk();
  T.check('Escape: the cursor out of the notebook, the marking stays; typing again: in the notebook (no click)',
    B2.on && !B2.belezka.focus && B3.on && B3.belezka.focus && B3.belezka.text === 'Nebo utripa. Ovinek I Predlog: manj megle?', JSON.stringify({ B2: B2.belezka, B3: B3.belezka }));

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
  const rl = (await Q.evaluate(() => Napake.porocilo())).split('\n').filter(l => /^#1 /.test(l));
  T.check('the notebook\'s note with the moment, first in the text (#1 time K1 s=…m beležka »…«), then the bubble\'s (rdeča »…« v_krogu=[…])',
    it.bel === B3.belezka.text && rl.length === 2 && /^#1 \d\d:\d\d\.\d{3} K1 s=\d+m beležka »Nebo utripa\. Ovinek I Predlog: manj megle\?«$/.test(rl[0]) && rl[1].includes(' rdeča »' + s2.notes[0] + '« v_krogu=['), JSON.stringify({ bel: it.bel, rl }));
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

  // Zgodovina napak (sklop 18): from the marking's bar, the choice and the settings; the collection kept after Deli (Obdrži tudi slike v igri
  // off: the small picture and the text); its state by hand (Popravljeno, Zaprto), shared again (the state stays); at most 100 kept, the newest 20 with their pictures
  await Q.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: srv.base });
  await Q.evaluate(() => { window.__shared = null; Object.defineProperty(navigator, 'canShare', { configurable: true, value: (d) => !!(d && d.files && d.files.length) });
    Object.defineProperty(navigator, 'share', { configurable: true, value: (d) => { window.__shared = { names: d.files.map(f => f.name), types: d.files.map(f => f.type), text: d.text }; return Promise.resolve(); } }); });
  await Q.waitForFunction(async () => (await Napake.shranjene()).length === 1, null, { timeout: 30000, polling: 200 });
  const fits = () => Q.evaluate(() => { const box = document.querySelector('#nk-zg .nk-box'), b = box.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    const out = [...box.querySelectorAll('button')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect()).filter(r => r.left < b.left - 0.5 || r.right > b.right + 0.5);
    return { box: b.left >= 0 && b.top >= 0 && b.right <= W && b.bottom <= H, wide: box.scrollWidth <= box.clientWidth + 1, out: out.length, W, H }; });
  const fitOk = (f) => f.box && f.wide && f.out === 0;
  const zbar = await Q.evaluate(() => { const b = [...document.querySelectorAll('#nk-bar button')].map(e => e.getBoundingClientRect()); return { n: b.length, rows: new Set(b.map(r => Math.round(r.top))).size, in: b.every(r => r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight) }; });
  await tap('#nk-bar [data-nk="zg"]'); await Q.waitForSelector('#nk-zg .nk-item');
  const z0 = (await nk()).zg, zf0 = await fits();
  T.check('Zgodovina in the marking\'s bar (Dodaj k zbirki, Zgodovina, Zapri in one row): the collection kept (the track, the date, 1 moment, 0 flags, Neposlano); inside the screen on its side',
    zbar.n === 3 && zbar.rows === 1 && zbar.in && z0.items.length === 1 && /^Bathurst, Avstralija \d+\. \d+\. \d{4} \d\d:\d\d · 1 trenutek · 0 zastavic Neposlano$/.test(z0.items[0]) && fitOk(zf0), JSON.stringify({ zbar, z0, zf0 }));
  await tap('#nk-zg [data-nk-d="zapri"]'); await tap('#nk-bar .nk-close');
  // the choice: Obdrži tudi slike v igri off, Deli: still in Zgodovina napak, Poslano, the small picture and the text
  await Q.evaluate(() => Napake.izbira()); await Q.waitForSelector('#nk-dlg [data-nk-d="deli"]');
  await Q.click('#nk-dlg .nk-keep input'); await Q.click('#nk-dlg [data-nk-d="deli"]');
  await Q.waitForFunction(() => window.__shared && !document.getElementById('nk-dlg'), null, { timeout: 30000, polling: 100 }); await Q.waitForTimeout(300);
  const h1 = await Q.evaluate(async () => (await Napake.shranjene()).map(r => ({ status: r.status, files: r.files.length, nf: r.nf, thumb: !!r.thumb, text: /^RRA-NAPAKE /.test(r.text) })));
  T.check('Deli with Obdrži tudi slike v igri off: the collection stays in Zgodovina napak as Poslano, its small picture and its text (the picture out)', h1.length === 1 && h1[0].status === 'poslano' && h1[0].files === 0 && h1[0].nf === 1 && h1[0].thumb && h1[0].text, JSON.stringify(h1));
  // Zgodovina from the choice: over it; a tap opens the record (its picture, its state, its text, Deli / Shrani malo sliko / Kopiraj besedilo / Izbriši)
  await Q.evaluate(() => Napake.izbira()); await Q.waitForSelector('#nk-dlg [data-nk-d="zg"]'); await tap('#nk-dlg [data-nk-d="zg"]');
  await Q.waitForSelector('#nk-zg .nk-item');
  const over = await Q.evaluate(() => { const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2); return !!(e && e.closest('#nk-zg')) && !!document.getElementById('nk-dlg'); });
  await tap('#nk-zg .nk-item'); await Q.waitForSelector('#nk-zg .nk-sts');
  const y1 = (await nk()).zg, txt = await Q.evaluate(async () => (await Napake.shranjene())[0].text);
  T.check('Zgodovina from the choice, over it; a tap opens the record: the small picture, Poslano, its text, Deli / Shrani malo sliko / Kopiraj besedilo / Izbriši',
    over && y1.st === 'Poslano' && y1.text === txt && y1.acts.join() === 'Deli,Shrani malo sliko,Kopiraj besedilo,Izbriši' && (await Q.evaluate(() => { const i = document.querySelector('#nk-zg .nk-prev img'); return !!i && i.complete && i.naturalWidth === 320; })), JSON.stringify(y1));
  // Poslano by hand too (sent some other way): Neposlano, then Poslano
  await tap('#nk-zg .nk-sts [data-v="neposlano"]'); await Q.waitForFunction(() => Napake.stanje.zg && Napake.stanje.zg.st === 'Neposlano', null, { timeout: 10000 });
  const w0 = await Q.evaluate(async () => (await Napake.shranjene())[0].status);
  await tap('#nk-zg .nk-sts [data-v="poslano"]'); await Q.waitForFunction(() => Napake.stanje.zg && Napake.stanje.zg.st === 'Poslano', null, { timeout: 10000 });
  const w0b = await Q.evaluate(async () => (await Napake.shranjene())[0].status);
  T.check('the state by hand: Neposlano, then Poslano (sent some other way)', w0 === 'neposlano' && w0b === 'poslano', JSON.stringify({ w0, w0b }));
  await tap('#nk-zg .nk-sts [data-v="popravljeno"]'); await Q.waitForFunction(() => Napake.stanje.zg && Napake.stanje.zg.st === 'Popravljeno', null, { timeout: 10000 });
  const w1 = await Q.evaluate(async () => (await Napake.shranjene())[0].status);
  await tap('#nk-zg .nk-sts [data-v="zaprto"]'); await Q.waitForFunction(() => Napake.stanje.zg && Napake.stanje.zg.st === 'Zaprto', null, { timeout: 10000 });
  await Q.evaluate(() => { window.__shared = null; }); await tap('#nk-zg [data-nk-d="deli"]');
  await Q.waitForFunction(() => window.__shared, null, { timeout: 10000 }); await Q.waitForTimeout(200);
  await tap('#nk-zg [data-nk-d="besedilo"]'); await Q.waitForTimeout(200);
  const w2 = await Q.evaluate(async () => ({ st: (await Napake.shranjene())[0].status, sh: window.__shared, clip: await navigator.clipboard.readText().catch(() => '') }));
  T.check('the state by hand: Popravljeno, Zaprto (kept); Deli again sends the small picture and the text, Zaprto stays; Kopiraj besedilo copies the text',
    w1 === 'popravljeno' && w2.st === 'zaprto' && w2.sh.names.length === 1 && /^napake_bathurst_\d{8}-\d{4}_mala\.jpg$/.test(w2.sh.names[0]) && w2.sh.types[0] === 'image/jpeg' && w2.sh.text === txt && w2.clip === txt, JSON.stringify({ w1, w2: Object.assign({}, w2, { clip: w2.clip.slice(0, 40) }) }));
  // upright (360 × 640): the record and the list inside the screen
  await Q.setViewportSize({ width: 360, height: 640 }); await Q.waitForTimeout(200);
  const zf1 = await fits(); await tap('#nk-zg [data-nk-d="nazaj"]'); await Q.waitForSelector('#nk-zg .nk-item'); const zf2 = await fits();
  T.check('upright (360 × 640): Zgodovina napak inside the screen (the record, the list), nothing wider than its box', fitOk(zf1) && fitOk(zf2), JSON.stringify({ zf1, zf2 }));
  await tap('#nk-zg [data-nk-d="zapri"]'); await Q.evaluate(() => { const d = document.querySelector('#nk-dlg [data-nk-d="zapri"]'); if (d) d.click(); });
  await Q.setViewportSize({ width: 640, height: 360 });
  // the bounds: 105 more (older) collections: 100 kept, the newest 20 with their pictures, the older ones the small picture and the text
  const B = await Q.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 32; c.height = 20; c.getContext('2d').fillRect(0, 0, 8, 8);
    const jpg = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8)), png = await new Promise(r => c.toBlob(r, 'image/png')), now = Date.now();
    for (let k = 0; k < 105; k++) await Napake.zg.put({ id: 't' + k, name: 'napake_t' + k, date: now - (k + 1) * 60000, track: 'bathurst', tname: 'Bathurst, Avstralija', n: 1, flags: 0, text: 'RRA-NAPAKE t' + k, status: 'neposlano', files: [{ name: 't' + k + '.png', blob: png, w: 32, h: 20 }], thumb: jpg });
    const l = await Napake.shranjene();
    return { n: l.length, MAX: Napake.zg.MAX, FULL: Napake.zg.FULL, first: l[0].id, full: l.slice(1, 20).every(r => r.files.length === 1), lite: l.slice(20).every(r => !r.files.length && r.nf === 1 && r.thumb && r.text), ids: l.map(r => r.id) };
  });
  T.check('the bounds: at most 100 kept (the oldest out), the newest 20 with their pictures, the older ones the small picture and the text', B.n === 100 && B.MAX === 100 && B.FULL === 20 && B.first !== 't0' && B.full && B.lite && B.ids.includes('t98') && !B.ids.includes('t99') && !B.ids.includes('t104'),
    JSON.stringify(Object.assign({}, B, { ids: B.ids.slice(-3) })));
  await Q.evaluate(() => Napake.zgodovina()); await Q.waitForSelector('#nk-zg .nk-item');
  const zn = await Q.evaluate(() => ({ items: document.querySelectorAll('#nk-zg .nk-item').length, head: document.querySelector('#nk-zg .nk-zg-n').textContent }));
  T.check('Zgodovina napak lists all 100', zn.items === 100 && zn.head === 'Shranjene zbirke (100)', JSON.stringify(zn));
  // Označi vse kot poslane: the first tap asks (nothing changed), the second within 3 s marks every Neposlano as Poslano (Zaprto stays)
  const cnt = () => Q.evaluate(async () => (await Napake.shranjene()).reduce((o, r) => { o[r.status] = (o[r.status] || 0) + 1; return o; }, {}));
  await tap('#nk-zg [data-nk-d="vsepos"]'); await Q.waitForTimeout(150);
  const v1 = await Q.evaluate(() => document.querySelector('#nk-zg [data-nk-d="vsepos"]').textContent), c1 = await cnt();
  await tap('#nk-zg [data-nk-d="vsepos"]');
  await Q.waitForFunction(() => document.querySelectorAll('#nk-zg .nk-item .st-neposlano').length === 0 && document.querySelectorAll('#nk-zg .nk-item').length === 100, null, { timeout: 10000 });
  const c2 = await cnt();
  T.check('Označi vse kot poslane: the first tap asks ("Res? Neposlanih: 99 → Poslano", nothing changed), the second marks the 99 Poslano, Zaprto stays',
    v1 === 'Res? Neposlanih: 99 → Poslano' && c1.neposlano === 99 && c1.zaprto === 1 && c2.poslano === 99 && c2.zaprto === 1 && !c2.neposlano, JSON.stringify({ v1, c1, c2 }));
  T.check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await Q.context().close();
} catch (e) {
  T.check('test ran through', false, e.stack || String(e));
} finally {
  await browser.close();
  await srv.close();
}
T.done();
