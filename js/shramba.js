/* =========================================================================
   SHRAMBA — the saved game kept safe (the progress is never lost to a full storage, the browser asked to keep it, copies of it)
   ---------------------------------------------------------------------------------------------------------------------------
   The game keeps everything in the browser's localStorage (the tdgp- keys: settings, records, stats, career, championship, school,
   ghosts ...), about 5.2 million characters for the page in Chromium. The ghosts are most of it (a lap or a run is up to 600 000
   characters, every track has one per physics, weather and way to drive), and once the storage is full every save after it failed
   without a word: the career, the records and the stats too.
   - keep(key, value): a save that makes room when the storage is full. The ghosts give way, one at a time until the save fits: first the
     Pikes Peak legends (the game makes them again by itself), then friends' ghosts, then the player's own of the other physics, then the
     rest; in each group the largest first. Nothing else is ever dropped; onFreed(n) tells the game how many ghosts went.
   - persist(): asks the browser to keep the page's storage when the phone runs short of space (navigator.storage.persist: Chrome
     answers by itself, Firefox asks the player). Once a visit; persisted() only reads the answer.
   - copies: the progress (the tdgp- keys without the ghosts, the device's own and this module's key) and the missions' records
     (rra-misije), kept in IndexedDB (rra-shramba, store kopije), the newest KEEP_N: one on the first start of a day ('dan', daily), one
     before a profile is brought in ('uvoz') and one before a copy is put back ('obnova'). apply() puts a copy back (the ghosts stay as
     they are). The copies live in the same
     browser as the saved game: they help against a broken build or a mistaken import, not when the phone clears the browser's data
     (the profile file is for that, hence the reminder).
   - the reminder: due(races) tells the results screen to offer the profile as a file (from RACES races on, again AGAIN after the last
     file, LATER after Ne zdaj); exported() and later() note it in the key tdgp-shramba ({ izvoz, odlog }, ms).
   No words of its own (the game writes them, through tr()); in Node (tests/shramba.test.js) use(store) gives it a store to work on.
   ========================================================================= */
const Shramba = (function () {
  'use strict';
  const KEY = 'tdgp-shramba';
  const GHOST = /^tdgp-(pklegend|fghost|ghost)-/;
  const OWN = new Set(['tdgp-noadapt', KEY]);   // (the device's own and this module's: never in a copy, never put back)
  const EXTRA = ['rra-misije'];   // (progress kept outside the tdgp- keys: the missions' records, js/missions.js)
  const DAY = 864e5, KEEP_N = 5, RACES = 5, AGAIN = 30 * DAY, LATER = 7 * DAY;
  const QUOTA = 5242880;   // (localStorage for one page in Chromium: 10 MiB counted in two-byte characters; measured)
  const DB = 'rra-shramba', ST = 'kopije';
  let store = null, asked = null, hooks = { phys: null, onFreed: null, storage: null };
  const state = { persisted: null, freed: 0 };

  const LS = () => { try { return store || (typeof localStorage !== 'undefined' ? localStorage : null); } catch (_) { return null; } };
  const full = (e) => !!e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
  const keys = (L) => { const a = []; try { for (let i = 0; i < L.length; i++) { const k = L.key(i); if (k != null) a.push(k); } } catch (_) { } return a; };
  function freed(n) { state.freed += n; try { if (hooks.onFreed) hooks.onFreed(n); } catch (_) { } }

  // the ghosts in the order they give way (protect: the key being saved, never its own victim)
  function victims(protect) {
    const L = LS(); if (!L) return [];
    let ph = ''; try { ph = hooks.phys ? String(hooks.phys() || '') : ''; } catch (_) { }
    const all = keys(L).filter(k => k !== protect && GHOST.test(k)), size = new Map();
    for (const k of all) { let v = ''; try { v = L.getItem(k) || ''; } catch (_) { } size.set(k, k.length + v.length); }
    const rank = (k) => k.startsWith('tdgp-pklegend-') ? 0 : k.startsWith('tdgp-fghost-') ? 1 : ph && !k.endsWith('@' + ph) ? 2 : 3;
    return all.sort((a, b) => rank(a) - rank(b) || size.get(b) - size.get(a) || (a < b ? -1 : a > b ? 1 : 0));
  }
  // a save that makes room: true when it is kept
  function keep(key, val) {
    const L = LS(); if (!L) return false;
    try { L.setItem(key, val); return true; } catch (e) { if (!full(e)) return false; }
    let n = 0, ok = false;
    for (const k of victims(key)) {
      try { L.removeItem(k); } catch (_) { continue; }
      n++;
      try { L.setItem(key, val); ok = true; break; } catch (e) { if (!full(e)) break; }
    }
    if (n) freed(n);
    return ok;
  }

  // how full the storage is: { used (characters, keys and values), quota, share 0..1 }
  function usage() {
    const L = LS(); let used = 0;
    if (L) for (const k of keys(L)) { let v = ''; try { v = L.getItem(k) || ''; } catch (_) { } used += k.length + v.length; }
    return { used, quota: QUOTA, share: Math.min(1, used / QUOTA) };
  }

  // the browser asked to keep the storage (once a visit); persisted(): only its answer, nothing asked
  const stor = () => { try { return hooks.storage || (typeof navigator !== 'undefined' && navigator.storage ? navigator.storage : null); } catch (_) { return null; } };   // (hooks.storage: the tests' own)
  function persist() {
    if (asked) return asked;
    const s = stor();
    asked = !s || typeof s.persist !== 'function' ? Promise.resolve(false)
      : Promise.resolve().then(() => (typeof s.persisted === 'function' ? s.persisted() : false)).then((p) => (p ? true : s.persist()))
        .then((v) => (state.persisted = !!v), () => false);
    return asked;
  }
  function persisted() {
    const s = stor(); if (!s || typeof s.persisted !== 'function') return Promise.resolve(null);
    return Promise.resolve().then(() => s.persisted()).then((v) => (state.persisted = !!v), () => null);
  }

  // the reminder to save the profile as a file
  function info() { const L = LS(); let o = null; try { o = JSON.parse((L && L.getItem(KEY)) || 'null'); } catch (_) { } return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
  function due(races, now) {
    now = now || Date.now(); const o = info();
    if (!(races >= RACES)) return false;
    if (num(o.odlog) && now < o.odlog) return false;
    return !num(o.izvoz) || now - o.izvoz >= AGAIN;
  }
  const days = (now) => { const o = info(); return num(o.izvoz) ? Math.max(0, Math.floor(((now || Date.now()) - o.izvoz) / DAY)) : null; };   // (days since the last file; null: never)
  function note(o) { keep(KEY, JSON.stringify(o)); }
  function exported(now) { const o = info(); o.izvoz = now || Date.now(); delete o.odlog; note(o); }
  function later(now) { const o = info(); o.odlog = (now || Date.now()) + LATER; note(o); }

  // the progress kept outside the tdgp- keys (the profile file takes it along as extra); a copy's contents (the progress) and the few
  // numbers the list shows of it
  function extras() {
    const L = LS(), extra = {}; if (!L) return extra;
    for (const k of EXTRA) { let v = null; try { v = L.getItem(k); } catch (_) { } if (v != null) extra[k] = v; }
    return extra;
  }
  function collect() {
    const L = LS(), data = {}; if (!L) return { data, extra: {} };
    for (const k of keys(L)) if (/^tdgp-/.test(k) && !GHOST.test(k) && !OWN.has(k)) { try { data[k] = L.getItem(k); } catch (_) { } }
    return { data, extra: extras() };
  }
  function summary(data) {
    const J = (k) => { try { const o = JSON.parse(data[k] || 'null'); return o && typeof o === 'object' ? o : null; } catch (_) { return null; } };
    const st = J('tdgp-stats') || {}, car = J('tdgp-career');
    return { races: num(st.races), tt: num(st.tt), km: Math.round(num(st.km)), money: car && car.on !== false && typeof car.money === 'number' && Number.isFinite(car.money) ? car.money : null };
  }
  const worth = (sum, data) => sum.races > 0 || sum.tt > 0 || !!data['tdgp-career'];   // (a fresh game: no copy)
  // put a copy back: the progress keys as they were in it (the ones it did not have removed), the ghosts and the device's own untouched;
  // false (and the saved game as it was) when it does not fit
  function apply(rec) {
    const L = LS(); if (!L || !rec || typeof rec.data !== 'object') return false;
    const ok = (k) => /^tdgp-/.test(k) && !GHOST.test(k) && !OWN.has(k);
    const back = collect(), put = (o, ex) => { for (const k in o) if (ok(k) && typeof o[k] === 'string' && !keep(k, o[k])) return false;
      for (const k of EXTRA) { const v = ex && typeof ex[k] === 'string' ? ex[k] : null; if (v == null) { try { L.removeItem(k); } catch (_) { } } else if (!keep(k, v)) return false; } return true; };
    for (const k of Object.keys(back.data)) { try { L.removeItem(k); } catch (_) { } }
    if (put(rec.data, rec.extra)) return true;
    for (const k of keys(L)) if (ok(k)) { try { L.removeItem(k); } catch (_) { } }
    put(back.data, back.extra);   // (the saved game as it was)
    return false;
  }

  // the copies in IndexedDB
  function open() {
    return new Promise((res, rej) => {
      if (typeof indexedDB === 'undefined') { rej(new Error('no IndexedDB')); return; }
      let r; try { r = indexedDB.open(DB, 1); } catch (e) { rej(e); return; }
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(ST)) r.result.createObjectStore(ST, { keyPath: 'id' }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
    });
  }
  function req(d, mode, fn) {
    return new Promise((res, rej) => { const t = d.transaction(ST, mode), s = t.objectStore(ST), q = fn(s); let v;
      if (q) q.onsuccess = () => { v = q.result; };
      t.oncomplete = () => res(v); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('abort')); });
  }
  async function all(d) { const a = (await req(d, 'readonly', (s) => s.getAll())) || []; return a.sort((x, y) => y.id - x.id); }
  async function withDb(fn) { const d = await open(); try { return await fn(d); } finally { d.close(); } }
  // a copy now (why: 'dan' | 'uvoz' | 'obnova' | 'roka'); null when there is nothing to keep
  function snap(why) {
    const c = collect(), sum = summary(c.data); if (!worth(sum, c.data)) return Promise.resolve(null);
    let t = Date.now();
    return withDb(async (d) => {
      const have = await all(d); if (have.length && have[0].id >= t) t = have[0].id + 1;   // (two copies in one millisecond: still two)
      const rec = { id: t, t, why: String(why || 'roka'), data: c.data, extra: c.extra, sum };
      await req(d, 'readwrite', (s) => s.put(rec));
      const old = (await all(d)).slice(KEEP_N);
      if (old.length) await req(d, 'readwrite', (s) => { for (const r of old) s.delete(r.id); return null; });
      return { id: rec.id, t: rec.t, why: rec.why, sum: rec.sum };
    });
  }
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  // the day's copy: the first start of a day (before anything is driven); null when today's is there already or nothing to keep
  function daily(now) {
    now = now || Date.now();
    return withDb(all).then((have) => (have.some(r => r.why === 'dan' && sameDay(r.t, now)) ? null : snap('dan')));
  }
  const list = () => withDb(all).then((a) => a.map(r => ({ id: r.id, t: r.t, why: r.why, sum: r.sum || summary(r.data || {}) })));
  const get = (id) => withDb((d) => req(d, 'readonly', (s) => s.get(id)));

  function set(o) { hooks = Object.assign({}, hooks, o || {}); }
  function use(s) { store = s || null; asked = null; state.persisted = null; state.freed = 0; }   // (tests: a store of their own)

  return { KEY, KEEP_N, RACES, AGAIN, LATER, QUOTA, EXTRA, keep, victims, usage, persist, persisted, due, days, info, exported, later, extras, collect, summary, apply, snap, daily, list, get, set, use, state };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Shramba;
