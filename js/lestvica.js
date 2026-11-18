/* =========================================================================
   LESTVICA — the friends' leaderboard (Lestvica prijateljev, docs/lestvica-prijateljev.md): the best times of the player and of the
   friends on every track, sent as a link (#lestvica=...) with no server and no account. No words and no page of its own: the game
   writes them (js/game.js, "the friends' leaderboard") and the menu shows the table through the game's bridge (js/menu.js); in Node
   (tests/lestvica.test.js) use(store) gives it a store to work on.
   - A packet is the times of one player: a JSON string { app, kind: 'times', v, pub, name, sent, t: { <record key>: [ms, day, car] } }
     signed by its owner (ECDSA P-256 with SHA-256, WebCrypto: the signature of the string itself, so a friend's packet goes on to
     others unchanged). The owner is the public key (pub: the raw point, base64url, 87 characters); a friend's id is the first 12
     characters of base64url(SHA-256(pub)): a new nickname is the same friend, the same nickname with another key another player.
     The record key is the game's (recKey: the track or its recId, the way it is driven, the winter and the rain of a time trial, @cs or @nova); ms
     the time; day the day it was first seen (1 is 1. 1. 2026; 0 not known); car the car's id, or null where the record keeps none.
   - A link (#lestvica=<Z>): Z is { app, kind: 'friends', v, p: [[packet, signature], ...] } packed (deflate-raw, base64url, as a
     ghost's link): the sender's packet first (signed as it is sent), then the newest packet of each friend the sender has, the one
     heard from last first, as many as fit in MAX_LINK characters (stran Odločitve 3, lp-povezava 2: one link brings the whole group).
   - Opened: every packet's form and signature checked (a broken one left out; without a good first packet the link is not valid),
     the player's own and hidden friends' left out (a hidden friend's own link only when the player says so), the times merged (each
     the best its owner ever sent for its key; the nickname of the newest packet), times faster than the track allows dropped (bound).
   - The store: tdgp-lp { v, friends: { <id>: { name, pub, sent, got, since, t, pk } }, hidden: [<id>], mine, seen } (sent: the newest
     packet's time, s; got: when a packet of the friend last came, since: first, ms; pk: the newest packet, to send on; mine: the
     player's own times as first seen, for their day and car; seen: mine started) and tdgp-lp-me { v, pub, jwk }, the player's key
     pair, made when the times are first sent (the private key leaves the phone only in the profile file: a profile brought to another
     phone keeps the same friend's id). Both are tdgp- keys: the profile file and the copies of the progress take them (js/shramba.js).
   ========================================================================= */
const Lestvica = (function () {
  'use strict';
  const APP = 'apex-racing', V = 1, KEY = 'tdgp-lp', ME = 'tdgp-lp-me', PHYS = ['cs', 'nova'];
  const MAX_FRIENDS = 40, MAX_TIMES = 600, MAX_HIDDEN = 100, MAX_LINK = 16000, MAX_IN = 120000, MAX_TEXT = 4e6;
  const DAY = 864e5, DAY0 = Date.UTC(2026, 0, 1);
  // the bound: in a bend no car turns harder than G3 (m/s²) nor goes faster than VK times the top speed of the fastest car
  const G3 = 3 * 9.81, VK = 1.15;
  const KEY_RE = /^[a-z0-9][a-z0-9-]{0,47}@[a-z]{1,8}$/, CAR_RE = /^[a-z0-9][a-z0-9-]{0,23}$/, PUB_RE = /^[\w-]{87}$/, SIG_RE = /^[\w-]{80,100}$/, ID_RE = /^[\w-]{12}$/;
  const EC = { name: 'ECDSA', namedCurve: 'P-256' }, SIGN = { name: 'ECDSA', hash: 'SHA-256' };
  let store = null, hooks = {}, meK = null;

  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const posInt = (v) => Number.isInteger(v) && v > 0;
  // a nickname as the game keeps a name: printable, single spaces, at most 16 characters (always escaped when it is shown)
  const cleanName = (v) => typeof v === 'string' || typeof v === 'number' ? String(v).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16) : '';
  const ls = () => store || (typeof localStorage !== 'undefined' ? localStorage : null);
  function keep(k, v) { if (hooks.keep) return hooks.keep(k, v); try { ls().setItem(k, v); return true; } catch (_) { return false; } }
  const dayOf = (ms) => Math.max(0, Math.floor((ms - DAY0) / DAY) + 1);
  const dateOf = (day) => (posInt(day) ? DAY0 + (day - 1) * DAY : 0);

  /* ---------------- base64url, packing, the browser's crypto ---------------- */
  const b64u = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  function unb64u(s) {
    if (typeof s !== 'string' || !/^[\w-]*$/.test(s) || s.length % 4 === 1) return null;
    const b = atob(s.replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u;
  }
  const enc = (s) => new TextEncoder().encode(s);
  const subtle = () => (typeof crypto !== 'undefined' && crypto && crypto.subtle) || null;
  // a browser that can send and take a link: WebCrypto (a page over https or the phone's own) and the deflate streams
  const can = () => !!(subtle() && typeof CompressionStream === 'function' && typeof DecompressionStream === 'function' && typeof TextEncoder === 'function');
  async function pack(s) { return b64u(new Uint8Array(await new Response(new Blob([s]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer())); }
  async function unpack(p) {   // (at most MAX_TEXT bytes come out: a link made to unpack into gigabytes stops there)
    const u = unb64u(p); if (!u) throw new Error('not base64url');
    const r = new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(), parts = []; let n = 0;
    for (;;) { const c = await r.read(); if (c.done) break; n += c.value.length; if (n > MAX_TEXT) { try { r.cancel(); } catch (_) { } throw new Error('too long'); } parts.push(c.value); }
    const all = new Uint8Array(n); let o = 0; for (const a of parts) { all.set(a, o); o += a.length; }
    return new TextDecoder().decode(all);
  }

  /* ---------------- the player's key pair and a friend's id ---------------- */
  async function idOf(pub) { const u = unb64u(pub); return u ? b64u(new Uint8Array(await subtle().digest('SHA-256', u))).slice(0, 12) : null; }
  // the player's key: { pub, id, key } (the private key, for signing); made (and kept) when make and there is none yet; null without
  // WebCrypto or when it cannot be kept
  async function me(make) {
    if (!subtle()) return null;
    let o = null; try { o = JSON.parse((ls() && ls().getItem(ME)) || 'null'); } catch (_) { }
    if (isObj(o) && o.v === 1 && typeof o.pub === 'string' && PUB_RE.test(o.pub) && isObj(o.jwk)) {
      if (meK && meK.pub === o.pub) return meK;
      try { const key = await subtle().importKey('jwk', o.jwk, EC, false, ['sign']); return (meK = { pub: o.pub, id: await idOf(o.pub), key }); } catch (_) { }
    }
    if (!make) return null;
    const kp = await subtle().generateKey(EC, true, ['sign', 'verify']);
    const jwk = await subtle().exportKey('jwk', kp.privateKey), pub = b64u(new Uint8Array(await subtle().exportKey('raw', kp.publicKey)));
    if (!keep(ME, JSON.stringify({ v: 1, pub, jwk }))) return null;
    return (meK = { pub, id: await idOf(pub), key: kp.privateKey });
  }

  /* ---------------- packets ---------------- */
  // one time of a packet as the game takes it: [ms, day, car], or null (a key not of the game's form, a time that is not a whole
  // positive number of ms under a day, an unknown form of day or car)
  function timeOf(k, e) {
    if (typeof k !== 'string' || !KEY_RE.test(k) || !Array.isArray(e) || !e.length || e.length > 3) return null;
    const ms = e[0], day = e.length > 1 && e[1] != null ? e[1] : 0, car = e.length > 2 && e[2] != null ? e[2] : null;
    if (!Number.isInteger(ms) || ms <= 0 || ms >= DAY) return null;
    if (!Number.isInteger(day) || day < 0 || day > 99999) return null;
    if (car !== null && (typeof car !== 'string' || !CAR_RE.test(car))) return null;
    return [ms, day, car];
  }
  // at most MAX_TIMES: the newest first (by their day)
  function capTimes(t) {
    const ks = Object.keys(t); if (ks.length <= MAX_TIMES) return t;
    const out = {}; ks.sort((a, b) => t[b][1] - t[a][1] || (a < b ? -1 : 1)).slice(0, MAX_TIMES).forEach(k => { out[k] = t[k]; }); return out;
  }
  // the player's times signed, as they are sent now: [packet, signature] (null without WebCrypto)
  async function packet(name, t, now) {
    const M = await me(true); if (!M) return null;
    const body = JSON.stringify({ app: APP, kind: 'times', v: V, pub: M.pub, name: cleanName(name) || '?', sent: Math.floor((now || Date.now()) / 1000), t: capTimes(t || {}) });
    return [body, b64u(new Uint8Array(await subtle().sign(SIGN, M.key, enc(body))))];
  }
  const okPk = (pk) => Array.isArray(pk) && pk.length === 2 && typeof pk[0] === 'string' && pk[0].length <= 60000 && typeof pk[1] === 'string' && SIG_RE.test(pk[1]);
  // a packet checked: { id, pub, name, sent, t, pk } or null (not of this game's form, sent more than a day ahead of the clock, more than
  // MAX_TIMES times, or its signature not its owner's); a time of an unknown form is left out (a later game's), the rest stays
  async function readPacket(pk, now) {
    if (!okPk(pk) || !subtle()) return null;
    let o = null; try { o = JSON.parse(pk[0]); } catch (_) { return null; }
    if (!isObj(o) || o.app !== APP || o.kind !== 'times' || o.v !== V || typeof o.pub !== 'string' || !PUB_RE.test(o.pub) || !posInt(o.sent) ||
      o.sent * 1000 > (now || Date.now()) + DAY || !isObj(o.t) || Object.keys(o.t).length > MAX_TIMES) return null;
    let ok = false;
    try { const key = await subtle().importKey('raw', unb64u(o.pub), EC, false, ['verify']); ok = await subtle().verify(SIGN, key, unb64u(pk[1]), enc(pk[0])); } catch (_) { ok = false; }
    if (!ok) return null;
    const t = {}; for (const k of Object.keys(o.t)) { const e = timeOf(k, o.t[k]); if (e) t[k] = e; }
    return { id: await idOf(o.pub), pub: o.pub, name: cleanName(o.name) || '?', sent: o.sent, t, pk: [pk[0], pk[1]] };
  }

  /* ---------------- the link ---------------- */
  // own: the player's packet; friends: friends' packets, the one to keep most first. { z, n } (n: the friends' packets in it, as many as
  // fit in MAX_LINK characters), or null when the player's alone does not fit
  async function link(own, friends) {
    friends = friends || [];
    const make = async (n) => { const z = await pack(JSON.stringify({ app: APP, kind: 'friends', v: V, p: [own].concat(friends.slice(0, n)) })); return z.length <= MAX_LINK ? { z, n } : null; };
    let best = await make(friends.length); if (best) return best;
    let lo = 0, hi = friends.length - 1;
    while (lo <= hi) { const m = (lo + hi) >> 1, r = await make(m); if (r) { best = r; lo = m + 1; } else hi = m - 1; }
    return best;
  }
  // a link's part after #lestvica= read: { packets, bad } (the sender's first; bad: friends' packets left out, broken), or null
  async function readLink(z, now) {
    if (typeof z !== 'string' || !z || z.length > MAX_IN || !/^[\w-]+$/.test(z) || !can()) return null;
    let o = null; try { o = JSON.parse(await unpack(z)); } catch (_) { return null; }
    if (!isObj(o) || o.app !== APP || o.kind !== 'friends' || o.v !== V || !Array.isArray(o.p) || !o.p.length || o.p.length > 2 * MAX_FRIENDS) return null;
    const first = await readPacket(o.p[0], now); if (!first) return null;
    const packets = [first]; let bad = 0;
    for (let i = 1; i < o.p.length; i++) { const r = await readPacket(o.p[i], now); if (r) packets.push(r); else bad++; }
    return { packets, bad };
  }

  /* ---------------- the store ---------------- */
  const fresh = () => ({ v: 1, friends: {}, hidden: [], mine: {}, seen: false });
  function load() {
    let o = null; try { o = JSON.parse((ls() && ls().getItem(KEY)) || 'null'); } catch (_) { }
    const S = fresh(); if (!isObj(o)) return S;
    if (isObj(o.friends)) for (const id of Object.keys(o.friends)) {
      const F = o.friends[id]; if (!ID_RE.test(id) || !isObj(F) || typeof F.pub !== 'string' || !PUB_RE.test(F.pub) || !posInt(F.sent) || !isObj(F.t)) continue;
      const t = {}; for (const k of Object.keys(F.t)) { const e = timeOf(k, F.t[k]); if (e) t[k] = e; }
      S.friends[id] = { name: cleanName(F.name) || '?', pub: F.pub, sent: F.sent, got: posInt(F.got) ? F.got : 0, since: posInt(F.since) ? F.since : 0, t: capTimes(t), pk: okPk(F.pk) ? [F.pk[0], F.pk[1]] : null };
    }
    if (Array.isArray(o.hidden)) S.hidden = o.hidden.filter((id, i, a) => typeof id === 'string' && ID_RE.test(id) && a.indexOf(id) === i && !S.friends[id]).slice(-MAX_HIDDEN);
    if (isObj(o.mine)) for (const k of Object.keys(o.mine)) { const e = timeOf(k, o.mine[k]); if (e) S.mine[k] = e; }
    S.seen = o.seen === true;
    return S;
  }
  const save = (S) => keep(KEY, JSON.stringify(S));

  /* ---------------- merging a link's packets ---------------- */
  // opts: me (the player's id, or null), now (ms), mine ({ key: ms }: the player's times, to count the friend's better ones), bound
  // ((key) => s: the fastest the key's run can be, 0 when not known yet), unhide (a hidden sender's own link: the player said yes).
  // -> { from: { id, name, n, news, better, isNew, renamed, hidden }, others: [the same, of the friends with something new], own (the
  // player's own link), hidden: [names left out], evicted: [names], impossible (times dropped), last (the key of the newest new time), keys
  // (every key with a new time: the sender's first, each's newest first) }
  function merge(S, packets, opts) {
    opts = opts || {}; const now = opts.now || Date.now(), mineT = opts.mine || {}, bound = opts.bound || (() => 0);
    const R = { from: null, others: [], own: false, hidden: [], evicted: [], impossible: 0, last: null, keys: [] }, seen = new Set(), nk = [];
    let lastO = null;
    packets.forEach((P, i) => {
      const first = i === 0; if (seen.has(P.id)) return; seen.add(P.id);
      if (opts.me && P.id === opts.me) { if (first) R.own = true; return; }
      const h = S.hidden.indexOf(P.id);
      if (h >= 0 && !(first && opts.unhide)) { R.hidden.push(P.name); if (first) R.from = { id: P.id, name: P.name, n: Object.keys(P.t).length, news: 0, better: 0, isNew: false, renamed: false, hidden: true }; return; }
      if (h >= 0) S.hidden.splice(h, 1);
      const old = S.friends[P.id], F = old || { name: P.name, pub: P.pub, sent: 0, got: 0, since: now, t: {}, pk: null };
      let n = 0, news = 0, better = 0, last = null;
      for (const k of Object.keys(P.t)) {
        const e = P.t[k], b = bound(k);
        if (b > 0 && e[0] < b * 1000) { R.impossible++; continue; }
        n++; if (mineT[k] > 0 && e[0] < mineT[k]) better++;
        const o = F.t[k]; if (!o || e[0] < o[0]) { F.t[k] = e; news++; nk.push({ k, day: e[1], first }); if (!last || e[1] > last.day) last = { key: k, day: e[1] }; }
      }
      const renamed = !!old && P.sent > F.sent && P.name !== F.name;
      if (P.sent > F.sent) { F.name = P.name; F.sent = P.sent; F.pk = P.pk; }   // (the newest packet: its nickname, and it is the one sent on)
      F.got = now; F.t = capTimes(F.t); if (!old) S.friends[P.id] = F;
      const r = { id: P.id, name: F.name, n, news, better, isNew: !old, renamed, hidden: false };
      if (first) { R.from = r; if (last) R.last = last.key; } else { if (news || !old || renamed) R.others.push(r); if (last && (!lastO || last.day > lastO.day)) lastO = last; }
    });
    if (!R.last && lastO) R.last = lastO.key;
    R.keys = nk.sort((a, b) => b.first - a.first || b.day - a.day).map(x => x.k).filter((k, i, a) => a.indexOf(k) === i);
    // the 41st friend: the one heard from longest ago goes (one of this link's only when all the others are of it)
    for (let ids = Object.keys(S.friends); ids.length > MAX_FRIENDS; ids = Object.keys(S.friends)) {
      const pool = ids.filter(id => !seen.has(id)), from = R.from && R.from.id, c = (pool.length ? pool : ids.filter(id => id !== from)).sort((a, b) => S.friends[a].got - S.friends[b].got || S.friends[a].since - S.friends[b].since)[0];
      R.evicted.push(S.friends[c].name); delete S.friends[c];
    }
    return R;
  }
  const nothingNew = (R) => !!R.from && !R.from.hidden && !R.from.news && !R.from.isNew && !R.from.renamed && !R.others.length;
  // a friend taken off the leaderboard: hidden too (their next links bring nothing unless the player says so); the newest MAX_HIDDEN kept
  function hide(S, id) { const k = S.hidden.indexOf(id); if (k >= 0) S.hidden.splice(k, 1); S.hidden.push(id); if (S.hidden.length > MAX_HIDDEN) S.hidden.splice(0, S.hidden.length - MAX_HIDDEN); }
  function remove(S, id) { if (!S.friends[id]) return false; delete S.friends[id]; hide(S, id); return true; }

  /* ---------------- the table ---------------- */
  // the nicknames as shown: the same nickname of two players (two keys) gets (2), (3) ... in the order they came
  function names(S) {
    const out = {}, cnt = {}, ids = Object.keys(S.friends).sort((a, b) => S.friends[a].since - S.friends[b].since || (a < b ? -1 : 1));
    for (const id of ids) { const n = S.friends[id].name, k = n.toLowerCase(); cnt[k] = (cnt[k] || 0) + 1; out[id] = cnt[k] > 1 ? n.slice(0, 12) + ' (' + cnt[k] + ')' : n; }
    return out;
  }
  // the table of one key: [{ id, name, ms, day, car, me }] the fastest first (an equal time: the player's first); a friend's time faster
  // than the bound (s, when it is known) is not shown. me: the player's own { name, ms, day, car } (none: not in it)
  function rows(S, key, me, b) {
    const nm = names(S), out = [];
    for (const id of Object.keys(S.friends)) { const e = S.friends[id].t[key]; if (e && !(b > 0 && e[0] < b * 1000)) out.push({ id, name: nm[id], ms: e[0], day: e[1], car: e[2], me: false }); }
    if (me && me.ms > 0) out.push({ id: '', name: me.name, ms: me.ms, day: me.day || 0, car: me.car || null, me: true });
    return out.sort((a, b2) => a.ms - b2.ms || (b2.me - a.me) || (a.name < b2.name ? -1 : a.name > b2.name ? 1 : 0));
  }
  // the player's place in a table: { at (1-based), n, ahead: the row just before (or null), gap (ms behind it) }, or null (not in it)
  function place(rs) { const i = rs.findIndex(r => r.me); return i < 0 ? null : { at: i + 1, n: rs.length, ahead: i ? rs[i - 1] : null, gap: i ? rs[i].ms - rs[i - 1].ms : 0 }; }
  // the friends' packets to send on: the friend heard from last first
  const forward = (S) => Object.keys(S.friends).map(id => S.friends[id]).filter(F => F.pk).sort((a, b) => b.got - a.got || b.sent - a.sent).map(F => F.pk);

  /* ---------------- the record keys and the player's own times ---------------- */
  // every record key the game's tracks can have (as js/game.js recKey makes them): key -> { id, mode, kind, win, wet, phys }. kind: which time
  // the record's is (the one the menu shows): 'tt' a time trial (bestTime), 'lap' a circuit's lap (bestLap), 'up' a race up an open road,
  // 'police' the run from the police, 'traffic' the duel in the traffic (bestRace)
  function keyTable(defs) {
    const T = new Map();
    for (const d of defs || []) {
      const base = d.recId || d.id, ways = d.modes ? d.modes.slice() : [d.timeTrial ? 'tt' : 'race'], d0 = d.timeTrial ? 'tt' : 'race';
      for (const m of ways) {
        const tt = d.modes ? m === 'tt' : !!d.timeTrial, kind = tt ? 'tt' : m === 'police' ? 'police' : m === 'traffic' ? 'traffic' : d.open ? 'up' : 'lap';
        const k0 = base + (d.modes && m !== d0 ? '-' + m : '');
        for (const win of tt ? [false, true] : [false]) for (const wet of tt ? [false, true] : [false]) for (const phys of PHYS) T.set(k0 + (win ? '-winter' : '') + (wet ? '-wet' : '') + '@' + phys, { id: d.id, mode: m, kind, win, wet, phys });
      }
    }
    return T;
  }
  const timeIn = (r, kind) => (kind === 'tt' ? r.bestTime : kind === 'lap' ? r.bestLap : r.bestRace);
  // the player's own times from the game's records (records.tracks): { t: { key: [ms, day, car] }, changed (S.mine to be saved) }. A time
  // first seen gets the day (a time trial's: its board's date) and the car (a time trial's: its board's; else opts.cars[key], the car
  // the game says set it just now); the times there were before the leaderboard came get no day
  function ownTimes(S, tracks, table, opts) {
    opts = opts || {}; const today = dayOf(opts.now || Date.now()), cars = opts.cars || {}, t = {}; let changed = false;
    for (const [k, I] of table) {
      const r = tracks && tracks[k], v = isObj(r) ? timeIn(r, I.kind) : 0;
      if (!(typeof v === 'number' && v > 0 && v < 86400)) continue;
      const ms = Math.round(v * 1000); let day = 0, car = null;
      if (I.kind === 'tt' && Array.isArray(r.board)) { const b = r.board.find(e => isObj(e) && Math.abs(e.time - v) < 5e-4); if (b) { if (typeof b.carId === 'string' && CAR_RE.test(b.carId)) car = b.carId; if (b.date > 0) day = dayOf(b.date); } }
      const m = S.mine[k];
      if (m && m[0] === ms) { day = day || m[1]; car = car || m[2]; }
      else { day = day || (S.seen ? today : 0); if (!car && typeof cars[k] === 'string' && CAR_RE.test(cars[k])) car = cars[k]; S.mine[k] = [ms, day, car]; changed = true; }
      t[k] = [ms, day, car];
    }
    if (!S.seen) { S.seen = true; changed = true; }
    return { t: capTimes(t), changed };
  }

  /* ---------------- the fastest a run could be ---------------- */
  // the top speed of the fastest car (m/s): its rev limit in its top gear
  function topSpeed(models) {
    let v = 0; for (const M of models || []) if (M && Array.isArray(M.gears) && M.gears.length && M.final > 0 && M.redline > 0 && M.rw > 0) v = Math.max(v, M.redline / (Math.min.apply(null, M.gears) * M.final) * Math.PI * M.rw / 30);
    return v;
  }
  // the fastest a run of a key could be (s), T the track built (Core.Track), I its keyTable entry: along the racing line no faster than
  // √(G3 · radius) in a bend nor than VK times the fastest car's top speed, braking and speeding up taken as nothing. A circuit's lap;
  // an open road from the start to the finish (the run from the police to the building at the top, def.hideout). The fastest rivals of
  // the reference races (tests/golden/races.json: the formula, the prototype) are 1.5 to 2.7 times slower (tests/lestvica.test.js)
  function bound(T, I, models) {
    if (!T || !T.rk || !T.rds || !I) return 0;
    const vc = VK * (topSpeed(models) || 92), N = T.N, ds = T.ds, d = T.def || {};
    let i0 = 0, i1 = N;
    if (T.open) { const end = I.kind === 'police' && d.hideout ? T.startS + d.hideout.s : T.finishS; i0 = Math.round(T.startS / ds); i1 = Math.round(end / ds); }
    let t = 0;
    for (let i = i0; i < i1; i++) { const j = ((i % N) + N) % N, k = Math.abs(T.rk[j]), v = k > 1e-6 ? Math.min(vc, Math.sqrt(G3 / k)) : vc; t += T.rds[j] / v; }
    return t;
  }

  function use(s) { store = s || null; meK = null; }   // (tests: a store of their own)
  function set(o) { hooks = Object.assign({}, hooks, o || {}); }   // keep(key, value): the game's save (Shramba.keep)

  return { KEY, ME, MAX_FRIENDS, MAX_TIMES, MAX_HIDDEN, MAX_LINK, can, use, set, load, save, me, idOf, packet, readPacket, link, readLink, merge, nothingNew,
    hide, remove, names, rows, place, forward, keyTable, ownTimes, topSpeed, bound, dayOf, dateOf, cleanName, timeOf, pack, unpack };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Lestvica;
