/* The new settings screen (maketa): builds the tabs and the cards from SETTINGS_DATA, the pictures from SetAnim.
   ?mode=pause (the pause: its own tab first, Nadaljuj) | menu (from the main menu: Končano); ?tab=<id>; ?shot=1&t=2.4 (a still) */
(function () {
  'use strict';
  const D = window.SETTINGS_DATA, A = window.SetAnim, q = new URLSearchParams(location.search);
  const $ = (s, el) => (el || document).querySelector(s);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const I = {
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    wheel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/><path d="M3.5 11 L9.8 12 M14.2 12 L20.5 11 M12 14.2 V21"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="2.5" y="6.5" width="13" height="11" rx="2"/><path d="M15.5 10.5 L21.5 7.5 V16.5 L15.5 13.5"/></svg>',
    hud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4.5 16.5 A8 8 0 1 1 19.5 16.5"/><path d="M12 13 L16 8.5"/><circle cx="12" cy="13.2" r="1.4" fill="currentColor"/></svg>',
    flag: '<svg viewBox="0 0 24 24"><path d="M5 21 V4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M6 4 H19 V13 H6 Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6 4 H9.3 V7 H6Z M12.6 4 H15.9 V7 H12.6Z M9.3 7 H12.6 V10 H9.3Z M15.9 7 H19 V10 H15.9Z M6 10 H9.3 V13 H6Z M12.6 10 H15.9 V13 H12.6Z" fill="currentColor"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3.5 17 L9 11.5 L13 15.5 L15.5 13 L20.5 18"/><circle cx="16" cy="9" r="1.8"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z" fill="currentColor"/><path d="M15.5 9 A4 4 0 0 1 15.5 15 M18 6.5 A7.5 7.5 0 0 1 18 17.5"/></svg>',
    cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8 V5.4 M12 18.6 V21.2 M2.8 12 H5.4 M18.6 12 H21.2 M5.5 5.5 L7.4 7.4 M16.6 16.6 L18.5 18.5 M5.5 18.5 L7.4 16.6 M16.6 7.4 L18.5 5.5" stroke-linecap="round"/><circle cx="12" cy="12" r="6.6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5 L20 12 L7 19.5 Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5 L10 18 L19.5 6.5"/></svg>',
    restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12 A7 7 0 1 1 16.5 6.6"/><path d="M17.5 2.8 V7.2 H13.1"/></svg>',
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M4 8 H7.3 L9 5.6 H15 L16.7 8 H20 V19 H4 Z"/><circle cx="12" cy="13.2" r="3.4"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M3 15.5 V12.5 L5.5 11.5 L8 7.5 H15.5 L18.5 11.5 L21 12.5 V15.5 Z"/><circle cx="7.5" cy="16" r="2" fill="currentColor"/><circle cx="16.5" cy="16" r="2" fill="currentColor"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9 V4 H9 M15 4 H20 V9 M20 15 V20 H15 M9 20 H4 V15"/></svg>',
    retire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4 H19 V20 H14"/><path d="M4 12 H14 M10 8 L14 12 L10 16"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3.5 11 L12 4 L20.5 11 M6 9.5 V20 H18 V9.5"/><path d="M10 20 V14.5 H14 V20"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5 L16 12 L9 19"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 2.5 V6 M12 18 V21.5 M2.5 12 H6 M18 12 H21.5" stroke-linecap="round"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15 V3.5 M7.5 8 L12 3.5 L16.5 8"/><path d="M4.5 13.5 V20 H19.5 V13.5"/></svg>',
    in: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 V15 M7.5 10.5 L12 15 L16.5 10.5"/><path d="M4.5 13.5 V20 H19.5 V13.5"/></svg>'
  };
  // the settings as the game starts them (game.js DEF)
  const S = Object.assign({ control: 'buttons', camera: 'chase', zoom: 1.4, carLow: 0, assist: 2, difficulty: 1, autoGas: 0, notes: 1, tower: 1, line: 0, pkNotes: 1, ghost: 1, pkFly: 1, comm: 1, codrv: 1,
    damage: 2, faults: 1, radio: 1, hlv: 1, quality: 'high', detail: 'auto', shadows: 1, saver: 'off', intro: 0, music: 1, sound: 1, vibrate: 1, lang: 'sl', name: 'Igralec', tiltSens: 22, tiltInvert: 0, pitCmp: 'auto' },
    (() => { try { return JSON.parse(q.get('s') || '{}'); } catch (_) { return {}; } })());
  A.env = { get: (k) => k === 'orient' ? (document.documentElement.classList.contains('land') ? 'land' : 'port') : S[k], tilt: () => null };
  let mode = q.get('mode') === 'menu' ? 'menu' : 'pause';
  let cats = D.cats.filter(c => mode === 'pause' || !c.pauseOnly);
  let tab = cats.find(c => c.id === q.get('tab')) ? q.get('tab') : cats[0].id;
  const BG = window.MOCK_BG || {};   // (the single-file build: the race pictures inside the page)
  const bgOf = () => q.get('bg') || (document.documentElement.classList.contains('land') ? BG.land || 'bg-land.jpg' : BG.port || 'bg-port.jpg');

  /* ---------------- the top ---------------- */
  const top = $('.sx-top');
  let tabsEl = null, ink = null;
  function buildTop() {
    cats = D.cats.filter(c => mode === 'pause' || !c.pauseOnly);
    top.innerHTML = '<div class="sx-title"><i>' + (mode === 'pause' ? I.pause : I.cog) + '</i><h1>' + (mode === 'pause' ? 'Pavza' : 'Nastavitve') + '</h1></div>' +
      '<nav class="sx-tabs" role="tablist" aria-label="Kategorije nastavitev">' + cats.map(c => '<button class="sx-tab" role="tab" data-tab="' + c.id + '" aria-selected="false">' + I[c.icon] + '<span>' + c.name + '</span></button>').join('') + '<i class="sx-ink"></i></nav>' +
      '<button class="sx-go">' + (mode === 'pause' ? '<span>Nadaljuj</span>' + I.play : '<span>Končano</span>' + I.check) + '</button>';
    tabsEl = $('.sx-tabs'); ink = $('.sx-ink');
    tabsEl.addEventListener('click', (e) => { const b = e.target.closest('.sx-tab'); if (b) show(b.dataset.tab); });
    $('.sx-go').addEventListener('click', () => { if (mode === 'pause') resumeRace(); else { setMode('pause'); toast('Nazaj na pavzo med dirko.'); } });
  }
  function placeInk() { const b = tabsEl && tabsEl.querySelector('.sx-tab.on'); if (!b) return; ink.style.left = (b.offsetLeft + b.offsetWidth * 0.18) + 'px'; ink.style.width = (b.offsetWidth * 0.64) + 'px'; b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  function setMode(m) { mode = m; buildTop(); if (!cats.find(c => c.id === tab)) tab = cats[0].id; show(tab, true); updateBar(); }
  // Nadaljuj: the screen goes, the race shows with the pause button over it, which brings the screen back
  const resumeBtn = $('#resume'); resumeBtn.innerHTML = I.pause;
  function resumeRace() { $('#set').classList.add('gone'); resumeBtn.classList.add('on'); toast('Dirka teče naprej. Tapni pavzo zgoraj desno.'); }
  resumeBtn.addEventListener('click', () => { $('#set').classList.remove('gone'); resumeBtn.classList.remove('on'); A.kick(); });
  let toastT = 0;
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600); }

  /* ---------------- the orientation: a phone on its side (up to 560 px high) lays the screen out in one row; a big screen shows a phone in a frame ---------------- */
  const root = document.documentElement;
  let devLand = q.get('land') === '1';
  const wantDev = () => q.get('dev') !== '0' && !q.get('shot') && innerWidth >= 900 && innerHeight >= 560;
  function layout() {
    const dev = wantDev();
    root.classList.toggle('dev', dev);
    const land = dev ? devLand : innerWidth > innerHeight && innerHeight <= 560;
    root.classList.toggle('land', land);
    root.classList.toggle('narrow', land && (dev ? 844 : innerWidth) < 760);
    if (dev) { const w = land ? 864 : 410, hh = land ? 410 : 864, k = Math.min(1, (innerHeight - 90) / hh, (innerWidth - 40) / w); root.style.setProperty('--k', k.toFixed(3)); }
    $('#race').style.backgroundImage = 'url(' + bgOf() + ')';
    placeInk(); for (const s of document.querySelectorAll('.sx-seg')) placeThumb(s, true); A.kick();
  }
  const bar = $('#mockbar');
  function updateBar() {
    bar.innerHTML = '<b>Nove nastavitve</b><span class="mb-seg"><button data-o="0" class="' + (devLand ? '' : 'on') + '">Telefon pokonci</button><button data-o="1" class="' + (devLand ? 'on' : '') + '">Telefon ležeče</button></span>' +
      '<span class="mb-seg"><button data-m="pause" class="' + (mode === 'pause' ? 'on' : '') + '">Med dirko</button><button data-m="menu" class="' + (mode === 'menu' ? 'on' : '') + '">Iz glavnega menija</button></span>';
  }
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.o != null) { devLand = b.dataset.o === '1'; const cam = devLand ? 'iso' : 'chase'; if (S.camera !== cam) { S.camera = cam; const c = document.querySelector('.sx-card[data-key="camera"]'); if (c) { mark(c.querySelector('.sx-seg'), cam); A.change(c._cv, cam); } } updateBar(); layout(); }
    if (b.dataset.m) setMode(b.dataset.m);
  });
  addEventListener('resize', layout);

  /* ---------------- a card: the picture, the name, the choice ---------------- */
  const body = $('.sx-body');
  function seg(it) {
    const el = h('div', 'sx-seg' + (it.opts.length >= 5 ? ' n5' : ''), '<i class="sx-thumb"></i>' + it.opts.map(o => '<button data-v="' + o.v + '" role="radio">' + o.l + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</button>').join(''));
    el.setAttribute('role', 'radiogroup'); el.setAttribute('aria-label', it.name);
    return el;
  }
  function placeThumb(el, instant) {
    const b = el.querySelector('button.sel'), th = el.querySelector('.sx-thumb'); if (!b || !th) return;
    if (instant) th.style.transition = 'none';
    th.style.left = b.offsetLeft + 'px'; th.style.width = b.offsetWidth + 'px';
    if (instant) { void th.offsetWidth; th.style.transition = ''; }
  }
  function mark(el, v) { for (const b of el.querySelectorAll('button')) { const on = String(b.dataset.v) === String(v); b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); } }
  function card(it) {
    const c = h('section', 'sx-card'); c.dataset.key = it.key;
    const pic = h('div', 'sx-pic'), cv = h('canvas'); pic.appendChild(cv); c.appendChild(pic);
    const row = h('div', 'sx-row'); c.appendChild(row);
    const nm = h('div', 'sx-name', it.name + (it.hint ? ' <small>' + it.hint + '</small>' : '')); row.appendChild(nm);
    if (it.opts) {
      const sg = seg(it); row.appendChild(sg); mark(sg, S[it.key]);
      sg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; set(it, b.dataset.v, c); });
      requestAnimationFrame(() => placeThumb(sg, true));
    } else if (it.range) {
      const R = it.range, el = h('div', 'sx-range', '<i>' + R.min + R.unit + '</i><input type="range" min="' + R.min + '" max="' + R.max + '" step="' + R.step + '" value="' + S[it.key] + '" aria-label="' + it.name + '"><i>' + R.max + R.unit + '</i><output>' + S[it.key] + R.unit + '</output>');
      const inp = el.querySelector('input'), out = el.querySelector('output'), fill = () => inp.style.setProperty('--f', ((inp.value - R.min) / (R.max - R.min) * 100) + '%'); fill();
      inp.addEventListener('input', () => { S[it.key] = +inp.value; out.textContent = inp.value + R.unit; fill(); A.change(cv, S[it.key]); });
      row.appendChild(el);
    } else if (it.input) {
      const inp = h('input', 'sx-input'); inp.type = 'text'; inp.maxLength = 16; inp.value = S.name; inp.setAttribute('aria-label', it.name); inp.spellcheck = false;
      inp.addEventListener('input', () => { S.name = inp.value.trim() || 'Igralec'; A.kick(); });
      row.appendChild(inp);
    } else if (it.link) {
      row.appendChild(h('div', 'sx-more', '<button class="sx-btn wide"><span>' + it.link + '</span>' + I.chev + '</button>'));
    } else if (it.buttons) {
      row.appendChild(h('div', 'sx-more', it.buttons.map((b, i) => '<button class="sx-btn">' + (i ? I.in : I.out) + '<span>' + b + '</span></button>').join('')));
    }
    if (it.extra === 'calibrate') c.appendChild(h('div', 'sx-more', '<button class="sx-btn">' + I.target + '<span>Nastavi sredino</span></button><span class="sx-note">Telefon drži, kot ga držiš med vožnjo, in tapni.</span>')).style.marginTop = '8px';
    if (it.extra === 'voice') { const m = h('div', 'sx-more', '<button class="sx-btn">' + I.play + '<span>Preizkusi glas</span></button><span class="sx-note">Glas: angleški, moški</span>'); m.style.marginTop = '8px'; c.appendChild(m); }
    c._cv = cv; c._it = it;
    return c;
  }
  function visible(it) { if (!it.only) return true; for (const k in it.only) if (String(S[k]) !== String(it.only[k])) return false; return true; }
  function set(it, v, c) {
    const num = typeof it.opts[0].v === 'number';
    S[it.key] = num ? +v : v;
    mark(c.querySelector('.sx-seg'), S[it.key]); placeThumb(c.querySelector('.sx-seg'));
    A.change(c._cv, S[it.key]);
    // the cards that only show with this choice (Nagib: its sensitivity and direction) come and go
    for (const o of document.querySelectorAll('.sx-card')) { const vis = visible(o._it); if (vis === !o.classList.contains('hide')) continue; o.classList.toggle('hide', !vis); if (vis) { o.classList.remove('grow'); void o.offsetWidth; o.classList.add('grow'); A.kick(); for (const s of o.querySelectorAll('.sx-seg')) placeThumb(s, true); } }
  }

  /* ---------------- a tab's page ---------------- */
  let list = null, idx = 0;
  function show(id, instant) {
    const i = cats.findIndex(c => c.id === id); if (i < 0) return;
    const dir = i >= idx ? '' : ' left'; idx = i; tab = id;
    for (const b of tabsEl.querySelectorAll('.sx-tab')) { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }
    placeInk();
    if (list) { for (const c of list.querySelectorAll('canvas')) A.detach(c); list.remove(); }
    list = h('div', 'sx-list' + (instant ? '' : ' in' + dir)); body.appendChild(list);
    const C = cats[i];
    if (C.id === 'pavza') {
      const acts = h('div', 'sx-acts', D.pause.map(a => '<button class="sx-act' + (a.ghost ? ' ghost' : '') + (a.act === 'retire' ? ' red' : '') + '" data-act="' + a.act + '">' + I[a.icon] + '<span>' + a.l + '</span></button>').join(''));
      acts.addEventListener('click', (e) => { const b = e.target.closest('.sx-act'); if (!b) return;
        if (b.dataset.act === 'to-title') { setMode('menu'); toast('Nastavitve iz glavnega menija: brez zavihka Pavza, zgoraj Končano.'); }
        else toast('V maketi: »' + b.textContent.trim() + '« dela kot zdaj v igri.'); });
      list.appendChild(acts);
      list.appendChild(h('p', 'sx-strat', '<b>Strategija:</b> en postanek okoli 6. kroga, mehke → srednje.'));
    }
    for (const it of C.items) {
      const c = card(it); if (!visible(it)) c.classList.add('hide'); list.appendChild(c);
      A.attach(c._cv, it.anim, it.range ? S[it.key] : S[it.key]);
    }
    if (still != null) requestAnimationFrame(() => stillAll());
  }

  /* ---------------- stills for the mockup's pictures ---------------- */
  const still = q.get('shot') ? +(q.get('t') || 2.4) : null;
  function stillAll() {
    A.still = true;
    for (const s of document.querySelectorAll('.sx-seg')) placeThumb(s, true);
    for (const L of A.live) { const it = cats.flatMap(c => c.items).find(x => x.anim === L.key); const port = !document.documentElement.classList.contains('land'), tt = it && port && it.storyTp != null ? it.storyTp : it && it.storyT != null ? it.storyT : still; A.drawAt(L, tt, Math.max(4, tt)); }
    if (q.get('scroll')) list.scrollTop = +q.get('scroll');
    document.body.dataset.ready = '1';
  }
  buildTop(); updateBar(); layout();
  document.fonts.ready.then(() => { show(tab, true); layout(); });
  window.SX = { S, show, set: (key, v) => { const c = document.querySelector('.sx-card[data-key="' + key + '"]'); if (c) set(c._it, v, c); } };
})();
