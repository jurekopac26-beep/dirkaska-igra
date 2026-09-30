/* =========================================================================
   MENU MOCKUP — screens and navigation. Texts and numbers come from data.js.
   Nothing here is connected to the game: buttons that would start a race or
   a purchase only show what would happen.
   ========================================================================= */
(function () {
  'use strict';
  const D = window.MENU, OUT = window.OUTLINES || {};
  const $ = (s, el) => (el || document).querySelector(s);
  const app = $('#app');
  const store = {
    get(k, d) { try { const v = localStorage.getItem('apex-mockup-' + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem('apex-mockup-' + k, JSON.stringify(v)); } catch (_) { /* private mode: not remembered */ } },
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (n) => Number(n).toLocaleString('en-US');
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const laps = (n) => n + (n === 1 ? ' lap' : ' laps');

  /* ---------------- icons ---------------- */
  const cupPath = (f, s) => '<path d="M9.5 4.5h13v7.5a6.5 6.5 0 0 1-13 0z" fill="' + f + '" stroke="' + s + '" stroke-width="1.4"/><path d="M9.6 7H5.8a4.2 4.2 0 0 0 4.6 5.8M22.4 7h3.8a4.2 4.2 0 0 1-4.6 5.8" fill="none" stroke="' + s + '" stroke-width="2.2" stroke-linecap="round"/><path d="M14.3 18h3.4v5h-3.4z" fill="' + s + '"/><path d="M10.5 23.5h11v3.8h-11z" fill="' + f + '" stroke="' + s + '" stroke-width="1.2"/>';
  const CUP = { 3: ['#ffd24a', '#b88700'], 2: ['#e7ecf3', '#8390a3'], 1: ['#e8a066', '#8a4f22'], 0: ['rgba(255,255,255,.06)', 'rgba(255,255,255,.28)'] };
  const I = {
    left: '<svg viewBox="0 0 20 20"><path d="M14 3.5v13L4 10z" fill="#fff"/></svg>',
    right: '<svg viewBox="0 0 20 20"><path d="M6 3.5v13L16 10z" fill="#fff"/></svg>',
    back: '<svg viewBox="0 0 22 22"><path d="M14 4 7 11l7 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 18 18"><path d="m7 3 6 6-6 6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cup: (t) => '<svg viewBox="0 0 32 32">' + cupPath(CUP[t][0], CUP[t][1]) + '</svg>',
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
    trophy: (c) => '<svg width="24" height="24" viewBox="0 0 32 32">' + cupPath(c === 'gold' ? '#ffc629' : 'none', c === 'gold' ? '#ffc629' : '#fff') + '</svg>',
    motor: '<svg viewBox="0 0 24 24"><path d="M3 10h2.5V8H8V6h6v2h2.5l2 2H21v6h-2.5l-2 2.5H8.5L5.5 16H3z" fill="#fff"/></svg>',
    tyre: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="3.4"/><circle cx="12" cy="12" r="3.4" fill="#fff"/></svg>',
    brake: '<svg viewBox="0 0 24 24"><circle cx="11" cy="13" r="8" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="11" cy="13" r="2.6" fill="#fff"/><path d="M15 3.5a9.5 9.5 0 0 1 6 6.5" fill="none" stroke="#ff5145" stroke-width="3.2" stroke-linecap="round"/></svg>',
    wing: '<svg viewBox="0 0 24 24"><path d="M2 7h20l-2.5 4H4.5z" fill="#fff"/><path d="M7 11v7M17 11v7" stroke="#fff" stroke-width="2.4"/><path d="M4 19h16" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
    wifi: '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M2.5 9a14 14 0 0 1 19 0M5.8 12.4a9.3 9.3 0 0 1 12.4 0M9 15.7a4.6 4.6 0 0 1 6 0" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="19.3" r="1.7" fill="#fff"/></svg>',
    key: '<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="8" cy="12" r="4.5" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M12.5 12H21M18 12v3.5M21 12v2.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
    bolt2: '<svg width="26" height="26" viewBox="0 0 22 24"><path d="M13 1.5 3.5 14h6.5l-1.5 8.5L19 10h-6.8z" fill="#fff"/></svg>',
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

  /* ---------------- state ---------------- */
  let ST, screen, carIdx, colorIdx, trackIdx, tab, seriesId, raceSel, lapsSel, weather, lbTrack, friendMode, history, sheet = null, settings;
  const S = () => D.states[ST];
  const owned = () => !!S().owned;
  const carLocked = (c) => !owned() && !c.free;
  const trackLocked = (t) => !owned() && !t.free;
  const trackById = (id) => D.tracks.find(t => t.id === id);
  const fullName = (t) => t.country ? t.name + ', ' + t.country : t.name;
  const troOf = (s) => (S().trophies[s.id] || []).concat(Array(s.races.length).fill(0)).slice(0, s.races.length);
  const pctOf = (s) => Math.round(sum(troOf(s)) / (3 * s.races.length) * 100);
  const totalTro = () => D.series.reduce((a, s) => a + sum(troOf(s)), 0);
  const maxTro = () => D.series.reduce((a, s) => a + 3 * s.races.length, 0);
  const careerPct = () => Math.round(totalTro() / maxTro() * 100);
  function seriesState(i) {   // 'pay' (free version), 'lock' (previous series under the unlock %), 'open'
    const s = D.series[i];
    if (!owned() && !s.free) return 'pay';
    if (i > 0 && pctOf(D.series[i - 1]) < D.unlockAt && sum(troOf(s)) === 0) return 'lock';
    return 'open';
  }
  const raceReward = (s) => s.trial ? 4000 : [0, 1500, 3000, 6000, 10000][s.lv];
  const upgOf = (car) => (S().upgrades[car.id] || [0, 0, 0, 0]);

  function resetForState() {
    const s = S();
    carIdx = s.car; colorIdx = s.color; trackIdx = s.track; tab = 'stats'; seriesId = null; raceSel = null; lapsSel = null; weather = 0; lbTrack = s.track; friendMode = null;
  }

  /* ---------------- persistent parts: video background, 3D car ---------------- */
  const CLIPS = ['jezero', 'ljubljana', 'gora'];
  const bg = (function () {
    const el = document.createElement('div'); el.className = 'bgv'; el.setAttribute('aria-hidden', 'true');
    const poster = new Image(); poster.src = 'assets/video/poster-' + CLIPS[0] + '.jpg'; poster.alt = ''; el.appendChild(poster);
    const vids = [0, 1].map(() => { const v = document.createElement('video'); v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = 'auto'; v.style.opacity = '0'; el.appendChild(v); return v; });
    let k = 0, cur = 0, on = false, started = false;
    const src = (i) => 'assets/video/bg-' + CLIPS[i % CLIPS.length] + '.webm';
    function start() {
      if (started) return; started = true;
      vids[0].src = src(0); vids[1].src = src(1); vids[1].load();
      vids[0].addEventListener('playing', () => { vids[0].style.opacity = '1'; }, { once: true });
      play(vids[0]);
    }
    function play(v) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    vids.forEach((v, i) => v.addEventListener('timeupdate', () => {
      if (i !== cur || !v.duration || v.currentTime < v.duration - 0.75 || v._out) return;
      v._out = true; k++; cur = 1 - cur; const n = vids[cur]; n._out = false; n.currentTime = 0; play(n); n.style.opacity = '1'; v.style.opacity = '0';
      setTimeout(() => { v.pause(); v.src = src(k + 1); v.load(); }, 800);
    }));
    return {
      el,
      setOn(o) { on = o; if (o) { if (!started) start(); else play(vids[cur]); } else vids.forEach(v => v.pause()); },
    };
  })();
  const carHost = document.createElement('div'); carHost.style.cssText = 'position:absolute;inset:0;';
  let car3dReady = false;
  function ensureCar3D() { if (car3dReady || !window.THREE) return car3dReady; Car3D.init(carHost); car3dReady = true; Car3D.preload(['pico', 'kaze', 'rally']); return true; }

  /* ---------------- rendering ---------------- */
  const topbar = (title, money) => '<div class="topbar"><button class="sq" data-act="back" aria-label="Back">' + I.back + '</button><h2>' + esc(title) + '</h2>' + (money ? '<div class="money">' + I.coin + '<span>' + num(S().money) + '</span></div>' : '') + '</div>';
  const foot = (goHtml) => '<div class="foot"><button class="back" data-act="back" aria-label="Back">' + I.back + '</button>' + (goHtml || '') + '</div>';
  const info = (items) => '<div class="info">' + items.map(it => '<div class="' + (it[3] || '') + '">' + it[0] + '<div class="t"><small>' + esc(it[1]) + '</small><b>' + esc(it[2]) + '</b></div></div>').join('') + '</div>';
  const dots = (n, sel, lockFn) => '<div class="dots" aria-hidden="true">' + Array.from({ length: n }, (_, i) => '<i class="' + (i === sel ? 'on' : '') + (lockFn && lockFn(i) ? ' lock' : '') + '"></i>').join('') + '</div>';

  function vTitle() {
    const s = S(), t = D.tracks[trackIdx], cp = careerPct();
    const sub = t.trial ? fullName(t) + ' · time trial' : fullName(t) + ' · ' + laps(lapsSel || t.laps) + ' · 12 rivals';
    let h = '<section class="scr" id="s-title" aria-label="Main menu"><div id="bg-slot"></div><div class="title-wrap"><div class="title-panel">';
    h += '<h1 class="logo"><span class="l1">' + esc(D.game.l1) + '</span><span class="l2">' + esc(D.game.l2) + '</span></h1>';
    h += '<p class="sub">' + esc(sub) + '</p>';
    if (ST === 'veteran') h += '<p class="who">' + esc(s.player) + ' · Level ' + s.level + ' · ' + s.titles + ' titles · ' + s.records + ' track records</p>';
    h += '<div class="mbtns">';
    h += '<button class="mbtn primary" data-act="go:car"><span>Race</span></button>';
    h += '<button class="mbtn" data-act="go:career"><span>Career</span><span class="pct">' + cp + '%<i><b style="width:' + cp + '%"></b></i></span></button>';
    h += '<button class="mbtn" data-act="go:friend"><span>Race a Friend</span>' + (owned() ? '' : '<span class="lk">' + I.lock('#ffc629') + '3 tracks</span>') + '</button>';
    h += '<button class="mbtn" data-act="go:board"><span>Leaderboard</span></button>';
    h += '<button class="mbtn" data-act="go:settings"><span>Settings</span></button>';
    if (!owned()) h += '<button class="mbtn gold" data-act="offer"><span>Full Game · ' + esc(D.game.price) + '</span><small>+8 tracks · +4 cars · the whole career</small></button>';
    h += '</div>';
    h += '<p class="hint">' + (owned() ? 'Last race: ' + esc(s.lastRace) + '.' : 'Free: 3 tracks, 3 cars and the Rookie Cup, for good.') + '</p>';
    h += '</div></div></section>';
    return h;
  }

  function vCar() {
    const c = D.cars[carIdx], lockd = carLocked(c), up = upgOf(c), upSum = sum(up);
    const pw = Math.round(c.hp * (1 + 0.08 * up[0]));
    let badge = '';
    if (c.soon) badge = '<div class="badge cyan"><span>IN DEVELOPMENT</span></div>';
    else if (lockd) badge = '<div class="badge">' + I.lock('#ffc629') + '<span>FULL GAME</span></div>';
    else if (upSum) badge = '<div class="badge cyan"><span>UPGRADED · ' + upSum + ' OF 12</span></div>';
    let h = '<section class="scr" id="s-car" aria-label="Choose car">' + topbar('Choose car', owned());
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
      h += '<p class="upnote">' + (owned() ? 'Upgrades are paid with the credits you win in the career.' : 'In the free version you can upgrade the three free cars.') + '</p>';
    } else {
      h += '<div class="swatches">' + D.colors.map((x, i) => '<button aria-label="' + x.name + '" aria-pressed="' + (i === colorIdx) + '" data-act="color:' + i + '" style="background:' + x.hex + '"></button>').join('') + '</div><p class="swname">' + esc(D.colors[colorIdx].name) + '</p>';
    }
    h += '</div></div>';
    let go;
    if (c.soon) go = '<button class="go off" data-act="soon">Coming soon</button>';
    else if (lockd) go = '<button class="go gold" data-act="offer">Unlock · ' + esc(D.game.price) + '</button>';
    else go = '<button class="go" data-act="go:track">Next</button>';
    return h + foot(go) + '</section>';
  }

  function vTrack() {
    const t = D.tracks[trackIdx], lockd = trackLocked(t), my = S().myRecords[t.id], laps = t.trial ? 1 : (lapsSel || t.laps);
    let badge = '';
    if (lockd) badge = '<div class="badge">' + I.lock('#ffc629') + '<span>FULL GAME</span></div>';
    else if (my) badge = '<div class="badge win">' + I.star.replace('<svg', '<svg style="width:16px;height:16px"') + '<span>YOUR RECORD · ' + esc(my) + '</span></div>';
    let h = '<section class="scr" id="s-track" aria-label="Choose track">' + topbar('Choose track', owned());
    h += '<div class="stage" id="track-stage"><div class="dio' + (lockd ? ' lock' : '') + '"><img src="assets/tracks/' + t.id + '.webp" alt="3D model of the ' + esc(t.name) + ' track"></div>' +
      '<button class="arrow l" data-act="track:-1" aria-label="Previous track">' + I.left + '</button><button class="arrow r" data-act="track:1" aria-label="Next track">' + I.right + '</button>' + dots(D.tracks.length, trackIdx, (i) => trackLocked(D.tracks[i])) + '</div>';
    h += '<div class="card">' + badge + '<h1>' + esc(t.name) + '<span class="tag ghost">' + esc(t.tag) + '</span></h1><p class="desc">' + esc(t.desc) + '</p>';
    h += info([[I.trophy(my ? 'gold' : ''), my ? 'Your record' : t.rec[0], my || t.rec[1], my ? 'gold' : ''], [I.flag, 'Length', t.km.toFixed(2) + ' km'], [I.corners, 'Corners', String(t.corners)], [I.flag, t.trial ? 'Run' : 'Laps', t.trial ? 'Timed' : String(laps)]]);
    const B = [['Speed', t.bars.speed], ['Technique', t.bars.tech], ['Drift', t.bars.drift], ['Grip', t.bars.grip]];
    h += '<div class="bars" style="margin-top:6px">' + B.map(b => '<div class="brow"><span>' + b[0] + '</span>' + segBar(b[1]) + '<em>' + b[1] + '</em></div>').join('') + '</div>';
    h += '<div class="opts"><span>LAPS</span>' + (t.trial ? '<div class="stepper"><b>1 run</b></div>' : '<div class="stepper"><button data-act="laps:-1" aria-label="Fewer laps">−</button><b>' + laps + '</b><button data-act="laps:1" aria-label="More laps">+</button></div>') +
      '<span>WEATHER</span><div class="segs">' + ['Dry', 'Rain', 'Random'].map((w, i) => '<button aria-pressed="' + (weather === i) + '" data-act="weather:' + i + '">' + w + '</button>').join('') + '</div></div>';
    h += '</div>';
    const go = lockd ? '<button class="go gold" data-act="offer">Unlock · ' + esc(D.game.price) + '</button>' : '<button class="go" data-act="race">Race!</button>';
    return h + foot(go) + '</section>';
  }

  function seriesCard(s, i) {
    const st = seriesState(i), tro = troOf(s), p = pctOf(s), nx = S().next;
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
    const nx = S().next, s = D.series.find(x => x.id === nx[0]), t = trackById(s.races[nx[1]]);
    return '<button class="next" data-act="series:' + s.id + '"><div class="im"><img src="assets/tracks/' + t.id + '.webp" alt=""></div><div><small>NEXT RACE · ' + esc(s.name.toUpperCase()) + ' ' + (nx[1] + 1) + '/' + s.races.length + '</small><b>' + esc(t.name) + '</b><span>' +
      t.km.toFixed(2) + ' km · ' + (t.trial ? 'time trial' : laps(t.laps) + ' · 12 rivals') + '<br>Win: <em>' + num(raceReward(s)) + ' CR</em> · gold trophy</span></div></button>';
  }
  function vCareer() {
    const s = S(), cp = careerPct(), all = D.series.flatMap(x => troOf(x));
    const g = all.filter(t => t >= 3).length, sv = all.filter(t => t >= 2).length, br = all.filter(t => t >= 1).length;
    let h = '<section class="scr" id="s-career" aria-label="Career">' + topbar('Career', true) + '<div class="scroll">';
    h += '<div class="overall"><div class="big">' + cp + '<small>%</small></div><h3>CAREER<span>' + totalTro() + ' of ' + maxTro() + ' trophies</span></h3><div class="bar"><b style="width:' + cp + '%"></b></div>' +
      '<div class="tro-sum"><span>' + I.cup(3) + g + '</span><span>' + I.cup(2) + sv + '</span><span>' + I.cup(1) + br + '</span><span>Level ' + s.level + '</span></div></div>';
    h += D.series.map(seriesCard).join('');
    if (!owned()) h += '<button class="gbanner" data-act="offer"><div>Unlock the whole career<small>Home Cup, Time Attack, Legends and the Grand Championship</small></div><span class="p">' + esc(D.game.price) + '</span></button>';
    h += '</div>' + nextCard();
    return h + foot('<button class="go" data-act="race-next">' + (cp > 0 ? 'Continue' : 'Start') + '</button>') + '</section>';
  }

  function vSeries() {
    const i = D.series.findIndex(x => x.id === seriesId), s = D.series[i], st = seriesState(i), tro = troOf(s), p = pctOf(s), nx = S().next;
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

  function vFriend() {
    let h = '<section class="scr" id="s-friend" aria-label="Race a Friend">' + topbar('Race a Friend', false) + '<div class="scroll">';
    h += '<button class="bigbtn red" data-act="friend:create"><span>Create a room<small>Get a code and send it to your friend</small></span>' + I.wifi + '</button>';
    h += '<button class="bigbtn" data-act="friend:join"><span>Join with a code<small>Type the four letters your friend sends you</small></span>' + I.key + '</button>';
    h += '<button class="bigbtn" data-act="friend:quick"><span>Quick match<small>Race whoever is waiting right now</small></span>' + I.bolt2 + '</button>';
    h += '<div class="panel">';
    if (friendMode === 'create') h += '<h3>YOUR ROOM CODE</h3><div class="code"><b>K</b><b>7</b><b>Q</b><b>X</b></div><p class="note"><span class="pulse"></span>Waiting for your friend…</p>';
    else if (friendMode === 'join') h += '<h3>ENTER THE CODE</h3><div class="code"><b>M</b><b>4</b><b class="empty">·</b><b class="empty">·</b></div><p class="note">Both phones need the internet.</p>';
    else if (friendMode === 'quick') h += '<h3>QUICK MATCH</h3><p class="note"><span class="pulse"></span>Looking for a player…</p>';
    else h += '<h3>HOW IT WORKS</h3><p class="note" style="text-align:left">Two phones race each other over the internet. The one who creates the room picks the track, laps and weather.' + (owned() ? '' : ' In the free version you race on the three free tracks.') + '</p>';
    h += '</div></div>';
    return h + foot('') + '</section>';
  }

  function lbRows(t) {
    const base = t.rec[1].split(':'), sec0 = +base[0] * 60 + +base[1], my = S().myRecords[t.id];
    const names = D.leaderboardNames.filter(n => n !== t.rec[0]);
    const rows = [[t.rec[0], sec0]];
    for (let i = 0; i < 7; i++) rows.push([names[(i + t.id.length) % names.length], sec0 + (i + 1) * (0.31 + t.km * 0.06) + (i % 3) * 0.07]);
    if (my) { const p = my.split(':'); rows.push([S().player + ' (you)', +p[0] * 60 + +p[1], true]); }
    rows.sort((a, b) => a[1] - b[1]);
    const f = (s) => Math.floor(s / 60) + ':' + (s % 60).toFixed(2).padStart(5, '0');
    return rows.slice(0, 8).map((r, i) => '<tr class="' + (r[2] ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + esc(r[0]) + '</td><td>' + f(r[1]) + '</td></tr>').join('');
  }
  function vBoard() {
    const t = D.tracks[lbTrack];
    let h = '<section class="scr" id="s-board" aria-label="Leaderboard">' + topbar('Leaderboard', false);
    h += '<div class="chips" style="padding:2px 16px 8px">' + D.tracks.map((x, i) => '<button aria-pressed="' + (i === lbTrack) + '" data-act="lb:' + i + '">' + esc(x.name) + '</button>').join('') + '</div>';
    h += '<div class="scroll"><div class="panel"><h3>' + (t.trial ? 'BEST RUNS' : 'LAP RECORDS') + ' · ' + esc(t.name.toUpperCase()) + '</h3><table class="lb">' + lbRows(t) + '</table></div>';
    h += '<p class="note">Times are examples. The game keeps the records on the phone.</p></div>';
    return h + foot('') + '</section>';
  }
  function vSettings() {
    let h = '<section class="scr" id="s-settings" aria-label="Settings">' + topbar('Settings', false) + '<div class="scroll"><div class="panel"><h3>GAME</h3>';
    h += D.settings.map((s, i) => '<div class="setrow"><span>' + esc(s.label) + '</span><div class="segs">' + s.opts.map((o, k) => '<button aria-pressed="' + (settings[i] === k) + '" data-act="set:' + i + ':' + k + '">' + esc(o) + '</button>').join('') + '</div></div>').join('');
    h += '</div><div class="panel"><h3>ABOUT THIS MOCKUP</h3><p class="note" style="text-align:left">A design mockup of the menu. The cars and tracks come from the game, but nothing here changes the game. Switch between the free version, the full game and a veteran player with the bar at the top.</p></div></div>';
    return h + foot('') + '</section>';
  }

  const VIEWS = { title: vTitle, car: vCar, track: vTrack, career: vCareer, series: vSeries, friend: vFriend, board: vBoard, settings: vSettings };
  function render(keepScroll) {
    const sc = $('.scroll', app), top = keepScroll && sc ? sc.scrollTop : 0;
    app.innerHTML = VIEWS[screen]();
    if (keepScroll) { const n = $('.scroll', app); if (n) n.scrollTop = top; }
    if (screen === 'title') { $('#bg-slot', app).replaceWith(bg.el); bg.setOn(true); } else bg.setOn(false);
    if (screen === 'car' && ensureCar3D()) {
      const stage = $('#car-stage', app); stage.insertBefore(carHost, stage.firstChild);
      const c = D.cars[carIdx]; Car3D.show(c.model, colorIdx, { dark: !!c.soon }); Car3D.setVisible(true);
    } else if (car3dReady) Car3D.setVisible(false);
    if (sheet) app.insertAdjacentHTML('beforeend', sheet);
    const chip = $('.chips [aria-pressed="true"]', app); if (chip) chip.scrollIntoView({ block: 'nearest', inline: 'center' });
    store.set('view', { st: ST, screen: screen === 'series' ? 'career' : screen });
  }
  function go(to) { if (to !== screen) { history.push(screen); screen = to; } render(); }
  function back() { if (sheet) { sheet = null; render(true); return; } screen = history.pop() || 'title'; render(); }

  /* ---------------- overlays ---------------- */
  function toast(msg) {
    const old = $('.toast', app); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg; app.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
  function offer() {
    const o = D.offer;
    sheet = '<div class="sheet-bg" data-act="close-sheet"><div class="sheet" role="dialog" aria-label="Full game" data-stop="1"><h2>' + esc(o.title) + '<span>' + esc(D.game.price) + '</span></h2><p>' + esc(o.lead) + '</p><ul>' +
      o.items.map(x => '<li>' + I.check + esc(x) + '</li>').join('') + '</ul><div class="row"><button class="back" data-act="close-sheet" aria-label="Close">' + I.back + '</button><button class="go gold" data-act="buy">Buy · ' + esc(D.game.price) + '</button></div></div></div>';
    render(true);
  }
  function loading(t, label) {
    const el = document.createElement('div'); el.className = 'loading'; el.setAttribute('role', 'status');
    el.innerHTML = '<img src="assets/tracks/' + t.id + '.webp" alt=""><h2>' + esc(fullName(t)) + '</h2><div class="bar"><b style="width:4%"></b></div><p>' + esc(label) + '</p>';
    app.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => { $('.bar b', el).style.width = '100%'; }));
    setTimeout(() => {
      $('p', el).textContent = 'In the game the race starts here. This mockup stops at the menu.';
      const b = document.createElement('button'); b.className = 'go'; b.textContent = 'Back to menu'; b.style.minWidth = '220px';
      b.addEventListener('click', () => el.remove()); el.appendChild(b); b.focus();
    }, 1800);
  }

  /* ---------------- input ---------------- */
  function act(a, el) {
    const [k, v, w] = a.split(':');
    switch (k) {
      case 'go': go(v); break;
      case 'back': back(); break;
      case 'car': carIdx = (carIdx + +v + D.cars.length) % D.cars.length; render(); break;
      case 'color': colorIdx = +v; if (car3dReady) Car3D.setColor(colorIdx); render(true); break;
      case 'tab': tab = v; render(); break;
      case 'upg': toast(owned() || D.cars[carIdx].free ? 'Mockup: here you would buy the upgrade with career credits.' : 'This car is in the full game.'); break;
      case 'soon': toast('VIHRA S is still being built.'); break;
      case 'track': trackIdx = (trackIdx + +v + D.tracks.length) % D.tracks.length; lapsSel = null; render(); break;
      case 'laps': { const t = D.tracks[trackIdx]; lapsSel = Math.max(1, Math.min(9, (lapsSel || t.laps) + +v)); render(true); break; }
      case 'weather': weather = +v; render(true); break;
      case 'race': { const t = D.tracks[trackIdx]; loading(t, 'Loading the track · ' + D.cars[carIdx].name + ' · ' + ['dry', 'rain', 'random weather'][weather]); break; }
      case 'offer': offer(); break;
      case 'close-sheet': sheet = null; render(true); break;
      case 'buy': sheet = null; render(true); toast('Mockup: the Google Play purchase would open here.'); break;
      case 'series': seriesId = v; raceSel = null; go('series'); break;
      case 'srace': raceSel = +v; render(true); break;
      case 'race-series': { const s = D.series.find(x => x.id === seriesId); loading(trackById(s.races[raceSel]), s.name + ' · race ' + (raceSel + 1) + ' of ' + s.races.length); break; }
      case 'race-next': { const nx = S().next, s = D.series.find(x => x.id === nx[0]); loading(trackById(s.races[nx[1]]), s.name + ' · race ' + (nx[1] + 1) + ' of ' + s.races.length); break; }
      case 'locked': toast('Win more trophies in the previous series first.'); break;
      case 'lb': lbTrack = +v; render(); break;
      case 'set': settings[+v] = +w; render(true); break;
      case 'friend': friendMode = v; render(true); break;
      default: break;
    }
  }
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el || !app.contains(el)) return;
    if (el.classList.contains('sheet-bg') && e.target !== el) return;   // clicks inside the sheet do not close it
    act(el.dataset.act, el);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if ($('.loading', app)) $('.loading', app).remove(); else if (screen !== 'title' || sheet) back(); }
    if (screen === 'car' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) act('car:' + (e.key === 'ArrowLeft' ? -1 : 1));
    if (screen === 'track' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) act('track:' + (e.key === 'ArrowLeft' ? -1 : 1));
  });
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
    ST = b.dataset.st; store.set('state', ST); resetForState(); sheet = null; drawStates(); render();
  });
  $('#mock-hide').addEventListener('click', () => { $('#mockbar').hidden = true; $('#mockdot').hidden = false; store.set('bar', false); });
  $('#mockdot').addEventListener('click', () => { $('#mockbar').hidden = false; $('#mockdot').hidden = true; store.set('bar', true); });

  /* ---------------- start (keeps the place across a republish) ---------------- */
  function start(data) {
    data = data || {};
    ST = D.states[data.st] ? data.st : D.states[store.get('state', '')] ? store.get('state', '') : 'full';
    resetForState();
    settings = D.settings.map(s => s.sel);
    history = [];
    screen = VIEWS[data.screen] ? data.screen : 'title';
    if (data.screen && data.carIdx != null) { carIdx = data.carIdx; colorIdx = data.colorIdx; trackIdx = data.trackIdx; tab = data.tab || 'stats'; seriesId = data.seriesId || null; }
    if (screen === 'series' && !seriesId) screen = 'career';
    if (screen !== 'title') history = ['title'];
    if (store.get('bar', true) === false) { $('#mockbar').hidden = true; $('#mockdot').hidden = false; }
    drawStates(); render();
  }
  // for checking the mockup from a script: jump straight to a state and a screen
  window.MENU_DEBUG = { open(st, scr, o) { o = o || {}; if (D.states[st] && st !== ST) { ST = st; resetForState(); drawStates(); }
    if (o.carIdx != null) carIdx = o.carIdx; if (o.colorIdx != null) colorIdx = o.colorIdx; if (o.trackIdx != null) trackIdx = o.trackIdx; if (o.tab) tab = o.tab; if (o.seriesId) { seriesId = o.seriesId; raceSel = null; }
    sheet = null; history = scr === 'title' ? [] : ['title']; screen = scr; render(); if (o.offer) offer(); } };
  const hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(() => ({ st: ST, screen, carIdx, colorIdx, trackIdx, tab, seriesId }));
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
