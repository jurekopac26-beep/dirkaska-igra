/* =========================================================================
   SVET — the world leaderboard, the game's side (Svetovna lestvica, docs/svetovna-lestvica.md, »V igri«): a new best time trial sent to the
   server (streznik/svetovna-lestvica, the envelope and the routes in its README.md) and the world's tables read back. No words and no page of
   its own: the game writes them (js/game.js, "the world leaderboard") and the menu shows them through the game's bridge (js/menu.js); in Node
   (tests/svet.test.js) config({ store, fetch, now, lestvica }) gives it a store, a server and a clock of its own.
   - Nothing here waits in a race: a run goes into a queue (tdgp-sl-vrsta, the best of each record key, at most 20) and the queue is sent when
     the menu opens, the device comes online and after each run; a failed send waits 1 min, doubling to 1 h (429: as long as the server says).
   - The player is the friends' leaderboard's key (js/lestvica.js, me): each request is signed with it (ECDSA P-256, SHA-256) in the envelope
     <packet JSON>\n<signature>\n<the rest> (a run: the record gzipped, then the ghost's JSON). The world's tables are kept (tdgp-sl-cache, at most
     200 KB) and shown with their time when the server cannot be reached. Every request gives up after 5 s.
   - Nothing is sent before the player joins (state.on true, the join dialog's consent) and has a nickname; the server address (CFG.url) is set
     once the server is up: without it the world leaderboard is not available and the game shows nothing of it.
   ========================================================================= */
const Svet = (function () {
  'use strict';
  const STATE = 'tdgp-sl', QUEUE = 'tdgp-sl-vrsta', CACHE = 'tdgp-sl-cache';
  const APP = 'apex-racing', V = 1, MAX_Q = 20, Q_BYTES = 1.5e6, C_BYTES = 2e5, TIMEOUT = 5000, WAIT0 = 60e3, WAIT1 = 36e5;
  const KEY_RE = /^[a-z0-9][a-z0-9-]{0,47}@[a-z]{1,8}$/, ID_RE = /^[\w-]{12}$/;
  // the server's address (https://…, no slash at the end): empty till the server is up (docs/svetovna-lestvica.md, »Stanje«)
  const CFG = { url: '' };
  const TE = new TextEncoder();
  let cfg = { store: null, fetch: null, now: null, lestvica: null, gzip: null, on: null, timeout: 0 };
  let mem = null, busy = null;   // (the queue as it is, also what did not fit the store; the send going on)

  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const now = () => (cfg.now ? cfg.now() : Date.now());
  const L = () => cfg.lestvica || (typeof Lestvica !== 'undefined' ? Lestvica : null);
  const subtle = () => (typeof crypto !== 'undefined' && crypto.subtle) || null;
  const F = () => cfg.fetch || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  function ls() { if (cfg.store) return cfg.store; try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (_) { return null; } }
  function get(k, d) { try { const v = JSON.parse(ls().getItem(k)); return v == null ? d : v; } catch (_) { return d; } }
  function put(k, v) { try { ls().setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } }
  function del(k) { try { ls().removeItem(k); } catch (_) { } }
  const tell = (what, x) => { try { if (cfg.on) cfg.on(what, x); } catch (_) { } };

  function b64u(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { try { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; } catch (_) { return null; } }
  const sha = async (u8) => b64u(new Uint8Array(await subtle().digest('SHA-256', u8)));
  function cat(parts) { let n = 0; for (const p of parts) n += p.length; const u = new Uint8Array(n); let o = 0; for (const p of parts) { u.set(p, o); o += p.length; } return u; }
  async function gzip(str) {
    if (cfg.gzip) return cfg.gzip(str);
    if (typeof CompressionStream === 'undefined') return null;
    const s = new Blob([TE.encode(str)]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }

  /* ---------------- the player ---------------- */
  // { on: null (not asked yet) | true (joined) | false (said no or left), ime (the nickname the server has), id, skrit (hidden by the server),
  // ban (banned: nothing sent any more), sent: { key: [ms, st, at] the runs the server took, waiting for the check }, err (the last error's code) }
  function state() {
    const o = get(STATE, null), S = { v: 1, on: null, ime: '', id: '', skrit: false, ban: false, sent: {}, err: '' };
    if (!isObj(o) || o.v !== 1) return S;
    if (o.on === true || o.on === false) S.on = o.on;
    if (typeof o.ime === 'string') S.ime = o.ime.slice(0, 16);
    if (typeof o.id === 'string' && ID_RE.test(o.id)) S.id = o.id;
    S.skrit = o.skrit === true; S.ban = o.ban === true; if (typeof o.err === 'string') S.err = o.err.slice(0, 24);
    if (isObj(o.sent)) for (const k of Object.keys(o.sent).slice(0, 400)) { const e = o.sent[k]; if (KEY_RE.test(k) && Array.isArray(e) && Number.isInteger(e[0])) S.sent[k] = [e[0], Number.isInteger(e[1]) ? e[1] : 0, +e[2] || 0]; }
    return S;
  }
  const save = (S) => put(STATE, S);
  function set(f) { const S = state(); f(S); save(S); tell('state', S); return S; }
  const avail = () => !!(CFG.url && F() && subtle() && L() && L().can());   // (the world leaderboard there at all: the server's address, fetch, WebCrypto)
  const on = () => avail() && state().on === true && !state().ban;

  /* ---------------- the requests ---------------- */
  function Err(st, code, j) { const e = new Error('svet: ' + st + ' ' + code); e.st = st; e.code = code; e.j = j || null; return e; }
  async function call(method, path, body) {
    if (!CFG.url || !F()) throw Err(0, 'ni-streznika');
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null, tm = ac ? setTimeout(() => ac.abort(), cfg.timeout || TIMEOUT) : 0;
    let r;
    try { r = await F()(CFG.url + path, { method, body: body || undefined, signal: ac ? ac.signal : undefined, cache: 'no-store' }); }   // (no Content-Type: no preflight)
    catch (_) { throw Err(0, 'mreza'); } finally { if (tm) clearTimeout(tm); }
    let j = null; try { j = await r.json(); } catch (_) { }
    if (!r.ok || !isObj(j) || j.ok === false) {
      const e = Err(r.status, (isObj(j) && typeof j.napaka === 'string' && j.napaka) || 'http', j);
      e.retry = (isObj(j) && +j.cez) || +(r.headers && r.headers.get && r.headers.get('retry-after')) || 0;
      throw e;
    }
    return j;
  }
  // a signed request: the packet (with the fields), its signature, the rest (a run's record and ghost)
  async function envelope(req, fields, rest) {
    const me = L() && await L().me(true); if (!me) throw Err(0, 'kljuc');
    const p = Object.assign({ app: APP, kind: 'world', v: V, req, pub: me.pub, sent: Math.floor(now() / 1000) }, fields || {});
    const pb = TE.encode(JSON.stringify(p));
    const sig = b64u(new Uint8Array(await subtle().sign({ name: 'ECDSA', hash: 'SHA-256' }, me.key, pb)));
    return cat([pb, [10], TE.encode(sig), [10], rest || new Uint8Array(0)].map(x => x instanceof Uint8Array ? x : new Uint8Array(x)));
  }
  const post = async (req, fields, rest) => call('POST', '/v1/' + req, await envelope(req, fields, rest));
  const q = (o) => Object.keys(o).map(k => k + '=' + encodeURIComponent(o[k])).join('&');

  /* ---------------- the queue ---------------- */
  // an entry: { k (the record key), t (ms), f (the run's fields), v (the record gzipped, base64), d (the ghost's JSON), n (sends failed), at (not
  // before), why ('ime': the server wants a nickname first) }
  function okEntry(e) { return isObj(e) && KEY_RE.test(e.k) && Number.isInteger(e.t) && e.t > 0 && isObj(e.f) && typeof e.v === 'string' && typeof e.d === 'string'; }
  function queue() {
    if (mem) return mem;
    const a = get(QUEUE, []);
    return (mem = Array.isArray(a) ? a.filter(okEntry).slice(0, MAX_Q).map(e => ({ k: e.k, t: e.t, f: e.f, v: e.v, d: e.d, n: Number.isInteger(e.n) ? e.n : 0, at: +e.at || 0, why: e.why === 'ime' ? 'ime' : '' })) : []);
  }
  function keepQ() {   // the store: the oldest that fit (the rest stays here till the game closes)
    const Q = queue(), out = []; let n = 2;
    for (const e of Q) { const s = JSON.stringify(e).length + 1; if (n + s > Q_BYTES) continue; out.push(e); n += s; }
    if (out.length) put(QUEUE, out); else del(QUEUE);
  }
  // a run in (only a better one than the queue's or the server's of its key): the record (its JSON) gzipped, the ghost (js/game.js ghWrite)
  async function add(f, recJson, ghost) {
    if (!on() || !isObj(f) || !KEY_RE.test(f.kljuc) || !Number.isInteger(f.t) || typeof recJson !== 'string' || typeof ghost !== 'string') return false;
    const sent = state().sent[f.kljuc]; if (sent && sent[0] <= f.t) return false;
    const Q = queue(), old = Q.find(e => e.k === f.kljuc); if (old && old.t <= f.t) return false;
    const gz = await gzip(recJson); if (!gz || gz.length < 2) return false;
    const e = { k: f.kljuc, t: f.t, f, v: b64(gz), d: ghost, n: 0, at: 0, why: '' };
    if (old) Q.splice(Q.indexOf(old), 1, e); else { Q.push(e); while (Q.length > MAX_Q) Q.shift(); }
    keepQ(); tell('queue', Q.length);
    return true;
  }
  const wait = (n) => Math.min(WAIT1, WAIT0 * Math.pow(2, Math.min(n, 8)));
  // the queue sent, what is due; the result of each: 'ok', 'later', 'ime', 'drop'. One send at a time (a second call gets the first's).
  function flush() {
    if (busy) return busy;
    if (!on() || !queue().length) return Promise.resolve([]);
    busy = (async () => {
      const out = [], S0 = state();
      for (const e of queue().slice()) {
        if (e.at > now() || (e.why === 'ime' && !S0.ime)) continue;
        let r, stop = false;
        try {
          const gz = unb64(e.v), du = TE.encode(e.d); if (!gz) throw Err(400, 'ovoj');
          const f = Object.assign({}, e.f, { lv: gz.length, ld: du.length, hv: await sha(gz), hd: await sha(du) });
          const j = await post('oddaja', f, cat([gz, du]));
          set(S => { S.sent[e.k] = [e.t, Number.isInteger(j.st) ? j.st : 0, now()]; S.err = ''; });
          r = 'ok';
        } catch (err) {
          const st = err.st || 0, code = err.code || '';
          if (st === 0 || st >= 500 || st === 429) r = 'later';
          else if (st === 404 && code === 'ni-igralca') r = 'ime';
          else if (st === 403) { set(S => { S.ban = true; S.err = code; }); r = 'drop'; }
          else { set(S => { S.err = code; }); r = 'drop'; }
          if (r === 'later') { e.n++; e.at = now() + Math.max(wait(e.n - 1), (err.retry || 0) * 1000); }
          if (r === 'ime') { e.why = 'ime'; if (S0.ime) set(S => { S.ime = ''; }); }   // (the server does not know the player: deleted elsewhere, the nickname again)
          if (st === 429) for (const x of queue()) x.at = Math.max(x.at, e.at);
          stop = r === 'later';   // (the server or the network down, or too many: the rest another time)
        }
        out.push({ k: e.k, r });
        if (r === 'ok' || r === 'drop') { const Q = queue(), i = Q.indexOf(e); if (i >= 0) Q.splice(i, 1); }
        if (stop) break;
      }
      keepQ(); tell('flush', out);
      return out;
    })().finally(() => { busy = null; });
    return busy;
  }

  /* ---------------- the world's tables ---------------- */
  // the cache: { key|what: [at, the answer] }, the oldest out past 200 KB
  function cache(k, v) {
    let C = get(CACHE, {}); if (!isObj(C)) C = {};
    if (v === undefined) return Array.isArray(C[k]) ? { at: +C[k][0] || 0, j: C[k][1] } : null;
    C[k] = [now(), v];
    let s = JSON.stringify(C);
    while (s.length > C_BYTES) { const ks = Object.keys(C).sort((a, b) => C[a][0] - C[b][0]); if (ks.length <= 1) { C = {}; break; } delete C[ks[0]]; s = JSON.stringify(C); }
    put(CACHE, C);
    return { at: now(), j: v };
  }
  // a read: the server's answer kept, or (the server not reached) the one kept before with its time: { j, at, old } or null
  async function read(ck, path) {
    try { const j = await call('GET', path); return Object.assign(cache(ck, j), { old: false }); }
    catch (err) { const c = cache(ck); if (c) return Object.assign(c, { old: true, err: err.code }); return { j: null, at: 0, old: true, err: err.code || 'mreza' }; }
  }
  const board = (k, od, n) => KEY_RE.test(k) ? read('l|' + k + '|' + (od | 0), '/v1/lestvica?' + q({ kljuc: k, od: od | 0, n: n || 100 })) : Promise.resolve(null);
  async function place(k) { const id = state().id; return KEY_RE.test(k) && id ? read('m|' + k, '/v1/mesto?' + q({ kljuc: k, id })) : null; }
  async function ghost(k, id) { try { return await call('GET', '/v1/duh?' + q({ kljuc: k, id })); } catch (_) { return null; } }
  // a table kept, without asking the server (the menu's first look: nothing waits)
  const kept = (k) => { const c = cache('l|' + k + '|0'); return c && Object.assign(c, { old: true }); };
  const keptPlace = (k) => { const c = cache('m|' + k); return c && Object.assign(c, { old: true }); };

  /* ---------------- the player's own ---------------- */
  function join() { set(S => { S.on = true; S.ban = false; }); }
  function leave() { set(S => { S.on = false; }); mem = []; del(QUEUE); }
  // the nickname (new or changed): { ok, ime, id, skrit } or { ok: false, why } ('oblika', 'vzdevek' …, the server's reason)
  async function nick(ime) {
    const nm = L() ? L().cleanName(ime) : ''; if (!nm) return { ok: false, why: 'oblika' };
    try {
      const j = await post('vzdevek', { ime: nm });
      set(S => { S.ime = typeof j.ime === 'string' ? j.ime : nm; S.id = ID_RE.test(j.id) ? j.id : S.id; S.skrit = !!j.skrit; S.err = ''; });
      for (const e of queue()) if (e.why === 'ime') { e.why = ''; e.at = 0; }
      keepQ(); flush();
      return { ok: true, ime: state().ime, id: state().id, skrit: state().skrit };
    } catch (err) { return { ok: false, why: (err.j && err.j.razlog) || err.code || 'mreza', st: err.st || 0 }; }
  }
  async function report(id) { if (!ID_RE.test(id)) return false; try { await post('prijava', { id }); return true; } catch (_) { return false; } }
  async function mine() { try { return await post('moje', {}); } catch (_) { return null; } }
  // the player's data off the server (the runs, the records, the ghosts, the reports) and off this device (the queue, the cache): true when done
  async function erase() {
    try { await post('izbris', {}); } catch (err) { if (!(err.st === 404)) return false; }
    del(STATE); del(QUEUE); del(CACHE); mem = [];
    save(Object.assign(state(), { on: false })); tell('state', state());
    return true;
  }

  function config(o) { cfg = Object.assign({}, cfg, o || {}); if ('url' in (o || {})) CFG.url = String(o.url || '').replace(/\/+$/, ''); mem = null; busy = null; }

  return { CFG, STATE, QUEUE, CACHE, MAX_Q, TIMEOUT, config, avail, on, state, join, leave, add, flush, queue: () => queue().slice(), board, place, ghost, kept, keptPlace, nick, report, mine, erase };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Svet;
