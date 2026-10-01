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
  const I = {
    left: '<svg viewBox="0 0 20 20"><path d="M14 3.5v13L4 10z" fill="#fff"/></svg>',
    right: '<svg viewBox="0 0 20 20"><path d="M6 3.5v13L16 10z" fill="#fff"/></svg>',
    back: '<svg viewBox="0 0 22 22"><path d="M14 4 7 11l7 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 18 18"><path d="m7 3 6 6-6 6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
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
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  const minimap = (id) => { const t = OUT[id]; if (!t) return ''; return '<svg viewBox="' + t.vb + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path class="o" vector-effect="non-scaling-stroke" d="' + t.d + '"/><path class="i" vector-effect="non-scaling-stroke" d="' + t.d + '"/></svg>'; };
  const segCol = (i) => 'hsl(' + (128 - i * 6.6) + ', 88%, ' + (i < 8 ? 48 : 52) + '%)';
  const segBar = (n, up) => '<div class="segb" aria-hidden="true">' + Array.from({ length: 16 }, (_, i) => i < n ? '<i class="on" style="background:' + segCol(i) + '"></i>' : i < n + (up || 0) ? '<i class="up"></i>' : '<i></i>').join('') + '</div>';

  /* ---------------- data helpers ---------------- */
  const trackById = (id) => D.tracks.find(t => t.id === id);
  const carById = (id) => D.cars.find(c => c.id === id);
  const fullName = (t) => t.country ? t.name + ', ' + t.country : t.name;
  const WEATHER = ['Dry', 'Rain', 'Random'];
  const wIcon = (w) => [I.sun, I.rain, I.dice][Math.max(0, WEATHER.indexOf(w))];
  const carImg = (c, ci) => 'assets/cars/img/' + c.model + '-' + ci + '.webp';
  const trackImg = (t, wet) => 'assets/tracks/' + t.id + (wet ? '-rain' : '') + '.webp';
  const dio = (t, lockd) => '<div class="sky" aria-hidden="true"><i class="sun"></i><i class="cloud"></i></div><div class="dio' + (lockd ? ' lock' : '') + '"><div class="isl" style="animation-delay:-' + Math.round(performance.now() % 5000) + 'ms">' +
    '<img src="' + trackImg(t) + '" alt="3D model of the ' + esc(t.name) + ' track"><img class="wet" src="' + trackImg(t, true) + '" alt=""></div></div>';

  /* ---------------- progress: it changes as you "race" in the mockup, kept per state in this browser ---------------- */
  let ST, P;
  const fresh = (st) => { const s = D.states[st]; return { owned: !!s.owned, money: s.money, car: s.car, color: s.color, career: clone(s.career || {}), upgrades: clone(s.upgrades || {}), myRecords: clone(s.myRecords || {}), chase: {}, daily: null, lastTrack: s.lastTrack || '' }; };
  const loadP = (st) => {
    const p = store.get('p-' + st, null); if (!p || !p.myRecords) return fresh(st);
    if (p.car == null) { p.car = D.states[st].car; p.color = D.states[st].color; } if (!p.chase) p.chase = {};
    if (!p.career) { p.career = clone(D.states[st].career || {}); delete p.trophies; }   // (saved before the career had its four ways: its starting point)
    if (p.lastTrack == null) p.lastTrack = D.states[st].lastTrack || '';   // (saved before the journey on the globe: where the state's last race was)
    return p;
  };
  const saveP = () => store.set('p-' + ST, P);
  const S = () => D.states[ST];
  const owned = () => !!P.owned;
  const carLocked = (c) => !owned() && !c.free;
  const trackLocked = (t) => !owned() && !t.free;
  /* ---------------- the career: four ways to play it, each with its own progress (P.career) ----------------
     cup: the World Cup, rounds of circuits whose points add up (the top of a round's standings go through to the next round); chase: the
     chase missions one after another (one done opens the next); trial: a medal on each track (bronze opens the next); rally: stage after
     stage, the times add up */
  const C = D.career, MEDAL = { gold: 3, silver: 2, bronze: 1, none: 0 };
  const cm = () => { const c = P.career || (P.career = {}); c.cup = c.cup || { round: 0, res: [], rounds: [] }; c.chase = c.chase || { stars: [] }; c.trial = c.trial || { medals: {} }; c.rally = c.rally || { res: [] }; return c; };
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  // a World Cup race: the places of the rivals round the player's (the stronger a rival, the more often in front; the same every time)
  function cupPlaces(round, k, place) {
    const r = rng(round * 997 + k * 131 + 7), order = C.cup.rivals.map((n, i) => [n, i * 0.9 + r() * 7]).sort((a, b) => a[1] - b[1]).map(x => x[0]), out = {};
    let q = 1; for (const n of order) { if (q === place) q++; out[n] = q++; }
    return out;
  }
  // the standings of a round after the races raced so far: [{ name, pts, me }], the best first
  function cupTable(round, res) {
    const pts = (q) => C.cup.points[q - 1] || 0, T = { You: 0 };
    C.cup.rivals.forEach(n => { T[n] = 0; });
    res.forEach((place, k) => { T.You += pts(place); const pl = cupPlaces(round, k, place); for (const n in pl) T[n] += pts(pl[n]); });
    return Object.keys(T).map(n => ({ name: n, pts: T[n], me: n === 'You' })).sort((a, b) => b.pts - a.pts || (a.me ? -1 : b.me ? 1 : 0));
  }
  const cupPos = (round, res) => cupTable(round, res).findIndex(x => x.me) + 1;
  // a rally stage: the player's time from the finishing place, the rivals' from their own pace (the same every time)
  const stageTime = (k, place) => { const t = trackById(C.rally.stages[k].track); return secs(t.rec[1]) + 1.5 + (place - 1) * 2.8; };
  function rallyTable(res) {
    const T = [{ name: 'You', t: 0, me: true }].concat(C.rally.rivals.map((n, i) => ({ name: n, t: 0 })));
    res.forEach((place, k) => { const base = secs(trackById(C.rally.stages[k].track).rec[1]), r = rng(k * 211 + 13); T[0].t += stageTime(k, place); T.slice(1).forEach((x, i) => { x.t += base + 1.2 + i * 1.9 + r() * 4.5; }); });
    return T.sort((a, b) => a.t - b.t);
  }
  // how far each way is (0..1), and the whole career in %
  function cmProgress() {
    const c = cm(), R = C.cup.rounds;
    const cup = Math.min(1, (c.cup.round + (c.cup.round < R.length ? c.cup.res.length / R[c.cup.round].races.length : 0)) / R.length);
    const chase = sum(c.chase.stars) / (3 * C.chase.missions.length);
    const trial = C.trial.tracks.reduce((a, id) => a + MEDAL[c.trial.medals[id] || 'none'], 0) / (3 * C.trial.tracks.length);
    const rally = Math.min(1, c.rally.res.length / C.rally.stages.length);
    return { cup, chase, trial, rally };
  }
  const careerPct = () => { const p = cmProgress(); return Math.round((p.cup + p.chase + p.trial + p.rally) / 4 * 100); };
  const level = () => 1 + Math.floor(careerPct() / 6);
  const careerStarted = () => careerPct() > 0;
  // the next chase mission (the first not escaped / caught yet), the next time trial (the first without gold that is open)
  const nextMission = () => { const st = cm().chase.stars, k = C.chase.missions.findIndex((m, i) => !st[i]); return k < 0 ? C.chase.missions.length - 1 : k; };
  const missionOpen = (k) => k === 0 || !!cm().chase.stars[k - 1];
  const trialOpen = (k) => k === 0 || MEDAL[cm().trial.medals[C.trial.tracks[k - 1]] || 'none'] > 0;
  const nextTrial = () => { const M = cm().trial.medals, k = C.trial.tracks.findIndex((id, i) => trialOpen(i) && M[id] !== 'gold'); return k < 0 ? 0 : k; };
  const cupReward = (place) => Math.round(3000 * D.prizes[Math.min(D.prizes.length, place) - 1]);
  // the next race of a way of the career ('cup' | 'chase' | 'trial' | 'rally')
  function cmRace(k) {
    const c = cm();
    if (k === 'cup') { const ri = Math.min(c.cup.round, C.cup.rounds.length - 1), rd = C.cup.rounds[ri], i = Math.min(c.cup.res.length, rd.races.length - 1); return { kind: 'career', cm: 'cup', track: trackById(rd.races[i]), round: ri, idx: i, label: 'World Cup · ' + rd.name + ' · race ' + (i + 1) + ' of ' + rd.races.length }; }
    if (k === 'chase') { const i = nextMission(), m = C.chase.missions[i]; return { kind: 'career', cm: 'chase', chase: true, role: m.role, foe: m.foe, track: trackById(m.track), idx: i, label: 'Mission ' + (i + 1) + ' · ' + m.title }; }
    if (k === 'trial') { const i = nextTrial(); return { kind: 'career', cm: 'trial', trial: true, track: trackById(C.trial.tracks[i]), idx: i, label: 'Time trial · track ' + (i + 1) + ' of ' + C.trial.tracks.length }; }
    const i = Math.min(c.rally.res.length, C.rally.stages.length - 1), sg = C.rally.stages[i];
    return { kind: 'career', cm: 'rally', track: trackById(sg.track), idx: i, label: C.rally.name + ' · ' + sg.name };
  }
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
  let screen, shown = '', titleSub = null, panelH = 0, mode = 'race', group = 'circuit', mapV = 1, carIdx, colorIdx, trackIdx, tab, lapsSel, weather, lbTrack, mpMode, history, sheet = null, sheetOn = false, settings, result = null;
  const modeOf = (id) => D.modes.find(m => m.id === id) || D.modes[0];
  const dailyMode = () => daily().track.trial ? 'trial' : 'race';   // today's race is a circuit race, or a time trial on a hill climb or a rally stage
  // the tracks of a group in the chosen mode (null: today's race, first in its own mode and group); a circuit race needs a track that races
  const inMode = (t) => mode !== 'race' || !t.trial;
  const groupList = (g) => (mode === dailyMode() && daily().track.group === g ? [null] : []).concat(D.tracks.filter(t => t.group === g && inMode(t)));
  const TRACKS = () => groupList(group);
  function resetView() {
    const s = S();
    carIdx = P.car; colorIdx = P.color; titleSub = null; mode = 'race'; group = 'circuit'; trackIdx = 0; tab = 'stats'; lapsSel = null; weather = 0; lbTrack = -1; mpMode = null; result = null;
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
    const M = D.menu, d = daily(), cp = careerPct();
    let singleChip;
    if (!owned()) singleChip = d.runsLeft > 0 ? '<em class="chip gold">1 FREE RUN TODAY</em>' : '<em class="chip">PLAYED TODAY · ' + ord(d.mine.rank) + '</em>';
    else singleChip = d.mine ? '<em class="chip">TODAY: ' + ord(d.mine.rank) + ' OF ' + num(d.players) + '</em>' : '<em class="chip gold">NEW TODAY</em>';
    const nb = (x) => String(x).replace(/ /g, ' ');
    let h = '<section class="scr" id="s-title" aria-label="Main menu"><div id="bg-slot"></div>';
    h += '<div class="t-top"><h1 class="logo small"><span class="l1">' + esc(D.game.l1) + '</span><span class="l2">' + esc(D.game.l2) + '</span></h1><div class="t-me">' + moneyPill() +
      (ST === 'veteran' || careerStarted() ? '<small>' + esc(S().player) + ' · Level ' + level() + '</small>' : '') + '</div></div>';
    h += '<div class="t-menu title-panel' + (titleSub ? ' sub' : '') + '">';
    // Single race and Career open in this same frame (the race goes on behind it); a mode or a way of the career then opens its own screen
    const subHead = (title, sub) => '<div class="t-subhead"><button class="sq" data-act="tsub:" aria-label="Back to the main menu">' + I.back + '</button><div><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></div></div>';
    const card = (cls, act, cur, name, sub, chip, img) => '<button class="mode ' + cls + '" aria-current="' + cur + '" data-act="' + act + '"><span class="tx"><b>' + esc(name) + '</b><small>' + esc(sub) + '</small>' + (chip ? '<em class="chip">' + esc(chip) + '</em>' : '') + '</span><span class="im"><img src="' + img + '" alt=""></span><i class="tick" aria-hidden="true">' + I.check + '</i></button>';
    if (titleSub === 'single') {
      h += subHead('Single race', 'Choose a mode') + '<div class="t-sub">' + D.modes.map(m => card('m-' + m.id, 'mode:' + m.id, mode === m.id, m.name, m.sub, m.chip, m.img)).join('') + '</div>';
    } else if (titleSub === 'career') {
      const c = cm(), R = C.cup.rounds, cupDone = c.cup.round >= R.length;
      const chips = {
        cup: cupDone ? 'WORLD CHAMPION' : R[c.cup.round].name.toUpperCase() + ' · RACE ' + Math.min(R[c.cup.round].races.length, c.cup.res.length + 1) + ' OF ' + R[c.cup.round].races.length,
        chase: 'MISSION ' + (nextMission() + 1) + ' OF ' + C.chase.missions.length + ' · ' + sum(c.chase.stars) + ' ★',
        trial: C.trial.tracks.filter(id => c.trial.medals[id] && c.trial.medals[id] !== 'none').length + ' OF ' + C.trial.tracks.length + ' MEDALS',
        rally: c.rally.res.length >= C.rally.stages.length ? 'RALLY DONE · ' + ord(rallyTable(c.rally.res).findIndex(x => x.me) + 1).toUpperCase() : 'STAGE ' + (c.rally.res.length + 1) + ' OF ' + C.rally.stages.length,
      };
      h += subHead('Career', cp + ' % done · four ways to play') + '<div class="t-sub four">' + ['cup', 'chase', 'trial', 'rally'].map(k => card('cm-' + k, 'cm:' + k, false, C[k].name, C[k].sub, chips[k], C[k].img)).join('') + '</div>';
    } else {
      h += '<button class="tile t-single" data-act="single"><span class="tx"><b>' + M.single.title + '</b><small>' + esc(M.single.sub.replace('{track}', d.track.name).replace('{weather}', d.weather.toLowerCase())) + '</small>' + singleChip + '</span>' +
        '<span class="im"><img src="' + trackImg(d.track, d.weather === 'Rain') + '" alt=""></span></button>';
      h += '<button class="tile t-multi" data-act="go:multi"><span class="tx"><b>' + M.multi.title + '</b><small>' + esc(M.multi.sub) + '</small>' + (owned() ? '' : '<em class="chip">3 TRACKS IN FREE</em>') + '</span>' +
        '<span class="im"><img src="' + M.multi.img + '" alt=""></span></button>';
      h += '<button class="tile t-career" data-act="career"><span class="tx"><b>' + M.career.title + '</b><small>' + nb(cp + ' %') + ' · ' + nb('World Cup, chases, time trials, rally') + '</small><i class="pbar"><b style="width:' + cp + '%"></b></i></span>' +
        '<span class="im">' + I.bigcup + '<img src="' + M.career.img + '" alt=""></span></button>';
      h += '<div class="t-row"><button class="tsmall" data-act="go:settings">' + I.cog + '<span>' + esc(M.settings) + '</span></button><button class="tsmall" data-act="go:board">' + I.podium + '<span>' + esc(M.board) + '</span></button></div>';
      if (!owned()) h += '<button class="mbtn gold buy" data-act="offer"><span>' + esc(M.buy) + ' · ' + esc(D.game.price) + '</span><small>' + esc(M.buySub) + '</small></button>';
      else h += '<div class="owned">' + I.check + '<span>' + esc(M.owned) + '</span></div>';
    }
    h += '</div></section>';
    return h;
  }

  /* ---------------- the maps of the tracks (routes.js), in two versions to choose from ----------------
     1 a flyover video: the route drawn in the game's world behind the point running along it (green on the flat, red where it climbs
       steeply), the names over it, in the corner the place the point has reached and its height; 2 a map from above to the stage's edges,
       nothing over the route but its flags. (The drone's shots of the track are the intro before the race: startRace) */
  const RT = window.ROUTES || {};
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
  const hudBox = () => '<div class="hud" aria-hidden="true"><b></b><small></small></div>';
  function flyView(t, lockd) {
    return '<div class="dio fly' + (lockd ? ' lock' : '') + '" data-route="' + t.id + '"><video muted loop playsinline autoplay preload="auto" poster="assets/maps/fly-' + t.id + '.webp" src="assets/maps/fly-' + t.id + '.webm"></video><div class="flab" aria-hidden="true"></div>' + hudBox() + '</div>';
  }
  function topView(t, R, M, lockd) {   // the whole map to the stage's edges (fitMaps: the route as big as fits)
    const T = R.top, pts = T.route, rally = t.group === 'rally';
    return '<div class="dio topmap' + (rally ? ' rally' : '') + (lockd ? ' lock' : '') + '" data-map="' + t.id + '"><svg class="mapsvg" viewBox="0 0 ' + T.W + ' ' + T.H + '" preserveAspectRatio="xMidYMid slice" aria-label="Map of ' + esc(t.name) + '">' +
      '<image href="assets/maps/top-' + t.id + '.webp" width="' + T.W + '" height="' + T.H + '"/><image class="wet" href="assets/maps/top-' + t.id + '-rain.webp" width="' + T.W + '" height="' + T.H + '"/>' +
      routeLines(t.id, pts, rally) + (t.group !== 'road' ? splitMarks(pts) : '') + marks(R, M, pts, rally) + '</svg></div>';
  }
  function routeView(t, lockd) {
    const R = RT[t.id], M = D.routeMaps[t.id] || {};
    // the version chosen; where a track has no flyover (yet), its map
    const v = mapV === 1 && R.fly ? 1 : 2;
    let h = '<div class="sky" aria-hidden="true"><i class="sun"></i><i class="cloud"></i></div>';
    h += v === 1 ? flyView(t, lockd) : topView(t, R, M, lockd);
    const V = D.mapVersions.find(x => x.n === mapV) || D.mapVersions[0];
    h += '<div class="mapv" role="group" aria-label="Map version (mockup)"><span>MAP</span>' + D.mapVersions.map(x => '<button aria-pressed="' + (mapV === x.n) + '" data-act="mapv:' + x.n + '" title="' + esc(x.name) + '">' + x.n + '</button>').join('') + '<em>' + esc(V.name) + '</em></div>';
    return h;
  }
  const stageView = (t, lockd) => isRoute(t) ? routeView(t, lockd) : dio(t, lockd);
  // the map from above: the route as big as fits between the switch at the top and the arrows at the bottom (not blurred), the map to every
  // edge of the stage (as big as the flyover); the route's line, flags and point the same size on the screen however far the map is zoomed
  function fitMaps() {
    for (const box of app.querySelectorAll('.topmap[data-map]')) {
      const T = RT[box.dataset.map].top, svg = $('svg', box), W = box.clientWidth, H = box.clientHeight, oh = 40;
      if (!W || !H) continue;
      if (!T.bb) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of T.route) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } T.bb = [x0, y0, x1, y1]; }
      const [x0, y0, x1, y1] = T.bb, top = 44, free = Math.max(40, H - oh - top);   // (room at the top for the switch and the ribbon, at the bottom for the arrows)
      const cover = Math.max(W / T.W, H / T.H), fit = Math.min((W - 32) / (x1 - x0), (free - 40) / (y1 - y0));
      const s = Math.max(cover, Math.min(fit, 0.72)), k = 0.5 / s;
      const vw = W / s, vh = H / s, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 - 20 / s;
      const vx = Math.min(Math.max(0, cx - vw / 2), Math.max(0, T.W - vw)), vy = Math.min(Math.max(0, cy - (top + free / 2) / s), Math.max(0, T.H - vh));
      svg.setAttribute('viewBox', vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1));
      svg.style.setProperty('--k', k.toFixed(3));
      for (const g of svg.querySelectorAll('.mk, .sp')) { if (!g.dataset.at) g.dataset.at = g.getAttribute('transform'); g.setAttribute('transform', g.dataset.at + ' scale(' + k.toFixed(3) + ')'); }
      for (const g of svg.querySelectorAll('.dz')) g.setAttribute('transform', 'scale(' + k.toFixed(3) + ')');
    }
  }
  window.addEventListener('resize', fitMaps);
  // the flyover: the names over it (each of its frames says where the start, the finish and the places are), the place reached and its height
  // in the corner, a short dip at the loop
  let flyRaf = 0;
  function flyLabels() {
    cancelAnimationFrame(flyRaf); flyRaf = 0;
    const box = $('#track-stage .dio.fly', app); if (!box) return;
    const id = box.dataset.route, R = RT[id], F = R.fly, M = D.routeMaps[id] || {}, v = $('video', box), lab = $('.flab', box), L = R.len, H0 = hudOf(R, M);
    const hud = $('.hud', box), hb = $('b', hud), hs = $('small', hud);
    const alt = M.alt ? M.alt.map(a => num(a) + ' m') : ['', ''];
    const tag = (cls, name, sub, icon) => '<div class="fl-' + cls + '">' + (icon || '') + '<b>' + esc(name) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
    const loop = !R.open, sub0 = alt[0] || (M.stage ? M.stage + ' start' : ''), sub1 = alt[1] || '';
    lab.innerHTML = tag('s start', loop ? 'Start · finish' : M.start || 'Start', sub0, flagSvg(false).replace('<g', '<svg viewBox="-2 -28 20 30" width="18" height="26"><g') + '</svg>') + tag('s finish', loop ? 'Finish' : M.finish || 'Finish', sub1, '<svg viewBox="-2 -28 20 30" width="18" height="26">' + flagSvg(true) + '</svg>') +
      F.places.map(n => tag('q', n, '')).join('');
    const els = [...lab.children], pd = F.places.map(n => { const q = R.places.find(x => x[0] === n || x[0].indexOf(n) >= 0); return q ? q[1] : (n === 'Split 1' ? L / 3 : n === 'Split 2' ? 2 * L / 3 : -1e9); });
    let last = 0, looped = false, pl = null, al = null;
    const step = () => {
      if (!document.contains(v)) return;
      // a short dip at the loop: the end fades out, the start fades back in (not the very first start: the poster shows there)
      const t = v.currentTime || 0, dur = v.duration; if (t < last - 1) looped = true; last = t;
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
  const modeWhat = (t) => mode === 'race' && !t.trial ? laps(lapsSel || t.laps).toUpperCase() : modeOf(mode).name.toUpperCase();
  const goldTime = (t) => secs(t.rec[1]) + 1.2 * Math.max(1, t.km / 3);

  /* ---------------- single race, step 2: the tracks of the mode (today's race first in its own mode) ---------------- */
  function vTrack() {
    const list = TRACKS(), isDaily = list[trackIdx] == null, M = modeOf(mode), lockDot = (i) => !!list[i] && trackLocked(list[i]);
    let h = '<section class="scr" id="s-track" aria-label="Single race">' + topbar('Single race', true, [2, 2, M.name]);
    h += '<div class="groups" role="tablist" aria-label="Track group">' + D.groups.map(g => { const n = groupList(g.id).length; return '<button role="tab" aria-selected="' + (group === g.id) + '" data-act="group:' + g.id + '"' + (n ? '' : ' disabled') + '>' + esc(g.name) + '<i>' + n + '</i></button>'; }).join('') + '</div>';
    if (isDaily) {
      const d = daily(), t = d.track;
      h += '<div class="stage' + (isRoute(t) ? ' route' : '') + '" id="track-stage">' + stageView(t) + '<div class="ribbon' + (isRoute(t) ? ' side' : '') + '">TODAY\'S RACE</div>' +
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
    h += '<div class="stage' + (isRoute(t) ? ' route' : '') + '" id="track-stage">' + stageView(t, lockd) + '<div class="ribbon rmode r-' + mode + (isRoute(t) ? ' side' : '') + '">' + esc(M.name.toUpperCase()) + '</div>' +
      '<button class="arrow l" data-act="track:-1" aria-label="Previous track">' + I.left + '</button><button class="arrow r" data-act="track:1" aria-label="Next track">' + I.right + '</button>' + dots(list.length, trackIdx, lockDot, list[0] == null) + '</div>';
    h += '<div class="card">' + badge + '<h1>' + esc(t.name) + '<span class="tag ghost">' + esc(t.tag) + '</span></h1><p class="desc">' + esc(t.desc) + '</p>';
    const rec = [I.trophy(my ? 'gold' : ''), my ? 'Your record' : t.rec[0], my || t.rec[1], my ? 'gold' : ''], len = [I.flag, 'Length', t.km.toFixed(2) + ' km'];
    if (chase) h += info([[I.siren, 'Police', D.chase.police + ' cars'], [I.watch, 'Get away in', D.chase.limit], len]);
    else if (mode === 'trial') h += info([rec, [I.medal, 'Gold time', clock(goldTime(t))], len]);
    else if (t.group === 'road' && D.routeMaps[t.id] && D.routeMaps[t.id].alt) { const A = D.routeMaps[t.id].alt; h += info([rec, len, [I.corners, 'Climb', '+' + num(A[1] - A[0]) + ' m']]); }
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
  /* ---------------- the career's four ways (opened from the Career choices in the main menu) ---------------- */
  const soloFoot = (goHtml) => '<div class="foot solo">' + goHtml + '</div>';   // (back is at the top)
  const cmGo = (t, label) => trackLocked(t) ? '<button class="go gold" data-act="offer">Unlock · ' + esc(D.game.price) + '</button>' : '<button class="go" data-act="cm-race">' + esc(label) + '</button>';
  const raceRow = (k, t, cls, line, right, act) => '<button class="race' + (cls ? ' ' + cls : '') + '"' + (act ? ' data-act="' + act + '"' : ' tabindex="-1"') + '><span class="n">' + k + '</span><span class="mm">' + minimap(t.id) + '</span><span><b>' + esc(t.name) +
    (trackLocked(t) ? ' <i class="lk">' + I.lock('#ffc629') + '</i>' : '') + '</b><small>' + line + '</small></span><span class="rt">' + right + '</span></button>';
  function vCup() {   // the World Cup: the rounds, the races of this one, its standings
    const c = cm().cup, R = C.cup.rounds, done = c.round >= R.length, ri = Math.min(c.round, R.length - 1), rd = R[ri], res = done ? [] : c.res, pts = (q) => C.cup.points[q - 1] || 0;
    let h = '<section class="scr" id="s-cup" aria-label="World Cup">' + topbar('World Cup', true) + '<div class="scroll">';
    h += '<div class="overall cmh">' + I.bigcup + '<h3>' + (done ? 'WORLD CHAMPION' : esc(rd.name.toUpperCase())) + '<span>' + (done ? 'all three rounds won through' : rd.races.length + ' circuits · the points add up · top ' + C.cup.through + ' go through') + '</span></h3>' +
      '<div class="bar"><b style="width:' + Math.round(cmProgress().cup * 100) + '%"></b></div><p class="rw">' + (done ? 'Trophy won' : 'Round win: ' + esc(rd.reward)) + '</p></div>';
    h += '<div class="rtabs">' + R.map((r, i) => '<span class="' + (i < c.round ? 'ok' : i === c.round ? 'on' : '') + '">' + esc(r.name) + (i < c.round ? ' · ' + ord(c.rounds[i] || 1) : i > c.round ? ' ' + I.lock('#8b98ad') : '') + '</span>').join('') + '</div>';
    if (!done) {
      h += rd.races.map((id, k) => { const t = trackById(id), q = res[k];
        return raceRow(k + 1, t, k === res.length ? 'nx' : '', q ? ord(q) + ' · +' + pts(q) + ' pts' : k === res.length ? 'Next race · ' + laps(t.laps) : laps(t.laps), q ? '<em class="pt">' + pts(q) + '</em>' : ''); }).join('');
      const T = cupTable(c.round, res), me = T.findIndex(x => x.me), top = T.slice(0, 6), rows = me >= 6 ? top.concat([T[me]]) : top;
      h += '<div class="table"><div class="th"><span>' + (res.length ? 'Standings after ' + res.length + ' of ' + rd.races.length : 'Standings') + '</span><span>PTS</span></div>' + rows.map(x => { const i = T.indexOf(x);
        return '<div class="tr' + (x.me ? ' me' : '') + (i < C.cup.through ? ' thru' : '') + '"><span class="ps">' + (i + 1) + '</span><span class="nm">' + esc(x.me ? S().player : x.name) + '</span><b>' + x.pts + '</b></div>'; }).join('') + '</div>';
    }
    h += '</div>';
    return h + soloFoot(done ? '<button class="go off" tabindex="-1">World Cup won</button>' : cmGo(trackById(rd.races[res.length]), 'Race ' + trackById(rd.races[res.length]).name)) + '</section>';
  }
  const FOE = { police: 'the police', robber: 'the robber', mafia: 'the mafia', smugglers: 'the smugglers', army: 'the army', thief: 'the car thief', all: 'everyone' };
  function vCChase() {   // the chase missions one after another: get away from them, or (in the police car) catch them
    const st = cm().chase.stars, nx = nextMission(), M = C.chase.missions[nx], t = trackById(M.track);
    let h = '<section class="scr" id="s-cchase" aria-label="Police chase">' + topbar('Police chase', true) + '<div class="scroll">';
    h += '<div class="brief ' + M.role + '"><span class="role">' + (M.role === 'run' ? 'ESCAPE' : 'CATCH') + '</span><small>Mission ' + (nx + 1) + ' of ' + C.chase.missions.length + ' · ' + esc(t.name) + '</small><b>' + esc(M.title) + '</b><p>' + esc(M.brief) + '</p>' +
      '<p class="rw">' + (M.role === 'run' ? 'Get away from ' + FOE[M.foe] + ' in ' + D.chase.limit + '. Escape to open the next mission.' : 'Catch ' + FOE[M.foe] + ' before ' + D.chase.limit + '.') + '</p></div>';
    h += C.chase.missions.map((m, k) => { const tk = trackById(m.track), open = missionOpen(k);
      return raceRow(k + 1, tk, (k === nx ? 'nx' : '') + (open ? '' : ' off'), '<i class="rp ' + m.role + '">' + (m.role === 'run' ? 'ESCAPE' : 'CATCH') + '</i>' + esc(m.title), open ? '<span class="stars">' + [1, 2, 3].map(q => '<i class="' + ((st[k] || 0) >= q ? 'on' : '') + '">★</i>').join('') + '</span>' : I.lock('#8b98ad')); }).join('');
    h += '</div>';
    return h + soloFoot(cmGo(t, 'Start mission')) + '</section>';
  }
  function vCTrial() {   // a medal on every track; bronze opens the next one
    const md = cm().trial.medals, nx = nextTrial(), cnt = (m) => C.trial.tracks.filter(id => md[id] === m).length;
    let h = '<section class="scr" id="s-ctrial" aria-label="Time trial">' + topbar('Time trial', true) + '<div class="scroll">';
    h += '<div class="overall cmh">' + I.medal + '<h3>TIME TRIAL<span>take your time, then make it count</span></h3><div class="bar"><b style="width:' + Math.round(cmProgress().trial * 100) + '%"></b></div>' +
      '<div class="tro-sum"><span class="g">● ' + cnt('gold') + ' gold</span><span class="s">● ' + cnt('silver') + ' silver</span><span class="b">● ' + cnt('bronze') + ' bronze</span></div></div>';
    h += C.trial.tracks.map((id, k) => { const t = trackById(id), m = md[id], open = trialOpen(k);
      return raceRow(k + 1, t, (k === nx ? 'nx' : '') + (open ? '' : ' off'), 'Gold ' + clock(goldTime(t)) + ' · silver ' + clock(goldTime(t) + 2 * Math.max(1, t.km / 3)), open ? (m && m !== 'none' ? '<i class="md ' + m + '">' + m.toUpperCase() + '</i>' : '') : I.lock('#8b98ad')); }).join('');
    h += '</div>';
    const t = trackById(C.trial.tracks[nx]);
    return h + soloFoot(cmGo(t, 'Run ' + t.name)) + '</section>';
  }
  function vCRally() {   // stage after stage; the stage times add up against the other crews'
    const res = cm().rally.res, n = C.rally.stages.length, done = res.length >= n, T = rallyTable(res), me = T.findIndex(x => x.me);
    let h = '<section class="scr" id="s-crally" aria-label="' + esc(C.rally.name) + '">' + topbar('Rally', true) + '<div class="scroll">';
    h += '<div class="overall cmh">' + I.bigcup + '<h3>' + (done ? 'RALLY DONE · ' + ord(me + 1).toUpperCase() : 'STAGE ' + (res.length + 1) + ' OF ' + n) + '<span>' + esc(C.rally.name.toLowerCase()) + ' · the stage times add up</span></h3><div class="bar"><b style="width:' + Math.round(cmProgress().rally * 100) + '%"></b></div></div>';
    h += C.rally.stages.map((sg, k) => { const t = trackById(sg.track), q = res[k];
      return raceRow(k + 1, t, k === res.length ? 'nx' : '', esc(sg.name) + (q ? ' · ' + mmss(stageTime(k, q)) + ' · ' + ord(q) + ' on the stage' : k === res.length ? ' · next' : ''), q ? '<em class="pt">' + ord(q) + '</em>' : ''); }).join('');
    if (res.length) {
      const lead = T[0].t;
      h += '<div class="table"><div class="th"><span>Overall after ' + res.length + ' of ' + n + '</span><span>TIME</span></div>' + T.map((x, i) => '<div class="tr' + (x.me ? ' me' : '') + '"><span class="ps">' + (i + 1) + '</span><span class="nm">' + esc(x.me ? S().player : x.name) + '</span><b>' + (i ? '+' + (x.t - lead).toFixed(1) + ' s' : mmss(x.t)) + '</b></div>').join('') + '</div>';
    }
    h += '</div>';
    return h + soloFoot(done ? '<button class="go off" tabindex="-1">Rally done</button>' : cmGo(trackById(C.rally.stages[res.length].track), 'Start ' + C.rally.stages[res.length].name)) + '</section>';
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
    const mode = R.kind === 'single' ? modeOf(R.mode).name : R.kind === 'career' ? 'Career · ' + R.label : R.kind === 'daily' ? 'Today\'s race' : R.kind === 'multi' ? 'Multiplayer · vs ' + r.rival : 'Single race';
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
      if (R.cm === 'cup') {
        body += row(I.trophy('gold'), 'World Cup points', '+' + r.pts);
        body += row(I.podium, r.roundDone ? r.round + ' standings' : 'Standings after ' + r.raced + ' of ' + r.races, ord(r.pos) + ' of 13');
        if (r.through) body += '<div class="unlock gold">' + I.bigcup + '<span><b>Through to ' + esc(r.through) + '!</b> ' + esc(r.round) + ' prize: ' + esc(r.prize) + '</span></div>';
        else if (r.roundDone && !r.out) body += '<div class="unlock gold">' + I.bigcup + '<span><b>World Cup won!</b> ' + esc(r.prize) + '</span></div>';
        if (r.out) body += '<div class="unlock">' + I.check + '<span><b>Not in the top ' + C.cup.through + '.</b> ' + esc(r.round) + ' starts again.</span></div>';
      } else if (R.cm === 'trial' && r.unlocked) body += '<div class="unlock">' + I.check + '<span><b>' + esc(r.unlocked) + '</b> is open now</span></div>';
      else if (R.cm === 'rally') {
        body += row(I.watch, 'Stage time · ' + ord(r.place) + ' on the stage', esc(mmss(r.stage)));
        body += row(I.podium, r.done ? 'Final standing' : 'Overall so far', ord(r.pos) + ' of ' + (C.rally.rivals.length + 1), r.pos > 1 ? '<em class="chip">+' + r.gap.toFixed(1) + ' s</em>' : '');
        if (r.done) body += '<div class="unlock gold">' + I.bigcup + '<span><b>Rally done!</b> ' + ord(r.pos) + ' overall</span></div>';
      }
      body += '<div class="rbar"><div><span>Career</span><b>' + r.career[0] + ' % → ' + r.career[1] + ' %</b></div><div class="bar"><b style="width:' + r.career[1] + '%"></b></div></div>';
    }
    if (R.kind === 'daily' && !owned()) body += '<button class="gbanner" data-act="offer"><div>Your free run for today is used<small>Come back tomorrow, or race today\'s race as often as you like in the full game</small></div><span class="p">' + esc(D.game.price) + '</span></button>';
    h += body + '</div>';
    const again = R.kind === 'single' || (R.kind === 'career' && R.cm === 'trial') ? '<button class="back wide" data-act="again">' + (R.cm === 'trial' ? 'Run again' : 'Race again') + '</button>' : '<span></span>';
    h += '<div class="foot">' + again + '<button class="go" data-act="res-continue">Continue</button></div>';
    return h + '</section>';
  }

  function vChaseResults() {
    const r = result, R = r.R, t = R.track, cls = ['busted', 'bronze', 'silver', 'gold'][r.stars];
    const catching = R.role === 'catch', word = catching ? (r.escaped ? 'CAUGHT' : 'GOT AWAY') : (r.escaped ? 'ESCAPED' : 'BUSTED');
    let h = '<section class="scr" id="s-results" aria-label="Results"><div class="res-head word ' + cls + '"><div class="pos">' + word + '</div><div class="rt"><b>' + esc(fullName(t)) + '</b><small>' + esc(R.cm === 'chase' ? R.label : 'Police chase') + (r.escaped ? ' · ' + '★'.repeat(r.stars) : '') + '</small></div></div><div class="scroll">';
    const row = (ic, label, val, extra) => '<div class="rrow">' + ic + '<span>' + esc(label) + '</span><b>' + val + '</b>' + (extra || '') + '</div>';
    const foe = R.cm === 'chase' ? FOE[R.foe] : 'the police', Foe = foe.charAt(0).toUpperCase() + foe.slice(1);
    h += row(I.siren, catching ? (r.escaped ? 'You caught ' + foe + ' in' : Foe + ' got away after') : (r.escaped ? 'You got away in' : Foe + ' caught you after'), esc(mmss(r.time)), r.pb && r.escaped ? '<em class="chip gold">NEW BEST</em>' : '');
    h += row(I.watch, catching ? 'Time to catch them' : 'Time to get away', esc(D.chase.limit) + (R.cm === 'chase' ? '' : ' · ' + D.chase.police + ' police cars'));
    h += row(I.coin.replace('<svg', '<svg width="22" height="22"'), 'Reward', '+' + num(r.reward) + ' CR');
    if (r.unlocked) h += '<div class="unlock">' + I.check + '<span><b>Next mission:</b> ' + esc(r.unlocked) + '</span></div>';
    h += '</div><div class="foot"><button class="back wide" data-act="again">' + (R.cm === 'chase' ? 'Try again' : 'Race again') + '</button><button class="go" data-act="res-continue">Continue</button></div>';
    return h + '</section>';
  }

  const VIEWS = { title: vTitle, track: vTrack, car: vCar, cup: vCup, cchase: vCChase, ctrial: vCTrial, crally: vCRally, multi: vMulti, board: vBoard, settings: vSettings, results: vResults };
  function render(keepScroll) {
    const sc = $('.scroll', app), top = keepScroll && sc ? sc.scrollTop : 0;
    if (screen === 'results' && !result) screen = 'title';
    app.innerHTML = VIEWS[screen]();
    if (keepScroll && shown === screen) $('.scr', app).classList.add('still');   // an update in place (a choice, a sheet): no slide-in again
    if (keepScroll) { const n = $('.scroll', app); if (n) n.scrollTop = top; }
    if (screen === 'title') {
      $('#bg-slot', app).replaceWith(bg.el); bg.setOn(true);
      const pn = $('.title-panel', app); if (!titleSub) panelH = pn.offsetHeight; else if (panelH) pn.style.minHeight = panelH + 'px';   // (Single race and Career open in the same frame, as tall)
    } else bg.setOn(false);
    if (screen === 'car' && ensureCar3D()) {
      const stage = $('#car-stage', app); stage.insertBefore(carHost, stage.firstChild);
      const c = D.cars[carIdx]; Car3D.show(c.model, colorIdx, { dark: !!c.soon }); Car3D.setVisible(true);
    } else if (car3dReady) Car3D.setVisible(false);
    if (screen === 'track') wx.attach($('#track-stage', app), wxMode(), shown !== 'track'); else wx.detach();
    if (screen === 'track' && shown !== 'track' && window.Journey) Journey.preload(P.lastTrack ? [P.lastTrack] : []);   // (the globe before a race: the Earth, and where it starts)
    flyLabels(); fitMaps();
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

  /* ---------------- a race: the intro (the drone's shots of the track, the commentator), the start lights, then "where did you finish?"
     (mockup), then the results ---------------- */
  let race = null, ixRaf = 0;
  const wxLabel = (w, wet) => (w === 'Random' ? 'random weather: ' : '') + (wet ? 'rain' : 'dry');
  // the commentator's voice: the phone's own English voice (off with the Sound or the Commentary setting); the words are always on the screen
  const speaks = () => 'speechSynthesis' in window && settings[0] === 0 && settings[1] === 0;
  function say(text) {
    if (!text || !speaks()) return;
    try {
      const vs = speechSynthesis.getVoices(), v = vs.find(x => /^en[-_]GB/i.test(x.lang)) || vs.find(x => /^en/i.test(x.lang));
      const u = new SpeechSynthesisUtterance(text); u.lang = v ? v.lang : 'en-GB'; if (v) u.voice = v; u.rate = 1.04;
      speechSynthesis.speak(u);
    } catch (_) { /* no voice here: the words on the screen only */ }
  }
  const hush = () => { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (_) { /* nothing to stop */ } };
  if ('speechSynthesis' in window) try { speechSynthesis.getVoices(); } catch (_) { /* (the voices load in the background) */ }
  function startRace(R) {
    race = R; hush(); cancelAnimationFrame(ixRaf);
    if (speaks()) try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (_) { /* (a silent word in the tap itself: some phones only let a page speak after that) */ }
    const t = R.track, Rt = RT[t.id], Dr = Rt && Rt.drone, M = D.routeMaps[t.id] || {}, lines = (D.intro && D.intro[t.id]) || [];
    const under = $('#track-stage .dio.fly video', app); if (under) under.pause(); cancelAnimationFrame(flyRaf); wx.detach();   // (the map under the intro stops)
    const el = document.createElement('div'); el.className = 'intro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Before the race');
    app.appendChild(el);
    if (!Dr) { lights(el); return; }
    // first the journey on the 3D globe: from where the last race ended (or from space) to this track, down to the drone's first view;
    // then the drone's shots, one after another, on each its place and height in the corner and the commentator's line about it.
    // (Not when this track was the last one too, nor without WebGL, nor for someone who asked for less motion.)
    const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const globe = !calm && P.lastTrack !== t.id && window.Journey && window.GEO && GEO.tracks[t.id] && Journey.supported();
    el.innerHTML = '<div class="ix-bg" style="background-image:url(assets/maps/drone-' + t.id + '.webp)" aria-hidden="true"></div>' +
      '<div class="ix-top"><span class="ix-live"><i></i>LIVE</span><button class="ix-skip" data-ix="skip">Skip intro' + I.chev + '</button></div>' +
      '<div class="ix-head"><h2>' + esc(fullName(t)) + '</h2><small>' + esc(R.label) + '</small></div>' +
      '<div class="ix-v' + (globe ? ' jon' : '') + '"><div class="dio fly"><video muted playsinline' + (globe ? '' : ' autoplay') + ' preload="auto" poster="assets/maps/drone-' + t.id + '.webp" src="assets/maps/drone-' + t.id + '.webm"></video>' + hudBox() + '</div></div>' +
      '<div class="ix-sub" aria-live="polite"><span class="ix-who">' + I.mic + 'COMMENTATOR' + (speaks() ? '' : ' · VOICE OFF') + '</span><p></p></div>' +
      '<div class="ix-bar" aria-hidden="true"><b></b></div>';
    const v = $('video', el), box = $('.ix-v', el), hud = $('.hud', el), hb = $('b', hud), hs = $('small', hud), sub = $('.ix-sub', el), sp = $('p', sub), bar = $('.ix-bar b', el);
    const setHud = (name, sm) => {   // (a new place comes in; the same place with a new number, as the distance left on the globe, just changes it)
      if (hb.textContent === name) { if (hs.textContent !== sm) hs.textContent = sm; return; }
      hb.textContent = name; hs.textContent = sm; hud.classList.remove('in'); void hud.offsetWidth; hud.classList.add('in');
    };
    const line = (txt, spoken) => { sp.textContent = txt; sub.classList.remove('in'); void sub.offsetWidth; sub.classList.add('in'); say(spoken || txt); };
    let shot = -1, done = false, J = null, jOff = 0, shots = false;
    const vDur = () => isFinite(v.duration) && v.duration > 0 ? v.duration : Dr.dur;
    const end = (skip) => {   // (at the end of the shots the commentator finishes the line, 2.4 s at most; a skip cuts it off)
      if (done) return; done = true; cancelAnimationFrame(ixRaf); v.pause(); if (J) J.skip();
      let n = 0; const next = () => { if (!document.contains(el)) return; if (!skip && n++ < 12 && speaks() && speechSynthesis.speaking) { setTimeout(next, 200); return; } hush(); wx.detach(); lights(el); };
      next();
    };
    const step = () => {
      if (done || !document.contains(el)) return;
      if (!shots) { if (J) bar.style.width = Math.min(100, J.elapsed / (jOff + vDur()) * 100).toFixed(1) + '%'; ixRaf = requestAnimationFrame(step); return; }   // (the globe's own part of the bar)
      const tm = v.currentTime || 0, dur = vDur();
      let k = 0; Dr.shots.forEach((q, i) => { if (q[0] + 0.3 <= tm || i === 0) k = i; });
      if (k !== shot) {
        shot = k; const q = Dr.shots[k], ln = lines[k], txt = Array.isArray(ln) ? ln[0] : ln, a = altAt(Rt, M, q[2]);
        setHud(q[1], a != null ? num(Math.round(a)) + ' m' : '');
        if (txt) line(txt, Array.isArray(ln) ? ln[1] : ln);
      }
      bar.style.width = Math.min(100, (jOff + tm) / (jOff + dur) * 100).toFixed(1) + '%';
      ixRaf = requestAnimationFrame(step);
    };
    const startShots = () => {   // the drone's video from its first frame (the globe hands over to it), the rain on it on a wet day
      if (done || shots) return; shots = true; box.classList.remove('jon');
      if (R.wet) wx.attach(box, 'rain', true);
      try { v.currentTime = 0; } catch (_) { /* not loaded yet: it starts at 0 anyway */ }
      const pr = v.play(); if (pr && pr.catch) pr.catch(() => {});
    };
    v.addEventListener('ended', () => end(false)); v.addEventListener('error', () => end(true));
    el.addEventListener('click', (e) => { if (e.target.closest('[data-ix="skip"]')) end(true); });
    if (globe) {
      const from = P.lastTrack && GEO.tracks[P.lastTrack] ? P.lastTrack : null, title = (id) => { const x = id && trackById(id); return x ? x.name : undefined; };
      const a0 = altAt(Rt, M, Dr.shots[0][2]);
      J = Journey.play(box, { from, to: t.id, arrive: Dr.arrive, video: v, fromTitle: title(from), toTitle: t.name, endHud: [Dr.shots[0][1], a0 != null ? num(Math.round(a0)) + ' m' : ''],
        onHud: setHud, onLine: (txt) => line(txt), onHandover: startShots });
      jOff = Math.max(0, J.total - 1.15);   // (the video starts at the hand-over)
      J.done.then((why) => { if (why === 'nogl') startShots(); });
    } else startShots();
    ixRaf = requestAnimationFrame(step);
    $('.ix-skip', el).focus({ preventScroll: true });
  }
  // the start: five red lights one by one, then all out and away (in the mockup: then where you finished)
  function lights(el) {
    const R = race;
    el.className = 'intro ix-start';
    el.innerHTML = '<p class="ready">' + esc(fullName(R.track)) + '<small>' + (R.chase ? (R.role === 'catch' ? 'CATCH THEM' : 'GET AWAY') : R.trial ? 'AGAINST THE CLOCK' : 'GET READY') + '</small></p><div class="lights" aria-hidden="true">' + '<i></i>'.repeat(5) + '</div><p class="gotx" aria-live="polite">GO!</p>';
    const L = [...el.querySelectorAll('.lights i')], at = (ms, f) => setTimeout(() => { if (document.contains(el)) f(); }, ms);
    L.forEach((x, i) => at(350 + i * 380, () => x.classList.add('on')));
    at(2550, () => { L.forEach(x => x.classList.remove('on')); $('.gotx', el).classList.add('on'); });
    at(3250, () => pick(el));
  }
  function pick(el) {
    const R = race, catching = R.role === 'catch', run = catching ? 'Caught' : 'Escaped';
    const opts = R.kind === 'multi' ? [['1', '1st', 'p1'], ['2', '2nd', '']] : R.chase ? [['3', run + ' ★★★', 'p1'], ['2', run + ' ★★', 'p2'], ['1', run + ' ★', 'p3'], ['0', catching ? 'Got away' : 'Busted', 'busted']] :
      R.trial ? [['gold', 'Gold time', 'p1'], ['silver', 'Silver time', 'p2'], ['bronze', 'Bronze time', 'p3'], ['none', 'No medal', '']] :
      Array.from({ length: R.cm === 'rally' ? C.rally.rivals.length + 1 : 13 }, (_, i) => [String(i + 1), ord(i + 1), i === 0 ? 'p1' : i === 1 ? 'p2' : i === 2 ? 'p3' : '']);
    el.className = 'loading';
    el.innerHTML = '<div class="pick"><small>MOCKUP · THE RACE IS NOT DRIVEN HERE</small><h2>' + (R.chase ? 'How did the chase end?' : R.trial ? 'What time did you set?' : R.cm === 'rally' ? 'Where were you on the stage?' : 'Where did you finish?') + '</h2><p>Pick a result to see how the menu goes on.</p><div class="places' + (opts.length < 5 ? ' few' : opts.length === 6 ? ' six' : '') + '">' +
      opts.map(o => '<button class="' + o[2] + '" data-finish="' + o[0] + '">' + esc(o[1]) + '</button>').join('') + '</div><button class="cancel" data-finish="cancel">Leave the race</button></div>';
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-finish]'); if (!b) return; el.remove(); if (b.dataset.finish !== 'cancel') finish(b.dataset.finish); else render(true); });
    const first = $('[data-finish]', el); if (first) first.focus();
  }
  function finish(res) {
    if (race.chase) {   // a police chase: stars for how fast you got away (a career mission in the police car: how fast you caught them), or not
      const R = race, t = R.track, stars = +res, career = R.cm === 'chase', prev = career ? (cm().chase.stars[R.idx] || 0) : (P.chase[t.id] || 0);
      const out = { R, res, stars, escaped: stars > 0, time: [112, 161, 108, 65][stars], reward: D.chase.reward[3 - stars], pb: stars > prev };
      if (career) { if (stars > prev) cm().chase.stars[R.idx] = stars; if (stars > 0 && !prev && R.idx + 1 < C.chase.missions.length) out.unlocked = C.chase.missions[R.idx + 1].title; }
      else if (stars > prev) P.chase[t.id] = stars;
      P.money += out.reward; P.lastTrack = t.id; saveP();
      result = out; history.push(screen); screen = 'results'; render(); return;
    }
    const R = race, t = R.track, trial = !!R.trial;
    const place = trial ? { gold: 1, silver: 2, bronze: 4, none: 8 }[res] : +res;
    const base = secs(t.rec[1]), time = trial ? base + { gold: 0.3, silver: 2.2, bronze: 4.6, none: 8.4 }[res] * Math.max(1, t.km / 3) : base + (place - 1) * 0.45 + 0.3 + t.km * 0.05;
    const out = { R, res, place, time, reward: 0 };
    if (R.kind !== 'multi') { const prev = P.myRecords[t.id] ? secs(P.myRecords[t.id]) : Infinity; if (time < prev) { P.myRecords[t.id] = clock(time); out.pb = true; } }
    const share = D.prizes[Math.min(D.prizes.length, place) - 1];
    if (R.kind === 'career') {
      const c = cm(), cBefore = careerPct();
      if (R.cm === 'cup') {   // the points of the place; after the round's last race: through to the next round (top 3), else the round again
        const rd = C.cup.rounds[R.round]; c.cup.res.push(place);
        Object.assign(out, { pts: C.cup.points[place - 1] || 0, pos: cupPos(R.round, c.cup.res), round: rd.name, raced: c.cup.res.length, races: rd.races.length });
        if (c.cup.res.length >= rd.races.length) {
          out.roundDone = true;
          if (out.pos <= C.cup.through) { c.cup.rounds[R.round] = out.pos; c.cup.round++; out.through = C.cup.rounds[c.cup.round] ? C.cup.rounds[c.cup.round].name : null; out.prize = rd.reward; } else out.out = true;
          c.cup.res = [];
        }
        out.reward = cupReward(place);
      } else if (R.cm === 'trial') {   // the best medal on the track; the first one opens the next track
        const old = c.trial.medals[t.id] || 'none'; if (MEDAL[res] > MEDAL[old]) c.trial.medals[t.id] = res;
        if (MEDAL[res] > 0 && !MEDAL[old] && R.idx + 1 < C.trial.tracks.length) out.unlocked = trackById(C.trial.tracks[R.idx + 1]).name;
        out.reward = [0, 1000, 2000, 4000][MEDAL[res]];
      } else if (R.cm === 'rally') {   // the stage time from the place on the stage; the overall standing so far
        c.rally.res[R.idx] = place; out.stage = stageTime(R.idx, place);
        const T = rallyTable(c.rally.res); out.pos = T.findIndex(x => x.me) + 1; out.total = T[out.pos - 1].t; out.gap = out.total - T[0].t; out.done = c.rally.res.length >= C.rally.stages.length;
        out.reward = Math.round(2500 * D.prizes[place - 1]);
      }
      out.career = [cBefore, careerPct()];
    } else if (R.kind === 'daily') {
      const d = daily(); P.daily = d.mine ? P.daily : { day: DAY, runs: 0 };
      P.daily.runs++;
      const players = d.players + (d.mine ? 0 : 1), rank = Math.max(1, Math.round(players * RANK[Math.min(13, place) - 1]));
      if (!P.daily.rank || rank < P.daily.rank) { P.daily.rank = rank; P.daily.place = place; P.daily.time = clock(time); }
      Object.assign(out, { rank, players, best: d.best, holder: d.holder });
      out.reward = Math.round(D.daily.reward * share);
    } else if (R.kind === 'multi') { out.rival = R.rival; out.reward = D.multiReward[place === 1 ? 0 : 1]; }
    else out.reward = Math.round(D.singleReward * share);
    P.money += out.reward; P.lastTrack = t.id; saveP();
    result = out; history.push(screen); screen = 'results'; render();
  }

  /* ---------------- input ---------------- */
  function act(a, el) {
    const [k, v, w] = a.split(':');
    switch (k) {
      case 'go': go(v); break;
      case 'back': back(); break;
      case 'single': titleSub = 'single'; render(true); break;   // (the modes open in the main menu's own frame)
      case 'career': titleSub = 'career'; render(true); break;
      case 'tsub': titleSub = v || null; render(true); break;
      case 'cm': go(v === 'cup' ? 'cup' : 'c' + v); break;
      case 'mode': mode = v; trackIdx = 0; lapsSel = null; if (!groupList(group).length) group = 'circuit'; go('track'); break;   // (a tap on a mode goes straight to its tracks)
      case 'group': group = v; trackIdx = 0; lapsSel = null; render(true); break;
      case 'mapv': mapV = +v; store.set('mapv', mapV); render(true); break;
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
      case 'cm-race': startRace(cmRace({ cup: 'cup', cchase: 'chase', ctrial: 'trial', crally: 'rally' }[screen])); break;   // the next race of the career screen shown
      case 'race-multi': { const rival = mpMode === 'quick' ? 'T. Hayashi' : D.friendName; startRace({ kind: 'multi', track: D.tracks[0], rival, label: 'Duel with ' + rival }); break; }
      case 'again': if (result) startRace(result.R); break;
      case 'res-continue': {   // back to where the race was started from
        const R = result.R; result = null;
        if (R.kind === 'career') { titleSub = 'career'; history = ['title']; screen = R.cm === 'cup' ? 'cup' : 'c' + R.cm; }
        else if (R.kind === 'multi') { history = ['title']; screen = 'multi'; }
        else { if (R.kind === 'daily') { mode = dailyMode(); group = R.track.group; trackIdx = 0; } else mode = R.mode; titleSub = 'single'; history = ['title']; screen = 'track'; }
        render(); break;
      }
      case 'offer': offer(); break;
      case 'close-sheet': sheet = null; render(true); break;
      case 'buy': {
        sheet = null;
        if (ST === 'free') { P.owned = true; ST = 'full'; store.set('state', ST); store.set('p-full', P); drawStates(); }
        render(true); toast('Mockup: bought. Everything is unlocked, your progress stays.'); break;
      }
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
    if ($('.loading, .intro', app)) return;
    if (e.key === 'Escape' && screen === 'title' && titleSub && !sheet) act('tsub:');
    else if (e.key === 'Escape' && (screen !== 'title' || sheet)) back();
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
      if (o.group) group = o.group; if (o.mapV) mapV = o.mapV; if (o.weather != null) weather = o.weather;
      if (o.daily) { mode = dailyMode(); group = daily().track.group; trackIdx = 0; }
      if (o.trackId) { const tt = D.tracks.find(x => x.id === o.trackId); if (tt) group = tt.group; const i = TRACKS().findIndex(t => t && t.id === o.trackId); if (i >= 0) trackIdx = i; }
      if (o.tab) tab = o.tab; if (o.lbTrack != null) lbTrack = o.lbTrack; if (o.mpMode) mpMode = o.mpMode;
      // the main menu's frame: as it is when coming back from the screen opened (Single race or Career), or as asked (o.sub)
      titleSub = o.sub !== undefined ? o.sub : scr === 'mode' || scr === 'track' ? 'single' : /^(cup|cchase|ctrial|crally)$/.test(scr) ? 'career' : null;
      if (scr === 'mode') scr = 'title';
      sheet = null; history = scr === 'title' ? [] : ['title']; screen = scr; render(); if (o.offer) offer(); if (o.weatherSheet) act('pick-weather');
    },
    finish(kind, res) {   // kind: daily | chase | multi | single, or a way of the career: cup | cchase | ctrial | crally
      const d = daily(), cmk = { cup: 'cup', cchase: 'chase', ctrial: 'trial', crally: 'rally' }[kind];
      race = cmk ? cmRace(cmk) : kind === 'daily' ? { kind, track: d.track, trial: !!d.track.trial, label: '' } : kind === 'chase' ? { kind: 'single', mode: 'chase', chase: true, track: D.tracks[0], label: '' } :
        kind === 'multi' ? { kind, track: D.tracks[0], rival: D.friendName, label: '' } : { kind: 'single', mode: 'race', track: D.tracks[0], label: '' };
      finish(res);
    },
  };

  /* ---------------- start (keeps the place across a republish) ---------------- */
  function start(data) {
    data = data || {};
    ST = D.states[data.st] ? data.st : D.states[store.get('state', '')] ? store.get('state', '') : 'free';
    P = loadP(ST); resetView();
    settings = D.settings.map(s => s.sel); mapV = +store.get('mapv', 1) || 1; if (!D.mapVersions.some(x => x.n === mapV)) mapV = 1;
    history = [];
    screen = VIEWS[data.screen] && data.screen !== 'results' ? data.screen : 'title';
    if (data.screen && data.carIdx != null) { carIdx = data.carIdx; colorIdx = data.colorIdx; mode = modeOf(data.mode).id; group = D.groups.some(g => g.id === data.group) ? data.group : 'circuit'; trackIdx = Math.max(0, Math.min(data.trackIdx || 0, TRACKS().length - 1)); tab = data.tab || 'stats'; titleSub = data.titleSub || null; }
    if (screen === 'track') titleSub = 'single';
    if (screen !== 'title') history = ['title'];
    if (store.get('bar', true) === false) { $('#mockbar').hidden = true; $('#mockdot').hidden = false; }
    drawStates(); render();
  }
  const hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(() => ({ st: ST, screen, titleSub, mode, group, carIdx, colorIdx, trackIdx, tab }));
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
