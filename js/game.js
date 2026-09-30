/* =========================================================================
   GAME — state machine, menus, HUD, main loop
   ========================================================================= */
(function () {
  'use strict';
  const { clamp } = Core;
  const $ = (id) => document.getElementById(id);
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
  const CAR_DESC = { kaze: 'Rad obrne rep, rojen za drift.', vortex: 'Veliko oprijema, stabilen tudi na robu.', pico: 'Lahek in okreten, rad podvija.', strega: 'Oster in živahen, hitro zavrti.', rally: 'Relijski dirkač iz 80-ih, ogromno moči, rojen za drift.', p206: 'Pravi 3D model, lahek in natančen v ovinkih.', formula: 'Odprta kolesa in krila, ki ga pri hitrosti pritisnejo ob cesto. Zavira izjemno, na travi in makadamu pa drsi. Z njim dirkaš proti samim formulam.' };

  /* ---------------- settings ---------------- */
  const lowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 3);
  const DEF = { phys: 'cs', control: 'buttons', camera: 'chase', zoom: 1.2, assist: 2, difficulty: 1, autoGas: 0, notes: 1, quality: lowEnd ? 'normal' : 'high', shadows: 1, sound: 1, vibrate: 1, tiltSens: 22, tiltInvert: 0, car: 0, color: 0, track: 'jezero', comm: 1, codrv: 1, damage: 2, weather: 'dry', ghost: 1, name: 'Igralec', tyre: 'auto', pitTyre: 'auto', sc: 1 };
  let S = Object.assign({}, DEF);
  let records = {};
  try { const j = JSON.parse(localStorage.getItem('tdgp-settings') || 'null'); if (j) S = Object.assign(S, j); } catch (_) { }
  // one-time move to the new recommended defaults (chase camera, far view, high drift assist) for existing players
  try { if (!localStorage.getItem('tdgp-defaults-v2')) { S.camera = 'chase'; S.zoom = 1.2; S.assist = 2; localStorage.setItem('tdgp-defaults-v2', '1'); localStorage.setItem('tdgp-settings', JSON.stringify(S)); } } catch (_) { }
  try { records = JSON.parse(localStorage.getItem('tdgp-records') || '{}') || {}; } catch (_) { records = {}; }
  // player name: printable, single spaces, max 16 characters; always escaped when rendered
  const cleanName = (v) => typeof v === 'string' || typeof v === 'number' ? String(v).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16) : '';
  const esc = (v) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  for (const k in DEF) if (S[k] == null || typeof S[k] === 'object') S[k] = DEF[k];   // hand-edited storage: a setting is always a plain value
  S.phys = 'cs';   // one driving physics: Circuit Superstars (the old 'rally' and 'arcade' were removed; old saves get cs)
  if (!['dry', 'rain', 'mix', 'random'].includes(S.weather)) S.weather = 'dry';
  for (const k of ['tyre', 'pitTyre']) if (!['auto', 'S', 'M', 'H', 'W'].includes(S[k])) S[k] = 'auto';
  S.name = cleanName(S.name) || DEF.name;
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
  // and ghost (id-wet): the weather of the race on it, before a race the weather setting (the wet ones only with 'rain')
  const wetRec = (d) => !!(d && d.timeTrial) && (race && race.track.def.id === d.id ? !!race.rain : S.weather === 'rain');
  const recKey = (id) => { const d = Core.TRACKS.find(x => x.id === id), r = ((d && d.recId) || id) + (wetRec(d) ? '-wet' : ''); return r + '@cs'; };
  const rec = (id) => { const k = recKey(id); return records.tracks[k] || (records.tracks[k] = {}); };
  // time-trial records: bestTime, bestSplits [cp1..cpN, finish], board = top 10 [{name, car, carId, time, splits, date, upg}] (drop anything malformed, rebuild the rest from known fields)
  const splitsOf = (a) => a.slice(0, 12).map(v => posNum(v) ? v : NaN);
  const boardEntry = (e) => isObj(e) && posNum(e.time) ? { name: cleanName(e.name) || '?', car: typeof e.car === 'string' ? e.car.slice(0, 24) : '', carId: typeof e.carId === 'string' ? e.carId.slice(0, 24) : '',
    time: e.time, splits: Array.isArray(e.splits) ? splitsOf(e.splits) : [], date: posNum(e.date) ? e.date : 0, upg: upgNorm(isObj(e.upg) ? e.upg : null) } : null;
  for (const id in records.tracks) { const r = records.tracks[id]; if (!isObj(r)) { delete records.tracks[id]; continue; }
    for (const k of ['bestLap', 'bestRace', 'bestPos', 'bestTime', 'jumpRec']) if (r[k] != null && !posNum(r[k])) delete r[k];
    if (r.bestTime && Array.isArray(r.bestSplits)) r.bestSplits = splitsOf(r.bestSplits); else delete r.bestSplits;
    if (r.board != null) r.board = Array.isArray(r.board) ? r.board.map(boardEntry).filter(e => e).sort((a, b) => a.time - b.time).slice(0, 10) : []; }
  // one-time archive of Pikes Peak times driven on the old, narrower road (11 m -> 14 m): kept as 'pikes-ozka', never shown
  try { if (!localStorage.getItem('tdgp-pikes-w7')) { const o = records.tracks.pikes; if (isObj(o) && (o.bestTime || (o.board && o.board.length))) { records.tracks['pikes-ozka'] = o; delete records.tracks.pikes; saveRecords(); } localStorage.setItem('tdgp-pikes-w7', '1'); } } catch (_) { }
  const upgOf = (id) => S.upg[id] || (S.upg[id] = upgNorm(null));
  const upgCount = (id) => UPG_IDS.reduce((a, k) => a + upgOf(id)[k], 0);
  const isTT = (d) => !!(d && d.timeTrial);
  // a time trial is a hill climb (Pikes Peak) or a rally special stage (def.rally: Ouninpohja): each with its own words and commentator lines
  const isRally = (d) => !!(d && d.rally);
  // medal times of a time trial (def.medals.cs: [gold, silver, bronze] in s, .wet.cs in the rain): the medal of a time (0 gold .. 2 bronze, -1 none)
  const MEDAL = ['zlata', 'srebrna', 'bronasta'], MEDAL_EN = ['gold', 'silver', 'bronze'], MEDAL_ICON = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
  const medalSet = (d) => { const M = d && d.medals && (wetRec(d) ? d.medals.wet : d.medals); return (M && M[physOf()]) || null; };
  const medalOf = (d, t) => { const M = medalSet(d); if (!M || !(t > 0)) return -1; for (let k = 0; k < 3; k++) if (t <= M[k]) return k; return -1; };
  const medalLine = (d, t) => { const M = medalSet(d); if (!M) return ''; const k = medalOf(d, t), n = k < 0 ? 2 : k - 1;   // (won, and how far the next one is)
    return (k >= 0 ? MEDAL_ICON[k] + ' ' + MEDAL[k].charAt(0).toUpperCase() + MEDAL[k].slice(1) + ' medalja' : 'Brez medalje') + (n >= 0 ? ' · do ' + (k < 0 ? 'brona' : n === 0 ? 'zlata' : 'srebra') + ' ' + fmt(M[n], true) + ' (' + sgn(t - M[n]) + ')' : '') + '.'; };
  const ttRun = (d) => isRally(d) ? 'preizkušnjo' : 'vzpon';   // (Ponovi vzpon / Ponovi preizkušnjo)
  const TT_LINES = { intro: ['introTT', 'introStage'], go: ['goTT', 'goStage'], cpFirst: ['cpFirst', 'cpFirstStage'], record: ['summitRecord', 'stageRecord'], even: ['summitEven', 'stageEven'], end: ['summit', 'stageEnd'] };
  const ttLine = (d, k) => TT_LINES[k][isRally(d) ? 1 : 0];
  const numDot = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');   // 3048 -> 3.048
  const kmTxt = (m, dec) => (m / 1000).toFixed(dec).replace('.', ',');
  const cpWord = (n) => n + (n === 1 ? ' kontrolna točka' : n === 2 ? ' kontrolni točki' : n <= 4 ? ' kontrolne točke' : ' kontrolnih točk');
  const jumpWord = (n) => n + (n === 1 ? ' skok' : n === 2 ? ' skoka' : n <= 4 ? ' skoki' : ' skokov');
  // time trial splits table: the altitude of each point (hill climb) or how far into the stage it lies
  const ttWhereHead = (d) => d.alt ? 'Višina' : 'Razdalja';
  const ttWhere = (T, s) => { const alt = T.altAt(T.hy[T.idx(s)]); return alt != null ? numDot(alt) + ' m' : T.def.alt ? '' : kmTxt(s - T.startS, 2) + ' km'; };
  const sgn = (d) => Math.abs(d) < 0.0005 ? '\u00b10.000' : (d < 0 ? '\u2212' : '+') + (Math.abs(d) >= 60 ? fmt(Math.abs(d)) : Math.abs(d).toFixed(3));   // −1.234 / +0.512 / ±0.000 / −3:24.799
  const dCls = (d) => d < -0.0005 ? 'fast' : d > 0.0005 ? 'slow' : 'even';
  const lapWord = (n) => n + (n === 1 ? ' KROG' : n === 2 ? ' KROGA' : n <= 4 ? ' KROGI' : ' KROGOV');
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
    const el = $('rotate');
    $('rotate-txt').textContent = wantPortrait() ? 'Obrni telefon v pokončni položaj' : 'Obrni telefon v ležeči položaj';
    el.classList.toggle('to-portrait', wantPortrait());
    el.classList.toggle('show', mismatch);
    orientBlock = mismatch;
    if (mismatch && phase === 'racing' && screen === 'none') pause();
  }

  /* ---------------- screens ---------------- */
  // a row of choices wider than its panel (a narrow phone; the pause panel in landscape): smaller letters, then smaller still
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
    if (!inRace) $('btn-rescue').classList.add('off');
    if (inRace) requestAnimationFrame(() => Input.layout());
    updateOrientation();
  }
  function refreshSegs() {
    for (const seg of document.querySelectorAll('.seg')) {
      const key = seg.dataset.set; if (!key) continue;   // (upgrade rows mark their own selection)
      const val = key === 'shadows' ? (shadowsOn() ? 1 : 0) : S[key];   // (shadows: what is on screen, also when adaptive() switched them off)
      for (const b of seg.querySelectorAll('button')) b.classList.toggle('sel', String(val) === b.dataset.v);
    }
    document.querySelectorAll('.tiltrow').forEach(r => r.classList.toggle('off', S.control !== 'tilt'));
    $('tilt-sens').value = S.tiltSens; $('tilt-sens-v').textContent = S.tiltSens + '°';
    $('tilt-inv-btn').classList.toggle('primary', !!S.tiltInvert);
    $('ctrl-help').textContent = (S.control === 'buttons' ? CTRL_HELP_CS : CTRL_HELP[S.control]) || '';
    { const d = Core.TRACKS.find(x => x.id === S.track) || Core.TRACKS[0], r = rec(d.id);   // the selected track and its record first (short screens may cut the end of the hint)
      if (isTT(d)) { $('title-hint').textContent = 'Proga: ' + d.name + (r.bestTime ? ' (osebni rekord ' + fmt(r.bestTime, true) + ')' : ' (še brez časa)') + '.'; $('title-sub').textContent = d.name + ' · kronometer · brez nasprotnikov'; }
      else { $('title-hint').textContent = 'Proga: ' + d.name + (r.bestLap ? ' (rekord kroga ' + fmt(r.bestLap, true) + ')' : '') + '.'; $('title-sub').textContent = d.name + ' · ' + lapWord(d.laps || 3).toLowerCase() + ' · 12 nasprotnikov' + (S.weather === 'rain' ? ' · dež' : S.weather === 'random' ? ' · morda dež' : ''); } }
    $('title-hint').textContent += ' Upravljanje: ' + CTRL_NAME[S.control] + ', kamera: ' + (S.camera === 'chase' ? 'za avtom (telefon pokončno)' : S.camera === 'kino' ? 'kino (telefon ležeče)' : 'izometrična (telefon ležeče)') + '. Spremeniš v nastavitvah.' + (records.bestLap ? ' Rekord kroga: ' + fmt(records.bestLap, true) + '.' : '');
    { const el = $('set-name'); if (el && document.activeElement !== el) el.value = S.name; }
    { const d = champDef(); $('btn-champ').textContent = 'Prvenstvo' + (d && !champDone() ? ' · ' + (champ.rounds.length + 1) + '/' + d.tracks.length : ''); }
  }
  function shadowsOn() { return !!S.shadows && !autoNoShadows; }
  function applySettings() {
    Render.applySettings({ quality: S.quality, shadows: shadowsOn(), camera: S.camera });
    Render.cam.userZoom = +S.zoom;
    Comm.setEnabled(!!+S.comm); Comm.setSpeech(!!+S.sound); Comm.setNotes(!!+S.codrv);
    Comm.setOnVoice(v => { const el = $('comm-voice'); if (el) el.textContent = !v.any ? 'Ta brskalnik ne podpira govora – komentatorja ne bo slišati.' : 'Glas: ' + (v.name || 'privzeti angleški') + ' (' + v.lang + ')' + (v.male ? ' – moški' : ' – nižji ton') + (v.codrv ? ' · sovoznik: ' + v.codrv : ''); });
    Input.setMode(S.control);
    Input.setOptions({ autoGas: !!S.autoGas, tiltSens: S.tiltSens, tiltInvert: !!S.tiltInvert, vibrate: !!S.vibrate });
    Sfx.setEnabled(!!S.sound);
    if (race && race.player) race.player.assist = Core.ASSISTS[S.assist];
    refreshSegs();
  }
  // driving physics: Circuit Superstars' kinematic drift ('cs', the only one)
  const physOf = () => 'cs';
  // the weather: dry, rain, changing (the rain starts, or stops, at 25-55 % of the race), or at random for every race (rain more often in
  // the Ardennes and the Eifel, and now and then a change); the title demo rains only with 'rain'
  const RAIN_P = { spa: 0.5, nring: 0.45 };
  const rainOf = () => S.weather === 'rain' ? 1 : (S.weather === 'random' || S.weather === 'mix') && Math.random() < (S.weather === 'mix' ? 0.5 : RAIN_P[track && track.def.id] || 0.35) ? 1 : 0;
  const wxOf = (r0) => S.weather === 'mix' || (S.weather === 'random' && Math.random() < 0.3) ? { at: 0.25 + Math.random() * 0.3, to: r0 ? 0 : 1 } : null;
  const TYRE_NAME = { S: 'mehke', M: 'srednje', H: 'trde', W: 'za dež' }, TYRE_LTR = { S: 'M', M: 'S', H: 'T', W: 'D' }, TYRE_EN = { S: 'soft', M: 'medium', H: 'hard', W: 'wet' };
  const demoRain = () => S.weather === 'rain' ? 1 : 0;
  function setOption(key, v) {
    const num = ['zoom', 'assist', 'difficulty', 'autoGas', 'notes', 'shadows', 'sound', 'vibrate', 'comm', 'codrv', 'damage', 'ghost', 'sc'];
    S[key] = num.includes(key) ? +v : v;
    if (key === 'shadows') { autoNoShadows = false; perf.pending = perf.restore = false; perf.keep = true; }   // the player's own choice wins for the rest of the visit
    save(); applySettings();
    if (key === 'weather' && demo) demo.setRain(demoRain());   // (a race keeps its weather; the next one gets the new setting)
    if (key === 'pitTyre' && race && race.player) race.player.pitTyre = S.pitTyre;   // (the tyres for the next pit stop)
    if (key === 'weather' && screen === 'track') buildTrackScreen();   // (a time trial's records in the rain are its own: the cards show them)
    if (key === 'control' && v === 'tilt') enableTilt(false);
    if (key === 'camera') { lockOrientation(); updateOrientation(); }
  }
  function enableTilt(fromStart) {
    Input.requestTilt().then(res => {
      if (res !== 'granted') { toast(res === 'denied' ? 'Dostop do senzorja nagiba je zavrnjen. Uporabi tipke ali volan.' : 'Ta naprava ne podpira nagiba. Uporabi tipke ali volan.', 3600); return; }
      setTimeout(() => {
        if (!Input.tiltAlive() && !tiltWarned) {
          tiltWarned = true;
          toast('Senzor nagiba ne pošilja podatkov. Odpri igro v celotnem brskalniku ali izberi tipke/volan.', 4200);
        }
      }, 1600);
    });
  }

  /* ---------------- car select ---------------- */
  function buildCarScreen() {
    const M = Core.MODELS[S.car];
    $('car-name').textContent = M.name;
    $('car-drive').textContent = DRIVE_TAG[M.drive];
    $('car-credit').textContent = M.credit || '';
    const st = Core.upgStats(M, upgOf(M.id)), nUp = upgCount(M.id);   // stats and power with this car's upgrades
    $('car-desc').textContent = DRIVE_TXT[M.drive] + '. ' + (CAR_DESC[M.id] || '') + ' ' + Math.round(st.kw * 1.36) + ' KM' + (nUp ? ' (nadgrajen)' : '') + ', ' + M.mass + ' kg.';
    $('car-stats').innerHTML = statRows(M.stats, st);
    $('btn-upg').innerHTML = '<span>Nadgradnje \u203a' + (nUp ? '<b class="upg-n">' + nUp + '/' + UPG_IDS.length * 3 + '</b>' : '') + '</span>';
    $('car-colors').innerHTML = PLAYER_COLORS.map((c, i) => '<button data-col="' + i + '" class="' + (i === S.color ? 'sel' : '') + '" style="background:' + hexCss(c) + '" aria-label="Barva ' + (i + 1) + '"></button>').join('');
    Render.setShowCar(M, PLAYER_COLORS[S.color], carNum());
    refreshSegs();
  }

  // stat bars: stock value, the gain from upgrades drawn in blue behind it
  function statRows(b, st) {
    const rows = [['Moč', 'power'], ['Oprijem', 'grip'], ['Lahkost', 'weight'], ['Drift', 'drift']];
    return rows.map(r => '<span>' + r[0] + '</span><div class="bar">' + (st[r[1]] > b[r[1]] ? '<i class="up" style="width:' + (st[r[1]] * 10) + '%"></i>' : '') + '<i class="base" style="width:' + (b[r[1]] * 10) + '%"></i></div>').join('');
  }

  /* ---------------- upgrades (free; per car, applied on every track) ---------------- */
  const UPG_TXT = {
    motor: 'Več moči: hitrejši pospešek in višja končna hitrost.',
    gume: 'Več oprijema v ovinkih in boljše speljevanje.',
    zavore: 'Močnejše zaviranje, krajša zavorna pot.',
    aero: 'Pritisk na cesto: več oprijema v hitrih ovinkih, a malo več zračnega upora.'
  };
  function upgEffect(id, lv) {
    if (!lv) return 'serijsko';
    const L = {}; L[id] = lv; const m = Core.upgMods(L), pc = (x) => '+' + Math.round((x - 1) * 100) + '\u00a0%';
    if (id === 'motor') return pc(m.kw) + ' moči';
    if (id === 'gume') return pc(m.grip) + ' oprijema';
    if (id === 'zavore') return pc(m.brake) + ' zavorne moči';
    return '+' + Math.round(m.aeroK * 41.7 * 41.7 * 100) + '\u00a0% oprijema pri 150\u00a0km/h, ' + pc(m.drag) + '\u00a0upora';
  }
  function buildUpgScreen() {
    const M = Core.MODELS[S.car], L = upgOf(M.id), st = Core.upgStats(M, L);
    $('upg-car').textContent = M.name;
    $('upg-stats').innerHTML = statRows(M.stats, st) + '<span class="upg-km">' + Math.round(st.kw * 1.36) + ' KM' + (L.motor ? ' (serijsko ' + Math.round(M.kw * 1.36) + ' KM)' : '') + ' · ' + M.mass + ' kg</span>';
    $('upg-list').innerHTML = Core.UPG.map(u => '<div class="upg-row"><div class="upg-top"><span class="rlbl">' + u.name + '</span><span class="upg-eff">' + upgEffect(u.id, L[u.id]) + '</span></div>' +
      '<div class="seg upg-seg" data-upg="' + u.id + '">' + u.lv.map((n, i) => '<button data-lv="' + i + '" class="' + (i === L[u.id] ? 'sel' : '') + '">' + n + '</button>').join('') + '</div>' +
      '<p class="upg-desc">' + (UPG_TXT[u.id] || '') + '</p></div>').join('');
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
    const list = $('track-list');
    list.innerHTML = Core.TRACKS.map(d => { const T = getTrack(d.id), r = rec(d.id);
      let meta = isTT(d) ? kmTxt(T.raceLen, 1) + ' km' + (d.realKm ? ' (pravih ' + String(d.realKm).replace('.', ',') + ' km)' : '') + (d.alt ? ' · vzpon ' + numDot(d.alt[1] - d.alt[0]) + ' m' : '') + (isRally(d) && d.bumps ? ' · ' + jumpWord(d.bumps.length) : '') + ' · ' + cpWord(T.cpS.length) + ' · kronometer' + (r.bestTime ? ' · rekord ' + fmt(r.bestTime, true) : '')
        : kmTxt(T.len, 2) + ' km · ' + T.corners.length + ' ovinkov · ' + lapWord(d.laps || 3).toLowerCase() + (r.bestLap ? ' · rekord ' + fmt(r.bestLap, true) : '');
      if (wetRec(d)) meta = meta.replace(' · kronometer', ' · kronometer v dežju');
      if (isTT(d) && medalOf(d, r.bestTime) >= 0) meta += ' ' + MEDAL_ICON[medalOf(d, r.bestTime)];
      return '<button class="track-card' + (d.id === S.track ? ' sel' : '') + '" data-track="' + d.id + '"><canvas></canvas><h3>' + d.name + '</h3>' +
        '<div class="tmeta">' + meta + '</div>' +
        '<div class="tdesc">' + (d.desc || '').replace(/\b(\d{1,3})(\d{3}) m\b/g, '$1.$2\u00a0m') + '</div></button>'; }).join('');   // 2862 m -> 2.862 m (as on the HUD)
    requestAnimationFrame(() => list.querySelectorAll('.track-card').forEach(el => drawTrackMini(el.querySelector('canvas'), getTrack(el.dataset.track))));
  }
  function ensureTrack(id, cb) {
    if (track && track.def.id === id) { cb(); return; }
    $('ld-msg').textContent = 'Nalagam progo ' + ((Core.TRACKS.find(d => d.id === id) || {}).name || '') + '…';
    $('loading').classList.remove('off');
    setTimeout(() => {
      track = getTrack(id);
      Render.buildWorld(track, S.quality === 'retro' ? 0.8 : 1);
      demo = new Core.Race(track, { numAI: 10, noPlayer: true, difficulty: 2, laps: 9999, seed: 11, phys: physOf(), rain: demoRain() });
      demo.start(); for (let i = 0; i < 120 * 4; i++) demo.step(STEP);
      demoTarget = null; demoSwitch = 0;   // the title camera picks a car of the new demo right away (not one left over from the previous track)
      mm.img = null; mm.w = 0;
      $('loading').classList.add('off');
      cb();
    }, 40);
  }

  /* ---------------- ghost of the best run (time trials) ---------------- */
  // While a time trial runs, the player's car pose is sampled every GH_DT s of race time (between two physics steps, so exactly on the
  // grid). A run that sets a new personal best is stored with the record (per track and physics, key tdgp-ghost-<record key>) and
  // replays as a see-through car (Render.setGhost) in the next runs, on the race clock. Only drawn: it never touches the race.
  // Stored: { v, dt, n, t (the run's time), car, color, stripe, q0 [x, y, z in cm], d: base64 of Int16 [n x 7] }: per sample the
  // x, y, z steps from the previous sample (cm), heading, steer, pitch and roll (1e-4 rad)
  const GH_DT = 0.1, GH_MAX = 12000, GH_CH = 7, GH_V = 1, GH_BYTES = 600000;   // sample interval (s), max samples (20 min), channels, format, max stored size
  const ghKey = (id) => 'tdgp-ghost-' + recKey(id);
  let ghRec = null, ghPlay = null;   // the run being recorded { n, f: Float32Array }, the best run being replayed { n, t, M, color, stripe, f }
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
  function ghSave(id, time) {   // a new personal best: store the recorded run (a run too long or too big is not kept; the old ghost goes with its record)
    const G = ghRec; ghRec = null;
    try { localStorage.removeItem(ghKey(id)); } catch (_) { }
    if (!G || !G.done || G.n < 2) return;
    const M = Core.MODELS[S.car], e = ghEncode(G); if (!e) return;
    const j = JSON.stringify({ v: GH_V, dt: GH_DT, n: G.n, t: time, car: M.id, color: PLAYER_COLORS[S.color], stripe: race.player.stripe !== false, q0: e.q0, d: e.d });
    if (j.length > GH_BYTES) return;
    try { localStorage.setItem(ghKey(id), j); } catch (_) { }
  }
  function ghLoad(id, best) {   // the stored best run of this track and physics, if it is the run of the current record
    let o = null; try { o = JSON.parse(localStorage.getItem(ghKey(id)) || 'null'); } catch (_) { return null; }
    if (!isObj(o) || o.v !== GH_V || o.dt !== GH_DT || !posNum(o.t) || !(Math.abs(o.t - best) < 0.0005) || !(o.n >= 2 && o.n <= GH_MAX) || typeof o.d !== 'string' || !Array.isArray(o.q0) || o.q0.length !== 3) return null;
    let b; try { b = atob(o.d); } catch (_) { return null; }
    if (b.length !== o.n * GH_CH * 2) return null;
    const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    const a = new Int16Array(u.buffer), f = new Float32Array(o.n * GH_CH), q = o.q0.map(v => +v || 0);
    for (let k = 0; k < o.n; k++) { const i = k * GH_CH; for (let c = 0; c < 3; c++) { q[c] += a[i + c]; f[i + c] = q[c] / 100; } for (let c = 3; c < 7; c++) f[i + c] = a[i + c] / 1e4; }
    return { n: o.n, t: o.t, M: modelById(o.car), color: typeof o.color === 'number' ? o.color : PLAYER_COLORS[0], stripe: o.stripe !== false, f };
  }
  function ghStart() {   // newRace: record every time trial (alone, never online); replay the best run when there is one
    const tt = race.timeTrial && !(mp && mp.race);
    ghRec = tt ? { n: 0, f: new Float32Array(GH_MAX * GH_CH), done: false } : null;
    const R0 = tt ? rec(track.def.id) : null;
    ghPlay = R0 && R0.bestTime ? ghLoad(track.def.id, R0.bestTime) : null;
    Render.setGhost(null, true);
  }
  const _gp = { M: null, color: 0, stripe: true, x: 0, y: 0, z: 0, h: 0, d: 0, p: 0, r: 0, op: 1 };
  function ghShow(alpha) {   // every drawn frame of a race: the ghost where the best run was at this moment of the race clock
    const G = ghPlay;
    if (!G || !race || !S.ghost || !(phase === 'racing' || phase === 'finish' || phase === 'done') || race.state === 'grid') { Render.setGhost(null); return; }
    const t = Math.max(0, race.time - (1 - clamp(alpha, 0, 1)) * STEP), u = t / GH_DT, k = Math.min(G.n - 2, Math.floor(u)), a = clamp(u - k, 0, 1), end = (G.n - 1) * GH_DT;
    if (t > end + 0.6) { Render.setGhost(null); return; }   // the best run is over (it ends just past the line)
    const f = G.f, o = k * GH_CH, n2 = o + GH_CH, L = (c) => f[o + c] + (f[n2 + c] - f[o + c]) * a;
    const g = _gp; g.M = G.M; g.color = G.color; g.stripe = G.stripe;
    g.x = L(0); g.y = L(1); g.z = L(2); g.h = f[o + 3] + Core.wrapPi(f[n2 + 3] - f[o + 3]) * a; g.d = L(4); g.p = L(5); g.r = L(6);
    const P = race.player, dd = Math.hypot(g.x - P.x, g.z - P.z);
    g.op = clamp((dd - 1.5) / 5, 0.3, 1) * clamp(t / 0.4, 0, 1) * clamp((end + 0.6 - t) / 0.6, 0, 1);   // fainter right on top of the player; fades in at the start and out past the line
    Render.setGhost(g);
  }

  /* ---------------- race lifecycle ---------------- */
  function newRace() {
    rpStop();
    const tt = isTT(track.def), M = Core.MODELS[S.car], on = mp && mp.race;
    const cd = !on && champRun ? champDef() : null, cr = cd && !champDone() && cd.tracks[champ.rounds.length] === track.def.id ? champ.rounds.length : -1;   // a championship round (its index), or -1
    if (cr < 0) champRun = false;
    const mine = { playerModel: M, playerUpg: Object.assign({}, upgOf(M.id)), playerColor: PLAYER_COLORS[S.color], playerNum: carNum(), seed: (Math.random() * 1e6) | 0, difficulty: cr >= 0 ? champ.diff : S.difficulty, assist: S.assist };
    if (on) {   // online: the host on the first grid slot, the friend on the second; the host's physics and damage for both
      const host = mp.role === 'host', left = on.first === mp.role, F = mp.peer || { name: 'Prijatelj', car: M.id, color: 0, num: 2 }, same = F.num === carNum();
      race = new Core.Race(track, Object.assign(mine, { numAI: 0, playerGrid: left ? 1 : 2, laps: on.laps, damage: on.damage, phys: on.phys, rain: on.rain, tyres: true, playerTyre: S.tyre, playerNum: same && !host ? carNum() + 1 : carNum(),
        remote: { model: modelById(F.car), color: PLAYER_COLORS[F.color] || PLAYER_COLORS[0], num: same && host ? F.num + 1 : F.num, name: F.name, grid: left ? 2 : 1 } }));
    } else { const r0 = rainOf(); race = new Core.Race(track, Object.assign(mine, {   // time trial: alone on the start line, one run to the finish
      numAI: tt ? 0 : NUM_AI, playerGrid: tt ? 1 : PLAYER_GRID, laps: tt ? 1 : track.def.laps || LAPS, damage: +S.damage, phys: physOf(), rain: r0, champ: cr >= 0,
      tyres: !tt, playerTyre: S.tyre, wx: tt ? null : wxOf(r0), sc: !tt && !!S.sc   // (tyres, a change of the weather and the safety car: circuit races)
    })); }
    if (race.player) race.player.pitTyre = S.pitTyre;
    race.wetAny = race.rain > 0.5;
    race.champ = cr >= 0 ? { round: cr, n: cd.tracks.length, done: false } : null;
    Render.attachRace(race);
    Render.resetCam();
    adaptBreak();
    bg = 'race'; phase = 'intro'; phaseT = 0; lightsOn = 0; lastBeepLight = 0; paused = false; acc = 0;
    introLen = 1.3; endPodium();
    { const air = Render.world && Render.world.air;   // the Red Bull Ring: first the jets over the grid, filmed from the grid (not online, not in a time trial)
      if (air && !on && !tt) { air.go = true; introLen += JET_SHOT; Render.setShot(air.shot); $('hud').classList.add('shot'); } }
    lastLapCount = 0; prevGear = 1; prevAir = 0; jmp = { air: false, x: 0, z: 0, s: 0, best: 0, rec: 0, n: 0 }; msgT = 0; splitT = 0; dmgKey = ''; pitHint = false; drsN = 0; secN = 0;
    $('h-msg').className = ''; $('h-split').className = ''; $('h-note').className = '';
    tyreKey = ''; $('h-tyre').className = ''; $('h-sc').className = ''; $('h-sc').textContent = ''; $('pit-row').classList.toggle('off', !(race.tyresOn && track.def.pit));
    $('h-lights').className = ''; setLights(0, false);
    $('h-tot').textContent = '/' + race.cars.length;
    $('hud').classList.toggle('drs', !!race.drsLast); $('h-drs').className = '';   // (a circuit with DRS zones)
    $('hud').classList.toggle('sec', !!race.secBest); for (const e of $('h-sec').children) e.className = '';   // (a circuit with TV sectors)
    $('hud').classList.toggle('tt', race.timeTrial); $('pause-restart').textContent = race.timeTrial ? 'Ponovi ' + ttRun(track.def) : 'Ponovi dirko';
    $('pause-restart').classList.toggle('off', !!on);   // (online: no restart for one)
    cpSeen = race.player.cpEv; ttRes = null; cornerSeen = -1; cornerShow = false; placeInit(); codrvInit(); ghStart(); rpStart(); $('h-ttsp').className = '';
    Input.reset();
    showScreen('none');
    Sfx.resume(); Sfx.setRunning(true);
    Comm.stop(); commReset();
    const wetTxt = race.rain ? ' · DEŽ' : '';
    if (race.timeTrial) { Comm.say(ttLine(track.def, 'intro'), { track: EN_NAME[track.def.id] || track.def.name, cps: track.cpS.length }, 2); showMsg((isRally(track.def) ? 'POLNI PLIN!' : 'VZPON NA VRH!') + wetTxt, 'gold', race.rain ? 1.8 : 1.2); }
    else {
      if (on) Comm.say('introNet', { track: EN_NAME[track.def.id] || track.def.name, laps: race.laps === 1 ? 'one lap' : race.laps + ' laps', name: race.remote.name }, 2);
      else Comm.say(race.laps === 1 ? 'introOne' : 'intro', { track: EN_NAME[track.def.id] || track.def.name, laps: race.laps, grid: Comm.ordinal(race.player.grid) }, 2);
      showMsg((race.champ ? 'DIRKA ' + (race.champ.round + 1) + '/' + race.champ.n + ' · ' : '') + lapWord(race.laps) + wetTxt, 'gold', race.rain || race.champ ? 1.8 : 1.2);
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
    const el = $('podium-cap'); el.innerHTML = top.map((c, i) => '<span><b>' + (i + 1) + '.</b> <i style="background:' + hexCss(c.color) + '"></i>' + esc(c.isPlayer ? 'Ti' : c.name) + '</span>').join(''); el.className = 'show';
    const w = top[0]; Comm.say(w && w.isPlayer ? 'podiumMe' : 'podiumRb', { name: w ? w.name : '' }, 3);
  }
  function endPodium() { const pod = Render.world && Render.world.podium; if (pod) pod.hide(); $('podium-cap').className = ''; shotOff(); }
  function toTitle() {
    rpStop(); rpRec = null; endPodium(); champRecord(); champRun = false;
    paused = false; phase = 'none'; race = null; bg = 'demo'; Comm.stop(); ghRec = ghPlay = null; Render.setGhost(null, true);
    Sfx.setRunning(false); Sfx.silence();
    Render.attachRace(demo); Render.resetCam();
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
    return ttRes;
  }
  // split rows, CP1..CPn + finish: this run's time, the previous best run's time there and the difference (alt: with the altitude)
  function splitRows(r, alt) {
    const T = track, pts = T.cpS.map((s, k) => ['CP' + (k + 1), s]).concat([['CILJ', T.finishS]]);
    return pts.map((p, k) => { const t = r.splits[k], pb = r.prevSplits ? r.prevSplits[k] : NaN, dd = t - pb;
      return '<tr><td>' + p[0] + '</td>' + (alt ? '<td>' + ttWhere(T, p[1]) + '</td>' : '') + '<td>' + fmt(t, true) + '</td><td>' + (isFinite(pb) ? fmt(pb, true) : '\u2013') + '</td><td class="' + (isFinite(dd) ? dCls(dd) : '') + '">' + (isFinite(dd) ? sgn(dd) : '\u2013') + '</td></tr>'; }).join('');
  }
  // leaderboard rows (top 10); the given run highlighted, and appended below when it did not make the top 10
  function boardRows(board, me) {
    const medal = (i) => i < 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][i] : (i + 1) + '.';
    const row = (e, lbl) => '<tr class="' + (me && e.date === me.date && e.time === me.time ? 'me' : '') + '"><td>' + lbl + '</td><td class="nm">' + esc(e.name || '?') + '</td><td class="nm">' + esc(e.car || '') + '</td><td>' + fmt(e.time, true) + '</td><td>' + (e.date ? new Date(e.date).toLocaleDateString('sl-SI', { day: 'numeric', month: 'numeric', year: '2-digit' }) : '') + '</td></tr>';
    let h = board.map((e, i) => row(e, medal(i))).join('');
    if (me && !board.some(e => e.date === me.date && e.time === me.time)) h += row(me, '\u2013');
    return h;
  }
  const RES_HEAD = '<tr><th>#</th><th>Voznik</th><th>Avto</th><th>Čas</th><th>Naj. krog</th></tr>', TT_HEAD = '<tr><th>#</th><th>Voznik</th><th>Avto</th><th>Čas</th><th>Datum</th></tr>';
  function finishTT() {
    const r = ttRes || ttFinish(), R0 = rec(track.def.id), T = track;
    $('res-head').classList.add('tt');
    $('res-pos').textContent = fmt(r.time, true);
    $('res-title').textContent = r.newPB ? 'Nov osebni rekord!' : 'Cilj';
    const d = r.prev ? r.time - r.prev : 0;
    $('res-sub').innerHTML = (r.newPB ? (r.prev ? 'Prejšnji rekord ' + fmt(r.prev, true) + ' (<span class="fast">' + sgn(d) + '</span>).' : 'Prvi čas na tej progi.')   // (the title already says "Nov osebni rekord!")
      : '<span class="slow">' + sgn(d) + '</span> za rekordom (rekord ' + fmt(r.prev, true) + ').') +
      ' ' + esc(T.def.name) + (race && race.rain ? ' v dežju' : '') + ' · ' + esc(Core.MODELS[S.car].name) + ' · ' + (r.rank <= 10 ? r.rank + '. mesto na lestvici.' : 'izven prvih 10.') +
      (medalSet(T.def) ? '<br>' + medalLine(T.def, r.time) : '') + (jumpLine() ? '<br>' + jumpLine() : '');
    // splits table: CP1..CPn + finish, altitude (a rally stage: the distance from the start), time, difference to the previous personal best
    const tt = $('res-tt'); tt.classList.remove('off');
    tt.innerHTML = '<p class="ltab-h">Vmesni časi</p><table class="ltab sp"><thead><tr><th>Točka</th><th>' + ttWhereHead(T.def) + '</th><th>Čas</th><th>Rekord</th><th>\u00b1</th></tr></thead><tbody>' + splitRows(r, true) + '</tbody></table>' +
      '<p class="ltab-h">Lestvica · ' + esc(T.def.name) + '</p>';
    $('res-table').querySelector('thead').innerHTML = TT_HEAD;
    $('res-table').querySelector('tbody').innerHTML = boardRows(R0.board || [], r.entry);
    $('res-restart').textContent = 'Ponovi ' + ttRun(T.def);
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
    $('board-tabs').innerHTML = Core.TRACKS.filter(isTT).concat(Core.TRACKS.filter(x => !isTT(x))).map(x => '<button data-board="' + x.id + '" class="' + (x.id === d.id ? 'sel' : '') + (isTT(x) ? ' tt' : '') + '">' + esc(x.name) + '</button>').join('');
    let h;
    if (isTT(d)) {
      const board = Array.isArray(r.board) ? r.board : [], T = getTrack(d.id);
      if (!board.length) h = '<p class="board-empty">Na tej progi še ni časov. Odpelji ' + ttRun(d) + ' in postavi prvi rekord!</p>';
      else {
        h = '<p class="ltab-h">Najboljših 10 · ' + esc(d.name) + ' · kronometer' + (wetRec(d) ? ' v dežju' : '') + '</p><table class="ltab b"><thead>' + TT_HEAD + '</thead><tbody>' + boardRows(board, null) + '</tbody></table>';
        if (Array.isArray(r.bestSplits) && r.bestTime) {
          const pts = T.cpS.map((s, k) => ['CP' + (k + 1), s]).concat([['CILJ', T.finishS]]);
          h += '<p class="ltab-h">Osebni rekord ' + fmt(r.bestTime, true) + ' · vmesni časi</p><table class="ltab"><thead><tr><th>Točka</th><th>' + ttWhereHead(d) + '</th><th>Čas</th></tr></thead><tbody>' +
            pts.map((p, k) => '<tr><td>' + p[0] + '</td><td>' + ttWhere(T, p[1]) + '</td><td>' + fmt(r.bestSplits[k], true) + '</td></tr>').join('') + '</tbody></table>';
        }
      }
    } else {
      const v = (x) => x ? x : '\u2013';
      h = '<p class="ltab-h">Rekordi · ' + esc(d.name) + ' · ' + lapWord(d.laps || 3).toLowerCase() + '</p><table class="ltab rec"><tbody>' +
        '<tr><td>Najboljši krog</td><td>' + v(r.bestLap && fmt(r.bestLap, true)) + '</td></tr><tr><td>Najboljša dirka</td><td>' + v(r.bestRace && fmt(r.bestRace, true)) + '</td></tr><tr><td>Najboljše mesto</td><td>' + v(r.bestPos && r.bestPos + '.') + '</td></tr></tbody></table>' +
        '<p class="board-empty">Lestvica najboljših časov se vodi za kronometre (' + Core.TRACKS.filter(isTT).map(x => esc(x.name)).join(', ') + ').</p>';
    }
    { const M = isTT(d) && medalSet(d), R = rec(d.id), J = d.jumpRec;   // the medal times; the famous jump: the player's longest there
      if (M) h += '<p class="ltab-h">Medalje' + (wetRec(d) ? ' (dež)' : '') + ' · ' + M.map((t, k) => MEDAL_ICON[k] + ' ' + fmt(t, true)).join(' · ') + '</p>';
      if (J) h += '<p class="ltab-h">' + esc(J.name) + ': tvoj najdaljši skok ' + (R.jumpRec ? Math.round(R.jumpRec) + ' m' : '\u2013') + ' · ' + esc(J.by) + ' ' + J.m + ' m</p>'; }
    $('board-body').innerHTML = h; $('board-body').scrollTop = 0;
  }
  function finishRace() {
    phase = 'done';
    Sfx.setRunning(false);
    if (mp && mp.race) { netResults(); return; }
    $('res-restart').dataset.act = 'restart';
    if (race.timeTrial) { finishTT(); return; }
    $('res-head').classList.remove('tt'); $('res-tt').classList.add('off'); $('res-table').querySelector('thead').innerHTML = RES_HEAD; $('res-restart').textContent = 'Ponovi dirko';
    const res = race.estimateResults();
    const P = race.player;
    const myIdx = res.findIndex(r => r.car === P);
    const pos = myIdx + 1;
    const best = P.lapTimes.length ? Math.min(...P.lapTimes) : 0;
    let newRec = false;
    const R0 = rec(track.def.id);
    if (best > 0 && (!R0.bestLap || best < R0.bestLap)) { R0.bestLap = best; newRec = true; }
    const tot = res[myIdx].time;
    if (!R0.bestRace || tot < R0.bestRace) R0.bestRace = tot;
    if (!R0.bestPos || pos < R0.bestPos) R0.bestPos = pos;
    saveRecords();
    $('res-pos').textContent = pos + '.';
    $('res-title').textContent = pos === 1 ? 'Zmaga!' : pos <= 3 ? 'Na stopničkah!' : 'Cilj';
    $('res-sub').textContent = 'Čas dirke ' + fmt(tot, true) + ', najboljši krog ' + fmt(best, true) + (newRec ? ' (nov rekord proge)' : '') + '. Štartal si z ' + PLAYER_GRID + '. mesta.';
    const ch = race.champ;
    if (ch) {   // a championship round: counted now; the points in the table, the standings behind the button
      champRecord();
      const d = champDef(), t = champ ? Core.champTable(CH_KEYS, champ.rounds) : [], mi = t.findIndex(e => e.key === Core.PLAYER_KEY), last = champDone();
      if (d && mi >= 0) {
        $('res-sub').textContent += ' ' + d.name + ': +' + Core.champPoints(pos) + ' ' + ptsWord(Core.champPoints(pos)) + ', skupaj ' + t[mi].pts + ' in ' + (mi + 1) + '. mesto' + (last ? ' v končni razvrstitvi.' : ' po ' + champ.rounds.length + '. dirki.');
        if (last) Comm.say(mi === 0 ? 'champWin' : 'champEnd', { pos: Comm.ordinal(mi + 1) }, 5);
      }
      $('res-restart').dataset.act = 'to-champ'; $('res-restart').textContent = last ? 'Končna razvrstitev' : 'Lestvica prvenstva';
      $('res-table').querySelector('thead').innerHTML = RES_HEAD.replace('</tr>', '<th>Točke</th></tr>');
    }
    if (rpRec) rpRec.stop = true;
    $('res-replay').classList.toggle('off', !rpPlan());
    const tb = $('res-table').querySelector('tbody');
    tb.innerHTML = res.map((r, i) => {
      const c = r.car; const b = c.lapTimes.length ? Math.min(...c.lapTimes) : NaN;
      const name = c.isPlayer ? 'Ti' : c.name, p = Core.champPoints(i + 1);
      return '<tr class="' + (c.isPlayer ? 'me' : '') + '"><td>' + (i + 1) + '</td><td><span class="dot" style="background:' + hexCss(c.color) + '"></span>' + name + '</td><td>' + c.m.name + '</td><td>' + (r.est ? '+' + fmt(r.time - res[0].time, true) : fmt(r.time, true)) + (r.pen ? ' <small class="pen">(+' + r.pen + ' s)</small>' : '') + '</td><td>' + fmt(b, true) + '</td>' +
        (ch ? '<td class="pts">' + (p ? '+' + p : '') + '</td>' : '') + '</tr>';
    }).join('');
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
    if (!b || s0 < c - 2.5 * w - 15 || s0 > c + w) { showMsg('SKOK ' + m + ' m', 'gold', 1.1); return; }
    jmp.rec = Math.max(jmp.rec, len);
    const R0 = rec(track.def.id), prev = R0.jumpRec || 0, pb = len > prev + 0.05, beat = len > J.m;
    if (pb) { R0.jumpRec = +len.toFixed(1); saveRecords(); }
    showMsg((beat ? J.beat.toUpperCase() + ' ' : pb && prev ? 'REKORD SKOKA! ' : J.name.toUpperCase() + ' ') + m + ' m', beat || (pb && prev) ? 'fast' : 'gold', 2.2);
    Comm.say(beat ? 'jumpBeat' : pb && prev ? 'jumpPB' : 'jumpRec', { m, rec: J.m, by: J.by, place: J.say }, 3);
  }
  const jumpLine = () => { const J = track.def.jumpRec, R0 = rec(track.def.id);   // (the results: the run's longest jump, the famous one against the records)
    if (!jmp.n) return ''; let h = 'Najdaljši skok ' + Math.round(jmp.best) + ' m';
    if (J) h += ' · ' + esc(J.name) + ' ' + (jmp.rec ? Math.round(jmp.rec) + ' m' : '–') + ' (tvoj rekord ' + (R0.jumpRec ? Math.round(R0.jumpRec) + ' m' : '–') + ', ' + esc(J.by) + ' ' + J.m + ' m)';
    return h + '.'; };

  /* ---------------- championship screen: the choice of a series, then the standings between the rounds, the final standings ---------------- */
  const trackName = (id) => (Core.TRACKS.find(d => d.id === id) || {}).name || id;
  const raceWord = (n) => n + (n === 1 ? ' dirka' : n === 2 ? ' dirki' : n <= 4 ? ' dirke' : ' dirk');
  const ptsWord = (n) => n % 100 === 1 ? 'točka' : n % 100 === 2 ? 'točki' : n % 100 === 3 || n % 100 === 4 ? 'točke' : 'točk';
  const winsWord = (n) => !n ? 'brez zmage' : n + (n === 1 ? ' zmaga' : n === 2 ? ' zmagi' : n <= 4 ? ' zmage' : ' zmag');
  const DIFF_NAME = ['lahka', 'srednja', 'težka'];
  const champDriver = (key) => { if (key === Core.PLAYER_KEY) return { name: S.name, car: Core.MODELS[S.car].name, color: PLAYER_COLORS[S.color] };
    const a = Core.aiDriver(Math.max(0, CH_KEYS.indexOf(key) - 1)); return { name: a.name, car: a.model.name, color: a.color }; };
  // the championship round just driven: its finishing order into the standings (once); after the last round the final place into the records
  function champRecord() {
    if (!race || !race.champ || race.champ.done || !race.player.finished || !champ) return;
    const d = champDef(); if (!d || champ.rounds.length !== race.champ.round || d.tracks[race.champ.round] !== race.track.def.id) return;
    champ.rounds.push({ track: race.track.def.id, order: race.estimateResults().map(r => r.car.isPlayer ? Core.PLAYER_KEY : r.car.name), rain: race.wetAny || race.rain > 0.5 ? 1 : 0 });
    race.champ.done = true; champSave();
    if (champDone()) {
      const pos = Core.champTable(CH_KEYS, champ.rounds).findIndex(e => e.key === Core.PLAYER_KEY) + 1, R0 = records.champ[champ.id] || (records.champ[champ.id] = {});
      if (!R0.best || pos < R0.best) R0.best = pos;
      if (pos === 1) R0.titles = (R0.titles || 0) + 1;
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
    $('ch-quit').classList.toggle('off', !d || done); $('ch-quit').textContent = 'Opusti';
    if (!d) {   // the choice of a series: its tracks, its length, the best final place so far
      if (!Core.CHAMPS.some(c => c.id === champPick)) champPick = Core.CHAMPS[0].id;
      $('ch-title').textContent = 'Prvenstvo'; $('ch-tag').textContent = 'točke kot v F1';
      $('ch-diff').textContent = 'Težavnost: ' + DIFF_NAME[S.difficulty] + ' (spremeniš v Nastavitvah)';
      $('ch-body').innerHTML = '<div class="ch-cards">' + Core.CHAMPS.map(c => {
        const R0 = records.champ[c.id] || {}, km = c.tracks.reduce((a, id) => { const T = getTrack(id); return a + T.len * (T.def.laps || LAPS); }, 0);
        return '<button class="ch-card' + (c.id === champPick ? ' sel' : '') + '" data-champ="' + c.id + '"><h3>' + esc(c.name) + '</h3><div class="tmeta">' + raceWord(c.tracks.length) + ' · ' + kmTxt(km, 0) + ' km</div>' +
          '<div class="ttracks">' + c.tracks.map(id => esc(trackName(id))).join(' · ') + '</div><div class="tdesc">' + esc(c.desc) + '</div>' +
          (R0.best ? '<div class="trec">' + (R0.titles ? 'Prvak ' + R0.titles + '×' : 'Najboljše: ' + R0.best + '. mesto') + '</div>' : '') + '</button>'; }).join('') + '</div>';
      $('ch-go').textContent = 'Začni prvenstvo';
      return;
    }
    const t = Core.champTable(CH_KEYS, champ.rounds), next = champ.rounds.length, mi = t.findIndex(e => e.key === Core.PLAYER_KEY);
    $('ch-title').textContent = d.name; $('ch-tag').textContent = done ? 'končano' : 'dirka ' + (next + 1) + '/' + d.tracks.length;
    $('ch-diff').textContent = 'Težavnost: ' + DIFF_NAME[champ.diff];
    const chips = '<ol class="ch-rounds">' + d.tracks.map((id, i) => { const r = champ.rounds[i];
      return '<li class="' + (r ? 'done' : i === next ? 'next' : '') + '">' + (i + 1) + '. ' + esc(trackName(id)) + (r ? ' · <b>' + (r.order.indexOf(Core.PLAYER_KEY) + 1) + '.</b>' + (r.rain ? ' (dež)' : '') : '') + '</li>'; }).join('') + '</ol>';
    const fin = done ? '<div class="ch-final"><div class="res-pos">' + (mi + 1) + '.</div><div><h2>' + (mi === 0 ? 'Prvak!' : mi < 3 ? 'Na stopničkah prvenstva!' : 'Konec prvenstva') + '</h2>' +
      '<p class="desc">' + t[mi].pts + ' ' + ptsWord(t[mi].pts) + ', ' + winsWord(t[mi].wins) + '. Zmagovalec ' + esc(champDriver(t[0].key).name) + ' (' + t[0].pts + ').</p></div></div>' : '';
    const rows = t.map((e, i) => { const c = champDriver(e.key);
      return '<tr class="' + (e.key === Core.PLAYER_KEY ? 'me' : '') + '"><td>' + (i + 1) + '.</td><td class="nm"><span class="dot" style="background:' + hexCss(c.color) + '"></span>' + esc(c.name) + '</td><td class="nm">' + esc(c.car) + '</td>' +
        '<td class="pts">' + e.pts + '</td><td>' + (e.wins || '') + '</td><td>' + (e.last ? e.last + '.' : '–') + '</td></tr>'; }).join('');
    $('ch-body').innerHTML = fin + chips + '<table class="ltab b"><thead><tr><th>#</th><th>Voznik</th><th>Avto</th><th>Točke</th><th>Zmage</th><th>Zadnja</th></tr></thead><tbody>' + rows + '</tbody></table>';
    $('ch-go').textContent = done ? 'Novo prvenstvo' : 'Naslednja dirka: ' + trackName(d.tracks[next]);
    $('ch-body').scrollTop = 0;
  }

  /* ---------------- per-step race logic ---------------- */
  /* ---------------- the highlights after a race (Posnetek): TV cameras by the track ----------------
     Every offline circuit race is recorded: each car's pose 10 times a second of the race clock (and the weather), the overtakes and the heavy
     crashes noted as they happen. "Posnetek" on the results plays the start, the best moments (the player's first, then the fights at the
     front, passes in the corners, back-and-forth battles; at most four, apart from each other) and the finish, each filmed as on TV: cameras
     on stands beside the track (on the outside of the bends), a cut to the next one as the cars go by, zoomed so the cars stay the same size
     on the screen; the commentator names each moment. Meanwhile the race behind the results stands still; its cars are put back after. */
  const RP_DT = 0.1, RP_C = 8, RP_W = 3, RP_CH = 600, RP_MAX = 24000;   // a sample every 0.1 s: per car x, y, z, heading, speed, steer, brake, race distance; the rain, the water on the track, the dry line; 600 samples a chunk; at most 40 min
  const RP_KEEP = ['x', 'y', 'z', 'h', 'px', 'py', 'pz', 'ph', 'vx', 'vy', 'vz', 'vl', 'w', 'axF', 'gradeNow', 'roadY', 'delta', 'inBrk', 'inHand', 'gear', 'drs', 'air', 'onCurb', 'bankSl'];   // (the pose and what the drawing reads; the speed follows vx, vz)
  let rpRec = null, rp = null;
  function rpStart() {   // newRace: record every offline race of a field (not a time trial, not online)
    rpRec = race.timeTrial || (mp && mp.race) ? null : { n: race.cars.length, ch: [], k: 0, ev: [], pos: null, last: new Map(), stop: false };
    $('res-replay').classList.add('off');
  }
  function rpSample() {   // after every physics step: the samples due by the race clock; the overtakes at each
    const R = rpRec; if (!R || R.stop || race.state === 'grid') return;
    const st = R.n * RP_C + RP_W;
    while (R.k < RP_MAX && race.time >= R.k * RP_DT) {
      const ci = Math.floor(R.k / RP_CH), o = (R.k % RP_CH) * st, A = R.ch[ci] || (R.ch[ci] = new Float32Array(RP_CH * st));
      for (let j = 0; j < R.n; j++) { const c = race.cars[j], b = o + j * RP_C; A[b] = c.x; A[b + 1] = c.y || 0; A[b + 2] = c.z; A[b + 3] = c.h; A[b + 4] = c.vl; A[b + 5] = c.delta || 0; A[b + 6] = c.inBrk > 0.08 && c.vl > 0.5 ? 1 : 0; A[b + 7] = c.dist; }
      const w = o + R.n * RP_C; A[w] = race.rain || 0; A[w + 1] = race.wetness != null ? race.wetness : race.rain || 0; A[w + 2] = race.lineK != null ? race.lineK : 1;
      rpPasses(R); R.k++;
    }
  }
  // a pass: car a was behind car b at the last sample and is ahead now, both racing close together (not in the pits, not under the safety car)
  function rpPasses(R) {
    const t = race.time, S = race.sc, T = race.track, cars = race.cars;
    if (R.pos && !(S && S.phase !== 'off')) for (let ja = 0; ja < R.n; ja++) {
      const a = cars[ja], p0 = R.pos[ja]; if (!(a.pos < p0) || a.inPit || a.finished || a.pitWant || a.speed < 8) continue;
      for (let jb = 0; jb < R.n; jb++) {
        const b = cars[jb]; if (jb === ja || !(R.pos[jb] < p0 && b.pos > a.pos) || b.inPit || b.finished || b.pitWant || Math.abs(a.dist - b.dist) > 25) continue;
        const key = ja + '>' + jb, lt = R.last.get(key); R.last.set(key, t); if (lt != null && t - lt < 12) continue;   // (the same pass again soon: once)
        const back = R.last.get(jb + '>' + ja), fight = back != null && t - back < 10, spun = b.speed < 0.5 * a.speed || b.stuckT > 0.3, bend = Math.abs(T.k[T.idx(a.q.s)]) > 1 / 120;
        const me = !!(a.isPlayer || b.isPlayer), sc = 1 + (me ? 3 : 0) + (a.pos === 1 ? 2 : 0) + Math.max(0, 8 - a.pos) * 0.15 + (bend ? 1 : 0) + (fight ? 1.5 : 0) - (spun ? 1.5 : 0);
        R.ev.push({ kind: 'pass', t, a: ja, b: jb, pos: a.pos, sc });
      }
    }
    R.pos = cars.map(c => c.pos);
  }
  function rpCrash(c, imp) {   // a heavy hit (the wall or another car): one moment per car within 6 s, the hardest hit
    const R = rpRec, j = race.cars.indexOf(c), t = race.time, sc = 1.2 + imp / 12 + (c.isPlayer ? 2.5 : 0);
    const e = R.ev.find(q => q.kind === 'crash' && q.a === j && t - q.t < 6);
    if (e) { if (sc > e.sc) e.sc = sc; return; }
    R.ev.push({ kind: 'crash', t, a: j, b: -1, sc });
  }
  const rpName = (c) => c.isPlayer ? 'Ti' : c.name;
  function rpPlan() {   // the clips: the start, the best moments in the order they happened, the finish
    const R = rpRec; if (!R || R.k < 60) return null;
    const tEnd = (R.k - 1) * RP_DT, W = race.finishOrder[0], tFin = W && W.finishTime <= tEnd - 1.5 ? W.finishTime : null, cars = race.cars;
    const clips = [{ kind: 'start', t0: 0, t1: Math.min(8.5, tEnd), a: -1, b: -1, lbl: 'ŠTART', cap: '', say: 'rpStart' }];
    const pick = [];
    for (const e of R.ev.slice().sort((x, y) => y.sc - x.sc)) {
      if (pick.length >= 4) break;
      if (e.t < 10 || e.t + 3 > tEnd || (tFin != null && e.t > tFin - 6) || pick.some(q => Math.abs(q.t - e.t) < 9)) continue;
      pick.push(e);
    }
    pick.sort((x, y) => x.t - y.t);
    for (const e of pick) {
      const a = cars[e.a], b = e.b >= 0 ? cars[e.b] : null;
      if (e.kind === 'pass') clips.push({ kind: 'pass', t0: e.t - 5.5, t1: e.t + 2.5, a: e.a, b: e.b, lbl: 'PREHITEVANJE', cap: rpName(a) + ' ▸ ' + rpName(b) + ' · ' + e.pos + '. mesto',
        say: a.isPlayer ? 'rpPassMe' : b.isPlayer ? 'rpPassOnMe' : 'rpPass', vars: { a: a.name, b: b.name, pos: Comm.ordinal(e.pos) } });
      else clips.push({ kind: 'crash', t0: e.t - 4, t1: e.t + 3, a: e.a, b: -1, lbl: 'NESREČA', cap: rpName(a), say: a.isPlayer ? 'rpCrashMe' : 'rpCrash', vars: { a: a.name } });
    }
    if (tFin != null) clips.push({ kind: 'finish', t0: tFin - 5, t1: tFin + 1.5, a: cars.indexOf(W), b: -1, lbl: 'CILJ', cap: W.isPlayer ? 'Tvoja zmaga!' : 'Zmaga: ' + rpName(W), say: W.isPlayer ? 'rpFinishMe' : 'rpFinish', vars: { a: W.name } });
    return clips;
  }
  function rpAt(t, j, o) {   // car j's pose at race time t, between the two samples around it (j < 0: the weather into o.rain, o.wet, o.line)
    const R = rpRec, f = clamp(t / RP_DT, 0, R.k - 1.0001), k = Math.floor(f), a = f - k, st = R.n * RP_C + RP_W;
    const A = R.ch[Math.floor(k / RP_CH)], B = R.ch[Math.floor((k + 1) / RP_CH)], L = (i0, i1) => A[i0] + (B[i1] - A[i0]) * a;
    if (j < 0) { const i0 = (k % RP_CH) * st + R.n * RP_C, i1 = ((k + 1) % RP_CH) * st + R.n * RP_C; o.rain = L(i0, i1); o.wet = L(i0 + 1, i1 + 1); o.line = L(i0 + 2, i1 + 2); return o; }
    const i0 = (k % RP_CH) * st + j * RP_C, i1 = ((k + 1) % RP_CH) * st + j * RP_C;
    o.x = L(i0, i1); o.y = L(i0 + 1, i1 + 1); o.z = L(i0 + 2, i1 + 2); o.h = A[i0 + 3] + Core.wrapPi(B[i1 + 3] - A[i0 + 3]) * a;
    o.v = L(i0 + 4, i1 + 4); o.st = L(i0 + 5, i1 + 5); o.br = (a < 0.5 ? A[i0 + 6] : B[i1 + 6]) > 0.5; o.d = L(i0 + 7, i1 + 7);
    return o;
  }
  const _rq = { x: 0, y: 0, z: 0, h: 0, v: 0, st: 0, br: false, d: 0 }, _rw = { rain: 0, wet: 0, line: 1 };
  function rpApply(t) {   // every car where it was at race time t (drawn as it stands: no slides, no smoke), the weather then
    const T = race.track, L = T.len;
    for (let j = 0; j < rpRec.n; j++) {
      const c = race.cars[j], q = rpAt(t, j, _rq), s = ((T.startS + q.d) % L + L) % L;
      c.x = c.px = q.x; c.y = c.py = c.roadY = q.y; c.z = c.pz = q.z; c.h = c.ph = q.h; c.vl = q.v; c.vx = Math.cos(q.h) * q.v; c.vz = Math.sin(q.h) * q.v; c.vy = 0; c.delta = q.st; c.inBrk = q.br ? 1 : 0;
      c.w = 0; c.axF = 0; c.air = false; c.onCurb = false; c.inHand = 0; c.gear = 1; c.drs = false; c.bankSl = 0; c.gradeNow = T.hasElev ? T.elevAt(s).grade : 0;
    }
    rpAt(t, -1, _rw); race.rain = _rw.rain; if (race.wetness != null) { race.wetness = _rw.wet; race.lineK = _rw.line; }
  }
  // the point the cameras follow (x, y, z; d: its race distance): the pair in a pass (the passing car if they are far apart), the first four at
  // the start, else the car
  function rpTarget(C, t, o) {
    const n = rpRec.n;
    if (C.kind === 'start') {
      const P = []; for (let j = 0; j < n; j++) P.push(Object.assign({}, rpAt(t, j, _rq)));
      P.sort((p, q) => q.d - p.d); const m = P.slice(0, Math.min(4, n));
      o.x = m.reduce((a, p) => a + p.x, 0) / m.length; o.y = m.reduce((a, p) => a + p.y, 0) / m.length; o.z = m.reduce((a, p) => a + p.z, 0) / m.length; o.d = m.reduce((a, p) => a + p.d, 0) / m.length;
      return o;
    }
    const a = rpAt(t, C.a, _rq), ax = a.x, ay = a.y, az = a.z, ad = a.d;
    if (C.b >= 0) { const b = rpAt(t, C.b, _rq); if (Math.abs(b.d - ad) < 40) { o.x = (ax + b.x) / 2; o.y = (ay + b.y) / 2; o.z = (az + b.z) / 2; o.d = (ad + b.d) / 2; return o; } }
    o.x = ax; o.y = ay; o.z = az; o.d = ad; return o;
  }
  // the cameras of a clip: on stands beside the track every 140 m along the way the target goes (the first 70 m ahead of it), on the outside
  // of the bend there (on a straight: the side with more room), over the verge near the barrier, 4.5 m up (the start: higher, the whole field
  // in view). A camera must see the road where the cars come from (the scenery, the ground in the way: the other side, a higher stand, or none)
  const _rc = typeof THREE !== 'undefined' ? new THREE.Raycaster() : null, _ro = typeof THREE !== 'undefined' ? new THREE.Vector3() : null, _rd = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;
  function rpSees(x, y, z, tx, ty, tz) {   // nothing solid of the world between a camera and a point on the road (fences and other see-through meshes do not count)
    const W = Render.world; if (!_rc || !W || !W.root) return true;
    _ro.set(x, y, z); _rd.set(tx - x, ty - y, tz - z); const len = _rd.length(); if (len < 6) return true;
    _rc.set(_ro, _rd.multiplyScalar(1 / len)); _rc.near = 0.5; _rc.far = len - 4;
    for (const h of _rc.intersectObject(W.root, true)) { const m = h.object.material; if (!m || m.transparent || m.alphaTest > 0 || m.visible === false || !h.object.visible) continue; return false; }
    return true;
  }
  function rpCams(C) {
    const T = race.track, L = T.len, W = Render.world, gH = W && (W.camFloor || W.groundH), o = {};
    const d0 = rpTarget(C, C.t0, o).d, d1 = rpTarget(C, C.t1, o).d, cams = [], ry = (i) => (T.hasElev ? T.hy[i] : 0);
    const at = (d, side, up, i) => {
      const bar = side > 0 ? T.br[i] : T.bl[i], off = side * (T.w + Math.min(6, Math.max(1.2, (bar - T.w) * 0.5))), x = T.px[i] + T.nx[i] * off, z = T.pz[i] + T.nz[i] * off;
      return { d, x, z, y: Math.max(ry(i), gH ? gH(x, z) : ry(i)) + up };
    };
    const sees = (K) => { for (const u of [-90, -30]) { const j = T.idx(T.startS + K.d + u); if (!rpSees(K.x, K.y, K.z, T.px[j], ry(j) + 0.8, T.pz[j])) return false; } return true; };
    for (let d = d0 + 70; d < d1 + 200 || cams.length < 2; d += 140) {
      const s = ((T.startS + d) % L + L) % L, i = T.idx(s);
      let kv = 0; for (let u = -60; u <= 60; u += 10) kv += T.k[T.idx(s + u)];
      const side = kv > 0.03 ? -1 : kv < -0.03 ? 1 : (T.bl[i] >= T.br[i] ? -1 : 1), up = C.kind === 'start' && !cams.length ? 9 : 4.5;
      const K = [at(d, side, up, i), at(d, -side, up, i), at(d, side, up + 5, i), at(d, -side, up + 5, i)].find(sees);
      if (K) cams.push(K); else if (d > d1 + 60 && !cams.length) cams.push(at(d, side, up + 5, i));   // (none sees: the clip keeps the camera before; at least one)
    }
    return cams;
  }
  function rpClip(k) {
    const C = rp.clips[k], t0 = performance.now(); rp.k = k; rp.t = C.t0; rp.cams = rpCams(C); rp.cam = 0; rp.ms = performance.now() - t0;
    $('rp-cap').innerHTML = '<small>' + esc(C.lbl) + '</small>' + esc(C.cap); Comm.say(C.say, C.vars || null, 4);
  }
  function rpPlay() {
    const clips = rpPlan(); if (!clips) return;
    rpRec.stop = true;
    rp = { clips, k: 0, t: 0, cams: null, cam: 0, keep: race.cars.map(c => RP_KEEP.map(f => c[f])), wx: [race.rain, race.wetness, race.lineK], sc: race.sc ? race.sc.onTrack : null };
    if (race.sc) race.sc.onTrack = false;
    Sfx.silence(); Comm.stop();
    showScreen('none'); $('hud').classList.add('shot'); $('podium-cap').className = ''; $('btn-pause').classList.add('off'); $('rp').classList.remove('off');
    rpClip(0);
  }
  function rpNext() { if (!rp) return; if (rp.k + 1 < rp.clips.length) rpClip(rp.k + 1); else rpEnd(); }
  function rpStop() {   // the race as it was (the cars where they stood, the weather), the game's camera back
    if (!rp) return;
    race.cars.forEach((c, j) => RP_KEEP.forEach((f, k) => { c[f] = rp.keep[j][k]; }));
    race.rain = rp.wx[0]; if (race.wetness != null) { race.wetness = rp.wx[1]; race.lineK = rp.wx[2]; }
    if (race.sc) race.sc.onTrack = rp.sc;
    rp = null; $('rp').classList.add('off'); shotOff(); Comm.stop();
  }
  function rpEnd() { rpStop(); showScreen('results'); }
  function rpFrame(dt) {
    rp.t += dt;
    if (rp.t > rp.clips[rp.k].t1) { if (rp.k + 1 < rp.clips.length) rpClip(rp.k + 1); else { rpEnd(); return; } }
    const C = rp.clips[rp.k], tg = rpTarget(C, rp.t, {});
    rpApply(rp.t);
    while (rp.cam < rp.cams.length - 1 && rp.cams[rp.cam].d - tg.d < -18) rp.cam++;   // (the cars went by: the next camera)
    const K = rp.cams[rp.cam], ty = tg.y + 0.7, dist = Math.hypot(tg.x - K.x, ty - K.y, tg.z - K.z), asp = innerWidth / Math.max(1, innerHeight);
    const half = asp < 1 ? 6 / asp : 6, fov = clamp(2 * Math.atan(half / Math.max(1, dist)) * 180 / Math.PI, 5, 62);   // (the cars about 12 m across the narrower side of the screen)
    Render.setShot({ px: K.x, py: K.y, pz: K.z, tx: tg.x, ty, tz: tg.z, fov, fogD: Math.max(dist, 90) });   // (a long lens sees far: the haze as for a far camera)
    Render.frame(dt, 1, C.a >= 0 ? race.cars[C.a] : race.order[0], S.camera, { noFx: true });
  }

  function stepRace(dt, inp) {
    const P = race.player;
    if ((phase === 'finish' || phase === 'done') && race.timeTrial) { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; P.inHand = 0; P.digitalSteer = false; }   // time trial: brake to a stop past the finish (the road ends)
    else if (phase === 'finish' || phase === 'done' || autoDrive) { P.pitWant = !!P.inPit; Core.aiControl(P, race, dt); P.digitalSteer = false; }   // (autoDrive: automated tests of online races drive in real time)
    else { P.inSteer = inp.steer; P.inThr = inp.thr; P.inBrk = inp.brk; P.inHand = inp.hand; P.digitalSteer = inp.digital; }
    race.step(dt);
    if (ghRec) ghSample(P);
    if (rpRec) { rpSample(); if (!rpRec.stop) for (const c of race.cars) { const imp = Math.max(c.hitWall, c.hitCar); if (imp > 13) rpCrash(c, imp); } }
    if (P.gear > prevGear && prevGear > 0) Sfx.shiftPop();
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
    if (track.def.pit && !pitHint && dmgOn() && P.dmg > 0.45 && phase === 'racing') { pitHint = true; Comm.say('pitAdvice', null, 3); }   // (the commentator tells where the pits are, no text on the screen)
    if (P.pitState === 'repair' && (!Render.crew || !Render.crew.P || Render.crew.gunOn)) { pitWrenchT -= dt; if (pitWrenchT <= 0) { pitWrenchT = 0.28 + Math.random() * 0.35; Sfx.wrench(); } }   // (with the crew: while the wheel guns rattle)
    if (P.propSnd) { Sfx.knock(P.propSnd, P.propSndV); if (P.propSndV > 9 && (P.propSnd === 'tstack' || P.propSnd === 'bstack' || P.propSnd === 'rbstack' || P.propSnd === 'crate')) vibrate(25); P.propSnd = null; P.propSndV = 0; }   // knocked a cone, tyres or bales
    for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; }
  }

  /* ---------------- pit stops ---------------- */
  let pitWrenchT = 0, pitHint = false, drsN = 0, secN = 0;
  function pitEvent(e) {
    if (phase !== 'racing') return;
    if (e === 'enter') { showMsg('BOKSI · 80 km/h', 'gold', 1.8); Sfx.beep(660, 0.1, 0.1); Comm.say('pitIn', null, 2); }
    else if (e === 'repair') { pitWrenchT = 0.15; vibrate(30); if (Math.random() < 0.6) Comm.say('pitWork', null, 1); }
    else if (e === 'done') { showMsg('POPRAVLJENO!', 'gold', 1.6); Sfx.beep(880, 0.12, 0.12); setTimeout(() => Sfx.beep(1175, 0.18, 0.12), 130); vibrate(40); Comm.say('pitOut', null, 2); dmgKey = ''; }
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
      for (let d = Pd[1]; d <= Pd[2]; d += 4) { const s0 = track.startS + d, p = track.pitAt(s0); if (!p) continue; const i = track.idx(s0), x = (track.px[i] + track.nx[i] * p.o) * mm.sc + mm.ox, y = (track.pz[i] + track.nz[i] * p.o) * mm.sc + mm.oz; if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y); }
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
    path(); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 7 * dpr; g.stroke();
    path(); g.strokeStyle = '#ffffff'; g.lineWidth = 3.4 * dpr; g.stroke();
    const tick = (i, col, len) => { g.strokeStyle = col; g.beginPath(); g.moveTo(X(i) - track.nx[i] * len, Y(i) - track.nz[i] * len); g.lineTo(X(i) + track.nx[i] * len, Y(i) + track.nz[i] * len); g.stroke(); };
    g.lineWidth = 2.5 * dpr; tick(track.startIdx, '#e63b2e', 6 * dpr);
    g.font = '700 italic ' + Math.round(9 * dpr) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    track.cpS.forEach((s, k) => { const i = track.idx(s); g.lineWidth = 3 * dpr; tick(i, '#ffc629', 7 * dpr);
      const lx = X(i) + track.nx[i] * 14 * dpr, ly = Y(i) + track.nz[i] * 14 * dpr; g.lineWidth = 3 * dpr; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(String(k + 1), lx, ly); g.fillStyle = '#ffc629'; g.fillText(String(k + 1), lx, ly); });
    chequer(g, X(track.finishIdx), Y(track.finishIdx), 5 * dpr);
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
    // player: arrow in the driving direction
    const ch = Math.cos(P.h), sh = Math.sin(P.h), r = 5.5 * d;
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#111'; g.lineWidth = 1.5 * d; g.beginPath();
    g.moveTo(cx + ch * r * 1.3, cy + sh * r * 1.3); g.lineTo(cx - ch * r * 0.8 - sh * r * 0.8, cy - sh * r * 0.8 + ch * r * 0.8); g.lineTo(cx - ch * r * 0.8 + sh * r * 0.8, cy - sh * r * 0.8 - ch * r * 0.8); g.closePath(); g.fill(); g.stroke();
    // course overview: a slim bar on the right edge, start at the bottom, CP ticks, the player
    const bx = w - 6 * d, y0 = h - 7 * d, y1 = 7 * d, f = clamp((P.finished ? track.raceLen : P.dist) / track.raceLen, 0, 1);
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(bx - 2.5 * d, y1 - 1 * d, 5 * d, y0 - y1 + 2 * d);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(bx - 1 * d, y1, 2 * d, y0 - y1);
    g.fillStyle = '#ffc629'; g.fillRect(bx - 1 * d, y0 - (y0 - y1) * f, 2 * d, (y0 - y1) * f);
    for (const cd of track.cpDist) { const y = y0 - (y0 - y1) * cd / track.raceLen; g.fillRect(bx - 3 * d, y - 0.75 * d, 6 * d, 1.5 * d); }
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
  /* ---------------- tyres, the weather's changes, the safety car (a race with tyres) ----------------
     The tyre badge by the damage figure: the compound's letter in its colour (mehke red, srednje yellow, trde white, za dež green) and a
     ring for what is left of it. The rest is news: the rain starting and stopping, a dry line, new tyres after a stop, the safety car
     (a banner while it is out, the commentator; no overtaking: give the place back within 8 s, else 5 s penalty) */
  let tyreKey = '', newsT = 0;
  function updateRaceNews(P) {
    const T = Core.TYRES[P.tyre];
    if (T) {
      const left = Math.round(100 * Core.clamp(1 - P.tyreW, 0, 1)), k = P.tyre + left;
      if (k !== tyreKey) { tyreKey = k; const el = $('h-tyre'); el.className = 'show'; el.style.setProperty('--tc', hexCss(T.col)); el.style.setProperty('--tw', left + '%'); $('h-tyre-l').textContent = TYRE_LTR[P.tyre]; el.title = 'Gume: ' + TYRE_NAME[P.tyre] + ', ' + left + ' %'; }
    }
    if (P.pitEv2 === 'tyres') { P.pitEv2 = null; showMsg('NOVE GUME · ' + TYRE_NAME[P.tyre].toUpperCase(), 'gold', 1.8); Comm.say('pitTyres', { tyre: TYRE_EN[P.tyre] }, 2); cs.slickWarn = cs.wetWarn = false; }
    for (const c of race.cars) if (!c.isPlayer && c.pitEv2) { c.pitEv2 = null; if (c.pos <= 3 && Math.random() < 0.6) Comm.say('pitAI', { name: c.name, tyre: TYRE_EN[c.tyre] }, 1); }
    const W = race.wx;
    if (W && W.ev) {
      const e = W.ev; W.ev = null;
      if (e === 'rain') { showMsg('DEŽ!', 'blue', 2); Comm.say('rainStart', null, 3); race.wetAny = true; }
      else if (e === 'dry') { showMsg('DEŽ JE PONEHAL', 'gold', 2); Comm.say('rainStop', null, 3); }
      else if (e === 'line') Comm.say('dryLine', null, 2);
    }
    if (race.wetness > 0.5) race.wetAny = true;
    // the commentator's advice to the player (once each): slicks in the wet, wets on a dry line, worn tyres
    if (phase === 'racing' && !P.finished && track.def.pit) {
      const lw = race.wetness * race.lineK;
      if (!cs.slickWarn && P.tyre !== 'W' && lw > 0.45 && race.rain > 0.3) { cs.slickWarn = true; Comm.say('slicksInRain', null, 3); }
      if (!cs.wetWarn && P.tyre === 'W' && lw < 0.15 && race.rain < 0.05 && race.laps * track.len - P.dist > track.len * 0.8) { cs.wetWarn = true; Comm.say('wetsOnDry', null, 3); }
      if (!cs.wornWarn && P.tyreW > 0.9 && race.laps * track.len - P.dist > track.len * 0.8) { cs.wornWarn = true; Comm.say('tyresWorn', null, 2); }
    }
    const S2 = race.sc;
    if (S2) {
      const el = $('h-sc'), on = S2.phase !== 'off';
      if (S2.ev) {
        const e = S2.ev; S2.ev = null;
        if (e === 'out') { Comm.say('scOut', null, 4); Sfx.beep(880, 0.12, 0.1); }
        else if (e === 'inLap') Comm.say('scIn', null, 3);
        else if (e === 'green') { showMsg('ZELENA ZASTAVA!', 'green', 1.8); Comm.say('scGreen', null, 4); }
        else if (e === 'warn') { Comm.say('scWarn', null, 4); vibrate(60); }
        else if (e === 'pen') { showMsg('KAZEN +5 s', 'red', 2.2); Comm.say('scPen', null, 4); }
      }
      const txt = !on ? '' : S2.warn ? 'NE PREHITEVAJ · VRNI MESTO ' + Math.ceil(S2.warn.t) : S2.phase === 'on' ? 'VARNOSTNI AVTO' : S2.phase === 'in' ? 'VARNOSTNI AVTO V BOKSE' : 'PONOVNI START';
      if (el.textContent !== txt) el.textContent = txt;
      const cl = on ? 'show' + (S2.warn ? ' warn' : '') : '';
      if (el.className !== cl) el.className = cl;
    }
  }
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
    const nCP = track.cpS.length, R0 = rec(track.def.id);
    setText('h-lap', P.finished ? 'CILJ' : 'CP ' + P.cp + '/' + nCP);
    // altitude of the road under the car (not the body, as in the splits table), between start and summit; frozen at the summit after the finish.
    // A stage without altitudes (a rally stage): the distance still to go to the finish, to the nearest 0.1 km (at least 0.1 until the line)
    const al = track.def.alt, alt = track.altAt(P.finished ? track.hy[track.finishIdx] : P.roadY || 0);
    setText('h-alt', alt != null ? numDot(al ? clamp(alt, al[0], al[1]) : alt) + ' m' : P.finished ? '' : 'še ' + kmTxt(Math.max(100, Math.round(clamp(track.raceLen - Math.max(0, P.dist), 0, track.raceLen) / 100) * 100), 1) + ' km');
    const cur = P.finished ? P.finishTime : phase === 'racing' ? race.time : 0;
    setText('h-time', fmt(cur, true));
    setText('h-bestv', fmt(R0.bestTime || NaN, true));   // personal best (a new one shows as soon as the run ends)
    if (cpSeen < P.cpEv) {   // new checkpoint (if the HUD fell behind, only the latest; none after the finish, the finish popup has the word)
      cpSeen = P.cpEv;
      const k = P.cp, t = P.splits[k - 1]; if (P.finished || !(k >= 1) || !(t >= 0)) return;
      const pb = Array.isArray(R0.bestSplits) ? R0.bestSplits[k - 1] : NaN, d = t - pb, has = isFinite(d);
      const el = $('h-split'); el.textContent = 'CP' + k + '  ' + fmt(t, true) + (has ? '  ' + sgn(d) : ''); el.className = 'show ' + (has ? dCls(d) : 'even'); splitT = 3.5; cornerShow = false;   // (a place name waits until the split clears)
      showMsg('CP' + k + (has ? ' ' + sgn(d) : ''), has ? (d < 0 ? 'fast' : 'warn') : 'gold', 1.5);
      Sfx.beep(has && d < 0 ? 990 : 740, 0.12, 0.12);
      if (!has) Comm.say(ttLine(track.def, 'cpFirst'), { cp: k, time: spkTime(t) }, 2);
      else Comm.say(Math.abs(d) < 0.005 ? 'cpEven' : d < 0 ? 'cpFast' : 'cpSlow', { cp: k, delta: spkDelta(d) }, 3);
    }
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
    if (L[k].hud) { const el = $('h-split'); el.textContent = L[k].n.toUpperCase(); el.className = 'show even'; splitT = 2.6; cornerShow = true; }   // (hud false: only said)
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
    cdN = race.timeTrial && isRally(track.def) && +S.codrv ? track.paceNotes() : null; cdK = 0; cdLog = [];
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
    else {
      setText('h-pos', String(P.pos || race.cars.length));
      const lapShown = clamp(P.lap, 1, race.laps);
      setText('h-lap', 'KROG ' + lapShown + '/' + race.laps + (track.len > 8000 ? ' · ' + kmTxt(clamp(P.finished ? track.len : P.dist - (lapShown - 1) * track.len, 0, track.len), 1) + '/' + kmTxt(track.len, 1) + ' KM' : ''));   // a long lap: how far round it
      const cur = phase === 'racing' ? race.time - P.lapStart : phase === 'finish' || phase === 'done' ? (P.lapTimes[P.lapTimes.length - 1] || 0) : 0;
      setText('h-time', fmt(cur, true));
      const best = P.lapTimes.length ? Math.min(...P.lapTimes) : NaN;
      setText('h-bestv', fmt(best, true));
    }
    updateDamageHUD(P);
    if (race.tyresOn) updateRaceNews(P);
    if (race.drsLast) { const st = P.drs ? 'open' : P.drsA ? 'arm' : ''; if ($('h-drs').className !== st) $('h-drs').className = st; }
    if (P.drsEv) { P.drsEv = null; if (phase === 'racing') { Sfx.beep(1320, 0.07, 0.08); if (drsN++ % 2 === 0) Comm.say('drs', null, 1); } }   // the flap opens (the commentator: every other time)
    if (P.secEv) {   // a TV sector done: its bar under the clock turns purple / green / yellow, its time shows (not the third's: the lap time does)
      const [k, t, col] = P.secEv, bars = $('h-sec').children; P.secEv = null;
      if (k === 0) { bars[1].className = ''; bars[2].className = ''; }
      bars[k].className = col;
      if (k < 2 && !P.finished) { const el = $('h-split'); el.textContent = 'SEKTOR ' + (k + 1) + '  ' + (t >= 60 ? fmt(t) : t.toFixed(3)); el.className = 'show s' + col; splitT = 2.6; cornerShow = false; }
      if (col === 'p' && phase === 'racing') { Sfx.beep(1175, 0.06, 0.07); if (secN++ % 3 === 0) Comm.say('secPurple', { n: k + 1 }, 1); }   // (the commentator: now and then)
    }
    setText('h-speed', String(Math.round(P.speed * 3.6)));
    setText('h-gear', P.gear === -1 ? 'R' : String(P.gear));
    drawSpeedo(P);
    drawMinimap();
    updateNote(P);
    // lap events (a time trial has its own checkpoint / finish popups)
    if (!race.timeTrial && P.lapTimes.length > lastLapCount) {
      lastLapCount = P.lapTimes.length;
      const t = P.lapTimes[lastLapCount - 1];
      const isBest = t <= Math.min(...P.lapTimes) + 1e-6 && lastLapCount > 1;
      const el = $('h-split'); el.textContent = 'KROG ' + lastLapCount + ': ' + fmt(t, true) + (isBest ? '  NAJHITREJŠI' : ''); el.className = 'show'; splitT = 3.2; cornerShow = false;
      if (!P.finished && P.lap === race.laps) { showMsg('ZADNJI KROG!', 'gold', 2); Sfx.beep(880, 0.12, 0.12); }
    }
    if (splitT > 0) { splitT -= dt; if (splitT <= 0) $('h-split').className = ''; }
    updateCorner(P);
    updateCodrv(P);
    // wrong way
    if (phase === 'racing') {
      if (P.wrongT > 1.1) { if ($('h-msg').textContent !== 'NAPAČNA SMER!') showMsg('NAPAČNA SMER!', 'warn', 0.5); else msgT = 0.4; }
      const stuck = P.stuckT > 2.5 || P.wrongT > 4;
      $('btn-rescue').classList.toggle('off', !stuck);
    }
    if (P.pitState === 'repair' && P.pitDur > 0) { const pct = Math.min(99, Math.floor(P.pitT / P.pitDur * 100)); const txt = 'POPRAVILO ' + pct + ' %'; if ($('h-msg').textContent !== txt) { $('h-msg').textContent = txt; $('h-msg').className = 'show gold'; } msgT = 0.3; }
    if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('h-msg').className = ''; }
  }

  /* ---------------- commentator (English) ---------------- */
  const PART_EN = { bumperF: 'front bumper', bumperR: 'rear bumper', hood: 'bonnet', trunk: 'boot lid', mirrorL: 'mirror', mirrorR: 'mirror', fenderL: 'front wing', fenderR: 'front wing' };
  const PART_EN_F = { bumperF: 'front wing', bumperR: 'rear wing', hood: 'nose cone', trunk: 'engine cover', mirrorL: 'mirror', mirrorR: 'mirror', fenderL: 'bargeboard', fenderR: 'bargeboard' };   // (the formula's parts)
  const EN_NAME = { monaco: 'Monte Carlo', gozd: 'the Copper Forest',  jezero: 'Jezero Ring', riviera: 'the Riviera', gora: 'the mountain rally stage', pikes: 'Pikes Peak', ouninpohja: 'Ouninpohja', nring: 'the Nürburgring Nordschleife', spa: 'Spa-Francorchamps', toskana: 'Tuscany', grom: 'Thunder Cape', rbring: 'the Red Bull Ring', suzuka: 'Suzuka' };
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
    { const n = Object.keys(P.lost).length; if (n > (cs.lostN || 0)) { const last = Object.keys(P.lost)[n - 1]; cs.lostN = n; if (cool('part', 6)) Comm.say('partLost', { part: (P.m.body === 'formula' ? PART_EN_F : PART_EN)[last] || 'a panel' }, 2); } }
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
    const on = mp && mp.race;
    if (on && (phase === 'intro' || phase === 'lights')) phaseT = (Net.now() - on.at) / 1000 - (phase === 'lights' ? 1.3 : 0);   // online: both phones follow the host's clock
    if (phase === 'intro' && phaseT > introLen) {
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
        showMsg('START!', 'gold', 0.9);
        Comm.say(race.timeTrial ? ttLine(track.def, 'go') : on ? 'goNet' : 'go', null, 4);
        setTimeout(() => { if (phase === 'racing') { $('h-lights').classList.remove('show'); setLights(0, false); } }, 1100);
      }
    } else if (phase === 'racing') {
      if (!race.player.finished) commTick(dt);
      if (race.player.finished) {
        phase = 'finish'; phaseT = 0;
        const pos = race.player.finishPos;
        if (on) {   // online: my time on the shared clock (netMyFinish) goes to the friend; who won shows on the results (the friend may still be on the way)
          const other = on.theirs, won = other == null || on.mine < other;
          showMsg(other == null ? 'CILJ!' : won ? 'ZMAGA!' : 'CILJ! 2. MESTO', 'gold', 4);
          Comm.say(other == null || won ? 'win' : 'finish', { pos: Comm.ordinal(won ? 1 : 2) }, 5);
        } else if (race.timeTrial) {   // time trial: store the run, finish popup with the difference to the previous record
          const r = ttFinish(), d = r.prev ? r.time - r.prev : NaN, el = $('h-split');
          el.textContent = 'CILJ  ' + fmt(r.time, true) + (r.prev ? '  ' + sgn(d) : ''); el.className = 'show ' + (r.prev ? dCls(d) : 'even'); splitT = 5;
          const sp = $('h-ttsp'); sp.innerHTML = '<table><thead><tr><th></th><th>Čas</th><th>Rekord</th><th>\u00b1</th></tr></thead><tbody>' + splitRows(r, false) + '</tbody></table>'; sp.className = 'show';   // the splits under it until the results
          showMsg(r.newPB ? 'NOV REKORD!' : 'CILJ! ' + sgn(d), r.newPB ? 'fast' : 'gold', 4);
          Comm.say(ttLine(track.def, r.newPB ? 'record' : isFinite(d) && Math.abs(d) < 0.005 ? 'even' : 'end'), { time: spkTime(r.time), delta: isFinite(d) ? spkDelta(d) : '', track: EN_NAME[track.def.id] || track.def.name }, 5);
          { const k = medalOf(track.def, r.time); if (k >= 0) Comm.say('medal', { medal: MEDAL_EN[k] }, 3, { ttl: 9000 }); }   // (waits for the finish call)
        } else {
          showMsg(pos === 1 ? 'ZMAGA!' : 'CILJ! ' + pos + '. MESTO', 'gold', 4);
          Comm.say(pos === 1 ? 'win' : pos <= 3 ? 'podium' : 'finish', { pos: Comm.ordinal(pos) }, 5);
        }
        Sfx.beep(660, 0.14, 0.14); setTimeout(() => Sfx.beep(990, 0.3, 0.14), 160);
        $('touch').classList.add('off'); $('btn-rescue').classList.add('off');
        Input.reset();
      }
    } else if (phase === 'finish' && phaseT > 4.2) {
      const pod = Render.world && Render.world.podium;
      if (pod && !on && !race.timeTrial) startPodium(pod); else finishRace();
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
  const netTracks = () => Core.TRACKS.filter(d => !isTT(d));   // circuits (the hill climb and the rally stage are runs for one)
  const modelById = (id) => Core.MODELS.find(m => m.id === id) || Core.MODELS[0];
  const NET_ERR = {
    'peer-unavailable': 'Sobe s to kodo ni. Preveri kodo (prijatelj mora imeti sobo odprto).',
    'browser-incompatible': 'Ta brskalnik ne podpira dirke s prijateljem. Odpri igro v Chromu ali Safariju.',
    timeout: 'Povezava ni uspela. Preveri kodo in internetno povezavo.',
    full: 'V tej sobi že dirkata dva.',
    version: 'Na telefonih sta različni različici igre. Na obeh igro zapri in znova odpri, nato poskusi znova.',
    closed: 'Gostitelj je zaprl sobo.',
    lost: 'Povezava z gostiteljem je prekinjena.',
    busy: 'Trenutno ni mogoče najti prijatelja (vsa čakalna mesta so zasedena ali ne odgovarjajo). Poskusi znova.',
    left: 'Prijatelj je odšel. Za novo dirko znova tapni Počakaj prijatelja.',
  };
  const netErr = (type) => (Object.prototype.hasOwnProperty.call(NET_ERR, type) ? NET_ERR[type] : 'Povezava s strežnikom ni uspela. Preveri internetno povezavo in poskusi znova.');
  const onErr = (t) => { const el = $('on-err'); el.textContent = t; if (t) { try { el.scrollIntoView({ block: 'nearest' }); } catch (_) { } } };   // (on a short screen it may be below the fold)
  const peerOf = (m) => ({ name: cleanName(m.name) || 'Prijatelj', car: String(m.car), color: m.color | 0, num: Core.clamp(m.num | 0, 1, 99) });
  // mp: the room, or null. role 'host' | 'guest'; peer: the friend { name, car, color, num }; peerIn (host): the friend is in
  // the room (not still racing or on the results), so a race can start; track, laps: the host's choice; setup: the race being
  // prepared; race: the race under way { no, at (shared start, ms), hold, goAt, first (who starts on the left), buf (friend's
  // states), sendT, late, mine, theirs (the finish times), left (the friend left before the finish), off (the friend's car is
  // off the track) }; gone (guest): the host is gone; err: the room lost the server during a race (told back in the room)
  let mp = null;
  const dmgOn = () => (mp && mp.race ? mp.race.damage : +S.damage) > 0;   // damage in this race (online: the host's setting)
  // a tap: the iPhone asks for the tilt sensor and allows speech only from a tap (an online race starts from a message)
  function netTap() { if (S.control === 'tilt') enableTilt(true); Comm.unlock(); }

  function leaveRace() {   // the race (or its results) off the screen, the title demo back
    Net.fixClock(false); endPodium();
    paused = false; phase = 'none'; race = null; bg = 'demo'; Comm.stop(); Sfx.setRunning(false); Sfx.silence();
    Render.attachRace(demo); Render.resetCam(); setLights(0, false);
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
  function netStart(role) {   // 'quick' (wait for whoever comes), or a private room: 'host' (with a new code) / 'guest' (with the friend's code)
    const code = role === 'guest' ? Net.normCode($('on-code').value) : '';
    if (role === 'guest' && code.length !== 4) { onErr('Vpiši kodo sobe (4 znaki), ki ti jo je poslal prijatelj.'); return; }
    if (!Net.available()) { onErr(netErr('browser-incompatible')); return; }
    netTap();
    const d = netTracks().find(t => t.id === S.track) || netTracks()[0];
    mp = { role: role === 'quick' ? 'host' : role, quick: role === 'quick', code, peer: null, peerIn: false, track: d.id, laps: d.laps || LAPS, no: 0, setup: null, race: null };
    $('on-pick').classList.add('off'); $('on-room').classList.remove('off'); onErr('');
    if (role === 'quick') Net.quickMatch(gameVer(), onNet); else if (role === 'host') Net.host(onNet); else Net.join(code, onNet);
    buildRoom();
  }
  function netLeave() {   // close the room (the friend is told) and back to the title screen
    Net.close(true); mp = null;
    if (race) toTitle(); else showScreen('title');
  }
  function me() { return { t: 'me', name: S.name || 'Igralec', car: Core.MODELS[S.car].id, color: S.color, num: carNum() }; }
  function onNet(type, m) {
    if (!mp) return;
    if (type === 'code') { mp.code = m; buildRoom(); return; }
    if (type === 'wait') { if (mp.quick) mp.role = Net.role; buildRoom(); return; }
    if (type === 'open') {   // (quick match: whoever was waiting is the host, the one who came is the guest)
      if (mp.quick) mp.role = Net.role;
      // hello until the friend confirms it (the first message can be lost while the other side is still opening)
      const hello = () => { if (mp && !mp.acked && Net.open) { Net.send(Object.assign(me(), { t: 'hello', v: gameVer() })); setTimeout(hello, 700); } };
      mp.acked = false; hello(); buildRoom(); return;
    }
    if (type === 'error') {
      if (race) { mp.err = m; if (screen === 'results') netResults(); return; }   // (a race goes on; back from it the player hears what happened)
      Net.close(); openOnline(); onErr(netErr(m)); return;
    }
    if (type === 'lost') { friendGone(false); return; }
    if (type !== 'msg') return;
    switch (m.t) {
      case 'hello':
        if (m.v !== gameVer()) { Net.send({ t: 'nope', why: 'version' }); Net.close(); openOnline(); onErr(netErr('version')); return; }
        mp.peer = peerOf(m); mp.peerIn = true;
        Net.send({ t: 'hi' });
        if (mp.role === 'host') Net.send({ t: 'lobby', track: mp.track, laps: mp.laps });
        buildRoom(); break;
      case 'hi': mp.acked = true; break;
      case 'me': if (mp.peer) { mp.peer = peerOf(m); buildRoom(); } break;
      case 'lobby': if (mp.role === 'guest' && netTracks().some(d => d.id === m.track)) { mp.track = m.track; mp.laps = Core.clamp(m.laps | 0, 1, 5); buildRoom(); } break;
      case 'nope': Net.close(); openOnline(); onErr(netErr(m.why)); break;
      case 'full': Net.close(); openOnline(); onErr(netErr('full')); break;
      case 'bye': friendGone(true); break;
      case 'setup':   // (only in the room: not while still racing or on the results)
        if (mp.role !== 'guest') break;
        if (screen !== 'online' || race || !netTracks().some(d => d.id === m.track)) Net.send({ t: 'busy', no: m.no }); else netPrepare(m);
        break;
      case 'busy': if (mp.role === 'host' && mp.setup && m.no === mp.setup.no) { mp.setup = null; mp.peerIn = false; buildRoom(); } break;
      case 'cancel': if (mp.role === 'guest' && mp.setup && m.no === mp.setup.no) { mp.setup = null; buildRoom(); } break;
      case 'ready': if (mp.role === 'host' && mp.setup && m.no === mp.setup.no) { mp.setup.guestReady = true; netMaybeGo(); } break;
      case 'go': if (mp.role === 'guest' && mp.setup && m.no === mp.setup.no && Number.isFinite(m.at) && m.at - Net.now() < 10000) netRace(m.at); break;   // (also late, e.g. after the app was in the background: that phone just starts late)
      case 'st':
        if (mp.race && m.no === mp.race.no && !mp.race.off) { const B = mp.race.buf; B.push(m); if (B.length > 40) B.shift(); if (m.ft != null) theirFinish(+m.ft); }
        break;
      case 'out':   // the friend has left the race for the room: its car leaves the track (it would stand there in the way)
        if (mp.race && m.no === mp.race.no) { if (mp.race.theirs == null) mp.race.left = true; hideRemote(); if (screen === 'results') netResults(); }
        if (mp.role === 'host') { mp.peerIn = true; if (screen === 'online') buildRoom(); }
        break;
    }
  }
  // the friend is gone (left, or the connection broke): in a race the race goes on alone, in the room the host waits for someone new
  function friendGone(said) {
    if (!mp) return;
    const R = mp.race, inRace = !!race;
    toast(said ? 'Prijatelj je zapustil ' + (inRace ? 'dirko.' : 'sobo.') : 'Povezava s prijateljem je prekinjena.', 3600);
    mp.peer = null; mp.setup = null;
    if (mp.role === 'guest' || mp.quick) { Net.close(); mp.gone = true; }
    else if (said) { Net.drop(); if (!mp) return; }   // (the room stays open; no second message when the friend's phone then closes the line)
    if (R) { if (R.theirs == null) R.left = true; hideRemote(); if (screen === 'results') netResults(); }
    if (!inRace) { if (mp.role === 'guest' || mp.quick) { const q = mp.quick; openOnline(); onErr(netErr(q ? 'left' : said ? 'closed' : 'lost')); } else buildRoom(); }
  }
  function hideRemote() {   // the friend's car off the track: no more states will move it (last in the order if it has not finished)
    const c = race && race.remote; if (mp && mp.race) mp.race.off = true;
    if (!c || c.x === 1e5) return;
    c.x = c.px = 1e5; c.z = c.pz = 1e5; c.vx = c.vz = c.vy = c.vl = c.w = c.latR = c.spin = 0; c.rpm = c.m.idle; if (!c.finished) c.dist = -1e9;
  }
  function theirFinish(t) {   // the friend's finish time (on the shared clock), as soon as it arrives
    const R = mp.race, c = race && race.remote;
    if (R.theirs != null || !c || !(t > 0)) return;
    R.theirs = t; race.netFinish(c, t);
    if (screen === 'results') netResults();
  }
  function buildRoom() {
    if (!mp) return;
    const host = mp.role === 'host', open = Net.open && mp.peer, busy = !!mp.setup;
    $('on-code-show').textContent = mp.code || '····'; $('on-codebox').classList.toggle('off', !!mp.quick);
    $('on-back').textContent = mp.quick && !open ? 'Prekliči' : 'Nazaj';
    $('on-status').textContent = busy ? 'Nalagam progo …' : mp.quick && !open ? (Net.role === 'guest' ? 'Povezujem se …' : 'Čakam, da se kdo pridruži (prijatelj mora tapniti Počakaj prijatelja) …') : host ? (!mp.code ? 'Ustvarjam sobo …' : !open ? 'Pošlji to kodo prijatelju. Čakam, da se pridruži …' : !mp.peerIn ? 'Čakam, da se prijatelj vrne v sobo …' : 'Prijatelj je v sobi. Izberi progo in začni dirko.')
      : (!open ? 'Povezujem se s sobo ' + mp.code + ' …' : 'Povezan. Gostitelj izbere progo in začne dirko.');
    const M = Core.MODELS[S.car], row = (n, name, car, col, mine) => '<div><span class="dot" style="background:' + hexCss(PLAYER_COLORS[col] || PLAYER_COLORS[0]) + '"></span>' + n + '. ' + esc(name) + (mine ? ' (ti)' : '') + ' · ' + esc(car) + '</div>';
    const mine = row(host ? 1 : 2, S.name || 'Igralec', M.name, S.color, true), theirs = mp.peer ? row(host ? 2 : 1, mp.peer.name, modelById(mp.peer.car).name, mp.peer.color, false) : '<div class="wait">' + (host ? 2 : 1) + '. čakam …</div>';
    $('on-players').innerHTML = host ? mine + theirs : theirs + mine;
    $('on-mycar').textContent = M.name;
    const ts = $('on-track'), ls = $('on-laps');
    if (!ts.options.length) ts.innerHTML = netTracks().map(d => '<option value="' + d.id + '">' + esc(d.name) + '</option>').join('');
    if (!ls.options.length) ls.innerHTML = [1, 2, 3, 4, 5].map(n => '<option value="' + n + '">' + lapWord(n).toLowerCase() + '</option>').join('');
    ts.value = mp.track; ls.value = String(mp.laps); ts.disabled = ls.disabled = !host || busy;
    for (const b of document.querySelectorAll('#on-room [data-act^="net-car-"]')) b.disabled = busy;   // (both phones build the race now)
    $('on-note').textContent = host ? 'Poškodbe in vreme: tvoje nastavitve veljajo za oba.' : 'Poškodbe in vreme: po nastavitvah gostitelja.';
    $('on-go').classList.toggle('off', !host);
    $('on-go').disabled = !open || !mp.peerIn || busy;
  }
  function netCar(d) {   // my car in the room: the friend sees it at once
    if (!mp || mp.setup) return;
    S.car = (S.car + d + Core.MODELS.length) % Core.MODELS.length; save();
    Net.send(me()); buildRoom();
  }
  function netPick() {   // the host changed the track or the laps
    if (!mp || mp.role !== 'host' || mp.setup) return;
    const id = $('on-track').value, d = netTracks().find(t => t.id === id);
    if (d && id !== mp.track) { mp.track = id; mp.laps = d.laps || LAPS; } else mp.laps = Core.clamp(+$('on-laps').value || 1, 1, 5);
    Net.send({ t: 'lobby', track: mp.track, laps: mp.laps }); buildRoom();
  }
  // host: start. Both phones load the track (a phone may not answer meanwhile: no "gone" for a while); when the friend reports
  // ready, the start is set 1.2 s ahead on the host's clock. The one on the left of the front row takes turns
  function netGo() {
    if (!mp || mp.role !== 'host' || !Net.open || !mp.peer || !mp.peerIn || mp.setup) return;
    const no = ++mp.no, s = mp.setup = { no, track: mp.track, laps: mp.laps, phys: physOf(), damage: +S.damage, rain: 0, hold: +(0.5 + Math.random() * 0.9).toFixed(3), first: no % 2 ? 'host' : 'guest', hostReady: false, guestReady: false };
    s.rain = S.weather === 'rain' ? 1 : S.weather === 'random' && Math.random() < (RAIN_P[s.track] || 0.35) ? 1 : 0;   // (the host's weather for both)
    Net.send({ t: 'setup', no, track: s.track, laps: s.laps, phys: s.phys, damage: s.damage, rain: s.rain, hold: s.hold, first: s.first });
    Net.hold(30000); buildRoom();
    ensureTrack(s.track, () => { s.hostReady = true; netMaybeGo(); });
    setTimeout(() => { if (mp && mp.setup === s && !mp.race) { mp.setup = null; Net.send({ t: 'cancel', no }); buildRoom(); toast('Prijatelj se ne odziva. Poskusi znova.', 3600); } }, 45000);
  }
  function netMaybeGo() {
    const s = mp && mp.setup; if (!s || !s.hostReady || !s.guestReady) return;
    const at = Math.round(Net.now() + 1200);
    Net.send({ t: 'go', no: s.no, at }); netRace(at);
  }
  // guest: the host starts. Load the track, then say ready (once the clocks are matched)
  function netPrepare(m) {
    mp.setup = { no: m.no, track: m.track, laps: Core.clamp(m.laps | 0, 1, 5), phys: 'cs', damage: Core.clamp(m.damage | 0, 0, 2), rain: m.rain === 1 ? 1 : 0, hold: Core.clamp(+m.hold || 1, 0.5, 1.4), first: m.first === 'guest' ? 'guest' : 'host' };
    mp.track = m.track; mp.laps = mp.setup.laps;
    Net.hold(30000); buildRoom();
    ensureTrack(m.track, () => {
      let n = 0; const ready = () => { if (!mp || !mp.setup || mp.setup.no !== m.no) return; if (Net.synced) Net.send({ t: 'ready', no: m.no }); else if (++n < 450) setTimeout(ready, 100); };   // (without the host's clock the start would be wrong: rather none, the host gives up after 45 s)
      ready();
    });
  }
  function netRace(at) {
    const s = mp.setup; mp.setup = null; mp.peerIn = false;
    mp.race = { no: s.no, at, hold: s.hold, goAt: at + 1300 + 4000 + s.hold * 1000, laps: s.laps, phys: s.phys, damage: s.damage, rain: s.rain, first: s.first, buf: [], sendT: -1e9, late: null, mine: null, theirs: null, left: false, off: false };
    Net.fixClock(true);   // (the clock as it was at the start, until the race is over. The watchdog keeps its patience from the setup for a while: a phone that was frozen just before the start, e.g. switched away, still joins late)
    newRace();
  }
  // every frame of an online race, after its steps: my car to the friend (20 times a second; with no speed while this phone does
  // not drive it: paused, turned the wrong way), and the friend's car placed from its states
  const r2 = (v) => Math.round((v || 0) * 100) / 100, r3 = (v) => Math.round((v || 0) * 1000) / 1000;
  function netFrame(still) {
    const R = mp.race, P = race.player, now = Net.now(), v = still ? 0 : 1;
    R.frameT = now;
    if (now - R.sendT >= 50) {
      R.sendT = now;
      Net.send({ t: 'st', no: R.no, k: Math.round(now), x: r2(P.x), z: r2(P.z), y: r2(P.y), h: r3(P.h), vx: r2(P.vx * v), vz: r2(P.vz * v), vy: r2(P.vy * v), w: r3(P.w * v), vl: r2(P.vl * v),
        a: r2(P.air), d: r3(P.delta), b: r2(P.inBrk), hb: r2(P.inHand), th: r2(P.inThr * v), g: P.gear | 0, rp: Math.round(still ? P.m.idle : P.rpm), ax: r2(P.axF), ry: r2(P.roadY), gr: r3(P.gradeNow),
        bs: r3(P.bankSl), cb: P.onCurb ? 1 : 0, ws: P.ws.join(''), lr: r2(P.latR * v), be: r3(P.beta), sp: r2(P.spin * v), lk: P.lock && !still ? 1 : 0, sf: r2(P.slipF * v),
        di: r2(P.dist), lp: P.lap | 0, ft: R.mine });
    }
    const c = race.remote, B = R.buf;
    if (!c || R.off || !B.length) return;
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
  function netResults() {
    const R = mp.race, P = race.player, c = race.remote, M = Core.MODELS[S.car];
    phase = 'done'; Sfx.setRunning(false);
    const rows = [{ me: true, name: S.name || 'Igralec', car: M.name, col: S.color, t: R.mine, best: P.lapTimes.length ? Math.min(...P.lapTimes) : NaN },
      { me: false, name: c ? c.name : 'Prijatelj', car: c ? c.m.name : '', col: -1, color: c ? c.color : 0, t: R.theirs, left: R.left && R.theirs == null }];
    rows.sort((a, b) => (a.t == null) - (b.t == null) || a.t - b.t);
    const myPos = rows.findIndex(r => r.me) + 1, waiting = R.theirs == null && !R.left;
    $('res-head').classList.remove('tt'); $('res-tt').classList.add('off'); $('res-table').querySelector('thead').innerHTML = RES_HEAD;
    $('res-pos').textContent = waiting ? '…' : myPos + '.';
    $('res-title').textContent = waiting ? 'Cilj!' : myPos === 1 ? 'Zmaga!' : 'Drugi';
    $('res-sub').textContent = 'Čas dirke ' + fmt(R.mine, true) + '.' + (waiting ? ' Čakam, da prijatelj pripelje v cilj …' : R.left && R.theirs == null ? ' Prijatelj je dirko zapustil.' : ' Razlika ' + fmt(Math.abs(R.theirs - R.mine), true) + '.');
    $('res-table').querySelector('tbody').innerHTML = rows.map((r, i) => '<tr class="' + (r.me ? 'me' : '') + '"><td>' + (r.t == null ? '–' : i + 1) + '</td><td><span class="dot" style="background:' + hexCss(r.me ? PLAYER_COLORS[r.col] : r.color) + '"></span>' + esc(r.name) + (r.me ? ' (ti)' : '') + '</td><td>' + esc(r.car) + '</td><td>' +
      (r.t != null ? fmt(r.t, true) : r.left ? 'odšel' : 'vozi …') + '</td><td>' + (r.me ? fmt(r.best, true) : '') + '</td></tr>').join('');
    const back = $('res-restart'); back.textContent = !mp.err && (mp.role === 'host' || (Net.open && !mp.gone)) ? 'Nazaj v sobo' : 'Dirka s prijateljem'; back.dataset.act = 'net-room';
    showScreen('results');
  }
  // after the race: back to the room (the host picks the next track), or, if the room is gone, to the start of Dirka s prijateljem
  function netRoom() {
    netTap();
    const alive = mp && !mp.err && Net.open && (mp.role === 'host' || !mp.gone);
    if (alive && mp.race) Net.send({ t: 'out', no: mp.race.no });
    leaveRace();
    if (!mp || mp.err || (mp.role === 'guest' && !alive)) { const e = mp && mp.err; mp = null; Net.close(); openOnline(); if (e) onErr(netErr(e)); return; }
    mp.race = null; mp.setup = null; $('on-pick').classList.add('off'); $('on-room').classList.remove('off');
    showScreen('online'); buildRoom();
  }

  /* ---------------- main loop ---------------- */
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now;
    if (!(dt > 0)) dt = 0.001;
    const dtNet = Math.min(dt, 0.25); if (dt > 0.1) dt = 0.1;
    if (bg === 'show') { Render.renderShowroom(dt); if (screen === 'settings') updateTiltLive(); return; }
    if (bg === 'demo') {
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
    if (rp) { rpFrame(dt); return; }   // (the highlights: the race stands still)
    const inp = Input.update(dt);
    if (!paused && screen === 'none' || (!paused && (phase === 'finish' || phase === 'done'))) {
      if (phase !== 'done') updatePhase(dt, inp);
      // alone, a slow device plays in slow motion rather than in big jumps; online, the race keeps up with the clock both
      // phones share (slow frames and hitches up to 0.25 s are caught up), so a slower phone does not lose time
      const on = mp && mp.race, lim = on ? 32 : 10;
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
  function adaptive(dt) {
    if (noAdapt) return;
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
        if (++perf.slow >= 3) { perf.slow = 0; perf.pending = true; perf.slowAvg = avg; toast('Igra na tej napravi teče počasi: od naslednjega premora ali dirke bo brez senc (vklopiš jih v Nastavitvah).', 4200); }
      } else perf.slow = 0;
    }
  }
  // a pause or a race start: carry out what adaptive() decided
  function adaptBreak() {
    if (perf.pending) { perf.pending = false; autoNoShadows = true; perf.check = 2; applyShadows(); }
    else if (perf.restore) { perf.restore = false; perf.keep = true; autoNoShadows = false; applyShadows(); }
  }
  function applyShadows() { Render.applySettings({ quality: S.quality, shadows: shadowsOn(), camera: S.camera }); refreshSegs(); }
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
      case 'to-champ': openChamp(); break;
      case 'champ-go': {
        if (champDone()) { champ = null; champSave(); buildChampScreen(); break; }   // (finished: "Novo prvenstvo" -> the choice of a series)
        if (!champ) { const d = Core.CHAMPS.find(c => c.id === champPick) || Core.CHAMPS[0]; champ = { v: 1, id: d.id, diff: S.difficulty, rounds: [] }; champSave(); }
        if (S.control === 'tilt') enableTilt(true);
        Comm.unlock(); champRun = true; ensureTrack(champDef().tracks[champ.rounds.length], newRace); break;
      }
      case 'champ-quit':   // a second tap within 4 s gives the championship up
        if (Date.now() - champQuitT < 4000) { champ = null; champSave(); champQuitT = 0; buildChampScreen(); toast('Prvenstvo je opuščeno.'); }
        else { champQuitT = Date.now(); if (el) el.textContent = 'Res opustim?'; toast('Tapni še enkrat, če res želiš opustiti prvenstvo.', 3000); }
        break;
      case 'champ-car-prev': S.car = (S.car + Core.MODELS.length - 1) % Core.MODELS.length; save(); buildChampScreen(); break;
      case 'champ-car-next': S.car = (S.car + 1) % Core.MODELS.length; save(); buildChampScreen(); break;
      case 'comm-test': Comm.setSpeech(!!+S.sound); Comm.unlock(); Comm.test(); break;
      case 'start': if (S.control === 'tilt') enableTilt(true); Comm.unlock(); champRun = false; ensureTrack(S.track, newRace); break;
      case 'resume': resume(); break;
      case 'restart': if (race && race.champ && race.player.finished) openChamp(); else newRace(); break;   // (a championship round already driven counts: on to the standings)
      case 'replay': if (race && phase === 'done' && !rp) rpPlay(); break;
      case 'rp-skip': rpNext(); break;
      case 'rp-end': rpEnd(); break;
      case 'calibrate': Input.calibrate(); toast('Sredina nagiba je nastavljena.'); break;
      case 'tilt-invert': S.tiltInvert = S.tiltInvert ? 0 : 1; save(); applySettings(); break;
      case 'fullscreen': goFullscreen(); break;
      case 'install': installApp(); break;
    }
  }
  const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function updateFsButtons() {
    const txt = isFs() ? 'Izhod iz celotnega zaslona' : 'Celoten zaslon';
    document.querySelectorAll('[data-act="fullscreen"]').forEach(b => { b.textContent = txt; });
  }
  function goFullscreen() {
    if (isFs()) { const ex = document.exitFullscreen || document.webkitExitFullscreen; try { if (ex) ex.call(document); } catch (_) { } return; }
    const d = document.documentElement;
    const req = d.requestFullscreen || d.webkitRequestFullscreen;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const na = ios ? 'Na iPhonu: Deli → Dodaj na začetni zaslon. Igra se nato z ikone odpre čez cel zaslon.' : 'Celoten zaslon tukaj ni na voljo. Odpri igro v Chromu ali jo dodaj na začetni zaslon.';
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
  window.addEventListener('appinstalled', () => { installEvt = null; updateAppButtons(); toast('Igra je nameščena: odpreš jo z ikono APEX Racing na začetnem zaslonu.', 4200); });
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
      toast('Nova različica igre: nalagam …', 2000);
      setTimeout(() => { if (screen === 'title') location.reload(); }, 900);
    }).catch(() => { });   // (offline: stay on this version)
  }
  function bindUI() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (b) { e.preventDefault(); onAction(b.dataset.act, b); return; }
      const ub = e.target.closest('[data-upg] [data-lv]');   // upgrade level (before the generic .seg handler)
      if (ub) { Sfx.resume(); Sfx.click(); upgOf(Core.MODELS[S.car].id)[ub.parentElement.dataset.upg] = +ub.dataset.lv; save(); buildUpgScreen(); return; }
      const bt = e.target.closest('[data-board]');
      if (bt) { Sfx.click(); boardId = bt.dataset.board; buildBoardScreen(); return; }
      const sb = e.target.closest('.seg button');
      if (sb) { Sfx.resume(); Sfx.click(); setOption(sb.parentElement.dataset.set, sb.dataset.v); if (screen === 'car') buildCarScreen(); return; }
      const chc = e.target.closest('[data-champ]');
      if (chc) { Sfx.click(); champPick = chc.dataset.champ; buildChampScreen(); return; }
      const tc = e.target.closest('[data-track]');
      if (tc) { Sfx.click(); S.track = tc.dataset.track; save(); buildTrackScreen(); refreshSegs(); return; }
      const cb = e.target.closest('[data-col]');
      if (cb) { Sfx.click(); S.color = +cb.dataset.col; save(); buildCarScreen(); }
    });
    $('tilt-sens').addEventListener('input', (e) => { S.tiltSens = +e.target.value; save(); applySettings(); });
    // player name: typing must not reach the game keys (Space = handbrake/preventDefault, P / Escape = pause)
    for (const nm of [$('set-name'), $('on-name')]) {
      let nmOld = S.name;
      nm.addEventListener('focus', () => { nmOld = S.name; });
      nm.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); if (e.key === 'Escape') { nm.value = S.name = nmOld; save(); } nm.blur(); } });   // Enter keeps, Escape undoes
      nm.addEventListener('keyup', (e) => e.stopPropagation());
      nm.addEventListener('input', () => { S.name = cleanName(nm.value) || DEF.name; save(); });
      nm.addEventListener('change', () => { S.name = cleanName(nm.value) || DEF.name; nm.value = S.name; save(); });
      nm.addEventListener('blur', () => { nm.value = S.name; });
    }
    $('btn-pause').addEventListener('click', (e) => { e.preventDefault(); pause(); });
    $('btn-rescue').addEventListener('click', (e) => { e.preventDefault(); if (race && phase === 'racing') { race.rescue(race.player); race.player.locked = false; $('btn-rescue').classList.add('off'); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); Sfx.suspend(); } else checkUpdate(); });
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
    if (typeof THREE === 'undefined') { $('ld-msg').textContent = 'Knjižnice za 3D grafiko ni bilo mogoče naložiti. Preveri povezavo in osveži stran.'; return; }
    try {
      track = getTrack(S.track);
      Render.init($('gl'));
      Render.buildWorld(track, S.quality === 'retro' ? 0.8 : 1);
      Input.init($('touch'), () => { if (rp) rpEnd(); else if (screen === 'pause') resume(); else if (screen === 'none') pause(); });
      applySettings();
      demo = new Core.Race(track, { numAI: 10, noPlayer: true, difficulty: 2, laps: 9999, seed: 11, phys: physOf(), rain: demoRain() });
      demo.start();
      for (let i = 0; i < 120 * 6; i++) demo.step(STEP);
      Render.attachRace(demo);
      bindUI();
      refreshSegs();
      showScreen('title');
      $('loading').classList.add('off');
      last = performance.now();
      requestAnimationFrame(frame);
      lockOrientation();   // (the installed app: straight away; in a browser tab only once full screen is on)
      // offline play and the newest version when online (sw.js); a service worker needs http(s), not a local file
      if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
      window.__game = { comm: Comm, get ver() { return gameVer(); }, get race() { return race; }, get demo() { return demo; }, get phase() { return phase; }, get screen() { return screen; }, S, onAction, pause, resume,
        get adapt() { return { dyn: Render.getDynScale(), shadowsOn: shadowsOn(), auto: autoNoShadows, pending: perf.pending, restore: perf.restore, keep: perf.keep, check: perf.check }; },
        get net() { return mp ? { role: mp.role, code: mp.code, open: Net.open, synced: Net.synced, peer: mp.peer, track: mp.track, laps: mp.laps, race: mp.race && { at: mp.race.at, goAt: mp.race.goAt, mine: mp.race.mine, theirs: mp.race.theirs, left: mp.race.left, got: mp.race.buf.length, frameT: mp.race.frameT, startT: mp.race.startT } } : null; },
        now: () => Net.now(), set autoDrive(v) { autoDrive = !!v; },
        get replay() { return rp ? { k: rp.k, n: rp.clips.length, t: rp.t, cam: rp.cam, cams: rp.cams.length, ms: rp.ms, clip: rp.clips[rp.k] } : null; }, get rpEvents() { return rpRec ? rpRec.ev.slice() : null; }, rpStep(dt) { if (rp) rpFrame(dt); },
        sim(sec, auto, steer) { const inp = { steer: steer || 0, thr: 1, brk: 0, hand: 0, digital: true }; for (let t = 0; t < sec && race; t += STEP) { if (auto) { Core.aiControl(race.player, race, STEP); inp.steer = race.player.inSteer; inp.thr = race.player.inThr; inp.brk = race.player.inBrk; } if (phase !== 'done') updatePhase(STEP, inp); stepRace(STEP, inp); } } };
    } catch (e) {
      console.error(e);
      $('ld-msg').textContent = 'Napaka pri zagonu: ' + e.message;
    }
  }
  window.addEventListener('load', () => setTimeout(boot, 30));
})();

