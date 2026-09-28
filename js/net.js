/* =========================================================================
   NET — a race with a friend over the internet: two phones, directly connected
   ========================================================================= */
// The phones connect peer to peer (WebRTC, through the PeerJS library in js/vendor/). They find each other through the free
// public PeerJS server with a short room code; PeerJS also brings a relay (TURN) for networks where a direct connection is
// not possible. One reliable, ordered channel carries small JSON messages. The phone that made the room (host) keeps the
// clock: the other one measures the difference with pings, so that both can start the race at the same moment.
// Events for the game (onEvent(type, data)): 'code' (the host's room is ready), 'open' (the friend is connected), 'msg' (a
// message from the friend), 'lost' (the connection is gone), 'error' (no connection: a PeerJS error type or 'timeout').
const Net = (function () {
  'use strict';
  const PREFIX = 'apex-racing-dirkaska-';   // (the public server is shared by everyone who uses PeerJS)
  const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // room codes: 4 of these (no 0/O or 1/I to mix up)
  const SILENT = 10000;   // ms without a word from the friend (pings and answers every 2 s, also in the background; race states 20 times a second): gone
  let peer = null, conn = null, role = null, handler = null, code = '';
  let offset = 0, bestRtt = Infinity, synced = false, lastRx = 0, timers = [];

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
      every(() => { if (conn === c && c.open && performance.now() - lastRx > SILENT) lost('silent'); }, 1000);
    });
    c.on('data', (m) => {
      if (conn !== c) return;
      lastRx = performance.now();
      if (!m || typeof m !== 'object') return;
      if (m.t === 'ping') { send({ t: 'pong', a: m.a, h: performance.now() }); return; }
      if (m.t === 'pong') {   // the host's clock at the moment of the answer, half a round trip ago: the best (shortest) round trip counts
        const t1 = performance.now(), rtt = t1 - m.a;
        if (rtt >= 0 && rtt < bestRtt) { bestRtt = rtt; offset = m.h + rtt / 2 - t1; synced = true; }
        return;
      }
      emit('msg', m);
    });
    c.on('close', () => { if (conn === c) lost('close'); });
    c.on('error', () => { if (conn === c) lost('error'); });
  }
  function lost(why) {
    const was = conn; conn = null; clearTimers();
    try { if (was) was.close(); } catch (_) { }
    if (role === 'host' && peer && peer.disconnected && !peer.destroyed) { try { peer.reconnect(); } catch (_) { } }   // (the room waits for someone new: its code back on the server)
    emit('lost', why);
  }
  function clearTimers() { for (const t of timers) { clearTimeout(t); clearInterval(t); } timers = []; }

  // make a room: a new code each time (another one if the code is taken)
  function host(onEvent) {
    close(); handler = onEvent; role = 'host'; offset = 0; synced = true;
    const open = (tries) => {
      code = newCode();
      const p = peer = new Peer(PREFIX + code, opts());
      p.on('open', () => { if (peer === p) emit('code', code); });
      p.on('connection', (c) => {
        if (peer !== p) return;
        if (conn && conn.open) { c.on('open', () => { try { c.send({ t: 'full' }); } catch (_) { } setTimeout(() => c.close(), 400); }); return; }   // (a room is for two)
        attach(c);
      });
      p.on('disconnected', () => { if (peer === p && !(conn && conn.open)) { try { p.reconnect(); } catch (_) { } } });   // (still waiting for the friend: keep the code alive)
      p.on('error', (e) => {
        if (peer !== p) return;
        if (e.type === 'unavailable-id' && tries < 5) { p.destroy(); open(tries + 1); return; }
        if (conn && conn.open) return;   // (the server is not needed any more once the friend is connected)
        emit('error', e.type);
      });
    };
    open(0);
  }
  // join the friend's room by its code
  function join(roomCode, onEvent) {
    close(); handler = onEvent; role = 'guest'; offset = 0; bestRtt = Infinity; synced = false;
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
    conn = null; peer = null; role = null; handler = null; code = ''; clearTimers();
    setTimeout(() => { try { if (c) c.close(); } catch (_) { } try { if (p) p.destroy(); } catch (_) { } }, bye ? 300 : 0);
  }

  return {
    available, host, join, close, send, now, normCode,
    get role() { return role; }, get code() { return code; }, get open() { return !!(conn && conn.open); },
    get synced() { return synced; }, get rtt() { return bestRtt; },
  };
})();
