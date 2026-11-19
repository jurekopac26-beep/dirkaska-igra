/* =========================================================================
   KARIERA — the career's path for 1.0 (docs/kariera-1-0.md, part A): four stages of cups on the real tracks, the unlocking of the
   stages, the class cups and goals, the path's rewards, the menu's view and the save's move from v1 to v2. Logic only: no DOM, no
   game state of its own (every function takes the career and gives back a new one or a plain object), for Node and the browser like
   js/lang.js. The game (part B: js/game.js) pays the rewards and drives the cups on the championship's engine; the menu (part C:
   js/menu.js) shows Kariera.view through the bridge G.kariera.
   The cups come from a rule (the kind of a track and its length), not a hand-made list, so every new real track joins the path by
   itself; the test tracks and the ones pending (def.test, def.pending) are nowhere on it.
   ========================================================================= */
(function () {
  'use strict';

  /* ---- PRIVZETKI: the answers to kariera-1 … kariera-7 (the Odločitve page) are not in yet; each value below is the recommended
     (first) option. The plan's session changes them here, in one place, after the answers. ---- */
  const ODLOCITVE = {
    zgradba: 'stopnje',     // kariera-1: 4 stages of cups on the real tracks ('seznam': one long list, 'odprto': every cup open)
    ceste: 'pokali',        // kariera-2: a circuit cup and a road cup in every stage, time trials in stage 4 ('dirke': roads as single races, 'tt': roads only as time trials)
    odklep: 'stopnje',      // kariera-3: only the stages and their cups unlock; cars are bought; everything outside the career open
    razredi: 'pokal+cilji', // kariera-4: a class cup and 3 goals for every class ('pokal': only the cup, 'nic': none)
    ekonomija: 'pot',       // kariera-5: every car in ~250–300 wins, with the path's rewards ('hitro': ~120, 'zdaj': ~680)
    stare: 'obdrzi',        // kariera-6: an old career keeps its money, cars and upgrades and starts the path in stage 1 ('znova', 'vse')
    finale: 'izbor',        // kariera-7: the Grand Championship on 8–10 circuits from different continents ('vse', 'sam')
  };

  // the stages: their names (the menu's English in en) and the difficulty a stage's cups are raced at (Core.CAREER.diff: 0 lahka … 3 super težka)
  const STOPNJE = [
    { n: 1, name: 'Začetnik', en: 'Rookie', diff: 0 },
    { n: 2, name: 'Klub', en: 'Club', diff: 1 },
    { n: 3, name: 'Celina', en: 'Continental', diff: 2 },
    { n: 4, name: 'Legende', en: 'Legends', diff: 2 },
  ];
  // a track's stage by its length (km of a lap; a road: from the start to the finish): up to the first bound stage 1, … ; from DOLGA on
  // the long tracks' cup in stage 4. Fitted to the plan's table (19. 11.)
  const MEJE = { krog: [2.6, 4.7], cesta: [2.2, 3.7] }, DOLGA = 8;
  const NAJVEC = 6;                                     // races in a cup at most: more tracks of one kind and stage make another cup
  const LEGENDE = ['bathurst', 'spa', 'rbring', 'nring'];   // the hand-made exceptions: the Legends cup (stage 4); Suzuka is a test track
  const FINALE_N = 8, FINALE_DIFF = 3;                  // kariera-7: the final's circuits (round the continents) and its difficulty
  const ODKLEP = 2;                                     // kariera-3: in the first three of this many cups of a stage opens the next
  const RAZRED_N = 3;                                   // kariera-4: races in a class cup
  const RAZRED_KM = 100;                                // kariera-4: the class goal »drive 100 km«

  /* ---- the economy (kariera-5, option 1). Core's race prizes stay (Core.careerPrize: the place × the length × the difficulty × the car);
     the path adds these, each paid once. Tuned with the simulation in tests/kariera.test.js ---- */
  const NAGRADE = {
    pokal: [null, [25000, 15000, 10000], [80000, 48000, 32000], [200000, 120000, 80000], [400000, 240000, 160000]],   // a cup of stage s: 1st, 2nd, 3rd (a better place later: the difference)
    finale: [600000, 360000, 240000],
    prva: [null, 6000, 18000, 36000, 70000],            // the first win on a track (once a track), by the stage of its cup
    stopnja: [null, 0, 40000, 100000, 200000],          // the gift when a stage opens
    razred: [50000, 30000, 20000],                      // a class cup: 1st, 2nd, 3rd
    cilj: 20000,                                         // a class goal
  };
  // a car worth the stage (the simulation's measure »a car of the next stage after ~10–15 races of a stage«; the menu may show it): the price from
  const AVTO_STOPNJE = [null, 0, 200000, 500000, 1000000];

  // the English of the classes (Core.CATS' names), the cup names' only words the module needs
  const RAZRED_EN = { mali: 'Small cars', sportni: 'Sports cars', super: 'Supercars', klasika: 'Classics', reli: 'Rally', teren: 'Off-road', dirkalni: 'Racing',
    tovornjaki: 'Trucks', elektricni: 'Electric', posebni: 'Specials' };
  // the continent of a track's country (the English name after the comma): the final's spread. A country not here: 'drugo'
  const CELINE = {
    evropa: ['Ireland', 'Czechia', 'Sweden', 'Wales', 'Denmark', 'Latvia', 'Netherlands', 'Belgium', 'Austria', 'Germany', 'Italy', 'Turkey', 'Romania', 'France', 'Spain',
      'Montenegro', 'Switzerland', 'Georgia', 'Albania', 'Portugal', 'Finland', 'Slovenia', 'United Kingdom', 'England', 'Scotland', 'Monaco', 'Russia', 'Poland', 'Hungary', 'Norway'],
    azija: ['Uzbekistan', 'Indonesia', 'Thailand', 'Qatar', 'Bahrain', 'Malaysia', 'Japan', 'China', 'Kazakhstan', 'Sri Lanka', 'South Korea', 'India', 'Bhutan', 'Philippines', 'Vietnam', 'Oman', 'Tajikistan'],
    afrika: ['South Africa', 'Tanzania', 'Angola', 'Algeria', 'Kenya', 'Madagascar', 'Tunisia', 'Uganda', 'Cape Verde', 'Morocco', 'Namibia'],
    sever: ['USA', 'Canada', 'Mexico', 'El Salvador', 'Costa Rica', 'Panama', 'Saint Lucia'],
    jug: ['Argentina', 'Brazil', 'Chile', 'Peru'],
    oceanija: ['Australia', 'Fiji', 'Palau', 'Papua New Guinea', 'New Zealand'],
  };
  const CELINE_RED = ['evropa', 'azija', 'sever', 'jug', 'oceanija', 'afrika', 'drugo'];

  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const num = (x) => Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0;
  const rimske = ['', '', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII'];

  /* ---- the tracks ---- */
  const prava = (d) => !!d && !d.test && !d.pending;
  // the kind: 'tt' a time trial, 'cesta' an open road, 'krog' a circuit
  const vrsta = (d) => d.timeTrial ? 'tt' : d.open ? 'cesta' : 'krog';
  // a track's length in km: its real length (def.realKm), else the line through its points (a road: from the point nearest the start to the
  // one nearest the finish); within ~0.5 % of Core's Track.raceLen without building the track
  function km(d) {
    if (Number.isFinite(d.realKm) && d.realKm > 0) return d.realKm;
    const p = d.points || [];
    const near = (q) => { let b = 0, bd = Infinity; p.forEach((x, i) => { const e = Math.hypot(x[0] - q[0], x[1] - q[1]); if (e < bd) { bd = e; b = i; } }); return b; };
    let a = 0, b = p.length - 1;
    if (d.open) { if (d.start) a = near(d.start); if (d.finish) b = near(d.finish); if (b < a) [a, b] = [b, a]; }
    let L = 0; for (let i = a + 1; i <= b; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (!d.open && p.length > 2) L += Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]);
    return L / 1000;
  }
  const drzava = (d) => { const s = (d.en && d.en.name) || d.name || ''; const i = s.lastIndexOf(','); return i < 0 ? '' : s.slice(i + 1).trim(); };
  const celina = (d) => { const c = drzava(d); for (const k in CELINE) if (CELINE[k].includes(c)) return k; return 'drugo'; };
  const makadam = (d) => d.roadSurface === 'makadam' || (Array.isArray(d.surf) && d.surf.some(s => s && s[2] === 'makadam'));
  // the stage of a track's own cup (Legends, long and time trials: stage 4)
  function stopnjaProge(d) {
    if (LEGENDE.includes(d.id)) return 4;
    const v = vrsta(d), L = km(d);
    if (v === 'tt' || L >= DOLGA) return 4;
    const m = MEJE[v];
    return L <= m[0] ? 1 : L <= m[1] ? 2 : 3;
  }
  // split a list (shortest first) into ceil(n / NAJVEC) cups as even as can be, the longer cups first
  function razdeli(ids) {
    const k = Math.max(1, Math.ceil(ids.length / NAJVEC)), out = []; let i = 0;
    for (let c = 0; c < k; c++) { const n = Math.floor(ids.length / k) + (c < ids.length % k ? 1 : 0); out.push(ids.slice(i, i + n)); i += n; }
    return out.filter(x => x.length);
  }

  /* ---- the path: every stage's cups, the class cups. tracks: Core.TRACKS (or any list of track defs); cats: Core.CATS ---- */
  function pot(tracks, cats) {
    const T = (tracks || []).filter(prava), byId = new Map(T.map(d => [d.id, d])), L = new Map(T.map(d => [d.id, km(d)]));
    const sort = (ids) => ids.slice().sort((a, b) => L.get(a) - L.get(b) || (a < b ? -1 : 1));
    const pokali = [];
    const dodaj = (o) => { o.tracks = o.tracks.slice(); o.km = Math.round(o.tracks.reduce((s, id) => s + L.get(id) * Math.max(1, o.laps || byId.get(id).laps || 1), 0) * 10) / 10; pokali.push(o); };   // (km: a cup's own laps first, the long tracks' one)
    const S = (n) => STOPNJE[n - 1];
    for (let s = 1; s <= 3; s++) for (const v of ['krog', 'cesta']) {
      const ids = sort(T.filter(d => !LEGENDE.includes(d.id) && vrsta(d) === v && stopnjaProge(d) === s).map(d => d.id)), parts = razdeli(ids);
      parts.forEach((p, i) => {
        const r = parts.length > 1 ? rimske[i + 1] : '';
        dodaj({ id: 's' + s + '-' + v + (parts.length > 1 ? '-' + (i + 1) : ''), stopnja: s, vrsta: v, diff: S(s).diff, tracks: p,
          name: (v === 'krog' ? 'Pokal dirkališč' : 'Pokal cest') + r + ' · ' + S(s).name, en: { name: (v === 'krog' ? 'Circuit Cup' : 'Road Cup') + r + ' · ' + S(s).en } });
      });
    }
    // stage 4: the Legends, the long tracks (one lap), the time trials, the final
    const leg = LEGENDE.filter(id => byId.has(id));
    if (leg.length) dodaj({ id: 's4-legende', stopnja: 4, vrsta: 'krog', diff: S(4).diff, tracks: leg, name: 'Legende', en: { name: 'Legends' } });
    const dolge = sort(T.filter(d => !LEGENDE.includes(d.id) && vrsta(d) !== 'tt' && L.get(d.id) >= DOLGA).map(d => d.id));
    razdeli(dolge).forEach((p, i, a) => dodaj({ id: 's4-dolge' + (a.length > 1 ? '-' + (i + 1) : ''), stopnja: 4, vrsta: 'dolge', diff: S(4).diff, tracks: p, laps: 1,
      name: 'Dolge proge' + (a.length > 1 ? rimske[i + 1] : ''), en: { name: 'Long tracks' + (a.length > 1 ? rimske[i + 1] : '') } }));
    const tt = sort(T.filter(d => vrsta(d) === 'tt').map(d => d.id));
    razdeli(tt).forEach((p, i, a) => dodaj({ id: 's4-tt' + (a.length > 1 ? '-' + (i + 1) : ''), stopnja: 4, vrsta: 'tt', diff: S(4).diff, tracks: p,
      name: 'Kronometri' + (a.length > 1 ? rimske[i + 1] : ''), en: { name: 'Time trials' + (a.length > 1 ? rimske[i + 1] : '') } }));
    const fin = finale(T, L);
    if (fin.length) dodaj({ id: 's4-finale', stopnja: 4, vrsta: 'finale', diff: FINALE_DIFF, tracks: fin, name: 'Finale · Veliko prvenstvo', en: { name: 'Final · Grand Championship' } });
    // the class cups (kariera-4): open with a car of the class; not a stage's
    const razredi = ODLOCITVE.razredi === 'nic' ? [] : (cats || []).map((c, i) => {
      const r = { id: 'r-' + c.id, cat: c.id, stopnja: 0, vrsta: 'razred', diff: 1, tracks: razredTracks(c.id, i, T, L), name: 'Pokal razreda · ' + c.name, en: { name: 'Class Cup · ' + (RAZRED_EN[c.id] || c.name) } };
      r.km = Math.round(r.tracks.reduce((s, id) => s + L.get(id) * Math.max(1, byId.get(id).laps || 1), 0) * 10) / 10;
      r.cilji = ODLOCITVE.razredi === 'pokal' ? [] : [
        { id: c.id + '-zmaga', name: 'Zmaga', en: 'A win', need: 1 },
        { id: c.id + '-medalja', name: 'Medalja na kronometru', en: 'A time trial medal', need: 1 },
        { id: c.id + '-km', name: RAZRED_KM + ' km', en: RAZRED_KM + ' km', need: RAZRED_KM },
      ];
      return r;
    });
    const stopnje = STOPNJE.map(s => ({ n: s.n, name: s.name, en: { name: s.en }, diff: s.diff, pokali: pokali.filter(p => p.stopnja === s.n).map(p => p.id) }));
    return { stopnje, pokali, razredi, vse: pokali.concat(razredi) };
  }
  // the final (kariera-7, option 1): circuits shorter than DOLGA, one continent after another (the longest of each first), FINALE_N of them
  function finale(T, L) {
    const kr = T.filter(d => vrsta(d) === 'krog' && L.get(d.id) < DOLGA), po = {};
    for (const d of kr) (po[celina(d)] = po[celina(d)] || []).push(d.id);
    for (const k in po) po[k].sort((a, b) => L.get(b) - L.get(a) || (a < b ? -1 : 1));
    const out = [];
    for (let i = 0; out.length < FINALE_N; i++) {
      let any = false;
      for (const c of CELINE_RED) if (po[c] && po[c][i] && out.length < FINALE_N) { out.push(po[c][i]); any = true; }
      if (!any) break;
    }
    return out;
  }
  // a class cup's tracks: rally and off-road on the roads (gravel first), the racing cars and trucks on the circuits, the rest on both;
  // shorter than DOLGA; spread over the lengths, every class from another place in the list (its index)
  function razredTracks(cat, i, T, L) {
    const ok = T.filter(d => vrsta(d) !== 'tt' && L.get(d.id) < DOLGA && !LEGENDE.includes(d.id));
    const po = (a, b) => L.get(a.id) - L.get(b.id) || (a.id < b.id ? -1 : 1);   // (as long: by id, so the order of TRACKS does not matter)
    let pool;
    if (cat === 'reli' || cat === 'teren') pool = ok.filter(d => vrsta(d) === 'cesta').sort((a, b) => (makadam(b) - makadam(a)) || po(a, b));
    else if (cat === 'dirkalni' || cat === 'tovornjaki') pool = ok.filter(d => vrsta(d) === 'krog').sort(po);
    else pool = ok.slice().sort(po);
    const n = pool.length, out = [];
    if (!n) return out;
    const step = Math.max(1, Math.floor(n / RAZRED_N)), g = (cat === 'reli' || cat === 'teren') ? pool.filter(makadam).length : 0;
    if (g) out.push(pool[i % g].id);   // (rally and off-road: one gravel road at least)
    for (let k = 0; out.length < Math.min(RAZRED_N, n); k++) { const id = pool[(i + k * step) % n].id; if (!out.includes(id)) out.push(id); else if (k > 3 * n) break; }
    return out;
  }

  /* ---- the saved state: career.pot = { stopnja, pokali: { id: the best place }, cilji: { id: true }, prve: [track id], km: { class: km } } ---- */
  const novaPot = () => ({ stopnja: 1, pokali: {}, cilji: {}, prve: [], km: {} });
  function cistaPot(p) {
    if (!isObj(p)) return novaPot();
    const o = novaPot();
    o.stopnja = Math.min(STOPNJE.length, Math.max(1, num(p.stopnja) || 1));
    if (isObj(p.pokali)) for (const k in p.pokali) { const v = num(p.pokali[k]); if (v >= 1) o.pokali[k] = v; }
    if (isObj(p.cilji)) for (const k in p.cilji) if (p.cilji[k]) o.cilji[k] = true;
    if (Array.isArray(p.prve)) o.prve = [...new Set(p.prve.filter(x => typeof x === 'string'))];
    if (isObj(p.km)) for (const k in p.km) { const v = Math.round(Number(p.km[k]) * 1000) / 1000; if (Number.isFinite(v) && v > 0) o.km[k] = v; }
    return o;
  }
  // the save (tdgp-career) to v2: a v1 career keeps every field (the garage's fromCareer / toCareer and the old tests read them) and gets the
  // path (kariera-6, option 1: its money, cars and upgrades stay, the path starts in stage 1; 'znova': a new career; 'vse': every stage open).
  // A v2 save is cleaned; anything else: null (the game starts a new career). Pure: the argument is not changed
  function migrate(c) {
    if (!isObj(c)) return null;
    if (c.v === 2) return Object.assign({}, c, { pot: cistaPot(c.pot) });
    if (c.v !== 1) return null;
    if (ODLOCITVE.stare === 'znova') return null;
    const o = Object.assign({}, c, { v: 2, pot: novaPot() });
    if (ODLOCITVE.stare === 'vse') o.pot.stopnja = STOPNJE.length;
    return o;
  }
  // a new career's path (the game's careerNew adds it to its own fields)
  const novo = (c) => Object.assign({}, c || {}, { v: 2, pot: novaPot() });

  /* ---- unlocking (kariera-3, option 1) ---- */
  // the highest open stage: stage 1, then each next one when the player is in the first three of ODKLEP cups of the one before (a stage
  // with fewer cups: all of them)
  function odprta(potS, P) {
    if (ODLOCITVE.zgradba === 'odprto' || ODLOCITVE.odklep === 'nic') return STOPNJE.length;
    const p = cistaPot(potS);
    let s = 1;
    while (s < STOPNJE.length) {
      const ids = P.stopnje[s - 1].pokali, need = Math.min(ODKLEP, ids.length), top3 = ids.filter(id => p.pokali[id] >= 1 && p.pokali[id] <= 3).length;
      if (top3 < need) break;
      s++;
    }
    return Math.max(s, p.stopnja);   // (a stage once open stays open: kariera-6 'vse', or a cup that left its stage when tracks were added)
  }
  // a cup's state: 'zaklenjen' (its stage not open, a class cup without a car of the class), 'odprt', 'osvojen' (in the first three: best)
  function stanje(potS, cup, P, cats) {
    const p = cistaPot(potS), best = p.pokali[cup.id] || 0;
    const open = cup.vrsta === 'razred' ? (cats || []).includes(cup.cat) : cup.stopnja <= odprta(p, P);
    return { stanje: !open ? 'zaklenjen' : best >= 1 && best <= 3 ? 'osvojen' : 'odprt', best };
  }

  /* ---- the rewards. Each function gives { career: the new career, nagrade: [{ id, name, en, amount }] }: the game pays the amounts (its
     careerPay, so the earnings and the garage's wallet follow) and saves the career. Pure ---- */
  const cupOf = (P, id) => P.vse.find(c => c.id === id) || null;
  const stopnjaOf = (P, trackId) => { const c = P.pokali.find(x => x.tracks.includes(trackId) && x.stopnja >= 1); return c ? c.stopnja : 0; };
  // the end of a cup (its championship's final standings): the player's place. A better place than before pays the difference; the stage
  // that opens with it its gift
  function poPokalu(car, cupId, place, P, cats) {
    const c = Object.assign({}, car), p = cistaPot(c.pot), cup = cupOf(P, cupId), out = [];
    c.pot = p;
    if (!cup || !(Number.isInteger(place) && place >= 1)) return { career: c, nagrade: out };   // (a place: a whole number from 1)
    const before = p.pokali[cupId] || 0, was = odprta(p, P);
    if (!before || place < before) p.pokali[cupId] = place;
    const tbl = cup.vrsta === 'razred' ? NAGRADE.razred : cup.vrsta === 'finale' ? NAGRADE.finale : NAGRADE.pokal[cup.stopnja];
    const val = (pl) => pl >= 1 && pl <= 3 ? tbl[pl - 1] : 0, add = val(place) - (before ? val(before) : 0);
    if (add > 0) out.push({ id: 'pokal:' + cupId, name: cup.name + ' · ' + place + '. mesto', en: cup.en.name + ' · P' + place, amount: add });
    const now = odprta(p, P);
    for (let s = was + 1; s <= now; s++) { if (NAGRADE.stopnja[s]) out.push({ id: 'stopnja:' + s, name: 'Nova stopnja · ' + STOPNJE[s - 1].name, en: 'New stage · ' + STOPNJE[s - 1].en, amount: NAGRADE.stopnja[s] }); }
    p.stopnja = Math.max(p.stopnja, now);
    return { career: c, nagrade: out };
  }
  // the end of any career race (a cup's round too): ev = { track: id, pos (1 = the winner; 0 = a retirement), car: the vehicle's id,
  // cat: its class (Core MODELS' cat), km: the distance driven, medal: 'gold' | 'silver' | 'bronze' (a time trial) }. The first win on a
  // track pays once (by the stage of its cup; a time trial's gold is its win: the game passes no place for a time trial, and the
  // economy's simulation pays the first wins of the time trials' cup too); the class goals count (kariera-4)
  function poDirki(car, ev, P) {
    const c = Object.assign({}, car), p = cistaPot(c.pot), out = [];
    c.pot = p;
    if (!isObj(ev)) return { career: c, nagrade: out };
    const cat = ev.cat, d = Number(ev.km);
    if (cat && Number.isFinite(d) && d > 0) { const v = Math.round(((p.km[cat] || 0) + d) * 1000) / 1000; if (Number.isFinite(v)) p.km[cat] = v; }
    if ((ev.pos === 1 || ev.medal === 'gold') && ev.track && !p.prve.includes(ev.track)) {
      const s = stopnjaOf(P, ev.track);
      if (s) { p.prve.push(ev.track); out.push({ id: 'prva:' + ev.track, name: 'Prva zmaga na progi', en: 'First win on the track', amount: NAGRADE.prva[s] }); }
    }
    const R = cat && P.razredi.find(r => r.cat === cat);
    if (R) for (const g of R.cilji) {
      if (p.cilji[g.id]) continue;
      const done = g.id.endsWith('-zmaga') ? ev.pos === 1 : g.id.endsWith('-medalja') ? ['gold', 'silver', 'bronze'].includes(ev.medal) : (p.km[cat] || 0) >= g.need;
      if (done) { p.cilji[g.id] = true; out.push({ id: 'cilj:' + g.id, name: R.name.replace('Pokal razreda · ', '') + ' · ' + g.name, en: R.en.name.replace('Class Cup · ', '') + ' · ' + g.en, amount: NAGRADE.cilj }); }
    }
    return { career: c, nagrade: out };
  }

  /* ---- the menu's view (part C): a plain object, nothing to call. cats: the classes of the cars the player owns (the game knows them) ---- */
  function view(car, P, cats) {
    const c = isObj(car) ? car : {}, p = cistaPot(c.pot), s = odprta(p, P), own = cats || [];
    const cup = (x) => Object.assign({ id: x.id, name: x.name, en: x.en, stopnja: x.stopnja, vrsta: x.vrsta, tracks: x.tracks.slice(), km: x.km, diff: x.diff }, stanje(p, x, P, own));
    const cur = P.stopnje[Math.min(s, P.stopnje.length) - 1], top3 = cur.pokali.filter(id => p.pokali[id] >= 1 && p.pokali[id] <= 3).length;
    return {
      on: !!c.on, money: num(c.money), stopnja: s, stopenj: P.stopnje.length,
      napredek: { done: Math.min(top3, Math.min(ODKLEP, cur.pokali.length)), need: s >= P.stopnje.length ? 0 : Math.min(ODKLEP, cur.pokali.length) },
      stopnje: P.stopnje.map(st => ({ n: st.n, name: st.name, en: st.en, odprta: st.n <= s, pokali: st.pokali.map(id => cup(cupOf(P, id))) })),
      razredi: P.razredi.map(r => Object.assign(cup(r), { cat: r.cat, cilji: r.cilji.map(g => ({ id: g.id, name: g.name, en: g.en, need: g.need,
        done: !!p.cilji[g.id], progress: g.id.endsWith('-km') ? Math.min(g.need, Math.floor(p.km[r.cat] || 0)) : p.cilji[g.id] ? 1 : 0 })) })),
      prve: p.prve.length,
    };
  }

  const api = { ODLOCITVE, STOPNJE, MEJE, DOLGA, NAJVEC, LEGENDE, FINALE_N, ODKLEP, RAZRED_N, RAZRED_KM, NAGRADE, AVTO_STOPNJE,
    prava, vrsta, km, celina, stopnjaProge, pot, novo, novaPot, migrate, odprta, stanje, poPokalu, poDirki, view };
  if (typeof window !== 'undefined') window.Kariera = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
