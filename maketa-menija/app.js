/* =========================================================================
   MENU MOCKUP — screens and navigation. Texts and numbers come from data.js.
   Nothing here is connected to the game. A race is not driven: after Race
   you pick where you finished, and the menu goes on from that result
   (money, trophies, career %, today's ranking), so the flow can be tested.
   ========================================================================= */
(function () {
  'use strict';
  const D = window.MENU, OUT = window.OUTLINES || {};
  const $ = (s, el) => (el || document).querySelector(s);
  const app = $('#app');
  const store = {
    get(k, d) { try { const v = localStorage.getItem('apex-mockup-' + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem('apex-mockup-' + k, JSON.stringify(v)); } catch (_) { /* private mode: not remembered */ } },
    del(k) { try { localStorage.removeItem('apex-mockup-' + k); } catch (_) { /* nothing to remove */ } },
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (n) => Number(n).toLocaleString('en-US');
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const laps = (n) => n + (n === 1 ? ' lap' : ' laps');
  const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  const secs = (t) => { const p = String(t).split(':'); return +p[0] * 60 + +p[1]; };
  const clock = (s) => Math.floor(s / 60) + ':' + (s % 60).toFixed(2).padStart(5, '0');
  const mmss = (s) => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');

  /* ---------------- icons ---------------- */
  const cupPath = (f, s) => '<path d="M9.5 4.5h13v7.5a6.5 6.5 0 0 1-13 0z" fill="' + f + '" stroke="' + s + '" stroke-width="1.4"/><path d="M9.6 7H5.8a4.2 4.2 0 0 0 4.6 5.8M22.4 7h3.8a4.2 4.2 0 0 1-4.6 5.8" fill="none" stroke="' + s + '" stroke-width="2.2" stroke-linecap="round"/><path d="M14.3 18h3.4v5h-3.4z" fill="' + s + '"/><path d="M10.5 23.5h11v3.8h-11z" fill="' + f + '" stroke="' + s + '" stroke-width="1.2"/>';
  const CUP = { 3: ['#ffd24a', '#b88700'], 2: ['#e7ecf3', '#8390a3'], 1: ['#e8a066', '#8a4f22'], 0: ['rgba(255,255,255,.06)', 'rgba(255,255,255,.28)'] };
  const I = {
    left: '<svg viewBox="0 0 20 20"><path d="M14 3.5v13L4 10z" fill="#fff"/></svg>',
    right: '<svg viewBox="0 0 20 20"><path d="M6 3.5v13L16 10z" fill="#fff"/></svg>',
    back: '<svg viewBox="0 0 22 22"><path d="M14 4 7 11l7 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 18 18"><path d="m7 3 6 6-6 6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cup: (t) => '<svg viewBox="0 0 32 32">' + cupPath(CUP[t][0], CUP[t][1]) + '</svg>',
    bigcup: '<svg class="bigcup" viewBox="0 0 32 32" aria-hidden="true"><path d="M9.5 4.5h13v7.5a6.5 6.5 0 0 1-13 0z" fill="#ffc629" stroke="#8a6200" stroke-width=".8"/><path d="M9.6 7H5.8a4.2 4.2 0 0 0 4.6 5.8M22.4 7h3.8a4.2 4.2 0 0 1-4.6 5.8" fill="none" stroke="#ffc629" stroke-width="2" stroke-linecap="round"/><path d="M14.3 18h3.4v5h-3.4z" fill="#e0a40a"/><path d="M10.5 23.5h11v3.8h-11z" fill="#ffc629" stroke="#8a6200" stroke-width=".8"/><path d="M12 6.5h2.2v6.2a2 2 0 0 1-2.2-2z" fill="rgba(255,255,255,.55)"/></svg>',
    lock: (c) => '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="' + c + '"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="' + c + '" stroke-width="2.4"/></svg>',
    coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffc629"/><circle cx="12" cy="12" r="7" fill="none" stroke="#b07d00" stroke-width="1.6"/><text x="12" y="15.4" text-anchor="middle" font-family="Roboto, Arial" font-weight="900" font-size="8.4" fill="#7a5600">CR</text></svg>',
    check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffc629"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#1b1b1b" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#1b1b1b"/></svg>',
    bolt: '<svg width="20" height="24" viewBox="0 0 22 24"><path d="M13 1.5 3.5 14h6.5l-1.5 8.5L19 10h-6.8z" fill="#fff"/></svg>',
    weight: '<svg width="22" height="24" viewBox="0 0 22 24"><path d="M7.5 7a3.5 3.5 0 1 1 7 0" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M4.5 9h13l2.5 12.5H2z" fill="#fff"/><text x="11" y="19" text-anchor="middle" font-family="Roboto, Arial" font-weight="900" font-size="7" fill="#0e1a2c">KG</text></svg>',
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
    reset: '<svg viewBox="0 0 24 24"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M4 3.5v4.2h4.2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const minimap = (id) => { const t = OUT[id]; if (!t) return ''; return '<svg viewBox="' + t.vb + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path class="o" vector-effect="non-scaling-stroke" d="' + t.d + '"/><path class="i" vector-effect="non-scaling-stroke" d="' + t.d + '"/></svg>'; };
  const ring = (pct, lockCol) => {
    const r = 21, c = 2 * Math.PI * r, col = pct >= 100 ? '#ffc629' : pct > 0 ? '#3fd0ff' : 'rgba(255,255,255,.2)';
    return '<div class="ring"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="' + r + '" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.12)" stroke-width="5"/>' +
      (pct > 0 ? '<circle cx="26" cy="26" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + (c * pct / 100).toFixed(1) + ' ' + c.toFixed(1) + '"/>' : '') + '</svg>' +
      (lockCol ? '<span class="lock">' + I.lock(lockCol) + '</span>' : '<b>' + pct + '<small>%</small></b>') + '</div>';
  };
  const segCol = (i) => 'hsl(' + (128 - i * 6.6) + ', 88%, ' + (i < 8 ? 48 : 52) + '%)';
  const segBar = (n, up) => '<div class="segb" aria-hidden="true">' + Array.from({ length: 16 }, (_, i) => i < n ? '<i class="on" style="background:' + segCol(i) + '"></i>' : i < n + (up || 0) ? '<i class="up"></i>' : '<i></i>').join('') + '</div>';

  /* ---------------- data helpers ---------------- */
  const trackById = (id) => D.tracks.find(t => t.id === id);
  const carById = (id) => D.cars.find(c => c.id === id);
  const seriesById = (id) => D.series.find(s => s.id === id);
  const fullName = (t) => t.country ? t.name + ', ' + t.country : t.name;
  const WEATHER = ['Dry', 'Rain', 'Random'];
  const wIcon = (w) => [I.sun, I.rain, I.dice][Math.max(0, WEATHER.indexOf(w))];
  const carImg = (c, ci) => 'assets/cars/img/' + c.model + '-' + ci + '.webp';
  const trackImg = (t, wet) => 'assets/tracks/' + t.id + (wet ? '-rain' : '') + '.webp';
  const dio = (t, lockd) => '<div class="sky" aria-hidden="true"><i class="sun"></i><i class="cloud"></i></div><div class="dio' + (lockd ? ' lock' : '') + '"><div class="isl" style="animation-delay:-' + Math.round(performance.now() % 5000) + 'ms">' +
    '<img src="' + trackImg(t) + '" alt="3D model of the ' + esc(t.name) + ' track"><img class="wet" src="' + trackImg(t, true) + '" alt=""></div></div>';

  /* ---------------- progress: it changes as you "race" in the mockup, kept per state in this browser ---------------- */
  let ST, P;
  const fresh = (st) => { const s = D.states[st]; return { owned: !!s.owned, money: s.money, car: s.car, color: s.color, trophies: clone(s.trophies || {}), upgrades: clone(s.upgrades || {}), myRecords: clone(s.myRecords || {}), chase: {}, daily: null, last: '' }; };
  const loadP = (st) => { const p = store.get('p-' + st, null); if (!p || !p.trophies) return fresh(st); if (p.car == null) { p.car = D.states[st].car; p.color = D.states[st].color; } if (!p.chase) p.chase = {}; return p; };
  const saveP = () => store.set('p-' + ST, P);
  const S = () => D.states[ST];
  const owned = () => !!P.owned;
  const carLocked = (c) => !owned() && !c.free;
  const trackLocked = (t) => !owned() && !t.free;
  const troOf = (s) => (P.trophies[s.id] || []).concat(Array(s.races.length).fill(0)).slice(0, s.races.length);
  const pctOf = (s) => Math.round(sum(troOf(s)) / (3 * s.races.length) * 100);
  const totalTro = () => D.series.reduce((a, s) => a + sum(troOf(s)), 0);
  const maxTro = () => D.series.reduce((a, s) => a + 3 * s.races.length, 0);
  const careerPct = () => Math.round(totalTro() / maxTro() * 100);
  const level = () => 1 + Math.floor(totalTro() / 3);
  function seriesState(i) {   // 'pay' (in the full game), 'lock' (the previous series under the unlock %), 'open'
    const s = D.series[i];
    if (!owned() && !s.free) return 'pay';
    if (i > 0 && pctOf(D.series[i - 1]) < D.unlockAt && sum(troOf(s)) === 0) return 'lock';
    return 'open';
  }
  // the next career race: the first race without a trophy in an open series, else the first without gold
  function nextRace() {
    for (const pass of [0, 1]) for (let i = 0; i < D.series.length; i++) {
      if (seriesState(i) !== 'open') continue;
      const tro = troOf(D.series[i]), k = tro.findIndex(t => pass ? t < 3 : t === 0);
      if (k >= 0) return [D.series[i].id, k];
    }
    return null;
  }
  const raceReward = (s) => s.trial ? 4000 : [0, 1500, 3000, 6000, 10000][s.lv];
  const upgOf = (car) => (P.upgrades[car.id] || [0, 0, 0, 0]);

  /* ---------------- today's race ---------------- */
  const DAY = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const RANK = [0.004, 0.02, 0.05, 0.1, 0.16, 0.24, 0.33, 0.43, 0.54, 0.66, 0.78, 0.9, 0.97];   // finishing place -> share of the world ranking behind you
  function daily() {
    const d = D.daily, n = DAY, seed = (n * 9301 + 49297) % 233280;
    const track = trackById(d.tracks[n % d.tracks.length]), car = carById(d.cars[(n * 5 + 2) % d.cars.length]), weather = d.weather[(n * 3 + 1) % d.weather.length];
    const now = new Date(), min = now.getHours() * 60 + now.getMinutes(), left = 1440 - min;
    const mine = P.daily && P.daily.day === n ? P.daily : null;
    const players = Math.round((d.playersBase + seed % d.playersRange) * (0.3 + 0.7 * min / 1440)) + (mine ? 1 : 0);
    const best = secs(track.rec[1]) - 0.35 - (seed % 80) / 100, holder = D.leaderboardNames[seed % D.leaderboardNames.length];
    const runsLeft = owned() ? Infinity : Math.max(0, d.freeRuns - (mine ? mine.runs : 0));
    return { track, car, weather, laps: track.laps, players, best, holder, mine, runsLeft, resetIn: Math.floor(left / 60) + ' h ' + (left % 60) + ' min' };
  }

  /* ---------------- view state ---------------- */
  let screen, shown = '', mode = 'race', carIdx, colorIdx, trackIdx, tab, seriesId, raceSel, lapsSel, weather, lbTrack, mpMode, history, sheet = null, sheetOn = false, settings, result = null;
  const modeOf = (id) => D.modes.find(m => m.id === id) || D.modes[0];
  const dailyMode = () => daily().track.trial ? 'trial' : 'race';   // today's race is a circuit race, or a time trial on a hill climb or a rally stage
  // the tracks of the chosen mode (null: today's race, first in its own mode); a circuit race needs a circuit
  const TRACKS = () => (mode === dailyMode() ? [null] : []).concat(D.tracks.filter(t => mode !== 'race' || !t.trial));
  function resetView() {
    const s = S();
    carIdx = P.car; colorIdx = P.color; mode = 'race'; trackIdx = 0; tab = 'stats'; seriesId = null; raceSel = null; lapsSel = null; weather = 0; lbTrack = -1; mpMode = null; result = null;
  }

  /* ---------------- persistent parts: video background, 3D car ---------------- */
  const CLIPS = ['jezero', 'ljubljana', 'gora'];
  const bg = (function () {
    const el = document.createElement('div'); el.className = 'bgv'; el.setAttribute('aria-hidden', 'true');
    const poster = new Image(); poster.src = 'assets/video/poster-' + CLIPS[0] + '.jpg'; poster.alt = ''; el.appendChild(poster);
    const vids = [0, 1].map(() => { const v = document.createElement('video'); v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = 'auto'; v.style.opacity = '0'; el.appendChild(v); return v; });
    let k = 0, cur = 0, started = false;
    const src = (i) => 'assets/video/bg-' + CLIPS[i % CLIPS.length] + '.webm';
    const play = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    function start() {
      if (started) return; started = true;
      vids[0].src = src(0); vids[1].src = src(1); vids[1].load();
      vids[0].addEventListener('playing', () => { vids[0].style.opacity = '1'; }, { once: true });
      play(vids[0]);
    }
    vids.forEach((v, i) => v.addEventListener('timeupdate', () => {
      if (i !== cur || !v.duration || v.currentTime < v.duration - 0.75 || v._out) return;
      v._out = true; k++; cur = 1 - cur; const n = vids[cur]; n._out = false; n.currentTime = 0; play(n); n.style.opacity = '1'; v.style.opacity = '0';
      setTimeout(() => { v.pause(); v.src = src(k + 1); v.load(); }, 800);
    }));
    return { el, setOn(o) { if (o) { if (!started) start(); else play(vids[cur]); } else vids.forEach(v => v.pause()); } };
  })();
  const carHost = document.createElement('div'); carHost.style.cssText = 'position:absolute;inset:0;';
  let car3dReady = false;
  function ensureCar3D() { if (car3dReady || !window.THREE) return car3dReady; Car3D.init(carHost); car3dReady = true; Car3D.preload(['pico', 'kaze', 'rally']); return true; }

  /* ---------------- the weather on the track model: the wet model fades in and rain falls; Random swaps between the two ---------------- */
  const wx = (function () {
    const cv = document.createElement('canvas'); cv.className = 'rainfx'; cv.setAttribute('aria-hidden', 'true');
    const ctx = cv.getContext('2d'), calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let drops = [], raf = 0, a = 0, want = 0, last = 0, W = 0, H = 0, dpr = 1, timer = 0, wet = false, mode = '';
    function fit() {
      const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!r.width || (r.width === W && r.height === H)) return;
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      drops = Array.from({ length: Math.round(W * H / 1400) }, () => ({ x: Math.random() * (W + 60) - 60, y: Math.random() * H, l: 11 + Math.random() * 15, v: 620 + Math.random() * 380, o: 0.2 + Math.random() * 0.4 }));
    }
    function frame(t) {
      raf = 0; const el = last ? (t - last) / 1000 : 0.016, dt = Math.min(0.05, el); last = t;   // (the fade follows the clock, the drops a capped step)
      a = want > a ? Math.min(want, a + el / 0.5) : Math.max(want, a - el / 0.5);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      if (a > 0) {
        ctx.lineWidth = 1.2; ctx.lineCap = 'round';
        for (const d of drops) {
          d.y += d.v * dt; d.x += d.v * dt * 0.22;
          if (d.y - d.l > H) { d.y = -Math.random() * 30; d.x = Math.random() * (W + 60) - 60; }
          ctx.strokeStyle = 'rgba(214, 228, 255, ' + (d.o * a).toFixed(3) + ')';
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
        stage.querySelector('.dio').after(cv); fit();
        if (m !== mode || entering) { clearInterval(timer); timer = 0; mode = m; if (m === 'random') timer = setInterval(() => show(!wet), 2600); }
        void stage.offsetWidth;
        show(m === 'rain' ? true : m === 'dry' ? false : wet);
      },
      detach() { clearInterval(timer); timer = 0; mode = ''; want = 0; a = 0; wet = false; cv.remove(); if (raf) { cancelAnimationFrame(raf); raf = 0; } last = 0; },
      resize() { if (cv.parentNode) { W = 0; fit(); } },
    };
  })();
  const wxMode = () => (TRACKS()[trackIdx] == null ? daily().weather : WEATHER[weather]).toLowerCase();

  /* ---------------- rendering helpers ---------------- */
  const moneyPill = () => '<div class="money">' + I.coin + '<span>' + num(P.money) + '</span></div>';
  // step: [n, of, what] -> "Step 1 of 2 · Mode" ("1/2 · Mode" on a narrow screen)
  const topbar = (title, money, step) => '<div class="topbar"><button class="sq" data-act="back" aria-label="Back">' + I.back + '</button><h2>' + esc(title) +
    (step ? '<small><span class="sl">Step ' + step[0] + ' of ' + step[1] + '</span><span class="ss">' + step[0] + '/' + step[1] + '</span> · ' + esc(step[2]) + '</small>' : '') + '</h2>' + (money ? moneyPill() : '') + '</div>';
  const foot = (goHtml) => '<div class="foot"><button class="back" data-act="back" aria-label="Back">' + I.back + '</button>' + (goHtml || '') + '</div>';
  const info = (items) => '<div class="info">' + items.map(it => '<div class="' + (it[3] || '') + '">' + it[0] + '<div class="t"><small>' + esc(it[1]) + '</small><b>' + esc(it[2]) + '</b></div></div>').join('') + '</div>';
  const dots = (n, sel, lockFn, starFirst) => '<div class="dots" aria-hidden="true">' + Array.from({ length: n }, (_, i) => '<i class="' + (i === sel ? 'on' : '') + (lockFn && lockFn(i) ? ' lock' : '') + (starFirst && i === 0 ? ' star' : '') + '"></i>').join('') + '</div>';

  /* ---------------- main menu ---------------- */
  function vTitle() {
    const M = D.menu, d = daily(), nx = nextRace(), cp = careerPct();
    let singleChip;
    if (!owned()) singleChip = d.runsLeft > 0 ? '<em class="chip gold">1 FREE RUN TODAY</em>' : '<em class="chip">PLAYED TODAY · ' + ord(d.mine.rank) + '</em>';
    else singleChip = d.mine ? '<em class="chip">TODAY: ' + ord(d.mine.rank) + ' OF ' + num(d.players) + '</em>' : '<em class="chip gold">NEW TODAY</em>';
    const nb = (x) => String(x).replace(/ /g, '\u00a0');
    const careerSub = nx ? nb(cp + ' %') + '\u00a0· ' + nb(seriesById(nx[0]).name) + '\u00a0· ' + nb('race ' + (nx[1] + 1) + ' of ' + seriesById(nx[0]).races.length) : nb(cp + ' %') + '\u00a0· career complete';
    let h = '<section class="scr" id="s-title" aria-label="Main menu"><div id="bg-slot"></div>';
    h += '<div class="t-top"><h1 class="logo small"><span class="l1">' + esc(D.game.l1) + '</span><span class="l2">' + esc(D.game.l2) + '</span></h1><div class="t-me">' + moneyPill() +
      (ST === 'veteran' || totalTro() ? '<small>' + esc(S().player) + ' · Level ' + level() + '</small>' : '') + '</div></div>';
    h += '<div class="t-menu title-panel">';
    h += '<button class="tile t-single" data-act="single"><span class="tx"><b>' + M.single.title + '</b><small>' + esc(M.single.sub.replace('{track}', d.track.name).replace('{weather}', d.weather.toLowerCase())) + '</small>' + singleChip + '</span>' +
      '<span class="im"><img src="' + trackImg(d.track, d.weather === 'Rain') + '" alt=""></span></button>';
    h += '<button class="tile t-multi" data-act="go:multi"><span class="tx"><b>' + M.multi.title + '</b><small>' + esc(M.multi.sub) + '</small>' + (owned() ? '' : '<em class="chip">3 TRACKS IN FREE</em>') + '</span>' +
      '<span class="im"><img src="' + M.multi.img + '" alt=""></span></button>';
    h += '<button class="tile t-career" data-act="go:career"><span class="tx"><b>' + M.career.title + '</b><small>' + esc(careerSub) + '</small><i class="pbar"><b style="width:' + cp + '%"></b></i></span>' +
      '<span class="im">' + I.bigcup + '<img src="' + M.career.img + '" alt=""></span></button>';
    h += '<div class="t-row"><button class="tsmall" data-act="go:settings">' + I.cog + '<span>' + esc(M.settings) + '</span></button><button class="tsmall" data-act="go:board">' + I.podium + '<span>' + esc(M.board) + '</span></button></div>';
    if (!owned()) h += '<button class="mbtn gold buy" data-act="offer"><span>' + esc(M.buy) + ' · ' + esc(D.game.price) + '</span><small>' + esc(M.buySub) + '</small></button>';
    else h += '<div class="owned">' + I.check + '<span>' + esc(M.owned) + '</span></div>';
    h += '</div></section>';
    return h;
  }

  // what the race is, under the weather: the laps of a circuit race, else the mode
  const modeWhat = (t) => mode === 'race' && !t.trial ? laps(lapsSel || t.laps).toUpperCase() : modeOf(mode).name.toUpperCase();
  const goldTime = (t) => secs(t.rec[1]) + 1.2 * Math.max(1, t.km / 3);

  /* ---------------- single race, step 1: the mode ---------------- */
  function vMode() {
    let h = '<section class="scr" id="s-mode" aria-label="Single race: choose a mode">' + topbar('Single race', true, [1, 2, 'Mode']);
    h += '<div class="modes" role="radiogroup" aria-label="Mode">' + D.modes.map(m => '<button class="mode m-' + m.id + '" role="radio" aria-checked="' + (mode === m.id) + '" data-act="mode:' + m.id + '">' +
      '<span class="tx"><b>' + esc(m.name) + '</b><small>' + esc(m.sub) + '</small><em class="chip">' + esc(m.chip) + '</em></span><span class="im"><img src="' + m.img + '" alt=""></span><i class="tick" aria-hidden="true">' + I.check + '</i></button>').join('') + '</div>';
    return h + foot('<button class="go" data-act="mode-next">Next</button>') + '</section>';
  }

  /* ---------------- single race, step 2: the tracks of the mode (today's race first in its own mode) ---------------- */
  function vTrack() {
    const list = TRACKS(), isDaily = list[trackIdx] == null, M = modeOf(mode), lockDot = (i) => !!list[i] && trackLocked(list[i]);
    let h = '<section class="scr" id="s-track" aria-label="Single race">' + topbar('Single race', true, [2, 2, M.name]);
    if (isDaily) {
      const d = daily(), t = d.track;
      h += '<div class="stage" id="track-stage">' + dio(t) + '<div class="ribbon">TODAY\'S RACE</div>' +
        '<button class="arrow l" data-act="track:-1" aria-label="Previous track">' + I.left + '</button><button class="arrow r" data-act="track:1" aria-label="Next track">' + I.right + '</button>' + dots(list.length, trackIdx, lockDot, list[0] == null) + '</div>';
      const mine = d.mine;
      h += '<div class="card daily">' + (mine ? '<div class="badge win">' + I.star.replace('<svg', '<svg style="width:16px;height:16px"') + '<span>YOU ARE ' + ord(mine.rank).toUpperCase() + ' TODAY</span></div>' : '<div class="badge"><span>NEW RACE EVERY DAY</span></div>');
      h += '<h1>' + esc(t.name) + '<span class="tag">TODAY</span></h1><p class="desc">Everyone drives the same car in the same weather. A new race in ' + d.resetIn + '.</p>';
      h += info([[I.globe, 'Best today', clock(d.best), 'gold'], [I.people, 'Players', num(d.players)], [I.medal, 'Your place', mine ? ord(mine.rank) : '—', mine ? 'cy' : '']]);
      h += '<div class="drows"><div class="drow"><img src="' + carImg(d.car, d.car.color) + '" alt=""><div><small>CAR FOR EVERYONE</small><b>' + esc(d.car.name) + '</b></div></div>' +
        '<div class="drow">' + wIcon(d.weather) + '<div><small>' + (t.trial ? 'TIME TRIAL' : laps(d.laps).toUpperCase()) + '</small><b>' + esc(d.weather) + '</b></div></div></div>';
      h += '<p class="dnote">World best: ' + esc(d.holder) + (mine ? ' · your best: ' + esc(mine.time) : '') + '. ' + (owned() ? 'Unlimited runs in the full game.' : d.runsLeft > 0 ? 'Free version: one run today.' : 'Your free run for today is used. Come back tomorrow.') + '</p></div>';
      const go = d.runsLeft > 0 ? '<button class="go" data-act="race-daily">Race!</button>' : '<button class="go gold" data-act="offer">Unlimited · ' + esc(D.game.price) + '</button>';
      return h + foot(go) + '</section>';
    }
    const t = list[trackIdx], lockd = trackLocked(t), chase = mode === 'chase', my = chase ? null : P.myRecords[t.id], stars = chase ? P.chase[t.id] || 0 : 0, lp = t.trial ? 1 : (lapsSel || t.laps);
    let badge = '';
    if (lockd) badge = '<div class="badge">' + I.lock('#ffc629') + '<span>FULL GAME</span></div>';
    else if (my) badge = '<div class="badge win">' + I.star.replace('<svg', '<svg style="width:16px;height:16px"') + '<span>YOUR RECORD · ' + esc(my) + '</span></div>';
    else if (stars) badge = '<div class="badge win">' + I.star.replace('<svg', '<svg style="width:16px;height:16px"') + '<span>YOUR BEST ESCAPE · ' + '★'.repeat(stars) + '</span></div>';
    h += '<div class="stage" id="track-stage">' + dio(t, lockd) + '<div class="ribbon rmode r-' + mode + '">' + esc(M.name.toUpperCase()) + '</div>' +
      '<button class="arrow l" data-act="track:-1" aria-label="Previous track">' + I.left + '</button><button class="arrow r" data-act="track:1" aria-label="Next track">' + I.right + '</button>' + dots(list.length, trackIdx, lockDot, list[0] == null) + '</div>';
    h += '<div class="card">' + badge + '<h1>' + esc(t.name) + '<span class="tag ghost">' + esc(t.tag) + '</span></h1><p class="desc">' + esc(t.desc) + '</p>';
    const rec = [I.trophy(my ? 'gold' : ''), my ? 'Your record' : t.rec[0], my || t.rec[1], my ? 'gold' : ''], len = [I.flag, 'Length', t.km.toFixed(2) + ' km'];
    if (chase) h += info([[I.siren, 'Police', D.chase.police + ' cars'], [I.watch, 'Get away in', D.chase.limit], len]);
    else if (mode === 'trial') h += info([rec, [I.medal, 'Gold time', clock(goldTime(t))], len]);
    else h += info([rec, len, [I.corners, 'Corners', String(t.corners)]]);
    const B = [['Speed', t.bars.speed], ['Technique', t.bars.tech], ['Drift', t.bars.drift], ['Grip', t.bars.grip]];
    h += '<div class="bars tbars" style="margin-top:6px">' + B.map(b => '<div class="brow"><span>' + b[0] + '</span>' + segBar(b[1]) + '<em>' + b[1] + '</em></div>').join('') + '</div>';
    const car = D.cars[P.car];
    h += '<div class="drows"><button class="drow choose" data-act="pick-car" aria-label="Your car: ' + esc(car.name) + '. Choose another car"><img src="' + carImg(car, P.color) + '" alt=""><div><small>YOUR CAR</small><b>' + esc(car.name) + '</b></div>' + I.chev + '</button>' +
      '<button class="drow choose" data-act="pick-weather" aria-label="' + esc(WEATHER[weather]) + ', ' + esc(modeWhat(t).toLowerCase()) + '. Change the weather">' + wIcon(WEATHER[weather]) + '<div><small>' + esc(modeWhat(t)) + '</small><b>' + WEATHER[weather] + '</b></div>' + I.chev + '</button></div>';
    h += '</div>';
    const go = lockd ? '<button class="go gold" data-act="offer">Unlock · ' + esc(D.game.price) + '</button>' : '<button class="go" data-act="race-single">Race!</button>';
    return h + foot(go) + '</section>';
  }

  /* ---------------- choose car (opened from the car box of a single race) ---------------- */
  function vCar() {
    const c = D.cars[carIdx], lockd = carLocked(c), up = upgOf(c), upSum = sum(up), pw = Math.round(c.hp * (1 + 0.08 * up[0]));
    let badge = '';
    if (c.soon) badge = '<div class="badge cyan"><span>IN DEVELOPMENT</span></div>';
    else if (lockd) badge = '<div class="badge">' + I.lock('#ffc629') + '<span>FULL GAME</span></div>';
    else if (upSum) badge = '<div class="badge cyan"><span>UPGRADED · ' + upSum + ' OF 12</span></div>';
    let h = '<section class="scr" id="s-car" aria-label="Choose car">' + topbar('Choose car', true);
    h += '<div class="stage" id="car-stage"><p class="drag">DRAG TO TURN</p><button class="arrow l" data-act="car:-1" aria-label="Previous car">' + I.left + '</button><button class="arrow r" data-act="car:1" aria-label="Next car">' + I.right + '</button>' +
      (c.soon ? '<div class="soon-note">COMING SOON</div>' : '') + dots(D.cars.length, carIdx, (i) => carLocked(D.cars[i])) + '</div>';
    h += '<div class="card">' + badge + '<h1>' + esc(c.name) + '<span class="tag">' + esc(c.tag) + '</span></h1><p class="desc">' + esc(c.desc) + '</p>';
    h += info([[I.bolt, 'Power', num(pw) + ' hp', up[0] ? 'cy' : ''], [I.weight, 'Weight', num(c.kg) + ' kg'], [I.drive, 'Drive', c.drive], [I.gears, 'Gears', String(c.gears)]]);
    h += '<div class="tabs" role="tablist">' + [['stats', 'STATS'], ['upg', 'UPGRADES'], ['paint', 'PAINT']].map(([k, l]) => '<button role="tab" aria-selected="' + (tab === k) + '" data-act="tab:' + k + '">' + l + '</button>').join('') + '</div><div class="tabpane" role="tabpanel">';
    if (tab === 'stats') {
      const B = [['Power', c.stats.power, up[0]], ['Grip', c.stats.grip, Math.min(3, up[1] + Math.floor(up[3] / 2))], ['Lightness', c.stats.light, 0], ['Drift', c.stats.drift, 0]];
      h += B.map(b => '<div class="brow"><span>' + b[0] + '</span>' + segBar(Math.min(16, b[1]), Math.max(0, Math.min(16 - b[1], b[2]))) + '<em>' + (b[2] ? '<u>+' + b[2] + '</u>' : '') + (b[1] + b[2]) + '</em></div>').join('');
    } else if (tab === 'upg') {
      const U = [['Engine', I.motor], ['Tyres', I.tyre], ['Brakes', I.brake], ['Aero', I.wing]], price = [2500, 5000, 9000];
      h += '<div class="upg">' + U.map((u, i) => '<button class="' + (up[i] ? 'has' : '') + '" data-act="upg:' + i + '">' + u[1] + '<b>' + u[0] + '</b><span class="pips">' + [0, 1, 2].map(k => '<i class="' + (k < up[i] ? 'on' : '') + '"></i>').join('') + '</span><small>' + (up[i] >= 3 ? 'MAX' : num(price[up[i]]) + ' CR') + '</small></button>').join('') + '</div>';
      h += '<p class="upnote">Upgrades are paid with the credits you win in races.</p>';
    } else {
      h += '<div class="swatches">' + D.colors.map((x, i) => '<button aria-label="' + x.name + '" aria-pressed="' + (i === colorIdx) + '" data-act="color:' + i + '" style="background:' + x.hex + '"></button>').join('') + '</div><p class="swname">' + esc(D.colors[colorIdx].name) + '</p>';
    }
    h += '</div></div>';
    let go;
    if (c.soon) go = '<button class="go off" data-act="soon">Coming soon</button>';
    else if (lockd) go = '<button class="go gold" data-act="offer">Unlock · ' + esc(D.game.price) + '</button>';
    else go = '<button class="go" data-act="car-select">Select</button>';
    return h + foot(go) + '</section>';
  }

  /* ---------------- career ---------------- */
  function seriesCard(s, i) {
    const st = seriesState(i), tro = troOf(s), p = pctOf(s), nx = nextRace();
    const isCur = nx && nx[0] === s.id && st === 'open';
    let cls = 'serie', stl;
    if (st === 'pay') { cls += ' lk pay'; stl = '<div class="stl gold">In the full game · 100 %: ' + esc(s.reward) + '</div>'; }
    else if (st === 'lock') { cls += ' lk'; stl = '<div class="stl">Reach ' + D.unlockAt + ' % in ' + esc(D.series[i - 1].name) + ' to unlock</div>'; }
    else if (p >= 100) { cls += ' done'; stl = '<div class="stl win">Complete · ' + esc(s.reward) + ' collected</div>'; }
    else if (isCur) { cls += ' cur'; stl = '<div class="stl cur">Next: ' + esc(trackById(s.races[nx[1]]).name) + ' · race ' + (nx[1] + 1) + ' of ' + s.races.length + '</div>'; }
    else stl = '<div class="stl">' + sum(tro) + ' of ' + (3 * s.races.length) + ' trophies · 100 %: ' + esc(s.reward) + '</div>';
    const lockCol = st === 'pay' ? '#ffc629' : st === 'lock' ? '#8b98ad' : null;
    return '<button class="' + cls + '" data-act="series:' + s.id + '">' + ring(p, lockCol) + '<h3><span class="nm">' + esc(s.name) + '</span><span class="lvl lv' + s.lv + '">' + s.level + '</span></h3>' + I.chev +
      '<div class="cups">' + tro.map(t => '<i>' + I.cup(t) + '</i>').join('') + '<em>' + s.races.length + ' ' + (s.trial ? 'runs' : 'races') + '</em></div>' + stl + '</button>';
  }
  function nextCard() {
    const nx = nextRace();
    if (!nx) return '<div class="next done"><div class="im">' + I.bigcup + '</div><div><small>CAREER COMPLETE</small><b>Every trophy won</b><span>Replay any race to beat your times.</span></div></div>';
    const s = seriesById(nx[0]), t = trackById(s.races[nx[1]]);
    return '<button class="next" data-act="series:' + s.id + '"><div class="im"><img src="assets/tracks/' + t.id + '.webp" alt=""></div><div><small>NEXT RACE · ' + esc(s.name.toUpperCase()) + ' ' + (nx[1] + 1) + '/' + s.races.length + '</small><b>' + esc(t.name) + '</b><span>' +
      t.km.toFixed(2) + ' km · ' + (t.trial ? 'time trial' : laps(t.laps) + ' · 12 rivals') + '<br>Win: <em>' + num(raceReward(s)) + ' CR</em> · gold trophy</span></div></button>';
  }
  function vCareer() {
    const cp = careerPct(), all = D.series.flatMap(x => troOf(x));
    const g = all.filter(t => t >= 3).length, sv = all.filter(t => t >= 2).length, br = all.filter(t => t >= 1).length;
    let h = '<section class="scr" id="s-career" aria-label="Career">' + topbar('Career', true) + '<div class="scroll">';
    h += '<div class="overall"><div class="big">' + cp + '<small>%</small></div><h3>CAREER<span>' + totalTro() + ' of ' + maxTro() + ' trophies</span></h3><div class="bar"><b style="width:' + cp + '%"></b></div>' +
      '<div class="tro-sum"><span>' + I.cup(3) + g + '</span><span>' + I.cup(2) + sv + '</span><span>' + I.cup(1) + br + '</span><span>Level ' + level() + '</span></div></div>';
    h += D.series.map(seriesCard).join('');
    if (!owned()) h += '<button class="gbanner" data-act="offer"><div>Unlock the whole career<small>Home Cup, Time Attack, Legends and the Grand Championship</small></div><span class="p">' + esc(D.game.price) + '</span></button>';
    h += '</div>' + nextCard();
    const nx = nextRace();
    return h + foot(nx ? '<button class="go" data-act="race-next">' + (totalTro() ? 'Continue' : 'Start') + '</button>' : '') + '</section>';
  }
  function vSeries() {
    const i = D.series.findIndex(x => x.id === seriesId), s = D.series[i], st = seriesState(i), tro = troOf(s), p = pctOf(s), nx = nextRace();
    if (raceSel == null) raceSel = nx && nx[0] === s.id ? nx[1] : Math.max(0, tro.findIndex(t => t < 3));
    let h = '<section class="scr" id="s-series" aria-label="' + esc(s.name) + '">' + topbar(s.name, true);
    h += '<div class="shead">' + ring(p, st === 'pay' ? '#ffc629' : st === 'lock' ? '#8b98ad' : null) + '<div><p><b>' + sum(tro) + ' of ' + (3 * s.races.length) + ' trophies</b> · ' + s.races.length + ' ' + (s.trial ? 'runs' : 'races') + ' · ' + s.level + '</p><p class="rw">100 %: ' + esc(s.reward) + '</p>' +
      (st === 'lock' ? '<p>Reach ' + D.unlockAt + ' % in ' + esc(D.series[i - 1].name) + ' to unlock.</p>' : st === 'pay' ? '<p>This series is in the full game.</p>' : '') + '</div></div>';
    const rules = s.trial ? D.trophyRules.trial : D.trophyRules.race;
    h += '<div class="scroll"><div class="legend">' + rules.map((r, k) => '<span>' + I.cup(k + 1) + esc(r) + '</span>').join('') + '</div>';
    h += s.races.map((id, k) => {
      const t = trackById(id), done = tro[k];
      return '<button class="race' + (k === raceSel ? ' nx' : '') + '" data-act="srace:' + k + '"><span class="n">' + (k + 1) + '</span><span class="mm">' + minimap(id) + '</span><span><b>' + esc(t.name) + '</b><small>' +
        (s.trial ? 'Time trial' : laps(t.laps)) + ' · win ' + num(raceReward(s)) + ' CR</small></span><span class="r3">' + [1, 2, 3].map(q => I.cup(done >= q ? q : 0)).join('') + '</span></button>';
    }).join('');
    h += '</div>';
    const go = st === 'pay' ? '<button class="go gold" data-act="offer">Unlock · ' + esc(D.game.price) + '</button>' : st === 'lock' ? '<button class="go off" data-act="locked">Locked</button>' : '<button class="go" data-act="race-series">Race</button>';
    return h + foot(go) + '</section>';
  }

  /* ---------------- multiplayer ---------------- */
  function vMulti() {
    const fr = D.friendName, tr = D.tracks[0];
    let h = '<section class="scr" id="s-multi" aria-label="Multiplayer">' + topbar('Multiplayer', true) + '<div class="scroll">';
    h += '<button class="bigbtn' + (mpMode === 'create' ? ' red' : '') + '" data-act="mp:create"><span>Create a room<small>Get a code and send it to your friend</small></span>' + I.wifi + '</button>';
    h += '<button class="bigbtn' + (mpMode === 'join' ? ' red' : '') + '" data-act="mp:join"><span>Join with a code<small>Type the four letters your friend sends you</small></span>' + I.key + '</button>';
    h += '<button class="bigbtn' + (mpMode === 'quick' ? ' red' : '') + '" data-act="mp:quick"><span>Quick match<small>Race whoever is waiting right now</small></span>' + I.bolt2 + '</button>';
    h += '<div class="panel">';
    if (mpMode === 'create') h += '<h3>YOUR ROOM CODE</h3><div class="code"><b>K</b><b>7</b><b>Q</b><b>X</b></div><p class="note"><span class="pulse"></span>' + esc(fr) + ' joined · ' + esc(tr.name) + ' · ' + laps(tr.laps) + '</p>';
    else if (mpMode === 'join') h += '<h3>CODE</h3><div class="code"><b>M</b><b>4</b><b>P</b><b>R</b></div><p class="note"><span class="pulse"></span>In ' + esc(fr) + '\'s room · ' + esc(tr.name) + ' · ' + laps(tr.laps) + '</p>';
    else if (mpMode === 'quick') h += '<h3>QUICK MATCH</h3><p class="note"><span class="pulse"></span>Matched with T. Hayashi · ' + esc(tr.name) + ' · ' + laps(tr.laps) + '</p>';
    else h += '<h3>HOW IT WORKS</h3><p class="note" style="text-align:left">Two phones race each other over the internet. The one who creates the room picks the track, laps and weather.' + (owned() ? '' : ' In the free version you race on the three free tracks.') + '</p>';
    h += '</div></div>';
    return h + foot(mpMode ? '<button class="go" data-act="race-multi">Start race</button>' : '') + '</section>';
  }

  /* ---------------- leaderboard ---------------- */
  function lbTable(t, rows) { return '<table class="lb">' + rows.map(r => '<tr class="' + (r[2] ? 'me' : '') + (r[3] ? ' gap' : '') + '"><td>' + r[0] + '</td><td>' + esc(r[1]) + '</td><td>' + r[4] + '</td></tr>').join('') + '</table>'; }
  function lbRows(t) {
    const sec0 = secs(t.rec[1]), my = P.myRecords[t.id], names = D.leaderboardNames.filter(n => n !== t.rec[0]);
    const rows = [[t.rec[0], sec0]];
    for (let i = 0; i < 7; i++) rows.push([names[(i + t.id.length) % names.length], sec0 + (i + 1) * (0.31 + t.km * 0.06) + (i % 3) * 0.07]);
    if (my) rows.push([S().player + ' (you)', secs(my), true]);
    rows.sort((a, b) => a[1] - b[1]);
    return rows.slice(0, 8).map((r, i) => [i + 1, r[0], r[2], false, clock(r[1])]);
  }
  function vBoard() {
    const d = daily(), chips = [['Today', -1]].concat(D.tracks.map((x, i) => [x.name, i]));
    let h = '<section class="scr" id="s-board" aria-label="Leaderboard">' + topbar('Leaderboard', false);
    h += '<div class="chips" style="padding:2px 16px 8px">' + chips.map(([n, i]) => '<button aria-pressed="' + (i === lbTrack) + '" data-act="lb:' + i + '">' + esc(n) + '</button>').join('') + '</div><div class="scroll">';
    if (lbTrack < 0) {
      const names = D.leaderboardNames, rows = [[1, d.holder, false, false, clock(d.best)]];
      const others = names.filter(x => x !== d.holder);
      for (let i = 1; i < 8; i++) rows.push([i + 1, others[(DAY + i) % others.length], false, false, clock(d.best + i * 0.18 + (i % 3) * 0.05)]);
      if (d.mine) rows.push([num(d.mine.rank), S().player + ' (you)', true, true, d.mine.time]);
      h += '<div class="panel"><h3>TODAY · ' + esc(fullName(d.track).toUpperCase()) + ' · ' + num(d.players) + ' PLAYERS</h3>' + lbTable(d.track, rows) + '</div>';
      h += '<p class="note">' + (d.mine ? 'Your place today: ' + ord(d.mine.rank) + ' of ' + num(d.players) + '.' : 'Race today\'s race to get your place in the world ranking.') + ' A new race in ' + d.resetIn + '.</p>';
    } else {
      const t = D.tracks[lbTrack];
      h += '<div class="panel"><h3>' + (t.trial ? 'BEST RUNS' : 'LAP RECORDS') + ' · ' + esc(t.name.toUpperCase()) + '</h3>' + lbTable(t, lbRows(t)) + '</div><p class="note">Times are examples.</p>';
    }
    return h + '</div>' + foot('') + '</section>';
  }

  /* ---------------- settings ---------------- */
  function vSettings() {
    let h = '<section class="scr" id="s-settings" aria-label="Settings">' + topbar('Settings', false) + '<div class="scroll"><div class="panel"><h3>GAME</h3>';
    h += D.settings.map((s, i) => '<div class="setrow"><span>' + esc(s.label) + '</span><div class="segs">' + s.opts.map((o, k) => '<button aria-pressed="' + (settings[i] === k) + '" data-act="set:' + i + ':' + k + '">' + esc(o) + '</button>').join('') + '</div></div>').join('');
    h += '</div><div class="panel"><h3>ABOUT THIS MOCKUP</h3><p class="note" style="text-align:left">A design mockup of the menu. The cars and tracks come from the game, but nothing here changes the game. After Race you choose where you finished, and the menu goes on from that result. Switch between the free version, the full game and a veteran player with the bar at the top.</p>' +
      '<button class="bigbtn" data-act="reset" style="margin-top:10px"><span>Reset progress<small>Start the ' + esc(S().label.toLowerCase()) + ' state again</small></span></button></div></div>';
    return h + foot('') + '</section>';
  }

  /* ---------------- results ---------------- */
  function vResults() {
    if (result.R.chase) return vChaseResults();
    const r = result, R = r.R, t = R.track, cls = r.place === 1 ? 'p1' : r.place === 2 ? 'p2' : r.place === 3 ? 'p3' : '';
    const mode = R.kind === 'single' ? modeOf(R.mode).name : R.kind === 'career' ? 'Career · ' + seriesById(R.seriesId).name + ' · race ' + (R.raceIdx + 1) + ' of ' + seriesById(R.seriesId).races.length : R.kind === 'daily' ? 'Today\'s race' : R.kind === 'multi' ? 'Multiplayer · vs ' + r.rival : 'Single race';
    const head = R.trial ? { gold: 'GOLD', silver: 'SILVER', bronze: 'BRONZE', none: 'NO MEDAL' }[r.res] : ord(r.place).toUpperCase();
    let h = '<section class="scr" id="s-results" aria-label="Results"><div class="res-head ' + cls + (R.trial ? ' trial ' + r.res : '') + '"><div class="pos">' + head + '</div><div class="rt"><b>' + esc(fullName(t)) + '</b><small>' + esc(mode) + '</small></div></div><div class="scroll">';
    const row = (ic, label, val, extra) => '<div class="rrow">' + ic + '<span>' + esc(label) + '</span><b>' + val + '</b>' + (extra || '') + '</div>';
    let body = '';
    if (R.kind === 'multi') body += row(I.people, r.place === 1 ? 'You won the duel' : r.rival + ' won this time', r.place === 1 ? '1st of 2' : '2nd of 2');
    body += row(I.flag, R.trial ? 'Time' : 'Best lap', esc(clock(r.time)), r.pb ? '<em class="chip gold">NEW RECORD</em>' : '');
    if (R.kind === 'daily') {
      body += row(I.globe, 'Today\'s world ranking', ord(r.rank) + ' of ' + num(r.players), '<em class="chip">TOP ' + Math.max(1, Math.round(r.rank / r.players * 100)) + ' %</em>');
      body += row(I.medal, 'World best today', esc(clock(r.best)) + ' · ' + esc(r.holder));
    }
    body += row(I.coin.replace('<svg', '<svg width="22" height="22"'), 'Reward', '+' + num(r.reward) + ' CR');
    if (R.kind === 'career') {
      const s = seriesById(R.seriesId);
      body += '<div class="rrow cups3"><span>Trophies</span><div class="r3">' + [1, 2, 3].map(q => '<i class="' + (r.tro >= q ? 'on' : '') + '">' + I.cup(r.tro >= q ? q : 0) + '</i>').join('') + '</div><b>' + (r.newTro ? '+' + r.newTro : 'no new') + '</b></div>';
      body += '<div class="rbar"><div><span>' + esc(s.name) + '</span><b>' + r.series[0] + ' % → ' + r.series[1] + ' %</b></div><div class="bar"><b style="width:' + r.series[1] + '%"></b></div></div>';
      body += '<div class="rbar"><div><span>Career</span><b>' + r.career[0] + ' % → ' + r.career[1] + ' %</b></div><div class="bar"><b style="width:' + r.career[1] + '%"></b></div></div>';
      r.unlocked.forEach(n => { body += '<div class="unlock">' + I.check + '<span><b>' + esc(n) + '</b> unlocked</span></div>'; });
      if (r.seriesDone) body += '<div class="unlock gold">' + I.bigcup + '<span><b>' + esc(s.name) + ' complete!</b> ' + esc(s.reward) + '</span></div>';
    }
    if (R.kind === 'daily' && !owned()) body += '<button class="gbanner" data-act="offer"><div>Your free run for today is used<small>Come back tomorrow, or race today\'s race as often as you like in the full game</small></div><span class="p">' + esc(D.game.price) + '</span></button>';
    h += body + '</div>';
    const again = (R.kind === 'single' || R.kind === 'career') ? '<button class="back wide" data-act="again">Race again</button>' : '<span></span>';
    h += '<div class="foot">' + again + '<button class="go" data-act="res-continue">Continue</button></div>';
    return h + '</section>';
  }

  function vChaseResults() {
    const r = result, R = r.R, t = R.track, cls = ['busted', 'bronze', 'silver', 'gold'][r.stars];
    let h = '<section class="scr" id="s-results" aria-label="Results"><div class="res-head word ' + cls + '"><div class="pos">' + (r.escaped ? 'ESCAPED' : 'BUSTED') + '</div><div class="rt"><b>' + esc(fullName(t)) + '</b><small>Police chase' + (r.escaped ? ' · ' + '★'.repeat(r.stars) : '') + '</small></div></div><div class="scroll">';
    const row = (ic, label, val, extra) => '<div class="rrow">' + ic + '<span>' + esc(label) + '</span><b>' + val + '</b>' + (extra || '') + '</div>';
    h += row(I.siren, r.escaped ? 'You got away in' : 'The police caught you after', esc(mmss(r.time)), r.pb && r.escaped ? '<em class="chip gold">NEW BEST</em>' : '');
    h += row(I.watch, 'Time to get away', esc(D.chase.limit) + ' · ' + D.chase.police + ' police cars');
    h += row(I.coin.replace('<svg', '<svg width="22" height="22"'), 'Reward', '+' + num(r.reward) + ' CR');
    h += '</div><div class="foot"><button class="back wide" data-act="again">Race again</button><button class="go" data-act="res-continue">Continue</button></div>';
    return h + '</section>';
  }

  const VIEWS = { title: vTitle, mode: vMode, track: vTrack, car: vCar, career: vCareer, series: vSeries, multi: vMulti, board: vBoard, settings: vSettings, results: vResults };
  function render(keepScroll) {
    const sc = $('.scroll', app), top = keepScroll && sc ? sc.scrollTop : 0;
    if (screen === 'results' && !result) screen = 'title';
    app.innerHTML = VIEWS[screen]();
    if (keepScroll && shown === screen) $('.scr', app).classList.add('still');   // an update in place (a choice, a sheet): no slide-in again
    if (keepScroll) { const n = $('.scroll', app); if (n) n.scrollTop = top; }
    if (screen === 'title') { $('#bg-slot', app).replaceWith(bg.el); bg.setOn(true); } else bg.setOn(false);
    if (screen === 'car' && ensureCar3D()) {
      const stage = $('#car-stage', app); stage.insertBefore(carHost, stage.firstChild);
      const c = D.cars[carIdx]; Car3D.show(c.model, colorIdx, { dark: !!c.soon }); Car3D.setVisible(true);
    } else if (car3dReady) Car3D.setVisible(false);
    if (screen === 'track') wx.attach($('#track-stage', app), wxMode(), shown !== 'track'); else wx.detach();
    shown = screen;
    if (sheet) { app.insertAdjacentHTML('beforeend', typeof sheet === 'function' ? sheet() : sheet); if (sheetOn) $('.sheet-bg', app).classList.add('still'); }
    sheetOn = !!sheet;
    const chip = $('.chips [aria-pressed="true"]', app); if (chip) chip.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function go(to) { if (to !== screen) { history.push(screen); screen = to; } render(); }
  function back() { if (sheet) { sheet = null; render(true); return; } screen = history.pop() || 'title'; if (screen === 'results') screen = history.pop() || 'title'; render(); }

  /* ---------------- overlays ---------------- */
  function toast(msg) {
    const old = $('.toast', app); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg; app.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
  function offer() {
    const o = D.offer;
    sheet = '<div class="sheet-bg" data-act="close-sheet"><div class="sheet" role="dialog" aria-label="Full game"><h2>' + esc(o.title) + '<span>' + esc(D.game.price) + '</span></h2><p>' + esc(o.lead) + '</p><ul>' +
      o.items.map(x => '<li>' + I.check + esc(x) + '</li>').join('') + '</ul><div class="row"><button class="back" data-act="close-sheet" aria-label="Close">' + I.back + '</button><button class="go gold" data-act="buy">Buy · ' + esc(D.game.price) + '</button></div></div></div>';
    render(true);
  }

  function weatherSheet() {
    const t = TRACKS()[trackIdx] || D.tracks[0], lp = lapsSel || t.laps;
    let h = '<div class="sheet-bg clear" data-act="close-sheet"><div class="sheet" role="dialog" aria-label="Weather"><h2>Weather</h2><div class="wopts">' +
      WEATHER.map((w, i) => '<button aria-pressed="' + (weather === i) + '" data-act="weather:' + i + '">' + wIcon(w) + '<b>' + w + '</b></button>').join('') + '</div>';
    if (!t.trial && mode === 'race') h += '<div class="lapsrow"><span>LAPS</span><div class="stepper"><button data-act="laps:-1" aria-label="Fewer laps">−</button><b>' + lp + '</b><button data-act="laps:1" aria-label="More laps">+</button></div></div>';
    return h + '<div class="row"><button class="go" data-act="close-sheet">Done</button></div></div></div>';
  }

  /* ---------------- a race: loading, then "where did you finish?" (mockup), then the results ---------------- */
  let race = null;
  const wxLabel = (w, wet) => (w === 'Random' ? 'random weather: ' : '') + (wet ? 'rain' : 'dry');
  function startRace(R) {
    race = R;
    const t = R.track, el = document.createElement('div'); el.className = 'loading'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Race');
    el.innerHTML = '<img src="' + trackImg(t, R.wet) + '" alt=""><h2>' + esc(fullName(t)) + '</h2><div class="bar"><b style="width:4%"></b></div><p>' + esc(R.label) + '</p>';
    app.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => { $('.bar b', el).style.width = '100%'; }));
    setTimeout(() => {
      const opts = R.kind === 'multi' ? [['1', '1st', 'p1'], ['2', '2nd', '']] : R.chase ? [['3', 'Escaped ★★★', 'p1'], ['2', 'Escaped ★★', 'p2'], ['1', 'Escaped ★', 'p3'], ['0', 'Busted', 'busted']] :
        R.trial ? [['gold', 'Gold time', 'p1'], ['silver', 'Silver time', 'p2'], ['bronze', 'Bronze time', 'p3'], ['none', 'No medal', '']] :
        Array.from({ length: 13 }, (_, i) => [String(i + 1), ord(i + 1), i === 0 ? 'p1' : i === 1 ? 'p2' : i === 2 ? 'p3' : '']);
      el.innerHTML = '<div class="pick"><small>MOCKUP · THE RACE IS NOT DRIVEN HERE</small><h2>' + (R.chase ? 'How did the chase end?' : R.trial ? 'What time did you set?' : 'Where did you finish?') + '</h2><p>Pick a result to see how the menu goes on.</p><div class="places' + (opts.length < 5 ? ' few' : '') + '">' +
        opts.map(o => '<button class="' + o[2] + '" data-finish="' + o[0] + '">' + esc(o[1]) + '</button>').join('') + '</div><button class="cancel" data-finish="cancel">Leave the race</button></div>';
      el.addEventListener('click', (e) => { const b = e.target.closest('[data-finish]'); if (!b) return; el.remove(); if (b.dataset.finish !== 'cancel') finish(b.dataset.finish); });
      const first = $('[data-finish]', el); if (first) first.focus();
    }, 1300);
  }
  function finish(res) {
    if (race.chase) {   // a police chase: stars for how fast you got away, or busted
      const R = race, t = R.track, stars = +res, prev = P.chase[t.id] || 0;
      const out = { R, res, stars, escaped: stars > 0, time: [112, 161, 108, 65][stars], reward: D.chase.reward[3 - stars], pb: stars > prev };
      if (stars > prev) P.chase[t.id] = stars;
      P.money += out.reward; saveP();
      result = out; history.push(screen); screen = 'results'; render(); return;
    }
    const R = race, t = R.track, trial = !!R.trial;
    const place = trial ? { gold: 1, silver: 2, bronze: 4, none: 8 }[res] : +res;
    const T = D.trophyPlaces, tro = trial ? { gold: 3, silver: 2, bronze: 1, none: 0 }[res] : place <= T.gold ? 3 : place <= T.silver ? 2 : place <= T.bronze ? 1 : 0;
    const base = secs(t.rec[1]), time = trial ? base + { gold: 0.3, silver: 2.2, bronze: 4.6, none: 8.4 }[res] * Math.max(1, t.km / 3) : base + (place - 1) * 0.45 + 0.3 + t.km * 0.05;
    const out = { R, res, place, tro, time, reward: 0 };
    if (R.kind !== 'multi') { const prev = P.myRecords[t.id] ? secs(P.myRecords[t.id]) : Infinity; if (time < prev) { P.myRecords[t.id] = clock(time); out.pb = true; } }
    const share = D.prizes[Math.min(D.prizes.length, place) - 1];
    if (R.kind === 'career') {
      const s = seriesById(R.seriesId), before = pctOf(s), cBefore = careerPct(), open0 = D.series.map((_, i) => seriesState(i)), arr = troOf(s).slice(), old = arr[R.raceIdx];
      arr[R.raceIdx] = Math.max(old, tro); P.trophies[s.id] = arr;
      out.newTro = arr[R.raceIdx] - old; out.series = [before, pctOf(s)]; out.career = [cBefore, careerPct()];
      out.unlocked = D.series.filter((x, i) => open0[i] === 'lock' && seriesState(i) === 'open').map(x => x.name);
      out.seriesDone = before < 100 && pctOf(s) >= 100;
      out.reward = Math.round(raceReward(s) * share);
    } else if (R.kind === 'daily') {
      const d = daily(); P.daily = d.mine ? P.daily : { day: DAY, runs: 0 };
      P.daily.runs++;
      const players = d.players + (d.mine ? 0 : 1), rank = Math.max(1, Math.round(players * RANK[Math.min(13, place) - 1]));
      if (!P.daily.rank || rank < P.daily.rank) { P.daily.rank = rank; P.daily.place = place; P.daily.time = clock(time); }
      Object.assign(out, { rank, players, best: d.best, holder: d.holder });
      out.reward = Math.round(D.daily.reward * share);
    } else if (R.kind === 'multi') { out.rival = R.rival; out.reward = D.multiReward[place === 1 ? 0 : 1]; }
    else out.reward = Math.round(D.singleReward * share);
    P.money += out.reward; saveP();
    result = out; history.push(screen); screen = 'results'; render();
  }

  /* ---------------- input ---------------- */
  function act(a, el) {
    const [k, v, w] = a.split(':');
    switch (k) {
      case 'go': go(v); break;
      case 'back': back(); break;
      case 'single': go('mode'); break;
      case 'mode': mode = v; render(true); break;
      case 'mode-next': trackIdx = 0; lapsSel = null; go('track'); break;
      case 'car': carIdx = (carIdx + +v + D.cars.length) % D.cars.length; render(); break;
      case 'color': colorIdx = +v; if (car3dReady) Car3D.setColor(colorIdx); render(true); break;
      case 'tab': tab = v; render(); break;
      case 'upg': {
        const c = D.cars[carIdx], up = upgOf(c).slice(), i = +v, price = [2500, 5000, 9000][up[i]];
        if (carLocked(c) || c.soon) { toast('This car is in the full game.'); break; }
        if (up[i] >= 3) { toast('Already at the top level.'); break; }
        if (P.money < price) { toast('Not enough credits. Win races to earn more.'); break; }
        up[i]++; P.upgrades[c.id] = up; P.money -= price; saveP(); render(true); toast('Upgraded for ' + num(price) + ' CR.'); break;
      }
      case 'soon': toast('VIHRA S is still being built.'); break;
      case 'track': { const n = TRACKS().length; trackIdx = (trackIdx + +v + n) % n; lapsSel = null; render(); break; }
      case 'laps': { const t = TRACKS()[trackIdx]; lapsSel = Math.max(1, Math.min(9, (lapsSel || t.laps) + +v)); render(true); break; }
      case 'weather': weather = +v; render(true); break;
      case 'race-daily': { const d = daily(), wet = d.weather === 'Rain' || (d.weather === 'Random' && Math.random() < 0.5); startRace({ kind: 'daily', track: d.track, trial: !!d.track.trial, wet, label: 'Today\'s race · ' + d.car.name + ' · ' + wxLabel(d.weather, wet) }); break; }
      case 'race-single': {
        const t = TRACKS()[trackIdx] || D.tracks[0], w = WEATHER[weather], wet = w === 'Rain' || (w === 'Random' && Math.random() < 0.5);
        startRace({ kind: 'single', mode, track: t, trial: mode === 'trial' || !!t.trial, chase: mode === 'chase', wet,
          label: modeOf(mode).name + ' · ' + D.cars[P.car].name + (mode === 'race' ? ' · ' + laps(lapsSel || t.laps) : '') + ' · ' + wxLabel(w, wet) });
        break;
      }
      case 'pick-car': carIdx = P.car; colorIdx = P.color; tab = 'stats'; go('car'); break;
      case 'pick-weather': sheet = weatherSheet; render(true); break;
      case 'car-select': { const c = D.cars[carIdx]; if (c.soon || carLocked(c)) break; P.car = carIdx; P.color = colorIdx; saveP(); back(); break; }
      case 'race-series': { const s = seriesById(seriesId), t = trackById(s.races[raceSel]); startRace({ kind: 'career', track: t, trial: !!s.trial, seriesId: s.id, raceIdx: raceSel, label: s.name + ' · race ' + (raceSel + 1) + ' of ' + s.races.length }); break; }
      case 'race-next': { const nx = nextRace(); if (!nx) break; const s = seriesById(nx[0]); seriesId = s.id; raceSel = nx[1]; startRace({ kind: 'career', track: trackById(s.races[nx[1]]), trial: !!s.trial, seriesId: s.id, raceIdx: nx[1], label: s.name + ' · race ' + (nx[1] + 1) + ' of ' + s.races.length }); break; }
      case 'race-multi': { const rival = mpMode === 'quick' ? 'T. Hayashi' : D.friendName; startRace({ kind: 'multi', track: D.tracks[0], rival, label: 'Duel with ' + rival }); break; }
      case 'again': if (result) startRace(result.R); break;
      case 'res-continue': {   // back to where the race was started from
        const R = result.R; result = null;
        if (R.kind === 'career') { seriesId = R.seriesId; raceSel = null; history = ['title', 'career']; screen = 'series'; }
        else if (R.kind === 'multi') { history = ['title']; screen = 'multi'; }
        else { if (R.kind === 'daily') { mode = dailyMode(); trackIdx = 0; } else mode = R.mode; history = ['title', 'mode']; screen = 'track'; }
        render(); break;
      }
      case 'offer': offer(); break;
      case 'close-sheet': sheet = null; render(true); break;
      case 'buy': {
        sheet = null;
        if (ST === 'free') { P.owned = true; ST = 'full'; store.set('state', ST); store.set('p-full', P); drawStates(); }
        render(true); toast('Mockup: bought. Everything is unlocked, your progress stays.'); break;
      }
      case 'series': seriesId = v; raceSel = null; go('series'); break;
      case 'srace': raceSel = +v; render(true); break;
      case 'locked': toast('Win more trophies in the previous series first.'); break;
      case 'lb': lbTrack = +v; render(); break;
      case 'set': settings[+v] = +w; render(true); break;
      case 'mp': mpMode = v; render(true); break;
      case 'reset': P = fresh(ST); saveP(); resetView(); history = []; screen = 'title'; render(); toast('Progress reset.'); break;
      default: break;
    }
  }
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el || !app.contains(el)) return;
    if (el.classList.contains('sheet-bg') && e.target !== el) return;   // clicks inside the sheet do not close it
    act(el.dataset.act, el);
  });
  document.addEventListener('keydown', (e) => {
    if ($('.loading', app)) return;
    if (e.key === 'Escape' && (screen !== 'title' || sheet)) back();
    if (screen === 'car' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) act('car:' + (e.key === 'ArrowLeft' ? -1 : 1));
    if (screen === 'track' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) act('track:' + (e.key === 'ArrowLeft' ? -1 : 1));
  });
  window.addEventListener('resize', () => wx.resize());
  // swipe the track model to change the track
  let sw = null;
  app.addEventListener('pointerdown', (e) => { if (screen === 'track' && e.target.closest('.dio')) sw = { x: e.clientX, y: e.clientY }; });
  app.addEventListener('pointerup', (e) => { if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) act('track:' + (dx < 0 ? 1 : -1)); });

  /* ---------------- mockup bar ---------------- */
  function drawStates() {
    $('#states').innerHTML = Object.entries(D.states).map(([k, s]) => '<button aria-pressed="' + (k === ST) + '" data-st="' + k + '">' + esc(s.label) + '</button>').join('');
  }
  $('#states').addEventListener('click', (e) => {
    const b = e.target.closest('[data-st]'); if (!b || b.dataset.st === ST) return;
    ST = b.dataset.st; store.set('state', ST); P = loadP(ST); resetView(); sheet = null; history = []; screen = 'title'; drawStates(); render();
  });
  $('#mock-reset').addEventListener('click', () => act('reset'));
  $('#mock-hide').addEventListener('click', () => { $('#mockbar').hidden = true; $('#mockdot').hidden = false; store.set('bar', false); });
  $('#mockdot').addEventListener('click', () => { $('#mockbar').hidden = false; $('#mockdot').hidden = true; store.set('bar', true); });

  // for checking the mockup from a script: jump straight to a state and a screen
  window.MENU_DEBUG = {
    open(st, scr, o) {
      o = o || {};
      if (D.states[st] && st !== ST) { ST = st; P = loadP(ST); resetView(); drawStates(); }
      if (o.fresh) { P = fresh(ST); saveP(); resetView(); }
      if (o.carIdx != null) carIdx = o.carIdx; if (o.colorIdx != null) colorIdx = o.colorIdx; if (o.mode) mode = o.mode; if (o.trackIdx != null) trackIdx = o.trackIdx;
      if (o.daily) { mode = dailyMode(); trackIdx = 0; }
      if (o.trackId) { const i = TRACKS().findIndex(t => t && t.id === o.trackId); if (i >= 0) trackIdx = i; }
      if (o.tab) tab = o.tab; if (o.lbTrack != null) lbTrack = o.lbTrack; if (o.mpMode) mpMode = o.mpMode;
      if (o.seriesId) { seriesId = o.seriesId; raceSel = null; }
      sheet = null; history = scr === 'title' ? [] : scr === 'track' ? ['title', 'mode'] : ['title']; screen = scr; render(); if (o.offer) offer(); if (o.weatherSheet) act('pick-weather');
    },
    finish(kind, res) { const d = daily(); const R = kind === 'daily' ? { kind, track: d.track, trial: !!d.track.trial, label: '' } : kind === 'chase' ? { kind: 'single', mode: 'chase', chase: true, track: D.tracks[0], label: '' } : kind === 'career' ? (() => { const nx = nextRace(), s = seriesById(nx[0]); return { kind, track: trackById(s.races[nx[1]]), trial: !!s.trial, seriesId: s.id, raceIdx: nx[1], label: '' }; })() : kind === 'multi' ? { kind, track: D.tracks[0], rival: D.friendName, label: '' } : { kind: 'single', mode: 'race', track: D.tracks[0], label: '' }; race = R; finish(res); },
  };

  /* ---------------- start (keeps the place across a republish) ---------------- */
  function start(data) {
    data = data || {};
    ST = D.states[data.st] ? data.st : D.states[store.get('state', '')] ? store.get('state', '') : 'free';
    P = loadP(ST); resetView();
    settings = D.settings.map(s => s.sel);
    history = [];
    screen = VIEWS[data.screen] && data.screen !== 'results' ? data.screen : 'title';
    if (data.screen && data.carIdx != null) { carIdx = data.carIdx; colorIdx = data.colorIdx; mode = modeOf(data.mode).id; trackIdx = Math.min(data.trackIdx || 0, TRACKS().length - 1); tab = data.tab || 'stats'; seriesId = data.seriesId || null; }
    if (screen === 'series' && !seriesId) screen = 'career';
    if (screen !== 'title') history = screen === 'track' ? ['title', 'mode'] : ['title'];
    if (store.get('bar', true) === false) { $('#mockbar').hidden = true; $('#mockdot').hidden = false; }
    drawStates(); render();
  }
  const hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(() => ({ st: ST, screen, mode, carIdx, colorIdx, trackIdx, tab, seriesId }));
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
