// The saved game kept safe (js/shramba.js, no browser; the game itself in tests/browser/shramba.test.mjs). A store that fills up as
// Chromium's localStorage does (keys and values counted in characters, about 5.2 million for the page): a save that does not fit makes
// room by dropping ghosts, the Pikes Peak legends first, then friends' ghosts, then the other physics' own, then the rest, largest first
// in each group, only as many as it needs; the progress and other keys are never dropped; a save that cannot fit even without ghosts
// fails without a word (and false); another error is no reason to drop anything. The reminder on the results (from the fifth race, a
// month after the last file, a week after Ne zdaj). A copy's contents (no ghosts, not the device's own, the missions' records beside)
// and its numbers; a copy put back (the keys it did not have removed, the ghosts untouched; the saved game as it was when it does not
// fit). The browser asked to keep the storage once.
//   node tests/shramba.test.js
'use strict';
const path = require('path');
const Shramba = require(path.join(__dirname, '..', 'js', 'shramba.js'));
let bad = 0, n = 0;
const check = (name, ok, detail) => { n++; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const J = JSON.stringify;

// a localStorage of quota characters (keys and values), throwing as Chromium does when it is full; removed: the keys removed, in order
function makeStore(quota, opts = {}) {
  const m = new Map(), removed = [];
  const used = () => { let u = 0; for (const [k, v] of m) u += k.length + v.length; return u; };
  return {
    m, removed, used,
    get length() { return m.size; },
    key(i) { return [...m.keys()][i] ?? null; },
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) {
      if (opts.deny) { const e = new Error('denied'); e.name = 'SecurityError'; e.code = 18; throw e; }
      v = String(v); const old = m.has(k) ? k.length + m.get(k).length : 0;
      if (used() - old + k.length + v.length > quota) { const e = new Error('full'); e.name = 'QuotaExceededError'; e.code = 22; throw e; }
      m.set(k, v);
    },
    removeItem(k) { if (m.delete(k)) removed.push(k); },
    clear() { m.clear(); },
  };
}
const fill = (S, k, len) => S.m.set(k, 'x'.repeat(Math.max(0, len - k.length)));   // (a key of exactly len characters with its value, quota or not)

// 1. a plain save; no store at all
{
  const S = makeStore(1000); Shramba.use(S);
  check('a save that fits: kept, true', Shramba.keep('tdgp-career', '{"money":1}') === true && S.getItem('tdgp-career') === '{"money":1}');
  Shramba.use(null);
  check('no storage (Node without localStorage): false, no error', Shramba.keep('tdgp-career', 'x') === false && Shramba.usage().used === 0);
}

// 2. a full store: the ghosts make room, in order, only as many as needed
{
  const Q = 2000000, S = makeStore(Q); Shramba.use(S);
  let told = [];
  Shramba.set({ phys: () => 'cs', onFreed: (k) => told.push(k) });
  fill(S, 'tdgp-pklegend-c4-taifun', 300000);
  fill(S, 'tdgp-fghost-spa', 200000);
  fill(S, 'tdgp-ghost-spa@nova', 400000);
  fill(S, 'tdgp-ghost-vrsic@cs', 500000);
  fill(S, 'tdgp-ghost-spa@cs', 100000);
  fill(S, 'tdgp-records', 50000);
  S.m.set('tdgp-career', '{"money":10000}');
  S.m.set('rra-misije', '{"06":{"stars":3}}');
  fill(S, 'zz-other-page', Q - S.used());   // (another page's key: the store full to the last character)
  check('the store is full to the last character', S.used() === Q, String(S.used()));
  const order = Shramba.victims('tdgp-career');
  check('the order the ghosts give way: the legend, the friend\'s, the other physics\' own, then the own largest first', J(order) === J(['tdgp-pklegend-c4-taifun', 'tdgp-fghost-spa', 'tdgp-ghost-spa@nova', 'tdgp-ghost-vrsic@cs', 'tdgp-ghost-spa@cs']), J(order));
  const ok1 = Shramba.keep('tdgp-career', J({ money: 12000, pad: 'y'.repeat(250000) }));
  check('a career save 250 000 characters longer: kept, only the legend dropped (one ghost was enough)', ok1 && S.removed.join() === 'tdgp-pklegend-c4-taifun' && J(told) === J([1]) && JSON.parse(S.getItem('tdgp-career')).money === 12000, J({ ok1, removed: S.removed, told }));
  const ok2 = Shramba.keep('tdgp-records', 'r'.repeat(600000));
  check('the records 550 000 longer: kept, the friend\'s ghost and the other physics\' own dropped (two), the player\'s own of this physics kept', ok2 && J(S.removed.slice(1)) === J(['tdgp-fghost-spa', 'tdgp-ghost-spa@nova']) && J(told) === J([1, 2]) && !!S.getItem('tdgp-ghost-vrsic@cs') && !!S.getItem('tdgp-ghost-spa@cs'), J({ ok2, removed: S.removed, told }));
  const before = S.used();
  const ok3 = Shramba.keep('tdgp-stats', 's'.repeat(1500000));
  check('a save that cannot fit even without the ghosts: false, every ghost tried (the rest dropped), the progress and the other page\'s key untouched', ok3 === false && S.getItem('tdgp-stats') === null && !S.getItem('tdgp-ghost-vrsic@cs') && !S.getItem('tdgp-ghost-spa@cs')
    && S.getItem('tdgp-records').length === 600000 && JSON.parse(S.getItem('tdgp-career')).money === 12000 && S.getItem('rra-misije') === '{"06":{"stars":3}}' && S.getItem('zz-other-page') !== null && J(told) === J([1, 2, 2]),
  J({ ok3, removed: S.removed, told, before, after: S.used() }));
  check('Shramba.state.freed: every ghost dropped this visit (5)', Shramba.state.freed === 5, String(Shramba.state.freed));
  Shramba.set({ onFreed: null });
}

// 3. the key being saved never makes room for itself; the physics unknown (the game's physOf not ready): the order without that group
{
  const S = makeStore(700000); Shramba.use(S); Shramba.set({ phys: () => { throw new Error('not yet'); } });
  fill(S, 'tdgp-ghost-spa@cs', 300000); fill(S, 'tdgp-ghost-spa@nova', 200000); fill(S, 'tdgp-fghost-vrsic', 100000);
  const v = Shramba.victims('tdgp-ghost-spa@cs');
  check('a ghost saved: never its own victim; the physics unknown: friend first, then the own by size', J(v) === J(['tdgp-fghost-vrsic', 'tdgp-ghost-spa@nova']), J(v));
  fill(S, 'zz-fill', 700000 - S.used());
  const ok = Shramba.keep('tdgp-ghost-spa@cs', 'g'.repeat(350000));
  check('a new best ghost 50 000 longer in a full store: kept, the friend\'s ghost made room', ok && S.removed.join() === 'tdgp-fghost-vrsic' && S.getItem('tdgp-ghost-spa@cs').length === 350000, J(S.removed));
  Shramba.set({ phys: () => 'cs' });
}

// 4. another error (a browser that forbids the storage): nothing dropped
{
  const S = makeStore(1e6, { deny: true }); Shramba.use(S); fill(S, 'tdgp-ghost-spa@cs', 1000);
  check('a SecurityError: false, no ghost dropped', Shramba.keep('tdgp-career', 'x') === false && !S.removed.length);
}

// 5. how full: the characters of keys and values against the quota
{
  const S = makeStore(Shramba.QUOTA); Shramba.use(S); fill(S, 'tdgp-records', 524288);
  const u = Shramba.usage();
  check('usage: 524 288 characters of 5 242 880 = 10 %', u.used === 524288 && u.quota === 5242880 && Math.round(u.share * 100) === 10, J(u));
}

// 6. the reminder: from the fifth race, a month after the last file, a week after Ne zdaj
{
  const S = makeStore(1e6); Shramba.use(S);
  const t0 = Date.UTC(2026, 10, 1, 12), D = 864e5;
  check('4 races: no reminder; 5 races, never a file: the reminder', Shramba.due(4, t0) === false && Shramba.due(5, t0) === true && Shramba.days(t0) === null);
  Shramba.later(t0);
  check('Ne zdaj: not for a week (6 days no, 7 days yes)', Shramba.due(9, t0 + 6 * D) === false && Shramba.due(9, t0 + 7 * D) === true, S.getItem(Shramba.KEY));
  Shramba.exported(t0 + 8 * D);
  const o = JSON.parse(S.getItem(Shramba.KEY));
  check('a file saved: noted (izvoz), Ne zdaj forgotten; no reminder for 29 days, again on the 30th; days since the file', o.izvoz === t0 + 8 * D && !('odlog' in o) && Shramba.due(50, t0 + 37 * D) === false && Shramba.due(50, t0 + 38 * D) === true && Shramba.days(t0 + 18 * D) === 10, J(o));
  S.m.set(Shramba.KEY, 'not json');
  check('a broken note: as if nothing was noted (the reminder from the fifth race)', Shramba.due(5, t0) === true && Shramba.days(t0) === null);
}

// 7. a copy's contents and numbers
{
  const S = makeStore(1e7); Shramba.use(S);
  S.m.set('tdgp-settings', '{"name":"Ana"}'); S.m.set('tdgp-stats', J({ v: 1, races: 12, tt: 3, km: 101.6 })); S.m.set('tdgp-career', J({ on: true, money: 23400 }));
  S.m.set('tdgp-records', '{}'); S.m.set('tdgp-noadapt', '1'); S.m.set(Shramba.KEY, '{"izvoz":1}'); S.m.set('tdgp-ghost-spa@cs', 'G'); S.m.set('tdgp-fghost-spa', 'F'); S.m.set('tdgp-pklegend-c1', 'L');
  S.m.set('rra-misije', '{"06":{}}'); S.m.set('apex-garage', '{}');
  const c = Shramba.collect(), sum = Shramba.summary(c.data);
  check('a copy: the progress keys only (no ghosts, not tdgp-noadapt, not the module\'s note, not other pages\' keys), the missions\' records beside', J(Object.keys(c.data).sort()) === J(['tdgp-career', 'tdgp-records', 'tdgp-settings', 'tdgp-stats']) && J(c.extra) === J({ 'rra-misije': '{"06":{}}' }), J(c));
  check('its numbers: 12 races, 3 time trials, 102 km, 23 400 € (the career on)', J(sum) === J({ races: 12, tt: 3, km: 102, money: 23400 }), J(sum));
  check('the career off or missing: no money', Shramba.summary({ 'tdgp-career': J({ on: false, money: 5 }) }).money === null && Shramba.summary({}).money === null && Shramba.summary({ 'tdgp-stats': 'broken' }).races === 0);
  check('the profile file\'s extra: the missions\' records', J(Shramba.extras()) === J({ 'rra-misije': '{"06":{}}' }));
}

// 8. a copy put back
{
  const S = makeStore(1e7); Shramba.use(S);
  const rec = { data: { 'tdgp-settings': '{"name":"Ana"}', 'tdgp-stats': '{"races":12}' }, extra: {} };
  S.m.set('tdgp-settings', '{"name":"Bor"}'); S.m.set('tdgp-stats', '{"races":40}'); S.m.set('tdgp-champ', '{"id":"legende"}'); S.m.set('tdgp-ghost-spa@cs', 'G'); S.m.set('tdgp-noadapt', '1'); S.m.set('rra-misije', '{"06":{}}'); S.m.set('zz', 'other');
  const ok = Shramba.apply(rec);
  check('put back: its keys as they were, the championship it did not have removed, the missions\' records it did not have removed; the ghost, tdgp-noadapt and other keys untouched',
    ok && S.getItem('tdgp-settings') === '{"name":"Ana"}' && S.getItem('tdgp-stats') === '{"races":12}' && S.getItem('tdgp-champ') === null && S.getItem('rra-misije') === null && S.getItem('tdgp-ghost-spa@cs') === 'G' && S.getItem('tdgp-noadapt') === '1' && S.getItem('zz') === 'other',
    J([...S.m.keys()]));
  check('a copy with the missions\' records: they come back too', Shramba.apply({ data: {}, extra: { 'rra-misije': '{"30":{"stars":2}}' } }) && S.getItem('rra-misije') === '{"30":{"stars":2}}');
  check('a copy with keys that are not progress (a ghost, the device\'s own): those not written', Shramba.apply({ data: { 'tdgp-ghost-x@cs': 'NEW', 'tdgp-noadapt': '0', 'tdgp-stats': '{"races":1}', 'other': 'x' }, extra: {} }) && S.getItem('tdgp-ghost-x@cs') === null && S.getItem('tdgp-noadapt') === '1' && S.getItem('other') === null && S.getItem('tdgp-stats') === '{"races":1}');
  check('not a copy: false, nothing changed', Shramba.apply(null) === false && Shramba.apply({}) === false && S.getItem('tdgp-stats') === '{"races":1}');
  const T = makeStore(400); Shramba.use(T);
  T.m.set('tdgp-settings', '{"name":"Bor"}'); T.m.set('tdgp-stats', '{"races":40}');
  const okBig = Shramba.apply({ data: { 'tdgp-settings': 'x'.repeat(500) }, extra: {} });
  check('a copy that does not fit: false, the saved game as it was', okBig === false && T.getItem('tdgp-settings') === '{"name":"Bor"}' && T.getItem('tdgp-stats') === '{"races":40}', J([...T.m.entries()].map(([k, v]) => [k, v.length])));
}

// 9. the browser asked to keep the storage: once a visit
(async () => {
  let calls = 0;
  const fake = { persisted: async () => false, persist: async () => { calls++; return true; } };
  Shramba.use(makeStore(100)); Shramba.set({ storage: fake });
  const a = await Shramba.persist(), b = await Shramba.persist();
  check('persist: asked once (twice called), the answer kept (state.persisted)', a === true && b === true && calls === 1 && Shramba.state.persisted === true, J({ a, b, calls }));
  Shramba.use(makeStore(100)); calls = 0;
  Shramba.set({ storage: { persisted: async () => true, persist: async () => { calls++; return true; } } });
  check('already kept: not asked again', (await Shramba.persist()) === true && calls === 0);
  Shramba.use(makeStore(100)); Shramba.set({ storage: { persisted: async () => false } });
  check('persisted() only reads; a browser without persist: false, no error', (await Shramba.persisted()) === false && (await Shramba.persist()) === false);
  Shramba.use(makeStore(100)); Shramba.set({ storage: { persisted: async () => { throw new Error('x'); }, persist: async () => true } });
  check('an error from the browser: false, no error', (await Shramba.persist()) === false);
  Shramba.set({ storage: null }); Shramba.use(null);
  console.log(bad ? `FAIL: ${bad} of ${n} checks` : `${n}/${n} checks passed`);
  process.exitCode = bad ? 1 : 0;
})();
