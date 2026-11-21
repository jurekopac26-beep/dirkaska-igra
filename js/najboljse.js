// Najboljše vožnje (docs/najboljse-voznje.md): the 10 best valid time trial runs of every real track, weather and driving physics, kept as
// recordings (.rrp: js/napake.js's format and packing) in this browser (IndexedDB rra-najboljse, Napake.shramba as Zadnji posnetki). A run is
// valid as tools/voznja.mjs takes a run (its rules and its words: no rescue, no pits, no spin, no driving backwards, no trip off the road of
// 3 s or more, no hit, the weather not changing), so every run kept is one the tool measures. Nastavitve → Najboljše vožnje: the list, and
// Deli 10 najboljših: one file per track (najboljse_<proga>_<LLLLMMDD-UUMM>.rrp, its recordings one after another), which tools/voznja.mjs
// reads for the rivals driving by the players' runs (docs/ai-po-tvoji-liniji.md). Test tracks and tracks being decided keep nothing.
const Najboljse = (function () {
  'use strict';
  const tr = (s, ...a) => (typeof Lang !== 'undefined' && Lang.tr ? Lang.tr(s, ...a) : s.replace(/\{(\d+)\}/g, (m, k) => (a[+k] != null ? String(a[+k]) : '')));
  const MAX = 10, DB = 'rra-najboljse', ST = 'voznje';
  // the rules of a valid run: tools/voznja.mjs RULES (tests/najboljse.test.js compares them)
  const RULES = { spinDeg: 75, spinV: 5, spinT: 0.15, revV: 1, revT: 0.3, offM: 1, offLong: 3, hitA: 50, wetIn: 40, dryIn: 240 };
  const VREME = ['suho', 'mokro', 'suho·zima', 'mokro·zima'], FIZ = ['cs', 'nova'];
  let G = null, sh = null, Q = Promise.resolve(), last = null;   // (last: the check of the last run over the finish, for the tests)
  const done = new WeakSet();   // (the recordings of the races already taken: a race's finish once)
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r2 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 100) / 100);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const nar = (mode, fn) => { if (!sh) sh = Napake.shramba(DB, ST); return sh(mode, fn); };
  const vse = () => nar('readonly', (s) => s.getAll()).then((l) => l || []);
  const brisi = (id) => nar('readwrite', (s) => s.delete(id));
  const red = (a, b) => a.cas - b.cas || a.date - b.date;   // (the faster first; the same time: the earlier)
  const obdrzi = (l, cas) => { const s = l.slice().sort(red); return s.length < MAX || cas < s[MAX - 1].cas; };   // (a run of this time among the list's best)
  const defOf = (id) => (typeof Core !== 'undefined' && Core.TRACKS ? Core.TRACKS.find((d) => d.id === id) : null);
  // a run kept still counts: its track in the game, a real one (not a test track, not one being decided), and the same road (def.recId)
  const velja = (o) => { const d = defOf(o.proga); return !!d && !d.test && !d.pending && (d.recId || d.id) === o.rid; };

  // the weather of a run (tools/voznja.mjs condOf): 'suho' or 'mokro' (+ '·zima' on a winter's road); null while the road gets wet or dries
  function vremeOf(H, t0, t1) {
    const winter = H.season === 'winter', X = H.wxs;
    let rain;
    if (X && X.r0 !== X.r1) {
      const a = X.at, b = X.at + X.dur;
      if (t1 <= a) rain = X.r0;
      else if (t0 >= b + (X.r1 > X.r0 ? RULES.wetIn : (X.r0 - X.r1) * RULES.dryIn)) rain = X.r1;
      else return null;
    } else rain = H.rain > 0 ? H.rain : /^dez/.test(H.wx || '') ? 1 : 0;
    return (rain > 0 ? 'mokro' : 'suho') + (winter ? '·zima' : '');
  }

  // a run checked as tools/voznja.mjs checks a lap of an open road (scanFile: the same samples, the same order of the checks, the same
  // words): { ok, cas, vreme } or { razlog, s, t } (s: metres from the start, t: the race's time of the first fault). T: the race's track
  // (Core.Track), H: the recording's header, F: its samples; wait: a pause now and then (Napake.pocakaj: a race driven goes first)
  async function preveri(T, H, F, wait) {
    const pk = H.cars.findIndex((c) => c.pl);
    if (pk < 0) return { razlog: 'v posnetku ni igralca' };
    if (!(H.w >= 7)) return { razlog: 'posnetek je iz starejše različice igre (' + H.w + ' števil na avto)' };
    const mode = String(H.mode || 'race'), why = /sola/.test(mode) ? 'šola vožnje' : /^police/.test(mode) ? 'policijski pregon' : /^traffic/.test(mode) ? 'vožnja s prometom (promet ni v posnetku)' : '';
    if (why) return { razlog: why };
    if (!T.open) return { razlog: 'krožna proga' };
    const W = H.w, o = 1 + pk * W, NF = F.length, len = T.raceLen, P = H.cars[pk];
    if (!(P.fin && P.ft > 0)) return { razlog: 'vožnja ni končana (v posnetku ' + Math.round(F[NF - 1][0] - F[0][0]) + ' s dirke)' };
    const L = { t0: P.lap > 1 && P.lapStart > 0 && P.lapStart < P.ft ? P.lapStart : 0, t1: P.ft };
    const S = { t: new Float64Array(NF), s: new Float64Array(NF), v: new Float32Array(NF), b: new Uint8Array(NF), spin: new Uint8Array(NF), rev: new Uint8Array(NF), off: new Uint8Array(NF), hit: new Uint8Array(NF) };
    const SP = new Float32Array(NF).fill(-1), q = {};
    let hint = -1, tA = now();
    for (let j = 0; j < NF; j++) {
      if (wait && !(j & 255) && now() - tA > 8) { await wait(); tA = now(); }
      const f = F[j], x = f[o], z = f[o + 2];
      T.query(x, z, hint, q); hint = q.i;
      S.t[j] = f[0]; S.s[j] = q.s - T.startS; S.v[j] = f[o + 4]; S.b[j] = f[o + 6] & 7;
      const h = f[o + 3], dot = Math.cos(h) * q.tx + Math.sin(h) * q.tz, cr = Math.cos(h) * q.tz - Math.sin(h) * q.tx;
      const i = q.a, edge = T.wAt(i) + (T.curb && T.curb[i] ? T.curbW || 1.5 : 0);
      if (Math.abs(q.d) > edge + RULES.offM) S.off[j] = 1;
      if (j > 0) {
        const dt = S.t[j] - S.t[j - 1], g = F[j - 1], dx = x - g[o], dz = z - g[o + 2];
        if (dt > 1e-4) {
          const sp = Math.hypot(dx, dz) / dt, fw = (dx * q.tx + dz * q.tz) / dt;
          const hx = Math.cos(h), hz = Math.sin(h), slip = sp > 1e-3 ? Math.atan2(Math.abs(hx * dz - hz * dx), hx * dx + hz * dz) : 0;
          if (sp > RULES.spinV && Math.atan2(Math.abs(cr), dot) > RULES.spinDeg * Math.PI / 180 && slip > RULES.spinDeg * Math.PI / 180) S.spin[j] = 1;
          if (fw < -RULES.revV) S.rev[j] = 1;
          if (j > 1 && SP[j - 1] >= 0) { const tm = (S.t[j] - S.t[j - 2]) / 2; if (tm > 1e-4 && Math.min(S.v[j - 1] - S.v[j], SP[j - 1] - sp) / tm > RULES.hitA) S.hit[j] = 1; }
          SP[j] = sp;
        }
      }
    }
    const j0 = S.t.findIndex((x) => x >= L.t0 - 0.06);
    let j1 = NF - 1; while (j1 > 0 && S.t[j1] > L.t1 + 0.06) j1--;
    if (j0 < 0 || S.t[j0] > L.t0 + 0.25 || S.t[j1] < L.t1 - 0.25 || j1 - j0 < 20) return { razlog: 'nepopoln krog (posnetek ga nima celega)' };
    const vreme = vremeOf(H, L.t0, L.t1);
    if (!vreme) return { razlog: 'vreme se spreminja' };
    const idx = []; for (let j = Math.max(0, j0 - 1); j <= Math.min(NF - 1, j1 + 1); j++) idx.push(j);
    const inLap = (m) => S.t[idx[m]] >= L.t0 - 1e-6 && S.t[idx[m]] <= L.t1 + 1e-6;
    const runOf = (a, T0) => { let r = 0, tB = 0; for (let m = 1; m < idx.length; m++) { if (!inLap(m)) continue; if (a[idx[m]]) { if (!r) tB = S.t[idx[m - 1]]; r = 1; if (S.t[idx[m]] - tB >= T0) return m; } else r = 0; } return -1; };
    const faults = [
      ['vrnjen na cesto', (() => { for (let m = 0; m < idx.length; m++) if (inLap(m) && (S.b[idx[m]] & 2)) return m; return -1; })()],
      ['boksi', (() => { for (let m = 0; m < idx.length; m++) if (inLap(m) && (S.b[idx[m]] & 4) && S.t[idx[m]] < L.t1 - 0.1) return m; return -1; })()],
      ['vrtenje', runOf(S.spin, RULES.spinT)],
      ['vožnja nazaj', runOf(S.rev, RULES.revT)],
      ['zlet s ceste', runOf(S.off, RULES.offLong)],
      ['trk', (() => { for (let m = 1; m < idx.length; m++) if (inLap(m) && S.hit[idx[m]]) return m; return -1; })()]
    ].filter((f) => f[1] >= 0).sort((a, b) => a[1] - b[1]);
    if (faults.length) { const m = faults[0][1]; return { razlog: faults[0][0], s: Math.round(clamp(S.s[idx[m]], 0, len)), t: r2(S.t[idx[m]]) }; }
    return { ok: 1, cas: P.ft, vreme };
  }

  // over the finish (js/game.js: Napake.cilj; and on leaving the race, Napake.pusti: once per race): a time trial driven alone over the
  // finish (G.tt) on a real track; its recording taken now, checked and kept in turn (the work waits while a race is driven)
  function cilj() {
    try {
      if (!G || typeof Napake === 'undefined' || !G.tt()) return;
      const rec = G.rec(); if (!rec || done.has(rec)) return;
      const T = G.track(), def = T && T.def; if (!def || def.test || def.pending) return;
      const r = G.rrp(); if (!r) return;   // (js/game.js rrpOf: null under 40 samples)
      done.add(rec);
      const H = Object.assign({}, r.H, { date: Date.now(), phys: G.phys() }), F = r.frames.slice();
      for (const k of ['dev', 'devIme', 'dn', 'file']) delete H[k];   // (no device and no log in a file to share; js/game.js rrpOf has none)
      Q = Q.then(() => shrani(T, def, H, F)).catch(() => { });
    } catch (_) { }
  }
  async function shrani(T, def, H, F) {
    await Napake.pocakaj();
    const v = last = await preveri(T, H, F, Napake.pocakaj); if (!v.ok) return null;
    const rid = def.recId || def.id, fiz = H.phys === 'nova' ? 'nova' : 'cs';
    const ista = (x) => x.proga === def.id && x.rid === rid && x.vreme === v.vreme && x.fiz === fiz;
    if (!obdrzi((await vse()).filter(ista), v.cas)) return null;
    const raw = await Napake.rrp.packKos(H, F); await Napake.pocakaj();
    const z = typeof CompressionStream === 'function' ? await Napake.rrp.gzip(raw) : raw, P = H.cars.find((c) => c.pl), m = P ? P.m : '';
    const o = { id: 'nv-' + H.date + '-' + Math.random().toString(36).slice(2, 7), proga: def.id, rid, vreme: v.vreme, fiz, cas: v.cas, date: H.date, m,
      avto: (G.carName && G.carName(m)) || String(m), bytes: z.length, blob: new Blob([z], { type: 'application/octet-stream' }) };
    try { await nar('readwrite', (s) => s.put(o)); } catch (_) { return null; }   // (the disk full: the run is not kept)
    const all = await vse();   // (the list's 11th out; the runs of an older road of this track, def.recId changed, too)
    for (const x of all.filter((x) => x.proga === def.id && x.rid !== rid).concat(all.filter(ista).sort(red).slice(MAX))) await brisi(x.id);
    osvezi();
    return o;
  }

  /* ---------------- Nastavitve → Najboljše vožnje: the list (per track, per weather and physics, the best first) and its files ---------------- */
  const skup = (o) => VREME.indexOf(o.vreme) * 2 + FIZ.indexOf(o.fiz);
  const oznaka = (o) => (/^mokro/.test(o.vreme) ? tr('Mokro') : tr('Suho')) + (/zima/.test(o.vreme) ? ' · ' + tr('Zima') : '') + ' · ' + tr('Fizika vožnje') + ': ' + (o.fiz === 'nova' ? tr('Nova') : tr('Klasična'));
  const vel = (n) => (n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (typeof Lang !== 'undefined' ? Lang.dec((n / 1048576).toFixed(1)) : (n / 1048576).toFixed(1)) + ' MB');
  const datum = (t) => { try { return new Date(t).toLocaleDateString(typeof Lang !== 'undefined' ? Lang.locale : undefined); } catch (_) { return ''; } };
  // a track's runs of the file and the list: its groups in turn (dry, wet, dry in winter, wet in winter; the classic physics first), the best
  // MAX of each, the best first
  function izbor(l, proga) {
    const n = {};
    return l.filter((o) => o.proga === proga && velja(o) && skup(o) >= 0).sort((a, b) => skup(a) - skup(b) || red(a, b))
      .filter((o) => (n[skup(o)] = (n[skup(o)] || 0) + 1) <= MAX);
  }
  const box = () => (typeof document !== 'undefined' ? document.getElementById('nv-list') : null);
  async function prikazi() {
    const el = box(); if (!el || !G) return;
    let l;
    try { l = await vse(); } catch (_) { el.innerHTML = '<div class="set-note">' + esc(tr('Najboljše vožnje v tem brskalniku niso na voljo.')) + '</div>'; return; }
    const ids = (typeof Core !== 'undefined' && Core.TRACKS ? Core.TRACKS.map((d) => d.id) : []).filter((id) => izbor(l, id).length);
    if (!ids.length) { el.innerHTML = '<div class="set-note">' + esc(tr('Še ni nobene veljavne vožnje na čas.')) + '</div>'; return; }
    let h = '';
    for (const id of ids) {
      h += '<div class="set-sub">' + esc(G.ime(id)) + '</div>';
      let g = -1, k = 0;
      for (const o of izbor(l, id)) {
        if (skup(o) !== g) { g = skup(o); k = 0; h += '<div class="set-note">' + esc(oznaka(o)) + '</div>'; }
        const avto = (G.carName && G.carName(o.m)) || o.avto || '';
        h += '<div class="row nv-row"><span class="rlbl">' + (++k) + '. ' + esc(G.cas(o.cas)) + (avto ? ' · ' + esc(avto) : '') + ' · ' + esc(datum(o.date)) + '</span></div>';
      }
      h += '<div class="row nv-row"><span class="rlbl"></span><button class="btn mini" data-nv-deli="' + esc(id) + '">' + esc(tr('Deli 10 najboljših')) + '</button></div>';
    }
    el.innerHTML = h;
  }
  function osvezi() { const d = typeof document !== 'undefined' ? document.getElementById('set-najboljse') : null; if (d && d.open) prikazi().catch(() => { }); }
  // Deli 10 najboljših: the track's runs (each group's best MAX) in one file, one recording after another, gzipped as a recording is; the
  // phone's share sheet where it takes the file, else the downloads (as Zadnji posnetki's Shrani datoteko)
  async function deli(proga) {
    let f = null;
    try {
      const l = izbor(await vse(), proga); if (!l.length) return null;
      const kosi = [];
      for (const o of l) {
        let u = new Uint8Array(await o.blob.arrayBuffer());
        if (u[0] === 0x1f && u[1] === 0x8b) u = await Napake.rrp.gzip(u, true);
        kosi.push(u);
      }
      const raw = new Uint8Array(kosi.reduce((s, u) => s + u.length, 0));
      let at = 0; for (const u of kosi) { raw.set(u, at); at += u.length; }
      const z = typeof CompressionStream === 'function' ? await Napake.rrp.gzip(raw) : raw;
      f = { name: 'najboljse_' + proga + '_' + Napake.rrp.stamp(new Date()) + '.rrp', blob: new Blob([z], { type: 'application/octet-stream' }), n: l.length, raw: raw.length };
    } catch (_) { if (G) G.toast(tr('Datoteke ni bilo mogoče narediti.'), 3000); return null; }
    if (typeof window !== 'undefined' && window.__game) window.__game.lastNajboljse = { name: f.name, bytes: f.blob.size, n: f.n, raw: f.raw };   // (the tests)
    const file = typeof File === 'function' ? new File([f.blob], f.name, { type: 'application/octet-stream' }) : null;
    if (Napake.coarse() && Napake.canShare([file])) {
      try { await navigator.share({ files: [file], title: tr('Najboljše vožnje') + ' · ' + G.ime(proga) }); return f; }
      catch (e) { if (e && e.name === 'AbortError') return f; }
    }
    Napake.prenesi(f.blob, f.name);
    G.toast(tr('Datoteka je v Prenosih: {0} ({1})', f.name, vel(f.blob.size)), 4600);
    return f;
  }
  // G: js/game.js NV_HOOKS (rrp, rec, track, tt, phys, carName, ime, cas, toast)
  function init(h) {
    G = h;
    const d = typeof document !== 'undefined' ? document.getElementById('set-najboljse') : null;
    if (d && !d.dataset.on) { d.dataset.on = '1'; d.addEventListener('toggle', () => { if (d.open) prikazi().catch(() => { }); }); }
    const el = box();
    if (el && !el.dataset.on) {
      el.dataset.on = '1';
      el.addEventListener('click', (e) => { const b = e.target && e.target.closest ? e.target.closest('[data-nv-deli]') : null; if (b) deli(b.dataset.nvDeli); });
    }
  }
  return { init, cilj, pusti: cilj, preveri, vremeOf, obdrzi, izbor, RULES, MAX, vse, deli, prikazi, cakaj: () => Q, test: { put: (o) => nar('readwrite', (s) => s.put(o)), zadnja: () => last } };
})();
