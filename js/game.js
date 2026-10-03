/* =========================================================================
   GAME — state machine, menus, HUD, main loop
   ========================================================================= */
(function () {
  'use strict';
  const { clamp } = Core;
  const $ = (id) => document.getElementById(id);
  const tr = Lang.tr;   // (the words in the chosen language, js/lang.js: tr('Proga: {0}', name))
  const STEP = 1 / 120;
  const LAPS = 3, NUM_AI = 12, PLAYER_GRID = 12;
  const PLAYER_COLORS = [0xd81f2a, 0xf5f5f0, 0x1c5fd6, 0xf2c230, 0x1a1a1f, 0x2fa84f, 0xff7a1a, 0x8e3bd6];
  const DRIVE_TXT = { FR: 'Zadnji pogon', AWD: 'Štirikolesni pogon', FF: 'Prednji pogon', MR: 'Motor na sredini' };
  const DRIVE_TAG = { FR: 'FR', AWD: '4WD', FF: 'FF', MR: 'MR' };
  const CTRL_HELP = {
    buttons: 'Levi palec: levo in desno, desni: plin in zavora. Drift: drži smer v ovinek – avto se zavrti postrani in ga zagon nese skozi ovinek, velik kot močno zavira. Ko spustiš, se poravna, protismer ga hitro ujame, plin ga vleče ven iz ovinka.',
    wheel: 'Primi volan spodaj levo in ga vrti kot pravi volan – bolj ko ga zavrtiš, bolj avto drifta. Ko ga spustiš, se sam poravna. Desno sta plin in zavora.',
    tilt: 'Telefon drži kot volan in ga nagibaj levo ali desno – močnejši nagib pomeni večji drift. Leva polovica zaslona je zavora, desna plin.'
  };
  const CTRL_HELP_CS = 'Levi palec: levo in desno, desni: plin in zavora. Drži smer – avto sam zadrsa z nosom v ovinek in se na izhodu sam poravna; zavora v ovinku ga zavrti.';
  const CTRL_NAME = { buttons: 'Tipke', wheel: 'Volan', tilt: 'Nagib' };
  const CAR_DESC = { kaze: 'Rad obrne rep, rojen za drift.', vortex: 'Veliko oprijema, stabilen tudi na robu.', pico: 'Lahek in okreten, rad podvija.', strega: 'Oster in živahen, hitro zavrti.', rally: 'Relijski dirkač iz 80-ih, ogromno moči, rojen za drift.', p206: 'Pravi 3D model, lahek in natančen v ovinkih.', formula: 'Odprta kolesa in krila, ki ga pri hitrosti pritisnejo ob cesto. Zavira izjemno, na travi in makadamu pa drsi. Z njim dirkaš proti samim formulam.',
    lm: 'Prototip za 24 ur Le Mansa: zaprta kabina, veliko zadnje krilo. Na ravninah najhitrejši avto v igri, v hitrih ovinkih ga krila držijo ob cesti. Z njim dirkaš proti samim prototipom.',
    muscle: 'Ameriški »muscle car« iz 70-ih z velikim V8. Na ravnini ga je težko ujeti, v ovinkih pa rad obrne rep: kralj drifta.',
    ev: 'Električni hiperšportnik s štirimi motorji: najhitrejši pospešek med cestnimi avti in skoraj brez zvoka, a težek.',
    truck: 'Terenski dirkalni tovornjak z velikimi kolesi. Na asfaltu počasen, na makadamu in travi pa ima največ oprijema in najhitreje pospeši; po skokih mehko pristane.' };

  /* ---------------- settings ---------------- */
  const lowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 3);
  const DEF = { phys: 'cs', control: 'buttons', camera: 'chase', zoom: 1.4, assist: 2, difficulty: 1, autoGas: 0, notes: 1, quality: lowEnd ? 'normal' : 'high', shadows: 1, sound: 1, vibrate: 1, tiltSens: 22, tiltInvert: 0, car: 0, color: 0, track: 'jezero', comm: 1, codrv: 1, damage: 2, weather: 'dry', season: 'summer', tod: 'day', mode: 'race', ghost: 1, quali: 1, cmp: 'auto', pitCmp: 'auto', name: 'Igralec', lang: 'sl', saver: 'off', tower: 1, length: 'normal', fuel: 0, line: 0 };
  let S = Object.assign({}, DEF);
  let records = {};
  try { const j = JSON.parse(localStorage.getItem('tdgp-settings') || 'null'); if (j) S = Object.assign(S, j); } catch (_) { }
  if (S.pkFly == null) S.pkFly = 1;
  if (S.track === 'pikesg') S.pkRoad = 'pikesg'; else if (S.pkRoad !== 'pikesg') S.pkRoad = 'pikes';   // (Pikes Peak: the road chosen on its card, asphalt or the historic gravel)   // (Pikes Peak: the course flyover before a fresh start, on unless switched off in Nastavitve)
  // one-time move to the new recommended defaults (chase camera, far view, high drift assist) for existing players
  try { if (!localStorage.getItem('tdgp-defaults-v2')) { S.camera = 'chase'; S.zoom = 1.4; S.assist = 2; localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-settings', JSON.stringify(S)); } } catch (_) { }
  // one-time move to the farther view (Blizu 1.1, Srednje 1.4, Daleč 1.7: the bird's-eye cameras were too close): everybody starts on Srednje
  try { if (!localStorage.getItem('tdgp-defaults-v3')) { S.zoom = 1.4; localStorage.setItem('tdgp-defaults-v3', '1'); localStorage.setItem('tdgp-settings', JSON.stringify(S)); } } catch (_) { }
  try { records = JSON.parse(localStorage.getItem('tdgp-records') || '{}') || {}; } catch (_) { records = {}; }
  // player name: printable, single spaces, max 16 characters; always escaped when rendered
  const cleanName = (v) => typeof v === 'string' || typeof v === 'number' ? String(v).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16) : '';
  const esc = (v) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  for (const k in DEF) if (S[k] == null || typeof S[k] === 'object') S[k] = DEF[k];   // hand-edited storage: a setting is always a plain value
  S.phys = 'cs';   // one driving physics: Circuit Superstars (the old 'rally' and 'arcade' were removed; old saves get cs)
  if (!['dry', 'rain', 'random', 'change', 'storm'].includes(S.weather)) S.weather = 'dry';
  for (const k of ['cmp', 'pitCmp']) if (!['auto', 'S', 'M', 'H'].includes(S[k])) S[k] = 'auto';   // (the slicks: for the start, for a pit stop)
  if (!['summer', 'autumn', 'winter'].includes(S.season)) S.season = 'summer';
  if (!['day', 'dusk', 'night', 'dawn'].includes(S.tod)) S.tod = 'day';
  if (!['race', 'tt', 'traffic', 'police'].includes(S.mode)) S.mode = 'race';   // (Vršič: the race against the rivals, the time trial, the duel in the traffic, the run from the police)
  S.difficulty = Number.isFinite(+S.difficulty) ? clamp(Math.round(+S.difficulty), 0, 3) : DEF.difficulty;   // (lahka, srednja, težka, super težka: the police all four, a race takes the last as težka)
  if (S.lang !== 'en') S.lang = 'sl';
  if (!['off', 'auto', 'on'].includes(S.saver)) S.saver = 'off';
  if (!['short', 'normal', 'long', 'endurance'].includes(S.length)) S.length = 'normal';
  Lang.set(S.lang); if (S.lang !== 'sl') Lang.apply(document.body);   // (the page in the chosen language before anything is drawn)
  S.name = cleanName(S.name) || tr(DEF.name);
  // upgrades per car: S.upg[modelId] = {motor, gume, zavore, aero} 0..3 (own objects, never shared; old saves have none)
  const UPG_IDS = Core.UPG.map(u => u.id);
  const upgNorm = (o) => { const r = {}; for (const k of UPG_IDS) { const v = o && typeof o[k] === 'number' ? o[k] : 0; r[k] = v >= 0 && v <= 3 ? Math.floor(v) : 0; } return r; };
  { const u = {}; if (S.upg && typeof S.upg === 'object') for (const m of Core.MODELS) if (S.upg[m.id]) u[m.id] = upgNorm(S.upg[m.id]); S.upg = u; }
  // records: plain objects all the way down; circuits keep bestLap, bestRace, bestPos
  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o), posNum = (v) => typeof v === 'number' && isFinite(v) && v > 0;
  if (!isObj(records)) records = {};
  if (!isObj(records.tracks)) { records.tracks = {}; if (records.bestLap) records.tracks.jezero = { bestLap: records.bestLap, bestRace: records.bestRace, bestPos: records.bestPos }; }
  // records are kept under id@cs (Circuit Superstars; the plain track id holds the times of the removed arcade and rally physics, no longer shown)
  // (def.recId: a track re-made so that its old times no longer compare keeps new records apart.) A time trial in the rain keeps its own records
  // and ghost (id-wet): the weather of the race on it, before a race the weather setting (the wet ones only with 'rain'). A track with
  // more ways to drive it (def.modes: Vršič) keeps the records of each apart from the race's (id-tt, id-tt-wet, id-traffic, id-police)
  const wetRec = (d) => isTT(d) && (race && race.track.def.id === d.id ? !!race.rain : S.weather === 'rain' || S.weather === 'storm');
  const recKey = (id) => { const d = Core.TRACKS.find(x => x.id === id), r = ((d && d.recId) || id) + (d && d.modes && modeOf(d) !== 'race' ? '-' + modeOf(d) : '') + (wetRec(d) ? '-wet' : ''); return r + '@cs'; };
  const rec = (id) => { const k = recKey(id); return records.tracks[k] || (records.tracks[k] = {}); };
  // time-trial records: bestTime, bestSplits [cp1..cpN, finish], board = top 10 [{name, car, carId, time, splits, date, upg}] (drop anything malformed, rebuild the rest from known fields)
  const splitsOf = (a) => a.slice(0, 12).map(v => posNum(v) ? v : NaN);
  const boardEntry = (e) => isObj(e) && posNum(e.time) ? { name: cleanName(e.name) || '?', car: typeof e.car === 'string' ? e.car.slice(0, 24) : '', carId: typeof e.carId === 'string' ? e.carId.slice(0, 24) : '',
    time: e.time, splits: Array.isArray(e.splits) ? splitsOf(e.splits) : [], date: posNum(e.date) ? e.date : 0, upg: upgNorm(isObj(e.upg) ? e.upg : null) } : null;
  for (const id in records.tracks) { const r = records.tracks[id]; if (!isObj(r)) { delete records.tracks[id]; continue; }
    for (const k of ['bestLap', 'bestRace', 'bestPos', 'bestTime', 'jumpRec']) if (r[k] != null && !posNum(r[k])) delete r[k];
    if (Array.isArray(r.bestSec) && r.bestSec.length === 3) r.bestSec = r.bestSec.map(v => posNum(v) ? v : null); else delete r.bestSec;   // (the best sector times: S1-S3)
    if (r.bestTime && Array.isArray(r.bestSplits)) r.bestSplits = splitsOf(r.bestSplits); else delete r.bestSplits;
    if (r.board != null) r.board = Array.isArray(r.board) ? r.board.map(boardEntry).filter(e => e).sort((a, b) => a.time - b.time).slice(0, 10) : []; }
  // one-time archive of Pikes Peak times driven on the old, narrower road (11 m -> 14 m): kept as 'pikes-ozka', never shown
  try { if (!localStorage.getItem('tdgp-pikes-w7')) { const o = records.tracks.pikes; if (isObj(o) && (o.bestTime || (o.board && o.board.length))) { records.tracks['pikes-ozka'] = o; delete records.tracks.pikes; saveRecords(); } localStorage.setItem('tdgp-pikes-w7', '1'); } } catch (_) { }
  // the career (Kariera, Core.CAREER): money, the cars bought, their upgrades (bought, kept apart from the free game's); career.on: playing it
  let career = null;
  try { career = JSON.parse(localStorage.getItem('tdgp-career') || 'null'); } catch (_) { career = null; }
  if (!isObj(career) || career.v !== 1) career = null;
  else {
    const ids = Core.MODELS.map(m => m.id), num = (x) => Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0;
    career.on = !!career.on; career.money = num(career.money); career.earned = num(career.earned); career.races = num(career.races); career.wins = num(career.wins);
    career.cars = Array.isArray(career.cars) ? career.cars.filter((id, i, a) => ids.includes(id) && a.indexOf(id) === i) : [];
    if (!career.cars.includes(Core.CAREER.car0)) career.cars.unshift(Core.CAREER.car0);
    const u = isObj(career.upg) ? career.upg : {}; career.upg = {}; for (const id of career.cars) career.upg[id] = upgNorm(isObj(u[id]) ? u[id] : null);
    const rv = career.rival; career.rival = isObj(rv) && Number.isInteger(rv.k) && rv.k >= 0 && rv.k < Core.DRIVER_NAMES.length ? { k: rv.k, me: num(rv.me), him: num(rv.him) } : null;   // (the standing rival: a roster index, the head-to-head)
  }
  const careerNew = () => ({ v: 1, on: true, money: Core.CAREER.start, cars: [Core.CAREER.car0], upg: { [Core.CAREER.car0]: upgNorm(null) }, earned: 0, races: 0, wins: 0 });
  function careerSave() { try { localStorage.setItem('tdgp-career', JSON.stringify(career)); } catch (_) { } }
  const inCareer = () => !!(career && career.on);
  const owned = (id) => !inCareer() || career.cars.includes(id);
  const eur = (x) => Lang.eur(x);   // 12.300 € (English: €12,300)
  const upgOf = (id) => inCareer() ? career.upg[id] || (owned(id) ? (career.upg[id] = upgNorm(null)) : upgNorm(null)) : S.upg[id] || (S.upg[id] = upgNorm(null));   // (the career: a car not bought is stock)
  // the car's set-up per track (the track screen: wing and gears, 0 / 1 / 2; 1 the standard one), kept in the settings
  const setupOf = (id) => { if (!isObj(S.setup)) S.setup = {}; const o = S.setup[id]; const v = (x) => x === 0 || x === 1 || x === 2 ? x : 1;
    return (S.setup[id] = { wing: v(o && o.wing), gear: v(o && o.gear) }); };
  const upgCount = (id) => UPG_IDS.reduce((a, k) => a + upgOf(id)[k], 0);
  // a time trial: a track that is one (def.timeTrial), or one with more ways to drive it (def.modes: a race against the rivals up the
  // road, the time trial, ...) switched to it (S.mode 'tt'); while a race on it is on, the way that race is driven
  const hasTT = (d) => !!(d && (d.timeTrial || (d.modes && d.modes.indexOf('tt') >= 0)));
  // modeOf: the way a track with def.modes is driven ('race', 'tt', 'traffic': the duel with one rival on the open road, 'police': the run from the
  // police): while a race on it is on, that race's; else the setting
  const modeOf = (d) => !d || !d.modes ? 'race' : race && race.track.def.id === d.id ? (race.timeTrial ? 'tt' : race.pol ? 'police' : race.tf ? 'traffic' : 'race') : d.modes.indexOf(S.mode) >= 0 ? S.mode : d.modes[0];   // (a road with no race up it, Sani Pass: its first way)
  const isTT = (d) => !!(d && (d.timeTrial || (hasTT(d) && modeOf(d) === 'tt')));
  const MODE_NAME = { race: 'Dirka', tt: 'Kronometer', traffic: 'Promet', police: 'Policija' };   // (tr() at use)
  const upRace = (d) => !!(d && d.open && !isTT(d));   // a race against the rivals up an open road (Vršič)
  // a time trial is a hill climb (Pikes Peak), a rally special stage (def.rally: Ouninpohja) or a descent (def.descent: Katu-Jaryk, down a gravel
  // road into a canyon): each with its own words and commentator lines
  const isRally = (d) => !!(d && d.rally);
  const isDesc = (d) => !!(d && d.descent);
  // medal times of a time trial (def.medals.cs: [gold, silver, bronze] in s, .wet.cs in the rain): the medal of a time (0 gold .. 2 bronze, -1 none)
  const MEDAL = ['Zlata medalja', 'Srebrna medalja', 'Bronasta medalja'], MEDAL_EN = ['gold', 'silver', 'bronze'], MEDAL_ICON = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
  const medalSet = (d) => { const M = d && d.medals && (wetRec(d) ? d.medals.wet : d.medals); return (M && M[physOf()]) || null; };
  const medalOf = (d, t) => { const M = medalSet(d); if (!M || !(t > 0)) return -1; for (let k = 0; k < 3; k++) if (t <= M[k]) return k; return -1; };
  const medalLine = (d, t) => { const M = medalSet(d); if (!M) return ''; const k = medalOf(d, t), n = k < 0 ? 2 : k - 1;   // (won, and how far the next one is)
    return (k >= 0 ? MEDAL_ICON[k] + ' ' + tr(MEDAL[k]) : tr('Brez medalje')) + (n >= 0 ? tr(k < 0 ? ' · do brona {0} ({1})' : n === 0 ? ' · do zlata {0} ({1})' : ' · do srebra {0} ({1})', fmt(M[n], true), sgn(t - M[n])) : '') + '.'; };
  const ttAgain = (d) => tr(isRally(d) ? 'Ponovi preizkušnjo' : isDesc(d) ? 'Ponovi spust' : 'Ponovi vzpon');
  const TT_LINES = { intro: ['introTT', 'introStage', 'introPassTT', 'introDescTT'], go: ['goTT', 'goStage', 'goPassTT', 'goDescTT'], cpFirst: ['cpFirst', 'cpFirstStage', null, 'cpFirstDesc'],
    record: ['summitRecord', 'stageRecord', null, 'descRecord'], even: ['summitEven', 'stageEven', null, 'descEven'], end: ['summit', 'stageEnd', null, 'descEnd'] };
  const TT_CITY = { intro: 'introCity', go: 'goCity' };   // (a city stage, def.cityStage: Harju in Jyväskylä, its own welcome and start)
  const ttLine = (d, k) => (d && d.cityStage && TT_CITY[k]) || (k === 'intro' && d && d.theme === 'pikes' && d.roadSurface === 'makadam' ? 'introTTg' : TT_LINES[k][isRally(d) ? 1 : isDesc(d) ? 3 : d && d.modes ? 2 : 0] || TT_LINES[k][0]);   // (a hill climb, a rally stage, a mountain pass, a descent, a city stage)
  // (Pikes Peak on its historic gravel road: its own welcome)
  // a road's own commentator lines for a key (def.comm: Los Caracoles' instead of Vršič's): the key of its pool, registered with Comm when first said
  const ownLine = (d, key) => { const L = d && d.comm && d.comm[key]; if (!L) return key; const k = key + '@' + d.id; Comm.addLines(k, L); return k; };
  const numDot = (n) => Lang.thou(n);   // 3048 -> 3.048 (English: 3,048)
  const kmTxt = (m, dec) => Lang.dec((m / 1000).toFixed(dec));   // 1,9 (English: 1.9)
  const cpWord = (n) => Lang.cur === 'en' ? n + (n === 1 ? ' checkpoint' : ' checkpoints') : n + (n === 1 ? ' kontrolna točka' : n === 2 ? ' kontrolni točki' : n <= 4 ? ' kontrolne točke' : ' kontrolnih točk');
  const jumpWord = (n) => Lang.cur === 'en' ? n + (n === 1 ? ' jump' : ' jumps') : n + (n === 1 ? ' skok' : n === 2 ? ' skoka' : n <= 4 ? ' skoki' : ' skokov');
  // time trial splits table: the altitude of each point (hill climb) or how far into the stage it lies
  const ttWhereHead = (d) => tr(d.alt ? 'Višina' : 'Razdalja');
  const ttWhere = (T, s) => { const alt = T.altAt(T.hy[T.idx(s)]); return alt != null ? numDot(alt) + ' m' : T.def.alt ? '' : kmTxt(s - T.startS, 2) + ' km'; };
  const sgn = (d) => Math.abs(d) < 0.0005 ? '\u00b10.000' : (d < 0 ? '\u2212' : '+') + (Math.abs(d) >= 60 ? fmt(Math.abs(d)) : Math.abs(d).toFixed(3));   // −1.234 / +0.512 / ±0.000 / −3:24.799
  const dCls = (d) => d < -0.0005 ? 'fast' : d > 0.0005 ? 'slow' : 'even';
  // a race's laps by the length (Dolžina dirke): short half the track's usual (at least one), long twice, endurance three times (an open road:
  // its one run)
  const LEN_K = { short: 0.5, normal: 1, long: 2, endurance: 3 };
  const lapsOf = (d) => d.open ? 1 : Math.max(1, Math.round((d.laps || LAPS) * (LEN_K[S.length] || 1)));
  const lapWord = (n) => Lang.cur === 'en' ? n + (n === 1 ? ' LAP' : ' LAPS') : n + (n === 1 ? ' KROG' : n === 2 ? ' KROGA' : n <= 4 ? ' KROGI' : ' KROGOV');
  const trackCache = new Map();
  const getTrack = (id) => { if (!trackCache.has(id)) trackCache.set(id, new Core.Track(Core.TRACKS.find(d => d.id === id) || Core.TRACKS[0])); return trackCache.get(id); };
  function save() { try { localStorage.setItem('tdgp-settings', JSON.stringify(S)); } catch (_) { } }
  // one-time switch to the player's own rally car (number 7, blue livery)
  if (!(S.carV >= 2)) { S.car = Core.MODELS.findIndex(m => m.id === 'rally'); S.color = 2; S.carV = 2; save(); }
  const carNum = () => Core.MODELS[S.car].num || 1;
  function saveRecords() { try { localStorage.setItem('tdgp-records', JSON.stringify(records)); } catch (_) { } }

  /* ---------------- state ---------------- */
  let track, demo = null, race = null;
  let bg = 'demo';            // what renders behind menus: demo | show | race
  let screen = 'title';       // title | car | upg | track | board | settings | pause | results | none
  let settingsReturn = 'title';
  let phase = 'none';         // intro | lights | racing | finish | podium | done
  let introLen = 1.3;         // s of the intro before the lights (longer on the Red Bull Ring: the jets' fly-over)
  const JET_SHOT = 6.1;       // (the jets' shot: from their start 470 m up the straight until they are nearly overhead)
  const PODIUM_T = 8;         // s on the podium (the Red Bull Ring) before the results
  let phaseT = 0, lightsOn = 0, holdT = 0;
  let paused = false;
  let acc = 0, last = 0;
  let demoTarget = null, demoSwitch = 0;
  let msgT = 0, splitT = 0, lastLapCount = 0, lastBeepLight = 0;
  let cpSeen = 0, ttRes = null, boardId = null;   // time trial: checkpoint events shown, the finished run's result, Lestvica tab
  let cornerSeen = -1, cornerShow = false;   // tracks with named places: the last name shown under the clock (lap * 1000 + index), and whether it is still up
  let fbT = 0, prevGear = 1, prevAir = 0;
  let tiltWarned = false;
  let orientBlock = false;
  // adaptive quality (see adaptive()): pending = shadows go off at the next pause or race start; slowAvg = frame time that decided it;
  // check = windows until the effect is measured; restore = no faster without shadows, so they come back; keep = never switch them off again
  const perf = { sum: 0, n: 0, good: 0, slow: 0, pending: false, slowAvg: 0, check: 0, restore: false, keep: false };
  let autoNoShadows = false;   // shadows switched off by adaptive() for this visit only (never saved: S.shadows keeps the player's choice)
  let noAdapt = false; try { noAdapt = localStorage.getItem('tdgp-noadapt') === '1'; } catch (_) { }   // automated tests: resolution and shadows stay as set
  let autoDrive = false;   // automated tests: the player's car drives itself (window.__game.autoDrive)

  /* ---------------- championship (Prvenstvo): a series of races with points (the rules in Core: CHAMPS, champTable) ----------------
     champ = { v: 1, id, diff (the difficulty it was started with), rounds: [{ track, order: [driver key, ... the winner first], rain }] },
     kept in the browser until a new one starts. champRun: the race on screen is its next round (a restart drives that round again;
     the result counts once the player is across the line, also when the player leaves right after it) */
  let champ = null, champRun = false, champPick = null, champQuitT = 0;
  const CH_KEYS = Core.champKeys(NUM_AI);
  const champDef = () => champ ? Core.CHAMPS.find(c => c.id === champ.id) || null : null;
  const champDone = () => { const d = champDef(); return !!d && champ.rounds.length >= d.tracks.length; };
  try {
    const j = JSON.parse(localStorage.getItem('tdgp-champ') || 'null'), d = isObj(j) && Core.CHAMPS.find(c => c.id === j.id);
    if (d && j.v === 1 && [0, 1, 2].includes(j.diff) && Array.isArray(j.rounds) && j.rounds.length <= d.tracks.length && j.rounds.every((r, i) => isObj(r) && r.track === d.tracks[i] &&
      Array.isArray(r.order) && r.order.length === CH_KEYS.length && new Set(r.order).size === CH_KEYS.length && r.order.every(k => CH_KEYS.includes(k))))
      champ = { v: 1, id: d.id, diff: j.diff, rounds: j.rounds.map(r => ({ track: r.track, order: r.order.slice(), rain: r.rain ? 1 : 0 })) };
  } catch (_) { champ = null; }
  function champSave() { try { if (champ) localStorage.setItem('tdgp-champ', JSON.stringify(champ)); else localStorage.removeItem('tdgp-champ'); } catch (_) { } }

  /* ---------------- statistics and achievements (Dosežki): the player's own numbers over all races, and the achievements ----------------
     st (kept in the browser, tdgp-stats): the km and the time driven, races, wins, podiums, poles, fastest laps, time trials run, medals, titles,
     escapes, races online, the top speed, the longest jump and drift, the tracks raced to the line (and those with a gold medal), the
     achievements unlocked (id -> date). Counted as the game goes (stDrive after each physics step of a race, the rest at the finish); an
     achievement unlocked: a message at once and a line on the results. */
  const stNew = () => ({ v: 1, km: 0, time: 0, races: 0, wins: 0, podiums: 0, poles: 0, fl: 0, tt: 0, gold: 0, silver: 0, bronze: 0, titles: 0, escapes: 0, online: 0, vmax: 0, jump: 0, drift: 0, tracks: {}, goldT: {}, ach: {} });
  let st = stNew();
  try {
    const j = JSON.parse(localStorage.getItem('tdgp-stats') || 'null');
    if (isObj(j) && j.v === 1) {
      for (const k in st) if (typeof st[k] === 'number' && k !== 'v' && posNum(j[k])) st[k] = j[k];
      for (const k of ['tracks', 'goldT', 'ach']) if (isObj(j[k])) for (const id in j[k]) if (posNum(j[k][id])) st[k][id] = j[k][id];
    }
  } catch (_) { st = stNew(); }
  let stHold = false;   // (a profile brought in: the game starts again with its stats, not these saved over them as the page goes)
  function stSave() { if (stHold) return; try { localStorage.setItem('tdgp-stats', JSON.stringify(st)); } catch (_) { } }
  // [id, name, how to get it, progress: () => [now, goal]]
  // the tracks as the menu lists them: a road variant (Pikes Peak on its historic gravel) counts with its track, either road driven
  const trackCards = () => Core.TRACKS.filter(d => !d.variantOf), droveCard = (d) => Core.TRACKS.some(x => (x === d || x.variantOf === d.id) && st.tracks[x.id]);
  const ACH = [
    ['first', 'Prvi cilj', 'Pripelji do cilja prve dirke.'],
    ['win', 'Prva zmaga', 'Zmagaj na dirki.'],
    ['fromLast', 'Z zadnjega na prvo', 'Zmagaj na dirki z zadnjega štartnega mesta (vsaj deset avtov).'],
    ['cleanLap', 'Čist krog', 'Odpelji krog brez dotika ograje.'],
    ['cleanRace', 'Brez praske', 'Pripelji dirko do cilja brez dotika ograje in drugih avtov.'],
    ['pole', 'Prvi na štartu', 'Osvoji prvo štartno mesto v kvalifikacijah.'],
    ['fastLap', 'Najhitrejši krog', 'Odpelji najhitrejši krog dirke.'],
    ['hattrick', 'Hat-trick', 'Prvo štartno mesto, zmaga in najhitrejši krog na isti dirki.'],
    ['overtake', 'Napadalec', 'Na eni dirki pridobi osem mest.'],
    ['podium10', 'Deset stopničk', 'Stopi na stopničke desetkrat.', () => [st.podiums, 10]],
    ['wins10', 'Deset zmag', 'Zmagaj desetkrat.', () => [st.wins, 10]],
    ['km100', '100 kilometrov', 'Prevozi 100 km.', () => [st.km, 100]],
    ['km1000', '1000 kilometrov', 'Prevozi 1000 km.', () => [st.km, 1000]],
    ['allTracks', 'Popotnik', 'Pripelji do cilja na vsaki progi.', () => [trackCards().filter(droveCard).length, trackCards().length]],
    ['nring', 'Zeleni pekel', 'Pripelji do cilja na Nordschleife.'],
    ['champ', 'Prvak', 'Osvoji prvenstvo.'],
    ['legend', 'Legenda', 'Osvoji prvenstvo Legende.'],
    ['gold', 'Zlata medalja', 'Osvoji zlato medaljo v kronometru.'],
    ['allGold', 'Zlata zbirka', 'Osvoji zlato na vseh kronometrih.', () => [trackCards().filter(d => d.medals && st.goldT[d.id]).length, trackCards().filter(d => d.medals).length]],
    ['escape', 'Neulovljiv', 'Pobegni policiji čez prelaz.'],
    ['rain', 'Mojster dežja', 'Zmagaj v dežju.'],
    ['night', 'Nočna ptica', 'Zmagaj ponoči.'],
    ['drift', 'Kralj drsenja', 'Drsi tri sekunde brez prekinitve.'],
    ['jump', 'Letalec', 'Skoči 40 m daleč.'],
    ['speed', '300 km/h', 'Pelji 300 km/h.'],
    ['rich', 'Bogataš', 'V karieri zasluži 100.000 €.'],
    ['online', 'S prijateljem', 'Pripelji do cilja dirke s prijateljem.'],
    ['school', 'Učenec', 'Osvoji zlato medaljo v šoli vožnje.'],
    ['schoolAll', 'Diplomant', 'Osvoji zlato v vseh vajah šole vožnje.', () => [SCHOOL.filter(L => schoolRec(L).medal === 0).length, SCHOOL.length]],
  ];
  let achNew = [];   // (unlocked during the race on screen: listed on its results)
  function achGet(id) {
    const a = ACH.find(x => x[0] === id); if (!a || st.ach[id]) return;
    st.ach[id] = Date.now(); stSave(); achNew.push(id);
    achToast(tr('Nov dosežek: {0}', tr(a[1]))); Sfx.beep(1320, 0.1, 0.1); setTimeout(() => Sfx.beep(1760, 0.14, 0.1), 120);
  }
  // (a new achievement waits for a message of the race on the toast to go: never over a rule the player has to know)
  const achQ = [];
  function achToast(t) { achQ.push(t); if (achQ.length === 1) achPump(); }
  function achPump() { if (!achQ.length) return; if ($('toast').classList.contains('show')) { setTimeout(achPump, 600); return; } toast(achQ[0], 3000); setTimeout(() => { achQ.shift(); achPump(); }, 3200); }
  const achLine = () => { const L = achNew.map(id => tr(ACH.find(a => a[0] === id)[1])); achNew = []; return L.length ? tr(' Novi dosežki: {0}.', L.join(', ')) : ''; };
  // per race: the drift under way, wall or car contact (this lap, this race), the laps counted, pole position for this race
  let stRun = { drift: 0, lapWall: false, wall: false, car: false, laps: 0, pole: false, done: false };
  function stDrive(P, dt) {   // after each physics step of a race
    if (phase !== 'racing' || P.finished) return;
    st.km += Math.abs(P.speed) * dt / 1000; st.time += dt;
    const v = P.speed * 3.6; if (v > st.vmax) st.vmax = v; if (v >= 300) achGet('speed');
    if (Math.abs(P.beta || 0) > 0.35 && P.speed > 12 && !P.air) { stRun.drift += dt; if (stRun.drift >= 3) achGet('drift'); }
    else { if (stRun.drift > st.drift) st.drift = stRun.drift; stRun.drift = 0; }
    if (P.hitWall > 0.5) { stRun.lapWall = true; stRun.wall = true; }
    if (P.hitCar > 0.5) stRun.car = true;
    if (P.lapTimes.length > stRun.laps) { stRun.laps = P.lapTimes.length; if (!stRun.lapWall && !race.timeTrial) achGet('cleanLap'); stRun.lapWall = false; }   // (a lap done without the wall)
    if (st.km >= 100) achGet('km100'); if (st.km >= 1000) achGet('km1000');
  }
  // a race to the line (not online): the counts and the achievements of the finish (pos of n, the fastest lap of the race)
  function stRace(pos, n, fl) {
    if (stRun.done) return; stRun.done = true;
    const P = race.player, id = track.def.id;
    st.races++; st.tracks[id] = (st.tracks[id] || 0) + 1;
    if (pos === 1) st.wins++; if (pos <= 3) st.podiums++; if (fl) st.fl++;
    achGet('first');
    if (pos === 1) { achGet('win'); if (P.grid >= n && n >= 10) achGet('fromLast'); if (race.rain) achGet('rain'); if (S.tod === 'night') achGet('night'); if (stRun.pole && fl) achGet('hattrick'); }
    if (fl) achGet('fastLap');
    if (!stRun.wall && !stRun.car) achGet('cleanRace');
    if (P.grid - pos >= 8) achGet('overtake');
    if (st.podiums >= 10) achGet('podium10'); if (st.wins >= 10) achGet('wins10');
    if (id === 'nring') achGet('nring');
    if (trackCards().every(droveCard)) achGet('allTracks');
    stSave();
  }
  if (!isObj(records.champ)) records.champ = {};   // per series: best = the best final place, titles = championships won
  for (const id in records.champ) { const r = records.champ[id]; if (!isObj(r) || !Core.CHAMPS.some(c => c.id === id)) { delete records.champ[id]; continue; }
    if (!(Number.isInteger(r.best) && r.best > 0)) delete r.best; if (!(Number.isInteger(r.titles) && r.titles > 0)) delete r.titles; }

  /* ---------------- helpers ---------------- */
  const hexCss = (h) => '#' + h.toString(16).padStart(6, '0');
  function fmt(t, pad) {
    if (!(t >= 0) || !isFinite(t)) return pad ? '--:--.---' : '-:--.---';
    const m = Math.floor(t / 60), s = t - m * 60;
    const ss = s.toFixed(3).padStart(6, '0');
    return (pad ? String(m).padStart(2, '0') : m) + ':' + ss;
  }
  function toast(txt, ms) {
    const el = $('toast'); el.textContent = txt; el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), ms || 2600);
  }
  function showMsg(txt, cls, dur) {
    const el = $('h-msg'); el.textContent = txt; el.className = 'show ' + (cls || ''); msgT = dur || 1.6;
  }
  function vibrate(ms) { if (S.vibrate) Input.vibrate(ms); }

  /* ---------------- orientation: iso camera = landscape, chase camera = portrait ---------------- */
  const wantPortrait = () => S.camera === 'chase';
  // started from the home screen as an installed app (manifest.webmanifest), not in a browser tab. Decided once at the start:
  // later, Chrome on Android also reports display-mode full screen for a browser tab in full screen (the Celoten zaslon button).
  const APP = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
  const installedApp = () => APP;
  // turn the screen the camera's way and keep it there. Browsers allow it only in full screen or in the installed app
  // (Chrome on Android); elsewhere (Safari on the iPhone) the "turn your phone" notice of updateOrientation() takes over.
  // (window.screen, the device's screen: in this file `screen` is the menu screen on show)
  function lockOrientation() {
    const o = window.screen && window.screen.orientation;
    if (!o || !o.lock || !(isFs() || installedApp())) return;
    try { o.lock(wantPortrait() ? 'portrait' : 'landscape').catch(() => { }); } catch (_) { }
  }
  function updateOrientation() {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const portrait = window.innerHeight > window.innerWidth;
    const inRace = bg === 'race' && (screen === 'none' || screen === 'pause');
    const mismatch = coarse && inRace && portrait !== wantPortrait();
    const el = $('rotate'), CN = { iso: 'izometrična', chase: 'za avtom', kino: 'kino', cockpit: 'kokpit' };
    $('rotate-txt').textContent = tr(wantPortrait() ? 'Obrni telefon v pokončni položaj' : 'Obrni telefon v ležeči položaj');
    // (or keep it as it is: the camera for that way (Nastavitve, Kamera); the button switches to it)
    $('rotate-why').textContent = tr(wantPortrait() ? 'Kamera »{0}« je za pokončni položaj.' : 'Kamera »{0}« je za ležeči položaj.', tr(CN[S.camera] || S.camera)) + ' ' + tr(portrait ? 'Lahko pa igraš pokončno s kamero za avtom.' : 'Lahko pa igraš ležeče z izometrično kamero.');
    $('rotate-cam').textContent = tr(portrait ? 'Igraj pokončno' : 'Igraj ležeče');
    el.classList.toggle('to-portrait', wantPortrait());
    el.classList.toggle('show', mismatch);
    orientBlock = mismatch;
    if (mismatch && phase === 'racing' && screen === 'none') pause();
  }

  /* ---------------- screens ---------------- */
  // a row of choices wider than its panel (a narrow phone; the pause panel on a phone on its side): smaller letters, then smaller still
  function fitSegs() {
    const sc = document.querySelector('.screen.show'); if (!sc) return;
    for (const g of sc.querySelectorAll('.seg')) {
      g.classList.remove('tight', 'tighter'); if (!g.offsetParent || g.scrollWidth <= g.clientWidth + 1) continue;
      g.classList.add('tight'); if (g.scrollWidth > g.clientWidth + 1) { g.classList.remove('tight'); g.classList.add('tighter'); }
    }
  }
  function showScreen(name) {
    screen = name;
    for (const s of document.querySelectorAll('.screen')) s.classList.toggle('show', s.id === 's-' + name);
    fitSegs();
    const inRace = name === 'none';
    $('hud').classList.toggle('off', !(bg === 'race' && (name === 'none' || name === 'pause')));
    $('touch').classList.toggle('off', !(bg === 'race' && name === 'none' && phase !== 'finish' && phase !== 'done'));
    $('btn-pause').classList.toggle('off', !(bg === 'race' && inRace));
    $('btn-cam').classList.toggle('off', !(bg === 'race' && inRace)); if (inRace) camLabel();
    if (!inRace) $('btn-rescue').classList.add('off');
    if (inRace) requestAnimationFrame(() => Input.layout());
    updateOrientation();
  }
  function refreshSegs() {
    for (const seg of document.querySelectorAll('.seg')) {
      const key = seg.dataset.set; if (!key) continue;   // (upgrade rows mark their own selection)
      const val = key === 'shadows' ? (shadowsOn() ? 1 : 0) : key === 'wing' || key === 'gear' ? setupOf(S.track)[key] : S[key];   // (shadows: what is on screen, also when adaptive() switched them off; the set-up: the chosen track's)
      for (const b of seg.querySelectorAll('button')) b.classList.toggle('sel', String(val) === b.dataset.v);
    }
    document.querySelectorAll('.tiltrow').forEach(r => r.classList.toggle('off', S.control !== 'tilt'));
    $('tilt-sens').value = S.tiltSens; $('tilt-sens-v').textContent = S.tiltSens + '°';
    $('tilt-inv-btn').classList.toggle('primary', !!S.tiltInvert);
    $('ctrl-help').textContent = tr((S.control === 'buttons' ? CTRL_HELP_CS : CTRL_HELP[S.control]) || '');
    { const d = Core.TRACKS.find(x => x.id === S.track) || Core.TRACKS[0], r = rec(d.id), nm = Lang.of(d, 'name');   // the selected track and its record first (short screens may cut the end of the hint)
      const wx = tr(S.weather === 'rain' ? ' · dež' : S.weather === 'storm' ? ' · nevihta' : S.weather === 'random' ? ' · morda dež' : S.weather === 'change' ? ' · menljivo vreme' : '') + tr(S.season === 'autumn' ? ' · jesen' : S.season === 'winter' ? ' · zima' : '') + tr(S.tod === 'dusk' ? ' · večer' : S.tod === 'night' ? ' · noč' : S.tod === 'dawn' ? ' · jutro' : '');
      if (isTT(d)) { $('title-hint').textContent = tr('Proga: {0}', nm) + (r.bestTime ? tr(' (osebni rekord {0})', fmt(r.bestTime, true)) : tr(' (še brez časa)')) + '.'; $('title-sub').textContent = nm + tr(' · kronometer · brez nasprotnikov'); }
      else if (modeOf(d) === 'traffic' || modeOf(d) === 'police') { const pol = modeOf(d) === 'police';
        $('title-hint').textContent = tr('Proga: {0}', nm) + (r.bestRace ? tr(pol ? ' (najhitrejši pobeg {0})' : ' (najboljši čas {0})', fmt(r.bestRace, true)) : '') + '.';
        $('title-sub').textContent = nm + tr(pol ? ' · beg pred policijo · odprta cesta' : ' · dvoboj z enim tekmecem · promet na cesti') + wx; }
      else if (upRace(d)) { $('title-hint').textContent = tr('Proga: {0}', nm) + (r.bestRace ? tr(' (najboljša dirka {0})', fmt(r.bestRace, true)) : '') + '.'; $('title-sub').textContent = nm + tr(' · dirka na vrh · {0} nasprotnikov', NUM_AI) + wx; }
      else { $('title-hint').textContent = tr('Proga: {0}', nm) + (r.bestLap ? tr(' (rekord kroga {0})', fmt(r.bestLap, true)) : '') + '.'; $('title-sub').textContent = nm + ' · ' + lapWord(lapsOf(d)).toLowerCase() + tr(' · {0} nasprotnikov', 12) + wx + (S.length === 'endurance' ? tr(' · vzdržljivostna') : '') + (S.fuel && d.pit ? tr(' · gorivo') : ''); } }
    $('title-hint').textContent += tr(' Upravljanje: {0}, kamera: {1}. Spremeniš v nastavitvah.', tr(CTRL_NAME[S.control]), tr(S.camera === 'chase' ? 'za avtom (telefon pokončno)' : S.camera === 'kino' ? 'kino (telefon ležeče)' : S.camera === 'cockpit' ? 'kokpit (telefon ležeče)' : 'izometrična (telefon ležeče)')) + (records.bestLap ? tr(' Rekord kroga: {0}.', fmt(records.bestLap, true)) : '');
    { const el = $('set-name'); if (el && document.activeElement !== el) el.value = S.name; }
    { const d = champDef(); $('btn-champ').textContent = tr('Prvenstvo') + (d && !champDone() ? ' · ' + (champ.rounds.length + 1) + '/' + d.tracks.length : ''); }
    $('btn-career').textContent = tr('Kariera') + (inCareer() ? ' · ' + eur(career.money) : '');
  }
  function shadowsOn() { return !!S.shadows && !autoNoShadows; }
  // the picture's settings to the renderer only when they change (it builds every shader again: a language or a sound switch must not)
  let rsKey = '';
  function renderSettings() { const rs = { quality: S.quality, shadows: shadowsOn(), camera: S.camera }, k = JSON.stringify(rs); if (k !== rsKey) { rsKey = k; Render.applySettings(rs); } Render.setSaver(saverOn()); }
  // the battery saver (Varčevanje z baterijo): 30 frames a second and a lower resolution; 'auto' while the battery is at 20 % or less and not
  // charging (where the browser tells: Chrome; elsewhere 'auto' stays off)
  let batLow = false;
  const saverOn = () => S.saver === 'on' || (S.saver === 'auto' && batLow);
  try { if (navigator.getBattery) navigator.getBattery().then((b) => { const up = () => { const was = saverOn(); batLow = !b.charging && b.level <= 0.2; if (saverOn() !== was) { renderSettings(); perf.sum = perf.n = 0; if (saverOn()) toast(tr('Baterija je skoraj prazna: varčni način (30 sličic na sekundo, nižja ločljivost).'), 3600); } };
    up(); b.addEventListener('levelchange', up); b.addEventListener('chargingchange', up); }).catch(() => { }); } catch (_) { }
  function applySettings() {
    renderSettings();
    Render.cam.userZoom = +S.zoom;
    Comm.setEnabled(!!+S.comm); Comm.setSpeech(!!+S.sound); Comm.setNotes(!!+S.codrv);
    Comm.setOnVoice(v => { const el = $('comm-voice'); if (el) el.textContent = !v.any ? tr('Ta brskalnik ne podpira govora – komentatorja ne bo slišati.') : tr('Glas: {0} ({1})', v.name || tr('privzeti angleški'), v.lang) + tr(v.male ? ' – moški' : ' – nižji ton') + (v.codrv ? tr(' · sovoznik: {0}', v.codrv) : '') + (v.radio ? tr(' · policijski radio: {0} ({1})', v.radio, v.radioLang) : tr(' · policijski radio: ni glasu za slovenščino, govori angleško')); });
    Input.setMode(S.control);
    Input.setOptions({ autoGas: !!S.autoGas, tiltSens: S.tiltSens, tiltInvert: !!S.tiltInvert, vibrate: !!S.vibrate });
    Sfx.setEnabled(!!S.sound);
    if (race && race.player) race.player.assist = Core.ASSISTS[S.assist];
    refreshSegs();
  }
  // driving physics: Circuit Superstars' kinematic drift ('cs', the only one)
  const physOf = () => 'cs';
  // the weather: dry, rain, or at random for every race (rain more often in the Ardennes, the Eifel and the Julian Alps in the autumn, less in the Andes);
  // the title demo rains only with 'rain'
  const RAIN_P = { spa: 0.5, nring: 0.45, vrsic: 0.45, caracoles: 0.2, bigsur: 0.2, rastro: 0.4, moki: 0.1 };   // (the Andes in summer, the Californian coast: mostly dry; the Serra Geral: humid)
  const rainOf = () => S.weather === 'rain' || S.weather === 'storm' ? 1 : (S.weather === 'random' || S.weather === 'change') && Math.random() < (RAIN_P[track && track.def.id] || 0.35) ? 1 : 0;
  // 'change': the weather changes during a race (on a circuit, or up the Vršič; Race opts weather): it starts dry and rains later on, or it starts wet,
  // the rain stops and the road dries (the racing line first). Somewhere between a fifth and a half of the race (by its usual length); a time trial: as 'random'
  let wxNext = null;   // (tests: the weather of the next race)
  function weatherOf(d) {
    if (wxNext) { const W = wxNext; wxNext = null; return W; }
    if (S.weather === 'storm') return { rain: 1, wx: null, storm: true };   // (a thunderstorm: rain all the race, lightning and thunder)
    if (S.weather !== 'change' || isTT(d)) return { rain: rainOf(), wx: null };
    const wet = Math.random() < 0.5, est = (d.open ? track.raceLen : track.len * lapsOf(d)) / 38;   // (an open road: its one run)
    return { rain: wet ? 1 : 0, wx: { at: +(est * (0.2 + Math.random() * 0.3)).toFixed(1), dur: wet ? 25 : Math.round(30 + Math.random() * 30), to: wet ? 0 : 1 } };
  }
  const demoRain = () => S.weather === 'rain' || S.weather === 'storm' ? 1 : 0;
  function setOption(key, v) {
    if (key === 'wing' || key === 'gear') {   // (the set-up of the chosen track)
      setupOf(S.track)[key] = +v; save(); refreshSegs();
      const d = Core.TRACKS.find(x => x.id === S.track), W = ['malo krila', 'srednje krilo', 'veliko krila'], G = ['kratke prestave', 'srednje prestave', 'dolge prestave'], U = setupOf(S.track);
      if (d) toast(tr('Nastavitev za {0}: {1}, {2}.', Lang.of(d, 'name'), tr(W[U.wing]), tr(G[U.gear])), 2400);
      return; }
    const num = ['zoom', 'assist', 'difficulty', 'autoGas', 'notes', 'shadows', 'sound', 'vibrate', 'comm', 'codrv', 'damage', 'ghost', 'quali', 'tower', 'fuel', 'line'];
    S[key] = num.includes(key) ? +v : v;
    if (key === 'lang') Lang.set(S.lang);   // (before the settings apply: what they write is in the new language)
    if (key === 'shadows') { autoNoShadows = false; perf.pending = perf.restore = false; perf.keep = true; }   // the player's own choice wins for the rest of the visit
    if (key === 'saver') { perf.sum = perf.n = 0; perf.good = perf.slow = 0; }   // (the frame times measured again from now)
    if (key === 'tower') $('hud').classList.toggle('tw', !!tw && !!S.tower);
    if (key === 'line') Render.setLine(!!race && lineWant());
    save(); applySettings();
    if (key === 'lang') relang();
    if (key === 'pitCmp' && race && race.player) race.player.pitCmp = S.pitCmp;   // (the slicks for the next pit stop)
    if (key === 'weather' && demo) { demo.setRain(demoRain()); if (!race) Render.setStorm(S.weather === 'storm'); }   // (a race keeps its weather; the next one gets the new setting)
    if (key === 'season' || key === 'tod') Render.setAtmos({ season: S.season, tod: S.tod });   // (the season and the time of day: at once, also on the title demo)
    if (key === 'season' && track && Render.worldStale) ensureTrack(track.def.id, () => { });   // (a world painted for the season (Vršič): built again in the new one)
    if ((key === 'weather' || key === 'mode' || key === 'length' || key === 'pkGhost' || key === 'pkRoad') && screen === 'track') buildTrackScreen();   // (a time trial's records in the rain are its own, and a race's: the cards show them)
    if (key === 'control' && v === 'tilt') enableTilt(false);
    if (key === 'camera') { lockOrientation(); updateOrientation(); }
  }
  // the camera during a race (C on the keyboard, the View / Select button of a pad, the button on the HUD or in the pause): the next one
  // that suits the phone as it is held (lying: isometric, kino, cockpit; upright: behind the car; a computer: all four), kept as the setting
  const CAMS = ['iso', 'chase', 'kino', 'cockpit'], CAM_NAME = { iso: 'izometrična', chase: 'za avtom', kino: 'kino', cockpit: 'kokpit' };
  function camPool() { const coarse = matchMedia('(pointer: coarse)').matches, portrait = window.innerHeight > window.innerWidth; return coarse ? CAMS.filter(c => (c === 'chase') === portrait) : CAMS; }
  function cycleCam() {
    const pool = camPool(); if (pool.length < 2 && pool[0] === S.camera) return;
    const next = pool[(pool.indexOf(S.camera) + 1) % pool.length];
    setOption('camera', next); Render.resetCam(); camLabel();
    if (screen === 'none') toast(tr('Kamera: {0}', tr(CAM_NAME[next])), 1300);
  }
  // the language changed (Nastavitve): the page and what the game wrote on it again, in the new one; the screen the settings return to
  // is built again (the others are built when they open)
  function relang() {
    Lang.set(S.lang); Lang.apply(document.body);
    if (S.name === 'Igralec' || S.name === 'Player') { S.name = tr('Igralec'); save(); }   // (the default name, in the new language)
    updateOrientation(); updateFsButtons(); camLabel(); refreshSegs();
    if (race) { $('pause-restart').textContent = restartTxt(); $('h-rank').firstElementChild.textContent = tr(race.pol ? 'POLICIJA' : 'MESTO'); }
    const B = { car: buildCarScreen, upg: buildUpgScreen, track: buildTrackScreen, board: buildBoardScreen, champ: buildChampScreen, career: buildCareerScreen };
    if (B[settingsReturn]) B[settingsReturn]();
    if (mp) buildRoom();
    for (const k in hudCache) delete hudCache[k];   // (the HUD writes its texts again)
  }
  // the pause menu's restart: the climb or the stage again, the qualifying lap, the run from the police, the race
  const restartTxt = () => !race ? tr('Ponovi dirko') : race.timeTrial ? ttAgain(track.def) : race.quali ? tr('Ponovi krog') : race.pol ? tr('Ponovi beg') : tr('Ponovi dirko');
  function camLabel() { const b = $('pause-cam'); if (b) b.textContent = tr('Kamera: {0}', tr(CAM_NAME[S.camera])); const h = $('btn-cam'); if (h) h.classList.toggle('dis', camPool().length < 2); }
  function enableTilt(fromStart) {
    Input.requestTilt().then(res => {
      if (res !== 'granted') { toast(tr(res === 'denied' ? 'Dostop do senzorja nagiba je zavrnjen. Uporabi tipke ali volan.' : 'Ta naprava ne podpira nagiba. Uporabi tipke ali volan.'), 3600); return; }
      setTimeout(() => {
        if (!Input.tiltAlive() && !tiltWarned) {
          tiltWarned = true;
          toast(tr('Senzor nagiba ne pošilja podatkov. Odpri igro v celotnem brskalniku ali izberi tipke/volan.'), 4200);
        }
      }, 1600);
    });
  }

  /* ---------------- car select ---------------- */
  function buildCarScreen() {
    const M = Core.MODELS[S.car];
    $('car-name').textContent = M.name;
    $('car-drive').textContent = DRIVE_TAG[M.drive];
    $('car-credit').textContent = tr(M.credit || '');
    const st = Core.upgStats(M, upgOf(M.id)), nUp = upgCount(M.id);   // stats and power with this car's upgrades
    $('car-desc').textContent = tr(DRIVE_TXT[M.drive]) + '. ' + tr(CAR_DESC[M.id] || '') + ' ' + tr('{0} KM', Math.round(st.kw * 1.36)) + (nUp ? tr(' (nadgrajen)') : '') + ', ' + M.mass + ' kg.';
    $('car-stats').innerHTML = statRows(M.stats, st);
    $('btn-upg').innerHTML = '<span>' + tr('Nadgradnje') + ' \u203a' + (nUp ? '<b class="upg-n">' + nUp + '/' + UPG_IDS.length * 3 + '</b>' : '') + '</span>';
    { const own = owned(M.id), pr = Core.CAREER.car[M.id] || 0, el = $('car-price'), nb = $('car-next');   // (the career: the car's price, or in the garage)
      el.className = 'car-price' + (inCareer() ? own ? ' own' : '' : ' off');
      el.textContent = inCareer() ? own ? tr('V tvoji garaži · imaš {0}', eur(career.money)) : tr('Cena {0} · imaš {1}', eur(pr), eur(career.money)) : '';
      nb.dataset.act = own ? 'to-track' : 'car-buy'; nb.textContent = own ? tr('Naprej') : tr('Kupi · {0}', eur(pr)); nb.classList.toggle('poor', !own && career.money < pr);
      $('btn-upg').classList.toggle('off', !own); }
    $('car-colors').innerHTML = PLAYER_COLORS.map((c, i) => '<button data-col="' + i + '" class="' + (i === S.color ? 'sel' : '') + '" style="background:' + hexCss(c) + '" aria-label="' + tr('Barva {0}', i + 1) + '"></button>').join('');
    Render.setShowCar(M, PLAYER_COLORS[S.color], carNum());
    refreshSegs();
  }

  // stat bars: stock value, the gain from upgrades drawn in blue behind it
  function statRows(b, st) {
    const rows = [['Moč', 'power'], ['Oprijem', 'grip'], ['Lahkost', 'weight'], ['Drift', 'drift']];
    return rows.map(r => '<span>' + tr(r[0]) + '</span><div class="bar">' + (st[r[1]] > b[r[1]] ? '<i class="up" style="width:' + (st[r[1]] * 10) + '%"></i>' : '') + '<i class="base" style="width:' + (b[r[1]] * 10) + '%"></i></div>').join('');
  }

  /* ---------------- upgrades (free; per car, applied on every track) ---------------- */
  const UPG_TXT = {
    motor: 'Več moči: hitrejši pospešek in višja končna hitrost.',
    gume: 'Več oprijema v ovinkih in boljše speljevanje.',
    zavore: 'Močnejše zaviranje, krajša zavorna pot.',
    aero: 'Pritisk na cesto: več oprijema v hitrih ovinkih, a malo več zračnega upora.'
  };
  function upgEffect(id, lv) {
    if (!lv) return tr('serijsko');
    const U = {}; U[id] = lv; const m = Core.upgMods(U), pc = (x) => '+' + Math.round((x - 1) * 100) + '\u00a0%';
    if (id === 'motor') return tr('{0} moči', pc(m.kw));
    if (id === 'gume') return tr('{0} oprijema', pc(m.grip));
    if (id === 'zavore') return tr('{0} zavorne moči', pc(m.brake));
    return tr('+{0}\u00a0% oprijema pri 150\u00a0km/h, {1}\u00a0upora', Math.round(m.aeroK * 41.7 * 41.7 * 100), pc(m.drag));
  }
  function buildUpgScreen() {
    const M = Core.MODELS[S.car], U = upgOf(M.id), st = Core.upgStats(M, U);
    $('upg-car').textContent = M.name + (inCareer() ? ' · ' + eur(career.money) : '');
    document.querySelector('#s-upg [data-act="upg-reset"]').classList.toggle('off', inCareer());   // (the career: bought parts stay on)
    $('upg-stats').innerHTML = statRows(M.stats, st) + '<span class="upg-km">' + tr('{0} KM', Math.round(st.kw * 1.36)) + (U.motor ? tr(' (serijsko {0} KM)', Math.round(M.kw * 1.36)) : '') + ' · ' + M.mass + ' kg</span>';
    $('upg-list').innerHTML = Core.UPG.map(u => '<div class="upg-row"><div class="upg-top"><span class="rlbl">' + tr(u.name) + '</span><span class="upg-eff">' + upgEffect(u.id, U[u.id]) + '</span></div>' +
      '<div class="seg upg-seg" data-upg="' + u.id + '">' + u.lv.map((n, i) => '<button data-lv="' + i + '" class="' + (i === U[u.id] ? 'sel' : inCareer() && i < U[u.id] ? 'have' : '') + '">' + tr(n) +
        (inCareer() && i > U[u.id] ? '<span class="pr">' + eur(Core.careerUpgPrice(U[u.id], i)) + '</span>' : '') + '</button>').join('') + '</div>' +
      '<p class="upg-desc">' + tr(UPG_TXT[u.id] || '') + '</p></div>').join('');
  }

  // an upgrade level picked: free outside the career; in it a higher level is bought (the levels in between too), a lower one cannot be sold
  function upgPick(part, lv) {
    const M = Core.MODELS[S.car], U = upgOf(M.id), u = Core.UPG.find(x => x.id === part);
    if (inCareer()) {
      if (lv < U[part]) { toast(tr('V karieri kupljenih delov ne moreš prodati.'), 2600); return; }
      if (lv === U[part]) return;
      const pr = Core.careerUpgPrice(U[part], lv);
      if (career.money < pr) { toast(tr('Premalo denarja: {0} {1} stane {2}, imaš {3}.', tr(u.name), tr(u.lv[lv]), eur(pr), eur(career.money)), 3200); return; }
      career.money -= pr; U[part] = lv; careerSave();
      toast(tr('Kupljeno: {0} – {1} za {2}. Ostane {3}.', tr(u.name), tr(u.lv[lv]), eur(pr), eur(career.money)), 3000);
    } else { U[part] = lv; save(); }
    buildUpgScreen();
  }

  /* ---------------- replay: the race recorded (every car 20 times a second, from the start to the results), watched after the finish
     from TV cameras beside the track, behind a car or from above; any car followed, played faster or slower ---------------- */
  const REC_DT = 0.05, REC_W = 7, REC_MAX = 20 * 60 * 20;   // (per car: x, y, z, h, vl, front wheel angle, bits: 1 braking, 2 the safety car there, 4 its lamps on; 20 min at most)
  let recd = null, replay = null;
  function recStart() { recd = { cars: race.cars.slice(), n: race.cars.length, frames: [], next: 0, ev: [], pos: null, last: new Map() }; }
  function recStep() {
    const R = recd; if (!R || race.state !== 'racing' && race.state !== 'done' || race.time < R.next || R.frames.length >= REC_MAX) return;
    R.next = race.time + REC_DT;
    const n = R.n, f = new Float32Array(1 + (n + 1) * REC_W); f[0] = race.time;
    const put = (c, o, bits) => { f[o] = c.x; f[o + 1] = c.y || 0; f[o + 2] = c.z; f[o + 3] = c.h; f[o + 4] = c.vl || 0; f[o + 5] = c.delta || 0; f[o + 6] = bits; };
    for (let k = 0; k < n; k++) { const c = R.cars[k]; put(c, 1 + k * REC_W, c.inBrk > 0.08 && c.vl > 0.5 ? 1 : 0); }
    const S = race.fl && race.fl.sc; if (S && S.car) put(S.car, 1 + n * REC_W, 2 + (S.state === 'out' ? 4 : 0));
    R.frames.push(f);
    if (!race.timeTrial && !(mp && mp.race)) recPasses(R);
  }
  /* the highlights (Najboljši trenutki): the best moments noted as they happen - the overtakes (a car behind another at the last sample is
     ahead of it now, both racing close together: not in the pits, not under the safety car) and the heavy crashes - then played as a
     programme: the start, the best four (the player's first, the fights at the front, passes in the corners, back-and-forth battles; apart
     from each other), the finish; each from the TV cameras beside the track, the car of the moment followed, a caption, the commentator */
  function recPasses(R) {
    const t = race.time, T = race.track, cars = R.cars, n = R.n, pos = cars.map(c => c.pos);
    if (R.pos && !(race.fl && race.fl.sc)) for (let ja = 0; ja < n; ja++) {
      const a = cars[ja], p0 = R.pos[ja]; if (!(a.pos < p0) || a.inPit || a.finished || a.pitWant || a.speed < 8) continue;
      for (let jb = 0; jb < n; jb++) {
        const b = cars[jb]; if (jb === ja || !(R.pos[jb] < p0 && b.pos > a.pos) || b.inPit || b.finished || b.pitWant || Math.abs(a.dist - b.dist) > 25) continue;
        const key = ja + '>' + jb, lt = R.last.get(key); R.last.set(key, t); if (lt != null && t - lt < 12) continue;   // (the same pass again soon: once)
        const back = R.last.get(jb + '>' + ja), fight = back != null && t - back < 10, spun = b.speed < 0.5 * a.speed || b.stuckT > 0.3, bend = Math.abs(T.k[T.idx(a.q.s)]) > 1 / 120;
        const me = !!(a.isPlayer || b.isPlayer), sc = 1 + (me ? 3 : 0) + (a.pos === 1 ? 2 : 0) + Math.max(0, 8 - a.pos) * 0.15 + (bend ? 1 : 0) + (fight ? 1.5 : 0) - (spun ? 1.5 : 0);
        R.ev.push({ kind: 'pass', t, a: ja, b: jb, pos: a.pos, sc });
      }
    }
    R.pos = pos;
  }
  function recHits() {   // (after a step: a heavy hit, the wall or another car; one moment a car within 6 s, the hardest)
    const R = recd; if (!R || race.timeTrial || (mp && mp.race) || race.state !== 'racing') return;
    for (let j = 0; j < R.n; j++) {
      const c = R.cars[j], imp = Math.max(c.hitWall || 0, c.hitCar || 0); if (imp <= 13) continue;
      const t = race.time, sc = 1.2 + imp / 12 + (c.isPlayer ? 2.5 : 0), e = R.ev.find(q => q.kind === 'crash' && q.a === j && t - q.t < 6);
      if (e) { if (sc > e.sc) e.sc = sc; } else R.ev.push({ kind: 'crash', t, a: j, b: -1, sc });
    }
  }
  const hlName = (c) => c.isPlayer ? tr('Ti') : c.name;
  function hlPlan() {   // the clips: { t0, t1, k (the car followed), lbl, cap, say, vars }
    const R = recd; if (!R || race.timeTrial || R.frames.length < 200) return null;
    const F = R.frames, tA = F[0][0], tEnd = F[F.length - 1][0], cars = R.cars, W = race.finishOrder[0], tFin = W && W.finishTime <= tEnd - 1.5 ? W.finishTime : null;
    const pole = Math.max(0, cars.findIndex(c => c.grid === 1));
    const clips = [{ t0: tA, t1: Math.min(tA + 8.5, tEnd), k: pole, lbl: tr('ŠTART'), cap: '', say: 'rpStart' }];
    const pick = [];
    for (const e of R.ev.slice().sort((x, y) => y.sc - x.sc)) {
      if (pick.length >= 4) break;
      if (e.t < tA + 10 || e.t + 3 > tEnd || (tFin != null && e.t > tFin - 6) || pick.some(q => Math.abs(q.t - e.t) < 9)) continue;
      pick.push(e);
    }
    pick.sort((x, y) => x.t - y.t);
    for (const e of pick) {
      const a = cars[e.a], b = e.b >= 0 ? cars[e.b] : null;
      if (e.kind === 'pass') clips.push({ t0: e.t - 5.5, t1: e.t + 2.5, k: e.a, lbl: tr('PREHITEVANJE'), cap: hlName(a) + ' \u25b8 ' + hlName(b) + ' · ' + tr('{0} mesto', Lang.ord(e.pos)),
        say: a.isPlayer ? 'rpPassMe' : b.isPlayer ? 'rpPassOnMe' : 'rpPass', vars: { a: a.name, b: b.name, pos: Comm.ordinal(e.pos) } });
      else clips.push({ t0: e.t - 4, t1: e.t + 3, k: e.a, lbl: tr('NESREČA'), cap: hlName(a), say: a.isPlayer ? 'rpCrashMe' : 'rpCrash', vars: { a: a.name } });
    }
    if (tFin != null) clips.push({ t0: tFin - 5, t1: tFin + 1.5, k: cars.indexOf(W), lbl: tr('CILJ'), cap: W.isPlayer ? tr('Tvoja zmaga!') : tr('Zmaga: {0}', hlName(W)), say: W.isPlayer ? 'rpFinishMe' : 'rpFinish', vars: { a: W.name } });
    return clips.length > 1 ? clips : null;
  }
  function replayHL() {   // the highlights programme (from the results, or the replay's Trenutki button)
    const clips = hlPlan(); if (!clips) { toast(tr('Najboljših trenutkov ni.'), 2000); return; }
    if (!replay) replayStart(); if (!replay) return;
    replay.hl = { clips, i: -1 }; replay.speed = 1; hlNext();
  }
  function hlNext() {
    const P = replay, H = P && P.hl; if (!H) return;
    if (++H.i >= H.clips.length) { hlOff(); replayEnd(); return; }   // (the last moment done: back to the results)
    const C = H.clips[H.i]; P.t = C.t0; P.i = 0; P.k = C.k; P.cam = 'tv'; P.play = true; Render.resetCam();
    const el = $('rp-hl-cap'); el.innerHTML = '<small>' + esc(C.lbl) + '</small>' + esc(C.cap); el.classList.remove('off');
    Comm.say(C.say, C.vars || null, 4); replayUI();
  }
  function hlOff() { if (replay) replay.hl = null; $('rp-hl-cap').classList.add('off'); }
  function replayStart() {
    const R = recd; if (!R || R.frames.length < 40) { toast(tr('Posnetka ni.'), 2000); return; }
    replay = { t: R.frames[0][0], t1: R.frames[R.frames.length - 1][0], i: 0, speed: 1, play: true, cam: 'tv', k: Math.max(0, R.cars.indexOf(race.player)), sc: null };
    showScreen('none'); $('hud').classList.add('off'); $('btn-pause').classList.add('off'); $('btn-cam').classList.add('off'); $('touch').classList.add('off'); $('replay-ui').classList.remove('off');
    Sfx.setRunning(false); Sfx.silence(); Comm.stop(); Render.setGhost(null); Render.setGhostF(null); Render.resetCam(); replayUI();
  }
  function replayEnd() {
    if (!replay) return;
    hlOff(); replay = null; $('replay-ui').classList.add('off');
    if (race && race.fl) race.fl.sc = null;
    showScreen('results');
  }
  const RP_CAM = { tv: 'TV', chase: 'Za avtom', iso: 'Od zgoraj', cockpit: 'Kokpit' }, RP_SPEED = [1, 2, 4, 0.5, 0.25];
  function replayUI() {
    const P = replay; if (!P) return;
    $('rp-hl').classList.toggle('on', !!P.hl);
    $('rp-play').innerHTML = P.play ? '&#10074;&#10074;' : '&#9654;'; $('rp-speed').textContent = Lang.dec(P.speed) + '\u00d7'; $('rp-cam').textContent = tr(RP_CAM[P.cam]);
  }
  function replayAct(a) {
    const P = replay, R = recd; if (!P) return;
    if (a === 'rp-hl') { if (P.hl) { hlOff(); replayUI(); } else replayHL(); return; }   // (Trenutki: the highlights on, or off: the whole race again)
    if (P.hl && a !== 'rp-play' && a !== 'rp-speed') hlOff();   // (a camera, a car, the start: the viewer's own way through the race)
    if (a === 'rp-restart') { P.t = R.frames[0][0]; P.i = 0; P.play = true; Render.resetCam(); }
    else if (a === 'rp-play') { if (!P.play && P.t >= P.t1) { P.t = R.frames[0][0]; P.i = 0; } P.play = !P.play; }
    else if (a === 'rp-speed') P.speed = RP_SPEED[(RP_SPEED.indexOf(P.speed) + 1) % RP_SPEED.length];
    else if (a === 'rp-cam') { const K = Object.keys(RP_CAM); P.cam = K[(K.indexOf(P.cam) + 1) % K.length]; Render.resetCam(); }
    else if (a === 'rp-prev' || a === 'rp-next') { P.k = (P.k + (a === 'rp-next' ? 1 : R.n - 1)) % R.n; Render.resetCam(); }
    else if (a === 'rp-exit') { replayEnd(); return; }
    replayUI();
  }
  // a car where the recording has it at time t (between two samples)
  function rpPose(c, A, B, o, u) {
    const L = (j) => A[o + j] + (B[o + j] - A[o + j]) * u;
    c.x = c.px = L(0); c.y = c.py = L(1); c.z = c.pz = L(2); c.h = c.ph = A[o + 3] + Core.wrapPi(B[o + 3] - A[o + 3]) * u;
    c.vl = L(4); c.delta = L(5); c.inBrk = A[o + 6] & 1 ? 1 : 0; c.vx = Math.cos(c.h) * c.vl; c.vz = Math.sin(c.h) * c.vl;
    const gv = Math.abs(c.vl) / 14;   // (the gear and the revs as they might have been: a gear every 14 m/s; the cockpit's instruments)
    c.w = 0; c.beta = 0; c.air = 0; c.axF = 0; c.gear = c.vl < -0.5 ? -1 : Math.min(6, 1 + Math.floor(gv)); c.rpm = (c.m.redline || 7000) * (c.gear >= 6 ? Math.min(0.95, 0.5 + 0.08 * (gv - 5)) : 0.5 + 0.42 * (gv % 1)); c.inHand = 0; c.roadY = c.y; c.onCurb = false;
    c.q = track.query(c.x, c.z, c.q && c.q.i >= 0 ? c.q.i : -1, c.q || {});
  }
  function replayFrame(dt) {
    if (replay.hl && replay.play && replay.t >= replay.hl.clips[replay.hl.i].t1) { hlNext(); if (!replay) return; }   // (the highlights: the next moment)
    const P = replay, R = recd, F = R.frames;
    if (P.play) { P.t = Math.min(P.t1, P.t + dt * P.speed); P.clk = (P.clk || 0) + dt; if (P.t >= P.t1) { P.play = false; replayUI(); } }   // (clk: the game's clock while it plays, for the tests)
    let i = P.i; while (i < F.length - 2 && F[i + 1][0] <= P.t) i++; while (i > 0 && F[i][0] > P.t) i--; P.i = i;
    const A = F[i], B = F[Math.min(i + 1, F.length - 1)], u = B[0] > A[0] ? Core.clamp((P.t - A[0]) / (B[0] - A[0]), 0, 1) : 0;
    for (let k = 0; k < R.n; k++) rpPose(R.cars[k], A, B, 1 + k * REC_W, u);
    const o = 1 + R.n * REC_W, scOn = A[o + 6] >= 2;   // (the safety car, where it was out: its own car, posed like the others)
    if (race.fl) {
      if (scOn) { if (!P.sc) P.sc = new Core.Car(Core.MODELS[1], { id: 0, name: 'Varnostni avto', color: 0xdfe3e8, phys: physOf() }); P.sc.sc = true; P.sc.num = 0; rpPose(P.sc, A, B[o + 6] >= 2 ? B : A, o, u); race.fl.sc = { car: P.sc, state: A[o + 6] & 4 ? 'out' : 'in' }; }
      else race.fl.sc = null;
    }
    const c = R.cars[P.k];
    $('rp-info').textContent = (c.isPlayer ? tr('Ti') : c.name) + ' · ' + fmt(Math.max(0, P.t), true);
    $('rp-prog').style.width = (100 * (P.t - F[0][0]) / Math.max(1e-3, P.t1 - F[0][0])).toFixed(1) + '%';
    Render.frame(dt, 1, c, P.cam, { noFx: true });
  }

  /* ---------------- photo mode (Foto in the pause, or in the replay): the race (or the recording) stands still, the HUD and the controls
     hidden; the camera circles the car (a drag: round it and up or down; two fingers, the mouse wheel or - / +: nearer or farther), a
     lens, a filter, a sharp car in a soft world (the high quality's depth of field); the picture saved: the phone's share sheet, else a
     PNG file ---------------- */
  const PH_LENS = [[24, 70], [35, 52], [50, 38], [85, 23]];   // (mm, the vertical field of view for it)
  const PH_FILT = [   // name, the CSS filter on the screen, and the same in steps for the saved picture (saturate, sepia, contrast)
    ['brez', '', []], ['živo', 'saturate(1.45) contrast(1.08)', [['sat', 1.45], ['con', 1.08]]], ['črno-belo', 'grayscale(1) contrast(1.15)', [['sat', 0], ['con', 1.15]]],
    ['sepija', 'sepia(0.85) contrast(1.05)', [['sep', 0.85], ['con', 1.05]]], ['film', 'contrast(1.12) saturate(0.85) sepia(0.18)', [['con', 1.12], ['sat', 0.85], ['sep', 0.18]], true]];
  let photo = null;
  function photoStart(from) {
    const car = from === 'replay' && replay ? recd.cars[replay.k] : race && race.player; if (!car) return;
    if (from === 'replay') { replay.play = false; replayUI(); $('replay-ui').classList.add('off'); }
    const cm = Render.camera, cy = (car.y || 0) + 0.7, dx = cm.position.x - car.x, dz = cm.position.z - car.z, dy = cm.position.y - cy, d = Math.hypot(dx, dy, dz);
    const inCar = d < 3;   // (from the cockpit: behind the car, a little above it)
    photo = { from, car, yaw: inCar ? car.h + Math.PI + 0.5 : Math.atan2(dz, dx), pitch: inCar ? 0.22 : Core.clamp(Math.asin(dy / Math.max(1, d)), 0.03, 1.4), dist: inCar ? 8 : Core.clamp(d, 4, 40),
      lens: 1, filt: 0, blur: false, hide: false, ptrs: new Map(), pinch: 0, moved: 0, prev: Render.cam.shot || null, shot: { sky: true, floor: true, near: 0.3, blur: 0 } };
    showScreen('photo'); photoUI(); photoPose(); Render.setShot(photo.shot); Render.clearSparks();
  }
  function photoEnd() {
    if (!photo) return;
    const P = photo; photo = null; $('gl').style.filter = ''; $('s-photo').classList.remove('hidden');
    Render.setShot(P.prev);
    if (P.from === 'replay' && replay) { showScreen('none'); $('hud').classList.add('off'); $('btn-pause').classList.add('off'); $('btn-cam').classList.add('off'); $('touch').classList.add('off'); $('replay-ui').classList.remove('off'); }
    else showScreen('pause');
  }
  function photoPose() {
    const P = photo, c = P.car, S0 = P.shot, cy = (c.y || 0) + 0.7, cp = Math.cos(P.pitch);
    S0.px = c.x + Math.cos(P.yaw) * cp * P.dist; S0.pz = c.z + Math.sin(P.yaw) * cp * P.dist; S0.py = cy + Math.sin(P.pitch) * P.dist;
    S0.tx = c.x; S0.ty = cy; S0.tz = c.z; S0.fov = PH_LENS[P.lens][1]; S0.fogD = Math.max(70, P.dist * 1.6); S0.blur = P.blur ? 0.9 : 0;
  }
  function photoUI() {
    const P = photo; if (!P) return;
    $('ph-lens').textContent = tr('Objektiv {0} mm', PH_LENS[P.lens][0]); $('ph-filter').textContent = tr('Filter: {0}', tr(PH_FILT[P.filt][0]));
    $('ph-blur').textContent = tr('Ostrina: {0}', tr(P.blur ? 'avto' : 'vse')); $('ph-blur').classList.toggle('off', S.quality !== 'high');   // (the depth of field: the high quality's picture only)
    $('gl').style.filter = PH_FILT[P.filt][1]; $('ph-vig').classList.toggle('on', !!PH_FILT[P.filt][3]);
    $('s-photo').classList.toggle('hidden', P.hide);
  }
  function photoAct(a) {
    const P = photo; if (!P) return;
    if (a === 'ph-lens') P.lens = (P.lens + 1) % PH_LENS.length;
    else if (a === 'ph-filter') P.filt = (P.filt + 1) % PH_FILT.length;
    else if (a === 'ph-blur') P.blur = !P.blur;
    else if (a === 'ph-in' || a === 'ph-out') P.dist = Core.clamp(P.dist * (a === 'ph-in' ? 0.8 : 1.25), 2.5, 60);
    else if (a === 'ph-hide') P.hide = true;
    else if (a === 'ph-save') { photoSave(); return; }
    else if (a === 'ph-exit') { photoEnd(); return; }
    photoUI(); photoPose();
  }
  // the saved picture: drawn again sharper (Render.snapshot), the filter's steps on its pixels (as the CSS filter shows it), the film's vignette
  function photoSave() {
    const P = photo; photoPose();
    let cv = null; try { cv = Render.snapshot(P.car, replay ? replay.cam : S.camera, 1920); } catch (_) { }
    if (!cv) { toast(tr('Slike ni bilo mogoče narediti.'), 2400); return; }
    const F = PH_FILT[P.filt], x = cv.getContext('2d'), w = cv.width, h = cv.height;
    if (F[2].length) {
      const img = x.getImageData(0, 0, w, h), d = img.data;
      for (const [op, v] of F[2]) {
        if (op === 'con') { for (let i = 0; i < d.length; i += 4) { d[i] = (d[i] - 127.5) * v + 127.5; d[i + 1] = (d[i + 1] - 127.5) * v + 127.5; d[i + 2] = (d[i + 2] - 127.5) * v + 127.5; } continue; }
        const m = op === 'sat' ? [0.213 + 0.787 * v, 0.715 - 0.715 * v, 0.072 - 0.072 * v, 0.213 - 0.213 * v, 0.715 + 0.285 * v, 0.072 - 0.072 * v, 0.213 - 0.213 * v, 0.715 - 0.715 * v, 0.072 + 0.928 * v]
          : (u => [0.393 + 0.607 * u, 0.769 - 0.769 * u, 0.189 - 0.189 * u, 0.349 - 0.349 * u, 0.686 + 0.314 * u, 0.168 - 0.168 * u, 0.272 - 0.272 * u, 0.534 - 0.534 * u, 0.131 + 0.869 * u])(1 - v);   // (the CSS filters' own matrices)
        for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2]; d[i] = m[0] * r + m[1] * g + m[2] * b; d[i + 1] = m[3] * r + m[4] * g + m[5] * b; d[i + 2] = m[6] * r + m[7] * g + m[8] * b; }
      }
      x.putImageData(img, 0, 0);
    }
    if (F[3]) { const gr = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) / 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }
    const dt = new Date(), p2 = (n) => String(n).padStart(2, '0'), name = 'dirka-' + track.def.id + '-' + dt.getFullYear() + p2(dt.getMonth() + 1) + p2(dt.getDate()) + '-' + p2(dt.getHours()) + p2(dt.getMinutes()) + p2(dt.getSeconds()) + '.png';
    const done = (how) => { toast(how === 'share' ? tr('Slika je pripravljena za deljenje.') : tr('Slika shranjena: {0}', name), 2600); };
    cv.toBlob((b) => {
      if (!b) { toast(tr('Slike ni bilo mogoče shraniti.'), 2400); return; }
      window.__game.lastPhoto = { w, h, bytes: b.size, name, filter: F[0] };   // (the tests)
      const file = typeof File === 'function' ? new File([b], name, { type: 'image/png' }) : null;
      const down = () => { const url = URL.createObjectURL(b), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); done('file'); };
      if (file && matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: tr('Dirka · {0}', Lang.of(track.def, 'name')) }).then(() => done('share'), (e) => { if (!e || e.name !== 'AbortError') down(); });
      else down();
    }, 'image/png');
  }
  // the drag round the car, two fingers for the distance; a tap shows the hidden buttons again
  function photoPtr(e) {
    const P = photo; if (!P) return;
    const pd = () => { const a = [...P.ptrs.values()]; return a.length >= 2 ? Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) : 0; };
    if (e.type === 'pointerdown') { P.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); P.moved = 0; P.pinch = pd(); try { e.target.setPointerCapture(e.pointerId); } catch (_) { } return; }
    const q = P.ptrs.get(e.pointerId); if (!q) return;
    if (e.type === 'pointermove') {
      const dx = e.clientX - q.x, dy = e.clientY - q.y; q.x = e.clientX; q.y = e.clientY; P.moved += Math.abs(dx) + Math.abs(dy);
      if (P.ptrs.size >= 2) { const d = pd(); if (P.pinch > 0 && d > 0) P.dist = Core.clamp(P.dist * P.pinch / d, 2.5, 60); P.pinch = d; }
      else { P.yaw += dx * 0.008; P.pitch = Core.clamp(P.pitch + dy * 0.006, 0.02, 1.45); }
      photoPose(); return;
    }
    P.ptrs.delete(e.pointerId); P.pinch = pd();   // (up, cancel)
    if (P.hide && P.moved < 8) { P.hide = false; photoUI(); }
  }
  function photoKey(e) {
    const P = photo; if (!P || screen !== 'photo') return;
    const k = e.code, step = e.shiftKey ? 0.2 : 0.07;
    if (k === 'ArrowLeft' || k === 'ArrowRight') P.yaw += (k === 'ArrowLeft' ? -1 : 1) * step;
    else if (k === 'ArrowUp' || k === 'ArrowDown') P.pitch = Core.clamp(P.pitch + (k === 'ArrowUp' ? 1 : -1) * step * 0.6, 0.02, 1.45);
    else if (k === 'Equal' || k === 'NumpadAdd' || k === 'KeyW') P.dist = Core.clamp(P.dist * 0.9, 2.5, 60);
    else if (k === 'Minus' || k === 'NumpadSubtract' || k === 'KeyS') P.dist = Core.clamp(P.dist * 1.11, 2.5, 60);
    else if (k === 'Enter' || k === 'Space') { e.preventDefault(); photoSave(); return; }
    else if (k === 'Escape' || k === 'Backspace') { photoEnd(); return; }
    else if (k === 'KeyH') { P.hide = !P.hide; photoUI(); return; }
    else return;
    e.preventDefault(); photoPose();
  }
  // a pad in the photo mode: the right stick circles the car, the triggers nearer and farther (the buttons: the menus' A, B, the stick)
  function photoPad(dt) {
    const P = photo, G = Input.pad; if (!P || !G.on) return;
    if (G.rx || G.ry || G.rt > 0.05 || G.lt > 0.05) { P.yaw += (G.rx || 0) * dt * 1.8; P.pitch = Core.clamp(P.pitch - (G.ry || 0) * dt * 1.2, 0.02, 1.45); P.dist = Core.clamp(P.dist * Math.exp(((G.lt || 0) - (G.rt || 0)) * dt * 1.2), 2.5, 60); photoPose(); }
  }

  /* ---------------- career ---------------- */
  // the rivals' characters (Race opts.chars, Core.driverChar): in words
  const chrWords = (k) => { const d = Core.driverChar(k); return [d.agg >= 0.7 ? 'agresivna vožnja' : d.agg <= 0.35 ? 'previdna vožnja' : 'uravnotežena vožnja', d.err >= 0.55 ? 'popušča pod pritiskom' : d.err <= 0.2 ? 'mirna kri' : ''].filter(Boolean).map(w => tr(w)).join(', '); };
  const commName = (c) => String(c.name).split(/\s+/).pop();   // (the commentator: the surname)
  function buildCareerScreen() {
    const on = inCareer(), C = Core.CAREER, rv = career && career.rival;
    $('career-rival').textContent = !career ? '' : rv ? tr('Stalni tekmec: {0} ({1}) · ti {2}, tekmec {3}.', Core.DRIVER_NAMES[rv.k], chrWords(rv.k), rv.me, rv.him) : tr('Stalni tekmec: izbran bo po prvi dirki v karieri.');
    $('career-money').textContent = career ? eur(career.money) : eur(C.start);
    $('career-info').textContent = (career ? tr('Dirk: {0}, zmag: {1}, zasluženo skupaj {2}. ', career.races, career.wins, eur(career.earned)) : '') +
      tr('V karieri z dirkami, prvenstvi in kronometri služiš denar: več za boljše mesto, daljšo dirko in težje nasprotnike, še več za najhitrejši krog, prvo štartno mesto, naslov prvaka in medalje. ') +
      tr('Z denarjem kupuješ avte in nadgradnje. Začneš z {0} in avtom {1}.', eur(C.start), Core.MODELS.find(m => m.id === C.car0).name) + (on ? '' : career ? tr(' Kariera je zdaj izklopljena: voziš prosto, z vsemi avti.') : '');
    $('career-garage').innerHTML = Core.MODELS.map(m => { const own = career && career.cars.includes(m.id);
      return '<div class="gcar' + (own ? ' own' : '') + '"><b>' + esc(m.name) + '</b>' + (own ? tr('v garaži') : '<span class="pr">' + eur(C.car[m.id] || 0) + '</span>') + '</div>'; }).join('');
    $('career-toggle').textContent = tr(!career ? 'Začni kariero' : on ? 'Izklopi kariero' : 'Nadaljuj kariero');
    $('career-reset').classList.toggle('off', !career); $('career-reset').textContent = tr('Nova kariera');
  }
  let careerResetT = 0;
  function careerToggle() {
    if (!career) career = careerNew(); else career.on = !career.on;
    careerSave();
    if (inCareer() && !owned(Core.MODELS[S.car].id)) { S.car = Core.MODELS.findIndex(m => m.id === career.cars[0]); save(); }   // (a car from the garage)
    toast(inCareer() ? tr('Kariera: {0} na računu.', eur(career.money)) : tr('Kariera je izklopljena, voziš prosto.'), 2600);
    buildCareerScreen(); refreshSegs();
  }
  // the reward of a race / qualifying / time trial in the career: added now; the line for the results screen ('' outside the career)
  function careerPay(sum, what) {
    if (!inCareer() || !(sum > 0) || (mp && mp.race)) return '';
    career.money += sum; career.earned += sum; careerSave();
    if (career.earned >= 100000) achGet('rich');
    return tr(' {0}: +{1} (imaš {2}).', tr(what), eur(sum), eur(career.money));
  }
  function carBuy() {
    const M = Core.MODELS[S.car], pr = Core.CAREER.car[M.id] || 0;
    if (!inCareer() || owned(M.id)) return;
    if (career.money < pr) { toast(tr('Premalo denarja: {0} stane {1}, imaš {2}. Zasluži ga z dirkami.', M.name, eur(pr), eur(career.money)), 3600); return; }
    career.money -= pr; career.cars.push(M.id); career.upg[M.id] = upgNorm(null); careerSave();
    toast(tr('Kupil si {0} za {1}. Ostane {2}.', M.name, eur(pr), eur(career.money)), 3200); Sfx.beep(880, 0.12, 0.1);
    buildCarScreen();
  }

  /* ---------------- track select ---------------- */
  function drawTrackMini(cv, T) {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(60, Math.round(r.width * dpr)), h = Math.max(40, Math.round(r.height * dpr));
    cv.width = w; cv.height = h; const g = cv.getContext('2d');
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    for (let i = 0; i < T.N; i++) { a = Math.min(a, T.px[i]); b = Math.max(b, T.px[i]); c = Math.min(c, T.pz[i]); d = Math.max(d, T.pz[i]); }
    // a long point-to-point road (running north) is drawn turned on its side: the climb goes left -> right across the wide card
    const rot = T.open && (d - c) > (b - a) * 1.3 && w > h * 1.3;
    const X = rot ? (i) => -T.pz[i] : (i) => T.px[i], Y = rot ? (i) => T.px[i] : (i) => T.pz[i];
    if (rot) { const a0 = a, b0 = b; a = -d; b = -c; c = a0; d = b0; }
    const pad = 10 * dpr, sc = Math.min((w - pad * 2) / (b - a), (h - pad * 2) / (d - c)), ox = (w - (b - a) * sc) / 2 - a * sc, oz = (h - (d - c) * sc) / 2 - c * sc;
    const n = T.open ? T.N - 1 : T.N;   // open road: no closing segment
    const path = () => { g.beginPath(); for (let i = 0; i <= n; i++) { const k = i % T.N, x = X(k) * sc + ox, y = Y(k) * sc + oz; if (i) g.lineTo(x, y); else g.moveTo(x, y); } if (!T.open) g.closePath(); };
    g.lineJoin = 'round'; g.lineCap = 'round'; path(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 7 * dpr; g.stroke(); path(); g.strokeStyle = '#fff'; g.lineWidth = 3.2 * dpr; g.stroke();
    overpass(g, T, (i) => [X(i) * sc + ox, Y(i) * sc + oz], sc, 7 * dpr, 3.2 * dpr, 'rgba(0,0,0,.85)');
    if (T.open) {   // checkpoints (yellow ticks) and the finish (chequered square)
      g.strokeStyle = '#ffc629'; g.lineWidth = 2.4 * dpr;
      for (const s of T.cpS) { const i = T.idx(s), x = X(i) * sc + ox, y = Y(i) * sc + oz, nx = rot ? -T.nz[i] : T.nx[i], nz = rot ? T.nx[i] : T.nz[i]; g.beginPath(); g.moveTo(x - nx * 5 * dpr, y - nz * 5 * dpr); g.lineTo(x + nx * 5 * dpr, y + nz * 5 * dpr); g.stroke(); }
      chequer(g, X(T.finishIdx) * sc + ox, Y(T.finishIdx) * sc + oz, 4.5 * dpr);
    }
    const si = T.startIdx; g.fillStyle = '#e63b2e'; g.beginPath(); g.arc(X(si) * sc + ox, Y(si) * sc + oz, 4 * dpr, 0, 6.3); g.fill();
  }
  // a crossing on two levels (Suzuka's bridge): the upper leg drawn once more over the lower one, its dark edges cutting the lower line.
  // at(i) -> [x, y] on the canvas, sc: pixels per metre, wOut / wIn: the widths of the dark edge and the white road
  function overpass(g, T, at, sc, wOut, wIn, dark) {
    for (const c of T.cross) {
      const m = Math.ceil(wOut * 1.1 / sc / T.ds), u = Math.round(c.up), line = () => { g.beginPath(); for (let k = -m; k <= m; k++) { const p = at((u + k + T.N) % T.N); if (k > -m) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } };
      g.lineCap = 'butt'; line(); g.strokeStyle = dark; g.lineWidth = wOut; g.stroke(); line(); g.strokeStyle = '#fff'; g.lineWidth = wIn; g.stroke(); g.lineCap = 'round';
    }
  }
  function chequer(g, x, y, r) {   // small chequered flag square centred on x, y
    g.fillStyle = '#111'; g.fillRect(x - r - 1, y - r - 1, 2 * r + 2, 2 * r + 2); g.fillStyle = '#fff';
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if ((a + b) % 2 === 0) g.fillRect(x - r + a * r * 2 / 3, y - r + b * r * 2 / 3, r * 2 / 3, r * 2 / 3);
  }
  function buildTrackScreen() {
    const list = $('track-list'), sd = Core.TRACKS.find(d => d.id === S.track);
    $('cmp-row').classList.toggle('off', !(sd && sd.pit && !isTT(sd)));   // (tyres: the circuits with pits)
    let sepDone = false;
    list.innerHTML = Core.TRACKS.filter(d => !d.variantOf).sort((a, b) => !!a.test - !!b.test).map(d0 => { const d = pkRoadDef(d0), T = getTrack(d.id), r = rec(d.id), sel = d.id === S.track ? ' sel' : '';
      const climb = (d.realKm ? tr(' (pravih {0} km)', Lang.dec(d.realKm)) : '') + (d.alt ? (d.alt[1] < d.alt[0] ? tr(' · spust {0} m', numDot(d.alt[0] - d.alt[1])) : tr(' · vzpon {0} m', numDot(d.alt[1] - d.alt[0]))) : '');
      const md = modeOf(d);
      let meta = md === 'traffic' ? kmTxt(T.raceLen, 1) + ' km' + climb + tr(' · dvoboj z enim tekmecem v prometu') + (r.bestRace ? tr(' · rekord {0}', fmt(r.bestRace, true)) : '') :
        md === 'police' ? kmTxt(T.raceLen, 1) + ' km' + climb + tr(' · beg pred policijo') + (r.bestRace ? tr(' · najhitrejši pobeg {0}', fmt(r.bestRace, true)) : '') :
        upRace(d) ? kmTxt(T.raceLen, 1) + ' km' + climb + tr(' · dirka z {0} tekmeci', NUM_AI) + (r.bestRace ? tr(' · rekord {0}', fmt(r.bestRace, true)) : '') : isTT(d) ? kmTxt(T.raceLen, 1) + ' km' + climb + (isRally(d) && d.bumps ? ' · ' + jumpWord(d.bumps.length) : '') + ' · ' + cpWord(T.cpS.length) + tr(' · kronometer') + (r.bestTime ? tr(' · rekord {0}', fmt(r.bestTime, true)) : '')
        : kmTxt(T.len, 2) + ' km · ' + tr('{0} ovinkov', T.corners.length) + ' · ' + lapWord(lapsOf(d)).toLowerCase() + (r.bestLap ? tr(' · rekord {0}', fmt(r.bestLap, true)) : '');
      if (wetRec(d)) meta = meta.replace(tr(' · kronometer'), tr(' · kronometer v dežju'));
      if (isTT(d) && medalOf(d, r.bestTime) >= 0) meta += ' ' + MEDAL_ICON[medalOf(d, r.bestTime)];
      const desc = '<div class="tmeta">' + meta + '</div>' + (pkIs(d) ? pkTrackTag(r, d) : '') + '<div class="tdesc">' + (Lang.of(d, 'desc') || '').replace(/\b(\d{1,3})(\d{3}) m\b/g, (m, a, b) => numDot(+(a + b)) + '\u00a0m') + '</div>';   // 2862 m -> 2.862 m (as on the HUD)
      const sep = d0.test && !sepDone ? (sepDone = true, '<div class="track-sep">' + tr('Za izbris · samo za testiranje') + '</div>') : '';   // (the made-up tracks kept for testing: after the real ones, under their own heading)
      if (pkRoads(d0).length) return sep + pkRoadCard(d0, d, sel, desc);   // (Pikes Peak: the road, asphalt or the historic gravel)
      if (d.modes) return sep + '<div class="track-card modes' + sel + '" data-track="' + d.id + '" role="button" tabindex="0"><canvas></canvas><div class="tc-head"><h3>' + Lang.of(d, 'name') + '</h3>' +
        '<div class="seg tc-mode" data-set="mode" role="group" aria-label="' + tr('Način vožnje') + '">' + d.modes.map(k => '<button data-v="' + k + '" class="' + (md === k ? 'sel' : '') + '">' + tr(MODE_NAME[k]) + '</button>').join('') + '</div></div>' + desc + '</div>';
      return sep + '<button class="track-card' + sel + '" data-track="' + d.id + '"><canvas></canvas><h3>' + Lang.of(d, 'name') + '</h3>' + desc + '</button>'; }).join('');
    requestAnimationFrame(() => list.querySelectorAll('.track-card').forEach(el => drawTrackMini(el.querySelector('canvas'), getTrack(el.dataset.track))));
    fitSegs();   // (the tyres' row comes and goes with the track)
  }
  // a track loaded: its world built and its shaders compiled while the loading screen is up. The title demo on it is made only when a menu
  // shows it (demoOn): a race started from the menus does not wait for its cars to drive their first seconds
  function ensureTrack(id, cb) {
    if (track && track.def.id === id && !Render.worldStale) { cb(); return; }   // (the same track: rebuilt only when it paints itself for the season and that changed: Vršič)
    $('ld-msg').textContent = tr('Nalagam progo {0}…', Lang.of(Core.TRACKS.find(d => d.id === id), 'name') || '');
    $('loading').classList.remove('off');
    setTimeout(() => {
      const t0 = performance.now();
      track = getTrack(id);
      Render.buildWorld(track, S.quality === 'retro' ? 0.8 : 1);
      Render.precompile();
      demo = null;
      mm.img = null; mm.w = 0;
      loadMs = performance.now() - t0;
      $('loading').classList.add('off');
      cb();
    }, 40);
  }
  let loadMs = 0;   // (tests: how long the last track took to load)
  // the title demo: ten cars racing on the loaded track behind the menus, their first seconds driven at once
  function demoMake(sec) {
    demo = new Core.Race(track, { numAI: 10, noPlayer: true, difficulty: 2, laps: 9999, seed: 11, phys: physOf(), rain: demoRain() });
    demo.start(); for (let i = 0; i < 120 * sec; i++) demo.step(STEP);
    demoTarget = null; demoSwitch = 0;   // the title camera picks a car of the new demo right away (not one left over from the previous track)
  }
  const demoOn = () => { if (!demo || demo.track !== track) demoMake(4); return demo; };
  function demoShow() { demoAt = demoOn(); Render.attachRace(demoAt); }   // (the demo behind the menus again)

  /* ---------------- ghost of the best run (time trials) and of the best flying lap (circuits) ---------------- */
  // While a time trial runs, the player's car pose is sampled every GH_DT s of race time (between two physics steps, so exactly on the
  // grid). A run that sets a new personal best is stored with the record (per track and physics, key tdgp-ghost-<record key>) and
  // replays as a see-through car (Render.setGhost) in the next runs, on the race clock. Only drawn: it never touches the race.
  // On a circuit every flying lap is sampled the same way on the lap clock (from the line: the qualifying lap, a race's laps from the
  // second on); the best one is kept (lap: 1) and replays on the lap clock during the next flying laps, from the next lap on.
  // Stored: { v, dt, n, t (the run's time), car, color, stripe, lap?, q0 [x, y, z in cm], d: base64 of Int16 [n x 7] }: per sample the
  // x, y, z steps from the previous sample (cm), heading, steer, pitch and roll (1e-4 rad)
  const GH_DT = 0.1, GH_MAX = 12000, GH_CH = 7, GH_V = 1, GH_BYTES = 600000;   // sample interval (s), max samples (20 min), channels, format, max stored size
  const ghKey = (id) => 'tdgp-ghost-' + recKey(id);
  let ghRec = null, ghPlay = null, ghLap = null, ghFr = null;   // (ghFr: a friend's shared ghost of this track { name, t, g })   // the run being recorded { n, f: Float32Array }, the best run being replayed { n, t, M, color, stripe, f, lap }, a circuit's lap being recorded { n, f, t0, lap, on }
  function ghPose(P, f, k, a) {   // the car's pose at a (0 = previous physics step, 1 = this one) into f at sample k
    const o = k * GH_CH, lat = clamp(P.w * P.speed, -16, 16);
    f[o] = P.px + (P.x - P.px) * a; f[o + 1] = P.py + (P.y - P.py) * a; f[o + 2] = P.pz + (P.z - P.pz) * a; f[o + 3] = P.ph + Core.wrapPi(P.h - P.ph) * a;
    f[o + 4] = P.delta || 0; f[o + 5] = P.air ? Math.atan2(P.vy, Math.max(Math.abs(P.vl), 6)) * 0.8 : Math.atan(P.gradeNow || 0); f[o + 6] = clamp(-lat * 0.0042, -0.06, 0.06);
  }
  function ghSample(P) {   // after each physics step of a time trial, until the finish
    if (!ghRec || ghRec.done || race.state !== 'racing' || phase !== 'racing') return;
    const t1 = race.time, t0 = t1 - STEP;
    while (ghRec.n < GH_MAX && ghRec.n * GH_DT <= t1 + 1e-9) { ghPose(P, ghRec.f, ghRec.n, clamp((ghRec.n * GH_DT - t0) / STEP, 0, 1)); ghRec.n++; }
    if (P.finished) { if (ghRec.n < GH_MAX) { ghPose(P, ghRec.f, ghRec.n, 1); ghRec.n++; } ghRec.done = true; }   // (the last sample: just past the line)
  }
  function ghEncode(G) {
    const n = G.n, f = G.f, a = new Int16Array(n * GH_CH), q0 = [Math.round(f[0] * 100), Math.round(f[1] * 100), Math.round(f[2] * 100)], q = q0.slice();
    const i16 = (v) => Math.max(-32767, Math.min(32767, Math.round(v)));
    for (let k = 0; k < n; k++) { const o = k * GH_CH;
      for (let c = 0; c < 3; c++) { const v = Math.round(f[o + c] * 100), d = v - q[c]; if (Math.abs(d) > 32767) return null; a[o + c] = d; q[c] = v; }   // (a jump of over 327 m: not a drive)
      a[o + 3] = i16(Core.wrapPi(f[o + 3]) * 1e4); for (let c = 4; c < 7; c++) a[o + c] = i16(f[o + c] * 1e4); }
    const b = new Uint8Array(a.buffer); let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return { q0, d: btoa(s) };
  }
  function ghWrite(id, G, time, lap) {   // store a recorded run in place of the old one (a run too long or too big is not kept)
    try { localStorage.removeItem(ghKey(id)); } catch (_) { }
    if (!G || G.n < 2) return;
    const M = Core.MODELS[S.car], e = ghEncode(G); if (!e) return;
    const j = JSON.stringify({ v: GH_V, dt: GH_DT, n: G.n, t: time, car: M.id, color: PLAYER_COLORS[S.color], stripe: race.player.stripe !== false, lap: lap ? 1 : undefined, q0: e.q0, d: e.d });
    if (j.length > GH_BYTES) return;
    try { localStorage.setItem(ghKey(id), j); } catch (_) { }
  }
  function ghSave(id, time) {   // a new personal best: store the recorded run (the old ghost goes with its record)
    const G = ghRec; ghRec = null;
    if (G && G.done) ghWrite(id, G, time, false); else try { localStorage.removeItem(ghKey(id)); } catch (_) { }
  }
  // a stored ghost ({ v, dt, n, t, car, color, stripe, lap?, q0, d }): checked and unpacked to its poses (null: not a ghost of this game)
  function ghParse(o) {
    if (!isObj(o) || o.v !== GH_V || o.dt !== GH_DT || !posNum(o.t) || !(o.n >= 2 && o.n <= GH_MAX) || typeof o.d !== 'string' || !Array.isArray(o.q0) || o.q0.length !== 3) return null;
    let b; try { b = atob(o.d); } catch (_) { return null; }
    if (b.length !== o.n * GH_CH * 2) return null;
    const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    const a = new Int16Array(u.buffer), f = new Float32Array(o.n * GH_CH), q = o.q0.map(v => +v || 0);
    for (let k = 0; k < o.n; k++) { const i = k * GH_CH; for (let c = 0; c < 3; c++) { q[c] += a[i + c]; f[i + c] = q[c] / 100; } for (let c = 3; c < 7; c++) f[i + c] = a[i + c] / 1e4; }
    return { n: o.n, t: o.t, M: modelById(o.car), color: typeof o.color === 'number' ? o.color : PLAYER_COLORS[0], stripe: o.stripe !== false, f, lap: o.lap === 1 };
  }
  function ghLoad(id, best, lap) {   // the stored best run of this track and physics, if it is the run of the current record (lap: a circuit's best flying lap)
    let o = null; try { o = JSON.parse(localStorage.getItem(ghKey(id)) || 'null'); } catch (_) { return null; }
    if (!isObj(o) || (lap ? o.lap !== 1 : o.lap != null || !(Math.abs(o.t - best) < 0.0005))) return null;
    return ghParse(o);
  }
  function ghStart() {   // newRace: record every time trial and every flying lap on a circuit (never online); replay the best one when there is one
    const on = mp && mp.race, tt = race.timeTrial && !on, circ = !race.timeTrial && !on;
    ghRec = tt ? { n: 0, f: new Float32Array(GH_MAX * GH_CH), done: false } : null;
    ghLap = circ ? { n: 0, f: new Float32Array(GH_MAX * GH_CH), t0: 0, lap: -1, on: false } : null;
    const R0 = tt ? rec(track.def.id) : null;
    ghPlay = R0 && R0.bestTime ? ghLoad(track.def.id, R0.bestTime) : circ ? ghLoad(track.def.id, 0, true) : null;
    const F = tt || circ ? ghFriend(track.def.id) : null; ghFr = F && F.g.lap === !tt ? F : null;   // (a friend's time trial run in a time trial, a friend's lap on a circuit's flying laps)
    Render.setGhost(null, true); Render.setGhostF(null, true);
  }
  function ghLapSample(P) {   // a circuit, after each physics step: the flying lap under way (see ghStart)
    const G = ghLap; if (!G || race.state !== 'racing') return;
    if (P.lap !== G.lap) {   // the line: a lap is over, the next one starts at P.lapStart
      if (G.on && P.lapTimes.length) ghLapEnd(G, P, P.lapTimes[P.lapTimes.length - 1]);
      G.lap = P.lap; G.n = 0; G.t0 = P.lapStart; G.on = !P.finished && P.lap >= (race.quali ? 1 : 2);   // (a flying lap: qualifying's, a race's from the second)
    }
    if (!G.on) return;
    const t1 = race.time, tp = t1 - STEP;
    while (G.n < GH_MAX && G.t0 + G.n * GH_DT <= t1 + 1e-9) { ghPose(P, G.f, G.n, clamp((G.t0 + G.n * GH_DT - tp) / STEP, 0, 1)); G.n++; }
  }
  function ghLapEnd(G, P, t) {   // a flying lap is over: the best one so far (the first, or faster than the ghost) is stored and replays from the next lap on
    if (G.n < GH_MAX) { ghPose(P, G.f, G.n, 1); G.n++; }   // (the last sample: just past the line)
    if (G.n < 2 || (ghPlay && ghPlay.t <= t)) return;
    const f = G.f.slice(0, G.n * GH_CH);
    ghPlay = { n: G.n, t, M: Core.MODELS[S.car], color: PLAYER_COLORS[S.color], stripe: P.stripe !== false, f, lap: true };
    ghWrite(track.def.id, { n: G.n, f }, t, true);
  }
  const _gp = { M: null, color: 0, stripe: true, x: 0, y: 0, z: 0, h: 0, d: 0, p: 0, r: 0, op: 1 }, _gpF = Object.assign({ tag: '' }, _gp);
  function ghAt(G, alpha, g) {   // the ghost G where its run was at this moment of the race clock (a circuit's lap: of the lap clock), into g; null while it is not on
    const P = race.player;
    if (G.lap && (P.finished || !(P.lap >= (race.quali ? 1 : 2)))) return null;   // (a circuit: only while a flying lap is under way)
    const t = Math.max(0, race.time - (1 - clamp(alpha, 0, 1)) * STEP - (G.lap ? P.lapStart : 0)), u = t / GH_DT, k = Math.min(G.n - 2, Math.floor(u)), a = clamp(u - k, 0, 1), end = (G.n - 1) * GH_DT;
    if (t > end + 0.6) return null;   // the run is over (it ends just past the line)
    const f = G.f, o = k * GH_CH, n2 = o + GH_CH, L = (c) => f[o + c] + (f[n2 + c] - f[o + c]) * a;
    g.M = G.M; g.color = G.color; g.stripe = G.stripe;
    g.x = L(0); g.y = L(1); g.z = L(2); g.h = f[o + 3] + Core.wrapPi(f[n2 + 3] - f[o + 3]) * a; g.d = L(4); g.p = L(5); g.r = L(6);
    const dd = Math.hypot(g.x - P.x, g.z - P.z);
    g.op = clamp((dd - 1.5) / 5, 0.3, 1) * clamp(t / 0.4, 0, 1) * clamp((end + 0.6 - t) / 0.6, 0, 1);   // fainter right on top of the player; fades in at the start and out past the line
    return g;
  }
  function ghShow(alpha) {   // every drawn frame of a race: the player's own best run and a friend's shared one
    const on = !!race && (phase === 'racing' || phase === 'finish' || phase === 'done') && race.state !== 'grid';   // (Pikes Peak: its own setting, Duh, picks the ghost)
    Render.setGhost(on && ghPlay && (S.ghost || pk.on) ? ghAt(ghPlay, alpha, _gp) : null);
    if (on && S.ghost && ghFr) _gpF.tag = ghFr.name + ' ' + fmt(ghFr.t);
    Render.setGhostF(on && S.ghost && ghFr ? ghAt(ghFr.g, alpha, _gpF) : null);
  }

  /* ---------------- sharing: the profile (all the game keeps: settings, records, career, championship, achievements, ghosts) and a ghost ----------------
     A file (the phone's share sheet, else a download), brought back with the file chooser; a ghost also as a link (#duh=...: the ghost packed
     with deflate, base64url), which opens the game and brings the ghost in. A friend's ghost (one per track, tdgp-fghost-<track>) drives with
     the player's own in that track's time trial or on its flying laps, orange with the friend's name over it. */
  function saveFile(name, text, title) {   // -> 'share' | 'file' | 'abort'
    const type = 'application/json', b = new Blob([text], { type }), file = typeof File === 'function' ? new File([b], name, { type }) : null;
    const down = () => { const url = URL.createObjectURL(b), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); return 'file'; };
    if (file && matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title }).then(() => 'share', (e) => (e && e.name === 'AbortError' ? 'abort' : down()));
    return Promise.resolve(down());
  }
  function pickFile(cb) {   // a file the player picks: its text to cb
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.style.display = 'none'; document.body.appendChild(inp);
    inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
      if (f.size > 8e6) { toast(tr('Datoteka je prevelika.'), 2600); return; }
      f.text().then(cb, () => toast(tr('Datoteke ni bilo mogoče prebrati.'), 2600)); });
    inp.click();
  }
  const b64u = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  async function packStr(s) { if (typeof CompressionStream !== 'function') return null; return b64u(new Uint8Array(await new Response(new Blob([s]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer())); }
  async function unpackStr(p) { const b = atob(p.replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text(); }
  const profKeys = () => { const a = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^tdgp-/.test(k) && k !== 'tdgp-noadapt') a.push(k); } return a; };
  function profExport() {
    const data = {}; for (const k of profKeys()) data[k] = localStorage.getItem(k);
    const d = new Date(), p2 = (x) => String(x).padStart(2, '0'), name = 'apex-racing-profil-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '.json';
    return saveFile(name, JSON.stringify({ app: 'apex-racing', kind: 'profile', v: 1, date: Date.now(), name: S.name, data }), 'APEX Racing').then((how) => { if (how !== 'abort') toast(how === 'share' ? tr('Profil je pripravljen za deljenje.') : tr('Profil je shranjen v datoteko {0}.', name), 3400); return how; });
  }
  function profImport(text) {   // a profile file: checked, asked, the saved game replaced by it, the game started again
    let o = null; try { o = JSON.parse(text); } catch (_) { }
    if (!isObj(o) || o.app !== 'apex-racing' || o.kind !== 'profile' || o.v !== 1 || !isObj(o.data) || !Object.keys(o.data).every(k => /^tdgp-[\w@.-]{1,80}$/.test(k) && typeof o.data[k] === 'string')) { toast(tr('To ni profil igre APEX Racing.'), 3200); return false; }
    if (!confirm(tr('Uvozim profil {0} z dne {1}? Tvoj trenutni profil (nastavitve, rekordi, kariera, dosežki in duhovi) se zamenja.', cleanName(o.name) || '?', new Date(posNum(o.date) ? o.date : Date.now()).toLocaleDateString(Lang.locale)))) return false;
    const old = {}; for (const k of profKeys()) old[k] = localStorage.getItem(k);
    try { for (const k in old) localStorage.removeItem(k); for (const k in o.data) localStorage.setItem(k, o.data[k]); }
    catch (_) { try { for (const k of profKeys()) localStorage.removeItem(k); for (const k in old) localStorage.setItem(k, old[k]); } catch (e) { } toast(tr('Profila ni bilo mogoče shraniti (premalo prostora).'), 3600); return false; }   // (the old one back)
    try { localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-defaults-v3', '1'); } catch (_) { }
    stHold = true; location.reload(); return true;
  }
  function ghOwn(id) {   // the player's ghost of this track (the current physics, weather and way to drive) as it is shared
    let o = null; try { o = JSON.parse(localStorage.getItem(ghKey(id)) || 'null'); } catch (_) { }
    return ghParse(o) ? { app: 'apex-racing', kind: 'ghost', v: 1, track: id, name: S.name, time: o.t, ghost: o } : null;
  }
  function ghFriend(id) { let o = null; try { o = JSON.parse(localStorage.getItem('tdgp-fghost-' + id) || 'null'); } catch (_) { } const g = isObj(o) ? ghParse(o.ghost) : null; return g ? { name: cleanName(o.name) || tr('Prijatelj'), t: g.t, g } : null; }
  async function ghShare(id, how) {   // how: 'link' (the phone's share sheet or the clipboard; a file when too long) or 'file'
    const G = ghOwn(id); if (!G) return;
    const text = JSON.stringify(G), name = 'duh-' + id + '-' + fmt(G.time).replace(/[:.]/g, '-') + '.json', title = tr('Duh · {0} · {1}', Lang.of(Core.TRACKS.find(d => d.id === id), 'name'), fmt(G.time));
    if (how === 'link') {
      let link = null; try { const p = await packStr(text); if (p && p.length <= 16000) link = location.origin + location.pathname + '#duh=' + p; } catch (_) { }
      window.__game.ghostLink = link;   // (the tests)
      if (link) {
        if (matchMedia('(pointer: coarse)').matches && navigator.share) { try { await navigator.share({ title, url: link }); return 'share'; } catch (e) { if (e && e.name === 'AbortError') return 'abort'; } }
        try { await navigator.clipboard.writeText(link); toast(tr('Povezava do duha je kopirana: pošlji jo prijatelju.'), 3400); return 'copy'; } catch (_) { }
      }
      toast(tr(link ? 'Povezave ni bilo mogoče kopirati: duh je shranjen v datoteko.' : 'Duh je za povezavo predolg: shranjen je v datoteko.'), 3400);
    }
    const r = await saveFile(name, text, title); if (r === 'file' && how !== 'link') toast(tr('Duh je shranjen v datoteko {0}.', name), 3400); return r;
  }
  function ghImport(text) {   // a friend's ghost (a file or a link): kept for its track, the track chosen
    let o = null; try { o = JSON.parse(text); } catch (_) { }
    const d = isObj(o) && o.app === 'apex-racing' && o.kind === 'ghost' && o.v === 1 ? Core.TRACKS.find(x => x.id === o.track) : null, g = d ? ghParse(o.ghost) : null;
    if (!g) { toast(tr('To ni duh igre APEX Racing.'), 3200); return false; }
    const name = cleanName(o.name) || tr('Prijatelj');
    try { localStorage.setItem('tdgp-fghost-' + d.id, JSON.stringify({ name, time: g.t, ghost: o.ghost })); } catch (_) { toast(tr('Duha ni bilo mogoče shraniti (premalo prostora).'), 3200); return false; }
    S.track = d.id; if (d.modes) S.mode = g.lap ? 'race' : 'tt'; save(); refreshSegs();
    toast(tr(g.lap ? 'Duh igralca {0} na progi {1} ({2}): dirkaj proti njemu na letečem krogu.' : 'Duh igralca {0} na progi {1} ({2}): dirkaj proti njemu v kronometru.', name, Lang.of(d, 'name'), fmt(g.t)), 5200);
    if (screen === 'board') { boardId = d.id; buildBoardScreen(); }
    return true;
  }
  async function ghHash() {   // the game opened with a ghost's link
    const m = /[#&]duh=([\w-]+)/.exec(location.hash); if (!m) return;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { }
    let text = null; try { text = await unpackStr(m[1]); } catch (_) { }
    if (!text || !ghImport(text)) toast(tr('Povezava do duha ni veljavna.'), 3200);
  }

  /* ---------------- qualifying (Kvalifikacije) ---------------- */
  // Before a race on a circuit (setting S.quali; not online, not a time trial) the player drives one flying lap alone: a standing start on
  // the straight before the line (Track.qualiBack), the lap timed from the line to the line. Each rival drives the same lap alone in a race
  // of its own with the seed, weather, difficulty and physics of the race to come (Race opts aiOrder [k], qualiBack), simulated a little
  // between the frames while the player drives (about the work of their race; the rest when the player is back at the line). The times
  // make the grid: the fastest on pole, the rivals in the order of their times (Race opts playerGrid, aiOrder). "Preskoči kvalifikacije"
  // (pause menu) goes straight to the race: the usual grid, the player 12th.
  let qual = null;   // { id, cr (a championship round, or -1), seed, rain, nAI, back, diff, phys, sims: { k, r, t, times }, lap, lapShown, newRec, wait, res: { grid, order, rows } }
  const qualiOn = (d) => !!S.quali && !isTT(d) && !d.open && !(mp && mp.race);   // (a race up an open road, Vršič: no lap to fly, straight to the grid)
  function startRace() { qual = null; pkF.fresh = true; newRace(qualiOn(track.def) ? 'quali' : undefined); }   // the menus' Start: a new qualifying first, when it is on
  function qsimStep(Q, ms) {   // the rivals' laps, for about ms milliseconds; true when all are done
    if (Q.phys !== physOf()) { Q.phys = physOf(); Q.sims = null; }   // (the physics changed in the pause menu: their laps again with it)
    const G = Q.sims || (Q.sims = { k: 0, r: null, t: 0, times: [] }), cap = track.len / 8 + 120, t0 = performance.now();
    while (G.k < Q.nAI) {
      if (!G.r) { G.r = new Core.Race(track, { numAI: Q.nAI, aiOrder: [G.k], noPlayer: true, laps: 1, qualiBack: Q.back, difficulty: Q.diff, phys: Q.phys, rain: Q.rain, seed: Q.seed, damage: 0 }); G.r.start(); G.t = 0; }
      const c = G.r.cars[0];
      for (let n = 0; n < 240 && !c.finished && G.t < cap; n++) { G.r.step(STEP); G.t += STEP; }
      if (c.finished || G.t >= cap) { G.times[G.k] = { k: G.k, name: c.name, car: c.m.name, color: c.color, time: c.finished && c.lapTimes[0] > 0 ? c.lapTimes[0] : Infinity, sec: !c.finished ? null : c.sec ? c.sec.best.slice() : c.secPB ? c.secPB.slice() : null }; G.k++; G.r = null; }   // (a lap never finished: last)
      if (performance.now() - t0 > ms) break;
    }
    return G.k >= Q.nAI;
  }
  function qualiShow() {   // all the laps are in: the grid, and the qualifying results on the results screen
    const Q = qual; Q.wait = false;
    const me = { me: true, name: tr('Ti'), car: race.player.m.name, color: PLAYER_COLORS[S.color], time: Q.lap };
    const rows = Q.sims.times.slice(0, Q.nAI).concat([me]).sort((a, b) => a.time - b.time), g = rows.indexOf(me) + 1, best = rows[0].time;
    Q.res = { grid: g, order: rows.filter(r => !r.me).map(r => r.k), rows };
    $('res-head').classList.remove('tt'); $('res-tt').classList.add('off');
    $('res-table').querySelector('thead').innerHTML = '<tr><th>#</th><th>' + tr('Voznik') + '</th><th>' + tr('Avto') + '</th><th>' + tr('Čas') + '</th><th>' + tr('Zaostanek') + '</th></tr>';
    $('res-pos').textContent = Lang.ord(g);
    $('res-title').textContent = tr(g === 1 ? 'Najboljši štartni položaj!' : 'Kvalifikacije');
    $('res-sub').textContent = tr('Tvoj krog {0}', fmt(Q.lap, true)) + (Q.newRec ? tr(' (nov rekord proge)') : '') + tr('. Na štartu boš {0} od {1}.', Lang.ord(g), rows.length) + (race.champ ? tr(' {0}, dirka {1}/{2}.', Lang.of(champDef(), 'name'), race.champ.round + 1, race.champ.n) : '');
    $('res-table').querySelector('tbody').innerHTML = rows.map((r, i) => '<tr class="' + (r.me ? 'me' : '') + '"><td>' + (i + 1) + '</td><td><span class="dot" style="background:' + hexCss(r.color) + '"></span>' + esc(r.name) + '</td><td>' + esc(r.car) + '</td><td>' +
      (isFinite(r.time) ? fmt(r.time, true) : '–') + '</td><td>' + (i && isFinite(r.time) ? '+' + fmt(r.time - best, true) : '') + '</td></tr>').join('');
    $('res-restart').dataset.act = 'quali-go'; $('res-restart').textContent = tr('Na štart');
    if (g === 1 && !Q.paid) { Q.paid = true; st.poles++; achGet('pole'); stSave(); $('res-sub').textContent += careerPay(Core.CAREER.pole, 'Za prvo štartno mesto'); }   // (once per qualifying)
    Comm.say(g === 1 ? 'pole' : 'qualiGrid', { grid: Comm.ordinal(g) }, 4);
    showScreen('results');
  }
  function finishQuali() {   // back at the line: the lap (a lap record too), then the grid as soon as the rivals' laps are all in (frame())
    const Q = qual, R0 = rec(track.def.id); secSave();
    Q.lap = race.player.lapTimes[0] > 0 ? race.player.lapTimes[0] : Infinity;
    Q.newRec = Q.lap < Infinity && (!R0.bestLap || Q.lap < R0.bestLap); if (Q.newRec) { R0.bestLap = Q.lap; saveRecords(); }
    Q.wait = true;
    if (qsimStep(Q, 30)) qualiShow(); else showMsg(tr('ČASI TEKMECEV …'), 'gold', 60);
  }

  /* ---------------- race lifecycle ---------------- */
  // mode 'quali': the qualifying lap (a new qualifying, or its lap again: the rivals' laps already driven stay); else a race, on the grid
  // qualifying gave on this track (also when it is driven again), or on the usual one
  function newRace(mode) {
    const on = mp && mp.race, md = on || !track.def.modes ? 'race' : track.def.modes.indexOf(S.mode) >= 0 ? S.mode : track.def.modes[0], tt = !on && (!!track.def.timeTrial || md === 'tt'), M = Core.MODELS[S.car];   // (online: always the race)
    const duel = md === 'traffic', chase = md === 'police';   // (Vršič's open road: the duel with one rival in the traffic, the run from the police)
    const cd = !on && champRun ? champDef() : null, cr = cd && !champDone() && cd.tracks[champ.rounds.length] === track.def.id ? champ.rounds.length : -1;   // a championship round (its index), or -1
    if (cr < 0) champRun = false;
    const quali = mode === 'quali' && qualiOn(track.def), nAI = tt || chase ? 0 : duel ? 1 : cr >= 0 ? NUM_AI : track.def.rivals || NUM_AI;   // (a championship round: its own twelve in every round)
    if (quali && !(qual && qual.id === track.def.id && qual.cr === cr && !qual.res)) { const W = weatherOf(track.def); qual = { id: track.def.id, cr, seed: (Math.random() * 1e6) | 0, rain: W.rain, wx: W.wx, storm: !!W.storm, nAI, back: track.qualiBack(), diff: cr >= 0 ? champ.diff : S.difficulty, phys: physOf(), sims: null, lap: 0, res: null }; }
    const Q = !quali && !on && !tt && qual && qual.res && qual.id === track.def.id && qual.cr === cr ? qual : null;   // the race after qualifying
    if (!quali && !Q) qual = null;
    if (quali) { qual.lapShown = false; qual.wait = false; }
    const W = quali || Q ? { rain: qual.rain, wx: qual.wx, storm: qual.storm } : weatherOf(track.def);   // (qualifying: the weather at the start of the race to come, no change during the lap)
    const mine = { playerModel: M, playerUpg: Object.assign({}, upgOf(M.id)), playerSetup: Object.assign({}, setupOf(track.def.id)), playerColor: PLAYER_COLORS[S.color], playerNum: carNum(), seed: quali || Q ? qual.seed : (Math.random() * 1e6) | 0, difficulty: cr >= 0 ? champ.diff : S.difficulty, assist: S.assist };
    if (on) {   // online: the players on the grid in the host's order (in turn from race to race), no AI; the host's physics and damage for all
      const nums = netNums(on), rs = on.roster;
      race = new Core.Race(track, Object.assign(mine, { numAI: 0, playerGrid: on.grid.indexOf(mp.me) + 1, laps: on.laps, damage: on.damage, phys: on.phys, rain: on.rain, playerNum: nums[mp.me],
        remote: on.grid.filter(id => id !== mp.me).map(id => { const F = rs.find(p => p.id === id) || { name: tr('Prijatelj'), car: M.id, color: 0 };
          return { id, model: modelById(F.car), color: PLAYER_COLORS[F.color] || PLAYER_COLORS[0], num: nums[id], name: F.name, grid: on.grid.indexOf(id) + 1 }; }) }));
    } else if (school) {   // the driving school: alone, the lesson's car, dry; the braking lesson from the start of the straight
      school = { L: school.L, on: 0, all: 0, D: { pts: 0, chain: 0, calm: 0, best: 0, lost: 0 } };
      race = new Core.Race(track, schoolOpts(school.L));
      if (school.L.id === 'brake') placeAt(race.player, track, BRAKE_S0);
    } else race = new Core.Race(track, Object.assign(mine, {   // time trial: alone on the start line, one run to the finish; qualifying: alone, one flying lap
      numAI: tt || quali ? 0 : nAI, playerGrid: tt || quali || chase ? 1 : duel ? 2 : Q ? Q.res.grid : PLAYER_GRID, aiOrder: Q ? Q.res.order : undefined, qualiBack: quali ? qual.back : 0,
      laps: tt || quali ? 1 : lapsOf(track.def), fuel: !tt && !quali && !!S.fuel, damage: +S.damage, phys: physOf(), rain: W.rain, weather: quali ? null : W.wx, tyres: !tt && !!track.def.pit, compounds: true, playerCmp: S.cmp, flags: !tt && !quali, winter: S.season === 'winter', champ: cr >= 0, tt,
      traffic: duel, police: chase, chars: !tt && !quali, rival: !tt && !quali && inCareer() && career.rival ? career.rival.k : undefined
    }));
    if (race.player) race.player.pitCmp = S.pitCmp;
    if (track.def.mist) race.opts.mist = !race.rain && !W.wx && !quali && (S.tod === 'dawn' || ((S.weather === 'random' || S.weather === 'change') && Math.random() < track.def.mist));   // Big Sur: the marine layer (Render: dyn.bsMist), every morning and on some dry runs
    $('pit-row').classList.toggle('off', !(race.player && race.player.ty && race.player.ty.c));   // (the slicks for a stop: a race with tyres)
    race.champ = cr >= 0 ? { round: cr, n: cd.tracks.length, done: false } : null;
    race.quali = quali; race.storm = !on && !school && !!W.storm;   // (the driving school: always dry)
    Render.setStorm(race.storm);
    race.endu = !on && !tt && !quali && !school && !track.def.open && S.length === 'endurance';   // an endurance race: from the afternoon into the night (enduStep)
    Render.setLine(lineWant());   // (the racing line helper: the setting, or the school's lesson of it)
    Render.setMarks(school && school.L.id === 'brake' ? [150, 100, 50].map(m => ({ s: BRAKE_S0 + BRAKE_RUN - m, kind: 'board', label: String(m) })).concat([{ s: BRAKE_S0 + BRAKE_RUN, kind: 'stop', label: 'STOP' }]) : null);
    Input.setOptions({ autoGas: !!S.autoGas && !(school && school.L.id === 'start') });   // (the start lesson: the throttle is the player's own, the reaction counts)
    $('hud').classList.toggle('school', !!school); $('res-school').classList.add('off'); $('res-replay').classList.remove('off');
    if (race.endu) { Render.setTodK(0); enduK = 0; } else Render.setAtmos({ season: S.season, tod: S.tod }, true);
    fuelTold = { low: false, out: false };
    Render.attachRace(race);
    Render.resetCam();
    adaptBreak();
    bg = 'race'; phase = 'intro'; phaseT = 0; lightsOn = 0; lastBeepLight = 0; paused = false; acc = 0;
    introLen = 1.3; endPodium();
    { const air = Render.world && Render.world.air;   // the Red Bull Ring: first the jets over the grid, filmed from the grid (not online, not in a time trial or qualifying)
      if (air && !on && !tt && !quali && !school) { air.go = true; introLen += JET_SHOT; Render.setShot(air.shot); $('hud').classList.add('shot'); } }
    pkFlyStart(!on && tt && !quali);   // (Pikes Peak, Katu-Jaryk: the course flyover first, at a fresh start only)
    lastLapCount = 0; prevGear = 1; prevAir = 0; jmp = { air: false, x: 0, z: 0, s: 0, best: 0, rec: 0, n: 0 }; msgT = 0; splitT = 0; dmgKey = ''; pitHint = false; drsN = 0; secN = 0; wxSeen = race.wst ? race.wst.ev : 0; dryHint = false; tyreKey = '-'; flSeen = flPSeen = 0; flKey = '-'; flTold = {};
    $('h-msg').className = ''; $('h-split').className = ''; $('h-note').className = '';
    $('h-lights').className = ''; setLights(0, false);
    $('h-tot').textContent = quali || race.pol ? '' : '/' + race.cars.length; $('h-rank').firstElementChild.textContent = tr(race.pol ? 'POLICIJA' : 'MESTO');   // (the run from the police: how many patrol cars are after the player)
    $('hud').classList.toggle('drs', !!race.drsLast); $('h-drs').className = '';   // (a circuit with DRS zones)
    $('hud').classList.toggle('sec', !!race.secBest);   // (a circuit with TV sectors)
    $('hud').classList.toggle('tt', race.timeTrial); $('hud').classList.toggle('up', track.open && !race.timeTrial); $('pause-restart').textContent = restartTxt();
    $('hud').classList.toggle('pol', !!race.pol); $('hud').classList.toggle('duel', !!race.tf && !race.pol);   // (the open road: the police's panel, the rival's gap)
    tfSeen = race.tf ? race.tf.ev : 0; polSeen = race.pol ? race.pol.ev : 0; tfHits = { ped: 0, bike: 0 }; Sfx.siren(0, 0); rdOn = !!race.pol && rdKnows(track.def); radioReset(); polRun = { why: '', docs: false, park: false };
    if (mm.img && mm.open && mm.pol !== !!race.pol) mm.img = null;   // (the open road's map: the building at the top in the run from the police, else the finish)
    $('pause-skip').classList.toggle('off', !quali);
    $('pause-restart').classList.toggle('off', !!on);   // (online: no restart for one)
    stRun = { drift: 0, lapWall: false, wall: false, car: false, laps: 0, pole: !!(Q && Q.res.grid === 1), done: false }; achNew = [];
    cpSeen = race.player.cpEv; ttRes = null; cornerSeen = -1; cornerShow = false; placeInit(); codrvInit(); twStart(); ghStart(); secReset(); recStart(); $('res-hl').classList.add('off'); replay = null; $('replay-ui').classList.add('off'); $('h-ttsp').className = '';
    hxStart();   // (time trial: turn counter, live difference to the best run, height profile)
    pkStart();   // (Pikes Peak: the class, its splits)
    Input.reset();
    showScreen('none');
    Sfx.resume(); Sfx.setRunning(true);
    Comm.stop(); commReset(); Comm.setRadioMode(rdOn);   // (the run from the police on Vršič: only the police radio speaks)
    const wetTxt = race.rain ? tr(' · DEŽ') : '';
    if (race.timeTrial) { Comm.say(ownLine(track.def, ttLine(track.def, 'intro')), { track: EN_NAME[track.def.id] || track.def.name, cps: track.cpS.length }, 2); showMsg(tr(isRally(track.def) ? 'POLNI PLIN!' : isDesc(track.def) ? 'SPUST V DOLINO!' : 'VZPON NA VRH!') + wetTxt, 'gold', race.rain ? 1.8 : 1.2); }
    else if (quali) { Comm.say('qualiIntro', { track: EN_NAME[track.def.id] || track.def.name }, 2); showMsg((race.champ ? tr('DIRKA {0}/{1} · ', race.champ.round + 1, race.champ.n) : '') + tr('KVALIFIKACIJE') + wetTxt, 'gold', 1.8); }
    else {
      if (race.pol && race.pol.chk) { showMsg('KRANJSKA GORA' + wetTxt, 'gold', 1.8); if (race.pol.goal) toast(tr('Misija: pripelji avto do garaže na vrhu Vršiča (desno ob cesti, takoj za prelazom).'), 4200); }   // (the run from the police up to its checkpoint: a calm start, nobody after the player yet)
      else if (race.pol) { Comm.say(ownLine(track.def, 'introPolice'), { track: EN_NAME[track.def.id] || track.def.name }, 2); showMsg(tr('POLICIJA TE LOVI!') + wetTxt, 'slow', 1.8); }   // (a road without the checkpoint, Los Caracoles: the chase from the start)
      else if (race.tf) { const o = race.cars.find(c => !c.isPlayer); Comm.say(ownLine(track.def, 'introTraffic'), { track: EN_NAME[track.def.id] || track.def.name, rival: o ? o.name : 'your rival' }, 2); showMsg(tr('DVOBOJ V PROMETU!') + wetTxt, 'gold', 1.8); }   // (the duel in the traffic)
      else {
        if (on) Comm.say(race.remotes.length > 1 ? 'introNetN' : 'introNet', { track: EN_NAME[track.def.id] || track.def.name, laps: track.open ? 'one run to the top' : race.laps === 1 ? 'one lap' : race.laps + ' laps', name: race.remote.name, n: race.remotes.length + 1 }, 2);
        else Comm.say(track.open ? ownLine(track.def, 'introPass') : race.laps === 1 ? 'introOne' : 'intro', { track: EN_NAME[track.def.id] || track.def.name, laps: race.laps, grid: Comm.ordinal(race.player.grid) }, 2);
        showMsg((race.champ ? tr('DIRKA {0}/{1} · ', race.champ.round + 1, race.champ.n) : '') + (track.open ? tr('DIRKA NA VRH!') : lapWord(race.laps)) + wetTxt, 'gold', race.rain || race.champ ? 1.8 : 1.2);
      }
    }
    if (race.rain) Comm.say(track.def.id === 'spa' ? 'rainSpa' : 'rain', null, 2, { ttl: 12000 });   // (after the welcome)
  }
  function setLights(n, go) {
    const ls = $('h-lights').children;
    for (let i = 0; i < ls.length; i++) ls[i].classList.toggle('on', !go && i < n);
    $('h-lights').classList.toggle('go', !!go);
    Render.setStartLights(n, go);
  }
  function pause() {
    if (bg !== 'race' || paused || phase === 'done') return;
    paused = true; Sfx.setRunning(false); Input.reset(); Comm.stop();
    camLabel(); $('pause-photo').classList.toggle('off', !!(mp && mp.race));   // (online the race goes on: no photos)
    showScreen('pause');
    adaptBreak();
  }
  function resume() {
    paused = false; last = performance.now(); acc = 0;
    Sfx.resume(); Sfx.setRunning(true);
    showScreen('none');
  }
  // a TV shot the world directs (Render.setShot: the jets before the start, the podium) ends: the game's camera and the HUD back
  function shotOff() { Render.setShot(null); $('hud').classList.remove('shot'); }
  // the Red Bull Ring's podium after the race: the first three (in the order of the results) on the pit building's roof, champagne, the names
  // under it; then the results
  function startPodium(pod) {
    phase = 'podium'; phaseT = 0;
    const top = race.estimateResults().slice(0, 3).map(r => r.car), rgb = (h) => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
    pod.show(top.map(c => rgb(c.color)));
    Render.setShot(pod.shot); $('hud').classList.add('shot');
    const el = $('podium-cap'); el.innerHTML = top.map((c, i) => '<span><b>' + (i + 1) + '.</b> <i style="background:' + hexCss(c.color) + '"></i>' + esc(c.isPlayer ? tr('Ti') : c.name) + '</span>').join(''); el.className = 'show';
    const w = top[0]; Comm.say(w && w.isPlayer ? 'podiumMe' : 'podiumRb', { name: w ? w.name : '' }, 3);
  }
  function endPodium() { const pod = Render.world && Render.world.podium; if (pod) pod.hide(); $('podium-cap').className = ''; shotOff(); pkFlyEnd(); }   // (and the course flyover, left for the title)
  function toTitle() {
    stSave();   // (the km of a race left before its end)
    endPodium(); champRecord(); champRun = false; replay = null; recd = null; $('replay-ui').classList.add('off');
    paused = false; phase = 'none'; race = null; bg = 'demo'; Comm.stop(); Comm.setRadioMode(false); rdOn = false; radioReset(); ghRec = ghPlay = ghLap = ghFr = null; qual = null; Render.setGhost(null, true); Render.setGhostF(null, true);
    school = null; Render.setLine(false); Render.setMarks(null); Input.setOptions({ autoGas: !!S.autoGas }); $('hud').classList.remove('school');
    Sfx.setRunning(false); Sfx.silence();
    demoShow(); Render.resetCam(); Render.setStorm(S.weather === 'storm'); Render.setAtmos({ season: S.season, tod: S.tod }, true);   // (after an endurance race: the time of day of the setting again)
    setLights(0, false);
    showScreen('title'); refreshSegs();
  }
  // time trial finished: compare with the personal best, store the records right away (also if the player leaves before the results screen)
  function ttFinish() {
    const P = race.player, R0 = rec(track.def.id), time = P.finishTime;
    const splits = P.splits.slice(0, track.cpS.length).concat([time]);
    const prev = R0.bestTime > 0 ? R0.bestTime : 0, prevSplits = Array.isArray(R0.bestSplits) ? R0.bestSplits.slice() : null;
    const newPB = !prev || time < prev;
    if (newPB) { R0.bestTime = time; R0.bestSplits = splits.slice(); ghSave(track.def.id, time); } else ghRec = null;
    const M = Core.MODELS[S.car], date = Date.now();
    const entry = { name: S.name, car: M.name, carId: M.id, time, splits, date, upg: Object.assign({}, upgOf(M.id)) };
    const board = (Array.isArray(R0.board) ? R0.board : []).concat([entry]).sort((a, b) => a.time - b.time);
    const rank = board.indexOf(entry) + 1;
    R0.board = board.slice(0, 10);
    saveRecords();
    ttRes = { time, splits, prev, prevSplits, newPB, rank, date, entry };
    if (pk.on) ttRes.pk = pkFinish(R0, entry);   // (Pikes Peak: the class board)
    return ttRes;
  }
  // split rows, CP1..CPn + finish: this run's time, the previous best run's time there and the difference (alt: with the altitude)
  function splitRows(r, alt) {
    const T = track, pts = T.cpS.map((s, k) => ['CP' + (k + 1), s]).concat([[tr('CILJ'), T.finishS]]);
    return pts.map((p, k) => { const t = r.splits[k], pb = r.prevSplits ? r.prevSplits[k] : NaN, dd = t - pb;
      return '<tr><td>' + p[0] + '</td>' + (alt ? '<td>' + ttWhere(T, p[1]) + '</td>' : '') + '<td>' + fmt(t, true) + '</td><td>' + (isFinite(pb) ? fmt(pb, true) : '\u2013') + '</td><td class="' + (isFinite(dd) ? dCls(dd) : '') + '">' + (isFinite(dd) ? sgn(dd) : '\u2013') + '</td></tr>'; }).join('');
  }
  // leaderboard rows (top 10); the given run highlighted, and appended below when it did not make the top 10
  function boardRows(board, me) {
    const medal = (i) => i < 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][i] : (i + 1) + '.';
    const row = (e, lbl) => '<tr class="' + (me && e.date === me.date && e.time === me.time ? 'me' : '') + '"><td>' + lbl + '</td><td class="nm">' + esc(e.name || '?') + '</td><td class="nm">' + esc(e.car || '') + '</td><td>' + fmt(e.time, true) + '</td><td>' + (e.date ? new Date(e.date).toLocaleDateString(Lang.locale, { day: 'numeric', month: 'numeric', year: '2-digit' }) : '') + '</td></tr>';
    let h = board.map((e, i) => row(e, medal(i))).join('');
    if (me && !board.some(e => e.date === me.date && e.time === me.time)) h += row(me, '\u2013');
    return h;
  }
  const resHead = (last) => '<tr><th>#</th><th>' + tr('Voznik') + '</th><th>' + tr('Avto') + '</th><th>' + tr('Čas') + '</th><th>' + tr(last || 'Naj. krog') + '</th></tr>', ttHead = () => resHead('Datum');
  function finishTT() {
    const r = ttRes || ttFinish(), R0 = rec(track.def.id), T = track;
    $('res-head').classList.add('tt');
    $('res-pos').textContent = fmt(r.time, true);
    $('res-title').textContent = tr(r.newPB ? 'Nov osebni rekord!' : 'Cilj');
    const d = r.prev ? r.time - r.prev : 0;
    $('res-sub').innerHTML = (r.newPB ? (r.prev ? tr('Prejšnji rekord {0} ({1}).', fmt(r.prev, true), '<span class="fast">' + sgn(d) + '</span>') : tr('Prvi čas na tej progi.'))   // (the title already says "Nov osebni rekord!")
      : tr('{0} za rekordom (rekord {1}).', '<span class="slow">' + sgn(d) + '</span>', fmt(r.prev, true))) +
      ' ' + esc(Lang.of(T.def, 'name')) + (race && race.rain ? tr(' v dežju') : '') + ' · ' + esc(Core.MODELS[S.car].name) + ' · ' + (r.rank <= 10 ? tr('{0} mesto na lestvici.', Lang.ord(r.rank)) : tr('izven prvih 10.')) +
      (medalSet(T.def) ? '<br>' + medalLine(T.def, r.time) : '') + (jumpLine() ? '<br>' + jumpLine() : '');
    if (!r.st) {   // the statistics: a time trial run, its medal (once per run)
      r.st = true; const k = medalSet(T.def) ? medalOf(T.def, r.time) : -1; st.tt++; st.tracks[T.def.id] = (st.tracks[T.def.id] || 0) + 1;
      if (k >= 0) st[['gold', 'silver', 'bronze'][k]]++;
      if (k === 0) { st.goldT[T.def.id] = 1; achGet('gold'); if (trackCards().every(d => !d.medals || st.goldT[d.id])) achGet('allGold'); }
      if (trackCards().every(droveCard)) achGet('allTracks');
      stSave();
    }
    if (inCareer() && !r.paid) {   // the career: a medal, a personal best, or a little for getting there (once per run)
      r.paid = true; const k = medalSet(T.def) ? medalOf(T.def, r.time) : -1, C = Core.CAREER, sum = k >= 0 ? C.medal[['gold', 'silver', 'bronze'][k]] : r.newPB ? C.pb : C.finishTT;
      career.races++; const line = careerPay(sum, k >= 0 ? 'Nagrada za medaljo' : r.newPB ? 'Nagrada za osebni rekord' : 'Nagrada');
      if (line) $('res-sub').innerHTML += '<br>' + esc(line.trim());
    }
    // splits table: CP1..CPn + finish, altitude (a rally stage: the distance from the start), time, difference to the previous personal best
    { const a = achLine(); if (a) $('res-sub').innerHTML += '<br>' + esc(a.trim()); }
    const tt = $('res-tt'); tt.classList.remove('off');
    tt.innerHTML = '<p class="ltab-h">' + tr('Vmesni časi') + '</p><table class="ltab sp"><thead><tr><th>' + tr('Točka') + '</th><th>' + ttWhereHead(T.def) + '</th><th>' + tr('Čas') + '</th><th>' + tr('Rekord') + '</th><th>\u00b1</th></tr></thead><tbody>' + splitRows(r, true) + '</tbody></table>' +
      '<p class="ltab-h">' + tr('Lestvica · {0}', esc(Lang.of(T.def, 'name'))) + '</p>';
    $('res-table').querySelector('thead').innerHTML = ttHead();
    $('res-table').querySelector('tbody').innerHTML = boardRows(R0.board || [], r.entry);
    if (pk.on) pkResults(r);   // (Pikes Peak: its class)
    $('res-restart').textContent = ttAgain(T.def);
    const wrap = $('res-table').parentElement; wrap.scrollTop = 0;
    showScreen('results');
    // the run's row on the board must be in view (it sits below the splits; on short screens below the fold)
    const me = wrap.querySelector('tr.me');
    if (me) { const wr = wrap.getBoundingClientRect(), mr = me.getBoundingClientRect(); if (mr.bottom > wr.bottom) wrap.scrollTop += mr.bottom - wr.bottom + 4; }
  }
  // Lestvica (from the title): a tab per track; time trials list their top 10, circuits the records kept for them
  function buildBoardScreen() {
    if (!Core.TRACKS.some(d => d.id === boardId)) boardId = S.track;
    const d = Core.TRACKS.find(x => x.id === boardId) || Core.TRACKS[0], r = rec(d.id);
    $('board-tabs').innerHTML = Core.TRACKS.filter(isTT).concat(Core.TRACKS.filter(x => !isTT(x))).map(x => '<button data-board="' + x.id + '" class="' + (x.id === d.id ? 'sel' : '') + (isTT(x) ? ' tt' : '') + '">' + esc(Lang.of(x, 'name')) + '</button>').join('');
    let h;
    if (isTT(d)) {
      const board = Array.isArray(r.board) ? r.board : [], T = getTrack(d.id);
      if (!board.length) h = '<p class="board-empty">' + tr(isRally(d) ? 'Na tej progi še ni časov. Odpelji preizkušnjo in postavi prvi rekord!' : 'Na tej progi še ni časov. Odpelji vzpon in postavi prvi rekord!') + '</p>';
      else {
        h = '<p class="ltab-h">' + tr('Najboljših 10 · {0} · kronometer', esc(Lang.of(d, 'name'))) + (wetRec(d) ? tr(' v dežju') : '') + '</p><table class="ltab b"><thead>' + ttHead() + '</thead><tbody>' + boardRows(board, null) + '</tbody></table>';
        if (Array.isArray(r.bestSplits) && r.bestTime) {
          const pts = T.cpS.map((s, k) => ['CP' + (k + 1), s]).concat([[tr('CILJ'), T.finishS]]);
          h += '<p class="ltab-h">' + tr('Osebni rekord {0} · vmesni časi', fmt(r.bestTime, true)) + '</p><table class="ltab"><thead><tr><th>' + tr('Točka') + '</th><th>' + ttWhereHead(d) + '</th><th>' + tr('Čas') + '</th></tr></thead><tbody>' +
            pts.map((p, k) => '<tr><td>' + p[0] + '</td><td>' + ttWhere(T, p[1]) + '</td><td>' + fmt(r.bestSplits[k], true) + '</td></tr>').join('') + '</tbody></table>';
        }
        if (pkIs(d)) h += pkBoardHTML(r, d);   // (Pikes Peak: the top 5 of each class)
      }
    } else {
      const v = (x) => x ? x : '\u2013';
      h = '<p class="ltab-h">' + tr('Rekordi · {0} · {1}', esc(Lang.of(d, 'name')), d.open ? tr('dirka na vrh') : lapWord(d.laps || 3).toLowerCase()) + '</p><table class="ltab rec"><tbody>' +
        (d.open ? '' : '<tr><td>' + tr('Najboljši krog') + '</td><td>' + v(r.bestLap && fmt(r.bestLap, true)) + '</td></tr>') + '<tr><td>' + tr('Najboljša dirka') + '</td><td>' + v(r.bestRace && fmt(r.bestRace, true)) + '</td></tr><tr><td>' + tr('Najboljše mesto') + '</td><td>' + v(r.bestPos && Lang.ord(r.bestPos)) + '</td></tr></tbody></table>' +
        '<p class="board-empty">' + tr('Lestvica najboljših časov se vodi za kronometre ({0}).', Core.TRACKS.filter(hasTT).map(x => esc(Lang.of(x, 'name')) + (x.modes ? tr(' v načinu Kronometer') : '')).join(', ')) + '</p>';
    }
    { const M = isTT(d) && medalSet(d), R = rec(d.id), J = d.jumpRec;   // the medal times; the famous jump: the player's longest there
      if (M) h += '<p class="ltab-h">' + tr('Medalje') + (wetRec(d) ? tr(' (dež)') : '') + ' · ' + M.map((t, k) => MEDAL_ICON[k] + ' ' + fmt(t, true)).join(' · ') + '</p>';
      if (J) h += '<p class="ltab-h">' + tr('{0}: tvoj najdaljši skok {1} · {2} {3} m', esc(Lang.of(J, 'name')), R.jumpRec ? Math.round(R.jumpRec) + ' m' : '\u2013', esc(J.by), J.m) + '</p>'; }
    { const own = ghOwn(d.id), F = ghFriend(d.id);   // the ghosts: the player's to share, a friend's shared one
      h += '<div class="gh-box"><p class="ltab-h">' + tr('Duh') + '</p><p class="desc small">' + (own ? tr('Tvoj duh: {0} ({1}).', fmt(own.time, true), tr(own.ghost.lap === 1 ? 'leteči krog' : 'kronometer')) : tr('Na tej progi še nimaš duha (odpelji kronometer ali leteči krog).')) + '</p>' +
        (own ? '<div class="btns horiz gh-btns"><button class="btn mini" data-act="gh-link">' + tr('Deli povezavo') + '</button><button class="btn mini" data-act="gh-file">' + tr('Shrani v datoteko') + '</button></div>' : '') +
        (F ? '<p class="desc small">' + tr('Duh prijatelja: {0} · {1}', esc(F.name), fmt(F.t, true)) + '</p>' : '') +
        '<div class="btns horiz gh-btns">' + (F ? '<button class="btn mini" data-act="gh-del">' + tr('Izbriši prijateljevega') + '</button>' : '') + '<button class="btn mini" data-act="gh-import">' + tr('Uvozi duha') + '</button></div></div>'; }
    $('board-body').innerHTML = h; $('board-body').scrollTop = 0;
  }
  // Dosežki (from the title): the player's numbers, then every achievement (unlocked: the date; the counting ones: how far)
  /* ---------------- the driving school (Šola vožnje): four lessons with medals, all in the KAZE RS (stock, standard set-up, dry), the
     best of each kept per physics (tdgp-school). Start: from the lights out to 100 m (the throttle before they go out: a jump start);
     braking: from a standing start down the Red Bull Ring's straight, stop as near the STOP line as you can, not over it (past the 100 m
     board at 120 km/h at least); the racing line: a lap of the Jezero Ring on the line the helper draws (the share of the lap within
     1.5 m of it, in a time limit); drift: 40 s at the Jezero Ring (points for the angle times the speed, a chain banked when the slide
     ends, lost at a knock). The medals of the start and of the drift and the line's time limit: against the autopilot's own run of the
     lesson in the same car and physics (a quick simulation) ---------------- */
  const SCHOOL_CAR = 'kaze', SCHOOL_DRIFT_T = 40, BRAKE_S0 = 4000, BRAKE_RUN = 400;
  const SCHOOL = [
    { id: 'start', track: 'rbring', name: 'Štart', goal: 'Ko ugasnejo luči, čim hitreje prevozi 100 m. Plin pritisni šele, ko ugasnejo: prej je prehiter štart.' },
    { id: 'brake', track: 'rbring', name: 'Zaviranje do oznake', goal: 'Pospeši po ravnini in se ustavi čim bližje črti STOP, a ne čeznjo. Mimo table 100 m pelji vsaj 120 km/h.' },
    { id: 'line', track: 'jezero', name: 'Idealna linija', goal: 'Odpelji krog po idealni liniji, ki jo riše pomoč (zeleno: plin, rumeno: ovinek, rdeče: zaviraj, belo: točka zaviranja). Čim več kroga na njej, v omejenem času.' },
    { id: 'drift', track: 'jezero', name: 'Drift', goal: 'V 40 sekundah zberi čim več točk drsenja: bočno, hitro in brez udarcev (udarec izbriše verigo).' },
  ];
  let school = null;   // the lesson under way: { L, s0, v100, on, all, D, done }
  let schoolData = {};
  try { const j = JSON.parse(localStorage.getItem('tdgp-school') || 'null'); if (isObj(j)) for (const k in j) { const e = j[k]; if (isObj(e) && Number.isFinite(e.best) && [0, 1, 2, -1].includes(e.medal)) schoolData[k] = { best: e.best, medal: e.medal }; } } catch (_) { schoolData = {}; }
  const schoolKey = (L) => L.id + '@' + physOf();
  const schoolRec = (L) => schoolData[schoolKey(L)] || { best: NaN, medal: -1 };
  const schoolLower = (L) => L.id === 'start' || L.id === 'brake';
  const lineWant = () => school ? school.L.id === 'line' : !!S.line;
  const wrapD = (d, L) => (d > L / 2 ? d - L : d < -L / 2 ? d + L : d);
  function driftTick(D, P, dt) {   // the drift's points (the lesson and its reference): a chain grows while the car slides, banked when it ends, lost at a knock
    if (P.hitWall > 3 || P.hitCar > 3) { if (D.chain > 0) D.lost++; D.chain = 0; D.calm = 0; return; }
    const b = Math.abs(P.beta || 0), v = P.speed;
    if (b > 0.2 && v > 8 && !P.air) { D.chain += v * b * dt * 10; D.calm = 0; }
    else if (D.chain > 0 && (D.calm += dt) > 0.6) { D.pts += D.chain; D.best = Math.max(D.best, D.chain); D.chain = 0; D.calm = 0; }
  }
  const schoolOpts = (L) => ({ numAI: 0, playerGrid: 1, laps: L.id === 'line' ? 1 : 99, playerModel: modelById(SCHOOL_CAR), playerUpg: upgNorm(null), playerSetup: { wing: 1, gear: 1 }, playerColor: PLAYER_COLORS[S.color], playerNum: carNum(),
    seed: 1, difficulty: 1, assist: S.assist, damage: 0, phys: physOf(), rain: 0 });
  function placeAt(c, T, s) {   // (the braking lesson: the car standing at s on the ideal line)
    const i = T.idx(s), off = T.rl[i];
    c.place(T.px[i] + T.nx[i] * off, T.pz[i] + T.nz[i] * off, T.hd[i]); if (T.hasElev) c.y = c.py = T.hy[i];
    c.q = T.query(c.x, c.z, i, c.q); c.sPrev = c.q.s; c.vx = c.vz = 0;
  }
  const schoolRefs = {};
  function schoolRef(L) {   // the autopilot's run of the lesson: the start's 100 m time, the line's lap time, the drift's points (cached)
    const key = schoolKey(L) + '@' + S.assist; if (schoolRefs[key] != null) return schoolRefs[key];
    if (L.id === 'brake') return (schoolRefs[key] = 0);
    const T = getTrack(L.track), r = new Core.Race(T, schoolOpts(L)), P = r.player, D = { pts: 0, chain: 0, calm: 0, best: 0, lost: 0 };
    r.start(); const s0 = P.q.s; let t = 0, v = NaN;
    while (t < 240) {
      Core.aiControl(P, r, STEP); r.step(STEP); t += STEP;
      if (L.id === 'start' && wrapD(P.q.s - s0, T.len) >= 100) { v = r.time; break; }
      if (L.id === 'line' && P.finished) { v = P.lapTimes[0]; break; }
      if (L.id === 'drift') { driftTick(D, P, STEP); P.hitWall = P.hitCar = 0; if (t >= SCHOOL_DRIFT_T) { v = D.pts + D.chain; break; } }
    }
    return (schoolRefs[key] = v);
  }
  function schoolMedals(L) {   // [gold, silver, bronze]
    const r = schoolRef(L), r10 = (x) => Math.max(10, Math.round(x / 10) * 10);
    return L.id === 'start' ? [r + 0.3, r + 0.5, r + 0.9] : L.id === 'brake' ? [1, 3, 8] : L.id === 'line' ? [75, 55, 35] : [r10(r * 1.15), r10(r * 0.85), r10(r * 0.5)];
  }
  function schoolMedal(L, v) { if (v == null || !Number.isFinite(v)) return -1; const m = schoolMedals(L), lo = schoolLower(L); for (let k = 0; k < 3; k++) if (lo ? v <= m[k] : v >= m[k]) return k; return -1; }
  const schoolVal = (L, v) => !Number.isFinite(v) ? '–' : L.id === 'start' ? Lang.dec(v.toFixed(2)) + ' s' : L.id === 'brake' ? Lang.dec(v.toFixed(2)) + ' m' : L.id === 'line' ? Math.round(v) + ' %' : numDot(Math.round(v)) + tr(' točk');
  function buildSchoolScreen() {
    $('school-list').innerHTML = SCHOOL.map(L => { const m = schoolMedals(L), R = schoolRec(L), lo = schoolLower(L);
      return '<div class="sch' + (R.medal === 0 ? ' gold' : '') + '"><div class="sch-h"><b>' + esc(tr(L.name)) + '</b><span class="sch-m">' + (R.medal >= 0 ? MEDAL_ICON[R.medal] : '') + '</span></div>' +
        '<p>' + esc(tr(L.goal)) + '</p><p class="sch-t">' + m.map((x, k) => MEDAL_ICON[k] + ' ' + (lo ? '\u2264 ' : '\u2265 ') + schoolVal(L, x)).join(' \u00b7 ') + '</p>' +
        '<p class="sch-b">' + tr('Tvoj najboljši: {0}', schoolVal(L, R.best)) + '</p><button class="btn mini primary" data-act="school-go" data-lesson="' + L.id + '">' + tr('Začni') + '</button></div>'; }).join('');
  }
  function schoolGo(id) {
    const L = SCHOOL.find(x => x.id === id); if (!L) return;
    Comm.unlock(); champRun = false; qual = null;
    ensureTrack(L.track, () => { school = { L }; newRace(); });
  }
  function schoolStep(P, dt, inp) {   // (after each physics step)
    const s = school, L = s.L, T = track; if (s.done) return;
    if (phase === 'lights' && L.id === 'start' && inp && inp.thr > 0.5) { schoolEnd(null, tr('Prehiter štart: plin je bil pritisnjen, preden so ugasnile luči.')); return; }
    if (phase !== 'racing') return;
    if (s.s0 == null) s.s0 = P.q.s;
    const d = wrapD(P.q.s - s.s0, T.len);
    if (L.id === 'start') { s.live = d; if (d >= 100) schoolEnd(race.time, tr('100 m v {0} s po tem, ko so ugasnile luči.', Lang.dec(race.time.toFixed(2)))); }
    else if (L.id === 'brake') {
      const toGo = BRAKE_RUN - wrapD(P.q.s - BRAKE_S0, T.len) - P.m.a - 0.9;   // (the car's nose to the line)
      s.live = toGo;
      if (s.v100 == null && toGo <= 100) { s.v100 = P.speed; if (P.speed < 33.3) { schoolEnd(null, tr('Prepočasi: mimo table 100 m je avto peljal {0} km/h, potrebnih je vsaj 120.', Math.round(P.speed * 3.6))); return; } }
      if (toGo < 0) { schoolEnd(null, tr('Čez črto STOP: zaviraj prej.')); return; }
      if (s.v100 != null && P.speed < 0.3) schoolEnd(toGo, tr('Avto se je ustavil {0} m pred črto STOP (mimo table 100 m s {1} km/h).', Lang.dec(toGo.toFixed(2)), Math.round(s.v100 * 3.6)));
    } else if (L.id === 'line') {
      const i = T.idx(P.q.s), ds = P.speed * dt; s.all += ds; if (Math.abs(P.q.d - T.rl[i]) < 1.5) s.on += ds;
      s.live = s.all > 0 ? s.on / s.all * 100 : 100;
      if (P.finished) {
        const t = P.lapTimes[0], lim = schoolRef(L) * 1.25, pct = s.live;
        if (t > lim) schoolEnd(null, tr('Prepočasi: krog v {0}, v omejenem času {1} (na idealni liniji {2} %).', fmt(t, true), fmt(lim, true), Math.round(pct)));
        else schoolEnd(pct, tr('Na idealni liniji {0} % kroga, krog v {1} (omejitev {2}).', Math.round(pct), fmt(t, true), fmt(lim, true)));
      }
    } else if (L.id === 'drift') {
      const had = s.D.chain; driftTick(s.D, P, dt); if (had > 30 && s.D.chain === 0 && s.D.calm === 0 && (P.hitWall > 3 || P.hitCar > 3)) showMsg(tr('UDAREC: VERIGA IZGUBLJENA'), 'slow', 1.2);
      s.live = s.D.pts + s.D.chain;
      if (race.time >= SCHOOL_DRIFT_T) { const v = s.D.pts + s.D.chain; schoolEnd(v, tr('{0} točk drsenja v {1} s (najdaljša veriga {2}, izgubljenih verig {3}).', numDot(Math.round(v)), SCHOOL_DRIFT_T, numDot(Math.round(Math.max(s.D.best, s.D.chain))), s.D.lost)); }
    }
  }
  function schoolHUD() {   // the lesson's line at the top: what to do, how it goes
    const s = school, L = s && s.L; if (!L) return;
    const v = s.live, txt = L.id === 'start' ? (phase === 'racing' ? tr('ŠTART · {0} s · {1} m', Lang.dec(race.time.toFixed(2)), Math.max(0, Math.round(v || 0))) : tr('ŠTART · plin šele, ko ugasnejo luči')) :
      L.id === 'brake' ? tr('ZAVIRANJE · do črte STOP {0} m', v == null ? BRAKE_RUN : Math.max(0, Math.round(v))) : L.id === 'line' ? tr('LINIJA · na liniji {0} %', Math.round(v == null ? 100 : v)) :
      tr('DRIFT · {0} točk · {1} s', numDot(Math.round(v || 0)), Math.max(0, Math.ceil(SCHOOL_DRIFT_T - (phase === 'racing' ? race.time : 0))));
    setText('h-school', txt);
  }
  function schoolEnd(v, note) {
    const s = school, L = s.L; s.done = true;
    phase = 'done'; Sfx.setRunning(false); Input.setOptions({ autoGas: !!S.autoGas });
    const m = schoolMedal(L, v), R = schoolRec(L), lo = schoolLower(L), better = Number.isFinite(v) && (!Number.isFinite(R.best) || (lo ? v < R.best : v > R.best));
    if (better || (m >= 0 && (R.medal < 0 || m < R.medal))) { schoolData[schoolKey(L)] = { best: better ? v : R.best, medal: R.medal < 0 ? m : m < 0 ? R.medal : Math.min(R.medal, m) }; try { localStorage.setItem('tdgp-school', JSON.stringify(schoolData)); } catch (_) { } }
    if (m === 0) { achGet('school'); if (SCHOOL.every(x => schoolRec(x).medal === 0)) achGet('schoolAll'); }
    showMsg(m === 0 ? tr('ZLATO!') : m === 1 ? tr('SREBRO!') : m === 2 ? tr('BRON!') : v == null ? tr('NEUSPEŠNO') : tr('BREZ MEDALJE'), m >= 0 ? 'gold' : 'slow', 2);
    Sfx.beep(m >= 0 ? 990 : 330, 0.2, 0.14);
    $('res-head').classList.remove('tt'); $('res-tt').classList.add('off'); $('res-laps').classList.add('off');
    $('res-pos').textContent = m >= 0 ? MEDAL_ICON[m] : '\u2013';
    $('res-title').textContent = tr(m === 0 ? 'Zlata medalja!' : m === 1 ? 'Srebrna medalja!' : m === 2 ? 'Bronasta medalja!' : v == null ? 'Neuspešno' : 'Brez medalje');
    $('res-sub').textContent = tr(L.name) + ': ' + note + (better && Number.isFinite(R.best) ? tr(' Nov osebni rekord!') : '') + achLine();
    const M = schoolMedals(L), cur = schoolRec(L);
    $('res-table').querySelector('thead').innerHTML = '<tr><th>' + tr('Medalja') + '</th><th>' + tr('Cilj') + '</th></tr>';   // (two columns: a phone upright hides the third)
    $('res-table').querySelector('tbody').innerHTML = M.map((x, k) => '<tr' + (k === m ? ' class="me"' : '') + '><td>' + MEDAL_ICON[k] + ' ' + tr(['Zlato', 'Srebro', 'Bron'][k]) + '</td><td>' + (lo ? '\u2264 ' : '\u2265 ') + schoolVal(L, x) + '</td></tr>').join('') +
      '<tr><td>' + tr('Tvoj rezultat') + '</td><td>' + schoolVal(L, v) + '</td></tr><tr><td>' + tr('Tvoj najboljši') + '</td><td>' + schoolVal(L, cur.best) + '</td></tr>';
    $('res-restart').dataset.act = 'restart'; $('res-restart').textContent = tr('Ponovi vajo'); $('res-replay').classList.add('off'); $('res-school').classList.remove('off');
    showScreen('results');
  }

  function buildStatsScreen() {
    const hm = (t) => { const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60); return h ? tr('{0} h {1} min', h, m) : tr('{0} min', m); };
    const rows = [['Prevoženo', kmTxt(st.km * 1000, 1) + ' km'], ['Čas vožnje', hm(st.time)], ['Dirke', st.races], ['Zmage', st.wins], ['Stopničke', st.podiums], ['Prva štartna mesta', st.poles], ['Najhitrejši krogi', st.fl],
      ['Kronometri', st.tt], ['Medalje', MEDAL_ICON[0] + ' ' + st.gold + '  ' + MEDAL_ICON[1] + ' ' + st.silver + '  ' + MEDAL_ICON[2] + ' ' + st.bronze], ['Naslovi prvaka', st.titles], ['Pobegi policiji', st.escapes], ['Dirke s prijatelji', st.online],
      ['Najvišja hitrost', Math.round(st.vmax) + ' km/h'], ['Najdaljši skok', Math.round(st.jump) + ' m'], ['Najdaljše drsenje', Lang.dec(st.drift.toFixed(1)) + ' s'], ['Proge', trackCards().filter(droveCard).length + '/' + trackCards().length]];
    const n = ACH.filter(a => st.ach[a[0]]).length;
    $('stats-body').innerHTML = '<div class="st-grid">' + rows.map(([k, v]) => '<div class="st-cell"><b>' + v + '</b><span>' + tr(k) + '</span></div>').join('') + '</div>' +
      '<p class="ltab-h">' + tr('Dosežki {0}/{1}', n, ACH.length) + '</p><div class="ach-list">' + ACH.map(a => { const d = st.ach[a[0]], p = !d && a[3] ? a[3]() : null;
        return '<div class="ach' + (d ? ' got' : '') + '"><i>' + (d ? '\u{1F3C6}' : '\u{1F512}') + '</i><div><b>' + tr(a[1]) + '</b><span>' + tr(a[2]) + (d ? ' · ' + new Date(d).toLocaleDateString(Lang.locale) : p ? ' (' + (a[0].startsWith('km') ? kmTxt(p[0] * 1000, 1) : Math.floor(p[0])) + '/' + p[1] + ')' : '') + '</span></div></div>'; }).join('') + '</div>';
    $('stats-body').scrollTop = 0;
  }
  /* ---------------- PIKES PEAK: race classes, the summit ceremony, TV splits ---------------- */
  // Classes as at the real race, from the car's performance (Core.MODELS): the formula (735 kW, wings) and the TAIFUN LM prototype Unlimited;
  // the AWD cars (BURJA R7, VORTEX, STRELA EV, SAMUM 4x4) Open; the quick rear-driven road cars (STREGA, KAZE, VIHAR V8) Pikes Peak Open;
  // the light hatchbacks (PICO, 206) Time Attack 1.
  // Each class keeps its own top 5 in the track's records (R0.pkCls[class], per physics and weather like the rest of the record). Times set
  // before the classes (R0.board) go, once, into the class of the car they were set with. The overall board, best time and ghost are as they were.
  // At each checkpoint: the TV pill (split time, the difference to the class best run's split) and the CP1-CP4 bar (#h-sec); at the summit
  // the ceremony (#pk-cer) for the 4.2 s before the results. Only a Pikes Peak time trial alone (never online).
  const PK_CLS = [{ id: 'unl', name: 'Unlimited' }, { id: 'open', name: 'Open' }, { id: 'ppo', name: 'Pikes Peak Open' }, { id: 'ta1', name: 'Time Attack 1' }];
  const PK_CAR = { formula: 'unl', lm: 'unl', rally: 'open', vortex: 'open', ev: 'open', truck: 'open', strega: 'ppo', kaze: 'ppo', muscle: 'ppo', pico: 'ta1', p206: 'ta1' };
  const pk = { on: false, cls: null, best: null };
  const pkIs = (d) => !!d && d.theme === 'pikes';   // (Pikes Peak on asphalt, 'pikes', and on its historic gravel road, 'pikesg': each with its own records, boards, medals and legend)
  // Pikes Peak's road on the track menu: one card, the road a choice on it (Cesta: asfalt / makadam, S.pkRoad); the variants (def.variantOf) have no card of their own
  const pkRoads = (d0) => Core.TRACKS.filter(x => x.variantOf === d0.id);
  const pkRoadDef = (d0) => { const V = pkRoads(d0); return V.length ? V.find(x => x.id === S.pkRoad) || d0 : d0; };
  const pkGrav = (d) => !!d && d.roadSurface === 'makadam';
  function pkRoadCard(d0, d, sel, desc) {
    return '<div class="track-card modes' + sel + '" data-track="' + d.id + '" role="button" tabindex="0"><canvas></canvas><div class="tc-head"><h3>' + Lang.of(d0, 'name') + '</h3>' +
      '<div class="seg tc-mode" data-set="pkRoad" role="group" aria-label="' + tr('Cesta') + '">' + [d0].concat(pkRoads(d0)).map(x => '<button data-v="' + x.id + '" data-track="' + x.id + '" class="' + (x === d ? 'sel' : '') + '"' +
      (pkGrav(x) ? ' title="' + tr('Zgodovinska makadamska cesta (do 2011)') + '">' + tr('Makadam') : ' title="' + tr('Današnja asfaltna cesta') + '">' + tr('Asfalt')) + '</button>').join('') + '</div></div>' + desc + '</div>';
  }
  function pkClsOf(carId, carName) {   // (an unknown car: by its power and drive; an entry with no known car: Open, the class of the game's own car)
    const M = Core.MODELS.find(m => m.id === carId) || Core.MODELS.find(m => m.name === carName);
    const id = !M ? 'open' : PK_CAR[M.id] || (M.kw >= 500 ? 'unl' : M.drive === 'AWD' ? 'open' : M.kw >= 260 ? 'ppo' : 'ta1');
    return PK_CLS.find(c => c.id === id);
  }
  function pkBoards(R0) {   // the class boards of a record: made from its overall board the first time, kept clean and sorted
    if (!isObj(R0.pkCls)) { R0.pkCls = {}; for (const e of Array.isArray(R0.board) ? R0.board : []) { const c = pkClsOf(e.carId, e.car).id; (R0.pkCls[c] || (R0.pkCls[c] = [])).push(e); } }
    for (const c of PK_CLS) { const a = R0.pkCls[c.id]; R0.pkCls[c.id] = Array.isArray(a) ? a.map(boardEntry).filter(e => e).sort((x, y) => x.time - y.time).slice(0, 5) : []; }
    return R0.pkCls;
  }
  const pkTag = (c) => '<span class="pk-cls pk-' + c.id + '">' + esc(c.name) + '</span>';
  function pkTrackTag(r, d) {   // the track card: the class of the chosen car and its best time
    const M = Core.MODELS[S.car], c = pkClsOf(M.id), b = pkBoards(r)[c.id][0];
    return (pkGrav(d) ? '<div class="tmeta pk-meta">' + tr('Cesta: makadam (zgodovinska, do 2011)') + '</div>' : '') + '<div class="tmeta pk-meta">' + tr('Razred {0} {1}', pkTag(c), esc(M.name)) + (b ? tr(' · rekord razreda {0}', fmt(b.time, true)) : tr(' · v razredu še ni časa')) + '</div>' + pkCardMed(r, c, d);   // (+ the class's medal times)
  }
  function pkStart() {   // newRace (after hxStart)
    const on = pk.on = !!race.timeTrial && pkIs(track.def) && !(mp && mp.race), H = $('h-sec');
    $('hud').classList.toggle('pkc', on); $('pk-cer').className = ''; $('hud').classList.remove('pkn', 'pkleg');
    while (H.children.length > 3) H.lastChild.remove();
    if (!on) return;
    pk.cls = pkClsOf(Core.MODELS[S.car].id);
    const b = pkBoards(rec(track.def.id))[pk.cls.id][0]; pk.best = b ? { time: b.time, splits: b.splits.slice() } : null;
    { const mv = Render.world && Render.world.dyn.pkMov; if (mv) mv.best = pk.best ? pk.best.splits.slice() : null; }   // (the world's LED split boards: the class best run's splits)
    while (H.children.length < track.cpS.length) H.appendChild(document.createElement('i'));
    [...H.children].forEach((el, j) => { el.innerHTML = '<small>CP' + (j + 1) + '</small>\u2013'; el.className = ''; });
    const el = $('h-pkcls'); el.textContent = pk.cls.name.toUpperCase(); el.className = 'h-lbl pk-' + pk.cls.id;
    pk7Start();   // (the chosen ghost, the corner warnings)
  }
  // the course flyover (prelet proge; Render.pkFly films it) on Pikes Peak and Katu-Jaryk (def.fly): a TV sweep along the course with captions at the famous places, during
  // the race's intro before the lights (the race clock starts after it, the race is not touched). At a fresh start from the menus only:
  // not online, not after Ponovi, not with the setting off. A tap, a click, any key or pad button skips it (the input is used up by that)
  const pkF = { on: false, fresh: false, k: -2, eat: 0, bound: false };
  function pkFlyStart(ok) {
    pkFlyEnd();
    const fresh = pkF.fresh; pkF.fresh = false;
    if (!ok || !fresh || !(pkIs(track.def) || track.def.fly) || !+S.pkFly || !Render.pkFly || !Render.pkFly.at(0)) return;
    if (!pkF.bound) { pkF.bound = true;
      const eat = (e) => { e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); };
      window.addEventListener('keydown', (e) => { if (!pkF.on || screen !== 'none' || paused) return; if (!e.repeat) pkFlySkip(); eat(e); }, true);
      window.addEventListener('pointerdown', (e) => { if (!pkF.on || screen !== 'none' || paused) return; pkFlySkip(); pkF.eat = performance.now() + 700; eat(e); }, true);
      window.addEventListener('click', (e) => { if (performance.now() < pkF.eat) { pkF.eat = 0; eat(e); } }, true); }   // (the tap's click: not a pause as well)
    pkF.on = true; pkF.k = -2; introLen += Render.pkFly.DUR;
    Render.pkFly.warm();   // (every shader of the world now, while the screen still changes over from the menu: none compiles mid-flight)
    Render.setShot(Render.pkFly.at(0).shot); $('hud').classList.add('shot'); document.body.classList.add('pkfly');
    pkFlyStep();
  }
  function pkFlyStep() {   // updatePhase, in the intro: the shot and its caption at this moment
    const o = Render.pkFly.at(phaseT), el = $('pk-fly');
    if (!o || phaseT >= Render.pkFly.DUR) { pkFlyEnd(); return; }
    if (o.k !== pkF.k && o.k >= 0) { const C = Render.pkFly.caps, c = C[o.k], al = track.def.alt, a = al && !o.k ? al[0] : al && o.k === C.length - 1 ? al[1] : track.altAt(track.hy[track.idx(c.s)]);   // (the start's and the finish's: as the HUD shows them)
      el.children[1].textContent = tr(c.n); el.children[2].textContent = a != null ? numDot(al ? clamp(a, Math.min(al[0], al[1]), Math.max(al[0], al[1])) : a) + ' m' : ''; }   // (a descent: its alt falls)
    pkF.k = o.k; el.className = 'show';
    el.style.opacity = Math.min(1, phaseT / 0.3, (Render.pkFly.DUR - phaseT) / 0.3).toFixed(2);
    const a = o.k >= 0 ? o.a.toFixed(2) : '0'; el.children[1].style.opacity = a; el.children[2].style.opacity = a;
  }
  function pkFlyEnd() {   // the flyover over (or skipped, or a new race): the game's camera, the HUD back
    if (!pkF.on) return;
    pkF.on = false; $('pk-fly').className = ''; document.body.classList.remove('pkfly'); shotOff(); Render.pkFly.end();
  }
  function pkFlySkip() { if (!pkF.on) return; if (phase === 'intro' && phaseT < Render.pkFly.DUR) phaseT = Render.pkFly.DUR; pkFlyEnd(); }   // (the usual 1.3 s of the intro, then the lights)
  const pkSplit = (k) => pk.best && posNum(pk.best.splits[k]) ? pk.best.splits[k] : NaN;   // the class best run's time at checkpoint k (0-based)
  function pkSplitHUD(k, t, d, has) {   // checkpoint k (1-based) at time t, d: against the class best run's split there
    const el = $('h-split'), c = has ? dCls(d) : 'even';
    el.innerHTML = '<b>CP' + k + '</b><span>' + fmt(t) + '</span>' + (has ? '<em class="' + c + '">' + sgn(d) + '</em>' : '<em class="even">' + esc(pk.cls.name) + '</em>');
    el.className = 'show pk ' + c;
    const cell = $('h-sec').children[k - 1];
    if (cell) { const a = Math.abs(d); cell.innerHTML = '<small>CP' + k + '</small>' + (has ? (d < 0 ? '\u2212' : '+') + (a >= 60 ? fmt(a).slice(0, -4) : a.toFixed(a < 10 ? 2 : 1)) : secTxt(t)); cell.className = has ? (d < 0.0005 ? 'pkf' : 'pks') : 'pkn'; }
  }
  function pkFinish(R0, e) {   // ttFinish: the run into its class board (stored); its place there and the class best before it
    const B = pkBoards(R0), c = pk.cls, a = B[c.id], prev = a[0] ? a[0].time : 0, mp0 = pkMeds(R0, track.def)[c.id], m0 = mp0 != null ? mp0 : -1;
    a.push(e); a.sort((x, y) => x.time - y.time); const rank = a.indexOf(e) + 1; B[c.id] = a.slice(0, 5);
    const med = pkMedOf(pkMedSet(track.def)[c.id], e.time), newMed = med >= 0 && (m0 < 0 || med < m0); if (newMed) R0.pkMed[c.id] = med;   // (the class's best medal, kept with its board)
    saveRecords();
    return { cls: c, rank, prev, newCB: !prev || e.time < prev, med, newMed };
  }
  const pkPlace = (p) => p.rank <= 5 ? tr('{0} v razredu {1}', Lang.ord(p.rank), pkTag(p.cls)) : tr('Izven prvih 5 v razredu {0}', pkTag(p.cls));
  const pkDiff = (r) => { const p = r.pk, d = r.time - p.prev;
    return !p.prev ? tr('Prvi čas v razredu') : p.newCB ? tr('{0} pod prejšnjim rekordom razreda ({1})', '<span class="fast">' + sgn(d) + '</span>', fmt(p.prev, true)) : tr('{0} za rekordom razreda ({1})', '<span class="slow">' + sgn(d) + '</span>', fmt(p.prev, true)); };
  function pkCeremony(r) {   // the summit: the chequered flag, the time, the place in the class, the record badge, the difference to the class best
    const p = r.pk, el = $('pk-cer'); if (!p) return;
    $('h-msg').className = ''; msgT = 0; $('h-ttsp').className = ''; $('h-split').className = ''; splitT = 0;   // (the ceremony has it all)
    const alt = track.def.alt ? numDot(track.def.alt[1]) + ' m' : '';
    el.innerHTML = '<div class="pkc-flag"><i></i></div><div class="pkc-top">' + tr('VRH') + (alt ? ' · ' + alt : '') + '</div>' +
      '<div class="pkc-time">' + fmt(r.time, true) + '</div><div class="pkc-pos">' + (p.rank === 1 ? '\u{1F3C6} ' : '') + pkPlace(p) + '</div>' +
      (p.newCB ? '<div class="pkc-rec">' + tr(p.prev ? 'NOV REKORD RAZREDA' : 'PRVI REKORD RAZREDA') + '</div>' : r.newPB ? '<div class="pkc-rec">' + tr('NOV OSEBNI REKORD') + '</div>' : '') +
      '<div class="pkc-d">' + pkDiff(r) + '</div>' + pkCerMed(r);
    el.className = 'show' + (p.newCB ? ' rec' : '');
  }
  function pkResults(r) {   // the results screen: the class line under the overall one, the class top 5 above the overall board
    const p = r.pk; $('pk-cer').className = ''; if (!p) return;
    $('res-sub').innerHTML += '<br>' + pkPlace(p) + ' · ' + pkDiff(r) + '.<br>' + pkMedLine(p, r.time);
    const hs = $('res-tt').querySelectorAll('.ltab-h'), h = hs[hs.length - 1], b = pkBoards(rec(track.def.id))[p.cls.id];
    if (h) h.insertAdjacentHTML('beforebegin', '<p class="ltab-h">' + tr('Razred {0} · najboljših 5', esc(p.cls.name)) + '</p><table class="ltab b"><thead>' + ttHead() + '</thead><tbody>' + boardRows(b, r.entry) + '</tbody></table>');
  }
  function pkBoardHTML(r, d) {   // Lestvica: the top 5 of each class
    const B = pkBoards(r);
    const Md = pkMeds(r, d), A = pkMedSet(d);
    return PK_CLS.map(c => '<p class="ltab-h">' + tr('{0} najboljših 5', pkTag(c)) + '</p><p class="pk-medl">' + pkMedTxt(A[c.id]) + ' · ' + (Md[c.id] != null ? tr('tvoja najboljša {0}', MEDAL_ICON[Md[c.id]]) : tr('še brez medalje')) + '</p>' + (B[c.id].length ? '<table class="ltab b"><thead>' + ttHead() + '</thead><tbody>' + boardRows(B[c.id], null) + '</tbody></table>' : '<p class="board-empty">' + tr('V tem razredu še ni časov ({0}).', Core.MODELS.filter(m => pkClsOf(m.id) === c).map(m => esc(m.name)).join(', ')) + '</p>')).join('');
  }
  /* ---------------- PIKES PEAK: corner warnings, medals per class, the legend ghost ---------------- */
  // Medals per class, dry and wet (s): measured with the autopilot (Core.aiControl, assist 2, no upgrades, as tests/races.test.js drives)
  // on the fastest car of each class: dry FORMULA ORKAN 164.26, BURJA R7 182.30, STREGA MR 186.80, PEUGEOT 206 184.58 (VORTEX 185.13,
  // KAZE 189.19, PICO 186.12); wet 180.68, 196.83, 204.23, 200.20. Gold ~1.5 % under that run, silver ~2.5 % over it, bronze ~8 % over.
  // The class's best medal is kept with its board (R0.pkMed[class] 0 gold .. 2 bronze; the board's best time counts too).
  const PK_MED = { unl: [161, 168, 177], open: [176, 183, 193], ppo: [183, 191, 201], ta1: [181, 189, 199] }, PK_MED_WET = { unl: [177, 185, 195], open: [189, 197, 208], ppo: [201, 209, 220], ta1: [197, 205, 216] };
  const PK_LEG = { unl: 'formula', open: 'ev', ppo: 'strega', ta1: 'p206' };   // the legend's car: the class's fastest on the autopilot
  // The historic gravel road ('pikesg', the same way measured): dry FORMULA ORKAN 211.86 (TAIFUN LM 221.97), SAMUM 4x4 192.18 (STRELA EV 198.32, BURJA R7
  // 198.98, VORTEX 200.95), STREGA MR 210.10 (KAZE 212.49, VIHAR V8 221.37), PEUGEOT 206 203.70 (PICO 204.66); wet 248.21, 208.69, 238.59, 229.21. On the
  // loose gravel the 4x4 truck is the fastest car of all and the slicks of the Unlimited cars hold them back
  const PK_MED_G = { unl: [208, 217, 228], open: [189, 196, 207], ppo: [206, 215, 226], ta1: [200, 208, 219] }, PK_MED_G_WET = { unl: [244, 254, 268], open: [205, 213, 225], ppo: [235, 244, 257], ta1: [225, 234, 247] };
  const PK_LEG_G = { unl: 'formula', open: 'truck', ppo: 'strega', ta1: 'p206' };
  const pkMedW = (d, wet) => pkGrav(d) ? (wet ? PK_MED_G_WET : PK_MED_G) : wet ? PK_MED_WET : PK_MED;   // (the medal times of a road, dry or wet)
  const pkLegCar = (d, c) => (pkGrav(d) ? PK_LEG_G : PK_LEG)[c];
  if (!['best', 'legend', 'off'].includes(S.pkGhost)) S.pkGhost = S.ghost ? 'best' : 'off';   // Duh: moj najboljši / legenda / brez (first time: as the ghost setting)
  S.pkNotes = +S.pkNotes === 0 ? 0 : 1;   // Opozorila na ovinke (on unless turned off)
  const pkMedSet = (d) => pkMedW(d, wetRec(d));
  const pkMedOf = (A, t) => t > 0 ? A.findIndex(x => t <= x) : -1;
  const pkMs = (t) => Math.floor(t / 60) + ':' + String(Math.round(t % 60)).padStart(2, '0');
  const pkMedTxt = (A) => A.map((t, k) => MEDAL_ICON[k] + ' ' + pkMs(t)).join(' · ');
  function pkMeds(R0, d) {   // the best medal of each class (stored, or from the class board's best time)
    const A = pkMedSet(d), B = pkBoards(R0), o = isObj(R0.pkMed) ? R0.pkMed : {}, m = {};
    for (const c of PK_CLS) { let k = [0, 1, 2].includes(o[c.id]) ? o[c.id] : -1; const b = B[c.id][0], kb = b ? pkMedOf(A[c.id], b.time) : -1; if (kb >= 0 && (k < 0 || kb < k)) k = kb; if (k >= 0) m[c.id] = k; }
    return (R0.pkMed = m);
  }
  function pkCardMed(r, c, d) {   // the track card: the medal times of the chosen car's class, the one already won; the ghost's row, the legend made ready
    const k = pkMeds(r, d)[c.id], sel = S.track === d.id, row = $('pk-gh-row');
    if (row) row.classList.toggle('off', !sel);
    if (sel && S.pkGhost === 'legend') pkLegWarm(c.id, wetRec(d), d);
    return '<div class="tmeta pk-meta pk-medl">' + pkMedTxt(pkMedSet(d)[c.id]) + (k != null ? tr(' · tvoja {0}', MEDAL_ICON[k]) : '') + '</div>';
  }
  const pkMedName = (k) => tr(MEDAL[k]);   // (Zlata medalja ...)
  function pkMedLine(p, t) {   // results: the medal won in the class, and how far the next one was
    const A = pkMedSet(track.def)[p.cls.id], k = p.med, n = k < 0 ? 2 : k - 1;
    return (k >= 0 ? MEDAL_ICON[k] + ' ' + tr('{0} v razredu {1}', pkMedName(k), esc(p.cls.name)) + (p.newMed ? tr(' (nova najboljša)') : '') : tr('Brez medalje v razredu {0}', esc(p.cls.name))) +
      (n >= 0 ? tr(k < 0 ? ' · do brona {0} ({1})' : n === 0 ? ' · do zlata {0} ({1})' : ' · do srebra {0} ({1})', pkMs(A[n]), '<span class="slow">' + sgn(t - A[n]) + '</span>') : '') + '.';
  }
  function pkCerMed(r) {   // the summit ceremony: the medal (or how far bronze was)
    const p = r.pk, k = p.med;
    if (k >= 0) { Comm.say('medal', { medal: MEDAL_EN[k] }, 3, { ttl: 9000 }); return '<div class="pkc-med m' + k + '"><i>' + MEDAL_ICON[k] + '</i><span>' + tr(MEDAL[k]).toUpperCase() + (p.newMed ? '<small>' + tr('nova najboljša v razredu') + '</small>' : '') + '</span></div>'; }
    const B = pkMedSet(track.def)[p.cls.id][2];
    return '<div class="pkc-med none">' + tr('Do brona {0} še {1}', pkMs(B), sgn(r.time - B)) + '</div>';
  }
  // The legend (Duh: legenda): the autopilot's run with the class's legend car, sampled like a ghost and put on the gold clock (sample j
  // is the run at j * GH_DT * run / gold), so it crosses the line on the gold time. Made once per class and weather, a slice at a time
  // while the menus are up (the rest at the start, if it is not ready), with its own seeded random numbers (the same run every time; the
  // game's untouched), on a race of its own (the race driven is never touched); kept in localStorage (tdgp-pklegend-*). Not a record.
  const PK_LEG_V = 1, pkLeg = { mem: {}, job: null };
  const pkLegKey = (c, wet, d) => 'tdgp-pklegend-' + (d.id !== 'pikes' ? d.id + '-' : '') + c + '-' + pkLegCar(d, c) + (wet ? '-wet' : '');   // (the car in the key: a new legend car makes a new run; the road: the gravel's runs apart, the asphalt's keep their old keys)
  const pkLegTrk = (T) => Math.round(T.len * 10) + '/' + T.N;   // (the road it was driven on)
  function pkLegGet(c, wet, d) {   // the legend's run on road d, or null when it is not made yet
    const key = pkLegKey(c, wet, d), T = getTrack(d.id), gold = pkMedW(d, wet)[c][0];
    if (pkLeg.mem[key]) return pkLeg.mem[key];
    let o = null; try { o = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; }
    if (!isObj(o) || o.v !== PK_LEG_V || o.trk !== pkLegTrk(T) || o.t !== gold || !(o.n >= 2 && o.n <= GH_MAX) || typeof o.d !== 'string' || !Array.isArray(o.q0) || o.q0.length !== 3) return null;
    let b; try { b = atob(o.d); } catch (_) { return null; }
    if (b.length !== o.n * GH_CH * 2) return null;
    const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    const a = new Int16Array(u.buffer), f = new Float32Array(o.n * GH_CH), q = o.q0.map(v => +v || 0);
    for (let k = 0; k < o.n; k++) { const i = k * GH_CH; for (let ch = 0; ch < 3; ch++) { q[ch] += a[i + ch]; f[i + ch] = q[ch] / 100; } for (let ch = 3; ch < 7; ch++) f[i + ch] = a[i + ch] / 1e4; }
    return (pkLeg.mem[key] = { n: o.n, t: gold, M: modelById(pkLegCar(d, c)), color: 0xe0b22a, stripe: true, f, lap: false, leg: true });
  }
  function pkLegRun(J, ms) {   // the legend's run for about ms milliseconds; true when it is over (made and kept, or given up)
    const r = J.r, P = r.player, t0 = performance.now(), orig = Math.random, cap = 420;
    Math.random = J.rnd;
    try {
      while (!P.finished && r.time < cap) {
        for (let n = 0; n < 120 && !P.finished && r.time < cap; n++) {
          Core.aiControl(P, r, STEP); r.step(STEP);
          if (P.stuckT > 3 || P.wrongT > 3) r.rescue(P);
          const t1 = r.time, tp = t1 - STEP;
          while (J.n < GH_MAX && J.n * GH_DT <= t1 + 1e-9) { ghPose(P, J.f, J.n, clamp((J.n * GH_DT - tp) / STEP, 0, 1)); J.n++; }
        }
        if (performance.now() - t0 > ms) break;
      }
    } finally { Math.random = orig; }
    if (!P.finished && r.time < cap) return false;
    if (pkLeg.job === J) pkLeg.job = null;
    if (!P.finished || J.n < 2) return true;   // (never got there: no legend)
    if (J.n < GH_MAX) { ghPose(P, J.f, J.n, 1); J.n++; }
    const gold = pkMedW(J.d, J.wet)[J.c][0], q = P.finishTime / gold, n = Math.min(GH_MAX, Math.floor(gold / GH_DT) + 2), F = J.f, L = J.n - 1, f = new Float32Array(n * GH_CH);
    for (let j = 0; j < n; j++) { const u = Math.min(L, j * q), k = Math.min(L - 1, Math.floor(u)), a = u - k, o = k * GH_CH, p = o + GH_CH, w = j * GH_CH;
      for (let ch = 0; ch < GH_CH; ch++) f[w + ch] = ch === 3 ? F[o + 3] + Core.wrapPi(F[p + 3] - F[o + 3]) * a : F[o + ch] + (F[p + ch] - F[o + ch]) * a; }
    const key = pkLegKey(J.c, J.wet, J.d), e = ghEncode({ n, f });
    pkLeg.mem[key] = { n, t: gold, M: modelById(pkLegCar(J.d, J.c)), color: 0xe0b22a, stripe: true, f, lap: false, leg: true };
    if (e) try { localStorage.setItem(key, JSON.stringify({ v: PK_LEG_V, trk: pkLegTrk(r.track), t: gold, car: pkLegCar(J.d, J.c), n, q0: e.q0, d: e.d })); } catch (_) { }
    return true;
  }
  function pkLegJob(c, wet, d) {   // a new run of the legend (its own race on the Pikes Peak road d; the one driven is never touched)
    let s = 97; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }, orig = Math.random; let r;
    Math.random = rnd; try { r = new Core.Race(getTrack(d.id), { numAI: 0, playerGrid: 1, laps: 1, playerModel: modelById(pkLegCar(d, c)), assist: 2, phys: physOf(), seed: 7, difficulty: 1, rain: wet ? 1 : 0, damage: 0, tt: true }); r.start(); } finally { Math.random = orig; }
    return (pkLeg.job = { c, wet, d, r, f: new Float32Array(GH_MAX * GH_CH), n: 0, rnd });
  }
  const pkLegIs = (J, c, wet, d) => !!J && J.c === c && J.wet === wet && J.d === d;
  function pkLegWarm(c, wet, d) {   // the menus: make the legend in the background (8 ms slices), unless it is there or on the way
    if (pkLegGet(c, wet, d) || pkLegIs(pkLeg.job, c, wet, d)) return;
    const J = pkLegJob(c, wet, d);
    const go = () => { if (pkLeg.job !== J) return; if (bg === 'race' && phase !== 'done') { setTimeout(go, 500); return; } if (!pkLegRun(J, 8)) setTimeout(go, 24); };   // (never during a race)
    setTimeout(go, 60);
  }
  function pkLegNow(c, wet, d) {   // the start: the legend, made right now if it is not ready (once; about a third of a second)
    const G = pkLegGet(c, wet, d); if (G) return G;
    const J = pkLegIs(pkLeg.job, c, wet, d) ? pkLeg.job : pkLegJob(c, wet, d);
    pkLegRun(J, 1e9); return pkLegGet(c, wet, d);
  }
  // The corner warnings (Opozorila na ovinke, S.pkNotes): a pace-note pill under the clock for the next corner, from 2.6 s before it
  // at the current speed (40-230 m) until the car is in it: a hairpin big and red, a medium bend orange, a fast one faint; the arrow
  // and the rally grade (2 a slow corner .. 6 a flat-out kink), the distance. It replaces the generic arrow (#h-note) on Pikes Peak.
  const PK_NP = { r3: 'M20 56 V28 Q20 12 32 12 Q44 12 44 28 V42 M35 34 L44 43 L53 34', l3: 'M44 56 V28 Q44 12 32 12 Q20 12 20 28 V42 M29 34 L20 43 L11 34',
    r2: 'M22 56 V36 Q22 20 38 20 H48 M39 11 L48 20 L39 29', l2: 'M42 56 V36 Q42 20 26 20 H16 M25 11 L16 20 L25 29',
    r1: 'M26 56 V40 Q26 24 42 15 M32 10 L43 14 L39 25', l1: 'M38 56 V40 Q38 24 22 15 M32 10 L21 14 L25 25' };
  function pk7Start() {   // pkStart: the ghost chosen for Pikes Peak (the live difference and the profile follow it), the corners ahead
    const wet = !!race.rain;
    if (S.pkGhost === 'off') ghPlay = null;
    else if (S.pkGhost === 'legend') ghPlay = pkLegNow(pk.cls.id, wet, track.def);
    hxStart();   // (again: the difference and the profile against this ghost)
    $('hud').classList.toggle('pkleg', !!(ghPlay && ghPlay.leg));
    const T = track, nos = T.def.turnNos(T);
    pk.notes = nos.map(q => { const c = T.corners.find(x => x.s0 === q.s), hp = q.sev === 3 && !!c && c.angle > 2.0, a = c ? c.angle : 0;
      return { s: q.s, n: q.n, sev: q.sev, dir: q.dir, hp, g: hp ? 1 : q.sev === 3 ? 2 : q.sev === 2 ? (a > 1.2 ? 3 : 4) : a < 0.5 ? 6 : 5 }; });
    pk.nk = -2; pk.nd = ''; pk.non = -1; $('pk-note').className = '';
  }
  function pkNoteFrame(P) {   // every HUD frame: the pill (the DOM touched only when the corner or its 10 m step changes)
    const on = +S.pkNotes ? 1 : 0, el = $('pk-note');
    if (on !== pk.non) { pk.non = on; $('hud').classList.toggle('pkn', !!on); }
    const L = pk.notes, sp = track.startS + P.dist; let k = -1;
    if (on && L && phase === 'racing' && !P.finished) { for (let i = 0; i < L.length; i++) if (L[i].s + 6 > sp) { k = i; break; } if (k >= 0 && L[k].s - sp > clamp(P.speed * 2.6, 40, 230)) k = -1; }
    if (k !== pk.nk) { pk.nk = k; pk.nd = '';
      if (k < 0) { el.classList.remove('show'); return; }
      const c = L[k], lr = c.dir > 0 ? 'r' : 'l';
      $('pk-note-path').setAttribute('d', PK_NP[lr + (c.hp ? 3 : c.sev === 1 ? 1 : 2)]);
      el.children[1].textContent = c.hp ? tr(c.dir > 0 ? 'DESNA LASNICA' : 'LEVA LASNICA') : tr(c.dir > 0 ? 'DESNI {0}' : 'LEVI {0}', c.g);
      el.className = 's' + c.sev + (c.hp ? ' hp' : '') + ' show';
    }
    if (k < 0) return;
    const d = Math.max(0, Math.round((L[k].s - sp) / 10) * 10), t = d ? d + ' m' : '';
    if (t !== pk.nd) { pk.nd = t; el.children[2].textContent = t; }
  }
  function finishRace() {
    phase = 'done';
    Sfx.setRunning(false);
    if (mp && mp.race) { netResults(); return; }
    $('res-restart').dataset.act = 'restart'; $('res-laps').classList.add('off');
    if (race.timeTrial) { finishTT(); return; }
    if (race.pol) { finishPolice(); return; }
    if (race.quali) { finishQuali(); return; }
    const up = track.open, head = resHead(up ? 'Povprečno' : '');   // (a race up the road: the average speed instead of the best lap)
    $('res-head').classList.remove('tt'); $('res-tt').classList.add('off'); $('res-table').querySelector('thead').innerHTML = head; $('res-restart').textContent = tr('Ponovi dirko');
    const res = race.estimateResults();
    const P = race.player;
    const myIdx = res.findIndex(r => r.car === P);
    const pos = myIdx + 1;
    const best = P.lapTimes.length ? Math.min(...P.lapTimes) : 0;
    let newRec = false;
    const R0 = rec(track.def.id);
    if (best > 0 && (!R0.bestLap || best < R0.bestLap)) { R0.bestLap = best; newRec = true; }
    const tot = res[myIdx].time;
    secSave();
    if (S.length === 'normal' && (!R0.bestRace || tot < R0.bestRace)) R0.bestRace = tot;   // (the race time and place: of the usual length only)
    if (S.length === 'normal' && (!R0.bestPos || pos < R0.bestPos)) R0.bestPos = pos;
    saveRecords();
    $('res-pos').textContent = Lang.ord(pos);
    $('res-title').textContent = tr(pos === 1 ? 'Zmaga!' : pos <= 3 ? 'Na stopničkah!' : 'Cilj');
    $('res-sub').textContent = tr('Čas dirke {0}', fmt(tot, true)) + (res[myIdx].pen ? tr(' (s {0} s kazni)', res[myIdx].pen) : '') + (up ? '' : tr(', najboljši krog {0}', fmt(best, true))) + (newRec ? tr(' (nov rekord proge)') : '') + tr('. Štartal si z {0} mesta.', Lang.ord(P.grid));
    if (race.tf) $('res-sub').textContent += tr(' Povoženi pešci: {0}, kolesarji: {1}', tfHits.ped, tfHits.bike) + (tfHits.ped + tfHits.bike ? tr(' (5 s kazni za vsakega)') : '') + '.';
    const fl = !up && best > 0 && race.cars.every(c => c === P || !c.lapTimes.length || Math.min(...c.lapTimes) >= best);   // (the fastest lap of the race)
    stRace(pos, res.length, fl);
    if (inCareer()) {   // the career: prize money (the place, the distance, the difficulty), the fastest lap of the race (a race up the road: no laps)
      const diff = race.champ ? champ.diff : raceDiff();
      career.races++; if (pos === 1) career.wins++;
      $('res-sub').textContent += careerPay(Core.careerPrize(pos, res.length, up ? track.raceLen : track.len * race.laps, diff) + (fl ? Core.CAREER.fastest : 0), 'Nagrada' + (fl ? ' (z najhitrejšim krogom)' : ''));
      const ri = res.findIndex(r => r.car.chr && r.car.chr.rival);
      if (ri >= 0 && career.rival) { if (myIdx < ri) career.rival.me++; else career.rival.him++; careerSave();   // the standing rival: who was ahead
        $('res-sub').textContent += tr(' Stalni tekmec {0}: {1} mesto (skupaj ti {2}, tekmec {3}).', res[ri].car.name, Lang.ord(ri + 1), career.rival.me, career.rival.him); }
      else if (!career.rival && !race.tf) { const o = res[myIdx > 0 ? myIdx - 1 : 1];   // the first race of the career: the one just ahead (the winner's: the second) is the standing rival from now on
        if (o && o.car.chr) { career.rival = { k: o.car.chr.k, me: 0, him: 0 }; careerSave(); $('res-sub').textContent += tr(' {0} ({1}) je zdaj tvoj stalni tekmec.', o.car.name, chrWords(o.car.chr.k)); } }
    }
    const ch = race.champ;
    if (ch) {   // a championship round: counted now; the points in the table, the standings behind the button
      champRecord();
      const d = champDef(), t = champ ? Core.champTable(CH_KEYS, champ.rounds) : [], mi = t.findIndex(e => e.key === Core.PLAYER_KEY), last = champDone();
      if (d && mi >= 0) {
        $('res-sub').textContent += tr(' {0}: +{1} {2}, skupaj {3} in {4} mesto', Lang.of(d, 'name'), Core.champPoints(pos), ptsWord(Core.champPoints(pos)), t[mi].pts, Lang.ord(mi + 1)) + (last ? tr(' v končni razvrstitvi.') : tr(' po {0} dirki.', Lang.ord(champ.rounds.length)));
        if (last) Comm.say(mi === 0 ? 'champWin' : 'champEnd', { pos: Comm.ordinal(mi + 1) }, 5);
        if (last && mi < 3) $('res-sub').textContent += careerPay(Math.round(Core.CAREER.champ[mi] * (Core.CAREER.diff[champ.diff] || 1)), mi === 0 ? 'Za naslov prvaka' : tr('Za {0} mesto v prvenstvu', Lang.ord(mi + 1)));
      }
      $('res-restart').dataset.act = 'to-champ'; $('res-restart').textContent = tr(last ? 'Končna razvrstitev' : 'Lestvica prvenstva');
      $('res-table').querySelector('thead').innerHTML = head.replace('</tr>', '<th>' + tr('Točke') + '</th></tr>');
    }
    $('res-sub').textContent += achLine();
    lapTable(res);
    const tb = $('res-table').querySelector('tbody');
    tb.innerHTML = res.map((r, i) => {
      const c = r.car; const b = c.lapTimes.length ? Math.min(...c.lapTimes) : NaN, kmh = up && !r.est && r.time > 0 ? Math.round(track.raceLen / r.time * 3.6) + ' km/h' : '\u2013';
      const name = c.isPlayer ? tr('Ti') : c.name, p = Core.champPoints(i + 1);
      return '<tr class="' + (c.isPlayer ? 'me' : '') + '"><td>' + (i + 1) + '</td><td><span class="dot" style="background:' + hexCss(c.color) + '"></span>' + name + '</td><td>' + c.m.name + '</td><td>' + (r.est ? '+' + fmt(r.time - res[0].time, true) : fmt(r.time, true)) + (r.pen ? ' <small class="pen">(+' + r.pen + ' s)</small>' : '') + '</td><td>' + (up ? kmh : fmt(b, true)) + '</td>' +
        (ch ? '<td class="pts">' + (p ? '+' + p : '') + '</td>' : '') + '</tr>';
    }).join('');
    $('res-hl').classList.toggle('off', !hlPlan());   // (the highlights of the race, when there are some)
    showScreen('results');
  }

  // the run from the police is over: the mission done (into the building at the top: the fastest one is the record), arrested at the checkpoint
  // (no documents, parked as told), or caught in the chase; what it took (the rap sheet)
  function finishPolice() {
    const P = race.player, pol = race.pol, esc = !pol.busted, chk = pol.arrestK === 'chk', t = P.finishTime || race.time, R0 = rec(track.def.id), L = polLen(), done = esc ? L : clamp(P.dist, 0, L);
    let newRec = false; if (esc && t > 0 && (!R0.bestRace || t < R0.bestRace)) { R0.bestRace = t; newRec = true; }
    if (esc) R0.escapes = (R0.escapes || 0) + 1; else R0.busts = (R0.busts || 0) + 1; saveRecords();
    if (!stRun.done) { stRun.done = true; st.races++; st.tracks[track.def.id] = (st.tracks[track.def.id] || 0) + 1; if (esc) { st.escapes++; achGet('escape'); } if (trackCards().every(droveCard)) achGet('allTracks'); stSave(); }
    $('res-head').classList.remove('tt'); $('res-tt').classList.add('off'); $('res-restart').textContent = tr('Ponovi beg');
    $('res-pos').textContent = esc ? '✓' : '✕'; $('res-title').textContent = tr(esc ? (pol.goal ? 'Misija opravljena!' : 'Pobegnil si!') : chk ? 'Aretiran na kontroli' : 'Ulovljen!');
    $('res-sub').textContent = esc ? (pol.goal ? tr('Skril si se v garažo na vrhu Vršiča v {0}', fmt(t, true)) : track.def.escTo ? tr('{0} v {1}', Lang.of(track.def, 'escTo'), fmt(t, true)) : tr('Čez prelaz v {0}', fmt(t, true))) + (newRec ? tr(' (najhitrejši pobeg).') : '.')
      : chk ? tr('Brez dokumentov si parkiral ob cesti in s policistom odšel na postajo ({0}).', fmt(t, true)) : tr('Policija te je ujela po {0} km, v {1}.', kmTxt(done, 1), fmt(t, true));
    const stars = (h) => '★'.repeat(Math.round(h)) + '☆'.repeat(5 - Math.round(h)), O = pol.off, T2 = pol.st, sec = (v) => Math.round(v) + ' s';   // (stars: not st, the stats kept across the runs)
    const offs = [O.speed >= 1 && tr('prehitra vožnja v naselju {0}', sec(O.speed)), O.walk >= 0.5 && tr('vožnja po pločniku {0}', sec(O.walk)), O.crash && tr('trki s prometom {0}×', O.crash),
      pol.hitPeople && tr('povoženi pešci in kolesarji {0}×', pol.hitPeople), O.moto && tr('zbiti policisti na motorju {0}×', O.moto)].filter(Boolean);
    const W = polRun.why, ctl = chk ? tr('brez dokumentov, aretiran') : W === 'hit' ? tr('zbil si policista in pobegnil') : W === 'skip' ? tr('nisi ustavil, pobegnil') : polRun.docs ? tr('brez dokumentov, pobegnil') : W ? tr('ustavil, nato pobegnil') : '–';   // (how the checkpoint went)
    const rows = [['Čas', fmt(t, true)], ['Prevožena pot', kmTxt(done, 1) + ' / ' + kmTxt(L, 1) + ' km']];
    if (pol.chk) rows.push(['Kontrola prometa', ctl]);   // (a road without the checkpoint, Los Caracoles: none)
    if (chk) rows.push(['Prekrški', offs.length ? offs.join('<br>') : tr('brez')]);   // (arrested at the checkpoint: no chase to tell of)
    else {
      rows.push(['Najvišja stopnja pregona', stars(pol.heatMax || pol.heat)], ['Prekrški', offs.length ? offs.join('<br>') : tr('brez')], ['Izločene patrulje', pol.wrecked], ['Zapore / trakovi za tabo', T2.blocks + ' / ' + T2.strips],
        ['Skrivanje', T2.evaded ? tr('{0}× so izgubili sled<br>najdlje {1} izven pogleda', T2.evaded, sec(T2.hideMax)) : tr('nikoli jim nisi ušel izpred oči')]);
      if (T2.heliT > 0) rows.push(['Helikopter nad tabo', sec(T2.heliT)]);
      if (T2.ambush) rows.push(['Zasede', T2.ambush]);
      if (T2.logs) rows.push(['Pasti s hlodi', T2.logs + (T2.logHits ? tr(' (patrulje na hlodih: {0}×)', T2.logHits) : '')]);
      rows.push(['Prebite gume', pol.flats], ['Škoda', Lang.eur(Math.round(T2.eur / 50) * 50)]);
    }
    rows.push(['Pobegi / aretacije', (R0.escapes || 0) + ' / ' + (R0.busts || 0)]);
    $('res-table').querySelector('thead').innerHTML = '<tr><th>' + tr('Kartoteka') + '</th><th></th></tr>';
    $('res-table').querySelector('tbody').innerHTML = rows.map(([a, b]) => '<tr' + (a === 'Čas' ? ' class="me"' : '') + '><td>' + tr(a) + '</td><td class="wrap">' + b + '</td></tr>').join('');   // (the offences one a line)
    if (inCareer() && esc) { career.races++; career.wins++; $('res-sub').textContent += careerPay(Core.careerPrize(1, 2, L, S.difficulty), 'Nagrada za pobeg'); }
    $('res-sub').textContent += achLine();
    showScreen('results');
  }

  /* ---------------- jumps: how far each one flew (from 12 m: a popup), the run's longest; def.jumpRec = { bump, name, say, m, by, beat }:
     the famous jump (Ouninpohja: the Yellow House, Markko Märtin's 57 m in 2003), where the player's longest is kept with the records
     (jumpRec, per physics and weather) and the commentator names the record ---------------- */
  let jmp = { air: false, x: 0, z: 0, s: 0, best: 0, rec: 0, n: 0 };
  function jumpLanded(len, s0) {
    if (len < 12) return;   // (a hop over a bump)
    const J = track.def.jumpRec, b = J && track.def.bumps && track.def.bumps[J.bump], c = b ? clamp(b.at, 0, 1) * track.len : 0, w = b ? b.w || 8 : 0;
    const m = Math.round(len);
    jmp.n++; jmp.best = Math.max(jmp.best, len);
    if (len > st.jump) { st.jump = len; stSave(); } if (len >= 40) achGet('jump');
    if (!b || s0 < c - 2.5 * w - 15 || s0 > c + w) { showMsg(tr('SKOK {0} m', m), 'gold', 1.1); return; }
    jmp.rec = Math.max(jmp.rec, len);
    const R0 = rec(track.def.id), prev = R0.jumpRec || 0, pb = len > prev + 0.05, beat = len > J.m;
    if (pb) { R0.jumpRec = +len.toFixed(1); saveRecords(); }
    showMsg((beat ? Lang.of(J, 'beat').toUpperCase() + ' ' : pb && prev ? tr('REKORD SKOKA! ') : Lang.of(J, 'name').toUpperCase() + ' ') + m + ' m', beat || (pb && prev) ? 'fast' : 'gold', 2.2);
    Comm.say(beat ? 'jumpBeat' : pb && prev ? 'jumpPB' : 'jumpRec', { m, rec: J.m, by: J.by, place: J.say }, 3);
  }
  const jumpLine = () => { const J = track.def.jumpRec, R0 = rec(track.def.id);   // (the results: the run's longest jump, the famous one against the records)
    if (!jmp.n) return ''; let h = tr('Najdaljši skok {0} m', Math.round(jmp.best));
    if (J) h += tr(' · {0} {1} (tvoj rekord {2}, {3} {4} m)', esc(Lang.of(J, 'name')), jmp.rec ? Math.round(jmp.rec) + ' m' : '–', R0.jumpRec ? Math.round(R0.jumpRec) + ' m' : '–', esc(J.by), J.m);
    return h + '.'; };

  /* ---------------- championship screen: the choice of a series, then the standings between the rounds, the final standings ---------------- */
  const trackName = (id) => Lang.of(Core.TRACKS.find(d => d.id === id), 'name') || id;
  const raceWord = (n) => Lang.cur === 'en' ? n + (n === 1 ? ' race' : ' races') : n + (n === 1 ? ' dirka' : n === 2 ? ' dirki' : n <= 4 ? ' dirke' : ' dirk');
  const ptsWord = (n) => Lang.cur === 'en' ? (n === 1 ? 'point' : 'points') : n % 100 === 1 ? 'točka' : n % 100 === 2 ? 'točki' : n % 100 === 3 || n % 100 === 4 ? 'točke' : 'točk';
  const winsWord = (n) => Lang.cur === 'en' ? (!n ? 'no wins' : n + (n === 1 ? ' win' : ' wins')) : !n ? 'brez zmage' : n + (n === 1 ? ' zmaga' : n === 2 ? ' zmagi' : n <= 4 ? ' zmage' : ' zmag');
  const DIFF_NAME = ['lahka', 'srednja', 'težka', 'super težka'];
  const raceDiff = () => Math.min(S.difficulty, 2);   // (a race, a championship: super težka is the police's own, raced as težka)
  const champDriver = (key) => { if (key === Core.PLAYER_KEY) return { name: S.name, car: Core.MODELS[S.car].name, color: PLAYER_COLORS[S.color] };
    const a = Core.aiDriver(Math.max(0, CH_KEYS.indexOf(key) - 1)); return { name: a.name, car: a.model.name, color: a.color }; };
  // the championship round just driven: its finishing order into the standings (once); after the last round the final place into the records
  function champRecord() {
    if (!race || !race.champ || race.champ.done || !race.player.finished || !champ) return;
    const d = champDef(); if (!d || champ.rounds.length !== race.champ.round || d.tracks[race.champ.round] !== race.track.def.id) return;
    champ.rounds.push({ track: race.track.def.id, order: race.estimateResults().map(r => r.car.isPlayer ? Core.PLAYER_KEY : r.car.name), rain: race.rain ? 1 : 0 });
    race.champ.done = true; champSave();
    if (champDone()) {
      const pos = Core.champTable(CH_KEYS, champ.rounds).findIndex(e => e.key === Core.PLAYER_KEY) + 1, R0 = records.champ[champ.id] || (records.champ[champ.id] = {});
      if (!R0.best || pos < R0.best) R0.best = pos;
      if (pos === 1) { R0.titles = (R0.titles || 0) + 1; st.titles++; achGet('champ'); if (champ.id === 'legende') achGet('legend'); stSave(); }
      saveRecords();
    }
  }
  function openChamp() {
    if (bg === 'race' || race) toTitle();   // (from the results or the pause menu: the race off the screen, the title demo behind)
    champQuitT = 0; buildChampScreen(); showScreen('champ');
  }
  function buildChampScreen() {
    const d = champDef(), done = champDone();
    $('ch-mycar').textContent = Core.MODELS[S.car].name;
    $('ch-quit').classList.toggle('off', !d || done); $('ch-quit').textContent = tr('Opusti');
    if (!d) {   // the choice of a series: its tracks, its length, the best final place so far
      if (!Core.CHAMPS.some(c => c.id === champPick)) champPick = Core.CHAMPS[0].id;
      $('ch-title').textContent = tr('Prvenstvo'); $('ch-tag').textContent = tr('točke kot v F1');
      $('ch-diff').textContent = S.difficulty > 2 ? tr('Težavnost: {0} (super težka je samo za beg pred policijo; spremeniš v Nastavitvah)', tr(DIFF_NAME[raceDiff()])) : tr('Težavnost: {0} (spremeniš v Nastavitvah)', tr(DIFF_NAME[raceDiff()]));
      $('ch-body').innerHTML = '<div class="ch-cards">' + Core.CHAMPS.map(c => {
        const R0 = records.champ[c.id] || {}, km = c.tracks.reduce((a, id) => { const T = getTrack(id); return a + T.len * lapsOf(T.def); }, 0);
        return '<button class="ch-card' + (c.id === champPick ? ' sel' : '') + '" data-champ="' + c.id + '"><h3>' + esc(Lang.of(c, 'name')) + '</h3><div class="tmeta">' + raceWord(c.tracks.length) + ' · ' + kmTxt(km, 0) + ' km</div>' +
          '<div class="ttracks">' + c.tracks.map(id => esc(trackName(id))).join(' · ') + '</div><div class="tdesc">' + esc(Lang.of(c, 'desc')) + '</div>' +
          (R0.best ? '<div class="trec">' + (R0.titles ? tr('Prvak {0}×', R0.titles) : tr('Najboljše: {0} mesto', Lang.ord(R0.best))) + '</div>' : '') + '</button>'; }).join('') + '</div>';
      $('ch-go').textContent = tr('Začni prvenstvo');
      return;
    }
    const t = Core.champTable(CH_KEYS, champ.rounds), next = champ.rounds.length, mi = t.findIndex(e => e.key === Core.PLAYER_KEY);
    $('ch-title').textContent = Lang.of(d, 'name'); $('ch-tag').textContent = done ? tr('končano') : tr('dirka {0}/{1}', next + 1, d.tracks.length);
    $('ch-diff').textContent = tr('Težavnost: {0}', tr(DIFF_NAME[champ.diff]));
    const chips = '<ol class="ch-rounds">' + d.tracks.map((id, i) => { const r = champ.rounds[i];
      return '<li class="' + (r ? 'done' : i === next ? 'next' : '') + '">' + (i + 1) + '. ' + esc(trackName(id)) + (r ? ' · <b>' + Lang.ord(r.order.indexOf(Core.PLAYER_KEY) + 1) + '</b>' + (r.rain ? tr(' (dež)') : '') : '') + '</li>'; }).join('') + '</ol>';
    const fin = done ? '<div class="ch-final"><div class="res-pos">' + Lang.ord(mi + 1) + '</div><div><h2>' + tr(mi === 0 ? 'Prvak!' : mi < 3 ? 'Na stopničkah prvenstva!' : 'Konec prvenstva') + '</h2>' +
      '<p class="desc">' + tr('{0} {1}, {2}. Zmagovalec {3} ({4}).', t[mi].pts, ptsWord(t[mi].pts), winsWord(t[mi].wins), esc(champDriver(t[0].key).name), t[0].pts) + '</p></div></div>' : '';
    const rows = t.map((e, i) => { const c = champDriver(e.key);
      return '<tr class="' + (e.key === Core.PLAYER_KEY ? 'me' : '') + '"><td>' + (i + 1) + '.</td><td class="nm"><span class="dot" style="background:' + hexCss(c.color) + '"></span>' + esc(c.name) + '</td><td class="nm">' + esc(c.car) + '</td>' +
        '<td class="pts">' + e.pts + '</td><td>' + (e.wins || '') + '</td><td>' + (e.last ? Lang.ord(e.last) : '–') + '</td></tr>'; }).join('');
    $('ch-body').innerHTML = fin + chips + '<table class="ltab b"><thead><tr><th>#</th><th>' + tr('Voznik') + '</th><th>' + tr('Avto') + '</th><th>' + tr('Točke') + '</th><th>' + tr('Zmage') + '</th><th>' + tr('Zadnja') + '</th></tr></thead><tbody>' + rows + '</tbody></table>';
    $('ch-go').textContent = done ? tr('Novo prvenstvo') : tr('Naslednja dirka: {0}', trackName(d.tracks[next]));
    $('ch-body').scrollTop = 0;
  }

  /* ---------------- per-step race logic ---------------- */
  function stepRace(dt, inp) {
    recStep();
    const P = race.player;
    const pol = race.pol, hold = pol && (pol.hold || (pol.stage === 'check' && /^(stopped|walk|docs)$/.test(pol.chk.st) && !(inp.gas > 0) && !autoDrive));   // (the police: parked, arrested, in the building; stopped at the officer: the foot on the brake unless on the gas itself (Samodejni plin: the gas pressed to drive off))
    if (((phase === 'finish' || phase === 'done') && (race.timeTrial || P.busted)) || hold) { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; P.inHand = 0; P.digitalSteer = false; }   // time trial: brake to a stop past the finish (the road ends); busted by the police: stays where they stopped it
    else if (phase === 'finish' || phase === 'done' || autoDrive) { P.pitWant = !!P.inPit; Core.aiControl(P, race, dt); P.digitalSteer = false; }   // (autoDrive: automated tests of online races drive in real time)
    else { P.inSteer = inp.steer; P.inThr = inp.thr; P.inBrk = inp.brk; P.inHand = inp.hand; P.digitalSteer = inp.digital; }
    race.step(dt);
    twMark(); stDrive(P, dt);
    if (school) schoolStep(P, dt, inp);
    recHits();
    if (ghRec) ghSample(P);
    if (ghLap) ghLapSample(P);
    if (P.gear !== prevGear && prevGear > 0 && P.gear > 0) Sfx.shift(P.gear > prevGear);   // (up: the clack and a turbo's flutter; down: the clack and a blip)
    prevGear = P.gear;
    // feedback
    fbT -= dt;
    const imp = Math.max(P.hitWall, P.hitCar, (P.hitDebris || 0) * 0.6);   // running over debris thumps too
    cev.wall = Math.max(cev.wall, P.hitWall); cev.car = Math.max(cev.car, P.hitCar);
    if (imp > 1.5 && fbT <= 0) {
      fbT = 0.16;
      Sfx.crash(imp);
      if (imp > 3) { vibrate(Math.min(90, 20 + imp * 6)); Render.shake(Math.min(1.2, imp * 0.08)); }
    }
    // landing after a jump: thump + small shake/vibration scaled by how hard the car came down
    if (prevAir && !P.air && P.impactVY < -2.5) {
      const hard = -P.impactVY;
      Sfx.crash(Math.min(4, hard * 0.45));
      if (hard > 5) vibrate(Math.min(60, 15 + hard * 4));
    }
    prevAir = P.air;
    // a jump: from the take-off to the landing (jumpLanded: the length on the HUD; the famous jump of def.jumpRec against its record)
    if (P.air && !jmp.air) { jmp.air = true; jmp.x = P.x; jmp.z = P.z; jmp.s = P.q.s; }
    else if (!P.air && jmp.air) { jmp.air = false; if (phase === 'racing' && !P.finished) jumpLanded(Math.hypot(P.x - jmp.x, P.z - jmp.z), jmp.s); }
    if (P.pitEv) { const e = P.pitEv; P.pitEv = null; pitEvent(e); }
    if (race.wst && race.wst.ev !== wxSeen) { wxSeen = race.wst.ev; wxEvent(race.wst.evK, P); }
    if (race.fl) { const F = race.fl; if (F.ev !== flSeen) { flSeen = F.ev; flagEvent(F.evK, P); } if (F.pev !== flPSeen) { flPSeen = F.pev; flagPlayer(F.pevK); } }
    if (race.tf) { const L = race.tf; if (L.ev !== tfSeen) { for (const e of L.log) if (e.n > tfSeen) roadEvent(e.k, e.c, P); tfSeen = L.ev; } roadSound(P); }   // (the traffic's events in order: two in one step both heard)
    if (race.pol && race.pol.ev !== polSeen) for (const e of race.pol.log) if (e.n > polSeen) { polSeen = e.n; policeEvent(e.k, P, e); }
    if (race.chr && race.chr.q.length) for (const e of race.chr.q.splice(0)) chrEvent(e.k, e.c, P);
    if (race.wst && race.wst.tyres && P.ty && !dryHint && P.ty.k === 'wet' && race.wst.wx && race.wst.line < 0.12 && race.rain === 0 && phase === 'racing' && !P.finished) {   // (the line is dry: time for slicks)
      dryHint = true; toast(tr('Idealna linija je suha: dežne gume se na suhem hitro obrabijo. Zapelji v bokse po suhe gume.'), 4600); Comm.say('dryLine', null, 2); }
    if (track.def.pit && !pitHint && dmgOn() && P.dmg > 0.45 && phase === 'racing') { pitHint = true; Comm.say('pitAdvice', null, 3); }   // (the commentator tells where the pits are, no text on the screen)
    if (P.pitState === 'repair' && (!Render.crew || !Render.crew.P || Render.crew.gunOn)) { pitWrenchT -= dt; if (pitWrenchT <= 0) { pitWrenchT = 0.28 + Math.random() * 0.35; Sfx.wrench(); } }   // (with the crew: while the wheel guns rattle)
    if (P.propSnd) { Sfx.knock(P.propSnd, P.propSndV); if (P.propSndV > 9 && (P.propSnd === 'tstack' || P.propSnd === 'bstack' || P.propSnd === 'rbstack' || P.propSnd === 'crate')) vibrate(25); P.propSnd = null; P.propSndV = 0; }   // knocked a cone, tyres or bales
    if (P.fall && !fallSeen && phase === 'racing') { fallSeen = true; showMsg(tr('ZGRMEL SI V PREPAD!'), 'slow', 2); Sfx.thud(1); vibrate(150); } else if (!P.fall) fallSeen = false;   // (Uncompahgre: over the edge of a drop, Race._fall)
    for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; }
  }
  let fallSeen = false;

  /* ---------------- the open road (Vršič: the duel in the traffic, the run from the police) ---------------- */
  // what happened on the road (race.tf.log: someone on foot or on a bicycle run over, a crash with the traffic) and with the police
  // (race.pol.log: the checkpoint, the chase, one more patrol car, a spike strip laid, a roadblock ahead, a flat tyre, a patrol car out of it,
  // the building at the top); the siren of the nearest chasing patrol car, the horns of the traffic
  let tfSeen = 0, polSeen = 0, tfHits = { ped: 0, bike: 0 }, polRun = { why: '', docs: false, park: false };   // (polRun: how the checkpoint went: fled how, asked for the documents, told to park)
  function roadEvent(k, c, P) {
    if (phase !== 'racing' || P.finished) return;
    const pen = race.pol ? '' : ' +5 s';
    if (c === P) {
      if (k === 'ped') { tfHits.ped++; showMsg(tr('POVOZIL SI PEŠCA!') + pen, 'slow', 2); Sfx.thud(0.8); vibrate(70); Comm.say('pedHit', null, 3); }
      else if (k === 'bike') { tfHits.bike++; showMsg(tr('POVOZIL SI KOLESARJA!') + pen, 'slow', 2); Sfx.thud(0.9); vibrate(70); Comm.say('bikeHit', null, 3); }
      else if (k === 'crash' && Math.random() < 0.5) Comm.say('trafficCrash', null, 2);
      if (rdOn) rdRoad(k, P);   // (the run from the police on Vršič: the radio hears of it)
    } else if (c && !c.police && (k === 'ped' || k === 'bike')) showMsg(tr(k === 'ped' ? 'TEKMEC JE POVOZIL PEŠCA' : 'TEKMEC JE POVOZIL KOLESARJA') + pen, 'gold', 1.6);
  }
  function policeEvent(k, P, e) {
    e = e || { s: P.q.s, u: 0, kind: '' };
    if (rdOn) polRadio(k, e, P);
    if (k === 'fled') polRun.why = e.why || 'drive';
    else if (k === 'chkDocs') polRun.docs = true;
    else if (k === 'chkPark') polRun.park = true;
    else if (k === 'chkParked') chkShot();   // (the driver gets out: the walk to the patrol car, filmed up the road)
    else if (k === 'hideout' && Render.goalShot) { Render.goalShot(race.pol.goal); $('hud').classList.add('shot'); }   // (into the building at the top: the camera outside its door)
    if (phase !== 'racing' || P.finished) return;
    if (!rdOn && POL_COMM[k]) Comm.say(POL_COMM[k], null, k === 'join' || k === 'wreck' ? 2 : 3);   // (a road the radio does not know: the commentator)
    if (k === 'fled') { showMsg(tr(e.why === 'hit' ? 'ZBIL SI POLICISTA!' : 'POLICIJA TE LOVI!'), 'slow', 2.2); if (e.why === 'hit') { Sfx.thud(0.9); vibrate(70); } }
    else if (k === 'spikes') showMsg(tr('BODIČASTI TRAK!'), 'slow', 2.2);
    else if (k === 'block') showMsg(tr(e.heavy ? 'TEŽKA ZAPORA NAPREJ!' : 'ZAPORA NAPREJ!'), 'slow', 2.2);
    else if (k === 'flat') { showMsg(tr('PREBITA GUMA!'), 'slow', 2); Sfx.pop(); vibrate(90); }
    else if (k === 'ram') vibrate(50);
    else if (k === 'wreck') showMsg(tr('PATRULJA JE IZLOČENA!'), 'fast', 1.6);
    else if (k === 'heli') showMsg(tr('HELIKOPTER!'), 'slow', 2);
    else if (k === 'ambush') showMsg(tr('ZASEDA!'), 'slow', 2);
    else if (k === 'undercover') showMsg(tr('NEOZNAČENA PATRULJA!'), 'slow', 2.2);
    else if (k === 'lost') showMsg(tr('IZGUBILI SO SLED!'), 'fast', 2.2);
    else if (k === 'spotted') showMsg(tr('SPET TE VIDIJO!'), 'slow', 1.8);
    else if (k === 'motoDown') { if (e.byP) { showMsg(tr('ZBIL SI POLICISTA!'), 'slow', 2); Sfx.thud(0.9); vibrate(70); } }
    else if (k === 'logs') { showMsg(tr('HLODI NA CESTI!'), 'fast', 2); Sfx.thud(1); setTimeout(() => Sfx.thud(0.7), 180); vibrate(60); }
  }

  /* ---------------- the police radio (the run from the police) ----------------
     Instead of the commentator (Comm.setRadioMode) the police talk on the radio the whole run, in Slovenian (Comm.radio: a voice that reads it;
     none: an English voice reads the line's English twin, the places spelt for it; no speech: captions only). The squelch opens, the line is
     said and shown at the bottom (its speaker's call sign first), the roger beep closes it, low static under it (Sfx.radioOpen / radioClose /
     radioBed). Who talks: the dispatcher (OKC Kranj), the units by their call signs (a patrol car by its unit number: Kranjska Gora 2; the
     motorcyclists, the unmarked car, the van), the helicopter (Bober, from Brnik), the station across the pass (PP Bovec); in person (no
     squelch) the officer at the checkpoint and the player's driver. A queue by priority (0 chatter, 1 an event, 2 a turn of the run, 3 in
     person; one too old is dropped, two up cuts in), never the same variant of a line twice running. Chatter by the stage: routine traffic
     before the checkpoint; the car called in there; in the chase where the player is (the real places: the streets of Kranjska Gora, Jasna,
     the bridge, the hairpins by number, the huts, the pass), how fast and which way, the requests and the replies (spike strips, roadblocks,
     the helicopter, no firearms, the road closed on the Trenta side, backup), the search once they lost the player; every event of the core
     (race.pol.log) and the people run over (race.tf.log) */
  // the places by the road: [locative with its preposition, dative (after 'proti'), instrumental (after 'pred'), English, its English preposition]
  const RD_PL = { 'Kranjska Gora': ['v Kranjski Gori', 'Kranjski Gori', 'Kranjsko Goro', 'Kranyska Gora', 'in'], 'Jasna': ['pri Jasni', 'Jasni', 'Jasno', 'Lake Yasna', 'at'],
    'Razgledni stolp': ['pri razglednem stolpu na Jasni', 'razglednemu stolpu', 'razglednim stolpom', 'the lookout tower at Yasna', 'by'], 'Eriški most': ['pri Eriškem mostu', 'Eriškemu mostu', 'Eriškim mostom', 'the Erishki bridge', 'at'],
    'Šumica': ['pri Šumici', 'Šumici', 'Šumico', 'Shoomitsa', 'at'], 'Ruski križ': ['pri Ruskem križu', 'Ruskemu križu', 'Ruskim križem', 'the Russian Cross', 'at'],
    'Mihov dom': ['pri Mihovem domu', 'Mihovemu domu', 'Mihovim domom', 'Meehov dom', 'at'], 'Ruska kapelica': ['pri Ruski kapelici', 'Ruski kapelici', 'Rusko kapelico', 'the Russian Chapel', 'at'],
    'Koča na Gozdu': ['pri Koči na Gozdu', 'Koči na Gozdu', 'Kočo na Gozdu', 'Kocha na Gozdu', 'at'], 'Ajdovska deklica': ['pod Ajdovsko deklico', 'Ajdovski deklici', 'Ajdovsko deklico', 'the Heathen Maiden', 'below'],
    'Tonkina koča': ['pri Tonkini koči', 'Tonkini koči', 'Tonkino kočo', 'Tonkina kocha', 'at'], 'Erjavčeva koča': ['pri Erjavčevi koči', 'Erjavčevi koči', 'Erjavčevo kočo', 'the Erjavets hut', 'at'],
    'Vršič': ['na Vršiču', 'Vršiču', 'Vršičem', 'the Vrshich pass', 'on'], 'Tičarjev dom': ['pri Tičarjevem domu', 'Tičarjevemu domu', 'Tičarjevim domom', 'Ticharyev dom', 'at'],
    'Poštarski dom': ['pri Poštarskem domu', 'Poštarskemu domu', 'Poštarskim domom', 'Poshtarski dom', 'at'] };
  const RD_EXTRA = [['Razgledni stolp', 2106], ['Tičarjev dom', 12593], ['Poštarski dom', 12667]];   // (by the road, not among def.names: metres after the start line)
  // the streets of Kranjska Gora (Track.stubs by name): [in it, into it, out of it, with it (a junction), English, its dead end, English 'on' (a road) not 'in']
  const RD_ST = { 'Naselje Slavka Černeta': ['v Naselju Slavka Černeta', 'v Naselje Slavka Černeta', 'iz Naselja Slavka Černeta', 'z Naseljem Slavka Černeta', 'the Slavko Cherne estate', 'ulica', 0],
    'Koroška ulica': ['v Koroški ulici', 'v Koroško ulico', 'iz Koroške ulice', 's Koroško ulico', 'Koroshka street', 'ulica', 0],
    'Borovška cesta': ['na Borovški cesti', 'na Borovško cesto', 'z Borovške ceste', 'z Borovško cesto', 'Borovshka street', 'dela', 1],
    'Ulica Josipa Vandota': ['v Ulici Josipa Vandota', 'v Ulico Josipa Vandota', 'iz Ulice Josipa Vandota', 'z Ulico Josipa Vandota', 'Vandot street', 'ulica', 0],
    'Podbreg': ['v Podbregu', 'v Podbreg', 'iz Podbrega', 's Podbregom', 'Podbreg', 'ulica', 0],
    'Ulica dr. Josipa Tičarja': ['v Ulici dr. Josipa Tičarja', 'v Ulico dr. Josipa Tičarja', 'iz Ulice dr. Josipa Tičarja', 'z Ulico dr. Josipa Tičarja', 'Tichar street', 'ulica', 0],
    'Naselje Ivana Krivca': ['v Naselju Ivana Krivca', 'v Naselje Ivana Krivca', 'iz Naselja Ivana Krivca', 'z Naseljem Ivana Krivca', 'the Ivan Krivets estate', 'ulica', 0] };
  // a side road without a name by its kind (0 a street, 1 a driveway, 2 a forest road; a driveway of gravel), as RD_ST
  const RD_SK = [['v stranski ulici', 'v stransko ulico', 'iz stranske ulice', 's stransko ulico', 'a side street', 'ulica', 0], ['na dovozni poti', 'na dovozno pot', 'z dovozne poti', 'z dovozno potjo', 'a driveway', 'pot', 1],
    ['na gozdni cesti', 'na gozdno cesto', 'z gozdne ceste', 'z gozdno cesto', 'a forest road', 'cesta', 1]], RD_SKG = ['na makadamski poti', 'na makadamsko pot', 'z makadamske poti', 'z makadamsko potjo', 'a gravel track', 'pot', 1];
  const RD_DEAD = { ulica: ['to je slepa ulica', 'it is a dead end'], cesta: ['to je slepa cesta', 'it is a dead end'], pot: ['to je slepa pot', 'it is a dead end'], dela: ['tam je cesta zaprta zaradi del', 'the road is closed for works there'] };
  // the speakers: [caption, call sign said in Slovenian, in English] (the units: rdCall)
  const RD_WHO = { okc: ['OKC KRANJ', '', ''], heli: ['BOBER', 'Bober', 'Bober'], bov: ['PP BOVEC', 'Postaja Bovec', 'Bovets station'], cop: ['POLICIST', '', ''], drv: ['TI', '', ''] };
  const rdCall = (u, kind) => kind === 'moto' ? [tr('MOTORIST {0}', u), 'Motorist ' + u, 'Bike ' + u] : kind === 'uc' ? [tr('CIVILNA {0}', u), 'Civilna ' + u, 'Unmarked ' + u] : kind === 'van' || !u ? [tr('KOMBI'), 'Kombi', 'Van'] : ['KG-' + u, 'Kranjska Gora ' + u, 'Kranyska Gora ' + u];   // (the labels on the page in its language)
  // the player's car as the police describe it: the colour (the formula is feminine), the model ([Slovenian, English])
  const RD_COL = [['rdeč', 'rdeča', 'red'], ['bel', 'bela', 'white'], ['moder', 'modra', 'blue'], ['rumen', 'rumena', 'yellow'], ['črn', 'črna', 'black'], ['zelen', 'zelena', 'green'], ['oranžen', 'oranžna', 'bright orange'], ['vijoličen', 'vijolična', 'purple']];
  // the lines: key -> its variants [Slovenian, English] ({at} where, {to} which way, {dir} heading for, {v} km/h, {car} the player's car, {U} the
  // unit spoken to, {sacc} / {sgen} / {sloc} into / out of / in a side road, {dead} its dead end)
  const RL = {
    chkSeen: [['Proti kontroli prihaja {car}. Ustavljam {ga}.', 'A {car} coming up to the checkpoint. Pulling it over.'], ['Prihaja {car}, smer Vršič. Ustavil {ga} bom.', 'A {car} heading for the pass. I will stop it.'], ['Na kontroli ustavljam {carA}.', 'Stopping a {car} at the checkpoint.']],
    chkSeenFast: [['Proti kontroli zelo hitro prihaja {car}! Ustavil {ga} bom.', 'A {car} coming up to the checkpoint very fast! I will stop it.']],
    chkStop: [['Voznik je ustavil, grem k njemu.', 'He has stopped, going over to him.'], ['Ustavil je, preverjam dokumente.', 'He has stopped, checking his papers.']],
    chkDocs: [['Dober dan, prometna kontrola. Vozniško in prometno dovoljenje, prosim.', 'Good afternoon, traffic control. Driving licence and registration, please.'], ['Dober dan, policija. Vozniško in prometno dovoljenje, prosim.', 'Good afternoon, police. Licence and registration, please.']],
    chkNoDocs: [['Ehm... nimam jih pri sebi.', 'Erm... I don\'t have them on me.'], ['Ehm... nimam jih pri sebi. Doma so ostali.', 'Erm... I don\'t have them on me. I left them at home.']],
    chkPark: [['Potem zapeljite ob rob vozišča, parkirajte in pojdite z mano na policijsko postajo.', 'Then pull over to the side of the road, park, and come with me to the police station.'], ['Potem zapeljite ob rob vozišča in parkirajte. Z mano greste na policijsko postajo.', 'Then pull over to the side of the road and park. You are coming with me to the police station.']],
    chkParked: [['Ugasnite motor in izstopite, prosim.', 'Switch off the engine and step out, please.'], ['Izstopite, prosim. Greva do patrulje.', 'Step out, please. We are going to the patrol car.']],
    chkTake: [['Voznik nima dokumentov, peljemo ga na postajo.', 'The driver has no papers, we are taking him to the station.'], ['Voznik brez dokumentov, pridržan. Peljemo ga na postajo.', 'A driver without papers, detained. Taking him to the station.']],
    arrested: [['Razumem, {U}. Vozilo ostane ob Vršiški cesti, pošiljam pajka.', 'Copy, {U}. The car stays on the Vrshich road, sending a tow truck.'], ['Razumem, {U}. Pripeljite ga na postajo.', 'Copy, {U}. Bring him to the station.']],
    fledShout: [['Stojte! Policija!', 'Stop! Police!'], ['Hej! Ustavite!', 'Hey! Stop!'], ['Stoj! Stoj!', 'Stop! Stop!']],
    fledSkip: [['Voznik ni ustavil, zapeljal je skozi kontrolo! Gre za {carA}, smer Jasna. Gremo za njim!', 'The driver did not stop, he drove straight through the checkpoint! A {car}, heading for Lake Yasna. In pursuit!'], ['Ni ustavil na kontroli na Vršiški cesti! Gre za {carA}, gremo za njim!', 'He did not stop at the checkpoint on the Vrshich road! A {car}, in pursuit!']],
    fledDrive: [['Voznik je pobegnil s kontrole na Vršiški cesti! Gre za {carA}, smer Vršič. Gremo za njim!', 'The driver has fled the checkpoint on the Vrshich road! A {car}, heading for the pass. In pursuit!'], ['Ustavil je, potem pa speljal s kontrole! Gre za {carA}. Gremo za njim!', 'He stopped, then drove off from the checkpoint! A {car}. In pursuit!']],
    fledDocs: [['Pobegnil je s kontrole, ko sem hotel dokumente! Gre za {carA}, smer Vršič. Gremo za njim!', 'He drove off when I asked for his papers! A {car}, heading for the pass. In pursuit!']],
    fledPark: [['Namesto da bi parkiral, je pobegnil s kontrole! Gre za {carA}, smer Vršič. Gremo za njim!', 'Instead of pulling over he has fled the checkpoint! A {car}, heading for the pass. In pursuit!']],
    fledHit: [['Voznik je zbil policista na kontroli in pobegnil! Pošljite reševalce na Vršiško cesto!', 'The driver has knocked down an officer at the checkpoint and fled! Send an ambulance to the Vrshich road!']],
    fledAll: [['Razumem. Vsem enotam: pobegli voznik na Vršiški cesti, vozilo je {car}, smer Jasna in Vršič. Previdno.', 'Copy. All units: a driver fleeing on the Vrshich road, a {car}, heading for Lake Yasna and the pass. Careful.'], ['Razumem, {U}. Vsem enotam: pobeg s kontrole v Kranjski Gori, vozilo je {car}, smer Vršič.', 'Copy, {U}. All units: a driver has fled the checkpoint in Kranyska Gora, a {car}, heading for the pass.']],
    join: [['Priključujem se zasledovanju {at}.', 'Joining the pursuit {at}.'], ['Za vami sem {at}.', 'Right behind you {at}.'], ['Na poti sem, za vami {at}.', 'On my way, behind you {at}.']],
    joinMoto: [['Na motorju sem za njim {at}.', 'On the bike, on his tail {at}.'], ['Za njim sem {at}, v serpentinah sem hitrejši.', 'On his tail {at}, I am quicker in the hairpins.']],
    joinStub: [['Prihajam {sgen}, pred njim sem!', 'Coming {sgen}, I am ahead of him!'], ['Čakal sem {sloc}, zdaj grem ven pred njega!', 'I was waiting {sloc}, pulling out in front of him!']],
    spikes: [['Bodice so položene {at}.', 'The stinger is down {at}.'], ['Trak z bodicami je čez cesto {at}.', 'Spike strip across the road {at}.'], ['Bodice {at} so pripravljene, čakamo ga.', 'Spikes ready {at}, waiting for him.']],
    block: [['Zapora {at} je postavljena.', 'The roadblock {at} is in place.'], ['Cesta {at} je zaprta z vozili.', 'The road is blocked with cars {at}.']],
    blockHeavy: [['Kombi stoji prečno čez cesto {at}, z bodicami. Ne bo prišel skozi!', 'A van across the road {at}, with spikes. He won\'t get through!'], ['Težka zapora {at}: kombi, patrulja in bodice.', 'A heavy roadblock {at}: a van, a patrol car and spikes.']],
    flat: [['Zadel je bodice, guma je prebita!', 'He hit the spikes, a tyre is gone!'], ['Prebita guma! Upočasnjuje.', 'Flat tyre! He is slowing down.'], ['Bodice so ga dobile!', 'The spikes got him!']],
    ram: [['Zadel sem ga, še vedno pelje.', 'Made contact, he is still going.'], ['Kontakt! Še vedno vozi.', 'Contact! Still moving.'], ['Rinem ga s ceste!', 'Pushing him off the road!']],
    wreck: [['Avto je razbit, izločen sem {at}. Potrebujem vleko.', 'The car is wrecked, I am out {at}. I need a tow.'], ['Ne morem več naprej, avto je uničen {at}.', 'I cannot go on, the car is finished {at}.']],
    wreckFlat: [['Prebite gume, ne morem naprej {at}.', 'My tyres are gone, I cannot go on {at}.'], ['Vozim na platiščih, izločen sem {at}.', 'I am on the rims, I am out {at}.']],
    wreckStuck: [['Obtičal sem {at}. Nadaljujte brez mene.', 'I am stuck {at}. Carry on without me.'], ['Zagozdil sem se {at}, ne pridem ven.', 'I am wedged in {at}, I cannot get out.']],
    motoDownP: [['Motorist je padel {at}! Osumljenec ga je zbil. Pošljite reševalce!', 'The motorcyclist is down {at}! The suspect knocked him off. Send an ambulance!'], ['Zbil je našega motorista {at}! Rabimo reševalce!', 'He has knocked our motorcyclist off {at}! We need an ambulance!']],
    motoDown: [['Padel sem {at}. V redu sem, nadaljujte.', 'I came off {at}. I am fine, carry on.'], ['Motor mi je zdrsnil {at}. Nič hudega, nadaljujte.', 'My bike slid away {at}. Nothing serious, carry on.']],
    heli: [['Nad osumljencem sem {at}. Vidim ga.', 'Over the suspect {at}. I have him.'], ['Prevzemam sledenje {at}. Ne bo nam ušel.', 'Taking over the pursuit {at}. He won\'t get away.']],
    heliOut: [['Gorivo mi pohaja, vračam se na Brnik.', 'Running low on fuel, heading back to Brnik.'], ['Moram natočiti gorivo. Nadaljujte brez mene.', 'I need to refuel. Carry on without me.']],
    ambush: [['V zasedi {at}: vidim ga, grem za njim!', 'Waiting {at}: I see him, going after him!'], ['Peljal je mimo zasede {at}. Za njim sem!', 'He went past the ambush {at}. On him!']],
    undercover: [['Osumljenec je tik za mano, prižigam modre luči!', 'The suspect is right behind me, lights on!'], ['Pred njim sem {at}, zaviram ga!', 'I am ahead of him {at}, slowing him down!']],
    lost: [['Izgubil sem ga {at}.', 'I have lost him {at}.'], ['Ne vidim ga več. Zadnjič je bil {at}.', 'I cannot see him any more. Last seen {at}.']],
    lostAll: [['Vsem enotam: preiščite cesto {to} in stranske poti.', 'All units: search the road {to} and the side roads.'], ['Vsem enotam: osumljenca iščemo {at}. Preverite gozdne ceste.', 'All units: we are looking for the suspect {at}. Check the forest roads.']],
    spotted: [['Spet ga vidim {at}!', 'I have him again {at}!'], ['Imamo ga spet, {at}, smer {dir}!', 'Got him again, {at}, heading for {dir}!']],
    busted: [['Osumljenec je ustavljen {at}. Aretacija!', 'The suspect is stopped {at}. Making the arrest!'], ['Imamo ga {at}! Konec je.', 'We have him {at}! It is over.']],
    bustedAll: [['Razumem. Vsem enotam: zasledovanje je končano.', 'Copy. All units: the pursuit is over.'], ['Odlično. Vsem enotam: konec zasledovanja.', 'Well done. All units: the pursuit is over.']],
    logs: [['Pozor, hlodi na cesti {at}! Vse enote, previdno!', 'Watch out, logs on the road {at}! All units, careful!'], ['Hlodi so se zakotalili čez cesto {at}!', 'Logs rolling across the road {at}!']],
    logHit: [['Zapeljal sem na hlode!', 'I have hit the logs!'], ['Hlodi! Zadel sem jih.', 'Logs! I hit them.']],
    hideout: [['Izgubili smo ga na Vršiču. Kot bi se udrl v zemljo.', 'We have lost him on Vrshich. Vanished into thin air.'], ['Na prelazu ga ni več. Nikjer ga ne vidim.', 'He is gone at the pass. I cannot see him anywhere.']],
    hideoutAll: [['Vsem enotam: preverite parkirišča na prelazu in cesto proti Trenti.', 'All units: check the car parks at the pass and the road to Trenta.'], ['Vsem enotam: preverite parkirišče pri Poštarskem domu in koče na prelazu.', 'All units: check the car park at Poshtarski dom and the huts at the pass.']],
    hideoutBov: [['Pri Tičarjevem domu ga ni bilo, cesta v Trento je zaprta.', 'He did not come past Ticharyev dom, the road to Trenta is closed.']],
    stubIn: [['Zavil je {sacc}, {dead}! Gremo za njim, zaprite izvoz.', 'He turned {sacc}, {dead}! Going in after him, block the exit.'], ['Osumljenec je zavil {sacc}. Za njim sem, {dead}!', 'The suspect turned {sacc}. I am on him, {dead}!']],
    stubInAck: [['Razumem. Naslednja enota naj zapre izvoz.', 'Copy. Next unit, block the exit.'], ['Razumem. Ostanite pri izvozu, da ne uide.', 'Copy. Stay at the exit so he does not get away.']],
    stubEnd: [['Na koncu ceste je, obkoljen! Ne more nikamor.', 'He is at the end of the road, boxed in! Nowhere to go.'], ['Konec ceste, obkoljen je. Pazite, lahko se obrne!', 'End of the road, he is surrounded. Careful, he may turn round!']],
    stubOut: [['Spet je na glavni cesti {at}, smer {dir}!', 'Back on the main road {at}, heading for {dir}!'], ['Ušel je {sgen}, spet je na glavni cesti!', 'He got {sgen}, back on the main road!']],
    ped: [['Povozil je pešca {at}! Pokličite reševalce!', 'He has run over a pedestrian {at}! Call an ambulance!'], ['Pešec je povožen {at}! Rabimo reševalce!', 'A pedestrian has been hit {at}! We need an ambulance!']],
    pedFree: [['Vsem enotam: {at} je voznik povozil pešca in odpeljal naprej. Vozilo je {car}, smer Vršič.', 'All units: a driver has run over a pedestrian {at} and driven on. A {car}, heading for the pass.']],
    bike: [['Zbil je kolesarja {at}! Potrebujemo reševalce.', 'He has knocked a cyclist off {at}! We need an ambulance.'], ['Kolesar je zbit {at}, pokličite reševalce!', 'A cyclist has been hit {at}, call an ambulance!']],
    bikeFree: [['Vsem enotam: {at} je voznik zbil kolesarja in odpeljal naprej. Vozilo je {car}.', 'All units: a driver has knocked a cyclist off {at} and driven on. A {car}.']],
    medic: [['Reševalci so na poti.', 'An ambulance is on its way.'], ['Razumem, pošiljam reševalce.', 'Copy, sending an ambulance.']],
    crash: [['Trčil je v vozilo {at}, pelje naprej!', 'He hit a car {at}, still going!'], ['Zadel je avto {at} in vozi naprej!', 'He has hit a car {at} and keeps going!']],
    pos: [['Osumljenec je {at}, pelje {to}, okoli {v} km/h.', 'The suspect is {at}, heading {to}, doing about {v}.'], ['Sem za njim {at}, hitrost {v} km/h, smer {dir}.', 'Behind him {at}, doing {v}, heading for {dir}.'], ['Še vedno ga imam, {at}. Pelje {to}.', 'Still have him, {at}. Heading {to}.'], ['Je {at}, okoli {v} km/h. Ostajam za njim.', 'He is {at}, about {v}. Staying with him.']],
    posVillage: [['Divja skozi Kranjsko Goro, {v} km/h! Pazite na pešce.', 'Tearing through Kranyska Gora at {v}! Watch out for people on foot.'], ['Po Vršiški cesti pelje {v} km/h, proti Jasni.', 'Doing {v} up the Vrshich road, towards Lake Yasna.']],
    posJasna: [['Pelje mimo jezera Jasna, {v} km/h.', 'Going past Lake Yasna at {v}.'], ['Ob jezeru Jasna je, pelje {to}.', 'He is by Lake Yasna, heading {to}.']],
    posHair: [['V serpentinah je, {at}. Tlakovci so spolzki.', 'In the hairpins, {at}. The cobbles are slippery.'], ['Gre skozi serpentine, {at}, smer {dir}.', 'Going through the hairpins, {at}, heading for {dir}.']],
    posFast: [['Vozi kot nor, {at}, {v} km/h!', 'Driving like a maniac, {at}, {v}!'], ['Nevarna vožnja {at}, več kot {v} km/h!', 'Dangerous driving {at}, over {v}!']],
    posSlow: [['Upočasnil je {at}. Morda bo ustavil.', 'He has slowed down {at}. He may stop.'], ['Komaj še pelje, {at}. Pripravite se.', 'He is barely moving, {at}. Get ready.']],
    posDown: [['Obrnil je! Pelje nazaj proti Kranjski Gori, {at}.', 'He has turned round! Heading back down to Kranyska Gora, {at}.'], ['Pozor, vozi navzdol, {at}!', 'Careful, he is driving back down, {at}!']],
    posTop: [['Skoraj je na prelazu, na 1611 metrih. Pelje {to}.', 'Nearly at the top of the pass, sixteen hundred metres up. Heading {to}.'], ['Tik pod vrhom Vršiča je, okoli {v} km/h.', 'Just below the top of Vrshich, about {v}.']],
    posStub: [['Še vedno je {at}, za njim smo.', 'Still {at}, we are right behind him.'], ['Je {at}, ven ne more.', 'He is {at}, he cannot get out.']],
    posHeli: [['Vidim ga {at}, pelje {to}.', 'I see him {at}, heading {to}.'], ['Še vedno je pod mano, {at}, okoli {v} km/h.', 'Still right below me, {at}, about {v}.']],
    ack: [['Razumem, {U}.', 'Copy, {U}.'], ['Razumem. Ostanite za njim.', 'Copy. Stay with him.'], ['Razumem, {U}. Pazite na promet.', 'Copy, {U}. Mind the traffic.']],
    spikeAsk: [['Prosim za dovoljenje za bodice {at}.', 'Requesting permission for a stinger {at}.'], ['OKC, lahko položimo bodice {at}?', 'Control, can we lay a stinger {at}?']],
    spikeOk1: [['Odobreno, {U}. Samo bodice, orožje ni dovoljeno.', 'Approved, {U}. Spikes only, no firearms.']],
    spikeOk: [['Dovoljenje odobreno. Bodice {at}.', 'Permission granted. A stinger {at}.'], ['Odobreno, {U}.', 'Approved, {U}.']],
    blockSet: [['Postavljamo zaporo {at}.', 'Setting up a roadblock {at}.'], ['Gremo zapret cesto {at}.', 'Going to close the road {at}.']],
    blockOk: [['Razumem. Previdno, voznik je nevaren.', 'Copy. Careful, the driver is dangerous.'], ['Razumem, {U}. Pustite vrzel za promet.', 'Copy, {U}. Leave a gap for the traffic.']],
    heliAsk: [['OKC, potrebujemo helikopter!', 'Control, we need the helicopter!'], ['Prosim za helikopter, ne moremo ga dohiteti.', 'Requesting the helicopter, we cannot catch him.']],
    heliOk: [['Bober vzleta z Brnika.', 'Bober is taking off from Brnik.'], ['Razumem. Bober je že na poti z Brnika.', 'Copy. Bober is already on its way from Brnik.']],
    guns: [['Lahko streljamo v gume?', 'Can we shoot at his tyres?']],
    gunsNo: [['Negativno! Orožje ni dovoljeno, samo bodice.', 'Negative! No firearms, spikes only.']],
    trenta: [['Obvestili smo policijsko postajo Bovec. Cesto zapirajo na trentarski strani, pri Tičarjevem domu.', 'Bovets station is informed. They are closing the road on the Trenta side, at Ticharyev dom.']],
    trentaBov: [['Cesta je zaprta pri Tičarjevem domu. Čez prelaz ne bo prišel.', 'The road is closed at Ticharyev dom. He won\'t get over the pass.']],
    backup: [['Potrebujemo okrepitve!', 'We need backup!'], ['OKC, pošljite še eno enoto!', 'Control, send another unit!']],
    backupOk: [['Pošiljam enoto z Jesenic.', 'Sending a unit from Yesenitse.'], ['Razumem, okrepitve so na poti.', 'Copy, backup is on its way.']],
    where: [['Kje je osumljenec? Javite položaj.', 'Where is the suspect? Report his position.']],
    whereU: [['Ne vidim ga, zadnjič je bil {at}.', 'I have lost sight of him, last seen {at}.'], ['Nimam ga na očeh. Nazadnje {at}.', 'I do not have him in sight. Last seen {at}.']],
    search: [['Vsem enotam: iščemo ga {at}. Preverite stranske poti in parkirišča.', 'All units: we are searching {at}. Check the side roads and the car parks.'], ['Vsem enotam: počasi naprej in glejte v gozdne ceste {at}.', 'All units: slowly on, look into the forest roads {at}.']],
    searchU: [['{at} ga ni.', 'He is not {at}.'], ['Preverjam cesto {at}, nič.', 'Checking the road {at}, nothing.']]
  };
  // before the checkpoint: routine traffic on the radio, one exchange at a time ([who, Slovenian, English]; u1..u3 the units of Kranjska Gora;
  // the first one always: the checkpoint set up), the weather's own (RD_WX)
  const RD_FREE = [
    [['okc', 'Vsem enotam: na Vršiški cesti v Kranjski Gori je postavljena kontrola prometa.', 'All units: a traffic checkpoint is set up on the Vrshich road in Kranyska Gora.'], ['u1', 'Kontrola stoji, ustavljamo vozila proti Vršiču.', 'The checkpoint is up, stopping cars heading for the pass.']],
    [['okc', 'Kranjska Gora 2, manjša prometna nesreča v Gozdu Martuljku, brez poškodovanih. Prevzemi.', 'Unit two, a minor collision at Gozd Martoolyek, nobody hurt. Take it.'], ['u2', 'Razumem, na poti sem.', 'Copy, on my way.']],
    [['okc', 'Vsem enotam: skupina kolesarjev na cesti proti Jasni. Previdno.', 'All units: a group of cyclists on the road to Lake Yasna. Careful.']],
    [['u3', 'Patrulja v Podkorenu, vse je mirno.', 'Patrol at Podkoren, all quiet.'], ['okc', 'Razumem, Kranjska Gora 3.', 'Copy, unit three.']],
    [['okc', 'Kranjska Gora 1, kako je na kontroli?', 'Unit one, how is the checkpoint?'], ['u1', 'Mirno. Nekaj turistov, vsi imajo dokumente.', 'Quiet. A few tourists, all with their papers.']],
    [['okc', 'Pohodniki pri Erjavčevi koči prijavljajo slabo parkirana vozila ob cesti.', 'Hikers at the Erjavets hut report cars parked badly along the road.'], ['u3', 'Razumem, pogledam, ko bom zgoraj.', 'Copy, I will have a look when I am up there.']],
    [['u2', 'Pri Jasni je veliko pešcev, previdno skozi.', 'Lots of people on foot at Lake Yasna, go easy through there.']],
    [['okc', 'Avtobus proti Vršiču je odpeljal iz Kranjske Gore, ustavlja na vseh postajah.', 'The bus to Vrshich has left Kranyska Gora, stopping at every stop.']],
    [['u1', 'Na kontroli smo oglobili voznika brez varnostnega pasu.', 'We fined a driver without a seat belt at the checkpoint.']],
    [['okc', 'Pri Ruski kapelici je danes spominska slovesnost, na cesti bo več avtobusov.', 'A memorial at the Russian Chapel today, more buses on the road.']],
    [['bov', 'Kolegi, na trentarski strani je vse mirno.', 'All quiet on the Trenta side, colleagues.']]];
  const RD_WX = { dry: [['okc', 'Poročilo z Vršiča: cesta je prevozna, na prelazu je gneča.', 'Report from Vrshich: the road is open, busy at the pass.']],
    rain: [['okc', 'Na Vršiču dežuje, tlakovane serpentine so spolzke.', 'It is raining on Vrshich, the cobbled hairpins are slippery.']],
    snow: [['okc', 'Na Vršiču sneži, vozila brez verig obračamo pri Mihovem domu.', 'Snow on Vrshich, cars without chains are turned back at Meehov dom.']] };
  // the hairpins' ordinals as a Slovenian voice says them (stems; the ending by the case: pri osmi, med osmo in deveto)
  const RD_ORD = ['', 'prv', 'drug', 'tretj', 'četrt', 'pet', 'šest', 'sedm', 'osm', 'devet', 'deset', 'enajst', 'dvanajst', 'trinajst', 'štirinajst', 'petnajst', 'šestnajst', 'sedemnajst', 'osemnajst', 'devetnajst', 'dvajset', 'enaindvajset', 'dvaindvajset', 'triindvajset', 'štiriindvajset'];
  const rdOrd = (n, e) => RD_ORD[n] ? RD_ORD[n] + e : n + '.';
  // a caption's text as the voice should read it: the ordinals in words, km/h, metres, "dr."
  const rdSpeech = (t) => t.replace(/(\d+)\. in (\d+)\. serpentin([aeio])/g, (_, a, b, e) => rdOrd(+a, e) + ' in ' + rdOrd(+b, e) + ' serpentin' + e).replace(/(\d+)\. serpentin([aeio])/g, (_, a, e) => rdOrd(+a, e) + ' serpentin' + e)
    .replace(/(\d+) km\/h/g, '$1 na uro').replace(/(\d+) m\b/g, '$1 metrov').replace(/\bdr\. /g, 'doktorja ');
  let rd = null, rdGeoT = null, rdGeoV = null;
  // the roads the radio knows (its places, call signs and chatter are Vršič's): there it speaks instead of the commentator (rdOn: this run's);
  // elsewhere (Los Caracoles) the commentator calls the run from the police (POL_COMM: its lines for the events)
  const rdKnows = (d) => !!d && d.id === 'vrsic';
  let rdOn = false;
  const POL_COMM = { join: 'policeJoin', spikes: 'spikes', block: 'roadblock', flat: 'flat', wreck: 'policeWreck' };
  // the places up the road (def.names, the bus stops, a few more) and the named streets' junctions, in metres after the start line
  function rdGeo() {
    if (rdGeoT === track) return rdGeoV;
    const D = track.def, pl = [], add = (n, d) => { if (RD_PL[n] && !pl.some(p => p.n === n && Math.abs(p.d - d) < 300)) pl.push({ n, d, f: RD_PL[n] }); };
    for (const q of D.names || []) { const m = /^Serpentina \d+ · (.+)$/.exec(q.n); add(m ? m[1] : q.n.split(' · ')[0], q.d); }
    for (const [d, , n] of D.stops || []) add(n, d);
    for (const [n, d] of RD_EXTRA) add(n, d);
    pl.sort((a, b) => a.d - b.d);
    rdGeoT = track; return (rdGeoV = { pl, hp: (D.hairpins || []).map(h => h[0]), st: (track.stubs || []).filter(S => RD_ST[S.name]).map(S => ({ d: S.s0 - track.startS, f: RD_ST[S.name] })) });
  }
  // where s (m along the road) is, as the police say it ([Slovenian, English]); k: the side road it is in (-1 none)
  function rdWhere(s, k) {
    const G = rdGeo(), d = s - track.startS, hp = G.hp;
    if (k >= 0 && track.stubs && track.stubs[k]) return rdStub(track.stubs[k], 0);
    let hi = -1, pb = null;
    for (let i = 0; i < hp.length; i++) if (Math.abs(hp[i] - d) < 60) hi = i;
    for (const p of G.pl) if (Math.abs(p.d - d) < 220 && (!pb || Math.abs(p.d - d) < Math.abs(pb.d - d))) pb = p;
    if (hi >= 0) { const nm = pb && Math.abs(pb.d - hp[hi]) < 25 ? pb : null;   // (a hairpin by its number, and its name: pri 8. serpentini, Ruska kapelica)
      return ['pri ' + (hi + 1) + '. serpentini' + (nm ? ', ' + nm.n : ''), 'at hairpin ' + (hi + 1) + (nm ? ', ' + nm.f[3] : '')]; }
    if (pb) return [pb.f[0], pb.f[4] + ' ' + pb.f[3]];
    let i = 0; while (i < hp.length - 1 && hp[i + 1] < d) i++;
    if (hp.length > 1 && d > hp[0] && d < hp[hp.length - 1] && hp[i + 1] - hp[i] < 700) return ['med ' + (i + 1) + '. in ' + (i + 2) + '. serpentino', 'between hairpins ' + (i + 1) + ' and ' + (i + 2)];
    if (d < 1300) { let sb = null; for (const q of G.st) if (Math.abs(q.d - d) < 60 && (!sb || Math.abs(q.d - d) < Math.abs(sb.d - d))) sb = q;   // (the village: the junctions of its streets)
      return sb ? ['na Vršiški cesti pri križišču ' + sb.f[3], 'on the Vrshich road at the junction with ' + sb.f[4]] : ['na Vršiški cesti v Kranjski Gori', 'on the Vrshich road in Kranyska Gora']; }
    const nx = G.pl.find(p => p.d > d), nh = hp.findIndex(h => h > d), h = nh >= 0 && (!nx || hp[nh] < nx.d);   // (the next place up the road, or the next hairpin: so far below it)
    const gap = h ? hp[nh] - d : nx ? nx.d - d : 1e9, m = Math.max(100, Math.round(gap / 100) * 100);
    if (gap < 950) return h ? ['okoli ' + m + ' m pred ' + (nh + 1) + '. serpentino', 'about ' + m + ' metres below hairpin ' + (nh + 1)] : ['okoli ' + m + ' m pred ' + nx.f[2], 'about ' + m + ' metres below ' + nx.f[3]];
    return nx ? ['na cesti proti ' + nx.f[1], 'on the road to ' + nx.f[3]] : ['pod prelazom', 'below the pass'];
  }
  // a side road as the police name it ([Slovenian, English]); c: 0 in it, 1 into it, 2 out of it; one without a name by its kind and where it is
  function rdStub(S, c) {
    const f = RD_ST[S.name], g = f || (S.kind === 1 && S.grav ? RD_SKG : RD_SK[S.kind] || RD_SK[0]), en = (g[6] ? ['on ', 'onto ', 'off '] : ['in ', 'into ', 'out of '])[c] + g[4];
    if (f) return [g[c], en];
    const at = S.s0 - track.startS < 1300 ? ['v Kranjski Gori', 'in Kranyska Gora'] : rdWhere(S.s0, -1);
    return [g[c] + ' ' + at[0], en + ' ' + at[1]];
  }
  // the side road of an event (its name, kind and junction: extra { stub, sKind }, s)
  const rdStubOf = (e) => (track.stubs || []).find(S => S.name === (e.stub || '') && S.kind === e.sKind && Math.abs(S.s0 - e.s) < 3) || { name: e.stub || '', kind: e.sKind || 0, s0: e.s, grav: false };
  // which way the player drives (up: on to the pass; down: back to Kranjska Gora), towards where
  const rdUp = (P) => !(P.speed > 4 && P.q.i >= 0 && P.vx * track.tx[P.q.i] + P.vz * track.tz[P.q.i] < 0);
  function rdToward(s, up) {
    if (!up) return ['proti Kranjski Gori', 'back down to Kranyska Gora'];
    const nx = rdGeo().pl.find(p => p.d > s - track.startS + 230 && p.d < track.raceLen + 100);   // (past the one they are at: rdWhere names one up to 220 m off)
    return nx ? ['proti ' + nx.f[1], 'towards ' + nx.f[3]] : ['proti prelazu', 'towards the pass'];
  }
  function rdCar() {
    const P = race.player, C = RD_COL[Math.max(0, PLAYER_COLORS.indexOf(P.color))] || RD_COL[0], f = P.m.id === 'formula';
    const nm = P.m.name.split(' ').map(w => /\d/.test(w) || w.length <= 2 ? w : w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
    return [C[f ? 1 : 0] + ' ' + (f ? nm.charAt(0).toLowerCase() + nm.slice(1) : nm), C[2] + ' ' + nm];
  }
  // the player's car for the radio's lines: car (who, what: the nominative), carA (whom, what: the accusative, "gre za ..."), ga (it: ga / jo; the
  // formula is feminine: "rdeča formula Orkan", "rdečo formulo Orkan", "jo")
  function rdCarV() {
    const c = rdCar(), f = race.player.m.id === 'formula', acc = f ? c[0].replace(/a(?= )/g, 'o') : c[0];
    return { car: c, carA: [acc, c[1]], ga: [f ? 'jo' : 'ga', 'it'] };
  }
  // the patrol car in the chase nearest to the player (within r m along the road; in a side road in a straight line): it speaks for the units
  function rdNear(P, r) {
    let b = null, bd = r || 300;
    for (const c of race.pol.cars) { if (c.pol.mode !== 'chase' || c.locked || !c.pol.unit) continue; const d = c.q.k >= 0 || P.q.k >= 0 ? Math.hypot(c.x - P.x, c.z - P.z) : Math.abs(P.q.s - c.q.s); if (d < bd) { bd = d; b = c; } }
    return b;
  }
  const rdUnit = (c) => c ? { u: c.pol.unit, kind: c.pol.kind } : null;
  function radioReset() {
    if (rd && rd.cur && rd.cur.item) Comm.radioStop();
    Sfx.radioBed(false);
    rd = { q: [], cur: null, gapT: 0, capT: 0, chatT: performance.now() / 1000 + 2.2, last: {}, log: [], free: null, said: {}, ramT: -1e9, logT: -1e9, crashT: -1e9 };
    const el = $('h-radio'); el.className = ''; el.textContent = '';
  }
  // a line on the radio: key (its pool in RL: a variant never the same as the last), who ('okc', 'u': a unit, o.u its number, o.kind its kind;
  // 'heli', 'bov'; in person 'cop', 'drv'), vars ({ name: [Slovenian, English] or one value for both }), o.prio (0 chatter .. 3 in person), o.ttl (s)
  function rsay(key, who, vars, o) {
    const pool = RL[key]; if (!pool || !rd) return;
    let k = Math.floor(Math.random() * pool.length); if (pool.length > 1 && k === rd.last[key]) k = (k + 1) % pool.length; rd.last[key] = k;
    rline(who, pool[k][0], pool[k][1], vars, Object.assign({ key }, o));
  }
  function rline(who, sl, en, vars, o) {
    if (!rd) return;
    o = o || {};
    const fill = (t, L) => { const s = t.replace(/\{(\w+)\}/g, (_, n) => { const v = vars && vars[n]; return v == null ? '' : Array.isArray(v) ? v[L] : String(v); }); return s.charAt(0).toUpperCase() + s.slice(1); };
    const person = who === 'cop' || who === 'drv', cs = who === 'u' ? rdCall(o.u || 0, o.kind || 'car') : RD_WHO[who] || RD_WHO.okc, prio = o.prio != null ? o.prio : person ? 3 : 1;
    rd.q.push({ key: o.key || '', who, u: o.u || 0, lbl: tr(cs[0]), csl: cs[1], cen: cs[2], sl: fill(sl, 0), en: fill(en, 1), prio, t: performance.now() / 1000, ttl: o.ttl || [9, 14, 20, 30][prio], person });
    if (rd.q.length > 8) { let w = 0; for (let i = 1; i < rd.q.length; i++) if (rd.q[i].prio < rd.q[w].prio) w = i; rd.q.splice(w, 1); }   // (the least urgent, the oldest of those)
  }
  // what the police say to an event of the run (race.pol.log)
  function polRadio(k, e, P) {
    const pol = race.pol, up = rdUp(P), at = rdWhere(e.s, -1), dir = up ? ['Vršič', 'the pass'] : ['Kranjska Gora', 'Kranyska Gora'], V = { at, dir, to: rdToward(P.q.s, up) };
    const U = { u: e.u, kind: e.kind || 'car' }, ucs = rdCall(e.u, e.kind), near = rdNear(P), N = rdUnit(near), t = performance.now() / 1000;
    const N2 = N || rdUnit(rdNear(P, 1500)), say = (key, vars, o) => { if (N2) rsay(key, 'u', vars, Object.assign({}, N2, o)); };   // (the nearest unit says it (a unit's own words); none within 1.5 km: not said)
    V.U = [ucs[1], ucs[2]];
    switch (k) {
      case 'chkSeen': rsay(P.speed > 19 ? 'chkSeenFast' : 'chkSeen', 'u', rdCarV(), U); break;
      case 'chkStop': rsay('chkStop', 'u', null, Object.assign({ prio: 0 }, U)); break;
      case 'chkDocs': rsay('chkDocs', 'cop'); break;
      case 'chkNoDocs': rsay('chkNoDocs', 'drv'); break;
      case 'chkPark': rsay('chkPark', 'cop'); break;
      case 'chkParked': rsay('chkParked', 'cop'); rsay('chkTake', 'u', null, U); break;
      case 'arrested': rsay('arrested', 'okc', V, { prio: 2 }); break;
      case 'fled':
        if (e.why !== 'hit') rsay('fledShout', 'cop');
        rsay(e.why === 'hit' ? 'fledHit' : e.why === 'skip' ? 'fledSkip' : polRun.park ? 'fledPark' : polRun.docs ? 'fledDocs' : 'fledDrive', 'u', rdCarV(), Object.assign({ prio: 2 }, U));   // (polRun: how far the checkpoint had come)
        rsay('fledAll', 'okc', Object.assign(rdCarV(), { U: V.U }), { prio: 2 }); break;
      case 'join': if (e.stub != null || e.sKind != null) { const S = rdStubOf(e); rsay('joinStub', 'u', { sgen: rdStub(S, 2), sloc: rdStub(S, 0) }, U); }
        else rsay(e.kind === 'moto' ? 'joinMoto' : 'join', 'u', V, U);
        if (!rd.said.backup && pol.heat >= 1.8 && Math.random() < 0.4) { rd.said.backup = 1; rsay('backupOk', 'okc', null, { prio: 0 }); }
        break;
      case 'spikes': rsay('spikes', e.u ? 'u' : 'okc', V, U); break;
      case 'block': rsay(e.heavy ? 'blockHeavy' : 'block', e.u ? 'u' : 'okc', V, U); break;
      case 'flat': say('flat', V); break;
      case 'ram': if (t - rd.ramT > 14 && Math.random() < 0.6) { rd.ramT = t; rsay('ram', 'u', null, Object.assign({ prio: 0 }, U)); } break;
      case 'wreck': rsay(e.why === 'flat' ? 'wreckFlat' : e.why === 'stuck' ? 'wreckStuck' : 'wreck', 'u', V, U); break;
      case 'motoDown': if (e.byP) say('motoDownP', V); else rsay('motoDown', 'u', V, Object.assign({ prio: 0 }, U)); break;
      case 'heli': rsay('heli', 'heli', V, { prio: 2 }); break;
      case 'heliOut': rsay('heliOut', 'heli', null, { prio: 0 }); break;
      case 'ambush': rsay('ambush', 'u', V, U); break;
      case 'undercover': rsay('undercover', 'u', V, U); break;
      case 'lost': { const c = pol.cars.find(q => q.pol.mode === 'search' && q.pol.unit); if (c) rsay('lost', 'u', V, rdUnit(c)); rsay('lostAll', 'okc', V); break; }
      case 'spotted': if (e.u) rsay('spotted', 'u', V, U); else if (pol.heli && pol.heli.st === 'track') rsay('spotted', 'heli', V); else rsay('spotted', 'okc', V); break;
      case 'busted': say('busted', V, { prio: 2 }); rsay('bustedAll', 'okc', V, { prio: 2 }); break;
      case 'logs': say('logs', V); break;
      case 'logHit': if (t - rd.logT > 6 && e.u) { rd.logT = t; rsay('logHit', 'u', null, Object.assign({ prio: 0 }, U)); } break;
      case 'hideout': if (pol.heli && pol.heli.st === 'track') rsay('hideout', 'heli', V, { prio: 2 }); else say('hideout', V, { prio: 2 });
        rsay('hideoutAll', 'okc', V, { prio: 2 }); if (rd.said.trenta) rsay('hideoutBov', 'bov', V, { prio: 2 }); break;
      case 'stubIn': { const S = rdStubOf(e), f = RD_ST[S.name], dead = RD_DEAD[f ? f[5] : (RD_SK[S.kind] || RD_SK[0])[5]];
        say('stubIn', { sacc: rdStub(S, 1), dead }, { prio: 2 }); rsay('stubInAck', 'okc', null, { prio: 1 }); break; }
      case 'stubEnd': say('stubEnd', V); break;
      case 'stubOut': say('stubOut', Object.assign({ sgen: rdStub(rdStubOf(e), 2) }, V)); break;
    }
  }
  // the people run over by the player, a crash into the traffic: before the chase the dispatcher calls it out (a hit-and-run), in the chase a unit
  function rdRoad(k, P) {
    const pol = race.pol, at = rdWhere(P.q.s, P.q.k), N = rdUnit(rdNear(P)), t = performance.now() / 1000;
    if (k === 'crash') { if (pol.stage === 'chase' && t - rd.crashT > 20 && Math.random() < 0.5) { rd.crashT = t; rsay('crash', N ? 'u' : 'okc', { at }, Object.assign({ prio: 0 }, N)); } return; }
    if (k !== 'ped' && k !== 'bike') return;
    if (pol.stage !== 'chase' || !N) { rsay(k === 'ped' ? 'pedFree' : 'bikeFree', 'okc', Object.assign(rdCarV(), { at })); return; }   // (no unit near to see it: the dispatcher calls it out)
    rsay(k, N ? 'u' : 'okc', { at }, N); rsay('medic', 'okc');
  }
  // the radio's chatter: before the checkpoint the routine of the day, in the chase where the player is and the requests, lost: the search
  function rdChat(P, t) {
    const pol = race.pol, K = pol.chk, st = pol.stage;
    rd.chatT = t + 3;
    if (st === 'free') {
      if (K.s - P.q.s < 300) return;   // (near the checkpoint: the unit there speaks next)
      if (!rd.free) rd.free = [RD_FREE[0]];
      if (!rd.free.length) { rd.free = RD_FREE.slice(1).concat([RD_WX[S.season === 'winter' ? 'snow' : race.rain ? 'rain' : 'dry']]); for (let i = rd.free.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rd.free[i], rd.free[j]] = [rd.free[j], rd.free[i]]; } }
      for (const [w, sl, en] of rd.free.shift()) rline(w.charAt(0) === 'u' ? 'u' : w, sl, en, null, { u: +w.charAt(1) || 0, prio: 0, ttl: 25 });
      rd.chatT = t + 12 + Math.random() * 6; return;
    }
    if (st !== 'chase') return;
    const near = rdNear(P), N = rdUnit(near), ncs = N ? rdCall(N.u, N.kind) : null, H = pol.heli && pol.heli.st === 'track', up = rdUp(P), d = P.q.s - track.startS, v = Math.round(P.speed * 3.6 / 5) * 5;
    const V = { at: rdWhere(P.q.s, P.q.k), to: rdToward(P.q.s, up), dir: up ? ['Vršič', 'the pass'] : ['Kranjska Gora', 'Kranyska Gora'], v, U: ncs ? [ncs[1], ncs[2]] : '' };
    const o0 = (o) => Object.assign({ prio: 0, ttl: 14 }, o);
    rd.chatT = t + 7 + Math.random() * 5;
    if (pol.lost) {   // the search: the dispatcher sends them along the road, a unit reports where it is not
      rd.chatT = t + 9 + Math.random() * 5;
      const c = pol.cars.find(c => c.pol.mode === 'search' && c.pol.unit && Math.random() < 0.6);
      if (c && Math.random() < 0.6) rsay('searchU', 'u', { at: rdWhere(c.q.s, c.q.k) }, o0(rdUnit(c))); else rsay('search', 'okc', { at: rdWhere(P.q.s - 250, -1) }, o0());
      return;
    }
    // the requests and replies, each once (the strips and roadblocks of the plan ahead, before they are laid; the helicopter again after a while)
    const plan = pol.plan.find(q => !q.done && q.s - P.q.s > 450 && q.s - P.q.s < 1700 && !rd.said['p' + q.s]);
    if (plan && N) { rd.said['p' + plan.s] = 1; const W = { at: rdWhere(plan.s, -1), U: V.U };
      if (plan.kind === 'spike') { rsay('spikeAsk', 'u', W, o0(N)); rsay(rd.said.spikeOk ? 'spikeOk' : 'spikeOk1', 'okc', W, o0()); rd.said.spikeOk = 1; }
      else { rsay('blockSet', 'u', W, o0(N)); rsay('blockOk', 'okc', W, o0()); }
      return; }
    if (!pol.heli && N && pol.heat >= pol.D.heli - 0.8 && t - (rd.said.heliT || -1e9) > 120) { rd.said.heliT = t; rsay('heliAsk', 'u', null, o0(N)); rsay('heliOk', 'okc', null, o0()); return; }
    if (!rd.said.trenta && (d > 5200 || pol.heat >= 3)) { rd.said.trenta = 1; rsay('trenta', 'okc', null, o0({ ttl: 20 })); rsay('trentaBov', 'bov', null, o0({ ttl: 24 })); return; }
    if (!rd.said.guns && rd.said.spikeOk && N && pol.heat >= 2) { rd.said.guns = 1; rsay('guns', 'u', null, o0(N)); rsay('gunsNo', 'okc', null, o0()); return; }
    if (!rd.said.backup && N && pol.heat >= 1.8 && Math.random() < 0.3) { rd.said.backup = 1; rsay('backup', 'u', null, o0(N)); rsay('backupOk', 'okc', null, o0()); return; }
    if (!pol.seen && !H && pol.hide > 0.2 && t - (rd.said.whereT || -1e9) > 25) {   // (out of their sight: where is he?)
      rd.said.whereT = t; rsay('where', 'okc', null, o0()); const c = rdNear(P, 1500); if (c) rsay('whereU', 'u', V, o0(rdUnit(c))); return; }
    // where the player is: the nearest unit (or the helicopter over them), what fits the place and the speed
    if (!near && !H) return;
    const heli = H && (!near || Math.random() < 0.35), G = rdGeo(), hp = G.hp.length > 1 && d > G.hp[0] - 60 && d < G.hp[G.hp.length - 1] + 60;
    const key = heli ? 'posHeli' : P.q.k >= 0 ? 'posStub' : !up ? 'posDown' : v >= 135 && Math.random() < 0.5 ? 'posFast' : v < 35 ? 'posSlow' : d < 1300 && Math.random() < 0.5 ? 'posVillage' :
      Math.abs(d - 1850) < 250 && Math.random() < 0.5 ? 'posJasna' : d > 11850 && Math.random() < 0.5 ? 'posTop' : hp && Math.random() < 0.3 ? 'posHair' : 'pos';
    rsay(key, heli ? 'heli' : 'u', V, o0(heli ? null : N));
    if (!heli && Math.random() < 0.3) rsay('ack', 'okc', V, o0());
  }
  // the radio director (each frame of the run from the police, in real time like the speech): the line playing, the next one from the queue,
  // the caption, the chatter
  function radioStep(P) {
    if (!rd) radioReset();
    const t = performance.now() / 1000, el = $('h-radio'), C = rd.cur;
    if (C && !C.on && t >= C.at) {   // (the squelch is open: said and shown)
      C.on = true;
      const E = Lang.cur === 'en', txt = E ? C.en : C.sl, say = E ? (C.cen ? C.cen + ', ' + C.en : C.en) : rdSpeech(C.csl ? C.csl + ', ' + C.sl : C.sl);   // (the English page: the radio's English lines)
      C.item = Comm.radio(say, { who: C.who, u: C.u, en: C.cen ? C.cen + ', ' + C.en : C.en, enOnly: E });
      C.until = t + (C.item ? 2.5 + say.length * 0.085 : Math.max(1.8, txt.length * 0.065));   // (said: until its end, at most this; captions only: by its length)
      el.innerHTML = '<b>' + esc(C.lbl) + '</b> ' + esc(txt); el.className = 'show' + (C.person ? ' person' : '');
      rd.log.push({ k: C.key, who: C.lbl, txt, t: race.time, said: !!C.item }); if (rd.log.length > 80) rd.log.shift();
    } else if (C && C.on && (t > C.until || (C.item && (C.item.done || C.item.cut)))) rdEnd(t, false);
    if (rd.cur && rd.q.some(L => L.prio >= rd.cur.prio + 2 || (L.prio > 0 && !rd.cur.prio))) { if (rd.cur.item) Comm.radioStop(); rdEnd(t, true); }   // (news cuts the chatter off; the officer in person, a turn of the run cut any line)
    if (!rd.cur && t >= rd.gapT && rd.q.length && phase !== 'done') {
      rd.q = rd.q.filter(L => t - L.t < L.ttl);
      let b = null; for (const L of rd.q) if (!b || L.prio > b.prio) b = L;   // (the most urgent; of those the oldest)
      if (b) { rd.q.splice(rd.q.indexOf(b), 1); rd.cur = b; b.on = false; b.at = t + (b.person ? 0.05 : 0.18); if (!b.person) { Sfx.radioOpen(); Sfx.radioBed(true); } }
    }
    if (!rd.cur && el.className && t > rd.capT) el.className = '';
    if (phase === 'racing' && !P.finished && !rd.cur && !rd.q.length && t >= rd.chatT) rdChat(P, t);
  }
  function rdEnd(t, cut) {
    const C = rd.cur; rd.cur = null; if (!C) return;
    if (!C.person) { if (!cut && C.on) Sfx.radioClose(); Sfx.radioBed(false); }
    rd.capT = t + (cut ? 0 : 0.8); rd.gapT = t + (cut ? 0.12 : 0.5 + Math.random() * 0.4);
  }
  // busted: the camera beside the road (on the side of the road's middle), the player's car and the officers walking up to it
  function bustShot() {
    const P = race.player, ch = Math.cos(P.h), sh = Math.sin(P.h), sd = P.q && P.q.d > 0 ? -1 : 1, y = P.roadY != null ? P.roadY : P.y;
    Render.setShot({ px: P.x - ch * 6.5 - sh * sd * 8.5, py: y + 2.8, pz: P.z - sh * 6.5 + ch * sd * 8.5, tx: P.x + ch * 0.8, ty: y + 0.9, tz: P.z + sh * 0.8, fov: 44, floor: true, near: 0.3 });
    $('hud').classList.add('shot');
  }
  // parked at the checkpoint (the arrest there): the camera down the road on the lane by the kerb, looking up it at the patrol car, the
  // player's car in the box beyond it and the driver walking to the patrol car with the officer (all of it in a phone held upright too)
  function chkShot() {
    const P = race.player, K = race.pol.chk, c = K.car, T = track; if (!c) return;
    const mx = (P.x + c.x) / 2, mz = (P.z + c.z) / 2, i = T.idx((P.q.s + c.q.s) / 2 - 26), d = K.side * 2.5, y = P.roadY != null ? P.roadY : P.y;
    Render.setShot({ px: T.px[i] + T.nx[i] * d, py: T.hy[i] + 4.2, pz: T.pz[i] + T.nz[i] * d, tx: mx, ty: y + 1, tz: mz, fov: 40, floor: true, near: 0.3 });
    $('hud').classList.add('shot');
  }
  function roadSound(P) {
    let best = 1e9, pan = 0;
    if (race.pol) for (const c of race.pol.cars) if ((c.pol.mode === 'chase' || (c.pol.mode === 'park' && !c.pol.chk)) && c.pol.kind !== 'van') { const dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz); if (d < best) { best = d; pan = (dx * -Math.sin(P.h) + dz * Math.cos(P.h)) / Math.max(12, d); } }   // (the checkpoint's car parked there: its lights on, no siren)
    Sfx.siren(race.pol && phase === 'racing' && !P.finished ? Math.pow(clamp(1 - best / 260, 0, 1), 1.4) : 0, pan);
    for (const v of race.tf.veh) {
      if (v.horn > 0 && !v.hornOn && !v.off) { v.hornOn = true; const dx = v.x - P.x, dz = v.z - P.z, d = Math.hypot(dx, dz); if (d < 90) Sfx.carHorn(clamp(1 - d / 90, 0.1, 1), (dx * -Math.sin(P.h) + dz * Math.cos(P.h)) / Math.max(12, d), v.kind === 2); }
      else if (!(v.horn > 0)) v.hornOn = false;
    }
  }

  /* ---------------- pit stops ---------------- */
  let pitWrenchT = 0, pitHint = false, drsN = 0, secN = 0, pitFix = false;
  // a changing weather (Race opts weather) and tyres (opts tyres): the rain starts or stops (race.wst.ev), the tyres on the HUD
  let wxSeen = 0, dryHint = false, tyreKey = '';
  // flags (Race opts flags): a yellow flag where a car has stopped, the safety car after a heavy crash, the player overtaking under them
  let flSeen = 0, flPSeen = 0, flKey = '', flTold = {};
  function flagEvent(k, P) {
    if (phase !== 'racing' || P.finished) return;
    const F = race.fl;
    if (k === 'yellow') {   // (a car stopped ahead: the zone before it)
      const y = F.yel[F.yel.length - 1]; if (!y || y.car === P) return;
      let d = y.s - P.q.s; d = ((d % track.len) + track.len) % track.len;
      if (d < 700) { showMsg(tr('RUMENA ZASTAVA'), 'gold', 1.8); if (!flTold.y) { flTold.y = true; toast(tr('Rumena zastava: pred tabo je ustavljen avto. Upočasni in ne prehitevaj, dokler je ne prevoziš.'), 4200); } Comm.say('yellow', null, 2); }
    } else if (k === 'sc') { showMsg(tr('VARNOSTNI AVTO'), 'gold', 2.6); Sfx.beep(520, 0.2, 0.12); if (!flTold.sc) { flTold.sc = true; toast(tr('Varnostni avto: ne prehitevaj in se drži avta pred sabo. Ko gre s proge, se dirka nadaljuje na ciljni črti.'), 5200); } Comm.say('sc', null, 3); }
    else if (k === 'scIn') { showMsg(tr(F.sc && F.sc.pit ? 'VARNOSTNI AVTO GRE V BOKSE' : 'VARNOSTNI AVTO GRE S PROGE'), 'gold', 2.2); Comm.say('scIn', null, 2); }
    else if (k === 'scGone') { showMsg(tr('NE PREHITEVAJ DO CILJNE ČRTE'), 'gold', 2.2); }
    else if (k === 'green') { showMsg(tr('ZELENA ZASTAVA!'), 'fast', 1.8); Sfx.beep(990, 0.12, 0.12); setTimeout(() => Sfx.beep(1320, 0.16, 0.12), 140); Comm.say('green', null, 3); }
  }
  function flagPlayer(k) {
    if (k === 'passWarn') { showMsg(tr('VRNI MESTO!'), 'slow', 2.6); vibrate(60); toast(tr('Prehitel si pod rumeno zastavo ali za varnostnim avtom. Spusti ga nazaj pred sabo v 10 sekundah, sicer dobiš 5 sekund kazni.'), 5200); Comm.say('passWarn', null, 3); }
    else if (k === 'passOk') showMsg(tr('MESTO VRNJENO'), 'gold', 1.4);
    else if (k === 'pen') { showMsg(tr('KAZEN +5 s'), 'slow', 2.6); vibrate(80); Comm.say('penalty', null, 3); }
  }
  // the flag on the HUD: yellow (in or before a yellow zone), the safety car board, the countdown to give a place back
  function flagHUD(P) {
    const F = race.fl; let key = '', txt = '';
    if (F && !P.finished) {
      const owe = P.fl && P.fl.owe, S = F.sc;
      if (owe) { key = 'owe'; txt = tr('VRNI MESTO · {0}', Math.ceil(owe.t)); }
      else if (S && S.state !== 'gone') { key = S.state === 'in' ? 'scin' : 'sc'; txt = tr(S.state === 'in' ? 'SC GRE S PROGE' : 'VARNOSTNI AVTO'); }
      else if (S) { key = 'restart'; txt = tr('NE PREHITEVAJ'); }
      else if (F.yel.length && race._yelAt(P.q.s)) { key = 'yel'; txt = tr('RUMENA ZASTAVA'); }
    }
    if (key + txt === flKey) return; flKey = key + txt;
    const el = $('h-flag'); el.className = key ? 'on ' + key : ''; el.textContent = txt;
  }
  function wxEvent(k, P) {
    if (phase !== 'racing' || P.finished) return;
    const W = race.wst, box = W.tyres && P.ty && track.def.pit;
    if (k === 'rain') { showMsg(tr('DEŽ'), 'gold', 2.2); Comm.say('rainStart', null, 2); if (box && P.ty.k === 'dry') toast(tr('Začelo je deževati: proga bo kmalu mokra. Zapelji v bokse po dežne gume (desno takoj za zadnjim ovinkom pred ciljno ravnino).'), 4800); }
    else if (k === 'dry') { showMsg(tr('DEŽ JE PONEHAL'), 'gold', 2.2); Comm.say('rainStop', null, 2); Render.rainbow(true); if (box && P.ty.k === 'wet') toast(tr('Dež je ponehal: proga se suši, najprej na idealni liniji.'), 3800); }   // (the rain stopped: a rainbow over the land, by day)
  }
  const tyreName = (ty) => ty.k === 'wet' ? 'DEŽNE' : ({ S: 'MEHKE', M: 'SREDNJE', H: 'TRDE' })[ty.c] || 'SUHE';   // (the slicks by their compound, if the race has them)
  function tyreHUD(P) {
    const W = race.wst, on = !!(W && W.tyres && P.ty), left = on ? Math.round((1 - P.ty.wear) * 100) : 0, bad = on && P.ty.k !== Core.tyreFor(W.line);
    const key = on ? P.ty.k + (P.ty.c || '') + left + (bad ? 'x' : '') : '';
    if (key === tyreKey) return; tyreKey = key;
    const el = $('h-tyre'); el.className = on ? 'on ' + P.ty.k + (P.ty.k === 'dry' && P.ty.c ? ' c' + P.ty.c : '') + (left < 35 ? ' worn' : '') + (bad ? ' bad' : '') : '';
    el.textContent = on ? tr(tyreName(P.ty)) + ' ' + left + '%' : '';
  }
  // the fuel (a race with fuel on): the gauge under the tyres, a tick on it at what it takes to the line (the car's own burn); a warning on
  // the lap it would not last another when it will not reach the line, the last drops (a crawl to the pits) when it is empty
  let fuelKey = '', fuelTold = { low: false, out: false };
  function fuelHUD(P) {
    const on = P.fuel != null && !!race.fuelRate, left = on ? Math.round(P.fuel * 100) : 0, rest = on ? (race.laps * track.len - Math.max(0, P.dist)) * P.fuelPm : 0, need = Math.round(rest * 100);
    const key = on ? left + '|' + (P.finished ? '' : need) + (P.inPit ? 'p' : '') : '';
    if (key !== fuelKey) { fuelKey = key; const el = $('h-fuel'); el.className = on ? 'on' + (left < 15 ? ' low' : '') : '';
      el.innerHTML = on ? tr(P.m.ev ? 'BATERIJA {0}%' : 'GORIVO {0}%', left) + '<i style="width:' + left + '%"></i>' + (!P.finished && need > 0 && need < 100 ? '<b style="left:' + need + '%"></b>' : '') : ''; }
    if (!on || phase !== 'racing' || P.finished) return;
    if (P.fuel < rest * 1.03 && P.fuel < track.len * P.fuelPm * 1.3 && !fuelTold.low && !P.inPit) { fuelTold.low = true; toast(tr(P.m.ev ? 'Baterija je skoraj prazna: zapelji v bokse, mehaniki jo napolnijo.' : 'Malo goriva: zapelji v bokse, mehaniki natočijo gorivo.'), 4200); Comm.say('fuelLow', null, 3); }
    if (P.fuel <= 0 && !fuelTold.out) { fuelTold.out = true; showMsg(tr(P.m.ev ? 'PRAZNA BATERIJA!' : 'BREZ GORIVA!'), 'slow', 2.6); Comm.say('fuelOut', null, 4); }
    if (P.fuel > 0.9) fuelTold.low = fuelTold.out = false;   // (filled up again)
  }
  // an endurance race: the time of day with the leader's progress, from the afternoon (0) to the night (1, at about nine tenths of the race):
  // the light blended, the lamps coming on; the evening and the night told
  let enduK = 0;
  function enduStep() {
    if (!race.endu) return;
    const L = race.order && race.order[0] ? race.order[0] : race.player, k = clamp(Math.max(0, L.dist) / (race.laps * track.len) * 1.12, 0, 1);
    if (Math.abs(k - enduK) < 0.004 && !(k === 1 && enduK < 1)) return;   // (in steps; the night itself whatever the last step's size)
    if (enduK < 0.45 && k >= 0.45) { showMsg(tr('VEČER'), 'gold', 2); Comm.say('dusk', null, 1); }
    if (enduK < 0.8 && k >= 0.8) { showMsg(tr('PADA NOČ'), 'gold', 2.2); Comm.say('nightFall', null, 2); }
    enduK = k; Render.setTodK(k);
  }
  // sector times on the HUD (Race._sectors: a circuit's TV sectors; Race._thirds elsewhere): the cells of the lap under way; purple: the
  // fastest of anyone (in qualifying: faster than every rival's lap so far), green: the player's best of this race, yellow: slower. The time
  // of sectors 1 and 2 also under the clock. The player's best sectors go to the track's records at the end (records.tracks[id].bestSec)
  let secSeen = 0, secMine = [Infinity, Infinity, Infinity];
  const secTxt = (t) => t >= 60 ? fmt(t, true) : t.toFixed(t < 10 ? 3 : 2);
  function secReset() { secSeen = 0; secMine = [Infinity, Infinity, Infinity];
    [...$('h-sec').children].forEach((el, j) => { el.textContent = 'S' + (j + 1); el.className = ''; }); }
  function secHUD(P) {   // a sector done: from the circuit's TV sectors (Race._sectors, P.secEv) or the thirds of the lap (Race._thirds, P.sec)
    let k, t, ob;
    if (P.secEv) { k = P.secEv[0]; t = P.secEv[1]; ob = P.secEv[2] === 'p'; P.secEv = null; }
    else { const S = P.sec; if (!S || S.ev === secSeen) return; secSeen = S.ev; k = S.evK; t = S.evT; ob = S.evOb; }
    const cells = $('h-sec').children;
    if (k === 0) for (let j = 1; j < 3; j++) { cells[j].textContent = 'S' + (j + 1); cells[j].className = ''; }   // (a new lap: its first sector)
    if (race.quali && qual && qual.sims) for (const e of qual.sims.times) if (e && e.sec && !(t < e.sec[k])) { ob = false; break; }   // (qualifying: against the rivals' laps done so far)
    if (race.quali && !(qual && qual.sims && qual.sims.times.some(e => e && e.sec))) ob = false;
    const pb = t < secMine[k];
    secMine[k] = Math.min(secMine[k], t);
    cells[k].textContent = 'S' + (k + 1) + ' ' + secTxt(t); cells[k].className = ob ? 'ob' : pb ? 'pb' : 'sl';
    if (k < 2 && !P.finished) { const el = $('h-split'); el.textContent = tr('SEKTOR {0}  {1}', k + 1, t >= 60 ? fmt(t) : t.toFixed(3)); el.className = 'show s' + (ob ? 'p' : pb ? 'g' : 'y'); splitT = 2.6; cornerShow = false; }   // (the third's time: the lap's)
    if (ob && phase === 'racing') { Sfx.beep(1175, 0.06, 0.07); if (secN++ % 3 === 0) Comm.say('secPurple', { n: k + 1 }, 1); }   // (the commentator: now and then)
  }
  function secSave() {   // the player's best sectors of this race into the records (per sector)
    const P = race && race.player; if (!P || !(P.sec || P.secPB) || race.timeTrial || (mp && mp.race)) return;
    const R0 = rec(track.def.id), B = Array.isArray(R0.bestSec) && R0.bestSec.length === 3 ? R0.bestSec.slice() : [Infinity, Infinity, Infinity];
    const PB = P.sec ? P.sec.best : P.secPB || []; let ch = false; for (let k = 0; k < 3; k++) if (PB[k] < B[k]) { B[k] = +PB[k].toFixed(4); ch = true; }
    if (ch) { R0.bestSec = B.map(v => isFinite(v) ? v : null); saveRecords(); }
  }
  // the rivals' characters: a duel with the player (and who came out of it ahead), a mistake under pressure (near the player or the
  // standing rival's)
  function chrEvent(k, c, P) {
    if (phase !== 'racing') return;
    const near = Math.abs(c.dist - P.dist) < 90, rv = c.chr && c.chr.rival;
    if (k === 'duel') { showMsg(tr(rv ? 'DVOBOJ S STALNIM TEKMECEM' : 'DVOBOJ: {0}', String(c.name).toUpperCase()), 'gold', 1.8); Comm.say(rv ? 'duelRival' : 'duel', { name: commName(c) }, 3); }
    else if (k === 'duelEnd') { const won = P.dist > c.dist; if (won) showMsg(tr('DVOBOJ DOBLJEN'), 'fast', 1.6); Comm.say(won ? 'duelWon' : 'duelLost', { name: commName(c) }, 2); }
    else if (k === 'mistake' && (near || rv)) { if (near) showMsg(tr('NAPAKA: {0}', String(c.name).toUpperCase()), 'gold', 1.2); Comm.say('aiMistake', { name: commName(c) }, 2); }
  }
  function pitEvent(e) {
    if (phase !== 'racing') return;
    if (e === 'enter') { showMsg(tr('BOKSI · 80 km/h'), 'gold', 1.8); Sfx.beep(660, 0.1, 0.1); Comm.say('pitIn', null, 2); }
    else if (e === 'repair') { pitWrenchT = 0.15; vibrate(30); pitFix = race.player.dmg > 0.01; if (Math.random() < 0.6) Comm.say('pitWork', null, 1); }
    else if (e === 'done') { const ty = race.player.ty, fu = race.player.fuel != null && race.fuelRate; showMsg((ty ? tr('{0} GUME', tr(tyreName(ty))) + (pitFix ? tr(' · POPRAVLJENO') : '') : fu ? tr('POLNO') + (pitFix ? tr(' · POPRAVLJENO') : '') : tr('POPRAVLJENO!')) + (ty && fu ? tr(' · POLNO') : ''), 'gold', 1.8); Sfx.beep(880, 0.12, 0.12); setTimeout(() => Sfx.beep(1175, 0.18, 0.12), 130); vibrate(40); Comm.say(fu ? 'fuelIn' : 'pitOut', null, 2); dmgKey = ''; }
  }

  /* ---------------- HUD ---------------- */
  const mm = { cv: null, ctx: null, img: null, w: 0, h: 0, sc: 1, ox: 0, oz: 0, dpr: 1 };
  function buildMinimap() {
    const cv = $('minimap'); const r = cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(40, Math.round(r.width * dpr)), h = Math.max(30, Math.round(r.height * dpr));
    if (w === mm.w && h === mm.h && mm.img) return;
    cv.width = w; cv.height = h; mm.cv = cv; mm.ctx = cv.getContext('2d'); mm.w = w; mm.h = h; mm.dpr = dpr;
    mm.open = !!track.open; if (mm.open) { buildMinimapOpen(dpr); return; }
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (let i = 0; i < track.N; i++) { minX = Math.min(minX, track.px[i]); maxX = Math.max(maxX, track.px[i]); minZ = Math.min(minZ, track.pz[i]); maxZ = Math.max(maxZ, track.pz[i]); }
    const pad = 9 * dpr;
    mm.sc = Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxZ - minZ));
    mm.ox = (w - (maxX - minX) * mm.sc) / 2 - minX * mm.sc; mm.oz = (h - (maxZ - minZ) * mm.sc) / 2 - minZ * mm.sc;
    const img = document.createElement('canvas'); img.width = w; img.height = h;
    const g = img.getContext('2d');
    const path = () => { g.beginPath(); for (let i = 0; i <= track.N; i++) { const k = i % track.N; const x = track.px[k] * mm.sc + mm.ox, y = track.pz[k] * mm.sc + mm.oz; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); };
    g.lineJoin = 'round'; g.lineCap = 'round';
    path(); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 7 * dpr; g.stroke();
    path(); g.strokeStyle = '#ffffff'; g.lineWidth = 3.4 * dpr; g.stroke();
    overpass(g, track, (i) => [track.px[i] * mm.sc + mm.ox, track.pz[i] * mm.sc + mm.oz], mm.sc, 7 * dpr, 3.4 * dpr, 'rgba(0,0,0,.8)');
    if (track.def.pit) { const Pd = track.def.pit; g.beginPath(); let first = true;   // pit lane
      for (let d = Pd[1]; d <= Pd[2]; d += 4) { const s0 = track.startS + d, p = track.pitAt(s0); if (!p) continue; const i = track.idx(s0), o = p.o * track.pitSide, x = (track.px[i] + track.nx[i] * o) * mm.sc + mm.ox, y = (track.pz[i] + track.nz[i] * o) * mm.sc + mm.oz; if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y); }
      g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3.2 * dpr; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.5 * dpr; g.stroke(); }
    // start line
    const si = track.startIdx; const sx = track.px[si] * mm.sc + mm.ox, sy = track.pz[si] * mm.sc + mm.oz;
    g.strokeStyle = '#e63b2e'; g.lineWidth = 2.5 * dpr; g.beginPath();
    g.moveTo(sx - track.nx[si] * 5 * dpr, sy - track.nz[si] * 5 * dpr); g.lineTo(sx + track.nx[si] * 5 * dpr, sy + track.nz[si] * 5 * dpr); g.stroke();
    mm.img = img;
  }
  // open road (hill climb, ~4 km tall): the whole course at a fixed ~3.2 m/px, drawn scrolled so the player stays centred (north up)
  const MM_MPP = 3.2;
  function buildMinimapOpen(dpr) {
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (let i = 0; i < track.N; i++) { minX = Math.min(minX, track.px[i]); maxX = Math.max(maxX, track.px[i]); minZ = Math.min(minZ, track.pz[i]); maxZ = Math.max(maxZ, track.pz[i]); }
    const sc = dpr / MM_MPP, pad = 12 * dpr;
    mm.sc = sc; mm.ox = pad - minX * sc; mm.oz = pad - minZ * sc;
    const img = document.createElement('canvas'); img.width = Math.ceil((maxX - minX) * sc + pad * 2); img.height = Math.ceil((maxZ - minZ) * sc + pad * 2);
    const g = img.getContext('2d'), X = (i) => track.px[i] * sc + mm.ox, Y = (i) => track.pz[i] * sc + mm.oz;
    const path = () => { g.beginPath(); g.moveTo(X(0), Y(0)); for (let i = 1; i < track.N; i++) g.lineTo(X(i), Y(i)); };
    g.lineJoin = 'round'; g.lineCap = 'round';
    if (track.stubs) {   // the side roads: thin grey lines to their ends (under the road)
      g.beginPath(); for (const S of track.stubs) { g.moveTo(S.x[0] * sc + mm.ox, S.z[0] * sc + mm.oz); for (let j = 1; j < S.n && j * 2 <= S.L; j++) g.lineTo(S.x[j] * sc + mm.ox, S.z[j] * sc + mm.oz); }
      g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 3.2 * dpr; g.stroke(); g.strokeStyle = 'rgba(190,194,200,.85)'; g.lineWidth = 1.4 * dpr; g.stroke();
    }
    path(); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 7 * dpr; g.stroke();
    path(); g.strokeStyle = '#ffffff'; g.lineWidth = 3.4 * dpr; g.stroke();
    const tick = (i, col, len) => { g.strokeStyle = col; g.beginPath(); g.moveTo(X(i) - track.nx[i] * len, Y(i) - track.nz[i] * len); g.lineTo(X(i) + track.nx[i] * len, Y(i) + track.nz[i] * len); g.stroke(); };
    g.lineWidth = 2.5 * dpr; tick(track.startIdx, '#e63b2e', 6 * dpr);
    g.font = '700 italic ' + Math.round(9 * dpr) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    track.cpS.forEach((s, k) => { const i = track.idx(s); g.lineWidth = 3 * dpr; tick(i, '#ffc629', 7 * dpr);
      const lx = X(i) + track.nx[i] * 14 * dpr, ly = Y(i) + track.nz[i] * 14 * dpr; g.lineWidth = 3 * dpr; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(String(k + 1), lx, ly); g.fillStyle = '#ffc629'; g.fillText(String(k + 1), lx, ly); });
    const G = race && race.pol && race.pol.goal; mm.pol = !!(race && race.pol);
    if (G) { const x = G.x * sc + mm.ox, y = G.z * sc + mm.oz, r = 5 * dpr;   // the run from the police: the building at the top (a house) instead of the finish
      g.beginPath(); g.moveTo(x - r, y + r); g.lineTo(x - r, y - r * 0.15); g.lineTo(x, y - r * 1.1); g.lineTo(x + r, y - r * 0.15); g.lineTo(x + r, y + r); g.closePath();
      g.fillStyle = '#2f6fe0'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5 * dpr; g.stroke(); }
    else chequer(g, X(track.finishIdx), Y(track.finishIdx), 5 * dpr);
    mm.img = img;
  }
  function drawMinimapOpen(g, d) {
    const P = race.player, w = mm.w, h = mm.h, sc = mm.sc;
    const cx = w * 0.5, cy = h * 0.56, tx = Math.round(cx - (P.x * sc + mm.ox)), ty = Math.round(cy - (P.z * sc + mm.oz));
    g.clearRect(0, 0, w, h); g.drawImage(mm.img, tx, ty);
    // the road already climbed, in yellow
    const pi = Math.max(track.startIdx, track.idx(P.q ? P.q.s : track.startS));
    if (pi > track.startIdx) {
      g.save(); g.translate(tx, ty); g.beginPath();
      for (let i = track.startIdx; i <= pi; i++) { const x = track.px[i] * sc + mm.ox, y = track.pz[i] * sc + mm.oz; if (i === track.startIdx) g.moveTo(x, y); else g.lineTo(x, y); }
      g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = '#ffc629'; g.lineWidth = 2.4 * d; g.stroke(); g.restore();
    }
    // a race up the road: the rivals around (the map moves with the player)
    for (const c of race.cars) { if (c === P) continue;
      const x = c.x * sc + mm.ox + tx, y = c.z * sc + mm.oz + ty; if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;
      g.fillStyle = hexCss(c.color); g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 1 * d; g.beginPath(); g.arc(x, y, 2.6 * d, 0, 6.2832); g.fill(); g.stroke(); }
    if (race.pol) {   // the run from the police: the patrol cars (blue and red in the chase, grey searching; the ones waiting unseen not shown), the helicopter, strips and roadblocks ahead, logs on the road
      const pol = race.pol, bl = (performance.now() / 260 | 0) % 2, X = (x) => x * sc + mm.ox + tx, Y = (z) => z * sc + mm.oz + ty, inb = (x, y) => x > -6 && y > -6 && x < w + 6 && y < h + 6;
      g.strokeStyle = '#ff3b3b'; g.lineWidth = 2 * d;
      for (const sp of pol.spikes) if (sp.on) { const i = track.idx(sp.s), x = X(track.px[i]), y = Y(track.pz[i]); if (inb(x, y)) { g.beginPath(); g.moveTo(x - track.nx[i] * 5 * d, y - track.nz[i] * 5 * d); g.lineTo(x + track.nx[i] * 5 * d, y + track.nz[i] * 5 * d); g.stroke(); } }
      for (const b of pol.blocks) if (!b.passed) { const i = track.idx(b.s), x = X(track.px[i]), y = Y(track.pz[i]), r2 = 3.6 * d; if (inb(x, y)) { g.beginPath(); g.moveTo(x - r2, y - r2); g.lineTo(x + r2, y + r2); g.moveTo(x + r2, y - r2); g.lineTo(x - r2, y + r2); g.stroke(); } }
      g.fillStyle = '#9a6b3c'; for (const L of pol.traps) if (L.st === 1) for (const q of L.logs) { const x = X(q.x), y = Y(q.z); if (inb(x, y)) g.fillRect(x - 1.2 * d, y - 1.2 * d, 2.4 * d, 2.4 * d); }
      for (const c of pol.cars) { const m = c.pol.mode; if (m === 'wait' || m === 'civil') continue; const x = X(c.x), y = Y(c.z); if (!inb(x, y)) continue;
        g.fillStyle = m === 'chase' ? (bl ^ (c.id & 1) ? '#3a78ff' : '#ff3b3b') : m === 'search' ? '#9aa3b5' : m === 'park' ? '#3a78ff' : '#5a5f68';
        g.strokeStyle = 'rgba(0,0,0,.75)'; g.lineWidth = 1 * d; g.beginPath(); g.arc(x, y, (c.pol.kind === 'moto' ? 1.9 : c.pol.kind === 'van' ? 3 : 2.6) * d, 0, 6.2832); g.fill(); g.stroke(); }
      const H = pol.heli; if (H) { const x = X(H.x), y = Y(H.z), a = performance.now() / 90, r2 = 4.2 * d; if (inb(x, y)) { g.strokeStyle = '#ffffff'; g.lineWidth = 1.4 * d; g.beginPath(); g.arc(x, y, r2, 0, 6.2832); g.moveTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); g.lineTo(x - Math.cos(a) * r2, y - Math.sin(a) * r2); g.stroke(); } }
    }
    // player: arrow in the driving direction
    const ch = Math.cos(P.h), sh = Math.sin(P.h), r = 5.5 * d;
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#111'; g.lineWidth = 1.5 * d; g.beginPath();
    g.moveTo(cx + ch * r * 1.3, cy + sh * r * 1.3); g.lineTo(cx - ch * r * 0.8 - sh * r * 0.8, cy - sh * r * 0.8 + ch * r * 0.8); g.lineTo(cx - ch * r * 0.8 + sh * r * 0.8, cy - sh * r * 0.8 - ch * r * 0.8); g.closePath(); g.fill(); g.stroke();
    // course overview: a slim bar on the right edge, start at the bottom, CP ticks, the player
    const bx = w - 6 * d, y0 = h - 7 * d, y1 = 7 * d, LR = polLen(), f = clamp((P.finished && !P.busted ? LR : P.dist) / LR, 0, 1);   // (the run from the police: to the building at the top; caught: where they stopped the player)
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(bx - 2.5 * d, y1 - 1 * d, 5 * d, y0 - y1 + 2 * d);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(bx - 1 * d, y1, 2 * d, y0 - y1);
    g.fillStyle = '#ffc629'; g.fillRect(bx - 1 * d, y0 - (y0 - y1) * f, 2 * d, (y0 - y1) * f);
    for (const cd of track.cpDist) { const y = y0 - (y0 - y1) * cd / LR; g.fillRect(bx - 3 * d, y - 0.75 * d, 6 * d, 1.5 * d); }
    for (const c of race.cars) if (c !== P) { const y = y0 - (y0 - y1) * clamp((c.finished ? LR : c.dist) / LR, 0, 1); g.fillStyle = hexCss(c.color); g.fillRect(bx - 3 * d, y - 1 * d, 6 * d, 2 * d); }   // (the rivals on the bar)
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#111'; g.lineWidth = 1 * d; g.beginPath(); g.arc(bx, y0 - (y0 - y1) * f, 2.8 * d, 0, 6.2832); g.fill(); g.stroke();
  }
  function drawMinimap() {
    if (!mm.img) buildMinimap();
    const g = mm.ctx, d = mm.dpr; if (!g) return;
    if (mm.open) { drawMinimapOpen(g, d); return; }
    g.clearRect(0, 0, mm.w, mm.h); g.drawImage(mm.img, 0, 0);
    const P = race.player;
    for (const c of race.cars) {
      if (c === P) continue;
      const x = c.x * mm.sc + mm.ox, y = c.z * mm.sc + mm.oz;
      g.fillStyle = hexCss(c.color); g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 1 * d;
      g.beginPath(); g.arc(x, y, 2.6 * d, 0, 6.2832); g.fill(); g.stroke();
    }
    if (race.fl) {   // flags: a yellow zone (the stopped car: a yellow ring), the safety car (an orange square)
      for (const yl of race.fl.yel) { const c = yl.car, x = c.x * mm.sc + mm.ox, y = c.z * mm.sc + mm.oz; g.strokeStyle = '#ffd21f'; g.lineWidth = 2 * d; g.beginPath(); g.arc(x, y, 5.5 * d, 0, 6.2832); g.stroke(); }
      const X = race.fl.sc && race.fl.sc.car; if (X) { const x = X.x * mm.sc + mm.ox, y = X.z * mm.sc + mm.oz; g.fillStyle = '#ffa21a'; g.strokeStyle = '#111'; g.lineWidth = 1 * d; g.fillRect(x - 3 * d, y - 3 * d, 6 * d, 6 * d); g.strokeRect(x - 3 * d, y - 3 * d, 6 * d, 6 * d); }
    }
    const x = P.x * mm.sc + mm.ox, y = P.z * mm.sc + mm.oz;
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#111'; g.lineWidth = 1.6 * d;
    g.beginPath(); g.arc(x, y, 4.2 * d, 0, 6.2832); g.fill(); g.stroke();
  }
  const sp = { cv: null, ctx: null, w: 0, h: 0, dpr: 1, lastR: -1, lastG: null };
  function drawSpeedo(P) {
    if (!sp.ctx) { sp.cv = $('speedo-c'); sp.ctx = sp.cv.getContext('2d'); }
    const r = sp.cv.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w !== sp.w || h !== sp.h) { sp.cv.width = w; sp.cv.height = h; sp.w = w; sp.h = h; sp.dpr = dpr; sp.lastR = -1; }
    const f = clamp(P.rpm / P.m.redline, 0, 1);
    if (Math.abs(f - sp.lastR) < 0.004) return;
    sp.lastR = f;
    const g = sp.ctx; g.clearRect(0, 0, w, h);
    const cx = w * 0.4, cy = h * 0.62, R = h * 0.44;
    const a0 = Math.PI * 5 / 6, a1 = Math.PI * 2, N = 16;
    g.lineCap = 'butt';
    g.strokeStyle = 'rgba(8,11,16,.6)'; g.lineWidth = R * 0.34; g.beginPath(); g.arc(cx, cy, R, a0 - 0.06, a1 + 0.06); g.stroke();
    g.lineWidth = R * 0.2;
    for (let i = 0; i < N; i++) {
      const t0 = i / N, t1 = (i + 0.74) / N;
      const lit = t0 < f;
      const col = t0 < 0.6 ? (lit ? '#5fd13a' : '#1d3319') : t0 < 0.82 ? (lit ? '#f1c21b' : '#3a3214') : (lit ? '#ee3b2b' : '#3d1a17');
      g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, R, a0 + (a1 - a0) * t0, a0 + (a1 - a0) * t1); g.stroke();
    }
    const an = a0 + (a1 - a0) * f;
    g.strokeStyle = '#ffffff'; g.lineWidth = 2.2 * dpr; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx + Math.cos(an) * R * 0.2, cy + Math.sin(an) * R * 0.2); g.lineTo(cx + Math.cos(an) * R * 1.1, cy + Math.sin(an) * R * 1.1); g.stroke();
    g.fillStyle = '#10151c'; g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.2 * dpr; g.beginPath(); g.arc(cx, cy, R * 0.16, 0, 6.2832); g.fill(); g.stroke();
  }
  const NOTE_PATHS = {
    r1: 'M22 54 V36 Q22 20 38 20 H46 M38 11 L47 20 L38 29',
    l1: 'M42 54 V36 Q42 20 26 20 H18 M26 11 L17 20 L26 29',
    r3: 'M20 54 V28 Q20 12 32 12 Q44 12 44 28 V42 M35 34 L44 43 L53 34',
    l3: 'M44 54 V28 Q44 12 32 12 Q20 12 20 28 V42 M29 34 L20 43 L11 34'
  };
  let lastNote = '';
  function updateNote(P) {
    const el = $('h-note');
    if (!S.notes || phase !== 'racing') { if (lastNote) { el.className = ''; lastNote = ''; } return; }
    const L = track.len, s = P.q.s, v = P.speed;
    const look = 35 + v * 2.3;
    let best = null, bd = 1e9;
    for (const c of track.corners) {
      let d = c.s0 - s; if (d < -L / 2) d += L; if (d > L / 2) d -= L;
      if (d > 4 && d < look && d < bd) { bd = d; best = c; }
    }
    let key = '';
    if (best) {
      const hair = best.sev === 3 && best.angle > 2.0;
      key = (best.dir > 0 ? 'r' : 'l') + (hair ? '3' : '1') + '|' + best.sev;
    }
    if (key === lastNote) return;
    lastNote = key;
    if (!key) { el.className = ''; return; }
    const [pk, sev] = key.split('|');
    $('h-note-path').setAttribute('d', NOTE_PATHS[pk]);
    el.className = 'show sev' + sev;
  }
  const hudCache = {};
  function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
  let dmgKey = '', dmgShown = null;
  const dmgCol = (z) => 'hsl(' + Math.round(120 * (1 - Math.min(1, z))) + ',78%,' + (z < 0.02 ? 52 : 50) + '%)';
  function updateDamageHUD(P) {
    const el = $('h-dmg'); if (!el) return;
    const on = dmgOn();
    if (on !== dmgShown) { el.style.display = on ? '' : 'none'; dmgShown = on; }
    if (!on) return;
    const key = P.dz.map(v => Math.round(v * 25)).join(',');
    if (key === dmgKey) return; dmgKey = key;
    for (let k = 0; k < 4; k++) $('dz' + k).setAttribute('fill', dmgCol(P.dz[k]));
  }
  // time trial: CP counter, altitude, clock from the green light, personal best, split popups with the difference to the PB splits
  function updateHUDTT(dt, P) {
    hxFrame(dt, P);   // (turn counter, live difference to the best run, height profile: below)
    if (pk.on) pkNoteFrame(P);   // (Pikes Peak: the corner warnings)
    const nCP = track.cpS.length, R0 = rec(track.def.id);
    setText('h-lap', P.finished ? tr('CILJ') : 'CP ' + P.cp + '/' + nCP);
    // altitude of the road under the car (not the body, as in the splits table), between start and summit (or the foot of a descent); frozen at the
    // finish. A stage without altitudes (a rally stage): the distance still to go to the finish, to the nearest 0.1 km (at least 0.1 until the line)
    const al = track.def.alt, alt = track.altAt(P.finished ? track.hy[track.finishIdx] : P.roadY || 0);
    setText('h-alt', alt != null ? numDot(al ? clamp(alt, Math.min(al[0], al[1]), Math.max(al[0], al[1])) : alt) + ' m' : P.finished ? '' : tr('še {0} km', kmTxt(Math.max(100, Math.round(clamp(track.raceLen - Math.max(0, P.dist), 0, track.raceLen) / 100) * 100), 1)));
    const cur = P.finished ? P.finishTime : phase === 'racing' ? race.time : 0;
    setText('h-time', fmt(cur, true));
    setText('h-bestv', fmt(R0.bestTime || NaN, true));   // personal best (a new one shows as soon as the run ends)
    if (cpSeen < P.cpEv) {   // new checkpoint (if the HUD fell behind, only the latest; none after the finish, the finish popup has the word)
      cpSeen = P.cpEv;
      const k = P.cp, t = P.splits[k - 1]; if (P.finished || !(k >= 1) || !(t >= 0)) return;
      const pb = pk.on ? pkSplit(k - 1) : Array.isArray(R0.bestSplits) ? R0.bestSplits[k - 1] : NaN, d = t - pb, has = isFinite(d);   // (Pikes Peak: the class best run's)
      const el = $('h-split'); el.textContent = 'CP' + k + '  ' + fmt(t, true) + (has ? '  ' + sgn(d) : ''); el.className = 'show ' + (has ? dCls(d) : 'even'); splitT = 3.5; cornerShow = false;   // (a place name waits until the split clears)
      if (pk.on) pkSplitHUD(k, t, d, has); else   // (Pikes Peak: the TV pill instead of the big popup)
      showMsg('CP' + k + (has ? ' ' + sgn(d) : ''), has ? (d < 0 ? 'fast' : 'warn') : 'gold', 1.5);
      Sfx.beep(has && d < 0 ? 990 : 740, 0.12, 0.12);
      if (!has) Comm.say(ttLine(track.def, 'cpFirst'), { cp: k, time: spkTime(t) }, 2);
      else Comm.say(Math.abs(d) < 0.005 ? 'cpEven' : d < 0 ? 'cpFast' : 'cpSlow', { cp: k, delta: spkDelta(d) }, 3);
    }
  }
  /* ---------------- time trial HUD: turn counter, live difference to the best run, height profile ---------------- */
  // OVINEK n/156 (def.turnNos): the real number of the next modelled corner ahead of the car; 156/156 after the last one. The live
  // difference to the best run (its stored ghost), on the NAJ line under the clock: this run's clock against the time the best run
  // passed the same point of the road (its samples projected onto the road once, at the start: a rising s -> time table), smoothed and
  // written ~8 times a second. It also shows with the ghost car switched off: like the CP split popups it is data (the setting
  // hides the see-through car on the road). The height profile (def.alt): the road from the start line to the finish drawn
  // once (CP ticks, start and finish marks), the part climbed in yellow, the player's dot and the best run's see-through ring; redrawn
  // only when one of them moves. Only in a time trial alone (never online): every other race keeps its HUD as it was.
  const hx = { turns: null, gs: null, gt: 0, dSm: 0, dT: 0, prof: false };
  const pf = { cv: null, g: null, w: 0, h: 0, dpr: 1, key: '', base: null, done: null, ys: null, x0: 0, x1: 0, lp: -1, lg: -1, hooked: false };
  function hxStart() {   // newRace (after ghStart): what this race shows
    const on = race.timeTrial && !(mp && mp.race), d = track.def;
    hx.turns = on && typeof d.turnNos === 'function' ? d.turnNos(track) : null; if (hx.turns && !hx.turns.length) hx.turns = null;
    hx.gs = on && ghPlay ? hxTable(ghPlay) : null; hx.gt = ghPlay ? ghPlay.t : 0; hx.dSm = 0; hx.dT = 0; setText('h-delta', '\u00b10.00'); $('h-delta').className = 'even';
    hx.prof = on && !!d.alt; pf.key = '';
    $('hud').classList.toggle('ttn', !!hx.turns); $('hud').classList.toggle('ttd', !!hx.gs); $('hud').classList.toggle('ttp', hx.prof);
    if (!pf.hooked) { pf.hooked = true; const re = () => { pf.key = ''; }; window.addEventListener('resize', re); window.addEventListener('orientationchange', () => setTimeout(re, 250)); }   // (a new size: drawn again)
  }
  // the best run's place on the road at each sample: projected onto the centre line from the last sample's place (no jump between the
  // legs of a hairpin ladder), kept rising (after a spin or a moment backwards it counts from the first time the best run got there)
  function hxTable(G) {
    const s = new Float32Array(G.n), q = {}; let hint = track.startIdx, m = -1e9;
    for (let k = 0; k < G.n; k++) { track.query(G.f[k * GH_CH], G.f[k * GH_CH + 2], hint, q); hint = q.i; if (q.s > m) m = q.s; s[k] = m; }
    return s;
  }
  function hxTimeAt(s) {   // the race time at which the best run reached road position s (null past its end)
    const a = hx.gs, n = a.length; if (s > a[n - 1]) return null; if (s <= a[0]) return 0;
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (a[m] < s) lo = m; else hi = m; }
    return (lo + (s - a[lo]) / (a[hi] - a[lo])) * GH_DT;
  }
  const hxSAt = (t) => { const a = hx.gs, u = clamp(t / GH_DT, 0, a.length - 1), k = Math.min(a.length - 2, Math.floor(u)); return a[k] + (a[k + 1] - a[k]) * (u - k); };   // the best run's road position at race time t
  function hxFrame(dt, P) {   // every HUD frame of a time trial
    const sp = track.startS + P.dist;
    if (hx.turns) { const L = hx.turns, N = track.def.turns || L[L.length - 1].n; let k = 0; while (k < L.length && L[k].s <= sp) k++;
      setText('h-turn', tr('OVINEK {0}/{1}', P.finished || k === L.length ? N : L[k].n, N)); }
    if (hx.gs) {   // ±0.00 until the green light; at the finish the exact final difference (as in the finish popup), held
      const racing = phase === 'racing' && !P.finished, tg = racing ? hxTimeAt(sp) : null;
      const d = P.finished ? P.finishTime - hx.gt : racing ? (tg == null ? hx.dSm : race.time - tg) : 0;
      if (!racing || Math.abs(d - hx.dSm) > 1.5) hx.dSm = d; else hx.dSm += (d - hx.dSm) * Math.min(1, dt / 0.3);   // (a rescue: at once)
      if ((hx.dT -= dt) <= 0 || !racing) { hx.dT = 0.12; const v = hx.dSm, a = Math.abs(v), r = Math.round(a * 100), el = $('h-delta');
        setText('h-delta', r ? (v < 0 ? '\u2212' : '+') + (a >= 60 ? fmt(a).slice(0, -1) : (r / 100).toFixed(2)) : '\u00b10.00');   // −1.24 / +0.87 / ±0.00 / +1:02.35
        const c = !r ? 'even' : v < 0 ? 'fast' : 'slow'; if (el.className !== c) el.className = c; }
    }
    if (hx.prof) hxProfile(P);
  }
  function hxProfBuild() {   // the static picture for this track and the panel's size, twice: still to climb (white) and climbed (yellow)
    const T = track, cv = pf.cv || (pf.cv = $('h-prof-c')), r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    pf.key = T.def.id; pf.base = null; pf.lp = pf.lg = -1;
    const w = Math.round(r.width * d), h = Math.round(r.height * d); if (w < 40 * d || h < 24 * d) return;   // (hidden or too small: not drawn)
    cv.width = w; cv.height = h; pf.w = w; pf.h = h; pf.dpr = d; pf.g = cv.getContext('2d');
    const x0 = pf.x0 = 6 * d, x1 = pf.x1 = w - 6 * d, top = 6 * d, bot = h - Math.max(4 * d, h * 0.2), a = Math.floor(x0), b = Math.ceil(x1);
    let lo = 1e9, hi = -1e9; for (let i = T.startIdx; i <= T.finishIdx; i++) { lo = Math.min(lo, T.hy[i]); hi = Math.max(hi, T.hy[i]); }
    const ys = pf.ys = new Float32Array(w);   // the profile's height on the canvas per pixel column (the lowest point a little above the bottom)
    for (let x = 0; x < w; x++) ys[x] = bot - (T.hy[T.idx(T.startS + clamp((x - x0) / (x1 - x0), 0, 1) * T.raceLen)] - lo) / Math.max(1, hi - lo) * (bot - top);
    const mk = (line, f0, f1, lw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      g.beginPath(); g.moveTo(a, h); for (let x = a; x <= b; x++) g.lineTo(x, ys[x]); g.lineTo(b, h); g.closePath();
      const gr = g.createLinearGradient(0, top, 0, h); gr.addColorStop(0, f0); gr.addColorStop(1, f1); g.fillStyle = gr; g.fill();
      g.beginPath(); g.moveTo(a, ys[a]); for (let x = a + 1; x <= b; x++) g.lineTo(x, ys[x]);
      g.lineJoin = g.lineCap = 'round'; g.strokeStyle = line; g.lineWidth = lw; g.stroke();
      for (const s of T.cpS) { const x = Math.round(x0 + (x1 - x0) * (s - T.startS) / T.raceLen), y = ys[x];   // checkpoints: yellow ticks
        g.fillStyle = 'rgba(255,198,41,.5)'; g.fillRect(x - 0.5 * d, y, d, h - y); g.fillStyle = '#ffc629'; g.fillRect(x - d, y - 3.5 * d, 2 * d, 7 * d); }
      g.fillStyle = '#e63b2e'; g.fillRect(a - d, ys[a] - 3.5 * d, 2 * d, 7 * d);   // the start (red, as on the minimap) and the finish
      chequer(g, b, ys[b], 2.6 * d);
      return c; };
    pf.base = mk('rgba(255,255,255,.9)', 'rgba(255,255,255,.3)', 'rgba(255,255,255,.05)', 1.5 * d);
    pf.done = mk('#ffc629', 'rgba(255,198,41,.62)', 'rgba(255,198,41,.14)', 2 * d);
  }
  function hxProfile(P) {   // the player's dot and the best run's ring over it (a halo when level); nothing drawn while neither moved half a pixel
    if (pf.key !== track.def.id) hxProfBuild();
    if (!pf.base) return;
    const T = track, X = (s) => pf.x0 + (pf.x1 - pf.x0) * clamp((s - T.startS) / T.raceLen, 0, 1);
    const xp = P.finished ? pf.x1 : X(T.startS + P.dist), xg = hx.gs ? X(hxSAt(race.time)) : -1;
    if (Math.abs(xp - pf.lp) < 0.5 && Math.abs(xg - pf.lg) < 0.5) return;
    pf.lp = xp; pf.lg = xg;
    const g = pf.g, d = pf.dpr, w = pf.w, h = pf.h, yAt = (x) => pf.ys[clamp(Math.round(x), 0, w - 1)], cw = Math.round(xp);
    g.clearRect(0, 0, w, h); g.drawImage(pf.base, 0, 0);
    if (cw > 0) g.drawImage(pf.done, 0, 0, cw, h, 0, 0, cw, h);
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#111'; g.lineWidth = 1.4 * d; g.beginPath(); g.arc(xp, yAt(xp), 3.4 * d, 0, 6.2832); g.fill(); g.stroke();
    if (xg >= 0) { g.beginPath(); g.arc(xg, yAt(xg), 4.4 * d, 0, 6.2832); g.strokeStyle = 'rgba(8,12,18,.5)'; g.lineWidth = 3 * d; g.stroke(); g.strokeStyle = 'rgba(207,228,255,.92)'; g.lineWidth = 1.4 * d; g.stroke(); }   // (the ghost car's colour)
  }
  // named places (tracks on real places: Ljubljana, Monaco, Pikes Peak, the Nordschleife, Spa, the Red Bull Ring, Suzuka): the name under the clock ~70 m before each
  // one, every lap (also in the time trial), and now and then the commentator says where the driver is (each place's own lines)
  const CORNER_COMM = { 'Flugplatz': 'nrFlug', 'Fuchsröhre': 'nrFuchs', 'Breidscheid': 'nrBreid', 'Karussell': 'nrKar', 'Hohe Acht': 'nrHohe', 'Pflanzgarten': 'nrPflanz', 'Döttinger Höhe': 'nrDott' };   // older pools, for names without lines
  const PLACE_GAP = 14, PLACE_GAP_ONE = 8;   // s of race time between two place lines: circuits / one lap or an open road
  let placeKeys = [], placeSt = null;
  function placeInit() {   // newRace: each place's lines go to the commentator under their own key, so every place alternates its own lines
    const L = track.names || [];
    placeKeys = L.map((q, k) => { const key = 'place:' + track.def.id + ':' + k; return q.say && Comm.addLines(key, q.say) ? key : CORNER_COMM[q.n] || null; });
    placeSt = { said: {}, lastT: -1e9, log: [] };
    placeExpose();
  }
  function updateCorner(P) {
    const L = track.names; if (!L || !L.length || phase !== 'racing' || P.finished || P.dist < 0) return;
    const a = P.dist + 70, lapN = track.open ? 0 : Math.floor(a / track.len), la = a - lapN * track.len;   // 70 m ahead, wrapped into the lap
    let k = -1;
    for (let n = 0; n < L.length; n++) if (L[n].d <= la) k = n;
    if (k < 0) return;
    const key = lapN * 1000 + k;
    if (key <= cornerSeen) return;   // each place once a lap, never again after reversing or a rescue behind it
    if (L[k].hud && splitT > 0.5 && !cornerShow) return;   // a lap time or CP split is up: the name waits (pending) until it clears
    cornerSeen = key;
    if (L[k].hud) { const el = $('h-split'); el.textContent = Lang.place(L[k].n).toUpperCase(); el.className = 'show even'; splitT = 2.6; cornerShow = true; }   // (hud false: only said)
    placeSpeak(k, lapN + 1, P);
  }
  // a place is said once a race (3+ laps: now and then once more, never on the next lap); one skipped (spacing, commentator busy)
  // or cut off by more important news gets another chance on a later lap. Said as ambient (prio 0): overtakes, splits, crashes and
  // pits cut in, and it is only started into a silence, so it is heard right at the place and never waits behind other news.
  function placeSpeak(k, lap, P) {
    const key = placeKeys[k], st = placeSt; if (!key || !st || !race) return;
    const prev = st.said[k], heard = !!(prev && prev.item && prev.item.spoken && !prev.item.cut);
    let r = '';
    if (heard && (race.laps < 3 || lap - prev.lap < 2 || Math.random() > 0.35)) r = 'heard';
    else if (race.time - st.lastT < (race.laps > 1 ? PLACE_GAP : PLACE_GAP_ONE)) r = 'gap';
    else if (race.timeTrial && track.cpDist.some(c => c > P.dist && c - P.dist < 150)) r = 'cp';   // a checkpoint split is about to be called
    else if ((track.open ? track.raceLen : race.laps * track.len) - P.dist < 200) r = 'finish';   // the finish call would cut it off
    else if (Comm.state().busy) r = 'busy';
    else if (codrvSoon(P, 4)) r = 'codrv';   // (the co-driver's next call is due: the commentator keeps quiet)
    let item = null;
    if (!r) { item = Comm.say(key, null, 0); if (item) { st.said[k] = { lap, item }; st.lastT = race.time; } else r = 'off'; }
    st.log.push({ k, n: track.names[k].n, lap, t: race.time, r: r || 'say', item }); if (st.log.length > 300) st.log.shift();
  }
  /* ---------------- the co-driver (a rally stage, S.codrv): the pace notes (Track.paceNotes) read out ahead of the car ----------------
     A call is said when the car is ~2.4 s (55 to 170 m) before its first note; one already driven past (a rescue, a spin) is skipped. */
  let cdN = null, cdK = 0, cdLog = [];
  function codrvInit() {
    cdN = race.timeTrial && (isRally(track.def) || isDesc(track.def)) && +S.codrv ? track.paceNotes() : null; cdK = 0; cdLog = [];   // (a rally stage, a gravel descent)
    const g = window.__game; if (g && !Object.getOwnPropertyDescriptor(g, 'codrv')) Object.defineProperty(g, 'codrv', { configurable: true, get: () => ({ calls: cdN ? cdN.length : 0, k: cdK, log: cdLog.slice() }) });   // (tests)
  }
  const cdLead = (P) => clamp(P.speed * 2.4 + 30, 55, 170);
  function updateCodrv(P) {
    if (!cdN || phase !== 'racing' || P.finished) return;
    const s = P.q.s;
    while (cdK < cdN.length && cdN[cdK].s < s - 10) cdK++;   // (driven past without it)
    const c = cdN[cdK];
    if (c && c.s - s <= cdLead(P)) { const it = Comm.note(c.text); cdLog.push({ k: cdK, d: Math.round(c.s - s), t: race.time, text: c.text, item: !!it }); if (cdLog.length > 200) cdLog.shift(); cdK++; }
  }
  const codrvSoon = (P, sec) => { const c = cdN && cdN[cdK]; return !!c && c.s - P.q.s - cdLead(P) < Math.max(P.speed, 15) * sec; };   // (15 m/s: the car still picking up speed)

  // tests: window.__game.places (the names, their commentator keys, what was said and why places were skipped)
  function placeExpose() {
    const g = window.__game; if (!g || Object.getOwnPropertyDescriptor(g, 'places')) return;
    Object.defineProperty(g, 'places', { configurable: true, get: () => ({ track: track && track.def.id, keys: placeKeys.slice(), seen: cornerSeen, show: cornerShow,
      names: (track && track.names || []).map(q => ({ n: q.n, d: q.d, lines: q.say ? q.say.length : 0 })),
      log: placeSt ? placeSt.log.map(e => ({ k: e.k, n: e.n, lap: e.lap, t: e.t, r: e.r, text: e.item ? e.item.text : '', spoken: !!(e.item && e.item.spoken), cut: !!(e.item && e.item.cut) })) : [] }) });
  }
  const spkDelta = (d) => { const a = Math.abs(d); return a < 1 ? a.toFixed(2) : a.toFixed(1); };   // never "0.0 seconds"
  const spkTime = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return m ? m + (m === 1 ? ' minute ' : ' minutes ') + s.toFixed(1) : t.toFixed(1) + ' seconds'; };
  function updateHUD(dt) {
    const P = race.player;
    if (race.timeTrial) updateHUDTT(dt, P);
    else if (race.quali) {   // qualifying: the lap under way, the lap record beside it
      setText('h-pos', '–');
      setText('h-lap', tr(P.finished ? 'CILJ' : P.lap >= 1 ? 'LETEČI KROG' : 'KVALIFIKACIJE'));
      setText('h-time', fmt(P.finished ? P.lapTimes[0] || 0 : P.lap >= 1 && phase === 'racing' ? race.time - P.lapStart : 0, true));
      setText('h-bestv', fmt(rec(track.def.id).bestLap || NaN, true));
      if (P.lap >= 1 && !P.finished && !qual.lapShown) { qual.lapShown = true; showMsg(tr('LETEČI KROG!'), 'gold', 1.4); Sfx.beep(990, 0.12, 0.12); Comm.say('qualiLap', null, 3); }
    } else if (track.open) { updateHUDUp(P); if (rdOn) radioStep(P); }
    else {
      setText('h-pos', String(P.pos || race.cars.length));
      const lapShown = clamp(P.lap, 1, race.laps);
      setText('h-lap', tr('KROG {0}/{1}', lapShown, race.laps) + (track.len > 8000 ? ' · ' + kmTxt(clamp(P.finished ? track.len : P.dist - (lapShown - 1) * track.len, 0, track.len), 1) + '/' + kmTxt(track.len, 1) + ' KM' : ''));   // a long lap: how far round it
      const cur = phase === 'racing' ? race.time - P.lapStart : phase === 'finish' || phase === 'done' ? (P.lapTimes[P.lapTimes.length - 1] || 0) : 0;
      setText('h-time', fmt(cur, true));
      const best = P.lapTimes.length ? Math.min(...P.lapTimes) : NaN;
      setText('h-bestv', fmt(best, true));
    }
    updateDamageHUD(P); tyreHUD(P); flagHUD(P); twHUD(dt); fuelHUD(P); enduStep(); if (school) schoolHUD();
    if (!race.timeTrial) secHUD(P);
    if (race.drsLast) { const st = P.drs ? 'open' : P.drsA ? 'arm' : ''; if ($('h-drs').className !== st) $('h-drs').className = st; }
    if (P.drsEv) { P.drsEv = null; if (phase === 'racing') { Sfx.beep(1320, 0.07, 0.08); if (drsN++ % 2 === 0) Comm.say('drs', null, 1); } }   // the flap opens (the commentator: every other time)
    setText('h-speed', String(Math.round(P.speed * 3.6)));
    setText('h-gear', P.gear === -1 ? 'R' : P.m.ev ? 'D' : String(P.gear));   // (the electric car: one gear, D)
    drawSpeedo(P);
    drawMinimap();
    updateNote(P);
    // lap events (a time trial has its own checkpoint / finish popups)
    if (!race.timeTrial && !race.quali && P.lapTimes.length > lastLapCount) {
      lastLapCount = P.lapTimes.length;
      const t = P.lapTimes[lastLapCount - 1];
      const isBest = t <= Math.min(...P.lapTimes) + 1e-6 && lastLapCount > 1;
      const el = $('h-split'); el.textContent = tr('KROG {0}: {1}', lastLapCount, fmt(t, true)) + (isBest ? tr('  NAJHITREJŠI') : ''); el.className = 'show'; splitT = 3.2; cornerShow = false;
      if (!P.finished && P.lap === race.laps) { showMsg(tr('ZADNJI KROG!'), 'gold', 2); Sfx.beep(880, 0.12, 0.12); }
    }
    if (splitT > 0) { splitT -= dt; if (splitT <= 0) $('h-split').className = ''; }
    updateCorner(P);
    updateCodrv(P);
    // wrong way
    if (phase === 'racing') {
      if (P.wrongT > 1.1) { if ($('h-msg').textContent !== tr('NAPAČNA SMER!')) showMsg(tr('NAPAČNA SMER!'), 'warn', 0.5); else msgT = 0.4; }
      const stuck = (P.stuckT > 2.5 || P.wrongT > 4) && !(race.pol && (race.pol.hold || race.pol.stage === 'check'));   // (stopped at the police checkpoint on purpose: no rescue)
      $('btn-rescue').classList.toggle('off', !stuck);
    }
    if (P.pitState === 'repair' && P.pitDur > 0) { const pct = Math.min(99, Math.floor(P.pitT / P.pitDur * 100)); const txt = tr('POPRAVILO {0} %', pct); if ($('h-msg').textContent !== txt) { $('h-msg').textContent = txt; $('h-msg').className = 'show gold'; } msgT = 0.3; }
    if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('h-msg').className = ''; }
  }
  function updateHUDUp(P) {   // a race up an open road (Vršič): the place, km done of the whole road, the altitude, the race clock, the best race so far
    const L = polLen(), al = track.def.alt, done = P.finished && !P.busted, alt = track.altAt(done && !race.pol ? track.hy[track.finishIdx] : P.roadY || 0);   // (busted by the police: where they were stopped; the run from the police: the building at the top)
    setText('h-pos', race.pol ? String(race.pol.cars.filter(c => c.pol.mode === 'chase').length) : String(P.pos || race.cars.length));
    setText('h-lap', kmTxt(clamp(done ? L : P.dist, 0, L), 1) + '/' + kmTxt(L, 1) + ' KM');
    setText('h-alt', alt != null ? numDot(al ? clamp(alt, al[0], al[1]) : alt) + ' m' : '');
    setText('h-time', fmt(P.finished ? P.finishTime : phase === 'racing' ? race.time : 0, true));
    setText('h-bestv', fmt(rec(track.def.id).bestRace || NaN, true));
    if (race.pol) {   // the run from the police: before the chase the checkpoint (chkHUD); in it the heat (stars), the busted meter, the flat tyres, hiding; the arrows of the patrol cars behind (tailHUD)
      const pol = race.pol, ch = pol.stage === 'chase' || (pol.stage === 'over' && !!polRun.why), h = Math.round(pol.heat), nf = [0, 1, 2, 3].filter(k => (P.flat || 0) & (1 << k)).length;
      $('h-pol').classList.toggle('pre', !ch);   // (no stars, no busted meter before the chase)
      setText('h-heat', ch ? '\u2605'.repeat(h) + '\u2606'.repeat(5 - h) : ''); $('h-bustbar').style.width = (pol.bust * 100).toFixed(0) + '%'; $('h-pol').classList.toggle('warn', ch && pol.bust > 0.02);
      setText('h-flat', nf ? tr('PREBITE GUME: {0}', nf) : '');
      const hid = ch && !pol.lost && pol.hide > 0.02 && !P.finished; $('h-pol').classList.toggle('hid', hid); $('h-pol').classList.toggle('lost', pol.lost && !P.finished);   // (out of their sight: the meter; lost: grey stars)
      $('h-hidebar').style.width = (pol.hide * 100).toFixed(0) + '%'; setText('h-hidel', P.finished || !ch ? '' : tr(pol.lost ? 'IZGUBILI SO SLED' : hid ? 'SKRIVANJE' : pol.heli && pol.heli.st === 'track' ? 'HELIKOPTER NAD TABO' : ''));
      chkHUD(P, pol); tailHUD(P, pol);
      if (pol.hold && phase === 'racing') $('touch').classList.add('off');   // (parked at the checkpoint: the brakes held, the arrest on the screen)
    } else if (race.tf) {   // the duel: how far the rival is ahead or behind (in seconds at the speed now)
      const o = race.cars.find(c => c !== P);
      if (o) { const g = (o.finished ? L : o.dist) - (P.finished ? L : P.dist), t = Math.abs(g) / Math.max(12, P.speed, o.speed), f = Lang.dec(t.toFixed(1));
        setText('h-gap', o.finished && P.finished ? '' : tr(g >= 0 ? 'TEKMEC {0} s PRED TABO' : 'TEKMEC {0} s ZA TABO', f)); $('h-gap').classList.toggle('behind', g < 0); }
    }
  }
  // the length of the run up the open road: the run from the police to the building at the top (pol.goal), else to the finish
  const polLen = () => race && race.pol && race.pol.goal ? race.pol.goal.s - track.startS : track.raceLen;
  // the run from the police, a line under the police's panel: the checkpoint ahead and what to do at it (before the chase), the building at the
  // top near the end (where to hide)
  let chkKey = '';
  function chkHUD(P, pol) {
    const K = pol.chk, g = K ? K.s - P.q.s : -1e9, G = pol.goal; let t = '', s = '';   // (a road without the checkpoint: K null, the chase from the start)
    if (!P.finished && phase === 'racing') {
      if (pol.stage === 'free' && g > 0 && g < 650) t = tr('KONTROLA PROMETA · {0} m', Math.round(g / 10) * 10);
      else if (pol.stage === 'check') switch (K.st) {
        case 'approach': t = tr('POLICIJSKA KONTROLA') + (g > 3 ? ' · ' + Math.round(g) + ' m' : ''); s = tr('Ustavi pri policistu (ali pobegni)'); break;
        case 'stopped': case 'walk': t = tr('POLICIJSKA KONTROLA'); s = tr('Policist prihaja k oknu (ali pobegni)'); break;
        case 'docs': t = tr('POLICIJSKA KONTROLA'); s = tr('Policist hoče dokumente (ali pobegni)'); break;
        case 'park': { const b = Math.hypot(P.x - K.box.x, P.z - K.box.z); t = tr('ZAPELJI OB ROB VOZIŠČA'); s = tr('Parkiraj v označeno polje') + (b > 2.5 ? ' · ' + Math.round(b) + ' m' : '') + tr(' (ali pobegni)'); break; }
        case 'parked': t = tr('POLICIJSKA KONTROLA'); s = tr('Greš s policistom na postajo'); break;
      }
      else if (pol.stage === 'chase' && G && G.s - P.q.s < 800 && G.s - P.q.s > -30) { t = tr('SKRIVALIŠČE · {0} m', Math.max(0, Math.round((G.s - P.q.s) / 10) * 10)); s = tr(G.side > 0 ? 'Garaža desno ob cesti: zapelji noter' : 'Garaža levo ob cesti: zapelji noter'); }
    }
    const h = t ? '<b>' + t + '</b>' + (s ? '<span>' + s + '</span>' : '') : '';
    if (h !== chkKey) { chkKey = h; const el = $('h-chk'); el.innerHTML = h; el.classList.toggle('on', !!h); }
  }
  // the run from the police: the patrol cars behind the player (in the chase or searching; just alongside too), the nearest four by the road:
  // an arrow at the bottom pointing where each is from the player's heading, placed across by that, with how far back it is along the road
  // (a car in a side road, or the player in one: in a straight line); blue and red flashing in the chase, grey searching, fainter far back
  const tail = { el: null, k: [] };
  function tailHUD(P, pol) {
    if (!tail.el) { tail.el = [...$('h-tail').children]; tail.k = tail.el.map(() => ''); }
    const ch = Math.cos(P.h), sh = Math.sin(P.h), inS = P.q.k >= 0, L = [], bl = (performance.now() / 260 | 0) % 2;
    if (!P.finished && phase === 'racing') for (const c of pol.cars) {
      const m = c.pol.mode; if (m !== 'chase' && m !== 'search') continue;
      const dx = c.x - P.x, dz = c.z - P.z, lon = dx * ch + dz * sh, lat = -dx * sh + dz * ch, st = inS || c.q.k >= 0, g = st ? Math.hypot(dx, dz) : P.q.s - c.q.s;
      if (st ? g > 400 || lon > 6 : g < -6 || g > 600) continue;
      L.push({ c, g, m, a: Math.atan2(lat, -lon) });   // (a: 0 straight behind, + to the right)
    }
    L.sort((a, b) => a.g - b.g); L.length = Math.min(L.length, tail.el.length);
    const X0 = L.map(e => 50 + 44 * Math.sin(e.a)), X = X0.slice(), ord = X.map((x, i) => i).sort((a, b) => X[a] - X[b]);   // (across by the angle, then kept 13 % apart, the group where it was)
    for (let j = 1; j < ord.length; j++) X[ord[j]] = Math.max(X[ord[j]], X[ord[j - 1]] + 13);
    if (ord.length) { let d = (X0.reduce((a, b) => a + b, 0) - X.reduce((a, b) => a + b, 0)) / X.length; const lo = X[ord[0]] + d, hi = X[ord[ord.length - 1]] + d;
      if (lo < 6) d += 6 - lo; else if (hi > 94) d -= hi - 94; for (let i = 0; i < X.length; i++) X[i] += d; }
    tail.el.forEach((el, i) => {
      const e = L[i], key = e ? [X[i].toFixed(1), Math.round(180 - e.a * 180 / Math.PI), e.m === 'search' ? 's' : bl ^ (e.c.id & 1) ? 'b' : 'r', e.g < 5 ? 'ob tebi' : (e.g < 50 ? Math.round(e.g) : Math.round(e.g / 5) * 5) + ' m', (e.g > 300 ? clamp(1 - (e.g - 300) / 500, 0.4, 1) : 1).toFixed(2)].join('|') : '';
      if (key === tail.k[i]) return;
      tail.k[i] = key; if (!e) { el.className = ''; return; }
      const [x, r, cl, txt, op] = key.split('|');
      el.className = 'on ' + cl + (i ? '' : ' n'); el.style.left = x + '%'; el.style.opacity = op; el.firstElementChild.style.transform = 'rotate(' + r + 'deg)'; el.lastElementChild.textContent = txt;
    });
  }

  /* ---------------- the timing tower (Časovna tabela): the order with the gaps to the leader, as on TV ----------------
     A race with rivals (a circuit, a race up an open road, the duel in the traffic, a race online): each car's race time at every 25 m of its
     race (twMark, after each physics step); a car's gap to the leader is its time at the last mark it passed less the leader's time there (a
     lapped car: +1 KROG). Shown four times a second: the whole order when it is short, else the first three and the player with the cars just
     ahead and behind (two each upright, one on a phone on its side); the player's row lit, a car in the pits and one past the line marked.
     Its pit stops go to the lap table on the results. */
  const TW_M = 25;
  let tw = null;
  function twStart() {
    tw = !race.timeTrial && !race.quali && !race.pol && race.cars.length > 1 ? { t: new Map(), n: new Map(), pit: new Map(), stops: new Map(), html: '', at: 0 } : null;
    $('hud').classList.toggle('tw', !!tw && !!S.tower); $('h-tower').innerHTML = '';
  }
  function twMark() {
    if (!tw) return;
    const total = track.open ? track.raceLen : track.len * race.laps;
    for (const c of race.cars) {
      let a = tw.t.get(c); if (!a) { a = new Float32Array(Math.ceil(total / TW_M) + 4); tw.t.set(c, a); tw.n.set(c, 0); }
      let n = tw.n.get(c); const k = Math.min(a.length - 1, Math.floor(c.dist / TW_M));
      while (n <= k) a[n++] = race.time;
      tw.n.set(c, n);
      const p = !!c.inPit; if (p && !tw.pit.get(c)) tw.stops.set(c, (tw.stops.get(c) || 0) + 1); tw.pit.set(c, p);
    }
  }
  function twGap(c, L) {   // seconds behind the leader L at the last mark c passed (null: none yet)
    const k = (tw.n.get(c) || 0) - 1; if (k < 0 || k >= (tw.n.get(L) || 0)) return null;
    return tw.t.get(c)[k] - tw.t.get(L)[k];
  }
  const twCode = (c) => c.isPlayer ? tr('TI') : (String(c.name).split(/[\s.]+/).filter(Boolean).pop() || '?').slice(0, 3).toUpperCase();   // (M. Kovač -> KOV)
  function twHUD(dt) {
    if (!tw || !S.tower || (tw.at -= dt) > 0) return; tw.at = 0.25;
    const O = race.order && race.order.length === race.cars.length ? race.order : race.cars.slice().sort((a, b) => b.dist - a.dist), L = O[0], P = race.player, pi = O.indexOf(P);
    const nb = window.innerHeight > window.innerWidth ? 2 : 1, rows = new Set();
    if (O.length <= 3 + 2 * nb + 1) O.forEach((c, i) => rows.add(i)); else { for (let i = 0; i < 3; i++) rows.add(i); for (let i = pi - nb; i <= pi + nb; i++) if (i >= 0 && i < O.length) rows.add(i); }
    let h = '', prev = -1;
    for (const i of [...rows].sort((a, b) => a - b)) {
      if (prev >= 0 && i > prev + 1) h += '<div class="tw-sep">⋯</div>';
      const c = O[i], down = !track.open && L.dist - c.dist >= track.len ? Math.floor((L.dist - c.dist) / track.len) : 0, g = i ? twGap(c, L) : null;
      const txt = !i ? tr('VODI') : c.inPit && !c.finished ? tr('BOKSI') : down ? '+' + lapWord(down) : g == null ? '' : '+' + (g >= 60 ? fmt(g).slice(0, -2) : g.toFixed(1));
      h += '<div class="tw-r' + (c === P ? ' me' : '') + (c.finished ? ' fin' : '') + (c.chr && c.chr.rival ? ' rv' : '') + (c.chr && c.chr.duelOn ? ' du' : '') + '"><b>' + (i + 1) + '</b><i style="background:' + hexCss(c.color) + '"></i><span>' + esc(twCode(c)) + '</span><em>' + txt + '</em></div>';
      prev = i;
    }
    if (h !== tw.html) { tw.html = h; $('h-tower').innerHTML = h; }
  }
  // the results of a race on a circuit (two laps or more): every driver's laps, the driver's best in green, the race's fastest in purple, the pit stops
  function lapTable(res) {
    const el = $('res-laps'), n = race.laps, all = race.cars.flatMap(c => c.lapTimes.filter(t => t > 0)), best = all.length ? Math.min(...all) : NaN;
    if (track.open || n < 2) { el.classList.add('off'); el.innerHTML = ''; return; }
    const cols = Array.from({ length: n }, (_, k) => k);
    el.innerHTML = '<p class="ltab-h">' + tr('Krogi vseh voznikov') + '</p><div class="laps-wrap"><table class="ltab laps"><thead><tr><th>#</th><th>' + tr('Voznik') + '</th>' + cols.map(k => '<th>' + tr('K{0}', k + 1) + '</th>').join('') + '<th>' + tr('Postanki') + '</th></tr></thead><tbody>' +
      res.map((r, i) => { const c = r.car, lt = c.lapTimes.filter(t => t > 0), pb = lt.length ? Math.min(...lt) : NaN;
        return '<tr class="' + (c.isPlayer ? 'me' : '') + '"><td>' + (i + 1) + '</td><td class="nm"><span class="dot" style="background:' + hexCss(c.color) + '"></span>' + esc(c.isPlayer ? tr('Ti') : c.name) + '</td>' +
          cols.map(k => { const t = c.lapTimes[k]; return '<td class="' + (t === best ? 'ob' : t === pb ? 'pb' : '') + '">' + (t > 0 ? fmt(t) : '–') + '</td>'; }).join('') + '<td>' + ((tw && tw.stops.get(c)) || 0) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    el.classList.remove('off');
  }

  /* ---------------- commentator (English) ---------------- */
  const PART_EN = { bumperF: 'front bumper', bumperR: 'rear bumper', hood: 'bonnet', trunk: 'boot lid', mirrorL: 'mirror', mirrorR: 'mirror', fenderL: 'front wing', fenderR: 'front wing' };
  const PART_EN_F = { bumperF: 'front wing', bumperR: 'rear wing', hood: 'nose cone', trunk: 'engine cover', mirrorL: 'mirror', mirrorR: 'mirror', fenderL: 'bargeboard', fenderR: 'bargeboard' };   // (the formula's parts)
  const PART_EN_LM = { bumperF: 'splitter', bumperR: 'rear wing', hood: 'nose', trunk: 'engine cover', mirrorL: 'mirror', mirrorR: 'mirror', fenderL: 'louvre panel', fenderR: 'louvre panel' };   // (the prototype's)
  const EN_NAME = { monaco: 'Monte Carlo', gozd: 'the Copper Forest',  jezero: 'Jezero Ring', riviera: 'the Riviera', gora: 'the mountain rally stage', pikes: 'Pikes Peak', pikesg: 'Pikes Peak', ouninpohja: 'Ouninpohja', harju: 'Harju', nring: 'the Nürburgring Nordschleife', spa: 'Spa-Francorchamps', toskana: 'Tuscany', grom: 'Thunder Cape', rbring: 'the Red Bull Ring', suzuka: 'Suzuka', vrsic: 'the Vrshich pass', caracoles: 'Los Caracoles', katu: 'the Katu-Yaryk pass', bathurst: 'Bathurst', chapman: "Chapman's Peak", bigsur: 'Big Sur', tianmen: 'Tianmen', sani: 'Sani Pass', mulholland: 'Mulholland Highway', beartooth: 'the Beartooth Highway', moki: 'the Moki Dugway', cpalace: 'Crystal Palace', riverside: 'Riverside', longford: 'Longford' };
  const cev = { wall: 0, car: 0 };          // impacts collected per physics step
  let cs = null;
  function commReset() {
    cs = { lastPos: race.player.grid, posHold: 0, laps: 0, best: Infinity, rec: rec(track.def.id).bestLap || Infinity,
      driftT: 0, offT: 0, pressT: 0, wasAir: false, jumpRoll: false, jumpSaid: false, chatT: 20 + Math.random() * 8, finalSaid: false, cd: {} };
    cev.wall = 0; cev.car = 0;
  }
  const cool = (k, sec) => { const t = race.time; if (cs.cd[k] != null && t - cs.cd[k] < sec) return false; cs.cd[k] = t; return true; };
  function commTick(dt) {
    if (!cs || !race) return;
    const P = race.player, pos = P.pos || cs.lastPos, n = race.laps, ord = race.order || [], tt = race.timeTrial;
    // position changes (must hold for 1 s, so side-by-side battles don't flicker); a time trial has no positions, laps or gaps (its checkpoints are called in updateHUDTT)
    if (mp && mp.race && mp.race.off) cs.lastPos = pos;   // (a friend who left is no place lost or won)
    if (!tt && pos !== cs.lastPos) {
      cs.posHold += dt;
      if (cs.posHold > 1.0) {
        if (pos < cs.lastPos) { if (pos === 1) Comm.say('lead', null, 4); else Comm.say('gain', { pos: Comm.ordinal(pos) }, 2); }
        else if (cs.lastPos === 1) Comm.say('lostLead', null, 3); else Comm.say('lose', { pos: Comm.ordinal(pos) }, 2);
        cs.lastPos = pos; cs.posHold = 0;
      }
    } else cs.posHold = 0;
    // laps: final lap, fastest lap / track record, lap count
    if (!tt && P.lapTimes.length > cs.laps) {
      cs.laps = P.lapTimes.length;
      const lt = P.lapTimes[cs.laps - 1];
      if (P.lap === n && n > 1 && !cs.finalSaid) { cs.finalSaid = true; Comm.say('final', null, 3); }
      if (cs.laps >= 2 && lt < cs.best && lt < cs.rec) Comm.say('record', { time: lt.toFixed(1) }, 3);
      else if (cs.laps >= 2 && lt < cs.best) Comm.say('best', { time: lt.toFixed(1) }, 2);
      else if (P.lap < n) Comm.say('lap', { lap: P.lap, laps: n }, 1);
      cs.best = Math.min(cs.best, lt);
    }
    // long drift
    if (Math.abs(P.beta || 0) > 0.62 && P.speed > 14 && !P.air) cs.driftT += dt; else cs.driftT = Math.max(0, cs.driftT - dt * 2);   // (the hairpins routinely reach 30-35 deg: a high bar)
    if (cs.driftT > 1.1 && cool('drift', 14)) { Comm.say('drift', null, 1); cs.driftT = 0; }
    // jumps (not every one) and hard landings
    if (P.air && !cs.wasAir) { cs.jumpRoll = Math.random() < 0.6; cs.jumpSaid = false; }
    if (P.air && cs.jumpRoll && !cs.jumpSaid && P.airT > 0.45 && cool('jump', 9)) { cs.jumpSaid = true; Comm.say('jump', null, 1); }
    if (!P.air && cs.wasAir) { if (!cs.jumpSaid && (P.impactVY || 0) < -10 && cool('land', 12)) Comm.say('land', null, 1); cs.jumpSaid = false; }
    cs.wasAir = !!P.air;
    { const n = Object.keys(P.lost).length; if (n > (cs.lostN || 0)) { const last = Object.keys(P.lost)[n - 1]; cs.lostN = n; if (cool('part', 6)) Comm.say('partLost', { part: (P.m.body === 'formula' ? PART_EN_F : P.m.body === 'lm' ? PART_EN_LM : PART_EN)[last] || 'a panel' }, 2); } }
    if (dmgOn() && P.dmg > 0.5 && !cs.dmg1) { cs.dmg1 = true; if (!pitHint) Comm.say('damage', null, 2); }   // (on a track with pits the pit advice said it already)
    if (dmgOn() && P.dmg > 0.8 && !cs.dmg2) { cs.dmg2 = true; Comm.say('heavyDamage', null, 3); }
    // knocked-over trackside props
    if (P.propKnock) { const k = P.propKnock, key = k === 'cone' ? 'propCone' : k === 'tyre' || k === 'tstack' ? 'propTyre' : k === 'bale' || k === 'bstack' || k === 'rbale' || k === 'rbstack' ? 'propBale' : k === 'pylon' ? 'propPylon' : k === 'post' ? 'propPost' : 'propCrate';
      P.propKnock = null; if (P.propKnockV > 7 && cool('prop', 12) && Math.random() < 0.75) Comm.say(key, null, 1); }
    // crashes and contact
    if (cev.wall > 6 && cool('crash', 8)) Comm.say('crash', null, 2);
    else if (cev.car > 5 && cool('contact', 18)) Comm.say('contact', null, 1);
    cev.wall = 0; cev.car = 0;
    // off the road (grass, gravel, city paving)
    let off = 0; for (let k = 0; k < 4; k++) { const sf = P.ws[k]; if (sf === 2 || sf === 3 || sf === 4) off++; }
    if (off >= 3 && P.speed > 8 && !P.air) cs.offT += dt; else cs.offT = 0;
    if (cs.offT > 0.8 && cool('off', 22)) { Comm.say('offtrack', null, 1); cs.offT = 0; }
    if (P.wrongT > 1.1 && cool('wrong', 10)) Comm.say('wrong', null, 3);
    // a car glued to the rear bumper
    const behind = ord[pos], gapB = behind ? P.dist - behind.dist : 99;
    if (gapB > 0 && gapB < 12) cs.pressT += dt; else cs.pressT = 0;
    if (cs.pressT > 3 && cool('pressure', 35)) { Comm.say('pressure', null, 1); cs.pressT = 0; }
    if (tt) return;
    // now and then: the gap to the leader / to second place
    cs.chatT -= dt;
    if (cs.chatT <= 0 && !(mp && mp.race && mp.race.off)) {   // (not to a friend who has left)
      cs.chatT = 32 + Math.random() * 14;
      const v = Math.max(P.speed, 15);
      if (pos === 1 && ord[1]) { const g = (P.dist - ord[1].dist) / v; if (g > 0.6) Comm.say('gapLead', { gap: g.toFixed(1) }, 1); }
      else if (pos > 1 && ord[0]) { const g = (ord[0].dist - P.dist) / v; if (g > 0.4) Comm.say('gapBehind', { gap: g.toFixed(1), pos: Comm.ordinal(pos) }, 1); }
    }
  }

  /* ---------------- phases ---------------- */
  function updatePhase(dt, inp) {
    phaseT += dt;
    if (pkF.on) pkFlyStep();
    const on = mp && mp.race;
    if (on && (phase === 'intro' || phase === 'lights')) phaseT = (Net.now() - on.at) / 1000 - (phase === 'lights' ? 1.3 : 0);   // online: both phones follow the host's clock
    if (phase === 'intro' && phaseT > 1.3 && race.quali) {   // qualifying: no lights, the clock starts at the line
      phase = 'racing'; phaseT = 0; race.start(); showMsg(tr('ČAS SE ZAČNE NA ČRTI'), 'gold', 1.6); Comm.say('qualiGo', null, 3);
    } else if (phase === 'intro' && phaseT > 1.3 && race.pol && race.pol.chk) {   // the run from the police up to its checkpoint: no lights, the player just drives off (nobody after them yet)
      phase = 'racing'; phaseT = 0; race.start(); showMsg(tr('VOZI PROTI VRŠIČU'), 'gold', 1.6);
      if (S.control === 'tilt' && Input.tiltAlive()) Input.calibrate();
    } else if (phase === 'intro' && phaseT > introLen) {
      if (introLen > 1.3) shotOff();   // (the jets' shot is over: the game's camera again)
      phase = 'lights'; phaseT = on ? phaseT - 1.3 : 0; $('h-lights').classList.add('show');
      holdT = on ? on.hold : 0.5 + Math.random() * 0.9;
      if (S.control === 'tilt' && Input.tiltAlive()) Input.calibrate();
    } else if (phase === 'lights') {
      const n = Math.min(5, Math.floor(phaseT / 0.8) + 1);
      if (n !== lightsOn) { lightsOn = n; setLights(n, false); Sfx.beep(520, 0.16, 0.14); }
      if (phaseT > 0.8 * 5 + holdT) {
        if (on) on.late = Math.min(0.25, phaseT - 0.8 * 5 - holdT);   // (online: how far past the planned moment this frame is; the race runs from that moment)
        phase = 'racing'; phaseT = 0; race.start(); if (on) on.startT = Net.now();
        setLights(0, true); Sfx.beep(1040, 0.42, 0.16);
        showMsg(tr('START!'), 'gold', 0.9);
        Comm.say(race.timeTrial ? ownLine(track.def, ttLine(track.def, 'go')) : on ? 'goNet' : race.pol ? 'goPolice' : race.tf ? 'goTraffic' : track.open ? ownLine(track.def, 'goPass') : 'go', null, 4);
        setTimeout(() => { if (phase === 'racing') { $('h-lights').classList.remove('show'); setLights(0, false); } }, 1100);
      }
    } else if (phase === 'racing') {
      if (!race.player.finished && !school) commTick(dt);
      if (race.player.finished) {
        phase = 'finish'; phaseT = 0;
        const pos = race.player.finishPos;
        if (on) {   // online: my time on the shared clock (netMyFinish) goes to the friend; who won shows on the results (the friend may still be on the way)
          const fins = [...on.cars.values()].map(C => C.fin), done = fins.filter(t => t != null), place = 1 + done.filter(t => t < on.mine).length, all = done.length === fins.length;   // (the others' times as far as they are in)
          showMsg(place > 1 ? tr('CILJ! {0} MESTO', Lang.ord(place).toUpperCase()) : all ? tr('ZMAGA!') : tr('CILJ!'), 'gold', 4);
          Comm.say(place === 1 ? 'win' : 'finish', { pos: Comm.ordinal(place) }, 5);
        } else if (race.quali) {   // qualifying: the lap time, the grid once the rivals' laps are in (finishQuali)
          const t = race.player.lapTimes[0], R0 = rec(track.def.id), d = R0.bestLap ? t - R0.bestLap : NaN;
          showMsg(tr('KROG {0}', fmt(t, true)), isFinite(d) && d < 0 ? 'fast' : 'gold', 4);
          if (isFinite(d)) { const el = $('h-split'); el.textContent = tr('REKORD {0}  {1}', fmt(R0.bestLap, true), sgn(d)); el.className = 'show ' + dCls(d); splitT = 4.2; }
          Comm.say('qualiEnd', { time: spkTime(t) }, 5);
        } else if (race.timeTrial) {   // time trial: store the run, finish popup with the difference to the previous record
          const r = ttFinish(), d = r.prev ? r.time - r.prev : NaN, el = $('h-split');
          el.textContent = tr('CILJ  {0}', fmt(r.time, true)) + (r.prev ? '  ' + sgn(d) : ''); el.className = 'show ' + (r.prev ? dCls(d) : 'even'); splitT = 5;
          const sp = $('h-ttsp'); sp.innerHTML = '<table><thead><tr><th></th><th>' + tr('Čas') + '</th><th>' + tr('Rekord') + '</th><th>\u00b1</th></tr></thead><tbody>' + splitRows(r, false) + '</tbody></table>'; sp.className = 'show';   // the splits under it until the results
          showMsg(r.newPB ? tr('NOV REKORD!') : tr('CILJ! {0}', sgn(d)), r.newPB ? 'fast' : 'gold', 4);
          Comm.say(ownLine(track.def, ttLine(track.def, r.newPB ? 'record' : isFinite(d) && Math.abs(d) < 0.005 ? 'even' : 'end')), { time: spkTime(r.time), delta: isFinite(d) ? spkDelta(d) : '', track: EN_NAME[track.def.id] || track.def.name }, 5);
          { const k = medalOf(track.def, r.time); if (k >= 0) Comm.say('medal', { medal: MEDAL_EN[k] }, 3, { ttl: 9000 }); }   // (waits for the finish call)
          if (pk.on) pkCeremony(r);   // (Pikes Peak: the summit ceremony)
        } else if (race.pol) {   // the run from the police: the mission done (into the building at the top; a road without it: over the finish), arrested at the checkpoint, caught in the chase
          const pol = race.pol, b = pol.busted, chk = pol.arrestK === 'chk';
          showMsg(tr(!b ? (pol.goal ? 'MISIJA OPRAVLJENA!' : 'POBEGNIL SI!') : chk ? 'ARETIRAN!' : 'ULOVLJEN!'), b ? 'slow' : 'fast', 4); Sfx.siren(0, 0); if (b && !chk) bustShot();   // (the checkpoint: its own shot since the driver got out, chkShot)
          if (!rdOn) Comm.say(b ? 'busted' : ownLine(track.def, 'escaped'), null, 5);   // (a road the police radio does not know: the commentator)
        } else {
          showMsg(pos === 1 ? tr('ZMAGA!') : tr('CILJ! {0} MESTO', Lang.ord(pos).toUpperCase()), 'gold', 4);
          Comm.say(pos === 1 ? 'win' : pos <= 3 ? 'podium' : 'finish', { pos: Comm.ordinal(pos) }, 5);
        }
        Sfx.beep(660, 0.14, 0.14); setTimeout(() => Sfx.beep(990, 0.3, 0.14), 160);
        $('touch').classList.add('off'); $('btn-rescue').classList.add('off');
        Input.reset();
      }
    } else if (phase === 'finish' && phaseT > 4.2) {
      const pod = Render.world && Render.world.podium;
      if (pod && !on && !race.timeTrial && !race.tf) startPodium(pod); else finishRace();
    } else if (phase === 'podium' && phaseT > PODIUM_T) {
      endPodium(); finishRace();
    }
  }

  /* ---------------- a race with a friend over the internet (js/net.js) ---------------- */
  // One friend makes a room (the host) and sends the code, the other joins with it. The host picks the track and the laps
  // and starts: both phones build the same race (the two of them side by side on the front row, no AI), start it at the same
  // moment on the host's clock, drive their own car and send its state 20 times a second. The friend's car is shown 100 ms in
  // the past, smoothly between two states. Race times count from the shared start, so they compare fairly on both phones.
  const NET_V = 1;   // message format; together with the game's own version (the stamps of all its scripts) both phones must match
  const gameVer = () => { let h = 2166136261; for (const s of document.querySelectorAll('script[src]')) for (const ch of s.getAttribute('src')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return NET_V + '/' + (h >>> 0).toString(36); };
  const netTracks = () => Core.TRACKS.filter(d => !d.timeTrial);   // the tracks that race (the hill climb and the rally stage are runs for one; Vršič: the race up the pass)
  const modelById = (id) => Core.MODELS.find(m => m.id === id) || Core.MODELS[0];
  const NET_ERR = {
    'peer-unavailable': 'Sobe s to kodo ni. Preveri kodo (prijatelj mora imeti sobo odprto).',
    'browser-incompatible': 'Ta brskalnik ne podpira dirke s prijateljem. Odpri igro v Chromu ali Safariju.',
    timeout: 'Povezava ni uspela. Preveri kodo in internetno povezavo.',
    full: 'Ta soba je polna (v njej so že štirje).',
    version: 'Na telefonih sta različni različici igre. Na obeh igro zapri in znova odpri, nato poskusi znova.',
    closed: 'Gostitelj je zaprl sobo.',
    lost: 'Povezava z gostiteljem je prekinjena.',
    busy: 'Trenutno ni mogoče najti prijatelja (vsa čakalna mesta so zasedena ali ne odgovarjajo). Poskusi znova.',
    left: 'Prijatelj je odšel. Za novo dirko znova tapni Počakaj prijatelja.',
  };
  const netErr = (type) => tr(Object.prototype.hasOwnProperty.call(NET_ERR, type) ? NET_ERR[type] : 'Povezava s strežnikom ni uspela. Preveri internetno povezavo in poskusi znova.');
  const onErr = (t) => { const el = $('on-err'); el.textContent = t; if (t) { try { el.scrollIntoView({ block: 'nearest' }); } catch (_) { } } };   // (on a short screen it may be below the fold)
  const peerOf = (m) => ({ name: cleanName(m.name) || tr('Prijatelj'), car: String(m.car), color: m.color | 0, num: Core.clamp(m.num | 0, 1, 99) });
  // mp: the room, or null. role 'host' | 'guest'; me: my id in the room ('h' the host, 'g1'..'g3' its friends); players: everyone in it
  // { id, name, car, color, num, in } (the host keeps the list and sends it round; in: in the room, not still racing or on the results);
  // peer: the first of the others (the texts of a room of two, the tests); track, laps: the host's choice; setup: the race being prepared
  // { no, grid (the ids on the grid, in its order), roster, ready (host: who has the track loaded) }; race: the race under way { no, at
  // (shared start, ms), hold, goAt, grid, cars (id -> { buf (its states), fin (its finish time), left (gone before the finish), off (its
  // car off the track) }), sendT, late, mine (my finish time) }; gone (guest): the host is gone; err: the room lost the server during a
  // race (told back in the room). The host is the hub: the friends' states and news go through it to the others
  let mp = null;
  const dmgOn = () => (mp && mp.race ? mp.race.damage : +S.damage) > 0;   // damage in this race (online: the host's setting)
  // a tap: the iPhone asks for the tilt sensor and allows speech only from a tap (an online race starts from a message)
  function netTap() { if (S.control === 'tilt') enableTilt(true); Comm.unlock(); }
  const others = () => (mp ? mp.players.filter(p => p.id !== mp.me) : []);
  const pById = (id) => (mp ? mp.players.find(p => p.id === id) : null);
  function syncPeer() { if (mp) mp.peer = others()[0] || null; }
  const idOrd = (id) => (id === 'h' ? 0 : +String(id).slice(1) || 9);   // (the host first, then its friends as they came)
  function roster() {   // host: the list round to every friend (each with its own id), as it is now
    if (!mp || mp.role !== 'host') return;
    mp.players.sort((a, b) => idOrd(a.id) - idOrd(b.id)); syncPeer();
    for (const id of Net.ids) Net.sendTo(id, { t: 'roster', you: id, v: gameVer(), list: mp.players, track: mp.track, laps: mp.laps });
  }

  function leaveRace() {   // the race (or its results) off the screen, the title demo back
    Net.fixClock(false); endPodium();
    paused = false; phase = 'none'; race = null; bg = 'demo'; Comm.stop(); Sfx.setRunning(false); Sfx.silence();
    demoShow(); Render.resetCam(); setLights(0, false);
  }
  function openOnline() {
    if (race) leaveRace(); else bg = 'demo';
    mp = null;
    $('on-pick').classList.remove('off'); $('on-room').classList.add('off'); $('on-go').classList.add('off');
    $('on-name').value = S.name; privOpen(false);
    showScreen('online');
    onErr(Net.available() ? '' : netErr('browser-incompatible'));
  }
  function privOpen(on) { $('on-priv').classList.toggle('off', !on); $('on-priv-btn').setAttribute('aria-expanded', on ? 'true' : 'false'); }
  function netStart(role) {   // 'quick' (wait for whoever comes: a pair), or a private room (up to four): 'host' (with a new code) / 'guest' (with the friend's code)
    const code = role === 'guest' ? Net.normCode($('on-code').value) : '';
    if (role === 'guest' && code.length !== 4) { onErr(tr('Vpiši kodo sobe (4 znaki), ki ti jo je poslal prijatelj.')); return; }
    if (!Net.available()) { onErr(netErr('browser-incompatible')); return; }
    netTap();
    const d = netTracks().find(t => t.id === S.track) || netTracks()[0];
    mp = { role: role === 'quick' ? 'host' : role, quick: role === 'quick', code, me: role === 'guest' ? '' : 'h', players: [], peer: null, track: d.id, laps: d.laps || LAPS, no: 0, setup: null, race: null, acked: false };
    if (mp.me === 'h') mp.players.push(Object.assign(meInfo(), { id: 'h', in: true }));
    $('on-pick').classList.add('off'); $('on-room').classList.remove('off'); onErr('');
    if (role === 'quick') Net.quickMatch(gameVer(), onNet); else if (role === 'host') Net.host(onNet); else Net.join(code, onNet);
    buildRoom();
  }
  function netLeave() {   // close the room (the friends are told) and back to the title screen
    Net.close(true); mp = null;
    if (race) toTitle(); else showScreen('title');
  }
  const meInfo = () => ({ name: S.name || tr('Igralec'), car: Core.MODELS[S.car].id, color: S.color, num: carNum() });
  function me() { return Object.assign({ t: 'me' }, meInfo()); }
  function onNet(type, m, id) {
    if (!mp) return;
    if (type === 'code') { mp.code = m; buildRoom(); return; }
    if (type === 'wait') { if (mp.quick) { mp.role = Net.role; mp.me = 'h'; mp.players = [Object.assign(meInfo(), { id: 'h', in: true })]; syncPeer(); } buildRoom(); return; }
    if (type === 'open') {   // (quick match: whoever was waiting is the host, the one who came is the guest)
      if (mp.quick) { mp.role = Net.role; if (mp.role === 'guest') { mp.me = ''; mp.players = []; } }
      if (mp.role === 'guest') {   // hello until the host answers (the first message can be lost while the other side is still opening)
        const hello = () => { if (mp && !mp.acked && Net.open) { Net.send(Object.assign(me(), { t: 'hello', v: gameVer() })); setTimeout(hello, 700); } };
        mp.acked = false; hello();
      }
      buildRoom(); return;
    }
    if (type === 'error') {
      if (race) { mp.err = m; if (screen === 'results') netResults(); return; }   // (a race goes on; back from it the player hears what happened)
      Net.close(); openOnline(); onErr(netErr(m)); return;
    }
    if (type === 'lost') { friendGone(false, id); return; }
    if (type !== 'msg') return;
    const host = mp.role === 'host', R = mp.race;
    switch (m.t) {
      case 'hello':   // (host) a friend in: its car, the list round
        if (!host) break;
        if (m.v !== gameVer()) { Net.sendTo(id, { t: 'nope', why: 'version' }); Net.drop(id); break; }
        { const p = pById(id), info = Object.assign(peerOf(m), { id, in: !(p && p.in === false) }); if (p) Object.assign(p, info); else mp.players.push(info); }
        Net.sendTo(id, { t: 'hi' }); roster(); buildRoom(); break;
      case 'hi': mp.acked = true; break;
      case 'roster':   // (a friend) everyone in the room, and my own id in it
        if (host) break;
        if (m.v !== gameVer()) { Net.send({ t: 'nope', why: 'version' }); Net.close(); openOnline(); onErr(netErr('version')); return; }
        { const was = mp.players; mp.me = String(m.you || ''); mp.players = Array.isArray(m.list) ? m.list.filter(p => p && typeof p.id === 'string').slice(0, Net.room).map(p => Object.assign(peerOf(p), { id: p.id, in: p.in !== false })) : [];
          for (const p of was) if (p.id !== 'h' && p.id !== mp.me && !mp.players.some(x => x.id === p.id)) toast(tr('Igralec {0} je odšel.', p.name), 3000); }   // (another friend gone)
        syncPeer();
        if (netTracks().some(d => d.id === m.track)) { mp.track = m.track; mp.laps = Core.clamp(m.laps | 0, 1, 5); }
        buildRoom(); break;
      case 'me': if (host) { const p = pById(id); if (p) { Object.assign(p, peerOf(m)); roster(); buildRoom(); } } break;
      case 'lobby': if (!host && netTracks().some(d => d.id === m.track)) { mp.track = m.track; mp.laps = Core.clamp(m.laps | 0, 1, 5); buildRoom(); } break;
      case 'nope': if (host) { Net.drop(id); mp.players = mp.players.filter(x => x.id !== id); roster(); buildRoom(); } else { Net.close(); openOnline(); onErr(netErr(m.why)); } break;   // (the host: just that friend off)
      case 'full': Net.close(); openOnline(); onErr(netErr('full')); break;
      case 'bye': friendGone(true, id); break;
      case 'setup':   // (a friend; only in the room: not while still racing or on the results)
        if (host) break;
        if (screen !== 'online' || race || !netTracks().some(d => d.id === m.track)) Net.send({ t: 'busy', no: m.no }); else netPrepare(m);
        break;
      case 'busy': if (host && mp.setup && m.no === mp.setup.no) { const p = pById(id); if (p) p.in = false; netCancel(); } break;
      case 'cancel': if (!host && mp.setup && m.no === mp.setup.no) { mp.setup = null; buildRoom(); } break;
      case 'ready': if (host && mp.setup && m.no === mp.setup.no) { mp.setup.ready.add(id); netMaybeGo(); } break;
      case 'go': if (!host && mp.setup && m.no === mp.setup.no && Number.isFinite(m.at) && m.at - Net.now() < 10000) netRace(m.at); break;   // (also late, e.g. after the app was in the background: that phone just starts late)
      case 'st': {   // a car's state (a friend's own, or passed on by the host with its id)
        const who = host ? id : String(m.id || 'h');
        if (R && m.no === R.no) {
          if (host) for (const o of R.grid) if (o !== 'h' && o !== id) Net.sendTo(o, Object.assign({}, m, { id: who }));   // (the hub: on to the others)
          const C = R.cars.get(who); if (C && !C.off) { C.buf.push(m); if (C.buf.length > 40) C.buf.shift(); if (m.ft != null) finishOf(who, +m.ft); }
        }
        break;
      }
      case 'out': {   // a player has left the race for the room: its car leaves the track (it would stand there in the way)
        const who = host ? id : String(m.id || 'h');
        if (R && m.no === R.no) { if (host) for (const o of R.grid) if (o !== 'h' && o !== id) Net.sendTo(o, { t: 'out', no: m.no, id: who }); carGone(who); }
        if (host) { const p = pById(id); if (p) { p.in = true; roster(); } if (screen === 'online') buildRoom(); }
        else { const p = pById(who); if (p) p.in = true; }
        break;
      }
    }
  }
  // a player is gone (left, or the connection broke). A friend's host gone: the room is over (a race goes on alone). The host: that
  // friend off the list (the others told); in a race its car off the track
  function friendGone(said, id) {
    if (!mp) return;
    const R = mp.race, inRace = !!race, host = mp.role === 'host', p = pById(id), name = p ? p.name : tr('Prijatelj');
    if (!host || mp.quick) {
      toast(tr(said ? inRace ? 'Prijatelj je zapustil dirko.' : 'Prijatelj je zapustil sobo.' : 'Povezava s prijateljem je prekinjena.'), 3600);
      Net.close(); mp.gone = true; mp.setup = null;
      if (R) for (const k of R.cars.keys()) carGone(k);
      if (!inRace) { const q = mp.quick; openOnline(); onErr(netErr(q ? 'left' : said ? 'closed' : 'lost')); }
      return;
    }
    toast(others().length > 1 ? tr(said ? 'Igralec {0} je odšel.' : 'Povezava z igralcem {0} je prekinjena.', name) : tr(said ? inRace ? 'Prijatelj je zapustil dirko.' : 'Prijatelj je zapustil sobo.' : 'Povezava s prijateljem je prekinjena.'), 3600);
    if (said) Net.drop(id);   // (the room stays open; no second message when the friend's phone then closes the line)
    mp.players = mp.players.filter(x => x.id !== id); roster();
    if (mp.setup && mp.setup.grid.includes(id)) netCancel();
    if (R && R.cars.has(id)) { for (const o of R.grid) if (o !== 'h' && o !== id) Net.sendTo(o, { t: 'out', no: R.no, id }); carGone(id); }
    if (!inRace) buildRoom();
  }
  function carGone(id) {   // a player's car off the track: no more states will move it (last in the order if it has not finished)
    const C = mp && mp.race && mp.race.cars.get(id); if (!C) return;
    if (C.fin == null) C.left = true; C.off = true;
    const c = race && race.remotes.find(x => x.netOf.id === id);
    if (c && c.x !== 1e5) { c.x = c.px = 1e5; c.z = c.pz = 1e5; c.vx = c.vz = c.vy = c.vl = c.w = c.latR = c.spin = 0; c.rpm = c.m.idle; if (!c.finished) c.dist = -1e9; }
    if (screen === 'results') netResults();
  }
  function finishOf(id, t) {   // a player's finish time (on the shared clock), as soon as it arrives
    const C = mp.race.cars.get(id), c = race && race.remotes.find(x => x.netOf.id === id);
    if (!C || C.fin != null || !c || !(t > 0)) return;
    C.fin = t; race.netFinish(c, t);
    if (screen === 'results') netResults();
  }
  function buildRoom() {
    if (!mp) return;
    const host = mp.role === 'host', open = Net.open && others().length > 0, busy = !!mp.setup, n = mp.players.length, many = n > 2 || (!mp.quick && host && n < 2);
    const inRoom = others().filter(p => p.in !== false).length;
    $('on-code-show').textContent = mp.code || '····'; $('on-codebox').classList.toggle('off', !!mp.quick);
    $('on-back').textContent = tr(mp.quick && !open ? 'Prekliči' : 'Nazaj');
    $('on-status').textContent = busy ? tr('Nalagam progo …') : mp.quick && !open ? tr(Net.role === 'guest' ? 'Povezujem se …' : 'Čakam, da se kdo pridruži (prijatelj mora tapniti Počakaj prijatelja) …')
      : host ? tr(!mp.code && !mp.quick ? 'Ustvarjam sobo …' : !open ? 'Pošlji to kodo prijateljem (v sobi so lahko štirje). Čakam, da se kdo pridruži …' : !inRoom ? (others().length > 1 ? 'Čakam, da se prijatelji vrnejo v sobo …' : 'Čakam, da se prijatelj vrne v sobo …')
        : others().length > 1 ? 'Prijatelji so v sobi. Izberi progo in začni dirko.' : 'Prijatelj je v sobi. Izberi progo in začni dirko.')
      : (!open ? tr('Povezujem se s sobo {0} …', mp.code) : tr('Povezan. Gostitelj izbere progo in začne dirko.'));
    const M = Core.MODELS[S.car], row = (k, name, car, col, mine) => '<div><span class="dot" style="background:' + hexCss(PLAYER_COLORS[col] || PLAYER_COLORS[0]) + '"></span>' + k + '. ' + esc(name) + (mine ? tr(' (ti)') : '') + ' · ' + esc(car) + '</div>';
    let h = mp.players.map((p, i) => p.id === mp.me ? row(i + 1, S.name || tr('Igralec'), M.name, S.color, true) : row(i + 1, p.name, modelById(p.car).name, p.color, false)).join('');
    if (!mp.players.some(p => p.id === mp.me)) h = row(n + 1, S.name || tr('Igralec'), M.name, S.color, true) + h;   // (a friend before the list arrives)
    if (host ? n < (mp.quick ? 2 : Net.room) : !n) h += '<div class="wait">' + tr('{0}. čakam …', Math.max(n, 1) + 1) + '</div>';
    $('on-players').innerHTML = h;
    $('on-mycar').textContent = M.name;
    const ts = $('on-track'), ls = $('on-laps');
    if (!ts.options.length || ts.dataset.lang !== Lang.cur) { ts.innerHTML = netTracks().map(d => '<option value="' + d.id + '">' + esc(Lang.of(d, 'name')) + '</option>').join(''); ts.dataset.lang = Lang.cur; }   // (again in another language)
    if (!ls.options.length || ls.dataset.lang !== Lang.cur) { ls.innerHTML = [1, 2, 3, 4, 5].map(k => '<option value="' + k + '">' + lapWord(k).toLowerCase() + '</option>').join(''); ls.dataset.lang = Lang.cur; }
    const one = !!(Core.TRACKS.find(d => d.id === mp.track) || {}).open;   // (an open road: one run to the top, no laps to choose)
    ts.value = mp.track; ls.value = String(one ? 1 : mp.laps); ts.disabled = !host || busy; ls.disabled = !host || busy || one;
    for (const b of document.querySelectorAll('#on-room [data-act^="net-car-"]')) b.disabled = busy;   // (all phones build the race now)
    $('on-note').textContent = host ? tr(many ? 'Poškodbe in vreme: tvoje nastavitve veljajo za vse.' : 'Poškodbe in vreme: tvoje nastavitve veljajo za oba.') : tr('Poškodbe in vreme: po nastavitvah gostitelja.');
    $('on-go').classList.toggle('off', !host);
    $('on-go').disabled = !open || !inRoom || busy;
  }
  function netCar(d) {   // my car in the room: the others see it at once
    if (!mp || mp.setup) return;
    S.car = (S.car + d + Core.MODELS.length) % Core.MODELS.length; save();
    if (mp.role === 'host') { const p = pById('h'); if (p) Object.assign(p, meInfo()); roster(); } else Net.send(me());
    buildRoom();
  }
  function netPick() {   // the host changed the track or the laps
    if (!mp || mp.role !== 'host' || mp.setup) return;
    const id = $('on-track').value, d = netTracks().find(t => t.id === id);
    if (d && id !== mp.track) { mp.track = id; mp.laps = d.laps || LAPS; } else mp.laps = Core.clamp(+$('on-laps').value || 1, 1, 5);
    if (d && d.open) mp.laps = 1;
    Net.send({ t: 'lobby', track: mp.track, laps: mp.laps }); buildRoom();
  }
  // host: start. Everyone in the room loads the track (a phone may not answer meanwhile: no "gone" for a while); when all report ready,
  // the start is set 1.2 s ahead on the host's clock. The grid: the players in turn from race to race (the first on the left of the front row)
  function netGo() {
    if (!mp || mp.role !== 'host' || !Net.open || mp.setup) return;
    const ins = mp.players.filter(p => p.id === 'h' || (p.in !== false && Net.ids.includes(p.id))).map(p => p.id);
    if (ins.length < 2) return;
    const no = ++mp.no, k = (no - 1) % ins.length, grid = ins.slice(k).concat(ins.slice(0, k));
    const s = mp.setup = { no, track: mp.track, laps: mp.laps, phys: physOf(), damage: +S.damage, rain: 0, hold: +(0.5 + Math.random() * 0.9).toFixed(3), grid, roster: mp.players.filter(p => grid.includes(p.id)).map(p => ({ id: p.id, name: p.name, car: p.car, color: p.color, num: p.num })), ready: new Set() };
    s.rain = S.weather === 'rain' ? 1 : (S.weather === 'random' || S.weather === 'change') && Math.random() < (RAIN_P[s.track] || 0.35) ? 1 : 0;   // (the host's weather for everyone)
    for (const id of grid) if (id !== 'h') Net.sendTo(id, { t: 'setup', no, track: s.track, laps: s.laps, phys: s.phys, damage: s.damage, rain: s.rain, hold: s.hold, grid, roster: s.roster });
    Net.hold(30000); buildRoom();
    ensureTrack(s.track, () => { s.ready.add('h'); netMaybeGo(); });
    setTimeout(() => { if (mp && mp.setup === s && !mp.race) { netCancel(); toast(tr(grid.length > 2 ? 'Nekateri prijatelji se ne odzivajo. Poskusi znova.' : 'Prijatelj se ne odziva. Poskusi znova.'), 3600); } }, 45000);
  }
  function netCancel() {   // host: the race being prepared is off (a friend is not in the room, gone, or does not answer)
    const s = mp && mp.setup; if (!s) return;
    mp.setup = null; for (const id of s.grid) if (id !== 'h') Net.sendTo(id, { t: 'cancel', no: s.no });
    buildRoom();
  }
  function netMaybeGo() {
    const s = mp && mp.setup; if (!s || !s.grid.every(id => s.ready.has(id))) return;
    const at = Math.round(Net.now() + 1200);
    for (const id of s.grid) if (id !== 'h') Net.sendTo(id, { t: 'go', no: s.no, at });
    netRace(at);
  }
  // a friend: the host starts. Load the track, then say ready (once the clocks are matched)
  function netPrepare(m) {
    const grid = Array.isArray(m.grid) ? m.grid.map(String).slice(0, Net.room) : [], rs = Array.isArray(m.roster) ? m.roster : [];
    mp.setup = { no: m.no, track: m.track, laps: Core.clamp(m.laps | 0, 1, 5), phys: 'cs', damage: Core.clamp(m.damage | 0, 0, 2), rain: m.rain === 1 ? 1 : 0, hold: Core.clamp(+m.hold || 1, 0.5, 1.4),
      grid, roster: rs.filter(p => p && grid.includes(p.id)).map(p => Object.assign(peerOf(p), { id: String(p.id) })) };
    mp.track = m.track; mp.laps = mp.setup.laps;
    Net.hold(30000); buildRoom();
    ensureTrack(m.track, () => {
      let n = 0; const ready = () => { if (!mp || !mp.setup || mp.setup.no !== m.no) return; if (Net.synced) Net.send({ t: 'ready', no: m.no }); else if (++n < 450) setTimeout(ready, 100); };   // (without the host's clock the start would be wrong: rather none, the host gives up after 45 s)
      ready();
    });
  }
  function netRace(at) {
    const s = mp.setup; mp.setup = null;
    if (mp.role === 'host') for (const p of mp.players) if (s.grid.includes(p.id)) p.in = false;   // (back in the room when they say so)
    const cars = new Map(); for (const id of s.grid) if (id !== mp.me) cars.set(id, { buf: [], fin: null, left: false, off: false });
    mp.race = { no: s.no, at, hold: s.hold, goAt: at + 1300 + 4000 + s.hold * 1000, laps: s.laps, phys: s.phys, damage: s.damage, rain: s.rain, grid: s.grid, roster: s.roster || mp.players.filter(p => s.grid.includes(p.id)), cars, sendT: -1e9, late: null, mine: null };
    Net.fixClock(true);   // (the clock as it was at the start, until the race is over. The watchdog keeps its patience from the setup for a while: a phone that was frozen just before the start, e.g. switched away, still joins late)
    newRace();
  }
  // the start numbers of an online race: each player's own, the later ones in the room's order moved on when taken
  function netNums(R) {
    const out = {}, used = new Set();
    for (const p of R.roster.slice().sort((a, b) => idOrd(a.id) - idOrd(b.id))) { let n = p.id === mp.me ? carNum() : p.num | 0 || 1; while (used.has(n)) n = n % 99 + 1; used.add(n); out[p.id] = n; }
    return out;
  }
  // every frame of an online race, after its steps: my car to the others (20 times a second; with no speed while this phone does
  // not drive it: paused, turned the wrong way), and the others' cars placed from their states
  const r2 = (v) => Math.round((v || 0) * 100) / 100, r3 = (v) => Math.round((v || 0) * 1000) / 1000;
  function netFrame(still) {
    const R = mp.race, P = race.player, now = Net.now(), v = still ? 0 : 1;
    R.frameT = now;
    if (now - R.sendT >= 50) {
      R.sendT = now;
      const m = { t: 'st', no: R.no, k: Math.round(now), x: r2(P.x), z: r2(P.z), y: r2(P.y), h: r3(P.h), vx: r2(P.vx * v), vz: r2(P.vz * v), vy: r2(P.vy * v), w: r3(P.w * v), vl: r2(P.vl * v),
        a: r2(P.air), d: r3(P.delta), b: r2(P.inBrk), hb: r2(P.inHand), th: r2(P.inThr * v), g: P.gear | 0, rp: Math.round(still ? P.m.idle : P.rpm), ax: r2(P.axF), ry: r2(P.roadY), gr: r3(P.gradeNow),
        bs: r3(P.bankSl), cb: P.onCurb ? 1 : 0, ws: P.ws.join(''), lr: r2(P.latR * v), be: r3(P.beta), sp: r2(P.spin * v), lk: P.lock && !still ? 1 : 0, sf: r2(P.slipF * v),
        di: r2(P.dist), lp: P.lap | 0, ft: R.mine };
      if (mp.role === 'host') { m.id = 'h'; for (const id of R.grid) if (id !== 'h') Net.sendTo(id, m); } else Net.send(m);
    }
    for (const c of race.remotes) { const C = R.cars.get(c.netOf.id); if (C && !C.off && C.buf.length) netPlace(c, C.buf, now); }
  }
  function netPlace(c, B, now) {
    const t = now - 100;   // the friend 100 ms in the past: nearly always between two received states
    while (B.length > 2 && B[1].k <= t) B.shift();
    let a = B[0], b = B[1] && B[1].k > a.k ? B[1] : null;
    if (b && t >= b.k) { a = b; b = null; }   // (late states: on from the newest one)
    const k = b ? Core.clamp((t - a.k) / (b.k - a.k), 0, 1) : 0, ex = !b && t > a.k ? Math.min(0.25, (t - a.k) / 1000) : 0;   // (no newer state yet: on along its speed for a moment)
    const L = (p) => (b ? a[p] + (b[p] - a[p]) * k : a[p]), n = b && k > 0.5 ? b : a;
    c.x = c.px = L('x') + a.vx * ex; c.z = c.pz = L('z') + a.vz * ex; c.y = c.py = L('y') + a.vy * ex;
    c.h = c.ph = a.h + (b ? Core.wrapPi(b.h - a.h) * k : 0) + a.w * ex;
    c.vx = L('vx'); c.vz = L('vz'); c.vy = L('vy'); c.w = L('w'); c.vl = L('vl'); c.air = n.a; c.delta = L('d'); c.inBrk = n.b; c.inHand = n.hb; c.inThr = n.th; c.gear = n.g; c.rpm = L('rp');   // (its speed follows from vx, vz)
    c.axF = L('ax'); c.roadY = L('ry'); c.gradeNow = L('gr'); c.bankSl = L('bs'); c.onCurb = n.cb; for (let i = 0; i < 4; i++) c.ws[i] = +(n.ws || '')[i] || 0;
    c.latR = L('lr'); c.beta = L('be'); c.spin = L('sp'); c.lock = n.lk; c.slipF = L('sf');   // (for the smoke, skid marks and dust)
    if (!b && t - a.k > 250) { c.vx = c.vz = c.vy = c.w = c.vl = c.latR = c.spin = c.slipF = c.inThr = 0; c.lock = 0; c.rpm = c.m.idle; }   // (no word from it for a while: it stands, also for a bump)
    const z = B[B.length - 1]; c.dist = z.di; c.lap = z.lp;
  }
  // my finish on the shared clock, right after the step that crossed the line: the race is at the clock's time now less what
  // still waits in acc, and the line was crossed race.time - finishTime before that. The race's own order follows that clock too
  function netMyFinish() {
    const R = mp.race, P = race.player;
    R.mine = +((Net.now() - acc * 1000 - R.goAt) / 1000 - (race.time - P.finishTime)).toFixed(3);
    race.netFinish(P, R.mine);
  }
  const PLACE_W = ['Zmaga!', 'Drugi', 'Tretji', 'Četrti'];
  function netResults() {
    const R = mp.race, P = race.player, M = Core.MODELS[S.car]; $('res-laps').classList.add('off');
    phase = 'done'; Sfx.setRunning(false);
    const rows = [{ me: true, name: S.name || tr('Igralec'), car: M.name, col: S.color, t: R.mine, best: P.lapTimes.length ? Math.min(...P.lapTimes) : NaN }];
    for (const c of race.remotes) { const C = R.cars.get(c.netOf.id) || {}; rows.push({ me: false, name: c.name, car: c.m.name, color: c.color, t: C.fin, left: C.left && C.fin == null }); }
    rows.sort((a, b) => (a.t == null) - (b.t == null) || a.t - b.t);
    const myPos = rows.findIndex(r => r.me) + 1, waiting = rows.some(r => !r.me && r.t == null && !r.left), two = rows.length === 2, other = rows.find(r => !r.me);
    if (!stRun.done && R.mine != null) { stRun.done = true; st.online++; st.races++; achGet('online'); stSave(); }
    if (!stRun.onWin && !waiting && R.mine != null) { stRun.onWin = true; if (myPos === 1) { st.wins++; stSave(); } }   // (the win once the friends are in too)
    $('res-head').classList.remove('tt'); $('res-tt').classList.add('off'); $('res-table').querySelector('thead').innerHTML = resHead();
    $('res-pos').textContent = waiting && rows.slice(0, myPos - 1).every(r => r.t != null) && myPos === 1 ? '…' : Lang.ord(myPos);
    $('res-title').textContent = tr(waiting && myPos === 1 ? 'Cilj!' : PLACE_W[myPos - 1] || 'Cilj!');
    $('res-sub').textContent = tr('Čas dirke {0}', fmt(R.mine, true)) + '.' + (waiting ? tr(two ? ' Čakam, da prijatelj pripelje v cilj …' : ' Čakam, da prijatelji pripeljejo v cilj …') : two ? (other.left ? tr(' Prijatelj je dirko zapustil.') : tr(' Razlika {0}.', fmt(Math.abs(other.t - R.mine), true)))
      : myPos > 1 && rows[0].t != null ? tr(' Zaostanek za zmagovalcem {0}.', fmt(R.mine - rows[0].t, true)) : '');
    $('res-table').querySelector('tbody').innerHTML = rows.map((r, i) => '<tr class="' + (r.me ? 'me' : '') + '"><td>' + (r.t == null ? '–' : i + 1) + '</td><td><span class="dot" style="background:' + hexCss(r.me ? PLAYER_COLORS[r.col] : r.color) + '"></span>' + esc(r.name) + (r.me ? tr(' (ti)') : '') + '</td><td>' + esc(r.car) + '</td><td>' +
      (r.t != null ? fmt(r.t, true) : tr(r.left ? 'odšel' : 'vozi …')) + '</td><td>' + (r.me ? fmt(r.best, true) : '') + '</td></tr>').join('');
    const back = $('res-restart'); back.textContent = tr(!mp.err && (mp.role === 'host' || (Net.open && !mp.gone)) ? 'Nazaj v sobo' : 'Dirka s prijateljem'); back.dataset.act = 'net-room';
    showScreen('results');
  }
  // after the race: back to the room (the host picks the next track), or, if the room is gone, to the start of Dirka s prijateljem
  function netRoom() {
    netTap();
    const alive = mp && !mp.err && Net.open && (mp.role === 'host' || !mp.gone);
    if (alive && mp.race) { if (mp.role === 'host') { for (const id of mp.race.grid) if (id !== 'h') Net.sendTo(id, { t: 'out', no: mp.race.no, id: 'h' }); } else Net.send({ t: 'out', no: mp.race.no }); }
    leaveRace();
    if (!mp || mp.err || (mp.role === 'guest' && !alive)) { const e = mp && mp.err; mp = null; Net.close(); openOnline(); if (e) onErr(netErr(e)); return; }
    mp.race = null; mp.setup = null; const pm = pById(mp.me); if (pm) pm.in = true;
    if (mp.role === 'host') roster();
    $('on-pick').classList.add('off'); $('on-room').classList.remove('off');
    showScreen('online'); buildRoom();
  }

  /* ---------------- gamepad on the menus (Input.padRead: this frame's presses) ---------------- */
  // The stick or the d-pad moves a highlight to the nearest button that way, A presses it, B goes back (Nazaj, Glavni meni; from the
  // pause back to the race), Start presses the screen's main button, LB / RB page through the cars. In a race Start pauses and Y puts a
  // stuck car back on the track.
  let padSel = null, padScreen = '';
  const PAD_SEL = 'button, select, input[type="range"]';
  const padVisible = (el) => !!el && el.isConnected && el.offsetParent !== null && !el.disabled && !el.closest('.off');
  const padScr = () => document.querySelector('.screen.show');
  const padFind = (sel) => { const sc = padScr(); return sc ? [...sc.querySelectorAll(sel)].find(padVisible) || null : null; };
  function padItems() { const sc = padScr(); return sc ? [...sc.querySelectorAll(PAD_SEL)].filter(padVisible) : []; }
  function padFocus(el) {
    if (padSel) padSel.classList.remove('pad-focus');
    padSel = el || null;
    if (padSel) { padSel.classList.add('pad-focus'); try { padSel.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (_) { } }
  }
  const padHome = () => padFind('.track-card.sel, .ch-card.sel, .btn.primary') || padItems()[0] || null;   // (the chosen track or series, else the main button)
  function padMove(dir) {
    const items = padItems(); if (!items.length) return;
    if (!items.includes(padSel)) { padFocus(padHome()); return; }
    const r0 = padSel.getBoundingClientRect(), x0 = r0.left + r0.width / 2, y0 = r0.top + r0.height / 2, h = dir === 'left' || dir === 'right';
    // the nearest that way: first among those within about 55 degrees of it (a wide card's neighbour before a button just beside and
    // below it), else any that way
    let best = null;
    for (const cone of [true, false]) {
      let bd = Infinity;
      for (const el of items) {
        if (el === padSel) continue;
        const r = el.getBoundingClientRect(), dx = r.left + r.width / 2 - x0, dy = r.top + r.height / 2 - y0;
        const main = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy, perp = h ? Math.abs(dy) : Math.abs(dx), d = main + perp * 2.5;
        if (main > 4 && (!cone || perp <= main * 1.45) && d < bd) { bd = d; best = el; }
      }
      if (best) break;
    }
    if (best) padFocus(best);
  }
  function padFrame(dt) {
    const P = Input.padRead(dt);
    if (photo) photoPad(dt);
    if (pkF.on && P.pressed.length && screen === 'none' && !paused) { pkFlySkip(); return; }   // (any button: the flyover skipped)
    if (P.on && (screen !== padScreen || (padSel && !padSel.isConnected))) { padScreen = screen; padFocus(screen === 'none' ? null : padHome()); }   // (a new screen, or its list drawn again: the highlight on the main button or the chosen item)
    for (const k of P.pressed) {
      if (screen === 'none') {   // racing
        if (k === 'start' && bg === 'race') pause();
        else if (k === 'y' && !$('btn-rescue').classList.contains('off')) $('btn-rescue').click();
        else if (k === 'back' && bg === 'race' && !replay) cycleCam();
        continue;
      }
      if (k === 'start') { const m = padFind('.btn.primary'); if (m) m.click(); }
      else if (k === 'a') { if (padItems().includes(padSel)) { if (padSel.tagName === 'BUTTON') padSel.click(); else padSel.focus(); } else padFocus(padHome()); }
      else if (k === 'b') { const bk = padFind('[data-act="resume"], .btn.ghost[data-act], [data-act="settings-done"], [data-act="upg-done"]'); if (bk) bk.click(); }
      else if (k === 'lb' || k === 'rb') { const el = padFind(k === 'lb' ? '[data-act$="car-prev"]' : '[data-act$="car-next"]'); if (el) el.click(); }
      else if (k === 'up' || k === 'down' || k === 'left' || k === 'right') padMove(k);
    }
  }

  /* ---------------- main loop ---------------- */
  const fr = { raf: 0, drawn: 0 };   // (tests: frames the browser offered, frames drawn)
  function frame(now) {
    requestAnimationFrame(frame); fr.raf++;
    if (saverOn() && now - last < 1000 / 30 - 3) return;   // the battery saver: 30 frames a second (every other one at 60 Hz, every fourth at 120 Hz)
    fr.drawn++;
    let dt = (now - last) / 1000; last = now;
    if (!(dt > 0)) dt = 0.001;
    padFrame(Math.min(dt, 0.1));
    const dtNet = Math.min(dt, 0.5); if (dt > 0.1) dt = 0.1;
    if (race && race.quali && qual && !qual.res && bg === 'race' && qsimStep(qual, qual.wait ? 30 : paused || screen !== 'none' ? 12 : 2.5) && qual.wait) qualiShow();   // (qualifying: the rivals' laps; the grid once they are in)
    if (bg === 'show') { Render.renderShowroom(dt); if (screen === 'settings') updateTiltLive(); return; }
    if (bg === 'demo') {
      if (demoOn() !== demoAt) demoShow();   // (a new demo on the menus, e.g. an online race's track loaded)
      acc += dt; let n = 0;
      while (acc >= STEP && n < 8) { demo.step(STEP); for (const c of demo.cars) { c.hitWall = 0; c.hitCar = 0; } acc -= STEP; n++; }
      if (n >= 8) acc = 0;
      demoSwitch -= dt;
      if (!demoTarget || demoSwitch <= 0) { demoTarget = demo.order ? demo.order[(Math.random() * 4) | 0] : demo.cars[0]; demoSwitch = 9; }
      Render.frame(dt, acc / STEP, demoTarget, 'iso', {});
      if (screen === 'settings') updateTiltLive();
      return;
    }
    // race (online: netFrame() after this frame's steps sends my car as it is now to the friend and places the friend's car;
    // also while paused or turned the wrong way, when the friend drives on)
    if (orientBlock) { if (mp && mp.race) netFrame(true); ghShow(1); Render.frame(0, 1, race.player, S.camera, { noFx: true }); return; }
    if (replay) { replayFrame(dt); return; }
    const inp = Input.update(dt);
    if (!paused && screen === 'none' || (!paused && (phase === 'finish' || phase === 'done'))) {
      if (phase !== 'done') updatePhase(dt, inp);
      // alone, a slow device plays in slow motion rather than in big jumps; online, the race keeps up with the clock the
      // phones share (slow frames and hitches up to 0.5 s are caught up), so a slower phone does not lose time
      const on = mp && mp.race, lim = on ? 64 : 10;
      if (on && on.late != null) { acc = on.late; on.late = null; } else acc += on ? dtNet : dt;   // (online: the lights went out this frame)
      let n = 0;
      while (acc >= STEP && n < lim) { stepRace(STEP, inp); acc -= STEP; n++; }
      if (n >= lim) acc = 0;
      if (on) { if (race.player.finished && on.mine == null) netMyFinish(); netFrame(false); }
      updateHUD(dt); Comm.update();
      Sfx.update(race, race.player, null, inp.thr);
      ghShow(acc / STEP); Render.frame(dt, acc / STEP, race.player, S.camera, { marker: phase === 'intro' || phase === 'lights' || (phase === 'racing' && race.time < 2.5) });
      adaptive(dt);
    } else {
      if (mp && mp.race) netFrame(true);
      ghShow(1); Render.frame(0, 1, race.player, S.camera, { noFx: true });
      if (screen === 'settings') updateTiltLive();
    }
  }
  // Adaptive quality, measured over 2 s windows while racing. First the resolution goes down (to x0.55). If the game is still
  // under ~42 fps there for 6 s, the shadow pass (about 40 % of the drawing) goes off for this visit: at the next pause or race
  // start, never mid-corner (the shaders compile again, which stalls a frame). If it is no faster without shadows (a frame-rate
  // cap such as a battery saver, not a heavy scene), they come back at the next break and are not switched off again.
  let demoAt = null;
  function adaptive(dt) {
    if (noAdapt || saverOn()) return;   // (the battery saver draws fewer frames at a lower resolution by choice)
    perf.sum += dt; perf.n++;
    if (perf.sum < 2) return;
    const avg = perf.sum / perf.n * 1000; perf.sum = 0; perf.n = 0;
    if (perf.check && --perf.check === 0 && avg > perf.slowAvg * 0.85) perf.restore = true;   // (the 2nd window without shadows: first one may hold the stall)
    const k = Render.getDynScale();
    if (avg > 21 && k > 0.6) { Render.setDynScale(k - 0.1); perf.good = 0; perf.slow = 0; }
    else if (avg < 15.5) { perf.slow = 0; if (++perf.good >= 3 && k < 1) { Render.setDynScale(k + 0.05); perf.good = 0; } }
    else {
      perf.good = 0;
      if (avg > 24 && k <= 0.6 && shadowsOn() && !perf.keep && !perf.pending) {
        if (++perf.slow >= 3) { perf.slow = 0; perf.pending = true; perf.slowAvg = avg; toast(tr('Igra na tej napravi teče počasi: od naslednjega premora ali dirke bo brez senc (vklopiš jih v Nastavitvah).'), 4200); }
      } else perf.slow = 0;
    }
  }
  // a pause or a race start: carry out what adaptive() decided
  function adaptBreak() {
    if (perf.pending) { perf.pending = false; autoNoShadows = true; perf.check = 2; applyShadows(); }
    else if (perf.restore) { perf.restore = false; perf.keep = true; autoNoShadows = false; applyShadows(); }
  }
  function applyShadows() { renderSettings(); refreshSegs(); }
  function updateTiltLive() {
    if (S.control !== 'tilt') return;
    const v = Input.tilt.got ? Core.clamp(Core.wrapPi(Input.tilt.raw - Input.tilt.neutral) * (S.tiltInvert ? -1 : 1) / (S.tiltSens * Math.PI / 180), -1, 1) : 0;
    $('tilt-live-bar').style.left = (50 + v * 46) + '%';
  }

  /* ---------------- events ---------------- */
  function onAction(act, el) {
    Sfx.resume(); Sfx.click();
    switch (act) {
      case 'to-car': bg = 'show'; buildCarScreen(); showScreen('car'); break;
      case 'to-title': if (mp) { Net.close(true); mp = null; } toTitle(); break;
      case 'to-online': openOnline(); break;
      case 'net-wait': netStart('quick'); break;
      case 'net-private': privOpen($('on-priv').classList.contains('off')); break;
      case 'net-host': netStart('host'); break;
      case 'net-join': netStart('guest'); break;
      case 'net-leave': netLeave(); break;
      case 'net-go': netTap(); netGo(); break;
      case 'net-car-prev': netCar(-1); break;
      case 'net-car-next': netCar(1); break;
      case 'net-room': netRoom(); break;
      case 'to-settings': settingsReturn = screen; showScreen('settings'); refreshSegs(); break;
      case 'settings-done': showScreen(settingsReturn === 'settings' ? 'title' : settingsReturn); if (settingsReturn === 'car') buildCarScreen(); break;
      case 'car-prev': S.car = (S.car + Core.MODELS.length - 1) % Core.MODELS.length; save(); buildCarScreen(); break;
      case 'car-next': S.car = (S.car + 1) % Core.MODELS.length; save(); buildCarScreen(); break;
      case 'to-track': buildTrackScreen(); showScreen('track'); break;
      case 'to-upg': buildUpgScreen(); showScreen('upg'); break;
      case 'upg-done': buildCarScreen(); showScreen('car'); break;
      case 'upg-reset': S.upg[Core.MODELS[S.car].id] = upgNorm(null); save(); buildUpgScreen(); break;
      case 'to-board': boardId = S.track; buildBoardScreen(); showScreen('board'); break;
      case 'to-stats': buildStatsScreen(); showScreen('stats'); break;
      case 'to-school': if (race) toTitle(); buildSchoolScreen(); showScreen('school'); break;
      case 'school-go': schoolGo(el && el.dataset.lesson); break;
      case 'gh-link': case 'gh-file': ghShare(boardId, act === 'gh-link' ? 'link' : 'file'); break;
      case 'gh-import': pickFile(ghImport); break;
      case 'gh-del': try { localStorage.removeItem('tdgp-fghost-' + boardId); } catch (_) { } buildBoardScreen(); break;
      case 'prof-export': profExport(); break;
      case 'prof-import': pickFile(profImport); break;
      case 'to-champ': openChamp(); break;
      case 'to-career': buildCareerScreen(); showScreen('career'); break;
      case 'career-toggle': careerToggle(); break;
      case 'career-reset':   // a second tap within 4 s starts a new career
        if (Date.now() - careerResetT < 4000) { career = careerNew(); careerSave(); careerResetT = 0; S.car = Core.MODELS.findIndex(m => m.id === career.cars[0]); save(); buildCareerScreen(); refreshSegs(); toast(tr('Nova kariera: {0}.', eur(career.money))); }
        else { careerResetT = Date.now(); if (el) el.textContent = tr('Res začnem znova?'); toast(tr('Tapni še enkrat, če res želiš začeti novo kariero (denar, avti in nadgradnje se izgubijo).'), 3400); }
        break;
      case 'car-buy': carBuy(); break;
      case 'replay': replayStart(); break;
      case 'rp-restart': case 'rp-play': case 'rp-speed': case 'rp-cam': case 'rp-prev': case 'rp-next': case 'rp-exit': case 'rp-hl': replayAct(act); break;
      case 'replay-hl': replayHL(); break;
      case 'rp-photo': photoStart('replay'); break;
      case 'photo': photoStart('pause'); break;
      case 'ph-lens': case 'ph-filter': case 'ph-blur': case 'ph-in': case 'ph-out': case 'ph-hide': case 'ph-save': case 'ph-exit': photoAct(act); break;
      case 'cam-next': cycleCam(); break;
      case 'champ-go': {
        if (champDone()) { champ = null; champSave(); buildChampScreen(); break; }   // (finished: "Novo prvenstvo" -> the choice of a series)
        if (!owned(Core.MODELS[S.car].id)) { toast(tr('Ta avto še ni tvoj: izberi avto iz garaže ali ga kupi.'), 3000); break; }
        if (!champ) { const d = Core.CHAMPS.find(c => c.id === champPick) || Core.CHAMPS[0]; champ = { v: 1, id: d.id, diff: raceDiff(), rounds: [] }; champSave(); }   // (super težka is the police's: a championship is raced as težka)
        if (S.control === 'tilt') enableTilt(true);
        Comm.unlock(); champRun = true; ensureTrack(champDef().tracks[champ.rounds.length], startRace); break;
      }
      case 'champ-quit':   // a second tap within 4 s gives the championship up
        if (Date.now() - champQuitT < 4000) { champ = null; champSave(); champQuitT = 0; buildChampScreen(); toast(tr('Prvenstvo je opuščeno.')); }
        else { champQuitT = Date.now(); if (el) el.textContent = tr('Res opustim?'); toast(tr('Tapni še enkrat, če res želiš opustiti prvenstvo.'), 3000); }
        break;
      case 'champ-car-prev': case 'champ-car-next': {   // (the career: the cars in the garage)
        const n = Core.MODELS.length, d = act === 'champ-car-next' ? 1 : n - 1; let k = S.car;
        for (let i = 0; i < n; i++) { k = (k + d) % n; if (owned(Core.MODELS[k].id)) break; }
        S.car = k; save(); buildChampScreen(); break; }
      case 'comm-test': Comm.setSpeech(!!+S.sound); Comm.unlock(); Comm.test(); break;
      case 'start': if (!owned(Core.MODELS[S.car].id)) { toast(tr('Ta avto še ni tvoj: kupi ga v izbiri avta.'), 3000); break; } if (S.control === 'tilt') enableTilt(true); Comm.unlock(); champRun = false; school = null; ensureTrack(S.track, startRace); break;
      case 'quali-go': newRace(); break;   // (the grid qualifying gave)
      case 'quali-skip': qual = null; newRace(); break;
      case 'resume': resume(); break;
      case 'rot-cam': { const wasP = screen === 'pause'; setOption('camera', window.innerHeight > window.innerWidth ? 'chase' : 'iso'); Render.resetCam(); camLabel(); if (wasP && race && !orientBlock) resume(); break; }   // (the phone held the other way than the camera wants: the camera for the way it is held; "Igraj": on with the race)
      case 'restart': if (race && race.quali) newRace('quali'); else if (race && race.champ && race.player.finished) openChamp(); else newRace(); break;   // (qualifying: its lap again; a championship round already driven counts: on to the standings)
      case 'calibrate': Input.calibrate(); toast(tr('Sredina nagiba je nastavljena.')); break;
      case 'tilt-invert': S.tiltInvert = S.tiltInvert ? 0 : 1; save(); applySettings(); break;
      case 'fullscreen': goFullscreen(); break;
      case 'install': installApp(); break;
    }
  }
  const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function updateFsButtons() {
    const txt = tr(isFs() ? 'Izhod iz celotnega zaslona' : 'Celoten zaslon');
    document.querySelectorAll('[data-act="fullscreen"]').forEach(b => { b.textContent = txt; });
  }
  function goFullscreen() {
    if (isFs()) { const ex = document.exitFullscreen || document.webkitExitFullscreen; try { if (ex) ex.call(document); } catch (_) { } return; }
    const d = document.documentElement;
    const req = d.requestFullscreen || d.webkitRequestFullscreen;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const na = tr(ios ? 'Na iPhonu: Deli → Dodaj na začetni zaslon. Igra se nato z ikone odpre čez cel zaslon.' : 'Celoten zaslon tukaj ni na voljo. Odpri igro v Chromu ali jo dodaj na začetni zaslon.');
    if (!req || !(document.fullscreenEnabled || document.webkitFullscreenEnabled)) { toast(na, 4200); return; }
    try {
      const p = req.call(d, { navigationUI: 'hide' });   // (the screen then turns the camera's way: onFsChange)
      if (p && p.catch) p.catch(() => toast(na, 4200));
    } catch (_) { toast(na, 4200); }
  }
  function onFsChange() { updateFsButtons(); lockOrientation(); }

  /* ---------------- the game as an app (manifest.webmanifest, sw.js) ---------------- */
  // Chrome offers to install the game with the beforeinstallprompt event: only then the title screen shows "Namesti igro".
  // In the installed app the full-screen buttons go (it runs full screen already).
  let installEvt = null;
  function updateAppButtons() {
    const app = installedApp();
    document.querySelectorAll('[data-act="install"]').forEach(b => b.classList.toggle('off', !installEvt || app));
    document.querySelectorAll('[data-act="fullscreen"]').forEach(b => b.classList.toggle('off', app));
  }
  function installApp() {
    const e = installEvt; if (!e) return;
    installEvt = null; updateAppButtons();   // (one offer is one prompt; Chrome offers again later if the player says no)
    try { const p = e.prompt(); if (p && p.catch) p.catch(() => { }); } catch (_) { }
  }
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; updateAppButtons(); });
  window.addEventListener('appinstalled', () => { installEvt = null; updateAppButtons(); toast(tr('Igra je nameščena: odpreš jo z ikono APEX Racing na začetnem zaslonu.'), 4200); });
  // an app (or tab) left open in the background does not start again, so it would keep the old version: when it comes back on
  // the title screen, it asks the network for index.html and reloads if a file of the game changed (never mid-race or in a menu)
  let updAsked = -1e9;
  const stampsOf = (text) => (text.match(/\?v=[0-9a-f]{8}\b/g) || []).sort().join();
  function checkUpdate() {
    if (screen !== 'title' || document.hidden || !/^https?:$/.test(location.protocol) || performance.now() - updAsked < 60000) return;
    updAsked = performance.now();
    const mine = stampsOf([...document.querySelectorAll('script[src], link[href]')].map(e => e.getAttribute('src') || e.getAttribute('href')).join(' '));
    fetch('./', { cache: 'no-cache' }).then(r => (r.ok ? r.text() : '')).then((html) => {
      const now = stampsOf(html);
      if (!now || now === mine || screen !== 'title' || document.hidden) return;
      toast(tr('Nova različica igre: nalagam …'), 2000);
      setTimeout(() => { if (screen === 'title') location.reload(); }, 900);
    }).catch(() => { });   // (offline: stay on this version)
  }
  function bindUI() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (b) { e.preventDefault(); onAction(b.dataset.act, b); return; }
      const ub = e.target.closest('[data-upg] [data-lv]');   // upgrade level (before the generic .seg handler)
      if (ub) { Sfx.resume(); Sfx.click(); upgPick(ub.parentElement.dataset.upg, +ub.dataset.lv); return; }
      const bt = e.target.closest('[data-board]');
      if (bt) { Sfx.click(); boardId = bt.dataset.board; buildBoardScreen(); return; }
      const sb = e.target.closest('.seg button');
      if (sb) { Sfx.resume(); Sfx.click(); const tcs = sb.closest('[data-track]'); if (tcs) S.track = tcs.dataset.track;   // (the switch on a track card: that track too)
        setOption(sb.parentElement.dataset.set, sb.dataset.v); if (screen === 'car') buildCarScreen(); return; }
      const chc = e.target.closest('[data-champ]');
      if (chc) { Sfx.click(); champPick = chc.dataset.champ; buildChampScreen(); return; }
      const tc = e.target.closest('[data-track]');
      if (tc) { Sfx.click(); S.track = tc.dataset.track; save(); buildTrackScreen(); refreshSegs(); return; }
      const cb = e.target.closest('[data-col]');
      if (cb) { Sfx.click(); S.color = +cb.dataset.col; save(); buildCarScreen(); }
    });
    $('track-list').addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('div.track-card')) { e.preventDefault(); e.target.click(); } });   // (a card with a switch is a div)
    $('tilt-sens').addEventListener('input', (e) => { S.tiltSens = +e.target.value; save(); applySettings(); });
    // player name: typing must not reach the game keys (Space = handbrake/preventDefault, P / Escape = pause)
    for (const nm of [$('set-name'), $('on-name')]) {
      let nmOld = S.name;
      nm.addEventListener('focus', () => { nmOld = S.name; });
      nm.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); if (e.key === 'Escape') { nm.value = S.name = nmOld; save(); } nm.blur(); } });   // Enter keeps, Escape undoes
      nm.addEventListener('keyup', (e) => e.stopPropagation());
      nm.addEventListener('input', () => { S.name = cleanName(nm.value) || tr(DEF.name); save(); });
      nm.addEventListener('change', () => { S.name = cleanName(nm.value) || tr(DEF.name); nm.value = S.name; save(); });
      nm.addEventListener('blur', () => { nm.value = S.name; });
    }
    $('btn-pause').addEventListener('click', (e) => { e.preventDefault(); pause(); });
    $('btn-cam').addEventListener('click', (e) => { e.preventDefault(); Sfx.click(); cycleCam(); });
    { const pd = $('ph-pad'), o = { passive: false };   // the photo mode: a drag round the car, two fingers or the wheel for the distance
      for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) pd.addEventListener(t, (e) => { e.preventDefault(); photoPtr(e); }, o);
      pd.addEventListener('wheel', (e) => { e.preventDefault(); if (photo) { photo.dist = Core.clamp(photo.dist * Math.exp(e.deltaY * 0.0012), 2.5, 60); photoPose(); } }, o);
      pd.addEventListener('touchstart', (e) => e.preventDefault(), o); pd.addEventListener('touchmove', (e) => e.preventDefault(), o);
      window.addEventListener('keydown', photoKey); }
    $('btn-rescue').addEventListener('click', (e) => { e.preventDefault(); if (race && phase === 'racing') { race.rescue(race.player); race.player.locked = false; $('btn-rescue').classList.add('off'); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); Sfx.suspend(); stSave(); } else checkUpdate(); });
    window.addEventListener('pagehide', () => { if (mp) Net.close(true); });   // (closing the game: the friend hears it at once, not only when the connection times out)
    window.addEventListener('pageshow', (e) => { if (e.persisted && mp) netLeave(); });   // (back from the browser's page cache: that room is closed)
    const unlock = () => Sfx.resume();
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('pointerup', unlock, { passive: true });
    window.addEventListener('resize', () => {
      Render.resize(); mm.w = 0; buildMinimap(); sp.w = 0; Input.layout(); fitSegs();
      updateOrientation();
    });
    window.addEventListener('orientationchange', () => setTimeout(() => { Render.resize(); mm.w = 0; buildMinimap(); sp.w = 0; Input.layout(); updateOrientation(); }, 250));
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    updateFsButtons(); updateAppButtons();
    // Dirka s prijateljem: the host's track and laps, the room code (Enter joins)
    $('on-track').addEventListener('change', netPick);
    $('on-laps').addEventListener('change', netPick);
    $('on-code').addEventListener('input', (e) => { const v = Net.normCode(e.target.value); if (v !== e.target.value) e.target.value = v; });
    $('on-code').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); netStart('guest'); } });   // (typing is not driving: arrows move the cursor)
    $('on-code').addEventListener('keyup', (e) => e.stopPropagation());
  }

  /* ---------------- boot ---------------- */
  function boot() {
    if (typeof THREE === 'undefined') { $('ld-msg').textContent = tr('Knjižnice za 3D grafiko ni bilo mogoče naložiti. Preveri povezavo in osveži stran.'); return; }
    try {
      track = getTrack(S.track);
      Render.init($('gl'));
      Render.setAtmos({ season: S.season, tod: S.tod });   // (before the first world: it is built in the season)
      Render.buildWorld(track, S.quality === 'retro' ? 0.8 : 1);
      Input.init($('touch'), () => { if (screen === 'pause') resume(); else if (screen === 'none') pause(); });
      Input.onCam = () => { if (bg === 'race' && !replay && (screen === 'none' || screen === 'pause')) cycleCam(); };   // (C on the keyboard)
      Render.onThunder = (delay, vol) => Sfx.thunder(delay, vol);   // (a thunderstorm: the thunder after each lightning)
      Render.setStorm(S.weather === 'storm');
      Input.onPad = () => toast(tr('Igralni plošček je povezan: leva palica krmili, RT plin, LT zavora, B drift, Start pavza. V menijih izbiraš s palico in A, B je nazaj.'), 5200);
      applySettings();
      demoMake(6); demoAt = demo;
      Render.attachRace(demo);
      bindUI();
      refreshSegs();
      showScreen('title');
      $('loading').classList.add('off');
      last = performance.now();
      requestAnimationFrame(frame);
      lockOrientation();   // (the installed app: straight away; in a browser tab only once full screen is on)
      ghHash();   // (opened with a friend's ghost's link)
      // offline play and the newest version when online (sw.js); a service worker needs http(s), not a local file
      if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
      window.__game = { comm: Comm, get ver() { return gameVer(); }, get race() { return race; }, get demo() { return demo; }, get phase() { return phase; }, get pkFly() { return pkF.on ? { t: phaseT, k: pkF.k } : null; }, get loadMs() { return loadMs; }, get fr() { return { raf: fr.raf, drawn: fr.drawn }; }, get stats() { return JSON.parse(JSON.stringify(st)); }, ghostLink: null, profExport, ghShare: (id, how) => ghShare(id, how), get ghostF() { return ghFr && { name: ghFr.name, t: ghFr.t, lap: ghFr.g.lap }; }, get tower() { return tw && { rows: [...$('h-tower').querySelectorAll('.tw-r')].map(r => r.innerText.replace(/\s+/g, ' ').trim()), stops: race.cars.map(c => tw.stops.get(c) || 0) }; }, get saver() { return saverOn(); }, set batLow(v) { batLow = !!v; renderSettings(); }, get screen() { return screen; }, S, onAction, pause, resume,
        get qual() { return qual && { id: qual.id, cr: qual.cr, seed: qual.seed, rain: qual.rain, sims: qual.sims ? qual.sims.k : 0, n: qual.nAI, lap: qual.lap, grid: qual.res ? qual.res.grid : 0 }; },
        get adapt() { return { dyn: Render.getDynScale(), shadowsOn: shadowsOn(), auto: autoNoShadows, pending: perf.pending, restore: perf.restore, keep: perf.keep, check: perf.check }; },
        get net() { if (!mp) return null; const R = mp.race, F = R && [...R.cars.values()][0];   // (theirs, left, got: the first of the others)
          return { role: mp.role, code: mp.code, open: Net.open, synced: Net.synced, peer: mp.peer, me: mp.me, players: mp.players.map(p => ({ id: p.id, name: p.name, car: p.car, in: p.in !== false })), track: mp.track, laps: mp.laps,
            race: R && { at: R.at, goAt: R.goAt, mine: R.mine, theirs: F ? F.fin : null, left: F ? F.left : false, got: F ? F.buf.length : 0, fins: Object.fromEntries([...R.cars].map(([k, C]) => [k, C.fin])), grid: R.grid, frameT: R.frameT, startT: R.startT } }; },
        now: () => Net.now(), set autoDrive(v) { autoDrive = !!v; }, set wxNext(v) { wxNext = v; }, get career() { return career; }, get replay() { return replay && { t: replay.t, clk: replay.clk || 0, speed: replay.speed, play: replay.play, k: replay.k, hl: replay.hl && { i: replay.hl.i, clips: replay.hl.clips.map(c => ({ t0: c.t0, t1: c.t1, k: c.k, lbl: c.lbl })) } }; },
        get radio() { return rd && { cap: $('h-radio').className ? $('h-radio').textContent : '', cur: rd.cur ? rd.cur.lbl + ' ' + rd.cur.sl : '', q: rd.q.length, log: rd.log.slice(), voice: Comm.radioVoice(), mode: Comm.radioMode }; },   // (tests: the police radio,
        radioPlace: (d, k) => track ? rdWhere(track.startS + d, k == null ? -1 : k).concat([rdSpeech(rdWhere(track.startS + d, k == null ? -1 : k)[0])]) : null,   // where d m after the start line is as the police say it, and as the voice reads it)
        sim(sec, auto, steer) { pkFlySkip(); /* (a simulated race starts without Pikes Peak's flyover) */ const inp = { steer: steer || 0, thr: 1, brk: 0, hand: 0, gas: 1, digital: true }; for (let t = 0; t < sec && race; t += STEP) { if (auto) { Core.aiControl(race.player, race, STEP); inp.steer = race.player.inSteer; inp.thr = race.player.inThr; inp.brk = race.player.inBrk; inp.gas = inp.thr > 0.05 ? 1 : 0; } if (phase !== 'done') updatePhase(STEP, inp); stepRace(STEP, inp); } },
        drive(sec, f) { pkFlySkip(); const inp = { steer: 0, thr: 0, brk: 0, hand: 0, digital: true }; for (let t = 0; t < sec && race && phase !== 'done'; t += STEP) { Core.aiControl(race.player, race, STEP); const o = f(race.player, school && school.live, phase) || {}; inp.steer = race.player.inSteer; inp.thr = o.thr || 0; inp.brk = o.brk || 0; updatePhase(STEP, inp); stepRace(STEP, inp); } },   // (tests: the autopilot's steering, the throttle and the brake given)
        get school() { return school && { id: school.L.id, live: school.live, done: !!school.done }; }, schoolMedals: (id) => { const L = SCHOOL.find(x => x.id === id); return L && { m: schoolMedals(L), ref: schoolRef(L), rec: schoolRec(L) }; } };
    } catch (e) {
      console.error(e);
      $('ld-msg').textContent = tr('Napaka pri zagonu: {0}', e.message);
    }
  }
  window.addEventListener('load', () => setTimeout(boot, 30));
})();

