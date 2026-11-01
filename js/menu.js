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

  /* ---------------- icons ---------------- */
  const cupPath = (f, s) => '<path d="M9.5 4.5h13v7.5a6.5 6.5 0 0 1-13 0z" fill="' + f + '" stroke="' + s + '" stroke-width="1.4"/><path d="M9.6 7H5.8a4.2 4.2 0 0 0 4.6 5.8M22.4 7h3.8a4.2 4.2 0 0 1-4.6 5.8" fill="none" stroke="' + s + '" stroke-width="2.2" stroke-linecap="round"/><path d="M14.3 18h3.4v5h-3.4z" fill="' + s + '"/><path d="M10.5 23.5h11v3.8h-11z" fill="' + f + '" stroke="' + s + '" stroke-width="1.2"/>';
  const I = {
    left: '<svg viewBox="0 0 20 20"><path d="M14 3.5v13L4 10z" fill="#fff"/></svg>',
    wheel: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="#ffc629" stroke-width="2.6"/><circle cx="12" cy="12" r="2.4" fill="#ffc629"/><path d="M3.5 11h6M14.5 11h6M12 14.5v6" stroke="#ffc629" stroke-width="2.6"/></svg>',
    right: '<svg viewBox="0 0 20 20"><path d="M6 3.5v13L16 10z" fill="#fff"/></svg>',
    back: '<svg viewBox="0 0 22 22"><path d="M14 4 7 11l7 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 18 18"><path d="m7 3 6 6-6 6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bigcup: '<svg class="bigcup" viewBox="0 0 32 32" aria-hidden="true"><path d="M9.5 4.5h13v7.5a6.5 6.5 0 0 1-13 0z" fill="#ffc629" stroke="#8a6200" stroke-width=".8"/><path d="M9.6 7H5.8a4.2 4.2 0 0 0 4.6 5.8M22.4 7h3.8a4.2 4.2 0 0 1-4.6 5.8" fill="none" stroke="#ffc629" stroke-width="2" stroke-linecap="round"/><path d="M14.3 18h3.4v5h-3.4z" fill="#e0a40a"/><path d="M10.5 23.5h11v3.8h-11z" fill="#ffc629" stroke="#8a6200" stroke-width=".8"/><path d="M12 6.5h2.2v6.2a2 2 0 0 1-2.2-2z" fill="rgba(255,255,255,.55)"/></svg>',
    lock: (c) => '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="' + c + '"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="' + c + '" stroke-width="2.4"/></svg>',
    coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffc629"/><circle cx="12" cy="12" r="7" fill="none" stroke="#b07d00" stroke-width="1.6"/><text x="12" y="15.4" text-anchor="middle" font-family="ApexMenu, Roboto, Arial" font-weight="900" font-size="8.4" fill="#7a5600">CR</text></svg>',
    check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffc629"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#1b1b1b" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#1b1b1b"/></svg>',
    bolt: '<svg width="20" height="24" viewBox="0 0 22 24"><path d="M13 1.5 3.5 14h6.5l-1.5 8.5L19 10h-6.8z" fill="#fff"/></svg>',
    weight: '<svg width="22" height="24" viewBox="0 0 22 24"><path d="M7.5 7a3.5 3.5 0 1 1 7 0" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M4.5 9h13l2.5 12.5H2z" fill="#fff"/><text x="11" y="19" text-anchor="middle" font-family="ApexMenu, Roboto, Arial" font-weight="900" font-size="7" fill="#0e1a2c">KG</text></svg>',
    drive: '<svg width="22" height="24" viewBox="0 0 22 24"><rect x="2" y="2.5" width="5" height="8" rx="1.5" fill="#fff"/><rect x="15" y="2.5" width="5" height="8" rx="1.5" fill="#fff"/><rect x="2" y="13.5" width="5" height="8" rx="1.5" fill="#fff"/><rect x="15" y="13.5" width="5" height="8" rx="1.5" fill="#fff"/><path d="M7 6.5h8M7 17.5h8M11 6.5v11" stroke="#fff" stroke-width="2"/></svg>',
    gears: '<svg width="21" height="24" viewBox="0 0 22 24"><path d="M4 4v16M11 4v16M18 4v8M4 12h14" stroke="#fff" stroke-width="2.3" fill="none" stroke-linecap="round"/><circle cx="18" cy="4" r="2.6" fill="#fff"/></svg>',
    corners: '<svg width="19" height="24" viewBox="0 0 24 28"><path d="M5 26c0-7 13-6 13-13V6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M13.5 8.5 18 3.5l4.5 5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    flag: '<svg width="19" height="24" viewBox="0 0 24 28"><path d="M5 3v23" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M5.5 4h15v10h-15z" fill="#fff"/><path d="M5.5 4h5v3.3h-5zM15.5 4h5v3.3h-5zM10.5 7.3h5v3.4h-5zM5.5 10.7h5V14h-5zM15.5 10.7h5V14h-5z" fill="#0e1a2c"/></svg>',
    globe: '<svg width="22" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" fill="none" stroke="#fff" stroke-width="1.6"/></svg>',
    people: '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.4" fill="#fff"/><path d="M2.5 20c.6-4 3.2-6 6.5-6s5.9 2 6.5 6z" fill="#fff"/><circle cx="17" cy="9" r="2.6" fill="rgba(255,255,255,.7)"/><path d="M15.6 13.4c3 .1 5.2 2 5.9 5.6h-4.6" fill="rgba(255,255,255,.7)"/></svg>',
    medal: '<svg width="20" height="24" viewBox="0 0 22 26"><path d="M6 1.5h4l2 6h-4zM16 1.5h-4l-2 6h4z" fill="#3fd0ff"/><circle cx="11" cy="16" r="7" fill="#ffc629" stroke="#8a6200" stroke-width="1.2"/><path d="M11 12.3l1.1 2.3 2.5.3-1.9 1.7.5 2.5-2.2-1.2-2.2 1.2.5-2.5-1.9-1.7 2.5-.3z" fill="#8a6200"/></svg>',
    trophy: (c) => '<svg width="24" height="24" viewBox="0 0 32 32">' + cupPath(c === 'gold' ? '#ffc629' : 'none', c === 'gold' ? '#ffc629' : '#fff') + '</svg>',
    motor: '<svg viewBox="0 0 24 24"><path d="M3 10h2.5V8H8V6h6v2h2.5l2 2H21v6h-2.5l-2 2.5H8.5L5.5 16H3z" fill="#fff"/></svg>',
    tyre: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="3.4"/><circle cx="12" cy="12" r="3.4" fill="#fff"/></svg>',
    brake: '<svg viewBox="0 0 24 24"><circle cx="11" cy="13" r="8" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="11" cy="13" r="2.6" fill="#fff"/><path d="M15 3.5a9.5 9.5 0 0 1 6 6.5" fill="none" stroke="#ff5145" stroke-width="3.2" stroke-linecap="round"/></svg>',
    wing: '<svg viewBox="0 0 24 24"><path d="M2 7h20l-2.5 4H4.5z" fill="#fff"/><path d="M7 11v7M17 11v7" stroke="#fff" stroke-width="2.4"/><path d="M4 19h16" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
    cog: '<svg viewBox="0 0 24 24"><path d="M10.3 2h3.4l.5 2.6 1.8.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.8 2.6.5v3.4l-2.6.5-.8 1.8 1.5 2.2-2.4 2.4-2.2-1.5-1.8.8-.5 2.6h-3.4l-.5-2.6-1.8-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.8L2 13.7v-3.4l2.6-.5.8-1.8-1.5-2.2 2.4-2.4 2.2 1.5 1.8-.8z" fill="#fff"/><circle cx="12" cy="12" r="3.6" fill="#4a505c"/></svg>',
    podium: '<svg viewBox="0 0 26 26"><path d="M9 6h8v17H9zM1.5 12h7.5v11H1.5zM17 15h7.5v8H17z" fill="#fff"/><path d="M13 1.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z" fill="#ffc629"/></svg>',
    wifi: '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M2.5 9a14 14 0 0 1 19 0M5.8 12.4a9.3 9.3 0 0 1 12.4 0M9 15.7a4.6 4.6 0 0 1 6 0" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="19.3" r="1.7" fill="#fff"/></svg>',
    key: '<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="8" cy="12" r="4.5" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M12.5 12H21M18 12v3.5M21 12v2.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
    bolt2: '<svg width="26" height="26" viewBox="0 0 22 24"><path d="M13 1.5 3.5 14h6.5l-1.5 8.5L19 10h-6.8z" fill="#fff"/></svg>',
    sun: '<svg width="22" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.4" fill="#fff"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
    rain: '<svg width="22" height="24" viewBox="0 0 24 24"><path d="M6.5 15a4.5 4.5 0 0 1 .7-8.9A6 6 0 0 1 18.4 8 3.6 3.6 0 0 1 18 15z" fill="#fff"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" stroke="#3fd0ff" stroke-width="2" stroke-linecap="round"/></svg>',
    siren: '<svg width="22" height="24" viewBox="0 0 24 24"><path d="M6.5 19v-5.5a5.5 5.5 0 0 1 11 0V19z" fill="#ff4a4a"/><path d="M12 8a5.5 5.5 0 0 1 5.5 5.5V19H12z" fill="#3a78ff"/><rect x="4.5" y="19" width="15" height="3" rx="1" fill="#fff"/><path d="M12 1.8v2.6M4.4 4.8l1.8 1.8M19.6 4.8l-1.8 1.8M1.6 11.5h2.3M20.1 11.5h2.3" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',
    watch: '<svg width="22" height="24" viewBox="0 0 24 24"><circle cx="12" cy="14" r="8" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 14V9.4" stroke="#3fd0ff" stroke-width="2.2" stroke-linecap="round"/><path d="M9.4 2.6h5.2M12 2.6v3.2M18.6 6.4l1.6-1.6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
    dice: '<svg width="22" height="24" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="17" rx="4" fill="#fff"/><g fill="#0b192b"><circle cx="8.6" cy="9.4" r="1.7"/><circle cx="12" cy="13" r="1.7"/><circle cx="15.4" cy="16.6" r="1.7"/><circle cx="15.4" cy="9.4" r="1.7"/><circle cx="8.6" cy="16.6" r="1.7"/></g></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  Object.assign(I, {   // (the career's four cards, the title's small buttons)
    medalBig: '<svg class="bigcup" viewBox="0 0 32 32" aria-hidden="true"><path d="M9 2h5l2 7h-5zM23 2h-5l-2 7h5z" fill="#3fd0ff"/><circle cx="16" cy="20" r="9" fill="#ffc629" stroke="#8a6200" stroke-width=".9"/><path d="M16 14.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#8a6200"/></svg>',
    wheelBig: '<svg class="bigcup" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="#fff" stroke-width="3.4"/><circle cx="16" cy="16" r="3.4" fill="#ffc629"/><path d="M16 19.4V28M12.9 14.4 5 12M19.1 14.4 27 12" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    starBig: '<svg class="bigcup" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3l3.6 7.5 8.2 1-6 5.6 1.6 8.1L16 21.2 8.6 25.2l1.6-8.1-6-5.6 8.2-1z" fill="#ffc629" stroke="#8a6200" stroke-width=".9"/></svg>',
    expand: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  });

  /* ---------------- the game's tracks as the menu shows them ---------------- */
  const MODES = D.modes.concat([{ id: 'duel', name: 'Traffic duel', sub: 'One rival, real traffic on the open road.', chip: '1 RIVAL · TRAFFIC', img: 'assets/menu/multiplayer.webp' }]);
  const GAME_MODE = { race: 'race', chase: 'police', trial: 'tt', duel: 'traffic' }, MENU_MODE = { race: 'race', police: 'chase', tt: 'trial', traffic: 'duel' };
  const WEATHER = ['Dry', 'Rain', 'Random'], W_SET = ['dry', 'rain', 'random'];
  const wIcon = (w) => [I.sun, I.rain, I.dice][Math.max(0, WEATHER.indexOf(w))];
  // the first sentences of the game's description of a track (the card has room for about two lines)
  const shortDesc = (s) => { s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= 130) return s; const m = /^(.{40,130}?[.!?])(\s|$)/.exec(s); if (m) return m[1]; const c = s.slice(0, 130).search(/[,;:][^,;:]*$/); return c > 50 ? s.slice(0, c) + '.' : s.slice(0, 127).replace(/\s+\S*$/, '') + '…'; };
  const GROUP_ORDER = ['circuit', 'road', 'rally', 'test'];
  let TR = [];
  function buildTracks() {
    const gr = (d) => d.test ? 'test' : (d.rally || d.descent) ? 'rally' : d.open ? 'road' : 'circuit';
    TR = G.defs().filter(d => !d.variantOf).map(d => {
      const en = d.en || {}, full = en.name || d.name, k = full.lastIndexOf(', ');
      const t = { id: d.id, def: d, name: k > 0 ? full.slice(0, k) : full, country: k > 0 ? full.slice(k + 2) : '', desc: shortDesc(en.desc || d.desc), group: gr(d),
        modes: d.modes ? d.modes.slice() : d.timeTrial ? ['tt'] : ['race'], trial: !!d.timeTrial, tag: ({ circuit: 'CIRCUIT', road: 'OPEN ROAD', rally: 'RALLY', test: 'TEST' })[gr(d)] };
      Object.defineProperties(t, {
        km: { get() { const T = G.track(d.id); return (d.open ? T.raceLen : T.len) / 1000; } },
        corners: { get() { return G.track(d.id).corners.length; } },
        laps: { get() { return d.open ? 1 : G.lapsOf(d); } },
        rec: { get() { return G.record(d); } },
      });
      return t;
    });
    TR.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
  }
  const trackById = (id) => TR.find(t => t.id === id);
  // the track the game stands on. Its built-in first choice is a test track (Jezero), which a player who has never raced should not meet first
  const gameTrack = () => { const c = trackById(G.baseId(G.S.track)); return c && !(c.group === 'test' && !G.S.lastTrack) ? c : TR.find(t => t.group !== 'test') || TR[0]; };
  const carImg = (m, ci) => 'assets/cars/img/' + m.id + '-' + ci + '.webp';
  const HAS_CAR_IMG = ['kaze', 'vortex', 'pico', 'strega', 'rally', 'formula'];
  const trackImg = (t, wet) => 'assets/tracks/' + t.id + (wet ? '-rain' : '') + '.webp';
  const dio = (t) => '<div class="sky" aria-hidden="true"><i class="sun"></i><i class="cloud"></i></div><div class="dio"><div class="isl" style="animation-delay:-' + Math.round(performance.now() % 5000) + 'ms">' +
    '<img src="' + trackImg(t) + '" alt="3D model of the ' + esc(t.name) + ' track"><img class="wet" src="' + trackImg(t, true) + '" alt=""></div></div>';
  const weatherIdx = () => { const w = G.S.weather; return w === 'rain' || w === 'storm' ? 1 : w === 'random' || w === 'change' ? 2 : 0; };
  const modeOf = (id) => MODES.find(m => m.id === id) || MODES[0];
  const money = () => G.career() ? G.career().money : null;

  /* ---------------- view state ---------------- */
  let screen = 'title', shown = '', titleSub = null, panelH = 0, mode = 'race', group = 'circuit', trackIdx = 0, mapV = 1, sheet = null, sheetOn = false;
  const inMode = (t) => t.modes.includes(GAME_MODE[mode]);
  const groupList = (g) => TR.filter(t => t.group === g && inMode(t));
  const TRACKS = () => groupList(group);
  const curTrack = () => TRACKS()[trackIdx] || null;
  const wxMode = () => W_SET[weatherIdx()];

  /* ---------------- the weather on the track model: the wet model fades in and rain falls; Random swaps between the two ---------------- */
  const wx = (function () {
    const cv = document.createElement('canvas'); cv.className = 'rainfx'; cv.setAttribute('aria-hidden', 'true');
    const ctx = cv.getContext('2d'), calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let drops = [], raf = 0, a = 0, want = 0, last = 0, W = 0, H = 0, dpr = 1, timer = 0, wet = false, mode = '';
    function fit() {
      const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!r.width || (r.width === W && r.height === H)) return;
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      drops = Array.from({ length: Math.round(W * H / 1000) }, () => ({ x: Math.random() * (W + 60) - 60, y: Math.random() * H, l: 14 + Math.random() * 18, v: 640 + Math.random() * 400, o: 0.35 + Math.random() * 0.45 }));
    }
    function frame(t) {
      raf = 0; const el = last ? (t - last) / 1000 : 0.016, dt = Math.min(0.05, el); last = t;   // (the fade follows the clock, the drops a capped step)
      a = want > a ? Math.min(want, a + el / 0.5) : Math.max(want, a - el / 0.5);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      if (a > 0) {
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
      if (cv.parentNode) cv.parentNode.classList.toggle('rainy', on);
      if (!raf && (want || a)) raf = requestAnimationFrame(frame);
    }
    return {
      // after a render of the track screen (mode 'dry' | 'rain' | 'random'): the new stage starts in the weather shown before, so a
      // change fades over; on entering the screen it starts in its own weather
      attach(stage, m, entering) {
        if (entering) { wet = m === 'rain'; a = wet && !calm ? 1 : 0; }
        stage.classList.toggle('rainy', wet);   // (before anything measures the new stage, so the weather already shown does not fade in again)
        const ds = stage.querySelectorAll('.dio'); (ds.length ? ds[ds.length - 1] : stage.querySelector('video')).after(cv); fit();   // (over the picture, under the names: the track screen's diorama or map (the one on top, while one fades in over another), the intro's video)
        if (m !== mode || entering) { clearInterval(timer); timer = 0; mode = m; if (m === 'random') timer = setInterval(() => show(!wet), 2600); }
        void stage.offsetWidth;
        show(m === 'rain' ? true : m === 'dry' ? false : wet);
      },
      detach() { clearInterval(timer); timer = 0; mode = ''; want = 0; a = 0; wet = false; cv.remove(); if (raf) { cancelAnimationFrame(raf); raf = 0; } last = 0; },
      resize() { if (cv.parentNode) { W = 0; fit(); } },
    };
  })();

  /* ---------------- rendering helpers ---------------- */
  const eur = (x) => '€' + num(x);
  const moneyPill = () => money() == null ? '' : '<div class="money">' + I.coin + '<span>' + eur(money()) + '</span></div>';
  // step: [n, of, what] -> "Step 1 of 2 · Mode" ("1/2 · Mode" on a narrow screen)
  const topbar = (title, withMoney, step) => '<div class="topbar"><button class="sq" data-act="back" aria-label="Back">' + I.back + '</button><h2>' + esc(title) +
    (step ? '<small><span class="sl">Step ' + step[0] + ' of ' + step[1] + '</span><span class="ss">' + step[0] + '/' + step[1] + '</span> · ' + esc(step[2]) + '</small>' : '') + '</h2>' + (withMoney ? moneyPill() : '') + '</div>';
  const foot = (goHtml) => '<div class="foot"><button class="back" data-act="back" aria-label="Back">' + I.back + '</button>' + (goHtml || '') + '</div>';
  const info = (items) => '<div class="info">' + items.map(it => '<div class="' + (it[3] || '') + '">' + it[0] + '<div class="t"><small>' + esc(it[1]) + '</small><b>' + esc(it[2]) + '</b></div></div>').join('') + '</div>';
  // where the player is in the list of tracks, as a number (3/14) between the arrows
  const counter = (sel, n) => '<div class="pcount"><b>' + (sel + 1) + '</b><span>/' + n + '</span></div>';

  /* ---------------- main menu ---------------- */
  function vTitle() {
    const t = gameTrack(), md = modeOf(MENU_MODE[G.modeOf(t.def)] || 'race');
    const best = t.rec[1] !== '—' ? t.rec[1] : '';
    let h = '<section class="scr" id="s-title" aria-label="Main menu"><div class="scrim"></div>';
    h += '<div class="t-top"><h1 class="logo small"><span class="l1">' + esc(D.game.l1) + '</span><span class="l2">' + esc(D.game.l2) + '</span></h1><div class="t-me">' + moneyPill() + '<button class="nv" data-act="newver" aria-label="New version, test 1: drive the new map now"><i class="nv-st" aria-hidden="true"></i><em>NEW</em><b>NEW VERSION</b><strong>TEST 1</strong><small>' + I.wheel + 'DRIVE NOW</small></button></div></div>';
    h += '<div class="t-menu title-panel' + (titleSub ? ' sub' : '') + '">';
    const subHead = (title, sub) => '<div class="t-subhead"><button class="sq" data-act="tsub:" aria-label="Back to the main menu">' + I.back + '</button><div><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></div></div>';
    const card = (cls, act, cur, name, sub, chip, im) => '<button class="mode ' + cls + '" aria-current="' + cur + '" data-act="' + act + '"><span class="tx"><b>' + esc(name) + '</b><small>' + esc(sub) + '</small>' + (chip ? '<em class="chip">' + esc(chip) + '</em>' : '') + '</span><span class="im">' + im + '</span><i class="tick" aria-hidden="true">' + I.check + '</i></button>';
    if (titleSub === 'single') {
      h += subHead('Single race', 'Choose a mode') + '<div class="t-sub">' + MODES.map(m => card('m-' + m.id, 'mode:' + m.id, mode === m.id, m.name, m.sub, m.chip, '<img src="' + m.img + '" alt="">')).join('') + '</div>';
    } else if (titleSub === 'career') {
      const c = G.career(), ch = G.champ();
      const four = [
        ['garage', 'career', c ? 'Career garage' : 'Career', c ? 'Prize money buys cars and upgrades. ' + eur(c.money) + ' to spend.' : 'Win prize money, buy cars and upgrades.', c ? c.cars + ' CARS' : 'NOT STARTED', I.bigcup],
        ['champ', 'champ', 'Championships', 'A series of races with points.', ch ? ch.chip : 'PICK A SERIES', I.medalBig],
        ['school', 'school', 'Driving school', 'Four lessons with medals.', G.schoolChip(), I.wheelBig],
        ['stats', 'stats', 'Achievements', 'Your numbers and what you have unlocked.', G.statsChip(), I.starBig],
      ];
      h += subHead('Career', 'Four ways to play') + '<div class="t-sub four">' + four.map(f => card('cm-' + f[0], 'game:to-' + f[1], false, f[2], f[3], f[4], f[5])).join('') + '</div>';
    } else {
      h += '<button class="tile t-single" data-act="single"><span class="tx"><b>SINGLE RACE</b><small>' + esc(t.name + ' · ' + md.name) + '</small>' + (best ? '<em class="chip">BEST ' + esc(best) + '</em>' : '<em class="chip gold">NEW TRACKS INSIDE</em>') + '</span>' +
        '<span class="im"><img src="' + trackImg(t, weatherIdx() === 1) + '" alt=""></span></button>';
      h += '<button class="tile t-multi" data-act="game:to-online"><span class="tx"><b>MULTIPLAYER</b><small>Race friends online</small></span><span class="im"><img src="assets/menu/multiplayer.webp" alt=""></span></button>';
      h += '<button class="tile t-career" data-act="career"><span class="tx"><b>CAREER</b><small>' + (G.career() ? eur(G.career().money) + ' · ' : '') + 'Garage, championships, school</small></span><span class="im">' + I.bigcup + '<img src="assets/menu/career.webp" alt=""></span></button>';
      h += '<div class="t-row"><button class="tsmall" data-act="game:to-settings">' + I.cog + '<span>Settings</span></button><button class="tsmall" data-act="game:to-board">' + I.podium + '<span>Leaderboard</span></button></div>';
      if (G.chal()) h += '<button class="mbtn gold buy" data-act="game:to-chal"><span>Challenge from a friend</span><small>Beat their time on the same track</small></button>';
      const ex = []; if (G.fsAvailable()) ex.push('<button class="tsmall" data-act="game:fullscreen">' + I.expand + '<span>Full screen</span></button>'); if (G.installAvailable()) ex.push('<button class="tsmall" data-act="game:install">' + I.plus + '<span>Install the game</span></button>');
      if (ex.length) h += '<div class="t-row">' + ex.join('') + '</div>';
      h += '<button class="tlink" data-act="credits">Credits</button>';
    }
    h += '</div></section>';
    return h;
  }

  /* ---------------- the maps of the tracks (routes.js), in two versions to choose from ----------------
     1 a flyover video: the route drawn in the game's world behind the point running along it (green on the flat, red where it climbs
       steeply), the names over it, in the corner the place the point has reached and its height; 2 a map from above to the stage's edges,
       nothing over the route but its flags. A track with neither (a new one) shows its model: the picture of its land. (The helicopter's
       flight over the track is the intro before the race: beforeRace) */
  const isRoute = (t) => !!t && !!RT[t.id];
  const pathD = (pts) => 'M' + pts.map(p => p[0] + ' ' + p[1]).join('L');
  // a height of the world as a real one: scaled between the real start and finish where they are known (routeMaps alt), else the height
  // at the start (routeMaps base) and the world's rise and fall from there
  const altOf = (R, M, h) => M.alt ? M.alt[0] + (h - R.prof[0]) * (M.alt[1] - M.alt[0]) / ((R.prof[R.prof.length - 1] - R.prof[0]) || 1) : M.base != null ? M.base + h - R.prof[0] : null;
  function altAt(R, M, d) { const P = R.prof, n = P.length, x = Math.min(n - 1, Math.max(0, d / R.len * (n - 1))), i = Math.min(n - 2, Math.floor(x)); return altOf(R, M, P[i] + (P[i + 1] - P[i]) * (x - i)); }
  // the places along the run ([metres, name]) and the one reached at d metres
  const hudOf = (R, M) => M.hud || R.hud || [[0, 'Start']];
  function placeAt(H, d) { let p = H[0][1]; for (const q of H) if (q[0] <= d) p = q[1]; return p; }
  const flagSvg = (fin) => fin ? '<g class="fl fin"><path d="M0 0V-26" /><rect x="0" y="-26" width="16" height="11"/><path class="ck" d="M0-26h4v3.7h-4zM8-26h4v3.7h-4zM4-22.3h4v3.6h-4zM12-22.3h4v3.6h-4zM0-18.7h4v3.7h-4zM8-18.7h4v3.7h-4z"/></g>'
    : '<g class="fl"><path d="M0 0V-26"/><path class="fg" d="M0-26h16l-4 5.5 4 5.5H0z"/></g>';
  function mark(x, y, name, sub, fin, cls) {   // a flag on the map and its name (with a dark edge round the letters: readable on any land)
    return '<g class="mk ' + (cls || '') + '" transform="translate(' + x + ' ' + y + ')"><circle r="6"/>' + flagSvg(fin) + '<text x="' + (fin ? -6 : 6) + '" y="-32" text-anchor="' + (fin ? 'end' : 'start') + '">' + esc(name) + (sub ? '<tspan class="sub" x="' + (fin ? -6 : 6) + '" dy="-20">' + esc(sub) + '</tspan>' : '') + '</text></g>';
  }
  function marks(R, M, pts, rally) {   // the start and the finish (a closed track: one flag)
    const a = pts[0], b = pts[pts.length - 1], A = M.alt;
    return R.open ? mark(a[0], a[1], M.start || 'Start', A ? num(A[0]) + ' m' : rally ? 'SS start' : '', false, 's') + mark(b[0], b[1], M.finish || 'Finish', A ? num(A[1]) + ' m' : '', true, 'f') : mark(a[0], a[1], 'Start · finish', '', false, 's');
  }
  function routeLines(id, pts, rally) {   // the route drawn on, then a glowing point running along it (mapDots moves it; its glow a gradient: cheap to move)
    const d = pathD(pts), c = rally ? ['#fff0dc', '#ffffff'] : ['#ffe07a', '#ffd23a'];
    return '<defs><radialGradient id="rg-' + id + '"><stop offset="0" stop-color="#fff8d0"/><stop offset=".35" stop-color="' + c[0] + '" stop-opacity=".75"/><stop offset="1" stop-color="' + c[1] + '" stop-opacity="0"/></radialGradient></defs>' +
      '<path class="rt-o" d="' + d + '"/><path class="rt" d="' + d + '" pathLength="1"/>' + (rally ? '<path class="rt-c" d="' + d + '"/>' : '') +
      '<g class="rt-dot" opacity="0"><g class="dz"><circle r="30" fill="url(#rg-' + id + ')"/><circle class="c" r="9"/></g></g>';
  }
  function splitMarks(pts) {   // a rally stage (a circuit: its sectors): the two split times at a third and two thirds of it
    return [1, 2].map(k => { const p = pts[Math.round((pts.length - 1) * k / 3)]; return '<g class="sp" transform="translate(' + p[0] + ' ' + p[1] + ')"><rect x="-15" y="-15" width="30" height="30" rx="6"/><text y="6" text-anchor="middle">S' + k + '</text></g>'; }).join('');
  }
  const hudBox = () => '<div class="hud" aria-hidden="true"><b></b><small></small></div>';
  function flyView(t, lockd) {
    return '<div class="dio fly' + (lockd ? ' lock' : '') + '" data-route="' + t.id + '"><video muted loop playsinline preload="auto" poster="assets/maps/fly-' + t.id + '.webp" src="assets/maps/fly-' + t.id + '.webm"></video><div class="flab" aria-hidden="true"></div>' + hudBox() + '</div>';
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
      L.html + routeLines(t.id, pts, rally) + (t.group !== 'road' ? splitMarks(pts) : '') + marks(R, M, pts, rally) + '</g></svg></div>';
  }
  function routeView(t, lockd) {
    const R = RT[t.id], M = D.routeMaps[t.id] || {};
    // the version chosen; where a track has no flyover (yet), its map
    const v = mapV === 1 && R.fly ? 1 : 2;
    let h = '<div class="sky" aria-hidden="true"><i class="sun"></i><i class="cloud"></i></div>';
    h += v === 1 ? flyView(t, lockd) : topView(t, R, M, lockd);
    // the two views to switch between: just the numbers 1 (flyover) and 2 (map), no words
    h += '<div class="mapv" role="group" aria-label="Map version">' + D.mapVersions.map(x => '<button aria-pressed="' + (mapV === x.n) + '" data-act="mapv:' + x.n + '" aria-label="' + esc(x.name) + '" title="' + esc(x.name) + '">' + x.n + '</button>').join('') + '</div>';
    return h;
  }
  const stageView = (t, lockd) => isRoute(t) ? routeView(t, lockd) : dio(t, lockd);
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
  function fitMaps() {
    if (!app) return;   // (the old menu is on: the menu is not built, and a window that changes its size must not stumble on it)
    for (const box of app.querySelectorAll('.dio.topmap[data-map]')) {   // (the track screen's maps: the intro's is fitted by fitIntroMap)
      const T = RT[box.dataset.map].top, svg = $('svg', box), W = box.clientWidth, H = box.clientHeight;
      if (!W || !H) continue;
      const turn = +box.dataset.turn || 0, a = turn && W / H < 1.3 ? turn : 0, rg = $('g.rot', svg), bg = $('.mapbg', box);
      if (rg) { if (a) rg.setAttribute('transform', 'rotate(' + a + ' ' + T.W / 2 + ' ' + T.H / 2 + ')'); else rg.removeAttribute('transform'); }
      if (bg) bg.style.transform = a ? 'rotate(' + a + 'deg) scale(' + (Math.max(W / H, H / W) * 1.06).toFixed(3) + ')' : '';   // (the blurred backdrop turns with the map)
      // the route is centred, with room at the top for the switch and the finish's name; the blurred backdrop fills whatever falls outside
      // the map tile, so nothing is cropped or left empty
      const [x0, y0, x1, y1] = routeBox(T, a), rw = Math.max(1, x1 - x0), rh = Math.max(1, y1 - y0);
      const padX = 10, padTop = 44, padBot = 10, availW = Math.max(60, W - 2 * padX), availH = Math.max(60, H - padTop - padBot);
      const s = Math.min(availW / rw, availH / rh), k = 0.5 / s;
      const vw = W / s, vh = H / s, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const vx = cx - vw / 2, vy = cy - (padTop + availH / 2) / s;
      svg.setAttribute('viewBox', vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1));
      svg.style.setProperty('--k', k.toFixed(3));
      const up = a ? ' rotate(' + (-a) + ')' : '';   // (the names stay upright on a turned map)
      for (const g of svg.querySelectorAll('.mk, .sp')) { if (!g.dataset.at) g.dataset.at = g.getAttribute('transform'); g.setAttribute('transform', g.dataset.at + up + ' scale(' + k.toFixed(3) + ')'); }
      for (const g of svg.querySelectorAll('.dz')) g.setAttribute('transform', 'scale(' + k.toFixed(3) + ')');
      // a name that would run out of the frame at the side goes to the other side of its flag (as drawn: a finish's name to the left of
      // its flag, a start's to the right); where neither side fits it stays as drawn
      const fb = box.getBoundingClientRect(), out = (r) => r.right > fb.right - 4 || r.left < fb.left + 4;
      for (const g of svg.querySelectorAll('.mk')) {
        const tx = $('text', g), fin = g.classList.contains('f');
        const side = (flip) => { const x = fin !== flip ? -6 : 6; tx.setAttribute('text-anchor', x < 0 ? 'end' : 'start'); tx.setAttribute('x', x); for (const s of tx.querySelectorAll('tspan')) s.setAttribute('x', x); };
        side(false);
        if (out(tx.getBoundingClientRect())) { side(true); if (out(tx.getBoundingClientRect())) side(false); }
      }
    }
  }
  window.addEventListener('resize', fitMaps);
  /* The point running along the route is one run, whichever of the two views shows it (1 the flyover, 2 the map), as one shot seen from two
     cameras: a switch between them, or the stage drawn again (a sheet, the weather), goes on from the same moment of the run with the point at
     the same place, not from the start; another track, or the track screen entered anew, starts a new run. On a track with a flyover the run
     is the flyover's own (its video is the clock while it plays; R.fly.frames[k][0] is the point's place in frame k, metres along the run), so
     on the map the point runs as in the flyover: it speeds up from the start, waits at the finish while the flyover's camera rises over it,
     then goes round again. A track with only its map: an even pace, 15 s a run (a rally stage 11 s). */
  const run = { id: '', t: 0, at: 0, on: false };   // the run's time t (s) at the moment at (performance.now()); on: going on from there, else held at t
  const runNow = () => run.t + (run.on ? (performance.now() - run.at) / 1000 : 0);
  function runSet(t, on) { run.t = t; run.at = performance.now(); run.on = on; }
  const runDur = (id) => { const F = RT[id].fly, t = trackById(id); return F ? F.frames.length / F.fps : t && t.group === 'rally' ? 11 : 15; };
  // a new run: on the flyover held at its start until the video plays; on the map the route draws itself first (1.6 s), then the point sets off
  function runFresh(id, view) { run.id = id; if (view === 1) runSet(0, false); else runSet(-1.6, true); }
  // where the point is at the run's time s, as a part of the run (0 the start, 1 the finish)
  function runAt(id, s) {
    const R = RT[id], Dr = runDur(id); s = ((s % Dr) + Dr) % Dr;
    if (!R.fly) return s / Dr;
    const F = R.fly.frames, x = Math.min(F.length - 1, s * R.fly.fps), k = Math.max(0, Math.min(F.length - 2, Math.floor(x)));
    return (F[k][0] + (F[k + 1][0] - F[k][0]) * (x - k)) / R.len;
  }
  // that place on the map (its route's points lie evenly along the run, routes.py)
  function routePt(T, f) {
    const P = T.route, x = Math.max(0, Math.min(1, f)) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(x)), u = x - i;
    return [P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u];
  }
  // a view of the stage that waited for its picture (pend: the video playing at the run's moment, the map's pictures loaded) fades in over the
  // view shown before it, which then goes
  function reveal(box) {
    if (!box.classList.contains('pend')) return;
    box.classList.remove('pend');
    setTimeout(() => { const st = box.parentNode; if (st) for (const o of st.querySelectorAll('.dio.away')) o.remove(); }, 350);
  }
  // the map's pictures loaded (or failed), or 1.5 s at most
  function mapLoaded(box, done) {
    const ims = [...box.querySelectorAll('image')]; let n = ims.length, fin = false;
    const end = () => { if (!fin) { fin = true; done(); } }, one = () => { if (--n <= 0) end(); };
    for (const im of ims) { im.addEventListener('load', one, { once: true }); im.addEventListener('error', one, { once: true }); }
    if (!n) end(); else setTimeout(end, 1500);
  }
  // the stage after a render (prev: the views it had before, the last one on top). The same view of the same track as before (a sheet opened,
  // the weather changed) is kept as it is: the flyover plays on, the map's point runs on. The other view of the same track (the switch 1 / 2)
  // waits for its picture over the one shown, then fades in; the run goes on in it. Another track, or the screen entered anew: a new run.
  function stageViews(prev, entering) {
    const st = $('#track-stage', app), box = st && $('.dio', st), t = curTrack();
    const kind = (b) => b.classList.contains('fly') ? 1 : b.classList.contains('topmap') ? 2 : 0, key = (b) => kind(b) + ':' + (b.dataset.route || b.dataset.map);
    if (!box || !t || !kind(box)) { run.id = ''; runSet(0, false); return; }   // (a model of the land: nothing runs on it)
    prev = prev.filter(b => kind(b) && (b.dataset.route || b.dataset.map) === t.id);   // (this track's views)
    if (entering || run.id !== t.id || !prev.length) { runFresh(t.id, kind(box)); return; }
    const pend = prev.find(b => b.classList.contains('pend')), cur = prev.filter(b => b !== pend).pop();
    if (pend && key(pend) === key(box)) { box.replaceWith(pend); if (cur) { cur.classList.add('away'); pend.before(cur); } return; }   // (asked for again while still on its way)
    if (cur && key(cur) === key(box)) {   // the same view: kept as it is (the route still drawing itself: on from where it was)
      box.replaceWith(cur); cur.classList.remove('away');
      const p = !cur.__drawn && $('path.rt', cur); if (p) p.style.animationDelay = (-Math.max(0, 1.6 + runNow())).toFixed(2) + 's';
      return;
    }
    if (kind(box) === 2) { box.classList.add('drawn'); box.__drawn = 1; }   // (the map comes in with its route drawn, its point where the run is)
    if (!cur) return;
    box.classList.add('pend'); cur.classList.add('away'); box.before(cur);
    if (kind(box) === 2) mapLoaded(box, () => reveal(box));   // (a flyover: flyLabels plays it from the run's moment, then reveals it)
  }
  // the map's point, each frame at the run's place (and a flyover still on the stage, going or coming: the run is its video's)
  let mapRaf = 0;
  function mapDots() {
    cancelAnimationFrame(mapRaf); mapRaf = 0;
    const step = () => {
      mapRaf = 0;
      const boxes = app.querySelectorAll('#track-stage .dio.topmap[data-map]'); if (!boxes.length) return;
      if (!run.on && !$('#track-stage .dio.fly', app)) runSet(run.t, true);   // (the map alone: the run goes on from where the flyover held it)
      const s = runNow();
      for (const box of boxes) {
        const id = box.dataset.map, dot = box.__dot || (box.__dot = $('.rt-dot', box));
        if (id !== run.id || !dot) continue;
        if (s < 0) { dot.setAttribute('opacity', '0'); continue; }   // (the route still drawing itself)
        const p = routePt(RT[id].top, runAt(id, s));
        dot.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')'); dot.setAttribute('opacity', '1');
        if (!box.__drawn) { box.__drawn = 1; box.classList.add('drawn'); }
      }
      mapRaf = requestAnimationFrame(step);
    };
    if (app) step();
  }
  // the flyover: the names over it (each of its frames says where the start, the finish and the places are), the place reached and its height
  // in the corner, a short dip at the loop
  let flyRaf = 0;
  function flyLabels() {
    cancelAnimationFrame(flyRaf); flyRaf = 0;
    const box = $('#track-stage .dio.fly', app); if (!box) return;
    const id = box.dataset.route, R = RT[id], F = R.fly, M = D.routeMaps[id] || {}, v = $('video', box), lab = $('.flab', box), L = R.len, H0 = hudOf(R, M);
    const hud = $('.hud', box), hb = $('b', hud), hs = $('small', hud);
    // the flyover plays from the run's moment: on a new run from its first frame (the point at the start), not wherever autoplay's clock
    // reached while the video loaded (it is played only once that frame is ready; the poster, with the point at the start, shows until then);
    // after the map from the map's moment (the video is held there until it plays, the map staying over it until then). From then on its time
    // is the run's
    if (v && !v.__fly) {
      v.__fly = 1;
      const play = () => { if (!v.isConnected) return; const p = v.play(); if (p && p.catch) p.catch(() => {}); };   // (a video the stage has dropped meanwhile stays paused)
      const start = () => {
        if (!v.isConnected) return;
        const s = Math.max(0, runNow()) % runDur(id);
        runSet(s, false);
        if (s > 0.05) { v.addEventListener('seeked', play, { once: true }); try { v.currentTime = s; } catch (_) { play(); } }
        else if (v.readyState >= 2) { try { v.currentTime = 0; } catch (_) { /* not seekable yet */ } play(); }
        else v.addEventListener('loadeddata', () => { try { v.currentTime = 0; } catch (_) { /* not seekable yet */ } play(); }, { once: true });
      };
      v.addEventListener('playing', () => { if (!v.isConnected) { v.pause(); return; } v.__live = 1; reveal(box); });
      const fail = () => { if (!v.__live && box.classList.contains('pend')) reveal(box); };   // (no video, or none yet: its poster after all)
      v.addEventListener('error', fail, { once: true }); setTimeout(fail, 5000);
      if (v.readyState >= 1) start(); else v.addEventListener('loadedmetadata', start, { once: true });
    }
    // (the place's name slides in once: not again when the stage is drawn again round the same flyover)
    if (!hud.__in) { hud.__in = 1; hud.addEventListener('animationend', () => hud.classList.remove('in')); }
    const alt = M.alt ? M.alt.map(a => num(a) + ' m') : ['', ''];
    const tag = (cls, name, sub, icon) => '<div class="fl-' + cls + '">' + (icon || '') + '<b>' + esc(name) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
    const loop = !R.open, sub0 = alt[0] || (M.stage ? M.stage + ' start' : ''), sub1 = alt[1] || '';
    lab.innerHTML = tag('s start', loop ? 'Start · finish' : M.start || 'Start', sub0, flagSvg(false).replace('<g', '<svg viewBox="-2 -28 20 30" width="18" height="26"><g') + '</svg>') + tag('s finish', loop ? 'Finish' : M.finish || 'Finish', sub1, '<svg viewBox="-2 -28 20 30" width="18" height="26">' + flagSvg(true) + '</svg>') +
      F.places.map(n => tag('q', n, '')).join('');
    const els = [...lab.children], pd = F.places.map(n => { const q = R.places.find(x => x[0] === n) || R.places.find(x => x[0].indexOf(n) >= 0);   // (the same name first: Zbilje, not Zbilje Grove)
      return q ? q[1] : (n === 'Split 1' ? L / 3 : n === 'Split 2' ? 2 * L / 3 : -1e9); });
    let last = 0, looped = false, pl = hb.textContent || null, al = null;
    const step = () => {
      if (!v.isConnected) return;
      // a short dip at the loop: the end fades out, the start fades back in (not the very first start: the poster shows there)
      const t = v.currentTime || 0, dur = v.duration; if (t < last - 1) looped = true; last = t;
      if (v.__live && run.id === id) runSet(t, !v.paused);   // (the video playing is the run's clock)
      const op = isFinite(dur) && dur > 3 && !v.paused ? Math.max(0, Math.min(1, (dur - t) / 0.45, looped ? t / 0.45 : 1)) : 1;
      v.style.opacity = hud.style.opacity = lab.style.opacity = op < 1 ? op.toFixed(2) : '';
      const f = F.frames[Math.min(F.frames.length - 1, Math.floor(t * F.fps))], W = box.clientWidth, H = box.clientHeight, k = Math.max(W / F.W, H / F.H), ox = (W - F.W * k) / 2, oy = (H - F.H * k) / 2;
      const put = (el, P, on) => { const y = P ? oy + P[1] * k : 0, vis = on && P && P[2] && P[0] > -40 && P[0] < F.W + 40 && P[1] > 0 && y < H - 60; el.style.opacity = vis ? 1 : 0; if (vis) el.style.transform = 'translate(' + (ox + P[0] * k).toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; };
      const d = f[0], name = placeAt(H0, d);
      put(els[0], f[1], d < L * 0.12); put(els[1], f[2], d > L * 0.8);
      pd.forEach((q, i) => put(els[2 + i], f[4][i], Math.abs(d - q) < L * 0.07));
      if (name !== pl) { hb.textContent = name; pl = name; hud.classList.remove('in'); void hud.offsetWidth; hud.classList.add('in'); }
      const a = altAt(R, M, d); if (a != null && Math.round(a) !== al) { al = Math.round(a); hs.textContent = num(al) + ' m'; }
      flyRaf = requestAnimationFrame(step);
    };
    flyRaf = requestAnimationFrame(step);
  }


  // what the race is, under the weather: the laps of a circuit race, else the mode
  const modeWhat = (t) => mode === 'race' && !t.def.open ? laps(t.laps).toUpperCase() : modeOf(mode).name.toUpperCase();

  /* ---------------- single race, step 2: the tracks of the mode ---------------- */
  function vTrack() {
    const list = TRACKS(), M = modeOf(mode);
    let h = '<section class="scr" id="s-track" aria-label="Single race">' + topbar('Single race', false, [2, 2, M.name]);
    h += '<div class="groups" role="tablist" aria-label="Track group">' + D.groups.filter(g => g.id !== 'test' || groupList('test').length).map(g => { const n = groupList(g.id).length; return '<button role="tab" aria-selected="' + (group === g.id) + '" data-act="group:' + g.id + '"' + (n ? '' : ' disabled') + '>' + esc(g.name) + '<i>' + n + '</i></button>'; }).join('') + '</div>';
    if (!list.length) return h + '<div class="stage"><p class="empty">No tracks for this mode.</p></div>' + foot('') + '</section>';
    trackIdx = Math.min(trackIdx, list.length - 1);
    const t = list[trackIdx], rec = t.rec, my = rec[1] !== '—' ? rec[1] : '';
    const badge = my ? '<div class="badge win">' + I.star.replace('<svg', '<svg style="width:16px;height:16px"') + '<span>YOUR ' + esc(rec[0].toUpperCase()) + ' · ' + esc(my) + '</span></div>' : '';
    // the picture, and under it the bar with the arrows and the track's number (3/14): the same on every track
    h += '<div class="stage navbar' + (isRoute(t) ? ' route' : '') + '" id="track-stage">' + stageView(t) +
      '<button class="arrow l" data-act="track:-1" aria-label="Previous track">' + I.left + '</button><button class="arrow r" data-act="track:1" aria-label="Next track">' + I.right + '</button>' + counter(trackIdx, list.length) + '</div>';
    h += '<div class="card">' + badge + '<h1>' + esc(t.name) + '<span class="tag ghost">' + esc(t.tag) + '</span></h1><p class="desc">' + esc(t.desc) + '</p>';
    const len = [I.flag, 'Length', t.km.toFixed(2) + ' km'], alt = t.def.alt, climb = alt ? [I.corners, alt[1] < alt[0] ? 'Descent' : 'Climb', (alt[1] < alt[0] ? '−' : '+') + num(Math.abs(Math.round(alt[1] - alt[0]))) + ' m'] : [I.corners, 'Corners', String(t.corners)];
    const recItem = [I.trophy(my ? 'gold' : ''), my ? 'Your ' + rec[0].toLowerCase() : rec[0], my || '—', my ? 'gold' : ''];
    if (mode === 'chase') h += info([[I.siren, 'Police', 'on your tail'], recItem, len]);
    else if (mode === 'trial') { const gold = G.medals(t.def); h += info([recItem, gold ? [I.medal, 'Gold time', clock(gold[0])] : [I.corners, 'Corners', String(t.corners)], len]); }
    else h += info([recItem, len, climb]);
    const car = G.car(), here = G.carHere();
    h += '<div class="drows"><button class="drow choose" data-act="pick-car" aria-label="Your car: ' + esc(car.name) + '. Choose another car">' + (HAS_CAR_IMG.includes(car.id) ? '<img src="' + carImg(car, car.color) + '" alt="">' : '<span class="mono">' + esc(car.name.charAt(0)) + '</span>') +
      '<div><small>YOUR CAR' + (here ? '' : ' · NOT IN GARAGE') + '</small><b>' + esc(car.name) + '</b></div>' + I.chev + '</button>' +
      '<button class="drow choose" data-act="pick-weather" aria-label="' + esc(WEATHER[weatherIdx()]) + ', ' + esc(modeWhat(t).toLowerCase()) + '. Change the weather and more">' + wIcon(WEATHER[weatherIdx()]) + '<div><small>' + esc(modeWhat(t)) + '</small><b>' + WEATHER[weatherIdx()] + '</b></div>' + I.chev + '</button></div>';
    h += '</div>';
    return h + foot('<button class="go" data-act="race-single">Race!</button>') + '</section>';
  }

  /* ---------------- overlays: sheets ---------------- */
  function creditsSheet() {   // where the menu's pictures of the Earth and its land come from, as their licences ask
    return '<div class="sheet-bg" data-act="close-sheet"><div class="sheet credits" role="dialog" aria-label="Credits"><h2>Credits</h2><dl>' +
      D.credits.map(c => '<dt>' + esc(c[0]) + '</dt><dd>' + esc(c[1]) + '</dd>').join('') + '</dl><div class="row"><button class="go" data-act="close-sheet">Done</button></div></div></div>';
  }
  const LENS = ['short', 'normal', 'long', 'endurance'];
  function weatherSheet() {
    const t = curTrack() || TR[0], S = G.S;
    let h = '<div class="sheet-bg clear" data-act="close-sheet"><div class="sheet" role="dialog" aria-label="Weather"><h2>Weather</h2><div class="wopts">' +
      WEATHER.map((w, i) => '<button aria-pressed="' + (weatherIdx() === i && (i === 1 ? S.weather === 'rain' : i === 2 ? S.weather === 'random' : S.weather === 'dry')) + '" data-act="weather:' + i + '">' + wIcon(w) + '<b>' + w + '</b></button>').join('') + '</div>';
    if (mode === 'race' && !t.def.open) h += '<div class="lapsrow"><span>LAPS</span><div class="stepper"><button data-act="laps:-1" aria-label="Fewer laps">−</button><b>' + t.laps + '</b><button data-act="laps:1" aria-label="More laps">+</button></div></div>';
    return h + '<div class="row"><button class="back" data-act="more-options" aria-label="More options"><span class="dots3">···</span></button><button class="go" data-act="close-sheet">Done</button></div></div></div>';
  }
  // the rest of the old track screen's choices, in a sheet of their own
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

  /* ---------------- rendering ---------------- */
  const VIEWS = { title: vTitle, track: vTrack };
  let preT = 0;   // (the track shown: its land on the globe loaded after a moment)
  function render(keepScroll) {
    if (!app) return;
    const sc = $('.scroll', app), top = keepScroll && sc ? sc.scrollTop : 0, prev = [...app.querySelectorAll('#track-stage .dio')];   // (the stage's views: kept or faded over, stageViews)
    for (const n of [...app.children]) if (!n.classList.contains('toast') && !n.classList.contains('intro')) n.remove();   // (the intro, if there is one, stays over everything)
    app.classList.toggle('on-title', screen === 'title');
    app.insertAdjacentHTML('afterbegin', VIEWS[screen]());
    if (screen === 'track') stageViews(prev, shown !== 'track');
    if (keepScroll && shown === screen) $('.scr', app).classList.add('still');   // an update in place (a choice, a sheet): no slide-in again
    if (keepScroll) { const n = $('.scroll', app); if (n) n.scrollTop = top; }
    if (screen === 'title') { const pn = $('.title-panel', app); if (!titleSub) panelH = pn.offsetHeight; else if (panelH) pn.style.minHeight = panelH + 'px'; }   // (Single race and Career open in the same frame, as tall)
    if (screen === 'track') wx.attach($('#track-stage', app), wxMode(), shown !== 'track'); else wx.detach();
    if (screen === 'track' && shown !== 'track' && window.Journey) Journey.preload(G.S.lastTrack ? [G.S.lastTrack] : []);   // (the globe before a race: the Earth, and where it starts)
    if (screen === 'track') {   // (and the track shown: its helicopter's flight; its land on the globe once it has been looked at a moment)
      const tt = curTrack(); if (tt && RT[tt.id] && hasFlight(tt.id)) heliData(tt.id);
      clearTimeout(preT); if (tt && window.Journey && RT[tt.id]) preT = setTimeout(() => { if (screen === 'track') Journey.preload([tt.id]); }, 1200);
    }
    flyLabels(); mapDots(); fitMaps();
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
    const A = app.getBoundingClientRect(), c = $('#s-track .card', app), r = c && c.getBoundingClientRect();
    const ok = r && r.width > 100 && (r.top - A.top > st.y + st.h - 2 || r.left - A.left >= st.x + st.w - 2);   // (under the stage, or beside it where the screen is on its side)
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
  // the national flags (drawn here: the country of the track); a made-up track stands in the country the globe takes it to
  const FLAGS = {
    Slovenia: '<rect width="30" height="7" fill="#fff"/><rect y="7" width="30" height="6" fill="#0b4ea2"/><rect y="13" width="30" height="7" fill="#ed1c24"/><path d="M5.6 3.6h6.4v5.8c0 2.9-1.6 4.4-3.2 5.1-1.6-.7-3.2-2.2-3.2-5.1z" fill="#0b4ea2" stroke="#ed1c24" stroke-width=".7"/><path d="M6.1 10.4l1.3-2.2.9 1.3.5-.8 1.6 2.6c-.6 1.4-1.4 2.1-1.6 2.3-.4-.2-2.1-1.3-2.7-3.2z" fill="#fff"/><path d="M6.2 11.3q.65-.45 1.3 0t1.3 0 1.3 0 1.3 0M6.5 12.2q.6-.4 1.2 0t1.2 0 1.2 0 1.1 0" fill="none" stroke="#0b4ea2" stroke-width=".35"/><g fill="#ffd200"><circle cx="7" cy="5.2" r=".45"/><circle cx="8.8" cy="4.7" r=".45"/><circle cx="10.6" cy="5.2" r=".45"/></g>',
    USA: '<rect width="30" height="20" fill="#fff"/><g fill="#b22234">' + Array.from({ length: 7 }, (_, i) => '<rect y="' + (i * 2 * 20 / 13).toFixed(2) + '" width="30" height="' + (20 / 13).toFixed(2) + '"/>').join('') + '</g><rect width="12" height="' + (7 * 20 / 13).toFixed(2) + '" fill="#3c3b6e"/><g fill="#fff">' + Array.from({ length: 20 }, (_, i) => '<circle cx="' + (1.2 + (i % 5) * 2.4 + ((i / 5 | 0) % 2) * 1.2).toFixed(1) + '" cy="' + (1.3 + (i / 5 | 0) * 2.6).toFixed(1) + '" r=".42"/>').join('') + '</g>',
    Finland: '<rect width="30" height="20" fill="#fff"/><path d="M8 0h5.5v20H8zM0 7.25h30v5.5H0z" fill="#002f6c"/>',
    Japan: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>',
    Monaco: '<rect width="30" height="10" fill="#ce1126"/><rect y="10" width="30" height="10" fill="#fff"/>',
    Austria: '<rect width="30" height="20" fill="#c8102e"/><rect y="6.67" width="30" height="6.67" fill="#fff"/>',
    Belgium: '<rect width="10" height="20" fill="#000"/><rect x="10" width="10" height="20" fill="#fdda24"/><rect x="20" width="10" height="20" fill="#ef3340"/>',
    Germany: '<rect width="30" height="6.67" fill="#000"/><rect y="6.67" width="30" height="6.67" fill="#dd0000"/><rect y="13.33" width="30" height="6.67" fill="#ffce00"/>',
  };
  const countryOf = (t) => t.country || (window.GEO && GEO.tracks[t.id] ? GEO.tracks[t.id].names.country : '');
  const flagSvgOf = (c) => FLAGS[c] ? '<svg class="ix-flag" viewBox="0 0 30 20" width="30" height="20" role="img" aria-label="Flag of ' + esc(c) + '">' + FLAGS[c] + '</svg>' : '';
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
  // in the race's weather); dry, one sunny and one mostly sunny (clear at night), a few degrees apart; the same each time for a track
  function weekendSky(t, wet) {
    const S = G.S, h = [...t.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7), sat = h % 2;
    const t0 = ({ summer: 23, autumn: 13, winter: 2 }[S.season] ?? 20) + ({ dawn: -6, dusk: -3, night: -7 }[S.tod] || 0) + (h >>> 3) % 5 - 2, dT = 2 + (h >>> 9) % 4;
    const day = (i, k, dt) => ({ k, t: Math.round(t0 + dt), wind: 3 + (h >>> (5 + i * 4)) % 12 });
    if (wet) { const k = S.weather === 'storm' ? 'storm' : 'rain'; return [day(0, k, -3), day(1, k, -4)]; }
    const fine = S.tod === 'night' ? ['clear', 'clear'] : sat ? ['sun', 'part'] : ['part', 'sun'];
    return [day(0, fine[0], sat ? -dT : 0), day(1, S.weather === 'change' ? 'change' : fine[1], sat ? 0 : -dT)];
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
    const sun = sky[1], wet = R.wet || sun.k === 'storm';
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
    const t = R.track, under = $('#track-stage .dio.fly video', app); if (under) under.pause(); cancelAnimationFrame(flyRaf); cancelAnimationFrame(mapRaf);
    shown = '';   // (after the race the screen it was started from is entered afresh: its weather as it is, not faded in again)
    const off = setting('intro') === 2, rect = stageRect();
    wx.detach();
    if (R.kind === 'single' && weekendOn(t, R.mode)) { weekend(R, go); return; }   // (Circuit race: the race weekend's calendar is the intro)
    const el = document.createElement('div'); el.className = 'intro ix2'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Before the race');
    app.appendChild(el);
    const finishIntro = (e) => { if (e.isConnected) e.remove(); go(); };   // (the race is loaded: on to its start lights)
    if (off || !RT[t.id] || !hasFlight(t.id)) { finishIntro(el); return; }   // (Off, or a track without a flight: the lights at once)
    // Full: the globe from the last race (not the same track again: the short one then), with WebGL, for someone who did not ask for less motion
    const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, from = G.S.lastTrack && G.S.lastTrack !== t.id && XI[G.S.lastTrack] && XI[G.S.lastTrack].top && trackById(G.S.lastTrack) ? G.S.lastTrack : null;
    const globe = setting('intro') === 0 && G.S.lastTrack !== t.id && !calm && window.Journey && window.GEO && GEO.tracks[t.id] && Journey.supported();
    const country = countryOf(t), car = G.car();
    const what = [modeOf(R.mode).name, car && car.name, R.mode === 'race' && !t.def.open ? laps(t.laps) : null, R.wet ? 'Rain' : 'Dry'].filter(Boolean).join(' · ');
    const cr = cardRect(rect), side = cr.x >= rect.x + rect.w - 2;   // (on its side: the title and the buttons over the card, the stage the whole height at the left)
    el.innerHTML = '<div class="ix-head2" style="' + (side ? 'left:' + Math.round(cr.x) + 'px;height:' + Math.round(cr.y) + 'px' : 'height:' + Math.round(rect.y) + 'px') + '"><div class="ix-name">' + flagSvgOf(country) + '<h2>' + esc(t.name) + (country ? '<small>' + esc(country) + '</small>' : '') + '</h2></div>' +
      '<div class="ix-ctl"><button class="ix-mus" data-ix="music" aria-pressed="' + (setting('music') === 0) + '" aria-label="' + esc(D.intro.music) + '">' + SPK(setting('music') === 0) + '</button><button class="ix-skip" data-ix="skip">' + esc(D.intro.skip) + I.chev + '</button></div></div>' +
      '<div class="ix-v ix-stage' + (globe ? ' jon' : '') + '" style="left:' + rect.x + 'px;top:' + rect.y + 'px;width:' + rect.w + 'px;height:' + rect.h + 'px">' +
        '<video muted playsinline preload="auto" poster="assets/maps/heli-' + t.id + '.webp" src="assets/maps/heli-' + t.id + '.webm"></video>' + (globe && from ? introMap(from) : '') +
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
    const cur = gameTrack();
    if (cur && inMode(cur)) { group = cur.group; trackIdx = Math.max(0, groupList(group).indexOf(cur)); }
    else { group = GROUP_ORDER.find(g => groupList(g).length) || 'circuit'; trackIdx = 0; }
    select();
  }
  function warmFor(t) {   // the intro's sounds, started silent in the tap itself
    if (setting('intro') === 2 || !RT[t.id] || !hasFlight(t.id) || setting('sound') !== 0) return;
    const mus = XI[t.id] && XI[t.id].music; if (mus) warm('assets/music/' + mus + '.mp3'); warm('assets/music/rotor.mp3', true);
  }

  function back() {
    if (sheet) { sheet = null; render(true); return; }
    if (screen === 'track') { screen = 'title'; titleSub = 'single'; render(); return; }
    if (titleSub) { titleSub = null; render(true); }
  }
  function act(a, el) {
    const [k, v, w] = a.split(':');
    switch (k) {
      case 'back': back(); break;
      case 'single': titleSub = 'single'; render(true); break;   // (the modes open in the main menu's own frame)
      case 'career': titleSub = 'career'; render(true); break;
      case 'tsub': titleSub = v || null; render(true); break;
      case 'mode': mode = v; enterTrack(); screen = 'track'; render(); break;   // (a tap on a mode goes straight to its tracks)
      case 'group': group = v; trackIdx = 0; select(); render(true); break;
      case 'mapv': mapV = +v; G.setOption('mapV', mapV); render(true); break;
      case 'track': { const n = TRACKS().length; if (n) { trackIdx = (trackIdx + +v + n) % n; select(); render(); } break; }
      case 'laps': { const i = Math.max(0, Math.min(LENS.length - 1, LENS.indexOf(G.S.length) + +v)); G.setOption('length', LENS[i]); render(true); break; }
      case 'weather': G.setOption('weather', W_SET[+v]); render(true); break;
      case 'more-options': sheet = optionsSheet; render(true); break;
      case 'opt': {
        if (v === 'pkRoad') G.setPkRoad(w); else G.setOption(v, w);
        render(true); break;
      }
      case 'pick-car': carFrom = true; G.act('to-car'); break;   // (the garage of the game itself; Back and Next both come back to the track step)
      case 'pick-weather': sheet = weatherSheet; render(true); break;
      case 'credits': sheet = creditsSheet; render(true); break;
      case 'newver': G.newVer(); break;   // NEW VERSION · TEST 1: straight to driving the new map (js/game.js nvStart), no menu after it
      case 'close-sheet': sheet = null; render(true); break;
      case 'game': G.act(v, el); break;   // (a screen of the game itself: Settings, Leaderboard, Multiplayer, the career's)
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
  const padRoot = () => app ? $('.intro', app) || $('.sheet-bg', app) || app : null;
  function padKey(k) {
    if (!app || !G || !G.visible()) return false;
    const wk = $('.intro.wk', app);   // (the race weekend: B back to the tracks, Start the button's choice, A the highlighted button)
    if (wk) { if (k === 'b' || k === 'start') { G.click(); wk.__wk[k === 'b' ? 'back' : 'go'](); return true; } return false; }
    if ($('.intro', app)) { if (k === 'a' || k === 'b' || k === 'start') { const sk = $('.intro [data-ix="skip"]', app); if (sk) sk.click(); } return true; }
    if (k === 'b') { G.click(); back(); return true; }
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
      if ($('.intro', app) && !el.closest('.intro')) return;   // (nothing under the intro: a key on a button behind it)
      if (el.classList.contains('sheet-bg') && e.target !== el) return;   // clicks inside the sheet do not close it
      if (!el.dataset.act.startsWith('game:')) G.click();   // (the game clicks for its own actions)
      act(el.dataset.act, el);
    });
    document.addEventListener('keydown', (e) => {
      if (!G || !G.visible()) return;
      const wk = $('.intro.wk', app); if (wk) { if (e.key === 'Escape') { e.preventDefault(); wk.__wk.back(); } return; }   // (Esc: the race weekend back to the tracks)
      if ($('.intro', app)) { if (e.key === 'Escape') { e.preventDefault(); const sk = $('.intro [data-ix="skip"]', app); if (sk) sk.click(); } return; }   // (Esc skips the intro)
      if (e.key === 'Escape') { if (sheet || screen === 'track' || titleSub) { e.preventDefault(); back(); } }
      if (screen === 'track' && !sheet && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) act('track:' + (e.key === 'ArrowLeft' ? -1 : 1));
    });
    window.addEventListener('resize', () => wx.resize());
    // swipe the track model to change the track
    let sw = null;
    app.addEventListener('pointerdown', (e) => { if (screen === 'track' && e.target.closest('.dio')) sw = { x: e.clientX, y: e.clientY }; });
    app.addEventListener('pointerup', (e) => {
      if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.6 && !sheet) act('track:' + (dx < 0 ? 1 : -1));
    });
    app.addEventListener('pointercancel', () => { sw = null; });
  }

  /* ---------------- the game's side ---------------- */
  let ready = false, want = null, carFrom = false;
  const flush = () => { if (!ready || !want) return; const n = want; want = null; show(n); };
  function show(name) { try { showNow(name); } catch (e) { fail(e); } }
  function showNow(name) {
    if (!ready) { want = name; return; }
    if (carFrom && name === 'title' && screen === 'track') name = 'track';   // (Back from the car screen: the step it was opened from)
    carFrom = false;
    if (name === 'title') { screen = 'title'; titleSub = null; sheet = null; }
    else {
      const cur = gameTrack();
      screen = 'track'; sheet = null;
      if (cur && inMode(cur) && TRACKS().includes(cur)) trackIdx = TRACKS().indexOf(cur); else if (!TRACKS().length || !(cur && inMode(cur))) enterTrack(); else { group = cur.group; trackIdx = TRACKS().indexOf(cur); }
    }
    mapV = G.S.mapV === 2 ? 2 : 1;   // (1 the flyover by default, 2 the map)
    render();
  }
  function hide() {   // another screen of the game is up: the menu's moving things rest (a show still waiting for the style: dropped)
    want = null;
    if (!app) return;
    wx.detach(); cancelAnimationFrame(flyRaf); cancelAnimationFrame(mapRaf); clearTimeout(preT);
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
      ready = true; flush();
    } catch (e) { fail(e); }
  }
  function refresh() { if (ready && G && G.visible() && app && !$('.intro', app) && !sheet) render(true); }   // (a challenge arrived, the install offer came: the title shows it)
  // fromTrack: the game's car screen was opened from the track step (its Nazaj goes back there); set again when the game comes back to
  // that screen from the garage (game.js garageBack)
  window.Menu = { init, show, hide, refresh, padRoot, padKey, get ready() { return ready; }, beforeRace, get fromTrack() { return carFrom; }, set fromTrack(v) { carFrom = !!v; if (carFrom) screen = 'track'; }, debug: () => ({ screen, titleSub, mode, group, trackIdx, tracks: TR.map(t => t.id), run: { id: run.id, t: runNow(), on: run.on } }) };
})();
