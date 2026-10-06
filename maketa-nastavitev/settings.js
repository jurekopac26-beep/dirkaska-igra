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
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="2.5" y="5" width="12.5" height="10" rx="2"/><path d="M4.5 13 L7.5 10 L9.5 12 L11 10.5 L13 12.5"/><path d="M16.5 15.5 H18 L20.5 18 V9 L18 11.5 H16.5 Z" fill="currentColor"/><path d="M8.5 15 V19 M5.5 19 H11.5" stroke-linecap="round"/></svg>',
    pad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 7.5 H17 C19.5 7.5 21 10 21.3 13.5 C21.6 17 20.4 18.6 18.8 18.6 C17.4 18.6 16.6 17.2 15.8 15.8 H8.2 C7.4 17.2 6.6 18.6 5.2 18.6 C3.6 18.6 2.4 17 2.7 13.5 C3 10 4.5 7.5 7 7.5 Z"/><path d="M7.5 10.6 V14.2 M5.7 12.4 H9.3" stroke-linecap="round"/><circle cx="15.6" cy="11.4" r="1.1" fill="currentColor"/><circle cx="17.6" cy="13.4" r="1.1" fill="currentColor"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M2 12 C4.8 7.2 8.2 5 12 5 C15.8 5 19.2 7.2 22 12 C19.2 16.8 15.8 19 12 19 C8.2 19 4.8 16.8 2 12 Z"/><circle cx="12" cy="12" r="3.4"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3 L14.7 8.6 L20.8 9.4 L16.3 13.6 L17.5 19.7 L12 16.7 L6.5 19.7 L7.7 13.6 L3.2 9.4 L9.3 8.6 Z"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6 L9.2 9.2 M14.8 14.8 L18.4 18.4 M18.4 5.6 L14.8 9.2 M9.2 14.8 L5.6 18.4" stroke-width="2.6"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M4 6.5 H20 M4 12 H20 M4 17.5 H20"/><circle cx="9" cy="6.5" r="2.2" fill="currentColor"/><circle cx="15.5" cy="12" r="2.2" fill="currentColor"/><circle cx="7" cy="17.5" r="2.2" fill="currentColor"/></svg>',
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
  // the three looks of the chosen layout (D.versions: A, B, C): the tabs, their sections, where the pause's buttons go; ?v=B or #b picks one
  const ITEM = {}; for (const c of D.cats) for (const it of c.items) ITEM[it.key] = it;
  const hm = /^([a-z])?([0-3])?(?:-([1-3]))?$/i.exec(location.hash.slice(1)) || [];
  let ver = String(q.get('v') || hm[1] || 'A').toUpperCase(); if (!D.versions[ver]) ver = Object.keys(D.versions)[0];
  // the pictures over the settings: the drawn animations, or real frames from the game in three ways (settings-real.js); ?media= or #a1..#a3
  const MEDIA = ['anim', 'video', 'compare', 'live'], MEDIA_NAME = { anim: 'Animacija', video: 'Posnetek', compare: 'Primerjava', live: 'V živo' };
  let media = MEDIA.includes(q.get('media')) ? q.get('media') : hm[2] ? MEDIA[+hm[2]] : (window.SetReal ? 'video' : 'anim');
  const real = () => media !== 'anim' && !!window.SetReal;
  // lying, the pause's buttons at the foot as when upright, bigger: 1 the full names beside the icons, 2 big keys, 3 the keys and a big
  // Nadaljuj on the right; ?lb= or #a1-2
  const LB_NAME = { 1: 'Polna imena', 2: 'Velike tipke', 3: 'Nadaljuj spodaj' };
  let lb = LB_NAME[q.get('lb')] ? q.get('lb') : hm[3] || '1';
  if (window.SetReal) SetReal.control = () => S.control;   // (the race in the pictures with the player's controls)
  const orientNow = () => document.documentElement.classList.contains('land') ? 'land' : 'port';
  let cats = [];
  function buildCats() {
    cats = D.versions[ver].tabs.map(t => ({ id: t.id, name: t.name, icon: t.icon,
      sections: t.sections.map(x => ({ t: x.t, items: x.keys.map(k => ITEM[k]).filter(it => it && (mode === 'pause' || it.key !== 'pitCmp')) })).filter(x => x.items.length) }));
  }
  buildCats();
  let tab = cats.find(c => c.id === q.get('tab')) ? q.get('tab') : cats[0].id;
  const allItems = () => cats.flatMap(c => c.sections.flatMap(x => x.items));
  const BG = window.MOCK_BG || {};   // (the single-file build: the race pictures inside the page)
  const bgOf = () => q.get('bg') || (document.documentElement.classList.contains('land') ? BG.land || 'bg-land.jpg' : BG.port || 'bg-port.jpg');

  /* ---------------- the top ---------------- */
  const top = $('.sx-top');
  let tabsEl = null, ink = null;
  function actHandler(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'go') { goOn(); return; }
    if (b.dataset.act === 'to-title') { setMode('menu'); toast('Nastavitve iz glavnega menija: brez gumbov pavze, namesto Nadaljuj je Končano.'); }
    else toast('V maketi: »' + (b.getAttribute('aria-label') || b.textContent.trim()) + '« dela kot zdaj v igri.');
  }
  let builtLand = null;
  const keys = (arr, full) => arr.map(a => '<button class="sx-ab' + (a.act === 'retire' ? ' red' : '') + '" data-act="' + a.act + '" aria-label="' + a.l + '">' + I[a.icon] + '<span>' + (full ? a.l : a.s) + '</span></button>').join('');
  function goOn() { if (mode === 'pause') resumeRace(); else { setMode('pause'); toast('Nazaj na pavzo med dirko.'); } }
  function buildTop() {
    buildCats();
    const V = D.versions[ver], land = root.classList.contains('land'), P = V.pause, pz = mode === 'pause';
    const abar = pz && P === 'bar', bbar = pz && P === 'bottom', dock = P === 'dock' && !land, rail = P === 'dock' && land, goBar = bbar && land && lb === '3';
    for (const v of Object.values(D.versions)) root.classList.toggle('skin-' + v.skin, v === V);
    for (const el of document.querySelectorAll('.sx-botbar, .sx-rail')) el.remove();
    // (look B: Nadaljuj is a big round button, in the middle of the bar at the foot or at the foot of the rail on the right)
    const play = '<button class="sx-play" data-act="go" aria-label="' + (pz ? 'Nadaljuj' : 'Končano') + '"><i>' + (pz ? I.play : I.check) + '</i><span>' + (pz ? 'Nadaljuj' : 'Končano') + '</span></button>';
    let bb = null;
    if (bbar) bb = h('div', 'sx-botbar' + (land ? ' lb' + lb : ''), keys(D.pause, land && lb === '1') + (goBar ? '<button class="sx-go" data-act="go"><span>Nadaljuj</span>' + I.play + '</button>' : ''));
    if (dock) bb = h('div', 'sx-botbar sx-dock' + (pz ? '' : ' solo'), pz ? keys(D.pause.slice(0, 3)) + play + keys(D.pause.slice(3)) : '<button class="sx-done" data-act="go"><span>Končano</span>' + I.check + '</button>');
    if (bb) { bb.addEventListener('click', actHandler); $('#set').appendChild(bb); }
    if (rail) { const r = h('div', 'sx-rail', (pz ? keys(D.pause) : '') + play); r.addEventListener('click', actHandler); body.appendChild(r); }
    root.style.setProperty('--brw', rail ? '70px' : '0px');   // (and to the left of the rail)
    root.style.setProperty('--bbh', '0px'); if (bb) requestAnimationFrame(() => { if (bb.isConnected) root.style.setProperty('--bbh', (bb.offsetHeight + (dock && pz ? 30 : 0)) + 'px'); });   // (the switch A B C and the notes go above the bar)
    builtLand = land;
    top.innerHTML = '<div class="sx-title"><i>' + (pz ? I.pause : I.cog) + '</i><div class="sx-tt"><h1>' + (pz ? 'Pavza' : 'Nastavitve') + '</h1><small>' + (pz ? 'Krog 1/3 · 12. mesto' : 'Iz glavnega menija') + '</small></div></div>' +
      (abar ? '<div class="sx-actbar">' + keys(D.pause) + '</div>' : '') +
      '<nav class="sx-tabs n' + cats.length + ' look-' + (V.look || 'line') + '" role="tablist" aria-label="Kategorije nastavitev">' + cats.map(c => '<button class="sx-tab" role="tab" data-tab="' + c.id + '" aria-selected="false">' + I[c.icon] + '<span>' + c.name + '</span><em></em></button>').join('') + '<i class="sx-ink"></i></nav>' +
      (P === 'dock' || goBar ? '' : '<button class="sx-go">' + (pz ? '<span>Nadaljuj</span>' + I.play : '<span>Končano</span>' + I.check) + '</button>');
    tabsEl = $('.sx-tabs'); ink = $('.sx-ink');
    tabsEl.addEventListener('click', (e) => { const b = e.target.closest('.sx-tab'); if (b) show(b.dataset.tab); });
    if ($('.sx-top .sx-go')) $('.sx-top .sx-go').addEventListener('click', goOn);
    if (abar) $('.sx-actbar').addEventListener('click', actHandler);
  }
  // (look C: each tab and each part says how many settings it shows; Nagib's two come and go)
  function counts() {
    if (!list) return;
    for (const C of cats) {
      const n = [...list.querySelectorAll('.sx-card[data-part="' + C.id + '"]')].filter(c => !c.classList.contains('hide')).length;
      const t = tabsEl && tabsEl.querySelector('[data-tab="' + C.id + '"] em'); if (t) t.textContent = n;
      const p = list.querySelector('[data-part="' + C.id + '"].sx-big em'); if (p) p.textContent = n + (n === 1 ? ' nastavitev' : n === 2 ? ' nastavitvi' : n < 5 ? ' nastavitve' : ' nastavitev');
    }
  }
  const hashNow = () => '#' + ver.toLowerCase() + (media === 'anim' ? '0' : MEDIA.indexOf(media)) + '-' + lb;
  function setLb(v) { lb = v; buildTop(); show(tab, true); updateBar(); markChip(); try { if (!q.get('shot')) history.replaceState(null, '', hashNow()); } catch (_) { } }
  function setVer(v) { ver = v; buildTop(); tab = cats[0].id; show(tab, true); updateBar(); try { if (!q.get('shot')) history.replaceState(null, '', hashNow()); } catch (_) { } }
  function setMedia(m) { media = m; root.classList.toggle('media-live', real() && media === 'live'); show(tab, true); updateBar(); try { if (!q.get('shot')) history.replaceState(null, '', hashNow()); } catch (_) { } }
  const listMode = () => D.versions[ver].mode === 'list';
  function placeInk() { const b = tabsEl && tabsEl.querySelector('.sx-tab.on'); if (!b) return; const full = tabsEl.classList.contains('look-pill'); ink.style.left = (b.offsetLeft + (full ? 0 : b.offsetWidth * 0.18)) + 'px'; ink.style.width = (b.offsetWidth * (full ? 1 : 0.64)) + 'px'; }
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
    if (builtLand !== null && builtLand !== land && /bottom|dock/.test(D.versions[ver].pause)) { buildTop(); show(tab, true); }
    else if (real() && list && list._o && list._o !== orientNow()) show(tab, true);   // (the real frames: the phone's other side has its own)
    placeInk(); if (real()) SetReal.place(); for (const s of document.querySelectorAll('.sx-seg')) placeThumb(s, true); A.kick();
  }
  const bar = $('#mockbar');
  function updateBar() {
    bar.innerHTML = '<b>Nove nastavitve</b><span class="mb-seg">' + Object.keys(D.versions).map(v => '<button data-v="' + v + '" class="' + (v === ver ? 'on' : '') + '" title="' + D.versions[v].name + '">' + v + ' · ' + D.versions[v].name + '</button>').join('') + '</span><span class="mb-seg"><button data-o="0" class="' + (devLand ? '' : 'on') + '">Telefon pokonci</button><button data-o="1" class="' + (devLand ? 'on' : '') + '">Telefon ležeče</button></span>' +
      '<span class="mb-seg"><button data-m="pause" class="' + (mode === 'pause' ? 'on' : '') + '">Med dirko</button><button data-m="menu" class="' + (mode === 'menu' ? 'on' : '') + '">Iz glavnega menija</button></span>' +
      (window.SetReal ? '<span class="mb-seg">' + MEDIA.map((m, i) => '<button data-media="' + m + '" class="' + (m === media ? 'on' : '') + '">' + (i ? i + ' · ' : '') + MEDIA_NAME[m] + '</button>').join('') + '</span>' : '') +
      '<span class="mb-seg" title="Ležeče: gumbi pavze spodaj">' + Object.keys(LB_NAME).map(k => '<button data-lb="' + k + '" class="' + (k === lb ? 'on' : '') + '">' + (k === '1' ? 'Ležeče spodaj: ' : '') + k + ' · ' + LB_NAME[k] + '</button>').join('') + '</span>';
  }
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.o != null) { devLand = b.dataset.o === '1'; const cam = devLand ? 'iso' : 'chase'; if (S.camera !== cam) { S.camera = cam; const c = document.querySelector('.sx-card[data-key="camera"]'); if (c) { mark(c.querySelector('.sx-seg'), cam); A.change(c._cv, cam); } } updateBar(); layout(); }
    if (b.dataset.m) setMode(b.dataset.m);
    if (b.dataset.v) setVer(b.dataset.v);
    if (b.dataset.media) setMedia(b.dataset.media);
    if (b.dataset.lb) setLb(b.dataset.lb);
  });
  // (a phone has no switches over the screen: a small one in the corner picks the version)
  const chip = h('div', 'vchip', Object.keys(D.versions).map(v => '<button data-v="' + v + '">' + v + '</button>').join('') + (window.SetReal ? '<i></i>' + [1, 2, 3].map(i => '<button data-media="' + MEDIA[i] + '">' + i + '</button>').join('') : '') +
    '<span class="lbg"><i></i>' + Object.keys(LB_NAME).map(k => '<button data-lb="' + k + '" title="Ležeče spodaj: ' + LB_NAME[k] + '">S' + k + '</button>').join('') + '</span>'); document.body.appendChild(chip);   // (S1-S3: lying only)
  const markChip = () => { for (const b of chip.querySelectorAll('button')) b.classList.toggle('on', b.dataset.v ? b.dataset.v === ver : b.dataset.lb ? b.dataset.lb === lb : b.dataset.media === media); };
  chip.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.v) { setVer(b.dataset.v); toast('Videz ' + b.dataset.v + ': ' + D.versions[b.dataset.v].name); } else if (b.dataset.lb) { setLb(b.dataset.lb); toast('Ležeče spodaj ' + lb + ': ' + LB_NAME[lb]); } else { setMedia(b.dataset.media); toast('Slika ' + MEDIA.indexOf(media) + ': ' + MEDIA_NAME[media]); } markChip(); });
  markChip();
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
    let cv = null;
    if (!real()) { const pic = h('div', 'sx-pic'); cv = h('canvas'); pic.appendChild(cv); c.appendChild(pic); }
    else if (media === 'video') c.appendChild(c._real = SetReal.video(orientNow(), it, S[it.key]));
    else if (media === 'compare') c.appendChild(c._real = SetReal.compare(orientNow(), it, S[it.key], (v) => set(it, v, c)));
    else c.addEventListener('click', () => focusLive(c));   // (live: the card shows itself in the window at the top)
    const row = h('div', 'sx-row'); c.appendChild(row);
    const nm = h('div', 'sx-name', it.name + (it.hint ? ' <small>' + it.hint + '</small>' : '')); row.appendChild(nm);
    if (it.opts) {
      const sg = seg(it); row.appendChild(sg); mark(sg, S[it.key]);
      sg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; set(it, b.dataset.v, c); });
      requestAnimationFrame(() => placeThumb(sg, true));
    } else if (it.range) {
      const R = it.range, el = h('div', 'sx-range', '<i>' + R.min + R.unit + '</i><input type="range" min="' + R.min + '" max="' + R.max + '" step="' + R.step + '" value="' + S[it.key] + '" aria-label="' + it.name + '"><i>' + R.max + R.unit + '</i><output>' + S[it.key] + R.unit + '</output>');
      const inp = el.querySelector('input'), out = el.querySelector('output'), fill = () => inp.style.setProperty('--f', ((inp.value - R.min) / (R.max - R.min) * 100) + '%'); fill();
      inp.addEventListener('input', () => { S[it.key] = +inp.value; out.textContent = inp.value + R.unit; fill(); if (cv) A.change(cv, S[it.key]); else realSet(it, S[it.key], c, 0); });
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
    const num = typeof it.opts[0].v === 'number', was = it.opts.findIndex(o => String(o.v) === String(S[it.key]));
    S[it.key] = num ? +v : v;
    mark(c.querySelector('.sx-seg'), S[it.key]); placeThumb(c.querySelector('.sx-seg'));
    if (c._cv) A.change(c._cv, S[it.key]); else realSet(it, S[it.key], c, it.opts.findIndex(o => String(o.v) === String(S[it.key])) - was);
    // the cards that only show with this choice (Nagib: its sensitivity and direction) come and go
    for (const o of document.querySelectorAll('.sx-card')) { const vis = visible(o._it); if (vis === !o.classList.contains('hide')) continue; o.classList.toggle('hide', !vis); if (vis) { o.classList.remove('grow'); void o.offsetWidth; o.classList.add('grow'); A.kick(); for (const s of o.querySelectorAll('.sx-seg')) placeThumb(s, true); } }
    counts();
  }

  // the real frames: the option changed (video: the clip of the new one comes in; compare: it is lit; live: the window shows it)
  function realSet(it, v, c, dir) {
    if (it.key === 'control') SetReal.rebase();
    if (media === 'video' && c._real) SetReal.videoTo(c._real, orientNow(), it, v, dir);
    else if (media === 'compare' && c._real) SetReal.compareTo(c._real, v, it);
    else if (media === 'live') focusLive(c);
  }
  let liveEl = null;
  function focusLive(c) {
    if (!liveEl || !c) return;
    for (const o of document.querySelectorAll('.sx-card.focus')) o.classList.remove('focus');
    c.classList.add('focus'); SetReal.liveShow(liveEl, c._it, S[c._it.key]);
  }

  /* ---------------- a tab's page ---------------- */
  let list = null, idx = 0;
  function markTab(id) { tab = id; for (const b of tabsEl.querySelectorAll('.sx-tab')) { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); } placeInk(); }
  function addCards(C) {
    for (const sec of C.sections) {
      if (C.sections.length > 1) list.appendChild(h('div', 'sx-cat', sec.t));
      for (const it of sec.items) {
        const c = card(it); c.dataset.part = C.id; if (!visible(it)) c.classList.add('hide'); list.appendChild(c);
        if (c._cv) A.attach(c._cv, it.anim, S[it.key]);
      }
    }
  }
  function pauseTop() {
    const V = D.versions[ver];
    if (mode === 'pause' && V.pause === 'tab') {
      const acts = h('div', 'sx-acts', D.pause.map(a => '<button class="sx-act' + (a.ghost ? ' ghost' : '') + (a.act === 'retire' ? ' red' : '') + '" data-act="' + a.act + '">' + I[a.icon] + '<span>' + a.l + '</span></button>').join(''));
      acts.addEventListener('click', actHandler);
      list.appendChild(acts);
    }
    if (mode === 'pause') list.appendChild(h('p', 'sx-strat', '<b>Strategija:</b> en postanek okoli 6. kroga, mehke → srednje.'));
  }
  function show(id, instant) {
    const i = cats.findIndex(c => c.id === id); if (i < 0) return;
    if (listMode() && list && list._all && !instant) {   // (the one list: a tab only scrolls to its part)
      const hd = list.querySelector('.sx-big[data-part="' + id + '"]'); markTab(id); list._jump = Date.now();
      if (hd) list.scrollTo({ top: hd.offsetTop - 6, behavior: 'smooth' }); return;
    }
    const dir = i >= idx ? '' : ' left'; idx = i;
    markTab(id);
    if (list) { for (const c of list.querySelectorAll('canvas')) A.detach(c); list.remove(); }
    if (liveEl) { liveEl.remove(); liveEl = null; }
    root.classList.toggle('media-live', real() && media === 'live');
    if (real() && media === 'live') body.appendChild(liveEl = SetReal.live(orientNow()));
    list = h('div', 'sx-list' + (instant ? '' : ' in' + dir)); body.appendChild(list); list._o = orientNow();
    if (listMode()) {
      list._all = true; pauseTop();
      for (const C of cats) { list.appendChild(h('div', 'sx-big', I[C.icon] + '<span>' + C.name + '</span><em></em><small>' + C.sections.map(x => x.t).join(' · ') + '</small>')).dataset.part = C.id; addCards(C); }
      list.addEventListener('scroll', () => {   // (the tab of the part at the top lights up)
        if (list._jump && Date.now() - list._jump < 700) return;
        let cur = cats[0].id; for (const hd of list.querySelectorAll('.sx-big[data-part]')) if (hd.offsetTop - list.scrollTop <= 60) cur = hd.dataset.part;
        if (cur !== tab) markTab(cur);
      }, { passive: true });
      if (i > 0) { const hd = list.querySelector('.sx-big[data-part="' + id + '"]'); if (hd) requestAnimationFrame(() => { list.scrollTop = hd.offsetTop - 6; }); }
    } else {
      if (i === 0) pauseTop();
      addCards(cats[i]);
    }
    counts();
    if (liveEl) {   // (the window starts on the part's first setting the game draws differently: Upravljanje, Kamera ...)
      const C = cats[i], first = C.sections.flatMap(x => x.items).find(it => SetReal.frameOf(orientNow(), it.key, S[it.key]) !== 'base' && visible(it)) || C.sections[0].items[0];
      requestAnimationFrame(() => focusLive(list.querySelector('.sx-card[data-key="' + first.key + '"]')));
    }
    if (real()) requestAnimationFrame(() => SetReal.place());
    if (still != null) requestAnimationFrame(() => stillAll());
  }

  /* ---------------- stills for the mockup's pictures ---------------- */
  const still = q.get('shot') ? +(q.get('t') || 2.4) : null;
  if (still != null) document.body.dataset.shot = '1';
  async function stillAll() {
    A.still = true;
    if (real()) {   // (the real frames loaded and placed before the picture is taken)
      await new Promise(r => requestAnimationFrame(r)); SetReal.place();
      const urls = new Set([...document.querySelectorAll('.rf')].map(f => (/url\("?([^")]+)"?\)/.exec(f.style.backgroundImage) || [])[1]).filter(Boolean));
      await Promise.all([...urls].map(u => new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = u; })));
      for (const f of document.querySelectorAll('.rv .rf.in, .rv .rf.out')) f.classList.remove('in', 'out');
    }
    for (const s of document.querySelectorAll('.sx-seg')) placeThumb(s, true);
    for (const L of A.live) { const it = allItems().find(x => x.anim === L.key); const port = !document.documentElement.classList.contains('land'), tt = it && port && it.storyTp != null ? it.storyTp : it && it.storyT != null ? it.storyT : still; A.drawAt(L, tt, Math.max(4, tt)); }
    if (q.get('scroll')) list.scrollTop = +q.get('scroll');
    const atC = q.get('at') && list.querySelector('.sx-card[data-key="' + q.get('at') + '"]');   // (?at=<key>: the list down at that setting; live: shown in the window)
    if (atC) { list.scrollTop = atC.offsetTop - 58; if (media === 'live' && real()) { focusLive(atC); await new Promise(r => setTimeout(r, 450)); SetReal.place(); } }
    if (listMode() && tab !== cats[0].id && !atC) { const hd = list.querySelector('.sx-big[data-part="' + tab + '"]'); if (hd) list.scrollTop = hd.offsetTop - 6; }
    const bb = $('.sx-botbar'), topH = $('.sx-top').getBoundingClientRect().bottom, bbH = bb ? bb.offsetHeight : 0;
    document.body.dataset.h = Math.ceil(topH + list.scrollHeight + bbH);   // (the whole page: the long pictures)
    if (listMode()) {   // (one part of the one list, from its heading to the next one)
      const parts = [...list.querySelectorAll('.sx-big[data-part]')], k = parts.findIndex(p => p.dataset.part === tab);
      const a = k > 0 ? parts[k].offsetTop - 6 : 0, b = k + 1 < parts.length ? parts[k + 1].offsetTop - 6 : list.scrollHeight;
      document.body.dataset.hp = Math.ceil(topH + b - a + bbH);
    }
    document.body.dataset.ready = '1';
  }
  buildTop(); updateBar(); layout();
  document.fonts.ready.then(() => { show(tab, true); layout(); });
  window.SX = { S, show, setVer, set: (key, v) => { const c = document.querySelector('.sx-card[data-key="' + key + '"]'); if (c) set(c._it, v, c); } };
})();
