/* =========================================================================
   Real Roads Atlas — the menu: main menu, Single race (mode, track, car, weather), the intro before a race (the globe, the helicopter's
   flight, the country's music), the credits. It lives in a shadow root of its own (css/menu.css), so nothing of the game's page
   reaches it and it reaches nothing of the game's: the game talks to it through Menu.init(bridge) (js/game.js, "the menu's bridge")
   and Menu.show(screen), and the menu to the game through that bridge. The texts are in English (js/menu-data.js and here).
   Made from maketa-menija (the standalone mockup, kept as it was) and now part of the game: edit it here.
   ========================================================================= */
(function () {
  'use strict';
  const D = window.MENU, RT = window.ROUTES || {}, XI = window.INTRO || {};
  let G = null;                 // the game's bridge (Menu.init)
  let host = null, app = null;  // the element in the game's page, and the menu's own frame in its shadow root
  const $ = (s, el) => (el || app).querySelector(s);

  /* ---------------- small helpers ---------------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (n) => Number(n).toLocaleString('en-US');
  const laps = (n) => n + (n === 1 ? ' lap' : ' laps');
  const clock = (s) => Math.floor(s / 60) + ':' + (s % 60).toFixed(2).padStart(5, '0');

  /* ---------------- a browser that darkens the page by force ----------------
     Samsung Internet's dark mode (by default) repaints every page as it is drawn and tells it the player prefers light, so the
     page's own color-scheme: dark (index.html, the CSS) cannot stop it: white turns black, gold brown, the kerb's white stripes dark
     (the 3D world, a WebGL canvas, is spared). No page can switch it off, so the title says where the player can (darkSheet). Found
     with Chrome's own probe: the system colour Canvas in a light element is white unless the browser forces dark. A browser that
     also reports prefers dark (Chrome's auto-dark) respects the game's color-scheme and leaves it as it is: nothing to say. The page
     temni-nacin.html shows the same probe and what each way of painting looks like in such a browser. */
  const isSamsung = () => /SamsungBrowser/i.test(navigator.userAgent);
  function forcedDark() {
    if (window.Sence && Sence.on) return false;   // (js/sence.js draws the colours past it: nothing to say)
    try {
      if (matchMedia('(prefers-color-scheme: dark)').matches) return false;
      const d = document.createElement('div'); d.style.cssText = 'display:none;background-color:canvas;color-scheme:light';
      document.body.appendChild(d); const c = getComputedStyle(d).backgroundColor; d.remove();
      const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(c);   // (a browser without the keyword: transparent, not dark)
      return !!m && (m[4] == null || +m[4] > 0.5) && (299 * m[1] + 587 * m[2] + 114 * m[3]) / 1000 < 128;
    } catch (_) { return false; }
  }
  const darkTipOff = () => { try { return localStorage.getItem('tdgp-darktip') === 'off'; } catch (_) { return false; } };
  // shown once a visit: the tab's session (the garage and the game's own reloads are the same visit; without storage: this page)
  let darkMem = false;
  const darkTold = () => { try { return darkMem || sessionStorage.getItem('tdgp-darktold') === '1'; } catch (_) { return darkMem; } };
  const setDarkTold = (v) => { darkMem = v; try { if (v) sessionStorage.setItem('tdgp-darktold', '1'); else sessionStorage.removeItem('tdgp-darktold'); } catch (_) { /* memory only */ } };
  // the game in Chrome on Android (an intent: Samsung Internet hands it to the system; without Chrome the same address again), with the
  // address it was opened with: game.js takes a friend's challenge or ghost from the hash and clears it as it starts (the garage's way
  // back, zaslon and avto, stays behind)
  const ARRIVED = (() => { try { const P = new URLSearchParams(location.search); P.delete('zaslon'); P.delete('avto'); const q = P.toString(); return (q ? '?' + q : '') + location.hash; } catch (_) { return ''; } })();
  const chromeUrl = () => { const u = location.origin + location.pathname + ARRIVED; return 'intent://' + u.replace(/^https?:\/\//, '') + '#Intent;scheme=' + location.protocol.slice(0, -1) + ';package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(u) + ';end'; };

  /* ---------------- icons ---------------- */
  const I = {
    wheel: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="#ffc629" stroke-width="2.6"/><circle cx="12" cy="12" r="2.4" fill="#ffc629"/><path d="M3.5 11h6M14.5 11h6M12 14.5v6" stroke="#ffc629" stroke-width="2.6"/></svg>',
    back: '<svg viewBox="0 0 22 22"><path d="M14 4 7 11l7 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 18 18"><path d="m7 3 6 6-6 6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bigcup: '<svg class="bigcup" viewBox="0 0 32 32" aria-hidden="true"><path d="M9.5 4.5h13v7.5a6.5 6.5 0 0 1-13 0z" fill="#ffc629" stroke="#8a6200" stroke-width=".8"/><path d="M9.6 7H5.8a4.2 4.2 0 0 0 4.6 5.8M22.4 7h3.8a4.2 4.2 0 0 1-4.6 5.8" fill="none" stroke="#ffc629" stroke-width="2" stroke-linecap="round"/><path d="M14.3 18h3.4v5h-3.4z" fill="#e0a40a"/><path d="M10.5 23.5h11v3.8h-11z" fill="#ffc629" stroke="#8a6200" stroke-width=".8"/><path d="M12 6.5h2.2v6.2a2 2 0 0 1-2.2-2z" fill="rgba(255,255,255,.55)"/></svg>',
    lock: (c) => '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="' + c + '"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="' + c + '" stroke-width="2.4"/></svg>',
    coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffc629"/><circle cx="12" cy="12" r="7" fill="none" stroke="#b07d00" stroke-width="1.6"/><path d="M12 7.6l1.3 2.7 2.9.4-2.1 2 .5 2.9L12 14.3l-2.6 1.3.5-2.9-2.1-2 2.9-.4z" fill="#b07d00"/></svg>',   // (a gold coin with a star: the money)
    check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffc629"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#1b1b1b" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bolt: '<svg width="20" height="24" viewBox="0 0 22 24"><path d="M13 1.5 3.5 14h6.5l-1.5 8.5L19 10h-6.8z" fill="#fff"/></svg>',
    weight: '<svg width="22" height="24" viewBox="0 0 22 24"><path d="M7.5 7a3.5 3.5 0 1 1 7 0" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M4.5 9h13l2.5 12.5H2z" fill="#fff"/><text x="11" y="19" text-anchor="middle" font-family="ApexMenu, Roboto, Arial" font-weight="900" font-size="7" fill="#0e1a2c">KG</text></svg>',
    drive: '<svg width="22" height="24" viewBox="0 0 22 24"><rect x="2" y="2.5" width="5" height="8" rx="1.5" fill="#fff"/><rect x="15" y="2.5" width="5" height="8" rx="1.5" fill="#fff"/><rect x="2" y="13.5" width="5" height="8" rx="1.5" fill="#fff"/><rect x="15" y="13.5" width="5" height="8" rx="1.5" fill="#fff"/><path d="M7 6.5h8M7 17.5h8M11 6.5v11" stroke="#fff" stroke-width="2"/></svg>',
    gears: '<svg width="21" height="24" viewBox="0 0 22 24"><path d="M4 4v16M11 4v16M18 4v8M4 12h14" stroke="#fff" stroke-width="2.3" fill="none" stroke-linecap="round"/><circle cx="18" cy="4" r="2.6" fill="#fff"/></svg>',
    globe: '<svg width="22" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" fill="none" stroke="#fff" stroke-width="1.6"/></svg>',
    people: '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.4" fill="#fff"/><path d="M2.5 20c.6-4 3.2-6 6.5-6s5.9 2 6.5 6z" fill="#fff"/><circle cx="17" cy="9" r="2.6" fill="rgba(255,255,255,.7)"/><path d="M15.6 13.4c3 .1 5.2 2 5.9 5.6h-4.6" fill="rgba(255,255,255,.7)"/></svg>',
    motor: '<svg viewBox="0 0 24 24"><path d="M3 10h2.5V8H8V6h6v2h2.5l2 2H21v6h-2.5l-2 2.5H8.5L5.5 16H3z" fill="#fff"/></svg>',
    tyre: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="3.4"/><circle cx="12" cy="12" r="3.4" fill="#fff"/></svg>',
    brake: '<svg viewBox="0 0 24 24"><circle cx="11" cy="13" r="8" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="11" cy="13" r="2.6" fill="#fff"/><path d="M15 3.5a9.5 9.5 0 0 1 6 6.5" fill="none" stroke="#ff5145" stroke-width="3.2" stroke-linecap="round"/></svg>',
    wing: '<svg viewBox="0 0 24 24"><path d="M2 7h20l-2.5 4H4.5z" fill="#fff"/><path d="M7 11v7M17 11v7" stroke="#fff" stroke-width="2.4"/><path d="M4 19h16" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
    cog: '<svg viewBox="0 0 24 24"><path d="M10.3 2h3.4l.5 2.6 1.8.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.8 2.6.5v3.4l-2.6.5-.8 1.8 1.5 2.2-2.4 2.4-2.2-1.5-1.8.8-.5 2.6h-3.4l-.5-2.6-1.8-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.8L2 13.7v-3.4l2.6-.5.8-1.8-1.5-2.2 2.4-2.4 2.2 1.5 1.8-.8z" fill="#fff"/><circle cx="12" cy="12" r="3.6" fill="#4a505c"/></svg>',
    podium: '<svg viewBox="0 0 26 26"><path d="M9 6h8v17H9zM1.5 12h7.5v11H1.5zM17 15h7.5v8H17z" fill="#fff"/><path d="M13 1.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z" fill="#ffc629"/></svg>',
    wifi: '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M2.5 9a14 14 0 0 1 19 0M5.8 12.4a9.3 9.3 0 0 1 12.4 0M9 15.7a4.6 4.6 0 0 1 6 0" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="19.3" r="1.7" fill="#fff"/></svg>',
    key: '<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="8" cy="12" r="4.5" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M12.5 12H21M18 12v3.5M21 12v2.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
    bolt2: '<svg width="26" height="26" viewBox="0 0 22 24"><path d="M13 1.5 3.5 14h6.5l-1.5 8.5L19 10h-6.8z" fill="#fff"/></svg>',
    rain: '<svg width="22" height="24" viewBox="0 0 24 24"><path d="M6.5 15a4.5 4.5 0 0 1 .7-8.9A6 6 0 0 1 18.4 8 3.6 3.6 0 0 1 18 15z" fill="#fff"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" stroke="#3fd0ff" stroke-width="2" stroke-linecap="round"/></svg>',
    watch: '<svg width="22" height="24" viewBox="0 0 24 24"><circle cx="12" cy="14" r="8" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 14V9.4" stroke="#3fd0ff" stroke-width="2.2" stroke-linecap="round"/><path d="M9.4 2.6h5.2M12 2.6v3.2M18.6 6.4l1.6-1.6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  Object.assign(I, {   // (the career's four cards, the title's small buttons)
    medalBig: '<svg class="bigcup" viewBox="0 0 32 32" aria-hidden="true"><path d="M9 2h5l2 7h-5zM23 2h-5l-2 7h5z" fill="#3fd0ff"/><circle cx="16" cy="20" r="9" fill="#ffc629" stroke="#8a6200" stroke-width=".9"/><path d="M16 14.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#8a6200"/></svg>',
    wheelBig: '<svg class="bigcup" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="#fff" stroke-width="3.4"/><circle cx="16" cy="16" r="3.4" fill="#ffc629"/><path d="M16 19.4V28M12.9 14.4 5 12M19.1 14.4 27 12" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    starBig: '<svg class="bigcup" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3l3.6 7.5 8.2 1-6 5.6 1.6 8.1L16 21.2 8.6 25.2l1.6-8.1-6-5.6 8.2-1z" fill="#ffc629" stroke="#8a6200" stroke-width=".9"/></svg>',
    expand: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    flask: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 3h7M10 3v6.2L4.8 18.4A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.6L14 9.2V3" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.4 15.2h9.2" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
  });

  /* ---------------- the game's tracks as the menu shows them ---------------- */
  const MODES = D.modes.concat([{ id: 'duel', name: 'Traffic duel', sub: 'One rival, real traffic on the open road.', chip: '1 RIVAL · TRAFFIC', img: 'assets/menu/multiplayer.webp' },
    { id: 'elim', name: 'Elimination', sub: 'Every 30 s the last cars are out.', chip: 'LAST ONE LEFT', img: 'assets/menu/mode-race.webp' },
    { id: 'pursuit', name: 'Pursuit', sub: 'Drive the patrol car, catch the fugitive.', chip: 'CATCH IN 3:00', img: 'assets/menu/mode-chase.webp' },   // (Zabava: docs/zabava.md)
    { id: 'endless', name: 'Endless traffic', sub: 'Ever denser traffic. Close passes add time.', chip: 'ONE TOUCH ENDS IT', img: 'assets/menu/mode-endless.webp' },   // (docs/neskoncna-voznja.md)
    { id: 'drag', name: 'Drag race', sub: '402 m from a standstill, you shift the gears.', chip: '1 RIVAL · 402 M', img: 'assets/menu/mode-trial.webp' }]);   // (Zabava, the drag race: docs/drag-dirka.md)
  const GAME_MODE = { race: 'race', chase: 'police', trial: 'tt', duel: 'traffic', elim: 'elim', pursuit: 'lov', endless: 'endless', drag: 'drag' }, MENU_MODE = { race: 'race', police: 'chase', tt: 'trial', traffic: 'duel', elim: 'elim', lov: 'pursuit', endless: 'endless', drag: 'drag' };
  const W_SET = ['dry', 'rain', 'random', 'change'];   // (the rain over the picture: none, falling, coming and going; Changing the same, slower)
  // the first sentences of the game's description of a track (the card has room for about two lines)
  const shortDesc = (s) => { s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= 130) return s; const m = /^(.{40,130}?[.!?])(\s|$)/.exec(s); if (m) return m[1]; const c = s.slice(0, 130).search(/[,;:][^,;:]*$/); return c > 50 ? s.slice(0, c) + '.' : s.slice(0, 127).replace(/\s+\S*$/, '') + '…'; };
  let TR = [];
  // every track in one list: the real ones from the shortest to the longest, then the ones awaiting the user's choice (pending: true, one of
  // them stays a real track, the others become test tracks; until then real ones in the game, only the menu shows them apart), then the
  // test tracks, each group the same way (equal lengths: by id). The lengths are the menu's table (MENU.lens, tools/menu-lens.js): building
  // every track to measure it would take seconds on a phone
  const lenOf = (d) => (D.lens || {})[d.id] || 0;
  function buildTracks() {
    const gr = (d) => d.test ? 'test' : (d.rally || d.descent) ? 'rally' : d.open ? 'road' : 'circuit';
    TR = G.defs().filter(d => !d.variantOf).map(d => {
      const en = d.en || {}, full = en.name || d.name, k = full.lastIndexOf(', ');
      const t = { id: d.id, def: d, name: k > 0 ? full.slice(0, k) : full, country: k > 0 ? full.slice(k + 2) : '', desc: shortDesc(en.desc || d.desc), group: gr(d), test: !!d.test,
        modes: G.modesOf ? G.modesOf(d) : d.modes ? d.modes.slice() : d.timeTrial ? ['tt'] : ['race'], trial: !!d.timeTrial, tag: ({ circuit: 'CIRCUIT', road: 'OPEN ROAD', rally: 'RALLY', test: 'TEST' })[gr(d)] };
      Object.defineProperties(t, {
        km: { get() { if (lenOf(d)) return lenOf(d) / 1000; const T = G.track(d.id); return (d.open ? T.raceLen : T.len) / 1000; } },
        corners: { get() { const n = (D.ncorners || {})[d.id]; return n != null ? n : G.track(d.id).corners.length; } },   // (the real tracks': MENU.ncorners, tools/menu-lens.js)
        laps: { get() { return d.open ? 1 : G.lapsOf(d); } },
        rec: { get() { return G.record(d); } },
      });
      return t;
    });
    const rank = (t) => t.test ? 2 : t.def.pending ? 1 : 0;
    TR.sort((a, b) => (rank(a) - rank(b)) || (lenOf(a.def) - lenOf(b.def)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }
  const trackById = (id) => TR.find(t => t.id === id);
  /* NEUPORABNO (CLAUDE.md, »Pred izidom: NEUPORABNO«; the user's decisions of 9. 11. 2026): what does not go into version 1.0 waits behind the
     title's NEUPORABNO button (nuSheet): the test tracks and the ones awaiting the user's choice (pending), the missions, the two cups of test
     tracks and NEW VERSION · TEST 1. Everywhere else the menu shows the real tracks only (the title, the track step, the quick list, the Earth).
     A hidden track chosen there opens the track step of the hidden tracks (nuOn): its list, its quick list (NEUPORABNO again), its Earth */
  const hidden = (t) => !!t && (t.test || !!t.def.pending);
  let nuOn = false;
  // the track the game stands on; a hidden one only behind NEUPORABNO (else the first real track: a new player's, js/game.js firstTrackId)
  const gameTrack = () => { const c = trackById(G.baseId(G.S.track)); return c && (!hidden(c) || nuOn) ? c : TR.find(t => !hidden(t) && inMode(t)) || TR.find(t => !hidden(t)) || TR[0]; };   // (the mode's first real one)
  const carImg = (m, ci) => 'assets/cars/img/' + m.id + '-' + ci + '.webp';
  const HAS_CAR_IMG = ['kaze', 'vortex', 'pico', 'strega', 'rally', 'formula'];
  const shownId = (t) => t.id === 'pikes' && G.S.pkRoad === 'pikesg' ? 'pikesg' : t.id;
  const trackImg = (t, wet) => 'assets/tracks/' + shownId(t) + (wet ? '-rain' : '') + '.webp';
  const dio = (t) => '<div class="dio"><div class="isl" style="animation-delay:-' + Math.round(performance.now() % 5000) + 'ms">' +
    '<img src="' + trackImg(t) + '" alt="3D model of the ' + esc(t.name) + ' track"><img class="wet" src="' + trackImg(t, true) + '" alt=""></div></div>';
  const weatherIdx = () => { const w = G.S.weather; return w === 'rain' || w === 'storm' ? 1 : w === 'random' ? 2 : w === 'change' ? 3 : 0; };
  const modeOf = (id) => MODES.find(m => m.id === id) || MODES[0];
  const money = () => G.career() ? G.career().money : null;

  /* ---------------- view state ---------------- */
  let screen = 'title', shown = '', titleSub = null, panelH = 0, mode = 'race', trackIdx = 0, cam = 1, sheet = null, sheetOn = false;
  // the camera the track step opens with (the player's choice, stran Odločitve m5: 1 until then): 1 the map, 2 the flyover, 3 the corner;
  // 0 the one chosen last (the setting menuCam). Back from a race or the garage it shows the one it had
  const CAM_OPEN = 1;
  const inMode = (t) => t.modes.includes(GAME_MODE[mode]);
  const TRACKS = () => TR.filter(t => inMode(t) && hidden(t) === nuOn);   // (the mode's real tracks, behind NEUPORABNO its hidden ones; the list goes round: after the last track the first again)
  const curTrack = () => TRACKS()[trackIdx] || null;
  const wxMode = () => G.S.season === 'winter' ? (weatherIdx() ? 'snow' : 'dry') : W_SET[weatherIdx()];   // (winter: the rain falls as snow)

  /* ---------------- the weather on the track model: the wet model fades in and rain falls; Random swaps between the two, Changing too, slower;
     in winter snow falls (a cold, light veil, the model dry) ---------------- */
  const wx = (function () {
    const cv = document.createElement('canvas'); cv.className = 'rainfx'; cv.setAttribute('aria-hidden', 'true');
    const ctx = cv.getContext('2d'), calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let drops = [], flakes = [], raf = 0, a = 0, want = 0, last = 0, W = 0, H = 0, dpr = 1, timer = 0, wet = false, mode = '', snow = false;
    function fit() {
      const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!r.width || (r.width === W && r.height === H)) return;
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      drops = Array.from({ length: Math.round(W * H / 1000) }, () => ({ x: Math.random() * (W + 60) - 60, y: Math.random() * H, l: 14 + Math.random() * 18, v: 640 + Math.random() * 400, o: 0.35 + Math.random() * 0.45 }));
      flakes = Array.from({ length: Math.round(W * H / 1800) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2, v: 30 + Math.random() * 40, p: Math.random() * 6.3, w: 0.5 + Math.random() * 1.2 }));
    }
    function frame(t) {
      raf = 0; const el = last ? (t - last) / 1000 : 0.016, dt = Math.min(0.05, el); last = t;   // (the fade follows the clock, the drops a capped step)
      a = want > a ? Math.min(want, a + el / 0.5) : Math.max(want, a - el / 0.5);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      if (a > 0 && snow) {   // (the snow: a light veil, the flakes drifting down, the big ones nearer and faster)
        ctx.fillStyle = 'rgba(214, 226, 242, ' + (0.16 * a).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff';
        for (const f of flakes) {
          f.y += f.v * (0.55 + f.r / 3.5) * dt; f.p += f.w * dt; f.x += Math.sin(f.p) * 16 * dt;
          if (f.y - f.r > H) { f.y = -f.r - Math.random() * 20; f.x = Math.random() * W; }
          ctx.globalAlpha = a * Math.min(1, 0.5 + f.r / 5); ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (a > 0) {
        ctx.fillStyle = 'rgba(14, 22, 34, ' + (0.26 * a).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);   // (the overcast: the streaks show on a light map too)
        ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        for (const d of drops) {
          d.y += d.v * dt; d.x += d.v * dt * 0.22;
          if (d.y - d.l > H) { d.y = -Math.random() * 30; d.x = Math.random() * (W + 60) - 60; }
          ctx.strokeStyle = 'rgba(232, 240, 255, ' + (d.o * a).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * 0.22, d.y - d.l); ctx.stroke();
        }
      }
      if (a > 0 || want > 0) raf = requestAnimationFrame(frame); else last = 0;
    }
    function show(on) {
      wet = on; want = on && !calm ? 1 : 0;
      if (cv.parentNode) { cv.parentNode.classList.toggle('rainy', on && !snow); cv.parentNode.classList.toggle('snowy', on && snow); }
      if (!raf && (want || a)) raf = requestAnimationFrame(frame);
    }
    return {
      // after a render of the track screen (mode 'dry' | 'rain' | 'random' | 'change' | 'snow'): the new stage starts in the weather shown
      // before, so a change fades over; on entering the screen it starts in its own weather
      attach(stage, m, entering) {
        snow = m === 'snow';
        if (entering) { wet = m === 'rain' || snow; a = wet && !calm ? 1 : 0; }
        stage.classList.toggle('rainy', wet && !snow); stage.classList.toggle('snowy', wet && snow);   // (before anything measures the new stage, so the weather already shown does not fade in again)
        (stage.querySelector('.dio') || stage.querySelector('video')).after(cv); fit();   // (over the picture, under the names: the track screen's diorama or map, the intro's video)
        if (m !== mode || entering) { clearInterval(timer); timer = 0; mode = m; if (m === 'random' || m === 'change') timer = setInterval(() => show(!wet), m === 'change' ? 4200 : 2600); }
        void stage.offsetWidth;
        show(m === 'rain' || snow ? true : m === 'dry' ? false : wet);
      },
      detach() { clearInterval(timer); timer = 0; mode = ''; want = 0; a = 0; wet = false; snow = false; cv.remove(); if (raf) { cancelAnimationFrame(raf); raf = 0; } last = 0; },
      resize() { if (cv.parentNode) { W = 0; fit(); } },
    };
  })();

  /* ---------------- rendering helpers ---------------- */
  const coins = (x) => num(x) + ' coins';   // (the money is coins: the coin in the pill, the word in a text; no €)
  const moneyPill = () => money() == null ? '' : '<div class="money">' + I.coin + '<span>' + num(money()) + '</span></div>';

  /* ---------------- main menu ---------------- */
  function vTitle() {
    const t = gameTrack(), md = modeOf(MENU_MODE[G.modeOf(t.def)] || 'race');
    const best = t.rec[1] !== '—' ? t.rec[1] : '';
    let h = '<section class="scr" id="s-title" aria-label="Main menu"><div class="scrim"></div>';
    h += '<div class="t-top"><h1 class="logo small"><span class="l1">' + esc(D.game.l1) + '</span><span class="l2">' + esc(D.game.l2) + '</span></h1><div class="t-me">' + moneyPill() + '</div></div>';
    h += '<div class="t-menu title-panel' + (titleSub ? ' sub' : '') + '">';
    const subHead = (title, sub) => '<div class="t-subhead"><button class="sq" data-act="tsub:" aria-label="Back to the main menu">' + I.back + '</button><div><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></div></div>';
    const card = (cls, act, cur, name, sub, chip, im) => '<button class="mode ' + cls + '" aria-current="' + cur + '" data-act="' + act + '"><span class="tx"><b>' + esc(name) + '</b><small>' + esc(sub) + '</small>' + (chip ? '<em class="chip">' + esc(chip) + '</em>' : '') + '</span><span class="im">' + im + '</span><i class="tick" aria-hidden="true">' + I.check + '</i></button>';
    if (titleSub === 'single') {
      h += subHead('Single race', 'Choose a mode') + '<div class="t-sub' + (MODES.length > 4 ? ' many' : '') + '">' + MODES.map(m => card('m-' + m.id, 'mode:' + m.id, mode === m.id, m.name, m.sub, m.chip, '<img src="' + m.img + '" alt="">')).join('') + '</div>';
    } else if (titleSub === 'career') {
      const c = G.career(), ch = G.champ();
      const four = [
        ['garage', 'career', c ? 'Career garage' : 'Career', c ? 'Prize money buys cars and upgrades. ' + coins(c.money) + ' to spend.' : 'Win prize money, buy cars and upgrades.', c ? c.cars + ' CARS' : 'NOT STARTED', I.bigcup],
        ['champ', 'champ', 'Championships', 'A series of races with points.', ch ? ch.chip : 'PICK A SERIES', I.medalBig],
        ['school', 'school', 'Driving school', 'Four lessons with medals.', G.schoolChip(), I.wheelBig],
        ['stats', 'stats', 'Achievements', 'Your numbers and what you have unlocked.', G.statsChip(), I.starBig],
      ];
      h += subHead('Career', 'Four ways to play') + '<div class="t-sub four">' + four.map(f => card('cm-' + f[0], 'game:to-' + f[1], false, f[2], f[3], f[4], f[5])).join('') + '</div>';
    } else {
      h += '<button class="tile t-single" data-act="single"><span class="tx"><b>SINGLE RACE</b><small>' + esc(t.name + ' · ' + md.name) + '</small>' + (best ? '<em class="chip">BEST ' + esc(best) + '</em>' : '<em class="chip gold">NEW TRACKS INSIDE</em>') + '</span>' +
        '<span class="im"><img src="' + trackImg(t, weatherIdx() === 1) + '" alt=""></span></button>';
      h += '<button class="tile t-multi" data-act="game:to-online"><span class="tx"><b>MULTIPLAYER</b><small>Race friends online</small></span><span class="im"><img src="assets/menu/multiplayer.webp" alt=""></span></button>';
      h += '<button class="tile t-career" data-act="career"><span class="tx"><b>CAREER</b><small>' + (G.career() ? coins(G.career().money) + ' · ' : '') + 'Garage, championships, school</small></span><span class="im">' + I.bigcup + '<img src="assets/menu/career.webp" alt=""></span></button>';
      // the small buttons in one grid: NEUPORABNO (what does not go into version 1.0: nuSheet) the grid's width upright, on its side one cell
      // of it (no row more on a low screen); Settings, Leaderboard, then Full screen and Install
      const ex = []; if (G.fsAvailable()) ex.push('<button class="tsmall" data-act="game:fullscreen">' + I.expand + '<span>Full screen</span></button>'); if (G.installAvailable()) ex.push('<button class="tsmall" data-act="game:install">' + I.plus + '<span>Install the game</span></button>');
      h += '<div class="t-row"><button class="tsmall t-nu" data-act="nu" aria-haspopup="dialog">' + I.flask + '<span>NEUPORABNO</span><small>Pending, test, missions, new version</small></button><button class="tsmall" data-act="game:to-settings">' + I.cog + '<span>Settings</span></button><button class="tsmall" data-act="game:to-board">' + I.podium + '<span>Leaderboard</span></button>' + ex.join('') + '</div>';
      if (G.chal()) h += '<button class="mbtn gold buy" data-act="game:to-chal"><span>Challenge from a friend</span><small>Beat their time on the same track</small></button>';
      h += forcedDark() ? '<div class="t-links"><button class="tlink" data-act="credits">Credits</button><button class="tlink" data-act="dark-tip">Colours too dark?</button></div>' : '<button class="tlink" data-act="credits">Credits</button>';
    }
    h += '</div></section>';
    return h;
  }

  /* ---------------- the stage's three cameras (the buttons at its top left) ----------------
     1 the map from above (routes.js) to the stage's edges, nothing over the route but its flags; 2 the flyover video: the route drawn in
       the game's world behind the point running along it (green on the flat, red where it climbs steeply), only its start and finish
       named, the height graph across the stage's foot; 3 the corner camera: a still camera at the track's most interesting corner, the
       game's cars racing through it, a short video in a loop (tools/menu-corner.mjs: MENU.corners). A track without the camera's picture
       shows its model, the picture of its land (stran Odločitve, question 5). (The helicopter's flight over the track is the intro before
       the race: beforeRace) */
  const isRoute = (t) => !!t && !!RT[t.id];
  const pathD = (pts) => 'M' + pts.map(p => p[0] + ' ' + p[1]).join('L');
  // a height of the world as a real one: scaled between the real start and finish where they are known (routeMaps alt), else the height
  // at the start (routeMaps base) and the world's rise and fall from there
  const altOf = (R, M, h) => M.alt ? M.alt[0] + (h - R.prof[0]) * (M.alt[1] - M.alt[0]) / ((R.prof[R.prof.length - 1] - R.prof[0]) || 1) : M.base != null ? M.base + h - R.prof[0] : null;
  const flagSvg = (fin) => fin ? '<g class="fl fin"><path d="M0 0V-26" /><rect x="0" y="-26" width="16" height="11"/><path class="ck" d="M0-26h4v3.7h-4zM8-26h4v3.7h-4zM4-22.3h4v3.6h-4zM12-22.3h4v3.6h-4zM0-18.7h4v3.7h-4zM8-18.7h4v3.7h-4z"/></g>'
    : '<g class="fl"><path d="M0 0V-26"/><path class="fg" d="M0-26h16l-4 5.5 4 5.5H0z"/></g>';
  function mark(x, y, name, sub, fin, cls) {   // a flag on the map and its name (with a dark edge round the letters: readable on any land)
    return '<g class="mk ' + (cls || '') + '" transform="translate(' + x + ' ' + y + ')"><circle r="6"/>' + flagSvg(fin) + '<text x="' + (fin ? -6 : 6) + '" y="-32" text-anchor="' + (fin ? 'end' : 'start') + '">' + esc(name) + (sub ? '<tspan class="sub" x="' + (fin ? -6 : 6) + '" dy="-20">' + esc(sub) + '</tspan>' : '') + '</text></g>';
  }
  function marks(R, M, pts, rally) {   // the start and the finish (a closed track: one flag)
    const a = pts[0], b = pts[pts.length - 1], A = M.alt;
    return R.open ? mark(a[0], a[1], M.start || 'Start', A ? num(A[0]) + ' m' : rally ? 'SS start' : '', false, 's') + mark(b[0], b[1], M.finish || 'Finish', A ? num(A[1]) + ' m' : '', true, 'f') : mark(a[0], a[1], 'Start · finish', '', false, 's');
  }
  function routeLines(id, pts, rally) {   // the route drawn on, then a glowing point running along it at an even pace (its glow a gradient: cheap to move)
    const d = pathD(pts), c = rally ? ['#fff0dc', '#ffffff'] : ['#ffe07a', '#ffd23a'];
    return '<defs><radialGradient id="rg-' + id + '"><stop offset="0" stop-color="#fff8d0"/><stop offset=".35" stop-color="' + c[0] + '" stop-opacity=".75"/><stop offset="1" stop-color="' + c[1] + '" stop-opacity="0"/></radialGradient></defs>' +
      '<path class="rt-o" d="' + d + '"/><path class="rt" id="rt-' + id + '" d="' + d + '" pathLength="1"/>' + (rally ? '<path class="rt-c" d="' + d + '"/>' : '') +
      '<g class="rt-dot" opacity="0"><g class="dz"><circle r="30" fill="url(#rg-' + id + ')"/><circle class="c" r="9"/></g><set attributeName="opacity" to="1" begin="1.6s"/>' +
      '<animateMotion dur="' + (rally ? 11 : 15) + 's" begin="1.6s" repeatCount="indefinite"><mpath href="#rt-' + id + '"/></animateMotion></g>';
  }
  function splitMarks(pts) {   // a rally stage (a circuit: its sectors): the two split times at a third and two thirds of it
    return [1, 2].map(k => { const p = pts[Math.round((pts.length - 1) * k / 3)]; return '<g class="sp" transform="translate(' + p[0] + ' ' + p[1] + ')"><rect x="-15" y="-15" width="30" height="30" rx="6"/><text y="6" text-anchor="middle">S' + k + '</text></g>'; }).join('');
  }
  // a video of the track screen or of the flight before a race (assets/maps/: fly-, corner-, heli-<id>.webm). A pull request's preview on the
  // site (beta/<number>/, tools/predogled.mjs) has no copy of a video that is the same file as main's: MENU.mainVideos, written by that tool,
  // names those files and the way to the site's root, and main's own plays (tests/predogled.test.js)
  const vidSrc = (f) => { const V = D.mainVideos; return (V && V.files && V.files.indexOf(f) >= 0 ? V.root : '') + 'assets/maps/' + f; };
  function flyView(t, lockd) {
    return '<div class="dio fly' + (lockd ? ' lock' : '') + '" data-route="' + t.id + '"><video muted loop playsinline preload="auto" poster="assets/maps/fly-' + t.id + '.webp" src="' + vidSrc('fly-' + t.id + '.webm') + '"></video><div class="flab" aria-hidden="true"></div></div>';
  }
  const hasCorner = (t) => !!t && (D.corners || []).includes(t.id);
  function cornerView(t, lockd) {
    return '<div class="dio corner' + (lockd ? ' lock' : '') + '" data-corner="' + t.id + '"><video muted loop playsinline preload="auto" poster="assets/maps/corner-' + t.id + '.webp" src="' + vidSrc('corner-' + t.id + '.webm') + '" aria-label="' + esc(D.cams[2].name) + ': ' + esc(t.name) + '"></video></div>';
  }
  // camera 3: its video plays from the start (the poster, its first frame, shows until it can)
  function cornerOn() {
    const v = app && $('#track-stage .dio.corner video', app); if (!v || v.__on) return;
    v.__on = 1;
    const go = () => { try { v.currentTime = 0; } catch (_) { /* not seekable yet */ } const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    if (v.readyState >= 2) go(); else v.addEventListener('loadeddata', go, { once: true });
  }
  // An open road is drawn running up the screen, its start at the bottom and its finish at the top. The routes are laid out lengthwise
  // (start left, finish right), so the map is turned by the quarter turn that puts the finish above the start (-90 for those).
  // A circuit or a rally stage is not turned (its start and finish are one place or a stage's own).
  const turnOf = (t, R) => {
    const p = R.top.route, a = p[0], b = p[p.length - 1];
    if (t.group !== 'road' || !R.open) return 0;
    const q = Math.round((-90 - Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI) / 90) * 90;
    return ((q % 360) + 540) % 360 - 180;
  };
  // The map's layers. The game draws only a strip of detailed world (the "isle") round the road, on a made-up smooth land; where a track has
  // a wide map (D.wideMaps: the margin in the map's pixels) the isle is put, with a soft edge, over the real land painted from the real
  // heights and land cover (wide-<id>.webp, a margin all round the map), so the map goes on to every edge of the frame with the real land
  // (wide_map.py). Otherwise the map as it is, and the blurred copy of it behind.
  function mapLayers(t, T) {
    const E = (D.wideMaps || {})[t.id], id = t.id, W = T.W, H = T.H, A = 'assets/maps/';
    if (!E) return { bg: A + 'top-' + id + '.webp', html: '<image href="' + A + 'top-' + id + '.webp" width="' + W + '" height="' + H + '"/><image class="wet" href="' + A + 'top-' + id + '-rain.webp" width="' + W + '" height="' + H + '"/>' };
    const land = (wet) => '<image class="land' + (wet ? ' wet' : '') + '" href="' + A + 'wide-' + id + (wet ? '-rain' : '') + '.webp" x="' + -E + '" y="' + -E + '" width="' + (W + 2 * E) + '" height="' + (H + 2 * E) + '" preserveAspectRatio="none"/>';
    const isle = (wet) => '<image class="isle' + (wet ? ' wet' : '') + '" href="' + A + 'isle-' + id + (wet ? '-rain' : '') + '.webp" width="' + W + '" height="' + H + '" preserveAspectRatio="none"/>';
    return { bg: A + 'wide-' + id + '.webp', html: land(0) + land(1) + isle(0) + isle(1) };
  }
  function topView(t, R, M, lockd) {   // the whole map to the stage's edges (fitMaps: the route as big as fits)
    const T = R.top, pts = T.route, rally = t.group === 'rally', turn = turnOf(t, R), L = mapLayers(t, T);
    // a soft, blurred copy of the map fills the stage behind the fitted map (beyond even the wide map), so nothing is ever left empty;
    // everything on the map is in g.rot, which fitMaps turns (an open road) about the middle of the map
    return '<div class="dio topmap' + (rally ? ' rally' : '') + (lockd ? ' lock' : '') + '" data-map="' + t.id + '"' + (turn ? ' data-turn="' + turn + '"' : '') + '><div class="mapbg" style="background-image:url(' + L.bg + ')"></div><svg class="mapsvg" viewBox="0 0 ' + T.W + ' ' + T.H + '" preserveAspectRatio="xMidYMid slice" aria-label="Map of ' + esc(t.name) + '"><g class="rot">' +
      L.html + routeLines(t.id, pts, rally) + (t.group !== 'road' ? splitMarks(pts) : '') + marks(R, M, pts, rally) + '</g></svg><div class="mlab" aria-hidden="true"></div></div>';
  }
  // the cameras' icons (the mockup's, docs/meni-izbira-proge.md »Zadnje odločitve«): 1 a frame with a road in it, 2 a mountain's line and a
  // flag (the flyover), 3 a video camera, 4 two people (the friends' times)
  const CAM_ICON = [null,
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 17c2-3 1-6 4-8s4-1 5-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 21l7-6.5 3 3 4-4.5 6 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 3.5l9 3.8-9 3.8 2-3.8z" fill="currentColor"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="13" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 11l5-3v8l-5-3z" fill="currentColor"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.4" fill="currentColor"/><path d="M2.5 20c.6-4 3.2-6 6.5-6s5.9 2 6.5 6z" fill="currentColor"/><circle cx="17" cy="9" r="2.6" fill="currentColor" opacity=".7"/><path d="M15.6 13.4c3 .1 5.2 2 5.9 5.6h-4.6" fill="currentColor" opacity=".7"/></svg>'];
  // (camera 4, Friends: only where the game has the friends' leaderboard, G.friends; vTrack's fr)
  const camButtons = () => '<div class="cams' + (fr ? ' four' : '') + '" role="group" aria-label="Camera">' + D.cams.filter(x => x.n !== 4 || fr).map(x => '<button aria-pressed="' + (cam === x.n) + '" data-act="cam:' + x.n + '" aria-label="' + esc(x.name) + '" title="' + esc(x.name) + '">' + CAM_ICON[x.n] + '</button>').join('') + '</div>';
  // the stage: the sky, the chosen camera's picture (or the model), the cameras (at its bottom right)
  function stageView(t, lockd) {
    const R = RT[t.id], M = D.routeMaps[t.id] || {};
    const pic = cam === 4 && fr ? friendsView(t) : cam === 1 && R ? topView(t, R, M, lockd) : cam === 2 && R && R.fly ? flyView(t, lockd) : cam === 3 && hasCorner(t) ? cornerView(t, lockd) : dio(t);
    return '<div class="sky" aria-hidden="true"><i class="sun"></i><i class="cloud"></i></div>' + pic + camButtons();
  }
  // camera 4, Friends (Lestvica prijateljev, docs/lestvica-prijateljev.md): the friends' times on the track in the way it is driven now
  // (G.friends: the place, the nickname, the car, the time, the gap; the player's row lit), Send my times under them; none yet: a line
  // that says so. It stays chosen while the tracks are leafed through (cam), track by track
  let fr = null;   // the friends' times of the track shown (vTrack: G.friends), null where the game has none
  function friendsView(t) {
    const F = fr, rows = F.rows || [];
    const tab = F.n ? '<div class="ftab"><table aria-label="Friends\' times on ' + esc(t.name) + '"><thead><tr><th>#</th><th>Driver</th><th>Car</th><th>Time</th><th>Gap</th></tr></thead><tbody>' +
      rows.map(r => '<tr' + (r.me ? ' class="me"' : '') + '><td>' + r.at + '</td><td class="nm">' + esc(r.name) + '</td><td class="nm">' + esc(r.car || '–') + '</td><td>' + esc(r.time) + '</td><td>' + esc(r.gap) + '</td></tr>').join('') + '</tbody></table></div>'
      : '<div class="fnone"><b>No friends\' times on ' + esc(t.name) + ' yet</b>' + (F.friends ? '' : '<small>Send your times to friends. When they send theirs back, they show up here.</small>') + '</div>';
    return '<div class="dio friends" data-friends="' + t.id + '">' + tab + '<button class="fsend" data-act="send-times">Send my times</button></div>';
  }
  // the box (x0, y0, x1, y1) of a route in the map's pixels, with the map turned by a degrees about its middle (0: as drawn)
  function routeBox(T, a) {
    const key = a ? 'bb' + a : 'bb';
    if (!T[key]) {
      const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), mx = T.W / 2, my = T.H / 2;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of T.route) { const dx = p[0] - mx, dy = p[1] - my, x = mx + dx * c - dy * s, y = my + dx * s + dy * c; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      T[key] = [x0, y0, x1, y1];
    }
    return T[key];
  }
  // the map from above: the whole route (start to finish) as big as fits the frame (not blurred), the route's line, flags and point the same
  // size on the screen however far the map is zoomed. An open road is turned to run up the frame (start at the bottom, finish at the top)
  // when the frame is not much wider than it is tall; in a wide, short frame it would shrink to a sliver, so there it lies along the frame
  const NAME_ROOM = 66;   // (px over the route's top: its flag (13 px over the point) and the name over it (43 px with its height under it))
  const NAME_ROOM_LAND = 40;   // (on its side: the carousel's card is small, the name may go beside its flag: mapLabels)
  function fitMaps() {
    if (!app) return;   // (the old menu is on: the menu is not built, and a window that changes its size must not stumble on it)
    for (const box of app.querySelectorAll('.dio.topmap[data-map]')) {   // (the track screen's maps: the intro's is fitted by fitIntroMap)
      const T = RT[box.dataset.map].top, svg = $('svg', box), W = box.clientWidth, H = box.clientHeight;
      if (!W || !H) continue;
      const turn = +box.dataset.turn || 0, a = turn && W / H < 1.3 ? turn : 0, rg = $('g.rot', svg), bg = $('.mapbg', box);
      if (rg) { if (a) rg.setAttribute('transform', 'rotate(' + a + ' ' + T.W / 2 + ' ' + T.H / 2 + ')'); else rg.removeAttribute('transform'); }
      if (bg) bg.style.transform = a ? 'rotate(' + a + 'deg) scale(' + (Math.max(W / H, H / W) * 1.06).toFixed(3) + ')' : '';   // (the blurred backdrop turns with the map)
      // the route is centred in what the screen's own things leave of the picture (keepOut: the head over it, the weather down its right
      // side, the counter and the cameras at its foot), with room at the top for the finish's name over its flag (NAME_ROOM); where the
      // track has the real land painted round its map (D.wideMaps: E, the land's margin) it reaches every edge of the picture: the map at
      // least as big as that takes, the view kept inside the land (the route a little off the middle, or a little bigger, where it must be);
      // otherwise the blurred backdrop fills whatever falls outside the map tile, so nothing is cropped or left empty
      const [x0, y0, x1, y1] = routeBox(T, a), rw = Math.max(1, x1 - x0), rh = Math.max(1, y1 - y0), K = keepOut(box), E = (D.wideMaps || {})[box.dataset.map] || 0;
      const padL = 10, padR = Math.max(10, K.right + 6), padTop = Math.max(10, K.top) + (isLand() ? NAME_ROOM_LAND : NAME_ROOM), padBot = Math.max(10, K.bottom + 6), availW = Math.max(60, W - padL - padR), availH = Math.max(60, H - padTop - padBot);
      const q = Math.abs(a) === 90, LW = (q ? T.H : T.W) + 2 * E, LH = (q ? T.W : T.H) + 2 * E;   // (the land turned with the map: a quarter turn swaps its sides)
      const s = Math.max(Math.min(availW / rw, availH / rh), E ? Math.max(W / LW, H / LH) : 0), k = 0.5 / s;
      const vw = W / s, vh = H / s, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      let vx = cx - (padL + availW / 2) / s, vy = cy - (padTop + availH / 2) / s;
      if (E) { const lx = T.W / 2 - LW / 2, ly = T.H / 2 - LH / 2; vx = Math.min(Math.max(vx, lx), lx + LW - vw); vy = Math.min(Math.max(vy, ly), ly + LH - vh); }
      svg.setAttribute('viewBox', vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1));
      svg.style.setProperty('--k', k.toFixed(3));
      const up = a ? ' rotate(' + (-a) + ')' : '';   // (the names stay upright on a turned map)
      for (const g of svg.querySelectorAll('.mk, .sp')) { if (!g.dataset.at) g.dataset.at = g.getAttribute('transform'); g.setAttribute('transform', g.dataset.at + up + ' scale(' + k.toFixed(3) + ')'); }
      for (const g of svg.querySelectorAll('.dz')) g.setAttribute('transform', 'scale(' + k.toFixed(3) + ')');
      mapLabels(box, svg);
    }
  }
  // what of the stage's picture the screen's own things cover (px in from its edges): the head over its top (upright: the screen's head lies
  // over the picture), the weather down its right side, the counter and the cameras at its foot
  function keepOut(box) {
    const b = box.getBoundingClientRect(), st = box.parentNode, hd = app && $('#s-track .thead', app), K = { top: 0, right: 0, bottom: 0 };
    const hit = (r) => !!r && r.width > 0 && r.bottom > b.top + 1 && r.top < b.bottom - 1 && r.right > b.left + 1 && r.left < b.right - 1;
    const hr = hd && hd.getBoundingClientRect(); if (hit(hr)) K.top = hr.bottom - b.top;
    const w = !isLand() && $(':scope > .wxv', st), wr = w && w.getBoundingClientRect(); if (hit(wr)) K.right = b.right - wr.left;   // (on its side: a row at the card's top, the route goes under it)
    for (const e of st.querySelectorAll(':scope > .cams, :scope > .tcount')) { const r = e.getBoundingClientRect(); if (hit(r)) K.bottom = Math.max(K.bottom, b.bottom - r.top); }
    return K;
  }
  // the names of the map's flags as the flyover's: the name in a box (the finish's dark), its height in a small gold box under it at the
  // right (the player's choice, 2. 11.); over the flag, a start's from its pole to the right and a finish's to the left, the other way
  // where it would run out of the frame. Made from the flags' own names (mark), placed where the flags stand on the screen
  function mapLabels(box, svg) {
    const lab = $('.mlab', box); if (!lab) return;
    const mks = [...svg.querySelectorAll('.mk')];
    if (lab.children.length !== mks.length) lab.innerHTML = mks.map(g => { const t = $('text', g), sub = $('tspan', t), name = t.firstChild && t.firstChild.nodeType === 3 ? t.firstChild.textContent : t.textContent;
      return '<div class="fl-s ' + (g.classList.contains('f') ? 'finish' : 'start') + '"><b>' + esc(name) + '</b>' + (sub ? '<small>' + esc(sub.textContent) + '</small>' : '') + '</div>'; }).join('');
    const fb = box.getBoundingClientRect(), W = fb.width;
    // the cameras' buttons, the weather, the height graph, the counter and (upright) the head lie over the picture: a name keeps out from under them
    const hd = $('#s-track .thead', app), over = [...box.parentNode.querySelectorAll(':scope > .cams, :scope > .wxv, :scope > .hgraph, :scope > .tcount')].concat(hd ? [...hd.children] : []);
    const keep = over.map(e => { const r = e.getBoundingClientRect(); return [r.left - fb.left - 4, r.right - fb.left + 4, r.top - fb.top - 4, r.bottom - fb.top + 4]; }).filter(k => k[1] > k[0] + 8 && k[3] > 0);
    const M = mks.map((g, i) => { const el = lab.children[i], f = $('.fl', g).getBoundingClientRect(); return { el, f, x: f.left - fb.left, w0: el.offsetWidth, h0: el.offsetHeight, right: g.classList.contains('f') }; });
    // every clear place of a name, in the order it is wanted: over the flag from its pole (a start's to the right, a finish's to the left),
    // else the other way, else slid along to the nearest clear place; with no clear place over it (the head or the graph just over the flag)
    // beside the flag, its top at the flag's; with none there either (on its side the weather's row over the top of the card) under the
    // flag; where a long name has no clear place at all (a narrow picture: between the cameras' buttons and the weather) a little smaller
    const places = ({ f, x, w0, h0, right }, K) => {
      const out = [];
      for (const s of [1, 0.86, 0.74]) {
        const w = w0 * s, h = h0 * s, y0 = Math.max(h + 2, f.top - fb.top - 3), y1 = Math.max(h + 2, f.top - fb.top + h), y2 = f.bottom - fb.top + 6 + h;   // (its bottom: over the flag, never above the frame; beside it; under it, clear of its point)
        const at = (r) => r ? x + f.width + 3 - w : x - 3, want = at(right), near = (a, b) => Math.abs(a - want) - Math.abs(b - want);
        const by = [Math.max(4, Math.min(W - 4 - w, want))].concat(...K.map(k => [k[1], k[0] - w]));
        const add = (y, ls) => ls.forEach(l => { if (l >= 4 && l + w <= W - 4 && !K.some(k => l < k[1] && l + w > k[0] && y - h < k[3] && y > k[2])) out.push([s, l, y, w, h]); });
        add(y0, [want, at(!right)]); add(y0, by.sort(near)); add(y1, [x - 3 - w, x + f.width + 3].sort(near));
        if (y2 <= fb.height - 2) add(y2, [want, at(!right)].concat(by).sort(near));
      }
      return out;
    };
    const rect = (a, m) => [a[1] - m, a[1] + a[3] + m, a[2] - a[4] - m, a[2] + m];   // (a place's box, as keep's: left, right, top, bottom)
    // the names one by one, each clear of what lies over the picture and of the names before it; where that can't be (a small card on its
    // side, the flags close) the two places clear of what lies over the picture that cover each other least
    const K = keep.slice();
    let plan = M.map(m => { const p = places(m, K)[0]; if (p) K.push(rect(p, 3)); return p; });
    if (plan.some(p => !p)) {
      const C = M.map(m => places(m, keep)), cover = (a, b) => { const A = rect(a, 2), B = rect(b, 2); return Math.max(0, Math.min(A[1], B[1]) - Math.max(A[0], B[0])) * Math.max(0, Math.min(A[3], B[3]) - Math.max(A[2], B[2])); };
      plan = C.map(c => c[0]);
      if (C.length === 2 && C[0].length && C[1].length) {
        let best = Infinity;
        C[0].forEach((a, i) => C[1].forEach((b, j) => { const v = cover(a, b) * 1e3 + i + j; if (v < best) { best = v; plan = [a, b]; } }));
      }
    }
    M.forEach(({ el, f, x, w0, h0, right }, i) => {
      // (clear nowhere: the smallest, inside the frame, over the flag)
      const s = 0.74, w = w0 * s, h = h0 * s, at1 = plan[i] || [s, Math.max(4, Math.min(W - 4 - w, right ? x + f.width + 3 - w : x - 3)), Math.max(h + 2, f.top - fb.top - 3)];
      el.style.scale = at1[0] < 1 ? at1[0] : '';   // (about its bottom left corner: .mlab .fl-s)
      el.style.left = at1[1].toFixed(1) + 'px'; el.style.top = at1[2].toFixed(1) + 'px';
    });
  }
  window.addEventListener('resize', ringFit);   // (on its side: the carousel's scale first, the maps fitted to it after)
  window.addEventListener('resize', fitMaps);
  // the flyover: the start's and the finish's names over it (each of its frames says where they are), a short dip at the loop
  let flyRaf = 0;
  function flyLabels() {
    cancelAnimationFrame(flyRaf); flyRaf = 0;
    const box = $('#track-stage .dio.fly', app); if (!box) return;
    const id = box.dataset.route, R = RT[id], F = R.fly, M = D.routeMaps[id] || {}, v = $('video', box), lab = $('.flab', box), L = R.len;
    const K = keepOut(box), foot = K.bottom + 8, top = K.top + 46;   // (no name under the head over the picture, nor under the counter and the cameras at its foot)
    // the flyover starts at its first frame (the point at the start), not wherever autoplay's clock reached while the video loaded: it is
    // played only once its first frame is ready (the poster, with the point at the start, shows until then), so the glowing point is at the
    // start the moment the flyover shows
    if (v && !v.__fly) {
      v.__fly = 1;
      const go = () => { try { v.currentTime = 0; } catch (_) { /* not seekable yet */ } const p = v.play(); if (p && p.catch) p.catch(() => {}); };
      if (v.readyState >= 2) go(); else v.addEventListener('loadeddata', go, { once: true });
    }
    const alt = M.alt ? M.alt.map(a => num(a) + ' m') : ['', ''];
    const tag = (cls, name, sub, icon) => '<div class="fl-' + cls + '">' + (icon || '') + '<b>' + esc(name) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
    const loop = !R.open, sub0 = alt[0] || (M.stage ? M.stage + ' start' : ''), sub1 = alt[1] || '';
    lab.innerHTML = tag('s start', loop ? 'Start · finish' : M.start || 'Start', sub0, flagSvg(false).replace('<g', '<svg viewBox="-2 -28 20 30" width="18" height="26"><g') + '</svg>') + tag('s finish', loop ? 'Finish' : M.finish || 'Finish', sub1, '<svg viewBox="-2 -28 20 30" width="18" height="26">' + flagSvg(true) + '</svg>');
    const els = [...lab.children];
    let last = 0, looped = false;
    const step = () => {
      if (!v.isConnected) return;
      // a short dip at the loop: the end fades out, the start fades back in (not the very first start: the poster shows there)
      const t = v.currentTime || 0, dur = v.duration; if (t < last - 1) looped = true; last = t;
      const op = isFinite(dur) && dur > 3 && !v.paused ? Math.max(0, Math.min(1, (dur - t) / 0.45, looped ? t / 0.45 : 1)) : 1;
      v.style.opacity = lab.style.opacity = op < 1 ? op.toFixed(2) : '';
      const f = F.frames[Math.min(F.frames.length - 1, Math.floor(t * F.fps))], W = box.clientWidth, H = box.clientHeight, k = Math.max(W / F.W, H / F.H), ox = (W - F.W * k) / 2, oy = (H - F.H * k) / 2;
      const put = (el, P, on) => { const y = P ? oy + P[1] * k : 0, vis = on && P && P[2] && P[0] > -40 && P[0] < F.W + 40 && P[1] > 0 && y > top && y < H - foot; el.style.opacity = vis ? 1 : 0; if (vis) el.style.transform = 'translate(' + (ox + P[0] * k).toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; };
      const d = f[0];
      put(els[0], f[1], d < L * 0.12); put(els[1], f[2], d > L * 0.8);
      flyRaf = requestAnimationFrame(step);
    };
    flyRaf = requestAnimationFrame(step);
  }

  /* ---------------- the height graph: the heights along the whole run, in a small frame under the back arrow, in every camera ----------------
     (docs/meni-izbira-proge.md »Zadnje odločitve«: as wide as the arrow, 0.6 of it high.) The part already driven (up to the glowing point)
     its line coloured by the climb, as the flyover's trail is (GRADE: 1 % green, 3 % light green, 5 % yellow, 7 % orange, 9 % red, from 12 %
     a deep red; downhill green), a strong yellow under it; the rest of the run a thin white line over a light yellow. The lowest point on
     the frame's bottom edge (at least 120 m of height in the frame, so a flat circuit stays low), the lowest height over it at the left, the
     highest at the right. Every track: the heights of routes.js (R.prof; the real ones by routeMaps, else from the start's height in geo.js),
     else of the menu's table (MENU.profs, tools/menu-lens.js). The climb is the game's own heights over its own distances (a shortened road,
     Pikes Peak, keeps its real gradients so). The point goes with the flyover's video, with the map's running point, or (the model of the
     land, the corner's camera) along the run at the map's pace */
  const GRADE = [[0.01, [47, 191, 74]], [0.03, [154, 209, 58]], [0.05, [255, 210, 58]], [0.07, [255, 138, 42]], [0.09, [232, 52, 42]], [0.12, [158, 20, 32]]];
  function gradeRgb(v) {
    if (v <= GRADE[0][0]) return GRADE[0][1];
    for (let i = 1; i < GRADE.length; i++) if (v <= GRADE[i][0]) { const a = GRADE[i - 1], b = GRADE[i], k = (v - a[0]) / (b[0] - a[0]); return a[1].map((c, j) => Math.round(c + (b[1][j] - c) * k)); }
    return GRADE[GRADE.length - 1][1];
  }
  // a track's heights along its run: L (m), G the game's heights (its climb), H the heights shown (above the sea where known: real; where the
  // menu's data has none, from the start's height in geo.js)
  function heightsOf(t) {
    const R = RT[t.id], M = D.routeMaps[t.id] || {}, g = window.GEO && GEO.tracks[t.id], z0 = g && g.start && g.start[2] != null ? g.start[2] : null;
    if (R) { const H = R.prof.map(h => altOf(R, M, h)); return H[0] != null ? { L: R.len, G: R.prof, H, real: true } : { L: R.len, G: R.prof, H: R.prof.map(h => (z0 || 0) + h - R.prof[0]), real: z0 != null }; }
    const P = (D.profs || {})[t.id]; if (!P) return null;
    const b = P.base != null ? P.base : z0 != null ? z0 - P.prof[0] : null;
    return { L: P.len, G: P.prof, H: P.prof.map(h => (b || 0) + h), real: b != null };
  }
  const withGraph = (t) => cam !== 4 && !!heightsOf(t);   // (every camera but the friends' times)
  // the graph in a frame W × Hh px: its svg, and where on it a fraction f of the run is
  function graphOf(t, W, Hh) {
    const P = heightsOf(t); if (!P || W < 40 || Hh < 20) return null;
    const H = P.H, G = P.G, n = H.length, lo = Math.min(...H), hi = Math.max(...H), step = P.L / (n - 1), span = Math.max(hi - lo, 120), yT = 18;
    const x = (f) => f * W, y = (h) => Hh - (h - lo) / span * (Hh - yT);
    const hAt = (f) => { const q = Math.min(n - 1, Math.max(0, f * (n - 1))), i = Math.min(n - 2, Math.floor(q)); return H[i] + (H[i + 1] - H[i]) * (q - i); };
    const line = 'M' + H.map((h, i) => x(i / (n - 1)).toFixed(1) + ' ' + y(h).toFixed(1)).join('L'), area = line + 'L' + W + ' ' + Hh + 'L0 ' + Hh + 'z';
    // the climb at each height (over about two of its steps, evened out a little) as its colour, a stop of the line's gradient
    const g = G.map((_, i) => { const a0 = Math.max(0, i - 1), b0 = Math.min(n - 1, i + 1); return (G[b0] - G[a0]) / ((b0 - a0) * step); });
    const stops = g.map((_, i) => { const v = (g[Math.max(0, i - 1)] + 2 * g[i] + g[Math.min(n - 1, i + 1)]) / 4; return '<stop offset="' + (i / (n - 1)).toFixed(4) + '" stop-color="rgb(' + gradeRgb(v).join(',') + ')"/>'; }).join('');
    const lab = (h) => num(Math.round(h)) + ' m';
    const svg = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" aria-hidden="true"><defs>' +
      '<linearGradient id="hgc" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + W + '" y2="0">' + stops + '</linearGradient>' +
      '<linearGradient id="hgs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd23a" stop-opacity=".82"/><stop offset="1" stop-color="#ffc21a" stop-opacity=".62"/></linearGradient>' +
      '<linearGradient id="hgl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd23a" stop-opacity=".3"/><stop offset="1" stop-color="#ffd23a" stop-opacity=".15"/></linearGradient>' +
      '<clipPath id="hgk"><rect x="0" y="0" width="0" height="' + Hh + '"/></clipPath></defs>' +
      '<path d="' + area + '" fill="url(#hgl)"/><path class="ah" d="' + line + '"/><g clip-path="url(#hgk)"><path d="' + area + '" fill="url(#hgs)"/><path class="ln" stroke="url(#hgc)" d="' + line + '"/></g>' +
      (P.real ? '<text class="lo" x="2" y="' + (y(lo) - 12).toFixed(1) + '">' + lab(lo) + '</text><text class="hi" x="' + (W - 2) + '" y="' + (y(hi) - 6).toFixed(1) + '" text-anchor="end">' + lab(hi) + '</text>' : '') +
      '<g class="pt" transform="translate(0 ' + y(H[0]).toFixed(1) + ')"><circle class="halo" r="7.5"/><circle r="3.8"/></g></svg>';
    return { svg, at: (f) => [x(f), y(hAt(f))] };
  }
  let graphRaf = 0;
  function graphOn() {
    cancelAnimationFrame(graphRaf); graphRaf = 0;
    const box = app && $('#track-stage .hgraph', app); if (!box) return;
    const t = trackById(box.dataset.graph), W = box.clientWidth, Hh = box.clientHeight - (parseFloat(getComputedStyle(box).paddingTop) || 0); if (!t || !W) return;
    if (!box.__g || box.__g.W !== W || box.__g.H !== Hh) { const o = graphOf(t, W, Hh); if (!o) return; box.innerHTML = o.svg; box.__g = { W, H: Hh, at: o.at, t0: box.__g ? box.__g.t0 : performance.now() }; }
    const svg = $('svg', box), clip = $('#hgk rect', svg), pt = $('.pt', svg), R = RT[t.id], stage = box.parentNode, rally = t.group === 'rally';
    let last = -1;
    const frame = () => {
      if (!box.isConnected) { graphRaf = 0; return; }
      // how far along the run: the flyover's frame, the map's running point (its clock: 1.6 s before it shows, then once round in 15 s;
      // a rally stage 11 s), the model and the corner's camera the same from when the graph came
      const v = $('.dio.fly video', stage), map = $('.dio.topmap svg.mapsvg', stage), dur = rally ? 11 : 15;
      let f = 0;
      if (v && R && R.fly) { const F = R.fly, fr = F.frames[Math.min(F.frames.length - 1, Math.floor((v.currentTime || 0) * F.fps))]; f = fr ? fr[0] / R.len : 0; }
      else { const s = map && map.getCurrentTime ? map.getCurrentTime() : (performance.now() - box.__g.t0) / 1000; f = s < 1.6 ? 0 : ((s - 1.6) % dur) / dur; }
      f = Math.min(1, Math.max(0, f));
      if (Math.abs(f - last) > 0.0005) { last = f; const p = box.__g.at(f); clip.setAttribute('width', p[0].toFixed(1)); pt.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')'); }
      graphRaf = requestAnimationFrame(frame);
    };
    frame();
  }
  window.addEventListener('resize', () => { if (screen === 'track') { fitWhere(); graphOn(); } });



  /* ---------------- single race, step 2: the track ----------------
     (docs/meni-izbira-proge.md »Zadnje odločitve«, the mockup maketa-menija/izbira-proge.) The picture of the track from the top of the screen
     down to the row (the map, the flyover, the corner's camera or the model); over it the head (the back arrow, the place, the globe), the
     height graph under the arrow, the weather down the right side under the globe, the track's place in the list at the bottom left and the
     cameras at the bottom right. Under the picture the dark room with its top corners rounded: the row of numbers (the country's flag, the
     best, the length, the climb or the corners, the opponents), the yard (the player's car before a blue road sign with the country), the
     two neighbouring tracks of the list (their flags) and Race!. On its side the picture at the left, the rest at the right. The list goes
     round (track:-1 / track:1: the buttons, LB and RB, the arrow keys, a swipe over the stage) */
  // the weather: Dry, Rain, Changing, Storm and Snow (the season winter, the rain falling as snow: js/render.js snowy), the mockup's icons
  const WX5 = [['dry', 'Dry'], ['rain', 'Rain'], ['change', 'Changing'], ['storm', 'Storm'], ['snow', 'Snow']];
  const WX_CLOUD = (y) => '<path d="M6.5 ' + (16 + y) + 'h11a3.6 3.6 0 0 0 0-7.2 5 5 0 0 0-9.6-1.2A3.9 3.9 0 0 0 6.5 ' + (16 + y) + 'z" fill="#fff"/>';
  const WX_DROPS = '<g stroke="#5fc8ff" stroke-width="1.8" stroke-linecap="round"><path d="M9 18l-1 3M12.5 18l-1 3M16 18l-1 3"/></g>';
  const wxIcon = (w) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ({
    dry: '<defs><radialGradient id="wx-sun" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fff7c8"/><stop offset=".5" stop-color="#ffd23a"/><stop offset="1" stop-color="#ff8f1a"/></radialGradient></defs>' +
      '<circle cx="12" cy="12" r="4.8" fill="url(#wx-sun)"/><g stroke="#ffbf2e" stroke-width="2.2" stroke-linecap="round"><path d="M19 12h3M16.95 16.95l2.12 2.12M12 19v3M7.05 16.95l-2.12 2.12M5 12H2M7.05 7.05 4.93 4.93M12 5V2M16.95 7.05l2.12-2.12"/></g>',
    rain: WX_CLOUD(0) + WX_DROPS,
    change: '<circle cx="8" cy="8" r="3.4" fill="#ffd23a"/>' + WX_CLOUD(1) + WX_DROPS,
    storm: WX_CLOUD(0) + '<path d="M12.5 16.5l-2.4 4h2.4l-1.2 3.5 4-5h-2.5l1.4-2.5z" fill="#ffd23a"/>',
    snow: '<g stroke="#e4f3ff" stroke-width="1.9" stroke-linecap="round" fill="none"><path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5"/><path d="M9.6 3.9L12 6l2.4-2.1M9.6 20.1L12 18l2.4 2.1M3.3 10.4l3.1-.7-1-3M20.7 13.6l-3.1.7 1 3M3.3 13.6l3.1.7-1 3M20.7 10.4l-3.1-.7 1-3"/></g>',
  })[w] + '</svg>';
  // the one shown chosen: Snow in winter, else the game's weather (Random, the options' own: none)
  const wxOn = () => G.S.season === 'winter' ? 'snow' : G.S.weather;
  // the weather over the whole track screen (js/menu-vreme.js, sklop 12): its look (Random as Changing), the stage's class for the first
  // picture (the wet model, the clouds), the tapped weather icon's place (its ring)
  const MV = () => window.MenuVreme || null;
  let wxTap = null;
  const wxLook = () => { const w = wxOn(); return w === 'random' ? 'change' : WX5.some(x => x[0] === w) ? w : 'dry'; };
  const wxCls = () => ({ rain: ' rainy', storm: ' rainy', change: ' damp', snow: ' snowy' })[wxLook()] || '';
  // Snow: the winter and the rain (falling as snow); another weather after it: the season it had before (summer if none)
  let preSeason = 'summer';
  function setWeather(w) {
    const S = G.S;
    if (w === 'snow') { if (S.season !== 'winter') { preSeason = S.season; G.setOption('season', 'winter'); } G.setOption('weather', 'rain'); return; }
    if (S.season === 'winter') G.setOption('season', preSeason !== 'winter' ? preSeason : 'summer');
    G.setOption('weather', w);
  }
  // the back arrow (the head's, the mockup's)
  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4.5 7.5 12l7.5 7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // the opponents' grid (the start's: two columns of cars, fading back)
  const GRID = '<svg class="grid" viewBox="0 0 18 17" aria-hidden="true">' + [[2, 1, 1], [11, 3.6, 1], [2, 6.2, .75], [11, 8.8, .75], [2, 11.4, .5], [11, 14, .5]].map(r => '<rect x="' + r[0] + '" y="' + r[1] + '" width="7" height="4" rx="1.6" fill="#9fb0c8" opacity="' + r[2] + '"/>').join('') + '</svg>';
  const DBL = (dir) => '<svg viewBox="0 0 28 20" aria-hidden="true"><path d="' + (dir < 0 ? 'M13 3 6 10l7 7M22 3l-7 7 7 7' : 'M6 3l7 7-7 7M15 3l7 7-7 7') + '" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // the flags of the countries (assets/flags, drawn to their official rules); a track in another country has none
  const FLAG_FILES = ['slovenia', 'austria', 'germany', 'belgium', 'finland', 'england', 'france', 'italy', 'monaco', 'usa', 'canada', 'brazil', 'chile', 'australia', 'south-africa', 'morocco', 'japan', 'china', 'thailand', 'russia', 'romania'];
  const flagUrl = (c) => { const f = String(c || '').toLowerCase().replace(/\s+/g, '-'); return FLAG_FILES.includes(f) ? 'assets/flags/' + f + '.svg' : ''; };
  // a neighbour's button: the whole flag at its hoist (its own proportions), its last column stretched to the button's far edge, so every
  // stripe keeps its share. The column is read once from the flag drawn on a canvas one pixel wide; the buttons get it when it is ready
  const flagEdge = {};
  // (where the game draws its colours anew, js/sence.js: no picture, which Samsung Internet darkens even read back from a canvas (the phone,
  // 12. 11. 2026: the right half grey), but the flag's own drawing inline, its last sliver stretched behind the flag, its shapes' colours
  // then by the page's filters as the flag's)
  let edgeN = 0;
  function flagSliver(url) {
    const key = 'svg:' + url;
    if (key in flagEdge) return flagEdge[key];
    flagEdge[key] = '';
    fetch(url).then((r) => (r.ok ? r.text() : '')).then((txt) => {
      const doc = new DOMParser().parseFromString(txt, 'image/svg+xml'), sv = doc.documentElement;
      if (!sv || sv.localName !== 'svg' || doc.querySelector('parsererror')) return;
      const vb = (sv.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
      const [x, y, w, h] = vb.length === 4 && vb[2] > 0 && vb[3] > 0 ? vb : [0, 0, parseFloat(sv.getAttribute('width')), parseFloat(sv.getAttribute('height'))];
      if (!(w > 0 && h > 0)) return;
      for (const t of Array.from(sv.querySelectorAll('title,script,foreignObject'))) t.remove();
      // (its ids its own: the flag itself on the screen too)
      const pre = 'nbe' + (++edgeN) + '-', ids = new Set(Array.from(sv.querySelectorAll('[id]'), (e) => e.id));
      for (const e of Array.from(sv.querySelectorAll('*'))) for (const a of Array.from(e.attributes)) {
        if (a.name === 'id') e.id = pre + a.value;
        else if (/url\(#|^#/.test(a.value)) e.setAttribute(a.name, a.value.replace(/url\(#([^)]+)\)/g, (m, i) => (ids.has(i) ? 'url(#' + pre + i + ')' : m)).replace(/^#(.+)$/, (m, i) => (ids.has(i) ? '#' + pre + i : m)));
      }
      sv.setAttribute('viewBox', [x + w - w / 200, y, w / 200, h].join(' '));
      sv.setAttribute('preserveAspectRatio', 'none'); sv.removeAttribute('width'); sv.removeAttribute('height');
      sv.setAttribute('class', 'edge'); sv.setAttribute('aria-hidden', 'true');
      flagEdge[key] = new XMLSerializer().serializeToString(sv);
      if (app) for (const b of app.querySelectorAll('.nb[data-flag="' + url + '"]')) if (!b.querySelector('.edge')) b.insertAdjacentHTML('afterbegin', flagEdge[key]);
    }).catch(() => {});
    return '';
  }
  const senceOn = () => !!(window.Sence && window.Sence.on);
  function flagFill(url) {
    if (senceOn()) return '';
    if (url in flagEdge) return flagEdge[url];
    flagEdge[url] = '';
    const im = new Image();
    im.onload = () => {
      try {
        const cv = document.createElement('canvas'); cv.width = 1; cv.height = 96; const c = cv.getContext('2d');
        c.drawImage(im, -63, 0, 64, 96); flagEdge[url] = 'url(' + cv.toDataURL() + ')';
        if (app) for (const b of app.querySelectorAll('.nb[data-flag="' + url + '"]')) b.style.backgroundImage = flagEdge[url];
      } catch (_) { /* (a canvas that cannot be read: the button's own colour) */ }
    };
    im.src = url;
    return '';
  }
  /* the globe in the head: the Earth turned to the track's place (an orthographic globe of the Blue Marble, assets/geo/earth-s.webp), its
     country gold (its outline from GEO.outlines and MENU.globe.outlines: tools/menu-globe.mjs), a white ring round the place (GEO.tracks,
     else MENU.globe.places; a track without one: its country's middle, no ring), all of it in daylight; with the Earth's moon on
     (MenuZemlja.night()) its night side darker and bluer (where the Sun is overhead now: MenuZemlja.sun(); the country stays gold). Drawn
     once per track on a canvas of its own (again when the moon is switched, and after 10 minutes of the night: it moves on),
     which every new picture of the screen gets back (globe.on); until the Earth has loaded, the globe icon. Another track: the globe turns
     from the last one's place to its (along the great circle, under a second; drawn at half the size on the way). Its tap: the Earth
     (js/menu-zemlja.js). The look (LOOKS): 1 the whole Earth, 2 closer, 3 closer with the country glowing (the player's choice: 1 until then) */
  const LOOKS = [null, { zoom: 1 }, { zoom: 2.3 }, { zoom: 1.5, glow: true }], GLOBE_LOOK = 1;
  const globe = (function () {
    const R = Math.PI / 180, made = {}, GB = D.globe || { places: {}, outlines: {} };
    let px = null, TW = 0, TH = 0, wait = null, at0 = null, turnRaf = 0;   // (at0: the middle the globe shows now; a new track's globe turns from it)
    const calmQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    function earth() {   // the Earth's pixels (once)
      return wait || (wait = new Promise((res) => {
        const im = new Image();
        im.onload = () => { try { const c = document.createElement('canvas'); TW = c.width = im.naturalWidth; TH = c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0); px = x.getImageData(0, 0, TW, TH).data; } catch (_) { px = null; } res(px); };
        im.onerror = () => { wait = null; res(null); };   // (not kept: the next screen asks again)
        im.src = 'assets/geo/earth-s.webp';
      }));
    }
    // where a track is and what is gold: its place [lat, lon] (or null) and its country's outline (rings of lon, lat, ...)
    function whereOf(t, c) {
      const g = window.GEO, gt = g && g.tracks[t.id], all = [].concat((g && g.outlines[c]) || [], GB.outlines[c] || []), rings = all.length ? all : null;   // (the menu's: a country geo.js has not, or its part it left out: Hawaii)
      const place = GB.places[t.id] || (gt && (!c || gt.names.country === c) ? [gt.lat0, gt.lon0] : null);
      const mid = !place && g && c ? g.countries.find(k => k[0] === c) : null;   // (Natural Earth's place for the country's name)
      return place || mid ? { lat: place ? place[0] : mid[2], lon: place ? place[1] : mid[1], ring: !!place, rings } : null;
    }
    // the globe of the place w (its middle: cen, on the way from another place) on a canvas S × S (cv: drawn again on that one)
    function draw(w, S, o, cen, cv) {
      if (!cv) cv = document.createElement('canvas');
      if (cv.width !== S) cv.width = cv.height = S;
      const g = cv.getContext('2d'), im = g.createImageData(S, S), d = im.data, r = S / 2 * o.zoom, c0 = S / 2, m = cen || [w.lat, w.lon];
      const sp = Math.sin(m[0] * R), cp = Math.cos(m[0] * R), l0 = m[1] * R, Lx = -0.47, Ly = 0.57, Lz = 0.67;   // (the light from the upper left)
      const sn = window.MenuZemlja && MenuZemlja.night() ? MenuZemlja.sun() : null, ss = sn ? Math.sin(sn[0] * R) : 0, cs = sn ? Math.cos(sn[0] * R) : 0, sl = sn ? sn[1] * R : 0, NIGHT = [0.2, 0.24, 0.38];
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
        const x = (i + 0.5 - c0) / r, y = (c0 - j - 0.5) / r, q = x * x + y * y, k = (j * S + i) * 4;
        if (q >= 1) continue;
        const z = Math.sqrt(1 - q), sla = Math.max(-1, Math.min(1, z * sp + y * cp)), la = Math.asin(sla), lo = l0 + Math.atan2(x, z * cp - y * sp);
        const u = ((lo / R + 180) / 360 % 1 + 1) % 1 * TW - 0.5, v = Math.max(0, Math.min(TH - 1.001, (90 - la / R) / 180 * TH - 0.5));
        const u0 = Math.floor(u), v0 = Math.floor(v), fu = u - u0, fv = v - v0, a = (u0 + TW) % TW, b = (a + 1) % TW;
        const i00 = (v0 * TW + a) * 4, i10 = (v0 * TW + b) * 4, i01 = i00 + TW * 4, i11 = i10 + TW * 4, sh = (0.62 + 0.5 * Math.max(0, x * Lx + y * Ly + z * Lz)) * (0.75 + 0.25 * z);
        const day = sn ? smooth(-0.16, 0.1, sla * ss + Math.sqrt(1 - sla * sla) * cs * Math.cos(lo - sl)) : 1;   // (the night: darker and bluer, a soft edge)
        for (let ch = 0; ch < 3; ch++) d[k + ch] = ((px[i00 + ch] * (1 - fu) + px[i10 + ch] * fu) * (1 - fv) + (px[i01 + ch] * (1 - fu) + px[i11 + ch] * fu) * fv) * sh * (day + (1 - day) * NIGHT[ch]);
        d[k + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      // a point of the Earth on the globe (one behind it: onto its edge)
      const at = (la, lo) => { const f = la * R, dl = lo * R - l0, cf = Math.cos(f); let x = cf * Math.sin(dl), y = cp * Math.sin(f) - sp * cf * Math.cos(dl);
        const back = sp * Math.sin(f) + cp * cf * Math.cos(dl) < 0; if (back) { const n = Math.hypot(x, y) || 1; x /= n; y /= n; } return [c0 + x * r, c0 - y * r, back]; };
      if (w.rings) {
        g.beginPath();
        for (const ring of w.rings) for (let n = 0; n < ring.length; n += 2) { const p = at(ring[n + 1], ring[n]); if (n) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }
        g.fillStyle = o.glow ? 'rgba(255, 210, 58, .9)' : 'rgba(255, 198, 41, .62)';
        if (o.glow) { g.save(); g.shadowColor = '#ffd23a'; g.shadowBlur = S * 0.08; g.fill('evenodd'); g.restore(); }
        g.fill('evenodd'); g.lineWidth = Math.max(1, S / 90); g.lineJoin = 'round'; g.strokeStyle = '#ffd23a'; g.stroke();
      }
      const p = at(w.lat, w.lon);
      if (w.ring && !p[2]) { g.beginPath(); g.arc(p[0], p[1], S * 0.075, 0, 2 * Math.PI); g.lineWidth = S / 40; g.strokeStyle = 'rgba(0, 0, 0, .55)'; g.stroke(); g.lineWidth = S / 70; g.strokeStyle = '#fff'; g.stroke(); }
      const air = g.createRadialGradient(c0, c0, S * 0.38, c0, c0, S * 0.5); air.addColorStop(0, 'rgba(120, 180, 255, 0)'); air.addColorStop(1, 'rgba(150, 200, 255, .45)');   // (the air at the edge)
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = air; g.fillRect(0, 0, S, S);
      return cv;
    }
    // the head's globe of the track shown: its canvas, made now if the Earth is there (else once it is), turning to it from the last place
    function on() {
      const el = app && $('.globe[data-globe]', app); if (!el) return;
      const id = el.dataset.globe, t = trackById(id); if (!t) return;
      const nt = !!(window.MenuZemlja && MenuZemlja.night());
      if (!(id in made) || (made[id] && (made[id].__n !== nt || (nt && Date.now() - made[id].__t > 6e5)))) {
        if (!px) { earth().then(p => { if (p) on(); }); return; }
        const w = whereOf(t, countryOf(t)), S = Math.round(52 * Math.min(3, Math.max(2, window.devicePixelRatio || 1)));
        made[id] = w ? draw(w, S, LOOKS[GLOBE_LOOK]) : null;
        if (made[id]) { Object.assign(made[id].dataset, { country: countryOf(t), ring: w.ring ? 1 : 0 }); made[id].__w = w; made[id].__t = Date.now(); made[id].__n = nt; }
      }
      const cv = made[id]; if (!cv) return;
      cancelAnimationFrame(turnRaf); turnRaf = 0;
      const w = cv.__w, from = at0, to = [w.lat, w.lon]; at0 = to;
      const v3 = (p) => [Math.cos(p[0] * R) * Math.cos(p[1] * R), Math.cos(p[0] * R) * Math.sin(p[1] * R), Math.sin(p[0] * R)];
      const A = from && v3(from), B = v3(to), om = A ? Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]))) : 0;
      if ((calmQ && calmQ.matches) || om < 2 * R) { if (cv.parentNode !== el) el.replaceChildren(cv); return; }
      // the turn: along the great circle, eased, at half the size (the canvas grown to the slot); the screen gone: it stops where it was
      const tv = document.createElement('canvas'), s2 = Math.round(cv.width / 2), t0 = performance.now(), dur = 600 + 400 * om / Math.PI;
      Object.assign(tv.dataset, cv.dataset); el.replaceChildren(tv);
      const step = (now) => {
        turnRaf = 0;
        if (!tv.isConnected) return;
        const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        if (k >= 1) { at0 = to; tv.replaceWith(cv); return; }
        const s0 = Math.sin((1 - e) * om) / Math.sin(om), s1 = Math.sin(e * om) / Math.sin(om), q = [A[0] * s0 + B[0] * s1, A[1] * s0 + B[1] * s1, A[2] * s0 + B[2] * s1];
        at0 = [Math.asin(Math.max(-1, Math.min(1, q[2]))) / R, Math.atan2(q[1], q[0]) / R];
        draw(w, s2, LOOKS[GLOBE_LOOK], at0, tv);
        turnRaf = requestAnimationFrame(step);
      };
      draw(w, s2, LOOKS[GLOBE_LOOK], from, tv); turnRaf = requestAnimationFrame(step);
    }
    // another screen of the game came: its next globe shows its place at once
    function reset() { cancelAnimationFrame(turnRaf); turnRaf = 0; at0 = null; }
    return { on, reset, whereOf, state: () => ({ turning: !!turnRaf, at: at0 && at0.map(v => +v.toFixed(2)) }) };
  })();
  // the player's car in the yard: in 3D with the wind round it (js/menu-car.js), else (no WebGL for it) its picture (assets/cars/img), else
  // the game's own showroom drawn once per car and colour
  const car3d = (car) => window.MenuCar && MenuCar.supported() && car.hex != null ? { id: car.id, color: car.hex, num: car.num } : null;
  function carOn() {
    const y = screen === 'track' && $('#s-track .yard', app), c = y && car3d(G.car());
    if (!c) { if (window.MenuCar) MenuCar.detach(); return; }
    c.wx = wxMode(); MenuCar.watch(signOn);   // (its shadow for the weather; the sign's name again when the car covers more or less of it)
    MenuCar.attach(y, c, () => { if (screen === 'track' && app.isConnected && !$('.intro', app)) render(true); });   // (no WebGL for it after all: the picture)
  }
  const carPics = {};
  function carPicOf(car) {
    if (HAS_CAR_IMG.includes(car.id)) return carImg(car, car.color);
    const k = car.id + '-' + car.color;
    if (!(k in carPics)) { carPics[k] = ''; try { carPics[k] = G.carPic ? G.carPic(640, 360) || '' : ''; } catch (_) { /* (no showroom: the letter) */ } }
    return carPics[k];
  }
  /* the quick list (js/menu-izbor.js): the flag in the row or the country's sign opens it over the track step, with the mode's tracks; a
     track chosen there: the screen goes to it (Select) or its race starts (Race!) */
  const IZ = () => window.MenuIzbor || null;
  const izOpen = () => !!(IZ() && IZ().isOpen());
  function izbor() {
    const M = IZ(); if (!M || screen !== 'track' || !app) return;
    ringStop();   // (a turn of the carousel done at once: the list opens on the track it went to)
    if (zemOpen()) ZE().close(true);
    M.open(nuOn ? Object.assign(izOpts(), { nu: { top: nuTop() } }) : izOpts());   // (behind NEUPORABNO: its list again)
  }
  function izOpts(from) {   // (the mode's tracks (from: these) with their places, flags, pictures, shapes, heights and the progress; the quick list's and the Earth's)
    const cur = curTrack(), PL = (D.globe || {}).places || {}, NC = D.ncorners || {};
    return {
      root: app, cur: cur ? cur.id : '',
      list: (from || TRACKS()).map(t => {
        const c = countryOf(t), gt = window.GEO && GEO.tracks[t.id], pl = PL[t.id] || (gt ? [gt.lat0, gt.lon0] : null);
        return { id: t.id, name: t.name, country: c, flag: flagUrl(c), img: trackImg(t), img2: RT[t.id] && RT[t.id].fly ? 'assets/maps/fly-' + t.id + '.webp' : '', km: t.km, alt: t.def.alt || null, corners: NC[t.id] != null ? NC[t.id] : null,
          group: t.group, test: t.test, pending: !!t.def.pending, open: !!t.def.open, ice: !!t.def.ice, lat: pl ? pl[0] : null, lon: pl ? pl[1] : null };   // (ice: a track on ice, the quick list's fourth category)
      }),
      shape: (id) => (D.shapes || {})[id] || null,
      heights: (id) => { const t = trackById(id); return t ? heightsOf(t) : null; },
      prog: (id) => { const t = trackById(id); return t && G.progress ? G.progress(t.def) : null; },
      pick: (id) => { izGo(id); },
      race: (id) => { if (izGo(id)) act('race-single'); },   // (in the tap: the intro's sounds may start, warmFor)
      buzz: () => { if (G.buzz) G.buzz(); },
      click: () => G.click(),
    };
  }
  /* NEUPORABNO (hidden above): the title's button opens the quick list's sheet with what does not go into version 1.0 (js/menu-izbor.js nuView):
     NEW VERSION · TEST 1, the missions and the cups of test tracks on top (the game's own screens), then the hidden tracks of every mode, the
     ones awaiting the user's choice (PENDING) first, then the test tracks (TEST); a track's card: Select (the track step of the hidden tracks,
     on it) and Race! */
  function nuSheet() {
    const M = IZ(); if (!M || !app) return;
    if (zemOpen()) ZE().close(true);
    M.open(Object.assign(izOpts(TR.filter(hidden)), { cur: '', nu: { top: nuTop() }, pick: (id) => { nuGo(id); }, race: (id) => { if (nuGo(id)) act('race-single'); } }));
  }
  function nuTop() {
    const cups = G.nuCups ? G.nuCups() : [];
    return '<div class="izb-nu"><button class="nu-nv" data-act="newver" aria-label="New version, test 1: drive the new map now"><i class="nv-st" aria-hidden="true"></i><em>NEW</em><b>NEW VERSION</b><strong>TEST 1</strong><small>' + I.wheel + 'DRIVE NOW</small></button>' +
      '<button class="nu-bar mis" data-act="game:to-missions">' + I.starBig + '<b>MISSIONS</b><small>Special missions in six garages</small></button>' +
      (cups.length ? '<button class="nu-bar cup" data-act="game:to-champ-nu">' + I.medalBig + '<b>CUPS</b><small>' + esc(cups.join(' · ')) + '</small></button>' : '') + '</div>';
  }
  function nuGo(id) {   // a hidden track chosen behind NEUPORABNO: the track step of the hidden tracks, on it (in a mode it is driven in)
    const t = trackById(id); if (!t || !hidden(t)) return false;
    nuOn = true;
    if (!inMode(t)) mode = MENU_MODE[G.modeOf(t.def)] || 'race';
    if (!inMode(t)) mode = MENU_MODE[t.modes[0]] || 'race';
    trackIdx = Math.max(0, TRACKS().indexOf(t)); select();
    titleSub = null; sheet = null; screen = 'track'; cam = CAM_OPEN || G.S.menuCam; render();
    return true;
  }
  /* the Earth (js/menu-zemlja.js): the globe in the head opens it over the track step, with the quick list's tracks and cards (no WebGL for
     it: the quick list instead). While it covers the screen, the screen rests: the weather, the flyover's names, the graph's point, the car
     and the videos stop, the screen is not drawn (.rested); they go on again as the Earth goes back into the globe (a track chosen on it:
     the new screen moves already) */
  const ZE = () => window.MenuZemlja || null;
  const zemOpen = () => !!(ZE() && ZE().isOpen());
  let rested = null;   // (the videos that were playing, while the screen rests)
  function zemlja() {
    const Z = ZE(); if (!Z || screen !== 'track' || !app) return;
    ringStop();
    if (izOpen()) IZ().close(true);
    Z.open(Object.assign(izOpts(), { from: () => $('#s-track .globe', app), rest, wake, fail: () => izbor() }));
  }
  function rest() {
    if (screen === 'track' && app && !rested) ringStop();   // (the carousel: a turn done at once, a finger's let go)
    const s = screen === 'track' && app && $('#s-track', app); if (!s || rested) return;
    rested = [...app.querySelectorAll('video')].filter(v => !v.paused);
    if (MV()) MV().rest(); cancelAnimationFrame(flyRaf); cancelAnimationFrame(graphRaf); graphRaf = 0; if (window.MenuCar) MenuCar.detach();
    for (const v of rested) v.pause();
    s.classList.add('rested');
  }
  function wake() {
    const vs = rested; if (!vs) return;
    rested = null;
    const s = screen === 'track' && shown === 'track' && app && $('#s-track', app); if (!s) return;
    s.classList.remove('rested');
    flyLabels(); graphOn(); carOn(); globe.on(); if (MV()) MV().wake();   // (the globe drawn again if the night was switched on the Earth)
    for (const v of vs) if (v.isConnected) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
  }
  function izGo(id) {   // the screen to the quick list's track (false: none such in the mode's list)
    const L = TRACKS(), i = L.findIndex(t => t.id === id); if (i < 0) return false;
    if (i !== trackIdx) {
      // on its side the new track's card turns in from the side it lies on in the list (the shorter way round); not under the Earth
      const n = L.length, d = ((i - trackIdx) % n + n) % n, dir = d <= n / 2 ? 1 : -1;
      ringStop();
      if (ringOn() && !zemOpen()) { trackIdx = i; select(); if (MV()) MV().leave(); render(true); ringIn(-dir); carIn(dir); } else trackGo(dir, i);
    }
    return true;
  }
  /* ---------------- the track step on its side: the carousel ----------------
     (the user's choice 5.1 of 7. 11. 2026, docs/meni-izbira-proge.md point 9; the mockup maketa-menija/izbira-proge, RING and ringPlace.)
     The screen is drawn for 892 × 412 and scaled into the safe area (ringFit: --k, --ox, --oy; css/menu.css): the chosen camera's picture
     blurred over the whole screen, the chosen track's card (the stage: its camera's picture with the graph, the weather in a row, the counter
     and the cameras) in the middle, its neighbours at its sides (four each way, the far ones half out of the screen), the head over them,
     the row and Race! under the card, the car at the bottom left. A swipe, a tap on a neighbour or on an arrow (‹ ›), the keys and LB/RB
     turn it (~300 ms): the cards go to their new places, the chosen card's things fade and come back on the new one, the old screen fades
     over the new (ringLand). Upright: none of it (display: none) */
  const LANDQ = window.matchMedia ? matchMedia('(orientation: landscape)') : null, CALMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const isLand = () => !!(LANDQ && LANDQ.matches);
  const ringOn = () => isLand() && !(CALMQ && CALMQ.matches) && screen === 'track';   // (reduced motion: the track changes at once)
  // a card's place k (0 the chosen card, ±1 the neighbours, ±2 the far ones half out of the screen, further on out of it; between: on the
  // way): [x, y, w, h, brightness, corner] in the drawing's px, the left side the right one's mirror
  const RING_S = [[254, 70, 384, 236, 1, 16], [656, 96, 184, 196, .78, 14], [854, 118, 150, 150, .45, 12]];
  const ringSlot = (j) => j <= 2 ? RING_S[j] : [854 + 190 * (j - 2), 118, 150, 150, .45, 12];
  function RING(k) {
    const a = Math.abs(k), j = Math.floor(a), f = a - j, p = ringSlot(j), q = ringSlot(j + 1), v = p.map((x, i) => x + (q[i] - x) * f);
    if (k < 0) v[0] = 892 - v[0] - v[2];
    return v;
  }
  const RING_N = 4;   // (the cards each way)
  let ringK = 1;   // (the drawing's scale now: ringFit)
  // the drawing as big as fits the safe area (the probe .rsafe: the notch, the rounded corners, the gesture bar), no bigger than 1.5 times,
  // in its middle
  function ringFit() {
    const s = app && screen === 'track' && $('#s-track', app), pr = s && $('.rsafe', s); if (!pr || !isLand()) return;
    const a = s.getBoundingClientRect(), r = pr.getBoundingClientRect(); if (!r.width || !r.height) return;   // (from the screen's own box: it may be sliding in)
    const k = Math.min(r.width / 892, r.height / 412, 1.5);
    ringK = k;
    app.style.setProperty('--k', k.toFixed(4));
    app.style.setProperty('--ox', (r.left - a.left + (r.width - 892 * k) / 2).toFixed(1) + 'px');
    app.style.setProperty('--oy', (r.top - a.top + (r.height - 412 * k) / 2).toFixed(1) + 'px');
  }
  // the still of the chosen camera's picture (the carousel's backdrop, blurred): the map, the flyover's or the corner's first frame, else
  // the track's model (as stageView chooses)
  function stillOf(t) {
    const R = RT[t.id];
    if (cam === 1 && R) return mapLayers(t, R.top).bg;
    if (cam === 2 && R && R.fly) return 'assets/maps/fly-' + t.id + '.webp';
    if (cam === 3 && hasCorner(t)) return 'assets/maps/corner-' + t.id + '.webp';
    return trackImg(t);
  }
  // the carousel's parts in the track screen (its backdrop, the neighbours' cards: the flyover's first frame, else the model on the sky; the
  // flag, the name, the country and the length under it, the arrows); a short list: as many cards as there are other tracks, more of them
  // at the right
  function ringView(list, t) {
    const n = list.length, m = Math.min(RING_N, Math.floor((n - 1) / 2)), mr = Math.min(RING_N, n - 1 - m);
    const at = (k) => list[((trackIdx + k) % n + n) % n];
    const card = (k) => {
      const u = at(k), c = countryOf(u), f = flagUrl(c), [x, y, w, hh, b, r] = RING(k), fly = !!(RT[u.id] && RT[u.id].fly);
      return '<div class="rcard' + (fly ? '' : ' mdl') + '" data-act="track:' + k + '" data-k="' + k + '" data-t="' + u.id + '" aria-hidden="true" style="--pic:url(' + (fly ? 'assets/maps/fly-' + u.id + '.webp' : trackImg(u)) + ');--x:' + x + ';--y:' + y + ';--w:' + w + ';--h:' + hh + ';--b:' + b + ';--r:' + r + ';--g:0;--t:1;--lo:' + (Math.abs(k) === 1 ? 1 : 0) + '">' +
        '<div class="rlab">' + (f ? '<img src="' + f + '" alt="">' : '<span class="nf">' + esc((c || u.name).slice(0, 3).toUpperCase()) + '</span>') + '<span><b>' + esc(u.name) + '</b><small>' + esc((c ? c + ' · ' : '') + u.km.toFixed(2) + ' km') + '</small></span></div></div>';
    };
    const arw = (k) => {
      const u = at(k), c = countryOf(u);
      return '<button class="rarw ' + (k < 0 ? 'l' : 'r') + '" data-act="track:' + k + '" aria-label="' + (k < 0 ? 'Previous' : 'Next') + ' track: ' + esc(u.name + (c ? ', ' + c : '')) + '"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="' +
        (k < 0 ? 'M11 3.5L5.5 9l5.5 5.5' : 'M7 3.5L12.5 9 7 14.5') + '" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
    };
    let h = '<i class="rsafe" aria-hidden="true"></i><div class="rbg" aria-hidden="true" style="--pic:url(' + stillOf(t) + ')"><i></i><b></b></div>';
    for (let k = -m; k <= mr; k++) if (k) h += card(k);
    return h + (m ? arw(-1) : '') + (mr ? arw(1) : '');
  }
  // the cards turning: each at its place less p (p from 0 to d: d places on), the chosen card's things fading as it leaves the middle, a
  // neighbour's name shown only beside the middle; the places as the card's own --x … (css/menu.css), so a turned phone keeps them
  let rg = null, ringGone = null, ringGoneT = 0;   // (rg: the carousel turning { d, p, raf, done } or held by a finger { drag, p }; the old screen fading)
  function ringPlace(e, k) {
    const [x, y, w, h, b, r] = RING(k), a = Math.abs(k), s = e.style;
    for (const [n, v] of [['--x', x], ['--y', y], ['--w', w], ['--h', h], ['--r', r], ['--g', Math.max(0, 1 - a)], ['--t', Math.min(1, a)], ['--lo', Math.max(0, 1 - Math.abs(a - 1))], ['--ui', Math.max(0, 1 - 3 * a)]]) s.setProperty(n, +v.toFixed(3));
    s.filter = b < .999 ? 'brightness(' + b.toFixed(3) + ')' : 'none';
    s.zIndex = a < .5 ? 4 : 3;
  }
  function ringEls() {
    const s = app && $('#s-track', app); if (!s) return [];
    const st = $('#track-stage', s), out = [...s.querySelectorAll('.rcard')].map(e => [e, +e.dataset.k]);
    if (st) out.push([st, 0]);
    return out;
  }
  function ringTo(p) { for (const [e, k] of ringEls()) ringPlace(e, k - p); if (MV()) MV().turn(p); }   // (the buttons' drops and snow fade as it turns)
  // from p0 (where a finger let go, or a picked track's side) to d, eased (the mockup's: 300 ms a place), then done()
  function ringTurn(d, p0, done) {
    if (rg && rg.raf) cancelAnimationFrame(rg.raf);
    const ms = 300 * (0.6 + 0.4 * Math.abs(d - p0)), t0 = performance.now(), me = { d, p: p0, raf: 0, done };
    rg = me;
    const step = (now) => {
      if (rg !== me) return;
      const x = Math.min(1, (now - t0) / ms), p = p0 + (d - p0) * (1 - Math.pow(1 - x, 3));
      me.p = p; ringTo(p);
      if (x < 1) { me.raf = requestAnimationFrame(step); return; }
      rg = null; if (done) done();
    };
    me.raf = requestAnimationFrame(step);
  }
  // a turn by d tracks (from p0); none while one is turning (the mockup's: a second tap in it is lost, a held key does not pile up)
  function ringSpin(d, p0) {
    const n = TRACKS().length; if (!d || n < 2 || (rg && !rg.drag)) return;
    rg = null; ringTurn(d, p0 || 0, () => ringLand(d));
  }
  // the turn done: the new track, its screen drawn under the old one, which fades in 300 ms (the old one's ids stay for its style: it comes
  // after the new one, every query finds the new one first); an arrow that had the focus: the new one has it
  function ringLand(d) {
    const n = TRACKS().length, old = app && $('#s-track', app), fa = app && app.getRootNode().activeElement, arw = fa && fa.classList && fa.classList.contains('rarw') ? (fa.classList.contains('l') ? 'l' : 'r') : '';
    const snap = old && window.MenuCar ? MenuCar.snap() : null;   // (the car as it stood, in the old screen as it goes)
    if (old && MV()) MV().leave();   // (its reflection on a wet floor: gone with it, back when the new one stands)
    trackIdx = ((trackIdx + d) % n + n) % n; select();
    if (ringGone) { clearTimeout(ringGoneT); ringGone.remove(); ringGone = null; }
    arriveDone();
    if (old) { old.remove(); for (const v of old.querySelectorAll('video')) v.pause(); }
    render(true);
    const now = $('#s-track', app);
    if (old && now) {
      old.classList.add('rgone'); old.setAttribute('aria-hidden', 'true'); old.inert = true; now.after(old); ringGone = old;
      ringGoneT = setTimeout(() => { old.remove(); if (ringGone === old) ringGone = null; }, 320);
      const oy = $('.yard', old); if (oy && snap) oy.insertBefore(snap, oy.firstChild);
      carOut(oy, d); carIn(d);
    }
    if (arw) { const b = $('#s-track .rarw.' + arw, app); if (b) b.focus({ preventScroll: true }); }
  }
  // a track picked in the quick list (on its side): its screen turns in from the side (p0: -1 from the right, 1 from the left)
  function ringIn(p0) { if (!ringOn()) return; ringTo(p0); ringTurn(0, p0, null); }
  // the carousel at rest at once (another layer over the screen, a sheet, another action): a turn done, a finger's let go, the fade gone
  function ringStop() {
    if (rg) { const me = rg; rg = null; cancelAnimationFrame(me.raf); if (me.done) me.done(); else ringTo(0); }
    if (ringGone) { clearTimeout(ringGoneT); ringGone.remove(); ringGone = null; }
    arriveDone();
  }
  /* a new track's sign and car come in from the side (docs/meni-izbira-proge.md, sklop 11; the mockup's change()). Upright (the arrows, a
     swipe, the quick list; trackGo): the old screen fades over the new one while its sign with its posts, its car (a picture of it: the
     car's canvas is the new yard's, MenuCar.snap) and the car's name go out to one side and the new ones come in from the other: out
     250 of 412 px in 260 ms, in from the whole width in 540 ms after 140 ms, the car 60 ms after the sign, its shadow on the floor when it
     stands. Lying (ringLand, the quick list's ringIn) only the car: out half its place, in from the other half in 460 ms after 160 ms.
     At once on a device that asks for less motion and under the Earth; ringStop (another layer over the screen, a new change) ends them. */
  const calmNow = () => !!(CALMQ && CALMQ.matches);
  let arrive = [];
  const arriving = (a) => { arrive.push(a); a.addEventListener('finish', () => { const k = arrive.indexOf(a); if (k >= 0) arrive.splice(k, 1); }); return a; };   // (a finished one let go)
  function arriveDone() { const A = arrive; arrive = []; for (const a of A) try { a.finish(); } catch (_) { /* gone with its screen */ } }
  function slide(els, from, to, o) { for (const e of els) arriving(e.animate([{ transform: from ? 'translateX(' + from.toFixed(0) + 'px)' : 'none', opacity: from ? 0 : 1 }, { transform: to ? 'translateX(' + to.toFixed(0) + 'px)' : 'none', opacity: to ? 0 : 1 }], o)); }
  const OUT = { duration: 260, easing: 'cubic-bezier(.5, 0, .75, 0)', fill: 'forwards' }, IN = { easing: 'cubic-bezier(.2, .8, .25, 1)', fill: 'backwards' };
  function trackGo(d, i) {
    trackIdx = i; select();
    const old = d && app && screen === 'track' && shown === 'track' && !calmNow() && !zemOpen() ? $('#s-track', app) : null;
    if (!old) { render(); return; }
    const snap = window.MenuCar ? MenuCar.snap() : null;
    if (MV()) MV().leave();
    old.remove(); for (const v of old.querySelectorAll('video')) v.pause();
    render(true);
    const now = $('#s-track', app); if (!now) return;
    old.classList.add('still', 'tgone'); old.setAttribute('aria-hidden', 'true'); old.inert = true; now.after(old); ringGone = old;   // (still: its own slide-in not again)
    const fade = old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 340, delay: 90, easing: 'ease-out', fill: 'forwards' });
    fade.onfinish = () => { old.remove(); if (ringGone === old) ringGone = null; };   // (gone when it has faded: its sign and car are out by then)
    arriving(fade);
    const oy = $('.yard', old), ny = $('.yard', now), W = (ny || now).getBoundingClientRect().width || 412;
    if (oy && snap) oy.insertBefore(snap, oy.firstChild);
    if (oy) slide(oy.querySelectorAll(':scope > .sign, :scope > .post, :scope > .wxsc, :scope > .car, :scope > .cname, :scope > .c3d, :scope > .wxcar'), 0, -d * W * 250 / 412, OUT);
    if (ny) {
      slide(ny.querySelectorAll(':scope > .sign, :scope > .post, :scope > .wxsc'), d * W, 0, Object.assign({ duration: 540, delay: 140 }, IN));   // (.wxsc: the snow on the sign's top, js/menu-vreme.js)
      slide(ny.querySelectorAll(':scope > .car, :scope > .cname, :scope > .c3d, :scope > .wxcar'), d * W, 0, Object.assign({ duration: 540, delay: 200 }, IN));   // (.wxcar: the snow on the car)
    }
    if (window.MenuCar) MenuCar.shadeIn(560, 260);
    if (MV()) MV().arrive(560, 260);   // (its reflection when it stands)
  }
  // (lying) the old car out, the new one in: half the car's place to each side
  const carStep = () => { const c = app && $('#s-track .yard .car', app); return c ? c.getBoundingClientRect().width / 2 : 120; };
  function carOut(oy, d) { if (oy && !calmNow()) slide(oy.querySelectorAll(':scope > .car, :scope > .cname, :scope > .c3d, :scope > .wxcar'), 0, -d * carStep(), OUT); }
  function carIn(d) {
    const ny = !calmNow() && app && $('#s-track .yard', app); if (!ny) return;
    slide(ny.querySelectorAll(':scope > .car, :scope > .cname, :scope > .c3d, :scope > .wxcar'), d * carStep(), 0, Object.assign({ duration: 460, delay: 160 }, IN));
    if (window.MenuCar) MenuCar.shadeIn(520, 240);
    if (MV()) MV().arrive(520, 240);
  }
  // the weather's row on the card (on its side): the new choice slides to the first place, the others to theirs (the screen is drawn
  // again: each button from where it was)
  function wxRects() { const m = {}; for (const b of app.querySelectorAll('#track-stage .wxv > button')) m[b.dataset.act] = b.getBoundingClientRect(); return m; }
  function wxSlide(at) {
    const bs = [...app.querySelectorAll('#track-stage .wxv > button')].filter(b => {
      const o = at[b.dataset.act], r = b.getBoundingClientRect(); if (!o) return false;
      const dx = o.left - r.left, dy = o.top - r.top; if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return false;
      b.style.transition = 'none'; b.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)'; return true;
    });
    if (!bs.length) return;
    void app.offsetWidth;
    for (const b of bs) { b.style.transition = 'transform .3s cubic-bezier(.2, .8, .25, 1)'; b.style.transform = ''; b.addEventListener('transitionend', () => { b.style.transition = ''; }, { once: true }); }
  }
  function vTrack() {
    const list = TRACKS();
    let h = '<section class="scr" id="s-track" aria-label="Single race">';
    const head = (inner) => '<div class="thead"><button class="back hback" data-act="back" aria-label="Back">' + ARROW + '</button>' + (inner || '') + '</div>';
    if (!list.length) return h + head() + '<div class="stage"><p class="empty">No tracks for this mode.</p></div></section>';
    trackIdx = Math.min(trackIdx, list.length - 1);
    const n = list.length, t = list[trackIdx], ctry = countryOf(t), fl = flagUrl(ctry);
    fr = G.friends ? G.friends(t.def, cam === 4) : null;   // (the friends' times: the Friends view builds the track for the check of its times, the place's badge waits for it)
    if (cam === 4 && !fr) cam = 1;   // (a game without the friends' leaderboard: the map)
    h += ringView(list, t);   // (on its side: the carousel's backdrop, the neighbours' cards and the arrows)
    // the head: the back arrow (to the modes), the place (fitWhere: smaller where a long one would reach the globe; the country for the
    // readers), the globe (its country gold: globe.on)
    h += head('<h2 class="where" aria-label="' + esc(t.name + (ctry ? ', ' + ctry : '')) + '"><span class="w2">' + esc(t.name) + '</span></h2>' + (ZE() ? '<button class="globe" data-act="zemlja" data-globe="' + t.id + '" aria-haspopup="dialog" aria-label="The world: choose a track on the Earth">' + I.globe + '</button>'
      : '<div class="globe" aria-hidden="true" data-globe="' + t.id + '">' + I.globe + '</div>'));
    // the stage: the picture with the cameras (stageView), the graph, the track's place among the real tracks (a test track: TEST), the
    // weather (the chosen one bigger, in its colours, named) with the more options under it
    const real = list.filter(u => !u.test), at = t.test ? 'TEST' : (real.indexOf(t) + 1) + '\u2009/\u2009' + real.length, W = wxOn();
    // (on its side the weather is a row at the card's top: the chosen one first, the others after it in their order: --wx, the drawing's px)
    const wo = WX5.filter(w => w[0] !== W), wxX = (id) => id === W ? 0 : (wo.length < WX5.length ? 4 : -40) + 40 * (wo.findIndex(w => w[0] === id) + 1);
    h += '<div class="stage' + (isRoute(t) ? ' route' : '') + ' cam' + cam + wxCls() + '" id="track-stage">' + stageView(t) + (withGraph(t) ? '<div class="hgraph" data-graph="' + t.id + '"></div>' : '') +
      '<div class="tcount" role="note" aria-label="' + (t.test ? 'Test track' : 'Track ' + at.replace(/\u2009\/\u2009/, ' of ')) + '">' + at + '</div>' +
      '<div class="wxv" role="group" aria-label="Weather">' + WX5.map(w => '<button class="w-' + w[0] + '" aria-pressed="' + (W === w[0]) + '" data-act="weather:' + w[0] + '" aria-label="' + w[1] + '" style="--wx:' + wxX(w[0]) + '">' + wxIcon(w[0]) + '<b>' + w[1] + '</b></button>').join('') +
      '<button class="wxmore" data-act="more-options" aria-label="More race options"><span class="dots3">···</span></button></div></div>';
    // the room under the picture: the row of numbers, the yard, the neighbours, Race!
    h += '<div class="room">';
    const rec = t.rec, my = rec[1] !== '—' ? rec[1] : '', alt = t.def.alt, d = t.def, pg = IZ() && G.progress ? G.progress(d) : null;
    const cell = (lbl, val, cls) => '<div class="' + (cls || '') + '"><small>' + esc(lbl) + '</small><b>' + esc(val) + '</b></div>';
    // the last cell: the opponents' number by the grid (its name for the readers), a race's a button (the sheet with 0..100, rivSheet);
    // a time trial's gold time, the police in a chase
    const oppN = (k) => '<small class="vh">Opponents</small><b>' + k + '</b>' + GRID;
    let last;
    if (mode === 'chase') last = cell('Police', 'On you', 'pol');
    else if (mode === 'trial') { const gold = G.medals(d); last = gold ? cell('Gold time', clock(gold[0]), 'gt') : '<div class="opp">' + oppN(0) + '</div>'; }
    else if (mode === 'endless') { const E = typeof Core !== 'undefined' && Core.EN; last = cell('Clock', (E ? E.clock[Math.max(0, Math.min(3, G.S.difficulty | 0))] : 30) + ' s', 'clk'); }   // (the clock's start at the game's level, js/core.js EN.clock; the row's last cell, as the police's)
    else if (mode === 'race' && rivOf(d)) { const k = G.rivals(d); last = '<div class="opp"><button data-act="riv" aria-haspopup="dialog" aria-label="Opponents: ' + k + '. Choose how many">' + oppN(k) + '</button></div>'; }
    else last = '<div class="opp">' + oppN(mode === 'duel' || mode === 'pursuit' || mode === 'drag' ? 1 : mode === 'elim' ? Math.max(5, G.rivals ? G.rivals(d) : 21) : G.rivals ? G.rivals(d) : 21) + '</div>';   // (Elimination: at least 5, js/zabava/elim.js E.min)
    // (by the best time: the player's place among the friends, 2/5 (no time yet: –/4); a tap opens the Friends view)
    const fb = fr && !fr.wait && (fr.place || fr.n) ? '<button class="fbadge" data-act="cam:4" aria-label="' + (fr.place ? 'Your place among friends: ' + fr.place.at + ' of ' + fr.place.n : 'Friends\' times: ' + fr.n) + '">' + (fr.place ? fr.place.at + '/' + fr.place.n : '–/' + fr.n) + '</button>' : '';
    // the flag: the quick list (js/menu-izbor.js; a country without a flag: its first letters); the best: its mark before it (a medal, a
    // tick), NEW instead of the time on a track not driven yet
    const flagB = IZ() ? '<div class="flag"><button data-act="izbor" aria-haspopup="dialog" aria-label="' + esc((ctry ? 'Flag of ' + ctry + '. ' : '') + 'Choose a track by country') + '">' +
      (fl ? '<img src="' + fl + '" alt="">' : '<span class="nf">' + esc((ctry || t.name).slice(0, 3).toUpperCase()) + '</span>') + '</button></div>' : fl ? '<div class="flag"><img src="' + fl + '" alt="Flag of ' + esc(ctry) + '"></div>' : '';
    const best = pg ? '<div class="best"><small>' + (pg.done ? IZ().mark(pg) : '') + esc(rec[0]) + '</small><b>' + (pg.done ? esc(my || '—') : IZ().mark(pg)) + '</b>' + fb + '</div>' : cell(rec[0], my || '—', 'best').replace(/<\/div>$/, fb + '</div>');
    h += '<div class="trow">' + flagB + best + cell('Length', t.km.toFixed(2) + ' km') +
      (alt ? cell(alt[1] < alt[0] ? 'Descent' : 'Climb', (alt[1] < alt[0] ? '−' : '+') + num(Math.abs(Math.round(alt[1] - alt[0]))) + ' m') : cell('Corners', String(t.corners))) + last + '</div>';
    // the yard: the car before the road sign with the country (a test track: its name and TEST; one awaiting the choice: PENDING); the car in 3D with the wind round it
    // (MenuCar: its canvas over the whole yard, put in after the drawing, carOn), else its picture; its name in a small box over it (stran
    // Odločitve m6: over the car's top as MenuCar fits it, --car-top/--car-left); a tap on either: the garage (the name a button of its own,
    // out of the keys' way and hidden from readers, the car's button says it: a phone's touch adjustment takes it for a target, not so a
    // plain span with the menu's listener far up)
    const car = G.car(), c3 = car3d(car), pic = c3 ? '' : carPicOf(car), here = G.carHere();
    const on3 = !!c3 && MenuCar.live(c3);
    h += '<div class="yard' + (on3 ? ' c3d-on' : c3 ? ' c3d-wait' : '') + '"' + (on3 ? MenuCar.placed() : '') + '><div class="sign' + (t.test ? ' test' : t.def.pending ? ' pending' : '') + '" data-country="' + esc(ctry) + '"' + (IZ() ? ' data-act="izbor"' : '') + '><b>' + esc(ctry || t.name) + '</b>' + (t.test ? '<i>TEST</i>' : t.def.pending ? '<i>PENDING</i>' : '') + '</div><i class="post a"></i><i class="post b"></i>' +
      '<button class="car" data-act="garage" aria-label="Your car: ' + esc(car.name) + (here ? '' : ', not in your garage') + '. Open the garage">' + (c3 ? '' : pic ? '<img src="' + pic + '" alt="">' : '<span class="mono">' + esc(car.name.charAt(0)) + '</span>') + '</button>' +
      '<button class="cname" data-act="garage" tabindex="-1" aria-hidden="true">' + esc(car.name) + '</button></div>';
    // the neighbours of the list: their flags (a track without one: its name)
    const nb = (k) => {
      const u = list[(trackIdx + k + n) % n], c = countryOf(u), f = flagUrl(c), fill = f ? flagFill(f) : '';
      return '<button class="nb ' + (k < 0 ? 'l' : 'r') + (f ? '' : ' plain') + '" data-act="track:' + k + '"' + (f ? ' data-flag="' + f + '"' + (fill ? ' style="background-image:' + fill + '"' : '') : '') +
        ' aria-label="' + (k < 0 ? 'Previous' : 'Next') + ' track: ' + esc(u.name + (c ? ', ' + c : '')) + '">' + (f && senceOn() ? flagSliver(f) : '') + (f ? '<img src="' + f + '" alt="">' : '<span>' + esc(u.name) + '</span>') + '<i>' + DBL(k) + '</i></button>';
    };
    h += '<div class="nbrs">' + nb(-1) + nb(1) + '</div>';
    return h + '<div class="foot solo"><button class="go" data-act="race-single">Race!</button></div></div></section>';
  }
  // the road sign behind the car in its country's style (js/menu-tabla.js: colours, frame, the name in its middle, its wear; lying it is not
  // shown: drawn when the phone is turned upright)
  function signOn() {
    const s = screen === 'track' && app && $('#s-track .yard .sign', app);
    if (s && window.MenuTabla) MenuTabla.on(s, s.dataset.country || '', undefined, window.MenuCar && MenuCar.cover ? MenuCar.cover() : 0);   // (a truck over its left part: the name right of it)
  }
  // the place in the head as big as the mockup's (44 px), smaller where it would reach the arrow or the globe (down to 18 px, then cut short)
  function fitWhere() {
    const w = app && screen === 'track' && $('#s-track .where', app), s = w && $('.w2', w); if (!s) return;
    s.style.fontSize = '';
    const max = parseFloat(getComputedStyle(s).fontSize) || 44, room = w.clientWidth, wide = s.getBoundingClientRect().width;   // (the name's own width, its line not cut)
    if (!room || wide <= room) return;
    s.style.fontSize = Math.max(18, Math.floor(max * (room - 2) / wide * 10) / 10) + 'px';
  }

  /* ---------------- overlays: sheets ---------------- */
  function creditsSheet() {   // where the menu's pictures of the Earth and its land come from, as their licences ask
    return '<div class="sheet-bg" data-act="close-sheet"><div class="sheet credits" role="dialog" aria-label="Credits"><h2>Credits</h2><dl>' +
      D.credits.map(c => '<dt>' + esc(c[0]) + '</dt><dd>' + esc(c[1]) + '</dd>').join('') + '</dl><div class="row"><button class="go" data-act="close-sheet">Done</button></div></div></div>';
  }
  function darkSheet() {   // the browser darkens the page by force (forcedDark): where to switch that off (dark itself, so it reads right darkened too)
    const steps = isSamsung()
      ? '<ol><li>Samsung Internet: <b>Menu ≡ → Settings → Webpage view and scrolling → Dark mode</b>, turn off <b>Force Dark mode for web content</b>.</li><li>Older versions: <b>Settings → Labs</b>, turn on <b>Use website dark theme</b>.</li></ol>'
      : '<ol><li>In the browser\'s settings, turn off its dark mode for websites.</li></ol>';
    return '<div class="sheet-bg" data-act="close-sheet"><div class="sheet dtip" role="dialog" aria-label="Colours too dark?"><h2>Colours too dark?</h2>' +
      '<p>Your browser\'s dark mode repaints the game: white turns black, gold turns brown. The game is dark already, so switch it off for websites:</p>' + steps +
      '<p class="fine">Or play in Chrome. Each browser keeps its own progress.</p><div class="row">' +
      (/Android/i.test(navigator.userAgent) ? '<button class="back wide" data-act="chrome">Open in Chrome</button>' : '') + '<button class="go" data-act="close-sheet">OK</button></div>' +
      '<button class="tlink" data-act="dark-never">Don\'t show this again</button></div></div>';
  }
  // the race's other choices (the weather column's ··· button), in a sheet of their own
  function optionsRows() {
    const t = curTrack() || TR[0], d = G.shown(t.def), S = G.S, su = G.setup(d.id), circuit = !d.open && mode === 'race', pk = d.theme === 'pikes';
    const R = [
      ['weather', 'Weather', [['dry', 'Dry'], ['rain', 'Rain'], ['random', 'Random'], ['change', 'Changing'], ['storm', 'Storm']], S.weather, true],
      ['season', 'Season', [['summer', 'Summer'], ['autumn', 'Autumn'], ['winter', 'Winter']], S.season, true],
      ['tod', 'Time of day', [['dawn', 'Dawn'], ['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']], S.tod, true],
      ['length', 'Race length', [['short', 'Short'], ['normal', 'Normal'], ['long', 'Long'], ['endurance', 'Endurance']], S.length, circuit],
      ['quali', 'Qualifying', [['1', 'On'], ['0', 'Off']], String(S.quali ? 1 : 0), circuit],
      ['fuel', 'Fuel', [['0', 'Off'], ['1', 'On']], String(S.fuel ? 1 : 0), circuit],
      ['cmp', 'Tyres', [['auto', 'Auto'], ['S', 'Soft'], ['M', 'Medium'], ['H', 'Hard']], S.cmp, circuit && !!d.pit],
      ['pkRoad', 'Road', [['pikes', 'Asphalt'], ['pikesg', 'Gravel']], S.pkRoad, pk],
      ['pkGhost', 'Ghost', [['best', 'My best'], ['legend', 'Legend'], ['off', 'None']], S.pkGhost, pk && mode === 'trial'],
      ['zbGold', 'Gold ghost', [['0', 'Off'], ['1', 'On']], String(S.zbGold ? 1 : 0), !pk && mode === 'trial' && !!(G.medals && G.medals(d))],   // (Zabava: the gold ghost, js/zabava/trener.js)
      ['zbDrag', 'Rival', [['0', 'Same car'], ['1', 'Truck']], String(+S.zbDrag === 1 ? 1 : 0), mode === 'drag'],   // (the drag race's rival, js/zabava/drag.js)
      ['wing', 'Wing', [['0', 'Small'], ['1', 'Medium'], ['2', 'Large']], String(su.wing), true],
      ['gear', 'Gears', [['0', 'Short'], ['1', 'Medium'], ['2', 'Long']], String(su.gear), true],
    ];
    return R.filter(r => r[4]);
  }
  function optionsSheet() {
    return '<div class="sheet-bg" data-act="close-sheet"><div class="sheet opts" role="dialog" aria-label="Race options"><h2>Race options</h2><div class="orows">' +
      optionsRows().map(r => '<div class="orow"><span>' + r[1] + '</span><div class="oseg">' + r[2].map(o => '<button aria-pressed="' + (String(r[3]) === o[0]) + '" data-act="opt:' + r[0] + ':' + o[0] + '">' + o[1] + '</button>').join('') + '</div></div>').join('') +
      '</div><div class="row"><button class="go" data-act="close-sheet">Done</button></div></div></div>';
  }

  // the race's opponents (the row's Opponents, a race of its own outside the career): the number big, the quick picks (0: Trial, alone
  // against the clock), a slider up to what the track takes (def.maxRivals: Pikes Peak's summit, the parking past the line of a few roads;
  // a big vehicle's field fewer) and Done. A pick is the game's setting at once (rivals: the next race; -1, the track's own field, until the
  // first pick); the slider moves the number as it goes and keeps it when let go, the screen behind it (the row) follows
  const RIV_QUICK = [[0, 'Trial'], [1], [5], [12], [25], [50], [100]];
  const rivOf = (d) => G.rivPick ? G.rivPick(d) : null;   // ({ max, car }: the most the track takes with this car, car: a big vehicle's field the limit; null: no choice here, the career)
  const rivSub = (n) => n === 0 ? 'Trial · you alone against the clock' : n === 1 ? '1 rival · 2 cars' : n + ' rivals · ' + (n + 1) + ' cars';
  function rivSheet() {
    const t = curTrack(), p = t && rivOf(t.def); if (!p) return '';
    const n = G.rivals(t.def), max = p.max, road = !!t.def.open;
    return '<div class="sheet-bg" data-act="close-sheet"><div class="sheet riv" role="dialog" aria-label="Opponents"><h2>Opponents</h2>' +
      '<div class="rnum" aria-live="polite"><b>' + n + '</b><span>' + rivSub(n) + '</span></div>' +
      '<div class="rquick">' + RIV_QUICK.map(([k, l]) => '<button data-act="riv-n:' + k + '" aria-pressed="' + (k === n) + '"' + (k > max ? ' disabled' : '') + '>' + k + (l ? '<small>' + l + '</small>' : '') + '</button>').join('') + '</div>' +
      '<input class="rslide" type="range" min="0" max="' + max + '" step="1" value="' + n + '" aria-label="Opponents, 0 to ' + max + '" style="--p:' + (n / Math.max(1, max) * 100).toFixed(2) + '%">' +
      '<div class="rends"><span>0</span><span>' + (max < 100 ? max + ' at most ' + (p.car ? 'with this car' : 'on this ' + (road ? 'road' : 'track')) : '100') + '</span></div>' +
      '<div class="row"><button class="go" data-act="close-sheet">Done</button></div></div></div>';
  }
  // the sheet's number, its picks and the slider at n, and the row behind it (no new drawing: the slider keeps its drag)
  function rivPaint(n) {
    const sh = $('.sheet.riv', app); if (!sh) return;
    $('.rnum b', sh).textContent = n; $('.rnum span', sh).textContent = rivSub(n);
    for (const b of sh.querySelectorAll('.rquick button')) b.setAttribute('aria-pressed', String(+b.dataset.act.slice(6) === n));
    const r = $('.rslide', sh); if (+r.value !== n) r.value = n; r.style.setProperty('--p', (n / Math.max(1, +r.max) * 100).toFixed(2) + '%');
    const o = $('#s-track .trow .opp button', app); if (o) { $('b', o).textContent = n; o.setAttribute('aria-label', 'Opponents: ' + n + '. Choose how many'); }
  }
  const rivSet = (n) => { if (n !== G.S.rivals) G.setOption('rivals', n); rivPaint(n); };

  /* ---------------- rendering ---------------- */
  const VIEWS = { title: vTitle, track: vTrack };
  let preT = 0;   // (the track shown: its land on the globe loaded after a moment)
  function render(keepScroll) {
    if (!app) return;
    const sc = $('.scroll', app), top = keepScroll && sc ? sc.scrollTop : 0;
    for (const n of [...app.children]) if (!n.classList.contains('toast') && !n.classList.contains('intro') && !n.classList.contains('izb') && !n.classList.contains('zem') && !n.classList.contains('wxl')) n.remove();   // (the intro, if there is one, stays over everything; the quick list and the Earth over the screen; the weather's canvases: js/menu-vreme.js)
    rested = null;
    app.classList.toggle('on-title', screen === 'title');
    app.insertAdjacentHTML('afterbegin', VIEWS[screen]());
    if (keepScroll && shown === screen) $('.scr', app).classList.add('still');   // an update in place (a choice, a sheet): no slide-in again
    if (keepScroll) { const n = $('.scroll', app); if (n) n.scrollTop = top; }
    if (screen === 'title') { const pn = $('.title-panel', app); if (!titleSub) panelH = pn.offsetHeight; else if (panelH) pn.style.minHeight = panelH + 'px'; }   // (Single race and Career open in the same frame, as tall)
    if (!$('.intro', app)) wx.detach();   // (the old rain: the intro's only)
    if (screen === 'track' && shown !== 'track' && window.Journey) Journey.preload(G.S.lastTrack ? [G.S.lastTrack] : []);   // (the globe before a race: the Earth, and where it starts)
    if (screen === 'track') {   // (and the track shown: its helicopter's flight; its land on the globe once it has been looked at a moment)
      const tt = curTrack(); if (tt && RT[tt.id] && hasFlight(tt.id)) heliData(tt.id);
      clearTimeout(preT); if (tt && window.Journey && RT[tt.id]) preT = setTimeout(() => { if (screen === 'track') Journey.preload([tt.id]); }, 1200);
    }
    if (screen === 'track') ringFit();   // (on its side: the carousel's scale before anything measures the screen)
    fitWhere(); signOn(); flyLabels(); cornerOn(); fitMaps(); globe.on(); graphOn(); carOn();
    const M = MV(), ts = M && screen === 'track' && $('#s-track', app);   // (the weather over the screen, after the car: its outline)
    if (ts) M.on(ts, wxLook(), { entering: shown !== 'track', tap: wxTap, app }); else if (M) M.off();
    wxTap = null;
    shown = screen;
    if (sheet) { app.insertAdjacentHTML('beforeend', typeof sheet === 'function' ? sheet() : sheet); if (sheetOn) $('.sheet-bg', app).classList.add('still'); }
    sheetOn = !!sheet;
    const chip = $('.chips [aria-pressed="true"]', app); if (chip) chip.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  /* ---------------- a race: the intro before it ----------------
     The intro (the Race intro setting: Full, Short or Off): on the stage where the track screen had its map or flyover, the globe from
     the last race's map to this track (Full, unless it is the same track again), then the helicopter's flight over the whole run (heli-<id>.webm:
     one shot, the places along it marked in 3D over the video), the country's own music under it all (and the helicopter's rotor under the
     flight). Over the stage the track, its country and flag, the music switch and Skip; under it what the race is and the track's numbers,
     its height along the run with the helicopter's point on it. The race is loaded under it (Menu -> bridge.launch): Skip, or the end of
     the flight, is the start. A track without a flight goes straight on. */
  let ixRaf = 0;
  // the settings the intro reads, as the mockup's lists had them: 0 is the first choice (Sound/Music: On; Race intro: Full)
  const setting = (id) => id === 'intro' ? (G.S.intro | 0) : id === 'music' ? (G.S.music ? 0 : 1) : id === 'sound' ? (G.S.sound ? 0 : 1) : 0;
  const heliCache = {}, hasFlight = (id) => !(XI[id] && XI[id].flight === false);   // (a track leaving the game before its release has no helicopter flight)
  const heliData = (id) => heliCache[id] || (heliCache[id] = fetch('assets/maps/heli-' + id + '.json').then(r => r.ok ? r.json() : null).catch(() => null).then(j => { if (!j) delete heliCache[id]; return j; }));   // (a failure is not kept: the next intro asks again)
  const MUSIC_DROP = 20.0, MUSIC_LEVEL = 4.5;   // (the music's drop is 20 s into its file; it falls where the helicopter levels out, 4.5 s into its video)
  // where the track screen's stage is (the intro's video goes exactly there), or where it would be
  function stageRect() {
    const A = app.getBoundingClientRect(), s = $('#track-stage', app), r = s && s.getBoundingClientRect();
    if (r && r.width > 100 && r.height > 100) return { x: r.left - A.left, y: r.top - A.top, w: r.width, h: r.height };
    const h = Math.round(Math.min(330, Math.max(190, A.height * 0.36)));
    return { x: 0, y: 104, w: A.width, h };
  }
  // where the track screen's card is (the intro's numbers go there, down to the foot of the screen), or under the stage
  function cardRect(st) {
    const A = app.getBoundingClientRect(), c = $('#s-track .trow', app), r = c && c.getBoundingClientRect();
    const ok = r && r.width > 100 && (r.top - A.top > st.y + st.h - 24 || r.left - A.left >= st.x + st.w - 2);   // (under the stage (the room a little over its foot: --ov), or beside it where the screen is on its side)
    return ok ? { x: r.left - A.left, y: r.top - A.top, w: r.width } : { x: 12, y: st.y + st.h + 16, w: A.width - 24 };
  }
  // the track's numbers: from the game's data (data.js) and its run (routes.js: the heights along it)
  function specsOf(t) {
    const R = RT[t.id], M = D.routeMaps[t.id] || {}, X = D.intro.specs, out = [];
    const H = R ? R.prof.map(h => altOf(R, M, h)) : null, n = H ? H.length : 0;
    const len = (km) => km.toFixed(2) + ' km';
    if (t.group === 'circuit') out.push([X.lap, len(t.km)]); else out.push([X.length, len(t.km)]);
    if (H && H[0] != null) {
      const hi = Math.max(...H), lo = Math.min(...H), step = R.len / Math.max(1, n - 1), w = Math.max(1, Math.round(100 / step));
      let grade = 0; for (let i = w; i < n; i++) grade = Math.max(grade, Math.abs(R.prof[i] - R.prof[i - w]) / (w * step) * 100);   // (the game's own heights over its own distances: a shortened road's real heights would steepen it)
      if (R.open && M.alt) { out.push([X.start, num(M.alt[0]) + ' m']); out.push([X.finish, num(M.alt[1]) + ' m']); out.push([X.climb, '+' + num(Math.round(M.alt[1] - M.alt[0])) + ' m']); }
      else { out.push([X.top, num(Math.round(hi)) + ' m']); out.push([X.rise, num(Math.round(hi - lo)) + ' m']); }
      if (grade >= 2) out.push([X.grade, Math.round(grade) + ' %']);
    }
    out.push([X.corners, String(t.corners)]);
    out.push([X.surface, M.surface || D.intro.surface]);
    out.push([X.record, t.rec[1]]);
    return out.slice(0, 8);
  }
  // the summit in the corner over the video: a road over a mountain (the race's top and its name), else a circuit's highest point
  function summitOf(id) {
    const t = trackById(id); if (!t) return null; const R = RT[id], M = D.routeMaps[id] || {}, nm = XI[id] && XI[id].summit;
    const H = R ? R.prof.map(h => altOf(R, M, h)) : null, top = M.alt ? Math.max(M.alt[0], M.alt[1]) : H && H[0] != null ? Math.max(...H) : null;
    if (top == null) return null;
    return { b: (nm || (R && R.open && M.alt) ? D.intro.summit : D.intro.top) + ' ' + num(Math.round(top)) + ' m', s: nm || '' };   // (a road over a mountain: its summit, named or not)
  }
  // the height profile in the card: the run's real heights (their scale at the right, the kilometres under it), a line down from each
  // place marked over the video, the helicopter's point. Returns { svg, at(f): the point a fraction f along the run }
  function profileOf(t, W, Hh) {
    const R = RT[t.id], M = D.routeMaps[t.id] || {}; if (!R || W < 120 || Hh < 40) return null;
    const H = R.prof.map(h => altOf(R, M, h)); if (H[0] == null) return null;
    const n = H.length, lo = Math.min(...H), hi = Math.max(...H), span = Math.max(hi - lo, t.group === 'circuit' ? 60 : 120), a = (lo + hi) / 2 - span / 2, b = a + span;
    const PX = W - 54, PT = 8, PB = Hh - 17, x = (f) => f * PX, y = (h) => PB - (h - a) / (b - a) * (PB - PT), hAt = (f) => { const i = Math.min(n - 1, Math.max(0, f * (n - 1))), i0 = Math.min(n - 2, Math.floor(i)); return H[i0] + (H[i0 + 1] - H[i0]) * (i - i0); };
    const line = H.map((h, i) => (i ? 'L' : 'M') + x(i / (n - 1)).toFixed(1) + ' ' + y(h).toFixed(1)).join('');
    const km = R.len / 1000, stp = [0.5, 1, 2, 2.5, 5, 10, 20].find(v => km / v <= 4.6) || 20, ticks = [];
    for (let d = 0; d <= km + 1e-6; d += stp) ticks.push(d);
    const axis = ticks.map((d, i) => { const xx = x(d / km); return '<text class="km" x="' + xx.toFixed(1) + '" y="' + (Hh - 3) + '" text-anchor="' + (i ? 'middle' : 'start') + '">' + (Math.round(d * 10) / 10) + (i === ticks.length - 1 ? ' km' : '') + '</text><path class="kt" d="M' + xx.toFixed(1) + ' ' + PB + 'v3"/>'; }).join('');
    const marks = ((XI[t.id] && XI[t.id].marks) || []).map(m => { const f = Math.min(1, Math.max(0, m[2] / R.len)), xx = x(f), yy = y(hAt(f)); return '<g class="lm" data-n="' + esc(m[0]) + '"><path d="M' + xx.toFixed(1) + ' ' + PB + 'V' + (yy + 2.5).toFixed(1) + '"/><circle cx="' + xx.toFixed(1) + '" cy="' + yy.toFixed(1) + '" r="2.6"/></g>'; }).join('');
    const near = y(lo) - y(hi) < 13, yl = (h, cls) => '<path class="gl" d="M0 ' + y(h).toFixed(1) + 'H' + PX + '"/><text class="' + cls + '" x="' + (W - 2) + '" y="' + (y(h) + (!near ? 3.4 : cls === 'hi' ? -2.5 : 9.5)).toFixed(1) + '" text-anchor="end">' + num(Math.round(h)) + ' m</text>';   // (the two heights close: one over its line, one under)
    const svg = '<svg class="ix-prof" viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" aria-hidden="true"><defs><linearGradient id="ixpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd23a" stop-opacity=".34"/><stop offset="1" stop-color="#ffd23a" stop-opacity="0"/></linearGradient></defs>' +
      yl(hi, 'hi') + (hi - lo > 1 ? yl(lo, 'lo') : '') + '<path class="ar" d="' + line + 'L' + PX + ' ' + PB + 'L0 ' + PB + 'z" fill="url(#ixpg)"/><path class="base" d="M0 ' + PB + 'H' + PX + '"/>' + axis +
      '<clipPath id="ixpc"><rect class="clip" x="-4" y="-10" width="0" height="' + (Hh + 20) + '"/></clipPath><path class="ln" d="' + line + '"/><path class="done" d="' + line + '" clip-path="url(#ixpc)"/>' + marks +
      '<g class="pt" transform="translate(0 ' + y(H[0]).toFixed(1) + ')"><circle r="7.5" class="halo"/><circle r="3.8"/></g></svg>';
    return { svg, at: (f) => [x(f), y(hAt(f))] };
  }
  // the track's outline in the card: the route as on its map (its shape and turn), its start and finish, the places marked over the
  // video, the helicopter's point going round. Returns { svg, at(f) }
  function layoutOf(t, W, Hh) {
    const R = RT[t.id], T = R && R.top; if (!T || W < 120 || Hh < 70) return null;
    const P = T.route; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const pad = 16, sc = Math.min((W - 2 * pad) / Math.max(1, x1 - x0), (Hh - 2 * pad - 12) / Math.max(1, y1 - y0)), ox = (W - (x1 - x0) * sc) / 2, oy = (Hh - (y1 - y0) * sc) / 2 + 6;
    const Q = P.map(p => [ox + (p[0] - x0) * sc, oy + (p[1] - y0) * sc]), cum = [0]; for (let i = 1; i < Q.length; i++) cum.push(cum[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]));
    const L = cum[cum.length - 1] || 1, at = (f) => { const d = Math.min(1, Math.max(0, f)) * L; let i = 1; while (i < Q.length - 1 && cum[i] < d) i++; const u = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return [Q[i - 1][0] + (Q[i][0] - Q[i - 1][0]) * u, Q[i - 1][1] + (Q[i][1] - Q[i - 1][1]) * u]; };
    const d = pathD(Q.map(q => [q[0].toFixed(1), q[1].toFixed(1)])), flag = (q, fin) => '<g class="mk" transform="translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ') scale(.5)"><circle r="6"/>' + flagSvg(fin) + '</g>';
    const marks = ((XI[t.id] && XI[t.id].marks) || []).map(m => { const q = at(m[2] / R.len); return '<circle class="lm" data-n="' + esc(m[0]) + '" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3.2"/>'; }).join('');
    const svg = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" aria-hidden="true"><path class="o" d="' + d + '"/><path class="b" d="' + d + '"/><path class="done" d="' + d + '" pathLength="1" stroke-dasharray="0 1"/>' + marks +
      (R.open ? flag(Q[0], false) + flag(Q[Q.length - 1], true) : flag(Q[0], true)) + '<g class="pt" transform="translate(' + Q[0][0].toFixed(1) + ' ' + Q[0][1].toFixed(1) + ')"><circle r="8" class="halo"/><circle r="4"/></g></svg>';
    return { svg, at };
  }
  const countryOf = (t) => t.country || (window.GEO && GEO.tracks[t.id] ? GEO.tracks[t.id].names.country : '');
  // the country's flag over the intro and the weekend (assets/flags, in its own proportions); a track in another country has none
  const flagSvgOf = (c) => { const f = flagUrl(c); return f ? '<img class="ix-flag" src="' + f + '" alt="Flag of ' + esc(c) + '">' : ''; };
  const SPK = (on) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9h4l5-4v14l-5-4h-4z" fill="#fff"/>' + (on ? '<path d="M15.5 8.5a5 5 0 0 1 0 7M18.2 6a8.6 8.6 0 0 1 0 12" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' : '<path d="M16 9.5l5 5M21 9.5l-5 5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>') + '</svg>';
  // the last race's map, as the menu's map shows it on a stage of this size (the globe's first picture): its route, its flags
  function introMap(id) {
    const t = trackById(id), R = RT[id], M = D.routeMaps[id] || {}; if (!t || !R || !R.top) return '';
    const T = R.top, rally = t.group === 'rally';
    return '<div class="ixmap topmap' + (rally ? ' rally' : '') + '" data-map="' + id + '"><svg class="mapsvg" viewBox="0 0 ' + T.W + ' ' + T.H + '" preserveAspectRatio="xMidYMid slice">' +
      '<image href="assets/maps/top-' + id + '.webp" width="' + T.W + '" height="' + T.H + '"/>' +
      '<path class="rt-o" d="' + pathD(T.route) + '"/><path class="rt" d="' + pathD(T.route) + '"/>' + (rally ? '<path class="rt-c" d="' + pathD(T.route) + '"/>' : '') + marks(R, M, T.route, rally) + '</svg></div>';
  }
  // fitted as fitMaps does (the route as big as fits, the flags their own size); returns the stage's view of it: its middle and height in
  // the map's pixels
  function fitIntroMap(box) {
    const T = RT[box.dataset.map].top, svg = $('svg', box), W = box.clientWidth, H = box.clientHeight;
    if (!T.bb) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of T.route) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } T.bb = [x0, y0, x1, y1]; }
    const [x0, y0, x1, y1] = T.bb, cover = Math.max(W / T.W, H / T.H), fit = Math.min((W - 40) / (x1 - x0), (H - 70) / (y1 - y0)), s = Math.max(cover, Math.min(fit, 0.72)), k = 0.5 / s;
    const vw = W / s, vh = H / s, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + 10 / s;
    const vx = Math.min(Math.max(0, cx - vw / 2), Math.max(0, T.W - vw)), vy = Math.min(Math.max(0, cy - vh / 2), Math.max(0, T.H - vh));
    svg.setAttribute('viewBox', vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1)); svg.style.setProperty('--k', k.toFixed(3));
    for (const g of svg.querySelectorAll('.mk')) { if (!g.dataset.at) g.dataset.at = g.getAttribute('transform'); g.setAttribute('transform', g.dataset.at + ' scale(' + k.toFixed(3) + ')'); }
    return { cx: vx + vw / 2, cy: vy + vh / 2, vh };
  }
  // a pixel of a track's map on the Earth (intro_data.py fitted the map's pixels to the world's metres; GEO places the world)
  function mapLL(id, px, py) {
    const f = XI[id] && XI[id].top && XI[id].top.fit, G = window.GEO && GEO.tracks[id]; if (!f || !G || !window.Journey) return null;
    const [A, B, tx, ty] = f, q = A * A + B * B, dx = px - tx, dy = py - ty, x = (A * dx + B * dy) / q, z = (-B * dx + A * dy) / q;
    return Journey.gameLL(G, x, z);
  }
  function mapStart(id, view) {   // the globe's first view: the stage's map from straight above (its middle, its up, its height in km)
    const f = XI[id].top.fit, G = GEO.tracks[id], [A, B] = f, q = A * A + B * B, c = mapLL(id, view.cx, view.cy); if (!c) return null;
    const dx = -B / q, dz = -A / q, r = G.rot * Math.PI / 180, east = dx * Math.cos(r) + dz * Math.sin(r), north = dx * Math.sin(r) - dz * Math.cos(r);
    return { lat: c.lat, lon: c.lon, h: ((G.start[2] + G.finish[2]) / 2) / 1000, heading: Math.atan2(east, north) * 180 / Math.PI, extent: view.vh / Math.sqrt(q) / 1000 };
  }
  // the places over the video: each frame, the helicopter's camera (its bank too) as the video's, then the video as it covers the stage
  const pinCam = window.THREE ? new THREE.PerspectiveCamera(50, 1.5, 5, 1e6) : null, pv3 = window.THREE ? new THREE.Vector3() : null;
  function heliCamAt(Hd, k) {
    const c = Hd.cam[Math.max(0, Math.min(Hd.cam.length - 1, k))], P = new THREE.Vector3(c[0], c[1], c[2]), T = new THREE.Vector3(c[3], c[4], c[5]);
    const f = T.clone().sub(P).normalize(), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, f), ph = c[6] || 0;
    pinCam.fov = Hd.fov || 50; pinCam.aspect = Hd.W / Hd.H; pinCam.position.copy(P); pinCam.up.copy(u.multiplyScalar(Math.cos(ph)).addScaledVector(r, Math.sin(ph))); pinCam.lookAt(T);
    pinCam.updateProjectionMatrix(); pinCam.updateMatrixWorld(); pinCam.matrixWorldInverse.copy(pinCam.matrixWorld).invert();
    return P.distanceTo(T);
  }
  /* ---------------- a circuit race: the race weekend, the intro before it ----------------
     In Circuit race on a circuit the intro is the weekend's calendar (Race intro Off: none, straight on): the track from afar behind it
     (the first frame of its helicopter's flight, coming slowly closer, the start · finish marked on it; a track without a flight: its model),
     Saturday's qualifying and Sunday's race on two pages, each with that day's weather (the race's own, wet or dry; the rest a picture of
     the day: the game drives no temperature or wind). Qualifying is off until it is switched on on Saturday's page (the game's setting
     S.quali: remembered): off, Race! starts the race from the back of the grid; on, the qualifying lap comes first. The track is loaded under
     it (Menu -> bridge.launch): the choice is the start; Back goes back to the track screen. */
  const weekendOn = (t, m) => m === 'race' && setting('intro') !== 2 && G.qualiCan(t.def);
  const WK_TIME = { dawn: '07:00', day: '14:00', dusk: '19:30', night: '22:00' };
  const wkMin = (sec) => sec >= 5400 ? '~' + Math.round(sec / 3600) + ' h' : '~' + Math.max(1, Math.round(sec / 60)) + ' min';
  // the two days' weather, [Saturday, Sunday], each { k: the sky (D.weekend.sky), t: °C, wind: km/h }: wet, both wet (qualifying is driven
  // in the race's weather); dry, one sunny and one mostly sunny (clear at night), a few degrees apart; the same each time for a track.
  // Changing: Sunday changeable, Saturday as the race starts (wet: the rain stops during it; G.rollWet)
  function weekendSky(t, wet) {
    const S = G.S, h = [...t.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7), sat = h % 2;
    const t0 = ({ summer: 23, autumn: 13, winter: 2 }[S.season] ?? 20) + ({ dawn: -6, dusk: -3, night: -7 }[S.tod] || 0) + (h >>> 3) % 5 - 2, dT = 2 + (h >>> 9) % 4;
    const day = (i, k, dt) => ({ k, t: Math.round(t0 + dt), wind: 3 + (h >>> (5 + i * 4)) % 12 });
    const fine = S.tod === 'night' ? ['clear', 'clear'] : sat ? ['sun', 'part'] : ['part', 'sun'];
    if (S.weather === 'change') return [wet ? day(0, 'rain', -3) : day(0, fine[0], sat ? -dT : 0), day(1, 'change', wet ? -4 : sat ? 0 : -dT)];
    if (wet) { const k = S.weather === 'storm' ? 'storm' : 'rain'; return [day(0, k, -3), day(1, k, -4)]; }
    return [day(0, fine[0], sat ? -dT : 0), day(1, fine[1], sat ? 0 : -dT)];
  }
  // a day's weather drawn for the page (the paper is light: the sun gold, a cloud white, rain under a dark one)
  function skyIcon(k, w) {
    const sun = (tr) => '<g' + (tr ? ' transform="' + tr + '"' : '') + '><circle cx="12" cy="12" r="5" fill="#f0a020"/><path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M4.8 19.2l2.1-2.1M17.1 6.9l2.1-2.1" stroke="#f0a020" stroke-width="2" stroke-linecap="round"/></g>';
    const cloud = (f, c) => '<path d="M11 21.5a3.6 3.6 0 0 1 .5-7.2 4.6 4.6 0 0 1 8.7 1.2 3 3 0 0 1-.3 6z" fill="' + f + '" stroke="' + c + '" stroke-width="1.1"/>';
    const rain = '<path d="M6.5 15a4.5 4.5 0 0 1 .7-8.9A6 6 0 0 1 18.4 8 3.6 3.6 0 0 1 18 15z" fill="#3d4757"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" stroke="#1f78b4" stroke-width="2" stroke-linecap="round"/>';
    const g = k === 'sun' ? sun() : k === 'part' ? sun('translate(-2 -2.5)') + cloud('#fff', '#9aa6b8') : k === 'clear' ? '<path d="M15.5 3.5a8.5 8.5 0 1 0 5 15.2A7 7 0 0 1 15.5 3.5z" fill="#d9b23c"/>'
      : k === 'change' ? sun('translate(-2 -2.5)') + cloud('#e9edf3', '#7d8798') + '<path d="M13.2 22.8l-.7 1.5M16.7 22.8l-.7 1.5" stroke="#1f78b4" stroke-width="1.6" stroke-linecap="round"/>'
      : rain + (k === 'storm' ? '<path d="M12.6 13l-2.2 4.2h2.6l-1.6 4.3" fill="none" stroke="#ffc629" stroke-width="1.7" stroke-linejoin="round"/>' : '');
    return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '" style="overflow:visible" aria-hidden="true">' + g + '</svg>';
  }
  const WK_WATCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14" r="8" fill="none" stroke="#ffc629" stroke-width="2"/><path d="M12 14V9.4M9.4 2.6h5.2M12 2.6v3.2M18.6 6.4l1.6-1.6" stroke="#ffc629" stroke-width="2" stroke-linecap="round"/></svg>';
  function weekend(R, go) {
    const t = R.track, X = D.weekend, W = G.weekend(t.def), sky = weekendSky(t, R.wet), country = countryOf(t), S = G.S;
    const fly = !!RT[t.id] && hasFlight(t.id), time = WK_TIME[S.tod] || '14:00', n = W.cars;
    const el = document.createElement('div'); el.className = 'intro wk' + (S.quali ? ' on' : '') + (fly ? '' : ' model'); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', X.kick);
    const page = (k, d) => {
      const q = k === 'q';
      return '<div class="wk-pg wk-' + k + '"><div class="wk-hd">' + esc((q ? X.sat : X.sun).toUpperCase()) + '</div>' +
        '<div class="wk-dw"><div class="wk-row">' + skyIcon(d.k, 52) + '<span class="wk-tmp">' + d.t + '<sup>°</sup></span></div><span class="wk-wd"><em>' + esc(X.sky[d.k]) + '</em> · ' + d.wind + ' km/h</span></div>' +
        '<div class="wk-ses"><b class="wk-t">' + time + '</b><span class="wk-line"><span class="wk-sname">' + esc(q ? X.quali : X.race) + '</span> <span class="wk-sdet">' + wkMin(q ? W.quali : W.race) + '</span></span></div>' +
        (q ? '<div class="wk-ft"><button class="wk-sw" data-wk="q" role="switch" aria-checked="' + !!S.quali + '" aria-label="' + esc(X.switch) + '"><i></i></button></div><span class="wk-stamp" data-off>' + esc(X.skipped.toUpperCase()) + '</span>'
          : '<div class="wk-ft"><span class="wk-gl">' + esc(X.grid.toUpperCase()) + '</span><span class="wk-pos" data-off>P' + n + '<u>/' + n + '</u></span><span class="wk-pos" data-on>P1–' + n + '</span></div>') + '</div>';
    };
    const sun = sky[1], wet = (R.wet && sun.k !== 'change') || sun.k === 'storm';   // (Changing: its own sky, may change, wet at the start or not)
    el.innerHTML = '<div class="wk-bg" aria-hidden="true"><div class="wk-pic"><img src="' + (fly ? 'assets/maps/heli-' + t.id + '.webp' : trackImg(t, R.wet)) + '" alt=""><div class="wk-pin"></div></div></div>' +
      '<div class="wk-head"><button class="sq" data-wk="back" aria-label="' + esc(X.back) + '">' + I.back + '</button><div class="ix-name">' + flagSvgOf(country) + '<h2>' + esc(t.name) + (country ? '<small>' + esc(country) + '</small>' : '') + '</h2></div></div>' +
      '<span class="wk-wx' + (wet ? ' wet' : '') + '">' + (wet ? I.rain : skyIcon(sun.k === 'change' ? 'part' : sun.k, 20)) + esc(X.sky[sun.k].toUpperCase()) + '<small>· ' + esc(wet ? X.track.wet : sun.k === 'change' ? X.track.change : X.track.dry) + '</small></span>' +
      '<div class="wk-pnl"><div class="wk-ttl"><p class="wk-kick">' + esc(X.kick) + '</p><h1>' + esc(X.title) + '</h1><p class="wk-what"><b>' + esc(X.mode) + '</b> · ' + esc(G.car().name) + ' · ' + laps(W.laps) + ' · ' + n + ' cars</p></div>' +
        '<div class="wk-cal">' + page('q', sky[0]) + page('r', sky[1]) + '</div>' +
        '<p class="wk-note" data-off>' + WK_WATCH + esc(X.hint) + '</p><p class="wk-note" data-on>' + esc(X.onNote) + '</p>' +
        '<button class="go wk-go" data-wk="go" data-off>' + esc(X.go) + '<small>' + esc(X.goSub.toUpperCase()) + '</small></button><button class="go gold wk-go" data-wk="go" data-on>' + esc(X.goQ) + '<small>' + esc(X.goQSub.toUpperCase()) + '</small></button></div>';
    app.appendChild(el);
    // the picture in the room the calendar leaves (above it upright, left of it on its side): the helicopter's frame covers it, a model fits in it
    const pic = $('.wk-pic', el);
    const fit = () => {
      if (!el.isConnected) { removeEventListener('resize', fit); return; }
      const A = app.getBoundingClientRect(), P = $('.wk-pnl', el).getBoundingClientRect(), side = A.width > A.height;
      const w = side ? Math.max(120, P.left - A.left) : A.width, h = side ? A.height : Math.max(120, P.top - A.top + 24);
      const pw = fly ? Math.max(w, h * 1.5) : w, ph = fly ? pw / 1.5 : h;
      el.style.setProperty('--wk-y', Math.round(P.top - A.top) + 'px'); el.style.setProperty('--wk-x', Math.round(P.left - A.left) + 'px');   // (where the calendar begins: the picture darkens into it)
      Object.assign(pic.style, { left: (w / 2 - pw / 2).toFixed(1) + 'px', top: (h / 2 - ph / 2 + (side || !fly ? 0 : 10)).toFixed(1) + 'px', width: pw.toFixed(1) + 'px', height: ph.toFixed(1) + 'px' });
    };
    fit(); addEventListener('resize', fit);
    // the start · finish on the helicopter's first frame (its camera from the flight's data, as the intro marks its places)
    if (fly && pinCam) heliData(t.id).then((H) => {
      const m = H && H.marks && H.marks.find(x => /^start/i.test(x[0])); if (!m || !el.isConnected) return;
      heliCamAt(H, 0); pv3.set(m[2], m[3], m[4]).project(pinCam);
      if (pv3.z > 1 || Math.abs(pv3.x) > 0.95 || Math.abs(pv3.y) > 0.9) return;
      const pin = $('.wk-pin', el); pin.style.left = ((pv3.x + 1) / 2 * 100).toFixed(2) + '%'; pin.style.top = ((1 - pv3.y) / 2 * 100).toFixed(2) + '%';
      pin.innerHTML = '<span><b>' + esc(m[0].toUpperCase()) + '</b></span><i></i>'; pin.classList.add('on');
    });
    const close = () => { removeEventListener('resize', fit); el.remove(); };
    const ctl = el.__wk = {
      back() { close(); render(); },
      go() { close(); go(); },
      quali() {
        const on = !G.S.quali; G.setOption('quali', on ? 1 : 0);
        el.classList.toggle('on', on); $('.wk-sw', el).setAttribute('aria-checked', String(on));
      },
    };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-wk]'); if (!b) return;
      G.click(); ({ back: ctl.back, go: ctl.go, q: ctl.quali })[b.dataset.wk]();
    });
  }
  function beforeRace(R, go) {
    cancelAnimationFrame(ixRaf); ixStop();
    const t = R.track, under = $('#track-stage .dio.fly video', app); if (under) under.pause(); cancelAnimationFrame(flyRaf); cancelAnimationFrame(graphRaf);
    if (window.MenuCar) MenuCar.rest();   // (the car's canvas: its buffers freed for the race)
    shown = '';   // (after the race the screen it was started from is entered afresh: its weather as it is, not faded in again)
    const off = setting('intro') === 2, rect = stageRect();
    wx.detach(); if (MV()) MV().off();
    if (R.kind === 'single' && weekendOn(t, R.mode)) { weekend(R, go); return; }   // (Circuit race: the race weekend's calendar is the intro)
    const el = document.createElement('div'); el.className = 'intro ix2'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Before the race');
    app.appendChild(el);
    const finishIntro = (e) => { if (e.isConnected) e.remove(); go(); };   // (the race is loaded: on to its start lights)
    if (off || !RT[t.id] || !hasFlight(t.id)) { finishIntro(el); return; }   // (Off, or a track without a flight: the lights at once)
    // Full: the globe from the last race (not the same track again: the short one then), with WebGL, for someone who did not ask for less motion
    const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, from = G.S.lastTrack && G.S.lastTrack !== t.id && XI[G.S.lastTrack] && XI[G.S.lastTrack].top && trackById(G.S.lastTrack) ? G.S.lastTrack : null;
    const globe = setting('intro') === 0 && G.S.lastTrack !== t.id && !calm && window.Journey && window.GEO && GEO.tracks[t.id] && Journey.supported();
    const country = countryOf(t), car = G.car();
    const what = [modeOf(R.mode).name, car && car.name, R.mode === 'race' && !t.def.open ? laps(t.laps) : null, G.S.weather === 'change' && !R.trial ? 'Changing' : R.wet ? 'Rain' : 'Dry'].filter(Boolean).join(' · ');
    // (on its side: the title and the buttons over the card, the stage the whole height at the left; upright with the stage from the screen's
    // top, as the track step has it: the title and the buttons over the picture's top, as the race weekend's head)
    const cr = cardRect(rect), side = cr.x >= rect.x + rect.w - 2, over = !side && rect.y < 60;
    el.innerHTML = '<div class="ix-head2' + (over ? ' over' : '') + '" style="' + (side ? 'left:' + Math.round(cr.x) + 'px;height:' + Math.round(cr.y) + 'px' : over ? '' : 'height:' + Math.round(rect.y) + 'px') + '"><div class="ix-name">' + flagSvgOf(country) + '<h2>' + esc(t.name) + (country ? '<small>' + esc(country) + '</small>' : '') + '</h2></div>' +
      '<div class="ix-ctl"><button class="ix-mus" data-ix="music" aria-pressed="' + (setting('music') === 0) + '" aria-label="' + esc(D.intro.music) + '">' + SPK(setting('music') === 0) + '</button><button class="ix-skip" data-ix="skip">' + esc(D.intro.skip) + I.chev + '</button></div></div>' +
      '<div class="ix-v ix-stage' + (globe ? ' jon' : '') + (over ? ' hd' : '') + '" style="left:' + rect.x + 'px;top:' + rect.y + 'px;width:' + rect.w + 'px;height:' + rect.h + 'px">' +
        '<video muted playsinline preload="auto" poster="assets/maps/heli-' + t.id + '.webp" src="' + vidSrc('heli-' + t.id + '.webm') + '"></video>' + (globe && from ? introMap(from) : '') +
        '<div class="ix-pins" aria-hidden="true"></div><div class="ix-summit" aria-live="polite"><b></b><small></small></div></div>' +
      '<div class="card ix-card" style="left:' + cr.x + 'px;top:' + cr.y + 'px;width:' + cr.w + 'px"><p class="ix-what">' + esc(what.toUpperCase()) + '</p><div class="ix-specs">' + specsOf(t).map(s => '<div><small>' + esc(s[0]) + '</small><b>' + esc(s[1]) + '</b></div>').join('') + '</div>' +
        '<div class="ix-lay"></div><div class="ix-pwrap"></div></div>';
    const v = $('video', el), box = $('.ix-stage', el), pins = $('.ix-pins', el), sumEl = $('.ix-summit', el), mapEl = $('.ixmap', el);
    // the outline and the profile in what room the card has: the outline as tall as its shape needs, the profile the rest (84 to 140 px);
    // no outline in a small card (the profile takes its room)
    const lay = $('.ix-lay', el), pw = $('.ix-pwrap', el), cw = pw.clientWidth, room = lay.clientHeight + pw.clientHeight, T0 = RT[t.id] && RT[t.id].top;
    let nat = 0; if (T0) { let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9; for (const p of T0.route) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } nat = (y1 - y0) * (cw - 32) / Math.max(1, x1 - x0) + 44; }
    const big = room >= 200 && T0, ph = big ? Math.max(84, Math.min(140, room - Math.max(96, nat))) : Math.max(56, Math.min(180, room));
    const LO = big ? layoutOf(t, cw, room - ph) : null, PR = profileOf(t, cw, ph);
    if (LO) lay.innerHTML = LO.svg; else lay.remove();
    if (PR) pw.innerHTML = PR.svg; else pw.remove();
    const prof = $('.ix-prof', el), laySvg = LO && $('svg', lay), view0 = globe && from && mapEl ? fitIntroMap(mapEl) : null;   // (the last race's map fitted at once)
    const showSummit = (which) => {   // (the last race's summit while close over its map, this one's once close over this track)
      const s = which ? summitOf(which === 'from' ? from : t.id) : null;
      if (!s) { sumEl.classList.remove('on'); return; }
      $('b', sumEl).textContent = s.b; $('small', sumEl).textContent = s.s; sumEl.classList.add('on');
    };
    // the music: the country's own, its drop where the helicopter levels out; the rotor under the flight (the Sound and Music settings)
    const sound = setting('sound') === 0, mus = XI[t.id] && XI[t.id].music;
    const A = sound && mus ? voice('assets/music/' + mus + '.mp3') : null, Rt = sound ? voice('assets/music/rotor.mp3', true) : null;
    if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
    for (const o of [A, Rt]) if (o) { const p = o.a.play(); if (p && p.then) p.then(() => { if (!o.a.__go) o.a.pause(); }).catch(() => {}); }   // (unlocked silent in the tap itself: later they may start on their own)
    { const p = v.play(); if (p && p.then) p.then(() => { if (!shots) v.pause(); }).catch(() => {}); }   // (the video too: some browsers start one later only so)
    const vol = { m: 0, r: 0, mt: 0, rt: 0 }, musicOn = () => setting('music') === 0;
    let mAt = -1;   // (when the music is to start, on the page's clock, and from where in its file)
    const startMusic = (fileT) => { if (!A) return; A.a.__go = true; try { A.a.currentTime = Math.max(0, fileT); } catch (_) { /* not loaded yet */ } const p = A.a.play(); if (p && p.catch) p.catch(() => {}); vol.mt = musicOn() ? 0.9 : 0; };
    let shots = false, done = false, J = null, Hd = null, pinsOn = !globe, globeRan = false, vErr = false;   // (the places over the video: once the globe has handed over)
    const quit = () => { done = true; cancelAnimationFrame(ixRaf); v.pause(); if (J) J.skip(); wx.detach(); };
    const end = (skip) => {
      if (done) return; quit();
      ixFade(A, skip ? 0.5 : 2.4); ixFade(Rt, skip ? 0.3 : 0.8);   // (at the end the music's last chord rings into the start)
      finishIntro(el);
    };
    const startShots = () => {   // the helicopter's video from its first frame (the globe hands over to it), the rain on it on a wet day
      if (done || shots) return; shots = true; box.classList.remove('jon');
      if (vErr) { end(true); return; }   // (no video: straight to the start, after the globe)
      if (R.wet) wx.attach(box, 'rain', true);
      try { v.currentTime = 0; } catch (_) { /* not loaded yet: it starts at 0 anyway */ }
      const pr = v.play(); if (pr && pr.catch) pr.catch((e) => { if (!done && e && e.name === 'NotAllowedError') end(true); });   // (a browser that will not play it: on to the start)
      if (Rt) { Rt.a.__go = true; const p = Rt.a.play(); if (p && p.catch) p.catch(() => {}); vol.rt = musicOn() ? 0.22 : 0; }
      if (!globeRan && A) startMusic(MUSIC_DROP - MUSIC_LEVEL);   // (the short intro, or no globe after all: the music from 4.5 s before its drop)
      if (!globeRan) showSummit('to');
    };
    v.addEventListener('ended', () => end(false));
    v.addEventListener('error', () => { vErr = true; if (!globe || shots) end(true); });   // (the full intro: its globe first, then the start)
    // (the video waiting for its data: the music waits with it, then goes on with it)
    v.addEventListener('waiting', () => { if (shots && A && A.a.__go && !A.a.paused) { A.a.pause(); A.a.__wait = true; } });
    v.addEventListener('playing', () => { if (A && A.a.__wait && !done) { A.a.__wait = false; try { A.a.currentTime = v.currentTime + MUSIC_DROP - MUSIC_LEVEL; } catch (_) { /* not ready */ } const p = A.a.play(); if (p && p.catch) p.catch(() => {}); } });
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-ix="skip"]')) end(true);
      const mb = e.target.closest('[data-ix="music"]');
      if (mb) { const on = !musicOn(); G.setOption('music', on ? 1 : 0); mb.setAttribute('aria-pressed', String(on)); mb.innerHTML = SPK(on); vol.mt = on && A && A.a.__go ? 0.9 : 0; vol.rt = on && shots ? 0.22 : 0; }
    });
    // each frame: the volumes (eased), the music kept with the video, the places over the video, the profile's point
    const pinEls = [], STEM = [22, 50, 78];
    let lastPT = -1, lastD = -1;
    const layoutPins = () => {
      if (!Hd || !pinCam) return;
      const now = performance.now(), dt = lastPT < 0 ? 0 : Math.min(0.1, (now - lastPT) / 1000), kA = 1 - Math.exp(-dt / 0.11), kS = 1 - Math.exp(-dt / 0.16); lastPT = now;
      const k = Math.min(Hd.n - 1, Math.max(0, Math.round((v.currentTime || 0) * Hd.fps))), dist = heliCamAt(Hd, k), Wb = box.clientWidth, Hb = box.clientHeight, s = Math.max(Wb / Hd.W, Hb / Hd.H), ox = (Wb - Hd.W * s) / 2, oy = (Hb - Hd.H * s) / 2;
      const placed = [];
      if (sumEl.classList.contains('on')) { const r = sumEl.getBoundingClientRect(), b = box.getBoundingClientRect(); placed.push({ x0: r.left - b.left - 8, x1: r.right - b.left + 8, y0: r.top - b.top - 8, y1: r.bottom - b.top + 8 }); }   // (none under the summit's corner)
      const order = Hd.marks.map((m, i) => ({ m, i, d: pinCam.position.distanceTo(pv3.set(m[2], m[3], m[4])) })).sort((a, b) => a.d - b.d);
      const xv = Math.min(1, Wb / (Hd.W * s)), yv = Math.min(1, Hb / (Hd.H * s));   // (how much of the video the stage shows: it covers the stage)
      for (const { m, i, d } of order) {
        const e = pinEls[i]; let vis = shots && pinsOn && d < Math.max(2400, dist * 2.3), on = false, x = 0, y = 0, lv = e.__lv || 0;
        pv3.set(m[2], m[3], m[4]).project(pinCam);
        if (m[6] === 1) {   // (a place the flight never has in its picture, a mountain face beside the road: at the picture's edge, pointing to it, as it is passed)
          if (!e.__w) { const sp = e.firstChild; e.__w = sp.offsetWidth || 80; e.__h = sp.offsetHeight || 30; }
          const w = e.__w, h = e.__h, l = pv3.x < 0;
          on = pv3.z < 1 && Math.abs(pv3.x) < 3.2 && Math.abs(pv3.y) < 1.6;
          vis = vis && on && Math.abs(pv3.x) > xv * 0.9 && Math.abs(pv3.x) < 3 && Math.abs(pv3.y) < 1.4;
          if (on) { x = l ? 16 + w / 2 : Wb - 16 - w / 2; y = Math.min(Hb - h / 2 - 10, Math.max(h / 2 + 30, oy + (1 - pv3.y) / 2 * Hd.H * s)); e.classList.add('edge'); e.classList.toggle('l', l); e.classList.toggle('r', !l); }
          if (vis) { const r = { x0: x - w / 2 - 18, x1: x + w / 2 + 18, y0: y - h / 2 - 4, y1: y + h / 2 + 4 }; if (placed.some(q => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0)) vis = false; else placed.push(r); }
          e.__a = on ? (e.__a || 0) + ((vis ? 1 : 0) - (e.__a || 0)) * kA : 0;
          e.style.opacity = e.__a > 0.01 ? e.__a.toFixed(2) : '0';
          if (on && e.__a > 0.01) e.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
          continue;
        }
        if (pv3.z < 1 && Math.abs(pv3.x) < 1.2 && Math.abs(pv3.y) < 1.2) { on = true; x = ox + (pv3.x + 1) / 2 * Hd.W * s; y = oy + (1 - pv3.y) / 2 * Hd.H * s; }
        if (!on) vis = false;
        if (vis) {   // (the shortest stem whose name is clear of the others and of the picture's edge: its own first, so it does not jump)
          if (!e.__w) { const sp = e.firstChild; e.__w = sp.offsetWidth || 80; e.__h = sp.offsetHeight || 30; }
          const w = e.__w, h = e.__h; let got = -1;
          if (x - w / 2 >= 4 && x + w / 2 <= Wb - 4 && y <= Hb - 6) for (const L of [lv, 0, 1, 2].filter((q, j, A) => A.indexOf(q) === j)) {
            const r = { x0: x - w / 2 - 4, x1: x + w / 2 + 4, y0: y - STEM[L] - h - 3, y1: y - STEM[L] + 3 };
            if (r.y0 < 4 || placed.some(q => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0)) continue;
            got = L; placed.push(r, { x0: x - 4, x1: x + 4, y0: y - STEM[L], y1: y + 4 }); break;
          }
          if (got < 0) vis = false; else lv = got;
        }
        e.__lv = lv; e.__s = e.__s == null ? STEM[lv] : e.__s + (STEM[lv] - e.__s) * kS;
        e.__a = on ? (e.__a || 0) + ((vis ? 1 : 0) - (e.__a || 0)) * kA : 0;
        e.style.opacity = e.__a > 0.01 ? e.__a.toFixed(2) : '0';
        if (on && e.__a > 0.01) { e.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; e.style.setProperty('--s', e.__s.toFixed(1) + 'px'); }
      }
      // the profile's and the outline's points: where the helicopter looks along the run; the places reached turn gold
      if (Hd.d) {
        const Rr = RT[t.id], dNow = Hd.d[k], f = Math.min(1, Math.max(0, dNow / (Rr ? Rr.len : Hd.len)));
        for (const [o, sv] of [[PR, prof], [LO, laySvg]]) {
          if (!o || !sv) continue; const q = o.at(f), clip = sv.querySelector('.clip');
          sv.querySelector('.pt').setAttribute('transform', 'translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')');
          if (clip) clip.setAttribute('width', (q[0] + 4).toFixed(1)); else sv.querySelector('.done').setAttribute('stroke-dasharray', f.toFixed(4) + ' 1');   // (the profile: up to the point's x; the outline: a share of its length, as its point goes)
        }
        if (dNow !== lastD) { lastD = dNow; for (const m of Hd.marks) for (const g of el.querySelectorAll('.lm[data-n="' + CSS.escape(m[0]) + '"]')) g.classList.toggle('on', dNow >= m[5] - 40); }
      }
    };
    const step = () => {
      if (done) return;
      if (!el.isConnected) { stopAll(); return; }   // (the intro taken away under it: everything stops)
      for (const [o, k1, k2] of [[A, 'm', 'mt'], [Rt, 'r', 'rt']]) if (o) { vol[k1] += (vol[k2] - vol[k1]) * 0.08; o.set(vol[k1]); }
      if (A && mAt > 0 && !A.a.__go && performance.now() >= mAt) startMusic(0);
      if (A && A.a.__go && !A.a.__wait && shots && !v.paused && v.readyState >= 3 && v.currentTime > 0.2) {   // (the music kept to the video: its drop where the helicopter levels out)
        const want = v.currentTime + MUSIC_DROP - MUSIC_LEVEL; if (Math.abs(A.a.currentTime - want) > 0.25 && want < A.a.duration - 0.1) try { A.a.currentTime = want; } catch (_) { /* seeking not ready */ }
      }
      layoutPins();
      ixRaf = requestAnimationFrame(step);
    };
    // the places' pins (the helicopter's camera comes with its flight's data)
    const begin = (H) => {
      if (done) return; Hd = H;
      if (Hd && Hd.marks) for (const m of Hd.marks) { const e = document.createElement('div'); e.className = 'ixpin'; e.innerHTML = '<span><b>' + esc(m[0]) + '</b>' + (m[1] ? '<small>' + esc(m[1]) + '</small>' : '') + '</span><i></i>'; pins.appendChild(e); pinEls.push(e); }
      if (globe) {
        const title = (id) => { const x = id && trackById(id); return x ? x.name : undefined; };
        let start = null, fromRoute = null, fromFlags = null;
        if (from && mapEl) {
          start = mapStart(from, view0 || fitIntroMap(mapEl));
          const Rf = RT[from], Mf = D.routeMaps[from] || {}, route = Rf.top.route; fromRoute = route.filter((p, i) => i % 2 === 0 || i === route.length - 1).map(p => { const c = mapLL(from, p[0], p[1]); return [c.lat, c.lon]; });
          const a = mapLL(from, route[0][0], route[0][1]), b = mapLL(from, route[route.length - 1][0], route[route.length - 1][1]), Al = Mf.alt, rf = trackById(from).group === 'rally';
          const own = (name, sub, fin, cls) => '<svg class="jmk" width="1" height="1" aria-hidden="true">' + mark(0, 0, name, sub, fin, cls).replace('translate(0 0)', 'scale(0.5)') + '</svg>';   // (as the map draws them: half size on the screen)
          fromFlags = Rf.open ? [{ lat: a.lat, lon: a.lon, html: own(Mf.start || 'Start', Al ? num(Al[0]) + ' m' : rf ? 'SS start' : '', false, 's') }, { lat: b.lat, lon: b.lon, html: own(Mf.finish || 'Finish', Al ? num(Al[1]) + ' m' : '', true, 'f'), fin: true }]
            : [{ lat: a.lat, lon: a.lon, html: own('Start · finish', '', false, 's') }];
        }
        J = Journey.play(box, { from, to: t.id, heli: Hd, video: v, start, fromRoute, fromFlags, mapEl, fromTitle: title(from), toTitle: t.name, credit: D.creditLine,
          onSummit: showSummit, onHandover: startShots, debug: window.__ixJDebug,
          onStart: (c) => { globeRan = true; const at = c.total + MUSIC_LEVEL - MUSIC_DROP; if (at <= 0) startMusic(-at); else mAt = performance.now() + at * 1000; } });
        J.done.then((why) => { pinsOn = true; if (why === 'nogl') { if (mapEl) mapEl.remove(); startShots(); } });
      } else startShots();
    };
    const stopAll = () => { if (!done) quit(); for (const o of [A, Rt]) if (o) { o.a.pause(); o.a.__held = false; o.set(0); } if (ixLive && ixLive.stop === stopAll) ixLive = null; };
    heliData(t.id).then(begin);
    ixRaf = requestAnimationFrame(step);
    ixLive = { A, Rt, stop: stopAll }; window.__ixDebug = { A: A && A.a, Rt: Rt && Rt.a, v, get J() { return J; }, get Hd() { return Hd; } };   // (for the mockup's own checks)
    $('.ix-skip', el).focus({ preventScroll: true });
  }
  // the intro's sounds: each through Web Audio with its own gain (iPhones ignore an element's volume), else the element's volume; faded out
  // over sec seconds (Skip, the end: stopped by a timer too, so also in a hidden tab), stopped at once when another intro or the menu
  // takes over (ixStop: the whole intro, its video and globe too)
  let ixLive = null, actx = null;
  const pool = {};   // (sounds made in the tap itself, where a phone lets sound start: kept for the intro that follows the loading)
  function make(url, loop) {
    const a = new Audio(url); a.preload = 'auto'; a.loop = !!loop; let g = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { actx = actx || new AC(); const src = actx.createMediaElementSource(a); g = actx.createGain(); g.gain.value = 0; src.connect(g); g.connect(actx.destination); }
    } catch (_) { g = null; }
    if (!g) a.volume = 0;
    return { a, set(v) { v = Math.max(0, Math.min(1, v)); if (g) g.gain.value = v; else a.volume = v; }, get() { return g ? g.gain.value : a.volume; } };
  }
  function voice(url, loop) { const k = url + (loop ? '#l' : ''), o = pool[k]; if (o) { delete pool[k]; return o; } return make(url, loop); }
  function warm(url, loop) {   // in the tap: made, started silent and stopped at once
    const k = url + (loop ? '#l' : ''); if (pool[k]) return;
    const o = pool[k] = make(url, loop); if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
    const p = o.a.play(); if (p && p.then) p.then(() => { if (!o.a.__go) o.a.pause(); }).catch(() => {});
  }
  function ixFade(o, sec) {
    if (!o) return; if (o.a.paused) { o.a.__held = false; o.set(0); return; }   // (held in a hidden tab, or never started: it stays silent)
    const v0 = o.get(), t0 = performance.now(), stop = () => { o.a.pause(); o.a.__held = false; o.set(0); };
    const f = () => { const k = (performance.now() - t0) / 1000 / sec; if (k >= 1 || o.a.paused) return; o.set(v0 * (1 - k)); requestAnimationFrame(f); };
    requestAnimationFrame(f); setTimeout(stop, sec * 1000 + 30);
  }
  function ixStop() { if (!ixLive) return; const L = ixLive; ixLive = null; L.stop(); }
  document.addEventListener('visibilitychange', () => {   // (a hidden tab: the intro's sounds wait, its frames being stopped)
    if (!ixLive) return;
    for (const o of [ixLive.A, ixLive.Rt]) if (o) { if (document.hidden) { if (!o.a.paused) { o.a.pause(); o.a.__held = true; } } else if (o.a.__held) { o.a.__held = false; const p = o.a.play(); if (p && p.catch) p.catch(() => {}); } }
  });


  /* ---------------- the choices: what the menu shows and the game's own settings are one thing ---------------- */
  // the track shown is the game's track too (S.track), and the mode its mode (S.mode) where the track has ways to be driven
  function select() {
    const t = curTrack(); if (!t) return;
    G.select(t.id, GAME_MODE[mode]);
  }
  // entering the track step in a mode: on the game's own track if it can be driven in it, else the first track there is
  function enterTrack() {
    if (nuOn && !TRACKS().length) nuOn = false;   // (no hidden track in the mode: the real ones)
    const cur = gameTrack();
    const L = TRACKS(), i = cur ? L.indexOf(cur) : -1;
    trackIdx = i >= 0 ? i : 0;
    select();
  }
  function warmFor(t) {   // the intro's sounds, started silent in the tap itself
    if (setting('intro') === 2 || !RT[t.id] || !hasFlight(t.id) || setting('sound') !== 0) return;
    const mus = XI[t.id] && XI[t.id].music; if (mus) warm('assets/music/' + mus + '.mp3'); warm('assets/music/rotor.mp3', true);
  }

  function back() {
    if (zemOpen()) { ZE().back(); return; }
    if (izOpen()) { IZ().back(); return; }
    if (sheet) { sheet = null; render(true); return; }
    if (screen === 'track') { screen = 'title'; titleSub = nuOn ? null : 'single'; nuOn = false; render(); return; }   // (behind NEUPORABNO: the title, its list a tap away)
    if (titleSub) { titleSub = null; render(true); }
  }
  function act(a, el) {
    const [k, v, w] = a.split(':');
    if (rg && k !== 'track') ringStop();   // (another action in a turn: on the track it was going to)
    switch (k) {
      case 'back': back(); break;
      case 'single': titleSub = 'single'; render(true); break;   // (the modes open in the main menu's own frame)
      case 'career': titleSub = 'career'; render(true); break;
      case 'tsub': titleSub = v || null; render(true); break;
      case 'mode': mode = v; enterTrack(); screen = 'track'; cam = CAM_OPEN || G.S.menuCam; render(); break;   // (a tap on a mode goes straight to its tracks)
      case 'cam': cam = +v; G.setOption('menuCam', cam); render(true); break;
      case 'send-times': if (G.sendTimes) G.sendTimes(); break;   // (the Friends view: the player's times to friends as a link, the game's Lestvica prijateljev)
      case 'track': {   // (on its side the carousel turns, then the screen is the new track's: ringLand)
        const n = TRACKS().length; if (!n) break;
        if (ringOn()) { ringSpin(+v); break; }
        ringStop(); trackGo(Math.sign(+v), ((trackIdx + +v) % n + n) % n); break;
      }
      case 'weather': { const at = ringOn() ? wxRects() : null, ic = app.querySelector('#track-stage .wxv > [data-act="weather:' + v + '"] svg'); wxTap = ic ? ic.getBoundingClientRect() : null; setWeather(v); render(true); if (at) wxSlide(at); break; }   // (Snow: the winter, js/menu.js setWeather)
      case 'more-options': sheet = optionsSheet; render(true); break;
      case 'opt': {
        if (v === 'pkRoad') G.setPkRoad(w); else G.setOption(v, w);
        render(true); break;
      }
      case 'izbor': izbor(); break;
      case 'zemlja': zemlja(); break;   // (the globe in the head: the Earth, js/menu-zemlja.js)   // (the flag in the row, the country's sign: the quick list, js/menu-izbor.js)
      case 'garage': carFrom = true; G.act('menu-garage'); break;   // (the garage, garaza.html; its back and its Izberi progo: this step again, game.js garageBack)
      case 'credits': sheet = creditsSheet; render(true); break;
      case 'riv': sheet = rivSheet; render(true); break;   // (the row's Opponents: how many, 0..100)
      case 'riv-n': rivSet(+v); break;
      case 'dark-tip': sheet = darkSheet; render(true); break;
      case 'dark-never': try { localStorage.setItem('tdgp-darktip', 'off'); } catch (_) { /* private mode: it shows again next time */ } sheet = null; render(true); break;
      case 'chrome': location.href = chromeUrl(); break;
      case 'nu': nuSheet(); break;   // NEUPORABNO: what does not go into version 1.0 (nuSheet)
      case 'newver': if (izOpen()) { IZ().nazaj.clear(); IZ().close(true); } G.newVer(); break;   // NEW VERSION · TEST 1 (behind NEUPORABNO): straight to driving the new map (js/game.js nvStart), no menu after it
      case 'close-sheet': { const r = $('.sheet.riv .rslide', app); if (r && +r.value !== G.rivals((curTrack() || {}).def || {})) rivSet(+r.value); sheet = null; render(true); break; }   // (the opponents' slider not let go yet: its number kept)
      case 'game': if (izOpen()) { IZ().nazaj.clear(); IZ().close(true); } G.act(v, el); break;   // (a screen of the game itself: Settings, Leaderboard, Multiplayer, the career's; behind NEUPORABNO the missions, the cups)
      case 'race-single': {
        const t = curTrack(); if (!t) break;
        select(); const wet = G.rollWet(); if (!weekendOn(t, mode)) warmFor(t);
        G.launch((gameStart) => {   // (the track is loaded: the intro over it, then the game's own start)
          if (screen !== 'track' || !app.isConnected) { gameStart(); return; }
          beforeRace({ kind: 'single', mode, track: t, trial: mode === 'trial', wet }, () => { G.setLast(t.id); gameStart(); });
        });
        break;
      }
      default: break;
    }
  }
  // the game's gamepad on the menu (game.js padFrame: the highlight and A are the game's, over the buttons of this shadow root): where it looks
  // (the intro, else an open sheet, else the screen), and the keys that are the menu's own: B back, Start on, LB and RB the track; in the
  // intro any of A, B and Start skips it
  const padRoot = () => app ? $('.intro', app) || (zemOpen() && ZE().root()) || (izOpen() && IZ().sheet()) || $('.sheet-bg', app) || app : null;
  function padKey(k) {
    if (!app || !G || !G.visible()) return false;
    const wk = $('.intro.wk', app);   // (the race weekend: B back to the tracks, Start the button's choice, A the highlighted button)
    if (wk) { if (k === 'b' || k === 'start') { G.click(); wk.__wk[k === 'b' ? 'back' : 'go'](); return true; } return false; }
    if ($('.intro', app)) { if (k === 'a' || k === 'b' || k === 'start') { const sk = $('.intro [data-ix="skip"]', app); if (sk) sk.click(); } return true; }
    if (k === 'b') { G.click(); back(); return true; }
    if (izOpen() || zemOpen()) return k === 'lb' || k === 'rb' || k === 'start' || k === 'x' || k === 'y';   // (the quick list, the Earth: A and the d-pad in it)
    if (sheet) return false;
    if (screen === 'track' && (k === 'lb' || k === 'rb')) { G.click(); act('track:' + (k === 'lb' ? -1 : 1)); return true; }
    if (k === 'start') {
      const go = screen === 'track' ? 'race-single' : titleSub === 'single' ? 'mode:' + mode : titleSub ? '' : 'single';
      if (go) { G.click(); act(go); }
      return true;
    }
    return false;
  }
  function bind() {
    app.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]'); if (!el || !app.contains(el)) return;
      if (performance.now() - noTap < 400) return;   // (the end of a swipe)
      if ($('.intro', app) && !el.closest('.intro')) return;   // (nothing under the intro: a key on a button behind it)
      if (el.classList.contains('sheet-bg') && e.target !== el) return;   // clicks inside the sheet do not close it
      if (!el.dataset.act.startsWith('game:')) G.click();   // (the game clicks for its own actions)
      act(el.dataset.act, el);
    });
    document.addEventListener('keydown', (e) => {
      if (!G || !G.visible()) return;
      const wk = $('.intro.wk', app); if (wk) { if (e.key === 'Escape') { e.preventDefault(); wk.__wk.back(); } return; }   // (Esc: the race weekend back to the tracks)
      if ($('.intro', app)) { if (e.key === 'Escape') { e.preventDefault(); const sk = $('.intro [data-ix="skip"]', app); if (sk) sk.click(); } return; }   // (Esc skips the intro)
      if (e.key === 'Escape') { if (zemOpen() || izOpen() || sheet || screen === 'track' || titleSub) { e.preventDefault(); back(); } }
      if (screen === 'track' && !sheet && !izOpen() && !zemOpen() && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) act('track:' + (e.key === 'ArrowLeft' ? -1 : 1));
    });
    window.addEventListener('resize', () => wx.resize());
    // the opponents' slider: the number follows it, the setting when it is let go (and on Done: rivSheet)
    app.addEventListener('input', (e) => { if (e.target.classList && e.target.classList.contains('rslide')) rivPaint(+e.target.value); });
    app.addEventListener('change', (e) => { if (e.target.classList && e.target.classList.contains('rslide')) rivSet(+e.target.value); });
    // its own keys (the arrows, Home, End, Page Up and Down) stay with it: the game takes the arrows on the window for driving (js/input.js),
    // where an element of this shadow root is not an input
    app.addEventListener('keydown', (e) => { if (e.target.classList && e.target.classList.contains('rslide') && /^(Arrow|Home$|End$|Page)/.test(e.key)) e.stopPropagation(); });
    // a finger across the picture changes the track: on its side the carousel's cards follow it (302 of the drawing's px a place) and a long
    // enough swipe turns it on from there, else they go back; upright the picture follows it a little (0.35 of the way) and a long enough
    // swipe goes to the next track, else it slides back (200 ms). The tap a swipe ends with is not a tap (400 ms)
    let sw = null;
    app.addEventListener('pointerdown', (e) => {
      if (sw || screen !== 'track' || sheet || e.button > 0 || $('.intro', app) || izOpen() || zemOpen() || rg) return;
      const land = isLand(), on = land ? e.target.closest('#s-track .rcard, #track-stage') : e.target.closest('#track-stage .dio');
      if (on && TRACKS().length > 1) sw = { x: e.clientX, y: e.clientY, id: e.pointerId, land, on, moved: false, p: 0 };
    });
    const swEnd = (e, up) => {
      if (!sw || e.pointerId !== sw.id) return;
      const s = sw, dx = e.clientX - s.x, dy = e.clientY - s.y, far = up && Math.abs(dx) > (s.land ? Math.max(40, 56 * ringK) : 56) && Math.abs(dx) > Math.abs(dy) * 1.4;
      sw = null; if (!s.moved) return;
      noTap = performance.now();
      if (s.land) { if (!rg || !rg.drag) return; if (far) ringSpin(dx < 0 ? 1 : -1, s.p); else ringTurn(0, s.p, null); return; }
      const d = s.on;
      if (far && d.isConnected) { act('track:' + (dx < 0 ? 1 : -1)); return; }
      d.style.transition = 'transform .2s ease-out'; d.style.transform = '';
      d.addEventListener('transitionend', () => { d.style.transition = ''; }, { once: true });
    };
    window.addEventListener('pointermove', (e) => {
      if (!sw || e.pointerId !== sw.id) return;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      if (!sw.moved) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) { if (Math.abs(dy) > 12) sw = null; return; }   // (up or down: not a swipe)
        if (sw.land && rg) { sw = null; return; }
        sw.moved = true; if (sw.land) rg = { drag: true, p: 0, raf: 0 };
        try { sw.on.setPointerCapture(e.pointerId); } catch (_) { /* (the pointer gone already) */ }
      }
      if (sw.land) { if (!rg || !rg.drag) { sw = null; return; } sw.p = rg.p = Math.max(-1.2, Math.min(1.2, -dx / (302 * ringK))) || 1e-6; ringTo(sw.p); }
      else sw.on.style.transform = 'translateX(' + (dx * 0.35).toFixed(1) + 'px)';
    });
    window.addEventListener('pointerup', (e) => swEnd(e, true));
    window.addEventListener('pointercancel', (e) => swEnd(e, false));
  }
  let noTap = 0;   // (when a swipe let go: the click it ends with is not a tap)

  /* ---------------- the game's side ---------------- */
  let ready = false, want = null, carFrom = false;
  const flush = () => { if (!ready || !want) return; const n = want; want = null; show(n); };
  function show(name) { try { showNow(name); } catch (e) { fail(e); } }
  function showNow(name) {
    if (!ready) { want = name; return; }
    if (izOpen()) IZ().close(true);
    if (zemOpen()) ZE().close(true);
    if (carFrom && name === 'title' && screen === 'track') name = 'track';   // (Back from the car screen: the step it was opened from)
    carFrom = false;
    if (name === 'title') {
      screen = 'title'; titleSub = null; sheet = null; nuOn = false;
      if (!darkTold() && forcedDark() && !darkTipOff()) { setDarkTold(true); sheet = darkSheet; }   // (once a visit, the first time the title is up)
    }
    else {
      const c0 = trackById(G.baseId(G.S.track)); nuOn = hidden(c0);   // (a race behind NEUPORABNO: back on its list)
      const cur = gameTrack();
      screen = 'track'; sheet = null;
      if (cur && TRACKS().includes(cur)) trackIdx = TRACKS().indexOf(cur); else enterTrack();
    }
    cam = G.S.menuCam || 1;   // (back on the track step: the camera it had)
    render();
  }
  function hide() {   // another screen of the game is up: the menu's moving things rest (a show still waiting for the style: dropped)
    want = null;
    if (!app) return;
    wx.detach(); if (MV()) MV().off(); cancelAnimationFrame(flyRaf); cancelAnimationFrame(graphRaf); clearTimeout(preT); if (window.MenuCar) MenuCar.detach();
    if (rg) { cancelAnimationFrame(rg.raf); rg = null; } if (ringGone) { clearTimeout(ringGoneT); ringGone.remove(); ringGone = null; } arriveDone();   // (the carousel: drawn anew when the menu is up again)
    if (izOpen()) IZ().close(true);   // (the quick list and its steps in the history gone)
    if (zemOpen()) ZE().close(true);   // (the Earth too)
    rested = null; globe.reset();
    if (sheet === darkSheet) setDarkTold(false);   // (hidden at once, e.g. a friend's challenge over the title: told the next time the title is up)
    for (const v of app.querySelectorAll('video')) v.pause();
    shown = '';
  }
  // the menu could not start (its style did not load, or something in it failed): the game's old title and track screens take over, so there
  // is always a menu to play from
  function fail(e) {
    ready = false; want = null;
    try { console.error('the new menu failed, the old one takes over:', e && e.message ? e.message : e); } catch (_) { /* no console */ }
    if (G && G.fallback) G.fallback();
  }
  async function init(bridge) {
    G = bridge;
    try {
      mode = MENU_MODE[G.S.mode] || 'race';
      host = document.getElementById('menu-host'); const root = host.attachShadow({ mode: 'open' });
      app = document.createElement('div'); app.id = 'mn'; root.appendChild(app);
      buildTracks(); bind();
      const l = document.getElementById('menu-css'), r = await fetch(l ? l.href : 'css/menu.css');
      if (!r.ok) throw new Error('css/menu.css: ' + r.status);
      const st = document.createElement('style'); st.textContent = await r.text(); root.insertBefore(st, app);
      if (window.Sence) Sence.root(root);   // (js/sence.js: the colours past Samsung's forced dark)
      ready = true; flush();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitWhere(); signOn(); });   // (the place's name and the sign's measured again in their own fonts)
    } catch (e) { fail(e); }
  }
  function refresh() { if (ready && G && G.visible() && app && !$('.intro', app) && !sheet && !izOpen() && !zemOpen()) render(true); }   // (a challenge arrived, the install offer came: the title shows it)
  // the menu hides the whole screen (game.js frame(): the demo behind it unseen, not drawn): the track step (its own background; the title
  // is see-through, the game's scene behind it, css/menu.css #s-title) on a phone either way up; a tablet held upright has the menu as a
  // column in the middle (#mn, 432 px), the game's demo seen at its sides
  const COLUMN = window.matchMedia ? matchMedia('(min-width: 640px) and (orientation: portrait)') : null;
  const covers = () => ready && !!app && shown === 'track' && !(COLUMN && COLUMN.matches);
  // fromTrack: the garage was opened from the track step (game.js garageOpen keeps it for the way back: garageBack, straight to this step)
  window.Menu = { init, show, hide, refresh, covers, padRoot, padKey, get ready() { return ready; }, beforeRace, get fromTrack() { return carFrom; }, debug: () => ({ screen, titleSub, mode, trackIdx, cam, nu: nuOn, tracks: TR.map(t => t.id), list: TRACKS().map(t => t.id), chrome: chromeUrl(), globe: globe.state(), ring: { on: isLand(), turning: !!(rg && !rg.drag), held: !!(rg && rg.drag), p: rg ? +rg.p.toFixed(3) : 0, k: +ringK.toFixed(4), fading: !!ringGone }, arrive: arrive.length }) };
})();
