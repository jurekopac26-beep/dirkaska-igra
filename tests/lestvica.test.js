// The friends' leaderboard (js/lestvica.js, docs/lestvica-prijateljev.md; no browser: Node has WebCrypto and the deflate streams; the
// game itself in tests/browser/lestvica.test.mjs):
// 1. a link there and back: the sender's times, nickname and id as they were sent; the friends' packets the sender has go with it
//    (stran Odločitve 3, lp-povezava 2), as many as fit in 16 000 characters, the friend heard from last first
// 2. the signature: a changed character of a packet, a cut link, another player's signature, a packet of another kind or version, a
//    link of another kind: not taken; a broken friend's packet in a good link is left out, the rest taken
// 3. the bound (the fastest a run could be): on every real track the winner of the reference races (tests/golden/races.json: the usual
//    field, the formulas, the prototypes, the newer road car) is more than 1.2 times slower, and the bound at least 0.35 times the
//    winner's time; the run from the police to the building at the top shorter than the whole road
// 4. merging: each time the best its owner ever sent; the same link twice changes nothing; an older packet after a newer one spoils
//    nothing (the nickname of the newest); the player's own link; a hidden friend (and the player's yes); times faster than the bound
//    dropped; at most 40 friends (the one heard from longest ago goes) and 600 times
// 5. the size: every record of every track (both physics, the rain, every way to drive) in one link: at most 8 000 characters
// 6. the nickname: printable, at most 16 characters; two players with one nickname: (2); the player's own times from the records
//    (the time, its day and car as first seen) and the record keys as the game makes them
//   node tests/lestvica.test.js
'use strict';
const path = require('path');
const { loadCore } = require('./lib/core.js');
const { trackIds } = require('./lib/sim.js');
const L = require(path.join(__dirname, '..', 'js', 'lestvica.js'));
const GOLD = require(path.join(__dirname, 'golden', 'races.json'));

let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const store = () => { const m = new Map(); return { m, getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const J = JSON.stringify, subtle = crypto.subtle, canon = (o) => J(Object.keys(o).sort().map(k => [k, o[k]]));   // (canon: the same times whatever their order)
const b64u = (u8) => Buffer.from(u8).toString('base64url');
const DAY = 864e5, NOW = Date.UTC(2026, 10, 6, 12);

// a player: their own store, key pair and packet
async function player(name, t, now) { const s = store(); L.use(s); const pk = await L.packet(name, t, now || NOW); const M = await L.me(false); return { s, pk, id: M.id, name }; }
// open a link in a player's game: the store, the merge's answer
async function open(P, z, opts) { L.use(P.s); const r = await L.readLink(z, NOW); if (!r) return null; const S = L.load(), M = await L.me(false); const R = L.merge(S, r.packets, Object.assign({ me: M && M.id, now: NOW }, opts || {})); L.save(S); return { r, R, S }; }
const unpackLink = async (z) => JSON.parse(await L.unpack(z));
const repack = (o) => L.pack(J(o));

(async () => {
  const C = loadCore();
  // 1. there and back
  {
    const A = await player('Lisica', { 'spa@cs': [134310, 309, 'vortex'], 'vrsic-tt@cs': [401000, 0, null], 'pikes-race@nova': [612345, 310, 'kaze'] });
    const l = await L.link(A.pk, []), B = await player('Turbo Tina', {}), o = await open(B, l.z);
    const F = o && o.S.friends[A.id];
    check('a link opens in a friend\'s game: the sender\'s id, nickname and every time as sent', !!F && F.name === 'Lisica' && J(F.t) === J({ 'spa@cs': [134310, 309, 'vortex'], 'vrsic-tt@cs': [401000, 0, null], 'pikes-race@nova': [612345, 310, 'kaze'] }) && /^[\w-]{12}$/.test(A.id),
      F ? J(F) .slice(0, 160) : 'not taken');
    check('the answer: a new friend, 3 times, all new; the key of the newest time', o && o.R.from.isNew && o.R.from.n === 3 && o.R.from.news === 3 && o.R.last === 'pikes-race@nova', o && J(o.R));
    // the group: B's link carries A's packet unchanged; C gets both
    L.use(B.s); const bp = await L.packet('Turbo Tina', { 'spa@cs': [135000, 310, null] }, NOW), lb = await L.link(bp, L.forward(L.load()));
    const Cc = await player('Kapitan K', {}), oc = await open(Cc, lb.z);
    check('a friend\'s link brings the friends they have, each signed by its owner (lp-povezava 2)', lb.n === 1 && oc && Object.keys(oc.S.friends).length === 2 && oc.S.friends[A.id].t['spa@cs'][0] === 134310 && oc.R.from.name === 'Turbo Tina' && oc.R.others.length === 1 && oc.R.others[0].name === 'Lisica',
      oc && J(oc.R));
    const o2 = await unpackLink(lb.z);
    check('the friend\'s packet goes on exactly as its owner signed it', o2.p[1][0] === A.pk[0] && o2.p[1][1] === A.pk[1]);
    // as many as fit: 45 friends of 120 times each do not all fit in 16 000 characters
    const many = []; for (let i = 0; i < 45; i++) { const t = {}; for (let k = 0; k < 120; k++) t['t' + k + '@cs'] = [100000 + Math.floor(Math.random() * 9e6), 300 + (k % 9), null]; many.push((await player('P' + i, t)).pk); }
    L.use(store()); const own = await L.packet('Ja', { 'spa@cs': [130000, 311, null] }, NOW), lm = await L.link(own, many);
    const om = await unpackLink(lm.z);
    check('a link of many friends: as many as fit in 16 000 characters, the first ones of the list', lm.z.length <= 16000 && lm.n > 3 && lm.n < 45 && om.p.length === lm.n + 1 && om.p[1][1] === many[0][1], lm.z.length + ' characters, ' + lm.n + ' friends');
  }

  // 2. the signature
  {
    const A = await player('Lisica', { 'spa@cs': [134310, 309, null] }), l = await L.link(A.pk, []), o = await unpackLink(l.z);
    const B = await player('Tina', {});
    const tryLink = async (obj) => { L.use(B.s); return L.readLink(await repack(obj), NOW); };
    const ch = J(o); const t1 = JSON.parse(ch); t1.p[0][0] = t1.p[0][0].replace('134310', '124310');
    check('a changed time in the packet: not taken', (await tryLink(t1)) === null);
    const t2 = JSON.parse(ch); t2.p[0][0] = t2.p[0][0].replace('Lisica', 'Lisicb');
    check('a changed nickname: not taken', (await tryLink(t2)) === null);
    let cut = 0; for (const k of [1, 5, 20, Math.floor(l.z.length / 2)]) { L.use(B.s); if ((await L.readLink(l.z.slice(0, l.z.length - k), NOW)) === null) cut++; }
    check('a cut link: not taken', cut === 4, cut + ' of 4');
    let flip = 0; for (let i = 0; i < 12; i++) { const at = 20 + Math.floor((l.z.length - 40) * i / 12), z = l.z.slice(0, at) + (l.z[at] === 'Q' ? 'R' : 'Q') + l.z.slice(at + 1); L.use(B.s); if ((await L.readLink(z, NOW)) === null) flip++; }
    check('one character of the link changed (12 places): not taken', flip === 12, flip + ' of 12');
    const X = await player('Lisica', { 'spa@cs': [134310, 309, null] }), t3 = JSON.parse(ch); t3.p[0][1] = X.pk[1];
    check('another player\'s signature: not taken', (await tryLink(t3)) === null);
    const t4 = JSON.parse(ch); const pk4 = JSON.parse(t4.p[0][0]); pk4.pub = JSON.parse(X.pk[0]).pub; t4.p[0][0] = J(pk4);
    check('another player\'s key with the signature of the first: not taken', (await tryLink(t4)) === null);
    // packets signed right but of another kind, version or app: a key pair of the test's own
    const kp = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']), pub = b64u(new Uint8Array(await subtle.exportKey('raw', kp.publicKey)));
    const signed = async (body) => [body, b64u(new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, new TextEncoder().encode(body))))];
    const base = { app: 'apex-racing', kind: 'times', v: 1, pub, name: 'Lisica', sent: Math.floor(NOW / 1000), t: { 'spa@cs': [134310, 309, null] } };
    const good = await signed(J(base));
    check('a packet signed right: taken', !!(await L.readPacket(good, NOW)));
    const kinds = [['kind', 'challenge'], ['v', 2], ['app', 'other'], ['sent', Math.floor(NOW / 1000) + 2 * 86400], ['t', []]];
    let rej = 0; for (const [k, v] of kinds) if ((await L.readPacket(await signed(J(Object.assign({}, base, { [k]: v }))), NOW)) === null) rej++;
    check('signed right, but another kind, version, app, sent two days ahead, times not an object: not taken', rej === kinds.length, rej + ' of ' + kinds.length);
    const t601 = {}; for (let k = 0; k < 601; k++) t601['t' + k + '@cs'] = [1000 + k, 0, null];
    check('more than 600 times: not taken', (await L.readPacket(await signed(J(Object.assign({}, base, { t: t601 }))), NOW)) === null);
    const odd = await L.readPacket(await signed(J(Object.assign({}, base, { t: { 'spa@cs': [134310, 309, null], 'BAD KEY': [1, 0, null], 'x@cs': [-5, 0, null], 'y@cs': [5.5, 0, null], 'z@cs': [5, 0, '<b>'] } }))), NOW);
    check('times of an unknown form are left out, the rest taken', !!odd && J(odd.t) === J({ 'spa@cs': [134310, 309, null] }), odd && J(odd.t));
    const wk = JSON.parse(ch); wk.kind = 'ghost';
    check('a link of another kind: not taken', (await tryLink(wk)) === null);
    // a broken friend's packet in a good link: left out, the rest taken
    L.use(A.s); const brokenF = [X.pk[0].replace('134310', '100000'), X.pk[1]], lb = await L.link(A.pk, [brokenF, (await player('Kapitan K', { 'spa@cs': [140000, 0, null] })).pk]);
    L.use(B.s); const rb = await L.readLink(lb.z, NOW);
    check('a broken friend\'s packet in a good link is left out, the rest taken', !!rb && rb.packets.length === 2 && rb.bad === 1 && rb.packets[1].name === 'Kapitan K', rb && J({ n: rb.packets.length, bad: rb.bad }));
    L.use(B.s); const bp = await L.link(brokenF, [A.pk]);
    check('a link whose first packet is broken: not taken', (await L.readLink(bp.z, NOW)) === null);
    check('not base64url, empty, or not a link at all: not taken', (await L.readLink('ab$cd', NOW)) === null && (await L.readLink('', NOW)) === null && (await L.readLink(b64u(Buffer.from('hello')), NOW)) === null);
  }

  // 3. the bound
  {
    const ids = trackIds(C), table = L.keyTable(C.TRACKS), low = [], high = [];
    let pairs = 0, minR = 9, maxR = 0;
    for (const id of ids) {
      const d = C.TRACKS.find(x => x.id === id), T = new C.Track(d), tt = !!d.timeTrial;
      const b = T.open ? L.bound(T, { kind: tt ? 'tt' : 'up' }, C.MODELS) : L.bound(T, { kind: 'lap' }, C.MODELS) * (id === 'nring' || id === 'livorno' || id === 'hakone' ? 1 : 2);   // (the reference races: two laps, one of the long ones as in tests/races.test.js)
      for (const v of ['cs', 'cs/formula', 'cs/lm', 'cs/car']) {
        const g = GOLD[id + '/' + v]; if (!g || !(g.winner > 0)) continue;
        pairs++; const r = g.winner / b; minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        if (!(r > 1.2)) low.push(id + '/' + v + ' ' + g.winner + ' s, bound ' + b.toFixed(1) + ' s');
        if (!(b >= 0.35 * g.winner)) high.push(id + '/' + v + ' ' + g.winner + ' s, bound ' + b.toFixed(1) + ' s');
      }
    }
    check(`every real track: the reference winners are more than 1.2 times slower than the bound (${pairs} races, ${minR.toFixed(2)}..${maxR.toFixed(2)})`, pairs > ids.length * 2 && !low.length, low.join('; '));
    check('every real track: the bound is at least 0.35 times the winner\'s time', !high.length, high.join('; '));
    const vr = C.TRACKS.find(x => x.id === 'vrsic'), TV = new C.Track(vr), bp = L.bound(TV, table.get('vrsic-police@cs'), C.MODELS), bu = L.bound(TV, table.get('vrsic@cs'), C.MODELS);
    const bh = L.bound(TV, { kind: 'police' }, C.MODELS), bt = L.bound(TV, table.get('vrsic-tt@cs'), C.MODELS), share = (vr.hideout.s) / (TV.finishS - TV.startS);
    check('the run from the police: to the building at the top (def.hideout), the others from the start to the finish', bp > 0 && Math.abs(bp / bu - share) < 0.02 && bh === bp && bt === bu, bp.toFixed(1) + ' s, ' + bu.toFixed(1) + ' s, the building at ' + share.toFixed(3) + ' of the road');
    check('the top speed of the fastest car: 80..110 m/s', L.topSpeed(C.MODELS) > 80 && L.topSpeed(C.MODELS) < 110, L.topSpeed(C.MODELS).toFixed(1) + ' m/s');
  }

  // 4. merging
  {
    const A = store(); L.use(A); const old = await L.packet('Lisica', { 'spa@cs': [134000, 300, null], 'suzuka@cs': [150000, 300, null] }, NOW - 5 * DAY);
    const nu = await L.packet('Lisica Nova', { 'spa@cs': [135000, 305, null], 'monza@cs': [100000, 306, 'kaze'] }, NOW);
    const idA = (await L.me(false)).id;
    const B = await player('Tina', {});
    const lNew = await L.link(nu, []), lOld = await L.link(old, []);
    let o = await open(B, lNew.z); o = await open(B, lOld.z);
    const F = o.S.friends[idA];
    check('each time the best its owner ever sent; the nickname of the newest packet; the newest packet kept to send on', F.t['spa@cs'][0] === 134000 && F.t['suzuka@cs'][0] === 150000 && F.t['monza@cs'][0] === 100000 && F.name === 'Lisica Nova' && F.pk[1] === nu[1], J({ name: F.name, t: F.t }));
    const o3 = await open(B, lNew.z);
    check('the same link again: nothing new', L.nothingNew(o3.R) && J(o3.S.friends[idA].t) === J(F.t), J(o3.R.from));
    const C2 = await player('Kapitan K', {}); await open(C2, lOld.z); const o4 = await open(C2, lNew.z);
    check('the other order gives the same', canon(o4.S.friends[idA].t) === canon(F.t) && o4.S.friends[idA].name === 'Lisica Nova' && o4.R.from.renamed);
    L.use(B.s); const myL = await L.link(await L.packet('Tina', {}, NOW), []), oo = await open(B, myL.z);
    check('the player\'s own link: that, and nothing taken', oo.R.own && !oo.R.from && Object.keys(oo.S.friends).length === 1);
    // hidden: removed, the next link brings nothing; the friend's own link with the player's yes brings them back
    L.use(B.s); let S = L.load(); L.remove(S, idA); L.save(S);
    const oh = await open(B, lNew.z);
    check('a friend taken off: their link brings nothing (hidden)', !oh.S.friends[idA] && oh.R.from.hidden && oh.R.hidden[0] === 'Lisica Nova');
    const ou = await open(B, lNew.z, { unhide: true });
    check('their own link with the player\'s yes: back, and no longer hidden', !!ou.S.friends[idA] && ou.S.hidden.indexOf(idA) < 0);
    // a hidden friend's packet in another's link: left out without asking
    L.use(B.s); S = L.load(); L.remove(S, idA); L.save(S);
    const Dd = await player('Dora', {}); L.use(Dd.s); const lD = await L.link(await L.packet('Dora', { 'spa@cs': [139000, 0, null] }, NOW), [nu]);
    const od = await open(B, lD.z, { unhide: true });
    check('a hidden friend in another\'s link: left out, even when the sender\'s is taken with a yes', !od.S.friends[idA] && od.R.hidden.length === 1 && !!od.S.friends[Dd.id]);
    // the bound: a time faster than the track allows is dropped
    const E = await player('Hitri', { 'spa@cs': [9000, 0, null], 'suzuka@cs': [150000, 0, null] }), Fp = await player('Tina', {});
    L.use(E.s); const lE = await L.link(E.pk, []);
    const oe = await open(Fp, lE.z, { bound: (k) => (k === 'spa@cs' ? 60 : 0) });
    check('a time faster than the bound is dropped (and counted)', oe.R.impossible === 1 && !oe.S.friends[E.id].t['spa@cs'] && !!oe.S.friends[E.id].t['suzuka@cs']);
    // rows: the bound known later still hides a time kept before it was
    const G = await player('Tina', {}), og = await open(G, lE.z);
    check('a time kept before its bound was known is not shown once it is', L.rows(og.S, 'spa@cs', null, 0).length === 1 && L.rows(og.S, 'spa@cs', null, 60).length === 0);
    // 40 friends: the 41st pushes out the one heard from longest ago
    const H = await player('Tina', {}); L.use(H.s); S = L.load();
    const fr = []; for (let i = 0; i < 41; i++) { const P = await player('F' + i, { 'spa@cs': [140000 + i, 0, null] }); fr.push(P); L.use(H.s); const r = await L.readLink((await L.link(P.pk, [])).z, NOW); L.merge(S, r.packets, { now: NOW + i * 1000 }); }
    check('at most 40 friends: the 41st pushes out the one heard from longest ago', Object.keys(S.friends).length === 40 && !S.friends[fr[0].id] && !!S.friends[fr[40].id]);
    const R41 = L.merge(S, [ (await L.readLink((await L.link((await player('F41', {})).pk, [])).z, NOW)).packets[0] ], { now: NOW + 99000 });
    check('the one pushed out is named', R41.evicted.length === 1 && R41.evicted[0] === 'F1', J(R41.evicted));
    // 600 times: a friend's merged times stay at most 600 (the newest kept)
    const t1 = {}, t2 = {}; for (let k = 0; k < 400; k++) { t1['a' + k + '@cs'] = [1000 + k, 10, null]; t2['b' + k + '@cs'] = [1000 + k, 20, null]; }
    const K = store(); L.use(K); const p1 = await L.packet('Mnogo', t1, NOW - DAY), p2 = await L.packet('Mnogo', t2, NOW);
    const M2 = await player('Tina', {}); await open(M2, (await L.link(p1, [])).z); L.use(K); const om2 = await open(M2, (await L.link(p2, [])).z);
    const tk = Object.keys(om2.S.friends[Object.keys(om2.S.friends)[0]].t);
    check('at most 600 times kept of a friend: the newest', tk.length === 600 && tk.filter(k => k[0] === 'b').length === 400, tk.length + ' times');
    // stored and read back the same; a store edited by hand keeps only what is of the right form
    L.use(B.s); const S1 = L.load(); L.save(S1); const S2 = L.load();
    check('the store read back as it was saved', J(S1) === J(S2));
    const bad1 = store(); bad1.setItem('tdgp-lp', J({ v: 1, friends: { 'short': {}, 'abcdefghijkl': { name: '<b>x</b>\u0007', pub: 'x', sent: 1, t: {} }, 'ABCDEFGHIJKL': { name: 'Ok', pub: 'a'.repeat(87), sent: 5, got: 7, t: { 'spa@cs': [1, 0, null], 'q': 5 }, pk: 'no' } }, hidden: ['ABCDEFGHIJKL', 'zzzzzzzzzzzz', 5], mine: { 'spa@cs': [5, 0, null] } }));
    L.use(bad1); const SB = L.load();
    check('a store edited by hand: only friends and times of the right form', J(Object.keys(SB.friends)) === J(['ABCDEFGHIJKL']) && J(SB.friends.ABCDEFGHIJKL.t) === J({ 'spa@cs': [1, 0, null] }) && SB.friends.ABCDEFGHIJKL.pk === null && J(SB.hidden) === J(['zzzzzzzzzzzz']), J(SB));
  }

  // 5. the size
  {
    const table = L.keyTable(C.TRACKS), t = {}, cars = C.MODELS.map(m => m.id); let i = 0;
    for (const k of table.keys()) { t[k] = [60000 + Math.floor(Math.random() * 600000), 300 + (i % 20), cars[i % cars.length]]; i++; }
    const P = await player('Turbo Tina', t), l = await L.link(P.pk, []);
    check(`every record of every track (${Object.keys(t).length} times) in one link: at most 8 000 characters`, l.z.length <= 8000 && l.n === 0, l.z.length + ' characters');
    check('...and it opens with all of them', ((await L.readLink(l.z, NOW)) || { packets: [{ t: {} }] }).packets[0].t && Object.keys((await L.readLink(l.z, NOW)).packets[0].t).length === Object.keys(t).length);
  }

  // 6. nicknames, the player's own times, the record keys
  {
    check('a nickname: printable, single spaces, at most 16 characters', L.cleanName('  Lisica\u0007\n  K ') === 'Lisica K' && L.cleanName('x'.repeat(30)).length === 16 && L.cleanName('<img src=x onerror=alert(1)>') === '<img src=x onerr' && L.cleanName({}) === '');
    const S = { friends: {
      aaaaaaaaaaaa: { name: 'Lisica', since: 1, t: { 'spa@cs': [134000, 0, null] } }, bbbbbbbbbbbb: { name: 'lisica', since: 2, t: { 'spa@cs': [133000, 0, null] } },
      cccccccccccc: { name: 'Kapitan K', since: 3, t: { 'spa@cs': [136000, 0, 'kaze'] } } }, hidden: [], mine: {} };
    const nm = L.names(S);
    check('two players with one nickname: the second is (2)', nm.aaaaaaaaaaaa === 'Lisica' && nm.bbbbbbbbbbbb === 'lisica (2)' && nm.cccccccccccc === 'Kapitan K', J(nm));
    const rs = L.rows(S, 'spa@cs', { name: 'Tina', ms: 135000 }), pl = L.place(rs);
    check('the table: the fastest first, the player in it; their place, who is ahead and by how much', rs.map(r => r.name).join() === 'lisica (2),Lisica,Tina,Kapitan K' && pl.at === 3 && pl.n === 4 && pl.ahead.name === 'Lisica' && pl.gap === 1000, J(rs.map(r => [r.name, r.ms])));
    check('an equal time: the player first; not in the table without a time', L.place(L.rows(S, 'spa@cs', { name: 'Tina', ms: 134000 })).at === 2 && L.place(L.rows(S, 'spa@cs', null)) === null);
    const table = L.keyTable(C.TRACKS);
    const has = ['spa@cs', 'spa@nova', 'vrsic@cs', 'vrsic-tt@cs', 'vrsic-tt-wet@nova', 'vrsic-traffic@cs', 'vrsic-police@cs', 'pikes@cs', 'pikes-wet@cs', 'pikes-race@cs', 'pikesg-race@nova', 'ouninpohja2@cs', 'ouninpohja2-wet@cs'];
    const not = ['ouninpohja@cs', 'spa-wet@cs', 'vrsic-race@cs', 'pikes-tt@cs', 'vrsic-wet@cs'];
    check('the record keys as the game makes them (recId, the way to drive, the rain of a time trial, the physics)', has.every(k => table.has(k)) && not.every(k => !table.has(k)), has.filter(k => !table.has(k)).concat(not.filter(k => table.has(k))).join());
    check('which time each key is', table.get('spa@cs').kind === 'lap' && table.get('vrsic@cs').kind === 'up' && table.get('vrsic-tt@cs').kind === 'tt' && table.get('vrsic-police@cs').kind === 'police' && table.get('vrsic-traffic@cs').kind === 'traffic' && table.get('pikes@cs').kind === 'tt' && table.get('pikes-race@cs').kind === 'up' && table.get('ouninpohja2@cs').kind === 'tt');
    const day0 = L.dayOf(NOW), St = { friends: {}, hidden: [], mine: {}, seen: false };
    const recs = { 'spa@cs': { bestLap: 134.3101, bestRace: 300 }, 'vrsic-tt@cs': { bestTime: 401.5, board: [{ time: 401.5, carId: 'vortex', date: NOW - 3 * DAY }] }, 'vrsic@cs': { bestRace: 420.25 }, 'vrsic-police@cs': { bestRace: 380, escapes: 2 }, 'xx@cs': { bestLap: 5 } };
    let own = L.ownTimes(St, recs, table, { now: NOW });
    check('the player\'s times from the records: the time of each key\'s kind', canon(own.t) === canon({ 'spa@cs': [134310, 0, null], 'vrsic@cs': [420250, 0, null], 'vrsic-tt@cs': [401500, day0 - 3, 'vortex'], 'vrsic-police@cs': [380000, 0, null] }), J(own.t));
    check('the times there were before the leaderboard: no day (a time trial\'s from its board)', own.changed && St.seen);
    recs['spa@cs'].bestLap = 133.9; own = L.ownTimes(St, recs, table, { now: NOW + DAY, cars: { 'spa@cs': 'kaze' } });
    check('a new time: the day it is first seen and the car the game says set it', J(own.t['spa@cs']) === J([133900, day0 + 1, 'kaze']) && own.changed);
    own = L.ownTimes(St, recs, table, { now: NOW + 5 * DAY });
    check('the same time later: its day and car kept', J(own.t['spa@cs']) === J([133900, day0 + 1, 'kaze']) && !own.changed);
    check('a day as a date and back', L.dayOf(L.dateOf(day0)) === day0 && L.dayOf(Date.UTC(2026, 0, 1)) === 1 && L.dayOf(Date.UTC(2025, 5, 1)) === 0);
  }

  console.log(`\n${n - bad} / ${n} OK`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
