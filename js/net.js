/* =========================================================================
   NET — a race with friends over the internet: up to four phones, directly connected
   ========================================================================= */
// The phones connect peer to peer (WebRTC, through the PeerJS library in js/vendor/). They find each other through the free
// public PeerJS server with a short room code; PeerJS also brings a relay (TURN) for networks where a direct connection is
// not possible. One reliable, ordered channel per friend carries small JSON messages. The phone that made the room (host)
// keeps the clock and is the hub: every friend is connected to it (a private room takes up to three, a quick match is a pair);
// the others measure the difference to its clock with pings, so that all can start the race at the same moment. The host
// passes on what the friends send each other (see game.js).
// Events for the game (onEvent(type, data, id)): 'code' (the host's room is ready; again when a lost server connection is back),
// 'wait' (quick match: a place is taken and someone is waited for),
// 'open' (a friend is connected: its id), 'msg' (a message from a friend, its id), 'lost' (a friend's connection is gone: why, id),
// 'error' (no connection: a PeerJS error type or 'timeout'). The ids: the host is 'h' for its friends, they are 'g1'..'g3' for it.
const Net = (function () {
  'use strict';
  const PREFIX = 'apex-racing-dirkaska-';   // (the public server is shared by everyone who uses PeerJS)
  const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // room codes: 4 of these (no 0/O or 1/I to mix up)
  const SILENT = 10000;   // ms without a word from a friend (pings and answers every 2 s, also in the background; race states 20 times a second): gone
  const SERVER_ERR = ['network', 'socket-closed', 'socket-error', 'server-error'];   // the connection to the PeerJS server (not to a friend) broke
  const ROOM = 4;   // a private room: the host and up to three friends
  let peer = null, role = null, handler = null, code = '';
  const links = new Map();   // the connections: a friend's one to the host ('h'); the host's to its friends ('g1', 'g2', 'g3')
  let offset = 0, bestRtt = Infinity, synced = false, fixed = false, quietTill = 0, pongs = [], timers = [];
  let fails = 0, retryT = null, lastTry = -1e9;
  let quick = false, paired = false, waiting = false, slot = 0, attempts = 0, qver = '', reopen = null;
  const QPLACES = 5;

  const opts = () => Object.assign({ debug: 0 }, window.__peerOpts || {});   // (the tests point it at their own server)
  const available = () => typeof window.Peer === 'function' && typeof window.RTCPeerConnection === 'function';
  const emit = (type, data, id) => { if (handler) { try { handler(type, data, id); } catch (e) { console.error(e); } } };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const now = () => performance.now() + offset;   // the host's clock, in ms
  const newCode = () => { let s = ''; for (let i = 0; i < 4; i++) s += ABC[(Math.random() * ABC.length) | 0]; return s; };
  const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  const cap = () => (quick ? 1 : ROOM - 1);   // the friends a host takes
  const openIds = () => [...links.values()].filter(L => L.opened && L.c.open).map(L => L.id);

  function sendTo(id, m) { const L = links.get(id); if (L && L.c.open) { try { L.c.send(m); } catch (_) { } } }
  function send(m) { for (const L of links.values()) if (L.opened && L.c.open) { try { L.c.send(m); } catch (_) { } } }   // (a friend: to the host; the host: to every friend)

  function attach(c, id) {
    const L = { id, c, opened: false, lastRx: 0, timers: [] }; links.set(id, L);
    const mine = () => links.get(id) === L;
    const lat = (fn, ms) => { L.timers.push(setTimeout(fn, ms)); }, ev = (fn, ms) => { L.timers.push(setInterval(fn, ms)); };
    c.on('open', () => {
      if (!mine()) return;   // (an older connection that was replaced)
      L.opened = true; L.lastRx = performance.now();
      if (quick && !paired) { paired = true; if (role === 'host' && peer) { try { peer.disconnect(); } catch (_) { } } }   // (quick match: a pair; the place is free for the next pair, the line to the friend stays)
      emit('open', null, id);
      if (role === 'guest') {   // measure the host's clock: a burst now, then one ping every 2 s (it keeps the line alive too)
        for (let i = 0; i < 6; i++) lat(() => sendTo(id, { t: 'ping', a: performance.now() }), i * 120);
        ev(() => sendTo(id, { t: 'ping', a: performance.now() }), 2000);
      }
      ev(() => { const t = performance.now(); if (mine() && c.open && t - L.lastRx > SILENT && t > quietTill) lost(id, 'silent'); }, 1000);
    });
    c.on('data', (m) => {
      if (!mine()) return;
      L.lastRx = performance.now();
      if (!m || typeof m !== 'object') return;
      if (m.t === 'full' && quick && role === 'guest') { const n = slot; unlink(id); paired = false; clearTimers(); scan(n + 1, 0); return; }   // (someone was quicker: the next place)
      if (m.t === 'ping') { if (typeof m.a === 'number') sendTo(id, { t: 'pong', a: m.a, h: performance.now() }); return; }
      if (m.t === 'pong') {   // the host's clock at the moment of the answer, half a round trip ago. Of the last 12 answers (~24 s) the one
        const t1 = performance.now(), rtt = t1 - m.a;   // with the shortest round trip counts: the least delayed (and the clocks may drift apart slowly)
        if (role !== 'guest' || typeof m.h !== 'number' || !(rtt >= 0 && rtt < 5000)) return;
        pongs.push({ rtt, off: m.h + rtt / 2 - t1 }); if (pongs.length > 12) pongs.shift();
        const best = pongs.reduce((a, b) => (b.rtt < a.rtt ? b : a));
        if (!fixed || !synced) offset = best.off;   // (during a race the clock stays as it was at the start)
        bestRtt = best.rtt; synced = true;
        return;
      }
      emit('msg', m, id);
    });
    const ended = (why) => {
      if (!mine()) return;
      if (quick && !L.opened) {   // (never connected: a waiting host just waits on; a guest tries the next place)
        unlink(id);
        if (role === 'guest') { clearTimers(); scan(slot + 1, 0); }
        return;
      }
      lost(id, why);
    };
    c.on('close', () => ended('close'));
    c.on('error', () => ended('error'));
  }
  function unlink(id) {
    const L = links.get(id); if (!L) return;
    links.delete(id); for (const t of L.timers) { clearTimeout(t); clearInterval(t); }
    try { L.c.close(); } catch (_) { }
  }
  // a friend's connection is gone (quiet: the game knows already, the friend said goodbye). The host's room stays open for someone new
  function lost(id, why, quiet) {
    unlink(id);
    if (!links.size) { clearTimers(); retryT = null; }
    if (role === 'host' && !paired && peer && (peer.disconnected || peer.destroyed)) serverLost(peer, 'network');   // (its code back on the server)
    if (!quiet) emit('lost', why, id);
  }
  function clearTimers() { for (const t of timers) { clearTimeout(t); clearInterval(t); } timers = []; }

  // The host's connection to the PeerJS server broke (a network change, the app in the background, a server restart). The
  // room needs it only to be found, so while it is not full the host tries again with the same code (the server gives it
  // back to the same peer), at once when the network or the app is back, and gives up after about a minute. (PeerJS
  // reports the error first and then disconnects the peer, or destroys it if it never got in: then a new one, with a new code.)
  function serverLost(p, type) {
    if (peer !== p || role !== 'host' || retryT || paired || links.size >= cap()) return;
    if (performance.now() - lastTry > 30000) fails = 0;   // (a new outage, not the same one going on: count again)
    if (fails >= 7) { if (!openIds().length) later(() => emit('error', type), 0); return; }   // (not from inside the caller; with friends in the room it just stays as it is)
    retryT = later(() => retry(p), Math.min(10000, 800 * 2 ** fails));
  }
  function retry(p) {
    retryT = null; lastTry = performance.now();
    if (peer !== p || links.size >= cap()) return;
    fails++;
    if (p.destroyed) { if (!openIds().length) reopen(); }   // (a new peer is a new code: not with friends in the room)
    else if (p.disconnected) { try { p.reconnect(); } catch (_) { } later(() => { if (peer === p && serverUp(p)) fails = 0; }, 5000); }   // (back for a while: a later drop counts from the start)
  }
  const serverUp = (p) => !!(p.open || (p.socket && p.socket._socket && p.socket._socket.readyState === 1));   // (the server takes a known peer back without saying "open": its WebSocket is up)
  function kick() {   // the network or the app is back: try now
    if (role !== 'host' || paired || !peer || links.size >= cap() || !(peer.disconnected || peer.destroyed)) return;
    if (retryT) { clearTimeout(retryT); retryT = null; }
    retry(peer);
  }
  window.addEventListener('online', kick);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  // make a room: a new code each time (another one if the code is taken)
  function host(onEvent) {
    close(); handler = onEvent; role = 'host'; offset = 0; synced = true; fixed = false; fails = 0; lastTry = -1e9; quick = false;
    reopen = () => openRoom(0);
    openRoom(0);
    later(() => { if (role === 'host' && !code) emit('error', 'network'); }, 30000);   // (no answer from the server at all)
  }
  function openRoom(tries) {
    const want = newCode();
    openHost(PREFIX + want, () => { code = want; emit('code', code); }, () => { if (tries < 5) openRoom(tries + 1); else emit('error', 'unavailable-id'); });
  }
  // register a peer under an id and wait for friends. taken: the id is in use by someone else (see the callers)
  function openHost(id, onOpen, taken) {
    const p = peer = new Peer(id, opts());
    p.on('open', () => { if (peer !== p) return; fails = 0; onOpen(); });
    p.on('connection', (c) => {
      if (peer !== p) return;
      for (const [k, L] of links) if (L.c.peer === c.peer) unlink(k);   // (a newer try of the same phone wins over one still connecting)
      if (quick) for (const [k, L] of links) if (!L.opened) unlink(k);   // (quick match: a newer try wins over one still connecting)
      if (links.size >= cap()) { c.on('open', () => { try { c.send({ t: 'full' }); } catch (_) { } setTimeout(() => c.close(), 4000); }); return; }   // (the room is full: told, then let go; it closes itself on the word, a slow phone has seconds to get it)
      let n = 1; while (links.has('g' + n)) n++;
      attach(c, 'g' + n);
    });
    p.on('disconnected', () => { if (peer === p) serverLost(p, 'network'); });
    p.on('error', (e) => {
      if (peer !== p) return;
      if (e.type === 'unavailable-id') { p.destroy(); taken(); return; }
      if (SERVER_ERR.includes(e.type)) { setTimeout(() => serverLost(p, e.type), 0); return; }   // (once PeerJS has disconnected or destroyed it)
      if (openIds().length) return;   // (the friends in the room do not need the server)
      emit('error', e.type);
    });
  }

  // Quick match: no code, a pair. A few waiting places have fixed names on the public server (with the game's version in them,
  // so that different versions never meet). Whoever comes first takes the first free place and waits; whoever comes next finds
  // it taken (the server allows one peer per name) and connects to whoever is there. Once two are together the place is free
  // again. A place whose owner is gone without a word does not answer: after a few seconds the next place is tried.
  function quickMatch(ver, onEvent) {
    close(); handler = onEvent; quick = true; paired = false; offset = 0; synced = true; fixed = false; fails = 0; lastTry = -1e9; attempts = 0;
    qver = String(ver).replace(/[^A-Za-z0-9]/g, '');
    reopen = () => scan(0, 0);
    scan(0, 0);
    later(() => { if (quick && role === 'host' && !waiting) emit('error', 'network'); }, 30000);   // (no answer from the server at all)
  }
  const placeId = (n) => PREFIX + 'q' + qver + '-' + n;
  function forget() { const p = peer; peer = null; for (const k of [...links.keys()]) unlink(k); waiting = false; try { if (p) p.destroy(); } catch (_) { } }
  function scan(n, round) {   // try to take place n and wait there; if it is taken, go to its owner
    if (!quick) return;
    if (n >= QPLACES) { if (round < 1) scan(0, round + 1); else emit('error', 'busy'); return; }
    forget(); role = 'host'; slot = n; synced = true; offset = 0;
    openHost(placeId(n), () => { waiting = true; emit('wait'); }, () => meet(n, round));
  }
  function meet(n, round) {   // the place is taken: connect to the one who waits there
    if (!quick || ++attempts > 16) { if (quick) emit('error', 'busy'); return; }
    forget(); role = 'guest'; slot = n; bestRtt = Infinity; synced = false; pongs = [];
    const p = peer = new Peer(opts());
    p.on('open', () => { if (peer === p && !links.size) attach(p.connect(placeId(n), { serialization: 'json', reliable: true }), 'h'); });
    p.on('error', (e) => {
      if (peer !== p || openIds().length) return;
      if (e.type === 'peer-unavailable') { later(() => { if (peer === p) scan(n, round); }, 0); return; }   // (it just went: take the place)
      emit('error', e.type);
    });
    later(() => { if (peer === p && !openIds().length) scan(n + 1, round); }, 6000);   // (nobody answers: the place is a leftover)
  }
  // join a friend's room by its code
  function join(roomCode, onEvent) {
    close(); handler = onEvent; role = 'guest'; offset = 0; bestRtt = Infinity; synced = false; fixed = false; pongs = []; quick = false;
    code = normCode(roomCode);
    const p = peer = new Peer(opts());
    p.on('open', () => { if (peer === p && !links.size) attach(p.connect(PREFIX + code, { serialization: 'json', reliable: true }), 'h'); });   // (once: the server may say open again after a reconnect)
    p.on('error', (e) => { if (peer === p && !openIds().length) emit('error', e.type); });
    later(() => { if (peer === p && !openIds().length) emit('error', 'timeout'); }, 20000);
  }
  // leave: tell the friends, then close everything
  function close(bye) {
    if (bye) send({ t: 'bye' });
    const L = [...links.values()], p = peer;
    for (const x of L) for (const t of x.timers) { clearTimeout(t); clearInterval(t); }
    links.clear(); peer = null; role = null; handler = null; code = ''; quick = false; paired = false; waiting = false; clearTimers(); retryT = null;
    setTimeout(() => { for (const x of L) { try { x.c.close(); } catch (_) { } } try { if (p) p.destroy(); } catch (_) { } }, bye ? 300 : 0);
  }
  // the host: let this friend go (they said goodbye), keep the room
  function drop(id) { if (id && links.has(id)) lost(id, 'bye', true); }
  // a long job ahead (loading a track: a phone may not answer for seconds): nobody counts as gone before ms have passed (0: as usual again)
  function hold(ms) { quietTill = performance.now() + ms; }
  // during a race the clock does not move (the best ping may change; the start and the finish must be on the same clock)
  function fixClock(on) { fixed = !!on; }

  return {
    available, host, quickMatch, join, close, drop, hold, fixClock, send, sendTo, now, normCode,
    get role() { return role; }, get code() { return code; }, get open() { return openIds().length > 0; }, get ids() { return openIds(); },
    get synced() { return synced; }, get rtt() { return bestRtt; }, get room() { return ROOM; },
  };
})();
