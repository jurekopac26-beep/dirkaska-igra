/* =========================================================================
   NAPAKE — Orodje za napake (docs/orodje-za-napake.md): Označi in the replay
   Only in Slovenian: it builds its own DOM and never uses tr() (tests/lang.test.js asks English of every tr() and of index.html).
   Označi stands the replay still; over the picture a pencil in 6 colours, undo and an eraser. A closed loop opens a bubble of its
   colour beside it to write in (one colour on a picture is one note: every red loop goes to the red note); a bubble moves by its top.
   Dodaj k zbirki keeps the moment (the picture, the marks, the notes) in memory and puts a flag on the timeline.
   The game (js/game.js) gives its hooks with Napake.init.
   ========================================================================= */
const Napake = (function () {
  'use strict';
  const BARVE = [['rdeča', '#FF3B30'], ['oranžna', '#FF9500'], ['rumena', '#FFE14D'], ['modra', '#2AA8FF'], ['vijolična', '#C061FF'], ['bela', '#FFFFFF']];
  const SHOT = 1280;   // (px: the longer side of a kept moment's picture)
  const $ = (id) => document.getElementById(id);
  const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ICON = {
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-4.6L15.6 5a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z M13.8 6.8l3.4 3.4"/></svg>',
    undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5L4 9.5 8.5 14 M4 9.5h10a5.5 5.5 0 0 1 0 11h-3.5"/></svg>',
    erase: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 20h11 M4.4 14.6l9.2-9.2a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L11 20H8.6z M9.2 9.8l5 5"/></svg>'
  };
  let G = null;   // the game's hooks: replay(), rec(), stop(), seek(t), span(), shot(maxSide), info(), toast(text, ms)
  let M = null;   // the marking under way: { strokes [{ c, p: [[u, v] ...] (0..1 of the screen), loop }], hist, notes {colour: text}, pos {colour: [u, v]}, tool, col, cur, t }
  const Z = { rec: null, items: [] };   // the collection: the moments kept, for the recording they belong to
  let cv = null, cx = null, W = 0, H = 0, ask = 0;

  function init(hooks) {
    G = hooks; const R = $('replay-ui'); if (!R || cv) return;
    cv = mk('canvas'); cv.id = 'nk-cv'; R.insertBefore(cv, R.firstChild); cx = cv.getContext('2d');
    const bubs = mk('div'); bubs.id = 'nk-bubs'; cv.after(bubs);
    // Označi in the replay's bar (before Foto); on a narrow screen the pencil alone, as ★
    const on = mk('button', 'nk-on', '&#9998;<span class="rp-wd"> Označi</span>'); on.id = 'nk-on'; on.setAttribute('aria-label', 'Označi');
    $('rp-photo').before(on); on.addEventListener('click', (e) => { e.preventDefault(); open(); });
    // the palette: on its side down the left edge, upright a row above the timeline (CSS)
    const pal = mk('div', 'nk-pal'); pal.id = 'nk-pal';
    pal.innerHTML = '<button data-nk="pen" aria-label="Svinčnik">' + ICON.pen + '</button>' +
      BARVE.map(([n, c], k) => '<button data-nk="col" data-c="' + k + '" aria-label="' + n + '" style="--c:' + c + '"><i></i></button>').join('') +
      '<button data-nk="undo" aria-label="Razveljavi">' + ICON.undo + '</button><button data-nk="erase" aria-label="Radirka">' + ICON.erase + '</button>';
    const bar = mk('div', 'nk-bar', '<button data-nk="add" class="nk-add">+ Dodaj k zbirki</button><button data-nk="close" class="nk-close">Zapri</button>'); bar.id = 'nk-bar';
    const bot = R.querySelector('.rp-bot'); bot.insertBefore(pal, R.querySelector('.rp-line')); bot.appendChild(bar);
    for (const box of [pal, bar]) box.addEventListener('click', (e) => { const b = e.target.closest('[data-nk]'); if (!b) return; e.preventDefault(); act(b.dataset.nk, b); });
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', () => { if (M) { fit(); draw(); bubbles(); } });
  }

  /* ---------------- marking ---------------- */
  function open() {
    const P = G && G.replay(); if (!P || M || (P.hl && P.hl.auto)) return;
    G.stop();   // (the replay stands: the marks belong to this picture)
    M = { strokes: [], hist: [], notes: {}, pos: {}, tool: 'pen', col: 0, cur: null, t: P.t };
    ask = 0; $('replay-ui').classList.add('mark'); fit(); tools(); draw(); bubbles();
    G.toast('Obkroži, kar je narobe. Sklenjen krog odpre oblaček za zapis.', 3200);
  }
  function close() {
    if (!M) return; M = null; ask = 0;
    $('replay-ui').classList.remove('mark'); $('nk-bubs').innerHTML = ''; if (cx) cx.clearRect(0, 0, cv.width, cv.height);
    const a = document.activeElement; if (a && a.tagName === 'TEXTAREA') a.blur();
    closeBtn();
  }
  function act(a, b) {
    if (!M) return;
    if (a === 'pen') M.tool = 'pen';
    else if (a === 'col') { M.col = +b.dataset.c; M.tool = 'pen'; }
    else if (a === 'erase') M.tool = 'erase';
    else if (a === 'undo') undo();
    else if (a === 'add') { add(); return; }
    else if (a === 'close') {   // (marks on the picture: a second tap within 3 s throws them away)
      if (M.strokes.length && performance.now() - ask > 3000) { ask = performance.now(); closeBtn(); setTimeout(closeBtn, 3100); return; }
      close(); return;
    }
    tools();
  }
  function closeBtn() { const b = document.querySelector('#nk-bar .nk-close'); if (!b) return; const warn = !!M && performance.now() - ask < 3000; b.textContent = warn ? 'Zavrzi oznake?' : 'Zapri'; b.classList.toggle('warn', warn); }
  function tools() {
    const pal = $('nk-pal'); if (!pal || !M) return;
    for (const b of pal.querySelectorAll('[data-nk]')) {
      const a = b.dataset.nk; b.classList.toggle('sel', a === 'pen' ? M.tool === 'pen' : a === 'erase' ? M.tool === 'erase' : a === 'col' ? M.tool === 'pen' && +b.dataset.c === M.col : false);
    }
    pal.style.setProperty('--cur', BARVE[M.col][1]); cv.classList.toggle('rub', M.tool === 'erase');
    const u = pal.querySelector('[data-nk="undo"]'); u.disabled = !M.hist.length;
  }
  function fit() {
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    const pr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(W * pr); cv.height = Math.round(H * pr); cx.setTransform(pr, 0, 0, pr, 0, 0);
  }
  const lw = () => clamp(Math.min(W, H) * 0.011, 3.5, 7);   // (the pencil's width, px)
  function at(e) { const r = cv.getBoundingClientRect(); return [clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1), clamp((e.clientY - r.top) / Math.max(1, r.height), 0, 1)]; }
  function down(e) {
    if (!M || M.cur || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) { }
    const a = document.activeElement; if (a && a.tagName === 'TEXTAREA') a.blur();   // (writing done: the keyboard away)
    const p = at(e);
    if (M.tool === 'erase') { M.cur = { id: e.pointerId, gone: [] }; rub(p); }
    else { M.cur = { id: e.pointerId, s: { c: M.col, p: [p], loop: false } }; }
    draw();
  }
  function move(e) {
    const C = M && M.cur; if (!C || e.pointerId !== C.id) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    for (const ev of evs && evs.length ? evs : [e]) {
      const p = at(ev);
      if (C.gone) { rub(p); continue; }
      const q = C.s.p[C.s.p.length - 1]; if (Math.hypot((p[0] - q[0]) * W, (p[1] - q[1]) * H) >= 2) C.s.p.push(p);
    }
    draw();
  }
  function up(e) {
    const C = M && M.cur; if (!C || e.pointerId !== C.id) return;
    M.cur = null;
    if (C.gone) { if (C.gone.length) { M.hist.push({ gone: C.gone }); bubbles(); } }
    else {
      const s = C.s; s.loop = isLoop(s.p); M.strokes.push(s); M.hist.push({ add: s });
      if (s.loop) { const had = M.strokes.some(o => o !== s && o.loop && o.c === s.c); if (!had) place(s); bubbles(had ? -1 : s.c, had ? s.c : -1); }   // (a new bubble to write in; or the colour's bubble shown again)
    }
    tools(); draw();
  }
  // a closed loop: its end back by its start (or past it), and big enough to circle something
  function isLoop(pts) {
    if (pts.length < 6) return false;
    const P = pts.map(p => [p[0] * W, p[1] * H]); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, len = 0;
    for (let i = 0; i < P.length; i++) { const [x, y] = P[i]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); if (i) len += Math.hypot(x - P[i - 1][0], y - P[i - 1][1]); }
    const size = Math.max(x1 - x0, y1 - y0); if (size < 16 || len < 2.2 * size) return false;
    const gap = Math.max(22, 0.25 * size), n = Math.max(2, Math.ceil(P.length * 0.2)), near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= gap;
    const A = P[0], B = P[P.length - 1];
    if (near(A, B)) return true;
    for (let i = 0; i < n; i++) if (near(B, P[i]) || near(A, P[P.length - 1 - i])) return true;   // (an overshoot: the end past the start)
    return false;
  }
  // the eraser: any stroke under the finger goes (whole)
  function rub(p) {
    const r = Math.max(12, 2.5 * lw()), x = p[0] * W, y = p[1] * H;
    for (let j = M.strokes.length - 1; j >= 0; j--) {
      const s = M.strokes[j]; let hit = false;
      for (let i = 0; i < s.p.length && !hit; i++) {
        const a = s.p[i], b = s.p[Math.min(i + 1, s.p.length - 1)], ax = a[0] * W, ay = a[1] * H, dx = b[0] * W - ax, dy = b[1] * H - ay, L = dx * dx + dy * dy;
        const u = L ? clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1) : 0; hit = Math.hypot(ax + u * dx - x, ay + u * dy - y) <= r;
      }
      if (hit) { M.cur.gone.push({ s, j }); M.strokes.splice(j, 1); }
    }
  }
  function undo() {
    const h = M.hist.pop(); if (!h) return;
    if (h.add) { const j = M.strokes.indexOf(h.add); if (j >= 0) M.strokes.splice(j, 1); }
    else for (const g of h.gone.slice().reverse()) M.strokes.splice(Math.min(g.j, M.strokes.length), 0, g.s);   // (back where each was)
    draw(); bubbles();
  }
  function draw() {
    if (!cx) return; cx.clearRect(0, 0, W, H); if (!M) return;
    const w = lw(), all = M.cur && M.cur.s ? M.strokes.concat([M.cur.s]) : M.strokes;
    cx.lineCap = 'round'; cx.lineJoin = 'round';
    for (const pass of [0, 1]) for (const s of all) {   // (a dark edge under every line first: a white or yellow line on a light road too)
      cx.strokeStyle = cx.fillStyle = pass ? BARVE[s.c][1] : 'rgba(0,0,0,.45)'; cx.lineWidth = pass ? w : w + 3;
      if (s.p.length < 2) { cx.beginPath(); cx.arc(s.p[0][0] * W, s.p[0][1] * H, (pass ? w : w + 3) / 2, 0, 2 * Math.PI); cx.fill(); continue; }
      cx.beginPath(); cx.moveTo(s.p[0][0] * W, s.p[0][1] * H); for (let i = 1; i < s.p.length; i++) cx.lineTo(s.p[i][0] * W, s.p[i][1] * H); cx.stroke();
    }
  }

  /* ---------------- the bubbles (one a colour, while the picture has a loop of it) ---------------- */
  function box(s) { let x0 = 1, x1 = 0, y0 = 1, y1 = 0; for (const [x, y] of s.p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { x0: x0 * W, x1: x1 * W, y0: y0 * H, y1: y1 * H }; }
  function room() {   // where a bubble may be: clear of the palette on the left (on its side) and of the timeline and its bar below
    const bot = document.querySelector('#replay-ui .rp-bot'), pal = $('nk-pal'), rb = bot ? bot.getBoundingClientRect() : null, rp = pal ? pal.getBoundingClientRect() : null;
    const side = rp && rp.width && rp.height > rp.width * 2;   // (the palette down the left edge)
    return { l: (side ? rp.right : 0) + 8, t: 8, r: W - 8, b: (rb && rb.height ? rb.top : H) - 8 };
  }
  function bsize() { const w = Math.min(220, W * 0.46); return [w, 84]; }
  function place(s) {   // beside the loop: on its right, or its left where the right has no room; level with its top
    const b = box(s), [bw, bh] = bsize(), R = room();
    let x = b.x1 + 12; if (x + bw > R.r) x = b.x0 - 12 - bw; if (x < R.l) x = clamp(b.x1 + 12, R.l, R.r - bw);
    const y = clamp(b.y0, R.t, Math.max(R.t, R.b - bh));
    M.pos[s.c] = [x / W, y / H];
  }
  function bubbles(focus = -1, pulse = -1) {
    const host = $('nk-bubs'); if (!host) return;
    const want = M ? [...new Set(M.strokes.filter(s => s.loop).map(s => s.c))] : [];
    for (const el of [...host.children]) if (!want.includes(+el.dataset.c)) el.remove();
    for (const c of want) {
      let el = host.querySelector('.nk-bub[data-c="' + c + '"]');
      if (!el) {
        el = mk('div', 'nk-bub', '<div class="nk-grip"><span>' + BARVE[c][0] + '</span><b>&#8942;&#8942;</b></div><textarea rows="2" placeholder="Kaj je narobe?"></textarea>');
        el.dataset.c = c; el.style.setProperty('--c', BARVE[c][1]); host.appendChild(el);
        const ta = el.querySelector('textarea'); ta.value = M.notes[c] || '';
        ta.addEventListener('input', () => { if (M) M.notes[c] = ta.value; });
        ta.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); ta.blur(); } });   // (typing is not the game's keys)
        ta.addEventListener('keyup', (e) => e.stopPropagation());
        grip(el, c);
      } else if (c === pulse) { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      const p = M.pos[c] || [0.5, 0.3], [bw, bh] = bsize(), R = room();
      el.style.width = bw + 'px'; el.style.left = clamp(p[0] * W, R.l, Math.max(R.l, R.r - bw)) + 'px'; el.style.top = clamp(p[1] * H, R.t, Math.max(R.t, R.b - bh)) + 'px';
    }
    if (focus >= 0) { const ta = host.querySelector('.nk-bub[data-c="' + focus + '"] textarea'); if (ta && !ta.value) try { ta.focus({ preventScroll: true }); } catch (_) { } }
  }
  function grip(el, c) {   // the bubble moved by its top
    const g = el.querySelector('.nk-grip'); let d = null;
    g.addEventListener('pointerdown', (e) => { if (!M) return; e.preventDefault(); e.stopPropagation(); const r = el.getBoundingClientRect(); d = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top }; try { g.setPointerCapture(e.pointerId); } catch (_) { } el.classList.add('drag'); });
    g.addEventListener('pointermove', (e) => {
      if (!d || e.pointerId !== d.id || !M) return;
      const R = room(), x = clamp(e.clientX - d.dx, R.l, Math.max(R.l, R.r - el.offsetWidth)), y = clamp(e.clientY - d.dy, R.t, Math.max(R.t, R.b - el.offsetHeight));
      el.style.left = x + 'px'; el.style.top = y + 'px'; M.pos[c] = [x / W, y / H];
    });
    const end = (e) => { if (d && e.pointerId === d.id) { d = null; el.classList.remove('drag'); } };
    g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
  }

  /* ---------------- the collection ---------------- */
  function add() {
    const P = G.replay(); if (!P) return;
    const info = G.info() || {}, n = Z.items.length + 1;
    let img = null; try { img = G.shot(SHOT); } catch (_) { }
    const cols = [...new Set(M.strokes.filter(s => s.loop).map(s => s.c))].sort((a, b) => a - b);
    Z.items.push(Object.assign({ n, t: P.t, w: W, h: H, img,
      strokes: M.strokes.map(s => ({ c: s.c, barva: BARVE[s.c][0], loop: s.loop, p: s.p.map(q => q.slice()) })),
      zapisi: cols.map(c => ({ c, barva: BARVE[c][0], text: (M.notes[c] || '').trim(), pos: (M.pos[c] || [0, 0]).slice() })) }, info, { t: P.t }));
    close(); flags();
    G.toast('Trenutek ' + n + ' je v zbirki (' + clock(P.t) + '). Zastavica je na časovnici.', 2600);
  }
  const clock = (t) => { const d = Math.max(0, Math.round(t * 10)), m = Math.floor(d / 600); return String(m).padStart(2, '0') + ':' + ((d % 600) / 10).toFixed(1).padStart(4, '0'); };
  // the flags of the moments kept, on the timeline (a tap: the replay there, standing)
  function flags() {
    const line = $('rp-line'), sp = G && G.span(); if (!line) return;
    for (const f of line.querySelectorAll('.nk-flag')) f.remove();
    if (!sp) return;
    for (const it of Z.items) {
      if (it.t > sp[1] + 1e-6) continue;   // (the race so far: a moment kept later on is not yet there)
      const f = mk('b', 'nk-flag', '<span>' + it.n + '</span>'); f.style.left = (100 * clamp((it.t - sp[0]) / Math.max(1e-3, sp[1] - sp[0]), 0, 1)).toFixed(2) + '%';
      f.setAttribute('aria-label', 'Trenutek ' + it.n);
      f.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (!M) G.seek(it.t); });
      line.appendChild(f);
    }
  }
  function sync() {   // the replay's buttons drawn again (js/game.js replayUI): a new recording starts a new collection
    if (!G) return; const rec = G.rec();
    if (rec !== Z.rec) { Z.rec = rec; Z.items = []; }
    flags();
  }

  return { init, open, close, sync,
    get on() { return !!M; },
    get zbirka() { return Z.items; },
    get barve() { return BARVE.map(b => b.slice()); },
    get stanje() {   // (the tests)
      const host = $('nk-bubs');
      return { on: !!M, tool: M ? M.tool : null, col: M ? M.col : -1, strokes: M ? M.strokes.map(s => ({ c: s.c, loop: s.loop, n: s.p.length })) : [], hist: M ? M.hist.length : 0, notes: M ? Object.assign({}, M.notes) : {},
        bubbles: host ? [...host.children].map(el => { const r = el.getBoundingClientRect(); return { c: +el.dataset.c, x: r.left, y: r.top, w: r.width, h: r.height, text: el.querySelector('textarea').value }; }) : [],
        zbirka: Z.items.map(it => ({ n: it.n, t: it.t, lap: it.lap, s: it.s, img: it.img ? [it.img.width, it.img.height] : null, strokes: it.strokes.length, zapisi: it.zapisi.map(z => z.barva + ': ' + z.text) })) };
    } };
})();
