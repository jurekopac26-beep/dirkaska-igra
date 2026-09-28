/* =========================================================================
   NET — a race with a friend over the internet: two phones, directly connected
   ========================================================================= */
// The phones connect peer to peer (WebRTC, through the PeerJS library in js/vendor/). They find each other through the free
// public PeerJS server with a short room code; PeerJS also brings a relay (TURN) for networks where a direct connection is
// not possible. One reliable, ordered channel carries small JSON messages. The phone that made the room (host) keeps the
// clock: the other one measures the difference with pings, so that both can start the race at the same moment.
// Events for the game (onEvent(type, data)): 'code' (the host's room is ready; again when a lost server connection is back),
// 'wait' (quick match: a place is taken and someone is waited for),
// 'open' (the friend is connected), 'msg' (a message from the friend), 'lost' (the connection to the friend is gone),
// 'error' (no connection: a PeerJS error type or 'timeout').
const Net = (function () {
  'use strict';
  const PREFIX = 'apex-racing-dirkaska-';   // (the public server is shared by everyone who uses PeerJS)
  const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // room codes: 4 of these (no 0/O or 1/I to mix up)
  const SILENT = 10000;   // ms without a word from the friend (pings and answers every 2 s, also in the background; race states 20 times a second): gone
  const SERVER_ERR = ['network', 'socket-closed', 'socket-error', 'server-error'];   // the connection to the PeerJS server (not to the friend) broke
  let peer = null, conn = null, role = null, handler = null, code = '';
  let offset = 0, bestRtt = Infinity, synced = false, fixed = false, lastRx = 0, quietTill = 0, pongs = [], timers = [];
  let fails = 0, retryT = null, lastTry = -1e9;
  let quick = false, paired = false, waiting = false, slot = 0, attempts = 0, qver = '', reopen = null;
  const QPLACES = 5;

  const opts = () => Object.assign({ debug: 0 }, window.__peerOpts || {});   // (the tests point it at their own server)
  const available = () => typeof window.Peer === 'function' && typeof window.RTCPeerConnection === 'function';
  const emit = (type, data) => { if (handler) { try { handler(type, data); } catch (e) { console.error(e); } } };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const every = (fn, ms) => { const t = setInterval(fn, ms); timers.push(t); return t; };
  const now = () => performance.now() + offset;   // the host's clock, in ms
  const newCode = () => { let s = ''; for (let i = 0; i < 4; i++) s += ABC[(Math.random() * ABC.length) | 0]; return s; };
  const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);

  function send(m) { if (conn && conn.open) { try { conn.send(m); } catch (_) { } } }

  function attach(c) {
    conn = c;
    let opened = false;
    c.on('open', () => {
      if (conn !== c) return;   // (an older connection that was replaced)
      opened = true;
      lastRx = performance.now();
      if (quick && !paired) { paired = true; if (role === 'host' && peer) { try { peer.disconnect(); } catch (_) { } } }   // (the place is free for the next pair; the line to the friend stays)
      emit('open');
      if (role === 'guest') {   // measure the host's clock: a burst now, then one ping every 2 s (it keeps the line alive too)
        for (let i = 0; i < 6; i++) later(() => send({ t: 'ping', a: performance.now() }), i * 120);
        every(() => send({ t: 'ping', a: performance.now() }), 2000);
      }
      every(() => { const t = performance.now(); if (conn === c && c.open && t - lastRx > SILENT && t > quietTill) lost('silent'); }, 1000);
    });
    c.on('data', (m) => {
      if (conn !== c) return;
      lastRx = performance.now();
      if (!m || typeof m !== 'object') return;
      if (m.t === 'full' && quick && role === 'guest') { const n = slot, was = conn; conn = null; paired = false; try { was.close(); } catch (_) { } clearTimers(); scan(n + 1, 0); return; }   // (someone was quicker: the next place)
      if (m.t === 'ping') { if (typeof m.a === 'number') send({ t: 'pong', a: m.a, h: performance.now() }); return; }
      if (m.t === 'pong') {   // the host's clock at the moment of the answer, half a round trip ago. Of the last 12 answers (~24 s) the one
        const t1 = performance.now(), rtt = t1 - m.a;   // with the shortest round trip counts: the least delayed (and the clocks may drift apart slowly)
        if (typeof m.h !== 'number' || !(rtt >= 0 && rtt < 5000)) return;
        pongs.push({ rtt, off: m.h + rtt / 2 - t1 }); if (pongs.length > 12) pongs.shift();
        const best = pongs.reduce((a, b) => (b.rtt < a.rtt ? b : a));
        if (!fixed || !synced) offset = best.off;   // (during a race the clock stays as it was at the start)
        bestRtt = best.rtt; synced = true;
        return;
      }
      emit('msg', m);
    });
    const ended = (why) => {
      if (conn !== c) return;
      if (quick && !opened) {   // (never connected: a waiting host just waits on; a guest tries the next place)
        conn = null; try { c.close(); } catch (_) { }
        if (role === 'guest') { clearTimers(); scan(slot + 1, 0); }
        return;
      }
      lost(why);
    };
    c.on('close', () => ended('close'));
    c.on('error', () => ended('error'));
  }
  // the friend's connection is gone (quiet: the game knows already, the friend said goodbye). The host's room stays open for someone new
  function lost(why, quiet) {
    const was = conn; conn = null; clearTimers(); retryT = null;
    try { if (was) was.close(); } catch (_) { }
    if (role === 'host' && !paired && peer && (peer.disconnected || peer.destroyed)) serverLost(peer, 'network');   // (its code back on the server)
    if (!quiet) emit('lost', why);
  }
  function clearTimers() { for (const t of timers) { clearTimeout(t); clearInterval(t); } timers = []; }

  // The host's connection to the PeerJS server broke (a network change, the app in the background, a server restart). The
  // room needs it only to be found, so while no friend is connected the host tries again with the same code (the server gives
  // it back to the same peer), at once when the network or the app is back, and gives up after about a minute. (PeerJS
  // reports the error first and then disconnects the peer, or destroys it if it never got in: then a new one, with a new code.)
  function serverLost(p, type) {
    if (peer !== p || role !== 'host' || retryT || paired || (conn && conn.open)) return;
    if (performance.now() - lastTry > 30000) fails = 0;   // (a new outage, not the same one going on: count again)
    if (fails >= 7) { later(() => emit('error', type), 0); return; }   // (not from inside the caller)
    retryT = later(() => retry(p), Math.min(10000, 800 * 2 ** fails));
  }
  function retry(p) {
    retryT = null; lastTry = performance.now();
    if (peer !== p || (conn && conn.open)) return;
    fails++;
    if (p.destroyed) reopen();
    else if (p.disconnected) { try { p.reconnect(); } catch (_) { } later(() => { if (peer === p && serverUp(p)) fails = 0; }, 5000); }   // (back for a while: a later drop counts from the start)
  }
  const serverUp = (p) => !!(p.open || (p.socket && p.socket._socket && p.socket._socket.readyState === 1));   // (the server takes a known peer back without saying "open": its WebSocket is up)
  function kick() {   // the network or the app is back: try now
    if (role !== 'host' || paired || !peer || (conn && conn.open) || !(peer.disconnected || peer.destroyed)) return;
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
  // register a peer under an id and wait for a friend. taken: the id is in use by someone else (see the callers)
  function openHost(id, onOpen, taken) {
    const p = peer = new Peer(id, opts());
    p.on('open', () => { if (peer !== p) return; fails = 0; onOpen(); });
    p.on('connection', (c) => {
      if (peer !== p) return;
      if (conn && conn.open) { c.on('open', () => { try { c.send({ t: 'full' }); } catch (_) { } setTimeout(() => c.close(), 400); }); return; }   // (a room is for two)
      if (conn) { const old = conn; conn = null; try { old.close(); } catch (_) { } }   // (a newer try wins over one still connecting)
      attach(c);
    });
    p.on('disconnected', () => { if (peer === p) serverLost(p, 'network'); });
    p.on('error', (e) => {
      if (peer !== p) return;
      if (e.type === 'unavailable-id') { p.destroy(); taken(); return; }
      if (conn && conn.open) return;   // (the server is not needed while the friend is connected)
      if (SERVER_ERR.includes(e.type)) { setTimeout(() => serverLost(p, e.type), 0); return; }   // (once PeerJS has disconnected or destroyed it)
      emit('error', e.type);
    });
  }

  // Quick match: no code. A few waiting places have fixed names on the public server (with the game's version in them, so that
  // different versions never meet). Whoever comes first takes the first free place and waits; whoever comes next finds it
  // taken (the server allows one peer per name) and connects to whoever is there. Once two are together the place is free again.
  // A place whose owner is gone without a word does not answer: after a few seconds the next place is tried.
  function quickMatch(ver, onEvent) {
    close(); handler = onEvent; quick = true; paired = false; offset = 0; synced = true; fixed = false; fails = 0; lastTry = -1e9; attempts = 0;
    qver = String(ver).replace(/[^A-Za-z0-9]/g, '');
    reopen = () => scan(0, 0);
    scan(0, 0);
    later(() => { if (quick && role === 'host' && !waiting) emit('error', 'network'); }, 30000);   // (no answer from the server at all)
  }
  const placeId = (n) => PREFIX + 'q' + qver + '-' + n;
  function forget() { const p = peer; peer = null; conn = null; waiting = false; try { if (p) p.destroy(); } catch (_) { } }
  function scan(n, round) {   // try to take place n and wait there; if it is taken, go to its owner
    if (!quick) return;
    if (n >= QPLACES) { if (round < 1) scan(0, round + 1); else emit('error', 'busy'); return; }
    forget(); role = 'host'; slot = n;
    openHost(placeId(n), () => { waiting = true; emit('wait'); }, () => meet(n, round));
  }
  function meet(n, round) {   // the place is taken: connect to the one who waits there
    if (!quick || ++attempts > 16) { if (quick) emit('error', 'busy'); return; }
    forget(); role = 'guest'; slot = n; bestRtt = Infinity; synced = false; pongs = [];
    const p = peer = new Peer(opts());
    p.on('open', () => { if (peer === p && !conn) attach(p.connect(placeId(n), { serialization: 'json', reliable: true })); });
    p.on('error', (e) => {
      if (peer !== p || (conn && conn.open)) return;
      if (e.type === 'peer-unavailable') { later(() => { if (peer === p) scan(n, round); }, 0); return; }   // (it just went: take the place)
      emit('error', e.type);
    });
    later(() => { if (peer === p && !(conn && conn.open)) scan(n + 1, round); }, 6000);   // (nobody answers: the place is a leftover)
  }
  // join the friend's room by its code
  function join(roomCode, onEvent) {
    close(); handler = onEvent; role = 'guest'; offset = 0; bestRtt = Infinity; synced = false; fixed = false; pongs = []; quick = false;
    code = normCode(roomCode);
    const p = peer = new Peer(opts());
    p.on('open', () => { if (peer === p && !conn) attach(p.connect(PREFIX + code, { serialization: 'json', reliable: true })); });   // (once: the server may say open again after a reconnect)
    p.on('error', (e) => { if (peer === p && !(conn && conn.open)) emit('error', e.type); });
    later(() => { if (peer === p && !(conn && conn.open)) emit('error', 'timeout'); }, 20000);
  }
  // leave: tell the friend, then close everything
  function close(bye) {
    if (bye) send({ t: 'bye' });
    const c = conn, p = peer;
    conn = null; peer = null; role = null; handler = null; code = ''; quick = false; paired = false; waiting = false; clearTimers(); retryT = null;
    setTimeout(() => { try { if (c) c.close(); } catch (_) { } try { if (p) p.destroy(); } catch (_) { } }, bye ? 300 : 0);
  }
  // the host: let this friend go (they said goodbye), keep the room
  function drop() { if (conn) lost('bye', true); }
  // a long job ahead (loading a track: a phone may not answer for seconds): nobody counts as gone before ms have passed (0: as usual again)
  function hold(ms) { quietTill = performance.now() + ms; }
  // during a race the clock does not move (the best ping may change; the start and the finish must be on the same clock)
  function fixClock(on) { fixed = !!on; }

  return {
    available, host, quickMatch, join, close, drop, hold, fixClock, send, now, normCode,
    get role() { return role; }, get code() { return code; }, get open() { return !!(conn && conn.open); },
    get synced() { return synced; }, get rtt() { return bestRtt; },
  };
})();
