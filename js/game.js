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
  const CAR_DESC = { kaze: 'Rad obrne rep, rojen za drift.', vortex: 'Veliko oprijema, stabilen tudi na robu.', pico: 'Lahek in okreten, rad podvija.', strega: 'Oster in živahen, hitro zavrti.', rally: 'Relijski dirkač iz 80-ih, ogromno moči, rojen za drift.', p206: 'Pravi 3D model, lahek in natančen v ovinkih.' };

  /* ---------------- settings ---------------- */
  const lowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 3);
  const DEF = { phys: 'cs', control: 'buttons', camera: 'chase', zoom: 1.2, assist: 2, difficulty: 1, autoGas: 0, notes: 1, quality: lowEnd ? 'normal' : 'high', shadows: 1, sound: 1, vibrate: 1, tiltSens: 22, tiltInvert: 0, car: 0, color: 0, track: 'jezero', comm: 1, damage: 2, name: 'Igralec' };
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
  if (S.phys !== 'arcade') S.phys = 'cs';   // the 'rally' physics was removed: its players (it was the default) and old saves get cs
  S.name = cleanName(S.name) || DEF.name;
  // upgrades per car: S.upg[modelId] = {motor, gume, zavore, aero} 0..3 (own objects, never shared; old saves have none)
  const UPG_IDS = Core.UPG.map(u => u.id);
  const upgNorm = (o) => { const r = {}; for (const k of UPG_IDS) { const v = o && typeof o[k] === 'number' ? o[k] : 0; r[k] = v >= 0 && v <= 3 ? Math.floor(v) : 0; } return r; };
  { const u = {}; if (S.upg && typeof S.upg === 'object') for (const m of Core.MODELS) if (S.upg[m.id]) u[m.id] = upgNorm(S.upg[m.id]); S.upg = u; }
  // records: plain objects all the way down; circuits keep bestLap, bestRace, bestPos
  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o), posNum = (v) => typeof v === 'number' && isFinite(v) && v > 0;
  if (!isObj(records)) records = {};
  if (!isObj(records.tracks)) { records.tracks = {}; if (records.bestLap) records.tracks.jezero = { bestLap: records.bestLap, bestRace: records.bestRace, bestPos: records.bestPos }; }
  // records are kept per physics: arcade (and the old rally history) under the plain track id, Circuit Superstars under id@cs (it is 3-7 % faster)
  const recKey = (id) => S.phys === 'arcade' ? id : id + '@cs';
  const rec = (id) => { const k = recKey(id); return records.tracks[k] || (records.tracks[k] = {}); };
  // time-trial records: bestTime, bestSplits [cp1..cpN, finish], board = top 10 [{name, car, carId, time, splits, date, upg}] (drop anything malformed, rebuild the rest from known fields)
  const splitsOf = (a) => a.slice(0, 12).map(v => posNum(v) ? v : NaN);
  const boardEntry = (e) => isObj(e) && posNum(e.time) ? { name: cleanName(e.name) || '?', car: typeof e.car === 'string' ? e.car.slice(0, 24) : '', carId: typeof e.carId === 'string' ? e.carId.slice(0, 24) : '',
    time: e.time, splits: Array.isArray(e.splits) ? splitsOf(e.splits) : [], date: posNum(e.date) ? e.date : 0, upg: upgNorm(isObj(e.upg) ? e.upg : null) } : null;
  for (const id in records.tracks) { const r = records.tracks[id]; if (!isObj(r)) { delete records.tracks[id]; continue; }
    for (const k of ['bestLap', 'bestRace', 'bestPos', 'bestTime']) if (r[k] != null && !posNum(r[k])) delete r[k];
    if (r.bestTime && Array.isArray(r.bestSplits)) r.bestSplits = splitsOf(r.bestSplits); else delete r.bestSplits;
    if (r.board != null) r.board = Array.isArray(r.board) ? r.board.map(boardEntry).filter(e => e).sort((a, b) => a.time - b.time).slice(0, 10) : []; }
  // one-time archive of Pikes Peak times driven on the old, narrower road (11 m -> 14 m): kept as 'pikes-ozka', never shown
  try { if (!localStorage.getItem('tdgp-pikes-w7')) { const o = records.tracks.pikes; if (isObj(o) && (o.bestTime || (o.board && o.board.length))) { records.tracks['pikes-ozka'] = o; delete records.tracks.pikes; saveRecords(); } localStorage.setItem('tdgp-pikes-w7', '1'); } } catch (_) { }
  const upgOf = (id) => S.upg[id] || (S.upg[id] = upgNorm(null));
  const upgCount = (id) => UPG_IDS.reduce((a, k) => a + upgOf(id)[k], 0);
  const isTT = (d) => !!(d && d.timeTrial);
  const numDot = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');   // 3048 -> 3.048
  const kmTxt = (m, dec) => (m / 1000).toFixed(dec).replace('.', ',');
  const cpWord = (n) => n + (n === 1 ? ' kontrolna točka' : n === 2 ? ' kontrolni točki' : n <= 4 ? ' kontrolne točke' : ' kontrolnih točk');
  const sgn = (d) => Math.abs(d) < 0.0005 ? '\u00b10.000' : (d < 0 ? '\u2212' : '+') + (Math.abs(d) >= 60 ? fmt(Math.abs(d)) : Math.abs(d).toFixed(3));   // −1.234 / +0.512 / ±0.000 / −3:24.799
  const dCls = (d) => d < -0.0005 ? 'fast' : d > 0.0005 ? 'slow' : 'even';
  const lapWord = (n) => n + (n === 1 ? ' KROG' : n <= 4 ? ' KROGI' : ' KROGOV');
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
  let phase = 'none';         // intro | lights | racing | finish | done
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
  function lockOrientation() {
    try { if (screen.orientation && screen.orientation.lock && (document.fullscreenElement || document.webkitFullscreenElement)) screen.orientation.lock(wantPortrait() ? 'portrait' : 'landscape').catch(() => { }); } catch (_) { }
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
  function showScreen(name) {
    screen = name;
    for (const s of document.querySelectorAll('.screen')) s.classList.toggle('show', s.id === 's-' + name);
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
    $('ctrl-help').textContent = (S.control === 'buttons' && S.phys !== 'arcade' ? CTRL_HELP_CS : CTRL_HELP[S.control]) || '';
    { const d = Core.TRACKS.find(x => x.id === S.track) || Core.TRACKS[0], r = rec(d.id);   // the selected track and its record first (short screens may cut the end of the hint)
      if (isTT(d)) { $('title-hint').textContent = 'Proga: ' + d.name + (r.bestTime ? ' (osebni rekord ' + fmt(r.bestTime, true) + ')' : ' (še brez časa)') + '.'; $('title-sub').textContent = d.name + ' · kronometer · brez nasprotnikov'; }
      else { $('title-hint').textContent = 'Proga: ' + d.name + (r.bestLap ? ' (rekord kroga ' + fmt(r.bestLap, true) + ')' : '') + '.'; $('title-sub').textContent = d.name + ' · ' + lapWord(d.laps || 3).toLowerCase() + ' · 12 nasprotnikov'; } }
    $('title-hint').textContent += ' Upravljanje: ' + CTRL_NAME[S.control] + ', kamera: ' + (S.camera === 'chase' ? 'za avtom (telefon pokončno)' : S.camera === 'kino' ? 'kino (telefon ležeče)' : 'izometrična (telefon ležeče)') + '. Spremeniš v nastavitvah.' + (records.bestLap ? ' Rekord kroga: ' + fmt(records.bestLap, true) + '.' : '');
    { const el = $('set-name'); if (el && document.activeElement !== el) el.value = S.name; }
  }
  function shadowsOn() { return !!S.shadows && !autoNoShadows; }
  function applySettings() {
    Render.applySettings({ quality: S.quality, shadows: shadowsOn(), camera: S.camera });
    Render.cam.userZoom = +S.zoom;
    Comm.setEnabled(!!+S.comm); Comm.setSpeech(!!+S.sound);
    Comm.setOnVoice(v => { const el = $('comm-voice'); if (el) el.textContent = !v.any ? 'Ta brskalnik ne podpira govora – komentatorja ne bo slišati.' : 'Glas: ' + (v.name || 'privzeti angleški') + ' (' + v.lang + ')' + (v.male ? ' – moški' : ' – nižji ton'); });
    Input.setMode(S.control);
    Input.setOptions({ autoGas: !!S.autoGas, tiltSens: S.tiltSens, tiltInvert: !!S.tiltInvert, vibrate: !!S.vibrate });
    Sfx.setEnabled(!!S.sound);
    if (race && race.player) race.player.assist = Core.ASSISTS[S.assist];
    refreshSegs();
  }
  // driving physics: 'cs' (Circuit Superstars kinematic drift, the default) or the old 'arcade' slide model; switching applies at once
  const physOf = () => S.phys === 'arcade' ? 'arcade' : 'cs';
  function applyPhys(r) { if (r) r.setPhys(physOf()); }
  function setOption(key, v) {
    const num = ['zoom', 'assist', 'difficulty', 'autoGas', 'notes', 'shadows', 'sound', 'vibrate', 'comm', 'damage'];
    S[key] = num.includes(key) ? +v : v;
    if (key === 'shadows') { autoNoShadows = false; perf.pending = perf.restore = false; perf.keep = true; }   // the player's own choice wins for the rest of the visit
    save(); applySettings();
    if (key === 'phys') { applyPhys(race); applyPhys(demo); }
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
    if (T.open) {   // checkpoints (yellow ticks) and the finish (chequered square)
      g.strokeStyle = '#ffc629'; g.lineWidth = 2.4 * dpr;
      for (const s of T.cpS) { const i = T.idx(s), x = X(i) * sc + ox, y = Y(i) * sc + oz, nx = rot ? -T.nz[i] : T.nx[i], nz = rot ? T.nx[i] : T.nz[i]; g.beginPath(); g.moveTo(x - nx * 5 * dpr, y - nz * 5 * dpr); g.lineTo(x + nx * 5 * dpr, y + nz * 5 * dpr); g.stroke(); }
      chequer(g, X(T.finishIdx) * sc + ox, Y(T.finishIdx) * sc + oz, 4.5 * dpr);
    }
    const si = T.startIdx; g.fillStyle = '#e63b2e'; g.beginPath(); g.arc(X(si) * sc + ox, Y(si) * sc + oz, 4 * dpr, 0, 6.3); g.fill();
  }
  function chequer(g, x, y, r) {   // small chequered flag square centred on x, y
    g.fillStyle = '#111'; g.fillRect(x - r - 1, y - r - 1, 2 * r + 2, 2 * r + 2); g.fillStyle = '#fff';
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if ((a + b) % 2 === 0) g.fillRect(x - r + a * r * 2 / 3, y - r + b * r * 2 / 3, r * 2 / 3, r * 2 / 3);
  }
  function buildTrackScreen() {
    const list = $('track-list');
    list.innerHTML = Core.TRACKS.map(d => { const T = getTrack(d.id), r = rec(d.id);
      const meta = isTT(d) ? kmTxt(T.raceLen, 1) + ' km' + (d.realKm ? ' (pravih ' + String(d.realKm).replace('.', ',') + ' km)' : '') + (d.alt ? ' · vzpon ' + numDot(d.alt[1] - d.alt[0]) + ' m' : '') + ' · ' + cpWord(T.cpS.length) + ' · kronometer' + (r.bestTime ? ' · rekord ' + fmt(r.bestTime, true) : '')
        : kmTxt(T.len, 2) + ' km · ' + T.corners.length + ' ovinkov · ' + lapWord(d.laps || 3).toLowerCase() + (r.bestLap ? ' · rekord ' + fmt(r.bestLap, true) : '');
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
      demo = new Core.Race(track, { numAI: 10, noPlayer: true, difficulty: 2, laps: 9999, seed: 11, phys: physOf() });
      demo.start(); for (let i = 0; i < 120 * 4; i++) demo.step(STEP);
      demoTarget = null; demoSwitch = 0;   // the title camera picks a car of the new demo right away (not one left over from the previous track)
      mm.img = null; mm.w = 0;
      $('loading').classList.add('off');
      cb();
    }, 40);
  }

  /* ---------------- race lifecycle ---------------- */
  function newRace() {
    const tt = isTT(track.def), M = Core.MODELS[S.car];
    race = new Core.Race(track, {   // time trial: alone on the start line, one run to the finish
      numAI: tt ? 0 : NUM_AI, playerGrid: tt ? 1 : PLAYER_GRID, laps: tt ? 1 : track.def.laps || LAPS, difficulty: S.difficulty, assist: S.assist, damage: +S.damage, phys: physOf(),
      playerModel: M, playerUpg: Object.assign({}, upgOf(M.id)), playerColor: PLAYER_COLORS[S.color], playerNum: carNum(), seed: (Math.random() * 1e6) | 0
    });
    Render.attachRace(race);
    Render.resetCam();
    adaptBreak();
    bg = 'race'; phase = 'intro'; phaseT = 0; lightsOn = 0; lastBeepLight = 0; paused = false; acc = 0;
    lastLapCount = 0; prevGear = 1; prevAir = 0; msgT = 0; splitT = 0; dmgKey = ''; pitHint = false;
    $('h-msg').className = ''; $('h-split').className = ''; $('h-note').className = '';
    $('h-lights').className = ''; setLights(0, false);
    $('h-tot').textContent = '/' + race.cars.length;
    $('hud').classList.toggle('tt', race.timeTrial); $('pause-restart').textContent = race.timeTrial ? 'Ponovi vzpon' : 'Ponovi dirko';
    cpSeen = race.player.cpEv; ttRes = null; cornerSeen = -1; cornerShow = false; placeInit();
    Input.reset();
    showScreen('none');
    Sfx.resume(); Sfx.setRunning(true);
    Comm.stop(); commReset();
    if (race.timeTrial) { Comm.say('introTT', { track: EN_NAME[track.def.id] || track.def.name, cps: track.cpS.length }, 2); showMsg('VZPON NA VRH!', 'gold', 1.2); }
    else {
      Comm.say(race.laps === 1 ? 'introOne' : 'intro', { track: EN_NAME[track.def.id] || track.def.name, laps: race.laps, grid: Comm.ordinal(PLAYER_GRID) }, 2);
      showMsg(lapWord(race.laps), 'gold', 1.2);
    }
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
  function toTitle() {
    paused = false; phase = 'none'; race = null; bg = 'demo'; Comm.stop();
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
    if (newPB) { R0.bestTime = time; R0.bestSplits = splits.slice(); }
    const M = Core.MODELS[S.car], date = Date.now();
    const entry = { name: S.name, car: M.name, carId: M.id, time, splits, date, upg: Object.assign({}, upgOf(M.id)) };
    const board = (Array.isArray(R0.board) ? R0.board : []).concat([entry]).sort((a, b) => a.time - b.time);
    const rank = board.indexOf(entry) + 1;
    R0.board = board.slice(0, 10);
    saveRecords();
    ttRes = { time, splits, prev, prevSplits, newPB, rank, date, entry };
    return ttRes;
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
      ' ' + esc(T.def.name) + ' · ' + esc(Core.MODELS[S.car].name) + ' · ' + (r.rank <= 10 ? r.rank + '. mesto na lestvici.' : 'izven prvih 10.');
    // splits table: CP1..CPn + finish, altitude, time, difference to the previous personal best
    const pts = T.cpS.map((s, k) => ({ lbl: 'CP' + (k + 1), s })).concat([{ lbl: 'CILJ', s: T.finishS }]);
    const rows = pts.map((p, k) => { const t = r.splits[k], pb = r.prevSplits ? r.prevSplits[k] : NaN, dd = t - pb, alt = T.altAt(T.hy[T.idx(p.s)]);
      return '<tr><td>' + p.lbl + '</td><td>' + (alt != null ? numDot(alt) + ' m' : '') + '</td><td>' + fmt(t, true) + '</td><td class="' + (isFinite(dd) ? dCls(dd) : '') + '">' + (isFinite(dd) ? sgn(dd) : '\u2013') + '</td></tr>'; }).join('');
    const tt = $('res-tt'); tt.classList.remove('off');
    tt.innerHTML = '<p class="ltab-h">Vmesni časi</p><table class="ltab"><thead><tr><th>Točka</th><th>Višina</th><th>Čas</th><th>' + '\u00b1 rekord' + '</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="ltab-h">Lestvica · ' + esc(T.def.name) + '</p>';
    $('res-table').querySelector('thead').innerHTML = TT_HEAD;
    $('res-table').querySelector('tbody').innerHTML = boardRows(R0.board || [], r.entry);
    $('res-restart').textContent = 'Ponovi vzpon';
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
      if (!board.length) h = '<p class="board-empty">Na tej progi še ni časov. Odpelji vzpon in postavi prvi rekord!</p>';
      else {
        h = '<p class="ltab-h">Najboljših 10 · ' + esc(d.name) + ' · kronometer</p><table class="ltab b"><thead>' + TT_HEAD + '</thead><tbody>' + boardRows(board, null) + '</tbody></table>';
        if (Array.isArray(r.bestSplits) && r.bestTime) {
          const pts = T.cpS.map((s, k) => ['CP' + (k + 1), s]).concat([['CILJ', T.finishS]]);
          h += '<p class="ltab-h">Osebni rekord ' + fmt(r.bestTime, true) + ' · vmesni časi</p><table class="ltab"><thead><tr><th>Točka</th><th>Višina</th><th>Čas</th></tr></thead><tbody>' +
            pts.map((p, k) => { const alt = T.altAt(T.hy[T.idx(p[1])]); return '<tr><td>' + p[0] + '</td><td>' + (alt != null ? numDot(alt) + ' m' : '') + '</td><td>' + fmt(r.bestSplits[k], true) + '</td></tr>'; }).join('') + '</tbody></table>';
        }
      }
    } else {
      const v = (x) => x ? x : '\u2013';
      h = '<p class="ltab-h">Rekordi · ' + esc(d.name) + ' · ' + lapWord(d.laps || 3).toLowerCase() + '</p><table class="ltab rec"><tbody>' +
        '<tr><td>Najboljši krog</td><td>' + v(r.bestLap && fmt(r.bestLap, true)) + '</td></tr><tr><td>Najboljša dirka</td><td>' + v(r.bestRace && fmt(r.bestRace, true)) + '</td></tr><tr><td>Najboljše mesto</td><td>' + v(r.bestPos && r.bestPos + '.') + '</td></tr></tbody></table>' +
        '<p class="board-empty">Lestvica najboljših časov se vodi za kronometre (' + Core.TRACKS.filter(isTT).map(x => esc(x.name)).join(', ') + ').</p>';
    }
    $('board-body').innerHTML = h; $('board-body').scrollTop = 0;
  }
  function finishRace() {
    phase = 'done';
    Sfx.setRunning(false);
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
    const tb = $('res-table').querySelector('tbody');
    tb.innerHTML = res.map((r, i) => {
      const c = r.car; const b = c.lapTimes.length ? Math.min(...c.lapTimes) : NaN;
      const name = c.isPlayer ? 'Ti' : c.name;
      return '<tr class="' + (c.isPlayer ? 'me' : '') + '"><td>' + (i + 1) + '</td><td><span class="dot" style="background:' + hexCss(c.color) + '"></span>' + name + '</td><td>' + c.m.name + '</td><td>' + (r.est ? '+' + fmt(r.time - res[0].time, true) : fmt(r.time, true)) + '</td><td>' + fmt(b, true) + '</td></tr>';
    }).join('');
    showScreen('results');
  }

  /* ---------------- per-step race logic ---------------- */
  function stepRace(dt, inp) {
    const P = race.player;
    if ((phase === 'finish' || phase === 'done') && race.timeTrial) { P.inThr = 0; P.inBrk = 1; P.inSteer = 0; P.inHand = 0; P.digitalSteer = false; }   // time trial: brake to a stop past the finish (the road ends)
    else if (phase === 'finish' || phase === 'done') { P.pitWant = !!P.inPit; Core.aiControl(P, race, dt); P.digitalSteer = false; }
    else { P.inSteer = inp.steer; P.inThr = inp.thr; P.inBrk = inp.brk; P.inHand = inp.hand; P.digitalSteer = inp.digital; }
    race.step(dt);
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
    if (P.pitEv) { const e = P.pitEv; P.pitEv = null; pitEvent(e); }
    if (track.def.pit && !pitHint && +S.damage > 0 && P.dmg > 0.45 && phase === 'racing') { pitHint = true; toast('Avto je poškodovan: zapelji v bokse (desno takoj za zadnjim ovinkom pred ciljno ravnino), mehaniki ga popravijo.', 4600); }
    if (P.pitState === 'repair' && (!Render.crew || !Render.crew.P || Render.crew.gunOn)) { pitWrenchT -= dt; if (pitWrenchT <= 0) { pitWrenchT = 0.28 + Math.random() * 0.35; Sfx.wrench(); } }   // (with the crew: while the wheel guns rattle)
    if (P.propSnd) { Sfx.knock(P.propSnd, P.propSndV); if (P.propSndV > 9 && (P.propSnd === 'tstack' || P.propSnd === 'bstack' || P.propSnd === 'crate')) vibrate(25); P.propSnd = null; P.propSndV = 0; }   // knocked a cone, tyres or bales
    for (const c of race.cars) { c.hitWall = 0; c.hitCar = 0; c.hitDebris = 0; }
  }

  /* ---------------- pit stops ---------------- */
  let pitWrenchT = 0, pitHint = false;
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
  function updateDamageHUD(P) {
    const el = $('h-dmg'); if (!el) return;
    const on = +S.damage > 0;
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
    // altitude of the road under the car (not the body, as in the splits table), between start and summit; frozen at the summit after the finish
    const al = track.def.alt, alt = track.altAt(P.finished ? track.hy[track.finishIdx] : P.roadY || 0);
    setText('h-alt', alt != null ? numDot(al ? clamp(alt, al[0], al[1]) : alt) + ' m' : '');
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
      if (!has) Comm.say('cpFirst', { cp: k, time: spkTime(t) }, 2);
      else Comm.say(Math.abs(d) < 0.005 ? 'cpEven' : d < 0 ? 'cpFast' : 'cpSlow', { cp: k, delta: spkDelta(d) }, 3);
    }
  }
  // named places (tracks on real places: Ljubljana, Monaco, Pikes Peak, the Nordschleife): the name under the clock ~70 m before each
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
    if (splitT > 0.5 && !cornerShow) return;   // a lap time or CP split is up: the name waits (pending) until it clears
    cornerSeen = key;
    const el = $('h-split'); el.textContent = L[k].n.toUpperCase(); el.className = 'show even'; splitT = 2.6; cornerShow = true;
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
    let item = null;
    if (!r) { item = Comm.say(key, null, 0); if (item) { st.said[k] = { lap, item }; st.lastT = race.time; } else r = 'off'; }
    st.log.push({ k, n: track.names[k].n, lap, t: race.time, r: r || 'say', item }); if (st.log.length > 300) st.log.shift();
  }
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
  const EN_NAME = { monaco: 'Monte Carlo', gozd: 'the Copper Forest',  jezero: 'Jezero Ring', riviera: 'the Riviera', gora: 'the mountain rally stage', pikes: 'Pikes Peak', nring: 'the Nürburgring Nordschleife' };
  const cev = { wall: 0, car: 0 };          // impacts collected per physics step
  let cs = null;
  function commReset() {
    cs = { lastPos: race.timeTrial ? 1 : PLAYER_GRID, posHold: 0, laps: 0, best: Infinity, rec: rec(track.def.id).bestLap || Infinity,
      driftT: 0, offT: 0, pressT: 0, wasAir: false, jumpRoll: false, jumpSaid: false, chatT: 20 + Math.random() * 8, finalSaid: false, cd: {} };
    cev.wall = 0; cev.car = 0;
  }
  const cool = (k, sec) => { const t = race.time; if (cs.cd[k] != null && t - cs.cd[k] < sec) return false; cs.cd[k] = t; return true; };
  function commTick(dt) {
    if (!cs || !race) return;
    const P = race.player, pos = P.pos || cs.lastPos, n = race.laps, ord = race.order || [], tt = race.timeTrial;
    // position changes (must hold for 1 s, so side-by-side battles don't flicker); a time trial has no positions, laps or gaps (its checkpoints are called in updateHUDTT)
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
    if (Math.abs(P.beta || 0) > (P.phys === 'cs' ? 0.62 : 0.5) && P.speed > 14 && !P.air) cs.driftT += dt; else cs.driftT = Math.max(0, cs.driftT - dt * 2);   // (cs hairpins routinely reach 30-35 deg: a higher bar)
    if (cs.driftT > 1.1 && cool('drift', 14)) { Comm.say('drift', null, 1); cs.driftT = 0; }
    // jumps (not every one) and hard landings
    if (P.air && !cs.wasAir) { cs.jumpRoll = Math.random() < 0.6; cs.jumpSaid = false; }
    if (P.air && cs.jumpRoll && !cs.jumpSaid && P.airT > 0.45 && cool('jump', 9)) { cs.jumpSaid = true; Comm.say('jump', null, 1); }
    if (!P.air && cs.wasAir) { if (!cs.jumpSaid && (P.impactVY || 0) < -10 && cool('land', 12)) Comm.say('land', null, 1); cs.jumpSaid = false; }
    cs.wasAir = !!P.air;
    { const n = Object.keys(P.lost).length; if (n > (cs.lostN || 0)) { const last = Object.keys(P.lost)[n - 1]; cs.lostN = n; if (cool('part', 6)) Comm.say('partLost', { part: PART_EN[last] || 'a panel' }, 2); } }
    if (+S.damage > 0 && P.dmg > 0.5 && !cs.dmg1) { cs.dmg1 = true; Comm.say('damage', null, 2); }
    if (+S.damage > 0 && P.dmg > 0.8 && !cs.dmg2) { cs.dmg2 = true; Comm.say('heavyDamage', null, 3); }
    // knocked-over trackside props
    if (P.propKnock) { const k = P.propKnock, key = k === 'cone' ? 'propCone' : k === 'tyre' || k === 'tstack' ? 'propTyre' : k === 'bale' || k === 'bstack' ? 'propBale' : k === 'pylon' ? 'propPylon' : k === 'post' ? 'propPost' : 'propCrate';
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
    if (cs.chatT <= 0) {
      cs.chatT = 32 + Math.random() * 14;
      const v = Math.max(P.speed, 15);
      if (pos === 1 && ord[1]) { const g = (P.dist - ord[1].dist) / v; if (g > 0.6) Comm.say('gapLead', { gap: g.toFixed(1) }, 1); }
      else if (pos > 1 && ord[0]) { const g = (ord[0].dist - P.dist) / v; if (g > 0.4) Comm.say('gapBehind', { gap: g.toFixed(1), pos: Comm.ordinal(pos) }, 1); }
    }
  }

  /* ---------------- phases ---------------- */
  function updatePhase(dt, inp) {
    phaseT += dt;
    if (phase === 'intro' && phaseT > 1.3) {
      phase = 'lights'; phaseT = 0; $('h-lights').classList.add('show');
      holdT = 0.5 + Math.random() * 0.9;
      if (S.control === 'tilt' && Input.tiltAlive()) Input.calibrate();
    } else if (phase === 'lights') {
      const n = Math.min(5, Math.floor(phaseT / 0.8) + 1);
      if (n !== lightsOn) { lightsOn = n; setLights(n, false); Sfx.beep(520, 0.16, 0.14); }
      if (phaseT > 0.8 * 5 + holdT) {
        phase = 'racing'; phaseT = 0; race.start();
        setLights(0, true); Sfx.beep(1040, 0.42, 0.16);
        showMsg('START!', 'gold', 0.9);
        Comm.say(race.timeTrial ? 'goTT' : 'go', null, 4);
        setTimeout(() => { if (phase === 'racing') { $('h-lights').classList.remove('show'); setLights(0, false); } }, 1100);
      }
    } else if (phase === 'racing') {
      if (!race.player.finished) commTick(dt);
      if (race.player.finished) {
        phase = 'finish'; phaseT = 0;
        const pos = race.player.finishPos;
        if (race.timeTrial) {   // time trial: store the run, finish popup with the difference to the previous record
          const r = ttFinish(), d = r.prev ? r.time - r.prev : NaN, el = $('h-split');
          el.textContent = 'CILJ  ' + fmt(r.time, true) + (r.prev ? '  ' + sgn(d) : ''); el.className = 'show ' + (r.prev ? dCls(d) : 'even'); splitT = 5;
          showMsg(r.newPB ? 'NOV REKORD!' : 'CILJ! ' + sgn(d), r.newPB ? 'fast' : 'gold', 4);
          Comm.say(r.newPB ? 'summitRecord' : isFinite(d) && Math.abs(d) < 0.005 ? 'summitEven' : 'summit', { time: spkTime(r.time), delta: isFinite(d) ? spkDelta(d) : '', track: EN_NAME[track.def.id] || track.def.name }, 5);
        } else {
          showMsg(pos === 1 ? 'ZMAGA!' : 'CILJ! ' + pos + '. MESTO', 'gold', 4);
          Comm.say(pos === 1 ? 'win' : pos <= 3 ? 'podium' : 'finish', { pos: Comm.ordinal(pos) }, 5);
        }
        Sfx.beep(660, 0.14, 0.14); setTimeout(() => Sfx.beep(990, 0.3, 0.14), 160);
        $('touch').classList.add('off'); $('btn-rescue').classList.add('off');
        Input.reset();
      }
    } else if (phase === 'finish' && phaseT > 4.2) {
      finishRace();
    }
  }

  /* ---------------- main loop ---------------- */
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now;
    if (!(dt > 0)) dt = 0.001; if (dt > 0.1) dt = 0.1;
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
    // race
    if (orientBlock) { Render.frame(0, 1, race.player, S.camera, { noFx: true }); return; }
    const inp = Input.update(dt);
    if (!paused && screen === 'none' || (!paused && (phase === 'finish' || phase === 'done'))) {
      if (phase !== 'done') updatePhase(dt, inp);
      acc += dt; let n = 0;
      while (acc >= STEP && n < 10) { stepRace(STEP, inp); acc -= STEP; n++; }
      if (n >= 10) acc = 0;
      updateHUD(dt); Comm.update();
      Sfx.update(race, race.player, null, inp.thr);
      Render.frame(dt, acc / STEP, race.player, S.camera, { marker: phase === 'intro' || phase === 'lights' || (phase === 'racing' && race.time < 2.5) });
      adaptive(dt);
    } else {
      Render.frame(0, 1, race.player, S.camera, { noFx: true });
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
      case 'to-title': toTitle(); break;
      case 'to-settings': settingsReturn = screen; showScreen('settings'); refreshSegs(); break;
      case 'settings-done': showScreen(settingsReturn === 'settings' ? 'title' : settingsReturn); if (settingsReturn === 'car') buildCarScreen(); break;
      case 'car-prev': S.car = (S.car + Core.MODELS.length - 1) % Core.MODELS.length; save(); buildCarScreen(); break;
      case 'car-next': S.car = (S.car + 1) % Core.MODELS.length; save(); buildCarScreen(); break;
      case 'to-track': buildTrackScreen(); showScreen('track'); break;
      case 'to-upg': buildUpgScreen(); showScreen('upg'); break;
      case 'upg-done': buildCarScreen(); showScreen('car'); break;
      case 'upg-reset': S.upg[Core.MODELS[S.car].id] = upgNorm(null); save(); buildUpgScreen(); break;
      case 'to-board': boardId = S.track; buildBoardScreen(); showScreen('board'); break;
      case 'comm-test': Comm.setSpeech(!!+S.sound); Comm.unlock(); Comm.test(); break;
      case 'start': if (S.control === 'tilt') enableTilt(true); Comm.unlock(); ensureTrack(S.track, newRace); break;
      case 'resume': resume(); break;
      case 'restart': newRace(); break;
      case 'calibrate': Input.calibrate(); toast('Sredina nagiba je nastavljena.'); break;
      case 'tilt-invert': S.tiltInvert = S.tiltInvert ? 0 : 1; save(); applySettings(); break;
      case 'fullscreen': goFullscreen(); break;
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
    const na = 'Celoten zaslon tukaj ni na voljo. Odpri igro v Chromu ali jo dodaj na začetni zaslon.';
    if (!req || !(document.fullscreenEnabled || document.webkitFullscreenEnabled)) { toast(na, 3600); return; }
    try {
      const p = req.call(d, { navigationUI: 'hide' });
      const lock = () => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock(wantPortrait() ? 'portrait' : 'landscape').catch(() => { }); } catch (_) { } };
      if (p && p.then) p.then(lock).catch(() => toast(na, 3600)); else lock();
    } catch (_) { toast(na, 3600); }
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
      const tc = e.target.closest('[data-track]');
      if (tc) { Sfx.click(); S.track = tc.dataset.track; save(); buildTrackScreen(); refreshSegs(); return; }
      const cb = e.target.closest('[data-col]');
      if (cb) { Sfx.click(); S.color = +cb.dataset.col; save(); buildCarScreen(); }
    });
    $('tilt-sens').addEventListener('input', (e) => { S.tiltSens = +e.target.value; save(); applySettings(); });
    // player name: typing must not reach the game keys (Space = handbrake/preventDefault, P / Escape = pause)
    const nm = $('set-name');
    let nmOld = S.name;
    nm.addEventListener('focus', () => { nmOld = S.name; });
    nm.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); if (e.key === 'Escape') { nm.value = S.name = nmOld; save(); } nm.blur(); } });   // Enter keeps, Escape undoes
    nm.addEventListener('keyup', (e) => e.stopPropagation());
    nm.addEventListener('input', () => { S.name = cleanName(nm.value) || DEF.name; save(); });
    nm.addEventListener('change', () => { S.name = cleanName(nm.value) || DEF.name; nm.value = S.name; save(); });
    nm.addEventListener('blur', () => { nm.value = S.name; });
    $('btn-pause').addEventListener('click', (e) => { e.preventDefault(); pause(); });
    $('btn-rescue').addEventListener('click', (e) => { e.preventDefault(); if (race && phase === 'racing') { race.rescue(race.player); race.player.locked = false; $('btn-rescue').classList.add('off'); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); Sfx.suspend(); } });
    const unlock = () => Sfx.resume();
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('pointerup', unlock, { passive: true });
    window.addEventListener('resize', () => {
      Render.resize(); mm.w = 0; buildMinimap(); sp.w = 0; Input.layout();
      updateOrientation();
    });
    window.addEventListener('orientationchange', () => setTimeout(() => { Render.resize(); mm.w = 0; buildMinimap(); sp.w = 0; Input.layout(); updateOrientation(); }, 250));
    document.addEventListener('fullscreenchange', updateFsButtons);
    document.addEventListener('webkitfullscreenchange', updateFsButtons);
    updateFsButtons();
  }

  /* ---------------- boot ---------------- */
  function boot() {
    if (typeof THREE === 'undefined') { $('ld-msg').textContent = 'Knjižnice za 3D grafiko ni bilo mogoče naložiti. Preveri povezavo in osveži stran.'; return; }
    try {
      track = getTrack(S.track);
      Render.init($('gl'));
      Render.buildWorld(track, S.quality === 'retro' ? 0.8 : 1);
      Input.init($('touch'), () => { if (screen === 'pause') resume(); else if (screen === 'none') pause(); });
      applySettings();
      demo = new Core.Race(track, { numAI: 10, noPlayer: true, difficulty: 2, laps: 9999, seed: 11, phys: physOf() });
      demo.start();
      for (let i = 0; i < 120 * 6; i++) demo.step(STEP);
      Render.attachRace(demo);
      bindUI();
      refreshSegs();
      showScreen('title');
      $('loading').classList.add('off');
      last = performance.now();
      requestAnimationFrame(frame);
      window.__game = { comm: Comm, get race() { return race; }, get phase() { return phase; }, get screen() { return screen; }, S, onAction, pause, resume,
        get adapt() { return { dyn: Render.getDynScale(), shadowsOn: shadowsOn(), auto: autoNoShadows, pending: perf.pending, restore: perf.restore, keep: perf.keep, check: perf.check }; },
        sim(sec, auto, steer) { const inp = { steer: steer || 0, thr: 1, brk: 0, hand: 0, digital: true }; for (let t = 0; t < sec && race; t += STEP) { if (auto) { Core.aiControl(race.player, race, STEP); inp.steer = race.player.inSteer; inp.thr = race.player.inThr; inp.brk = race.player.inBrk; } if (phase !== 'done') updatePhase(STEP, inp); stepRace(STEP, inp); } } };
    } catch (e) {
      console.error(e);
      $('ld-msg').textContent = 'Napaka pri zagonu: ' + e.message;
    }
  }
  window.addEventListener('load', () => setTimeout(boot, 30));
})();

