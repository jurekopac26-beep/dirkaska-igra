/* =========================================================================
   NAPAKE — Orodje za napake (docs/orodje-za-napake.md): Označi in the replay, the picture to send, the flag in the race
   Only in Slovenian: it builds its own DOM and never uses tr() (tests/lang.test.js asks English of every tr() and of index.html).
   Označi stands the replay still; over the picture a pencil in 6 colours, undo and an eraser. A closed loop opens a bubble of its
   colour beside it to write in (one colour on a picture is one note: every red loop goes to the red note); a bubble moves by its top.
   Dodaj k zbirki keeps the moment (the picture, the marks, the notes, 3 more pictures of its motion) in memory and puts a flag on the
   timeline. The collection becomes a picture (the moments, the track's data and map, the text for the chat), kept in the game's
   Zgodovina napak (IndexedDB: the last 100, the newest 20 with their pictures; its state Neposlano, Poslano, Popravljeno, Zaprto) and
   offered at the end of the replay (Deli zdaj, Samo shrani sliko, Kopiraj besedilo) or by Deli at any time.
   The flag in the race (the button by the pause button, F, the pad's Select) keeps only the race's time; the replay's Zastavice goes
   through them. Its settings (Nastavitve · Orodje za napake) are its own (tdgp-napake). The game (js/game.js) gives its hooks with Napake.init.
   The log (Dnevnik napak: the page's errors, the promises let down, the hitches of the race; the last 50, kept in the game) goes with the
   report; Prikaz za razvijalca (O) shows the frame counter of the game with more lines. What a loop circles goes with its note (v_krogu);
   the recording itself flags what looks wrong (a car standing, a jump, under the road, a rival the wrong way; the log's hitches): grey on
   the timeline, Potrdi or Zavrzi.
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
    erase: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 20h11 M4.4 14.6l9.2-9.2a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L11 20H8.6z M9.2 9.8l5 5"/></svg>',
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4 M6 4.5h11l-2.6 4 2.6 4H6"/></svg>'
  };
  // the game's hooks: replay(), rec(), stop(), seek(t), span(), shot(maxSide), info(), toast(text, ms), ui() (the replay's buttons again),
  // where(t) (the player's car at a time: lap, s, x, z), meta() (version, track, mode, weather), map() (the track's line), shotAt(t, maxSide),
  // flag() (a flag in the race now: { t, n } or null), flags() (the race's flags: [{ t }]), inLoops(loops) (the names of what the loops circle),
  // track(), recW (the numbers a car in a sample of the recording), dev(on) (Prikaz za razvijalca), kje() (the race now: { t, track, rec, lap, s })
  let G = null;
  let M = null;   // the marking under way: { strokes [{ c, p: [[u, v] ...] (0..1 of the screen), loop }], hist, notes {colour: text}, pos {colour: [u, v]}, tool, col, cur, t }
  const Z = { rec: null, items: [], id: '', d0: null, meta: null, map: null, out: null, done: '' };   // the collection: the moments kept, for the recording they belong to (out: its picture as made, done: the version last shared or saved)
  let cv = null, cx = null, W = 0, H = 0, ask = 0;

  function init(hooks) {
    G = hooks; const R = $('replay-ui'); if (!R || cv) return;
    cv = mk('canvas'); cv.id = 'nk-cv'; R.insertBefore(cv, R.firstChild); cx = cv.getContext('2d');
    // the notebook (Beležka): always open in Označi, bottom right over the picture; the bubbles over it
    const note = mk('div', 'nk-note', '<div class="nk-note-h"><b>Beležka</b><span>napake · predlogi · vprašanja</span></div><textarea placeholder="Kaj je narobe? Predlog, vprašanje …" aria-label="Beležka"></textarea>');
    note.id = 'nk-note'; cv.after(note); pisi(note.querySelector('textarea'), (v) => { M.bel = v; });
    const bubs = mk('div'); bubs.id = 'nk-bubs'; note.after(bubs);
    // Označi in the replay's bar (before Foto); on a narrow screen the pencil alone, as ★
    const on = mk('button', 'nk-on', '&#9998;<span class="rp-wd"> Označi</span>'); on.id = 'nk-on'; on.setAttribute('aria-label', 'Označi');
    $('rp-photo').before(on); on.addEventListener('click', (e) => { e.preventDefault(); open(); });
    // the palette: on its side down the left edge, upright a row above the timeline (CSS)
    const pal = mk('div', 'nk-pal'); pal.id = 'nk-pal';
    pal.innerHTML = '<button data-nk="pen" aria-label="Svinčnik">' + ICON.pen + '</button>' +
      BARVE.map(([n, c], k) => '<button data-nk="col" data-c="' + k + '" aria-label="' + n + '" style="--c:' + c + '"><i></i></button>').join('') +
      '<button data-nk="undo" aria-label="Razveljavi">' + ICON.undo + '</button><button data-nk="erase" aria-label="Radirka">' + ICON.erase + '</button>';
    const bar = mk('div', 'nk-bar', '<button data-nk="add" class="nk-add">+ Dodaj k zbirki</button><button data-nk="zg" class="nk-zgb">Zgodovina</button><button data-nk="close" class="nk-close">Zapri</button>'); bar.id = 'nk-bar';
    const bot = R.querySelector('.rp-bot'); bot.insertBefore(pal, R.querySelector('.rp-line')); bot.appendChild(bar);
    for (const box of [pal, bar]) box.addEventListener('click', (e) => { const b = e.target.closest('[data-nk]'); if (!b) return; e.preventDefault(); act(b.dataset.nk, b); });
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', () => { if (M) { fit(); draw(); bubbles(); belPos(); } });
    window.addEventListener('keydown', (e) => {   // (a computer, Označi: a letter typed anywhere goes into the notebook, not to the game)
      const t = e.target; if (!M || coarse() || e.ctrlKey || e.metaKey || e.altKey || String(e.key || '').length !== 1 || (t && (/^(TEXTAREA|INPUT|SELECT)$/.test(t.tagName) || t.isContentEditable)) || document.querySelector('#nk-zg, #nk-dlg, #nk-set')) return;
      e.stopPropagation(); belFocus();
    }, true);
    // Deli (the collection, at any time) beside Zastavice's Prejšnja / Naslednja
    const deli = mk('button', 'nk-deli off', '&#8679; Deli'); deli.id = 'nk-deli'; deli.setAttribute('aria-label', 'Deli zbirko napak');
    const row2 = R.querySelector('.rp-row2'); if (row2) row2.appendChild(deli);
    deli.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); izbira(); });
    // Nastavitve: a row of its own (Slovenian only: not on the English page, css)
    const list = document.querySelector('#s-settings .set-list');
    if (list) { const row = mk('div', 'row nk-setrow', '<span class="rlbl">Orodje za napake</span><button class="btn mini" id="nk-set-open">Nastavitve orodja</button>'); list.appendChild(row);
      row.querySelector('button').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); nastavitve(); }); }
    nLoad(); naprava(); apply();
  }

  /* ---------------- marking ---------------- */
  function open() {
    const P = G && G.replay(); if (!P || M || !N.on || (P.hl && P.hl.auto)) return;
    G.stop();   // (the replay stands: the marks belong to this picture)
    M = { strokes: [], hist: [], notes: {}, pos: {}, bel: '', tool: 'pen', col: 0, cur: null, t: P.t };
    ask = 0; $('replay-ui').classList.add('mark'); fit(); tools(); draw(); bubbles();
    belTa().value = ''; belPos(); belFocus();   // (a phone: its keyboard only at a tap on the notebook)
    G.toast((coarse() ? 'Zapis v beležko spodaj desno.' : 'Kar tipkaj: zapis gre v beležko.') + ' Obkroži, kar je narobe: sklenjen krog odpre oblaček.', 3200);
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
    else if (a === 'zg') { zgodovina(); return; }
    else if (a === 'close') {   // (marks on the picture: a second tap within 3 s throws them away)
      if ((M.strokes.length || M.bel.trim()) && performance.now() - ask > 3000) { ask = performance.now(); closeBtn(); setTimeout(closeBtn, 3100); return; }
      close(); return;
    }
    tools(); belFocus();
  }
  function closeBtn() { const b = document.querySelector('#nk-bar .nk-close'); if (!b) return; const warn = !!M && performance.now() - ask < 3000; b.textContent = warn ? (M.strokes.length ? 'Zavrzi oznake?' : 'Zavrzi zapis?') : 'Zapri'; b.classList.toggle('warn', warn); }
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
    tools(); draw(); belFocus();
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
    let y = clamp(b.y0, R.t, Math.max(R.t, R.b - bh));
    const q = $('nk-note').getBoundingClientRect(); if (q.width && x + bw > q.left && y + bh > q.top - 8 && q.top - 8 - bh >= R.t) y = q.top - 8 - bh;   // (clear of the notebook: above it)
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
        const ta = el.querySelector('textarea'); ta.value = M.notes[c] || ''; pisi(ta, (v) => { M.notes[c] = v; });
        grip(el, c);
      } else if (c === pulse) { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
      const p = M.pos[c] || [0.5, 0.3], [bw, bh] = bsize(), R = room();
      el.style.width = bw + 'px'; el.style.left = clamp(p[0] * W, R.l, Math.max(R.l, R.r - bw)) + 'px'; el.style.top = clamp(p[1] * H, R.t, Math.max(R.t, R.b - bh)) + 'px';
    }
    if (focus >= 0) { const ta = host.querySelector('.nk-bub[data-c="' + focus + '"] textarea'); if (ta && !ta.value) try { ta.focus({ preventScroll: true }); } catch (_) { } }
  }
  function pisi(ta, set) {   // a note written: typing is not the game's keys (Escape: the cursor out)
    ta.addEventListener('input', () => { if (M) set(ta.value); });
    ta.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); ta.blur(); } });
    ta.addEventListener('keyup', (e) => e.stopPropagation());
  }
  /* the notebook (Beležka): the moment's note (errors, suggestions, questions), with marks or without; a computer's keyboard writes in it at
     once (and after drawing, a tool, a letter typed anywhere), a phone's only after a tap on it (its keyboard would cover the picture) */
  const belTa = () => document.querySelector('#nk-note textarea');
  function belPos() {   // its bottom clear of the timeline, its bar and ZDAJ over its end (its right edge, size: css)
    let top = H; for (const e of document.querySelectorAll('#replay-ui .rp-bot, #replay-ui .rp-zdaj')) { const r = e.getBoundingClientRect(); if (r.height) top = Math.min(top, r.top); }
    $('nk-note').style.bottom = Math.round(H - top + 8) + 'px';
  }
  function belFocus() {   // (not while a bubble is written in)
    const ta = belTa(), a = document.activeElement; if (!M || coarse() || (a && a !== ta && /^(TEXTAREA|INPUT)$/.test(a.tagName))) return;
    try { ta.focus({ preventScroll: true }); } catch (_) { }
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
    const cols = [...new Set(M.strokes.filter(s => s.loop).map(s => s.c))].sort((a, b) => a - b);
    const vk = {}; for (const c of cols) { try { vk[c] = G.inLoops(M.strokes.filter(s => s.loop && s.c === c).map(s => s.p)); } catch (_) { vk[c] = []; } }   // (what each colour's loops circle: before the pictures, the camera as on the screen)
    let img = null; try { img = G.shot(SHOT); } catch (_) { }
    const gib = GIB.map(d => d ? small(G.shotAt(P.t + d, GIB_PX), GIB_PX) : null);   // (the motion: 0.6 s and 0.3 s before, 0.3 s after; the moment's own is its picture)
    const bt = M.bel.trim(), nr = $('nk-note').getBoundingClientRect(), belezka = bt ? { text: bt, r: [nr.left / W, nr.top / H, nr.width / W, nr.height / H], fs: parseFloat(getComputedStyle(belTa()).fontSize) || 15 } : null;
    if (!Z.items.length) { Z.d0 = new Date(); Z.id = 'nk-' + Z.d0.getTime(); Z.meta = G.meta(); Z.map = G.map(); }
    Z.items.push(Object.assign({ n, t: P.t, w: W, h: H, img, gib, belezka,
      strokes: M.strokes.map(s => ({ c: s.c, barva: BARVE[s.c][0], loop: s.loop, p: s.p.map(q => q.slice()) })),
      zapisi: cols.map(c => ({ c, barva: BARVE[c][0], text: (M.notes[c] || '').trim(), pos: (M.pos[c] || [0, 0]).slice(), v: vk[c] || [] })) }, info, { t: P.t }));
    close(); G.ui();
    G.toast('Trenutek ' + n + ' je v zbirki (' + clock(P.t) + '). Zastavica je na časovnici.', 2600);
    setTimeout(() => { pripravi().catch(() => { }); }, 60);   // (the picture made and kept in the game meanwhile: Deli has it at once)
  }
  const GIB = [-0.6, -0.3, 0, 0.3], GIB_PX = 400;
  function small(src, max) {   // a picture made smaller (the long side max px)
    if (!src) return null; const k = Math.min(1, max / Math.max(src.width, src.height)); if (k >= 1) return src;
    const c = mk('canvas'); c.width = Math.max(1, Math.round(src.width * k)); c.height = Math.max(1, Math.round(src.height * k)); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); return c;
  }
  // a time: 00:41.3 (d 1) or 00:41.327 (d 3)
  const clock = (t, d = 1) => { const f = Math.pow(10, d), u = Math.max(0, Math.round(t * f)), m = Math.floor(u / (60 * f)); return String(m).padStart(2, '0') + ':' + ((u % (60 * f)) / f).toFixed(d).padStart(3 + d, '0'); };
  // the flags on the timeline: the moments kept (numbered) and the race's own not yet marked (⚑); a tap: the replay there, standing
  function flags() {
    const line = $('rp-line'), sp = G && G.span(); if (!line) return;
    for (const f of line.querySelectorAll('.nk-flag, .nk-auto')) f.remove();
    if (!sp) return;
    for (const f of samodejne()) {   // (the tool's own: grey with !, confirmed white; a tap: the replay there and what it is, Potrdi / Zavrzi)
      const b = mk('b', 'nk-auto' + (f.st === 'ok' ? ' ok' : ''), '<span>!</span>');
      b.style.left = (100 * clamp((f.t - sp[0]) / Math.max(1e-3, sp[1] - sp[0]), 0, 1)).toFixed(2) + '%'; b.setAttribute('aria-label', 'Samodejna zastavica: ' + VRSTE[f.kind]);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (!M) { G.seek(f.t); aPokazi(f); } });
      line.appendChild(b);
    }
    for (const p of tocke()) {
      if (p.kind === 'samo') continue;
      const race = p.kind === 'dirka', f = mk('b', 'nk-flag' + (race ? ' dirka' : ''), '<span>' + (race ? '&#9873;' : p.n) + '</span>');
      f.style.left = (100 * clamp((p.t - sp[0]) / Math.max(1e-3, sp[1] - sp[0]), 0, 1)).toFixed(2) + '%';
      f.setAttribute('aria-label', (race ? 'Zastavica ' : 'Trenutek ') + p.n);
      f.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (!M) G.seek(p.t); });
      line.appendChild(f);
    }
  }
  // the flags for Zastavice, by time: the moments kept and the race's flags not marked
  function tocke() {
    if (!G) return []; const rec = G.rec(), sp = G.span(), end = sp ? sp[1] + (rec && rec.file ? 0.25 : 1e-6) : Infinity, out = [], done = pokrite();   // (an opened file: its recording ends there, a flag just after its last sample is still its own)
    for (const it of Z.items) if (it.t <= end) out.push({ t: it.t, kind: 'zbirka', n: it.n });   // (the race so far: a moment kept later on is not yet there)
    G.flags().forEach((f, j) => { if (f.t <= end && !done.has(j)) out.push({ t: f.t, kind: 'dirka', n: j + 1 }); });
    potrjene().forEach((f, j) => { if (f.t <= end) out.push({ t: f.t, kind: 'samo', n: j + 1 }); });
    return out.sort((a, b) => a.t - b.t);
  }
  // the race's flags marked: each moment kept stands for the nearest flag it is from 2 s after to 1 s before (Zastavice plays a flag so)
  function pokrite() {
    const F = G ? G.flags() : [], done = new Set();
    for (const it of Z.items) { let best = -1; F.forEach((f, j) => { if (!done.has(j) && it.t >= f.t - 2 && it.t <= f.t + 1 && (best < 0 || Math.abs(f.t - it.t) < Math.abs(F[best].t - it.t))) best = j; }); if (best >= 0) done.add(best); }
    return done;
  }
  function sync() {   // the replay's buttons drawn again (js/game.js replayUI): a new recording starts a new collection
    if (!G) return; const rec = G.rec();
    if (rec !== Z.rec) { Z.rec = rec; Z.items = []; Z.id = ''; Z.meta = Z.map = Z.out = null; Z.done = ''; }
    aIsci(); flags();
    const d = $('nk-deli'); if (d) { const n = Z.items.length; d.classList.toggle('off', !n || !N.on || !!(G.replay() && G.replay().hl && G.replay().hl.auto)); d.innerHTML = '&#8679; Deli (' + n + ')'; }
  }

  /* ---------------- the flag in the race: the button beside the pause button (with it, css), F, the pad's Select ---------------- */
  let dOn = false;   // (a race a flag may be put in: js/game.js showScreen; never with a friend)
  function dirka(on) { dOn = !!on; flBtn(); }
  function flBtn() {
    let b = $('nk-fl');
    if (!b) {
      const p = $('btn-pause'); if (!p) return;
      b = mk('button', 'nk-fl off', ICON.flag); b.id = 'nk-fl'; b.setAttribute('aria-label', 'Zastavica'); p.after(b);   // (right after the pause button: hidden with it, css)
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); flag('btn'); });   // (at the touch: not the touch controls' pointer)
      b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (e.detail === 0) flag('btn'); });   // (a key on the focused button)
    }
    b.classList.toggle('off', !(dOn && N.on && N.flag === 'btn'));
  }
  function flag(src) {   // only the race's time is kept: nothing else happens meanwhile
    if (!G || !N.on || N.flag === 'off' || (src === 'btn' && N.flag !== 'btn')) return;
    const r = G.flag(); if (!r) return;
    G.toast('⚑ Zastavica ' + r.n + ' · ' + clock(r.t) + ' – dirka teče naprej', 1800);
    const b = $('nk-fl'); if (b) { b.classList.remove('tap'); requestAnimationFrame(() => b.classList.add('tap')); }
  }

  /* ---------------- the log (Dnevnik napak): the page's errors, the promises let down, the hitches in the race (under 20 frames a second
     for over 1 s); the last 50, kept in the game (tdgp-napake-dnevnik: after a crash the next visit still has them, Nastavitve orodja) ---------------- */
  const LOG_KEY = 'tdgp-napake-dnevnik', LOG_MAX = 50, ZAT = { ms: 1000 / 20, dur: 1000, gap: 250 };   // (a hitch: frames over 50 ms apart for over 1 s; it ends 250 ms after its last slow frame)
  const REC = typeof Symbol === 'function' ? Symbol('rec') : '_rec';   // (the recording a note belongs to: in memory only, never in the saved log)
  const D = { l: [], n: 0, run: null, last: 0, save: 0 };   // (l: [{ w (the clock, ms), kind (napaka, obljuba, zatik), msg, src, x (times), t, track, lap, s (the race then), ms, fps, worst (a hitch), old (an earlier visit's) }]; n: notes this visit)
  function dLoad() { try { const l = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); if (Array.isArray(l)) D.l = l.filter(e => e && typeof e === 'object' && typeof e.kind === 'string').slice(-LOG_MAX).map(e => Object.assign(e, { old: 1 })); } catch (_) { } }
  function dSave() { try { localStorage.setItem(LOG_KEY, JSON.stringify(D.l)); } catch (_) { } }
  function zapis(kind, msg, src, more) {
    msg = String(msg == null ? '' : msg).replace(/\s+/g, ' ').trim().slice(0, 240); src = String(src || '');
    const L = D.l[D.l.length - 1];
    if (L && !L.old && L.kind === kind && kind !== 'zatik' && L.msg === msg && L.src === src) { L.x = (L.x || 1) + 1; dLater(); return L; }   // (the same error every frame: once, counted)
    let k = null; try { k = G && G.kje ? G.kje() : null; } catch (_) { }
    const e = Object.assign({ w: Date.now(), kind, msg, src }, k ? { t: +k.t.toFixed(2), track: k.track, lap: k.lap, s: k.s } : {}, more || {});
    if (k) e[REC] = k.rec;
    D.l.push(e); D.n++; if (D.l.length > LOG_MAX) D.l.splice(0, D.l.length - LOG_MAX);
    dSave(); return e;
  }
  function dLater() { if (!D.save) D.save = setTimeout(() => { D.save = 0; dSave(); }, 2000); }
  const kraj = (f) => { try { const u = new URL(f, location.href); return (u.origin === location.origin ? u.pathname.replace(/^.*?\/(js|css)\//, '$1/') : u.href).replace(/\?v=\w+/, ''); } catch (_) { return String(f || ''); } };   // (js/render.js, not the whole address)
  try {
    window.addEventListener('error', (e) => { if (!e || !e.message) return; zapis('napaka', e.message, e.filename ? kraj(e.filename) + ':' + (e.lineno || 0) + ':' + (e.colno || 0) : ''); });
    window.addEventListener('unhandledrejection', (e) => { const r = e && e.reason; zapis('obljuba', r && r.message ? (r.name ? r.name + ': ' : '') + r.message : String(r)); });
    document.addEventListener('visibilitychange', () => { D.last = 0; D.run = null; });   // (back to the page: the frames stood while it was hidden, no hitch)
  } catch (_) { }
  dLoad();
  // the hitches, from the game's frame times (js/game.js frame, beside the frame counter PH.tick): on, while the race is driven
  function okvir(now, on) {
    const dt = D.last ? now - D.last : 0; D.last = now;
    if (!on || !(dt > 0)) { zEnd(); return; }
    const R = D.run;
    if (dt > ZAT.ms) {
      if (!R) { let k = null; try { k = G && G.kje ? G.kje() : null; } catch (_) { } D.run = { t0: now - dt, t1: now, n: 1, nk: 1, worst: dt, k }; }
      else { R.n++; R.nk = R.n; R.t1 = now; R.worst = Math.max(R.worst, dt); }
    } else if (R) { R.n++; if (now - R.t1 > ZAT.gap) zEnd(); }
  }
  function zEnd() {
    const R = D.run; D.run = null; if (!R) return;
    const dur = R.t1 - R.t0, fps = R.nk * 1000 / Math.max(1, dur); if (dur < ZAT.dur || fps >= 1000 / ZAT.ms) return;
    const k = R.k, e = { w: Date.now(), kind: 'zatik', msg: '', src: '', ms: Math.round(dur), fps: +fps.toFixed(1), worst: Math.round(R.worst) };
    if (k) { Object.assign(e, { t: +k.t.toFixed(2), track: k.track, lap: k.lap, s: k.s }); e[REC] = k.rec; }
    D.l.push(e); D.n++; if (D.l.length > LOG_MAX) D.l.splice(0, D.l.length - LOG_MAX); dSave();
  }
  // the log for a report: this race's notes (its hitches, its errors) and the errors of this visit elsewhere
  const dnevnik = () => ((Z.rec && Z.rec.file && Z.rec.file.dn) || []).concat(D.l.filter(e => (e[REC] && e[REC] === Z.rec) || (!e.old && e.kind !== 'zatik' && !(e[REC] && e[REC] !== Z.rec))));   // (an opened file: its race's notes first)
  const vejica = (x, d = 1) => x.toFixed(d).replace('.', ',');
  function dVrstica(e) {   // D 00:41.3 K2 s=1284m zatik 1,4 s · 8 sličic/s · najdaljša 420 ms   /   D ob 14:03:12 napaka »...« js/render.js:12:5 (×3)
    const d = new Date(e.w), kdaj = e.t != null ? clock(e.t) + (e.lap ? ' K' + e.lap : '') + (e.s != null ? ' s=' + e.s + 'm' : '') + (e.track && e.track !== (Z.meta && Z.meta.track) ? ' proga=' + e.track : '') : 'ob ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
    const kaj = e.kind === 'zatik' ? 'zatik ' + vejica(e.ms / 1000) + ' s · ' + vejica(e.fps) + ' sličic/s · najdaljša ' + e.worst + ' ms' : e.kind + ' »' + e.msg + '«' + (e.src ? ' ' + e.src : '') + (e.x > 1 ? ' (×' + e.x + ')' : '');
    return 'D ' + kdaj + ' ' + kaj + (e.old ? ' (prejšnji obisk)' : '');
  }

  /* ---------------- Prikaz za razvijalca (O, Nastavitve orodja): the game's frame counter (PH in js/game.js) with more lines ---------------- */
  function dev() {
    if (!G || !N.on) return;
    N.dev = N.dev ? 0 : 1; nSave(); G.toast('Prikaz za razvijalca: ' + (N.dev ? 'vklop' : 'izklop'), 1400);
  }

  /* ---------------- the tool's own flags (samodejne zastavice): what the recording tells (zaznaj), and the log's hitches. Grey with ! on
     the timeline; a tap shows what it is: Potrdi (into Zastavice, the report) or Zavrzi. Found after the race (or Posnetek do sem) in slices
     of a few ms, never in the race ---------------- */
  // the limits: a car standing (under v m/s) over stoji s, once it has moved (over gre m/s); a jump of more than its speed's way by preskok m
  // (across) or poskok m (up or down) in one sample; pod m under the road on it; a rival going the wrong way (over vnaz m/s) for over nazaj s;
  // the same of a car within spoj s: one; at most max
  const AZ = { stoji: 5, v: 0.8, gre: 3, preskok: 2.5, poskok: 2.5, pod: 1, podT: 0.2, nazaj: 2, vnaz: 3, spoj: 10, max: 40 };
  const VRSTE = { obtical: 'Avto stoji', preskok: 'Preskok', poskok: 'Skok gor ali dol', pod_cesto: 'Pod cesto', nazaj: 'Vozi v napačno smer', zatik: 'Zatikanje' };
  // a scan of recording R (frames, n, cars) on track T, W numbers a car, frames i0 .. i1; S its state (to go on from), out the flags found
  function zaznaj(R, T, W, S, out, i0, i1) {
    const F = R.frames, n = R.n, eo = {};
    if (!S.c) S.c = Array.from({ length: n }, () => ({ t: null, q: {}, qi: -1 }));
    const push = (kind, t, k, val, opis) => {
      const o = out.find(f => f.kind === kind && f.k === k && Math.abs(f.t - t) < AZ.spoj);
      if (o) { if (val > o.val) { o.val = val; o.opis = opis; } return; }
      if (out.length >= AZ.max) { S.vec = (S.vec || 0) + 1; return; }
      out.push({ id: S.id = (S.id || 0) + 1, kind, t, k, val, opis, st: 'nov' });
    };
    for (let i = i0; i < i1; i++) {
      const f = F[i], t = f[0];
      for (let k = 0; k < n; k++) {
        const c = S.c[k], o = 1 + k * W, x = f[o], y = f[o + 1], z = f[o + 2], v = Math.abs(f[o + 4]), bits = f[o + 6] % 8, off = bits & 4, res = bits & 2;   // (off: in the pit lane, finished, retired; res: put back on the road)
        if (!Number.isFinite(x + y + z)) continue;
        if (c.t == null) { c.t = t; c.x = x; c.y = y; c.z = z; c.v = v; c.q = T.query(x, z, -1, c.q); c.qi = c.q.i; continue; }
        const dt = Math.max(1e-3, t - c.t), d = Math.hypot(x - c.x, z - c.z);
        if (!res) {   // (put back on the road: a jump that is no bug)
          const lim = Math.max(v, c.v) * dt * 1.5 + AZ.preskok; if (d > lim) push('preskok', c.t, k, d, 'skok ' + vejica(d) + ' m v eni sličici');
          const dy = Math.abs(y - c.y); if (dy > AZ.poskok + Math.max(v, c.v) * dt * 0.5) push('poskok', c.t, k, dy, 'navpično ' + vejica(dy) + ' m v eni sličici');
        }
        if (v > AZ.gre) c.moved = true;
        if (c.moved && !off && !res && v < AZ.v) { if (c.s0 == null) c.s0 = t; } else if (c.s0 != null) { if (t - c.s0 > AZ.stoji) push('obtical', c.s0, k, t - c.s0, 'stoji ' + vejica(t - c.s0) + ' s'); c.s0 = null; }
        const q = c.q = T.query(x, z, c.qi, c.q); c.qi = q.i;
        const onRoad = !(q.k >= 0) && Math.abs(q.d) < T.wAt(q.a) - 0.5, ry = T.hasElev ? T.elevAt(q.s, eo).y : 0, bank = T.bank ? T.bank[q.a] * T.wAt(q.a) : 0;
        const under = onRoad && !res && y < ry - AZ.pod - bank;
        if (under) { if (c.u0 == null) { c.u0 = t; c.um = 0; } c.um = Math.max(c.um, ry - y); }
        else if (c.u0 != null) { if (t - c.u0 >= AZ.podT) push('pod_cesto', c.u0, k, c.um, vejica(c.um) + ' m pod cesto'); c.u0 = null; }
        const back = !R.cars[k].isPlayer && !off && !res && d / dt > AZ.vnaz && ((x - c.x) * q.tx + (z - c.z) * q.tz) / Math.max(1e-6, d) < -0.5;
        if (back) { if (c.b0 == null) c.b0 = c.t; } else if (c.b0 != null) { if (t - c.b0 > AZ.nazaj) push('nazaj', c.b0, k, t - c.b0, 'v napačno smer ' + vejica(t - c.b0) + ' s'); c.b0 = null; }
        c.t = t; c.x = x; c.y = y; c.z = z; c.v = v;
      }
    }
    if (i1 >= F.length && F.length) {   // (the recording's end so far: what is still going on counts as it is; later it is the same flag, longer)
      const t = F[F.length - 1][0];
      S.c.forEach((c, k) => {
        if (c.s0 != null && t - c.s0 > AZ.stoji) push('obtical', c.s0, k, t - c.s0, 'stoji ' + vejica(t - c.s0) + ' s');
        if (c.u0 != null && t - c.u0 >= AZ.podT) push('pod_cesto', c.u0, k, c.um, vejica(c.um) + ' m pod cesto');
        if (c.b0 != null && t - c.b0 > AZ.nazaj) push('nazaj', c.b0, k, t - c.b0, 'v napačno smer ' + vejica(t - c.b0) + ' s');
      });
    }
    return out;
  }
  const A = { rec: null, i: 0, S: null, l: [], zat: new Map(), job: 0 };   // (the recording scanned, the next frame, the scan's state, the flags found, the log's hitches as flags)
  function aIsci() {   // (sync: the replay's buttons drawn again; the scan goes on in slices while the replay is open)
    const rec = G && G.rec(); if (!rec) return;
    if (rec !== A.rec) { A.rec = rec; A.i = 0; A.S = { id: 0 }; A.l = []; A.zat = new Map(); if (A.job) clearTimeout(A.job); A.job = 0; aSkrij(); }
    if (!A.job && A.i < rec.frames.length && G.replay()) A.job = setTimeout(aKos, 30);
  }
  function aKos() {
    A.job = 0; const rec = G && G.rec(); if (!rec || rec !== A.rec || !G.replay()) return;
    const t0 = performance.now(), F = rec.frames, T = G.track(); let i = A.i;
    try { while (i < F.length && performance.now() - t0 < 6) { const j = Math.min(F.length, i + Math.max(4, Math.round(400 / rec.n))); zaznaj(rec, T, G.recW, A.S, A.l, i, j); i = j; } }
    catch (e) { i = F.length; zapis('napaka', 'zaznaj: ' + (e && e.message), ''); }
    A.i = i;
    if (i < F.length) A.job = setTimeout(aKos, 16); else { A.l.sort((a, b) => a.t - b.t); flags(); }
  }
  function samodejne() {   // the tool's own flags of this recording, by time (the scan's and the log's hitches), not thrown away
    if (!G || !A.rec || A.rec !== G.rec()) return [];
    const pk = Math.max(0, A.rec.cars.findIndex(c => c.isPlayer)), F = A.rec.frames, t1 = F.length ? F[F.length - 1][0] : 0;   // (t1: a hitch no later than the recording, one just before the pause)
    for (const e of D.l.filter(e => e[REC] === A.rec).concat((A.rec.file && A.rec.file.dn) || [])) if (e.kind === 'zatik' && e.t != null && !A.zat.has(e)) A.zat.set(e, { id: 'z' + A.zat.size, kind: 'zatik', t: Math.min(e.t, t1), k: pk, val: e.ms, opis: vejica(e.ms / 1000) + ' s pod 20 sličic/s (' + vejica(e.fps) + ' sličic/s)', st: 'nov' });
    return A.l.concat([...A.zat.values()]).filter(f => f.st !== 'ne').sort((a, b) => a.t - b.t);
  }
  const potrjene = () => samodejne().filter(f => f.st === 'ok');
  const avIme = (f) => { const c = A.rec && A.rec.cars[f.k]; return !c ? '' : c.isPlayer ? 'ti' : 'tekmec#' + f.k; };
  // what a flag of the tool's own is, over the replay: Potrdi / Zavrzi
  function aPokazi(f) {
    let el = $('nk-auto'); if (!el) { el = mk('div', 'nk-auto-dlg'); el.id = 'nk-auto'; const bot = $('replay-ui').querySelector('.rp-bot'); bot.insertBefore(el, bot.querySelector('.rp-line')); }   // (above the timeline: the picture clear)
    const c = A.rec && A.rec.cars[f.k];
    el.innerHTML = '<b>! ' + VRSTE[f.kind] + '</b><span>' + clock(f.t) + (c ? ' · ' + (c.isPlayer ? 'ti' : 'tekmec#' + f.k + ' (' + String(c.name || '').replace(/[<>&"]/g, '') + ')') : '') + ' · ' + f.opis + '</span>' +
      '<div>' + (f.st === 'ok' ? '<em>potrjena</em>' : '<button data-a="ok">Potrdi</button>') + '<button data-a="ne">Zavrzi</button><button data-a="x" aria-label="Zapri">&#10005;</button></div>';
    el.dataset.id = f.id;
    el.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); e.stopPropagation(); const a = b.dataset.a;
      if (a === 'ok') { f.st = 'ok'; G.toast('Potrjena: ' + VRSTE[f.kind] + ' (' + clock(f.t) + '). Je v Zastavicah in v poročilu.', 2200); }
      else if (a === 'ne') f.st = 'ne';
      aSkrij(); G.ui(); };
  }
  function aSkrij() { const el = $('nk-auto'); if (el) el.remove(); }

  /* ---------------- the report: the text for the chat and the picture ---------------- */
  // the device: the phone's model (Chrome gives it on Android: SM-A256B is a Galaxy A25), else the system; the browser
  const MODELI = [[/^SM-S938/i, 'Galaxy S25 Ultra'], [/^SM-S936/i, 'Galaxy S25+'], [/^SM-S93[01]/i, 'Galaxy S25'], [/^SM-A256/i, 'Galaxy A25'], [/^SM-A266/i, 'Galaxy A26'], [/^SM-A356/i, 'Galaxy A35'], [/^SM-A556/i, 'Galaxy A55'], [/^SM-S928/i, 'Galaxy S24 Ultra'], [/^SM-S92[01]/i, 'Galaxy S24']];
  const DEV = { model: '', os: '', br: '' };
  function naprava() {
    const ua = navigator.userAgent || '', D = navigator.userAgentData;
    DEV.os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
    const m = /Edg\/(\d+)/.exec(ua) || /SamsungBrowser\/(\d+)/.exec(ua) || /Firefox\/(\d+)/.exec(ua) || /Chrome\/(\d+)/.exec(ua) || /Version\/(\d+).*Safari/.exec(ua);
    DEV.br = m ? ({ Edg: 'Edge', SamsungBrowser: 'Samsung Internet', Firefox: 'Firefox', Chrome: 'Chrome' }[m[0].split('/')[0]] || 'Safari') + ' ' + m[1] : '';
    const am = /Android [\d.]+; ([^;)]+)[;)]/.exec(ua); if (am && am[1] !== 'K') DEV.model = am[1].trim();
    try { if (D && D.getHighEntropyValues) D.getHighEntropyValues(['model']).then(v => { if (v && v.model) DEV.model = v.model; }, () => { }); } catch (_) { }
  }
  function devIme() {   // "Galaxy A25 (SM-A256B) · Chrome 141", "Windows · Edge 141"
    const k = DEV.model, nm = k && (MODELI.find(([re]) => re.test(k)) || [])[1];
    return [k ? (nm ? nm + ' (' + k + ')' : k) : DEV.os, DEV.br].filter(Boolean).join(' · ') || '?';
  }
  const devKoda = () => { const k = DEV.model, nm = k && (MODELI.find(([re]) => re.test(k)) || [])[1]; return ((nm || k || DEV.os || '?') + (DEV.br ? '/' + DEV.br : '')).replace(/\s+/g, '-'); };   // (Galaxy-A25/Chrome-141: one word on the text's first line)
  const p2 = (x) => String(x).padStart(2, '0');
  const datum = (d) => d.getDate() + '. ' + (d.getMonth() + 1) + '. ' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  const trenutkov = (n) => n + ' ' + (n % 100 === 1 ? 'trenutek' : n % 100 === 2 ? 'trenutka' : n % 100 === 3 || n % 100 === 4 ? 'trenutki' : 'trenutkov');
  // everything the report says: the moments, the race's flags not marked (where the player was), the race, the device, the text's lines
  const ena = (t) => String(t).replace(/\s*\n\s*/g, ' / ');   // (a note in one line of the text: its lines joined by " / ")
  function porocilo() {
    if (!Z.meta && G) { Z.meta = G.meta(); Z.map = G.map(); }
    const items = Z.items, meta = Z.meta || {}, d0 = Z.d0 || new Date();
    const done = pokrite(), zast = G ? G.flags().map((f, j) => ({ t: f.t, n: j + 1 })).filter(f => !done.has(f.n - 1)).map(f => Object.assign(f, G.where(f.t) || {})) : [];
    const w = items.length ? items[0].w : window.innerWidth, h = items.length ? items[0].h : window.innerHeight;
    const glava = 'RRA-NAPAKE v=' + (meta.ver || '?') + ' proga=' + (meta.track || '?') + ' način=' + (meta.mode || '?') + '/' + (meta.wx || '?') + ' naprava=' + (meta.dev || devKoda()) + ' ' + w + 'x' + h + (meta.file ? ' posnetek=' + meta.file.replace(/\s+/g, '_') : '');   // (an opened file: the device it was driven on)
    const vrstice = items.map(it => {
      const pre = '#' + it.n + ' ' + clock(it.t, 3) + ' K' + it.lap + ' s=' + it.s + 'm', car = it.car && it.car !== 'ti' ? ' avto=' + it.car : '';
      const l = (it.belezka ? [pre + ' beležka »' + ena(it.belezka.text) + '«' + car] : []).concat(it.zapisi.map(z => pre + ' ' + z.barva + ' »' + ena(z.text) + '«' + car + ' v_krogu=[' + (z.v || []).join(', ') + ']'));
      return l.length ? l : [pre + ' (brez zapisa)' + car];   // (the notebook's note first, then the bubbles' by colour)
    });
    const zv = zast.map(f => '⚑' + f.n + ' ' + clock(f.t, 3) + ' K' + (f.lap || '?') + ' s=' + (f.s != null ? f.s : '?') + 'm (zastavica med dirko, ni označena)');
    // the tool's own flags confirmed (Potrdi): where the car of it was; the log: this race's notes and the visit's errors
    const av = potrjene().map((f, j) => Object.assign({ n: j + 1, f }, G ? G.where(f.t, f.k >= 0 ? f.k : null) || {} : {}));
    const avv = av.map(a => '!' + a.n + ' ' + clock(a.f.t, 3) + ' K' + (a.lap || '?') + ' s=' + (a.s != null ? a.s : '?') + 'm ' + a.f.kind + ' ' + avIme(a.f) + ' »' + a.f.opis + '« (samodejna zastavica)');
    const dn = dnevnik().map(dVrstica);
    const stamp = d0.getFullYear() + p2(d0.getMonth() + 1) + p2(d0.getDate()) + '-' + p2(d0.getHours()) + p2(d0.getMinutes());
    return { items, meta, zast, av, glava, vrstice, zv, avv, dn, w, h, d0, ime: 'napake_' + (meta.track || 'proga') + '_' + stamp,
      text: [glava].concat(...vrstice, zv, avv, dn).join('\n') };
  }

  // the picture of the report: per sheet up to 3 moments (on their side a 2 x 2 grid with the field of the data and the map; upright 3 side
  // by side, the data and the map below), the text under them; the long side at most N.size px (Nastavitve: 1600 or 2400)
  const FONT = '"Segoe UI", Roboto, Arial, sans-serif', MONO = 'ui-monospace, Consolas, Menlo, monospace';
  function sestavi(R) {
    const per = 3, sheets = []; for (let i = 0; i < R.items.length; i += per) sheets.push(R.items.slice(i, i + per));
    if (!sheets.length) sheets.push([]);   // (only the race's flags: the data, the map and the text)
    return sheets.map((its, j) => list(R, its, j, sheets.length));
  }
  function list(R, its, j, nj) {
    const S = N.size, u = S / 1600, pad = Math.round(16 * u), cap = Math.round(40 * u), g2 = Math.round(6 * u);
    const land = its.length ? its[0].w >= its[0].h : true, asp = (it) => it.h / it.w;
    const cellH = (it, cw) => cw * asp(it) + cap + ((cw - 3 * g2) / 4) * asp(it);
    const W = S, boxes = []; let y = pad, panel = null;
    if (land) {
      const cw = (W - 3 * pad) / 2, m = its.length;
      if (m === 0) { panel = [pad, y, W - 2 * pad, Math.round(W * 0.34)]; y += panel[3] + pad; }
      else {
        const h1 = Math.max(...its.slice(0, 2).map(it => cellH(it, cw)));
        boxes.push([its[0], pad, y, cw]); if (m >= 2) boxes.push([its[1], 2 * pad + cw, y, cw]); else panel = [2 * pad + cw, y, cw, h1];
        y += h1 + pad;
        if (m === 2) { panel = [pad, y, W - 2 * pad, Math.round(cw * 0.5)]; y += panel[3] + pad; }
        if (m === 3) { const h2 = cellH(its[2], cw); boxes.push([its[2], pad, y, cw]); panel = [2 * pad + cw, y, cw, h2]; y += h2 + pad; }
      }
    } else {
      const m = its.length, cols = Math.max(2, m), cw = (W - (cols + 1) * pad) / cols, h1 = Math.max(...its.map(it => cellH(it, cw)));
      its.forEach((it, k) => boxes.push([it, pad + k * (cw + pad), y, cw]));
      if (m === 1) panel = [2 * pad + cw, y, cw, h1];
      y += h1 + pad;
      if (m !== 1) { panel = [pad, y, W - 2 * pad, Math.round(W * 0.26)]; y += panel[3] + pad; }
    }
    // the text under it: the first line, this sheet's moments, on the last sheet the race's flags not marked
    const fs = Math.round(19 * u), lh = Math.round(fs * 1.4), meas = mk('canvas').getContext('2d'); meas.font = fs + 'px ' + MONO;
    const raw = [R.glava + (nj > 1 ? '  (slika ' + (j + 1) + '/' + nj + ')' : '')].concat(...its.map(it => R.vrstice[it.n - 1] || []), j === nj - 1 ? R.zv.concat(R.avv, R.dn) : []);
    const lines = []; for (const l of raw) lines.push(...wrap(meas, l, W - 2 * pad - 2 * g2, '   '));
    const tH = lines.length * lh + 2 * g2, H = y + tH + pad;
    const k = Math.min(1, S / Math.max(W, H)), cv = mk('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
    const x = cv.getContext('2d'); x.scale(k, k);
    x.fillStyle = '#12161d'; x.fillRect(0, 0, W, H);
    for (const [it, bx, by, cw] of boxes) moment(x, it, bx, by, cw, cap, g2, u);
    if (panel) polje(x, R, its, panel, u, j, nj);
    x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(pad, y, W - 2 * pad, tH);
    x.fillStyle = '#e8edf3'; x.font = fs + 'px ' + MONO; x.textBaseline = 'top';
    lines.forEach((l, i) => x.fillText(l, pad + g2, y + g2 + i * lh + Math.round((lh - fs) / 2)));
    return cv;
  }
  function wrap(x, text, w, ind = '') {   // a line broken into lines no wider than w (at spaces; a word too long cut); ind: before each line after the first
    const out = []; let cur = '';
    for (const word of String(text).split(' ')) {
      const t = cur ? cur + ' ' + word : word;
      if (x.measureText(t).width <= w || !cur) cur = t; else { out.push(cur); cur = ind + word; }
      while (x.measureText(cur).width > w && cur.length > ind.length + 1) { let n = cur.length - 1; while (n > ind.length + 1 && x.measureText(cur.slice(0, n)).width > w) n--; out.push(cur.slice(0, n)); cur = ind + cur.slice(n); }
    }
    if (cur) out.push(cur); return out;
  }
  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  // a moment: its picture with the marks and the bubbles, the line under it (#n · time · lap · metres from the start), its motion in 4 pictures
  function moment(x, it, bx, by, cw, cap, g2, u) {
    const ih = cw * it.h / it.w;
    if (it.img) x.drawImage(it.img, bx, by, cw, ih); else { x.fillStyle = '#2a313c'; x.fillRect(bx, by, cw, ih); }
    x.save(); x.beginPath(); x.rect(bx, by, cw, ih); x.clip(); marks(x, it, bx, by, cw, ih); x.restore();
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2 * u; x.strokeRect(bx, by, cw, ih);
    x.textBaseline = 'middle'; x.font = '700 ' + Math.round(22 * u) + 'px ' + FONT; x.fillStyle = '#FFE14D';
    const line = '#' + it.n + '  ' + clock(it.t, 3) + ' · krog ' + it.lap + (it.laps > 1 ? '/' + it.laps : '') + ' · ' + it.s + ' m od štarta' + (it.car && it.car !== 'ti' ? ' · ' + it.car : '');
    x.fillText(fitTxt(x, line, cw), bx, by + ih + cap / 2);
    const tw = (cw - 3 * g2) / 4, th = tw * it.h / it.w, ty = by + ih + cap;
    GIB.forEach((d, i) => {
      const src = d ? it.gib && it.gib[i] : it.img, tx = bx + i * (tw + g2);
      if (src) x.drawImage(src, tx, ty, tw, th); else { x.fillStyle = '#2a313c'; x.fillRect(tx, ty, tw, th); }
      x.strokeStyle = d ? 'rgba(255,255,255,.25)' : '#FFE14D'; x.lineWidth = 2 * u; x.strokeRect(tx, ty, tw, th);
      const lb = d ? (d > 0 ? '+' : '−') + Math.abs(d).toFixed(1).replace('.', ',') + ' s' : '0 s';
      x.font = '700 ' + Math.round(15 * u) + 'px ' + FONT; const lw = x.measureText(lb).width + 10 * u;
      x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(tx, ty + th - 22 * u, lw, 22 * u); x.fillStyle = '#fff'; x.fillText(lb, tx + 5 * u, ty + th - 11 * u);
    });
  }
  const fitTxt = (x, s, w) => { if (x.measureText(s).width <= w) return s; while (s.length > 3 && x.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; };
  function marks(x, it, bx, by, bw, bh) {   // the marks as on the screen, in the picture's size
    const k = bw / it.w, w = clamp(Math.min(it.w, it.h) * 0.011, 3.5, 7) * k;
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (const pass of [0, 1]) for (const s of it.strokes) {
      x.strokeStyle = x.fillStyle = pass ? BARVE[s.c][1] : 'rgba(0,0,0,.45)'; x.lineWidth = pass ? w : w + 3 * k;
      if (s.p.length < 2) { x.beginPath(); x.arc(bx + s.p[0][0] * bw, by + s.p[0][1] * bh, x.lineWidth / 2, 0, 2 * Math.PI); x.fill(); continue; }
      x.beginPath(); x.moveTo(bx + s.p[0][0] * bw, by + s.p[0][1] * bh); for (let i = 1; i < s.p.length; i++) x.lineTo(bx + s.p[i][0] * bw, by + s.p[i][1] * bh); x.stroke();
    }
    for (const z of it.zapisi) {   // the bubbles: the colour's name on top, the note under it (as long as it is)
      const bw2 = Math.min(220, it.w * 0.46) * k, fs = 15 * k, hh = 19 * k, padx = 8 * k;
      x.font = '600 ' + fs + 'px ' + FONT; const ls = wrap(x, z.text || '…', bw2 - 2 * padx).slice(0, 8), bh2 = hh + ls.length * fs * 1.3 + 12 * k;
      const ax = clamp(bx + z.pos[0] * bw, bx, bx + bw - bw2), ay = clamp(by + z.pos[1] * bh, by, Math.max(by, by + bh - bh2));
      rr(x, ax, ay, bw2, bh2, 9 * k); x.fillStyle = 'rgba(12,16,24,.9)'; x.fill(); x.lineWidth = 2 * k; x.strokeStyle = BARVE[z.c][1]; x.stroke();
      x.save(); rr(x, ax, ay, bw2, bh2, 9 * k); x.clip(); x.fillStyle = BARVE[z.c][1]; x.fillRect(ax, ay, bw2, hh); x.restore();
      x.textBaseline = 'middle'; x.fillStyle = '#14181f'; x.font = '700 ' + 12 * k + 'px ' + FONT; x.fillText(z.barva, ax + padx, ay + hh / 2);
      x.fillStyle = '#fff'; x.font = '600 ' + fs + 'px ' + FONT; x.textBaseline = 'top'; ls.forEach((l, i) => x.fillText(l, ax + padx, ay + hh + 6 * k + i * fs * 1.3));
    }
    const nb = it.belezka; if (!nb) return;   // the notebook: by its right and bottom edges as on the screen, as tall as its note (its letters readable on the sheet)
    const fs = Math.max(nb.fs * k, bw / 64), hh = 1.3 * fs, pd = 0.6 * fs, ww = Math.min(0.5 * bw, Math.max(nb.r[2] * bw, 20 * fs));
    x.font = '600 ' + fs + 'px ' + FONT; const ls = [].concat(...nb.text.split('\n').map(l => wrap(x, l || ' ', ww - 2 * pd))).slice(0, 9), h2 = hh + ls.length * 1.3 * fs + 1.2 * pd;
    const ax = clamp(bx + (nb.r[0] + nb.r[2]) * bw - ww, bx, bx + bw - ww), ay = clamp(by + (nb.r[1] + nb.r[3]) * bh - h2, by, Math.max(by, by + bh - h2));
    rr(x, ax, ay, ww, h2, 0.6 * fs); x.fillStyle = 'rgba(12,16,24,.9)'; x.fill(); x.lineWidth = Math.max(1.5, 2 * k); x.strokeStyle = 'rgba(255,255,255,.75)'; x.stroke();
    x.textBaseline = 'middle'; x.fillStyle = 'rgba(255,255,255,.65)'; x.font = '700 ' + 0.8 * fs + 'px ' + FONT; x.fillText('beležka', ax + pd, ay + hh / 2 + 0.2 * pd);
    x.fillStyle = '#fff'; x.font = '600 ' + fs + 'px ' + FONT; x.textBaseline = 'top'; ls.forEach((l, i) => x.fillText(l, ax + pd, ay + hh + i * 1.3 * fs));
  }
  // the field of the data (B): the track, the way it was raced and the weather, the version, the device, the screen, the date; the map
  // with the moments numbered (this sheet's bright) and the race's flags not marked (orange)
  function polje(x, R, its, [px, py, pw, ph], u, j, nj) {
    rr(x, px, py, pw, ph, 12 * u); x.fillStyle = 'rgba(255,255,255,.06)'; x.fill();
    const side = pw > 1.3 * ph, dw = side ? pw * 0.48 : pw, dh = side ? ph : Math.min(ph * 0.5, 300 * u), m = R.meta, pd = 16 * u;
    let ty = py + pd; const row = (txt, f, col) => { x.font = f; x.fillStyle = col; x.textBaseline = 'top'; for (const l of wrap(x, txt, dw - 2 * pd).slice(0, 2)) { x.fillText(l, px + pd, ty); ty += parseFloat(f.split(' ')[1]) * 1.3; } };
    row('ORODJE ZA NAPAKE' + (nj > 1 ? ' · SLIKA ' + (j + 1) + '/' + nj : ''), '800 ' + Math.round(16 * u) + 'px ' + FONT, '#FFE14D');
    row(m.name || m.track || '?', '700 ' + Math.round(28 * u) + 'px ' + FONT, '#fff'); ty += 4 * u;
    const f = '600 ' + Math.round(18 * u) + 'px ' + FONT, c = '#cfd6df';
    row('Način: ' + (m.mode || '?') + ' · vreme: ' + String(m.wx || '?').replace('dez', 'dež'), f, c);
    row('Različica: ' + (m.ver || '?'), f, c);
    row('Naprava: ' + devIme(), f, c);
    row('Zaslon: ' + R.w + ' × ' + R.h + ' · ' + datum(R.d0), f, c);
    row(trenutkov(R.items.length) + ' · zastavic iz dirke: ' + (G ? G.flags().length : 0) + (R.av.length ? ' · samodejnih: ' + R.av.length : ''), f, c);
    const mb = side ? [px + dw, py + pd, pw - dw - pd, ph - 2 * pd] : [px + pd, py + dh, pw - 2 * pd, ph - dh - pd];
    if (Z.map && mb[2] > 40 && mb[3] > 40) zemljevid(x, Z.map, R, its, mb, u);
  }
  function zemljevid(x, map, R, its, [mx, my, mw, mh], u) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [a, b] of map.pts) { x0 = Math.min(x0, a); x1 = Math.max(x1, a); z0 = Math.min(z0, b); z1 = Math.max(z1, b); }
    const m = 18 * u, k = Math.min((mw - 2 * m) / Math.max(1, x1 - x0), (mh - 2 * m) / Math.max(1, z1 - z0)), ox = mx + (mw - (x1 - x0) * k) / 2, oz = my + (mh - (z1 - z0) * k) / 2;
    const P = (a, b) => [ox + (a - x0) * k, oz + (b - z0) * k];
    x.lineJoin = x.lineCap = 'round';
    for (const [col, lw] of [['rgba(0,0,0,.6)', 8 * u], ['#ffffff', 3.5 * u]]) {
      x.beginPath(); map.pts.forEach(([a, b], i) => { const [q, r] = P(a, b); if (i) x.lineTo(q, r); else x.moveTo(q, r); }); if (!map.open) x.closePath(); x.strokeStyle = col; x.lineWidth = lw; x.stroke();
    }
    const [sx, sz] = P(map.start[0], map.start[1]); x.fillStyle = '#e63b2e'; x.fillRect(sx - 5 * u, sz - 5 * u, 10 * u, 10 * u);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    for (const a of R.av) if (a.x != null) { const [q, r] = P(a.x, a.z); x.fillStyle = '#b8c0ca'; x.beginPath(); x.moveTo(q, r - 9 * u); x.lineTo(q + 8 * u, r + 6 * u); x.lineTo(q - 8 * u, r + 6 * u); x.closePath(); x.fill(); }   // (the tool's own, confirmed: grey)
    for (const f of R.zast) if (f.x != null) { const [q, r] = P(f.x, f.z); x.fillStyle = '#FF9500'; x.beginPath(); x.moveTo(q, r - 9 * u); x.lineTo(q + 8 * u, r + 6 * u); x.lineTo(q - 8 * u, r + 6 * u); x.closePath(); x.fill(); }
    for (const it of R.items) if (it.x != null) {
      const [q, r] = P(it.x, it.z), on = its.includes(it), rad = 13 * u;
      x.globalAlpha = on ? 1 : 0.45; x.beginPath(); x.arc(q, r, rad, 0, 2 * Math.PI); x.fillStyle = '#FFE14D'; x.fill(); x.lineWidth = 2 * u; x.strokeStyle = '#14181f'; x.stroke();
      x.fillStyle = '#14181f'; x.font = '800 ' + Math.round(15 * u) + 'px ' + FONT; x.fillText(String(it.n), q, r + u);
    }
    x.globalAlpha = 1; x.textAlign = 'left';
  }
  const blob = (cv, type, q) => new Promise((res) => { try { cv.toBlob((b) => res(b), type || 'image/png', q); } catch (_) { res(null); } });
  // the picture made (once for each version of the collection) and kept in the game: { id, name, date, track, n, flags, text, status, files: [{ name, blob, w, h }], thumb }
  let making = null;
  const verOf = () => Z.id + ':' + Z.items.length + ':' + (G ? G.flags().length : 0) + ':' + N.size + ':' + potrjene().length + ':' + D.n;   // (the collection as it is now; D.n: the log's notes so far)
  function pripravi() {
    const ver = verOf();
    if (Z.out && Z.out.ver === ver) return Promise.resolve(Z.out.rec);
    if (making && making.ver === ver) return making.p;
    const R = porocilo(), cvs = sestavi(R);
    const p = Promise.all(cvs.map(c => blob(c))).then(async (bs) => {
      if (bs.some(b => !b)) throw new Error('slika');
      const files = bs.map((b, i) => ({ name: R.ime + (cvs.length > 1 ? '_' + (i + 1) : '') + '.png', blob: b, w: cvs[i].width, h: cvs[i].height }));
      const rec = { id: Z.id || 'nk-' + R.d0.getTime(), name: R.ime, date: R.d0.getTime(), track: R.meta.track || '', n: R.items.length, flags: R.zast.length, text: R.text, status: 'neposlano', tname: R.meta.name || '', files, thumb: await blob(small(cvs[0], 320), 'image/jpeg', 0.8) };
      Z.out = { ver, rec }; making = null;
      await dbPut(rec).catch(() => { });
      return rec;
    });
    making = { ver, p }; p.catch(() => { making = null; });
    return p;
  }

  /* ---------------- kept in the game (IndexedDB rra-napake: Zgodovina napak, the last 100 collections; the newest 20 with their pictures,
     the older ones with the small picture and the text only: nf, the pictures it had) ---------------- */
  const DB_N = 'rra-napake', DB_S = 'slike', DB_MAX = 100, DB_FULL = 20;
  let dbP = null;
  function db() {
    if (!dbP) dbP = new Promise((res, rej) => { try { const r = indexedDB.open(DB_N, 1); r.onupgradeneeded = () => r.result.createObjectStore(DB_S, { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
    dbP.catch(() => { dbP = null; }); return dbP;
  }
  const dbDo = (mode, fn) => db().then(d => new Promise((res, rej) => { const t = d.transaction(DB_S, mode), s = t.objectStore(DB_S), out = fn(s); t.oncomplete = () => res(out && 'result' in out ? out.result : undefined); t.onerror = () => rej(t.error); }));
  const dbAll = () => dbDo('readonly', s => s.getAll()).then(l => (l || []).sort((a, b) => b.date - a.date));
  const dbDel = (id) => dbDo('readwrite', s => s.delete(id));
  const lite = (o) => { if (o.files && o.files.length) { o.nf = o.files.length; o.files = []; } return o; };   // (the pictures out, the small one and the text kept)
  async function dbPut(rec) {
    await dbDo('readwrite', s => s.put(rec));
    const l = await dbAll();
    for (const o of l.slice(DB_FULL, DB_MAX)) if (o.files && o.files.length) await dbDo('readwrite', s => s.put(lite(o)));
    for (const o of l.slice(DB_MAX)) await dbDel(o.id);
  }
  async function dbSet(id, f) { const l = await dbAll(), o = l.find(r => r.id === id); if (!o) return null; Object.assign(o, typeof f === 'function' ? f(o) : f); await dbDo('readwrite', s => s.put(o)); return o; }
  // shared or copied for the chat: Poslano (a later state, Popravljeno or Zaprto, stays)
  const dbMark = (id) => dbSet(id, o => (stOf(o) === 'neposlano' ? { status: 'poslano' } : {}));

  /* ---------------- sharing: Deli zdaj (the phone's share sheet), Kopiraj sliko (a computer: Ctrl + V), Samo shrani sliko, Kopiraj besedilo ---------------- */
  const coarse = () => { try { return matchMedia('(pointer: coarse)').matches; } catch (_) { return false; } };
  const fileOf = (f) => (typeof File === 'function' ? new File([f.blob], f.name, { type: f.blob.type || 'image/png' }) : null);
  function canShare(files) { try { return !!(navigator.share && navigator.canShare && files.every(Boolean) && navigator.canShare({ files })); } catch (_) { return false; } }
  async function deli(recs) {   // 'share', 'abort', or 'no' (no share sheet here)
    const files = [].concat(...recs.map(r => r.files.map(fileOf))), text = recs.map(r => r.text).join('\n\n');
    if (!canShare(files)) return 'no';
    try { await navigator.share({ files, text, title: 'Napake · ' + recs.map(r => r.track).join(', ') }); return 'share'; }
    catch (e) { return e && e.name === 'AbortError' ? 'abort' : 'no'; }
  }
  function prenesi(blob, name) { const url = URL.createObjectURL(blob), a = mk('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 8000); }
  function shrani(rec) {   // the pictures to the downloads
    for (const f of rec.files) prenesi(f.blob, f.name);
    if (window.__game) window.__game.lastNapake = { names: rec.files.map(f => f.name), how: 'file' };   // (the tests)
  }
  async function kopirajSliko(f) {
    if (!(navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem === 'function')) return false;
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': f.blob })]); return true; } catch (_) { return false; }
  }
  async function kopirajBesedilo(text) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; } } catch (_) { }
    try { const ta = mk('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (_) { return false; }
  }
  const KJE = 'Telefon: Moje datoteke → Prenosi; računalnik (Edge): mapa Prenosi.';
  // what was done with the collection: shared or copied for the chat is Poslano; it stays in Zgodovina napak, without Obdrži tudi slike v
  // igri as the small picture and the text (hist: from Zgodovina napak, as it is)
  async function done(rec, how, hist) {
    Z.done = Z.out && Z.out.rec === rec ? Z.out.ver : Z.done;
    if (how === 'poslano') { if (stOf(rec) === 'neposlano') rec.status = 'poslano'; await dbMark(rec.id).catch(() => { }); }
    if (!N.keep && !hist) await dbSet(rec.id, lite).catch(() => { });
  }
  async function dejanje(a, rec, i, hist) {   // the choice's buttons (and Zgodovina napak's: hist); true: the choice may close
    if (a === 'deli') {
      const how = await deli([rec]);
      if (how === 'share') { await done(rec, 'poslano', hist); G.toast('Slika napak je poslana v meni Deli.', 2600); return true; }
      if (how === 'abort') return false;
      shrani(rec); await done(rec, 'shranjeno', hist); G.toast('Deljenje tu ne gre: slika je v Prenosih (' + rec.files[0].name + '). ' + KJE, 4600); return true;
    }
    if (a === 'shrani') { shrani(rec); await done(rec, 'shranjeno', hist); G.toast('Shranjeno v Prenose: ' + rec.files.map(f => f.name).join(', ') + '. ' + KJE, 4600); return true; }
    if (a === 'slika') {
      if (await kopirajSliko(rec.files[i])) { await done(rec, 'poslano', hist); G.toast('Slika ' + (rec.files.length > 1 ? (i + 1) + '/' + rec.files.length + ' ' : '') + 'je kopirana: v pogovoru pritisni Ctrl + V.', 3200); return rec.files.length === 1; }
      G.toast('Slike ni bilo mogoče kopirati: shrani jo.', 2600); return false;
    }
    if (a === 'besedilo') { G.toast(await kopirajBesedilo(rec.text) ? 'Besedilo je kopirano.' : 'Besedila ni bilo mogoče kopirati.', 2400); return false; }
    if (a === 'rrp') { await rrpShrani(); return false; }
    return false;
  }

  /* ---------------- the recording as a file (posnetek_<proga>_<LLLLMMDD-UUMM>.rrp): the race's recording kept or sent with the report, opened
     again in the game (Nastavitve orodja · Odpri posnetek: the replay, Označi, the tool's own flags as ever) or by Claude (tools/posnetek.mjs).
     Gzip (CompressionStream) of: RRP1, the header's length (4 bytes, little-endian), the header (JSON: the track, the way, the weather, the
     version, the device, the date, the cars, the race's moments, flags and log: js/game.js rrpOf), then the samples' Float32 numbers by
     number (the time of every sample, then the first car's x of every sample ...), each as the second difference of its bits from the
     samples before it (zigzag: small either way), in 4 planes of their bytes: so a smooth motion packs to under half of the raw size and
     reads back to the last bit ---------------- */
  const RRP = { mag: 'RRP1', fmt: 1, min: 40 };   // (min: the samples the replay needs)
  const zig = (d) => { const s = d | 0; return ((s << 1) ^ (s >> 31)) >>> 0; }, unzig = (z) => (z >>> 1) ^ -(z & 1);
  function rrpPack(H, F) {
    const L = F[0].length, NF = F.length, N = L * NF, head = new TextEncoder().encode(JSON.stringify(Object.assign({}, H, { fmt: RRP.fmt, L, NF })));
    const off = (8 + head.length + 3) & ~3, out = new Uint8Array(off + 4 * N), U = F.map(f => new Uint32Array(f.buffer, f.byteOffset, L));
    for (let i = 0; i < 4; i++) out[i] = RRP.mag.charCodeAt(i);
    new DataView(out.buffer).setUint32(4, head.length, true); out.set(head, 8);
    let v = off;
    for (let j = 0; j < L; j++) for (let i = 0; i < NF; i++, v++) {
      const a = U[i][j], e = i >= 2 ? zig(a - 2 * U[i - 1][j] + U[i - 2][j]) : i ? zig(a - U[i - 1][j]) : a;
      out[v] = e & 255; out[v + N] = (e >>> 8) & 255; out[v + 2 * N] = (e >>> 16) & 255; out[v + 3 * N] = e >>> 24;
    }
    return out;
  }
  function rrpUnpack(u) {
    if (u.length < 8 || String.fromCharCode(u[0], u[1], u[2], u[3]) !== RRP.mag) throw new Error('to ni posnetek igre');
    const hl = new DataView(u.buffer, u.byteOffset, u.byteLength).getUint32(4, true); let H = null;
    try { H = JSON.parse(new TextDecoder().decode(u.subarray(8, 8 + hl))); } catch (_) { throw new Error('glava posnetka je poškodovana'); }
    const L = H && H.L, NF = H && H.NF, N = L * NF, off = (8 + hl + 3) & ~3;
    if (!H || H.fmt !== RRP.fmt) throw new Error('posnetek je iz novejše različice igre');
    if (!(NF >= RRP.min && H.n >= 1 && H.w >= 1 && L === 1 + (H.n + 1) * H.w && Array.isArray(H.cars) && H.cars.length === H.n && typeof H.track === 'string' && u.length >= off + 4 * N)) throw new Error('posnetek je poškodovan');
    const F = [], U = []; for (let i = 0; i < NF; i++) { const f = new Float32Array(L); F.push(f); U.push(new Uint32Array(f.buffer)); }
    let v = off;
    for (let j = 0; j < L; j++) for (let i = 0; i < NF; i++, v++) {
      const e = (u[v] | (u[v + N] << 8) | (u[v + 2 * N] << 16) | (u[v + 3 * N] << 24)) >>> 0;
      U[i][j] = i >= 2 ? unzig(e) + 2 * U[i - 1][j] - U[i - 2][j] : i ? unzig(e) + U[i - 1][j] : e;   // (Uint32Array: modulo 2^32, as written)
    }
    for (let i = 1; i < NF; i++) if (!(F[i][0] >= F[i - 1][0])) throw new Error('posnetek je poškodovan');   // (the times rise: the replay's search)
    return { H, frames: F };
  }
  const gzip = (u, back) => new Response(new Blob([u]).stream().pipeThrough(back ? new DecompressionStream('gzip') : new CompressionStream('gzip'))).arrayBuffer().then(b => new Uint8Array(b));
  // the recording of the race (or of the file opened) as a file: { name, blob, raw (bytes before packing) }, or null without one
  async function rrpPisi() {
    const r = G && G.rrp && G.rec() && G.rrp(); if (!r) return null;
    const rec = G.rec(), F = rec.file, d = new Date(F && F.date ? F.date : Date.now());
    const dn = ((F && F.dn) || []).concat(D.l.filter(e => e[REC] === rec).map(e => { const o = Object.assign({}, e); delete o.old; return o; }));   // (the log of this race)
    const H = Object.assign(r.H, { dev: F ? F.dev : devKoda(), devIme: F ? F.devIme : devIme(), date: d.getTime(), dn });
    const raw = rrpPack(H, r.frames), z = typeof CompressionStream === 'function' ? await gzip(raw) : raw;
    return { name: 'posnetek_' + (H.track || 'proga') + '_' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + '.rrp', blob: new Blob([z], { type: 'application/octet-stream' }), raw: raw.length };
  }
  async function rrpBeri(blob) {
    let u = new Uint8Array(await blob.arrayBuffer());
    if (u[0] === 0x1f && u[1] === 0x8b) { if (typeof DecompressionStream !== 'function') throw new Error('ta brskalnik posnetka ne zna razpakirati'); try { u = await gzip(u, true); } catch (_) { throw new Error('posnetek je poškodovan'); } }
    return rrpUnpack(u);
  }
  const mb = (n) => vejica(n / 1048576) + ' MB';
  async function rrpShrani() {
    if (!G || !G.rec() || G.rec().frames.length < RRP.min) { G && G.toast('Posnetka ni.', 2000); return null; }
    G.toast('Shranjujem posnetek …', 1500);
    let f = null; try { f = await rrpPisi(); } catch (_) { }
    if (!f) { G.toast('Posnetka ni bilo mogoče shraniti.', 2600); return null; }
    prenesi(f.blob, f.name);
    if (window.__game) window.__game.lastRrp = { name: f.name, bytes: f.blob.size, raw: f.raw };   // (the tests)
    G.toast('Posnetek je v Prenosih: ' + f.name + ' (' + mb(f.blob.size) + '). ' + KJE, 4600);
    return f;
  }
  // a file opened: its race's replay ('' once it is under way, else why not)
  async function rrpOdpri(blob, name) {
    if (!G || !G.open) return 'ni igre';
    let r = null; try { r = await rrpBeri(blob); } catch (e) { const why = (e && e.message) || 'napaka'; G.toast('Posnetka ni bilo mogoče odpreti: ' + why + '.', 3600); return why; }
    r.H.ime = name || ''; nZapri(); zapri(); zgZapri();
    const why = G.open(r.H, r.frames);
    if (why) G.toast('Posnetka ni bilo mogoče odpreti: ' + why + '.', 3600);
    else if (r.H.ver && r.H.ver !== '?' && r.H.ver !== verIgre()) G.toast('Posnetek je iz druge različice igre (' + r.H.ver + '): svet je lahko malo drugačen.', 3200);
    return why;
  }
  const verIgre = () => { const e = document.querySelector('script[src^="js/game.js"]'), m = e && /[?&]v=(\w+)/.exec(e.getAttribute('src')); return m ? m[1] : '?'; };

  /* ---------------- the choice: at the end of the replay (Nastavitve: Ob koncu) or with Deli in the replay ---------------- */
  function konec() {   // js/game.js replayEnd: the replay after the race is over
    if (!G || !N.on) return;
    const R = Z.items.length || ((G.flags().length || potrjene().length) && Z.rec === G.rec()); if (!R) return;
    if (Z.done === verOf()) return;   // (as it was when last shared or saved: not again)
    if (N.end === 'ask') { izbira(); return; }
    pripravi().then(rec => dejanje(N.end === 'share' ? 'deli' : 'shrani', rec), () => G.toast('Slike napak ni bilo mogoče narediti.', 2600));
  }
  function izbira() {
    if (!G) return; zapri();
    if (!Z.items.length && !G.flags().length && !potrjene().length) return;
    const el = mk('div', 'nk-dlg'); el.id = 'nk-dlg'; document.body.appendChild(el);
    el.innerHTML = '<div class="nk-box"><h3>Zbirka napak</h3><p class="nk-sub"></p><div class="nk-prev"><span>Pripravljam sliko …</span></div><div class="nk-acts"></div>' +
      '<label class="nk-keep"><input type="checkbox"' + (N.keep ? ' checked' : '') + '> Obdrži tudi slike v igri</label><p class="nk-hint">Zapis ostane v Zgodovini napak; brez kljukice le z malo sliko in besedilom.</p>' +
      '<div class="nk-end"><button data-nk-d="zg">Zgodovina</button><button data-nk-d="zapri">Zapri</button></div></div>';
    const zast = Z.rec === G.rec() ? G.flags().length : 0;
    el.querySelector('.nk-sub').textContent = trenutkov(Z.items.length) + (zast ? ' · zastavic iz dirke: ' + zast : '');
    el.querySelector('.nk-keep input').addEventListener('change', (e) => { N.keep = e.target.checked ? 1 : 0; nSave(); });
    el.addEventListener('click', (e) => { e.stopPropagation(); if (e.target === el) zapri(); });
    el.querySelector('[data-nk-d="zapri"]').addEventListener('click', (e) => { e.preventDefault(); zapri(); });
    el.querySelector('[data-nk-d="zg"]').addEventListener('click', (e) => { e.preventDefault(); zgodovina(); });
    el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') zapri(); });
    pripravi().then((rec) => {
      if (!el.isConnected) return;
      const url = URL.createObjectURL(rec.files[0].blob); el.dataset.url = url;
      el.querySelector('.nk-prev').innerHTML = '<img alt="Slika napak">'; el.querySelector('.nk-prev img').src = url;
      const B = [], nf = rec.files.length;
      if (!coarse()) rec.files.forEach((f, i) => B.push(['slika', 'Kopiraj sliko' + (nf > 1 ? ' ' + (i + 1) + '/' + nf : ''), i]));   // (a computer: the picture for Ctrl + V first)
      if (coarse() || canShare(rec.files.map(fileOf))) B.push(['deli', 'Deli zdaj', 0]);
      B.push(['shrani', 'Samo shrani sliko', 0], ['besedilo', 'Kopiraj besedilo', 0]);
      if (G.rec() && G.rec().frames.length >= RRP.min) B.push(['rrp', 'Shrani posnetek (.rrp)', 0]);   // (the race's recording beside the picture: for Claude, tools/posnetek.mjs)
      const acts = el.querySelector('.nk-acts');
      acts.innerHTML = B.map(([a, t, i], k) => '<button data-nk-d="' + a + '" data-i="' + i + '"' + (k ? '' : ' class="first"') + '>' + t + '</button>').join('');
      acts.addEventListener('click', async (e) => { const b = e.target.closest('[data-nk-d]'); if (!b) return; e.preventDefault(); if (await dejanje(b.dataset.nkD, rec, +b.dataset.i)) zapri(); });
    }, () => { if (el.isConnected) el.querySelector('.nk-prev').innerHTML = '<span>Slike ni bilo mogoče narediti.</span>'; });
  }
  function zapri() { const el = $('nk-dlg'); if (!el) return; if (el.dataset.url) URL.revokeObjectURL(el.dataset.url); el.remove(); }

  /* ---------------- Nastavitve · Orodje za napake (its own panel over the settings) ---------------- */
  const NK_KEY = 'tdgp-napake', NK_DEF = { on: 1, end: 'ask', flag: 'btn', size: 1600, keep: 1, dev: 0 };
  const N = Object.assign({}, NK_DEF);
  function nLoad() {
    try { const o = JSON.parse(localStorage.getItem(NK_KEY) || 'null'); if (!o || typeof o !== 'object') return;
      if (o.on === 0 || o.on === 1) N.on = o.on; if (o.keep === 0 || o.keep === 1) N.keep = o.keep; if (o.dev === 0 || o.dev === 1) N.dev = o.dev;
      if (['ask', 'share', 'save'].includes(o.end)) N.end = o.end; if (['btn', 'key', 'off'].includes(o.flag)) N.flag = o.flag; if (o.size === 1600 || o.size === 2400) N.size = o.size; } catch (_) { }
  }
  function nSave() { try { localStorage.setItem(NK_KEY, JSON.stringify(N)); } catch (_) { } apply(); }
  function apply() { const R = $('replay-ui'); if (R) R.classList.toggle('nk-off', !N.on); flBtn(); if (!N.on && M) close(); if (G && G.dev) G.dev(N.on && N.dev); if (G && G.replay()) G.ui(); }
  const NK_ROWS = [['on', 'Orodje', [[1, 'Vklop'], [0, 'Izklop']]], ['end', 'Ob koncu posnetka', [['ask', 'Vprašaj'], ['share', 'Deli'], ['save', 'Shrani']]],
    ['flag', 'Zastavica med dirko', [['btn', 'Gumb + tipka F'], ['key', 'Samo tipka'], ['off', 'Izklop']]], ['size', 'Velikost slike', [[1600, '1600 px'], [2400, '2400 px']]], ['dev', 'Prikaz za razvijalca', [[1, 'Vklop'], [0, 'Izklop']]]];
  let urls = [], rrpAsk = 0;
  function nastavitve() {
    let el = $('nk-set'); if (el) el.remove();
    el = mk('div', 'nk-dlg nk-set'); el.id = 'nk-set'; document.body.appendChild(el);
    el.innerHTML = '<div class="nk-box"><h3>Orodje za napake</h3>' + NK_ROWS.map(([k, lbl, opts]) => '<div class="nk-row"><span>' + lbl + '</span><div class="nk-seg" data-k="' + k + '">' +
      opts.map(([v, t]) => '<button data-v="' + v + '"' + (N[k] === v ? ' class="sel"' : '') + '>' + t + '</button>').join('') + '</div></div>').join('') +
      '<p class="nk-hint">Zastavica med dirko: gumb ob pavzi, tipka F (Kontrole) ali Select na ploščku. V posnetku Označi, Dodaj k zbirki, nato Deli. Prikaz za razvijalca: tipka O.</p>' +
      '<div class="nk-row"><span>Dnevnik napak <small class="nk-dn-n"></small></span><span class="nk-dn-b"><button data-nk-d="dn-kop">Kopiraj</button><button data-nk-d="dn-del">Počisti</button></span></div><pre class="nk-dn"></pre>' +
      '<div class="nk-row"><span>Posnetek dirke <small>(.rrp)</small></span><span class="nk-dn-b"><button data-nk-d="rrp-shrani"' + (G && G.rec() && G.rec().frames.length >= RRP.min ? '' : ' disabled') + '>Shrani</button><button data-nk-d="rrp-odpri">Odpri …</button></span></div>' +
      '<input type="file" class="nk-rrp-in" hidden>' +   // (no accept: a phone's picker greys out a kind it does not know; rrpBeri checks the file)
      '<div class="nk-row"><span>Zgodovina napak</span><span class="nk-dn-b"><button data-nk-d="vse">Deli vse neposlane</button><button data-nk-d="zg">Odpri</button></span></div><div class="nk-list"><span class="nk-hint">Nalagam …</span></div>' +
      '<div class="nk-end"><button data-nk-d="zapri">Zapri</button></div></div>';
    el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') nZapri(); });
    el.querySelector('.nk-rrp-in').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) rrpOdpri(f, f.name); });
    el.addEventListener('click', async (e) => {
      e.stopPropagation(); if (e.target === el) { nZapri(); return; }
      const sb = e.target.closest('.nk-seg button');
      if (sb) { e.preventDefault(); const k = sb.parentElement.dataset.k, v = k === 'on' || k === 'size' || k === 'dev' ? +sb.dataset.v : sb.dataset.v; N[k] = v; nSave(); for (const b of sb.parentElement.children) b.classList.toggle('sel', b === sb); return; }
      const b = e.target.closest('[data-nk-d]'); if (!b) return; e.preventDefault();
      const a = b.dataset.nkD; if (a === 'zapri') { nZapri(); return; }
      if (a === 'dn-kop') { G.toast(await kopirajBesedilo(D.l.map(dVrstica).join('\n') || '(dnevnik je prazen)') ? 'Dnevnik je kopiran.' : 'Dnevnika ni bilo mogoče kopirati.', 2200); return; }
      if (a === 'dn-del') { D.l = []; dSave(); dnPanel(); return; }
      if (a === 'rrp-shrani') { await rrpShrani(); return; }
      if (a === 'rrp-odpri') {   // (a race under way ends: a second tap within 3 s)
        if (G && G.kje() && !(G.rec() && G.rec().file) && performance.now() - rrpAsk > 3000) { rrpAsk = performance.now(); G.toast('Dirka se bo končala. Za odpiranje posnetka tapni še enkrat.', 3000); return; }
        rrpAsk = 0; el.querySelector('.nk-rrp-in').click(); return;
      }
      if (a === 'vse') { await vseNeposlane(); return; }
      if (a === 'zg') zgodovina(b.dataset.id);
    });
    seznam(); dnPanel();
  }
  function dnPanel() {   // (the log in the tool's settings: the newest first)
    const el = document.querySelector('#nk-set .nk-dn'), n = document.querySelector('#nk-set .nk-dn-n'); if (!el) return;
    n.textContent = '(' + D.l.length + ')'; el.textContent = D.l.length ? D.l.slice().reverse().map(dVrstica).join('\n') : 'Ni zapisov.';
  }
  function nZapri() { const el = $('nk-set'); if (el) el.remove(); for (const u of urls) URL.revokeObjectURL(u); urls = []; }
  // the list of Zgodovina napak (in the tool's settings and in its own panel): the newest first, a tap opens the one (data-nk-d="zg")
  async function seznam(box, U) {
    box = box || document.querySelector('#nk-set .nk-list'); U = U || urls; if (!box) return [];
    let l = []; try { l = await dbAll(); } catch (_) { box.innerHTML = '<span class="nk-hint">Shranjevanje v igri tu ne deluje.</span>'; return []; }
    for (const u of U) URL.revokeObjectURL(u); U.length = 0;
    if (!l.length) { box.innerHTML = '<span class="nk-hint">Ni shranjenih napak.</span>'; return l; }
    box.innerHTML = l.map(r => { const u = r.thumb ? URL.createObjectURL(r.thumb) : ''; if (u) U.push(u);
      return '<button class="nk-item" data-nk-d="zg" data-id="' + esc(r.id) + '">' + (u ? '<img src="' + u + '" alt="">' : '<i></i>') + '<span class="nk-it"><b>' + esc(progaOf(r)) + '</b><small>' + opisOf(r) + '</small></span>' + stPill(r) + '</button>'; }).join('');
    return l;
  }

  /* ---------------- Zgodovina napak: every collection kept (js: dbPut), its state; from the marking's bar, the choice and the tool's settings ---------------- */
  const STANJA = [['neposlano', 'Neposlano'], ['poslano', 'Poslano'], ['popravljeno', 'Popravljeno'], ['zaprto', 'Zaprto']];
  const stOf = (r) => (STANJA.some(s => s[0] === r.status) ? r.status : 'neposlano');
  const stPill = (r) => { const s = stOf(r); return '<em class="nk-st st-' + s + '">' + STANJA.find(x => x[0] === s)[1] + '</em>'; };
  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const zastavic = (n) => n + ' ' + (n % 100 === 1 ? 'zastavica' : n % 100 === 2 ? 'zastavici' : n % 100 === 3 || n % 100 === 4 ? 'zastavice' : 'zastavic');
  const progaOf = (r) => r.tname || r.track || r.name;
  const nSlik = (r) => (r.files && r.files.length) || r.nf || 0;
  const opisOf = (r) => datum(new Date(r.date)) + ' · ' + trenutkov(r.n || 0) + ' · ' + zastavic(r.flags || 0) + (nSlik(r) > 1 ? ' · ' + nSlik(r) + ' slike' : '') + (r.files && r.files.length ? '' : ' · mala slika');
  // a record as the choice's buttons take it: its pictures, or (older, pictures out) the small one
  const zgRec = (r) => (r.files && r.files.length ? r : Object.assign({}, r, { files: r.thumb ? [{ name: r.name + '_mala.jpg', blob: r.thumb, w: 320, h: 0 }] : [] }));
  async function vseNeposlane() {
    const un = (await dbAll().catch(() => [])).filter(r => stOf(r) === 'neposlano').map(zgRec).filter(r => r.files.length);
    if (!un.length) { G.toast('Neposlanih napak ni.', 2000); return; }
    const how = await deli(un);
    if (how === 'share') { for (const r of un) await dbMark(r.id).catch(() => { }); G.toast('Poslano: ' + un.length + '.', 2200); }
    else if (how === 'no') { for (const r of un) shrani(r); G.toast('Deljenje tu ne gre: slike so v Prenosih. ' + KJE, 4200); }
    zgOsvezi();
  }
  const VSEPOS = 'Označi vse kot poslane';
  async function vsePoslane(b) {   // the unsent marked sent by hand (sent some other way: a screenshot pasted in the chat); asks first: a second tap within 3 s
    const un = (await dbAll().catch(() => [])).filter(r => stOf(r) === 'neposlano');
    if (!un.length) { G.toast('Neposlanih napak ni.', 2000); return; }
    if (performance.now() - zgVse > 3000) { zgVse = performance.now(); b.textContent = 'Res? Neposlanih: ' + un.length + ' → Poslano'; b.classList.add('warn'); setTimeout(() => { if (b.isConnected) { b.textContent = VSEPOS; b.classList.remove('warn'); } }, 3100); return; }
    zgVse = 0; await dbDo('readwrite', st => { for (const o of un) { o.status = 'poslano'; st.put(o); } }).catch(() => { });
    G.toast('Označeno kot poslano: ' + un.length + '.', 2200); zgOsvezi();
  }
  let zgUrls = [], zgId = '', zgDel = 0, zgVse = 0;
  function zgodovina(id) {   // the panel over everything (the replay, the choice, the settings): the list, or the one record (id)
    zgZapri();
    const el = mk('div', 'nk-dlg nk-zg'); el.id = 'nk-zg'; document.body.appendChild(el);
    el.innerHTML = '<div class="nk-box"><h3>Zgodovina napak</h3><div class="nk-zg-in"><span class="nk-hint">Nalagam …</span></div><div class="nk-end"><button data-nk-d="zapri">Zapri</button></div></div>';
    el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') zgZapri(); });
    el.addEventListener('click', async (e) => {
      e.stopPropagation(); if (e.target === el) { zgZapri(); return; }
      const b = e.target.closest('[data-nk-d]'); if (!b) return; e.preventDefault();
      const a = b.dataset.nkD;
      if (a === 'zapri') { zgZapri(); return; }
      if (a === 'zg') { zgEna(b.dataset.id); return; }
      if (a === 'nazaj') { zgSeznam(); return; }
      if (a === 'vse') { await vseNeposlane(); return; }
      if (a === 'vsepos') { await vsePoslane(b); return; }
      const r = (await dbAll().catch(() => [])).find(o => o.id === zgId); if (!r) { zgSeznam(); return; }
      if (a === 'st') { await dbSet(r.id, { status: b.dataset.v }).catch(() => { }); zgOsvezi(); return; }
      if (a === 'del') {   // (a second tap within 3 s)
        if (performance.now() - zgDel > 3000) { zgDel = performance.now(); b.textContent = 'Res izbriši?'; b.classList.add('warn'); setTimeout(() => { if (b.isConnected) { b.textContent = 'Izbriši'; b.classList.remove('warn'); } }, 3100); return; }
        zgDel = 0; await dbDel(r.id).catch(() => { }); zgSeznam(); seznam(); return;
      }
      await dejanje(a, zgRec(r), +b.dataset.i || 0, true); zgOsvezi();
    });
    if (id) zgEna(id); else zgSeznam();
  }
  const zgIn = () => document.querySelector('#nk-zg .nk-zg-in');
  async function zgSeznam() {
    const box = zgIn(); if (!box) return; zgId = '';
    box.innerHTML = '<div class="nk-row"><span class="nk-zg-n">Shranjene zbirke</span><button data-nk-d="vse">Deli vse neposlane</button><button data-nk-d="vsepos" class="nk-delb">' + VSEPOS + '</button></div><div class="nk-list"><span class="nk-hint">Nalagam …</span></div>' +
      '<p class="nk-hint">Stanje: Neposlano → Poslano (samodejno ob Deli ali Kopiraj sliko; če si sliko poslal drugače, ročno v zapisu ali z »' + VSEPOS + '«) → Popravljeno (ko Claude javi popravek) → Zaprto (po preizkusu). Dotik odpre zapis.</p>';
    const l = await seznam(box.querySelector('.nk-list'), zgUrls), n = box.querySelector('.nk-zg-n');
    if (n) n.textContent = 'Shranjene zbirke (' + l.length + ')';
  }
  async function zgEna(id) {
    const box = zgIn(); if (!box) return;
    const r = (await dbAll().catch(() => [])).find(o => o.id === id); if (!r) { zgSeznam(); return; }
    zgId = r.id; zgDel = 0; for (const u of zgUrls) URL.revokeObjectURL(u); zgUrls = [];
    const R = zgRec(r), f = R.files[0], u = f ? URL.createObjectURL(f.blob) : ''; if (u) zgUrls.push(u);
    const B = [], nf = r.files.length;
    if (!coarse() && nf) r.files.forEach((x, i) => B.push(['slika', 'Kopiraj sliko' + (nf > 1 ? ' ' + (i + 1) + '/' + nf : ''), i]));
    if (R.files.length && (coarse() || canShare(R.files.map(fileOf)))) B.push(['deli', 'Deli', 0]);
    if (R.files.length) B.push(['shrani', nf ? 'Shrani sliko' : 'Shrani malo sliko', 0]);
    B.push(['besedilo', 'Kopiraj besedilo', 0]);
    box.innerHTML = '<button data-nk-d="nazaj" class="nk-back">&#8592; Vse zbirke</button>' +
      '<p class="nk-sub"><b>' + esc(progaOf(r)) + '</b> · ' + opisOf(r) + '</p>' +
      '<div class="nk-prev">' + (u ? '<img alt="Slika napak" src="' + u + '">' : '<span>Slike ni.</span>') + '</div>' +
      '<div class="nk-sts">' + STANJA.map(([v, t]) => '<button data-nk-d="st" data-v="' + v + '" class="st-' + v + (stOf(r) === v ? ' sel' : '') + '">' + t + '</button>').join('') + '</div>' +
      '<pre class="nk-txt"></pre><div class="nk-acts">' + B.map(([a, t, i]) => '<button data-nk-d="' + a + '" data-i="' + i + '">' + t + '</button>').join('') + '<button data-nk-d="del" class="nk-delb">Izbriši</button></div>';
    box.querySelector('.nk-txt').textContent = r.text || '';
  }
  function zgOsvezi() { if (zgId) zgEna(zgId); else zgSeznam(); seznam(); }   // (and the settings' list, if open)
  function zgZapri() { const el = $('nk-zg'); if (el) el.remove(); for (const u of zgUrls) URL.revokeObjectURL(u); zgUrls = []; zgId = ''; }

  return { init, open, close, sync, dirka, flag, tocke, konec, izbira, nastavitve, pripravi, zgodovina, shranjene: () => dbAll(),
    okvir, dev, zaznaj, porocilo: () => porocilo().text, zg: { put: dbPut, MAX: DB_MAX, FULL: DB_FULL },   // (zg: the tests, Zgodovina napak's bounds)
    // the recording as a file (the tests, tools/posnetek.mjs): write, read, open; pojdi: the replay to t (k the car followed, cam), slika: its picture
    rrp: { pisi: rrpPisi, beri: rrpBeri, odpri: rrpOdpri, shrani: rrpShrani, pack: rrpPack, unpack: rrpUnpack,
      pojdi: (t, k, cam) => { if (!G || !G.replay()) return false; G.view(k == null ? -1 : k, cam); G.seek(t); return true; },
      kje: (t, k) => (G ? G.where(t, k) : null),
      slika: (max) => { const c = G && G.replay() && G.shot(max || 1280); return c ? c.toDataURL('image/png') : null; } },
    get dnevnik() { return D.l.map(e => Object.assign({}, e, { tukaj: !!(e[REC] && G && e[REC] === G.rec()) })); },   // (tukaj: of this race's recording)
    get samodejne() { return samodejne().map(f => ({ id: f.id, kind: f.kind, t: f.t, k: f.k, val: f.val, opis: f.opis, st: f.st })); },
    get iskanje() { return { i: A.i, n: A.rec ? A.rec.frames.length : 0, done: !!A.rec && A.i >= A.rec.frames.length }; },
    get on() { return !!M; },
    get zbirka() { return Z.items; },
    get nast() { return Object.assign({}, N); },
    get barve() { return BARVE.map(b => b.slice()); },
    get stanje() {   // (the tests)
      const host = $('nk-bubs');
      return { on: !!M, tool: M ? M.tool : null, col: M ? M.col : -1, strokes: M ? M.strokes.map(s => ({ c: s.c, loop: s.loop, n: s.p.length })) : [], hist: M ? M.hist.length : 0, notes: M ? Object.assign({}, M.notes) : {},
        belezka: (() => { const n = $('nk-note'), ta = belTa(); if (!n) return null; const r = n.getBoundingClientRect(); return { text: ta.value, focus: document.activeElement === ta, vis: getComputedStyle(n).display !== 'none', x: r.left, y: r.top, w: r.width, h: r.height, fs: parseFloat(getComputedStyle(ta).fontSize) }; })(),
        bubbles: host ? [...host.children].map(el => { const r = el.getBoundingClientRect(); return { c: +el.dataset.c, x: r.left, y: r.top, w: r.width, h: r.height, text: el.querySelector('textarea').value }; }) : [],
        zbirka: Z.items.map(it => ({ n: it.n, t: it.t, lap: it.lap, s: it.s, img: it.img ? [it.img.width, it.img.height] : null, gib: (it.gib || []).map(g => g ? [g.width, g.height] : null), strokes: it.strokes.length, zapisi: it.zapisi.map(z => z.barva + ': ' + z.text), v: it.zapisi.map(z => z.v), bel: it.belezka ? it.belezka.text : '' })),
        tocke: tocke(), auto: $('nk-auto') ? $('nk-auto').innerText : null, slika: Z.out ? { files: Z.out.rec.files.map(f => ({ name: f.name, w: f.w, h: f.h, bytes: f.blob.size })), text: Z.out.rec.text, status: Z.out.rec.status } : null,
        dlg: (() => { const d = $('nk-dlg'); return d ? [...d.querySelectorAll('.nk-acts button')].map(b => b.textContent) : null; })(),
        zg: (() => { const d = $('nk-zg'); return d ? { id: zgId, items: [...d.querySelectorAll('.nk-item')].map(e => e.innerText.replace(/\s+/g, ' ').trim()), st: (d.querySelector('.nk-sts .sel') || {}).textContent || null,
          acts: [...d.querySelectorAll('.nk-acts button')].map(b => b.textContent), text: (d.querySelector('.nk-txt') || {}).textContent || null } : null; })() };
    } };
})();
