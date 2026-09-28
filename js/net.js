/* =========================================================================
   NET — a race with a friend over the internet: two phones, directly connected
   ========================================================================= */
// The phones connect peer to peer (WebRTC, through the PeerJS library in js/vendor/). They find each other through the free
// public PeerJS server with a short room code; PeerJS also brings a relay (TURN) for networks where a direct connection is
// not possible. One reliable, ordered channel carries small JSON messages. The phone that made the room (host) keeps the
// clock: the other one measures the difference with pings, so that both can start the race at the same moment.
// Events for the game (onEvent(type, data)): 'code' (the host's room is ready; again when a lost server connection is back),
// 'open' (the friend is connected), 'msg' (a message from the friend), 'lost' (the connection to the friend is gone),
// 'error' (no connection: a PeerJS error type or 'timeout').
const Net = (function () {
  'use strict';
  const PREFIX = 'apex-racing-dirkaska-';   // (the public server is shared by everyone who uses PeerJS)
  const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // room codes: 4 of these (no 0/O or 1/I to mix up)
  const SILENT = 10000;   // ms without a word from the friend (pings and answers every 2 s, also in the background; race states 20 times a second): gone
  const SERVER_ERR = ['network', 'socket-closed', 'socket-error', 'server-error'];   // the connection to the PeerJS server (not to the friend) broke
  let peer = null, conn = null, role = null, handler = null, code = '';
  let offset = 0, bestRtt = Infinity, synced = false, lastRx = 0, quietTill = 0, pongs = [], timers = [];
  let fails = 0, retryT = null;

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
    c.on('open', () => {
      if (conn !== c) return;   // (an older connection that was replaced)
      lastRx = performance.now(); emit('open');
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
      if (m.t === 'ping') { if (typeof m.a === 'number') send({ t: 'pong', a: m.a, h: performance.now() }); return; }
      if (m.t === 'pong') {   // the host's clock at the moment of the answer, half a round trip ago. Of the last 12 answers (~24 s) the one
        const t1 = performance.now(), rtt = t1 - m.a;   // with the shortest round trip counts: the least delayed (and the clocks may drift apart slowly)
        if (typeof m.h !== 'number' || !(rtt >= 0 && rtt < 5000)) return;
        pongs.push({ rtt, off: m.h + rtt / 2 - t1 }); if (pongs.length > 12) pongs.shift();
        const best = pongs.reduce((a, b) => (b.rtt < a.rtt ? b : a));
        offset = best.off; bestRtt = best.rtt; synced = true;
        return;
      }
      emit('msg', m);
    });
    c.on('close', () => { if (conn === c) lost('close'); });
    c.on('error', () => { if (conn === c) lost('error'); });
  }
  // the friend's connection is gone (quiet: the game knows already, the friend said goodbye). The host's room stays open for someone new
  function lost(why, quiet) {
    const was = conn; conn = null; clearTimers(); retryT = null;
    try { if (was) was.close(); } catch (_) { }
    if (role === 'host' && peer && (peer.disconnected || peer.destroyed)) serverLost(peer, 'network');   // (its code back on the server)
    if (!quiet) emit('lost', why);
  }
  function clearTimers() { for (const t of timers) { clearTimeout(t); clearInterval(t); } timers = []; }

  // The host's connection to the PeerJS server broke (a network change, the app in the background, a server restart). The
  // room needs it only to be found, so while no friend is connected the host tries again with the same code (the server gives
  // it back to the same peer), at once when the network or the app is back, and gives up after about a minute. (PeerJS
  // reports the error first and then disconnects the peer, or destroys it if it never got in: then a new one, with a new code.)
  function serverLost(p, type) {
    if (peer !== p || role !== 'host' || retryT || (conn && conn.open)) return;
    if (fails >= 7) { emit('error', type); return; }
    retryT = later(() => retry(p), Math.min(10000, 800 * 2 ** fails));
  }
  function retry(p) {
    retryT = null;
    if (peer !== p || (conn && conn.open)) return;
    fails++;
    if (p.destroyed) openRoom(0);
    else if (p.disconnected) { try { p.reconnect(); } catch (_) { } }
  }
  function kick() {   // the network or the app is back: try now
    if (role !== 'host' || !peer || (conn && conn.open) || !(peer.disconnected || peer.destroyed)) return;
    if (retryT) { clearTimeout(retryT); retryT = null; }
    retry(peer);
  }
  window.addEventListener('online', kick);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  // make a room: a new code each time (another one if the code is taken)
  function host(onEvent) {
    close(); handler = onEvent; role = 'host'; offset = 0; synced = true; fails = 0;
    openRoom(0);
    later(() => { if (role === 'host' && !code) emit('error', 'network'); }, 30000);   // (no answer from the server at all)
  }
  function openRoom(tries) {
    const want = newCode(), p = peer = new Peer(PREFIX + want, opts());
    p.on('open', () => { if (peer !== p) return; fails = 0; code = want; emit('code', code); });
    p.on('connection', (c) => {
      if (peer !== p) return;
      if (conn && conn.open) { c.on('open', () => { try { c.send({ t: 'full' }); } catch (_) { } setTimeout(() => c.close(), 400); }); return; }   // (a room is for two)
      if (conn) { const old = conn; conn = null; try { old.close(); } catch (_) { } }   // (a newer try wins over one still connecting)
      attach(c);
    });
    p.on('disconnected', () => { if (peer === p) serverLost(p, 'network'); });
    p.on('error', (e) => {
      if (peer !== p) return;
      if (e.type === 'unavailable-id' && tries < 5) { p.destroy(); openRoom(tries + 1); return; }
      if (conn && conn.open) return;   // (the server is not needed while the friend is connected)
      if (SERVER_ERR.includes(e.type)) { setTimeout(() => serverLost(p, e.type), 0); return; }   // (once PeerJS has disconnected or destroyed it)
      emit('error', e.type);
    });
  }
  // join the friend's room by its code
  function join(roomCode, onEvent) {
    close(); handler = onEvent; role = 'guest'; offset = 0; bestRtt = Infinity; synced = false; pongs = [];
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
    conn = null; peer = null; role = null; handler = null; code = ''; clearTimers(); retryT = null;
    setTimeout(() => { try { if (c) c.close(); } catch (_) { } try { if (p) p.destroy(); } catch (_) { } }, bye ? 300 : 0);
  }
  // the host: let this friend go (they said goodbye), keep the room
  function drop() { if (conn) lost('bye', true); }
  // a long job ahead (loading a track: a phone may not answer for seconds): nobody counts as gone before ms have passed
  function hold(ms) { quietTill = Math.max(quietTill, performance.now() + ms); }

  return {
    available, host, join, close, drop, hold, send, now, normCode,
    get role() { return role; }, get code() { return code; }, get open() { return !!(conn && conn.open); },
    get synced() { return synced; }, get rtt() { return bestRtt; },
  };
})();
