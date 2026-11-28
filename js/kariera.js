/* =========================================================================
   KARIERA — the career's path for 1.0 (docs/kariera-1-0.md, part A and »Atlas«): five stages of events on the real tracks (the cups,
   the class cups, the single races, duels and time trials: 44 of them), their stars (0–3 by the best place), the unlocking of the
   stages by the stars, the class goals, the path's coins, the menu's view and the save's move from v1 to v2. Logic only: no DOM, no
   game state of its own (every function takes the career and gives back a new one or a plain object), for Node and the browser like
   js/lang.js. The game (part B: js/game.js) pays the rewards and drives the cups on the championship's engine; the menu (part C:
   js/menu.js) shows Kariera.view through the bridge G.kariera.
   The cups come from a rule (the kind of a track and its length), not a hand-made list, so every new real track joins the path by
   itself; the test tracks and the ones pending (def.test, def.pending) are nowhere on it.
   ========================================================================= */
(function () {
  'use strict';

  /* ---- ODLOČITVE: the answers to kariera-1 … kariera-7 (the Odločitve page, 20. 11.): option 1 everywhere but kariera-5 (option 2).
     A change of an answer is made here, in one place. ---- */
  const ODLOCITVE = {
    zgradba: 'stopnje',     // kariera-1: 4 stages of cups on the real tracks ('seznam': one long list, 'odprto': every cup open)
    ceste: 'pokali',        // kariera-2: a circuit cup and a road cup in every stage, time trials in stage 4 ('dirke': roads as single races, 'tt': roads only as time trials)
    odklep: 'stopnje',      // kariera-3: only the stages and their cups unlock; cars are bought; everything outside the career open
    razredi: 'pokal+cilji', // kariera-4: a class cup and 3 goals for every class ('pokal': only the cup, 'nic': none)
    ekonomija: 'hitro',     // kariera-5 (answered 20. 11.: option 2): every car in ~120 wins, with the path's rewards ('pot': ~250–300)
    stare: 'obdrzi',        // kariera-6: an old career keeps its money, cars and upgrades and starts the path in stage 1 ('znova', 'vse')
    finale: 'izbor',        // kariera-7: the Grand Championship on 8–10 circuits from different continents ('vse', 'sam')
  };

  // the stages: their names (the menu's English in en) and the difficulty a stage's cups are raced at (Core.CAREER.diff: 0 lahka … 3 super težka)
  const STOPNJE = [
    { n: 1, name: 'Začetnik', en: 'Rookie', diff: 0 },
    { n: 2, name: 'Klub', en: 'Club', diff: 1 },
    { n: 3, name: 'Celina', en: 'Continental', diff: 2 },
    { n: 4, name: 'Legende', en: 'Legends', diff: 2 },
    { n: 5, name: 'Prvaki', en: 'Champions', diff: 3 },
  ];
  /* ---- ATLAS (22. 11., »kariera hitreje«): every stage a fixed number of events (VELIKOST: 44 in all; the cups and class cups first, the single
     events fill the rest; a stage with more cups grows), a stage opens with the stars of all events (PRAG: of 132; scaled to the path's own
     maximum, so a smaller or bigger path keeps the same share), the class cups in the stages by the price of their class's cheapest car ---- */
  const VELIKOST = [7, 8, 9, 10, 10];
  const PRAG = [0, 9, 21, 36, 54], PRAG_OD = 132;
  const VRSTE_POS = ['dirka', 'kronometer', 'dvoboj'];   // a stage's single events in turn (a time trial only where the track has one and its medals)
  const POS_IME = { dirka: ['Dirka', 'Race'], dvoboj: ['Dvoboj', 'Duel'], kronometer: ['Kronometer', 'Time trial'] };
  // the stars by the best place: a cup (and a class cup, the final, the time trials' cup) the first three; a single race the first six; a duel only
  // the win; a time trial its medal (the game passes gold 1 … bronze 3, none 4)
  const ZVEZDICE = { pokal: [3, 2, 1], dirka: [3, 2, 2, 1, 1, 1], dvoboj: [3], kronometer: [3, 2, 1] };
  // the classes by the price of their cheapest car (Core.CAREER.car, 22. 11.); the game passes the prices themselves (pot's cene), this is the fallback
  const RAZRED_RED = ['dirkalni', 'mali', 'sportni', 'teren', 'elektricni', 'klasika', 'posebni', 'super', 'reli', 'tovornjaki'];
  // a track's stage by its length (km of a lap; a road: from the start to the finish): up to the first bound stage 1, … ; from DOLGA on
  // the long tracks' cup in stage 4. Fitted to the plan's table (19. 11.)
  const MEJE = { krog: [2.6, 4.7], cesta: [2.2, 3.7] }, DOLGA = 8;
  const NAJVEC = 6;                                     // races in a cup at most: more tracks of one kind and stage make another cup
  const LEGENDE = ['bathurst', 'spa', 'rbring', 'nring'];   // the hand-made exceptions: the Legends cup (stage 4); Suzuka is a test track
  const FINALE_N = 8, FINALE_DIFF = 3;                  // kariera-7: the final's circuits (round the continents) and its difficulty
  const ODKLEP = 2;                                     // kariera-3: in the first three of this many cups of a stage opens the next
  const RAZRED_N = 3;                                   // kariera-4: races in a class cup
  const RAZRED_KM = 100;                                // kariera-4: the class goal »drive 100 km«

  /* ---- the economy (kariera-5). Core's race prizes stay (Core.careerPrize: the place × the length × the difficulty × the car), and the prices
     of the cars, upgrades and rent; the path adds these, each paid once. 'hitro' (option 2, chosen 20. 11.): every car in ~120 wins (the
     path with the class cups ~98 of them); 'pot' (option 1): ~280. Tuned with the simulation in tests/kariera.test.js ---- */
  const EKONOMIJA = {
    hitro: {
      pokal: [null, [50000, 30000, 20000], [150000, 90000, 60000], [380000, 228000, 152000], [760000, 456000, 304000], [1140000, 684000, 456000]],
      finale: [1150000, 690000, 460000],
      prva: [null, 12000, 34000, 68000, 133000, 200000],
      stopnja: [null, 0, 76000, 190000, 380000, 570000],
      razred: [95000, 57000, 38000],
      cilj: 38000,
      posamezna: [null, [4000, 7000, 10000], [11000, 18000, 26000], [24000, 40000, 58000], [46000, 76000, 110000], [70000, 115000, 165000]],
    },
    pot: {
      pokal: [null, [25000, 15000, 10000], [80000, 48000, 32000], [200000, 120000, 80000], [400000, 240000, 160000], [600000, 360000, 240000]],
      finale: [600000, 360000, 240000],
      prva: [null, 6000, 18000, 36000, 70000, 105000],
      stopnja: [null, 0, 40000, 100000, 200000, 300000],
      razred: [50000, 30000, 20000],
      cilj: 20000,
      posamezna: [null, [2000, 3500, 5000], [5500, 9000, 13000], [12000, 20000, 29000], [23000, 38000, 55000], [35000, 58000, 83000]],
    },
  };
  // pokal: a cup of stage s, 1st, 2nd, 3rd (a better place later: the difference); prva: the first win on a track (once a track), by the
  // stage of its cup; stopnja: the gift when a stage opens; razred: a class cup, 1st, 2nd, 3rd; cilj: a class goal; posamezna: a single event
  // of stage s, 1, 2, 3 stars (Atlas; a better result later: the difference)
  const NAGRADE = EKONOMIJA[ODLOCITVE.ekonomija] || EKONOMIJA.pot;
  /* ---- proge3-kariera (25. 11., option 2: »the career grows with the tracks«): the path's rewards above are tuned to a path of DIRK_REF races
     (the cups' races, the class cups' and the single events, at 65 real tracks); a longer path pays every reward times DIRK_REF / its races
     (P.faktor, P.nagrade; rounded to 500; a shorter path as tuned), so every car is still bought at about the end of the path ---- */
  const DIRK_REF = 124;
  function skaliraj(t, f) {
    if (Array.isArray(t)) return t.map(x => skaliraj(x, f));
    return Number.isFinite(t) && t > 0 ? Math.max(500, Math.round(t * f / 500) * 500) : t;
  }
  const nagradeOf = (P) => (P && P.nagrade) || NAGRADE;
  // a car worth the stage (the simulation's measure »a car of the next stage after ~10–15 races of a stage«; the menu may show it): the price from
  const AVTO_STOPNJE = [null, 0, 200000, 500000, 1000000, 1200000];

  // the English of the classes (Core.CATS' names), the cup names' only words the module needs
  const RAZRED_EN = { mali: 'Small cars', sportni: 'Sports cars', super: 'Supercars', klasika: 'Classics', reli: 'Rally', teren: 'Off-road', dirkalni: 'Racing',
    tovornjaki: 'Trucks', elektricni: 'Electric', posebni: 'Specials' };
  // the continent of a track's country (the English name after the comma): the final's spread. A country not here: 'drugo'
  const CELINE = {
    evropa: ['Ireland', 'Czechia', 'Sweden', 'Wales', 'Denmark', 'Latvia', 'Netherlands', 'Belgium', 'Austria', 'Germany', 'Italy', 'Turkey', 'Romania', 'France', 'Spain',
      'Montenegro', 'Switzerland', 'Georgia', 'Albania', 'Portugal', 'Finland', 'Slovenia', 'United Kingdom', 'England', 'Scotland', 'Monaco', 'Russia', 'Poland', 'Hungary', 'Norway', 'Andorra'],
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
  // an ice track (def.ice: Envalira): in no cup, a single race of stage 3 (the decision kariera-envalira-791, option 1)
  const led = (d) => !!d.ice;
  // the stage of a track's own cup (Legends, long and time trials: stage 4; an ice track: stage 3, its single race)
  function stopnjaProge(d) {
    if (LEGENDE.includes(d.id)) return 4;
    if (led(d)) return 3;
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

  // a track's modes (Core's def.modes; none: a circuit races, a time trial is one): can it race (a single race, a duel), can it be a time trial
  // with medals (Atlas' kronometer: the place is the medal)
  const modes = (d) => Array.isArray(d.modes) ? d.modes : [];
  const canRace = (d) => !d.timeTrial || modes(d).includes('race');
  const canTT = (d) => !!d.medals && (!!d.timeTrial || modes(d).includes('tt'));
  const kraj = (s) => String(s || '').split(',')[0].trim();
  // an event's kind (Atlas): 'pokal' a path cup, 'finale', 'razred' a class cup, 'dirka' a single race, 'dvoboj' a duel (one rival), 'kronometer'
  const kindOf = (x) => x.kind || (x.vrsta === 'razred' ? 'razred' : x.vrsta === 'finale' ? 'finale' : 'pokal');
  // the stars of an event at its best place (0: none yet)
  function zvezdice(x, best) {
    if (!x || !(best >= 1)) return 0;
    const k = kindOf(x), t = ZVEZDICE[k] || ZVEZDICE.pokal;
    return t[best - 1] || 0;
  }
  // an event's coins for 1, 2, 3 stars (a better result later pays the difference)
  function kovanci(x, P) {
    const k = kindOf(x), NAGRADE = nagradeOf(P);
    const t = k === 'razred' ? NAGRADE.razred : k === 'finale' ? NAGRADE.finale : k === 'pokal' ? NAGRADE.pokal[x.stopnja] : NAGRADE.posamezna[x.stopnja];
    if (!t) return [0, 0, 0];
    return k === 'pokal' || k === 'razred' || k === 'finale' ? [t[2], t[1], t[0]] : t.slice();
  }

  /* ---- the path: every stage's events (the cups, the class cups, the single events). tracks: Core.TRACKS (or any list of track defs); cats:
     Core.CATS; cene: { class: the price of its cheapest car } (the game's Core.CAREER.car; none: RAZRED_RED) ---- */
  function pot(tracks, cats, cene) {
    const T = (tracks || []).filter(prava), byId = new Map(T.map(d => [d.id, d])), L = new Map(T.map(d => [d.id, km(d)]));
    const sort = (ids) => ids.slice().sort((a, b) => L.get(a) - L.get(b) || (a < b ? -1 : 1));
    const pokali = [];
    const dodaj = (o) => { o.tracks = o.tracks.slice(); o.km = Math.round(o.tracks.reduce((s, id) => s + L.get(id) * Math.max(1, o.laps || byId.get(id).laps || 1), 0) * 10) / 10; pokali.push(o); };   // (km: a cup's own laps first, the long tracks' one)
    const S = (n) => STOPNJE[n - 1];
    for (let s = 1; s <= 3; s++) for (const v of ['krog', 'cesta']) {
      const ids = sort(T.filter(d => !LEGENDE.includes(d.id) && !led(d) && vrsta(d) === v && stopnjaProge(d) === s).map(d => d.id)), parts = razdeli(ids);
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
    const fin = finale(T, L);   // (Atlas: the final is stage 5's, Prvaki; its id stays, the saves keep it)
    if (fin.length) dodaj({ id: 's4-finale', stopnja: 5, vrsta: 'finale', kind: 'finale', diff: FINALE_DIFF, tracks: fin, name: 'Finale · Veliko prvenstvo', en: { name: 'Final · Grand Championship' } });
    pokali.forEach(o => { if (!o.kind) o.kind = 'pokal'; });
    // the class cups (kariera-4): open with a car of the class in their stage (Atlas: the stage by the price of the class's cheapest car, two a stage)
    const C = cats || [], cena = (id) => cene && Number.isFinite(cene[id]) ? cene[id] : Infinity, red = (id) => { const i = RAZRED_RED.indexOf(id); return i < 0 ? RAZRED_RED.length : i; };
    const rank = C.map(c => c.id).sort((a, b) => cena(a) - cena(b) || red(a) - red(b) || (a < b ? -1 : 1));
    const razredi = ODLOCITVE.razredi === 'nic' ? [] : C.map((c, i) => {
      const r = { id: 'r-' + c.id, cat: c.id, stopnja: 1 + Math.floor(rank.indexOf(c.id) * STOPNJE.length / C.length), vrsta: 'razred', kind: 'razred', diff: 1,
        tracks: razredTracks(c.id, i, T, L), name: 'Pokal razreda · ' + c.name, en: { name: 'Class Cup · ' + (RAZRED_EN[c.id] || c.name) } };
      r.km = Math.round(r.tracks.reduce((s, id) => s + L.get(id) * Math.max(1, byId.get(id).laps || 1), 0) * 10) / 10;
      r.cilji = ODLOCITVE.razredi === 'pokal' ? [] : [
        { id: c.id + '-zmaga', name: 'Zmaga', en: 'A win', need: 1 },
        { id: c.id + '-medalja', name: 'Medalja na kronometru', en: 'A time trial medal', need: 1 },
        { id: c.id + '-km', name: RAZRED_KM + ' km', en: RAZRED_KM + ' km', need: RAZRED_KM },
      ];
      return r;
    });
    // the single events (Atlas): every stage filled to its VELIKOST, a race, a time trial and a duel in turn, each on another track of the
    // stage (stage 5: the stages 3 and 4's tracks not in the final), spread over the lengths
    const posamezne = [], stopnje = [], prej = new Set(), zv = [];   // (prej: the tracks of the stages before: another track if there is one; zv: a stage's stars without its class cups)
    STOPNJE.forEach((st, si) => {
      const s = st.n, cups = pokali.filter(p => p.stopnja === s), cls = razredi.filter(r => r.stopnja === s);
      const need = Math.max(VRSTE_POS.length, VELIKOST[si] - cups.length - cls.length);   // (proge3-kariera: room for a race, a time trial and a duel; a stage with more cups grows)
      const pool = sort(T.filter(d => !led(d) && (s <= 4 ? stopnjaProge(d) === s : stopnjaProge(d) >= 3 && !fin.includes(d.id))).map(d => d.id)), used = new Set(), mine = [];
      const ledene = s === 3 ? sort(T.filter(d => led(d) && canRace(d) && !fin.includes(d.id)).map(d => d.id)) : [];   // (an ice track: stage 3's single race, first of its events)
      const posamezna = (id, kind) => {
        const d = byId.get(id), nm = POS_IME[kind];
        const e = { id: 'e' + s + '-' + kind + '-' + id, stopnja: s, kind, vrsta: kind === 'kronometer' ? 'tt' : vrsta(d) === 'tt' ? 'cesta' : vrsta(d), diff: st.diff, tracks: [id],
          name: nm[0] + ' · ' + kraj(d.name), en: { name: nm[1] + ' · ' + kraj((d.en && d.en.name) || d.name) } };
        if (L.get(id) >= DOLGA) e.laps = 1;
        if (kind === 'dvoboj') e.n = 1;
        e.km = Math.round(L.get(id) * Math.max(1, e.laps || d.laps || 1) * 10) / 10;
        mine.push(e);
      };
      ledene.slice(0, need).forEach(id => posamezna(id, 'dirka'));
      for (let k = mine.length; k < need && used.size < pool.length; k++) {
        const want = Math.min(pool.length - 1, Math.floor(pool.length * (k + 0.5) / need));
        const near = (ok) => { let b = -1; pool.forEach((id, i) => { if (!used.has(id) && ok(byId.get(id)) && (b < 0 || Math.abs(i - want) < Math.abs(b - want))) b = i; }); return b; };
        const pick = (ok) => { const i = near(d => ok(d) && !prej.has(d.id)); return i >= 0 ? i : near(ok); };
        let kind = VRSTE_POS[k % VRSTE_POS.length], i = pick(kind === 'kronometer' ? canTT : canRace);
        if (i < 0 && kind === 'kronometer') { kind = 'dirka'; i = pick(canRace); }
        if (i < 0) break;
        used.add(pool[i]);
        posamezna(pool[i], kind);
      }
      // the stage's order (the valley's road): a single event, a cup, … in turn, the class cups last
      const dog = [], a = mine.slice(), b = cups.slice();
      while (a.length || b.length) { if (a.length) dog.push(a.shift()); if (b.length) dog.push(b.shift()); }
      cls.forEach(r => dog.push(r));
      posamezne.push(...mine); mine.forEach(e => prej.add(e.tracks[0])); zv.push(3 * (mine.length + cups.length));
      stopnje.push({ n: s, name: st.name, en: { name: st.en }, diff: st.diff, pokali: cups.map(p => p.id), dogodki: dog.map(x => x.id) });
    });
    const vse = pokali.concat(razredi, posamezne), max = vse.length * 3;
    const dirk = vse.reduce((a, x) => a + x.tracks.length, 0), faktor = dirk && DIRK_REF ? Math.min(1, DIRK_REF / dirk) : 1;
    // a threshold at most the stars of the stages before without their class cups (a small or odd set of tracks: every stage can open)
    const pragovi = PRAG.map((x, i) => Math.min(i === 1 ? x : Math.round(x * max / PRAG_OD), zv.slice(0, i).reduce((a, b) => a + b, 0)));   // (proge3-kariera: stage 2 at 9★ always; stage 1 does not grow)
    const nagrade = {}; for (const k in NAGRADE) nagrade[k] = skaliraj(NAGRADE[k], faktor);
    return { stopnje, pokali, razredi, posamezne, vse, max, pragovi, dirk, faktor, nagrade };
  }
  // the final (kariera-7, option 1): circuits shorter than DOLGA, one continent after another (the longest of each first), FINALE_N of them
  function finale(T, L) {
    const kr = T.filter(d => vrsta(d) === 'krog' && !led(d) && L.get(d.id) < DOLGA), po = {};   // (an ice track: none of the final's)
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

  /* ---- the saved state: career.pot = { stopnja, pokali: { event id: the best place (Atlas: every event's, not only the cups') }, cilji: { id: true },
     prve: [track id], km: { class: km } } ---- */
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

  /* ---- unlocking (kariera-3; Atlas 22. 11.: by the stars) ---- */
  // all the stars of the path (career.pot.pokali: every event's best place)
  const vseZvezdice = (p, P) => P.vse.reduce((z, x) => z + zvezdice(x, p.pokali[x.id] || 0), 0);
  // the highest open stage: stage 1, then each next one at its share of the path's stars (P.pragovi)
  function odprta(potS, P) {
    if (ODLOCITVE.zgradba === 'odprto' || ODLOCITVE.odklep === 'nic') return STOPNJE.length;
    const p = cistaPot(potS), z = vseZvezdice(p, P), pr = P.pragovi || [];
    let s = 1;
    while (s < P.stopnje.length && z >= (pr[s] || 0)) s++;
    return Math.max(s, p.stopnja);   // (a stage once open stays open: kariera-6 'vse', or the stars of an event that left the path when tracks were added)
  }
  // an event's state: 'zaklenjen' (its stage not open; a class cup without a car of the class), 'odprt', 'osvojen' (a star at least), best:
  // the best place, zvezdice: its stars
  function stanjeS(p, x, s, cats) {
    const best = p.pokali[x.id] || 0, z = zvezdice(x, best);
    const open = x.stopnja <= s && (x.vrsta !== 'razred' || (cats || []).includes(x.cat));
    return { stanje: !open ? 'zaklenjen' : z >= 1 ? 'osvojen' : 'odprt', best, zvezdice: z };
  }
  function stanje(potS, cup, P, cats) { const p = cistaPot(potS); return stanjeS(p, cup, odprta(p, P), cats); }

  /* ---- the rewards. Each function gives { career: the new career, nagrade: [{ id, name, en, amount }] }: the game pays the amounts (its
     careerPay, so the earnings and the garage's wallet follow) and saves the career. Pure ---- */
  const cupOf = (P, id) => P.vse.find(c => c.id === id) || null;
  // (an ice track, in no cup: the stage of its single race)
  const stopnjaOf = (P, trackId) => { const c = P.pokali.find(x => x.tracks.includes(trackId) && x.stopnja >= 1) || (P.posamezne || []).find(x => x.tracks.includes(trackId) && x.stopnja >= 1); return c ? c.stopnja : 0; };
  // the end of an event (a cup's final standings; a single event's place; a time trial's medal: gold 1, silver 2, bronze 3, none 4): the
  // player's place. More stars than before pay the difference of the coins; the stage that opens with them its gift. Also: zvezdice { prej,
  // zdaj } and stopnja { prej, zdaj } (the menu's result screen)
  function poPokalu(car, cupId, place, P, cats) {
    const c = Object.assign({}, car), p = cistaPot(c.pot), cup = cupOf(P, cupId), out = [], was = odprta(p, P);
    c.pot = p;
    const before = p.pokali[cupId] || 0, zPrej = zvezdice(cup, before);
    if (!cup || !(Number.isInteger(place) && place >= 1)) return { career: c, nagrade: out, zvezdice: { prej: zPrej, zdaj: zPrej }, stopnja: { prej: was, zdaj: was } };   // (a place: a whole number from 1)
    if (!before || place < before) p.pokali[cupId] = place;
    const zZdaj = zvezdice(cup, p.pokali[cupId]), k = kovanci(cup, P), add = (zZdaj ? k[zZdaj - 1] : 0) - (zPrej ? k[zPrej - 1] : 0);
    if (add > 0) out.push({ id: 'pokal:' + cupId, name: cup.name + ' · ' + place + '. mesto', en: cup.en.name + ' · P' + place, amount: add });
    // the gifts from the stage the career has had (p.stopnja; an odd save: the missing ones once, at its next event)
    const now = odprta(p, P), dano = ODLOCITVE.zgradba === 'odprto' || ODLOCITVE.odklep === 'nic' ? was : Math.min(was, p.stopnja);
    for (let s = dano + 1; s <= now; s++) { if (nagradeOf(P).stopnja[s]) out.push({ id: 'stopnja:' + s, name: 'Nova stopnja · ' + STOPNJE[s - 1].name, en: 'New stage · ' + STOPNJE[s - 1].en, amount: nagradeOf(P).stopnja[s] }); }
    p.stopnja = Math.max(p.stopnja, now);
    return { career: c, nagrade: out, zvezdice: { prej: zPrej, zdaj: zZdaj }, stopnja: { prej: dano, zdaj: now } };
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
      if (s) { p.prve.push(ev.track); out.push({ id: 'prva:' + ev.track, name: 'Prva zmaga na progi', en: 'First win on the track', amount: nagradeOf(P).prva[s] }); }
    }
    const R = cat && P.razredi.find(r => r.cat === cat);
    if (R) for (const g of R.cilji) {
      if (p.cilji[g.id]) continue;
      const done = g.id.endsWith('-zmaga') ? ev.pos === 1 : g.id.endsWith('-medalja') ? ['gold', 'silver', 'bronze'].includes(ev.medal) : (p.km[cat] || 0) >= g.need;
      if (done) { p.cilji[g.id] = true; out.push({ id: 'cilj:' + g.id, name: R.name.replace('Pokal razreda · ', '') + ' · ' + g.name, en: R.en.name.replace('Class Cup · ', '') + ' · ' + g.en, amount: nagradeOf(P).cilj }); }
    }
    return { career: c, nagrade: out };
  }

  /* ---- the menu's view (part C): a plain object, nothing to call. cats: the classes of the cars the player owns (the game knows them) ---- */
  // napredek: the stars and the next stage's threshold (need 0: every stage open); stopnje[].pokali and .dogodki: all the stage's events in the
  // valley's order (an event: id, name, en, stopnja, vrsta, kind, tracks, km, diff, kovanci [1★, 2★, 3★], cat (a class cup), n (a duel: 1
  // rival), laps, stanje, best, zvezdice); atlas: the same stages with the stars of the path
  function view(car, P, cats) {
    const c = isObj(car) ? car : {}, p = cistaPot(c.pot), s = odprta(p, P), own = cats || [];
    const cup = (x) => { const o = Object.assign({ id: x.id, name: x.name, en: x.en, stopnja: x.stopnja, vrsta: x.vrsta, kind: kindOf(x), tracks: x.tracks.slice(), km: x.km, diff: x.diff, kovanci: kovanci(x, P) },
      stanjeS(p, x, s, own)); if (x.cat) o.cat = x.cat; if (x.n) o.n = x.n; if (x.laps) o.laps = x.laps; return o; };
    const z = vseZvezdice(p, P), pr = P.pragovi || [];
    const stopnje = P.stopnje.map(st => {
      const ev = (st.dogodki || st.pokali).map(id => cup(cupOf(P, id)));
      return { n: st.n, name: st.name, en: st.en, odprta: st.n <= s, prag: pr[st.n - 1] || 0, zvezdice: ev.reduce((a, e) => a + e.zvezdice, 0), max: ev.length * 3, pokali: ev, dogodki: ev };
    });
    return {
      on: !!c.on, money: num(c.money), stopnja: s, stopenj: P.stopnje.length,
      napredek: { done: z, need: s >= P.stopnje.length ? 0 : pr[s] || 0 },
      stopnje,
      razredi: P.razredi.map(r => Object.assign(cup(r), { cat: r.cat, cilji: r.cilji.map(g => ({ id: g.id, name: g.name, en: g.en, need: g.need,
        done: !!p.cilji[g.id], progress: g.id.endsWith('-km') ? Math.min(g.need, Math.floor(p.km[r.cat] || 0)) : p.cilji[g.id] ? 1 : 0 })) })),
      prve: p.prve.length,
      atlas: { stopnje, zvezdice: z, max: P.max || 0, pragovi: pr.slice() },
    };
  }

  const api = { ODLOCITVE, STOPNJE, MEJE, DOLGA, NAJVEC, LEGENDE, FINALE_N, ODKLEP, RAZRED_N, RAZRED_KM, NAGRADE, AVTO_STOPNJE,
    VELIKOST, PRAG, ZVEZDICE, DIRK_REF, RAZRED_RED, VRSTE_POS, prava, vrsta, km, celina, stopnjaProge, pot, novo, novaPot, migrate, odprta, stanje, zvezdice, kovanci,
    poPokalu, poDogodku: poPokalu, poDirki, view };
  if (typeof window !== 'undefined') window.Kariera = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
